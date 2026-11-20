import {RAGNAROK_NATURE_EXPANSION} from './ragnarok-nature-expansion.js';
import {RAGNAROK_DARK_EXPANSION} from './ragnarok-dark-expansion.js';
import {RAGNAROK_MVPS} from './ragnarok-mvp-catalog.js';

export const RAGNAROK_EXPANSION=Object.freeze([...RAGNAROK_NATURE_EXPANSION,...RAGNAROK_DARK_EXPANSION,...RAGNAROK_MVPS]);
export const RAGNAROK_COMMON_EXPANSION=Object.freeze([...RAGNAROK_NATURE_EXPANSION,...RAGNAROK_DARK_EXPANSION]);
export const MVP_BY_KEY=Object.freeze(Object.fromEntries(RAGNAROK_MVPS.map(m=>[m.key,m])));
export function mvpDefinition(key){return typeof key==='string'&&Object.hasOwn(MVP_BY_KEY,key)?MVP_BY_KEY[key]:null;}
export function mvpForBiome(biome,index=0){const pool=RAGNAROK_MVPS.filter(m=>m.biomes.includes(biome)),list=pool.length?pool:RAGNAROK_MVPS;return list[((Math.floor(Number.isFinite(index)?index:0)%list.length)+list.length)%list.length];}
export const expansionForBiome=biome=>RAGNAROK_COMMON_EXPANSION.filter(m=>m.biomes.includes(biome)).map(m=>m.key);

// Reuse local combat budgets; adding species does not increase wave counts,
// spawn frequency, simultaneous telegraphs or the enemy cap.
const roles={
 swarm:{hpMultiplier:.85,damageMultiplier:.75,size:.8,moveSpeed:3.2,attackInterval:1.6},
 skirmisher:{hpMultiplier:1,damageMultiplier:.85,size:1,moveSpeed:3.4,attackInterval:1.6},
 ranged:{hpMultiplier:.9,damageMultiplier:.7,size:1,moveSpeed:2.7,attackInterval:2,range:6.5},
 heavy:{hpMultiplier:1.3,damageMultiplier:.9,size:1.25,moveSpeed:2.4,attackInterval:1.9},
 caster:{hpMultiplier:.95,damageMultiplier:.7,size:1,moveSpeed:2.6,attackInterval:2,range:5},
 flyer:{hpMultiplier:.9,damageMultiplier:.65,size:.95,moveSpeed:3.6,attackInterval:1.9,range:4,flying:true,altitude:1.4}
};
export const EXPANDED_CUSTOM_HERO_BESTIARY=Object.freeze(Object.fromEntries(RAGNAROK_EXPANSION.map(m=>['ro_'+m.key,Object.freeze({accuracy:.88,evasion:.02,critChance:.02,critMultiplier:1.6,armorBonus:0,flying:false,altitude:0,...roles[m.role],name:m.name,description:m.description||`${m.name}: ${m.biomes.join(', ')}.`,ragnarokVisual:m.key,skill:m.skill,preferredDropSkill:m.skill,unlockWave:m.unlockWave,element:m.element||null,...(mvpDefinition(m.key)?{bossOnly:true,mythic:true,ragnarokMvp:m.key,hpMultiplier:1.3,damageMultiplier:.75,armorBonus:3,size:1.7}:{}),...(m.stationary?{moveSpeed:0}:{}),...(m.range?{range:m.range}:{})})])));
export const EXPANDED_SKILL_THEMES=Object.freeze(Object.fromEntries(RAGNAROK_EXPANSION.map(m=>['ro_'+m.key,Object.freeze([...new Set([m.skill,...(m.skills||[]),'endurance'])])])));

const behaviorFor=m=>({poison:'venom',venomcloud:'venom',warlockfire:'fireball',fireball:'fireball',flamebreath:'fireball',warlockfrost:'volley',multishot:'volley',bounce:'volley',stormdive:'swoop',hornrush:'charge',shockwave:'slam',stomp:'slam',stonehide:'shell',frostnova:'slime'}[m.skill]||({swarm:'skitter',heavy:'slam',ranged:'volley',caster:'volley',flyer:'swoop'}[m.role])||'charge');
export function expandedDungeonSpecies(base){const parents={swarm:'rat',skirmisher:'snake',ranged:'archer',heavy:'guardian',caster:'firemage',flyer:'cavebat'};return Object.fromEntries(RAGNAROK_EXPANSION.map(m=>{
 const boss=!!mvpDefinition(m.key),parent=base[parents[m.role]||'rat'],behavior=behaviorFor(m);
 return [m.key,Object.freeze({...parent,name:m.name,behavior,element:m.element||'physical',flying:m.role==='flyer',range:['volley','fireball'].includes(behavior)?10:1.4,projectile:behavior==='volley'?(m.element==='ice'?'frost':m.element==='poison'?'poison':'arrow'):null,speed:m.stationary?0:parent.speed,...(boss?{bossOnly:true,hp:2.7,damage:1.05,size:1.5,radius:.8,armor:4}:{}),...(mvpDefinition(m.key)?{ragnarokMvp:m.key}:{})})];
 }));}

// One authoritative warning describes both collision and rendering. Rings and
// cones follow their actual caster; circles mark the target's last position.
export function mvpWarning(unit,target,index,time,damage){
 const m=mvpDefinition(unit.ragnarokMvp||unit.ragnarokVisual);if(!m)return null;
 const template=m.patterns[((index%m.patterns.length)+m.patterns.length)%m.patterns.length],shape=template.shape;
 const distance=Math.hypot(target.x-unit.x,target.z-unit.z)||1,dx=(target.x-unit.x)/distance,dz=(target.z-unit.z)/distance;
 const origin=shape==='ring'||shape==='cone'?unit:shape==='line'?{x:(unit.x+target.x)/2,z:(unit.z+target.z)/2}:target;
 const radius=Math.min(7,Math.max(3,template.radius||5)),delay=Math.min(3,Math.max(1.8,template.delay||2.2)),element=template.element||m.element||'physical';
 return {shape,x:origin.x,z:origin.z,dx,dz,radius,inner:Math.min(radius-1,Math.max(1.5,template.inner||radius*.5)),angle:Math.min(Math.PI*.8,template.angle||Math.PI*.55),width:Math.min(4,Math.max(2,template.width||3)),length:Math.min(20,Math.max(8,template.length||distance+3)),element,damage,start:time,fireAt:time+delay,from:{x:unit.x,z:unit.z},targetPoint:{x:target.x,z:target.z},skill:element==='fire'?'fireball':element==='ice'||element==='lightning'||element==='holy'||element==='dark'?'volley':'slam',mvp:m.key,patternName:template.name||m.name};
}
