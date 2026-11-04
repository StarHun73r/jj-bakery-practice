// The Revel screens around the order screen, copied from the user's register photos (2026-11-02):
// the PIN sign-in, the dashboard and its pop-ups (Orders, Reports, Return, Gift Cards, Reward Cards,
// Store Credit, Invoices, Product Setup) and the Order Details window.
// Only the Register tab uses them: the order screen's back arrow (at the Top Menu) opens the dashboard,
// the log-out arrow opens the PIN screen, and New Order goes back to the order screen.
// Nothing here talks to a real register. Buttons that aren't simulated show a short message.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); };
  var ipad = document.querySelector(".ipad"), screen = ipad.querySelector(".screen");

  // Employees in the report lists, in the register's order and spelling (user OK'd real names, 2026-11-04)
  var EMPLOYEES = ["Irene Boss", "Yan Cao", "Jay Hsiao", "Morning Shift", "Night Shift", "Billy Wang", "CINDY YEH"];
  var CATEGORIES = [   // Product Setup tiles, text exactly as on that screen; tree = top-folder index in MENU_TREE
    ["麵包Bread", "blue", 0], ["餅乾&甜點Cook...", "blue", 1], ["蛋糕&慕斯Cake...", "blue", 2], ["飲料Drink", "blue", 3], ["其他Other", "blue", 4],
    ["冷凍食品Frozen...", "blue", 5], ["中秋節月餅 Moo...", "orange", 6], ["W-蛋糕&慕斯Ca...", "red", 7], ["W-餅乾&甜點Co...", "red", 8], ["W-麵包Bread", "red", 9],
    ["W-飲料Drink", "red", 10], ["W-中秋節月餅...", "red", 11], ["W-其他Other", "red", 12], ["W-冷凍食品Fro...", "red", 13], ["P-麵包Bread", "indigo", 14],
    ["P-餅乾&甜點Co...", "indigo", 15], ["P-蛋糕&慕斯Ca...", "indigo", 16],
  ];

  // ---- icons (simple line drawings in the register's style) ----
  var P = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  var ICON = {
    clock: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" ' + P + '/><path d="M16 8v8h-6" ' + P + '/></svg>',
    doc: '<svg viewBox="0 0 26 32"><path d="M3 2h13l7 7v20H3z M16 2v7h7 M7 15h12 M7 20h12 M7 25h12" ' + P + '/></svg>',
    docs: '<svg viewBox="0 0 30 32"><path d="M8 6h12l6 6v18H8z M20 6v6h6 M12 17h10 M12 21h10 M12 25h10 M4 26V2h13" ' + P + '/></svg>',
    chart: '<svg viewBox="0 0 34 32"><path d="M2 30h30 M6 30V20 M12 30V14 M18 30V17 M24 30V9 M4 18l9-9 5 4 12-11 M24 2h6v6" ' + P + '/></svg>',
    ret: '<svg viewBox="0 0 30 32"><path d="M9 6V2h13l6 6v20H14 M22 2v6h6 M15 14h9 M17 19h7 M3 22a7 7 0 1 0 7-7H6 M8 12l-3 3 3 3" ' + P + '/></svg>',
    wrench: '<svg viewBox="0 0 32 32"><path d="M20 3a8 8 0 0 0-7 11L3 24a3 3 0 0 0 5 5l10-10a8 8 0 0 0 11-7l-5 5-5-1-1-5z" ' + P + '/></svg>',
    mail: '<svg viewBox="0 0 34 28"><path d="M2 2h30v24H2z M2 2l15 13L32 2 M2 26l11-12 M32 26L21 14" ' + P + '/></svg>',
    trophy: '<svg viewBox="0 0 32 32"><path d="M9 3h14v8a7 7 0 0 1-14 0z M9 5H3c0 6 3 8 6 8 M23 5h6c0 6-3 8-6 8 M16 18v6 M10 29h12l-2-5h-8z" ' + P + '/></svg>',
    gift: '<svg viewBox="0 0 32 32"><path d="M3 11h26v6H3z M5 17h22v12H5z M16 11v18 M16 11c-2-6-9-8-9-3s9 3 9 3c2-6 9-8 9-3s-9 3-9 3" ' + P + '/></svg>',
    credit: '<svg viewBox="0 0 34 32"><path d="M10 4h22v16H10z M10 9h22 M2 22h8 M6 18v8 M14 24h18" ' + P + '/></svg>',
    gauge: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" ' + P + '/><path d="M15 15l-4-7 M9 21h12 M8 13h2 M15 6v2 M20 13h2" ' + P + '/></svg>',
    person: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" ' + P + '/><circle cx="15" cy="12" r="4.5" ' + P + '/><path d="M7 24c2-4 5-5.5 8-5.5s6 1.5 8 5.5" ' + P + '/></svg>',
    clip: '<svg viewBox="0 0 26 30"><path d="M5 4h4v3h8V4h4v24H5z M9 4V2h8v5 M9 17l3 3 6-6" ' + P + '/></svg>',
    gear: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="4" ' + P + '/><path d="M13 2h4l1 4 3 1.5 3.5-2 3 3-2 3.5L27 15l-1.5 3 2 3.5-3 3-3.5-2L18 24l-1 4h-4l-1-4-3-1.5-3.5 2-3-3 2-3.5L3 15l1.5-3-2-3.5 3-3 3.5 2L12 6z" ' + P + '/></svg>',
    out: '<svg viewBox="0 0 26 24"><path d="M17.5 5.2a9.5 9.5 0 100 13.6M8.5 12h16M19.5 7l5 5-5 5" ' + P + ' stroke-width="1.8"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3-6.2 M17 2v4h-4" ' + P + ' stroke-width="2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" ' + P + ' stroke-width="1.8"/><path d="M15 15l6 6" ' + P + ' stroke-width="1.8"/></svg>',
    print: '<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z" ' + P + '/></svg>',
    back: '<svg viewBox="0 0 12 20"><path d="M10 2L2 10l8 8" ' + P + ' stroke-width="2.4"/></svg>',
    chev: '<svg viewBox="0 0 10 16"><path d="M2 2l6 6-6 6" ' + P + ' stroke-width="1.8"/></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  var LOGO = '<div class="rv-logo"><b>Revel</b><span class="tm">™</span><small>SYSTEMS</small></div>';

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function soon(what) { JJ.toast(what + " isn't simulated yet"); }

  // ------------------------------------------------------------------
  //  Staff and orders
  // ------------------------------------------------------------------
  // Signing in on the PIN screen picks the shift by the time of day, like the store's two logins.
  var staff = (window.MENU_CONFIG || {}).staffName || "Morning S.";
  function shiftStaff() { return new Date().getHours() < 15 ? "Morning S." : "Night S."; }
  function setStaff(name) {
    staff = name;
    $("staff").textContent = name;
    document.querySelectorAll(".rv-staff").forEach(function (s) { s.textContent = name; });
    drawOrderHead();
  }
  function shiftName() { return staff === "Night S." ? "Night Shift" : "Morning Shift"; }

  // Orders paid today in this browser, for the Orders list (localStorage jj-rv-orders)
  var today = new Date().toDateString();
  var paid = [];
  try { paid = (JSON.parse(localStorage.getItem("jj-rv-orders")) || []).filter(function (o) { return new Date(o.time).toDateString() === today; }); } catch (e) {}
  function savePaid() { try { localStorage.setItem("jj-rv-orders", JSON.stringify(paid.slice(-200))); } catch (e) {} }

  // The open order: it gets its number when the first item goes on the ticket
  var open = { no: null, items: 0, total: 0, opened: null };
  function newNo() {
    var last = paid.length ? paid[paid.length - 1].no : 12715600 + Math.floor(Math.random() * 300);
    return last + 1 + Math.floor(Math.random() * 12);
  }
  JJ.orderNo = function () { return open.no; };
  JJ.onTicket = function (n, total) {
    if (n && !open.no) { open.no = newNo(); open.opened = Date.now(); }
    if (!n) { open.no = null; open.opened = null; }
    open.items = n; open.total = total;
    drawOrderHead();
  };
  JJ.onPaid = function (co) {
    paid.push({ no: co.order, total: co.total, time: Date.now(), staff: staff });
    savePaid();
    open.no = null;
  };

  // Order screen header: the order number once something is on it, the staff name under it,
  // and the number of open orders beside the orders icon.
  var headT1 = document.querySelector(".order-title .t1");
  var custBtn = document.querySelector(".order-sub .icon-btn");
  var custName = el('<span class="rv-cust"></span>');
  custBtn.appendChild(custName);
  var ordersBtn = document.querySelector('.order-head [title="Order details"]');
  ordersBtn.title = "Orders";
  var badge = el('<span class="rv-badge hidden"></span>');
  ordersBtn.insertBefore(badge, ordersBtn.firstChild);
  function drawOrderHead() {
    headT1.textContent = open.no ? open.no : "New Order";
    custName.textContent = open.no ? staff.replace(/\.$/, "") : "";
    badge.textContent = open.no ? 1 : "";
    badge.classList.toggle("hidden", !open.no);
  }

  // ------------------------------------------------------------------
  //  Pages: PIN, dashboard, product setup (each replaces the order screen)
  // ------------------------------------------------------------------
  var pin = el(
    '<div class="rv-page rv-pin hidden">' +
      '<div class="rv-pin-head">' + LOGO + '<div class="rv-pin-title">Enter Pin</div><button class="rv-refresh">' + ICON.refresh + ' Refresh</button></div>' +
      '<div class="rv-pin-dots"></div>' +
      '<div class="rv-keys">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button data-k="' + n + '">' + n + '</button>'; }).join("") +
        '<button class="rv-dim" data-k="clock">Clock<br>In/Out</button><button data-k="0">0</button><button class="rv-dim" data-k="login">Login</button>' +
      '</div>' +
      '<div class="rv-pin-foot">All payments are sent to the payment processor.</div>' +
    '</div>');
  var dash = el(
    '<div class="rv-page rv-dash hidden">' +
      '<div class="rv-top">' + LOGO + '<span class="rv-top-r"><span class="rv-staff"></span><button class="rv-out" title="Log out">' + ICON.out + '</button></span></div>' +
      '<div class="rv-dash-body">' +
        '<div class="rv-left">' +
          '<div class="rv-card rv-mix">' +
            '<div class="rv-mix-head"><span class="rv-h">Product Mix</span><span class="rv-upd"></span><button class="rv-ic" data-soon="Refresh">' + ICON.refresh + '</button><button class="rv-ic rv-dots" data-soon="Product Mix options">•••</button></div>' +
            '<div class="rv-mix-body"><div class="rv-donut-box"><div class="rv-donut"></div><div class="rv-top-big">Top</div><div class="rv-by">by Quantity</div></div>' +
            '<div class="rv-nodata"><span>no data available</span><span>0</span></div></div>' +
          '</div>' +
          '<div class="rv-card rv-row"><span>Time Management</span><span class="rv-blue">0 Clocked In</span></div>' +
          '<div class="rv-cap">OPERATIONS</div>' +
          '<div class="rv-card rv-row"><span class="rv-till">' + ICON.print.replace('M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z', 'M3 13h18v8H3z M5 13l2-9h10l2 9 M10 17h4') + 'Tills</span><span class="rv-blue">Not Set</span></div>' +
        '</div>' +
        '<div class="rv-tiles">' +
          tile("clock", "Time Clock") + tile("doc", "New Order") + tile("chart", "Reports") + tile("docs", "Orders") +
          tile("ret", "Return") + tile("wrench", "Product Setup") +
          '<div class="rv-small">' + tile("mail", "Invoices") + tile("trophy", "Reward<br>Cards") + tile("gift", "Gift Cards") + tile("credit", "Store<br>Credit") + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="rv-tabbar">' +
        '<button class="on">' + ICON.gauge + 'Dashboard</button><button data-soon="Manage Customers">' + ICON.person + 'Manage Customers</button>' +
        '<button data-soon="Inventory">' + ICON.clip + 'Inventory</button><button data-soon="Settings">' + ICON.gear + 'Settings</button>' +
      '</div>' +
    '</div>');
  function tile(icon, label) { return '<button class="rv-tile" data-go="' + label.replace("<br>", " ") + '">' + ICON[icon] + '<span>' + label + '</span></button>'; }

  var setup = el(
    '<div class="rv-page rv-setup hidden">' +
      '<div class="rv-setup-top"><button class="rv-obtn rv-exit">Exit</button><button class="rv-obtn" data-soon="Reset All Balances">Reset All Balances</button></div>' +
      '<div class="rv-setup-body">' +
        '<div class="rv-setup-left"><div class="rv-setup-title">Manage Item Mod</div>' +
          '<div class="rv-setup-sub">Search for a product or tap a product tile to manage its information</div>' +
          '<label class="rv-searchbox">' + ICON.search + '<input placeholder="Search Name, Barcode, SKU or ALU" autocomplete="off"></label>' +
          '<div class="rv-setup-info"></div></div>' +
        '<div class="rv-setup-right"><div class="rv-setup-crumb hidden"></div><div class="rv-cat-grid"></div></div>' +
      '</div>' +
    '</div>');

  var layer = el('<div class="rv-layer hidden"></div>');
  [pin, dash, setup].forEach(function (p) { ipad.appendChild(p); });
  ipad.appendChild(layer);
  var PAGES = [pin, dash, setup];

  function showPage(p) {
    closeLayer();
    PAGES.forEach(function (x) { x.classList.toggle("hidden", x !== p); });
    screen.classList.toggle("hidden", !!p);
    ipad.classList.toggle("rv-blue-bar", p === pin);
    if (p === dash) dash.querySelector(".rv-upd").textContent = "Updated: " + stamp(new Date());
  }
  function showRegister() { showPage(null); }
  JJ.showDash = function () { showPage(dash); };

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stamp(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function clockTime(t) { return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
  function shortDay(t) { return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  function longDay(d) { return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }); }

  // ---- PIN screen: any 4 digits, then Login ----
  var digits = "";
  function drawPin() {
    pin.querySelector(".rv-pin-dots").innerHTML = digits.split("").map(function () { return "<i></i>"; }).join("");
    pin.querySelector('[data-k="login"]').classList.toggle("rv-dim", digits.length < 4);
  }
  pin.querySelector(".rv-keys").onclick = function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var k = b.dataset.k;
    if (k === "clock") return soon("Clock In/Out");
    if (k === "login") {
      if (digits.length < 4) return JJ.toast("Enter your PIN first (any 4 digits in practice)");
      digits = ""; drawPin(); setStaff(shiftStaff()); showPage(dash); return;
    }
    if (digits.length < 6) digits += k;
    drawPin();
  };
  pin.querySelector(".rv-refresh").onclick = function () { digits = ""; drawPin(); JJ.toast("Refreshed"); };
  document.addEventListener("keydown", function (e) {
    if (pin.classList.contains("hidden") || document.querySelector(".lock:not(.hidden)")) return;
    if (/^[0-9]$/.test(e.key) && digits.length < 6) { digits += e.key; drawPin(); }
    else if (e.key === "Backspace") { digits = digits.slice(0, -1); drawPin(); }
    else if (e.key === "Enter") pin.querySelector('[data-k="login"]').click();
  });

  function logOut() {
    if ((JJ.mode() || "register") !== "register") return JJ.toast("Logging out is only in the Register tab");
    digits = ""; drawPin(); showPage(pin);
  }
  document.querySelector('.menu-tools [title="Log out"]').onclick = logOut;
  dash.querySelector(".rv-out").onclick = logOut;

  // ---- dashboard tiles ----
  dash.addEventListener("click", function (e) {
    var s = e.target.closest("[data-soon]"); if (s) return soon(s.dataset.soon);
    var t = e.target.closest("[data-go]"); if (!t) return;
    var go = t.dataset.go;
    if (go === "New Order") return showRegister();
    if (go === "Orders") return ordersPop(t);
    if (go === "Reports") return financials(t);
    if (go === "Return") return returnDialog();
    if (go === "Product Setup") return openSetup();
    if (go === "Invoices") return invoices();
    if (go === "Reward Cards") return cardSheet("Rewards Card", "Enter or Scan Rewards Card Barcode");
    if (go === "Gift Cards") return cardSheet("Gift Card", "Enter or Swipe Gift Card");
    if (go === "Store Credit") return storeCredit();
    soon(go);
  });

  // ------------------------------------------------------------------
  //  Pop-ups (drawn on one layer over the iPad screen)
  // ------------------------------------------------------------------
  function openLayer(html, cls, onShade) {
    layer.className = "rv-layer " + (cls || "");
    layer.innerHTML = html;
    layer.onclick = function (e) { if (e.target === layer && onShade !== false) closeLayer(); };
    return layer;
  }
  function closeLayer() { layer.className = "rv-layer hidden"; layer.innerHTML = ""; }

  // Popover beside the button that opened it (positions in % of the iPad width/height)
  function popAt(anchor, html, cls) {
    var L = openLayer('<div class="rv-pop ' + (cls || "") + '">' + html + '</div>', "rv-clear");
    var box = L.firstChild, r = anchor.getBoundingClientRect(), ir = ipad.getBoundingClientRect();
    var left = r.left - ir.left - box.offsetWidth - ir.width * 0.006;
    if (left < ir.width * 0.02) left = r.right - ir.left - box.offsetWidth / 2;    // under the button when there's no room beside it
    left = Math.max(ir.width * 0.02, Math.min(left, ir.width - box.offsetWidth - ir.width * 0.02));
    box.style.left = (left / ir.width * 100) + "%";
    return box;
  }

  // ---- Orders ----
  var ordersTab = "Today";
  function ordersPop(anchor) {
    var box = popAt(anchor, "", "rv-orders");
    function draw() {
      var q = (box.querySelector("input") || {}).value || "";
      var openList = open.no ? [{ no: open.no, total: open.total, time: open.opened, staff: staff, open: true }] : [];
      var todayList = openList.concat(paid.slice().reverse());
      var list = ordersTab === "Open" ? openList : todayList;
      if (q) list = list.filter(function (o) { return String(o.no).indexOf(q) >= 0; });
      box.innerHTML =
        '<div class="rv-pop-head"><span></span><span class="rv-pop-title">Orders</span><button class="rv-dots" data-soon="Order options">•••</button></div>' +
        '<label class="rv-searchbox rv-in-pop">' + ICON.search + '<input placeholder="Order ID, Customer" value="' + esc(q) + '"></label>' +
        '<div class="rv-seg">' + ["Open", "Today", "All"].map(function (t) {
          var n = t === "Open" ? openList.length : todayList.length;
          return '<button class="' + (t === ordersTab ? "on" : "") + '" data-tab="' + t + '">' + t + ' <span class="rv-count">' + n + '</span></button>';
        }).join("") + '</div>' +
        '<button class="rv-prow" data-soon="Invoices list"><span>Invoices</span><span class="rv-muted">0 ' + ICON.chev + '</span></button>' +
        '<div class="rv-sec">ORDERS</div>' +
        '<div class="rv-olist">' + (list.length ? list.map(function (o) {
          return '<div class="rv-order' + (o.open ? " open" : "") + '" data-no="' + o.no + '">' +
            '<div><div class="rv-ono">Order # ' + o.no + '</div>' + ICON.person + '<div class="rv-muted">Take Out | ' + shortDay(o.time) + ' • ' + clockTime(o.time) + '</div></div>' +
            '<div class="rv-oright">' + (o.open ? '<div class="rv-due">' + JJ.money(o.total) + '</div>' : '<div class="rv-paid">PAID</div>') +
            '<div>' + JJ.money(o.total) + '</div><div class="rv-faint">' + esc(o.staff) + '</div></div></div>';
        }).join("") : '<div class="rv-empty">No orders</div>') + '</div>';
      var inp = box.querySelector("input");
      inp.oninput = function () { draw(); var i = box.querySelector("input"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
    }
    box.onclick = function (e) {
      var t = e.target.closest("[data-tab]"); if (t) { ordersTab = t.dataset.tab; return draw(); }
      var s = e.target.closest("[data-soon]"); if (s) return soon(s.dataset.soon);
      var o = e.target.closest(".rv-order");
      if (o && o.classList.contains("open")) { closeLayer(); showRegister(); }
      else if (o) JJ.toast("Opening a paid order isn't simulated yet");
    };
    draw();
  }
  ordersBtn.onclick = function () { ordersPop(ordersBtn); };

  // ---- Order Details (tap the order number) ----
  document.querySelector(".order-title").onclick = function () {
    var now = new Date(open.opened || Date.now());
    var no = open.no || "";
    var L = openLayer(
      '<div class="rv-dlg rv-details">' +
        '<div class="rv-dlg-head">Order #' + no + ' Details</div>' +
        '<div class="rv-details-body">' +
          '<button class="rv-link rv-addcust" data-soon="Add Customer">' + ICON.person + 'Add Customer</button>' +
          '<div class="rv-details-cols">' +
            '<div>' + drow("Dining Option", "To Go Order") + drow("Pick Up", "Select a Time") + drow("Order Notes", "Add") + '</div>' +
            '<div>' + drow("Discount(s):", "Add") + drow("Order Total", JJ.money(open.total), 1) + drow("Tip Amount:", "$0.00", 1) + drow("Payments", "None", 1) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rv-details-foot"><span class="rv-faint">Opened: ' + (now.getMonth() + 1) + "/" + now.getDate() + "/" + String(now.getFullYear()).slice(2) + ", " + clockTime(now) + ' | ' + shiftName() + '</span><button class="rv-obtn rv-done">Done</button></div>' +
      '</div>', "rv-shade", false);
    L.onclick = function (e) {
      if (e.target.closest(".rv-done")) return closeLayer();
      var s = e.target.closest("[data-soon]"); if (s) soon(s.dataset.soon);
    };
  };
  function drow(label, val, plain) {
    return '<div class="rv-drow"><span>' + label + '</span>' + (plain ? '<span class="rv-faint">' + val + '</span>' : '<button class="rv-link" data-soon="' + label.replace(/[:()s]+$/, "") + '">' + val + '</button>') + '</div>';
  }

  // ---- Reports: Financials > Payment Log / Sales Report ----
  var sales = { include: "All Employees (Aggregate)", tab: "Employees", toggles: {} };
  var SALES_OPTS = ["Open/Unpaid Orders", "Product Data by Class", "Product Data by Category", "Product Data by Subcategory", "Local Data", "Hourly Sales", "Labor"];
  function financials(anchor) {
    var box = popAt(anchor, "", "rv-fin");
    var view = "fin";
    function head(back, title, right) {
      return '<div class="rv-pop-head' + (back ? ' rv-left-head' : '') + '">' + (back ? '<button class="rv-link rv-back" data-view="' + back[1] + '">' + ICON.back + back[0] + '</button>' : '<span></span>') +
        '<span class="rv-pop-title">' + title + '</span>' + (right || '<span></span>') + '</div>';
    }
    function icons(what) { return '<span class="rv-icons"><button data-soon="Emailing the ' + what + '">' + ICON.mail + '</button><button data-soon="Printing the ' + what + '">' + ICON.print + '</button></span>'; }
    function draw() {
      var d = new Date(), d2 = new Date(d.getTime() + 864e5);
      if (view === "fin") box.innerHTML = head(null, "Financials") +
        '<div class="rv-frow"><span>Daily Cash Log</span>' + icons("Daily Cash Log") + '</div><div class="rv-desc">An itemized list of cash transactions, from starting cash to cash expected in till.</div>' +
        '<div class="rv-frow"><span>Daily Payment Summary</span>' + icons("Daily Payment Summary") + '</div><div class="rv-desc">Summarized payment totals for each payment type.</div>' +
        '<button class="rv-frow" data-view="paylog"><span>Payment Log</span>' + ICON.chev + '</button><div class="rv-desc">An itemized list of payments received, grouped by payment type.</div>' +
        '<button class="rv-frow" data-view="sales"><span>Sales Report</span>' + ICON.chev + '</button><div class="rv-desc">A comprehensive, configurable sales report. Includes summarized sales, discounts, voids, refunds, payments and liabilities data.</div>';
      if (view === "paylog") box.innerHTML = head(["Financials", "fin"], "Payment Log") +
        '<div class="rv-frow"><span>Date</span><span class="rv-faint">' + longDay(d) + '</span></div><div class="rv-sec">OPTIONS</div>' +
        ["All Employees (Aggregate)"].concat(EMPLOYEES).map(function (n) { return '<div class="rv-frow"><span>' + esc(n) + '</span>' + icons("Payment Log") + '</div>'; }).join("");
      if (view === "sales") box.innerHTML = head(["Financials", "fin"], "Sales Report", '<button class="rv-link rv-gen">Generate</button>') +
        '<button class="rv-frow"><span>Start</span><span class="rv-faint">' + longDay(d) + ' 12:00 AM ' + ICON.chev + '</span></button>' +
        '<button class="rv-frow"><span>End</span><span class="rv-faint">' + longDay(d2) + ' 12:00 AM ' + ICON.chev + '</span></button>' +
        '<div class="rv-gap"></div><button class="rv-frow" data-view="include"><span>Include</span><span class="rv-faint">' + esc(sales.include) + ' ' + ICON.chev + '</span></button>' +
        '<div class="rv-sec">OPTIONS</div>' +
        SALES_OPTS.map(function (o) { return '<div class="rv-frow"><span>' + o + '</span><button class="rv-switch' + (sales.toggles[o] ? " on" : "") + '" data-opt="' + o + '"></button></div>'; }).join("");
      if (view === "include") {
        var names = sales.tab === "Employees" ? ["All Employees (Aggregate)"].concat(EMPLOYEES) : ["All Stations (Aggregate)", "POS1"];
        box.innerHTML = head(["Sales Report", "sales"], "Include") +
          '<div class="rv-seg rv-seg2">' + ["Employees", "POS Stations"].map(function (t) { return '<button class="' + (t === sales.tab ? "on" : "") + '" data-itab="' + t + '">' + t + '</button>'; }).join("") + '</div><div class="rv-gap"></div>' +
          names.map(function (n) { return '<button class="rv-frow rv-pick" data-pick="' + esc(n) + '">' + (sales.include === n ? '<span class="rv-tick on">' + ICON.check + '</span>' : '<span class="rv-tick"></span>') + '<span>' + esc(n) + '</span></button>'; }).join("");
      }
    }
    box.onclick = function (e) {
      var v = e.target.closest("[data-view]"); if (v) { view = v.dataset.view; return draw(); }
      var s = e.target.closest("[data-soon]"); if (s) return soon(s.dataset.soon);
      var o = e.target.closest("[data-opt]"); if (o) { sales.toggles[o.dataset.opt] = !sales.toggles[o.dataset.opt]; return draw(); }
      var t = e.target.closest("[data-itab]"); if (t) { sales.tab = t.dataset.itab; return draw(); }
      var p = e.target.closest("[data-pick]"); if (p) { sales.include = p.dataset.pick; return draw(); }
      if (e.target.closest(".rv-gen")) return warning();
    };
    draw();
    function warning() {
      var w = el('<div class="rv-alert"><div class="rv-alert-title">WARNING!</div><div class="rv-alert-msg">There are open orders, and some of the orders have not synced to the server, so the Sales Summary report may be incomplete. Run anyway?</div>' +
        '<div class="rv-alert-btns"><button class="rv-obtn rv-cancel">Cancel</button><button class="rv-obtn rv-blueline rv-yes">Yes</button></div></div>');
      layer.appendChild(w);
      w.onclick = function (e) {
        if (e.target.closest(".rv-cancel")) w.remove();
        if (e.target.closest(".rv-yes")) { w.remove(); soon("The sales report"); }
      };
    }
  }

  // ---- Return ----
  function returnDialog() {
    var L = openLayer('<div class="rv-alert rv-return"><div class="rv-alert-title">Return</div><div class="rv-alert-msg">Do you have a receipt?</div>' +
      '<input class="rv-input" placeholder="Enter Order ID or Scan Receipt Barcode" autocomplete="off">' +
      '<div class="rv-alert-btns"><button class="rv-obtn rv-cancel">Cancel</button><button class="rv-obtn rv-blueline rv-norec">No Receipt</button><button class="rv-obtn rv-blueline rv-submit" disabled>Submit</button></div></div>', "rv-shade", false);
    var inp = L.querySelector("input"); inp.focus();
    inp.oninput = function () { L.querySelector(".rv-submit").disabled = !inp.value.trim(); };
    L.onclick = function (e) {
      if (e.target.closest(".rv-cancel")) closeLayer();
      if (e.target.closest(".rv-norec")) soon("Returns without a receipt");
      if (e.target.closest(".rv-submit")) {
        var found = paid.some(function (o) { return String(o.no) === inp.value.trim(); });
        JJ.toast(found ? "Found that order. Returns aren't simulated yet" : "No order with that number");
      }
    };
  }

  // ---- Gift Card / Rewards Card sheets and the Store Credit card number ----
  function cardSheet(title, ph) {
    var L = openLayer('<div class="rv-sheet"><div class="rv-pop-head"><button class="rv-link rv-cancel">Cancel</button><span class="rv-pop-title">' + title + '</span><button class="rv-link rv-next" disabled>Next</button></div>' +
      '<input class="rv-input rv-sheet-in" placeholder="' + ph + '" autocomplete="off"></div>', "rv-shade", false);
    var inp = L.querySelector("input"); inp.focus();
    inp.oninput = function () { L.querySelector(".rv-next").disabled = !inp.value.trim(); };
    L.onclick = function (e) {
      if (e.target.closest(".rv-cancel")) closeLayer();
      if (e.target.closest(".rv-next") && inp.value.trim()) soon(title + "s");
    };
  }
  function storeCredit() {
    var L = openLayer('<div class="rv-alert rv-credit"><div class="rv-alert-title">Enter Card Number</div><input class="rv-input" autocomplete="off">' +
      '<div class="rv-alert-btns"><button class="rv-obtn rv-cancel">Cancel</button><button class="rv-obtn rv-blueline rv-next">Next</button></div></div>', "rv-shade", false);
    var inp = L.querySelector("input"); inp.focus();
    L.onclick = function (e) {
      if (e.target.closest(".rv-cancel")) closeLayer();
      if (e.target.closest(".rv-next")) inp.value.trim() ? soon("Store credit") : inp.focus();
    };
  }

  // ---- Invoices ----
  function invoices() {
    var L = openLayer('<div class="rv-inv"><div class="rv-inv-head"><span>Outstanding Invoices</span><label class="rv-searchbox">' + ICON.search + '<input placeholder="Search by Invoice ID, Customer Name, Employee Name" autocomplete="off"></label></div>' +
      '<div class="rv-inv-cols"><span>Invoice #</span><span>Customer</span><span class="rv-blue">Date Opened ▾</span><span>Employee Name</span><span>Total</span></div><div class="rv-inv-list"></div>' +
      '<div class="rv-inv-foot"><span class="rv-seg rv-seg2"><button class="on">Local Data</button><button>From Server</button></span><button class="rv-obtn" data-soon="Converting invoices">Convert Today\'s Due Invoices to Orders</button><button class="rv-obtn rv-cancel">Cancel</button></div></div>', "rv-shade", false);
    L.onclick = function (e) {
      if (e.target.closest(".rv-cancel")) return closeLayer();
      var s = e.target.closest("[data-soon]"); if (s) return soon(s.dataset.soon);
      var b = e.target.closest(".rv-seg button");
      if (b) { L.querySelectorAll(".rv-seg button").forEach(function (x) { x.classList.toggle("on", x === b); }); }
    };
  }

  // ---- Product Setup: categories, then a category's items; tap an item to see its details ----
  var setupCat = null;
  function openSetup() { setupCat = null; setup.querySelector("input").value = ""; setup.querySelector(".rv-setup-info").innerHTML = ""; drawSetup(); showPage(setup); }
  function allItems(node, path, out) {
    (node.children || []).forEach(function (c) {
      if (c.type === "folder") allItems(c, path.concat(c.name), out);
      else out.push({ item: c, path: path });
    });
    return out;
  }
  function drawSetup() {
    var grid = setup.querySelector(".rv-cat-grid"), crumb = setup.querySelector(".rv-setup-crumb");
    var q = setup.querySelector("input").value.trim().toLowerCase();
    crumb.classList.toggle("hidden", setupCat === null && !q);
    if (q) {
      var hits = [];
      JJ.tree.forEach(function (f) { allItems(f, [f.name], hits); });
      hits = hits.filter(function (h) { return (h.item.name + " " + ((JJ.items[h.item.id] || {}).full || "")).toLowerCase().indexOf(q) >= 0; });
      crumb.innerHTML = hits.length + " found";
      grid.innerHTML = hits.slice(0, 60).map(itemTile).join("");
      return;
    }
    if (setupCat === null) {
      grid.innerHTML = CATEGORIES.map(function (c, i) { return '<button class="rv-cat ' + c[1] + '" data-cat="' + i + '">' + esc(c[0]) + '</button>'; }).join("") +
        '<button class="rv-cat add" data-soon="Add Category"><b>+</b><i>C</i><span>Add Category</span></button>';
      return;
    }
    var c = CATEGORIES[setupCat], folder = JJ.tree[c[2]], items = folder ? allItems(folder, [folder.name], []) : [];
    crumb.innerHTML = '<button class="rv-link rv-allcats">' + ICON.back + 'Categories</button> <span>' + esc(c[0]) + '</span>';
    grid.innerHTML = items.length ? items.map(itemTile).join("") : '<div class="rv-empty">No items in this category yet</div>';
  }
  function itemTile(h, i) { return '<button class="rv-cat rv-item ' + (h.item.price > 0 ? "" : "rv-noprice") + '" data-item="' + esc(h.item.id) + '" data-path="' + esc(h.path.join(" / ")) + '">' + esc(h.item.name) + '</button>'; }
  setup.addEventListener("click", function (e) {
    if (e.target.closest(".rv-exit")) return showPage(dash);
    var s = e.target.closest("[data-soon]"); if (s) return soon(s.dataset.soon);
    if (e.target.closest(".rv-allcats")) { setupCat = null; return drawSetup(); }
    var c = e.target.closest("[data-cat]"); if (c) { setupCat = +c.dataset.cat; setup.querySelector(".rv-setup-info").innerHTML = ""; return drawSetup(); }
    var it = e.target.closest("[data-item]");
    if (it) {
      var item = JJ.items[it.dataset.item] || {};
      setup.querySelector(".rv-setup-info").innerHTML =
        '<div class="rv-info-name">' + esc(item.full || item.name || it.textContent) + '</div>' +
        '<div class="rv-drow"><span>Button</span><span class="rv-faint">' + esc(it.textContent) + '</span></div>' +
        '<div class="rv-drow"><span>Price</span><span class="rv-faint">' + (item.price > 0 ? JJ.money(item.price) : "not known yet") + '</span></div>' +
        (item.barcode ? '<div class="rv-drow"><span>Barcode</span><span class="rv-faint">' + esc(item.barcode) + '</span></div>' : "") +
        '<div class="rv-drow"><span>Folder</span><span class="rv-faint">' + esc(it.dataset.path) + '</span></div>';
    }
  });
  setup.querySelector("input").oninput = drawSetup;

  // Leaving the Register tab (or switching tabs) always comes back to the order screen.
  JJ.onModeRevel = function () { showRegister(); };

  drawPin();
  setStaff(staff);
})();
