// ── MENU — Phase 2 ────────────────────────────────────────
// Self contained. Touch and click safe.
// Wire up real links in Phase 3+

var menuBtn  = document.getElementById('menu-btn');
var menuDrop = document.getElementById('menu-dropdown');

function openMenu(e) {
  e.stopPropagation();
  menuDrop.classList.toggle('open');
}

function closeMenu() {
  menuDrop.classList.remove('open');
}

// Open/close on button tap
menuBtn.addEventListener('click', openMenu);

// Close when tapping outside — use click not touchstart
document.addEventListener('click', function(e) {
  if (!menuBtn.contains(e.target) && !menuDrop.contains(e.target)) {
    closeMenu();
  }
});

// Dance Grid — placeholder for now, real link added in Phase 3
document.getElementById('menu-dancegrid').addEventListener('click', function(e) {
  e.stopPropagation();
  closeMenu();
  // Phase 3: window.location.href = 'minigames/dancegrid/index.html';
  alert('Dance Grid coming soon!');
});

// Coming soon items — do nothing
document.querySelectorAll('.menu-item.coming-soon').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
  });
});
