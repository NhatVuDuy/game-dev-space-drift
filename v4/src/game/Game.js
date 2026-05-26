import * as THREE from 'three';
import { World }           from '../ecs/World.js';
import { initScene, scene, renderFrame, W, H, gameToWorld } from '../renderer/SceneSetup.js';
import { StarField }       from '../renderer/StarField.js';
import { makeShipMesh, makeStagePadMesh } from '../renderer/Meshes.js';
import { InputSystem, initInput } from '../systems/InputSystem.js';
import { PhysicsSystem }   from '../systems/PhysicsSystem.js';
import { CameraSystem }    from '../systems/CameraSystem.js';
import { WorldGenSystem }  from '../systems/WorldGenSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { RenderSystem }    from '../systems/RenderSystem.js';
import { UISystem }        from '../systems/UISystem.js';
import { CFG, SR }         from '../config/constants.js';
import { loadStats, saveStats } from '../storage/Storage.js';
import { sfx } from '../audio/Audio.js';

const THEME_COLORS = {
  scifi:   { primary: 0x00cfff, secondary: 0x0044aa, accent: 0xffd700 },
  cartoon: { primary: 0xffd700, secondary: 0xff6b35, accent: 0x39ff14 },
  anime:   { primary: 0xff9ff3, secondary: 0xe91e97, accent: 0xc2e0ff },
  neon:    { primary: 0x00ff41, secondary: 0x007722, accent: 0xffff00 },
};

export class Game {
  constructor() {
    this.world     = null;
    this.player    = null;
    this._raf      = 0;
    this._running  = false;
    this._genSystem = null;
    this._starField = null;
    this._themeKey  = localStorage.getItem('sd_theme') || 'cartoon';
  }

  init() {
    initScene();
    initInput();

    this._starField = new StarField(scene);

    // Home screen bg animation
    this._animateHome();

    // Expose global methods for HTML onclick
    window.startGame     = () => this.start();
    window.goHome        = () => this.goHome();
    window.rfLaunch      = () => this.rfLaunch();
    window.choiceFly     = () => this.choiceFly();
    window.choiceLand    = () => this.choiceLand();
    window.watchRevive   = () => this.watchRevive();
    window.showScr       = (id) => this.showScreen(id);
    window.toggleAds     = () => {};
    window.enableGyro    = () => document.getElementById('tilt-ov')?.classList.add('on');
    window.tiltAllow     = async () => { const { requestGyroPermission } = await import('../systems/InputSystem.js'); await requestGyroPermission(); document.getElementById('tilt-ov')?.classList.remove('on'); };
    window.tiltSkip      = () => { document.getElementById('tilt-ov')?.classList.remove('on'); };
    window.showCalOverlay = () => {};
    window.doCalibrate   = () => {};
    window.resetCalibrate = () => {};
    window.skipCalibrate = () => {};
    window.setGyroMode   = () => {};
    window.toggleGyroInvert = () => {};
    window.closeAd       = () => {};

    this._loadHomeStats();
    this._buildThemeRow();
    this.showScreen('sh');
  }

  // ── Home ───────────────────────────────────────────────────────────────
  _animateHome() {
    let tick = 0;
    const loop = () => {
      if (this._running) return;
      tick++;
      if (this._starField) this._starField.update(tick * 0.4);
      renderFrame();
      this._homeRaf = requestAnimationFrame(loop);
    };
    loop();
  }

  _loadHomeStats() {
    const s = loadStats();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('hbest',   (s.best   || 0).toLocaleString());
    set('hgames',  s.games   || 0);
    set('hstbest', s.stBest  || 1);
  }

  _buildThemeRow() {
    const row = document.getElementById('tr');
    if (!row) return;
    row.innerHTML = '';
    const themes = { scifi:'⚡', cartoon:'🌈', anime:'🌸', neon:'🟢' };
    for (const [k, dot] of Object.entries(themes)) {
      const d = document.createElement('div');
      d.className = 'td' + (k === this._themeKey ? ' on' : '');
      d.dataset.k = k;
      const tc = THEME_COLORS[k] || THEME_COLORS.cartoon;
      const c1 = '#' + tc.primary.toString(16).padStart(6,'0');
      const c2 = '#' + tc.secondary.toString(16).padStart(6,'0');
      d.style.background = `linear-gradient(135deg,${c1},${c2})`;
      d.textContent = dot;
      d.style.pointerEvents = 'all';
      d.onclick = () => {
        this._themeKey = k;
        localStorage.setItem('sd_theme', k);
        document.querySelectorAll('.td').forEach(x => x.classList.toggle('on', x.dataset.k === k));
      };
      row.appendChild(d);
    }
  }

