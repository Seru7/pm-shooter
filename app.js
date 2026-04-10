// PM Shooter — catálogo front-end con pack builder y FX en vivo

const FX_CACHE_KEY = 'pmshooter_fx_v1';
const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const PACK_KEY = 'pmshooter_pack_v1';
const CURR_KEY = 'pmshooter_currency_v1';
const FALLBACK_RATE = 0.234; // PLN → EUR fallback si la API falla

const state = {
  weapons: [],
  search: '',
  category: 'all',
  section: 'all',
  explicitOnly: false,
  sort: 'section',
  currency: loadCurrency(), // 'PLN' | 'EUR'
  fx: { rate: FALLBACK_RATE, date: null, stale: true },
  pack: loadPack(), // { [slug]: shots }
};

const SECTION_LABEL = {
  malokalibrowa: 'Pequeño calibre (.22)',
  bojowa:        'Combate',
  maszynowa:     'Automáticas',
};
const SECTION_ORDER = { malokalibrowa: 0, bojowa: 1, maszynowa: 2 };

const $ = sel => document.querySelector(sel);
const gridEl     = $('#grid');
const emptyEl    = $('#empty');
const statsEl    = $('#stats');
const searchEl   = $('#search');
const explicitEl = $('#explicitOnly');
const sortBtn    = $('#sortBtn');
const fxInfoEl   = $('#fxInfo');
const currToggle = $('#currencyToggle');
const packEl     = $('#pack');
const packToggleBtn   = $('#packToggle');
const packBody        = $('#packBody');
const packBadgeEl     = $('#packBadge');
const packToggleTotal = $('#packToggleTotal');
const packListEl      = $('#packList');
const packTotalShots  = $('#packTotalShots');
const packTotalMain   = $('#packTotalMain');
const packClearBtn    = $('#packClear');

// ---------- persistencia ----------
function loadCurrency() {
  try { return localStorage.getItem(CURR_KEY) === 'EUR' ? 'EUR' : 'PLN'; }
  catch { return 'PLN'; }
}
function saveCurrency() { try { localStorage.setItem(CURR_KEY, state.currency); } catch {} }
function loadPack() {
  try {
    const raw = localStorage.getItem(PACK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function savePack() { try { localStorage.setItem(PACK_KEY, JSON.stringify(state.pack)); } catch {} }

// ---------- tasa de cambio ----------
async function loadFxRate() {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && Date.now() - cached.ts < FX_TTL_MS) {
        return { ...cached, stale: false };
      }
    }
  } catch {}
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=PLN&to=EUR');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const rate = data.rates?.EUR;
    if (!rate) throw new Error('respuesta sin tasa');
    const result = { rate, date: data.date, ts: Date.now() };
    try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(result)); } catch {}
    return { ...result, stale: false };
  } catch (e) {
    // fallback: último cache aunque esté caducado, o constante
    try {
      const raw = localStorage.getItem(FX_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        return { ...cached, stale: true };
      }
    } catch {}
    return { rate: FALLBACK_RATE, date: null, stale: true };
  }
}

// ---------- formateo ----------
function fmtPLN(v) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + ' PLN';
}
function fmtEUR(v) {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €';
}
function toEUR(pln) { return pln * state.fx.rate; }
function formatMain(pln) {
  return state.currency === 'EUR' ? fmtEUR(toEUR(pln)) : fmtPLN(pln);
}

