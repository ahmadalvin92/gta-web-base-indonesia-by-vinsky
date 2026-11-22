#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const CARS_DIR = path.join(ROOT, "public", "models", "cars");
const CITY_DIR = path.join(ROOT, "public", "models", "city");
const MAX_PUBLIC_MB = 85;

fs.mkdirSync(CARS_DIR, { recursive: true });
fs.mkdirSync(CITY_DIR, { recursive: true });

/**
 * Generates a contoured extruded 3D mesh (from 2D side profile XY extruded along width Z, then centered)
 * or box parts into a valid binary glTF 2.0 (.glb) file loadable by Three.js GLTFLoader.
 */
function buildProfileExtrudeParts(profilePts, width, yOffset, color, name, metallic = 0.78, roughness = 0.2) {
  // Build side-profile prism extruded across X in [-width/2, +width/2]
  // profilePts: array of [z, y] in counter-clockwise order
  const halfW = width / 2;
  const n = profilePts.length;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  // Fan triangulation for left (-X) and right (+X) caps
  // Right cap (+X)
  const baseR = 0;
  for (let i = 0; i < n; i++) {
    positions.push(halfW, profilePts[i][1] + yOffset, profilePts[i][0]);
    normals.push(1, 0, 0);
    uvs.push((profilePts[i][0] + 2.5) / 5, (profilePts[i][1] + 1) / 2);
  }
  for (let i = 1; i < n - 1; i++) {
    indices.push(baseR, baseR + i, baseR + i + 1);
  }

  // Left cap (-X)
  const baseL = positions.length / 3;
  for (let i = 0; i < n; i++) {
    positions.push(-halfW, profilePts[i][1] + yOffset, profilePts[i][0]);
    normals.push(-1, 0, 0);
    uvs.push((profilePts[i][0] + 2.5) / 5, (profilePts[i][1] + 1) / 2);
  }
  for (let i = 1; i < n - 1; i++) {
    indices.push(baseL, baseL + i + 1, baseL + i);
  }

  // Side quads along perimeter
  for (let i = 0; i < n; i++) {
    const a = profilePts[i];
    const b = profilePts[(i + 1) % n];
    const dz = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dz, dy) || 1;
    const ny = dz / len;
    const nz = -dy / len;

    const vIdx = positions.length / 3;
    positions.push(
      -halfW, a[1] + yOffset, a[0],
      halfW, a[1] + yOffset, a[0],
      halfW, b[1] + yOffset, b[0],
      -halfW, b[1] + yOffset, b[0]
    );
    for (let k = 0; k < 4; k++) {
      normals.push(0, ny, nz);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(vIdx, vIdx + 1, vIdx + 2, vIdx, vIdx + 2, vIdx + 3);
  }

  return {
    name,
    positions,
    normals,
    uvs,
    indices,
    color,
    metallic,
    roughness,
  };
}

