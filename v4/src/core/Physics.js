import { CFG } from '../config/constants.js';

export function applyPhysics(ship, thrusting, W) {
  if (!ship.alive) return;

  ship.vy -= CFG.G;

  if (thrusting && ship.fuel > 0) {
    ship.vy += CFG.THR;
    ship.fuel = Math.max(0, ship.fuel - CFG.FBURN);
  }

  ship.wy += ship.vy;
  ship.x = Math.max(10, Math.min(W - 10, ship.x + ship.vx));

  if (ship.wy < 0) {
    ship.wy = 0;
    ship.vy = 0;
  }
}

export function applySteering(ship, steerDir, gyroX, isMob) {
  const lateral = isMob ? steerDir * 2.2 : gyroX;
  ship.vx = ship.vx * 0.82 + lateral * 0.18;
  ship.sideL = lateral < -0.3 ? Math.min(1, -lateral / 2) : 0;
  ship.sideR = lateral > 0.3  ? Math.min(1,  lateral / 2) : 0;
}
