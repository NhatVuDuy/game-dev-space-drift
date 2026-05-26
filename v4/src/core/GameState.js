import { CFG } from '../config/constants.js';

export const G = {
  ship: {
    x: 0, wy: 0,
    vx: 0, vy: 0,
    fuel: CFG.FMAX,
    angle: 0,
    alive: false,
    shields: 0,
    sideL: 0, sideR: 0,
    ta: 0,
  },
  cam: 0,
  tick: 0,
  objs: [],
  parts: [],
  exh: [],
  score: 0,
  gatesN: 0,
  stgN: 1,
  over: false,
  exploding: false,
  refueling: false,
  refuelPad: null,
  armor: 100,
  hitGrace: 0,
  bhWarping: false,
  bhWarpPhase: null,
  bhWarpScale: 1,
  bhWarpTarget: null,
  bhCrashShrink: false,
  stgTrans: false,
  awaitChoice: false,
  launchCharge: 0,
  landMistTick: 0,
  landMistPad: null,
};

export function resetGame(W, H) {
  G.ship.x = W / 2;
  G.ship.wy = 180;
  G.ship.vx = 0;
  G.ship.vy = 0;
  G.ship.fuel = CFG.FMAX;
  G.ship.angle = 0;
  G.ship.alive = true;
  G.ship.shields = 0;
  G.ship.sideL = 0;
  G.ship.sideR = 0;
  G.ship.ta = 0.45;
  G.cam = 0;
  G.tick = 0;
  G.objs = [];
  G.parts = [];
  G.exh = [];
  G.score = 0;
  G.gatesN = 0;
  G.stgN = 1;
  G.over = false;
  G.exploding = false;
  G.refueling = true;
  G.refuelPad = null;
  G.armor = 100;
  G.hitGrace = 0;
  G.bhWarping = false;
  G.bhWarpPhase = null;
  G.bhWarpScale = 1;
  G.bhWarpTarget = null;
  G.bhCrashShrink = false;
  G.stgTrans = false;
  G.awaitChoice = false;
  G.launchCharge = 0;
  G.landMistTick = 0;
  G.landMistPad = null;
}
