// ============================================================
// DANCE GRID MINI GAME — dancegrid.js
// Fully self-contained plugin.
// Call DanceGrid.launch() to start, fires onComplete when done.
// ============================================================

const DanceGrid = (() => {

  // ── CONSTANTS ──────────────────────────────────────────
  const CELL_COUNT = 9;

  // One musical note per cell — pentatonic scale, always sounds happy
  const CELL_NOTES = [
    523.25,  // C5  — red
    587.33,  // D5  — orange
    659.25,  // E5  — yellow
    783.99,  // G5  — green
    880.00,  // A5  — blue
    1046.50, // C6  — purple
    1174.66, // D6  — pink
    1318.51, // E6  — teal
    1567.98  // G6  — amber
  ];

  const FIREWORK_EMOJIS = ['🎆','🎇','✨','🌟','💥','🎉','⭐','💫','🎊','🌈'];

  // Celebration ladder — indexed by sequence length completed
  const CELEBRATIONS = [
    null, // 0
    { size: 'small',  emojis: 4,  text: 'Yay!',           speech: 'Yay! Good job Zane!' },
    { size: 'medium', emojis: 8,  text: 'Woohoo!',         speech: 'Woohoo! Zane did it!' },
    { size: 'large',  emojis: 14, text: 'Amazing!',        speech: 'Amazing! Zane is so good!' },
    { size: 'huge',   emojis: 20, text: 'ZANE IS ON FIRE!',speech: 'Zane is on fire! Keep going!' },
  ];

  // ── STATE ──────────────────────────────────────────────
  let sequence       = [];
  let playerInput    = [];
  let phase          = 'idle'; // idle | showing | waiting | celebrating
  let onCompleteCb   = null;
  let audioCtx       = null;
  let showDelay      = 600;  // ms between each bloop square flash
  let isActive       = false;

  // ── AUDIO ──────────────────────────────────────────────
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playNote(freq, duration = 0.35, vol = 0.4) {
    try {
      const ctx = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 3000;
      osc.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch(e) {}
  }

  function playChipmunk(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate  = 1.4;   // slightly faster
      utt.pitch = 2.0;   // maximum chipmunk
      utt.volume = 1.0;

      // Pick the friendliest available voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Google') && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (preferred) utt.voice = preferred;

      window.speechSynthesis.speak(utt);
    } catch(e) {}
  }

  function playCelebrationSound(size) {
    const melodies = {
      small:  [523, 659, 784],
      medium: [523, 659, 784, 1047],
      large:  [523, 659, 784, 1047, 1319],
      huge:   [523, 659, 784, 1047, 1319, 1568, 2093]
    };
    const notes = melodies[size] || melodies.small;
    notes.forEach((f, i) => {
      setTimeout(() => playNote(f, 0.3, 0.35), i * 100);
    });
  }

  function playMissSound() {
    try {
      const ctx = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } catch(e) {}
  }

  // ── DOM HELPERS ────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function flashCell(gridId, idx, duration = 400) {
    const cell = document.querySelector(`#${gridId} .dg-cell[data-idx="${idx}"]`);
    if (!cell) return;
    cell.classList.add('flash');
    playNote(CELL_NOTES[idx]);
    setTimeout(() => cell.classList.remove('flash'), duration);
  }

  function setStatus(text) {
    const el = $('dg-status');
    if (el) el.textContent = text;
  }

  function setBloopLabel(text) {
    const el = $('dg-sequence-display');
    if (el) el.textContent = text;
  }

  function animateBloopAvatar(type) {
    const el = $('dg-bloop-avatar');
    if (!el) return;
    el.classList.remove('hop','wiggle');
    void el.offsetWidth;
    el.classList.add(type);
    el.addEventListener('animationend', () => el.classList.remove(type), { once: true });
  }

  // ── FIREWORKS ──────────────────────────────────────────
  function spawnFireworks(count) {
    const container = $('dg-fireworks');
    if (!container) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const fw = document.createElement('div');
        fw.className = 'dg-firework';
        fw.textContent = FIREWORK_EMOJIS[Math.floor(Math.random() * FIREWORK_EMOJIS.length)];
        fw.style.left = (10 + Math.random() * 80) + '%';
        fw.style.top  = (10 + Math.random() * 70) + '%';
        fw.style.setProperty('--fw-dur', (0.7 + Math.random() * 0.8) + 's');
        fw.style.setProperty('--fw-rot', (Math.random() * 60 - 30) + 'deg');
        container.appendChild(fw);
        fw.addEventListener('animationend', () => fw.remove());
      }, i * 80 + Math.random() * 100);
    }
  }

  function showCelebration(level) {
    const idx = Math.min(level, CELEBRATIONS.length - 1);
    const celeb = CELEBRATIONS[idx] || CELEBRATIONS[CELEBRATIONS.length - 1];

    // Fireworks
    spawnFireworks(celeb.emojis);

    // Big text pop
    const overlay = $('dg-celebration');
    const textEl  = $('dg-celebration-text');
    if (overlay && textEl) {
      textEl.textContent = celeb.text;
      overlay.classList.remove('pop');
      void overlay.offsetWidth;
      overlay.classList.add('pop');
      overlay.addEventListener('animationend', () => overlay.classList.remove('pop'), { once: true });
    }

    // Sound
    playCelebrationSound(celeb.size);

    // Chipmunk voice
    setTimeout(() => playChipmunk(celeb.speech), 300);
  }

  // ── SEQUENCE ENGINE ────────────────────────────────────
  function addToSequence() {
    sequence.push(Math.floor(Math.random() * CELL_COUNT));
  }

  function showSequence() {
    phase = 'showing';
    playerInput = [];
    setStatus('Watch Bloop! 👀');
    setBloopLabel(`Round ${sequence.length}`);

    // Disable Zane's grid during show
    const zaneGrid = $('dg-zane-grid');
    if (zaneGrid) zaneGrid.style.pointerEvents = 'none';

    // Flash each square in sequence with delay
    sequence.forEach((idx, i) => {
      setTimeout(() => {
        animateBloopAvatar('hop');
        flashCell('dg-bloop-grid', idx, showDelay * 0.7);

        // Last item — switch to player turn
        if (i === sequence.length - 1) {
          setTimeout(() => {
            phase = 'waiting';
            setStatus("Zane's turn! 🎯");
            if (zaneGrid) zaneGrid.style.pointerEvents = 'auto';
            animateBloopAvatar('wiggle');
          }, showDelay * 0.8);
        }
      }, i * (showDelay + 200));
    });
  }

  function handleZaneTap(idx) {
    if (phase !== 'waiting' || !isActive) return;

    const expected = sequence[playerInput.length];
    playerInput.push(idx);

    // Flash Zane's cell
    flashCell('dg-zane-grid', idx, 350);

    if (idx === expected) {
      // Correct!
      if (playerInput.length === sequence.length) {
        // Full sequence complete
        phase = 'celebrating';
        const level = sequence.length;
        // Bounce Zane's face
        const zi = document.getElementById('dg-zane-img');
        if (zi) { zi.style.transform = 'scale(1.3) rotate(5deg)'; setTimeout(() => zi.style.transform = '', 400); }
        setTimeout(() => {
          showCelebration(level);
          animateBloopAvatar('hop');
          // Next round after celebration
          setTimeout(() => {
            if (!isActive) return;
            addToSequence();
            // Speed up slightly as sequence grows (min 400ms)
            showDelay = Math.max(400, 600 - sequence.length * 20);
            showSequence();
          }, 2800);
        }, 400);
      }
      // else: correct but more to go — just keep waiting
    } else {
      // Miss — always celebrate anyway!
      phase = 'celebrating';
      playMissSound();
      setTimeout(() => {
        spawnFireworks(12);
        playChipmunk('Yay Zane! Great try! Let\'s go again!');
        playCelebrationSound('medium');
        const overlay = $('dg-celebration');
        const textEl  = $('dg-celebration-text');
        if (overlay && textEl) {
          textEl.textContent = 'Great try Zane! 🎉';
          overlay.classList.remove('pop');
          void overlay.offsetWidth;
          overlay.classList.add('pop');
          overlay.addEventListener('animationend', () => overlay.classList.remove('pop'), { once: true });
        }
        // Reset and restart from 1
        setTimeout(() => {
          if (!isActive) return;
          sequence = [];
          addToSequence();
          showDelay = 600;
          showSequence();
        }, 2800);
      }, 300);
    }
  }

  // ── BUILD DOM ──────────────────────────────────────────
  function buildDOM() {
    // Wipe element
    const wipe = document.createElement('div');
    wipe.id = 'dg-wipe';
    document.body.appendChild(wipe);

    // Main overlay
    const overlay = document.createElement('div');
    overlay.id = 'dancegrid-overlay';
    overlay.innerHTML = `
      <button id="dg-quit">✕ Quit</button>

      <div id="dg-header">
        <div id="dg-title">Dance Grid!</div>
        <div id="dg-sequence-display">Round 1</div>
      </div>

      <div id="dg-arena">

        <div class="dg-player-wrap">
          <div id="dg-bloop-avatar">
            <div class="mb-body"></div>
            <div class="mb-cheek mb-cheek-l"></div>
            <div class="mb-cheek mb-cheek-r"></div>
            <div class="mb-eye mb-eye-l"><div class="mb-pupil"></div></div>
            <div class="mb-eye mb-eye-r"><div class="mb-pupil"></div></div>
            <div class="mb-mouth"></div>
            <div class="mb-belly"></div>
          </div>
          <div class="dg-label">Bloop</div>
          <div class="dg-grid" id="dg-bloop-grid">
            ${Array.from({length:9},(_,i) =>
              `<div class="dg-cell" data-idx="${i}"></div>`
            ).join('')}
          </div>
        </div>

        <div id="dg-divider"></div>

        <div class="dg-player-wrap">
          <div id="dg-zane-avatar"><img src="assets/zane.png" alt="Zane" id="dg-zane-img" style="width:clamp(50px,9vw,80px);height:clamp(50px,9vw,80px);object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));transition:transform 0.2s;pointer-events:none;-webkit-user-drag:none;user-select:none;-webkit-touch-callout:none;touch-action:none;"></div>
          <div class="dg-label">Zane</div>
          <div class="dg-grid" id="dg-zane-grid">
            ${Array.from({length:9},(_,i) =>
              `<div class="dg-cell" data-idx="${i}"></div>`
            ).join('')}
          </div>
        </div>

      </div>

      <div id="dg-status">Get ready!</div>
      <div id="dg-fireworks"></div>
      <div id="dg-celebration">
        <div id="dg-celebration-text"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Zane grid tap handlers
    overlay.querySelectorAll('#dg-zane-grid .dg-cell').forEach(cell => {
      cell.addEventListener('click', () => handleZaneTap(parseInt(cell.dataset.idx)));
      cell.addEventListener('touchstart', e => {
        e.preventDefault();
        handleZaneTap(parseInt(cell.dataset.idx));
      }, { passive: false });
    });

    // Quit button
    $('dg-quit').addEventListener('click', quit);
    $('dg-quit').addEventListener('touchstart', e => { e.preventDefault(); quit(); }, { passive: false });
  }

  function destroyDOM() {
    ['dancegrid-overlay','dg-wipe'].forEach(id => {
      const el = $(id);
      if (el) el.remove();
    });
  }

  // ── SCREEN WIPE TRANSITION ─────────────────────────────
  function wipeIn(cb) {
    const wipe = $('dg-wipe');
    wipe.className = '';
    void wipe.offsetWidth;
    wipe.classList.add('wipe-in');
    setTimeout(cb, 420);
  }

  function wipeOut(cb) {
    const overlay = $('dancegrid-overlay');
    if (overlay) overlay.classList.remove('visible');
    const wipe = $('dg-wipe');
    wipe.classList.remove('wipe-in');
    void wipe.offsetWidth;
    wipe.classList.add('wipe-out');
    setTimeout(() => {
      wipe.className = '';
      cb();
    }, 420);
  }

  // ── PUBLIC API ─────────────────────────────────────────
  function launch(onComplete) {
    if (isActive) return;
    isActive   = true;
    onCompleteCb = onComplete || (() => {});
    sequence   = [];
    playerInput = [];
    showDelay  = 600;

    buildDOM();

    // Wipe in
    wipeIn(() => {
      const overlay = $('dancegrid-overlay');
      if (overlay) overlay.classList.add('visible');

      // Pre-load voices
      if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

      // Chipmunk welcome
      setTimeout(() => playChipmunk("Let's play Dance Grid! Watch Bloop, then copy him!"), 400);

      // Start after welcome
      setTimeout(() => {
        addToSequence();
        showSequence();
      }, 2000);
    });
  }

  function quit() {
    if (!isActive) return;
    isActive = false;
    window.speechSynthesis && window.speechSynthesis.cancel();

    wipeOut(() => {
      destroyDOM();
      if (onCompleteCb) onCompleteCb();
    });
  }

  return { launch, quit };

})();
