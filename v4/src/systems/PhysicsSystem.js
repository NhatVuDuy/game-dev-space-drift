import { CFG } from '../config/constants.js';

export class PhysicsSystem {
  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const input    = world.get(player, 'player');
    const pos      = world.get(player, 'position');
    const vel      = world.get(player, 'velocity');
    const fuel     = world.get(player, 'fuel');
    const state    = world.get(player, 'state');

    if (!state.alive || state.refueling) return;

    // Gravity
    vel.vy -= CFG.G;

    // Thrust
    const canThrust = input.thrusting && fuel.amount > 0;
    if (canThrust) {
      vel.vy += CFG.THR;
      fuel.amount = Math.max(0, fuel.amount - CFG.FBURN);
    }
    state.thrusting = canThrust;

    // Horizontal steering
    const targetVx = input.steer * 2.4;
    vel.vx += (targetVx - vel.vx) * 0.14;

    // Clamp horizontal speed
    vel.vx = Math.max(-4.5, Math.min(4.5, vel.vx));

    // Apply velocity
    pos.y += vel.vy;
    pos.x += vel.vx;

    // Screen bounds (wrap x)
    const { W } = world.globals;
    if (pos.x < 0)  pos.x = 0;
    if (pos.x > W)  pos.x = W;

    // Tilt indicator
    const sideL = vel.vx < -0.3 ? Math.min(1, -vel.vx / 3) : 0;
    const sideR = vel.vx >  0.3 ? Math.min(1,  vel.vx / 3) : 0;
    state.sideL = sideL;
    state.sideR = sideR;
    state.thrustPower = canThrust ? Math.min(1, fuel.amount / fuel.max) : 0;

    // Altitude tracking
    if (pos.y > state.maxAlt) state.maxAlt = pos.y;

    // Fell below ground
    if (pos.y < -50) { state.alive = false; state.dead = true; }
  }
}
