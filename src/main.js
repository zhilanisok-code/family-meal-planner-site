import { createStore } from "./state/store.js";
import { RECIPES } from "./data/recipes.js";
import { addDays, isoToday, isWeekday, weekStart } from "./domain/calendar.js";
import { escapeHtml, renderBottomNav, renderTomorrowView, renderWeekView } from "./ui/components.js";
import { renderShoppingView } from "./ui/shopping-view.js";
import { renderRecipeDetail, renderRecipesView } from "./ui/recipes-view.js";
import { renderSwapDrawer } from "./ui/swap-drawer.js";
import { renderGenerationView } from "./ui/generation-view.js";
import { renderSettingsView } from "./ui/settings-view.js";

const ROUTES = new Set(["tomorrow", "week", "shopping", "recipes", "settings"]);

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

const store = createStore(getStorage());
const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

const defer = (callback) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(callback);
  else setTimeout(callback, 0);
};

function slotsMatch(left, right) {
  return left
    && right
    && Object.keys(left).length === Object.keys(right).length
    && Object.keys(left).every((key) => left[key] === right[key]);
}

function hasSafePlanForWorkLunch(plan) {
  if (!plan || !Array.isArray(plan.weeks) || !Array.isArray(plan.slots)) return false;
  const weeklySlots = [];
  const weekStarts = [];
  for (const week of plan.weeks) {
    if (!Array.isArray(week?.slots) || week.slots.length === 0) return false;
    const starts = new Set(week.slots.map((slot) => weekStart(slot?.date)));
    if (starts.size !== 1 || starts.has(null)) return false;
    weekStarts.push(starts.values().next().value);
    weeklySlots.push(...week.slots);
  }
  const ids = weeklySlots.map((slot) => slot?.id);
  return ids.every((id) => typeof id === "string" && id)
    && new Set(ids).size === ids.length
    && new Set(weekStarts).size === weekStarts.length
    && plan.slots.length === weeklySlots.length
    && weeklySlots.every((slot, index) => slotsMatch(slot, plan.slots[index]));
}

export function firstPlannedDate(week) {
  return [...(week?.slots ?? [])].map((slot) => slot.date).sort()[0] ?? null;
}

export function actionsForWeekSelection(state, weekId) {
  const week = state?.plan?.weeks?.find((item) => item.id === weekId);
  if (!week) return [];
  const actions = [{ type: "SELECT_WEEK", weekId }];
  const date = firstPlannedDate(week);
  if (date) actions.push({ type: "SELECT_DATE", date });
  actions.push({ type: "SET_WEEK_MODE", mode: "week" });
  return actions;
}

export function renderApp() {
  if (typeof document === "undefined") return;

  const app = document.querySelector("#app");
  const state = store.getState();
  if (!app) return;

  const view = state.generationDraft
    ? renderGenerationView(state)
    : state.activeRecipeId
      ? renderRecipeDetail(state, recipeById.get(state.activeRecipeId))
    : state.route === "tomorrow"
    ? renderTomorrowView(state)
    : state.route === "week"
      ? renderWeekView(state)
      : state.route === "shopping"
        ? renderShoppingView(state)
        : state.route === "settings"
          ? renderSettingsView(state)
        : renderRecipesView(state);

  app.innerHTML = `
    <section class="app-shell" aria-label="家庭食谱助手"${swapBackgroundAttributes(state)}>
      ${renderPrototypeMenu(state)}
      <div class="app-content">${view}</div>
      <nav class="bottom-nav" aria-label="主导航">${renderBottomNav(state.route)}</nav>
      ${renderStorageNotice(state)}
    </section>${renderSwapDrawer(state)}`;
}

export function renderStorageNotice(state) {
  return state?.storageNotice
    ? `<p class="storage-notice" role="status">${escapeHtml(state.storageNotice)}</p>`
    : "";
}

export function swapBackgroundAttributes(state) {
  return state?.activeSwapSlotId ? ' inert aria-hidden="true"' : "";
}

export function renderPrototypeMenu(state) {
  return `<div class="prototype-menu"><button type="button" data-toggle-prototype-menu aria-expanded="${Boolean(state.prototypeMenuOpen)}" aria-controls="prototype-menu-panel">更多</button>${state.prototypeMenuOpen ? `<div id="prototype-menu-panel" class="prototype-menu__panel"><p>本地家庭工具</p><button type="button" data-route="settings">家庭设置</button><button type="button" data-reset-demo>恢复样例数据</button></div>` : ""}</div>`;
}

