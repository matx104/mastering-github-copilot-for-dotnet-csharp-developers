/* ============================================================
   THE PETAL TEMPLATE — one course, digested, tracked, free.
   Fill content/course.json · enable Pages · ship.

   Vanilla ES modules. Zero dependencies. Content-as-data:
   nothing about the course is hardcoded here — the JSON is
   the course, this file is the printing press.
   ============================================================ */

const dom = {
  eyebrow:   document.getElementById('hero-eyebrow'),
  title:     document.getElementById('hero-title'),
  sub:       document.getElementById('hero-sub'),
  metaSource:document.getElementById('meta-source'),
  metaFork:  document.getElementById('meta-fork'),
  credit:    document.getElementById('credit-line'),
  afterBox:  document.getElementById('after'),
  modules:   document.getElementById('modules'),
  notice:    document.getElementById('notice'),
  pct:       document.getElementById('progress-pct'),
  count:     document.getElementById('progress-count'),
  bar:       document.getElementById('progress-bar'),
  fill:      document.getElementById('progress-fill'),
  reset:     document.getElementById('reset')
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function safeUrl(value) {
  if (typeof value !== 'string' || value === '') return null;
  try {
    const url = new URL(value, window.location.href);
    return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
  } catch {
    return null;
  }
}

/* ---------- mastery, kept by the learner ---------------------------------- */

let STORE_KEY = 'qalam-petal';

function loadProgress() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');
    return (raw && typeof raw === 'object') ? raw : {};
  } catch {
    return {};
  }
}

function saveProgress(done) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(done));
  } catch {
    /* private mode — progress lives for this visit only */
  }
}

let done = {};
let APP = null;

/* ---------- rendering ------------------------------------------------------- */

let openModule = null;
let openLesson = null;

function allLessons() {
  return APP.modules.flatMap((m) => m.lessons);
}

function renderProgress() {
  const lessons = allLessons();
  const complete = lessons.filter((l) => done[l.id]).length;
  const pct = lessons.length ? Math.round((complete / lessons.length) * 100) : 0;
  dom.pct.textContent = `${pct}%`;
  dom.count.textContent = `${complete} of ${lessons.length} lessons`;
  dom.fill.style.width = `${pct}%`;
  dom.bar.setAttribute('aria-valuenow', String(pct));
}

function toggleLesson(id) {
  openLesson = openLesson === id ? null : id;
  for (const lesson of dom.modules.querySelectorAll('.lesson')) {
    lesson.classList.toggle('lesson--open', lesson.dataset.lesson === openLesson);
  }
}

function toggleModule(id) {
  openModule = openModule === id ? null : id;
  for (const mod of dom.modules.querySelectorAll('.mod')) {
    mod.classList.toggle('mod--open', mod.dataset.module === openModule);
  }
}

function buildLesson(lesson) {
  const isDone = Boolean(done[lesson.id]);
  const node = el('article', 'lesson' +
    (isDone ? ' lesson--done' : '') +
    (lesson.quiz ? ' lesson--quiz' : ''));
  node.dataset.lesson = lesson.id;

  const row = el('button', 'lesson__row');
  row.type = 'button';
  row.setAttribute('aria-expanded', 'false');
  row.style.position = 'relative';

  const check = el('span', 'lesson__check', '✓');
  check.setAttribute('aria-hidden', 'true');

  row.append(
    check,
    el('span', 'lesson__id', lesson.id),
    el('span', 'lesson__name', lesson.title),
    el('span', 'lesson__mins', lesson.quiz ? 'quiz' : `~${lesson.minutes || 30} min`),
    el('span', 'lesson__chev', '▸')
  );
  row.addEventListener('click', () => toggleLesson(lesson.id));

  /* the invisible check overlay: mark done without opening */
  const checkButton = el('button');
  checkButton.type = 'button';
  checkButton.setAttribute('aria-pressed', String(isDone));
  checkButton.setAttribute('aria-label',
    `Mark “${lesson.title}” as ${isDone ? 'not done' : 'done'}`);
  checkButton.style.cssText =
    'position:absolute;left:1rem;margin-top:0.55rem;width:1.5rem;height:1.5rem;' +
    'opacity:0;cursor:pointer;';
  checkButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (done[lesson.id]) delete done[lesson.id];
    else done[lesson.id] = true;
    saveProgress(done);
    node.classList.toggle('lesson--done', Boolean(done[lesson.id]));
    checkButton.setAttribute('aria-pressed', String(Boolean(done[lesson.id])));
    refresh();
  });
  row.append(checkButton);

  const detail = el('div', 'lesson__detail');
  const inner = el('div', 'lesson__inner');
  const pad = el('div', 'lesson__pad');

  if (lesson.objective) pad.append(el('p', 'lesson__objective', lesson.objective));

  if (Array.isArray(lesson.keys) && lesson.keys.length) {
    const keys = el('ul', 'keys');
    for (const key of lesson.keys) keys.append(el('li', null, key));
    pad.append(keys);
  }

  const href = safeUrl(lesson.href);
  if (href) {
    const read = el('a', 'lesson__read');
    read.href = href;
    read.target = '_blank';
    read.rel = 'noopener noreferrer';
    read.append(el('span', null, lesson.quiz ? 'Take the quiz' : 'Read the full lesson'),
                el('span', null, ' ↗'));
    pad.append(read);
  }

  inner.append(pad);
  detail.append(inner);
  node.append(row, detail);
  return node;
}

