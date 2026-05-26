import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export let renderer, scene, camera, composer;
export let W = window.innerWidth, H = window.innerHeight;

export function initScene() {
  W = window.innerWidth;
  H = window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  document.getElementById('app').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04040f);

  // OrthographicCamera: game coords map 1:1 to world px
  // x: -W/2 .. W/2   y: cam .. cam+H   (y up, altitude)
  camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.1, 2000);
  camera.position.set(0, 0, 800);

  // Ambient + directional light for 3D depth
  scene.add(new THREE.AmbientLight(0x334466, 1.8));
  const sun = new THREE.DirectionalLight(0x8899ff, 2.5);
  sun.position.set(120, 200, 300);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff6633, 1.2);
  rim.position.set(-120, -80, 200);
  scene.add(rim);

  // Post-processing: bloom
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(W, H), 0.55, 0.38, 0.82);
  composer.addPass(bloom);

  window.addEventListener('resize', onResize);
}

export function setCameraAltitude(camBottom) {
  // camBottom = lowest visible altitude (same as legacy G.cam)
  camera.position.y = camBottom + H / 2;
}

// Convert game coords (x:0..W, wy:altitude) → Three.js world (x centered)
export function gameToWorld(x, wy) {
  return { x: x - W / 2, y: wy };
}

export function renderFrame() {
  composer.render();
}

function onResize() {
  W = window.innerWidth;
  H = window.innerHeight;
  renderer.setSize(W, H);
  camera.left   = -W / 2;
  camera.right  =  W / 2;
  camera.top    =  H / 2;
  camera.bottom = -H / 2;
  camera.updateProjectionMatrix();
  composer.setSize(W, H);
}