  showScreen(id) {
    document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
    if (id) document.getElementById(id)?.classList.add('on');

    const showUI = id === null || (id !== 'sh' && id !== 'show' && id !== 'so' && id !== 'sad');
    document.getElementById('ui')?.classList.toggle('show', showUI);
  }

  // ── Start game ─────────────────────────────────────────────────────────
  async start() {
    cancelAnimationFrame(this._homeRaf);
    cancelAnimationFrame(this._raf);
    this._running = true;

    // Clear previous world & scene objects
    this._clearGameObjects();

    const colors = THEME_COLORS[this._themeKey] || THEME_COLORS.cartoon;

    // ECS world
    this.world = new World();
    this.world.globals = { W: window.innerWidth, H: window.innerHeight };

    // Player entity
    this.player = this.world.createEntity();
    const shipMesh = makeShipMesh(colors);
    scene.add(shipMesh);

    const startY = 180;
    const startX = window.innerWidth / 2;
    const wc = gameToWorld(startX, startY);
    shipMesh.position.set(wc.x, wc.y, 10);

    this.world.addComponent(this.player, 'position',  { x: startX, y: startY });
    this.world.addComponent(this.player, 'velocity',  { vx: 0, vy: 0 });
    this.world.addComponent(this.player, 'fuel',      { amount: CFG.FMAX, max: CFG.FMAX });
    this.world.addComponent(this.player, 'armor',     { hp: 100, max: 100 });
    this.world.addComponent(this.player, 'player',    { thrusting: false, steer: 0 });
    this.world.addComponent(this.player, 'renderable',{ mesh: shipMesh, type: 'ship' });
    this.world.addComponent(this.player, 'state', {
      alive: true, dead: false, refueling: false,
      cam: 0, score: 0, maxAlt: 0, stageN: 1, normGates: 0, gems: 0,
      thrusting: false, thrustPower: 0,
      sideL: 0, sideR: 0, hitGrace: 60,
    });

    // Systems
    this._genSystem = new WorldGenSystem(scene, colors.primary || 0x00cfff);
    this._genSystem.reset();

    const collisionSystem = new CollisionSystem((type, data) => this._onEvent(type, data));
    const renderSystem    = new RenderSystem(scene);
    const uiSystem        = new UISystem();

    this.world
      .addSystem(new InputSystem())
      .addSystem(new PhysicsSystem())
      .addSystem(collisionSystem)
      .addSystem(this._genSystem)
      .addSystem(new CameraSystem())
      .addSystem(renderSystem)
      .addSystem(uiSystem);

    // Spawn launch pad
    this._spawnLaunchPad(startX, startY - SR - 8, window.innerWidth);

    this.showScreen(null);
    document.getElementById('ui')?.classList.add('show');

    this._loop();
  }

