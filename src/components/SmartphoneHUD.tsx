"use client";

import React, { useState } from "react";
import {
  MapPin,
  ExternalLink,
  Car,
  Gamepad2,
  CloudRain,
  Sun,
  Sunset,
  Moon,
  X,
  Navigation,
  Wrench,
  Flame,
  ShieldAlert,
  Fuel,
  Smartphone,
} from "lucide-react";
import {
  JABODETABEK_REGIONS,
  JabodetabekRegion,
  JabodetabekRegionId,
  latLngToOsmTile,
} from "@/game/JabodetabekMapFetcher";
import { VEHICLE_SPECS, VehicleKind } from "@/game/ModelRegistry";
import { MinigameId } from "./MinigamesModal";

export type TimeOfDay = "morning" | "sunset" | "night";

interface SmartphoneHUDProps {
  isOpen: boolean;
  onClose: () => void;
  gps: { lat: number; lng: number };
  region: JabodetabekRegion;
  mapSource: "local-cache" | "openstreetmap-live";
  cash: number;
  currentVehicleKind: VehicleKind;
  paintColor: string;
  rimColor: string;
  plateText: string;
  neonEnabled: boolean;
  timeOfDay: TimeOfDay;
  isRaining: boolean;
  wantedLevel: number;
  onFastTravel: (regionId: JabodetabekRegionId) => void;
  onSpawnVehicle: (kind: VehicleKind) => void;
  onChangePaint: (hex: string) => void;
  onChangeRim: (hex: string) => void;
  onChangePlate: (plate: string) => void;
  onToggleNeon: () => void;
  onUpgradeEngine: () => void;
  onSetTimeOfDay: (t: TimeOfDay) => void;
  onToggleRain: () => void;
  onStartStreetRace: () => void;
  onAdjustWanted: (delta: number) => void;
  onQuickRefuelRepair: () => void;
  onOpenMinigame: (id: MinigameId) => void;
}

const PAINT_PALETTE = [
  { name: "Sunset Orange", hex: "#ff5500" },
  { name: "Vinsky Pink", hex: "#ff3e9d" },
  { name: "Midnight Blue", hex: "#1d4ed8" },
  { name: "Pearl White", hex: "#f8fafc" },
  { name: "Stealth Matte", hex: "#1e293b" },
  { name: "JDM Yellow", hex: "#facc15" },
  { name: "Emerald Green", hex: "#10b981" },
  { name: "Crimson Red", hex: "#e11d48" },
];

const RIM_PALETTE = [
  "#e2e8f0",
  "#0f172a",
  "#facc15",
  "#fb7185",
  "#38bdf8",
];

