import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
export const artifactPath = resolve(root, 'dist/XXT.user.js');
export function createArtifact() {
  const metadata = JSON.parse(readFileSync(resolve(root,'userscript/metadata.json'),'utf8'));
  const lines = ['// ==UserScript=='];
  for (const [key,value] of Object.entries(metadata)) for (const item of Array.isArray(value) ? value : [value]) lines.push(`// @${key}${item === true ? '' : ' ' + item}`);
  lines.push('// ==/UserScript==');
  const modules = new Map();
  function visit(file) {
    const id = relative(root,file).replaceAll('\\','/');
    if (modules.has(id)) return id;
    if (!id.startsWith('src/') || !id.endsWith('.js')) throw Error('Build imports must stay in canonical src');
    modules.set(id,'');
    let source = readFileSync(file,'utf8').replaceAll('\r\n','\n');
    source = source.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm, (_,names,specifier) => {
      if (!specifier.startsWith('.')) throw Error('External production dependency');
      const dependency = visit(resolve(dirname(file),specifier));
      return `const {${names.replace(/\bas\b/g, ':')}} = __require(${JSON.stringify(dependency)});`;
    });
    const exported = [];
    source = source.replace(/^export\s+(function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_,kind,name) => { exported.push(name); return `${kind} ${name}`; });
    if (/^\s*(?:import|export)\s/m.test(source)) throw Error(`Unsupported module syntax: ${id}`);
    modules.set(id, `${source}\nObject.assign(__exports, {${exported.join(',')}});`);
    return id;
  }
  const entry = visit(resolve(root,'src/entry.js'));
  const registry = [...modules].map(([id,source]) => `${JSON.stringify(id)}: function(__exports, __require) {\n${source}\n}`).join(',\n');
  return `${lines.join('\n')}\n(function(){\n'use strict';\nconst __modules={\n${registry}\n};\nconst __cache=Object.create(null);\nfunction __require(id){if(__cache[id])return __cache[id];const out=Object.create(null);__cache[id]=out;__modules[id](out,__require);return out;}\n__require(${JSON.stringify(entry)});\n})();\n`;
}
export function verifyArtifact(text = readFileSync(artifactPath,'utf8')) {
  if (text !== createArtifact()) throw Error('Generated userscript does not match canonical modules/metadata');
  return createHash('sha256').update(text).digest('hex');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv.includes('--check')) { mkdirSync(dirname(artifactPath),{recursive:true}); writeFileSync(artifactPath,createArtifact(),'utf8'); }
  console.log(`${process.argv.includes('--check') ? 'VERIFIED' : 'BUILT'} ${artifactPath}\nSHA-256 ${verifyArtifact()}`);
}
