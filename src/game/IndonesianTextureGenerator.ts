import * as THREE from "three";

const textureCache = new Map<string, THREE.CanvasTexture>();

function createCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function registerTexture(
  key: string,
  canvas: HTMLCanvasElement,
  opts?: { repeatX?: number; repeatY?: number; srgb?: boolean }
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (opts?.repeatX || opts?.repeatY) {
    tex.repeat.set(opts.repeatX ?? 1, opts.repeatY ?? 1);
  }
  tex.colorSpace = opts?.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function getAsphaltTexture(wet = false): THREE.CanvasTexture {
  const key = `asphalt_jkt_${wet ? "wet" : "dry"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 512);
  // Charcoal gray Jakarta asphalt (observed from Bundaran HI & SCBD Street View)
  ctx.fillStyle = wet ? "#181c24" : "#2c3038";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = wet ? 22 + Math.random() * 24 : 38 + Math.random() * 34;
    ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  if (wet) {
    for (let i = 0; i < 10; i++) {
      const grad = ctx.createRadialGradient(
        Math.random() * 512,
        Math.random() * 512,
        5,
        256,
        256,
        95
      );
      grad.addColorStop(0, "rgba(110, 175, 240, 0.22)");
      grad.addColorStop(1, "rgba(24, 28, 36, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }
  }

  // Crisp solid white road shoulders
  ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
  ctx.fillRect(12, 0, 8, 512);
  ctx.fillRect(492, 0, 8, 512);

  // Double center divider lines (yellow/white)
  ctx.fillStyle = "#facc15";
  ctx.fillRect(249, 0, 5, 512);
  ctx.fillRect(258, 0, 5, 512);

  // Crisp dashed white multi-lane dividers
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  for (let y = 16; y < 512; y += 92) {
    ctx.fillRect(128, y, 6, 46);
    ctx.fillRect(378, y, 6, 46);
  }

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 6 });
}

export function getBuswayTexture(): THREE.CanvasTexture {
  const key = "transjakarta_busway_v2";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 512);
  // Concrete gray-red accented dedicated TransJakarta corridor
  ctx.fillStyle = "#6e252a";
  ctx.fillRect(0, 0, 256, 512);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let y = 0; y < 512; y += 20) {
    ctx.fillRect(0, y, 256, 2);
  }

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(6, 0, 8, 512);
  ctx.fillRect(242, 0, 8, 512);

  ctx.save();
  ctx.translate(128, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = "bold 40px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUSWAY", 0, 0);
  ctx.restore();

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 4 });
}

export function getBikeLaneTexture(): THREE.CanvasTexture {
  const key = "jakarta_bike_lane";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(128, 256);
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(6, 0, 5, 256);
  ctx.fillRect(117, 0, 5, 256);
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JALUR", 64, 118);
  ctx.fillText("SEPEDA", 64, 144);

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 12 });
}

export function getSidewalkCurbTexture(): THREE.CanvasTexture {
  const key = "sidewalk_curb_jakarta_bw";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 256);
  // Warm Jakarta pedestrian stone paving (Bundaran HI / Sudirman)
  ctx.fillStyle = "#8a857e";
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 32) {
    for (let y = 0; y < 185; y += 32) {
      ctx.strokeRect(x, y, 32, 32);
    }
  }

  // Yellow disability tactile guide strip
  ctx.fillStyle = "#eab308";
  ctx.fillRect(0, 160, 512, 18);

  // Authentic Jakarta black-and-white striped curb (kanstin belang hitam-putih)
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = "#141417";
    ctx.fillRect(x, 198, 32, 58);
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(x + 32, 198, 32, 58);
  }

  return registerTexture(key, canvas, { repeatX: 5, repeatY: 1 });
}

export function getSeparatorCurbTexture(): THREE.CanvasTexture {
  const key = "separator_yellow_black";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 64);
  for (let x = 0; x < 256; x += 64) {
    ctx.fillStyle = "#18181b";
    ctx.fillRect(x, 0, 32, 64);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + 32, 0, 32, 64);
  }
  return registerTexture(key, canvas, { repeatX: 12, repeatY: 1 });
}

export function getSkyscraperTexture(
  variant: number,
  isNight: boolean
): THREE.CanvasTexture {
  const key = `skyscraper_jkt_${variant % 5}_${isNight ? "night" : "day"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 512);
  // Real Jakarta SCBD / Thamrin tower palettes (BCA blue glass, Kempinski stone, Wisma 46 cream-silver, Treasury dark glass)
  const palettes = [
    ["#1e3a5f", "#60a5fa"],
    ["#334155", "#93c5fd"],
    ["#57534e", "#cbd5e1"],
    ["#1e293b", "#38bdf8"],
    ["#312e81", "#a5b4fc"],
  ];
  const [darkCol, glassCol] = palettes[variant % palettes.length];

  ctx.fillStyle = isNight ? "#0b1120" : darkCol;
  ctx.fillRect(0, 0, 256, 512);

  const cols = 8;
  const rows = 22;
  const cellW = 256 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > (isNight ? 0.35 : 0.22);
      if (isNight) {
        ctx.fillStyle = lit
          ? Math.random() > 0.3
            ? "#fef08a"
            : "#7dd3fc"
          : "#111827";
      } else {
        ctx.fillStyle = lit ? glassCol : "#1e293b";
      }
      ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
    }
  }

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 2 });
}

