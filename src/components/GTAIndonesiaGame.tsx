"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Smartphone,
  Laptop,
  Cpu,
  Play,
  MapPin,
  Volume2,
  VolumeX,
  Pause,
  Camera,
  Flame,
  Crosshair,
  RotateCw,
  LogOut,
  Car,
  Fuel,
  Flag,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  ImageDown,
  Coffee,
  Gamepad2,
  X,
} from "lucide-react";
import {
  HangoutSpotData,
  JABODETABEK_REGIONS,
  JabodetabekRegionId,
  MapLayoutData,
  fetchJabodetabekMapOSM,
  getLocalCachedMapLayout,
  getRegionById,
  worldToGps,
} from "@/game/JabodetabekMapFetcher";
import {
  CharacterInstance,
  createCharacterMesh,
  createPlazaDancerMesh,
  createVehicleMesh,
  ensureVehicleModelLoaded,
  preloadAllGameModels,
  VehicleInstance,
  VehicleKind,
  VEHICLE_SPECS,
} from "@/game/ModelRegistry";
import { disposeAllGeneratedTextures } from "@/game/IndonesianTextureGenerator";
import {
  BuildingCollider,
  TrafficLightMeshGroup,
  buildJakartaCityScene,
} from "@/game/CityBuilder";
import { soundEngine } from "@/game/SoundEngine";
import { SmartphoneHUD, TimeOfDay } from "./SmartphoneHUD";
import { MinigameId, MinigamesModal } from "./MinigamesModal";
import { HowToPlayModal } from "./HowToPlayModal";
import {
  JAKARTA_RADIO_CHANNELS,
  JakartaRadioHUD,
  RadioChannel,
} from "./JakartaRadioHUD";
import {
  GTASanAndreasRadar,
  GTASanAndreasStatusHUD,
  WEAPON_LIST,
  WeaponId,
} from "./GTASanAndreasHUD";

type ControlModePref = "auto" | "mobile" | "desktop";
type ScreenStage = "menu" | "loading" | "playing";
type CameraViewMode = "chase" | "hood" | "cockpit";

interface PoliceUnit {
  mesh: VehicleInstance;
  x: number;
  z: number;
  yaw: number;
}

interface TrafficUnit {
  mesh: VehicleInstance;
  x: number;
  z: number;
  yaw: number;
  baseSpeed: number;
  curSpeed: number;
  axis: "ns" | "ew";
  dir: 1 | -1;
}

interface PedestrianUnit {
  char: CharacterInstance;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  role: "walker_ns" | "walker_ew" | "hangout" | "ojol";
  baseX: number;
  baseZ: number;
  dir: 1 | -1;
  panicTimer: number;
  teloletTimer: number;
}

interface BulletItem {
  mesh: THREE.Mesh;
  active: boolean;
  vel: THREE.Vector3;
  life: number;
  isRocket: boolean;
}

interface ExplosionItem {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
}

const STORAGE_CONTROL_KEY = "vinsky_gta_control_mode";
const PORTFOLIO_URL = "https://vinsky-techfolio.vercel.app/";

const JAKARTA_MISSIONS = [
  {
    id: "kurir_kopi",
    title: "☕ Kurir Kopi Express",
    desc: "Antar kopi Fore ke Kopi Kenangan Mantan SCBD",
    targetX: -12,
    targetZ: -62,
    reward: 6000,
  },
  {
    id: "jemput_mrt",
    title: "🚕 Penumpang VIP MRT",
    desc: "Antar penumpang dari MRT HI ke Rental PS5 Blok M",
    targetX: 11,
    targetZ: 112,
    reward: 7500,
  },
  {
    id: "kurir_ps5",
    title: "🎮 Turnamen E-Sports PS5",
    desc: "Kirim stik PS5 ke Rental PS5 & Warnet Vinsky 24H",
    targetX: 11,
    targetZ: 72,
    reward: 8500,
  },
] as const;

function getJakartaStreetName(x: number, z: number, regionTitle: string): string {
  if (Math.hypot(x, z) < 38) return "📍 Bundaran HI • Monumen Selamat Datang";
  if (Math.abs(z + 150) < 20) return "📍 Simpang Susun Semanggi / Flyover Tol";
  if (Math.abs(x) < 22 && z < -25) return "📍 Jl. M.H. Thamrin • Koridor 1 Busway";
  if (Math.abs(x) < 22 && z >= 25) return "📍 Jl. Jend. Sudirman • Kawasan Bisnis SCBD";
  if (Math.abs(z) < 20) return "📍 Jl. Kebon Kacang – Jl. Imam Bonjol";
  return `📍 ${regionTitle}`;
}

const CreatorLink: React.FC<{ className?: string }> = ({ className = "" }) => (
  <a
    href={PORTFOLIO_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`font-bold text-cyan-300 hover:text-pink-400 hover:underline hover:drop-shadow-[0_0_10px_rgba(255,62,157,0.9)] transition ${className}`}
  >
    Ahmad Alvin Griffin (Vinsky)
  </a>
);

