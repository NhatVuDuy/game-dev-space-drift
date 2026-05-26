const K = {};
let _mouseX = 0.5;
let _clicking = false;
let _thrusting = false;
let _btnX = 0;
let _gyroX = 0;
let _gyroReady = false;
let _gyroBound = false;
let _gyroMode = localStorage.getItem('sd_gyro_mode') || 'roll';
let _gyroOffset = parseFloat(localStorage.getItem(`sd_gyro_offset_${_gyroMode}`) || '0') || 0;
let _gyroInvert = localStorage.getItem('sd_gyro_invert') === '1' ? -1 : 1;

export function initInput() {
  document.addEventListener('keydown', e => {
    K[e.code] = true;
    if (['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { K[e.code] = false; });
  document.addEventListener('mousemove', e => { _mouseX = e.clientX / window.innerWidth; });
  document.addEventListener('mousedown', e => { if (e.target.tagName === 'CANVAS') _clicking = true; });
  document.addEventListener('mouseup', () => { _clicking = false; });

  // Thr button (touch)
  const thr = document.getElementById('thr');
  if (thr) {
    thr.addEventListener('touchstart', e => { e.preventDefault(); _thrusting = true; thr.classList.add('on'); }, { passive: false });
    thr.addEventListener('touchend',   e => { e.preventDefault(); _thrusting = false; thr.classList.remove('on'); }, { passive: false });
    thr.addEventListener('mousedown',  () => { _thrusting = true;  thr.classList.add('on'); });
    thr.addEventListener('mouseup',    () => { _thrusting = false; thr.classList.remove('on'); });
  }

  autoDetectGyro();
}

function autoDetectGyro() {
  if (!isMobile()) return;
  if (typeof DeviceOrientationEvent === 'undefined') return;
  if (typeof DeviceOrientationEvent.requestPermission === 'function') return; // iOS: request on user gesture
  if (localStorage.getItem('sd_tilt') === '1') { bindGyro(); return; }
  // Android: probe
  let done = false;
  const probe = e => {
    if (done) return; done = true;
    window.removeEventListener('deviceorientation', probe);
    if (e.beta !== null || e.gamma !== null) { bindGyro(); localStorage.setItem('sd_tilt', '1'); }
  };
  window.addEventListener('deviceorientation', probe);
  setTimeout(() => { if (!done) { done = true; window.removeEventListener('deviceorientation', probe); } }, 2000);
}

export function bindGyro() {
  if (_gyroBound) return;
  _gyroBound = true;
  window.addEventListener('deviceorientation', e => {
    const raw = _gyroMode === 'roll' ? (e.gamma || 0) : (e.alpha || 0);
    _gyroX = Math.max(-1, Math.min(1, (raw - _gyroOffset) / 28)) * _gyroInvert;
    _gyroReady = true;
  });
  // Hide steer buttons when gyro active
  ['btn-left','btn-right'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

export async function requestGyroPermission() {
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') { bindGyro(); localStorage.setItem('sd_tilt', '1'); return true; }
    } catch {}
    return false;
  }
  bindGyro();
  return true;
}

export function steer(v) {
  _btnX = v;
  document.getElementById('btn-left')?.classList.toggle('on',  v === -1);
  document.getElementById('btn-right')?.classList.toggle('on', v ===  1);
}
window.steer = steer;

export function isMobile() {
  return window.innerWidth < 820 || 'ontouchstart' in window;
}

export class InputSystem {
  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const input = world.get(player, 'player');

    // Thrust
    input.thrusting = _thrusting || _clicking
      || K['Space'] || K['ArrowUp'] || K['KeyW'];

    // Steer: gyro > buttons > mouse > keyboard
    if (_gyroReady) {
      input.steer = _gyroX;
    } else if (isMobile()) {
      input.steer = _btnX;
    } else {
      input.steer = (_mouseX - 0.5) * 2; // -1..1
      if (K['ArrowLeft'] || K['KeyA']) input.steer = -1;
      if (K['ArrowRight']|| K['KeyD']) input.steer =  1;
    }
  }
}
