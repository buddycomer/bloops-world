// ── VOLLEYBALL GAME ───────────────────────────────────────
// Zane (left) vs Kayleigh bot (right)
// First to 10 wins. Kayleigh misses ~10% of the time.
// Tap left side to make Zane jump and hit.

// ── CONFIG ────────────────────────────────────────────────
var WIN_SCORE     = 10;
var MISS_CHANCE   = 0.10;  // Kayleigh miss probability — tune here
var BALL_SPEED    = 0.006; // fraction of screen per ms
var GRAVITY       = 0.0003;
var JUMP_POWER    = -0.018;
var PLAYER_SPEED  = 0.004;

// ── STATE ─────────────────────────────────────────────────
var state = {
  zaneScore:     0,
  kayleighScore: 0,
  phase: 'countdown', // countdown | playing | point | gameover
  ball: { x:0.3, y:0.5, vx:0, vy:0 },
  zane:     { x:0.12, y:0, vy:0, grounded:true, hitting:false },
  kayleigh: { x:0.88, y:0, vy:0, grounded:true, hitting:false, willMiss:false },
  lastTime: 0,
  zaneTapped: false
};

// ── DOM ───────────────────────────────────────────────────
var page       = document.getElementById('vb-page');
var ballEl     = document.getElementById('vb-ball');
var zaneEl     = document.getElementById('vb-zane');
var kayleighEl = document.getElementById('vb-kayleigh');
var scoreZane  = document.getElementById('vb-score-zane');
var scoreKay   = document.getElementById('vb-score-kayleigh');
var fireworksEl= document.getElementById('vb-fireworks');
var celebEl    = document.getElementById('vb-celebration');
var celebText  = document.getElementById('vb-celeb-text');
var celebSub   = document.getElementById('vb-celeb-sub');
var countdownEl= document.getElementById('vb-countdown');
var tapLeft    = document.getElementById('vb-tap-left');

// Ground level as fraction of page height (bottom of player feet)
var GROUND_Y = 0.72;
var NET_X    = 0.50;

// ── POSITION HELPERS ──────────────────────────────────────
function px(el, x, y) {
  var w = page.offsetWidth;
  var h = page.offsetHeight;
  el.style.left = (x * w - el.offsetWidth / 2) + 'px';
  el.style.bottom = ((1 - y) * h) + 'px';
}

function setBall() {
  var w = page.offsetWidth;
  var h = page.offsetHeight;
  var bw = ballEl.offsetWidth;
  var bh = ballEl.offsetHeight;
  ballEl.style.left = (state.ball.x * w - bw/2) + 'px';
  ballEl.style.top  = (state.ball.y * h - bh/2) + 'px';
}

function setPlayer(el, p) {
  var w = page.offsetWidth;
  var h = page.offsetHeight;
  var pw = el.offsetWidth;
  el.style.left   = (p.x * w - pw/2) + 'px';
  el.style.bottom = ((1 - GROUND_Y) * h + (GROUND_Y - p.y) * h) + 'px';
}

// ── FIREWORKS ─────────────────────────────────────────────
var FW = ['🎆','🎇','✨','🌟','💥','🎉','⭐','💫','🎊'];
function spawnFireworks(count) {
  for (var i = 0; i < count; i++) {
    (function(i) {
      setTimeout(function() {
        var fw = document.createElement('div');
        fw.className = 'vb-firework';
        fw.textContent = FW[Math.floor(Math.random()*FW.length)];
        fw.style.left = (8 + Math.random()*84) + '%';
        fw.style.top  = (8 + Math.random()*70) + '%';
        fw.style.setProperty('--fw-dur', (0.7+Math.random()*0.7)+'s');
        fw.style.setProperty('--fw-rot', (Math.random()*60-30)+'deg');
        fireworksEl.appendChild(fw);
        fw.addEventListener('animationend', function() { fw.remove(); });
      }, i*70 + Math.random()*50);
    })(i);
  }
}

