import {syncRoMount,roMountedKind} from './ro-mounts.js';
import {RO_COMPANION_SKILLS,RO_COMPANION_MASTERY} from './ro-companion-skills.js';
export const RO_COMPANION_LIMITS=Object.freeze({perHero:4,leash:24,attackTargets:3,moveStep:.3,dt:.25});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const valid=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const passable=(api,a,b)=>(!api.segment||api.segment(a,b))&&!api.blocked?.(b);
function home(unit,index){const angle=(Number.isFinite(unit.facing)?unit.facing:0)+Math.PI+index*1.7;return{x:unit.x+Math.sin(angle)*2.4,z:unit.z+Math.cos(angle)*2.4};}
function moveToward(pet,target,dt,speed,api){const d=dist(pet,target);let travel=Math.min(d,Math.max(0,Math.min(RO_COMPANION_LIMITS.dt,Number.isFinite(dt)?dt:0))*speed);pet.moving=false;if(d<.08)return;pet.facing=Math.atan2(target.x-pet.x,target.z-pet.z);const dx=(target.x-pet.x)/d,dz=(target.z-pet.z)/d;while(travel>.001){const step=Math.min(RO_COMPANION_LIMITS.moveStep,travel),p={x:pet.x+dx*step,z:pet.z+dz*step};if(!passable(api,pet,p))break;Object.assign(pet,p);pet.moving=true;travel-=step;}}
/** Host-only state, serialized in the existing roSkillSummons snapshot. */
export function syncRoCompanions(game,unit,time,api={}){
 const b=game.bonk;if(!b)return;const learned=unit.bonkBuild?.weapons||{};
 b.roSkillSummons=(b.roSkillSummons||[]).filter(p=>!p.persistent||game.units.some(u=>u.id===p.source&&u.alive&&u.bonkBuild?.weapons?.[p.key]>0));
 if(!unit.alive)return;syncRoMount(unit);
 let index=0;const species=new Set();for(const [key,weapon]of Object.entries(RO_COMPANION_SKILLS)){
  const level=Math.min(8,Math.max(0,Math.floor(learned[key]||0)));if(!level||species.has(weapon.mechanics.companion))continue;species.add(weapon.mechanics.companion);
  let pet=b.roSkillSummons.find(p=>p.source===unit.id&&p.key===key&&p.persistent);
  if(!pet){if(b.roSkillSummons.filter(p=>p.source===unit.id).length>=6){const transient=b.roSkillSummons.findIndex(p=>p.source===unit.id&&!p.persistent);if(transient<0)continue;b.roSkillSummons.splice(transient,1);}let position=home(unit,index);if(!passable(api,unit,position))position={x:unit.x,z:unit.z};pet={id:game.id?.()||`companion:${unit.id}:${key}`,key,source:unit.id,x:position.x,z:position.z,at:time,attackAt:-100,persistent:true,companion:weapon.mechanics.companion,facing:unit.facing||0};b.roSkillSummons.push(pet);}
  let bonus=1;for(const [mastery,m]of Object.entries(RO_COMPANION_MASTERY))if(m.companion===pet.companion)bonus+=Math.min(8,Math.max(0,learned[mastery]||0))*m.perLevel;
  Object.assign(pet,{weapon,level,range:weapon.range,radius:weapon.mechanics.radius,interval:weapon.mechanics.interval,damage:weapon.damage*(1+(level-1)*.12)*bonus,until:time+3600,homeIndex:index++});
 }
}
export function tickRoCompanions(game,unit,dt,time,api={}){
 const pets=(game.bonk?.roSkillSummons||[]).filter(p=>p.persistent&&p.source===unit.id).slice(0,RO_COMPANION_LIMITS.perHero);
 for(const pet of pets){
  if(!valid(pet)||dist(pet,unit)>RO_COMPANION_LIMITS.leash){let position=home(unit,pet.homeIndex);if(!passable(api,unit,position))position={x:unit.x,z:unit.z};Object.assign(pet,position);}
  const targets=game.bonk.stage==='playing'?(api.nearby?.(unit,pet.range)||(game.units||[]).filter(e=>e.bonkEnemy&&e.alive&&dist(e,unit)<=pet.range)):[];
  const target=targets.filter(e=>e.alive&&e.bonkEnemy&&dist(e,unit)<=pet.range&&passable(api,pet,e)).sort((a,b)=>dist(pet,a)-dist(pet,b)||String(a.id).localeCompare(String(b.id)))[0];
  pet.target=target?.id||null;
  const mounted=roMountedKind(unit)===pet.companion;pet.mounted=mounted;
  const destination=target&&dist(pet,target)>1.5?target:target?pet:home(unit,pet.homeIndex);
  if(mounted)Object.assign(pet,{x:unit.x,z:unit.z,facing:unit.facing||0,moving:!!unit.moving});else moveToward(pet,destination,dt,pet.companion==='falcon'?12:9,api);
  if(!target||dist(pet,target)>pet.radius+1||pet.at>time)continue;
  pet.at=time+pet.interval;pet.attackAt=time;if(!mounted)pet.facing=Math.atan2(target.x-pet.x,target.z-pet.z);
  const victims=(api.nearby?.(target,pet.radius)||targets.filter(e=>dist(e,target)<=pet.radius)).filter(e=>e.alive&&e.bonkEnemy&&passable(api,pet,e)).slice(0,RO_COMPANION_LIMITS.attackTargets);
  for(const enemy of victims)api.damage?.(enemy,pet.damage,'physical',false);
  // The creature's animated bite/rasant is the VFX. Never a generic spell ring.
 }
}
