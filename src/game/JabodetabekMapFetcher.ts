import jakartaRealGeoJson from "@/data/jakarta-real-map.geojson";

export type JabodetabekRegionId =
  | "jakpus"
  | "jaksel"
  | "jakut"
  | "tangerang"
  | "bogor"
  | "bekasi_depok";

export interface JabodetabekRegion {
  id: JabodetabekRegionId;
  areaLabel: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  hasWaterZone: boolean;
  hasBusway: boolean;
  tollLabel: string;
  landmarkName: string;
  accentColor: string;
}

export interface RoadSegmentData {
  id: string;
  points: Array<[number, number]>;
  width: number;
  name: string;
  layer: "grid" | "primary" | "busway" | "flyover";
  isBusway?: boolean;
  isFlyover?: boolean;
  elevation?: number;
}

export interface BuildingFootprintData {
  id: string;
  name?: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  kind:
    | "skyscraper"
    | "wisma46"
    | "minimarket"
    | "bengkel"
    | "warung"
    | "mall"
    | "fore_coffee"
    | "kopi_kenangan"
    | "rental_ps"
    | "lawson_family";
  rotation: number;
}

export interface HangoutSpotData {
  id: string;
  name: string;
  subtitle: string;
  kind: "fore_coffee" | "kopi_kenangan" | "rental_ps" | "warung";
  x: number; // Patio interaction center X
  z: number; // Patio interaction center Z
  buildingX: number;
  buildingZ: number;
}

export interface SpbuStationData {
  id: string;
  x: number;
  z: number;
  name: string;
}

export interface TrafficLightNode {
  id: string;
  x: number;
  z: number;
}

export interface MapLayoutData {
  region: JabodetabekRegion;
  source: "local-cache" | "openstreetmap-live" | "jakarta-geojson";
  roads: RoadSegmentData[];
  buildings: BuildingFootprintData[];
  spbuStations: SpbuStationData[];
  tollSigns: Array<{ x: number; z: number; rotation: number; label: string }>;
  waterZones: Array<{ x: number; z: number; width: number; depth: number }>;
  trafficLights: TrafficLightNode[];
  halteLocations: Array<{ x: number; z: number; label: string }>;
  jpoLocations: Array<{ x: number; z: number; rotation: number }>;
  hangoutSpots: HangoutSpotData[];
  mrtStations: Array<{ x: number; z: number; name: string }>;
}

