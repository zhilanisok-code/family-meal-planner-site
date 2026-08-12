import { RECIPES } from "../data/recipes.js";
import { escapeHtml } from "./components.js";

const roleLabels = {
  adult: "成人",
  child: "孩子",
  senior: "长辈",
};

const ingredients = [...new Map(
  RECIPES.flatMap((recipe) => recipe.ingredients).map((ingredient) => [ingredient.id, ingredient]),
).values()].sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));

export function renderSettingsView(state) {
  const profile = state.profile;
  const avoidedIds = new Set(profile.preferences.avoidIngredientIds);

  return `
    <header class="view-header settings-header"><div><p class="view-eyebrow">仅保存在本机</p><h1 class="view-title" tabindex="-1" data-view-focus="settings">家庭设置</h1></div><button type="button" class="secondary-action" data-route="tomorrow">完成</button></header>
    <p class="settings-intro">这些普通饮食偏好只影响以后生成的菜单，不会改写已确认计划。</p>
    <section class="settings-panel" aria-labelledby="household-settings-title">
      <div class="section-heading"><h2 id="household-settings-title">家庭成员与默认份数</h2><span>${profile.members.length} 人</span></div>
      <div class="settings-members">${profile.members.map((member) => `<div class="settings-member"><label><span>称呼</span><input type="text" maxlength="20" value="${escapeHtml(member.label)}" data-member-label="${escapeHtml(member.id)}" aria-label="家庭成员称呼"></label><label><span>${escapeHtml(roleLabels[member.role] ?? member.role)}默认份数</span><input type="number" min="1" max="8" step="1" value="${member.defaultServings}" data-member-servings="${escapeHtml(member.id)}" aria-label="${escapeHtml(member.label)}默认份数"></label></div>`).join("")}</div>
    </section>
    <section class="settings-panel" aria-labelledby="meal-settings-title">
      <div class="section-heading"><h2 id="meal-settings-title">工作日安排</h2><span>生成时使用</span></div>
      <label class="settings-toggle"><span><b>工作午餐</b><small>周一至周五</small></span><input type="checkbox" data-workday-preference="workdayLunch" ${profile.preferences.workdayLunch ? "checked" : ""}></label>
      <label class="settings-toggle"><span><b>全家晚餐</b><small>周一至周五</small></span><input type="checkbox" data-workday-preference="workdayDinner" ${profile.preferences.workdayDinner ? "checked" : ""}></label>
    </section>
    <section class="settings-panel" aria-labelledby="avoid-settings-title">
      <div class="section-heading"><h2 id="avoid-settings-title">避免食材</h2><span>普通偏好</span></div>
      <p class="settings-help">勾选后，之后生成的新建议会避开这些食材；手工安排仍会保留。</p>
      <div class="avoid-grid">${ingredients.map((ingredient) => `<label><input type="checkbox" data-avoid-ingredient="${escapeHtml(ingredient.id)}" ${avoidedIds.has(ingredient.id) ? "checked" : ""}><span>${escapeHtml(ingredient.name)}</span></label>`).join("")}</div>
    </section>`;
}
