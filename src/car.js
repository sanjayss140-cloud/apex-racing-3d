import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { audio } from './audio.js';

export const CAR_CONFIGS = [
  {
    id: 0,
    type: 'tourbillon',
    name: 'Bugatti Tourbillon Bolide',
    manufacturer: 'Bugatti',
    paintColor: 0x7bb6d6, // Ice Metallic Sky Blue
    secondaryColor: 0x0a0f1d,
    accentColor: 0x00f0ff, // Electric Cyan Jewel LED
    caliperColor: 0x00f0ff,
    flameColor: 0x00f0ff,
    roughness: 0.12,
    metalness: 0.92,
    description: 'V16 Quad-Turbo • Curved GT Wing & Le Mans Dorsal Fin (500 KM/H)'
  },
  {
    id: 1,
    type: 'huayra_bc',
    name: 'Pagani Huayra BC',
    manufacturer: 'Pagani',
    paintColor: 0x420c15, // Deep Gloss Cherry Burgundy Carbon
    secondaryColor: 0x141416,
    accentColor: 0xfacc15, // Giallo Gold Pinstriping
    caliperColor: 0xfacc15,
    flameColor: 0xf59e0b,
    roughness: 0.14,
    metalness: 0.88,
    description: 'Twin-Turbo V12 • High Quad Cloverleaf Rocket & Roll Hoops (500 KM/H)'
  },
  {
    id: 2,
    type: 'apollo_ie',
    name: 'Apollo Intensa Emozione',
    manufacturer: 'Apollo',
    paintColor: 0x3b332d, // Matte Bronze Titanium Forged Carbon
    secondaryColor: 0x0a0a0b,
    accentColor: 0xef4444, // Apex Crimson
    caliperColor: 0xef4444,
    flameColor: 0xef4444,
    roughness: 0.18,
    metalness: 0.85,
    description: '6.3L V12 Screamer • Radical Trident Batwing & Stealth Diffuser (500 KM/H)'
  },
  {
    id: 3,
    type: 'jesko',
    name: 'Koenigsegg Jesko Absolut',
    manufacturer: 'Koenigsegg',
    paintColor: 0xf8fafc, // Ghost Arctic White
    secondaryColor: 0x0f172a,
    accentColor: 0xdc2626, // Apex Crimson
    caliperColor: 0xdc2626,
    flameColor: 0x818cf8, // Plasma Violet/Blue
    roughness: 0.10,
    metalness: 0.95,
    description: 'Twin-Turbo V8 • Twin Apex Shark Fins & 0.95m Longtail (500 KM/H)'
  },
  {
    id: 4,
    type: 'mclaren_solus',
    name: 'McLaren Solus GT',
    manufacturer: 'McLaren',
    paintColor: 0xea580c, // Volcano Papaya Metallic Orange
    secondaryColor: 0x18181b,
    accentColor: 0xfacc15,
    caliperColor: 0xea580c,
    flameColor: 0xff5722,
    roughness: 0.15,
    metalness: 0.90,
    description: '5.2L V10 Prototype • Roof Ram-Air Snorkel & Twin-Tier GT3 Wing (500 KM/H)'
  },
  {
    id: 5,
    type: 'daytona_sp3',
    name: 'Ferrari Daytona SP3',
    manufacturer: 'Ferrari',
    paintColor: 0xdc2626, // Rosso Corsa Deep Racing Red
    secondaryColor: 0x141416,
    accentColor: 0xfacc15, // Giallo Modena
    caliperColor: 0xfacc15,
    flameColor: 0xff1744,
    roughness: 0.15,
    metalness: 0.88,
    description: '6.5L V12 Icona • Full-Width Rear Strakes & Cyber Lightbar (500 KM/H)'
  }
];

// Shared Cache for Base 3D Model
let cachedGltfScene = null;
let gltfLoadingPromise = null;

function loadBaseCarModel() {
  if (cachedGltfScene) return Promise.resolve(cachedGltfScene);
  if (gltfLoadingPromise) return gltfLoadingPromise;

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Headless environment'));
  }

  const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : './';
  const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const dracoPath = `${cleanBase}draco/`;
  const modelPath = `${cleanBase}ferrari.glb`;

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(dracoPath);
  loader.setDRACOLoader(dracoLoader);

  gltfLoadingPromise = new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        cachedGltfScene = gltf.scene;
        resolve(cachedGltfScene);
      },
      undefined,
      (err) => {
        console.warn('Failed to load ferrari.glb, falling back to procedural hypercar chassis:', err);
        reject(err);
      }
    );
  });

  return gltfLoadingPromise;
}

