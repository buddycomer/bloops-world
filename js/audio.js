// ============================================================
// AUDIO MODULE — Web Audio API
// Synthesized sounds, zero audio files needed.
// Each sound is self-contained. Add new ones freely.
// ============================================================

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.2, vol = 0.3, delay = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch(e) {}
}

function playChord(freqs, type = 'sine', duration = 0.3, vol = 0.2) {
  freqs.forEach(f => playTone(f, type, duration, vol));
}

// ── SOUND LIBRARY ──────────────────────────────────────────
const SOUNDS = {

  bloop_tap: () => {
    playTone(440, 'sine', 0.15, 0.3);
    playTone(660, 'sine', 0.1, 0.2, 0.05);
  },

  bloop_belly: () => {
    playTone(220, 'sine', 0.3, 0.4);
    playTone(330, 'triangle', 0.2, 0.25, 0.1);
    playTone(440, 'sine', 0.15, 0.2, 0.2);
  },

  bloop_spin: () => {
    [0,0.05,0.1,0.15,0.2].forEach((d,i) => {
      playTone(300 + i * 80, 'sine', 0.12, 0.25, d);
    });
  },

  star: () => {
    playTone(880, 'triangle', 0.12, 0.3);
    playTone(1100, 'triangle', 0.1, 0.2, 0.07);
    playTone(1320, 'triangle', 0.08, 0.15, 0.14);
  },

  flower: () => {
    playTone(523, 'sine', 0.2, 0.3);
    playTone(659, 'sine', 0.15, 0.25, 0.1);
  },

  heart: () => {
    playTone(659, 'sine', 0.15, 0.35);
    playTone(784, 'sine', 0.1, 0.25, 0.12);
  },

  creature_appear: () => {
    playTone(330, 'square', 0.08, 0.2);
    playTone(440, 'square', 0.08, 0.2, 0.08);
    playTone(550, 'square', 0.08, 0.2, 0.16);
  },

  rainbow: () => {
    const notes = [261, 330, 392, 523, 659, 784, 1047];
    notes.forEach((f, i) => playTone(f, 'triangle', 0.4, 0.3, i * 0.07));
  },

  love: () => {
    playChord([523, 659, 784], 'sine', 0.5, 0.25);
    setTimeout(() => playChord([659, 784, 988], 'sine', 0.4, 0.2), 300);
  },

  combo_flash: () => {
    playTone(784, 'triangle', 0.08, 0.4);
    playTone(988, 'triangle', 0.08, 0.35, 0.05);
    playTone(1175, 'triangle', 0.08, 0.3, 0.1);
  },

  chomps_growl: () => {
    try {
      const ctx = getCtx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      src.buffer = buf;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      src.start();
    } catch(e) {}
  },

  celebration: () => {
    const melody = [523,659,784,988,1047,988,1175];
    melody.forEach((f, i) => playTone(f, 'triangle', 0.25, 0.35, i * 0.1));
  }
};

function playSound(name) {
  try {
    if (SOUNDS[name]) SOUNDS[name]();
  } catch(e) {}
}

function playComboSound(combo) {
  const map = {
    rainbow: 'rainbow',
    love: 'love',
    erupt: 'creature_appear',
    default: 'combo_flash'
  };
  playSound(map[combo] || map.default);
}
