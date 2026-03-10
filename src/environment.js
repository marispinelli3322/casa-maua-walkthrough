import * as THREE from 'three';
import { createGrassTexture } from './textures.js';

export function setupEnvironment(scene) {
  // Ground plane with textured grass
  const grassTex = createGrassTexture();
  grassTex.repeat.set(40, 40);
  const groundGeo = new THREE.PlaneGeometry(200, 200, 32, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex, roughness: 0.9, metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // Araucaria pine trees (Brazilian pine - tall trunk, flat umbrella canopy)
  addAraucarias(scene);

  // Tropical vegetation near the house (monstera-like bushes as in renders)
  addTropicalBushes(scene);

  // Floating particles (pollen/dust in sunlight)
  addParticles(scene);
}

function createAraucaria(height = 12) {
  const group = new THREE.Group();

  // Tall straight trunk (araucarias have very tall trunks with branches only at top)
  const trunkHeight = height * 0.7;
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, trunkHeight, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a3020, roughness: 0.9, metalness: 0.0,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // Araucaria canopy - distinctive layered "umbrella" shape
  // Multiple flat disc-like layers with slight upward curve
  const canopyLayers = 5 + Math.floor(Math.random() * 3);
  const canopyStart = trunkHeight * 0.65;
  const canopyEnd = height;
  const layerSpacing = (canopyEnd - canopyStart) / canopyLayers;

  for (let i = 0; i < canopyLayers; i++) {
    const layerY = canopyStart + i * layerSpacing;
    // Araucaria branches radiate outward and slightly upward
    // Lower layers are wider, upper layers narrower (inverted cone overall)
    const progress = i / canopyLayers;
    const radius = (1.5 + progress * 1.0) * (0.6 + Math.random() * 0.4);

    // Create branch cluster as a flattened ellipsoid
    const branchGeo = new THREE.SphereGeometry(radius, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const hue = 130 + Math.random() * 20;
    const light = 15 + Math.random() * 10;
    const branchMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 50%, ${light}%)`),
      roughness: 0.85, metalness: 0.0,
    });
    const branch = new THREE.Mesh(branchGeo, branchMat);
    branch.position.y = layerY;
    branch.scale.y = 0.3; // Flatten
    branch.castShadow = true;
    branch.receiveShadow = true;
    group.add(branch);
  }

  // Top crown (slightly pointed)
  const crownGeo = new THREE.ConeGeometry(0.8, 1.5, 6);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x1a4018, roughness: 0.85,
  });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = canopyEnd + 0.5;
  crown.castShadow = true;
  group.add(crown);

  return group;
}

function addAraucarias(scene) {
  // Based on the aerial photo: dense forest on edges, some trees near house
  const treePositions = [
    // Close to house (like in the renders)
    [-5, -12, 10], [14, -10, 11], [-4, 4, 9], [16, 6, 10],
    [-3, -16, 8], [15, -14, 9], [-6, 8, 11], [17, 10, 8],

    // Mid-distance ring
    [-10, -8, 13], [-8, -16, 12], [-12, 0, 14], [-9, 10, 11],
    [20, -10, 12], [22, -4, 13], [18, 8, 11], [20, 12, 10],
    [-2, -20, 11], [6, -22, 12], [12, -20, 10], [8, 18, 11],
    [-6, 16, 12], [0, 20, 10], [14, 16, 13],

    // Dense forest edges (like the aerial photo)
    [-16, -12, 15], [-14, -6, 14], [-18, 2, 16], [-15, 8, 13],
    [-17, 14, 15], [-20, -2, 14], [-22, 6, 16], [-19, -10, 13],
    [24, -12, 14], [26, -4, 15], [22, 6, 13], [25, 10, 14],
    [28, 0, 16], [24, -8, 12], [26, 8, 15],
    [-8, -22, 13], [2, -24, 14], [10, -22, 12], [16, -20, 15],
    [-10, 18, 14], [-4, 22, 13], [4, 20, 15], [12, 20, 14],
    [20, 16, 13],

    // Background filling
    [-24, -8, 16], [-22, 12, 17], [30, -6, 16], [28, 10, 15],
    [-26, 0, 18], [32, 2, 17], [-20, -16, 15], [26, -16, 14],
    [-14, 20, 16], [18, 22, 15], [-24, 14, 14], [30, -12, 16],
  ];

  treePositions.forEach(([x, z, h]) => {
    const height = h + (Math.random() - 0.5) * 3;
    const tree = createAraucaria(height);
    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  });
}

function addTropicalBushes(scene) {
  // Monstera / tropical plants near the deck (as shown in the renders)
  const leafGreenDark = new THREE.MeshStandardMaterial({
    color: 0x1a4a1a, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide,
  });
  const leafGreen = new THREE.MeshStandardMaterial({
    color: 0x2a6a22, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide,
  });
  const leafGreenLight = new THREE.MeshStandardMaterial({
    color: 0x3a8a2a, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide,
  });

  // Create monstera-like leaf shape (large oval)
  const leafGeo = new THREE.CircleGeometry(0.5, 8);

  // Positions around the deck edges and house perimeter
  const bushClusters = [
    // Front of deck (as in render image 01)
    { center: [3, -14], count: 12, spread: 3 },
    { center: [7, -14], count: 10, spread: 2.5 },
    { center: [10, -13], count: 8, spread: 2 },
    // Left side
    { center: [-1.5, -8], count: 8, spread: 2 },
    { center: [-1.5, -4], count: 6, spread: 1.5 },
    // Right side
    { center: [13.5, -5], count: 8, spread: 2 },
    { center: [13.5, -9], count: 6, spread: 1.5 },
    // Near pool
    { center: [6.5, -12], count: 6, spread: 1.5 },
    { center: [10.5, -12], count: 6, spread: 1.5 },
  ];

  bushClusters.forEach((cluster) => {
    const [cx, cz] = cluster.center;
    for (let i = 0; i < cluster.count; i++) {
      const x = cx + (Math.random() - 0.5) * cluster.spread;
      const z = cz + (Math.random() - 0.5) * cluster.spread;
      const scale = 0.4 + Math.random() * 0.6;
      const height = 0.2 + Math.random() * 0.6;

      // Random leaf material
      const mats = [leafGreenDark, leafGreen, leafGreenLight];
      const mat = mats[Math.floor(Math.random() * mats.length)];

      const leaf = new THREE.Mesh(leafGeo, mat);
      leaf.position.set(x, height, z);
      leaf.rotation.x = -0.3 - Math.random() * 0.5; // Tilt outward
      leaf.rotation.y = Math.random() * Math.PI * 2;
      leaf.rotation.z = (Math.random() - 0.5) * 0.3;
      leaf.scale.set(scale, scale * 1.3, scale);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      scene.add(leaf);
    }
  });

  // Some larger bush volumes (sphere approximation)
  const bushGeo = new THREE.SphereGeometry(0.6, 8, 6);
  const bushPositions = [
    [-2, -10, 0.8], [-2, -6, 0.7], [14, -7, 0.9], [14, -3, 0.7],
    [1, -15, 0.6], [5, -15, 0.7], [9, -15, 0.5], [12, -14, 0.6],
  ];

  bushPositions.forEach(([x, z, s]) => {
    const hue = 110 + Math.random() * 30;
    const light = 18 + Math.random() * 12;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue}, 55%, ${light}%)`),
      roughness: 0.8,
    });
    const bush = new THREE.Mesh(bushGeo, mat);
    bush.position.set(x, s * 0.5, z);
    bush.scale.set(s, s * 0.7, s);
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
  });
}

function addParticles(scene) {
  const count = 400;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 50 + 5;
    positions[i * 3 + 1] = 0.5 + Math.random() * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffee, size: 0.025,
    transparent: true, opacity: 0.3,
  });

  scene.add(new THREE.Points(geo, mat));
}