export class Hypercar {
  constructor(scene) {
    this.scene = scene;

    // Hypercar Physics Constants: Tuned for 500+ KM/H Top Speed (Strictly identical across all 6 cars)
    this.acceleration = 68.0;        // Explosive power delivery
    this.nitroAcceleration = 115.0;  // Nitrous boost up to 600 KM/H
    this.maxSpeed = 139.0;           // ~500.4 km/h (139 m/s)
    this.maxNitroSpeed = 166.7;      // ~600.1 km/h (166.7 m/s)
    this.reverseMaxSpeed = 28.0;     // ~100 km/h
    this.braking = 95.0;             // High-G Carbon-ceramic brakes
    this.drag = 0.993;               // Sleek aerodynamic coefficient
    this.steerResponse = 2.4;
    this.driftGrip = 0.88;

    // Dynamic State
    this.position = new THREE.Vector3(0, 0.05, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.forwardSpeed = 0;
    this.lateralSpeed = 0;
    this.heading = 0;
    this.steerAngle = 0;
    this.currentGear = 1;
    this.rpm = 1200;
    this.isDrifting = false;
    this.isBraking = false;
    this.isNitro = false;
    this.nitroFuel = 100;
    this.carIndex = 0;

    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
      nitro: false
    };

    this.gearMaxSpeeds = [0, 30, 60, 90, 115, 140, 175];

    this.wheelRollAngle = 0;
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelRL = null;
    this.wheelRR = null;
    this.steeringWheel = null;
    this.flames = [];
    this.taillightMat = null;
    this.bodyMeshes = [];

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.carModelWrapper = new THREE.Group();
    this.group.add(this.carModelWrapper);

    this.aeroGroup = new THREE.Group();
    this.carModelWrapper.add(this.aeroGroup);

    this.setupContactShadow();
    this.setupSkidMarks();
    this.setupTireSmoke();
    this.setupSparks();
    this.setupHeadlights();

    this.isReady = false;
    this.readyCallbacks = [];

    // Load smooth realistic 3D mesh
    this.initModel();
  }

  onModelReady(cb) {
    if (this.isReady) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  initModel() {
    loadBaseCarModel()
      .then((baseScene) => {
        this.buildFromRealisticMesh(baseScene);
        this.isReady = true;
        this.readyCallbacks.forEach(cb => cb());
        this.readyCallbacks = [];
      })
      .catch(() => {
        // Safe procedural fallback if in node/test environment
        this.buildProceduralFallback();
        this.isReady = true;
        this.readyCallbacks.forEach(cb => cb());
        this.readyCallbacks = [];
      });
  }

  buildFromRealisticMesh(baseScene) {
    if (this.baseModel) {
      this.carModelWrapper.remove(this.baseModel);
    }

    const model = baseScene.clone(true);
    model.scale.set(1.0, 1.0, 1.0);
    model.rotation.y = Math.PI;
    model.position.set(0, 0.02, 0);

    this.bodyMeshes = [];
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelRL = null;
    this.wheelRR = null;
    this.steeringWheel = null;

    const cfg = CAR_CONFIGS[this.carIndex] || CAR_CONFIGS[0];

    const carPaintMat = new THREE.MeshStandardMaterial({
      color: cfg.paintColor,
      metalness: cfg.metalness,
      roughness: cfg.roughness,
      envMapIntensity: 2.5
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      metalness: 0.35,
      roughness: 0.4
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x070d18,
      metalness: 0.25,
      roughness: 0.04,
      transparent: true,
      opacity: 0.76
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.08
    });

    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.88,
      metalness: 0.08
    });

