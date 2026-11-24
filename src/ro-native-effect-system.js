import {createRoNativeStrArt} from './ro-native-str-art.js';
import {createRoNativePrimitiveArt,roNativePrimitiveAreaScale} from './ro-native-primitive-art.js';
import {RO_NATIVE_EFFECT_ASSETS,RO_NATIVE_EFFECT_MANIFEST} from './ro-native-effect-assets.js';
import {RO_NATIVE_PRIMITIVE_ASSETS,RO_NATIVE_PRIMITIVE_MANIFEST} from './ro-native-primitive-assets.js';
import {roNativeEventRequests,roNativeRequestsForState} from '../shared/ro-native-effect-policy.js';
import {roNativeLegacyState,roNativePrefetchKeys,roNativePrefetchFiles,roNativeBuffDeadlines} from './ro-native-effect-routing.js';

const primitiveTypes=['2D','3D','CYLINDER','QuadHorn'];
export function createRoNativeEffectSystem({scene,strFactory=createRoNativeStrArt,primitiveFactory=createRoNativePrimitiveArt,replaceGroundZone=()=>false}={}){
 let context=null,warmKey='',primitiveZones=new Set();
 const active=()=>context?.options?.mode==='bonk';
 const primitiveOptions={types:primitiveTypes,hasAsset:row=>!!RO_NATIVE_PRIMITIVE_MANIFEST.parts[row.primitiveId]};
 const requests=(event,unit,primitive=false)=>{
  if(!active())return[];
  const result=roNativeEventRequests(event,unit,primitive?RO_NATIVE_PRIMITIVE_MANIFEST:RO_NATIVE_EFFECT_MANIFEST,{state:context,...(primitive?primitiveOptions:{})});
  return primitive?result.map(r=>({...r,scale:roNativePrimitiveAreaScale(r.part,event,{baseScale:r.scale}),conformGround:true})):roNativeBuffDeadlines(result,unit,context,RO_NATIVE_EFFECT_ASSETS);
 };
 const zoneRequests=(state,primitive=false)=>state?.options?.mode==='bonk'?roNativeRequestsForState(state,primitive?RO_NATIVE_PRIMITIVE_MANIFEST:RO_NATIVE_EFFECT_MANIFEST,primitive?primitiveOptions:{}).filter(r=>{const zone=(state.bonk?.roSkillZones||[]).find(z=>z.id===r.zoneId);return !zone||zone.key!=='mg_firewall'||!replaceGroundZone(zone,state);}):[];
 const str=strFactory({scene,assets:RO_NATIVE_EFFECT_ASSETS,requestsForEvent:(e,u)=>requests(e,u),requestsForState:state=>zoneRequests(state)});
 const primitive=primitiveFactory({scene,manifest:RO_NATIVE_PRIMITIVE_MANIFEST,assets:RO_NATIVE_PRIMITIVE_ASSETS,requestsForEvent:(e,u)=>requests(e,u,true),requestsForState:state=>zoneRequests(state,true)});
 const api={
  prepare(state,time=state?.time||0){
   context=state;primitiveZones=new Set();
   const files=roNativePrefetchFiles(state,RO_NATIVE_EFFECT_MANIFEST),parts=new Set();
   for(const key of roNativePrefetchKeys(state))for(const rows of Object.values(RO_NATIVE_PRIMITIVE_MANIFEST.skills[key]?.phases||{}))for(const row of rows)if(RO_NATIVE_PRIMITIVE_MANIFEST.parts[row.primitiveId])parts.add(row.primitiveId);
   const signature=JSON.stringify([files,[...parts]]);if(signature!==warmKey){warmKey=signature;void str.preload(files);void primitive.preload([...parts]);}
   for(const zone of state?.bonk?.roSkillZones||[])if(zone.key==='mg_firewall'&&replaceGroundZone(zone,state))str.cancelZone?.(zone.id);
   str.prepare(state,time);primitive.prepare(state,time);
   const groups=new Map();for(const request of zoneRequests(state,true)){const list=groups.get(request.zoneId)||[];list.push(request);groups.set(request.zoneId,list);}
   for(const [id,list]of groups)if(list.every(r=>primitive.isReady(r.primitiveId||r.file))&&list.map(r=>primitive.handlesRequest(r)).every(Boolean))primitiveZones.add(id);
  },
  handles(event,unit){if(!active())return false;const a=str.handles(event,unit),b=primitive.handles(event,unit);return a||b;},
  handlesZone:id=>str.handlesZone(id)||primitiveZones.has(id),
  legacyState(state){return roNativeLegacyState(state,api,{preserveAttackTrail:(event,unit)=>requests(event,unit).concat(requests(event,unit,true)).some(r=>r.preserveAttackTrail)});},
  update(state,time,heightAt,camera){context=state;str.update(state,time,heightAt,camera);primitive.update(state,time,heightAt,camera);},
  stats:()=>({str:str.stats(),primitives:primitive.stats()}),
  reset(){str.reset();primitive.reset();context=null;warmKey='';primitiveZones.clear();},
  dispose(){str.dispose();primitive.dispose();context=null;primitiveZones.clear();}
 };
 return api;
}
