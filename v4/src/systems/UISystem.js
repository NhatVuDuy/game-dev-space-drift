export class UISystem {
  constructor() {
    this._els = {};
    const ids = ['hs','ha','hf','hstage','hgate','fuel-vf','thrust-vf','sid-l','sid-r','armor-bar'];
    for (const id of ids) this._els[id] = document.getElementById(id);
  }

  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const state = world.get(player, 'state');
    const fuel  = world.get(player, 'fuel');
    const armor = world.get(player, 'armor');

    const fuelPct   = Math.round((fuel.amount  / fuel.max)  * 100);
    const armorPct  = Math.round((armor.hp     / armor.max) * 100);
    const thrustPct = Math.round(state.thrustPower * 100);
    const alt       = Math.max(0, Math.round(state.maxAlt));

    this._set('hs',        state.score.toLocaleString());
    this._set('ha',        alt + 'm');
    this._set('hf',        fuelPct + '%');
    this._set('hstage',    state.stageN);
    this._set('hgate',     Math.min(state.normGates % 2, 2));

    this._style('fuel-vf',   'height', fuelPct + '%');
    this._style('thrust-vf', 'height', thrustPct + '%');

    const sideW = 44;
    this._style('sid-l', 'width', (state.sideL * sideW) + 'px');
    this._style('sid-r', 'width', (state.sideR * sideW) + 'px');

    // Armor bar color
    const ab = this._els['armor-bar'];
    if (ab) {
      ab.style.width = armorPct + '%';
      ab.style.background = armorPct > 50 ? '#39ff14' : armorPct > 25 ? '#ffd700' : '#ff3333';
    }
  }

  _set(id, val) {
    const el = this._els[id];
    if (el) el.textContent = val;
  }

  _style(id, prop, val) {
    const el = this._els[id];
    if (el) el.style[prop] = val;
  }
}
