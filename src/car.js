import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { audio } from './audio.js';

export const CAR_CONFIGS = [
  {
    id: 0,
    type: 'tourbillon',
    name: 'Bugatti Tourbillon',
    manufacturer: 'Bugatti',
    paintColor: 0x7bb6d6, // Ice Metallic Sky Blue (User Photo 1)
    secondaryColor: 0x0f172a, // Deep Obsidian Carbon
    accentColor: 0x38bdf8, // Electric Cyan Jewel LED
    caliperColor: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.92,
    description: 'V16 Hybrid • Horseshoe Grille & Dorsal Spine (500 KM/H)'
  },
  {
    id: 1,
    type: 'huayra_bc',
    name: 'Pagani Huayra BC',
    manufacturer: 'Pagani',
    paintColor: 0x420c15, // Deep Gloss Cherry / Burgundy Carbon (User Photo 2)
    secondaryColor: 0x141416, // Exposed Carbon Weave
    accentColor: 0xfacc15, // Giallo Gold Pinstriping
    caliperColor: 0xfacc15,
    roughness: 0.14,
    metalness: 0.88,
    description: 'Twin-Turbo V12 • Spyder Roll Hoops & Leaf Mirrors (500 KM/H)'
  },
  {
    id: 2,
    type: 'jesko',
    name: 'Koenigsegg Jesko Absolut',
    manufacturer: 'Koenigsegg',
    paintColor: 0xf8fafc, // Ghost Arctic White
    secondaryColor: 0x0f172a,
    accentColor: 0xdc2626, // Apex Crimson
    caliperColor: 0xdc2626,
    roughness: 0.10,
    metalness: 0.95,
    description: 'Twin-Turbo V8 • Twin Apex Fins & Longtail Aero (500 KM/H)'
  },
  {
    id: 3,
    type: 'mclaren_p1',
    name: 'McLaren P1 GT',
    manufacturer: 'McLaren',
    paintColor: 0xea580c, // Volcano Sunset Metallic Orange
    secondaryColor: 0x18181b,
    accentColor: 0xea580c,
    caliperColor: 0xea580c,
    roughness: 0.15,
    metalness: 0.90,
    description: 'V8 Hybrid • Roof Snorkel Scoop & Active DRS Wing (500 KM/H)'
  },
  {
    id: 4,
    type: 'revuelto',
    name: 'Lamborghini Revuelto',
    manufacturer: 'Lamborghini',
    paintColor: 0x16a34a, // Verde Mantis Pearl Green
    secondaryColor: 0x09090b,
    accentColor: 0x06b6d4, // Blu Laufey Cyber Cyan
    caliperColor: 0x06b6d4,
    roughness: 0.14,
    metalness: 0.86,
    description: 'V12 Hybrid • Dorsal Shark Fin & Y-Blade Aero (500 KM/H)'
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
    roughness: 0.15,
    metalness: 0.88,
    description: '6.5L V12 Screamer • Rear Aerodynamic Strakes (500 KM/H)'
  }
];

export class Hypercar {
  constructor(scene) {
    this.scene = scene;

    // Hypercar Physics Constants: Tuned for 500+ KM/H Top Speed
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
    this.speed = 0;                  // m/s
    this.forwardSpeed = 0;
    this.lateralSpeed = 0;
    this.heading = 0;                // Yaw angle in radians
    this.steerAngle = 0;             // Front wheels steering angle
    this.currentGear = 1;
    this.rpm = 1200;
    this.isDrifting = false;
    this.isBraking = false;
    this.isNitro = false;
    this.nitroFuel = 100;            // 0-100%
    this.driftScore = 0;
    this.carIndex = 0;

    // Inputs
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
      nitro: false
    };

    // Gear Ratios scaled for 500-600 km/h
    this.gearMaxSpeeds = [0, 30, 60, 90, 115, 140, 175];

    // Submesh references
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelRL = null;
    this.wheelRR = null;
    this.steeringWheel = null;
    this.wheelRollAngle = 0;

    this.bodyMeshes = [];
    this.aeroGroup = new THREE.Group();

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Chassis dynamic roll/pitch wrapper
    this.carModelWrapper = new THREE.Group();
    this.group.add(this.carModelWrapper);
    this.carModelWrapper.add(this.aeroGroup);

