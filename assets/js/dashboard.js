/* ==========================================================================
   SpeakUp Stage — dashboard.js (Parent Dashboard only)
   1. Sidebar (mobile drawer)
   2. Charts (Chart.js) themed for light/dark, with graceful fallback
   3. Child tabs on Progress Tracker
   4. Enrol wizard + batch label in modals
   5. Chat (Messages)
   6. Reminder toggles
   TODO: replace sample data with your API responses.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const toast = (m, i) => window.SU && window.SU.toast(m, i);

  /* 1. SIDEBAR ========================================================= */
  const side = $('#dashSidebar');
  const backdrop = $('[data-dash-close]');
  const toggleBtn = $('[data-dash-toggle]');
  const setSide = (open) => {
    side?.classList.toggle('open', open);
    backdrop?.classList.toggle('show', open);
    toggleBtn?.setAttribute('aria-expanded', String(open));
    if (open) $('.side-link', side)?.focus();
  };
  toggleBtn?.addEventListener('click', () => setSide(!side.classList.contains('open')));
  backdrop?.addEventListener('click', () => setSide(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && side?.classList.contains('open')) { setSide(false); toggleBtn?.focus(); } });

  /* 2. CHARTS ========================================================== */
  const charts = [];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const palette = () => ({
    text: css('--su-text-muted'), grid: css('--su-border'), teal: css('--su-teal'), orange: css('--su-orange'), navy: css('--su-heading')
  });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const makeCharts = () => {
    if (typeof window.Chart === 'undefined') return; // fallback placeholder stays visible
    const C = window.Chart;
    const p = palette();
    C.defaults.font.family = getComputedStyle(document.body).fontFamily;
    C.defaults.color = p.text;
    C.defaults.animation = reduce ? false : C.defaults.animation;

    const ov = $('#chartOverview');
    if (ov) {
      const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'];
      charts.push(new C(ov, {
        type: 'line',
        data: { labels: weeks, datasets: [
          { label: 'Diya', data: [28, 34, 41, 47, 55, 60, 66, 71, 77, 82], borderColor: p.teal, backgroundColor: p.teal + '33', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 3 },
          { label: 'Arjun', data: [46, 49, 52, 55, 58, 62, 65, 68, 71, 74], borderColor: p.orange, backgroundColor: 'transparent', tension: 0.4, pointRadius: 4, borderWidth: 3, borderDash: [6, 4] }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
          scales: { y: { min: 0, max: 100, grid: { color: p.grid }, ticks: { stepSize: 25 } }, x: { grid: { display: false } } } }
      }));
      ov.closest('.chart-box').classList.add('chart-ready');
    }
    $$('canvas[data-radar]').forEach((cv) => {
      const data = cv.dataset.radar.split(',').map(Number);
      charts.push(new C(cv, {
        type: 'radar',
        data: { labels: ['Confidence', 'Voice', 'Storytelling', 'Body language', 'Debate', 'Stage presence'],
          datasets: [{ label: 'Now', data, borderColor: p.teal, backgroundColor: p.teal + '40', pointBackgroundColor: p.teal, borderWidth: 3 },
            { label: 'Term start', data: data.map((v) => Math.max(15, v - 30)), borderColor: p.orange, backgroundColor: 'transparent', borderDash: [5, 4], pointRadius: 2, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
          scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: p.grid }, angleLines: { color: p.grid }, pointLabels: { font: { weight: '700' } } } } }
      }));
      cv.closest('.chart-box').classList.add('chart-ready');
    });
  };
  const rebuild = () => { charts.splice(0).forEach((c) => c.destroy()); makeCharts(); };
  // Wait for skeletons/fonts before first draw
  window.addEventListener('load', () => setTimeout(makeCharts, 300));
  document.addEventListener('su:themechange', () => { if (charts.length) setTimeout(rebuild, 50); });

  /* 3. CHILD TABS ====================================================== */
  const tabs = $$('[data-child-tab]');
  tabs.forEach((t, idx) => {
    t.addEventListener('click', () => {
      tabs.forEach((x) => { x.setAttribute('aria-selected', 'false'); x.tabIndex = -1; $(`#pp-${x.dataset.childTab}`)?.classList.add('d-none'); });
      t.setAttribute('aria-selected', 'true'); t.tabIndex = 0;
      const pane = $(`#pp-${t.dataset.childTab}`);
      pane?.classList.remove('d-none');
      charts.forEach((c) => c.resize());
    });
    t.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const rtl = document.documentElement.dir === 'rtl';
      const dir = (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
      const n = tabs[(idx + dir + tabs.length) % tabs.length];
      n.focus(); n.click();
    });
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
  });

  /* 4. ENROL WIZARD & BATCH LABELS ===================================== */
  $$('.modal').forEach((m) => m.addEventListener('show.bs.modal', (e) => {
    const b = e.relatedTarget?.dataset?.batch;
    if (b) $$('[data-batch-label]', m).forEach((l) => { l.textContent = b; });
  }));
  $$('[data-wizard]').forEach((wz) => {
    const modal = wz.closest('.modal');
    const steps = $$('.wizard-step', wz);
    const dots = $$('.steps-indicator li', wz);
    const next = $('[data-wizard-next]', modal);
    const prev = $('[data-wizard-prev]', modal);
    let i = 0;
    const show = () => {
      steps.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => { d.classList.toggle('done', k < i); d.classList.toggle('current', k === i); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      prev.disabled = i === 0;
      next.textContent = i === steps.length - 1 ? 'Confirm enrolment' : 'Next';
      $('h3', steps[i])?.setAttribute('tabindex', '-1');
      $('h3', steps[i])?.focus();
    };
    next.addEventListener('click', () => {
      if (i < steps.length - 1) { i += 1; show(); return; }
      const agree = $('#en-agree', wz);
      const err = $('#en-agree-err', wz);
      if (agree && !agree.checked) { err?.classList.add('show'); agree.focus(); return; }
      err?.classList.remove('show');
      window.bootstrap?.Modal.getOrCreateInstance(modal).hide();
      toast('Enrolled! The first class is now in your schedule.', 'bi-check-circle-fill');
      i = 0; if (agree) agree.checked = false; show();
    });
    prev.addEventListener('click', () => { if (i > 0) { i -= 1; show(); } });
    modal.addEventListener('hidden.bs.modal', () => { i = 0; steps.forEach((s, k) => s.classList.toggle('active', k === 0)); dots.forEach((d, k) => { d.classList.toggle('current', k === 0); d.classList.remove('done'); }); prev.disabled = true; next.textContent = 'Next'; });
  });

  /* 5. CHAT ============================================================ */
  const chatForm = $('#chatForm');
  const log = $('#chatLog');
  const scrollLog = () => { if (log) log.scrollTop = log.scrollHeight; };
  scrollLog();
  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const b = document.createElement('div');
    b.className = 'msg-bubble me';
    b.textContent = text;
    const s = document.createElement('small'); s.textContent = now; b.appendChild(s);
    log.appendChild(b);
    input.value = '';
    scrollLog();
    // TODO: POST to your messaging API; the reply below is a demo.
    setTimeout(() => {
      const r = document.createElement('div');
      r.className = 'msg-bubble them';
      r.textContent = 'Thanks! I\'ll check and reply after class.';
      const t = document.createElement('small'); t.textContent = 'just now'; r.appendChild(t);
      log.appendChild(r); scrollLog();
    }, 1200);
  });
  $$('.thread').forEach((t) => t.addEventListener('click', () => {
    $$('.thread').forEach((x) => x.removeAttribute('aria-current'));
    t.setAttribute('aria-current', 'true'); t.classList.remove('unread');
    if (window.innerWidth < 1024) $('.chat')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* 6. REMINDERS ======================================================= */
  $$('[data-reminder]').forEach((sw) => sw.addEventListener('change', () => {
    toast(`${sw.dataset.reminder}: ${sw.checked ? 'reminder on' : 'reminder off'}`, sw.checked ? 'bi-bell-fill' : 'bi-bell-slash');
  }));
})();
