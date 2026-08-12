import { RECIPES } from "../data/recipes.js";
import { addDays, isoToday, weekStart as calendarWeekStart } from "../domain/calendar.js";
import { computeMonthSummary } from "../domain/planner.js";
import { escapeHtml, renderMealCard } from "./components.js";

const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
const mealRows = [["breakfast", "早"], ["lunch", "午"], ["dinner", "晚"], ["family", "家"]];
const dateFromIso = (iso) => new Date(`${iso}T00:00:00Z`);
const isoDate = (date) => date.toISOString().slice(0, 10);

function resolveWeek(state) {
  return state.plan.weeks.find((week) => week.id === state.selectedWeek) ?? state.plan.weeks.find((week) => week.slots.some((slot) => slot.date === state.selectedDate)) ?? state.plan.weeks[0];
}

function weekDates(week) {
  const anchor = dateFromIso([...week.slots].map((slot) => slot.date).sort()[0]);
  anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => { const date = new Date(anchor); date.setUTCDate(anchor.getUTCDate() + index); return { iso: isoDate(date), name: dayNames[date.getUTCDay()], day: date.getUTCDate() }; });
}

function weekPeriodLabel(week) {
  const months = [...new Set(weekDates(week).map(({ iso }) => iso.slice(0, 7)))];
  return months.join(" / ");
}

function renderSlotControls(slot) {
  return `<div class="slot-controls"><label><input type="checkbox" data-outside="${escapeHtml(slot.id)}" ${slot.outside ? "checked" : ""}> 外出用餐</label><div aria-label="调整份数"><button type="button" data-serving-delta="-1" data-slot-id="${escapeHtml(slot.id)}" aria-label="减少份数">−</button><span>${Math.max(1, slot.servings)} 份</span><button type="button" data-serving-delta="1" data-slot-id="${escapeHtml(slot.id)}" aria-label="增加份数">+</button></div></div>`;
}

function renderWeekMode(state, week) {
  const dates = weekDates(week);
  const slots = week.slots.filter((slot) => slot.date === state.selectedDate);
  const workMealCount = week.slots.filter((slot) => slot.workMeal && !slot.outside).length;
  const prepMinutes = Math.max(20, week.prepTasks.length * 20 + week.slots.filter((slot) => !slot.outside).length * 8);
  return `<div class="date-strip" aria-label="选择日期">${dates.map(({ iso, name, day }) => `<button type="button" data-date="${iso}" class="date-button${iso === state.selectedDate ? " is-selected" : ""}" aria-pressed="${iso === state.selectedDate}">${name}<strong>${day}</strong></button>`).join("")}</div><section class="week-stats" aria-label="本周概览"><div><span>本周带饭</span><strong>${workMealCount} 餐</strong></div><div><span>预计备餐</span><strong>${Math.floor(prepMinutes / 60) ? `${Math.floor(prepMinutes / 60)} 小时 ` : ""}${prepMinutes % 60} 分</strong></div></section><section class="week-meals" aria-label="当日餐食">${slots.length ? "" : `<p class="empty-state">这一天还没有安排</p>`}${mealRows.map(([type, label]) => renderMealRow(type, label, slots)).join("")}</section>`;
}

function renderMealRow(type, label, slots) {
  const slot = slots.find((item) => (
    type === "breakfast"
      ? item.mealType === "breakfast"
      : type === "family"
        ? !item.workMeal && (item.mealType === "dinner" || item.mealType === "family")
        : item.workMeal && item.mealType === type
  ));
  return `<div class="week-meal-row" data-meal-type="${type}"><span>${label}</span>${slot ? `${renderMealCard(slot, recipeById.get(slot.recipeId))}${renderSlotControls(slot)}` : `<p class="empty-state">${label}餐暂未安排</p>`}</div>`;
}

