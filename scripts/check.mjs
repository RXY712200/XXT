import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(resolve(directory, item.name)) : /\.(js|mjs)$/.test(item.name) ? [resolve(directory, item.name)] : []);
}
const production = files(resolve(root, 'src'));
const checked = [...production, ...files(resolve(root, 'tests')), ...files(resolve(root, 'scripts'))];
for (const file of checked) execFileSync(process.execPath, ['--check', file]);
for (const file of production) {
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    assert.ok(specifier.startsWith('.'), `No runtime external dependency: ${relative(root, file)}`);
    assert.ok(!relative(resolve(root, 'src'), resolve(dirname(file), specifier)).startsWith('..'), 'No external reference-repository imports');
  }
  assert.ok(!/\.(?:play|pause|click|scrollTo|scrollBy)\s*\(|\bwindow\.open\s*\(|\bfetch\s*\(/.test(source), 'Phase II contains no real media/browser action implementation');
  await import(pathToFileURL(file));
}
console.log(`PASS syntax: ${checked.length} files; production imports: ${production.length}; no external runtime dependency or real browser actions`);
