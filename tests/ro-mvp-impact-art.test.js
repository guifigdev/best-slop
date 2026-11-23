import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {roMvpPatterns,roMvpImpactKind,roMvpImpactDuration} from '../shared/ro-mvp-encounters.js';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {createMonsterAbilityArt} from '../src/monster-ability-art.js';
import {createRoMvpImpactArt,roMvpImpactAnchors,RO_MVP_IMPACT_ART_BUDGET as B} from '../src/ro-mvp-impact-art.js';
const event=(kind,extra={})=>({id:1,type:'bossImpact',time:0,bonk:true,mvp:kind,skill:'slam',x:0,z:0,shape:'circle',radius:12,element:({hatii:'ice',stormyknight:'ice',mistress:'lightning',ifrit:'fire',phreeoni:'earth',baphomet:'dark'})[kind],duration:.7,...extra});
const state=effects=>({options:{mode:'bonk'},bonk:{map:{seed:41},warnings:[]},effects,units:[]});

test('every authored MVP footprint emits anchors only in its real damage region and respects visible sampling',()=>{
 for(const mvp of ['hatii','ifrit','mistress','baphomet','phreeoni','stormyknight'])for(let index=0;index<4;index++)for(const pattern of roMvpPatterns({id:2,x:3,z:-4,damage:20,ragnarokMvp:mvp},{x:12,z:7},index,2)){
  assert.ok(roMvpImpactAnchors(pattern).length>0,mvp);const points=roMvpImpactAnchors(pattern,{visible:p=>p.x>=0,limit:31});assert.ok(points.length<=31,mvp);for(const point of points){assert.ok(insideBossPattern(point,pattern),mvp);assert.ok(point.x>=0);}assert.ok(roMvpImpactDuration(pattern)>=.8);
 }
 assert.equal(roMvpImpactKind(event('hatii')),'blizzard');assert.equal(roMvpImpactKind(event('stormyknight')),'blizzard');assert.equal(roMvpImpactKind(event('mistress')),'lightning');assert.equal(roMvpImpactKind(event('ifrit')),'eruption');assert.equal(roMvpImpactKind(event('phreeoni')),'quake');assert.equal(roMvpImpactKind(event('baphomet')),'scythe');
});

test('elemental impacts produce large distinct actual geometry, track local terrain height and expire without state mutation',()=>{
 const scene=new T.Scene(),art=createRoMvpImpactArt({scene}),matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion(),signatures=new Set();try{
  for(const [index,mvp]of ['hatii','mistress','ifrit','phreeoni','baphomet'].entries()){
   const s=state([event(mvp,{id:index+1,time:index*3})]),before=JSON.stringify(s),ground=(x,z)=>30+x*.18+z*.08;art.update(s,index*3+.22,ground);const stats=art.stats();assert.ok(stats.glow+stats.lines+stats.shards>20,mvp);assert.ok(stats.drawCalls>0&&stats.drawCalls<=B.drawCalls);assert.equal(stats.renderTargets,0);signatures.add(JSON.stringify([stats.lines,stats.glow,stats.shards]));let maxHeight=0;
   for(const mesh of art.root.children){assert.ok(mesh.count<=mesh.instanceMatrix.count);for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));matrix.decompose(position,rotation,scale);assert.ok(scale.toArray().every(v=>v>0));assert.ok(position.y>ground(position.x,position.z)-.1,'effect conforms to the sampled terrain');maxHeight=Math.max(maxHeight,scale.y);}}if(mvp==='hatii')assert.ok(maxHeight>3,'ice is a pointed eruption several meters tall');if(mvp==='ifrit')assert.ok(stats.glow>=200,'a field of native voxel fire, not two bars');if(mvp==='mistress')assert.ok(stats.lines>100,'segmented dual-core lightning bolts');assert.equal(JSON.stringify(s),before);
   art.update({...s,effects:[]},index*3+2);assert.equal(art.stats().events,0);assert.ok(art.root.children.every(m=>m.count===0));
  }assert.equal(signatures.size,5);
 }finally{art.dispose();art.dispose();}assert.equal(scene.children.length,0);
});

test('offscreen impacts are culled, rapid events stay bounded and region/time resets release their records',()=>{
 const scene=new T.Scene(),art=createRoMvpImpactArt({scene}),camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,6,20);camera.lookAt(0,2,0);camera.updateMatrixWorld();try{
  art.update(state([event('hatii',{x:500,z:500})]),.2,()=>0,camera);assert.equal(art.stats().shards+art.stats().glow+art.stats().lines,0);
  const s=state(Array.from({length:80},(_,i)=>event(['ifrit','hatii','mistress'][i%3],{id:i})));art.update(s,.3,()=>0,camera);assert.equal(art.stats().events,B.events);const meshes=[...art.root.children];for(let i=0;i<20;i++){art.update(s,.3+i*.02,()=>0,camera);assert.ok(art.stats().glow<=B.glow&&art.stats().shards<=B.shards&&art.stats().lines<=B.lines);assert.deepEqual(art.root.children,meshes);}art.update({...s,effects:[],bonk:{map:{seed:42}}},.1,()=>0,camera);assert.equal(art.stats().events,0);
 }finally{art.dispose();}
});

test('the actual Bonk warning and hit events dispatch to the shared renderer without adding client damage',()=>{
 const game=new Game(51,{mode:'bonk'});game.addPlayer('p','knight');game.command('p',{type:'bkReady'});const player=game.player('p');player.hp=player.maxHp=100000;game.bonk.spawnAt=Infinity;game.bonk.objectives=[];const boss={id:game.id(),bonkEnemy:true,bonkBoss:true,alive:true,team:100,x:player.x+5,z:player.z,hp:99999,maxHp:99999,damage:12,speed:0,interval:100,bonkNextAttack:Infinity,bonkNextSpecial:0,ragnarokMvp:'mistress',element:'lightning',size:2};game.units=[player,boss];game.tick(.05);const warning=game.effects.find(e=>e.type==='bossDanger'&&e.mvp==='mistress');assert.ok(warning);const scene=new T.Scene(),art=createMonsterAbilityArt({scene});try{art.update(game,game.time,()=>0);assert.equal(art.stats().mvp.activeEvents,0);while(game.bonk.elapsed<warning.fireAt+.05)game.tick(.05);const impact=game.effects.find(e=>e.type==='bossImpact'&&e.mvp==='mistress');assert.ok(impact);const hp=player.hp;art.update(game,game.time+.1,()=>0);assert.ok(art.stats().mvp.lines>0);assert.equal(player.hp,hp,'rendering never hits a player');assert.equal(impact.element,'lightning');}finally{art.dispose();}
});
