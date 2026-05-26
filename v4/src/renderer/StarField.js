import * as THREE from 'three';

const BAND_HEIGHT = 4000;

export class StarField {
  constructor(scene) {
    this._scene  = scene;
    this._points = [];
    this._tick   = 0;
    this._init();
  }

  _init() {
    // 3 parallax layers: far, mid, near
    const layers = [
      { count: 500, z: -450, speed: 0.04, size: 1.2, opacity: 0.5 },
      { count: 300, z: -250, speed: 0.08, size: 1.6, opacity: 0.65 },
      { count: 120, z: -120, speed: 0.15, size: 2.2, opacity: 0.8 },
    ];
    for (const l of layers) {
      const pts = this._makeLayer(l);
      this._scene.add(pts);
      this._points.push({ pts, speed: l.speed });
    }
  }

  _makeLayer({ count, z, size, opacity }) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 2800;
      pos[i*3+1] = Math.random() * BAND_HEIGHT;
      pos[i*3+2] = z + (Math.random() - 0.5) * 40;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size, sizeAttenuation: false,
      transparent: true, opacity,
    }));
  }

  update(camY) {
    this._tick++;
    for (const { pts, speed } of this._points) {
      // Parallax: stars move slower than camera
      pts.position.y = camY * speed;
    }
  }
}
