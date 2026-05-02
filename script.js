/* =================== PRELOADER =================== */
(function(){
  const pre = document.getElementById('preloader');
  const pct = pre && pre.querySelector('.pct');
  document.body.classList.add('locked');

  pre && pre.querySelectorAll('.preloader-brand .line').forEach(line => {
    line.querySelectorAll('.char').forEach((c, i) => c.style.setProperty('--i', i));
  });

  let counterRaf = null;
  const startCounter = () => {
    const start = performance.now();
    const dur = 2000;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const counter = Math.floor(eased * 100);
      if (pct) pct.textContent = counter.toString().padStart(2, '0');
      if (p < 1) counterRaf = requestAnimationFrame(tick);
    };
    counterRaf = requestAnimationFrame(tick);
  };
  setTimeout(startCounter, 2000);

  function dismiss(){
    pre.classList.add('done');
    document.body.classList.remove('locked');
    document.querySelectorAll('.hero .reveal-word').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 80 * i);
    });
    document.querySelectorAll('.hero .reveal').forEach(el => {
      const d = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('in'), d);
    });
    setTimeout(() => { pre.style.display = 'none'; }, 1300);
  }

  const minTime = 4200;
  const start = performance.now();
  window.addEventListener('load', () => {
    const elapsed = performance.now() - start;
    setTimeout(dismiss, Math.max(0, minTime - elapsed));
  });
  if (document.readyState === 'complete') {
    setTimeout(dismiss, minTime);
  }
})();

/* =================== HERO TITLE: split letters =================== */
(function(){
  document.querySelectorAll('.reveal-word').forEach(word => {
    if (word.classList.contains('hero-script')) return;
    const spans = word.querySelectorAll('span');
    if (spans.length === 0) {
      const text = word.textContent;
      word.textContent = '';
      [...text].forEach(ch => {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        word.appendChild(s);
      });
    }
  });
})();

/* =================== TOPBAR show on scroll =================== */
(function(){
  const tb = document.getElementById('topbar');
  if (!tb) return;
  let last = 0;
  function check(){
    const y = window.scrollY;
    tb.classList.toggle('show', y > 400);
    last = y;
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();

/* =================== CATEGORY PILLS (menu + drinks) =================== */
function initCatNav(navSel, stageSel){
  const nav = document.querySelector(navSel);
  const stage = document.querySelector(stageSel);
  if (!nav || !stage) return;
  const pills = nav.querySelectorAll('.cat-pill');
  const sections = stage.querySelectorAll('.cat-section');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      pills.forEach(p => p.classList.toggle('active', p === pill));
      sections.forEach(s => s.classList.toggle('active', s.dataset.cat === cat));
      // keep nav in view, scroll to section top
      const rect = nav.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight - 200){
        nav.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
  });
}
initCatNav('#catNav', '#catStage');
initCatNav('#drinkNav', '#drinkStage');

/* =================== ITEM HOVER =================== */
(function(){
  document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const r = item.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      item.style.background = `linear-gradient(90deg, rgba(212,165,116,.10) 0%, transparent ${x}%)`;
    });
    item.addEventListener('mouseleave', () => { item.style.background = ''; });
  });
})();

/* =================== GALLERY: video + lightbox =================== */
(function(){
  const v = document.getElementById('heroVideo');
  const playBtn = document.getElementById('videoPlay');
  const meta = document.querySelector('.video-meta');
  if (v && playBtn) {
    const toggleVideo = () => {
      if (v.paused) {
        v.muted = false;
        v.play();
        playBtn.classList.add('hide');
        meta && meta.classList.add('hide');
      } else {
        v.pause();
        playBtn.classList.remove('hide');
        meta && meta.classList.remove('hide');
      }
    };
    playBtn.addEventListener('click', toggleVideo);
    v.addEventListener('click', toggleVideo);
    v.addEventListener('ended', () => {
      playBtn.classList.remove('hide');
      meta && meta.classList.remove('hide');
    });
  }

  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  document.querySelectorAll('.g-tile').forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      lbImg.src = t.dataset.img;
      lb.classList.add('open');
    });
  });
  document.querySelector('[data-lb-close]')?.addEventListener('click', () => lb.classList.remove('open'));
  lb?.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
})();

/* =================== RATING =================== */
(function(){
  const KEY = 'cachita_reviews_v1';
  const stars = document.querySelectorAll('#starInput button');
  const starsValue = document.getElementById('starsValue');
  const form = document.getElementById('rateForm');
  const list = document.getElementById('reviewsList');
  const successEl = document.getElementById('rateSuccess');
  const avgScore = document.getElementById('avgScore');
  const avgStars = document.getElementById('avgStars');
  const avgCount = document.getElementById('avgCount');

  if (!stars.length) return;

  let current = 0;
  function paint(n){
    stars.forEach((s, i) => {
      s.classList.toggle('hot', i < n);
      s.classList.toggle('active', i < n);
    });
  }
  stars.forEach(s => {
    const v = parseInt(s.dataset.v, 10);
    s.addEventListener('mouseenter', () => paint(v));
    s.addEventListener('mouseleave', () => paint(current));
    s.addEventListener('click', () => {
      current = v;
      starsValue.value = v;
      paint(current);
    });
  });

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ return []; }
  }
  function save(reviews){ localStorage.setItem(KEY, JSON.stringify(reviews)); }
  function fmtDate(ts){
    const d = new Date(ts);
    return d.toLocaleDateString('es', {day:'2-digit', month:'short', year:'numeric'});
  }
  function escape(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function render(){
    const reviews = load();
    if (reviews.length === 0){
      list.innerHTML = '<div class="reviews-empty">Sé el primero en compartir tu experiencia.</div>';
      avgScore.textContent = '—';
      avgStars.style.setProperty('--avg', '0%');
      avgCount.textContent = '0 reseñas';
      return;
    }
    const total = reviews.reduce((a,r) => a + r.stars, 0);
    const avg = total / reviews.length;
    avgScore.textContent = avg.toFixed(1);
    avgStars.style.setProperty('--avg', (avg/5*100) + '%');
    avgCount.textContent = reviews.length + (reviews.length === 1 ? ' reseña' : ' reseñas');
    list.innerHTML = reviews.slice().reverse().map(r => `
      <div class="review-item">
        <div class="review-head">
          <span class="review-name">${escape(r.name)}</span>
          <span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</span>
        </div>
        ${r.comment ? `<p class="review-text">${escape(r.comment)}</p>` : ''}
        <span class="review-date">${fmtDate(r.ts)}</span>
      </div>
    `).join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const stars_ = parseInt(starsValue.value, 10);
    const name = document.getElementById('rName').value.trim();
    const comment = document.getElementById('rComment').value.trim();
    if (!stars_ || !name) return;
    const reviews = load();
    reviews.push({ stars: stars_, name, comment, ts: Date.now() });
    save(reviews);
    form.reset();
    current = 0; paint(0);
    successEl.classList.add('show');
    setTimeout(() => successEl.classList.remove('show'), 3500);
    render();
  });

  render();
})();

/* =================== FOOTER YEAR =================== */
document.getElementById('year').textContent = new Date().getFullYear();
