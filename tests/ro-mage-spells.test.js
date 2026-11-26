import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {advanceRoJob,RO_SKILLS} from '../shared/ragnarok-jobs.js';
import {bonkStats} from '../shared/bonk.js';
import {roSkillStatus} from '../shared/ro-skill-controls.js';
import {roHasSight,roIsHidden,roMageHitCount} from '../shared/ro-mage-spells.js';
import {roProjectileParts} from '../src/ro-projectile-art.js';
import {createRoMageSpellArt,roMageSpellParts,RO_MAGE_SPELL_BUDGET as B} from '../src/ro-mage-spell-art.js';
import {createRoNativeEffectSystem} from '../src/ro-native-effect-system.js';

function arena(key,rank=3){
 const g=new Game(717,{mode:'bonk',bonkLineage:'archmage'});g.addPlayer('p','mage');g.command('p',{type:'bkReady'});const u=g.player('p');advanceRoJob(u,1);u.level=99;u.roJobLevel=50;u.bonkBuild.weapons={basic:1,[key]:rank,mg_sight:1,wz_sightrasher:1};u.bonkSkillSlots=Object.keys(u.bonkBuild.weapons);u.bonkSkillAuto=Object.fromEntries(u.bonkSkillSlots.map(k=>[k,false]));u.mana=10000;u.bonkInvulnerableUntil=1000;
 Object.assign(g.bonk,{routeVersion:0,spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],bossUnlocked:false});g.bonk.map.obstacles=[];g.obstacles=[];u.x=u.z=0;
 const enemy=(id,x,z)=>({id,bonkEnemy:true,alive:true,x,z,team:100,hp:10000,maxHp:10000,damage:0,speed:0,size:.8,collisionRadius:.3,bonkNextAttack:Infinity,bonkNextSpecial:Infinity});const target=enemy(900,0,5);g.units=[u,target];return{g,u,target,enemy};
}
function steps(g,n){for(let i=0;i<n;i++)g.tick(.05);}
function launch(g,key){assert.ok(g.command('p',{type:'bkCast',key}),g.commandFailureReason);for(let i=0;i<120&&g.player('p').roCasting;i++)g.tick(.05);assert.equal(g.player('p').roCasting,undefined);}

for(const key of ['coldbolt','firebolt','mg_lightningbolt'])test(key+' falls vertically over its chosen target, hits once per rank and never hits an intervening bystander',()=>{
 const{g,u,target,enemy}=arena(key),bystander=enemy(901,0,2.5);bystander.hp=bystander.maxHp=1000;g.units.push(bystander);launch(g,key);assert.equal(target.hp,10000);const shots=g.bonk.projectiles;assert.equal(shots.length,3);assert.ok(shots.every(p=>p.roMageBolt&&p.targetId===target.id&&p.dx===0&&p.dz===0&&p.x===target.x&&p.z===target.z));const first=shots[0],height=first.height;steps(g,2);assert.ok(first.height<height);assert.equal(target.hp,10000);assert.equal(bystander.hp,1000);assert.ok(g.snapshotFor('p').bonk.projectiles.some(p=>p.roMageBolt&&p.height>1));const impacts=new Set();for(let i=0;i<16;i++){steps(g,1);for(const e of g.effects)if(e.type==='roSkillImpact'&&e.skillKey===key)impacts.add(e.id);}assert.equal(g.bonk.projectiles.length,0);assert.ok(target.hp<10000);assert.equal(bystander.hp,1000);assert.equal(g.effects.filter(e=>e.type==='damage'&&e.target===target.id&&e.hitGroup!=null).length,3);assert.equal(impacts.size,3);assert.equal(roMageHitCount(key,1),1);assert.equal(roMageHitCount(key,8),8);assert.ok(u.mana<10000);
});

test('Sight reveals nearby hidden monsters without damage; Supernova requires and consumes the actual active flame',()=>{
 const{g,u,target,enemy}=arena('mg_sight',1);target.z=2;target.hidden=true;const far=enemy(901,0,5);far.hidden=true;g.units.push(far);assert.ok(roIsHidden(target,0));const sp=u.mana;assert.equal(roSkillStatus(g,u,'wz_sightrasher',bonkStats(u)).reasonCode,'sight');assert.equal(g.command('p',{type:'bkCast',key:'wz_sightrasher'}),false);assert.equal(u.mana,sp);launch(g,'mg_sight');assert.ok(roHasSight(u,g.bonk.elapsed));steps(g,2);assert.equal(roIsHidden(target,g.bonk.elapsed),false);assert.ok(roIsHidden(far,g.bonk.elapsed));assert.equal(target.hp,10000);assert.equal(g.effects.filter(e=>e.type==='damage').length,0);steps(g,30);launch(g,'wz_sightrasher');assert.equal(roHasSight(u,g.bonk.elapsed),false);assert.ok(target.hp<10000);assert.equal(far.hp,10000);assert.equal(g.effects.some(e=>e.type==='abilityPulse'&&e.skillKey==='wz_sightrasher'),false);steps(g,8);assert.ok(roIsHidden(target,g.bonk.elapsed));
});

