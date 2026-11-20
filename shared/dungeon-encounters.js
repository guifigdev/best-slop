import {DUNGEON_SPECIES as SPECIES} from './dungeon-catalog.js';
import {insideBossPattern} from './boss-patterns.js';
import {unitSegmentClear} from './unit-collision.js';
import {moveUnit} from './field.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),inside=(p,h)=>Math.abs(p.x-h.x)<=h.w/2&&Math.abs(p.z-h.z)<=h.d/2;

export function spawnDungeonSpecies(g,room,key,point,{boss=false,extra=false}={}){
 const s=SPECIES[key]||SPECIES.rat,floor=g.dungeon.floor,party=1+Math.max(0,(g.dungeon.partySize||1)-1)*.2;
 const hp=Math.round((boss?(3500+floor*260)*(1+(floor-1)*.015)*Math.max(1,s.hp/3):(230+floor*12)*(1+floor*.015)*s.hp)*party),damage=(boss?48+floor*3:22+floor*1.6)*s.damage;
 const u=g.spawnEnemy('dungeon-'+key,point.x,point.z,{name:s.name,dungeonEnemy:true,dungeonSpecies:key,dungeonBehavior:s.behavior,dungeonProjectile:s.projectile||null,dungeonRoom:room.id,dungeonFloor:floor,dungeonExtra:extra,team:100,hp,damage,armor:(s.armor||0)+Math.floor(floor/5),range:s.range||1.25,size:s.size*(boss?1.45:1),collisionRadius:s.radius*(boss?1.25:1),flying:!!s.flying,altitude:s.flying?2.3:0,element:s.element||null,skills:[],boss:false,level:floor,acquireRange:60,cd:1.2+(g.units.length%5)*.23});
 u.monsterBase=Object.freeze({...u.monsterBase,hp,damage,armor:(s.armor||0)+Math.floor(floor/5),speed:s.speed,interval:s.interval,accuracy:.94,evasion:0,critChance:0,critMultiplier:1.5,magicPower:1});g.refresh(u);u.hp=u.maxHp;u.dungeonBoss=boss;u.dungeonElite=boss||s.hp>=2;u.dungeonAbilityAt=g.time+3.5+(u.id%7)*.7;u.order='auto';return u;
}
export function dungeonHazardPhase(h,time){if(h.type==='ice'||h.type==='pit')return{phase:'active',active:true};const phase=((time+(h.offset||0))%h.period+h.period)%h.period;return phase<h.telegraphSeconds?{phase:'warning',active:false}:phase<h.telegraphSeconds+1.35?{phase:'active',active:true}:{phase:'safe',active:false};}
export function dungeonIceAt(g,u){return !u.flying&&!!g.dungeon?.map?.hazards?.some(h=>h.type==='ice'&&inside(u,h));}

