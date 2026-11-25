import {RO_SKILLS} from './ragnarok-jobs.js';
import {isRoMeteorSkill,RO_METEOR_TIMING} from './ro-meteor.js';
import {isRoArrowRainSkill,RO_ARROW_RAIN_TIMING} from './ro-arrow-rain.js';

// RO skill IDs, /effect IDs and STR filenames are different namespaces. Keep
// the imported skill map as the only authority for their relationship.
const aliases=Object.freeze({ro_bash:'bash',ro_meteor:'wz_meteor',meteorstorm:'wz_meteor',ro_magnus:'magnusexorcismus',ro_sanctuary:'pr_sanctuary',ra_arrowstorm:'arrowstorm',wm_severe_rainstorm:'severerainstorm'});
const indexes=new WeakMap(),finite=(v,f=0)=>Number.isFinite(v)?v:f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fieldCastSkills=new Set(['mg_thunderstorm','wz_vermilion','as_venomdust','nc_magma_eruption']);
// The upstream "cast" column also contains attacks performed ON the target.
// In this game's travelling-projectile adaptation, these start at contact.
const targetProjectileCasts=new Set(['mg_lightningbolt','ra_aimedbolt','wl_crimsonrock','judex','sa_spellbreaker','sa_dispell','pf_soulburn']);
const impacts=new Set(['abilityPulse','fireball','frostnova','poison','roSkillImpact','roNativeHit']);
const utilities=new Set(['heal','devotion','battlecry','summon','sprint']);
const rejected=new Set(['bossDanger','bossImpact','monsterWarning','monsterAttack','levelup','roEarthquake']);
function index(manifest){
 if(!manifest||typeof manifest!=='object')return new Map();if(indexes.has(manifest))return indexes.get(manifest);
 const result=new Map();for(const [key,value]of Object.entries(manifest.skills||{})){result.set(key.toLowerCase(),key);if(value.sourceAegis)result.set(value.sourceAegis.toLowerCase(),key);if(value.sourceId!=null)result.set('#'+value.sourceId,key);}indexes.set(manifest,result);return result;
}
export function roNativeSkillPolicy(skillKey,manifest){
 if(skillKey==null||skillKey==='basic')return null;const lookup=index(manifest),raw=String(skillKey),candidate=aliases[raw.toLowerCase()]||raw.toLowerCase(),definition=RO_SKILLS[candidate];
 const key=lookup.get(candidate)||lookup.get('#'+raw)||definition&&lookup.get('#'+definition.sourceId);if(!key)return null;
 return{key,definition:RO_SKILLS[key]||definition||{},...manifest.skills[key]};
}
const rowFile=row=>row.primitiveId||row.file;
function supported(row,manifest,options){
 const types=options.types||['STR'];if(!types.includes(row.type)||!rowFile(row))return false;
 return options.hasAsset?options.hasAsset(row,manifest):!!manifest.effects?.[row.file];
}
function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
/** A %d table entry is a random alternative, not simultaneous layers. Select
 * the same available variant on every client, without touching gameplay RNG. */
