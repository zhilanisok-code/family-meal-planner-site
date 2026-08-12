const slotsOf = (plan) => (plan.weeks ?? []).flatMap((week) => week.slots ?? []);

const asRecipeMap = (recipes) => new Map(recipes.map((recipe) => [recipe.id, recipe]));

const VEGETABLE_INGREDIENT_IDS = new Set([
  "bell-pepper", "bok-choy", "broccoli", "carrot", "cherry-tomato", "cucumber",
  "lettuce", "mushroom", "onion", "peas", "potato", "pumpkin", "shiitake",
  "spinach", "tomato", "zucchini",
]);

const formatQuantity = (qty, unit) => {
  if (qty == null) return "待确认";
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded}${unit}`;
};

export function adjustIngredients(recipe, servings) {
  const multiplier = servings / recipe.servingBase;
  return recipe.ingredients.map((item) => {
    const qty = item.qty == null ? null : item.qty * multiplier;
    return { ...item, qty, displayQty: formatQuantity(qty, item.unit) };
  });
}

export function buildShoppingList(plan, recipes) {
  const recipeMap = asRecipeMap(recipes);
  const merged = new Map();

  for (const slot of slotsOf(plan)) {
    if (slot.outside || !slot.recipeId) continue;
    const recipe = recipeMap.get(slot.recipeId);
    if (!recipe) continue;

    for (const item of adjustIngredients(recipe, slot.servings)) {
      const key = `${item.id}::${item.unit}`;
      const current = merged.get(key);
      if (!current) {
        merged.set(key, { ...item, recipeIds: [recipe.id] });
        continue;
      }

      const qty = current.qty == null || item.qty == null ? null : current.qty + item.qty;
      merged.set(key, {
        ...current,
        qty,
        displayQty: formatQuantity(qty, item.unit),
        recipeIds: current.recipeIds.includes(recipe.id)
          ? current.recipeIds
          : [...current.recipeIds, recipe.id],
      });
    }
  }

  return [...merged.values()];
}

export function swapMeal(plan, slotId, recipeId) {
  return {
    ...plan,
    weeks: (plan.weeks ?? []).map((week) => ({
      ...week,
      prepTasks: week.prepTasks?.map((task) => ({ ...task })),
      slots: (week.slots ?? []).map((slot) => (
        slot.id === slotId ? { ...slot, recipeId, outside: false } : { ...slot }
      )),
    })),
  };
}

export function computeMonthSummary(plan, recipes) {
  const recipeMap = asRecipeMap(recipes);
  const proteinGroups = {};
  const breakfastRecipeIds = new Set();
  let workMealCount = 0;
  let outsideMealCount = 0;
  let vegetableMealCount = 0;

  for (const slot of slotsOf(plan)) {
    if (slot.outside) {
      outsideMealCount += 1;
      continue;
    }
    if (slot.workMeal) workMealCount += 1;
    const recipe = recipeMap.get(slot.recipeId);
    if (!recipe) continue;
    proteinGroups[recipe.proteinGroup] = (proteinGroups[recipe.proteinGroup] ?? 0) + 1;
    if (recipe.ingredients?.some((ingredient) => VEGETABLE_INGREDIENT_IDS.has(ingredient.id))) vegetableMealCount += 1;
    if (slot.mealType === "breakfast") breakfastRecipeIds.add(recipe.id);
  }

  return {
    proteinGroups,
    uniqueBreakfastRecipeIds: [...breakfastRecipeIds],
    uniqueBreakfastRecipeCount: breakfastRecipeIds.size,
    workMealCount,
    outsideMealCount,
    vegetableMealCount,
  };
}
