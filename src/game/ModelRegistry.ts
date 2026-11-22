import * as THREE from "three";
import { GLTFLoader, DRACOLoader, SkeletonUtils } from "three-stdlib";
import { getLicensePlateTexture } from "./IndonesianTextureGenerator";

export type VehicleKind =
  | "supercar"
  | "lambo"
  | "mercy"
  | "bmw"
  | "sport"
  | "innova"
  | "avanza"
  | "civic"
  | "bluebird"
  | "police_pjr"
  | "sedan"
  | "suv"
  | "hatchback"
  | "angkot"
  | "bus_transjakarta"
  | "jet"
  | "heli"
  | "speedboat"
  | "motor";

export interface VehicleSpec {
  id: VehicleKind;
  name: string;
  category: "Mobil Rakyat & CDID" | "Eropa & Supercar" | "Dinas & Umum" | "Udara & Laut";
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
  targetLength: number;
}

export const VEHICLE_SPECS: VehicleSpec[] = [
  {
    id: "supercar",
    name: "Ferrari 458 Italia",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/supercar.glb",
    glbYawOffset: Math.PI,
    defaultColor: "#dc2626",
    defaultPlate: "B 1 VKY",
    maxSpeedKmh: 355,
    acceleration: 56,
    handling: 3.2,
    targetLength: 4.55,
  },
  {
    id: "lambo",
    name: "Lamborghini Aventador SV",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/lambo.glb",
    defaultColor: "#facc15",
    defaultPlate: "B 888 VKY",
    maxSpeedKmh: 365,
    acceleration: 58,
    handling: 3.25,
    targetLength: 4.7,
  },
  {
    id: "mercy",
    name: "Mercedes-AMG G63 Jakarta",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/mercy_g63.glb",
    defaultColor: "#111827",
    defaultPlate: "B 777 MBY",
    maxSpeedKmh: 260,
    acceleration: 44,
    handling: 2.85,
    targetLength: 4.82,
  },
  {
    id: "bmw",
    name: "BMW M2 Coupe G87",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/sedan_real.glb",
    defaultColor: "#1d4ed8",
    defaultPlate: "B 444 BMW",
    maxSpeedKmh: 315,
    acceleration: 50,
    handling: 3.18,
    targetLength: 4.58,
  },
  {
    id: "sport",
    name: "Sport EV Coupe SU7",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/su7.glb",
    defaultColor: "#06b6d4",
    defaultPlate: "B 2026 EV",
    maxSpeedKmh: 310,
    acceleration: 52,
    handling: 3.12,
    targetLength: 4.85,
  },
  {
    id: "innova",
    name: "SUV / MPV Luxury Jakarta",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/suv_real.glb",
    defaultColor: "#1e293b",
    defaultPlate: "B 1089 RFS",
    maxSpeedKmh: 225,
    acceleration: 35,
    handling: 2.75,
    targetLength: 4.68,
  },
  {
    id: "avanza",
    name: "Toyota Avanza / SUV Modern",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/suv_real.glb",
    defaultColor: "#f8fafc",
    defaultPlate: "B 2026 VIN",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.78,
    targetLength: 4.5,
  },
  {
    id: "civic",
    name: "JDM Turbo Coupe",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/jdm.glb",
    defaultColor: "#e11d48",
    defaultPlate: "B 1945 JDM",
    maxSpeedKmh: 275,
    acceleration: 43,
    handling: 3.1,
    targetLength: 4.5,
  },
  {
    id: "sedan",
    name: "Sedan Executive Luxury",
    category: "Eropa & Supercar",
    glbPath: "/models/cars/su7.glb",
    defaultColor: "#0f172a",
    defaultPlate: "B 1 JKT",
    maxSpeedKmh: 270,
    acceleration: 40,
    handling: 2.85,
    targetLength: 4.85,
  },
  {
    id: "suv",
    name: "Urban SUV Compact",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/car_sb.glb",
    defaultColor: "#334155",
    defaultPlate: "B 999 VNZ",
    maxSpeedKmh: 220,
    acceleration: 34,
    handling: 2.8,
    targetLength: 4.55,
  },
  {
    id: "hatchback",
    name: "Hatchback Street Modif",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/hatchback.glb",
    defaultColor: "#facc15",
    defaultPlate: "B 1212 YRS",
    maxSpeedKmh: 235,
    acceleration: 36,
    handling: 3.2,
    targetLength: 4.2,
  },
  {
    id: "bluebird",
    name: "Taksi Bluebird Jakarta",
    category: "Dinas & Umum",
    glbPath: "/models/cars/su7.glb",
    defaultColor: "#0284c7",
    defaultPlate: "B 2889 DR",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.82,
    isTaxi: true,
    targetLength: 4.8,
  },
  {
    id: "police_pjr",
    name: "Mobil Polisi PJR Korlantas",
    category: "Dinas & Umum",
    glbPath: "/models/cars/police.glb",
    defaultColor: "#ffffff",
    defaultPlate: "VII 1204-00",
    maxSpeedKmh: 275,
    acceleration: 44,
    handling: 2.95,
    isPolice: true,
    targetLength: 4.55,
  },
  {
    id: "bus_transjakarta",
    name: "Bus TransJakarta Telolet",
    category: "Dinas & Umum",
    glbPath: "/models/cars/transjakarta.glb",
    defaultColor: "#0284c7",
    defaultPlate: "B 7123 TJ",
    maxSpeedKmh: 145,
    acceleration: 20,
    handling: 1.9,
    hasTelolet: true,
    targetLength: 9.8,
  },
  {
    id: "angkot",
    name: "Angkot Mikrolet Biru",
    category: "Dinas & Umum",
    glbPath: "/models/cars/angkot.glb",
    defaultColor: "#06b6d4",
    defaultPlate: "B 1452 WK",
    maxSpeedKmh: 155,
    acceleration: 24,
    handling: 2.45,
    hasTelolet: true,
    targetLength: 4.2,
  },
  {
    id: "jet",
    name: "Pesawat Nusantara Air",
    category: "Udara & Laut",
    glbPath: "/models/cars/airplane.glb",
    defaultColor: "#e2e8f0",
    defaultPlate: "PK-VKY",
    maxSpeedKmh: 520,
    acceleration: 68,
    handling: 2.2,
    isAircraft: true,
    targetLength: 8.8,
  },
  {
    id: "heli",
    name: "Helikopter Polisi / Vinsky",
    category: "Udara & Laut",
    glbPath: "/models/cars/heli.glb",
    defaultColor: "#1e293b",
    defaultPlate: "PK-HLI",
    maxSpeedKmh: 360,
    acceleration: 50,
    handling: 2.7,
    isAircraft: true,
    targetLength: 7.4,
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
    targetLength: 6.2,
  },
  {
    id: "motor",
    name: "Motor Sport Jakarta",
    category: "Dinas & Umum",
    defaultColor: "#111827",
    defaultPlate: "B 4510 VKY",
    maxSpeedKmh: 175,
    acceleration: 42,
    handling: 3.5,
    targetLength: 2.05,
  },
];

