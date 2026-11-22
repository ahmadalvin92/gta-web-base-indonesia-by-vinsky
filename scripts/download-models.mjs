#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const CARS_DIR = path.join(ROOT, "public", "models", "cars");
const CARS_TEX_DIR = path.join(CARS_DIR, "Textures");
const CHAR_DIR = path.join(ROOT, "public", "models", "characters");
const CITY_DIR = path.join(ROOT, "public", "models", "city");
const CITY_TEX_DIR = path.join(CITY_DIR, "Textures");
const MAX_PUBLIC_MB = 85;

[CARS_DIR, CARS_TEX_DIR, CHAR_DIR, CITY_DIR, CITY_TEX_DIR].forEach((d) =>
  fs.mkdirSync(d, { recursive: true })
);

function downloadBinary(url, destPath, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: { "User-Agent": "GTA-Indonesia-Vinsky-RealGLB/3.0" },
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
          if (buf.length < 100) {
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

async function fetchBatch(items, concurrency = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const res = await Promise.all(
      slice.map(async (item) => {
        const ok = await downloadBinary(item.url, item.dest);
        if (ok && item.aliases) {
          for (const aliasDest of item.aliases) {
            fs.copyFileSync(item.dest, aliasDest);
          }
        }
        const kb = ok ? (fs.statSync(item.dest).size / 1024).toFixed(1) : "0";
        console.log(`  ${ok ? "✅" : "⚠️"} ${path.relative(ROOT, item.dest)} (${kb} KB)`);
        return ok;
      })
    );
    results.push(...res);
  }
  return results;
}

async function main() {
  console.log("🎮 GTA Indonesia (RenderWare GTA SA Engine) — Mengunduh 35+ Model 3D .GLB Asli...");

  const kenneyCarsBase =
    "https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format";
  const kenneyCityBase =
    "https://raw.githubusercontent.com/KenneyNL/Starter-Kit-City-Builder/main/models";
  const lowpolyCityBase =
    "https://raw.githubusercontent.com/kayquer/kit-cidade-lowpoly/main/models";
  const threeBase =
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf";

  const downloads = [
    // 1. Rigged Human Characters (Player + Pedestrians)
    {
      url: `${threeBase}/Soldier.glb`,
      dest: path.join(CHAR_DIR, "Soldier.glb"),
    },
    {
      url: `${threeBase}/Michelle.glb`,
      dest: path.join(CHAR_DIR, "Michelle.glb"),
    },

    // 2. Real 3D Vehicles + Colormap
    {
      url: `${kenneyCarsBase}/Textures/colormap.png`,
      dest: path.join(CARS_TEX_DIR, "colormap.png"),
    },
    {
      url: `${threeBase}/ferrari.glb`,
      dest: path.join(CARS_DIR, "supercar.glb"),
    },
    {
      url: `${kenneyCarsBase}/suv.glb`,
      dest: path.join(CARS_DIR, "suv.glb"),
      aliases: [path.join(CARS_DIR, "avanza.glb")],
    },
    {
      url: `${kenneyCarsBase}/suv-luxury.glb`,
      dest: path.join(CARS_DIR, "innova.glb"),
    },
    {
      url: `${kenneyCarsBase}/sedan.glb`,
      dest: path.join(CARS_DIR, "sedan.glb"),
      aliases: [path.join(CARS_DIR, "mercy.glb")],
    },
    {
      url: `${kenneyCarsBase}/sedan-sports.glb`,
      dest: path.join(CARS_DIR, "bmw.glb"),
      aliases: [path.join(CARS_DIR, "civic.glb")],
    },
    {
      url: `${kenneyCarsBase}/hatchback-sports.glb`,
      dest: path.join(CARS_DIR, "hatchback.glb"),
    },
    {
      url: `${kenneyCarsBase}/taxi.glb`,
      dest: path.join(CARS_DIR, "bluebird.glb"),
    },
    {
      url: `${kenneyCarsBase}/police.glb`,
      dest: path.join(CARS_DIR, "police.glb"),
    },
    {
      url: `${kenneyCarsBase}/van.glb`,
      dest: path.join(CARS_DIR, "angkot.glb"),
    },
    {
      url: `${kenneyCarsBase}/race.glb`,
      dest: path.join(CARS_DIR, "sport.glb"),
    },
    {
      url: `${kenneyCarsBase}/ambulance.glb`,
      dest: path.join(CARS_DIR, "ambulance.glb"),
    },
    {
      url: `${kenneyCarsBase}/firetruck.glb`,
      dest: path.join(CARS_DIR, "firetruck.glb"),
    },
    {
      url: `${kenneyCarsBase}/truck.glb`,
      dest: path.join(CARS_DIR, "truck.glb"),
    },
    {
      url: `${lowpolyCityBase}/veiculos/onibus.glb`,
      dest: path.join(CARS_DIR, "transjakarta.glb"),
    },

    // 3. Real 3D City Buildings, Landmarks & Trees
    {
      url: `${kenneyCityBase}/Textures/colormap.png`,
      dest: path.join(CITY_TEX_DIR, "colormap.png"),
    },
    {
      url: `${kenneyCityBase}/building-small-a.glb`,
      dest: path.join(CITY_DIR, "building-small-a.glb"),
    },
    {
      url: `${kenneyCityBase}/building-small-b.glb`,
      dest: path.join(CITY_DIR, "building-small-b.glb"),
    },
    {
      url: `${kenneyCityBase}/building-small-c.glb`,
      dest: path.join(CITY_DIR, "building-small-c.glb"),
    },
    {
      url: `${kenneyCityBase}/building-small-d.glb`,
      dest: path.join(CITY_DIR, "building-small-d.glb"),
    },
    {
      url: `${kenneyCityBase}/building-garage.glb`,
      dest: path.join(CITY_DIR, "building-garage.glb"),
    },
    {
      url: `${kenneyCityBase}/pavement-fountain.glb`,
      dest: path.join(CITY_DIR, "pavement-fountain.glb"),
    },
    {
      url: `${kenneyCityBase}/grass-trees.glb`,
      dest: path.join(CITY_DIR, "grass-trees.glb"),
    },
    {
      url: `${kenneyCityBase}/grass-trees-tall.glb`,
      dest: path.join(CITY_DIR, "grass-trees-tall.glb"),
    },
    {
      url: `${kenneyCityBase}/road-straight-lightposts.glb`,
      dest: path.join(CITY_DIR, "road-straight-lightposts.glb"),
    },

    // 4. Real 3D High-Rise Skyscrapers, Malls, Bus Stops, Traffic Lights & Tropical Trees
    {
      url: `${lowpolyCityBase}/residencial/predio_alto.glb`,
      dest: path.join(CITY_DIR, "predio_alto.glb"),
    },
    {
      url: `${lowpolyCityBase}/residencial/predio_apartamentos.glb`,
      dest: path.join(CITY_DIR, "predio_apartamentos.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/escritorio.glb`,
      dest: path.join(CITY_DIR, "escritorio.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/hotel.glb`,
      dest: path.join(CITY_DIR, "hotel.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/banco.glb`,
      dest: path.join(CITY_DIR, "banco.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/shopping.glb`,
      dest: path.join(CITY_DIR, "shopping.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/mercado.glb`,
      dest: path.join(CITY_DIR, "mercado.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/restaurante.glb`,
      dest: path.join(CITY_DIR, "restaurante.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/loja_esquina.glb`,
      dest: path.join(CITY_DIR, "loja_esquina.glb"),
    },
    {
      url: `${lowpolyCityBase}/comercial/posto_recarga.glb`,
      dest: path.join(CITY_DIR, "posto_recarga.glb"),
    },
    {
      url: `${lowpolyCityBase}/industrial/oficina.glb`,
      dest: path.join(CITY_DIR, "oficina.glb"),
    },
    {
      url: `${lowpolyCityBase}/publicos/policia.glb`,
      dest: path.join(CITY_DIR, "policia.glb"),
    },
    {
      url: `${lowpolyCityBase}/publicos/hospital.glb`,
      dest: path.join(CITY_DIR, "hospital.glb"),
    },
    {
      url: `${lowpolyCityBase}/publicos/monumento.glb`,
      dest: path.join(CITY_DIR, "monumento.glb"),
    },
    {
      url: `${lowpolyCityBase}/mobiliario/ponto_onibus.glb`,
      dest: path.join(CITY_DIR, "ponto_onibus.glb"),
    },
    {
      url: `${lowpolyCityBase}/mobiliario/semaforo.glb`,
      dest: path.join(CITY_DIR, "semaforo.glb"),
    },
    {
      url: `${lowpolyCityBase}/mobiliario/poste_luz.glb`,
      dest: path.join(CITY_DIR, "poste_luz.glb"),
    },
    {
      url: `${lowpolyCityBase}/ruas/ponte.glb`,
      dest: path.join(CITY_DIR, "ponte.glb"),
    },
    {
      url: `${lowpolyCityBase}/vegetacao/buriti.glb`,
      dest: path.join(CITY_DIR, "buriti.glb"),
    },
    {
      url: `${lowpolyCityBase}/vegetacao/ipe_amarelo.glb`,
      dest: path.join(CITY_DIR, "ipe_amarelo.glb"),
    },
  ];

  await fetchBatch(downloads, 6);

  // Measure total public/ size
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