  _loop() {
    const state = this.world.get(this.player, 'state');
    if (!this._running || (state.dead && !state.refueling)) {
      if (state.dead) this._endGame();
      return;
    }
    this.world.update(1 / 60);
    if (this._starField) this._starField.update(state.cam);
    renderFrame();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _spawnLaunchPad(x, y, W) {
    const padW = W * 0.55;
    const mesh = makeStagePadMesh(padW);
    const wc = gameToWorld(x, y);
    mesh.position.set(wc.x, wc.y, 0);
    scene.add(mesh);

    const id = this.world.createEntity();
    this.world.addComponent(id, 'position',  { x, y });
    this.world.addComponent(id, 'stagepad',  { width: padW, height: 10, fuelReserve: 100, stageN: 0 });
    this.world.addComponent(id, 'renderable',{ mesh, type: 'stagepad' });
    this.world.addComponent(id, 'alive',     { v: true });
  }

  // ── Events ─────────────────────────────────────────────────────────────
  _onEvent(type, data) {
    const state = this.world.get(this.player, 'state');
    if (type === 'asteroid_hit') {
      sfx('sawtooth', 200, 0.1, 0.15);
      this._flashArmor();
    }
    if (type === 'gate') {
      sfx('sine', 880, 0.1, 0.14);
      this._showGateFlash(data.gates);
    }
    if (type === 'pickup') {
      sfx('sine', 660, 0.09, 0.12);
    }
    if (type === 'land') {
      this._doLand(data.pad, data.padEntity);
    }
    if (type === 'blackhole_near') {
      // Visual warning — handled by render
    }
    if (type === 'death') {
      sfx('sawtooth', 180, 0.4, 0.25);
      this._running = false;
    }
  }

  _flashArmor() {
    const bar = document.getElementById('armor-bar');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.filter = 'brightness(3)';
    setTimeout(() => { bar.style.filter = ''; bar.style.transition = 'width .2s'; }, 120);
  }

  _showGateFlash(gates) {
    const badge = document.getElementById('sbadge');
    if (!badge) return;
    badge.style.color = '#fff';
    badge.style.textShadow = '0 0 12px #00cfff';
    setTimeout(() => { badge.style.color = ''; badge.style.textShadow = ''; }, 600);
  }

  _doLand(pad, padEntity) {
    if (!this._running) return;
    const state = this.world.get(this.player, 'state');
    const fuel  = this.world.get(this.player, 'fuel');
    const vel   = this.world.get(this.player, 'velocity');

    state.refueling = true;
    state.thrusting = false;
    vel.vx = 0; vel.vy = 0;

    sfx('sine', 330, 0.18, 0.22);

    // Stage advance?
    if (pad.stageN >= state.stageN) {
      state.stageN++;
      this._showStageAnim(state.stageN);
    }

    // Show refuel overlay
    this._startRefuel(fuel, pad);
  }

  _startRefuel(fuel, pad) {
    document.getElementById('rf-ov')?.classList.add('on');
    document.getElementById('ui')?.classList.add('show');

    let pct = Math.round((fuel.amount / fuel.max) * 100);
    const rfFill = document.getElementById('rffill');
    const rfPct  = document.getElementById('rfpct');
    const rfBtn  = document.getElementById('rfbtn');
    if (rfFill) rfFill.style.width = pct + '%';
    if (rfPct)  rfPct.textContent  = pct + '%';
    if (rfBtn)  rfBtn.classList.remove('on');

    const interval = setInterval(() => {
      if (fuel.amount >= fuel.max) {
        fuel.amount = fuel.max; clearInterval(interval);
        if (rfBtn) rfBtn.classList.add('on');
        return;
      }
      fuel.amount = Math.min(fuel.max, fuel.amount + 1.2);
      pct = Math.round((fuel.amount / fuel.max) * 100);
      if (rfFill) rfFill.style.width = pct + '%';
      if (rfPct)  rfPct.textContent  = pct + '%';
    }, 60);
    this._refuelInterval = interval;
  }

  rfLaunch() {
    const rfBtn = document.getElementById('rfbtn');
    if (!rfBtn?.classList.contains('on')) return;
    clearInterval(this._refuelInterval);
    document.getElementById('rf-ov')?.classList.remove('on');

    const state = this.world.get(this.player, 'state');
    const vel   = this.world.get(this.player, 'velocity');
    state.refueling = false;
    vel.vy = 1.5;

    this._running = true;
    this._loop();
  }

  _showStageAnim(stageN) {
    const el = document.getElementById('sa-ov');
    const num = document.getElementById('sanum');
    if (el && num) {
      num.textContent = stageN;
      el.classList.add('on');
      setTimeout(() => el.classList.remove('on'), 1800);
    }
  }

  // ── End ─────────────────────────────────────────────────────────────────
  _endGame() {
    const state = this.world.get(this.player, 'state');
    const isNew = saveStats(state.score, state.stageN, state.maxAlt);

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const tog = (id, v) => { document.getElementById(id)?.classList.toggle('on', v); };

    set('goem',  '💥');
    set('got',   'CRASHED');
    set('gosc',  state.score.toLocaleString());
    set('goalt', Math.round(state.maxAlt) + 'm');
    set('gostg', state.stageN);
    set('gogem', state.gems || 0);
    tog('nb',   isNew);

    document.getElementById('gosc')?.style.setProperty('color', isNew ? '#ffd700' : '');
    document.getElementById('ui')?.classList.remove('show');
    this.showScreen('so');
    this._loadHomeStats();
  }

  watchRevive() {
    const state = this.world.get(this.player, 'state');
    const vel   = this.world.get(this.player, 'velocity');
    const fuel  = this.world.get(this.player, 'fuel');
    const armor = this.world.get(this.player, 'armor');

    state.alive = true; state.dead = false;
    state.hitGrace = 180;
    vel.vx = 0; vel.vy = 1.5;
    fuel.amount = fuel.max;
    armor.hp = 80;

    this.showScreen(null);
    document.getElementById('ui')?.classList.add('show');
    this._running = true;
    this._loop();
  }

  goHome() {
    this._running = false;
    this._clearGameObjects();
    this.showScreen('sh');
    this._buildThemeRow();
    this._loadHomeStats();
    this._animateHome();
  }

  choiceFly()  { /* already flying — dismiss overlay */ this.showScreen(null); }
  choiceLand() { /* land — show refuel */ }

  _clearGameObjects() {
    if (!this.world) return;
    for (const id of this.world.query('renderable')) {
      const r = this.world.get(id, 'renderable');
      if (r?.mesh) { scene.remove(r.mesh); r.mesh.traverse(c => c.geometry?.dispose()); }
    }
    this.world = null;
    this.player = null;
  }
}
