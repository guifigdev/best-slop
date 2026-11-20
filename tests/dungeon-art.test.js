import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createDungeonWorld,dungeonGroundHeight,dungeonBiomeAt} from '../src/dungeon-world.js';
import {DUNGEON_VISUAL_SPECIES,dungeonMonsterSpec,dungeonMonsterModelKey,buildDungeonMonster} from '../src/dungeon-monster-art.js';
import {DUNGEON_BIOMES} from '../shared/dungeon-catalog.js';
import {dungeonFloorHeight} from '../shared/dungeon-design.js';
import {dungeonBackpackMarkup,dungeonChestState,createDungeonUI} from '../src/dungeon-ui.js';

const matrix=(mesh,index=0)=>{const result=new T.Matrix4();mesh.getMatrixAt(index,result);return result.elements;};
const map=()=>({seed:44,floor:1,width:7,height:7,tileSize:1.5,tiles:Array(49).fill(1),biome:'cavern',rooms:[{id:0,x:0,z:0,w:12,d:12,biome:'cavern'}],walls:[{x:0,z:4.5,gx:3,gz:6}],props:[],decor:[]});
const state=(m,objects=[],hazards=[])=>({options:{mode:'dungeon'},players:{p:1},units:[{id:1,x:0,z:0}],dungeon:{map:m,objects,hazards,doors:[],stage:'explore',visibility:{visibleRooms:[0]}}});

test('all thirteen dungeon species have immutable finite and genuinely distinct cave silhouettes',()=>{
 const signatures=new Set();for(const key of DUNGEON_VISUAL_SPECIES){const spec=dungeonMonsterSpec(key);assert.ok(spec&&Object.isFrozen(spec));assert.ok(spec.parts.length>=8);assert.ok(spec.parts.length<=60);for(const part of [...spec.parts,...spec.wings.flatMap(w=>w.parts)]){assert.ok(part.every(Number.isFinite),key);assert.ok(part[3]>0&&part[4]>0&&part[5]>0);}for(const leg of spec.legs)assert.ok([leg.x,leg.y,leg.z,leg.w,leg.h,leg.d,leg.color].every(Number.isFinite));const signature=JSON.stringify(spec.parts.map(p=>p.slice(0,6)));assert.ok(!signatures.has(signature),key);signatures.add(signature);assert.equal(dungeonMonsterModelKey({dungeonSpecies:key}),'dungeon:'+key);assert.equal(dungeonMonsterModelKey({hero:'knight',dungeonSpecies:key}),null);const emitted=[];assert.equal(buildDungeonMonster({dungeonSpecies:key},{},(_,...p)=>emitted.push(p)),spec);assert.deepEqual(emitted,spec.parts);}
 assert.equal(signatures.size,13);assert.equal(dungeonMonsterSpec('unknown'),null);assert.equal(dungeonMonsterSpec('__proto__'),null);assert.equal(dungeonMonsterSpec('worm').legs.length,0);assert.equal(dungeonMonsterSpec('snake').legs.length,0);assert.equal(dungeonMonsterSpec('cavebat').wings.length,2);assert.equal(dungeonMonsterSpec('spider').legs.length,8);assert.equal(dungeonMonsterSpec('scarab').legs.length,6);
});

test('floor surface and actor API share smooth height; different biomes blend across the corridor',()=>{
 const m=map();for(const [x,z]of [[0,0],[4,3],[-3,1]])assert.equal(dungeonGroundHeight(m,x,z),dungeonFloorHeight(m,x,z));assert.ok(Math.abs(dungeonGroundHeight(m,0,0)-dungeonGroundHeight(m,.1,0))<.01);
 m.rooms=[{id:0,x:-20,z:0,w:40,d:40,biome:'forest'},{id:1,x:20,z:0,w:40,d:40,biome:'frost'}];const blend=dungeonBiomeAt(m,0,0);assert.equal(dungeonBiomeAt(m,-20,0).biome,DUNGEON_BIOMES.forest);assert.equal(dungeonBiomeAt(m,20,0).biome,DUNGEON_BIOMES.frost);assert.ok(blend.mix>.4&&blend.mix<=.5);
 const scene=new T.Scene(),world=createDungeonWorld({scene});try{world.update(state(map()),0);const floor=world.root.getObjectByName('dungeon-floor'),pose=matrix(floor,24);assert.ok(Math.abs(pose[13]+pose[5]/2-world.heightAt(0,0))<1e-6);}finally{world.dispose();}
});

test('natural walls reach cavern scale and foreground cutaway preserves the hero sightline',()=>{
 const scene=new T.Scene(),world=createDungeonWorld({scene}),m=map(),s=state(m),camera=new T.PerspectiveCamera();camera.position.set(0,20,20);
 try{world.update(s,0,'p',{x:0,z:0},camera);const front=world.root.getObjectByName('dungeon-cutaway');assert.ok(front.count>=4);assert.ok(front.material.opacity<=.2);let top=0;for(let i=0;i<front.count;i++){const p=matrix(front,i);top=Math.max(top,p[13]+Math.abs(p[5])/2);}assert.ok(top>=8&&top<14);camera.position.z=-20;world.update(s,.2,'p',{x:0,z:0},camera);assert.equal(front.count,0);assert.ok(world.root.getObjectByName('dungeon-walls').count>=4);}finally{world.dispose();}
});

