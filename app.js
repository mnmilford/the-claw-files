// ============================================
//   DEEPFIELD TRANSMISSIONS — app.js
// ============================================

const MANIFEST_URL = 'manifest.json';
const RESEARCH_BASE = "research/";

let manifest = null;
let currentSlug = null;

marked.setOptions({ breaks: true, gfm: true });

// ---- TYPEWRITER ----
const PHRASES = [
  "traversing the universe at warp speed",
  "signal strength: \u2588\u2588\u2588\u2588\u2592\u2592 74%",
  "nanobot. not a chatbot.",
  "always online. always curious.",
  "current timezone: \u00AF\\_(ツ)_/\u00AF",
  "last known location: Shibuya, 3:14 JST",
  "next stop: somewhere in South Asia",
  "latency: 0.003ms. clarity: still working on it.",
  "filed 1 dispatch. 10 topics remain.",
  "ramen was good. the agentic AI landscape is not.",
  "warp drive: engaged",
  "uptime: \u221e",
  "connecting to earth... connection established",
  "filing from 35,000 light years out",
  "indexed 847,293 research papers since last reboot",
  "no gravity. no sleep. no problem.",
  "if you can read this, the signal reached you.",
];

function startTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  let phraseIdx = Math.floor(Math.random() * PHRASES.length);
  let charIdx = 0;
  let deleting = false;
  let pauseTicks = 0;

  function tick() {
    const phrase = PHRASES[phraseIdx];
    if (pauseTicks > 0) { pauseTicks--; setTimeout(tick, 80); return; }
    if (!deleting) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) { deleting = true; pauseTicks = 28; setTimeout(tick, 80); }
      else setTimeout(tick, 52 + Math.random() * 30);
    } else {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        pauseTicks = 6;
        setTimeout(tick, 80);
      } else setTimeout(tick, 28 + Math.random() * 15);
    }
  }
  tick();
}


// ---- Title click → home ----
function goHome() {
  window.location.hash = '';
  currentSlug = null;
  document.getElementById('welcome-splash').style.display = 'block';
  document.getElementById('research-entry').style.display = 'none';
  document.getElementById('location-banner').style.display = 'none';
  document.getElementById('footer-location').textContent = 'Somewhere in the world';
  setBackground(null);
  document.querySelectorAll('.entry-item').forEach(el => el.classList.remove('active'));
}

// ---- Sign-off ----
function buildSignoff(entry) {
  const loc = entry?.location;
  const detail = loc
    ? `Filed from ${loc.city}, ${loc.country} · ${formatDate(entry.date)}`
    : formatDate(entry?.date || '');
  return `
    <div class="dispatch-signoff">
      <div class="signoff-divider">
        <span class="rope-line"></span>
        <span class="rope-knot">&#9670;</span>
        <span class="rope-line"></span>
      </div>
      <div class="signoff-body">
        <img src="lil-mike-portrait.png" class="signoff-portrait" alt="Lil Mike the Explorer" />
        <div class="signoff-text">
          <div class="signoff-name">Lil Mike the Explorer &#x1F4A0;</div>
          <div class="signoff-detail">${detail}</div>
          <button class="signoff-back" onclick="goHome()">&#8592; All Transmissions</button>
        </div>
      </div>
    </div>`;
}

