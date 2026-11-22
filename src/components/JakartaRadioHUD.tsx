"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Upload,
  Volume2,
  Music,
  Search,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Repeat,
  Shuffle,
  Loader2,
} from "lucide-react";

export interface RadioChannel {
  id: string;
  name: string;
  freq: string;
  genre: string;
  streamUrl: string;
  fallbackUrl: string;
  isUploaded?: boolean;
  isTrack?: boolean;
}

export const JAKARTA_RADIO_CHANNELS: RadioChannel[] = [
  {
    id: "kahitna_aku_punya_hati",
    name: "Kahitna - Aku Punya Hati",
    freq: "CH 01",
    genre: "Pop Klasik Jakarta • Request Spesial",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b8/1d/f4/b81df42e-47e8-e61c-29fe-179d240041e1/mzaf_14074178197721553140.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "bryan_adams_heaven",
    name: "Bryan Adams - Heaven",
    freq: "CH 02",
    genre: "80s Slow Rock Classic • Sunset Sudirman",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a6/2d/e1/a62de14c-bdbd-ca8d-7a4c-19fe6c56134d/mzaf_17848443393202843997.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/heaven-slowrock.wav",
    isTrack: true,
  },
  {
    id: "kincir_kincir_betawi",
    name: "Kincir-Kincir (Lagu Betawi)",
    freq: "BETAWI 01",
    genre: "Tuty Tri Sedya • Tradisional Betawi Jakarta",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/6b/9f/dd/6b9fddb0-0320-9f07-bca8-ef33b3d1758e/mzaf_1536616531367758346.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kincir-kincir-betawi.wav",
    isTrack: true,
  },
  {
    id: "benyamin_ondel_ondel",
    name: "Benyamin Sueb - Ondel-Ondel",
    freq: "BETAWI 02",
    genre: "Musik Gambang Kromong & Betawi Asli",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/e0/65/ab/e065abbd-e12a-3c82-132b-a17c1011af8f/mzaf_9963250565345354683.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kincir-kincir-betawi.wav",
    isTrack: true,
  },
  {
    id: "jali_jali_betawi",
    name: "Jali-Jali Betawi (Jakarta)",
    freq: "BETAWI 03",
    genre: "Farid Hardja & Lucky Resha • Keroncong Betawi",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/40/8a/70/408a708f-67bf-75c0-e204-e2a6a7902c17/mzaf_12610068639073182945.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kincir-kincir-betawi.wav",
    isTrack: true,
  },
  {
    id: "benyamin_nonton_bioskop",
    name: "Benyamin S. - Malam Minggu (Nonton Bioskop)",
    freq: "BETAWI 04",
    genre: "Komedi & Nostalgia Jakarta Tempo Dulu",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/aa/65/75/aa657534-bf1c-bdeb-f12d-9b5a9c5ce543/mzaf_11735470384641920183.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kincir-kincir-betawi.wav",
    isTrack: true,
  },
  {
    id: "sheila_on_7_dan",
    name: "Sheila On 7 - Dan...",
    freq: "INDO HITS",
    genre: "Pop Rock Indonesia 2000an",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/98/08/f7/9808f7ad-8328-7780-5d22-aa52b878bd45/mzaf_13785359830703877395.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "dewa_19_kangen",
    name: "Dewa 19 - Kangen",
    freq: "INDO HITS",
    genre: "Baladewa Klasik Sepanjang Masa",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/78/32/bd/7832bd97-72ce-2eb1-4e42-e979be3975b2/mzaf_1951533763365396634.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/heaven-slowrock.wav",
    isTrack: true,
  },
  {
    id: "chrisye_seperti_yang_kau_minta",
    name: "Chrisye - Seperti Yang Kau Minta",
    freq: "INDO LEGENDS",
    genre: "Legenda Musik Indonesia",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/5a/de/095aded7-e1f1-5be7-8d5a-439bfe92b1a6/mzaf_8305585492126908770.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "peterpan_bintang_di_surga",
    name: "Peterpan - Bintang Di Surga",
    freq: "INDO HITS",
    genre: "Pop Rock 2000an",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2f/84/c1/2f84c171-3a65-a4c4-9ef9-c8ab96de6aa7/mzaf_6671966090106159560.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/heaven-slowrock.wav",
    isTrack: true,
  },
  {
    id: "tulus_hati_hati_di_jalan",
    name: "Tulus - Hati-Hati di Jalan",
    freq: "SENOPATI FM",
    genre: "Pop Indonesia Modern • Nyetir Santai",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bb/50/cd/bb50cd11-dbbc-f84e-1244-f1b786af7ab4/mzaf_15441108959417505948.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "diskoria_serenata",
    name: "Diskoria & Dian Sastro - Serenata Jiwa Lara",
    freq: "SCBD DISCO",
    genre: "City Pop & Disko Indonesia Jakarta",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/9f/e1/e1/9fe1e1c8-a9fe-c961-64f3-4797896e4636/mzaf_14645370691300566747.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
    isTrack: true,
  },
  {
    id: "hindia_secukupnya",
    name: "Hindia - Secukupnya",
    freq: "JAKSEL INDIE",
    genre: "Indie Pop Jaksel • Kafe Blok M",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ff/17/6a/ff176a90-1a96-7dd1-c03d-81a29ac29ee6/mzaf_5673156734390336404.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/sudirman-night-drive.wav",
    isTrack: true,
  },
  {
    id: "pamungkas_to_the_bone",
    name: "Pamungkas - To the Bone",
    freq: "JAKSEL INDIE",
    genre: "Acoustic Soul • Nongkrong Sore",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/af/19/12/af1912b2-b7c1-568b-2fd8-d90c4f0ea72b/mzaf_14825437684461051115.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "ran_pandangan_pertama",
    name: "RAN - Pandangan Pertama",
    freq: "JAKSEL INDIE",
    genre: "Upbeat Groovy Pop Indonesia",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1f/b0/bc/1fb0bc51-9ff6-b22c-70a7-9c8bd316dc96/mzaf_1860745480148407019.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
    isTrack: true,
  },
  {
    id: "maliq_pilihanku",
    name: "MALIQ & D'Essentials - Pilihanku",
    freq: "SENOPATI FM",
    genre: "Jazz Pop Jakarta Groove",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c8/ab/96/c8ab967e-8037-cbb2-80a5-94e24f333030/mzaf_9482539451496278281.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
    isTrack: true,
  },
  {
    id: "vierra_seandainya",
    name: "Vierra - Seandainya",
    freq: "WARNET 2010",
    genre: "Nostalgia Warnet & Rental PS",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6d/45/b9/6d45b97c-b4ed-9f7a-100e-104488e82117/mzaf_17584656542507570346.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "slank_ku_tak_bisa",
    name: "Slank - Ku Tak Bisa",
    freq: "POTLOT FM",
    genre: "Rock Anak Jakarta",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/be/ea/60/beea601d-9ebb-d5d2-4afb-9f2bd35018cd/mzaf_4849023038065213672.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/heaven-slowrock.wav",
    isTrack: true,
  },
  {
    id: "gigi_11_januari",
    name: "GIGI - 11 Januari",
    freq: "INDO HITS",
    genre: "Pop Rock Indonesia",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ce/99/74/ce99740a-580a-6c86-8ffd-f1c24c704c60/mzaf_9784759417214576816.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
    isTrack: true,
  },
  {
    id: "samsons_kenangan_terindah",
    name: "SAMSONS - Kenangan Terindah",
    freq: "WARNET 2010",
    genre: "Nostalgia Galau Ibu Kota",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/da/b0/82/dab082b9-1521-1d68-4ff0-4c5644b3659e/mzaf_1824218419488167261.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "yovie_nuno_janji_suci",
    name: "Yovie & Nuno - Janji Suci",
    freq: "INDO HITS",
    genre: "Pop Romantis Indonesia",
    streamUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4b/85/88/4b8588a3-d076-85ef-caae-42fdfbff2ac9/mzaf_6402758454528834079.plus.aac.p.m4a",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
    isTrack: true,
  },
  {
    id: "prambors",
    name: "Prambors FM Jakarta (Live)",
    freq: "102.2 FM",
    genre: "Live Radio • Hits Anak Muda Jakarta",
    streamUrl: "https://masima.rastream.com/masima-pramborsjakarta",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "hardrock",
    name: "Hard Rock FM Jakarta (Live)",
    freq: "87.6 FM",
    genre: "Live Radio • Urban Lifestyle & Pop Rock",
    streamUrl: "https://n02.radiojar.com/7csmg90fuqruv",
    fallbackUrl: "/audio/radio/sudirman-night-drive.wav",
  },
  {
    id: "delta",
    name: "Delta FM Jakarta (Live)",
    freq: "99.1 FM",
    genre: "Live Radio • Lagu Enak Sepanjang Masa",
    streamUrl: "https://masima.rastream.com/masima-deltafm",
    fallbackUrl: "/audio/radio/kahitna-romantis.wav",
  },
  {
    id: "iradio",
    name: "I-Radio Jakarta (Live)",
    freq: "89.6 FM",
    genre: "Live Radio • 100% Musik Indonesia",
    streamUrl: "https://n01.radiojar.com/4ywdgup3bnzuv",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "vinsky_sentul",
    name: "Sentul Eurobeat Turbo (Instrumental)",
    freq: "CH 99",
    genre: "Instrumental Balap Liar & Drift (Offline)",
    streamUrl: "/audio/radio/sentul-eurobeat.wav",
    fallbackUrl: "/audio/radio/sentul-eurobeat.wav",
  },
];

