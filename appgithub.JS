/* =====================================================================
   MEMORY CARD GAME – Flip & Match
   Pure JavaScript (no separate HTML/CSS files needed)
   Rules:
     • Score starts at 100. Each pair flip costs 1 point.
     • 5 wrong pairs = Game Over.
     • 60-second countdown = Game Over if time runs out.
     • Match all pairs before either limit to win.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 1) LOAD FONT ---------- */
  (function loadFont() {
    const p1 = document.createElement('link');
    p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(p1);

    const p2 = document.createElement('link');
    p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com';
    p2.crossOrigin = 'anonymous';
    document.head.appendChild(p2);

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap';
    document.head.appendChild(css);
  })();

  if (!document.title) document.title = 'Memory Card Game';

  /* ---------- 2) INJECT CSS ---------- */
  const CSS = `
  *{ box-sizing:border-box; margin:0; padding:0; }
  :root{ --card-w:80px; --ink:#f4f0ff; --panel:rgba(255,255,255,.08); --stroke:rgba(255,255,255,.14); }
  html,body{ min-height:100%; }
  body{
    font-family:'Baloo 2', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background:#120a26; color:var(--ink); min-height:100dvh;
    display:flex; justify-content:center; padding:18px 14px 36px;
    overflow-x:hidden; -webkit-font-smoothing:antialiased;
    touch-action:manipulation; user-select:none; -webkit-user-select:none;
  }
  body::before{
    content:''; position:fixed; inset:-25%; z-index:-1;
    background:
      radial-gradient(circle at 18% 18%, rgba(124,92,255,.45), transparent 42%),
      radial-gradient(circle at 84% 8%,  rgba(255,92,180,.32), transparent 42%),
      radial-gradient(circle at 72% 92%, rgba(56,224,204,.25), transparent 45%),
      radial-gradient(circle at 10% 88%, rgba(255,170,60,.18), transparent 45%);
    filter:blur(8px); animation:drift 22s ease-in-out infinite alternate;
  }
  @keyframes drift{ to{ transform:translate3d(0,-40px,0) rotate(4deg) scale(1.08); } }
  .app{ width:100%; max-width:760px; display:flex; flex-direction:column; align-items:center; gap:16px; }
  header{ width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  h1{
    font-size:clamp(1.35rem,5vw,1.9rem); font-weight:800; line-height:1.1; letter-spacing:.3px;
    background:linear-gradient(90deg,#ffffff,#ffd6f5 45%,#a5e9ff);
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  header p{ font-size:.85rem; opacity:.6; font-weight:500; margin-top:2px; }
  .icon-btn{
    width:46px; height:46px; flex:0 0 auto; border-radius:15px;
    border:1px solid var(--stroke); background:var(--panel); color:#fff; font-size:1.15rem;
    display:grid; place-items:center; cursor:pointer; backdrop-filter:blur(10px);
    transition:transform .15s, background .2s;
  }
  .icon-btn:hover{ background:rgba(255,255,255,.16); }
  .icon-btn:active{ transform:scale(.9); }

  /* --- Stats: 4 items, wraps to 2x2 on small screens --- */
  .stats{ display:flex; flex-wrap:wrap; gap:8px; width:100%; }
  .stat{
    flex:1 1 calc(50% - 4px); min-width:0;
    display:flex; align-items:center; gap:9px; padding:9px 12px;
    border-radius:16px; background:var(--panel); border:1px solid var(--stroke);
    backdrop-filter:blur(10px);
  }
  @media (min-width:520px){ .stat{ flex:1 1 0; } }
  .stat .ico{ font-size:1.15rem; flex:0 0 auto; }
  .stat b{ display:block; font-size:1.02rem; font-weight:800; line-height:1.15; font-variant-numeric:tabular-nums; }
  .stat small{ display:block; font-size:.6rem; opacity:.55; font-weight:700; letter-spacing:.5px; text-transform:uppercase; white-space:nowrap; }
  .stat b.urgent{ color:#ff5c7a; animation:pulse 1s ease-in-out infinite; }
  @keyframes pulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }

  /* --- Board --- */
  .board{
    display:grid; grid-template-columns:repeat(var(--cols,4),1fr);
    gap:clamp(6px,1.4vw,12px); width:min(100%, calc(var(--cols,4) * 104px));
    perspective:1400px;
  }
  .card{
    position:relative; aspect-ratio:3/4; border:none; padding:0; background:none;
    border-radius:clamp(8px,2vw,16px); cursor:pointer; perspective:700px;
    -webkit-tap-highlight-color:transparent; transition:transform .18s ease;
    animation:dealIn .45s backwards cubic-bezier(.2,.8,.3,1.35);
  }
  @keyframes dealIn{ from{ opacity:0; transform:translateY(20px) scale(.82) rotate(-7deg); } }
  .card:not(.flipped):not(.matched):hover{ transform:translateY(-6px); }
  .card:not(.flipped):not(.matched):active{ transform:translateY(-2px) scale(.97); }
  .card:focus-visible{ outline:3px solid #8ab4ff; outline-offset:3px; }
  .card-inner{ position:absolute; inset:0; transform-style:preserve-3d;
    transition:transform .5s cubic-bezier(.4,.15,.2,1); border-radius:inherit; }
  .card.flipped .card-inner,
  .card.matched .card-inner{ transform:rotateY(180deg); }
  .card-face{
    position:absolute; inset:0; display:grid; place-items:center; border-radius:inherit;
    backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden;
  }
  .card-face span{ line-height:1; display:block; }
  .face-cover{
    background:linear-gradient(150deg,#7b5cff,#c86dd7 55%,#ff8ac4);
    border:2px solid rgba(255,255,255,.35);
    box-shadow:inset 0 -6px 0 rgba(0,0,0,.18), inset 0 8px 14px rgba(255,255,255,.22), 0 6px 14px rgba(0,0,0,.25);
    color:#fff;
  }
  .face-cover span{ font-size:calc(var(--card-w,80px) * .45); font-weight:800; text-shadow:0 2px 8px rgba(0,0,0,.3); opacity:.92; }
  .face-front{ transform:rotateY(180deg); background:linear-gradient(160deg,#fffdf7,#ffe9c9); border:2px solid rgba(255,255,255,.9); box-shadow:inset 0 -5px 0 rgba(0,0,0,.08); }
  .face-front span{ font-size:calc(var(--card-w,80px) * .62); }
  .card.matched{ cursor:default; }
  .card.matched .face-front{
    box-shadow:0 0 0 3px #3ddc84, 0 0 24px rgba(61,220,132,.65), inset 0 -5px 0 rgba(0,0,0,.06);
    animation:pop .42s ease;
  }
  @keyframes pop{ 0%{transform:rotateY(180deg) scale(1)} 45%{transform:rotateY(180deg) scale(1.13)} 100%{transform:rotateY(180deg) scale(1)} }
  .card.wrong .card-inner{ animation:shake .45s ease; }
  @keyframes shake{
    0%,100%{ transform:rotateY(180deg) translateX(0); }
    20%{ transform:rotateY(180deg) translateX(-7px) rotate(-2deg); }
    60%{ transform:rotateY(180deg) translateX(7px) rotate(2deg); }
  }

  /* --- Controls --- */
  .controls{ display:flex; gap:10px; align-items:center; justify-content:center; flex-wrap:wrap; width:100%; }
  .seg{ display:flex; gap:4px; padding:5px; border-radius:16px; background:var(--panel); border:1px solid var(--stroke); backdrop-filter:blur(10px); }
  .seg button{
    border:0; background:transparent; color:#cfc6f5; font-family:inherit; font-weight:700;
    font-size:.9rem; padding:8px 18px; border-radius:12px; cursor:pointer; transition:all .2s;
  }
  .seg button:not(.active):hover{ color:#fff; background:rgba(255,255,255,.08); }
  .seg button.active{ background:linear-gradient(135deg,#7b5cff,#c86dd7); color:#fff; box-shadow:0 6px 16px rgba(123,92,255,.45); }
  .btn{
    font-family:inherit; font-weight:800; font-size:.95rem; padding:11px 22px; border-radius:16px; cursor:pointer;
    border:1px solid var(--stroke); background:var(--panel); color:#fff; backdrop-filter:blur(10px);
    transition:transform .15s, background .2s, box-shadow .2s;
  }
  .btn:hover{ background:rgba(255,255,255,.16); }
  .btn:active{ transform:scale(.95); }
  .btn.primary{ background:linear-gradient(135deg,#7b5cff,#c86dd7); border-color:transparent; box-shadow:0 12px 28px rgba(123,92,255,.45); }

  /* --- Modal (win + lose) --- */
  .overlay{
    position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding:20px;
    background:rgba(10,6,24,.72); backdrop-filter:blur(8px);
    opacity:0; pointer-events:none; transition:opacity .3s ease;
  }
  .overlay.show{ opacity:1; pointer-events:auto; }
  .modal{
    width:min(92vw,380px); padding:26px 22px; text-align:center; border-radius:28px;
    background:linear-gradient(160deg,#241a4a,#180f33); border:1px solid rgba(255,255,255,.16);
    box-shadow:0 30px 70px rgba(0,0,0,.6);
    transform:scale(.86) translateY(16px); transition:transform .38s cubic-bezier(.2,.9,.3,1.35);
  }
  .overlay.show .modal{ transform:scale(1) translateY(0); }
  .modal-emoji{ font-size:3rem; animation:bounce 1.3s ease-in-out infinite; }
  @keyframes bounce{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
  .modal h2{ font-size:1.5rem; font-weight:800; margin:6px 0 10px; }
  .stars{ font-size:1.7rem; letter-spacing:5px; margin-bottom:14px; height:1.9rem; }
  .stars span{ display:inline-block; animation:starPop .45s backwards cubic-bezier(.2,.9,.3,1.6); }
  @keyframes starPop{ from{ transform:scale(0) rotate(-120deg); opacity:0; } }
  .result{ display:flex; gap:8px; margin:6px 0 12px; }
  .result > div{ flex:1; padding:10px 6px; border-radius:14px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); }
  .result b{ display:block; font-size:1.15rem; font-weight:800; font-variant-numeric:tabular-nums; }
  .result small{ font-size:.64rem; opacity:.6; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
  .record{ font-size:.88rem; font-weight:700; color:#ffd86b; min-height:1.35em; margin-bottom:14px; }
  .record.bad{ color:#ff5c7a; }
  .modal .btn{ width:100%; }

  .confetti{ position:fixed; top:-24px; z-index:60; pointer-events:none; border-radius:2px; }
  @keyframes fall{ to{ transform:translateY(112vh) rotate(760deg); opacity:.15; } }
  @media (max-width:380px){
    .stat small{ font-size:.56rem; }
    .seg button{ padding:8px 13px; font-size:.85rem; }
  }
  `;

  const styleTag = document.createElement('style');
  styleTag.textContent = CSS;
  document.head.appendChild(styleTag);

  /* ---------- 3) BUILD DOM ---------- */
  const markup = `
    <div class="app">
      <header>
        <div>
          <h1>Memory Card Game</h1>
          <p>Find matching pairs 🃏</p>
        </div>
        <button class="icon-btn" id="btnSound" aria-label="Toggle sound">🔊</button>
      </header>

      <div class="stats">
        <div class="stat">
          <span class="ico">⏱️</span>
          <div><b id="statTime">01:00</b><small>Time</small></div>
        </div>
        <div class="stat">
          <span class="ico">⭐</span>
          <div><b id="statScore">100</b><small>Score</small></div>
        </div>
        <div class="stat">
          <span class="ico">❌</span>
          <div><b id="statWrong">0/5</b><small>Mistakes</small></div>
        </div>
        <div class="stat">
          <span class="ico">✅</span>
          <div><b id="statPairs">0/8</b><small>Pairs</small></div>
        </div>
      </div>

      <div class="board" id="board"></div>

      <div class="controls">
        <div class="seg" id="levels">
          <button type="button" data-level="easy">Easy</button>
          <button type="button" data-level="normal" class="active">Normal</button>
          <button type="button" data-level="hard">Hard</button>
        </div>
        <button class="btn" id="btnRestart" type="button">🔄 Play Again</button>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-emoji" id="modalEmoji">🎉</div>
        <h2 id="modalTitle">You Win!</h2>
        <div class="stars" id="stars"></div>
        <div class="result">
          <div><b id="rTime">00:00</b><small>Time</small></div>
          <div><b id="rScore">100</b><small>Score</small></div>
          <div><b id="rPairs">0/0</b><small>Pairs</small></div>
        </div>
        <p class="record" id="record"></p>
        <button class="btn primary" id="btnAgain" type="button">Play Again</button>
      </div>
    </div>
  `;

  const stage = document.createElement('div');
  stage.innerHTML = markup.trim();
  while (stage.firstChild) document.body.appendChild(stage.firstChild);

  /* ---------- 4) DOM REFS ---------- */
  const board    = document.getElementById('board');
  const elTime   = document.getElementById('statTime');
  const elScore  = document.getElementById('statScore');
  const elWrong  = document.getElementById('statWrong');
  const elPairs  = document.getElementById('statPairs');
  const overlay  = document.getElementById('overlay');
  const elStars  = document.getElementById('stars');
  const elRecord = document.getElementById('record');
  const btnSound = document.getElementById('btnSound');

  /* ---------- 5) CONFIG ---------- */
  const ICONS = ['🐶','🐱','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵',
                 '🦄','🐷','🐔','🦉','🐙','🦋','🐢','🦖','🐝','🐬'];

  const LEVELS = {
    easy:   { cols: 4, rows: 3 },  // 12 cards – 6 pairs
    normal: { cols: 4, rows: 4 },  // 16 cards – 8 pairs
    hard:   { cols: 6, rows: 4 }   // 24 cards – 12 pairs
  };

  const MAX_WRONG = 5;
  const START_SCORE = 100;
  const GAME_SECONDS = 60;

  const state = {
    level: 'normal',
    cols: 4,
    totalPairs: 8,
    first: null,
    second: null,
    lock: false,
    gameOver: false,
    moves: 0,
    matched: 0,
    wrong: 0,
    score: START_SCORE,
    timeLeft: GAME_SECONDS,
    timerId: null,
    running: false
  };

  /* ---------- 6) HELPERS ---------- */
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const fmtTime = (s) => {
    s = Math.max(0, s | 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  };

  /* ---------- 7) AUDIO ---------- */
  let actx = null;
  let muted = false;

  function getCtx() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { try { actx = new AC(); } catch (e) { actx = null; } }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }

  function tone(freq, dur = 0.12, type = 'sine', vol = 0.06, delay = 0) {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch (e) { /* ignore */ }
  }

  const sfxFlip  = () => tone(520, 0.07, 'triangle', 0.04);
  const sfxMatch = () => { tone(760, 0.10, 'sine', 0.06); tone(1140, 0.15, 'sine', 0.05, 0.09); };
  const sfxWrong = () => { tone(250, 0.13, 'sawtooth', 0.032); tone(175, 0.17, 'sawtooth', 0.032, 0.10); };
  const sfxWin   = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, 'sine', 0.07, i * 0.13));
  const sfxLose  = () => [392, 330, 262].forEach((f, i) => tone(f, 0.28, 'sawtooth', 0.06, i * 0.16));

  /* ---------- 8) MEASURE CARD WIDTH ---------- */
  function measure() {
    const card = board.querySelector('.card');
    if (!card) return;
    const w = card.getBoundingClientRect().width;
    if (w > 0) board.style.setProperty('--card-w', w + 'px');
  }

  /* ---------- 9) BUILD BOARD ---------- */
  function buildBoard() {
    const cfg = LEVELS[state.level];
    state.cols = cfg.cols;
    state.totalPairs = (cfg.cols * cfg.rows) / 2;

    state.first = state.second = null;
    state.lock = false;
    state.gameOver = false;
    state.moves = 0;
    state.matched = 0;
    state.wrong = 0;
    state.score = START_SCORE;
    state.timeLeft = GAME_SECONDS;
    state.running = false;

    clearInterval(state.timerId);
    state.timerId = null;

    const picked = shuffle(ICONS.slice()).slice(0, state.totalPairs);
    const deck = shuffle(picked.concat(picked));

    board.style.setProperty('--cols', cfg.cols);
    board.innerHTML = '';

    const frag = document.createDocumentFragment();
    deck.forEach((icon, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.dataset.icon = icon;
      card.style.animationDelay = (i * 22) + 'ms';
      card.setAttribute('aria-label', 'Card ' + (i + 1));

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      const cover = document.createElement('div');
      cover.className = 'card-face face-cover';
      cover.innerHTML = '<span>?</span>';

      const front = document.createElement('div');
      front.className = 'card-face face-front';
      const span = document.createElement('span');
      span.textContent = icon;
      front.appendChild(span);

      inner.appendChild(cover);
      inner.appendChild(front);
      card.appendChild(inner);
      frag.appendChild(card);
    });
    board.appendChild(frag);

    elTime.textContent = fmtTime(GAME_SECONDS);
    elTime.classList.remove('urgent');
    elScore.textContent = START_SCORE;
    elWrong.textContent = '0/' + MAX_WRONG;
    elPairs.textContent = '0/' + state.totalPairs;

    overlay.classList.remove('show');
    elRecord.classList.remove('bad');

    requestAnimationFrame(measure);
  }

  /* ---------- 10) TIMER ---------- */
  function startTimer() {
    if (state.running) return;
    state.running = true;

    state.timerId = setInterval(() => {
      if (state.gameOver) return;

      state.timeLeft--;
      elTime.textContent = fmtTime(state.timeLeft);

      if (state.timeLeft <= 10) elTime.classList.add('urgent');
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        elTime.textContent = '00:00';
        endGame('lose', "Time's up!");
      }
    }, 1000);
  }

  function stopTimer() {
    state.running = false;
    clearInterval(state.timerId);
    state.timerId = null;
  }

  /* ---------- 11) FLIP LOGIC ---------- */
  function flipCard(card) {
    if (state.gameOver || state.lock) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    if (!state.running) startTimer();

    card.classList.add('flipped');
    sfxFlip();

    if (!state.first) {
      state.first = card;
      return;
    }

    state.second = card;
    state.lock = true;

    /* Each completed pair-flip costs 1 point */
    state.moves++;
    state.score = Math.max(0, state.score - 1);
    elScore.textContent = state.score;

    const a = state.first;
    const b = state.second;

    /* ----- MATCH ----- */
    if (a.dataset.icon === b.dataset.icon) {
      const willWin = (state.matched + 1 === state.totalPairs);

      if (willWin) {
        state.gameOver = true;
        stopTimer();
      }

      setTimeout(() => {
        a.classList.add('matched');
        b.classList.add('matched');
        sfxMatch();
        state.matched++;
        elPairs.textContent = state.matched + '/' + state.totalPairs;
        state.first = state.second = null;
        state.lock = false;

        if (willWin) endGame('win');
      }, 320);
      return;
    }

    /* ----- WRONG ----- */
    sfxWrong();
    a.classList.add('wrong');
    b.classList.add('wrong');

    state.wrong++;
    elWrong.textContent = state.wrong + '/' + MAX_WRONG;

    const maxReached = state.wrong >= MAX_WRONG;

    setTimeout(() => {
      a.classList.remove('flipped', 'wrong');
      b.classList.remove('flipped', 'wrong');
      state.first = state.second = null;
      state.lock = false;

      if (maxReached) endGame('lose', 'Too many mistakes!');
    }, 820);
  }

  board.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    flipCard(card);
  });

  /* ---------- 12) END GAME ---------- */
  function endGame(result, reason) {
    if (state.gameOver && result === 'lose') return;
    state.gameOver = true;
    state.lock = true;
    stopTimer();

    setTimeout(() => {
      if (result === 'win') showWin();
      else showLose(reason || 'Game Over');
    }, 250);
  }

  function showWin() {
    document.getElementById('modalEmoji').textContent = '🎉';
    document.getElementById('modalTitle').textContent = 'You Win!';
    elStars.style.display = '';
    elRecord.classList.remove('bad');

    const pairs = state.totalPairs;
    const ratio = state.moves / pairs;
    const stars = ratio <= 1.1 ? 3 : ratio <= 1.4 ? 2 : 1;

    elStars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('span');
      s.textContent = i < stars ? '⭐' : '☆';
      s.style.animationDelay = (i * 150) + 'ms';
      elStars.appendChild(s);
    }

    document.getElementById('rTime').textContent  = fmtTime(state.timeLeft);
    document.getElementById('rScore').textContent = state.score;
    document.getElementById('rPairs').textContent = state.totalPairs + '/' + state.totalPairs;

    const key = 'memory-best-' + state.level;
    let best = null;
    try { best = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { best = null; }

    let isNew = false;
    if (!best || state.score > best.score ||
        (state.score === best.score && state.timeLeft > best.timeLeft)) {
      best = { score: state.score, timeLeft: state.timeLeft, moves: state.moves };
      isNew = true;
      try { localStorage.setItem(key, JSON.stringify(best)); } catch (e) {}
    }

    elRecord.textContent = isNew
      ? '🏆 New Record!'
      : 'Best: ' + best.score + ' pts · ' + best.moves + ' moves';

    overlay.classList.add('show');
    sfxWin();
    confetti();
  }

  function showLose(reason) {
    document.getElementById('modalEmoji').textContent = '😢';
    document.getElementById('modalTitle').textContent = 'Game Over';
    elStars.style.display = 'none';
    elRecord.classList.add('bad');

    document.getElementById('rTime').textContent  = fmtTime(state.timeLeft);
    document.getElementById('rScore').textContent = state.score;
    document.getElementById('rPairs').textContent = state.matched + '/' + state.totalPairs;

    elRecord.textContent = reason;

    overlay.classList.add('show');
    sfxLose();
  }

  /* ---------- 13) CONFETTI ---------- */
  function confetti() {
    const colors = ['#7b5cff','#c86dd7','#ff8ac4','#ffd86b','#3ddc84','#5ad1ff'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colors[(Math.random() * colors.length) | 0];
      p.style.width  = (6 + Math.random() * 7) + 'px';
      p.style.height = (8 + Math.random() * 10) + 'px';
      p.style.animation =
        'fall ' + (1.6 + Math.random() * 1.6) + 's linear ' + (Math.random() * 0.5) + 's forwards';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4200);
    }
  }

  /* ---------- 14) UI EVENTS ---------- */
  document.getElementById('levels').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    [...e.currentTarget.children].forEach(x => x.classList.toggle('active', x === btn));
    state.level = btn.dataset.level;
    buildBoard();
  });

  document.getElementById('btnRestart').addEventListener('click', buildBoard);

  document.getElementById('btnAgain').addEventListener('click', () => {
    overlay.classList.remove('show');
    buildBoard();
  });

  btnSound.addEventListener('click', () => {
    muted = !muted;
    btnSound.textContent = muted ? '🔇' : '🔊';
    btnSound.setAttribute('aria-label', muted ? 'Enable sound' : 'Disable sound');
    if (!muted) { getCtx(); sfxFlip(); }
  });

  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', () => setTimeout(measure, 200));

  /* ---------- 15) START ---------- */
  buildBoard();
})();