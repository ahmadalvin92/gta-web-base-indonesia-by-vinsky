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
  const key = `asphalt_${wet ? "wet" : "dry"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 512);
  ctx.fillStyle = wet ? "#141820" : "#22252c";
  ctx.fillRect(0, 0, 512, 512);

  // Micro aggregate noise
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = wet ? 18 + Math.random() * 24 : 28 + Math.random() * 34;
    ctx.fillStyle = `rgb(${shade},${shade},${shade + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Wet puddle reflections
  if (wet) {
    for (let i = 0; i < 12; i++) {
      const grad = ctx.createRadialGradient(
        Math.random() * 512,
        Math.random() * 512,
        4,
        256,
        256,
        90
      );
      grad.addColorStop(0, "rgba(80, 140, 210, 0.2)");
      grad.addColorStop(1, "rgba(20, 24, 32, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }
  }

  // Edge solid white markings
  ctx.fillStyle = "rgba(245, 245, 245, 0.85)";
  ctx.fillRect(14, 0, 8, 512);
  ctx.fillRect(490, 0, 8, 512);

  // Center Indonesian double yellow solid / dashed markings
  ctx.fillStyle = "#facc15";
  ctx.fillRect(248, 0, 6, 512);
  ctx.fillRect(258, 0, 6, 512);

  // Lane dashes
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  for (let y = 16; y < 512; y += 96) {
    ctx.fillRect(130, y, 6, 48);
    ctx.fillRect(376, y, 6, 48);
  }

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 6 });
}

export function getBuswayTexture(): THREE.CanvasTexture {
  const key = "transjakarta_busway";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 512);
  ctx.fillStyle = "#7c1d22";
  ctx.fillRect(0, 0, 256, 512);

  // Brick/textured separator look
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < 512; y += 16) {
    ctx.fillRect(0, y, 256, 2);
  }

  // Yellow border strips
  ctx.fillStyle = "#facc15";
  ctx.fillRect(6, 0, 8, 512);
  ctx.fillRect(242, 0, 8, 512);

  // BUSWAY stencil
  ctx.save();
  ctx.translate(128, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 44px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUSWAY", 0, 0);
  ctx.restore();

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 4 });
}

export function getSidewalkCurbTexture(): THREE.CanvasTexture {
  const key = "sidewalk_curb_id";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 256);
  // Paving stone base
  ctx.fillStyle = "#525866";
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 2;
  for (let x = 0; x < 512; x += 32) {
    for (let y = 0; y < 200; y += 32) {
      ctx.strokeRect(x, y, 32, 32);
    }
  }

  // Indonesian black-and-yellow striped curb along bottom edge
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = "#18181b";
    ctx.fillRect(x, 200, 32, 56);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + 32, 200, 32, 56);
  }

  return registerTexture(key, canvas, { repeatX: 4, repeatY: 2 });
}

export function getSkyscraperTexture(
  variant: number,
  isNight: boolean
): THREE.CanvasTexture {
  const key = `skyscraper_${variant % 4}_${isNight ? "night" : "day"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 512);
  const palettes = [
    ["#1e3a5f", "#3b82f6"],
    ["#1e293b", "#0ea5e9"],
    ["#2e1065", "#a855f7"],
    ["#0f3d3e", "#14b8a6"],
  ];
  const [darkCol, accentCol] = palettes[variant % palettes.length];

  ctx.fillStyle = isNight ? "#0b1120" : darkCol;
  ctx.fillRect(0, 0, 256, 512);

  // Glass window grid
  const cols = 8;
  const rows = 20;
  const padX = 6;
  const padY = 6;
  const cellW = 256 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > (isNight ? 0.35 : 0.25);
      if (isNight) {
        ctx.fillStyle = lit
          ? Math.random() > 0.25
            ? "#fef08a"
            : "#67e8f9"
          : "#111827";
      } else {
        ctx.fillStyle = lit ? accentCol : "#1e293b";
      }
      ctx.fillRect(
        c * cellW + padX / 2,
        r * cellH + padY / 2,
        cellW - padX,
        cellH - padY
      );
    }
  }

  return registerTexture(key, canvas, { repeatX: 1, repeatY: 2 });
}

export function getRukoTexture(
  type: "minimarket" | "bengkel" | "warung",
  isNight: boolean
): THREE.CanvasTexture {
  const key = `ruko_${type}_${isNight ? "night" : "day"}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 256);
  ctx.fillStyle = isNight ? "#292e3a" : "#d6d3d1";
  ctx.fillRect(0, 0, 256, 256);

  // Upper floor windows
  ctx.fillStyle = isNight ? "#fde047" : "#334155";
  ctx.fillRect(28, 22, 76, 48);
  ctx.fillRect(152, 22, 76, 48);

  if (type === "minimarket") {
    // Red-blue-yellow storefront banner
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 88, 256, 16);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 104, 256, 20);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(0, 124, 256, 8);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("INDO-MART 24 JAM", 128, 118);

    // Glass entrance
    ctx.fillStyle = isNight ? "#93c5fd" : "#1e293b";
    ctx.fillRect(24, 140, 208, 116);
  } else if (type === "bengkel") {
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(0, 88, 256, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BENGKEL MODIF VINSKY", 128, 114);

    // Rolling door fence lines
    ctx.fillStyle = "#475569";
    ctx.fillRect(20, 136, 216, 120);
    ctx.strokeStyle = "#1e293b";
    for (let y = 144; y < 256; y += 10) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(236, y);
      ctx.stroke();
    }
  } else {
    // Warung
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, 88, 256, 42);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WARUNG KOPI NUSANTARA", 128, 115);

    ctx.fillStyle = isNight ? "#fb923c" : "#78350f";
    ctx.fillRect(22, 138, 212, 118);
  }

  return registerTexture(key, canvas);
}

export function getSpbuTexture(): THREE.CanvasTexture {
  const key = "spbu_indonesia";
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 128);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(0, 0, 512, 74);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 74, 512, 16);
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(0, 90, 512, 38);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPBU PASTI PAS • 24 JAM", 256, 48);

  ctx.font = "bold 19px sans-serif";
  ctx.fillText("PERTALITE  •  PERTAMAX TURBO  •  DEX", 256, 116);

  return registerTexture(key, canvas);
}

export function getTollSignTexture(label: string): THREE.CanvasTexture {
  const key = `toll_sign_${label}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(512, 160);
  // Jasa Marga green
  ctx.fillStyle = "#0b6b3a";
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);

  // Yellow header badge
  ctx.fillStyle = "#facc15";
  ctx.fillRect(24, 22, 136, 36);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JASA MARGA", 92, 47);

  // Destination text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, 28, 108);

  // Downward highway arrow
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("⬇  ⬇", 476, 112);

  return registerTexture(key, canvas);
}

export function getLicensePlateTexture(plateText: string): THREE.CanvasTexture {
  const clean = plateText.toUpperCase().slice(0, 14);
  const key = `plate_${clean}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const { canvas, ctx } = createCanvas(256, 80);
  // Indonesian black plate with white text
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 72);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px monospace";
  ctx.textAlign = "center";
  ctx.fillText(clean, 128, 44);

  ctx.font = "bold 14px monospace";
  ctx.fillStyle = "#d4d4d8";
  ctx.fillText("11 • 29  INDONESIA", 128, 68);

  return registerTexture(key, canvas);
}

export function disposeAllGeneratedTextures(): void {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