interface JakartaRadioHUDProps {
  channelIndex: number;
  onChangeChannelIndex: (idx: number) => void;
  compact?: boolean;
  muted?: boolean;
  autoPlayOnMount?: boolean;
  enableAudio?: boolean;
  extraChannels?: RadioChannel[];
  onAddChannels?: (newChannels: RadioChannel[]) => number;
}

export const JakartaRadioHUD: React.FC<JakartaRadioHUDProps> = ({
  channelIndex,
  onChangeChannelIndex,
  compact = false,
  muted = false,
  autoPlayOnMount = false,
  enableAudio = true,
  extraChannels = [],
  onAddChannels,
}) => {
  const [localExtras, setLocalExtras] = useState<RadioChannel[]>([]);
  const channels = useMemo(
    () => [...JAKARTA_RADIO_CHANNELS, ...extraChannels, ...localExtras],
    [extraChannels, localExtras]
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(!compact);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [volume, setVolume] = useState(0.55);
  const [bars, setBars] = useState<number[]>([25, 60, 40, 80, 35, 70, 50, 30]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoStartedRef = useRef(false);

  const safeIdx = ((channelIndex % channels.length) + channels.length) % channels.length;
  const activeChannel = channels[safeIdx] ?? channels[0];

  // Equalizer visualizer
  useEffect(() => {
    if (!isPlaying && enableAudio) {
      setBars([12, 12, 12, 12, 12, 12, 12, 12]);
      return;
    }
    const id = setInterval(() => {
      setBars(
        Array.from({ length: 8 }, () => Math.round(20 + Math.random() * 80))
      );
    }, 145);
    return () => clearInterval(id);
  }, [isPlaying, enableAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const playSource = useCallback(
    (url: string, fallbackMode: boolean, loopOverride?: boolean) => {
      if (!enableAudio) return;
      const audio = audioRef.current;
      if (!audio) return;
      setUsingFallback(fallbackMode);
      audio.src = url;
      const isWav = url.endsWith(".wav");
      audio.loop = loopOverride ?? (isWav && !autoNext);
      audio.volume = muted ? 0 : volume;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          if (!fallbackMode && activeChannel.fallbackUrl !== url) {
            playSource(activeChannel.fallbackUrl, true, !autoNext);
          } else {
            setIsPlaying(false);
          }
        });
    },
    [activeChannel.fallbackUrl, activeChannel.isTrack, autoNext, enableAudio, muted, volume]
  );

  // Switch track automatically when channelIndex changes
  useEffect(() => {
    if (!enableAudio) return;
    if (isPlaying || autoStartedRef.current) {
      playSource(activeChannel.streamUrl, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx]);

  // Auto-play music when entering the city so Jakarta never feels silent!
  useEffect(() => {
    if (!enableAudio || !autoPlayOnMount || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const tryStart = () => {
      playSource(activeChannel.streamUrl, false);
    };
    const timer = setTimeout(tryStart, 350);

    const resumeOnGesture = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      window.removeEventListener("pointerdown", resumeOnGesture);
      window.removeEventListener("keydown", resumeOnGesture);
    };
    window.addEventListener("pointerdown", resumeOnGesture, { once: true });
    window.addEventListener("keydown", resumeOnGesture, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", resumeOnGesture);
      window.removeEventListener("keydown", resumeOnGesture);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableAudio, autoPlayOnMount]);

  const togglePlay = () => {
    if (!enableAudio) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playSource(activeChannel.streamUrl, false);
    }
  };

  const handlePrev = () => {
    onChangeChannelIndex((safeIdx - 1 + channels.length) % channels.length);
    if (enableAudio && !isPlaying) {
      setTimeout(() => playSource(channels[(safeIdx - 1 + channels.length) % channels.length].streamUrl, false), 40);
    }
  };

  const handleNext = useCallback(() => {
    const nextIdx = (safeIdx + 1) % channels.length;
    onChangeChannelIndex(nextIdx);
    if (enableAudio) {
      setTimeout(() => playSource(channels[nextIdx].streamUrl, false), 40);
    }
  }, [channels, enableAudio, onChangeChannelIndex, playSource, safeIdx]);

  const handleSelectChannel = (idx: number) => {
    onChangeChannelIndex(idx);
    if (enableAudio) {
      setTimeout(() => {
        const ch = channels[idx];
        if (ch) playSource(ch.streamUrl, false);
      }, 30);
    }
  };

  const handleUploadMp3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploaded: RadioChannel[] = Array.from(files).map((file, i) => ({
      id: `upload_${Date.now()}_${i}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      freq: "MP3 USER",
      genre: "Lagu Upload Sendiri",
      streamUrl: URL.createObjectURL(file),
      fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
      isUploaded: true,
      isTrack: true,
    }));

    const targetIdx = channels.length;
    if (onAddChannels) {
      onAddChannels(uploaded);
    } else {
      setLocalExtras((prev) => [...prev, ...uploaded]);
    }
    onChangeChannelIndex(targetIdx);
    if (enableAudio) {
      setTimeout(() => playSource(uploaded[0].streamUrl, false), 80);
    }
  };

  const handleSearchSongs = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&entity=song&limit=6&country=ID`
      );
      if (!res.ok) throw new Error("Gagal memuat pencarian");
      const json = await res.json();
      const results = Array.isArray(json?.results) ? json.results : [];
      const found: RadioChannel[] = results
        .filter((r: { previewUrl?: string }) => Boolean(r?.previewUrl))
        .map(
          (r: {
            trackId?: number;
            artistName?: string;
            trackName?: string;
            primaryGenreName?: string;
            previewUrl: string;
          }) => ({
            id: `itunes_${r.trackId || Date.now()}_${Math.random()}`,
            name: `${r.artistName || "Artis"} - ${r.trackName || q}`,
            freq: "SEARCH",
            genre: r.primaryGenreName || "Hasil Pencarian Musik",
            streamUrl: r.previewUrl,
            fallbackUrl: "/audio/radio/kahitna-romantis.wav",
            isTrack: true,
          })
        );

      if (found.length === 0) {
        setSearchError("Lagu tidak ditemukan, coba kata kunci lain atau Upload MP3.");
      } else {
        const startIdx = channels.length;
        if (onAddChannels) {
          onAddChannels(found);
        } else {
          setLocalExtras((prev) => [...prev, ...found]);
        }
        onChangeChannelIndex(startIdx);
        if (enableAudio) {
          setTimeout(() => playSource(found[0].streamUrl, false), 80);
        }
      }
    } catch {
      setSearchError("Koneksi pencarian gagal, pakai daftar lagu lokal/tersedia.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-pink-500/40 bg-slate-950/90 text-white backdrop-blur-md shadow-2xl ${
        compact ? "px-3 py-2 w-[275px] sm:w-[325px]" : "p-3.5 w-full"
      }`}
    >
      {enableAudio && (
        <audio
          ref={audioRef}
          onEnded={() => {
            if (autoNext) {
              handleNext();
            } else if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }}
          onError={() => {
            if (!usingFallback && audioRef.current) {
              playSource(activeChannel.fallbackUrl, true, false);
            }
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleUploadMp3}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 shrink-0 text-pink-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 truncate">
              {activeChannel.freq} {usingFallback ? "• Instrumen Lokal" : "• SOUNDTRACK"}
            </span>
          </div>
          <p className="truncate text-xs font-bold text-white mt-0.5" title={activeChannel.name}>
            {activeChannel.name}
          </p>
          {!compact && (
            <p className="truncate text-[11px] text-slate-400">
              {activeChannel.genre}
            </p>
          )}
        </div>

        {/* Equalizer Visualizer */}
        <div className="flex h-6 items-end gap-0.5 px-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-t bg-gradient-to-t from-pink-500 to-cyan-400 transition-all duration-100"
              style={{ height: `${Math.max(15, h)}%` }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
            title="Lagu Sebelumnya"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          {enableAudio && (
            <button
              onClick={togglePlay}
              className="rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 p-1.5 text-white shadow hover:brightness-110"
              title="Play / Pause Radio"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={handleNext}
            className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
            title="Ganti Lagu (R)"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          {compact && (
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="flex items-center gap-0.5 rounded-lg bg-pink-500/25 border border-pink-400/50 px-2 py-1.5 text-[10px] font-black text-pink-200 hover:bg-pink-500/40"
              title="Pilih Lagu / Cari Soundtrack"
            >
              <ListMusic className="h-3 w-3" />
              {drawerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
          {/* Volume + Auto-DJ + Upload */}
          <div className="flex flex-wrap items-center gap-1.5">
            {enableAudio && (
              <div className="flex flex-1 min-w-[110px] items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-pink-500 h-1.5"
                />
              </div>
            )}
            <button
              onClick={() => setAutoNext((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold border ${
                autoNext
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                  : "border-amber-400/50 bg-amber-500/20 text-amber-200"
              }`}
              title="Mode Putar Otomatis atau Loop 1 Lagu"
            >
              {autoNext ? <Shuffle className="h-3 w-3" /> : <Repeat className="h-3 w-3" />}
              {autoNext ? "Auto-DJ" : "Loop 1"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-2 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30"
            >
              <Upload className="h-3 w-3" /> MP3
            </button>
          </div>

          {/* Search Any Song */}
          <form onSubmit={handleSearchSongs} className="flex gap-1.5">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lagu lain (Noah, Tulus, Westlife...)"
              className="flex-1 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] text-white placeholder:text-slate-500 outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="flex items-center gap-1 rounded-lg bg-pink-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-pink-500 disabled:opacity-60"
            >
              {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              Cari
            </button>
          </form>
          {searchError && <p className="text-[10px] text-amber-300">{searchError}</p>}

          {/* Selectable Song & Station Playlist (searched / uploaded songs shown at top!) */}
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {channels
              .map((ch, idx) => ({ ch, idx }))
              .sort((a, b) => {
                const aCustom = a.idx >= JAKARTA_RADIO_CHANNELS.length ? 1 : 0;
                const bCustom = b.idx >= JAKARTA_RADIO_CHANNELS.length ? 1 : 0;
                if (aCustom !== bCustom) return bCustom - aCustom;
                if (aCustom && bCustom) return b.idx - a.idx;
                return a.idx - b.idx;
              })
              .map(({ ch, idx }) => (
                <button
                  key={`${ch.id}_${idx}`}
                  onClick={() => handleSelectChannel(idx)}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                    idx === safeIdx
                      ? "bg-pink-500/25 border border-pink-400/60 text-white"
                      : "bg-slate-900/75 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Music className="h-3 w-3 text-pink-400 shrink-0" />
                    <span className="truncate font-semibold">{ch.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 shrink-0 ml-2">
                    {ch.freq}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
