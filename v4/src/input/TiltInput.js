export let gyroX = 0;
export let tiltReady = false;
export let gyroMode = localStorage.getItem('sd_gyro_mode') || 'roll';
export let gyroInvert = localStorage.getItem('sd_gyro_invert') === '1' ? -1 : 1;
export let gyroOffset = parseFloat(localStorage.getItem(`sd_gyro_offset_${gyroMode}`) || '0') || 0;

let _bound = false;

function onOrientation(e) {
  const raw = gyroMode === 'roll' ? (e.gamma ?? 0) : (e.alpha ?? 0);
  gyroX = Math.max(-1, Math.min(1, ((raw - gyroOffset) / 25) * gyroInvert));
}

export async function requestTiltPermission() {
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') bindGyro();
      return res === 'granted';
    } catch {
      return false;
    }
  }
  bindGyro();
  return true;
}

export function bindGyro() {
  if (_bound) return;
  _bound = true;
  window.addEventListener('deviceorientation', onOrientation);
  tiltReady = true;
}

export function setGyroOffset(val) {
  gyroOffset = val;
  localStorage.setItem(`sd_gyro_offset_${gyroMode}`, String(val));
}

export function setGyroMode(mode) {
  gyroMode = mode;
  gyroOffset = parseFloat(localStorage.getItem(`sd_gyro_offset_${mode}`) || '0') || 0;
  localStorage.setItem('sd_gyro_mode', mode);
}

export function setGyroInvert(invert) {
  gyroInvert = invert ? -1 : 1;
  localStorage.setItem('sd_gyro_invert', invert ? '1' : '0');
}
