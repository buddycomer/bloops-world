// ============================================================
// MONSTERS MODULE — plug-in system
// Each monster is a self-contained object.
// Add new packs by pushing to MONSTER_PACKS.
// ============================================================

const MONSTER_PACKS = {

  // ── STARTER PACK ────────────────────────────────────────
  starter: [
    {
      id: 'gloop',
      name: 'Gloop',
      emoji: '🟢',
      color: '#5dcaa5',
      type: 'friendly',
      zone: 'ground',
      render: () => `<div style="font-size:clamp(32px,6vw,56px);filter:drop-shadow(0 3px 6px rgba(0,0,0,0.2))">🐸</div>`,
      description: 'A round green frog-blob. Pops up from the ground and waves both arms.',
      reaction: 'wave',
      sound: 'boing'
    },
    {
      id: 'puff',
      name: 'Puff',
      emoji: '🌸',
      color: '#ff9de2',
      type: 'friendly',
      zone: 'sky',
      render: () => `<div style="font-size:clamp(32px,6vw,56px);filter:drop-shadow(0 3px 6px rgba(0,0,0,0.2))">🦋</div>`,
      description: 'A fluffy pink flutter-monster. Drifts down from the sky leaving sparkles.',
      reaction: 'flutter',
      sound: 'twinkle'
    },
    {
      id: 'rumble',
      name: 'Rumble',
      emoji: '⚡',
      color: '#fac775',
      type: 'friendly',
      zone: 'ground',
      render: () => `<div style="font-size:clamp(32px,6vw,56px);filter:drop-shadow(0 3px 6px rgba(0,0,0,0.2))">🦕</div>`,
      description: 'A tiny round dino who stomps across and leaves tiny footprints.',
      reaction: 'stomp',
      sound: 'stomp'
    }
  ],

  // ── DINO PACK (future plug-in) ───────────────────────────
  dino: [
    {
      id: 'rex',
      name: 'Rexy',
      emoji: '🦖',
      color: '#639922',
      type: 'friendly',
      zone: 'ground',
      render: () => `<div style="font-size:clamp(32px,6vw,56px)">🦖</div>`,
      description: 'Tiny T-rex with stubby arms. Tries to clap but can\'t reach.',
      reaction: 'stomp',
      sound: 'roar',
      pack: 'dino',
      locked: true
    }
  ],

  // ── BIG BADS ─────────────────────────────────────────────
  villains: [
    {
      id: 'chomps',
      name: 'Chomps',
      emoji: '🐢',
      color: '#7EC850',
      type: 'villain',
      zone: 'ground',
      render: () => `<div style="font-size:clamp(40px,8vw,72px);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))">🐊</div>`,
      description: 'Mischievous turtle-dragon. Puffs up then deflates with a raspberry.',
      reaction: 'puff',
      sound: 'growl',
      locked: false
    },
    {
      id: 'kidvenom',
      name: 'Kid Venom',
      emoji: '🕷️',
      color: '#1a1a2e',
      type: 'villain',
      zone: 'sky',
      render: () => `<div style="font-size:clamp(40px,8vw,72px)">🕷️</div>`,
      description: 'The big bad. Swoops in, scatters monsters, gets tickled into submission.',
      reaction: 'swoop',
      sound: 'venom',
      locked: true  // enable when Zane is ready
    }
  ]
};

// Active packs — toggle these to add/remove content
const ACTIVE_PACKS = ['starter', 'villains'];

// Get all unlocked friendly monsters
function getFriendlyMonsters() {
  return ACTIVE_PACKS
    .flatMap(p => MONSTER_PACKS[p] || [])
    .filter(m => m.type === 'friendly' && !m.locked);
}

// Get unlocked villain
function getVillain(id) {
  return ACTIVE_PACKS
    .flatMap(p => MONSTER_PACKS[p] || [])
    .find(m => m.id === id && !m.locked);
}

// Spawn a random friendly monster in a zone
function spawnFriendly(zone, x, y) {
  const pool = getFriendlyMonsters().filter(m => m.zone === zone || zone === 'any');
  if (!pool.length) return;
  const monster = pool[Math.floor(Math.random() * pool.length)];
  spawnMonsterEffect(monster, x, y);
}

function spawnMonsterEffect(monster, x, y) {
  const el = document.createElement('div');
  el.className = 'effect';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.position = 'absolute';
  el.style.zIndex = '15';
  el.innerHTML = monster.render();

  if (monster.zone === 'sky') {
    el.classList.add('float-up');
  } else {
    el.classList.add('flower-grow');
  }

  document.getElementById('game').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// Running creature across ground
function spawnRunningCreature(emoji, fromLeft = true) {
  const el = document.createElement('div');
  el.className = 'effect creature-run';
  if (!fromLeft) el.classList.add('from-right');

  const gameH = document.getElementById('game').offsetHeight;
  const bottomPct = 0.19 + Math.random() * 0.03;
  el.style.bottom = (gameH * bottomPct) + 'px';
  el.style.position = 'absolute';
  el.style.zIndex = '8';
  el.style.fontSize = 'clamp(28px,5vw,50px)';
  el.style.setProperty('--run-dur', (1.5 + Math.random() * 1.2) + 's');

  if (fromLeft) {
    el.style.left = '-80px';
  } else {
    el.style.right = '-80px';
  }

  el.textContent = emoji;
  document.getElementById('game').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
