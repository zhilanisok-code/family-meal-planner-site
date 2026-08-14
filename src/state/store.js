import { RECIPES } from "../data/recipes.js";
import { DEFAULT_PROFILE } from "../data/profile.js";
import { SEED_PLAN } from "../data/seed-plan.js";
import { isWeekday, weekDates, weekStart as calendarWeekStart } from "../domain/calendar.js";
import { buildShoppingList, swapMeal } from "../domain/planner.js";
import { compatibleRecipesForSlot, generateWeekDraft } from "../domain/scheduler.js";

export const STORAGE_KEY = "public-demo-meal-planner:v2";
export const LEGACY_STORAGE_KEY = "public-demo-meal-planner:v1";

const ROUTES = new Set(["tomorrow", "week", "shopping", "recipes", "settings"]);
const WEEK_MODES = new Set(["week", "month"]);
const recipeIds = new Set(RECIPES.map(({ id }) => id));

const SOURCE_VALUES = new Set(["seed", "generated", "manual"]);
const SLOT_FIELDS = ["id", "date", "mealType", "recipeId", "servings", "outside", "workMeal", "audience", "source"];
const NO_SAVE_NOTICE = "浏览器未保存本次演示调整，当前页面仍可继续使用。";
const STORAGE_PROBE_KEY = `${STORAGE_KEY}:availability`;

const clonePlanWithSlots = (plan, source = "seed") => {
  const weeks = plan.weeks.map((week) => ({
    ...week,
    prepTasks: week.prepTasks.map((task) => ({ ...task })),
    slots: week.slots.map((slot) => ({ ...slot, source: slot.source ?? source })),
  }));
  return {
    ...plan,
    weeks,
    slots: weeks.flatMap((week) => week.slots.map((slot) => ({ ...slot }))),
  };
};

const createSeedState = () => ({
  schemaVersion: 2,
  householdId: "public-demo",
  profile: structuredClone(DEFAULT_PROFILE),
  route: "tomorrow",
  weekMode: "week",
  selectedWeek: SEED_PLAN.weeks[0].id,
  selectedDate: SEED_PLAN.weeks[0].slots[0].date,
  plan: clonePlanWithSlots(SEED_PLAN),
  completedPrepTaskIds: [],
  purchasedIngredientIds: [],
  storeFilter: "all",
  recipeScenario: "all",
  recipeSearch: "",
  activeRecipeId: null,
  recipeActionMessage: "",
  recipeFocusKey: null,
  recipeAssignmentTarget: null,
  previewServings: 2,
  activeSwapSlotId: null,
  swapFocusKey: null,
  swapReason: "换个口味",
  selectedSwapRecipeId: null,
  prototypeMenuOpen: false,
  storageNotice: "",
  lastShoppingDelta: null,
});

const hasSlot = (plan, slotId) => plan.weeks.some((week) => week.slots.some((slot) => slot.id === slotId));

const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");

const isIsoCalendarDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isSlot = (slot, requireSource = false) => (
  slot
  && typeof slot === "object"
  && typeof slot.id === "string" && slot.id
  && isIsoCalendarDate(slot.date)
  && typeof slot.mealType === "string"
  && (typeof slot.recipeId === "string" || slot.recipeId === null)
  && Number.isFinite(slot.servings)
  && typeof slot.outside === "boolean"
  && typeof slot.workMeal === "boolean"
  && typeof slot.audience === "string"
  && (!requireSource || SOURCE_VALUES.has(slot.source))
);

const isRecipeAssignmentTarget = (target) => (
  target
  && typeof target === "object"
  && isIsoCalendarDate(target.date)
  && (!target.workMeal || isWeekday(target.date))
  && (
    (target.workMeal === true && (target.mealType === "lunch" || target.mealType === "dinner"))
    || (target.workMeal === false && target.mealType === "family")
  )
);

const slotMatchesTarget = (slot, target) => (
  slot?.date === target.date
  && (target.workMeal
    ? slot.workMeal && slot.mealType === target.mealType
    : !slot.workMeal && (slot.mealType === "dinner" || slot.mealType === "family"))
);

const hasUniqueWeeklySlotIds = (plan) => {
  if (!plan || !Array.isArray(plan.weeks)) return false;
  const ids = [];
  for (const week of plan.weeks) {
    if (!Array.isArray(week?.slots)) return false;
    for (const slot of week.slots) {
      if (typeof slot?.id !== "string" || !slot.id) return false;
      ids.push(slot.id);
    }
  }
  return new Set(ids).size === ids.length;
};

