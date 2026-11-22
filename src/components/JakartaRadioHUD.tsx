"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Upload,
  Volume2,
  Music,
} from "lucide-react";

export interface RadioChannel {
  id: string;
  name: string;
  freq: string;
  genre: string;
  streamUrl: string;
  fallbackUrl: string;
  isUploaded?: boolean;
}

export const JAKARTA_RADIO_CHANNELS: RadioChannel[] = [
  {
    id: "prambors",
    name: "Prambors FM Jakarta",
    freq: "102.2 FM",
    genre: "Hits Jakarta & Anak Muda",
    streamUrl: "https://masima.rastream.com/masima-pramborsjakarta",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "hardrock",
    name: "Hard Rock FM Jakarta",
    freq: "87.6 FM",
    genre: "Urban Lifestyle & Pop Rock",
    streamUrl: "https://n02.radiojar.com/7csmg90fuqruv",
    fallbackUrl: "/audio/radio/sudirman-night-drive.wav",
  },
  {
    id: "delta",
    name: "Delta FM Jakarta",
    freq: "99.1 FM",
    genre: "Lagu Enak Sepanjang Masa",
    streamUrl: "https://masima.rastream.com/masima-deltafm",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "genfm",
    name: "Gen FM Jakarta",
    freq: "98.7 FM",
    genre: "Pop Indonesia & Top 40",
    streamUrl: "https://stream-ssl.radioparadise.com/mp3-128",
    fallbackUrl: "/audio/radio/sentul-eurobeat.wav",
  },
  {
    id: "elshinta",
    name: "Elshinta News & Traffic",
    freq: "90.0 FM",
    genre: "Info Lalu Lintas Jabodetabek",
    streamUrl: "https://stream.elshinta.com/elshinta-jakarta",
    fallbackUrl: "/audio/radio/sudirman-night-drive.wav",
  },
  {
    id: "iradio",
    name: "I-Radio Jakarta",
    freq: "89.6 FM",
    genre: "100% Musik Indonesia",
    streamUrl: "https://n01.radiojar.com/4ywdgup3bnzuv",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "vinsky_sunset",
    name: "Vinsky Sunset Drive",
    freq: "CH 07",
    genre: "Lo-Fi Sunset Sudirman (Lokal)",
    streamUrl: "/audio/radio/jakarta-sunset-beat.wav",
    fallbackUrl: "/audio/radio/jakarta-sunset-beat.wav",
  },
  {
    id: "vinsky_night",
    name: "SCBD Night Cruise",
    freq: "CH 08",
    genre: "Synthwave Jakarta (Lokal)",
    streamUrl: "/audio/radio/sudirman-night-drive.wav",
    fallbackUrl: "/audio/radio/sudirman-night-drive.wav",
  },
  {
    id: "vinsky_sentul",
    name: "Sentul Eurobeat Turbo",
    freq: "CH 09",
    genre: "Balap Liar & Drift (Lokal)",
    streamUrl: "/audio/radio/sentul-eurobeat.wav",
    fallbackUrl: "/audio/radio/sentul-eurobeat.wav",
  },
];

interface JakartaRadioHUDProps {
  channelIndex: number;
  onChangeChannelIndex: (idx: number) => void;
  compact?: boolean;
  muted?: boolean;
}

export const JakartaRadioHUD: React.FC<JakartaRadioHUDProps> = ({
  channelIndex,
  onChangeChannelIndex,
  compact = false,
  muted = false,
}) => {
  const [channels, setChannels] = useState<RadioChannel[]>(JAKARTA_RADIO_CHANNELS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [bars, setBars] = useState<number[]>([25, 60, 40, 80, 35, 70, 50, 30]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const safeIdx = ((channelIndex % channels.length) + channels.length) % channels.length;
  const activeChannel = channels[safeIdx];

  // Equalizer animation while playing
  useEffect(() => {
    if (!isPlaying) {
      setBars([12, 12, 12, 12, 12, 12, 12, 12]);
      return;
    }
    const id = setInterval(() => {
      setBars(
        Array.from({ length: 8 }, () => Math.round(18 + Math.random() * 82))
      );
    }, 140);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const playSource = useCallback(
    (url: string, fallbackMode: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      setUsingFallback(fallbackMode);
      audio.src = url;
      audio.loop = url.endsWith(".wav") || fallbackMode || url.startsWith("blob:");
      audio.volume = muted ? 0 : volume;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          if (!fallbackMode && activeChannel.fallbackUrl !== url) {
            playSource(activeChannel.fallbackUrl, true);
          } else {
            setIsPlaying(false);
          }
        });
    },
    [activeChannel.fallbackUrl, muted, volume]
  );

  // Switch track automatically when channelIndex changes while radio is on
  useEffect(() => {
    if (isPlaying) {
      playSource(activeChannel.streamUrl, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx]);

  const togglePlay = () => {
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
  };

  const handleNext = () => {
    onChangeChannelIndex((safeIdx + 1) % channels.length);
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
    }));

    const nextChannels = [...channels, ...uploaded];
    setChannels(nextChannels);
    const targetIdx = channels.length;
    onChangeChannelIndex(targetIdx);
    setTimeout(() => {
      playSource(uploaded[0].streamUrl, false);
    }, 60);
  };

  return (
    <div
      className={`rounded-2xl border border-pink-500/35 bg-slate-950/85 text-white backdrop-blur-md shadow-xl ${
        compact ? "px-3 py-2 w-[265px] sm:w-[300px]" : "p-3.5 w-full"
      }`}
    >
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onError={() => {
          if (!usingFallback && audioRef.current) {
            playSource(activeChannel.fallbackUrl, true);
          }
        }}
      />
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
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              {activeChannel.freq} {usingFallback ? "• Backup Lokal" : "• LIVE"}
            </span>
          </div>
          <p className="truncate text-xs font-bold text-white mt-0.5">
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
            title="Channel Sebelumnya"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className="rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 p-1.5 text-white shadow hover:brightness-110"
            title="Play / Pause Radio"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
            title="Ganti Channel (R)"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 space-y-2.5 border-t border-white/10 pt-2.5">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-pink-500 h-1.5"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30"
            >
              <Upload className="h-3 w-3" /> Upload MP3
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {channels.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  onChangeChannelIndex(idx);
                  playSource(ch.streamUrl, false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                  idx === safeIdx
                    ? "bg-pink-500/20 border border-pink-400/50 text-white"
                    : "bg-slate-900/70 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate font-semibold">
                  <Music className="h-3 w-3 text-pink-400 shrink-0" />
                  <span className="truncate">{ch.name}</span>
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
