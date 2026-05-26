// Seeded deterministic PRNG — same seed always produces same shape
export function phash(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
