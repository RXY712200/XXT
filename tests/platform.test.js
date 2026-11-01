import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryReader, inspectInventory } from '../src/platform/inventory.js';
import { page } from './support.js';

test('ordinary course hierarchy and stable owned task identity; recognition has no effects', () => {
  const f = page(), before = f.document.documentElement.outerHTML + f.root.documentElement.outerHTML;
  const reader = createInventoryReader(), a = reader.scan(f.document), b = reader.scan(f.document);
  assert.equal(a.status, 'verified'); assert.equal(a.catalog.length, 4); assert.equal(a.chapters.length, 2);
  assert.deepEqual(a.catalog.map(l => l.chapterKey), ['group-0','group-0','group-1','group-1']);
  assert.equal(a.tasks[0].key, b.tasks[0].key); assert.notEqual(a.revision, b.revision);
  assert.equal(a.tasks[0].owner, f.owners[0]); assert.equal(a.tasks[0].executable, false);
  assert.equal(a.tasks[0].capability, 'adapter-required');
  assert.equal(f.document.documentElement.outerHTML + f.root.documentElement.outerHTML, before);
  assert.equal(inspectInventory(a).valid, true);
});

test('nested groups are hierarchy, not extra lessons', () => {
  const f = page(); const lesson = f.document.querySelector('#unit-0-0').closest('li');
  const group = f.document.createElement('li'); group.innerHTML = '<div id="subgroup" class="posCatalog_select firstLayer"><span class="posCatalog_name">Subdivision</span></div><ul></ul>';
  lesson.before(group); group.querySelector('ul').append(lesson);
  const a = createInventoryReader().scan(f.document);
  assert.equal(a.status, 'verified'); assert.equal(a.catalog.length, 4);
  assert.deepEqual(a.lesson.ancestry, ['group-0','subgroup']);
});

test('missing and delayed course frame remain loading, then rescan becomes verified', () => {
  const f = page(), frame = f.document.querySelector('iframe'); frame.remove();
  const reader = createInventoryReader(), old = reader.scan(f.document);
  assert.equal(old.status, 'loading'); assert.ok(old.hazards.includes('loading-content-frame'));
  f.document.body.append(frame); const root = frame.contentDocument;
  root.body.innerHTML = '<iframe id="late" class="ans-attach-online ans-insertvideo-online"></iframe>';
  root.querySelector('iframe').contentDocument.body.innerHTML = '<video id="video_html5_api"></video>';
  assert.equal(reader.scan(f.document).status, 'verified'); assert.equal(inspectInventory(old).valid, false);
});

test('mixed ordered inventory retains completed video A and unfinished video B/audio/PDF', () => {
  const f = page(['video','video','audio','document'], { completed: [0] });
  const a = createInventoryReader().scan(f.document);
  assert.equal(a.status, 'verified');
  assert.deepEqual(a.tasks.map(t => t.kind), ['video','video','audio','document']);
  assert.deepEqual(a.tasks.map(t => t.ordinal), [0,1,2,3]);
  assert.deepEqual(a.tasks.map(t => t.credit.status), ['confirmed','unknown','unknown','unknown']);
  assert.equal(a.lesson.credit.status, 'incomplete'); assert.equal(a.tasks[0].credit.subject, a.tasks[0].key);
});

test('duplicate ownership and missing semantic identity remain ambiguous', () => {
  const f = page(['video','audio']); f.owners[1].id = f.owners[0].id;
  f.owners[1].className = f.owners[0].className; f.owners[1].setAttribute('data', f.owners[0].getAttribute('data'));
  const a = createInventoryReader().scan(f.document); assert.equal(a.status, 'unsafe'); assert.ok(a.hazards.includes('ambiguous-task-identity'));
  f.owners[0].removeAttribute('data'); f.owners[0].removeAttribute('id');
  assert.equal(createInventoryReader().scan(f.document).tasks[0].identity, 'ambiguous');
  const g = page(), reader = createInventoryReader(), before = reader.scan(g.document);
  const group = g.document.querySelector('#group-0'); group.replaceWith(group.cloneNode(true));
  assert.equal(inspectInventory(before).valid, false);
  g.document.querySelector('#group-1').id = 'group-0';
  assert.ok(reader.scan(g.document).hazards.includes('ambiguous-chapter-identity'));
});

test('unknown independent attachment survives while ordinary forms are not extra tasks', () => {
  const f = page(['video','unknown']); f.root.body.insertAdjacentHTML('beforeend', '<form><input placeholder="Search"><button>Find</button></form>');
  const a = createInventoryReader().scan(f.document);
  assert.equal(a.status, 'verified'); assert.deepEqual(a.tasks.map(t => t.kind), ['video','unknown']);
  assert.equal(a.tasks[1].capability, 'unsupported'); assert.equal(a.tasks[1].credit.status, 'unknown');
});

