import assert from 'node:assert/strict';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const root=resolve(import.meta.dirname,'..');
export const policy=Object.freeze(JSON.parse(readFileSync(resolve(root,'runtime/canonical.json'),'utf8')));
export const sourcePath=resolve(policy.localDirectory,policy.source);
export const artifactPath=resolve(policy.localDirectory,policy.artifact);
const retiredPath=resolve(root,'dist/XXT.user.js');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const lf=text=>text.replaceAll('\r\n','\n');

/** Read-only verification of the original coherent engine. Never downloads,
 * copies, patches, bundles or executes the source fork's build script. */
export function verifyCanonical() {
  assert.equal(policy.mode,'external-canonical-fork');
  const git=(...args)=>execFileSync('git',['-C',policy.localDirectory,...args]);
  assert.equal(git('remote','get-url','origin').toString().trim(),policy.repository+'.git','Canonical repository identity drift');
  assert.equal(git('rev-parse','HEAD').toString().trim(),policy.commit,'Canonical checkout drift');
  assert.equal(git('branch','--show-current').toString().trim(),policy.branch,'Canonical branch drift');
  assert.equal(git('status','--porcelain','--',policy.source,policy.artifact,policy.builder).toString(),'','Canonical files changed');
  const source=git('show',`${policy.commit}:${policy.source}`),artifact=git('show',`${policy.commit}:${policy.artifact}`),builder=git('show',`${policy.commit}:${policy.builder}`);
  assert.equal(hash(source),policy.sourceGitSha256);assert.equal(hash(artifact),policy.artifactGitSha256);assert.equal(hash(builder),policy.builderGitSha256);
  const localSource=readFileSync(sourcePath),localArtifact=readFileSync(artifactPath),localBuilder=readFileSync(resolve(policy.localDirectory,policy.builder));
  // Git checkout CRLF conversion is recorded, never silently written back.
  assert.equal(lf(localSource.toString()),source.toString());assert.equal(lf(localArtifact.toString()),artifact.toString());assert.equal(lf(localBuilder.toString()),builder.toString());
  const metadata=/const metadata = `([\s\S]*?)`;/.exec(builder.toString());
  assert.ok(metadata&&!metadata[1].includes('${'),'Pinned builder must retain its literal metadata');
  assert.ok(builder.toString().includes('`${metadata}${source}`'),'Pinned builder assembly changed');
  assert.equal(metadata[1]+source.toString().replace(/^\uFEFF/,''),artifact.toString(),'Pinned generated output mismatch');
  const header=artifact.toString().split('// ==/UserScript==')[0],field=name=>[...header.matchAll(new RegExp(`^// @${name}\\s+(.+)$`,'gm'))].map(m=>m[1].trim());
  assert.deepEqual(field('grant'),policy.grants);assert.deepEqual(field('match'),policy.matches);assert.deepEqual(field('sandbox'),[policy.sandbox]);assert.deepEqual(field('run-at'),[policy.runAt]);
  assert.ok(!artifact.includes(Buffer.from('src/runtime/browser.js'))&&!artifact.includes(Buffer.from('XXT.browser.runtime.v1')),'Rewritten engine in canonical artifact');
  const entry=readFileSync(resolve(root,'src/entry.js'),'utf8');
  assert.ok(!/^\s*import\s/m.test(entry)&&!entry.includes('bootstrap('),'Retired XXT entry must never initialize a second engine');
  return {source,artifact,builder,report:Object.freeze({mode:policy.mode,commit:policy.commit,sourcePath,artifactPath,
    sourceGitSha256:hash(source),artifactGitSha256:hash(artifact),sourceDiskSha256:hash(localSource),artifactDiskSha256:hash(localArtifact),
    grants:policy.grants,optionalBridgeInstalled:false,xxtEngineBundled:false})};
}
export function retireRewriteArtifact() {
  if(existsSync(retiredPath)) {
    assert.equal(hash(readFileSync(retiredPath)),policy.retiredXxtArtifactSha256,'Unexpected file at retired artifact path; refusing to remove');
    unlinkSync(retiredPath); // One explicitly retired generated file, not a recursive operation.
  }
}
export function verifyDistribution() {
  const result=verifyCanonical();assert.equal(existsSync(retiredPath),false,'Retired XXT userscript still present');return result;
}
