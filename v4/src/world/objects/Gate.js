export function mkGate(wy, W) {
  const gw = 80 + Math.random() * 60;
  const x = W * 0.1 + Math.random() * (W * 0.8 - gw);
  return { t: 'gate', wy, alive: 1, x, w: gw, scored: false };
}

export function mkWall(wy, W) {
  return { t: 'wall', wy, alive: 1, x: 0, w: W };
}
