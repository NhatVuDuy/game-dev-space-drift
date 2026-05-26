import { spaceItems } from './space.js';

export const THEMES_DATA = {
  space: { id:'space', name:'Space', icon:'🌌', items: spaceItems },
  animals: { id:'animals', name:'Animals', icon:'🦁', items: [] },    // Phase 2
  dinosaurs: { id:'dinosaurs', name:'Dinosaurs', icon:'🦕', items: [] }, // Phase 2
  flowers: { id:'flowers', name:'Flowers', icon:'🌸', items: [] },    // Phase 2
  deep_sea: { id:'deep_sea', name:'Deep Sea', icon:'🦑', items: [] }, // Phase 2
};

export function getThemeItems(themeId) {
  return THEMES_DATA[themeId]?.items ?? [];
}
