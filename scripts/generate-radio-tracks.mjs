#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const RADIO_DIR = path.join(process.cwd(), "public", "audio", "radio");
fs.mkdirSync(RADIO_DIR, { recursive: true });

function writeWavTrack(filePath, durationSec, bpm, bassNotes, leadNotes, chordNotes) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Int16Array(numSamples);

  const beatSec = 60 / bpm;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = t / beatSec;
    const bar = Math.floor(beatPos / 4) % 4;
    const step = Math.floor(beatPos) % bassNotes.length;
    const beatFrac = beatPos - Math.floor(beatPos);

    // Kick drum pulse on beats 1 & 3 + subtle snare on 2 & 4
    const kickEnv = Math.exp(-beatFrac * 13);
    const kick =
      Math.sin(2 * Math.PI * (115 * Math.exp(-beatFrac * 17) + 44) * beatFrac) * kickEnv * 0.42;

    // Warm synth bassline (varies dynamically on bridge bars)
    const barMult = bar === 2 ? 1.122 : 1.0;
    const bassFreq = bassNotes[step] * barMult;
    const bass =
      (Math.sin(2 * Math.PI * bassFreq * t) + 0.25 * Math.sin(4 * Math.PI * bassFreq * t)) * 0.24;

    // Warm electric piano / Rhodes chord pad
    const chordRoot = chordNotes[step % chordNotes.length] * barMult;
    const pad =
      (Math.sin(2 * Math.PI * chordRoot * t) +
        0.65 * Math.sin(2 * Math.PI * chordRoot * 1.25 * t) +
        0.55 * Math.sin(2 * Math.PI * chordRoot * 1.5 * t)) *
      0.085;

    // Expressive multi-phrase lead melody (shifts up an octave on chorus section)
    const sectionOffset = Math.floor(t / (durationSec * 0.5)) === 1 ? 1.5 : 1.0;
    const leadIdx = Math.floor(beatPos * 2) % leadNotes.length;
    const leadFreq = leadNotes[leadIdx] * (bar === 3 ? 1.0 : sectionOffset === 1.5 ? 1.0 : 1.0);
    const halfBeat = (beatPos * 2) % 1;
    const leadEnv = Math.exp(-halfBeat * 3.8);
    const lead =
      (Math.sin(2 * Math.PI * leadFreq * t) + 0.18 * Math.sin(4 * Math.PI * leadFreq * t)) *
      leadEnv *
      0.22;

    // Hi-hat & shaker groove
    const hatFrac = (beatPos * 2) % 1;
    const hat = (Math.random() * 2 - 1) * Math.exp(-hatFrac * 24) * 0.065;

    const mix = Math.max(-0.95, Math.min(0.95, kick + bass + pad + lead + hat));
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
  28,
  108,
  [110, 110, 98, 87.31, 98, 110, 130.81, 98],
  [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 493.88, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 392],
  [220, 196, 174.61, 196]
);

writeWavTrack(
  path.join(RADIO_DIR, "sudirman-night-drive.wav"),
  28,
  118,
  [82.41, 82.41, 98, 110, 98, 82.41, 73.42, 98],
  [329.63, 440, 493.88, 659.25, 587.33, 493.88, 440, 392, 440, 523.25, 659.25, 783.99, 659.25, 587.33, 493.88, 440],
  [164.81, 196, 220, 196]
);

writeWavTrack(
  path.join(RADIO_DIR, "sentul-eurobeat.wav"),
  28,
  136,
  [130.81, 130.81, 146.83, 164.81, 146.83, 130.81, 110, 123.47],
  [523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33],
  [261.63, 293.66, 329.63, 246.94]
);

// Gambang Kromong / Kincir-Kincir Betawi upbeat pentatonic arrangement
writeWavTrack(
  path.join(RADIO_DIR, "kincir-kincir-betawi.wav"),
  28,
  120,
  [146.83, 146.83, 196.0, 220.0, 196.0, 146.83, 164.81, 196.0],
  [587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 493.88, 587.33, 783.99, 880.0, 987.77, 880.0, 783.99, 659.25, 587.33],
  [293.66, 392.0, 440.0, 293.66]
);

// Warm Indonesian Pop Ballad (Kahitna / 90s Pop Jakarta) arrangement
writeWavTrack(
  path.join(RADIO_DIR, "kahitna-romantis.wav"),
  28,
  86,
  [130.81, 110.0, 87.31, 98.0, 130.81, 110.0, 98.0, 98.0],
  [523.25, 659.25, 587.33, 523.25, 440.0, 523.25, 587.33, 392.0, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 392.0],
  [261.63, 220.0, 174.61, 196.0]
);

// 80s Slow Rock Classic (Heaven style) arrangement
writeWavTrack(
  path.join(RADIO_DIR, "heaven-slowrock.wav"),
  28,
  82,
  [130.81, 98.0, 110.0, 87.31, 130.81, 98.0, 87.31, 98.0],
  [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 493.88],
  [261.63, 196.0, 220.0, 174.61]
);

console.log("🎵 Generated 6 extended 28s Jakarta Radio tracks in public/audio/radio/");
