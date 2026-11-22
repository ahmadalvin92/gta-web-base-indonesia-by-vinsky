import * as THREE from "three";
import { GLTFLoader, DRACOLoader, SkeletonUtils } from "three-stdlib";
import { getLicensePlateTexture } from "./IndonesianTextureGenerator";

export type VehicleKind =
  | "avanza"
  | "innova"
  | "mercy"
  | "bmw"
  | "civic"
  | "bluebird"
  | "supercar"
  | "sport"
  | "hatchback"
  | "sedan"
  | "suv"
  | "bus_transjakarta"
  | "police_pjr"
  | "angkot"
  | "motor"
  | "jet"
  | "speedboat";

export interface VehicleSpec {
  id: VehicleKind;
  name: string;
  category: "Mobil Rakyat & CDID" | "Eropa & Sport" | "Dinas & Umum" | "Udara & Laut";
  glbPath?: string;
  glbYawOffset?: number;
  defaultColor: string;
  defaultPlate: string;
  maxSpeedKmh: number;
  acceleration: number;
  handling: number;
  isAircraft?: boolean;
  isBoat?: boolean;
  hasTelolet?: boolean;
  isPolice?: boolean;
  isTaxi?: boolean;
  targetDims: { length: number; width: number; height: number };
}

export const VEHICLE_SPECS: VehicleSpec[] = [
  {
    id: "avanza",
    name: "Toyota Avanza / Veloz",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/avanza.glb",
    glbYawOffset: 0,
    defaultColor: "#e2e8f0",
    defaultPlate: "B 2026 VIN",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.75,
    targetDims: { length: 4.45, width: 1.84, height: 1.66 },
  },
  {
    id: "innova",
    name: "Kijang Innova Zenix / Reborn",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/innova.glb",
    glbYawOffset: 0,
    defaultColor: "#1e293b",
    defaultPlate: "B 1089 RFS",
    maxSpeedKmh: 215,
    acceleration: 34,
    handling: 2.68,
    targetDims: { length: 4.72, width: 1.88, height: 1.72 },
  },
  {
    id: "mercy",
    name: "Mercedes-Benz C/E-Class",
    category: "Eropa & Sport",
    glbPath: "/models/cars/mercy.glb",
    glbYawOffset: 0,
    defaultColor: "#cbd5e1",
    defaultPlate: "B 777 MBY",
    maxSpeedKmh: 280,
    acceleration: 44,
    handling: 3.05,
    targetDims: { length: 4.65, width: 1.88, height: 1.42 },
  },
  {
    id: "bmw",
    name: "BMW M4 / 3-Series",
    category: "Eropa & Sport",
    glbPath: "/models/cars/bmw.glb",
    glbYawOffset: 0,
    defaultColor: "#1d4ed8",
    defaultPlate: "B 444 BMW",
    maxSpeedKmh: 305,
    acceleration: 48,
    handling: 3.15,
    targetDims: { length: 4.62, width: 1.9, height: 1.38 },
  },
  {
    id: "civic",
    name: "Honda Civic Type-R JDM",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/civic.glb",
    glbYawOffset: 0,
    defaultColor: "#f8fafc",
    defaultPlate: "B 1945 JDM",
    maxSpeedKmh: 278,
    acceleration: 43,
    handling: 3.12,
    targetDims: { length: 4.55, width: 1.88, height: 1.4 },
  },
  {
    id: "supercar",
    name: "Ferrari 458 / Hyperion V12",
    category: "Eropa & Sport",
    glbPath: "/models/cars/supercar.glb",
    glbYawOffset: Math.PI, // Three.js ferrari.glb natively faces -Z
    defaultColor: "#dc2626",
    defaultPlate: "B 1 VKY",
    maxSpeedKmh: 355,
    acceleration: 56,
    handling: 3.2,
    targetDims: { length: 4.55, width: 1.96, height: 1.24 },
  },
  {
    id: "sport",
    name: "Griffin GT Coupe",
    category: "Eropa & Sport",
    glbPath: "/models/cars/sport.glb",
    glbYawOffset: 0,
    defaultColor: "#e11d48",
    defaultPlate: "B 888 AAG",
    maxSpeedKmh: 310,
    acceleration: 47,
    handling: 3.05,
    targetDims: { length: 4.48, width: 1.92, height: 1.32 },
  },
  {
    id: "hatchback",
    name: "JDM Hatchback Modif",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/hatchback.glb",
    glbYawOffset: 0,
    defaultColor: "#facc15",
    defaultPlate: "B 1212 YRS",
    maxSpeedKmh: 235,
    acceleration: 36,
    handling: 3.2,
    targetDims: { length: 4.18, width: 1.82, height: 1.46 },
  },
  {
    id: "sedan",
    name: "Sedan Executive JKT",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/sedan.glb",
    glbYawOffset: 0,
    defaultColor: "#0f172a",
    defaultPlate: "B 2025 IDR",
    maxSpeedKmh: 265,
    acceleration: 40,
    handling: 3.0,
    targetDims: { length: 4.52, width: 1.88, height: 1.4 },
  },
  {
    id: "suv",
    name: "SUV Fortuner / Pajero",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/suv.glb",
    glbYawOffset: 0,
    defaultColor: "#111827",
    defaultPlate: "B 999 VNZ",
    maxSpeedKmh: 225,
    acceleration: 33,
    handling: 2.6,
    targetDims: { length: 4.78, width: 1.92, height: 1.74 },
  },
  {
    id: "bluebird",
    name: "Taksi Bluebird Jakarta",
    category: "Dinas & Umum",
    glbPath: "/models/cars/bluebird.glb",
    glbYawOffset: 0,
    defaultColor: "#38bdf8",
    defaultPlate: "B 2889 DR",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.8,
    isTaxi: true,
    targetDims: { length: 4.45, width: 1.82, height: 1.54 },
  },
  {
    id: "bus_transjakarta",
    name: "Bus TransJakarta Telolet",
    category: "Dinas & Umum",
    glbPath: "/models/cars/transjakarta.glb",
    glbYawOffset: 0,
    defaultColor: "#0284c7",
    defaultPlate: "B 7123 TJ",
    maxSpeedKmh: 145,
    acceleration: 20,
    handling: 1.9,
    hasTelolet: true,
    targetDims: { length: 9.8, width: 2.45, height: 3.05 },
  },
  {
    id: "police_pjr",
    name: "Mobil Polisi PJR Korlantas",
    category: "Dinas & Umum",
    glbPath: "/models/cars/police.glb",
    glbYawOffset: 0,
    defaultColor: "#ffffff",
    defaultPlate: "VII 1204-00",
    maxSpeedKmh: 275,
    acceleration: 44,
    handling: 2.95,
    isPolice: true,
    targetDims: { length: 4.55, width: 1.9, height: 1.44 },
  },
  {
    id: "angkot",
    name: "Angkot Mikrolet Biru",
    category: "Dinas & Umum",
    glbPath: "/models/cars/angkot.glb",
    glbYawOffset: 0,
    defaultColor: "#06b6d4",
    defaultPlate: "B 1452 WK",
    maxSpeedKmh: 155,
    acceleration: 24,
    handling: 2.45,
    hasTelolet: true,
    targetDims: { length: 4.18, width: 1.78, height: 1.82 },
  },
  {
    id: "motor",
    name: "Motor Sport / Skuter JKT",
    category: "Dinas & Umum",
    defaultColor: "#111827",
    defaultPlate: "B 4510 VKY",
    maxSpeedKmh: 175,
    acceleration: 42,
    handling: 3.5,
    targetDims: { length: 2.05, width: 0.78, height: 1.15 },
  },
  {
    id: "jet",
    name: "Jet Eksekutif Nusantara",
    category: "Udara & Laut",
    defaultColor: "#e2e8f0",
    defaultPlate: "PK-VKY",
    maxSpeedKmh: 520,
    acceleration: 68,
    handling: 2.2,
    isAircraft: true,
    targetDims: { length: 9.6, width: 8.8, height: 2.8 },
  },
  {
    id: "speedboat",
    name: "Speedboat Pantai PIK",
    category: "Udara & Laut",
    defaultColor: "#0ea5e9",
    defaultPlate: "PIK-099",
    maxSpeedKmh: 185,
    acceleration: 35,
    handling: 2.6,
    isBoat: true,
    targetDims: { length: 6.2, width: 2.2, height: 1.35 },
  },
];

