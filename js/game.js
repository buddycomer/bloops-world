// ============================================================
// BLOOP'S WORLD — Main Game Engine
// ============================================================

// ── STATE ─────────────────────────────────────────────────
const state = {
  chompsOnScreen: false,
  chompsHitCount: 0,
  isCelebrating: false,
  lastTapTime: 0
};

// ── DOM REFS ──────────────────────────────────────────────
const game    = document.getElementById('game');
const bloopEl = document.getElementById('bloop');
const bloopWrap = document.getElementById('bloop-wrap');
const mouth   = document.getElementById('bloop-mouth');
const armL    = document.getElementById('arm-l');
const armR    = document.getElementById('arm-r');
const pupilL  = document.getElementById('pupil-l');
const pupilR  = document.getElementById('pupil-r');
const chompsEl = document.getElementById('chomps');

// ── BLOOP ANIMATION ───────────────────────────────────────
function animateBloop(type) {
  bloopEl.classList.remove('bounce','wiggle','spin','squish','happy');
  void bloopEl.offsetWidth;
  bloopEl.classList.add(type);
  bloopEl.addEventListener('animationend', () => {
    bloopEl.classList.remove(type);
  }, { once: true });

  // Arm raise on bounce/happy
  if (['bounce','happy','squish'].includes(type)) {
    armL.style.transform = 'rotate(-35deg) translateY(-10px)';
    armR.style.transform = 'rotate(35deg) translateY(-10px)';
    setTimeout(() => {
      armL.style.transform = 'rotate(20deg)';
      armR.style.transform = 'rotate(-20deg)';
    }, 400);
  }
}

// Pupil tracking
game.addEventListener('mousemove', trackPupils);
game.addEventListener('touchmove', e => {
  const t = e.touches[0];
  trackPupils({ clientX: t.clientX, clientY: t.clientY });
}, { passive: true });

function trackPupils(e) {
  const br = bloopWrap.getBoundingClientRect();
  const bx = br.left + br.width / 2;
  const by = br.top + br.height / 2;
  const dx = e.clientX - bx;
  const dy = e.clientY - by;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const max = 5;
  const nx = dist > 1 ? (dx/dist) * Math.min(dist/20, max) : 0;
  const ny = dist > 1 ? (dy/dist) * Math.min(dist/20, max) : 0;
  pupilL.style.transform = `translate(${nx}px,${ny}px)`;
  pupilR.style.transform = `translate(${nx}px,${ny}px)`;
}

