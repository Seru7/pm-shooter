// PM Shooter — catálogo front-end
const state = {
  weapons: [],
  search: '',
  category: 'all',
  section: 'all',
  explicitOnly: false,
  sort: 'section', // 'section' | 'priceAsc' | 'priceDesc' | 'name'
};

const SECTION_LABEL = {
  malokalibrowa: 'Pequeño calibre (.22)',
  bojowa:        'Combate',
  maszynowa:     'Automáticas',
};

const SECTION_ORDER = { malokalibrowa: 0, bojowa: 1, maszynowa: 2 };

const $ = sel => document.querySelector(sel);
const gridEl = $('#grid');
const emptyEl = $('#empty');
const statsEl = $('#stats');
const searchEl = $('#search');
const explicitEl = $('#explicitOnly');
const sortBtn = $('#sortBtn');

async function init() {
  try {
    const res = await fetch('weapons.json');
    state.weapons = await res.json();
  } catch (e) {
    gridEl.innerHTML = `<p class="empty">Error cargando weapons.json: ${e.message}</p>`;
    return;
  }

  searchEl.addEventListener('input', e => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });

  explicitEl.addEventListener('change', e => {
    state.explicitOnly = e.target.checked;
    render();
  });

  document.querySelectorAll('.chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { filter, value } = btn.dataset;
      state[filter] = value;
      document
        .querySelectorAll(`.chip[data-filter="${filter}"]`)
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
    const next = order[(order.indexOf(state.sort) + 1) % order.length];
    state.sort = next;
    sortBtn.textContent = labels[next];
    render();
  });

  render();
}

function matches(w) {
  if (state.category !== 'all' && w.category !== state.category) return false;
  if (state.section !== 'all' && w.section !== state.section) return false;
  if (state.explicitOnly && !w.explicitPrice) return false;
  if (state.search) {
    const q = state.search;
    const haystack = (w.name + ' ' + w.caliber + ' ' + w.category).toLowerCase();
    if (!haystack.includes(q)) return false;
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

  // stats
  const total = state.weapons.length;
  const shown = filtered.length;
  const explicit = state.weapons.filter(w => w.explicitPrice).length;
  statsEl.textContent = `${shown}/${total} armas · ${explicit} con precio confirmado`;

  if (!shown) {
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // Agrupación por sección solo cuando el orden es por sección
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

  const priceHtml = hasPrice
    ? `<div class="price-main">${w.pricePLN} PLN${!w.explicitPrice ? '<span class="asterisk">*</span>' : ''}</div>
       <div class="price-eur">≈ ${w.priceEUR.toFixed(2).replace('.', ',')} €</div>`
    : `<div class="price-main">consultar</div>`;

  return `
    <article class="${classes.join(' ')}">
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
      </div>
    </article>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

init();
