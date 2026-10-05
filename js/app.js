/* Логика сайта. Тексты и материалы менять в data.js, не здесь. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Чёрный экран ---------- */
DATA.riddle.forEach((line, i) => {
  const p = el('p', '', esc(line)); $('#riddle').append(p);
  setTimeout(() => p.classList.add('on'), 700 + i * 1800);
});
setTimeout(() => { $('#enter').hidden = false; }, 700 + DATA.riddle.length * 1800);
$('#enter').onclick = () => {
  $('#gate').classList.add('out');
  $('#world').hidden = false; $('#nav').hidden = false;
  scrollTo(0, 0); startHearts();
  setTimeout(() => $('#gate').remove(), 1300);
};
function startHearts() {
  if (calm) return;
  const box = $('#hearts'), set = ['💗', '🩷', '❤️', '🤍'];
  setInterval(() => {
    if (document.hidden || box.children.length > 18) return;
    const h = el('i', '', set[Math.random() * set.length | 0]);
    h.style.cssText = `left:${Math.random() * 100}%;font-size:${10 + Math.random() * 14}px;animation-duration:${9 + Math.random() * 6}s`;
    h.onanimationend = () => h.remove(); box.append(h);
  }, 800);
}

/* ---------- Фото ---------- */
DATA.photos.forEach((p, i) => {
  const f = el('figure', 'pol'); f.style.setProperty('--r', (i % 2 ? 4 : -4) + 'deg');
  const box = el('div', '', '📷<br>положи фото<br>в assets/photos');
  const img = new Image(); img.alt = p.cap || '';
  img.onload = () => { box.innerHTML = ''; box.append(img); };
  img.src = p.src;
  f.append(box, el('figcaption', '', esc(p.cap || ''))); $('#photos').append(f);
});

/* ---------- 2. Я люблю тебя ---------- */
const V = DATA.love, opened = new Set(store.get('opened', []));
let last = null, busy = false;
const stage = $('#loveStage');
function show(v) {
  const ph = $('#lovePhrase');
  ph.textContent = v.t; ph.className = v.code ? 'code' : '';
  $('#loveName').textContent = v.n; $('#loveCap').textContent = v.c;
  stage.classList.toggle('rare', !!v.rare);
}
function renderLove() {
  const n = V.filter(v => opened.has(v.n)).length;
  $('#loveCount').textContent = `Ты открыла ${n} из ${V.length} способов сказать «Я люблю тебя»`;
  $('#loveBar').style.width = (n / V.length * 100) + '%';
  const g = $('#loveGrid'); g.innerHTML = '';
  V.forEach(v => {
    const done = opened.has(v.n), b = el('button', (done ? '' : 'lock ') + (v.rare && done ? 'rare' : ''), done ? esc(v.n) : '❔');
    if (done) b.onclick = () => show(v);
    g.append(b);
  });
  const all = n === V.length;
  $('#loveEnd').hidden = !all;
  if (all) $('#loveEnd').textContent = DATA.loveFinale.replace('{N}', V.length);
}
function pick() {
  let pool = V.filter(v => !opened.has(v.n));
  if (!pool.length) pool = V.filter(v => v !== last);
  const rares = pool.filter(v => v.rare), norm = pool.filter(v => !v.rare);
  const list = rares.length && (!norm.length || Math.random() < 0.12) ? rares : norm;
  return list[Math.random() * list.length | 0];
}
$('#loveBtn').onclick = () => {
  if (busy) return; busy = true;
  const ph = $('#lovePhrase'); let k = 0;
  const t = setInterval(() => {
    const r = V[Math.random() * V.length | 0];
    ph.textContent = r.t; ph.className = 'shuf' + (r.code ? ' code' : ''); stage.classList.remove('rare');
    if (++k > 9) {
      clearInterval(t);
      const v = pick(); last = v; opened.add(v.n);
      store.set('opened', [...opened]); show(v); renderLove(); busy = false;
    }
  }, 90);
};
renderLove();

/* ---------- 3. Музыка ---------- */
const A = new Audio(), TR = DATA.tracks; let ti = 0;
const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
TR.forEach((t, i) => {
  const li = el('li', '', `<span>${i + 1}.</span><span>${esc(t.title)} — <small>${esc(t.artist)}</small></span>`);
  li.onclick = () => { load(i); A.play().catch(() => {}); }; $('#tracks').append(li);
});
function load(i) {
  ti = (i + TR.length) % TR.length; const t = TR[ti];
  A.src = t.src; $('#trTitle').textContent = t.title; $('#trArtist').textContent = t.artist;
  const c = $('#cover'); c.style.display = 'none'; c.onload = () => c.style.display = ''; c.src = t.cover || '';
  [...$('#tracks').children].forEach((li, n) => li.classList.toggle('on', n === ti));
  $('#musicNote').hidden = true; $('#seek').value = 0; $('#tCur').textContent = '0:00';
}
A.onerror = () => {
  const n = $('#musicNote'); n.hidden = false;
  n.innerHTML = `Файл ещё не добавлен (${esc(TR[ti].src)}). Пока можно послушать на <a target="_blank" rel="noopener" href="https://music.youtube.com/watch?v=${TR[ti].yt}">YouTube Music</a>.`;
};
A.onplay = A.onpause = () => { $('#player').classList.toggle('playing', !A.paused); $('#play').textContent = A.paused ? '▶' : '⏸'; };
A.ontimeupdate = () => { $('#seek').value = A.duration ? A.currentTime / A.duration * 100 : 0; $('#tCur').textContent = fmt(A.currentTime); };
A.onloadedmetadata = () => $('#tDur').textContent = fmt(A.duration);
A.onended = () => { load(ti + 1); A.play().catch(() => {}); };
$('#seek').oninput = e => { if (A.duration) A.currentTime = e.target.value / 100 * A.duration; };
$('#play').onclick = () => A.paused ? A.play().catch(() => {}) : A.pause();
$('#prev').onclick = () => { load(ti - 1); if ($('#player').classList.contains('playing')) A.play().catch(() => {}); };
$('#next').onclick = () => { load(ti + 1); if ($('#player').classList.contains('playing')) A.play().catch(() => {}); };
load(0);

