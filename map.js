/* =========================================================================
   MAP.JS - High-Fidelity 3D Antarctic Digital Twin Engine
   ========================================================================= */

const StationMap = (() => {
  const SCHEMATICS_2D = {
    bharati: [
      { id: "bharati-main",        name: "Main Monolith Complex", x: 220, y: 90,  w: 200, h: 120 },
      { id: "bharati-lab-ocean",   name: "Oceanography Lab",      x: 440, y: 70,  w: 130, h: 70  },
      { id: "bharati-lab-glacio",  name: "Glaciology Ice Vault",  x: 440, y: 160, w: 130, h: 70  },
      { id: "bharati-cogen",       name: "Scania CHP 1 & 2",      x: 60,  y: 60,  w: 130, h: 80  },
      { id: "bharati-fuel",        name: "ISO Fuel Storage",      x: 60,  y: 160, w: 130, h: 75  },
      { id: "bharati-helipad",     name: "Heavy Helipad",         x: 230, y: 240, w: 180, h: 70  },
      { id: "bharati-satcom-isro", name: "ISRO Ground Radome",    x: 440, y: 250, w: 130, h: 70  }
    ],
    maitri: [
      { id: "maitri-main",      name: "Main Living Complex",   x: 220, y: 90,  w: 200, h: 110 },
      { id: "maitri-lounge",    name: "Observation Solarium",  x: 430, y: 150, w: 110, h: 60  },
      { id: "maitri-gen",       name: "Internal Power Plant",  x: 60,  y: 110, w: 130, h: 75  },
      { id: "maitri-water",     name: "Lake Pump Pier",        x: 60,  y: 40,  w: 130, h: 60  },
      { id: "maitri-workshop",  name: "Quonset Workshop",      x: 60,  y: 200, w: 130, h: 75  },
      { id: "maitri-fuel-farm", name: "Cylindrical Fuel Farm", x: 210, y: 230, w: 140, h: 75  },
      { id: "maitri-helipad",   name: "Polar Helipad",         x: 440, y: 230, w: 120, h: 80  }
    ]
  };

  const ASSET_REGISTRY = {
    // BHARATI ASSETS
    "bharati-main": {
      name: "Bharati Monolith Main Complex", category: "Habitat & Operations",
      desc: "3-story aerodynamic monolith clad in composite titanium panels elevated on hydraulic stilts to let polar blizzards pass underneath.",
      tempOffset: 0, loadFactor: 1.0, metricType: "Occupancy", metricVal: "47 PAX"
    },
    "bharati-lab-ocean": {
      name: "Oceanography & Marine Biology Lab", category: "Scientific Research",
      desc: "Continuous Southern Ocean seawater sampling, microbiology clean room, and CTD profiler analysis rack.",
      tempOffset: -1.2, loadFactor: 0.85, metricType: "Salinity Loop", metricVal: "34.2 PSU"
    },
    "bharati-lab-glacio": {
      name: "Glaciology Ice-Core Facility", category: "Scientific Research",
      desc: "Sub-zero -20°C archival storage keeping historical Antarctic ice cores preserved with stable isotope spectrometers.",
      tempOffset: -42.0, loadFactor: 0.9, metricType: "Vault Temp", metricVal: "-20.2°C"
    },
    "bharati-cogen-01": {
      name: "Scania CHP Cogeneration Unit 1", category: "Power Generation",
      desc: "High-efficiency polar turbo-diesel engine with exhaust and jacket water heat recovery district loop.",
      tempOffset: 56.0, loadFactor: 1.2, metricType: "Gen Output", metricVal: "520 kW"
    },
    "bharati-cogen-02": {
      name: "Scania CHP Cogeneration Unit 2", category: "Power Generation",
      desc: "Secondary synchronized CHP generator balancing grid load during high thermal demand.",
      tempOffset: 52.0, loadFactor: 1.1, metricType: "Gen Output", metricVal: "480 kW"
    },
    "bharati-fuel": {
      name: "Double-Walled Fuel Depot Complex", category: "Energy Storage",
      desc: "ISO-containerized double-shell fuel reservoir with continuous ultrasonic leak monitoring and heated suction manifolds.",
      tempOffset: -34.0, loadFactor: 0.4, metricType: "Reserve Buffer", metricVal: "22,400 L"
    },
    "bharati-satcom-isro": {
      name: "ISRO Deep Space Ground Radome", category: "Communications",
      desc: "7.5m full-motion tracking parabolic antenna relaying polar Earth observation satellite downlinks to NRSC Shadnagar.",
      tempOffset: -10.0, loadFactor: 0.7, metricType: "Downlink", metricVal: "320 Mbps"
    },
    "bharati-helipad": {
      name: "Heavy Helipad & Approach Deck", category: "Logistics",
      desc: "Heated solid bedrock landing deck with PAPI perimeter lighting for Kamov Ka-32 and Bell 407 helicopter operations.",
      tempOffset: -45.0, loadFactor: 0.3, metricType: "Approach Lights", metricVal: "100% PAPI"
    },
    "bharati-clean-energy": {
      name: "Clean Energy Polar Wind Turbine", category: "Renewable Power",
      desc: "Cold-climate direct-drive wind turbine with heated blades feeding supplemental clean electricity to the station microgrid.",
      tempOffset: -40.0, loadFactor: 0.75, metricType: "Turbine Gen", metricVal: "140 kW"
    },

    // MAITRI ASSETS
    "maitri-main": {
      name: "Main Station Complex (Central Hub)", category: "Habitat & Operations",
      desc: "Central U-shaped containerized living quarters on steel stilts connecting science labs, radio room, hospital, and mess hall.",
      tempOffset: 0, loadFactor: 1.0, metricType: "Occupancy", metricVal: "25 PAX"
    },
    "maitri-lounge": {
      name: "Glazed Observation Solarium", category: "Welfare & Operations",
      desc: "Panoramic triple-glazed solarium at southeast corner of Maitri Station providing passive solar heat and crew recreation.",
      tempOffset: 1.5, loadFactor: 0.5, metricType: "Solar Flux", metricVal: "240 W/m²"
    },
    "maitri-internal-gen": {
      name: "Internal Diesel Generator Room", category: "Power Generation",
      desc: "Primary Caterpillar 500 kVA polar diesel genset with district hydronic heat exchangers channeling warmth to station radiators.",
      tempOffset: 65.0, loadFactor: 1.25, metricType: "Primary Load", metricVal: "420 kW"
    },
    "maitri-water": {
      name: "Priyadarshini Pump & Heated Pipeline", category: "Life Support & Utilities",
      desc: "Dual insulated water reservoir fed continuously by an elevated electrically trace-heated pipeline from Lake Priyadarshini.",
      tempOffset: -14.0, loadFactor: 0.6, metricType: "Pipeline Flow", metricVal: "4.5 L/s"
    },
    "maitri-workshop": {
      name: "Quonset Barrel-Vault Workshop", category: "Logistics & Maintenance",
      desc: "Curved aerodynamic hangar with 5-ton overhead gantry crane for servicing heavy PistenBully tracked snowcats.",
      tempOffset: -10.0, loadFactor: 0.8, metricType: "Hydraulic Lift", metricVal: "8.5 Bar"
    },
    "maitri-fuel-farm": {
      name: "Liquid Fuel Storage Farm Cluster", category: "Energy Storage",
      desc: "16 cylindrical tanks and drum depots holding low-freeze Aviation Turbine Fuel with secondary containment berms.",
      tempOffset: -35.0, loadFactor: 0.5, metricType: "Fuel Autonomy", metricVal: "185,000 L"
    },
    "maitri-satellite-dish": {
      name: "Satellite Ground Station Radome", category: "Communications",
      desc: "4.2m tracking dish linking Maitri continuously to NCPOR Goa via GSAT-7A C-band transponders.",
      tempOffset: -20.0, loadFactor: 0.65, metricType: "Link C/N", metricVal: "18.4 dB"
    },
    "maitri-helipad": {
      name: "Elevated Polar Helipad", category: "Logistics",
      desc: "Steel stilt elevated touchdown platform with perimeter lighting and windsock mast.",
      tempOffset: -45.0, loadFactor: 0.2, metricType: "Touchdown Deck", metricVal: "Certified"
    }
  };

  let svgEl = null;
  let canvas3d = null;
  let tooltipEl = null;
  let renderer, scene, camera, controls, animId;
  let terrainMesh = null;
  let waterFeatureGroup = null;
  let stationGroup = null;
  let snowParticles = null;
  let auroraRibbons = [];
  let is3dMode = false;

  // Interactive Raycasting
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const interactableMeshes = [];
  let hoveredAssetGroup = null;

  // Subsystem animations
  const rotatingRotors = [];
  let trackingSatGimbal = null;
  const vibratingGenerators = [];

  function build(svgElement) {
    svgEl = svgElement;
    const stage = document.getElementById("mapStage");
    render2D();
    init3D(stage);
    bindModalEvents();
  }

  // =========================================================================
  // 1. 2D SCHEMATIC RENDERER (SVG)
  // =========================================================================
  function render2D() {
    if (!svgEl) return;
    svgEl.innerHTML = "";

    const key = Telemetry.getActiveStationKey();
    const modules = SCHEMATICS_2D[key] || SCHEMATICS_2D.bharati;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "map-scene");

    modules.forEach(m => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
      node.setAttribute("class", "station-module");

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", m.x);
      rect.setAttribute("y", m.y);
      rect.setAttribute("width", m.w);
      rect.setAttribute("height", m.h);
      rect.setAttribute("rx", 10);
      rect.setAttribute("fill", "rgba(0,180,216,0.18)");
      rect.setAttribute("stroke", "var(--soft-aurora)");
      rect.setAttribute("stroke-width", "1.2");
      node.appendChild(rect);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", m.x + m.w / 2);
      title.setAttribute("y", m.y + m.h / 2 - 2);
      title.setAttribute("text-anchor", "middle");
      title.textContent = m.id.toUpperCase();
      node.appendChild(title);

      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("x", m.x + m.w / 2);
      sub.setAttribute("y", m.y + m.h / 2 + 14);
      sub.setAttribute("text-anchor", "middle");
      sub.setAttribute("font-size", "9");
      sub.setAttribute("fill", "var(--text-muted)");
      sub.textContent = m.name;
      node.appendChild(sub);

      node.addEventListener("click", () => openAssetPopup(m.id));
      g.appendChild(node);
    });

    svgEl.appendChild(g);
  }

  // =========================================================================
  // 2. THREE.JS INITIALIZATION (SceneContainer.jsx Architecture)
  // =========================================================================
  function init3D(container) {
    canvas3d = document.createElement("canvas");
    canvas3d.id = "station3dCanvas";
    container.appendChild(canvas3d);

    // Hover tooltip pill
    tooltipEl = document.createElement("div");
    tooltipEl.className = "asset-hover-tooltip";
    container.appendChild(tooltipEl);

    const w = container.clientWidth || 640;
    const h = container.clientHeight || 350;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas3d,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    scene = new THREE.Scene();
    scene.background = new THREE.Color("#050d1a");
    scene.fog = new THREE.FogExp2(0x07152b, 0.012);

    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 700);
    camera.position.set(32, 22, 34);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.target.set(0, 2, 0);

    // Celestial Sky Dome
    buildAtmosphereDome();

    // Multitier Aurora Australis
    buildAuroraAustralis();

    // SceneContainer Lights
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0a192f, 0.75);
    scene.add(hemiLight);

    const polarSun = new THREE.DirectionalLight(0xfed7aa, 1.6);
    polarSun.position.set(45, 35, 25);
    polarSun.castShadow = true;
    polarSun.shadow.mapSize.width = 2048;
    polarSun.shadow.mapSize.height = 2048;
    polarSun.shadow.bias = -0.0004;
    scene.add(polarSun);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.8);
    rimLight.position.set(-35, 20, -35);
    scene.add(rimLight);

    const auroraFill = new THREE.DirectionalLight(0x10b981, 0.35);
    auroraFill.position.set(0, 45, 0);
    scene.add(auroraFill);

    // Snow particle system
    buildSnowParticles();

    // Pointer events
    canvas3d.addEventListener("mousemove", onPointerMove);
    canvas3d.addEventListener("click", onPointerClick);
    window.addEventListener("resize", onResize);

    loadStationTwin(Telemetry.getActiveStationKey());
  }

  // --- Polar Atmosphere Dome ---
  function buildAtmosphereDome() {
    const canvas = document.createElement("canvas");
    canvas.width = 32; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, "#020617");
    grad.addColorStop(0.3, "#07162c");
    grad.addColorStop(0.55, "#0a2540");
    grad.addColorStop(0.75, "#0d4a5d");
    grad.addColorStop(0.9, "#064e3b");
    grad.addColorStop(1.0, "#030d1d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const domeMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 24), domeMat);
    dome.position.y = -5;
    scene.add(dome);
  }

  // --- Aurora Australis Ribbons ---
  function buildAuroraAustralis() {
    auroraRibbons = [];
    const auroraGroup = new THREE.Group();
    auroraGroup.position.set(0, 0, -45);
    auroraGroup.rotation.set(0.15, 0.35, 0);

    const tiers = [
      { y: 38, z: 0,   w: 160, h: 32, col: 0x10b981, op: 0.4 },
      { y: 44, z: -12, w: 140, h: 26, col: 0x06b6d4, op: 0.35 },
      { y: 50, z: -24, w: 130, h: 22, col: 0xa855f7, op: 0.28 }
    ];

    tiers.forEach((t, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: t.col, transparent: true, opacity: t.op, side: THREE.DoubleSide, depthWrite: false, fog: false
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(t.w, t.h, 32, 8), mat);
      mesh.position.set(0, t.y, t.z);
      auroraGroup.add(mesh);
      auroraRibbons.push({ mesh, baseY: t.y, speed: 0.25 + i * 0.08 });
    });

    scene.add(auroraGroup);
  }

  // --- Snow Particles (SnowParticles.jsx) ---
  function buildSnowParticles() {
    const count = 900;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 140;

      spd[i * 3] = 0.5 + Math.random() * 0.7;
      spd[i * 3 + 1] = 0.8 + Math.random() * 1.2;
      spd[i * 3 + 2] = 0.3 + Math.random() * 0.5;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.userData = { speeds: spd };

    const mat = new THREE.PointsMaterial({
      size: 0.26, color: 0xf0f9ff, transparent: true, opacity: 0.75, depthWrite: false
    });
    snowParticles = new THREE.Points(geom, mat);
    scene.add(snowParticles);
  }

  // =========================================================================
  // 3. TOPOGRAPHIC ELEVATION TERRAIN (Terrain.jsx)
  // =========================================================================
  function buildTerrain(stationKey) {
    if (terrainMesh) scene.remove(terrainMesh);
    if (waterFeatureGroup) scene.remove(waterFeatureGroup);

    const geo = new THREE.PlaneGeometry(150, 150, 64, 64);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const colLakeBed = new THREE.Color("#0369a1");
    const colLakeShore = new THREE.Color("#38bdf8");
    const colStationPad = new THREE.Color("#1e293b");
    const colStationEdge = new THREE.Color("#334155");
    const colSnowLow = new THREE.Color("#93c5fd");
    const colSnowMid = new THREE.Color("#e0f2fe");
    const colSnowPeak = new THREE.Color("#ffffff");
    const tempCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      let elevation = 0;
      let colorType = "snow";

      if (stationKey === "maitri") {
        const inPad = Math.abs(x) < 30 && y > -13 && y < 24;
        if (inPad) {
          elevation = 0;
          colorType = "pad";
        } else if (y <= -13) {
          elevation = -Math.min(2.5, Math.abs(y + 13) * 0.24);
          colorType = "lake";
        } else {
          const d = Math.sqrt(x * x + y * y);
          if (d > 28) elevation = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 3.5;
        }
      } else {
        if (y < -16) {
          elevation = -2.8 + Math.sin(x * 0.1) * 0.4;
          colorType = "ocean";
        } else {
          const d = Math.sqrt(x * x + y * y);
          if (d > 20) elevation = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 2.8;
        }
      }

      pos.setZ(i, elevation);

      if (colorType === "pad") {
        const d = Math.hypot(x, y - 5) / 30;
        tempCol.copy(colStationPad).lerp(colStationEdge, Math.min(1, d));
      } else if (colorType === "lake" || colorType === "ocean") {
        tempCol.copy(colLakeShore).lerp(colLakeBed, Math.min(1, Math.abs(elevation) / 2.5));
      } else {
        if (elevation <= 0.8) {
          tempCol.copy(colSnowLow).lerp(colSnowMid, Math.max(0, elevation / 0.8));
        } else {
          tempCol.copy(colSnowMid).lerp(colSnowPeak, Math.min(1, (elevation - 0.8) / 3.2));
        }
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    terrainMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.72, metalness: 0.12, flatShading: true
    }));
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Cyber-CAD Grid & Rings Overlay
    waterFeatureGroup = new THREE.Group();
    const grid = new THREE.GridHelper(130, 65, 0x06b6d4, 0x1e293b);
    grid.position.y = 0.03;
    waterFeatureGroup.add(grid);

    [18, 32, 48].forEach((r, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.22, 64),
        new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x06b6d4 : 0x0284c7, transparent: true, opacity: 0.35 - idx * 0.08, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      waterFeatureGroup.add(ring);
    });

    if (stationKey === "maitri") {
      const lake = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, roughness: 0.1, transparent: true, opacity: 0.88 })
      );
      lake.rotation.x = -Math.PI / 2;
      lake.position.set(0, -0.28, -22);
      waterFeatureGroup.add(lake);

      const lakeLight = new THREE.PointLight(0x06b6d4, 2.5, 30);
      lakeLight.position.set(0, 2, -22);
      waterFeatureGroup.add(lakeLight);
    } else {
      const ocean = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 32),
        new THREE.MeshStandardMaterial({ color: 0x022c4d, emissive: 0x0369a1, emissiveIntensity: 0.35, roughness: 0.15, transparent: true, opacity: 0.94 })
      );
      ocean.rotation.x = -Math.PI / 2;
      ocean.position.set(0, -2.4, -34);
      waterFeatureGroup.add(ocean);

      [-30, -15, 0, 16, 32].forEach((px, idx) => {
        const ice = new THREE.Mesh(new THREE.BoxGeometry(4.5 + idx * 0.4, 0.6, 3.5), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.6 }));
        ice.position.set(px, -2.1, -32 + Math.cos(idx) * 3);
        waterFeatureGroup.add(ice);
      });
    }

    scene.add(waterFeatureGroup);
  }

  // =========================================================================
  // 4. STATION TWIN BUILDERS (BharatiStation3D & MaitriStation3D)
  // =========================================================================
  function registerAssetGroup(group, assetId) {
    group.userData = { assetId };
    group.traverse(child => {
      if (child.isMesh) {
        child.userData = { assetId, parentGroup: group };
        interactableMeshes.push(child);
      }
    });
    stationGroup.add(group);
  }

  function loadStationTwin(stationKey) {
    if (stationGroup) scene.remove(stationGroup);
    stationGroup = new THREE.Group();
    interactableMeshes.length = 0;
    rotatingRotors.length = 0;
    vibratingGenerators.length = 0;
    trackingSatGimbal = null;

    buildTerrain(stationKey);

    if (stationKey === "maitri") {
      buildMaitriModels();
      camera.position.set(24, 18, 26);
    } else {
      buildBharatiModels();
      camera.position.set(26, 20, 28);
    }

    scene.add(stationGroup);
  }

  // --- BHARATI 3D MODELS ---
  function buildBharatiModels() {
    const stiltMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

    // 1. Monolith Habitat
    const main = new THREE.Group();
    main.position.set(0, 0, 0);

    const stiltGeom = new THREE.CylinderGeometry(0.22, 0.28, 1.8, 12);
    [-4.2, -1.4, 1.4, 4.2].forEach(x => {
      [-2.8, 0, 2.8].forEach(z => {
        const s = new THREE.Mesh(stiltGeom, stiltMat);
        s.position.set(x, 0.9, z);
        main.add(s);
      });
    });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(11.2, 2.2, 7.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 }));
    hull.position.set(0, 2.8, 0);
    main.add(hull);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(11.2, 1.8, 1.6), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.2 }));
    nose.position.set(0, 2.8, -4.0);
    nose.rotation.x = -0.45;
    main.add(nose);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(11.3, 0.6, 7.3), new THREE.MeshStandardMaterial({
      color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.5, transparent: true, opacity: 0.85, roughness: 0.1
    }));
    deck.position.set(0, 3.1, 0);
    main.add(deck);

    const cStrip = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.9 }));
    cStrip.position.set(0, 3.8, 3.62);
    const oStrip = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.8 }));
    oStrip.position.set(0, 3.6, 3.62);
    main.add(cStrip, oStrip);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.2, 5.8), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    roof.position.set(0, 4.05, 0);
    main.add(roof);

    [-3.2, 3.2].forEach(dx => {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1 }));
      dome.position.set(dx, 4.5, 1.4);
      main.add(dome);
    });
    registerAssetGroup(main, "bharati-main");

    // 2. Oceanography Lab
    const ocean = new THREE.Group();
    ocean.position.set(8, 0, 3);
    [-1.8, 1.8].forEach(x => [-1.2, 1.2].forEach(z => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), stiltMat);
      s.position.set(x, 0.6, z);
      ocean.add(s);
    }));
    const oHull = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 3.2), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 }));
    oHull.position.set(0, 1.8, 0);
    ocean.add(oHull);
    registerAssetGroup(ocean, "bharati-lab-ocean");

    // 3. Glaciology Vault
    const glacio = new THREE.Group();
    glacio.position.set(7, 0, -6);
    [-1.8, 1.8].forEach(x => [-1.2, 1.2].forEach(z => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), stiltMat);
      s.position.set(x, 0.6, z);
      glacio.add(s);
    }));
    const gHull = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 3.2), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.2 }));
    gHull.position.set(0, 1.8, 0);
    glacio.add(gHull);
    [-1.0, 1.0].forEach(cx => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
      c.position.set(cx, 2.8, 0);
      glacio.add(c);
    });
    registerAssetGroup(glacio, "bharati-lab-glacio");

    // 4. Scania CHP 1 & 2 Generators (Generator3D.jsx)
    buildGeneratorMesh([-8, 0, 6], "bharati-cogen-01", true);
    buildGeneratorMesh([-12, 0, 9], "bharati-cogen-02", true);

    // 5. Fuel Storage Depot
    const fuel = new THREE.Group();
    fuel.position.set(-14, 0, -6);
    [-1.4, 0, 1.4].forEach(x => {
      const fBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 3.6), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 }));
      fBox.position.set(x, 1.0, 0);
      fuel.add(fBox);
    });
    registerAssetGroup(fuel, "bharati-fuel");

    // 6. ISRO Satcom Radome (SatelliteRadome3D.jsx)
    buildRadomeMesh([10, 0, 10], "bharati-satcom-isro", 2.2);

    // 7. Helipad Platform
    const heli = new THREE.Group();
    heli.position.set(-2, 0, 16);
    const hPad = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }));
    hPad.position.set(0, 0.5, 0);
    heli.add(hPad);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.0, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.82, 0);
    heli.add(ring);
    registerAssetGroup(heli, "bharati-helipad");

    // 8. Clean Polar Wind Turbine (WindTurbine3D.jsx)
    buildTurbineMesh([-6, 0, -12], "bharati-clean-energy", 7.5, 2.8);
  }

  // --- MAITRI 3D MODELS ---
