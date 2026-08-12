import { RECIPES } from "../data/recipes.js";
import { buildShoppingList } from "../domain/planner.js";
import { escapeHtml } from "./components.js";

const INGREDIENT_CLASSIFICATION = {
  egg: { group: "肉蛋奶", store: "market" },
  "chicken-breast": { group: "肉蛋奶", store: "sams" },
  "boneless-chicken-thigh": { group: "肉蛋奶", store: "sams" },
  "beef-slices": { group: "肉蛋奶", store: "sams" },
  "beef-mince": { group: "肉蛋奶", store: "market" },
  "beef-cubes": { group: "肉蛋奶", store: "market" },
  "beef-brisket": { group: "肉蛋奶", store: "market" },
  "lean-pork-mince": { group: "肉蛋奶", store: "market" },
  "peeled-shrimp": { group: "肉蛋奶", store: "sams" },
  "boneless-salmon": { group: "肉蛋奶", store: "sams" },
  "boneless-fish-fillet": { group: "肉蛋奶", store: "sams" },
  "plain-yogurt": { group: "肉蛋奶", store: "sams" },
  "soft-tofu": { group: "肉蛋奶", store: "market" },
  "whole-wheat-toast": { group: "主食调料", store: "sams" },
  "whole-wheat-wrap": { group: "主食调料", store: "sams" },
  "mixed-grain-rice": { group: "主食调料", store: "sams" },
  rice: { group: "主食调料", store: "sams" },
  pasta: { group: "主食调料", store: "sams" },
  oats: { group: "主食调料", store: "sams" },
  "frozen-dumpling": { group: "主食调料", store: "sams" },
  "vegetable-bun": { group: "主食调料", store: "sams" },
  "mixed-herbs": { group: "主食调料", store: "market" },
};

const HOME_INGREDIENT_IDS = new Set(["egg", "rice", "mixed-grain-rice", "oats"]);
const GROUPS = ["蔬菜水果", "肉蛋奶", "主食调料"];
const STORE_FILTERS = [["all", "全部"], ["sams", "山姆"], ["market", "菜市场"], ["home", "家里已有"]];
const recipesById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

function classificationFor(item) {
  return INGREDIENT_CLASSIFICATION[item.id] ?? { group: "蔬菜水果", store: "market" };
}

function itemKey(item) {
  return `${item.id}::${item.unit}`;
}

export function groupShoppingItems(items) {
  const groups = Object.fromEntries(GROUPS.map((group) => [group, []]));
  items.forEach((item) => groups[classificationFor(item).group].push(item));
  return groups;
}

function isVisibleForFilter(item, filter) {
  if (filter === "all") return true;
  if (filter === "home") return HOME_INGREDIENT_IDS.has(item.id);
  return classificationFor(item).store === filter;
}

function recipeTitles(recipeIds) {
  return recipeIds.map((id) => recipesById.get(id)?.title).filter(Boolean).join("、") || "对应菜谱待确认";
}

function renderItem(item, purchasedIds) {
  const key = itemKey(item);
  const purchased = purchasedIds.includes(key);
  const isHome = HOME_INGREDIENT_IDS.has(item.id);
  return `<label class="shopping-item${purchased ? " is-purchased" : ""}">
    <input type="checkbox" data-shopping-key="${escapeHtml(key)}" ${purchased ? "checked" : ""} aria-label="${escapeHtml(`标记${item.name}已购买`)}">
    <span class="shopping-item__check" aria-hidden="true">${purchased ? "✓" : ""}</span>
    <span class="shopping-item__copy"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(recipeTitles(item.recipeIds))}${isHome ? " · 家里已有" : ""}</small></span>
    <strong>${escapeHtml(item.displayQty ?? "待确认")}</strong>
  </label>`;
}

function renderGroups(items, state) {
  const groups = groupShoppingItems(items);
  return GROUPS.map((group) => `<section class="shopping-group"><div class="section-heading"><h2>${group}</h2><span>${groups[group].length} 项</span></div>${groups[group].length ? groups[group].map((item) => renderItem(item, state.purchasedIngredientIds)).join("") : "<p class=\"shopping-group__empty\">这个分类暂时没有采购项</p>"}</section>`).join("");
}

export function renderShoppingView(state) {
  const allItems = buildShoppingList(state.plan, RECIPES);
  const items = allItems.filter((item) => isVisibleForFilter(item, state.storeFilter));
  const purchasedCount = allItems.filter((item) => state.purchasedIngredientIds.includes(itemKey(item))).length;
  const delta = state.lastShoppingDelta;
  const deltaBanner = delta ? `<aside class="shopping-delta" aria-label="换菜后的采购调整"><b>采购清单已更新</b><span>新增 ${delta.addedIds.length} 项，减少 ${delta.removedIds.length} 项</span></aside>` : "";

  return `<header class="view-header"><p class="view-eyebrow">本周安排推导</p><h1 class="view-title">本周采购</h1></header>
    <section class="shopping-summary" aria-label="采购进度"><div><p>本周共需采购 ${allItems.length} 项</p><strong>已购买 ${purchasedCount}/${allItems.length}</strong></div><span>${purchasedCount}/${allItems.length}</span></section>
    <div class="filter-tabs" role="group" aria-label="采购地点筛选">${STORE_FILTERS.map(([id, label]) => `<button type="button" data-shopping-filter="${id}" aria-pressed="${state.storeFilter === id}">${label}</button>`).join("")}</div>
    <div class="shopping-groups">${items.length ? renderGroups(items, state) : "<p class=\"empty-state\">这个分类暂时没有采购项</p>"}</div>
    ${deltaBanner}`;
}
