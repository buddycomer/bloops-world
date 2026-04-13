// ── VOLLEYBALL — STEP 1 ───────────────────────────────────
// Just Zane. Tap left side = he jumps. Nothing else.

var zane = { x: 0, y: 0, vy: 0, onGround: true };
var GRAVITY = 0.5;
var JUMP_VY = -14;
var zaneEl  = document.getElementById('vb-zane');
var tapZone = document.getElementById('vb-tap-left');
var lastTap = 0;

function getGroundY() {
  return window.innerHeight * 0.70;
}

function placeZane() {
  var pw = zaneEl.offsetWidth  || 60;
  var ph = zaneEl.offsetHeight || 120;
  zaneEl.style.position = 'absolute';
  zaneEl.style.left     = (zane.x - pw/2) + 'px';
  zaneEl.style.top      = (zane.y - ph)   + 'px';
}

function jump() {
  var now = Date.now();
  if (now - lastTap < 200) return;
  lastTap = now;
  if (zane.onGround) {
    zane.vy = JUMP_VY;
    zane.onGround = false;
    zaneEl.classList.remove('hitting');
    void zaneEl.offsetWidth;
    zaneEl.classList.add('hitting');
    zaneEl.addEventListener('animationend', function() {
      zaneEl.classList.remove('hitting');
    }, { once: true });
  }
}

function loop() {
  var groundY = getGroundY();

  if (!zane.onGround) {
    zane.vy += GRAVITY;
    zane.y  += zane.vy;
    if (zane.y >= groundY) {
      zane.y = groundY;
      zane.vy = 0;
      zane.onGround = true;
    }
  }

  placeZane();
  requestAnimationFrame(loop);
}

// ── INPUT ─────────────────────────────────────────────────
tapZone.addEventListener('touchstart', jump, { passive: true });
tapZone.addEventListener('click', function() {
  if (Date.now() - lastTap > 300) jump();
});

// ── QUIT ──────────────────────────────────────────────────
document.getElementById('vb-quit').addEventListener('click', function() {
  window.location.href = '../../index.html';
});
document.getElementById('vb-quit').addEventListener('touchstart', function() {
  window.location.href = '../../index.html';
}, { passive: true });

// ── START ─────────────────────────────────────────────────
window.addEventListener('load', function() {
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      zane.x = window.innerWidth * 0.15;
      zane.y = getGroundY();
      placeZane();
      requestAnimationFrame(loop);
    });
  });
});
