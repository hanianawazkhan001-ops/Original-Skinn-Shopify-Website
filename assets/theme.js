/* Original Skinn theme — behaviour copied from the test site (index.html). */
(function(){
  // ---- slide-out menu ----
  var body = document.body;
  var openBtn = document.getElementById('menuOpenBtn');
  var closeBtn = document.getElementById('menuClose');
  var overlay = document.getElementById('menuOverlay');
  var drawer = document.getElementById('menuDrawer');

  function openMenu(){
    body.classList.add('menu-open');
    if(drawer) drawer.setAttribute('aria-hidden','false');
    if(overlay) overlay.setAttribute('aria-hidden','false');
  }
  function closeMenu(){
    body.classList.remove('menu-open');
    if(drawer) drawer.setAttribute('aria-hidden','true');
    if(overlay) overlay.setAttribute('aria-hidden','true');
  }
  if(openBtn) openBtn.addEventListener('click', openMenu);
  if(closeBtn) closeBtn.addEventListener('click', closeMenu);
  if(overlay) overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });
  window.OS = window.OS || {};
  window.OS.closeMenu = closeMenu;

  // ---- small message bubble (bottom right) ----
  var toastTimer;
  window.OS.notify = function(msg){
    var t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
  };

  // ---- links that jump to a section further down the page, below the fixed header ----
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if(!a) return;
    var id = a.getAttribute('href').slice(1);
    if(!id) return;
    var el = document.getElementById(id);
    if(!el) return;
    e.preventDefault();
    var hdr = document.querySelector('.header');
    var ann = document.querySelector('.announcement');
    var offset = (hdr ? hdr.getBoundingClientRect().bottom : 0) + 8;
    if(!hdr && ann) offset = ann.getBoundingClientRect().bottom + 8;
    window.scrollTo({top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior:'smooth'});
    closeMenu();
  });
})();

