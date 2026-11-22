#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const OUT_PATH = path.join(process.cwd(), "src", "data", "jakarta-real-map.geojson");
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

function fetchJson(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "GTA-Indonesia-Vinsky-GeoJSON/2.0",
          Accept: "application/json",
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function elementsToFeatures(elements, corridorName, seenIds) {
  if (!Array.isArray(elements)) return [];
  const nodes = new Map();
  for (const el of elements) {
    if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
      nodes.set(el.id, [el.lon, el.lat]);
    }
  }

  const allowedHighways = new Set([
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "busway",
  ]);

  const features = [];
  for (const el of elements) {
    if (el.type !== "way" || !Array.isArray(el.nodes) || el.nodes.length < 2) continue;
    if (seenIds.has(el.id)) continue;

    const coords = el.nodes.map((id) => nodes.get(id)).filter(Boolean);
    if (coords.length < 2) continue;

    const hw = el.tags?.highway;
    if (hw && allowedHighways.has(hw)) {
      seenIds.add(el.id);
      features.push({
        type: "Feature",
        properties: {
          osm_id: el.id,
          corridor: corridorName,
          kind: "road",
          highway: hw,
          name: el.tags.name || "Jalan Protokol Jakarta",
          lanes: Number(el.tags.lanes) || (hw === "primary" || hw === "trunk" ? 4 : 2),
          bridge: el.tags.bridge === "yes" || hw.includes("motorway"),
          busway: hw === "busway" || el.tags.bus === "designated",
        },
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      });
    } else if (el.tags?.building && coords.length >= 3) {
      seenIds.add(el.id);
      const closed = [...coords];
      const first = closed[0];
      const last = closed[closed.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first);

      const levels = Number(el.tags["building:levels"]) || 0;
      const explicitHeight = Number(String(el.tags.height || "").replace(/[^0-9.]/g, "")) || 0;

      features.push({
        type: "Feature",
        properties: {
          osm_id: el.id,
          corridor: corridorName,
          kind: "building",
          name: el.tags.name || "Gedung Jakarta",
          levels,
          height: explicitHeight,
          building_type: el.tags.building,
        },
        geometry: {
          type: "Polygon",
          coordinates: [closed],
        },
      });
    }
  }
  return features;
}

function buildVerifiedLandmarks() {
  return [
    {
      type: "Feature",
      properties: { corridor: "sudirman-hi", kind: "landmark", name: "Bundaran HI & Monumen Selamat Datang", levels: 1 },
      geometry: { type: "Point", coordinates: [106.8230, -6.1949] },
    },
    {
      type: "Feature",
      properties: { corridor: "sudirman-hi", kind: "landmark", name: "Halte TransJakarta Bundaran HI Astra", levels: 1 },
      geometry: { type: "Point", coordinates: [106.8229, -6.1937] },
    },
    {
      type: "Feature",
      properties: { corridor: "sudirman-hi", kind: "landmark", name: "Simpang Susun Semanggi", levels: 2 },
      geometry: { type: "Point", coordinates: [106.8136, -6.2215] },
    },
  ];
}

async function main() {
  console.log("🗺️  Mengunduh data OpenStreetMap nyata koridor Jakarta (Bundaran HI – Sudirman – SCBD – Semanggi – Blok M – Pondok Indah)...");

  const boxes = [
    { corridor: "sudirman-hi", bbox: "106.820,-6.198,106.826,-6.192" },      // Bundaran HI
    { corridor: "sudirman-hi", bbox: "106.818,-6.210,106.824,-6.203" },      // Sudirman / Wisma 46
    { corridor: "sudirman-hi", bbox: "106.807,-6.227,106.815,-6.220" },      // Semanggi & SCBD
    { corridor: "pondokindah-blokm", bbox: "106.795,-6.247,106.801,-6.241" }, // Blok M
    { corridor: "pondokindah-blokm", bbox: "106.781,-6.268,106.787,-6.262" }, // Pondok Indah
  ];

  const seenIds = new Set();
  const osmFeatures = [];

  for (const box of boxes) {
    const url = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${box.bbox}`;
    const data = await fetchJson(url);
    const extracted = elementsToFeatures(data?.elements, box.corridor, seenIds);
    console.log(`  • ${box.corridor} (${box.bbox}): +${extracted.length} features`);
    osmFeatures.push(...extracted);
  }

  // Keep file size clean for Next.js static import (< 1 MB)
  const roads = osmFeatures.filter((f) => f.properties.kind === "road");
  const buildings = osmFeatures.filter((f) => f.properties.kind === "building").slice(0, 320);
  const allFeatures = [...buildVerifiedLandmarks(), ...roads, ...buildings];

  const geojson = {
    type: "FeatureCollection",
    name: "jakarta-real-map-osm",
    metadata: {
      source: "OpenStreetMap Live API v0.6 (Bundaran HI – Sudirman – SCBD – Semanggi – Blok M – Pondok Indah)",
      fetchedAt: new Date().toISOString(),
      roadCount: roads.length,
      buildingCount: buildings.length,
    },
    features: allFeatures,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(geojson));
  const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`✅ Tersimpan ke src/data/jakarta-real-map.geojson (${roads.length} jalan asli, ${buildings.length} bangunan asli, ${kb} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
