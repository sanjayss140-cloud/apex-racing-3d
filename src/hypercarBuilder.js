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
    description: 'V16 Quad-Turbo • Le Mans Dorsal Fin & Curved GT Wing (500 KM/H)'
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
    flameColor: 0xff7700, // Amber / Orange Nitro Flames
    roughness: 0.16,
    metalness: 0.82,
    description: 'Twin-Turbo V12 • 24K Gold Forged Rims & Quad Rocket Exhaust (500 KM/H)'
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
    flameColor: 0xff1744, // Crimson Dragon Fire
    roughness: 0.25,
    metalness: 0.70,
    description: '6.3L V12 Track Weapon • Trident Batwing & Front Dive Planes (500 KM/H)'
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
    flameColor: 0x818cf8, // High-Velocity Violet/Blue Plasma Flame
    roughness: 0.10,
    metalness: 0.94,
    description: 'Twin-Turbo V8 • Twin Vertical Stabilizer Fins & Longtail (500 KM/H)'
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
    description: '5.2L V10 Prototype • Roof Ram-Air Snorkel & GT3 Wing (500 KM/H)'
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
    description: '6.5L V12 Icona • Full-Width Rear Strakes & Cyber Lightbar (500 KM/H)'
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

  // 3. Bespoke Aerodynamic Hypercar Package
  const aeroGroup = new THREE.Group();
  model.add(aeroGroup);

  const addFlame = (x, y, z, scale = 1.0) => {
    const flameGeo = new THREE.ConeGeometry(0.08 * scale, 1.25 * scale, 14);
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
    aeroGroup.add(flame);
    flames.push(flame);
  };

  if (cfg.type === 'bolide') {
    // BUGATTI BOLIDE / TOURBILLON
    // Massive Le Mans Curved Carbon Rear Wing
    const wingMain = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 0.42), carbonGlossMat);
    wingMain.position.set(0, 1.08, -1.95);
    wingMain.rotation.x = 0.06;
    aeroGroup.add(wingMain);

    // Cyan illuminated endplates
    [-1.09, 1.09].forEach(x => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.52), accentMat);
      endplate.position.set(x, 1.08, -1.95);
      aeroGroup.add(endplate);
    });

    // Twin aerodynamic wing pylons
    [-0.52, 0.52].forEach(x => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.16), carbonGlossMat);
      pylon.position.set(x, 0.86, -1.90);
      pylon.rotation.x = -0.15;
      aeroGroup.add(pylon);
    });

    // Central Le Mans Dorsal Shark Fin
    const dorsalFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 1.35), carbonGlossMat);
    dorsalFin.position.set(0, 1.02, -1.25);
    aeroGroup.add(dorsalFin);

    // Front low carbon dive planes
    [-0.92, 0.92].forEach(x => {
      const canard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.18), carbonGlossMat);
      canard.position.set(x, 0.22, 2.05);
      canard.rotation.z = (x > 0 ? -1 : 1) * 0.25;
      aeroGroup.add(canard);
    });

    // Quad cyan plasma exhaust flames
    addFlame(-0.28, 0.36, -2.18, 1.0);
    addFlame(-0.10, 0.36, -2.18, 1.0);
    addFlame(0.10, 0.36, -2.18, 1.0);
    addFlame(0.28, 0.36, -2.18, 1.0);
  }
  else if (cfg.type === 'huayra') {
    // PAGANI HUAYRA BC
    // Curved Swan-Neck GT Wing
    const wingMain = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.04, 0.36), carbonGlossMat);
    wingMain.position.set(0, 1.12, -1.98);
    wingMain.rotation.x = 0.08;
    aeroGroup.add(wingMain);

    // Italian Tricolore / Gold endplates
    [-0.98, 0.98].forEach(x => {
      const ep = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.42), accentMat);
      ep.position.set(x, 1.12, -1.98);
      aeroGroup.add(ep);
    });

    // Arched Swan-Neck Mounts
    [-0.45, 0.45].forEach(x => {
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.14), carbonGlossMat);
      neck.position.set(x, 0.92, -1.92);
      neck.rotation.x = -0.22;
      aeroGroup.add(neck);
    });

    // Iconic Pagani Quad Rocket Exhaust Cluster
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.16, 24), accentMat);
    heatShield.rotation.x = Math.PI / 2;
    heatShield.position.set(0, 0.64, -2.12);
    aeroGroup.add(heatShield);

    // Quad rocket exhaust flames
    addFlame(-0.07, 0.69, -2.18, 0.85);
    addFlame(0.07, 0.69, -2.18, 0.85);
    addFlame(-0.07, 0.58, -2.18, 0.85);
    addFlame(0.07, 0.58, -2.18, 0.85);
  }
  else if (cfg.type === 'apollo') {
    // APOLLO INTENSA EMOZIONE (IE)
    // Massive 2.25m Trident Batwing
    const batwingL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.045, 0.40), carbonGlossMat);
    batwingL.position.set(-0.55, 1.16, -1.96);
    batwingL.rotation.z = -0.08;
    batwingL.rotation.x = 0.08;
    aeroGroup.add(batwingL);

    const batwingR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.045, 0.40), carbonGlossMat);
    batwingR.position.set(0.55, 1.16, -1.96);
    batwingR.rotation.z = 0.08;
    batwingR.rotation.x = 0.08;
    aeroGroup.add(batwingR);

    // Central Batwing Spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.45), accentMat);
    spine.position.set(0, 1.12, -1.96);
    aeroGroup.add(spine);

    // Aggressive downward curved wing endplates
    [-1.08, 1.08].forEach(x => {
      const ep = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.50), accentMat);
      ep.position.set(x, 1.08, -1.96);
      ep.rotation.z = (x > 0 ? 1 : -1) * 0.12;
      aeroGroup.add(ep);
    });

    // Multi-tier front dive planes
    [-0.92, 0.92].forEach(x => {
      const dp1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.16), carbonGlossMat);
      dp1.position.set(x, 0.28, 2.05);
      dp1.rotation.z = (x > 0 ? -1 : 1) * 0.3;
      const dp2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.14), carbonGlossMat);
      dp2.position.set(x * 0.95, 0.42, 1.95);
      dp2.rotation.z = (x > 0 ? -1 : 1) * 0.35;
      aeroGroup.add(dp1, dp2);
    });

    // Inverted triple exhaust flames
    addFlame(-0.14, 0.44, -2.18, 0.95);
    addFlame(0.14, 0.44, -2.18, 0.95);
    addFlame(0.0, 0.32, -2.18, 1.05);
  }
  else if (cfg.type === 'jesko') {
    // KOENIGSEGG JESKO ABSOLUT
    // Low-Drag High-Speed Configuration: Twin Vertical Stabilizer Shark Fins
    [-0.52, 0.52].forEach(x => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.88), carbonGlossMat);
      fin.position.set(x, 0.96, -1.75);
      fin.rotation.y = (x > 0 ? -1 : 1) * 0.03;
      aeroGroup.add(fin);

      const finLip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.90), accentMat);
      finLip.position.set(x, 1.22, -1.75);
      aeroGroup.add(finLip);
    });

    // Extended 0.85m Carbon Longtail Diffuser
    const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.08, 0.55), carbonGlossMat);
    longtail.position.set(0, 0.25, -2.32);
    longtail.rotation.x = -0.12;
    aeroGroup.add(longtail);

    // Single massive central plasma jet exhaust flame
    addFlame(0, 0.42, -2.25, 1.35);
  }
  else if (cfg.type === 'mclaren_solus') {
    // MCLAREN SOLUS GT
    // Roof Ram-Air Snorkel Intake
    const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.65), carbonGlossMat);
    snorkel.position.set(0, 1.38, -0.35);
    snorkel.rotation.x = -0.15;
    aeroGroup.add(snorkel);

    const scoopLip = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.03, 12, 24), accentMat);
    scoopLip.position.set(0, 1.44, -0.05);
    aeroGroup.add(scoopLip);

    // Giant Twin-Tier Swan-Neck GT3 Rear Wing
    const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.04, 0.38), carbonGlossMat);
    wingUpper.position.set(0, 1.20, -1.98);
    wingUpper.rotation.x = 0.09;
    aeroGroup.add(wingUpper);

    const wingLower = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.03, 0.24), carbonGlossMat);
    wingLower.position.set(0, 0.98, -1.94);
    aeroGroup.add(wingLower);

    // DRS Hydraulic Housing
    const drsBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.16), accentMat);
    drsBox.position.set(0, 1.24, -1.98);
    aeroGroup.add(drsBox);

    // Endplates in Papaya Accent
    [-1.08, 1.08].forEach(x => {
      const ep = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.46), accentMat);
      ep.position.set(x, 1.15, -1.98);
      aeroGroup.add(ep);
    });

    // Top-exit exhausts spitting Papaya fire
    addFlame(-0.25, 0.72, -1.82, 0.95);
    addFlame(0.25, 0.72, -1.82, 0.95);
  }
  else if (cfg.type === 'daytona_sp3') {
    // FERRARI DAYTONA SP3
    // 5 Stacked Full-Width Rear Horizontal Aerodynamic Strakes
    for (let s = 0; s < 5; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.035, 0.22), (s % 2 === 0 ? carbonGlossMat : paintMat));
      strake.position.set(0, 0.36 + s * 0.085, -2.16);
      aeroGroup.add(strake);
    }

    // Monolithic Cyber Red LED Taillight Bar
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.035, 0.08), taillightMat);
    lightbar.position.set(0, 0.74, -2.17);
    aeroGroup.add(lightbar);

    // Front carbon vortex generators
    [-0.85, 0.85].forEach(x => {
      const vg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.20), carbonGlossMat);
      vg.position.set(x, 0.24, 2.08);
      aeroGroup.add(vg);
    });

    // Dual high-mounted titanium exhaust cannons
    [-0.26, 0.26].forEach(x => {
      addFlame(x, 0.54, -2.20, 1.05);
    });
  }

  // Ensure all aero parts are never culled prematurely
  aeroGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = false;
      child.frustumCulled = false;
    }
  });

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