// ---- add to bag (Quick add, ritual buttons) using Shopify's cart ----
(function(){
  var root = (window.Shopify && Shopify.routes && Shopify.routes.root) ? Shopify.routes.root : '/';
  function setCount(n){
    var el = document.getElementById('bagCount');
    if(el) el.textContent = n;
  }
  // props (optional): {variantId: {"Salt scrub": "...", ...}} — the products picked inside a bundle
  function addToBag(variantList, name, btn, props){
    var counts = {}, order = [];
    String(variantList || '').split(',').filter(Boolean).forEach(function(id){ if(!counts[id]){ counts[id] = 0; order.push(id); } counts[id]++; });
    if(!props && btn && btn.dataset && btn.dataset.props){ try{ props = JSON.parse(btn.dataset.props); }catch(err){ props = null; } }
    var items = order.map(function(id){
      var item = {id: Number(id), quantity: counts[id]};
      if(props && props[id]) item.properties = props[id];
      return item;
    });
    if(!items.length){ window.OS.notify('Sorry, this isn’t available right now.'); return; }
    if(btn) btn.disabled = true;
    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({items: items})
    }).then(function(r){
      return r.json().then(function(data){ if(!r.ok) throw data; return data; });
    }).then(function(){
      return fetch(root + 'cart.js', {headers: {'Accept': 'application/json'}}).then(function(r){ return r.json(); });
    }).then(function(cart){
      setCount(cart.item_count);
      window.OS.notify((name || 'Item') + ' added to bag');
      document.dispatchEvent(new CustomEvent('os:cart-updated', {detail: cart}));
    }).catch(function(err){
      window.OS.notify((err && err.description) ? err.description : 'Sorry, that couldn’t be added. Please try again.');
    }).then(function(){ if(btn) btn.disabled = false; });
  }
  window.OS.addToBag = addToBag;

  // ---- bundles where the customer picks the products inside (snippets/bundle-choices) ----
  // readPicks: {"Salt scrub": "...", ..., "_items": "handle,handle"} from a chooser
  window.OS.readPicks = function(picker){
    if(!picker) return null;
    var p = {}, handles = [];
    picker.querySelectorAll('.bp-slot').forEach(function(slot){
      var r = slot.querySelector('input:checked');
      if(r){ p[slot.dataset.label] = r.value; handles.push(r.dataset.handle); }
    });
    p._items = handles.join(',');
    return p;
  };
  window.OS.picksMissing = function(picker){
    return picker.querySelectorAll('.bp-slot').length - picker.querySelectorAll('.bp-slot input:checked').length;
  };
  function showPick(slot){
    var r = slot.querySelector('input:checked');
    slot.querySelectorAll('.bp-opt').forEach(function(o){ o.classList.toggle('is-checked', !!(r && o.contains(r))); });
    var out = slot.querySelector('.bp-chosen');
    if(out) out.textContent = r ? r.dataset.short : '';
  }
  document.querySelectorAll('.bundle-pick').forEach(function(picker){
    var slots = Array.prototype.slice.call(picker.querySelectorAll('.bp-slot'));
    slots.forEach(function(slot, i){
      showPick(slot);
      slot.addEventListener('change', function(){
        showPick(slot);
        var r = slot.querySelector('input:checked');
        picker.dispatchEvent(new CustomEvent('os:bundle-pick', {bubbles: true, detail: {index: i, input: r}}));
      });
    });
  });

  // ritual strip on a shop page: "Or choose your own scents" opens the chooser here, and the
  // step tiles above show what's picked
  document.querySelectorAll('.ritual-strip .rs-choose').forEach(function(btn){
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if(!panel) return;
    btn.addEventListener('click', function(){
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      if(open){
        var first = panel.querySelector('input:checked') || panel.querySelector('input');
        if(first) first.focus({preventScroll: true});
        var top = panel.getBoundingClientRect().top;
        if(top > window.innerHeight - 120) panel.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      }
    });
    var strip = btn.closest('.ritual-strip');
    var tiles = strip ? strip.querySelectorAll('.rs-steps .rs-tile') : [];
    panel.addEventListener('os:bundle-pick', function(e){
      var picker = panel.querySelector('.bundle-pick');
      var slots = picker ? picker.querySelectorAll('.bp-slot') : [];
      var r = e.detail.input;
      if(!r || tiles.length !== slots.length) return;
      var tile = tiles[e.detail.index];
      if(!tile) return;
      var img = tile.querySelector('.rs-img img');
      if(img && r.dataset.cardImg) img.src = r.dataset.cardImg;
      var name = tile.querySelector('.rs-name');
      if(name) name.textContent = r.dataset.full;
      var price = tile.querySelector('.rs-price');
      if(price && r.dataset.price) price.textContent = r.dataset.price;
      tile.querySelectorAll('a').forEach(function(a){ a.setAttribute('href', r.dataset.url); });
      if(r.dataset.variant) tile.dataset.variant = r.dataset.variant;
      tile.classList.remove('is-updated'); void tile.offsetWidth; tile.classList.add('is-updated');
    });
  });
  function bundleVariant(btn, both, label){
    var map = {};
    try{ map = JSON.parse(btn.dataset.bundle) || {}; }catch(err){ return ''; }
    var keys = Object.keys(map);
    if(!keys.length) return '';
    if(both && btn.dataset.bundleUp && map[btn.dataset.bundleUp]) return String(map[btn.dataset.bundleUp]);
    if(label && map[label]) return String(map[label]);
    return String(map[keys[0]]);
  }

  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.quickadd, .concern-add, .card-add, .rs-add, .cr-add, .cs-add') : null;
    if(!btn) return;
    var list = btn.dataset.variants || '';
    var strip = (btn.classList.contains('rs-add') && !list) ? btn.closest('.ritual-strip') : null;
    if(strip){
      // a ritual strip adds the product shown in each step (and the other choice too, if ticked)
      var ids = [];
      strip.querySelectorAll('.rs-tile[data-variant]').forEach(function(t){ ids.push(t.dataset.variant); });
      var both = strip.querySelector('.rs-both');
      var sw = strip.querySelector('.rs-tile[data-variant-b]');
      if(both && both.checked && sw){
        ids.push(sw.dataset.variant === sw.dataset.variantA ? sw.dataset.variantB : sw.dataset.variantA);
      }
      list = ids.join(',');
    }
    var card = btn.closest('.concern-card');
    var extra = card ? card.querySelector('.concern-night') : null;
    if(btn.dataset.bundle){
      // a ritual bundle: add one item at the ritual price (Day / Night / Day & Night etc.)
      var stripEl = btn.closest('.ritual-strip');
      var both = (extra && extra.checked) || !!(stripEl && stripEl.querySelector('.rs-both:checked'));
      var nameEl = stripEl ? stripEl.querySelector('.rs-var-name') : null;
      var bv = bundleVariant(btn, both, nameEl ? nameEl.textContent.trim() : '');
      if(bv){
        e.preventDefault();
        var picker = stripEl ? stripEl.querySelector('.bundle-pick') : null, props = null;
        if(picker){
          if(window.OS.picksMissing(picker) > 0){ window.OS.notify('Please choose a product for each step.'); return; }
          props = {}; props[bv] = window.OS.readPicks(picker);
        }
        addToBag(bv, btn.dataset.product, btn, props);
        return;
      }
    }
    if(!list) return;
    e.preventDefault();
    if(extra && extra.checked && extra.dataset.variant) list += ',' + extra.dataset.variant;
    addToBag(list, btn.dataset.product, btn);
  });

  // Face Ritual: "Add Night Moisturiser & Serum" checkbox changes the price and button wording
  document.querySelectorAll('.concern-night').forEach(function(box){
    var card = box.closest('.concern-card');
    var btn = card.querySelector('.concern-add');
    var price = card.querySelector('.concern-price');
    var base = {price: price.innerHTML, label: btn.textContent, name: btn.dataset.product};
    box.addEventListener('change', function(){
      if(box.checked){
        price.innerHTML = box.dataset.price;
        btn.textContent = box.dataset.label;
        btn.dataset.product = box.dataset.name;
      } else {
        price.innerHTML = base.price;
        btn.textContent = base.label;
        btn.dataset.product = base.name;
      }
    });
  });
})();

