import { Peer } from 'peerjs';

export class NetworkManager {
  constructor(onMessageCallback, onPlayerListUpdate) {
    this.peer = null;
    this.myPeerId = null;
    this.roomId = null;
    this.isHost = false;
    this.connections = new Map(); // peerId -> DataConnection
    this.players = new Map(); // peerId -> { id, name, carIndex, ready, rank }
    this.onMessageCallback = onMessageCallback;
    this.onPlayerListUpdate = onPlayerListUpdate;
    this.broadcastInterval = null;
    this.lastSentStateTime = 0;
  }

  // Initialize PeerJS
  init() {
    return new Promise((resolve, reject) => {
      // Create random short player ID
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      this.peer = new Peer(`apex-${randomSuffix}`, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log('[Multiplayer] Connected to signaling with ID:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[Multiplayer] Peer error:', err);
        // Fallback gracefully if ID collision
        if (err.type === 'unavailable-id') {
          const fallbackId = `apex-${Date.now().toString(36).slice(-5).toUpperCase()}`;
          this.peer = new Peer(fallbackId);
        }
      });
    });
  }

  // Host a new room
  createRoom(playerName = 'Player 1', carIndex = 0, selectedMap = 0) {
    this.isHost = true;
    this.roomId = this.myPeerId;
    this.players.set(this.myPeerId, {
      id: this.myPeerId,
      name: playerName,
      carIndex: carIndex,
      isHost: true,
      ready: true,
      finished: false,
      finishTime: null
    });
    this.selectedMap = selectedMap;
    this.notifyPlayersChanged();
    return this.roomId;
  }

  // Join an existing room by code or link
  joinRoom(targetRoomId, playerName = 'Player 2', carIndex = 1) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      let cleanRoomId = targetRoomId.trim();
      if (!cleanRoomId.startsWith('apex-')) {
        cleanRoomId = `apex-${cleanRoomId}`;
      }
      this.roomId = cleanRoomId;

      console.log(`[Multiplayer] Connecting to host: ${cleanRoomId}...`);
      const conn = this.peer.connect(cleanRoomId, { reliable: true });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out. Check room code.'));
      }, 9000);

      conn.on('open', () => {
        clearTimeout(timeout);
        this.connections.set(cleanRoomId, conn);

        // Send JOIN packet with player info
        conn.send({
          type: 'JOIN',
          playerId: this.myPeerId,
          name: playerName,
          carIndex: carIndex
        });

        this.setupDataListeners(conn);
        resolve(cleanRoomId);
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
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
      console.log(`[Multiplayer] Peer disconnected: ${conn.peer}`);
      this.connections.delete(conn.peer);
      this.players.delete(conn.peer);
      this.notifyPlayersChanged();
      if (this.onMessageCallback) {
        this.onMessageCallback({ type: 'PLAYER_DISCONNECTED', peerId: conn.peer });
      }
    });
  }

  handlePacket(data, conn) {
    switch (data.type) {
      case 'JOIN': {
        if (this.isHost) {
          // Assign carIndex if collision or duplicate
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
            ready: true,
            finished: false,
            finishTime: null
          });

          // Broadcast ROSTER_SYNC to everyone
          this.broadcastRoster();
          this.notifyPlayersChanged();
        }
        break;
      }

      case 'ROSTER_SYNC': {
        this.players.clear();
        data.players.forEach(p => this.players.set(p.id, p));
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
          // Relay to other clients
          this.broadcastExcept(data, conn.peer);
        }
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
  }

  broadcastExcept(packet, excludePeerId) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(packet);
      }
    });
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
      const hostConn = this.connections.get(this.roomId);
      if (hostConn && hostConn.open) {
        hostConn.send(packet);
      }
    }
  }

  notifyPlayersChanged() {
    if (this.onPlayerListUpdate) {
      this.onPlayerListUpdate(Array.from(this.players.values()), this.isHost, this.selectedMap);
    }
  }

  getShareableLink() {
    const url = new URL(window.location.href);
    const roomCode = this.roomId.replace('apex-', '');
    url.searchParams.set('room', roomCode);
    return url.toString();
  }
}
