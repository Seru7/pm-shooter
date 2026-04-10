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
    copyTable: 'Compartir imagen',
    copied: 'Compartido ✓',
    copyFailed: 'Error al compartir',
    imgCopied: 'Imagen copiada ✓',
    imgDownloaded: 'Descargado ✓',
    imgTitle: 'Mi pack — PM Shooter',
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
    copyTable: 'Share image',
    copied: 'Shared ✓',
    copyFailed: 'Share failed',
    imgCopied: 'Image copied ✓',
    imgDownloaded: 'Downloaded ✓',
    imgTitle: 'My pack — PM Shooter',
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
    copyTable: 'Udostępnij obraz',
    copied: 'Udostępniono ✓',
    copyFailed: 'Błąd udostępniania',
    imgCopied: 'Obraz skopiowany ✓',
    imgDownloaded: 'Pobrano ✓',
    imgTitle: 'Mój pakiet — PM Shooter',
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
    packCopyBtn.disabled = true;
    const result = await sharePackImage();
    packCopyBtn.disabled = false;
    if (result.ok) {
      packCopyBtn.classList.add('copied');
      if (result.how === 'shared')         packCopyBtn.textContent = t('copied');
      else if (result.how === 'copied')    packCopyBtn.textContent = t('imgCopied');
      else if (result.how === 'downloaded') packCopyBtn.textContent = t('imgDownloaded');
      else packCopyBtn.textContent = t('copied');
    } else {
      packCopyBtn.textContent = t('copyFailed');
    }
    setTimeout(() => {
      packCopyBtn.textContent = originalLabel;
      packCopyBtn.classList.remove('copied');
    }, 2200);
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

// ---------- exportación del pack como imagen PNG ----------
// Dibujamos la tabla completa en un canvas y la compartimos vía:
//  1) navigator.share({ files: [png] }) — iPhone/Android abren el share sheet
//     nativo, el usuario elige WhatsApp, Gmail, Telegram, lo que sea
//  2) navigator.clipboard.write([ClipboardItem image/png]) — desktop Chrome/
//     Safari, pega como imagen en cualquier editor rich text
//  3) descarga del PNG — fallback universal
// Una imagen se ve igual en TODAS las apps. Sin depender de fuentes, HTML,
// Markdown ni monospace.

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