// ── CELEBRATION ───────────────────────────────────────────
function showCeleb(title, sub, fw, speech) {
  celebText.textContent = title;
  celebSub.textContent  = sub || '';
  celebEl.classList.remove('pop');
  void celebEl.offsetWidth;
  celebEl.classList.add('pop');
  celebEl.addEventListener('animationend', function() {
    celebEl.classList.remove('pop');
  }, { once: true });
  if (fw) spawnFireworks(fw);
  if (speech) setTimeout(function() { vbSpeak(speech); }, 300);
}

// ── COUNTDOWN ─────────────────────────────────────────────
function runCountdown(cb) {
  var nums = ['3','2','1','🏐'];
  var i = 0;
  function next() {
    if (i >= nums.length) { countdownEl.style.opacity='0'; cb(); return; }
    countdownEl.textContent = nums[i];
    countdownEl.classList.remove('show');
    void countdownEl.offsetWidth;
    countdownEl.classList.add('show');
    vbPlaySound('countdown');
    countdownEl.addEventListener('animationend', function() {
      countdownEl.classList.remove('show');
      i++;
      setTimeout(next, 100);
    }, { once: true });
  }
  next();
}

// ── SERVE ─────────────────────────────────────────────────
function serve(fromLeft) {
  state.ball.x  = fromLeft ? 0.25 : 0.75;
  state.ball.y  = 0.35;
  state.ball.vx = fromLeft ? BALL_SPEED : -BALL_SPEED;
  state.ball.vy = -BALL_SPEED * 0.5;
  state.zane.y     = GROUND_Y;
  state.zane.vy    = 0;
  state.zane.grounded = true;
  state.kayleigh.y = GROUND_Y;
  state.kayleigh.vy = 0;
  state.kayleigh.grounded = true;
  state.kayleigh.willMiss = Math.random() < MISS_CHANCE;
  state.zaneTapped = false;
  state.phase = 'playing';
}

// ── HIT ANIMATION ─────────────────────────────────────────
function triggerHit(el) {
  el.classList.remove('hitting');
  void el.offsetWidth;
  el.classList.add('hitting');
  el.addEventListener('animationend', function() {
    el.classList.remove('hitting');
  }, { once: true });
}

function triggerMiss() {
  kayleighEl.classList.remove('missing');
  void kayleighEl.offsetWidth;
  kayleighEl.classList.add('missing');
  kayleighEl.addEventListener('animationend', function() {
    kayleighEl.classList.remove('missing');
  }, { once: true });
}

// ── POINT SCORED ──────────────────────────────────────────
function pointScored(zaneGotIt) {
  state.phase = 'point';
  vbPlaySound('score');

  if (zaneGotIt) {
    state.zaneScore++;
    scoreZane.textContent = state.zaneScore;
    spawnFireworks(8);

    if (state.zaneScore >= WIN_SCORE) {
      gameOver(true);
      return;
    }
    showCeleb('Zane scores! 🎉', state.zaneScore + ' — ' + state.kayleighScore,
      0, 'Nice shot Zane!');
  } else {
    state.kayleighScore++;
    scoreKay.textContent = state.kayleighScore;

    if (state.kayleighScore >= WIN_SCORE) {
      gameOver(false);
      return;
    }
    showCeleb('Kayleigh scores! 😄', state.zaneScore + ' — ' + state.kayleighScore,
      0, 'Good try Zane! Keep going!');
  }

  setTimeout(function() {
    runCountdown(function() { serve(zaneGotIt); });
  }, 1800);
}

