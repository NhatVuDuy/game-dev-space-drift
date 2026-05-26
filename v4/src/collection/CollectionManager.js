import { loadCollection, saveCollection, loadRunStats } from '../storage/Storage.js';
import { calculateRolls, processRolls } from './DropSystem.js';

export function getCollection() {
  return loadCollection();
}

export function processEndOfRun() {
  const col = loadCollection();
  const runStats = loadRunStats();
  const rolls = calculateRolls(runStats);
  const activeTheme = col.activeTheme || 'space';

  const { drops, newState, pendingRolls } = processRolls(col, activeTheme, rolls);

  col.themes[activeTheme] = newState;
  col.pendingRolls = pendingRolls ?? 0;
  saveCollection(col);

  return { drops, collection: col };
}

export function switchTheme(themeId) {
  const col = loadCollection();
  if (!col.themes[themeId]) return;
  col.activeTheme = themeId;
  saveCollection(col);
}

export function exchangeDuplicates(themeId, targetItemId) {
  const col = loadCollection();
  const state = col.themes[themeId];
  if (!state || state.exchangeTokens < 1) return false;
  if (state.owned.includes(targetItemId)) return false;
  state.exchangeTokens--;
  state.owned.push(targetItemId);
  saveCollection(col);
  return true;
}
