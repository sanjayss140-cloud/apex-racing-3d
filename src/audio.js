// Web Audio API Procedural Racing Sound Engine
class RacingAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;

    // Engine oscillators
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Turbo blow-off valve
    this.lastThrottle = false;

    // Nitro jet sound
    this.nitroGain = null;
    this.nitroFilter = null;

    // Tire drift screech
    this.skidGain = null;
    this.skidFilter = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupNitro();
      this.setupSkid();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio Context initialization waiting for user interaction:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngine() {
    if (!this.ctx) return;
    // Primary V10 engine tone (Sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    // Secondary sub rumble (Triangle)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(30, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  setupNitro() {
    if (!this.ctx) return;
    // Jet afterburner filtered noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.masterGain);
    whiteNoise.start();
  }

  setupSkid() {
    if (!this.ctx) return;
    // High-pitched drift screech noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.masterGain);
    whiteNoise.start();
  }

  updateEngine(rpm, isThrottle, isNitro) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const t = this.ctx.currentTime;

    // Map RPM (1000 - 9000) to audio frequency (50Hz - 420Hz)
    const baseFreq = 50 + (rpm / 9000) * 360;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.05);

    const filterFreq = 300 + (rpm / 9000) * 1600;
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.06);

    const targetGain = isThrottle ? 0.09 + (rpm / 9000) * 0.06 : 0.035;
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);

    // Turbo blow-off valve pop when releasing throttle at high RPM
    if (this.lastThrottle && !isThrottle && rpm > 4500) {
      this.playTurboBov();
    }
    this.lastThrottle = isThrottle;

    // Nitro sound
    if (this.nitroGain) {
      const nitroTarget = isNitro ? 0.22 : 0;
      this.nitroGain.gain.setTargetAtTime(nitroTarget, t, 0.06);
    }
  }

  playTurboBov() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.25);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  updateDrift(isDrifting, intensity = 1.0) {
    if (!this.initialized || !this.ctx || !this.skidGain || this.muted) return;
    const targetVol = isDrifting ? Math.min(0.2, 0.08 * intensity) : 0;
    this.skidGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
  }

  playCheckpointChime() {
    this.ensureContext();
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // High energy dual chime: E6 -> G#6 -> B6
    const freqs = [1318.51, 1661.22, 1975.53];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.15, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.46);
    });
  }

  playVictoryFanfare() {
    this.ensureContext();
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Victory triad chords
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);

      gain.gain.setValueAtTime(0.18, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 1.25);
    });
  }

  playCountdownBeep(isGo = false) {
    this.ensureContext();
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t); // High beep on GO

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isGo ? 0.61 : 0.26));
  }
}

export const audio = new RacingAudio();
