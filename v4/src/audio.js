// Audio subsystem — Web Audio API synthesis
// AC (AudioContext) is private to this module.

let AC = null;

export function initAudio() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}

export function sfx(type) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    const t = AC.currentTime;
    if (type==='gem')   { o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(1320,t+.12); g.gain.setValueAtTime(.13,t); g.gain.exponentialRampToValueAtTime(.001,t+.2); o.start(t); o.stop(t+.2); }
    else if (type==='fuel')  { o.frequency.setValueAtTime(440,t); o.frequency.exponentialRampToValueAtTime(660,t+.1); g.gain.setValueAtTime(.1,t); g.gain.exponentialRampToValueAtTime(.001,t+.2); o.start(t); o.stop(t+.2); }
    else if (type==='boom')  { o.type='sawtooth'; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(28,t+.45); g.gain.setValueAtTime(.24,t); g.gain.exponentialRampToValueAtTime(.001,t+.5); o.start(t); o.stop(t+.5); }
    else if (type==='gate')  { [523,659,784].forEach((f,i)=>{ const oi=AC.createOscillator(),gi=AC.createGain(); oi.connect(gi); gi.connect(AC.destination); oi.frequency.value=f; gi.gain.setValueAtTime(.13,t+i*.09); gi.gain.exponentialRampToValueAtTime(.001,t+i*.09+.22); oi.start(t+i*.09); oi.stop(t+i*.09+.25); }); }
    else if (type==='stage') { [523,659,784,1047].forEach((f,i)=>{ const oi=AC.createOscillator(),gi=AC.createGain(); oi.connect(gi); gi.connect(AC.destination); oi.frequency.value=f; gi.gain.setValueAtTime(.16,t+i*.11); gi.gain.exponentialRampToValueAtTime(.001,t+i*.11+.28); oi.start(t+i*.11); oi.stop(t+i*.11+.32); }); }
    else if (type==='land')  { o.frequency.setValueAtTime(220,t); g.gain.setValueAtTime(.14,t); g.gain.exponentialRampToValueAtTime(.001,t+.3); o.start(t); o.stop(t+.3); }
    else if (type==='warp')  { o.type='sawtooth'; o.frequency.setValueAtTime(660,t); o.frequency.exponentialRampToValueAtTime(35,t+.8); g.gain.setValueAtTime(.22,t); g.gain.exponentialRampToValueAtTime(.001,t+.9); o.start(t); o.stop(t+.95); }
  } catch(e) {}
}

export function cinematicLaunchAudio(intensity) {
  if (!AC) return;
  try {
    const t = AC.currentTime;
    const dur = 0.75;
    const k = Math.max(0.6, Math.min(1.8, intensity || 1));

    const rum = AC.createOscillator();
    const rg = AC.createGain();
    rum.type = 'sawtooth';
    rum.frequency.setValueAtTime(58, t);
    rum.frequency.exponentialRampToValueAtTime(34, t + dur);
    rg.gain.setValueAtTime(0.0001, t);
    rg.gain.exponentialRampToValueAtTime(0.085 * k, t + 0.04);
    rg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    rum.connect(rg); rg.connect(AC.destination);
    rum.start(t); rum.stop(t + dur + 0.03);

    for (let i = 0; i < 5; i++) {
      const bt = t + 0.03 + i * 0.06;
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(220 + Math.random() * 260, bt);
      o.frequency.exponentialRampToValueAtTime(130 + Math.random() * 120, bt + 0.09);
      g.gain.setValueAtTime(0.0001, bt);
      g.gain.exponentialRampToValueAtTime((0.022 + Math.random() * 0.02) * k, bt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, bt + 0.1);
      o.connect(g); g.connect(AC.destination);
      o.start(bt); o.stop(bt + 0.11);
    }
  } catch(e) {}
}
