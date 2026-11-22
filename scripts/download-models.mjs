#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const CARS_DIR = path.join(ROOT, "public", "models", "cars");
const CITY_DIR = path.join(ROOT, "public", "models", "city");
const MAX_PUBLIC_MB = 25;

fs.mkdirSync(CARS_DIR, { recursive: true });
fs.mkdirSync(CITY_DIR, { recursive: true });

/**
 * Helper to build a valid binary glTF 2.0 (.glb) file from an array of colored box parts.
 * Each part: { name, size: [sx, sy, sz], offset: [ox, oy, oz], color: [r, g, b, a], metallic, roughness }
 */
function buildBoxPartsGLB(parts) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const nodes = [];
  const meshes = [];
  const materials = [];
  const accessors = [];
  const bufferViews = [];

  // Unit cube face data (24 verts, 36 indices)
  const faceDefs = [
    // +Z front
    { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    // -Z back
    { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    // +X right
    { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    // -X left
    { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    // +Y top
    { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    // -Y bottom
    { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  const faceUV = [[0, 0], [1, 0], [1, 1], [0, 1]];

  const binChunks = [];
  let byteOffset = 0;

  parts.forEach((part, idx) => {
    const [sx, sy, sz] = part.size;
    const [ox, oy, oz] = part.offset;

    const partPos = [];
    const partNorm = [];
    const partUv = [];
    const partIdx = [];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    faceDefs.forEach((f, fIdx) => {
      const baseVertex = fIdx * 4;
      f.v.forEach((pt, vIdx) => {
        const x = pt[0] * sx + ox;
        const y = pt[1] * sy + oy;
        const z = pt[2] * sz + oz;
        partPos.push(x, y, z);
        partNorm.push(f.n[0], f.n[1], f.n[2]);
        partUv.push(faceUV[vIdx][0], faceUV[vIdx][1]);

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;
      });
      partIdx.push(
        baseVertex + 0, baseVertex + 1, baseVertex + 2,
        baseVertex + 0, baseVertex + 2, baseVertex + 3
      );
    });

    const posBuf = Buffer.from(new Float32Array(partPos).buffer);
    const normBuf = Buffer.from(new Float32Array(partNorm).buffer);
    const uvBuf = Buffer.from(new Float32Array(partUv).buffer);
    const idxBuf = Buffer.from(new Uint16Array(partIdx).buffer);

    // Align helper (4-byte alignment)
    const addChunk = (buf, target) => {
      const pad = (4 - (buf.length % 4)) % 4;
      const padded = pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
      const bvIdx = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset,
        byteLength: buf.length,
        target,
      });
      binChunks.push(padded);
      byteOffset += padded.length;
      return bvIdx;
    };

    const posBV = addChunk(posBuf, 34962);
    const normBV = addChunk(normBuf, 34962);
    const uvBV = addChunk(uvBuf, 34962);
    const idxBV = addChunk(idxBuf, 34963);

    const posAcc = accessors.length;
    accessors.push({
      bufferView: posBV,
      componentType: 5126, // FLOAT
      count: 24,
      type: "VEC3",
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    });

    const normAcc = accessors.length;
    accessors.push({
      bufferView: normBV,
      componentType: 5126,
      count: 24,
      type: "VEC3",
    });

    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvBV,
      componentType: 5126,
      count: 24,
      type: "VEC2",
    });

    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxBV,
      componentType: 5123, // UNSIGNED_SHORT
      count: 36,
      type: "SCALAR",
    });

    const color = part.color ?? [0.8, 0.8, 0.8, 1.0];
    const isTransparent = color[3] < 0.99;

    materials.push({
      name: `${part.name}_mat`,
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: part.metallic ?? 0.4,
        roughnessFactor: part.roughness ?? 0.35,
      },
      ...(isTransparent ? { alphaMode: "BLEND" } : {}),
      ...(part.emissive ? { emissiveFactor: part.emissive } : {}),
    });

    meshes.push({
      name: part.name,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
            TEXCOORD_0: uvAcc,
          },
          indices: idxAcc,
          material: idx,
        },
      ],
    });

    nodes.push({
      name: part.name,
      mesh: idx,
    });
  });

  const gltf = {
    asset: {
      version: "2.0",
      generator: "GTA-Indonesia-Vinsky-AssetBuilder",
      copyright: "CC0 Public Domain",
    },
    scene: 0,
    scenes: [{ name: "Scene", nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonText = JSON.stringify(gltf);
  const jsonBufRaw = Buffer.from(jsonText, "utf8");
  const jsonPad = (4 - (jsonBufRaw.length % 4)) % 4;
  const jsonBuf = jsonPad > 0
    ? Buffer.concat([jsonBufRaw, Buffer.from(" ".repeat(jsonPad), "utf8")])
    : jsonBufRaw;

  const binBuf = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);          // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuf.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);
}

function downloadFile(url, destPath, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: { "User-Agent": "GTA-Indonesia-Vinsky-Setup/1.0" },
        timeout: timeoutMs,
      },
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
          // Validate GLB magic bytes if .glb
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

function createCarSpec(bodyColor, opts = {}) {
  const heightBody = opts.suv ? 0.72 : 0.54;
  const cabinHeight = opts.suv ? 0.62 : 0.48;
  const cabinLen = opts.suv ? 2.65 : 1.95;
  const cabinZ = opts.suv ? -0.15 : -0.22;
  const wheelY = 0.34;
  const wheelR = opts.suv ? 0.72 : 0.64;
  const parts = [
    // Main lower chassis
    {
      name: "chassis",
      size: [1.86, heightBody, 4.46],
      offset: [0, 0.36 + heightBody / 2, 0],
      color: bodyColor,
      metallic: 0.75,
      roughness: 0.22,
    },
    // Hood slope accent
    {
      name: "splitter",
      size: [1.9, 0.12, 0.4],
      offset: [0, 0.28, 2.15],
      color: [0.08, 0.08, 0.1, 1.0],
      metallic: 0.3,
      roughness: 0.5,
    },
    // Cabin greenhouse (semi-transparent glass)
    {
      name: "cabin_glass",
      size: [1.56, cabinHeight, cabinLen],
      offset: [0, 0.36 + heightBody + cabinHeight / 2 - 0.05, cabinZ],
      color: [0.15, 0.24, 0.35, 0.42],
      metallic: 0.9,
      roughness: 0.08,
    },
    // Roof panel
    {
      name: "roof",
      size: [1.46, 0.07, cabinLen - 0.22],
      offset: [0, 0.36 + heightBody + cabinHeight - 0.02, cabinZ],
      color: bodyColor,
      metallic: 0.78,
      roughness: 0.2,
    },
    // Headlights
    {
      name: "headlight_L",
      size: [0.34, 0.14, 0.08],
      offset: [-0.64, 0.56, 2.23],
      color: [1.0, 0.98, 0.85, 1.0],
      emissive: [0.9, 0.9, 0.75],
      metallic: 0.1,
      roughness: 0.1,
    },
    {
      name: "headlight_R",
      size: [0.34, 0.14, 0.08],
      offset: [0.64, 0.56, 2.23],
      color: [1.0, 0.98, 0.85, 1.0],
      emissive: [0.9, 0.9, 0.75],
      metallic: 0.1,
      roughness: 0.1,
    },
    // Taillights
    {
      name: "taillight_bar",
      size: [1.72, 0.12, 0.08],
      offset: [0, 0.62, -2.23],
      color: [0.95, 0.1, 0.12, 1.0],
      emissive: [0.85, 0.05, 0.05],
      metallic: 0.2,
      roughness: 0.2,
    },
    // 4 Wheels
    {
      name: "wheel_FL",
      size: [0.28, wheelR, wheelR],
      offset: [-0.88, wheelY, 1.38],
      color: [0.09, 0.09, 0.1, 1.0],
      metallic: 0.35,
      roughness: 0.7,
    },
    {
      name: "wheel_FR",
      size: [0.28, wheelR, wheelR],
      offset: [0.88, wheelY, 1.38],
      color: [0.09, 0.09, 0.1, 1.0],
      metallic: 0.35,
      roughness: 0.7,
    },
    {
      name: "wheel_RL",
      size: [0.28, wheelR, wheelR],
      offset: [-0.88, wheelY, -1.38],
      color: [0.09, 0.09, 0.1, 1.0],
      metallic: 0.35,
      roughness: 0.7,
    },
    {
      name: "wheel_RR",
      size: [0.28, wheelR, wheelR],
      offset: [0.88, wheelY, -1.38],
      color: [0.09, 0.09, 0.1, 1.0],
      metallic: 0.35,
      roughness: 0.7,
    },
  ];

  if (opts.spoiler) {
    parts.push({
      name: "rear_spoiler",
      size: [1.76, 0.08, 0.32],
      offset: [0, 0.36 + heightBody + 0.26, -2.05],
      color: [0.06, 0.06, 0.08, 1.0],
      metallic: 0.6,
      roughness: 0.25,
    });
  }

  if (opts.police) {
    parts.push({
      name: "siren_red",
      size: [0.55, 0.14, 0.24],
      offset: [-0.32, 0.36 + heightBody + cabinHeight + 0.07, cabinZ + 0.1],
      color: [1.0, 0.05, 0.1, 1.0],
      emissive: [0.9, 0.05, 0.05],
      metallic: 0.1,
      roughness: 0.15,
    });
    parts.push({
      name: "siren_blue",
      size: [0.55, 0.14, 0.24],
      offset: [0.32, 0.36 + heightBody + cabinHeight + 0.07, cabinZ + 0.1],
      color: [0.05, 0.35, 1.0, 1.0],
      emissive: [0.05, 0.35, 0.95],
      metallic: 0.1,
      roughness: 0.15,
    });
  }

  return parts;
}

async function main() {
  console.log("🚀 GTA Indonesia by Ahmad Alvin Griffin (Vinsky) - CC0 3D Asset Setup");

  // 1. Try downloading real CC0 Khronos glTF-Sample-Assets (.glb)
  const khronosTargets = [
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

  for (const item of khronosTargets) {
    process.stdout.write(`⏳ Mengunduh CC0 GLB (${item.name})... `);
    const ok = await downloadFile(item.url, item.dest);
    console.log(ok ? "✅ Berhasil" : "⚠️ Lewati (fallback lokal aktif)");
  }

  // 2. Generate valid binary glTF 2.0 (.glb) models for cars & city
  const generatedCars = {
    "sport.glb": createCarSpec([0.96, 0.18, 0.32, 1.0], { spoiler: true }),
    "supercar.glb": createCarSpec([1.0, 0.48, 0.08, 1.0], { spoiler: true }),
    "suv.glb": createCarSpec([0.15, 0.22, 0.3, 1.0], { suv: true }),
    "police.glb": createCarSpec([0.95, 0.97, 1.0, 1.0], { police: true }),
  };

  for (const [filename, spec] of Object.entries(generatedCars)) {
    const outPath = path.join(CARS_DIR, filename);
    fs.writeFileSync(outPath, buildBoxPartsGLB(spec));
    console.log(`✅ Generated car GLB: public/models/cars/${filename}`);
  }

  const generatedCity = {
    "skyscraper.glb": [
      { name: "podium", size: [18, 6, 18], offset: [0, 3, 0], color: [0.22, 0.25, 0.3, 1], metallic: 0.4, roughness: 0.5 },
      { name: "tower", size: [13, 42, 13], offset: [0, 27, 0], color: [0.14, 0.26, 0.38, 1], metallic: 0.85, roughness: 0.15 },
      { name: "crown", size: [10, 4, 10], offset: [0, 50, 0], color: [0.95, 0.35, 0.65, 1], emissive: [0.4, 0.1, 0.25], metallic: 0.7, roughness: 0.2 },
    ],
    "ruko.glb": [
      { name: "ground_floor", size: [10, 4, 9], offset: [0, 2, 0], color: [0.85, 0.82, 0.75, 1], metallic: 0.1, roughness: 0.8 },
      { name: "upper_floor", size: [10, 4, 9], offset: [0, 6, 0], color: [0.78, 0.76, 0.72, 1], metallic: 0.1, roughness: 0.75 },
      { name: "awning", size: [10.4, 0.35, 2.2], offset: [0, 3.6, 5.2], color: [0.88, 0.15, 0.2, 1], metallic: 0.2, roughness: 0.5 },
    ],
    "streetlight.glb": [
      { name: "pole", size: [0.18, 7.5, 0.18], offset: [0, 3.75, 0], color: [0.25, 0.28, 0.32, 1], metallic: 0.8, roughness: 0.35 },
      { name: "arm", size: [0.14, 0.14, 2.0], offset: [0, 7.4, 0.9], color: [0.25, 0.28, 0.32, 1], metallic: 0.8, roughness: 0.35 },
      { name: "lamp", size: [0.35, 0.16, 0.6], offset: [0, 7.3, 1.8], color: [1.0, 0.94, 0.76, 1], emissive: [0.95, 0.85, 0.5], metallic: 0.2, roughness: 0.2 },
    ],
  };

  for (const [filename, spec] of Object.entries(generatedCity)) {
    const outPath = path.join(CITY_DIR, filename);
    fs.writeFileSync(outPath, buildBoxPartsGLB(spec));
    console.log(`✅ Generated city GLB: public/models/city/${filename}`);
  }

  // 3. Remove any raw .zip files inside public/ if present
  let removedZips = 0;
  function walkAndClean(dir) {
    if (!fs.existsSync(dir)) return 0;
    let totalBytes = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        totalBytes += walkAndClean(fullPath);
      } else if (entry.name.toLowerCase().endsWith(".zip")) {
        fs.unlinkSync(fullPath);
        removedZips++;
      } else {
        totalBytes += fs.statSync(fullPath).size;
      }
    }
    return totalBytes;
  }

  const publicBytes = walkAndClean(path.join(ROOT, "public"));
  const publicMB = publicBytes / (1024 * 1024);

  console.log(`🧹 File .zip dihapus: ${removedZips}`);
  console.log(`📦 Total ukuran public/: ${publicMB.toFixed(3)} MB (Batas Vercel < ${MAX_PUBLIC_MB} MB)`);

  if (publicMB >= MAX_PUBLIC_MB) {
    console.error("❌ Total public/ melebihi 25 MB!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Asset setup error:", err);
  process.exit(1);
});
