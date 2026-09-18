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

    this.setupContactShadow();
    this.setupSkidMarks();
    this.setupTireSmoke();
    this.setupSparks();
    this.setupExhaustFlames();
    this.setupHeadlights();

    // Create a sculpted procedural sports car immediately so it NEVER appears as a flat block
    this.createSculptedSupercar();

    // Load the official high-poly Ferrari 458 Italia with local DRACO decompressor
    this.loadFerrariModel();
  }

  createSculptedSupercar() {
    this.tempMeshGroup = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Rosso Corsa Red
      roughness: 0.18,
      metalness: 0.85
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.3
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.8
    });

    const alloyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.9,
      roughness: 0.15
    });

    // 1. Sleek aerodynamic wedge body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.38, 4.3), redMat);
    mainBody.position.y = 0.36;
    mainBody.castShadow = true;
    this.tempMeshGroup.add(mainBody);

    // Front Nose Wedge
    const noseGeo = new THREE.CylinderGeometry(0.1, 1.94, 1.4, 16);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, redMat);
    nose.position.set(0, 0.4, 2.1);
    nose.scale.set(1, 0.42, 1);
    this.tempMeshGroup.add(nose);

    // Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 1.0), carbonMat);
    splitter.position.set(0, 0.16, 2.38);
    this.tempMeshGroup.add(splitter);

    // Teardrop Cockpit Canopy
    const cockpitGeo = new THREE.CylinderGeometry(0.72, 0.96, 2.0, 16);
    cockpitGeo.rotateX(Math.PI / 2);
    const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
    cockpit.position.set(0, 0.78, 0.05);
    cockpit.scale.set(0.96, 0.5, 1.15);
    this.tempMeshGroup.add(cockpit);

    // GT Wing
    const wingPylonL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.3), carbonMat);
    wingPylonL.position.set(-0.6, 0.82, -2.0);
    const wingPylonR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.3), carbonMat);
    wingPylonR.position.set(0.6, 0.82, -2.0);
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.07, 0.46), carbonMat);
    wingBlade.position.set(0, 1.05, -2.05);
    wingBlade.rotation.x = 0.08;
    this.tempMeshGroup.add(wingPylonL, wingPylonR, wingBlade);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16);
    wGeo.rotateZ(Math.PI / 2);
    const rGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 12);
    rGeo.rotateZ(Math.PI / 2);

    const wCoords = [
      { x: -1.04, y: 0.36, z: 1.35 },
      { x: 1.04, y: 0.36, z: 1.35 },
      { x: -1.06, y: 0.38, z: -1.35 },
      { x: 1.06, y: 0.38, z: -1.35 }
    ];

    wCoords.forEach((pos) => {
      const wHub = new THREE.Group();
      wHub.position.set(pos.x, pos.y, pos.z);
      const tire = new THREE.Mesh(wGeo, wheelMat);
      const rim = new THREE.Mesh(rGeo, alloyMat);
      wHub.add(tire, rim);
      this.tempMeshGroup.add(wHub);
    });

    this.group.add(this.tempMeshGroup);
  }

  loadFerrariModel() {
    const loader = new GLTFLoader();

    // Attach local DRACO decompressor from public/draco
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    // Metallic Rosso Corsa Ferrari Red Paint
    const ferrariPaint = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.88,
      roughness: 0.16,
      envMapIntensity: 2.2
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.4,
      roughness: 0.35
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.1
    });

    loader.load(
      '/ferrari.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0); // True 1:1 scale (4.52m long, 1.94m wide)
        model.rotation.y = Math.PI; // Align forward with game world (+Z)
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
            } else if (name === 'carbon' || name === 'carbon_fibre_trim' || name === 'carbon fibre') {
              child.material = carbonMat;
            } else if (name.startsWith('rim_')) {
              child.material = chromeMat;
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

        // Remove temporary placeholder mesh cleanly
        if (this.tempMeshGroup) {
          this.group.remove(this.tempMeshGroup);
          this.tempMeshGroup = null;
        }

        this.group.add(model);
        this.ferrariModel = model;
        console.log('Ferrari 458 Italia 3D model loaded successfully at 1:1 scale!');
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

    // Front Xenon Projector Halos
    const headLensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    headLensGeo.rotateX(Math.PI / 2);
    const headLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lensL = new THREE.Mesh(headLensGeo, headLensMat);
    lensL.position.set(-0.68, 0.52, 2.12);
    const lensR = new THREE.Mesh(headLensGeo, headLensMat);
    lensR.position.set(0.68, 0.52, 2.12);
    this.group.add(lensL, lensR);

    // Ferrari 458 Iconic Twin Round Taillights
    const tailGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16);
    tailGeo.rotateX(Math.PI / 2);
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
    this.taillightL = new THREE.Mesh(tailGeo, this.taillightMat);
    this.taillightL.position.set(-0.62, 0.62, -2.18);
    this.taillightR = new THREE.Mesh(tailGeo, this.taillightMat);
    this.taillightR.position.set(0.62, 0.62, -2.18);
    this.group.add(this.taillightL, this.taillightR);
  }

  setupExhaustFlames() {
    const flameGeo = new THREE.ConeGeometry(0.12, 1.4, 12);
    flameGeo.rotateX(-Math.PI / 2);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    this.flameL = new THREE.Mesh(flameGeo, flameMat);
    this.flameL.position.set(-0.32, 0.35, -2.5);
    this.flameL.visible = false;

    this.flameR = new THREE.Mesh(flameGeo, flameMat);
    this.flameR.position.set(0.32, 0.35, -2.5);
    this.flameR.visible = false;

    this.group.add(this.flameL, this.flameR);
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
      this.flameL.scale.set(flameScale, flameScale, flameScale);
      this.flameR.scale.set(flameScale, flameScale, flameScale);
      this.flameL.visible = true;
      this.flameR.visible = true;
    } else {
      this.flameL.visible = false;
      this.flameR.visible = false;
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

    // Subtle chassis roll applied locally to car body only (prevents road lean)
    const activeChassis = this.ferrariModel || this.tempMeshGroup;
    if (activeChassis) {
      const rollAngle = -(this.lateralSpeed / 22.0) * 0.05;
      const pitchAngle = (accelForce / 50.0) * 0.025;
      activeChassis.rotation.z = THREE.MathUtils.lerp(activeChassis.rotation.z, rollAngle, dt * 8);
      activeChassis.rotation.x = THREE.MathUtils.lerp(activeChassis.rotation.x, pitchAngle, dt * 8);
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

    // Taillight dynamic brake flare
    if (this.taillightMat) {
      if (this.isBraking) {
        this.taillightMat.color.setHex(0xff1111);
        this.taillightL.scale.set(1.3, 1.3, 1.3);
        this.taillightR.scale.set(1.3, 1.3, 1.3);
      } else {
        this.taillightMat.color.setHex(0x881111);
        this.taillightL.scale.set(1.0, 1.0, 1.0);
        this.taillightR.scale.set(1.0, 1.0, 1.0);
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
