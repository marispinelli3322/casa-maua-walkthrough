import * as THREE from 'three';

// Points of interest — positions in Three.js world space
// After model rotation (-PI/2 on X): OBJ(x,y,z) -> Three.js(x, z, -y)
const POINTS_OF_INTEREST = [
  {
    name: 'Sala de Estar',
    desc: '35,45 m\u00B2 \u2014 Forro de madeira clara, lareira suspensa, piso de madeira escura',
    position: new THREE.Vector3(3.5, 2.5, -5.0),
    radius: 3.0,
  },
  {
    name: 'Sala de TV',
    desc: '8,55 m\u00B2 \u2014 Espa\u00E7o aconchegante sob o A-frame',
    position: new THREE.Vector3(2.0, 2.5, -2.5),
    radius: 2.0,
  },
  {
    name: 'Jantar',
    desc: 'Mesa redonda junto \u00E0 lareira, vista para o bosque',
    position: new THREE.Vector3(5.0, 2.5, -4.0),
    radius: 2.5,
  },
  {
    name: 'Cozinha',
    desc: '11,70 m\u00B2 \u2014 Ilha central, arm\u00E1rios verdes, forro de madeira',
    position: new THREE.Vector3(9.5, 2.5, -3.5),
    radius: 2.5,
  },
  {
    name: 'Lavabo',
    desc: '2,06 m\u00B2 \u2014 Parede de pedra natural, ilumina\u00E7\u00E3o indireta',
    position: new THREE.Vector3(11.0, 2.5, -5.0),
    radius: 1.5,
  },
  {
    name: 'Quarto T\u00E9rreo',
    desc: '13,65 m\u00B2 \u2014 Quarto no pavimento principal',
    position: new THREE.Vector3(1.8, 2.5, -1.5),
    radius: 2.5,
  },
  {
    name: 'Banho T\u00E9rreo',
    desc: '3,92 m\u00B2 \u2014 Banho do pavimento principal',
    position: new THREE.Vector3(1.5, 2.5, -3.8),
    radius: 1.5,
  },
  {
    name: 'Mezanino Superior',
    desc: '23,52 m\u00B2 \u2014 Quarto e banho sob o telhado A-frame',
    position: new THREE.Vector3(3.0, 5.9, -2.5),
    radius: 3.0,
  },
  {
    name: 'Deck Frontal',
    desc: 'Deck de madeira com vista para o bosque de pinheiros',
    position: new THREE.Vector3(5.0, 2.0, -10.0),
    radius: 4.0,
  },
  {
    name: 'Piscina',
    desc: 'Piscina t\u00E9rmica integrada ao deck',
    position: new THREE.Vector3(8.5, 2.0, -10.5),
    radius: 2.5,
  },
  {
    name: 'Terra\u00E7o do Anexo',
    desc: '27,36 m\u00B2 \u2014 Mezanino externo sobre a cozinha',
    position: new THREE.Vector3(9.8, 5.5, -4.0),
    radius: 3.0,
  },
  {
    name: 'Fachada Principal',
    desc: 'A-frame com grande pano de vidro triangular e estrutura met\u00E1lica escura',
    position: new THREE.Vector3(3.7, 2.5, -13.0),
    radius: 5.0,
  },
];

let currentPOI = null;
let fadeTimeout = null;

export function checkPointsOfInterest(camera) {
  const overlay = document.getElementById('poi-overlay');
  const nameEl = document.getElementById('poi-name');
  const descEl = document.getElementById('poi-desc');

  let closestPOI = null;
  let closestDist = Infinity;

  for (const poi of POINTS_OF_INTEREST) {
    const dist = camera.position.distanceTo(poi.position);
    if (dist < poi.radius && dist < closestDist) {
      closestPOI = poi;
      closestDist = dist;
    }
  }

  if (closestPOI && closestPOI !== currentPOI) {
    currentPOI = closestPOI;
    nameEl.textContent = closestPOI.name;
    descEl.textContent = closestPOI.desc;
    overlay.classList.add('visible');

    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      overlay.classList.remove('visible');
    }, 4000);
  } else if (!closestPOI && currentPOI) {
    currentPOI = null;
    overlay.classList.remove('visible');
  }
}
