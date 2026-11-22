/**
 * 100% Free Web Audio API synthesizer for GTA Indonesia by Ahmad Alvin Griffin (Vinsky).
 * Generates Engine RPM, Klakson Telolet Basuri, Police PJR Sirens, Gunshots, Drift, Nitro, and Cash SFX.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private muted = false;
  private teloletPlaying = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute && this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    if (mute && this.sirenGain && this.ctx) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public updateEngine(speedKmh: number, active: boolean, isNitro = false): void {
    if (this.muted || !active) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.engineOsc || !this.engineGain) {
      this.engineOsc = ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 340;
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(ctx.destination);
      this.engineOsc.start();
    }

    const absSpeed = Math.abs(speedKmh);
    const freq = 42 + absSpeed * 0.68 + (isNitro ? 45 : 0);
    const vol = Math.min(0.065, 0.015 + absSpeed * 0.00025);
    this.engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.06);
    this.engineGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.06);
  }

  public updatePoliceSiren(active: boolean, timeSec: number): void {
    if (this.muted || !active) {
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06);
      }
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.sirenOsc || !this.sirenGain) {
      this.sirenOsc = ctx.createOscillator();
      this.sirenOsc.type = "triangle";
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(ctx.destination);
      this.sirenOsc.start();
    }

    const hiLo = Math.sin(timeSec * 8) > 0 ? 780 : 540;
    this.sirenOsc.frequency.setTargetAtTime(hiLo, ctx.currentTime, 0.03);
    this.sirenGain.gain.setTargetAtTime(0.035, ctx.currentTime, 0.05);
  }

  public playTeloletBasuri(): void {
    if (this.muted || this.teloletPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.teloletPlaying = true;
    // Authentic Indonesian Basuri Telolet melody notes (Hz)
    const melody = [
      { f: 523.25, d: 0.14 }, // C5
      { f: 587.33, d: 0.14 }, // D5
      { f: 659.25, d: 0.16 }, // E5
      { f: 523.25, d: 0.14 }, // C5
      { f: 659.25, d: 0.16 }, // E5
      { f: 783.99, d: 0.22 }, // G5
      { f: 659.25, d: 0.16 }, // E5
      { f: 523.25, d: 0.28 }, // C5
    ];

    let offset = ctx.currentTime + 0.02;
    melody.forEach((note) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(note.f, offset);
      osc2.frequency.setValueAtTime(note.f * 1.005, offset);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;

      gain.gain.setValueAtTime(0.001, offset);
      gain.gain.exponentialRampToValueAtTime(0.08, offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + note.d);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(offset);
      osc2.start(offset);
      osc1.stop(offset + note.d + 0.02);
      osc2.stop(offset + note.d + 0.02);
      offset += note.d + 0.02;
    });

    setTimeout(() => {
      this.teloletPlaying = false;
    }, 1500);
  }

  public playGunshot(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.14;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 950;

    const gain = ctx.createGain();
    gain.gain.value = 0.22;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  public playCashReward(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    [880, 1174.66, 1396.91].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const t = ctx.currentTime + idx * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playShiftGear(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public stopAll(): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
    if (this.sirenGain && this.ctx) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
  }
}

export const soundEngine = new SoundEngine();