export function roNativeEffectRows(skillKey,phase,manifest,options={}){
 const policy=roNativeSkillPolicy(skillKey,manifest);if(!policy)return[];const rows=(policy.phases?.[phase]||[]).filter(row=>supported(row,manifest,options)),groups=new Map(),chosen=[];
 for(const row of rows){if(!row.variantGroup)chosen.push(row);else{const group=groups.get(row.variantGroup)||[];group.push(row);groups.set(row.variantGroup,group);}}
 for(const [group,values]of groups){values.sort((a,b)=>finite(a.variant)-finite(b.variant)||String(rowFile(a)).localeCompare(String(rowFile(b))));chosen.push(values[hash((options.variantSeed??policy.key)+':'+group)%values.length]);}
 return chosen;
}
export function roNativeEventPhases(event,definition={}){
 if(!event||rejected.has(event.type)||event.basicAttack||event.skillKey==='basic')return[];
 if(event.type==='roCast'||event.type==='cast')return['cast'];
 if(event.type==='roMeteorFall'||event.type==='roArrowRainFall')return['cast'];
 if(event.type==='roMeteorImpact'||event.type==='roArrowRainImpact')return['hit'];
 if(event.type==='roAttack'){
  if(event.attackKind==='projectile'||definition.kind==='projectile')return['cast'];
  if(event.bonk&&['pulse','orbit','zone'].includes(event.attackKind||definition.kind))return['cast'];
  return['cast','hit','ground'];
 }
 // Per-victim status echoes must never restart the whole area/cast animation.
 if(impacts.has(event.type))return event.target!=null&&finite(event.radius)<=1.5?['hit']:['hit','ground'];
 if(utilities.has(event.type))return['cast','hit','ground'];
 return[];
}
function matchedZone(event,policy,state,manifest){
 if(!state?.bonk)return null;
 return(state.bonk.roSkillZones||[]).find(z=>z.source===event.source&&roNativeSkillPolicy(z.key,manifest)?.key===policy.key&&Math.hypot(z.x-finite(event.x),z.z-finite(event.z))<.2&&z.until>finite(state.bonk.elapsed));
}
function fieldPhase(zone,policy,manifest,options){
 if(roNativeEffectRows(policy.key,'ground',manifest,options).length)return'ground';
 // These original STRs contain the whole field despite being in the client
 // skill map's cast column. A hammer, trap explosion or summon is not a field.
 return fieldCastSkills.has(policy.key)&&roNativeEffectRows(policy.key,'cast',manifest,options).length?'cast':null;
}
function request(row,policy,event,phase,unit,options={}){
 const state=options.state,target=(state?.units||[]).find(u=>u.id===event.target),isCast=phase==='cast',kind=event.attackKind||policy.definition?.kind;
 const pointCast=event.type==='roMeteorFall'||event.type==='roArrowRainFall'||kind==='zone'||targetProjectileCasts.has(policy.key)||!!options.zone;
 const atSource=isCast&&!pointCast,atTarget=!atSource&&event.type==='roAttack'&&['slash','dash','chain'].includes(kind);
 const position=atSource?unit||event:atTarget?target||{x:event.tx??event.x,z:event.tz??event.z}:event;
 const anchor=options.zone?'point':atSource?'source':row.attachedEntity&&event.target!=null?'target':'point';
 const time=finite(event.time,finite(state?.time)),seed=String(event.id??[event.type,event.source,event.skillKey,event.x,event.z].join(':'))+':'+time;
 const buff=row.type!=='STR'&&utilities.has(event.type)&&(unit?.roSkillBuffs||[]).find(v=>roNativeSkillPolicy(v.key,options.manifest)?.key===policy.key&&v.until>finite(state?.bonk?.elapsed));
 const until=buff&&state?.bonk?finite(state.time)-finite(state.bonk.elapsed)+buff.until:undefined;
 return{file:rowFile(row),primitiveId:row.primitiveId,part:row,effectId:row.effectId,skillKey:policy.key,phase,x:finite(position.x),z:finite(position.z),time,scale:finite(options.scale,1),anchor,attachedEntity:!!row.attachedEntity&&anchor!=='point',targetId:event.target,sourceIdActor:event.source??unit?.id,dedupeKey:'event:'+seed+':'+phase+':'+rowFile(row),groupId:'event:'+seed,preserveAttackTrail:event.type==='roAttack'&&['slash','dash','chain'].includes(kind),...(Number.isFinite(until)?{until}:{}),...options.request};
}
/** Launches never fake projectile impacts. Utilities work without roAttack.
 * Returned requests are presentation only; readiness/suppression belongs to
 * the renderer after every requested asset has actually been loaded. */