export const JABODETABEK_REGIONS: JabodetabekRegion[] = [
  {
    id: "jakpus",
    areaLabel: "Jakarta Pusat",
    title: "Bundaran HI & Sudirman–SCBD",
    subtitle:
      "Peta nyata OSM Jakarta (.GeoJSON): Monumen Selamat Datang, Halte TransJakarta Kapal Pesiar, Wisma 46 & Semanggi.",
    lat: -6.1949,
    lng: 106.8230,
    hasWaterZone: false,
    hasBusway: true,
    tollLabel: "SUDIRMAN • SCBD • BUNDARAN HI",
    landmarkName: "Monumen Selamat Datang Bundaran HI",
    accentColor: "#ff3e9d",
  },
  {
    id: "jaksel",
    areaLabel: "Jakarta Selatan",
    title: "Pondok Indah & Blok M",
    subtitle:
      "Data jalan & gedung asli OSM Pondok Indah – Blok M, JPO rangka baja, ruko 3 lantai & mal selatan.",
    lat: -6.2442,
    lng: 106.7973,
    hasWaterZone: false,
    hasBusway: true,
    tollLabel: "BLOK M • PONDOK INDAH • JORR",
    landmarkName: "Blok M Square & JPO Pondok Indah",
    accentColor: "#a855f7",
  },
  {
    id: "jakut",
    areaLabel: "Jakarta Utara",
    title: "Pantai Indah Kapuk (PIK)",
    subtitle:
      "Kawasan pesisir modern, jembatan PIK, wisata kuliner & zona Speedboat laut.",
    lat: -6.1088,
    lng: 106.7405,
    hasWaterZone: true,
    hasBusway: false,
    tollLabel: "PIK AVENUE • PANTAI MAJU • BANDARA",
    landmarkName: "Pantai Maju & Jembatan PIK",
    accentColor: "#00f0ff",
  },
  {
    id: "tangerang",
    areaLabel: "Tangerang",
    title: "BSD City & Alam Sutera",
    subtitle:
      "Boulevard lebar modern, ideal untuk top-speed supercar, BMW M2 & Mercedes-AMG G63.",
    lat: -6.3016,
    lng: 106.6533,
    hasWaterZone: false,
    hasBusway: false,
    tollLabel: "BSD CITY • ICE • ALAM SUTERA",
    landmarkName: "Boulevard BSD & AEON District",
    accentColor: "#38bdf8",
  },
  {
    id: "bogor",
    areaLabel: "Bogor",
    title: "Sirkuit Sentul & Pajajaran",
    subtitle:
      "Trek sirkuit balap beraspal mulus, tol Jagorawi & lokasi Balap Liar resmi.",
    lat: -6.5361,
    lng: 106.8575,
    hasWaterZone: true,
    hasBusway: false,
    tollLabel: "SIRKUIT SENTUL • JAGORAWI • BOGOR",
    landmarkName: "Sentul International Circuit",
    accentColor: "#22c55e",
  },
  {
    id: "bekasi_depok",
    areaLabel: "Bekasi & Depok",
    title: "Summarecon Bekasi & Margonda",
    subtitle:
      "Koridor padat, flyover ikonik, dan deretan ruko & warkop 24 jam.",
    lat: -6.2261,
    lng: 107.0011,
    hasWaterZone: false,
    hasBusway: true,
    tollLabel: "SUMMARECON BEKASI • MARGONDA • BECAKAYU",
    landmarkName: "Flyover Summarecon Bekasi",
    accentColor: "#ff8c38",
  },
];

const METERS_PER_DEG_LAT = 111132;

export function getRegionById(id: JabodetabekRegionId): JabodetabekRegion {
  return JABODETABEK_REGIONS.find((r) => r.id === id) ?? JABODETABEK_REGIONS[0];
}

export function worldToGps(
  x: number,
  z: number,
  region: JabodetabekRegion
): { lat: number; lng: number } {
  const lat = region.lat - z / METERS_PER_DEG_LAT;
  const metersPerDegLng =
    111320 * Math.cos((region.lat * Math.PI) / 180);
  const lng = region.lng + x / metersPerDegLng;
  return { lat, lng };
}

export function gpsToWorld(
  lat: number,
  lng: number,
  region: JabodetabekRegion
): { x: number; z: number } {
  const z = -(lat - region.lat) * METERS_PER_DEG_LAT;
  const metersPerDegLng =
    111320 * Math.cos((region.lat * Math.PI) / 180);
  const x = (lng - region.lng) * metersPerDegLng;
  return { x, z };
}

export function latLngToOsmTile(
  lat: number,
  lng: number,
  zoom = 16
): { x: number; y: number; zoom: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y, zoom };
}