export const CITY_ASSET_FILES = [
  "predio_alto.glb",
  "predio_apartamentos.glb",
  "escritorio.glb",
  "hotel.glb",
  "banco.glb",
  "shopping.glb",
  "mercado.glb",
  "restaurante.glb",
  "loja_esquina.glb",
  "oficina.glb",
  "posto_recarga.glb",
  "policia.glb",
  "hospital.glb",
  "monumento.glb",
  "ponto_onibus.glb",
  "semaforo.glb",
  "poste_luz.glb",
  "ponte.glb",
  "buriti.glb",
  "ipe_amarelo.glb",
  "building-small-a.glb",
  "building-small-b.glb",
  "building-small-c.glb",
  "building-small-d.glb",
  "building-garage.glb",
  "pavement-fountain.glb",
  "grass-trees.glb",
  "grass-trees-tall.glb",
];

interface CachedGLTFData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

let sharedGLTFLoader: GLTFLoader | null = null;
const gltfCache = new Map<string, CachedGLTFData>();

function getGLTFLoader(): GLTFLoader {
  if (!sharedGLTFLoader) {
    sharedGLTFLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
    );
    sharedGLTFLoader.setDRACOLoader(dracoLoader);
  }
  return sharedGLTFLoader;
}

async function loadGLTFUrl(url: string): Promise<CachedGLTFData | null> {
  if (gltfCache.has(url)) return gltfCache.get(url)!;
  try {
    const loader = getGLTFLoader();
    const gltf = await loader.loadAsync(url);
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const entry: CachedGLTFData = {
      scene: gltf.scene,
      animations: gltf.animations || [],
    };
    gltfCache.set(url, entry);
    return entry;
  } catch {
    return null;
  }
}

