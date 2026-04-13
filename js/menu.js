// ── MENU — Phase 3 ────────────────────────────────────────

var menuBtn  = document.getElementById('menu-btn');
var menuDrop = document.getElementById('menu-dropdown');

function openMenu(e) {
  e.stopPropagation();
  menuDrop.classList.toggle('open');
}

function closeMenu() {
  menuDrop.classList.remove('open');
}

menuBtn.addEventListener('click', openMenu);

document.addEventListener('click', function(e) {
  if (!menuBtn.contains(e.target) && !menuDrop.contains(e.target)) {
    closeMenu();
  }
});

// Dance Grid — now a real link
document.getElementById('menu-dancegrid').addEventListener('click', function(e) {
  e.stopPropagation();
  closeMenu();
  window.location.href = 'minigames/dancegrid/index.html';
});

// Coming soon — do nothing
document.querySelectorAll('.menu-item.coming-soon').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
  });
});
