export function mkFuel(wy, W) {
  return {
    t: 'fuel',
    wy,
    alive: 1,
    x: W * 0.1 + Math.random() * W * 0.8,
    r: 10,
    p: Math.random() * 6,
    amount: 38,
  };
}
