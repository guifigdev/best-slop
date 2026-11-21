import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {MONSTERS,MONSTER_SKILL_THEMES,monsterLoadout} from '../shared/monsters.js';
import {spawnDungeonSpecies,tickDungeonEncounters} from '../shared/dungeon-encounters.js';
import {BONK_ENEMY_ABILITIES} from '../shared/bonk.js';
import {LINE_UNITS} from '../shared/line-units.js';
import {createMonsterAbilityArt,monsterAbilityArtHandles,MONSTER_ABILITY_ART_BUDGET as B} from '../src/monster-ability-art.js';

test('generated enemies retain anatomy and elemental identity across ordinary and boss variants',()=>{
 for(const kind of Object.keys(MONSTERS))for(const level of [1,20,60])for(const roll of [0,.21,.56,.99]){const loadout=monsterLoadout(kind,level,'boss',()=>roll);assert.equal(loadout.skills[0],MONSTERS[kind].skill);assert.ok(loadout.skills.every(s=>MONSTER_SKILL_THEMES[kind].includes(s)));assert.equal(new Set(loadout.skills).size,loadout.skills.length);}
 for(const roll of [0,.4,.99]){const dragon=monsterLoadout('dragon',60,'boss',()=>roll);assert.ok(!dragon.skills.some(k=>/frost|ice|poison|venom|blizzard/i.test(k)));const frost=monsterLoadout('frostwyrm',60,'boss',()=>roll);assert.ok(!frost.skills.some(k=>/fire|flame/i.test(k)));}
 assert.equal(BONK_ENEMY_ABILITIES.spider.skill,'web');assert.equal(BONK_ENEMY_ABILITIES.snake.element,'poison');assert.equal(BONK_ENEMY_ABILITIES.archer.skill,'volley');assert.equal(BONK_ENEMY_ABILITIES.firemage.element,'fire');assert.equal(LINE_UNITS.cryptbasilisk.element,'poison');assert.deepEqual(LINE_UNITS.cryptbasilisk.skills,['poison']);
});

