import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Enhanced materials to make the model look better than flat colors
const materialOverrides = {
  terrain_grass: {
    color: 0x4a6b3a,
    roughness: 0.95,
    metalness: 0.0,
  },
  terrain_soil: {
    color: 0x8a7560,
    roughness: 0.9,
    metalness: 0.0,
  },
  deck_wood: {
    color: 0x9e7a52,
    roughness: 0.7,
    metalness: 0.0,
  },
  floor_wood_dark: {
    color: 0x6b4426,
    roughness: 0.6,
    metalness: 0.0,
  },
  roof_dark: {
    color: 0x2a2d30,
    roughness: 0.3,
    metalness: 0.7,
  },
  wood_light: {
    color: 0xd4b88a,
    roughness: 0.5,
    metalness: 0.0,
  },
  wood_medium: {
    color: 0xb07840,
    roughness: 0.55,
    metalness: 0.0,
  },
  wall_white: {
    color: 0xf0ece6,
    roughness: 0.8,
    metalness: 0.0,
  },
  brick: {
    color: 0xb86b4a,
    roughness: 0.85,
    metalness: 0.0,
  },
  glass: {
    color: 0xadd8e6,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    envMapIntensity: 2.0,
  },
  frame_black: {
    color: 0x1a1c1e,
    roughness: 0.2,
    metalness: 0.8,
  },
  pool_coping: {
    color: 0xb0b4b6,
    roughness: 0.6,
    metalness: 0.0,
  },
  pool_shell: {
    color: 0x7ea0a8,
    roughness: 0.4,
    metalness: 0.0,
  },
  water: {
    color: 0x3aa0c0,
    roughness: 0.0,
    metalness: 0.2,
    transparent: true,
    opacity: 0.7,
    envMapIntensity: 3.0,
  },
  tree_trunk: {
    color: 0x5e3a1e,
    roughness: 0.9,
    metalness: 0.0,
  },
  tree_leaf: {
    color: 0x3a6830,
    roughness: 0.8,
    metalness: 0.0,
  },
};

export async function loadModel(scene, onProgress) {
  onProgress(10);

  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('/models/');

  return new Promise((resolve, reject) => {
    mtlLoader.load('projeto_pn_modelo_base.mtl', (mtlCreator) => {
      onProgress(30);
      mtlCreator.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(mtlCreator);
      objLoader.setPath('/models/');

      objLoader.load(
        'projeto_pn_modelo_base.obj',
        (obj) => {
          onProgress(70);

          // Upgrade all materials to PBR (MeshStandardMaterial)
          obj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              const matName = child.material?.name;
              const override = materialOverrides[matName];

              if (override) {
                const pbr = new THREE.MeshStandardMaterial({
                  color: override.color,
                  roughness: override.roughness,
                  metalness: override.metalness,
                  transparent: override.transparent || false,
                  opacity: override.opacity ?? 1.0,
                  side: override.side || THREE.FrontSide,
                  envMapIntensity: override.envMapIntensity || 1.0,
                });
                child.material = pbr;
              } else if (child.material) {
                // Convert any remaining Phong materials to Standard
                const oldMat = child.material;
                const pbr = new THREE.MeshStandardMaterial({
                  color: oldMat.color || 0x888888,
                  roughness: 0.7,
                  metalness: 0.0,
                });
                child.material = pbr;
              }

              child.material.side = THREE.DoubleSide;
            }
          });

          // The OBJ uses Y-up; Three.js uses Y-up by default, so no rotation needed.
          // But the OBJ model has Z as vertical (up). We need to rotate -90 on X.
          obj.rotation.x = -Math.PI / 2;

          scene.add(obj);
          onProgress(100);
          resolve(obj);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = 30 + (xhr.loaded / xhr.total) * 40;
            onProgress(Math.min(pct, 70));
          }
        },
        reject
      );
    });
  });
}
