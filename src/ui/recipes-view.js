import { RECIPES } from "../data/recipes.js";
import { addDays, isoToday, isWeekday } from "../domain/calendar.js";
import { adjustIngredients } from "../domain/planner.js";
import { compatibleRecipesForSlot } from "../domain/scheduler.js";
import { escapeHtml } from "./components.js";
import { workMealLabel } from "./meal-labels.js";

const SCENARIOS = [
  ["夫妻带饭", ["成人工作餐", "便携午餐"], "🍱"],
  ["快速早餐", ["工作日早餐", "快速备餐"], "🍞"],
  ["家庭晚餐", ["家庭晚餐", "快速晚餐", "一锅饭"], "🥘"],
  ["周末备餐", ["一锅饭", "冰箱常备", "周末午餐"], "❄️"],
];

const scenarioNames = new Map(SCENARIOS.map(([label, tags]) => [label, tags]));

function firstReheat(recipe) {
  return recipe.reheatMethods?.[0] ?? "复热方式待确认";
}

function normalize(value) {
  return String(value ?? "").toLocaleLowerCase();
}

export function recipeAssignmentLabel(target) {
  if (!target) return "工作午餐";
  if (!target.workMeal) return "家庭餐";
  return target.mealType === "dinner" ? "工作晚餐" : "工作午餐";
}

export function recipeScenarioLabels(recipe) {
  return [...new Set((recipe.scenarios ?? []).flatMap((scenario) => {
    if (scenario !== "成人工作餐") return scenario;
    const mealLabels = (recipe.mealTypes ?? []).map((mealType) => workMealLabel({ workMeal: true, mealType }));
    return mealLabels.length ? mealLabels : "工作餐";
  }))];
}

export function filterRecipes(recipes, scenario, query) {
  const tags = scenarioNames.get(scenario);
  const needle = normalize(query).trim();
  return recipes.filter((recipe) => {
    const scenarioMatches = !tags || recipe.scenarios?.some((tag) => tags.includes(tag));
    const searchMatches = !needle || [recipe.title, ...(recipe.ingredients ?? []).map((item) => item.name)]
      .some((value) => normalize(value).includes(needle));
    return scenarioMatches && searchMatches;
  });
}

function renderRecipeCard(recipe, index) {
  const focusKey = `${recipe.id}:result:${index}`;
  return `<article class="recipe-card">
    <img src="${escapeHtml(recipe.image.url)}" alt="${escapeHtml(recipe.title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span>
    <div class="recipe-card__copy"><h2>${escapeHtml(recipe.title)}</h2><p>${escapeHtml(recipe.timing)} · ${escapeHtml(recipe.storage)}</p><p>${escapeHtml(firstReheat(recipe))}</p><span>${escapeHtml(recipe.preferenceNotes?.[0] ?? "按家人口味微调")}</span></div>
    <button type="button" class="recipe-card__open" data-open-recipe="${escapeHtml(recipe.id)}" data-recipe-focus-key="${escapeHtml(focusKey)}">查看菜谱</button>
  </article>`;
}

export function renderRecipesView(state) {
  const assignmentTarget = state.recipeAssignmentTarget;
  const availableRecipes = assignmentTarget
    ? compatibleRecipesForSlot({ recipes: RECIPES, profile: state.profile, slot: assignmentTarget })
    : RECIPES;
  const recipes = filterRecipes(availableRecipes, state.recipeScenario, state.recipeSearch);
  const hero = recipes[0];
  const isEmpty = recipes.length === 0;
  const assignment = assignmentTarget
    ? `<section class="recipe-assignment" aria-label="当前安排目标"><div><span>正在安排</span><strong>明日${recipeAssignmentLabel(assignmentTarget)}</strong></div><button type="button" data-cancel-recipe-assignment>返回明日</button></section>`
    : "";
  return `<header class="view-header recipe-library-header"><p class="view-eyebrow">我们家的菜谱</p><h1 class="view-title">今天想吃什么</h1></header>
    ${assignment}
    <label class="recipe-search"><span aria-hidden="true">⌕</span><input type="search" data-recipe-search value="${escapeHtml(state.recipeSearch)}" placeholder="搜索菜名或食材" aria-label="搜索菜名或食材"></label>
    <section class="scenario-panel" aria-label="按用餐场景找"><div class="section-heading"><h2>按用餐场景找</h2><span>从家常安排里筛选</span></div><div class="scenario-grid">${SCENARIOS.map(([label, , icon]) => `<button type="button" data-recipe-scenario="${label}" aria-pressed="${state.recipeScenario === label}"><i aria-hidden="true">${icon}</i><span>${label}</span></button>`).join("")}</div></section>
    ${isEmpty ? `<section class="recipe-empty"><p>暂无符合条件的家常菜</p><button type="button" data-clear-recipe-filter>清除筛选</button></section>` : `<section class="recipe-hero"><img src="${escapeHtml(hero.image.url)}" alt="${escapeHtml(hero.title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span><div><p>本周优先推荐</p><h2>${escapeHtml(hero.title)}</h2><span>${escapeHtml(hero.timing)} · ${escapeHtml(firstReheat(hero))}</span><button type="button" data-open-recipe="${escapeHtml(hero.id)}" data-recipe-focus-key="${escapeHtml(`${hero.id}:hero`)}">查看菜谱</button></div></section><section class="recipe-results"><div class="section-heading"><h2>家常菜结果</h2><span>${recipes.length} 道</span></div>${recipes.map(renderRecipeCard).join("")}</section>`}`;
}

