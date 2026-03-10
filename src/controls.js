import * as THREE from 'three';

const WALK_SPEED = 4.0;
const RUN_SPEED = 8.0;
const EYE_HEIGHT = 1.70;
const MOUSE_SENSITIVITY = 0.003;

export function setupControls(camera, domElement) {
  const state = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isRunning: false,
    // Euler angles for camera look
    yaw: Math.PI,   // Start looking toward house (north)
    pitch: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  // --- KEYBOARD ---
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': state.moveForward = true; e.preventDefault(); break;
      case 'ArrowDown': case 'KeyS': state.moveBackward = true; e.preventDefault(); break;
      case 'ArrowLeft': case 'KeyA': state.moveLeft = true; e.preventDefault(); break;
      case 'ArrowRight': case 'KeyD': state.moveRight = true; e.preventDefault(); break;
      case 'ShiftLeft': case 'ShiftRight': state.isRunning = true; break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': state.moveForward = false; break;
      case 'ArrowDown': case 'KeyS': state.moveBackward = false; break;
      case 'ArrowLeft': case 'KeyA': state.moveLeft = false; break;
      case 'ArrowRight': case 'KeyD': state.moveRight = false; break;
      case 'ShiftLeft': case 'ShiftRight': state.isRunning = false; break;
    }
  });

  // --- MOUSE DRAG TO LOOK ---
  domElement.addEventListener('mousedown', (e) => {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    domElement.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastMouseX;
    const dy = e.clientY - state.lastMouseY;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;

    state.yaw -= dx * MOUSE_SENSITIVITY;
    state.pitch -= dy * MOUSE_SENSITIVITY;
    // Clamp pitch to avoid flipping
    state.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, state.pitch));
  });

  document.addEventListener('mouseup', () => {
    state.isDragging = false;
    domElement.style.cursor = 'grab';
  });

  // --- TOUCH SUPPORT (mobile) ---
  let touchStartX = 0, touchStartY = 0;

  domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;

      state.yaw -= dx * MOUSE_SENSITIVITY;
      state.pitch -= dy * MOUSE_SENSITIVITY;
      state.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, state.pitch));
    }
  }, { passive: true });

  // Set initial cursor
  domElement.style.cursor = 'grab';

  return state;
}

function getFloorHeight(x, z) {
  // Deck area
  if (z < -8.5 && z > -15) return 1.04;
  // Main floor + annex
  if (x >= -0.5 && x <= 12.5 && z >= -9 && z <= 0.5) return 1.15;
  // Terrain
  return 0.0;
}

export function updateControls(state, camera, delta) {
  // Update camera rotation from yaw/pitch
  const euler = new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  // Movement direction based on where camera is looking (horizontal only)
  const speed = state.isRunning ? RUN_SPEED : WALK_SPEED;
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0);
  right.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
  right.y = 0;
  right.normalize();

  const move = new THREE.Vector3(0, 0, 0);

  if (state.moveForward) move.add(forward);
  if (state.moveBackward) move.sub(forward);
  if (state.moveRight) move.add(right);
  if (state.moveLeft) move.sub(right);

  if (move.length() > 0) {
    move.normalize().multiplyScalar(speed * delta);
    camera.position.add(move);
  }

  // Keep on floor
  const floorY = getFloorHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;
  camera.position.y = floorY;

  // World bounds
  camera.position.x = Math.max(-20, Math.min(26, camera.position.x));
  camera.position.z = Math.max(-26, Math.min(16, camera.position.z));
}
