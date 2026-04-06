// Floating audio player for Deepfield Transmissions
(function(){
  const ID = 'floating-audio-player';
  function createPlayer() {
    if (document.getElementById(ID)) return document.getElementById(ID);
    const el = document.createElement('div');
    el.id = ID;
    el.className = 'floating-audio-player';
    el.innerHTML = `
      <div class="fp-header">
        <img class="fp-icon" src="/lil-mike-audio-icon.png" alt="Lil Mike" />
        <div class="fp-title">Playback</div>
        <button class="fp-close" aria-label="Close">✕</button>
      </div>
      <div class="fp-controls">
        <button class="fp-play">▶</button>
        <div class="fp-progress"><div class="fp-progress-fill"></div></div>
        <div class="fp-time">0:00</div>
      </div>
      <audio class="fp-audio" preload="none"></audio>
    `;
    document.body.appendChild(el);

    // Drag
    let dragging = false, startX=0, startY=0, origX=0, origY=0;
    el.addEventListener('pointerdown', (ev)=>{
      if (ev.target.closest('.fp-close') || ev.target.closest('.fp-play')) return;
      dragging = true;
      el.setPointerCapture(ev.pointerId);
      startX = ev.clientX; startY = ev.clientY;
      const rect = el.getBoundingClientRect();
      origX = rect.left; origY = rect.top;
    });
    window.addEventListener('pointermove', (ev)=>{
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      el.style.left = (origX + dx) + 'px';
      el.style.top = (origY + dy) + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
    window.addEventListener('pointerup', (ev)=>{ dragging=false; });

    // Controls
    const audio = el.querySelector('.fp-audio');
    const playBtn = el.querySelector('.fp-play');
    const closeBtn = el.querySelector('.fp-close');
    const timeEl = el.querySelector('.fp-time');
    const fill = el.querySelector('.fp-progress-fill');

    playBtn.addEventListener('click', ()=>{
      if (audio.paused) audio.play(); else audio.pause();
    });
    closeBtn.addEventListener('click', ()=>{ el.style.display='none'; try{ audio.pause(); }catch(e){} });

    audio.addEventListener('play', ()=>{ playBtn.textContent = '⏸'; el.classList.add('playing'); });
    audio.addEventListener('pause', ()=>{ playBtn.textContent = '▶'; el.classList.remove('playing'); });
    audio.addEventListener('timeupdate', ()=>{
      const t = audio.currentTime || 0; const d = audio.duration || 0;
      timeEl.textContent = formatTime(t);
      if (d>0) fill.style.width = Math.max(0, Math.min(100, (t/d*100))) + '%';
    });

    el.querySelector('.fp-progress').addEventListener('click', (ev)=>{
      const rect = ev.currentTarget.getBoundingClientRect();
      const pct = (ev.clientX - rect.left) / rect.width;
      if (audio.duration) audio.currentTime = Math.max(0, Math.min(audio.duration, pct * audio.duration));
    });

    return el;
  }

  function formatTime(t){
    if (!isFinite(t) || t<=0) return '0:00';
    const m = Math.floor(t/60); const s = Math.floor(t%60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  window.attachFloatingAudio = function(slug, audioUrl, iconUrl){
    try{
      const el = createPlayer();
      el.style.display = 'block';
      // set defaults if not positioned
      if (!el.style.left && !el.style.top) {
        el.style.right = '20px'; el.style.bottom = '20px';
      }
      const audio = el.querySelector('.fp-audio');
      const icon = el.querySelector('.fp-icon');
      icon.src = iconUrl || '/lil-mike-audio-icon.png';
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
        audio.load();
      }
    }catch(e){console.warn('attachFloatingAudio', e)}
  };

})();
