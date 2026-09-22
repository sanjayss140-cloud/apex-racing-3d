import * as THREE from 'three';

/**
 * Builds high-fidelity, authentic 3D hypercars directly in Three.js.
 * Completely eliminates any reliance on external 3D street car models (e.g. 458 Italia)
 * and generates genuine Le Mans / track-focused hypercars matching user reference designs.
 */
export function buildProceduralHypercar(cfg) {
  const rootGroup = new THREE.Group();
  const bodyMeshes = [];
  const flames = [];

  // ========================================================
  // 1. MATERIAL PALETTE
  // ========================================================
  const paintMat = new THREE.MeshStandardMaterial({
    color: cfg.paintColor,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    envMapIntensity: 2.2
  });
  bodyMeshes.push(paintMat);

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x121215,
    roughness: 0.36,
    metalness: 0.42
  });

  const carbonGlossMat = new THREE.MeshStandardMaterial({
    color: 0x161619,
    roughness: 0.18,
    metalness: 0.65
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: cfg.accentColor,
    roughness: 0.22,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x070c18,
    roughness: 0.04,
    metalness: 0.35,
    transparent: true,
    opacity: 0.82
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.90,
    metalness: 0.05
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.94
  });

  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.28,
    metalness: 0.85
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: cfg.caliperColor || cfg.accentColor,
    roughness: 0.22,
    metalness: 0.75
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.20,
    metalness: 0.95
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.16,
    metalness: 0.92
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.08,
    metalness: 0.98
  });

  const ledWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ledCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const ledRed = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  const ledAmber = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0x990000,
    emissive: 0xff0000,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.1
  });

  const flameMat = new THREE.MeshBasicMaterial({
    color: cfg.flameColor || 0x00f0ff,
    transparent: true,
    opacity: 0.95
  });

  // Helper to add dynamic nitro exhaust flame cone
  const addFlame = (x, y, z, baseScale = 1.0, rotX = -Math.PI / 2, rotY = 0) => {
    const flameGeo = new THREE.ConeGeometry(0.09 * baseScale, 1.45 * baseScale, 12);
    flameGeo.rotateX(rotX);
    if (rotY !== 0) flameGeo.rotateY(rotY);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z);
    flame.visible = false;
    flame.baseScale = baseScale;
    rootGroup.add(flame);
    flames.push(flame);
  };

  // ========================================================
  // 2. RACING WHEEL ASSEMBLIES
  // ========================================================
  function buildWheel(radius, width, isAerodisc = false, discMat = null) {
    const wheelGroup = new THREE.Group();

    // Tire tread
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim / Center Hub
    if (isAerodisc && discMat) {
      const discGeo = new THREE.CylinderGeometry(radius * 0.94, radius * 0.94, width * 1.02, 24);
      discGeo.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, discMat);
      wheelGroup.add(disc);
    } else {
      const rimLipGeo = new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, width * 1.01, 20);
      rimLipGeo.rotateZ(Math.PI / 2);
      const rimLip = new THREE.Mesh(rimLipGeo, rimMat);
      wheelGroup.add(rimLip);

      // 5-Spoke Racing Center
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, radius * 0.70, 0.045), rimMat);
        spoke.rotation.x = angle;
        wheelGroup.add(spoke);
      }
    }

    // Brake Rotor
    const rotorGeo = new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, 0.02, 18);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, brakeMat);
    wheelGroup.add(rotor);

    // Caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, radius * 0.28, radius * 0.34), caliperMat);
    caliper.position.set(0, radius * 0.44, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  // Front Wheels with Steering Hubs
  const steerFL = new THREE.Group();
  steerFL.position.set(-0.95, 0.35, 1.42);
  const wheelFL = buildWheel(0.35, 0.30);
  steerFL.add(wheelFL);
  rootGroup.add(steerFL);

  const steerFR = new THREE.Group();
  steerFR.position.set(0.95, 0.35, 1.42);
  const wheelFR = buildWheel(0.35, 0.30);
  steerFR.add(wheelFR);
  rootGroup.add(steerFR);

  // Rear Wheels (Wider staggered racing setup)
  const isJesko = (cfg.type === 'jesko' || cfg.id === 3);
  const rearDiscMat = isJesko ? carbonMat : null;

  const wheelRL = buildWheel(0.37, 0.36, isJesko, rearDiscMat);
  wheelRL.position.set(-0.98, 0.37, -1.45);
  rootGroup.add(wheelRL);

  const wheelRR = buildWheel(0.37, 0.36, isJesko, rearDiscMat);
  wheelRR.position.set(0.98, 0.37, -1.45);
  rootGroup.add(wheelRR);

  // ========================================================
  // 3. CARBON MONOCOQUE TUB & GROUND-EFFECT FLOOR
  // ========================================================
  const floorTub = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.10, 4.45), carbonMat);
  floorTub.position.set(0, 0.12, 0);
  rootGroup.add(floorTub);

  // Exposed Carbon Side Skirts / Bargeboards
  [-1, 1].forEach(side => {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.5), carbonGlossMat);
    skirt.position.set(side * 1.02, 0.11, -0.05);
    rootGroup.add(skirt);
  });

  // ========================================================
  // 4. BESPOKE 3D HYPERCAR BODIES
  // ========================================================

  if (cfg.type === 'tourbillon' || cfg.id === 0) {
    // ========================================================
    // 0. BUGATTI BOLIDE / TOURBILLON
    // ========================================================
    // Central dropping nose & hood
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.28, 1.65), paintMat);
    nose.position.set(0, 0.36, 1.55);
    nose.rotation.x = 0.08;

    // Muscular Pontoon Front Fenders
    [-1, 1].forEach(side => {
      const fender = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.38, 1.75), paintMat);
      fender.position.set(side * 0.82, 0.44, 1.40);
      fender.rotation.x = -0.04;
      // Fender top carbon louvers
      for (let i = 0; i < 3; i++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.07), carbonMat);
        louver.position.set(side * 0.82, 0.64, 1.25 + i * 0.14);
        rootGroup.add(louver);
      }
      rootGroup.add(fender);
    });

    // Iconic Bugatti Horseshoe Center Grille
    const horseshoe = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.038, 10, 20, Math.PI), chromeMat);
    horseshoe.rotation.x = Math.PI;
    horseshoe.position.set(0, 0.28, 2.38);
    const horseshoeInner = new THREE.Mesh(new THREE.CircleGeometry(0.23, 16, 0, Math.PI), carbonMat);
    horseshoeInner.rotation.x = Math.PI;
    horseshoeInner.position.set(0, 0.28, 2.37);
    const horseshoeBorder = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.016, 8, 20, Math.PI), ledCyan);
    horseshoeBorder.rotation.x = Math.PI;
    horseshoeBorder.position.set(0, 0.28, 2.39);
    rootGroup.add(horseshoe, horseshoeInner, horseshoeBorder);

    // Front Splitter with Aero Endplates
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.06, 0.85), carbonGlossMat);
    splitter.position.set(0, 0.10, 2.22);
    [-1, 1].forEach(side => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.45), carbonGlossMat);
      endplate.position.set(side * 1.07, 0.20, 2.22);
      rootGroup.add(endplate);
    });
    rootGroup.add(nose, splitter);

    // X-Pattern Jewel Cyan Headlights
    [-1, 1].forEach(side => {
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.08), ledCyan);
      h1.position.set(side * 0.72, 0.44, 2.18);
      h1.rotation.z = side * 0.25;
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.08), ledCyan);
      h2.position.set(side * 0.72, 0.44, 2.18);
      h2.rotation.z = side * -0.25;
      rootGroup.add(h1, h2);
    });

    // Teardrop Cockpit Canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.48, 2.05), glassMat);
    canopy.position.set(0, 0.75, -0.15);
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 1.85), paintMat);
    canopyRoof.position.set(0, 0.99, -0.15);
    rootGroup.add(canopy, canopyRoof);

    // Dual Roof Ram-Air Scoops
    [-0.26, 0.26].forEach(x => {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.45), carbonMat);
      scoop.position.set(x, 1.04, 0.22);
      scoop.rotation.x = -0.12;
      rootGroup.add(scoop);
    });

    // Signature Bugatti C-Line Arcs on side flanks
    [-1, 1].forEach(side => {
      const cline = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 24, Math.PI * 1.1), accentMat);
      cline.rotation.y = side * Math.PI / 2;
      cline.rotation.z = Math.PI / 2;
      cline.position.set(side * 1.01, 0.52, -0.25);
      rootGroup.add(cline);

      // Flared rear muscular haunches
      const haunch = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 1.95), paintMat);
      haunch.position.set(side * 0.84, 0.48, -1.35);
      rootGroup.add(haunch);
    });

    // Le Mans Continuous Central Dorsal Shark Fin (From roof scoop to rear wing)
    const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 2.45), carbonGlossMat);
    sharkFin.position.set(0, 1.02, -0.95);
    const finBorder = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 2.45), ledCyan);
    finBorder.position.set(0, 1.20, -0.95);
    rootGroup.add(sharkFin, finBorder);

    // Massive Curved Le Mans Rear Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.06, 0.45), carbonGlossMat);
    wing.position.set(0, 1.12, -2.12);
    wing.rotation.x = 0.06;
    [-0.52, 0.52].forEach(x => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.22), carbonMat);
      pylon.position.set(x, 0.90, -2.10);
      pylon.rotation.x = -0.22;
      rootGroup.add(pylon);
    });
    // Wing Endplates with Cyan LED lights
    [-1.09, 1.09].forEach(x => {
      const ep = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.52), carbonMat);
      ep.position.set(x, 1.12, -2.12);
      const epLed = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.04), ledCyan);
      epLed.position.set(x, 1.12, -2.38);
      rootGroup.add(ep, epLed);
    });
    rootGroup.add(wing);

    // Full-Width X-Wing LED Taillight
    [-1, 1].forEach(side => {
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.035, 0.08), ledCyan);
      bar1.position.set(side * 0.48, 0.62, -2.26);
      bar1.rotation.z = side * 0.18;
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.035, 0.08), ledCyan);
      bar2.position.set(side * 0.48, 0.62, -2.26);
      bar2.rotation.z = side * -0.18;
      rootGroup.add(bar1, bar2);
    });

    // Aggressive Rear Diffuser & Quad Rectangular Exhausts
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.28, 0.85), carbonGlossMat);
    diffuser.position.set(0, 0.26, -2.18);
    for (let s = -3; s <= 3; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.75), carbonMat);
      strake.position.set(s * 0.28, 0.22, -2.18);
      rootGroup.add(strake);
    }
    rootGroup.add(diffuser);

    [-0.24, -0.08, 0.08, 0.24].forEach(x => {
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.16), titaniumMat);
      pipe.position.set(x, 0.42, -2.28);
      rootGroup.add(pipe);
      addFlame(x, 0.42, -2.32, 0.88);
    });
  }

  else if (cfg.type === 'huayra_bc' || cfg.id === 1) {
    // ========================================================
    // 1. PAGANI HUAYRA BC (Cherry Carbon, Roll Hoops & Cloverleaf)
    // ========================================================
    // Organic curvaceous front hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.32, 1.8), paintMat);
    hood.position.set(0, 0.38, 1.45);
    hood.rotation.x = 0.09;

    // Carbon Front Splitter with Gold Pinstripe
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.75), carbonGlossMat);
    splitter.position.set(0, 0.10, 2.18);
    const splitterStripe = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.015, 0.04), goldMat);
    splitterStripe.position.set(0, 0.12, 2.54);
    rootGroup.add(hood, splitter, splitterStripe);

    // Active Front Aerodynamic Flaps
    [-0.42, 0.42].forEach(x => {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.22), carbonMat);
      flap.position.set(x, 0.45, 1.98);
      flap.rotation.x = -0.15;
      rootGroup.add(flap);
    });

    // Dual Bi-Xenon Teardrop Headlight Pods
    [-0.72, 0.72].forEach(x => {
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.42), carbonMat);
      nacelle.position.set(x, 0.48, 1.95);
      const light1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), ledWhite);
      light1.rotation.x = Math.PI / 2;
      light1.position.set(x, 0.51, 2.14);
      const light2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), ledWhite);
      light2.rotation.x = Math.PI / 2;
      light2.position.set(x, 0.43, 2.10);
      rootGroup.add(nacelle, light1, light2);
    });

    // High Insect Leaf-Stalk Wing Mirrors (Framing chase cam view)
    [-1, 1].forEach(side => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.38, 8), carbonGlossMat);
      stalk.position.set(side * 0.88, 0.65, 0.82);
      stalk.rotation.z = side * 0.45;
      const housing = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 8), carbonMat);
      housing.position.set(side * 1.02, 0.78, 0.78);
      housing.rotation.x = Math.PI / 2;
      housing.rotation.z = side * 0.25;
      const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), chromeMat);
      mirrorGlass.rotation.y = Math.PI;
      mirrorGlass.position.set(side * 1.02, 0.78, 0.65);
      rootGroup.add(stalk, housing, mirrorGlass);
    });

    // Open Spyder Cockpit with Twin Polished Roll-Hoop Nacelles
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.44, 1.8), glassMat);
    cockpit.position.set(0, 0.68, 0.15);
    [-0.38, 0.38].forEach(x => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 8, 16, Math.PI), chromeMat);
      hoop.rotation.x = Math.PI;
      hoop.position.set(x, 0.82, -0.65);
      const spineCover = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.75, 8), carbonMat);
      spineCover.position.set(x, 0.72, -0.98);
      spineCover.rotation.x = -Math.PI / 2.3;
      rootGroup.add(hoop, spineCover);
    });
    rootGroup.add(cockpit);

    // Deep Coke-Bottle Flanks & Muscular Rear Haunches
    [-1, 1].forEach(side => {
      const flank = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 2.0), paintMat);
      flank.position.set(side * 0.85, 0.48, -1.32);
      rootGroup.add(flank);
    });

    // Towering Swan-Neck Carbon Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.40), carbonGlossMat);
    wing.position.set(0, 1.08, -2.06);
    wing.rotation.x = 0.05;
    [-0.42, 0.42].forEach(x => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.40, 0.20), carbonMat);
      pylon.position.set(x, 0.88, -2.04);
      pylon.rotation.x = -0.20;
      rootGroup.add(pylon);
    });
    rootGroup.add(wing);

    // Signature Pagani High-Mounted Quad Cloverleaf Rocket Exhaust Cluster
    const heatShield = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 10, 24), goldMat);
    heatShield.position.set(0, 0.64, -2.25);
    rootGroup.add(heatShield);

    const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12);
    pipeGeo.rotateX(Math.PI / 2);
    [[-0.055, 0.695], [0.055, 0.695], [-0.055, 0.585], [0.055, 0.585]].forEach(([x, y]) => {
      const pipe = new THREE.Mesh(pipeGeo, titaniumMat);
      pipe.position.set(x, y, -2.26);
      rootGroup.add(pipe);
      addFlame(x, y, -2.30, 0.85);
    });

    // Triple Teardrop LED Taillights
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 10), taillightMat);
        drop.rotation.x = Math.PI / 2;
        drop.position.set(side * (0.68 + i * 0.08), 0.54, -2.24);
        rootGroup.add(drop);
      }
    });
  }

  else if (cfg.type === 'apollo_ie' || cfg.id === 2) {
    // ========================================================
    // 2. APOLLO INTENSA EMOZIONE (Batmobile / Stealth Fighter)
    // ========================================================
    // Razor-Sharp Pointed Nose
    const pointedNose = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.6, 4), paintMat);
    pointedNose.rotation.x = -Math.PI / 2;
    pointedNose.rotation.y = Math.PI / 4;
    pointedNose.position.set(0, 0.36, 1.85);

    // Multi-Tier Carbon Dive Planes & Double Front Canards
    [-1, 1].forEach(side => {
      const canard1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.22), carbonGlossMat);
      canard1.position.set(side * 0.92, 0.24, 2.15);
      canard1.rotation.z = side * 0.28;
      const canard2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.18), carbonGlossMat);
      canard2.position.set(side * 0.88, 0.38, 2.05);
      canard2.rotation.z = side * 0.32;
      rootGroup.add(canard1, canard2);
    });

    // Predatory Red Slit-Eye LED Headlights
    [-0.68, 0.68].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.12), ledRed);
      eye.position.set(x, 0.44, 2.12);
      eye.rotation.z = Math.sign(x) * -0.22;
      rootGroup.add(eye);
    });
    rootGroup.add(pointedNose);

    // Faceted Fighter-Jet Cockpit Canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.2, 5), glassMat);
    canopy.rotation.x = -Math.PI / 2;
    canopy.position.set(0, 0.74, 0.10);
    rootGroup.add(canopy);

    // Stacked Carbon Engine Cooling Louvers
    for (let l = 0; l < 4; l++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(1.1 - l * 0.14, 0.03, 0.16), carbonMat);
      louver.position.set(0, 0.74 + l * 0.045, -1.05 - l * 0.22);
      louver.rotation.x = -0.22;
      rootGroup.add(louver);
    }

    // Radical 2.25m Trident Batwing Spoiler with Center Fin
    const batwing = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.06, 0.48), carbonGlossMat);
    batwing.position.set(0, 1.15, -2.12);
    batwing.rotation.x = 0.08;
    // Downward angled outer tips
    [-1, 1].forEach(side => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.48), carbonGlossMat);
      tip.position.set(side * 1.25, 1.05, -2.12);
      tip.rotation.z = side * 0.35;
      rootGroup.add(tip);
    });

    const centerFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 1.6), accentMat);
    centerFin.position.set(0, 1.05, -1.35);
    rootGroup.add(batwing, centerFin);

    // Inverted-Triangle Triple Titanium Exhaust Cannons
    const apolloPipes = [
      { x: 0, y: 0.58 },
      { x: -0.09, y: 0.48 },
      { x: 0.09, y: 0.48 }
    ];
    apolloPipes.forEach(pos => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.18, 14), titaniumMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(pos.x, pos.y, -2.26);
      rootGroup.add(pipe);
      addFlame(pos.x, pos.y, -2.30, 1.0);
    });

    // 8-Strake Razor Diffuser
    for (let s = -4; s <= 4; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.75), carbonMat);
      strake.position.set(s * 0.22, 0.24, -2.22);
      rootGroup.add(strake);
    }

    // Inverted Chevron Crimson Taillight
    [-1, 1].forEach(side => {
      const chev = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.08), ledRed);
      chev.position.set(side * 0.45, 0.64, -2.24);
      chev.rotation.z = side * -0.14;
      rootGroup.add(chev);
    });
  }

  else if (cfg.type === 'jesko' || cfg.id === 3) {
    // ========================================================
    // 3. KOENIGSEGG JESKO ABSOLUT (No Wing, Dual Apex Fins, Longtail)
    // ========================================================
    // Low-Drag Smooth Nose with Central Hood Vent
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.30, 1.85), paintMat);
    nose.position.set(0, 0.35, 1.45);
    nose.rotation.x = 0.07;
    const hoodVent = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.85), carbonMat);
    hoodVent.position.set(0, 0.42, 1.40);
    hoodVent.rotation.x = 0.18;
    rootGroup.add(nose, hoodVent);

    // Smooth Front Splitter with Vertical End Fences
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.85), carbonGlossMat);
    splitter.position.set(0, 0.10, 2.22);
    [-1.04, 1.04].forEach(x => {
      const fence = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.40), carbonMat);
      fence.position.set(x, 0.18, 2.22);
      rootGroup.add(fence);
    });
    rootGroup.add(splitter);

    // Projector Headlights
    [-0.68, 0.68].forEach(x => {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.10), ledWhite);
      light.position.set(x, 0.44, 2.15);
      rootGroup.add(light);
    });

    // Wraparound Visor Windshield Canopy
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 2.1, 16, 1, false, 0, Math.PI), glassMat);
    visor.rotation.x = -Math.PI / 2;
    visor.rotation.z = -Math.PI / 2;
    visor.position.set(0, 0.72, 0.05);
    rootGroup.add(visor);

    // PURE 500+ KM/H LOW-DRAG CONFIG: NO TOP REAR WING!
    // Twin Vertical Apex Shark Fins on Rear Haunches
    [-0.72, 0.72].forEach(x => {
      const finBody = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.42, 0.85), paintMat);
      finBody.position.set(x, 0.98, -1.82);
      const finEdge = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.85), accentMat);
      finEdge.position.set(x, 1.18, -1.82);
      rootGroup.add(finBody, finEdge);
    });

    // Elongated 0.95m Carbon Longtail Rear Extension
    const longtail = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.12, 0.95), carbonGlossMat);
    longtail.position.set(0, 0.48, -2.46);
    rootGroup.add(longtail);

    // Massive Central Jet-Thruster Exhaust Cannon
    const jetExhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 18), titaniumMat);
    jetExhaust.scale.set(1.4, 1.0, 0.8);
    jetExhaust.rotation.x = Math.PI / 2;
    jetExhaust.position.set(0, 0.42, -2.56);
    const jetInner = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 18), new THREE.MeshBasicMaterial({ color: 0x818cf8 }));
    jetInner.scale.set(1.4, 1.0, 0.8);
    jetInner.rotation.x = Math.PI / 2;
    jetInner.position.set(0, 0.42, -2.56);
    rootGroup.add(jetExhaust, jetInner);
    addFlame(0, 0.42, -2.60, 1.95);

    // Sleek Horizontal LED Taillight Strip
    const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 0.08), taillightMat);
    tailStrip.position.set(0, 0.56, -2.48);
    rootGroup.add(tailStrip);
  }

  else if (cfg.type === 'mclaren_solus' || cfg.id === 4) {
    // ========================================================
    // 4. MCLAREN SOLUS GT (Le Mans Prototype LMP / Snorkel)
    // ========================================================
    // Central Narrow Monocoque Fuselage
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 2.2), paintMat);
    fuselage.position.set(0, 0.35, 1.25);

    // Detached Pontoon Wheel Pods with Open Air Channels!
    [-1, 1].forEach(side => {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.40, 1.85), paintMat);
      pod.position.set(side * 0.90, 0.44, 1.35);
      // Open air channel between nose and pod
      const floorChannel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 1.4), carbonMat);
      floorChannel.position.set(side * 0.58, 0.12, 1.35);
      rootGroup.add(pod, floorChannel);
    });

    // Multi-Element Front Wing Splitter
    const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 0.82), carbonGlossMat);
    frontWing.position.set(0, 0.10, 2.24);
    rootGroup.add(fuselage, frontWing);

    // Single-Seater Bubble Jet Canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), glassMat);
    canopy.scale.set(1.0, 0.82, 1.9);
    canopy.position.set(0, 0.74, 0.15);
    rootGroup.add(canopy);

    // High-Rise Roof Ram-Air Snorkel Scoop (30cm above canopy!)
    const snorkel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.72), carbonGlossMat);
    snorkel.position.set(0, 1.22, -0.15);
    const snorkelOpening = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.20, 0.04), carbonMat);
    snorkelOpening.position.set(0, 1.22, 0.22);
    rootGroup.add(snorkel, snorkelOpening);

    // Giant Twin-Tier Swan-Neck GT3 Rear Wing
    const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 0.44), carbonGlossMat);
    mainWing.position.set(0, 1.18, -2.10);
    const lowerFlap = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.035, 0.26), carbonMat);
    lowerFlap.position.set(0, 1.04, -1.98);
    // Central DRS Hydraulic Box
    const drsBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.28), accentMat);
    drsBox.position.set(0, 1.18, -2.10);
    rootGroup.add(mainWing, lowerFlap, drsBox);

    // Top-Exit Exhausts Angled Upwards from Engine Deck
    [-0.18, 0.18].forEach(x => {
      const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.18, 12), titaniumMat);
      topPipe.rotation.x = Math.PI / 3;
      topPipe.position.set(x, 0.78, -1.65);
      rootGroup.add(topPipe);
      addFlame(x, 0.78, -1.72, 1.1, -Math.PI / 3);
    });

    // Full-Width Razor Blade Taillight
    const razorLight = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.035, 0.08), taillightMat);
    razorLight.position.set(0, 0.52, -2.26);
    rootGroup.add(razorLight);
  }

  else if (cfg.type === 'daytona_sp3' || cfg.id === 5) {
    // ========================================================
    // 5. FERRARI DAYTONA SP3 / 499P HYPERCAR
    // ========================================================
    // Shark-Nose Wedge with Full-Width Horizontal White LED Bar
    const wedgeNose = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.28, 1.8), paintMat);
    wedgeNose.position.set(0, 0.36, 1.50);
    wedgeNose.rotation.x = 0.08;

    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.035, 0.08), ledWhite);
    ledBar.position.set(0, 0.42, 2.22);
    rootGroup.add(wedgeNose, ledBar);

    // Muscular Rounded Wheel Arches
    [-1, 1].forEach(side => {
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.50, 0.42, 16, 1, false, 0, Math.PI), paintMat);
      arch.rotation.z = Math.PI / 2;
      arch.rotation.y = side * Math.PI / 2;
      arch.position.set(side * 0.88, 0.44, 1.40);
      rootGroup.add(arch);
    });

    // Low-Drag Cockpit Bubble & Le Mans Central Shark Fin
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.46, 2.0), glassMat);
    canopy.position.set(0, 0.72, 0.0);
    const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 1.6), carbonGlossMat);
    sharkFin.position.set(0, 0.94, -1.25);
    const finAccent = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 1.6), accentMat);
    finAccent.position.set(0, 1.09, -1.25);
    rootGroup.add(canopy, sharkFin, finAccent);

    // 5 FULL-WIDTH STACKED HORIZONTAL REAR STRAKES (SP3 Signature!)
    for (let s = 0; s < 5; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.04, 0.20), (s % 2 === 0) ? carbonGlossMat : paintMat);
      strake.position.set(0, 0.32 + s * 0.09, -2.25);
      rootGroup.add(strake);
    }

    // Monolithic Cyber Red LED Taillight Bar
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.03, 0.08), taillightMat);
    lightbar.position.set(0, 0.70, -2.26);
    rootGroup.add(lightbar);

    // Dual High-Mounted Circular Titanium Exhaust Cannons
    [-0.26, 0.26].forEach(x => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.20, 16), titaniumMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 0.54, -2.28);
      rootGroup.add(pipe);
      addFlame(x, 0.54, -2.32, 1.05);
    });
  }

  rootGroup.traverse(child => {
    if (child.isMesh) {
      child.frustumCulled = false;
    }
  });

  return {
    group: rootGroup,
    wheelFL,
    wheelFR,
    wheelRL,
    wheelRR,
    steerFL,
    steerFR,
    flames,
    taillightMat,
    bodyMeshes
  };
}
