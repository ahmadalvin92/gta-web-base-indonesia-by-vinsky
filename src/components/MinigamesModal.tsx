"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Trophy,
  Crosshair,
  Gauge,
  Gamepad2,
  RotateCcw,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
} from "lucide-react";
import { soundEngine } from "@/game/SoundEngine";

export type MinigameId =
  | "snake"
  | "drag"
  | "ps_penalty"
  | "ojol_rush"
  | "tarkam_fighter"
  | "fps";

interface MinigamesModalProps {
  activeGame: MinigameId;
  onClose: () => void;
  onSelectGame: (id: MinigameId) => void;
  onEarnCash: (amount: number, reason: string) => void;
}

export const MinigamesModal: React.FC<MinigamesModalProps> = ({
  activeGame,
  onClose,
  onSelectGame,
  onEarnCash,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl border border-cyan-400/50 bg-slate-950/95 shadow-2xl shadow-pink-500/25 text-white">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-pink-600/25 via-indigo-600/25 to-cyan-500/25 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-cyan-400" />
            <div>
              <span className="font-black tracking-wide text-sm sm:text-base">
                RENTAL PS5 & WARNET GAMING 24 JAM • VINSKY
              </span>
              <p className="text-[10px] text-cyan-300 font-semibold">
                Billing VIP Paket Malam • Semua Kemenangan Cair Langsung ($)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "ps_penalty", label: "⚽ PS5 Penalty" },
                { id: "tarkam_fighter", label: "🥊 Gelut PS5" },
                { id: "ojol_rush", label: "🏍️ Ojol Rush" },
                { id: "drag", label: "🏁 Drag 402m" },
                { id: "snake", label: "🐍 Snake" },
                { id: "fps", label: "🎯 FPS Arena" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectGame(tab.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  activeGame === tab.id
                    ? "bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={onClose}
              className="ml-1 rounded-lg bg-red-500/25 p-1.5 text-red-300 hover:bg-red-500 hover:text-white transition"
              aria-label="Tutup Rental PS"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {activeGame === "snake" && <NeonCyberSnake onEarnCash={onEarnCash} />}
          {activeGame === "fps" && <UrbanWarzoneFPS onEarnCash={onEarnCash} />}
          {activeGame === "drag" && <SentulDragRace onEarnCash={onEarnCash} />}
          {activeGame === "ps_penalty" && <Ps5PenaltyGame onEarnCash={onEarnCash} />}
          {activeGame === "ojol_rush" && <OjolSudirmanRush onEarnCash={onEarnCash} />}
          {activeGame === "tarkam_fighter" && <Ps5GelutFighter onEarnCash={onEarnCash} />}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 1. NEON CYBER SNAKE
 * ========================================================================== */
const NeonCyberSnake: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const nextDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const snakeRef = useRef<Array<{ x: number; y: number }>>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const foodRef = useRef<{ x: number; y: number }>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const deadRef = useRef(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("vinsky_snake_hs") || "0");
      if (!Number.isNaN(saved)) setHighScore(saved);
    } catch {}
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
    };
    scoreRef.current = 0;
    deadRef.current = false;
    setScore(0);
    setGameOver(false);
  }, []);

  const setDirection = useCallback((nx: number, ny: number) => {
    const cur = dirRef.current;
    if (cur.x + nx === 0 && cur.y + ny === 0) return;
    nextDirRef.current = { x: nx, y: ny };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        setDirection(0, -1);
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        setDirection(0, 1);
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        e.preventDefault();
        setDirection(-1, 0);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDirection(1, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection]);

  useEffect(() => {
    const gridCount = 20;
    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!deadRef.current) {
        dirRef.current = nextDirRef.current;
        const head = snakeRef.current[0];
        const nextHead = {
          x: (head.x + dirRef.current.x + gridCount) % gridCount,
          y: (head.y + dirRef.current.y + gridCount) % gridCount,
        };

        const hitSelf = snakeRef.current.some(
          (s) => s.x === nextHead.x && s.y === nextHead.y
        );
        if (hitSelf) {
          deadRef.current = true;
          setGameOver(true);
          if (scoreRef.current > 0) {
            onEarnCash(scoreRef.current * 40, "Neon Cyber Snake");
          }
          try {
            const best = Math.max(
              Number(localStorage.getItem("vinsky_snake_hs") || "0"),
              scoreRef.current
            );
            localStorage.setItem("vinsky_snake_hs", String(best));
            setHighScore(best);
          } catch {}
        } else {
          snakeRef.current.unshift(nextHead);
          if (
            nextHead.x === foodRef.current.x &&
            nextHead.y === foodRef.current.y
          ) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            soundEngine.playCashReward();
            foodRef.current = {
              x: Math.floor(Math.random() * gridCount),
              y: Math.floor(Math.random() * gridCount),
            };
          } else {
            snakeRef.current.pop();
          }
        }
      }

      // Draw
      const size = canvas.width;
      const cell = size / gridCount;
      ctx.fillStyle = "#060813";
      ctx.fillRect(0, 0, size, size);

      // Neon grid
      ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
      }

      // Food orb
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ff3e9d";
      ctx.fillStyle = "#ff3e9d";
      ctx.beginPath();
      ctx.arc(
        foodRef.current.x * cell + cell / 2,
        foodRef.current.y * cell + cell / 2,
        cell * 0.36,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Snake segments
      snakeRef.current.forEach((seg, idx) => {
        ctx.fillStyle = idx === 0 ? "#00f0ff" : idx % 2 === 0 ? "#38bdf8" : "#818cf8";
        ctx.fillRect(seg.x * cell + 2, seg.y * cell + 2, cell - 4, cell - 4);
      });
    }, 115);

    return () => clearInterval(interval);
  }, [onEarnCash]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-cyan-500/30 bg-slate-900/90 px-4 py-2.5 text-sm">
        <div>
          Skor: <span className="font-bold text-cyan-400">{score}</span>
        </div>
        <div className="text-xs text-slate-400">Hadiah: $40 / poin</div>
        <div className="flex items-center gap-1 text-amber-400 font-semibold">
          <Trophy className="h-4 w-4" /> {highScore}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="h-[300px] w-[300px] sm:h-[360px] sm:w-[360px] rounded-xl border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
        />
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm">
            <p className="text-2xl font-black text-pink-500">GAME OVER</p>
            <p className="mt-1 text-sm text-slate-300">
              Skor Akhir: {score} (+${score * 40})
            </p>
            <button
              onClick={resetGame}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-bold text-white shadow-lg"
            >
              <RotateCcw className="h-4 w-4" /> Main Lagi
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-Pad + Desktop note */}
      <div className="grid grid-cols-3 gap-2 w-40">
        <div />
        <button
          onClick={() => setDirection(0, -1)}
          className="flex h-11 items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-500"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <div />
        <button
          onClick={() => setDirection(-1, 0)}
          className="flex h-11 items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setDirection(0, 1)}
          className="flex h-11 items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-500"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
        <button
          onClick={() => setDirection(1, 0)}
          className="flex h-11 items-center justify-center rounded-xl bg-slate-800 active:bg-cyan-500"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Gunakan WASD / Tombol Panah di Laptop atau D-Pad sentuh di HP.
      </p>
    </div>
  );
};

