let minimapCanvas, minimapCtx;
let houseGroup;

// House footprint in OBJ coords (before rotation)
// Main block: x=[0, 7.40], y=[0, 8.60]
// Annex: x=[7.40, 12.20], y=[1.90, 6.00]
// Deck: x=[-1.10, 12.20], y=[8.60, 12.20]
// Pool: x=[7.10, 9.90], y=[9.10, 11.90]

// After rotation: OBJ(x,y,z) -> Three.js(x, z, -y)
// So in minimap we show Three.js X (horizontal) and Three.js -Z (vertical, up = north)

const SCALE = 8; // pixels per meter
const OFFSET_X = 30; // pixel offset
const OFFSET_Z = 130; // pixel offset (since z is negative in Three.js)

function worldToMinimap(wx, wz) {
  return {
    x: OFFSET_X + wx * SCALE,
    y: OFFSET_Z + wz * SCALE,
  };
}

export function setupMinimap() {
  const container = document.getElementById('minimap');
  if (!container) return;

  minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = 160;
  minimapCanvas.height = 160;
  container.appendChild(minimapCanvas);
  minimapCtx = minimapCanvas.getContext('2d');
}

export function updateMinimap(camera) {
  if (!minimapCtx) return;

  const ctx = minimapCtx;
  ctx.clearRect(0, 0, 160, 160);

  // Background
  ctx.fillStyle = 'rgba(74, 107, 58, 0.3)';
  ctx.fillRect(0, 0, 160, 160);

  // Draw house footprint (main block)
  ctx.fillStyle = 'rgba(240, 236, 230, 0.5)';
  const main = worldToMinimap(0, 0);
  ctx.fillRect(main.x, main.y - 8.60 * SCALE, 7.40 * SCALE, 8.60 * SCALE);

  // Annex
  ctx.fillStyle = 'rgba(240, 236, 230, 0.4)';
  const annex = worldToMinimap(7.40, -1.90);
  ctx.fillRect(annex.x, annex.y - 4.10 * SCALE, 4.80 * SCALE, 4.10 * SCALE);

  // Deck
  ctx.fillStyle = 'rgba(158, 122, 82, 0.4)';
  const deck = worldToMinimap(-1.10, -8.60);
  ctx.fillRect(deck.x, deck.y - 3.60 * SCALE, 13.30 * SCALE, 3.60 * SCALE);

  // Pool
  ctx.fillStyle = 'rgba(58, 160, 192, 0.5)';
  const pool = worldToMinimap(7.10, -9.10);
  ctx.fillRect(pool.x, pool.y - 2.80 * SCALE, 2.80 * SCALE, 2.80 * SCALE);

  // Room labels (tiny)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '6px sans-serif';
  const labelSala = worldToMinimap(1.5, -5.5);
  ctx.fillText('Sala', labelSala.x, labelSala.y);
  const labelCoz = worldToMinimap(8.5, -3.8);
  ctx.fillText('Coz', labelCoz.x, labelCoz.y);
  const labelQt = worldToMinimap(1.0, -1.5);
  ctx.fillText('Qt', labelQt.x, labelQt.y);

  // Player position
  const pos = worldToMinimap(camera.position.x, camera.position.z);
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Player direction indicator
  const forward = { x: 0, y: 0, z: 0 };
  camera.getWorldDirection(forward);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x + forward.x * 10, pos.y + forward.z * 10);
  ctx.stroke();
}
