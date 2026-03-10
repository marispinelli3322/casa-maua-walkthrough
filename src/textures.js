import * as THREE from 'three';

// Generate procedural textures via Canvas for realistic appearance

function createCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createWoodTexture(baseColor = '#8B6F47', grainColor = '#6B4F27', scale = 1) {
  return createCanvasTexture(512, 512, (ctx, w, h) => {
    // Base
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Wood grain lines
    ctx.strokeStyle = grainColor;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 80; i++) {
      ctx.lineWidth = 0.5 + Math.random() * 2;
      ctx.beginPath();
      const y = Math.random() * h;
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * (2 + Math.random() * 3));
      }
      ctx.stroke();
    }

    // Knots
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3; i++) {
      const kx = Math.random() * w;
      const ky = Math.random() * h;
      const kr = 5 + Math.random() * 15;
      const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      grad.addColorStop(0, '#3a2a10');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
    }
    ctx.globalAlpha = 1;
  });
}

export function createWoodDarkTexture() {
  return createWoodTexture('#5a3a1e', '#3a2010');
}

export function createWoodLightTexture() {
  return createWoodTexture('#d4b88a', '#b89a6a');
}

export function createBrickTexture() {
  return createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#a05535';
    ctx.fillRect(0, 0, w, h);

    const brickW = 64;
    const brickH = 28;
    const mortarW = 3;

    // Mortar color
    ctx.fillStyle = '#8a7a6a';

    for (let row = 0; row < h / (brickH + mortarW); row++) {
      const y = row * (brickH + mortarW);
      ctx.fillRect(0, y, w, mortarW);

      const offset = (row % 2) * (brickW / 2);
      for (let col = 0; col < w / (brickW + mortarW) + 1; col++) {
        const x = col * (brickW + mortarW) + offset;
        ctx.fillRect(x, y, mortarW, brickH + mortarW);
      }
    }

    // Brick color variations
    for (let row = 0; row < h / (brickH + mortarW); row++) {
      const y = row * (brickH + mortarW) + mortarW;
      const offset = (row % 2) * (brickW / 2);
      for (let col = 0; col < w / (brickW + mortarW) + 1; col++) {
        const x = col * (brickW + mortarW) + offset + mortarW;
        const hue = 8 + Math.random() * 12;
        const light = 35 + Math.random() * 15;
        ctx.fillStyle = `hsl(${hue}, 55%, ${light}%)`;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, y, brickW - mortarW, brickH - mortarW);
      }
    }
    ctx.globalAlpha = 1;

    // Subtle noise
    const imgData = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

export function createGrassTexture() {
  return createCanvasTexture(512, 512, (ctx, w, h) => {
    // Base green
    ctx.fillStyle = '#4a6b3a';
    ctx.fillRect(0, 0, w, h);

    // Grass blades
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 3 + Math.random() * 8;
      const hue = 90 + Math.random() * 40;
      const light = 25 + Math.random() * 25;
      ctx.strokeStyle = `hsl(${hue}, 50%, ${light}%)`;
      ctx.lineWidth = 0.5 + Math.random();
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y - len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

export function createMetalRoofTexture() {
  return createCanvasTexture(512, 512, (ctx, w, h) => {
    // Dark metal base
    ctx.fillStyle = '#2a2d30';
    ctx.fillRect(0, 0, w, h);

    // Corrugated lines (standing seam)
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = '#222528';
      ctx.fillRect(x, 0, 4, h);
      ctx.fillStyle = '#353840';
      ctx.fillRect(x + 4, 0, 2, h);
    }

    // Subtle reflection variation
    const imgData = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8;
      imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

export function createStoneTexture() {
  return createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(0, 0, w, h);

    // Random stones
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rx = 15 + Math.random() * 40;
      const ry = 10 + Math.random() * 30;
      const hue = 30 + Math.random() * 20;
      const light = 55 + Math.random() * 20;
      ctx.fillStyle = `hsl(${hue}, 15%, ${light}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

export function createConcreteTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c8c4be';
    ctx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  });
}

export function createWaterTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#2a7a9a');
    grad.addColorStop(0.5, '#3a9ab5');
    grad.addColorStop(1, '#2a8aa5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Caustics-like pattern
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 10 + Math.random() * 30;
      ctx.fillStyle = `rgba(200, 240, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
