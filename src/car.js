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
    secondaryColor: 0x0a0f1d, // Deep Obsidian Carbon
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
    secondaryColor: 0x141416, // Exposed Carbon Weave
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
    description: 'Twin-Turbo V8 • Twin Apex Shark Fins & 0.85m Longtail (500 KM/H)'
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
    this.flames = [];

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111113,
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
      metalness: 0.75
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.08,
      metalness: 0.95
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

    const cyanLedMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const redLedMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const amberLedMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const whiteLedMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const flameColorHex = cfg.flameColor || 0x00f0ff;
    const flameMat = new THREE.MeshBasicMaterial({ color: flameColorHex, transparent: true, opacity: 0.95 });

    // Dynamic Nitro Flame Generator aligned with car's exhaust tips
    const addFlame = (x, y, z, baseScale = 1.0, rotX = -Math.PI / 2, rotY = 0) => {
      const flameGeo = new THREE.ConeGeometry(0.09 * baseScale, 1.45 * baseScale, 12);
      flameGeo.rotateX(rotX);
      if (rotY !== 0) flameGeo.rotateY(rotY);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(x, y, z);
      flame.visible = false;
      flame.baseScale = baseScale;
      this.aeroGroup.add(flame);
      this.flames.push(flame);
    };

    // Full-Width Rear Fascia Overlay: masks the stock 458 bumper and mounts bespoke diffuser
    const buildRearBumperMask = (diffuserH = 0.30, numStrakes = 4, strakeH = 0.20, strakeMat = accentMat) => {
      const maskGroup = new THREE.Group();
      const bumperMask = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.44, 0.20), carbonMat);
      bumperMask.position.set(0, 0.36, -2.25);
      maskGroup.add(bumperMask);

      const diffuserPan = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.06, 0.45), carbonMat);
      diffuserPan.position.set(0, 0.14, -2.28);
      maskGroup.add(diffuserPan);

      for (let s = 0; s < numStrakes; s++) {
        const sx = -0.74 + (s / (numStrakes - 1)) * 1.48;
        const strake = new THREE.Mesh(new THREE.BoxGeometry(0.032, strakeH, 0.40), strakeMat);
        strake.position.set(sx, 0.18, -2.30);
        maskGroup.add(strake);
      }
      return maskGroup;
    };

    // ========================================================
    // 0. BUGATTI TOURBILLON BOLIDE (Curved GT Wing & Le Mans Fin)
    // ========================================================
    if (cfg.type === 'tourbillon' || cfg.id === 0) {
      // Rear Bumper Mask & 6-Strake Diffuser
      this.aeroGroup.add(buildRearBumperMask(0.32, 6, 0.22, cyanLedMat));

      // Massive Curved Carbon GT Wing spanning 1.98m
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.05, 0.38), carbonMat);
      wingBlade.position.set(0, 1.02, -2.04);
      wingBlade.rotation.x = 0.06;

      // Glowing Cyan LED Wing Endplates
      [-0.99, 0.99].forEach(side => {
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.48), carbonMat);
        endplate.position.set(side, 1.02, -2.04);
        const ledEdge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.29, 0.05), cyanLedMat);
        ledEdge.position.set(side, 1.02, -1.80);
        this.aeroGroup.add(endplate, ledEdge);
      });

      // Dual Swan-Neck Carbon Wing Pylons
      [-0.44, 0.44].forEach(x => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.40, 0.24), carbonMat);
        pylon.position.set(x, 0.82, -1.98);
        pylon.rotation.x = 0.12;
        this.aeroGroup.add(pylon);
      });
      this.aeroGroup.add(wingBlade);

      // Continuous Le Mans Carbon Dorsal Spine (Roof Scoop -> Rear Wing)
      const dorsalSpine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 1.85), carbonMat);
      dorsalSpine.position.set(0, 0.95, -1.15);
      const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.85), cyanLedMat);
      spineGlow.position.set(0, 1.09, -1.15);
      this.aeroGroup.add(dorsalSpine, spineGlow);

      // Roof Ram-Air Induction Scoops
      [-0.24, 0.24].forEach(x => {
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.48), carbonMat);
        scoop.position.set(x, 1.04, -0.15);
        this.aeroGroup.add(scoop);
      });

      // Quad Rectangular Titanium Diffuser Exhausts
      [-0.38, -0.18, 0.18, 0.38].forEach(x => {
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.14), titaniumMat);
        tip.position.set(x, 0.28, -2.32);
        this.aeroGroup.add(tip);
        addFlame(x, 0.28, -2.35, 0.85);
      });

      // Full-Width X-Blade LED Taillight Bar
      const xBar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.024, 0.06), cyanLedMat);
      xBar.position.set(0, 0.62, -2.24);
      this.aeroGroup.add(xBar);

      // Front Horseshoe Grille & Jewel Headlights
      const archOuter = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.038, 12, 24, Math.PI), chromeMat);
      archOuter.rotation.x = Math.PI;
      archOuter.position.set(0, 0.38, 2.19);
      this.aeroGroup.add(archOuter);
      for (let i = 0; i < 4; i++) {
        const yOff = 0.41 + i * 0.032;
        const bL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.08), cyanLedMat);
        bL.position.set(-0.64, yOff, 2.12);
        const bR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.08), cyanLedMat);
        bR.position.set(0.64, yOff, 2.12);
        this.aeroGroup.add(bL, bR);
      }
    }

    // ========================================================
    // 1. PAGANI HUAYRA BC (Rocket Quad Exhaust, Roll Hoops & Mirrors)
    // ========================================================
    else if (cfg.type === 'huayra_bc' || cfg.id === 1) {
      // Rear Bumper Mask & 4-Strake Diffuser with Gold Trim
      this.aeroGroup.add(buildRearBumperMask(0.30, 4, 0.20, goldMat));

      // Signature Centerpiece: HIGH-MOUNTED QUAD ROCKET EXHAUST CLUSTER
      const rocketHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 20), carbonMat);
      rocketHousing.rotation.x = Math.PI / 2;
      rocketHousing.position.set(0, 0.68, -1.86);
      const goldHeatShield = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 10, 24), goldMat);
      goldHeatShield.position.set(0, 0.68, -1.85);
      this.aeroGroup.add(rocketHousing, goldHeatShield);

      const pipeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.16, 14);
      pipeGeo.rotateX(Math.PI / 2);
      const quadOffsets = [
        { x: -0.05, y: 0.73 }, { x: 0.05, y: 0.73 },
        { x: -0.05, y: 0.63 }, { x: 0.05, y: 0.63 }
      ];
      quadOffsets.forEach(pos => {
        const pipe = new THREE.Mesh(pipeGeo, titaniumMat);
        pipe.position.set(pos.x, pos.y, -1.88);
        this.aeroGroup.add(pipe);
        addFlame(pos.x, pos.y, -1.90, 0.85);
      });

      // Pagani Huayra BC Towering Swan-Neck Carbon Wing
      const bcWing = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.045, 0.36), carbonMat);
      bcWing.position.set(0, 1.05, -1.98);
      bcWing.rotation.x = 0.06;
      [-0.40, 0.40].forEach(x => {
        const swan = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.22), carbonMat);
        swan.position.set(x, 0.85, -1.92);
        swan.rotation.x = 0.14;
        this.aeroGroup.add(swan);
      });
      [-0.94, 0.94].forEach(x => {
        const endp = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.42), carbonMat);
        endp.position.set(x, 1.05, -1.98);
        const goldLip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), goldMat);
        goldLip.position.set(x, 1.05, -1.77);
        this.aeroGroup.add(endp, goldLip);
      });
      this.aeroGroup.add(bcWing);

      // Roadster Spyder Cockpit: Dual Contoured Carbon Roll-Hoop Nacelles
      [-0.38, 0.38].forEach(x => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16, Math.PI), chromeMat);
        hoop.rotation.x = Math.PI;
        hoop.position.set(x, 0.86, -0.68);
        const nacelle = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.75, 10), carbonMat);
        nacelle.position.set(x, 0.78, -0.96);
        nacelle.rotation.x = -Math.PI / 2.3;
        this.aeroGroup.add(hoop, nacelle);
      });

      // High Sweeping Insect Leaf-Stalk Side Mirrors (framing the chase view)
      [-1, 1].forEach(side => {
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.024, 0.42, 8), carbonMat);
        stalk.position.set(side * 0.92, 0.68, 0.76);
        stalk.rotation.z = side * 0.52;
        stalk.rotation.x = -0.15;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 10), carbonMat);
        leaf.position.set(side * 1.04, 0.84, 0.72);
        leaf.rotation.x = Math.PI / 2;
        leaf.rotation.z = side * 0.35;
        const goldBorder = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 6, 14), goldMat);
        goldBorder.position.set(side * 1.04, 0.84, 0.66);
        this.aeroGroup.add(stalk, leaf, goldBorder);
      });

      // Vertical Triple Teardrop LED Taillights
      [-0.66, 0.66].forEach(x => {
        [0.54, 0.60, 0.66].forEach(y => {
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), redLedMat);
          led.position.set(x, y, -2.22);
          this.aeroGroup.add(led);
        });
      });
    }

    // ========================================================
    // 2. APOLLO INTENSA EMOZIONE (Trident Batwing & Stealth Fighter)
    // ========================================================
    else if (cfg.type === 'apollo_ie' || cfg.id === 2) {
      // Aggressive Low-Slung 8-Strake Carbon Diffuser
      this.aeroGroup.add(buildRearBumperMask(0.38, 8, 0.26, accentMat));

      // Radical Batmobile-Style Trident Wing (2.05m Wingspan)
      const tridentCenter = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.05, 0.44), carbonMat);
      tridentCenter.position.set(0, 1.10, -2.04);
      tridentCenter.rotation.x = 0.08;

      // Swept Outer Boomerang Wingtips canted upward
      [-1, 1].forEach(side => {
        const outerBlade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.045, 0.40), carbonMat);
        outerBlade.position.set(side * 0.82, 1.16, -2.06);
        outerBlade.rotation.z = side * -0.18;
        outerBlade.rotation.x = 0.08;

        const verticalWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.48), accentMat);
        verticalWinglet.position.set(side * 1.06, 1.25, -2.08);
        this.aeroGroup.add(outerBlade, verticalWinglet);
      });
      this.aeroGroup.add(tridentCenter);

      // Central Shark Fin Spine rising from the engine cover into the trident center
      const finSpine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 1.45), carbonMat);
      finSpine.position.set(0, 1.02, -1.35);
      finSpine.rotation.x = 0.04;
      const finEdge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 1.45), accentMat);
      finEdge.position.set(0, 1.18, -1.35);
      this.aeroGroup.add(finSpine, finEdge);

      // Faceted Stealth Fighter Engine Deck Louvers
      for (let l = 0; l < 4; l++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(1.0 - l * 0.12, 0.03, 0.14), carbonMat);
        louver.position.set(0, 0.74 + l * 0.045, -1.05 - l * 0.22);
        louver.rotation.x = -0.22;
        this.aeroGroup.add(louver);
      }

      // Inverted-Triangle Triple Titanium Exhaust Cannons
      const apolloPipes = [
        { x: 0, y: 0.56 },
        { x: -0.085, y: 0.46 },
        { x: 0.085, y: 0.46 }
      ];
      apolloPipes.forEach(pos => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.18, 12), titaniumMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(pos.x, pos.y, -2.26);
        this.aeroGroup.add(pipe);
        addFlame(pos.x, pos.y, -2.30, 0.95);
      });

      // Inverted Chevron Crimson Taillight Bar
      [-1, 1].forEach(side => {
        const chev = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.024, 0.06), redLedMat);
        chev.position.set(side * 0.42, 0.64, -2.24);
        chev.rotation.z = side * -0.14;
        this.aeroGroup.add(chev);
      });
    }

    // ========================================================
    // 3. KOENIGSEGG JESKO ABSOLUT (No Wing, Dual Fins & 0.85m Longtail)
    // ========================================================
    else if (cfg.type === 'jesko' || cfg.id === 3) {
      // PURE 500+ KM/H LOW-DRAG CONFIG: NO REAR WING!
      // Twin Towering Vertical Apex Shark Fins on rear haunches
      [-0.68, 0.68].forEach(x => {
        const finBody = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.38, 0.72), paintMat);
        finBody.position.set(x, 0.96, -1.82);
        const finTopEdge = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.72), accentMat);
        finTopEdge.position.set(x, 1.14, -1.82);
        this.aeroGroup.add(finBody, finTopEdge);
      });

      // Elongated Carbon Longtail Aero Extension (extends 0.85m past rear wheels)
      const longtailDeck = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.85), carbonMat);
      longtailDeck.position.set(0, 0.54, -2.42);
      const longtailLower = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 0.60), carbonMat);
      longtailLower.position.set(0, 0.36, -2.48);

      // Low-Drag Teardrop Venturi Strakes
      [-0.55, 0.55].forEach(x => {
        const strake = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.75), accentMat);
        strake.position.set(x, 0.28, -2.45);
        this.aeroGroup.add(strake);
      });
      this.aeroGroup.add(longtailDeck, longtailLower);

      // Massive Central Jet-Thruster Exhaust Cannon
      const jetExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 16), titaniumMat);
      jetExhaust.scale.set(1.4, 1.0, 0.8);
      jetExhaust.rotation.x = Math.PI / 2;
      jetExhaust.position.set(0, 0.42, -2.52);
      const jetInner = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 16), new THREE.MeshBasicMaterial({ color: 0x818cf8 }));
      jetInner.scale.set(1.4, 1.0, 0.8);
      jetInner.rotation.x = Math.PI / 2;
      jetInner.position.set(0, 0.42, -2.52);
      this.aeroGroup.add(jetExhaust, jetInner);

      // 1 Roaring Giant Jet Flame Cannon!
      addFlame(0, 0.42, -2.56, 1.85);

      // Carbon Aerodisc Wheel Covers on Rear Wheels (drag reduction)
      [-0.92, 0.92].forEach(x => {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), carbonMat);
        disc.rotation.z = Math.PI / 2;
        disc.position.set(x, 0.34, -1.35);
        this.aeroGroup.add(disc);
      });
    }

    // ========================================================
    // 4. MCLAREN SOLUS GT (Twin-Tier GT3 Wing & Roof Snorkel)
    // ========================================================
    else if (cfg.type === 'mclaren_solus' || cfg.id === 4) {
      // Rear Bumper Mask & 6-Strake Diffuser
      this.aeroGroup.add(buildRearBumperMask(0.32, 6, 0.22, accentMat));

      // Giant Twin-Tier Swan-Neck GT3 Rear Wing (2.0m Span)
      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.42), carbonMat);
      mainWing.position.set(0, 1.16, -2.04);
      mainWing.rotation.x = 0.06;

      const lowerFlap = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.035, 0.24), carbonMat);
      lowerFlap.position.set(0, 1.02, -1.94);
      lowerFlap.rotation.x = 0.12;

      // Central DRS Hydraulic Actuator Pod
      const drsPod = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.28), accentMat);
      drsPod.position.set(0, 1.16, -2.04);

      // Full-Height Vertical Endplate Fences (from diffuser to wing!)
      [-1.0, 1.0].forEach(side => {
        const fence = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.82, 0.52), carbonMat);
        fence.position.set(side, 0.82, -2.04);
        const orangePinstripe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.83, 0.04), accentMat);
        orangePinstripe.position.set(side, 0.82, -1.78);
        this.aeroGroup.add(fence, orangePinstripe);
      });
      this.aeroGroup.add(mainWing, lowerFlap, drsPod);

      // Prominent High-Rise Roof Ram-Air Snorkel Scoop (26cm above canopy)
      const snorkelBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.65), carbonMat);
      snorkelBody.position.set(0, 1.18, -0.18);
      snorkelBody.rotation.x = -0.12;
      const snorkelMouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.06), new THREE.MeshBasicMaterial({ color: 0x09090b }));
      snorkelMouth.position.set(0, 1.20, 0.14);
      this.aeroGroup.add(snorkelBody, snorkelMouth);

      // Top-Exit High Flame Exhausts (angled 25° upward and rearward)
      [-0.22, 0.22].forEach(x => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12), titaniumMat);
        pipe.rotation.x = Math.PI / 2.3;
        pipe.position.set(x, 0.74, -1.55);
        this.aeroGroup.add(pipe);
        addFlame(x, 0.76, -1.58, 1.05, -Math.PI / 2.3);
      });
    }

    // ========================================================
    // 5. FERRARI DAYTONA SP3 (Full-Width Rear Strakes & Cyber Lightbar)
    // ========================================================
    else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
      // 5 FULL-WIDTH STACKED HORIZONTAL REAR AERO STRAKES across full 1.86m width!
      for (let s = 0; s < 5; s++) {
        const strake = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.036, 0.18), carbonMat);
        strake.position.set(0, 0.32 + s * 0.085, -2.24);
        this.aeroGroup.add(strake);
      }

      // Continuous Monolithic Cyber Red LED Light Bar (Full 1.86m width!)
      const sp3Lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.026, 0.08), redLedMat);
      sp3Lightbar.position.set(0, 0.68, -2.26);
      this.aeroGroup.add(sp3Lightbar);

      // Central Le Mans Shark Fin Spine
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 1.15), carbonMat);
      fin.position.set(0, 0.90, -1.45);
      const finAccent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 1.15), accentMat);
      finAccent.position.set(0, 1.03, -1.45);
      this.aeroGroup.add(fin, finAccent);

      // Dual High-Mounted Circular Titanium Exhaust Cannons
      [-0.24, 0.24].forEach(x => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 14), titaniumMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(x, 0.54, -2.27);
        this.aeroGroup.add(pipe);
        addFlame(x, 0.54, -2.30, 0.95);
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

      // 0. Tourbillon Curved GT Wing, Dorsal Spine & Horseshoe Grille
      if (cfg.type === 'tourbillon' || cfg.id === 0) {
        const horseshoe = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9 }));
        horseshoe.rotation.x = Math.PI;
        horseshoe.position.set(0, 0.36, 2.19);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 2.2), new THREE.MeshStandardMaterial({ color: cfg.accentColor, roughness: 0.2 }));
        spine.position.set(0, 0.88, -0.4);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.05, 0.38), carbonMat);
        wing.position.set(0, 1.02, -2.04);
        carGroup.add(horseshoe, spine, wing);
      }
      // 2. Apollo Intensa Emozione Trident Batwing & Center Fin
      else if (cfg.type === 'apollo_ie' || cfg.id === 2) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.42), carbonMat);
        wing.position.set(0, 1.10, -2.06);
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 1.4), new THREE.MeshStandardMaterial({ color: cfg.accentColor }));
        fin.position.set(0, 1.02, -1.35);
        carGroup.add(wing, fin);
      }
      // 3. Jesko Twin Apex Shark Fins & 0.85m Longtail (No Wing)
      else if (cfg.type === 'jesko' || cfg.id === 3) {
        const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.36, 0.72), new THREE.MeshStandardMaterial({ color: cfg.accentColor }));
        fin1.position.set(-0.68, 0.96, -1.82);
        const fin2 = fin1.clone();
        fin2.position.x = 0.68;
        const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.85), carbonMat);
        longtail.position.set(0, 0.52, -2.42);
        carGroup.add(fin1, fin2, longtail);
      }
      // 4. McLaren Solus GT Roof Snorkel & Twin-Tier GT3 Wing
      else if (cfg.type === 'mclaren_solus' || cfg.id === 4) {
        const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.62), carbonMat);
        snorkel.position.set(0, 1.18, -0.18);
        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.40), carbonMat);
        wing1.position.set(0, 1.16, -2.04);
        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.035, 0.24), carbonMat);
        wing2.position.set(0, 1.02, -1.94);
        carGroup.add(snorkel, wing1, wing2);
      }
      // 5. Ferrari Daytona SP3 Full-Width Strakes & Shark Fin
      else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
        for (let s = 0; s < 5; s++) {
          const strake = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.035, 0.16), carbonMat);
          strake.position.set(0, 0.32 + s * 0.085, -2.22);
          carGroup.add(strake);
        }
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 1.15), new THREE.MeshStandardMaterial({ color: cfg.accentColor }));
        fin.position.set(0, 0.90, -1.45);
        carGroup.add(fin);
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
