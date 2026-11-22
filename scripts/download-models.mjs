#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const CARS_DIR = path.join(ROOT, "public", "models", "cars");
const CHAR_DIR = path.join(ROOT, "public", "models", "characters");
const CITY_DIR = path.join(ROOT, "public", "models", "city");
const MAX_PUBLIC_MB = 85;

[CARS_DIR, CHAR_DIR, CITY_DIR].forEach((d) => fs.mkdirSync(d, { recursive: true }));

function downloadBinary(url, destPath, timeoutMs = 45000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: { "User-Agent": "GTA-Indonesia-Vinsky-HighPoly/4.0" },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          downloadBinary(res.headers.location, destPath, timeoutMs).then(resolve);
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
          if (buf.length < 1000) {
            resolve(false);
            return;
          }
          fs.writeFileSync(destPath, buf);
          resolve(true);
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

async function fetchBatch(items, concurrency = 4) {
  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (item) => {
        const ok = await downloadBinary(item.url, item.dest);
        const mb = ok ? (fs.statSync(item.dest).size / (1024 * 1024)).toFixed(2) : "0";
        console.log(`  ${ok ? "✅" : "⚠️"} ${path.relative(ROOT, item.dest)} (${mb} MB)`);
      })
    );
  }
}

async function main() {
  console.log("🏎️  GTA Indonesia by Ahmad Alvin Griffin (Vinsky) — Mengunduh Model Mobil High-Poly Realistis (.GLB)...");

  const marketBase = "https://raw.githubusercontent.com/jiaxiantao/3d-car-viewing/main/public/models/market";
  const showroomBase = "https://raw.githubusercontent.com/DevYon4s/3d-carshowroom/main/public/models";
  const sketchbookBase = "https://raw.githubusercontent.com/swift502/Sketchbook/master/build/assets";
  const threeBase = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf";
  const lowpolyCityBase = "https://raw.githubusercontent.com/kayquer/kit-cidade-lowpoly/main/models";

  const downloads = [
    // High-Poly Realistic Cars
    { url: `${marketBase}/2025_mercedes-benz_g-class_amg_g_63.glb`, dest: path.join(CARS_DIR, "mercy_g63.glb") },
    { url: `${marketBase}/2024_xiaomi_su7_max.glb`, dest: path.join(CARS_DIR, "su7.glb") },
    { url: `${marketBase}/sedan-mainstream.glb`, dest: path.join(CARS_DIR, "sedan_real.glb") },
    { url: `${marketBase}/suv-mainstream.glb`, dest: path.join(CARS_DIR, "suv_real.glb") },
    { url: `${threeBase}/ferrari.glb`, dest: path.join(CARS_DIR, "supercar.glb") },
    { url: `${showroomBase}/yellow_lambo.glb`, dest: path.join(CARS_DIR, "lambo.glb") },
    { url: `${showroomBase}/80s_Car.glb`, dest: path.join(CARS_DIR, "jdm.glb") },
    { url: `${showroomBase}/white_suv.glb`, dest: path.join(CARS_DIR, "white_suv.glb") },
    { url: `${showroomBase}/police.glb`, dest: path.join(CARS_DIR, "police.glb") },
    { url: `${sketchbookBase}/car.glb`, dest: path.join(CARS_DIR, "car_sb.glb") },
    { url: `${sketchbookBase}/airplane.glb`, dest: path.join(CARS_DIR, "airplane.glb") },
    { url: `${sketchbookBase}/heli.glb`, dest: path.join(CARS_DIR, "heli.glb") },
    { url: `${lowpolyCityBase}/veiculos/onibus.glb`, dest: path.join(CARS_DIR, "transjakarta.glb") },

    // Casual Streetwear Human & Plaza Character
    { url: `${threeBase}/readyplayer.me.glb`, dest: path.join(CHAR_DIR, "casual_human.glb") },
    { url: `${threeBase}/Michelle.glb`, dest: path.join(CHAR_DIR, "Michelle.glb") },
  ];

  await fetchBatch(downloads, 4);

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
  console.log(`📦 Total ukuran public/: ${mb.toFixed(2)} MB (Batas Vercel < ${MAX_PUBLIC_MB} MB)`);
  if (mb >= MAX_PUBLIC_MB) {
    console.error("❌ Total public/ melebihi 85 MB!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