function pointToSegmentDist(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.001) return Math.hypot(px - x1, pz - z1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

function buildingHitsAnyRoad(
  bx: number,
  bz: number,
  bw: number,
  bd: number,
  roads: RoadSegmentData[]
): boolean {
  const bRad = Math.max(bw, bd) * 0.56;
  if (Math.hypot(bx, bz) < 40 + bRad) return true; // Keep Bundaran HI clear
  for (const r of roads) {
    if (r.isFlyover) continue;
    const minAllow = r.width * 0.55 + bRad + 2.5;
    for (let i = 0; i < r.points.length - 1; i++) {
      const d = pointToSegmentDist(
        bx,
        bz,
        r.points[i][0],
        r.points[i][1],
        r.points[i + 1][0],
        r.points[i + 1][1]
      );
      if (d < minAllow) return true;
    }
  }
  return false;
}

interface GeoJsonFeature {
  type: string;
  properties: {
    osm_id?: number;
    corridor?: string;
    kind?: string;
    highway?: string;
    name?: string;
    lanes?: number;
    bridge?: boolean;
    busway?: boolean;
    levels?: number;
    height?: number;
  };
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export function getLocalCachedMapLayout(regionId: JabodetabekRegionId): MapLayoutData {
  const region = getRegionById(regionId);
  const roads: RoadSegmentData[] = [];
  const buildings: BuildingFootprintData[] = [];

  const spbuStations: SpbuStationData[] = [
    { id: "spbu_north", x: 32, z: -64, name: "SPBU Pertamina 34.101 Pasti Pas" },
    { id: "spbu_south", x: -32, z: 68, name: "SPBU Pertamina Pertamax Turbo" },
  ];

  // Cleanly layered non-overlapping arterial & collector streets
  roads.push(
    {
      id: "main_ns",
      points: [
        [0, -360],
        [0, 360],
      ],
      width: 24,
      layer: "primary",
      name: region.id === "jakpus" ? "Jl. M.H. Thamrin – Jl. Jend. Sudirman" : "Boulevard Utama Jakarta",
    },
    {
      id: "main_ew",
      points: [
        [-360, 0],
        [360, 0],
      ],
      width: 22,
      layer: "primary",
      name: region.id === "jakpus" ? "Jl. Kebon Kacang – Jl. Imam Bonjol" : "Jl. Arteri Raya",
    }
  );

  if (region.hasBusway) {
    roads.push({
      id: "busway_ns",
      points: [
        [-4.5, -340],
        [-4.5, 340],
      ],
      width: 4.5,
      layer: "busway",
      name: "Koridor 1 Busway TransJakarta",
      isBusway: true,
    });
  }

  const gridOffsets = [-240, -150, -90, 90, 150, 240];
  gridOffsets.forEach((offset, i) => {
    roads.push({
      id: `grid_ns_${i}`,
      points: [
        [offset, -320],
        [offset, 320],
      ],
      width: 14,
      layer: "grid",
      name: `Jl. Distrik ${i + 1}`,
    });
    roads.push({
      id: `grid_ew_${i}`,
      points: [
        [-320, offset],
        [320, offset],
      ],
      width: 14,
      layer: "grid",
      name: `Jl. Penghubung ${i + 1}`,
    });
  });

  // Simpang Susun Semanggi / Elevated Flyover
  roads.push({
    id: "flyover_tol",
    points: [
      [-320, -150],
      [-120, -150],
      [120, -150],
      [320, -150],
    ],
    width: 16,
    layer: "flyover",
    name: "Simpang Susun Semanggi / Tol Dalam Kota",
    isFlyover: true,
    elevation: 8.5,
  });

  if (regionId === "bogor") {
    roads.push({
      id: "sentul_circuit",
      points: [
        [120, -110],
        [240, -110],
        [280, -30],
        [240, 110],
        [120, 110],
        [80, 0],
        [120, -110],
      ],
      width: 16,
      layer: "grid",
      name: "Lintasan Sirkuit Sentul",
    });
  }

  // Iconic Named Jakarta Buildings around Bundaran HI & Sudirman (exact real proportions)
  if (regionId === "jakpus") {
    buildings.push(
      {
        id: "hotel_indonesia_kempinski",
        name: "Hotel Indonesia Kempinski",
        x: -44,
        z: 38,
        width: 34,
        depth: 24,
        height: 58,
        kind: "skyscraper",
        rotation: 0,
      },
      {
        id: "menara_bca_gi",
        name: "Menara BCA & Grand Indonesia",
        x: -48,
        z: -42,
        width: 30,
        depth: 28,
        height: 118,
        kind: "skyscraper",
        rotation: 0,
      },
      {
        id: "plaza_indonesia",
        name: "Plaza Indonesia & The Plaza",
        x: 46,
        z: -36,
        width: 32,
        depth: 26,
        height: 92,
        kind: "skyscraper",
        rotation: 0,
      },
      {
        id: "wisma_46_bni",
        name: "Wisma 46 Kota BNI",
        x: 48,
        z: 48,
        width: 28,
        depth: 26,
        height: 132,
        kind: "wisma46",
        rotation: 0,
      }
    );
  }

  let usedGeoJson = false;
  if (regionId === "jakpus" || regionId === "jaksel") {
    const fc = jakartaRealGeoJson as { features?: GeoJsonFeature[] };
    const features = Array.isArray(fc?.features) ? fc.features : [];
    const targetCorridor = regionId === "jakpus" ? "sudirman-hi" : "pondokindah-blokm";

    for (const feat of features) {
      if (feat.properties?.corridor !== targetCorridor) continue;

      if (
        feat.properties?.kind === "building" &&
        feat.geometry?.type === "Polygon" &&
        Array.isArray(feat.geometry.coordinates) &&
        buildings.length < 110
      ) {
        const ring = (feat.geometry.coordinates as Array<Array<[number, number]>>)[0];
        if (!Array.isArray(ring) || ring.length < 3) continue;
        let minX = Infinity,
          maxX = -Infinity,
          minZ = Infinity,
          maxZ = -Infinity;
        for (const c of ring) {
          const p = gpsToWorld(c[1], c[0], region);
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minZ = Math.min(minZ, p.z);
          maxZ = Math.max(maxZ, p.z);
        }
        const cx = (minX + maxX) * 0.5;
        const cz = (minZ + maxZ) * 0.5;
        const bw = Math.min(Math.max(maxX - minX, 12), 38);
        const bd = Math.min(Math.max(maxZ - minZ, 12), 38);

        if (Math.abs(cx) > 340 || Math.abs(cz) > 340) continue;
        if (buildingHitsAnyRoad(cx, cz, bw, bd, roads)) continue;

        // Avoid colliding with SPBU or already placed landmarks
        const tooClose =
          buildings.some((b) => Math.hypot(b.x - cx, b.z - cz) < 28) ||
          spbuStations.some((sp) => Math.hypot(sp.x - cx, sp.z - cz) < 26);
        if (tooClose) continue;

        const levels = feat.properties.levels || 0;
        const explicitH = feat.properties.height || 0;
        const h =
          explicitH > 0
            ? Math.min(explicitH, 110)
            : levels > 0
            ? Math.min(levels * 4.2, 100)
            : 18 + (buildings.length % 5) * 10;

        usedGeoJson = true;
        buildings.push({
          id: `geojson_bld_${feat.properties.osm_id || buildings.length}`,
          name: feat.properties.name,
          x: cx,
          z: cz,
          width: bw,
          depth: bd,
          height: h,
          kind:
            h > 16
              ? "skyscraper"
              : (["minimarket", "bengkel", "warung"] as const)[buildings.length % 3],
          rotation: 0,
        });
      }
    }
  }

  // Dedicated Hangout Spots (Kafe Fore Coffee, Kopi Kenangan, Rental PS5 & Warnet 24 Jam, Warkop Taichan)
  const hangoutSpots: HangoutSpotData[] = [
    {
      id: "fore_sudirman",
      name: "Fore Coffee Sudirman",
      subtitle: "Nongkrong & Kopi Susu Butterscotch • Restore HP & Armor",
      kind: "fore_coffee",
      x: 17.5,
      z: 44,
      buildingX: 25,
      buildingZ: 44,
    },
    {
      id: "kenangan_scbd",
      name: "Kopi Kenangan Mantan SCBD",
      subtitle: "Es Kopi Kenangan & Temu Komunitas Mobil • Restore HP & Nitro",
      kind: "kopi_kenangan",
      x: -17.5,
      z: -62,
      buildingX: -25,
      buildingZ: -62,
    },
    {
      id: "rental_ps_vinsky",
      name: "Rental PS5 & Warnet Vinsky 24 Jam",
      subtitle: "Main 6 Mini-Games Arcade & Turnamen Berhadiah ($)",
      kind: "rental_ps",
      x: 17.5,
      z: 72,
      buildingX: 25,
      buildingZ: 72,
    },
    {
      id: "warkop_taichan",
      name: "Warkop & Sate Taichan Senayan",
      subtitle: "Indomie Telor Kornet & Sate Taichan 24 Jam",
      kind: "warung",
      x: -17.5,
      z: 112,
      buildingX: -25,
      buildingZ: 112,
    },
    {
      id: "rental_ps_selatan",
      name: "Warnet & Rental PS5 Blok M",
      subtitle: "Arena Mabar PS5: Penalty Tarkam, Silat & Ojol Rush",
      kind: "rental_ps",
      x: 17.5,
      z: 112,
      buildingX: 25,
      buildingZ: 112,
    },
  ];

  hangoutSpots.forEach((spot) => {
    buildings.push({
      id: `hangout_bld_${spot.id}`,
      name: spot.name,
      x: spot.buildingX,
      z: spot.buildingZ,
      width: 12,
      depth: 12,
      height: 11.8,
      kind: spot.kind,
      rotation: 0,
    });
  });

  // Fill city blocks densely across -260..+260 with architectural skyscrapers & 3-story rukos
  const rukoTypes: Array<
    | "minimarket"
    | "bengkel"
    | "warung"
    | "fore_coffee"
    | "kopi_kenangan"
    | "rental_ps"
    | "lawson_family"
  > = [
    "fore_coffee",
    "kopi_kenangan",
    "rental_ps",
    "lawson_family",
    "minimarket",
    "bengkel",
    "warung",
  ];
  const blockCenters = [-260, -195, -120, -45, 45, 120, 195, 260];
  let bIdx = 0;

  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      if (region.hasWaterZone && bx > 150) continue;
      if (buildingHitsAnyRoad(bx, bz, 26, 26, roads)) continue;
      if (buildings.some((b) => Math.hypot(b.x - bx, b.z - bz) < 26)) continue;
      if (spbuStations.some((sp) => Math.hypot(sp.x - bx, sp.z - bz) < 26)) continue;

      const seed = (Math.abs(bx * 7 + bz * 13) + bIdx) % 10;
      const isCore = Math.abs(bx) < 160 && Math.abs(bz) < 160;
      const kind: BuildingFootprintData["kind"] =
        isCore || seed > 4
          ? "skyscraper"
          : seed === 1
          ? "mall"
          : rukoTypes[bIdx % rukoTypes.length];

      const height =
        kind === "skyscraper"
          ? 44 + ((seed * 11) % 64)
          : kind === "mall"
          ? 26
          : 12.2;

      buildings.push({
        id: `jkt_block_${bIdx++}`,
        x: bx,
        z: bz,
        width: kind === "skyscraper" ? 26 : 18,
        depth: kind === "skyscraper" ? 26 : 15,
        height,
        kind,
        rotation: 0,
      });
    }
  }

  // Extra dense roadside 3-story Ruko rows & mid-rise towers flanking Sudirman/Thamrin & cross corridors
  [-210, -120, -58, 58, 120, 210].forEach((rz, idx) => {
    [-30, 30, -64, 64].forEach((rx) => {
      if (buildingHitsAnyRoad(rx, rz, 14, 14, roads)) return;
      if (buildings.some((b) => Math.hypot(b.x - rx, b.z - rz) < 18)) return;
      if (spbuStations.some((sp) => Math.hypot(sp.x - rx, sp.z - rz) < 22)) return;
      buildings.push({
        id: `ruko_row_${idx}_${rx}`,
        x: rx,
        z: rz,
        width: 14,
        depth: 14,
        height: Math.abs(rx) > 50 ? 38 + (idx % 4) * 9 : 11.8,
        kind:
          Math.abs(rx) > 50
            ? "skyscraper"
            : rukoTypes[(idx + (rx > 0 ? 2 : 0)) % rukoTypes.length],
        rotation: 0,
      });
    });
  });

  const tollSigns = [
    { x: 0, z: -72, rotation: 0, label: region.tollLabel },
    { x: 0, z: 75, rotation: Math.PI, label: "BUNDARAN HI • THAMRIN" },
    { x: -115, z: 0, rotation: Math.PI / 2, label: "SEMANGGI • TOL DALAM KOTA" },
    { x: 115, z: 0, rotation: -Math.PI / 2, label: "SCBD • SENAYAN • PONDOK INDAH" },
  ];

  const waterZones = region.hasWaterZone
    ? [{ x: 255, z: 0, width: 170, depth: 620 }]
    : [{ x: 325, z: 245, width: 130, depth: 180 }];

  const trafficLights: TrafficLightNode[] = [
    { id: "tl_north", x: 0, z: -90 },
    { id: "tl_south", x: 0, z: 90 },
    { id: "tl_west", x: -90, z: 0 },
    { id: "tl_east", x: 90, z: 0 },
  ];

  const halteLocations = region.hasBusway
    ? [
        { x: -4.5, z: -48, label: "Bundaran HI" },
        { x: -4.5, z: 54, label: "Tosari / SCBD" },
      ]
    : [];

  const jpoLocations = [
    { x: 0, z: 145, rotation: 0 },
    { x: 0, z: -122, rotation: 0 },
  ];

  const mrtStations =
    region.id === "jakpus" || region.id === "jaksel"
      ? [
          { x: -16.8, z: -38, name: "BUNDARAN HI • ASTRA" },
          { x: 16.8, z: 82, name: "DUKUH ATAS / SUDIRMAN" },
        ]
      : [];

  return {
    region,
    source: usedGeoJson ? "jakarta-geojson" : "local-cache",
    roads,
    buildings,
    spbuStations,
    tollSigns,
    waterZones,
    trafficLights,
    halteLocations,
    jpoLocations,
    hangoutSpots,
    mrtStations,
  };
}