function generatePackImage() {
  const { items, totalPLN, totalShots } = getPackData();

  // Colores (paleta del sitio)
  const C = {
    bg: '#0a0a0a',
    bgHeader: '#161616',
    bgRowEven: '#0f0f0f',
    bgRowOdd: '#141414',
    bgTotal: '#1a1a1a',
    border: '#2a2a2a',
    text: '#f5f5f5',
    textDim: '#9a9a9a',
    textMuted: '#666',
    accent: '#ff6b1a',
    green: '#4ade80',
    yellow: '#fbbf24',
  };

  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
  const fMed  = (px, weight = '400') => `${weight} ${px}px ${FONT}`;

  // Datos de columnas
  const cols = [
    { header: t('tblArma'),       align: 'left'  },
    { header: t('tblCalibre'),    align: 'left'  },
    { header: t('tblDisparos'),   align: 'right' },
    { header: t('tblPrecioUnit'), align: 'right' },
    { header: t('tblTotal'),      align: 'right' },
  ];
  const rowsData = items.map(({ w, shots, lineTotal }) => [
    w.explicitPrice ? w.name : `${w.name} *`,
    w.caliber,
    String(shots),
    formatMain(w.pricePLN),
    formatMain(lineTotal),
  ]);
  const totalRowData = [t('tblGrandTotal'), '', String(totalShots), '', formatMain(totalPLN)];

  // Canvas de medida para calcular anchos de columna
  const measure = document.createElement('canvas').getContext('2d');
  const colPad = 18;
  const colWidths = cols.map((col, i) => {
    measure.font = fMed(13, '700');
    const headerW = measure.measureText(col.header.toUpperCase()).width;
    measure.font = fMed(15, i === 0 ? '600' : '400');
    const bodyMax = Math.max(
      0,
      ...rowsData.map(r => measure.measureText(r[i]).width),
      measure.measureText(totalRowData[i]).width
    );
    return Math.ceil(Math.max(headerW, bodyMax)) + colPad * 2;
  });
  const tableW = colWidths.reduce((a, b) => a + b, 0);

  // Dimensiones
  const padX = 28;
  const padTop = 28;
  const padBottom = 26;
  const titleH = 34;
  const subtitleH = 22;
  const gapBelowTitle = 18;
  const headerRowH = 42;
  const bodyRowH = 38;
  const totalRowH = 48;
  const footerH = 24;
  const gapBelowTable = 14;

  const width = padX * 2 + tableW;
  const height =
    padTop + titleH + subtitleH + gapBelowTitle +
    headerRowH + bodyRowH * items.length + totalRowH +
    gapBelowTable + footerH + padBottom;

  // Canvas real (retina x2)
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.textBaseline = 'middle';

  // Fondo general
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);

  // Título "PM Shooter Warsaw"
  let y = padTop;
  ctx.textAlign = 'left';
  ctx.font = fMed(26, '800');
  ctx.fillStyle = C.text;
  ctx.fillText('PM Shooter ', padX, y + titleH / 2);
  const brandW = ctx.measureText('PM Shooter ').width;
  ctx.fillStyle = C.accent;
  ctx.font = fMed(26, '500');
  ctx.fillText(t('brandCity'), padX + brandW, y + titleH / 2);

  // Subtítulo
  y += titleH;
  ctx.fillStyle = C.textDim;
  ctx.font = fMed(14, '400');
  ctx.fillText(t('myPackTitle'), padX, y + subtitleH / 2);

  // Tabla
  y += subtitleH + gapBelowTitle;
  const tableX = padX;

  // Cabecera
  ctx.fillStyle = C.bgHeader;
  ctx.fillRect(tableX, y, tableW, headerRowH);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tableX, y + headerRowH);
  ctx.lineTo(tableX + tableW, y + headerRowH);
  ctx.stroke();

  ctx.font = fMed(13, '700');
  ctx.fillStyle = C.accent;
  let cx = tableX;
  cols.forEach((col, i) => {
    const cw = colWidths[i];
    ctx.textAlign = col.align;
    const tx = col.align === 'right' ? cx + cw - colPad : cx + colPad;
    ctx.fillText(col.header.toUpperCase(), tx, y + headerRowH / 2);
    cx += cw;
  });
  y += headerRowH;

  // Filas
  rowsData.forEach((row, rIdx) => {
    const bg = rIdx % 2 === 0 ? C.bgRowEven : C.bgRowOdd;
    ctx.fillStyle = bg;
    ctx.fillRect(tableX, y, tableW, bodyRowH);

    let rx = tableX;
    row.forEach((cell, i) => {
      const cw = colWidths[i];
      ctx.textAlign = cols[i].align;
      const tx = cols[i].align === 'right' ? rx + cw - colPad : rx + colPad;
      if (i === 0) {
        ctx.font = fMed(15, '700');
        ctx.fillStyle = C.text;
      } else if (i === 4) {
        ctx.font = fMed(15, '800');
        ctx.fillStyle = C.green;
      } else {
        ctx.font = fMed(14, '400');
        ctx.fillStyle = C.textDim;
      }
      ctx.fillText(cell, tx, y + bodyRowH / 2);
      rx += cw;
    });
    y += bodyRowH;
  });

  // Fila total
  ctx.fillStyle = C.bgTotal;
  ctx.fillRect(tableX, y, tableW, totalRowH);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tableX, y);
  ctx.lineTo(tableX + tableW, y);
  ctx.stroke();

  let tx0 = tableX;
  totalRowData.forEach((cell, i) => {
    const cw = colWidths[i];
    ctx.textAlign = cols[i].align;
    const tx = cols[i].align === 'right' ? tx0 + cw - colPad : tx0 + colPad;
    if (i === 0) {
      ctx.font = fMed(16, '800');
      ctx.fillStyle = C.text;
    } else if (i === 4) {
      ctx.font = fMed(20, '800');
      ctx.fillStyle = C.green;
    } else {
      ctx.font = fMed(14, '700');
      ctx.fillStyle = C.textDim;
    }
    ctx.fillText(cell, tx, y + totalRowH / 2);
    tx0 += cw;
  });
  y += totalRowH;

  // Footer (fuente pequeña)
  y += gapBelowTable;
  ctx.fillStyle = C.textMuted;
  ctx.font = fMed(11, '400');
  ctx.textAlign = 'left';
  const hasInferred = items.some(({ w }) => !w.explicitPrice);
  if (hasInferred) {
    ctx.fillStyle = C.yellow;
    ctx.fillText('* ' + (state.lang === 'es'
      ? 'precio inferido, confirmar en el campo de tiro'
      : state.lang === 'pl'
      ? '* cena szacowana, potwierdź na strzelnicy'
      : '* inferred price, confirm at the range'), padX, y + 7);
  }
  ctx.fillStyle = C.textMuted;
  ctx.textAlign = 'right';
  ctx.fillText('seru7.github.io/pm-shooter', padX + tableW, y + 7);

  // toBlob como Promise (y devolver también la Promise directamente, no blob)
  // IMPORTANTE: en Safari iOS, para que navigator.clipboard.write funcione
  // hay que pasar la Promise del blob dentro del ClipboardItem, no el blob ya
  // resuelto, porque el await rompe el user gesture.
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function sharePackImage() {
  const blob = await generatePackImage();
  if (!blob) return { ok: false, how: 'error' };
  const fileName = 'pm-shooter-pack.png';
  const file = new File([blob], fileName, { type: 'image/png' });

  // 1. Web Share API con file — iPhone/Android abren el share sheet nativo
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t('imgTitle') });
      return { ok: true, how: 'shared' };
    } catch (e) {
      if (e.name === 'AbortError') return { ok: true, how: 'shared' };
      // cualquier otro error → intentar fallback
    }
  }

  // 2. Copiar imagen al portapapeles — desktop Chrome/Safari/Edge
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return { ok: true, how: 'copied' };
    }
  } catch (e) { /* cae al download */ }

  // 3. Descargar como PNG — fallback universal
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, how: 'downloaded' };
  } catch (e) {
    return { ok: false, how: 'error' };
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
