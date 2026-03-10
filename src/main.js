import * as THREE from 'three';
import { loadModel } from './loader.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupControls, updateControls } from './controls.js';
import { checkPointsOfInterest } from './poi.js';
import { setupMinimap, updateMinimap } from './minimap.js';
import { setupEnvironment } from './environment.js';

let scene, camera, renderer, clock;
let controlsState;
let timeOfDay = 10;

async function init() {
  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x8fad8f, 0.012);

  // Camera — eye height ~1.7m above floor (floor is at y=1.15 in the model)
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(5, 2.85, 14); // Start outside, looking at front deck
  camera.lookAt(3.7, 2.85, 8);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.insertBefore(renderer.domElement, document.body.firstChild);

  clock = new THREE.Clock();

  // Environment (sky, ground beyond model)
  setupEnvironment(scene);

  // Lighting
  setupLighting(scene, timeOfDay);

  // Load model
  const loaderFill = document.getElementById('loader-fill');
  const houseGroup = await loadModel(scene, (progress) => {
    loaderFill.style.width = `${progress}%`;
  });

  // Hide loading, show welcome
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('welcome').style.display = 'flex';

  // Enter button
  document.getElementById('enter-btn').addEventListener('click', () => {
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    controlsState = setupControls(camera, renderer.domElement, scene);
    renderer.domElement.requestPointerLock();
    setupMinimap(houseGroup);
    animate();
  });

  // Time of day slider
  document.getElementById('time-slider').addEventListener('input', (e) => {
    timeOfDay = parseFloat(e.target.value);
    const hours = Math.floor(timeOfDay);
    const mins = Math.round((timeOfDay - hours) * 60);
    document.getElementById('time-label').textContent =
      `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    updateLighting(scene, timeOfDay);
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (controlsState) {
    updateControls(controlsState, delta);
    checkPointsOfInterest(camera);
    updateMinimap(camera);
  }

  renderer.render(scene, camera);
}

init().catch(console.error);
