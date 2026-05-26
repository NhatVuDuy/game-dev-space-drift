import { getThemeItems } from './data/index.js';

const BASE_DROP_CHANCE = 0.02;
const PITY_THRESHOLD = 40;

export function calculateRolls(runStats) {
  let rolls = 1;
  if (runStats.stageReached >= 3) rolls++;
  if (runStats.gemsCollected >= 15) rolls++;
  if (runStats.maxAltitude >= 2000) rolls++;
  if (!runStats.usedContinue) rolls += 2;
  return rolls;
}

export function processRolls(collection, activeTheme, newRolls) {
  const state = collection.themes[activeTheme];
  if (!state) return { drops: [], newState: state };

  const items = getThemeItems(activeTheme);
  if (!items.length) return { drops: [], newState: state };

  let { owned, duplicates, pityCnt, exchangeTokens } = { ...state };
  owned = [...owned];
  duplicates = { ...duplicates };

  const totalRolls = (collection.pendingRolls || 0) + newRolls;
  const drops = [];

  for (let i = 0; i < totalRolls; i++) {
    pityCnt++;
    const hit = Math.random() < BASE_DROP_CHANCE || pityCnt >= PITY_THRESHOLD;

    if (!hit) continue;

    const unowned = items.filter(it => !owned.includes(it.id));
    if (!unowned.length) {
      // All collected — give exchange token
      exchangeTokens++;
      pityCnt = 0;
      drops.push({ type: 'token' });
      continue;
    }

    const pool = buildPool(pityCnt >= PITY_THRESHOLD ? unowned : items.filter(it => !owned.includes(it.id)));
    const item = pickFromPool(pool);
    if (!item) continue;

    pityCnt = 0;

    if (owned.includes(item.id)) {
      duplicates[item.id] = (duplicates[item.id] || 0) + 1;
      if (duplicates[item.id] >= 5) {
        exchangeTokens++;
        delete duplicates[item.id];
      }
      drops.push({ type: 'duplicate', item });
    } else {
      owned.push(item.id);
      drops.push({ type: 'new', item });
    }
  }

  return {
    drops,
    newState: { owned, duplicates, pityCnt, exchangeTokens },
    pendingRolls: 0,
  };
}

function buildPool(items) {
  const pool = [];
  for (const item of items) {
    const weight = Math.round(item.dropWeight * 100);
    for (let j = 0; j < weight; j++) pool.push(item);
  }
  return pool;
}

function pickFromPool(pool) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
