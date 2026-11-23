import {roSkillSlots} from '../shared/ro-skill-loadout.js';

export function roNativeBuffDeadlines(requests,unit,state,assets){
 return requests.map(request=>{
  if(request.loop||Number.isFinite(request.until))return request;
  const buff=unit?.roSkillBuffs?.find(buff=>buff.key===request.skillKey&&buff.until>(state?.bonk?.elapsed||0));
  if(!buff)return request;
  const until=(state.time||0)-(state.bonk?.elapsed||0)+buff.until;
  return assets[request.file]?.duration>until-request.time?{...request,until}:request;
 });
}

// Warm equipped abilities and the visible upgrade choices. Animation data
// stays out of the initial JavaScript bundle; casts use local packaged assets.
export function roNativePrefetchKeys(state){
 if(state?.options?.mode!=='bonk')return[];
 const keys=new Set();
 for(const unit of state.units||[])if(unit.bonkHero){
  for(const key of roSkillSlots(unit))if(key&&key!=='basic')keys.add(key);
  for(const offer of unit.bonkOffer?.choices||[])if(offer.kind==='weapon'&&offer.key!=='basic')keys.add(offer.key);
 }
 for(const offer of state.bonk?.offer?.choices||[])if(offer.kind==='weapon'&&offer.key!=='basic')keys.add(offer.key);
 return[...keys];
}
export function roNativePrefetchFiles(state,manifest){
 if(state?.options?.mode!=='bonk')return[];
 const files=new Set();
 for(const key of roNativePrefetchKeys(state)){
   for(const rows of Object.values(manifest?.skills?.[key]?.phases||{}))for(const row of rows){
    if(row.type==='STR'&&manifest.effects?.[row.file])files.add(row.file);
   }
 }
 return[...files];
}

// Filter cosmetic fallbacks only after the native renderer has reserved a
// complete ready effect. Enemy danger masks and authoritative combat are kept.
export function roNativeLegacyState(state,native,{preserveAttackTrail=()=>false}={}){
 if(state?.options?.mode!=='bonk'||!native)return state;
 const units=new Map((state.units||[]).map(unit=>[unit.id,unit]));
 const zones=state.bonk?.roSkillZones||[],handledZones=zones.filter(zone=>native.handlesZone?.(zone.id));
 const nativeAreas=(state.effects||[]).filter(event=>event.bonk&&event.type==='roAttack'&&['pulse','orbit'].includes(event.attackKind)&&native.handles(event,units.get(event.source)));
 const effects=(state.effects||[]).filter(event=>{
  if(!event.bonk||['bossDanger','bossImpact'].includes(event.type))return true;
  if(native.handles(event,units.get(event.source)))return preserveAttackTrail(event,units.get(event.source));
  if(event.type==='abilityPulse'&&nativeAreas.some(cast=>cast.skillKey===event.skillKey&&cast.source===event.source&&Math.abs(cast.time-event.time)<.06))return false;
  if(event.type==='abilityPulse'&&event.skillKey&&handledZones.some(zone=>zone.key===event.skillKey&&Math.hypot(zone.x-event.x,zone.z-event.z)<2))return false;
  return true;
 });
 if(effects.length===(state.effects||[]).length&&!handledZones.length)return state;
 return{...state,effects,...(handledZones.length?{bonk:{...state.bonk,roSkillZones:zones.filter(zone=>!native.handlesZone(zone.id))}}:{})};
}
