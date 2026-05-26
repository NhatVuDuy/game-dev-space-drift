import { getCollection, switchTheme, exchangeDuplicates } from './CollectionManager.js';
import { THEMES_DATA, getThemeItems } from './data/index.js';

export function showCollectionScreen(containerId = 'app') {
  const col = getCollection();
  const activeTheme = col.activeTheme;
  const state = col.themes[activeTheme];
  const items = getThemeItems(activeTheme);
  const owned = state.owned;
  const pct = items.length ? Math.round(owned.length / items.length * 100) : 0;

  const el = document.getElementById(containerId) || document.body;
  el.innerHTML = buildHTML(col, activeTheme, items, owned, pct, state);
  bindEvents();
}

function buildHTML(col, activeTheme, items, owned, pct, state) {
  const theme = THEMES_DATA[activeTheme];
  const themeTabsHtml = Object.values(THEMES_DATA).map(t =>
    `<button class="col-tab ${t.id === activeTheme ? 'on' : ''}" data-theme="${t.id}">${t.icon} ${t.name}</button>`
  ).join('');

  const itemsHtml = items.map(item => {
    const has = owned.includes(item.id);
    return `<div class="col-item ${item.rarity} ${has ? 'owned' : 'locked'}" data-id="${item.id}">
      <div class="col-art">${has ? item.art : '?'}</div>
      ${has ? `<div class="col-name">${item.name}</div>` : ''}
    </div>`;
  }).join('');

  return `
    <div class="col-screen">
      <div class="col-header">
        <div class="col-title">${theme.icon} ${theme.name}</div>
        <div class="col-count">${owned.length} / ${items.length} &nbsp; ${pct}%</div>
      </div>
      <div class="col-bar"><div class="col-bar-fill" style="width:${pct}%"></div></div>
      <div class="col-tabs">${themeTabsHtml}</div>
      <div class="col-grid">${itemsHtml}</div>
      <div class="col-footer">
        ${state.exchangeTokens ? `<div class="col-tokens">🔄 ${state.exchangeTokens} exchange tokens</div>` : ''}
        <button class="scb fly" onclick="window.hideCollectionScreen()">BACK</button>
      </div>
    </div>`;
}

function bindEvents() {
  document.querySelectorAll('.col-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTheme(btn.dataset.theme);
      showCollectionScreen();
    });
  });
}

window.hideCollectionScreen = function() {
  const el = document.getElementById('col-screen-overlay');
  if (el) el.remove();
};
