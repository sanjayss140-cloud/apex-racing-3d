import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const CAR_CONFIGS = [
  {
    id: 0,
    type: 'bolide',
    name: 'Bugatti Tourbillon Bolide',
    manufacturer: 'Bugatti',
    paintColor: 0x38bdf8, // French Racing Ice Blue Metallic
    secondaryColor: 0x0a192f, // Deep Blue Carbon
    accentColor: 0x00f0ff, // Bugatti Electric Cyan
    caliperColor: 0x00f0ff,
    rimColor: 0x0f172a, // Diamond-Cut Jet Black Alloy
    flameColor: 0x00f0ff, // Cyan Plasma Nitro Flames
    roughness: 0.12,
    metalness: 0.90,
    description: 'V16 Quad-Turbo • French Racing Blue (500 KM/H)'
  },
  {
    id: 1,
    type: 'huayra',
    name: 'Pagani Huayra BC',
    manufacturer: 'Pagani',
    paintColor: 0x420c15, // Deep Midnight Cherry Burgundy Gloss Carbon
    secondaryColor: 0x1a1215,
    accentColor: 0xfacc15, // 24K Gold Trim
    caliperColor: 0xeab308, // Anodized Gold
    rimColor: 0xfacc15, // Forged 24K Gold Alloy
    flameColor: 0xff7700, // Amber Nitro Flames
    roughness: 0.16,
    metalness: 0.82,
    description: 'Twin-Turbo V12 • Forged 24K Gold Alloy Rims (500 KM/H)'
  },
  {
    id: 2,
    type: 'apollo',
    name: 'Apollo Intensa Emozione',
    manufacturer: 'Apollo Automobil',
    paintColor: 0x18181b, // Stealth Onyx Satin Carbon
    secondaryColor: 0x3f0e1f, // Deep Crimson Carbon
    accentColor: 0xdc2626, // Crimson Red
    caliperColor: 0xdc2626,
    rimColor: 0xa16207, // Burnished Bronze
    flameColor: 0xff1744, // Crimson Fire Nitro
    roughness: 0.25,
    metalness: 0.70,
    description: '6.3L V12 Track Weapon • Burnished Bronze Rims (500 KM/H)'
  },
  {
    id: 3,
    type: 'jesko',
    name: 'Koenigsegg Jesko Absolut',
    manufacturer: 'Koenigsegg',
    paintColor: 0xf8fafc, // Ghost Arctic White Pearlescent
    secondaryColor: 0x0f172a,
    accentColor: 0xdc2626, // Apex Crimson
    caliperColor: 0xdc2626,
    rimColor: 0x64748b, // Satin Titanium Monoblock
    flameColor: 0x818cf8, // High-Velocity Violet Plasma (500 KM/H)
    roughness: 0.10,
    metalness: 0.94,
    description: 'Twin-Turbo V8 • Ghost Arctic White Pearlescent (500 KM/H)'
  },
  {
    id: 4,
    type: 'mclaren_solus',
    name: 'McLaren Solus GT',
    manufacturer: 'McLaren',
    paintColor: 0xea580c, // Volcano Papaya Orange Metallic
    secondaryColor: 0x18181b,
    accentColor: 0xfacc15,
    caliperColor: 0xf97316, // Papaya Orange
    rimColor: 0x09090b, // Satin Gloss Black Carbon
    flameColor: 0xff5722, // Fiery Papaya Flame
    roughness: 0.14,
    metalness: 0.88,
    description: '5.2L V10 Prototype • Papaya Orange Metallic (500 KM/H)'
  },
  {
    id: 5,
    type: 'daytona_sp3',
    name: 'Ferrari Daytona SP3',
    manufacturer: 'Ferrari',
    paintColor: 0xdc2626, // Rosso Corsa Deep Racing Red
    secondaryColor: 0x141416,
    accentColor: 0xfacc15, // Giallo Modena
    caliperColor: 0xfacc15, // Giallo Modena Yellow
    rimColor: 0xf1f5f9, // Forged Silver Chrome
    flameColor: 0xff0033, // Brilliant Red Racing Flame
    roughness: 0.15,
    metalness: 0.88,
    description: '6.5L V12 Icona • Rosso Corsa & Silver Chrome (500 KM/H)'
  }
];

class HypercarModelManager {
  constructor() {
    this.templateScene = null;
    this.loadingPromise = null;
  }

  loadTemplate() {
    if (this.templateScene) {
      return Promise.resolve(this.templateScene);
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      const rawBase = import.meta.env.BASE_URL || './';
      const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
      const dracoPath = `${cleanBase}draco/`;
      const modelPath = `${cleanBase}ferrari.glb`;

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(dracoPath);
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        modelPath,
        (gltf) => {
          this.templateScene = gltf.scene;
          this.templateScene.scale.set(1.0, 1.0, 1.0);
          this.templateScene.rotation.y = Math.PI; // Standard car orientation: forward +Z
          this.templateScene.position.set(0, 0.02, 0);
          resolve(this.templateScene);
        },
        undefined,
        (err) => {
          console.error('Failed to load hypercar base 3D model:', err);
          reject(err);
        }
      );
    });

    return this.loadingPromise;
  }
}

export const hypercarModelManager = new HypercarModelManager();