// ---- shop pages: ritual strip Day/Night choice, sort and filter pills (copied from the test site) ----
(function(){
  document.querySelectorAll('.ritual-strip').forEach(function(strip){
    var tile = strip.querySelector('.rs-tile[data-variant-b]');
    var btn = strip.querySelector('.rs-add');
    var both = strip.querySelector('.rs-both');
    var total = strip.querySelector('.rs-total');
    var small = strip.querySelector('.rs-small');
    var other = strip.querySelector('.rs-other');
    if(!btn) return;
    var opts = tile ? tile.querySelectorAll('.rs-opt') : [];
    var varName = tile ? tile.querySelector('.rs-var-name') : null;
    function label(which){ var o = tile.querySelector('.rs-opt[data-variant="' + which + '"]'); return o ? o.textContent : ''; }
    function refresh(){
      if(both && both.checked && btn.dataset.upName){
        total.innerHTML = btn.dataset.upTotal;
        if(small) small.textContent = btn.dataset.upSmall;
        btn.textContent = btn.dataset.upLabel; btn.dataset.product = btn.dataset.upName;
      } else {
        total.innerHTML = btn.dataset.baseTotal;
        if(small) small.textContent = btn.dataset.baseSmall;
        btn.textContent = btn.dataset.baseLabel;
        btn.dataset.product = btn.dataset.baseName + (varName ? ' (' + varName.textContent + ')' : '');
      }
    }
    Array.prototype.forEach.call(opts, function(o){
      o.addEventListener('click', function(){
        Array.prototype.forEach.call(opts, function(x){ x.classList.remove('active'); });
        o.classList.add('active');
        var v = o.dataset.variant; // 'a' or 'b'
        var isA = v === 'a';
        varName.textContent = label(v);
        if(other) other.textContent = label(isA ? 'b' : 'a');
        tile.dataset.variant = isA ? tile.dataset.variantA : tile.dataset.variantB;
        var img = tile.querySelector('.rs-img img');
        if(img) img.src = isA ? tile.dataset.imgA : tile.dataset.imgB;
        tile.querySelectorAll('a').forEach(function(l){ l.setAttribute('href', isA ? tile.dataset.urlA : tile.dataset.urlB); });
        refresh();
      });
    });
    if(both) both.addEventListener('change', refresh);
    if(tile || both) refresh();
  });

  var sel = document.querySelector('.shop-shell #sortProducts');
  var grid = document.querySelector('.shop-grid');
  if(sel && grid){
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.shop-card'));
    sel.addEventListener('change', function(){
      var mode = sel.value;
      var sorted = cards.slice().sort(function(a,b){
        if(mode === 'price-low') return (+a.dataset.price) - (+b.dataset.price);
        if(mode === 'price-high') return (+b.dataset.price) - (+a.dataset.price);
        if(mode === 'az') return a.dataset.name.localeCompare(b.dataset.name);
        return (+a.dataset.order) - (+b.dataset.order);
      });
      sorted.forEach(function(c){ grid.appendChild(c); });
    });
  }

  var pills = Array.prototype.slice.call(document.querySelectorAll('.filter-pill'));
  var count = document.getElementById('productCount');
  if(pills.length && grid){
    var all = Array.prototype.slice.call(grid.querySelectorAll('.shop-card'));
    pills.forEach(function(pill){
      pill.addEventListener('click', function(){
        pills.forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        var filter = pill.dataset.filter;
        var visible = 0;
        all.forEach(function(card){
          var show = filter === 'all' || (' ' + card.dataset.category + ' ').indexOf(' ' + filter + ' ') !== -1;
          card.hidden = !show;
          if(show) visible++;
        });
        if(count) count.textContent = visible + (visible === 1 ? ' product' : ' products');
      });
    });
  }
})();

