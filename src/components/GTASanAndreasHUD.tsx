"use client";

import React, { useEffect, useRef } from "react";
import { MapLayoutData } from "@/game/JabodetabekMapFetcher";

export type WeaponId = "fist" | "pistol" | "smg" | "ak47" | "rpg";

export const WEAPON_LIST: Array<{
  id: WeaponId;
  keyNum: string;
  label: string;
  emoji: string;
  damage: number;
}> = [
  { id: "fist", keyNum: "1", label: "Tangan Kosong", emoji: "👊", damage: 1 },
  { id: "pistol", keyNum: "2", label: "9mm Pistol", emoji: "🔫", damage: 2 },
  { id: "smg", keyNum: "3", label: "Micro-SMG", emoji: "💨", damage: 2 },
  { id: "ak47", keyNum: "4", label: "AK-47", emoji: "🔥", damage: 4 },
  { id: "rpg", keyNum: "5", label: "RPG-7 Rocket", emoji: "🚀", damage: 10 },
];

interface GTASanAndreasStatusProps {
  cash: number;
  healthPct: number;
  armorPct: number;
  wantedLevel: number;
  weapon: WeaponId;
  gameTimeLabel: string;
  onCycleWeapon: () => void;
}

export const GTASanAndreasStatusHUD: React.FC<GTASanAndreasStatusProps> = ({
  cash,
  healthPct,
  armorPct,
  wantedLevel,
  weapon,
  gameTimeLabel,
  onCycleWeapon,
}) => {
  const activeW = WEAPON_LIST.find((w) => w.id === weapon) ?? WEAPON_LIST[1];
  const formattedCash = `$${String(Math.max(0, Math.floor(cash))).padStart(8, "0")}`;

  return (
    <div className="pointer-events-auto flex items-start gap-2.5 select-none">
      {/* Left column: Clock, Armor, Health, Cash, Stars */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-lg sm:text-xl font-black text-white tracking-wider"
            style={{ textShadow: "2px 2px 0 #000, -1px -1px 0 #000" }}
          >
            {gameTimeLabel}
          </span>
        </div>

        {/* White Armor Bar */}
        <div className="h-2.5 w-28 sm:w-32 border-2 border-black bg-zinc-900/90 p-0.5 shadow">
          <div
            className="h-full bg-slate-100 transition-all duration-150"
            style={{ width: `${Math.max(0, Math.min(100, armorPct))}%` }}
          />
        </div>

        {/* Classic GTA SA Red Health Bar */}
        <div className="h-3 w-28 sm:w-32 border-2 border-black bg-red-950/95 p-0.5 shadow">
          <div
            className="h-full bg-red-600 transition-all duration-150"
            style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }}
          />
        </div>

        {/* Classic Green 8-digit GTA Money Counter */}
        <div
          className="font-mono text-lg sm:text-2xl font-black tracking-tight text-[#4ade80]"
          style={{ textShadow: "2px 2px 0 #000, -1px -1px 0 #000" }}
        >
          {formattedCash}
        </div>

        {/* 5 Wanted Stars */}
        <div className="flex items-center gap-0.5 text-base sm:text-xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={
                star <= wantedLevel
                  ? "text-amber-300 animate-pulse"
                  : "text-black/45"
              }
              style={{
                textShadow:
                  star <= wantedLevel
                    ? "0 0 8px rgba(251,191,36,0.9), 1px 1px 0 #000"
                    : "1px 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Right Box: GTA SA Weapon Icon Frame */}
      <button
        onClick={onCycleWeapon}
        title="Ganti Senjata (Tombol 1-5)"
        className="flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-xl border-[3px] border-black bg-slate-900/85 shadow-lg hover:border-amber-300 transition active:scale-95"
      >
        <span className="text-2xl sm:text-3xl leading-none">{activeW.emoji}</span>
        <span className="mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-amber-200 truncate max-w-[90%]">
          {activeW.label}
        </span>
      </button>
    </div>
  );
};

