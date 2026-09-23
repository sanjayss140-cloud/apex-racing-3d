import { Peer } from 'peerjs';

export class NetworkManager {
  constructor(onCodeReady, onPlayerListUpdate, onMessageCallback) {
    this.peer = null;
    // Each browser/tab gets a guaranteed unique peer ID for guest connections
    this.myPeerId = 'apex-p' + Math.floor(100000 + Math.random() * 900000);
    // Default 4-digit room code for host
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
    this.initPromise = null;
    this.pendingReady = undefined;
    this.pendingCarIndex = undefined;

    // Cross-tab local multiplayer channel for instant, reliable local testing
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
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      // Check if URL has ?room= parameter
      let urlRoom = null;
      try {
        if (typeof window !== 'undefined' && window.location && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const r = params.get('room');
          if (r) urlRoom = r.trim().replace(/^apex-/i, '').replace(/[^0-9]/g, '');
        }
      } catch (e) {}

      let targetId;
      if (preferredId) {
        targetId = preferredId.toLowerCase();
      } else if (urlRoom) {
        // Invited guest: Target peer ID MUST be unique guest ID, NOT host's room code!
        this.isHost = false;
        this.displayCode = urlRoom;
        this.roomId = `apex-${urlRoom}`;
        targetId = this.myPeerId;
      } else {
        // Potential Host: use 4-digit code
        targetId = this.roomId.toLowerCase();
      }

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
          if (this.isHost) {
            this.roomId = id;
            const match = id.match(/\d{4}/);
            if (match) this.displayCode = match[0];
          }
          console.log('[Multiplayer] Connected with Peer ID:', id, 'Host Room ID:', this.roomId, 'isHost:', this.isHost);
          if (this.isHost && this.onCodeReady) this.onCodeReady(this.displayCode);
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('[Multiplayer] Signaling warning:', err);
          if (err.type === 'unavailable-id') {
            if (this.isHost) {
              // Generate a fresh unique 4-digit ID for host
              this.displayCode = '' + Math.floor(1000 + Math.random() * 9000);
              this.roomId = `apex-${this.displayCode}`;
              if (this.onCodeReady) this.onCodeReady(this.displayCode);
              this.initPromise = null;
              this.init(this.roomId).then(resolve);
            } else {
              // Guest collided, generate fresh guest ID
              this.myPeerId = 'apex-p' + Math.floor(100000 + Math.random() * 900000);
              this.initPromise = null;
              this.init(this.myPeerId).then(resolve);
            }
          } else {
            resolve(this.displayCode);
          }
        });
      } catch (err) {
        console.error('[Multiplayer] Peer init error:', err);
        resolve(this.displayCode);
      }
    });

    return this.initPromise;
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
  async joinRoom(targetCode, playerName = 'Racer', carIndex = 1) {
    this.isHost = false;
    const digits = (targetCode || '').toString().trim().replace(/^apex-/i, '').replace(/[^0-9]/g, '');
    if (!digits) {
      throw new Error('Invalid 4-digit room code');
    }
    this.displayCode = digits;
    const hostPeerId = `apex-${digits}`;
    this.roomId = hostPeerId;

    await (this.initPromise || this.init());

    const myId = this.myPeerId;

    // Register self locally
    this.players.set(myId, {
      id: myId,
      name: playerName,
      carIndex: carIndex,
      isHost: false,
      ready: this.pendingReady !== undefined ? !!this.pendingReady : false,
      finished: false,
      finishTime: null
    });

    const joinPacket = {
      type: 'JOIN',
      playerId: myId,
      name: playerName,
      carIndex: carIndex
    };

    // Broadcast via BroadcastChannel immediately
    if (this.localChannel) {
      this.localChannel.postMessage({
        room: this.roomId,
        from: myId,
        payload: joinPacket
      });
    }

    // Connect via PeerJS WebRTC
    return new Promise((resolve) => {
      if (!this.peer || this.peer.destroyed) {
        resolve(this.displayCode);
        return;
      }

      try {
        const conn = this.peer.connect(hostPeerId, { reliable: true });

        const timer = setTimeout(() => {
          resolve(this.displayCode);
        }, 5000);

        const onOpen = () => {
          clearTimeout(timer);
          this.connections.set(hostPeerId, conn);
          this.hostConn = conn;
          this.setupDataListeners(conn);
          conn.send(joinPacket);

          // If guest already made a selection or hit ready while connecting, push it immediately!
          if (this.pendingCarIndex !== undefined) {
            conn.send({
              type: 'CAR_SELECT',
              playerId: myId,
              name: playerName,
              carIndex: this.pendingCarIndex
            });
          }
          if (this.pendingReady !== undefined) {
            conn.send({
              type: 'PLAYER_READY',
              playerId: myId,
              name: playerName,
              ready: this.pendingReady
            });
          }

          resolve(this.displayCode);
        };

        if (conn.open) {
          onOpen();
        } else {
          conn.on('open', onOpen);
        }

        this.setupDataListeners(conn);

        conn.on('error', (err) => {
          clearTimeout(timer);
          console.warn('[Multiplayer] Connection warning to host:', err);
          resolve(this.displayCode);
        });
      } catch (e) {
        resolve(this.displayCode);
      }
    });
  }

  handleIncomingConnection(conn) {
    if (this.players.size >= 6) {
      try {
        conn.send({ type: 'ERROR', message: 'Room is full (max 6 players)!' });
        setTimeout(() => conn.close(), 500);
      } catch (e) {}
      return;
    }

    const onOpen = () => {
      this.connections.set(conn.peer, conn);
    };

    if (conn.open) {
      onOpen();
    } else {
      conn.on('open', onOpen);
    }

    this.setupDataListeners(conn);
  }

  setupDataListeners(conn) {
    if (conn._hasApexListeners) return;
    conn._hasApexListeners = true;

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

    conn.on('error', (err) => {
      console.warn('[Multiplayer] DataConnection error with', conn.peer, err);
    });
  }

  handlePacket(data, conn = {}) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'JOIN': {
        if (this.isHost) {
          let assignedCar = data.carIndex !== undefined ? data.carIndex : 1;
          const usedCars = Array.from(this.players.values()).map(p => p.carIndex);
          if (usedCars.includes(assignedCar)) {
            for (let i = 0; i < 6; i++) {
              if (!usedCars.includes(i)) {
                assignedCar = i;
                break;
              }
            }
          }

          const guestId = data.playerId || (conn && (conn.peer || conn.from));
          const existing = this.players.get(guestId);
          this.players.set(guestId, {
            id: guestId,
            name: data.name || (existing ? existing.name : 'Racer'),
            carIndex: assignedCar,
            isHost: false,
            ready: existing ? existing.ready : false,
            finished: false,
            finishTime: null
          });

          this.broadcastRoster();
          this.notifyPlayersChanged();
        }
        break;
      }

      case 'PLAYER_READY': {
        const targetId = data.playerId || (conn && (conn.peer || conn.from));
        let p = this.players.get(targetId);
        if (!p && conn && conn.peer) p = this.players.get(conn.peer);
        if (!p && data.playerId) p = this.players.get(data.playerId);
        if (!p) {
          const guests = Array.from(this.players.values()).filter(x => !x.isHost);
          if (guests.length === 1) {
            p = guests[0];
          } else if (data.name) {
            p = guests.find(x => x.name === data.name);
          }
        }

        if (p) {
          p.ready = !!data.ready;
          console.log(`[Multiplayer] Player ${p.name} (${p.id}) set ready = ${p.ready}`);
          if (this.isHost) {
            this.broadcastRoster();
          }
          this.notifyPlayersChanged();
        } else {
          console.warn('[Multiplayer] PLAYER_READY received for unknown player:', data);
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
        const targetId = data.playerId || (conn && (conn.peer || conn.from));
        let p = this.players.get(targetId);
        if (!p && conn && conn.peer) p = this.players.get(conn.peer);
        if (!p && data.playerId) p = this.players.get(data.playerId);
        if (!p) {
          const guests = Array.from(this.players.values()).filter(x => !x.isHost);
          if (guests.length === 1) {
            p = guests[0];
          } else if (data.name) {
            p = guests.find(x => x.name === data.name);
          }
        }

        if (p) {
          p.carIndex = data.carIndex;
          console.log(`[Multiplayer] Player ${p.name} (${p.id}) selected car ${p.carIndex}`);
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
    this.pendingReady = isReady;
    const myPlayer = this.players.get(this.myPeerId);
    if (myPlayer) {
      myPlayer.ready = isReady;
    }

    const packet = {
      type: 'PLAYER_READY',
      playerId: this.myPeerId,
      name: myPlayer ? myPlayer.name : undefined,
      ready: isReady
    };

    console.log('[Multiplayer] Sending PLAYER_READY:', packet);

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
    this.pendingCarIndex = carIndex;
    const myPlayer = this.players.get(this.myPeerId);
    if (myPlayer) {
      myPlayer.carIndex = carIndex;
    }

    const packet = {
      type: 'CAR_SELECT',
      playerId: this.myPeerId,
      name: myPlayer ? myPlayer.name : undefined,
      carIndex: carIndex
    };

    console.log('[Multiplayer] Sending CAR_SELECT:', packet);

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
