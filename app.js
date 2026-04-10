// PM Shooter — catálogo front-end con pack builder, FX en vivo y 3 idiomas

const FX_CACHE_KEY = 'pmshooter_fx_v1';
const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const PACK_KEY = 'pmshooter_pack_v1';
const CURR_KEY = 'pmshooter_currency_v1';
const LANG_KEY = 'pmshooter_lang_v1';
const FALLBACK_RATE = 0.234; // PLN → EUR fallback si la API falla

const SUPPORTED_LANGS = ['es', 'en', 'pl'];

const state = {
  weapons: [],
  search: '',
  category: 'all',
  section: 'all',
  explicitOnly: false,
  sort: 'section',
  lang: loadLang(),
  currency: loadCurrency(),
  fx: { rate: FALLBACK_RATE, date: null, stale: true },
  pack: loadPack(),
};

const SECTION_ORDER = { malokalibrowa: 0, bojowa: 1, maszynowa: 2 };

// ---------- i18n ----------
const I18N = {
  es: {
    pageTitle: 'PM Shooter — Catálogo de armas y precios',
    brandCity: 'Warsaw',
    subtitle: 'Catálogo de armas con precio por disparo · <a href="https://www.pmshooter.pl/index.php/pl/arsenal" target="_blank" rel="noopener">sitio oficial</a>',
    searchPlaceholder: 'Buscar arma o calibre… (ej. MP40, AK, 9mm)',
    filterAll: 'Todas',
    filterPistols: 'Pistolas',
    filterRevolvers: 'Revólveres',
    filterRifles: 'Rifles',
    filterCarbines: 'Carabinas',
    filterSMG: 'SMG',
    filterMachineGuns: 'Ametralladoras',
    filterShotguns: 'Escopetas',
    filterAllSections: 'Todas secciones',
    filterSmallCaliber: 'Pequeño calibre',
    filterCombat: 'Combate',
    filterFullAuto: 'Automáticas',
    filtersLabel: 'Filtros',
    explicitOnly: 'Solo precio confirmado',
    sortSection: 'Ordenar: sección',
    sortPriceAsc: 'Ordenar: precio ↑',
    sortPriceDesc: 'Ordenar: precio ↓',
    sortName: 'Ordenar: nombre',
    packHintTitle: 'Crea tu pack personalizado',
    packHintBody: 'En cada arma, elige cuántos disparos quieres y pulsa <em>+ Añadir al pack</em>. El total aparece abajo a la derecha.',
    sectionSmallCaliber: 'Pequeño calibre (.22)',
    sectionCombat: 'Combate',
    sectionFullAuto: 'Automáticas',
    shotsLabel: 'disparos',
    perShot: '/disparo',
    askPrice: 'consultar',
    addToPack: '+ Añadir al pack',
    inPackRemove: '✓ En el pack — quitar',
    loading: 'cargando…',
    fetchError: 'Error cargando weapons.json',
    statsTpl: '{filt}/{total} armas · {expl} con precio oficial',
    fxLive: '1 PLN = {rate} € · tasa del {date}',
    fxStale: '1 PLN = {rate} € · caché del {date} (sin conexión)',
    fxNoData: '1 PLN ≈ {rate} € · tasa aproximada (sin conexión)',
    myPack: 'Mi pack',
    myPackTitle: 'Mi pack personalizado',
    clear: 'Vaciar',
    confirmClear: '¿Vaciar el pack?',
    copyTable: 'Copiar tabla',
    copied: 'Copiado ✓',
    copyFailed: 'Error al copiar',
    tblArma: 'Arma',
    tblCalibre: 'Calibre',
    tblDisparos: 'Disparos',
    tblPrecioUnit: 'Precio/disparo',
    tblTotal: 'Total',
    tblGrandTotal: 'TOTAL',
    empty: 'No hay armas que coincidan con el filtro.',
    footerAsterisk: '<strong>*</strong> El precio marcado con asterisco es inferido a partir del precio base del calibre (no está nombrado explícitamente en la oferta oficial). Confirmar en el campo de tiro antes de disparar.',
    footerSource: 'Precios en PLN oficiales extraídos de <a href="https://www.pmshooter.pl/index.php/pl/oferta" target="_blank" rel="noopener">pmshooter.pl/oferta</a>. Conversión EUR en tiempo real vía frankfurter.dev. Imágenes propiedad de PM Shooter Warsaw.',
    footerProject: 'Proyecto personal · <a href="https://github.com/Seru7/pm-shooter" target="_blank" rel="noopener">código en GitHub</a>',
  },
  en: {
    pageTitle: 'PM Shooter — Weapon catalog and prices',
    brandCity: 'Warsaw',
    subtitle: 'Weapon catalog with price per shot · <a href="https://www.pmshooter.pl/index.php/pl/arsenal" target="_blank" rel="noopener">official site</a>',
    searchPlaceholder: 'Search weapon or caliber… (e.g. MP40, AK, 9mm)',
    filterAll: 'All',
    filterPistols: 'Pistols',
    filterRevolvers: 'Revolvers',
    filterRifles: 'Rifles',
    filterCarbines: 'Carbines',
    filterSMG: 'SMG',
    filterMachineGuns: 'Machine guns',
    filterShotguns: 'Shotguns',
    filterAllSections: 'All sections',
    filterSmallCaliber: 'Small caliber',
    filterCombat: 'Combat',
    filterFullAuto: 'Full-auto',
    filtersLabel: 'Filters',
    explicitOnly: 'Confirmed price only',
    sortSection: 'Sort: section',
    sortPriceAsc: 'Sort: price ↑',
    sortPriceDesc: 'Sort: price ↓',
    sortName: 'Sort: name',
    packHintTitle: 'Build your custom pack',
    packHintBody: 'On each weapon, pick how many shots you want and hit <em>+ Add to pack</em>. The total appears in the bottom-right corner.',
    sectionSmallCaliber: 'Small caliber (.22)',
    sectionCombat: 'Combat',
    sectionFullAuto: 'Full-auto',
    shotsLabel: 'shots',
    perShot: '/shot',
    askPrice: 'ask',
    addToPack: '+ Add to pack',
    inPackRemove: '✓ In pack — remove',
    loading: 'loading…',
    fetchError: 'Error loading weapons.json',
    statsTpl: '{filt}/{total} weapons · {expl} with official price',
    fxLive: '1 PLN = {rate} € · rate from {date}',
    fxStale: '1 PLN = {rate} € · cached from {date} (offline)',
    fxNoData: '1 PLN ≈ {rate} € · approximate rate (offline)',
    myPack: 'My pack',
    myPackTitle: 'My custom pack',
    clear: 'Clear',
    confirmClear: 'Clear the pack?',
    copyTable: 'Copy table',
    copied: 'Copied ✓',
    copyFailed: 'Copy failed',
    tblArma: 'Weapon',
    tblCalibre: 'Caliber',
    tblDisparos: 'Shots',
    tblPrecioUnit: 'Price/shot',
    tblTotal: 'Total',
    tblGrandTotal: 'TOTAL',
    empty: 'No weapons match the current filter.',
    footerAsterisk: '<strong>*</strong> Prices marked with an asterisk are inferred from the base caliber price (not explicitly named in the official offer). Confirm at the range before shooting.',
    footerSource: 'Official PLN prices extracted from <a href="https://www.pmshooter.pl/index.php/pl/oferta" target="_blank" rel="noopener">pmshooter.pl/oferta</a>. Live EUR conversion via frankfurter.dev. Images property of PM Shooter Warsaw.',
    footerProject: 'Personal project · <a href="https://github.com/Seru7/pm-shooter" target="_blank" rel="noopener">source on GitHub</a>',
  },
  pl: {
    pageTitle: 'PM Shooter — Katalog broni i cen',
    brandCity: 'Warszawa',
    subtitle: 'Katalog broni z ceną za strzał · <a href="https://www.pmshooter.pl/index.php/pl/arsenal" target="_blank" rel="noopener">oficjalna strona</a>',
    searchPlaceholder: 'Szukaj broni lub kalibru… (np. MP40, AK, 9mm)',
    filterAll: 'Wszystkie',
    filterPistols: 'Pistolety',
    filterRevolvers: 'Rewolwery',
    filterRifles: 'Karabiny',
    filterCarbines: 'Karabinki',
    filterSMG: 'PM',
    filterMachineGuns: 'Karabiny maszynowe',
    filterShotguns: 'Strzelby',
    filterAllSections: 'Wszystkie sekcje',
    filterSmallCaliber: 'Małokalibrowa',
    filterCombat: 'Bojowa',
    filterFullAuto: 'Maszynowa',
    filtersLabel: 'Filtry',
    explicitOnly: 'Tylko potwierdzone ceny',
    sortSection: 'Sortuj: sekcja',
    sortPriceAsc: 'Sortuj: cena ↑',
    sortPriceDesc: 'Sortuj: cena ↓',
    sortName: 'Sortuj: nazwa',
    packHintTitle: 'Stwórz własny pakiet',
    packHintBody: 'Przy każdej broni wybierz liczbę strzałów i kliknij <em>+ Dodaj do pakietu</em>. Suma pojawi się w prawym dolnym rogu.',
    sectionSmallCaliber: 'Broń małokalibrowa (.22)',
    sectionCombat: 'Broń bojowa',
    sectionFullAuto: 'Broń maszynowa',
    shotsLabel: 'strzałów',
    perShot: '/strzał',
    askPrice: 'zapytaj',
    addToPack: '+ Dodaj do pakietu',
    inPackRemove: '✓ W pakiecie — usuń',
    loading: 'ładowanie…',
    fetchError: 'Błąd ładowania weapons.json',
    statsTpl: '{filt}/{total} broni · {expl} z oficjalną ceną',
    fxLive: '1 PLN = {rate} € · kurs z {date}',
    fxStale: '1 PLN = {rate} € · zapisany {date} (offline)',
    fxNoData: '1 PLN ≈ {rate} € · kurs przybliżony (offline)',
    myPack: 'Mój pakiet',
    myPackTitle: 'Mój pakiet',
    clear: 'Wyczyść',
    confirmClear: 'Wyczyścić pakiet?',
    copyTable: 'Kopiuj tabelę',
    copied: 'Skopiowano ✓',
    copyFailed: 'Błąd kopiowania',
    tblArma: 'Broń',
    tblCalibre: 'Kaliber',
    tblDisparos: 'Strzały',
    tblPrecioUnit: 'Cena/strzał',
    tblTotal: 'Suma',
    tblGrandTotal: 'SUMA',
    empty: 'Brak broni pasującej do filtrów.',
    footerAsterisk: '<strong>*</strong> Ceny oznaczone gwiazdką są szacowane na podstawie ceny bazowej kalibru (nie są wyraźnie wymienione w oficjalnej ofercie). Potwierdź cenę na strzelnicy przed strzelaniem.',
    footerSource: 'Oficjalne ceny w PLN pochodzą z <a href="https://www.pmshooter.pl/index.php/pl/oferta" target="_blank" rel="noopener">pmshooter.pl/oferta</a>. Kurs EUR na żywo przez frankfurter.dev. Zdjęcia należą do PM Shooter Warszawa.',
    footerProject: 'Projekt osobisty · <a href="https://github.com/Seru7/pm-shooter" target="_blank" rel="noopener">kod źródłowy na GitHub</a>',
  },
};

