// Mobile menu toggle
(function () {
  var btn = document.querySelector('.menu-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('nav-open'); btn.setAttribute('aria-expanded', false); });
  });
})();

// Contact form: send in the background and show a message instead of leaving the page
(function () {
  var form = document.querySelector('form[data-ajax]');
  if (!form || !window.fetch) return;
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = 'Sending…';
    btn.disabled = true;
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok || d.success === false) throw new Error(d.message || ('HTTP ' + r.status));
        });
      })
      .then(function () {
        form.reset();
        status.className = 'form-status ok';
        status.textContent = 'Thanks! Your message is on its way — we’ll be in touch soon.';
      })
      .catch(function (err) {
        status.className = 'form-status err';
        status.textContent = 'Something went wrong' + (err && err.message ? ' (' + err.message + ')' : '') + '. Please email us directly instead.';
      })
      .finally(function () { btn.disabled = false; });
  });
})();

// Background video: make sure it starts on its own (some browsers need a nudge)
(function () {
  var vids = document.querySelectorAll('video[autoplay]');
  if (!vids.length) return;
  function tryPlay(v) { var b = v.closest('.feature-image'); if (b && b.dataset.userPaused === '1') return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function playAll() { vids.forEach(function (v) { if (v.paused) tryPlay(v); }); }
  vids.forEach(function (v) {
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
    tryPlay(v);
    v.addEventListener('canplay', function () { tryPlay(v); }, { once: true });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) playAll(); });
  // Keep trying as each video scrolls into view, and resume if the browser pauses it
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting && e.target.paused) tryPlay(e.target); }); });
    vids.forEach(function (v) { io.observe(v); });
  }
  vids.forEach(function (v) { v.addEventListener('pause', function () { if (!document.hidden) setTimeout(function () { tryPlay(v); }, 200); }); });
  // If the browser blocked autoplay (e.g. iPhone Low Power Mode), start on the first tap or scroll
  ['touchstart', 'click', 'scroll', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, playAll, { passive: true });
  });
})();

// Home page: make the transparent menu solid once you scroll past the video
(function () {
  var h = document.querySelector('.site-header.overlay');
  var hero = document.querySelector('.hero');
  if (!h || !hero) return;
  function upd() { h.classList.toggle('solid', window.scrollY > hero.offsetHeight - h.offsetHeight); }
  upd();
  window.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', upd);
})();

// Our Work videos: tap/click the video to pause or play; show a play button whenever one is paused
(function () {
  document.querySelectorAll('.feature-image').forEach(function (box) {
    var v = box.querySelector('video');
    var btn = box.querySelector('.play-btn');
    if (!v) return;
    function sync() { box.classList.toggle('is-paused', v.paused); }
    function play() { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    v.addEventListener('play', sync); v.addEventListener('playing', sync); v.addEventListener('pause', sync);
    v.addEventListener('click', function () { if (v.paused) { box.dataset.userPaused = ''; play(); } else { box.dataset.userPaused = '1'; v.pause(); } });
    if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); box.dataset.userPaused = ''; play(); });
    setTimeout(sync, 1200);
  });
})();

// Header video: reveal it only once it is really playing
(function () {
  document.querySelectorAll('.hero-video video').forEach(function (v) {
    var box = v.parentElement;
    function on() { box.classList.add('is-playing'); }
    v.addEventListener('playing', on);
    if (!v.paused && v.readyState > 2) on();
  });
})();
