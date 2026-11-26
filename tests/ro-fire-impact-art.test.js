import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createRoFireImpactArt,roFireImpacts,roFireImpactHandles,RO_FIRE_IMPACT_BUDGET as B} from '../src/ro-fire-impact-art.js';
import {createVoxelFire} from '../src/voxel-fire.js';
import {roGroundAreas,roGroundAreaHandles} from '../src/ro-ground-area-art.js';
import {roElementAreaParticles} from '../src/ro-element-area-art.js';
const impact=(id=1,extra={})=>({id,type:'fireball',bonk:true,skillKey:'fireball',source:2,time:0,x:0,z:0,radius:3,duration:.7,...extra}),state=effects=>({options:{mode:'bonk'},time:.2,effects,bonk:{elapsed:.2,roSkillZones:[],warnings:[]}});
test('fireball impact handling preserves projectile launches, other elements and boss warning geometry',()=>{
 assert.equal(roFireImpactHandles(impact()),true);assert.equal(roFireImpactHandles(impact(2,{bonk:false})),true,'classic simulation emits fireball at the already damaged ground point');for(const e of [impact(3,{bonk:false,tx:20,tz:20}),impact(4,{bonk:false,phase:'launch'}),impact(5,{type:'roAttack',attackKind:'projectile'}),impact(6,{type:'bossDanger',element:'fire'}),impact(7,{type:'bossImpact',element:'fire'}),impact(8,{element:'earth'})])assert.equal(roFireImpactHandles(e),false);
 const s=state([impact(),impact(9,{type:'abilityPulse',element:'fire'}),impact(10,{type:'abilityPulse',element:'earth'})]);s.bonk.warnings=[{id:22,shape:'circle',x:0,z:0,radius:5,start:0,fireAt:3,element:'fire'}];const areas=roGroundAreas(s,.2);assert.equal(areas.filter(a=>a.enemy).length,1);assert.ok(areas.some(a=>a.element==='earth'));assert.ok(!areas.some(a=>!a.enemy&&a.element==='fire'));assert.equal(roGroundAreaHandles(s.effects[1],s),true);assert.equal(roElementAreaParticles(s,.2).length,0);
});
test('only volumetric fire handles fire zones and explosions while frost and other elemental effects remain',()=>{
 const s=state([impact(),impact(2,{type:'frostnova',element:'ice'})]);s.bonk.roSkillZones=[{id:3,x:4,z:1,radius:5,until:5,weapon:{element:'fire'}}];assert.equal(roFireImpacts(s,.2).length,2);const parts=roElementAreaParticles(s,.2);assert.equal(parts.length,16);assert.ok(parts.every(p=>p.kind===2));const before=structuredClone(s);roFireImpacts(s,.4);assert.deepEqual(s,before);
});
test('twelve pooled impacts reuse one draw and at most thirty-two canonical campfire sites without smoke or new per-impact meshes',()=>{
 const scene=new T.Scene(),art=createRoFireImpactArt({scene}),geometry=art.mesh.geometry,material=art.mesh.material;
 try{for(let n=1;n<=12;n++){art.update(state(Array.from({length:n},(_,i)=>impact(i))),.2,()=>4);const stats=art.stats();assert.equal(scene.children.length,1);assert.equal(stats.impacts,n);assert.equal(stats.pooled,n);assert.equal(stats.poolCapacity,12);assert.ok(stats.sites<=32);assert.ok(stats.instances<=B.instances);assert.equal(stats.drawCalls,1);assert.equal(stats.smoke,0);assert.equal(art.mesh.geometry,geometry);assert.equal(art.mesh.material,material);const matrix=new T.Matrix4(),color=new T.Color(),palette=new Set([0xffec9d,0xd86c2e,0xffb346,0xc76a36,0xffd47a]);for(let i=0;i<art.mesh.count;i++){art.mesh.getMatrixAt(i,matrix);art.mesh.getColorAt(i,color);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.elements[13]>=4);assert.ok(palette.has(color.getHex()),color.getHexString());}}
  art.update(state(Array.from({length:40},(_,i)=>impact(100+i))),.3);assert.equal(art.stats().pooled,12);assert.equal(scene.children.length,1);art.update(state([]),3);assert.equal(art.stats().instances,0);assert.equal(art.stats().pooled,0);assert.equal(art.mesh.visible,false);assert.equal(art.mesh.geometry,geometry);
 }finally{art.dispose();}
});
test('a fire impact expands radially on the actual ground and expires without a luminous ring or billboard shader',()=>{
 const scene=new T.Scene(),art=createRoFireImpactArt({scene}),s=state([impact()]),matrix=new T.Matrix4();
 try{art.update(s,.05,()=>7);art.mesh.getMatrixAt(0,matrix);const early=matrix.elements[0]**2+matrix.elements[2]**2;art.update(s,.3,()=>7);art.mesh.getMatrixAt(0,matrix);assert.ok(matrix.elements[0]**2+matrix.elements[2]**2>early);assert.equal(art.mesh.material.isMeshBasicMaterial,true);const shader={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};art.mesh.material.onBeforeCompile(shader);assert.match(shader.fragmentShader,/diffuseColor.a\*=vFireOpacity/);assert.doesNotMatch(shader.fragmentShader,/vUv|areaKind/);art.update(s,.8);assert.equal(art.stats().drawCalls,0);}finally{art.dispose();}
});
test('disposing the impact batch never releases another living campfire, and each owned resource is released once',()=>{
 const scene=new T.Scene(),campfire=createVoxelFire(scene,{seed:8}),art=createRoFireImpactArt({scene});let sharedDisposals=0,geometry=0,material=0,mesh=0;const original=campfire.root.children[0];original.geometry.addEventListener('dispose',()=>sharedDisposals++);original.material.addEventListener('dispose',()=>sharedDisposals++);art.mesh.geometry.addEventListener('dispose',()=>geometry++);art.mesh.material.addEventListener('dispose',()=>material++);art.mesh.addEventListener('dispose',()=>mesh++);
 art.update(state([impact()]),.2);art.dispose();art.dispose();assert.equal(sharedDisposals,0);assert.deepEqual([geometry,material,mesh],[1,1,1]);assert.equal(scene.children.length,1);campfire.update(5);assert.equal(campfire.root.visible,true);campfire.dispose();assert.equal(sharedDisposals,2);assert.equal(scene.children.length,0);
});