    this.isReady = false;
    this.readyCallbacks = [];

    this.setupContactShadow();
    this.setupSkidMarks();
    this.setupTireSmoke();
    this.setupSparks();
    this.setupExhaustFlames();
    this.setupHeadlights();

    // Load base 3D Hypercar model
    this.loadFerrariModel();
  }

  onModelReady(cb) {
    if (this.isReady) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  setCarConfig(index) {
    this.carIndex = Math.max(0, Math.min(index, CAR_CONFIGS.length - 1));
    const cfg = CAR_CONFIGS[this.carIndex];

    // Update body paint materials
    this.bodyMeshes.forEach(mesh => {
      if (mesh.material) {
        mesh.material.color.setHex(cfg.paintColor);
        mesh.material.roughness = cfg.roughness;
        mesh.material.metalness = cfg.metalness;
        mesh.material.needsUpdate = true;
      }
    });

    // Update custom aero wings / fins
    this.rebuildAeroElements(cfg);
  }

  rebuildAeroElements(cfg) {
    while (this.aeroGroup.children.length > 0) {
      this.aeroGroup.remove(this.aeroGroup.children[0]);
    }

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.35,
      metalness: 0.4
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      roughness: 0.25,
      metalness: 0.7
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.08,
      metalness: 0.95
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.22,
      metalness: 0.88
    });

    const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const whiteLedMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const titaniumMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.92, roughness: 0.18 });

    // ========================================================
    // 1. BUGATTI TOURBILLON (Image 1 reference)
    // ========================================================
    if (cfg.type === 'tourbillon' || cfg.id === 0) {
      // Signature Bugatti Horseshoe Grille arch at front nose
      const archOuter = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.038, 12, 24, Math.PI), chromeMat);
      archOuter.rotation.x = Math.PI;
      archOuter.position.set(0, 0.38, 2.19);
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.06), chromeMat);
      postL.position.set(-0.24, 0.27, 2.19);
      const postR = postL.clone();
      postR.position.x = 0.24;
      const meshBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.04), new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 }));
      meshBack.position.set(0, 0.29, 2.17);
      const bugattiBadge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.02), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
      bugattiBadge.position.set(0, 0.44, 2.21);
      this.aeroGroup.add(archOuter, postL, postR, meshBack, bugattiBadge);

      // Central Dorsal Spine Crease running from front hood over canopy
      const dorsalHood = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.04, 1.2), accentMat);
      dorsalHood.position.set(0, 0.52, 1.45);
      dorsalHood.rotation.x = -0.12;
      const dorsalRoof = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.04, 1.6), accentMat);
      dorsalRoof.position.set(0, 0.96, -0.15);
      this.aeroGroup.add(dorsalHood, dorsalRoof);

      // 8-Element Jewel-Blade Horizontal Headlights (4 stacked cyan bars left & right)
      for (let i = 0; i < 4; i++) {
        const yOff = 0.41 + i * 0.032;
        const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.08), cyanLedMat);
        bladeL.position.set(-0.64, yOff, 2.12);
        bladeL.rotation.z = -0.06;
        const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.08), cyanLedMat);
        bladeR.position.set(0.64, yOff, 2.12);
        bladeR.rotation.z = 0.06;
        this.aeroGroup.add(bladeL, bladeR);
      }

      // Front Carbon Splitter with Sculpted Outer Winglets
      const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.04, 0.52), carbonMat);
      frontSplitter.position.set(0, 0.12, 2.14);
      const wingletL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.38), carbonMat);
      wingletL.position.set(-0.97, 0.20, 2.12);
      const wingletR = wingletL.clone();
      wingletR.position.x = 0.97;
      this.aeroGroup.add(frontSplitter, wingletL, wingletR);

      // Lower Side Aero Skirts
      const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 3.4), carbonMat);
      skirtL.position.set(-0.96, 0.14, 0);
      const skirtR = skirtL.clone();
      skirtR.position.x = 0.96;
      this.aeroGroup.add(skirtL, skirtR);

      // Rear Diffuser & Central Exhaust
      const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.4), carbonMat);
      diffuser.position.set(0, 0.16, -2.18);
      this.aeroGroup.add(diffuser);
    }

    // ========================================================
    // 2. PAGANI HUAYRA ROADSTER BC (Image 2 reference)
    // ========================================================
    else if (cfg.type === 'huayra_bc' || cfg.id === 1) {
      // Signature High Leaf-Stalk Side Wing Mirrors (mounted on front wheel arches)
      const buildLeafMirror = (isLeft) => {
        const mirrorGroup = new THREE.Group();
        const sideMult = isLeft ? -1 : 1;
        // Curved rising stalk
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.38, 8), carbonMat);
        stalk.position.set(sideMult * 0.88, 0.62, 0.82);
        stalk.rotation.z = sideMult * 0.48;
        stalk.rotation.x = -0.15;
        // Organic leaf-shaped teardrop mirror housing
        const housing = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 10), carbonMat);
        housing.position.set(sideMult * 0.98, 0.76, 0.78);
        housing.rotation.x = Math.PI / 2;
        housing.rotation.z = sideMult * 0.3;
        // Gold pinstripe rim on mirror
        const goldRim = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 6, 12), goldMat);
        goldRim.position.set(sideMult * 0.98, 0.76, 0.72);
        // Chrome mirror face
        const mirrorFace = new THREE.Mesh(new THREE.CircleGeometry(0.048, 12), chromeMat);
        mirrorFace.position.set(sideMult * 0.98, 0.76, 0.71);
        mirrorFace.rotation.y = Math.PI;
        mirrorGroup.add(stalk, housing, goldRim, mirrorFace);
        return mirrorGroup;
      };
      this.aeroGroup.add(buildLeafMirror(true));
      this.aeroGroup.add(buildLeafMirror(false));

      // Teardrop Projector Dual Headlight Pods on Front Arches
      [-1, 1].forEach(side => {
        const podMat = carbonMat;
        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), whiteLedMat);
        p1.position.set(side * 0.66, 0.54, 1.88);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), whiteLedMat);
        p2.position.set(side * 0.73, 0.52, 1.70);
        const podBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.34), podMat);
        podBase.position.set(side * 0.70, 0.51, 1.78);
        podBase.rotation.y = side * 0.12;
        this.aeroGroup.add(p1, p2, podBase);
      });

      // Roadster / Spyder Cockpit: Twin Aerodynamic Roll Hoops & Streamlined Nacelles
      [-1, 1].forEach(side => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.026, 8, 16, Math.PI), chromeMat);
        hoop.rotation.x = Math.PI;
        hoop.position.set(side * 0.38, 0.84, -0.66);
        const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 10), carbonMat);
        fairing.position.set(side * 0.38, 0.76, -0.92);
        fairing.rotation.x = -Math.PI / 2.3;
        this.aeroGroup.add(hoop, fairing);
      });

      // Pagani Huayra BC Carbon GT Rear Wing with Swan-Neck Uprights & Gold Endplates
      const bcWing = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.04, 0.34), carbonMat);
      bcWing.position.set(0, 0.96, -1.95);
      bcWing.rotation.x = 0.06;
      // Swan-neck curved uprights
      const swanL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.22), carbonMat);
      swanL.position.set(-0.38, 0.78, -1.92);
      swanL.rotation.x = 0.12;
      const swanR = swanL.clone();
      swanR.position.x = 0.38;
      // Carbon endplates with gold racing edges
      const bcEndL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.20, 0.40), carbonMat);
      bcEndL.position.set(-0.94, 0.96, -1.95);
      const goldEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.21, 0.03), goldMat);
      goldEdgeL.position.set(-0.94, 0.96, -1.75);
      const bcEndR = bcEndL.clone();
      bcEndR.position.x = 0.94;
      const goldEdgeR = goldEdgeL.clone();
      goldEdgeR.position.x = 0.94;
      this.aeroGroup.add(bcWing, swanL, swanR, bcEndL, bcEndR, goldEdgeL, goldEdgeR);

      // Signature Pagani Quad Titanium Central Exhaust Cluster (2x2 Cloverleaf)
      const exhaustCluster = new THREE.Group();
      const clusterHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), carbonMat);
      clusterHousing.rotation.x = Math.PI / 2;
      clusterHousing.position.set(0, 0.42, -2.24);
      exhaustCluster.add(clusterHousing);
      const pipeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.14, 12);
      pipeGeo.rotateX(Math.PI / 2);
      const pipeOffsets = [
        { x: -0.046, y: 0.46 }, { x: 0.046, y: 0.46 },
        { x: -0.046, y: 0.38 }, { x: 0.046, y: 0.38 }
      ];
      pipeOffsets.forEach(pos => {
        const pipe = new THREE.Mesh(pipeGeo, titaniumMat);
        pipe.position.set(pos.x, pos.y, -2.26);
        exhaustCluster.add(pipe);
      });
      this.aeroGroup.add(exhaustCluster);

      // Gold Racing Pinstripe Livery Bands
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 3.6), goldMat);
      stripeL.position.set(-0.18, 0.52, 0.2);
      const stripeR = stripeL.clone();
      stripeR.position.x = 0.18;
      this.aeroGroup.add(stripeL, stripeR);
    }

    // ========================================================
    // 3. KOENIGSEGG JESKO ABSOLUT
    // ========================================================
    else if (cfg.type === 'jesko' || cfg.id === 2) {
      // Twin Top Apex Vertical Stabilizer Fins
      const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.30, 0.65), accentMat);
      fin1.position.set(-0.42, 0.85, -1.72);
      const fin2 = fin1.clone();
      fin2.position.x = 0.42;
      this.aeroGroup.add(fin1, fin2);

      // Extended High-Speed Longtail Rear Aero Deck & Low-Drag Diffuser
      const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.68), carbonMat);
      longtail.position.set(0, 0.52, -2.36);
      const tailFinL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.65), accentMat);
      tailFinL.position.set(-0.78, 0.56, -2.36);
      const tailFinR = tailFinL.clone();
      tailFinR.position.x = 0.78;
      this.aeroGroup.add(longtail, tailFinL, tailFinR);

      // Front Carbon Dive Planes / Canards
      [-1, 1].forEach(side => {
        const canard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.22), carbonMat);
        canard.position.set(side * 0.90, 0.34, 2.05);
        canard.rotation.z = side * 0.25;
        canard.rotation.y = side * 0.15;
        this.aeroGroup.add(canard);
      });
    }

    // ========================================================
    // 4. MCLAREN P1 GT
    // ========================================================
    else if (cfg.type === 'mclaren_p1' || cfg.id === 3) {
      // Aerodynamic Roof Snorkel Air Scoop
      const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.44), carbonMat);
      snorkel.position.set(0, 1.06, -0.28);
      const intakeHole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.04), new THREE.MeshStandardMaterial({ color: 0x050505 }));
      intakeHole.position.set(0, 1.06, -0.06);
      this.aeroGroup.add(snorkel, intakeHole);

      // Active Curved DRS Rear Wing
      const p1Wing = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.04, 0.32), carbonMat);
      p1Wing.position.set(0, 0.95, -1.96);
      p1Wing.rotation.x = 0.06;
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.40, 0.18), carbonMat);
      strutL.position.set(-0.46, 0.75, -1.94);
      const strutR = strutL.clone();
      strutR.position.x = 0.46;
      this.aeroGroup.add(p1Wing, strutL, strutR);

      // Boomerang Front DRL Accents
      [-1, 1].forEach(side => {
        const boom = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.14), whiteLedMat);
        boom.position.set(side * 0.68, 0.46, 2.08);
        this.aeroGroup.add(boom);
      });
    }

    // ========================================================
    // 5. LAMBORGHINI REVUELTO
    // ========================================================
    else if (cfg.type === 'revuelto' || cfg.id === 4) {
      // Central Dorsal Shark Fin
      const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.32, 0.98), accentMat);
      sharkFin.position.set(0, 0.88, -1.25);
      this.aeroGroup.add(sharkFin);

      // Geometric Angular Y-Blade Front Splitter
      const splitterBase = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.04, 0.48), carbonMat);
      splitterBase.position.set(0, 0.12, 2.14);
      const yBladeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.32), accentMat);
      yBladeL.position.set(-0.95, 0.20, 2.12);
      const yBladeR = yBladeL.clone();
      yBladeR.position.x = 0.95;
      this.aeroGroup.add(splitterBase, yBladeL, yBladeR);

      // High-Mounted Dual Hexagonal Exhausts
      [-0.14, 0.14].forEach(x => {
        const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 6), titaniumMat);
        hex.rotation.x = Math.PI / 2;
        hex.position.set(x, 0.54, -2.22);
        this.aeroGroup.add(hex);
      });
    }

    // ========================================================
    // 6. FERRARI DAYTONA SP3
    // ========================================================
    else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
      // Iconic Horizontal Rear Aerodynamic Strakes (5 tiered strakes across full rear)
      for (let s = 0; s < 5; s++) {
        const strake = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.024, 0.14), carbonMat);
        strake.position.set(0, 0.34 + s * 0.065, -2.20);
        this.aeroGroup.add(strake);
      }

      // Front Low-Drag Blade Splitter
      const fSplitter = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.035, 0.45), carbonMat);
      fSplitter.position.set(0, 0.12, 2.14);
      this.aeroGroup.add(fSplitter);

      // High Twin Round Exhaust Outlets
      [-0.18, 0.18].forEach(x => {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), chromeMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.set(x, 0.46, -2.24);
        this.aeroGroup.add(tip);
      });
    }
  }

  loadFerrariModel() {
    const loader = new GLTFLoader();
    const rawBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : './';
    const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    const dracoPath = `${cleanBase}draco/`;
    const modelPath = `${cleanBase}ferrari.glb`;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(dracoPath);
    loader.setDRACOLoader(dracoLoader);

    const initialCfg = CAR_CONFIGS[this.carIndex];

    const ferrariPaint = new THREE.MeshStandardMaterial({
      color: initialCfg.paintColor,
      metalness: initialCfg.metalness,
      roughness: initialCfg.roughness,
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

    const yellowBadgeMat = new THREE.MeshStandardMaterial({
      color: initialCfg.accentColor,
      roughness: 0.3,
      metalness: 0.2
    });

    const ledHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shiftLedMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);
        model.rotation.y = Math.PI;
        model.position.set(0, 0.02, 0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
            const name = child.name.toLowerCase();

            if (name === 'body') {
              child.material = ferrariPaint;
              this.bodyMeshes.push(child);
            } else if (name === 'glass') {
              child.material = glassMat;
            } else if (name.includes('carbon')) {
              child.material = carbonMat;
            } else if (name.startsWith('rim_') || name === 'chrome' || name === 'metal') {
              child.material = chromeMat;
            } else if (name === 'lights_red') {
              this.taillightMat = new THREE.MeshStandardMaterial({
                color: 0x880000,
                emissive: 0xff0000,
                emissiveIntensity: 0.8,
                roughness: 0.2,
                metalness: 0.1
              });
              child.material = this.taillightMat;
            } else if (name === 'leds' || name === 'lights') {
              child.material = ledHeadlightMat;
            } else if (name.startsWith('tire') || name === 'wipers') {
              child.material = tireRubberMat;
            } else if (name.startsWith('brake')) {
              child.material = brakeRotorMat;
            } else if (name.startsWith('centre') || name === 'yellow_trim') {
              child.material = yellowBadgeMat;
            } else if (name === 'steering_red_lights') {
              child.material = shiftLedMat;
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
        this.ferrariModel = model;
        this.isReady = true;

        this.setCarConfig(this.carIndex);

        this.readyCallbacks.forEach(cb => {
          try { cb(); } catch (e) { console.error(e); }
        });
        this.readyCallbacks = [];
      },
      undefined,
      (err) => {
        console.error('Error loading Ferrari GLB:', err);
      }
    );
  }

  setupContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.8
    });

    this.shadowBlob = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.4), shadowMat);
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

  setupExhaustFlames() {
    this.flames = [];
    const flameGeo = new THREE.ConeGeometry(0.09, 1.4, 12);
    flameGeo.rotateX(-Math.PI / 2);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    const pipeXOffsets = [-0.11, 0.0, 0.11];
    pipeXOffsets.forEach(x => {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.24, -2.28);
      flame.visible = false;
      this.group.add(flame);
      this.flames.push(flame);
    });
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
      // Responsive steering factor: at low speeds / recovering from crash, retain 75% steering authority
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

        // Soft elastic rebound: reflect outward velocity smoothly (no violent stop or vibration)
        const outwardVel = (this.velocity.x * trackInfo.normal.x + this.velocity.z * trackInfo.normal.z) * sign;
        if (outwardVel > 0) {
          this.velocity.x -= trackInfo.normal.x * sign * outwardVel * 1.05;
          this.velocity.z -= trackInfo.normal.z * sign * outwardVel * 1.05;
        }

        // Gentle barrier friction glide (maintain forward momentum)
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
    const rotDelta = (this.forwardSpeed / 0.34) * dt;
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
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 3.2, dt * 15);
      } else {
        this.taillightMat.emissive.setHex(0x770000);
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 0.8, dt * 8);
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

    this.buildRemoteCarMesh();
    this.buildNameplate();
  }

  buildRemoteCarMesh() {
    const cfg = CAR_CONFIGS[this.carIndex] || CAR_CONFIGS[0];

    // High-performance procedural hypercar body
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

    // Main Chassis Monocoque
    const bodyGeo = new THREE.BoxGeometry(1.92, 0.48, 4.3);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = 0.38;
    carGroup.add(body);

    // Aerodynamic Cockpit Greenhouse Canopy (Roadster Spyder for Pagani, Monocoque for others)
    if (cfg.type === 'huayra_bc' || cfg.id === 1) {
      // Open Spyder cockpit with lower windscreen and twin chrome roll hoops
      const windscreen = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.28, 0.8), glassMat);
      windscreen.position.set(0, 0.65, 0.35);
      windscreen.rotation.x = -0.3;
      carGroup.add(windscreen);

      [-1, 1].forEach(side => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 8, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9 }));
        hoop.rotation.x = Math.PI;
        hoop.position.set(side * 0.36, 0.80, -0.65);
        const nacelle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 8), carbonMat);
        nacelle.position.set(side * 0.36, 0.72, -0.92);
        nacelle.rotation.x = -Math.PI / 2.3;
        carGroup.add(hoop, nacelle);
      });

      // Signature high leaf-stalk mirrors for opponent
      [-1, 1].forEach(side => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 6), carbonMat);
        stalk.position.set(side * 0.86, 0.60, 0.82);
        stalk.rotation.z = side * 0.48;
        const housing = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), carbonMat);
        housing.position.set(side * 0.96, 0.74, 0.78);
        housing.rotation.x = Math.PI / 2;
        housing.rotation.z = side * 0.3;
        carGroup.add(stalk, housing);
      });

      // BC Swan-neck Rear Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.04, 0.32), carbonMat);
      wing.position.set(0, 0.94, -1.94);
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.18), carbonMat);
      strutL.position.set(-0.38, 0.77, -1.92);
      const strutR = strutL.clone();
      strutR.position.x = 0.38;
      carGroup.add(wing, strutL, strutR);

      // Cloverleaf quad exhaust
      const pipeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8);
      pipeGeo.rotateX(Math.PI / 2);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
      [[-0.045, 0.45], [0.045, 0.45], [-0.045, 0.37], [0.045, 0.37]].forEach(([x, y]) => {
        const p = new THREE.Mesh(pipeGeo, pipeMat);
        p.position.set(x, y, -2.22);
        carGroup.add(p);
      });
    } else {
      // Standard coupe canopy
      const canopyGeo = new THREE.BoxGeometry(1.4, 0.42, 2.1);
      const canopy = new THREE.Mesh(canopyGeo, glassMat);
      canopy.position.set(0, 0.72, -0.2);
      carGroup.add(canopy);

      // Tourbillon Horseshoe Grille & Dorsal Spine
      if (cfg.type === 'tourbillon' || cfg.id === 0) {
        const horseshoe = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9 }));
        horseshoe.rotation.x = Math.PI;
        horseshoe.position.set(0, 0.36, 2.19);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 2.4), new THREE.MeshStandardMaterial({ color: cfg.accentColor, roughness: 0.2 }));
        spine.position.set(0, 0.76, 0.1);
        carGroup.add(horseshoe, spine);
      }
      // Jesko Twin Apex Fins & Longtail
      else if (cfg.type === 'jesko' || cfg.id === 2) {
        const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.6), new THREE.MeshStandardMaterial({ color: cfg.accentColor }));
        fin1.position.set(-0.42, 0.84, -1.72);
        const fin2 = fin1.clone();
        fin2.position.x = 0.42;
        const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.6), carbonMat);
        longtail.position.set(0, 0.50, -2.32);
        carGroup.add(fin1, fin2, longtail);
      }
      // McLaren P1 Roof Snorkel & Curved Wing
      else if (cfg.type === 'mclaren_p1' || cfg.id === 3) {
        const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.13, 0.4), carbonMat);
        snorkel.position.set(0, 1.04, -0.28);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 0.3), carbonMat);
        wing.position.set(0, 0.92, -1.94);
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.16), carbonMat);
        strutL.position.set(-0.45, 0.74, -1.92);
        const strutR = strutL.clone();
        strutR.position.x = 0.45;
        carGroup.add(snorkel, wing, strutL, strutR);
      }
      // Lamborghini Revuelto Dorsal Fin
      else if (cfg.type === 'revuelto' || cfg.id === 4) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.95), new THREE.MeshStandardMaterial({ color: cfg.accentColor }));
        fin.position.set(0, 0.86, -1.25);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.04, 0.28), carbonMat);
        wing.position.set(0, 0.88, -1.92);
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.15), carbonMat);
        strutL.position.set(-0.45, 0.72, -1.9);
        const strutR = strutL.clone();
        strutR.position.x = 0.45;
        carGroup.add(fin, wing, strutL, strutR);
      }
      // Ferrari Daytona SP3 Rear Strakes
      else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
        for (let s = 0; s < 4; s++) {
          const strake = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.025, 0.12), carbonMat);
          strake.position.set(0, 0.36 + s * 0.07, -2.18);
          carGroup.add(strake);
        }
      }
    }

    // Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 0.5), carbonMat);
    splitter.position.set(0, 0.16, 2.15);
    carGroup.add(splitter);

    // 4 Sport Wheels
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

    const wheelOffsets = [
      { x: -0.92, y: 0.35, z: 1.35 },
      { x: 0.92, y: 0.35, z: 1.35 },
      { x: -0.92, y: 0.35, z: -1.35 },
      { x: 0.92, y: 0.35, z: -1.35 }
    ];

    wheelOffsets.forEach(pos => {
      const wheel = new THREE.Mesh(tireGeo, tireMat);
      wheel.position.set(pos.x, pos.y, pos.z);
      carGroup.add(wheel);
    });

    // Headlights (Jewel blades for Tourbillon, teardrop for Pagani, projector for others)
    const lightMat = new THREE.MeshBasicMaterial({ color: (cfg.type === 'tourbillon' || cfg.id === 0) ? 0x7dd3fc : 0xffffff });
    const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.1), lightMat);
    headlightL.position.set(-0.68, 0.44, 2.14);
    const headlightR = headlightL.clone();
    headlightR.position.x = 0.68;
    carGroup.add(headlightL, headlightR);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const taillight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.1), tailMat);
    taillight.position.set(0, 0.48, -2.14);
    carGroup.add(taillight);

    // Nitro Flames
    this.nitroFlames = [];
    const flameGeo = new THREE.ConeGeometry(0.08, 1.2, 10);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
    [-0.15, 0.15].forEach(x => {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, 0.26, -2.25);
      flame.visible = false;
      carGroup.add(flame);
      this.nitroFlames.push(flame);
    });

    this.group.add(carGroup);
  }

  buildNameplate() {
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
    if (data.isNitro !== undefined) {
      this.nitroFlames.forEach(f => { f.visible = data.isNitro; });
    }
  }

  update(dt) {
    // Butter-smooth interpolation for remote cars
    this.group.position.lerp(this.targetPos, dt * 16);
    this.currentHeading = THREE.MathUtils.lerp(this.currentHeading, this.targetHeading, dt * 14);
    this.group.rotation.set(0, this.currentHeading, 0);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
