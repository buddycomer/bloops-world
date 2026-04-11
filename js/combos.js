// ============================================================
// COMBO SYSTEM
// Combos are self-contained objects.
// Add new combos by pushing to COMBO_REGISTRY.
// Each combo watches the tap sequence and fires when matched.
// ============================================================

const COMBO_REGISTRY = [

  // ── SET COMBOS (predictable — always fires) ───────────────
  {
    id: 'rainbow',
    sequence: ['sky', 'sky', 'sky'],
    type: 'set',
    description: 'Tap sky 3 times → rainbow + Bloop happy dance',
    fire: () => {
      showRainbow();
      animateBloop('happy');
      spawnBurstEffects();
      playComboSound('rainbow');
    }
  },
  {
    id: 'monster_erupt',
    sequence: ['bloop', 'ground'],
    type: 'set',
    description: 'Tap Bloop then ground → monster erupts',
    fire: () => {
      spawnRunningCreature('🦕', true);
      spawnRunningCreature('🐸', false);
      animateBloop('bounce');
      flashScreen('#5dcaa5');
    }
  },
  {
    id: 'high_five',
    sequence: ['left', 'right'],
    type: 'set',
    description: 'Tap left then right → two monsters run and high five',
    fire: () => {
      spawnRunningCreature('🐸', true);
      spawnRunningCreature('🦕', false);
      setTimeout(() => {
        spawnFloatingEffect('🎉', window.innerWidth / 2, window.innerHeight * 0.6);
        flashScreen('#fac775');
        animateBloop('wiggle');
      }, 900);
    }
  },
  {
    id: 'belly_burst',
    sequence: ['belly', 'belly'],
    type: 'set',
    description: 'Tap belly twice → pink screen explosion + hearts',
    fire: () => {
      flashScreen('#ff7eb3');
      animateBloop('squish');
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.5;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const ox = cx + (Math.random() - 0.5) * 200;
          const oy = cy + (Math.random() - 0.5) * 150;
          spawnFloatingEffect(['❤️','💕','💖','💗'][Math.floor(Math.random()*4)], ox, oy);
        }, i * 80);
      }
      playComboSound('love');
    }
  },

  // ── CHOMPS APPEARANCE ─────────────────────────────────────
  {
    id: 'chomps_appear',
    sequence: ['ground', 'ground', 'ground'],
    type: 'set',
    description: 'Tap ground 3 times → Chomps appears',
    fire: () => {
      triggerChomps();
    }
  },

  // ── DANCE GRID LAUNCH ─────────────────────────────────────
  {
    id: 'dance_grid',
    sequence: ['sky', 'ground', 'sky', 'ground'],
    type: 'set',
    description: 'Sky → Ground → Sky → Ground → launches Dance Grid',
    fire: () => {
      setTimeout(() => {
        DanceGrid.launch(() => {
          animateBloop('happy');
          spawnBurstEffects();
        });
      }, 300);
    }
  }
];

// ── RANDOM EVENTS (timer-driven) ──────────────────────────
const RANDOM_EVENTS = [
  {
    id: 'parade',
    weight: 3,
    minTaps: 8,
    description: 'Monster parade — all cross the screen',
    fire: () => {
      const creatures = ['🐸','🦕','🦋','🐊','🌟'];
      creatures.forEach((c, i) => {
        setTimeout(() => spawnRunningCreature(c, i % 2 === 0), i * 400);
      });
      animateBloop('happy');
    }
  },
  {
    id: 'giant_face',
    weight: 2,
    minTaps: 5,
    description: 'Huge monster face fills screen then pops',
    fire: () => {
      spawnGiantFace();
    }
  },
  {
    id: 'bloop_sneeze',
    weight: 4,
    minTaps: 6,
    description: 'Bloop sneezes and tiny monsters fly out',
    fire: () => {
      animateBloop('squish');
      setTimeout(() => {
        const bx = window.innerWidth / 2;
        const by = window.innerHeight * 0.45;
        ['🐸','🦋','⭐'].forEach((e, i) => {
          setTimeout(() => {
            spawnFloatingEffect(e, bx + (i-1)*60, by);
          }, i * 120);
        });
        flashScreen('rgba(255,255,255,0.5)');
      }, 200);
    }
  },
  {
    id: 'sky_shift',
    weight: 2,
    minTaps: 10,
    description: 'Background slowly shifts color',
    fire: () => {
      shiftSkyColor();
    }
  }
];
