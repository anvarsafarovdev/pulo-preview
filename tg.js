/* Pulo Preview: the Telegram bridge. Inside Telegram it uses Telegram's own
   bottom button, Back button, theme, viewport and vibration, the same pieces
   the real Mini App uses. Outside Telegram (a phone or desktop browser) the
   page draws its own button and Back instead, so a design still works. */
(function () {
  var W = window.Telegram && window.Telegram.WebApp;
  var inTG = !!(W && W.platform && W.platform !== 'unknown');
  var root = document.documentElement;
  var T = { inTG: inTG, W: W };

  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  function applyTheme(forced) {
    var dark;
    if (forced) dark = forced === 'dark';
    else if (inTG) dark = W.colorScheme === 'dark';
    else dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (inTG) {
      var bg = css('--ground');
      try { W.setHeaderColor(bg); } catch (e) {}
      try { W.setBackgroundColor(bg); } catch (e) {}
      try { if (W.setBottomBarColor) W.setBottomBarColor(bg); } catch (e) {}
    }
    syncMain();
  }
  T.setTheme = function (t) { applyTheme(t); };
  T.theme = function () { return root.getAttribute('data-theme'); };

  /* ── Back: an open sheet takes Back first; with nothing open, Back leaves. */
  var backStack = [];
  var isHome = !!document.body.getAttribute('data-home');
  T.home = function () {
    var p = location.pathname, base = p.slice(0, p.indexOf('/d/') >= 0 ? p.indexOf('/d/') + 1 : p.lastIndexOf('/') + 1);
    location.href = base + 'index.html?t=' + Date.now();
  };
  function onBack() {
    if (backStack.length) { backStack[backStack.length - 1](); return; }
    if (!isHome) T.home();
  }
  T.pushBack = function (fn) { backStack.push(fn); syncBack(); };
  T.popBack = function (fn) {
    var i = backStack.lastIndexOf(fn);
    if (i >= 0) backStack.splice(i, 1);
    syncBack();
  };
  var fbBack = null;
  function syncBack() {
    var show = backStack.length > 0 || !isHome;
    if (inTG) { if (show) W.BackButton.show(); else W.BackButton.hide(); return; }
    if (!fbBack) {
      fbBack = document.createElement('button');
      fbBack.className = 'fb-back'; fbBack.type = 'button'; fbBack.textContent = '‹ Back';
      fbBack.onclick = onBack; document.body.appendChild(fbBack);
    }
    fbBack.hidden = !show;
  }

  /* ── The bottom button. cfg = {text, enabled, progress, onClick} or null. */
  var mainCfg = null, tgHandler = null, fbWrap = null, fbBtn = null;
  function fire() { if (mainCfg && mainCfg.enabled !== false && !mainCfg.progress && mainCfg.onClick) mainCfg.onClick(); }
  function syncMain() {
    var cfg = mainCfg;
    if (inTG) {
      var mb = W.MainButton;
      if (!tgHandler) { tgHandler = fire; mb.onClick(tgHandler); }
      if (!cfg) { mb.hideProgress(); mb.hide(); return; }
      /* The same calls, in the same order, as the app's shell.setMainButton
         (src/client/mini-app/shell.ts, REDESIGN-6d), so a difference between
         this preview and staging is never this code. */
      mb.setText(cfg.text);
      try { mb.setParams({ color: css('--text-1'), text_color: css('--ground') }); } catch (e) {}
      if (cfg.enabled === false) mb.disable(); else mb.enable();
      if (cfg.progress) mb.showProgress(); else mb.hideProgress();
      mb.show();
      return;
    }
    var host = document.querySelector('.app');
    if (!host) return;
    if (!fbWrap) {
      fbWrap = document.createElement('div'); fbWrap.className = 'fb-main';
      fbBtn = document.createElement('button'); fbBtn.type = 'button'; fbBtn.onclick = fire;
      fbWrap.appendChild(fbBtn); host.appendChild(fbWrap);
    }
    fbWrap.hidden = !cfg;
    if (cfg) { fbBtn.textContent = cfg.progress ? '…' : cfg.text; fbBtn.disabled = cfg.enabled === false; }
  }
  T.main = function (cfg) { mainCfg = cfg; syncMain(); };

  /* ── Vibration: Telegram's own, else the browser's. */
  T.haptic = function (kind) {
    try {
      if (inTG && W.HapticFeedback) {
        if (kind === 'select') W.HapticFeedback.selectionChanged();
        else if (kind === 'success' || kind === 'error' || kind === 'warning') W.HapticFeedback.notificationOccurred(kind);
        else W.HapticFeedback.impactOccurred(kind || 'light');
      } else if (navigator.vibrate) navigator.vibrate(kind === 'success' ? [10, 40, 10] : 8);
    } catch (e) {}
  };

  var toastEl = null, toastT = 0;
  T.toast = function (text) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = text; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  };

  /* ── Start. */
  if (inTG) {
    try { W.ready(); } catch (e) {}
    try { W.expand(); } catch (e) {}
    try { if (W.disableVerticalSwipes) W.disableVerticalSwipes(); } catch (e) {}
    W.BackButton.onClick(onBack);
    W.onEvent('themeChanged', function () { applyTheme(); });
  } else if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { applyTheme(); });
  }
  if (!inTG) root.className += ' fb';
  applyTheme();
  syncBack();
  window.PT = T;
})();
