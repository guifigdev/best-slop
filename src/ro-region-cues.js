import {RO_WORLD_ROUTE} from '../shared/ro-world-route.js';
import {MVP_BY_KEY} from '../shared/ragnarok-expansion.js';
import {escapeHTML as esc} from './competition-ui.js';

const direction=gate=>gate.direction?.x>0?'Leste':gate.direction?.x<0?'Oeste':gate.direction?.z>0?'Sul':'Norte';
export function roGateContext(data,hero,{range=36}={}){
 if(!data?.route||!hero)return null;
 const candidates=(data.exitGates||[data.exitGate]).filter(g=>g&&Number.isFinite(g.x)&&Number.isFinite(g.z)).map(g=>({...g,distance:Math.hypot(g.x-(hero.x||0),g.z-(hero.z||0))})).sort((a,b)=>a.distance-b.distance||String(a.id).localeCompare(String(b.id))),gate=candidates[0];
 if(!gate||gate.distance>range)return null;
 const boss=MVP_BY_KEY[gate.mvp||data.route.mvp]?.name||'MVP guardião',missing=Math.max(0,RO_WORLD_ROUTE.length-1-(data.clearedStages||[]).filter(key=>key!=='valhalla').length),pendingCount=gate.open?hero.roUnclaimed?.length||0:0;
 return {...gate,directionName:direction(gate),distance:Math.round(gate.distance),state:gate.open?'open':'locked',pendingCount,requirement:gate.open?'Atravesse a passagem para viajar.'+(pendingCount?' Seus '+pendingCount+' espólios pendentes serão preservados.':''):gate.lockedBy==='final'?`Derrote os outros ${RO_WORLD_ROUTE.length-1} MVPs. Faltam ${missing} ${missing===1?'selo':'selos'}.`:`Derrote ${boss} para abrir a passagem.`};
}
export function roGateContextMarkup(context){return context?`<aside class="ro-gate-cue ro-gate-${context.state}" aria-label="Destino da passagem" data-ro-gate-cue="${esc(context.id||context.nextKey)}"><small>${context.directionName} · ${context.distance} m · ${context.state==='open'?'Passagem aberta':'Passagem selada'}</small><h2>${esc(context.nextName||'Próxima região')}</h2><p>${esc(context.requirement)}</p></aside>`:'';}

export function createRoRegionAnnouncement({duration=3.6}={}){
 let key=null,enteredAt=0;
 return {update(data){
  const region=data?.route,time=data?.elapsed;if(!region?.key||!Number.isFinite(time)||!['playing','levelup'].includes(data.stage))return null;
  if(key!==region.key){key=region.key;enteredAt=time;}
  const age=Math.max(0,time-enteredAt);if(age>=duration)return null;
  const opacity=Math.min(1,age/.22,(duration-age)/.6);
  return {key,name:region.name,habitat:data.encounter?.habitatName||'',age,duration,opacity:Math.max(0,opacity)};
 },reset(){key=null;enteredAt=0;}};
}
export function roRegionAnnouncementMarkup(entry){return entry?`<section class="ro-region-arrival" data-ro-region-announcement="${esc(entry.key)}" role="status" aria-live="polite" aria-atomic="true" style="opacity:${entry.opacity.toFixed(3)}"><small>${esc(entry.habitat||'MIDGARD')}</small><h2>${esc(entry.name)}</h2><i aria-hidden="true"></i></section>`:'';}
