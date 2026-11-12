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

// Homepage: reveal copy as each section enters view, without changing layout.
(function () {
  if (!document.body.classList.contains('home-page') || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var selector = [
    '.clients-intro h2',
    '.brand-statement h2', '.brand-statement p', '.brand-statement .brand-contact-cta',
    '.founder-highlights-caption', '.founder-highlight-number', '.founder-highlight-label',
    'main section.block > h2', 'main section.block .section-head h2',
    '.svc-list li h3', '.svc-list li .svc-description',
    '.home-founders-story', '.home-founder figcaption',
    '.step-box h3', '.faq .faq-item summary',
    '.section-cta .home-cta', '.site-footer .big'
  ].join(',');
  var items = Array.prototype.slice.call(document.querySelectorAll(selector));
  if (!items.length) return;
  items.forEach(function (el, index) {
    el.classList.add('home-scroll-reveal');
    el.style.setProperty('--home-reveal-delay', String((index % 3) * 95) + 'ms');
  });
  document.body.classList.add('home-motion-ready');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {threshold:.12,rootMargin:'0px 0px -25px 0px'});
  items.forEach(function (el) {
    // Text already visible on load should remain available immediately.
    if (el.getBoundingClientRect().top < window.innerHeight * .87) {
      el.classList.add('is-visible');
    } else {
      observer.observe(el);
    }
  });
})();

// Likes stat: little hearts flutter up inside the "Likes on brand videos" box each time it scrolls into view.
(function () {
  var box = document.querySelector('.home-page .founder-highlight');
  if (!box || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  box.classList.add('has-hearts');
  var layer = document.createElement('div');
  layer.className = 'fh-hearts';
  layer.setAttribute('aria-hidden', 'true');
  box.appendChild(layer);
  var colors = ['#183B32', '#47665c', '#7f9b90', '#b9cbc3'];
  var heart = '<svg viewBox="0 0 24 22" fill="currentColor"><path d="M12 21.3 10.3 19.8C4.2 14.3 0 10.6 0 6.1 0 2.6 2.7 0 6.1 0c1.9 0 3.8.9 5 2.3C13.1.9 15 0 16.9 0 20.3 0 23 2.6 23 6.1c0 4.5-4.2 8.2-10.3 13.7L12 21.3z"/></svg>';
  var busy = false;
  function burst() {
    if (busy) return;
    busy = true;
    var h = box.offsetHeight + 40, n = window.innerWidth < 760 ? 16 : 24;
    for (var i = 0; i < n; i++) {
      var el = document.createElement('span');
      el.className = 'fh-heart';
      var s = 12 + Math.random() * 18, d = 2.2 + Math.random() * 1.6;
      el.style.cssText = '--x:' + (Math.random() * 92) + '%;--s:' + s + 'px;--c:' + colors[i % colors.length] +
        ';--d:' + d + 's;--delay:' + (Math.random() * 1.4) + 's;--h:' + (h * (0.7 + Math.random() * 0.3)) + 'px' +
        ';--o:' + (0.45 + Math.random() * 0.45) + ';--r0:' + (Math.random() * 30 - 15) + 'deg;--r1:' + (Math.random() * 50 - 25) + 'deg;--sw:' + (4 + Math.random() * 10) + 'px';
      el.innerHTML = heart;
      layer.appendChild(el);
    }
    setTimeout(function () { layer.innerHTML = ''; busy = false; }, 4400);
  }
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) burst(); });
  }, { threshold: 0.5 }).observe(box);
})();

// Brand partners stat: four rows of client logos drift behind "20+", blurred until hovered.
(function () {
  var boxes = document.querySelectorAll('.home-page .founder-highlight');
  var box = boxes[1];
  var src = document.querySelectorAll('.home-page .clients .set:first-child .brand');
  if (!box || !src.length) return;
  var items = Array.prototype.map.call(src, function (li) {
    var img = li.querySelector('img');
    if (img) {
      var h = parseFloat(img.style.height) || parseFloat(img.getAttribute('height')) || 34;
      return { img: img.getAttribute('src'), alt: img.getAttribute('alt') || '', h: Math.round(h * 0.6) };
    }
    return { text: li.textContent.trim() };
  });
  var wall = document.createElement('div');
  wall.className = 'fh-logo-wall';
  wall.setAttribute('aria-hidden', 'true');
  var speeds = [46, 54, 50, 58];
  for (var r = 0; r < 4; r++) {
    var row = document.createElement('div');
    row.className = 'fh-logo-row' + (r % 2 ? ' rev' : '');
    row.style.setProperty('--t', speeds[r] + 's');
    var start = (r * 4) % items.length, html = '';
    for (var k = 0; k < items.length; k++) {
      var it = items[(start + k) % items.length];
      html += '<span class="fh-logo">' + (it.img
        ? '<img src="' + it.img + '" alt="" title="' + it.alt + '" style="height:' + it.h + 'px" loading="lazy" decoding="async">'
        : '<span class="logo-text">' + it.text + '</span>') + '</span>';
    }
    row.innerHTML = html + html;
    wall.appendChild(row);
  }
  box.classList.add('has-logo-wall');
  box.insertBefore(wall, box.firstChild);
})();

// Countries stat: a small plane takes off and climbs out of the box, looping.
(function () {
  var box = document.querySelectorAll('.home-page .founder-highlight')[2];
  if (!box) return;
  var sky = document.createElement('div');
  sky.className = 'fh-sky';
  sky.setAttribute('aria-hidden', 'true');
  sky.innerHTML = '<span class="fh-runway"></span><span class="fh-plane"><span class="fh-trail"></span>' +
    '<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 11.2C2 9.4 4 8.2 8 8.2h30c4.6 0 8.6 1.3 8.6 2.9S42.6 14 38 14H8c-4 0-6-1.1-6-2.8Z"/>' +
    '<path d="M3.6 8.6 8.6 1.4h3.8l-0.6 7.2Z"/><path d="M19 11.4h11l-8.2 8h-4.4Z" opacity=".75"/><path d="M2.6 11.2h7.4l-3.6 3H2.8Z" opacity=".75"/>' +
    '<rect x="36.5" y="9.3" width="3.4" height="1.8" rx=".9" fill="#fff" opacity=".9"/></svg></span>';
  box.classList.add('has-plane');
  box.insertBefore(sky, box.firstChild);
})();