// Mapeo de categorías (weapons.json las guarda en español)
const CATEGORY_I18N = {
  'Pistola':       { es: 'Pistola',       en: 'Pistol',       pl: 'Pistolet' },
  'Revólver':      { es: 'Revólver',      en: 'Revolver',     pl: 'Rewolwer' },
  'Rifle':         { es: 'Rifle',         en: 'Rifle',        pl: 'Karabin' },
  'Carabina':      { es: 'Carabina',      en: 'Carbine',      pl: 'Karabinek' },
  'SMG':           { es: 'SMG',           en: 'SMG',          pl: 'PM' },
  'Ametralladora': { es: 'Ametralladora', en: 'Machine gun',  pl: 'Karabin maszynowy' },
  'Escopeta':      { es: 'Escopeta',      en: 'Shotgun',      pl: 'Strzelba' },
};

function t(key) {
  return I18N[state.lang]?.[key] ?? I18N.es[key] ?? key;
}
function tCategory(c) {
  return CATEGORY_I18N[c]?.[state.lang] ?? c;
}
function tSectionLabel(section) {
  const map = {
    malokalibrowa: 'sectionSmallCaliber',
    bojowa:        'sectionCombat',
    maszynowa:     'sectionFullAuto',
  };
  return t(map[section] || section);
}

