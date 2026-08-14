import { RECIPES } from "../data/recipes.js";
import { addDays, isoToday } from "../domain/calendar.js";
import { buildPreparationTasks } from "../domain/preparation.js";
import { escapeHtml, renderMealCard } from "./components.js";
import { workMealLabel } from "./meal-labels.js";

const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatChineseDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 · ${dayNames[date.getUTCDay()]}`;
}

function isWeekend(iso) {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export function renderTomorrowView(state, { today = isoToday() } = {}) {
  const targetDate = addDays(today, 1) ?? state.selectedDate;
  const dateSlots = state.plan.weeks.flatMap((week) => week.slots.map((slot) => ({ ...slot, weekId: week.id }))).filter((slot) => slot.date === targetDate);
  const confirmedSlots = state.plan.slots ?? state.plan.weeks.flatMap((week) => week.slots);
  const prepTasks = buildPreparationTasks({ slots: confirmedSlots, recipes: RECIPES }).filter((task) => task.forDate === today);
  const completed = prepTasks.filter((task) => state.completedPrepTaskIds.includes(task.id)).length;
  const remaining = Math.max(0, prepTasks.length - completed);
  const lunchServings = dateSlots.find((slot) => slot.workMeal && slot.mealType === "lunch")?.servings ?? 0;
  const familyServings = dateSlots.find((slot) => !slot.workMeal && !slot.outside && (slot.mealType === "dinner" || slot.mealType === "family"))?.servings ?? 0;
  const prepMinutes = prepTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

  return `
    <header class="view-header"><p class="view-eyebrow">${escapeHtml(formatChineseDate(targetDate))}</p><h1 class="view-title">明日安排</h1></header>
    <section class="tomorrow-summary" aria-label="明日备餐概览"><div><p>今晚准备进度</p><strong>${remaining ? `还差 ${remaining} 件事` : "今晚准备已完成"}</strong></div><span class="tomorrow-summary__progress">${completed}/${prepTasks.length || 0}</span><div class="tomorrow-summary__counts"><span>${lunchServings} 人带饭</span><span>${familyServings} 人家庭餐</span></div></section>
    <section class="view-section" aria-label="明日餐食"><div class="section-heading"><h2>明日餐食</h2><span>${escapeHtml(targetDate)}</span></div>${dateSlots.length ? "" : `<p class="tomorrow-empty-note">这一天还没有安排，可以从下面选一道菜。</p>`}${renderDecisionCards(dateSlots, targetDate, { includeWorkMeals: !isWeekend(targetDate) })}</section>
    <section class="prep-box" aria-label="今晚备餐任务"><div class="section-heading"><h2>今晚 20:30 前</h2><span>约 ${prepMinutes} 分钟</span></div>${prepTasks.length ? prepTasks.map((task) => { const checked = state.completedPrepTaskIds.includes(task.id); return `<label class="prep-task"><input type="checkbox" data-prep-task="${escapeHtml(task.id)}" ${checked ? "checked" : ""}><span>${escapeHtml(task.task)}</span></label>`; }).join("") : `<p class="empty-state">今晚没有待办备餐任务。</p>`}</section>`;
}

function renderDecisionCards(slots, targetDate, { includeWorkMeals = true } = {}) {
  const workDecisions = [
    ["adult-lunch", "工作午餐", "work-lunch", "lunch", true, (slot) => slot.workMeal && slot.mealType === "lunch"],
    ["adult-dinner", "工作晚餐", "work-dinner", "dinner", true, (slot) => slot.workMeal && slot.mealType === "dinner"],
  ];
  const visibleWorkDecisions = includeWorkMeals
    ? workDecisions
    : workDecisions.filter(([, , , , , predicate]) => slots.some(predicate));
  const decisions = [
    ...visibleWorkDecisions,
    ["family-meal", "家庭餐", "family", "family", false, (slot) => !slot.workMeal && !slot.outside && (slot.mealType === "dinner" || slot.mealType === "family")],
  ];
  return decisions.map(([id, label, targetKey, mealType, workMeal, predicate]) => {
    const slot = slots.find(predicate);
    const empty = `<div class="empty-state tomorrow-empty-slot"><p>${label}暂未安排</p><button type="button" data-plan-tomorrow-meal="${targetKey}" data-target-date="${escapeHtml(targetDate)}" data-target-meal-type="${mealType}" data-target-work-meal="${workMeal}">选菜谱</button></div>`;
    return `<div class="tomorrow-decision" data-tomorrow-card="${id}"><h3>${label}</h3>${slot ? renderMealCard(slot, recipeById.get(slot.recipeId), { audience: workMealLabel(slot) }) : empty}</div>`;
  }).join("");
}
