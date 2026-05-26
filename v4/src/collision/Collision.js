import { SR } from '../config/constants.js';

export function checkCollisions(G, onAsteroidHit, onGateScore, onPickup, onStageLand, onBlackHole) {
  if (!G.ship.alive || G.exploding) return;

  const sx = G.ship.x, swy = G.ship.wy;

  for (const o of G.objs) {
    if (!o.alive) continue;

    if (o.t === 'ast') {
      const dx = sx - o.x, dy = swy - o.wy;
      if (Math.sqrt(dx * dx + dy * dy) < SR + o.r - 4) {
        if (G.hitGrace <= 0) onAsteroidHit(o);
      }
    }

    else if (o.t === 'gate') {
      if (!o.scored && Math.abs(swy - o.wy) < 12) {
        if (sx >= o.x && sx <= o.x + o.w) {
          o.scored = true;
          onGateScore(o);
        }
      }
    }

    else if (o.t === 'stagepad') {
      if (G.ship.vy <= 0 && Math.abs(swy - (o.wy + o.h)) < SR + 4 && sx >= o.x - 10 && sx <= o.x + o.w + 10) {
        if (Math.abs(G.ship.vy) < 2.5) onStageLand(o);
      }
    }

    else if (o.t === 'gem' || o.t === 'fuel' || o.t === 'medkit') {
      const dx = sx - o.x, dy = swy - o.wy;
      if (Math.sqrt(dx * dx + dy * dy) < SR + o.r) {
        o.alive = 0;
        onPickup(o);
      }
    }

    else if (o.t === 'blackhole') {
      const dx = sx - o.x, dy = swy - o.wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < o.r * 3) onBlackHole(o, dist);
    }
  }
}
