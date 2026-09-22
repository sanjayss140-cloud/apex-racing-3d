import * as THREE from 'three';
import { audio } from './audio.js';
import { buildProceduralHypercar } from './hypercarBuilder.js';

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
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);
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
    this.rebuildHypercarMesh();
  }

  rebuildHypercarMesh() {
    if (this.currentCarMeshGroup) {
      this.carModelWrapper.remove(this.currentCarMeshGroup);
    }
    const cfg = CAR_CONFIGS[this.carIndex] || CAR_CONFIGS[0];
    const built = buildProceduralHypercar(cfg);
    this.currentCarMeshGroup = built.group;
    this.wheelFL = built.wheelFL;
    this.wheelFR = built.wheelFR;
    this.wheelRL = built.wheelRL;
    this.wheelRR = built.wheelRR;
    this.steerFL = built.steerFL;
    this.steerFR = built.steerFR;
    this.flames = built.flames;
    this.taillightMat = built.taillightMat;
    this.bodyMeshes = built.bodyMeshes;

    this.carModelWrapper.add(this.currentCarMeshGroup);
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);
    if (this.shadowBlob) {
      this.shadowBlob.position.set(this.position.x, 0.03, this.position.z);
      this.shadowBlob.rotation.z = -this.heading;
    }
    this.isReady = true;
    this.readyCallbacks.forEach(cb => cb());
    this.readyCallbacks = [];
  }

  setCarConfig(index) {
    this.carIndex = Math.max(0, Math.min(index, CAR_CONFIGS.length - 1));
    this.rebuildHypercarMesh();
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

    if (this.steerFL) this.steerFL.rotation.y = this.steerAngle;
    if (this.steerFR) this.steerFR.rotation.y = this.steerAngle;
    if (this.wheelFL) this.wheelFL.rotation.x = this.wheelRollAngle;
    if (this.wheelFR) this.wheelFR.rotation.x = this.wheelRollAngle;
    if (this.wheelRL) this.wheelRL.rotation.x = this.wheelRollAngle;
    if (this.wheelRR) this.wheelRR.rotation.x = this.wheelRollAngle;

    // Nitro flames
    if (this.flames) {
      this.flames.forEach(f => {
        f.visible = this.isNitro;
        if (this.isNitro) {
          const s = (f.baseScale || 1.0) * (0.85 + Math.random() * 0.3);
          f.scale.set(s, s, s);
        }
      });
    }

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
    this.forwardSpeed = 0;
    this.lateralSpeed = 0;
    this.heading = heading;
    this.steerAngle = 0;
    this.nitroFuel = 100;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);
    if (this.carModelWrapper) {
      this.carModelWrapper.rotation.set(0, 0, 0);
    }
    if (this.shadowBlob) {
      this.shadowBlob.position.set(this.position.x, 0.03, this.position.z);
      this.shadowBlob.rotation.z = -this.heading;
    }
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
    const built = buildProceduralHypercar(cfg);
    this.carModel = built.group;
    this.nitroFlames = built.flames;
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
