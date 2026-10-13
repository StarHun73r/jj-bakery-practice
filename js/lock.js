// Lock screen: the site stays covered until the arrow code is entered,
// with the keyboard arrows or the on-screen arrow buttons (for iPads/phones).
// It asks again on every page load and after IDLE_MINUTES with no taps,
// clicks, keys or scrolling. Whatever was on screen stays as it was underneath.
// Note: this only hides the page; the files themselves are still public.
(function () {
  var CODE = ["up", "up", "down", "down", "left", "right", "left", "right"];
  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  var IDLE_MINUTES = 7;
  var lock = document.getElementById("lock"), dots = document.getElementById("lock-dots");
  var entered = [], locked = false, lastActive = Date.now();

  function drawDots() {
    dots.innerHTML = CODE.map(function (_, i) { return "<span" + (i < entered.length ? " class='on'" : "") + "></span>"; }).join("");
  }
  function lockNow() {
    if (locked) return;
    locked = true;
    entered = [];
    drawDots();
    lock.hidden = false;
    document.body.classList.add("locked");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function unlock() {
    locked = false;
    lock.hidden = true;
    document.body.classList.remove("locked");
    lastActive = Date.now();
  }
  function press(dir) {
    entered.push(dir);
    if (entered[entered.length - 1] !== CODE[entered.length - 1]) {
      // wrong arrow: shake, and keep only the presses that still start the code
      // (so up, up, up still counts as the first two ups)
      while (entered.length && entered.some(function (d, i) { return d !== CODE[i]; })) entered.shift();
      lock.classList.remove("wrong");
      void lock.offsetWidth;
      lock.classList.add("wrong");
    }
    drawDots();
    if (entered.length === CODE.length) unlock();
  }

  document.addEventListener("keydown", function (e) {
    if (!locked) return;
    // while locked, no key reaches the app underneath
    e.preventDefault();
    e.stopPropagation();
    if (KEYS[e.key] && !e.repeat) press(KEYS[e.key]);
  }, true);
  lock.querySelectorAll("[data-dir]").forEach(function (b) {
    b.onclick = function () { press(b.dataset.dir); };
  });

  // Idle timer: any activity while unlocked counts; check the clock often so
  // it also locks right away when coming back to a tab left in the background.
  ["pointerdown", "keydown", "wheel", "scroll", "touchstart", "mousemove"].forEach(function (ev) {
    document.addEventListener(ev, function () { if (!locked) lastActive = Date.now(); }, { capture: true, passive: true });
  });
  function checkIdle() { if (!locked && Date.now() - lastActive > IDLE_MINUTES * 60000) lockNow(); }
  setInterval(checkIdle, 10000);
  document.addEventListener("visibilitychange", checkIdle);
  window.addEventListener("focus", checkIdle);

  lockNow();
})();
