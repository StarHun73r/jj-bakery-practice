// Shared notes (Notes tab). Everyone can read them; only an Admin can edit.
// They're kept in the Google Sheet's "Notes" tab (see tools/google-sheet-sync.gs),
// so a save shows up for every account on every device. Without sync, the
// notes below are what everyone sees, and an admin's edits stay on that device.
// Loaded after stats.js.
window.SITE_NOTES = { text: "", saved: "", by: "" };

(function () {
  var JJ = window.JJ, CFG = window.JJ_SYNC || {};
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  var notes = window.SITE_NOTES, editing = false, saving = false, status = "";

  try {
    var cached = JSON.parse(localStorage.getItem("jj-site-notes"));
    if (cached && (cached.saved || "") >= (notes.saved || "")) notes = cached;
  } catch (e) {}
  function keep() { try { localStorage.setItem("jj-site-notes", JSON.stringify(notes)); } catch (e) {} }

  // stats.js hands over the notes that come back with every Sheet read
  JJ.gotNotes = function (n) {
    if (!n || typeof n.text !== "string") return;
    if ((n.saved || "") < (notes.saved || "")) return;   // never go back to an older copy
    notes = n; keep();
    if (JJ.mode() === "notes" && !editing) render();
  };
  function refresh() {
    if (!CFG.url) return Promise.resolve();
    return fetch(CFG.url + "?key=" + encodeURIComponent(CFG.key))
      .then(function (r) { return r.json(); })
      .then(function (r) { if (r.ok) JJ.gotNotes(r.notes); status = r.notes ? "" : "old-script"; })
      .catch(function () { status = "offline"; });
  }

  // Plain text with a little formatting: "# " heading, "- " bullet, "[ ] " / "[x] " checkbox.
  function format(text) {
    if (!text.trim()) return "<p class='muted'>No notes yet." + (isAdmin() ? " Press <b>Edit</b> to write the first one." : "") + "</p>";
    var out = [], list = null;
    function close() { if (list) { out.push("</ul>"); list = null; } }
    text.split(/\r?\n/).forEach(function (line) {
      var m;
      if ((m = /^#{1,3}\s+(.*)$/.exec(line))) { close(); out.push("<h3>" + esc(m[1]) + "</h3>"); }
      else if ((m = /^\s*(?:[-*]\s+)?\[( |x|X)\]\s+(.*)$/.exec(line))) {
        if (!list) { out.push("<ul class='nt-list'>"); list = 1; }
        out.push("<li class='nt-check" + (m[1] === " " ? "" : " done") + "'><span>" + (m[1] === " " ? "☐" : "☑") + "</span> " + esc(m[2]) + "</li>");
      }
      else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { if (!list) { out.push("<ul class='nt-list'>"); list = 1; } out.push("<li>" + esc(m[1]) + "</li>"); }
      else if (!line.trim()) { close(); out.push("<div class='nt-gap'></div>"); }
      else { close(); out.push("<p>" + esc(line) + "</p>"); }
    });
    close();
    return out.join("");
  }

  // Worked out from the menu every time, so it's always current.
  function missingSummary() {
    var items = Object.keys(JJ.items).map(function (k) { return JJ.items[k]; });
    var photos = window.PHOTO_FILES || {};
    var noPhoto = items.filter(function (it) { return !photos[it.id]; });
    var noPrice = items.filter(function (it) { return !(it.price > 0) && it.practice !== false; });
    var byTop = {};
    noPhoto.forEach(function (it) { var t = it.path[0] ? it.path[0].name : "Top Menu"; byTop[t] = (byTop[t] || 0) + 1; });
    return "<p><b>" + (items.length - noPhoto.length) + " of " + items.length + "</b> items have photos · <b>" + noPhoto.length +
      "</b> still need one · <b>" + noPrice.length + "</b> have no price yet</p>" +
      "<ul class='nt-list'>" + Object.keys(byTop).map(function (t) { return "<li>" + esc(t) + ": " + byTop[t] + " without photos</li>"; }).join("") + "</ul>" +
      "<p class='muted st-small'>The full list is on the <b>Sheet</b> tab: set the filter to <b>Missing photos</b>.</p>";
  }

  function isAdmin() { return JJ.user && JJ.user.level === "admin"; }
  function when(t) { return t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""; }

  function render() {
    var page = $("notes-page");
    if (editing) {
      page.innerHTML = "<section class='st-card'><div class='ad-head'><h2>Notes</h2><div class='ad-save'>" +
        "<button class='tbtn' id='nt-cancel'>Cancel</button> <button class='tbtn primary' id='nt-save'>" + (saving ? "Saving…" : "Save") + "</button></div></div>" +
        "<p class='muted st-small'>Everyone sees this on the Notes tab. Use <b># </b> for a heading, <b>- </b> for a bullet, and <b>[ ] </b> / <b>[x] </b> for a to-do and a done item.</p>" +
        "<textarea id='nt-text' class='nt-text' spellcheck='true'></textarea></section>";
      $("nt-text").value = notes.text;
      $("nt-text").focus();
      $("nt-cancel").onclick = function () { editing = false; render(); };
      $("nt-save").onclick = save;
      return;
    }
    page.innerHTML = "<section class='st-card'><div class='ad-head'><h2>Notes</h2>" +
        (isAdmin() ? "<div class='ad-save'><button class='tbtn primary' id='nt-edit'>Edit</button></div>" : "") + "</div>" +
        (notes.saved ? "<p class='muted st-small'>Last updated " + esc(when(notes.saved)) + (notes.by ? " by " + esc(notes.by) : "") + "</p>" : "") +
        (status === "old-script" && isAdmin() ? "<p class='st-confirm'>The Google Sheet script needs updating before notes can be shared (paste in the new tools/google-sheet-sync.gs).</p>" : "") +
        (status === "offline" ? "<p class='muted st-small'>Can't reach the Google Sheet right now; showing the last copy.</p>" : "") +
        "<div class='nt-body'>" + format(notes.text) + "</div></section>" +
      "<section class='st-card'><h3>What's missing (updates by itself)</h3>" + missingSummary() + "</section>";
    if ($("nt-edit")) $("nt-edit").onclick = function () { editing = true; render(); };
  }

  function save() {
    if (saving) return;
    var text = $("nt-text").value, mine = { text: text, saved: new Date().toISOString(), by: JJ.user.name };
    if (!CFG.url) { notes = mine; keep(); editing = false; JJ.toast("Saved on this device (sync is off here)"); return render(); }
    saving = true; render(); $("nt-text").value = text;
    fetch(CFG.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
                     body: JSON.stringify({ key: CFG.key, action: "notes", text: text, by: JJ.user.name }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        saving = false;
        if (r.ok && r.notes && r.notes.text === text) { notes = r.notes; keep(); editing = false; status = ""; JJ.toast("Notes saved for everyone"); }
        else { notes = mine; keep(); editing = false; status = "old-script"; JJ.toast("Saved here only: update the Google script to share notes"); }
        render();
      })
      .catch(function () { saving = false; notes = mine; keep(); editing = false; status = "offline"; JJ.toast("Couldn't reach the Sheet. Saved on this device."); render(); });
  }

  JJ.onNotes = function () { editing = false; render(); refresh().then(function () { if (JJ.mode() === "notes" && !editing) render(); }); };
})();
