import { mkAst } from './objects/Asteroid.js';
import { mkGate } from './objects/Gate.js';
import { mkStagePad } from './objects/StagePad.js';
import { mkBlackHole } from './objects/BlackHole.js';
import { mkGem } from './objects/Gem.js';
import { mkFuel } from './objects/Fuel.js';
import { mkMedkit } from './objects/Medkit.js';
import { CFG } from '../config/constants.js';

let lastGen = 0;
let nextGateAlt = CFG.GSPC;

export function resetWorldGen() {
  lastGen = 0;
  nextGateAlt = CFG.GSPC;
}

export function genWorld(G, W) {
  const horizon = G.cam + 900;
  if (horizon <= lastGen) return;

  const from = lastGen;
  const to = horizon;

  for (let alt = Math.ceil(from / 80) * 80; alt < to; alt += 80) {
    // Asteroids
    if (Math.random() < 0.45) {
      G.objs.push(mkAst(alt + Math.random() * 60, W));
    }

    // Gems
    if (Math.random() < 0.18) {
      G.objs.push(mkGem(alt + Math.random() * 70, W));
    }

    // Fuel
    if (Math.random() < 0.06) {
      G.objs.push(mkFuel(alt + Math.random() * 60, W));
    }

    // Medkits (rare)
    if (Math.random() < 0.12) {
      G.objs.push(mkMedkit(alt + Math.random() * 180, W));
    }
  }

  // Gates at fixed intervals
  while (nextGateAlt < to) {
    G.objs.push(mkGate(nextGateAlt, W));
    nextGateAlt += CFG.GSPC;

    // Stage pad every 3 gates
    if (G.gatesN > 0 && G.gatesN % 3 === 0) {
      G.objs.push(mkStagePad(nextGateAlt - CFG.GSPC / 2, G.stgN, W));
    }

    // Black holes past stage 2
    if (G.stgN >= 2 && Math.random() < 0.3) {
      G.objs.push(mkBlackHole(nextGateAlt - CFG.GSPC * 0.7, W));
    }
  }

  lastGen = to;
  G.objs = G.objs.filter(o => o.alive && o.wy > G.cam - 200);
}