export default function GTAIndonesiaGame() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<ScreenStage>("menu");
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingTip, setLoadingTip] = useState("Menyiapkan kota Jakarta...");
  const [selectedRegionId, setSelectedRegionId] = useState<JabodetabekRegionId>("jakpus");
  const [selectedStartVehicle, setSelectedStartVehicle] = useState<VehicleKind>("supercar");
  const [controlPref, setControlPref] = useState<ControlModePref>("auto");
  const [resolvedMobile, setResolvedMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const [paused, setPaused] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [showOnboardingTip, setShowOnboardingTip] = useState(true);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  const [muted, setMuted] = useState(false);
  const [radioChannelIndex, setRadioChannelIndex] = useState(0);
  const [extraRadioChannels, setExtraRadioChannels] = useState<RadioChannel[]>([]);
  const [nearbyHangout, setNearbyHangout] = useState<HangoutSpotData | null>(null);
  const [activeCafeModal, setActiveCafeModal] = useState<HangoutSpotData | null>(null);
  const [activeMissionIdx, setActiveMissionIdx] = useState<number | null>(null);
  const [missionDistM, setMissionDistM] = useState(0);
  const [streetNameLabel, setStreetNameLabel] = useState("📍 Jl. Jend. Sudirman • Bundaran HI");

  const [inVehicle, setInVehicle] = useState(true);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>("chase");
  const [speedKmh, setSpeedKmh] = useState(0);
  const [fuelPct, setFuelPct] = useState(100);
  const [vehicleHpPct, setVehicleHpPct] = useState(100);
  const [nitroPct, setNitroPct] = useState(100);
  const [healthPct, setHealthPct] = useState(100);
  const [armorPct, setArmorPct] = useState(100);
  const [cash, setCash] = useState(35000);
  const [wantedLevel, setWantedLevel] = useState(0);
  const [weapon, setWeapon] = useState<WeaponId>("pistol");
  const [gameTimeLabel, setGameTimeLabel] = useState("14:25");
  const [calloutText, setCalloutText] = useState<string | null>(null);

  const [gps, setGps] = useState({ lat: -6.1949, lng: 106.8230 });
  const [radarState, setRadarState] = useState<{
    x: number;
    z: number;
    camYaw: number;
    traffic: Array<{ x: number; z: number }>;
    police: Array<{ x: number; z: number }>;
    raceTarget: { x: number; z: number } | null;
  }>({
    x: 5,
    z: 44,
    camYaw: 0,
    traffic: [],
    police: [],
    raceTarget: null,
  });

  const [mapSource, setMapSource] = useState<
    "local-cache" | "openstreetmap-live" | "jakarta-geojson"
  >("jakarta-geojson");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [currentVehicleKind, setCurrentVehicleKind] = useState<VehicleKind>("supercar");
  const [paintColor, setPaintColor] = useState("#dc2626");
  const [rimColor, setRimColor] = useState("#e2e8f0");
  const [plateText, setPlateText] = useState("B 1 VKY");
  const [neonEnabled, setNeonEnabled] = useState(false);

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [isRaining, setIsRaining] = useState(false);
  const [leftSignal, setLeftSignal] = useState(false);
  const [rightSignal, setRightSignal] = useState(false);
  const [hazardSignal, setHazardSignal] = useState(false);
  const [raceStatus, setRaceStatus] = useState<{
    active: boolean;
    checkpoint: number;
    total: number;
    timeSec: number;
  }>({ active: false, checkpoint: 0, total: 6, timeSec: 0 });

  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);
  const orbitTouchRef = useRef<{ x: number; y: number } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    if (!calloutText) return;
    const t = setTimeout(() => setCalloutText(null), 3600);
    return () => clearTimeout(t);
  }, [calloutText]);

  const resolveControlMode = useCallback((pref: ControlModePref) => {
    if (pref === "mobile") return true;
    if (pref === "desktop") return false;
    if (typeof window === "undefined") return false;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const canHover = window.matchMedia?.("(hover: hover)")?.matches ?? true;
    return isCoarse || (!canHover && window.innerWidth < 1024);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONTROL_KEY) as ControlModePref | null;
      if (saved === "auto" || saved === "mobile" || saved === "desktop") {
        setControlPref(saved);
        setResolvedMobile(resolveControlMode(saved));
      } else {
        setResolvedMobile(resolveControlMode("auto"));
      }
    } catch {
      setResolvedMobile(resolveControlMode("auto"));
    }

    const onResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setControlPref((curr) => {
        setResolvedMobile(resolveControlMode(curr));
        return curr;
      });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resolveControlMode]);

  const handleSelectControlPref = useCallback(
    (pref: ControlModePref) => {
      setControlPref(pref);
      setResolvedMobile(resolveControlMode(pref));
      try {
        localStorage.setItem(STORAGE_CONTROL_KEY, pref);
      } catch {}
    },
    [resolveControlMode]
  );

  const engineRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    worldGroup: THREE.Group | null;
    playerVehicle: VehicleInstance | null;
    character: CharacterInstance | null;
    dancer: ReturnType<typeof createPlazaDancerMesh> | null;
    layout: MapLayoutData;
    colliders: BuildingCollider[];
    policePool: PoliceUnit[];
    trafficPool: TrafficUnit[];
    pedestrians: PedestrianUnit[];
    trafficLights: TrafficLightMeshGroup[];
    bulletPool: BulletItem[];
    explosionPool: ExplosionItem[];
    rainPoints: THREE.Points | null;
    ambientLight: THREE.HemisphereLight | null;
    sunLight: THREE.DirectionalLight | null;
    cullableProps: THREE.Object3D[];
    raceCheckpoints: THREE.Vector3[];
    raceMarkerMesh: THREE.Mesh | null;
    missionBeaconMesh: THREE.Mesh | null;
    aiRacers: Array<{ mesh: VehicleInstance; progress: number; speed: number }>;
    ojolBikes: VehicleInstance[];
  }>({
    scene: null,
    camera: null,
    renderer: null,
    worldGroup: null,
    playerVehicle: null,
    character: null,
    dancer: null,
    layout: getLocalCachedMapLayout("jakpus"),
    colliders: [],
    policePool: [],
    trafficPool: [],
    pedestrians: [],
    trafficLights: [],
    bulletPool: [],
    explosionPool: [],
    rainPoints: null,
    ambientLight: null,
    sunLight: null,
    cullableProps: [],
    raceCheckpoints: [],
    raceMarkerMesh: null,
    missionBeaconMesh: null,
    aiRacers: [],
    ojolBikes: [],
  });

  const simRef = useRef({
    inVehicle: true,
    cameraMode: "chase" as CameraViewMode,
    timeOfDay: "morning" as TimeOfDay,
    isRaining: false,
    paused: false,
    wantedLevel: 0,
    engineStage: 1,
    weapon: "pistol" as WeaponId,
    health: 100,
    armor: 100,

    camOrbitYaw: 0,
    camOrbitPitch: 0.14,
    isDraggingCam: false,

    // Start tangent to Bundaran HI roundabout lane looking smoothly along Sudirman–Thamrin
    vehX: 12,
    vehY: 0,
    vehZ: 28,
    vehYaw: Math.PI * 0.78,
    vehSpeed: 0,
    vehPitch: 0,
    vehRoll: 0,
    fuel: 100,
    vehHp: 100,
    nitro: 100,

    charX: 15,
    charY: 0,
    charZ: 28,
    charYaw: Math.PI * 0.78,
    charVelY: 0,
    isJumping: false,
    isSwimming: false,

    leftTurn: false,
    rightTurn: false,
    hazard: false,
    headlightsOn: true,

    raceActive: false,
    raceCheckpointIdx: 0,
    raceTimer: 0,
    activeMissionIdx: null as number | null,
    lastTeloletAt: -99,
    lastPanicToastAt: -99,
  });

  const inputRef = useRef({
    throttle: 0,
    steer: 0,
    brake: false,
    nitro: false,
    jump: false,
    shoot: false,
    joyX: 0,
    joyY: 0,
    touchGas: false,
    touchBrake: false,
  });

  useEffect(() => {
    simRef.current.paused =
      paused ||
      howToPlayOpen ||
      Boolean(activeMinigame) ||
      Boolean(activeCafeModal) ||
      stage !== "playing";
    if (simRef.current.paused) {
      soundEngine.stopAll();
    }
  }, [paused, howToPlayOpen, activeMinigame, activeCafeModal, stage]);

  useEffect(() => {
    simRef.current.cameraMode = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    simRef.current.weapon = weapon;
  }, [weapon]);

  useEffect(() => {
    simRef.current.leftTurn = leftSignal;
    simRef.current.rightTurn = rightSignal;
    simRef.current.hazard = hazardSignal;
  }, [leftSignal, rightSignal, hazardSignal]);

  const applyEnvironmentLighting = useCallback((tod: TimeOfDay, rain: boolean) => {
    const { scene, ambientLight, sunLight, rainPoints } = engineRefs.current;
    if (!scene || !ambientLight || !sunLight) return;

    if (tod === "morning") {
      scene.fog = new THREE.FogExp2(rain ? 0x64748b : 0xdbeafe, rain ? 0.0038 : 0.0011);
      ambientLight.color.setHex(0xffffff);
      ambientLight.groundColor.setHex(0x64748b);
      ambientLight.intensity = rain ? 1.15 : 1.55;
      sunLight.color.setHex(0xfffbeb);
      sunLight.intensity = rain ? 1.4 : 2.6;
      sunLight.position.set(110, 185, 85);
      simRef.current.headlightsOn = rain;
      setGameTimeLabel("13:45");
    } else if (tod === "sunset") {
      scene.fog = new THREE.FogExp2(rain ? 0x4b2c4e : 0xf4a261, rain ? 0.004 : 0.0016);
      ambientLight.color.setHex(0xfde68a);
      ambientLight.groundColor.setHex(0x451a03);
      ambientLight.intensity = 1.3;
      sunLight.color.setHex(0xff8c42);
      sunLight.intensity = 2.7;
      sunLight.position.set(-165, 55, -120);
      simRef.current.headlightsOn = true;
      setGameTimeLabel("17:40");
    } else {
      scene.fog = new THREE.FogExp2(0x090c1e, rain ? 0.005 : 0.0022);
      ambientLight.color.setHex(0x818cf8);
      ambientLight.groundColor.setHex(0x09090b);
      ambientLight.intensity = 0.78;
      sunLight.color.setHex(0x93c5fd);
      sunLight.intensity = 0.95;
      sunLight.position.set(80, 120, -80);
      simRef.current.headlightsOn = true;
      setGameTimeLabel("22:15");
    }

    if (rainPoints) rainPoints.visible = rain;
  }, []);

  const buildCityWorld = useCallback(
    (layout: MapLayoutData, tod: TimeOfDay, rain: boolean) => {
      const { worldGroup } = engineRefs.current;
      if (!worldGroup) return;

      const built = buildJakartaCityScene(worldGroup, layout, tod, rain);
      engineRefs.current.colliders = built.colliders;
      engineRefs.current.cullableProps = built.cullableProps;
      engineRefs.current.trafficLights = built.trafficLights;

      applyEnvironmentLighting(tod, rain);
    },
    [applyEnvironmentLighting]
  );

  const handleTakeScreenshot = useCallback(() => {
    const renderer = engineRefs.current.renderer;
    const scene = engineRefs.current.scene;
    const camera = engineRefs.current.camera;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const glCanvas = renderer.domElement;

    const out = document.createElement("canvas");
    out.width = glCanvas.width;
    out.height = glCanvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(glCanvas, 0, 0);

    const barH = Math.max(62, Math.round(out.height * 0.09));
    ctx.fillStyle = "rgba(7, 8, 15, 0.85)";
    ctx.fillRect(0, out.height - barH, out.width, barH);
    ctx.fillStyle = "#ff3e9d";
    ctx.fillRect(0, out.height - barH, out.width, 3);

    const region = getRegionById(selectedRegionId);
    const vehName =
      VEHICLE_SPECS.find((v) => v.id === currentVehicleKind)?.name ?? "Jalan Kaki";

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(16, Math.round(barH * 0.34))}px sans-serif`;
    ctx.fillText(
      `GTA Indonesia • Ahmad Alvin Griffin (Vinsky)`,
      22,
      out.height - barH + Math.round(barH * 0.44)
    );

    ctx.fillStyle = "#67e8f9";
    ctx.font = `600 ${Math.max(12, Math.round(barH * 0.24))}px monospace`;
    ctx.fillText(
      `📍 ${region.areaLabel} (${region.title}) | GPS: ${gps.lat.toFixed(
        5
      )}, ${gps.lng.toFixed(5)} | 🚗 ${vehName}`,
      22,
      out.height - Math.round(barH * 0.18)
    );

    const link = document.createElement("a");
    link.download = `GTA-Indonesia-Vinsky-${region.id}-${Date.now()}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
    soundEngine.playCashReward();
    showToast("📸 Screenshot Jakarta ber-watermark berhasil diunduh!");
  }, [currentVehicleKind, gps.lat, gps.lng, selectedRegionId, showToast]);

  const spawnPlayerVehicle = useCallback(
    async (kind: VehicleKind, overridePos?: { x: number; z: number }) => {
      const spec = VEHICLE_SPECS.find((s) => s.id === kind) ?? VEHICLE_SPECS[0];
      if (spec.glbPath) {
        showToast(`⏳ Memuat model 3D ${spec.name}...`);
        await ensureVehicleModelLoaded(kind);
      }

      const { scene, playerVehicle, character } = engineRefs.current;
      if (!scene) return;

      if (playerVehicle) {
        if (character && character.group.parent === playerVehicle.group) {
          scene.add(character.group);
        }
        scene.remove(playerVehicle.group);
        playerVehicle.dispose();
      }

      const nextVeh = createVehicleMesh(kind, {
        paintColor: spec.defaultColor,
        rimColor,
        plateText: spec.defaultPlate,
        neonEnabled,
        neonColor: "#ff3e9d",
      });

      if (overridePos) {
        simRef.current.vehX = overridePos.x;
        simRef.current.vehZ = overridePos.z;
      }
      simRef.current.vehY = 0;
      simRef.current.vehSpeed = 0;
      simRef.current.fuel = 100;
      simRef.current.vehHp = 100;
      simRef.current.inVehicle = true;

      nextVeh.group.position.set(simRef.current.vehX, 0, simRef.current.vehZ);
      nextVeh.group.rotation.y = simRef.current.vehYaw;
      scene.add(nextVeh.group);

      if (character) {
        character.setSittingInCabin(true);
        character.group.position.copy(nextVeh.cabinFit.seatOffset);
        character.group.rotation.set(0, 0, 0);
        nextVeh.group.add(character.group);
      }

      engineRefs.current.playerVehicle = nextVeh;
      setCurrentVehicleKind(kind);
      setPaintColor(spec.defaultColor);
      setPlateText(spec.defaultPlate);
      setInVehicle(true);
      setFuelPct(100);
      setVehicleHpPct(100);
      setCalloutText(spec.name);
      showToast(`🚗 Kendaraan aktif: ${spec.name}`);
    },
    [neonEnabled, rimColor, showToast]
  );

  const toggleEnterExitVehicle = useCallback(() => {
    const { scene, playerVehicle, character, trafficPool } = engineRefs.current;
    if (!scene || !playerVehicle || !character) return;

    if (simRef.current.inVehicle) {
      const doorAngle = simRef.current.vehYaw - Math.PI / 2;
      simRef.current.charX = simRef.current.vehX + Math.sin(doorAngle) * 2.4;
      simRef.current.charZ = simRef.current.vehZ + Math.cos(doorAngle) * 2.4;
      simRef.current.charY = 0;
      simRef.current.charYaw = simRef.current.vehYaw;
      simRef.current.inVehicle = false;

      character.setSittingInCabin(false);
      character.group.position.set(simRef.current.charX, 0, simRef.current.charZ);
      character.group.rotation.y = simRef.current.charYaw;
      scene.add(character.group);

      setInVehicle(false);
      soundEngine.updateEngine(0, false);
      showToast("Turun ke jalan (Tekan F dekat mobil mana pun untuk masuk/carjack!)");
    } else {
      const distOwn = Math.hypot(
        simRef.current.charX - simRef.current.vehX,
        simRef.current.charZ - simRef.current.vehZ
      );

      let closestAI: TrafficUnit | null = null;
      let closestAIDist = 6.5;
      for (const tr of trafficPool) {
        const d = Math.hypot(
          simRef.current.charX - tr.mesh.group.position.x,
          simRef.current.charZ - tr.mesh.group.position.z
        );
        if (d < closestAIDist) {
          closestAIDist = d;
          closestAI = tr;
        }
      }

      if (closestAI && closestAIDist < distOwn) {
        const hjKind = closestAI.mesh.kind;
        const hjX = closestAI.mesh.group.position.x;
        const hjZ = closestAI.mesh.group.position.z;
        const hjYaw = closestAI.yaw;

        closestAI.x = -260;
        closestAI.z = -260;

        simRef.current.vehX = hjX;
        simRef.current.vehZ = hjZ;
        simRef.current.vehYaw = hjYaw;
        spawnPlayerVehicle(hjKind, { x: hjX, z: hjZ });

        const nextW = Math.min(5, simRef.current.wantedLevel + 1);
        simRef.current.wantedLevel = nextW;
        setWantedLevel(nextW);
        showToast(`🚨 CARJACKED ${closestAI.mesh.spec.name}! Wanted ★${nextW}`);
        return;
      }

      if (distOwn > 8) {
        showToast("Dekati mobilmu atau mobil lalu lintas (< 7m) lalu tekan F!");
        return;
      }

      simRef.current.inVehicle = true;
      character.setSittingInCabin(true);
      character.group.position.copy(playerVehicle.cabinFit.seatOffset);
      character.group.rotation.set(0, 0, 0);
      playerVehicle.group.add(character.group);

      setInVehicle(true);
      setCalloutText(playerVehicle.spec.name);
      showToast(`Masuk ke ${playerVehicle.spec.name}`);
    }
  }, [spawnPlayerVehicle, showToast]);

  const spawnExplosionAt = useCallback((pos: THREE.Vector3) => {
    const exp = engineRefs.current.explosionPool.find((e) => !e.active);
    if (!exp) return;
    exp.active = true;
    exp.life = 0.6;
    exp.mesh.visible = true;
    exp.mesh.position.copy(pos);
    exp.mesh.scale.setScalar(1);
  }, []);

  const fireWeapon = useCallback(() => {
    if (simRef.current.inVehicle || simRef.current.paused) return;
    if (simRef.current.weapon === "fist") {
      soundEngine.playShiftGear();
      return;
    }

    const pool = engineRefs.current.bulletPool;
    const item = pool.find((b) => !b.active);
    if (!item) return;

    const dirX = Math.sin(simRef.current.charYaw);
    const dirZ = Math.cos(simRef.current.charYaw);
    const isRocket = simRef.current.weapon === "rpg";

    item.active = true;
    item.life = isRocket ? 1.8 : 1.0;
    item.isRocket = isRocket;
    item.mesh.visible = true;
    item.mesh.scale.setScalar(isRocket ? 2.4 : 1.0);
    item.mesh.position.set(
      simRef.current.charX + dirX * 0.65,
      simRef.current.charY + 1.32,
      simRef.current.charZ + dirZ * 0.65
    );
    const spd = isRocket ? 42 : 76;
    item.vel.set(dirX * spd, 0, dirZ * spd);

    soundEngine.playGunshot();

    if (simRef.current.wantedLevel < 5) {
      const nextW = Math.min(5, simRef.current.wantedLevel + 1);
      simRef.current.wantedLevel = nextW;
      setWantedLevel(nextW);
      showToast(`🚨 WANTED LEVEL BINTANG ${nextW}! Polisi PJR mengejar!`);
    }
  }, [showToast]);

  const startStreetRace = useCallback(() => {
    const { scene } = engineRefs.current;
    if (!scene) return;

    engineRefs.current.aiRacers.forEach((r) => {
      scene.remove(r.mesh.group);
      r.mesh.dispose();
    });
    engineRefs.current.aiRacers = [];

    const cps: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, -90),
      new THREE.Vector3(90, 0, -90),
      new THREE.Vector3(150, 0, 0),
      new THREE.Vector3(150, 0, 150),
      new THREE.Vector3(0, 0, 150),
      new THREE.Vector3(0, 0, 44),
    ];
    engineRefs.current.raceCheckpoints = cps;

    if (!engineRefs.current.raceMarkerMesh) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(5.5, 5.5, 14, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xff3e9d,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
      );
      scene.add(ring);
      engineRefs.current.raceMarkerMesh = ring;
    }
    engineRefs.current.raceMarkerMesh.visible = true;
    engineRefs.current.raceMarkerMesh.position.set(cps[0].x, 7, cps[0].z);

    simRef.current.vehX = -3.2;
    simRef.current.vehZ = 44;
    simRef.current.vehYaw = Math.PI;
    simRef.current.vehSpeed = 0;

    (["lambo", "supercar"] as VehicleKind[]).forEach((kind, i) => {
      const rival = createVehicleMesh(kind, {
        paintColor: i === 0 ? "#00f0ff" : "#a855f7",
        plateText: `B 90${i} RCE`,
        neonEnabled: true,
      });
      rival.group.position.set(3.2 + i * 3.8, 0, 44);
      rival.group.rotation.y = Math.PI;
      scene.add(rival.group);
      engineRefs.current.aiRacers.push({
        mesh: rival,
        progress: 0,
        speed: 34 + i * 4,
      });
    });

    simRef.current.raceActive = true;
    simRef.current.raceCheckpointIdx = 0;
    simRef.current.raceTimer = 0;
    setRaceStatus({ active: true, checkpoint: 1, total: cps.length, timeSec: 0 });
    setPhoneOpen(false);
    showToast("🏁 BALAP LIAR SUDIRMAN DIMULAI! Kejar checkpoint neon!");
  }, [showToast]);

  const handleFastTravel = useCallback(
    async (regionId: JabodetabekRegionId) => {
      setSelectedRegionId(regionId);
      const cached = getLocalCachedMapLayout(regionId);
      engineRefs.current.layout = cached;
      setMapSource(cached.source);
      buildCityWorld(cached, simRef.current.timeOfDay, simRef.current.isRaining);

      simRef.current.vehX = 5;
      simRef.current.vehZ = 44;
      simRef.current.vehSpeed = 0;
      simRef.current.charX = 8;
      simRef.current.charZ = 44;
      setGps({ lat: cached.region.lat, lng: cached.region.lng });
      setCalloutText(`${cached.region.areaLabel} — ${cached.region.title}`);
      showToast(`📍 Tiba di ${cached.region.areaLabel}: ${cached.region.title}`);

      const live = await fetchJabodetabekMapOSM(regionId);
      if (live.source === "openstreetmap-live") {
        engineRefs.current.layout = live;
        setMapSource("openstreetmap-live");
        buildCityWorld(live, simRef.current.timeOfDay, simRef.current.isRaining);
      }
    },
    [buildCityWorld, showToast]
  );

  const enterHangoutSpot = useCallback(
    (spot: HangoutSpotData) => {
      if (spot.kind === "rental_ps") {
        setActiveMinigame("ps_penalty");
        showToast(`🎮 Masuk ${spot.name} — Pilih 1 dari 6 Game PS5 / Warnet!`);
      } else {
        setActiveCafeModal(spot);
      }
    },
    [showToast]
  );

  const handleTeleportToSpot = useCallback(
    (spotId: string) => {
      const spot = engineRefs.current.layout.hangoutSpots?.find((s) => s.id === spotId);
      if (!spot) return;
      const laneX = spot.x > 0 ? 8.8 : -8.8;
      simRef.current.vehX = laneX;
      simRef.current.vehZ = spot.z;
      simRef.current.vehYaw = spot.x > 0 ? Math.PI : 0;
      simRef.current.vehSpeed = 0;
      simRef.current.camOrbitYaw = spot.x > 0 ? -0.52 : 0.52;
      simRef.current.camOrbitPitch = 0.14;
      simRef.current.charX = spot.x + (spot.x > 0 ? -2.2 : 2.2);
      simRef.current.charZ = spot.z;
      setPhoneOpen(false);
      setCalloutText(spot.name);
      showToast(`📍 Tiba di depan ${spot.name}! Tekan [G] atau klik banner untuk masuk.`);
    },
    [showToast]
  );

  const triggerTelolet = useCallback(() => {
    const basuriLabel = soundEngine.playTeloletBasuri();
    const nowSec = performance.now() * 0.001;
    const anchorX = simRef.current.inVehicle ? simRef.current.vehX : simRef.current.charX;
    const anchorZ = simRef.current.inVehicle ? simRef.current.vehZ : simRef.current.charZ;
    let cheeredCount = 0;
    for (const ped of engineRefs.current.pedestrians) {
      if (Math.hypot(ped.x - anchorX, ped.z - anchorZ) < 32) {
        ped.teloletTimer = 3.6;
        ped.yaw = Math.atan2(anchorX - ped.x, anchorZ - ped.z);
        cheeredCount += 1;
      }
    }
    if (cheeredCount > 0 && nowSec - simRef.current.lastTeloletAt > 3.5) {
      simRef.current.lastTeloletAt = nowSec;
      setCash((c) => c + 150);
      showToast(`🎺 ${basuriLabel}: OM TELOLET OM!! Warga senang (+$150)!`);
    } else {
      showToast(`🎺 ${basuriLabel}!`);
    }
  }, [showToast]);

  const startOrCycleMission = useCallback(() => {
    const cur = simRef.current.activeMissionIdx;
    const nextIdx = cur === null ? 0 : (cur + 1) % JAKARTA_MISSIONS.length;
    simRef.current.activeMissionIdx = nextIdx;
    setActiveMissionIdx(nextIdx);
    const m = JAKARTA_MISSIONS[nextIdx];
    const beacon = engineRefs.current.missionBeaconMesh;
    if (beacon) {
      beacon.position.set(m.targetX, 7.5, m.targetZ);
      beacon.visible = true;
    }
    soundEngine.playCashReward();
    showToast(`📋 MISI BARU: ${m.title} — ${m.desc} (+$${m.reward.toLocaleString("id-ID")})`);
  }, [showToast]);

  const handleStartGame = useCallback(async () => {
    soundEngine.unlock();
    setStage("loading");
    setLoadingPct(8);
    setLoadingTip(
      `Menyiapkan peta nyata Jakarta (.GeoJSON) & model 3D high-poly...`
    );

    const cached = getLocalCachedMapLayout(selectedRegionId);
    engineRefs.current.layout = cached;
    setMapSource(cached.source);
    setGps({ lat: cached.region.lat, lng: cached.region.lng });

    await Promise.all([
      preloadAllGameModels(selectedStartVehicle, (pct, label) => {
        setLoadingPct(Math.max(10, Math.min(95, pct)));
        setLoadingTip(label);
      }),
      Promise.race([
        fetchJabodetabekMapOSM(selectedRegionId).then((live) => {
          engineRefs.current.layout = live;
          setMapSource(live.source);
        }),
        new Promise<void>((res) => setTimeout(res, 2200)),
      ]),
    ]);

    setLoadingPct(100);
    setLoadingTip("Memasuki Kota Jakarta...");
    setTimeout(() => {
      setStage("playing");
      const r = getRegionById(selectedRegionId);
      setCalloutText(`${r.areaLabel} — ${r.title}`);
    }, 220);
  }, [selectedRegionId, selectedStartVehicle]);

  useEffect(() => {
    if (stage !== "playing") return;
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Realistic 3D PBR Environment Map Reflections on car bodies, chrome & skyscraper glass
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.2,
      650
    );

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 360;
    const d = 100;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const RAIN_COUNT = 900;
    const rainPositions = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      rainPositions[i * 3 + 0] = (Math.random() - 0.5) * 140;
      rainPositions[i * 3 + 1] = Math.random() * 45;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.24,
      transparent: true,
      opacity: 0.72,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = simRef.current.isRaining;
    scene.add(rainPoints);

    const bulletGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const bulletPool: BulletItem[] = [];
    for (let i = 0; i < 32; i++) {
      const m = new THREE.Mesh(bulletGeo, bulletMat);
      m.visible = false;
      scene.add(m);
      bulletPool.push({
        mesh: m,
        active: false,
        vel: new THREE.Vector3(),
        life: 0,
        isRocket: false,
      });
    }

    const expGeo = new THREE.SphereGeometry(1, 12, 10);
    const expMat = new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 0.85,
    });
    const explosionPool: ExplosionItem[] = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(expGeo, expMat.clone());
      m.visible = false;
      scene.add(m);
      explosionPool.push({ mesh: m, active: false, life: 0 });
    }

    const character = createCharacterMesh();
    scene.add(character.group);

    const dancer = createPlazaDancerMesh();
    dancer.group.position.set(-16.5, 0.34, 16.5);
    scene.add(dancer.group);

    const pedestrians: PedestrianUnit[] = [];
    const pedTints = [
      "#ec4899",
      "#0ea5e9",
      "#f59e0b",
      "#10b981",
      "#6366f1",
      "#ef4444",
      "#16a34a",
      "#a855f7",
    ];
    // 1. 14 Sidewalk walkers on Thamrin-Sudirman North-South corridor
    for (let i = 0; i < 14; i++) {
      const pChar = createCharacterMesh({ tintHex: pedTints[i % pedTints.length] });
      const baseX = i % 2 === 0 ? -13.6 : 13.6;
      const pz = -210 + i * 32;
      const dir: 1 | -1 = i % 3 === 0 ? -1 : 1;
      pChar.group.position.set(baseX, 0.22, pz);
      pChar.group.rotation.y = dir > 0 ? 0 : Math.PI;
      scene.add(pChar.group);
      pedestrians.push({
        char: pChar,
        x: baseX,
        z: pz,
        yaw: dir > 0 ? 0 : Math.PI,
        speed: 1.85 + (i % 3) * 0.42,
        role: "walker_ns",
        baseX,
        baseZ: pz,
        dir,
        panicTimer: 0,
        teloletTimer: 0,
      });
    }

    // 2. 6 Cross-corridor walkers (Kebon Kacang / Imam Bonjol East-West)
    for (let i = 0; i < 6; i++) {
      const pChar = createCharacterMesh({ tintHex: pedTints[(i + 2) % pedTints.length] });
      const px = -180 + i * 72;
      const baseZ = i % 2 === 0 ? -12.6 : 12.6;
      const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      pChar.group.position.set(px, 0.22, baseZ);
      pChar.group.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(pChar.group);
      pedestrians.push({
        char: pChar,
        x: px,
        z: baseZ,
        yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        speed: 1.7 + (i % 2) * 0.35,
        role: "walker_ew",
        baseX: px,
        baseZ,
        dir,
        panicTimer: 0,
        teloletTimer: 0,
      });
    }

    // 3. 6 lively Cafe & Rental PS Hangout NPCs standing beside patio tables (not clipping tabletops)
    const hangoutPositions = [
      { x: 16.4, z: 43.2, yaw: -Math.PI / 2 },
      { x: 16.6, z: 48.0, yaw: -Math.PI * 0.72 },
      { x: -16.4, z: -61.2, yaw: Math.PI / 2 },
      { x: -16.6, z: -65.8, yaw: Math.PI * 0.35 },
      { x: 16.5, z: 71.2, yaw: -Math.PI / 2 },
      { x: 16.6, z: 76.2, yaw: -Math.PI * 0.45 },
    ];
    hangoutPositions.forEach((hp, i) => {
      const pChar = createCharacterMesh({ tintHex: pedTints[(i + 4) % pedTints.length] });
      pChar.group.position.set(hp.x, 0.24, hp.z);
      pChar.group.rotation.y = hp.yaw;
      scene.add(pChar.group);
      pedestrians.push({
        char: pChar,
        x: hp.x,
        z: hp.z,
        yaw: hp.yaw,
        speed: 0,
        role: "hangout",
        baseX: hp.x,
        baseZ: hp.z,
        dir: i % 2 === 0 ? 1 : -1,
        panicTimer: 0,
        teloletTimer: 0,
      });
    });

    // 4. 2 Ojol Drivers (Green jacket + helmet) + Parked Ojol Bikes near Kopi Kenangan & Fore Coffee
    const ojolBikes: VehicleInstance[] = [];
    [
      { x: 16.0, z: 38.2, bx: 15.6, bz: 36.2, yaw: Math.PI },
      { x: -16.0, z: -56.2, bx: -15.6, bz: -54.2, yaw: 0 },
    ].forEach((oj, idx) => {
      const pChar = createCharacterMesh({ tintHex: "#16a34a", isOjol: true });
      pChar.group.position.set(oj.x, 0.22, oj.z);
      pChar.group.rotation.y = oj.yaw;
      scene.add(pChar.group);
      pedestrians.push({
        char: pChar,
        x: oj.x,
        z: oj.z,
        yaw: oj.yaw,
        speed: 0,
        role: "ojol",
        baseX: oj.x,
        baseZ: oj.z,
        dir: 1,
        panicTimer: 0,
        teloletTimer: 0,
      });

      const bike = createVehicleMesh("motor", {
        paintColor: "#16a34a",
        plateText: `B ${6610 + idx} OJL`,
      });
      bike.group.position.set(oj.bx, 0, oj.bz);
      bike.group.rotation.y = oj.yaw + 0.35;
      scene.add(bike.group);
      ojolBikes.push(bike);
    });
    engineRefs.current.ojolBikes = ojolBikes;

    engineRefs.current.scene = scene;
    engineRefs.current.camera = camera;
    engineRefs.current.renderer = renderer;
    engineRefs.current.worldGroup = worldGroup;
    engineRefs.current.ambientLight = ambientLight;
    engineRefs.current.sunLight = sunLight;
    engineRefs.current.rainPoints = rainPoints;
    engineRefs.current.bulletPool = bulletPool;
    engineRefs.current.explosionPool = explosionPool;
    engineRefs.current.character = character;
    engineRefs.current.dancer = dancer;
    engineRefs.current.pedestrians = pedestrians;

    const missionBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 15, 22, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      })
    );
    missionBeacon.visible = false;
    scene.add(missionBeacon);
    engineRefs.current.missionBeaconMesh = missionBeacon;

    buildCityWorld(
      engineRefs.current.layout,
      simRef.current.timeOfDay,
      simRef.current.isRaining
    );
    spawnPlayerVehicle(selectedStartVehicle, { x: 12, z: 28 });

    // High-Poly Jakarta Rush-Hour AI Traffic Vehicles (BMW M2, SU7, Mercy G63, Ferrari, Lambo, TransJakarta, Bluebird, Executive Sedan, Polisi PJR)
    const trafficPool: TrafficUnit[] = [];
    const trafficKinds: VehicleKind[] = [
      "bmw",
      "sport",
      "mercy",
      "supercar",
      "lambo",
      "bus_transjakarta",
      "bluebird",
      "sedan",
      "police_pjr",
    ];
    const trafficColors = [
      "#f8fafc",
      "#38bdf8",
      "#dc2626",
      "#facc15",
      "#e11d48",
      "#0284c7",
      "#06b6d4",
      "#0f172a",
      "#475569",
    ];
    const laneRoads = [-150, -90, 0, 90, 150];

    for (let i = 0; i < 28; i++) {
      const kind = trafficKinds[i % trafficKinds.length];
      const v = createVehicleMesh(kind, {
        paintColor: trafficColors[i % trafficColors.length],
        plateText: `B ${1200 + i * 73} JKT`,
      });
      const isBus = kind === "bus_transjakarta";
      const axis: "ns" | "ew" = isBus ? "ns" : i % 2 === 0 ? "ns" : "ew";
      const dir: 1 | -1 = i % 4 < 2 ? 1 : -1;
      const roadCoord = isBus ? 0 : laneRoads[i % laneRoads.length];
      const laneOffset = isBus ? -4.5 : dir > 0 ? 5.2 : -5.2;
      const progress = -250 + ((i * 41) % 500);

      const x = axis === "ns" ? roadCoord + laneOffset : progress;
      const z = axis === "ns" ? progress : roadCoord + laneOffset;
      const yaw =
        axis === "ns" ? (dir > 0 ? 0 : Math.PI) : dir > 0 ? Math.PI / 2 : -Math.PI / 2;

      v.group.position.set(x, 0, z);
      v.group.rotation.y = yaw;
      scene.add(v.group);
      const baseSpeed = 11 + (i % 4) * 3;
      trafficPool.push({
        mesh: v,
        x,
        z,
        yaw,
        baseSpeed,
        curSpeed: baseSpeed,
        axis,
        dir,
      });
    }
    engineRefs.current.trafficPool = trafficPool;

    const policePool: PoliceUnit[] = [];
    for (let i = 0; i < 5; i++) {
      const pv = createVehicleMesh("police_pjr");
      pv.group.visible = false;
      scene.add(pv.group);
      policePool.push({ mesh: pv, x: 90 + i * 25, z: -120, yaw: 0 });
    }
    engineRefs.current.policePool = policePool;

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    const tmpVec = new THREE.Vector3();
    const camTargetPos = new THREE.Vector3();
    const camLookTarget = new THREE.Vector3();

    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const timeSec = now * 0.001;

      const s = simRef.current;
      const inp = inputRef.current;
      const veh = engineRefs.current.playerVehicle;
      const char = engineRefs.current.character;

      const cycle = timeSec % 12;
      const nsRed = cycle >= 6;
      const ewRed = cycle < 6;
      for (const tl of engineRefs.current.trafficLights) {
        tl.redNS.color.setHex(nsRed ? 0xef4444 : 0x27272a);
        tl.yellowNS.color.setHex(cycle >= 5 && cycle < 6 ? 0xfacc15 : 0x27272a);
        tl.greenNS.color.setHex(cycle < 5 ? 0x22c55e : 0x27272a);
        tl.redEW.color.setHex(ewRed ? 0xef4444 : 0x27272a);
        tl.yellowEW.color.setHex(cycle >= 11 ? 0xfacc15 : 0x27272a);
        tl.greenEW.color.setHex(cycle >= 6 && cycle < 11 ? 0x22c55e : 0x27272a);
      }

      if (!s.paused && veh && char) {
        const throttle = Math.max(
          -1,
          Math.min(1, inp.throttle + (inp.touchGas ? 1 : 0) - (inp.touchBrake ? 1 : 0) - inp.joyY)
        );
        const steer = Math.max(-1, Math.min(1, inp.steer - inp.joyX));

        const targetX = s.inVehicle ? s.vehX : s.charX;
        const targetZ = s.inVehicle ? s.vehZ : s.charZ;

        const inWater = engineRefs.current.layout.waterZones.some(
          (w) =>
            Math.abs(targetX - w.x) < w.width / 2 &&
            Math.abs(targetZ - w.z) < w.depth / 2
        );

        const onFlyoverRamp =
          Math.abs(targetZ + 150) < 9 &&
          ((targetX > -375 && targetX < -315) || (targetX > 315 && targetX < 375));
        const onFlyoverDeck = Math.abs(targetZ + 150) < 8 && Math.abs(targetX) <= 320;

        if (s.inVehicle) {
          const spec = veh.spec;
          const stageMult = 1 + (s.engineStage - 1) * 0.14;
          const maxSpdMs = (spec.maxSpeedKmh / 3.6) * stageMult;
          const useNitro = inp.nitro && s.nitro > 1 && throttle > 0.1;

          if (useNitro) s.nitro = Math.max(0, s.nitro - dt * 26);
          else s.nitro = Math.min(100, s.nitro + dt * 7);

          if (s.fuel <= 0) {
            s.vehSpeed *= 0.96;
          } else if (throttle > 0.05) {
            const accel = spec.acceleration * 0.56 * stageMult * (useNitro ? 1.65 : 1.0);
            s.vehSpeed = Math.min(
              maxSpdMs * (useNitro ? 1.18 : 1),
              s.vehSpeed + accel * throttle * dt
            );
            s.fuel = Math.max(0, s.fuel - dt * 0.4);
          } else if (throttle < -0.05) {
            if (s.vehSpeed > 1) s.vehSpeed = Math.max(0, s.vehSpeed - 38 * dt);
            else s.vehSpeed = Math.max(-maxSpdMs * 0.35, s.vehSpeed + 18 * throttle * dt);
          } else {
            s.vehSpeed *= Math.pow(0.45, dt);
            if (Math.abs(s.vehSpeed) < 0.1) s.vehSpeed = 0;
          }

          const drifting = inp.brake && Math.abs(s.vehSpeed) > 6;
          if (inp.brake && !drifting) s.vehSpeed *= Math.pow(0.05, dt);
          else if (drifting) s.vehSpeed *= Math.pow(0.75, dt);

          const speedFactor = Math.min(1, Math.abs(s.vehSpeed) / 7);
          const turnDir = s.vehSpeed >= -0.2 ? 1 : -1;
          const steerGain = spec.handling * (drifting ? 1.45 : 1.0) * speedFactor * turnDir;
          s.vehYaw += steer * steerGain * dt;

          if (!s.isDraggingCam && Math.abs(s.vehSpeed) > 3) {
            s.camOrbitYaw *= Math.pow(0.18, dt);
          }

          let nextX = s.vehX + Math.sin(s.vehYaw) * s.vehSpeed * dt;
          let nextZ = s.vehZ + Math.cos(s.vehYaw) * s.vehSpeed * dt;

          if (spec.isAircraft) {
            if (s.vehSpeed > 26 && throttle > 0) {
              s.vehY = Math.min(75, s.vehY + (s.vehSpeed - 24) * 0.35 * dt);
            } else if (s.vehY > 0) {
              s.vehY = Math.max(0, s.vehY - (throttle < 0 ? 12 : 4) * dt);
            }
          } else if (spec.isBoat) {
            s.vehY = inWater ? Math.sin(timeSec * 3.5) * 0.14 : 0;
            if (!inWater) s.vehSpeed *= 0.9;
          } else {
            if (onFlyoverDeck && s.vehY > 4) s.vehY = 8.9;
            else if (onFlyoverRamp) {
              const distFromOuter = Math.min(
                Math.abs(targetX + 375),
                Math.abs(375 - targetX)
              );
              s.vehY = Math.min(8.9, (distFromOuter / 56) * 8.9);
            } else {
              s.vehY = 0;
            }
            if (inWater) s.vehSpeed *= 0.85;
          }

          nextX = Math.max(-390, Math.min(390, nextX));
          nextZ = Math.max(-390, Math.min(390, nextZ));

          if (engineRefs.current.layout.region.id === "jakpus" && s.vehY < 4) {
            const distHI = Math.hypot(nextX, nextZ);
            if (distHI < 20.8) {
              nextX = (nextX / Math.max(0.1, distHI)) * 20.8;
              nextZ = (nextZ / Math.max(0.1, distHI)) * 20.8;
              s.vehSpeed *= 0.5;
            }
          }

          if (s.vehY < 6) {
            const margin = 2.1;
            for (const c of engineRefs.current.colliders) {
              if (
                nextX > c.minX - margin &&
                nextX < c.maxX + margin &&
                nextZ > c.minZ - margin &&
                nextZ < c.maxZ + margin
              ) {
                nextX = s.vehX;
                nextZ = s.vehZ;
                if (Math.abs(s.vehSpeed) > 10) s.vehHp = Math.max(10, s.vehHp - 4);
                s.vehSpeed *= -0.3;
                break;
              }
            }
          }

          s.vehX = nextX;
          s.vehZ = nextZ;

          const targetRoll = -steer * Math.min(0.08, Math.abs(s.vehSpeed) * 0.0022);
          const targetPitch =
            throttle > 0.1 && s.vehSpeed < maxSpdMs * 0.8
              ? -0.03
              : inp.brake || throttle < -0.1
              ? 0.045
              : 0;
          s.vehRoll += (targetRoll - s.vehRoll) * 8 * dt;
          s.vehPitch += (targetPitch - s.vehPitch) * 8 * dt;

          veh.group.position.set(s.vehX, s.vehY, s.vehZ);
          veh.group.rotation.set(s.vehPitch, s.vehYaw, s.vehRoll);

          const wheelSpin = s.vehSpeed * dt * 2.4;
          veh.wheels.forEach((w) => {
            w.rotation.x += wheelSpin;
          });

          veh.setLightsState({
            headlightsOn: s.headlightsOn,
            braking: inp.brake || throttle < -0.1,
            leftTurn: s.leftTurn,
            rightTurn: s.rightTurn,
            hazard: s.hazard,
            timeSec,
            policeActive: Boolean(spec.isPolice),
          });

          for (const spbu of engineRefs.current.layout.spbuStations) {
            const distSpbu = Math.hypot(s.vehX - spbu.x, s.vehZ - spbu.z);
            if (distSpbu < 6 && (s.fuel < 99 || s.vehHp < 99)) {
              s.fuel = 100;
              s.vehHp = 100;
              soundEngine.playCashReward();
              showToast(`⛽ ${spbu.name}: Bensin & Bodi 100% Penuh!`);
            }
          }

          soundEngine.updateEngine(Math.abs(s.vehSpeed) * 3.6, true, useNitro);
        } else {
          soundEngine.updateEngine(0, false);
          const isSprinting = inp.nitro;
          const moveSpeed = (isSprinting ? 8.2 : 4.2) * (inWater ? 0.65 : 1);
          s.charYaw += steer * 3.2 * dt;

          let nextCX = s.charX + Math.sin(s.charYaw) * throttle * moveSpeed * dt;
          let nextCZ = s.charZ + Math.cos(s.charYaw) * throttle * moveSpeed * dt;
          nextCX = Math.max(-390, Math.min(390, nextCX));
          nextCZ = Math.max(-390, Math.min(390, nextCZ));

          const pMargin = 0.6;
          for (const c of engineRefs.current.colliders) {
            if (
              nextCX > c.minX - pMargin &&
              nextCX < c.maxX + pMargin &&
              nextCZ > c.minZ - pMargin &&
              nextCZ < c.maxZ + pMargin
            ) {
              nextCX = s.charX;
              nextCZ = s.charZ;
              break;
            }
          }
          s.charX = nextCX;
          s.charZ = nextCZ;

          if (inp.jump && !s.isJumping && !inWater) {
            s.charVelY = 7.4;
            s.isJumping = true;
          }
          if (s.isJumping) {
            s.charVelY -= 19.5 * dt;
            s.charY += s.charVelY * dt;
            if (s.charY <= 0) {
              s.charY = 0;
              s.charVelY = 0;
              s.isJumping = false;
            }
          }
          s.isSwimming = inWater;
          if (inWater) s.charY = -0.55;

          char.group.position.set(s.charX, s.charY, s.charZ);
          char.group.rotation.y = s.charYaw;
          char.animate({
            dt,
            timeSec,
            speedRatio: Math.abs(throttle) * (isSprinting ? 1.5 : 0.8),
            isJumping: s.isJumping,
            isSwimming: s.isSwimming,
            isAiming: inp.shoot && s.weapon !== "fist",
          });
        }

        engineRefs.current.dancer?.update(dt);
        for (const ped of engineRefs.current.pedestrians) {
          if (ped.panicTimer > 0) ped.panicTimer = Math.max(0, ped.panicTimer - dt);
          if (ped.teloletTimer > 0) ped.teloletTimer = Math.max(0, ped.teloletTimer - dt);

          const distPlayer = Math.hypot(ped.x - targetX, ped.z - targetZ);
          if (
            ped.panicTimer <= 0 &&
            ((s.inVehicle && Math.abs(s.vehSpeed) > 15 && distPlayer < 7.5) ||
              (!s.inVehicle && inp.shoot && distPlayer < 18))
          ) {
            ped.panicTimer = 3.5;
            ped.yaw = Math.atan2(ped.x - targetX, ped.z - targetZ);
            if (timeSec - simRef.current.lastPanicToastAt > 5) {
              simRef.current.lastPanicToastAt = timeSec;
              showToast("😱 Warga: Minggir woy!! Ada yang ngebut / rusuh di Sudirman!");
            }
          }

          let animSpeedRatio = 0;
          if (ped.panicTimer > 0) {
            const awayYaw = Math.atan2(ped.x - targetX, ped.z - targetZ);
            ped.yaw = awayYaw;
            ped.x += Math.sin(awayYaw) * 5.2 * dt;
            ped.z += Math.cos(awayYaw) * 5.2 * dt;
            animSpeedRatio = 1.65;
          } else if (ped.teloletTimer > 0) {
            ped.yaw = Math.atan2(targetX - ped.x, targetZ - ped.z);
            animSpeedRatio = 0.25;
            ped.char.group.position.y = 0.24 + Math.abs(Math.sin(timeSec * 9)) * 0.28;
          } else if (ped.role === "walker_ns") {
            const redWait = nsRed && (Math.abs(ped.z - 90) < 16 || Math.abs(ped.z + 90) < 16);
            if (!redWait) {
              ped.z += ped.dir * ped.speed * dt;
              if (ped.z > 240) ped.z = -240;
              if (ped.z < -240) ped.z = 240;
              if (Math.hypot(ped.x, ped.z) < 22) ped.z += ped.dir * 44;
              animSpeedRatio = 0.72;
            } else {
              animSpeedRatio = 0;
            }
            ped.x += (ped.baseX - ped.x) * Math.min(1, dt * 2.5);
            ped.yaw = ped.dir > 0 ? 0 : Math.PI;
            ped.char.group.position.y = 0.22;
          } else if (ped.role === "walker_ew") {
            const redWait = ewRed && (Math.abs(ped.x - 90) < 16 || Math.abs(ped.x + 90) < 16);
            if (!redWait) {
              ped.x += ped.dir * ped.speed * dt;
              if (ped.x > 240) ped.x = -240;
              if (ped.x < -240) ped.x = 240;
              if (Math.hypot(ped.x, ped.z) < 22) ped.x += ped.dir * 44;
              animSpeedRatio = 0.72;
            } else {
              animSpeedRatio = 0;
            }
            ped.z += (ped.baseZ - ped.z) * Math.min(1, dt * 2.5);
            ped.yaw = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
            ped.char.group.position.y = 0.22;
          } else {
            // Hangout / Ojol waiting at cafe or station
            ped.x += (ped.baseX - ped.x) * Math.min(1, dt * 2.5);
            ped.z += (ped.baseZ - ped.z) * Math.min(1, dt * 2.5);
            ped.yaw += Math.sin(timeSec * 0.9 + ped.baseZ) * 0.22 * dt;
            ped.char.group.position.y = 0.24;
            animSpeedRatio = 0.04;
          }

          ped.char.group.position.x = ped.x;
          ped.char.group.position.z = ped.z;
          ped.char.group.rotation.y = ped.yaw;
          ped.char.animate({
            dt,
            timeSec,
            speedRatio: animSpeedRatio,
            isJumping: false,
            isSwimming: false,
            isAiming: false,
          });
        }

        for (const b of engineRefs.current.bulletPool) {
          if (!b.active) continue;
          b.life -= dt;
          b.mesh.position.addScaledVector(b.vel, dt);

          let hit = false;
          for (const c of engineRefs.current.colliders) {
            if (
              b.mesh.position.x > c.minX &&
              b.mesh.position.x < c.maxX &&
              b.mesh.position.z > c.minZ &&
              b.mesh.position.z < c.maxZ
            ) {
              hit = true;
              break;
            }
          }
          if (hit || b.life <= 0) {
            if (b.isRocket) spawnExplosionAt(b.mesh.position);
            b.active = false;
            b.mesh.visible = false;
          }
        }

        for (const exp of engineRefs.current.explosionPool) {
          if (!exp.active) continue;
          exp.life -= dt;
          const progress = 1 - exp.life / 0.6;
          exp.mesh.scale.setScalar(1 + progress * 9);
          (exp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - progress));
          if (exp.life <= 0) {
            exp.active = false;
            exp.mesh.visible = false;
          }
        }

        for (const tr of engineRefs.current.trafficPool) {
          let mustStop = false;
          if (tr.axis === "ns" && nsRed) {
            const ahead90 = (90 - tr.z) * tr.dir;
            const aheadNeg90 = (-90 - tr.z) * tr.dir;
            if ((ahead90 > 8 && ahead90 < 22) || (aheadNeg90 > 8 && aheadNeg90 < 22)) {
              mustStop = true;
            }
          } else if (tr.axis === "ew" && ewRed) {
            const ahead90 = (90 - tr.x) * tr.dir;
            const aheadNeg90 = (-90 - tr.x) * tr.dir;
            if ((ahead90 > 8 && ahead90 < 22) || (aheadNeg90 > 8 && aheadNeg90 < 22)) {
              mustStop = true;
            }
          }
          if (Math.hypot(tr.x - targetX, tr.z - targetZ) < 9) mustStop = true;

          const desiredSpeed = mustStop ? 0 : tr.baseSpeed;
          tr.curSpeed += (desiredSpeed - tr.curSpeed) * 5 * dt;

          if (tr.axis === "ns") {
            tr.z += tr.dir * tr.curSpeed * dt;
            if (tr.z > 290) tr.z = -290;
            if (tr.z < -290) tr.z = 290;
          } else {
            tr.x += tr.dir * tr.curSpeed * dt;
            if (tr.x > 290) tr.x = -290;
            if (tr.x < -290) tr.x = 290;
          }

          let renderX = tr.x;
          let renderZ = tr.z;
          const centerDist = Math.hypot(renderX, renderZ);
          if (centerDist < 24.5) {
            const ang = Math.atan2(renderX, renderZ);
            renderX = Math.sin(ang) * 25;
            renderZ = Math.cos(ang) * 25;
          }

          tr.mesh.group.position.set(renderX, 0, renderZ);
          tr.mesh.wheels.forEach((w) => (w.rotation.x += tr.curSpeed * dt * 2));
          tr.mesh.setLightsState({
            headlightsOn: s.headlightsOn,
            braking: mustStop,
            leftTurn: false,
            rightTurn: false,
            hazard: false,
            timeSec,
            policeActive: false,
          });
        }

        const activePoliceCount = s.wantedLevel;
        soundEngine.updatePoliceSiren(activePoliceCount > 0, timeSec);
        engineRefs.current.policePool.forEach((pol, idx) => {
          if (idx >= activePoliceCount) {
            pol.mesh.group.visible = false;
            return;
          }
          if (!pol.mesh.group.visible) {
            const ang = (idx / Math.max(1, activePoliceCount)) * Math.PI * 2;
            pol.x = targetX + Math.cos(ang) * 75;
            pol.z = targetZ + Math.sin(ang) * 75;
            pol.mesh.group.visible = true;
          }
          const dx = targetX - pol.x;
          const dz = targetZ - pol.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 8.5) {
            pol.yaw = Math.atan2(dx, dz);
            const chaseSpeed = 24 + s.wantedLevel * 3.5;
            pol.x += (dx / dist) * chaseSpeed * dt;
            pol.z += (dz / dist) * chaseSpeed * dt;
            // Keep pursuing police vehicles off cafe patios and sidewalks on main avenue
            if (Math.abs(pol.z) > 16 && Math.abs(pol.x) > 10.5 && Math.abs(pol.x) < 22) {
              pol.x = Math.sign(pol.x) * 10.5;
            }
          }
          pol.mesh.group.position.set(pol.x, 0, pol.z);
          pol.mesh.group.rotation.y = pol.yaw;
          pol.mesh.setLightsState({
            headlightsOn: true,
            braking: dist < 10,
            leftTurn: false,
            rightTurn: false,
            hazard: false,
            timeSec,
            policeActive: true,
          });
        });

        if (s.raceActive) {
          s.raceTimer += dt;
          const cps = engineRefs.current.raceCheckpoints;
          const cp = cps[s.raceCheckpointIdx];
          if (cp) {
            const distCp = Math.hypot(s.vehX - cp.x, s.vehZ - cp.z);
            if (distCp < 11) {
              soundEngine.playCashReward();
              if (s.raceCheckpointIdx + 1 >= cps.length) {
                s.raceActive = false;
                if (engineRefs.current.raceMarkerMesh) {
                  engineRefs.current.raceMarkerMesh.visible = false;
                }
                setCash((c) => c + 15000);
                setRaceStatus({ active: false, checkpoint: 0, total: cps.length, timeSec: 0 });
                showToast(`🏆 JUARA BALAP LIAR! +$15.000 (${s.raceTimer.toFixed(1)}s)`);
              } else {
                s.raceCheckpointIdx += 1;
                const nextCp = cps[s.raceCheckpointIdx];
                if (engineRefs.current.raceMarkerMesh) {
                  engineRefs.current.raceMarkerMesh.position.set(nextCp.x, 7, nextCp.z);
                }
              }
            }
          }
          engineRefs.current.aiRacers.forEach((r) => {
            const targetIdx = Math.floor(r.progress) % cps.length;
            const target = cps[targetIdx];
            const rx = r.mesh.group.position.x;
            const rz = r.mesh.group.position.z;
            const d = Math.hypot(target.x - rx, target.z - rz);
            if (d < 8) r.progress += 1;
            else {
              const yaw = Math.atan2(target.x - rx, target.z - rz);
              r.mesh.group.rotation.y = yaw;
              r.mesh.group.position.x += ((target.x - rx) / d) * r.speed * dt;
              r.mesh.group.position.z += ((target.z - rz) / d) * r.speed * dt;
            }
          });
        }

        if (s.isRaining && engineRefs.current.rainPoints) {
          const posAttr = engineRefs.current.rainPoints.geometry.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          for (let i = 0; i < posAttr.count; i++) {
            let py = posAttr.getY(i) - 34 * dt;
            if (py < 0) py = 45;
            posAttr.setY(i, py);
          }
          posAttr.needsUpdate = true;
          engineRefs.current.rainPoints.position.set(targetX, 0, targetZ);
        }

        const anchorX = s.inVehicle ? s.vehX : s.charX;
        const anchorY = s.inVehicle ? s.vehY : s.charY;
        const anchorZ = s.inVehicle ? s.vehZ : s.charZ;
        const anchorYaw = s.inVehicle ? s.vehYaw : s.charYaw;
        const viewYaw = anchorYaw + s.camOrbitYaw;

        if (s.inVehicle && s.cameraMode === "cockpit") {
          const off = veh.cabinFit.cockpitCamOffset.clone();
          off.applyAxisAngle(new THREE.Vector3(0, 1, 0), anchorYaw);
          camera.position.set(anchorX + off.x, anchorY + off.y, anchorZ + off.z);
          camLookTarget.set(
            anchorX + Math.sin(viewYaw) * 25,
            anchorY + off.y - 0.3,
            anchorZ + Math.cos(viewYaw) * 25
          );
          camera.lookAt(camLookTarget);
        } else if (s.inVehicle && s.cameraMode === "hood") {
          const off = veh.cabinFit.hoodCamOffset.clone();
          off.applyAxisAngle(new THREE.Vector3(0, 1, 0), anchorYaw);
          camera.position.set(anchorX + off.x, anchorY + off.y, anchorZ + off.z);
          camLookTarget.set(
            anchorX + Math.sin(viewYaw) * 30,
            anchorY + off.y - 0.5,
            anchorZ + Math.cos(viewYaw) * 30
          );
          camera.lookAt(camLookTarget);
        } else {
          const distBack = s.inVehicle
            ? veh.kind === "bus_transjakarta" || veh.kind === "jet" || veh.kind === "heli"
              ? 13.5
              : 8.6
            : 4.8;
          const pitchLift = Math.sin(s.camOrbitPitch) * distBack;
          const horizDist = Math.cos(s.camOrbitPitch) * distBack;
          const baseHeight = s.inVehicle ? (veh.kind === "bus_transjakarta" ? 3.8 : 2.1) : 1.7;

          camTargetPos.set(
            anchorX - Math.sin(viewYaw) * horizDist,
            anchorY + baseHeight + pitchLift,
            anchorZ - Math.cos(viewYaw) * horizDist
          );
          camera.position.lerp(camTargetPos, 1 - Math.exp(-9 * dt));
          camLookTarget.set(
            anchorX + Math.sin(viewYaw) * 4,
            anchorY + (s.inVehicle ? 1.25 : 1.45),
            anchorZ + Math.cos(viewYaw) * 4
          );
          camera.lookAt(camLookTarget);
        }

        const targetFov = s.inVehicle && inp.nitro && s.nitro > 1 && throttle > 0 ? 78 : 65;
        if (Math.abs(camera.fov - targetFov) > 0.2) {
          camera.fov += (targetFov - camera.fov) * 6 * dt;
          camera.updateProjectionMatrix();
        }

        camera.updateMatrixWorld();
        projScreenMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);
        for (const prop of engineRefs.current.cullableProps) {
          prop.getWorldPosition(tmpVec);
          const distSq =
            (tmpVec.x - camera.position.x) ** 2 + (tmpVec.z - camera.position.z) ** 2;
          prop.visible = distSq < 400 * 400 && frustum.containsPoint(tmpVec);
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.1) {
          hudSyncAccum = 0;
          setSpeedKmh(Math.round(Math.abs(s.vehSpeed) * 3.6));
          setFuelPct(Math.round(s.fuel));
          setVehicleHpPct(Math.round(s.vehHp));
          setNitroPct(Math.round(s.nitro));
          setHealthPct(Math.round(s.health));
          setArmorPct(Math.round(s.armor));
          setGps(worldToGps(anchorX, anchorZ, engineRefs.current.layout.region));
          setStreetNameLabel(
            getJakartaStreetName(anchorX, anchorZ, engineRefs.current.layout.region.title)
          );

          let closestSpot: HangoutSpotData | null = null;
          let bestSpotDist = 14.5;
          for (const sp of engineRefs.current.layout.hangoutSpots || []) {
            const d = Math.hypot(anchorX - sp.x, anchorZ - sp.z);
            if (d < bestSpotDist) {
              bestSpotDist = d;
              closestSpot = sp;
            }
          }
          setNearbyHangout(closestSpot);

          let activeMissionCoord: { x: number; z: number } | null = null;
          if (s.activeMissionIdx !== null) {
            const m = JAKARTA_MISSIONS[s.activeMissionIdx];
            if (m) {
              const distM = Math.hypot(anchorX - m.targetX, anchorZ - m.targetZ);
              setMissionDistM(Math.round(distM));
              activeMissionCoord = { x: m.targetX, z: m.targetZ };
              if (engineRefs.current.missionBeaconMesh) {
                engineRefs.current.missionBeaconMesh.rotation.y += 0.25;
              }
              if (distM < 12) {
                soundEngine.playCashReward();
                setCash((c) => c + m.reward);
                s.nitro = 100;
                setNitroPct(100);
                s.activeMissionIdx = null;
                setActiveMissionIdx(null);
                if (engineRefs.current.missionBeaconMesh) {
                  engineRefs.current.missionBeaconMesh.visible = false;
                }
                showToast(`🎉 MISI SELESAI (${m.title})! +$${m.reward.toLocaleString("id-ID")} & Nitro 100%!`);
              }
            }
          }

          const activeCp = s.raceActive
            ? engineRefs.current.raceCheckpoints[s.raceCheckpointIdx]
            : null;
          setRadarState({
            x: anchorX,
            z: anchorZ,
            camYaw: viewYaw,
            traffic: engineRefs.current.trafficPool.map((t) => ({
              x: t.mesh.group.position.x,
              z: t.mesh.group.position.z,
            })),
            police: engineRefs.current.policePool
              .filter((p) => p.mesh.group.visible)
              .map((p) => ({ x: p.x, z: p.z })),
            raceTarget: activeCp ? { x: activeCp.x, z: activeCp.z } : activeMissionCoord,
          });

          if (s.raceActive) {
            setRaceStatus({
              active: true,
              checkpoint: s.raceCheckpointIdx + 1,
              total: engineRefs.current.raceCheckpoints.length,
              timeSec: Number(s.raceTimer.toFixed(1)),
            });
          }
        }
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      soundEngine.stopAll();
      engineRefs.current.playerVehicle?.dispose();
      engineRefs.current.character?.dispose();
      engineRefs.current.dancer?.dispose();
      engineRefs.current.pedestrians.forEach((p) => p.char.dispose());
      engineRefs.current.ojolBikes.forEach((b) => b.dispose());
      engineRefs.current.policePool.forEach((p) => p.mesh.dispose());
      engineRefs.current.trafficPool.forEach((t) => t.mesh.dispose());
      engineRefs.current.aiRacers.forEach((r) => r.mesh.dispose());
      bulletGeo.dispose();
      bulletMat.dispose();
      expGeo.dispose();
      expMat.dispose();
      missionBeacon.geometry.dispose();
      (missionBeacon.material as THREE.Material).dispose();
      rainGeo.dispose();
      rainMat.dispose();
      envTex.dispose();
      pmremGenerator.dispose();
      disposeAllGeneratedTextures();
      renderer.dispose();
    };
  }, [
    stage,
    selectedStartVehicle,
    buildCityWorld,
    spawnPlayerVehicle,
    spawnExplosionAt,
    showToast,
  ]);

  useEffect(() => {
    if (stage !== "playing") return;
    const keys = new Set<string>();

    const syncKeys = () => {
      const fwd = keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0;
      const bwd = keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0;
      const left = keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0;
      const right = keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0;

      inputRef.current.throttle = fwd - bwd;
      inputRef.current.steer = left - right;
      inputRef.current.brake = keys.has("Space");
      inputRef.current.jump = keys.has("Space");
      inputRef.current.nitro = keys.has("ShiftLeft") || keys.has("ShiftRight");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Escape") {
        e.preventDefault();
        if (howToPlayOpen) setHowToPlayOpen(false);
        else setPaused((p) => !p);
        return;
      }
      if (e.code === "KeyP") {
        setPhoneOpen((p) => !p);
        return;
      }
      if (e.code === "KeyF") {
        toggleEnterExitVehicle();
        return;
      }
      if (e.code === "KeyC") {
        setCameraMode((prev) =>
          prev === "chase" ? "hood" : prev === "hood" ? "cockpit" : "chase"
        );
        return;
      }
      if (e.code === "KeyH") {
        triggerTelolet();
        return;
      }
      if (e.code === "KeyM") {
        startOrCycleMission();
        return;
      }
      if (e.code === "KeyG") {
        const anchorX = simRef.current.inVehicle ? simRef.current.vehX : simRef.current.charX;
        const anchorZ = simRef.current.inVehicle ? simRef.current.vehZ : simRef.current.charZ;
        const hitSpot = engineRefs.current.layout.hangoutSpots?.find(
          (sp) => Math.hypot(anchorX - sp.x, anchorZ - sp.z) < 16
        );
        if (hitSpot) {
          enterHangoutSpot(hitSpot);
        } else {
          setPhoneOpen(true);
          showToast("☕ Dekati lingkaran Kafe / Rental PS5 atau klik HP untuk ke lokasi!");
        }
        return;
      }
      if (e.code === "KeyR") {
        setRadioChannelIndex((idx) => {
          const next = (idx + 1) % JAKARTA_RADIO_CHANNELS.length;
          showToast(`📻 Radio: ${JAKARTA_RADIO_CHANNELS[next].name}`);
          return next;
        });
        return;
      }
      if (e.code === "KeyQ") {
        setLeftSignal((v) => !v);
        setRightSignal(false);
        return;
      }
      if (e.code === "KeyE") {
        setRightSignal((v) => !v);
        setLeftSignal(false);
        return;
      }
      if (e.code === "KeyZ") {
        setHazardSignal((v) => !v);
        return;
      }
      if (e.code === "KeyL") {
        simRef.current.headlightsOn = !simRef.current.headlightsOn;
        return;
      }

      if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code)) {
        const wIdx = Number(e.code.replace("Digit", "")) - 1;
        const wItem = WEAPON_LIST[wIdx];
        if (wItem) {
          setWeapon(wItem.id);
          showToast(`Senjata: ${wItem.emoji} ${wItem.label}`);
        }
        return;
      }

      keys.add(e.code);
      syncKeys();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      syncKeys();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    stage,
    howToPlayOpen,
    toggleEnterExitVehicle,
    triggerTelolet,
    enterHangoutSpot,
    startOrCycleMission,
    showToast,
  ]);

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    const rect = e.currentTarget.getBoundingClientRect();
    joyOriginRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t || !joyOriginRef.current) return;
    const maxR = 42;
    let dx = t.clientX - joyOriginRef.current.x;
    let dy = t.clientY - joyOriginRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    inputRef.current.joyX = dx / maxR;
    inputRef.current.joyY = dy / maxR;
  };

  const handleJoystickEnd = () => {
    joyOriginRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    inputRef.current.joyX = 0;
    inputRef.current.joyY = 0;
  };

  // ============================================================================
  // RENDER: MAIN MENU & LOADING SCREEN (FULLY SCROLLABLE ON ALL SCREENS)
  // ============================================================================
  if (stage === "menu" || stage === "loading") {
    return (
      <div className="fixed inset-0 z-10 h-screen w-full overflow-y-auto overscroll-y-contain bg-[#07080f] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,62,157,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(255,140,56,0.24),_transparent_50%),linear-gradient(180deg,_#090517_0%,_#1b0a2b_55%,_#07080f_100%)]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 pb-20 sm:px-8 sm:py-8">
          <header className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-pink-200 shadow">
              Open-World 3D Jakarta • Mobil Realistis • Peta Nyata OpenStreetMap
            </span>
            <h1 className="mt-3 bg-gradient-to-r from-pink-400 via-orange-300 to-amber-300 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-7xl drop-shadow">
              GTA INDONESIA
            </h1>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-slate-950/90 px-5 py-1.5 text-sm sm:text-base shadow-xl backdrop-blur-md">
              <span className="text-slate-300 font-medium">by</span>
              <CreatorLink />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {stage === "menu" && (
                <button
                  onClick={handleStartGame}
                  className="animate-pulse-glow inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 px-7 py-2.5 text-sm font-black tracking-wide text-white shadow-xl hover:scale-[1.03] transition"
                >
                  <Play className="h-4 w-4 fill-white" /> MASUK KOTA JAKARTA SEKARANG
                </button>
              )}

              <button
                onClick={() => setHowToPlayOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/15 px-5 py-2.5 text-xs sm:text-sm font-black text-amber-200 hover:bg-amber-500/25 shadow-lg transition"
              >
                <BookOpen className="h-4 w-4 text-amber-300" />
                📖 Panduan Main & Fitur
              </button>
            </div>
          </header>

          {stage === "loading" ? (
            <div className="mx-auto mt-8 w-full max-w-xl rounded-3xl border border-pink-500/40 bg-slate-950/90 p-8 text-center shadow-2xl">
              <p className="text-xl font-black text-white">MEMUAT ASET 3D & KOTA JAKARTA...</p>
              <p className="mt-2 text-xs sm:text-sm text-cyan-300">{loadingTip}</p>
              <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-cyan-400 transition-all duration-200"
                  style={{ width: `${loadingPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-mono text-pink-400">{loadingPct}%</p>
            </div>
          ) : (
            <>
              <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 sm:p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-black uppercase tracking-wider text-orange-300">
                    1. Pilih Mode Kontrol Perangkat
                  </h2>
                  <span className="text-xs text-slate-400">
                    Terdeteksi:{" "}
                    <strong className="text-cyan-300">
                      {resolvedMobile
                        ? "📱 Layar Sentuh (HP/Tablet)"
                        : "💻 Keyboard & Mouse (Laptop/PC)"}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => handleSelectControlPref("auto")}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                      controlPref === "auto"
                        ? "border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/10"
                        : "border-white/10 bg-slate-900/70 hover:bg-slate-800"
                    }`}
                  >
                    <Cpu className="mt-0.5 h-6 w-6 shrink-0 text-cyan-400" />
                    <div>
                      <p className="text-sm font-bold">Auto-Detect (Direkomendasikan)</p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Otomatis mendeteksi layar sentuh HP atau keyboard Laptop.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectControlPref("mobile")}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                      controlPref === "mobile"
                        ? "border-pink-400 bg-pink-500/15 shadow-lg shadow-pink-500/10"
                        : "border-white/10 bg-slate-900/70 hover:bg-slate-800"
                    }`}
                  >
                    <Smartphone className="mt-0.5 h-6 w-6 shrink-0 text-pink-400" />
                    <div>
                      <p className="text-sm font-bold">📱 Mode HP / Tablet</p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Virtual Analog Joystick, Gas/Rem, Nitro, Telolet, Carjack & Tembak.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectControlPref("desktop")}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                      controlPref === "desktop"
                        ? "border-orange-400 bg-orange-500/15 shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-slate-900/70 hover:bg-slate-800"
                    }`}
                  >
                    <Laptop className="mt-0.5 h-6 w-6 shrink-0 text-orange-400" />
                    <div>
                      <p className="text-sm font-bold">💻 Mode Laptop / PC</p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        Kamera 360° Mouse, Senjata 1–5, Radar Minimap & shortcut lengkap.
                      </p>
                    </div>
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 sm:p-5 backdrop-blur-md">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-pink-300">
                  2. Pilih Titik Spawn Jakarta & Jabodetabek (Data Asli OSM)
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {JABODETABEK_REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedRegionId(reg.id)}
                      className={`rounded-2xl border p-3.5 text-left transition ${
                        selectedRegionId === reg.id
                          ? "border-pink-500 bg-gradient-to-br from-pink-500/20 to-orange-500/15 shadow-lg"
                          : "border-white/10 bg-slate-900/70 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                          <MapPin className="h-3.5 w-3.5" /> {reg.areaLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {reg.lat.toFixed(3)}, {reg.lng.toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-white">{reg.title}</p>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2">{reg.subtitle}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/85 p-4 sm:flex-row sm:p-5">
                <div className="w-full sm:w-auto">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    3. Pilih Mobil High-Poly Awal
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "supercar",
                        "lambo",
                        "mercy",
                        "bmw",
                        "sport",
                        "innova",
                        "avanza",
                        "civic",
                        "bluebird",
                        "bus_transjakarta",
                        "police_pjr",
                      ] as VehicleKind[]
                    ).map((vk) => {
                      const sp = VEHICLE_SPECS.find((s) => s.id === vk)!;
                      return (
                        <button
                          key={vk}
                          onClick={() => setSelectedStartVehicle(vk)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            selectedStartVehicle === vk
                              ? "bg-white text-slate-950 shadow"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {sp.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  className="animate-pulse-glow flex w-full shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 px-8 py-4 text-base font-black tracking-wide text-white shadow-xl hover:scale-[1.02] active:scale-95 transition sm:w-auto"
                >
                  <Play className="h-5 w-5 fill-white" /> MASUK KOTA JAKARTA
                </button>
              </section>
            </>
          )}
        </div>

        <HowToPlayModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
      </div>
    );
  }

  // ============================================================================
  // RENDER: IN-GAME 3D WORLD + HUD
  // ============================================================================
  const activeRegion = getRegionById(selectedRegionId);
  const currentSpec = VEHICLE_SPECS.find((v) => v.id === currentVehicleKind);

  return (
    <div className="relative h-screen w-screen overflow-hidden touch-none bg-black">
      <div
        ref={mountRef}
        onMouseDown={(e) => {
          simRef.current.isDraggingCam = true;
          orbitTouchRef.current = { x: e.clientX, y: e.clientY };
          if (
            !resolvedMobile &&
            !simRef.current.inVehicle &&
            !phoneOpen &&
            !paused &&
            !howToPlayOpen &&
            !activeMinigame &&
            e.button === 0
          ) {
            inputRef.current.shoot = true;
            fireWeapon();
          }
        }}
        onMouseMove={(e) => {
          if (simRef.current.isDraggingCam && orbitTouchRef.current) {
            const dx = e.clientX - orbitTouchRef.current.x;
            const dy = e.clientY - orbitTouchRef.current.y;
            orbitTouchRef.current = { x: e.clientX, y: e.clientY };
            simRef.current.camOrbitYaw -= dx * 0.006;
            simRef.current.camOrbitPitch = Math.max(
              -0.05,
              Math.min(0.65, simRef.current.camOrbitPitch + dy * 0.004)
            );
          }
        }}
        onMouseUp={() => {
          simRef.current.isDraggingCam = false;
          orbitTouchRef.current = null;
          inputRef.current.shoot = false;
        }}
        onMouseLeave={() => {
          simRef.current.isDraggingCam = false;
          orbitTouchRef.current = null;
          inputRef.current.shoot = false;
        }}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {resolvedMobile && isPortrait && (
        <div className="pointer-events-none fixed top-14 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-400/50 bg-amber-950/90 px-3 py-1 text-[11px] font-semibold text-amber-200 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <RotateCw className="h-3.5 w-3.5 animate-spin" />
          Putar HP ke mode Landscape agar kontrol lebih lega!
        </div>
      )}

      {/* Top HUD */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-start justify-between gap-2 p-2.5 sm:p-4">
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex flex-nowrap items-center gap-1 whitespace-nowrap">
            <button
              onClick={() => setPhoneOpen((p) => !p)}
              className="flex items-center gap-1 rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600/90 to-orange-500/90 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg hover:brightness-110"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>HP / GPS</span>
            </button>

            <button
              onClick={handleTakeScreenshot}
              className="flex items-center gap-1 rounded-xl border border-cyan-400/50 bg-slate-950/80 px-2 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30 backdrop-blur-md"
              title="Ambil Foto / Screenshot Jakarta (.PNG)"
            >
              <ImageDown className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Foto</span>
            </button>

            <button
              onClick={() => {
                const cafe =
                  engineRefs.current.layout.hangoutSpots?.find(
                    (s) => s.kind === "fore_coffee" || s.kind === "kopi_kenangan"
                  ) ?? null;
                if (cafe) setActiveCafeModal(cafe);
              }}
              className="flex items-center gap-1 rounded-xl border border-emerald-400/50 bg-emerald-950/80 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30 backdrop-blur-md"
              title="Nongkrong Kafe Fore / Kopi Kenangan"
            >
              <Coffee className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kafe</span>
            </button>

            <button
              onClick={() => setActiveMinigame("ps_penalty")}
              className="flex items-center gap-1 rounded-xl border border-pink-400/50 bg-indigo-950/85 px-2.5 py-1.5 text-[11px] font-bold text-pink-200 hover:bg-pink-500/30 backdrop-blur-md"
              title="Masuk Rental PS5 & Warnet Vinsky (6 Games)"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PS5</span>
            </button>

            <button
              onClick={startOrCycleMission}
              className="flex items-center gap-1 rounded-xl border border-cyan-400/50 bg-cyan-950/85 px-2.5 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30 backdrop-blur-md"
              title="Mulai / Ganti Misi Warga Jakarta (Key M)"
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Misi</span>
            </button>

            <button
              onClick={() => setHowToPlayOpen(true)}
              className="rounded-xl border border-amber-400/50 bg-slate-950/80 p-1.5 text-amber-300 hover:bg-amber-500/30 backdrop-blur-md"
              title="Panduan Main & Fitur"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() =>
                setCameraMode((prev) =>
                  prev === "chase" ? "hood" : prev === "hood" ? "cockpit" : "chase"
                )
              }
              className="rounded-xl border border-white/15 bg-slate-950/80 p-1.5 text-white hover:bg-slate-800 backdrop-blur-md"
              title="Ganti Kamera (C)"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                const next = !muted;
                setMuted(next);
                soundEngine.setMuted(next);
              }}
              className="rounded-xl border border-white/15 bg-slate-950/80 p-1.5 text-white hover:bg-slate-800 backdrop-blur-md"
              title="Mute / Unmute"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => setPaused((p) => !p)}
              className="rounded-xl border border-white/15 bg-slate-950/80 p-1.5 text-white hover:bg-slate-800 backdrop-blur-md"
              title="Pause (ESC)"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>

          <JakartaRadioHUD
            channelIndex={radioChannelIndex}
            onChangeChannelIndex={setRadioChannelIndex}
            compact
            muted={muted}
            autoPlayOnMount
            extraChannels={extraRadioChannels}
            onAddChannels={(chs) => {
              const start = JAKARTA_RADIO_CHANNELS.length + extraRadioChannels.length;
              setExtraRadioChannels((prev) => [...prev, ...chs]);
              return start;
            }}
          />

          {raceStatus.active && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-pink-500/60 bg-pink-950/85 px-2.5 py-1 text-xs font-bold text-white">
              <Flag className="h-3.5 w-3.5 text-pink-400" />
              CP {raceStatus.checkpoint}/{raceStatus.total} • {raceStatus.timeSec.toFixed(1)}s
            </div>
          )}

          {activeMissionIdx !== null && (
            <div className="inline-flex w-fit max-w-[325px] items-center gap-1.5 rounded-xl border border-cyan-400/60 bg-cyan-950/85 px-2.5 py-1 text-[11px] font-bold text-cyan-100 backdrop-blur-md shadow">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span className="truncate">
                {JAKARTA_MISSIONS[activeMissionIdx]?.title} • {missionDistM}m (+$
                {JAKARTA_MISSIONS[activeMissionIdx]?.reward.toLocaleString("id-ID")})
              </span>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <GTASanAndreasStatusHUD
            cash={cash}
            healthPct={healthPct}
            armorPct={armorPct}
            wantedLevel={wantedLevel}
            weapon={weapon}
            gameTimeLabel={gameTimeLabel}
            onCycleWeapon={() => {
              const curIdx = WEAPON_LIST.findIndex((w) => w.id === weapon);
              const next = WEAPON_LIST[(curIdx + 1) % WEAPON_LIST.length];
              setWeapon(next.id);
              showToast(`Senjata: ${next.emoji} ${next.label}`);
            }}
          />

          <div className="whitespace-nowrap rounded-lg bg-slate-950/75 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 backdrop-blur-sm border border-white/15 shadow">
            GTA Indonesia • <CreatorLink />
          </div>
        </div>
      </div>

      {/* Circular Rotating Radar Minimap + Street Name Ticker */}
      <div
        className={`pointer-events-none fixed z-20 flex flex-col items-start gap-1 ${
          resolvedMobile ? "bottom-36 left-4" : "bottom-4 left-4"
        }`}
      >
        <div className="rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 backdrop-blur-md shadow">
          {streetNameLabel}
        </div>
        <GTASanAndreasRadar
          playerX={radarState.x}
          playerZ={radarState.z}
          cameraYaw={radarState.camYaw}
          layout={engineRefs.current.layout}
          trafficDots={radarState.traffic}
          policeDots={radarState.police}
          raceTarget={radarState.raceTarget}
          compact={resolvedMobile}
        />
      </div>

      {/* Vehicle / District Callout */}
      {calloutText && (
        <div
          className={`pointer-events-none fixed right-6 z-30 text-right italic font-black text-2xl sm:text-3xl text-amber-300 tracking-tight ${
            resolvedMobile ? "bottom-52" : "bottom-36"
          }`}
          style={{ textShadow: "3px 3px 0 #000, -1px -1px 0 #000" }}
        >
          {calloutText}
        </div>
      )}

      {showOnboardingTip && (
        <div className="fixed bottom-28 sm:bottom-24 left-1/2 z-30 w-[92%] max-w-lg -translate-x-1/2 rounded-2xl border border-cyan-400/50 bg-slate-950/95 p-4 text-xs sm:text-sm text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-black text-cyan-300">👋 Selamat Datang di Jakarta!</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Drag mouse untuk putar kamera 360°, tekan <kbd className="rounded bg-white/15 px-1">F</kbd> untuk turun/carjack mobil jalanan, <kbd className="rounded bg-white/15 px-1">1–5</kbd> ganti senjata (termasuk RPG-7), <kbd className="rounded bg-white/15 px-1">P</kbd> buka HP & Live Street View, dan <kbd className="rounded bg-white/15 px-1">R</kbd> ganti Radio Jakarta!
              </p>
            </div>
            <button
              onClick={() => setShowOnboardingTip(false)}
              className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-3.5 py-2 text-xs font-black text-white shadow hover:brightness-110"
            >
              Mengerti, Gas!
            </button>
          </div>
        </div>
      )}

      {nearbyHangout && !activeCafeModal && !activeMinigame && (
        <div
          className={`fixed left-1/2 z-30 -translate-x-1/2 ${
            resolvedMobile ? "bottom-52" : "bottom-20"
          }`}
        >
          <button
            onClick={() => enterHangoutSpot(nearbyHangout)}
            className={`animate-bounce flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-2xl backdrop-blur-md transition hover:scale-105 ${
              nearbyHangout.kind === "rental_ps"
                ? "border-cyan-300 bg-gradient-to-r from-indigo-600/95 to-pink-600/95"
                : "border-emerald-300 bg-gradient-to-r from-emerald-600/95 to-teal-700/95"
            }`}
          >
            {nearbyHangout.kind === "rental_ps" ? (
              <Gamepad2 className="h-4 w-4" />
            ) : (
              <Coffee className="h-4 w-4" />
            )}
            <span>
              [G / Klik]{" "}
              {nearbyHangout.kind === "rental_ps"
                ? `Masuk ${nearbyHangout.name} (6 Games)`
                : `Nongkrong di ${nearbyHangout.name}`}
            </span>
          </button>
        </div>
      )}

      {toastMsg && !showOnboardingTip && (
        <div className="pointer-events-none fixed bottom-36 left-1/2 z-30 w-fit max-w-sm -translate-x-1/2 rounded-2xl border border-pink-500/40 bg-slate-950/90 px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-2xl backdrop-blur-md">
          {toastMsg}
        </div>
      )}

      {!resolvedMobile && (
        <>
          <div className="pointer-events-none fixed bottom-4 left-44 right-56 z-20 w-fit max-w-[calc(100vw-400px)] rounded-2xl border border-white/15 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md space-y-0.5">
            <p className="font-bold text-amber-300">
              💻 Drag Mouse: Kamera 360° • 1-5: Senjata • F: Carjack/Turun
            </p>
            <p>
              WASD: Setir/Jalan • Space: Drift/Lompat • Shift: Nitro • G: Kafe/PS5 • H: Telolet • R: Radio • P: HP
            </p>
          </div>

          {inVehicle && (
            <div className="pointer-events-none fixed bottom-4 right-4 z-20 flex flex-col items-end gap-1.5 rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-2.5 backdrop-blur-md min-w-[205px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 truncate max-w-[185px]">
                {currentSpec?.name ?? activeRegion.title}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-black text-white">{speedKmh}</span>
                <span className="text-xs font-bold text-pink-400">KM/H</span>
              </div>
              <div className="w-full space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-cyan-300">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Nitro</span>
                  <span>{nitroPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${nitroPct}%` }} />
                </div>
                <div className="flex items-center justify-between text-amber-300">
                  <span className="flex items-center gap-1"><Fuel className="h-3 w-3" /> Bensin</span>
                  <span>{fuelPct}% • HP {vehicleHpPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${fuelPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {resolvedMobile && !phoneOpen && !paused && !howToPlayOpen && !activeMinigame && (
        <>
          {inVehicle && (
            <div className="pointer-events-none fixed bottom-44 left-1/2 -translate-x-1/2 z-20 rounded-full border border-white/15 bg-slate-950/80 px-4 py-1 text-xs font-mono font-bold text-white backdrop-blur-md">
              {speedKmh} KM/H • NOS {nitroPct}% • BBM {fuelPct}%
            </div>
          )}

          <div
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
            className="fixed bottom-5 left-5 z-20 flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/25 bg-slate-950/55 backdrop-blur-md touch-none"
          >
            <div
              className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg border-2 border-white/60 transition-transform duration-75"
              style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            />
          </div>

          <div className="fixed bottom-5 right-4 z-20 flex flex-col items-end gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLeftSignal((v) => !v);
                  setRightSignal(false);
                }}
                className={`rounded-xl border px-2.5 py-2 text-xs font-bold ${
                  leftSignal ? "border-amber-400 bg-amber-500/40" : "border-white/20 bg-slate-950/70"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setRightSignal((v) => !v);
                  setLeftSignal(false);
                }}
                className={`rounded-xl border px-2.5 py-2 text-xs font-bold ${
                  rightSignal ? "border-amber-400 bg-amber-500/40" : "border-white/20 bg-slate-950/70"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={triggerTelolet}
                className="rounded-xl border border-amber-400/50 bg-amber-500/30 px-3 py-2 text-xs font-black text-amber-200 active:scale-95"
              >
                Telolet
              </button>
              <button
                onClick={toggleEnterExitVehicle}
                className="flex items-center gap-1 rounded-xl border border-cyan-400/50 bg-cyan-500/30 px-3 py-2 text-xs font-black text-cyan-100 active:scale-95"
              >
                <Car className="h-4 w-4" /> {inVehicle ? "Keluar" : "Masuk"}
              </button>
            </div>

            <div className="flex items-end gap-2.5">
              {!inVehicle && (
                <button
                  onTouchStart={() => {
                    inputRef.current.shoot = true;
                    fireWeapon();
                  }}
                  onTouchEnd={() => (inputRef.current.shoot = false)}
                  className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-red-400 bg-red-600/80 text-[10px] font-black active:scale-95"
                >
                  <Crosshair className="h-5 w-5" /> TEMBAK
                </button>
              )}

              <button
                onTouchStart={() => (inputRef.current.nitro = true)}
                onTouchEnd={() => (inputRef.current.nitro = false)}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-orange-400 bg-orange-600/80 text-[10px] font-black active:scale-95"
              >
                <Flame className="h-5 w-5" /> {inVehicle ? "NITRO" : "LARI"}
              </button>

              <button
                onTouchStart={() => {
                  inputRef.current.touchBrake = true;
                  inputRef.current.brake = true;
                  inputRef.current.jump = true;
                }}
                onTouchEnd={() => {
                  inputRef.current.touchBrake = false;
                  inputRef.current.brake = false;
                  inputRef.current.jump = false;
                }}
                className="flex h-16 w-14 items-center justify-center rounded-2xl border border-red-400/70 bg-red-700/75 text-xs font-black active:scale-95"
              >
                {inVehicle ? "REM" : "LOMPAT"}
              </button>

              <button
                onTouchStart={() => (inputRef.current.touchGas = true)}
                onTouchEnd={() => (inputRef.current.touchGas = false)}
                className="flex h-20 w-16 items-center justify-center rounded-2xl border border-emerald-400/70 bg-emerald-600/85 text-xs font-black shadow-lg active:scale-95"
              >
                {inVehicle ? "GAS" : "MAJU"}
              </button>
            </div>
          </div>
        </>
      )}

      <SmartphoneHUD
        isOpen={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        gps={gps}
        region={activeRegion}
        mapSource={mapSource}
        cash={cash}
        currentVehicleKind={currentVehicleKind}
        paintColor={paintColor}
        rimColor={rimColor}
        plateText={plateText}
        neonEnabled={neonEnabled}
        timeOfDay={timeOfDay}
        isRaining={isRaining}
        wantedLevel={wantedLevel}
        radioChannelIndex={radioChannelIndex}
        muted={muted}
        extraRadioChannels={extraRadioChannels}
        hangoutSpots={engineRefs.current.layout.hangoutSpots}
        onAddRadioChannels={(chs) => {
          const start = JAKARTA_RADIO_CHANNELS.length + extraRadioChannels.length;
          setExtraRadioChannels((prev) => [...prev, ...chs]);
          return start;
        }}
        onChangeRadioChannel={setRadioChannelIndex}
        onTeleportToSpot={handleTeleportToSpot}
        onTakeScreenshot={handleTakeScreenshot}
        onFastTravel={handleFastTravel}
        onSpawnVehicle={(kind) => {
          setPhoneOpen(false);
          spawnPlayerVehicle(kind);
        }}
        onChangePaint={(hex) => {
          setPaintColor(hex);
          engineRefs.current.playerVehicle?.setPaintColor(hex);
        }}
        onChangeRim={(hex) => {
          setRimColor(hex);
          engineRefs.current.playerVehicle?.setRimColor(hex);
        }}
        onChangePlate={(plate) => {
          setPlateText(plate);
          engineRefs.current.playerVehicle?.setPlateText(plate);
          showToast(`Pelat nomor terpasang: ${plate}`);
        }}
        onToggleNeon={() => {
          const next = !neonEnabled;
          setNeonEnabled(next);
          engineRefs.current.playerVehicle?.setNeon(next);
        }}
        onUpgradeEngine={() => {
          if (cash < 2500) {
            showToast("Uang tidak cukup ($2.500). Ikut Balap Liar atau Mini-Games!");
            return;
          }
          setCash((c) => c - 2500);
          simRef.current.engineStage = Math.min(3, simRef.current.engineStage + 1);
          soundEngine.playCashReward();
          showToast(`🔧 Upgrade Mesin Stage ${simRef.current.engineStage} terpasang!`);
        }}
        onSetTimeOfDay={(tod) => {
          setTimeOfDay(tod);
          simRef.current.timeOfDay = tod;
          buildCityWorld(engineRefs.current.layout, tod, simRef.current.isRaining);
        }}
        onToggleRain={() => {
          const next = !isRaining;
          setIsRaining(next);
          simRef.current.isRaining = next;
          buildCityWorld(engineRefs.current.layout, simRef.current.timeOfDay, next);
        }}
        onStartStreetRace={startStreetRace}
        onAdjustWanted={(delta) => {
          const next = Math.max(0, Math.min(5, simRef.current.wantedLevel + delta));
          simRef.current.wantedLevel = next;
          setWantedLevel(next);
          if (next === 0) showToast("🚓 Wanted Level bersih!");
        }}
        onQuickRefuelRepair={() => {
          if (cash < 500) {
            showToast("Butuh $500 untuk isi bensin & repair!");
            return;
          }
          setCash((c) => c - 500);
          simRef.current.fuel = 100;
          simRef.current.vehHp = 100;
          setFuelPct(100);
          setVehicleHpPct(100);
          soundEngine.playCashReward();
          showToast("⛽ Bensin & Repair 100% selesai!");
        }}
        onOpenMinigame={(id) => {
          setPhoneOpen(false);
          setActiveMinigame(id);
        }}
      />

      {activeCafeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-400/45 bg-slate-950/95 p-5 sm:p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  SPOT NONGKRONG JAKARTA
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  ☕ {activeCafeModal.name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">{activeCafeModal.subtitle}</p>
              </div>
              <button
                onClick={() => setActiveCafeModal(null)}
                className="rounded-xl bg-white/10 p-2 hover:bg-red-500 transition"
                aria-label="Tutup Kafe"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Obrolan NPC Tongkrongan */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                💬 Obrolan Tongkrongan Sudirman
              </p>
              <div className="space-y-1.5 text-xs">
                <p className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                  <strong className="text-emerald-300">Barista Kafe:</strong> &ldquo;Silakan kak! Lagi promo Butterscotch Latte sama Es Kopi Kenangan Mantan nih buat nambah HP &amp; Nitro!&rdquo;
                </p>
                <p className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                  <strong className="text-cyan-300">Anak Komunitas CDID:</strong> &ldquo;Gokil bro mobilnya! Nanti malem ikut drag race di Sentul atau mabar PS5 sebelah ya?&rdquo;
                </p>
                <p className="rounded-xl bg-white/5 px-3 py-2 text-slate-200">
                  <strong className="text-pink-300">Abang Ojol:</strong> &ldquo;Gass bang orderan kopi lagi rame, hati-hati jalur TransJakarta Bundaran HI!&rdquo;
                </p>
              </div>
            </div>

            {/* Menu Minuman & Makanan */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pesan Menu Nongkrong (Pulihkan 100% HP, Armor & Nitro)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    title: "Butterscotch Sea Salt Latte (Fore)",
                    price: 180,
                    bonus: "HP 100% + Armor +25%",
                  },
                  {
                    title: "Es Kopi Kenangan Mantan",
                    price: 140,
                    bonus: "HP 100% + Nitro 100%",
                  },
                  {
                    title: "Indomie Telor Kornet + Es Teh",
                    price: 100,
                    bonus: "HP + Armor 100% Penuh",
                  },
                  {
                    title: "Sate Taichan 10 Tusuk + Aren Latte",
                    price: 220,
                    bonus: "HP + Armor + Nitro 100%",
                  },
                ].map((menu) => (
                  <button
                    key={menu.title}
                    onClick={() => {
                      if (cash < menu.price) {
                        showToast(`Uang kurang ($${menu.price}). Tarik Ojol atau main di Rental PS5!`);
                        return;
                      }
                      setCash((c) => c - menu.price);
                      simRef.current.health = 100;
                      simRef.current.armor = 100;
                      simRef.current.nitro = 100;
                      setHealthPct(100);
                      setArmorPct(100);
                      setNitroPct(100);
                      soundEngine.playCashReward();
                      showToast(`☕ Pesan ${menu.title}: ${menu.bonus}!`);
                    }}
                    className="rounded-2xl border border-emerald-500/35 bg-slate-900 p-3 text-left hover:border-emerald-400 hover:bg-emerald-950/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{menu.title}</span>
                      <span className="rounded-lg bg-emerald-500/25 px-2 py-0.5 text-[11px] font-black text-emerald-300">
                        ${menu.price}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-cyan-300">{menu.bonus}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Switch to Fore / Kopi Kenangan / Rental PS5 or Play Cafe Music */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setRadioChannelIndex((idx) => (idx + 1) % JAKARTA_RADIO_CHANNELS.length);
                    showToast("🎵 Ganti lagu nongkrong kafe!");
                  }}
                  className="rounded-xl bg-pink-600/80 px-3.5 py-2 text-xs font-bold hover:bg-pink-500"
                >
                  🎵 Ganti Lagu Kafe
                </button>
                <button
                  onClick={() => {
                    setActiveCafeModal(null);
                    setActiveMinigame("ps_penalty");
                  }}
                  className="rounded-xl bg-indigo-600/85 px-3.5 py-2 text-xs font-bold hover:bg-indigo-500"
                >
                  🎮 Ke Rental PS5 Sebelah
                </button>
              </div>
              <button
                onClick={() => setActiveCafeModal(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black hover:bg-emerald-500"
              >
                Cabut &amp; Lanjut Keliling
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMinigame && (
        <MinigamesModal
          activeGame={activeMinigame}
          onClose={() => setActiveMinigame(null)}
          onSelectGame={(id) => setActiveMinigame(id)}
          onEarnCash={(amt, reason) => {
            setCash((c) => c + amt);
            showToast(`💵 +$${amt.toLocaleString("id-ID")} (${reason})`);
          }}
        />
      )}

      <HowToPlayModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />

      {paused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-pink-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                GAME DIJEDA
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                GTA Indonesia by <CreatorLink />
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-3.5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Sakelar Cepat Mode Perangkat
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "auto", label: "Auto" },
                    { id: "mobile", label: "📱 HP" },
                    { id: "desktop", label: "💻 Laptop" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectControlPref(m.id)}
                    className={`rounded-xl py-2 text-xs font-bold transition ${
                      controlPref === m.id
                        ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {fuelPct <= 10 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Bensin menipis! Kunjungi SPBU Pertamina atau buka HP &rarr; Dunia.
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setPaused(false)}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 py-3 font-black text-white shadow-lg"
              >
                LANJUTKAN BERMAIN
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  setHowToPlayOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-500/25"
              >
                <BookOpen className="h-4 w-4" /> 📖 Panduan Main & Fitur
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  setPhoneOpen(true);
                }}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
              >
                Buka Smartphone / Garasi / Radio / Street View
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  setStage("menu");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/25"
              >
                <LogOut className="h-4 w-4" /> Kembali ke Menu Utama
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