    const brakeRotorMat = new THREE.MeshStandardMaterial({
      color: 0x8b95a5,
      roughness: 0.28,
      metalness: 0.86
    });

    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0x880000,
      emissive: 0xff0000,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.1
    });

    const ledHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
        const name = child.name.toLowerCase();

        if (name === 'body') {
          child.material = carPaintMat;
          this.bodyMeshes.push(child);
        } else if (name === 'glass') {
          child.material = glassMat;
        } else if (name.includes('carbon')) {
          child.material = carbonMat;
        } else if (name.startsWith('rim_') || name === 'chrome' || name === 'metal') {
          child.material = chromeMat;
        } else if (name === 'lights_red') {
          child.material = this.taillightMat;
        } else if (name === 'leds' || name === 'lights') {
          child.material = ledHeadlightMat;
        } else if (name.startsWith('tire') || name === 'wipers') {
          child.material = tireRubberMat;
        } else if (name.startsWith('brake')) {
          child.material = brakeRotorMat;
        }
      }
    });

    model.traverse((child) => {
      if (child.name === 'wheel_fl') this.wheelFL = child;
      if (child.name === 'wheel_fr') this.wheelFR = child;
      if (child.name === 'wheel_rl') this.wheelRL = child;
      if (child.name === 'wheel_rr') this.wheelRR = child;
      if (child.name === 'steering_wheel') this.steeringWheel = child;
    });

    this.carModelWrapper.add(model);
    this.baseModel = model;

    this.rebuildAeroElements(cfg);
  }

  buildProceduralFallback() {
    // High-level fallback for headless tests
    const dummyWheel = () => new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16));
    this.wheelFL = dummyWheel();
    this.wheelFR = dummyWheel();
    this.wheelRL = dummyWheel();
    this.wheelRR = dummyWheel();
    const cfg = CAR_CONFIGS[this.carIndex] || CAR_CONFIGS[0];
    this.rebuildAeroElements(cfg);
  }

  setCarConfig(index) {
    this.carIndex = Math.max(0, Math.min(index, CAR_CONFIGS.length - 1));
    const cfg = CAR_CONFIGS[this.carIndex];

    if (this.bodyMeshes.length > 0) {
      this.bodyMeshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.color.setHex(cfg.paintColor);
          mesh.material.roughness = cfg.roughness;
          mesh.material.metalness = cfg.metalness;
          mesh.material.needsUpdate = true;
        }
      });
    }

    this.rebuildAeroElements(cfg);
  }

  rebuildAeroElements(cfg) {
    while (this.aeroGroup.children.length > 0) {
      this.aeroGroup.remove(this.aeroGroup.children[0]);
    }
    this.flames = [];

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.32,
      metalness: 0.45
    });

    const paintMat = new THREE.MeshStandardMaterial({
      color: cfg.paintColor,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      envMapIntensity: 2.2
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      roughness: 0.22,
      metalness: 0.85
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.18,
      metalness: 0.90
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.94,
      roughness: 0.16
    });

    const ledCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ledRed = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const flameColorHex = cfg.flameColor || 0x00f0ff;
    const flameMat = new THREE.MeshBasicMaterial({ color: flameColorHex, transparent: true, opacity: 0.95 });

    const addFlame = (x, y, z, baseScale = 1.0, rotX = -Math.PI / 2) => {
      const flameGeo = new THREE.ConeGeometry(0.09 * baseScale, 1.45 * baseScale, 12);
      flameGeo.rotateX(rotX);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, y, z);
      flame.visible = false;
      flame.baseScale = baseScale;
      this.aeroGroup.add(flame);
      this.flames.push(flame);
    };

    // 0. Bugatti Bolide: Curved Le Mans Wing, Dorsal Fin & Quad Diffuser Exhausts
    if (cfg.type === 'tourbillon' || cfg.id === 0) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.05, 0.42), carbonMat);
      wing.position.set(0, 1.08, -2.05);
      [-0.48, 0.48].forEach(x => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.20), carbonMat);
        pylon.position.set(x, 0.90, -2.04);
        pylon.rotation.x = -0.22;
        this.aeroGroup.add(pylon);
      });
      [-1.07, 1.07].forEach(x => {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.48), carbonMat);
        ep.position.set(x, 1.08, -2.05);
        const epLed = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.04), ledCyan);
        epLed.position.set(x, 1.08, -2.28);
        this.aeroGroup.add(ep, epLed);
      });

      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 2.3), carbonMat);
      fin.position.set(0, 0.95, -0.90);
      const finBorder = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 2.3), ledCyan);
      finBorder.position.set(0, 1.11, -0.90);
      this.aeroGroup.add(wing, fin, finBorder);

      [-0.24, -0.08, 0.08, 0.24].forEach(x => {
        const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.16), titaniumMat);
        pipe.position.set(x, 0.38, -2.28);
        this.aeroGroup.add(pipe);
        addFlame(x, 0.38, -2.32, 0.9);
      });
    }
    // 1. Pagani Huayra BC: Swan-Neck Wing, Leaf Mirrors & High Quad Rocket Cluster
    else if (cfg.type === 'huayra_bc' || cfg.id === 1) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.38), carbonMat);
      wing.position.set(0, 1.05, -2.02);
      [-0.42, 0.42].forEach(x => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.18), carbonMat);
        pylon.position.set(x, 0.86, -2.00);
        pylon.rotation.x = -0.20;
        this.aeroGroup.add(pylon);
      });
      this.aeroGroup.add(wing);

      // High Leaf-Stalk Mirrors
      [-1, 1].forEach(side => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 8), carbonMat);
        stalk.position.set(side * 0.88, 0.65, 0.82);
        stalk.rotation.z = side * 0.45;
        const housing = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 8), carbonMat);
        housing.position.set(side * 1.02, 0.78, 0.78);
        housing.rotation.x = Math.PI / 2;
        this.aeroGroup.add(stalk, housing);
      });

      // Gold Heat Shield & Quad Rocket Exhausts
      const shield = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 24), goldMat);
      shield.position.set(0, 0.62, -2.25);
      this.aeroGroup.add(shield);
      [[-0.05, 0.67], [0.05, 0.67], [-0.05, 0.57], [0.05, 0.57]].forEach(([x, y]) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.16, 12), titaniumMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(x, y, -2.26);
        this.aeroGroup.add(pipe);
        addFlame(x, y, -2.30, 0.85);
      });
    }
    // 2. Apollo IE: Trident Batwing, Canards & Triple Inverted Exhaust
    else if (cfg.type === 'apollo_ie' || cfg.id === 2) {
      const batwing = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.06, 0.46), carbonMat);
      batwing.position.set(0, 1.12, -2.08);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.40, 1.5), accentMat);
      fin.position.set(0, 1.02, -1.35);
      this.aeroGroup.add(batwing, fin);

      const pipes = [{ x: 0, y: 0.56 }, { x: -0.09, y: 0.46 }, { x: 0.09, y: 0.46 }];
      pipes.forEach(pos => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12), titaniumMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(pos.x, pos.y, -2.26);
        this.aeroGroup.add(pipe);
        addFlame(pos.x, pos.y, -2.30, 0.95);
      });
    }
    // 3. Jesko Absolut: Low-Drag Twin Apex Fins & 0.95m Longtail (NO WING!)
    else if (cfg.type === 'jesko' || cfg.id === 3) {
      [-0.70, 0.70].forEach(x => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.40, 0.80), paintMat);
        fin.position.set(x, 0.96, -1.82);
        const finEdge = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.80), accentMat);
        finEdge.position.set(x, 1.16, -1.82);
        this.aeroGroup.add(fin, finEdge);
      });
      const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.10, 0.92), carbonMat);
      longtail.position.set(0, 0.48, -2.45);
      this.aeroGroup.add(longtail);

      const jetPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 16), titaniumMat);
      jetPipe.scale.set(1.4, 1.0, 0.8);
      jetPipe.rotation.x = Math.PI / 2;
      jetPipe.position.set(0, 0.42, -2.54);
      this.aeroGroup.add(jetPipe);
      addFlame(0, 0.42, -2.58, 1.85);
    }
    // 4. McLaren Solus GT: Roof Snorkel & Twin-Tier GT3 Wing
    else if (cfg.type === 'mclaren_solus' || cfg.id === 4) {
      const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.26, 0.68), carbonMat);
      snorkel.position.set(0, 1.20, -0.15);
      const wing1 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.05, 0.42), carbonMat);
      wing1.position.set(0, 1.15, -2.08);
      const wing2 = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.035, 0.26), carbonMat);
      wing2.position.set(0, 1.02, -1.96);
      this.aeroGroup.add(snorkel, wing1, wing2);

      [-0.18, 0.18].forEach(x => {
        const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 12), titaniumMat);
        topPipe.rotation.x = Math.PI / 3;
        topPipe.position.set(x, 0.76, -1.65);
        this.aeroGroup.add(topPipe);
        addFlame(x, 0.76, -1.72, 1.05, -Math.PI / 3);
      });
    }
    // 5. Ferrari Daytona SP3: 5 Rear Strakes & Cyber Lightbar
    else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
      for (let s = 0; s < 5; s++) {
        const strake = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.036, 0.18), (s % 2 === 0) ? carbonMat : paintMat);
        strake.position.set(0, 0.32 + s * 0.088, -2.24);
        this.aeroGroup.add(strake);
      }
      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.028, 0.08), ledRed);
      lightbar.position.set(0, 0.69, -2.26);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 1.4), carbonMat);
      fin.position.set(0, 0.92, -1.35);
      this.aeroGroup.add(lightbar, fin);

      [-0.24, 0.24].forEach(x => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 14), titaniumMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(x, 0.54, -2.27);
        this.aeroGroup.add(pipe);
        addFlame(x, 0.54, -2.30, 1.0);
      });
    }
  }

  setCarConfig(index) {
    this.carIndex = Math.max(0, Math.min(index, CAR_CONFIGS.length - 1));
    const cfg = CAR_CONFIGS[this.carIndex];

    if (this.bodyMeshes && this.bodyMeshes.length > 0) {
      const carPaintMat = new THREE.MeshStandardMaterial({
        color: cfg.paintColor,
        metalness: cfg.metalness,
        roughness: cfg.roughness,
        envMapIntensity: 2.5
      });
      this.bodyMeshes.forEach(mesh => {
        mesh.material = carPaintMat;
      });
    }

    this.rebuildAeroElements(cfg);
  }

  setupContactShadow() {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.40)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.82
    });

    this.shadowBlob = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.6), shadowMat);
    this.shadowBlob.rotateX(-Math.PI / 2);
    this.shadowBlob.position.y = 0.03;
    this.scene.add(this.shadowBlob);
  }

  setupHeadlights() {
    this.spotLightL = new THREE.SpotLight(0xfef08a, 4.5, 60, Math.PI / 4.5, 0.45);
    this.spotLightL.position.set(-0.7, 0.48, 2.2);
    this.spotTargetL = new THREE.Object3D();
    this.spotTargetL.position.set(-0.7, 0.1, 24);
    this.group.add(this.spotLightL, this.spotTargetL);
    this.spotLightL.target = this.spotTargetL;

    this.spotLightR = new THREE.SpotLight(0xfef08a, 4.5, 60, Math.PI / 4.5, 0.45);
    this.spotLightR.position.set(0.7, 0.48, 2.2);
    this.spotTargetR = new THREE.Object3D();
    this.spotTargetR.position.set(0.7, 0.1, 24);
    this.group.add(this.spotLightR, this.spotTargetR);
    this.spotLightR.target = this.spotTargetR;
  }

  setupSkidMarks() {
    this.maxSkidPoints = 300;
    this.skidGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxSkidPoints * 3);
    const opacities = new Float32Array(this.maxSkidPoints);

    this.skidGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.skidGeo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const skidMat = new THREE.PointsMaterial({
      color: 0x111111,
      size: 0.42,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    this.skidPoints = new THREE.Points(this.skidGeo, skidMat);
    this.scene.add(this.skidPoints);
    this.skidIndex = 0;
  }

  addSkidPoint(x, z, alpha = 0.6) {
    const posAttr = this.skidGeo.getAttribute('position');
    posAttr.setXYZ(this.skidIndex, x, 0.02, z);
    posAttr.needsUpdate = true;
    this.skidIndex = (this.skidIndex + 1) % this.maxSkidPoints;
  }

  setupSparks() {
    this.maxSparks = 60;
    this.sparksGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxSparks * 3);
    this.sparksVel = [];

    for (let i = 0; i < this.maxSparks; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -100;
      pos[i * 3 + 2] = 0;
      this.sparksVel.push(new THREE.Vector3());
    }

    this.sparksGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sparksMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.16,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    this.sparksPoints = new THREE.Points(this.sparksGeo, sparksMat);
    this.scene.add(this.sparksPoints);
    this.sparkIndex = 0;
  }

  emitSparks(origin) {
    const posAttr = this.sparksGeo.getAttribute('position');
    for (let i = 0; i < 3; i++) {
      const idx = (this.sparkIndex + i) % this.maxSparks;
      posAttr.setXYZ(idx, origin.x + (Math.random() - 0.5) * 0.4, 0.15, origin.z + (Math.random() - 0.5) * 0.4);
      this.sparksVel[idx].set(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );
    }
    posAttr.needsUpdate = true;
    this.sparkIndex = (this.sparkIndex + 3) % this.maxSparks;
  }

  updateSparks(dt) {
    const posAttr = this.sparksGeo.getAttribute('position');
    for (let i = 0; i < this.maxSparks; i++) {
      let y = posAttr.getY(i);
      if (y > -10) {
        let x = posAttr.getX(i) + this.sparksVel[i].x * dt;
        let z = posAttr.getZ(i) + this.sparksVel[i].z * dt;
        y += this.sparksVel[i].y * dt;
        this.sparksVel[i].y -= 25.0 * dt;
        if (y < 0.02) y = -100;
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  setupTireSmoke() {
    this.maxSmoke = 70;
    this.smokeGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxSmoke * 3);
    this.smokeLifetimes = new Float32Array(this.maxSmoke);
    this.smokeVel = [];

    for (let i = 0; i < this.maxSmoke; i++) {
      pos[i * 3 + 1] = -100;
      this.smokeLifetimes[i] = 0;
      this.smokeVel.push(new THREE.Vector3());
    }

    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.65,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.smokePoints = new THREE.Points(this.smokeGeo, smokeMat);
    this.scene.add(this.smokePoints);
    this.smokeIndex = 0;
  }

  emitSmoke(origin, vel) {
    const posAttr = this.smokeGeo.getAttribute('position');
    const idx = this.smokeIndex;
    posAttr.setXYZ(idx, origin.x, 0.2, origin.z);
    this.smokeLifetimes[idx] = 1.0;
    this.smokeVel[idx].copy(vel);
    posAttr.needsUpdate = true;
    this.smokeIndex = (this.smokeIndex + 1) % this.maxSmoke;
  }

  updateSmoke(dt) {
    const posAttr = this.smokeGeo.getAttribute('position');
    for (let i = 0; i < this.maxSmoke; i++) {
      if (this.smokeLifetimes[i] > 0) {
        this.smokeLifetimes[i] -= dt * 1.6;
        let x = posAttr.getX(i) + this.smokeVel[i].x * dt;
        let y = posAttr.getY(i) + (0.8 + Math.random() * 0.4) * dt;
        let z = posAttr.getZ(i) + this.smokeVel[i].z * dt;
        if (this.smokeLifetimes[i] <= 0) y = -100;
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  update(dt, track = null) {
    // 1. Nitrous Management
    this.isNitro = this.inputs.nitro && this.nitroFuel > 0 && this.inputs.forward;
    if (this.isNitro) {
      this.nitroFuel = Math.max(0, this.nitroFuel - dt * 26);
      const flameScale = 1.0 + Math.random() * 0.45;
      if (this.flames) {
        this.flames.forEach(f => {
          f.scale.set(flameScale, flameScale, flameScale);
          f.visible = true;
        });
      }
    } else {
      if (this.flames) {
        this.flames.forEach(f => { f.visible = false; });
      }
      this.nitroFuel = Math.min(100, this.nitroFuel + dt * 10.0);
    }

    // 2. Steering Dynamics (Smoothed for high-speed stability)
    let targetSteer = 0;
    if (this.inputs.left) targetSteer += 0.48;
    if (this.inputs.right) targetSteer -= 0.48;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * 14);

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    this.forwardSpeed = this.velocity.dot(forward);
    this.lateralSpeed = this.velocity.dot(right);
    this.speed = this.velocity.length();

    // 3. Power, Acceleration & Braking Forces
    let accelForce = 0;
    const currentMax = this.isNitro ? this.maxNitroSpeed : this.maxSpeed;

    // Brake / Handbrake
    if (this.inputs.brake) {
      this.isBraking = true;
      if (Math.abs(this.forwardSpeed) > 0.4) {
        accelForce -= Math.sign(this.forwardSpeed) * this.braking * 1.6;
      } else {
        this.velocity.multiplyScalar(0.8);
      }
    } else {
      this.isBraking = false;
    }

    // Forward Throttle (Up to 500+ KM/H)
    if (this.inputs.forward && !this.inputs.brake) {
      const force = this.isNitro ? this.nitroAcceleration : this.acceleration;
      if (this.forwardSpeed < currentMax) {
        accelForce += force;
      }
    }
    // Reverse Gear
    else if (this.inputs.backward && !this.inputs.brake) {
      if (this.forwardSpeed > 0.6) {
        accelForce -= this.braking * 1.5;
      } else if (this.forwardSpeed > -this.reverseMaxSpeed) {
        accelForce -= this.acceleration * 0.7;
      }
    }

    // Drift activation
    this.isDrifting = (this.inputs.brake || Math.abs(this.lateralSpeed) > 6.0) && this.speed > 10.0;

    // Apply acceleration force
    this.velocity.addScaledVector(forward, accelForce * dt);

    // High-speed adaptive yaw response with immediate low-speed recovery authority
    if (Math.abs(this.forwardSpeed) > 0.05 || this.inputs.left || this.inputs.right) {
      const turnDir = this.forwardSpeed >= -0.2 ? 1 : -1;
      const speedFactor = Math.max(0.75, Math.min(1.0, Math.abs(this.forwardSpeed) / 4.0));
      const highSpeedDamp = 1.0 / (1.0 + (this.speed / 70.0) * 0.4);
      const yawDelta = this.steerAngle * this.steerResponse * speedFactor * highSpeedDamp * turnDir * dt;
      this.heading += yawDelta;
      this.heading = (this.heading + Math.PI * 2) % (Math.PI * 2);
    }

    // Aerodynamic lateral grip
    const grip = this.isDrifting ? this.driftGrip : 0.95;
    this.velocity.sub(right.clone().multiplyScalar(this.lateralSpeed * (1 - grip)));
    this.velocity.multiplyScalar(Math.pow(this.drag, dt * 60));

    // Update Position
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.05;

    // 4. Smooth, Natural Lane & Armco Boundary Handling (Zero Shake, Zero Jitter, Zero Lag)
    if (track && typeof track.getClosestTrackPoint === 'function') {
      const trackInfo = track.getClosestTrackPoint(this.position);
      const maxAllowed = track.roadHalfWidth - 0.8;

      if (trackInfo && trackInfo.distFromCenter > maxAllowed) {
        const sign = Math.sign(trackInfo.lateralDist) || 1;
        const excess = trackInfo.distFromCenter - maxAllowed;

        // Position clamp: gently place the car back inside the road boundary
        this.position.x -= trackInfo.normal.x * sign * excess;
        this.position.z -= trackInfo.normal.z * sign * excess;
        this.position.y = 0.05;

        // Soft elastic rebound: reflect outward velocity smoothly
        const outwardVel = (this.velocity.x * trackInfo.normal.x + this.velocity.z * trackInfo.normal.z) * sign;
        if (outwardVel > 0) {
          this.velocity.x -= trackInfo.normal.x * sign * outwardVel * 1.05;
          this.velocity.z -= trackInfo.normal.z * sign * outwardVel * 1.05;
        }

        // Gentle barrier friction glide
        this.velocity.multiplyScalar(0.995);

        // Sparks on contact
        if (Math.random() < 0.25) {
          this.emitSparks(this.position);
        }
      }
    }

    // Update Mesh Transform
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);

    // Chassis pitch & roll dynamics
    if (this.carModelWrapper) {
      const rollAngle = -(this.lateralSpeed / 30.0) * 0.04;
      const pitchAngle = (accelForce / 70.0) * 0.02;
      this.carModelWrapper.rotation.z = THREE.MathUtils.lerp(this.carModelWrapper.rotation.z, rollAngle, dt * 8);
      this.carModelWrapper.rotation.x = THREE.MathUtils.lerp(this.carModelWrapper.rotation.x, pitchAngle, dt * 8);
    }

    // Shadow
    if (this.shadowBlob) {
      this.shadowBlob.position.set(this.position.x, 0.03, this.position.z);
      this.shadowBlob.rotation.z = -this.heading;
    }

    // 5. Gear & RPM
    this.calculateGearsAndRPM();

    // 6. Wheels rotation & steering
    const rotDelta = (this.forwardSpeed / 0.35) * dt;
    this.wheelRollAngle += rotDelta;

    const baseRotX = -Math.PI / 2;
    const roll = baseRotX + this.wheelRollAngle;

    if (this.wheelFL) this.wheelFL.rotation.set(roll, 0, this.steerAngle, 'ZXY');
    if (this.wheelFR) this.wheelFR.rotation.set(roll, 0, this.steerAngle, 'ZXY');
    if (this.wheelRL) this.wheelRL.rotation.set(roll, 0, 0);
    if (this.wheelRR) this.wheelRR.rotation.set(roll, 0, 0);
    if (this.steeringWheel) this.steeringWheel.rotation.z = -this.steerAngle * 2.5;

    // Brake lights
    if (this.taillightMat) {
      if (this.isBraking) {
        this.taillightMat.emissive.setHex(0xff0000);
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 3.5, dt * 15);
      } else {
        this.taillightMat.emissive.setHex(0x770000);
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 0.9, dt * 8);
      }
    }

    // Drifting tire tracks & smoke
    if (this.isDrifting) {
      const leftWheelPos = this.position.clone().addScaledVector(right, -1.0);
      const rightWheelPos = this.position.clone().addScaledVector(right, 1.0);
      this.addSkidPoint(leftWheelPos.x, leftWheelPos.z, 0.7);
      this.addSkidPoint(rightWheelPos.x, rightWheelPos.z, 0.7);

      if (Math.random() < 0.4) {
        this.emitSmoke(
          leftWheelPos,
          new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.0, (Math.random() - 0.5) * 3)
        );
      }
    }

    this.updateSmoke(dt);
    this.updateSparks(dt);

    // Audio
    audio.updateEngine(this.rpm, this.inputs.forward, this.isNitro);
    audio.updateDrift(this.isDrifting, Math.abs(this.lateralSpeed) / 10.0);
  }

  calculateGearsAndRPM() {
    const spd = Math.max(0, this.forwardSpeed);
    let gear = 1;
    for (let g = 1; g < this.gearMaxSpeeds.length; g++) {
      if (spd > this.gearMaxSpeeds[g - 1]) {
        gear = g;
      }
    }
    this.currentGear = gear;

    const minSpd = this.gearMaxSpeeds[gear - 1];
    const maxSpd = this.gearMaxSpeeds[gear];
    const gearProgress = Math.min(1.0, Math.max(0, (spd - minSpd) / (maxSpd - minSpd)));

    const idleRPM = 1200;
    const maxRPM = 9200;
    this.rpm = Math.round(idleRPM + gearProgress * (maxRPM - idleRPM));
  }

  reset(x = 0, z = 0, heading = 0) {
    this.position.set(x, 0.05, z);
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.heading = heading;
    this.steerAngle = 0;
    this.nitroFuel = 100;
  }
}