const hasUniqueNaturalWeekOwnership = (plan) => {
  if (!plan || !Array.isArray(plan.weeks)) return false;
  const weekStarts = [];
  for (const week of plan.weeks) {
    if (!Array.isArray(week?.slots) || week.slots.length === 0) return false;
    const starts = new Set(week.slots.map((slot) => calendarWeekStart(slot?.date)));
    if (starts.size !== 1 || starts.has(null)) return false;
    weekStarts.push(starts.values().next().value);
  }
  return new Set(weekStarts).size === weekStarts.length;
};

const isLegacyPlan = (plan) => (
  plan
  && typeof plan === "object"
  && typeof plan.month === "string"
  && Array.isArray(plan.weeks)
  && plan.weeks.every((week) => (
    week
    && typeof week === "object"
    && typeof week.id === "string" && week.id
    && typeof week.label === "string"
    && Array.isArray(week.prepTasks)
    && week.prepTasks.every((task) => task && isIsoCalendarDate(task.forDate) && typeof task.task === "string")
    && Array.isArray(week.slots)
    && week.slots.every((slot) => isSlot(slot))
  ))
);

const isV2Plan = (plan) => {
  if (!isLegacyPlan(plan) || !Array.isArray(plan.slots) || !plan.slots.every((slot) => isSlot(slot, true))) return false;
  const weekIds = new Set(plan.weeks.map((week) => week.id));
  if (weekIds.size !== plan.weeks.length) return false;
  if (!hasUniqueWeeklySlotIds(plan) || !hasUniqueNaturalWeekOwnership(plan)) return false;
  const weeklySlots = plan.weeks.flatMap((week) => week.slots);
  return plan.slots.length === weeklySlots.length && plan.slots.every((slot, index) => (
    SLOT_FIELDS.every((field) => slot[field] === weeklySlots[index][field])
  ));
};

const isMember = (member) => (
  member
  && typeof member === "object"
  && typeof member.id === "string" && member.id
  && typeof member.label === "string" && member.label
  && typeof member.role === "string" && member.role
  && Number.isFinite(member.defaultServings) && member.defaultServings >= 1
);

const uniqueStrings = (value) => (
  isStringArray(value) ? [...new Set(value.filter(Boolean))] : null
);

export function normalizeProfile(profile) {
  const normalized = structuredClone(DEFAULT_PROFILE);
  if (!profile || typeof profile !== "object") return normalized;

  if (Array.isArray(profile.members) && profile.members.length && profile.members.every(isMember)) {
    normalized.members = profile.members.map((member) => ({ ...member }));
  }

  const preferences = profile.preferences;
  if (!preferences || typeof preferences !== "object") return normalized;
  const avoidIngredientIds = uniqueStrings(preferences.avoidIngredientIds);
  const stores = uniqueStrings(preferences.stores);
  if (avoidIngredientIds) normalized.preferences.avoidIngredientIds = avoidIngredientIds;
  if (typeof preferences.workdayLunch === "boolean") normalized.preferences.workdayLunch = preferences.workdayLunch;
  if (typeof preferences.workdayDinner === "boolean") normalized.preferences.workdayDinner = preferences.workdayDinner;
  if (stores) normalized.preferences.stores = stores;
  return normalized;
}

const isPersistedStateCore = (state, planValidator) => (
  state
  && typeof state === "object"
  && ROUTES.has(state.route)
  && WEEK_MODES.has(state.weekMode)
  && typeof state.selectedWeek === "string"
  && isIsoCalendarDate(state.selectedDate)
  && planValidator(state.plan)
  && state.plan.weeks.some((week) => week.id === state.selectedWeek)
  && isStringArray(state.completedPrepTaskIds)
  && isStringArray(state.purchasedIngredientIds)
  && typeof state.storeFilter === "string"
  && typeof state.recipeScenario === "string"
  && typeof state.recipeSearch === "string"
  && (state.activeRecipeId === null || recipeIds.has(state.activeRecipeId))
  && typeof state.recipeActionMessage === "string"
  && (state.recipeFocusKey === null || (typeof state.recipeFocusKey === "string" && state.recipeFocusKey))
  && Number.isFinite(state.previewServings)
  && state.previewServings >= 1
  && (state.activeSwapSlotId === null || hasSlot(state.plan, state.activeSwapSlotId))
  && (state.swapFocusKey === null || (typeof state.swapFocusKey === "string" && state.swapFocusKey))
  && typeof state.swapReason === "string"
  && (state.selectedSwapRecipeId === null || recipeIds.has(state.selectedSwapRecipeId))
  && typeof state.prototypeMenuOpen === "boolean"
  && typeof state.storageNotice === "string"
  && (
    state.lastShoppingDelta === null
    || (
      typeof state.lastShoppingDelta === "object"
      && isStringArray(state.lastShoppingDelta.addedIds)
      && isStringArray(state.lastShoppingDelta.removedIds)
    )
  )
);

