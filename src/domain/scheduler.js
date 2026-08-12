import { addDays, isValidIsoDate, weekDates } from "./calendar.js";

const weekdayTargets = [
  { key: "lunch", mealType: "lunch", workMeal: true, audience: "成人工作餐", preferenceKey: "workdayLunch" },
  { key: "dinner-adult", mealType: "dinner", workMeal: true, audience: "成人工作餐", preferenceKey: "workdayDinner", simple: true },
  { key: "dinner", mealType: "dinner", workMeal: false, audience: "全家家庭餐" },
];

const isManualInWeek = (slot, dates) => slot?.source === "manual" && dates.has(slot.date);

const servingsFor = (members, role) => {
  const matching = members.filter((member) => !role || member?.role === role);
  const total = matching.reduce((sum, member) => (
    Number.isFinite(member?.defaultServings) && member.defaultServings > 0
      ? sum + member.defaultServings
      : sum
  ), 0);
  return total || (role === "adult" ? 2 : 4);
};

const recipeAvoidsIngredients = (recipe, avoidedIds) => (
  !recipe.ingredients?.some((ingredient) => avoidedIds.has(ingredient.id))
);

const minutesFromTiming = (timing) => {
  const minutes = Number.parseInt(String(timing ?? "").match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(minutes) ? minutes : Number.POSITIVE_INFINITY;
};

const isWorkDinner = (slot) => slot?.workMeal && slot.mealType === "dinner";

const isPortableWorkDinnerRecipe = (recipe) => (
  recipe.scenarios?.includes("成人工作餐")
  && !String(recipe.storage ?? "").includes("现做现吃")
  && Array.isArray(recipe.reheatMethods)
  && recipe.reheatMethods.length > 0
  && minutesFromTiming(recipe.timing) <= 35
);

const compareWorkDinnerSimplicity = (left, right) => {
  const minuteDifference = minutesFromTiming(left.timing) - minutesFromTiming(right.timing);
  const quickDifference = Number(!left.scenarios?.includes("快速晚餐")) - Number(!right.scenarios?.includes("快速晚餐"));
  return minuteDifference || quickDifference || left.id.localeCompare(right.id);
};

export function compatibleRecipesForSlot({ recipes = [], profile = {}, slot } = {}) {
  if (!slot?.mealType) return [];
  const avoidedIds = new Set(profile.preferences?.avoidIngredientIds ?? []);
  const compatible = recipes.filter((recipe) => (
    recipe?.id
    && (isWorkDinner(slot)
      ? recipe.mealTypes?.some((mealType) => mealType === "lunch" || mealType === "dinner")
      : slot.mealType === "family"
        ? recipe.mealTypes?.includes("dinner")
        : recipe.mealTypes?.includes(slot.mealType))
    && recipeAvoidsIngredients(recipe, avoidedIds)
  ));
  if (!isWorkDinner(slot)) return compatible;
  return compatible.filter(isPortableWorkDinnerRecipe).sort(compareWorkDinnerSimplicity);
}

const matchingManualSlot = (manualSlots, date, target) => manualSlots.find((slot) => (
  slot.date === date
  && (target.workMeal
    ? slot.workMeal && slot.mealType === target.mealType
    : !slot.workMeal && (slot.mealType === "dinner" || slot.mealType === "family"))
));

const selectRecipe = (recipes, profile, target, usedRecipeIds, usedSimpleRecipeIds, proteinCounts) => {
  const compatible = compatibleRecipesForSlot({ recipes, profile, slot: target });
  const usedForTarget = target.simple ? usedSimpleRecipeIds : usedRecipeIds;
  const unused = compatible.filter((recipe) => !usedForTarget.has(recipe.id));
  const candidates = unused.length ? unused : compatible;
  if (target.simple) return candidates[0] ?? null;
  return candidates.reduce((selected, recipe) => {
    if (!selected) return recipe;
    const selectedCount = proteinCounts.get(selected.proteinGroup) ?? 0;
    const currentCount = proteinCounts.get(recipe.proteinGroup) ?? 0;
    return currentCount < selectedCount ? recipe : selected;
  }, null);
};

export function generateWeekDraft({ recipes = [], profile = {}, slots = [], weekStart: targetWeekStart } = {}) {
  if (!isValidIsoDate(targetWeekStart)) return [];

  const dates = weekDates(targetWeekStart).map(({ iso }) => iso).filter(Boolean);
  if (dates.length !== 7) return [];
  const weekdayDates = dates.slice(0, 5);
  const weekDateSet = new Set(dates);
  const preferences = profile.preferences ?? {};
  const manualSlots = slots.filter((slot) => isManualInWeek(slot, weekDateSet)).map((slot) => ({ ...slot }));
  const usedRecipeIds = new Set(manualSlots.map((slot) => slot.recipeId).filter(Boolean));
  const usedSimpleRecipeIds = new Set(manualSlots.filter(isWorkDinner).map((slot) => slot.recipeId).filter(Boolean));
  const proteinByRecipeId = new Map(recipes.map((recipe) => [recipe.id, recipe.proteinGroup]));
  const proteinCounts = new Map();
  for (const recipeId of usedRecipeIds) {
    const proteinGroup = proteinByRecipeId.get(recipeId);
    if (proteinGroup) proteinCounts.set(proteinGroup, (proteinCounts.get(proteinGroup) ?? 0) + 1);
  }
  const adultServings = servingsFor(Array.isArray(profile.members) ? profile.members : [], "adult");
  const familyServings = servingsFor(Array.isArray(profile.members) ? profile.members : []);
  const draft = [];

  for (const date of weekdayDates) {
    for (const target of weekdayTargets) {
      const enabled = target.preferenceKey ? preferences[target.preferenceKey] !== false : true;
      if (!enabled) continue;

      const manual = matchingManualSlot(manualSlots, date, target);
      if (manual) {
        draft.push(manual);
        continue;
      }

      const recipe = selectRecipe(recipes, profile, target, usedRecipeIds, usedSimpleRecipeIds, proteinCounts);
      if (!recipe) continue;
      const id = `${date}-${target.key}`;
      draft.push({
        id,
        date,
        mealType: target.mealType,
        recipeId: recipe.id,
        servings: target.workMeal ? adultServings : familyServings,
        outside: false,
        workMeal: target.workMeal,
        audience: target.audience,
        source: "generated",
      });
      usedRecipeIds.add(recipe.id);
      if (target.simple) usedSimpleRecipeIds.add(recipe.id);
      proteinCounts.set(recipe.proteinGroup, (proteinCounts.get(recipe.proteinGroup) ?? 0) + 1);
    }
  }

  const representedManualIds = new Set(draft.filter((slot) => slot.source === "manual").map((slot) => slot.id));
  for (const manual of manualSlots) {
    if (!representedManualIds.has(manual.id)) draft.push(manual);
  }

  return draft.sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
}
