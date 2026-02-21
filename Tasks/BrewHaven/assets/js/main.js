/* ============================================================
   BrewHaven — main.js  (shared across all pages)
   ============================================================ */

/* ---------- Header sticky & scroll-aware ---------- */
(function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 140);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Mobile nav toggle ---------- */
(function initMobileNav() {
  const btn   = document.querySelector('.hamburger');
  const nav   = document.querySelector('.mobile-nav');
  const body  = document.body;
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Close when a link is clicked
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
})();

/* ---------- Active nav link ---------- */
(function setActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ---------- Scroll Reveal ---------- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ---------- FAQ Accordion ---------- */
(function initAccordion() {
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const body    = item.querySelector('.accordion-body');
    if (!trigger || !body) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.accordion-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.accordion-body').style.maxHeight = null;
        o.querySelector('.accordion-icon').textContent = '+';
      });
      // Open clicked
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
        item.querySelector('.accordion-icon').textContent = '−';
      }
    });
  });
})();

/* ---------- Menu Category Filter ---------- */
(function initMenuFilter() {
  const btns  = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        if (match) {
          card.style.animation = 'scaleIn .4s ease both';
        }
      });
    });
  });
})();

/* ---------- Gallery Lightbox ---------- */
(function initLightbox() {
  const overlay = document.getElementById('lightbox');
  if (!overlay) return;
  const img   = overlay.querySelector('.lb-img');
  const close = overlay.querySelector('.lb-close');
  const prev  = overlay.querySelector('.lb-prev');
  const next  = overlay.querySelector('.lb-next');

  let imgs = [], idx = 0;

  document.querySelectorAll('[data-lightbox]').forEach((el, i) => {
    imgs.push(el.src || el.dataset.src);
    el.addEventListener('click', () => { idx = i; open(); });
  });

  function open() {
    img.src = imgs[idx];
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeBox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (close) close.addEventListener('click', closeBox);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeBox(); });
  if (prev) prev.addEventListener('click', () => { idx = (idx - 1 + imgs.length) % imgs.length; open(); });
  if (next) next.addEventListener('click', () => { idx = (idx + 1) % imgs.length; open(); });
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeBox();
    if (e.key === 'ArrowLeft' && prev) prev.click();
    if (e.key === 'ArrowRight' && next) next.click();
  });
})();

/* ---------- Contact Form ---------- */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg,#38a169,#48bb78)';
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.disabled = false;
        btn.style.background = '';
      }, 3500);
    }, 1400);
  });
})();

/* ---------- Counter animation ---------- */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = Math.ceil(target / 60);
      const timer = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur + suffix;
        if (cur >= target) clearInterval(timer);
      }, 25);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
})();

/* ---------- Smooth particles ---------- */
(function initParticles() {
  document.querySelectorAll('.particles').forEach(container => {
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        width:${3+Math.random()*6}px;
        height:${3+Math.random()*6}px;
        animation-delay:${Math.random()*6}s;
        animation-duration:${6+Math.random()*8}s;
        opacity:${.04+Math.random()*.15};
      `;
      container.appendChild(p);
    }
  });
})();