test('Napalm Beat bursts over the selected enemy in a compact area instead of shooting a horizontal projectile',()=>{
 const{g,target,enemy}=arena('mg_napalmbeat'),near=enemy(901,.8,5),far=enemy(902,3,5);g.units.push(near,far);launch(g,'mg_napalmbeat');assert.equal(g.bonk.projectiles.length,0);assert.ok(target.hp<10000);assert.ok(near.hp<10000);assert.equal(far.hp,10000);const burst=g.effects.find(e=>e.type==='roSkillImpact'&&e.skillKey==='mg_napalmbeat');assert.ok(burst);assert.equal(burst.radius,1);assert.equal(burst.x,target.x);assert.equal(burst.z,target.z);
});

test('mage silhouettes, spiritual clouds and persistent reveal flame use bounded 3D geometry without image planes',()=>{
 const shot={id:1,x:2,z:3,dx:0,dz:0,roMageBolt:true,skillKey:'coldbolt',height:7,element:'ice'},parts=roProjectileParts(shot,1);assert.equal(parts.length,8);assert.ok(parts.every(p=>Math.abs(p[0]-2)<.3&&Math.abs(p[2]-3)<.3&&p[1]>6));assert.deepEqual(roProjectileParts({...shot,delay:.1}),[]);
 const event={id:1,time:1,type:'roSkillImpact',skillKey:'mg_napalmbeat',x:0,z:0},unit={id:1,alive:true,x:0,z:0,size:1,roSkillBuffs:[{key:'mg_sight',until:10}]},burst=roMageSpellParts(event,1.2,unit);assert.ok(burst.clouds.length>0);assert.ok(burst.clouds.every(p=>p[1]>.5));const scene=new T.Scene(),art=createRoMageSpellArt({scene});try{art.update({bonk:{elapsed:1},units:[unit],effects:Array.from({length:200},(_,i)=>({...event,id:i}))},1.2);assert.ok(art.stats().cubes>0);assert.ok(art.stats().clouds>0);assert.ok(art.stats().cubes<=B.cubes);assert.ok(art.stats().clouds<=B.clouds);assert.equal(art.stats().planes,0);for(const mesh of scene.children){assert.equal(mesh.material.map,null);assert.equal(mesh.isInstancedMesh,true);}art.reset();assert.equal(art.stats().drawCalls,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
});

test('native renderer suppresses duplicate mage and sprite hit effects while preserving Grimtooth ground spikes',()=>{
 const factories=[];const factory=options=>{factories.push(options);return{preload:async()=>{},prepare(){},handles:()=>false,handlesZone:()=>false,isReady:()=>true,handlesRequest:()=>true,update(){},stats:()=>({}),reset(){},dispose(){}};};const system=createRoNativeEffectSystem({scene:new T.Scene(),strFactory:factory,primitiveFactory:factory});const state={time:1,options:{mode:'bonk'},units:[],effects:[],bonk:{roSkillZones:[]}};try{system.prepare(state);for(const f of factories){assert.deepEqual(f.requestsForEvent({id:1,time:1,type:'roAttack',bonk:true,source:1,skillKey:'coldbolt'},{}),[]);assert.deepEqual(f.requestsForEvent({id:2,time:1,type:'roSkillImpact',bonk:true,source:1,skillKey:'bash',x:0,z:0},{}),[]);}const spikes=factories[1].requestsForEvent({id:3,time:1,type:'roSkillImpact',bonk:true,source:1,skillKey:'as_grimtooth',x:0,z:0},{});assert.equal(spikes.length,3);assert.ok(spikes.every(r=>r.part.type==='QuadHorn'));assert.equal(RO_SKILLS.mg_sight.damage,0);assert.equal(RO_SKILLS.mg_sight.kind,'buff');}finally{system.dispose();}
});
