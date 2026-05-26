let _nextId = 1;

export class World {
  constructor() {
    this.entities   = new Set();
    this.components = new Map(); // componentName → Map<entityId, data>
    this.systems    = [];
    this._toDestroy = [];
  }

  createEntity() {
    const id = _nextId++;
    this.entities.add(id);
    return id;
  }

  addComponent(entity, name, data) {
    if (!this.components.has(name)) this.components.set(name, new Map());
    this.components.get(name).set(entity, data);
    return data;
  }

  get(entity, name) {
    return this.components.get(name)?.get(entity);
  }

  has(entity, name) {
    return this.components.get(name)?.has(entity) ?? false;
  }

  removeComponent(entity, name) {
    this.components.get(name)?.delete(entity);
  }

  // All entities that have ALL of the listed components
  query(...names) {
    const results = [];
    const [first, ...rest] = names;
    const firstMap = this.components.get(first);
    if (!firstMap) return results;
    for (const [id] of firstMap) {
      if (rest.every(n => this.components.get(n)?.has(id))) results.push(id);
    }
    return results;
  }

  destroyEntity(entity) {
    this._toDestroy.push(entity);
  }

  _flushDestroy() {
    for (const id of this._toDestroy) {
      for (const map of this.components.values()) map.delete(id);
      this.entities.delete(id);
    }
    this._toDestroy.length = 0;
  }

  addSystem(system) {
    this.systems.push(system);
    return this;
  }

  update(dt) {
    for (const sys of this.systems) sys.update(this, dt);
    this._flushDestroy();
  }
}
