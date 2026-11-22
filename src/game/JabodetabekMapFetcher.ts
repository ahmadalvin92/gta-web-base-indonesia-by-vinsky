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
  points: Array<[number, number]>; // [x, z] in meters
  width: number;
  name: string;
  isBusway?: boolean;
  isFlyover?: boolean;
  elevation?: number;
}

export interface BuildingFootprintData {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  kind: "skyscraper" | "minimarket" | "bengkel" | "warung" | "mall";
  rotation: number;
}

export interface SpbuStationData {
  id: string;
  x: number;
  z: number;
  name: string;
}

export interface MapLayoutData {
  region: JabodetabekRegion;
  source: "local-cache" | "openstreetmap-live";
  roads: RoadSegmentData[];
  buildings: BuildingFootprintData[];
  spbuStations: SpbuStationData[];
  tollSigns: Array<{ x: number; z: number; rotation: number; label: string }>;
  waterZones: Array<{ x: number; z: number; width: number; depth: number }>;
}

export const JABODETABEK_REGIONS: JabodetabekRegion[] = [
  {
    id: "jakpus",
    areaLabel: "Jakarta Pusat",
    title: "Bundaran HI & Sudirman–SCBD",
    subtitle: "Jantung ibu kota, jalur Busway TransJakarta & gedung pencakar langit SCBD.",
    lat: -6.1944,
    lng: 106.8229,
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
    subtitle: "Distrik hangout hits Jaksel, boulevard luas, ruko & jalur flyover Antasari.",
    lat: -6.2442,
    lng: 106.7973,
    hasWaterZone: false,
    hasBusway: true,
    tollLabel: "BLOK M • PONDOK INDAH • JORR",
    landmarkName: "Blok M Square & Flyover",
    accentColor: "#a855f7",
  },
  {
    id: "jakut",
    areaLabel: "Jakarta Utara",
    title: "Pantai Indah Kapuk (PIK)",
    subtitle: "Kawasan pesisir modern, jembatan PIK, wisata kuliner & zona Speedboat laut.",
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
    subtitle: "Jalan boulevard lebar ala luar negeri, ideal untuk top-speed supercar & drift.",
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
    subtitle: "Trek sirkuit balap beraspal mulus, tol Jagorawi & akses kebun raya.",
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
    subtitle: "Koridor ramai, flyover ikonik, dan pusat kuliner malam 24 jam.",
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
  // World +Z goes south or north? Let's define -Z = North, +Z = South, +X = East
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

/**
 * Generates instant cached Jabodetabek city road network, busway lanes, flyovers,
 * buildings, SPBU fuel stations, toll gantry signs, and coastal/river water zones.
 */
export function getLocalCachedMapLayout(regionId: JabodetabekRegionId): MapLayoutData {
  const region = getRegionById(regionId);
  const roads: RoadSegmentData[] = [];
  const buildings: BuildingFootprintData[] = [];
  const spbuStations: SpbuStationData[] = [
    { id: "spbu_north", x: 34, z: -72, name: "SPBU 34.101 Pasti Pas" },
    { id: "spbu_south", x: -34, z: 96, name: "SPBU Pertamax Turbo 24H" },
  ];

  // Primary arterial N-S and E-W avenues
  roads.push(
    {
      id: "main_ns",
      points: [
        [0, -340],
        [0, 340],
      ],
      width: 22,
      name: region.id === "jakpus" ? "Jl. Jend. Sudirman" : "Boulevard Utama",
    },
    {
      id: "main_ew",
      points: [
        [-340, 0],
        [340, 0],
      ],
      width: 20,
      name: region.id === "jakpus" ? "Jl. M.H. Thamrin" : "Jl. Raya Protokol",
    }
  );

  // TransJakarta dedicated busway lane in center median when supported
  if (region.hasBusway) {
    roads.push({
      id: "busway_ns",
      points: [
        [-5.5, -320],
        [-5.5, 320],
      ],
      width: 4.5,
      name: "Koridor Busway TransJakarta",
      isBusway: true,
    });
  }

  // Grid blocks around center (-240..240 every 90m)
  const gridOffsets = [-240, -150, -90, 90, 150, 240];
  gridOffsets.forEach((offset, i) => {
    roads.push({
      id: `grid_ns_${i}`,
      points: [
        [offset, -300],
        [offset, 300],
      ],
      width: 13,
      name: `Jl. Distrik ${i + 1}`,
    });
    roads.push({
      id: `grid_ew_${i}`,
      points: [
        [-300, offset],
        [300, offset],
      ],
      width: 13,
      name: `Jl. Penghubung ${i + 1}`,
    });
  });

  // Elevated Toll Flyover / Jalan Layang
  roads.push({
    id: "flyover_tol",
    points: [
      [-320, -150],
      [-120, -150],
      [120, -150],
      [320, -150],
    ],
    width: 16,
    name: "Tol Layang Dalam Kota (Jasa Marga)",
    isFlyover: true,
    elevation: 8.5,
  });

  // Sentul circuit loop for Bogor or outer ring boulevard
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
      name: "Lintasan Sirkuit Sentul",
    });
  }

  // Deterministic city buildings placed cleanly inside block footprints (never blocking roads)
  const blockCenters = [-195, -120, -45, 45, 120, 195];
  let bIdx = 0;
  const rukoTypes: Array<"minimarket" | "bengkel" | "warung"> = [
    "minimarket",
    "bengkel",
    "warung",
  ];

  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      // Keep Bundaran / central spawn plaza clear
      if (Math.abs(bx) < 55 && Math.abs(bz) < 55) continue;
      // Keep PIK coastal east zone open for water
      if (region.hasWaterZone && bx > 150) continue;
      // Keep SPBU footprints clear
      if (
        (Math.abs(bx - 45) < 25 && Math.abs(bz + 72) < 25) ||
        (Math.abs(bx + 45) < 25 && Math.abs(bz - 96) < 25)
      ) {
        continue;
      }

      const seed = (Math.abs(bx * 7 + bz * 13) + bIdx) % 10;
      const isCore = Math.abs(bx) < 130 && Math.abs(bz) < 130;
      const kind: BuildingFootprintData["kind"] =
        isCore && seed > 2
          ? "skyscraper"
          : seed === 1
          ? "mall"
          : seed % 3 === 0
          ? rukoTypes[bIdx % 3]
          : "skyscraper";

      const height =
        kind === "skyscraper"
          ? 28 + ((seed * 9) % 58)
          : kind === "mall"
          ? 18
          : 8 + (seed % 4);

      buildings.push({
        id: `bld_${bIdx++}`,
        x: bx,
        z: bz,
        width: kind === "skyscraper" ? 22 + (seed % 10) : 16,
        depth: kind === "skyscraper" ? 22 + ((seed * 3) % 10) : 14,
        height,
        kind,
        rotation: 0,
      });
    }
  }

  const tollSigns = [
    { x: 0, z: -65, rotation: 0, label: region.tollLabel },
    { x: 0, z: 75, rotation: Math.PI, label: "ARAH PUSAT KOTA • SCBD" },
    { x: -115, z: 0, rotation: Math.PI / 2, label: "TOL JAGORAWI / SENTUL" },
    { x: 115, z: 0, rotation: -Math.PI / 2, label: "PANTAI INDAH KAPUK • BANDARA" },
  ];

  const waterZones = region.hasWaterZone
    ? [{ x: 255, z: 0, width: 170, depth: 620 }]
    : [{ x: 320, z: 240, width: 130, depth: 180 }]; // Sungai Ciliwung / Danau Kota

  return {
    region,
    source: "local-cache",
    roads,
    buildings,
    spbuStations,
    tollSigns,
    waterZones,
  };
}

