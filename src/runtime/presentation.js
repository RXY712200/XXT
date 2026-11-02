import { reasons, safeReason } from './diagnostics.js';

// Read-only projection. No random draws, scheduling, storage writes or DOM effects.
export function runtimePresentation({state,task,evaluation,actions,now,stopped,pendingContext,tabPending,recovery,restUntil,loadingSince,failureCode='none'}) {
  const pending=actions.filter(a=>a.status==='pending');
  const nav=pending.find(a=>a.key.endsWith(':navigate')),ack=pending.find(a=>a.key.endsWith(':navigation-ack'));
  const start=pending.find(a=>a.key.includes(':start:')),retry=pending.find(a=>a.key.includes(':external:recovery-'));
  const record=state.records.find(r=>r.key===task?.key),fresh=evaluation?.fresh;
  const contradiction=fresh?.lesson?.credit.status==='contradictory'||fresh?.tasks.some(t=>t.credit.status==='contradictory');
  const platformCredit=contradiction?'contradictory':!evaluation?.safe?'unavailable':evaluation.lessonConfirmed?'confirmed':'unconfirmed';
  let runtimePhase='waiting',currentAction='platform-confirmation',nextAction='none',deadlineKind='none',deadline=null;
  if(stopped){runtimePhase='stopped';currentAction='manual';}
  else if(ack){runtimePhase='navigating';currentAction='destination-confirmation';nextAction='waiting-owner';deadlineKind='acknowledgement';deadline=ack.deadline;}
  else if(nav){
    runtimePhase='navigating';currentAction='navigation-delay';deadlineKind='navigation';deadline=nav.deadline;
    const target=fresh?.catalog.find(item=>item.key===state.navigation?.targetKey);
    nextAction=target?.chapterKey!==fresh?.lesson?.chapterKey?'next-chapter':'next-lesson';
  }
  else if(pendingContext||tabPending){runtimePhase=pendingContext?.sameLesson?'recovering':'waiting';currentAction=pendingContext?.sameLesson?'frame-recovery':'waiting-owner';nextAction='waiting-owner';deadlineKind=pendingContext?.sameLesson?'recovery':'owner';deadline=(pendingContext||tabPending).until;}
  else if(retry){runtimePhase='recovering';currentAction=state.active?'recovery-observation':'frame-recovery';nextAction=state.active?'none':'waiting-owner';deadlineKind='recovery';deadline=retry.deadline;}
  else if(restUntil>now){runtimePhase='resting';currentAction='rest';deadlineKind='rest';deadline=restUntil;}
  else if(start){runtimePhase='waiting';currentAction=task?.kind==='video'?'video-start':task?.kind==='audio'?'audio-start':'task-start';nextAction=task?.ordinal>0?'next-attachment':currentAction;deadlineKind='attachment';deadline=start.deadline;}
  else if(state.active){runtimePhase='running';currentAction=task?.kind==='live'?'manual':record?.state==='STARTING'?'task-start':task?.kind==='document'?'reading':'playing';}
  else if(state.records.some(r=>['UNSUPPORTED','UNRESOLVED','FAILED'].includes(r.state))||failureCode==='unsupported-boundary'){runtimePhase='unsupported';currentAction='manual';}
  else if(!['none','lesson-not-credited','inactive-or-busy-context'].includes(failureCode)){currentAction='manual';}
  else if(!state.inventory||state.inventory.status==='loading'){runtimePhase='detecting';currentAction='detecting';if(state.inventory){deadlineKind='startup';deadline=loadingSince+10000;}}
  const code=platformCredit==='contradictory'?'contradictory-credit':failureCode!=='none'?safeReason(failureCode):runtimePhase==='unsupported'?safeReason(state.diagnostic):'none';
  const manualRequired=runtimePhase==='stopped'||runtimePhase==='unsupported'||!['none','lesson-not-credited','inactive-or-busy-context'].includes(code);
  return Object.freeze({runtimePhase,currentAction,nextAction,deadlineKind,remainingMs:deadline===null?null:Math.max(0,deadline-now),platformCredit,
    localResult:record?.state==='RESTORED_WAITING_PLATFORM'?'restored':record?.state==='WAITING_PLATFORM'?'local-ended':['STARTING','RUNNING'].includes(record?.state)?'running':['FAILED','UNRESOLVED','UNSUPPORTED','CANCELLED','PAUSED'].includes(record?.state)?'unresolved':'not-started',
    knownCount:state.records.filter(r=>['video','audio','document','live'].includes(r.kind)).length,
    locallyEndedCount:state.records.filter(r=>['WAITING_PLATFORM','RESTORED_WAITING_PLATFORM'].includes(r.state)).length,
    recoveryAttempt:recovery?.attempts||0,recoveryBudget:3,recoveryRemainingMs:deadlineKind==='recovery'?Math.max(0,deadline-now):null,
    restRemaining:stopped?0:Math.max(0,restUntil-now),failureCode:code,failureText:reasons[code],manualRequired,navigationStage:state.navigation?.stage||'idle'});
}
