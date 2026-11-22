import * as THREE from "three";
import { BuildingFootprintData, MapLayoutData } from "./JabodetabekMapFetcher";
import { getCachedCityAsset } from "./ModelRegistry";
import {
  getAsphaltTexture,
  getBikeLaneTexture,
  getBuswayTexture,
  getHalteSignTexture,
  getRukoTexture,
  getSeparatorCurbTexture,
  getSidewalkCurbTexture,
  getSkyscraperTexture,
  getSpbuTexture,
  getTollSignTexture,
} from "./IndonesianTextureGenerator";

export interface BuildingCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface TrafficLightMeshGroup {
  x: number;
  z: number;
  redNS: THREE.MeshBasicMaterial;
  yellowNS: THREE.MeshBasicMaterial;
  greenNS: THREE.MeshBasicMaterial;
  redEW: THREE.MeshBasicMaterial;
  yellowEW: THREE.MeshBasicMaterial;
  greenEW: THREE.MeshBasicMaterial;
}

export interface BuiltCityResult {
  colliders: BuildingCollider[];
  cullableProps: THREE.Object3D[];
  trafficLights: TrafficLightMeshGroup[];
}

function fitAssetToBox(
  asset: THREE.Group,
  targetW: number,
  targetH: number,
  targetD: number,
  uniformXZ = false
): THREE.Group {
  asset.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(asset);
  const size = new THREE.Vector3();
  box.getSize(size);

  const sx = targetW / Math.max(size.x, 0.01);
  const sy = targetH / Math.max(size.y, 0.01);
  const sz = targetD / Math.max(size.z, 0.01);

  if (uniformXZ) {
    const s = Math.min(sx, sy, sz);
    asset.scale.set(s, s, s);
  } else {
    asset.scale.set(sx, sy, sz);
  }
  asset.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(asset);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);
  asset.position.x -= center.x;
  asset.position.z -= center.z;
  asset.position.y -= scaledBox.min.y;
  return asset;
}