// ---------- init ----------
async function init() {
  try {
    const res = await fetch('weapons.json');
    state.weapons = await res.json();
  } catch (e) {
    gridEl.innerHTML = `<p class="empty">Error cargando weapons.json: ${e.message}</p>`;
    return;
  }

  state.fx = await loadFxRate();
  updateFxInfo();

  // listeners
  searchEl.addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); render(); });
  explicitEl.addEventListener('change', e => { state.explicitOnly = e.target.checked; render(); });

  document.querySelectorAll('.chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { filter, value } = btn.dataset;
      state[filter] = value;
      document.querySelectorAll(`.chip[data-filter="${filter}"]`)
        .forEach(b => b.classList.toggle('active', b.dataset.value === value));
      render();
    });
  });

  sortBtn.addEventListener('click', () => {
    const order = ['section', 'priceAsc', 'priceDesc', 'name'];
    const labels = {
      section:   'Ordenar: sección',
      priceAsc:  'Ordenar: precio ↑',
      priceDesc: 'Ordenar: precio ↓',
      name:      'Ordenar: nombre',
    };
    state.sort = order[(order.indexOf(state.sort) + 1) % order.length];
    sortBtn.textContent = labels[state.sort];
    render();
  });

  currToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currency = btn.dataset.curr;
      currToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.curr === state.currency));
      saveCurrency();
      render();
      renderPack();
    });
  });
  // marcar botón activo inicial
  currToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.curr === state.currency));

  // delegación de eventos para controles de pack dentro del grid
  gridEl.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-action="add-to-pack"]');
    if (addBtn) {
      const slug = addBtn.dataset.slug;
      const input = gridEl.querySelector(`input[data-shots-for="${slug}"]`);
      const shots = Math.max(1, parseInt(input?.value, 10) || 10);
      state.pack[slug] = shots;
      savePack();
      renderPack();
      renderCardPackStatus(slug);
      return;
    }
    const removeBtn = e.target.closest('[data-action="remove-from-pack"]');
    if (removeBtn) {
      delete state.pack[removeBtn.dataset.slug];
      savePack();
      renderPack();
      renderCardPackStatus(removeBtn.dataset.slug);
    }
  });
  gridEl.addEventListener('change', e => {
    const inp = e.target.closest('input[data-shots-for]');
    if (!inp) return;
    const slug = inp.dataset.shotsFor;
    const val = Math.max(1, parseInt(inp.value, 10) || 1);
    inp.value = val;
    if (state.pack[slug] !== undefined) {
      state.pack[slug] = val;
      savePack();
      renderPack();
    }
  });

  // pack panel
  packToggleBtn.addEventListener('click', () => {
    const expanded = packToggleBtn.getAttribute('aria-expanded') === 'true';
    packToggleBtn.setAttribute('aria-expanded', String(!expanded));
    packBody.hidden = expanded;
    packEl.classList.toggle('open', !expanded);
  });

  packClearBtn.addEventListener('click', () => {
    if (!Object.keys(state.pack).length) return;
    if (confirm('¿Vaciar el pack?')) {
      state.pack = {};
      savePack();
      renderPack();
      render(); // re-render cards
    }
  });

  packListEl.addEventListener('click', e => {
    const rm = e.target.closest('[data-pack-remove]');
    if (rm) {
      delete state.pack[rm.dataset.packRemove];
      savePack();
      renderPack();
      renderCardPackStatus(rm.dataset.packRemove);
    }
  });
  packListEl.addEventListener('change', e => {
    const inp = e.target.closest('input[data-pack-shots]');
    if (!inp) return;
    const slug = inp.dataset.packShots;
    const val = Math.max(1, parseInt(inp.value, 10) || 1);
    inp.value = val;
    state.pack[slug] = val;
    savePack();
    renderPack();
    // sync card input si visible
    const cardInput = gridEl.querySelector(`input[data-shots-for="${slug}"]`);
    if (cardInput) cardInput.value = val;
  });

  render();
  renderPack();
}

function updateFxInfo() {
  if (state.fx.date && !state.fx.stale) {
    fxInfoEl.textContent = `1 PLN = ${state.fx.rate.toFixed(4)} € · tasa del ${state.fx.date}`;
    fxInfoEl.classList.remove('stale');
  } else if (state.fx.date && state.fx.stale) {
    fxInfoEl.textContent = `1 PLN = ${state.fx.rate.toFixed(4)} € · caché del ${state.fx.date} (sin conexión)`;
    fxInfoEl.classList.add('stale');
  } else {
    fxInfoEl.textContent = `1 PLN ≈ ${state.fx.rate.toFixed(4)} € · tasa aproximada (sin conexión)`;
    fxInfoEl.classList.add('stale');
  }
}

// ---------- filtrado / render grid ----------
function matches(w) {
  if (state.category !== 'all' && w.category !== state.category) return false;
  if (state.section !== 'all' && w.section !== state.section) return false;
  if (state.explicitOnly && !w.explicitPrice) return false;
  if (state.search) {
    const haystack = (w.name + ' ' + w.caliber + ' ' + w.category).toLowerCase();
    if (!haystack.includes(state.search)) return false;
  }
  return true;
}

function sortFn(a, b) {
  switch (state.sort) {
    case 'priceAsc':  return (a.pricePLN ?? 9999) - (b.pricePLN ?? 9999);
    case 'priceDesc': return (b.pricePLN ?? -1) - (a.pricePLN ?? -1);
    case 'name':      return a.name.localeCompare(b.name);
    case 'section':
    default:
      if (a.section !== b.section) return SECTION_ORDER[a.section] - SECTION_ORDER[b.section];
      return a.name.localeCompare(b.name);
  }
}

