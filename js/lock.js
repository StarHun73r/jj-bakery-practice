// Lock screen: the site stays covered until the 8-arrow code is entered,
// with the keyboard arrows or the on-screen arrow buttons (for iPads/phones).
// It asks again on every page load and after IDLE_MINUTES with no taps,
// clicks, keys or scrolling. Whatever was on screen stays as it was underneath.
//
// Against guessing: all 8 arrows are entered first and only then checked, so a
// wrong try never shows which arrow was wrong (65,536 possible codes). The code
// itself isn't written here, only a hash of it (lockHash below).
// To change the code: node -e "<lockHash function>; console.log(lockHash('jj-bakery|up,down,...'))"
// and put the result in CODE_HASH.
// Note: this only hides the page; the files themselves are still public.
(function () {
  var CODE_HASH = "8d9bb775", LENGTH = 8;
  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  var IDLE_MINUTES = 5;
  var lock = document.getElementById("lock"), dots = document.getElementById("lock-dots");
  var entered = [], locked = false, lastActive = Date.now();

  function lockHash(s) {
    var x = 0x811c9dc5;
    for (var r = 0; r < 200; r++) {
      for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
      x = (x ^ r) >>> 0;
    }
    return x.toString(16);
  }
  function drawDots() {
    var html = "";
    for (var i = 0; i < LENGTH; i++) html += "<span" + (i < entered.length ? " class='on'" : "") + "></span>";
    dots.innerHTML = html;
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
  function clearEntry() { entered = []; drawDots(); }
  function press(dir) {
    if (entered.length >= LENGTH) return;
    entered.push(dir);
    drawDots();
    if (entered.length < LENGTH) return;
    // all 8 in: check the whole code at once
    var ok = lockHash("jj-bakery|" + entered.join(",")) === CODE_HASH;
    entered = [];
    if (ok) { unlock(); return; }
    lock.classList.remove("wrong");
    void lock.offsetWidth;
    lock.classList.add("wrong");
    setTimeout(drawDots, 350);
  }

  document.addEventListener("keydown", function (e) {
    if (!locked) return;
    // while locked, no key reaches the app underneath
    e.preventDefault();
    e.stopPropagation();
    if (KEYS[e.key] && !e.repeat) press(KEYS[e.key]);
    else if (e.key === "Escape" || e.key === "Backspace") clearEntry();
  }, true);
  lock.querySelectorAll("[data-dir]").forEach(function (b) {
    b.onclick = function () { press(b.dataset.dir); };
  });
  document.getElementById("lock-clear").onclick = clearEntry;

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
