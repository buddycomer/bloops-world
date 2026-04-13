// ── DANCE GRID GAME ───────────────────────────────────────
// Fully self contained. No dependencies on main game.
// Quit button navigates back to main world.

var sequence    = [];
var playerInput = [];
var phase       = 'idle';   // idle | showing | waiting | celebrating
var showDelay   = 600;
var totalRounds = 0;

var FIREWORKS = ['🎆','🎇','✨','🌟','💥','🎉','⭐','💫','🎊','🌈'];

var CELEBRATIONS = [
  null,
  { size: 'small',  count: 5,  text: 'Yay!',            speech: 'Yay! Good job Zane!' },
  { size: 'medium', count: 10, text: 'Woohoo!',          speech: 'Woohoo! Zane did it!' },
  { size: 'large',  count: 16, text: 'Amazing!',         speech: 'Amazing! Zane is so good!' },
  { size: 'huge',   count: 24, text: 'ZANE IS ON FIRE!', speech: 'Zane is on fire! Keep going!' }
];

// ── DOM ───────────────────────────────────────────────────
var bloopAvatar = document.getElementById('dg-bloop-avatar');
var zaneAvatar  = document.getElementById('dg-zane-avatar');
var statusEl    = document.getElementById('dg-status');
var roundEl     = document.getElementById('dg-round');
var zaneGrid    = document.getElementById('dg-zane-grid');
var fireworksEl = document.getElementById('dg-fireworks');
var celebEl     = document.getElementById('dg-celebration');
var celebText   = document.getElementById('dg-celeb-text');

// ── HELPERS ───────────────────────────────────────────────
function setStatus(t) { if (statusEl) statusEl.textContent = t; }
function setRound(t)  { if (roundEl)  roundEl.textContent  = t; }

function flashCell(gridId, idx, duration) {
  duration = duration || 420;
  var cell = document.querySelector('#' + gridId + ' .dg-cell[data-idx="' + idx + '"]');
  if (!cell) return;
  cell.classList.add('flash');
  dgPlayNote(DG_NOTES[idx]);
  setTimeout(function() { cell.classList.remove('flash'); }, duration);
}

function animateBloop(type) {
  bloopAvatar.classList.remove('hop','wiggle');
  void bloopAvatar.offsetWidth;
  bloopAvatar.classList.add(type);
  bloopAvatar.addEventListener('animationend', function() {
    bloopAvatar.classList.remove(type);
  }, { once: true });
}

function animateZane() {
  zaneAvatar.classList.remove('bounce');
  void zaneAvatar.offsetWidth;
  zaneAvatar.classList.add('bounce');
  zaneAvatar.addEventListener('animationend', function() {
    zaneAvatar.classList.remove('bounce');
  }, { once: true });
}

// ── FIREWORKS ─────────────────────────────────────────────
function spawnFireworks(count) {
  for (var i = 0; i < count; i++) {
    (function(i) {
      setTimeout(function() {
        var fw = document.createElement('div');
        fw.className = 'dg-firework';
        fw.textContent = FIREWORKS[Math.floor(Math.random() * FIREWORKS.length)];
        fw.style.left = (10 + Math.random() * 80) + '%';
        fw.style.top  = (10 + Math.random() * 70) + '%';
        fw.style.setProperty('--fw-dur', (0.7 + Math.random() * 0.7) + 's');
        fw.style.setProperty('--fw-rot', (Math.random() * 60 - 30) + 'deg');
        fireworksEl.appendChild(fw);
        fw.addEventListener('animationend', function() { fw.remove(); });
      }, i * 80 + Math.random() * 60);
    })(i);
  }
}

function showCelebration(level) {
  var idx   = Math.min(level, CELEBRATIONS.length - 1);
  var celeb = CELEBRATIONS[idx] || CELEBRATIONS[CELEBRATIONS.length - 1];

  spawnFireworks(celeb.count);
  dgPlayCelebration(celeb.size);

  celebText.textContent = celeb.text;
  celebEl.classList.remove('pop');
  void celebEl.offsetWidth;
  celebEl.classList.add('pop');
  celebEl.addEventListener('animationend', function() {
    celebEl.classList.remove('pop');
  }, { once: true });

  setTimeout(function() { dgSpeak(celeb.speech); }, 300);
}

function showMiss() {
  spawnFireworks(12);
  dgPlayMiss();
  celebText.textContent = 'Great try Zane! 🎉';
  celebEl.classList.remove('pop');
  void celebEl.offsetWidth;
  celebEl.classList.add('pop');
  celebEl.addEventListener('animationend', function() {
    celebEl.classList.remove('pop');
  }, { once: true });
  setTimeout(function() { dgSpeak("Yay Zane! Great try! Let's go again!"); }, 300);
}

// ── SEQUENCE ENGINE ───────────────────────────────────────
function addToSequence() {
  sequence.push(Math.floor(Math.random() * 9));
}

function showSequence() {
  phase = 'showing';
  playerInput = [];
  setStatus('Watch Bloop! 👀');
  setRound('Round ' + sequence.length);
  zaneGrid.style.pointerEvents = 'none';

  sequence.forEach(function(idx, i) {
    setTimeout(function() {
      animateBloop('hop');
      flashCell('dg-bloop-grid', idx, Math.round(showDelay * 0.7));

      if (i === sequence.length - 1) {
        setTimeout(function() {
          phase = 'waiting';
          setStatus("Zane's turn! 🎯");
          zaneGrid.style.pointerEvents = 'auto';
          animateBloop('wiggle');
        }, Math.round(showDelay * 0.85));
      }
    }, i * (showDelay + 180));
  });
}

function handleZaneTap(idx) {
  if (phase !== 'waiting') return;

  var expected = sequence[playerInput.length];
  playerInput.push(idx);
  flashCell('dg-zane-grid', idx, 350);

  if (idx === expected) {
    if (playerInput.length === sequence.length) {
      // Full sequence correct!
      phase = 'celebrating';
      totalRounds++;
      animateZane();
      setTimeout(function() {
        showCelebration(sequence.length);
        animateBloop('hop');
        setTimeout(function() {
          addToSequence();
          showDelay = Math.max(380, 600 - sequence.length * 18);
          showSequence();
        }, 2800);
      }, 350);
    }
    // else: correct tap, keep waiting for more
  } else {
    // Miss — always celebrate!
    phase = 'celebrating';
    setTimeout(function() {
      showMiss();
      setTimeout(function() {
        sequence = [];
        addToSequence();
        showDelay = 600;
        showSequence();
      }, 2800);
    }, 300);
  }
}

// ── TOUCH & CLICK ON ZANE'S GRID ─────────────────────────
zaneGrid.querySelectorAll('.dg-cell').forEach(function(cell) {
  cell.addEventListener('click', function() {
    handleZaneTap(parseInt(cell.dataset.idx));
  });
  cell.addEventListener('touchstart', function(e) {
    handleZaneTap(parseInt(cell.dataset.idx));
  }, { passive: true });
});

// ── QUIT BUTTON ───────────────────────────────────────────
document.getElementById('dg-quit').addEventListener('click', function() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.location.href = '../../index.html';
});
document.getElementById('dg-quit').addEventListener('touchstart', function() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.location.href = '../../index.html';
}, { passive: true });

// ── START ─────────────────────────────────────────────────
window.addEventListener('load', function() {
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  setTimeout(function() {
    dgSpeak("Let's play Dance Grid! Watch Bloop, then copy him!");
  }, 400);
  setTimeout(function() {
    addToSequence();
    showSequence();
  }, 2200);
});
