import { addDays, isValidIsoDate } from "./calendar.js";

const recipeMap = (recipes) => new Map(recipes.map((recipe) => [recipe.id, recipe]));

const prepKindFor = (date) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 1 || day === 0 || day === 6 ? "weekend" : "eve";
};

const prepDateFor = (date) => addDays(date, -1);

const minutesFromTiming = (timing) => Number(String(timing ?? "").match(/\d+/)?.[0] ?? 0);

export function buildPreparationTasks({ slots = [], recipes = [] } = {}) {
  const recipesById = recipeMap(recipes);

  return slots
    .filter((slot) => slot?.workMeal && !slot.outside && slot.recipeId && isValidIsoDate(slot.date))
    .map((slot) => ({ slot, recipe: recipesById.get(slot.recipeId) }))
    .filter(({ recipe }) => recipe)
    .map(({ slot, recipe }) => {
      const kind = prepKindFor(slot.date);
      return {
        id: `prep:${slot.id}:${kind}`,
        slotId: slot.id,
        forDate: prepDateFor(slot.date),
        kind,
        timing: recipe.timing,
        estimatedMinutes: minutesFromTiming(recipe.timing),
        task: `${kind === "weekend" ? "周末" : "前一晚"}准备 ${slot.servings} 份${recipe.title}`,
      };
    })
    .sort((left, right) => left.forDate.localeCompare(right.forDate) || left.id.localeCompare(right.id));
}
