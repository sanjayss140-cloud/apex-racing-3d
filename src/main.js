import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Hypercar } from './car.js';
import { Track } from './track.js';
import { RacingHUD } from './hud.js';
import { audio } from './audio.js';
import { createSunsetEnvironment } from './environment.js';

class ApexRacingGame {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 7 World Wonders Race State
    this.activeCheckpoint = 1;
    this.totalCheckpoints = 7;
    this.raceStartTime = null;
    this.raceFinished = false;
    this.isCountingDown = true;
    this.topSpeedReached = 0;
    this.elapsedTime = 0;

    this.initThree();
    this.initEntities();
    this.setup3DWaypointArrow();
    this.setupInputs();
    this.setupUI();

    this.clock = new THREE.Clock();
    this.startRaceSequence();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.00035);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1400);
    this.cameraTarget = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Performance optimization for mobile devices
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window);
    this.isMobile = isMobile;
    this.renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // Sunset Sky Environment
    createSunsetEnvironment(this.renderer, this.scene);

    // Warm Golden Sunlight
    this.ambientLight = new THREE.AmbientLight(0xffedd5, 1.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfde047, 2.6);
    this.sunLight.position.set(90, 80, -110);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;

    const d = 160;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;

    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => this.onResize());
  }

  initEntities() {
    this.track = new Track(this.scene);
    this.car = new Hypercar(this.scene);
    this.hud = new RacingHUD();

    // Start position aligned on Tokyo Metropolis Launch Straight facing Gate 1
    this.car.reset(0, 35, Math.PI);

    // Pre-position camera immediately behind car (No flying/clipping on startup)
    this.camera.position.set(0, 3.2, 42.5);
    this.cameraTarget.set(0, 1.2, 20);
    this.camera.lookAt(this.cameraTarget);

    this.track.highlightCheckpoint(this.activeCheckpoint);
  }

  setup3DWaypointArrow() {
    this.arrowGroup = new THREE.Group();

    const arrowGeo = new THREE.ConeGeometry(0.35, 1.2, 16);
    arrowGeo.rotateX(Math.PI / 2);

    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.arrowGroup.add(arrowMesh);

    const ringGeo = new THREE.RingGeometry(0.6, 0.75, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.arrowGroup.add(ring);

    this.scene.add(this.arrowGroup);
  }

  startRaceSequence() {
    this.isCountingDown = true;
    this.hud.showPreparingMessage();

    this.car.onModelReady(() => {
      this.hud.startCountdown(() => {
        this.isCountingDown = false;
        this.raceStartTime = performance.now();
      });
    });
  }

  setupInputs() {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      Space: 'brake',
      ShiftLeft: 'nitro',
      ShiftRight: 'nitro'
    };

    window.addEventListener('keydown', (e) => {
      audio.ensureContext();

      if (keyMap[e.code] && !this.isCountingDown) {
        this.car.inputs[keyMap[e.code]] = true;
      }
      if (e.code === 'KeyR') {
        this.resetCarToCheckpoint();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (keyMap[e.code]) {
        this.car.inputs[keyMap[e.code]] = false;
      }
    });

    // Touch Controls
    const bindTouch = (btnId, key) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      const start = (e) => {
        if (e.cancelable) e.preventDefault();
        audio.ensureContext();
        if (!this.isCountingDown) this.car.inputs[key] = true;
      };
      const end = (e) => {
        if (e.cancelable) e.preventDefault();
        this.car.inputs[key] = false;
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('pointerleave', end);
    };

    bindTouch('touch-gas', 'forward');
    bindTouch('touch-brake', 'backward');
    bindTouch('touch-handbrake', 'brake');
    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-nitro', 'nitro');

    window.addEventListener('pointerdown', () => audio.ensureContext(), { once: true });
  }

  setupUI() {
    document.getElementById('reset-car-btn').addEventListener('click', () => {
      this.resetCarToCheckpoint();
    });

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      muteBtn.querySelector('span').textContent = audio.muted ? 'Audio: OFF' : 'Audio: ON';
    });

    document.getElementById('restart-race-btn').addEventListener('click', () => {
      this.restartRace();
    });
  }

  resetCarToCheckpoint() {
    const targetCP = this.track.checkpoints.find((cp) => cp.id === this.activeCheckpoint);
    if (targetCP && targetCP.roadIdx !== undefined) {
      const pointsCount = this.track.pointsCount || 600;
      const resetIdx = (targetCP.roadIdx - 14 + pointsCount) % pointsCount;
      const pt = this.track.roadPoints[resetIdx];
      const heading = this.track.getHeadingAt(resetIdx);
      this.car.reset(pt.x, pt.z, heading);
    } else if (targetCP) {
      const forward = new THREE.Vector3(Math.sin(targetCP.rotation), 0, Math.cos(targetCP.rotation));
      const resetPos = targetCP.pos.clone().addScaledVector(forward, -16);
      this.car.reset(resetPos.x, resetPos.z, targetCP.rotation);
    } else {
      this.car.reset(0, 35, Math.PI);
    }

    // Immediately snap camera to chase position without lerp latency
    const forwardVec = new THREE.Vector3(Math.sin(this.car.heading), 0, Math.cos(this.car.heading));
    const behindVec = forwardVec.clone().multiplyScalar(-7.2);
    this.camera.position.copy(this.car.position).add(behindVec).add(new THREE.Vector3(0, 2.9, 0));
    this.cameraTarget.copy(this.car.position).addScaledVector(forwardVec, 8);
    this.camera.lookAt(this.cameraTarget);
  }

  restartRace() {
    document.getElementById('victory-modal').classList.remove('active');
    this.activeCheckpoint = 1;
    this.raceFinished = false;
    this.car.reset(0, 35, Math.PI);
    this.car.driftScore = 0;
    this.topSpeedReached = 0;
    this.track.highlightCheckpoint(this.activeCheckpoint);
    this.startRaceSequence();
  }

  checkCheckpointProgress() {
    if (this.raceFinished || this.isCountingDown) return;

    const currentCP = this.track.checkpoints.find((cp) => cp.id === this.activeCheckpoint);
    if (!currentCP) return;

    const dist = this.car.position.distanceTo(currentCP.pos);

    // Update Waypoint HUD
    this.hud.updateCheckpointStatus(
      this.activeCheckpoint,
      this.totalCheckpoints,
      dist,
      currentCP.name
    );

    // Update 3D Floating Arrow above car
    if (this.arrowGroup) {
      this.arrowGroup.position.copy(this.car.position).add(new THREE.Vector3(0, 2.6, 0));
      this.arrowGroup.lookAt(currentCP.pos.x, 2.6, currentCP.pos.z);
      this.arrowGroup.position.y += Math.sin(performance.now() * 0.006) * 0.15;
    }

    // Check if car drove through the gate
    if (dist < currentCP.radius) {
      audio.playCheckpointChime();

      // Show Split Banner
      this.hud.showSplitTime(currentCP.id, currentCP.name, this.elapsedTime);

      if (this.activeCheckpoint < this.totalCheckpoints) {
        this.activeCheckpoint++;
        this.track.highlightCheckpoint(this.activeCheckpoint);
      } else {
        this.finishRace();
      }
    }
  }

  finishRace() {
    this.raceFinished = true;
    audio.playVictoryFanfare();

    confetti({
      particleCount: 180,
      spread: 95,
      origin: { y: 0.6 }
    });

    const formattedTime = this.hud.formatTime(this.elapsedTime);
    const topSpeedKmh = Math.round(this.topSpeedReached * 3.6);

    document.getElementById('fin-time').textContent = formattedTime;
    document.getElementById('fin-speed').textContent = `${topSpeedKmh} KM/H`;
    document.getElementById('fin-drift').textContent = `${this.car.driftScore.toLocaleString()} PTS`;

    let rank = 'B-RANK';
    if (this.elapsedTime < 95) rank = 'S-RANK 👑';
    else if (this.elapsedTime < 130) rank = 'A-RANK ⚡';
    document.getElementById('fin-rank').textContent = rank;

    setTimeout(() => {
      document.getElementById('victory-modal').classList.add('active');
    }, 1200);
  }

  updateCamera(dt) {
    const carPos = this.car.position;
    const forwardVec = new THREE.Vector3(Math.sin(this.car.heading), 0, Math.cos(this.car.heading));
    const speed = this.car.speed;

    const lookAheadDist = Math.min(22, 5 + speed * 0.32);
    const lookTarget = carPos.clone().addScaledVector(forwardVec, lookAheadDist);
    this.cameraTarget.lerp(lookTarget, dt * 8);

    const behindVec = forwardVec.clone().multiplyScalar(-1);
    const chaseDist = 7.2 + (speed / 90.0) * 2.2;
    const chaseHeight = 2.9 + (speed / 90.0) * 0.7;

    const desiredCamPos = carPos.clone()
      .addScaledVector(behindVec, chaseDist)
      .add(new THREE.Vector3(0, chaseHeight, 0));

    if (this.car.isNitro || speed > 60) {
      const shakeAmt = 0.05;
      desiredCamPos.x += (Math.random() - 0.5) * shakeAmt;
      desiredCamPos.y += (Math.random() - 0.5) * shakeAmt;
    }

    this.camera.position.lerp(desiredCamPos, dt * 10);
    this.camera.lookAt(this.cameraTarget);

    const targetFOV = this.car.isNitro ? 78 : (60 + (speed / 90.0) * 12);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 6);
    this.camera.updateProjectionMatrix();

    const overlay = document.getElementById('speed-overlay');
    if (overlay) {
      if (this.car.isNitro || speed > 65) {
        overlay.classList.add('active');
      } else {
        overlay.classList.remove('active');
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // 1. Timer
    if (!this.raceFinished && !this.isCountingDown && this.raceStartTime) {
      this.elapsedTime = (performance.now() - this.raceStartTime) / 1000;
      this.hud.updateTimer(this.elapsedTime);
    }

    // 2. Car Dynamics with Synchronous Armco Clamping (Butter smooth 60+ FPS)
    this.car.update(dt, this.track);
    if (this.car.speed > this.topSpeedReached) {
      this.topSpeedReached = this.car.speed;
    }

    // 3. Track animations (glowing laser gates, tunnel rings)
    this.track.update(dt);

    // 4. Checkpoint Progress & 3D Waypoint Arrow
    this.checkCheckpointProgress();

    // 5. Camera Follow
    this.updateCamera(dt);

    // 6. Cockpit Cluster & Minimap
    this.hud.updateDashboard(
      this.car.forwardSpeed,
      this.car.rpm,
      this.car.currentGear,
      this.car.isNitro,
      this.car.nitroFuel,
      this.car.isDrifting,
      this.car.driftScore
    );

    this.hud.drawMinimap(
      this.car.position,
      this.car.heading,
      this.track.checkpoints,
      this.activeCheckpoint
    );

    // 7. Render (Silky smooth 60+ FPS)
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new ApexRacingGame();
});
