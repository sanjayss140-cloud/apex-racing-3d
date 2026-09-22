import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Hypercar, RemoteHypercar, CAR_CONFIGS } from './car.js';
import { Track, MAP_CONFIGS } from './track.js';
import { RacingHUD } from './hud.js';
import { audio } from './audio.js';
import { setMapEnvironment } from './environment.js';
import { NetworkManager } from './network.js';

class ApexRacingGame {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // State
    this.gameMode = 'solo'; // 'solo' or 'multiplayer'
    this.soloTourStage = 0; // 0 = Map 0, 1 = Map 1, 2 = Map 2
    this.soloTourTimes = [null, null, null];

    this.activeMapIndex = 0;
    this.selectedCarIndex = 0;
    this.activeCheckpoint = 1;
    this.totalCheckpoints = 7;
    this.raceStartTime = null;
    this.raceFinished = false;
    this.isCountingDown = false;
    this.topSpeedReached = 0;
    this.elapsedTime = 0;
    this.inShowroom = false;
    this.cameraMode = 'chase'; // 'chase' or 'cockpit' (in-seat)

    // Multiplayer Multi-Map Tour State
    this.multiStage = 0; // 0 = Desert, 1 = Tokyo, 2 = Volcano
    this.finishedStageRacers = new Set();

    this.remoteCars = new Map(); // peerId -> RemoteHypercar
    this.lastTelemetrySend = 0;

    this.initThree();
    this.initEntities();
    this.setup3DWaypointArrow();
    this.setupInputs();
    this.setupNetwork();
    this.setupUI();