export type RukoBrandType =
  | "minimarket"
  | "bengkel"
  | "warung"
  | "fore_coffee"
  | "kopi_kenangan"
  | "rental_ps"
  | "lawson_family";

export function getRukoTexture(
  type: RukoBrandType,
  isNight: boolean
): THREE.CanvasTexture {
  const key = `ruko3_jkt_${type}_${isNight ? "night" : "day"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 384);
  // 3-story cream/warm concrete Indonesian Ruko facade
  ctx.fillStyle =
    type === "rental_ps"
      ? "#111827"
      : type === "kopi_kenangan"
      ? "#1c1917"
      : isNight
      ? "#3f3f46"
      : "#e7e2d8";
  ctx.fillRect(0, 0, 256, 384);

  // Structural concrete columns
  ctx.fillStyle =
    type === "fore_coffee"
      ? "#064e3b"
      : type === "rental_ps"
      ? "#312e81"
      : isNight
      ? "#27272a"
      : "#bdb5a6";
  ctx.fillRect(0, 0, 16, 384);
  ctx.fillRect(240, 0, 16, 384);

  // 3rd Floor & 2nd Floor aluminum framed windows
  [28, 128].forEach((yPos) => {
    ctx.fillStyle =
      type === "rental_ps"
        ? "#0ea5e9"
        : isNight
        ? "#fde68a"
        : "#334155";
    ctx.fillRect(28, yPos, 86, 56);
    ctx.fillRect(142, yPos, 86, 56);
    ctx.strokeStyle = type === "rental_ps" ? "#ec4899" : "#18181b";
    ctx.lineWidth = 3;
    ctx.strokeRect(28, yPos, 86, 56);
    ctx.strokeRect(142, yPos, 86, 56);
  });

  // Ground floor canopy & brand fascia
  if (type === "fore_coffee") {
    ctx.fillStyle = "#065f46";
    ctx.fillRect(0, 204, 256, 54);
    ctx.fillStyle = "#d9f99d";
    ctx.fillRect(0, 258, 256, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FORE COFFEE", 128, 232);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#a7f3d0";
    ctx.fillText("FORESUMMER • BUTTERSCOTCH LATTE", 128, 250);
    // Warm sunlit glass cafe front with hanging Edison lights
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(22, 272, 212, 112);
    ctx.fillStyle = "rgba(15,23,42,0.72)";
    ctx.fillRect(28, 278, 200, 98);
    ctx.fillStyle = "#fde68a";
    [60, 105, 150, 195].forEach((lx) => {
      ctx.beginPath();
      ctx.arc(lx, 296, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === "kopi_kenangan") {
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 204, 256, 54);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 254, 256, 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 21px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("♥ KOPI KENANGAN", 128, 232);
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("ES KOPI KENANGAN MANTAN • 24H", 128, 249);
    ctx.fillStyle = "#27272a";
    ctx.fillRect(22, 270, 212, 114);
    ctx.fillStyle = "#fb923c";
    ctx.fillRect(36, 286, 184, 72);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("GRABFOOD • GOFOOD • NONGKRONG", 128, 326);
  } else if (type === "rental_ps") {
    const grad = ctx.createLinearGradient(0, 204, 256, 258);
    grad.addColorStop(0, "#db2777");
    grad.addColorStop(1, "#0284c7");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 204, 256, 56);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 206, 252, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RENTAL PS5 & WARNET", 128, 229);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("VIP AC • FIFA • TEKKEN • 6 MINI-GAMES", 128, 249);
    // Glowing neon monitor / PS5 screens inside
    ctx.fillStyle = "#09090b";
    ctx.fillRect(22, 268, 212, 116);
    [40, 102, 164].forEach((mx, mIdx) => {
      ctx.fillStyle = mIdx === 1 ? "#ec4899" : "#22d3ee";
      ctx.fillRect(mx, 288, 50, 34);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(mx + 4, 292, 42, 26);
    });
  } else if (type === "lawson_family") {
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(0, 206, 256, 34);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 240, 256, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FAMILYMART • LAWSON", 128, 230);
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("ODEN HANGAT • KOPI SUSU KELUARGA", 128, 253);
    ctx.fillStyle = isNight ? "#bae6fd" : "#1e293b";
    ctx.fillRect(24, 268, 208, 116);
  } else if (type === "minimarket") {
    const isAlfa = Math.random() > 0.5;
    if (isAlfa) {
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 210, 256, 38);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(0, 248, 256, 8);
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 256, 256, 8);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ALFA-MART 24H", 128, 237);
    } else {
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 210, 256, 26);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 236, 256, 16);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(0, 252, 256, 12);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("INDO-MART", 128, 231);
    }
    ctx.fillStyle = isNight ? "#bae6fd" : "#1e293b";
    ctx.fillRect(24, 272, 208, 112);
  } else if (type === "bengkel") {
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(0, 210, 256, 48);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BENGKEL MODIF CDID", 128, 240);
    ctx.fillStyle = "#475569";
    ctx.fillRect(24, 266, 208, 118);
    ctx.strokeStyle = "#1e293b";
    for (let y = 276; y < 384; y += 10) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(232, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 210, 256, 48);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PECEL LELE & SATE TAICHAN", 128, 240);
    ctx.fillStyle = isNight ? "#fb923c" : "#78350f";
    ctx.fillRect(24, 266, 208, 118);
  }

  return registerTexture(key, canvas);
}

export function getSpbuTexture(): THREE.CanvasTexture {
  const key = "spbu_pertamina_style";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 128);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(0, 0, 512, 74);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 74, 512, 16);
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 90, 512, 38);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPBU PERTAMINA • PASTI PAS", 256, 48);

  ctx.font = "bold 18px sans-serif";
  ctx.fillText("PERTALITE  •  PERTAMAX TURBO  •  DEX", 256, 116);

  return registerTexture(key, canvas);
}

export function getHalteSignTexture(label: string): THREE.CanvasTexture {
  const key = `halte_${label}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 96);
  // Navy-blue TransJakarta revitalized fascia (step_26_shot_2)
  ctx.fillStyle = "#0f2c59";
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(0, 84, 512, 12);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, 28, 56);

  ctx.fillStyle = "#7dd3fc";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("transjakarta", 484, 56);

  return registerTexture(key, canvas);
}