const isLegacyPersistedState = (state) => isPersistedStateCore(state, isLegacyPlan);

const isV2PersistedState = (state) => (
  isPersistedStateCore(state, isV2Plan)
  && state.schemaVersion === 2
  && state.householdId === "public-demo"
  && profileIsValid(state.profile)
);

function profileIsValid(profile) {
  return (
    profile
    && typeof profile === "object"
    && Array.isArray(profile.members)
    && profile.members.length > 0
    && profile.members.every(isMember)
    && profile.preferences
    && typeof profile.preferences === "object"
    && isStringArray(profile.preferences.avoidIngredientIds)
    && typeof profile.preferences.workdayLunch === "boolean"
    && typeof profile.preferences.workdayDinner === "boolean"
    && isStringArray(profile.preferences.stores)
  );
}

const normalizePersistedState = (state) => {
  if (!state || typeof state !== "object") return state;
  return {
    ...state,
    recipeActionMessage: Object.hasOwn(state, "recipeActionMessage") ? state.recipeActionMessage : "",
    recipeFocusKey: Object.hasOwn(state, "recipeFocusKey") ? state.recipeFocusKey : null,
    recipeAssignmentTarget: null,
    swapFocusKey: Object.hasOwn(state, "swapFocusKey") ? state.swapFocusKey : null,
    selectedSwapRecipeId: Object.hasOwn(state, "selectedSwapRecipeId") ? state.selectedSwapRecipeId : null,
    prototypeMenuOpen: Object.hasOwn(state, "prototypeMenuOpen") ? state.prototypeMenuOpen : false,
    storageNotice: Object.hasOwn(state, "storageNotice") ? state.storageNotice : "",
  };
};

const toggleId = (ids, id) => (
  ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id]
);

const shoppingIds = (plan) => new Set(
  buildShoppingList(plan, RECIPES).map(({ id, unit }) => `${id}::${unit}`),
);

const buildShoppingDelta = (beforePlan, afterPlan) => {
  const before = shoppingIds(beforePlan);
  const after = shoppingIds(afterPlan);
  return {
    addedIds: [...after].filter((id) => !before.has(id)).sort(),
    removedIds: [...before].filter((id) => !after.has(id)).sort(),
  };
};

const generatedWeekLabel = (targetWeekStart) => {
  const dates = weekDates(targetWeekStart);
  const first = new Date(`${dates[0].iso}T00:00:00Z`);
  const last = new Date(`${dates.at(-1).iso}T00:00:00Z`);
  return `${first.getUTCMonth() + 1}月${first.getUTCDate()}日–${last.getUTCMonth() + 1}月${last.getUTCDate()}日`;
};

function applyGeneratedDraft(plan, generationDraft) {
  const dates = weekDates(generationDraft.weekStart).map(({ iso }) => iso);
  const targetDates = new Set(dates);
  const generatedWeekdayDates = new Set(dates.slice(0, 5));
  const draftById = new Map(generationDraft.slots.map((slot) => [slot.id, slot]));
  let selectedWeek = null;

  const isManagedGeneratedSlot = (slot) => (
    slot.source === "generated"
    && generatedWeekdayDates.has(slot.date)
    && ((slot.workMeal && (slot.mealType === "lunch" || slot.mealType === "dinner"))
      || (!slot.workMeal && (slot.mealType === "dinner" || slot.mealType === "family")))
  );

  const weeks = plan.weeks.map((week) => {
    if (selectedWeek || !week.slots.some((slot) => targetDates.has(slot.date))) return week;
    selectedWeek = week.id;
    const consumedIds = new Set();
    const slots = week.slots.filter((slot) => (
      draftById.has(slot.id) || !isManagedGeneratedSlot(slot)
    )).map((slot) => {
      const replacement = draftById.get(slot.id);
      if (!replacement) return { ...slot };
      consumedIds.add(slot.id);
      return slot.source === "manual" ? { ...slot } : { ...replacement };
    });
    for (const draftSlot of generationDraft.slots) {
      if (!consumedIds.has(draftSlot.id)) slots.push({ ...draftSlot });
    }
    return {
      ...week,
      prepTasks: week.prepTasks.map((task) => ({ ...task })),
      slots: slots.sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id)),
    };
  });

  if (!selectedWeek) {
    selectedWeek = `generated:${generationDraft.weekStart}`;
    weeks.push({
      id: selectedWeek,
      label: generatedWeekLabel(generationDraft.weekStart),
      slots: generationDraft.slots.map((slot) => ({ ...slot })),
      prepTasks: [],
    });
  }

  return {
    selectedWeek,
    plan: {
      ...plan,
      weeks,
      slots: weeks.flatMap((week) => week.slots.map((slot) => ({ ...slot }))),
    },
  };
}