export function roNativeEventRequests(event,unit,manifest,options={}){
 if(event?.skillKey==='asc_meteorassault')return[]; // Requested canonical volumetric circular fire replaces the neutral ring.
 if(!event||unit?.bonkEnemy||event.enemy||rejected.has(event.type))return[];const policy=roNativeSkillPolicy(event.skillKey,manifest);if(!policy)return[];
 if(impacts.has(event.type)&&!['roSkillImpact','roNativeHit'].includes(event.type)&&event.target!=null){
  const contact=(options.state?.effects||[]).find(e=>['roSkillImpact','roNativeHit'].includes(e.type)&&e.source===event.source&&e.target===event.target&&Math.abs(finite(e.time)-finite(event.time))<.025&&roNativeSkillPolicy(e.skillKey,manifest)?.key===policy.key);
  if(contact)return roNativeEventRequests(contact,unit,manifest,options);
 }
 // The client table calls the entire HammerFall/StormGust animation "cast".
 // Both authoritative events refer to that one animation. Reuse the launch's
 // identity, so handles(pulse) can suppress its generic fallback only when the
 // exact same native clip was admitted. Status echoes remain target-specific.
 if(impacts.has(event.type)&&event.target==null&&['pulse','orbit'].includes(policy.definition.kind)&&roNativeEffectRows(policy.key,'cast',manifest,options).length){
  const launch=(options.state?.effects||[]).find(e=>e.type==='roAttack'&&e.source===event.source&&Math.abs(finite(e.time)-finite(event.time))<.025&&roNativeSkillPolicy(e.skillKey,manifest)?.key===policy.key);
  if(launch)return roNativeEventRequests(launch,unit,manifest,options);
 }
 const zone=matchedZone(event,policy,options.state,manifest),phaseForZone=zone&&fieldPhase(zone,policy,manifest,options),result=[],seen=new Set();
 let phases=roNativeEventPhases(event,policy.definition);
 if(targetProjectileCasts.has(policy.key)&&policy.definition.kind==='projectile'){
  if(event.type==='roAttack')phases=[];
  else if(event.type==='roSkillImpact'||event.type==='roNativeHit'||impacts.has(event.type)&&event.target==null)phases=['cast','hit'];
 }
 for(const phase of phases){
  // Persistent fields have one stable birth/loop, never one new clip per tick.
  if(zone&&phaseForZone&&(phase===phaseForZone||phase==='ground'))continue;
  if(zone&&phase==='cast'&&phaseForZone==='ground')continue;
  for(const row of roNativeEffectRows(policy.key,phase,manifest,{...options,variantSeed:event.showerId??event.id??event.time})){
   const r=request(row,policy,event,phase,unit,{...options,manifest}),identity=[r.file,r.x,r.z,r.time].join(':');if(seen.has(identity))continue;seen.add(identity);result.push(r);
  }
 }
 return result;
}
/** Persistent authoritative zones only. Per-event requests are intentionally
 * separate, so a renderer using both callbacks cannot ingest each event twice. */
export function roNativeRequestsForState(state,manifest,options={}){
 const b=state?.bonk;if(!b)return[];const result=[],offset=finite(state.time)-finite(b.elapsed);
 for(const zone of b.roSkillZones||[]){
  if(zone.until<=finite(b.elapsed))continue;const policy=roNativeSkillPolicy(zone.key,manifest);if(!policy)continue;const phase=fieldPhase(zone,policy,manifest,options);if(!phase)continue;
  const unit=(state.units||[]).find(u=>u.id===zone.source);if(unit?.bonkEnemy)continue;
  const duration=clamp(finite(zone.weapon?.mechanics?.duration??policy.definition.mechanics?.duration,6),1,45),fall=isRoMeteorSkill(zone.key)?RO_METEOR_TIMING.fall:isRoArrowRainSkill(zone.key)?RO_ARROW_RAIN_TIMING.fall:0,time=offset+zone.until-duration-fall;
  for(const row of roNativeEffectRows(policy.key,phase,manifest,{...options,variantSeed:zone.id})){
   const r=request(row,policy,{type:'nativeZone',skillKey:zone.key,source:zone.source,x:zone.x,z:zone.z,time},phase,unit,{...options,state,zone:true});
   result.push({...r,time:time+fall,until:offset+zone.until,loop:true,zoneId:zone.id,groupId:'zone:'+zone.id,dedupeKey:'zone:'+zone.id+':'+rowFile(row),anchor:zone.follow?'source':'point',attachedEntity:!!zone.follow});
  }
 }
 return result;
}