// Remote Hypercar for Multiplayer Opponents
export class RemoteHypercar {
  constructor(scene, playerInfo) {
    this.scene = scene;
    this.playerId = playerInfo.id;
    this.playerName = playerInfo.name || 'Opponent';
    this.carIndex = playerInfo.carIndex || 0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.targetPos = new THREE.Vector3();
    this.targetHeading = 0;
    this.currentHeading = 0;
    this.speed = 0;
    this.wheelRollAngle = 0;

    this.buildRemoteCarMesh();
    this.buildNameplate();
  }

  buildRemoteCarMesh() {
    if (this.carModel) {
      this.group.remove(this.carModel);
    }

    const cfg = CAR_CONFIGS[this.carIndex] || CAR_CONFIGS[0];

    // High-performance procedural hypercar body for remote opponent
    const carGroup = new THREE.Group();

    const paintMat = new THREE.MeshStandardMaterial({
      color: cfg.paintColor,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
      envMapIntensity: 2.2
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.35,
      metalness: 0.4
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x070d18,
      roughness: 0.05,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8
    });

    const bodyGeo = new THREE.BoxGeometry(1.94, 0.46, 4.35);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = 0.38;
    carGroup.add(body);

    const canopyGeo = new THREE.BoxGeometry(1.36, 0.42, 2.1);
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 0.72, -0.2);
    carGroup.add(canopy);

    // Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.5), carbonMat);
    splitter.position.set(0, 0.16, 2.15);
    carGroup.add(splitter);

    // Wheels
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const offsets = [
      { x: -0.94, y: 0.35, z: 1.35 },
      { x: 0.94, y: 0.35, z: 1.35 },
      { x: -0.94, y: 0.35, z: -1.35 },
      { x: 0.94, y: 0.35, z: -1.35 }
    ];
    offsets.forEach(pos => {
      const wheel = new THREE.Mesh(tireGeo, tireMat);
      wheel.position.set(pos.x, pos.y, pos.z);
      carGroup.add(wheel);
    });

    // Custom Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.38), carbonMat);
    wing.position.set(0, 1.05, -2.04);
    carGroup.add(wing);

    // Taillight
    const taillight = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    taillight.position.set(0, 0.50, -2.18);
    carGroup.add(taillight);

    // Nitro Flames
    this.nitroFlames = [];
    const flameGeo = new THREE.ConeGeometry(0.08, 1.2, 10);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: cfg.flameColor || 0x00f0ff, transparent: true, opacity: 0.9 });
    [-0.15, 0.15].forEach(x => {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.30, -2.25);
      flame.visible = false;
      carGroup.add(flame);
      this.nitroFlames.push(flame);
    });

    this.carModel = carGroup;
    this.group.add(this.carModel);
  }

  setCarConfig(index) {
    this.carIndex = Math.max(0, Math.min(index, CAR_CONFIGS.length - 1));
    this.buildRemoteCarMesh();
  }

  buildNameplate() {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerName.toUpperCase(), 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.2, 0.8, 1);
    sprite.position.set(0, 1.9, 0);
    this.group.add(sprite);
  }

  updateTelemetry(data) {
    if (data.x !== undefined && data.z !== undefined) {
      this.targetPos.set(data.x, data.y || 0.05, data.z);
    }
    if (data.heading !== undefined) {
      this.targetHeading = data.heading;
    }
    if (data.speed !== undefined) {
      this.speed = data.speed;
    }
    if (data.isNitro !== undefined && this.nitroFlames) {
      this.nitroFlames.forEach(f => { f.visible = data.isNitro; });
    }
  }

  update(dt) {
    this.group.position.lerp(this.targetPos, dt * 16);
    this.currentHeading = THREE.MathUtils.lerp(this.currentHeading, this.targetHeading, dt * 14);
    this.group.rotation.set(0, this.currentHeading, 0);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
