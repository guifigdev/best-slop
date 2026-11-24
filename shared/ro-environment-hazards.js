import {bonkBlocked} from './bonk-level.js';
import {roIcePatches} from './ro-ice-terrain.js';
import {roMerchantReachableCells} from './ro-secret-merchants.js';

// Optional local hazards, not claims about official Ragnarok terrain damage.
// The same immutable ellipses are supplied to the host and the ground renderer.
export const RO_ENVIRONMENT_HAZARD_RULES=Object.freeze({maxZones:3,interval:1,maxDt:.25,coldGrace:3});
const themes={
 alberta:['poison','Carga derramada',0x73966c,'poison',.02,.88],
 'turtle-island':['poison','Lagoa salobra',0x759765,'poison',.025,.8],
 amatsu:['dark','Selo amaldiçoado',0x927e9f,'dark',.025,.9],
 comodo:['poison','Poça da gruta',0x719c81,'poison',.02,.85],
 umbala:['poison','Brejo das raízes',0x769644,'poison',.025,.78],
 niflheim:['dark','Bruma dos mortos',0x94789e,'dark',.03,.86],
 prontera:['poison','Brejo venenoso',0x658f35,'poison',.02,.86],
 'payon-forest':['poison','Pântano venenoso',0x738536,'poison',.025,.84],
 'payon-cave':['poison','Lodo tóxico',0x697c43,'poison',.025,.86],
 morroc:['dust','Areia movediça',0xc8a66a,'earth',.02,.78],
 'morroc-pyramid':['dark','Areia amaldiçoada',0x8b6b66,'dark',.025,.87],
 rachel:['dust','Poeira sufocante',0xbca581,'earth',.02,.8],
 juno:['arcane','Resíduo arcano',0x8d8ad4,'arcane',.025,.9],
 'ice-cavern':['cold','Neve profunda',0xc8deed,'ice',.025,.65],
 'thor-volcano':['lava','Lava exposta',0xff7426,'fire',.035,.94],
 geffen:['arcane','Vazamento arcano',0x997ed1,'arcane',.025,.9],
 'glast-heim':['dark','Solo profanado',0x756781,'dark',.025,.86],
 valhalla:['arcane','Runa instável',0xc2b7eb,'holy',.025,.9],
 lutie:['cold','Neve profunda',0xd7e6ef,'ice',.025,.65],
 'toy-factory':['machinery','Esteira avariada',0xb58c5f,'earth',.025,.84],
 'clock-tower':['machinery','Engrenagens expostas',0xb99c58,'earth',.03,.84],
 'thanatos-tower':['dark','Névoa da agonia',0x80648f,'dark',.03,.86]
};
export const RO_ENVIRONMENT_THEMES=Object.freeze(Object.fromEntries(Object.entries(themes).map(([key,v])=>[key,Object.freeze({type:v[0],name:v[1],color:v[2],element:v[3],damageFraction:v[4],speedMultiplier:v[5],graceSeconds:v[0]==='cold'?3:1.2})])));
const empty=Object.freeze([]),cache=new WeakMap();
const hash=(seed,key)=>{let n=Number(seed)>>>0;for(const c of String(key))n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;n=Math.imul(n^(n>>>16),0x21f0aaad);return(n^(n>>>15))>>>0;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function segmentDistance(p,path){const a=path.from,b=path.to;if(!a||!b)return Infinity;const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export function roHazardContains(zone,x,z){if(!zone||!Number.isFinite(x)||!Number.isFinite(z))return false;const dx=x-zone.x,dz=z-zone.z,c=Math.cos(zone.angle||0),s=Math.sin(zone.angle||0);return ((dx*c+dz*s)/zone.rx)**2+((-dx*s+dz*c)/zone.rz)**2<=1;}
export function roHazardBoundary(zone,segments=64){const n=Math.max(8,Math.min(256,Math.floor(segments)||64)),c=Math.cos(zone.angle||0),s=Math.sin(zone.angle||0);return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,x=Math.cos(a)*zone.rx,z=Math.sin(a)*zone.rz;return{x:zone.x+x*c-z*s,z:zone.z+x*s+z*c};});}
function ellipsesSeparated(a,b,padding=1){
 if(distance(a,b)>Math.max(a.rx,a.rz)+Math.max(b.rx,b.rz)+padding)return true;
 // Accept only a proven separating axis: unlike sampled perimeter points this
 // cannot miss a small overlapping sliver between two rotated ellipses.
 for(let i=0;i<64;i++){const t=i*Math.PI/64,c=Math.cos(t),s=Math.sin(t),support=p=>Math.hypot(p.rx*Math.cos(t-(p.angle||0)),p.rz*Math.sin(t-(p.angle||0)));if(Math.abs((a.x-b.x)*c+(a.z-b.z)*s)>support(a)+support(b)+padding)return true;}return false;
}
export function roEnvironmentHazards(map){
 if(!map||map.tower)return empty;
 const key=map.route?.key,theme=RO_ENVIRONMENT_THEMES[key];if(!theme)return empty;
 const stamp=[map.seed,key].join(':'),prior=cache.get(map);if(prior?.stamp===stamp)return prior.zones;
 // Graph arrivals use the inner gate mouth. Some map templates retain an
 // older spawn on the closed gate wall, so flood from the clear central hub.
 const origin=map.route?.graph?map.route.bossArena:map.spawn,walkableMap=origin?{...map,spawn:origin}:map;
 const seed=hash(map.seed,key),candidates=roMerchantReachableCells(walkableMap).sort((a,b)=>hash(seed,a.x+':'+a.z)-hash(seed,b.x+':'+b.z)),zones=[],ice=theme.type==='cold'?roIcePatches(map):[];
 const safe=[map.spawn,map.route?.entry,map.route?.exit,...(map.route?.gates||[])].filter(Boolean),arena=map.route?.bossArena;
 for(const p of candidates){
  const n=hash(seed,p.x+','+p.z),rx=4+n%18/10,rz=3.2+(n>>>6)%16/10,r=Math.max(rx,rz),zone={id:'environment:'+key+':'+zones.length,type:theme.type,name:theme.name,element:theme.element,...p,rx,rz,angle:(n%6283)/1000,color:theme.color,graceSeconds:theme.graceSeconds,damageFraction:theme.damageFraction,speedMultiplier:theme.speedMultiplier};
  if(safe.some(q=>distance(p,q)<r+24)||arena&&distance(p,arena)<(arena.radius||28)+r+6)continue;
  if((map.paths||[]).some(path=>segmentDistance(p,path)<(path.width||12)*.5+r+5))continue;
  if((map.objects||[]).some(o=>distance(p,o)<r+(o.type==='secretMerchant'?12:6)))continue;
  if(zones.some(q=>distance(p,q)<r+Math.max(q.rx,q.rz)+12))continue;
  if((map.obstacles||[]).some(o=>o.alive!==false&&Math.abs(p.x-o.x)<o.w*.5+r+.8&&Math.abs(p.z-o.z)<o.d*.5+r+.8))continue;
  if(ice.some(q=>!ellipsesSeparated(zone,q)))continue;
  if(bonkBlocked(map,p,.8)||roHazardBoundary(zone,16).some(q=>bonkBlocked(map,q,.8)))continue;
  zones.push(Object.freeze(zone));if(zones.length===RO_ENVIRONMENT_HAZARD_RULES.maxZones)break;
 }
 const value=Object.freeze(zones);cache.set(map,{stamp,zones:value});return value;
}
export const RO_LAVA_CHANNEL_CELL_SIZE=3.6;
function lavaCellAt(x,z){const step=RO_LAVA_CHANNEL_CELL_SIZE;return{x:Math.floor(x/step+1e-9)*step,z:Math.floor(z/step+1e-9)*step};}
function onGroundPath(map,x,z){return(map.paths||[]).some(path=>{const from=path.from||{x:0,z:0},dx=path.to.x-from.x,dz=path.to.z-from.z,len=Math.hypot(dx,dz)||1,along=((x-from.x)*dx+(z-from.z)*dz)/len,side=Math.abs((x-from.x)*dz-(z-from.z)*dx)/len;return along>-5&&along<len+4&&side<(path.width||12)*.5+Math.sin(along*.08)*.8;});}
/** One quantized mask for existing orange ground tiles AND host damage. No flood,
 * RNG, scene mutation or ellipsoid approximation is involved in this lookup. */
