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

export type MinigameId = "snake" | "fps" | "drag";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl border border-pink-500/40 bg-slate-950/95 shadow-2xl shadow-pink-500/20 text-white">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-orange-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-pink-400" />
            <span className="font-bold tracking-wide text-sm sm:text-base">
              PORTAL MINI-GAMES • VINSKY ARCADE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "snake", label: "Neon Cyber Snake" },
                { id: "fps", label: "Urban Warzone FPS" },
                { id: "drag", label: "Sentul Drag 402m" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectGame(tab.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  activeGame === tab.id
                    ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={onClose}
              className="ml-2 rounded-lg bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500 hover:text-white transition"
              aria-label="Tutup Mini-Game"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {activeGame === "snake" && <NeonCyberSnake onEarnCash={onEarnCash} />}
          {activeGame === "fps" && <UrbanWarzoneFPS onEarnCash={onEarnCash} />}
          {activeGame === "drag" && <SentulDragRace onEarnCash={onEarnCash} />}
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
