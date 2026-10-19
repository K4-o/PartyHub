/**
 * SoundEngine - Web Audio API synthesizer for PartyHub
 * Completely dependency-free, no external .mp3 files
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Short blip tick - 800Hz normal, 1200Hz urgent */
  playTick(urgent = false): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = urgent ? 'triangle' : 'sine';
    osc.frequency.value = urgent ? 1200 : 800;

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  /** Correct answer - C5 → E5 → G5 → C6 arpeggio */
  playCorrect(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  /** Strike/Error buzzer - dual detuned sawtooth at 110Hz + 116Hz */
  playStrike(): void {
    if (this.muted) return;
    const ctx = this.getCtx();

    [110, 116].forEach(freq => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.65);
    });
  }

  /** Buzzer/Lock-in chime - 880Hz → 1320Hz square/triangle */
  playBuzzer(): void {
    if (this.muted) return;
    const ctx = this.getCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'square';
    osc1.frequency.value = 880;

    osc2.type = 'triangle';
    osc2.frequency.value = 1320;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.35);
  }

  /** Card flip - frequency sweep 300Hz → 900Hz in 90ms */
  playFlip(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.09);

    filter.type = 'highpass';
    filter.frequency.value = 200;

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  }

  /** Victory fanfare - 5-note brassy synth */
  playVictory(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    const durations = [0.15, 0.15, 0.15, 0.25, 0.5];
    let time = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const dur = durations[i];
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.35, time + 0.02);
      gainNode.gain.setValueAtTime(0.35, time + dur - 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.start(time);
      osc.stop(time + dur);
      time += dur * 0.85;
    });
  }

  /** Mechanical dial tick */
  playDialTick(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.value = 600;

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  /** Drumroll (rapid ticks for reveal) */
  playDrumroll(duration = 1500): void {
    if (this.muted) return;
    const interval = 80;
    const count = Math.floor(duration / interval);
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.playDialTick(), i * interval);
    }
  }
}

export const soundEngine = new SoundEngine();
