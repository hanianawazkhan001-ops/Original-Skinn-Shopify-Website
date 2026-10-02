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
  function addToBag(variantList, name, btn){
    var items = String(variantList || '').split(',').filter(Boolean).map(function(id){ return {id: Number(id), quantity: 1}; });
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

  document.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.quickadd, .concern-add') : null;
    if(!btn || !btn.dataset.variants) return;
    e.preventDefault();
    var list = btn.dataset.variants;
    var card = btn.closest('.concern-card');
    var extra = card ? card.querySelector('.concern-night') : null;
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