function upsertMealSlot(plan, { target, recipeId, servings }) {
  const targetWeekStart = calendarWeekStart(target.date);
  const occupiedIds = new Set(plan.weeks.flatMap((week) => week.slots.map((slot) => slot.id)));
  const uniqueId = () => {
    if (target.workMeal && target.mealType === "lunch") {
      const lunchBase = `${target.date}-lunch`;
      if (!occupiedIds.has(lunchBase)) return lunchBase;
      const adultBase = `${target.date}-adult-lunch`;
      if (!occupiedIds.has(adultBase)) return adultBase;
      let suffix = 2;
      while (occupiedIds.has(`${adultBase}-${suffix}`)) suffix += 1;
      return `${adultBase}-${suffix}`;
    }
    const base = target.workMeal
      ? `${target.date}-dinner-adult`
      : `${target.date}-family`;
    if (!occupiedIds.has(base)) return base;
    let suffix = 2;
    while (occupiedIds.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
  };
  const existingSlot = plan.weeks.flatMap((week) => week.slots).find((slot) => slotMatchesTarget(slot, target));
  const targetWeekIndex = plan.weeks.findIndex((week) => week.slots.some((slot) => calendarWeekStart(slot.date) === targetWeekStart));
  const occupiedWeekIds = new Set(plan.weeks.map((week) => week.id));
  const uniqueGeneratedWeekId = () => {
    const base = `generated:${targetWeekStart}`;
    if (!occupiedWeekIds.has(base)) return base;
    let suffix = 2;
    while (occupiedWeekIds.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
  };
  const nextSlot = existingSlot
    ? { ...existingSlot, recipeId, servings, outside: false, source: "manual" }
    : {
      id: uniqueId(),
      date: target.date,
      mealType: target.mealType,
      recipeId,
      servings,
      outside: false,
      workMeal: target.workMeal,
      audience: target.workMeal ? "成人工作餐" : "全家家庭餐",
      source: "manual",
    };
  let retainedSlot = false;

  const weeks = plan.weeks.map((week, index) => {
    const slots = [];
    for (const slot of week.slots) {
      if (!slotMatchesTarget(slot, target)) {
        slots.push({ ...slot });
        continue;
      }
      if (!retainedSlot) {
        slots.push(nextSlot);
        retainedSlot = true;
      }
    }
    if (!existingSlot && index === targetWeekIndex) slots.push(nextSlot);
    return {
      ...week,
      prepTasks: week.prepTasks.map((task) => ({ ...task })),
      slots: slots.sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id)),
    };
  });

  if (!existingSlot && targetWeekIndex === -1) {
    weeks.push({
      id: uniqueGeneratedWeekId(),
      label: generatedWeekLabel(targetWeekStart),
      slots: [nextSlot],
      prepTasks: [],
    });
  }

  return {
    ...plan,
    weeks,
    slots: weeks.flatMap((week) => week.slots.map((slot) => ({ ...slot }))),
  };
}

const readStoredState = (storage, key) => {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    return normalizePersistedState(JSON.parse(raw));
  } catch {
    return null;
  }
};

const migrateLegacyState = (legacy) => ({
  ...legacy,
  schemaVersion: 2,
  householdId: "public-demo",
  profile: structuredClone(DEFAULT_PROFILE),
  plan: clonePlanWithSlots(legacy.plan),
});

