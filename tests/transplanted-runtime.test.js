import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {verifyTransplant,members} from '../scripts/transplant-audit.mjs';
import {createArtifact,verifyArtifact,artifactPath} from '../scripts/build-userscript.mjs';
import {coursePage} from './helpers/transplant-page.js';

test('pinned provenance, exact developed fragments, complete single-engine build and permissions',()=>{
  const {summary,manifest,source,entry}=verifyTransplant();
  assert.equal(summary.commits,59);assert.equal(summary.directlyPreservedDiffAddedNonemptyLines,2857);
  assert.equal(readFileSync(artifactPath,'utf8'),createArtifact());assert.match(verifyArtifact(),/^[a-f0-9]{64}$/);
  new Script(entry);new Script(createArtifact());
  const a=members(source),b=members(entry);
  for(const name of ['createTaskSupport','createLessonPlan','createActionScheduler','createTaskPacingCoordinator','createUnattendedRecoveryCoordinator',
    'app._completeVideo','app._continueCompleted','app._queueNavigation','app._priorCompletionValid','app._checkPriorCompletion','app._audioPlayRejected',
    'app._audioExhausted','app._mountSettingsPanel','app._mountNoticePanel','app._block','app.stopAutomation','app._getVideoEl','app.playCurrentIndex']) {
    assert.equal(entry.slice(b.get(name).start,b.get(name).end),source.slice(a.get(name).start,a.get(name).end),name);
  }
  assert.equal(manifest.functions.filter(f=>f.classification==='A-inherited'&&f.disposition==='byte-identical').length,0);
});

test('automatic full-installable startup, nested owned video, two-area UI, no duplicate live engine, teardown',async()=>{
  const p=await coursePage();try{
    const first=await p.evaluate();await p.advance(2000);
    assert.equal(first._state,'PLAYING',first._lastNotice);assert.equal(p.players[0].state.calls,1);assert.equal(p.players[0].element.playbackRate,1);
    assert.equal(p.doc.querySelectorAll('#xuexitong-v3-settings').length,1);assert.equal(p.doc.querySelectorAll('#xuexitong-v3-notice').length,1);
    p.inject();const pendingBoot=p.w.__xuexitongPlayerV3BootTimer;
    first.destroy();assert.ok(p.timers.has(pendingBoot),'Old teardown cannot cancel the new boot');
    await p.advance(3000);const second=p.app;assert.ok(first._destroyed);assert.notEqual(first,second);
    assert.equal(p.doc.querySelectorAll('#xuexitong-v3-settings').length,1);assert.equal(p.w.XXT,undefined);
    assert.equal(p.w[Symbol.for('XXT.browser.runtime.v1')],undefined);assert.deepEqual(p.errors,[]);
    second.destroy();assert.equal(second._eventVideoEl,null);assert.equal(second._pageGuards,null);assert.equal(second._checkInterval,null);
    assert.equal(p.doc.querySelector('#xuexitong-v3-notice'),null);
  }finally{p.close();}
});

test('delayed native player initialization remains bounded and starts exactly once',async()=>{
  const p=await coursePage({delayed:true});try{
    await p.evaluate();await p.advance(750);assert.equal(p.app._state,'WAITING_STARTUP');
    const media=p.player();await p.advance(2500);assert.equal(p.app._state,'PLAYING',p.app._lastNotice);assert.equal(media.state.calls,1);
  }finally{p.close();}
});

test('native audio audible denial uses the preserved same-player one-shot muted fallback',async()=>{
  const p=await coursePage({kind:'audio'});try{
    const media=p.players[0];media.state.reject=['NotAllowedError'];await p.evaluate();await p.advance(2500);
    assert.equal(p.app._state,'PLAYING',p.app._lastNotice);assert.equal(media.state.calls,2);assert.equal(media.element.muted,true);assert.equal(media.element.playbackRate,1);
    media.end();await p.advance(3000);assert.notEqual(p.app._state,'PLAYING');assert.equal(p.clicks,0,'Local audio end alone must not navigate');
  }finally{p.close();}
});

