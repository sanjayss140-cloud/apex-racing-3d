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

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || ('ontouchstart' in window);
    this.isMobile = isMobile;
    this.renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFShadowMap;
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

    window.addEventListener('resize', () => this.onResize());
  }

  initEntities() {
    this.track = new Track(this.scene, this.activeMapIndex);
    this.car = new Hypercar(this.scene);
    this.hud = new RacingHUD();

    // Start position aligned on Launch Straight facing Gate 1
    this.car.reset(0, 35, Math.PI);

    // Initial camera position
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

  setupNetwork() {
    this.network = new NetworkManager(
      (data) => this.handleNetworkMessage(data),
      (players, isHost, mapIndex) => this.updateLobbyPlayerList(players, isHost, mapIndex)
    );

    this.network.init().then((myId) => {
      console.log('Peer connected, ID:', myId);
      const hostRoomId = this.network.createRoom('Player 1 (Host)', this.selectedCarIndex, this.activeMapIndex);

      const codeDisplay = document.getElementById('room-code-display');
      if (codeDisplay) {
        codeDisplay.textContent = hostRoomId.replace('apex-', '').toUpperCase();
      }

      // Check URL search params for auto-join
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        // Bypass landing mode selection, go straight to multiplayer join
        document.getElementById('mode-selection-modal').classList.remove('active');
        document.getElementById('lobby-modal').classList.add('active');
        document.getElementById('tab-join').click();
        const joinInput = document.getElementById('join-room-input');
        if (joinInput) joinInput.value = roomParam.toUpperCase();
        this.joinExistingRoom(roomParam);
      }
    });
  }

  handleNetworkMessage(data) {
    switch (data.type) {
      case 'START_RACE': {
        this.gameMode = 'multiplayer';
        if (data.mapIndex !== undefined && data.mapIndex !== this.activeMapIndex) {
          this.switchMap(data.mapIndex);
        }
        document.getElementById('mode-selection-modal').classList.remove('active');
        document.getElementById('lobby-modal').classList.remove('active');
        this.startRaceSequence();
        break;
      }

      case 'TELEMETRY': {
        const rc = this.remoteCars.get(data.playerId);
        if (rc) {
          rc.updateTelemetry(data);
        }
        break;
      }

      case 'PLAYER_DISCONNECTED': {
        const rc = this.remoteCars.get(data.peerId);
        if (rc) {
          rc.destroy();
          this.remoteCars.delete(data.peerId);
        }
        break;
      }

      case 'RACE_FINISH': {
        if (this.raceFinished) {
          this.refreshPodiumResults();
        }
        break;
      }
    }
  }

  updateLobbyPlayerList(players, isHost, selectedMap) {
    const rosterEl = document.getElementById('player-roster');
    const countEl = document.getElementById('player-count');
    if (countEl) countEl.textContent = players.length;

    if (rosterEl) {
      rosterEl.innerHTML = '';
      players.forEach((p) => {
        const carCfg = CAR_CONFIGS[p.carIndex] || CAR_CONFIGS[0];
        const isMe = p.id === this.network.myPeerId;
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
    }

    if (selectedMap !== undefined && selectedMap !== this.activeMapIndex) {
      this.switchMap(selectedMap);
    }
  }

  switchMap(mapIndex) {
    this.activeMapIndex = mapIndex;
    this.track.setMap(mapIndex);
    setMapEnvironment(this.renderer, this.scene, mapIndex);
    this.car.reset(0, 35, Math.PI);
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
    this.isCountingDown = true;
    this.raceFinished = false;
    this.activeCheckpoint = 1;
    this.topSpeedReached = 0;
    this.car.reset(0, 35, Math.PI);
    this.track.highlightCheckpoint(this.activeCheckpoint);

    const stageTitle = this.gameMode === 'solo' ? `STAGE ${this.soloTourStage + 1} / 3` : 'WARMING UP TIRES...';
    this.hud.showPreparingMessage(stageTitle);

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

    window.addEventListener('pointerdown', () => audio.ensureContext(), { once: true });
  }

  setupUI() {
    // 1. Landing Mode Selection Buttons
    document.getElementById('btn-start-solo-tour').addEventListener('click', () => {
      this.gameMode = 'solo';
      this.soloTourStage = 0;
      this.soloTourTimes = [null, null, null];
      document.getElementById('mode-selection-modal').classList.remove('active');
      this.switchMap(0);
      this.startRaceSequence();
    });

    document.getElementById('btn-open-multi-lobby').addEventListener('click', () => {
      this.gameMode = 'multiplayer';
      document.getElementById('mode-selection-modal').classList.remove('active');
      document.getElementById('lobby-modal').classList.add('active');
    });

    // Top Bar Mode & Lobby Buttons
    document.getElementById('open-mode-btn').addEventListener('click', () => {
      document.getElementById('mode-selection-modal').classList.add('active');
    });

    document.getElementById('open-lobby-btn').addEventListener('click', () => {
      document.getElementById('lobby-modal').classList.add('active');
    });

    document.getElementById('close-lobby-btn').addEventListener('click', () => {
      document.getElementById('lobby-modal').classList.remove('active');
      document.getElementById('mode-selection-modal').classList.add('active');
    });

    document.getElementById('reset-car-btn').addEventListener('click', () => {
      this.resetCarToCheckpoint();
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

    // 1-Click Copy Invite Link
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const copyFeedback = document.getElementById('copy-feedback');
    copyLinkBtn.addEventListener('click', () => {
      const shareUrl = this.network.getShareableLink();
      navigator.clipboard.writeText(shareUrl).then(() => {
        copyFeedback.textContent = 'Link copied to clipboard! Share with up to 5 friends 📋';
        setTimeout(() => { copyFeedback.textContent = ''; }, 4000);
      }).catch(() => {
        copyFeedback.textContent = shareUrl;
      });
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
      document.getElementById('lobby-modal').classList.add('active');
    });
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
      this.car.reset(0, 35, Math.PI);
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
      const myPlayer = this.network.players.get(this.network.myPeerId);
      if (myPlayer) {
        myPlayer.finished = true;
        myPlayer.finishTime = this.elapsedTime;
      }

      this.network.broadcast({
        type: 'RACE_FINISH',
        playerId: this.network.myPeerId,
        time: this.elapsedTime
      });

      this.refreshPodiumResults();
      setTimeout(() => {
        document.getElementById('victory-modal').classList.add('active');
      }, 1200);
    }
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
    document.getElementById('silver-car').textContent = 'Huracán STO';

    document.getElementById('bronze-name').textContent = 'M. VERSTAPPEN';
    document.getElementById('bronze-time').textContent = this.hud.formatTime(totalTime + 9.32);
    document.getElementById('bronze-car').textContent = 'Chiron Super Sport';

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
        { name: 'K. RÄIKKÖNEN', car: 'Huracán STO', time: this.elapsedTime + 1.84, isMe: false },
        { name: 'M. VERSTAPPEN', car: 'Chiron Super Sport', time: this.elapsedTime + 3.42, isMe: false }
      ];
    }

    const p1 = standings[0] || { name: 'YOU', car: myCarCfg.name, time: this.elapsedTime };
    const p2 = standings[1] || { name: 'RIVAL 1', car: 'Huracán STO', time: this.elapsedTime + 2.1 };
    const p3 = standings[2] || { name: 'RIVAL 2', car: 'Chiron SS', time: this.elapsedTime + 4.5 };

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
    const carPos = this.car.position;
    const forwardVec = new THREE.Vector3(Math.sin(this.car.heading), 0, Math.cos(this.car.heading));
    const speed = this.car.speed;

    const lookAheadDist = Math.min(28, 6 + speed * 0.28);
    const lookTarget = carPos.clone().addScaledVector(forwardVec, lookAheadDist);
    this.cameraTarget.lerp(lookTarget, dt * 9);

    const behindVec = forwardVec.clone().multiplyScalar(-1);
    const speedRatio = Math.min(1.2, speed / 139.0);
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

    // 1. Timer
    if (!this.raceFinished && !this.isCountingDown && this.raceStartTime) {
      this.elapsedTime = (performance.now() - this.raceStartTime) / 1000;
      this.hud.updateTimer(this.elapsedTime);
    }

    // 2. Car Dynamics with Smooth Non-Jitter Lane Clamping (500+ KM/H)
    this.car.update(dt, this.track);
    if (this.car.speed > this.topSpeedReached) {
      this.topSpeedReached = this.car.speed;
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