test('pit and ice keep exact collision footprints, while spike height follows authoritative active state',()=>{
 const scene=new T.Scene(),world=createDungeonWorld({scene}),m=map();
 try{for(const type of ['pit','ice']){const hazard={id:type,room:0,type,x:1,z:2,w:4.5,d:3.5,active:false};world.update(state(m,[],[hazard]),type==='pit'?0:.2);const p=matrix(world.root.getObjectByName('dungeon-hazards'));assert.equal(p[12],1);assert.equal(p[14],2);assert.equal(p[0],4.5);assert.equal(p[10],3.5);}const hazard={id:'spikes',room:0,type:'spikes',x:0,z:0,w:3,d:3,active:false};world.update(state(m,[],[hazard]),.4);const mesh=world.root.getObjectByName('dungeon-hazards'),down=matrix(mesh,1)[5];hazard.active=true;world.update(state(m,[],[hazard]),.6);assert.ok(matrix(mesh,1)[5]>down*4);}finally{world.dispose();}
});

test('keyed chests, egg props and campfires coexist under ten batches, five lights and deterministic cleanup',()=>{
 const scene=new T.Scene(),sky=new T.Color(0x888888);scene.background=sky;scene.fog=new T.Fog(0x667788,20,100);const oldFog=scene.fog.color.clone(),world=createDungeonWorld({scene}),m=map();m.props=[{id:'egg',type:'eggNest',room:0,x:2,z:0,w:1.8,d:1.8,h:1.3}];
 const objects=[{id:1,type:'chest',variant:'iron',requiresKey:'key',keyLocked:true,room:0,x:0,z:0},{id:2,type:'prop',propType:'eggNest',propId:'egg',room:0,x:2,z:0},{id:3,type:'key',room:0,x:4,z:0},{id:4,type:'campfire',room:0,x:-3,z:0,radius:3.5,active:true,healing:true}];let bufferDisposals=0;
 try{world.update(state(m,objects),0,'p');const batches=world.root.children.filter(o=>o.isInstancedMesh);assert.equal(batches.length,10);assert.equal(world.root.children.filter(o=>o.isLight).length,5);for(const mesh of batches){assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok([...mesh.instanceMatrix.array.slice(0,mesh.count*16)].every(Number.isFinite));mesh.addEventListener('dispose',()=>bufferDisposals++);}assert.deepEqual(world.pick({x:2,z:0}),{dungeonObject:2});const ranges=world.root.getObjectByName('dungeon-rest-ranges'),p=matrix(ranges);assert.equal(ranges.count,1);assert.equal(p[0],3.5);assert.ok(Math.abs(Math.hypot(p[4],p[5],p[6])-3.5)<1e-6);assert.ok(world.root.getObjectByName('dungeon-critters').count>0);world.update({options:{mode:'tower'}},1);assert.equal(scene.background,sky);assert.ok(scene.fog.color.equals(oldFog));assert.equal(world.pick({x:0,z:0}),null);}finally{world.dispose();world.dispose();}assert.equal(bufferDisposals,10);assert.equal(scene.children.length,0);
});

test('chest feedback distinguishes room combat, missing team key and a shared key ready to consume',()=>{
 const o={requiresKey:'a',locked:true,keyLocked:true},u={dungeonTeam:2};assert.equal(dungeonChestState(o,{keys:{a:1}},u).label,'SALA EM COMBATE');o.locked=false;assert.equal(dungeonChestState(o,{keys:{}},u).label,'REQUER CHAVE RÚNICA');const ready=dungeonChestState(o,{keysByTeam:{2:{a:1}}},u);assert.equal(ready.label,'CHAVE DISPONÍVEL');assert.equal(ready.keyLocked,false);assert.equal(dungeonChestState({},null,u).label,'COFRE LIBERADO');
});

test('every carried slot offers a touchable explicit drop command without changing enchantments or item metadata',()=>{
 const item={key:'blade',level:4,enchant:'fire',permanentEnchant:{id:'algiz',rarity:'epic'},count:2},u={inventory:[item,null,{key:'health',count:3}]},before=JSON.stringify(u),html=dungeonBackpackMarkup(u);assert.match(html,/Largar item/);assert.match(html,/data-dg-slot="0"/);assert.match(html,/data-dg-slot="2"/);assert.doesNotMatch(html,/data-dg-slot="1"/);assert.match(html,/aria-label="Largar /);assert.equal(JSON.stringify(u),before);
 const calls=[],ui=createDungeonUI({getState:()=>null,getOwner:()=> 'p',send:c=>calls.push(c)}),button={dataset:{dgCommand:'dgDrop',dgSlot:'0'}};ui.bindPanel({querySelectorAll:()=>[button]});button.onclick();assert.deepEqual(calls,[{type:'dgDrop',slot:0}]);assert.equal(JSON.stringify(u),before);
});