interface GTASanAndreasRadarProps {
  playerX: number;
  playerZ: number;
  cameraYaw: number;
  layout: MapLayoutData;
  trafficDots: Array<{ x: number; z: number }>;
  policeDots: Array<{ x: number; z: number }>;
  raceTarget: { x: number; z: number } | null;
  compact?: boolean;
}

export const GTASanAndreasRadar: React.FC<GTASanAndreasRadarProps> = ({
  playerX,
  playerZ,
  cameraYaw,
  layout,
  trafficDots,
  policeDots,
  raceTarget,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const size = compact ? 104 : 152;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = size / 2;
    const scale = compact ? 0.35 : 0.48; // meters -> pixels

    ctx.clearRect(0, 0, size, size);

    // Circular radar clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r - 4, 0, Math.PI * 2);
    ctx.clip();

    // Classic GTA SA radar dark slate-olive background
    ctx.fillStyle = "#1f2b27";
    ctx.fillRect(0, 0, size, size);

    // Rotate map relative to player camera yaw
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(cameraYaw);

    // Draw Roads
    ctx.strokeStyle = "#525866";
    ctx.lineCap = "round";
    for (const road of layout.roads) {
      if (road.points.length < 2) continue;
      ctx.lineWidth = Math.max(3, road.width * scale * 0.65);
      ctx.beginPath();
      road.points.forEach(([rx, rz], idx) => {
        const px = (rx - playerX) * scale;
        const pz = (rz - playerZ) * scale;
        if (idx === 0) ctx.moveTo(px, pz);
        else ctx.lineTo(px, pz);
      });
      ctx.stroke();
    }

    // Water zones
    ctx.fillStyle = "#0369a1";
    for (const wz of layout.waterZones) {
      ctx.fillRect(
        (wz.x - wz.width / 2 - playerX) * scale,
        (wz.z - wz.depth / 2 - playerZ) * scale,
        wz.width * scale,
        wz.depth * scale
      );
    }

    // SPBU Icons (Green fuel square)
    for (const spbu of layout.spbuStations) {
      const sx = (spbu.x - playerX) * scale;
      const sz = (spbu.z - playerZ) * scale;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(sx - 4, sz - 4, 8, 8);
    }

    // Race Checkpoint Blip (Pink/Yellow circle)
    if (raceTarget) {
      const rx = (raceTarget.x - playerX) * scale;
      const rz = (raceTarget.z - playerZ) * scale;
      ctx.fillStyle = "#ff3e9d";
      ctx.beginPath();
      ctx.arc(rx, rz, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Traffic blips
    ctx.fillStyle = "#cbd5e1";
    for (const td of trafficDots) {
      ctx.fillRect((td.x - playerX) * scale - 1.5, (td.z - playerZ) * scale - 1.5, 3, 3);
    }

    // Flashing Police PJR blips
    if (policeDots.length > 0) {
      const flashBlue = Math.floor(Date.now() / 220) % 2 === 0;
      ctx.fillStyle = flashBlue ? "#3b82f6" : "#ef4444";
      for (const pd of policeDots) {
        ctx.beginPath();
        ctx.arc((pd.x - playerX) * scale, (pd.z - playerZ) * scale, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.restore();

    // Outer GTA SA Thick Black Ring
    ctx.strokeStyle = "#09090b";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(r, r, r - 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r, r, r - 6, 0, Math.PI * 2);
    ctx.stroke();

    // North 'N' Marker on ring
    const northAngle = cameraYaw - Math.PI / 2;
    const nx = r + Math.cos(northAngle) * (r - 6);
    const ny = r + Math.sin(northAngle) * (r - 6);
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.arc(nx, ny, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", nx, ny + 0.5);

    // Center Player Arrow
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r, r - 7);
    ctx.lineTo(r + 5, r + 5);
    ctx.lineTo(r, r + 2);
    ctx.lineTo(r - 5, r + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }, [playerX, playerZ, cameraYaw, layout, trafficDots, policeDots, raceTarget, size, compact]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full shadow-2xl pointer-events-none"
    />
  );
};
