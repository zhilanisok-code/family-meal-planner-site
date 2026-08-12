const NAV_ITEMS = [
  ["tomorrow", "明日"],
  ["week", "本周"],
  ["shopping", "采购"],
  ["recipes", "菜谱"],
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderBottomNav(route) {
  return NAV_ITEMS.map(([id, label]) => `
    <button class="bottom-nav__item" type="button" data-route="${id}"
      aria-current="${route === id ? "page" : "false"}">${label}</button>`).join("");
}

function reheatCondition(methods) {
  const method = typeof methods?.[0] === "string" ? methods[0].trim() : "";
  const normalized = String(method).toLowerCase();
  if (normalized === "microwave") return "微波复热";
  if (normalized === "lunch-box" || normalized === "meal-heater") return "加热饭盒复热";
  if (normalized === "cold") return "无需复热";
  return method || "复热方式待确认";
}

export function renderMealCard(slot, recipe, options = {}) {
  const isOutside = Boolean(slot?.outside);
  const title = isOutside ? "外出用餐" : (recipe?.title ?? "待安排餐食");
  const audience = options.audience ?? slot?.audience ?? "家庭餐";
  const isAvailable = Boolean(recipe) && !isOutside;
  const meta = isAvailable ? `${recipe.timing} · ${recipe.storage} · ${reheatCondition(recipe.reheatMethods)}` : (isOutside ? "本餐已标记为外出用餐，可取消恢复原安排" : "暂未安排，随时可以补充");
  const preference = isAvailable ? recipe.preferenceNotes?.[0] ?? "按家人口味微调" : (isOutside ? "不计入采购和备餐" : "从本周计划中补充");
  const image = isAvailable ? recipe?.image?.url : null;
  const slotId = escapeHtml(slot?.id ?? "");
  const swapFocusKey = escapeHtml(`${slot?.id ?? ""}:swap`);

  return `
    <article class="meal-card${isAvailable ? "" : " meal-card--empty"}">
      ${image ? `<div class="meal-card__image-wrap"><img class="meal-card__image" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span></div>` : ""}
      <div class="meal-card__body">
        <p class="meal-card__audience">${escapeHtml(audience)} · ${Math.max(1, slot?.servings ?? 1)} 份</p>
        ${isAvailable ? `<button type="button" class="meal-card__title" data-open-recipe="${escapeHtml(recipe.id)}">${escapeHtml(title)}</button>` : `<p class="meal-card__title">${escapeHtml(title)}</p>`}
        <p class="meal-card__meta">${escapeHtml(meta)}</p>
        <span class="meal-card__tag">${escapeHtml(preference)}</span>
        ${isAvailable ? `<button type="button" class="meal-card__recipe-action" data-open-recipe="${escapeHtml(recipe.id)}">查看做法</button>` : ""}
      </div>
      ${slot?.id ? `<button class="text-action" type="button" data-open-swap="${slotId}" data-swap-focus-key="${swapFocusKey}">换菜</button>` : ""}
    </article>`;
}

export { renderTomorrowView } from "./tomorrow-view.js";
export { renderWeekView } from "./week-view.js";
