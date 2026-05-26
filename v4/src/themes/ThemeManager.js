import { TH } from './themes.js';
import { getTheme, setTheme } from '../storage/Storage.js';

let _activeKey = getTheme();
export let T = TH[_activeKey] || TH.cartoon;

export function applyTheme(key) {
  if (!TH[key]) return;
  _activeKey = key;
  T = TH[key];
  setTheme(key);
}

export function getActiveKey() {
  return _activeKey;
}

export function getAllThemes() {
  return TH;
}
