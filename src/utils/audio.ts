/**
 * Web Audio API synthesizer for realistic hardware sounds:
 * - PC Fan hum / spin up
 * - Motherboard POST buzzer beeps (accurate frequencies and cadences)
 * - Tactile clicks for RAM latches, PCIe clips, cable snaps, screws
 */

class HardwareSoundSystem {
  private ctx: AudioContext | null = null;
  private fanOsc1: OscillatorNode | null = null;
  private fanOsc2: OscillatorNode | null = null;
  private fanGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.fanGain) {
      this.fanGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Motherboard POST buzzer beeps (usually 850Hz - 1000Hz square or pulse wave)
   */
  public playBeep(type: 'single_short' | 'three_beeps' | 'one_long_two_short' | 'continuous') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const createBuzzerTone = (start: number, duration: number, freq: number = 880) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.setValueAtTime(0.12, start + duration - 0.01);
      gain.gain.linearRampToValueAtTime(0, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    switch (type) {
      case 'single_short':
        // Standard healthy POST beep: 0.12s
        createBuzzerTone(now + 0.1, 0.14, 932);
        break;

      case 'three_beeps':
        // Memory error: 3 beeps (0.28s each, 0.18s gap)
        createBuzzerTone(now + 0.1, 0.28, 784);
        createBuzzerTone(now + 0.55, 0.28, 784);
        createBuzzerTone(now + 1.0, 0.28, 784);
        break;

      case 'one_long_two_short':
        // Display / GPU error: 1 long (0.6s), 2 short (0.2s each)
        createBuzzerTone(now + 0.1, 0.6, 880);
        createBuzzerTone(now + 0.85, 0.2, 880);
        createBuzzerTone(now + 1.2, 0.2, 880);
        break;

      case 'continuous':
        // Critical power or fatal POST
        for (let i = 0; i < 6; i++) {
          createBuzzerTone(now + 0.1 + i * 0.25, 0.15, 660);
        }
        break;
    }
  }

  /**
   * Fan hum simulation
   */
  public updateFanState(spinning: boolean) {
    this.initContext();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (spinning && !this.isMuted) {
      if (!this.fanGain) {
        this.fanGain = ctx.createGain();
        this.fanGain.gain.setValueAtTime(0, now);
        this.fanGain.connect(ctx.destination);

        // Low frequency motor hum
        this.fanOsc1 = ctx.createOscillator();
        this.fanOsc1.type = 'triangle';
        this.fanOsc1.frequency.setValueAtTime(75, now);

        // Higher harmonic for airflow
        this.fanOsc2 = ctx.createOscillator();
        this.fanOsc2.type = 'sine';
        this.fanOsc2.frequency.setValueAtTime(150, now);

        this.fanOsc1.connect(this.fanGain);
        this.fanOsc2.connect(this.fanGain);

        this.fanOsc1.start();
        this.fanOsc2.start();
      }

      // Ramp up fan speed sound
      this.fanGain.gain.cancelScheduledValues(now);
      this.fanGain.gain.linearRampToValueAtTime(0.045, now + 1.2);
      this.fanOsc1?.frequency.linearRampToValueAtTime(110, now + 1.2);
    } else {
      if (this.fanGain) {
        this.fanGain.gain.cancelScheduledValues(now);
        this.fanGain.gain.linearRampToValueAtTime(0, now + 0.8);
      }
    }
  }

  /**
   * Mechanical Click / Snap
   */
  public playClick(type: 'latch' | 'switch' | 'cable' | 'screw' | 'panel') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    let freq = 1200;
    let dur = 0.03;
    let vol = 0.15;

    if (type === 'latch') {
      // RAM DIMM latch click: sharp snappy dual click
      freq = 2400;
      dur = 0.04;
      vol = 0.22;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);
    } else if (type === 'switch') {
      // Rocker switch
      freq = 600;
      dur = 0.05;
      vol = 0.18;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
    } else if (type === 'cable') {
      // Plastic clip snapping
      freq = 1600;
      dur = 0.04;
      vol = 0.2;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
    } else if (type === 'screw') {
      // Metal screw thread sound
      freq = 3200;
      dur = 0.06;
      vol = 0.12;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
    } else if (type === 'panel') {
      // Case side panel sliding
      freq = 250;
      dur = 0.15;
      vol = 0.14;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + dur);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  /**
   * Multimeter continuity beep
   */
  public playMultimeterBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.setValueAtTime(0.08, now + 0.18);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const soundFX = new HardwareSoundSystem();