export function getCachedCityAsset(filename: string): THREE.Group | null {
  const entry = gltfCache.get(`/models/city/${filename}`);
  if (!entry) return null;
  return entry.scene.clone(true);
}

/**
 * Preloads all real 3D .GLB assets (characters, vehicles, city buildings, trees & props)
 * so every 3D object in GTA Indonesia renders immediately with real .glb meshes.
 */
export async function preloadAllGameModels(
  onProgress?: (pct: number, label: string) => void
): Promise<void> {
  const urls = new Set<string>();
  urls.add("/models/characters/Soldier.glb");
  urls.add("/models/characters/Michelle.glb");
  for (const spec of VEHICLE_SPECS) {
    if (spec.glbPath) urls.add(spec.glbPath);
  }
  for (const file of CITY_ASSET_FILES) {
    urls.add(`/models/city/${file}`);
  }

  const list = Array.from(urls);
  let loaded = 0;
  const concurrency = 6;

  for (let i = 0; i < list.length; i += concurrency) {
    const batch = list.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (url) => {
        await loadGLTFUrl(url);
        loaded++;
        const pct = Math.round((loaded / list.length) * 100);
        if (onProgress) {
          onProgress(pct, `Memuat model 3D nyata (${loaded}/${list.length}): ${url.split("/").pop()}`);
        }
      })
    );
  }
}

export interface CabinFitResult {
  scale: number;
  dimensions: THREE.Vector3;
  seatOffset: THREE.Vector3;
  cockpitCamOffset: THREE.Vector3;
  hoodCamOffset: THREE.Vector3;
}

