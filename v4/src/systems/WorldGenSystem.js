import * as THREE from 'three';
import { CFG, SR, STAGE_GATES } from '../config/constants.js';
import { makeAsteroidMesh, makeGateMesh, makeStagePadMesh,
         makeBlackHoleMesh, makePickupMesh } from '../renderer/Meshes.js';
import { gameToWorld } from '../renderer/SceneSetup.js';

const CULL_BELOW = -300; // destroy objects this far below camera bottom

export class WorldGenSystem {
  constructor(scene, themeColor) {
    this._scene = scene;
    this._themeColor = themeColor || 0x00cfff;
    this._lastGen = 0;
    this._nextGateAlt = CFG.GSPC;
    this._gatesSpawned = 0;
  }

  reset() {
    this._lastGen = 0;
    this._nextGateAlt = CFG.GSPC;
    this._gatesSpawned = 0;
  }

  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const state = world.get(player, 'state');
    const { W } = world.globals;

    const horizon = state.cam + 1100;

    // Cull objects below camera
    this._cull(world, state.cam);

    // Gen new chunk
    if (horizon <= this._lastGen) return;

    const from = this._lastGen;
    const to   = horizon;

    // Scatter objects every 80px altitude band
    for (let alt = Math.ceil(from / 80) * 80; alt < to; alt += 80) {
      if (Math.random() < 0.42) this._spawnAsteroid(world, alt, W);
      if (Math.random() < 0.16) this._spawnPickup(world, alt, 'gem', W);
      if (Math.random() < 0.06) this._spawnPickup(world, alt, 'fuel', W);
      if (Math.random() < 0.05) this._spawnPickup(world, alt, 'medkit', W);
    }

    // Gates at intervals
    while (this._nextGateAlt < to) {
      this._spawnGate(world, this._nextGateAlt, W, state);
      this._gatesSpawned++;
      this._nextGateAlt += CFG.GSPC;

      // Stage pad every STAGE_GATES gates
      if (this._gatesSpawned % STAGE_GATES === 0) {
        const padAlt = this._nextGateAlt - CFG.GSPC * 0.6;
        this._spawnStagePad(world, padAlt, W, state.stageN);
      }

      // Black holes after stage 2
      if (state.stageN >= 2 && Math.random() < 0.3) {
        this._spawnBlackHole(world, this._nextGateAlt - CFG.GSPC * 0.75, W);
      }
    }

    this._lastGen = to;
  }

  _spawnAsteroid(world, alt, W) {
    const danger = Math.random() < 0.22;
    const radius = danger ? 9 + Math.random() * 9 : 22 + Math.random() * 12;
    const seed   = Math.random() * 9999;
    const x      = W * 0.07 + Math.random() * W * 0.86;
    const mesh   = makeAsteroidMesh(radius, danger, seed);

    const wc = gameToWorld(x, alt);
    mesh.position.set(wc.x, wc.y, 0);
    this._scene.add(mesh);

    const id = world.createEntity();
    world.addComponent(id, 'position',  { x, y: alt });
    world.addComponent(id, 'velocity',  { vx: (Math.random()-0.5)*(danger?1.4:0.5), vy: 0 });
    world.addComponent(id, 'collider',  { radius: radius * 0.85 });
    world.addComponent(id, 'asteroid',  { radius, danger, rotSpeed: (Math.random()-0.5)*(danger?0.045:0.012) });
    world.addComponent(id, 'renderable',{ mesh, type: 'asteroid' });
    world.addComponent(id, 'alive',     { v: true });
  }

  _spawnGate(world, alt, W, state) {
    const gw   = 80 + Math.random() * 55;
    const x    = W * 0.12 + Math.random() * (W * 0.76 - gw) + gw / 2;
    const mesh = makeGateMesh(gw, this._themeColor);

    const wc = gameToWorld(x, alt);
    mesh.position.set(wc.x, wc.y, 0);
    this._scene.add(mesh);

    const id = world.createEntity();
    world.addComponent(id, 'position',  { x, y: alt });
    world.addComponent(id, 'gate',      { width: gw, scored: false, x, alt });
    world.addComponent(id, 'renderable',{ mesh, type: 'gate' });
    world.addComponent(id, 'alive',     { v: true });
  }

  _spawnStagePad(world, alt, W, stageN) {
    const padW = 100;
    const x    = W * 0.2 + Math.random() * W * 0.6;
    const mesh = makeStagePadMesh(padW);

    const wc = gameToWorld(x, alt);
    mesh.position.set(wc.x, wc.y, 0);
    this._scene.add(mesh);

    const id = world.createEntity();
    world.addComponent(id, 'position',  { x, y: alt });
    world.addComponent(id, 'stagepad',  { width: padW, height: 10, fuelReserve: 100, stageN });
    world.addComponent(id, 'renderable',{ mesh, type: 'stagepad' });
    world.addComponent(id, 'alive',     { v: true });
  }

  _spawnBlackHole(world, alt, W) {
    const radius = 28 + Math.random() * 18;
    const x      = W * 0.2 + Math.random() * W * 0.6;
    const mesh   = makeBlackHoleMesh(radius);

    const wc = gameToWorld(x, alt);
    mesh.position.set(wc.x, wc.y, -5);
    this._scene.add(mesh);

    const id = world.createEntity();
    world.addComponent(id, 'position',  { x, y: alt });
    world.addComponent(id, 'blackhole', { radius, pull: 0.16 });
    world.addComponent(id, 'renderable',{ mesh, type: 'blackhole' });
    world.addComponent(id, 'alive',     { v: true });
  }

  _spawnPickup(world, alt, type, W) {
    const x    = W * 0.1 + Math.random() * W * 0.8;
    const mesh = makePickupMesh(type);

    const wc = gameToWorld(x, alt + Math.random() * 60);
    mesh.position.set(wc.x, wc.y, 2);
    this._scene.add(mesh);

    const radius = type === 'gem' ? 10 : type === 'fuel' ? 12 : 13;
    const amount = type === 'fuel' ? CFG.FADD : type === 'medkit' ? 35 : 10;

    const id = world.createEntity();
    world.addComponent(id, 'position',  { x, y: wc.y });
    world.addComponent(id, 'collider',  { radius });
    world.addComponent(id, 'pickup',    { type, amount });
    world.addComponent(id, 'renderable',{ mesh, type: 'pickup' });
    world.addComponent(id, 'alive',     { v: true });
  }

  _cull(world, camBottom) {
    const cullY = camBottom + CULL_BELOW;
    for (const id of world.query('position', 'renderable')) {
      const pos = world.get(id, 'position');
      if (pos.y < cullY) {
        const r = world.get(id, 'renderable');
        this._scene.remove(r.mesh);
        r.mesh.traverse(c => { c.geometry?.dispose(); });
        world.destroyEntity(id);
      }
    }
  }
}
