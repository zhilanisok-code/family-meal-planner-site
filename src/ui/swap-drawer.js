import { RECIPES } from "../data/recipes.js";
import { compatibleRecipesForSlot } from "../domain/scheduler.js";
import { escapeHtml } from "./components.js";

export const SWAP_REASONS = ["换个口味", "更快完成", "用现有食材"];

const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

function findSlotContext(state, slotId) {
  for (const week of state?.plan?.weeks ?? []) {
    const slot = week.slots?.find((item) => item.id === slotId);
    if (slot) return { week, slot };
  }
  return null;
}

function totalMinutes(recipe) {
  const match = String(recipe?.timing ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function weekIngredientIds(week) {
  const ingredients = new Set();
  for (const slot of week?.slots ?? []) {
    if (slot.outside || !slot.recipeId) continue;
    for (const ingredient of recipeById.get(slot.recipeId)?.ingredients ?? []) ingredients.add(ingredient.id);
  }
  return ingredients;
}

function compareCandidates(reason, currentRecipe, ingredientIds) {
  return (left, right) => {
    const leftMinutes = totalMinutes(left.recipe);
    const rightMinutes = totalMinutes(right.recipe);
    const leftOverlap = left.recipe.ingredients.filter((item) => ingredientIds.has(item.id)).length;
    const rightOverlap = right.recipe.ingredients.filter((item) => ingredientIds.has(item.id)).length;
    const leftDifferentProtein = left.recipe.proteinGroup !== currentRecipe?.proteinGroup ? 1 : 0;
    const rightDifferentProtein = right.recipe.proteinGroup !== currentRecipe?.proteinGroup ? 1 : 0;

    if (reason === "更快完成") {
      if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
      if (leftOverlap !== rightOverlap) return rightOverlap - leftOverlap;
    } else if (reason === "用现有食材") {
      if (leftOverlap !== rightOverlap) return rightOverlap - leftOverlap;
      if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    } else {
      if (leftDifferentProtein !== rightDifferentProtein) return rightDifferentProtein - leftDifferentProtein;
      if (leftOverlap !== rightOverlap) return rightOverlap - leftOverlap;
      if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    }

    return left.order - right.order;
  };
}

/**
 * Returns three deterministic replacement choices for a planned slot. The returned
 * item shape is `{ recipe, isDuplicate, overlapCount }` so the UI can make the
 * duplicate fallback explicit rather than hiding it in ranking logic.
 */
export function rankSwapCandidates(state, slotId, reason = "换个口味") {
  const context = findSlotContext(state, slotId);
  if (!context) return [];

  const { week, slot } = context;
  const currentRecipe = recipeById.get(slot.recipeId);
  const usedRecipeIds = new Set(
    week.slots.filter((item) => !item.outside && item.recipeId).map((item) => item.recipeId),
  );
  const compatibleRecipeIds = new Set(
    compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot }).map((recipe) => recipe.id),
  );
  const ingredientIds = weekIngredientIds(week);
  const ranked = RECIPES
    .filter((recipe) => recipe.id !== slot.recipeId && compatibleRecipeIds.has(recipe.id))
    .map((recipe, order) => ({
      recipe,
      order,
      isDuplicate: usedRecipeIds.has(recipe.id),
      overlapCount: recipe.ingredients.filter((item) => ingredientIds.has(item.id)).length,
    }))
    .sort(compareCandidates(SWAP_REASONS.includes(reason) ? reason : "换个口味", currentRecipe, ingredientIds));

  const fresh = ranked.filter((candidate) => !candidate.isDuplicate);
  if (fresh.length >= 3) return fresh.slice(0, 3);

  return [...fresh, ...ranked.filter((candidate) => candidate.isDuplicate)].slice(0, 3);
}

function renderCandidate(candidate, selectedRecipeId) {
  const { recipe, isDuplicate } = candidate;
  const selected = recipe.id === selectedRecipeId;
  const reheat = recipe.reheatMethods?.[0] ?? "复热方式待确认";
  return `<button type="button" class="swap-candidate${selected ? " is-selected" : ""}" data-select-swap="${escapeHtml(recipe.id)}" aria-pressed="${selected}">
    <img src="${escapeHtml(recipe.image?.url)}" alt="${escapeHtml(recipe.title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span>
    <span class="swap-candidate__copy"><b>${escapeHtml(recipe.title)}</b><small>${escapeHtml(recipe.timing)} · ${escapeHtml(recipe.storage)}</small><small>${escapeHtml(reheat)}</small><em>${escapeHtml(recipe.preferenceNotes?.[0] ?? "按家人口味微调")}</em>${isDuplicate ? "<strong>本周已有相似安排</strong>" : ""}</span>
    <span class="swap-candidate__choice" aria-hidden="true">${selected ? "已选" : "选择"}</span>
  </button>`;
}

export function renderSwapDrawer(state) {
  const context = state?.activeSwapSlotId ? findSlotContext(state, state.activeSwapSlotId) : null;
  if (!context) return "";

  const { slot } = context;
  const currentRecipe = recipeById.get(slot.recipeId);
  const reason = SWAP_REASONS.includes(state.swapReason) ? state.swapReason : SWAP_REASONS[0];
  const candidates = rankSwapCandidates(state, slot.id, reason);
  const selectedRecipeId = candidates.some((candidate) => candidate.recipe.id === state.selectedSwapRecipeId)
    ? state.selectedSwapRecipeId
    : null;

  return `<div class="swap-overlay" data-close-swap-backdrop>
    <section class="swap-drawer" role="dialog" aria-modal="true" aria-labelledby="swap-drawer-title" aria-describedby="swap-drawer-note">
      <div class="swap-drawer__handle" aria-hidden="true"></div>
      <header class="swap-drawer__header"><div><p>调整这餐</p><h2 id="swap-drawer-title" tabindex="-1" data-swap-title>换一道更合适的菜</h2></div><button type="button" class="swap-drawer__close" data-close-swap aria-label="关闭换菜">×</button></header>
      <section class="swap-current" aria-label="当前菜品">${currentRecipe?.image?.url ? `<img src="${escapeHtml(currentRecipe.image.url)}" alt="${escapeHtml(currentRecipe.title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span>` : ""}<div><small>当前安排 · ${Math.max(1, slot.servings)} 份</small><b>${escapeHtml(currentRecipe?.title ?? "待安排餐食")}</b></div></section>
      <div class="swap-reasons" role="group" aria-label="换菜原因">${SWAP_REASONS.map((item) => `<button type="button" data-swap-reason="${item}" aria-pressed="${item === reason}">${item}</button>`).join("")}</div>
      <p id="swap-drawer-note" class="swap-drawer__note">确认后，采购清单和备餐任务会同步更新。</p>
      <div class="swap-candidates" aria-label="可替换菜谱">${candidates.map((candidate) => renderCandidate(candidate, selectedRecipeId)).join("") || "<p class=\"empty-state\">暂时没有可替换的家常菜</p>"}</div>
      <button type="button" class="swap-confirm" data-confirm-swap ${selectedRecipeId ? "" : "disabled"}>确认换成${selectedRecipeId ? `「${escapeHtml(recipeById.get(selectedRecipeId)?.title)}」` : "所选菜"}</button>
    </section>
  </div>`;
}
