import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';
import { verifyDistribution, policy } from '../scripts/canonical-runtime.mjs';

test('external policy selects the complete pinned fork only; no rewritten installable or second startup',async()=>{
  const {report}=verifyDistribution();
  assert.equal(report.xxtEngineBundled,false);assert.equal(report.optionalBridgeInstalled,false);
  assert.equal(report.commit,'351c08dc4d772908c3d098e8c9160be434bf1064');
  const entry=await import('../src/entry.js');assert.equal(entry.distributionMode,policy.mode);
});

test('pinned source/artifact compile unchanged and the original metadata/body/build agree',()=>{
  const {source,artifact,report}=verifyDistribution();
  new Script(source.toString());new Script(artifact.toString());
  assert.equal(report.artifactGitSha256,policy.artifactGitSha256);
  assert.deepEqual(report.grants,policy.grants);
  assert.ok(artifact.toString().endsWith(source.toString()));
});

test('complete installable boots one V3 instance; reinjection destroys the old instance, without any XXT engine',()=>{
  const {artifact}=verifyDistribution();
  const dom=new JSDOM('<div class="prev_title" title="章节测验"></div><div id="coursetree"><div id="unit-synthetic" class="posCatalog_select posCatalog_active"><span class="posCatalog_name" title="章节测验">章节测验</span><input class="jobUnfinishCount" value="1"></div></div><iframe info="card"></iframe>',
    {url:'https://mooc1.chaoxing.com/mycourse/studentstudy?courseId=synthetic-canonical',runScripts:'outside-only'});
  const window=dom.window,timers=new Map();let id=0;
  // Environment shim only: no editing, extracting or replacing any engine method.
  function jquery(selector){const nodes=typeof selector==='string'?[...window.document.querySelectorAll(selector.replace(':visible',''))]:[selector];
    return Object.assign(nodes,{off(){return this;},on(){return this;},filter(fn){return jqueryResult(nodes.filter((node,index)=>fn(index,node)));},toArray(){return nodes;},text(){return nodes[0]?.textContent||'';}});}
  const jqueryResult=nodes=>Object.assign(nodes,{off(){return this;},on(){return this;},toArray(){return nodes;},text(){return nodes[0]?.textContent||'';}});
  window.jQuery=jquery;window.$=jquery;window.unsafeWindow=window;
  window.setInterval=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};window.clearInterval=key=>timers.delete(key);
  window.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};window.clearTimeout=key=>timers.delete(key);
  const errors=[];window.console={log(){},info(){},warn(){},error(...args){errors.push(args);}};
  const run=()=>{
    window.eval(artifact.toString());const timer=timers.get(window.__xuexitongPlayerV3BootTimer);assert.ok(timer);timer.fn();
    const app=window.__xuexitongPlayerV3;assert.ok(app&&!app._destroyed);assert.equal(window.app,app);
    timer.fn();assert.equal(window.__xuexitongPlayerV3,app);
    assert.equal(window.document.querySelectorAll('#xuexitong-v3-notice').length,1);
    assert.equal(window.document.querySelectorAll('#xuexitong-v3-settings').length,1);
    assert.equal(window.XXT,undefined);assert.equal(window[Symbol.for('XXT.browser.runtime.v1')],undefined);
    return app;
  };
  const first=run(),second=run();assert.notEqual(first,second);assert.equal(first._destroyed,true);assert.deepEqual(errors,[]);
  second.destroy();window.__xuexitongTaskSupport?.dispose();timers.clear();dom.window.close();
});
