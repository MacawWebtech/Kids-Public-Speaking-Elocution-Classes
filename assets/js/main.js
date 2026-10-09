/* ==========================================================================
   SpeakUp Stage — main.js (vanilla ES6+, no dependencies besides Bootstrap)
   Modules:
   1. Theme (dark / light with system detection)
   2. Direction (RTL demo toggle)
   3. Header, back-to-top
   4. Scroll reveal
   5. Confidence Meter (sound-wave bars) & gauges
   6. Form validation (friendly messages) + integration hooks
   7. Filters & search (programs, instructors, blog, batches)
   8. Carousels (scroll-snap scrollers)
   9. Calendar
   10. Misc: password tools, countdown, billing toggle, skeletons, .ics, toast
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.remove('no-js');

  /* 1. THEME ============================================================= */
  const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    $$('[data-theme-toggle]').forEach((btn) => {
      const dark = theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      const i = $('i', btn);
      if (i) i.className = dark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    });
    document.dispatchEvent(new CustomEvent('su:themechange', { detail: { theme } }));
  };
  applyTheme(store.get('su-theme') || (themeQuery.matches ? 'dark' : 'light'));
  themeQuery.addEventListener?.('change', (e) => { if (!store.get('su-theme')) applyTheme(e.matches ? 'dark' : 'light'); });
  $$('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store.set('su-theme', next);
    applyTheme(next);
  }));

  /* 2. DIRECTION (RTL demo) ============================================= */
  const applyDir = (dir) => {
    root.setAttribute('dir', dir);
    root.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
    const bs = $('#bs-css');
    if (bs && bs.dataset.ltr && bs.dataset.rtl) bs.href = dir === 'rtl' ? bs.dataset.rtl : bs.dataset.ltr;
    $$('[data-rtl-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(dir === 'rtl'));
      btn.setAttribute('aria-label', dir === 'rtl' ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
      const l = $('.rtl-label', btn);
      if (l) l.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
    });
  };
  applyDir(store.get('su-dir') || root.getAttribute('dir') || 'ltr');
  $$('[data-rtl-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
    store.set('su-dir', next);
    applyDir(next);
  }));

  /* 3. HEADER & BACK TO TOP ============================================ */
  const header = $('.su-header');
  const backTop = $('.back-top');
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 8);
    backTop?.classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Close mobile menu after choosing a link
  $$('.su-header .navbar-collapse .nav-link').forEach((a) => a.addEventListener('click', () => {
    const c = $('.su-header .navbar-collapse.show');
    if (c && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(c).hide();
  }));

  /* 4. SCROLL REVEAL =================================================== */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* 5. CONFIDENCE METER ================================================ */
  // Markup: <div class="cwave" data-level="72" data-bars="14"></div>
  // Bars rise like a sound wave; "on" bars = level %. Deterministic heights.
  const buildWave = (el) => {
    const bars = parseInt(el.dataset.bars || '14', 10);
    const level = Math.max(0, Math.min(100, parseFloat(el.dataset.level || '0')));
    const onCount = Math.round((level / 100) * bars);
    el.innerHTML = '';
    el.setAttribute('role', 'img');
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', `Confidence level ${Math.round(level)} out of 100`);
    for (let i = 0; i < bars; i += 1) {
      const s = document.createElement('span');
      const h = 35 + Math.round(((Math.sin(i * 1.7) + 1) / 2) * 45 + (i / bars) * 20);
      s.style.setProperty('--h', `${Math.min(h, 100)}%`);
      el.appendChild(s);
    }
    el.dataset.on = String(onCount);
  };
  const fillWave = (el) => {
    const on = parseInt(el.dataset.on || '0', 10);
    $$('span', el).forEach((s, i) => {
      if (i < on) setTimeout(() => s.classList.add('on'), reduceMotion ? 0 : i * 45);
    });
    if (el.hasAttribute('data-animate') && !reduceMotion) setTimeout(() => el.classList.add('is-animating'), on * 45 + 200);
  };
  window.SUBuildWaves = (scope = document) => {
    const waves = $$('.cwave[data-level]', scope);
    waves.forEach(buildWave);
    if ('IntersectionObserver' in window) {
      const wio = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { fillWave(en.target); wio.unobserve(en.target); }
      }), { threshold: 0.3 });
      waves.forEach((w) => wio.observe(w));
    } else waves.forEach(fillWave);
  };
  window.SUBuildWaves();

  // Gauges: <div class="gauge" data-value="78"> with svg .g-fill (path length 251.3)
  const gauges = $$('.gauge[data-value]');
  const fillGauge = (g) => {
    const v = Math.max(0, Math.min(100, parseFloat(g.dataset.value)));
    const f = $('.g-fill', g);
    if (f) f.style.strokeDashoffset = String(251.3 - (251.3 * v) / 100);
  };
  if ('IntersectionObserver' in window) {
    const gio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { fillGauge(en.target); gio.unobserve(en.target); }
    }), { threshold: 0.4 });
    gauges.forEach((g) => gio.observe(g));
  } else gauges.forEach(fillGauge);

  /* 6. FORMS =========================================================== */
  // Friendly fallback messages; override per-field with data-msg="..."
  const defaultMsg = (f) => {
    const v = f.validity;
    const label = (f.dataset.label || f.name || 'this field').replace(/[_-]/g, ' ');
    if (v.valueMissing) {
      if (f.type === 'checkbox') return 'Please tick this box to continue.';
      if (f.type === 'email') return 'Please enter your email address.';
      if (f.type === 'tel') return 'Please enter your phone number.';
      if (f.type === 'password') return 'Please enter a password.';
      if (f.tagName === 'SELECT') return `Please choose ${label}.`;
      return `Please tell us ${label}.`;
    }
    if (v.typeMismatch && f.type === 'email') return 'That email looks incomplete. Try name@example.com.';
    if (v.patternMismatch && f.type === 'tel') return 'Please enter a 10-digit phone number.';
    if (v.rangeUnderflow || v.rangeOverflow) return `Please enter a value between ${f.min} and ${f.max}.`;
    if (v.tooShort) return `A little longer please: at least ${f.minLength} characters.`;
    return 'Please check this field.';
  };
  const ensureFeedback = (f) => {
    const wrap = f.closest('.field') || f.parentElement;
    let fb = $('.invalid-feedback', wrap);
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      wrap.appendChild(fb);
    }
    if (!fb.id) fb.id = `${f.id || f.name || 'f'}-error`;
    return fb;
  };
  const checkField = (f) => {
    if (f.dataset.match) {
      const other = document.getElementById(f.dataset.match);
      f.setCustomValidity(other && other.value !== f.value ? 'Passwords do not match yet.' : '');
    }
    const fb = ensureFeedback(f);
    const ok = f.checkValidity();
    f.classList.toggle('is-invalid', !ok);
    f.classList.toggle('is-valid', ok && f.value !== '' && f.type !== 'checkbox');
    f.setAttribute('aria-invalid', String(!ok));
    fb.classList.toggle('show', !ok);
    if (!ok) {
      fb.innerHTML = `<i class="bi bi-exclamation-circle" aria-hidden="true"></i><span>${f.validationMessage === 'Passwords do not match yet.' ? 'Passwords do not match yet.' : (f.dataset.msg || defaultMsg(f))}</span>`;
      const ids = (f.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (!ids.includes(fb.id)) f.setAttribute('aria-describedby', [...ids, fb.id].join(' '));
    }
    return ok;
  };

  $$('form.su-form').forEach((form) => {
    form.setAttribute('novalidate', '');
    const fields = () => $$('input, select, textarea', form).filter((f) => !f.disabled && f.type !== 'hidden' && f.type !== 'button');
    fields().forEach((f) => {
      f.addEventListener('blur', () => { if (f.value !== '' || f.classList.contains('is-invalid')) checkField(f); });
      f.addEventListener('input', () => { if (f.classList.contains('is-invalid')) checkField(f); });
      f.addEventListener('change', () => { if (f.classList.contains('is-invalid') || f.type === 'checkbox' || f.tagName === 'SELECT') checkField(f); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // radio groups that are required need at least one choice
      let valid = true;
      fields().forEach((f) => { if (!checkField(f)) valid = false; });
      $$('[data-required-group]', form).forEach((g) => {
        const err = $('.form-error', g);
        const any = $$('input', g).some((i) => i.checked);
        err?.classList.toggle('show', !any);
        if (!any) valid = false;
      });
      if (!valid) {
        const first = $('.is-invalid', form) || $('[data-required-group] input', form);
        first?.focus();
        return;
      }
      const btn = $('[type="submit"]', form);
      const label = btn?.innerHTML;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Sending…'; }

      // TODO: Integration. Set data-endpoint to your Formspree / Netlify / Mailchimp URL.
      // Placeholder endpoints (containing "YOUR_") are simulated so the demo works offline.
      const endpoint = form.dataset.endpoint || '';
      try {
        if (endpoint && !endpoint.includes('YOUR_')) {
          const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('Network');
        } else {
          await new Promise((r) => setTimeout(r, 700));
        }
        const success = form.dataset.success ? document.getElementById(form.dataset.success) : null;
        if (form.dataset.redirect) { window.location.href = form.dataset.redirect; return; }
        if (success) {
          form.classList.add('d-none');
          success.classList.add('show');
          success.setAttribute('tabindex', '-1');
          success.focus();
        } else {
          SU.toast(form.dataset.toast || 'Thanks! We got your message.');
          if (form.hasAttribute('data-close-modal') && window.bootstrap) {
            const m = form.closest('.modal');
            if (m) window.bootstrap.Modal.getOrCreateInstance(m).hide();
          }
          form.reset();
          $$('.is-valid', form).forEach((f) => f.classList.remove('is-valid'));
        }
      } catch (err) {
        SU.toast('Hmm, that did not send. Please check your connection and try again.', 'bi-wifi-off');
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      }
    });
  });

  /* 7. FILTERS & SEARCH =============================================== */
  // <section data-filter-root> … controls with [data-filter-key="age"] (select, or button group with data-value)
  // items: [data-item data-age="5-7" data-mode="online offline"] ; optional [data-search] input, [data-no-results]
  $$('[data-filter-root]').forEach((rootEl) => {
    const items = $$('[data-item]', rootEl);
    const noRes = $('[data-no-results]', rootEl);
    const counter = $('[data-result-count]', rootEl);
    const state = {};
    let query = '';
    const apply = () => {
      let shown = 0;
      items.forEach((it) => {
        const matchFilters = Object.entries(state).every(([k, v]) => !v || v === 'all' || (it.dataset[k] || '').split(' ').includes(v));
        const matchQuery = !query || it.textContent.toLowerCase().includes(query);
        const show = matchFilters && matchQuery;
        it.classList.toggle('is-hidden', !show);
        if (show) shown += 1;
      });
      noRes?.classList.toggle('is-hidden', shown !== 0);
      if (counter) counter.textContent = String(shown);
    };
    $$('[data-filter-key]', rootEl).forEach((ctl) => {
      const key = ctl.dataset.filterKey;
      if (ctl.tagName === 'SELECT') {
        ctl.addEventListener('change', () => { state[key] = ctl.value; apply(); });
      } else {
        $$('[data-value]', ctl).forEach((b) => b.addEventListener('click', () => {
          $$('[data-value]', ctl).forEach((x) => { x.setAttribute('aria-pressed', 'false'); x.classList.remove('active'); });
          b.setAttribute('aria-pressed', 'true'); b.classList.add('active');
          state[key] = b.dataset.value; apply();
        }));
      }
    });
    const search = $('[data-search]', rootEl);
    const q0 = new URLSearchParams(window.location.search).get('q');
    if (search && q0) { search.value = q0; query = q0.trim().toLowerCase(); }
    search?.addEventListener('input', () => { query = search.value.trim().toLowerCase(); apply(); });
    // Allow ?cat=… / ?age=… pre-filtering from links
    const params = new URLSearchParams(window.location.search);
    $$('[data-filter-key]', rootEl).forEach((ctl) => {
      const v = params.get(ctl.dataset.filterKey);
      if (!v) return;
      if (ctl.tagName === 'SELECT') { ctl.value = v; state[ctl.dataset.filterKey] = v; } else {
        const b = $(`[data-value="${CSS.escape(v)}"]`, ctl); b?.click();
      }
    });
    $$('[data-reset-filters]', rootEl).forEach((b) => b.addEventListener('click', () => {
      Object.keys(state).forEach((k) => { state[k] = 'all'; });
      $$('select[data-filter-key]', rootEl).forEach((s) => { s.value = 'all'; });
      $$('[data-filter-key] [data-value="all"]', rootEl).forEach((x) => x.click());
      if (search) { search.value = ''; query = ''; }
      apply();
    }));
    apply();
  });

  /* 8. CAROUSELS ====================================================== */
  $$('[data-scroll]').forEach((btn) => btn.addEventListener('click', () => {
    const track = document.getElementById(btn.dataset.target);
    if (!track) return;
    const rtl = root.getAttribute('dir') === 'rtl';
    const dir = (btn.dataset.scroll === 'next' ? 1 : -1) * (rtl ? -1 : 1);
    const card = track.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  /* 9. CALENDAR ======================================================= */
  // <div class="cal" data-month="2026-11" data-events="2026-11-08:comp:Title|2026-11-14:class:Title"></div>
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $$('.cal[data-month]').forEach((cal) => {
    let [y, m] = cal.dataset.month.split('-').map(Number);
    const events = {};
    (cal.dataset.events || '').split('|').filter(Boolean).forEach((s) => {
      const [date, type, title] = s.split(':');
      (events[date] = events[date] || []).push({ type, title });
    });
    const detail = cal.dataset.detail ? document.getElementById(cal.dataset.detail) : null;
    const render = () => {
      const first = new Date(y, m - 1, 1);
      const days = new Date(y, m, 0).getDate();
      const offset = (first.getDay() + 6) % 7; // Monday start
      const today = new Date();
      let html = `<div class="cal-head"><button class="tool-btn" type="button" data-cal="prev" aria-label="Previous month"><i class="bi bi-chevron-left" aria-hidden="true"></i></button><h3 aria-live="polite">${MONTHS[m - 1]} ${y}</h3><button class="tool-btn" type="button" data-cal="next" aria-label="Next month"><i class="bi bi-chevron-right" aria-hidden="true"></i></button></div><div class="cal-grid" role="grid">`;
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => { html += `<div class="dow" role="columnheader">${d}</div>`; });
      for (let i = 0; i < offset; i += 1) html += '<span class="cal-day muted" aria-hidden="true"></span>';
      for (let d = 1; d <= days; d += 1) {
        const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const ev = events[key];
        const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d;
        const cls = ['cal-day', isToday ? 'today' : '', ev ? (ev.some((e) => e.type === 'comp') ? 'has-comp' : 'has-event') : ''].join(' ');
        const label = ev ? `${d} ${MONTHS[m - 1]}: ${ev.map((e) => e.title).join(', ')}` : `${d} ${MONTHS[m - 1]}`;
        html += ev
          ? `<button type="button" class="${cls}" data-date="${key}" aria-label="${label}">${d}</button>`
          : `<span class="${cls}" aria-label="${label}">${d}</span>`;
      }
      html += '</div><div class="cal-legend"><span class="l-class">Class</span><span class="l-comp">Competition</span></div>';
      cal.innerHTML = html;
      $('[data-cal="prev"]', cal).addEventListener('click', () => { m -= 1; if (m < 1) { m = 12; y -= 1; } render(); });
      $('[data-cal="next"]', cal).addEventListener('click', () => { m += 1; if (m > 12) { m = 1; y += 1; } render(); });
      $$('[data-date]', cal).forEach((b) => b.addEventListener('click', () => {
        const ev = events[b.dataset.date] || [];
        const msg = ev.map((e) => e.title).join(' · ');
        if (detail) { detail.innerHTML = `<strong>${b.getAttribute('aria-label').split(':')[0]}</strong>: ${msg}`; } else SU.toast(msg, 'bi-calendar-event');
      }));
    };
    render();
  });

  /* 10. MISC ========================================================== */
  // Password show/hide
  $$('[data-pw-toggle]').forEach((b) => b.addEventListener('click', () => {
    const input = document.getElementById(b.dataset.pwToggle);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.setAttribute('aria-pressed', String(show));
    $('i', b).className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
  }));
  // Password strength
  $$('[data-pw-strength]').forEach((input) => {
    const bar = $(`#${input.dataset.pwStrength} span`);
    const txt = $(`#${input.dataset.pwStrength}-text`);
    input.addEventListener('input', () => {
      const v = input.value;
      let s = 0;
      if (v.length >= 8) s += 1; if (/[A-Z]/.test(v)) s += 1; if (/\d/.test(v)) s += 1; if (/[^A-Za-z0-9]/.test(v)) s += 1;
      const colors = ['var(--su-orange)', 'var(--su-orange)', 'var(--su-orange)', 'var(--su-teal)', 'var(--su-teal)'];
      const words = ['Too short', 'Weak', 'Okay', 'Strong', 'Super strong'];
      if (bar) { bar.style.width = `${(s / 4) * 100}%`; bar.style.background = colors[s]; }
      if (txt) txt.textContent = v ? `Password strength: ${words[s]}` : '';
    });
  });

  // Countdown: <div data-countdown="2026-12-01T09:00:00">
  $$('[data-countdown]').forEach((el) => {
    const target = new Date(el.dataset.countdown).getTime();
    const set = (k, v) => { const n = $(`[data-cd="${k}"]`, el); if (n) n.textContent = String(v).padStart(2, '0'); };
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      set('d', Math.floor(diff / 864e5)); set('h', Math.floor((diff / 36e5) % 24));
      set('m', Math.floor((diff / 6e4) % 60)); set('s', Math.floor((diff / 1e3) % 60));
    };
    tick(); setInterval(tick, 1000);
  });

  // Billing toggle on pricing
  $$('[data-billing]').forEach((grp) => {
    $$('button', grp).forEach((b) => b.addEventListener('click', () => {
      $$('button', grp).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      const term = b.dataset.term;
      $$('[data-price-monthly]').forEach((p) => {
        $('.amt', p).textContent = term === 'term' ? p.dataset.priceTerm : p.dataset.priceMonthly;
        $('.per', p).textContent = term === 'term' ? '/term' : '/month';
      });
      $$('[data-term-note]').forEach((n) => n.classList.toggle('is-hidden', term !== 'term'));
    }));
  });

  // Skeleton loaders: any [data-skeleton] reveals real content after "loading".
  // TODO: replace the timeout with your real fetch() completion.
  $$('[data-skeleton]').forEach((el) => {
    el.setAttribute('aria-busy', 'true');
    setTimeout(() => { el.classList.add('loaded'); el.setAttribute('aria-busy', 'false'); }, parseInt(el.dataset.skeleton || '900', 10));
  });

  // Add-to-calendar (.ics) — <button data-ics data-title="" data-start="2026-11-08T10:00" data-end="" data-location="">
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => {
    const fmt = (s) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SpeakUp Stage//EN', 'BEGIN:VEVENT',
      `UID:${Date.now()}@speakupstage.example`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(b.dataset.start)}`,
      `DTEND:${fmt(b.dataset.end || b.dataset.start)}`, `SUMMARY:${b.dataset.title}`, `LOCATION:${b.dataset.location || ''}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `${(b.dataset.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    SU.toast('Calendar file downloaded. Open it to add the event.', 'bi-calendar-check');
  }));

  // Download text/CSV placeholders (receipts, certificates). TODO: point to real PDF URLs.
  $$('[data-download]').forEach((b) => b.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([b.dataset.content || ''], { type: 'text/plain' }));
    a.download = b.dataset.download;
    document.body.appendChild(a); a.click(); a.remove();
    SU.toast(`Downloaded ${b.dataset.download}`, 'bi-download');
  }));

  // Generic "demo" buttons that would hit a backend
  $$('[data-demo-toast]').forEach((b) => b.addEventListener('click', (e) => {
    if (b.tagName === 'A') e.preventDefault();
    SU.toast(b.dataset.demoToast, b.dataset.icon || 'bi-check-circle');
  }));

  // Footer year
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* Toast helper (also used by dashboard.js) */
  const SU = window.SU || {};
  let toastTimer;
  SU.toast = (msg, icon = 'bi-check-circle-fill') => {
    let t = $('#su-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'su-toast'; t.className = 'toast-su'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span></span>`;
    $('span', t).textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  };
  window.SU = SU;
})();