function queue(g,u,skill,target){
 const d=g.dungeon,dx=target.x-u.x,dz=target.z-u.z,length=Math.hypot(dx,dz)||1,dir={x:dx/length,z:dz/length},windup=u.dungeonBoss?2:u.dungeonElite?1.75:skill==='burrow'?1.7:1.5;
 const line=['charge','swoop','volley'].includes(skill),warning={id:g.id(),source:u.id,room:u.dungeonRoom,skill,shape:line?'line':'circle',x:line?(u.x+target.x)/2:target.x,z:line?(u.z+target.z)/2:target.z,dx:dir.x,dz:dir.z,radius:['slam','brood'].includes(skill)?4.5:skill==='burrow'?3.8:skill==='web'?3.2:2.8,width:skill==='volley'?2:3,length:Math.min(22,length+3),element:['fireball'].includes(skill)?'fire':skill==='venom'?'poison':skill==='slime'?'ice':'physical',damage:u.damage*(u.dungeonBoss?5.2:u.dungeonElite?4.6:3.6),start:g.time,fireAt:g.time+windup,wave:g.wave,from:{x:u.x,z:u.z},targetPoint:{x:target.x,z:target.z}};
 d.telegraphs.push(warning);u.dungeonCasting=warning.id;u.cd=Math.max(u.cd,windup+.4);u.order='stop';u.destination=null;if(skill==='burrow'){u.dungeonBurrowed=true;u.noCollision=true;u.dungeonBurrowUntil=warning.fireAt;}
 const {id:warningId,...visual}=warning;g.fx('bossDanger',warning.x,warning.z,{...visual,warningId,duration:windup,dungeon:true});return warning;
}
function hitWarning(g,w,source,hooks){
 source.dungeonBurrowed=false;source.noCollision=false;source.dungeonCasting=null;source.order='auto';
 for(const target of g.units.filter(t=>t.alive&&g.dungeonCanTarget(source,t)&&insideBossPattern(t,w))){if(!unitSegmentClear(g,{collisionRadius:.1},w.skill==='burrow'?w:w.from,target))continue;g.hit(target,w.damage,source,w.element!=='physical',false,false,false,w.element==='physical'?null:w.element);if(['web','slime'].includes(w.skill)){target.abilitySlowUntil=Math.max(target.abilitySlowUntil||0,g.time+3);target.abilitySlowAmount=.48;if(w.skill==='web')target.webbedUntil=g.time+3;}if(w.skill==='venom')g.applyDot(target,'poison',Math.max(2,w.damage*.13),4,source);}
 if(w.skill==='burrow'){const point=hooks.free(w.targetPoint,source.collisionRadius);if(point)Object.assign(source,point);}
 if(['charge','swoop'].includes(w.skill))moveUnit(g,source,w.targetPoint);
 if(w.skill==='brood')for(let i=0;i<3;i++)hooks.extra(source.dungeonRoom,'spider',{x:source.x+(i-1)*2,z:source.z+2});
 const {id:warningId,...visual}=w;g.fx('bossImpact',w.x,w.z,{...visual,warningId,duration:['web','slime'].includes(w.skill)?3:.7,dungeon:true});
}
export function tickDungeonEncounters(g,dt,hooks){
 const d=g.dungeon;d.telegraphs||=[];d.hazardCycles||={};
 for(const w of [...d.telegraphs]){const source=g.units.find(u=>u.id===w.source);if(!source?.alive||source.stun>0){if(source){source.dungeonCasting=null;source.dungeonBurrowed=false;source.noCollision=false;source.order='auto';}d.telegraphs=d.telegraphs.filter(x=>x!==w);continue;}if(g.time>=w.fireAt){hitWarning(g,w,source,hooks);d.telegraphs=d.telegraphs.filter(x=>x!==w);}}
 for(const u of g.units.filter(u=>u.alive&&u.dungeonEnemy&&u.dungeonSpecies&&!u.dungeonCasting&&u.stun<=0)){
  const target=g.heroes().filter(t=>t.alive&&hooks.roomAt(t)===u.dungeonRoom).sort((a,b)=>distance(a,u)-distance(b,u))[0];if(!target)continue;
  if(['volley','fireball'].includes(u.dungeonBehavior)&&distance(u,target)<5){const dx=u.x-target.x,dz=u.z-target.z,n=Math.hypot(dx,dz)||1;const room=d.map.rooms[u.dungeonRoom];u.destination={x:Math.max(room.x-room.w/2+2,Math.min(room.x+room.w/2-2,u.x+dx/n*3)),z:Math.max(room.z-room.d/2+2,Math.min(room.z+room.d/2-2,u.z+dz/n*3))};u.order='move';}else if(u.order==='move'){u.order='auto';u.destination=null;}
  if(g.time<u.dungeonAbilityAt||!unitSegmentClear(g,u,u,target))continue;
  const tellLimit=(d.partySize||1)>1?2:1;if(d.telegraphs.filter(w=>w.room===u.dungeonRoom).length>=tellLimit||g.time<(d.nextTellAt||0))continue;
  u.dungeonAbilityAt=g.time+(u.dungeonBoss?7:u.dungeonElite?9:11)+(u.id%3)*.7;
  if(u.dungeonBehavior==='skitter'){u.destination={x:target.x+(u.id%2?2:-2),z:target.z};u.order='attackMove';continue;}
  if(u.dungeonBehavior==='shell'){u.shield=Math.max(u.shield||0,u.maxHp*.18);u.shieldUntil=g.time+2.5;g.fx('shield',u.x,u.z,{source:u.id,duration:2.5});continue;}
  const skill=u.dungeonBehavior==='burrow'&&((u.dungeonPatternIndex||0)%2===1)?'charge':u.dungeonBehavior;u.dungeonPatternIndex=(u.dungeonPatternIndex||0)+1;queue(g,u,skill,target);d.nextTellAt=g.time+(d.floor===1&&!u.dungeonElite&&!u.dungeonBoss?2.5:1.8);
 }
 for(const o of d.objects.filter(o=>o.type==='prop'&&o.propType==='eggNest'&&!o.used&&d.rooms[o.room]?.status==='combat'&&(o.spawned||0)<6))if(g.time>=(o.hatchAt??=g.time+5)){o.hatchAt=g.time+9;for(let i=0;i<2;i++)if(hooks.extra(o.room,'scarab',{x:o.x+(i?2:-2),z:o.z+1}))o.spawned=(o.spawned||0)+1;g.fx('summon',o.x,o.z,{source:o.id,radius:2});}
 for(const fire of d.objects.filter(o=>o.type==='campfire'&&!o.used)){fire.active=fire.fuel>0&&d.rooms[fire.room]?.status==='cleared';fire.suspendedReason=d.rooms[fire.room]?.status==='combat'?'O combate apagou a fogueira.':fire.fuel<=0?'A lenha acabou.':null;const patients=fire.active?g.heroes().filter(u=>u.alive&&u.hp<u.maxHp&&distance(u,fire)<=fire.radius&&unitSegmentClear(g,{collisionRadius:.1},u,{x:fire.x+(u.x-fire.x)/(distance(u,fire)||1)*.75,z:fire.z+(u.z-fire.z)/(distance(u,fire)||1)*.75})):[];fire.healing=patients.length>0;if(fire.healing){const seconds=Math.min(dt,fire.fuel);for(const u of patients)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*fire.healPerSecond*seconds);fire.fuel=Math.max(0,fire.fuel-seconds);if((fire.nextHealFx||0)<=g.time){fire.nextHealFx=g.time+1.2;g.fx('heal',fire.x,fire.z,{radius:fire.radius,amount:Math.round(patients[0].maxHp*fire.healPerSecond),dungeon:true});}}}
 for(const h of d.map.hazards){const state=dungeonHazardPhase(h,g.time),cycle=Math.floor((g.time+(h.offset||0))/h.period),near=g.heroes().some(u=>u.alive&&hooks.roomAt(u)===h.room);if(state.phase==='warning'&&near&&d.hazardCycles[h.id]!==cycle){d.hazardCycles[h.id]=cycle;g.fx('bossDanger',h.x,h.z,{warningId:h.id+'-'+cycle,room:h.room,shape:'line',dx:1,dz:0,length:h.w,width:h.d,radius:Math.max(h.w,h.d)/2,element:h.type==='embers'?'fire':'physical',duration:h.telegraphSeconds,dungeon:true});}
  for(const u of g.units.filter(u=>u.alive&&!u.flying&&(u.hero||u.summon)&&inside(u,h))){u.dungeonHazardHits||={};if((u.dungeonHazardHits[h.id]||0)>g.time||!state.active||h.type==='ice')continue;u.dungeonHazardHits[h.id]=g.time+(h.type==='pit'?2:.9);
   if(h.type==='pit'){const safe=u.dungeonLastSafe||d.map.rooms[h.room],point=hooks.free(safe,u.collisionRadius||.6)||safe;Object.assign(u,point);g.hit(u,u.maxHp*.12,null,true,false,false,true);u.destination=u.target=null;u.order='stop';u.stun=Math.max(u.stun||0,.55);u.dungeonFallingUntil=g.time+.55;g.fx('bossImpact',h.x,h.z,{shape:'circle',radius:2,element:'physical',target:u.id,dungeon:true});}
   else{g.hit(u,Math.max(h.damage||0,55+d.floor*5),null,h.type==='embers',false,false,false,h.type==='embers'?'fire':null);g.fx('bossImpact',h.x,h.z,{shape:'line',dx:1,dz:0,length:h.w,width:h.d,radius:Math.max(h.w,h.d)/2,element:h.type==='embers'?'fire':'physical',dungeon:true});}
  }
 }
 for(const u of g.heroes().filter(u=>u.alive))if(!d.map.hazards.some(h=>h.type==='pit'&&inside(u,h)))u.dungeonLastSafe={x:u.x,z:u.z};
}