function gameOver(zaneWon) {
  state.phase = 'gameover';
  vbPlaySound('win');
  if (zaneWon) {
    spawnFireworks(30);
    showCeleb('ZANE WINS! 🏆', 'Amazing! ' + WIN_SCORE + ' — ' + state.kayleighScore,
      0, 'Zane wins! That was incredible!');
  } else {
    spawnFireworks(12);
    showCeleb('Great game Zane! 🎉', 'Kayleigh wins this time!',
      0, 'Great game Zane! You were so close!');
  }
  setTimeout(function() {
    // Reset and start again
    state.zaneScore = 0;
    state.kayleighScore = 0;
    scoreZane.textContent = '0';
    scoreKay.textContent  = '0';
    runCountdown(function() { serve(true); });
  }, 4000);
}

// ── PHYSICS LOOP ──────────────────────────────────────────
function update(ts) {
  if (state.phase !== 'playing') {
    state.lastTime = ts;
    requestAnimationFrame(update);
    return;
  }

  var dt = Math.min(ts - state.lastTime, 50);
  state.lastTime = ts;

  var w = page.offsetWidth;
  var h = page.offsetHeight;
  var bw = ballEl.offsetWidth  / w;
  var bh = ballEl.offsetHeight / h;

  // ── BALL PHYSICS ────────────────────────────────────────
  state.ball.vy += GRAVITY * dt;
  state.ball.x  += state.ball.vx * dt;
  state.ball.y  += state.ball.vy * dt;

  // Ceiling bounce
  if (state.ball.y - bh/2 < 0.02) {
    state.ball.y  = 0.02 + bh/2;
    state.ball.vy = Math.abs(state.ball.vy) * 0.8;
  }

  // Ball hits ground — point scored
  if (state.ball.y + bh/2 > GROUND_Y + 0.02) {
    var zaneGotIt = state.ball.x > NET_X; // Kayleigh's side = Zane scores
    pointScored(zaneGotIt);
    return;
  }

  // Net collision
  var netHalf = 0.012;
  var netTop  = GROUND_Y - 0.18;
  if (Math.abs(state.ball.x - NET_X) < netHalf + bw/2 && state.ball.y > netTop) {
    if (state.ball.x < NET_X) {
      state.ball.x  = NET_X - netHalf - bw/2;
      state.ball.vx = -Math.abs(state.ball.vx);
    } else {
      state.ball.x  = NET_X + netHalf + bw/2;
      state.ball.vx = Math.abs(state.ball.vx);
    }
    state.ball.vy = -Math.abs(state.ball.vy) * 0.6;
  }

  // ── ZANE PHYSICS ────────────────────────────────────────
  if (!state.zane.grounded) {
    state.zane.vy += GRAVITY * dt * 0.8;
    state.zane.y  += state.zane.vy * dt;
    if (state.zane.y >= GROUND_Y) {
      state.zane.y = GROUND_Y;
      state.zane.vy = 0;
      state.zane.grounded = true;
    }
  }

  // Zane tap — jump toward ball
  if (state.zaneTapped && state.zane.grounded) {
    state.zane.vy = JUMP_POWER;
    state.zane.grounded = false;
    state.zaneTapped = false;
    triggerHit(zaneEl);
  }

  // Move Zane toward ball on left side
  if (state.ball.x < NET_X) {
    var targetX = Math.max(0.06, Math.min(NET_X - 0.08, state.ball.x - 0.04));
    var dx = targetX - state.zane.x;
    state.zane.x += Math.sign(dx) * Math.min(Math.abs(dx), PLAYER_SPEED * dt);
  }

  // Zane hits ball
  var zaneDx = Math.abs(state.ball.x - state.zane.x);
  var zaneDy = Math.abs(state.ball.y - state.zane.y);
  if (zaneDx < 0.08 && zaneDy < 0.12 && !state.zane.grounded && state.ball.x < NET_X) {
    state.ball.vx =  Math.abs(state.ball.vx) * (1 + Math.random()*0.3);
    state.ball.vy = -(BALL_SPEED * 1.2 + Math.random() * BALL_SPEED * 0.5);
    state.ball.x  = state.zane.x + 0.06;
    vbPlaySound('hit');
  }

  // ── KAYLEIGH BOT ────────────────────────────────────────
  if (!state.kayleigh.grounded) {
    state.kayleigh.vy += GRAVITY * dt * 0.8;
    state.kayleigh.y  += state.kayleigh.vy * dt;
    if (state.kayleigh.y >= GROUND_Y) {
      state.kayleigh.y = GROUND_Y;
      state.kayleigh.vy = 0;
      state.kayleigh.grounded = true;
    }
  }

  // Kayleigh tracks ball on her side
  if (state.ball.x > NET_X) {
    var kayTarget;
    if (state.kayleigh.willMiss) {
      // Move slightly wrong — drift away
      kayTarget = state.ball.x > 0.75
        ? Math.min(0.94, state.kayleigh.x + 0.08)
        : Math.max(NET_X + 0.08, state.kayleigh.x - 0.05);
    } else {
      kayTarget = Math.max(NET_X + 0.08, Math.min(0.94, state.ball.x + 0.04));
    }
    var kdx = kayTarget - state.kayleigh.x;
    state.kayleigh.x += Math.sign(kdx) * Math.min(Math.abs(kdx), PLAYER_SPEED * dt * 0.85);

    // Jump when ball is close and coming down
    if (state.kayleigh.grounded && state.ball.vy > 0) {
      var distX = Math.abs(state.ball.x - state.kayleigh.x);
      var distY = Math.abs(state.ball.y - state.kayleigh.y);
      if (distX < 0.12 && distY < 0.22 && !state.kayleigh.willMiss) {
        state.kayleigh.vy = JUMP_POWER;
        state.kayleigh.grounded = false;
        triggerHit(kayleighEl);
      }
    }
  }

  // Kayleigh hits ball
  var kayDx = Math.abs(state.ball.x - state.kayleigh.x);
  var kayDy = Math.abs(state.ball.y - state.kayleigh.y);
  if (kayDx < 0.08 && kayDy < 0.12 && !state.kayleigh.grounded && state.ball.x > NET_X) {
    if (!state.kayleigh.willMiss) {
      state.ball.vx = -(Math.abs(state.ball.vx) * (1 + Math.random()*0.3));
      state.ball.vy = -(BALL_SPEED * 1.1 + Math.random() * BALL_SPEED * 0.4);
      state.ball.x  = state.kayleigh.x - 0.06;
      vbPlaySound('hit');
      state.kayleigh.willMiss = Math.random() < MISS_CHANCE;
    } else {
      triggerMiss();
      vbPlaySound('miss');
    }
  }

  // ── RENDER ──────────────────────────────────────────────
  setBall();
  setPlayer(zaneEl, state.zane);
  setPlayer(kayleighEl, state.kayleigh);

  state.lastTime = ts;
  requestAnimationFrame(update);
}

// ── INPUT ─────────────────────────────────────────────────
var lastTapTs = 0;
function zaneTap() {
  var now = Date.now();
  if (now - lastTapTs < 150) return;
  lastTapTs = now;
  if (state.phase === 'playing') {
    state.zaneTapped = true;
  }
}

tapLeft.addEventListener('touchstart', function() { zaneTap(); }, { passive: true });
tapLeft.addEventListener('click', function() {
  if (Date.now() - lastTapTs > 300) zaneTap();
});

// ── QUIT ──────────────────────────────────────────────────
document.getElementById('vb-quit').addEventListener('click', function() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.location.href = '../../index.html';
});
document.getElementById('vb-quit').addEventListener('touchstart', function() {
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.location.href = '../../index.html';
}, { passive: true });

// ── START ─────────────────────────────────────────────────
window.addEventListener('load', function() {
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  state.zane.y     = GROUND_Y;
  state.kayleigh.y = GROUND_Y;
  setTimeout(function() {
    vbSpeak("Let's play volleyball! Tap to hit!");
    runCountdown(function() {
      serve(true);
      state.lastTime = performance.now();
      requestAnimationFrame(update);
    });
  }, 500);
});