// Pluralización para "armas" / "weapons" / "broń"
function pluralWeapons(n) {
  if (state.lang === 'es') return n === 1 ? 'arma' : 'armas';
  if (state.lang === 'en') return n === 1 ? 'weapon' : 'weapons';
  // pl: 1 → broń, 2-4 (no 12-14) → bronie, resto → broni
  if (n === 1) return 'broń';
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return 'bronie';
  return 'broni';
}
function pluralShots(n) {
  if (state.lang === 'es') return 'disparos';
  if (state.lang === 'en') return n === 1 ? 'shot' : 'shots';
  // pl: 1 → strzał, 2-4 → strzały, resto → strzałów
  if (n === 1) return 'strzał';
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) return 'strzały';
  return 'strzałów';
}

// ---------- DOM refs ----------
const $ = sel => document.querySelector(sel);
const gridEl     = $('#grid');
const emptyEl    = $('#empty');
const statsEl    = $('#stats');
const searchEl   = $('#search');
const explicitEl = $('#explicitOnly');
const sortBtn    = $('#sortBtn');
const filtersToggleBtn = $('#filtersToggle');
const filtersPanel     = $('#filtersPanel');
const filtersBadge     = $('#filtersActiveBadge');
const langToggle = $('#langToggle');
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
const packCopyBtn     = $('#packCopy');

