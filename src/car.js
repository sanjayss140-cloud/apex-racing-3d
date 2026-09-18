import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { audio } from './audio.js';

export class Hypercar {
  constructor(scene) {
    this.scene = scene;

    // Driving Physics Constants (Tuned for ultra-satisfying 10/10 arcade handling)
    this.acceleration = 46.0;        // 0-100 in 2.7s
    this.nitroAcceleration = 76.0;   // Explosive nitrous boost
    this.maxSpeed = 84.0;            // ~302 km/h
    this.maxNitroSpeed = 104.0;      // ~375 km/h
    this.reverseMaxSpeed = 22.0;     // ~80 km/h
    this.braking = 58.0;             // Crisp carbon-ceramic brakes
    this.drag = 0.989;               // Low aerodynamic drag
    this.steerResponse = 2.7;
    this.driftGrip = 0.85;

    // Dynamic State
    this.position = new THREE.Vector3(0, 0.05, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0;                  // m/s
    this.forwardSpeed = 0;
    this.lateralSpeed = 0;
    this.heading = 0;                // Yaw angle in radians
    this.steerAngle = 0;             // Front wheels steering angle
    this.currentGear = 1;
    this.rpm = 1000;
    this.isDrifting = false;
    this.isBraking = false;
    this.isNitro = false;
    this.nitroFuel = 100;            // 0-100%
    this.driftScore = 0;

    // Inputs
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
      nitro: false
    };

    // Gear Ratios for RPM
    this.gearMaxSpeeds = [0, 22, 42, 60, 76, 92, 112];

    // Submesh references from GLTF
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelRL = null;
    this.wheelRR = null;
    this.steeringWheel = null;
    this.wheelRollAngle = 0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Isolated wrapper for authentic chassis pitch & roll dynamics
    this.carModelWrapper = new THREE.Group();
    this.group.add(this.carModelWrapper);

    this.isReady = false;
    this.readyCallbacks = [];

    this.setupContactShadow();
    this.setupSkidMarks();
    this.setupTireSmoke();
    this.setupSparks();
    this.setupExhaustFlames();
    this.setupHeadlights();

    // Load the official high-poly Ferrari 458 Italia with local DRACO decompressor
    this.loadFerrariModel();
  }

  onModelReady(cb) {
    if (this.isReady) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  loadFerrariModel() {
    const loader = new GLTFLoader();

    // Attach local DRACO decompressor using base-relative path
    const rawBase = import.meta.env.BASE_URL || './';
    const cleanBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    const dracoPath = `${cleanBase}draco/`;
    const modelPath = `${cleanBase}ferrari.glb`;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(dracoPath);
    loader.setDRACOLoader(dracoLoader);

    // Rosso Corsa Ferrari Red Metallic Paint
    const ferrariPaint = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.88,
      roughness: 0.16,
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
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.2
    });