// ---- product page: photos, sizes, quantity, Add to bag, Complete your ritual (copied from the test site) ----
(function(){
  var add = document.getElementById('pdAdd');
  if(!add) return;
  var main = document.getElementById('mainProductImage');
  var priceEl = document.getElementById('pdPrice');
  var sizeEl = document.getElementById('pdSize');
  var input = document.getElementById('qtyInput');
  document.querySelectorAll('#pdThumbs .product-thumb').forEach(function(t){
    t.addEventListener('click', function(){
      if(main && t.dataset.src) main.src = t.dataset.src;
      document.querySelectorAll('#pdThumbs .product-thumb').forEach(function(b){ b.classList.remove('active'); });
      t.classList.add('active');
    });
  });
  document.querySelectorAll('#pdSizes .pd-size').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('#pdSizes .pd-size').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      add.dataset.variant = b.dataset.variant;
      if(priceEl) priceEl.textContent = b.dataset.price;
      if(sizeEl) sizeEl.textContent = b.dataset.size;
      add.textContent = 'Add to bag · ' + b.dataset.price;
    });
  });
  function qty(){ var n = parseInt(input && input.value || '1', 10); return (n && n > 0) ? n : 1; }
  var minus = document.getElementById('qtyMinus'), plus = document.getElementById('qtyPlus');
  if(minus) minus.addEventListener('click', function(){ input.value = Math.max(1, qty() - 1); });
  if(plus) plus.addEventListener('click', function(){ input.value = qty() + 1; });
  if(input) input.addEventListener('change', function(){ input.value = qty(); });
  // bundles where the customer picks the products inside (snippets/bundle-choices)
  var picker = document.getElementById('pdBundle');
  if(picker){
    // show the picked product's photo
    picker.addEventListener('os:bundle-pick', function(e){
      var r = e.detail.input;
      if(r && main && r.dataset.img){
        main.src = r.dataset.img;
        document.querySelectorAll('#pdThumbs .product-thumb').forEach(function(b){ b.classList.remove('active'); });
      }
    });
  }
  add.addEventListener('click', function(){
    var n = qty(), list = [];
    for(var i = 0; i < n; i++) list.push(add.dataset.variant);
    var props = null;
    if(picker){
      if(window.OS.picksMissing(picker) > 0){ window.OS.notify('Please choose a product for each step.'); return; }
      props = {}; props[add.dataset.variant] = window.OS.readPicks(picker);
    }
    window.OS.addToBag(list.join(','), add.dataset.product, add, props);
  });
})();