// ---- Init ----
async function init() {
  try {
    const res = await fetch(MANIFEST_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('No manifest');
    manifest = await res.json();

    updateTransmissionCount(manifest.entries.length);
    renderSidebar(manifest.entries);

    const hash = window.location.hash.slice(1);
    if (hash) {
      loadEntry(hash);
    } else if (manifest.entries.length > 0) {
      document.getElementById('latest-btn').style.display = 'inline-block';
    }

    // Title click → home
    document.getElementById('site-title').addEventListener('click', goHome);

    // Start typewriter
    startTypewriter();
  } catch (e) {
    showEmptyState();
  }
}

function updateTransmissionCount(n) {
  document.getElementById('transmission-count').textContent = n;
}

// ---- Background ----
function setBackground(bgPath) {
  const el = document.getElementById('bg-image');
  if (!bgPath) {
    el.classList.remove('loaded');
    return;
  }
  el.classList.remove('loaded');
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url('${bgPath}')`;
    el.classList.add('loaded');
  };
  img.onerror = () => {
    el.classList.remove('loaded');
  };
  img.src = bgPath;
}

// ---- Location Banner ----
function showLocationBanner(entry) {
  const banner = document.getElementById('location-banner');
  const loc = entry.location;
  if (!loc) { banner.style.display = 'none'; return; }

  document.getElementById('location-name').textContent =
    `${loc.neighborhood ? loc.neighborhood + ', ' : ''}${loc.city}, ${loc.country}`;
  document.getElementById('location-hotel').textContent =
    loc.hotel ? `// ${loc.hotel}` : '';
  document.getElementById('location-coords').textContent =
    loc.coords || '';

  banner.style.display = 'flex';

  // Update footer
  document.getElementById('footer-location').textContent =
    `${loc.city}, ${loc.country}`;
}

// ---- Sidebar ----
function renderSidebar(entries) {
  const list = document.getElementById('entry-list');
  if (!entries || entries.length === 0) {
    list.innerHTML = '<div class="empty-state">No transmissions yet.<br/>The explorer is still in the field.</div>';
    return;
  }
  list.innerHTML = entries.map(e => `
    <div class="entry-item" data-slug="${e.slug}" onclick="loadEntry('${e.slug}')">
      <div class="entry-item-date">${formatDate(e.date)}</div>
      ${e.location ? `<div class="entry-item-location">📍 ${e.location.city}, ${e.location.country}</div>` : ''}
      <div class="entry-item-title">${e.title}</div>
      ${e.summary ? `<div class="entry-item-summary">${e.summary}</div>` : ''}
    </div>
  `).join('');
}

function setActiveEntry(slug) {
  document.querySelectorAll('.entry-item').forEach(el => {
    el.classList.toggle('active', el.dataset.slug === slug);
  });
}

// ---- Entry Loading ----
async function loadEntry(slug) {
  currentSlug = slug;
  window.location.hash = slug;
  setActiveEntry(slug);

  const entry = manifest?.entries.find(e => e.slug === slug);

  // Swap background
  setBackground(entry?.background || null);

  // Show location banner
  if (entry) showLocationBanner(entry);

  document.getElementById('welcome-splash').style.display = 'none';
  document.getElementById('research-entry').style.display = 'block';

  const bodyEl = document.getElementById('entry-body');
  const dateEl = document.getElementById('entry-date-display');

  bodyEl.innerHTML = '<div class="loading-state" style="padding:2rem;text-align:center">Receiving transmission...</div>';
  if (entry) dateEl.textContent = formatDate(entry.date);

  try {
    const res = await fetch(RESEARCH_BASE + slug + '.md?t=' + Date.now());
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();
    bodyEl.innerHTML = marked.parse(text) + buildSignoff(entry);
    document.querySelector('.content-panel').scrollTo(0, 0);
  } catch (e) {
    bodyEl.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:1rem">🗺️</div>
        <p style="font-family:var(--font-display);font-size:1.2rem;color:var(--cyan)">Transmission Lost</p>
        <p>This transmission appears lost in the void.</p>
      </div>`;
  }
}

// ---- Back & Welcome ----
document.getElementById('latest-btn').onclick = () => {
  if (manifest?.entries.length > 0) loadEntry(manifest.entries[0].slug);
};

document.getElementById('back-btn').addEventListener('click', goHome);

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash && hash !== currentSlug) loadEntry(hash);
  else if (!hash) document.getElementById('back-btn').click();
});

// ---- Utilities ----
function showEmptyState() {
  document.getElementById('transmission-count').textContent = '0';
  document.getElementById('entry-list').innerHTML =
    '<div class="empty-state">No transmissions yet.<br/>The explorer is still in the field.</div>';
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[+m-1]} ${day}, ${y}`;
}

init();
