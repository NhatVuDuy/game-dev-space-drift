export function mkStagePad(wy, stageNum, W) {
  return {
    t: 'stagepad',
    wy,
    alive: 1,
    x: W * 0.1 + Math.random() * W * 0.8,
    w: 90,
    h: 10,
    stageNum,
    fuelReserve: 100,
    p: Math.random() * 6,
  };
}
