// Adapted user-authored createGMLive claim/ack, separate child pulse, bounded
// recovery and terminal guards, fork 351c08dc (7389916/7faceb2).
// Transport capability must be private to a trusted userscript context. This
// module installs nothing; no postMessage receiver, GM grant, opener or auto-return.
export function createReplayLifecycle({ storage, now, randomId, verifyContext }) {
  const key='xxt.replay-session.v1', claimKey=key+':claim', pulseKey=key+':child';
  const terminal=new Set(['ended','verify','done']);
  const read=()=>storage.get(key,null);
  const write=record=>{storage.set(key,record);return record;};
  const same=(a,b)=>a&&b&&a.course===b.course&&a.lesson===b.lesson&&a.item===b.item;
  const current=r=>r&&r.version===1&&Number.isFinite(r.expires)&&r.expires>now();
  const valid=(r,context)=>current(r)&&same(r.content,context)&&verifyContext(context);
  function pulse(r){const p=storage.get(pulseKey,null);return p?.id===r.id&&p.nonce===r.nonce&&p.child===r.child&&p.at>=r.created&&p.at<=now()?p.at:r.childBoundAt;}
  function tick(context){
    let r=read();if(!r||!same(r.content,context))return null;
    if(terminal.has(r.phase)||r.phase==='cancelled')return r;
    if(!valid(r,context))return write({...r,phase:'cancelled',reason:'expired-or-context'});
    if(r.phase==='pending'){
      if(now()-r.created>120000)return write({...r,phase:'cancelled',reason:'claim-timeout'});
      const claim=storage.get(claimKey,null);
      if(claim?.id===r.id&&claim.nonce===r.nonce&&same(claim.content,r.content)&&claim.at>=r.created&&claim.at<=now()&&now()-claim.at<=120000)
        r=write({...r,phase:'active',child:claim.child,childBoundAt:now(),seq:1});
    }
    if(r.phase==='active'&&(!Number.isFinite(pulse(r))||now()-pulse(r)>180000))return write({...r,phase:'cancelled',reason:'child-inactive'});
    return r;
  }
  return Object.freeze({
    begin(content,{explicit=false}={}){
      if(!content?.course||!content.lesson||!content.item||!verifyContext(content))return null;
      let r=read();
      // Successful attempts stay terminal even after expiry: retry is not credit.
      if(r&&same(r.content,content)&&terminal.has(r.phase))return null;
      if(r&&current(r)&&['pending','active'].includes(r.phase)){
        if(!same(r.content,content))return null;
        r=tick(content);
        if(['pending','active'].includes(r.phase))return null;
      }
      if(r&&!explicit)return null; // Recovery requires an explicit retry, no reopening loop.
      const id=randomId(),nonce=randomId();if(!id||!nonce||id===nonce||id===r?.id)return null;
      storage.remove(claimKey);storage.remove(pulseKey);
      return write({version:1,id,nonce,content:{course:content.course,lesson:content.lesson,item:content.item},phase:'pending',created:now(),expires:now()+14400000,seq:0,refreshUsed:false});
    },
    claim(content,child){const r=read();if(!child||!valid(r,content)||r.phase!=='pending'||now()-r.created>120000||storage.get(claimKey,null))return false;
      storage.set(claimKey,{id:r.id,nonce:r.nonce,content:r.content,child,at:now()});return true;},
    tick,
    heartbeat(id,child){const r=read();if(!current(r)||r.phase!=='active'||r.id!==id||r.child!==child)return false;storage.set(pulseKey,{id,nonce:r.nonce,child,at:now()});return true;},
    // A caller holding the private transport must independently check actual
    // player identity, progression and genuine ended. Never wire page messages here.
    ended(content,id,child,proof){const r=read();if(!valid(r,content)||r.phase!=='active'||r.id!==id||r.child!==child||now()-pulse(r)>180000||!proof())return false;write({...r,phase:'ended',seq:2});return true;},
    verify(content,platformProof){const r=read();if(!valid(r,content)||!['ended','verify'].includes(r.phase))return 'waiting';
      if(platformProof()){write({...r,phase:'done'});return 'credited';}
      if(!r.refreshUsed){write({...r,phase:'verify',refreshUsed:true});return 'refresh-once';}return 'manual';},
    cancel(content){const r=read();if(r&&same(r.content,content)&&['pending','active'].includes(r.phase))write({...r,phase:'cancelled',reason:'explicit-stop'});},
    snapshot:read
  });
}