function focusCurrentRoute() {
  document.querySelector('.bottom-nav__item[aria-current="page"]')?.focus({ preventScroll: true });
}

function focusView(view) {
  document.querySelector(`[data-view-focus="${view}"]`)?.focus({ preventScroll: true });
}

function focusGenerationTrigger(weekStart) {
  if (!weekStart) return;
  const selectorValue = weekStart.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  document.querySelector(`[data-open-generation="${selectorValue}"]`)?.focus({ preventScroll: true });
}

export function navigate(route, { restoreFocus = false } = {}) {
  if (!ROUTES.has(route)) return;
  store.dispatch({ type: "NAVIGATE", route });
  if (typeof document === "undefined") return;
  if (route === "settings") focusView("settings");
  else if (restoreFocus) focusCurrentRoute();
}

export function addActiveRecipeToTomorrow(targetStore = store, { today = isoToday() } = {}) {
  const state = targetStore.getState();
  const targetDate = addDays(today, 1);
  if (typeof targetDate !== "string" || !isWeekday(targetDate) || !hasSafePlanForWorkLunch(state?.plan)) return { changed: false, created: false, message: "" };
  const hasWorkLunch = state.plan.weeks.some((week) => week.slots.some((item) => (
    item.date === targetDate && item.workMeal && item.mealType === "lunch"
  )));
  if (!state.activeRecipeId || !Number.isInteger(state.previewServings) || state.previewServings < 1) {
    return { changed: false, created: false, message: "" };
  }
  targetStore.dispatch({
    type: "UPSERT_WORK_LUNCH",
    date: targetDate,
    recipeId: state.activeRecipeId,
    servings: state.previewServings,
  });
  const nextState = targetStore.getState();
  const targetLunches = Array.isArray(nextState?.plan?.weeks)
    ? nextState.plan.weeks.flatMap((week) => week.slots ?? []).filter((item) => (
      item.date === targetDate && item.workMeal && item.mealType === "lunch"
    ))
    : [];
  const targetLunch = targetLunches[0];
  const mirroredLunches = Array.isArray(nextState?.plan?.slots) && targetLunch
    ? nextState.plan.slots.filter((item) => item.id === targetLunch.id)
    : [];
  const mirrorsTarget = mirroredLunches.length === 1
    && slotsMatch(targetLunch, mirroredLunches[0]);
  const targetWeeks = Array.isArray(nextState?.plan?.weeks) && targetLunch
    ? nextState.plan.weeks.filter((week) => week.slots?.some((item) => item.id === targetLunch.id))
    : [];
  const targetWeek = targetWeeks[0];
  if (
    targetLunches.length !== 1
    || targetLunch.recipeId !== state.activeRecipeId
    || targetLunch.servings !== state.previewServings
    || targetLunch.outside !== false
    || targetLunch.source !== "manual"
    || !mirrorsTarget
    || targetWeeks.length !== 1
  ) return { changed: false, created: false, message: "" };
  targetStore.dispatch({ type: "SET_RECIPE_ACTION_MESSAGE", message: "" });
  targetStore.dispatch({ type: "SELECT_WEEK", weekId: targetWeek.id });
  targetStore.dispatch({ type: "SELECT_DATE", date: targetDate });
  targetStore.dispatch({ type: "SET_WEEK_MODE", mode: "week" });
  targetStore.dispatch({ type: "CLOSE_RECIPE" });
  targetStore.dispatch({ type: "NAVIGATE", route: "week" });
  return { changed: true, created: !hasWorkLunch, message: "" };
}

function slotMatchesRecipeAssignment(slot, target) {
  return slot?.date === target?.date
    && (target.workMeal
      ? slot.workMeal && slot.mealType === target.mealType
      : !slot.workMeal && (slot.mealType === "dinner" || slot.mealType === "family"));
}

