import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export const root=resolve(import.meta.dirname,'..');
export const artifactPath=resolve(root,'dist/XXT.user.js');
export function createArtifact() {
  const metadata=JSON.parse(readFileSync(resolve(root,'userscript/metadata.json'),'utf8'));
  const header=['// ==UserScript=='];
  for(const [key,value] of Object.entries(metadata)) for(const item of Array.isArray(value)?value:[value]) header.push(`// @${key} ${item}`);
  header.push('// ==/UserScript==','');
  const source=readFileSync(resolve(root,'src/entry.js'),'utf8').replaceAll('\r\n','\n');
  return header.join('\n')+'\n'+source;
}
export function verifyArtifact() {
  const bytes=readFileSync(artifactPath);
  if(!bytes.equals(Buffer.from(createArtifact()))) throw Error('XXT installable differs from canonical entry/metadata');
  return createHash('sha256').update(bytes).digest('hex');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  if(!process.argv.includes('--check')) { mkdirSync(resolve(root,'dist'),{recursive:true});writeFileSync(artifactPath,createArtifact()); }
  console.log(`${process.argv.includes('--check')?'VERIFIED':'BUILT'} ${artifactPath}\nSHA-256 ${verifyArtifact()}`);
}