export const CITY_ASSET_FILES = [
  "ponto_onibus.glb",
  "semaforo.glb",
  "poste_luz.glb",
  "ponte.glb",
  "buriti.glb",
  "ipe_amarelo.glb",
  "pavement-fountain.glb",
  "posto_recarga.glb",
];

interface CachedGLTFData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

let sharedGLTFLoader: GLTFLoader | null = null;
const gltfCache = new Map<string, CachedGLTFData>();
const inflightLoads = new Map<string, Promise<CachedGLTFData | null>>();

function getGLTFLoader(): GLTFLoader {
  if (!sharedGLTFLoader) {
    sharedGLTFLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    sharedGLTFLoader.setDRACOLoader(dracoLoader);
  }
  return sharedGLTFLoader;
}

export async function loadGLTFUrl(url: string): Promise<CachedGLTFData | null> {
  if (gltfCache.has(url)) return gltfCache.get(url)!;
  if (inflightLoads.has(url)) return inflightLoads.get(url)!;

  const p = (async () => {
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
    } finally {
      inflightLoads.delete(url);
    }
  })();

  inflightLoads.set(url, p);
  return p;
}

export function getCachedCityAsset(filename: string): THREE.Group | null {
  const entry = gltfCache.get(`/models/city/${filename}`);
  if (!entry) return null;
  return entry.scene.clone(true);
}