function createAtmosphericSkyDome(
  tod: "morning" | "sunset" | "night",
  isRaining: boolean
): THREE.Mesh {
  const topColor =
    tod === "night"
      ? new THREE.Color(0x050817)
      : tod === "sunset"
      ? new THREE.Color(0x3b1f5e)
      : new THREE.Color(isRaining ? 0x475569 : 0x1d4ed8);

  const midColor =
    tod === "night"
      ? new THREE.Color(0x131736)
      : tod === "sunset"
      ? new THREE.Color(0xd96b52)
      : new THREE.Color(isRaining ? 0x64748b : 0x60a5fa);

  const horizonColor =
    tod === "night"
      ? new THREE.Color(0x281b4b)
      : tod === "sunset"
      ? new THREE.Color(0xfbbf6b)
      : new THREE.Color(isRaining ? 0x94a3b8 : 0xdbeafe);

  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: topColor },
      uMid: { value: midColor },
      uHorizon: { value: horizonColor },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.25, h));
        col = mix(col, uTop, smoothstep(0.25, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  return new THREE.Mesh(new THREE.SphereGeometry(560, 24, 16), mat);
}

/**
 * Multi-tier realistic Jakarta architectural skyscraper (Podium + Curtain-Wall Glass Shaft + Penthouse Crown + Spire)
 */
function buildRealisticSkyscraper(
  b: BuildingFootprintData,
  idx: number,
  isNight: boolean
): THREE.Group {
  const g = new THREE.Group();
  const tex = getSkyscraperTexture(idx, isNight);

  const podiumMat = new THREE.MeshStandardMaterial({
    color: idx % 2 === 0 ? 0xd6d3cd : 0x94a3b8,
    roughness: 0.65,
    metalness: 0.15,
  });

  const glassTowerMat = new THREE.MeshPhysicalMaterial({
    map: tex,
    color: isNight ? 0xffffff : idx % 3 === 0 ? 0xdbeafe : 0xe2e8f0,
    roughness: 0.12,
    metalness: 0.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.65,
    emissive: isNight ? new THREE.Color(0x1e1b4b) : new THREE.Color(0x000000),
    emissiveMap: isNight ? tex : null,
    emissiveIntensity: isNight ? 0.65 : 0,
  });

  const mullionMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.75,
    roughness: 0.3,
  });

  const podiumGlassMat = new THREE.MeshPhysicalMaterial({
    map: tex,
    color: isNight ? 0xfef08a : 0x334155,
    roughness: 0.14,
    metalness: 0.6,
    clearcoat: 1.0,
    envMapIntensity: 1.7,
  });

  // 1. Glass & Granite Lobby Podium Base (first 10m with dark granite framing + glass curtain wall)
  const podiumH = Math.min(10, b.height * 0.2);
  const podium = new THREE.Mesh(
    new THREE.BoxGeometry(b.width, podiumH, b.depth),
    [podiumGlassMat, podiumGlassMat, mullionMat, mullionMat, podiumGlassMat, podiumGlassMat]
  );
  podium.position.y = podiumH / 2;
  podium.castShadow = true;
  podium.receiveShadow = true;
  g.add(podium);

  // Granite podium corner pillars & roof cornice
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(b.width + 0.6, 0.7, b.depth + 0.6),
    mullionMat
  );
  cornice.position.y = podiumH + 0.2;
  g.add(cornice);

  // Entrance Glass Canopy
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(b.width * 0.52, 0.45, 3.8),
    mullionMat
  );
  canopy.position.set(0, 4.5, b.depth / 2 + 1.8);
  g.add(canopy);

  // 2. Main Glass Curtain-Wall Tower Shaft
  const shaftH = b.height - podiumH;
  const shaftW = b.width * 0.84;
  const shaftD = b.depth * 0.84;
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(shaftW, shaftH, shaftD),
    glassTowerMat
  );
  shaft.position.y = podiumH + shaftH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Corner vertical architectural mullions
  [-shaftW / 2, shaftW / 2].forEach((mx) => {
    [-shaftD / 2, shaftD / 2].forEach((mz) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, shaftH, 0.65), mullionMat);
      col.position.set(mx, podiumH + shaftH / 2, mz);
      g.add(col);
    });
  });

  // 3. Wisma 46 Fountain-Pen Crown OR Stepped Penthouse + Spire
  if (b.kind === "wisma46") {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, shaftW * 0.45, 22, 4),
      podiumMat
    );
    crown.rotation.y = Math.PI / 4;
    crown.position.y = b.height + 11;
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.45, 24, 8),
      mullionMat
    );
    spire.position.y = b.height + 28;
    g.add(crown, spire);
  } else {
    const crownH = 5.5;
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(shaftW * 0.72, crownH, shaftD * 0.72),
      mullionMat
    );
    crown.position.y = b.height + crownH / 2;
    g.add(crown);

    if (b.height > 70) {
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.35, 14, 8),
        mullionMat
      );
      spire.position.y = b.height + crownH + 7;
      g.add(spire);
    }

    if (isNight || idx % 2 === 0) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(shaftW * 0.74, 0.55, shaftD * 0.74),
        new THREE.MeshBasicMaterial({
          color: idx % 2 === 0 ? 0x38bdf8 : 0xff3e9d,
        })
      );
      strip.position.y = b.height + crownH - 0.5;
      g.add(strip);
    }
  }

  return g;
}

/**
 * Detailed 3-Story Indonesian Ruko (Ground floor glass shopfront, cantilevered concrete fascia sign, upper windows, balconies & AC units)
 */
