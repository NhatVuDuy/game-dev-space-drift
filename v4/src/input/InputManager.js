import { initKeyboard, K } from './KeyboardInput.js';
import { initMouse, mouseX, clicking } from './MouseInput.js';
import { gyroX, tiltReady } from './TiltInput.js';
import { thrusting, btnX } from './TouchInput.js';

export { K };

let _isMob = false;
let _gyroSteer = false;

export function initInput(canvas) {
  initKeyboard();
  initMouse(canvas);
}

export function setMobile(val) { _isMob = val; }
export function setGyroSteer(val) { _gyroSteer = val; }

export function getSteer() {
  if (_gyroSteer && tiltReady) return gyroX;
  if (_isMob) return btnX;
  return (mouseX - 0.5) * 2; // -1 to 1
}

export function isThrusting() {
  if (_isMob) return thrusting;
  return clicking || K['Space'] || K['ArrowUp'];
}
