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
  var v = document.querySelector('video.bg-video');
  if (!v) return;
  v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
  function tryPlay() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  tryPlay();
  v.addEventListener('canplay', tryPlay, { once: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tryPlay(); });
  // If the browser blocked autoplay (e.g. iPhone Low Power Mode), start on the first tap or scroll
  ['touchstart', 'click', 'scroll', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (v.paused) tryPlay(); }, { once: true, passive: true });
  });
})();