    const ledHeadlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    const shiftLedMat = new THREE.MeshBasicMaterial({
      color: 0xff1e1e
    });

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0); // True 1:1 scale (4.52m long, 1.94m wide)
        model.rotation.y = Math.PI;     // Align forward facing with world +Z
        model.position.set(0, 0.02, 0);

        // Traverse and enhance authentic Ferrari materials
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;

            const name = child.name.toLowerCase();

            if (name === 'body') {
              child.material = ferrariPaint;
            } else if (name === 'glass') {
              child.material = glassMat;
            } else if (name === 'carbon' || name === 'carbon_fibre_trim' || name === 'carbon_fibre') {
              child.material = carbonMat;
            } else if (name.startsWith('rim_') || name === 'chrome' || name === 'metal') {
              child.material = chromeMat;
            } else if (name === 'lights_red') {
              this.taillightMesh = child;
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

        // Hook up separate steerable and spinning wheels
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

        console.log('Ferrari 458 Italia 3D model loaded successfully at 1:1 scale!');
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
    const flameGeo = new THREE.ConeGeometry(0.08, 1.3, 12);
    flameGeo.rotateX(-Math.PI / 2);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    // Authentic Ferrari 458 Triple Central Exhaust pipes
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
    this.skidGeo.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));

    const skidShaderMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        skidColor: { value: new THREE.Color(0x09090b) }
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_PointSize = 13.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 skidColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(skidColor, vAlpha * 0.6);
        }
      `
    });

    this.skidPoints = new THREE.Points(this.skidGeo, skidShaderMat);
    this.scene.add(this.skidPoints);
    this.skidHead = 0;
  }

  addSkidPoint(x, z, alpha = 0.75) {
    const posAttr = this.skidGeo.attributes.position;
    const alphaAttr = this.skidGeo.attributes.alpha;
    const idx = this.skidHead % this.maxSkidPoints;

    posAttr.setXYZ(idx, x, 0.05, z);
    alphaAttr.setX(idx, alpha);

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    this.skidHead++;
  }

  setupTireSmoke() {
    this.maxSmoke = 65;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(this.maxSmoke * 3);
    this.smokeLifes = new Float32Array(this.maxSmoke);
    this.smokeVels = [];

    for (let i = 0; i < this.maxSmoke; i++) {
      this.smokeVels.push(new THREE.Vector3());
      this.smokeLifes[i] = 0;
    }

    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));

    const sMat = new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 1.6,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });

    this.smokeMesh = new THREE.Points(sGeo, sMat);
    this.scene.add(this.smokeMesh);
    this.smokeHead = 0;
  }

  emitSmoke(pos, vel) {
    const idx = this.smokeHead % this.maxSmoke;
    const posAttr = this.smokeMesh.geometry.attributes.position;

    posAttr.setXYZ(idx, pos.x, pos.y, pos.z);
    this.smokeLifes[idx] = 1.0;
    this.smokeVels[idx].copy(vel);

    posAttr.needsUpdate = true;
    this.smokeHead++;
  }

  updateSmoke(dt) {
    const posAttr = this.smokeMesh.geometry.attributes.position;
    for (let i = 0; i < this.maxSmoke; i++) {
      if (this.smokeLifes[i] > 0) {
        this.smokeLifes[i] -= dt * 1.6;
        const x = posAttr.getX(i) + this.smokeVels[i].x * dt;
        const y = posAttr.getY(i) + this.smokeVels[i].y * dt + 0.5 * dt;
        const z = posAttr.getZ(i) + this.smokeVels[i].z * dt;
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  setupSparks() {
    this.maxSparks = 60;
    const spGeo = new THREE.BufferGeometry();
    const spPos = new Float32Array(this.maxSparks * 3);
    this.sparkLifes = new Float32Array(this.maxSparks);
    this.sparkVels = [];

    for (let i = 0; i < this.maxSparks; i++) {
      this.sparkVels.push(new THREE.Vector3());
      this.sparkLifes[i] = 0;
    }

    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    const spMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    this.sparkMesh = new THREE.Points(spGeo, spMat);
    this.scene.add(this.sparkMesh);
    this.sparkHead = 0;
  }

  emitSparks(pos) {
    for (let k = 0; k < 2; k++) {
      const idx = this.sparkHead % this.maxSparks;
      const posAttr = this.sparkMesh.geometry.attributes.position;
      posAttr.setXYZ(idx, pos.x, pos.y + 0.3, pos.z);
      this.sparkLifes[idx] = 0.4;
      this.sparkVels[idx].set(
        (Math.random() - 0.5) * 6,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 6
      );
      posAttr.needsUpdate = true;
      this.sparkHead++;
    }
  }

  updateSparks(dt) {
    const posAttr = this.sparkMesh.geometry.attributes.position;
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkLifes[i] > 0) {
        this.sparkLifes[i] -= dt * 2.0;
        const x = posAttr.getX(i) + this.sparkVels[i].x * dt;
        const y = posAttr.getY(i) + this.sparkVels[i].y * dt - 9.8 * dt * dt;
        const z = posAttr.getZ(i) + this.sparkVels[i].z * dt;
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  update(dt, track = null) {
    // 1. Nitro Handling & Refill
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
      this.nitroFuel = Math.min(100, this.nitroFuel + dt * 8.0);
    }

    // 2. Steering & Yaw Dynamics
    let targetSteer = 0;
    if (this.inputs.left) targetSteer += 0.52;
    if (this.inputs.right) targetSteer -= 0.52;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * 14);

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    this.forwardSpeed = this.velocity.dot(forward);
    this.lateralSpeed = this.velocity.dot(right);
    this.speed = this.velocity.length();

    // 3. Acceleration & Braking Forces
    let accelForce = 0;
    const currentMax = this.isNitro ? this.maxNitroSpeed : this.maxSpeed;

    // SPACE = Dedicated Foot & Hand BRAKE
    if (this.inputs.brake) {
      this.isBraking = true;
      if (Math.abs(this.forwardSpeed) > 0.3) {
        accelForce -= Math.sign(this.forwardSpeed) * this.braking * 1.8;
      } else {
        this.velocity.multiplyScalar(0.7);
      }
    } else {
      this.isBraking = false;
    }

    // W = Accelerate Forward
    if (this.inputs.forward && !this.inputs.brake) {
      const force = this.isNitro ? this.nitroAcceleration : this.acceleration;
      if (this.forwardSpeed < currentMax) {
        accelForce += force;
      }
    }
    // S = Dedicated REVERSE Gear
    else if (this.inputs.backward && !this.inputs.brake) {
      if (this.forwardSpeed > 0.6) {
        // Swift deceleration before reversing
        accelForce -= this.braking * 1.4;
      } else if (this.forwardSpeed > -this.reverseMaxSpeed) {
        accelForce -= this.acceleration * 0.75;
      }
    }

    // Drift activation: tapping Brake (Space) while steering with speed, or lateral momentum
    this.isDrifting = (this.inputs.brake || Math.abs(this.lateralSpeed) > 5.2) && this.speed > 7.0;

    // Apply acceleration
    this.velocity.addScaledVector(forward, accelForce * dt);

    // Turn torque
    if (Math.abs(this.forwardSpeed) > 0.5) {
      const turnDir = this.forwardSpeed >= 0 ? 1 : -1;
      const speedFactor = Math.min(1.0, this.speed / 12.0);
      const yawDelta = this.steerAngle * this.steerResponse * speedFactor * turnDir * dt;
      this.heading += yawDelta;
    }

    // Grip & Aerodynamic drag
    const grip = this.isDrifting ? this.driftGrip : 0.94;
    this.velocity.sub(right.clone().multiplyScalar(this.lateralSpeed * (1 - grip)));
    this.velocity.multiplyScalar(Math.pow(this.drag, dt * 60));

    // Update Position
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0.05;

    // Smooth Armco Barrier Sliding & Clamping ("No Off-Race")
    if (track) {
      const trackInfo = track.getClosestTrackPoint(this.position);
      const maxAllowed = track.roadHalfWidth - 1.25;
      if (trackInfo.distFromCenter > maxAllowed) {
        const sign = Math.sign(trackInfo.lateralDist);
        this.position.copy(trackInfo.closestPoint).addScaledVector(trackInfo.normal, sign * maxAllowed);
        this.position.y = 0.05;

        // Slide smoothly along road tangent
        const forwardSpeed = this.velocity.dot(trackInfo.tangent);
        this.velocity.copy(trackInfo.tangent).multiplyScalar(forwardSpeed * 0.96);

        // Smoothly guide car heading along road tangent
        const targetHeading = Math.atan2(trackInfo.tangent.x, trackInfo.tangent.z);
        this.heading = THREE.MathUtils.lerp(this.heading, targetHeading, dt * 6);

        this.emitSparks(this.position);
      }
    }

    // 4. Update Three.js Transform synchronously (Rock-solid, ZERO lag)
    this.group.position.copy(this.position);
    // Root group stays strictly level with ground on Y-axis yaw only
    this.group.rotation.set(0, this.heading, 0);

    // Subtle chassis roll applied locally to car body wrapper
    if (this.carModelWrapper) {
      const rollAngle = -(this.lateralSpeed / 22.0) * 0.05;
      const pitchAngle = (accelForce / 50.0) * 0.025;
      this.carModelWrapper.rotation.z = THREE.MathUtils.lerp(this.carModelWrapper.rotation.z, rollAngle, dt * 8);
      this.carModelWrapper.rotation.x = THREE.MathUtils.lerp(this.carModelWrapper.rotation.x, pitchAngle, dt * 8);
    }

    // Contact Shadow follows car
    if (this.shadowBlob) {
      this.shadowBlob.position.set(this.position.x, 0.03, this.position.z);
      this.shadowBlob.rotation.z = -this.heading;
    }

    // 5. Gear & RPM
    this.calculateGearsAndRPM();

    // 6. Animate Ferrari Wheels & Steering Wheel
    const rotDelta = (this.forwardSpeed / 0.34) * dt;
    this.wheelRollAngle += rotDelta;

    const baseRotX = -Math.PI / 2; // Authentic GLTF rest pose
    const roll = baseRotX + this.wheelRollAngle;

    if (this.wheelFL) {
      this.wheelFL.rotation.set(roll, 0, this.steerAngle, 'ZXY');
    }
    if (this.wheelFR) {
      this.wheelFR.rotation.set(roll, 0, this.steerAngle, 'ZXY');
    }
    if (this.wheelRL) {
      this.wheelRL.rotation.set(roll, 0, 0);
    }
    if (this.wheelRR) {
      this.wheelRR.rotation.set(roll, 0, 0);
    }
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -this.steerAngle * 2.5;
    }

    // Taillight dynamic brake flare (authentic Ferrari lights_red mesh)
    if (this.taillightMat) {
      if (this.isBraking) {
        this.taillightMat.emissive.setHex(0xff0000);
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 3.2, dt * 15);
      } else {
        this.taillightMat.emissive.setHex(0x770000);
        this.taillightMat.emissiveIntensity = THREE.MathUtils.lerp(this.taillightMat.emissiveIntensity, 0.8, dt * 8);
      }
    }

    // Lay skid marks & tire smoke during drifts
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

    // 7. Audio & Drift score
    audio.updateEngine(this.rpm, this.inputs.forward, this.isNitro);
    audio.updateDrift(this.isDrifting, Math.abs(this.lateralSpeed) / 10.0);

    if (this.isDrifting) {
      this.driftScore += Math.round(Math.abs(this.lateralSpeed) * dt * 45);
    }
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
    const maxRPM = 8800;
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
