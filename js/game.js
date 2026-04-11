// ── BLOOP'S WORLD — Phase 1 ───────────────────────────────
// Simple, clean, touch-first. No service worker. No minigames.
// Just Bloop and his world.

var game     = document.getElementById('game');
var bloopEl  = document.getElementById('bloop');
var bloopWrap = document.getElementById('bloop-wrap');
var armL     = document.getElementById('arm-l');
var armR     = document.getElementById('arm-r');
var pupilL   = document.getElementById('pupil-l');
var pupilR   = document.getElementById('pupil-r');
var lastTap  = 0;

var skyEmojis    = ['⭐','🌟','✨','💫','☁️','🌤️','🌙'];
var groundEmojis = ['🌸','🌼','🌻','🌷','🍀','🌿'];
var centerEmojis = ['🎈','🎊','💥','🌀','⚡','🎆'];
var heartEmojis  = ['❤️','💕','💖','💗','🩷'];
var runEmojis    = ['🦕','🐊','🐸','🦋','🐢'];

// ── BLOOP ANIMATION ───────────────────────────────────────
function animateBloop(type) {
  bloopEl.classList.remove('bounce','wiggle','spin','squish','happy');
  void bloopEl.offsetWidth;
  bloopEl.classList.add(type);
  bloopEl.addEventListener('animationend', function() {
    bloopEl.classList.remove(type);
  }, { once: true });
  if (type === 'bounce' || type === 'happy' || type === 'squish') {
    armL.style.transform = 'rotate(-35deg) translateY(-10px)';
    armR.style.transform = 'rotate(35deg) translateY(-10px)';
    setTimeout(function() {
      armL.style.transform = 'rotate(20deg)';
      armR.style.transform = 'rotate(-20deg)';
    }, 400);
  }
}

// ── PUPIL TRACKING ────────────────────────────────────────
function trackPupils(cx, cy) {
  var br = bloopWrap.getBoundingClientRect();
  var bx = br.left + br.width / 2;
  var by = br.top + br.height / 2;
  var dx = cx - bx;
  var dy = cy - by;
  var dist = Math.sqrt(dx*dx + dy*dy);
  var max = 5;
  var nx = dist > 1 ? (dx/dist) * Math.min(dist/20, max) : 0;
  var ny = dist > 1 ? (dy/dist) * Math.min(dist/20, max) : 0;
  pupilL.style.transform = 'translate('+nx+'px,'+ny+'px)';
  pupilR.style.transform = 'translate('+nx+'px,'+ny+'px)';
}

game.addEventListener('mousemove', function(e) {
  trackPupils(e.clientX, e.clientY);
});

// ── EFFECTS ───────────────────────────────────────────────
function spawnEffect(emoji, x, y, cls) {
  var el = document.createElement('div');
  el.className = 'effect ' + (cls || 'float-up');
  el.style.left = (x - 16) + 'px';
  el.style.top  = (y - 16) + 'px';
  el.style.fontSize = 'clamp(24px,4vw,40px)';
  el.textContent = emoji;
  el.style.pointerEvents = 'none';
  game.appendChild(el);
  el.addEventListener('animationend', function() { el.remove(); });
}

function spawnRunner(emoji, fromLeft) {
  var el = document.createElement('div');
  el.className = 'effect creature-run' + (fromLeft ? '' : ' from-right');
  el.style.fontSize = 'clamp(28px,5vw,50px)';
  el.style.position = 'absolute';
  el.style.bottom = (game.offsetHeight * 0.2) + 'px';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '8';
  var dur = (1.5 + Math.random() * 1.2).toFixed(1) + 's';
  el.style.setProperty('--run-dur', dur);
  el.style.left = fromLeft ? '-60px' : 'auto';
  el.style.right = fromLeft ? 'auto' : '-60px';
  el.textContent = emoji;
  game.appendChild(el);
  el.addEventListener('animationend', function() { el.remove(); });
}

function flashScreen(color) {
  var el = document.getElementById('combo-flash');
  el.style.background = color || 'rgba(255,255,255,0.5)';
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  el.addEventListener('animationend', function() {
    el.classList.remove('active');
  }, { once: true });
}

