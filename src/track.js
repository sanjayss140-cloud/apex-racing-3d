import * as THREE from 'three';
import {
  getSandstoneTexture,
  getHieroglyphTexture,
  getTravertineTexture,
  getTokyoBuildingTexture,
  getStadiumRibbonTexture,
  getSpectatorCrowdTexture,
  getMountainRockTexture
} from './wonderTextures.js';
import {
  buildCyberExpresswayMap,
  buildVolcanicInfernoMap
} from './extraMaps.js';

export const MAP_CONFIGS = [
  {
    id: 0,
    name: '7 Wonders Grand Tour',
    badge: 'WORLD WONDERS',
    circuitLength: '1.8 KM',
    splinePoints: [
      new THREE.Vector3(0, 0, 180),        // Launch & Finish Straight (Tokyo)
      new THREE.Vector3(130, 0, 160),      // Tokyo Strip
      new THREE.Vector3(230, 0, 90),       // Pacific Ocean Highway
      new THREE.Vector3(270, 0, -20),      // Tropical Beach Curve
      new THREE.Vector3(220, 0, -140),     // Cyber Hyper-Tunnel Entrance
      new THREE.Vector3(130, 0, -220),     // Cyber Tunnel Exit
      new THREE.Vector3(0, 0, -250),       // Alpine Canyon Entry
      new THREE.Vector3(-130, 0, -230),    // Alpine Summit Pass
      new THREE.Vector3(-240, 0, -150),    // Giza Desert Dunes
      new THREE.Vector3(-310, 0, -30),     // Great Sphinx
      new THREE.Vector3(-280, 0, 90),      // Approach to Colosseum
      new THREE.Vector3(-190, 0, 180),     // Roman Forum
      new THREE.Vector3(-90, 0, 200)       // Olympic Victory Stadium Approach
    ],
    checkpoints: [
      { id: 1, name: 'TOKYO METROPOLIS', wonder: 'WONDER 01: NEO-TOKYO SPEEDWAY', color: '#00f0ff', roadIdx: 50 },
      { id: 2, name: 'PACIFIC COAST', wonder: 'WONDER 02: TROPICAL PARADISE BEACH', color: '#10b981', roadIdx: 135 },
      { id: 3, name: 'HYPER TUNNEL', wonder: 'WONDER 03: CYBER NEON LASER TUBE', color: '#d946ef', roadIdx: 220 },
      { id: 4, name: 'ALPINE SUMMIT', wonder: 'WONDER 04: MOUNTAIN CLIMB & CANYON', color: '#38bdf8', roadIdx: 320 },
      { id: 5, name: 'GIZA PYRAMIDS', wonder: 'WONDER 05: GREAT PYRAMIDS & SPHINX', color: '#f59e0b', roadIdx: 410 },
      { id: 6, name: 'ROMAN COLOSSEUM', wonder: 'WONDER 06: IMPERIAL ROMAN FORUM', color: '#eab308', roadIdx: 500 },
      { id: 7, name: 'VICTORY GRAND PRIX', wonder: 'WONDER 07: WORLD CHAMPIONSHIP FINISH', color: '#ef4444', roadIdx: 585 }
    ]
  },
  {
    id: 1,
    name: 'Neo-Tokyo Midnight Expressway',
    badge: 'CYBER METROPOLIS',
    circuitLength: '2.0 KM',
    splinePoints: [
      new THREE.Vector3(0, 0, 200),        // Shibuya Skyway Start
      new THREE.Vector3(140, 0, 180),      // Ginza Glass Towers
      new THREE.Vector3(260, 0, 100),      // Akihabara Strip
      new THREE.Vector3(300, 0, -30),      // Tokyo Bay Tunnel Entrance
      new THREE.Vector3(250, 0, -160),     // Underwater Glass Tube
      new THREE.Vector3(140, 0, -250),     // Tunnel Exit
      new THREE.Vector3(0, 0, -280),       // Odaiba Rainbow Bridge
      new THREE.Vector3(-140, 0, -250),    // Cable Bridge Span
      new THREE.Vector3(-260, 0, -160),    // Roppongi Canyon
      new THREE.Vector3(-320, 0, -30),     // Mega-Skyscraper Pass
      new THREE.Vector3(-280, 0, 100),     // Cyber Arena Approach
      new THREE.Vector3(-180, 0, 190),     // Arena Turn Arc
      new THREE.Vector3(-80, 0, 210)       // Final Straight
    ],
    checkpoints: [
      { id: 1, name: 'SHIBUYA SKYWAY', wonder: 'SECTOR 01: SHIBUYA NEON FLYOVER', color: '#00f0ff', roadIdx: 50 },
      { id: 2, name: 'GINZA SPEEDWAY', wonder: 'SECTOR 02: GINZA GLASS TOWERS', color: '#38bdf8', roadIdx: 135 },
      { id: 3, name: 'AKIHABARA ALLEY', wonder: 'SECTOR 03: CYBER ANIME STRIP', color: '#ec4899', roadIdx: 220 },
      { id: 4, name: 'TOKYO BAY TUNNEL', wonder: 'SECTOR 04: UNDERWATER GLASS TUBE', color: '#06b6d4', roadIdx: 320 },
      { id: 5, name: 'ODAIBA RAINBOW', wonder: 'SECTOR 05: RAINBOW CABLE BRIDGE', color: '#a855f7', roadIdx: 410 },
      { id: 6, name: 'ROPPONGI CANYON', wonder: 'SECTOR 06: MEGA-SKYSCRAPER PASS', color: '#eab308', roadIdx: 500 },
      { id: 7, name: 'APEX ARENA FINISH', wonder: 'SECTOR 07: CYBER ARENA PODIUM', color: '#ef4444', roadIdx: 585 }
    ]
  },
  {
    id: 2,
    name: 'Volcanic Inferno & Obsidian Badlands',
    badge: 'MOLTEN BADLANDS',
    circuitLength: '2.2 KM',
    splinePoints: [
      new THREE.Vector3(0, 0, 210),        // Caldera Rim Start
      new THREE.Vector3(150, 0, 190),      // Molten Falls High-Speed Strip
      new THREE.Vector3(270, 0, 110),      // Magma Cascade
      new THREE.Vector3(310, 0, -20),      // Obsidian Canyon Chasm
      new THREE.Vector3(260, 0, -150),     // Basalt Arch
      new THREE.Vector3(150, 0, -240),     // Geyser Basin
      new THREE.Vector3(0, 0, -270),       // Steam & Sulfur Vents
      new THREE.Vector3(-150, 0, -240),    // Crimson Gorge Chute
      new THREE.Vector3(-270, 0, -150),    // Red Rock Pass
      new THREE.Vector3(-320, 0, -20),     // Subterranean Lava River
      new THREE.Vector3(-280, 0, 110),     // Magma Tube Exit
      new THREE.Vector3(-180, 0, 200),     // Pyramid of Fire Summit
      new THREE.Vector3(-80, 0, 220)       // Caldera Final Straight
    ],
    checkpoints: [
      { id: 1, name: 'CALDERA LAUNCH', wonder: 'SECTOR 01: ACTIVE VOLCANO RIM', color: '#f97316', roadIdx: 50 },
      { id: 2, name: 'MOLTEN LAVA FALLS', wonder: 'SECTOR 02: 80M MAGMA CASCADE', color: '#ef4444', roadIdx: 135 },
      { id: 3, name: 'OBSIDIAN ARCH', wonder: 'SECTOR 03: BASALT CHASM BRIDGE', color: '#fb923c', roadIdx: 220 },
      { id: 4, name: 'GEYSER BASIN', wonder: 'SECTOR 04: STEAM & SULFUR VENTS', color: '#facc15', roadIdx: 320 },
      { id: 5, name: 'CRIMSON GORGE', wonder: 'SECTOR 05: RED ROCK HIGH-SPEED CHUTE', color: '#ea580c', roadIdx: 410 },
      { id: 6, name: 'MAGMA TUBE CAVERN', wonder: 'SECTOR 06: SUBTERRANEAN LAVA RIVER', color: '#dc2626', roadIdx: 500 },
      { id: 7, name: 'INFERNO SUMMIT', wonder: 'SECTOR 07: PYRAMID OF FIRE FINISH', color: '#fbbf24', roadIdx: 585 }
    ]
  }
];

