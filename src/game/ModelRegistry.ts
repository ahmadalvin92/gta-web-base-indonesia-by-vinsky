import * as THREE from "three";
import { GLTFLoader, DRACOLoader } from "three-stdlib";
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
  defaultColor: string;
  defaultPlate: string;
  maxSpeedKmh: number;
  acceleration: number;
  handling: number;
  silhouette: "mpv" | "sedan" | "supercar" | "bus" | "motor" | "jet" | "boat";
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
    defaultColor: "#e2e8f0",
    defaultPlate: "B 2026 VIN",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.75,
    silhouette: "mpv",
    targetDims: { length: 4.42, width: 1.82, height: 1.66 },
  },
  {
    id: "innova",
    name: "Kijang Innova Zenix / Reborn",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/innova.glb",
    defaultColor: "#1e293b",
    defaultPlate: "B 1089 RFS",
    maxSpeedKmh: 215,
    acceleration: 34,
    handling: 2.68,
    silhouette: "mpv",
    targetDims: { length: 4.72, width: 1.88, height: 1.72 },
  },
  {
    id: "mercy",
    name: "Mercedes-Benz C/E-Class",
    category: "Eropa & Sport",
    glbPath: "/models/cars/mercy.glb",
    defaultColor: "#cbd5e1",
    defaultPlate: "B 777 MBY",
    maxSpeedKmh: 280,
    acceleration: 44,
    handling: 3.05,
    silhouette: "sedan",
    targetDims: { length: 4.68, width: 1.88, height: 1.42 },
  },
  {
    id: "bmw",
    name: "BMW M4 / 3-Series",
    category: "Eropa & Sport",
    glbPath: "/models/cars/bmw.glb",
    defaultColor: "#1d4ed8",
    defaultPlate: "B 444 BMW",
    maxSpeedKmh: 305,
    acceleration: 48,
    handling: 3.15,
    silhouette: "sedan",
    targetDims: { length: 4.62, width: 1.9, height: 1.38 },
  },
  {
    id: "civic",
    name: "Honda Civic Type-R JDM",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/civic.glb",
    defaultColor: "#f8fafc",
    defaultPlate: "B 1945 JDM",
    maxSpeedKmh: 278,
    acceleration: 43,
    handling: 3.12,
    silhouette: "sedan",
    targetDims: { length: 4.55, width: 1.88, height: 1.4 },
  },
  {
    id: "supercar",
    name: "Vinsky Hyperion V12",
    category: "Eropa & Sport",
    glbPath: "/models/cars/supercar.glb",
    defaultColor: "#ff5500",
    defaultPlate: "B 1 VKY",
    maxSpeedKmh: 355,
    acceleration: 56,
    handling: 3.2,
    silhouette: "supercar",
    targetDims: { length: 4.55, width: 1.96, height: 1.24 },
  },
  {
    id: "sport",
    name: "Griffin GT Coupe",
    category: "Eropa & Sport",
    glbPath: "/models/cars/sport.glb",
    defaultColor: "#e11d48",
    defaultPlate: "B 888 AAG",
    maxSpeedKmh: 310,
    acceleration: 47,
    handling: 3.05,
    silhouette: "supercar",
    targetDims: { length: 4.48, width: 1.92, height: 1.3 },
  },
  {
    id: "hatchback",
    name: "JDM Hatchback Modif",
    category: "Mobil Rakyat & CDID",
    defaultColor: "#facc15",
    defaultPlate: "B 1212 YRS",
    maxSpeedKmh: 235,
    acceleration: 36,
    handling: 3.2,
    silhouette: "mpv",
    targetDims: { length: 4.15, width: 1.82, height: 1.46 },
  },
  {
    id: "sedan",
    name: "Sedan Executive JKT",
    category: "Mobil Rakyat & CDID",
    defaultColor: "#0f172a",
    defaultPlate: "B 2025 IDR",
    maxSpeedKmh: 265,
    acceleration: 40,
    handling: 3.0,
    silhouette: "sedan",
    targetDims: { length: 4.52, width: 1.88, height: 1.4 },
  },
  {
    id: "suv",
    name: "SUV Fortuner / Pajero",
    category: "Mobil Rakyat & CDID",
    glbPath: "/models/cars/suv.glb",
    defaultColor: "#111827",
    defaultPlate: "B 999 VNZ",
    maxSpeedKmh: 225,
    acceleration: 33,
    handling: 2.6,
    silhouette: "mpv",
    targetDims: { length: 4.78, width: 1.92, height: 1.76 },
  },
  {
    id: "bluebird",
    name: "Taksi Bluebird Jakarta",
    category: "Dinas & Umum",
    glbPath: "/models/cars/bluebird.glb",
    defaultColor: "#38bdf8",
    defaultPlate: "B 2889 DR",
    maxSpeedKmh: 195,
    acceleration: 30,
    handling: 2.8,
    silhouette: "mpv",
    isTaxi: true,
    targetDims: { length: 4.45, width: 1.82, height: 1.56 },
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
    silhouette: "bus",
    hasTelolet: true,
    targetDims: { length: 9.8, width: 2.45, height: 3.05 },
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
    silhouette: "sedan",
    isPolice: true,
    targetDims: { length: 4.55, width: 1.9, height: 1.44 },
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
    silhouette: "mpv",
    hasTelolet: true,
    targetDims: { length: 4.18, width: 1.76, height: 1.82 },
  },
  {
    id: "motor",
    name: "Motor Matic / Sport JKT",
    category: "Dinas & Umum",
    defaultColor: "#111827",
    defaultPlate: "B 4510 VKY",
    maxSpeedKmh: 175,
    acceleration: 42,
    handling: 3.5,
    silhouette: "motor",
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
    silhouette: "jet",
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
    silhouette: "boat",
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
    Math.min(Math.max(scaleY, uniformScale * 0.85), uniformScale * 1.25),
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

  const seatY = Math.max(0.26, dims.y * 0.24);
  const seatZ = dims.z * 0.04;
  const seatX = -dims.x * 0.19;

  return {
    scale: uniformScale,
    dimensions: dims,
    seatOffset: new THREE.Vector3(seatX, seatY, seatZ),
    cockpitCamOffset: new THREE.Vector3(seatX, seatY + 0.62, seatZ + 0.14),
    hoodCamOffset: new THREE.Vector3(0, dims.y * 0.68, dims.z * 0.24),
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

/**
 * Helper to create a smooth curved extruded profile aligned so +Z is forward, +Y is up, X is width.
 */
function buildCurvedExtrudedBody(
  pointsZY: Array<[number, number]>,
  width: number,
  bevelSize = 0.06
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pointsZY[0][0], pointsZY[0][1]);
  for (let i = 1; i < pointsZY.length; i++) {
    shape.lineTo(pointsZY[i][0], pointsZY[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevelSize * 2,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
  });

  // ExtrudeGeometry extrudes along +Z from 2D XY.
  // Rotate so 2D X becomes +Z (car length), 2D Y stays +Y (height), and extrusion depth centers on X (car width).
  geo.translate(0, 0, -(width - bevelSize * 2) / 2);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
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
  const rimHex = options?.rimColor ?? "#e2e8f0";
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
    metalness: 0.78,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const trimDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.45,
    roughness: 0.5,
  });

  // Dark tinted transparent film glass (kaca film gelap transparan)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1628,
    metalness: 0.15,
    roughness: 0.05,
    transparent: true,
    opacity: 0.44,
    clearcoat: 1.0,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x1c212b,
    roughness: 0.8,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimHex),
    metalness: 0.92,
    roughness: 0.18,
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.6,
    roughness: 0.3,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xe0f2fe),
    emissiveIntensity: 1.5,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: new THREE.Color(0xdc2626),
    emissiveIntensity: 1.1,
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

  // Detailed Racing Alloy Wheel + Brake Caliper
  const addAlloyWheel = (x: number, y: number, z: number, radius = 0.34, width = 0.27) => {
    const wg = new THREE.Group();
    wg.position.set(x, y, z);

    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 24),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, width + 0.02, 16),
      rimMat
    );
    rim.rotation.z = Math.PI / 2;
    wg.add(rim);
    rimMeshes.push(rim);

    // 5-spoke star cross & center cap
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.03, radius * 1.15, 0.045),
        rimMat
      );
      spoke.rotation.x = (s * Math.PI) / 5;
      wg.add(spoke);
    }

    // Brake caliper accent
    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.55, radius * 0.42, radius * 0.32),
      caliperMat
    );
    caliper.position.set(x > 0 ? 0.02 : -0.02, 0.04, -radius * 0.28);
    wg.add(caliper);

    modelBody.add(wg);
    wheels.push(wg);
  };

  let plateTexture = getLicensePlateTexture(plateStr, true);
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTexture,
    roughness: 0.35,
  });
  let frontPlateMesh: THREE.Mesh | null = null;
  let rearPlateMesh: THREE.Mesh | null = null;

  if (spec.silhouette === "jet") {
    const fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.72, 8.8, 20),
      paintMat
    );
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.set(0, 1.35, 0);
    fuselage.castShadow = true;
    modelBody.add(fuselage);
    bodyMeshes.push(fuselage);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 20), paintMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.35, 5.3);
    modelBody.add(nose);
    bodyMeshes.push(nose);

    addBox(1.1, 0.6, 1.9, 0, 1.95, 2.4, glassMat);
    addBox(8.8, 0.14, 1.8, 0, 1.15, 0.2, paintMat, true);
    addBox(0.16, 1.8, 1.4, 0, 2.4, -3.7, trimDarkMat);
    addBox(3.4, 0.1, 0.9, 0, 1.45, -3.9, paintMat, true);
    addAlloyWheel(0, 0.3, 3.2, 0.28, 0.22);
    addAlloyWheel(-1.1, 0.3, -0.5, 0.3, 0.24);
    addAlloyWheel(1.1, 0.3, -0.5, 0.3, 0.24);
  } else if (spec.silhouette === "boat") {
    addBox(2.15, 0.65, 5.8, 0, 0.42, 0, paintMat, true);
    addBox(1.75, 0.42, 2.0, 0, 0.85, 0.2, glassMat);
    addBox(0.55, 0.45, 0.55, -0.45, 0.72, -0.2, interiorMat);
    addBox(0.55, 0.45, 0.55, 0.45, 0.72, -0.2, interiorMat);
    addBox(0.35, 0.7, 0.45, -0.42, 0.55, -3.05, trimDarkMat);
    addBox(0.35, 0.7, 0.45, 0.42, 0.55, -3.05, trimDarkMat);
    headlights.push(addBox(0.5, 0.14, 0.1, 0, 0.72, 2.9, headlightMat));
  } else if (spec.silhouette === "motor") {
    // Indonesian Street Motorbike / Scooter
    const motorProfile: Array<[number, number]> = [
      [-0.85, 0.35], [0.85, 0.35], [0.95, 0.92], [0.55, 1.05],
      [0.15, 0.62], [-0.35, 0.74], [-0.9, 0.78]
    ];
    const body = new THREE.Mesh(buildCurvedExtrudedBody(motorProfile, 0.52, 0.04), paintMat);
    body.castShadow = true;
    modelBody.add(body);
    bodyMeshes.push(body);
    addBox(0.68, 0.08, 0.1, 0, 1.02, 0.55, trimDarkMat); // Handlebars
    addAlloyWheel(0, 0.28, 0.68, 0.28, 0.14);
    addAlloyWheel(0, 0.28, -0.68, 0.28, 0.16);
    headlights.push(addBox(0.22, 0.14, 0.08, 0, 0.88, 0.94, headlightMat));
    taillights.push(addBox(0.22, 0.1, 0.08, 0, 0.76, -0.92, taillightMat));
  } else if (spec.silhouette === "bus") {
    const busProfile: Array<[number, number]> = [
      [-4.8, 0.36], [4.8, 0.36], [4.86, 1.45], [4.62, 2.9], [-4.72, 2.95], [-4.86, 1.25]
    ];
    const busBody = new THREE.Mesh(buildCurvedExtrudedBody(busProfile, 2.4, 0.08), paintMat);
    busBody.castShadow = true;
    modelBody.add(busBody);
    bodyMeshes.push(busBody);

    addBox(2.44, 0.24, 9.5, 0, 1.15, 0, new THREE.MeshStandardMaterial({ color: 0xffffff }));
    addBox(2.38, 1.08, 9.1, 0, 2.1, 0.05, glassMat);
    addBox(1.4, 0.24, 2.6, 0, 3.05, 0.5, trimDarkMat);

    addAlloyWheel(-1.12, 0.46, 2.8, 0.46, 0.34);
    addAlloyWheel(1.12, 0.46, 2.8, 0.46, 0.34);
    addAlloyWheel(-1.12, 0.46, -2.7, 0.46, 0.34);
    addAlloyWheel(1.12, 0.46, -2.7, 0.46, 0.34);

    headlights.push(
      addBox(0.38, 0.16, 0.08, -0.82, 0.75, 4.86, headlightMat),
      addBox(0.38, 0.16, 0.08, 0.82, 0.75, 4.86, headlightMat)
    );
    taillights.push(
      addBox(0.38, 0.22, 0.08, -0.85, 0.82, -4.86, taillightMat),
      addBox(0.38, 0.22, 0.08, 0.85, 0.82, -4.86, taillightMat)
    );
    frontPlateMesh = addBox(0.52, 0.16, 0.04, 0, 0.52, 4.88, plateMat);
    rearPlateMesh = addBox(0.52, 0.16, 0.04, 0, 0.52, -4.88, plateMat);
  } else {
    // Aerodynamic Curved Silhouettes for Avanza/Innova (MPV), Mercy/BMW/Civic/Bluebird/PJR (Sedan), Supercar/Sport
    const isMpv = spec.silhouette === "mpv";
    const isSuper = spec.silhouette === "supercar";
    const length = spec.targetDims.length;
    const width = spec.targetDims.width;
    const halfL = length / 2;

    const bodyProfile: Array<[number, number]> = isMpv
      ? [
          [-halfL + 0.05, 0.24],
          [halfL - 0.05, 0.24],
          [halfL + 0.02, 0.64],
          [halfL - 0.28, 0.94],
          [halfL * 0.52, 1.02],
          [halfL * 0.22, 1.56],
          [-halfL + 0.45, 1.58],
          [-halfL + 0.08, 1.08],
          [-halfL - 0.02, 0.62],
        ]
      : isSuper
      ? [
          [-halfL + 0.05, 0.2],
          [halfL - 0.05, 0.2],
          [halfL + 0.06, 0.46],
          [halfL - 0.35, 0.74],
          [halfL * 0.42, 0.82],
          [halfL * 0.08, 1.18],
          [-halfL * 0.45, 1.18],
          [-halfL + 0.3, 0.86],
          [-halfL - 0.04, 0.76],
          [-halfL - 0.06, 0.42],
        ]
      : [
          [-halfL + 0.05, 0.24],
          [halfL - 0.05, 0.24],
          [halfL + 0.02, 0.56],
          [halfL - 0.28, 0.84],
          [halfL * 0.46, 0.92],
          [halfL * 0.14, 1.36],
          [-halfL * 0.42, 1.36],
          [-halfL + 0.44, 0.94],
          [-halfL + 0.04, 0.88],
          [-halfL - 0.03, 0.5],
        ];

    const curvedBody = new THREE.Mesh(
      buildCurvedExtrudedBody(bodyProfile, width - 0.04, 0.06),
      paintMat
    );
    curvedBody.castShadow = true;
    curvedBody.receiveShadow = true;
    modelBody.add(curvedBody);
    bodyMeshes.push(curvedBody);

    // Tinted transparent curved greenhouse cabin
    const glassTop = isMpv ? 1.51 : isSuper ? 1.14 : 1.32;
    const glassFront = isMpv ? halfL * 0.5 : halfL * 0.44;
    const glassRear = isMpv ? -halfL + 0.42 : -halfL + 0.46;
    const glassProfile: Array<[number, number]> = [
      [glassFront, isMpv ? 0.96 : 0.88],
      [halfL * 0.16, glassTop],
      [isMpv ? -halfL + 0.52 : -halfL * 0.4, glassTop],
      [glassRear, isMpv ? 1.02 : 0.92],
    ];
    const curvedGlass = new THREE.Mesh(
      buildCurvedExtrudedBody(glassProfile, width * 0.87, 0.03),
      glassMat
    );
    modelBody.add(curvedGlass);

    // Interior seats & dashboard visible through glass
    addBox(width * 0.72, 0.08, 1.4, 0, 0.48, 0, interiorMat);
    addBox(0.45, 0.5, 0.45, -0.38, 0.72, 0.04, interiorMat);
    addBox(0.45, 0.5, 0.45, 0.38, 0.72, 0.04, interiorMat);
    addBox(width * 0.68, 0.2, 0.28, 0, 0.82, 0.52, trimDarkMat);

    // Front grille + splitter + rear diffuser
    addBox(width * 0.62, 0.24, 0.08, 0, 0.52, halfL + 0.02, trimDarkMat);
    addBox(width + 0.02, 0.1, 0.24, 0, 0.24, halfL - 0.05, trimDarkMat);
    addBox(width * 0.92, 0.14, 0.2, 0, 0.28, -halfL + 0.04, trimDarkMat);

    // Side Wing Mirrors (Spion)
    const mirrorY = isMpv ? 0.98 : 0.9;
    addBox(0.18, 0.11, 0.14, -width * 0.52, mirrorY, halfL * 0.26, paintMat, true);
    addBox(0.18, 0.11, 0.14, width * 0.52, mirrorY, halfL * 0.26, paintMat, true);

    // Rear Spoiler for Sport / Supercar / BMW / Civic
    if (isSuper || kind === "bmw" || kind === "civic" || kind === "sport") {
      addBox(0.08, 0.2, 0.16, -0.58, 0.98, -halfL + 0.2, trimDarkMat);
      addBox(0.08, 0.2, 0.16, 0.58, 0.98, -halfL + 0.2, trimDarkMat);
      addBox(width * 0.92, 0.05, 0.28, 0, 1.1, -halfL + 0.18, trimDarkMat);
    }

    // Bluebird Taxi Top Light
    if (spec.isTaxi) {
      addBox(
        0.52,
        0.16,
        0.24,
        0,
        glassTop + 0.1,
        0.05,
        new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: new THREE.Color(0xfacc15),
          emissiveIntensity: 0.9,
        })
      );
    }

    // Police PJR Blue Stripe & Strobe Siren Bar
    if (spec.isPolice) {
      addBox(
        width + 0.02,
        0.18,
        length * 0.72,
        0,
        0.65,
        0,
        new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
      );
      sirenRed = addBox(
        0.52,
        0.13,
        0.24,
        -0.3,
        glassTop + 0.12,
        -0.1,
        new THREE.MeshStandardMaterial({
          color: 0xff0022,
          emissive: new THREE.Color(0xff0022),
          emissiveIntensity: 2.0,
        })
      );
      sirenBlue = addBox(
        0.52,
        0.13,
        0.24,
        0.3,
        glassTop + 0.12,
        -0.1,
        new THREE.MeshStandardMaterial({
          color: 0x0066ff,
          emissive: new THREE.Color(0x0066ff),
          emissiveIntensity: 2.0,
        })
      );
    }

    // 4 Multi-spoke Alloy Wheels
    const wheelR = isMpv ? 0.36 : 0.33;
    const wheelZ = length * 0.31;
    addAlloyWheel(-width * 0.47, wheelR, wheelZ, wheelR, 0.26);
    addAlloyWheel(width * 0.47, wheelR, wheelZ, wheelR, 0.26);
    addAlloyWheel(-width * 0.47, wheelR, -wheelZ, wheelR, 0.26);
    addAlloyWheel(width * 0.47, wheelR, -wheelZ, wheelR, 0.26);

    // LED Projector Headlights + DRL strips
    const lightY = isMpv ? 0.7 : 0.62;
    headlights.push(
      addBox(0.34, 0.11, 0.06, -width * 0.33, lightY, halfL + 0.02, headlightMat),
      addBox(0.34, 0.11, 0.06, width * 0.33, lightY, halfL + 0.02, headlightMat)
    );
    taillights.push(
      addBox(0.42, 0.11, 0.06, -width * 0.31, lightY + 0.08, -halfL - 0.02, taillightMat),
      addBox(0.42, 0.11, 0.06, width * 0.31, lightY + 0.08, -halfL - 0.02, taillightMat)
    );

    // Turn Signals
    leftTurnSignals.push(
      addBox(0.14, 0.09, 0.08, -width * 0.44, lightY, halfL + 0.02, leftSignalMat),
      addBox(0.14, 0.09, 0.08, -width * 0.44, lightY + 0.06, -halfL - 0.02, leftSignalMat)
    );
    rightTurnSignals.push(
      addBox(0.14, 0.09, 0.08, width * 0.44, lightY, halfL + 0.02, rightSignalMat),
      addBox(0.14, 0.09, 0.08, width * 0.44, lightY + 0.06, -halfL - 0.02, rightSignalMat)
    );

    // White Jakarta License Plates
    frontPlateMesh = addBox(0.48, 0.14, 0.03, 0, 0.38, halfL + 0.03, plateMat);
    rearPlateMesh = addBox(0.48, 0.14, 0.03, 0, 0.48, -halfL - 0.03, plateMat);
  }

  // Neon underglow
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

  const cabinFit = autoScaleAndFitCabin(
    modelBody,
    spec.targetDims.length,
    spec.targetDims.width,
    spec.targetDims.height
  );

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
      plateTexture = getLicensePlateTexture(plate, true);
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
      headlightMat.emissiveIntensity = headlightsOn ? 2.5 : 0.5;
      taillightMat.emissiveIntensity = braking ? 3.4 : headlightsOn ? 1.2 : 0.3;

      const blink = Math.sin(timeSec * 8) > 0;
      leftSignalMat.emissiveIntensity = (leftTurn || hazard) && blink ? 3.0 : 0.0;
      rightSignalMat.emissiveIntensity = (rightTurn || hazard) && blink ? 3.0 : 0.0;

      if (sirenRed && sirenBlue) {
        const phase = Math.sin(timeSec * 14) > 0;
        const rMat = sirenRed.material as THREE.MeshStandardMaterial;
        const bMat = sirenBlue.material as THREE.MeshStandardMaterial;
        if (policeActive) {
          rMat.emissiveIntensity = phase ? 4.4 : 0.2;
          bMat.emissiveIntensity = phase ? 0.2 : 4.4;
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

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), jacketMat);
  torso.position.y = 1.16;
  torso.castShadow = true;
  group.add(torso);

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

  const weaponMesh = new THREE.Group();
  weaponMesh.position.set(0, -0.45, 0.14);
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.32), shirtMat);
  weaponMesh.add(gunBody);
  weaponMesh.visible = false;
  rightArm.add(weaponMesh);
  group.add(rightArm);

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
        group.scale.setScalar(0.56);
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
