import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const WALK_SPEED = 3.5; // m/s
const RUN_SPEED = 7.0;
const EYE_HEIGHT = 1.70; // meters above current floor
const GRAVITY = -15;
const JUMP_FORCE = 6;

// Simple collision boundaries (axis-aligned boxes from the model)
// We keep the player within reasonable bounds and above floor surfaces
const FLOOR_LEVELS = [
  { minX: -2, maxX: 14, minZ: -2, maxZ: 15, y: 1.15 },   // Main floor
  { minX: 0.5, maxX: 6.5, minZ: -5.2, maxZ: -0.5, y: 4.20 }, // Mezzanine (after rotation z->-y mapping)
];

export function setupControls(camera, domElement, scene) {
  const controls = new PointerLockControls(camera, domElement);

  const state = {
    controls,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isRunning: false,
    canJump: false,
    playerY: 1.15 + EYE_HEIGHT, // Start on main floor
    verticalVelocity: 0,
  };

  // Pointer lock events
  controls.addEventListener('lock', () => {
    document.getElementById('pause-hint').style.opacity = '0.3';
  });

  controls.addEventListener('unlock', () => {
    document.getElementById('pause-hint').style.opacity = '1';
  });

  // Click to re-lock
  domElement.addEventListener('click', () => {
    if (!controls.isLocked) {
      controls.lock();
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': state.moveForward = true; break;
      case 'KeyS': case 'ArrowDown': state.moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': state.moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': state.moveRight = true; break;
      case 'ShiftLeft': case 'ShiftRight': state.isRunning = true; break;
      case 'Space':
        if (state.canJump) {
          state.verticalVelocity = JUMP_FORCE;
          state.canJump = false;
        }
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': state.moveForward = false; break;
      case 'KeyS': case 'ArrowDown': state.moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': state.moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': state.moveRight = false; break;
      case 'ShiftLeft': case 'ShiftRight': state.isRunning = false; break;
    }
  });

  return state;
}

function getFloorHeight(x, z) {
  // After the model rotation (-90 on X), the OBJ Y becomes Three.js -Z
  // and OBJ Z becomes Three.js Y.
  // The model coordinates: x stays x, OBJ y -> Three.js z (negated due to rotation), OBJ z -> Three.js y
  // Actually with rotation.x = -PI/2: (x, y, z) -> (x, z, -y)
  // So floor at OBJ z=1.15 -> Three.js y=1.15 (after rotation the plane is at y=1.15)

  // Mezzanine: check if player is above 3m and within mezzanine footprint
  // Mezzanine in model: x=[0.55, 6.40], y=[0.55, 5.15], z=4.20
  // After rotation: x stays, z=-y (so z=[-5.15, -0.55]), y=4.20
  if (x >= 0.5 && x <= 6.5 && z >= -5.15 && z <= -0.55) {
    // Player could be on mezzanine if they climbed stairs
    return 4.20;
  }

  // Deck: z=0.92 in model -> after rotation, deck is at y=0.92
  // Deck in model: various positions, but main deck y=[8.60, 12.20]
  // After rotation: z = -y = [-12.20, -8.60]
  if (z < -8.5 && z > -15) {
    return 1.04; // Deck top
  }

  // Annex terrace: z=4.20 in model
  // Annex in model: x=[7.40, 12.20], y=[1.90, 6.00]
  // After rotation: x stays, z=[-6.00, -1.90]
  if (x >= 7.3 && x <= 12.3 && z >= -6.1 && z <= -1.8) {
    // Could be on terrace (roof of annex) at y=4.20
    // Only if they're high enough (came from stairs)
    return 1.15; // Default to main floor level for now
  }

  // Main floor
  if (x >= -0.5 && x <= 12.5 && z >= -9 && z <= 0.5) {
    return 1.15;
  }

  // Terrain
  return 0.0;
}

export function updateControls(state, delta) {
  if (!state.controls.isLocked) return;

  const speed = state.isRunning ? RUN_SPEED : WALK_SPEED;

  // Damping
  state.velocity.x -= state.velocity.x * 8.0 * delta;
  state.velocity.z -= state.velocity.z * 8.0 * delta;

  // Direction from input
  state.direction.z = Number(state.moveForward) - Number(state.moveBackward);
  state.direction.x = Number(state.moveRight) - Number(state.moveLeft);
  state.direction.normalize();

  if (state.moveForward || state.moveBackward) {
    state.velocity.z -= state.direction.z * speed * delta * 20;
  }
  if (state.moveLeft || state.moveRight) {
    state.velocity.x -= state.direction.x * speed * delta * 20;
  }

  // Apply movement
  state.controls.moveRight(-state.velocity.x * delta);
  state.controls.moveForward(-state.velocity.z * delta);

  // Gravity
  const camera = state.controls.getObject();
  const floorY = getFloorHeight(camera.position.x, camera.position.z) + EYE_HEIGHT;

  state.verticalVelocity += GRAVITY * delta;
  camera.position.y += state.verticalVelocity * delta;

  if (camera.position.y < floorY) {
    camera.position.y = floorY;
    state.verticalVelocity = 0;
    state.canJump = true;
  }

  // Keep within world bounds
  camera.position.x = Math.max(-20, Math.min(26, camera.position.x));
  camera.position.z = Math.max(-26, Math.min(16, camera.position.z));
}
