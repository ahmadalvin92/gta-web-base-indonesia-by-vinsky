import * as THREE from "three";
import { MapLayoutData } from "./JabodetabekMapFetcher";
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

/**
 * Multi-layered atmospheric SkyDome (GTA San Andreas Golden Haze / Bright Jakarta Noon / Night Neon)
 */
function createAtmosphericSkyDome(
  tod: "morning" | "sunset" | "night",
  isRaining: boolean
): THREE.Mesh {
  const topColor =
    tod === "night"
      ? new THREE.Color(0x050817)
      : tod === "sunset"
      ? new THREE.Color(0x3b1f5e)
      : new THREE.Color(isRaining ? 0x475569 : 0x2563eb);

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
      ? new THREE.Color(0xfbbf6b) // Classic GTA San Andreas warm golden smog haze
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

  const dome = new THREE.Mesh(new THREE.SphereGeometry(540, 24, 16), mat);
  return dome;
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
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
      }
    });
  }

  const isNight = tod === "night";
  const colliders: BuildingCollider[] = [];
  const cullableProps: THREE.Object3D[] = [];
  const trafficLights: TrafficLightMeshGroup[] = [];

  // 0. Atmospheric GTA San Andreas SkyDome + Sun Disc
  worldGroup.add(createAtmosphericSkyDome(tod, isRaining));
  if (!isNight && !isRaining) {
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(18, 16, 16),
      new THREE.MeshBasicMaterial({
        color: tod === "sunset" ? 0xff9e44 : 0xfffbeb,
      })
    );
    sunDisc.position.set(tod === "sunset" ? -320 : 210, tod === "sunset" ? 95 : 280, -240);
    worldGroup.add(sunDisc);
  }

  // 1. Ground Terrain
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x363b36, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
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
    water.position.set(wz.x, 0.03, wz.z);
    water.receiveShadow = true;
    worldGroup.add(water);
  });

  // 3. Roads, Busway, Green Bike Lane, Black-White Curbs & Flyover
  const roadMat = new THREE.MeshStandardMaterial({
    map: getAsphaltTexture(isRaining),
    roughness: isRaining ? 0.18 : 0.72,
    metalness: isRaining ? 0.45 : 0.08,
  });
  const buswayMat = new THREE.MeshStandardMaterial({ map: getBuswayTexture(), roughness: 0.65 });
  const curbMat = new THREE.MeshStandardMaterial({ map: getSidewalkCurbTexture(), roughness: 0.85 });
  const bikeMat = new THREE.MeshStandardMaterial({ map: getBikeLaneTexture(), roughness: 0.7 });
  const sepMat = new THREE.MeshStandardMaterial({ map: getSeparatorCurbTexture(), roughness: 0.6 });

  layout.roads.forEach((road) => {
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
      const angle = Math.atan2(dx, dz);
      const elev = road.isFlyover ? road.elevation ?? 8.5 : 0;

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(road.width, road.isFlyover ? 0.85 : 0.12, len),
        road.isBusway ? buswayMat : roadMat
      );
      mesh.position.set((x1 + x2) / 2, elev + (road.isFlyover ? 0 : 0.04), (z1 + z2) / 2);
      mesh.rotation.y = angle;
      mesh.receiveShadow = true;
      worldGroup.add(mesh);

      if (!road.isBusway && !road.isFlyover && road.width >= 18) {
        const curb = new THREE.Mesh(
          new THREE.BoxGeometry(road.width + 6, 0.09, len),
          curbMat
        );
        curb.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
        curb.rotation.y = angle;
        curb.receiveShadow = true;
        worldGroup.add(curb);

        const bike = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.13, len), bikeMat);
        bike.position.set((x1 + x2) / 2 + (road.width / 2 - 0.8), 0.045, (z1 + z2) / 2);
        bike.rotation.y = angle;
        worldGroup.add(bike);
      }

      if (road.isBusway) {
        const sep = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, len), sepMat);
        sep.position.set((x1 + x2) / 2 + road.width / 2 + 0.25, 0.13, (z1 + z2) / 2);
        sep.rotation.y = angle;
        worldGroup.add(sep);
      }

      if (road.isFlyover) {
        const steps = Math.max(2, Math.floor(len / 42));
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.78 });
        for (let p = 1; p < steps; p++) {
          const t = p / steps;
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(1.15, 1.35, elev, 10),
            pillarMat
          );
          pillar.position.set(x1 + dx * t, elev / 2, z1 + dz * t);
          pillar.castShadow = true;
          worldGroup.add(pillar);
        }
      }
    }
  });

  // Flyover Ramps
  const rampGeo = new THREE.BoxGeometry(14, 0.6, 56);
  const rampW = new THREE.Mesh(rampGeo, roadMat);
  rampW.position.set(-345, 4.2, -150);
  rampW.rotation.y = Math.PI / 2;
  rampW.rotation.x = 0.155;
  const rampE = new THREE.Mesh(rampGeo, roadMat);
  rampE.position.set(345, 4.2, -150);
  rampE.rotation.y = -Math.PI / 2;
  rampE.rotation.x = 0.155;
  worldGroup.add(rampW, rampE);

  // 4. Landmark Bundaran HI (Real .GLB Fountain + Twin Pillars + Monument)
  if (layout.region.id === "jakpus") {
    const outerCurb = new THREE.Mesh(
      new THREE.CylinderGeometry(19, 19.3, 0.28, 36),
      curbMat
    );
    outerCurb.position.set(0, 0.14, 0);
    worldGroup.add(outerCurb);

    const stonePlaza = new THREE.Mesh(
      new THREE.CylinderGeometry(18.5, 18.5, 0.32, 36),
      new THREE.MeshStandardMaterial({ color: 0xd6d3cd, roughness: 0.75 })
    );
    stonePlaza.position.set(0, 0.16, 0);
    worldGroup.add(stonePlaza);

    const fountainPool = new THREE.Mesh(
      new THREE.CylinderGeometry(14.5, 14.5, 0.55, 36),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.2 })
    );
    fountainPool.position.set(0, 0.3, 0);
    worldGroup.add(fountainPool);

    const sprayMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.72,
    });
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const jet = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.6, 6), sprayMat);
      jet.position.set(Math.cos(ang) * 9.5, 2.1, Math.sin(ang) * 9.5);
      worldGroup.add(jet);
    }

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.65 });
    const leftP = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14, 1.4), pillarMat);
    leftP.position.set(-1.3, 7, 0);
    const rightP = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14, 1.4), pillarMat);
    rightP.position.set(1.3, 7, 0);
    const topD = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 2.2), pillarMat);
    topD.position.set(0, 14.1, 0);
    worldGroup.add(leftP, rightP, topD);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      metalness: 0.8,
      roughness: 0.35,
    });
    [-0.75, 0.75].forEach((sx) => {
      const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.8, 8), bronzeMat);
      fig.position.set(sx, 15.8, 0);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bronzeMat);
      hd.position.set(sx, 17.45, 0);
      worldGroup.add(fig, hd);
    });
  } else {
    const mon = getCachedCityAsset("monumento.glb");
    if (mon) {
      const fitted = fitAssetToBox(mon, 10, 14, 10, true);
      fitted.position.set(0, 0, -24);
      worldGroup.add(fitted);
    }
  }

  // 5. Real 3D .GLB Halte TransJakarta + Navy Branding Fascia
  layout.halteLocations.forEach((h) => {
    const halteGroup = new THREE.Group();
    halteGroup.position.set(h.x, 0, h.z);

    const ponto = getCachedCityAsset("ponto_onibus.glb");
    if (ponto) {
      const fitted = fitAssetToBox(ponto, 5.2, 3.8, 16, false);
      halteGroup.add(fitted);
    }

    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.7, 18),
      new THREE.MeshStandardMaterial({ map: getHalteSignTexture(h.label) })
    );
    fascia.position.y = 3.55;
    halteGroup.add(fascia);
    worldGroup.add(halteGroup);
  });

  // 6. Real 3D .GLB JPO Bridge
  layout.jpoLocations.forEach((jpo) => {
    const ponte = getCachedCityAsset("ponte.glb");
    if (ponte) {
      const fitted = fitAssetToBox(ponte, 28, 6.5, 4, false);
      fitted.position.set(jpo.x, 5.2, jpo.z);
      fitted.rotation.y = jpo.rotation;
      worldGroup.add(fitted);
    } else {
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.45, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8 })
      );
      deck.position.set(jpo.x, 5.6, jpo.z);
      worldGroup.add(deck);
    }
  });

  // 7. Real 3D .GLB Skyscrapers, Commercial Towers, Malls & 3-Story Indonesian Rukos
  const skyscraperModels = [
    "predio_alto.glb",
    "predio_apartamentos.glb",
    "escritorio.glb",
    "hotel.glb",
    "banco.glb",
    "shopping.glb",
  ];
  const rukoModels = [
    "mercado.glb",
    "restaurante.glb",
    "loja_esquina.glb",
    "oficina.glb",
    "building-small-a.glb",
    "building-small-b.glb",
    "building-small-c.glb",
    "building-small-d.glb",
  ];
  const conblockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

  layout.buildings.forEach((b, idx) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(b.x, 0, b.z);

    const modelName =
      b.kind === "skyscraper"
        ? skyscraperModels[idx % skyscraperModels.length]
        : b.kind === "mall"
        ? "shopping.glb"
        : b.kind === "bengkel"
        ? idx % 2 === 0
          ? "oficina.glb"
          : "building-garage.glb"
        : rukoModels[idx % rukoModels.length];

    const glbAsset = getCachedCityAsset(modelName);
    if (glbAsset) {
      const fitted = fitAssetToBox(glbAsset, b.width, b.height, b.depth, false);
      bGroup.add(fitted);
    } else {
      const tex =
        b.kind === "skyscraper"
          ? getSkyscraperTexture(idx, isNight)
          : getRukoTexture(b.kind === "mall" ? "minimarket" : b.kind, isNight);
      const fallbackMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.width, b.height, b.depth),
        new THREE.MeshStandardMaterial({ map: tex })
      );
      fallbackMesh.position.y = b.height / 2;
      bGroup.add(fallbackMesh);
    }

    // Add Indonesian Shop Signboard on Ruko front + Conblock parking apron
    if (b.kind !== "skyscraper") {
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 3, 0.08, b.depth + 4),
        conblockMat
      );
      apron.position.y = 0.03;
      apron.receiveShadow = true;
      bGroup.add(apron);

      const signTex = getRukoTexture(
        b.kind === "mall" ? "minimarket" : b.kind,
        isNight
      );
      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(b.width * 0.72, 1.35, 0.3),
        new THREE.MeshStandardMaterial({ map: signTex })
      );
      signBoard.position.set(0, 3.6, b.depth / 2 + 0.25);
      bGroup.add(signBoard);
    }

    worldGroup.add(bGroup);
    cullableProps.push(bGroup);

    colliders.push({
      minX: b.x - b.width / 2,
      maxX: b.x + b.width / 2,
      minZ: b.z - b.depth / 2,
      maxZ: b.z + b.depth / 2,
      height: b.height,
    });
  });

  // 8. Real 3D .GLB SPBU Pertamina Stations
  const spbuTex = getSpbuTexture();
  layout.spbuStations.forEach((spbu) => {
    const spbuGroup = new THREE.Group();
    spbuGroup.position.set(spbu.x, 0, spbu.z);

    const stationModel = getCachedCityAsset("posto_recarga.glb");
    if (stationModel) {
      const fitted = fitAssetToBox(stationModel, 14, 5.5, 9, false);
      spbuGroup.add(fitted);
    }

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.3, 9.5),
      new THREE.MeshStandardMaterial({ map: spbuTex })
    );
    canopy.position.y = 5.6;
    spbuGroup.add(canopy);

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.08;
    spbuGroup.add(pad);

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

  // 10. Real 3D .GLB Palm Trees, Tropical Trees & Streetlights along Sidewalks
  for (let z = -260; z <= 260; z += 34) {
    if (Math.abs(z) < 28) continue;
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
        fittedTree.position.set(x + (x < 0 ? -2.4 : 2.4), 0, z + 14);
        worldGroup.add(fittedTree);
        cullableProps.push(fittedTree);
      }
    });
  }

  // 11. Real 3D .GLB Traffic Lights with Animated Bulbs
  layout.trafficLights.forEach((tl) => {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(tl.x + 12, 0, tl.z + 12);

    const semaforo = getCachedCityAsset("semaforo.glb");
    if (semaforo) {
      const fittedSem = fitAssetToBox(semaforo, 2.2, 6.4, 2.2, true);
      poleGroup.add(fittedSem);
    }

    const redNS = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yellowNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const redEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const yellowEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenEW = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), redNS);
    rBulb.position.set(-1.6, 5.6, 0.35);
    const yBulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), yellowNS);
    yBulb.position.set(-1.6, 5.05, 0.35);
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), greenNS);
    gBulb.position.set(-1.6, 4.5, 0.35);

    poleGroup.add(rBulb, yBulb, gBulb);
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
