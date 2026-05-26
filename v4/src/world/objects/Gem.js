export function mkGem(wy, W) {
  return {
    t: 'gem',
    wy,
    alive: 1,
    x: W * 0.1 + Math.random() * W * 0.8,
    r: 8,
    p: Math.random() * 6,
    rot: 0,
    value: 10,
  };
}
