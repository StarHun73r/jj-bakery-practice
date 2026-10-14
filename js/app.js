(function () {
  "use strict";

  var CFG = window.MENU_CONFIG;
  var GROUPS = window.MODIFIER_GROUPS;
  var TREE = window.MENU_TREE;

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return "$" + n.toFixed(2); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var rand = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; };

  // Walk the tree: give every node its color and path, index the items.
  var ITEMS = {};
  (function walk(nodes, color, path) {
    nodes.forEach(function (n) {
      n.color = n.color || color;
      n.path = path;
      if (n.type === "folder") walk(n.children, n.color, path.concat(n));
      else {
        n.modifiers = n.modifiers || [];
        n.full = (window.FULL_NAMES || {})[n.id] || n.name;   // name plate name, for the order list
        if (ITEMS[n.id]) console.warn("Duplicate item id in menu-data.js:", n.id);
        ITEMS[n.id] = n;
      }
    });
  })(TREE, "#1d9bd7", []);

  // The register shows pages of 5 columns x 6 rows, each filled row by
  // row; folders with more than 30 buttons get more pages side by side.
  var ROWS = 6, VISIBLE_COLS = 5, PAGE = ROWS * VISIBLE_COLS;

  var state = {
    path: [],            // folders we are inside
    search: null,        // search text when searching
    ticket: [],          // [{itemId, mods:[{group, option}], qty}]
    lineIdx: -1,         // ticket line being edited
    editing: null,       // modifier popup state
    practice: null,
    guide: null,         // item id the yellow highlights are leading to
  };

  // ------------------------------------------------------------------
  //  Ticket helpers
  // ------------------------------------------------------------------
  function modPrice(m) {
    var g = GROUPS[m.group];
    var o = g && g.options.find(function (x) { return x.name === m.option; });
    return o ? o.price : 0;
  }
  function unitPrice(line) {
    return ITEMS[line.itemId].price + line.mods.reduce(function (s, m) { return s + modPrice(m); }, 0);
  }
  function lineKey(line) {
    return line.itemId + "|" + line.mods.map(function (m) { return m.group + ":" + m.option; }).sort().join(",");
  }
  function modText(mods) { return mods.map(function (m) { return m.option; }).join(", "); }
  function totals() {
    // add up in whole cents so the total never drifts by a penny
    var cents = state.ticket.reduce(function (s, l) { return s + Math.round(unitPrice(l) * 100) * l.qty; }, 0);
    var taxCents = Math.round(cents * CFG.taxRate);
    return { sub: cents / 100, tax: taxCents / 100, total: (cents + taxCents) / 100 };
  }
  function addLine(itemId, mods) {
    var line = { itemId: itemId, mods: mods, qty: 1 };
    var key = lineKey(line);
    var found = state.ticket.find(function (l) { return lineKey(l) === key; });
    if (found) found.qty++; else state.ticket.push(line);
    if (state.guide === itemId) {
      state.guide = null;   // found it — stop guiding
      renderMenu();
      if (state.practice) renderCustomer();
    }
    renderTicket();
  }
  function mergeDuplicates() {
    var out = [];
    state.ticket.forEach(function (l) {
      var same = out.find(function (o) { return lineKey(o) === lineKey(l); });
      if (same) same.qty += l.qty; else out.push(l);
    });
    state.ticket = out;
  }

  // ------------------------------------------------------------------
  //  Menu grid + breadcrumbs
  // ------------------------------------------------------------------
  function currentNodes() {
    if (state.search !== null) {
      var q = state.search.trim().toLowerCase();
      if (!q) return [];
      return Object.keys(ITEMS).map(function (k) { return ITEMS[k]; })
        .filter(function (it) { return (it.name + " " + it.full).toLowerCase().indexOf(q) >= 0; });
    }
    return state.path.length ? state.path[state.path.length - 1].children : TREE;
  }

  function renderGrid() {
    var grid = $("grid");
    grid.innerHTML = "";
    grid.scrollLeft = 0;
    var nodes = currentNodes();
    grid.style.setProperty("--cols", VISIBLE_COLS * Math.max(1, Math.ceil(nodes.length / PAGE)));
    var guide = guideStep().next, guidePage = 0;
    nodes.forEach(function (n, i) {
      var b = document.createElement("button");
      var page = Math.floor(i / PAGE), slot = i % PAGE;
      b.className = "btn";
      b.style.gridRow = Math.floor(slot / VISIBLE_COLS) + 1;
      b.style.gridColumn = page * VISIBLE_COLS + slot % VISIBLE_COLS + 1;
      b.style.background = n.color;
      b.innerHTML = "<span></span>";
      b.firstChild.textContent = n.name;
      b.title = n.name;
      if (n.type === "item" && PHOTOS[n.id]) b.classList.add("has-photo");
      b.onclick = function () {
        if (n.type === "folder") { state.path = state.path.concat(n); renderMenu(); }
        else if (state.mode === "drill") drillTap(n, b);
        else tapItem(n);
      };
      if (n === guide) { b.classList.add("guide"); guidePage = page; }
      grid.appendChild(b);
    });
    grid.scrollLeft = guidePage * (grid.clientWidth + 9); // show the page the hint is on
  }

  // Hint: which button should be tapped next to reach the item being
  // guided to. If we're off the path, point at the breadcrumb to go back to.
  function guideStep() {
    var id = state.guide;
    if (!id) return {};
    var target = ITEMS[id];
    if (state.search !== null) return { next: target };
    var k = 0;
    while (k < state.path.length && k < target.path.length && state.path[k] === target.path[k]) k++;
    if (k < state.path.length) return { crumb: k };   // wrong folder: go back up to crumb k
    return { next: k < target.path.length ? target.path[k] : target };
  }

  function renderCrumbs() {
    var c = $("crumbs");
    c.innerHTML = "";
    if (!state.path.length) return;
    var guideCrumb = guideStep().crumb;
    var top = document.createElement("a");
    top.textContent = "Top Menu";
    top.onclick = function () { state.path = []; renderMenu(); };
    if (guideCrumb === 0) top.className = "guide";
    c.appendChild(top);
    state.path.forEach(function (f, i) {
      c.insertAdjacentHTML("beforeend", "<span class='sep'>/</span>");
      var a = document.createElement("a");
      a.textContent = f.name;
      a.onclick = function () { state.path = state.path.slice(0, i + 1); renderMenu(); };
      if (guideCrumb === i + 1) a.className = "guide";
      c.appendChild(a);
    });
  }

  function renderMenu() { renderCrumbs(); renderGrid(); }

  // Fit 5 columns across and 6 rows down, like the iPad.
  // Sizes come from the menu column's width and the room left in the
  // window, never from the grid itself: measuring the grid made a feedback
  // loop (scrollbar appears -> buttons shrink -> scrollbar goes -> buttons
  // grow -> ...), which showed up as the menu jittering.
  // Keep the iPad screen iPad-shaped (about 1.44 : 1, like the store's iPad) and
  // scale it to the space left beside or above the practice order card, so it
  // never looks stretched on wide screens like a MacBook. Phones (<= 900px wide)
  // keep the stacked layout.
  var IPAD_RATIO = 4 / 3;   // the store's iPad screen is 4:3 (measured from the register photo)
  function fitIpad() {
    var ipad = document.querySelector(".ipad"), stage = ipad.parentNode;
    var fit = window.innerWidth > 900;
    document.body.classList.toggle("fit", fit);
    if (!fit) { ipad.style.width = ipad.style.height = ""; return; }
    var cs = getComputedStyle(stage), gap = 12;
    var w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var side = [].filter.call(stage.children, function (el) { return el !== ipad && getComputedStyle(el).display !== "none"; })[0];
    if (side) {
      if (document.body.classList.contains("cust-bottom") && side.classList.contains("customer")) h -= Math.min(side.scrollHeight, h * 0.42) + gap;
      else w -= side.offsetWidth + gap;
    }
    var width = Math.min(w, h * IPAD_RATIO), height = width / IPAD_RATIO;
    ipad.style.width = Math.floor(width) + "px";
    ipad.style.height = Math.floor(height) + "px";
  }
  window.addEventListener("resize", function () { fitIpad(); sizeButtons(); });

  var lastSize = "";
  function sizeButtons() {
    // Buttons are square on the real register, with gaps ~7.5% of a button.
    var grid = $("grid"), menu = grid.parentNode;
    var cs = getComputedStyle(menu);
    var width = menu.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var gap = Math.max(5, Math.round(width / 70));
    var bw = Math.floor((width - gap * (VISIBLE_COLS - 1)) / VISIBLE_COLS);
    if (window.innerWidth > 700) {   // phones scroll, so they size by width only
      // keep all 6 rows on screen: shrink (still square) if the height is short
      var bottom = Math.min(window.innerHeight, document.querySelector(".ipad").getBoundingClientRect().bottom);
      var room = bottom - grid.getBoundingClientRect().top - 14 - 20; // 20 = sideways scrollbar
      bw = Math.min(bw, Math.floor((room - gap * (ROWS - 1)) / ROWS));
    }
    var bh = bw;
    var size = bw + "/" + gap;
    if (size === lastSize || bw <= 0) return;   // nothing changed: leave the page alone
    lastSize = size;
    grid.style.setProperty("--bw", bw + "px");
    grid.style.setProperty("--bh", bh + "px");
    grid.style.setProperty("--gap", gap + "px");
  }
  new ResizeObserver(function () { requestAnimationFrame(sizeButtons); }).observe($("grid").parentNode);
  window.addEventListener("resize", sizeButtons);

  // Mouse wheel scrolls sideways through wide folders (touch can just swipe).
  $("grid").addEventListener("wheel", function (e) {
    var g = this;
    if (g.scrollWidth > g.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      g.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  function openSearch() {
    state.search = "";
    $("crumbs").classList.add("hidden");
    $("search").classList.remove("hidden");
    $("search-input").value = "";
    $("search-input").focus();
    renderGrid();
  }
  function closeSearch() {
    state.search = null;
    $("search").classList.add("hidden");
    $("crumbs").classList.remove("hidden");
    renderMenu();
  }

  // ------------------------------------------------------------------
  //  Ticket (left panel)
  // ------------------------------------------------------------------
  function renderTicket() {
    var box = $("lines");
    box.innerHTML = state.ticket.length ? "" : "<div class='empty'>Select items to add to the order</div>";
    state.ticket.forEach(function (l, i) {
      var it = ITEMS[l.itemId];
      var row = document.createElement("div");
      row.className = "line";
      row.innerHTML = "<span class='q'>" + l.qty + "</span><span>" + esc(it.full) + "</span><span>" +
        money(unitPrice(l) * l.qty) + "</span>" + (l.mods.length ? "<span class='mods'>" + esc(modText(l.mods)) + "</span>" : "");
      row.onclick = function () { openLine(i); };
      box.appendChild(row);
    });
    var t = totals();
    var n = state.ticket.reduce(function (s, l) { return s + l.qty; }, 0);
    $("s-sub").textContent = money(t.sub);
    $("s-tax").textContent = money(t.tax);
    $("s-total").textContent = money(t.total);
    $("s-items").textContent = n;
    $("pay-amt").textContent = money(t.total);
    $("pay-btn").classList.toggle("ready", n > 0);
    $("hold-btn").classList.toggle("ready", n > 0);
    $("send-btn").classList.toggle("ready", n > 0);
  }

  function openLine(i) {
    state.lineIdx = i;
    var l = state.ticket[i];
    $("line-title").textContent = ITEMS[l.itemId].full;
    $("line-qty").textContent = l.qty;
    $("line-mod").classList.toggle("hidden", !ITEMS[l.itemId].modifiers.length);
    $("line-overlay").classList.remove("hidden");
  }
  function closeLine() { $("line-overlay").classList.add("hidden"); renderTicket(); }

  // ------------------------------------------------------------------
  //  Modifier popup (for items with options)
  // ------------------------------------------------------------------
  function tapItem(it) {
    if (state.mode === "photos") return openPhotoEditor(it);
    if (!it.modifiers.length) return addLine(it.id, []);
    openMods(it, null);
  }

  function openMods(it, lineIndex) {
    var chosen = {};
    it.modifiers.forEach(function (g) { chosen[g] = []; });
    if (lineIndex !== null) state.ticket[lineIndex].mods.forEach(function (m) { chosen[m.group].push(m.option); });
    state.editing = { item: it, chosen: chosen, lineIndex: lineIndex };
    $("mod-title").textContent = it.full;
    $("mod-ok").textContent = lineIndex === null ? "Add" : "Update";
    renderMods(false);
    $("mod-overlay").classList.remove("hidden");
  }

  function renderMods(showMissing) {
    var ed = state.editing, box = $("mod-groups");
    box.innerHTML = "";
    ed.item.modifiers.forEach(function (gid) {
      var g = GROUPS[gid];
      var div = document.createElement("div");
      div.className = "mod-group" + (showMissing && g.required && !ed.chosen[gid].length ? " missing" : "");
      div.innerHTML = "<h3>" + esc(g.name) + (g.required ? " (required)" : "") + "</h3><div class='mod-opts'></div>";
      g.options.forEach(function (o) {
        var on = ed.chosen[gid].indexOf(o.name) >= 0;
        var b = document.createElement("button");
        b.className = "mod-opt" + (on ? " on" : "");
        b.textContent = o.name + (o.price ? " +" + money(o.price) : "");
        b.onclick = function () {
          var list = ed.chosen[gid];
          if (g.multi) { if (on) list.splice(list.indexOf(o.name), 1); else list.push(o.name); }
          else ed.chosen[gid] = on && !g.required ? [] : [o.name];
          renderMods(showMissing);
        };
        div.lastChild.appendChild(b);
      });
      box.appendChild(div);
    });
    $("mod-price").textContent = money(unitPrice({ itemId: ed.item.id, mods: chosenMods() }));
  }

  function chosenMods() {
    var ed = state.editing, out = [];
    ed.item.modifiers.forEach(function (gid) {
      ed.chosen[gid].forEach(function (opt) { out.push({ group: gid, option: opt }); });
    });
    return out;
  }

  function confirmMods() {
    var ed = state.editing;
    if (ed.item.modifiers.some(function (g) { return GROUPS[g].required && !ed.chosen[g].length; })) return renderMods(true);
    if (ed.lineIndex === null) addLine(ed.item.id, chosenMods());
    else { state.ticket[ed.lineIndex].mods = chosenMods(); mergeDuplicates(); renderTicket(); }
    closeMods();
  }
  function closeMods() { state.editing = null; $("mod-overlay").classList.add("hidden"); }

  // ------------------------------------------------------------------
  //  Payment
  // ------------------------------------------------------------------
  function openPay() {
    if (!state.ticket.length) return;
    if (state.practice) {
      var res = checkOrder();
      if (!res.perfect) return showResult(res);
    }
    $("pay-total").textContent = money(totals().total);
    renderPayMethods();
    $("pay-overlay").classList.remove("hidden");
  }

  // The store only takes cards.
  function renderPayMethods() {
    $("pay-body").innerHTML = "<div class='pay-methods'><button class='big-btn' id='pm-card'>Card</button></div>" +
      "<div class='modal-foot'><button class='tbtn' id='pay-cancel'>Back</button></div>";
    $("pm-card").onclick = renderCardTypes;
    $("pay-cancel").onclick = closePay;
  }

  function renderCardTypes() {
    $("pay-body").innerHTML = "<p>Card type:</p><div class='pay-methods' id='card-types'></div>" +
      "<div class='modal-foot'><button class='tbtn' id='pay-back'>Back</button></div>";
    CFG.cardTypes.forEach(function (type) {
      var b = document.createElement("button");
      b.className = "big-btn card-type";
      b.textContent = type;
      b.onclick = function () { finishPay(type); };
      $("card-types").appendChild(b);
    });
    $("pay-back").onclick = renderPayMethods;
  }

  function finishPay(type) {
    var p = state.practice;
    if (p && type !== p.card) {
      p.cardMistakes++;
      $("pay-body").innerHTML = "<p class='note res-bad'>The customer's card is " + esc(p.card) + ", not " + esc(type) + ".</p>" +
        "<div class='modal-foot'><button class='tbtn' id='pay-anyway'>Finish anyway</button>" +
        "<button class='tbtn primary' id='pay-fix'>Go back and fix</button></div>";
      $("pay-fix").onclick = renderCardTypes;
      $("pay-anyway").onclick = function () { closePay(); completeOrder(); };
      return;
    }
    $("pay-body").innerHTML = "<div class='change'>" + esc(type) + " approved</div>" +
      (p ? "<p class='note res-ok'>Right card type.</p>" : "") +
      "<div class='modal-foot'><button class='tbtn primary' id='pay-done'>Done</button></div>";
    $("pay-done").onclick = function () {
      closePay();
      if (state.practice) completeOrder();
      else { state.ticket = []; renderTicket(); state.path = []; renderMenu(); }
    };
  }
  function closePay() { $("pay-overlay").classList.add("hidden"); }

  // ------------------------------------------------------------------
  //  Practice mode
  // ------------------------------------------------------------------
  var NAMES = ["Amy", "Kevin", "Grace", "Daniel", "Linda", "Jason", "Michelle", "Eric", "Vivian", "Tony", "Helen", "Brian", "Cindy", "Mr. Chen", "Mrs. Wang", "Ms. Lee", "Auntie Lin", "Mr. Huang"];
  // A customer buys 1-10 items in all. sizes[k] is how likely k+1 items is:
  // small orders are the most common, big ones rarer; harder levels lean bigger.
  var DIFF = {
    easy:   { sizes: [20, 22, 18, 12, 9, 7, 5, 3, 2, 2],   modChance: 0 },
    medium: { sizes: [12, 16, 16, 14, 11, 9, 8, 6, 4, 4],  modChance: 0.4 },
    hard:   { sizes: [6, 9, 12, 13, 13, 12, 11, 9, 8, 7],  modChance: 0.7 },
  };
  function pickSize(weights) {
    var r = Math.random() * weights.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i + 1; }
    return weights.length;
  }

  function randomMods(it, chance) {
    var mods = [];
    it.modifiers.forEach(function (gid) {
      var g = GROUPS[gid];
      if (g.required) mods.push({ group: gid, option: pick(g.options).name });
      else if (Math.random() < chance) {
        if (g.multi) g.options.forEach(function (o) { if (Math.random() < 0.3) mods.push({ group: gid, option: o.name }); });
        else mods.push({ group: gid, option: pick(g.options).name });
      }
    });
    return mods;
  }

  // Breads are rung up most often at the store, so practice orders pick
  // items from the 麵包Bread folder (bread, Danish, toast, steamed buns,
  // sandwiches) BREAD_WEIGHT times as often as anything else.
  // ("Every item once" still goes through every item exactly once.)
  var BREAD_WEIGHT = 3;
  function pickCommon(pool) {
    var weights = pool.map(function (it) { return it.path[0] && it.path[0].name === "麵包Bread" ? BREAD_WEIGHT : 1; });
    var r = Math.random() * weights.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < pool.length; i++) { r -= weights[i]; if (r < 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  // Settings that decide what an order can contain; a pre-made next order
  // is only used if these haven't changed since it was made.
  function orderSettings() {
    return [$("deck").value, $("difficulty").value, $("photo-only").checked, bagOn()].join("|");
  }

  function practicePool(quiet) {
    // Only items with a known price, so the order total adds up
    var pool = deckItems().filter(function (i) { return i.price > 0; });
    if (!pool.length) { if (!quiet) toast("No prices in this deck yet — using all items"); pool = deckItems(); }
    // "Photos only" quizzes on the items you've added photos for.
    if ($("photo-only").checked) {
      var withPhotos = pool.filter(function (i) { return PHOTOS[i.id]; });
      if (withPhotos.length) pool = withPhotos;
      else if (!quiet) toast("No photos yet — add some in Photos mode");
    }
    return pool;
  }

  // Pick 1-10 items: mostly one of each, sometimes 2-4 of the same thing.
  function planOrder(quiet) {
    var d = DIFF[$("difficulty").value], pool = practicePool(quiet);
    var left = pickSize(d.sizes), lines = [], tries = 0;
    while (left > 0 && tries++ < 50) {
      var it = bagOn() ? drawFromBag("practice", pool) : pickCommon(pool);
      var qty = left >= 2 && Math.random() < 0.25 ? rand(2, Math.min(left, 4)) : 1;
      var line = { itemId: it.id, mods: randomMods(it, d.modChance), qty: qty };
      var dup = lines.find(function (l) { return lineKey(l) === lineKey(line); });
      if (dup) dup.qty += qty; else lines.push(line);
      left -= qty;
    }
    return { customer: pick(NAMES), lines: lines, card: pick(CFG.cardTypes), settings: orderSettings() };
  }

  // Photos load ahead of time so a new customer shows up with no wait:
  // the next order is made while you ring up this one, and its photos (then
  // the rest of the deck's, a few at a time) are fetched in the background.
  var photoCache = {};
  function warmPhoto(id) {
    if (!PHOTOS[id] || photoCache[id]) return;
    var img = new Image();
    img.decoding = "async";
    img.src = PHOTOS[id];
    photoCache[id] = img;
  }
  var warmQueue = [], warmTimer = null;
  function warmDeck() {
    warmQueue = practicePool(true).map(function (it) { return it.id; }).filter(function (id) { return !photoCache[id]; });
    if (warmTimer) return;
    (function step() {
      warmQueue.splice(0, 4).forEach(warmPhoto);
      warmTimer = warmQueue.length ? setTimeout(step, 150) : null;
    })();
  }

  function newOrder() {
    var plan = state.nextOrder && state.nextOrder.settings === orderSettings() ? state.nextOrder : planOrder(false);
    state.nextOrder = null;
    startOrder(plan.customer, plan.lines, plan.card);
    setTimeout(function () {
      if (state.mode !== "practice") return;
      state.nextOrder = planOrder(true);
      state.nextOrder.lines.forEach(function (l) { warmPhoto(l.itemId); });
      warmDeck();
    }, 0);
  }

  // Begin (or redo) a practice order with a clean ticket and fresh score.
  function startOrder(customer, lines, card) {
    state.practice = { customer: customer, lines: lines, card: card, start: Date.now(),
                       mistakes: 0, cardMistakes: 0, hinted: {} };
    state.guide = null;
    state.ticket = [];
    state.path = [];
    if (state.search !== null) closeSearch(); else renderMenu();
    renderTicket();
    renderCustomer();
  }

  function pathText(it) {
    return ["Top Menu"].concat(it.path.map(function (f) { return f.name; })).join(" / ");
  }
  // e.g. "page 2, row 3, column 4" — where the button sits in its folder
  function positionText(it) {
    var siblings = it.path.length ? it.path[it.path.length - 1].children : TREE;
    var i = siblings.indexOf(it), slot = i % PAGE;
    return (siblings.length > PAGE ? "page " + (Math.floor(i / PAGE) + 1) + ", " : "") +
      "row " + (Math.floor(slot / VISIBLE_COLS) + 1) + ", column " + (slot % VISIBLE_COLS + 1);
  }

  function initials(it) {
    // first letters of the English words, skipping things like "(x1)" and "..."
    var words = it.name.replace(/\(x\d+\)|\.\.\.|[^A-Za-z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return it.name.slice(0, 2);
    return words.map(function (w) { return w[0]; }).join("").slice(0, 3).toUpperCase();
  }

  function loadPhoto(it, box) {
    var ready = photoCache[it.id];
    if (ready && ready.complete && ready.naturalWidth) {
      // already downloaded and decoded: a copy shows instantly
      box.querySelector(".ph").replaceWith(ready.cloneNode());
      return;
    }
    if (PHOTOS[it.id]) {
      var saved = new Image();
      saved.src = PHOTOS[it.id];
      box.querySelector(".ph").replaceWith(saved);
      return;
    }
    var names = it.image ? [it.image] : ["jpg", "jpeg", "png", "webp"].map(function (e) { return it.id + "." + e; });
    (function tryNext(i) {
      if (i >= names.length) return;
      var img = new Image();
      img.onload = function () { box.querySelector(".ph").replaceWith(img); };
      img.onerror = function () { tryNext(i + 1); };
      img.src = "images/" + names[i];
    })(0);
  }

  function renderCustomer() {
    var p = state.practice;
    var count = p.lines.reduce(function (a, l) { return a + l.qty; }, 0);
    $("cust-name").textContent = p.customer + " would like " + count + " item" + (count > 1 ? "s" : "") + ":";
    $("cust-pay").textContent = "Paying with " + p.card;
    var photoOnly = $("photo-only").checked;
    var box = $("cust-lines");
    box.innerHTML = "";
    p.lines.forEach(function (l) {
      var it = ITEMS[l.itemId];
      var guiding = state.guide === it.id;
      var card = document.createElement("div");
      card.className = "cust-card" + (guiding ? " guiding" : "");
      card.innerHTML = "<div class='photo' style='background:" + it.color + "'><span class='ph'>" + esc(initials(it)) +
        "</span><span class='qty'>× " + l.qty + "</span></div><div class='txt'>" +
        "<div class='name'>" + (photoOnly ? "?" : esc(it.full)) + "</div>" +
        (l.mods.length ? "<div>" + esc(modText(l.mods)) + "</div>" : "") +
        (guiding ? "<div class='hint'>" + esc(pathText(it)) + "</div>" : "") +
        "<button class='hint-btn'>" + (guiding ? "Stop showing me" : "Where is it?") + "</button>" +
        "</div>";
      card.querySelector(".hint-btn").onclick = function () {
        if (guiding) state.guide = null;
        else { state.guide = it.id; p.hinted[it.id] = true; }
        renderMenu();
        renderCustomer();
      };
      loadPhoto(it, card);
      box.appendChild(card);
    });
    renderStats();
  }

  function describe(l) {
    return l.qty + " × " + ITEMS[l.itemId].full + (l.mods.length ? " (" + modText(l.mods) + ")" : "");
  }

  function checkOrder() {
    var want = {}, have = {}, rows = [], perfect = true;
    state.practice.lines.forEach(function (l) { want[lineKey(l)] = l; });
    state.ticket.forEach(function (l) { have[lineKey(l)] = l; });
    Object.keys(want).forEach(function (k) {
      var w = want[k], h = have[k];
      if (h && h.qty === w.qty) rows.push({ cls: "res-ok", text: "✓ " + describe(w) });
      else { perfect = false; rows.push({ cls: "res-bad", text: "✗ " + describe(w) + (h ? " — you rang " + h.qty : " — missing") }); }
    });
    Object.keys(have).forEach(function (k) {
      if (!want[k]) { perfect = false; rows.push({ cls: "res-extra", text: "+ Extra: " + describe(have[k]) }); }
    });
    return { perfect: perfect, rows: rows };
  }

  function showResult(res) {
    state.practice.mistakes++;
    $("result-title").textContent = "Not quite — check the order";
    $("result-body").innerHTML = "<ul class='res-list'>" + res.rows.map(function (r) {
      return "<li class='" + r.cls + "'>" + esc(r.text) + "</li>";
    }).join("") + "</ul>";
    $("result-foot").innerHTML = "<button class='tbtn' id='res-skip'>Give up, next customer</button><button class='tbtn primary' id='res-fix'>Go back and fix it</button>";
    $("res-fix").onclick = closeResult;
    $("res-skip").onclick = function () { closeResult(); recordStat(false, 0); newOrder(); };
    $("result-overlay").classList.remove("hidden");
  }
  function closeResult() { $("result-overlay").classList.add("hidden"); }

  // what the customer's order should come to, worked out from the menu prices
  function expectedTotal(lines) {
    var cents = lines.reduce(function (s, l) { return s + Math.round(unitPrice(l) * 100) * l.qty; }, 0);
    return (cents + Math.round(cents * CFG.taxRate)) / 100;
  }

  function completeOrder() {
    var p = state.practice, secs = (Date.now() - p.start) / 1000;
    var hints = Object.keys(p.hinted).length;
    var clean = !p.mistakes && !p.cardMistakes && !hints;
    recordStat(clean, secs);
    $("result-title").textContent = clean ? "Perfect order!" : "Order done";
    $("result-body").innerHTML = "<p>Order total: <strong>" + money(expectedTotal(p.lines)) + "</strong></p>" +
      "<p>Time: <strong>" + fmtTime(secs) + "</strong>" +
      (p.mistakes ? " · " + p.mistakes + " wrong check" + (p.mistakes > 1 ? "s" : "") : "") +
      (hints ? " · used " + hints + " hint" + (hints > 1 ? "s" : "") : "") +
      (p.cardMistakes ? " · wrong card type" : "") + "</p>";
    $("result-foot").innerHTML = "<button class='tbtn' id='res-retry'>Try this order again</button>" +
      "<button class='tbtn primary' id='res-next'>Next customer</button>";
    $("res-retry").onclick = function () { closeResult(); startOrder(p.customer, p.lines, p.card); };
    $("res-next").onclick = function () { closeResult(); newOrder(); };
    $("result-overlay").classList.remove("hidden");
  }

  function loadStats() {
    try { return JSON.parse(localStorage.getItem("jj-stats")) || { done: 0, clean: 0, time: 0, timed: 0 }; }
    catch (e) { return { done: 0, clean: 0, time: 0, timed: 0 }; }
  }
  function recordStat(clean, secs) {
    var s = loadStats();
    s.done++;
    if (clean) s.clean++;
    if (secs) { s.time += secs; s.timed++; }
    try { localStorage.setItem("jj-stats", JSON.stringify(s)); } catch (e) {}
    renderStats();
  }
  function renderStats() {
    var s = loadStats();
    $("stats").textContent = s.done ? "Orders: " + s.done + " · perfect: " + Math.round(100 * s.clean / s.done) + "%" +
      (s.timed ? " · avg " + fmtTime(s.time / s.timed) : "") : "";
  }
  function fmtTime(secs) {
    secs = Math.floor(secs);
    return Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
  }

  var toastTimer;
  function toast(msg) {
    $("toast").textContent = msg;
    $("toast").classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("toast").classList.add("hidden"); }, 1600);
  }

  // ------------------------------------------------------------------
  //  Study progress (Flashcards and Find it)
  //  Each item sits in a box 0–4 per activity: a miss drops it to 0, a
  //  clean answer moves it up one. Lower boxes come up more often, so
  //  the things you don't know yet get the most practice.
  // ------------------------------------------------------------------
  var learn = (function () {
    try { return JSON.parse(localStorage.getItem("jj-learn")) || {}; } catch (e) { return {}; }
  })();
  var LEARNED = 3; // box reached after 3 clean answers in a row

  function boxOf(kind, id) { return (learn[kind] && learn[kind][id]) || 0; }
  function markLearn(kind, id, ok) {
    learn[kind] = learn[kind] || {};
    learn[kind][id] = ok ? Math.min(4, boxOf(kind, id) + 1) : 0;
    try { localStorage.setItem("jj-learn", JSON.stringify(learn)); } catch (e) {}
  }
  function pickWeighted(kind, pool, avoidId) {
    if (pool.length > 1) pool = pool.filter(function (it) { return it.id !== avoidId; });
    var weights = pool.map(function (it) { return Math.pow(2, 4 - boxOf(kind, it.id)); });
    var r = Math.random() * weights.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; i < pool.length; i++) { r -= weights[i]; if (r < 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function learnedCount(kind, pool) {
    return pool.filter(function (it) { return boxOf(kind, it.id) >= LEARNED; }).length;
  }

  // ---- "Every item once" (bag picking) ----
  // Each mode keeps a shuffled bag of the deck's items and draws from it
  // without putting items back, so every item comes up once before any
  // repeats. Changing the deck (or its filters) starts a fresh bag.
  var bags = {};
  function bagOn() { return $("bag-mode").checked; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function drawFromBag(kind, pool, avoidId) {
    var ids = pool.map(function (it) { return it.id; });
    var key = ids.slice().sort().join(",");
    var bag = bags[kind];
    if (!bag || bag.key !== key) bag = bags[kind] = { key: key, left: [], size: ids.length };
    if (!bag.left.length) {
      bag.left = shuffle(ids.slice());
      // don't repeat the last item right at the start of a new round
      if (bag.left.length > 1 && bag.left[0] === avoidId) bag.left.push(bag.left.shift());
    }
    var id = bag.left.shift();
    showBagLeft(kind);
    return ITEMS[id];
  }
  function showBagLeft(kind) {
    var bag = bags[kind];
    $("bag-left").textContent = bagOn() && bag ? bag.left.length + " of " + bag.size + " left this round" : "";
  }
  $("bag-mode").onchange = function () {
    bags = {};
    $("bag-left").textContent = "";
    if (state.mode === "flash") nextFlash();
    if (state.mode === "drill") nextDrill();
    if (state.mode === "practice") newOrder();
  };

  // "Deck" picks which top-level folder to study.
  TREE.forEach(function (f, i) {
    var hasItems = Object.keys(ITEMS).some(function (id) { return ITEMS[id].path[0] === f; });
    if (f.type === "folder" && hasItems) $("deck").insertAdjacentHTML("beforeend", "<option value='" + i + "'>" + esc(f.name) + "</option>");
  });
  var CASES = window.DISPLAY_CASES || [];
  if (CASES.length) {
    $("deck").insertAdjacentHTML("beforeend", "<optgroup label='Display cases'>" + CASES.map(function (c) {
      return "<option value='case:" + c.id + "'>" + esc(c.name) + "</option>";
    }).join("") + "</optgroup>");
  }
  function caseItems(c) {
    return [].concat.apply([], c.rows.map(function (r) { return r.items; }))
      .map(function (id) { return ITEMS[id]; }).filter(Boolean);
  }
  function deckItems() {
    var v = $("deck").value, all = Object.keys(ITEMS).map(function (k) { return ITEMS[k]; })
      .filter(function (it) { return it.practice !== false; });
    if (v === "all") return all;
    if (v.indexOf("case:") === 0) {
      var c = CASES.find(function (x) { return "case:" + x.id === v; });
      return c ? caseItems(c) : all;
    }
    return all.filter(function (it) { return it.path[0] === TREE[+v]; });
  }

  // ---- Flashcards: photo first, then reveal name + where it is ----
  var flash = { id: null, shown: false };

  function flashPool() { return deckItems().filter(function (it) { return PHOTOS[it.id]; }); }

  function nextFlash() {
    var pool = flashPool();
    flash.id = !pool.length ? null : (bagOn() ? drawFromBag("flash", pool, flash.id) : pickWeighted("flash", pool, flash.id)).id;
    flash.shown = false;
    renderFlash();
  }

  function renderFlash() {
    var pool = flashPool();
    $("flash-progress").textContent = pool.length
      ? pool.length + " card" + (pool.length > 1 ? "s" : "") + " · " + learnedCount("flash", pool) + " learned"
      : "";
    $("flash-empty").classList.toggle("hidden", !!pool.length);
    $("flash-card").classList.toggle("hidden", !pool.length);
    if (!pool.length) return;
    var it = ITEMS[flash.id];
    $("flash-photo").src = PHOTOS[it.id];
    $("flash-answer").classList.toggle("hidden", !flash.shown);
    $("flash-name").textContent = it.full;
    $("flash-button").textContent = it.full !== it.name ? "Button: " + it.name : "";
    $("flash-path").textContent = pathText(it);
    $("flash-pos").textContent = positionText(it);
    $("flash-note").textContent = NOTES[it.id] || "";
    $("flash-tag").classList.toggle("hidden", !TAGS[it.id]);
    if (TAGS[it.id]) $("flash-tag").src = TAGS[it.id];
    $("flash-reveal").classList.toggle("hidden", flash.shown);
    $("flash-grade").classList.toggle("hidden", !flash.shown);
  }

  function gradeFlash(ok) { markLearn("flash", flash.id, ok); nextFlash(); }

  $("flash-reveal").onclick = function () { flash.shown = true; renderFlash(); };
  $("flash-got").onclick = function () { gradeFlash(true); };
  $("flash-missed").onclick = function () { gradeFlash(false); };
  $("flash-to-photos").onclick = function () { setMode("photos"); };
  document.addEventListener("keydown", function (e) {
    if (state.mode !== "flash" || !flash.id || e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    if (!flash.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); $("flash-reveal").click(); }
    else if (flash.shown && (e.key === "ArrowRight" || e.key === "2")) gradeFlash(true);
    else if (flash.shown && (e.key === "ArrowLeft" || e.key === "1")) gradeFlash(false);
  });

  // ---- Find it: tap the item's exact button, starting from Top Menu ----
  var drill = null;   // { id, start, wrong, hinted }
  var drillStats = { found: 0, time: 0, streak: 0, best: 0 };

  function drillPool() {
    var pool = deckItems();
    if ($("drill-photos").checked) {
      var withPhotos = pool.filter(function (it) { return PHOTOS[it.id]; });
      if (withPhotos.length) return withPhotos;
      toast("No photos in this deck yet — add some in Photos mode");
    }
    return pool;
  }

  function nextDrill() {
    var pool = drillPool();
    var prev = drill && drill.id;
    drill = { id: (bagOn() ? drawFromBag("drill", pool, prev) : pickWeighted("drill", pool, prev)).id, start: Date.now(), wrong: 0, hinted: false };
    state.guide = null;
    state.path = [];
    if (state.search !== null) closeSearch(); else renderMenu();
    renderDrill();
  }

  function renderDrill() {
    var it = ITEMS[drill.id];
    var photoOnly = $("drill-photos").checked && PHOTOS[it.id];
    var card = $("drill-card");
    card.className = "cust-card" + (drill.hinted ? " guiding" : "");
    card.innerHTML = "<div class='photo' style='background:" + it.color + "'><span class='ph'>" + esc(initials(it)) + "</span></div>" +
      "<div class='txt'><div class='name'>" + (photoOnly ? "?" : esc(it.full)) + "</div>" +
      (drill.hinted ? "<div class='hint'>" + esc(pathText(it)) + "<br>" + esc(positionText(it)) + "</div>" : "") + "</div>";
    loadPhoto(it, card);
    $("drill-wrong").textContent = drill.wrong ? drill.wrong + " wrong tap" + (drill.wrong > 1 ? "s" : "") : "";
    $("drill-show").disabled = drill.hinted;
    var pool = drillPool();
    $("drill-stats").textContent = "Found " + drillStats.found +
      (drillStats.found ? " · avg " + (drillStats.time / drillStats.found).toFixed(1) + "s" : "") +
      " · streak " + drillStats.streak + " (best " + drillStats.best + ")" +
      " · " + learnedCount("drill", pool) + " of " + pool.length + " learned";
  }

  function drillTap(it, btn) {
    if (it.id !== drill.id) {
      drill.wrong++;
      btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong");
      renderDrill();
      return;
    }
    var secs = (Date.now() - drill.start) / 1000, clean = !drill.wrong && !drill.hinted;
    markLearn("drill", drill.id, clean);
    drillStats.found++;
    drillStats.time += secs;
    drillStats.streak = clean ? drillStats.streak + 1 : 0;
    drillStats.best = Math.max(drillStats.best, drillStats.streak);
    $("drill-last").className = "drill-last " + (clean ? "res-ok" : "res-extra");
    $("drill-last").textContent = (clean ? "✓ " : "Found ") + it.full + " in " + secs.toFixed(1) + "s" +
      (clean ? "" : drill.hinted ? " (with help)" : " (" + drill.wrong + " wrong)");
    nextDrill();
  }

  $("drill-show").onclick = function () {
    drill.hinted = true;
    state.guide = drill.id;
    renderMenu();
    renderDrill();
  };
  $("drill-skip").onclick = function () {
    markLearn("drill", drill.id, false);
    drillStats.streak = 0;
    $("drill-last").className = "drill-last res-bad";
    $("drill-last").textContent = "Skipped " + ITEMS[drill.id].full + " — " + pathText(ITEMS[drill.id]);
    nextDrill();
  };
  $("deck").onchange = function () {
    if (state.mode === "flash") nextFlash();
    if (state.mode === "drill") nextDrill();
    if (state.mode === "practice") newOrder();
  };
  $("drill-photos").onchange = function () { if (state.mode === "drill") nextDrill(); };

  // ---- Display cases: what's in each case, row by row ----
  function renderCases() {
    var box = $("cases-list");
    box.innerHTML = "";
    CASES.forEach(function (c) {
      var sec = document.createElement("section");
      sec.className = "case";
      sec.innerHTML = "<div class='case-head'><div><h2>" + esc(c.name) + "</h2><div class='muted'>" +
        esc(c.note || "") + " · " + caseItems(c).length + " items</div></div><div class='case-actions'>" +
        "<button class='tbtn' data-go='flash'>Flashcards</button><button class='tbtn' data-go='drill'>Find it</button>" +
        "<button class='tbtn primary' data-go='practice'>Practice orders</button></div></div>" +
        (c.photo ? "<img class='case-photo' src='" + c.photo + "' alt=''>" : "");
      sec.querySelectorAll("[data-go]").forEach(function (b) {
        b.onclick = function () { $("deck").value = "case:" + c.id; setMode(b.dataset.go); };
      });
      c.rows.forEach(function (r) {
        var row = document.createElement("div");
        row.innerHTML = "<h3>" + esc(r.name) + " <span class='muted'>(left → right)</span></h3><div class='case-row'></div>";
        r.items.forEach(function (id) {
          var it = ITEMS[id];
          if (!it) return;
          var card = document.createElement("button");
          card.className = "case-item";
          card.innerHTML = "<div class='photo' style='background:" + it.color + "'><span class='ph'>" + esc(initials(it)) +
            "</span></div>" + (TAGS[id] ? "<img class='ci-tag' src='" + TAGS[id] + "' alt=''>" : "") +
            "<div class='ci-name'>" + esc(it.full) + "</div><div class='ci-meta'>" +
            (it.price ? "$" + it.price.toFixed(2) : "") + "</div>";
          loadPhoto(it, card);
          card.onclick = function () { openPhotoEditor(it); };
          row.lastChild.appendChild(card);
        });
        sec.appendChild(row);
      });
      box.appendChild(sec);
    });
  }
  // ---- Reference sheet: every item, folder by folder, in button order ----
  // Photo, full name, price, where the button is, and the note for each item.
  (function () {
    var sel = $("sheet-folder");
    TREE.forEach(function (n, i) {
      if (n.type !== "folder") return;
      var o = document.createElement("option");
      o.value = i;
      o.textContent = n.name;
      sel.appendChild(o);
    });
  })();
  function renderSheet() {
    var box = $("sheet-list"), want = $("sheet-folder").value;
    var find = $("sheet-find").value.trim().toLowerCase(), photoFilter = $("sheet-photos").value;
    var shown = 0, total = 0;
    box.innerHTML = "";
    // one section per folder that holds items directly, in register order
    (function walk(nodes, path) {
      var items = nodes.filter(function (n) { return n.type === "item"; });
      total += items.length;
      var list = items.filter(function (it) {
        if (photoFilter !== "all" && !PHOTOS[it.id] === (photoFilter === "have")) return false;
        return !find || (it.full + " " + it.name + " " + (NOTES[it.id] || "")).toLowerCase().indexOf(find) >= 0;
      });
      if (list.length) {
        shown += list.length;
        var sec = document.createElement("section");
        sec.className = "sheet-sec";
        sec.innerHTML = "<h2>" + esc(pathText({ path: path })) + " <span class='muted'>" + list.length + " items</span></h2>" +
          "<div class='sheet-grid'></div>";
        list.forEach(function (it) {
          var card = document.createElement("button");
          card.className = "sheet-card";
          card.innerHTML = "<div class='photo' style='background:" + it.color + "'><span class='ph'>" + esc(initials(it)) + "</span></div>" +
            "<div class='sc-body'><div class='sc-name'>" + esc(it.full) + "</div>" +
            (it.full !== it.name ? "<div class='sc-btn'>Button: " + esc(it.name) + "</div>" : "") +
            "<div class='sc-meta'><span class='sc-price'>" + (it.price ? "$" + it.price.toFixed(2) : "no price yet") + "</span>" +
            "<span class='sc-pos'>" + esc(positionText(it)) + "</span></div>" +
            (NOTES[it.id] ? "<div class='sc-note'>" + esc(NOTES[it.id]) + "</div>"
              : PHOTOS[it.id] ? "" : "<div class='sc-note sc-none'>No photo yet</div>") +
            "</div>";
          loadPhoto(it, card);
          card.onclick = function () { openPhotoEditor(it); };
          sec.lastChild.appendChild(card);
        });
        box.appendChild(sec);
      }
      nodes.forEach(function (n) { if (n.type === "folder") walk(n.children, path.concat(n)); });
    })(want === "all" ? TREE : TREE[+want].children, want === "all" ? [] : [TREE[+want]]);
    $("sheet-count").textContent = shown + " of " + total + " items";
    if (!shown) box.innerHTML = "<div class='sheet-sec muted'>Nothing matches.</div>";
  }
  ["sheet-folder", "sheet-photos"].forEach(function (id) { $(id).onchange = renderSheet; });
  // Cards (photo, name, price, spot, note) or Sheet (just name + whole photo, for printing)
  function setSheetView(v) {
    document.querySelector(".sheet-panel").classList.toggle("print", v === "print");
    document.querySelectorAll(".view-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.view === v); });
    try { localStorage.setItem("jj-sheet-view", v); } catch (e) {}
  }
  document.querySelectorAll(".view-btn").forEach(function (b) { b.onclick = function () { setSheetView(b.dataset.view); }; });
  try { setSheetView(localStorage.getItem("jj-sheet-view") === "print" ? "print" : "cards"); } catch (e) { setSheetView("cards"); }
  // The claude.ai copy runs in a frame that can't print, so the button only shows on the real site
  if (window.self !== window.top) $("sheet-print").classList.add("hidden");
  $("sheet-print").onclick = function () { window.print(); };
  $("sheet-find").oninput = renderSheet;

  // "Show name tags" switch: off hides names, prices and tags so you can quiz yourself
  function applyCaseTags() { document.body.classList.toggle("hide-tags", !$("case-tags").checked); }
  try { $("case-tags").checked = localStorage.getItem("jj-case-tags") !== "off"; } catch (e) {}
  $("case-tags").onchange = function () {
    try { localStorage.setItem("jj-case-tags", this.checked ? "on" : "off"); } catch (e) {}
    applyCaseTags();
  };
  applyCaseTags();

  // Practice and Find it: tap an item's photo to see the whole photo full size
  // (product photo only — the name tag is never shown here)
  ["cust-lines", "drill-card"].forEach(function (id) {
    $(id).addEventListener("click", function (e) {
      var img = e.target.closest(".photo") && e.target.closest(".photo").querySelector("img");
      if (!img) return;
      $("zoom").firstChild.src = img.src;
      $("zoom").classList.remove("hidden");
    });
  });

  // tap the case photo to see it full size
  $("cases-list").addEventListener("click", function (e) {
    if (!e.target.classList.contains("case-photo")) return;
    $("zoom").firstChild.src = e.target.src;
    $("zoom").classList.remove("hidden");
  });

  // ------------------------------------------------------------------
  //  Wiring
  // ------------------------------------------------------------------
  function setMode(mode) {
    state.mode = mode;
    state.guide = null;
    $("bag-left").textContent = "";
    document.querySelectorAll(".mode-btn[data-mode]").forEach(function (b) { b.classList.toggle("active", b.dataset.mode === mode); });
    ["practice", "photos", "drill", "flash", "cases", "sheet"].forEach(function (m) { document.body.classList.toggle(m, mode === m); });
    state.practice = null;
    state.ticket = [];
    state.path = [];
    if (state.search !== null) closeSearch();
    renderTicket();
    if (mode === "practice") newOrder();
    else if (mode === "drill") nextDrill();
    else renderMenu();
    if (mode === "flash") nextFlash();
    if (mode === "cases") renderCases();
    document.querySelector(".sheet-panel").hidden = mode !== "sheet";
    if (mode === "sheet") renderSheet();
    updatePhotoCount();
    relayout();
  }

  function relayout() { fitIpad(); lastSize = ""; sizeButtons(); }
  // Practice order card: on the side or along the bottom (remembered in this browser)
  function applyCustPos() {
    document.body.classList.toggle("cust-bottom", $("cust-pos").value === "bottom");
    relayout();
  }
  try { if (localStorage.getItem("jj-cust-pos") === "bottom") $("cust-pos").value = "bottom"; } catch (e) {}
  $("cust-pos").onchange = function () {
    try { localStorage.setItem("jj-cust-pos", this.value); } catch (e) {}
    applyCustPos();
  };

  // ------------------------------------------------------------------
  //  Photos mode: tap an item to give it a photo.
  //  Run through serve.js (start.bat), photos are saved into the project's
  //  /images folder and "Upload to GitHub" commits and pushes them.
  //  Opened as a plain file, the browser can't write files, so photos are
  //  kept in this browser (IndexedDB) instead, and moved into the project
  //  the next time the site runs through the server.
  // ------------------------------------------------------------------
  // item id -> image URL. Starts with the photos that ship in /images.
  var BUNDLED = window.PHOTO_FILES || {};
  var PHOTOS = {};
  Object.keys(BUNDLED).forEach(function (id) { if (ITEMS[id]) PHOTOS[id] = BUNDLED[id]; });
  var photoDB = null;
  var photoItem = null; // item open in the photo editor

  function openPhotoDB(done) {
    try {
      var req = indexedDB.open("jj-photos", 1);
      req.onupgradeneeded = function () { req.result.createObjectStore("photos"); };
      req.onsuccess = function () { photoDB = req.result; loadSavedPhotos(done); };
      req.onerror = function () { done(); };
    } catch (e) { done(); }
  }
  function loadSavedPhotos(done) {
    var req = photoDB.transaction("photos").objectStore("photos").openCursor();
    req.onsuccess = function () {
      var c = req.result;
      if (!c) return done();
      if (ITEMS[c.key]) PHOTOS[c.key] = URL.createObjectURL(c.value);
      c.continue();
    };
    req.onerror = function () { done(); };
  }
  var SERVER = false;   // true when the site runs through serve.js and can save files

  function forgetBrowserPhoto(id) {
    if (PHOTOS[id] && PHOTOS[id].indexOf("blob:") === 0) URL.revokeObjectURL(PHOTOS[id]);
    if (photoDB) photoDB.transaction("photos", "readwrite").objectStore("photos").delete(id);
  }
  function saveInBrowser(id, blob) {
    forgetBrowserPhoto(id);
    PHOTOS[id] = URL.createObjectURL(blob);
    if (photoDB) photoDB.transaction("photos", "readwrite").objectStore("photos").put(blob, id);
  }
  // Write the photo into the project's /images folder.
  function saveToProject(id, blob) {
    return fetch("/save-image?name=" + id + ".jpg", { method: "POST", body: blob }).then(function (r) {
      if (!r.ok) throw new Error("save failed");
      forgetBrowserPhoto(id);
      PHOTOS[id] = BUNDLED[id] = "images/" + id + ".jpg?v=" + Date.now();   // ?v= so the new photo shows right away
    });
  }
  function savePhoto(id, blob, done) {
    if (!SERVER) { saveInBrowser(id, blob); return done(); }
    saveToProject(id, blob).then(function () { updatePublishStatus(); done(); }, function () {
      toast("Couldn't save into the project, so it's saved in this browser for now");
      saveInBrowser(id, blob);
      done();
    });
  }
  function removePhoto(id, done) {
    var inProject = BUNDLED[id] && PHOTOS[id] === BUNDLED[id];
    forgetBrowserPhoto(id);
    if (!inProject) {
      if (BUNDLED[id]) PHOTOS[id] = BUNDLED[id]; else delete PHOTOS[id];
      return done();
    }
    if (!confirm("Delete this photo from the project? It's removed from GitHub the next time you upload.")) return done();
    fetch("/delete-image?name=" + id + ".jpg", { method: "POST" }).then(function (r) {
      if (!r.ok) throw new Error();
      delete PHOTOS[id];
      delete BUNDLED[id];
      updatePublishStatus();
      done();
    }).catch(function () { toast("Couldn't delete the photo"); done(); });
  }

  // Photos saved only in this browser (from before, or while the site was
  // opened without the server) get moved into the project.
  function moveBrowserPhotosToProject() {
    if (!photoDB) return;
    var req = photoDB.transaction("photos").objectStore("photos").getAllKeys();
    req.onsuccess = function () {
      var ids = req.result.filter(function (id) { return ITEMS[id]; });
      if (!ids.length) return;
      var moved = 0;
      (function next(i) {
        if (i >= ids.length) {
          if (moved) toast("Moved " + moved + " photo" + (moved > 1 ? "s" : "") + " from this browser into the project");
          renderGrid(); updatePhotoCount(); updatePublishStatus();
          return;
        }
        var get = photoDB.transaction("photos").objectStore("photos").get(ids[i]);
        get.onsuccess = function () {
          saveToProject(ids[i], get.result).then(function () { moved++; }, function () {}).then(function () { next(i + 1); });
        };
        get.onerror = function () { next(i + 1); };
      })(0);
    };
  }

  // "Upload to GitHub": shows how many photo changes aren't on GitHub yet.
  function updatePublishStatus() {
    if (!SERVER) {
      $("publish-btn").disabled = true;
      $("publish-status").textContent = "Photos you add here are saved in this browser only (start.bat on your computer saves them into the project).";
      return;
    }
    fetch("/api/status").then(function (r) { return r.json(); }).then(function (s) {
      $("publish-btn").disabled = !s.git || !s.pending;
      $("publish-status").textContent = !s.git ? "Not linked to GitHub"
        : s.pending ? s.pending + " photo change" + (s.pending > 1 ? "s" : "") + " not on GitHub yet"
        : "All photos are on GitHub";
    }).catch(function () {});
  }
  $("publish-btn").onclick = function () {
    var btn = this;
    btn.disabled = true;
    $("publish-status").textContent = "Uploading…";
    fetch("/api/publish", { method: "POST" }).then(function (r) { return r.json(); }).then(function (res) {
      toast(res.message);
      updatePublishStatus();
    }).catch(function () { toast("Upload failed"); updatePublishStatus(); });
  };

  function checkServer() {
    fetch("/api/status").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      SERVER = !!(s && s.server);
      updatePublishStatus();
      if (SERVER) moveBrowserPhotosToProject();
    }).catch(function () { SERVER = false; updatePublishStatus(); });
  }
  // Phone photos are huge; shrink to 800px so storage stays small.
  function shrinkImage(file, done) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var scale = Math.min(1, 800 / Math.max(img.width, img.height));
      var c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(done, "image/jpeg", 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); done(null); };
    img.src = url;
  }

  var photoRevealed = false;   // name tag shown for this item even with "Show name tags" off

  function openPhotoEditor(it) {
    photoItem = it;
    photoRevealed = false;
    renderPhotoEditor();
    $("photo-overlay").classList.remove("hidden");
  }
  var SOURCES = window.PHOTO_SOURCES || {};
  var NOTES = window.ITEM_NOTES || {};   // what makes each item recognizable (js/notes.js)   // original photos with the name plate
  var TAGS = window.PHOTO_TAGS || {};         // just the name tag, cropped from the original

  function renderPhotoEditor() {
    var it = photoItem;
    // "Show name tags" off: hide the name, price and tag until "Show name tag" is tapped
    var quiz = document.body.classList.contains("hide-tags") && !photoRevealed && !!PHOTOS[it.id];
    document.querySelector(".photo-modal").classList.toggle("quiz", quiz);
    $("photo-title").textContent = quiz ? "What is this?" : it.full;
    $("photo-details").innerHTML = (it.price ? "<strong>$" + it.price.toFixed(2) + "</strong> · " : "") +
      esc(pathText(it)) + " · " + esc(positionText(it)) +
      (it.full !== it.name ? "<br>Button: " + esc(it.name) : "");
    $("photo-notes-text").textContent = NOTES[it.id] || "No notes for this item yet.";
    $("photo-notes-text").classList.toggle("empty", !NOTES[it.id]);
    // name tag stacked under the photo (falls back to the whole original photo)
    var tagSrc = TAGS[it.id] || SOURCES[it.id];
    var plate = $("photo-plate");
    plate.innerHTML = tagSrc ? "<img src='" + tagSrc + "' alt=''>" : "";
    $("photo-plate-box").classList.toggle("hidden", !tagSrc);
    $("photo-plate-cap").textContent = TAGS[it.id] ? "Name tag" : "With name tag";
    $("photo-original").classList.toggle("hidden", !(TAGS[it.id] && SOURCES[it.id]));
    $("photo-original").dataset.src = SOURCES[it.id] || "";
    var box = $("photo-preview");
    box.innerHTML = "";
    if (PHOTOS[photoItem.id]) {
      var img = new Image();
      img.src = PHOTOS[photoItem.id];
      box.appendChild(img);
    } else box.innerHTML = "<span class='muted'>No photo yet</span>";
    $("photo-pick").textContent = PHOTOS[photoItem.id] ? "Replace photo" : "Choose photo";
    // with the server any photo can be removed; without it, only ones saved in this browser
    $("photo-remove").classList.toggle("hidden", !PHOTOS[photoItem.id] || (!SERVER && PHOTOS[photoItem.id] === BUNDLED[photoItem.id]));
    $("photo-save-note").textContent = SERVER
      ? "Photos you choose here are saved into the project. Use Upload to GitHub to send them up."
      : "Photos you choose here are saved in this browser only (run start.bat to save them into the project).";
  }
  function closePhotoEditor() {
    $("photo-overlay").classList.add("hidden");
    photoItem = null;
    renderGrid();
    updatePhotoCount();
  }
  function updatePhotoCount() {
    var total = Object.keys(ITEMS).length, have = Object.keys(PHOTOS).length;
    $("photo-count").textContent = have + " of " + total + " items have photos";
  }

  $("photo-pick").onclick = function () { $("photo-file").click(); };
  $("photo-file").onchange = function () {
    var file = this.files[0], it = photoItem;
    this.value = "";
    if (!file || !it) return;
    shrinkImage(file, function (blob) {
      if (!blob) return toast("Couldn't read that image");
      savePhoto(it.id, blob, function () { if (photoItem === it) renderPhotoEditor(); });
    });
  };
  $("photo-remove").onclick = function () { var it = photoItem; removePhoto(it.id, function () { if (photoItem === it) renderPhotoEditor(); }); };
  $("photo-close").onclick = closePhotoEditor;
  $("photo-reveal").onclick = function () { photoRevealed = true; renderPhotoEditor(); };
  // tap a picture in the popup to see it full size
  $("photo-original").onclick = function (e) {
    e.preventDefault();
    $("zoom").firstChild.src = this.dataset.src;
    $("zoom").classList.remove("hidden");
  };
  document.querySelector(".photo-stack").addEventListener("click", function (e) {
    if (e.target.tagName !== "IMG") return;
    $("zoom").firstChild.src = e.target.src;
    $("zoom").classList.remove("hidden");
  });
  $("zoom").onclick = function () { $("zoom").classList.add("hidden"); };

  document.querySelectorAll(".mode-btn[data-mode]").forEach(function (b) { b.onclick = function () { setMode(b.dataset.mode); }; });
  $("skip-order").onclick = newOrder;
  $("difficulty").onchange = newOrder;
  $("photo-only").onchange = function () { if (state.practice) newOrder(); };

  $("back-btn").onclick = function () { if (state.path.length) { state.path.pop(); renderMenu(); } };
  $("search-btn").onclick = function () {
    if (state.mode === "drill") return toast("Search is off in Find it");
    state.search === null ? openSearch() : closeSearch();
  };
  $("search-close").onclick = closeSearch;
  $("search-input").oninput = function () { state.search = this.value; renderGrid(); };
  $("search-input").onkeydown = function (e) { if (e.key === "Escape") closeSearch(); };
  $("full-btn").onclick = function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () { toast("Full screen isn't available here"); });
  };
  // Tap ••• twice to clear the order (no confirm() pop-up: the hosted page can't show one).
  var clearArmed = 0;
  $("dots-btn").onclick = function () {
    if (!state.ticket.length) return;
    if (Date.now() - clearArmed < 3000) {
      state.ticket = []; renderTicket(); clearArmed = 0; toast("Order cleared");
    } else {
      clearArmed = Date.now(); toast("Tap ••• again to clear the order");
    }
  };
  ["hold-btn", "send-btn"].forEach(function (id) {
    $(id).onclick = function () { toast(this.textContent + " isn't used in practice"); };
  });
  document.querySelectorAll(".tb").forEach(function (b) {
    b.onclick = function () { toast(b.dataset.msg + " isn't simulated yet"); };
  });

  $("pay-btn").onclick = openPay;
  $("line-plus").onclick = function () { $("line-qty").textContent = ++state.ticket[state.lineIdx].qty; };
  $("line-minus").onclick = function () {
    var l = state.ticket[state.lineIdx];
    if (--l.qty <= 0) { state.ticket.splice(state.lineIdx, 1); closeLine(); }
    else $("line-qty").textContent = l.qty;
  };
  $("line-del").onclick = function () { state.ticket.splice(state.lineIdx, 1); closeLine(); };
  $("line-done").onclick = closeLine;
  $("line-mod").onclick = function () {
    $("line-overlay").classList.add("hidden");
    openMods(ITEMS[state.ticket[state.lineIdx].itemId], state.lineIdx);
  };
  $("mod-ok").onclick = confirmMods;
  $("mod-cancel").onclick = closeMods;

  function tick() {
    var now = new Date();
    $("sb-time").textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    $("sb-date").textContent = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
    if (state.practice) $("timer").textContent = fmtTime((Date.now() - state.practice.start) / 1000);
    if (state.mode === "drill" && drill) $("drill-timer").textContent = ((Date.now() - drill.start) / 1000).toFixed(0) + "s";
  }
  setInterval(tick, 1000);
  tick();

  $("brand").textContent = CFG.storeName;
  $("staff").textContent = CFG.staffName;
  $("order-type").textContent = CFG.orderType;
  applyCustPos();
  renderMenu();
  renderTicket();
  openPhotoDB(function () { renderGrid(); updatePhotoCount(); checkServer(); });
})();
