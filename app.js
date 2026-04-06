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

// ---- FLYING NANOBOT ----
function randomizeNanobot() {
  const nb = document.getElementById('flying-nanobot');
  if (!nb) return;
  
  // Random starting position
  const startX = Math.random() * 80 + 5;
  const startY = Math.random() * 80 + 5;
  
  // Random animation duration (30-60s)
  const duration = 30 + Math.random() * 30;
  
  // Random keyframe offsets
  const randomize = () => Math.random() * 80 + 5;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes nanobot-flight-${Date.now()} {
      0% { transform: translate(${startX}%, ${startY}%) scale(1); }
      15% { transform: translate(${randomize()}%, ${randomize()}%) scale(0.9); }
      30% { transform: translate(${randomize()}%, ${randomize()}%) scale(1.1); }
      45% { transform: translate(${randomize()}%, ${randomize()}%) scale(0.95); }
      60% { transform: translate(${randomize()}%, ${randomize()}%) scale(1); }
      75% { transform: translate(${randomize()}%, ${randomize()}%) scale(1.05); }
      90% { transform: translate(${randomize()}%, ${randomize()}%) scale(0.9); }
      100% { transform: translate(${startX}%, ${startY}%) scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  nb.style.animation = `nanobot-flight-${Date.now()} ${duration}s infinite`;
}

function startTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  // Adjacent keys for realistic typos
  const adjacentKeys = {
    a:'sq',b:'vgn',c:'xvd',d:'sfe',e:'wrd',f:'dge',g:'fth',h:'gjy',i:'uko',
    j:'hkn',k:'jlm',l:'k',m:'nk',n:'bmh',o:'ip',p:'o',q:'wa',r:'et',
    s:'ad',t:'ry',u:'yi',v:'bc',w:'qe',x:'zc',y:'tu',z:'x'
  };

  function typo(ch) {
    const opts = adjacentKeys[ch.toLowerCase()];
    if (!opts) return ch + '?';
    return opts[Math.floor(Math.random() * opts.length)];
  }

  let phraseIdx = Math.floor(Math.random() * PHRASES.length);

  function typePhrase() {
    const phrase = PHRASES[phraseIdx];
    let built = '';
    let i = 0;
    // Decide which positions get a typo (0-2 mistakes, 25% chance each char up to 2)
    const mistakePositions = new Set();
    for (let p = 0; p < phrase.length && mistakePositions.size < 2; p++) {
      if (Math.random() < 0.04) mistakePositions.add(p);
    }

    function typeNext() {
      if (i >= phrase.length) {
        // Phrase fully typed — dwell 30-60s then erase
        const dwell = 30000 + Math.random() * 30000;
        setTimeout(erasePhrase, dwell);
        return;
      }

      const correctChar = phrase[i];

      if (mistakePositions.has(i)) {
        // Type the wrong char
        const wrongChar = typo(correctChar);
        built += wrongChar;
        el.textContent = built;
        // Pause, then realize mistake and backspace
        setTimeout(() => {
          built = built.slice(0, -1);
          el.textContent = built;
          // Small pause after backspace, then type correct char
          setTimeout(() => {
            built += correctChar;
            el.textContent = built;
            i++;
            setTimeout(typeNext, 90 + Math.random() * 60);
          }, 120 + Math.random() * 80);
        }, 180 + Math.random() * 150);
      } else {
        built += correctChar;
        el.textContent = built;
        i++;
        // Natural typing rhythm — slight pauses after spaces/punctuation
        const isBreak = ' .,!?-'.includes(correctChar);
        const delay = isBreak
          ? 160 + Math.random() * 120
          : 85 + Math.random() * 55;
        setTimeout(typeNext, delay);
      }
    }

    function erasePhrase() {
      if (built.length === 0) {
        // Move to next phrase, pause briefly before starting
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        setTimeout(typePhrase, 600 + Math.random() * 400);
        return;
      }
      built = built.slice(0, -1);
      el.textContent = built;
      setTimeout(erasePhrase, 40 + Math.random() * 25);
    }

    typeNext();
  }

  // Initial delay before first phrase appears
  setTimeout(typePhrase, 1200);
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
      <div class="signoff-card">
        <div class="signoff-body">
          <div class="signoff-portrait-frame">
            <img src="lil-mike-portrait.png" class="signoff-portrait" alt="Lil Mike the Explorer" />
          </div>
          <div class="signoff-text">
            <div class="signoff-label">Transmission filed by</div>
            <div class="signoff-name">Lil Mike the Explorer <span class="signoff-mark">&#x1F4A0;</span></div>
            <div class="signoff-detail">${detail}</div>
            <div class="signoff-actions">
              <button class="signoff-back" onclick="goHome()">&#8592; All Transmissions</button>
            </div>
          </div>
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

    // Randomize nanobot flight
    randomizeNanobot();
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
    // Replace [[ig:URL]] tokens with Instagram embed HTML
    const processedText = text.replace(/\[\[ig:(https?:\/\/[^\]]+)\]\]/g, (_, url) =>
      `\n\n<div class="ig-embed-wrapper"><blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${url}" data-instgrm-version="14" style="background:#0a0e1a;border:1px solid #00e5ff;border-radius:4px;box-shadow:0 0 20px rgba(0,229,255,0.15);margin:1.5rem auto;max-width:540px;min-width:280px;width:calc(100% - 2px);"></blockquote></div>\n\n`
    );
    bodyEl.innerHTML = marked.parse(processedText) + buildSignoff(entry);
    // Re-process any IG embeds injected into the DOM
    if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
    document.querySelector('.content-panel').scrollTo(0, 0);

    // Audio player: check for cached audio (floating player)
    (async function() {
      const slugForAudio = slug;
      if (!slugForAudio) return;
      const audioUrl = `/audio/${slugForAudio}.mp3?t=${Date.now()}`;
      try {
        const head = await fetch(audioUrl, { method: 'HEAD' });
        if (head.ok) {
          if (window.attachFloatingAudio) window.attachFloatingAudio(slugForAudio, audioUrl, '/lil-mike-audio-icon.png');
        }
      } catch (err) {
        // ignore
      }
    })();
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
