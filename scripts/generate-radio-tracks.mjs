#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const RADIO_DIR = path.join(process.cwd(), "public", "audio", "radio");
fs.mkdirSync(RADIO_DIR, { recursive: true });

function writeWavTrack(filePath, durationSec, bpm, bassNotes, leadNotes) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Int16Array(numSamples);

  const beatSec = 60 / bpm;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = t / beatSec;
    const step = Math.floor(beatPos) % bassNotes.length;
    const beatFrac = beatPos - Math.floor(beatPos);

    // Kick drum pulse on every beat
    const kickEnv = Math.exp(-beatFrac * 14);
    const kick = Math.sin(2 * Math.PI * (120 * Math.exp(-beatFrac * 18) + 42) * beatFrac) * kickEnv * 0.45;

    // Warm synth bassline
    const bassFreq = bassNotes[step];
    const bass = (Math.sin(2 * Math.PI * bassFreq * t) + 0.3 * Math.sin(4 * Math.PI * bassFreq * t)) * 0.25;

    // Melodic Rhodes/synth chord arpeggio
    const leadIdx = Math.floor(beatPos * 2) % leadNotes.length;
    const leadFreq = leadNotes[leadIdx];
    const leadEnv = Math.exp(-((beatPos * 2) % 1) * 4.5);
    const lead = Math.sin(2 * Math.PI * leadFreq * t) * leadEnv * 0.22;

    // Hi-hat offbeat
    const hatFrac = (beatPos * 2) % 1;
    const hat = (Math.random() * 2 - 1) * Math.exp(-hatFrac * 24) * 0.08;

    const mix = Math.max(-0.95, Math.min(0.95, kick + bass + lead + hat));
    samples[i] = Math.floor(mix * 32767);
  }

  const dataSize = samples.length * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const pcmBuf = Buffer.from(samples.buffer);
  fs.writeFileSync(filePath, Buffer.concat([header, pcmBuf]));
}

writeWavTrack(
  path.join(RADIO_DIR, "jakarta-sunset-beat.wav"),
  14,
  108,
  [110, 110, 98, 87.31, 98, 110, 130.81, 98],
  [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 493.88]
);

writeWavTrack(
  path.join(RADIO_DIR, "sudirman-night-drive.wav"),
  14,
  120,
  [82.41, 82.41, 98, 110, 98, 82.41, 73.42, 98],
  [329.63, 440, 493.88, 659.25, 587.33, 493.88, 440, 392]
);

writeWavTrack(
  path.join(RADIO_DIR, "sentul-eurobeat.wav"),
  14,
  136,
  [130.81, 130.81, 146.83, 164.81, 146.83, 130.81, 110, 123.47],
  [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33]
);

// Gambang Kromong / Kincir-Kincir Betawi upbeat pentatonic fallback
writeWavTrack(
  path.join(RADIO_DIR, "kincir-kincir-betawi.wav"),
  14,
  122,
  [146.83, 146.83, 196.0, 220.0, 196.0, 146.83, 164.81, 196.0],
  [587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 493.88]
);

// Warm Indonesian Pop Ballad (Kahitna / 90s Pop Jakarta) fallback
writeWavTrack(
  path.join(RADIO_DIR, "kahitna-romantis.wav"),
  16,
  86,
  [130.81, 110.0, 87.31, 98.0, 130.81, 110.0, 98.0, 98.0],
  [523.25, 659.25, 587.33, 523.25, 440.0, 523.25, 587.33, 392.0]
);

// 80s Slow Rock Classic (Heaven style) fallback
writeWavTrack(
  path.join(RADIO_DIR, "heaven-slowrock.wav"),
  16,
  82,
  [130.81, 98.0, 110.0, 87.31, 130.81, 98.0, 87.31, 98.0],
  [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88]
);

console.log("🎵 Generated 6 royalty-free local Jakarta Radio fallback tracks in public/audio/radio/");
