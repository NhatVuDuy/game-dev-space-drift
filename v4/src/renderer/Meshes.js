import * as THREE from 'three';

// ── Ship ────────────────────────────────────────────────────────────────────
export function makeShipMesh(themeColors) {
  const group = new THREE.Group();
  const { primary = 0x00cfff, secondary = 0x0044aa, accent = 0xffd700 } = themeColors || {};

  const bodyMat  = new THREE.MeshStandardMaterial({ color: primary,   metalness: 0.7, roughness: 0.25, emissive: primary,   emissiveIntensity: 0.18 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: secondary, metalness: 0.8, roughness: 0.2,  emissive: secondary, emissiveIntensity: 0.05 });
  const glowMat  = new THREE.MeshStandardMaterial({ color: accent,    emissive: accent, emissiveIntensity: 1.0, metalness: 0, roughness: 1 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ddff,  metalness: 0, roughness: 0, transparent: true, opacity: 0.55, emissive: 0x44aaff, emissiveIntensity: 0.4 });

  // Fuselage
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(7, 18, 8, 16), bodyMat);
  body.rotation.z = 0;
  group.add(body);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(7, 14, 16), darkMat);
  nose.position.y = 18;
  group.add(nose);

  // Cockpit glass
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), glassMat);
  cockpit.position.y = 10;
  group.add(cockpit);

  // Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, -4); wingShape.lineTo(18, -14); wingShape.lineTo(16, -2); wingShape.lineTo(0, 4);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 2, bevelEnabled: false });
  wingGeo.center();

  const wingL = new THREE.Mesh(wingGeo, darkMat);
  wingL.position.set(-8, -6, 0); wingL.rotation.y = Math.PI; group.add(wingL);
  const wingR = new THREE.Mesh(wingGeo, darkMat);
  wingR.position.set(8, -6, 0); group.add(wingR);

  // Engine nozzle
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 8, 16), darkMat);
  nozzle.position.y = -18;
  group.add(nozzle);

  // Engine glow disc
  const glow = new THREE.Mesh(new THREE.CircleGeometry(5, 24), glowMat);
  glow.position.y = -22;
  group.add(glow);

  group.scale.setScalar(0.7);
  return group;
}

// ── Asteroid ──────────────────────────────────────────────────────────────
export function makeAsteroidMesh(radius, danger, seed) {
  const detail = danger ? 1 : 2;
  const geo = new THREE.IcosahedronGeometry(radius, detail);

  // Displace vertices for rocky look
  const pos = geo.attributes.position;
  const rng = seededRng(seed || Math.random() * 9999);
  for (let i = 0; i < pos.count; i++) {
    const scale = 0.75 + rng() * 0.5;
    pos.setXYZ(i, pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale);
  }
  geo.computeVertexNormals();

  const color = danger ? 0xcc3311 : 0x667788;
  const emissive = danger ? 0x441100 : 0x112233;
  const mat = new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity: danger ? 0.4 : 0.1,
    metalness: 0.2, roughness: 0.85,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  return mesh;
}

// ── Gate ──────────────────────────────────────────────────────────────────
export function makeGateMesh(width, themeColor = 0x00cfff) {
  const group = new THREE.Group();

  // Left post
  const postGeo = new THREE.CylinderGeometry(2.5, 2.5, 28, 12);
  const postMat = new THREE.MeshStandardMaterial({ color: themeColor, emissive: themeColor, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 });
  const postL = new THREE.Mesh(postGeo, postMat);
  postL.position.x = -width / 2;
  const postR = new THREE.Mesh(postGeo, postMat);
  postR.position.x = width / 2;
  group.add(postL, postR);

  // Energy beam (plane with additive blending)
  const beamGeo = new THREE.PlaneGeometry(width - 10, 6);
  const beamMat = new THREE.MeshBasicMaterial({
    color: themeColor, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  group.add(beam);

  // Top chevron arrows
  [-1, 0, 1].forEach(i => {
    const arr = new THREE.Mesh(
      new THREE.ConeGeometry(4, 8, 4),
      new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.7 })
    );
    arr.position.set(i * 18, 18, 0);
    arr.rotation.z = Math.PI; // point upward
    group.add(arr);
  });

  return group;
}

// ── Stage Pad ──────────────────────────────────────────────────────────────
export function makeStagePadMesh(width) {
  const group = new THREE.Group();

  const padMat = new THREE.MeshStandardMaterial({ color: 0x226644, emissive: 0x113322, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.4 });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(width, 10, 14), padMat);
  group.add(pad);

  // Landing strip lights
  for (let i = -3; i <= 3; i++) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x39ff14 })
    );
    light.position.set(i * (width / 8), 6, 0);
    group.add(light);
  }

  return group;
}

// ── Black Hole ──────────────────────────────────────────────────────────────
export function makeBlackHoleMesh(radius) {
  const group = new THREE.Group();

  // Dark core
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  group.add(new THREE.Mesh(new THREE.CircleGeometry(radius * 0.55, 32), coreMat));

  // Accretion rings
  const colors = [0x9922ff, 0xff4422, 0xffaa00];
  colors.forEach((col, i) => {
    const r = radius * (0.7 + i * 0.25);
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 - i * 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 2.5, r + 2.5, 48), ringMat);
    ring.userData.rotSpeed = 0.008 + i * 0.004;
    group.add(ring);
  });

  return group;
}

// ── Pickup (fuel, gem, medkit) ─────────────────────────────────────────────
export function makePickupMesh(type) {
  let geo, mat;
  if (type === 'fuel') {
    geo = new THREE.CylinderGeometry(5, 5, 12, 8);
    mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.5 });
  } else if (type === 'gem') {
    geo = new THREE.OctahedronGeometry(7, 0);
    mat = new THREE.MeshStandardMaterial({ color: 0x00ffee, emissive: 0x00ccbb, emissiveIntensity: 0.8, metalness: 0.1, roughness: 0.1 });
  } else { // medkit
    geo = new THREE.BoxGeometry(12, 12, 8);
    mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff2222, emissiveIntensity: 0.5 });
  }
  return new THREE.Mesh(geo, mat);
}

// ── Starfield ─────────────────────────────────────────────────────────────
export function makeStarField(count = 900) {
  const positions = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 3000;
    positions[i*3+1] = Math.random() * 8000;
    positions[i*3+2] = -300 - Math.random() * 200;
    sizes[i] = 0.5 + Math.random() * 2.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0.8 });
  return new THREE.Points(geo, mat);
}

// ── Exhaust particle ───────────────────────────────────────────────────────
export function makeExhaustParticle(color = 0xff6600) {
  const geo = new THREE.SphereGeometry(2.5, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

// ── Seeded RNG helper ──────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}
