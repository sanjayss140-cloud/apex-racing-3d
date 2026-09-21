import * as THREE from 'three';
import {
  getTokyoBuildingTexture,
  getMountainRockTexture
} from './wonderTextures.js';

// MAP 1: NEO-TOKYO MIDNIGHT CYBER EXPRESSWAY BUILDER
export function buildCyberExpresswayMap(track) {
  const roadPoints = track.roadPoints;
  const pointsCount = track.pointsCount;

  // 1. Midnight Reflective Cyber Ground
  const groundGeo = new THREE.PlaneGeometry(1800, 1800);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x030712,
    roughness: 0.85,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  track.addToTrack(ground);

  // Distant glowing cyan grid lines on the ground
  const gridHelper = new THREE.GridHelper(1600, 80, 0x00f0ff, 0x1e1b4b);
  gridHelper.position.y = 0.01;
  track.addToTrack(gridHelper);

  // 2. High-Tech Cyber Asphalt Roadway
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
    const normal = track.getNormalAt(idx);

    const leftPt = pt.clone().addScaledVector(normal, -track.roadHalfWidth);
    const rightPt = pt.clone().addScaledVector(normal, track.roadHalfWidth);

    vertices.push(leftPt.x, 0.05, leftPt.z);
    vertices.push(rightPt.x, 0.05, rightPt.z);

    const vProgress = (i / pointsCount) * 140;
    uvs.push(0, vProgress);
    uvs.push(1, vProgress);

    if (i < pointsCount) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    // Neon Curbs (Electric Cyan & Hot Magenta)
    const curbOuterL = leftPt.clone().addScaledVector(normal, -1.2);
    curbVertsL.push(curbOuterL.x, 0.12, curbOuterL.z);
    curbVertsL.push(leftPt.x, 0.05, leftPt.z);

    const curbOuterR = rightPt.clone().addScaledVector(normal, 1.2);
    curbVertsR.push(rightPt.x, 0.05, rightPt.z);
    curbVertsR.push(curbOuterR.x, 0.12, curbOuterR.z);

    const curbProg = (i / pointsCount) * 240;
    curbUvs.push(0, curbProg);
    curbUvs.push(1, curbProg);

    if (i < pointsCount) {
      const cb = i * 2;
      curbIndices.push(cb, cb + 1, cb + 2);
      curbIndices.push(cb + 1, cb + 3, cb + 2);
    }
  }

  // Cyber Road Canvas Texture with Glowing Neon Divider Lines
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0d16';
  ctx.fillRect(0, 0, 1024, 1024);

  // Outer glowing solid white lane edges
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 14;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(32, 0); ctx.lineTo(32, 1024);
  ctx.moveTo(1024 - 32, 0); ctx.lineTo(1024 - 32, 1024);
  ctx.stroke();

  // Glowing Cyan & Magenta Dash Dividers
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 8;
  ctx.setLineDash([48, 48]);
  ctx.beginPath();
  ctx.moveTo(355, 0); ctx.lineTo(355, 1024);
  ctx.stroke();

  ctx.strokeStyle = '#ec4899';
  ctx.shadowColor = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(669, 0); ctx.lineTo(669, 1024);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const roadTex = new THREE.CanvasTexture(canvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.45,
    metalness: 0.45
  });

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  track.addToTrack(roadMesh);

  // Neon Curbs
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 128;
  curbCanvas.height = 256;
  const cctx = curbCanvas.getContext('2d');
  cctx.fillStyle = '#00f0ff';
  cctx.fillRect(0, 0, 128, 128);
  cctx.fillStyle = '#ec4899';
  cctx.fillRect(0, 128, 128, 128);

  const curbTex = new THREE.CanvasTexture(curbCanvas);
  curbTex.wrapS = THREE.RepeatWrapping;
  curbTex.wrapT = THREE.RepeatWrapping;

  const curbMat = new THREE.MeshStandardMaterial({
    map: curbTex,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.5
  });

  const curbGeoL = new THREE.BufferGeometry();
  curbGeoL.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsL, 3));
  curbGeoL.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeoL.setIndex(curbIndices);
  curbGeoL.computeVertexNormals();
  track.addToTrack(new THREE.Mesh(curbGeoL, curbMat));

  const curbGeoR = new THREE.BufferGeometry();
  curbGeoR.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsR, 3));
  curbGeoR.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeoR.setIndex(curbIndices);
  curbGeoR.computeVertexNormals();
  track.addToTrack(new THREE.Mesh(curbGeoR, curbMat));

  // Glowing Neon Armco Guardrails
  track.buildContinuousArmcoGuardrails(roadPoints, track.roadHalfWidth + 1.5, true);

  // 3. Cyber Skyscraper Metropolis
  const officeTex = getTokyoBuildingTexture('office');
  const neonTex = getTokyoBuildingTexture('neon');

  const bldgMatOffice = new THREE.MeshStandardMaterial({ map: officeTex, roughness: 0.2, metalness: 0.85 });
  const bldgMatNeon = new THREE.MeshStandardMaterial({
    map: neonTex,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.9
  });

  // Dense skyscraper field flanking the circuit
  for (let i = 0; i < roadPoints.length; i += 8) {
    const pt = roadPoints[i];
    const normal = track.getNormalAt(i);
    const distOffsets = [-55, -95, 55, 95];

    distOffsets.forEach((dist, dIdx) => {
      const bx = pt.x + normal.x * dist + (Math.sin(i * 3 + dIdx) * 15);
      const bz = pt.z + normal.z * dist + (Math.cos(i * 3 + dIdx) * 15);

      if (track.getDistToTrack(bx, bz) > track.roadHalfWidth + 24.0) {
        const bw = 24 + ((i * 7) % 24);
        const bd = 24 + ((i * 11) % 24);
        const bh = 70 + ((i * 19 + dIdx * 25) % 150);

        const bGeo = new THREE.BoxGeometry(bw, bh, bd);
        const bMat = (i % 3 === 0) ? bldgMatNeon : bldgMatOffice;
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(bx, bh / 2, bz);
        track.addToTrack(bMesh);

        // Holographic rooftop beacon
        if (bh > 120) {
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(2.0, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xec4899 })
          );
          beacon.position.set(bx, bh + 2, bz);
          track.addToTrack(beacon);
        }
      }
    });
  }

  // 4. Tokyo Bay Underwater Glass Tunnel (Road indices 280 to 340)
  buildUnderwaterGlassTunnel(track, 280, 340);

  // 5. Odaiba Rainbow Suspension Bridge (Road indices 380 to 420)
  buildRainbowSuspensionBridge(track, 380, 420);
}