export function autoScaleAndFitCabin(
  model: THREE.Object3D,
  targetLength = 4.5,
  targetWidth = 1.9,
  targetHeight = 1.4
): CabinFitResult {
  model.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);

  const safeX = Math.max(rawSize.x, 0.01);
  const safeY = Math.max(rawSize.y, 0.01);
  const safeZ = Math.max(rawSize.z, 0.01);

  const scaleX = targetWidth / safeX;
  const scaleZ = targetLength / safeZ;
  const scaleY = targetHeight / safeY;
  const uniformScale = (scaleX + scaleZ) * 0.5;

  model.scale.set(
    uniformScale,
    Math.min(Math.max(scaleY, uniformScale * 0.8), uniformScale * 1.25),
    uniformScale
  );
  model.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  scaledBox.getCenter(center);

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= scaledBox.min.y;
  model.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(model);
  const dims = new THREE.Vector3();
  finalBox.getSize(dims);

  const seatY = Math.max(0.24, dims.y * 0.22);
  const seatZ = dims.z * 0.04;
  const seatX = -dims.x * 0.19;

  return {
    scale: uniformScale,
    dimensions: dims,
    seatOffset: new THREE.Vector3(seatX, seatY, seatZ),
    cockpitCamOffset: new THREE.Vector3(seatX, seatY + 0.65, seatZ + 0.16),
    hoodCamOffset: new THREE.Vector3(0, dims.y * 0.68, dims.z * 0.24),
  };
}

export interface VehicleInstance {
  kind: VehicleKind;
  spec: VehicleSpec;
  group: THREE.Group;
  cabinFit: CabinFitResult;
  wheels: THREE.Object3D[];
  sirenRed?: THREE.Mesh;
  sirenBlue?: THREE.Mesh;
  neonMesh?: THREE.Mesh;
  setPaintColor: (hex: string) => void;
  setRimColor: (hex: string) => void;
  setPlateText: (plate: string) => void;
  setNeon: (enabled: boolean, hex?: string) => void;
  setLightsState: (opts: {
    headlightsOn: boolean;
    braking: boolean;
    leftTurn: boolean;
    rightTurn: boolean;
    hazard: boolean;
    timeSec: number;
    policeActive: boolean;
  }) => void;
  dispose: () => void;
}

