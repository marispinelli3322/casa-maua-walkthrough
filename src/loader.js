import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import {
  createWoodTexture,
  createWoodDarkTexture,
  createWoodLightTexture,
  createBrickTexture,
  createGrassTexture,
  createMetalRoofTexture,
  createConcreteTexture,
  createWaterTexture,
  createStoneTexture,
} from './textures.js';

function buildMaterials() {
  const grassTex = createGrassTexture();
  grassTex.repeat.set(20, 20);

  const woodDeckTex = createWoodTexture('#9e7a52', '#7a5a32');
  woodDeckTex.repeat.set(3, 3);

  const woodDarkFloorTex = createWoodDarkTexture();
  woodDarkFloorTex.repeat.set(4, 4);

  const woodLightTex = createWoodLightTexture();
  woodLightTex.repeat.set(3, 3);

  const structureWoodTex = createWoodTexture('#6b3a1e', '#4a2812');
  structureWoodTex.repeat.set(1, 4);

  const brickTex = createBrickTexture();
  brickTex.repeat.set(2, 2);

  const metalTex = createMetalRoofTexture();
  metalTex.repeat.set(6, 10);

  const concreteTex = createConcreteTexture();
  concreteTex.repeat.set(2, 2);

  const waterTex = createWaterTexture();

  const stoneTex = createStoneTexture();
  stoneTex.repeat.set(1, 1);

  const furnitureWoodTex = createWoodTexture('#c4a06a', '#a8884a');
  furnitureWoodTex.repeat.set(1, 1);

  return {
    roof_metal_dark: new THREE.MeshStandardMaterial({
      map: metalTex, roughness: 0.25, metalness: 0.75, color: 0x3a3d42,
    }),
    structure_wood: new THREE.MeshStandardMaterial({
      map: structureWoodTex, roughness: 0.55, metalness: 0.0, color: 0x8B4513,
    }),
    wood_light: new THREE.MeshStandardMaterial({
      map: woodLightTex, roughness: 0.45, metalness: 0.0,
    }),
    wood_dark_floor: new THREE.MeshStandardMaterial({
      map: woodDarkFloorTex, roughness: 0.5, metalness: 0.0,
    }),
    deck_wood: new THREE.MeshStandardMaterial({
      map: woodDeckTex, roughness: 0.65, metalness: 0.0,
    }),
    brick: new THREE.MeshStandardMaterial({
      map: brickTex, roughness: 0.85, metalness: 0.0,
    }),
    wall_white: new THREE.MeshStandardMaterial({
      color: 0xf0ece6, roughness: 0.75, metalness: 0.0,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xadd8e6, roughness: 0.02, metalness: 0.1,
      transparent: true, opacity: 0.2, side: THREE.DoubleSide,
      envMapIntensity: 3.0,
    }),
    frame_black: new THREE.MeshStandardMaterial({
      color: 0x1a1c1e, roughness: 0.15, metalness: 0.85,
    }),
    water: new THREE.MeshStandardMaterial({
      map: waterTex, roughness: 0.0, metalness: 0.15,
      transparent: true, opacity: 0.75, envMapIntensity: 4.0,
    }),
    pool_tile: new THREE.MeshStandardMaterial({
      color: 0x6a9aa8, roughness: 0.3, metalness: 0.0,
    }),
    terrain_grass: new THREE.MeshStandardMaterial({
      map: grassTex, roughness: 0.95, metalness: 0.0,
    }),
    concrete: new THREE.MeshStandardMaterial({
      map: concreteTex, roughness: 0.6, metalness: 0.0,
    }),
    furniture_fabric: new THREE.MeshStandardMaterial({
      color: 0xc8bfa8, roughness: 0.9, metalness: 0.0,
    }),
    furniture_wood: new THREE.MeshStandardMaterial({
      map: furnitureWoodTex, roughness: 0.5, metalness: 0.0,
    }),
    kitchen_green: new THREE.MeshStandardMaterial({
      color: 0x5a7a52, roughness: 0.7, metalness: 0.0,
    }),
    stone_wall: new THREE.MeshStandardMaterial({
      map: stoneTex, roughness: 0.8, metalness: 0.0,
    }),
  };
}

export async function loadModel(scene, onProgress) {
  onProgress(10);

  const materials = buildMaterials();
  onProgress(25);

  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('/models/');

  return new Promise((resolve, reject) => {
    mtlLoader.load('casa_maua.mtl', (mtlCreator) => {
      onProgress(35);
      mtlCreator.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(mtlCreator);
      objLoader.setPath('/models/');

      objLoader.load(
        'casa_maua.obj',
        (obj) => {
          onProgress(70);

          obj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              const matName = child.material?.name;
              if (matName && materials[matName]) {
                child.material = materials[matName];
              } else if (child.material) {
                const oldMat = child.material;
                child.material = new THREE.MeshStandardMaterial({
                  color: oldMat.color || 0x888888,
                  roughness: 0.7,
                  metalness: 0.0,
                });
              }

              child.material.side = THREE.DoubleSide;
            }
          });

          // OBJ model uses Z-up, Three.js uses Y-up
          obj.rotation.x = -Math.PI / 2;

          scene.add(obj);
          onProgress(100);
          resolve(obj);
        },
        (xhr) => {
          if (xhr.total > 0) {
            const pct = 35 + (xhr.loaded / xhr.total) * 35;
            onProgress(Math.min(pct, 70));
          }
        },
        reject
      );
    });
  });
}
