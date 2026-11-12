(function () {
  var W = window.Telegram && window.Telegram.WebApp, root = document.documentElement;
  function toggle() { root.classList.toggle('pv-opts'); window.dispatchEvent(new Event('resize')); }
  if (W && W.platform && W.platform !== 'unknown' && W.SettingsButton) {
    try { W.SettingsButton.show(); W.SettingsButton.onClick(toggle); } catch (e) {}
  } else {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pv-optb'; b.textContent = 'Options';
    b.onclick = toggle; document.body.appendChild(b);
  }
  window.dispatchEvent(new Event('resize'));
})();