function buildUnderwaterGlassTunnel(track, startIdx, endIdx) {
  const roadPoints = track.roadPoints;
  const ringGeo = new THREE.TorusGeometry(17.5, 0.45, 12, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.05,
    metalness: 0.4,
    transparent: true,
    opacity: 0.42
  });

  for (let i = startIdx; i <= endIdx; i += 3) {
    const pt = roadPoints[i];
    const heading = track.getHeadingAt(i);

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pt.x, 6.0, pt.z);
    ring.rotation.y = heading;
    track.addToTrack(ring);
    track.pulsingGates.push(ring);
  }

  // Digital Ocean Floor around tunnel
  const oceanGeo = new THREE.PlaneGeometry(350, 350);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.1,
    metalness: 0.85
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  const centerPt = roadPoints[Math.floor((startIdx + endIdx) / 2)];
  ocean.position.set(centerPt.x, -0.8, centerPt.z);
  track.addToTrack(ocean);
}

function buildRainbowSuspensionBridge(track, startIdx, endIdx) {
  const roadPoints = track.roadPoints;
  const pStart = roadPoints[startIdx];
  const pEnd = roadPoints[endIdx];

  const towerGeo = new THREE.BoxGeometry(4.0, 85, 4.0);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.85 });

  const nStart = track.getNormalAt(startIdx);
  const nEnd = track.getNormalAt(endIdx);

  [-1, 1].forEach(side => {
    const t1 = new THREE.Mesh(towerGeo, towerMat);
    t1.position.copy(pStart).addScaledVector(nStart, side * (track.roadHalfWidth + 3.5));
    t1.position.y = 42;
    track.addToTrack(t1);

    const t2 = new THREE.Mesh(towerGeo, towerMat);
    t2.position.copy(pEnd).addScaledVector(nEnd, side * (track.roadHalfWidth + 3.5));
    t2.position.y = 42;
    track.addToTrack(t2);

    // Glowing rainbow suspension cable
    const cableGeo = new THREE.CylinderGeometry(0.2, 0.2, pStart.distanceTo(pEnd), 8);
    cableGeo.rotateX(Math.PI / 2);
    const cableMat = new THREE.MeshBasicMaterial({ color: side === 1 ? 0x00f0ff : 0xec4899 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set((pStart.x + pEnd.x) / 2, 75, (pStart.z + pEnd.z) / 2);
    cable.lookAt(pEnd.x, 75, pEnd.z);
    track.addToTrack(cable);
  });
}

// MAP 2: VOLCANIC INFERNO & OBSIDIAN CANYON BUILDER
export function buildVolcanicInfernoMap(track) {
  const roadPoints = track.roadPoints;
  const pointsCount = track.pointsCount;

  // 1. Scorched Obsidian Basalt Ground
  const groundGeo = new THREE.PlaneGeometry(1800, 1800);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x140606,
    roughness: 0.95,
    metalness: 0.05
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.05;
  track.addToTrack(ground);

  // 2. Giant Boiling Molten Lava Sea in Caldera Center
  const lavaGeo = new THREE.PlaneGeometry(750, 750);
  lavaGeo.rotateX(-Math.PI / 2);
  const lavaMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.7
  });
  const lavaSea = new THREE.Mesh(lavaGeo, lavaMat);
  lavaSea.position.set(-60, -0.6, 20);
  track.addToTrack(lavaSea);

  // 3. Basalt Asphalt Road with Glowing Magma Crack Curbs
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
    const normal = track.getNormalAt(idx);

    const leftPt = pt.clone().addScaledVector(normal, -track.roadHalfWidth);
    const rightPt = pt.clone().addScaledVector(normal, track.roadHalfWidth);

    vertices.push(leftPt.x, 0.05, leftPt.z);
    vertices.push(rightPt.x, 0.05, rightPt.z);

    const vProgress = (i / pointsCount) * 130;
    uvs.push(0, vProgress);
    uvs.push(1, vProgress);

    if (i < pointsCount) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2);
      indices.push(b + 1, b + 3, b + 2);
    }

    // Molten Lava Curbs
    const curbOuterL = leftPt.clone().addScaledVector(normal, -1.2);
    curbVertsL.push(curbOuterL.x, 0.12, curbOuterL.z);
    curbVertsL.push(leftPt.x, 0.05, leftPt.z);

    const curbOuterR = rightPt.clone().addScaledVector(normal, 1.2);
    curbVertsR.push(rightPt.x, 0.05, rightPt.z);
    curbVertsR.push(curbOuterR.x, 0.12, curbOuterR.z);

    const curbProg = (i / pointsCount) * 220;
    curbUvs.push(0, curbProg);
    curbUvs.push(1, curbProg);

    if (i < pointsCount) {
      const cb = i * 2;
      curbIndices.push(cb, cb + 1, cb + 2);
      curbIndices.push(cb + 1, cb + 3, cb + 2);
    }
  }

  // Dark Basalt Road Texture
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#120d0d';
  ctx.fillRect(0, 0, 1024, 1024);

  // Basalt texture flecks
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#1c1414' : '#080505';
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
  }

  // Scorched Orange/Amber Lane Dividers
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 14;
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(32, 0); ctx.lineTo(32, 1024);
  ctx.moveTo(1024 - 32, 0); ctx.lineTo(1024 - 32, 1024);
  ctx.stroke();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.setLineDash([50, 46]);
  ctx.beginPath();
  ctx.moveTo(355, 0); ctx.lineTo(355, 1024);
  ctx.moveTo(669, 0); ctx.lineTo(669, 1024);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const roadTex = new THREE.CanvasTexture(canvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.75,
    metalness: 0.2
  });

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  track.addToTrack(roadMesh);

  // Molten Curbs
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 128;
  curbCanvas.height = 256;
  const cctx = curbCanvas.getContext('2d');
  cctx.fillStyle = '#dc2626';
  cctx.fillRect(0, 0, 128, 128);
  cctx.fillStyle = '#f59e0b';
  cctx.fillRect(0, 128, 128, 128);

  const curbTex = new THREE.CanvasTexture(curbCanvas);
  curbTex.wrapS = THREE.RepeatWrapping;
  curbTex.wrapT = THREE.RepeatWrapping;

  const curbMat = new THREE.MeshStandardMaterial({
    map: curbTex,
    emissive: 0xea580c,
    emissiveIntensity: 0.4,
    roughness: 0.4,
    metalness: 0.3
  });

  const curbGeoL = new THREE.BufferGeometry();
  curbGeoL.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsL, 3));
  curbGeoL.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeoL.setIndex(curbIndices);
  curbGeoL.computeVertexNormals();
  track.addToTrack(new THREE.Mesh(curbGeoL, curbMat));

  const curbGeoR = new THREE.BufferGeometry();
  curbGeoR.setAttribute('position', new THREE.Float32BufferAttribute(curbVertsR, 3));
  curbGeoR.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeoR.setIndex(curbIndices);
  curbGeoR.computeVertexNormals();
  track.addToTrack(new THREE.Mesh(curbGeoR, curbMat));

  // Molten Hazard Barriers
  track.buildContinuousArmcoGuardrails(roadPoints, track.roadHalfWidth + 1.5, false, true);

  // 4. Volcanic Spires & Obsidian Canyon Massifs
  const rockTex = getMountainRockTexture();
  const obsidianMat = new THREE.MeshStandardMaterial({
    map: rockTex,
    color: 0x261414,
    roughness: 0.9,
    metalness: 0.1
  });

  // Massive volcanic peaks
  const peaks = [
    { x: -350, z: -200, r: 85, h: 140 },
    { x: -280, z: -270, r: 95, h: 170 },
    { x: -160, z: -280, r: 80, h: 130 },
    { x: 260, z: -220,  r: 90, h: 155 },
    { x: 340, z: -100,  r: 100, h: 165 },
    { x: 300, z: 120,   r: 85, h: 145 },
    { x: 180, z: 280,   r: 75, h: 125 }
  ];

  peaks.forEach(p => {
    if (track.getDistToTrack(p.x, p.z) > track.roadHalfWidth + 28.0) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 7), obsidianMat);
      cone.position.set(p.x, p.h / 2, p.z);
      track.addToTrack(cone);
    }
  });

  // 5. Obsidian Natural Arch Bridge (Road index 215)
  buildObsidianBasaltArch(track, 215);

  // 6. Sulfur & Steam Geyser Columns
  buildSulfurGeysers(track);
}