function renderModules() {
  dom.modules.textContent = '';

  for (const mod of APP.modules) {
    const section = el('section', 'mod');
    section.dataset.module = mod.id;

    const heading = el('h2', 'mod__h');
    const head = el('button', 'mod__head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.setAttribute('aria-controls', `mod-${mod.id}`);
    head.append(
      el('span', 'mod__num', `Module ${mod.num}`),
      el('span', 'mod__title', mod.title),
      el('span', 'mod__done'),
      el('span', 'mod__chev', '▾')
    );
    head.addEventListener('click', () => toggleModule(mod.id));

    const body = el('div', 'mod__body');
    body.id = `mod-${mod.id}`;
    body.setAttribute('role', 'region');

    const scroller = el('div', 'mod__scroller');
    if (mod.blurb) scroller.append(el('p', 'mod__blurb', mod.blurb));
    for (const lesson of mod.lessons) scroller.append(buildLesson(lesson));

    body.append(scroller);
    heading.append(head);
    section.append(heading, body);
    dom.modules.append(section);
  }
}

function refresh() {
  if (!APP) return;
  renderProgress();
  for (const mod of dom.modules.querySelectorAll('.mod')) {
    const meta = APP.modules.find((m) => m.id === mod.dataset.module);
    const complete = meta.lessons.filter((l) => done[l.id]).length;
    const label = mod.querySelector('.mod__done');
    label.textContent = '';
    label.append(el('b', null, complete), document.createTextNode(`/${meta.lessons.length}`));
  }
}

/* ---------- identity, straight from the JSON -------------------------------- */

function renderIdentity(course) {
  if (course.title) {
    document.title = `${course.title} · Study Edition · QALAM`;
    if (dom.title) dom.title.textContent = course.title;
  }
  if (dom.eyebrow && course.eyebrow) dom.eyebrow.textContent = course.eyebrow;
  if (dom.sub && course.subtitle) dom.sub.textContent = course.subtitle;
  if (dom.metaSource && course.source_name) {
    dom.metaSource.textContent = `🏛️ original: ${course.source_name}`;
    dom.metaSource.href = safeUrl(course.source_url) || '#';
  }
  if (dom.metaFork && course.fork_url) {
    dom.metaFork.href = safeUrl(course.fork_url) || '#';
  }
  if (dom.credit && course.credit_line) dom.credit.textContent = course.credit_line;

  if (dom.afterBox && (course.after_note || course.after_links)) {
    dom.afterBox.hidden = false;
    const h2 = dom.afterBox.querySelector('h2');
    if (h2 && course.after_title) h2.textContent = course.after_title;
    const p = dom.afterBox.querySelector('p');
    if (p) p.textContent = course.after_note || '';
    if (Array.isArray(course.after_links) && course.after_links.length) {
      const row = el('p'); row.style.marginTop = '0.8rem';
      for (const link of course.after_links) {
        const href = safeUrl(link.url);
        if (!href) continue;
        const a = el('a', null, link.label || link.url);
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        row.append(a, document.createTextNode('  '));
      }
      dom.afterBox.append(row);
    }
  } else if (dom.afterBox) {
    dom.afterBox.hidden = true;
  }
}

/* ---------- boot ---------------------------------------------------------------- */

async function boot() {
  if (dom.reset) {
    dom.reset.addEventListener('click', () => {
      done = {};
      saveProgress(done);
      renderModules();
      refresh();
    });
  }

  try {
    const data = (window.__COURSE__ && typeof window.__COURSE__ === 'object')
      ? window.__COURSE__
      : await (async () => {
          const res = await fetch('content/course.json', { cache: 'no-cache' });
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json();
        })();
    APP = data;

    STORE_KEY = `qalam-petal-${(data.course && data.course.title || 'petal')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
    done = loadProgress();

    renderIdentity(data.course || {});
    renderModules();
    refresh();
  } catch (error) {
    console.error('Petal: could not load the course —', error);
    dom.notice.textContent =
      `The course could not be loaded from content/course.json: ${error.message}. ` +
      'Fill the JSON per the README, and the page grows from it.';
    dom.notice.hidden = false;
  }
}

boot();
