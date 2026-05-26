import * as THREE from 'three';
import { gameToWorld, W } from '../renderer/SceneSetup.js';
import { makeExhaustParticle } from '../renderer/Meshes.js';

export class RenderSystem {
  constructor(scene) {
    this._scene    = scene;
    this._exhaust  = [];
    this._tick     = 0;
  }

  update(world) {
    this._tick++;
    const { W: gW } = world.globals;

    // ── Sync all renderable positions ──
    for (const id of world.query('position', 'renderable')) {
      const pos = world.get(id, 'position');
      const r   = world.get(id, 'renderable');
      const alive = world.get(id, 'alive');

      // Hide dead pickups
      if (alive && !alive.v) { r.mesh.visible = false; continue; }

      const wc = gameToWorld(pos.x, pos.y);
      r.mesh.position.x = wc.x;
      r.mesh.position.y = wc.y;

      // Per-type animations
      if (r.type === 'asteroid') {
        const ast = world.get(id, 'asteroid');
        if (ast) r.mesh.rotation.z += ast.rotSpeed;
        // Drift
        const vel = world.get(id, 'velocity');
        if (vel) { pos.x += vel.vx; pos.y += vel.vy; }
      }

      if (r.type === 'gate') {
        // Pulse beam opacity
        r.mesh.children.forEach(c => {
          if (c.material?.opacity !== undefined && c.material.transparent) {
            c.material.opacity = 0.25 + Math.sin(this._tick * 0.06) * 0.15;
          }
        });
        // Arrow bob
        r.mesh.children
          .filter(c => c.geometry?.type === 'ConeGeometry')
          .forEach((c, i) => { c.position.y = 18 + Math.sin(this._tick * 0.07 + i) * 3; });
      }

      if (r.type === 'blackhole') {
        // Spin accretion rings
        r.mesh.children.forEach(c => {
          if (c.userData.rotSpeed) c.rotation.z += c.userData.rotSpeed;
        });
      }

      if (r.type === 'pickup') {
        r.mesh.rotation.y += 0.035;
        r.mesh.position.y = wc.y + Math.sin(this._tick * 0.05 + pos.x) * 3;
      }
    }

    // ── Ship ──
    const [player] = world.query('player', 'renderable');
    if (player) {
      const pos    = world.get(player, 'position');
      const state  = world.get(player, 'state');
      const r      = world.get(player, 'renderable');
      const vel    = world.get(player, 'velocity');
      const wc     = gameToWorld(pos.x, pos.y);

      r.mesh.position.set(wc.x, wc.y, 10);
      // Tilt ship with velocity
      r.mesh.rotation.z = -vel.vx * 0.045;
      // Visible = alive
      r.mesh.visible = state.alive;

      // Exhaust particles when thrusting
      if (state.thrusting && state.alive && this._tick % 2 === 0) {
        this._spawnExhaust(wc.x, wc.y - 18, vel.vx);
      }
    }

    // ── Update exhaust particles ──
    this._exhaust = this._exhaust.filter(p => {
      p.life--;
      p.mesh.position.y += p.vy;
      p.mesh.position.x += p.vx;
      const t = p.life / p.maxLife;
      p.mesh.scale.setScalar(t * 0.9);
      p.mesh.material.opacity = t * 0.8;
      if (p.life <= 0) { this._scene.remove(p.mesh); return false; }
      return true;
    });
  }

  _spawnExhaust(x, y, shipVx) {
    const colors = [0xff6600, 0xff9900, 0xffcc00, 0xffffff];
    for (let i = 0; i < 3; i++) {
      const mesh = makeExhaustParticle(colors[i % colors.length]);
      mesh.position.set(x + (Math.random()-0.5)*8, y - Math.random()*6, 5);
      this._scene.add(mesh);
      this._exhaust.push({
        mesh,
        vx: (Math.random()-0.5)*1.2 + shipVx * 0.3,
        vy: -(1.5 + Math.random() * 2.5),
        life: 14 + Math.floor(Math.random() * 10),
        maxLife: 24,
      });
    }
  }
}
