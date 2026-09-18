import * as THREE from 'three';

export function createSunsetEnvironment(renderer, scene) {
  // Ultra-lightweight high-performance sunset sky hemisphere
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  // Vibrant Sunset Sky Gradient (Deep Violet -> Magenta -> Fiery Sunset Orange -> Golden Glow)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#090d1f'); // Deep Twilight
  grad.addColorStop(0.35, '#2e1065'); // Purple
  grad.addColorStop(0.55, '#a21caf'); // Magenta
  grad.addColorStop(0.72, '#f97316'); // Sunset Orange
  grad.addColorStop(0.85, '#fde047'); // Golden Horizon
  grad.addColorStop(0.92, '#0f172a'); // Ground Horizon
  grad.addColorStop(1.0, '#040711');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Radiant Sun on Horizon
  const sunGrad = ctx.createRadialGradient(512, 380, 5, 512, 380, 180);
  sunGrad.addColorStop(0.0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fef08a');
  sunGrad.addColorStop(0.5, '#f97316');
  sunGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(512, 380, 180, 0, Math.PI * 2);
  ctx.fill();

  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = skyTex;
  scene.environment = skyTex; // Reflection map without PMREM overhead
}
