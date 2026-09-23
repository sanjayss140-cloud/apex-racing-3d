import { Peer } from 'peerjs';

export class NetworkManager {
  constructor(onCodeReady, onPlayerListUpdate, onMessageCallback) {
    this.peer = null;
    this.myPeerId = null;
    // Pure 4-digit room code, e.g. 4936
    this.displayCode = '' + Math.floor(1000 + Math.random() * 9000);
    this.roomId = `apex-${this.displayCode}`;
    this.isHost = false;
    this.connections = new Map(); // peerId -> DataConnection
    this.hostConn = null;
    this.players = new Map();     // peerId -> playerObject
    this.onCodeReady = onCodeReady;
    this.onPlayerListUpdate = onPlayerListUpdate;
    this.onMessageCallback = onMessageCallback;
    this.selectedMap = 0;
    this.localChannel = null;

    // Cross-tab local multiplayer channel for instant reliable testing
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.localChannel = new BroadcastChannel('apex_rush_mp');
        this.localChannel.onmessage = (event) => {
          if (event.data && event.data.room === this.roomId && event.data.from !== this.myPeerId) {
            this.handlePacket(event.data.payload, { peer: event.data.from, from: event.data.from, isLocal: true });
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }
  }

  // Initialize PeerJS signaling
  init(preferredId = null) {
    return new Promise((resolve) => {
      const targetId = (preferredId || this.roomId).toLowerCase();
      try {
        this.peer = new Peer(targetId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          this.roomId = id;
          const match = id.match(/\d{4}/);
          if (match) {
            this.displayCode = match[0];
          }
          console.log('[Multiplayer] Connected with Peer ID:', id, 'Code:', this.displayCode);
          if (this.onCodeReady) this.onCodeReady(this.displayCode);
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('[Multiplayer] Signaling warning:', err);
          if (err.type === 'unavailable-id') {
            // Generate a fresh unique 4-digit ID
            this.displayCode = '' + Math.floor(1000 + Math.random() * 9000);
            this.roomId = `apex-${this.displayCode}`;
            if (this.onCodeReady) this.onCodeReady(this.displayCode);
            this.init(this.roomId).then(resolve);
          } else {
            if (this.onCodeReady) this.onCodeReady(this.displayCode);
            resolve(this.displayCode);
          }
        });
      } catch (err) {
        console.error('[Multiplayer] Peer init error:', err);
        if (this.onCodeReady) this.onCodeReady(this.displayCode);
        resolve(this.displayCode);
      }
    });
  }

  // Host a room
  createRoom(playerName = 'Host', carIndex = 0, selectedMap = 0) {
    this.isHost = true;
    const hostId = this.myPeerId || this.roomId;
    this.players.clear();
    this.players.set(hostId, {
      id: hostId,
      name: playerName,
      carIndex: carIndex,
      isHost: true,
      ready: true,
      finished: false,
      finishTime: null
    });
    this.selectedMap = selectedMap;
    if (this.onCodeReady) this.onCodeReady(this.displayCode);
    this.notifyPlayersChanged();
    return this.displayCode;
  }

  // Join a room by code
  joinRoom(targetCode, playerName = 'Racer', carIndex = 1) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      const digits = (targetCode || '').toString().trim().replace(/^apex-/i, '').replace(/[^0-9]/g, '');
      if (!digits) {
        reject(new Error('Invalid 4-digit room code'));
        return;
      }
      this.displayCode = digits;
      const hostPeerId = `apex-${digits}`;
      this.roomId = hostPeerId;

      const myId = this.myPeerId || `apex-p${Math.floor(100 + Math.random() * 900)}`;
      this.myPeerId = myId;

      // Register self locally
      this.players.set(myId, {
        id: myId,
        name: playerName,
        carIndex: carIndex,
        isHost: false,
        ready: false,
        finished: false,
        finishTime: null
      });

      // Broadcast via BroadcastChannel if local
      if (this.localChannel) {
        this.localChannel.postMessage({
          room: this.roomId,
          from: myId,
          payload: {
            type: 'JOIN',
            playerId: myId,
            name: playerName,
            carIndex: carIndex
          }
        });
      }

