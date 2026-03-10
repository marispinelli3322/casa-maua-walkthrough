import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Base render
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // SSAO — screen-space ambient occlusion (adds depth and realism to corners/crevices)
  const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssaoPass.kernelRadius = 0.8;
  ssaoPass.minDistance = 0.001;
  ssaoPass.maxDistance = 0.15;
  ssaoPass.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ssaoPass);

  // Bloom — subtle glow on bright areas (sunlight, glass reflections)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.15,  // strength (subtle)
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);

  // Output pass (color space conversion)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

export function resizePostProcessing(composer, width, height) {
  composer.setSize(width, height);
}