export function assignActiveRecipeToTomorrowSlot(targetStore = store) {
  const state = targetStore.getState();
  const target = state.recipeAssignmentTarget;
  if (
    !target
    || !state.activeRecipeId
    || !Number.isInteger(state.previewServings)
    || state.previewServings < 1
    || !hasSafePlanForWorkLunch(state.plan)
  ) return { changed: false, created: false };

  const existed = state.plan.weeks.some((week) => week.slots.some((slot) => slotMatchesRecipeAssignment(slot, target)));
  targetStore.dispatch({
    type: "UPSERT_MEAL_SLOT",
    target,
    recipeId: state.activeRecipeId,
    servings: state.previewServings,
  });

  const nextState = targetStore.getState();
  const targetSlots = nextState.plan.weeks
    .flatMap((week) => week.slots)
    .filter((slot) => slotMatchesRecipeAssignment(slot, target));
  const targetSlot = targetSlots[0];
  const mirroredSlots = targetSlot
    ? nextState.plan.slots.filter((slot) => slot.id === targetSlot.id)
    : [];
  const targetWeeks = targetSlot
    ? nextState.plan.weeks.filter((week) => week.slots.some((slot) => slot.id === targetSlot.id))
    : [];
  if (
    targetSlots.length !== 1
    || targetSlot.recipeId !== state.activeRecipeId
    || targetSlot.servings !== state.previewServings
    || targetSlot.outside !== false
    || targetSlot.source !== "manual"
    || mirroredSlots.length !== 1
    || !slotsMatch(targetSlot, mirroredSlots[0])
    || targetWeeks.length !== 1
  ) return { changed: false, created: false };

  targetStore.dispatch({ type: "SELECT_WEEK", weekId: targetWeeks[0].id });
  targetStore.dispatch({ type: "SELECT_DATE", date: target.date });
  targetStore.dispatch({ type: "CANCEL_RECIPE_ASSIGNMENT" });
  return { changed: true, created: !existed };
}

export function findRecipeFocusTarget(root, focusKey) {
  if (!root || typeof root.querySelector !== "function" || typeof focusKey !== "string" || !focusKey) return null;
  const selectorValue = focusKey.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return root.querySelector(`[data-recipe-focus-key="${selectorValue}"]`);
}

export function findSwapFocusTarget(root, focusKey) {
  if (!root || typeof root.querySelector !== "function" || typeof focusKey !== "string" || !focusKey) return null;
  const selectorValue = focusKey.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return root.querySelector(`[data-swap-focus-key="${selectorValue}"]`);
}

function closeRecipe({ restoreFocus = true } = {}) {
  const focusKey = store.getState().recipeFocusKey;
  store.dispatch({ type: "CLOSE_RECIPE" });
  if (restoreFocus && focusKey && typeof document !== "undefined") {
    defer(() => findRecipeFocusTarget(document, focusKey)?.focus({ preventScroll: true }));
  }
}

export function closeSwap(targetStore = store, { restoreFocus = true } = {}) {
  const focusKey = targetStore.getState().swapFocusKey;
  targetStore.dispatch({ type: "CLOSE_SWAP" });
  if (restoreFocus && focusKey && typeof document !== "undefined") {
    defer(() => findSwapFocusTarget(document, focusKey)?.focus({ preventScroll: true }));
  }
}

export function confirmSwap(targetStore = store) {
  const state = targetStore.getState();
  if (!state.activeSwapSlotId || !state.selectedSwapRecipeId) return false;
  const focusKey = state.swapFocusKey;
  targetStore.dispatch({ type: "SWAP_MEAL", slotId: state.activeSwapSlotId, recipeId: state.selectedSwapRecipeId });
  if (focusKey && typeof document !== "undefined") {
    defer(() => findSwapFocusTarget(document, focusKey)?.focus({ preventScroll: true }));
  }
  return true;
}

export function closeSwapOnEscape(event, targetStore = store) {
  if (event?.key !== "Escape" || !targetStore.getState().activeSwapSlotId) return false;
  event.preventDefault?.();
  closeSwap(targetStore);
  return true;
}

export function trapSwapFocus(event, root = typeof document !== "undefined" ? document : null) {
  if (event?.key !== "Tab" || !root?.querySelector) return false;
  const dialog = root.querySelector('[role="dialog"][aria-modal="true"]');
  if (!dialog?.querySelectorAll) return false;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden);
  if (!focusable.length) return false;
  const first = focusable[0];
  const last = focusable.at(-1);
  const active = root.activeElement;
  const outsideDialog = !focusable.includes(active);
  const wrapsBackward = event.shiftKey && active === first;
  const wrapsForward = !event.shiftKey && active === last;
  if (!outsideDialog && !wrapsBackward && !wrapsForward) return false;
  event.preventDefault?.();
  (wrapsBackward ? last : first).focus?.({ preventScroll: true });
  return true;
}

