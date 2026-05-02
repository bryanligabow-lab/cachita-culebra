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

/* =================== REWARDS =================== */
(function(){
  const KEY = 'cachita_rewards_v1';
  const root = document.getElementById('rewards');
  if (!root) return;

  const $ = sel => root.querySelector(sel);
  const tierName = $('#rwTierName');
  const tierIconWrap = root.querySelector('.rw-tier');
  const points = $('#rwPoints');
  const visits = $('#rwVisits');
  const streak = $('#rwStreak');
  const claimed = $('#rwClaimed');
  const progressLabel = $('#rwProgressLabel');
  const progressPct = $('#rwProgressPct');
  const progressFill = $('#rwProgressFill');
  const claimBtn = $('#rwClaimBtn');
  const claimMsg = $('#rwClaimMsg');
  const history = $('#rwHistory');
  const tierCards = root.querySelectorAll('.rw-tier-card');
  const prizes = root.querySelectorAll('.rw-prize');
  const resetBtn = $('#rwReset');
  const toast = document.getElementById('rwToast');
  const toastCode = document.getElementById('rwToastCode');
  const toastDesc = document.getElementById('rwToastDesc');
  const toastClose = document.getElementById('rwToastClose');

  const TIERS = [
    { id:'bronze',   name:'Bronce',   min:0,    max:499,  perVisit:50  },
    { id:'silver',   name:'Plata',    min:500,  max:1499, perVisit:60  },
    { id:'gold',     name:'Oro',      min:1500, max:2999, perVisit:75  },
    { id:'platinum', name:'Platino',  min:3000, max:Infinity, perVisit:100 }
  ];
  function tierFor(pts){
    return TIERS.find(t => pts >= t.min && pts <= t.max) || TIERS[0];
  }
  function nextTier(pts){
    const idx = TIERS.findIndex(t => pts >= t.min && pts <= t.max);
    return TIERS[idx + 1] || null;
  }

  function load(){
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (!data) throw new Error();
      return data;
    } catch(e) {
      return { points:0, visits:0, streak:0, lastVisit:null, claimed:0, history:[] };
    }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }

  function fmt(n){ return n.toLocaleString('es') }
  function todayKey(){
    const d = new Date(); return d.toISOString().slice(0,10);
  }
  function dayDiff(d1, d2){
    const a = new Date(d1), b = new Date(d2);
    return Math.round((b - a) / 86400000);
  }
  function fmtDate(ts){
    const d = new Date(ts);
    return d.toLocaleString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }
  function genCode(){
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const pick = n => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    return pick(4) + '-' + pick(4);
  }

  function render(){
    const state = load();
    const t = tierFor(state.points);
    const nt = nextTier(state.points);

    points.textContent = fmt(state.points);
    visits.textContent = fmt(state.visits);
    streak.textContent = fmt(state.streak);
    claimed.textContent = fmt(state.claimed);

    tierName.textContent = t.name;
    tierIconWrap.dataset.tier = t.id;

    if (nt){
      const into = state.points - t.min;
      const span = nt.min - t.min;
      const pct = Math.min(100, Math.round((into / span) * 100));
      progressLabel.textContent = `Te faltan ${fmt(nt.min - state.points)} pts para ${nt.name}`;
      progressPct.textContent = pct + '%';
      progressFill.style.width = pct + '%';
    } else {
      progressLabel.textContent = '¡Eres miembro Platino!';
      progressPct.textContent = '100%';
      progressFill.style.width = '100%';
    }

    tierCards.forEach(c => c.classList.toggle('current', c.dataset.tier === t.id));

    prizes.forEach(p => {
      const cost = parseInt(p.dataset.cost, 10);
      const btn = p.querySelector('.rwp-redeem');
      btn.disabled = state.points < cost;
      btn.textContent = state.points < cost ? `Faltan ${fmt(cost - state.points)}` : 'Canjear';
    });

    // claim btn state
    const today = todayKey();
    if (state.lastVisit === today){
      claimBtn.disabled = true;
      claimBtn.querySelector('.bm-label').textContent = '✓ Visita registrada hoy';
      claimMsg.textContent = `Vuelve mañana para sumar ${tierFor(state.points).perVisit} pts más.`;
    } else {
      claimBtn.disabled = false;
      claimBtn.querySelector('.bm-label').textContent = `Registrar visita · +${tierFor(state.points).perVisit} pts`;
      claimMsg.textContent = '';
    }

    // history
    if (!state.history.length){
      history.innerHTML = '<div class="rw-empty">Aún no tienes movimientos. Registra tu primera visita arriba.</div>';
    } else {
      history.innerHTML = state.history.slice().reverse().slice(0, 30).map(h => `
        <div class="rw-entry">
          <div class="rw-entry-left">
            <span class="rw-entry-act">${h.act}</span>
            <span class="rw-entry-date">${fmtDate(h.ts)}</span>
          </div>
          <span class="rw-entry-pts ${h.delta > 0 ? 'plus' : 'minus'}">${h.delta > 0 ? '+' : ''}${fmt(h.delta)} pts</span>
        </div>
      `).join('');
    }
  }

  // Claim today's visit
  claimBtn.addEventListener('click', () => {
    const state = load();
    const today = todayKey();
    if (state.lastVisit === today) return;
    const t = tierFor(state.points);
    let delta = t.perVisit;
    let act = `Visita registrada · ${t.name}`;

    // streak
    if (state.lastVisit && dayDiff(state.lastVisit, today) === 1){
      state.streak = (state.streak || 0) + 1;
    } else {
      state.streak = 1;
    }
    // streak bonus every 5 days
    let bonus = 0;
    if (state.streak > 0 && state.streak % 5 === 0){
      bonus = 100;
    }

    state.points += delta;
    state.visits += 1;
    state.lastVisit = today;
    state.history.push({ act, delta, ts: Date.now() });
    if (bonus){
      state.points += bonus;
      state.history.push({ act: `Bonus racha de ${state.streak} días`, delta: bonus, ts: Date.now() + 1 });
    }
    save(state);
    render();

    claimMsg.classList.add('success');
    claimMsg.textContent = `+${delta} pts${bonus ? ` · Bonus +${bonus}` : ''} · Total ${fmt(state.points)} pts`;
    setTimeout(() => claimMsg.classList.remove('success'), 4000);
  });

  // Redeem prizes
  prizes.forEach(p => {
    const btn = p.querySelector('.rwp-redeem');
    btn.addEventListener('click', () => {
      const state = load();
      const cost = parseInt(p.dataset.cost, 10);
      if (state.points < cost) return;
      const name = p.querySelector('h4').textContent;
      const code = genCode();
      state.points -= cost;
      state.claimed += 1;
      state.history.push({ act: `Canje · ${name} (${code})`, delta: -cost, ts: Date.now() });
      save(state);
      render();

      // toast
      toastCode.textContent = code;
      toastDesc.textContent = name;
      toast.classList.add('show');
    });
  });

  toastClose.addEventListener('click', () => toast.classList.remove('show'));
  toast.addEventListener('click', (e) => { if (e.target === toast) toast.classList.remove('show'); });

  resetBtn.addEventListener('click', () => {
    if (!confirm('¿Seguro que quieres reiniciar tu cuenta de Rewards? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(KEY);
    render();
  });

  render();
})();

/* =================== FOOTER YEAR =================== */
document.getElementById('year').textContent = new Date().getFullYear();
