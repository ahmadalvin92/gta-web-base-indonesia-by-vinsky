import * as THREE from "three";
import { MapLayoutData } from "./JabodetabekMapFetcher";
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

export function buildJakartaCityScene(
  worldGroup: THREE.Group,
  layout: MapLayoutData,
  isNight: boolean,
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

  const colliders: BuildingCollider[] = [];
  const cullableProps: THREE.Object3D[] = [];
  const trafficLights: TrafficLightMeshGroup[] = [];

  // 1. Base City Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x262d28, roughness: 0.94 })
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

  // 3. Roads, Busway, Green Bike Lane, Black-White Sidewalk Curbs & Elevated Flyover
  const roadMat = new THREE.MeshStandardMaterial({
    map: getAsphaltTexture(isRaining),
    roughness: isRaining ? 0.18 : 0.72,
    metalness: isRaining ? 0.45 : 0.08,
  });
  const buswayMat = new THREE.MeshStandardMaterial({
    map: getBuswayTexture(),
    roughness: 0.65,
  });
  const curbMat = new THREE.MeshStandardMaterial({
    map: getSidewalkCurbTexture(),
    roughness: 0.85,
  });
  const bikeMat = new THREE.MeshStandardMaterial({
    map: getBikeLaneTexture(),
    roughness: 0.7,
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

        // Jakarta Green Bicycle Lane (Jalur Sepeda) along outer curb
        const bike = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.13, len), bikeMat);
        bike.position.set((x1 + x2) / 2 + (road.width / 2 - 0.8), 0.045, (z1 + z2) / 2);
        bike.rotation.y = angle;
        worldGroup.add(bike);
      }

      if (road.isBusway) {
        // Yellow-black busway separator curb
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

  // Elevated Simpang Susun Semanggi / Flyover access ramps
  const rampGeo = new THREE.BoxGeometry(14, 0.6, 56);
  const rampW = new THREE.Mesh(rampGeo, roadMat);
  rampW.position.set(-345, 4.2, -150);
  rampW.rotation.y = Math.PI / 2;
  rampW.rotation.x = 0.155;
  worldGroup.add(rampW);

  const rampE = new THREE.Mesh(rampGeo, roadMat);
  rampE.position.set(345, 4.2, -150);
  rampE.rotation.y = -Math.PI / 2;
  rampE.rotation.x = 0.155;
  worldGroup.add(rampE);

  // 4. Landmark Bundaran HI (Kolam Air Mancur, Kanstin Hitam-Putih, & Tugu Selamat Datang Kembar)
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
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.1,
        metalness: 0.2,
      })
    );
    fountainPool.position.set(0, 0.3, 0);
    worldGroup.add(fountainPool);

    // Fountain water spray rings
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

    // Twin vertical concrete pillars of Monumen Selamat Datang
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.65 });
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14, 1.4), pillarMat);
    leftPillar.position.set(-1.3, 7, 0);
    leftPillar.castShadow = true;
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 14, 1.4), pillarMat);
    rightPillar.position.set(1.3, 7, 0);
    rightPillar.castShadow = true;
    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 2.2), pillarMat);
    topDeck.position.set(0, 14.1, 0);
    worldGroup.add(leftPillar, rightPillar, topDeck);

    // Bronze Couple Statues waving toward Jl. M.H. Thamrin
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      metalness: 0.8,
      roughness: 0.35,
    });
    [-0.75, 0.75].forEach((sx) => {
      const figure = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.8, 8), bronzeMat);
      figure.position.set(sx, 15.8, 0);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bronzeMat);
      head.position.set(sx, 17.45, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, 0.2), bronzeMat);
      arm.position.set(sx + (sx < 0 ? -0.4 : 0.4), 17.1, 0.2);
      arm.rotation.z = sx < 0 ? 0.5 : -0.5;
      worldGroup.add(figure, head, arm);
    });
  } else {
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xff3e9d,
      emissive: new THREE.Color(0xff3e9d),
      emissiveIntensity: isNight ? 1.2 : 0.25,
    });
    const leftP = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 1.4), archMat);
    leftP.position.set(-12, 4.5, -24);
    const rightP = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 1.4), archMat);
    rightP.position.set(12, 4.5, -24);
    const topB = new THREE.Mesh(new THREE.BoxGeometry(25.6, 1.8, 1.6), archMat);
    topB.position.set(0, 9.2, -24);
    worldGroup.add(leftP, rightP, topB);
  }

  // 5. Halte TransJakarta Revitalisasi (White Cruise-Ship Overhang + Navy Fascia)
  layout.halteLocations.forEach((h) => {
    const halte = new THREE.Group();
    halte.position.set(h.x, 0, h.z);

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.85, 22),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
    );
    platform.position.y = 0.42;
    halte.add(platform);

    const glassWall = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.5, 19),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.35,
      })
    );
    glassWall.position.y = 2.05;
    halte.add(glassWall);

    // White ship-bow sleek canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.5, 25),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
    );
    canopy.position.y = 3.85;
    canopy.castShadow = true;
    halte.add(canopy);

    // Navy-blue TransJakarta branding fascia
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(5.7, 0.65, 22),
      new THREE.MeshStandardMaterial({ map: getHalteSignTexture(h.label) })
    );
    fascia.position.y = 3.35;
    halte.add(fascia);

    worldGroup.add(halte);
  });

  // 6. JPO Sudirman / Pondok Indah (Silver Metallic Arched Overpass)
  const jpoSteelMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.8,
    roughness: 0.28,
  });
  layout.jpoLocations.forEach((jpo) => {
    const g = new THREE.Group();
    g.position.set(jpo.x, 0, jpo.z);
    g.rotation.y = jpo.rotation;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(28, 0.45, 3.2), jpoSteelMat);
    deck.position.y = 5.6;
    deck.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(28, 0.25, 3.4), jpoSteelMat);
    roof.position.y = 8.0;
    const railF = new THREE.Mesh(new THREE.BoxGeometry(28, 1.1, 0.12), jpoSteelMat);
    railF.position.set(0, 6.3, 1.55);
    const railB = new THREE.Mesh(new THREE.BoxGeometry(28, 1.1, 0.12), jpoSteelMat);
    railB.position.set(0, 6.3, -1.55);
    [-13.5, 13.5].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, 7.8, 3.0), jpoSteelMat);
      col.position.set(px, 3.9, 0);
      g.add(col);
    });
    g.add(deck, roof, railF, railB);
    worldGroup.add(g);
  });

  // 7. Buildings (Skyscrapers + Dense 3-Story Indonesian Rukos + Conblock Aprons)
  const conblockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  layout.buildings.forEach((b, idx) => {
    const tex =
      b.kind === "skyscraper"
        ? getSkyscraperTexture(idx, isNight)
        : getRukoTexture(b.kind === "mall" ? "minimarket" : b.kind, isNight);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: b.kind === "skyscraper" ? 0.22 : 0.72,
      metalness: b.kind === "skyscraper" ? 0.65 : 0.08,
      emissive: isNight ? new THREE.Color(0x1e1b4b) : new THREE.Color(0x000000),
      emissiveMap: isNight ? tex : null,
      emissiveIntensity: isNight ? 0.55 : 0,
    });

    const bMesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.width, b.height, b.depth),
      mat
    );
    bMesh.position.set(b.x, b.height / 2, b.z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    worldGroup.add(bMesh);
    cullableProps.push(bMesh);

    if (b.kind !== "skyscraper") {
      // Conblock parking apron in front of 3-story ruko
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 2.5, 0.08, b.depth + 3.5),
        conblockMat
      );
      apron.position.set(b.x, 0.03, b.z);
      apron.receiveShadow = true;
      worldGroup.add(apron);
    } else if (isNight) {
      const neonRoof = new THREE.Mesh(
        new THREE.BoxGeometry(b.width + 0.4, 0.7, b.depth + 0.4),
        new THREE.MeshBasicMaterial({
          color: idx % 2 === 0 ? 0xff3e9d : 0x00f0ff,
        })
      );
      neonRoof.position.set(b.x, b.height + 0.35, b.z);
      worldGroup.add(neonRoof);
      cullableProps.push(neonRoof);
    }

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
      new THREE.BoxGeometry(16, 1.4, 10),
      new THREE.MeshStandardMaterial({ map: spbuTex })
    );
    canopy.position.y = 5.4;
    canopy.castShadow = true;
    spbuGroup.add(canopy);

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

  // 10. Dense Sidewalk Palm Trees, Angsana Shade Trees, Pucuk Merah Shrubs & Streetlights
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
  const angsanaLeafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
  const pucukMerahMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: isNight ? 0xfef08a : 0xe2e8f0 });

  for (let z = -260; z <= 260; z += 36) {
    if (Math.abs(z) < 26) continue;
    [-14.2, 14.2].forEach((x, sideIdx) => {
      // Modern round disk-head Jakarta streetlight (observed at Bundaran HI & SCBD)
      const lightGroup = new THREE.Group();
      lightGroup.position.set(x, 0, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 7.2, 6), poleMat);
      pole.position.y = 3.6;
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 12), bulbMat);
      disk.position.set(x < 0 ? 0.5 : -0.5, 7.2, 0);
      lightGroup.add(pole, disk);
      worldGroup.add(lightGroup);
      cullableProps.push(lightGroup);

      // Alternating Palm / Angsana tree + trimmed Pucuk Merah shrub along sidewalk
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x + (x < 0 ? -2.2 : 2.2), 0, z + 14);
      if ((Math.abs(z) + sideIdx) % 2 === 0) {
        // Tall Palm Tree
        const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 6.8, 7), trunkMat);
        tTrunk.position.y = 3.4;
        const crown = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 7), palmLeafMat);
        crown.position.y = 7.1;
        crown.rotation.x = Math.PI;
        treeGroup.add(tTrunk, crown);
      } else {
        // Angsana shade tree + Pucuk Merah shrub
        const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 4.2, 7), trunkMat);
        tTrunk.position.y = 2.1;
        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 0), angsanaLeafMat);
        canopy.position.y = 5.4;
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), pucukMerahMat);
        shrub.position.set(0, 0.85, -4);
        treeGroup.add(tTrunk, canopy, shrub);
      }
      worldGroup.add(treeGroup);
      cullableProps.push(treeGroup);
    });
  }

  // 11. Animated Intersection Traffic Lights (Lampu Merah Persimpangan)
  layout.trafficLights.forEach((tl) => {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(tl.x + 12, 0, tl.z + 12);

    const vPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.2, 8), poleMat);
    vPole.position.y = 3.1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 0.16), poleMat);
    arm.position.set(-2.6, 6.0, 0);
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 2.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x09090b })
    );
    housing.position.set(-4.5, 5.6, 0);

    const redNS = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yellowNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenNS = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const redEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const yellowEW = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const greenEW = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    const rBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), redNS);
    rBulb.position.set(-4.5, 6.2, 0.25);
    const yBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), yellowNS);
    yBulb.position.set(-4.5, 5.6, 0.25);
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), greenNS);
    gBulb.position.set(-4.5, 5.0, 0.25);

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
