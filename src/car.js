import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { audio } from './audio.js';

export const CAR_CONFIGS = [
  {
    id: 0,
    name: 'Ferrari 458 Italia',
    manufacturer: 'Ferrari',
    paintColor: 0xdc2626, // Rosso Corsa
    accentColor: 0xfacc15, // Giallo Modena
    caliperColor: 0xfacc15,
    roughness: 0.16,
    metalness: 0.88,
    aeroWing: false,
    sharkFin: false,
    description: '4.5L V8 • 9,000 RPM Atmospheric Screamer'
  },
  {
    id: 1,
    name: 'Lamborghini Huracán STO',
    manufacturer: 'Lamborghini',
    paintColor: 0x16a34a, // Verde Mantis
    accentColor: 0x06b6d4, // Blu Laufey Aero
    caliperColor: 0x06b6d4,
    roughness: 0.14,
    metalness: 0.86,
    aeroWing: true,
    sharkFin: true,
    description: '5.2L V10 • Carbon Shark Fin & Massive GT Wing'
  },
  {
    id: 2,
    name: 'Bugatti Chiron Super Sport',
    manufacturer: 'Bugatti',
    paintColor: 0x1d4ed8, // French Racing Blue
    accentColor: 0x0f172a, // Deep Obsidian Carbon
    caliperColor: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.92,
    aeroWing: true,
    dualDiffuser: true,
    description: '8.0L Quad-Turbo W16 • High-Speed Longtail Aero'
  },
  {
    id: 3,
    name: 'McLaren P1',
    manufacturer: 'McLaren',
    paintColor: 0xea580c, // Volcano Sunset Orange
    accentColor: 0x18181b, // Stealth Carbon
    caliperColor: 0xea580c,
    roughness: 0.15,
    metalness: 0.90,
    aeroWing: true,
    curvedWing: true,
    description: 'Twin-Turbo V8 Hybrid • Active Aero DRS Wing'
  },
  {
    id: 4,
    name: 'Porsche 918 Spyder',
    paintColor: 0xcbd5e1, // Liquid Metal Silver
    accentColor: 0x84cc16, // Acid Green Weissach
    caliperColor: 0x84cc16,
    roughness: 0.18,
    metalness: 0.94,
    aeroWing: false,
    stripes: true,
    description: 'Naturally Aspirated V8 Hybrid • Weissach Aerodynamics'
  },
  {
    id: 5,
    name: 'Koenigsegg Jesko Absolut',
    paintColor: 0xf8fafc, // Ghost Arctic White
    accentColor: 0xdc2626, // Apex Crimson
    caliperColor: 0xdc2626,
    roughness: 0.10,
    metalness: 0.95,
    aeroWing: true,
    twinApexFins: true,
    description: 'Twin-Turbo Flat-Plane V8 • 500+ KM/H Speed Record Breaker'
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

    // Custom aerodynamics based on selected hypercar
    if (cfg.aeroWing) {
      // High-downforce carbon GT Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.04, 0.32), carbonMat);
      wing.position.set(0, 0.88, -1.95);
      wing.rotation.x = 0.08;
      this.aeroGroup.add(wing);

      // Wing upright struts
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.18), carbonMat);
      strutL.position.set(-0.45, 0.72, -1.92);
      const strutR = strutL.clone();
      strutR.position.x = 0.45;
      this.aeroGroup.add(strutL, strutR);

      // Endplates
      const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.36), accentMat);
      endplateL.position.set(-0.86, 0.88, -1.95);
      const endplateR = endplateL.clone();
      endplateR.position.x = 0.86;
      this.aeroGroup.add(endplateL, endplateR);
    }

    if (cfg.sharkFin) {
      // Huracán STO Central Dorsal Fin
      const finGeo = new THREE.BoxGeometry(0.03, 0.28, 0.95);
      const fin = new THREE.Mesh(finGeo, accentMat);
      fin.position.set(0, 0.85, -1.25);
      this.aeroGroup.add(fin);
    }

    if (cfg.twinApexFins) {
      // Jesko Dual Top Aero Stabilizers
      const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.55), accentMat);
      fin1.position.set(-0.42, 0.84, -1.75);
      const fin2 = fin1.clone();
      fin2.position.x = 0.42;
      this.aeroGroup.add(fin1, fin2);
    }
  }

  loadFerrariModel() {
    const loader = new GLTFLoader();
    const rawBase = import.meta.env.BASE_URL || './';
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

    // High-speed adaptive yaw response (prevents over-spinning at 500 km/h)
    if (Math.abs(this.forwardSpeed) > 0.5) {
      const turnDir = this.forwardSpeed >= 0 ? 1 : -1;
      const speedNorm = Math.min(1.0, this.speed / 15.0);
      const highSpeedDamp = 1.0 / (1.0 + (this.speed / 80.0) * 0.35);
      const yawDelta = this.steerAngle * this.steerResponse * speedNorm * highSpeedDamp * turnDir * dt;
      this.heading += yawDelta;
    }

    // Aerodynamic lateral grip
    const grip = this.isDrifting ? this.driftGrip : 0.95;
    this.velocity.sub(right.clone().multiplyScalar(this.lateralSpeed * (1 - grip)));
    this.velocity.multiplyScalar(Math.pow(this.drag, dt * 60));

    // Update Position
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.05;

    // 4. Smooth, Natural Lane & Armco Boundary Handling (Zero Shake, Zero Jitter)
    if (track) {
      const trackInfo = track.getClosestTrackPoint(this.position);
      const maxAllowed = track.roadHalfWidth - 1.2;

      if (trackInfo.distFromCenter > maxAllowed) {
        const sign = Math.sign(trackInfo.lateralDist) || 1;
        const excess = trackInfo.distFromCenter - maxAllowed;

        // Smooth position correction without jarring hard-snap
        this.position.sub(trackInfo.normal.clone().multiplyScalar(sign * excess));
        this.position.y = 0.05;

        // Soft elastic rebound: cancel outward velocity smoothly
        const outwardVel = this.velocity.dot(trackInfo.normal) * sign;
        if (outwardVel > 0) {
          // Deflect gently with 0.1 restitution (smooth glide, NO violent stop or vibration)
          this.velocity.sub(trackInfo.normal.clone().multiplyScalar(sign * outwardVel * 1.1));
        }

        // Gentle barrier friction glide
        this.velocity.multiplyScalar(0.994);

        // Smooth tangent heading alignment (no sharp snapping)
        const targetHeading = Math.atan2(trackInfo.tangent.x, trackInfo.tangent.z);
        this.heading = THREE.MathUtils.lerp(this.heading, targetHeading, dt * 2.5);

        if (Math.random() < 0.3) {
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

    // Aerodynamic Cockpit Greenhouse Canopy
    const canopyGeo = new THREE.BoxGeometry(1.4, 0.42, 2.1);
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 0.72, -0.2);
    carGroup.add(canopy);

    // Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 0.5), carbonMat);
    splitter.position.set(0, 0.16, 2.15);
    carGroup.add(splitter);

    // Rear Wing
    if (cfg.aeroWing) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 0.3), carbonMat);
      wing.position.set(0, 0.88, -1.92);
      carGroup.add(wing);

      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.15), carbonMat);
      strutL.position.set(-0.45, 0.72, -1.9);
      const strutR = strutL.clone();
      strutR.position.x = 0.45;
      carGroup.add(strutL, strutR);
    }

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

    // Headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.1), lightMat);
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