export function renderRecipeDetail(state, recipe, { today = isoToday() } = {}) {
  const servings = Math.min(8, Math.max(1, state.previewServings ?? recipe.servingBase));
  const ingredients = adjustIngredients(recipe, servings);
  const assignmentTarget = state.recipeAssignmentTarget;
  const assignmentLabel = recipeAssignmentLabel(assignmentTarget);
  const isCompatible = !assignmentTarget || compatibleRecipesForSlot({ recipes: [recipe], profile: state.profile, slot: assignmentTarget }).length === 1;
  const canUseDirectWorkLunch = Boolean(assignmentTarget) || isWeekday(addDays(today, 1));
  const canAdd = isCompatible && canUseDirectWorkLunch;
  const addLabel = canUseDirectWorkLunch
    ? `加入明日${assignmentLabel}`
    : "周末请从明日页选择家庭餐";
  const addHint = assignmentTarget
    ? "选好后会回到明日安排，并同步采购清单。"
    : canUseDirectWorkLunch
      ? "明日工作午餐为空时自动新建；已有安排时替换。"
      : "返回明日，从家庭餐空位选择菜谱。";
  return `<article class="recipe-detail">
    <div class="recipe-detail__hero"><img src="${escapeHtml(recipe.image.url)}" alt="${escapeHtml(recipe.title)}" data-food-image><span class="image-fallback" hidden>菜图暂不可用</span><button type="button" class="recipe-detail__back" data-close-recipe aria-label="返回菜谱列表">‹</button></div>
    <div class="recipe-detail__body"><a class="recipe-source" href="${escapeHtml(recipe.image.sourceUrl)}" target="_blank" rel="noreferrer">图片来源：Unsplash · ${escapeHtml(recipe.image.author)}</a><h1>${escapeHtml(recipe.title)}</h1><p class="recipe-detail__scenarios">${escapeHtml(recipeScenarioLabels(recipe).join(" · "))}</p><div class="recipe-tags"><span>${escapeHtml(recipe.timing)}</span><span>${escapeHtml(recipe.storage)}</span><span>${escapeHtml(firstReheat(recipe))}</span></div>
      <section class="recipe-portions"><h2>食材份量</h2><div><button type="button" data-preview-serving-delta="-1" aria-label="减少份数" ${servings === 1 ? "disabled" : ""}>−</button><strong>${servings} 份</strong><button type="button" data-preview-serving-delta="1" aria-label="增加份数" ${servings === 8 ? "disabled" : ""}>＋</button></div></section>
      <section class="recipe-ingredients"><h2>准备食材</h2>${ingredients.map((item) => `<div><span>${escapeHtml(item.name)}</span><strong>${escapeHtml(item.displayQty)}</strong></div>`).join("")}</section>
      <section class="recipe-steps"><h2>做法 · ${Math.min(5, recipe.steps.length)} 步</h2>${recipe.steps.slice(0, 5).map((step, index) => `<div class="recipe-step" data-recipe-step="${index + 1}"><b>${index + 1}</b><p>${escapeHtml(step)}</p></div>`).join("")}</section>
      <aside class="recipe-note"><b>家常提示</b>${recipe.generalNotes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}</aside>
      ${state.recipeActionMessage ? `<p class="recipe-action-message" role="status">${escapeHtml(state.recipeActionMessage)}</p>` : ""}
      <button type="button" class="recipe-add" data-add-recipe ${canAdd ? "" : "disabled"}>${isCompatible ? addLabel : `不适合明日${assignmentLabel}`}</button><p class="recipe-add__hint">${addHint}</p>
    </div>
  </article>`;
}