export const SmartphoneHUD: React.FC<SmartphoneHUDProps> = ({
  isOpen,
  onClose,
  gps,
  region,
  mapSource,
  cash,
  currentVehicleKind,
  paintColor,
  rimColor,
  plateText,
  neonEnabled,
  timeOfDay,
  isRaining,
  wantedLevel,
  onFastTravel,
  onSpawnVehicle,
  onChangePaint,
  onChangeRim,
  onChangePlate,
  onToggleNeon,
  onUpgradeEngine,
  onSetTimeOfDay,
  onToggleRain,
  onStartStreetRace,
  onAdjustWanted,
  onQuickRefuelRepair,
  onOpenMinigame,
}) => {
  const [tab, setTab] = useState<"gps" | "garage" | "games" | "world">("gps");
  const [plateDraft, setPlateDraft] = useState(plateText);

  if (!isOpen) return null;

  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${gps.lat.toFixed(
    6
  )},${gps.lng.toFixed(6)}`;
  const osmTile = latLngToOsmTile(gps.lat, gps.lng, 16);

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex items-center justify-end p-2 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto flex h-[92vh] max-h-[680px] w-[335px] sm:w-[375px] flex-col overflow-hidden rounded-[2.2rem] border-[5px] border-slate-800 bg-slate-950/95 shadow-2xl shadow-pink-500/30 backdrop-blur-xl text-white">
        {/* Phone Notch & Status Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 px-5 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
            <Smartphone className="h-3.5 w-3.5" />
            <span>vOS • 5G</span>
          </div>
          <div className="h-3.5 w-20 rounded-full bg-black/80 border border-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400">
              ${cash.toLocaleString("id-ID")}
            </span>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-1 hover:bg-red-500 transition"
              aria-label="Tutup HP"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1.5 border-b border-white/10">
          {[
            { id: "gps", label: "GPS", icon: MapPin },
            { id: "garage", label: "Garasi", icon: Car },
            { id: "games", label: "Games", icon: Gamepad2 },
            { id: "world", label: "Dunia", icon: Sun },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                  tab === item.id
                    ? "bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Phone Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {tab === "gps" && (
            <>
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Live GPS Jabodetabek
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {mapSource === "openstreetmap-live" ? "OSM Live" : "Cache Lokal"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">{region.title}</p>
                <p className="text-xs font-mono text-slate-300 mt-0.5">
                  LAT: {gps.lat.toFixed(6)} | LNG: {gps.lng.toFixed(6)}
                </p>

                {/* Live Free OpenStreetMap 3x3 Tile Minimap */}
                <div className="relative mt-2.5 h-44 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-800">
                  <div className="grid grid-cols-3 grid-rows-3 h-full w-full opacity-90">
                    {[-1, 0, 1].map((dy) =>
                      [-1, 0, 1].map((dx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${dx}_${dy}`}
                          src={`https://tile.openstreetmap.org/${osmTile.zoom}/${
                            osmTile.x + dx
                          }/${osmTile.y + dy}.png`}
                          alt="OSM Map Tile"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ))
                    )}
                  </div>
                  {/* Player GPS Pin */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative flex h-6 w-6 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500 opacity-75" />
                      <Navigation className="h-4 w-4 text-pink-500 fill-pink-500 drop-shadow" />
                    </div>
                  </div>
                </div>

                {/* Free Google Street View Button (Zero API Key) */}
                <a
                  href={streetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka Google Street View Asli
                </a>
                <p className="mt-1 text-[10px] text-center text-slate-400">
                  100% Gratis • Membuka panorama nyata di koordinat mobilmu
                </p>
              </div>

              {/* Fast Travel */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fast Travel Jabodetabek
                </p>
                {JABODETABEK_REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => onFastTravel(reg.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      reg.id === region.id
                        ? "border-pink-500 bg-pink-500/15"
                        : "border-white/10 bg-slate-900/70 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{reg.areaLabel}</span>
                      <span className="text-[10px] text-slate-400">
                        {reg.lat.toFixed(3)}, {reg.lng.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{reg.title}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "garage" && (
            <>
              {/* Bengkel Modif */}
              <div className="rounded-2xl border border-pink-500/30 bg-slate-900/80 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
                    <Wrench className="h-3.5 w-3.5" /> BENGKEL MODIF CDID
                  </span>
                  <button
                    onClick={onUpgradeEngine}
                    className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
                  >
                    Tune Mesin ($2.500)
                  </button>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Warna Cat Metalik</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PAINT_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => onChangePaint(c.hex)}
                        title={c.name}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          paintColor.toLowerCase() === c.hex.toLowerCase()
                            ? "border-white scale-110"
                            : "border-white/20"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">Warna Velg</p>
                    <div className="flex gap-1.5">
                      {RIM_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => onChangeRim(hex)}
                          className={`h-5 w-5 rounded-full border ${
                            rimColor === hex ? "border-white scale-110" : "border-white/20"
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onToggleNeon}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                      neonEnabled
                        ? "border-pink-400 bg-pink-500/30 text-pink-200"
                        : "border-white/10 bg-slate-800 text-slate-400"
                    }`}
                  >
                    Neon Kolong: {neonEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <input
                    value={plateDraft}
                    onChange={(e) => setPlateDraft(e.target.value.toUpperCase())}
                    maxLength={12}
                    placeholder="B 1945 VKY"
                    className="flex-1 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs font-mono uppercase text-white outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={() => onChangePlate(plateDraft || "B 1 VKY")}
                    className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-bold hover:bg-pink-500"
                  >
                    Pasang Pelat
                  </button>
                </div>
              </div>

              {/* Vehicle Spawner */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Spawn Kendaraan Instan (10 Unit)
                </p>
                {VEHICLE_SPECS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => onSpawnVehicle(v.id)}
                    className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      currentVehicleKind === v.id
                        ? "border-orange-500 bg-orange-500/15"
                        : "border-white/10 bg-slate-900/80 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{v.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {v.category} • Top {v.maxSpeedKmh} km/h
                      </p>
                    </div>
                    <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold">
                      Spawn
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "games" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Portal Mini-Games Berhadiah ($)
              </p>

              <button
                onClick={() => onOpenMinigame("snake")}
                className="w-full rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/70 to-slate-900 p-3.5 text-left hover:border-cyan-400 transition"
              >
                <p className="text-sm font-black text-cyan-300">🐍 Neon Cyber Snake</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Game ular cyberpunk klasik dengan hadiah $40 per poin!
                </p>
              </button>

              <button
                onClick={() => onOpenMinigame("fps")}
                className="w-full rounded-2xl border border-pink-500/40 bg-gradient-to-r from-pink-950/70 to-slate-900 p-3.5 text-left hover:border-pink-400 transition"
              >
                <p className="text-sm font-black text-pink-300">🎯 Urban Warzone FPS</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Tembak-tembakan arena 3D melawan gelombang bot bersenjata ($1.500/kill).
                </p>
              </button>

              <button
                onClick={() => onOpenMinigame("drag")}
                className="w-full rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-950/70 to-slate-900 p-3.5 text-left hover:border-orange-400 transition"
              >
                <p className="text-sm font-black text-orange-300">🏁 Sentul Drag Race 402m</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Balap drag 402m oper gigi manual + NOS! Hadiah juara $12.000!
                </p>
              </button>
            </div>
          )}

          {tab === "world" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Siklus Waktu & Pencahayaan PBR
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onSetTimeOfDay("morning")}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold border ${
                      timeOfDay === "morning"
                        ? "border-sky-400 bg-sky-500/20 text-sky-200"
                        : "border-white/10 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Sun className="h-4 w-4" /> Pagi
                  </button>
                  <button
                    onClick={() => onSetTimeOfDay("sunset")}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold border ${
                      timeOfDay === "sunset"
                        ? "border-pink-400 bg-gradient-to-br from-pink-500/30 to-orange-500/30 text-pink-200"
                        : "border-white/10 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Sunset className="h-4 w-4" /> Sunset VI
                  </button>
                  <button
                    onClick={() => onSetTimeOfDay("night")}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold border ${
                      timeOfDay === "night"
                        ? "border-purple-400 bg-purple-500/20 text-purple-200"
                        : "border-white/10 bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Moon className="h-4 w-4" /> Malam
                  </button>
                </div>

                <button
                  onClick={onToggleRain}
                  className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-bold transition ${
                    isRaining
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-white/10 bg-slate-800 text-slate-300"
                  }`}
                >
                  <CloudRain className="h-4 w-4" />
                  Cuaca Hujan & Refleksi Aspal: {isRaining ? "AKTIF" : "MATI"}
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={onStartStreetRace}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 py-2.5 text-xs font-black shadow-lg"
                >
                  <Flame className="h-4 w-4" /> Mulai Balap Liar (Hadiah $15.000)
                </button>

                <button
                  onClick={onQuickRefuelRepair}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300"
                >
                  <Fuel className="h-4 w-4" /> Isi Bensin Penuh & Repair ($500)
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => onAdjustWanted(1)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-red-500/40 bg-red-500/15 py-2 text-xs font-bold text-red-300"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" /> +1 Bintang ({wantedLevel}★)
                  </button>
                  <button
                    onClick={() => onAdjustWanted(-5)}
                    className="flex-1 rounded-xl border border-white/15 bg-slate-800 py-2 text-xs font-bold text-slate-300"
                  >
                    Suap Polisi (Clear)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