/**
 * Preloads core characters, starting high-poly car, lightweight Jakarta traffic cars, and street props
 * quickly (< 2s), while heavier optional showroom GLBs can load cleanly on demand.
 */
export async function preloadAllGameModels(
  startVehicleKind: VehicleKind,
  onProgress?: (pct: number, label: string) => void
): Promise<void> {
  const urls = new Set<string>();
  urls.add("/models/characters/casual_human.glb");
  urls.add("/models/characters/Michelle.glb");

  const startSpec = VEHICLE_SPECS.find((s) => s.id === startVehicleKind);
  if (startSpec?.glbPath) urls.add(startSpec.glbPath);

  // Core traffic & iconic Jakarta vehicles (real high-poly automotive GLBs!)
  [
    "/models/cars/supercar.glb",
    "/models/cars/lambo.glb",
    "/models/cars/sedan_real.glb",
    "/models/cars/su7.glb",
    "/models/cars/mercy_g63.glb",
    "/models/cars/police.glb",
    "/models/cars/transjakarta.glb",
  ].forEach((u) => urls.add(u));

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
          onProgress(
            pct,
            `Memuat aset 3D (${loaded}/${list.length}): ${url.split("/").pop()}`
          );
        }
      })
    );
  }
}

export async function ensureVehicleModelLoaded(kind: VehicleKind): Promise<boolean> {
  const spec = VEHICLE_SPECS.find((s) => s.id === kind);
  if (!spec?.glbPath) return true;
  if (gltfCache.has(spec.glbPath)) return true;
  const res = await loadGLTFUrl(spec.glbPath);
  return Boolean(res);
}

export interface CabinFitResult {
  scale: number;
  dimensions: THREE.Vector3;
  seatOffset: THREE.Vector3;
  cockpitCamOffset: THREE.Vector3;
  hoodCamOffset: THREE.Vector3;
}

/**
 * Automatically orients any loaded 3D vehicle so its longest axis is +Z forward,
 * verifies front vs rear wheel orientation, uniformly scales to realistic targetLength (without squishing!),
 * and centers X/Z while grounding bottom at y = 0.
 */