function render() {
  const filtered = state.weapons.filter(matches).sort(sortFn);
  const total = state.weapons.length;
  const explicit = state.weapons.filter(w => w.explicitPrice).length;
  statsEl.textContent = `${filtered.length}/${total} armas · ${explicit} con precio oficial`;

  if (!filtered.length) {
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  let html = '';
  if (state.sort === 'section') {
    const bySection = { malokalibrowa: [], bojowa: [], maszynowa: [] };
    filtered.forEach(w => bySection[w.section]?.push(w));
    for (const s of ['malokalibrowa', 'bojowa', 'maszynowa']) {
      const arr = bySection[s];
      if (!arr.length) continue;
      html += `<h2 class="section-heading">${SECTION_LABEL[s]} — ${arr.length}</h2>`;
      html += arr.map(cardHtml).join('');
    }
  } else {
    html = filtered.map(cardHtml).join('');
  }
  gridEl.innerHTML = html;
}

function cardHtml(w) {
  const hasPrice = w.pricePLN != null;
  const classes = ['card'];
  if (!w.explicitPrice && hasPrice) classes.push('inferred');
  if (!hasPrice) classes.push('no-price');
  const inPack = state.pack[w.slug] !== undefined;
  if (inPack) classes.push('in-pack');

  const currentShots = inPack ? state.pack[w.slug] : 10;

  const priceHtml = hasPrice
    ? `<div class="price-main">${formatMain(w.pricePLN)}${!w.explicitPrice ? '<span class="asterisk">*</span>' : ''}<span class="price-unit">/disparo</span></div>`
    : `<div class="price-main no-data">consultar</div>`;

  const packControlsHtml = hasPrice
    ? `<div class="card-pack">
         <div class="card-pack-shots">
           <input type="number" min="1" max="999" value="${currentShots}" data-shots-for="${w.slug}" aria-label="Número de disparos">
           <span class="card-pack-label">disparos</span>
         </div>
         ${inPack
           ? `<button type="button" class="btn-pack btn-remove" data-action="remove-from-pack" data-slug="${w.slug}">✓ En el pack — quitar</button>`
           : `<button type="button" class="btn-pack btn-add" data-action="add-to-pack" data-slug="${w.slug}">+ Añadir al pack</button>`}
       </div>`
    : '';

  return `
    <article class="${classes.join(' ')}" data-slug="${w.slug}">
      <div class="card-img">
        <img src="${w.image}" alt="${escapeAttr(w.name)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-name">${escapeHtml(w.name)}</div>
        <div class="card-badges">
          <span class="badge cat">${w.category}</span>
          <span class="badge cal">${w.caliber}</span>
        </div>
        <div class="card-price">${priceHtml}</div>
        ${packControlsHtml}
      </div>
    </article>
  `;
}

// Re-render únicamente una card concreta (cuando cambia su estado in-pack)
function renderCardPackStatus(slug) {
  const card = gridEl.querySelector(`[data-slug="${slug}"]`);
  if (!card) return;
  const w = state.weapons.find(x => x.slug === slug);
  if (!w) return;
  card.outerHTML = cardHtml(w);
}

// ---------- pack panel ----------
function renderPack() {
  const entries = Object.entries(state.pack);
  const count = entries.length;
  packEl.classList.toggle('hidden', count === 0);
  packBadgeEl.textContent = String(count);

  if (!count) {
    packToggleTotal.textContent = '—';
    packToggleBtn.setAttribute('aria-expanded', 'false');
    packBody.hidden = true;
    packEl.classList.remove('open');
    return;
  }

  let totalPLN = 0;
  let totalShots = 0;
  const rows = entries.map(([slug, shots]) => {
    const w = state.weapons.find(x => x.slug === slug);
    if (!w || w.pricePLN == null) return '';
    const lineTotalPLN = w.pricePLN * shots;
    totalPLN += lineTotalPLN;
    totalShots += shots;
    return `
      <li class="pack-item">
        <img src="${w.image}" alt="" class="pack-item-img">
        <div class="pack-item-info">
          <div class="pack-item-name">${escapeHtml(w.name)}${!w.explicitPrice ? ' <span class="asterisk">*</span>' : ''}</div>
          <div class="pack-item-meta">${w.caliber} · ${formatMain(w.pricePLN)}/disparo</div>
        </div>
        <div class="pack-item-shots">
          <input type="number" min="1" max="999" value="${shots}" data-pack-shots="${slug}" aria-label="Disparos">
          <span>disparos</span>
        </div>
        <div class="pack-item-total">
          <strong>${formatMain(lineTotalPLN)}</strong>
        </div>
        <button type="button" class="pack-item-remove" data-pack-remove="${slug}" aria-label="Quitar">×</button>
      </li>
    `;
  }).join('');

  packListEl.innerHTML = rows;
  packTotalShots.textContent = `${totalShots} disparos · ${count} ${count === 1 ? 'arma' : 'armas'}`;
  packTotalMain.textContent = formatMain(totalPLN);
  packToggleTotal.textContent = formatMain(totalPLN);
}

// ---------- utils ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

init();