test('a real spider has distinct warning/impact IDs, hits once and actually leaves silk control on the victim',()=>{
 const g=new Game(51,{mode:'dungeon'});g.addPlayer('p','knight');g.command('p',{type:'dgReady'});const p=g.player('p'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.units=[p];g.dungeon.map.hazards=[];g.dungeon.rooms[1].status='combat';g.dungeon.rooms[1].pending=0;const spider=spawnDungeonSpecies(g,room,'spider',{x:p.x-8,z:p.z});spider.dungeonAbilityAt=0;const hooks={roomAt:()=>1,free:p=>p,extra:()=>null};g.time=.1;tickDungeonEncounters(g,.1,hooks);const warning=g.dungeon.telegraphs[0];assert.equal(warning.skill,'web');const tell=g.effects.find(e=>e.type==='bossDanger');assert.equal(tell.warningId,warning.id);g.time=warning.fireAt+.01;const hp=p.hp;tickDungeonEncounters(g,.1,hooks);const impact=g.effects.find(e=>e.type==='bossImpact');assert.ok(p.hp<hp);assert.ok(p.webbedUntil>g.time);assert.ok(p.abilitySlowUntil>g.time);assert.notEqual(tell.id,impact.id);assert.equal(impact.warningId,tell.warningId);const after=p.hp;tickDungeonEncounters(g,.1,hooks);assert.equal(p.hp,after);
});

test('Bonk spider silk slows movement and a serpent spreads its existing special damage over poison ticks',()=>{
 function encounter(species){const g=new Game(7,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const p=g.player('p');p.x=p.z=0;g.bonk.spawnAt=Infinity;g.bonk.objectives.forEach(o=>o.started=true);const enemy={id:g.id(),name:species,bonkEnemy:true,bonkElite:true,dungeonSpecies:species,alive:true,team:100,x:9,z:0,hp:9999,maxHp:9999,damage:9,speed:0,interval:1.3,bonkNextAttack:Infinity,bonkNextSpecial:0,bonkJumpHeight:0,size:1,collisionRadius:.4};g.units=[p,enemy];g.tick(.05);const warning=g.bonk.warnings[0];assert.ok(warning);while(g.bonk.elapsed<warning.fireAt+.05)g.tick(.05);return{g,p,enemy,warning};}
 const web=encounter('spider');assert.equal(web.warning.skill,'web');assert.ok(web.p.webbedUntil>web.g.time);const start=web.p.z;for(let i=0;i<5;i++){web.g.command('p',{type:'bkMove',dx:0,dz:1});web.g.tick(.1);}assert.ok(web.p.z-start<8.5*.5*.65,'silk changes authoritative movement rather than only drawing an icon');
 const venom=encounter('snake');assert.equal(venom.warning.element,'poison');const initial=venom.p.maxHp,immediate=initial-venom.p.hp;assert.ok(immediate>0);while(venom.g.bonk.elapsed<5)venom.g.tick(.05);const expected=venom.warning.damage/(1+venom.p.armor*.07);assert.ok(Math.abs((initial-venom.p.hp)-expected)<2,'poison redistributes the existing hit budget instead of adding damage');assert.ok(initial-venom.p.hp>immediate*2);
});

const event=(skill,type='bossImpact',id=1)=>({id,type,time:0,dungeon:true,skill,x:4,z:6,radius:3.2,shape:'circle',duration:3,from:{x:0,z:0},targetPoint:{x:4,z:6},source:2,warningId:99});
test('Bonk realm travel clears enemy control and poison when the local clock resets',()=>{
 const g=new Game(7,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const p=g.player('p');Object.assign(p,{bonkWebUntil:104,webbedUntil:104,bonkPoisonUntil:105,bonkPoisonTicks:3,bonkPoisonAt:103,bonkPoisonDamage:9});g.bonk.elapsed=102;g.bonk.stage='cleared';g.bonk.clearedStages=['grove'];assert.ok(g.command('p',{type:'bkNext',stageKey:'forge'}));for(const key of ['bonkWebUntil','webbedUntil','bonkPoisonUntil','bonkPoisonTicks','bonkPoisonAt','bonkPoisonDamage'])assert.equal(p[key],0,key);
});
test('webs are radial silk geometry while venom, arrows, flame and burrowing have distinct bounded visual silhouettes',()=>{
 const scene=new T.Scene(),art=createMonsterAbilityArt({scene}),signatures=new Set();try{for(const [i,skill]of ['web','venom','volley','fireball','burrow','slime','swoop','charge','slam','brood'].entries()){const state={options:{mode:'dungeon'},time:.3,dungeon:{map:{seed:i},telegraphs:[]},units:[],effects:[event(skill)]},before=JSON.stringify(state);art.update(state,.3,()=>2);assert.equal(JSON.stringify(state),before);const stats=art.stats();assert.ok(stats.threads+stats.solids+stats.glow>0,skill);if(skill==='web'){assert.ok(stats.threads>=60);assert.equal(stats.solids,0);}signatures.add(JSON.stringify([...art.root.children[0].instanceMatrix.array.slice(0,Math.min(128,stats.threads*16)),stats.solids,stats.glow]));for(const mesh of art.root.children){assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok([...mesh.instanceMatrix.array.slice(0,mesh.count*16)].every(Number.isFinite));}}
 assert.ok(signatures.size>=8);assert.equal(monsterAbilityArtHandles(event('web')),true);assert.equal(monsterAbilityArtHandles({...event('web'),dungeon:false,bonk:false}),false);
 }finally{art.dispose();art.dispose();}assert.equal(scene.children.length,0);
});

test('species visuals reuse three batches, respect interrupted tells and expire without leaking across rooms or runs',()=>{
 const scene=new T.Scene(),art=createMonsterAbilityArt({scene});try{const events=Array.from({length:180},(_,i)=>event(i%2?'web':'venom','bossImpact',i)),state={options:{mode:'dungeon'},dungeon:{map:{seed:44},telegraphs:[]},units:[],effects:events};art.update(state,.2);const meshes=[...art.root.children];assert.equal(meshes.length,3);assert.equal(art.stats().events,B.events);for(let i=1;i<=40;i++)art.update(state,i*.02);assert.deepEqual(art.root.children,meshes);assert.ok(art.stats().threads<=B.threads&&art.stats().solids<=B.solids&&art.stats().glow<=B.glow);art.update({...state,effects:[]},5);assert.equal(art.stats().events,0);assert.equal(meshes.reduce((n,m)=>n+m.count,0),0);art.update({...state,effects:[event('web','bossDanger')]},.2);assert.equal(art.stats().events,0,'a removed authoritative telegraph cannot continue animating');art.update({...state,dungeon:{map:{seed:45},telegraphs:[]},effects:[]},.4);assert.equal(art.stats().events,0);}finally{art.dispose();}
});