export function buildWeekendPrepTasks(state) {
  const week = resolveWeek(state);
  return week.slots
    .map((slot) => ({ slot, recipe: recipeById.get(slot.recipeId) }))
    .filter(({ slot, recipe }) => slot.workMeal && !slot.outside && recipe)
    .map(({ slot, recipe }) => ({
      slotId: slot.id,
      recipeId: recipe.id,
      title: recipe.title,
      servings: slot.servings,
      timing: recipe.timing,
      preparation: recipe.steps?.[0] ?? "备好食材后开始烹饪。",
      cookingSteps: recipe.steps?.slice(1) ?? [],
      storage: recipe.storage ?? "保存方式待确认",
      reheat: recipe.reheatMethods?.join("、") || "复热方式待确认",
    }));
}

function renderWeekendPrep(state) {
  const tasks = buildWeekendPrepTasks(state);
  return `<section class="weekend-prep" aria-label="本周备餐怎么做"><div class="section-heading"><h2>本周备餐怎么做</h2><span>逐道看准备、做法和保存</span></div>${tasks.length ? `<div class="prep-guide-list">${tasks.map(renderPrepGuideTask).join("")}</div>` : "<p class=\"empty-state\">本周没有需要集中备餐的工作餐</p>"}</section>`;
}

function renderPrepGuideTask(task) {
  const cooking = task.cookingSteps.length
    ? `<ol>${task.cookingSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
    : "按菜谱完成烹饪。";
  return `<article class="prep-guide-card" data-weekend-prep-slot="${escapeHtml(task.slotId)}"><div class="prep-guide-card__heading"><div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.servings)} 份 · ${escapeHtml(task.timing)}</p></div><button type="button" class="prep-guide-card__open" data-open-recipe="${escapeHtml(task.recipeId)}">查看完整做法</button></div><dl><div><dt>准备</dt><dd>${escapeHtml(task.preparation)}</dd></div><div><dt>做法</dt><dd>${cooking}</dd></div><div><dt>保存/复热</dt><dd>${escapeHtml(task.storage)} · ${escapeHtml(task.reheat)}</dd></div></dl></article>`;
}

function renderMonthMode(state) {
  const summary = computeMonthSummary(state.plan, RECIPES);
  const groups = summary.proteinGroups;
  const rotations = [["鱼类", groups.fish ?? 0], ["豆制品", (groups.tofu ?? 0) + (groups.soy ?? 0)], ["牛肉", groups.beef ?? 0], ["禽类", groups.chicken ?? 0], ["蛋奶", (groups.egg ?? 0) + (groups.dairy ?? 0)], ["蔬菜", summary.vegetableMealCount]];
  return `<section class="month-summary"><h2>月度轮换</h2><div class="rotation-grid">${rotations.map(([label, count]) => `<div><span>${label}</span><strong>${count} 次</strong></div>`).join("")}</div><div class="month-counts"><span>早餐变化 ${summary.uniqueBreakfastRecipeCount} 种</span><span>工作餐 ${summary.workMealCount} 餐</span><span>外出用餐 ${summary.outsideMealCount} 餐</span></div><div class="month-weeks">${state.plan.weeks.map((week) => `<button type="button" data-week-id="${escapeHtml(week.id)}" data-week-mode="week">${escapeHtml(week.label)}<span>${week.slots.length} 项安排</span></button>`).join("")}</div></section>`;
}

export function renderWeekView(state, { today = isoToday() } = {}) {
  const week = resolveWeek(state);
  const nextWeekStart = addDays(calendarWeekStart(today) ?? calendarWeekStart(state.selectedDate), 7);
  return `<header class="view-header week-header"><div><p class="view-eyebrow">${escapeHtml(weekPeriodLabel(week))} · ${escapeHtml(week.label)}</p><h1 class="view-title">本周计划</h1></div><button type="button" class="generation-launch" data-open-generation="${escapeHtml(nextWeekStart)}">生成下周菜单</button></header><div class="mode-switch" role="group" aria-label="查看范围"><button type="button" data-week-mode="week" aria-pressed="${state.weekMode === "week"}">周</button><button type="button" data-week-mode="month" aria-pressed="${state.weekMode === "month"}">月</button></div>${state.weekMode === "month" ? renderMonthMode(state) : `${renderWeekMode(state, week)}${renderWeekendPrep(state)}`}`;
}