export function createVehicleMesh(
  kind: VehicleKind,
  options?: {
    paintColor?: string;
    rimColor?: string;
    plateText?: string;
    neonEnabled?: boolean;
    neonColor?: string;
  }
): VehicleInstance {
  const spec = VEHICLE_SPECS.find((v) => v.id === kind) ?? VEHICLE_SPECS[0];
  const paintHex = options?.paintColor ?? spec.defaultColor;
  const plateStr = options?.plateText ?? spec.defaultPlate;
  const neonHex = options?.neonColor ?? "#ff3e9d";

  const root = new THREE.Group();
  const modelBody = new THREE.Group();
  root.add(modelBody);

  const wheels: THREE.Object3D[] = [];
  const paintableMats: THREE.MeshStandardMaterial[] = [];
  const rimMats: THREE.MeshStandardMaterial[] = [];

  const cachedGLB = spec.glbPath ? gltfCache.get(spec.glbPath) : null;

  if (cachedGLB) {
    const glbClone = cachedGLB.scene.clone(true);
    if (spec.glbYawOffset) {
      glbClone.rotation.y = spec.glbYawOffset;
    }

    // Clone materials per vehicle instance so paint/rim customization does not mutate shared cache
    glbClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;

        const cloneMat = (mat: THREE.Material) => {
          const cloned = mat.clone() as THREE.MeshStandardMaterial;
          const mName = (cloned.name || "").toLowerCase();
          if (
            mName.includes("body") ||
            mName.includes("car") ||
            mName.includes("paint") ||
            mName.includes("parede")
          ) {
            paintableMats.push(cloned);
          }
          if (mName.includes("metal") || mName.includes("rim")) {
            rimMats.push(cloned);
          }
          return cloned;
        };

        if (Array.isArray(m.material)) {
          m.material = m.material.map(cloneMat);
        } else if (m.material) {
          m.material = cloneMat(m.material);
        }
      }

      if (/wheel/i.test(child.name) && !/steering/i.test(child.name)) {
        wheels.push(child);
      }
    });

    if (options?.paintColor && paintableMats.length > 0) {
      paintableMats.forEach((pm) => pm.color.set(paintHex));
    }

    modelBody.add(glbClone);
  } else {
    // Clean fallback only for Motor / Jet / Speedboat
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(paintHex),
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 1.0,
    });
    paintableMats.push(paintMat);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b1628,
      transparent: true,
      opacity: 0.45,
    });

    if (kind === "jet") {
      const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.65, 8.8, 16), paintMat);
      fus.rotation.x = Math.PI / 2;
      fus.position.y = 1.35;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 16), paintMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.35, 5.3);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.14, 1.8), paintMat);
      wing.position.set(0, 1.15, 0.2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 1.4), darkMat);
      tail.position.set(0, 2.4, -3.7);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.9), glassMat);
      canopy.position.set(0, 1.95, 2.4);
      modelBody.add(fus, nose, wing, tail, canopy);
    } else if (kind === "speedboat") {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 5.8), paintMat);
      hull.position.y = 0.42;
      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.42, 2.0), glassMat);
      shield.position.set(0, 0.85, 0.2);
      modelBody.add(hull, shield);
    } else {
      // Motor
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 1.75), paintMat);
      frame.position.y = 0.56;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.1), darkMat);
      bar.position.set(0, 1.0, 0.55);
      modelBody.add(frame, bar);
      [0.68, -0.68].forEach((wz) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 14), darkMat);
        t.rotation.z = Math.PI / 2;
        t.position.set(0, 0.28, wz);
        modelBody.add(t);
        wheels.push(t);
      });
    }
  }

  const cabinFit = autoScaleAndFitCabin(
    modelBody,
    spec.targetDims.length,
    spec.targetDims.width,
    spec.targetDims.height
  );

  const halfL = cabinFit.dimensions.z / 2;
  const width = cabinFit.dimensions.x;
  const height = cabinFit.dimensions.y;

  // Indonesian White License Plates (front & rear) attached to scaled vehicle bounds
  let plateTexture = getLicensePlateTexture(plateStr, true);
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTexture, roughness: 0.35 });
  if (kind !== "jet" && kind !== "speedboat" && kind !== "motor") {
    const fPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.03), plateMat);
    fPlate.position.set(0, 0.36, halfL + 0.02);
    const rPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.03), plateMat);
    rPlate.position.set(0, 0.44, -halfL - 0.02);
    root.add(fPlate, rPlate);
  }

  // Headlight, Brake & Turn Signal LED Strips
  const hlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xe0f2fe),
    emissiveIntensity: 1.4,
  });
  const tlMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: new THREE.Color(0xdc2626),
    emissiveIntensity: 1.0,
  });
  const leftSigMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0,
  });
  const rightSigMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0,
  });

  if (kind !== "jet" && kind !== "motor") {
    [-width * 0.33, width * 0.33].forEach((lx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.04), hlMat);
      hl.position.set(lx, height * 0.42, halfL + 0.01);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.04), tlMat);
      tl.position.set(lx, height * 0.46, -halfL - 0.01);
      root.add(hl, tl);
    });
    const lsF = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), leftSigMat);
    lsF.position.set(-width * 0.44, height * 0.42, halfL + 0.01);
    const lsR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), leftSigMat);
    lsR.position.set(-width * 0.44, height * 0.46, -halfL - 0.01);
    const rsF = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), rightSigMat);
    rsF.position.set(width * 0.44, height * 0.42, halfL + 0.01);
    const rsR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), rightSigMat);
    rsR.position.set(width * 0.44, height * 0.46, -halfL - 0.01);
    root.add(lsF, lsR, rsF, rsR);
  }

  // Police PJR Red/Blue Strobe Bar
  let sirenRed: THREE.Mesh | undefined;
  let sirenBlue: THREE.Mesh | undefined;
  if (spec.isPolice) {
    sirenRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xff0022,
        emissive: new THREE.Color(0xff0022),
        emissiveIntensity: 2.4,
      })
    );
    sirenRed.position.set(-0.28, height + 0.06, -0.05);
    sirenBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x0066ff,
        emissive: new THREE.Color(0x0066ff),
        emissiveIntensity: 2.4,
      })
    );
    sirenBlue.position.set(0.28, height + 0.06, -0.05);
    root.add(sirenRed, sirenBlue);
  }

  // Neon Underglow
  const neonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(neonHex),
    transparent: true,
    opacity: options?.neonEnabled ? 0.52 : 0.0,
    side: THREE.DoubleSide,
  });
  const neonMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.15, spec.targetDims.length * 0.92),
    neonMat
  );
  neonMesh.rotation.x = -Math.PI / 2;
  neonMesh.position.y = 0.035;
  root.add(neonMesh);

  return {
    kind,
    spec,
    group: root,
    cabinFit,
    wheels,
    sirenRed,
    sirenBlue,
    neonMesh,
    setPaintColor: (hex: string) => {
      paintableMats.forEach((m) => m.color.set(hex));
    },
    setRimColor: (hex: string) => {
      rimMats.forEach((m) => m.color.set(hex));
    },
    setPlateText: (plate: string) => {
      plateTexture = getLicensePlateTexture(plate, true);
      plateMat.map = plateTexture;
      plateMat.needsUpdate = true;
    },
    setNeon: (enabled: boolean, hex?: string) => {
      if (hex) neonMat.color.set(hex);
      neonMat.opacity = enabled ? 0.52 : 0.0;
    },
    setLightsState: ({
      headlightsOn,
      braking,
      leftTurn,
      rightTurn,
      hazard,
      timeSec,
      policeActive,
    }) => {
      hlMat.emissiveIntensity = headlightsOn ? 2.4 : 0.45;
      tlMat.emissiveIntensity = braking ? 3.5 : headlightsOn ? 1.2 : 0.3;

      const blink = Math.sin(timeSec * 8) > 0;
      leftSigMat.emissiveIntensity = (leftTurn || hazard) && blink ? 3.2 : 0.0;
      rightSigMat.emissiveIntensity = (rightTurn || hazard) && blink ? 3.2 : 0.0;

      if (sirenRed && sirenBlue) {
        const phase = Math.sin(timeSec * 14) > 0;
        const rMat = sirenRed.material as THREE.MeshStandardMaterial;
        const bMat = sirenBlue.material as THREE.MeshStandardMaterial;
        if (policeActive) {
          rMat.emissiveIntensity = phase ? 4.5 : 0.2;
          bMat.emissiveIntensity = phase ? 0.2 : 4.5;
        } else {
          rMat.emissiveIntensity = 0.6;
          bMat.emissiveIntensity = 0.6;
        }
      }
    },
    dispose: () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
    },
  };
}

