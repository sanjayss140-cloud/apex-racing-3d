import * as THREE from 'three';

const textureCache = new Map();

export function getSandstoneTexture() {
  if (textureCache.has('sandstone')) return textureCache.get('sandstone');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const rowHeight = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    const blocksInRow = 6 + (r % 3);
    const blockWidth = 512 / blocksInRow;

    for (let b = 0; b < blocksInRow; b++) {
      const x = b * blockWidth;
      const shadeVar = (Math.random() - 0.5) * 28;
      const red = Math.min(255, Math.max(160, 217 + shadeVar));
      const green = Math.min(255, Math.max(100, 140 + shadeVar * 0.8));
      const blue = Math.min(255, Math.max(20, 45 + shadeVar * 0.5));

      ctx.fillStyle = `rgb(${red | 0}, ${green | 0}, ${blue | 0})`;
      ctx.fillRect(x + 2, y + 2, blockWidth - 4, rowHeight - 4);

      ctx.strokeStyle = 'rgba(255, 230, 150, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, blockWidth - 4, rowHeight - 4);
    }

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  for (let i = 0; i < 4000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(nx, ny, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('sandstone', tex);
  return tex;
}

export function getHieroglyphTexture() {
  if (textureCache.has('hieroglyph')) return textureCache.get('hieroglyph');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 238, 512, 18);

  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 18, 512, 12);
  ctx.fillRect(0, 226, 512, 12);

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glyphs = ['𓀀', '𓁐', '𓂀', '𓃭', '𓄿', '𓆃', '𓇋', '𓊃', '𓋹', '𓍯', '𓎛', '𓏏'];
  for (let i = 0; i < 12; i++) {
    const x = 24 + i * 42;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    if (ctx.strokeRoundRect) {
      ctx.strokeRoundRect(x - 16, 50, 32, 150, 16);
    } else {
      ctx.strokeRect(x - 16, 50, 32, 150);
    }
    ctx.fillText(glyphs[i % glyphs.length], x, 125);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('hieroglyph', tex);
  return tex;
}

export function getTravertineTexture() {
  if (textureCache.has('travertine')) return textureCache.get('travertine');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const blocks = 4;
    const bW = 512 / blocks;
    const offset = (r % 2) * (bW / 2);

    for (let b = -1; b <= blocks; b++) {
      const x = b * bW + offset;
      const shade = (Math.random() - 0.5) * 16;
      ctx.fillStyle = `rgb(${245 + shade | 0}, ${228 + shade | 0}, ${170 + shade | 0})`;
      ctx.fillRect(x + 2, y + 2, bW - 4, rowH - 4);

      ctx.fillStyle = 'rgba(120, 113, 108, 0.08)';
      ctx.fillRect(x + 10, y + rowH - 12, bW - 20, 8);
    }

    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('travertine', tex);
  return tex;
}

export function getTokyoBuildingTexture(style = 0) {
  const key = `tokyo_bldg_${style}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = style === 0 ? '#0f172a' : (style === 1 ? '#090d16' : '#1e1b4b');
  ctx.fillRect(0, 0, 512, 1024);

  const cols = 12;
  const rows = 32;
  const winW = 512 / cols;
  const winH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.42;
      if (isLit) {
        const palette = ['#fef08a', '#38bdf8', '#00f0ff', '#ffffff'];
        const col = palette[(Math.random() * palette.length) | 0];
        ctx.fillStyle = col;
        ctx.fillRect(c * winW + 4, r * winH + 4, winW - 8, winH - 8);
      } else {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.fillRect(c * winW + 4, r * winH + 4, winW - 8, winH - 8);
      }
    }
  }

  if (style === 0) {
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(60, 240, 392, 160);
    ctx.fillStyle = '#050811';
    ctx.fillRect(68, 248, 376, 144);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEO TOKYO', 256, 310);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('東京 // SPEED', 256, 360);
  } else if (style === 1) {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(60, 500, 392, 140);
    ctx.fillStyle = '#050811';
    ctx.fillRect(68, 508, 376, 124);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APEX RACING', 256, 565);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('極限速度 // 375 KMH', 256, 610);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, tex);
  return tex;
}

export function getStadiumRibbonTexture() {
  if (textureCache.has('stadium_ribbon')) return textureCache.get('stadium_ribbon');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050811';
  ctx.fillRect(0, 0, 1024, 128);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 1016, 120);

  const sponsors = ['FERRARI', 'APEX RUSH', 'PIRELLI', 'SHELL', 'BREMBO', 'TAG HEUER'];
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  sponsors.forEach((sp, i) => {
    const x = 90 + i * 168;
    ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#00f0ff';
    ctx.fillText(sp, x, 64);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('stadium_ribbon', tex);
  return tex;
}

export function getSpectatorCrowdTexture() {
  if (textureCache.has('crowd')) return textureCache.get('crowd');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 256);

  const rows = 16;
  const rowH = 256 / rows;
  const crowdColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.fillStyle = r % 2 === 0 ? '#0f172a' : '#1e293b';
    ctx.fillRect(0, y, 512, rowH);

    for (let c = 0; c < 48; c++) {
      const x = c * 10.6 + (Math.random() - 0.5) * 4;
      const col = crowdColors[(Math.random() * crowdColors.length) | 0];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y + rowH * 0.55, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('crowd', tex);
  return tex;
}

export function getMountainRockTexture() {
  if (textureCache.has('rock')) return textureCache.get('rock');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 12) {
    const v = (Math.random() - 0.5) * 40;
    ctx.fillStyle = `rgb(${51 + v | 0}, ${65 + v | 0}, ${85 + v | 0})`;
    ctx.fillRect(0, y, 512, 10 + (Math.random() - 0.5) * 6);
  }

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set('rock', tex);
  return tex;
}
