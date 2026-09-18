import * as THREE from 'three';

export class Track {
  constructor(scene) {
    this.scene = scene;

    // 24-Meter Wide Grand Hypercar Circuit Spline (Continuous 7-Wonders circuit)
    this.trackPoints = [
      new THREE.Vector3(0, 0, 60),      // Launch & Finish Straight
      new THREE.Vector3(0, 0, -80),     // Tokyo Metropolis High-Speed Strip
      new THREE.Vector3(-60, 0, -175),  // Entry into Alpine Canyon
      new THREE.Vector3(-150, 0, -220), // Alpine Mountain Summit Pass
      new THREE.Vector3(-225, 0, -170), // Descent from Alpine Summit
      new THREE.Vector3(-280, 0, -50),  // Giza Desert Dunes Straight
      new THREE.Vector3(-270, 0, 80),   // Great Sphinx Sweeping Curve
      new THREE.Vector3(-190, 0, 175),  // Approach to Roman Colosseum
      new THREE.Vector3(-85, 0, 230),   // Imperial Forum sweeping bend
      new THREE.Vector3(45, 0, 245),    // Pacific Coast Oceanview Highway
      new THREE.Vector3(150, 0, 195),   // Coastal Beach Curve
      new THREE.Vector3(190, 0, 80),    // Approach to Cyber Hyper-Tunnel
      new THREE.Vector3(155, 0, -35),   // Tunnel Exit
      new THREE.Vector3(95, 0, -45),    // Stadium Approach S-Curve
      new THREE.Vector3(35, 0, 25)      // Stadium Entry Straight
    ];

    this.curve = new THREE.CatmullRomCurve3(this.trackPoints, true);
    this.curve.tension = 0.5;

    const pointsCount = 600;
    this.pointsCount = pointsCount;
    this.roadPoints = this.curve.getSpacedPoints(pointsCount);

    // 24.0m Multi-Lane Grand Highway
    const roadWidth = 24.0;
    this.roadWidth = roadWidth;
    this.roadHalfWidth = roadWidth / 2; // 12.0m

    // 7 World Wonders Checkpoint Data (With precise road indices)
    this.checkpoints = [
      {
        id: 1,
        name: 'TOKYO METROPOLIS',
        wonder: 'WONDER 01: NEO-TOKYO SPEEDWAY',
        color: '#00f0ff',
        roadIdx: 45,
        pos: this.roadPoints[45].clone(),
        rotation: this.getHeadingAt(45),
        radius: 24.0
      },
      {
        id: 2,
        name: 'ALPINE SUMMIT',
        wonder: 'WONDER 02: MOUNTAIN CLIMB & CANYON',
        color: '#38bdf8',
        roadIdx: 125,
        pos: this.roadPoints[125].clone(),
        rotation: this.getHeadingAt(125),
        radius: 24.0
      },
      {
        id: 3,
        name: 'GIZA PYRAMIDS',
        wonder: 'WONDER 03: GREAT PYRAMIDS & SPHINX',
        color: '#f59e0b',
        roadIdx: 215,
        pos: this.roadPoints[215].clone(),
        rotation: this.getHeadingAt(215),
        radius: 24.0
      },
      {
        id: 4,
        name: 'ROMAN COLOSSEUM',
        wonder: 'WONDER 04: IMPERIAL ROMAN FORUM',
        color: '#eab308',
        roadIdx: 305,
        pos: this.roadPoints[305].clone(),
        rotation: this.getHeadingAt(305),
        radius: 24.0
      },
      {
        id: 5,
        name: 'PACIFIC COAST',
        wonder: 'WONDER 05: TROPICAL PARADISE BEACH',
        color: '#10b981',
        roadIdx: 395,
        pos: this.roadPoints[395].clone(),
        rotation: this.getHeadingAt(395),
        radius: 24.0
      },
      {
        id: 6,
        name: 'HYPER TUNNEL',
        wonder: 'WONDER 06: CYBER NEON LASER TUBE',
        color: '#d946ef',
        roadIdx: 470,
        pos: this.roadPoints[470].clone(),
        rotation: this.getHeadingAt(470),
        radius: 24.0
      },
      {
        id: 7,
        name: 'VICTORY GRAND PRIX',
        wonder: 'WONDER 07: WORLD CHAMPIONSHIP FINISH',
        color: '#ef4444',
        roadIdx: 585,
        pos: this.roadPoints[585].clone(),
        rotation: this.getHeadingAt(585),
        radius: 24.0
      }
    ];

    this.checkpointMeshes = [];
    this.pulsingGates = [];
    this.animatedProps = [];

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

  getHeadingAt(idx) {
    const t = (idx % this.pointsCount) / this.pointsCount;
    const tangent = this.curve.getTangent(t).normalize();
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
    const oceanGeo = new THREE.PlaneGeometry(1600, 1600);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.8
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(260, -1.0, 340);
    this.scene.add(ocean);

    const landGeo = new THREE.PlaneGeometry(1500, 1500);
    landGeo.rotateX(-Math.PI / 2);
    const landMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.95,
      metalness: 0.05
    });
    const land = new THREE.Mesh(landGeo, landMat);
    land.position.y = -0.05;
    land.receiveShadow = true;
    this.scene.add(land);