/* ============================================================================
 * 2. URBAN WARZONE FPS (3D Arena Bot Shooter)
 * ========================================================================== */
interface FpsBot {
  id: number;
  x: number; // -1..1 normalized angle offset
  dist: number; // 10..60 meters
  hp: number;
  speed: number;
  shootTimer: number;
}

const UrbanWarzoneFPS: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hp, setHp] = useState(100);
  const [ammo, setAmmo] = useState(12);
  const [kills, setKills] = useState(0);
  const [wave, setWave] = useState(1);
  const [dead, setDead] = useState(false);

  const aimRef = useRef<{ x: number; y: number }>({ x: 320, y: 180 });
  const botsRef = useRef<FpsBot[]>([]);
  const hpRef = useRef(100);
  const ammoRef = useRef(12);
  const killsRef = useRef(0);
  const waveRef = useRef(1);
  const flashRef = useRef(0);
  const hitMarkerRef = useRef(0);

  const spawnWave = useCallback((w: number) => {
    const count = 3 + w;
    const list: FpsBot[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: Math.random(),
        x: (Math.random() - 0.5) * 1.4,
        dist: 26 + Math.random() * 28,
        hp: 2 + Math.floor(w / 2),
        speed: 0.25 + Math.random() * 0.3,
        shootTimer: 1.5 + Math.random() * 2.5,
      });
    }
    botsRef.current = list;
  }, []);

  const resetFps = useCallback(() => {
    hpRef.current = 100;
    ammoRef.current = 12;
    killsRef.current = 0;
    waveRef.current = 1;
    setHp(100);
    setAmmo(12);
    setKills(0);
    setWave(1);
    setDead(false);
    spawnWave(1);
  }, [spawnWave]);

  useEffect(() => {
    spawnWave(1);
  }, [spawnWave]);

  const reload = useCallback(() => {
    ammoRef.current = 12;
    setAmmo(12);
    soundEngine.playShiftGear();
  }, []);

  const fireShot = useCallback(() => {
    if (hpRef.current <= 0) return;
    if (ammoRef.current <= 0) {
      reload();
      return;
    }
    ammoRef.current -= 1;
    setAmmo(ammoRef.current);
    flashRef.current = 1;
    soundEngine.playGunshot();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = aimRef.current.x;
    const cy = aimRef.current.y;

    // Check bot hit
    let hitIndex = -1;
    for (let i = 0; i < botsRef.current.length; i++) {
      const b = botsRef.current[i];
      const scale = Math.max(0.35, 22 / b.dist);
      const bx = canvas.width * 0.5 + b.x * canvas.width * 0.42;
      const by = canvas.height * 0.56;
      const bw = 42 * scale;
      const bh = 88 * scale;
      if (
        cx >= bx - bw * 0.6 &&
        cx <= bx + bw * 0.6 &&
        cy >= by - bh * 0.65 &&
        cy <= by + bh * 0.45
      ) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex >= 0) {
      hitMarkerRef.current = 1;
      const target = botsRef.current[hitIndex];
      target.hp -= 1;
      if (target.hp <= 0) {
        botsRef.current.splice(hitIndex, 1);
        killsRef.current += 1;
        setKills(killsRef.current);
        onEarnCash(1500, "Eliminasi Bot FPS");
        soundEngine.playCashReward();

        if (botsRef.current.length === 0) {
          waveRef.current += 1;
          setWave(waveRef.current);
          onEarnCash(5000, `Wave ${waveRef.current - 1} Clear`);
          spawnWave(waveRef.current);
        }
      }
    }
  }, [onEarnCash, reload, spawnWave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") reload();
      if (e.code === "Space") {
        e.preventDefault();
        fireShot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fireShot, reload]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // Sky & Jakarta night skyline gradient
          const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
          sky.addColorStop(0, "#090418");
          sky.addColorStop(0.6, "#2e1065");
          sky.addColorStop(1, "#ff3e9d");
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h * 0.55);

          // Ground road perspective
          ctx.fillStyle = "#18181f";
          ctx.fillRect(0, h * 0.55, w, h * 0.45);
          ctx.strokeStyle = "rgba(255, 140, 56, 0.35)";
          ctx.lineWidth = 2;
          for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(w * 0.5 + i * 25, h * 0.55);
            ctx.lineTo(w * 0.5 + i * 110, h);
            ctx.stroke();
          }

          // Skyline silhouettes
          ctx.fillStyle = "#0b0f1e";
          for (let i = 0; i < 12; i++) {
            const bw = 46;
            const bh = 50 + ((i * 37) % 95);
            ctx.fillRect(i * 56, h * 0.55 - bh, bw, bh);
          }

          // Update & draw bots sorted far-to-near
          if (hpRef.current > 0) {
            botsRef.current.forEach((b) => {
              b.x += Math.sin(now * 0.002 + b.id * 10) * b.speed * dt;
              b.x = Math.max(-0.85, Math.min(0.85, b.x));
              b.dist = Math.max(11, b.dist - dt * 1.4);
              b.shootTimer -= dt;
              if (b.shootTimer <= 0) {
                b.shootTimer = Math.max(1.2, 3.0 - waveRef.current * 0.2);
                hpRef.current = Math.max(0, hpRef.current - 7);
                setHp(hpRef.current);
                if (hpRef.current <= 0) setDead(true);
              }
            });
          }

          const sorted = [...botsRef.current].sort((a, b) => b.dist - a.dist);
          sorted.forEach((b) => {
            const scale = Math.max(0.35, 22 / b.dist);
            const bx = w * 0.5 + b.x * w * 0.42;
            const by = h * 0.56;
            const bw = 38 * scale;
            const bh = 84 * scale;

            // Body
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(bx - bw * 0.45, by - bh * 0.35, bw * 0.9, bh * 0.65);
            // Head
            ctx.fillStyle = "#fde047";
            ctx.beginPath();
            ctx.arc(bx, by - bh * 0.5, bw * 0.28, 0, Math.PI * 2);
            ctx.fill();
            // HP bar
            ctx.fillStyle = "#111827";
            ctx.fillRect(bx - bw * 0.45, by - bh * 0.78, bw * 0.9, 5);
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(
              bx - bw * 0.45,
              by - bh * 0.78,
              (bw * 0.9 * b.hp) / (2 + Math.floor(waveRef.current / 2)),
              5
            );
          });

          // Muzzle flash
          if (flashRef.current > 0) {
            ctx.fillStyle = `rgba(255, 210, 80, ${flashRef.current * 0.5})`;
            ctx.beginPath();
            ctx.arc(w * 0.72, h * 0.85, 45 * flashRef.current, 0, Math.PI * 2);
            ctx.fill();
            flashRef.current = Math.max(0, flashRef.current - dt * 10);
          }

          // Weapon silhouette bottom-right
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(w * 0.68, h * 0.78, 120, 90);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(w * 0.66, h * 0.74, 48, 22);

          // Crosshair
          const ax = aimRef.current.x;
          const ay = aimRef.current.y;
          ctx.strokeStyle = hitMarkerRef.current > 0 ? "#ff3e9d" : "#00f0ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay, 14, 0, Math.PI * 2);
          ctx.moveTo(ax - 22, ay);
          ctx.lineTo(ax - 8, ay);
          ctx.moveTo(ax + 8, ay);
          ctx.lineTo(ax + 22, ay);
          ctx.moveTo(ax, ay - 22);
          ctx.lineTo(ax, ay - 8);
          ctx.moveTo(ax, ay + 8);
          ctx.lineTo(ax, ay + 22);
          ctx.stroke();

          if (hitMarkerRef.current > 0) {
            hitMarkerRef.current = Math.max(0, hitMarkerRef.current - dt * 5);
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const updatePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    aimRef.current = {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between rounded-xl border border-pink-500/30 bg-slate-900 px-4 py-2 text-xs sm:text-sm">
        <div>
          HP:{" "}
          <span className={hp > 35 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
            {hp}%
          </span>
        </div>
        <div>
          Wave: <span className="font-bold text-orange-400">{wave}</span>
        </div>
        <div>
          Kill: <span className="font-bold text-pink-400">{kills}</span>
        </div>
        <div>
          Ammo: <span className="font-bold text-cyan-400">{ammo}/12</span>
        </div>
      </div>

      <div className="relative w-full max-w-[640px]">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onMouseMove={(e) => updatePointer(e.clientX, e.clientY)}
          onClick={(e) => {
            updatePointer(e.clientX, e.clientY);
            fireShot();
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) {
              updatePointer(t.clientX, t.clientY);
              fireShot();
            }
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) updatePointer(t.clientX, t.clientY);
          }}
          className="w-full aspect-video cursor-crosshair rounded-xl border-2 border-pink-500/50 bg-black"
        />

        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm">
            <p className="text-2xl font-black text-red-500">TERELIMINASI</p>
            <p className="text-sm text-slate-300 mt-1">
              Total Eliminasi: {kills} • Wave {wave}
            </p>
            <button
              onClick={resetFps}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2.5 font-bold"
            >
              <RotateCcw className="h-4 w-4" /> Respawn Arena
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={fireShot}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-red-600 px-5 py-2.5 text-sm font-bold shadow-lg active:scale-95"
        >
          <Crosshair className="h-4 w-4" /> TEMBAK (Klik / Space)
        </button>
        <button
          onClick={reload}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold hover:bg-slate-700"
        >
          RELOAD (R)
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. SENTUL DRAG RACE 402M (Manual Gear Shifting)
 * ========================================================================== */
const SentulDragRace: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const [phase, setPhase] = useState<"ready" | "countdown" | "racing" | "finished">("ready");
  const [lightStep, setLightStep] = useState(0); // 0..3 amber, 4 green
  const [gear, setGear] = useState(1);
  const [rpm, setRpm] = useState(1200);
  const [speed, setSpeed] = useState(0);
  const [playerDist, setPlayerDist] = useState(0);
  const [aiDist, setAiDist] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [nitroLeft, setNitroLeft] = useState(100);
  const [shiftFeedback, setShiftFeedback] = useState("Siapkan launch!");
  const [won, setWon] = useState<boolean | null>(null);

  const throttleRef = useRef(false);
  const nitroActiveRef = useRef(false);
  const stateRef = useRef({
    gear: 1,
    rpm: 1200,
    speedMs: 0,
    pDist: 0,
    aDist: 0,
    aSpeedMs: 0,
    time: 0,
    nitro: 100,
  });

  const startRace = useCallback(() => {
    stateRef.current = {
      gear: 1,
      rpm: 1400,
      speedMs: 0,
      pDist: 0,
      aDist: 0,
      aSpeedMs: 0,
      time: 0,
      nitro: 100,
    };
    setGear(1);
    setRpm(1400);
    setSpeed(0);
    setPlayerDist(0);
    setAiDist(0);
    setElapsed(0);
    setNitroLeft(100);
    setWon(null);
    setShiftFeedback("Tunggu lampu HIJAU...");
    setPhase("countdown");
    setLightStep(1);
    setTimeout(() => setLightStep(2), 550);
    setTimeout(() => setLightStep(3), 1100);
    setTimeout(() => {
      setLightStep(4);
      setPhase("racing");
      setShiftFeedback("GAS POL! Oper gigi di zona HIJAU!");
    }, 1650);
  }, []);

  const shiftUp = useCallback(() => {
    if (phase !== "racing") return;
    const s = stateRef.current;
    if (s.gear >= 6) return;

    soundEngine.playShiftGear();
    if (s.rpm >= 6600 && s.rpm <= 8400) {
      setShiftFeedback("PERFECT SHIFT! +BOOST!");
      s.speedMs += 4.2;
    } else if (s.rpm < 5000) {
      setShiftFeedback("Terlalu cepat oper (Early Shift)");
      s.speedMs = Math.max(0, s.speedMs - 1.5);
    } else {
      setShiftFeedback("Good Shift!");
    }

    s.gear += 1;
    s.rpm = Math.max(2800, s.rpm * 0.56);
    setGear(s.gear);
  }, [phase]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") throttleRef.current = true;
      if (e.code === "Space" || e.key.toLowerCase() === "e") {
        e.preventDefault();
        shiftUp();
      }
      if (e.key === "Shift" || e.key.toLowerCase() === "n") nitroActiveRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") throttleRef.current = false;
      if (e.key === "Shift" || e.key.toLowerCase() === "n") nitroActiveRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [shiftUp]);

  useEffect(() => {
    if (phase !== "racing") return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      s.time += dt;

      const gearMaxSpeed = [0, 22, 38, 55, 72, 88, 106][s.gear] ?? 106;
      const useNitro = nitroActiveRef.current && s.nitro > 0;
      if (useNitro) {
        s.nitro = Math.max(0, s.nitro - dt * 32);
      }

      if (throttleRef.current) {
        const accel = (26 / Math.pow(s.gear, 0.52)) * (useNitro ? 1.55 : 1);
        s.speedMs = Math.min(gearMaxSpeed + (useNitro ? 14 : 0), s.speedMs + accel * dt);
        s.rpm = Math.min(9000, 1800 + (s.speedMs / gearMaxSpeed) * 7100);
      } else {
        s.speedMs = Math.max(0, s.speedMs - 8 * dt);
        s.rpm = Math.max(1200, s.rpm - 3200 * dt);
      }

      // AI competitor pacing (~10.8s 402m)
      s.aSpeedMs = Math.min(82, s.aSpeedMs + 16.5 * dt);

      s.pDist += s.speedMs * dt;
      s.aDist += s.aSpeedMs * dt;

      setRpm(Math.round(s.rpm));
      setSpeed(Math.round(s.speedMs * 3.6));
      setPlayerDist(Math.min(402, Math.round(s.pDist)));
      setAiDist(Math.min(402, Math.round(s.aDist)));
      setElapsed(Number(s.time.toFixed(2)));
      setNitroLeft(Math.round(s.nitro));

      if (s.pDist >= 402 || s.aDist >= 402) {
        const playerWon = s.pDist >= s.aDist;
        setWon(playerWon);
        setPhase("finished");
        if (playerWon) {
          soundEngine.playCashReward();
          onEarnCash(12000, "Juara Sentul Drag Race 402m");
        }
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, onEarnCash]);

  const rpmPct = Math.min(100, (rpm / 9000) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Christmas Tree & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-500/30 bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-4 w-4 rounded-full border border-white/20 ${
                step < 4
                  ? lightStep >= step
                    ? "bg-amber-400 shadow-md shadow-amber-400"
                    : "bg-slate-800"
                  : lightStep >= 4
                  ? "bg-emerald-400 shadow-md shadow-emerald-400"
                  : "bg-slate-800"
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-semibold text-amber-300">{shiftFeedback}</span>
        </div>
        <div className="text-sm font-mono font-bold text-cyan-400">
          E.T: {elapsed.toFixed(2)}s • {speed} km/h
        </div>
      </div>

      {/* 402m Drag Track */}
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-pink-400">Vinsky GTR (Kamu)</span>
            <span>{playerDist} / 402 m</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-75"
              style={{ width: `${(playerDist / 402) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-slate-400">AI Pembalap Sentul</span>
            <span>{aiDist} / 402 m</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-75"
              style={{ width: `${(aiDist / 402) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tachometer & Green Shift Zone */}
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="flex items-center gap-1.5 font-bold">
            <Gauge className="h-4 w-4 text-orange-400" />
            GIGI <span className="text-xl text-pink-400">{gear}</span> / 6
          </span>
          <span className="font-mono text-xs text-slate-300">{rpm} RPM</span>
        </div>
        <div className="relative h-6 w-full rounded-lg bg-slate-800 overflow-hidden">
          {/* Perfect Shift Green Zone (73% - 93%) */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/35 border-x border-emerald-400"
            style={{ left: "73%", width: "20%" }}
          />
          <div
            className={`h-full transition-all duration-75 ${
              rpm >= 6600 && rpm <= 8400
                ? "bg-emerald-400"
                : rpm > 8400
                ? "bg-red-500"
                : "bg-gradient-to-r from-cyan-500 to-amber-400"
            }`}
            style={{ width: `${rpmPct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      {phase === "ready" || phase === "finished" ? (
        <div className="flex flex-col items-center gap-2">
          {phase === "finished" && (
            <p className={`text-xl font-black ${won ? "text-emerald-400" : "text-red-400"}`}>
              {won ? "MENANG! +$12,000 Hadiah Sentul!" : "KALAH TIPIS! Coba oper gigi di zona hijau!"}
            </p>
          )}
          <button
            onClick={startRace}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3 font-black tracking-wide shadow-lg hover:scale-105 transition"
          >
            {phase === "finished" ? "BALAP LAGI (402m)" : "MULAI DRAG RACE 402m"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <button
            onMouseDown={() => (throttleRef.current = true)}
            onMouseUp={() => (throttleRef.current = false)}
            onMouseLeave={() => (throttleRef.current = false)}
            onTouchStart={() => (throttleRef.current = true)}
            onTouchEnd={() => (throttleRef.current = false)}
            className="rounded-xl bg-emerald-600 py-4 font-black text-white active:bg-emerald-500 select-none"
          >
            GAS POL (W/↑)
          </button>
          <button
            onClick={shiftUp}
            className="rounded-xl bg-pink-600 py-4 font-black text-white active:bg-pink-500 select-none flex items-center justify-center gap-1"
          >
            <Zap className="h-4 w-4" /> OPER GIGI (Space)
          </button>
          <button
            onMouseDown={() => (nitroActiveRef.current = true)}
            onMouseUp={() => (nitroActiveRef.current = false)}
            onMouseLeave={() => (nitroActiveRef.current = false)}
            onTouchStart={() => (nitroActiveRef.current = true)}
            onTouchEnd={() => (nitroActiveRef.current = false)}
            className="rounded-xl bg-orange-600 py-4 font-black text-white active:bg-orange-500 select-none flex items-center justify-center gap-1"
          >
            <Flame className="h-4 w-4" /> NOS ({nitroLeft}%)
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 4. PS5 LIGA TARKAM PENALTY SHOOTOUT
 * ========================================================================== */
const Ps5PenaltyGame: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [round, setRound] = useState(1);
  const [goals, setGoals] = useState(0);
  const [status, setStatus] = useState("Klik sudut gawang untuk menendang!");
  const [finished, setFinished] = useState(false);

  const animRef = useRef({
    aimX: 0.5,
    aimY: 0.45,
    ballX: 280,
    ballY: 270,
    ballScale: 1,
    targetX: 280,
    targetY: 115,
    keeperX: 280,
    keeperTargetX: 280,
    kicking: false,
    timer: 0,
    round: 1,
    goals: 0,
    finished: false,
  });

  const resetMatch = () => {
    animRef.current = {
      aimX: 0.5,
      aimY: 0.45,
      ballX: 280,
      ballY: 270,
      ballScale: 1,
      targetX: 280,
      targetY: 115,
      keeperX: 280,
      keeperTargetX: 280,
      kicking: false,
      timer: 0,
      round: 1,
      goals: 0,
      finished: false,
    };
    setRound(1);
    setGoals(0);
    setFinished(false);
    setStatus("Arahkan kursor / ketuk gawang lalu tendang (Tendangan 1/5)!");
  };

  const shootAt = useCallback(
    (normX: number, normY: number) => {
      const a = animRef.current;
      if (a.kicking || a.finished) return;
      a.aimX = Math.max(0.18, Math.min(0.82, normX));
      a.aimY = Math.max(0.22, Math.min(0.62, normY));
      a.targetX = a.aimX * 560;
      a.targetY = a.aimY * 320;
      const diveChoices = [145, 220, 280, 340, 415];
      a.keeperTargetX = diveChoices[Math.floor(Math.random() * diveChoices.length)];
      a.kicking = true;
      a.timer = 0;
      soundEngine.playShiftGear();
    },
    []
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = animRef.current;

      if (a.kicking) {
        a.timer += dt;
        const p = Math.min(1, a.timer / 0.48);
        a.ballX = 280 + (a.targetX - 280) * p;
        a.ballY = 270 + (a.targetY - 270) * p;
        a.ballScale = 1 - p * 0.48;
        a.keeperX += (a.keeperTargetX - a.keeperX) * Math.min(1, dt * 8);

        if (p >= 1) {
          a.kicking = false;
          const saved = Math.abs(a.targetX - a.keeperX) < 38 && a.targetY > 82;
          if (saved) {
            setStatus(`🧤 DITEPIS KIPER! Siapkan tendangan ke-${a.round + 1}...`);
          } else {
            a.goals += 1;
            setGoals(a.goals);
            soundEngine.playCashReward();
            onEarnCash(3000, "Gol PS5 Liga Tarkam");
            setStatus(`⚽ GOOOLL!! +$3.000!`);
          }

          setTimeout(() => {
            const st = animRef.current;
            if (st.round >= 5) {
              st.finished = true;
              setFinished(true);
              if (st.goals >= 3) {
                onEarnCash(10000, "Juara PS5 Adu Penalti");
                setStatus(`🏆 JUARA TARKAM! ${st.goals}/5 Gol (+Bonus $10.000)!`);
              } else {
                setStatus(`Selesai! Total ${st.goals}/5 Gol. Coba lagi!`);
              }
            } else {
              st.round += 1;
              st.ballX = 280;
              st.ballY = 270;
              st.ballScale = 1;
              st.keeperX = 280;
              setRound(st.round);
            }
          }, 750);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          // Stadium stands
          ctx.fillStyle = "#090d1f";
          ctx.fillRect(0, 0, w, 175);
          // Floodlights
          ctx.fillStyle = "#fde68a";
          [70, 490].forEach((fx) => {
            ctx.beginPath();
            ctx.arc(fx, 28, 12, 0, Math.PI * 2);
            ctx.fill();
          });
          // Pitch grass
          ctx.fillStyle = "#15803d";
          ctx.fillRect(0, 175, w, h - 175);
          ctx.fillStyle = "#166534";
          ctx.fillRect(0, 225, w, 45);
          // Goal net & white frame
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(110, 65, 340, 110);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1;
          for (let gx = 125; gx < 450; gx += 20) {
            ctx.beginPath();
            ctx.moveTo(gx, 65);
            ctx.lineTo(gx, 175);
            ctx.stroke();
          }
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 6;
          ctx.strokeRect(110, 65, 340, 110);

          // Goalkeeper
          ctx.fillStyle = "#f97316";
          ctx.fillRect(a.keeperX - 18, 112, 36, 52);
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(a.keeperX, 102, 11, 0, Math.PI * 2);
          ctx.fill();

          // Target cursor
          if (!a.kicking && !a.finished) {
            ctx.strokeStyle = "#00f0ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(a.aimX * w, a.aimY * h, 14, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Soccer ball
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(a.ballX, a.ballY, 15 * a.ballScale, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#111827";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onEarnCash]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xl items-center justify-between rounded-xl border border-emerald-500/40 bg-slate-900 px-4 py-2 text-xs sm:text-sm">
        <span>
          Tendangan: <strong className="text-cyan-400">{round}/5</strong>
        </span>
        <span className="font-bold text-amber-300 text-center px-2">{status}</span>
        <span>
          Gol: <strong className="text-emerald-400">{goals}</strong>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={560}
        height={320}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          animRef.current.aimX = Math.max(0.2, Math.min(0.8, (e.clientX - r.left) / r.width));
          animRef.current.aimY = Math.max(0.22, Math.min(0.54, (e.clientY - r.top) / r.height));
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          shootAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          const r = e.currentTarget.getBoundingClientRect();
          shootAt((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
        }}
        className="w-full max-w-[560px] aspect-[7/4] cursor-crosshair rounded-xl border-2 border-emerald-400/50"
      />

      <div className="flex flex-wrap gap-2">
        {[
          { label: "↖ Pojok Kiri", x: 0.24, y: 0.28 },
          { label: "⬆ Tengah", x: 0.5, y: 0.28 },
          { label: "↗ Pojok Kanan", x: 0.76, y: 0.28 },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => shootAt(btn.x, btn.y)}
            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold hover:bg-emerald-500 active:scale-95"
          >
            {btn.label}
          </button>
        ))}
        {finished && (
          <button
            onClick={resetMatch}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-xs font-black"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Main Lagi
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. OJOL SUDIRMAN RUSH (Antar Kopi Kenangan / Fore & Hindari Macet)
 * ========================================================================== */
const OjolSudirmanRush: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [crashed, setCrashed] = useState(false);

  const stRef = useRef({
    lane: 1,
    speed: 220,
    score: 0,
    delivered: 0,
    crashed: false,
    items: [] as Array<{ lane: number; y: number; type: "coffee" | "bus" | "car" }>,
    spawnAccum: 0,
  });

  const moveLane = useCallback((delta: number) => {
    const s = stRef.current;
    if (s.crashed) return;
    s.lane = Math.max(0, Math.min(3, s.lane + delta));
  }, []);

  const resetRush = () => {
    stRef.current = {
      lane: 1,
      speed: 220,
      score: 0,
      delivered: 0,
      crashed: false,
      items: [],
      spawnAccum: 0,
    };
    setScore(0);
    setDelivered(0);
    setCrashed(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") moveLane(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") moveLane(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveLane]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const lanesX = [95, 165, 235, 305];

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stRef.current;

      if (!s.crashed) {
        s.speed = Math.min(440, s.speed + dt * 6);
        s.spawnAccum += dt;
        if (s.spawnAccum > 0.65) {
          s.spawnAccum = 0;
          const isCoffee = Math.random() > 0.58;
          s.items.push({
            lane: Math.floor(Math.random() * 4),
            y: -45,
            type: isCoffee ? "coffee" : Math.random() > 0.5 ? "bus" : "car",
          });
        }

        const playerY = 305;
        for (let i = s.items.length - 1; i >= 0; i--) {
          const it = s.items[i];
          it.y += (it.type === "coffee" ? s.speed : s.speed * 0.78) * dt;
          if (it.lane === s.lane && Math.abs(it.y - playerY) < 34) {
            if (it.type === "coffee") {
              s.delivered += 1;
              s.score += 300;
              setDelivered(s.delivered);
              setScore(s.score);
              soundEngine.playCashReward();
              onEarnCash(300, "Antar Kopi Fore/Kenangan");
              s.items.splice(i, 1);
              continue;
            } else {
              s.crashed = true;
              setCrashed(true);
            }
          }
          if (it.y > 410) s.items.splice(i, 1);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, 400, 360);
          ctx.fillStyle = "#334155";
          ctx.fillRect(55, 0, 290, 360);
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.setLineDash([18, 16]);
          ctx.lineWidth = 2;
          [130, 200, 270].forEach((lx) => {
            ctx.beginPath();
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx, 360);
            ctx.stroke();
          });
          ctx.setLineDash([]);

          for (const it of s.items) {
            const ix = lanesX[it.lane];
            if (it.type === "coffee") {
              ctx.fillStyle = "#10b981";
              ctx.beginPath();
              ctx.arc(ix, it.y, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 14px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("☕", ix, it.y + 5);
            } else {
              ctx.fillStyle = it.type === "bus" ? "#0284c7" : "#ef4444";
              ctx.fillRect(ix - 18, it.y - (it.type === "bus" ? 32 : 20), 36, it.type === "bus" ? 64 : 40);
            }
          }

          // Ojol rider
          const px = lanesX[s.lane];
          ctx.fillStyle = "#16a34a";
          ctx.fillRect(px - 14, 285, 28, 42);
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.arc(px, 298, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onEarnCash]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-emerald-500/40 bg-slate-900 px-4 py-2 text-xs sm:text-sm">
        <span>Order Kopi: <strong className="text-emerald-400">{delivered}</strong></span>
        <span>Pendapatan: <strong className="text-amber-300">${score}</strong></span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={360}
          className="h-[310px] w-[345px] rounded-xl border-2 border-emerald-400/50"
        />
        {crashed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/80">
            <p className="text-xl font-black text-red-400">KESEREMPET BUSWAY!</p>
            <p className="text-xs text-slate-300 mt-1">Total Antaran: {delivered} Kopi (+${score})</p>
            <button
              onClick={resetRush}
              className="mt-3 flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Tarik Order Lagi
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={() => moveLane(-1)} className="rounded-xl bg-slate-800 px-6 py-3 font-black active:bg-emerald-600">⬅ KIRI (A)</button>
        <button onClick={() => moveLane(1)} className="rounded-xl bg-slate-800 px-6 py-3 font-black active:bg-emerald-600">KANAN (D) ➡</button>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. PS5 GELUT BETAWI FIGHTER (Bang Jago Silat vs Preman Kota)
 * ========================================================================== */
const Ps5GelutFighter: React.FC<{
  onEarnCash: (amount: number, reason: string) => void;
}> = ({ onEarnCash }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pHp, setPHp] = useState(100);
  const [eHp, setEHp] = useState(100);
  const [special, setSpecial] = useState(25);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);

  const fRef = useRef({
    px: 140,
    ex: 420,
    pHp: 100,
    eHp: 100,
    special: 25,
    pAttack: 0,
    eAttack: 0,
    blocking: false,
    winner: null as "player" | "enemy" | null,
    aiCd: 0.9,
  });

  const strike = useCallback(
    (dmg: number, range: number, isUlt = false) => {
      const f = fRef.current;
      if (f.winner) return;
      if (isUlt && f.special < 100) return;
      if (isUlt) {
        f.special = 0;
        setSpecial(0);
      }
      f.pAttack = 0.25;
      soundEngine.playGunshot();
      if (Math.abs(f.ex - f.px) <= range) {
        f.eHp = Math.max(0, f.eHp - dmg);
        f.ex = Math.min(500, f.ex + (isUlt ? 55 : 22));
        f.special = Math.min(100, f.special + (isUlt ? 0 : 25));
        setEHp(f.eHp);
        setSpecial(f.special);
        if (f.eHp <= 0) {
          f.winner = "player";
          setWinner("player");
          soundEngine.playCashReward();
          onEarnCash(15000, "Juara Gelut Silat PS5");
        }
      }
    },
    [onEarnCash]
  );

  const stepPlayer = (dx: number) => {
    const f = fRef.current;
    if (f.winner) return;
    f.px = Math.max(55, Math.min(f.ex - 42, f.px + dx));
  };

  const resetFight = () => {
    fRef.current = {
      px: 140,
      ex: 420,
      pHp: 100,
      eHp: 100,
      special: 25,
      pAttack: 0,
      eAttack: 0,
      blocking: false,
      winner: null,
      aiCd: 0.9,
    };
    setPHp(100);
    setEHp(100);
    setSpecial(25);
    setWinner(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "a" || e.key === "ArrowLeft") stepPlayer(-20);
      if (e.key.toLowerCase() === "d" || e.key === "ArrowRight") stepPlayer(20);
      if (e.key.toLowerCase() === "j") strike(14, 92);
      if (e.key.toLowerCase() === "k") strike(20, 108);
      if (e.code === "Space") {
        e.preventDefault();
        strike(42, 160, true);
      }
      if (e.key.toLowerCase() === "l") fRef.current.blocking = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l") fRef.current.blocking = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [strike]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const f = fRef.current;

      if (!f.winner) {
        if (f.pAttack > 0) f.pAttack = Math.max(0, f.pAttack - dt);
        if (f.eAttack > 0) f.eAttack = Math.max(0, f.eAttack - dt);

        if (f.ex - f.px > 76) f.ex -= 55 * dt;
        f.aiCd -= dt;
        if (f.aiCd <= 0 && f.ex - f.px < 92) {
          f.aiCd = 1.05;
          f.eAttack = 0.25;
          const dmg = f.blocking ? 3 : 12;
          f.pHp = Math.max(0, f.pHp - dmg);
          setPHp(f.pHp);
          if (f.pHp <= 0) {
            f.winner = "enemy";
            setWinner("enemy");
          }
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 0, 260);
          grad.addColorStop(0, "#1e1b4b");
          grad.addColorStop(1, "#701a75");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 560, 220);
          ctx.fillStyle = "#27272a";
          ctx.fillRect(0, 220, 560, 70);

          // Player: Bang Jago Betawi
          ctx.fillStyle = f.blocking ? "#38bdf8" : "#ec4899";
          ctx.fillRect(f.px - 18, 130, 36, 90);
          ctx.fillStyle = "#fde68a";
          ctx.beginPath();
          ctx.arc(f.px, 114, 14, 0, Math.PI * 2);
          ctx.fill();
          if (f.pAttack > 0) {
            ctx.fillStyle = "#facc15";
            ctx.fillRect(f.px + 18, 152, 42, 14);
          }

          // Enemy: Preman Kota
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(f.ex - 18, 130, 36, 90);
          ctx.fillStyle = "#fed7aa";
          ctx.beginPath();
          ctx.arc(f.ex, 114, 14, 0, Math.PI * 2);
          ctx.fill();
          if (f.eAttack > 0) {
            ctx.fillStyle = "#f87171";
            ctx.fillRect(f.ex - 58, 152, 42, 14);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-full max-w-xl grid-cols-2 gap-4 rounded-xl border border-pink-500/40 bg-slate-900 p-3 text-xs">
        <div>
          <div className="flex justify-between font-bold text-pink-400">
            <span>BANG JAGO (KAMU)</span>
            <span>{pHp}%</span>
          </div>
          <div className="mt-1 h-2.5 w-full rounded bg-slate-800">
            <div className="h-full rounded bg-pink-500" style={{ width: `${pHp}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-cyan-300">Jurus Silat: {special}%</p>
        </div>
        <div>
          <div className="flex justify-between font-bold text-red-400">
            <span>PREMAN KOTA</span>
            <span>{eHp}%</span>
          </div>
          <div className="mt-1 h-2.5 w-full rounded bg-slate-800">
            <div className="h-full rounded bg-red-600" style={{ width: `${eHp}%` }} />
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={560} height={290} className="w-full max-w-[560px] rounded-xl border-2 border-pink-500/50" />
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/80">
            <p className={`text-2xl font-black ${winner === "player" ? "text-emerald-400" : "text-red-400"}`}>
              {winner === "player" ? "K.O.! KAMU MENANG +$15.000!" : "K.O.! COBA LAGI!"}
            </p>
            <button onClick={resetFight} className="mt-3 flex items-center gap-1 rounded-xl bg-pink-600 px-5 py-2 font-black text-xs">
              <RotateCcw className="h-4 w-4" /> Rematch
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => stepPlayer(-25)} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold">⬅ Mundur</button>
        <button onClick={() => stepPlayer(25)} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold">Maju ➡</button>
        <button onClick={() => strike(14, 92)} className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-black">👊 Pukul (J)</button>
        <button onClick={() => strike(20, 108)} className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black">🦵 Tendang (K)</button>
        <button
          disabled={special < 100}
          onClick={() => strike(42, 160, true)}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black disabled:opacity-40"
        >
          ⚡ Jurus Silat ({special}%)
        </button>
      </div>
    </div>
  );
};
