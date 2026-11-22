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
}

export const JABODETABEK_REGIONS: JabodetabekRegion[] = [
  {
    id: "jakpus",
    areaLabel: "Jakarta Pusat",
    title: "Bundaran HI & Sudirman–SCBD",
    subtitle:
      "Peta nyata OSM Jakarta (.GeoJSON): Monumen Selamat Datang, Halte TransJakarta Kapal Pesiar, & Simpang Susun Semanggi.",
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
      "Boulevard lebar ala luar negeri, ideal untuk top-speed supercar, BMW M4 & drift.",
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

/**
 * Extracts real OpenStreetMap road & building coordinates from src/data/jakarta-real-map.geojson
 * and combines them with Jakarta landmarks, dense 3-story rukos, Halte TransJakarta, JPO & SPBU.
 */
export function getLocalCachedMapLayout(regionId: JabodetabekRegionId): MapLayoutData {
  const region = getRegionById(regionId);
  const roads: RoadSegmentData[] = [];
  const buildings: BuildingFootprintData[] = [];

  const spbuStations: SpbuStationData[] = [
    { id: "spbu_north", x: 34, z: -85, name: "SPBU Pertamina 34.101 Pasti Pas" },
    { id: "spbu_south", x: -34, z: 95, name: "SPBU Pertamina Pertamax Turbo" },
  ];

  // Always provide clean central avenues soBundaran HI / main spawn plaza and AI traffic paths stay reliable
  roads.push(
    {
      id: "main_ns",
      points: [
        [0, -360],
        [0, 360],
      ],
      width: 24,
      name: region.id === "jakpus" ? "Jl. M.H. Thamrin – Jl. Jend. Sudirman" : "Boulevard Utama Jakarta",
    },
    {
      id: "main_ew",
      points: [
        [-360, 0],
        [360, 0],
      ],
      width: 22,
      name: region.id === "jakpus" ? "Jl. Kebon Kacang – Jl. Sutan Sjahrir" : "Jl. Arteri Raya",
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
      name: "Koridor 1 Busway TransJakarta",
      isBusway: true,
    });
  }

  // Grid avenues & collector streets
  const gridOffsets = [-240, -150, -90, 90, 150, 240];
  gridOffsets.forEach((offset, i) => {
    roads.push({
      id: `grid_ns_${i}`,
      points: [
        [offset, -320],
        [offset, 320],
      ],
      width: 14,
      name: `Jl. Distrik ${i + 1}`,
    });
    roads.push({
      id: `grid_ew_${i}`,
      points: [
        [-320, offset],
        [320, offset],
      ],
      width: 14,
      name: `Jl. Penghubung ${i + 1}`,
    });
  });

  // Simpang Susun Semanggi / Tol Layang Jasa Marga
  roads.push({
    id: "flyover_tol",
    points: [
      [-320, -150],
      [-120, -150],
      [120, -150],
      [320, -150],
    ],
    width: 16,
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
      name: "Lintasan Sirkuit Sentul",
    });
  }

  let usedGeoJson = false;
  if (regionId === "jakpus" || regionId === "jaksel") {
    const fc = jakartaRealGeoJson as { features?: GeoJsonFeature[] };
    const features = Array.isArray(fc?.features) ? fc.features : [];
    const targetCorridor = regionId === "jakpus" ? "sudirman-hi" : "pondokindah-blokm";

    for (const feat of features) {
      if (feat.properties?.corridor !== targetCorridor) continue;

      if (
        feat.properties?.kind === "road" &&
        feat.geometry?.type === "LineString" &&
        Array.isArray(feat.geometry.coordinates)
      ) {
        const pts: Array<[number, number]> = [];
        for (const c of feat.geometry.coordinates as Array<[number, number]>) {
          const p = gpsToWorld(c[1], c[0], region);
          if (Math.abs(p.x) < 420 && Math.abs(p.z) < 420) {
            pts.push([p.x, p.z]);
          }
        }
        if (pts.length >= 2) {
          usedGeoJson = true;
          const lanes = feat.properties.lanes || 3;
          roads.push({
            id: `geojson_road_${feat.properties.osm_id || roads.length}`,
            points: pts,
            width: Math.min(20, Math.max(8, lanes * 3.5)),
            name: feat.properties.name || "Jl. Jakarta (GeoJSON)",
            isBusway: Boolean(feat.properties.busway),
            isFlyover: Boolean(feat.properties.bridge),
            elevation: feat.properties.bridge ? 8.5 : 0,
          });
        }
      } else if (
        feat.properties?.kind === "building" &&
        feat.geometry?.type === "Polygon" &&
        Array.isArray(feat.geometry.coordinates) &&
        buildings.length < 130
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
        // Keep central Bundaran HI roundabout & main N-S/E-W lanes clear
        if (
          Math.hypot(cx, cz) < 38 ||
          Math.abs(cx) < 20 ||
          Math.abs(cz) < 20 ||
          Math.abs(cx) > 360 ||
          Math.abs(cz) > 360
        ) {
          continue;
        }
        const bw = Math.min(Math.max(maxX - minX, 10), 42);
        const bd = Math.min(Math.max(maxZ - minZ, 10), 42);
        const levels = feat.properties.levels || 0;
        const explicitH = feat.properties.height || 0;
        const h =
          explicitH > 0
            ? Math.min(explicitH, 95)
            : levels > 0
            ? Math.min(levels * 4.2, 90)
            : 14 + (buildings.length % 6) * 8;

        usedGeoJson = true;
        buildings.push({
          id: `geojson_bld_${feat.properties.osm_id || buildings.length}`,
          x: cx,
          z: cz,
          width: bw,
          depth: bd,
          height: h,
          kind:
            h > 26
              ? "skyscraper"
              : (["minimarket", "bengkel", "warung"] as const)[buildings.length % 3],
          rotation: 0,
        });
      }
    }
  }

  // Dense Jakarta 3-story Rukos & Skyscrapers along arterial corridors
  const rukoTypes: Array<"minimarket" | "bengkel" | "warung"> = [
    "minimarket",
    "bengkel",
    "warung",
  ];
  const blockCenters = [-195, -120, -45, 45, 120, 195];
  let bIdx = 0;

  for (const bx of blockCenters) {
    for (const bz of blockCenters) {
      if (Math.abs(bx) < 42 && Math.abs(bz) < 42) continue;
      if (region.hasWaterZone && bx > 150) continue;
      if (
        (Math.abs(bx - 34) < 26 && Math.abs(bz + 85) < 26) ||
        (Math.abs(bx + 34) < 26 && Math.abs(bz - 95) < 26)
      ) {
        continue;
      }

      const seed = (Math.abs(bx * 7 + bz * 13) + bIdx) % 10;
      const isCore = Math.abs(bx) < 120 && Math.abs(bz) < 120;
      const kind: BuildingFootprintData["kind"] =
        isCore && seed > 3
          ? "skyscraper"
          : seed === 1
          ? "mall"
          : rukoTypes[bIdx % 3];

      const height =
        kind === "skyscraper"
          ? 34 + ((seed * 11) % 62)
          : kind === "mall"
          ? 20
          : 11.5; // 3-story Indonesian Ruko

      buildings.push({
        id: `jkt_block_${bIdx++}`,
        x: bx,
        z: bz,
        width: kind === "skyscraper" ? 24 + (seed % 10) : 16,
        depth: kind === "skyscraper" ? 24 + ((seed * 3) % 10) : 15,
        height,
        kind,
        rotation: 0,
      });
    }
  }

  // Extra dense row of 3-story Ruko flanking Jl. Jend. Sudirman / Boulevard sides
  [-58, -32, 32, 58, 118, -118].forEach((rz, idx) => {
    [-25, 25].forEach((rx) => {
      if (Math.abs(rx - 34) < 16 && Math.abs(rz + 85) < 16) return;
      if (Math.abs(rx + 34) < 16 && Math.abs(rz - 95) < 16) return;
      buildings.push({
        id: `ruko_row_${idx}_${rx}`,
        x: rx,
        z: rz,
        width: 12,
        depth: 13,
        height: 11.8,
        kind: rukoTypes[(idx + (rx > 0 ? 1 : 0)) % 3],
        rotation: 0,
      });
    });
  });

  const tollSigns = [
    { x: 0, z: -68, rotation: 0, label: region.tollLabel },
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
        { x: -4.5, z: -52, label: "Bundaran HI" },
        { x: -4.5, z: 54, label: "Tosari / SCBD" },
      ]
    : [];

  const jpoLocations = [
    { x: 0, z: 42, rotation: 0 },
    { x: 0, z: -116, rotation: 0 },
  ];

  return {
    region,
    source: usedGeoJson ? "jakarta-geojson" : "local-cache",
    roads: roads.slice(0, 90),
    buildings: buildings.slice(0, 140),
    spbuStations,
    tollSigns,
    waterZones,
    trafficLights,
    halteLocations,
    jpoLocations,
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
          ? [...baseLayout.roads.slice(0, 4), ...osmRoads.slice(0, 45)]
          : baseLayout.roads,
    };
    osmMemoryCache.set(regionId, merged);
    return merged;
  } catch {
    return baseLayout;
  }
}