function focusSwapTitle() {
  if (typeof document !== "undefined") defer(() => document.querySelector("[data-swap-title]")?.focus({ preventScroll: true }));
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-route]");
    if (target) {
      navigate(target.dataset.route, { restoreFocus: event.detail === 0 });
      return;
    }

    const generationTarget = event.target.closest("[data-open-generation]");
    if (generationTarget) {
      store.dispatch({ type: "OPEN_GENERATION", weekStart: generationTarget.dataset.openGeneration });
      focusView("generation");
      return;
    }
    if (event.target.closest("[data-close-generation]")) {
      const weekStart = store.getState().generationDraft?.weekStart;
      store.dispatch({ type: "CLOSE_GENERATION" });
      focusGenerationTrigger(weekStart);
      return;
    }
    if (event.target.closest("[data-apply-generated-week]")) {
      const weekStart = store.getState().generationDraft?.weekStart;
      store.dispatch({ type: "APPLY_GENERATED_WEEK" });
      focusGenerationTrigger(weekStart);
      return;
    }

    const modeTarget = event.target.closest("[data-week-mode]");
    if (modeTarget) {
      if (modeTarget.dataset.weekId) {
        actionsForWeekSelection(store.getState(), modeTarget.dataset.weekId).forEach((action) => store.dispatch(action));
        return;
      }
      store.dispatch({ type: "SET_WEEK_MODE", mode: modeTarget.dataset.weekMode });
      return;
    }
    const dateTarget = event.target.closest("[data-date]");
    if (dateTarget) return store.dispatch({ type: "SELECT_DATE", date: dateTarget.dataset.date });
    const mealPlanTarget = event.target.closest("[data-plan-tomorrow-meal]");
    if (mealPlanTarget) {
      return store.dispatch({
        type: "START_RECIPE_ASSIGNMENT",
        target: {
          date: mealPlanTarget.dataset.targetDate,
          mealType: mealPlanTarget.dataset.targetMealType,
          workMeal: mealPlanTarget.dataset.targetWorkMeal === "true",
        },
      });
    }
    const servingTarget = event.target.closest("[data-serving-delta]");
    if (servingTarget) {
      const slot = store.getState().plan.weeks.flatMap((week) => week.slots).find((item) => item.id === servingTarget.dataset.slotId);
      if (slot) store.dispatch({ type: "SET_SERVINGS", slotId: slot.id, servings: Math.max(1, slot.servings + Number(servingTarget.dataset.servingDelta)) });
      return;
    }
    const recipeTarget = event.target.closest("[data-open-recipe]");
    if (recipeTarget) {
      store.dispatch({ type: "SET_RECIPE_FOCUS_KEY", focusKey: recipeTarget.dataset.recipeFocusKey ?? null });
      return store.dispatch({ type: "OPEN_RECIPE", recipeId: recipeTarget.dataset.openRecipe });
    }
    if (event.target.closest("[data-close-recipe]")) return closeRecipe();
    if (event.target.closest("[data-cancel-recipe-assignment]")) return store.dispatch({ type: "CANCEL_RECIPE_ASSIGNMENT" });
    if (event.target.closest("[data-toggle-prototype-menu]")) return store.dispatch({ type: "TOGGLE_PROTOTYPE_MENU" });
    if (event.target.closest("[data-reset-demo]")) return store.dispatch({ type: "RESET_DEMO" });
    if (event.target.closest("[data-close-swap]")) return closeSwap();
    if (event.target.matches?.("[data-close-swap-backdrop]")) return closeSwap();
    const swapReason = event.target.closest("[data-swap-reason]");
    if (swapReason) return store.dispatch({ type: "SET_SWAP_REASON", reason: swapReason.dataset.swapReason });
    const swapCandidate = event.target.closest("[data-select-swap]");
    if (swapCandidate) return store.dispatch({ type: "SET_SWAP_CANDIDATE", recipeId: swapCandidate.dataset.selectSwap });
    if (event.target.closest("[data-confirm-swap]")) return confirmSwap();
    const shoppingFilter = event.target.closest("[data-shopping-filter]");
    if (shoppingFilter) return store.dispatch({ type: "SET_STORE_FILTER", filter: shoppingFilter.dataset.shoppingFilter });
    const scenario = event.target.closest("[data-recipe-scenario]");
    if (scenario) return store.dispatch({ type: "SET_RECIPE_SCENARIO", scenario: scenario.dataset.recipeScenario });
    if (event.target.closest("[data-clear-recipe-filter]")) {
      store.dispatch({ type: "SET_RECIPE_SCENARIO", scenario: "all" });
      return store.dispatch({ type: "SET_RECIPE_SEARCH", query: "" });
    }
    const previewServing = event.target.closest("[data-preview-serving-delta]");
    if (previewServing) {
      const next = Math.min(8, Math.max(1, store.getState().previewServings + Number(previewServing.dataset.previewServingDelta)));
      return store.dispatch({ type: "SET_RECIPE_PREVIEW_SERVINGS", servings: next });
    }
    if (event.target.closest("[data-add-recipe]")) {
      if (store.getState().recipeAssignmentTarget) assignActiveRecipeToTomorrowSlot();
      else addActiveRecipeToTomorrow();
      return;
    }
    const swapTarget = event.target.closest("[data-open-swap]");
    if (swapTarget) {
      store.dispatch({ type: "OPEN_SWAP", slotId: swapTarget.dataset.openSwap, focusKey: swapTarget.dataset.swapFocusKey ?? null });
      focusSwapTitle();
    }
  });

  document.addEventListener("change", (event) => {
    const generationRecipe = event.target.closest?.("[data-generation-recipe]");
    if (generationRecipe) {
      return store.dispatch({
        type: "REPLACE_GENERATION_SLOT",
        slotId: generationRecipe.dataset.generationRecipe,
        recipeId: generationRecipe.value,
      });
    }
    const avoidedIngredient = event.target.closest?.("[data-avoid-ingredient]");
    if (avoidedIngredient) {
      const profile = structuredClone(store.getState().profile);
      const avoidedIds = new Set(profile.preferences.avoidIngredientIds);
      if (avoidedIngredient.checked) avoidedIds.add(avoidedIngredient.dataset.avoidIngredient);
      else avoidedIds.delete(avoidedIngredient.dataset.avoidIngredient);
      profile.preferences.avoidIngredientIds = [...avoidedIds];
      return store.dispatch({ type: "UPDATE_PROFILE", profile });
    }
    const workdayPreference = event.target.closest?.("[data-workday-preference]");
    if (workdayPreference) {
      const key = workdayPreference.dataset.workdayPreference;
      if (!new Set(["workdayLunch", "workdayDinner"]).has(key)) return;
      const profile = structuredClone(store.getState().profile);
      profile.preferences[key] = Boolean(workdayPreference.checked);
      return store.dispatch({ type: "UPDATE_PROFILE", profile });
    }
    const memberServings = event.target.closest?.("[data-member-servings]");
    if (memberServings) {
      const servings = Number(memberServings.value);
      if (!Number.isInteger(servings) || servings < 1 || servings > 8) return;
      const profile = structuredClone(store.getState().profile);
      const member = profile.members.find((item) => item.id === memberServings.dataset.memberServings);
      if (!member) return;
      member.defaultServings = servings;
      return store.dispatch({ type: "UPDATE_PROFILE", profile });
    }
    const memberLabel = event.target.closest?.("[data-member-label]");
    if (memberLabel) {
      const label = memberLabel.value.trim();
      if (!label || label.length > 20) return;
      const profile = structuredClone(store.getState().profile);
      const member = profile.members.find((item) => item.id === memberLabel.dataset.memberLabel);
      if (!member) return;
      member.label = label;
      return store.dispatch({ type: "UPDATE_PROFILE", profile });
    }
    const prep = event.target.closest?.("[data-prep-task]");
    if (prep) return store.dispatch({ type: "TOGGLE_PREP_TASK", taskId: prep.dataset.prepTask });
    const outside = event.target.closest?.("[data-outside]");
    if (outside) store.dispatch({ type: "MARK_OUTSIDE", slotId: outside.dataset.outside, outside: outside.checked });
    const shopping = event.target.closest?.("[data-shopping-key]");
    if (shopping) store.dispatch({ type: "TOGGLE_PURCHASED", ingredientKey: shopping.dataset.shoppingKey });
  });

  document.addEventListener("input", (event) => {
    const search = event.target.closest?.("[data-recipe-search]");
    if (search) store.dispatch({ type: "SET_RECIPE_SEARCH", query: search.value });
  });

  document.addEventListener("keydown", (event) => {
    if (closeSwapOnEscape(event)) return;
    trapSwapFocus(event);
  });

  document.addEventListener("error", (event) => {
    const image = event.target.closest?.("[data-food-image]");
    if (image) {
      image.hidden = true;
      image.nextElementSibling.hidden = false;
    }
  }, true);

  store.subscribe(renderApp);
  renderApp();
}
