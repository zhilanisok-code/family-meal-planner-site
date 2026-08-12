export function workMealLabel(slot) {
  if (!slot?.workMeal) return slot?.audience ?? "家庭餐";
  if (slot.mealType === "lunch") return "工作午餐";
  if (slot.mealType === "dinner") return "工作晚餐";
  if (slot.mealType === "breakfast") return "工作早餐";
  return "工作餐";
}
