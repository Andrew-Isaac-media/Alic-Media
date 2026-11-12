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

  // After the form is sent, swap the page over to the Calendly booking section
  function showBooking(book, data) {
    var widget = book.querySelector('.calendly-inline-widget');
    if (widget) {
      var url = widget.getAttribute('data-url');
      var name = data.get('name'), email = data.get('email');
      if (name) url += '&name=' + encodeURIComponent(name);
      if (email) url += '&email=' + encodeURIComponent(email);
      widget.setAttribute('data-url', url);
    }
    document.querySelectorAll('.page-hero, section.contact').forEach(function (el) { el.hidden = true; });
    book.hidden = false;
    book.classList.add('revealed');
    window.scrollTo(0, 0);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.async = true;
    document.body.appendChild(s);
  }
  var form = document.querySelector('form[data-ajax]');
  if (!form || !window.fetch) return;
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var boxes = form.querySelectorAll('input[name="service"]');
    if (boxes.length) {
      var picked = data.getAll('service');
      if (!picked.length) {
        status.className = 'form-status err';
        status.textContent = 'Please choose at least one service.';
        boxes[0].focus();
        return;
      }
      data.delete('service');
      data.append('Services', picked.join(', '));
    }
    status.className = 'form-status';
    status.textContent = 'Sending…';
    btn.disabled = true;
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok || d.success === false) throw new Error(d.message || ('HTTP ' + r.status));
        });
      })
      .then(function () {
        var book = document.getElementById('book');
        if (book && book.hidden) { showBooking(book, data); form.reset(); return; }
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
  document.querySelectorAll('.hero-video video, .proj-video video').forEach(function (v) {
    var box = v.parentElement;
    function on() { box.classList.add('is-playing'); }
    v.addEventListener('playing', on);
    v.addEventListener('timeupdate', function () { if (v.currentTime > 0) on(); });
    if (!v.paused && v.readyState > 2) on();
  });
})();

// Project page videos: sound on/off button (videos start muted so they can autoplay)
(function () {
  document.querySelectorAll('.proj-video').forEach(function (box) {
    var v = box.querySelector('video'), btn = box.querySelector('.sound-btn');
    if (!v || !btn) return;
    function sync() {
      var on = !v.muted;
      btn.setAttribute('aria-pressed', on);
      btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
      btn.querySelector('span').textContent = on ? 'Sound off' : 'Sound on';
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      v.muted = !v.muted;
      if (!v.muted && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      sync();
    });
    v.addEventListener('volumechange', sync);
    sync();
  });
})();


// Homepage showreel: rotate only between footage from our published projects.
// Keep a still-image fallback for autoplay-restricted browsers and reduced motion.
(function () {
  var reel = document.querySelector('.hero-showreel');
  if (!reel) return;
  var slides = Array.prototype.slice.call(reel.querySelectorAll('.hero-reel-slide'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!slides.length || reduceMotion) return;
  var current = 0, timer = null;
  var projectName = document.querySelector('.hero-project-name');
  var projectCount = document.querySelector('.hero-showcase-label span:last-child');
  function updateCaption(index) {
    if (projectName) projectName.textContent = slides[index].getAttribute('data-project') || '';
    if (projectCount) projectCount.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  }
  updateCaption(current);
  function activate(next) {
    if (document.hidden) return;
    var previous = slides[current], incoming = slides[next];
    if (previous === incoming) return;
    var video = incoming.querySelector('video');
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.preload = 'auto';
      video.load();
      var result = video.play();
      if (result && result.catch) result.catch(function () {});
    }
    incoming.classList.add('is-active');
    previous.classList.remove('is-active');
    current = next;
    updateCaption(current);
    window.setTimeout(function () {
      var oldVideo = previous.querySelector('video');
      if (oldVideo && !previous.classList.contains('is-active')) {
        oldVideo.pause();
        oldVideo.currentTime = 0;
      }
    }, 1450);
  }
  slides.forEach(function (slide) {
    var v = slide.querySelector('video');
    if (!v) return;
    v.addEventListener('playing', function () { slide.classList.add('is-playing'); });
    v.addEventListener('error', function () { slide.classList.remove('is-playing'); });
  });
  var first = slides[0].querySelector('video');
  if (first) {
    first.muted = true;
    first.defaultMuted = true;
    var firstPlay = first.play();
    if (firstPlay && firstPlay.catch) firstPlay.catch(function () {});
  }
  function start() {
    if (!timer) timer = window.setInterval(function () {
      if (!document.hidden) activate((current + 1) % slides.length);
    }, 6800);
  }
  function stop() { if (timer) window.clearInterval(timer); timer = null; }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
      slides.forEach(function (slide) { var v = slide.querySelector('video'); if (v) v.pause(); });
    } else {
      var v = slides[current].querySelector('video');
      if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      start();
    }
  });
  start();
})();





