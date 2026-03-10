import * as THREE from 'three';

let sunLight, ambientLight, hemiLight;

// Sun position based on time of day (simplified solar path)
function getSunPosition(hour) {
  // Map 0-24h to sun angle
  // Sunrise ~6h, noon ~12h, sunset ~18h
  const angle = ((hour - 6) / 12) * Math.PI; // 0 at sunrise, PI at sunset
  const elevation = Math.sin(angle) * 0.8;
  const azimuth = Math.cos(angle * 0.5);

  return new THREE.Vector3(
    azimuth * 40,
    Math.max(elevation * 40, -5),
    -20 + Math.sin(angle) * 10
  );
}

function getSkyColor(hour) {
  if (hour < 5 || hour > 21) return new THREE.Color(0x0a0a1a); // Night
  if (hour < 7) return new THREE.Color(0x4a3060); // Dawn
  if (hour < 9) return new THREE.Color(0x7a9aba); // Morning
  if (hour < 16) return new THREE.Color(0x87CEEB); // Day
  if (hour < 18) return new THREE.Color(0xd4956a); // Golden hour
  if (hour < 20) return new THREE.Color(0x6a4070); // Dusk
  return new THREE.Color(0x1a1a3a); // Night approaching
}

function getSunIntensity(hour) {
  if (hour < 5 || hour > 21) return 0.0;
  if (hour < 7 || hour > 19) return 0.3;
  if (hour < 9 || hour > 17) return 1.5;
  return 2.5; // Midday
}

function getAmbientIntensity(hour) {
  if (hour < 5 || hour > 21) return 0.05;
  if (hour < 7 || hour > 19) return 0.15;
  return 0.4;
}

export function setupLighting(scene, hour = 10) {
  // Hemisphere light (sky/ground)
  hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a6b3a, 0.6);
  scene.add(hemiLight);

  // Ambient for fill
  ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Directional (sun)
  sunLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  updateLighting(scene, hour);
}

export function updateLighting(scene, hour) {
  const sunPos = getSunPosition(hour);
  sunLight.position.copy(sunPos);
  sunLight.intensity = getSunIntensity(hour);

  // Warm tint during golden hour
  if (hour > 16 && hour < 19) {
    sunLight.color.setHex(0xffaa60);
  } else if (hour < 8) {
    sunLight.color.setHex(0xffe0b0);
  } else {
    sunLight.color.setHex(0xfff4e0);
  }

  ambientLight.intensity = getAmbientIntensity(hour);

  const skyColor = getSkyColor(hour);
  scene.fog.color.copy(skyColor);
  scene.background = skyColor;

  hemiLight.color.copy(skyColor);
  hemiLight.intensity = getAmbientIntensity(hour) + 0.2;
}