// ---------- persistencia ----------
function loadLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {}
  // detectar navegador
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(nav)) return nav;
  return 'es';
}
function saveLang() { try { localStorage.setItem(LANG_KEY, state.lang); } catch {} }
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
function localeForLang() {
  return state.lang === 'es' ? 'es-ES' : state.lang === 'pl' ? 'pl-PL' : 'en-GB';
}
function fmtPLN(v) {
  return new Intl.NumberFormat(localeForLang(), { maximumFractionDigits: 0 }).format(v) + ' PLN';
}
function fmtEUR(v) {
  return new Intl.NumberFormat(localeForLang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €';
}
function toEUR(pln) { return pln * state.fx.rate; }
function formatMain(pln) {
  return state.currency === 'EUR' ? fmtEUR(toEUR(pln)) : fmtPLN(pln);
}

// ---------- i18n aplicación al DOM estático ----------
function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

function applySortLabel() {
  const labels = {
    section:   t('sortSection'),
    priceAsc:  t('sortPriceAsc'),
    priceDesc: t('sortPriceDesc'),
    name:      t('sortName'),
  };
  sortBtn.textContent = labels[state.sort];
}

// ---------- init ----------
async function init() {
  applyI18n();
  applySortLabel();

  try {
    const res = await fetch('weapons.json');
    state.weapons = await res.json();
  } catch (e) {
    gridEl.innerHTML = `<p class="empty">${t('fetchError')}: ${e.message}</p>`;
    return;
  }

  state.fx = await loadFxRate();

  // listeners
  searchEl.addEventListener('input', e => { state.search = e.target.value.trim().toLowerCase(); render(); });
  explicitEl.addEventListener('change', e => { state.explicitOnly = e.target.checked; updateFiltersBadge(); render(); });

  document.querySelectorAll('.chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { filter, value } = btn.dataset;
      state[filter] = value;
      document.querySelectorAll(`.chip[data-filter="${filter}"]`)
        .forEach(b => b.classList.toggle('active', b.dataset.value === value));
      updateFiltersBadge();
      render();
    });
  });

  // Dropdown de filtros
  filtersToggleBtn.addEventListener('click', () => {
    const expanded = filtersToggleBtn.getAttribute('aria-expanded') === 'true';
    filtersToggleBtn.setAttribute('aria-expanded', String(!expanded));
    filtersPanel.hidden = expanded;
    filtersToggleBtn.classList.toggle('open', !expanded);
  });

  sortBtn.addEventListener('click', () => {
    const order = ['section', 'priceAsc', 'priceDesc', 'name'];
    state.sort = order[(order.indexOf(state.sort) + 1) % order.length];
    applySortLabel();
    render();
  });

  // Language toggle
  langToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      saveLang();
      langToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
      applyI18n();
      applySortLabel();
      render();
      renderPack();
    });
  });
  langToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));

  // Currency toggle
  currToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currency = btn.dataset.curr;
      currToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.curr === state.currency));
      saveCurrency();
      render();
      renderPack();
    });
  });
  currToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.curr === state.currency));

  // Controles de pack dentro del grid (delegación)
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

  // Pack panel
  packToggleBtn.addEventListener('click', () => {
    const expanded = packToggleBtn.getAttribute('aria-expanded') === 'true';
    packToggleBtn.setAttribute('aria-expanded', String(!expanded));
    packBody.hidden = expanded;
    packEl.classList.toggle('open', !expanded);
  });

  packClearBtn.addEventListener('click', () => {
    if (!Object.keys(state.pack).length) return;
    if (confirm(t('confirmClear'))) {
      state.pack = {};
      savePack();
      renderPack();
      render();
    }
  });

  packCopyBtn.addEventListener('click', async () => {
    if (!Object.keys(state.pack).length) return;
    const originalLabel = t('copyTable');
    const ok = await copyPackToClipboard();
    if (ok) {
      packCopyBtn.textContent = t('copied');
      packCopyBtn.classList.add('copied');
    } else {
      packCopyBtn.textContent = t('copyFailed');
    }
    setTimeout(() => {
      packCopyBtn.textContent = originalLabel;
      packCopyBtn.classList.remove('copied');
    }, 1800);
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
    const cardInput = gridEl.querySelector(`input[data-shots-for="${slug}"]`);
    if (cardInput) cardInput.value = val;
  });

  updateFiltersBadge();
  render();
  renderPack();
}