test('inactive preview is auxiliary; active preview or competing primaries are unsafe', () => {
  const f = page(['video','audio']); const aux = f.root.createElement('audio'); aux.id = 'auditionAudio'; aux.controls = true; aux.style.display = 'none'; f.root.body.append(aux);
  const reader = createInventoryReader(), a = reader.scan(f.document); assert.equal(a.status, 'verified'); assert.equal(a.tasks.length, 2);
  Object.defineProperty(aux, 'paused', { configurable: true, value: false }); assert.equal(inspectInventory(a).valid, false);
  assert.ok(reader.scan(f.document).hazards.includes('competing-media'));
  aux.remove(); for (const p of f.players) Object.defineProperty(p, 'paused', { value: false });
  assert.ok(reader.scan(f.document).hazards.includes('competing-media'));
});

test('unrelated outer iframe is ignored; inaccessible required nested content blocks', () => {
  const f = page(); const aux = f.document.createElement('iframe'); f.document.body.append(aux);
  Object.defineProperty(aux, 'contentDocument', { value: null });
  const reader = createInventoryReader(), a = reader.scan(f.document); assert.equal(a.status, 'verified');
  const inner = f.owners[0].contentDocument.createElement('iframe'); f.owners[0].contentDocument.body.append(inner);
  Object.defineProperty(inner, 'contentDocument', { value: null });
  assert.ok(reader.scan(f.document).hazards.includes('inaccessible-content')); assert.equal(inspectInventory(a).valid, false);
});

test('source replacement, owner replacement and reorder invalidate the inventory', () => {
  const f = page(['video','audio']), reader = createInventoryReader(), a = reader.scan(f.document);
  f.players[0].setAttribute('src', 'changed'); assert.equal(inspectInventory(a).valid, false);
  const b = reader.scan(f.document); f.owners[1].parentElement.before(f.owners[0].parentElement); assert.equal(inspectInventory(b).valid, false);
  const c = reader.scan(f.document); f.owners[0].replaceWith(f.owners[0].cloneNode()); assert.equal(inspectInventory(c).valid, false);
});

test('credit is fresh, scoped and contradictory counters cannot become positive', () => {
  const f = page(), a = createInventoryReader().scan(f.document);
  f.document.querySelector('#unit-0-1').insertAdjacentHTML('beforeend', '<span class="icon_Completed"></span>');
  assert.equal(inspectInventory(a).lesson.credit.status, 'incomplete');
  f.document.querySelector('.posCatalog_active').insertAdjacentHTML('beforeend', '<span class="icon_Completed"></span>');
  assert.equal(inspectInventory(a).lesson.credit.status, 'contradictory');
  f.document.querySelector('.posCatalog_active input').value = '0'; assert.equal(inspectInventory(a).lesson.credit.status, 'confirmed');
  assert.equal(a.lesson.credit.status, 'incomplete'); assert.throws(() => inspectInventory({ ...a }), /platform reader/);
});

test('paired optional assessment labels differ from mandatory verification', () => {
  const f = page([]); const label = f.document.querySelector('.posCatalog_active .posCatalog_name');
  label.title = label.textContent = '章节测验'; f.document.querySelector('.prev_title').title = '章节测验';
  const reader = createInventoryReader(), a = reader.scan(f.document);
  assert.equal(a.status, 'verified'); assert.equal(a.assessment, 'optional'); assert.equal(a.tasks[0].kind, 'assessment');
  f.root.body.innerHTML = '<form>验证码<input name="captcha"></form>';
  assert.ok(reader.scan(f.document).hazards.includes('verification-required'));
  f.root.body.innerHTML = ''; f.document.querySelector('.prev_title').title = '期末考试';
  assert.ok(reader.scan(f.document).hazards.includes('mandatory-assessment'));
});

test('live recognition does not open a window and rejects unsupported page identity', () => {
  const f = page([]); f.root.body.innerHTML = '<a id="session-card" class="liveHref"><div class="liveCard"><div class="live-ct">Replay</div></div></a>';
  assert.equal(createInventoryReader().scan(f.document).tasks[0].kind, 'live');
  f.dom.reconfigure({ url: 'https://example.org/mycourse/studentstudy?courseid=example-course' });
  assert.ok(createInventoryReader().scan(f.document).hazards.includes('unsupported-page'));
});

test('task UI cannot supply lesson credit; malformed metadata is explicit uncertainty', () => {
  const f = page(); const node = f.document.querySelector('.posCatalog_active');
  node.querySelector('input').value = '0';
  node.insertAdjacentHTML('beforeend', '<div class="ans-attach-ct"><span class="icon_Completed"></span><span class="ans-job-icon ans-job-finished"></span></div>');
  assert.equal(createInventoryReader().scan(f.document).lesson.credit.status, 'unknown');
  f.owners[0].setAttribute('data', 'null');
  assert.ok(createInventoryReader().scan(f.document).hazards.includes('invalid-task-metadata'));
});
