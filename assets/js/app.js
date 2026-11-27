/* ============================================================
   FireMC Store — front-end app (vanilla JS, hash routing)
   ============================================================ */
(function () {
  "use strict";

  var C = window.CATALOG;
  var store = C.store;

  var state = {
    username: localStorage.getItem("fm.username") || "",
    bedrock: localStorage.getItem("fm.bedrock") === "1",
    basket: JSON.parse(localStorage.getItem("fm.basket") || "[]"),
    pendingPkg: null,
    giftState: "idle"
  };

  function save() {
    localStorage.setItem("fm.username", state.username);
    localStorage.setItem("fm.bedrock", state.bedrock ? "1" : "0");
    localStorage.setItem("fm.basket", JSON.stringify(state.basket));
  }

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return n.toFixed(2); }

  function findCat(id) {
    for (var i = 0; i < C.categories.length; i++) if (C.categories[i].id === id) return C.categories[i];
    return null;
  }
  function findPkg(catId, pkgId) {
    var cat = findCat(catId);
    if (!cat) return null;
    for (var i = 0; i < cat.packages.length; i++) if (cat.packages[i].id === Number(pkgId)) return cat.packages[i];
    return null;
  }
  function pkgImg(pkg) { return store.imgBase + pkg.image; }
  function avatarUrl(name) {
    var n = (name || "").replace(/^\./, "");
    return "https://minotar.net/avatar/" + encodeURIComponent(n || "MHF_Question") + "/64";
  }

  /* ---------- basket ---------- */
  function basketCount() {
    return state.basket.reduce(function (a, b) { return a + b.qty; }, 0);
  }
  function basketTotal() {
    return state.basket.reduce(function (a, item) {
      var p = findPkg(item.cat, item.id);
      return a + (p ? p.price * item.qty : 0);
    }, 0);
  }
  function addToBasket(catId, pkg) {
    for (var i = 0; i < state.basket.length; i++) {
      if (state.basket[i].cat === catId && state.basket[i].id === pkg.id) { state.basket[i].qty++; save(); renderBasket(); updateBadge(); return; }
    }
    state.basket.push({ cat: catId, id: pkg.id, qty: 1 });
    save(); renderBasket(); updateBadge();
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------- modal (username) ---------- */
  function openModal(pendingPkg) {
    state.pendingPkg = pendingPkg || null;
    var modal = $("#username-modal");
    var input = $("#username-input");
    input.value = state.username || "";
    $(".avatar img", modal).src = state.username ? avatarUrl(state.username) : avatarUrl("");
    $(".avatar img", modal).onerror = function () { this.onerror = null; this.src = avatarUrl(""); };
    $("#bedrock-note").style.display = state.bedrock ? "block" : "none";
    $("#modal-error").textContent = "";
    modal.classList.add("open");
    setTimeout(function () { input.focus(); }, 60);
  }
  function closeModal() {
    $("#username-modal").classList.remove("open");
    state.pendingPkg = null;
  }
  function continueModal() {
    var input = $("#username-input");
    var raw = input.value.trim();
    var name = state.bedrock && raw.charAt(0) !== "." ? "." + raw : raw;
    var re = state.bedrock ? /^\.[A-Za-z0-9_]{1,16}$/ : /^[A-Za-z0-9_]{1,16}$/;
    if (!re.test(name)) {
      $("#modal-error").textContent = state.bedrock
        ? "Enter a Bedrock username (letters, numbers, underscore — no spaces)."
        : "Please enter a valid username (letters, numbers, underscore — no spaces).";
      return;
    }
    state.username = name;
    var pending = state.pendingPkg;
    save();
    closeModal();
    updateAccountChip();
    if (pending) {
      addToBasket(pending.cat, pending.pkg);
      toast(pending.pkg.name + " added to basket");
      openDrawer();
    } else {
      toast("Welcome, " + name.replace(/^\./, "") + "!");
    }
  }

  /* ---------- basket drawer ---------- */
  function openDrawer() { renderBasket(); $("#basket-drawer").classList.add("open"); $("#drawer-overlay").classList.add("show"); }
  function closeDrawer() { $("#basket-drawer").classList.remove("open"); $("#drawer-overlay").classList.remove("show"); }

  function renderBasket() {
    var wrap = $("#basket-items");
    if (!state.basket.length) {
      wrap.innerHTML =
        '<div class="basket-empty"><div class="flame">🔥</div><p>Your basket is empty.</p><p class="muted">Pick a package from the store to get started.</p></div>';
    } else {
      wrap.innerHTML = state.basket.map(function (item, idx) {
        var p = findPkg(item.cat, item.id);
        if (!p) return "";
        return (
          '<div class="basket-item">' +
            '<img class="thumb" src="' + pkgImg(p) + '" alt="">' +
            '<div class="bi-main">' +
              '<div class="bi-name">' + esc(p.name) + '</div>' +
              '<div class="bi-price">' + money(p.price) + " " + store.currency + '</div>' +
            '</div>' +
            '<div class="bi-qty">' +
              '<button class="qty-btn" data-action="qty-dec" data-idx="' + idx + '" aria-label="Decrease">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="qty-inc" data-idx="' + idx + '" aria-label="Increase">+</button>' +
            '</div>' +
            '<button class="bi-remove" data-action="qty-remove" data-idx="' + idx + '" aria-label="Remove">✕</button>' +
          '</div>'
        );
      }).join("");
    }
    $("#basket-total").textContent = money(basketTotal()) + " " + store.currency;
    var chip = $("#drawer-user");
    chip.innerHTML = state.username
      ? '<img src="' + avatarUrl(state.username) + '" alt="" onerror="this.style.visibility=\'hidden\'"><span>' + esc(state.username) + '</span><button class="link-btn" data-action="open-modal">change</button>'
      : '<span class="muted">No username set</span><button class="link-btn" data-action="open-modal">set username</button>';
  }
  function updateBadge() {
    var n = basketCount();
    var b = $("#basket-count");
    b.textContent = n;
    b.classList.toggle("none", n === 0);
    b.classList.remove("pulse");
    void b.offsetWidth;
    b.classList.add("pulse");
  }
  function updateAccountChip() {
    var chip = $("#account-chip");
    if (state.username) {
      chip.classList.add("has");
      chip.innerHTML = '<img src="' + avatarUrl(state.username) + '" alt="" onerror="this.style.visibility=\'hidden\'"><span>' + esc(state.username.replace(/^\./, "")) + '</span>';
    }
  }

  /* ---------- shared card renderer ---------- */
  function cardHtml(catId, pkg) {
    var label = pkg.action === "subscribe" ? "Subscribe" : "Add to cart";
    return (
      '<article class="card">' +
        '<div class="card-media"><img loading="lazy" src="' + pkgImg(pkg) + '" alt="' + esc(pkg.name) + '"></div>' +
        '<div class="card-body">' +
          '<h3 class="card-name">' + esc(pkg.name) + '</h3>' +
          '<div class="card-meta"><span class="badge">0% OFF</span>' +
            '<div class="card-price"><span class="amount">' + money(pkg.price) + '</span><span class="cur">' + store.currency + '</span></div>' +
          '</div>' +
        '</div>' +
        '<button class="btn card-btn" data-action="add" data-cat="' + catId + '" data-id="' + pkg.id + '">' + label + '</button>' +
      '</article>'
    );
  }

  /* ---------- views ---------- */
  function renderHome() {
    document.title = "FireMC | Welcome";
    setActiveCat(null);
    var cards = C.featured.map(function (f) {
      var p = findPkg(f.cat, f.id);
      return p ? cardHtml(f.cat, p) : "";
    }).join("");

    $("#view").innerHTML =
      '<section class="hero">' +
        '<p class="hero-kicker">' + esc(C.home.heroKicker) + '</p>' +
        '<h1 class="hero-title">FireMC <span>Store</span></h1>' +
        '<p class="hero-text">' + esc(C.home.heroText) + '</p>' +
        '<p class="hero-hint"><strong>' + esc(C.home.heroHint) + '</strong></p>' +
        '<div class="ip-row">' +
          '<button class="ip-pill" data-action="copy-ip" data-ip="' + store.javaIp + '"><span class="dot"></span>Java: ' + store.javaIp + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>' +
          '<button class="ip-pill" data-action="copy-ip" data-ip="' + store.bedrockIp + '"><span class="dot amber"></span>Bedrock: ' + store.bedrockIp + ' (port ' + store.bedrockPort + ')<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>' +
        '</div>' +
      '</section>' +

      '<h2 class="section-title">Featured Packages</h2>' +
      '<div class="grid">' + cards + '</div>' +

      '<div class="info-grid">' +
        '<article class="panel" id="support-card">' +
          '<h3><span class="p-icon">💬</span>Support</h3>' +
          '<p>' + esc(C.home.support.body[0]) + '</p>' +
          '<p><a class="mail" href="mailto:' + store.email + '">' + store.email + '</a></p>' +
          '<a class="btn ghost" href="' + C.home.support.url + '" target="_blank" rel="noopener">' + C.home.support.button + ' ↗</a>' +
        '</article>' +
        '<article class="panel">' +
          '<h3><span class="p-icon">🧾</span>Refund policy</h3>' +
          C.home.refund.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
        '</article>' +
      '</div>' +

      '<div class="terms-row">' +
        C.home.terms.map(function (t) {
          return '<a class="term-link" href="' + t.url + '" target="_blank" rel="noopener">' + esc(t.label) + '</a>';
        }).join("") +
      '</div>';
  }

  function renderCategory(cat) {
    document.title = "FireMC | " + cat.title;
    setActiveCat(cat.id);
    $("#view").innerHTML =
      '<section class="cat-head">' +
        '<h1 class="cat-title">' + esc(cat.title) + '</h1>' +
        cat.blurb.map(function (b) { return '<p class="cat-blurb">' + esc(b) + '</p>'; }).join("") +
      '</section>' +
      '<div class="grid">' + cat.packages.map(function (p) { return cardHtml(cat.id, p); }).join("") + '</div>';
  }

  function setActiveCat(id) {
    $$("#sidebar .cat-link").forEach(function (a) {
      a.classList.toggle("active", a.dataset.cat === id);
    });
  }

  /* ---------- router ---------- */
  function route() {
    var hash = location.hash || "#/";
    var m = hash.match(/^#\/category\/([a-z0-9-]+)$/i);
    var cat = m ? findCat(m[1]) : null;
    closeDrawer();
    if (cat) renderCategory(cat); else renderHome();
  }

  /* ---------- sidebar / static chrome ---------- */
  function renderSidebar() {
    var links =
      '<a class="cat-link home" href="#/" data-cat=""><span class="cat-icon">🔥</span>Fire</a>' +
      C.categories.map(function (c) {
        return '<a class="cat-link" href="' + c.href + '" data-cat="' + c.id + '"><span class="cat-icon">' + c.icon + '</span>' + esc(c.label) + '</a>';
      }).join("");
    $("#sidebar-cats").innerHTML = links;

    $("#giftcard").innerHTML =
      '<h4>Giftcard Balance</h4>' +
      '<div id="gift-body">' +
        '<button class="btn ghost small" data-action="gift-open">Check</button>' +
      '</div>';
  }

  function giftBody() {
    var el = $("#gift-body");
    if (state.giftState === "input") {
      el.innerHTML =
        '<input id="gift-code" class="input" placeholder="Giftcard code" autocomplete="off">' +
        '<div class="gift-btns"><button class="btn small" data-action="gift-check">Check balance</button>' +
        '<button class="btn ghost small" data-action="gift-back">Back</button></div>';
      $("#gift-code").focus();
    } else if (state.giftState === "result") {
      var code = $("#gift-body").dataset.code || "";
      el.innerHTML =
        '<div class="gift-result"><span class="muted">Card <strong>' + esc(code) + '</strong></span>' +
        '<div class="gift-balance">$0.00</div>' +
        '<span class="muted tiny">Balances are served by Tebex on the live store.</span>' +
        '<button class="btn ghost small" data-action="gift-back">Back</button></div>';
    } else {
      el.innerHTML = '<button class="btn ghost small" data-action="gift-open">Check</button>';
    }
  }

  /* ---------- global events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var a = t.dataset.action;

    if (a === "add") {
      var pkg = findPkg(t.dataset.cat, t.dataset.id);
      if (!pkg) return;
      if (!state.username) { openModal({ cat: t.dataset.cat, pkg: pkg }); return; }
      addToBasket(t.dataset.cat, pkg);
      toast(pkg.name + " added to basket");
      openDrawer();
    }
    else if (a === "open-modal") { e.preventDefault(); closeDrawer(); openModal(null); }
    else if (a === "close-modal") { closeModal(); }
    else if (a === "modal-continue") { continueModal(); }
    else if (a === "modal-bedrock") {
      state.bedrock = !state.bedrock;
      save();
      $("#bedrock-note").style.display = state.bedrock ? "block" : "none";
      $("#bedrock-toggle").textContent = state.bedrock ? "Java user?" : "Bedrock user?";
      var input = $("#username-input");
      if (state.bedrock && input.value.charAt(0) !== ".") input.value = "." + input.value;
      if (!state.bedrock) input.value = input.value.replace(/^\./, "");
      $("#modal-error").textContent = "";
    }
    else if (a === "open-basket") { openDrawer(); }
    else if (a === "close-basket") { closeDrawer(); }
    else if (a === "qty-inc") { state.basket[Number(t.dataset.idx)].qty++; save(); renderBasket(); updateBadge(); }
    else if (a === "qty-dec") {
      var it = state.basket[Number(t.dataset.idx)];
      it.qty--; if (it.qty <= 0) state.basket.splice(Number(t.dataset.idx), 1);
      save(); renderBasket(); updateBadge();
    }
    else if (a === "qty-remove") { state.basket.splice(Number(t.dataset.idx), 1); save(); renderBasket(); updateBadge(); }
    else if (a === "copy-ip") {
      var ip = t.dataset.ip;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ip).then(function () { toast("Copied " + ip + " to clipboard"); });
      } else { toast(ip); }
    }
    else if (a === "gift-open") { state.giftState = "input"; giftBody(); }
    else if (a === "gift-back") { state.giftState = "idle"; giftBody(); }
    else if (a === "gift-check") {
      var code = ($("#gift-code") ? $("#gift-code").value.trim() : "");
      if (!code) { toast("Enter a giftcard code first"); return; }
      $("#gift-body").dataset.code = code;
      state.giftState = "result"; giftBody();
    }
    else if (a === "scroll-support") {
      e.preventDefault();
      location.hash = "#/";
      setTimeout(function () {
        var el = $("#support-card");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
    if (e.key === "Enter" && $("#username-modal").classList.contains("open")) continueModal();
  });

  document.addEventListener("input", function (e) {
    if (e.target.id === "username-input") {
      var img = $("#username-modal .avatar img");
      var v = e.target.value.replace(/^\./, "");
      img.onerror = function () { this.onerror = null; this.src = avatarUrl(""); };
      img.src = avatarUrl(v || "MHF_Question");
      $("#modal-error").textContent = "";
    }
    if (e.target.id === "gift-code" && e.key === "Enter") { /* handled by keydown above */ }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "gift-code") {
      e.preventDefault();
      var code = e.target.value.trim();
      if (!code) { toast("Enter a giftcard code first"); return; }
      $("#gift-body").dataset.code = code;
      state.giftState = "result"; giftBody();
    }
  });

  /* ---------- boot ---------- */
  function boot() {
    $("#store-name").textContent = store.name + " Store";
    $("#year").textContent = new Date().getFullYear();
    renderSidebar();
    updateBadge();
    updateAccountChip();
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