function buildObsidianBasaltArch(track, roadIdx) {
  const pt = track.roadPoints[roadIdx];
  const normal = track.getNormalAt(roadIdx);
  const heading = track.getHeadingAt(roadIdx);

  const archMat = new THREE.MeshStandardMaterial({
    color: 0x1f1010,
    roughness: 0.85,
    metalness: 0.15
  });

  const archGroup = new THREE.Group();
  archGroup.position.copy(pt);
  archGroup.rotation.y = heading;

  // Left & Right Basalt Columns
  const colGeo = new THREE.CylinderGeometry(4.2, 5.8, 32, 6);
  const colL = new THREE.Mesh(colGeo, archMat);
  colL.position.set(-track.roadHalfWidth - 6.0, 16, 0);
  const colR = new THREE.Mesh(colGeo, archMat);
  colR.position.set(track.roadHalfWidth + 6.0, 16, 0);

  // Spanning Obsidian Arch Lintel
  const lintelGeo = new THREE.BoxGeometry(track.roadWidth + 18.0, 6.5, 14.0);
  const lintel = new THREE.Mesh(lintelGeo, archMat);
  lintel.position.set(0, 31, 0);

  // Hanging glowing stalactites
  const stalMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  for (let s = -8; s <= 8; s += 4) {
    const stal = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4.2, 5), stalMat);
    stal.rotation.x = Math.PI;
    stal.position.set(s * 1.5, 27, 0);
    archGroup.add(stal);
  }

  archGroup.add(colL, colR, lintel);
  track.addToTrack(archGroup);
}

function buildSulfurGeysers(track) {
  const geyserCoords = [
    { idx: 60, side: 1 },
    { idx: 150, side: -1 },
    { idx: 240, side: 1 },
    { idx: 330, side: -1 },
    { idx: 420, side: 1 },
    { idx: 510, side: -1 }
  ];

  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.45
  });

  geyserCoords.forEach(g => {
    const pt = track.roadPoints[g.idx];
    const normal = track.getNormalAt(g.idx);
    const ventPos = pt.clone().addScaledVector(normal, g.side * (track.roadHalfWidth + 12.0));

    // Base crater
    const crater = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 4.8, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x271313, roughness: 0.9 })
    );
    crater.position.set(ventPos.x, 0.9, ventPos.z);
    track.addToTrack(crater);

    // Steam plume column
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.8, 18, 8), steamMat);
    plume.position.set(ventPos.x, 10, ventPos.z);
    track.addToTrack(plume);
    track.pulsingGates.push(plume);
  });
}