export function roLavaChannelAt(map,x,z){
 if(!map||map.tower||map.stageKey!=='forge'||map.route&&map.route.key!=='thor-volcano'||!Number.isFinite(x)||!Number.isFinite(z))return false;
 const p=lavaCellAt(x,z),step=RO_LAVA_CHANNEL_CELL_SIZE,halfDiagonal=step/Math.sqrt(2),center={x:p.x+step*.5,z:p.z+step*.5};
 if(Math.abs(p.x)>27&&Math.abs(Math.sin(p.x*.055+Math.sin(p.z*.038)*1.4))<.105){
  // A whole rendered square is either lava or safe. Protect the full walking
  // corridor, rather than letting the far corner of an orange tile cut into it.
  if([[0,0],[step,0],[0,step],[step,step],[step*.5,step*.5]].some(([dx,dz])=>onGroundPath(map,p.x+dx,p.z+dz)))return false;
  if([map.spawn,map.route?.entry,map.route?.exit,...(map.route?.gates||[])].filter(Boolean).some(q=>distance(center,q)<20+halfDiagonal))return false;
  const arena=map.route?.bossArena;if(arena&&distance(center,arena)<(arena.radius||28)+4+halfDiagonal)return false;
  if((map.objects||[]).some(o=>distance(center,o)<(o.type==='secretMerchant'?12:4)+halfDiagonal))return false;
  return true;
 }
 return false;
}
export function roEnvironmentHazardAt(map,x,z){
 const zone=roEnvironmentHazards(map).find(zone=>roHazardContains(zone,x,z));if(zone)return zone;
 if(!roLavaChannelAt(map,x,z))return null;
 // These existing floor cells are already rendered by bonk-world, so the
 // synthetic contact is intentionally absent from environmentZones/art pools.
 return{id:'environment:thor-volcano:channel:'+map.seed,...RO_ENVIRONMENT_THEMES['thor-volcano'],name:'Rio de lava'};
}
const neutral=()=>({speedMultiplier:1,status:null});
export function roEnvironmentHazardSnapshot(unit){
 const e=unit?.roEnvironmentExposure;if(!e)return null;
 return{id:e.id,type:e.type,name:e.name,phase:e.exposure+1e-8>=e.graceSeconds?'active':'warning',exposure:e.exposure,graceSeconds:e.graceSeconds,secondsUntilDamage:Math.max(0,e.nextDamage-e.exposure),speedMultiplier:e.speedMultiplier};
}
export function tickRoEnvironmentHazards(game,unit,dt,{damage}={}){
 const b=game?.bonk;
 if(!unit?.bonkHero||!unit.alive||unit.bonkDisconnected||!b?.map||b.activity==='tower'||game.options?.mode!=='bonk'){if(unit)delete unit.roEnvironmentExposure;return neutral();}
 // Defensive pause guards also protect direct/server-side callers outside tickBonk.
 if(b.stage!=='playing'||game.paused||b.paused||unit.bonkOffer||b.offer)return{speedMultiplier:unit.roEnvironmentExposure?.speedMultiplier||1,status:roEnvironmentHazardSnapshot(unit)};
 const zone=roEnvironmentHazardAt(b.map,unit.x,unit.z);
 if(!zone){delete unit.roEnvironmentExposure;return neutral();}
 const mapKey=[b.map.seed,b.map.route?.key||''].join(':'),elapsed=Math.max(0,Math.min(RO_ENVIRONMENT_HAZARD_RULES.maxDt,Number.isFinite(dt)?dt:0));
 let e=unit.roEnvironmentExposure;
 if(!e||e.id!==zone.id||e.mapKey!==mapKey)e=unit.roEnvironmentExposure={id:zone.id,type:zone.type,name:zone.name,mapKey,exposure:0,graceSeconds:zone.graceSeconds,nextDamage:zone.graceSeconds,speedMultiplier:1};
 e.exposure+=elapsed;
 const active=e.exposure+1e-8>=zone.graceSeconds;
 e.speedMultiplier=active?(zone.type==='cold'?Math.max(zone.speedMultiplier,.9-Math.max(0,e.exposure-zone.graceSeconds)*.05):zone.speedMultiplier):1;
 if(active&&zone.type==='cold')unit.frostUntil=Math.max(unit.frostUntil||0,(game.time||0)+.3);
 // One bounded callback, never a catch-up burst after suspension or a large dt.
 if(active&&elapsed>0&&e.exposure+1e-8>=e.nextDamage){e.nextDamage=e.exposure+RO_ENVIRONMENT_HAZARD_RULES.interval;const hp=Number(unit.maxHp);if(Number.isFinite(hp)&&hp>0&&typeof damage==='function')damage(hp*zone.damageFraction,zone.element);}
 return{speedMultiplier:e.speedMultiplier,status:roEnvironmentHazardSnapshot(unit)};
}
