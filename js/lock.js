// Lock screen: the site stays covered until the arrow code is entered,
// with the keyboard arrows or the on-screen arrow buttons (for iPads/phones).
// Once unlocked, it stays open until this browser tab is closed.
// Note: this only hides the page; the files themselves are still public.
(function () {
  var CODE = ["up", "up", "down", "down", "left", "right", "left", "right"];
  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  var lock = document.getElementById("lock"), dots = document.getElementById("lock-dots");
  var entered = [];

  function unlocked() { try { return sessionStorage.getItem("jj-unlocked") === "yes"; } catch (e) { return false; } }
  if (unlocked()) { lock.remove(); return; }
  document.body.classList.add("locked");

  function drawDots() {
    dots.innerHTML = CODE.map(function (_, i) { return "<span" + (i < entered.length ? " class='on'" : "") + "></span>"; }).join("");
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
    if (entered.length === CODE.length) {
      try { sessionStorage.setItem("jj-unlocked", "yes"); } catch (e) {}
      document.removeEventListener("keydown", onKey, true);
      document.body.classList.remove("locked");
      lock.remove();
    }
  }
  function onKey(e) {
    // while locked, no key reaches the app underneath
    e.preventDefault();
    e.stopPropagation();
    if (KEYS[e.key] && !e.repeat) press(KEYS[e.key]);
  }
  document.addEventListener("keydown", onKey, true);
  lock.querySelectorAll("[data-dir]").forEach(function (b) {
    b.onclick = function () { press(b.dataset.dir); };
  });
  drawDots();
})();
