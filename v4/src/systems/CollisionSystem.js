import { SR, CFG, STAGE_GATES } from '../config/constants.js';

export class CollisionSystem {
  constructor(onEvent) {
    this._onEvent = onEvent; // callback(type, data)
  }

  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const pos    = world.get(player, 'position');
    const state  = world.get(player, 'state');
    const fuel   = world.get(player, 'fuel');
    const armor  = world.get(player, 'armor');

    if (!state.alive) return;

    const sx = pos.x, sy = pos.y;

    // ── Asteroids ──
    for (const id of world.query('asteroid', 'alive', 'position')) {
      if (!world.get(id, 'alive').v) continue;
      const ap  = world.get(id, 'position');
      const ast = world.get(id, 'asteroid');
      const col = world.get(id, 'collider');
      const dx  = sx - ap.x, dy = sy - ap.y;
      if (dx*dx + dy*dy < (SR + col.radius) * (SR + col.radius)) {
        if (state.hitGrace <= 0) {
          const dmg = ast.danger ? Math.round(5 + ast.radius * 0.7) : Math.round(2 + ast.radius * 0.25);
          armor.hp  = Math.max(0, armor.hp - dmg);
          state.hitGrace = 55;
          this._onEvent('asteroid_hit', { dmg, danger: ast.danger });
          if (armor.hp <= 0) { state.alive = false; state.dead = true; this._onEvent('death', {}); }
        }
      }
    }
    if (state.hitGrace > 0) state.hitGrace--;

    // ── Gates ──
    for (const id of world.query('gate', 'alive')) {
      const gate = world.get(id, 'gate');
      if (gate.scored) continue;
      if (Math.abs(sy - gate.alt) < 14) {
        const left  = gate.x - gate.width / 2;
        const right = gate.x + gate.width / 2;
        if (sx >= left + SR && sx <= right - SR) {
          gate.scored = true;
          state.score    += 100 * state.stageN;
          state.normGates = (state.normGates || 0) + 1;
          this._onEvent('gate', { score: state.score, gates: state.normGates });
        }
      }
    }

    // ── Stage pads (landing) ──
    if (!state.refueling) {
      for (const id of world.query('stagepad', 'alive')) {
        const pad = world.get(id, 'stagepad');
        const pp  = world.get(id, 'position');
        const padTop = pp.y + pad.height / 2;
        if (sy <= padTop + SR + 4 && sy >= padTop - 4
            && sx >= pp.x - pad.width/2 - 10 && sx <= pp.x + pad.width/2 + 10
            && world.get(player, 'velocity').vy <= 0
            && Math.abs(world.get(player, 'velocity').vy) < 2.8) {
          this._onEvent('land', { pad, padEntity: id });
        }
      }
    }

    // ── Pickups ──
    for (const id of world.query('pickup', 'collider', 'alive')) {
      if (!world.get(id, 'alive').v) continue;
      const pp  = world.get(id, 'position');
      const col = world.get(id, 'collider');
      const pickup = world.get(id, 'pickup');
      const dx = sx - pp.x, dy = sy - pp.y;
      if (dx*dx + dy*dy < (SR + col.radius) * (SR + col.radius)) {
        world.get(id, 'alive').v = false;
        if (pickup.type === 'fuel')   fuel.amount  = Math.min(fuel.max,  fuel.amount  + pickup.amount);
        if (pickup.type === 'medkit') armor.hp     = Math.min(armor.max, armor.hp     + pickup.amount);
        if (pickup.type === 'gem')    { state.score += 10 * state.stageN; state.gems = (state.gems||0) + 1; }
        this._onEvent('pickup', { type: pickup.type, amount: pickup.amount });
      }
    }

    // ── Black holes ──
    for (const id of world.query('blackhole', 'alive', 'position')) {
      const bh = world.get(id, 'blackhole');
      const bp = world.get(id, 'position');
      const vel= world.get(player, 'velocity');
      const dx = bp.x - sx, dy = bp.y - sy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const pullZone = bh.radius * 3.5;
      if (dist < pullZone) {
        const force = bh.pull * (1 - dist / pullZone);
        vel.vx += (dx / dist) * force;
        vel.vy += (dy / dist) * force;
        this._onEvent('blackhole_near', { dist, radius: bh.radius });
        if (dist < bh.radius * 0.7) {
          state.alive = false; state.dead = true;
          this._onEvent('death', { cause: 'blackhole' });
        }
      }
    }
  }
}
