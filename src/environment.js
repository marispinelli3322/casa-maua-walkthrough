import * as THREE from 'three';
import { createGrassTexture } from './textures.js';

export function setupEnvironment(scene) {
  // Ground plane with grass texture
  const grassTex = createGrassTexture();
  grassTex.repeat.set(40, 40);
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex, roughness: 0.95, metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Realistic pine trees
  addPineTrees(scene);

  // Low vegetation / bushes near the house
  addBushes(scene);

  // Ambient particles
  addParticles(scene);
}

function createPineTree(height = 8) {
  const group = new THREE.Group();

  // Trunk - cylinder
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.15, height * 0.6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a12, roughness: 0.9, metalness: 0.0,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = height * 0.3;
  trunk.castShadow = true;
  group.add(trunk);

  // Multiple cone layers for pine shape
  const layers = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < layers; i++) {
    const layerY = height * 0.35 + (i / layers) * height * 0.6;
    const radius = (1.2 + Math.random() * 0.6) * (1 - i / (layers + 1));
    const coneH = height * 0.25;

    const hue = 120 + Math.random() * 30;
    const light = 18 + Math.random() * 12;
    const coneGeo = new THREE.ConeGeometry(radius, coneH, 7);
    const coneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 45%, ${light}%)`),
      roughness: 0.85, metalness: 0.0,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = layerY;
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);
  }

  return group;
}

function addPineTrees(scene) {
  const treePositions = [
    // Close forest ring
    [-6, -8], [-3, -14], [-10, 2], [-7, 10], [-11, -2],
    [18, -12], [22, -6], [16, 8], [20, 4], [23, -2],
    [-4, -16], [2, -18], [8, -16], [14, -18], [16, -14],
    [-10, 12], [-6, 16], [0, 18], [8, 16], [16, 12],
    // Mid ring
    [-16, -10], [-14, 6], [26, 0], [24, 8], [-4, -20],
    [12, -20], [20, 14], [-12, 14], [22, -14], [-16, -4],
    // Near house (like the renders)
    [-3, -10], [15, -8], [-5, 5], [15, 7],
    [-2, -5], [14, -3], [-4, 12], [17, 11],
    // Dense background
    [-20, -14], [-18, 8], [-22, -2], [28, -8], [28, 6],
    [-20, 16], [26, 14], [-14, -18], [24, -18], [-22, 10],
    [30, 2], [-24, -6], [30, -12], [-22, 14], [28, 12],
  ];

  treePositions.forEach(([x, z]) => {
    const height = 6 + Math.random() * 6;
    const tree = createPineTree(height);
    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  });
}

function addBushes(scene) {
  const bushGeo = new THREE.SphereGeometry(0.5, 6, 4);
  const bushPositions = [
    // Around deck edges (like the monstera/tropical plants in renders)
    [3, -12.5], [5, -12.5], [7, -12.5], [9, -12.5],
    [-1.5, -9], [-1.5, -7], [-1.5, -5],
    [13, -4], [13, -6], [13, -8],
    // Near pool
    [6.5, -11], [10.5, -11],
    // Front of house
    [1, -14], [3, -14.5], [11, -14],
  ];

  bushPositions.forEach(([x, z]) => {
    const scale = 0.6 + Math.random() * 0.8;
    const hue = 110 + Math.random() * 30;
    const light = 22 + Math.random() * 15;
    const bushMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 50%, ${light}%)`),
      roughness: 0.85, metalness: 0.0,
    });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.set(x, scale * 0.4, z);
    bush.scale.set(scale, scale * 0.7, scale);
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
  });
}

function addParticles(scene) {
  const count = 300;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40 + 5;
    positions[i * 3 + 1] = 1 + Math.random() * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffee, size: 0.03,
    transparent: true, opacity: 0.35,
  });

  scene.add(new THREE.Points(geo, mat));
}