export interface CharacterInstance {
  group: THREE.Group;
  weaponMesh: THREE.Group;
  setSittingInCabin: (sitting: boolean) => void;
  animate: (opts: {
    dt: number;
    timeSec: number;
    speedRatio: number;
    isJumping: boolean;
    isSwimming: boolean;
    isAiming: boolean;
  }) => void;
  dispose: () => void;
}

/**
 * Rigged Skeletal-Animated 3D Human Character (Soldier.glb with Idle, Walk, Run AnimationClips)
 * cloned safely via SkeletonUtils.clone.
 */
export function createCharacterMesh(opts?: { tintHex?: string }): CharacterInstance {
  const group = new THREE.Group();
  const soldierCache = gltfCache.get("/models/characters/Soldier.glb");

  let mixer: THREE.AnimationMixer | null = null;
  let idleAction: THREE.AnimationAction | null = null;
  let walkAction: THREE.AnimationAction | null = null;
  let runAction: THREE.AnimationAction | null = null;
  let currentAction: THREE.AnimationAction | null = null;

  const weaponMesh = new THREE.Group();
  const rifleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.14, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.7, roughness: 0.3 })
  );
  rifleBody.position.set(0.26, 1.25, 0.36);
  weaponMesh.add(rifleBody);
  weaponMesh.visible = false;
  group.add(weaponMesh);

  if (soldierCache) {
    const model = SkeletonUtils.clone(soldierCache.scene) as THREE.Group;
    model.rotation.y = Math.PI; // Soldier.glb natively faces -Z -> rotate to +Z forward
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        if (opts?.tintHex && m.material && !Array.isArray(m.material)) {
          const clonedMat = m.material.clone() as THREE.MeshStandardMaterial;
          clonedMat.color.lerp(new THREE.Color(opts.tintHex), 0.38);
          m.material = clonedMat;
        }
      }
    });
    group.add(model);

    if (soldierCache.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const findClip = (name: string) =>
        soldierCache.animations.find((c) => c.name.toLowerCase() === name.toLowerCase());

      const idleClip = findClip("Idle") || soldierCache.animations[0];
      const walkClip = findClip("Walk") || idleClip;
      const runClip = findClip("Run") || walkClip;

      idleAction = mixer.clipAction(idleClip);
      walkAction = mixer.clipAction(walkClip);
      runAction = mixer.clipAction(runClip);

      idleAction.play();
      currentAction = idleAction;
    }
  } else {
    // Fallback minimal articulated character if GLB wasn't cached yet
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 0.9, 6, 10),
      new THREE.MeshStandardMaterial({ color: opts?.tintHex ?? 0x2563eb })
    );
    body.position.y = 0.95;
    group.add(body);
  }

  let isSitting = false;

  const switchAction = (next: THREE.AnimationAction | null) => {
    if (!next || next === currentAction) return;
    currentAction?.fadeOut(0.18);
    next.reset().fadeIn(0.18).play();
    currentAction = next;
  };

  return {
    group,
    weaponMesh,
    setSittingInCabin: (sitting: boolean) => {
      isSitting = sitting;
      if (sitting) {
        // Hide/compact inside tinted cabin so driver head never clips through roof
        group.visible = false;
        weaponMesh.visible = false;
      } else {
        group.visible = true;
        group.scale.setScalar(1.0);
        switchAction(idleAction);
      }
    },
    animate: ({ dt, timeSec, speedRatio, isSwimming, isAiming }) => {
      if (isSitting) return;
      weaponMesh.visible = isAiming;

      if (mixer) {
        if (speedRatio > 1.15) switchAction(runAction);
        else if (speedRatio > 0.12) switchAction(walkAction);
        else switchAction(idleAction);
        mixer.update(dt);
      }

      if (isSwimming) {
        group.rotation.x = 0.45 + Math.sin(timeSec * 5) * 0.08;
      } else {
        group.rotation.x = 0;
      }
    },
    dispose: () => {
      mixer?.stopAllAction();
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      });
    },
  };
}

/**
 * Animated Michelle.glb dancer for Bundaran HI plaza atmosphere.
 */
export function createPlazaDancerMesh(): {
  group: THREE.Group;
  update: (dt: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const michelleCache = gltfCache.get("/models/characters/Michelle.glb");
  let mixer: THREE.AnimationMixer | null = null;

  if (michelleCache) {
    const model = SkeletonUtils.clone(michelleCache.scene) as THREE.Group;
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });
    group.add(model);
    if (michelleCache.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const dance =
        michelleCache.animations.find((a) => a.name.toLowerCase().includes("samba")) ||
        michelleCache.animations[0];
      mixer.clipAction(dance).play();
    }
  }

  return {
    group,
    update: (dt: number) => mixer?.update(dt),
    dispose: () => {
      mixer?.stopAllAction();
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
        }
      });
    },
  };
}
