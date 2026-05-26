export const K = {};

export function initKeyboard() {
  window.addEventListener('keydown', e => { K[e.code] = true; });
  window.addEventListener('keyup',   e => { K[e.code] = false; });
}
