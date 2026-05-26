let _ctx = null;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  return c;
}

export function sfx(type, freq = 440, duration = 0.12, vol = 0.18) {
  try {
    const c = resumeCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, c.currentTime + duration);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

export function playGateSound() {
  sfx('sine', 880, 0.1, 0.14);
  setTimeout(() => sfx('sine', 1100, 0.08, 0.10), 60);
}

export function playPickupSound() {
  sfx('sine', 660, 0.09, 0.12);
}

export function playCrashSound() {
  sfx('sawtooth', 180, 0.4, 0.25);
  setTimeout(() => sfx('square', 90, 0.3, 0.18), 80);
}

export function playThrustSound() {
  sfx('sawtooth', 120, 0.05, 0.06);
}

export function playLandSound() {
  sfx('sine', 330, 0.18, 0.22);
  setTimeout(() => sfx('sine', 440, 0.12, 0.15), 100);
}
