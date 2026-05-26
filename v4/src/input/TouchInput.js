export let thrusting = false;
export let btnX = 0; // -1 = left, 0 = none, 1 = right

export function initTouch() {
  // Touch events delegated to inline handlers on buttons in HTML
  // This module exposes setters for the button handlers to call
}

export function setThrusting(val) { thrusting = val; }
export function setBtnX(val) { btnX = val; }