function buildMaitriModels() {
    const SCALE = 0.055;
    const toX = x => (x - 700) * SCALE;
    const toZ = y => (y - 480) * SCALE;

    // Shared realistic polar materials
    const stiltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.65, roughness: 0.3 });
    const ribMat   = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.2 });
    const orangeRoofMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.35, roughness: 0.4 });
    const winMat   = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.85, roughness: 0.1 });
    const cntOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.45, roughness: 0.35 });

    // 0. Elevated Heat-Traced Water Pipeline on Support Cradles
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.7, metalness: 0.8 });
    const cradleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const pipePts = [
      [[90, 195], [240, 360]], [[240, 360], [380, 410]], [[380, 410], [420, 410]],
      [[420, 410], [490, 480]], [[490, 480], [580, 500]], [[580, 500], [650, 470]], [[650, 470], [720, 470]]
    ];
    pipePts.forEach(([p1, p2]) => {
      const x1 = toX(p1[0]), z1 = toZ(p1[1]), x2 = toX(p2[0]), z2 = toZ(p2[1]);
      const dist = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(x2 - x1, z2 - z1);

      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, dist, 8), pipeMat);
      pipe.position.set((x1 + x2) / 2, 0.45, (z1 + z2) / 2);
      pipe.rotation.set(0, angle, Math.PI / 2);
      stationGroup.add(pipe);

      const cradle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), cradleMat);
      cradle.position.set(x1, 0.22, z1);
      stationGroup.add(cradle);
    });

    // 1. MAIN U-SHAPED COMPLEX (Habitat, Labs & Admin)
    const main = new THREE.Group();
    main.position.set(toX(750), 0, toZ(470));

    // North Wing
    const nwGrp = new THREE.Group();
    nwGrp.position.set(toX(760) - toX(750), 0, toZ(409) - toZ(470));
    [-5.0, -2.5, 0, 2.5, 5.0].forEach(sx => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), stiltMat);
      st.position.set(sx, 0.6, 0);
      nwGrp.add(st);
    });
    const nwBody = new THREE.Mesh(new THREE.BoxGeometry(220 * SCALE, 2.2, 38 * SCALE), wallMat);
    nwBody.position.y = 2.1;
    nwBody.castShadow = true;
    nwGrp.add(nwBody);

    [-4.5, -3.0, -1.5, 0, 1.5, 3.0, 4.5].forEach(rx => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.22, 38 * SCALE + 0.04), ribMat);
      rib.position.set(rx, 2.1, 0);
      nwGrp.add(rib);
    });
    const nwRoof = new THREE.Mesh(new THREE.BoxGeometry(220 * SCALE + 0.2, 0.2, 38 * SCALE + 0.2), orangeRoofMat);
    nwRoof.position.y = 3.3;
    nwGrp.add(nwRoof);

    [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), winMat);
      win.position.set(wx, 2.2, -(38 * SCALE) / 2 - 0.03);
      nwGrp.add(win);
    });
    main.add(nwGrp);

    // East Wing with Indian Tricolor Flag
    const ewGrp = new THREE.Group();
    ewGrp.position.set(toX(855) - toX(750), 0, toZ(475) - toZ(470));
    [-1.8, 0, 1.8].forEach(sz => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), stiltMat);
      st.position.set(0, 0.6, sz);
      ewGrp.add(st);
    });
    const ewBody = new THREE.Mesh(new THREE.BoxGeometry(40 * SCALE, 2.2, 95 * SCALE), wallMat);
    ewBody.position.y = 2.1;
    ewGrp.add(ewBody);

    const ewRoof = new THREE.Mesh(new THREE.BoxGeometry(40 * SCALE + 0.2, 0.2, 95 * SCALE + 0.2), orangeRoofMat);
    ewRoof.position.y = 3.3;
    ewGrp.add(ewRoof);

    [-1.8, -0.6, 0.6, 1.8].forEach(wz => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.8), winMat);
      win.position.set((40 * SCALE) / 2 + 0.03, 2.2, wz);
      ewGrp.add(win);
    });

    // Indian Tricolor Flag
    const flagGrp = new THREE.Group();
    flagGrp.position.set((40 * SCALE) / 2 + 0.4, 3.4, -(95 * SCALE) / 2);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    pole.position.y = 1.5;
    flagGrp.add(pole);

    const flagBanner = new THREE.Group();
    flagBanner.position.set(0.5, 2.6, 0);
    const saffron = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    saffron.position.y = 0.2;
    const white = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const green = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
    green.position.y = -0.2;
    flagBanner.add(saffron, white, green);
    flagGrp.add(flagBanner);
    ewGrp.add(flagGrp);
    main.add(ewGrp);

    // South Wing
    const swGrp = new THREE.Group();
    swGrp.position.set(toX(702) - toX(750), 0, toZ(540) - toZ(470));
    [-5.4, -2.7, 0, 2.7, 5.4].forEach(sx => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), stiltMat);
      st.position.set(sx, 0.6, 0);
      swGrp.add(st);
    });
    const swBody = new THREE.Mesh(new THREE.BoxGeometry(245 * SCALE, 2.2, 40 * SCALE), wallMat);
    swBody.position.y = 2.1;
    swGrp.add(swBody);

    const swRoof = new THREE.Mesh(new THREE.BoxGeometry(245 * SCALE + 0.2, 0.2, 40 * SCALE + 0.2), orangeRoofMat);
    swRoof.position.y = 3.3;
    swGrp.add(swRoof);

    [-5.0, -3.2, -1.4, 0.4, 2.2, 4.0, 5.8].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), winMat);
      win.position.set(wx, 2.2, (40 * SCALE) / 2 + 0.03);
      swGrp.add(win);
    });
    main.add(swGrp);

    // West Entry Vestibule with Stairs
    const vestGrp = new THREE.Group();
    vestGrp.position.set(toX(666) - toX(750), 0, toZ(455) - toZ(470));
    const vest = new THREE.Mesh(new THREE.BoxGeometry(32 * SCALE, 1.8, 55 * SCALE), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    vest.position.y = 1.8;
    vestGrp.add(vest);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
    door.position.set(-(32 * SCALE) / 2 - 0.04, 1.4, 0);
    vestGrp.add(door);
    [0.2, 0.5, 0.8].forEach((sy, i) => {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 1.0), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      step.position.set(-(32 * SCALE) / 2 - 0.3 - i * 0.25, sy, 0);
      vestGrp.add(step);
    });
    main.add(vestGrp);

    registerAssetGroup(main, "maitri-main");

    // 2. Glazed Observation Lounge & Solarium
    const solGrp = new THREE.Group();
    solGrp.position.set(toX(810), 0, toZ(540));
    const sol = new THREE.Mesh(new THREE.BoxGeometry(50 * SCALE, 2.3, 40 * SCALE), new THREE.MeshStandardMaterial({
      color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.9
    }));
    sol.position.y = 2.1;
    solGrp.add(sol);
    const solRoof = new THREE.Mesh(new THREE.BoxGeometry(50 * SCALE + 0.2, 0.2, 40 * SCALE + 0.2), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 }));
    solRoof.position.y = 3.3;
    solGrp.add(solRoof);
    const solLight = new THREE.PointLight(0xbae6fd, 1.8, 8);
    solLight.position.set(0, 2.0, 0);
    solGrp.add(solLight);
    registerAssetGroup(solGrp, "maitri-lounge");

    // 3. Triangular Y-Spoke Module Hub
    const ySpoke = new THREE.Group();
    ySpoke.position.set(toX(610), 0, toZ(680));
    const yStilt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8), stiltMat);
    yStilt.position.y = 0.5;
    ySpoke.add(yStilt);
    const yHub = new THREE.Mesh(new THREE.CylinderGeometry(10 * SCALE, 10 * SCALE, 1.8, 24), cntOrangeMat);
    yHub.position.y = 1.8;
    ySpoke.add(yHub);
    const yDome = new THREE.Mesh(new THREE.SphereGeometry(10 * SCALE, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5 }));
    yDome.position.y = 2.7;
    ySpoke.add(yDome);

    [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].forEach(ang => {
      const arm = new THREE.Group();
      arm.rotation.y = ang;
      const aBox = new THREE.Mesh(new THREE.BoxGeometry(12 * SCALE, 1.6, 40 * SCALE), cntOrangeMat);
      aBox.position.set(0, 1.8, -1.4);
      arm.add(aBox);
      const aWin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), winMat);
      aWin.position.set(0, 1.9, -(40 * SCALE) / 2 - 0.7);
      arm.add(aWin);
      ySpoke.add(arm);
    });
    registerAssetGroup(ySpoke, "maitri-main");

    // 4. Quonset Barrel-Vault Workshop
    const ws = new THREE.Group();
    ws.position.set(toX(320), 0, toZ(310));
    const archSlab = new THREE.Mesh(new THREE.BoxGeometry(90 * SCALE + 0.3, 0.3, 50 * SCALE + 0.3), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }));
    archSlab.position.y = 0.15;
    ws.add(archSlab);
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry((50 * SCALE) / 2, (50 * SCALE) / 2, 90 * SCALE, 24, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide })
    );
    arch.position.y = 1.4;
    arch.rotation.z = Math.PI / 2;
    ws.add(arch);
    [-1.8, -0.9, 0, 0.9, 1.8].forEach(rx => {
      const aRib = new THREE.Mesh(new THREE.CylinderGeometry((50 * SCALE) / 2 + 0.03, (50 * SCALE) / 2 + 0.03, 0.08, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8 }));
      aRib.position.set(rx, 1.4, 0);
      aRib.rotation.z = Math.PI / 2;
      ws.add(aRib);
    });
    const rollDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 1.8), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 }));
    rollDoor.position.set((90 * SCALE) / 2 + 0.04, 0.9, 0);
    ws.add(rollDoor);
    registerAssetGroup(ws, "maitri-workshop");

    // 5. Internal Power Plant
    buildGeneratorMesh([toX(522), 0, toZ(577)], "maitri-internal-gen", false);

    // 6. Lake Pump House & Tanks
    const pump = new THREE.Group();
    pump.position.set(toX(377), 0, toZ(432));
    const pBox = new THREE.Mesh(new THREE.BoxGeometry(55 * SCALE, 1.8, 35 * SCALE), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 }));
    pBox.position.y = 1.2;
    pump.add(pBox);
    const pRoof = new THREE.Mesh(new THREE.BoxGeometry(55 * SCALE + 0.2, 0.2, 35 * SCALE + 0.2), new THREE.MeshStandardMaterial({ color: 0x0369a1 }));
    pRoof.position.y = 2.2;
    pump.add(pRoof);
    [-0.7, 0.7].forEach(tx => {
      const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 }));
      tk.position.set(tx, 1.0, 35 * SCALE + 0.5);
      pump.add(tk);
    });
    registerAssetGroup(pump, "maitri-water");

    // 7. Tracking Satellite Dish & Radome (with Pedestal & Rings)
    buildRadomeMesh([toX(480), 0, toZ(480)], "maitri-satellite-dish", 1.6);

    // 8. Fuel Farm (Containment Bunding + 8 Cylinders on Skids)
    const fuelFarm = new THREE.Group();
    fuelFarm.position.set(toX(225), 0, toZ(815));
    const bunding = new THREE.Mesh(new THREE.BoxGeometry(210 * SCALE, 0.3, 90 * SCALE), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }));
    bunding.position.y = 0.15;
    fuelFarm.add(bunding);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(210 * SCALE, 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
    curb.position.set(0, 0.35, (90 * SCALE) / 2);
    fuelFarm.add(curb);

    [-1.8, -0.6, 0.6, 1.8].forEach(colX => {
      [-0.9, 0.9].forEach(rowZ => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 38 * SCALE, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.75, roughness: 0.2 }));
        cyl.rotation.z = Math.PI / 2;
        cyl.position.set(colX * 2.2, 0.75, rowZ * 1.8);
        fuelFarm.add(cyl);
      });
    });
    registerAssetGroup(fuelFarm, "maitri-fuel-farm");

    // 9. Staged Tracked PistenBully Snowcat Fleet
    const vehicleLot = new THREE.Group();
    vehicleLot.position.set(toX(435), 0, toZ(815));
    const padLot = new THREE.Mesh(new THREE.BoxGeometry(180 * SCALE, 0.16, 100 * SCALE), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 }));
    padLot.position.y = 0.08;
    vehicleLot.add(padLot);

    [-2.2, 0, 2.2].forEach((vx, vi) => {
      const cat = new THREE.Group();
      cat.position.set(vx, 0.25, 0);
      [-0.45, 0.45].forEach(tz => {
        const trk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.2), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        trk.position.set(0, 0.15, tz);
        cat.add(trk);
      });
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.8), new THREE.MeshStandardMaterial({ color: vi === 0 ? 0xdc2626 : 0x0284c7 }));
      cBody.position.y = 0.4;
      cat.add(cBody);
      const cGlass = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.75), winMat);
      cGlass.position.set(0.3, 0.6, 0);
      cat.add(cGlass);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 1.1), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
      blade.position.set(0.75, 0.15, 0);
      cat.add(blade);
      vehicleLot.add(cat);
    });
    registerAssetGroup(vehicleLot, "maitri-workshop");

    // 10. Heavy Helipad with De-Icing Ring, Bold White "H", Lights & Windsock
    const heli = new THREE.Group();
    heli.position.set(toX(880), 0, toZ(720));
    [0, 60, 120, 180, 240, 300].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), stiltMat);
      st.position.set(Math.cos(rad) * (34 * SCALE * 0.9), 0.3, Math.sin(rad) * (34 * SCALE * 0.9));
      heli.add(st);
    });
    const hPad = new THREE.Mesh(new THREE.CylinderGeometry(34 * SCALE, 34 * SCALE, 0.15, 32), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }));
    hPad.position.y = 0.6;
    heli.add(hPad);
    const deIceRing = new THREE.Mesh(new THREE.RingGeometry(34 * SCALE * 0.88, 34 * SCALE * 0.98, 32), new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide }));
    deIceRing.rotation.x = -Math.PI / 2; deIceRing.position.y = 0.68;
    heli.add(deIceRing);

    const hMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 1.1), hMat); hL.position.set(-0.45, 0.685, 0);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 1.1), hMat); hR.position.set(0.45, 0.685, 0);
    const hC = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.01, 0.18), hMat); hC.position.set(0, 0.685, 0);
    heli.add(hL, hR, hC);

    for (let i = 0; i < 8; i++) {
      const rad = (i * Math.PI) / 4;
      const bLight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2.5 }));
      bLight.position.set(Math.cos(rad) * (34 * SCALE * 0.96), 0.72, Math.sin(rad) * (34 * SCALE * 0.96));
      heli.add(bLight);
    }
    const sockMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
    sockMast.position.set(2.2, 1.8, -1.8);
    const sock = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xea580c }));
    sock.position.set(2.5, 2.8, -1.8);
    sock.rotation.z = -Math.PI / 2;
    heli.add(sockMast, sock);
    registerAssetGroup(heli, "maitri-helipad");

    // 11. Summer Modular Cabins Row
    const summer = new THREE.Group();
    summer.position.set(toX(920), 0, toZ(250));
    [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].forEach(cx => {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(22 * SCALE, 1.4, 18 * SCALE), new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5, roughness: 0.4 }));
      cab.position.set(cx, 0.7, 0);
      const cWin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.03), winMat);
      cWin.position.set(cx, 0.8, -(18 * SCALE) / 2 - 0.02);
      summer.add(cab, cWin);
    });
    registerAssetGroup(summer, "maitri-main");

    // 12. Polar Wind Turbine
    buildTurbineMesh([-4, 0, 14], "maitri-weather", 7, 2.8);
  }

  // --- Sub-element procedural builders ---
  function buildGeneratorMesh(pos, assetId, isCogen) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);

    const box = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 2.0), new THREE.MeshStandardMaterial({
      color: isCogen ? 0x1e3a8a : 0x334155, metalness: 0.6, roughness: 0.4
    }));
    box.position.set(0, 1.2, 0);
    group.add(box);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
    stack.position.set(-1.1, 2.4, -0.6);
    group.add(stack);

    const shimmer = new THREE.PointLight(0xf97316, 1.5, 6);
    shimmer.position.set(-1.1, 3.2, -0.6);
    group.add(shimmer);

    vibratingGenerators.push({ mesh: box, baseY: 1.2, light: shimmer });
    registerAssetGroup(group, assetId);
  }

  function buildRadomeMesh(pos, assetId, radius) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.05, radius * 1.1, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    base.position.set(0, 0.8, 0);
    group.add(base);

    const gimbal = new THREE.Group();
    gimbal.position.set(0, 1.2 + radius * 0.5, 0);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.7, 0.1, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    dish.rotation.x = Math.PI / 2;
    gimbal.add(dish);
    group.add(gimbal);
    trackingSatGimbal = gimbal;

    const shell = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75), new THREE.MeshStandardMaterial({
      color: 0xe0f2fe, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.65
    }));
    shell.position.set(0, 1.2 + radius * 0.7, 0);
    group.add(shell);

    registerAssetGroup(group, assetId);
  }

  function buildTurbineMesh(pos, assetId, height, bladeRadius) {
    const group = new THREE.Group();
    group.position.set(pos[0], pos[1], pos[2]);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, height, 16), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6 }));
    tower.position.set(0, height / 2 + 0.4, 0);
    group.add(tower);

    const rotor = new THREE.Group();
    rotor.position.set(0, height + 0.4, 0.4);
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, bladeRadius, 0.04), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
      b.rotation.z = (i * Math.PI * 2) / 3;
      b.position.set(Math.cos((i * Math.PI * 2) / 3) * (bladeRadius / 2), Math.sin((i * Math.PI * 2) / 3) * (bladeRadius / 2), 0);
      rotor.add(b);
    }
    group.add(rotor);
    rotatingRotors.push(rotor);

    registerAssetGroup(group, assetId);
  }

  // =========================================================================
  // 5. POINTER RAYCASTING & CLICK TELEMETRY POPUP
  // =========================================================================
  function onPointerMove(e) {
    const rect = canvas3d.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactableMeshes, false);

    if (intersects.length > 0) {
      const assetId = intersects[0].object.userData.assetId;
      const meta = ASSET_REGISTRY[assetId];
      if (meta) {
        tooltipEl.style.display = "flex";
        tooltipEl.style.left = `${e.clientX - rect.left}px`;
        tooltipEl.style.top = `${e.clientY - rect.top}px`;
        tooltipEl.innerHTML = `<span class="pulse-dot" style="background:var(--ok)"></span><strong>${meta.name}</strong>`;
        canvas3d.style.cursor = "pointer";
        return;
      }
    }
    tooltipEl.style.display = "none";
    canvas3d.style.cursor = "grab";
  }

  function onPointerClick(e) {
    const rect = canvas3d.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactableMeshes, false);

    if (intersects.length > 0) {
      const assetId = intersects[0].object.userData.assetId;
      openAssetPopup(assetId);
    }
  }

  function openAssetPopup(assetId) {
    const meta = ASSET_REGISTRY[assetId] || {
      name: assetId.toUpperCase(), category: "Station Asset", desc: "Telemetry link established with NCPOR live core."
    };

    const s = Telemetry.getActiveStation();
    const liveTemp = s.sensors.outsideTemp ? (s.sensors.outsideTemp.value + (meta.tempOffset || 0)).toFixed(1) : "21.4";
    const liveLoad = s.power.genLoad ? Math.min(100, Math.round(s.power.genLoad * (meta.loadFactor || 1))) : "64";

    document.getElementById("modalTitle").textContent = meta.name;
    document.getElementById("modalId").textContent = `ID: ${assetId}`;
    document.getElementById("modalCategory").textContent = meta.category.toUpperCase();
    document.getElementById("modalStationTag").textContent = s.name.split(" ")[0];
    document.getElementById("modalDesc").textContent = meta.desc;

    document.getElementById("modalTemp").textContent = liveTemp;
    document.getElementById("modalLoad").textContent = `${liveLoad}%`;
    document.getElementById("modalBuffer").textContent = s.power.fuelStatus || "Nominal";
    document.getElementById("modalSubmetric").textContent = `${meta.metricType || "Feed"}: ${meta.metricVal || "Optimal"}`;

    const isNominal = s.stationStatus === "nominal";
    document.getElementById("modalStatusText").textContent = isNominal ? "NOMINAL" : "WARNING";
    document.getElementById("modalStatusDot").style.background = isNominal ? "var(--ok)" : "var(--warn)";
    document.getElementById("modalHealthText").textContent = isNominal ? "98%" : "84%";

    document.getElementById("assetModal").classList.add("open");
  }

  function bindModalEvents() {
    const btn = document.getElementById("btnCloseModal");
    const modal = document.getElementById("assetModal");
    if (btn) btn.addEventListener("click", () => modal.classList.remove("open"));
    if (modal) modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  // =========================================================================
  // 6. RENDER LOOP
  // =========================================================================
  function onResize() {
    if (!renderer || !canvas3d.parentElement) return;
    const w = canvas3d.parentElement.clientWidth;
    const h = canvas3d.parentElement.clientHeight || 350;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function renderLoop() {
    if (!is3dMode) return;
    animId = requestAnimationFrame(renderLoop);

    const t = performance.now() * 0.001;

    // OrbitControls
    if (controls) controls.update();

    // Aurora wave oscillation
    auroraRibbons.forEach(a => {
      a.mesh.position.y = a.baseY + Math.sin(t * a.speed) * 2.2;
      a.mesh.rotation.z = Math.sin(t * 0.2) * 0.04;
    });

    // Sub-zero snow drift
    if (snowParticles) {
      const pos = snowParticles.geometry.attributes.position.array;
      const spd = snowParticles.geometry.userData.speeds;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= spd[i * 3 + 1] * 0.18;
        pos[i * 3] += spd[i * 3] * 0.08;
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 40;
          pos[i * 3] = (Math.random() - 0.5) * 140;
        }
      }
      snowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Spin wind turbine rotors
    const windSpeed = Telemetry.getActiveStation().sensors.windSpeed ? Telemetry.getActiveStation().sensors.windSpeed.value : 12;
    rotatingRotors.forEach(r => { r.rotation.z += 0.02 + windSpeed * 0.002; });

    // Satellite tracking oscillation
    if (trackingSatGimbal) {
      trackingSatGimbal.rotation.y = Math.sin(t * 0.2) * 0.6 + 0.3;
      trackingSatGimbal.rotation.x = Math.sin(t * 0.12) * 0.12 - 0.3;
    }

    // Engine micro-vibration
    vibratingGenerators.forEach(g => {
      g.mesh.position.y = g.baseY + Math.sin(t * 45) * 0.015;
      g.light.intensity = 1.2 + Math.sin(t * 8) * 0.4;
    });

    renderer.render(scene, camera);
  }

  function setMode3d(is3d) {
    is3dMode = is3d;
    if (is3d) {
      svgEl.style.display = "none";
      canvas3d.style.display = "block";
      onResize();
      renderLoop();
    } else {
      cancelAnimationFrame(animId);
      canvas3d.style.display = "none";
      tooltipEl.style.display = "none";
      svgEl.style.display = "block";
    }
  }

  function updateStation(stationKey) {
    render2D();
    if (scene) loadStationTwin(stationKey);
  }

  return { build, setMode3d, updateStation };
})();