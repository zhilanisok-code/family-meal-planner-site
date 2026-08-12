import { RECIPES } from "../data/recipes.js";
import { addDays } from "../domain/calendar.js";
import { compatibleRecipesForSlot } from "../domain/scheduler.js";
import { escapeHtml } from "./components.js";
import { workMealLabel } from "./meal-labels.js";

const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

const mealLabel = (slot) => (slot.workMeal ? workMealLabel(slot) : "家庭晚餐");

export function renderGenerationView(state) {
  const draft = state.generationDraft;
  if (!draft) return "";
  const endDate = addDays(draft.weekStart, 6);
  const manualCount = draft.slots.filter((slot) => slot.source === "manual").length;

  return `
    <header class="view-header generation-header">
      <div><p class="view-eyebrow">${escapeHtml(draft.weekStart)} 至 ${escapeHtml(endDate)}</p><h1 class="view-title" tabindex="-1" data-view-focus="generation">下周菜单草案</h1></div>
      <button type="button" class="secondary-action" data-close-generation>返回</button>
    </header>
    <p class="generation-note">草案尚未写入计划或采购。${manualCount ? `已保留 ${manualCount} 项手工安排。` : "确认后才会应用。"}</p>
    <section class="generation-list" aria-label="下周菜单草案">
      ${draft.slots.length ? draft.slots.map((slot) => {
        const recipe = recipeById.get(slot.recipeId);
        const compatibleRecipes = compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot });
        const control = slot.source === "manual"
          ? `<em>保留手工安排</em>`
          : `<label class="generation-recipe"><span>替换菜谱</span><select data-generation-recipe="${escapeHtml(slot.id)}" aria-label="替换 ${escapeHtml(slot.date)} ${mealLabel(slot)}菜谱">${compatibleRecipes.map((candidate) => `<option value="${escapeHtml(candidate.id)}" ${candidate.id === slot.recipeId ? "selected" : ""}>${escapeHtml(candidate.title)}</option>`).join("")}</select></label>`;
        return `<article class="generation-item${slot.source === "manual" ? " is-manual" : ""}" data-generation-slot="${escapeHtml(slot.id)}"><div><span>${escapeHtml(slot.date)} · ${mealLabel(slot)}</span><strong>${escapeHtml(recipe?.title ?? "待安排")}</strong></div>${control}</article>`;
      }).join("") : `<p class="empty-state">当前偏好下没有可生成的餐位。</p>`}
    </section>
    <button type="button" class="primary-action generation-apply" data-apply-generated-week ${draft.slots.length ? "" : "disabled"}>确认并应用到计划</button>`;
}