const osmMemoryCache = new Map<JabodetabekRegionId, MapLayoutData>();

export async function fetchJabodetabekMapOSM(
  regionId: JabodetabekRegionId
): Promise<MapLayoutData> {
  if (osmMemoryCache.has(regionId)) {
    return osmMemoryCache.get(regionId)!;
  }

  const baseLayout = getLocalCachedMapLayout(regionId);
  if (regionId === "jakpus" || regionId === "jaksel") {
    osmMemoryCache.set(regionId, baseLayout);
    return baseLayout;
  }

  const { region } = baseLayout;
  const delta = 0.0038;
  const bbox = `${(region.lng - delta).toFixed(5)},${(region.lat - delta).toFixed(
    5
  )},${(region.lng + delta).toFixed(5)},${(region.lat + delta).toFixed(5)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.openstreetmap.org/api/0.6/map.json?bbox=${bbox}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return baseLayout;

    const json = await res.json();
    if (!json || !Array.isArray(json.elements)) return baseLayout;

    const nodes = new Map<number, { lat: number; lon: number }>();
    for (const el of json.elements) {
      if (el.type === "node") nodes.set(el.id, { lat: el.lat, lon: el.lon });
    }

    const osmRoads: RoadSegmentData[] = [];
    for (const el of json.elements) {
      if (el.type === "way" && el.tags?.highway && Array.isArray(el.nodes)) {
        const pts: Array<[number, number]> = [];
        for (const nid of el.nodes) {
          const nd = nodes.get(nid);
          if (nd) {
            const p = gpsToWorld(nd.lat, nd.lon, region);
            if (Math.abs(p.x) < 350 && Math.abs(p.z) < 350) pts.push([p.x, p.z]);
          }
        }
        if (pts.length >= 2) {
          osmRoads.push({
            id: `osm_${el.id}`,
            points: pts,
            width: 12,
            layer: "grid",
            name: el.tags.name ?? "Jalan Jabodetabek (OSM)",
          });
        }
      }
    }

    const merged: MapLayoutData = {
      ...baseLayout,
      source: osmRoads.length > 0 ? "openstreetmap-live" : baseLayout.source,
      roads:
        osmRoads.length > 3
          ? [...baseLayout.roads.slice(0, 4), ...osmRoads.slice(0, 35)]
          : baseLayout.roads,
    };
    osmMemoryCache.set(regionId, merged);
    return merged;
  } catch {
    return baseLayout;
  }
}
