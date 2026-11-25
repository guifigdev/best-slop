import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_WORLD_ROUTE,RO_LEGACY_ROUTE_SIZE} from '../shared/ro-world-route.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {roMvpPatterns} from '../shared/ro-mvp-encounters.js';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {bonkObjectiveMarkup} from '../src/bonk-ui.js';
import {roWarningMarks} from '../src/ro-warning-footprints.js';
import {createMonsterAbilityArt} from '../src/monster-ability-art.js';
import {createRoGroundAreaArt} from '../src/ro-ground-area-art.js';
import * as T from 'three';
const start=()=>{const g=new Game(114,{mode:'bonk',bonkWorld:'midgard',bonkLineage:'dragonknight'});g.addPlayer('p','knight');assert.ok(g.command('p',{type:'bkReady'}));return g;};
const resolveChoices=g=>{let tries=0;while(g.bonk.offer&&tries++<60)assert.ok(g.command('p',{type:'bkChoose',choiceId:g.bonk.offer.choices[0].id}));};
function defeat(g){const u=g.player('p');Object.assign(u,{x:0,z:-62});g.tick(.05);const boss=g.units.find(e=>e.bonkBoss);assert.ok(boss);assert.equal(boss.ragnarokMvp,g.bonk.route.mvp);boss.hp=.01;u.attributes.dex=99;u.bonkWeaponAt={};for(let i=0;i<40&&boss.alive;i++)g.tick(.1);assert.equal(boss.alive,false);resolveChoices(g);return u;}

test('connected adventure has a physical locked gate, exact MVP and walks into the next region instead of menu teleporting',()=>{
 const g=start(),u=g.player('p');assert.equal(g.bonk.route.key,'prontera');assert.equal(g.bonk.objectives.length,0);assert.equal(u.z,96);assert.equal(g.command('p',{type:'bkNext',stageKey:'forge'}),false);
 Object.assign(u,{x:0,z:-98});for(let i=0;i<20;i++){g.command('p',{type:'bkMove',dx:0,dz:-1});g.tick(.1);}assert.equal(g.bonk.routeIndex,0);assert.ok(u.z>-100);assert.equal(g.bonk.exitGate.open,false);
 defeat(g);assert.equal(g.bonk.routeBossDefeated,true);assert.deepEqual(g.bonk.clearedStages,['prontera']);assert.equal(g.bonk.exitGate.open,true);assert.equal(g.bonk.map.obstacles.find(o=>o.id==='route-ward').alive,false);
 assert.equal(g.command('p',{type:'bkNext',stageKey:'payon-forest'}),false);Object.assign(u,{x:0,z:-104});g.command('p',{type:'bkMove',dx:0,dz:-1});g.tick(.1);assert.equal(g.bonk.routeIndex,1);assert.equal(g.bonk.route.key,'payon-forest');assert.equal(g.bonk.routeBossDefeated,false);assert.equal(u.z,96);assert.equal(g.bonk.floor,2);
});

test('saving an opened passage resumes the same region without respawning or rewarding its MVP',()=>{
 const g=start(),u=defeat(g),cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.routeIndex,0);assert.equal(cp.routeBossDefeated,true);const next=new Game(999,{mode:'bonk'});next.addPlayer('p','knight');assert.ok(next.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(next.bonk.routeVersion,1);assert.equal(next.bonk.exitGate.open,true);const gold=next.player('p').gold;Object.assign(next.player('p'),{x:0,z:-62});next.tick(.1);assert.ok(!next.units.some(e=>e.alive&&e.bonkBoss));assert.equal(next.player('p').gold,gold);assert.equal(u.roLineage,next.player('p').roLineage);
});

test('all legacy linear route regions can be entered and saved with native waves, their iconic guardian and a matching physical exit',()=>{
 for(const [index,region]of RO_WORLD_ROUTE.slice(0,RO_LEGACY_ROUTE_SIZE).entries()){
  const g=start(),cp=createRoCheckpoint(g);Object.assign(cp,{routeIndex:index,floor:index+1,stageKey:region.scene,clearedStages:RO_WORLD_ROUTE.slice(0,index).map(r=>r.key)});const next=new Game(2,{mode:'bonk'});next.addPlayer('p','knight');assert.ok(next.command('p',{type:'bkRestore',checkpoint:cp}),region.key);assert.equal(next.bonk.route.key,region.key);assert.equal(next.bonk.encounter.boss,region.mvp);assert.ok(createRoCheckpoint(next));const html=bonkObjectiveMarkup(next.snapshotBonk(),next.player('p'));assert.ok(html.includes(region.name));assert.ok(!html.includes('Volte ao templo central'));assert.equal(next.bonk.exitGate?.nextKey||null,region.nextKey);
 }
});

test('large MVP patterns have generous windup, bounded damage and real reachable safe gaps',()=>{
 let expansive=false;for(const region of RO_WORLD_ROUTE)for(let phase=0;phase<4;phase++){
  const boss={id:1,x:0,z:0,damage:30,ragnarokMvp:region.mvp},player={x:9,z:2},patterns=roMvpPatterns(boss,player,phase,10);assert.ok(patterns.length>0&&patterns.length<=8,region.key);
  for(const p of patterns){assert.ok(p.fireAt>=12.1);assert.ok(p.damage<=93&&p.damage>=60);assert.ok(['circle','ring','line','cone'].includes(p.shape));for(const value of Object.values(p))if(typeof value==='number')assert.ok(Number.isFinite(value));if((p.radius||p.length/2)>25)expansive=true;}
  let safe=false;for(let x=-24;x<=24&&!safe;x+=3)for(let z=-24;z<=24;z+=3)if(Math.hypot(x-player.x,z-player.z)<18&&!patterns.some(p=>insideBossPattern({x,z},p))){safe=true;break;}assert.ok(safe,'safe destination within ~2s movement: '+region.key+' '+phase);
 }assert.ok(expansive);
});

test('screen-wide warnings mark only danger, preserve ring safe zones and stay above sloped ground',()=>{
 const boss={id:1,x:0,z:0,damage:30,ragnarokMvp:'phreeoni'},patterns=roMvpPatterns(boss,{x:9,z:2},0,10),ring=patterns[0],points=roWarningMarks(ring);assert.ok(points.length>20&&points.length<=144);assert.ok(points.every(p=>insideBossPattern(p,ring)&&Math.hypot(p.x,p.z)>=ring.inner));assert.deepEqual(roWarningMarks(ring,{visible:()=>false}),[]);
 const scene=new T.Scene(),art=createMonsterAbilityArt({scene}),ground=(x,z)=>2+x*.03+z*.04,e={...ring,id:101,type:'bossDanger',warningId:100,time:0,duration:2.4},state={options:{mode:'bonk'},bonk:{elapsed:.8,warnings:[{...ring,id:100}]},effects:[e],units:[]};art.update(state,.8,ground);assert.equal(art.root.children[0].count,0,'Bonk no longer draws the obsolete geometric outlines');const filled=createRoGroundAreaArt({parent:scene,heightAt:ground});filled.update(state,.8);assert.equal(filled.stats().visible,1);assert.ok(filled.stats().triangles>50);const positions=filled.root.children[0].geometry.attributes.position;for(let i=0;i<filled.stats().vertices;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);assert.ok(Math.abs(y-ground(x,z)-.055)<.00002,'filled warning follows the terrain');}filled.dispose();art.dispose();assert.equal(scene.children.length,0);
});
