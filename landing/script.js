/* ============================================================
   Amit Sharma /build — interactions
   ============================================================ */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- header shrink + scroll progress ---------- */
  const header   = $('#header');
  const progress = $('.scroll-progress i');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 24);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $('#menuToggle');
  const mobile = $('#mobileNav');
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    mobile.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    mobile.setAttribute('aria-hidden', !open);
  });
  $$('#mobileNav a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open');
    mobile.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  }));

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- count-up stats ---------- */
  const formatNum = (n, decimals) =>
    decimals ? n.toFixed(decimals) : Math.round(n).toString();
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.count;
      const decimals = +el.dataset.decimals || 0;
      const dur = 1700;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = formatNum(target * eased, decimals);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('.stat-num').forEach(c => cio.observe(c));

  /* ---------- FAQ: accordion (one open at a time) ---------- */
  const items = $$('.faq-item');
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) items.forEach(o => { if (o !== item) o.open = false; });
    });
  });

  /* ---------- live UTC clock ---------- */
  const clock = $('#clock');
  const tick = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: 'Asia/Kolkata'
    }).formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t)?.value || '00';
    clock.textContent = `${get('hour')}:${get('minute')}:${get('second')}`;
  };
  tick(); setInterval(tick, 1000);

  /* ---------- footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
