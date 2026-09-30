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