    const desertGeo = new THREE.CircleGeometry(280, 40);
    desertGeo.rotateX(-Math.PI / 2);
    const desertMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.92,
      metalness: 0.05
    });
    const desert = new THREE.Mesh(desertGeo, desertMat);
    desert.position.set(-360, -0.03, -60);
    desert.receiveShadow = true;
    this.scene.add(desert);

    const beachGeo = new THREE.PlaneGeometry(350, 220);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.88,
      metalness: 0.05
    });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.set(80, -0.02, 270);
    beach.receiveShadow = true;
    this.scene.add(beach);
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
      const tangent = this.curve.getTangent(idx / pointsCount);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

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
    this.scene.add(roadMesh);

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
    this.scene.add(new THREE.Mesh(curbGeoL, curbMat));

    const curbGeoR = new THREE.BufferGeometry();
    curbGeoR.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsR, 3));
    curbGeoR.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
    curbGeoR.setIndex(curbIndices);
    curbGeoR.computeVertexNormals();
    this.scene.add(new THREE.Mesh(curbGeoR, curbMat));

    this.buildContinuousArmcoGuardrails(roadPoints, this.roadHalfWidth + 1.5);
  }

  buildContinuousArmcoGuardrails(points, offsetDist) {
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25
    });

    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });

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
      const tangent = this.curve.getTangent(i / points.length);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

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
    this.scene.add(postInst);

    const railGeoL = new THREE.BufferGeometry();
    railGeoL.setAttribute('position', new THREE.Float32BufferAttribute(railLVerts, 3));
    railGeoL.setIndex(railIndices);
    railGeoL.computeVertexNormals();
    this.scene.add(new THREE.Mesh(railGeoL, railMat));

    const railGeoR = new THREE.BufferGeometry();
    railGeoR.setAttribute('position', new THREE.Float32BufferAttribute(railRVerts, 3));
    railGeoR.setIndex(railIndices);
    railGeoR.computeVertexNormals();
    this.scene.add(new THREE.Mesh(railGeoR, railMat));
  }

  buildWonderMetropolis() {
    // 1. Monumental Tokyo Tower / Skytree (115m tall steel lattice tower)
    const tokyoTowerGroup = new THREE.Group();
    tokyoTowerGroup.position.set(-68, 0, -25);

    const orangeSteel = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.8, roughness: 0.3 });
    const whiteSteel = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.3 });

    for (let leg = 0; leg < 4; leg++) {
      const angle = (leg / 4) * Math.PI * 2;
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.8, 48, 6), orangeSteel);
      legMesh.position.set(Math.cos(angle) * 16, 24, Math.sin(angle) * 16);
      legMesh.rotation.z = Math.cos(angle) * 0.18;
      legMesh.rotation.x = Math.sin(angle) * 0.18;
      tokyoTowerGroup.add(legMesh);
    }

    const mainDeck = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 6, 24), whiteSteel);
    mainDeck.position.y = 48;
    const deckWindows = new THREE.Mesh(new THREE.CylinderGeometry(20.5, 20.5, 2.5, 24), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    deckWindows.position.y = 48;
    tokyoTowerGroup.add(mainDeck, deckWindows);

    const midShaft = new THREE.Mesh(new THREE.CylinderGeometry(6, 12, 38, 8), orangeSteel);
    midShaft.position.y = 67;
    tokyoTowerGroup.add(midShaft);

    const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 4, 20), whiteSteel);
    topDeck.position.y = 86;
    tokyoTowerGroup.add(topDeck);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.5, 36, 8), whiteSteel);
    spire.position.y = 104;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beacon.position.y = 122;
    tokyoTowerGroup.add(spire, beacon);
    this.scene.add(tokyoTowerGroup);
    this.animatedProps.push({ type: 'beacon', mesh: beacon });

    // 2. High-Tech Japanese Skyscrapers & Billboards (Outside 38m corridor)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.15, metalness: 0.85 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    const towerPositions = [];
    for (let i = 0; i < 240; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? (-42 - Math.random() * 80) : (42 + Math.random() * 80);
      const z = 70 - Math.random() * 180;
      const w = 18 + Math.random() * 14;
      const d = 18 + Math.random() * 14;
      const h = 75 + Math.random() * 95;

      const dist = this.getDistToTrack(x, z);
      const radius = Math.hypot(w, d) / 2;
      if (dist >= this.roadHalfWidth + radius + 8.0) {
        towerPositions.push({ x, z, w, d, h });
      }
      if (towerPositions.length >= 30) break;
    }

    const towerInst = new THREE.InstancedMesh(towerGeo, towerMat, towerPositions.length);
    const bandInst = new THREE.InstancedMesh(towerGeo, windowMat, towerPositions.length);
    const dummy = new THREE.Object3D();

    towerPositions.forEach((tp, i) => {
      dummy.position.set(tp.x, tp.h / 2, tp.z);
      dummy.scale.set(tp.w, tp.h, tp.d);
      dummy.updateMatrix();
      towerInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tp.x, tp.h * 0.65, tp.z);
      dummy.scale.set(tp.w + 0.4, 2.2, tp.d + 0.4);
      dummy.updateMatrix();
      bandInst.setMatrixAt(i, dummy.matrix);
    });

    towerInst.instanceMatrix.needsUpdate = true;
    bandInst.instanceMatrix.needsUpdate = true;
    this.scene.add(towerInst, bandInst);

    this.createOverheadGantry(new THREE.Vector3(0, 0, 15), 'APEX GRAND PRIX // NEO-TOKYO EXPRESSWAY', '#00f0ff');
    this.createOverheadGantry(new THREE.Vector3(0, 0, -45), 'WONDER 01 // TOKYO SPEEDWAY // 東京高速', '#ec4899');
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

    this.scene.add(gantry);
  }

  buildWonderMountains() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.88,
      metalness: 0.1
    });

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.1
    });

    // 16 Alpine Canyon Peaks (Clear Valley Pass, Zero Overlap!)
    const canyonMountains = [
      { x: 45, z: -190, h: 90, r: 42 },
      { x: -90, z: -68, h: 95, r: 44 },
      { x: -5, z: -245, h: 105, r: 48 },
      { x: -125, z: -92, h: 108, r: 48 },
      { x: -85, z: -295, h: 120, r: 52 },
      { x: -136, z: -115, h: 85, r: 38 },
      { x: -195, z: -285, h: 95, r: 44 },
      { x: -145, z: -110, h: 95, r: 42 },
      { x: -270, z: -245, h: 105, r: 48 },
      { x: -158, z: -95, h: 110, r: 48 },
      { x: -325, z: -185, h: 120, r: 52 },
      { x: -175, z: -88, h: 85, r: 38 },
      { x: -340, z: -115, h: 95, r: 44 },
      { x: -185, z: -55, h: 95, r: 42 },
      { x: -200, z: -315, h: 135, r: 60 },
      { x: -285, z: -300, h: 140, r: 62 }
    ];

    canyonMountains.forEach((cp) => {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(cp.r, cp.h, 8), rockMat);
      mountain.position.set(cp.x, cp.h / 2, cp.z);
      this.scene.add(mountain);

      const snow = new THREE.Mesh(new THREE.ConeGeometry(cp.r * 0.42, cp.h * 0.3, 8), snowMat);
      snow.position.set(cp.x, cp.h * 0.85, cp.z);
      this.scene.add(snow);
    });

    const chaletGroup = new THREE.Group();
    chaletGroup.position.set(-110, 0, -275);
    chaletGroup.rotation.y = Math.PI * 0.3;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2b14, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const windowGlow = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    const chaletBody = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 12), woodMat);
    chaletBody.position.y = 4.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(14, 8, 4), roofMat);
    roof.position.y = 12.5;
    roof.rotation.y = Math.PI / 4;
    const chaletWin = new THREE.Mesh(new THREE.BoxGeometry(16.4, 2.5, 3), windowGlow);
    chaletWin.position.y = 5.0;

    chaletGroup.add(chaletBody, roof, chaletWin);
    this.scene.add(chaletGroup);

    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 5.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const foliageGeo = new THREE.ConeGeometry(3.4, 7.5, 6);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.85 });

    const treePositions = [];
    for (let i = 0; i < 160; i++) {
      const tx = -190 + Math.random() * 230;
      const tz = -290 + Math.random() * 220;
      const dist = this.getDistToTrack(tx, tz);
      if (dist >= this.roadHalfWidth + 6.5 && dist <= 75.0) {
        treePositions.push({ x: tx, z: tz });
      }
      if (treePositions.length >= 48) break;
    }

    const treeCount = treePositions.length;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    const dummy = new THREE.Object3D();

    treePositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 2.75, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos.x, 8.0, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      foliageInst.setMatrixAt(i, dummy.matrix);
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;
    this.scene.add(trunkInst, foliageInst);
  }

  buildWonderPyramids() {
    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.85,
      metalness: 0.05
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 2.5
    });

    // 1. Great Pyramid of Khufu (Towering 95m tall, placed 160m deep in desert: ZERO OVERLAP!)
    const pyr1 = new THREE.Mesh(new THREE.ConeGeometry(75, 95, 4), sandstoneMat);
    pyr1.position.set(-440, 47.5, -45);
    pyr1.rotation.y = Math.PI / 4;
    pyr1.castShadow = true;
    this.scene.add(pyr1);

    const cap1 = new THREE.Mesh(new THREE.ConeGeometry(20, 25, 4), goldMat);
    cap1.position.set(-440, 82.5, -45);
    cap1.rotation.y = Math.PI / 4;
    this.scene.add(cap1);

    // 2. Pyramid of Khafre (82m tall, placed 180m away: ZERO OVERLAP!)
    const pyr2 = new THREE.Mesh(new THREE.ConeGeometry(65, 82, 4), sandstoneMat);
    pyr2.position.set(-420, 41, -180);
    pyr2.rotation.y = Math.PI / 4;
    pyr2.castShadow = true;
    this.scene.add(pyr2);

    // 3. Pyramid of Menkaure (55m tall, placed 125m away: ZERO OVERLAP!)
    const pyr3 = new THREE.Mesh(new THREE.ConeGeometry(45, 55, 4), sandstoneMat);
    pyr3.position.set(-395, 27.5, 90);
    pyr3.rotation.y = Math.PI / 4;
    pyr3.castShadow = true;
    this.scene.add(pyr3);

    // 4. Sculpted Great Sphinx of Giza (At x = -245, z = 15, facing track from 32m away)
    const sphinxGroup = new THREE.Group();
    sphinxGroup.position.set(-245, 0, 15);
    sphinxGroup.rotation.y = Math.PI * 0.72;

    const body = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 32), sandstoneMat);
    body.position.set(0, 4.5, 0);
    body.castShadow = true;

    const pawL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 13), sandstoneMat);
    pawL.position.set(-5.5, 1.6, 17);
    const pawR = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 13), sandstoneMat);
    pawR.position.set(5.5, 1.6, 17);

    const head = new THREE.Mesh(new THREE.SphereGeometry(5.6, 16, 16), sandstoneMat);
    head.position.set(0, 13.5, 11);
    head.scale.set(1.0, 1.25, 1.1);

    const nemes = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 5.0, 5.5, 12), goldMat);
    nemes.position.set(0, 18.2, 11);

    sphinxGroup.add(body, pawL, pawR, head, nemes);
    this.scene.add(sphinxGroup);

    for (let i = 0; i < 6; i++) {
      const obelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.6, 19, 4),
        sandstoneMat
      );
      obelisk.position.set(-250 + i * 8, 9.5, -25 - i * 17);
      obelisk.rotation.y = Math.PI / 4;
      this.scene.add(obelisk);

      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      flame.position.set(-250 + i * 8, 19.5, -25 - i * 17);
      this.scene.add(flame);
    }
  }

  buildWonderColosseum() {
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.65,
      metalness: 0.1
    });

    const archCount = 28;
    const pillarGeo1 = new THREE.BoxGeometry(3.6, 14, 3.6);
    const pillarGeo2 = new THREE.BoxGeometry(3.2, 10, 3.2);
    const pillarInst1 = new THREE.InstancedMesh(pillarGeo1, marbleMat, archCount);
    const pillarInst2 = new THREE.InstancedMesh(pillarGeo2, marbleMat, archCount);

    const dummy = new THREE.Object3D();
    const colCenter = new THREE.Vector3(-235, 0, 195);
    const colRadius = 72;

    for (let i = 0; i < archCount; i++) {
      const angle = (i / archCount) * Math.PI * 1.15 + 0.22;
      const x = colCenter.x + Math.cos(angle) * colRadius;
      const z = colCenter.z + Math.sin(angle) * colRadius;

      dummy.position.set(x, 7, z);
      dummy.lookAt(colCenter.x, 7, colCenter.z);
      dummy.updateMatrix();
      pillarInst1.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, 19, z);
      dummy.updateMatrix();
      pillarInst2.setMatrixAt(i, dummy.matrix);
    }

    pillarInst1.instanceMatrix.needsUpdate = true;
    pillarInst2.instanceMatrix.needsUpdate = true;
    this.scene.add(pillarInst1, pillarInst2);

    const archGroup = new THREE.Group();
    archGroup.position.set(-135, 0, 245);
    archGroup.rotation.y = -Math.PI * 0.25;

    const archL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 18, 5), marbleMat);
    archL.position.set(-7, 9, 0);
    const archR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 18, 5), marbleMat);
    archR.position.set(7, 9, 0);
    const archAttic = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 6), marbleMat);
    archAttic.position.set(0, 21, 0);

    archGroup.add(archL, archR, archAttic);
    this.scene.add(archGroup);
  }

  buildWonderBeach() {
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(110, 0, 285);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const baseSection = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7.5, 12, 16), whiteMat);
    baseSection.position.y = 6;
    const midSection = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.5, 12, 16), redMat);
    midSection.position.y = 18;
    const topSection = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 10, 16), whiteMat);
    topSection.position.y = 29;
    const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 5, 16), glassMat);
    lanternRoom.position.y = 36.5;
    const cupola = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4, 16), redMat);
    cupola.position.y = 41;

    const lightBeam = new THREE.SpotLight(0xfef08a, 6.0, 280, Math.PI / 6, 0.4);
    lightBeam.position.set(0, 36.5, 0);
    const beamTarget = new THREE.Object3D();
    beamTarget.position.set(100, 5, 100);
    lightBeam.target = beamTarget;

    lighthouseGroup.add(baseSection, midSection, topSection, lanternRoom, cupola, lightBeam, beamTarget);
    this.scene.add(lighthouseGroup);
    this.animatedProps.push({ type: 'lighthouse', target: beamTarget, angle: 0 });

    const trunkGeo = new THREE.CylinderGeometry(0.26, 0.48, 10, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const canopyGeo = new THREE.SphereGeometry(4.2, 8, 8);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });

    const palmPositions = [];
    for (let i = 0; i < 130; i++) {
      const px = 20 + Math.random() * 120;
      const pz = 210 + Math.random() * 100;
      const dist = this.getDistToTrack(px, pz);
      if (dist >= this.roadHalfWidth + 6.5 && dist <= 60.0) {
        palmPositions.push({ x: px, z: pz });
      }
      if (palmPositions.length >= 36) break;
    }

    const treeCount = palmPositions.length;
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    const dummy = new THREE.Object3D();

    palmPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 5.0, pos.z);
      dummy.rotation.set((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos.x, 10.2, pos.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1.9, 0.5, 1.9);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(i, dummy.matrix);
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    this.scene.add(trunkInst, canopyInst);

    const hutGroup = new THREE.Group();
    hutGroup.position.set(45, 0, 275);
    const hutMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
    const hutThatch = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 });

    for (let h = 0; h < 3; h++) {
      const hut = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 4.5, 8), hutMat);
      hut.position.set(h * 16, 2.25, 0);
      const thatch = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.5, 8), hutThatch);
      thatch.position.set(h * 16, 6.25, 0);
      hutGroup.add(hut, thatch);
    }
    this.scene.add(hutGroup);
  }

  buildWonderCyberTunnel() {
    // 100% OPEN GLOWING HEXAGONAL LASER PORTAL RINGS (Indices 440 to 485)
    // ZERO SOLID WALLS OR COLUMNS! Sleek glowing neon laser hex-rings suspended in space!
    const archIndices = [];
    for (let i = 440; i <= 485; i += 3) {
      archIndices.push(i);
    }
    const ribCount = archIndices.length;

    // Glowing Neon Laser Hexagon Ring (Radius 15.5m: 3.5m clear outside 12m road!)
    const ringGeo = new THREE.TorusGeometry(15.5, 0.35, 6, 6);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    const ringInst = new THREE.InstancedMesh(ringGeo, neonMat, ribCount);

    const dummy = new THREE.Object3D();

    archIndices.forEach((idx, i) => {
      const pt = this.roadPoints[idx];
      const tangent = this.curve.getTangent(idx / this.pointsCount).normalize();

      dummy.position.set(pt.x, 7.5, pt.z);
      dummy.lookAt(pt.x + tangent.x, 7.5, pt.z + tangent.z);
      dummy.updateMatrix();
      ringInst.setMatrixAt(i, dummy.matrix);
    });

    ringInst.instanceMatrix.needsUpdate = true;
    this.scene.add(ringInst);
  }

  buildWonderVictoryStadium() {
    const stadiumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });

    // Tiered Grandstands safely situated on the open stadium plaza (Left side, 24m+ net clearance: ABSOLUTELY ZERO OVERLAP!)
    const standL = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 50), stadiumMat);
    standL.position.set(-35, 8, -15);
    this.scene.add(standL);

    // 4 High Stadium Floodlight Towers safely positioned on the left stadium plaza (45m away!)
    const floodlightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const floodCoords = [
      { x: -48, z: -40 },
      { x: -48, z: -15 },
      { x: -48, z: 10 },
      { x: -48, z: 35 }
    ];

    floodCoords.forEach((coord) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 32, 8), stadiumMat);
      pole.position.set(coord.x, 16, coord.z);
      const head = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.5, 2.0), floodlightMat);
      head.position.set(coord.x, 32, coord.z);
      head.lookAt(0, 5, coord.z);
      this.scene.add(pole, head);
    });

    // Monumental 18m Tall GOLDEN WINGED VICTORY TROPHY on Elevated Podium Plaza (At x = -40, z = -10 safely outside track)
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.95,
      roughness: 0.08,
      envMapIntensity: 3.0
    });

    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(-40, 0, -10);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 9, 16), goldMat);
    trophyStem.position.y = 9.0;
    const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 2.0, 8.0, 16), goldMat);
    trophyCup.position.y = 16.0;

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.5, 4.0), goldMat);
    wingL.position.set(-4.2, 18.5, 0);
    wingL.rotation.z = -0.35;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.5, 4.0), goldMat);
    wingR.position.set(4.2, 18.5, 0);
    wingR.rotation.z = 0.35;

    trophyGroup.add(trophyStem, trophyCup, wingL, wingR);
    this.scene.add(trophyGroup);
  }

  buildCheckpointGates() {
    // 100% OPEN AIR CHECKPOINT GANTRIES (WIDE 50-METER CLEAR SPAN):
    // ABSOLUTELY ZERO SOLID OR OPAQUE SHEETS ACROSS THE ROAD!
    // Steel spaceframe posts sit at +-24.0m (12m clear outside the 12m road!), crossbeam at 15m height!
    this.checkpoints.forEach((cp) => {
      const gateGroup = new THREE.Group();
      gateGroup.position.copy(cp.pos);
      gateGroup.rotation.y = cp.rotation;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2
      });

      const postL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 15, 1.2), steelMat);
      postL.position.set(-24.0, 7.5, 0);

      const postR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 15, 1.2), steelMat);
      postR.position.set(24.0, 7.5, 0);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(50.0, 1.8, 1.8), steelMat);
      beam.position.set(0, 15.0, 0);
      gateGroup.add(postL, postR, beam);

      const gateNeonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cp.color) });
      const neonL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 14.6, 0.3), gateNeonMat);
      neonL.position.set(-23.2, 7.5, 0);
      const neonR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 14.6, 0.3), gateNeonMat);
      neonR.position.set(23.2, 7.5, 0);
      const neonTop = new THREE.Mesh(new THREE.BoxGeometry(48.4, 0.3, 0.3), gateNeonMat);
      neonTop.position.set(0, 14.0, 0);
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
      hctx.font = 'bold 80px "Impact", sans-serif';
      hctx.textAlign = 'center';
      hctx.textBaseline = 'middle';
      hctx.shadowColor = cp.color;
      hctx.shadowBlur = 26;
      hctx.fillText(`GATE 0${cp.id} // ${cp.name}`, 512, 95);

      hctx.fillStyle = cp.color;
      hctx.font = 'bold 36px monospace';
      hctx.shadowBlur = 12;
      hctx.fillText(cp.wonder, 512, 185);

      const headerTex = new THREE.CanvasTexture(headerCanvas);
      const headerMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(24.0, 4.2),
        new THREE.MeshBasicMaterial({ map: headerTex })
      );
      headerMesh.position.set(0, 16.5, 0.1);
      gateGroup.add(headerMesh);

      // Floating Holographic Checkpoint Markers at Posts (Completely open center)
      const holoGeo = new THREE.RingGeometry(1.8, 2.4, 32);
      const holoMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cp.color),
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const holoRingL = new THREE.Mesh(holoGeo, holoMat);
      holoRingL.position.set(-12.8, 8.5, 0);
      const holoRingR = new THREE.Mesh(holoGeo, holoMat);
      holoRingR.position.set(12.8, 8.5, 0);
      gateGroup.add(holoRingL, holoRingR);

      this.scene.add(gateGroup);

      this.checkpointMeshes.push({
        id: cp.id,
        holoMat,
        color: cp.color
      });

      this.pulsingGates.push(holoRingL, holoRingR);
    });
  }

  highlightCheckpoint(activeId) {
    this.checkpointMeshes.forEach((m) => {
      if (m.id === activeId) {
        m.holoMat.opacity = 0.95;
      } else {
        m.holoMat.opacity = 0.25;
      }
    });
  }

  getClosestTrackPoint(carPos) {
    let closestPt = this.roadPoints[0];
    let minDistSq = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < this.roadPoints.length; i++) {
      const pt = this.roadPoints[i];
      const dx = carPos.x - pt.x;
      const dz = carPos.z - pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestPt = pt;
        closestIdx = i;
      }
    }

    const t = closestIdx / this.pointsCount;
    const tangent = this.curve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const toCar = new THREE.Vector3(carPos.x - closestPt.x, 0, carPos.z - closestPt.z);
    const lateralDist = toCar.dot(normal);

    return {
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
