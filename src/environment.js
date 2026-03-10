import * as THREE from 'three';

export function setupEnvironment(scene) {
  // Extended ground plane (grass)
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x4a6b3a,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Additional pine trees around the scene for immersion
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5e3a1e, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a5428, roughness: 0.8 });
  const leafMatLight = new THREE.MeshStandardMaterial({ color: 0x3a7a30, roughness: 0.8 });

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 8, 6);
  const coneGeo = new THREE.ConeGeometry(2.0, 5, 6);
  const coneSmallGeo = new THREE.ConeGeometry(1.5, 4, 6);

  // Tree positions (beyond the house area)
  const treePositions = [
    [-12, -8], [-8, -14], [-15, 2], [-10, 10], [-14, -2],
    [20, -12], [24, -6], [18, 8], [22, 4], [25, -2],
    [-6, -16], [2, -18], [8, -16], [14, -18], [16, -14],
    [-12, 12], [-8, 16], [0, 18], [8, 16], [16, 12],
    [-18, -10], [-16, 6], [28, 0], [26, 8], [-4, -20],
    [12, -20], [20, 14], [-14, 14], [24, -14], [-18, -4],
    // Closer trees for atmosphere
    [-4, -10], [15, -8], [-6, 6], [16, 8],
  ];

  treePositions.forEach(([x, z], i) => {
    const heightVar = 0.7 + Math.random() * 0.6;
    const group = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.scale.y = heightVar;
    trunk.position.y = 4 * heightVar;
    trunk.castShadow = true;
    group.add(trunk);

    // Canopy (two cones for pine shape)
    const mat = i % 2 === 0 ? leafMat : leafMatLight;
    const topCone = new THREE.Mesh(coneSmallGeo, mat);
    topCone.position.y = 9 * heightVar;
    topCone.castShadow = true;
    group.add(topCone);

    const bottomCone = new THREE.Mesh(coneGeo, mat);
    bottomCone.position.y = 7 * heightVar;
    bottomCone.castShadow = true;
    group.add(bottomCone);

    group.position.set(x, 0, z);
    // Slight random rotation for variety
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
  });

  // Ambient particles (floating dust/pollen in sunlight)
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = 1 + Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xffffee,
    size: 0.04,
    transparent: true,
    opacity: 0.4,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
}
