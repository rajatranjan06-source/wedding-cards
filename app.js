(() => {
  const WEDDING = new Date('2027-01-24T14:00:00+05:30');
  const RSVP_EMAIL = 'rajatranjan0627@gmail.com';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Music toggle */
  const musicBtn = document.getElementById('musicBtn');
  const setMusicUI = on => musicBtn.setAttribute('aria-pressed', String(on));
  musicBtn.addEventListener('click', () => setMusicUI(WeddingMusic.toggle()));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && WeddingMusic.playing) { WeddingMusic.pause(); musicBtn.dataset.resume = '1'; }
    else if (!document.hidden && musicBtn.dataset.resume) { delete musicBtn.dataset.resume; WeddingMusic.play(); }
  });

  /* Envelope */
  const env = document.getElementById('envelope');
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');
  env.addEventListener('click', () => {
    if (env.classList.contains('open')) return;
    env.classList.add('open');
    try { WeddingMusic.play(); setMusicUI(true); } catch (e) {}
    musicBtn.hidden = false;
    intro.classList.add('gone');
    setTimeout(() => {
      document.body.classList.remove('locked');
      main.removeAttribute('aria-hidden');
      burst();
    }, 1500);
  });

  /* Tilt card (mouse + gyroscope) */
  const card = document.getElementById('card3d');
  let lastInput = 0;
  const setTilt = (x, y, user = true) => { if (user) lastInput = Date.now(); card.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`; };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    setTilt(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    setTilt(Math.max(-1, Math.min(1, e.gamma / 45)) / 2, Math.max(-1, Math.min(1, (e.beta - 45) / 45)) / 2);
  });
  let t = 0;
  (function idle() {
    if (!reduce && Date.now() - lastInput > 2500) {
      t += .012; setTilt(Math.sin(t) * .35, Math.cos(t * .8) * .2, false);
    }
    requestAnimationFrame(idle);
  })();

  /* Reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* Countdown cubes */
  const pad = n => String(n).padStart(2, '0');
  const last = {};
  function tick() {
    let d = Math.max(0, WEDDING - Date.now()) / 1000;
    const v = { days: Math.floor(d / 86400), hours: Math.floor(d % 86400 / 3600), minutes: Math.floor(d % 3600 / 60), seconds: Math.floor(d % 60) };
    document.querySelectorAll('.cube').forEach(c => {
      const u = c.dataset.unit, val = pad(v[u]);
      if (last[u] === val) return;
      const front = c.querySelector('.front'), top = c.querySelector('.top');
      if (last[u] === undefined || reduce) { front.textContent = top.textContent = val; last[u] = val; return; }
      last[u] = val;
      top.textContent = val;
      c.classList.add('roll');
      setTimeout(() => { front.textContent = val; c.classList.remove('roll'); }, 620);
    });
  }
  tick(); setInterval(tick, 1000);

  /* Flip cards */
  document.querySelectorAll('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));

  /* 3D carousel */
  const car = document.getElementById('carousel');
  let idx = 0, auto;
  const spin = dir => { idx += dir; car.style.transform = `rotateY(${idx * -60}deg)`; };
  document.getElementById('next').onclick = () => { spin(1); restart(); };
  document.getElementById('prev').onclick = () => { spin(-1); restart(); };
  const restart = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => spin(1), 3500); };
  restart();
  let sx = null;
  car.parentElement.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  car.parentElement.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { spin(dx < 0 ? 1 : -1); restart(); }
    sx = null;
  });

  /* RSVP via email */
  document.getElementById('rsvpForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `Name: ${f.get('name')}\nGuests: ${f.get('guests')}\nReply: ${f.get('attending')}\n\n${f.get('note') || ''}`;
    location.href = `mailto:${RSVP_EMAIL}?subject=${encodeURIComponent('RSVP: ' + f.get('name'))}&body=${encodeURIComponent(body)}`;
    document.getElementById('rsvpDone').hidden = false;
  });

  /* Falling petals */
  const cv = document.getElementById('petals'), ctx = cv.getContext('2d');
  let W, H, petals = [];
  const resize = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; };
  resize(); addEventListener('resize', resize);
  const colors = ['#f4c2c2', '#f7d6d0', '#e8a9a3', '#f3e0c0'];
  const make = (y) => ({
    x: Math.random() * W, y: y ?? -20, s: (6 + Math.random() * 8) * devicePixelRatio,
    vy: (.4 + Math.random() * .8) * devicePixelRatio, vx: (Math.random() - .5) * .6 * devicePixelRatio,
    r: Math.random() * 6.28, vr: (Math.random() - .5) * .04, flip: Math.random() * 6.28, c: colors[Math.random() * 4 | 0]
  });
  const count = reduce ? 0 : (innerWidth < 600 ? 18 : 32);
  for (let i = 0; i < count; i++) petals.push(make(Math.random() * H));
  function burst() { if (reduce) return; for (let i = 0; i < 40; i++) petals.push(make(Math.random() * H * .3)); }
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach((p, i) => {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y / 60) * .5; p.r += p.vr; p.flip += .03;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.flip)) * .8 + .2);
      ctx.fillStyle = p.c; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s, -p.s, p.s, p.s * .6, 0, p.s);
      ctx.bezierCurveTo(-p.s, p.s * .6, -p.s, -p.s, 0, -p.s); ctx.fill();
      ctx.restore();
      if (p.y > H + 20) petals[i] = i < count ? make() : null;
    });
    petals = petals.filter(Boolean);
    requestAnimationFrame(draw);
  })();
})();
