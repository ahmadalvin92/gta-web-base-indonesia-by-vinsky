import * as THREE from "three";
import { GLTFLoader, DRACOLoader } from "three-stdlib";
import { getLicensePlateTexture } from "./IndonesianTextureGenerator";

export type VehicleKind =
  | "supercar"
  | "sport"
  | "hatchback"
  | "sedan"
  | "suv"
  | "bus_transjakarta"
  | "police_pjr"
  | "angkot"
  | "jet"
  | "speedboat";

export interface VehicleSpec {
  id: VehicleKind;
  name: string;
  category: "Sport & Exotic" | "JDM & Harian" | "Dinas & Umum" | "Udara & Laut";
  glbPath?: string;
  defaultColor: string;
  defaultPlate: string;
  maxSpeedKmh: number;
  acceleration: number;
  handling: number;
  isAircraft?: boolean;
  isBoat?: boolean;
  hasTelolet?: boolean;
  isPolice?: boolean;
  targetDims: { length: number; width: number; height: number };
}

export const VEHICLE_SPECS: VehicleSpec[] = [
  {
    id: "supercar",
    name: "Vinsky Hyperion V12",
    category: "Sport & Exotic",
    glbPath: "/models/cars/supercar.glb",
    defaultColor: "#ff5500",
    defaultPlate: "B 1 VKY",
    maxSpeedKmh: 345,
    acceleration: 54,
    handling: 3.1,
    targetDims: { length: 4.55, width: 1.96, height: 1.26 },
  },
  {
    id: "sport",
    name: "Griffin GT Coupe",
    category: "Sport & Exotic",
    glbPath: "/models/cars/sport.glb",
    defaultColor: "#e11d48",
    defaultPlate: "B 888 AAG",
    maxSpeedKmh: 295,
    acceleration: 44,
    handling: 2.95,
    targetDims: { length: 4.48, width: 1.9, height: 1.35 },
  },
  {
    id: "hatchback",
    name: "JDM Hatchback Modif",
    category: "JDM & Harian",
    defaultColor: "#facc15",
    defaultPlate: "B 1945 JDM",
    maxSpeedKmh: 235,
    acceleration: 36,
    handling: 3.2,
    targetDims: { length: 4.15, width: 1.82, height: 1.44 },
  },
  {
    id: "sedan",
    name: "Sedan JDM Type-R",
    category: "JDM & Harian",
    defaultColor: "#f8fafc",
    defaultPlate: "B 2026 IDR",
    maxSpeedKmh: 265,
    acceleration: 40,
    handling: 3.0,
    targetDims: { length: 4.5, width: 1.88, height: 1.4 },
  },
  {
    id: "suv",
    name: "MPV / SUV Keluarga",
    category: "JDM & Harian",
    glbPath: "/models/cars/suv.glb",
    defaultColor: "#1e293b",
    defaultPlate: "B 7777 ZNX",
    maxSpeedKmh: 215,
    acceleration: 31,
    handling: 2.55,
    targetDims: { length: 4.7, width: 1.94, height: 1.68 },
  },
  {
    id: "police_pjr",
    name: "Mobil Polisi PJR Korlantas",
    category: "Dinas & Umum",
    glbPath: "/models/cars/police.glb",
    defaultColor: "#ffffff",
    defaultPlate: "VII 1204-00",
    maxSpeedKmh: 270,
    acceleration: 42,
    handling: 2.9,
    isPolice: true,
    targetDims: { length: 4.55, width: 1.9, height: 1.46 },
  },
  {
    id: "bus_transjakarta",
    name: "Bus TransJakarta Telolet",
    category: "Dinas & Umum",
    defaultColor: "#0284c7",
    defaultPlate: "B 7123 TJ",
    maxSpeedKmh: 145,
    acceleration: 20,
    handling: 1.85,
    hasTelolet: true,
    targetDims: { length: 9.8, width: 2.45, height: 3.1 },
  },
  {
    id: "angkot",
    name: "Angkot Mikrolet Jabodetabek",
    category: "Dinas & Umum",
    defaultColor: "#06b6d4",
    defaultPlate: "B 1452 WK",
    maxSpeedKmh: 155,
    acceleration: 24,
    handling: 2.4,
    hasTelolet: true,
    targetDims: { length: 4.2, width: 1.78, height: 1.85 },
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

export interface CabinFitResult {
  scale: number;
  dimensions: THREE.Vector3;
  seatOffset: THREE.Vector3;
  cockpitCamOffset: THREE.Vector3;
  hoodCamOffset: THREE.Vector3;
}

/**
 * Measures raw Box3 dimensions of any loaded 3D vehicle (.glb or procedural)
 * and proportionally scales it to realistic human-compatible vehicle bounds (~4.5m x 1.9m x 1.4m)
 * so the 3D character fits comfortably inside the cabin seat without clipping through the roof.
 */
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

  // Determine uniform proportional scale preserving silhouette while aligning length/width
  const scaleX = targetWidth / safeX;
  const scaleZ = targetLength / safeZ;
  const scaleY = targetHeight / safeY;
  const uniformScale = (scaleX + scaleZ) * 0.5;

  // Apply balanced scale so cabin headroom stays realistic
  model.scale.set(
    uniformScale,
    Math.min(Math.max(scaleY, uniformScale * 0.85), uniformScale * 1.25),
    uniformScale
  );
  model.updateMatrixWorld(true);

  // Re-center X/Z at 0 and ground Y at 0
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

  // Place driver seat safely in left/right cabin pocket below roof clearance
  const seatY = Math.max(0.28, dims.y * 0.24);
  const seatZ = dims.z * 0.04;
  const seatX = -dims.x * 0.19; // Indonesian right-hand drive feel (-X in +Z forward space)

  const seatOffset = new THREE.Vector3(seatX, seatY, seatZ);
  const cockpitCamOffset = new THREE.Vector3(seatX, seatY + 0.62, seatZ + 0.12);
  const hoodCamOffset = new THREE.Vector3(0, dims.y * 0.68, dims.z * 0.22);

  return {
    scale: uniformScale,
    dimensions: dims,
    seatOffset,
    cockpitCamOffset,
    hoodCamOffset,
  };
}

let sharedGLTFLoader: GLTFLoader | null = null;
const glbCache = new Map<string, THREE.Group>();

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

export async function loadGLBModelCached(url: string): Promise<THREE.Group | null> {
  if (glbCache.has(url)) {
    return glbCache.get(url)!.clone(true);
  }
  try {
    const loader = getGLTFLoader();
    const gltf = await loader.loadAsync(url);
    const scene = gltf.scene;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    glbCache.set(url, scene);
    return scene.clone(true);
  } catch {
    return null;
  }
}

export interface VehicleInstance {
  kind: VehicleKind;
  spec: VehicleSpec;
  group: THREE.Group;
  cabinFit: CabinFitResult;
  wheels: THREE.Object3D[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  leftTurnSignals: THREE.Mesh[];
  rightTurnSignals: THREE.Mesh[];
  sirenRed?: THREE.Mesh;
  sirenBlue?: THREE.Mesh;
  neonMesh?: THREE.Mesh;
  bodyMeshes: THREE.Mesh[];
  rimMeshes: THREE.Mesh[];
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
  const rimHex = options?.rimColor ?? "#cbd5e1";
  const plateStr = options?.plateText ?? spec.defaultPlate;
  const neonHex = options?.neonColor ?? "#ff3e9d";

  const root = new THREE.Group();
  const modelBody = new THREE.Group();
  root.add(modelBody);

  const bodyMeshes: THREE.Mesh[] = [];
  const rimMeshes: THREE.Mesh[] = [];
  const wheels: THREE.Object3D[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];
  const leftTurnSignals: THREE.Mesh[] = [];
  const rightTurnSignals: THREE.Mesh[] = [];
  let sirenRed: THREE.Mesh | undefined;
  let sirenBlue: THREE.Mesh | undefined;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintHex),
    metalness: 0.72,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  const trimDarkMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.35,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.36,
    transmission: 0.35,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x1f2430,
    roughness: 0.8,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0f1115,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimHex),
    metalness: 0.9,
    roughness: 0.2,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfffbeb),
    emissiveIntensity: 1.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: new THREE.Color(0xdc2626),
    emissiveIntensity: 0.9,
  });

  const leftSignalMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0.0,
  });

  const rightSignalMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: new THREE.Color(0xf59e0b),
    emissiveIntensity: 0.0,
  });

  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    isBody = false
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    modelBody.add(mesh);
    if (isBody) bodyMeshes.push(mesh);
    return mesh;
  };

  const addWheel = (x: number, y: number, z: number, radius = 0.34, width = 0.26) => {
    const wg = new THREE.Group();
    wg.position.set(x, y, z);
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 18),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 12),
      rimMat
    );
    rim.rotation.z = Math.PI / 2;
    wg.add(rim);
    rimMeshes.push(rim);

    modelBody.add(wg);
    wheels.push(wg);
  };

  // License plates front & rear
  let plateTexture = getLicensePlateTexture(plateStr);
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTexture,
    roughness: 0.4,
  });
  let frontPlateMesh: THREE.Mesh | null = null;
  let rearPlateMesh: THREE.Mesh | null = null;

  if (kind === "jet") {
    // Fuselage
    const fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.72, 8.8, 20),
      paintMat
    );
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.set(0, 1.35, 0);
    fuselage.castShadow = true;
    modelBody.add(fuselage);
    bodyMeshes.push(fuselage);

    // Nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 20), paintMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.35, 5.3);
    modelBody.add(nose);
    bodyMeshes.push(nose);

    // Cockpit canopy
    addBox(1.1, 0.6, 1.9, 0, 1.95, 2.4, glassMat);
    // Main swept wings
    addBox(8.8, 0.14, 1.8, 0, 1.15, 0.2, paintMat, true);
    // Tail fin
    addBox(0.16, 1.8, 1.4, 0, 2.4, -3.7, trimDarkMat);
    // Horizontal stabilizers
    addBox(3.4, 0.1, 0.9, 0, 1.45, -3.9, paintMat, true);
    // Landing gear wheels
    addWheel(0, 0.3, 3.2, 0.28, 0.22);
    addWheel(-1.1, 0.3, -0.5, 0.3, 0.24);
    addWheel(1.1, 0.3, -0.5, 0.3, 0.24);
  } else if (kind === "speedboat") {
    // Boat V-hull
    addBox(2.15, 0.65, 5.8, 0, 0.42, 0, paintMat, true);
    addBox(1.75, 0.42, 2.0, 0, 0.85, 0.2, glassMat);
    // Seats
    addBox(0.55, 0.45, 0.55, -0.45, 0.72, -0.2, interiorMat);
    addBox(0.55, 0.45, 0.55, 0.45, 0.72, -0.2, interiorMat);
    // Twin outboard motors
    addBox(0.35, 0.7, 0.45, -0.42, 0.55, -3.05, trimDarkMat);
    addBox(0.35, 0.7, 0.45, 0.42, 0.55, -3.05, trimDarkMat);
    const hl = addBox(0.5, 0.14, 0.1, 0, 0.72, 2.9, headlightMat);
    headlights.push(hl);
  } else if (kind === "bus_transjakarta") {
    // TransJakarta high-roof body
    addBox(2.42, 0.85, 9.6, 0, 0.85, 0, paintMat, true);
    // White-cyan livery stripe
    addBox(2.46, 0.24, 9.62, 0, 1.15, 0, new THREE.MeshStandardMaterial({ color: 0xffffff }));
    // Large panoramic cabin glass
    addBox(2.34, 1.15, 9.2, 0, 1.85, 0, glassMat);
    // Roof & AC pods
    addBox(2.38, 0.18, 9.5, 0, 2.52, 0, paintMat, true);
    addBox(1.4, 0.26, 2.6, 0, 2.74, 0.5, trimDarkMat);
    // Interior driver seat
    addBox(0.55, 0.7, 0.55, -0.58, 0.9, 3.3, interiorMat);
    // Wheels (6-wheel feel via 4 large)
    addWheel(-1.12, 0.46, 2.8, 0.46, 0.34);
    addWheel(1.12, 0.46, 2.8, 0.46, 0.34);
    addWheel(-1.12, 0.46, -2.7, 0.46, 0.34);
    addWheel(1.12, 0.46, -2.7, 0.46, 0.34);
    headlights.push(
      addBox(0.38, 0.18, 0.08, -0.82, 0.75, 4.82, headlightMat),
      addBox(0.38, 0.18, 0.08, 0.82, 0.75, 4.82, headlightMat)
    );
    taillights.push(
      addBox(0.38, 0.22, 0.08, -0.85, 0.82, -4.82, taillightMat),
      addBox(0.38, 0.22, 0.08, 0.85, 0.82, -4.82, taillightMat)
    );
    frontPlateMesh = addBox(0.52, 0.16, 0.04, 0, 0.52, 4.83, plateMat);
    rearPlateMesh = addBox(0.52, 0.16, 0.04, 0, 0.52, -4.83, plateMat);
  } else {
    // Standard / Sport / Supercar / SUV / Police / Angkot chassis
    const isSuvOrAngkot = kind === "suv" || kind === "angkot";
    const isHatch = kind === "hatchback";
    const isSuper = kind === "supercar";
    const length = isHatch ? 4.15 : isSuvOrAngkot ? 4.65 : 4.48;
    const width = 1.88;
    const lowerH = isSuvOrAngkot ? 0.64 : isSuper ? 0.48 : 0.54;
    const cabinH = isSuvOrAngkot ? 0.66 : isSuper ? 0.44 : 0.5;
    const cabinLen = isHatch || isSuvOrAngkot ? length * 0.62 : length * 0.46;
    const cabinZ = isHatch || isSuvOrAngkot ? -0.25 : -0.18;

    // Lower chassis
    addBox(width, lowerH, length, 0, 0.34 + lowerH / 2, 0, paintMat, true);
    // Front aero lip / bumper
    addBox(width + 0.04, 0.16, 0.28, 0, 0.3, length / 2 - 0.06, trimDarkMat);
    // Rear diffuser
    addBox(width, 0.18, 0.24, 0, 0.32, -length / 2 + 0.06, trimDarkMat);

    // Interior floor, dashboard, steering wheel, and 2 bucket seats visible through transparent glass
    const floorY = 0.34 + lowerH * 0.52;
    addBox(width * 0.78, 0.08, cabinLen * 0.9, 0, floorY, cabinZ, interiorMat);
    addBox(0.48, 0.52, 0.48, -0.4, floorY + 0.24, cabinZ + 0.08, interiorMat);
    addBox(0.48, 0.52, 0.48, 0.4, floorY + 0.24, cabinZ + 0.08, interiorMat);
    addBox(width * 0.72, 0.22, 0.32, 0, floorY + 0.34, cabinZ + cabinLen * 0.38, trimDarkMat);

    // Transparent cabin glass
    addBox(
      width * 0.84,
      cabinH,
      cabinLen,
      0,
      0.34 + lowerH + cabinH / 2 - 0.04,
      cabinZ,
      glassMat
    );

    // Roof panel
    addBox(
      width * 0.8,
      0.07,
      cabinLen * 0.88,
      0,
      0.34 + lowerH + cabinH - 0.02,
      cabinZ,
      paintMat,
      true
    );

    // Sport / Supercar rear wing
    if (isSuper || kind === "sport" || kind === "sedan") {
      addBox(0.08, 0.22, 0.18, -0.6, 0.34 + lowerH + 0.11, -length / 2 + 0.22, trimDarkMat);
      addBox(0.08, 0.22, 0.18, 0.6, 0.34 + lowerH + 0.11, -length / 2 + 0.22, trimDarkMat);
      addBox(width * 0.94, 0.06, 0.3, 0, 0.34 + lowerH + 0.24, -length / 2 + 0.2, trimDarkMat);
    }

    // Police PJR striping & siren bar
    if (kind === "police_pjr") {
      addBox(
        width + 0.02,
        0.2,
        length * 0.75,
        0,
        0.34 + lowerH * 0.65,
        0,
        new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
      );
      const roofY = 0.34 + lowerH + cabinH + 0.08;
      sirenRed = addBox(
        0.52,
        0.13,
        0.24,
        -0.3,
        roofY,
        cabinZ + 0.1,
        new THREE.MeshStandardMaterial({
          color: 0xff0022,
          emissive: new THREE.Color(0xff0022),
          emissiveIntensity: 1.8,
        })
      );
      sirenBlue = addBox(
        0.52,
        0.13,
        0.24,
        0.3,
        roofY,
        cabinZ + 0.1,
        new THREE.MeshStandardMaterial({
          color: 0x0066ff,
          emissive: new THREE.Color(0x0066ff),
          emissiveIntensity: 1.8,
        })
      );
    }

    // Angkot roof sign
    if (kind === "angkot") {
      addBox(
        0.72,
        0.18,
        0.28,
        0,
        0.34 + lowerH + cabinH + 0.08,
        cabinZ + cabinLen * 0.35,
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: new THREE.Color(0xfacc15),
          emissiveIntensity: 0.4,
        })
      );
    }

    // 4 Wheels
    const wheelR = isSuvOrAngkot ? 0.38 : 0.33;
    const wheelZ = length * 0.31;
    addWheel(-width * 0.47, wheelR, wheelZ, wheelR, 0.26);
    addWheel(width * 0.47, wheelR, wheelZ, wheelR, 0.26);
    addWheel(-width * 0.47, wheelR, -wheelZ, wheelR, 0.26);
    addWheel(width * 0.47, wheelR, -wheelZ, wheelR, 0.26);

    // Headlights & Taillights
    const lightY = 0.34 + lowerH * 0.56;
    headlights.push(
      addBox(0.32, 0.12, 0.06, -width * 0.33, lightY, length / 2 + 0.01, headlightMat),
      addBox(0.32, 0.12, 0.06, width * 0.33, lightY, length / 2 + 0.01, headlightMat)
    );
    taillights.push(
      addBox(0.38, 0.12, 0.06, -width * 0.32, lightY + 0.04, -length / 2 - 0.01, taillightMat),
      addBox(0.38, 0.12, 0.06, width * 0.32, lightY + 0.04, -length / 2 - 0.01, taillightMat)
    );

    // Turn signals
    leftTurnSignals.push(
      addBox(0.14, 0.1, 0.08, -width * 0.45, lightY, length / 2 + 0.01, leftSignalMat),
      addBox(0.14, 0.1, 0.08, -width * 0.45, lightY, -length / 2 - 0.01, leftSignalMat)
    );
    rightTurnSignals.push(
      addBox(0.14, 0.1, 0.08, width * 0.45, lightY, length / 2 + 0.01, rightSignalMat),
      addBox(0.14, 0.1, 0.08, width * 0.45, lightY, -length / 2 - 0.01, rightSignalMat)
    );

    // Indonesian License Plates
    frontPlateMesh = addBox(0.48, 0.15, 0.03, 0, 0.44, length / 2 + 0.02, plateMat);
    rearPlateMesh = addBox(0.48, 0.15, 0.03, 0, 0.48, -length / 2 - 0.02, plateMat);
  }

  // Neon underglow plane
  const neonMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(neonHex),
    transparent: true,
    opacity: options?.neonEnabled ? 0.55 : 0.0,
    side: THREE.DoubleSide,
  });
  const neonMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.targetDims.width * 1.15, spec.targetDims.length * 0.92),
    neonMat
  );
  neonMesh.rotation.x = -Math.PI / 2;
  neonMesh.position.y = 0.04;
  modelBody.add(neonMesh);

  // Auto-scale & compute cabin seating fit
  const cabinFit = autoScaleAndFitCabin(
    modelBody,
    spec.targetDims.length,
    spec.targetDims.width,
    spec.targetDims.height
  );

  // If this vehicle also has a .glb file, asynchronously verify it can be loaded/cached
  if (spec.glbPath) {
    loadGLBModelCached(spec.glbPath).catch(() => {});
  }

  return {
    kind,
    spec,
    group: root,
    cabinFit,
    wheels,
    headlights,
    taillights,
    leftTurnSignals,
    rightTurnSignals,
    sirenRed,
    sirenBlue,
    neonMesh,
    bodyMeshes,
    rimMeshes,
    setPaintColor: (hex: string) => {
      paintMat.color.set(hex);
    },
    setRimColor: (hex: string) => {
      rimMat.color.set(hex);
    },
    setPlateText: (plate: string) => {
      plateTexture = getLicensePlateTexture(plate);
      plateMat.map = plateTexture;
      plateMat.needsUpdate = true;
      if (frontPlateMesh) frontPlateMesh.visible = true;
      if (rearPlateMesh) rearPlateMesh.visible = true;
    },
    setNeon: (enabled: boolean, hex?: string) => {
      if (hex) neonMat.color.set(hex);
      neonMat.opacity = enabled ? 0.55 : 0.0;
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
      headlightMat.emissiveIntensity = headlightsOn ? 2.4 : 0.4;
      taillightMat.emissiveIntensity = braking ? 3.2 : headlightsOn ? 1.1 : 0.25;

      const blink = Math.sin(timeSec * 8) > 0;
      leftSignalMat.emissiveIntensity = (leftTurn || hazard) && blink ? 2.8 : 0.0;
      rightSignalMat.emissiveIntensity = (rightTurn || hazard) && blink ? 2.8 : 0.0;

      if (sirenRed && sirenBlue) {
        const phase = Math.sin(timeSec * 14) > 0;
        const rMat = sirenRed.material as THREE.MeshStandardMaterial;
        const bMat = sirenBlue.material as THREE.MeshStandardMaterial;
        if (policeActive) {
          rMat.emissiveIntensity = phase ? 4.2 : 0.2;
          bMat.emissiveIntensity = phase ? 0.2 : 4.2;
        } else {
          rMat.emissiveIntensity = 0.5;
          bMat.emissiveIntensity = 0.5;
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
    timeSec: number;
    speedRatio: number;
    isJumping: boolean;
    isSwimming: boolean;
    isAiming: boolean;
  }) => void;
  dispose: () => void;
}

export function createCharacterMesh(): CharacterInstance {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd99b72, roughness: 0.65 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0xff3e9d, roughness: 0.55 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.85 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

  // Torso (waist at y=0.88, top at y=1.42)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), jacketMat);
  torso.position.y = 1.16;
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
  head.position.y = 1.61;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), hairMat);
  hair.position.set(0, 1.74, -0.01);
  group.add(hair);

  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.06), shirtMat);
  shades.position.set(0, 1.63, 0.14);
  group.add(shades);

  // Arms pivoted at shoulder
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 1.38, 0);
  const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), jacketMat);
  lArmMesh.position.y = -0.22;
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 1.38, 0);
  const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), jacketMat);
  rArmMesh.position.y = -0.22;
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);

  // Weapon attached to right hand
  const weaponMesh = new THREE.Group();
  weaponMesh.position.set(0, -0.45, 0.14);
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.32), shirtMat);
  weaponMesh.add(gunBody);
  weaponMesh.visible = false;
  rightArm.add(weaponMesh);
  group.add(rightArm);

  // Legs pivoted at hip (y=0.88)
  const makeLeg = (x: number) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.88, 0);
    const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.18), jeansMat);
    legMesh.position.y = -0.4;
    legMesh.castShadow = true;
    leg.add(legMesh);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.26), shoeMat);
    shoe.position.set(0, -0.82, 0.04);
    leg.add(shoe);
    group.add(leg);
    return leg;
  };

  const leftLeg = makeLeg(-0.12);
  const rightLeg = makeLeg(0.12);

  let isSitting = false;

  return {
    group,
    weaponMesh,
    setSittingInCabin: (sitting: boolean) => {
      isSitting = sitting;
      if (sitting) {
        // Seated pose: scale down slightly so head never pokes roof, bend legs forward & hands on wheel
        group.scale.setScalar(0.58);
        leftLeg.rotation.x = -Math.PI / 2.2;
        rightLeg.rotation.x = -Math.PI / 2.2;
        leftArm.rotation.x = -Math.PI / 2.8;
        rightArm.rotation.x = -Math.PI / 2.8;
        weaponMesh.visible = false;
      } else {
        group.scale.setScalar(1.0);
        leftLeg.rotation.set(0, 0, 0);
        rightLeg.rotation.set(0, 0, 0);
        leftArm.rotation.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);
      }
    },
    animate: ({ timeSec, speedRatio, isJumping, isSwimming, isAiming }) => {
      if (isSitting) return;

      weaponMesh.visible = isAiming;

      if (isSwimming) {
        const stroke = Math.sin(timeSec * 7);
        torso.rotation.x = 0.6;
        leftArm.rotation.x = -1.4 + stroke * 0.9;
        rightArm.rotation.x = -1.4 - stroke * 0.9;
        leftLeg.rotation.x = stroke * 0.5;
        rightLeg.rotation.x = -stroke * 0.5;
        return;
      }

      torso.rotation.x = 0;

      if (isJumping) {
        leftLeg.rotation.x = -0.35;
        rightLeg.rotation.x = 0.35;
        leftArm.rotation.x = -0.7;
        rightArm.rotation.x = isAiming ? -1.55 : -0.7;
        return;
      }

      const swing = Math.sin(timeSec * (8 + speedRatio * 5)) * Math.min(1, speedRatio) * 0.75;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.85;
      rightArm.rotation.x = isAiming ? -1.55 : swing * 0.85;
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