test('natural ended plus fresh platform credit uses one native navigation and verifies fresh destination',async()=>{
  const p=await coursePage();try{
    await p.evaluate();await p.advance(2000);const old=p.players[0];
    old.end();old.element.dispatchEvent(new p.w.Event('ended'));await p.advance(3000);
    assert.equal(p.clicks,0);assert.equal(p.app._state,'VERIFYING_COMPLETION');
    p.credit();
    for(let i=0;i<50;i++){await p.advance(500);if(p.clicks&&p.app._state==='PLAYING')break;}
    assert.equal(p.clicks,1,p.app._lastNotice);
    assert.equal(p.doc.querySelector('.posCatalog_active').id,'lesson-b');assert.equal(p.app._videoEl,p.players[1].element);
    assert.equal(p.players[1].state.calls,1);old.element.dispatchEvent(new p.w.Event('ended'));await p.advance(2000);assert.equal(p.clicks,1);
  }finally{p.close();}
});

test('prior credit does not replay, and explicit Stop cancels the scheduled navigation and survives reinjection',async()=>{
  const p=await coursePage({credited:true});try{
    await p.evaluate();await p.advance(500);assert.equal(p.players[0].state.calls,0);
    assert.equal(p.app._state,'NAVIGATION_COOLDOWN');p.app._recovery.markExplicitStop();p.app.stopAutomation();
    await p.advance(15000);assert.equal(p.clicks,0);await p.evaluate();await p.advance(5000);
    assert.equal(p.players[0].state.calls,0);assert.equal(p.clicks,0);assert.equal(p.app._recovery.getStatus().stopped,true);
  }finally{p.close();}
});

test('background focus/pause/stall recovery stays immediate with cooldown; context failure is not explicit Stop',async()=>{
  const p=await coursePage();try{
    await p.evaluate();await p.advance(2000);const media=p.players[0];media.state.paused=true;
    const before=media.state.calls;p.w.dispatchEvent(new p.w.Event('blur'));assert.equal(media.state.calls,before+1);
    p.w.dispatchEvent(new p.w.Event('blur'));assert.equal(media.state.calls,before+1);
    await p.advance(1600);media.state.paused=true;p.app._checkVideoStatus();assert.equal(media.state.calls,before+2);
    await p.advance(8000);assert.ok(media.state.calls>=before+3,'Stall recovery still executes');
    p.doc.querySelector('#lesson-a').id='changed-lesson';p.app._checkVideoStatus();
    assert.equal(p.app._state,'BLOCKED');assert.equal(p.app._recovery.getStatus().stopped,false);
    const count=media.state.calls;await p.advance(3000);assert.equal(media.state.calls,count);assert.equal(p.clicks,0);
  }finally{p.close();}
});

test('unknown task and verification remain non-completion; source retains document/replay/partial/recovery policies',async()=>{
  for(const hazard of ['unknown','verification']) {
   const p=await coursePage();try{
    if(hazard==='unknown')p.root.body.append(Object.assign(p.root.createElement('div'),{className:'ans-attach-online',textContent:'unsupported synthetic attachment'}));
    else { const form=p.root.createElement('form');form.innerHTML='<label>验证码<input placeholder="验证码"></label>';p.root.body.append(form); }
    await p.evaluate();await p.advance(15000);assert.notEqual(p.app._state,'PLAYING');assert.equal(p.players[0].state.calls,0);assert.equal(p.clicks,0);
    assert.equal(p.app._recovery.getStatus().stopped,false);
   }finally{p.close();}
  }
});

test('developed sequential-video selection is retained; unfinished second video cannot authorize navigation',async()=>{
  const p=await coursePage();try{
    const second=p.player('video','second_video_html5_api');await p.evaluate();await p.advance(2000);
    assert.equal(p.players[0].state.calls,1);assert.equal(second.state.calls,0);
    p.players[0].end();
    for(let i=0;i<20;i++){await p.advance(500);if(second.state.calls)break;}
    assert.equal(second.state.calls,1);assert.equal(p.app._videoEl,second.element);assert.equal(p.clicks,0);
  }finally{p.close();}
});

