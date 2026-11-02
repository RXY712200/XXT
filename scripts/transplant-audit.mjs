import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parse,tokenizer} from 'acorn';
import {verifyCanonical,policy,root} from './canonical-runtime.mjs';
export const sha256=text=>createHash('sha256').update(text).digest('hex');
export function members(source) {
  const result=new Map();
  function visit(node) {
    if(!node||typeof node!=='object') return;
    if(node.type==='FunctionDeclaration') result.set(node.id.name,node);
    if(node.type==='VariableDeclarator'&&node.id.name==='app'&&node.init?.type==='ObjectExpression')
      for(const property of node.init.properties) if(property.method||property.kind==='get') result.set('app.'+property.key.name,property);
    for(const value of Object.values(node)) if(Array.isArray(value)) value.forEach(visit);else if(value?.type) visit(value);
  }
  visit(parse(source,{ecmaVersion:'latest',locations:true}));return result;
}
export function verifyTransplant() {
  const reference=verifyCanonical(),source=reference.source.toString();
  const manifest=JSON.parse(readFileSync(resolve(root,'provenance/transplant.json'),'utf8'));
  const entry=readFileSync(resolve(root,'src/entry.js'),'utf8').replaceAll('\r\n','\n');
  const git=(...args)=>execFileSync('git',['-C',policy.localDirectory,...args],{encoding:'utf8',maxBuffer:16*1024*1024});
  const upstream=git('show',manifest.upstream.commit+':'+manifest.upstream.path);
  assert.equal(sha256(upstream),manifest.upstream.sha256);assert.equal(sha256(source),manifest.fork.sha256);
  assert.equal(sha256(entry),manifest.target.sha256);assert.ok(entry.startsWith(manifest.header));
  assert.notEqual(entry,source,'A complete unchanged fork copy is forbidden');
  let from=0,to=manifest.header.length;
  for(const segment of manifest.segments) {
    assert.equal(segment.sourceStart,from);assert.equal(segment.targetStart,to);
    const actual=entry.slice(segment.targetStart,segment.targetEnd);
    assert.equal(sha256(actual),segment.sha256);
    if(segment.kind==='direct') assert.equal(actual,source.slice(segment.sourceStart,segment.sourceEnd));
    else assert.ok(['foundation-adaptation','developed-maintenance'].includes(segment.kind));
    from=segment.sourceEnd;to=segment.targetEnd;
  }
  assert.equal(from,source.length);assert.equal(to,entry.length);
  const commits=git('rev-list','--reverse',manifest.upstream.commit+'..'+manifest.fork.commit).trim().split('\n');
  assert.deepEqual(commits,manifest.commits.map(c=>c.commit));assert.equal(commits.length,59);
  assert.equal(git('diff','--numstat',manifest.upstream.commit,manifest.fork.commit,'--',manifest.fork.path).trim(),'3087\t209\tv3_optimized.js');
  const before=members(source),after=members(entry);
  for(const item of manifest.functions) {
    const a=before.get(item.name),b=after.get(item.name);assert.ok(a&&b,item.name+' lost');
    assert.equal(sha256(entry.slice(b.start,b.end)),item.targetSha256,item.name);
    assert.equal(sha256(source.slice(a.start,a.end)),item.forkSha256,item.name);
    if(item.disposition==='byte-identical') assert.equal(entry.slice(b.start,b.end),source.slice(a.start,a.end),item.name);
    if(item.classification==='A-inherited') assert.notEqual(entry.slice(b.start,b.end),source.slice(a.start,a.end),item.name+' still inherited');
  }
  // Check relocated bodies too: Git-added text alone is not provenance proof.
  // The remaining long match is required public state/config API, not an algorithm.
  const tokens=text=>[...tokenizer(text,{ecmaVersion:'latest'})].filter(t=>t.type.label!=='eof').map(t=>({key:t.type.label+':'+t.value,pos:t.start}));
  const old=tokens(upstream),now=tokens(entry),index=new Set();
  for(let i=0;i<=old.length-40;i++)index.add(old.slice(i,i+40).map(t=>t.key).join('|'));
  const configStart=entry.indexOf('            configs: {'),configEnd=after.get('app.cellData').start;
  for(let i=0;i<=now.length-40;i++)if(index.has(now.slice(i,i+40).map(t=>t.key).join('|')))
    assert.ok(now[i].pos>=configStart&&now[i+39].pos<configEnd,'Unreviewed relocated upstream body near offset '+now[i].pos);
  const metadata=JSON.parse(readFileSync(resolve(root,'userscript/metadata.json'),'utf8'));
  assert.deepEqual(metadata.grant,policy.grants);assert.deepEqual(metadata.match,policy.matches);
  assert.equal(metadata.sandbox,policy.sandbox);assert.equal(metadata['run-at'],policy.runAt);
  assert.notEqual(metadata.namespace,'local.codex.xuexitong','Do not overwrite working fork installation');
  assert.ok(!metadata.require&&!metadata.connect&&!metadata.updateURL&&!metadata.downloadURL);
  assert.ok(!/^\s*(?:import|export)\b/m.test(entry),'Do not bundle retired module graph');
  assert.ok(!entry.includes('XXT.browser.runtime.v1')&&!entry.includes('__require('));
  return {manifest,source,entry,upstream,reference,summary:{commits:59,adaptations:manifest.summary.adaptations,
    directlyPreservedNonemptyLines:manifest.summary.exactNonemptyLinesOutsideAdaptations,
    directlyPreservedDiffAddedNonemptyLines:manifest.summary.addedExactNonemptyLinesOutsideAdaptations,
    byteIdenticalUserFunctions:manifest.functions.filter(f=>f.classification==='C-user-developed-candidate'&&f.disposition==='byte-identical').length}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) console.log('PASS transplant manifest / reference integrity / no retained foundation bodies\n'+JSON.stringify(verifyTransplant().summary));

