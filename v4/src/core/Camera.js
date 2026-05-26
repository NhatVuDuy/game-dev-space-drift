export function updateCamera(G, H) {
  const target = G.ship.wy - H * 0.44;
  G.cam += (target - G.cam) * 0.08;
}

export function w2s(wy, cam, H) {
  return H - (wy - cam);
}