const readInitialState = (storage) => {
  const persisted = readStoredState(storage, STORAGE_KEY);
  if (isV2PersistedState(persisted)) return { state: persisted, migrated: false };

  const legacy = readStoredState(storage, LEGACY_STORAGE_KEY);
  if (!isLegacyPersistedState(legacy)) return { state: createSeedState(), migrated: false };
  return { state: migrateLegacyState(legacy), migrated: true };
};

const storageIsAvailable = (storage) => {
  if (
    !storage
    || typeof storage.getItem !== "function"
    || typeof storage.setItem !== "function"
    || typeof storage.removeItem !== "function"
  ) return false;
  try {
    const previous = storage.getItem(STORAGE_PROBE_KEY);
    storage.setItem(STORAGE_PROBE_KEY, "1");
    const readable = storage.getItem(STORAGE_PROBE_KEY) === "1";
    if (previous === null) storage.removeItem(STORAGE_PROBE_KEY);
    else storage.setItem(STORAGE_PROBE_KEY, previous);
    return readable;
  } catch {
    try {
      storage.removeItem(STORAGE_PROBE_KEY);
    } catch {
      // The storage is already classified as unavailable.
    }
    return false;
  }
};

function reduce(state, action) {
  if (!action || typeof action.type !== "string") return state;

  switch (action.type) {
    case "NAVIGATE":
      return ROUTES.has(action.route)
        ? { ...state, route: action.route, prototypeMenuOpen: false, generationDraft: null, activeRecipeId: null, recipeAssignmentTarget: null }
        : state;
    case "SELECT_WEEK":
      return typeof action.weekId === "string" && action.weekId ? { ...state, selectedWeek: action.weekId } : state;
    case "SELECT_DATE":
      return typeof action.date === "string" && action.date ? { ...state, selectedDate: action.date } : state;
    case "SET_WEEK_MODE":
      return WEEK_MODES.has(action.mode) ? { ...state, weekMode: action.mode } : state;
    case "UPDATE_PROFILE":
      return action.profile && typeof action.profile === "object"
        ? { ...state, profile: normalizeProfile(action.profile) }
        : state;
    case "OPEN_GENERATION": {
      const targetWeekStart = calendarWeekStart(action.weekStart);
      if (!targetWeekStart) return state;
      return {
        ...state,
        generationDraft: {
          weekStart: targetWeekStart,
          slots: generateWeekDraft({
            recipes: RECIPES,
            profile: state.profile,
            slots: state.plan.slots,
            weekStart: targetWeekStart,
          }),
        },
      };
    }
    case "CLOSE_GENERATION":
      return state.generationDraft ? { ...state, generationDraft: null } : state;
    case "REPLACE_GENERATION_SLOT": {
      const slot = state.generationDraft?.slots.find((item) => item.id === action.slotId);
      if (!slot || slot.source === "manual") return state;
      const compatibleIds = new Set(compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot }).map((recipe) => recipe.id));
      if (!compatibleIds.has(action.recipeId) || slot.recipeId === action.recipeId) return state;
      return {
        ...state,
        generationDraft: {
          ...state.generationDraft,
          slots: state.generationDraft.slots.map((item) => (
            item.id === slot.id ? { ...item, recipeId: action.recipeId } : item
          )),
        },
      };
    }
    case "APPLY_GENERATED_WEEK": {
      if (!state.generationDraft?.weekStart || !Array.isArray(state.generationDraft.slots) || state.generationDraft.slots.length === 0) return state;
      const applied = applyGeneratedDraft(state.plan, state.generationDraft);
      return {
        ...state,
        plan: applied.plan,
        route: "week",
        selectedWeek: applied.selectedWeek,
        selectedDate: state.generationDraft.weekStart,
        weekMode: "week",
        generationDraft: null,
        lastShoppingDelta: buildShoppingDelta(state.plan, applied.plan),
      };
    }
    case "TOGGLE_PREP_TASK":
      return typeof action.taskId === "string" && action.taskId
        ? { ...state, completedPrepTaskIds: toggleId(state.completedPrepTaskIds, action.taskId) }
        : state;
    case "SET_SERVINGS":
      return hasSlot(state.plan, action.slotId) && Number.isFinite(action.servings) && action.servings >= 1
        ? { ...state, plan: updateSlot(state.plan, action.slotId, { servings: action.servings }) }
        : state;
    case "MARK_OUTSIDE":
      return hasSlot(state.plan, action.slotId) && typeof action.outside === "boolean"
        ? { ...state, plan: updateSlot(state.plan, action.slotId, { outside: action.outside }) }
        : state;
    case "OPEN_SWAP":
      return hasSlot(state.plan, action.slotId)
        ? {
          ...state,
          activeSwapSlotId: action.slotId,
          swapFocusKey: typeof action.focusKey === "string" && action.focusKey ? action.focusKey : null,
          selectedSwapRecipeId: null,
        }
        : state;
    case "CLOSE_SWAP":
      return { ...state, activeSwapSlotId: null, swapFocusKey: null, selectedSwapRecipeId: null };
    case "SET_SWAP_REASON":
      return typeof action.reason === "string"
        ? { ...state, swapReason: action.reason, selectedSwapRecipeId: null }
        : state;
    case "SET_SWAP_CANDIDATE":
      return recipeIds.has(action.recipeId) ? { ...state, selectedSwapRecipeId: action.recipeId } : state;
    case "SWAP_MEAL": {
      if (!hasSlot(state.plan, action.slotId) || !recipeIds.has(action.recipeId)) return state;
      const slot = state.plan.slots.find((item) => item.id === action.slotId);
      const compatibleIds = new Set(compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot }).map((recipe) => recipe.id));
      if (!compatibleIds.has(action.recipeId)) return state;
      const plan = updateSlot(swapMeal(state.plan, action.slotId, action.recipeId), action.slotId, {});
      return {
        ...state,
        plan,
        activeSwapSlotId: null,
        swapFocusKey: null,
        selectedSwapRecipeId: null,
        lastShoppingDelta: buildShoppingDelta(state.plan, plan),
      };
    }
    case "UPSERT_WORK_LUNCH": {
      if (!isIsoCalendarDate(action.date) || !isWeekday(action.date) || !recipeIds.has(action.recipeId) || !Number.isInteger(action.servings) || action.servings < 1 || !hasUniqueWeeklySlotIds(state.plan) || !hasUniqueNaturalWeekOwnership(state.plan)) return state;
      const target = { date: action.date, mealType: "lunch", workMeal: true };
      const compatibleIds = new Set(compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot: target }).map((recipe) => recipe.id));
      if (!compatibleIds.has(action.recipeId)) return state;
      const plan = upsertMealSlot(state.plan, { target, recipeId: action.recipeId, servings: action.servings });
      const activeSwapWasRemoved = state.activeSwapSlotId && !hasSlot(plan, state.activeSwapSlotId);
      return {
        ...state,
        plan,
        lastShoppingDelta: buildShoppingDelta(state.plan, plan),
        ...(activeSwapWasRemoved ? {
          activeSwapSlotId: null,
          swapFocusKey: null,
          selectedSwapRecipeId: null,
        } : {}),
      };
    }
    case "UPSERT_MEAL_SLOT": {
      if (!isRecipeAssignmentTarget(action.target) || !recipeIds.has(action.recipeId) || !Number.isInteger(action.servings) || action.servings < 1 || !hasUniqueWeeklySlotIds(state.plan) || !hasUniqueNaturalWeekOwnership(state.plan)) return state;
      const compatibleIds = new Set(compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot: action.target }).map((recipe) => recipe.id));
      if (!compatibleIds.has(action.recipeId)) return state;
      const plan = upsertMealSlot(state.plan, { target: action.target, recipeId: action.recipeId, servings: action.servings });
      const activeSwapWasRemoved = state.activeSwapSlotId && !hasSlot(plan, state.activeSwapSlotId);
      return {
        ...state,
        plan,
        lastShoppingDelta: buildShoppingDelta(state.plan, plan),
        ...(activeSwapWasRemoved ? {
          activeSwapSlotId: null,
          swapFocusKey: null,
          selectedSwapRecipeId: null,
        } : {}),
      };
    }
    case "TOGGLE_PURCHASED":
      return typeof action.ingredientKey === "string" && action.ingredientKey
        ? { ...state, purchasedIngredientIds: toggleId(state.purchasedIngredientIds, action.ingredientKey) }
        : state;
    case "SET_STORE_FILTER":
      return typeof action.filter === "string" ? { ...state, storeFilter: action.filter } : state;
    case "SET_RECIPE_SCENARIO":
      return typeof action.scenario === "string" ? { ...state, recipeScenario: action.scenario } : state;
    case "SET_RECIPE_SEARCH":
      return typeof action.query === "string" ? { ...state, recipeSearch: action.query } : state;
    case "START_RECIPE_ASSIGNMENT": {
      if (!isRecipeAssignmentTarget(action.target)) return state;
      const target = { ...action.target };
      const existing = state.plan.slots.find((slot) => slotMatchesTarget(slot, target));
      const role = target.workMeal ? "adult" : null;
      const defaultServings = state.profile.members
        .filter((member) => !role || member.role === role)
        .reduce((sum, member) => sum + member.defaultServings, 0) || (target.workMeal ? 2 : 4);
      const servings = Number.isInteger(existing?.servings) && existing.servings >= 1
        ? existing.servings
        : Math.min(8, Math.max(1, defaultServings));
      return {
        ...state,
        route: "recipes",
        activeRecipeId: null,
        recipeActionMessage: "",
        recipeAssignmentTarget: target,
        recipeScenario: "all",
        recipeSearch: "",
        previewServings: servings,
        prototypeMenuOpen: false,
      };
    }
    case "CANCEL_RECIPE_ASSIGNMENT":
      return state.recipeAssignmentTarget
        ? { ...state, route: "tomorrow", activeRecipeId: null, recipeActionMessage: "", recipeAssignmentTarget: null }
        : state;
    case "OPEN_RECIPE":
      return recipeIds.has(action.recipeId) ? { ...state, activeRecipeId: action.recipeId, recipeActionMessage: "" } : state;
    case "CLOSE_RECIPE":
      return { ...state, activeRecipeId: null, recipeActionMessage: "" };
    case "SET_RECIPE_ACTION_MESSAGE":
      return typeof action.message === "string" ? { ...state, recipeActionMessage: action.message } : state;
    case "SET_RECIPE_FOCUS_KEY":
      return action.focusKey === null || (typeof action.focusKey === "string" && action.focusKey)
        ? { ...state, recipeFocusKey: action.focusKey }
        : state;
    case "SET_RECIPE_PREVIEW_SERVINGS":
      return Number.isFinite(action.servings) && action.servings >= 1
        ? { ...state, previewServings: action.servings }
        : state;
    case "TOGGLE_PROTOTYPE_MENU":
      return { ...state, prototypeMenuOpen: !state.prototypeMenuOpen };
    default:
      return state;
  }
}

