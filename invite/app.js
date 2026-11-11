(() => {
  'use strict';

  const STORAGE_KEY = 'sosa_2026_rsvps';
  const SNOWFLAKE_GLYPHS = ['❄', '❅', '❆'];

  /**
   * 60fps mobile-friendly looping snowfall & drifting large snowflakes background.
   */
  function initSnowBackground() {
    const canvas = document.getElementById('snow-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const dotCount = width < 640 ? 40 : 55;
    const flakeCount = width < 640 ? 11 : 15;

    const dots = Array.from({ length: dotCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.4 + Math.random() * 2.8,
      vy: 0.45 + Math.random() * 0.9,
      swayAmp: 0.35 + Math.random() * 0.7,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.015,
      alpha: 0.32 + Math.random() * 0.52
    }));

    const flakes = Array.from({ length: flakeCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 16 + Math.random() * 18,
      vy: 0.32 + Math.random() * 0.55,
      vx: (Math.random() - 0.5) * 0.35,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.012,
      alpha: 0.18 + Math.random() * 0.26,
      glyph: SNOWFLAKE_GLYPHS[idx % SNOWFLAKE_GLYPHS.length],
      isIcyBlue: idx % 3 === 0
    }));

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      for (const dot of dots) {
        if (!prefersReducedMotion) {
          dot.swayPhase += dot.swaySpeed;
          dot.y += dot.vy;
          dot.x += Math.sin(dot.swayPhase) * dot.swayAmp;

          if (dot.y > height + 10) {
            dot.y = -10;
            dot.x = Math.random() * width;
          }
          if (dot.x > width + 10) dot.x = -10;
          if (dot.x < -10) dot.x = width + 10;
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
        ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const flake of flakes) {
        if (!prefersReducedMotion) {
          flake.y += flake.vy;
          flake.x += flake.vx + Math.sin(flake.y * 0.01) * 0.25;
          flake.angle += flake.spin;

          if (flake.y > height + 40) {
            flake.y = -40;
            flake.x = Math.random() * width;
          }
          if (flake.x > width + 40) flake.x = -40;
          if (flake.x < -40) flake.x = width + 40;
        }

        ctx.save();
        ctx.translate(flake.x, flake.y);
        ctx.rotate(flake.angle);
        ctx.font = `${flake.size}px sans-serif`;
        ctx.fillStyle = flake.isIcyBlue
          ? `rgba(186, 230, 253, ${flake.alpha})`
          : `rgba(255, 255, 255, ${flake.alpha})`;
        ctx.fillText(flake.glyph, 0, 0);
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    }

    drawFrame();

    document.addEventListener('visibilitychange', () => {
      if (prefersReducedMotion) return;
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    });
  }

  initSnowBackground();

  // Exit early on root decoy page (/index.html)
  const form = document.getElementById('rsvp-form');
  if (!form || !window.PARTY_CONFIG) return;

  const CONFIG = window.PARTY_CONFIG;
  const isMockMode = !CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL.startsWith('REPLACE_');
  const urlParams = new URLSearchParams(window.location.search);
  const inviteKey = urlParams.get('key') || '';
  const initialEditToken = urlParams.get('edit') || '';

  // DOM References
  const mockBanner = document.getElementById('mock-mode-banner');
  const rsvpHeading = document.getElementById('rsvp-heading');
  const editingBanner = document.getElementById('editing-mode-banner');
  const editingBannerText = document.getElementById('editing-banner-text');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const detailsFieldset = document.getElementById('rsvp-details-section');
  const nameInput = document.getElementById('rsvp-name');
  const emailInput = document.getElementById('rsvp-email');
  const attendingYes = document.getElementById('attending-yes');
  const attendingNo = document.getElementById('attending-no');
  const partySizeSelect = document.getElementById('rsvp-party-size');
  const kidsUnder10Select = document.getElementById('rsvp-kids-under-10');
  const whiteElephantContainer = document.getElementById('white-elephant-options');
  const bringingContainer = document.getElementById('bringing-options');
  const bringingDetailsInput = document.getElementById('rsvp-bringing-details');
  const notesInput = document.getElementById('rsvp-notes');
  const submitBtn = document.getElementById('rsvp-submit-btn');
  const submitBtnLabel = submitBtn.querySelector('.btn-label');
  const formStatus = document.getElementById('form-status');
  const confirmationPanel = document.getElementById('rsvp-confirmation');
  const confirmationHeading = document.getElementById('confirmation-heading');
  const confirmationMessage = document.getElementById('confirmation-message');
  const confirmationEmailNote = document.getElementById('confirmation-email-note');
  const calendarActions = document.getElementById('confirmation-calendar-actions');
  const btnGoogleCal = document.getElementById('btn-google-cal');
  const btnIcsCal = document.getElementById('btn-ics-cal');
  const btnEditCurrent = document.getElementById('btn-edit-current');
  const btnResetForm = document.getElementById('btn-reset-form');
  const faqList = document.getElementById('faq-list');
  const contributionsList = document.getElementById('contributions-list');
  const inlineContributionsList = document.getElementById('inline-contributions-list');
  const contributionsStatus = document.getElementById('contributions-status');
  const btnRefresh = document.getElementById('btn-refresh-contributions');
  const btnInlineRefresh = document.getElementById('btn-inline-refresh');
  const filterPills = Array.from(document.querySelectorAll('.filter-pill'));

  let allContributions = [];
  let activeFilter = 'all';
  let activeEditToken = initialEditToken;
  let lastSubmittedRsvp = null;

  // Show local preview banner only on localhost
  if (
    isMockMode &&
    mockBanner &&
    ['localhost', '127.0.0.1', ''].includes(window.location.hostname)
  ) {
    mockBanner.hidden = false;
  }

  // Hydrate copy from config.js
  function hydrateConfigContent() {
    const ev = CONFIG.EVENT;
    document.getElementById('event-title').textContent = ev.title;
    document.getElementById('event-subtitle').textContent = ev.subtitle;
    document.getElementById('event-date-badge').textContent = ev.dateDisplay.replace('@', '•');
    const locLink = document.getElementById('event-location');
    locLink.href = ev.mapsUrl;
    locLink.querySelector('span:last-child').textContent = ev.address;
    document.getElementById('white-elephant-announcement').textContent = ev.whiteElephantAnnouncement;
    document.getElementById('white-elephant-rules-link').href = ev.whiteElephantRulesUrl;
    document.getElementById('hosts-note-text').textContent = ev.hostsNote;
  }

  function renderDynamicFormOptions() {
    whiteElephantContainer.innerHTML = '';
    CONFIG.WHITE_ELEPHANT_OPTIONS.forEach((opt, idx) => {
      const id = `we-opt-${idx}`;
      const label = document.createElement('label');
      label.className = 'option-card';
      label.setAttribute('for', id);

      const input = document.createElement('input');
      input.type = 'radio';
      input.id = id;
      input.name = 'whiteElephant';
      input.value = opt;

      const span = document.createElement('span');
      span.className = 'option-text';
      const strong = document.createElement('strong');
      strong.textContent = opt;
      span.appendChild(strong);

      label.append(input, span);
      whiteElephantContainer.appendChild(label);
    });

    bringingContainer.innerHTML = '';
    CONFIG.BRINGING_OPTIONS.forEach((opt, idx) => {
      const id = `bring-opt-${idx}`;
      const label = document.createElement('label');
      label.className = 'option-card';
      label.setAttribute('for', id);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.name = 'bringingCategories';
      input.value = opt;

      input.addEventListener('change', () => {
        const allBoxes = Array.from(
          bringingContainer.querySelectorAll('input[type="checkbox"]')
        );
        const isNothing = opt.startsWith('Nothing');
        if (isNothing && input.checked) {
          allBoxes.forEach((cb) => {
            if (cb !== input) cb.checked = false;
          });
        } else if (!isNothing && input.checked) {
          allBoxes.forEach((cb) => {
            if (cb.value.startsWith('Nothing')) cb.checked = false;
          });
        }
      });

      const span = document.createElement('span');
      span.className = 'option-text';
      const strong = document.createElement('strong');
      strong.textContent = opt;
      span.appendChild(strong);

      label.append(input, span);
      bringingContainer.appendChild(label);
    });
  }

  function renderFaqs() {
    faqList.innerHTML = '';

    CONFIG.FAQS.forEach((faq) => {
      const details = document.createElement('details');
      details.className = 'faq-item';
      details.open = true;

      const summary = document.createElement('summary');
      summary.textContent = faq.question;

      const body = document.createElement('div');
      body.className = 'faq-body';

      const p = document.createElement('p');
      p.textContent = faq.answer;
      body.appendChild(p);

      if (faq.linkUrl || faq.secondaryLinkUrl) {
        const links = document.createElement('div');
        links.className = 'faq-links';

        if (faq.linkUrl) {
          const a = document.createElement('a');
          a.className = 'faq-link';
          a.href = faq.linkUrl;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = faq.linkText || 'Learn more';
          links.appendChild(a);
        }

        if (faq.secondaryLinkUrl) {
          const a2 = document.createElement('a');
          a2.className = 'faq-link';
          a2.href = faq.secondaryLinkUrl;
          a2.target = '_blank';
          a2.rel = 'noopener';
          a2.textContent = faq.secondaryLinkText || 'Watch video';
          links.appendChild(a2);
        }

        body.appendChild(links);
      }

      details.append(summary, body);
      faqList.appendChild(details);
    });
  }

  // Conditional Step 2 Toggle
  function syncAttendingSection() {
    const attending = attendingYes.checked ? 'Yes' : attendingNo.checked ? 'No' : '';
    const showDetails = attending === 'Yes';
    detailsFieldset.hidden = !showDetails;
    detailsFieldset.disabled = !showDetails;
    attendingYes.setAttribute('aria-expanded', String(showDetails));
  }

  attendingYes.addEventListener('change', syncAttendingSection);
  attendingNo.addEventListener('change', syncAttendingSection);

  // Pre-fill form when editing an existing RSVP
  function populateFormForEdit(rsvp) {
    if (!rsvp) return;
    activeEditToken = rsvp.editToken || activeEditToken;
    nameInput.value = rsvp.name || '';
    emailInput.value = rsvp.email || '';

    if (rsvp.attending === 'Yes') {
      attendingYes.checked = true;
    } else if (rsvp.attending === 'No') {
      attendingNo.checked = true;
    }
    syncAttendingSection();

    if (rsvp.partySize) {
      partySizeSelect.value = String(rsvp.partySize);
    }

    if (kidsUnder10Select) {
      kidsUnder10Select.value = rsvp.kidsUnder10 ? String(rsvp.kidsUnder10) : '0';
    }

    const weRadios = whiteElephantContainer.querySelectorAll('input[type="radio"]');
    weRadios.forEach((r) => {
      r.checked = r.value === rsvp.whiteElephant;
    });

    const selectedCats = Array.isArray(rsvp.bringingCategories) ? rsvp.bringingCategories : [];
    const bringBoxes = bringingContainer.querySelectorAll('input[type="checkbox"]');
    bringBoxes.forEach((cb) => {
      cb.checked = selectedCats.includes(cb.value);
    });

    bringingDetailsInput.value = rsvp.bringingDetails || '';
    notesInput.value = rsvp.notes || '';

    rsvpHeading.textContent = 'Update Your RSVP';
    submitBtnLabel.textContent = 'Save RSVP Changes';
    editingBanner.hidden = false;
    editingBannerText.textContent = `✏️ Editing RSVP for ${rsvp.name || 'your party'}. Change any details below (or switch Attending to "No" to cancel).`;
  }

  function clearEditMode() {
    activeEditToken = '';
    form.reset();
    syncAttendingSection();
    rsvpHeading.textContent = 'Kindly RSVP';
    submitBtnLabel.textContent = 'Submit RSVP';
    editingBanner.hidden = true;
    if (urlParams.has('edit')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('edit');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
  }

  btnCancelEdit.addEventListener('click', () => {
    clearEditMode();
    nameInput.focus();
  });

  // Consistent ARIA + Fallback Validation (from modern-web-guidance)
  function initAccessibleValidation() {
    const linkError = (el, shown) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    };

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('visually-hidden');
    document.body.append(announcer);

    let announceTimer;
    let announcedField;
    const flagged = new WeakSet();
    const announced = new WeakSet();
    const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
    const dirtyState = new WeakMap();

    const announceError = (el) => {
      const error = document.getElementById(el.dataset.error);
      if (!error) return;
      const label = el.labels?.[0] ? `${el.labels[0].textContent.trim()}: ` : '';
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = label + error.textContent.replace('❌', '').trim();
      }, 400);
    };

    const syncAria = (el, announce = false, forceCheck = false) => {
      if (!el.matches?.('input, select, textarea') || el.disabled) return;
      const invalid = supportsUserInvalid
        ? el.matches(':user-invalid')
        : forceCheck && !el.validity.valid;

      if (!supportsUserInvalid && forceCheck) {
        el.classList.toggle('user-invalid-fallback', invalid);
      }

      if (invalid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute('aria-invalid', 'true');
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.setAttribute('aria-invalid', 'false');
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          clearTimeout(announceTimer);
          announcer.textContent = '';
        }
      }
    };

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      if (el.type !== 'hidden' && el.name !== 'website') syncAria(el);
    });

    form.addEventListener(
      'blur',
      (e) => {
        const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(e.target, state);
        syncAria(e.target, true, state.hasInteracted);
      },
      true
    );

    form.addEventListener('input', (e) => {
      const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(e.target, state);
      if (e.target.hasAttribute('aria-invalid')) {
        syncAria(e.target, false, state.hasBlurred);
      }
    });

    form.addEventListener(
      'change',
      (e) => {
        const state = dirtyState.get(e.target) || { hasInteracted: true, hasBlurred: true };
        state.hasInteracted = true;
        state.hasBlurred = true;
        dirtyState.set(e.target, state);
        syncAria(e.target, true, true);
      },
      true
    );

    form.addEventListener(
      'invalid',
      (e) => {
        announced.add(e.target);
        syncAria(e.target, false, true);
      },
      true
    );

    form.addEventListener(
      'reset',
      () => {
        setTimeout(() => {
          [...form.elements].forEach((el) => {
            el.classList?.remove('user-invalid-fallback');
            syncAria(el, false, false);
          });
        });
      },
      true
    );
  }

  // Category display & multi-selection parser
  function cleanCategoryLabel(raw) {
    const trimmed = String(raw || '').trim();
    const map = CONFIG.CATEGORY_DISPLAY_MAP || {};
    if (map[trimmed]) return map[trimmed];
    if (trimmed.startsWith('Favorite Wine, Punch, or Beer')) {
      return 'Favorite Wine, Punch, or Beer';
    }
    return trimmed;
  }

  function parseCategoryPills(rawCategory) {
    const str = String(rawCategory || '').trim();
    if (!str) return ['Drink, Dish, or Treat'];

    if (str.includes(' | ')) {
      return str.split(' | ').map(cleanCategoryLabel).filter(Boolean);
    }

    const known = [
      ...(CONFIG.BRINGING_OPTIONS || []),
      'Favorite Wine, Punch, or Beer'
    ];
    const found = [];
    let remaining = str;

    for (const opt of known) {
      if (remaining.includes(opt)) {
        found.push(cleanCategoryLabel(opt));
        remaining = remaining.replace(opt, '');
      }
    }

    const leftovers = remaining
      .split(',')
      .map((s) => cleanCategoryLabel(s))
      .filter(Boolean);

    const result = [...found, ...leftovers];
    return result.length ? result : ['Drink, Dish, or Treat'];
  }

  function formatDescriptionText(rawDesc) {
    let text = String(rawDesc || '').trim();
    if (!text) return '—';
    const map = CONFIG.CATEGORY_DISPLAY_MAP || {};
    for (const [full, short] of Object.entries(map)) {
      text = text.replaceAll(full, short);
    }
    return text;
  }

  // Local Mock Storage Helpers (supports create + update + cancel)
  function readMockRsvps() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveMockRsvp(payload) {
    const existing = readMockRsvps();
    const normEmail = (payload.email || '').trim().toLowerCase();
    const idx = existing.findIndex(
      (r) =>
        (payload.editToken && r.editToken === payload.editToken) ||
        (normEmail && (r.email || '').trim().toLowerCase() === normEmail)
    );
    const editToken =
      (idx >= 0 && existing[idx].editToken) ||
      payload.editToken ||
      `mock-${Date.now()}`;
    const record = { ...payload, editToken, submittedAt: new Date().toISOString() };

    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.push(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return { record, updated: idx >= 0 };
  }

  function getMockContributions() {
    const base = [...(CONFIG.MOCK_CONTRIBUTIONS || [])];
    const saved = readMockRsvps();
    for (const item of saved) {
      if (item.attending !== 'Yes') continue;
      const catsList = (item.bringingCategories || []).map(cleanCategoryLabel);
      const catsJoined = catsList.join(' | ');
      const details = (item.bringingDetails || '').trim();
      const isBringing = (catsJoined && !catsJoined.startsWith('Nothing')) || details;
      if (isBringing) {
        base.push({
          guestName: item.name,
          category: catsJoined || 'Drink, Dish, or Treat',
          itemDescription: details || catsList.join(', ')
        });
      }
    }
    return base;
  }

  // Calendar Helpers
  function buildGoogleCalendarUrl() {
    const ev = CONFIG.EVENT;
    return (
      'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(ev.title) +
      '&dates=' + encodeURIComponent(`${ev.startIsoUtc}/${ev.endIsoUtc}`) +
      '&location=' + encodeURIComponent(ev.address) +
      '&details=' + encodeURIComponent(`White Elephant (aka Dirty Santa, $40 max avg) & Event Details: ${window.location.href}`)
    );
  }

  function downloadIcsFile() {
    const ev = CONFIG.EVENT;
    const escapedAddress = ev.address.replace(/,/g, '\\,');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sosa Family//2026 Christmas Party//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:sosa-christmas-2026@sosa-life.com',
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${ev.startIsoUtc}`,
      `DTEND:${ev.endIsoUtc}`,
      `SUMMARY:${ev.title}`,
      `LOCATION:${escapedAddress}`,
      `DESCRIPTION:We can't wait to celebrate with you! White Elephant (aka Dirty Santa) gift exchange ($40 max avg). Details: ${window.location.href}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '2026-christmas-with-the-sosas.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  btnIcsCal.addEventListener('click', downloadIcsFile);

  // Contributions Rendering & Filtering
  function matchesFilter(item, filter) {
    if (filter === 'all') return true;
    const text = `${item.category} ${item.itemDescription}`.toLowerCase();
    if (filter === 'drinks') {
      return /(wine|punch|beer|drink|beverage|merlot|chardonnay|cocktail|soda|cider)/.test(text);
    }
    if (filter === 'appetizer') {
      return /(appetizer|hors d|charcuterie|dip|snack)/.test(text);
    }
    if (filter === 'dish') {
      return /(dish|side|main|salad|pasta|mac|casserole|spread|food)/.test(text);
    }
    if (filter === 'dessert') {
      return /(dessert|treat|cookie|cake|pie|brownie|sweet)/.test(text);
    }
    return true;
  }

  function renderInlineContributions() {
    if (!inlineContributionsList) return;
    inlineContributionsList.innerHTML = '';

    if (!allContributions.length) {
      const li = document.createElement('li');
      li.textContent = "Nothing listed yet—and remember, you don't need to bring a thing!";
      inlineContributionsList.appendChild(li);
      return;
    }

    for (const item of allContributions) {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = `${item.guestName || 'Guest'}: `;
      const span = document.createElement('span');
      span.textContent = formatDescriptionText(
        item.itemDescription || parseCategoryPills(item.category).join(', ')
      );
      li.append(strong, span);
      inlineContributionsList.appendChild(li);
    }
  }

  function renderContributions() {
    renderInlineContributions();
    contributionsList.innerHTML = '';
    const filtered = allContributions.filter((item) => matchesFilter(item, activeFilter));

    if (!filtered.length) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent =
        activeFilter === 'all'
          ? "No guest items listed yet—and remember, you don't need to bring a thing!"
          : 'No items in this category yet.';
      tr.appendChild(td);
      contributionsList.appendChild(tr);
      return;
    }

    for (const item of filtered) {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = item.guestName || 'Guest';

      const tdCat = document.createElement('td');
      const pillStack = document.createElement('div');
      pillStack.className = 'category-pill-stack';
      const pills = parseCategoryPills(item.category);
      for (const pillText of pills) {
        const badge = document.createElement('span');
        badge.className = 'category-badge';
        badge.textContent = pillText;
        pillStack.appendChild(badge);
      }
      tdCat.appendChild(pillStack);

      const tdDesc = document.createElement('td');
      tdDesc.textContent = formatDescriptionText(item.itemDescription || pills.join(', '));

      tr.append(th, tdCat, tdDesc);
      contributionsList.appendChild(tr);
    }
  }

  async function loadContributions(editTokenToFetch = '') {
    contributionsStatus.hidden = false;
    contributionsStatus.textContent = 'Loading what others are bringing...';

    try {
      if (isMockMode) {
        allContributions = getMockContributions();
        contributionsStatus.hidden = true;
        renderContributions();
        if (editTokenToFetch) {
          const match = readMockRsvps().find((r) => r.editToken === editTokenToFetch);
          if (match) populateFormForEdit(match);
        }
        return;
      }

      const getUrl = new URL(CONFIG.GAS_WEB_APP_URL);
      if (inviteKey) getUrl.searchParams.set('key', inviteKey);
      if (editTokenToFetch) getUrl.searchParams.set('edit', editTokenToFetch);

      const res = await fetch(getUrl.toString(), { method: 'GET' });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Guest list is waiting for Apps Script authorization.');
      }
      if (!data.ok) {
        throw new Error(data.error || 'Unable to load list.');
      }

      allContributions = [...(CONFIG.MOCK_CONTRIBUTIONS || []), ...(data.contributions || [])];
      contributionsStatus.hidden = true;
      renderContributions();

      if (data.rsvp) {
        populateFormForEdit(data.rsvp);
      }
    } catch (err) {
      contributionsStatus.hidden = false;
      contributionsStatus.textContent =
        err && err.message ? err.message : 'Unable to load guest list right now.';
      allContributions = [...(CONFIG.MOCK_CONTRIBUTIONS || [])];
      renderContributions();
    }
  }

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activeFilter = pill.dataset.filter || 'all';
      filterPills.forEach((p) => {
        const isCurrent = p === pill;
        p.classList.toggle('is-active', isCurrent);
        p.setAttribute('aria-pressed', String(isCurrent));
      });
      renderContributions();
    });
  });

  btnRefresh.addEventListener('click', () => loadContributions(''));
  if (btnInlineRefresh) {
    btnInlineRefresh.addEventListener('click', () => loadContributions(''));
  }

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.hidden = true;
    formStatus.classList.remove('is-error');

    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid:not(:disabled)');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    const attending = String(formData.get('attending') || '');
    const payload = {
      inviteKey: inviteKey,
      editToken: activeEditToken,
      website: String(formData.get('website') || ''),
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      attending: attending,
      partySize: attending === 'Yes' ? String(formData.get('partySize') || '1') : '0',
      kidsUnder10: attending === 'Yes' ? String(formData.get('kidsUnder10') || '0') : '0',
      whiteElephant: attending === 'Yes' ? String(formData.get('whiteElephant') || '') : '',
      bringingCategories: attending === 'Yes' ? formData.getAll('bringingCategories') : [],
      bringingDetails: attending === 'Yes' ? String(formData.get('bringingDetails') || '').trim() : '',
      notes: attending === 'Yes' ? String(formData.get('notes') || '').trim() : ''
    };

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    try {
      let result;
      if (isMockMode) {
        await new Promise((r) => setTimeout(r, 300));
        const saved = saveMockRsvp(payload);
        result = {
          ok: true,
          updated: saved.updated,
          editToken: saved.record.editToken,
          emailSent: false,
          message:
            attending === 'No'
              ? saved.updated
                ? "Your RSVP has been updated to No. We'll miss you and wish you the happiest seasons greetings and a Merry Christmas!"
                : "Thanks for letting us know! We'll miss you this year and wish you the happiest seasons greetings and a Merry Christmas!"
              : saved.updated
                ? "Your RSVP changes have been saved! Can't wait to celebrate with you on December 5th!"
                : "Thanks for letting us know! We'll see you there otherwise we wish you the happiest seasons greetings and a Merry Christmas!"
        };
      } else {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error('RSVP backend needs one-time Apps Script authorization.');
        }
        if (!result.ok) {
          throw new Error(result.error || 'Submission failed. Please try again.');
        }
      }

      activeEditToken = result.editToken || activeEditToken;
      lastSubmittedRsvp = { ...payload, editToken: activeEditToken };

      form.hidden = true;
      editingBanner.hidden = true;
      confirmationPanel.hidden = false;
      confirmationHeading.textContent = result.updated ? 'RSVP Updated!' : 'RSVP Received!';
      confirmationMessage.textContent = result.message;

      if (attending === 'Yes') {
        btnGoogleCal.href = buildGoogleCalendarUrl();
        calendarActions.hidden = false;
      } else {
        calendarActions.hidden = true;
      }

      btnEditCurrent.hidden = !activeEditToken;

      if (result.emailSent) {
        confirmationEmailNote.hidden = false;
        confirmationEmailNote.textContent = `A confirmation email with calendar links and an edit/cancel link was sent to ${payload.email}.`;
      } else if (isMockMode && payload.email) {
        confirmationEmailNote.hidden = false;
        confirmationEmailNote.textContent = `Preview mode: once connected to Google Apps Script, a confirmation email with an edit/cancel link will be sent to ${payload.email}.`;
      } else {
        confirmationEmailNote.hidden = true;
      }

      confirmationPanel.focus();
      await loadContributions('');
    } catch (err) {
      formStatus.hidden = false;
      formStatus.classList.add('is-error');
      formStatus.textContent =
        err && err.message
          ? err.message
          : 'Sorry, something went wrong saving your RSVP. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
  });

  btnEditCurrent.addEventListener('click', () => {
    if (!lastSubmittedRsvp) return;
    confirmationPanel.hidden = true;
    form.hidden = false;
    populateFormForEdit(lastSubmittedRsvp);
    nameInput.focus();
  });

  btnResetForm.addEventListener('click', () => {
    clearEditMode();
    confirmationPanel.hidden = true;
    form.hidden = false;
    formStatus.hidden = true;
    nameInput.focus();
  });

  // Boot
  hydrateConfigContent();
  renderDynamicFormOptions();
  renderFaqs();
  initAccessibleValidation();
  syncAttendingSection();
  loadContributions(initialEditToken);
})();
