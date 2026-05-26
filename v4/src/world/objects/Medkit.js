export function mkMedkit(wy, W) {
  return {
    t: 'medkit',
    wy,
    alive: 1,
    x: W * 0.15 + Math.random() * W * 0.7,
    r: 11,
    p: Math.random() * 6,
    amount: 35,
  };
}