      // Connect via PeerJS WebRTC
      if (this.peer && !this.peer.destroyed) {
        try {
          const conn = this.peer.connect(hostPeerId, { reliable: true });

          const timer = setTimeout(() => {
            if (this.localChannel) {
              resolve(this.displayCode);
            } else {
              reject(new Error('Connection timed out. Check room code.'));
            }
          }, 7000);

          conn.on('open', () => {
            clearTimeout(timer);
            this.connections.set(hostPeerId, conn);
            this.hostConn = conn;
            conn.send({
              type: 'JOIN',
              playerId: myId,
              name: playerName,
              carIndex: carIndex
            });
            this.setupDataListeners(conn);
            resolve(this.displayCode);
          });

          conn.on('error', (err) => {
            clearTimeout(timer);
            if (!this.localChannel) reject(err);
          });
        } catch (e) {
          if (this.localChannel) resolve(this.displayCode);
          else reject(e);
        }
      } else {
        resolve(this.displayCode);
      }
    });
  }

  handleIncomingConnection(conn) {
    if (this.players.size >= 6) {
      conn.send({ type: 'ERROR', message: 'Room is full (max 6 players)!' });
      setTimeout(() => conn.close(), 500);
      return;
    }

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.setupDataListeners(conn);
    });
  }

  setupDataListeners(conn) {
    conn.on('data', (data) => {
      this.handlePacket(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.players.delete(conn.peer);
      this.notifyPlayersChanged();
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'PLAYER_DISCONNECTED', peerId: conn.peer });
      }
    });
  }

  handlePacket(data, conn = {}) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'JOIN': {
        if (this.isHost) {
          let assignedCar = data.carIndex;
          const usedCars = Array.from(this.players.values()).map(p => p.carIndex);
          if (usedCars.includes(assignedCar)) {
            for (let i = 0; i < 6; i++) {
              if (!usedCars.includes(i)) {
                assignedCar = i;
                break;
              }
            }
          }

          this.players.set(data.playerId, {
            id: data.playerId,
            name: data.name,
            carIndex: assignedCar,
            isHost: false,
            ready: false,
            finished: false,
            finishTime: null
          });

          this.broadcastRoster();
          this.notifyPlayersChanged();
        }
        break;
      }

      case 'PLAYER_READY': {
        const p = this.players.get(data.playerId);
        if (p) {
          p.ready = !!data.ready;
          if (this.isHost) {
            this.broadcastRoster();
          }
          this.notifyPlayersChanged();
        }
        break;
      }

      case 'ROSTER_SYNC': {
        this.players.clear();
        if (Array.isArray(data.players)) {
          data.players.forEach(p => this.players.set(p.id, p));
        }
        if (data.mapIndex !== undefined) {
          this.selectedMap = data.mapIndex;
        }
        this.notifyPlayersChanged();
        break;
      }

      case 'CAR_SELECT': {
        const player = this.players.get(data.playerId);
        if (player) {
          player.carIndex = data.carIndex;
          if (this.isHost) {
            this.broadcastRoster();
          }
          this.notifyPlayersChanged();
        }
        break;
      }

      case 'START_RACE': {
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
        break;
      }

      case 'TELEMETRY': {
        if (this.isHost) {
          const fromPeer = conn.peer || conn.from;
          if (fromPeer) {
            this.broadcastExcept(data, fromPeer);
          }
        }
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
        break;
      }

      case 'STAGE_PROGRESS': {
        if (this.isHost) {
          this.broadcast(data);
        }
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
        break;
      }

      case 'START_NEXT_STAGE': {
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
        break;
      }

      case 'RACE_FINISH': {
        const p = this.players.get(data.playerId);
        if (p) {
          p.finished = true;
          p.finishTime = data.time;
          p.rank = data.rank;
        }
        if (this.isHost) {
          this.broadcast(data);
        }
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
        break;
      }

      default:
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
    }
  }

  sendReady(isReady = true) {
    const myPlayer = this.players.get(this.myPeerId);
    if (myPlayer) {
      myPlayer.ready = isReady;
    }

    const packet = {
      type: 'PLAYER_READY',
      playerId: this.myPeerId,
      ready: isReady
    };

    if (this.isHost) {
      this.broadcastRoster();
      this.notifyPlayersChanged();
    } else {
      if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(packet);
      }
      this.connections.forEach((conn) => {
        if (conn.open) conn.send(packet);
      });
      if (this.localChannel) {
        this.localChannel.postMessage({
          room: this.roomId,
          from: this.myPeerId,
          payload: packet
        });
      }
    }
  }

  sendCarSelection(carIndex) {
    const myPlayer = this.players.get(this.myPeerId);
    if (myPlayer) {
      myPlayer.carIndex = carIndex;
    }

    const packet = {
      type: 'CAR_SELECT',
      playerId: this.myPeerId,
      carIndex: carIndex
    };

    if (this.isHost) {
      this.broadcastRoster();
      this.notifyPlayersChanged();
    } else {
      if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(packet);
      }
      this.connections.forEach((conn) => {
        if (conn.open) conn.send(packet);
      });
      if (this.localChannel) {
        this.localChannel.postMessage({
          room: this.roomId,
          from: this.myPeerId,
          payload: packet
        });
      }
    }
  }

  broadcastRoster() {
    const packet = {
      type: 'ROSTER_SYNC',
      mapIndex: this.selectedMap,
      players: Array.from(this.players.values())
    };
    this.broadcast(packet);
  }

  broadcast(packet) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(packet);
      }
    });

    if (this.localChannel) {
      try {
        this.localChannel.postMessage({
          room: this.roomId,
          from: this.myPeerId,
          payload: packet
        });
      } catch (e) {
        // ignore
      }
    }
  }

  broadcastExcept(packet, excludePeerId) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(packet);
      }
    });
    if (this.localChannel) {
      this.localChannel.postMessage({
        room: this.roomId,
        from: excludePeerId,
        payload: packet
      });
    }
  }

  sendTelemetry(telemetry) {
    const packet = {
      type: 'TELEMETRY',
      playerId: this.myPeerId,
      ...telemetry
    };

    if (this.isHost) {
      this.broadcast(packet);
    } else {
      if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(packet);
      }
      this.connections.forEach((conn) => {
        if (conn.open) {
          conn.send(packet);
        }
      });
    }

    if (this.localChannel) {
      this.localChannel.postMessage({
        room: this.roomId,
        from: this.myPeerId,
        payload: packet
      });
    }
  }

  notifyPlayersChanged() {
    if (this.onPlayerListUpdate) {
      this.onPlayerListUpdate(Array.from(this.players.values()), this.isHost, this.selectedMap);
    }
  }

  getShareableLink() {
    const url = new URL(window.location.href);
    const cleanCode = (this.displayCode || '4936').replace(/^apex-/i, '').replace(/[^0-9]/g, '');
    url.searchParams.set('room', cleanCode);
    return url.toString();
  }
}