function updateSlot(plan, slotId, updates) {
  const weeks = plan.weeks.map((week) => ({
    ...week,
    prepTasks: week.prepTasks.map((task) => ({ ...task })),
    slots: week.slots.map((slot) => (
      slot.id === slotId ? { ...slot, ...updates, source: "manual" } : { ...slot }
    )),
  }));
  return {
    ...plan,
    weeks,
    slots: weeks.flatMap((week) => week.slots.map((slot) => ({ ...slot }))),
  };
}

export function selectShoppingList(state) {
  return buildShoppingList(state.plan, RECIPES);
}

export function createStore(storage) {
  const initial = readInitialState(storage);
  const storageAvailable = storageIsAvailable(storage);
  let state = storageAvailable ? initial.state : { ...initial.state, storageNotice: NO_SAVE_NOTICE };
  const listeners = new Set();

  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  const persist = () => {
    if (!storageAvailable) return false;
    try {
      const {
        generationDraft: _generationDraft,
        recipeAssignmentTarget: _recipeAssignmentTarget,
        ...persistedState
      } = state;
      storage?.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      return true;
    } catch {
      // Persistence is optional for the fixed local demo; state remains usable in memory.
      return false;
    }
  };

  if (initial.migrated && persist()) {
    try {
      storage?.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // The V2 copy is already stored; retaining the old value is safe.
    }
  } else if (initial.migrated) {
    state = {
      ...state,
      storageNotice: NO_SAVE_NOTICE,
    };
  }

  const resetDemo = () => {
    state = storageAvailable ? createSeedState() : { ...createSeedState(), storageNotice: NO_SAVE_NOTICE };
    try {
      storage?.removeItem(STORAGE_KEY);
      storage?.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // A storage failure must not prevent restoring the in-memory demo.
    }
    notify();
  };

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(action) {
      if (action?.type === "RESET_DEMO") {
        resetDemo();
        return state;
      }
      const nextState = reduce(state, action);
      if (nextState === state) return state;
      state = nextState;
      if (!persist()) {
        state = {
          ...state,
          storageNotice: NO_SAVE_NOTICE,
        };
      }
      notify();
      return state;
    },
    resetDemo,
  };
}