// ── FLOATING EFFECTS ──────────────────────────────────────
function spawnFloatingEffect(emoji, x, y, animClass = 'float-up') {
  const el = document.createElement('div');
  el.className = `effect ${animClass}`;
  el.style.left  = (x - 16) + 'px';
  el.style.top   = (y - 16) + 'px';
  el.style.fontSize = 'clamp(24px,4vw,40px)';
  el.textContent = emoji;
  game.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── CHOMPS SYSTEM ─────────────────────────────────────────
function triggerChomps() {
  if (state.chompsOnScreen) return;
  state.chompsOnScreen = true;
  state.chompsHitCount = 0;

  const gW = game.offsetWidth;
  chompsEl.style.left = (gW * 0.65) + 'px';
  chompsEl.innerHTML = '🐊';
  chompsEl.classList.remove('exit','shrink');
  chompsEl.classList.add('enter');
  chompsEl.style.opacity = '1';
  playSound('chomps_growl');

  // Bloop reacts — scared eyes
  bloopEl.classList.add('wiggle');
  setTimeout(() => animateBloop('wiggle'), 600);
}

function hitChomps() {
  if (!state.chompsOnScreen) return;
  state.chompsHitCount++;
  playSound('star');
  spawnFloatingEffect(['👊','💥','⭐','✨'][Math.floor(Math.random()*4)],
    parseInt(chompsEl.style.left) + 36,
    game.offsetHeight * 0.65
  );

  if (state.chompsHitCount >= 3) {
    defeatChomps();
  } else {
    // Wobble
    chompsEl.style.animation = 'none';
    void chompsEl.offsetWidth;
    chompsEl.style.animation = 'chompsEnter 0.3s ease-out forwards';
  }
}

function defeatChomps() {
  state.chompsOnScreen = false;
  chompsEl.classList.remove('enter');
  chompsEl.classList.add('shrink');
  playSound('celebration');
  setTimeout(() => {
    chompsEl.style.opacity = '0';
    triggerCelebration();
  }, 800);
}

// ── CELEBRATION ───────────────────────────────────────────
function triggerCelebration() {
  if (state.isCelebrating) return;
  state.isCelebrating = true;
  animateBloop('happy');
  spawnBurstEffects();
  setTimeout(() => { state.isCelebrating = false; }, 3000);
}

// ── TAP ZONE DETECTION ────────────────────────────────────
function detectZone(x, y) {
  const w = game.offsetWidth;
  const h = game.offsetHeight;
  const bloopR = bloopWrap.getBoundingClientRect();
  const gameR  = game.getBoundingClientRect();
  const bx = bloopR.left - gameR.left;
  const by = bloopR.top  - gameR.top;
  const bw = bloopR.width;
  const bh = bloopR.height;

  // Check Chomps
  if (state.chompsOnScreen) {
    const cx = parseInt(chompsEl.style.left);
    if (x > cx && x < cx + 80 && y > h * 0.65 && y < h * 0.85) {
      return 'chomps';
    }
  }

  // Check belly (inner bloop zone)
  const bellyX = bx + bw * 0.32;
  const bellyY = by + bh * 0.52;
  const bellyW = bw * 0.36;
  const bellyH = bh * 0.28;
  if (x > bellyX && x < bellyX + bellyW && y > bellyY && y < bellyY + bellyH) {
    return 'belly';
  }

  // Check bloop
  if (x > bx && x < bx + bw && y > by && y < by + bh) {
    return 'bloop';
  }

  // Sky / Ground / Left / Right / Center
  if (y < h * 0.45) return 'sky';
  if (y > h * 0.78) return 'ground';
  if (x < w * 0.25) return 'left';
  if (x > w * 0.75) return 'right';
  return 'center';
}

// ── ZONE REACTIONS ────────────────────────────────────────
const skyEmojis   = ['⭐','🌟','✨','💫','☁️','🌤️','🌙','🌈'];
const groundEmojis = ['🌸','🌼','🌻','🌷','🍀','🌿'];
const centerEmojis = ['🎈','🎊','💥','🌀','⚡','🎆'];
const heartEmojis  = ['❤️','💕','💖','💗','🩷'];

function handleZone(zone, x, y) {
  recordTap(zone); // feed combo engine

  switch (zone) {

    case 'bloop': {
      const anims = ['bounce','wiggle','spin'];
      animateBloop(anims[Math.floor(Math.random() * anims.length)]);
      spawnFloatingEffect(heartEmojis[Math.floor(Math.random()*heartEmojis.length)],
        x + (Math.random()-0.5)*60, y - 30, 'heart-float');
      spawnFloatingEffect('✨', x + (Math.random()-0.5)*80, y - 50);
      playSound('bloop_tap');
      maybeSpawnFriend(zone, x, y);
      break;
    }

    case 'belly': {
      animateBloop('squish');
      spawnFloatingEffect('😂', x, y - 40, 'float-up');
      for (let i = 0; i < 3; i++) {
        setTimeout(() => spawnFloatingEffect(
          heartEmojis[Math.floor(Math.random()*heartEmojis.length)],
          x + (Math.random()-0.5)*80, y - 20 + (Math.random()-0.5)*40, 'heart-float'
        ), i * 100);
      }
      playSound('bloop_belly');
      break;
    }

    case 'sky': {
      spawnFloatingEffect(skyEmojis[Math.floor(Math.random()*skyEmojis.length)],
        x, y, 'star-pop');
      if (Math.random() < 0.3) spawnFriendly('sky', x, y);
      animateBloop('wiggle');
      playSound('star');
      break;
    }

    case 'ground': {
      spawnFloatingEffect(groundEmojis[Math.floor(Math.random()*groundEmojis.length)],
        x, y, 'flower-grow');
      if (Math.random() < 0.4) {
        spawnRunningCreature(
          ['🦕','🐊','🐸','🦋'][Math.floor(Math.random()*4)],
          Math.random() < 0.5
        );
      }
      animateBloop('bounce');
      playSound('flower');
      break;
    }

    case 'left':
    case 'right': {
      spawnFloatingEffect(centerEmojis[Math.floor(Math.random()*centerEmojis.length)],
        x, y, 'burst');
      animateBloop('wiggle');
      playSound('creature_appear');
      break;
    }

    case 'center': {
      spawnFloatingEffect(centerEmojis[Math.floor(Math.random()*centerEmojis.length)],
        x, y, 'float-up');
      animateBloop(Math.random() < 0.5 ? 'bounce' : 'wiggle');
      maybeSpawnFriend('any', x, y);
      playSound('bloop_tap');
      break;
    }

    case 'chomps': {
      hitChomps();
      break;
    }
  }
}

function maybeSpawnFriend(zone, x, y) {
  if (Math.random() < 0.3) spawnFriendly(zone, x, y);
}

// ── INPUT HANDLING ────────────────────────────────────────
function handleInput(clientX, clientY) {
  const rect = game.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const now = Date.now();
  if (now - state.lastTapTime < 80) return; // debounce
  state.lastTapTime = now;
  handleZone(detectZone(x, y), x, y);
}

game.addEventListener('click', e => handleInput(e.clientX, e.clientY));

game.addEventListener('touchstart', e => {
  // Don't preventDefault here — let it propagate naturally on mobile
  Array.from(e.changedTouches).forEach(t => handleInput(t.clientX, t.clientY));
}, { passive: true });

// Prevent default scroll/zoom on touchmove inside game only
game.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  // Idle Bloop bob
  setInterval(() => {
    if (!document.hidden && !state.isCelebrating) {
      bloopWrap.style.transform = `translateX(-50%) translateY(${Math.sin(Date.now()/800)*4}px)`;
    }
  }, 16);
});