export class Track {
  constructor(scene, initialMap = 0) {
    this.scene = scene;
    this.mapIndex = initialMap;
    this.roadWidth = 24.0;
    this.roadHalfWidth = this.roadWidth / 2; // 12.0m
    this.pointsCount = 600;

    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);

    this.checkpointMeshes = [];
    this.pulsingGates = [];
    this.animatedProps = [];

    this.setMap(initialMap);
  }

  addToTrack(obj) {
    this.trackGroup.add(obj);
  }

  setMap(mapIndex = 0) {
    this.mapIndex = Math.max(0, Math.min(mapIndex, MAP_CONFIGS.length - 1));
    const cfg = MAP_CONFIGS[this.mapIndex];

    // Clear previous map objects
    while (this.trackGroup.children.length > 0) {
      const child = this.trackGroup.children[0];
      this.trackGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    this.checkpointMeshes = [];
    this.pulsingGates = [];
    this.animatedProps = [];

    // Initialize spline
    this.trackPoints = cfg.splinePoints;
    this.curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    this.curve.tension = 0.5;
    this.roadPoints = this.curve.getSpacedPoints(this.pointsCount);

    // Initialize checkpoints
    this.checkpoints = cfg.checkpoints.map(cp => ({
      ...cp,
      pos: this.roadPoints[cp.roadIdx].clone(),
      rotation: this.getHeadingAt(cp.roadIdx),
      radius: 24.0
    }));

    if (this.mapIndex === 1) {
      buildCyberExpresswayMap(this);
      this.buildCheckpointGates();
    } else if (this.mapIndex === 2) {
      buildVolcanicInfernoMap(this);
      this.buildCheckpointGates();
    } else {
      this.buildWorldTerrain();
      this.buildRacetrack();
      this.buildWonderMetropolis();
      this.buildWonderMountains();
      this.buildWonderPyramids();
      this.buildWonderColosseum();
      this.buildWonderBeach();
      this.buildWonderCyberTunnel();
      this.buildWonderVictoryStadium();
      this.buildCheckpointGates();
    }
  }

  getTangentAt(idx) {
    const nextIdx = (idx + 1) % this.pointsCount;
    const prevIdx = (idx - 1 + this.pointsCount) % this.pointsCount;
    return this.roadPoints[nextIdx].clone().sub(this.roadPoints[prevIdx]).normalize();
  }

  getNormalAt(idx) {
    const tangent = this.getTangentAt(idx);
    return new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  }

  getHeadingAt(idx) {
    const tangent = this.getTangentAt(idx);
    return Math.atan2(tangent.x, tangent.z);
  }

  getDistToTrack(x, z) {
    let minDist = Infinity;
    for (let i = 0; i < this.roadPoints.length; i += 3) {
      const pt = this.roadPoints[i];
      const d = Math.hypot(x - pt.x, z - pt.z);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  buildWorldTerrain() {
    // 1. Tropical Azure Ocean (Deep sapphire with specular surface)
    const oceanGeo = new THREE.PlaneGeometry(1800, 1800);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.85,
      envMapIntensity: 2.0
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(260, -1.2, 340);
    this.addToTrack(ocean);

    // 2. Base Continental Landmass (Atmospheric Twilight Ground)
    const landGeo = new THREE.PlaneGeometry(1600, 1600);
    landGeo.rotateX(-Math.PI / 2);
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x0e1726,
      roughness: 0.92,
      metalness: 0.05
    });
    const land = new THREE.Mesh(landGeo, landMat);
    land.position.y = -0.06;
    land.receiveShadow = true;
    this.addToTrack(land);

    // 3. Sahara Desert Plateau (Textured with sandstone blocks and sand dunes)
    const desertMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.88,
      metalness: 0.05
    });
    const desertBase = new THREE.Mesh(new THREE.CircleGeometry(320, 48), desertMat);
    desertBase.rotateX(-Math.PI / 2);
    desertBase.position.set(-360, -0.04, -40);
    desertBase.receiveShadow = true;
    this.addToTrack(desertBase);

    // Rolling 3D Sand Dunes framing the desert roadway
    const duneMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.95,
      metalness: 0.02
    });
    const duneCoords = [
      { x: -360, z: -140, rx: 70, rz: 110, h: 18 },
      { x: -440, z: -60,  rx: 85, rz: 130, h: 22 },
      { x: -330, z: 120,  rx: 65, rz: 95,  h: 15 },
      { x: -420, z: 80,   rx: 80, rz: 120, h: 20 },
      { x: -220, z: -110, rx: 45, rz: 70,  h: 12 }
    ];
    duneCoords.forEach(d => {
      const dist = this.getDistToTrack(d.x, d.z);
      if (dist > this.roadHalfWidth + 16.0) {
        const dune = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), duneMat);
        dune.scale.set(d.rx, d.h, d.rz);
        dune.position.set(d.x, 0, d.z);
        dune.receiveShadow = true;
        this.addToTrack(dune);
      }
    });

    // 4. Pacific Beach Golden Shoreline
    const beachGeo = new THREE.PlaneGeometry(380, 240);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.9,
      metalness: 0.05
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(90, -0.02, 280);
    beach.receiveShadow = true;
    this.addToTrack(beach);
  }

  buildRacetrack() {
    const pointsCount = this.pointsCount;
    const roadPoints = this.roadPoints;

    const vertices = [];
    const uvs = [];
    const indices = [];

    const curbVertsL = [];
    const curbVertsR = [];
    const curbUvs = [];
    const curbIndices = [];

    for (let i = 0; i <= pointsCount; i++) {
      const idx = i % pointsCount;
      const pt = roadPoints[idx];
      const normal = this.getNormalAt(idx);

      const leftPt = pt.clone().addScaledVector(normal, -this.roadHalfWidth);
      const rightPt = pt.clone().addScaledVector(normal, this.roadHalfWidth);

      vertices.push(leftPt.x, 0.05, leftPt.z);
      vertices.push(rightPt.x, 0.05, rightPt.z);

      const vProgress = (i / pointsCount) * 120;
      uvs.push(0, vProgress);
      uvs.push(1, vProgress);

      if (i < pointsCount) {
        const b = i * 2;
        indices.push(b, b + 1, b + 2);
        indices.push(b + 1, b + 3, b + 2);
      }

      // High-G Red/White Curbs
      const curbOuterL = leftPt.clone().addScaledVector(normal, -1.2);
      curbVertsL.push(curbOuterL.x, 0.12, curbOuterL.z);
      curbVertsL.push(leftPt.x, 0.05, leftPt.z);

      const curbOuterR = rightPt.clone().addScaledVector(normal, 1.2);
      curbVertsR.push(rightPt.x, 0.05, rightPt.z);
      curbVertsR.push(curbOuterR.x, 0.12, curbOuterR.z);

      const curbProg = (i / pointsCount) * 200;
      curbUvs.push(0, curbProg);
      curbUvs.push(1, curbProg);

      if (i < pointsCount) {
        const cb = i * 2;
        curbIndices.push(cb, cb + 1, cb + 2);
        curbIndices.push(cb + 1, cb + 3, cb + 2);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#222634' : '#0f1117';
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(32, 1024);
    ctx.moveTo(1024 - 32, 0);
    ctx.lineTo(1024 - 32, 1024);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.setLineDash([52, 44]);
    ctx.beginPath();
    ctx.moveTo(355, 0);
    ctx.lineTo(355, 1024);
    ctx.moveTo(669, 0);
    ctx.lineTo(669, 1024);
    ctx.stroke();

    const roadTex = new THREE.CanvasTexture(canvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.65,
      metalness: 0.2
    });

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.addToTrack(roadMesh);

    const curbCanvas = document.createElement('canvas');
    curbCanvas.width = 128;
    curbCanvas.height = 256;
    const cctx = curbCanvas.getContext('2d');
    cctx.fillStyle = '#ef4444';
    cctx.fillRect(0, 0, 128, 128);
    cctx.fillStyle = '#f8fafc';
    cctx.fillRect(0, 128, 128, 128);

    const curbTex = new THREE.CanvasTexture(curbCanvas);
    curbTex.wrapS = THREE.RepeatWrapping;
    curbTex.wrapT = THREE.RepeatWrapping;

    const curbMat = new THREE.MeshStandardMaterial({
      map: curbTex,
      roughness: 0.35,
      metalness: 0.15
    });

    const curbGeoL = new THREE.BufferGeometry();
    curbGeoL.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsL, 3));
    curbGeoL.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
    curbGeoL.setIndex(curbIndices);
    curbGeoL.computeVertexNormals();
    this.addToTrack(new THREE.Mesh(curbGeoL, curbMat));

    const curbGeoR = new THREE.BufferGeometry();
    curbGeoR.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsR, 3));
    curbGeoR.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
    curbGeoR.setIndex(curbIndices);
    curbGeoR.computeVertexNormals();
    this.addToTrack(new THREE.Mesh(curbGeoR, curbMat));

    this.buildContinuousArmcoGuardrails(roadPoints, this.roadHalfWidth + 1.5);
  }

  buildContinuousArmcoGuardrails(points, offsetDist, isNeon = false, isMagma = false) {
    const postMat = new THREE.MeshStandardMaterial({
      color: isMagma ? 0x261414 : (isNeon ? 0x0f172a : 0x475569),
      metalness: 0.85,
      roughness: 0.25
    });

    let railMat;
    if (isNeon) {
      railMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.1
      });
    } else if (isMagma) {
      railMat = new THREE.MeshStandardMaterial({
        color: 0xea580c,
        emissive: 0xef4444,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.3
      });
    } else {
      railMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.2
      });
    }


    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8);
    const postCount = Math.floor(points.length / 3) * 2;
    const postInst = new THREE.InstancedMesh(postGeo, postMat, postCount);
    const dummy = new THREE.Object3D();
    let pIdx = 0;

    const railLVerts = [];
    const railRVerts = [];
    const railIndices = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const normal = this.getNormalAt(i);

      const pL = pt.clone().addScaledVector(normal, -offsetDist);
      const pR = pt.clone().addScaledVector(normal, offsetDist);

      if (i % 3 === 0 && pIdx < postCount) {
        dummy.position.set(pL.x, 0.7, pL.z);
        dummy.updateMatrix();
        postInst.setMatrixAt(pIdx++, dummy.matrix);

        dummy.position.set(pR.x, 0.7, pR.z);
        dummy.updateMatrix();
        postInst.setMatrixAt(pIdx++, dummy.matrix);
      }

      railLVerts.push(pL.x, 0.5, pL.z);
      railLVerts.push(pL.x, 0.9, pL.z);

      railRVerts.push(pR.x, 0.5, pR.z);
      railRVerts.push(pR.x, 0.9, pR.z);

      if (i < points.length - 1) {
        const b = i * 2;
        railIndices.push(b, b + 1, b + 2);
        railIndices.push(b + 1, b + 3, b + 2);
      }
    }

    const lastB = (points.length - 1) * 2;
    railIndices.push(lastB, lastB + 1, 0);
    railIndices.push(lastB + 1, 1, 0);

    postInst.instanceMatrix.needsUpdate = true;
    this.addToTrack(postInst);

    const railGeoL = new THREE.BufferGeometry();
    railGeoL.setAttribute('position', new THREE.Float32BufferAttribute(railLVerts, 3));
    railGeoL.setIndex(railIndices);
    railGeoL.computeVertexNormals();
    this.addToTrack(new THREE.Mesh(railGeoL, railMat));

    const railGeoR = new THREE.BufferGeometry();
    railGeoR.setAttribute('position', new THREE.Float32BufferAttribute(railRVerts, 3));
    railGeoR.setIndex(railIndices);
    railGeoR.computeVertexNormals();
    this.addToTrack(new THREE.Mesh(railGeoR, railMat));
  }

  buildWonderMetropolis() {
    // 1. Authentic Tokyo Tower (115m Tall Lattice Landmark)
    const tokyoTowerGroup = new THREE.Group();
    tokyoTowerGroup.position.set(-68, 0, -25);

    const orangeSteel = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.25 });
    const whiteSteel = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.25 });

    // 4 Flared Lattice Tower Legs
    for (let leg = 0; leg < 4; leg++) {
      const angle = (leg / 4) * Math.PI * 2;
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 2.4, 52, 8), orangeSteel);
      legMesh.position.set(Math.cos(angle) * 18, 26, Math.sin(angle) * 18);
      legMesh.rotation.z = Math.cos(angle) * 0.20;
      legMesh.rotation.x = Math.sin(angle) * 0.20;
      tokyoTowerGroup.add(legMesh);
    }

    // Main 2-Story Glass Observation Deck
    const mainDeck = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 7, 32), whiteSteel);
    mainDeck.position.y = 52;
    const deckWindows = new THREE.Mesh(new THREE.CylinderGeometry(22.5, 22.5, 3.2, 32), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    deckWindows.position.y = 52;
    tokyoTowerGroup.add(mainDeck, deckWindows);

    // Tapering Lattice Mid-Section
    const midShaft = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 13, 40, 8), orangeSteel);
    midShaft.position.y = 73;
    tokyoTowerGroup.add(midShaft);

    // Upper Special Observatory Deck
    const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(12, 13, 5, 24), whiteSteel);
    topDeck.position.y = 94;
    tokyoTowerGroup.add(topDeck);

    // Lattice Spire & Flashing Aviation Beacon
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 3.8, 42, 8), whiteSteel);
    spire.position.y = 114;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beacon.position.y = 135;
    tokyoTowerGroup.add(spire, beacon);
    this.addToTrack(tokyoTowerGroup);
    this.animatedProps.push({ type: 'beacon', mesh: beacon });

    // 2. High-Tech Japanese Skyscrapers with Illuminated Windows and Neon Cyber Signs
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const bldgMat0 = new THREE.MeshStandardMaterial({ map: getTokyoBuildingTexture(0), roughness: 0.2, metalness: 0.8 });
    const bldgMat1 = new THREE.MeshStandardMaterial({ map: getTokyoBuildingTexture(1), roughness: 0.2, metalness: 0.8 });

    const towerPositions = [];
    for (let i = 0; i < 280; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? (-45 - Math.random() * 95) : (45 + Math.random() * 95);
      const z = 85 - Math.random() * 205;
      const w = 20 + Math.random() * 16;
      const d = 20 + Math.random() * 16;
      const h = 80 + Math.random() * 110;

      const dist = this.getDistToTrack(x, z);
      const radius = Math.hypot(w, d) / 2;
      if (dist >= this.roadHalfWidth + radius + 10.0) {
        towerPositions.push({ x, z, w, d, h, mat: i % 2 === 0 ? bldgMat0 : bldgMat1 });
      }
      if (towerPositions.length >= 32) break;
    }

    towerPositions.forEach((tp) => {
      const bldg = new THREE.Mesh(towerGeo, tp.mat);
      bldg.position.set(tp.x, tp.h / 2, tp.z);
      bldg.scale.set(tp.w, tp.h, tp.d);
      bldg.castShadow = true;
      this.addToTrack(bldg);

      // Rooftop Helipad with glowing 'H'
      const helipad = new THREE.Mesh(
        new THREE.CylinderGeometry(tp.w * 0.35, tp.w * 0.35, 0.4, 16),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      helipad.position.set(tp.x, tp.h + 0.2, tp.z);
      this.addToTrack(helipad);
    });

    // 3. Traditional Vermilion Grand Shinto Torii Gate Marking Entrance to Alpine Mountains
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(-28, 0, -115);
    toriiGroup.rotation.y = Math.PI * 0.15;

    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const blackLacquer = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2 });

    const toriiPostL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 12), vermilionMat);
    toriiPostL.position.set(-22, 11, 0);
    const toriiPostR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 12), vermilionMat);
    toriiPostR.position.set(22, 11, 0);

    const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(54, 2.2, 3.2), blackLacquer);
    kasagiTop.position.set(0, 21.5, 0);
    const shimakiBeam = new THREE.Mesh(new THREE.BoxGeometry(50, 1.8, 2.4), vermilionMat);
    shimakiBeam.position.set(0, 19.5, 0);
    const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(47, 1.4, 1.6), vermilionMat);
    nukiBeam.position.set(0, 15.5, 0);

    toriiGroup.add(toriiPostL, toriiPostR, kasagiTop, shimakiBeam, nukiBeam);
    this.addToTrack(toriiGroup);
  }

  createOverheadGantry(pos, title, glowColor) {
    const gantry = new THREE.Group();
    gantry.position.copy(pos);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    const postL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 14, 1.6), metalMat);
    postL.position.set(-15.5, 7.0, 0);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 14, 1.6), metalMat);
    postR.position.set(15.5, 7.0, 0);
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(32.6, 1.8, 1.8), metalMat);
    crossBeam.position.set(0, 14.0, 0);
    gantry.add(postL, postR, crossBeam);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1024, 160);

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 1012, 148);

    ctx.fillStyle = glowColor;
    ctx.font = 'bold 52px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.fillText(title, 512, 80);

    const signTex = new THREE.CanvasTexture(canvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(24.0, 3.2),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 14.0, 0.1);
    gantry.add(signMesh);

    this.addToTrack(gantry);
  }

  buildWonderMountains() {
    const rockMat = new THREE.MeshStandardMaterial({
      map: getMountainRockTexture(),
      roughness: 0.85,
      metalness: 0.12
    });

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.1
    });

    // 16 Multi-Faceted Alpine Canyon Massifs with Craggy Ridges & Snowfields
    const canyonMountains = [
      { x: 55,   z: -195, h: 105, r: 48, segs: 6 },
      { x: -95,  z: -70,  h: 110, r: 50, segs: 7 },
      { x: -10,  z: -255, h: 120, r: 54, segs: 6 },
      { x: -130, z: -98,  h: 115, r: 52, segs: 7 },
      { x: -90,  z: -305, h: 135, r: 58, segs: 6 },
      { x: -140, z: -125, h: 95,  r: 42, segs: 6 },
      { x: -205, z: -295, h: 110, r: 48, segs: 7 },
      { x: -150, z: -115, h: 105, r: 46, segs: 6 },
      { x: -280, z: -255, h: 125, r: 52, segs: 7 },
      { x: -165, z: -98,  h: 120, r: 50, segs: 6 },
      { x: -335, z: -195, h: 130, r: 56, segs: 7 },
      { x: -182, z: -90,  h: 95,  r: 42, segs: 6 },
      { x: -350, z: -120, h: 105, r: 48, segs: 6 },
      { x: -192, z: -58,  h: 105, r: 46, segs: 7 },
      // Iconic Matterhorn Peak (Massive 155m hooked summit overlooking the canyon)
      { x: -210, z: -325, h: 155, r: 66, segs: 5 },
      { x: -295, z: -310, h: 150, r: 64, segs: 5 }
    ];

    canyonMountains.forEach((cp) => {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(cp.r, cp.h, cp.segs), rockMat);
      mountain.position.set(cp.x, cp.h / 2, cp.z);
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      this.addToTrack(mountain);

      // Layered Alpine Snowcap with Glacial Gullies
      const snow = new THREE.Mesh(new THREE.ConeGeometry(cp.r * 0.44, cp.h * 0.32, cp.segs), snowMat);
      snow.position.set(cp.x, cp.h * 0.84, cp.z);
      this.addToTrack(snow);
    });

    // Swiss Alpine Wooden Chalets with Shingle Roofs & Illuminated Windows
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const windowGlow = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    const chaletCoords = [
      { x: -110, z: -275, rot: 0.3 },
      { x: -175, z: -260, rot: -0.4 }
    ];

    chaletCoords.forEach(cc => {
      const chaletGroup = new THREE.Group();
      chaletGroup.position.set(cc.x, 0, cc.z);
      chaletGroup.rotation.y = cc.rot;

      const chaletBody = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 14), woodMat);
      chaletBody.position.y = 5.0;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(15, 9, 4), roofMat);
      roof.position.y = 13.5;
      roof.rotation.y = Math.PI / 4;
      const chaletWin = new THREE.Mesh(new THREE.BoxGeometry(18.4, 3.0, 3.2), windowGlow);
      chaletWin.position.y = 5.5;

      chaletGroup.add(chaletBody, roof, chaletWin);
      this.addToTrack(chaletGroup);
    });

    // Dense Evergreen Pine Forest (Clustered safely outside the Armco barriers)
    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.52, 6.0, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f1d0b, roughness: 0.95 });
    const foliageGeo = new THREE.ConeGeometry(3.6, 8.5, 7);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.8 });

    const treePositions = [];
    for (let i = 0; i < 200; i++) {
      const tx = -190 + Math.random() * 230;
      const tz = -290 + Math.random() * 220;
      const dist = this.getDistToTrack(tx, tz);
      if (dist >= this.roadHalfWidth + 7.5 && dist <= 80.0) {
        treePositions.push({ x: tx, z: tz });
      }
      if (treePositions.length >= 56) break;
    }

    const treeCount = treePositions.length;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    const dummy = new THREE.Object3D();

    treePositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 3.0, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos.x, 8.5, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      foliageInst.setMatrixAt(i, dummy.matrix);
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;
    this.addToTrack(trunkInst, foliageInst);
  }

  buildWonderPyramids() {
    // 1. Ancient Egyptian Sandstone & Polished Gold Materials
    const sandstoneTex = getSandstoneTexture();
    const hieroglyphTex = getHieroglyphTexture();

    const sandstoneMat = new THREE.MeshStandardMaterial({
      map: sandstoneTex,
      roughness: 0.82,
      metalness: 0.08
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 2.5
    });

    const pylonMat = new THREE.MeshStandardMaterial({
      map: hieroglyphTex,
      roughness: 0.65,
      metalness: 0.15
    });

    // 2. The Great Pyramid of Khufu (Towering 105m Stepped Pyramid with Golden Capstone)
    // Multi-tiered stepped construction for authentic ancient Egyptian masonry!
    const pyr1Group = new THREE.Group();
    pyr1Group.position.set(-440, 0, -45);
    pyr1Group.rotation.y = Math.PI / 4;

    const tiers = 5;
    const baseW = 100;
    const totalH = 105;
    for (let t = 0; t < tiers; t++) {
      const frac = t / tiers;
      const nextFrac = (t + 1) / tiers;
      const wBottom = baseW * (1 - frac * 0.82);
      const wTop = baseW * (1 - nextFrac * 0.82);
      const tierH = totalH / tiers;
      const tierGeo = new THREE.CylinderGeometry(wTop * 0.707, wBottom * 0.707, tierH, 4);
      const tierMesh = new THREE.Mesh(tierGeo, sandstoneMat);
      tierMesh.position.y = t * tierH + tierH / 2;
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      pyr1Group.add(tierMesh);
    }

    // Gleaming Electrum/Gold Pyramidion Capstone
    const cap1 = new THREE.Mesh(new THREE.ConeGeometry(18, 22, 4), goldMat);
    cap1.position.y = totalH + 11;
    pyr1Group.add(cap1);
    this.addToTrack(pyr1Group);

    // 3. Pyramid of Khafre (90m tall with surviving polished casing capstone)
    const pyr2 = new THREE.Mesh(new THREE.ConeGeometry(72, 90, 4), sandstoneMat);
    pyr2.position.set(-420, 45, -180);
    pyr2.rotation.y = Math.PI / 4;
    pyr2.castShadow = true;
    pyr2.receiveShadow = true;
    const cap2 = new THREE.Mesh(new THREE.ConeGeometry(22, 28, 4), goldMat);
    cap2.position.set(-420, 76, -180);
    cap2.rotation.y = Math.PI / 4;
    this.addToTrack(pyr2, cap2);

    // 4. Pyramid of Menkaure (60m tall)
    const pyr3 = new THREE.Mesh(new THREE.ConeGeometry(50, 60, 4), sandstoneMat);
    pyr3.position.set(-395, 30, 90);
    pyr3.rotation.y = Math.PI / 4;
    pyr3.castShadow = true;
    pyr3.receiveShadow = true;
    this.addToTrack(pyr3);

    // 5. Authentic Sculpted GREAT SPHINX OF GIZA (Facing the Circuit from Elevated Sandstone Terrace)
    const sphinxGroup = new THREE.Group();
    sphinxGroup.position.set(-245, 0, 15);
    sphinxGroup.rotation.y = Math.PI * 0.72;

    // A. Monumental Elevated Sandstone Terrace
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(32, 2.5, 54), sandstoneMat);
    terrace.position.y = 1.25;
    terrace.castShadow = true;
    sphinxGroup.add(terrace);

    // B. Muscular Recumbent Lion Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 34), sandstoneMat);
    body.position.set(0, 8.5, -2);
    body.castShadow = true;

    // Muscular Rear Haunches
    const haunchL = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 12, 12), sandstoneMat);
    haunchL.position.set(-9.5, 8.0, -12);
    const haunchR = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 12, 12), sandstoneMat);
    haunchR.position.set(9.5, 8.0, -12);

    // Contoured Chest & Forequarters
    const chest = new THREE.Mesh(new THREE.BoxGeometry(17, 13, 12), sandstoneMat);
    chest.position.set(0, 9.5, 11);

    // Carved Extended Forepaws
    const pawL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.5, 18), sandstoneMat);
    pawL.position.set(-6.5, 3.0, 20);
    const pawR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.5, 18), sandstoneMat);
    pawR.position.set(6.5, 3.0, 20);

    // Carved Dream Stele of Thutmose IV between the paws
    const dreamStele = new THREE.Mesh(new THREE.BoxGeometry(4.5, 8.0, 1.2), pylonMat);
    dreamStele.position.set(0, 6.0, 19);

    // C. Sculpted Pharaoh Head with Nemes Headdress & Royal Beard
    const head = new THREE.Mesh(new THREE.BoxGeometry(7.5, 9.0, 8.0), sandstoneMat);
    head.position.set(0, 20.0, 12);

    // Flared Triangular Wings of the Nemes Royal Headdress (Blue & Gold Royal Striped)
    const nemesL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 9.5, 6.0), pylonMat);
    nemesL.position.set(-4.8, 18.5, 12);
    nemesL.rotation.z = 0.22;
    const nemesR = new THREE.Mesh(new THREE.BoxGeometry(3.6, 9.5, 6.0), pylonMat);
    nemesR.position.set(4.8, 18.5, 12);
    nemesR.rotation.z = -0.22;

    // Curved Pharaonic Crown Crest & Uraeus Golden Cobra
    const nemesCrown = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 4.0, 16), pylonMat);
    nemesCrown.position.set(0, 25.0, 12);
    const cobra = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.5, 8), goldMat);
    cobra.position.set(0, 26.5, 15.5);
    cobra.rotation.x = -0.4;

    // Ceremonial Royal Braided Beard
    const royalBeard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.5, 1.8), goldMat);
    royalBeard.position.set(0, 13.5, 15.2);

    sphinxGroup.add(
      body, haunchL, haunchR, chest, pawL, pawR, dreamStele,
      head, nemesL, nemesR, nemesCrown, cobra, royalBeard
    );
    this.addToTrack(sphinxGroup);

    // 6. Monumental Egyptian Temple Pylons & Avenue of Obelisks
    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(14, 26, 8), pylonMat);
    pylonL.position.set(-275, 13, -30);
    pylonL.rotation.y = Math.PI * 0.25;
    const pylonR = new THREE.Mesh(new THREE.BoxGeometry(14, 26, 8), pylonMat);
    pylonR.position.set(-255, 13, -65);
    pylonR.rotation.y = Math.PI * 0.25;
    this.addToTrack(pylonL, pylonR);

    // 4 Grand Carved Granite Obelisks with Gold Pyramidion Tips
    const obeliskCoords = [
      { x: -285, z: -10 },
      { x: -270, z: -40 },
      { x: -255, z: -70 },
      { x: -240, z: -100 }
    ];
    obeliskCoords.forEach(oc => {
      const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.8, 26, 4), sandstoneMat);
      obelisk.position.set(oc.x, 13, oc.z);
      obelisk.rotation.y = Math.PI / 4;
      const obCap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 4), goldMat);
      obCap.position.set(oc.x, 27.5, oc.z);
      obCap.rotation.y = Math.PI / 4;
      this.addToTrack(obelisk, obCap);
    });
  }

  buildWonderColosseum() {
    const travertineTex = getTravertineTexture();
    const travertineMat = new THREE.MeshStandardMaterial({
      map: travertineTex,
      roughness: 0.60,
      metalness: 0.12
    });

    // 1. The Monumental Roman Colosseum (3 Tiers of Travertine Arches with Ruined Stepped Profile)
    const colCenter = new THREE.Vector3(-235, 0, 195);
    const colRadius = 78;
    const archCount = 36;

    const pillarGeo1 = new THREE.BoxGeometry(4.2, 12, 4.2);
    const pillarGeo2 = new THREE.BoxGeometry(3.8, 10, 3.8);
    const pillarGeo3 = new THREE.BoxGeometry(3.4, 9, 3.4);

    const pInst1 = new THREE.InstancedMesh(pillarGeo1, travertineMat, archCount);
    const pInst2 = new THREE.InstancedMesh(pillarGeo2, travertineMat, archCount);
    const pInst3 = new THREE.InstancedMesh(pillarGeo3, travertineMat, Math.floor(archCount * 0.65));

    const dummy = new THREE.Object3D();
    let tier3Idx = 0;

    for (let i = 0; i < archCount; i++) {
      const angle = (i / archCount) * Math.PI * 1.35 + 0.15;
      const x = colCenter.x + Math.cos(angle) * colRadius;
      const z = colCenter.z + Math.sin(angle) * colRadius;

      // Tier 1 (Doric Order)
      dummy.position.set(x, 6, z);
      dummy.lookAt(colCenter.x, 6, colCenter.z);
      dummy.updateMatrix();
      pInst1.setMatrixAt(i, dummy.matrix);

      // Tier 2 (Ionic Order)
      dummy.position.set(x, 17, z);
      dummy.updateMatrix();
      pInst2.setMatrixAt(i, dummy.matrix);

      // Tier 3 (Corinthian Order - iconic ruined broken wall!)
      if (i < Math.floor(archCount * 0.65)) {
        dummy.position.set(x, 26.5, z);
        dummy.updateMatrix();
        pInst3.setMatrixAt(tier3Idx++, dummy.matrix);
      }
    }

    pInst1.instanceMatrix.needsUpdate = true;
    pInst2.instanceMatrix.needsUpdate = true;
    pInst3.instanceMatrix.needsUpdate = true;
    this.addToTrack(pInst1, pInst2, pInst3);

    // Colosseum Continuous Entablature Rings (Stone Cornices between Tiers)
    const cornice1 = new THREE.Mesh(new THREE.TorusGeometry(colRadius, 1.4, 8, 48, Math.PI * 1.35), travertineMat);
    cornice1.position.set(colCenter.x, 12, colCenter.z);
    cornice1.rotation.x = Math.PI / 2;
    cornice1.rotation.z = -0.15;

    const cornice2 = new THREE.Mesh(new THREE.TorusGeometry(colRadius, 1.2, 8, 48, Math.PI * 1.35), travertineMat);
    cornice2.position.set(colCenter.x, 22, colCenter.z);
    cornice2.rotation.x = Math.PI / 2;
    cornice2.rotation.z = -0.15;

    this.addToTrack(cornice1, cornice2);

    // Inner Amphitheatre Cavea Seating Tiers (Visible through arches)
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.8 });
    for (let c = 0; c < 4; c++) {
      const cavea = new THREE.Mesh(
        new THREE.TorusGeometry(colRadius - 12 - c * 7, 2.5, 6, 32, Math.PI * 1.2),
        arenaMat
      );
      cavea.position.set(colCenter.x, 3 + c * 3.5, colCenter.z);
      cavea.rotation.x = Math.PI / 2;
      cavea.rotation.z = -0.15;
      this.addToTrack(cavea);
    }

    // 2. Arch of Constantine (Grand Roman Triumphal Monument - 36M Clear Road Span)
    const archGroup = new THREE.Group();
    archGroup.position.set(-135, 0, 245);
    archGroup.rotation.y = -Math.PI * 0.25;

    const archPillarL = new THREE.Mesh(new THREE.BoxGeometry(6.0, 22, 7.0), travertineMat);
    archPillarL.position.set(-18.0, 11, 0);
    const archPillarR = new THREE.Mesh(new THREE.BoxGeometry(6.0, 22, 7.0), travertineMat);
    archPillarR.position.set(18.0, 11, 0);

    const attic = new THREE.Mesh(new THREE.BoxGeometry(42, 8.0, 7.5), travertineMat);
    attic.position.set(0, 24.0, 0);

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    [-18.0, 18.0].forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 20, 12), travertineMat);
      col.position.set(cx, 10, 4.0);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), goldMat);
      cap.position.set(cx, 20.5, 4.0);
      archGroup.add(col, cap);
    });

    archGroup.add(archPillarL, archPillarR, attic);
    this.addToTrack(archGroup);

    // 3. Colonnade of the Roman Temple of Saturn (6 Fluted Columns with Pediment)
    const templeGroup = new THREE.Group();
    templeGroup.position.set(-85, 0, 260);
    templeGroup.rotation.y = -Math.PI * 0.15;

    const templePodium = new THREE.Mesh(new THREE.BoxGeometry(28, 3.5, 12), travertineMat);
    templePodium.position.y = 1.75;
    templeGroup.add(templePodium);

    for (let c = 0; c < 6; c++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 14, 12), travertineMat);
      col.position.set(-11 + c * 4.4, 10.5, 3.5);
      templeGroup.add(col);
    }
    const architrave = new THREE.Mesh(new THREE.BoxGeometry(26, 2.0, 3.5), travertineMat);
    architrave.position.set(0, 18.5, 3.5);
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(14, 4.5, 4), travertineMat);
    pediment.position.set(0, 21.5, 3.5);
    pediment.rotation.y = Math.PI / 4;
    templeGroup.add(architrave, pediment);
    this.addToTrack(templeGroup);
  }

  buildWonderBeach() {
    // 1. Classical Pharos Coastal Lighthouse with Fresnel Lens & Sweeping Spotlight
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(110, 0, 285);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.1 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const baseOct = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 8.5, 14, 8), whiteMat);
    baseOct.position.y = 7;
    const midSection = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 6.2, 14, 16), redMat);
    midSection.position.y = 21;
    const topSection = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.6, 12, 16), whiteMat);
    topSection.position.y = 34;

    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 1.2, 16), whiteMat);
    gallery.position.y = 40.5;

    const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 5.5, 16), glassMat);
    lanternRoom.position.y = 43.5;
    const cupola = new THREE.Mesh(new THREE.ConeGeometry(4.4, 4.5, 16), redMat);
    cupola.position.y = 48.5;

    const lightBeam = new THREE.SpotLight(0xfef08a, 7.0, 320, Math.PI / 6, 0.35);
    lightBeam.position.set(0, 43.5, 0);
    const beamTarget = new THREE.Object3D();
    beamTarget.position.set(120, 8, 120);
    lightBeam.target = beamTarget;

    lighthouseGroup.add(baseOct, midSection, topSection, gallery, lanternRoom, cupola, lightBeam, beamTarget);
    this.addToTrack(lighthouseGroup);
    this.animatedProps.push({ type: 'lighthouse', target: beamTarget, angle: 0 });

    // 2. Realistic Leaning Coconut Palm Trees with Layered Drooping Fronds
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.52, 11, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, side: THREE.DoubleSide });

    const palmPositions = [];
    for (let i = 0; i < 150; i++) {
      const px = 25 + Math.random() * 115;
      const pz = 215 + Math.random() * 95;
      const dist = this.getDistToTrack(px, pz);
      if (dist >= this.roadHalfWidth + 7.5 && dist <= 65.0) {
        palmPositions.push({ x: px, z: pz });
      }
      if (palmPositions.length >= 40) break;
    }

    palmPositions.forEach((pos) => {
      const palmGroup = new THREE.Group();
      palmGroup.position.set(pos.x, 0, pos.z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 5.5;
      trunk.rotation.z = (Math.random() - 0.5) * 0.28;
      palmGroup.add(trunk);

      for (let f = 0; f < 8; f++) {
        const frondAngle = (f / 8) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 7.5), frondMat);
        frond.position.set(Math.cos(frondAngle) * 2.5, 10.8, Math.sin(frondAngle) * 2.5);
        frond.rotation.y = frondAngle;
        frond.rotation.x = 0.45;
        palmGroup.add(frond);
      }

      this.addToTrack(palmGroup);
    });

    // 3. Polynesian Stilt Thatched Beach Villas over the Water
    const hutMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });

    for (let h = 0; h < 3; h++) {
      const villa = new THREE.Group();
      villa.position.set(50 + h * 22, 0, 280);

      for (let s = 0; s < 4; s++) {
        const sx = (s % 2 === 0 ? -1 : 1) * 3.5;
        const sz = (s < 2 ? -1 : 1) * 3.5;
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.0), woodDeckMat);
        stilt.position.set(sx, 2.0, sz);
        villa.add(stilt);
      }

      const deck = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.4, 9.0), woodDeckMat);
      deck.position.y = 4.0;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.5, 7.0), hutMat);
      cabin.position.y = 6.25;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 4.0, 4), thatchMat);
      roof.position.y = 10.25;
      roof.rotation.y = Math.PI / 4;

      villa.add(deck, cabin, roof);
      this.addToTrack(villa);
    }
  }

  buildWonderCyberTunnel() {
    // 100% OPEN GLOWING MULTI-LAYERED CYBERPUNK LASER CONDUIT (Indices 440 to 485)
    const archIndices = [];
    for (let i = 440; i <= 485; i += 3) {
      archIndices.push(i);
    }
    const ribCount = archIndices.length;

    const ringGeo = new THREE.TorusGeometry(16.0, 0.38, 8, 6);
    const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonMagenta = new THREE.MeshBasicMaterial({ color: 0xd946ef });

    const ringInstCyan = new THREE.InstancedMesh(ringGeo, neonCyan, Math.ceil(ribCount / 2));
    const ringInstMag = new THREE.InstancedMesh(ringGeo, neonMagenta, Math.floor(ribCount / 2));

    const dummy = new THREE.Object3D();
    let cIdx = 0;
    let mIdx = 0;

    archIndices.forEach((idx, i) => {
      const pt = this.roadPoints[idx];
      const tangent = this.getTangentAt(idx);

      dummy.position.set(pt.x, 7.5, pt.z);
      dummy.lookAt(pt.x + tangent.x, 7.5, pt.z + tangent.z);
      dummy.updateMatrix();

      if (i % 2 === 0) {
        ringInstCyan.setMatrixAt(cIdx++, dummy.matrix);
      } else {
        ringInstMag.setMatrixAt(mIdx++, dummy.matrix);
      }
    });

    ringInstCyan.instanceMatrix.needsUpdate = true;
    ringInstMag.instanceMatrix.needsUpdate = true;
    this.addToTrack(ringInstCyan, ringInstMag);
  }

  buildWonderVictoryStadium() {
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.35
    });

    const crowdMat = new THREE.MeshStandardMaterial({
      map: getSpectatorCrowdTexture(),
      roughness: 0.5,
      metalness: 0.1
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      map: getStadiumRibbonTexture(),
      roughness: 0.2,
      metalness: 0.8
    });

    // 1. Tiered Olympic Stadium Grandstands with Animated Spectator Crowd & LED Ribbon Boards
    const grandstandGroup = new THREE.Group();
    grandstandGroup.position.set(-38, 0, -10);

    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 65), crowdMat);
    tier1.position.set(0, 4.5, 0);
    const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(18.4, 2.2, 65.4), ribbonMat);
    ribbon1.position.set(0, 9.5, 0);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 65), crowdMat);
    tier2.position.set(-4, 14.5, 0);
    const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(16.4, 2.2, 65.4), ribbonMat);
    ribbon2.position.set(-4, 19.5, 0);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(26, 1.6, 70), concreteMat);
    roof.position.set(2, 23.5, 0);
    roof.rotation.z = -0.12;

    grandstandGroup.add(tier1, ribbon1, tier2, ribbon2, roof);
    this.addToTrack(grandstandGroup);

    // 2. Stadium High-Intensity Floodlight Mast Towers
    const floodCoords = [
      { x: -52, z: -45 },
      { x: -52, z: -15 },
      { x: -52, z: 15 },
      { x: -52, z: 45 }
    ];
    const floodlightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    floodCoords.forEach((coord) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.4, 34, 8), concreteMat);
      mast.position.set(coord.x, 17, coord.z);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.8, 2.2), floodlightMat);
      lampHead.position.set(coord.x, 34, coord.z);
      lampHead.lookAt(0, 4, coord.z);
      this.addToTrack(mast, lampHead);
    });

    // 3. Monumental 18m Tall GOLDEN WINGED VICTORY OF SAMOTHRACE on Marble Podium Plaza
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.95,
      roughness: 0.08,
      envMapIntensity: 3.0
    });

    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(-42, 0, -10);

    const podium = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 4.0, 24), concreteMat);
    podium.position.y = 2.0;
    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.2, 9, 16), goldMat);
    trophyStem.position.y = 8.5;
    const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 2.2, 8.5, 16), goldMat);
    trophyCup.position.y = 15.5;

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 4.5), goldMat);
    wingL.position.set(-4.5, 18.0, 0);
    wingL.rotation.z = -0.38;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 4.5), goldMat);
    wingR.position.set(4.5, 18.0, 0);
    wingR.rotation.z = 0.38;

    trophyGroup.add(podium, trophyStem, trophyCup, wingL, wingR);
    this.addToTrack(trophyGroup);
  }

  buildCheckpointGates() {
    // 100% DOUBLE-SIDED HIGH-IMPACT RACING GANTRIES (50-METER CLEAR SPAN):
    this.checkpoints.forEach((cp) => {
      const gateGroup = new THREE.Group();
      gateGroup.position.copy(cp.pos);
      gateGroup.rotation.y = cp.rotation;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2
      });

      const postL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 16, 1.4), steelMat);
      postL.position.set(-24.0, 8.0, 0);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 16, 1.4), steelMat);
      postR.position.set(24.0, 8.0, 0);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(50.0, 2.0, 2.0), steelMat);
      beam.position.set(0, 15.5, 0);
      gateGroup.add(postL, postR, beam);

      const gateNeonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cp.color) });
      const neonL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 15.5, 0.35), gateNeonMat);
      neonL.position.set(-23.1, 8.0, 0);
      const neonR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 15.5, 0.35), gateNeonMat);
      neonR.position.set(23.1, 8.0, 0);
      const neonTop = new THREE.Mesh(new THREE.BoxGeometry(48.2, 0.35, 0.35), gateNeonMat);
      neonTop.position.set(0, 14.5, 0);
      gateGroup.add(neonL, neonR, neonTop);

      const headerCanvas = document.createElement('canvas');
      headerCanvas.width = 1024;
      headerCanvas.height = 256;
      const hctx = headerCanvas.getContext('2d');

      hctx.fillStyle = '#050811';
      hctx.fillRect(0, 0, 1024, 256);

      hctx.strokeStyle = cp.color;
      hctx.lineWidth = 14;
      hctx.strokeRect(10, 10, 1004, 236);

      hctx.fillStyle = '#ffffff';
      hctx.font = 'bold 76px sans-serif';
      hctx.textAlign = 'center';
      hctx.textBaseline = 'middle';
      hctx.fillText(`GATE 0${cp.id} // ${cp.name}`, 512, 90);

      hctx.fillStyle = cp.color;
      hctx.font = 'bold 36px monospace';
      hctx.fillText(cp.wonder, 512, 178);

      const headerTex = new THREE.CanvasTexture(headerCanvas);

      const signMat = new THREE.MeshBasicMaterial({
        map: headerTex,
        side: THREE.DoubleSide
      });
      const headerMeshFront = new THREE.Mesh(new THREE.PlaneGeometry(26.0, 4.4), signMat);
      headerMeshFront.position.set(0, 17.0, 0.2);
      const headerMeshBack = new THREE.Mesh(new THREE.PlaneGeometry(26.0, 4.4), signMat);
      headerMeshBack.position.set(0, 17.0, -0.2);
      headerMeshBack.rotation.y = Math.PI;

      gateGroup.add(headerMeshFront, headerMeshBack);

      this.addToTrack(gateGroup);

      this.checkpointMeshes.push({
        id: cp.id,
        color: cp.color,
        signMat
      });
    });
  }

  highlightCheckpoint(activeId) {
    this.checkpointMeshes.forEach((m) => {
      if (m.holoMat) {
        m.holoMat.opacity = (m.id === activeId) ? 0.95 : 0.25;
      }
      if (m.signMat) {
        m.signMat.emissiveIntensity = (m.id === activeId) ? 0.9 : 0.3;
      }
    });
  }

  getClosestTrackPoint(carPos) {
    let minDistSq = Infinity;
    let closestIdx = 0;
    const N = this.roadPoints.length;

    for (let i = 0; i < N; i++) {
      const pt = this.roadPoints[i];
      const dx = carPos.x - pt.x;
      const dz = carPos.z - pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIdx = i;
      }
    }

    // Continuous segment projection between (i-1, i) and (i, i+1)
    const prevIdx = (closestIdx - 1 + N) % N;
    const nextIdx = (closestIdx + 1) % N;

    const projectOnSeg = (p0, p1, i0, i1) => {
      const segX = p1.x - p0.x;
      const segZ = p1.z - p0.z;
      const segLenSq = segX * segX + segZ * segZ;
      if (segLenSq < 0.0001) return { pt: p0, t: 0, distSq: (carPos.x - p0.x) ** 2 + (carPos.z - p0.z) ** 2, i0, i1 };
      const toCarX = carPos.x - p0.x;
      const toCarZ = carPos.z - p0.z;
      const t = Math.max(0, Math.min(1, (toCarX * segX + toCarZ * segZ) / segLenSq));
      const proj = new THREE.Vector3(p0.x + segX * t, 0.05, p0.z + segZ * t);
      const dx = carPos.x - proj.x;
      const dz = carPos.z - proj.z;
      return { pt: proj, t, distSq: dx * dx + dz * dz, i0, i1 };
    };

    const segA = projectOnSeg(this.roadPoints[prevIdx], this.roadPoints[closestIdx], prevIdx, closestIdx);
    const segB = projectOnSeg(this.roadPoints[closestIdx], this.roadPoints[nextIdx], closestIdx, nextIdx);

    const bestSeg = segA.distSq <= segB.distSq ? segA : segB;
    const closestPt = bestSeg.pt;

    const tan0 = this.getTangentAt(bestSeg.i0);
    const tan1 = this.getTangentAt(bestSeg.i1);
    const tangent = tan0.clone().lerp(tan1, bestSeg.t).normalize();

    const norm0 = this.getNormalAt(bestSeg.i0);
    const norm1 = this.getNormalAt(bestSeg.i1);
    const normal = norm0.clone().lerp(norm1, bestSeg.t).normalize();

    const toCar = new THREE.Vector3(carPos.x - closestPt.x, 0, carPos.z - closestPt.z);
    const lateralDist = toCar.dot(normal);

    return {
      index: closestIdx,
      point: closestPt,
      closestPoint: closestPt,
      tangent,
      normal,
      lateralDist,
      distFromCenter: Math.abs(lateralDist)
    };
  }

  update(dt) {
    const t = performance.now() * 0.004;

    this.pulsingGates.forEach((gate) => {
      gate.material.opacity = 0.45 + Math.sin(t) * 0.35;
      gate.rotation.z = t * 0.8;
    });

    this.animatedProps.forEach((p) => {
      if (p.type === 'lighthouse') {
        p.angle += dt * 1.5;
        p.target.position.x = Math.cos(p.angle) * 160;
        p.target.position.z = Math.sin(p.angle) * 160;
      } else if (p.type === 'beacon') {
        p.mesh.material.opacity = Math.sin(t * 3) > 0.5 ? 1.0 : 0.2;
      }
    });
  }
}
