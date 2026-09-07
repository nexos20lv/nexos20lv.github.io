// Web Audio API Procedural Synthesizer for NeXsu!
// Zero external mp3 dependencies, ultra-low latency, pure procedural sound.

class NexsuAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private currentStep: number = 0;
  private isMusicPlaying: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Sound effects
  public playCountdown(isFinal: boolean) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isFinal ? 0.35 : 0.15));
    } catch {
      // AudioContext not allowed before user interaction
    }
  }

  public playHit300() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Bright bell chime (two harmonious sines)
      [1046.5, 1567.98].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  public playHit100() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(783.99, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  public playHit50() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playMiss() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  // 130 BPM Synthwave Cyberpunk Rhythm Loop
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    const bpm = 130;
    // 16th note interval in ms: (60 / 130 / 4) * 1000 = ~115.38 ms
    const stepInterval = (60 / bpm / 4) * 1000;

    // Bassline notes: F1 (43.65), Ab1 (51.91), Bb1 (58.27), C2 (65.41)
    const bassline = [43.65, 43.65, 51.91, 43.65, 58.27, 43.65, 65.41, 58.27];
    // Arpeggio notes: F4 (349.23), Ab4 (415.30), C5 (523.25), Eb5 (622.25)
    const arpNotes = [349.23, 415.30, 523.25, 622.25, 523.25, 415.30, 622.25, 698.46];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted) return;
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const step = this.currentStep;

        // Kick on every 4th 16th note (beats 0, 4, 8, 12)
        if (step % 4 === 0) {
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.type = "sine";
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

          kickGain.gain.setValueAtTime(0.24, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);

          kickOsc.start(now);
          kickOsc.stop(now + 0.1);
        }

        // Snare on beats 4 and 12 (steps 4 and 12 of 16)
        if (step % 8 === 4) {
          const noiseNode = ctx.createBufferSource();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          noiseNode.buffer = buffer;

          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = "highpass";
          noiseFilter.frequency.setValueAtTime(800, now);

          const snareGain = ctx.createGain();
          snareGain.gain.setValueAtTime(0.15, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          noiseNode.connect(noiseFilter);
          noiseFilter.connect(snareGain);
          snareGain.connect(ctx.destination);

          noiseNode.start(now);
        }

        // Hi-hat on offbeats (every 2 steps)
        if (step % 2 === 1) {
          const hatNode = ctx.createBufferSource();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          hatNode.buffer = buffer;

          const hatFilter = ctx.createBiquadFilter();
          hatFilter.type = "highpass";
          hatFilter.frequency.setValueAtTime(6000, now);

          const hatGain = ctx.createGain();
          hatGain.gain.setValueAtTime(0.06, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          hatNode.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(ctx.destination);

          hatNode.start(now);
        }

        // Synth bass on 8th notes
        if (step % 2 === 0) {
          const bassNote = bassline[(step / 2) % bassline.length];
          const bassOsc = ctx.createOscillator();
          const bassFilter = ctx.createBiquadFilter();
          const bassGain = ctx.createGain();

          bassOsc.type = "sawtooth";
          bassOsc.frequency.setValueAtTime(bassNote, now);

          bassFilter.type = "lowpass";
          bassFilter.frequency.setValueAtTime(450, now);

          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.12);
        }

        // Cyber Arp Lead on 16th notes
        const arpNote = arpNotes[step % arpNotes.length];
        const arpOsc = ctx.createOscillator();
        const arpGain = ctx.createGain();

        arpOsc.type = "triangle";
        arpOsc.frequency.setValueAtTime(arpNote, now);

        arpGain.gain.setValueAtTime(0.05, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        arpOsc.connect(arpGain);
        arpGain.connect(ctx.destination);

        arpOsc.start(now);
        arpOsc.stop(now + 0.07);

        this.currentStep = (this.currentStep + 1) % 64;
      } catch {
        // AudioContext not active yet
      }
    }, stepInterval);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const nexsuAudio = new NexsuAudioEngine();