export function autoScaleAndFitCabin(
  model: THREE.Object3D,
  targetLength = 4.5,
  explicitYawOffset?: number
): CabinFitResult {
  model.updateMatrixWorld(true);

  if (explicitYawOffset !== undefined) {
    model.rotation.y += explicitYawOffset;
    model.updateMatrixWorld(true);
  } else {
    // Check raw bounds: if X > Z * 1.15, rotate 90 deg so longest axis is Z
    const b0 = new THREE.Box3().setFromObject(model);
    const s0 = new THREE.Vector3();
    b0.getSize(s0);
    if (s0.x > s0.z * 1.15) {
      model.rotation.y += Math.PI / 2;
      model.updateMatrixWorld(true);
    }

    // Verify front wheel Z vs center so headlights face +Z forward
    const cBox = new THREE.Box3().setFromObject(model);
    const cCenter = new THREE.Vector3();
    cBox.getCenter(cCenter);

    let frontZSum = 0;
    let frontCount = 0;
    model.traverse((obj) => {
      if (/front/i.test(obj.name) && /wheel|tire/i.test(obj.name)) {
        const wBox = new THREE.Box3().setFromObject(obj);
        if (!wBox.isEmpty()) {
          const wc = new THREE.Vector3();
          wBox.getCenter(wc);
          frontZSum += wc.z - cCenter.z;
          frontCount++;
        }
      }
    });
    if (frontCount > 0 && frontZSum / frontCount < -0.1) {
      model.rotation.y += Math.PI;
      model.updateMatrixWorld(true);
    }
  }

  const rawBox = new THREE.Box3().setFromObject(model);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);

  // Uniform scale preserves exact real-world car proportions (never squished/stretched!)
  const uniformScale = targetLength / Math.max(rawSize.z, 0.01);
  model.scale.multiplyScalar(uniformScale);
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

    glbClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;

        const cloneMat = (mat: THREE.Material) => {
          const cloned = mat.clone() as THREE.MeshStandardMaterial;
          if ("envMapIntensity" in cloned) {
            cloned.envMapIntensity = 1.45;
          }
          const mName = (cloned.name || "").toLowerCase();
          if (
            (mName.includes("body") ||
              mName.includes("carpaint") ||
              mName.includes("paint") ||
              mName.includes("car_body") ||
              mName.includes("parede")) &&
            !mName.includes("black")
          ) {
            paintableMats.push(cloned);
          }
          if (mName.includes("metal") || mName.includes("rim") || mName.includes("alloy")) {
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

      if (
        /wheel/i.test(child.name) &&
        !/steering/i.test(child.name) &&
        !(child as THREE.SkinnedMesh).isSkinnedMesh &&
        child.position.lengthSq() > 0.05
      ) {
        wheels.push(child);
      }
    });

    if (
      (options?.paintColor || spec.isTaxi || kind === "sedan") &&
      paintableMats.length > 0
    ) {
      paintableMats.forEach((pm) => pm.color.set(paintHex));
    }

    modelBody.add(glbClone);
  } else {
    // Clean fallback for Speedboat / Motor or not-yet-cached showroom car
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(paintHex),
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 1.0,
      envMapIntensity: 1.5,
    });
    paintableMats.push(paintMat);
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b1628,
      transparent: true,
      opacity: 0.45,
      clearcoat: 1.0,
    });

    if (kind === "speedboat") {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 5.8), paintMat);
      hull.position.y = 0.42;
      const shield = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.42, 2.0), glassMat);
      shield.position.set(0, 0.85, 0.2);
      modelBody.add(hull, shield);
    } else if (kind === "motor") {
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
    } else {
      // Temporary smooth placeholder while heavy showroom GLB finishes downloading
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.72, 4.4), paintMat);
      body.position.y = 0.68;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.52, 2.1), glassMat);
      cab.position.set(0, 1.24, -0.15);
      modelBody.add(body, cab);
    }
  }

  const cabinFit = autoScaleAndFitCabin(
    modelBody,
    spec.targetLength,
    spec.glbYawOffset
  );

  const halfL = cabinFit.dimensions.z / 2;
  const width = cabinFit.dimensions.x;
  const height = cabinFit.dimensions.y;

  // Indonesian White License Plates (front & rear)
  let plateTexture = getLicensePlateTexture(plateStr, true);
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTexture, roughness: 0.35 });
  if (!spec.isAircraft && !spec.isBoat && kind !== "motor") {
    const fPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.03), plateMat);
    fPlate.position.set(0, 0.34, halfL + 0.02);
    const rPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.03), plateMat);
    rPlate.position.set(0, 0.44, -halfL - 0.02);
    root.add(fPlate, rPlate);
  }

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

  const lsF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), leftSigMat);
  const lsR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), leftSigMat);
  const rsF = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), rightSigMat);
  const rsR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), rightSigMat);
  const signalMeshes = [lsF, lsR, rsF, rsR];

  if (!spec.isAircraft && kind !== "motor") {
    lsF.position.set(-width * 0.36, height * 0.36, halfL - 0.02);
    lsR.position.set(-width * 0.36, height * 0.42, -halfL + 0.02);
    rsF.position.set(width * 0.36, height * 0.36, halfL - 0.02);
    rsR.position.set(width * 0.36, height * 0.42, -halfL + 0.02);
    signalMeshes.forEach((sm) => {
      sm.visible = false;
      root.add(sm);
    });
  }

  let sirenRed: THREE.Mesh | undefined;
  let sirenBlue: THREE.Mesh | undefined;
  if (spec.isPolice) {
    sirenRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xff0022,
        emissive: new THREE.Color(0xff0022),
        emissiveIntensity: 2.5,
      })
    );
    sirenRed.position.set(-0.28, height + 0.04, -0.05);
    sirenBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x0066ff,
        emissive: new THREE.Color(0x0066ff),
        emissiveIntensity: 2.5,
      })
    );
    sirenBlue.position.set(0.28, height + 0.04, -0.05);
    root.add(sirenRed, sirenBlue);
  }

  const neonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(neonHex),
    transparent: true,
    opacity: options?.neonEnabled ? 0.52 : 0.0,
    side: THREE.DoubleSide,
  });
  const neonMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.12, spec.targetLength * 0.92),
    neonMat
  );
  neonMesh.rotation.x = -Math.PI / 2;
  neonMesh.position.y = 0.04;
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
    setLightsState: ({ leftTurn, rightTurn, hazard, timeSec, policeActive }) => {
      const blink = Math.sin(timeSec * 8) > 0;
      const leftOn = (leftTurn || hazard) && blink;
      const rightOn = (rightTurn || hazard) && blink;
      leftSigMat.emissiveIntensity = leftOn ? 3.2 : 0.0;
      rightSigMat.emissiveIntensity = rightOn ? 3.2 : 0.0;
      lsF.visible = leftOn;
      lsR.visible = leftOn;
      rsF.visible = rightOn;
      rsR.visible = rightOn;

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

export function createCharacterMesh(opts?: {
  tintHex?: string;
  isOjol?: boolean;
}): CharacterInstance {
  const group = new THREE.Group();
  const humanCache = gltfCache.get("/models/characters/casual_human.glb");

  const weaponMesh = new THREE.Group();
  const rifleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.14, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.7, roughness: 0.3 })
  );
  rifleBody.position.set(0.24, 1.25, 0.38);
  weaponMesh.add(rifleBody);
  weaponMesh.visible = false;
  group.add(weaponMesh);

  let model: THREE.Group | null = null;
  const bones = new Map<string, { node: THREE.Object3D; rest: THREE.Quaternion }>();

  if (humanCache) {
    model = SkeletonUtils.clone(humanCache.scene) as THREE.Group;
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        if (m.material && !Array.isArray(m.material)) {
          const clonedMat = m.material.clone() as THREE.MeshStandardMaterial;
          const mName = (clonedMat.name || "").toLowerCase();
          if (opts?.tintHex && mName.includes("outfit_top")) {
            clonedMat.color.lerp(new THREE.Color(opts.tintHex), opts.isOjol ? 0.88 : 0.65);
          } else if (opts?.isOjol && mName.includes("headwear")) {
            clonedMat.color.set("#16a34a");
          }
          m.material = clonedMat;
        }
      }
      if (
        [
          "Spine",
          "Head",
          "LeftArm",
          "RightArm",
          "LeftUpLeg",
          "RightUpLeg",
          "LeftLeg",
          "RightLeg",
        ].includes(child.name)
      ) {
        bones.set(child.name, { node: child, rest: child.quaternion.clone() });
      }
    });
    group.add(model);
  } else {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 0.9, 6, 10),
      new THREE.MeshStandardMaterial({ color: opts?.tintHex ?? 0x2563eb })
    );
    body.position.y = 0.95;
    group.add(body);
  }

  let isSitting = false;
  let walkPhase = 0;
  const axisX = new THREE.Vector3(1, 0, 0);
  const axisY = new THREE.Vector3(0, 1, 0);
  const axisZ = new THREE.Vector3(0, 0, 1);
  const qTmp1 = new THREE.Quaternion();
  const qTmp2 = new THREE.Quaternion();

  return {
    group,
    weaponMesh,
    setSittingInCabin: (sitting: boolean) => {
      isSitting = sitting;
      if (sitting) {
        group.visible = false;
        weaponMesh.visible = false;
      } else {
        group.visible = true;
        group.scale.setScalar(1.0);
      }
    },
    animate: ({ dt, timeSec, speedRatio, isSwimming, isAiming }) => {
      if (isSitting) return;
      weaponMesh.visible = isAiming;

      if (model) {
        const moving = speedRatio > 0.12;
        if (moving) {
          walkPhase += dt * (speedRatio > 1.1 ? 11.5 : 7.2);
        }
        const stride = moving ? Math.sin(walkPhase) * (speedRatio > 1.1 ? 0.62 : 0.42) : 0;
        const absStride = moving ? Math.abs(Math.sin(walkPhase)) : 0;

        model.position.y = moving ? absStride * 0.045 : 0;

        const lThigh = bones.get("LeftUpLeg");
        const rThigh = bones.get("RightUpLeg");
        const lKnee = bones.get("LeftLeg");
        const rKnee = bones.get("RightLeg");
        const lArm = bones.get("LeftArm");
        const rArm = bones.get("RightArm");
        const spine = bones.get("Spine");
        const head = bones.get("Head");

        if (lThigh) lThigh.node.quaternion.copy(lThigh.rest).multiply(qTmp1.setFromAxisAngle(axisX, stride));
        if (rThigh) rThigh.node.quaternion.copy(rThigh.rest).multiply(qTmp1.setFromAxisAngle(axisX, -stride));
        if (lKnee) {
          const bend = moving ? Math.max(0, -Math.cos(walkPhase)) * 0.55 : 0;
          lKnee.node.quaternion.copy(lKnee.rest).multiply(qTmp1.setFromAxisAngle(axisX, -bend));
        }
        if (rKnee) {
          const bend = moving ? Math.max(0, Math.cos(walkPhase)) * 0.55 : 0;
          rKnee.node.quaternion.copy(rKnee.rest).multiply(qTmp1.setFromAxisAngle(axisX, -bend));
        }

        // Tuck arms comfortably beside body (0.42 rad) + swing naturally opposite legs when walking
        if (lArm) {
          qTmp1.setFromAxisAngle(axisX, 0.42);
          qTmp2.setFromAxisAngle(axisZ, -stride * 0.85);
          lArm.node.quaternion.copy(lArm.rest).multiply(qTmp1).multiply(qTmp2);
        }
        if (rArm) {
          qTmp1.setFromAxisAngle(axisX, isAiming ? 0.1 : 0.42);
          qTmp2.setFromAxisAngle(axisZ, isAiming ? -1.1 : -stride * 0.85);
          rArm.node.quaternion.copy(rArm.rest).multiply(qTmp1).multiply(qTmp2);
        }

        if (spine) {
          const sway = moving ? Math.cos(walkPhase) * 0.04 : Math.sin(timeSec * 1.8) * 0.02;
          spine.node.quaternion.copy(spine.rest).multiply(qTmp1.setFromAxisAngle(axisY, sway));
        }
        if (head && !moving) {
          const look = Math.sin(timeSec * 1.1) * 0.14;
          head.node.quaternion.copy(head.rest).multiply(qTmp1.setFromAxisAngle(axisY, look));
        }
      }

      group.rotation.x = isSwimming ? 0.45 + Math.sin(timeSec * 5) * 0.08 : 0;
    },
    dispose: () => {
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
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    },
  };
}
