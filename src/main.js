import { slides } from './slides.js';
import { Experience } from './experience.js';

const $ = (id) => document.getElementById(id);

const deck = $('deck');
const card = $('card');
const title = $('title');
const text = $('text');
const counterCurrent = $('counterCurrent');
const counterTotal = $('counterTotal');
const prevBtn = $('prev');
const nextBtn = $('next');
const hint = $('hint');
const hintText = $('hintText');
const veil = $('veil');
const loader = $('loader');

const pad = (n) => String(n).padStart(2, '0');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let experience = null;
let index = 0;
let busy = false;
let ready = false;
let down = null;
let wheelAcc = 0;
let wheelLock = 0;
let wheelLast = 0;
let pending = 0; // un solo comando in coda mentre la transizione è in corso

function applySlide(i, animate = true) {
  const s = slides[i];

  deck.dataset.layout = s.layout || 'scene';
  title.textContent = s.title;
  text.textContent = s.text;
  counterCurrent.textContent = pad(i + 1);
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === slides.length - 1;
  hintText.textContent = i === 0 ? 'clicca per iniziare' : 'clicca ovunque per continuare';

  card.classList.remove('is-in');
  if (animate) {
    void card.offsetWidth;
    card.classList.add('is-in');
  }
}

/** transizione unica: velo → cambio quadro → velo via. Non resta mai bloccata. */
async function transition(targetIndex, sceneName) {
  busy = true;
  try {
    veil.classList.add('is-on');
    await sleep(260);

    index = targetIndex;
    applySlide(index);
    if (experience) experience.show(sceneName);
    hint.classList.add('is-quiet');

    await sleep(90);
    veil.classList.remove('is-on');
    await sleep(520);
  } catch (err) {
    console.error(err);
    veil.classList.remove('is-on');
  } finally {
    busy = false;
  }

  // se nel frattempo è arrivato un altro comando, lo eseguiamo ora
  if (pending !== 0) {
    const next = pending;
    pending = 0;
    go(next);
  }
}

function go(delta) {
  if (!ready) return;
  if (busy) {
    // memorizza l'ultima direzione richiesta invece di perdere il click
    pending = Math.sign(delta);
    return;
  }
  const target = index + delta;
  if (target < 0 || target >= slides.length) return;
  transition(target, slides[target].scene);
}

function restart() {
  if (!ready || busy || index === 0) return;
  transition(0, 'cover');
}

/* ------------------------------------------------------------------ */
/* eventi                                                              */
/* ------------------------------------------------------------------ */

window.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
});

window.addEventListener('pointercancel', () => {
  down = null;
});

window.addEventListener('pointerup', (e) => {
  if (e.button !== 0) return;
  const start = down;
  down = null;
  if (!start) return;

  const el = e.target.closest('button, a, input, textarea, [data-no-advance]');
  if (el) return;
  if (window.getSelection && window.getSelection().toString().length > 2) return;

  const dx = e.clientX - start.x;
  const dy = e.clientY - start.y;
  const dist = Math.hypot(dx, dy);
  if (performance.now() - start.t > 900) return;

  if (dist > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    go(dx < 0 ? 1 : -1);
    return;
  }
  if (dist > 16) return;
  go(1);
});

window.addEventListener('pointermove', (e) => {
  if (!experience) return;
  experience.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    go(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    go(-1);
  } else if (e.key === 'Home') {
    e.preventDefault();
    restart();
  } else if (e.key === 'End') {
    e.preventDefault();
    if (!busy && ready) {
      const jump = slides.length - 1 - index;
      if (jump > 0) go(jump);
    }
  }
});

window.addEventListener(
  'wheel',
  (e) => {
    if (!ready || busy) return;
    const now = performance.now();
    if (now < wheelLock) return;
    // l'accumulo si azzera se la rotella si ferma: niente cambi di quadro a sorpresa
    if (now - wheelLast > 220) wheelAcc = 0;
    wheelLast = now;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 110) {
      go(wheelAcc > 0 ? 1 : -1);
      wheelAcc = 0;
      wheelLock = now + 900;
    }
  },
  { passive: true }
);

prevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  go(-1);
});
nextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  go(1);
});

/* ------------------------------------------------------------------ */
/* avvio                                                               */
/* ------------------------------------------------------------------ */

function boot() {
  counterTotal.textContent = pad(slides.length);
  applySlide(0, false);
  card.classList.add('is-in');
  ready = true;

  try {
    experience = new Experience($('scene'));
    if (!experience.show(slides[0].scene)) throw new Error('Scena iniziale non disponibile');
    experience.start();
  } catch (err) {
    console.error('WebGL non disponibile o errore scena:', err);
  }

  const loaderEl = $('loader');
  if (loaderEl && loaderEl.parentNode) loaderEl.remove();
}

boot();