const osmMemoryCache = new Map<JabodetabekRegionId, MapLayoutData>();

/**
 * Fetches real-world Jabodetabek road & building footprints from OpenStreetMap Overpass API (100% Free, No API Key).
 * Falls back gracefully to local cached layout if offline or rate-limited.
 */
export async function fetchJabodetabekMapOSM(
  regionId: JabodetabekRegionId
): Promise<MapLayoutData> {
  if (osmMemoryCache.has(regionId)) {
    return osmMemoryCache.get(regionId)!;
  }

  const baseLayout = getLocalCachedMapLayout(regionId);
  const { region } = baseLayout;

  // Query bounding box (~450m radius around region center)
  const deltaLat = 0.0042;
  const deltaLng = 0.0042;
  const s = (region.lat - deltaLat).toFixed(5);
  const w = (region.lng - deltaLng).toFixed(5);
  const n = (region.lat + deltaLat).toFixed(5);
  const e = (region.lng + deltaLng).toFixed(5);

  const query = `[out:json][timeout:6];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${s},${w},${n},${e});way["building"](${s},${w},${n},${e}););out body 120;>;out skel qt;`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return baseLayout;
    const json = await res.json();
    if (!json || !Array.isArray(json.elements)) return baseLayout;

    const nodes = new Map<number, { lat: number; lon: number }>();
    for (const el of json.elements) {
      if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
        nodes.set(el.id, { lat: el.lat, lon: el.lon });
      }
    }

    const osmRoads: RoadSegmentData[] = [];
    const osmBuildings: BuildingFootprintData[] = [];

    for (const el of json.elements) {
      if (el.type !== "way" || !Array.isArray(el.nodes) || el.nodes.length < 2) continue;

      if (el.tags?.highway) {
        const pts: Array<[number, number]> = [];
        for (const nid of el.nodes) {
          const nd = nodes.get(nid);
          if (nd) {
            const p = gpsToWorld(nd.lat, nd.lon, region);
            if (Math.abs(p.x) < 360 && Math.abs(p.z) < 360) {
              pts.push([p.x, p.z]);
            }
          }
        }
        if (pts.length >= 2) {
          const hw = el.tags.highway;
          const width =
            hw === "motorway" || hw === "trunk"
              ? 18
              : hw === "primary"
              ? 15
              : hw === "secondary"
              ? 12
              : 9;
          osmRoads.push({
            id: `osm_road_${el.id}`,
            points: pts,
            width,
            name: el.tags.name ?? "Jalan Jabodetabek (OSM)",
          });
        }
      } else if (el.tags?.building && osmBuildings.length < 70) {
        let minX = Infinity,
          maxX = -Infinity,
          minZ = Infinity,
          maxZ = -Infinity;
        let count = 0;
        for (const nid of el.nodes) {
          const nd = nodes.get(nid);
          if (nd) {
            const p = gpsToWorld(nd.lat, nd.lon, region);
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z);
            maxZ = Math.max(maxZ, p.z);
            count++;
          }
        }
        if (count >= 3) {
          const cx = (minX + maxX) * 0.5;
          const cz = (minZ + maxZ) * 0.5;
          const bw = Math.min(Math.max(maxX - minX, 8), 38);
          const bd = Math.min(Math.max(maxZ - minZ, 8), 38);
          // Keep central spawn plaza open
          if (Math.abs(cx) > 32 || Math.abs(cz) > 32) {
            const levels = Number(el.tags["building:levels"]) || 0;
            const h = levels > 0 ? Math.min(levels * 4.2, 75) : 14 + ((el.id % 5) * 7);
            osmBuildings.push({
              id: `osm_bld_${el.id}`,
              x: cx,
              z: cz,
              width: bw,
              depth: bd,
              height: h,
              kind: h > 22 ? "skyscraper" : (["minimarket", "bengkel", "warung"] as const)[el.id % 3],
              rotation: 0,
            });
          }
        }
      }
    }

    const merged: MapLayoutData = {
      ...baseLayout,
      source: osmRoads.length > 0 ? "openstreetmap-live" : "local-cache",
      roads: osmRoads.length > 4 ? [...baseLayout.roads.slice(0, 3), ...osmRoads.slice(0, 48)] : baseLayout.roads,
      buildings: osmBuildings.length > 10 ? osmBuildings : baseLayout.buildings,
    };

    osmMemoryCache.set(regionId, merged);
    return merged;
  } catch {
    return baseLayout;
  }
}
