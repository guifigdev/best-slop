import {validateRoManualAim,RO_MANUAL_AIM_LEASE} from '../shared/ro-manual-aim.js';
import {stepRoMotion} from '../shared/ro-locomotion.js';
import {tickRoEnvironmentHazards} from '../shared/ro-environment-hazards.js';
import {moveUnit,navigation} from '../shared/field.js';
import {ARENAS} from '../shared/arenas.js';

export const MOVEMENT_ROLLBACK_LIMITS=Object.freeze({history:64,windowMs:500,leadMs:250,step:1/30});
const finite=Number.isFinite,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const classics=new Set(['campaign','tower','best','war']);
const motionFields=['x','z','moving','facing','bonkJumpHeight','bonkJumpVelocity'];
function keyOf(s,id){const u=s?.units?.find(u=>u.id===s.players?.[id]);return [s?.options?.mode,u?.id,s?.worldSeed,s?.bonk?.map?.seed,s?.bonk?.floor,s?.phase,s?.bonk?.stage,u?.cell?.x,u?.cell?.z].join(':');}
export function movementPredictionSupported(state){return state?.options?.mode==='bonk'&&!!state.bonk?.map||classics.has(state?.options?.mode);}
export function applyPredictedMove(state,u,command,elapsed){
 if(state.options.mode==='bonk'){
  // These commands only replay their locomotion/facing consequence. They never
  // execute an attack, spend SP, roll RNG or change authoritative skill state.
  if(command.type==='bkAim'&&typeof command.active==='boolean'){
   const aim=command.active?validateRoManualAim(state,u,command):null;
   if(command.active&&!aim)return false;
   if(aim)u.roManualAim={...aim,until:elapsed+RO_MANUAL_AIM_LEASE};else delete u.roManualAim;
   return true;
  }
  if(command.type==='bkCast'){
   const entry=state.bonk.weapons?.find(w=>w?.key===command.key);
   if(entry&&(entry.ready||entry.reasonCode==='target')&&entry.castTime>0&&!u.roCasting)u.roCasting={key:command.key,finishAt:elapsed+entry.castTime};
   return true;
  }
  if(command.type==='bkCancelCast'){delete u.roCasting;delete u.roManualAim;return true;}
  if(command.type==='bkMove'&&finite(command.dx)&&finite(command.dz)){const d=Math.max(1,Math.hypot(command.dx,command.dz));u.bonkMove={dx:command.dx/d,dz:command.dz/d};u.bonkMoveAt=elapsed;return true;}
  if(['stop','hold'].includes(command.type)){u.bonkMove={dx:0,dz:0};return true;}
 }else if(classics.has(state.options.mode)){
  if(command.type==='move'&&finite(command.x)&&finite(command.z)){u.destination={x:command.x,z:command.z};u.order='move';u.target=null;return true;}
  if(['stop','hold'].includes(command.type)){u.destination=null;u.order=command.type;return true;}
 }
 return false;
}
export function stepPredictedMotion(state,u,time,dt){
 if(!u.alive||state.onlineRoom?.paused||state.onlineRoom&&!state.onlineRoom.started||['victory','defeat'].includes(state.phase))return;
 if(state.options.mode==='bonk'){
  if(state.bonk.stage!=='playing'||state.bonk.offer||u.bonkOffer)return;
  const elapsed=(state.bonk.elapsed||0)+time-state.time,game={...state,time,bonk:{...state.bonk,elapsed}};
  const terrain=tickRoEnvironmentHazards(game,u,dt);stepRoMotion(state.bonk.map,u,elapsed,dt,(u.speed||0)*terrain.speedMultiplier);return;
 }
 if(!classics.has(state.options.mode)||(u.stun||0)>0||u.channel||u.stageDone||u.order!=='move'||!u.destination)return;
 const game={...state,time,units:state.units.map(v=>v.id===u.id?u:v)},dest=navigation(game,u,u.destination),distance=Math.hypot(dest.x-u.x,dest.z-u.z);
 if(distance<=.04){u.moving=false;return;}
 const slow=1-Math.max((u.frostUntil||0)>time?.45*(1-(u.coldResist||0)):0,(u.abilitySlowUntil||0)>time?u.abilitySlowAmount||0:0),speed=(u.speed||0)*slow*(u.wading?.55:1)*(ARENAS[state.arena]?.move||1),v=Math.min(distance/dt,speed);
 u.facing=Math.atan2(dest.x-u.x,dest.z-u.z);const vx=Math.sin(u.facing)*v,vz=Math.cos(u.facing)*v;
 if(u.sliding){const blend=1-Math.exp(-dt*2.8);u.vx=(u.vx||0)+(vx-(u.vx||0))*blend;u.vz=(u.vz||0)+(vz-(u.vz||0))*blend;}else{u.vx=vx;u.vz=vz;}
 moveUnit(game,u,{x:u.x+u.vx*dt,z:u.z+u.vz*dt});
}

