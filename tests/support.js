import { JSDOM } from 'jsdom';

/** Independently constructed, inert structural data; never authenticated captures. */
export function page(kinds = ['video'], { chapters = 2, completed = [] } = {}) {
  const dom = new JSDOM('<!doctype html><title>Synthetic XXT case</title><div class="prev_title" title="课程内容"></div><div id="coursetree"></div><iframe info="card"></iframe>',
    { url: 'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=example-course' });
  const document = dom.window.document, tree = document.querySelector('#coursetree');
  tree.innerHTML = '<ul>' + Array.from({ length: chapters }, (_, c) => `<li><div class="posCatalog_select firstLayer" id="group-${c}"><span class="posCatalog_name">Group ${c}</span></div><ul>` +
    Array.from({ length: 2 }, (_, l) => `<li><div class="posCatalog_select ${c === 0 && l === 0 ? 'posCatalog_active' : ''}" id="unit-${c}-${l}"><span class="posCatalog_name" title="Unit ${c}.${l}">Unit ${c}.${l}</span><input class="jobUnfinishCount" value="1"></div></li>`).join('') + '</ul></li>').join('') + '</ul>';
  const root = document.querySelector('iframe').contentDocument;
  const owners = [], players = [];
  for (const [i, kind] of kinds.entries()) {
    const wrapper = root.createElement('section'); wrapper.className = 'ans-attach-ct';
    wrapper.innerHTML = `<span class="ans-job-icon ${completed.includes(i) ? 'ans-job-finished' : ''}"></span>`;
    const owner = root.createElement('iframe'); owner.id = `asset-${i}`;
    owner.className = 'ans-attach-online ' + ({ video: 'ans-insertvideo-online', audio: 'ans-insertaudio', document: 'insertdoc-online-pdf' }[kind] || '');
    owner.setAttribute('data', JSON.stringify({ objectid: `content-${i}` }));
    wrapper.append(owner); root.body.append(wrapper); owners.push(owner);
    if (['audio','video'].includes(kind)) {
      const media = owner.contentDocument.createElement(kind); media.id = kind === 'video' ? 'video_html5_api' : 'audio_html5_api';
      media.setAttribute('src', `https://invalid.example/content-${i}`);
      media.play = () => { throw Error('Phase II must not play media'); };
      media.pause = () => { throw Error('Phase II must not pause media'); };
      owner.contentDocument.body.append(media); players.push(media);
    } else { owner.contentDocument.body.textContent = kind === 'document' ? 'Synthetic document viewer placeholder' : 'Unknown independent item'; players.push(null); }
  }
  function markLesson(node = document.querySelector('.posCatalog_active')) {
    node.querySelector('.jobUnfinishCount').value = '0';
    if (!node.querySelector('.icon_Completed')) node.insertAdjacentHTML('beforeend', '<span class="icon_Completed"></span>');
  }
  return { dom, document, root, owners, players, markLesson };
}

export function clock() {
  let now = 0, id = 0;
  const timers = new Map(), cancelled = [];
  return {
    now: () => now,
    setTimeout(run, delay) { timers.set(++id, { run, due: now + delay }); return id; },
    clearTimeout(key) { const timer = timers.get(key); if (timer) cancelled.push(timer.run); timers.delete(key); },
    advance(ms) {
      const until = now + ms;
      for (let n = 0; n < 1000; n++) {
        const next = [...timers].sort((a,b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > until) { now = until; return; }
        timers.delete(next[0]); now = next[1].due; next[1].run();
      }
      throw Error('Unexpected unbounded scheduling');
    },
    timers, cancelled
  };
}

export const microtasks = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