test('Meteor Assault is a native neutral purple effect, never a canonical fire explosion',()=>{assert.equal(roFireImpactHandles({type:'abilityPulse',skillKey:'asc_meteorassault',element:'physical',radius:7}),false);assert.equal(roFireImpactHandles({type:'fireball',skillKey:'asc_meteorassault',element:'fire',bonk:true}),false);});

test('Magnum Break reuses the fireball flame sculpture in eight circular expanding plumes at its compact actual radius',()=>{
 const scene=new T.Scene(),art=createRoFireImpactArt({scene}),s=state([impact(1,{type:'abilityPulse',skillKey:'sm_magnum',element:'fire',radius:2,duration:.7})]);try{art.update(s,.3);assert.equal(art.stats().sites,8);assert.equal(art.stats().drawCalls,1);assert.ok(art.stats().instances<=B.instances);assert.equal(art.mesh.material.map,null);assert.equal(art.mesh.geometry.type,'BoxGeometry');const matrix=new T.Matrix4();for(let i=0;i<art.mesh.count;i++){art.mesh.getMatrixAt(i,matrix);assert.ok(Math.hypot(matrix.elements[12],matrix.elements[14])<2.5);}}finally{art.dispose();}
});

 test('fire walls render only through their dedicated continuous fire, and large fields retain small animated flame tongues',()=>{
 const wall=impact(1,{type:'abilityPulse',skillKey:'mg_firewall',element:'fire',radius:12});assert.equal(roFireImpactHandles(wall),false);const s=state([wall]);s.bonk.roSkillZones=[{id:3,key:'mg_firewall',x:0,z:0,radius:12,until:5,weapon:{element:'fire'}}];assert.deepEqual(roFireImpacts(s,.2),[]);
 const art=createRoFireImpactArt({scene:new T.Scene()}),field=state([]);field.bonk.roSkillZones=[{id:4,key:'ra_firingtrap',x:0,z:0,radius:12,until:5,weapon:{element:'fire'}}];const matrix=new T.Matrix4(),scale=new T.Vector3();try{art.update(field,.2);assert.equal(art.stats().sites,8);const before=Array.from(art.mesh.instanceMatrix.array);for(let i=0;i<art.mesh.count;i++){art.mesh.getMatrixAt(i,matrix);scale.setFromMatrixScale(matrix);assert.ok(scale.x<.6&&scale.z<.6&&scale.y<.8,'separate tongues instead of giant slabs');}art.update(field,.7);assert.notDeepEqual(Array.from(art.mesh.instanceMatrix.array),before);assert.equal(art.mesh.material.map,null);}finally{art.dispose();}
 });