function showRainbow() {
  var el = document.getElementById('rainbow');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  el.addEventListener('animationend', function() {
    el.classList.remove('show');
  }, { once: true });
}

// ── ZONE DETECTION ────────────────────────────────────────
var skyTaps = 0;
var skyTapTimer = null;

function handleTap(x, y) {
  var now = Date.now();
  if (now - lastTap < 100) return;
  lastTap = now;

  var w = game.offsetWidth;
  var h = game.offsetHeight;
  var br = bloopWrap.getBoundingClientRect();
  var gr = game.getBoundingClientRect();
  var bx = br.left - gr.left;
  var by = br.top - gr.top;
  var bw = br.width;
  var bh = br.height;

  // Bloop belly check
  var bellyX = bx + bw * 0.32;
  var bellyY = by + bh * 0.52;
  if (x > bellyX && x < bellyX + bw*0.36 && y > bellyY && y < bellyY + bh*0.28) {
    animateBloop('squish');
    spawnEffect('😂', x, y - 40, 'float-up');
    for (var i = 0; i < 3; i++) {
      (function(i) {
        setTimeout(function() {
          spawnEffect(heartEmojis[Math.floor(Math.random()*heartEmojis.length)],
            x + (Math.random()-0.5)*80, y - 30, 'heart-float');
        }, i * 100);
      })(i);
    }
    playSound('belly');
    return;
  }

  // Bloop body check
  if (x > bx && x < bx+bw && y > by && y < by+bh) {
    var anims = ['bounce','wiggle','spin'];
    animateBloop(anims[Math.floor(Math.random()*anims.length)]);
    spawnEffect(heartEmojis[Math.floor(Math.random()*heartEmojis.length)],
      x + (Math.random()-0.5)*60, y - 30, 'heart-float');
    spawnEffect('✨', x + (Math.random()-0.5)*60, y - 50, 'float-up');
    playSound('tap');
    return;
  }

  // Sky
  if (y < h * 0.45) {
    spawnEffect(skyEmojis[Math.floor(Math.random()*skyEmojis.length)], x, y, 'star-pop');
    animateBloop('wiggle');
    playSound('star');
    // Sky x3 = rainbow
    skyTaps++;
    clearTimeout(skyTapTimer);
    skyTapTimer = setTimeout(function() { skyTaps = 0; }, 3000);
    if (skyTaps >= 3) {
      skyTaps = 0;
      showRainbow();
      animateBloop('happy');
      playSound('rainbow');
    }
    return;
  }

  // Ground
  if (y > h * 0.78) {
    spawnEffect(groundEmojis[Math.floor(Math.random()*groundEmojis.length)], x, y, 'flower-grow');
    if (Math.random() < 0.5) {
      spawnRunner(runEmojis[Math.floor(Math.random()*runEmojis.length)], Math.random() < 0.5);
    }
    animateBloop('bounce');
    playSound('flower');
    return;
  }

  // Center / sides
  spawnEffect(centerEmojis[Math.floor(Math.random()*centerEmojis.length)], x, y, 'float-up');
  animateBloop(Math.random() < 0.5 ? 'bounce' : 'wiggle');
  playSound('tap');
}

// ── INPUT — touch and mouse ────────────────────────────────
game.addEventListener('click', function(e) {
  var r = game.getBoundingClientRect();
  handleTap(e.clientX - r.left, e.clientY - r.top);
});

game.addEventListener('touchstart', function(e) {
  var r = game.getBoundingClientRect();
  for (var i = 0; i < e.changedTouches.length; i++) {
    handleTap(e.changedTouches[i].clientX - r.left, e.changedTouches[i].clientY - r.top);
  }
}, { passive: true });

// ── BLOOP IDLE BOB ────────────────────────────────────────
setInterval(function() {
  var offset = Math.sin(Date.now() / 800) * 4;
  bloopWrap.style.transform = 'translateX(-50%) translateY(' + offset + 'px)';
}, 16);
