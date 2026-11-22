"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
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
} from "lucide-react";
import {
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
import { JAKARTA_RADIO_CHANNELS, JakartaRadioHUD } from "./JakartaRadioHUD";
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
  sideX: number;
  dir: 1 | -1;
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

  // Screen & Menu State
  const [stage, setStage] = useState<ScreenStage>("menu");
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingTip, setLoadingTip] = useState("Menyiapkan GTA Indonesia Engine...");
  const [selectedRegionId, setSelectedRegionId] = useState<JabodetabekRegionId>("jakpus");
  const [selectedStartVehicle, setSelectedStartVehicle] = useState<VehicleKind>("supercar");
  const [controlPref, setControlPref] = useState<ControlModePref>("auto");
  const [resolvedMobile, setResolvedMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Modals & Overlays
  const [paused, setPaused] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [showOnboardingTip, setShowOnboardingTip] = useState(true);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  const [muted, setMuted] = useState(false);
  const [radioChannelIndex, setRadioChannelIndex] = useState(0);

  // Live GTA SA HUD State
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
    x: 4,
    z: 28,
    camYaw: 0,
    traffic: [],
    police: [],
    raceTarget: null,
  });

  const [mapSource, setMapSource] = useState<
    "local-cache" | "openstreetmap-live" | "jakarta-geojson"
  >("jakarta-geojson");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Vehicle Customizations
  const [currentVehicleKind, setCurrentVehicleKind] = useState<VehicleKind>("supercar");
  const [paintColor, setPaintColor] = useState("#dc2626");
  const [rimColor, setRimColor] = useState("#e2e8f0");
  const [plateText, setPlateText] = useState("B 1 VKY");
  const [neonEnabled, setNeonEnabled] = useState(false);

  // World Environment (GTA SA Golden Sunset or Bright Morning)
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
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    return hasTouch || window.innerWidth < 900;
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

  // Mutable Engine Refs
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
    aiRacers: Array<{ mesh: VehicleInstance; progress: number; speed: number }>;
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
    aiRacers: [],
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

    // 360 Orbit Camera offsets (GTA SA / GTA III mouse-look)
    camOrbitYaw: 0,
    camOrbitPitch: 0.14,
    isDraggingCam: false,

    // Vehicle physics
    vehX: 4,
    vehY: 0,
    vehZ: 28,
    vehYaw: Math.PI,
    vehSpeed: 0,
    vehPitch: 0,
    vehRoll: 0,
    fuel: 100,
    vehHp: 100,
    nitro: 100,

    // Character physics
    charX: 7,
    charY: 0,
    charZ: 28,
    charYaw: Math.PI,
    charVelY: 0,
    isJumping: false,
    isSwimming: false,

    // Signals
    leftTurn: false,
    rightTurn: false,
    hazard: false,
    headlightsOn: true,

    // Race
    raceActive: false,
    raceCheckpointIdx: 0,
    raceTimer: 0,
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
      paused || howToPlayOpen || Boolean(activeMinigame) || stage !== "playing";
    if (simRef.current.paused) {
      soundEngine.stopAll();
    }
  }, [paused, howToPlayOpen, activeMinigame, stage]);

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
      scene.fog = new THREE.FogExp2(rain ? 0x64748b : 0xc4dfee, rain ? 0.004 : 0.0012);
      ambientLight.color.setHex(0xf8fafc);
      ambientLight.groundColor.setHex(0x475569);
      ambientLight.intensity = rain ? 1.05 : 1.45;
      sunLight.color.setHex(0xfffbeb);
      sunLight.intensity = rain ? 1.3 : 2.5;
      sunLight.position.set(110, 185, 85);
      simRef.current.headlightsOn = rain;
      setGameTimeLabel("13:45");
    } else if (tod === "sunset") {
      // Classic GTA San Andreas Los Santos Golden-Orange Haze
      scene.fog = new THREE.FogExp2(rain ? 0x4b2c4e : 0xe89a66, rain ? 0.0042 : 0.0018);
      ambientLight.color.setHex(0xfde68a);
      ambientLight.groundColor.setHex(0x451a03);
      ambientLight.intensity = 1.25;
      sunLight.color.setHex(0xff8c42);
      sunLight.intensity = 2.6;
      sunLight.position.set(-165, 55, -120);
      simRef.current.headlightsOn = true;
      setGameTimeLabel("17:40");
    } else {
      scene.fog = new THREE.FogExp2(0x090c1e, rain ? 0.0052 : 0.0024);
      ambientLight.color.setHex(0x818cf8);
      ambientLight.groundColor.setHex(0x09090b);
      ambientLight.intensity = 0.72;
      sunLight.color.setHex(0x93c5fd);
      sunLight.intensity = 0.9;
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
    (kind: VehicleKind, overridePos?: { x: number; z: number }) => {
      const { scene, playerVehicle, character } = engineRefs.current;
      if (!scene) return;

      if (playerVehicle) {
        if (character && character.group.parent === playerVehicle.group) {
          scene.add(character.group);
        }
        scene.remove(playerVehicle.group);
        playerVehicle.dispose();
      }

      const spec = VEHICLE_SPECS.find((s) => s.id === kind) ?? VEHICLE_SPECS[0];
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

  /**
   * GTA SA / GTA III Enter/Exit + Street Carjacking (`F` key):
   * If on foot near an AI traffic car, hijacks that exact vehicle off the street!
   */
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

      // Check closest AI traffic car to carjack!
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
        // Carjack the AI vehicle GTA-style!
        const hjKind = closestAI.mesh.kind;
        const hjX = closestAI.mesh.group.position.x;
        const hjZ = closestAI.mesh.group.position.z;
        const hjYaw = closestAI.yaw;

        // Respawn AI car far away so traffic stays full
        closestAI.x = -260;
        closestAI.z = -260;

        simRef.current.vehX = hjX;
        simRef.current.vehZ = hjZ;
        simRef.current.vehYaw = hjYaw;
        spawnPlayerVehicle(hjKind, { x: hjX, z: hjZ });

        // Raise Wanted Level by +1 star on carjacking!
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
      new THREE.Vector3(0, 0, 26),
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
    simRef.current.vehZ = 28;
    simRef.current.vehYaw = Math.PI;
    simRef.current.vehSpeed = 0;

    (["bmw", "supercar"] as VehicleKind[]).forEach((kind, i) => {
      const rival = createVehicleMesh(kind, {
        paintColor: i === 0 ? "#00f0ff" : "#a855f7",
        plateText: `B 90${i} RCE`,
        neonEnabled: true,
      });
      rival.group.position.set(3.2 + i * 3.8, 0, 28);
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

      simRef.current.vehX = 4;
      simRef.current.vehZ = 28;
      simRef.current.vehSpeed = 0;
      simRef.current.charX = 7;
      simRef.current.charZ = 28;
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

  // Preload ALL 47 real 3D .glb models before entering city
  const handleStartGame = useCallback(async () => {
    soundEngine.unlock();
    setStage("loading");
    setLoadingPct(5);
    setLoadingTip("Memuat peta nyata Jakarta (.GeoJSON) & model 3D .GLB...");

    const cached = getLocalCachedMapLayout(selectedRegionId);
    engineRefs.current.layout = cached;
    setMapSource(cached.source);
    setGps({ lat: cached.region.lat, lng: cached.region.lng });

    await Promise.all([
      preloadAllGameModels((pct, label) => {
        setLoadingPct(Math.max(10, Math.min(95, pct)));
        setLoadingTip(label);
      }),
      Promise.race([
        fetchJabodetabekMapOSM(selectedRegionId).then((live) => {
          engineRefs.current.layout = live;
          setMapSource(live.source);
        }),
        new Promise<void>((res) => setTimeout(res, 2500)),
      ]),
    ]);

    setLoadingPct(100);
    setLoadingTip("Engine GTA Indonesia Siap! Mengaktifkan Jakarta...");
    setTimeout(() => {
      setStage("playing");
      const r = getRegionById(selectedRegionId);
      setCalloutText(`${r.areaLabel} — ${r.title}`);
    }, 250);
  }, [selectedRegionId]);

  // Three.js Engine Initialization + 60fps Game Loop
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
    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.2,
      650
    );

    const ambientLight = new THREE.HemisphereLight(0xf8fafc, 0x475569, 1.35);
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

    // Rain Pool
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

    // Pooled Bullets / Rockets
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

    // Pooled RPG Explosions
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

    // Rigged Skeletal Player Character (Soldier.glb)
    const character = createCharacterMesh();
    scene.add(character.group);

    // Animated Michelle.glb Plaza Dancer at Bundaran HI
    const dancer = createPlazaDancerMesh();
    dancer.group.position.set(-16.5, 0.32, 16.5);
    scene.add(dancer.group);

    // 14 Animated Sidewalk Pedestrians (Soldier.glb with varied outfits)
    const pedestrians: PedestrianUnit[] = [];
    const pedTints = ["#ec4899", "#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#ef4444"];
    for (let i = 0; i < 14; i++) {
      const pChar = createCharacterMesh({ tintHex: pedTints[i % pedTints.length] });
      const sideX = i % 2 === 0 ? -13.2 : 13.2;
      const pz = -210 + i * 32;
      const dir: 1 | -1 = i % 3 === 0 ? -1 : 1;
      pChar.group.position.set(sideX, 0, pz);
      pChar.group.rotation.y = dir > 0 ? 0 : Math.PI;
      scene.add(pChar.group);
      pedestrians.push({
        char: pChar,
        x: sideX,
        z: pz,
        yaw: dir > 0 ? 0 : Math.PI,
        speed: 1.8 + (i % 3) * 0.4,
        sideX,
        dir,
      });
    }

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

    buildCityWorld(
      engineRefs.current.layout,
      simRef.current.timeOfDay,
      simRef.current.isRaining
    );
    spawnPlayerVehicle(selectedStartVehicle, { x: 4, z: 28 });

    // 32 Rush-Hour Jakarta AI Traffic Vehicles (Real .GLB Models)
    const trafficPool: TrafficUnit[] = [];
    const trafficKinds: VehicleKind[] = [
      "avanza",
      "innova",
      "bluebird",
      "mercy",
      "bmw",
      "civic",
      "bus_transjakarta",
      "angkot",
      "motor",
      "suv",
    ];
    const trafficColors = [
      "#e2e8f0",
      "#1e293b",
      "#38bdf8",
      "#cbd5e1",
      "#1d4ed8",
      "#f8fafc",
      "#0284c7",
      "#06b6d4",
      "#111827",
      "#475569",
    ];
    const laneRoads = [-150, -90, 0, 90, 150];

    for (let i = 0; i < 32; i++) {
      const kind = trafficKinds[i % trafficKinds.length];
      const v = createVehicleMesh(kind, {
        paintColor: trafficColors[i % trafficColors.length],
        plateText: `B ${1200 + i * 73} JKT`,
      });
      const isBus = kind === "bus_transjakarta";
      const axis: "ns" | "ew" = isBus ? "ns" : i % 2 === 0 ? "ns" : "ew";
      const dir: 1 | -1 = i % 4 < 2 ? 1 : -1;
      const roadCoord = isBus ? 0 : laneRoads[i % laneRoads.length];
      const laneOffset = isBus ? -4.5 : dir > 0 ? 4.8 : -4.8;
      const progress = -250 + ((i * 37) % 500);

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

    // Police PJR Pool
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

      // Traffic Signal Cycle
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
            const accel = spec.acceleration * stageMult * (useNitro ? 1.65 : 1.0);
            s.vehSpeed = Math.min(
              maxSpdMs * (useNitro ? 1.18 : 1),
              s.vehSpeed + accel * throttle * dt
            );
            s.fuel = Math.max(0, s.fuel - dt * 0.5);
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

          // Slowly re-center orbit yaw behind car when driving without dragging camera
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
            if (distHI < 20.5) {
              nextX = (nextX / Math.max(0.1, distHI)) * 20.5;
              nextZ = (nextZ / Math.max(0.1, distHI)) * 20.5;
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
          // On foot with skeletal Walk / Run / Idle animations
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

        // Update Bundaran HI Dancer & 14 Animated Sidewalk Pedestrians
        engineRefs.current.dancer?.update(dt);
        for (const ped of engineRefs.current.pedestrians) {
          ped.z += ped.dir * ped.speed * dt;
          if (ped.z > 230) ped.z = -230;
          if (ped.z < -230) ped.z = 230;
          if (Math.hypot(ped.x, ped.z) < 21) {
            ped.z += ped.dir * 42;
          }
          ped.char.group.position.set(ped.sideX, 0, ped.z);
          ped.char.animate({
            dt,
            timeSec,
            speedRatio: 0.7,
            isJumping: false,
            isSwimming: false,
            isAiming: false,
          });
        }

        // Update Bullets & Explosions
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
            if (b.isRocket) {
              spawnExplosionAt(b.mesh.position);
            }
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

        // 32 Rush-Hour Traffic Units
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
          if (centerDist < 22.5) {
            const ang = Math.atan2(renderX, renderZ);
            renderX = Math.sin(ang) * 23;
            renderZ = Math.cos(ang) * 23;
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

        // Police PJR Pursuit
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

        // Street Race
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

        // Rain
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

        // 360° GTA San Andreas / GTA III Orbit Camera
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
            ? veh.kind === "bus_transjakarta" || veh.kind === "jet"
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

        // Frustum Culling
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
          prop.visible = distSq < 380 * 380 && frustum.containsPoint(tmpVec);
        }

        // 10Hz HUD + GTA SA Radar Sync
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
            raceTarget: activeCp ? { x: activeCp.x, z: activeCp.z } : null,
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
      engineRefs.current.policePool.forEach((p) => p.mesh.dispose());
      engineRefs.current.trafficPool.forEach((t) => t.mesh.dispose());
      engineRefs.current.aiRacers.forEach((r) => r.mesh.dispose());
      bulletGeo.dispose();
      bulletMat.dispose();
      expGeo.dispose();
      expMat.dispose();
      rainGeo.dispose();
      rainMat.dispose();
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

  // Keyboard Controls Listener (Laptop / PC + 1-5 Weapons)
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
        soundEngine.playTeloletBasuri();
        showToast("🎺 KLAKSON TELOLET BASURI V3!");
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

      // 1-5 GTA SA Weapon Hotkeys
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
  }, [stage, howToPlayOpen, toggleEnterExitVehicle, showToast]);

  // Touch Joystick Handlers
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
  // RENDER: MAIN MENU & LOADING SCREEN
  // ============================================================================
  if (stage === "menu" || stage === "loading") {
    return (
      <div className="relative min-h-screen w-full overflow-y-auto bg-[#07080f] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,62,157,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(255,140,56,0.24),_transparent_50%),linear-gradient(180deg,_#090517_0%,_#1b0a2b_55%,_#07080f_100%)]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
          <header className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/15 px-4 py-1 text-xs font-bold uppercase tracking-widest text-pink-200 shadow">
              GTA San Andreas Engine • 47 Model 3D .GLB Nyata • Peta Jakarta .GeoJSON
            </span>
            <h1 className="mt-3 bg-gradient-to-r from-pink-400 via-orange-300 to-amber-300 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-7xl drop-shadow">
              GTA INDONESIA
            </h1>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-slate-950/90 px-5 py-1.5 text-sm sm:text-base shadow-xl backdrop-blur-md">
              <span className="text-slate-300 font-medium">by</span>
              <CreatorLink />
            </div>

            <button
              onClick={() => setHowToPlayOpen(true)}
              className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/15 px-5 py-2 text-xs sm:text-sm font-black text-amber-200 hover:bg-amber-500/25 shadow-lg transition"
            >
              <BookOpen className="h-4 w-4 text-amber-300" />
              📖 Panduan Main & Fitur (Cara Kontrol, Radio, Street View)
            </button>
          </header>

          {stage === "loading" ? (
            <div className="mx-auto mt-8 w-full max-w-xl rounded-3xl border border-pink-500/40 bg-slate-950/90 p-8 text-center shadow-2xl">
              <p className="text-xl font-black text-white">MEMUAT ASET 3D .GLB & KOTA JAKARTA...</p>
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
                        Kamera 360° Mouse, Senjata 1–5, Radar GTA SA & shortcut keyboard lengkap.
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
                    3. Pilih Mobil 3D .GLB Awal
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "supercar",
                        "avanza",
                        "innova",
                        "mercy",
                        "bmw",
                        "civic",
                        "bluebird",
                        "bus_transjakarta",
                        "angkot",
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
  // RENDER: IN-GAME 3D WORLD + GTA SAN ANDREAS HUD
  // ============================================================================
  const activeRegion = getRegionById(selectedRegionId);
  const currentSpec = VEHICLE_SPECS.find((v) => v.id === currentVehicleKind);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Three.js Canvas with 360° Mouse-Look / Touch Orbit + Shooting */}
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

      {/* Top HUD: Left = Radio & Utility Bar, Right = Classic GTA SA Status Block */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-start justify-between gap-2 p-2.5 sm:p-4">
        {/* Left: Radio Jakarta Head Unit + Utility Controls */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setPhoneOpen((p) => !p)}
              className="flex items-center gap-1.5 rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-600/90 to-orange-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:brightness-110"
            >
              <Smartphone className="h-4 w-4" />
              <span>HP / GPS</span>
            </button>

            <button
              onClick={handleTakeScreenshot}
              className="flex items-center gap-1 rounded-xl border border-cyan-400/50 bg-slate-950/80 px-2.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 backdrop-blur-md"
              title="Ambil Foto / Screenshot Jakarta (.PNG)"
            >
              <ImageDown className="h-4 w-4" />
              <span className="hidden md:inline">Screenshot</span>
            </button>

            <button
              onClick={() => setHowToPlayOpen(true)}
              className="rounded-xl border border-amber-400/50 bg-slate-950/80 p-1.5 text-amber-300 hover:bg-amber-500/30 backdrop-blur-md"
              title="Panduan Main & Fitur"
            >
              <HelpCircle className="h-4 w-4" />
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
              <Camera className="h-4 w-4" />
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
              {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setPaused((p) => !p)}
              className="rounded-xl border border-white/15 bg-slate-950/80 p-1.5 text-white hover:bg-slate-800 backdrop-blur-md"
              title="Pause (ESC)"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>

          <JakartaRadioHUD
            channelIndex={radioChannelIndex}
            onChangeChannelIndex={setRadioChannelIndex}
            compact
            muted={muted}
          />

          {raceStatus.active && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-pink-500/60 bg-pink-950/85 px-2.5 py-1 text-xs font-bold text-white">
              <Flag className="h-3.5 w-3.5 text-pink-400" />
              CP {raceStatus.checkpoint}/{raceStatus.total} • {raceStatus.timeSec.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Right: Classic GTA San Andreas Status Block + Clickable Portfolio Watermark */}
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

          <div className="rounded-lg bg-slate-950/75 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 backdrop-blur-sm border border-white/15 shadow">
            GTA Indonesia • <CreatorLink />
          </div>
        </div>
      </div>

      {/* GTA San Andreas Circular Rotating Radar Minimap */}
      <div
        className={`pointer-events-none fixed z-20 ${
          resolvedMobile ? "bottom-36 left-4" : "bottom-4 left-4"
        }`}
      >
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

      {/* GTA SA Classic Slanted Vehicle / District Callout */}
      {calloutText && (
        <div
          className="pointer-events-none fixed bottom-24 right-6 z-30 text-right italic font-black text-2xl sm:text-4xl text-amber-300 tracking-tight"
          style={{ textShadow: "3px 3px 0 #000, -1px -1px 0 #000" }}
        >
          {calloutText}
        </div>
      )}

      {/* Quick Onboarding Tip */}
      {showOnboardingTip && (
        <div className="fixed bottom-28 sm:bottom-24 left-1/2 z-30 w-[92%] max-w-lg -translate-x-1/2 rounded-2xl border border-cyan-400/50 bg-slate-950/95 p-4 text-xs sm:text-sm text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-black text-cyan-300">👋 Selamat Datang di GTA Indonesia!</p>
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

      {/* Toast Banner */}
      {toastMsg && (
        <div className="pointer-events-none fixed top-28 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-pink-500/40 bg-slate-950/90 px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-2xl backdrop-blur-md">
          {toastMsg}
        </div>
      )}

      {/* Desktop Controls Hint + Speedometer */}
      {!resolvedMobile && (
        <>
          <div className="pointer-events-none fixed bottom-4 left-44 z-20 rounded-2xl border border-white/15 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-md space-y-0.5">
            <p className="font-bold text-amber-300">
              💻 Drag Mouse: Kamera 360° • 1-5: Senjata • F: Carjack/Turun
            </p>
            <p>
              WASD: Setir/Jalan • Space: Drift/Lompat • Shift: Nitro • C: Kamera • H: Telolet • R: Radio • P: HP
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

      {/* Mobile Touch Controls */}
      {resolvedMobile && !phoneOpen && !paused && !howToPlayOpen && !activeMinigame && (
        <>
          {inVehicle && (
            <div className="pointer-events-none fixed bottom-44 left-1/2 -translate-x-1/2 z-20 rounded-full border border-white/15 bg-slate-950/80 px-4 py-1 text-xs font-mono font-bold text-white backdrop-blur-md">
              {speedKmh} KM/H • NOS {nitroPct}% • BBM {fuelPct}%
            </div>
          )}

          {/* Left Virtual Analog Joystick */}
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

          {/* Right Pedals & Actions */}
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
                onClick={() => {
                  soundEngine.playTeloletBasuri();
                  showToast("🎺 TELOLET BASURI!");
                }}
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

      {/* Smartphone HUD */}
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
        onChangeRadioChannel={setRadioChannelIndex}
        onTakeScreenshot={handleTakeScreenshot}
        onFastTravel={handleFastTravel}
        onSpawnVehicle={(kind) => {
          spawnPlayerVehicle(kind);
          setPhoneOpen(false);
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

      {/* Portal Mini-Games Modal */}
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

      {/* Panduan Main & Fitur Modal */}
      <HowToPlayModal isOpen={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />

      {/* Pause Menu (`ESC`) */}
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