// ---- bag page: change quantities, remove, order note, ritual suggestion (Shopify's cart) ----
(function(){
  if(!document.getElementById('osCart')) return;
  var root = (window.Shopify && Shopify.routes && Shopify.routes.root) ? Shopify.routes.root : '/';
  var JSON_HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'};
  function shell(){ return document.getElementById('osCart'); }
  function setCount(n){ var el = document.getElementById('bagCount'); if(el) el.textContent = n; }
  function asJson(r){ return r.json().then(function(d){ if(!r.ok) throw d; return d; }); }
  // fetch the bag section again from Shopify and swap it in, so every number comes from the real cart
  function rerender(){
    var cur = shell();
    if(!cur) return Promise.resolve();
    var noteOpen = !!cur.querySelector('.basket-note[open]');
    return fetch(root + 'cart?section_id=' + encodeURIComponent(cur.dataset.section))
      .then(function(r){ return r.text(); })
      .then(function(html){
        var fresh = new DOMParser().parseFromString(html, 'text/html').getElementById('osCart');
        var now = shell();
        if(fresh && now){
          if(noteOpen){ var d = fresh.querySelector('.basket-note'); if(d) d.open = true; }
          now.parentNode.replaceChild(fresh, now);
        }
      });
  }
  function change(key, quantity){
    var s = shell();
    if(s) s.classList.add('is-updating');
    return fetch(root + 'cart/change.js', {method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({id: key, quantity: quantity})})
      .then(asJson)
      .then(function(cart){ setCount(cart.item_count); return rerender(); })
      .catch(function(err){ window.OS.notify((err && err.description) ? err.description : 'Sorry, your bag couldn’t be updated. Please try again.'); return rerender(); })
      .then(function(){ var s2 = shell(); if(s2) s2.classList.remove('is-updating'); });
  }
  function qtyOf(item){
    var input = item.querySelector('.basket-qty input');
    var n = parseInt(input && input.value || '1', 10);
    return (n && n > 0) ? n : 1;
  }
  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('#osCart .qty-minus, #osCart .qty-plus, #osCart .remove-item') : null;
    if(!btn) return;
    var item = btn.closest('.basket-item');
    if(!item || !item.dataset.key) return;
    var q = qtyOf(item);
    if(btn.classList.contains('remove-item')) return change(item.dataset.key, 0);
    var next = btn.classList.contains('qty-plus') ? q + 1 : Math.max(1, q - 1);
    if(next === q) return;
    item.querySelector('.basket-qty input').value = next;
    change(item.dataset.key, next);
  });
  document.addEventListener('change', function(e){
    var t = e.target;
    if(t.matches && t.matches('#osCart .basket-qty input')){
      var item = t.closest('.basket-item');
      if(item && item.dataset.key){ var q = qtyOf(item); t.value = q; change(item.dataset.key, q); }
    } else if(t.id === 'cartNote'){
      fetch(root + 'cart/update.js', {method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({note: t.value})});
    }
  });
  // something was added (e.g. the "Complete your ritual" button): show the new bag
  document.addEventListener('os:cart-updated', function(){ rerender(); });
})();

// ---- scroll-reveal: elements slide/rise/pop into place as you scroll ----
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion || !('IntersectionObserver' in window)){
    return;
  }

  function stagger(list, stepMs, maxMs){
    Array.prototype.forEach.call(list, function(el, i){
      el.style.transitionDelay = Math.min(i * stepMs, maxMs) + 'ms';
    });
  }

  document.querySelectorAll('.section-head, .review, .basket-item').forEach(function(el){
    el.classList.add('reveal');
  });

  document.querySelectorAll('.categories').forEach(function(grid){
    var tiles = grid.querySelectorAll('.cat');
    Array.prototype.forEach.call(tiles, function(el, i){
      el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
    });
    stagger(tiles, 90, 360);
  });

  document.querySelectorAll('.products, .shop-grid, .approved-card-grid').forEach(function(grid){
    var cards = grid.querySelectorAll('.product, .shop-card, .approved-card');
    cards.forEach(function(el){ el.classList.add('reveal-scale'); });
    stagger(cards, 80, 320);
  });

  document.querySelectorAll('.steps').forEach(function(list){
    var steps = list.querySelectorAll('.step');
    steps.forEach(function(el){ el.classList.add('reveal-left'); });
    stagger(steps, 110, 330);
  });

  var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if(!targets.length) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  targets.forEach(function(el){ io.observe(el); });
})();
