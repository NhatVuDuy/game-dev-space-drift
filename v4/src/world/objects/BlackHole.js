export function mkBlackHole(wy, W) {
  return {
    t: 'blackhole',
    wy,
    alive: 1,
    x: W * 0.2 + Math.random() * W * 0.6,
    r: 28 + Math.random() * 18,
    pull: 0.18,
    p: Math.random() * 6,
    rot: 0,
  };
}
