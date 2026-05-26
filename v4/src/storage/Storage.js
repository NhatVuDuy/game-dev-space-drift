const KEY_STATS = 'sd_stats';
const KEY_COLLECTION = 'sd_collection';
const KEY_RUN = 'sd_run_stats';
const KEY_THEME = 'sd_theme';
const KEY_GYRO = 'sd_gyro_mode';
const KEY_GAUGE = 'sd_gauge';

export function loadStats() {
  try { return JSON.parse(localStorage.getItem(KEY_STATS)) || {}; }
  catch { return {}; }
}

export function saveStats(score, stage, maxAlt) {
  try {
    const s = loadStats();
    const isNew = score > (s.best || 0);
    s.best   = Math.max(s.best   || 0, score);
    s.stBest = Math.max(s.stBest || 1, stage);
    s.games  = (s.games || 0) + 1;
    if (maxAlt !== undefined) s.maxAlt = Math.max(s.maxAlt || 0, maxAlt);
    localStorage.setItem(KEY_STATS, JSON.stringify(s));
    return isNew;
  } catch { return false; }
}

export function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem(KEY_COLLECTION)) || defaultCollection();
  } catch {
    return defaultCollection();
  }
}

export function saveCollection(data) {
  try { localStorage.setItem(KEY_COLLECTION, JSON.stringify(data)); } catch {}
}

export function loadRunStats() {
  try { return JSON.parse(localStorage.getItem(KEY_RUN)) || {}; }
  catch { return {}; }
}

export function saveRunStats(stats) {
  try { localStorage.setItem(KEY_RUN, JSON.stringify(stats)); } catch {}
}

export function getTheme() {
  return localStorage.getItem(KEY_THEME) || 'cartoon';
}

export function setTheme(key) {
  localStorage.setItem(KEY_THEME, key);
}

export function getGaugeSide() {
  return localStorage.getItem(KEY_GAUGE) || 'left';
}

export function setGaugeSide(side) {
  localStorage.setItem(KEY_GAUGE, side);
}

function defaultCollection() {
  return {
    version: 1,
    activeTheme: 'space',
    pendingRolls: 0,
    themes: {
      space: { owned: [], duplicates: {}, pityCnt: 0, exchangeTokens: 0 },
      animals: { owned: [], duplicates: {}, pityCnt: 0, exchangeTokens: 0 },
      dinosaurs: { owned: [], duplicates: {}, pityCnt: 0, exchangeTokens: 0 },
      flowers: { owned: [], duplicates: {}, pityCnt: 0, exchangeTokens: 0 },
      deep_sea: { owned: [], duplicates: {}, pityCnt: 0, exchangeTokens: 0 },
    },
  };
}
