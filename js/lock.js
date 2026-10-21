// Lock screen: the site stays covered until someone enters their 8-arrow code,
// with the keyboard arrows or the on-screen arrow buttons (for iPads/phones).
// The code decides who is signed in (accounts.js), which tabs they get and
// whose stats are recorded. It asks again on every page load and after the
// idle time set in the Admin tab. Whatever was on screen stays underneath.
//
// Against guessing: all 8 arrows are entered first and only then checked, so a
// wrong try never shows which arrow was wrong (65,536 possible codes). Only a
// hash of each code is stored.
// Note: this only hides the page; the files themselves are still public.
(function () {
  var LENGTH = 8;
  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  var lock = document.getElementById("lock"), dots = document.getElementById("lock-dots");
  var entered = [], locked = false, lastActive = Date.now();
  // Second step for the owner account: a 3-digit PIN on a number pad (only its hash is kept here).
  var PIN_HASH = "9bafd90d", PIN_LENGTH = 3;
  var pinFor = null, pinDirs = null, pin = [];   // set while the Admin Login step is showing
  var title = lock.querySelector("h1"), hint = lock.querySelector(".lock-box > p");
  var arrowPad = lock.querySelector(".lock-pad"), wip = lock.querySelector(".lock-wip");
  var numPad = document.createElement("div");
  numPad.className = "lock-pad num-pad";
  numPad.hidden = true;
  numPad.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return "<button data-num='" + n + "'>" + n + "</button>"; }).join("") +
    "<button class='lock-clear num-back' data-back='1'>Back</button><button data-num='0'>0</button><button class='lock-clear num-clear' data-clear='1'>Clear</button>";
  arrowPad.parentNode.insertBefore(numPad, arrowPad.nextSibling);

  function lockHash(s) {
    var x = 0x811c9dc5;
    for (var r = 0; r < 200; r++) {
      for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
      x = (x ^ r) >>> 0;
    }
    return x.toString(16);
  }
  function codeHash(dirs) { return lockHash("jj-bakery|" + dirs.join(",")); }

  // Published accounts, or newer changes the admin saved in this browser
  // (used when the site isn't running through the local app to publish them).
  function config() {
    var pub = window.JJ_ACCOUNTS || { rev: 0, settings: {}, accounts: [] };
    try {
      var draft = JSON.parse(localStorage.getItem("jj-accounts-draft"));
      if (draft && draft.rev > pub.rev) return draft;
    } catch (e) {}
    return pub;
  }

  window.JJ = window.JJ || {};
  JJ.codeHash = codeHash;
  JJ.config = config;
  JJ.user = null;

  function drawDots() {
    var html = "";
    var len = pinFor ? PIN_LENGTH : LENGTH, n = pinFor ? pin.length : entered.length;
    for (var i = 0; i < len; i++) html += "<span" + (i < n ? " class='on'" : "") + "></span>";
    dots.innerHTML = html;
  }
  function showStep(acct, dirs) {
    pinFor = acct || null; pinDirs = acct ? dirs : null; pin = [];
    title.textContent = acct ? "Admin Login" : "JJ Bakery";
    hint.textContent = acct ? "Enter the admin PIN." : "Enter the 8-arrow code to continue.";
    arrowPad.hidden = !!acct; numPad.hidden = !acct;
    if (wip) wip.hidden = !!acct;
    drawDots();
  }
  function shake() {
    lock.classList.remove("wrong");
    void lock.offsetWidth;
    lock.classList.add("wrong");
  }
  function pressNum(n) {
    if (!pinFor || pin.length >= PIN_LENGTH) return;
    pin.push(n);
    drawDots();
    if (pin.length < PIN_LENGTH) return;
    var ok = lockHash("jj-bakery-pin|" + pin.join("")) === PIN_HASH, acct = pinFor, dirs = pinDirs;
    if (ok) { showStep(null); JJ.ownerCode = dirs; unlock(acct); return; }
    // wrong PIN: start over from the arrow code
    shake();
    setTimeout(function () { showStep(null); }, 350);
  }
  numPad.querySelectorAll("[data-num]").forEach(function (b) { b.onclick = function () { pressNum(b.dataset.num); }; });
  numPad.querySelector("[data-clear]").onclick = function () { pin = []; drawDots(); };
  numPad.querySelector("[data-back]").onclick = function () { showStep(null); };

  function lockNow() {
    if (locked) return;
    JJ.ownerCode = null;
    locked = true;
    entered = [];
    showStep(null);
    drawDots();
    lock.hidden = false;
    document.body.classList.add("locked");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.dispatchEvent(new CustomEvent("jj-lock"));
  }
  function unlock(acct) {
    var changed = !JJ.user || JJ.user.id !== acct.id;
    JJ.user = acct;
    locked = false;
    lock.hidden = true;
    document.body.classList.remove("locked");
    lastActive = Date.now();
    document.dispatchEvent(new CustomEvent("jj-login", { detail: { user: acct, changed: changed } }));
  }
  function clearEntry() { entered = []; drawDots(); }
  function press(dir) {
    if (entered.length >= LENGTH) return;
    entered.push(dir);
    drawDots();
    if (entered.length < LENGTH) return;
    // all 8 in: check the whole code at once
    var h = codeHash(entered), dirs = entered.slice();
    entered = [];
    var acct = config().accounts.find(function (a) { return a.hash === h && a.active; });
    // the owner's code goes on to the Admin Login PIN step; nobody else sees that step
    if (acct && acct.owner) { showStep(acct, dirs); return; }
    if (acct) { JJ.ownerCode = null; unlock(acct); return; }
    shake();
    setTimeout(drawDots, 350);
  }

  document.addEventListener("keydown", function (e) {
    if (!locked) return;
    // while locked, no key reaches the app underneath
    e.preventDefault();
    e.stopPropagation();
    if (pinFor) {
      if (/^[0-9]$/.test(e.key) && !e.repeat) pressNum(e.key);
      else if (e.key === "Backspace") { pin = []; drawDots(); }
      else if (e.key === "Escape") showStep(null);
      return;
    }
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
  JJ.lastActive = function () { return lastActive; };
  JJ.isLocked = function () { return locked; };
  JJ.lockNow = lockNow;
  function idleMinutes() { return +(config().settings || {}).idleMinutes || 5; }
  function checkIdle() { if (!locked && Date.now() - lastActive > idleMinutes() * 60000) lockNow(); }
  setInterval(checkIdle, 10000);
  document.addEventListener("visibilitychange", checkIdle);
  window.addEventListener("focus", checkIdle);

  lockNow();
})();
