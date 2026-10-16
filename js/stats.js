// Per-person statistics and the Admin tab.
//
// Who is signed in comes from the lock screen (lock.js / accounts.js). Every
// answer in Practice, Find it and Flashcards, every hint and every minute of
// active use is recorded for that person, in this browser (localStorage key
// "jj-ustats:<account id>"). When js/sync-config.js has a Google Sheet URL, each
// device also sends its numbers there and reads everyone else's, so a person's
// stats add up across every device they use (see tools/google-sheet-sync.gs).
// Without it, a person can copy a "stats code" and the admin can paste it in.
//
// Loaded after app.js, which shares ITEMS, esc() and setMode() through window.JJ.
(function () {
  var JJ = window.JJ;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  var LEVELS = { admin: "Admin", trainer: "Trainer", trainee: "Trainee" };
  var LEVEL_NOTE = {
    admin: "Everything, including this Admin tab",
    trainer: "All modes, including Photos (adding and replacing photos)",
    trainee: "All practice modes and the Sheet, but not Photos",
  };

  // ------------------------------------------------------------------
  //  Recording
  // ------------------------------------------------------------------
  function blank() {
    return {
      first: Date.now(), last: Date.now(), sessions: 0,
      time: { total: 0, days: {}, modes: {} },
      practice: { orders: 0, perfect: 0, helped: 0, wrongOrders: 0, wrongChecks: 0, wrongCard: 0,
                  gaveUp: 0, hints: 0, time: 0, items: 0, streak: 0, best: 0 },
      drill: { found: 0, clean: 0, helped: 0, hints: 0, wrong: 0, wrongTaps: 0, skips: 0, time: 0, streak: 0, best: 0 },
      flash: { got: 0, missed: 0 },
      items: {},   // id -> { r: right, w: wrong, h: with a hint }
    };
  }
  function key(id) { return "jj-ustats:" + id; }
  function load(id) {
    try {
      var s = JSON.parse(localStorage.getItem(key(id)));
      if (s) { var b = blank(); for (var k in b) if (s[k] === undefined) s[k] = b[k]; return s; }
    } catch (e) {}
    return blank();
  }
  function save(id, s) { try { localStorage.setItem(key(id), JSON.stringify(s)); } catch (e) {} }
  function today(t) { var d = new Date(t || Date.now()); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function update(fn, timeOnly) {
    if (!JJ.user) return;
    var s = load(JJ.user.id);
    fn(s);
    s.last = Date.now();
    save(JJ.user.id, s);
    if (timeOnly) sync.timeMoved(JJ.user.id); else sync.changed(JJ.user.id);
  }
  // Flashcards are for memorizing, not testing, so they never mark items or count as answers.
  function itemMark(s, id, kind, mode) {
    var it = s.items[id] || (s.items[id] = { r: 0, h: 0, s: 0, w: 0, p: 0, f: 0 });
    it[kind] = (it[kind] || 0) + 1;
    it[mode] = (it[mode] || 0) + 1;
  }

  // Called by app.js
  JJ.track = function (type, d) {
    update(function (s) {
      var p = s.practice, dr = s.drill;
      if (type === "order") {
        // d: { clean, secs, wrongChecks, hinted: [ids], wrongCard, lines: [{itemId, qty}], wrongIds: [ids] }
        p.orders++;
        p.time += d.secs;
        p.items += d.lines.reduce(function (a, l) { return a + l.qty; }, 0);
        p.hints += d.hinted.length;
        p.wrongChecks += d.wrongChecks;
        if (d.wrongCard) p.wrongCard++;
        if (d.clean) { p.perfect++; p.streak++; p.best = Math.max(p.best, p.streak); }
        else {
          p.streak = 0;
          if (d.wrongChecks || d.wrongCard) p.wrongOrders++; else p.helped++;
        }
        d.lines.forEach(function (l) {
          var id = l.itemId;
          itemMark(s, id, d.wrongIds.indexOf(id) >= 0 ? "w" : d.hinted.indexOf(id) >= 0 ? "h" : "r", "p");
        });
      } else if (type === "giveup") {
        p.gaveUp++; p.wrongOrders++; p.orders++; p.streak = 0;
        p.hints += d.hinted.length;
        d.lines.forEach(function (l) { itemMark(s, l.itemId, "s", "p"); });
      } else if (type === "drill") {
        // d: { id, clean, wrong, hinted, secs }
        dr.found++; dr.time += d.secs; dr.wrongTaps += d.wrong;
        if (d.hinted) dr.hints = (dr.hints || 0) + 1;
        if (d.clean) { dr.clean++; dr.streak++; dr.best = Math.max(dr.best, dr.streak); }
        else { dr.streak = 0; if (d.wrong) dr.wrong++; else dr.helped++; }
        itemMark(s, d.id, d.clean ? "r" : d.wrong ? "w" : "h", "f");
      } else if (type === "drill-skip") {
        dr.skips++; dr.streak = 0;
        itemMark(s, d.id, "s", "f");
      } else if (type === "flash") {
        if (d.ok) s.flash.got++; else s.flash.missed++;
      }
    });
    if (state.mode === "stats") renderStatsPage();
  };

  // Active time: counts while signed in, the page is visible and someone
  // has touched it (tap, click, key, scroll) in the last 2 minutes.
  var TICK = 5;
  setInterval(function () {
    if (!JJ.user || JJ.isLocked() || document.visibilityState !== "visible") return;
    if (Date.now() - JJ.lastActive() > 2 * 60000) return;
    update(function (s) {
      s.time.total += TICK;
      var m = JJ.mode && JJ.mode();
      if (m) { s.time.modes = s.time.modes || {}; s.time.modes[m] = (s.time.modes[m] || 0) + TICK; }
      var d = today();
      s.time.days[d] = (s.time.days[d] || 0) + TICK;
    }, true);   // time only: goes up with the next answer or when the page is left
  }, TICK * 1000);

  // ------------------------------------------------------------------
  //  Sync with the Google Sheet
  // ------------------------------------------------------------------
  // Each device has its own id and keeps one row per person in the Sheet.
  // What's shown is this device's numbers plus every other device's row.
  var CFG = window.JJ_SYNC || {};
  var sync = (function () {
    var on = !!CFG.url, device, remote = {}, dirty = {}, lastPull = 0, pulling = null, status = "";
    try {
      device = localStorage.getItem("jj-device");
      if (!device) { device = "d" + Math.random().toString(36).slice(2, 10); localStorage.setItem("jj-device", device); }
      remote = JSON.parse(localStorage.getItem("jj-remote-stats")) || {};
      dirty = JSON.parse(localStorage.getItem("jj-sync-dirty")) || {};
    } catch (e) { device = device || "d-unknown"; }
    function keep() { try { localStorage.setItem("jj-sync-dirty", JSON.stringify(dirty)); } catch (e) {} }

    function pull(force) {
      if (!on) return Promise.resolve();
      if (pulling) return pulling;
      if (!force && Date.now() - lastPull < 30000) return Promise.resolve();
      pulling = fetch(CFG.url + "?key=" + encodeURIComponent(CFG.key))
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r.ok) throw new Error(r.error);
          var byId = {};
          r.rows.forEach(function (row) { (byId[row.id] = byId[row.id] || []).push(row); });
          // a person was reset after this device's copy started: drop the local copy
          Object.keys(byId).forEach(function (id) {
            var mark = byId[id].filter(function (x) { return x.device === "reset"; }).map(function (x) { return x.stats.resetAt || 0; });
            if (!mark.length) return;
            var at = Math.max.apply(null, mark);
            // rows that started before the reset are old copies: ignore them
            byId[id] = byId[id].filter(function (x) { return x.device === "reset" || !(x.stats.first < at); });
            var have = null; try { have = JSON.parse(localStorage.getItem(key(id))); } catch (e) {}
            if (have && have.first < at) {
              try { localStorage.removeItem(key(id)); localStorage.removeItem("jj-learn:" + id); } catch (e) {}
              dirty[id] = 1; keep();   // upload the empty copy so the Sheet matches
              setTimeout(function () { push(false); }, 0);
              if (JJ.user && JJ.user.id === id) JJ.reloadLearn();
            }
          });
          remote = byId; lastPull = Date.now(); status = "ok";
          try { localStorage.setItem("jj-remote-stats", JSON.stringify(remote)); } catch (e) {}
        })
        .catch(function () { status = "offline"; })
        .then(function () { pulling = null; });
      return pulling;
    }
    function body(ids) {
      var accts = JJ.config().accounts;
      return JSON.stringify({ key: CFG.key, action: "push", rows: ids.map(function (id) {
        var s = load(id), t = totals(s), a = accts.find(function (x) { return x.id === id; });
        s.learnedHere = learnedCount(id);
        var names = namesFor(combined(id));   // also covers items practiced on this person's other devices
        return { id: id, name: a ? a.name : id, level: a ? a.level : "", device: device, stats: s, names: names,
                 summary: { minutes: Math.round(s.time.total / 60), right: t.pct(t.right), wrong: t.pct(t.wrong), orders: s.practice.orders } };
      }) });
    }
    // Keeping uploads small: dirty[id] is "a" after an answer (sent within 2 minutes) or
    // "t" when only the active time moved (sent when the page is hidden or closed, or with
    // the next answer). A fingerprint of what was last sent stops identical re-sends,
    // e.g. after a refresh with nothing new.
    var sent = {};
    try { sent = JSON.parse(localStorage.getItem("jj-sync-sent")) || {}; } catch (e) {}
    // item name, type and display case as this version of the website has them
    function namesFor(s) {
      var names = {};
      Object.keys(s.items || {}).forEach(function (k) {
        if (JJ.items[k]) { var sec = JJ.itemSection(k); names[k] = [JJ.items[k].full, sec.type, sec["case"]]; }
      });
      return names;
    }
    // includes the names, so a website update that renames or moves items re-sends them
    function fingerprint(id) {
      var t = "", h = 5381;
      try { t = localStorage.getItem(key(id)) || ""; } catch (e) {}
      try { t += JSON.stringify(namesFor(combined(id))); } catch (e) {}
      for (var i = 0; i < t.length; i++) h = (h * 33 + t.charCodeAt(i)) | 0;
      return t.length + ":" + h;
    }
    // send people changed on this device; text/plain avoids a CORS preflight
    function push(beacon, withTime) {
      var ids = Object.keys(dirty).filter(function (id) { return withTime || dirty[id] === "a"; })
        .filter(function (id) { return sent[id] !== fingerprint(id); });
      Object.keys(dirty).forEach(function (id) { if (withTime || dirty[id] === "a") delete dirty[id]; });
      keep();
      if (!on || !ids.length) return Promise.resolve();
      var data = body(ids);
      ids.forEach(function (id) { sent[id] = fingerprint(id); });
      try { localStorage.setItem("jj-sync-sent", JSON.stringify(sent)); } catch (e) {}
      if (beacon && navigator.sendBeacon) { navigator.sendBeacon(CFG.url, new Blob([data], { type: "text/plain" })); return Promise.resolve(); }
      return fetch(CFG.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: data })
        .then(function () { status = "ok"; })
        .catch(function () { ids.forEach(function (id) { dirty[id] = "a"; delete sent[id]; }); keep(); status = "offline"; });
    }
    setInterval(function () { push(false, false); }, 2 * 60000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") push(true, true); });
    window.addEventListener("pagehide", function () { push(true, true); });
    // every page load (and refresh) sends everything this device has, so the Sheet is current
    function pushAll() {
      if (!on) return Promise.resolve();
      try { Object.keys(localStorage).forEach(function (k) { var m = /^jj-ustats:(.+)$/.exec(k); if (m && !dirty[m[1]]) dirty[m[1]] = "t"; }); } catch (e) {}
      keep();
      return push(false, true);   // only what changed since the last send
    }
    setTimeout(pushAll, 1500);

    return {
      on: on, device: device,
      status: function () { return !on ? "off" : status || "waiting"; },
      changed: function (id) { dirty[id] = "a"; keep(); },
      timeMoved: function (id) { if (!dirty[id]) { dirty[id] = "t"; keep(); } },
      pull: pull, push: push, pushAll: pushAll,
      others: function (id) { return (remote[id] || []).filter(function (r) { return r.device !== device && r.device !== "reset"; }); },
      ids: function () { return Object.keys(remote).filter(function (id) { return remote[id].some(function (r) { return r.device !== "reset"; }); }); },
      nameOf: function (id) { var r = remote[id]; return r && r[0] && r[0].name; },
      reset: function (id) {
        delete remote[id];
        if (!on) return;
        fetch(CFG.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: CFG.key, action: "reset", id: id, resetAt: Date.now(), name: (accountById(id) || {}).name || id }) }).catch(function () {});
      },
    };
  })();

  // Add stats together: counts are summed, "first" is the earliest, "last" and streaks the best.
  function addStats(a, b) {
    var out = JSON.parse(JSON.stringify(a));
    (function walk(x, y, path) {
      Object.keys(y).forEach(function (k) {
        var v = y[k];
        if (v && typeof v === "object") { if (!x[k] || typeof x[k] !== "object") x[k] = {}; walk(x[k], v, k); }
        else if (typeof v === "number") {
          if (k === "first") x[k] = x[k] ? Math.min(x[k], v) : v;
          else if (k === "last" || k === "best" || k === "streak" || k === "learnedHere") x[k] = Math.max(x[k] || 0, v);
          else x[k] = (x[k] || 0) + v;
        }
      });
    })(out, b);
    return out;
  }
  // everything known for one person: this device plus every other device's row
  function combined(id) {
    var s = load(id);
    s.learnedHere = learnedCount(id);
    sync.others(id).forEach(function (r) { s = addStats(s, r.stats); });
    var b = blank(); for (var k in b) if (s[k] === undefined) s[k] = b[k];
    return s;
  }

  // ------------------------------------------------------------------
  //  Totals for display
  // ------------------------------------------------------------------
  function totals(s) {
    var p = s.practice, dr = s.drill, f = s.flash;
    // Every answer lands in one of three groups:
    //   right  - a perfect order, a clean Find it, a known flashcard
    //   helped - correct, but only after a hint
    //   wrong  - wrong check / wrong card / gave up, wrong taps or skip, missed card
    var right = p.perfect + dr.clean;
    var helped = p.helped + dr.helped;
    var wrong = p.wrongOrders + dr.wrong + dr.skips;
    var all = right + helped + wrong;
    return { right: right, helped: helped, wrong: wrong, all: all,
             hints: p.hints + (dr.hints || dr.helped),
             pct: function (n) { return all ? Math.round(100 * n / all) + "%" : "–"; } };
  }
  function fmtDur(secs) {
    secs = Math.round(secs || 0);
    var h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60), s = secs % 60;
    return h ? h + "h " + m + "m" : m ? m + "m " + s + "s" : s + "s";
  }
  // horizontal bars: time in each tab, longest first
  var MODE_NAMES = { register: "Register", practice: "Practice", drill: "Find it", flash: "Flashcards", cases: "Cases", photos: "Photos", sheet: "Sheet", stats: "Stats", admin: "Admin" };
  function modeTimeHtml(mt) {
    var list = Object.keys(MODE_NAMES).map(function (k) { return { k: k, v: mt[k] || 0 }; }).filter(function (x) { return x.v; })
      .sort(function (a, b) { return b.v - a.v; });
    var max = list.length ? list[0].v : 1, all = list.reduce(function (a, x) { return a + x.v; }, 0);
    return "<section class='st-card'><h3>Time in each mode</h3>" + (list.length ? "<div class='st-modes'>" + list.map(function (x) {
      return "<div class='st-mode'><span>" + MODE_NAMES[x.k] + "</span><div class='st-mtrack'><div class='st-mfill' style='width:" + (100 * x.v / max).toFixed(1) +
        "%'></div></div><span class='st-mval'>" + fmtDur(x.v) + " · " + Math.round(100 * x.v / all) + "%</span></div>";
    }).join("") + "</div>" : "<p class='muted'>No time recorded yet. It counts while the site is open and being used (stops after 2 minutes with no taps or clicks).</p>") + "</section>";
  }
  function fmtDate(t) { return t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "–"; }
  function pct(a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; }
  function learnedCount(id) {
    try {
      var l = JSON.parse(localStorage.getItem("jj-learn:" + id)) || {};
      var seen = {};
      ["drill"].forEach(function (k) { for (var i in l[k] || {}) if (l[k][i] >= 3) seen[i] = 1; });
      return Object.keys(seen).length;
    } catch (e) { return 0; }
  }

  // ------------------------------------------------------------------
  //  Stats tab
  // ------------------------------------------------------------------
  var state = { mode: null, viewing: null };   // viewing: account id the admin opened

  function accountById(id) { return JJ.config().accounts.find(function (a) { return a.id === id; }); }

  function renderStatsPage() {
    if (!JJ.user) return;
    var id = state.viewing || JJ.user.id, acct = accountById(id) || { name: "Former account", level: "trainee" };
    var s = combined(id), t = totals(s), p = s.practice, dr = s.drill, f = s.flash;
    var mine = id === JJ.user.id;

    var mt = s.time.modes || {};
    var tiles = [
      ["Time on the site", fmtDur(s.time.total), "today " + fmtDur(s.time.days[today()])],
      ["Right answers", t.right, t.pct(t.right) + " of " + t.all + " answers"],
      ["Wrong answers", t.wrong, t.pct(t.wrong) + " of " + t.all + " answers"],
      ["Right with a hint", t.helped, t.pct(t.helped) + " of " + t.all + " answers · " + t.hints + " hint" + (t.hints === 1 ? "" : "s") + " used"],
      ["Practice orders", p.orders, pct(p.perfect, p.orders) + " perfect · avg " + (p.orders - p.gaveUp ? fmtDur(p.time / (p.orders - p.gaveUp)) : "–")],
      ["Items learned", s.learnedHere || 0, "found right 3 times in a row in Find it"],
    ];

    // last 14 days of active time
    var days = [], max = 1;
    for (var i = 13; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var v = s.time.days[today(d)] || 0;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "narrow" }), date: today(d), v: v });
      max = Math.max(max, v);
    }
    var maxMin = Math.max(1, Math.ceil(max / 60));


    var html =
      "<section class='st-card st-head'>" +
        "<div><h2>" + esc(acct.name) + (mine ? "" : " <span class='muted'>(viewing)</span>") + "</h2>" +
        "<div class='muted'>" + esc(LEVELS[acct.level] || "") + " · first used " + fmtDate(s.first) + " · last seen " + fmtDate(s.last) +
        " · " + s.sessions + " sign-in" + (s.sessions === 1 ? "" : "s") + "</div></div>" +
        "<div class='st-actions'>" +
          (mine ? (sync.on ? "" : "<button class='tbtn' id='st-copy'>Copy my stats code</button>") : "<button class='tbtn' id='st-back'>Back to my stats</button>") +
          "<button class='tbtn danger-fill' id='st-reset'>Reset " + (mine ? "my" : "these") + " stats</button>" +
        "</div>" +
        "<div class='st-confirm hidden' id='st-confirm'>Erase " + (mine ? "your" : esc(acct.name) + "'s") + " stats" + (sync.on ? " on every device" : " on this device") + "? This can't be undone. " +
          "<button class='tbtn danger-fill' id='st-yes'>Erase</button> <button class='tbtn' id='st-no'>Keep</button></div>" +
        "<textarea class='st-code hidden' id='st-code' readonly></textarea>" +
      "</section>" +
      "<div class='st-tiles'>" + tiles.map(function (x) {
        return "<div class='st-tile'><div class='st-label'>" + x[0] + "</div><div class='st-num'>" + x[1] + "</div><div class='muted'>" + x[2] + "</div></div>";
      }).join("") + "</div>" +

      "<section class='st-card'><h3>Answers</h3>" +
        "<div class='st-split' role='img' aria-label='Right " + t.pct(t.right) + ", with a hint " + t.pct(t.helped) + ", wrong " + t.pct(t.wrong) + "'>" +
          (t.all ? ["right", "helped", "wrong"].map(function (k) { return t[k] ? "<span class='st-" + k + "' style='flex:" + t[k] + "'></span>" : ""; }).join("") : "<span class='st-empty'></span>") +
        "</div>" +
        "<div class='st-legend'><span><i class='st-right'></i>Right " + t.right + " (" + t.pct(t.right) + ")" + "</span><span><i class='st-helped'></i>With a hint " + t.helped + " (" + t.pct(t.helped) + ")" +
        "</span><span><i class='st-wrong'></i>Wrong " + t.wrong + " (" + t.pct(t.wrong) + ")" + "</span></div>" +
      "</section>" +

      "<section class='st-card'><h3>By mode</h3><div class='st-table-wrap'><table class='st-table'>" +
        "<tr><th></th><th>Done</th><th>Right</th><th>With hint</th><th>Hints used</th><th>Wrong</th><th>Avg time</th><th>Best streak</th><th>Time spent</th></tr>" +
        "<tr><th>Practice orders</th><td>" + p.orders + "</td><td>" + p.perfect + " (" + pct(p.perfect, p.orders) + ")</td><td>" + p.helped + " (" + pct(p.helped, p.orders) + ")</td><td>" + p.hints +
          "</td><td>" + p.wrongOrders + " (" + pct(p.wrongOrders, p.orders) + ")</td><td>" + (p.orders - p.gaveUp ? fmtDur(p.time / (p.orders - p.gaveUp)) : "–") + "</td><td>" + p.best + "</td><td>" + fmtDur(mt.practice) + "</td></tr>" +
        "<tr><th>Find it</th><td>" + (dr.found + dr.skips) + "</td><td>" + dr.clean + " (" + pct(dr.clean, dr.found + dr.skips) + ")</td><td>" + dr.helped + " (" + pct(dr.helped, dr.found + dr.skips) + ")</td><td>" + (dr.hints || dr.helped) +
          "</td><td>" + (dr.wrong + dr.skips) + " (" + pct(dr.wrong + dr.skips, dr.found + dr.skips) + ")</td><td>" + (dr.found ? (dr.time / dr.found).toFixed(1) + "s" : "–") + "</td><td>" + dr.best + "</td><td>" + fmtDur(mt.drill) + "</td></tr>" +
      "</table></div>" +
      "<p class='muted st-small'>Practice: " + p.items + " items rung up · " + p.wrongChecks + " wrong order checks · " + p.wrongCard + " wrong card types · " +
        p.gaveUp + " gave up · " + p.hints + " \"Where is it?\" hints. Find it: " + dr.wrongTaps + " wrong taps · " + dr.skips + " skipped.</p></section>" +

      modeTimeHtml(mt) +
      "<section class='st-card'><h3>Active time, last 14 days <span class='muted'>(minutes)</span></h3>" +
        "<div class='st-bars'>" +
        days.map(function (d) {
          var mins = d.v / 60, lbl = mins >= 10 || !mins ? Math.round(mins) : mins.toFixed(1).replace(/.0$/, '');
          return "<div class='st-bar' title='" + d.date + ": " + fmtDur(d.v) + "'><b class='st-val" + (d.v ? "" : " zero") + "'>" + lbl + "</b><div class='st-fill' style='height:" + (100 * d.v / (maxMin * 60)).toFixed(1) + "%'></div><span>" + d.label + "</span></div>";
        }).join("") + "</div></section>" +

      "<section class='st-card'><div class='it-head'><h3>Items</h3>" +
        "<label class='mode-slider it-switch' title='Top 10: the items missed most. Everything: every item practiced so far.'>" +
          "<span class='ms-off'>Top 10 missed</span><input type='checkbox' id='it-all' role='switch' aria-label='Show every item'" + (itemView.all ? " checked" : "") + ">" +
          "<span class='ms-track'><span class='ms-knob'></span></span><span class='ms-on'>Everything</span></label>" +
        "<label class='ad-row'>Group by <select id='it-group'><option value='type'>Item type</option><option value='case'" + (itemView.group === "case" ? " selected" : "") + ">Display case</option></select></label>" +
        "</div><div id='it-body'></div></section>";

    $("stats-page").innerHTML = html;
    var drawItems = function () { $("it-body").innerHTML = itemsHtml(s); };
    $("it-all").onchange = function () { itemView.all = this.checked; saveItemView(); drawItems(); };
    $("it-group").onchange = function () { itemView.group = this.value; saveItemView(); drawItems(); };
    drawItems();
    if (mine && $("st-copy")) $("st-copy").onclick = function () {
      var box = $("st-code");
      box.value = "JJSTATS1:" + btoa(unescape(encodeURIComponent(JSON.stringify({ id: id, name: acct.name, stats: s }))));
      box.classList.remove("hidden");
      box.select();
      var done = function () { JJ.toast("Stats code copied. Send it to the admin."); };
      try { navigator.clipboard.writeText(box.value).then(done, function () { JJ.toast("Select the code and copy it"); }); } catch (e) { JJ.toast("Select the code and copy it"); }
    };
    else if (!mine) $("st-back").onclick = function () { state.viewing = null; renderStatsPage(); };
    $("st-reset").onclick = function () { $("st-confirm").classList.remove("hidden"); };
    $("st-no").onclick = function () { $("st-confirm").classList.add("hidden"); };
    $("st-yes").onclick = function () {
      try { localStorage.removeItem(key(id)); localStorage.removeItem("jj-learn:" + id); } catch (e) {}
      sync.reset(id);
      if (mine) JJ.reloadLearn();
      renderStatsPage();
    };
  }

  // ---- Items table ----
  // Each item's Right / With hint / Skipped / Wrong, in sections by register
  // folder ("item type") or display case. "Top 10 missed" ranks by wrong and
  // skipped (counted double) plus hints.
  var itemView = { all: false, group: "type" };
  try { var iv = JSON.parse(localStorage.getItem("jj-items-view")); if (iv) itemView = iv; } catch (e) {}
  function saveItemView() { try { localStorage.setItem("jj-items-view", JSON.stringify(itemView)); } catch (e) {} }

  var ORDER = null, CASE_OF = null;
  function itemOrder(id) {
    if (!ORDER) { ORDER = {}; Object.keys(JJ.items).forEach(function (k, i) { ORDER[k] = i; }); }
    return ORDER[id] == null ? 1e9 : ORDER[id];
  }
  function typeOf(id) {
    var it = JJ.items[id];
    return it ? it.path.map(function (f) { return f.name; }).join(" › ") || "Top Menu" : "Other";
  }
  function caseOf(id) {
    if (!CASE_OF) {
      CASE_OF = {};
      (window.DISPLAY_CASES || []).forEach(function (c) { c.rows.forEach(function (r) { r.items.forEach(function (x) { CASE_OF[x] = c.name; }); }); });
    }
    return CASE_OF[id] || "Not in a case";
  }
  JJ.itemSection = function (id) { return { type: typeOf(id), "case": caseOf(id) }; };
  function missScore(c) { return (c.w || 0) * 2 + (c.s || 0) * 2 + (c.h || 0); }

  function itemsHtml(s) {
    var rows = Object.keys(s.items).filter(function (id) { return JJ.items[id]; }).map(function (id) {
      var c = s.items[id];
      return { id: id, r: c.r || 0, h: c.h || 0, s: c.s || 0, w: c.w || 0, p: c.p || 0, f: c.f || 0 };
    }).filter(function (x) { return x.r + x.h + x.s + x.w > 0; });
    if (!itemView.all) {
      rows = rows.filter(function (x) { return missScore(x) > 0; })
        .sort(function (a, b) { return missScore(b) - missScore(a); }).slice(0, 10);
      if (!rows.length) return "<p class='muted'>Nothing missed yet. Items you get wrong, skip or need a hint for show up here. Switch to <b>Everything</b> to see every item you've practiced.</p>";
    } else if (!rows.length) return "<p class='muted'>No items practiced yet.</p>";
    var groupOf = itemView.group === "case" ? caseOf : typeOf;
    var groups = {}, names = [];
    rows.forEach(function (x) { var g = groupOf(x.id); if (!groups[g]) { groups[g] = []; names.push(g); } groups[g].push(x); });
    // sections in register / case order; inside, most missed first (Top 10) or register order (Everything)
    var caseIndex = {}; (window.DISPLAY_CASES || []).forEach(function (c, i) { caseIndex[c.name] = i; });
    names.sort(function (a, b) {
      if (itemView.group === "case") return (caseIndex[a] == null ? 99 : caseIndex[a]) - (caseIndex[b] == null ? 99 : caseIndex[b]);
      return itemOrder(groups[a][0].id) - itemOrder(groups[b][0].id);
    });
    return "<div class='st-table-wrap'><table class='st-table it-table'><tr><th>Item</th><th>Right</th><th>With hint</th><th>Skipped</th><th>Wrong</th><th>In Practice</th><th>In Find it</th></tr>" +
      names.map(function (g) {
        var list = groups[g].sort(itemView.all
          ? function (a, b) { return itemOrder(a.id) - itemOrder(b.id); }
          : function (a, b) { return missScore(b) - missScore(a); });
        return "<tr class='it-sec'><th colspan='7'>" + esc(g) + " <span class='muted'>(" + list.length + ")</span></th></tr>" +
          list.map(function (x) {
            return "<tr><td>" + esc(JJ.items[x.id].full) + "</td><td class='it-r'>" + x.r + "</td><td class='it-h'>" + x.h +
              "</td><td class='it-s'>" + x.s + "</td><td class='it-w'>" + x.w + "</td><td>" + x.p + "×</td><td>" + x.f + "×</td></tr>";
          }).join("");
      }).join("") + "</table></div>";
  }

  // ------------------------------------------------------------------
  //  Admin tab
  // ------------------------------------------------------------------
  var draft = null, dirty = false, server = false;

  function cloneConfig() { return JSON.parse(JSON.stringify(JJ.config())); }
  function setDirty(v) { dirty = v; renderAdmin(); }

  function renderAdmin() {
    if (!JJ.user || JJ.user.level !== "admin") return;
    if (!draft) draft = cloneConfig();
    var accts = draft.accounts;
    var html =
      "<section class='st-card'><div class='ad-head'><h2>Accounts</h2>" +
        "<div class='ad-save'>" +
          (dirty ? "<span class='ad-dirty'>Unsaved changes</span>" : "<span class='muted'>All changes saved</span>") +
          (dirty ? " <button class='tbtn' id='ad-discard'>Discard</button>" : "") +
          " <button class='tbtn primary' id='ad-publish'" + (dirty ? "" : " disabled") + ">" + (server ? "Save and publish" : "Save on this device") + "</button>" +
        "</div></div>" +
        "<p class='muted st-small'>" + (server
          ? "Running through the local app: <b>Save and publish</b> updates the website for everyone (GitHub Pages refreshes in about a minute)."
          : "Changes saved here work on <b>this device</b> right away. To make them work everywhere, open the site with start.bat and press Save and publish, or ask Claude to publish them.") + "</p>" +
        "<div class='st-table-wrap'><table class='st-table ad-table'><tr><th>Name</th><th>Level</th><th>Code</th><th>Active</th><th>Stats here</th><th></th></tr>" +
        accts.map(function (a, i) {
          var s = combined(a.id), t = totals(s);
          return "<tr data-i='" + i + "'>" +
            "<td><input class='ad-name' value='" + esc(a.name) + "' aria-label='Name'></td>" +
            "<td>" + (a.owner ? "Admin (owner)" : "<select class='ad-level' aria-label='Level'>" +
              Object.keys(LEVELS).map(function (l) { return "<option value='" + l + "'" + (l === a.level ? " selected" : "") + ">" + LEVELS[l] + "</option>"; }).join("") + "</select>") + "</td>" +
            "<td>" + (a.owner ? "<span class='muted'>↑↑↓↓←→←→</span>" : "<button class='tbtn ad-code'>Set new code</button>") + "</td>" +
            "<td>" + (a.owner ? "✓" : "<input type='checkbox' class='ad-active'" + (a.active ? " checked" : "") + " aria-label='Active'>") + "</td>" +
            "<td><button class='linkish ad-view'>" + fmtDur(s.time.total) + " · " + t.pct(t.right) + " right</button></td>" +
            "<td>" + (a.owner ? "" : "<button class='tbtn danger-fill ad-del'>Remove</button>") + "</td></tr>";
        }).join("") + "</table></div>" +
        "<div class='ad-levels muted st-small'>" + Object.keys(LEVELS).map(function (l) { return "<b>" + LEVELS[l] + ":</b> " + LEVEL_NOTE[l]; }).join(" &nbsp;·&nbsp; ") + "</div>" +
        "<div class='ad-add'><input id='ad-new-name' placeholder='New person’s name' aria-label='New person name'>" +
          "<select id='ad-new-level' aria-label='Level'>" + Object.keys(LEVELS).map(function (l) { return "<option value='" + l + "'" + (l === "trainee" ? " selected" : "") + ">" + LEVELS[l] + "</option>"; }).join("") + "</select>" +
          "<button class='tbtn primary' id='ad-add'>Add person and pick their code</button></div>" +
      "</section>" +

      "<section class='st-card'><h2>Settings</h2>" +
        "<label class='ad-row'>Lock after <select id='ad-idle'>" + [1, 2, 3, 5, 10, 15, 30].map(function (m) {
          return "<option value='" + m + "'" + (m === +(draft.settings.idleMinutes || 5) ? " selected" : "") + ">" + m + " minute" + (m > 1 ? "s" : "") + "</option>";
        }).join("") + "</select> without use (also asks on every page load)</label>" +
      "</section>" +

      "<section class='st-card'><h2>Everyone's stats" + (sync.on ? "" : " on this device") + "</h2>" +
        "<p class='muted st-small'>" + (sync.on
          ? "Synced with the Google Sheet: every device's numbers are added together (" + ({ ok: "up to date", offline: "can't reach the Sheet right now; showing the last copy", waiting: "connecting…" })[sync.status()] + ")."
          : "Sync is off, so this only shows stats made on this device.") + "</p>" + statsTable() +
        (sync.on ? "" : "<h3>Add stats from another device</h3><p class='muted st-small'>On their device, the person opens <b>Stats</b>, presses <b>Copy my stats code</b> and sends it to you. Paste it here; it replaces the stats this device has for them.</p>" +
        "<div class='ad-add'><textarea id='ad-import' placeholder='Paste a stats code (starts with JJSTATS1:)'></textarea><button class='tbtn primary' id='ad-import-btn'>Add stats</button></div>") +
      "</section>" +

      "<section class='st-card'><h2>This device</h2>" +
        "<p class='muted st-small'>Removes every person's stats and learning progress saved in this browser" + (sync.on ? " (and this device's share in the Google Sheet)" : "") + ". Accounts are not affected.</p>" +
        "<button class='tbtn danger-fill' id='ad-wipe'>Clear all stats on this device</button>" +
        "<span class='st-confirm hidden' id='ad-wipe-confirm'> Really clear everything? <button class='tbtn danger-fill' id='ad-wipe-yes'>Clear</button> <button class='tbtn' id='ad-wipe-no'>Cancel</button></span>" +
      "</section>";
    $("admin-page").innerHTML = html;

    var rows = $("admin-page").querySelectorAll(".ad-table tr[data-i]");
    rows.forEach(function (tr) {
      var a = accts[+tr.dataset.i];
      tr.querySelector(".ad-name").onchange = function () { a.name = this.value.trim() || a.name; setDirty(true); };
      var lv = tr.querySelector(".ad-level"); if (lv) lv.onchange = function () { a.level = this.value; setDirty(true); };
      var ac = tr.querySelector(".ad-active"); if (ac) ac.onchange = function () { a.active = this.checked; setDirty(true); };
      var cd = tr.querySelector(".ad-code"); if (cd) cd.onclick = function () { pickCode(a.name, a.hash, function (h) { a.hash = h; setDirty(true); }); };
      var dl = tr.querySelector(".ad-del"); if (dl) dl.onclick = function () {
        if (dl.dataset.sure) { accts.splice(accts.indexOf(a), 1); setDirty(true); }
        else { dl.dataset.sure = 1; dl.textContent = "Tap again to remove"; }
      };
      tr.querySelector(".ad-view").onclick = function () { state.viewing = a.id; JJ.setMode("stats"); };
    });
    $("ad-add").onclick = function () {
      var name = $("ad-new-name").value.trim(), level = $("ad-new-level").value;
      if (!name) { JJ.toast("Type their name first"); $("ad-new-name").focus(); return; }
      pickCode(name, null, function (h) {
        var id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "person";
        while (accts.some(function (x) { return x.id === id; })) id += "-" + Math.floor(Math.random() * 90 + 10);
        accts.push({ id: id, name: name, level: level, hash: h, active: true });
        setDirty(true);
      });
    };
    $("ad-idle").onchange = function () { draft.settings.idleMinutes = +this.value; setDirty(true); };
    $("ad-publish").onclick = saveAccounts;
    if ($("ad-discard")) $("ad-discard").onclick = function () { draft = cloneConfig(); setDirty(false); };
    if ($("ad-import-btn")) $("ad-import-btn").onclick = importStats;
    $("ad-wipe").onclick = function () { $("ad-wipe-confirm").classList.remove("hidden"); };
    $("ad-wipe-no").onclick = function () { $("ad-wipe-confirm").classList.add("hidden"); };
    $("ad-wipe-yes").onclick = function () {
      try {
        Object.keys(localStorage).filter(function (k) { return /^jj-(ustats|learn)[:]/.test(k) || k === "jj-learn" || k === "jj-stats"; })
          .forEach(function (k) { var m = /^jj-ustats:(.+)$/.exec(k); if (m) sync.changed(m[1]); localStorage.removeItem(k); });
      } catch (e) {}
      sync.push(false);
      JJ.reloadLearn();
      JJ.toast("All stats on this device cleared");
      renderAdmin();
    };
    $("admin-page").querySelectorAll(".st-view-row").forEach(function (b) {
      b.onclick = function () { state.viewing = b.dataset.id; JJ.setMode("stats"); };
    });
  }

  function statsTable() {
    var ids = {};
    JJ.config().accounts.forEach(function (a) { ids[a.id] = a.name; });
    try { Object.keys(localStorage).forEach(function (k) { var m = /^jj-ustats:(.+)$/.exec(k); if (m && !ids[m[1]]) ids[m[1]] = "Removed account (" + m[1] + ")"; }); } catch (e) {}
    sync.ids().forEach(function (id) { if (!ids[id]) ids[id] = "Removed account (" + (sync.nameOf(id) || id) + ")"; });
    var rows = Object.keys(ids).map(function (id) {
      var s = combined(id), t = totals(s);
      return "<tr><th><button class='linkish st-view-row' data-id='" + esc(id) + "'>" + esc(ids[id]) + "</button></th><td>" + fmtDur(s.time.total) +
        "</td><td>" + s.practice.orders + "</td><td>" + t.right + " (" + t.pct(t.right) + ")</td><td>" + t.helped + " (" + t.pct(t.helped) + ")</td><td>" + t.wrong + " (" + t.pct(t.wrong) + ")" +
        "</td><td>" + t.hints + "</td><td>" + (s.learnedHere || 0) + "</td><td>" + (s.sessions ? fmtDate(s.last) : "–") + "</td></tr>";
    });
    return "<div class='st-table-wrap'><table class='st-table'><tr><th>Person</th><th>Time</th><th>Orders</th><th>Right</th><th>Right w/ hint</th><th>Wrong</th><th>Hints used</th><th>Learned</th><th>Last seen</th></tr>" +
      rows.join("") + "</table></div>";
  }

  function importStats() {
    var txt = $("ad-import").value.trim();
    try {
      if (txt.indexOf("JJSTATS1:") !== 0) throw 0;
      var data = JSON.parse(decodeURIComponent(escape(atob(txt.slice(9)))));
      if (!data.id || !data.stats) throw 0;
      save(data.id, data.stats);
      $("ad-import").value = "";
      JJ.toast("Added stats for " + (data.name || data.id));
      renderAdmin();
    } catch (e) { JJ.toast("That doesn't look like a stats code"); }
  }

  // Arrow-pad popup to choose a code. Calls done(hash) once a new, unused code is entered twice.
  function pickCode(name, oldHash, done) {
    var first = null, entered = [];
    var ov = $("code-overlay");
    function draw(msg) {
      $("code-title").textContent = "Code for " + name;
      $("code-msg").textContent = msg || (first ? "Enter the same 8 arrows again to confirm." : "Enter 8 arrows for their new code.");
      $("code-dots").innerHTML = Array.from({ length: 8 }, function (_, i) { return "<span" + (i < entered.length ? " class='on'" : "") + "></span>"; }).join("");
    }
    function press(d) {
      if (entered.length >= 8) return;
      entered.push(d);
      draw();
      if (entered.length < 8) return;
      var h = JJ.codeHash(entered);
      entered = [];
      if (!first) {
        var taken = draft.accounts.some(function (a) { return a.hash === h && a.hash !== oldHash; });
        if (taken) { draw("Someone already uses that code. Try a different one."); return; }
        first = h; draw();
      } else if (h !== first) { first = null; draw("The two didn't match. Start again."); }
      else { close(); done(h); JJ.toast("Code set for " + name + ". Remember to save."); }
    }
    function key(e) {
      var map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      if (map[e.key]) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(map[e.key]); }
      else if (e.key === "Escape") close();
    }
    function close() { ov.classList.add("hidden"); document.removeEventListener("keydown", key, true); }
    ov.querySelectorAll("[data-dir]").forEach(function (b) { b.onclick = function () { press(b.dataset.dir); }; });
    $("code-clear").onclick = function () { entered = []; first = null; draw(); };
    $("code-cancel").onclick = close;
    document.addEventListener("keydown", key, true);
    ov.classList.remove("hidden");
    draw();
  }

  function saveAccounts() {
    draft.rev = Math.max(draft.rev || 0, (window.JJ_ACCOUNTS || {}).rev || 0) + 1;
    var done = function (msg) { setDirty(false); JJ.toast(msg); };
    if (!server) {
      try { localStorage.setItem("jj-accounts-draft", JSON.stringify(draft)); } catch (e) {}
      return done("Saved on this device");
    }
    $("ad-publish").disabled = true;
    $("ad-publish").textContent = "Publishing…";
    fetch("/api/save-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (r.ok) { window.JJ_ACCOUNTS = JSON.parse(JSON.stringify(draft)); try { localStorage.removeItem("jj-accounts-draft"); } catch (e) {} }
        else try { localStorage.setItem("jj-accounts-draft", JSON.stringify(draft)); } catch (e) {}
        done(r.message);
      })
      .catch(function () { try { localStorage.setItem("jj-accounts-draft", JSON.stringify(draft)); } catch (e) {} done("Couldn't reach the local app. Saved on this device."); });
  }

  // ------------------------------------------------------------------
  //  Wiring
  // ------------------------------------------------------------------
  fetch("api/status").then(function (r) { return r.json(); }).then(function (r) { server = !!r.server; }).catch(function () {});

  // Tabs each level may use
  function applyLevel() {
    var lv = JJ.user ? JJ.user.level : "trainee";
    document.body.classList.toggle("is-admin", lv === "admin");
    document.body.classList.toggle("no-photos", lv === "trainee");
    $("whoami").textContent = JJ.user ? JJ.user.name : "";
  }
  document.addEventListener("jj-login", function (e) {
    var u = e.detail.user;
    update(function (s) { s.sessions++; });
    sync.pushAll().then(function () { return sync.pull(true); });
    applyLevel();
    if (e.detail.changed) {
      state.viewing = null; draft = null; dirty = false;
      JJ.reloadLearn();
      var m = JJ.mode();
      if ((m === "admin" && u.level !== "admin") || (m === "photos" && u.level === "trainee")) JJ.setMode("register");
      else if (m === "stats" || m === "admin") JJ.setMode(m);
    }
  });
  $("signout").onclick = function () { JJ.lockNow(); };

  JJ.onMode = function (mode) {
    state.mode = mode;
    if (mode === "stats") renderStatsPage();
    if (mode === "admin") renderAdmin();
    if (mode === "stats" || mode === "admin") sync.push(false, true).then(function () { return sync.pull(true); }).then(function () {
      if (state.mode === "stats") renderStatsPage();
      if (state.mode === "admin") renderAdmin();
    });
    if (mode !== "stats") state.viewing = null;
  };
})();
