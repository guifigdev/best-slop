import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createBonkWorld} from '../src/bonk-world.js';
import {bonkEquipmentPickupParts,bonkEquipmentGlints,BONK_EQUIPMENT_ART_BUDGET as B} from '../src/bonk-equipment-art.js';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';
import {RO_EQUIPMENT,createRoEquipment} from '../shared/ragnarok-equipment.js';

test('clicking a raised shrine intersects its padded 3D volume even when the ground projection misses it',()=>{
 const map=generateBonkLevel(89,'grove');map.objects=[{id:'altar',type:'shrine',x:0,z:0,used:false,cost:40}];const state={options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]}},world=createBonkWorld({scene:new T.Scene()}),ground=bonkHeightAt(map,0,0),origin=new T.Vector3(0,ground+8,9),direction=new T.Vector3(0,ground+2,0).sub(origin).normalize(),raycaster=new T.Raycaster(origin,direction);
 try{world.update(state,1);const point=raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-ground),new T.Vector3());assert.equal(world.pick(point),null,'the old projected click lands behind the pedestal');assert.deepEqual(world.pickRay(raycaster),{bonkObject:'altar'});const edge=new T.Raycaster(new T.Vector3(1.2,ground+5,0),new T.Vector3(0,-1,0));assert.deepEqual(world.pickRay(edge),{bonkObject:'altar'},'a small padded margin improves touch targeting');raycaster.far=1;assert.equal(world.pickRay(raycaster),null);raycaster.far=Infinity;map.objects[0].used=true;world.update(state,2);assert.equal(world.pickRay(raycaster),null);world.update({options:{mode:'campaign'}},3);assert.equal(world.pickRay(edge),null);}finally{world.dispose();}
});

test('equipment pieces use a distinct gold/steel silhouette within four instances and glints stay local and capped',()=>{
 for(const key of Object.keys(RO_EQUIPMENT)){const parts=bonkEquipmentPickupParts({id:1,item:{key}},1);assert.equal(parts.length,B.partsPerItem);assert.ok(parts.every(p=>p.every(Number.isFinite)));assert.ok(parts.every(p=>p[6]!==0x57c7aa),'gear never reuses the green XP gem');}
 const pickups=Array.from({length:60},(_,i)=>({id:i,type:'equipment',item:{key:'sword'},x:i<30?i*.2:100,z:0})),glints=bonkEquipmentGlints(pickups,{x:0,z:0},1);assert.ok(glints.length<=B.glintParts);assert.deepEqual(glints,bonkEquipmentGlints(pickups,{x:0,z:0},1));assert.deepEqual(bonkEquipmentGlints(pickups,{x:1000,z:1000},1),[]);
 const map=generateBonkLevel(90,'grove'),world=createBonkWorld({scene:new T.Scene()});try{world.update({options:{mode:'bonk'},bonk:{map,objects:[],pickups:Array.from({length:450},(_,i)=>({id:i,type:'equipment',item:createRoEquipment(i%2?'sword':'coat','gear-'+i),x:i%20,z:Math.floor(i/20),age:0})),projectiles:[],objectives:[]}},1);const loot=world.root.getObjectByName('bonk-gems');assert.equal(loot.count,1800);assert.ok(loot.count<=loot.instanceMatrix.count);assert.ok(world.root.getObjectByName('bonk-rune-signals').count<1600);}finally{world.dispose();}
});