    this.clock = new THREE.Clock();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.00035);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 1600);
    this.cameraTarget = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window);
    this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobile ? THREE.BasicShadowMap : THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // Initial Sky & Environment
    setMapEnvironment(this.renderer, this.scene, this.activeMapIndex);

    // Directional Sunlight / Key Light
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
    this.scene.add(this.sunLight.target);

    // Dedicated Showroom Studio SpotLight
    this.showroomLight = new THREE.SpotLight(0xffffff, 4.2, 50, Math.PI / 3, 0.35, 1.2);
    this.showroomLight.target = new THREE.Object3D();
    this.showroomLight.visible = false;
    this.scene.add(this.showroomLight);
    this.scene.add(this.showroomLight.target);

    window.addEventListener('resize', () => this.onResize());
  }

  initEntities() {
    this.track = new Track(this.scene, this.activeMapIndex);
    this.car = new Hypercar(this.scene);
    this.hud = new RacingHUD();

    // Start position dynamically aligned on the track launch straight facing Gate 1
    this.resetCarToStart();

    this.track.highlightCheckpoint(this.activeCheckpoint);
  }

  // Staggered Racing Starting Grid (F1 / Le Mans slot placement)
  getStartingGridTransform(slotIndex = 0) {
    if (!this.track || !this.track.roadPoints || this.track.roadPoints.length === 0) {
      return { x: 0, z: 0, heading: 0 };
    }
    const p0 = this.track.roadPoints[0];
    const heading0 = this.track.getHeadingAt(0);
    const forwardVec = new THREE.Vector3(Math.sin(heading0), 0, Math.cos(heading0));
    const rightVec = new THREE.Vector3(Math.cos(heading0), 0, -Math.sin(heading0));

    // Staggered grid slots:
    // Slot 0 (Pole): left -2.4m, forward -6m
    // Slot 1: right +2.4m, forward -18m
    // Slot 2: left -2.4m, forward -30m
    // Slot 3: right +2.4m, forward -42m
    // Slot 4: left -2.4m, forward -54m
    // Slot 5: right +2.4m, forward -66m
    const isRight = (slotIndex % 2) === 1;
    const lateralOffset = isRight ? 2.4 : -2.4;
    const longitudinalOffset = -6.0 - (slotIndex * 12.0);

    const pos = p0.clone()
      .addScaledVector(forwardVec, longitudinalOffset)
      .addScaledVector(rightVec, lateralOffset);

    return { x: pos.x, z: pos.z, heading: heading0 };
  }

  getMySlotIndex() {
    if (this.gameMode !== 'multiplayer' || !this.network || !this.network.players) return 0;
    const playersList = Array.from(this.network.players.values());
    const idx = playersList.findIndex(p => p.id === this.network.myPeerId);
    return idx >= 0 ? idx : 0;
  }

  getPlayerSlotIndex(playerId) {
    if (!this.network || !this.network.players) return 0;
    const playersList = Array.from(this.network.players.values());
    const idx = playersList.findIndex(p => p.id === playerId);
    return idx >= 0 ? idx : 0;
  }

  resetCarToStart(customSlot = null) {
    const slotIdx = customSlot !== null ? customSlot : this.getMySlotIndex();
    const grid = this.getStartingGridTransform(slotIdx);
    this.car.reset(grid.x, grid.z, grid.heading);

    const forwardVec = new THREE.Vector3(Math.sin(grid.heading), 0, Math.cos(grid.heading));
    const behindVec = forwardVec.clone().multiplyScalar(-7.2);
    this.camera.position.copy(this.car.position).add(behindVec).add(new THREE.Vector3(0, 2.8, 0));
    this.cameraTarget.copy(this.car.position).addScaledVector(forwardVec, 8);
    this.camera.lookAt(this.cameraTarget);

    // Place all remote opponent cars on their respective distinct slots!
    if (this.remoteCars && this.network && this.network.players) {
      this.remoteCars.forEach((rCar, pId) => {
        const rSlot = this.getPlayerSlotIndex(pId);
        const rGrid = this.getStartingGridTransform(rSlot);
        rCar.setInitialPlacement(rGrid.x, 0.05, rGrid.z, rGrid.heading);
      });
    }
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

  setupNetwork() {
    this.network = new NetworkManager(
      (code) => {
        const codeDisplay = document.getElementById('room-code-display');
        if (codeDisplay) codeDisplay.textContent = code;
      },
      (players, selectedMap) => {
        this.updateLobbyUI(players, selectedMap);
      },
      (data) => {
        if (data.type === 'START_RACE') {
          document.getElementById('lobby-modal').classList.remove('active');
          document.getElementById('mode-selection-modal').classList.remove('active');
          this.multiStage = 0;
          this.finishedStageRacers.clear();
          this.hideWaitingOnGrid();
          if (data.mapIndex !== undefined && data.mapIndex !== this.activeMapIndex) {
            this.switchMap(data.mapIndex);
          }
          this.startRaceSequence();
        } else if (data.type === 'STAGE_PROGRESS') {
          this.finishedStageRacers.add(data.playerId);
          const totalRacers = this.network.players.size;
          const finishedCount = this.finishedStageRacers.size;
          const nextMapName = this.multiStage === 1 ? 'TOKYO' : (this.multiStage === 2 ? 'VOLCANO' : 'NEXT MAP');
          this.showWaitingOnGrid(
            `STAGE COMPLETED! 🏁`,
            `ARRIVED AT ${nextMapName} GRID • WAITING FOR RACERS (${finishedCount}/${totalRacers})...`
          );
          if (this.network.isHost) {
            this.checkAllPlayersStageFinished(this.multiStage);
          }
        } else if (data.type === 'START_NEXT_STAGE') {
          this.hideWaitingOnGrid();
          this.finishedStageRacers.clear();
          this.multiStage = data.mapIndex;
          this.switchMap(data.mapIndex);
          this.resetCarToStart(this.getMySlotIndex());
          this.startRaceSequence();
        } else if (data.type === 'TELEMETRY') {
          const rCar = this.remoteCars.get(data.playerId);
          if (rCar) {
            rCar.updateTelemetry(data);
          }
        }
      }
    );

    // Connect to signaling immediately
    this.network.init();
  }

  ensureHostLobbyReady() {
    if (!this.network) return;
    const roomCode = this.network.createRoom('Host', this.selectedCarIndex, this.activeMapIndex);
    const codeDisplay = document.getElementById('room-code-display');
    if (codeDisplay) codeDisplay.textContent = roomCode;
  }

  updateLobbyUI(players, selectedMap) {
    const rosterEl = document.getElementById('player-roster');
    const countEl = document.getElementById('player-count');
    if (!rosterEl) return;

    rosterEl.innerHTML = '';
    if (countEl) countEl.textContent = players.size;

    players.forEach((p) => {
      const isMe = p.id === this.network.myPeerId;
      const carCfg = CAR_CONFIGS[p.carIndex] || CAR_CONFIGS[0];
      const div = document.createElement('div');
      div.className = `roster-item ${isMe ? 'me' : ''}`;
      div.innerHTML = `
        <span class="player-status-icon">${p.isHost ? '👑' : '🏎️'}</span>
        <span class="player-name">${p.name} ${isMe ? '(You)' : ''}</span>
        <span class="player-car-tag">${carCfg.name.split(' ')[0]}</span>
      `;
      rosterEl.appendChild(div);

      // Manage Remote Cars in 3D scene
      if (!isMe && !this.remoteCars.has(p.id)) {
        const remoteCar = new RemoteHypercar(this.scene, p);
        this.remoteCars.set(p.id, remoteCar);
      }
    });

    if (selectedMap !== undefined && selectedMap !== this.activeMapIndex) {
      this.switchMap(selectedMap);
    }
  }

  switchMap(mapIndex) {
    this.activeMapIndex = mapIndex;
    this.track.setMap(mapIndex);
    setMapEnvironment(this.renderer, this.scene, mapIndex);
    this.resetCarToStart();
    this.activeCheckpoint = 1;
    this.track.highlightCheckpoint(this.activeCheckpoint);

    const mapCfg = MAP_CONFIGS[mapIndex];
    const mapTag = document.getElementById('map-name-tag');
    if (mapTag && mapCfg) {
      if (this.gameMode === 'solo') {
        mapTag.textContent = `STAGE ${this.soloTourStage + 1}/3 • ${mapCfg.name.toUpperCase()}`;
      } else {
        mapTag.textContent = mapCfg.name.toUpperCase();
      }
    }
  }

  startRaceSequence() {
    this.inShowroom = false;
    this.isCountingDown = true;
    this.raceFinished = false;
    this.activeCheckpoint = 1;
    this.topSpeedReached = 0;
    this.elapsedTime = 0;
    this.raceStartTime = null;
    this.hud.updateTimer(0);
    this.resetCarToStart();
    this.track.highlightCheckpoint(this.activeCheckpoint);

    const stageTitle = this.gameMode === 'solo' ? `STAGE ${this.soloTourStage + 1} / 3` : 'WARMING UP TIRES...';
    this.hud.showPreparingMessage(stageTitle);

    this.car.onModelReady(() => {
      this.hud.startCountdown(() => {
        this.isCountingDown = false;
        this.elapsedTime = 0;
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
      if (e.code === 'KeyR') {
        this.resetCarToCheckpoint();
        return;
      }
      const action = keyMap[e.code];
      if (action) {
        this.car.inputs[action] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = keyMap[e.code];
      if (action) {
        this.car.inputs[action] = false;
      }
    });

    // Mobile Virtual Touch Controls
    const bindTouch = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        this.car.inputs[action] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.car.inputs[action] = false;
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
    };

    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-gas', 'forward');
    bindTouch('touch-brake', 'backward');
    bindTouch('touch-handbrake', 'brake');
    bindTouch('touch-nitro', 'nitro');

    // Showroom 360-degree Interactive Drag Orbit
    let isDraggingShowroom = false;
    let prevPointerX = 0;
    window.addEventListener('pointerdown', (e) => {
      if (this.inShowroom && !e.target.closest('.showroom-bottom-dock') && !e.target.closest('.showroom-top-hud')) {
        isDraggingShowroom = true;
        this.isInteractingShowroom = true;
        prevPointerX = e.clientX;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (this.inShowroom && isDraggingShowroom) {
        const dx = e.clientX - prevPointerX;
        prevPointerX = e.clientX;
        this.showroomAngle = (this.showroomAngle || 0) - dx * 0.008;
      }
    });
    const stopShowroomDrag = () => {
      isDraggingShowroom = false;
      this.isInteractingShowroom = false;
    };
    window.addEventListener('pointerup', stopShowroomDrag);
    window.addEventListener('pointercancel', stopShowroomDrag);

    window.addEventListener('pointerdown', () => audio.ensureContext(), { once: true });
  }

  updateShowroomActiveCar(carIndex) {
    const cfg = CAR_CONFIGS[carIndex] || CAR_CONFIGS[0];
    const nameEl = document.getElementById('showroom-car-name');
    const descEl = document.getElementById('showroom-car-desc');
    if (nameEl) nameEl.textContent = cfg.name.toUpperCase();
    if (descEl) descEl.textContent = cfg.description.toUpperCase();
  }

  openCarShowroom(confirmLabel = '🚀 START RACE') {
    this.inShowroom = true;
    this.showroomAngle = 0;
    this.resetCarToStart();
    document.body.classList.add('in-showroom');
    this.updateShowroomActiveCar(this.selectedCarIndex);
    const garageModal = document.getElementById('garage-selection-modal');
    const confirmBtn = document.getElementById('btn-confirm-garage');
    if (confirmBtn) confirmBtn.textContent = confirmLabel;
    if (garageModal) garageModal.classList.add('active');
  }

  setupUI() {
    // 1. Landing Mode Selection Buttons
    document.getElementById('btn-start-solo-tour').addEventListener('click', () => {
      this.gameMode = 'solo';
      this.soloTourStage = 0;
      this.soloTourTimes = [null, null, null];
      document.getElementById('mode-selection-modal').classList.remove('active');
      this.openCarShowroom('🚀 START 3-MAP TOUR');
    });

    document.getElementById('btn-open-multi-lobby').addEventListener('click', () => {
      this.gameMode = 'multiplayer';
      document.getElementById('mode-selection-modal').classList.remove('active');
      this.openCarShowroom('👥 PROCEED TO LOBBY ❯');
    });

    // 2. Dedicated Visual Car Showroom Actions
    const btnConfirmGarage = document.getElementById('btn-confirm-garage');
    if (btnConfirmGarage) {
      btnConfirmGarage.addEventListener('click', () => {
        document.getElementById('garage-selection-modal').classList.remove('active');
        document.body.classList.remove('in-showroom');
        this.inShowroom = false;
        if (this.gameMode === 'solo') {
          this.soloTourStage = 0;
          this.soloTourTimes = [null, null, null];
          this.switchMap(0);
          this.startRaceSequence();
        } else {
          document.getElementById('lobby-modal').classList.add('active');
        }
      });
    }

    const btnBackGarage = document.getElementById('btn-back-from-garage');
    if (btnBackGarage) {
      btnBackGarage.addEventListener('click', () => {
        document.getElementById('garage-selection-modal').classList.remove('active');
        document.body.classList.remove('in-showroom');
        this.inShowroom = false;
        document.getElementById('mode-selection-modal').classList.add('active');
      });
    }

    // Top Bar Mode & Lobby Buttons
    document.getElementById('open-mode-btn').addEventListener('click', () => {
      this.inShowroom = false;
      document.body.classList.remove('in-showroom');
      document.getElementById('garage-selection-modal').classList.remove('active');
      document.getElementById('lobby-modal').classList.remove('active');
      document.getElementById('mode-selection-modal').classList.add('active');
    });

    document.getElementById('open-lobby-btn').addEventListener('click', () => {
      this.inShowroom = false;
      document.body.classList.remove('in-showroom');
      document.getElementById('garage-selection-modal').classList.remove('active');
      document.getElementById('mode-selection-modal').classList.remove('active');
      this.ensureHostLobbyReady();
      document.getElementById('lobby-modal').classList.add('active');
    });

    document.getElementById('close-lobby-btn').addEventListener('click', () => {
      document.getElementById('lobby-modal').classList.remove('active');
      document.getElementById('mode-selection-modal').classList.add('active');
    });

    document.getElementById('reset-car-btn').addEventListener('click', () => {
      this.resetCarToCheckpoint();
    });

    // Eye Button: Cockpit In-Seat View Toggle
    const cameraBtn = document.getElementById('camera-view-btn');
    const cameraLabel = document.getElementById('camera-view-label');
    const toggleCameraView = () => {
      this.cameraMode = this.cameraMode === 'cockpit' ? 'chase' : 'cockpit';
      if (cameraLabel) {
        cameraLabel.textContent = this.cameraMode === 'cockpit' ? 'Chase Cam' : 'Cockpit';
      }
      if (cameraBtn) {
        cameraBtn.classList.toggle('active-mode', this.cameraMode === 'cockpit');
      }
    };

    if (cameraBtn) {
      cameraBtn.addEventListener('click', toggleCameraView);
    }

    // Keyboard Hotkey V / C for changing camera view
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'v' || e.key === 'V' || e.key === 'c' || e.key === 'C') {
        toggleCameraView();
      }
    });

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      muteBtn.querySelector('span').textContent = audio.muted ? 'Audio: OFF' : 'Audio: ON';
    });

    // Lobby Tabs: Host vs Join
    const tabHost = document.getElementById('tab-host');
    const tabJoin = document.getElementById('tab-join');
    const hostPanel = document.getElementById('host-panel');
    const joinPanel = document.getElementById('join-panel');

    tabHost.addEventListener('click', () => {
      tabHost.classList.add('active');
      tabJoin.classList.remove('active');
      hostPanel.style.display = 'block';
      joinPanel.style.display = 'none';
      this.ensureHostLobbyReady();
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabHost.classList.remove('active');
      joinPanel.style.display = 'block';
      hostPanel.style.display = 'none';
    });

    // Map Selection Cards in Lobby
    document.querySelectorAll('.map-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.map-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const mapId = parseInt(card.dataset.map, 10);
        this.switchMap(mapId);
        if (this.network && this.network.isHost) {
          this.network.selectedMap = mapId;
          this.network.broadcastRoster();
        }
      });
    });

    // Car Selection Cards across Landing, Host, and Join panels
    document.querySelectorAll('.car-card').forEach(card => {
      card.addEventListener('click', () => {
        const carId = parseInt(card.dataset.car, 10);
        this.selectedCarIndex = carId;
        this.car.setCarConfig(carId);
        this.updateShowroomActiveCar(carId);

        // Synchronize all car cards matching this carId
        document.querySelectorAll('.car-card').forEach(c => {
          if (parseInt(c.dataset.car, 10) === carId) c.classList.add('active');
          else c.classList.remove('active');
        });

        if (this.network) {
          const myPlayer = this.network.players.get(this.network.myPeerId);
          if (myPlayer) {
            myPlayer.carIndex = carId;
            this.network.broadcast({
              type: 'CAR_SELECT',
              playerId: this.network.myPeerId,
              carIndex: carId
            });
            this.network.notifyPlayersChanged();
          }
        }
      });
    });

    // 1-Click Copy Invite Link (Rock solid with fallback)
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    copyLinkBtn.addEventListener('click', () => {
      const shareUrl = this.network ? this.network.getShareableLink() : window.location.href;
      
      const onCopied = () => {
        copyFeedback.textContent = '✅ Invite link copied! Share with friends 🏁';
        copyFeedback.style.color = '#22c55e';
        setTimeout(() => { copyFeedback.textContent = ''; }, 4000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(onCopied).catch(() => {
          this.fallbackCopyText(shareUrl);
          onCopied();
        });
      } else {
        this.fallbackCopyText(shareUrl);
        onCopied();
      }
    });

    // Launch Race (Host in Multiplayer)
    document.getElementById('start-race-btn').addEventListener('click', () => {
      this.gameMode = 'multiplayer';
      document.getElementById('lobby-modal').classList.remove('active');
      this.network.broadcast({
        type: 'START_RACE',
        mapIndex: this.activeMapIndex
      });
      this.startRaceSequence();
    });

    // Join Room Button
    document.getElementById('join-room-btn').addEventListener('click', () => {
      const code = document.getElementById('join-room-input').value;
      if (code) {
        this.joinExistingRoom(code);
      }
    });

    // Rematch / Next Lap buttons
    document.getElementById('restart-tour-btn').addEventListener('click', () => {
      document.getElementById('victory-modal').classList.remove('active');
      this.gameMode = 'solo';
      this.soloTourStage = 0;
      this.soloTourTimes = [null, null, null];
      this.switchMap(0);
      this.startRaceSequence();
    });

    document.getElementById('switch-to-multi-btn').addEventListener('click', () => {
      document.getElementById('victory-modal').classList.remove('active');
      this.ensureHostLobbyReady();
      document.getElementById('lobby-modal').classList.add('active');
    });

    // Auto-detect invite link with ?room=
    this.checkUrlInvite();
  }

  fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
    document.body.removeChild(ta);
  }

  checkUrlInvite() {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        document.getElementById('mode-selection-modal').classList.remove('active');
        document.getElementById('garage-selection-modal').classList.remove('active');
        document.getElementById('lobby-modal').classList.add('active');
        document.getElementById('tab-join').click();
        const input = document.getElementById('join-room-input');
        if (input) input.value = room;
        const statusEl = document.getElementById('join-status');
        if (statusEl) {
          statusEl.textContent = `Room ${room} detected! Click Connect or choose car.`;
          statusEl.style.color = '#38bdf8';
        }
      }
    } catch (e) {
      console.warn('Error reading URL search params:', e);
    }
  }

  joinExistingRoom(code) {
    const statusEl = document.getElementById('join-status');
    statusEl.textContent = 'Connecting to room host...';
    statusEl.style.color = '#38bdf8';

    this.network.joinRoom(code, `Player ${Math.floor(Math.random() * 80 + 2)}`, this.selectedCarIndex)
      .then((roomId) => {
        statusEl.textContent = 'Connected successfully! Waiting for host to launch race 🏁';
        statusEl.style.color = '#22c55e';
        document.getElementById('tab-host').click();
      })
      .catch((err) => {
        statusEl.textContent = `Connection failed: ${err.message || 'Room not found'}`;
        statusEl.style.color = '#ef4444';
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
      this.resetCarToStart();
    }

    const forwardVec = new THREE.Vector3(Math.sin(this.car.heading), 0, Math.cos(this.car.heading));
    const behindVec = forwardVec.clone().multiplyScalar(-7.2);
    this.camera.position.copy(this.car.position).add(behindVec).add(new THREE.Vector3(0, 2.8, 0));
    this.cameraTarget.copy(this.car.position).addScaledVector(forwardVec, 8);
    this.camera.lookAt(this.cameraTarget);
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
      particleCount: 220,
      spread: 100,
      origin: { y: 0.6 }
    });

    if (this.gameMode === 'solo') {
      // Record current map time in 3-Map Campaign
      this.soloTourTimes[this.soloTourStage] = this.elapsedTime;

      // Auto-progress to Map 1 and Map 2!
      if (this.soloTourStage < 2) {
        this.showStageTransition(this.soloTourStage);
        return;
      }

      // If finished all 3 stages: show Grand Prix Championship Podium!
      this.showFinalChampionshipPodium();
    } else {
      // Multiplayer Finish
      const myId = this.network.myPeerId;
      const myPlayer = this.network.players.get(myId);
      if (myPlayer) {
        myPlayer.finished = true;
        myPlayer.finishTime = this.elapsedTime;
      }

      // Check if there are more stages in the 3-Map Tour (Map 0 -> Map 1 -> Map 2)
      if (this.multiStage < 2) {
        const nextMapIndex = this.multiStage + 1;
        this.multiStage = nextMapIndex;
        this.finishedStageRacers.add(myId);

        // Move player immediately to the next map's starting grid!
        this.switchMap(nextMapIndex);
        this.resetCarToStart(this.getMySlotIndex());
        this.isCountingDown = true;
        this.car.speed = 0;
        this.car.forwardSpeed = 0;
        this.car.velocity.set(0, 0, 0);

        const nextMapName = nextMapIndex === 1 ? 'TOKYO' : 'VOLCANO';
        this.showWaitingOnGrid(
          `MAP ${nextMapIndex} COMPLETED! 🏁`,
          `ARRIVED AT ${nextMapName} GRID • WAITING FOR RACERS (${this.finishedStageRacers.size}/${this.network.players.size})...`
        );

        this.network.broadcast({
          type: 'STAGE_PROGRESS',
          playerId: myId,
          completedStage: this.multiStage - 1,
          time: this.elapsedTime
        });

        if (this.network.isHost) {
          this.checkAllPlayersStageFinished(nextMapIndex);
        }
        return;
      }

      // If finished all 3 stages: show Grand Prix Championship Podium!
      this.network.broadcast({
        type: 'RACE_FINISH',
        playerId: myId,
        time: this.elapsedTime
      });

      this.refreshPodiumResults();
      setTimeout(() => {
        document.getElementById('victory-modal').classList.add('active');
      }, 1200);
    }
  }

  checkAllPlayersStageFinished(nextMapIndex) {
    if (!this.network || !this.network.isHost) return;
    const totalRacers = this.network.players.size;
    if (this.finishedStageRacers.size >= totalRacers) {
      this.finishedStageRacers.clear();
      setTimeout(() => {
        this.network.broadcast({
          type: 'START_NEXT_STAGE',
          mapIndex: nextMapIndex
        });
        this.hideWaitingOnGrid();
        this.multiStage = nextMapIndex;
        this.switchMap(nextMapIndex);
        this.resetCarToStart(this.getMySlotIndex());
        this.startRaceSequence();
      }, 1600);
    }
  }

  showWaitingOnGrid(title, statusMsg) {
    const banner = document.getElementById('multi-waiting-banner');
    const titleEl = document.getElementById('waiting-banner-title');
    const statusEl = document.getElementById('waiting-banner-status');
    if (titleEl) titleEl.textContent = title;
    if (statusEl) statusEl.textContent = statusMsg;
    if (banner) banner.classList.add('active');
  }

  hideWaitingOnGrid() {
    const banner = document.getElementById('multi-waiting-banner');
    if (banner) banner.classList.remove('active');
  }

  showStageTransition(stageIndex) {
    const modal = document.getElementById('stage-transition-modal');
    const titleEl = document.getElementById('trans-title');
    const timeEl = document.getElementById('trans-time');
    const nextEl = document.getElementById('trans-next');
    const barFill = document.getElementById('trans-bar-fill');

    const nextNames = [
      '🚀 REDIRECTING TO STAGE 2: NEO-TOKYO MIDNIGHT...',
      '🌋 REDIRECTING TO STAGE 3: VOLCANIC INFERNO...'
    ];

    titleEl.textContent = `STAGE ${stageIndex + 1} COMPLETED! 🏁`;
    timeEl.textContent = this.hud.formatTime(this.elapsedTime);
    nextEl.textContent = nextNames[stageIndex];

    barFill.style.transition = 'none';
    barFill.style.width = '0%';

    modal.classList.add('active');

    setTimeout(() => {
      barFill.style.transition = 'width 2.6s linear';
      barFill.style.width = '100%';
    }, 50);

    setTimeout(() => {
      modal.classList.remove('active');
      this.soloTourStage++;
      this.switchMap(this.soloTourStage);
      this.startRaceSequence();
    }, 2800);
  }

  showFinalChampionshipPodium() {
    const modal = document.getElementById('victory-modal');
    const bdownBox = document.getElementById('three-maps-breakdown');
    bdownBox.style.display = 'block';

    const t1 = this.soloTourTimes[0] || 74.2;
    const t2 = this.soloTourTimes[1] || 78.5;
    const t3 = this.soloTourTimes[2] || 82.1;
    const totalTime = t1 + t2 + t3;

    document.getElementById('bdown-map1').textContent = this.hud.formatTime(t1);
    document.getElementById('bdown-map2').textContent = this.hud.formatTime(t2);
    document.getElementById('bdown-map3').textContent = this.hud.formatTime(t3);
    document.getElementById('bdown-total').textContent = this.hud.formatTime(totalTime);

    document.getElementById('podium-badge').textContent = 'GRAND PRIX 3-MAP CHAMPIONSHIP';
    document.getElementById('podium-title').textContent = 'WORLD CHAMPION PODIUM 🏆';

    // Podium rankings based on cumulative total
    const myCarCfg = CAR_CONFIGS[this.selectedCarIndex];
    document.getElementById('gold-name').textContent = 'YOU';
    document.getElementById('gold-time').textContent = this.hud.formatTime(totalTime);
    document.getElementById('gold-car').textContent = myCarCfg.name;

    document.getElementById('silver-name').textContent = 'K. RÄIKKÖNEN';
    document.getElementById('silver-time').textContent = this.hud.formatTime(totalTime + 4.85);
    document.getElementById('silver-car').textContent = 'Pagani Huayra BC';

    document.getElementById('bronze-name').textContent = 'M. VERSTAPPEN';
    document.getElementById('bronze-time').textContent = this.hud.formatTime(totalTime + 9.32);
    document.getElementById('bronze-car').textContent = 'Jesko Absolut';

    // Stats Grid
    document.getElementById('fin-time').textContent = this.hud.formatTime(totalTime);
    document.getElementById('fin-speed').textContent = `${Math.round(this.topSpeedReached * 3.6)} KM/H`;
    document.getElementById('fin-map').textContent = 'ALL 3 MAPS CLEARED';
    document.getElementById('fin-rank').textContent = '1ST GOLD 🏆';

    setTimeout(() => {
      modal.classList.add('active');
    }, 1200);
  }

  refreshPodiumResults() {
    const formattedTime = this.hud.formatTime(this.elapsedTime);
    const topSpeedKmh = Math.round(this.topSpeedReached * 3.6);

    const myCarCfg = CAR_CONFIGS[this.selectedCarIndex];
    const mapCfg = MAP_CONFIGS[this.activeMapIndex];

    const bdownBox = document.getElementById('three-maps-breakdown');
    bdownBox.style.display = 'none';

    let standings = [];
    if (this.network.players.size > 1) {
      standings = Array.from(this.network.players.values()).map(p => ({
        name: p.name,
        car: (CAR_CONFIGS[p.carIndex] || CAR_CONFIGS[0]).name,
        time: p.finishTime ? p.finishTime : (this.elapsedTime + Math.random() * 4 + 1.2),
        isMe: p.id === this.network.myPeerId
      }));
      standings.sort((a, b) => a.time - b.time);
    } else {
      standings = [
        { name: 'YOU', car: myCarCfg.name, time: this.elapsedTime, isMe: true },
        { name: 'K. RÄIKKÖNEN', car: 'Pagani Huayra BC', time: this.elapsedTime + 1.84, isMe: false },
        { name: 'M. VERSTAPPEN', car: 'Jesko Absolut', time: this.elapsedTime + 3.42, isMe: false }
      ];
    }

    const p1 = standings[0] || { name: 'YOU', car: myCarCfg.name, time: this.elapsedTime };
    const p2 = standings[1] || { name: 'RIVAL 1', car: 'Pagani Huayra BC', time: this.elapsedTime + 2.1 };
    const p3 = standings[2] || { name: 'RIVAL 2', car: 'Jesko Absolut', time: this.elapsedTime + 4.5 };

    document.getElementById('gold-name').textContent = p1.name;
    document.getElementById('gold-time').textContent = this.hud.formatTime(p1.time);
    document.getElementById('gold-car').textContent = p1.car;

    document.getElementById('silver-name').textContent = p2.name;
    document.getElementById('silver-time').textContent = this.hud.formatTime(p2.time);
    document.getElementById('silver-car').textContent = p2.car;

    document.getElementById('bronze-name').textContent = p3.name;
    document.getElementById('bronze-time').textContent = this.hud.formatTime(p3.time);
    document.getElementById('bronze-car').textContent = p3.car;

    document.getElementById('fin-time').textContent = formattedTime;
    document.getElementById('fin-speed').textContent = `${topSpeedKmh} KM/H`;
    document.getElementById('fin-map').textContent = mapCfg.badge;

    const myRankIdx = standings.findIndex(s => s.isMe);
    const rankTitles = ['1ST GOLD 🏆', '2ND SILVER 🥈', '3RD BRONZE 🥉', '4TH PLACE', '5TH PLACE', '6TH PLACE'];
    document.getElementById('fin-rank').textContent = rankTitles[myRankIdx >= 0 ? myRankIdx : 0];
  }

  updateCamera(dt) {
    if (this.inShowroom) {
      if (!this.isInteractingShowroom) {
        this.showroomAngle = (this.showroomAngle || 0) + dt * 0.35;
      }
      const dist = 5.4;
      const height = 1.45;
      const cx = this.car.position.x + Math.sin(this.showroomAngle) * dist;
      const cz = this.car.position.z + Math.cos(this.showroomAngle) * dist;
      const cy = this.car.position.y + height;
      this.camera.position.set(cx, cy, cz);
      this.cameraTarget.copy(this.car.position).add(new THREE.Vector3(0, 0.48, 0));
      this.camera.lookAt(this.cameraTarget);
      this.camera.fov = 46;
      this.camera.updateProjectionMatrix();

      if (this.showroomLight) {
        this.showroomLight.visible = true;
        this.showroomLight.position.set(
          this.car.position.x + Math.sin(this.showroomAngle + 0.8) * 6,
          this.car.position.y + 5.5,
          this.car.position.z + Math.cos(this.showroomAngle + 0.8) * 6
        );
        this.showroomLight.target.position.copy(this.car.position);
        this.showroomLight.target.updateMatrixWorld();
      }
      return;
    } else {
      if (this.showroomLight) {
        this.showroomLight.visible = false;
      }
    }

    const carPos = this.car.position;
    const forwardVec = new THREE.Vector3(Math.sin(this.car.heading), 0, Math.cos(this.car.heading));
    const speed = this.car.speed;
    const speedRatio = Math.min(1.2, speed / 139.0);

    if (this.cameraMode === 'cockpit') {
      // 1st-Person In-Seat Cockpit Driver View
      const rightVec = new THREE.Vector3(Math.cos(this.car.heading), 0, -Math.sin(this.car.heading));
      
      // Seated inside cabin on left side, at eye level, looking forward
      const seatPos = carPos.clone()
        .addScaledVector(rightVec, -0.36)
        .addScaledVector(forwardVec, -0.12)
        .add(new THREE.Vector3(0, 0.95, 0));

      // High-speed cockpit vibration sensation at 500+ KM/H
      if (speed > 40) {
        const shake = Math.min(0.018, (speed / 140.0) * 0.012);
        seatPos.x += (Math.random() - 0.5) * shake;
        seatPos.y += (Math.random() - 0.5) * shake;
      }

      this.camera.position.lerp(seatPos, dt * 26);

      const lookAhead = Math.max(16, 10 + speed * 0.35);
      const cockpitTarget = seatPos.clone()
        .addScaledVector(forwardVec, lookAhead)
        .add(new THREE.Vector3(0, -0.06, 0));
      this.cameraTarget.lerp(cockpitTarget, dt * 22);
      this.camera.lookAt(this.cameraTarget);

      const targetFOV = this.car.isNitro ? 88 : (70 + speedRatio * 16);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 8);
      this.camera.updateProjectionMatrix();
    } else {
      // 3rd-Person Chase Camera
      const lookAheadDist = Math.min(28, 6 + speed * 0.28);
      const lookTarget = carPos.clone().addScaledVector(forwardVec, lookAheadDist);
      this.cameraTarget.lerp(lookTarget, dt * 9);

      const behindVec = forwardVec.clone().multiplyScalar(-1);
      const chaseDist = 7.2 + speedRatio * 3.5;
      const chaseHeight = 2.8 + speedRatio * 0.8;

      const desiredCamPos = carPos.clone()
        .addScaledVector(behindVec, chaseDist)
        .add(new THREE.Vector3(0, chaseHeight, 0));

      this.camera.position.lerp(desiredCamPos, dt * 11);
      this.camera.lookAt(this.cameraTarget);

      const targetFOV = this.car.isNitro ? 84 : (62 + speedRatio * 16);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 6);
      this.camera.updateProjectionMatrix();
    }

    const overlay = document.getElementById('speed-overlay');
    if (overlay) {
      if (this.car.isNitro || speed > 100) {
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

    // Dynamic Sunlight tracking car
    if (this.sunLight && this.car) {
      this.sunLight.position.set(this.car.position.x + 60, 65, this.car.position.z - 50);
      this.sunLight.target.position.copy(this.car.position);
      this.sunLight.target.updateMatrixWorld();
    }

    // 1. Timer
    if (!this.raceFinished && !this.isCountingDown && this.raceStartTime) {
      this.elapsedTime = (performance.now() - this.raceStartTime) / 1000;
      this.hud.updateTimer(this.elapsedTime);
    }

    // 2. Car Dynamics: STRICT FREEZE during countdown, showroom, or before race starts!
    if (this.isCountingDown || this.inShowroom || !this.raceStartTime) {
      this.car.velocity.set(0, 0, 0);
      this.car.speed = 0;
      this.car.forwardSpeed = 0;
      this.car.lateralSpeed = 0;
      this.car.group.position.copy(this.car.position);
      this.car.group.rotation.set(0, this.car.heading, 0);
      if (this.car.shadowBlob) {
        this.car.shadowBlob.position.set(this.car.position.x, 0.03, this.car.position.z);
        this.car.shadowBlob.rotation.z = -this.car.heading;
      }
      if (this.car.inputs.forward && this.isCountingDown) {
        this.car.rpm = THREE.MathUtils.lerp(this.car.rpm, 5500, dt * 8);
        audio.updateEngine(this.car.rpm, 0, false);
      } else {
        this.car.rpm = THREE.MathUtils.lerp(this.car.rpm, 1200, dt * 6);
        audio.updateEngine(this.car.rpm, 0, false);
      }
    } else {
      this.car.update(dt, this.track);
      if (this.car.speed > this.topSpeedReached) {
        this.topSpeedReached = this.car.speed;
      }
    }

    // Broadcast 20Hz Telemetry
    const now = performance.now();
    if (now - this.lastTelemetrySend > 50 && this.network) {
      this.lastTelemetrySend = now;
      this.network.sendTelemetry({
        x: this.car.position.x,
        y: this.car.position.y,
        z: this.car.position.z,
        heading: this.car.heading,
        speed: this.car.speed,
        steerAngle: this.car.steerAngle,
        isNitro: this.car.isNitro,
        checkpoint: this.activeCheckpoint
      });
    }

    // Update Remote Opponents
    this.remoteCars.forEach(rc => rc.update(dt));

    // 3. Track Animations
    this.track.update(dt);

    // 4. Checkpoint & Waypoint Arrow
    this.checkCheckpointProgress();

    // 5. High-Speed Camera Follow
    this.updateCamera(dt);

    // 6. Cockpit Cluster & Minimap
    this.hud.updateDashboard(
      this.car.forwardSpeed,
      this.car.rpm,
      this.car.currentGear,
      this.car.isNitro,
      this.car.nitroFuel
    );

    this.hud.drawMinimap(
      this.car.position,
      this.car.heading,
      this.track.checkpoints,
      this.activeCheckpoint
    );

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new ApexRacingGame();
});
