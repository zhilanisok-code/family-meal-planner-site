import { addDays, isoToday, weekStart } from "../domain/calendar.js";

const slot = (id, date, mealType, recipeId) => ({
  id,
  date,
  mealType,
  recipeId,
  servings: 2,
  outside: false,
  workMeal: false,
  audience: "演示",
});

export const createDemoPlan = (clock = new Date()) => {
  const today = isoToday(clock);
  const tomorrow = addDays(today, 1);
  const currentWeekStart = weekStart(today);
  const nextWeekStart = addDays(currentWeekStart, 7);
  const createWeek = (start, label) => {
    const dates = new Set([start]);
    if (weekStart(tomorrow) === start) dates.add(tomorrow);
    const slots = [...dates].flatMap((date) => [
      slot(`demo-${date}-lunch`, date, "lunch", "chicken-grain-bowl"),
      slot(`demo-${date}-family`, date, "family", "beef-veggie-pot"),
    ]);

    return { id: `demo:${start}`, label, slots, prepTasks: [] };
  };

  return {
    month: today.slice(0, 7),
    weeks: [
      createWeek(currentWeekStart, "演示本周"),
      createWeek(nextWeekStart, "演示下周"),
    ],
  };
};

export const SEED_PLAN = createDemoPlan();