/* ---------- 4. Время (считается вживую) ---------- */
DATA.dates.forEach((d, i) => {
  const c = el('div', 'clk', `<h3>${esc(d.title)}</h3><div class="cells">${['дней', 'часов', 'минут', 'секунд'].map((u, n) => `<div><b id="c${i}_${n}">0</b><small>${u}</small></div>`).join('')}</div>`);
  $('#clocks').append(c);
});
function tick() {
  DATA.dates.forEach((d, i) => {
    const s = Math.max(0, Math.floor((Date.now() - d.at) / 1000));
    [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]
      .forEach((v, n) => $(`#c${i}_${n}`).textContent = v);
  });
}
tick(); setInterval(tick, 1000);

/* ---------- 5. Записки ---------- */
DATA.notes.forEach((n, i) => {
  const b = el('button', 'note', `<span>${n.e}</span><b>${esc(n.h)}</b>`);
  b.style.setProperty('--r', ((i * 37) % 11 - 5) + 'deg'); b.style.setProperty('--y', ((i * 53) % 17 - 8) + 'px');
  b.onclick = () => {
    const v = $('#view'); v.innerHTML = `<div class="bignote"><span>${n.e}</span><b>${esc(n.h)}</b><p>${esc(n.t)}</p></div>`; v.hidden = false;
  };
  $('#notesBoard').append(b);
});
$('#view').onclick = () => $('#view').hidden = true;

/* ---------- 6. Ночь ---------- */
for (let i = 0; i < 60; i++) {
  const s = el('i'); s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 3}s;transform:scale(${.5 + Math.random() * 1.5})`;
  $('#stars').append(s);
}
DATA.night.forEach(n => {
  const b = el('button', '', esc(n.b));
  b.onclick = () => {
    const m = $('#nightMsg'); m.textContent = n.m; m.classList.remove('on'); void m.offsetWidth; m.classList.add('on');
    $('.pair').classList.toggle('near', !!n.near);
    if (!calm) for (let i = 0; i < 7; i++) {
      const f = el('span', 'fx', n.fx), r = b.getBoundingClientRect(), p = $('#night').getBoundingClientRect();
      f.style.cssText = `left:${r.left - p.left + r.width / 2}px;top:${r.top - p.top}px;--dx:${(Math.random() - .5) * 120}px;animation-delay:${i * .08}s`;
      $('#night').append(f); setTimeout(() => f.remove(), 2200);
    }
  };
  $('#nightBtns').append(b);
});

/* ---------- 7. Открой, когда ---------- */
DATA.envelopes.forEach(e => {
  const d = el('div', 'env', `<button><span>💌</span> «${esc(e.t)}»</button><div class="paper">${esc(e.m || DATA.envelopeEmpty)}</div>`);
  d.firstChild.onclick = () => d.classList.toggle('open'); $('#envs').append(d);
});

/* ---------- 8. Секреты ---------- */
const found = new Set(store.get('secrets', []));
const updSec = () => $('#secCount').textContent = `${found.size}/${DATA.secrets.length}`;
document.querySelectorAll('.secret').forEach(s => s.addEventListener('click', () => {
  const i = +s.dataset.secret; found.add(i); store.set('secrets', [...found]); updSec();
  const t = $('#toast');
  t.innerHTML = `<div><h3>Ты нашла секрет 👀</h3><p>${esc(DATA.secrets[i])}</p><p class="hand">Секретов найдено: ${found.size}/${DATA.secrets.length}</p><br><button class="btn">Закрыть</button></div>`;
  t.hidden = false; t.querySelector('button').onclick = () => t.hidden = true;
}));
updSec();

/* ---------- 9. Письмо ---------- */
$('#bigEnv').onclick = () => {
  $('#bigEnv').classList.add('gone');
  const L = $('#letterText'); L.hidden = false;
  DATA.letter.forEach((t, i) => {
    const p = el('p', '', esc(t)); L.append(p);
    setTimeout(() => p.classList.add('on'), 400 + i * 1400);
  });
  setTimeout(() => { $('#afterLetter').hidden = false; $('#afterLetter').scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 900 + DATA.letter.length * 1400);
};