function buildRealisticJakartaRuko(
  b: BuildingFootprintData,
  isNight: boolean
): THREE.Group {
  const g = new THREE.Group();
  const rukoKind = b.kind === "mall" ? "minimarket" : (b.kind as "minimarket" | "bengkel" | "warung");
  const tex = getRukoTexture(rukoKind, isNight);

  const wallMat = new THREE.MeshStandardMaterial({
    color: isNight ? 0x52525b : 0xe7e2d8,
    roughness: 0.78,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.6,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: isNight ? 0xfef08a : 0x1e293b,
    roughness: 0.1,
    metalness: 0.3,
    emissive: isNight ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000),
    emissiveIntensity: isNight ? 0.35 : 0,
  });
  const conblockMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.9 });

  // Conblock parking apron
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(b.width + 3, 0.08, b.depth + 4.5),
    conblockMat
  );
  apron.position.y = 0.04;
  apron.receiveShadow = true;
  g.add(apron);

  const sideFacadeMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.72,
    emissive: isNight ? new THREE.Color(0x1e1b4b) : new THREE.Color(0x000000),
    emissiveMap: isNight ? tex : null,
    emissiveIntensity: isNight ? 0.45 : 0,
  });

  // Main 3-story structure (all 4 side faces textured with 3-story windows & storefront!)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(b.width, b.height, b.depth),
    [sideFacadeMat, sideFacadeMat, trimMat, trimMat, sideFacadeMat, sideFacadeMat]
  );
  body.position.y = b.height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Parapet roofline
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(b.width + 0.5, 0.6, b.depth + 0.5),
    trimMat
  );
  roof.position.y = b.height + 0.25;
  g.add(roof);

  // Ground floor recessed glass storefront + brand fascia canopy
  const storefront = new THREE.Mesh(
    new THREE.BoxGeometry(b.width * 0.85, 3.3, 0.25),
    glassMat
  );
  storefront.position.set(0, 1.75, b.depth / 2 + 0.05);
  g.add(storefront);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(b.width + 0.4, 1.35, 1.6),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  canopy.position.set(0, 3.8, b.depth / 2 + 0.75);
  g.add(canopy);

  // Upper 2nd & 3rd floor windows + balcony slab
  [5.8, 9.2].forEach((wy) => {
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(b.width * 0.94, 0.25, 0.9),
      trimMat
    );
    slab.position.set(0, wy - 1.1, b.depth / 2 + 0.45);
    g.add(slab);

    [-b.width * 0.24, b.width * 0.24].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(b.width * 0.3, 1.6, 0.2), glassMat);
      win.position.set(wx, wy, b.depth / 2 + 0.08);
      g.add(win);
    });
  });

  return g;
}