export function getTollSignTexture(label: string): THREE.CanvasTexture {
  const key = `toll_sign_jm_${label}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 160);
  ctx.fillStyle = "#0b6b3a";
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.fillStyle = "#facc15";
  ctx.fillRect(24, 22, 136, 36);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JASA MARGA", 92, 47);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, 24, 110, 365);

  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("⬇  ⬇", 482, 112);

  return registerTexture(key, canvas);
}

export function getLicensePlateTexture(
  plateText: string,
  whiteStyle = true
): THREE.CanvasTexture {
  const clean = plateText.toUpperCase().slice(0, 14);
  const key = `plate_${whiteStyle ? "w" : "b"}_${clean}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 80);
  // Modern Indonesian White Plate with Black Text (or Black Plate)
  ctx.fillStyle = whiteStyle ? "#f8fafc" : "#0a0a0c";
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = whiteStyle ? "#0f172a" : "#ffffff";
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, 248, 72);

  ctx.fillStyle = whiteStyle ? "#09090b" : "#ffffff";
  ctx.font = "bold 34px monospace";
  ctx.textAlign = "center";
  ctx.fillText(clean, 128, 44);

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = whiteStyle ? "#334155" : "#d4d4d8";
  ctx.fillText("11 • 29  JAKARTA", 128, 68);

  return registerTexture(key, canvas);
}

export function getMrtSignTexture(stationName: string): THREE.CanvasTexture {
  const key = `mrt_sign_${stationName}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 112);
  ctx.fillStyle = "#0b2447";
  ctx.fillRect(0, 0, 512, 112);
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(0, 96, 512, 16);

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(46, 52, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("M", 46, 59);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("MRT JAKARTA • RATANGGA", 82, 38);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(stationName, 82, 74, 410);

  return registerTexture(key, canvas);
}

export function getHangoutBannerTexture(
  title: string,
  subtitle: string,
  kind: string
): THREE.CanvasTexture {
  const key = `hangout_banner_${kind}_${title}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 128);
  const bg =
    kind === "fore_coffee"
      ? "#064e3b"
      : kind === "kopi_kenangan"
      ? "#18181b"
      : kind === "rental_ps"
      ? "#1e1b4b"
      : "#14532d";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);

  const accent =
    kind === "fore_coffee"
      ? "#34d399"
      : kind === "kopi_kenangan"
      ? "#ef4444"
      : kind === "rental_ps"
      ? "#ec4899"
      : "#facc15";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 256, 58, 470);

  ctx.fillStyle = accent;
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(subtitle, 256, 98, 470);

  return registerTexture(key, canvas);
}

export function disposeAllGeneratedTextures(): void {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
