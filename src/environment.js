import * as THREE from 'three';

export function setMapEnvironment(renderer, scene, mapIndex = 0) {
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  if (mapIndex === 1) {
    // MAP 1: Neo-Tokyo Cyber Midnight
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#020617'); // Pitch Midnight
    grad.addColorStop(0.35, '#090d24'); // Cyber Deep Indigo
    grad.addColorStop(0.65, '#1e1b4b'); // Tokyo Neon Haze
    grad.addColorStop(0.85, '#0284c7'); // Electric Cyan Horizon
    grad.addColorStop(0.92, '#ec4899'); // Neon Pink City Glow
    grad.addColorStop(1.0, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Neon Cyber Grid & Distant City Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const sx = (i * 73) % 1024;
      const sy = (i * 37) % 320;
      const sr = (i % 3 === 0) ? 1.5 : 0.8;
      ctx.fillRect(sx, sy, sr, sr);
    }

    // Distant Skyscraper Silhouette Skyline
    ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
    for (let x = 0; x < 1024; x += 32) {
      const h = 50 + ((x * 17) % 120);
      ctx.fillRect(x, 460 - h, 28, h);
    }
  } else if (mapIndex === 2) {
    // MAP 2: Volcanic Inferno & Obsidian Badlands
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#1c0505'); // Ash Blackened Sky
    grad.addColorStop(0.30, '#450a0a'); // Blood Crimson
    grad.addColorStop(0.60, '#7f1d1d'); // Magma Red
    grad.addColorStop(0.78, '#c2410c'); // Molten Orange
    grad.addColorStop(0.88, '#ea580c'); // Radiant Lava Glow
    grad.addColorStop(0.95, '#fbbf24'); // Scorching Caldera Rim
    grad.addColorStop(1.0, '#180808');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Fiery volcanic ash and ember flecks
    ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
    for (let i = 0; i < 50; i++) {
      const ex = (i * 61) % 1024;
      const ey = 200 + ((i * 31) % 250);
      const er = 1.2 + (i % 3);
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // MAP 0: 7 Wonders Golden Hour Grand Circuit
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#0a1128'); // Deep Royal Twilight Blue
    grad.addColorStop(0.30, '#1c2541'); // Deep Indigo
    grad.addColorStop(0.52, '#3a506b'); // Dusk Slate
    grad.addColorStop(0.68, '#c2410c'); // Deep Sunset Orange
    grad.addColorStop(0.82, '#f97316'); // Radiant Amber
    grad.addColorStop(0.90, '#fde047'); // Golden Horizon
    grad.addColorStop(0.95, '#1e293b'); // Horizon Transition
    grad.addColorStop(1.0, '#0b0f19');  // Ground
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Distant Soft Cirrus & Cumulus Sunset Cloud Silhouettes
    ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
    for (let i = 0; i < 30; i++) {
      const cx = (i * 97) % 1024;
      const cy = 310 + (Math.sin(i * 1.7) * 45);
      const cr = 45 + ((i * 13) % 40);
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.arc(cx + cr * 0.7, cy - 10, cr * 0.8, 0, Math.PI * 2);
      ctx.arc(cx + cr * 1.4, cy + 5, cr * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Radiant Golden Sun on Horizon
    const sunGrad = ctx.createRadialGradient(512, 420, 10, 512, 420, 220);
    sunGrad.addColorStop(0.0, '#ffffff');
    sunGrad.addColorStop(0.15, '#fef08a');
    sunGrad.addColorStop(0.40, '#f97316');
    sunGrad.addColorStop(0.70, 'rgba(249, 115, 22, 0.25)');
    sunGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 420, 220, 0, Math.PI * 2);
    ctx.fill();
  }

  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = skyTex;
  scene.environment = skyTex;
}

export function createSunsetEnvironment(renderer, scene) {
  setMapEnvironment(renderer, scene, 0);
}