// Homepage film gallery: only play the uploaded vertical films while onscreen.
// Respect reduced-motion settings and avoid downloading all seven films at once.
(function () {
  var gallery = document.querySelector('.home-films');
  if (!gallery) return;
  var rail = gallery.querySelector('.film-rail');
  var cards = Array.prototype.slice.call(gallery.querySelectorAll('.film-card'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var buttons = gallery.querySelectorAll('.film-arrow');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var direction = Number(button.getAttribute('data-direction')) || 1;
      var first = cards[0];
      var distance = first ? first.getBoundingClientRect().width + 20 : rail.clientWidth * .8;
      rail.scrollBy({left:direction * distance, behavior:reduceMotion?'auto':'smooth'});
    });
  });
  cards.forEach(function (card) {
    var video = card.querySelector('video');
    var frame = card.querySelector('.film-frame');
    if (!video || !frame) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted','');
    video.addEventListener('playing', function () { frame.classList.add('is-playing'); });
    video.addEventListener('error', function () { frame.classList.remove('is-playing'); });
    function pause() { if (!video.paused) video.pause(); }
    function play() {
      if (reduceMotion || document.hidden) return;
      var promise = video.play();
      if (promise && promise.catch) promise.catch(function () {});
    }
    card._playFilm = play;
    card._pauseFilm = pause;
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= .35) entry.target._playFilm();
        else entry.target._pauseFilm();
      });
    }, {root:rail,threshold:[0,.35,.65]});
    cards.forEach(function (card) { observer.observe(card); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cards.forEach(function (card) { card._pauseFilm(); });
    else if (!reduceMotion) cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var bounds = rail.getBoundingClientRect();
      if (rect.left < bounds.right && rect.right > bounds.left) card._playFilm();
    });
  });
})();


// Hero film wall: if the browser blocks video autoplay (e.g. iPhone Low Power Mode),
// swap each clip for its animated-image version so it still moves with no play button.
(function () {
  var vids = document.querySelectorAll('.hero-masonry video[data-fallback]');
  if (!vids.length) return;
  function swap(v) {
    if (v.dataset.swapped) return;
    v.dataset.swapped = '1';
    var img = document.createElement('img');
    img.className = 'hm-anim'; img.alt = ''; img.decoding = 'async';
    img.src = v.dataset.fallback;
    v.replaceWith(img);
  }
  vids.forEach(function (v) {
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') swap(v); });
    v.addEventListener('playing', function () { v.dataset.ok = '1'; }, { once: true });
  });
  setTimeout(function () {
    vids.forEach(function (v) { if (!v.dataset.ok && v.paused && v.readyState >= 2) swap(v); });
  }, 2500);
})();

// Ensure the North Face tile automatically resumes as a silent looping background film.
(function () {
  var v = document.querySelector('.hero-masonry video.north-face-hero-film');
  if (!v) return;
  v.controls = false;
  v.removeAttribute('controls');
  v.muted = true;
  v.defaultMuted = true;
  v.loop = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  function resume() {
    if (document.hidden || !v.isConnected || !v.paused) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  v.addEventListener('loadeddata', resume);
  v.addEventListener('canplay', resume);
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  resume();
})();

// Homepage top-center tile: loop only the final two seconds of the Sun Cruiser campaign.
(function () {
  var video = document.querySelector('.hero-masonry video.sun-cruiser-hero-ending');
  if (!video) return;
  video.controls = false;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  var start = 0;
  var initialized = false;
  function play() {
    if (document.hidden) return;
    var result = video.play();
    if (result && result.catch) result.catch(function () {});
  }
  function begin() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    start = Math.max(0, video.duration - 2);
    initialized = true;
    // Seek before starting, so the tile never shows the beginning of the film.
    video.currentTime = start;
  }
  video.addEventListener('loadedmetadata', begin);
  video.addEventListener('seeked', function () {
    video.classList.add('is-ready');
    play();
  });
  video.addEventListener('timeupdate', function () {
    if (initialized && video.currentTime >= video.duration - 0.055) video.currentTime = start;
  });
  video.addEventListener('ended', function () { if (initialized) video.currentTime = start; });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && initialized) play(); });
  window.addEventListener('pageshow', function () { if (initialized) play(); });
  if (video.readyState >= 1) begin();
})();