// This rolls back only the presentation of our own locomotion. Authoritative
// HP, inventory, fog of war, RNG, projectiles and opponents are never replayed.
export function createMovementRollback({now=()=>Date.now()}={}){
 let state=null,owner=null,epoch='',receivedAt=0,oneWay=0,history=[],ack=0,blockedUntil=0,rollbacks=0;
 const sent=new Map();
 function reset(){state=null;owner=null;epoch='';history=[];sent.clear();ack=0;oneWay=0;blockedUntil=0;}
 return{
  reset,
  sent(sequence,command){if(!state||!state.network?.movementReplay)return;const at=now();sent.set(sequence,at);while(sent.size>128)sent.delete(sent.keys().next().value);const u=state.units.find(u=>u.id===state.players?.[owner]);if(!u)return;
   if(applyPredictedMove(state,{...u},command,state.bonk?.elapsed||0))history.push({sequence,command:{...command},at});
   else if(!['bkAuto','toggleAutocast','roomChat'].includes(command.type)){blockedUntil=sequence;history=[];}
   history=history.filter(h=>at-h.at<=MOVEMENT_ROLLBACK_LIMITS.windowMs).slice(-MOVEMENT_ROLLBACK_LIMITS.history);
  },
  receive(next,id){
   if(!next?.network?.movementReplay||!movementPredictionSupported(next)){reset();state=next;owner=id;return;}
   const at=now(),key=keyOf(next,id),nextAck=next.network.ack;
   if(!Number.isSafeInteger(nextAck)||nextAck<0)return;
   if(epoch===key&&state&&(next.time<state.time||nextAck<ack))return;
   if(epoch!==key){history=[];sent.clear();blockedUntil=0;oneWay=0;}else{const stamp=sent.get(nextAck);if(finite(stamp))oneWay=clamp((at-stamp)/2,0,125);rollbacks++;}
   epoch=key;state=next;owner=id;ack=nextAck;receivedAt=at;
   history=history.filter(h=>h.sequence>ack&&at-h.at<=MOVEMENT_ROLLBACK_LIMITS.windowMs);for(const seq of sent.keys())if(seq<=ack)sent.delete(seq);
  },
  sample(){
   if(!state?.network?.movementReplay||!movementPredictionSupported(state)||blockedUntil>ack)return state;
   const at=now(),age=at-receivedAt;if(age<0||age>MOVEMENT_ROLLBACK_LIMITS.windowMs)return state;
   const original=state.units.find(u=>u.id===state.players?.[owner]);if(!original?.alive)return state;
   const u={...original,bonkMove:original.bonkMove&&{...original.bonkMove},roContactPush:original.roContactPush&&{...original.roContactPush},roIceMotion:original.roIceMotion&&{...original.roIceMotion},roEnvironmentExposure:original.roEnvironmentExposure&&{...original.roEnvironmentExposure}};
   const start=receivedAt-oneWay,end=Math.min(at,start+MOVEMENT_ROLLBACK_LIMITS.leadMs);let cursor=start,index=0;
   while(cursor<end-.001){while(index<history.length&&history[index].at<=cursor+.001){applyPredictedMove(state,u,history[index].command,(state.bonk?.elapsed||0)+(cursor-start)/1000);index++;}
    const boundary=index<history.length?Math.max(cursor,history[index].at):end,dt=Math.min(MOVEMENT_ROLLBACK_LIMITS.step,(end-cursor)/1000,(boundary-cursor)/1000);
    if(dt<=0){cursor=Math.min(end,boundary);continue;}stepPredictedMotion(state,u,state.time+(cursor-start)/1000+dt,dt);cursor+=dt*1000;
   }
   // Applying an input immediately changes facing/next step without changing
   // gameplay state; the next animation frame advances the same replay.
   const projected={...original};for(const field of motionFields)if(Object.hasOwn(u,field))projected[field]=u[field];
   return{...state,units:state.units.map(v=>v.id===original.id?projected:v)};
  },
  stats:()=>({enabled:!!state?.network?.movementReplay&&movementPredictionSupported(state),pending:history.length,ack,oneWayMs:oneWay,rollbacks,blocked:blockedUntil>ack})
 };
}