function makeBoxPart(name, size, offset, color, metallic = 0.4, roughness = 0.4, emissive = null) {
  const [sx, sy, sz] = size;
  const [ox, oy, oz] = offset;
  const faceDefs = [
    { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  const faceUV = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  faceDefs.forEach((f, fIdx) => {
    const baseVertex = fIdx * 4;
    f.v.forEach((pt, vIdx) => {
      positions.push(pt[0] * sx + ox, pt[1] * sy + oy, pt[2] * sz + oz);
      normals.push(f.n[0], f.n[1], f.n[2]);
      uvs.push(faceUV[vIdx][0], faceUV[vIdx][1]);
    });
    indices.push(baseVertex, baseVertex + 1, baseVertex + 2, baseVertex, baseVertex + 2, baseVertex + 3);
  });

  return { name, positions, normals, uvs, indices, color, metallic, roughness, emissive };
}

function buildGLBFromGeometryParts(parts) {
  const nodes = [];
  const meshes = [];
  const materials = [];
  const accessors = [];
  const bufferViews = [];
  const binChunks = [];
  let byteOffset = 0;

  parts.forEach((part, idx) => {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < part.positions.length; i += 3) {
      const x = part.positions[i];
      const y = part.positions[i + 1];
      const z = part.positions[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    const posBuf = Buffer.from(new Float32Array(part.positions).buffer);
    const normBuf = Buffer.from(new Float32Array(part.normals).buffer);
    const uvBuf = Buffer.from(new Float32Array(part.uvs).buffer);
    const idxBuf = Buffer.from(new Uint16Array(part.indices).buffer);

    const addChunk = (buf, target) => {
      const pad = (4 - (buf.length % 4)) % 4;
      const padded = pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
      const bvIdx = bufferViews.length;
      bufferViews.push({ buffer: 0, byteOffset, byteLength: buf.length, target });
      binChunks.push(padded);
      byteOffset += padded.length;
      return bvIdx;
    };

    const posBV = addChunk(posBuf, 34962);
    const normBV = addChunk(normBuf, 34962);
    const uvBV = addChunk(uvBuf, 34962);
    const idxBV = addChunk(idxBuf, 34963);

    const vCount = part.positions.length / 3;
    const posAcc = accessors.length;
    accessors.push({ bufferView: posBV, componentType: 5126, count: vCount, type: "VEC3", min: [minX, minY, minZ], max: [maxX, maxY, maxZ] });
    const normAcc = accessors.length;
    accessors.push({ bufferView: normBV, componentType: 5126, count: vCount, type: "VEC3" });
    const uvAcc = accessors.length;
    accessors.push({ bufferView: uvBV, componentType: 5126, count: vCount, type: "VEC2" });
    const idxAcc = accessors.length;
    accessors.push({ bufferView: idxBV, componentType: 5123, count: part.indices.length, type: "SCALAR" });

    const color = part.color ?? [0.8, 0.8, 0.8, 1.0];
    const isTransparent = color[3] < 0.99;

    materials.push({
      name: `${part.name}_mat`,
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: part.metallic ?? 0.5,
        roughnessFactor: part.roughness ?? 0.3,
      },
      ...(isTransparent ? { alphaMode: "BLEND" } : {}),
      ...(part.emissive ? { emissiveFactor: part.emissive } : {}),
    });

    meshes.push({
      name: part.name,
      primitives: [{ attributes: { POSITION: posAcc, NORMAL: normAcc, TEXCOORD_0: uvAcc }, indices: idxAcc, material: idx }],
    });
    nodes.push({ name: part.name, mesh: idx });
  });

  const gltf = {
    asset: { version: "2.0", generator: "GTA-Indonesia-Vinsky-HighDetailBuilder", copyright: "CC0 Public Domain" },
    scene: 0,
    scenes: [{ name: "Scene", nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonRaw = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
  const jsonBuf = jsonPad > 0 ? Buffer.concat([jsonRaw, Buffer.from(" ".repeat(jsonPad), "utf8")]) : jsonRaw;
  const binBuf = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuf.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);
}

function downloadFile(url, destPath, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { headers: { "User-Agent": "GTA-Indonesia-Vinsky-Setup/2.0" }, timeout: timeoutMs },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          downloadFile(res.headers.location, destPath, timeoutMs).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          resolve(false);
          return;
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (buf.length > 12 && buf.readUInt32LE(0) === 0x46546c67) {
            fs.writeFileSync(destPath, buf);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createCurvedCarParts(style, bodyColor, opts = {}) {
  const parts = [];
  if (style === "mpv") {
    // Avanza / Innova aerodynamic MPV silhouette
    const bodyProfile = [
      [-2.2, 0.25], [2.2, 0.25], [2.26, 0.65], [1.98, 0.92],
      [1.22, 1.02], [0.55, 1.56], [-1.72, 1.58], [-2.18, 1.1], [-2.25, 0.65]
    ];
    parts.push(buildProfileExtrudeParts(bodyProfile, 1.82, 0, bodyColor, "mpv_body", 0.78, 0.2));
    // Tinted glass greenhouse
    const glassProfile = [
      [1.12, 0.98], [0.56, 1.48], [-1.62, 1.48], [-1.96, 1.02]
    ];
    parts.push(buildProfileExtrudeParts(glassProfile, 1.68, 0, [0.06, 0.1, 0.16, 0.42], "cabin_glass", 0.9, 0.08));
  } else if (style === "bus") {
    const busProfile = [
      [-4.8, 0.35], [4.8, 0.35], [4.88, 1.4], [4.68, 2.95], [-4.72, 2.98], [-4.86, 1.3]
    ];
    parts.push(buildProfileExtrudeParts(busProfile, 2.4, 0, bodyColor, "bus_body", 0.6, 0.3));
    parts.push(makeBoxPart("bus_glass", [2.44, 1.05, 8.9], [0, 2.05, 0.05], [0.07, 0.12, 0.18, 0.45], 0.9, 0.08));
  } else {
    // Aerodynamic Sedan / Mercy / BMW / Civic / Supercar
    const roofH = style === "supercar" ? 1.18 : 1.36;
    const bodyProfile = [
      [-2.22, 0.24], [2.22, 0.24], [2.28, 0.56], [1.98, 0.84],
      [1.05, 0.92], [0.35, roofH], [-0.95, roofH], [-1.75, 0.94],
      [-2.22, 0.88], [-2.26, 0.52]
    ];
    parts.push(buildProfileExtrudeParts(bodyProfile, 1.88, 0, bodyColor, "sedan_body", 0.84, 0.16));
    const glassProfile = [
      [0.98, 0.9], [0.38, roofH - 0.05], [-0.92, roofH - 0.05], [-1.62, 0.92]
    ];
    parts.push(buildProfileExtrudeParts(glassProfile, 1.66, 0, [0.06, 0.09, 0.14, 0.42], "cabin_glass", 0.92, 0.06));
  }

  // Wheels + calipers
  const wheelZ = style === "bus" ? 2.8 : 1.4;
  const wheelX = style === "bus" ? 1.12 : 0.88;
  const wheelY = style === "bus" ? 0.46 : 0.34;
  const wheelR = style === "bus" ? 0.86 : 0.64;

  [
    [-wheelX, wheelY, wheelZ],
    [wheelX, wheelY, wheelZ],
    [-wheelX, wheelY, -wheelZ],
    [wheelX, wheelY, -wheelZ],
  ].forEach(([wx, wy, wz], idx) => {
    parts.push(makeBoxPart(`wheel_${idx}`, [0.28, wheelR, wheelR], [wx, wy, wz], [0.08, 0.08, 0.1, 1], 0.3, 0.7));
  });

  // LED Headlights & Taillights
  const zEnd = style === "bus" ? 4.86 : 2.25;
  parts.push(makeBoxPart("headlight_L", [0.36, 0.12, 0.08], [-0.65, 0.62, zEnd], [1, 1, 1, 1], 0.1, 0.1, [0.95, 0.95, 1.0]));
  parts.push(makeBoxPart("headlight_R", [0.36, 0.12, 0.08], [0.65, 0.62, zEnd], [1, 1, 1, 1], 0.1, 0.1, [0.95, 0.95, 1.0]));
  parts.push(makeBoxPart("taillight", [1.7, 0.12, 0.08], [0, 0.72, -zEnd], [0.95, 0.08, 0.1, 1], 0.1, 0.1, [0.9, 0.06, 0.08]));

  if (opts.spoiler) {
    parts.push(makeBoxPart("spoiler", [1.74, 0.07, 0.28], [0, 1.16, -2.04], [0.06, 0.06, 0.08, 1], 0.7, 0.2));
  }
  if (opts.police) {
    parts.push(makeBoxPart("siren_red", [0.55, 0.13, 0.24], [-0.32, 1.44, -0.15], [1, 0.05, 0.1, 1], 0.1, 0.1, [1, 0.05, 0.1]));
    parts.push(makeBoxPart("siren_blue", [0.55, 0.13, 0.24], [0.32, 1.44, -0.15], [0.05, 0.35, 1, 1], 0.1, 0.1, [0.05, 0.35, 1]));
  }
  if (opts.taxi) {
    parts.push(makeBoxPart("taxi_lamp", [0.48, 0.15, 0.22], [0, 1.43, -0.1], [1, 0.85, 0.1, 1], 0.2, 0.2, [0.9, 0.7, 0.1]));
  }
  return parts;
}

async function main() {
  console.log("🚗 GTA Indonesia by Ahmad Alvin Griffin (Vinsky) — Download & Build Aset 3D Mobil Jakarta");

  // Download CC0 Khronos sample models if reachable
  const externalCC0 = [
    {
      name: "milk_truck_cc0.glb",
      url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
      dest: path.join(CARS_DIR, "milk_truck_cc0.glb"),
    },
    {
      name: "box_textured_cc0.glb",
      url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxTextured/glTF-Binary/BoxTextured.glb",
      dest: path.join(CITY_DIR, "box_textured_cc0.glb"),
    },
  ];
  for (const item of externalCC0) {
    const ok = await downloadFile(item.url, item.dest);
    console.log(`  • ${item.name}: ${ok ? "✅ Unduh CC0 berhasil" : "⚠️ Menggunakan cache lokal"}`);
  }

  // Generate curved high-detail Indonesian & European street car .glb files
  const carModels = {
    "avanza.glb": createCurvedCarParts("mpv", [0.85, 0.87, 0.9, 1.0]),
    "innova.glb": createCurvedCarParts("mpv", [0.12, 0.14, 0.18, 1.0]),
    "mercy.glb": createCurvedCarParts("sedan", [0.76, 0.79, 0.84, 1.0]),
    "bmw.glb": createCurvedCarParts("sedan", [0.08, 0.32, 0.78, 1.0], { spoiler: true }),
    "civic.glb": createCurvedCarParts("sedan", [0.96, 0.97, 0.98, 1.0], { spoiler: true }),
    "bluebird.glb": createCurvedCarParts("sedan", [0.06, 0.45, 0.92, 1.0], { taxi: true }),
    "transjakarta.glb": createCurvedCarParts("bus", [0.02, 0.52, 0.82, 1.0]),
    "angkot.glb": createCurvedCarParts("mpv", [0.04, 0.68, 0.85, 1.0]),
    "police.glb": createCurvedCarParts("sedan", [0.95, 0.97, 1.0, 1.0], { police: true }),
    "supercar.glb": createCurvedCarParts("supercar", [1.0, 0.38, 0.05, 1.0], { spoiler: true }),
    "sport.glb": createCurvedCarParts("supercar", [0.88, 0.11, 0.28, 1.0], { spoiler: true }),
    "suv.glb": createCurvedCarParts("mpv", [0.18, 0.22, 0.28, 1.0]),
  };

  for (const [filename, parts] of Object.entries(carModels)) {
    fs.writeFileSync(path.join(CARS_DIR, filename), buildGLBFromGeometryParts(parts));
    console.log(`  ✅ Generated curved GLB: public/models/cars/${filename}`);
  }

  // City GLB models
  const cityModels = {
    "skyscraper.glb": [
      makeBoxPart("podium", [18, 6, 18], [0, 3, 0], [0.22, 0.25, 0.3, 1], 0.4, 0.5),
      makeBoxPart("tower", [13, 44, 13], [0, 28, 0], [0.14, 0.26, 0.38, 1], 0.85, 0.15),
    ],
    "ruko.glb": [
      makeBoxPart("ground_floor", [10, 4, 9], [0, 2, 0], [0.88, 0.85, 0.8, 1], 0.1, 0.7),
      makeBoxPart("upper_floors", [10, 7, 9], [0, 7.5, 0], [0.8, 0.78, 0.74, 1], 0.1, 0.75),
    ],
    "streetlight.glb": [
      makeBoxPart("pole", [0.18, 7.5, 0.18], [0, 3.75, 0], [0.25, 0.28, 0.32, 1], 0.8, 0.35),
      makeBoxPart("lamp", [0.35, 0.16, 0.6], [0, 7.4, 0.9], [1, 0.94, 0.76, 1], 0.2, 0.2, [0.95, 0.85, 0.5]),
    ],
  };

  for (const [filename, parts] of Object.entries(cityModels)) {
    fs.writeFileSync(path.join(CITY_DIR, filename), buildGLBFromGeometryParts(parts));
  }

  // Clean .zip files & measure public/ size
  let totalBytes = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fp);
      else if (entry.name.toLowerCase().endsWith(".zip")) fs.unlinkSync(fp);
      else totalBytes += fs.statSync(fp).size;
    }
  }
  walk(path.join(ROOT, "public"));
  const mb = totalBytes / (1024 * 1024);
  console.log(`📦 Total ukuran public/: ${mb.toFixed(3)} MB (Batas < ${MAX_PUBLIC_MB} MB)`);
  if (mb >= MAX_PUBLIC_MB) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
