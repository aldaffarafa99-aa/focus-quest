// Web Audio API Synthesizer - 100% Client-Side, No External MP3/Assets Required

class SoundController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientSource = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.isAmbientPlaying) {
      this.stopAmbientNoise();
    }
  }

  // 8-bit Laser / Attack sound
  playAttack() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback fail-safe
    }
  }

  // Critical Strike sound
  playCritical() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High ping + drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // fail-safe
    }
  }

  // Quest Completed chime (friendly bell)
  playQuestDone() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {
      // fail-safe
    }
  }

  // Boss KO / Victory Fanfare!
  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const chords = [
        { freq: 440, time: 0.00 }, // A4
        { freq: 554.37, time: 0.12 }, // C#5
        { freq: 659.25, time: 0.24 }, // E5
        { freq: 880, time: 0.36 }, // A5
        { freq: 1108.73, time: 0.55 }, // C#6
      ];

      const now = this.ctx.currentTime;
      chords.forEach(({ freq, time }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.25, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.65);
      });
    } catch {
      // fail-safe
    }
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const now = this.ctx.currentTime;

      melody.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch {
      // fail-safe
    }
  }

  // Soft Button Click
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // fail-safe
    }
  }

  // Synthesized Ambient White Noise / Focus Rain
  toggleAmbientNoise() {
    if (this.isAmbientPlaying) {
      this.stopAmbientNoise();
      return false;
    } else {
      this.startAmbientNoise();
      return true;
    }
  }

  startAmbientNoise() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Create 2-second looped noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink noise filter approximation for soothing rain sound
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.12;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Low pass filter to make it gentle like rain/stream
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  stopAmbientNoise() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch {
        // fail-safe
      }
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
  }
}

export const soundManager = new SoundController();