function updateFiltersBadge() {
  let active = 0;
  if (state.category !== 'all') active++;
  if (state.section !== 'all') active++;
  if (state.explicitOnly) active++;
  if (active > 0) {
    filtersBadge.textContent = String(active);
    filtersBadge.hidden = false;
  } else {
    filtersBadge.hidden = true;
  }
}

// ---------- filtrado / render grid ----------
function matches(w) {
  if (state.category !== 'all' && w.category !== state.category) return false;
  if (state.section !== 'all' && w.section !== state.section) return false;
  if (state.explicitOnly && !w.explicitPrice) return false;
  if (state.search) {
    const haystack = (w.name + ' ' + w.caliber + ' ' + w.category + ' ' + tCategory(w.category)).toLowerCase();
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
  statsEl.textContent = t('statsTpl')
    .replace('{filt}', filtered.length)
    .replace('{total}', total)
    .replace('{expl}', explicit);

  if (!filtered.length) {
    gridEl.innerHTML = '';
    emptyEl.textContent = t('empty');
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
      html += `<h2 class="section-heading">${tSectionLabel(s)} — ${arr.length}</h2>`;
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
    ? `<div class="price-main">${formatMain(w.pricePLN)}${!w.explicitPrice ? '<span class="asterisk">*</span>' : ''}<span class="price-unit">${t('perShot')}</span></div>`
    : `<div class="price-main no-data">${t('askPrice')}</div>`;

  const packControlsHtml = hasPrice
    ? `<div class="card-pack">
         <div class="card-pack-shots">
           <input type="number" min="1" max="999" value="${currentShots}" data-shots-for="${w.slug}" aria-label="${t('shotsLabel')}">
           <span class="card-pack-label">${t('shotsLabel')}</span>
         </div>
         ${inPack
           ? `<button type="button" class="btn-pack btn-remove" data-action="remove-from-pack" data-slug="${w.slug}">${t('inPackRemove')}</button>`
           : `<button type="button" class="btn-pack btn-add" data-action="add-to-pack" data-slug="${w.slug}">${t('addToPack')}</button>`}
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
          <span class="badge cat">${escapeHtml(tCategory(w.category))}</span>
          <span class="badge cal">${escapeHtml(w.caliber)}</span>
        </div>
        <div class="card-price">${priceHtml}</div>
        ${packControlsHtml}
      </div>
    </article>
  `;
}

function renderCardPackStatus(slug) {
  const card = gridEl.querySelector(`[data-slug="${slug}"]`);
  if (!card) return;
  const w = state.weapons.find(x => x.slug === slug);
  if (!w) return;
  card.outerHTML = cardHtml(w);
}

// ---------- exportación del pack ----------
// Construimos dos formatos:
//  1) text/html — tabla real. Gmail, Outlook, Sheets, Excel, Docs, Notion,
//     WhatsApp Web: pegan como tabla nativa con celdas.
//  2) text/plain — lista vertical legible con fuentes proporcionales, para
//     WhatsApp móvil, Telegram, SMS, iMessage, donde el HTML se descarta.
// La Clipboard API moderna copia ambos a la vez y cada app usa el que entiende.

function getPackData() {
  const entries = Object.entries(state.pack);
  const items = [];
  let totalPLN = 0;
  let totalShots = 0;
  for (const [slug, shots] of entries) {
    const w = state.weapons.find(x => x.slug === slug);
    if (!w || w.pricePLN == null) continue;
    const lineTotal = w.pricePLN * shots;
    totalPLN += lineTotal;
    totalShots += shots;
    items.push({ w, shots, lineTotal });
  }
  return { items, totalPLN, totalShots };
}

function buildPackHTML() {
  const { items, totalPLN, totalShots } = getPackData();
  const headerBg = '#f5f5f5';
  const border = '1px solid #999';
  const cellStyle = `border:${border};padding:6px 10px;`;
  const rows = items.map(({ w, shots, lineTotal }) => {
    const nameWithMark = w.explicitPrice
      ? escapeHtml(w.name)
      : `${escapeHtml(w.name)} *`;
    return `<tr>
      <td style="${cellStyle}">${nameWithMark}</td>
      <td style="${cellStyle}">${escapeHtml(w.caliber)}</td>
      <td style="${cellStyle}text-align:right;">${shots}</td>
      <td style="${cellStyle}text-align:right;">${escapeHtml(formatMain(w.pricePLN))}</td>
      <td style="${cellStyle}text-align:right;font-weight:bold;">${escapeHtml(formatMain(lineTotal))}</td>
    </tr>`;
  }).join('');
  return `<table style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
    <thead>
      <tr style="background:${headerBg};">
        <th style="${cellStyle}text-align:left;">${escapeHtml(t('tblArma'))}</th>
        <th style="${cellStyle}text-align:left;">${escapeHtml(t('tblCalibre'))}</th>
        <th style="${cellStyle}text-align:right;">${escapeHtml(t('tblDisparos'))}</th>
        <th style="${cellStyle}text-align:right;">${escapeHtml(t('tblPrecioUnit'))}</th>
        <th style="${cellStyle}text-align:right;">${escapeHtml(t('tblTotal'))}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="background:${headerBg};font-weight:bold;">
        <td style="${cellStyle}" colspan="2">${escapeHtml(t('tblGrandTotal'))}</td>
        <td style="${cellStyle}text-align:right;">${totalShots}</td>
        <td style="${cellStyle}"></td>
        <td style="${cellStyle}text-align:right;">${escapeHtml(formatMain(totalPLN))}</td>
      </tr>
    </tfoot>
  </table>`;
}

function buildPackPlain() {
  const { items, totalPLN, totalShots } = getPackData();
  const lines = ['🎯 PM Shooter — ' + t('myPackTitle'), ''];
  for (const { w, shots, lineTotal } of items) {
    const mark = w.explicitPrice ? '' : ' *';
    lines.push(`• ${w.name}${mark} (${w.caliber})`);
    lines.push(`   ${shots} × ${formatMain(w.pricePLN)} = ${formatMain(lineTotal)}`);
  }
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━');
  lines.push(`${t('tblGrandTotal')}: ${totalShots} ${pluralShots(totalShots)} · ${formatMain(totalPLN)}`);
  return lines.join('\n');
}

async function copyPackToClipboard() {
  const html = buildPackHTML();
  const plain = buildPackPlain();
  // Intento 1: copiar ambos formatos (HTML + plain). Gmail/Sheets cogen HTML, WhatsApp coge plain.
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (e) { /* cae al fallback */ }
  // Intento 2: solo texto plano
  try {
    await navigator.clipboard.writeText(plain);
    return true;
  } catch (e) { /* cae al fallback */ }
  // Intento 3: textarea + execCommand (navegadores viejos)
  try {
    const ta = document.createElement('textarea');
    ta.value = plain;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
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
          <div class="pack-item-meta">${w.caliber} · ${formatMain(w.pricePLN)}${t('perShot')}</div>
        </div>
        <div class="pack-item-shots">
          <input type="number" min="1" max="999" value="${shots}" data-pack-shots="${slug}" aria-label="${t('shotsLabel')}">
          <span>${pluralShots(shots)}</span>
        </div>
        <div class="pack-item-total">
          <strong>${formatMain(lineTotalPLN)}</strong>
        </div>
        <button type="button" class="pack-item-remove" data-pack-remove="${slug}" aria-label="×">×</button>
      </li>
    `;
  }).join('');

  packListEl.innerHTML = rows;
  packTotalShots.textContent = `${totalShots} ${pluralShots(totalShots)} · ${count} ${pluralWeapons(count)}`;
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
