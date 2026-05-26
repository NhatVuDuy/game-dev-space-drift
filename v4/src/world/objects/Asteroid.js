import { phash } from '../phash.js';

export function mkAst(wy, W, seed) {
  const danger = Math.random() < 0.22;
  const r = danger ? 9 + Math.random() * 9 : 22 + Math.random() * 12;
  const id = seed ?? Math.random() * 9999;
  const verts = 7 + Math.floor(phash(id) * 5);
  const pts = [];
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const amp = danger ? 0.55 + phash(id * 3.1 + i) * 0.45
                       : 0.22 + phash(id * 2.7 + i) * 0.78;
    pts.push({ a, r: r * amp });
  }
  return {
    t: 'ast',
    wy,
    alive: 1,
    x: W * 0.07 + Math.random() * W * 0.86,
    r,
    danger,
    pts,
    id,
    vx: (Math.random() - 0.5) * (danger ? 1.4 : 0.5),
    vy: 0,
    rot: Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * (danger ? 0.045 : 0.012),
    p: Math.random() * 6,
  };
}