export function buildRealisticHypercar(templateScene, cfg) {
  // Deep clone template hierarchy
  const model = templateScene.clone(true);

  let wheelFL = null;
  let wheelFR = null;
  let wheelRL = null;
  let wheelRR = null;
  let steeringWheel = null;
  let taillightMat = null;
  const bodyMeshes = [];
  const flames = [];

  // 1. Bespoke Hypercar PBR Materials
  const paintMat = new THREE.MeshStandardMaterial({
    color: cfg.paintColor,
    roughness: cfg.roughness !== undefined ? cfg.roughness : 0.15,
    metalness: cfg.metalness !== undefined ? cfg.metalness : 0.88,
    envMapIntensity: 2.5
  });
  bodyMeshes.push(paintMat);

  const carbonGlossMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.22,
    metalness: 0.65,
    envMapIntensity: 2.0
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: cfg.rimColor || 0xf8fafc,
    roughness: 0.12,
    metalness: 0.94,
    envMapIntensity: 2.2
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: cfg.caliperColor || 0xdc2626,
    roughness: 0.25,
    metalness: 0.80
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: cfg.accentColor || 0xfacc15,
    roughness: 0.20,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x070d18,
    roughness: 0.04,
    metalness: 0.30,
    transparent: true,
    opacity: 0.74
  });

  taillightMat = new THREE.MeshStandardMaterial({
    color: 0x880000,
    emissive: 0xff0000,
    emissiveIntensity: 0.9,
    roughness: 0.20,
    metalness: 0.10
  });

  const ledHeadlightMat = new THREE.MeshBasicMaterial({
    color: cfg.id === 0 ? 0x00f0ff : (cfg.id === 2 ? 0xff4466 : 0xffffff)
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.88,
    metalness: 0.08
  });

  // 2. Traverse Cloned Supercar Hierarchy
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = false;
      child.frustumCulled = false;

      const name = child.name.toLowerCase();

      if (name === 'body') {
        child.material = paintMat;
        bodyMeshes.push(child);
      } else if (name === 'glass') {
        child.material = glassMat;
      } else if (name === 'carbon' || name === 'carbon_fibre_trim' || name === 'carbon_fibre') {
        child.material = carbonGlossMat;
      } else if (name.startsWith('rim_') || name === 'chrome' || name === 'metal') {
        child.material = rimMat;
      } else if (name === 'lights_red') {
        child.material = taillightMat;
      } else if (name === 'leds' || name === 'lights') {
        child.material = ledHeadlightMat;
      } else if (name.startsWith('tire') || name === 'wipers') {
        child.material = tireMat;
      } else if (name.startsWith('brake')) {
        child.material = caliperMat;
      } else if (name.startsWith('centre') || name === 'yellow_trim') {
        child.material = accentMat;
      }
    }

    if (child.name === 'wheel_fl') wheelFL = child;
    if (child.name === 'wheel_fr') wheelFR = child;
    if (child.name === 'wheel_rl') wheelRL = child;
    if (child.name === 'wheel_rr') wheelRR = child;
    if (child.name === 'steering_wheel') steeringWheel = child;
  });

  // 3. High-Velocity Nitro Exhaust Flames (placed precisely at rear exhaust tips)
  const flameGroup = new THREE.Group();
  model.add(flameGroup);

  const addFlame = (x, y, z, scale = 1.0) => {
    const flameGeo = new THREE.ConeGeometry(0.07 * scale, 1.2 * scale, 14);
    flameGeo.rotateX(Math.PI / 2); // Flame shoots rearward (-Z)
    const flameMat = new THREE.MeshBasicMaterial({
      color: cfg.flameColor || 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z);
    flame.visible = false;
    flame.baseScale = scale;
    flameGroup.add(flame);
    flames.push(flame);
  };

  if (cfg.type === 'bolide') {
    // Quad exhaust tips
    addFlame(-0.24, 0.36, -2.15, 0.95);
    addFlame(-0.08, 0.36, -2.15, 0.95);
    addFlame(0.08, 0.36, -2.15, 0.95);
    addFlame(0.24, 0.36, -2.15, 0.95);
  } else if (cfg.type === 'huayra') {
    // Quad rocket cluster
    addFlame(-0.08, 0.40, -2.15, 0.85);
    addFlame(0.08, 0.40, -2.15, 0.85);
    addFlame(-0.08, 0.32, -2.15, 0.85);
    addFlame(0.08, 0.32, -2.15, 0.85);
  } else if (cfg.type === 'apollo') {
    // Triple exhaust
    addFlame(-0.14, 0.36, -2.15, 0.95);
    addFlame(0.0, 0.38, -2.15, 1.05);
    addFlame(0.14, 0.36, -2.15, 0.95);
  } else if (cfg.type === 'jesko') {
    // High-output central jet
    addFlame(0.0, 0.36, -2.15, 1.35);
  } else if (cfg.type === 'mclaren_solus') {
    // Dual high exhaust
    addFlame(-0.16, 0.38, -2.15, 1.0);
    addFlame(0.16, 0.38, -2.15, 1.0);
  } else {
    // Dual racing exhaust (Ferrari Daytona SP3)
    addFlame(-0.16, 0.36, -2.15, 1.05);
    addFlame(0.16, 0.36, -2.15, 1.05);
  }

  return {
    group: model,
    wheelFL,
    wheelFR,
    wheelRL,
    wheelRR,
    steeringWheel,
    taillightMat,
    flames,
    bodyMeshes
  };
}