export function buildJakartaCityScene(
  worldGroup: THREE.Group,
  layout: MapLayoutData,
  tod: "morning" | "sunset" | "night",
  isRaining: boolean
): BuiltCityResult {
  while (worldGroup.children.length > 0) {
    const child = worldGroup.children[0];
    worldGroup.remove(child);
    child.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).geometry?.dispose();
      }
    });
  }

  const isNight = tod === "night";
  const colliders: BuildingCollider[] = [];
  const cullableProps: THREE.Object3D[] = [];
  const trafficLights: TrafficLightMeshGroup[] = [];

  // 0. Atmospheric SkyDome + Sun Disc
  worldGroup.add(createAtmosphericSkyDome(tod, isRaining));
  if (!isNight && !isRaining) {
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(18, 16, 16),
      new THREE.MeshBasicMaterial({ color: tod === "sunset" ? 0xff9e44 : 0xfffbeb })
    );
    sunDisc.position.set(tod === "sunset" ? -320 : 210, tod === "sunset" ? 95 : 280, -240);
    worldGroup.add(sunDisc);
  }

  // 1. Urban City Concrete Ground (clean Jakarta downtown pavement base)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x333942, roughness: 0.92 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // 2. Water Zones
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    metalness: 0.35,
    roughness: 0.12,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.88,
  });
  layout.waterZones.forEach((wz) => {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(wz.width, wz.depth), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(wz.x, 0.0, wz.z);
    water.receiveShadow = true;
    worldGroup.add(water);
  });

  // 3. Glitch-Free Layered Roads (PlaneGeometry with strictly separated Y layers + polygonOffset)
  const makeRoadMat = (tex: THREE.Texture, offsetFactor: number, rough = 0.72) =>
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: isRaining ? 0.18 : rough,
      metalness: isRaining ? 0.45 : 0.08,
      polygonOffset: true,
      polygonOffsetFactor: offsetFactor,
      polygonOffsetUnits: offsetFactor,
    });

  const gridRoadMat = makeRoadMat(getAsphaltTexture(isRaining), -1);
  const primaryRoadMat = makeRoadMat(getAsphaltTexture(isRaining), -2);
  const buswayMat = makeRoadMat(getBuswayTexture(), -3, 0.65);
  const bikeMat = makeRoadMat(getBikeLaneTexture(), -3, 0.7);
  const curbMat = new THREE.MeshStandardMaterial({
    map: getSidewalkCurbTexture(),
    roughness: 0.85,
  });
  const sepMat = new THREE.MeshStandardMaterial({
    map: getSeparatorCurbTexture(),
    roughness: 0.6,
  });

  layout.roads.forEach((road) => {
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
      const angle = Math.atan2(dx, dz);

      if (road.isFlyover) {
        const elev = road.elevation ?? 8.5;
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(road.width, 0.9, len),
          primaryRoadMat
        );
        deck.position.set((x1 + x2) / 2, elev, (z1 + z2) / 2);
        deck.rotation.y = angle;
        deck.receiveShadow = true;
        worldGroup.add(deck);

        const steps = Math.max(2, Math.floor(len / 42));
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.78 });
        for (let p = 0; p <= steps; p++) {
          const t = p / steps;
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(1.15, 1.35, elev, 10),
            pillarMat
          );
          pillar.position.set(x1 + dx * t, elev / 2, z1 + dz * t);
          pillar.castShadow = true;
          worldGroup.add(pillar);
        }
        continue;
      }

      // Strictly separated non-overlapping flat road strips (Zero Z-fighting!)
      const layerY =
        road.layer === "busway" ? 0.055 : road.layer === "primary" ? 0.032 : 0.012;
      const mat =
        road.layer === "busway"
          ? buswayMat
          : road.layer === "primary"
          ? primaryRoadMat
          : gridRoadMat;

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(road.width, len), mat);
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = -angle;
      plane.position.set((x1 + x2) / 2, layerY, (z1 + z2) / 2);
      plane.receiveShadow = true;
      worldGroup.add(plane);

      // Raised 3D sidewalks flanking primary roads (NEVER overlapping the road asphalt!)
      if (road.layer === "primary") {
        const swWidth = 3.2;
        [-1, 1].forEach((side) => {
          const offset = side * (road.width / 2 + swWidth / 2);
          const nx = Math.cos(angle) * offset;
          const nz = -Math.sin(angle) * offset;
          const sw = new THREE.Mesh(
            new THREE.BoxGeometry(swWidth, 0.22, len),
            curbMat
          );
          sw.position.set((x1 + x2) / 2 + nx, 0.11, (z1 + z2) / 2 + nz);
          sw.rotation.y = angle;
          sw.receiveShadow = true;
          worldGroup.add(sw);
        });

        // Jakarta Green Bicycle Lane
        const bOff = road.width / 2 - 0.85;
        const bx = Math.cos(angle) * bOff;
        const bz = -Math.sin(angle) * bOff;
        const bike = new THREE.Mesh(new THREE.PlaneGeometry(1.4, len), bikeMat);
        bike.rotation.x = -Math.PI / 2;
        bike.rotation.z = -angle;
        bike.position.set((x1 + x2) / 2 + bx, 0.045, (z1 + z2) / 2 + bz);
        worldGroup.add(bike);
      }

      if (road.isBusway) {
        const sep = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, len), sepMat);
        sep.position.set((x1 + x2) / 2 + road.width / 2 + 0.25, 0.14, (z1 + z2) / 2);
        sep.rotation.y = angle;
        worldGroup.add(sep);
      }
    }
  });

  // Clean Intersection Junction Asphalt Pads (prevents crossing road flicker)
  const junctionMat = new THREE.MeshStandardMaterial({
    color: isRaining ? 0x181c24 : 0x2c3038,
    roughness: isRaining ? 0.18 : 0.72,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  [
    [0, -90],
    [0, 90],
    [-90, 0],
    [90, 0],
    [0, -150],
    [0, 150],
    [-150, 0],
    [150, 0],
  ].forEach(([jx, jz]) => {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(24.5, 14.5), junctionMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(jx, 0.048, jz);
    pad.receiveShadow = true;
    worldGroup.add(pad);
  });

  // Bundaran HI Asphalt Roundabout Ring (seamless around monument!)
  if (layout.region.id === "jakpus") {
    const ringRoad = new THREE.Mesh(new THREE.RingGeometry(19.2, 36, 48), junctionMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.set(0, 0.062, 0);
    ringRoad.receiveShadow = true;
    worldGroup.add(ringRoad);
  }

  // Flyover Ramps (connected flush to flyover ends ±320, -150)
  const rampGeo = new THREE.BoxGeometry(16, 0.85, 56);
  const rampW = new THREE.Mesh(rampGeo, primaryRoadMat);
  rampW.rotation.order = "YXZ";
  rampW.position.set(-347.5, 4.25, -150);
  rampW.rotation.y = Math.PI / 2;
  rampW.rotation.x = -0.152;
  const rampE = new THREE.Mesh(rampGeo, primaryRoadMat);
  rampE.rotation.order = "YXZ";
  rampE.position.set(347.5, 4.25, -150);
  rampE.rotation.y = -Math.PI / 2;
  rampE.rotation.x = -0.152;
  worldGroup.add(rampW, rampE);

  // 4. Landmark Bundaran HI (Kolam, Plaza, Kanstin Hitam-Putih, & Tugu Selamat Datang)
  if (layout.region.id === "jakpus") {
    const outerCurb = new THREE.Mesh(
      new THREE.CylinderGeometry(19.5, 19.7, 0.3, 40),
      curbMat
    );
    outerCurb.position.set(0, 0.15, 0);
    worldGroup.add(outerCurb);

    const stonePlaza = new THREE.Mesh(
      new THREE.CylinderGeometry(19.0, 19.0, 0.34, 40),
      new THREE.MeshStandardMaterial({ color: 0xd6d3cd, roughness: 0.72 })
    );
    stonePlaza.position.set(0, 0.17, 0);
    worldGroup.add(stonePlaza);

    const fountainPool = new THREE.Mesh(
      new THREE.CylinderGeometry(14.5, 14.5, 0.55, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        roughness: 0.08,
        metalness: 0.2,
        clearcoat: 1.0,
      })
    );
    fountainPool.position.set(0, 0.3, 0);
    worldGroup.add(fountainPool);

    const sprayMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.78,
    });
    for (let a = 0; a < 20; a++) {
      const ang = (a / 20) * Math.PI * 2;
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.8, 6), sprayMat);
      jet.position.set(Math.cos(ang) * 9.5, 2.2, Math.sin(ang) * 9.5);
      worldGroup.add(jet);
    }

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.6 });
    const leftP = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14.5, 1.4), pillarMat);
    leftP.position.set(-1.3, 7.25, 0);
    const rightP = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14.5, 1.4), pillarMat);
    rightP.position.set(1.3, 7.25, 0);
    const topD = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 2.2), pillarMat);
    topD.position.set(0, 14.6, 0);
    worldGroup.add(leftP, rightP, topD);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      metalness: 0.85,
      roughness: 0.3,
    });
    [-0.75, 0.75].forEach((sx) => {
      const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.9, 8), bronzeMat);
      fig.position.set(sx, 16.3, 0);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bronzeMat);
      hd.position.set(sx, 17.95, 0);
      worldGroup.add(fig, hd);
    });
  } else {
    const fount = getCachedCityAsset("pavement-fountain.glb");
    if (fount) {
      const fitted = fitAssetToBox(fount, 16, 6, 16, true);
      fitted.position.set(0, 0, 0);
      worldGroup.add(fitted);
    }
  }

  // 5. Halte TransJakarta Revitalisasi (Compact inside Busway corridor, never blocking car lanes)
  layout.halteLocations.forEach((h) => {
    const halteGroup = new THREE.Group();
    halteGroup.position.set(h.x, 0, h.z);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.85, 22),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
    );
    platform.position.y = 0.42;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 2.5, 19),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.42,
        clearcoat: 1.0,
      })
    );
    glass.position.y = 2.05;

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.45, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    canopy.position.y = 3.8;
    canopy.castShadow = true;

    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(3.7, 0.65, 21),
      new THREE.MeshStandardMaterial({ map: getHalteSignTexture(h.label) })
    );
    fascia.position.y = 3.3;
    halteGroup.add(platform, glass, canopy, fascia);
    worldGroup.add(halteGroup);
  });

  // 6. JPO Steel Pedestrian Overpass
  layout.jpoLocations.forEach((jpo) => {
    const ponte = getCachedCityAsset("ponte.glb");
    if (ponte) {
      const fitted = fitAssetToBox(ponte, 28, 6.5, 4, false);
      fitted.position.set(jpo.x, 5.2, jpo.z);
      fitted.rotation.y = jpo.rotation;
      worldGroup.add(fitted);
    }
  });

  // 7. Realistic Architectural Skyscrapers & 3-Story Indonesian Rukos
  layout.buildings.forEach((b, idx) => {
    const isTall =
      b.kind === "skyscraper" || b.kind === "wisma46" || b.kind === "mall" || b.height > 16;
    const built = isTall
      ? buildRealisticSkyscraper(b, idx, isNight)
      : buildRealisticJakartaRuko(b, isNight);

    built.position.set(b.x, 0, b.z);
    worldGroup.add(built);
    cullableProps.push(built);

    colliders.push({
      minX: b.x - b.width / 2,
      maxX: b.x + b.width / 2,
      minZ: b.z - b.depth / 2,
      maxZ: b.z + b.depth / 2,
      height: b.height,
    });
  });

  // 8. SPBU Pertamina Fuel & Repair Stations
  const spbuTex = getSpbuTexture();
  layout.spbuStations.forEach((spbu) => {
    const spbuGroup = new THREE.Group();
    spbuGroup.position.set(spbu.x, 0, spbu.z);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.35, 9.5),
      new THREE.MeshStandardMaterial({ map: spbuTex })
    );
    canopy.position.y = 5.6;
    canopy.castShadow = true;

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    [-6, 6].forEach((px) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5, 0.7), pillarMat);
      p.position.set(px, 2.5, 0);
      spbuGroup.add(p);
    });

    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    [-2.5, 2.5].forEach((px) => {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.8), pumpMat);
      pump.position.set(px, 1.05, 0);
      spbuGroup.add(pump);
    });

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.08;
    spbuGroup.add(canopy, pad);

    worldGroup.add(spbuGroup);
  });

  // 9. Jasa Marga Green Overhead Highway Signs
  layout.tollSigns.forEach((sign) => {
    const gantry = new THREE.Group();
    gantry.position.set(sign.x, 0, sign.z);
    gantry.rotation.y = sign.rotation;

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
    [-12, 12].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 8.5, 8), poleMat);
      pole.position.set(px, 4.25, 0);
      gantry.add(pole);
    });

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 3.8, 0.35),
      new THREE.MeshStandardMaterial({
        map: getTollSignTexture(sign.label),
        emissive: isNight ? new THREE.Color(0x0b4f2b) : new THREE.Color(0x000000),
        emissiveIntensity: 0.35,
      })
    );
    board.position.set(0, 7.2, 0);
    gantry.add(board);
    worldGroup.add(gantry);
  });

  // 10. Real 3D .GLB Tropical Palm Trees, Angsana Trees & Streetlights along Sidewalks
  for (let z = -260; z <= 260; z += 36) {
    if (Math.abs(z) < 38) continue;
    [-14.5, 14.5].forEach((x, sideIdx) => {
      const poste = getCachedCityAsset("poste_luz.glb");
      if (poste) {
        const fittedPoste = fitAssetToBox(poste, 1.4, 7.2, 1.4, true);
        fittedPoste.position.set(x, 0, z);
        if (x > 0) fittedPoste.rotation.y = Math.PI;
        worldGroup.add(fittedPoste);
        cullableProps.push(fittedPoste);
      }

      const treeName =
        (Math.abs(z) + sideIdx) % 3 === 0
          ? "buriti.glb"
          : (Math.abs(z) + sideIdx) % 3 === 1
          ? "ipe_amarelo.glb"
          : "grass-trees-tall.glb";
      const treeModel = getCachedCityAsset(treeName);
      if (treeModel) {
        const fittedTree = fitAssetToBox(treeModel, 4.8, 7.8, 4.8, true);
        fittedTree.position.set(x + (x < 0 ? -2.2 : 2.2), 0, z + 15);
        worldGroup.add(fittedTree);
        cullableProps.push(fittedTree);
      }
    });
  }

  // 11. Indonesian Intersection Traffic Lights (Sleek silver pole + visor housing + glowing R/Y/G bulbs)
  const tlPoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.3 });
  const tlHousingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
  layout.trafficLights.forEach((tl) => {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(tl.x + 12.5, 0, tl.z + 12.5);

    const vPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.0, 8), tlPoleMat);
    vPole.position.y = 3.0;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 0.14), tlPoleMat);
    arm.position.set(-1.8, 5.85, 0);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.8, 0.5), tlHousingMat);
    housing.position.set(-3.4, 5.2, 0);

    const redNS = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yellowNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const redEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const yellowEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenEW = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), redNS);
    rBulb.position.set(-3.4, 5.7, 0.25);
    const yBulb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), yellowNS);
    yBulb.position.set(-3.4, 5.2, 0.25);
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), greenNS);
    gBulb.position.set(-3.4, 4.7, 0.25);

    poleGroup.add(vPole, arm, housing, rBulb, yBulb, gBulb);
    worldGroup.add(poleGroup);

    trafficLights.push({
      x: tl.x,
      z: tl.z,
      redNS,
      yellowNS,
      greenNS,
      redEW,
      yellowEW,
      greenEW,
    });
  });

  return { colliders, cullableProps, trafficLights };
}
