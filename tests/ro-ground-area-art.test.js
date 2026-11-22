import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';
import {roMvpPatterns} from '../shared/ro-mvp-encounters.js';
import {RO_GROUND_AREA_BUDGET as B,roGroundAreaContains,roGroundAreaGrid,roGroundAreas,roGroundAreaHandles,createRoGroundAreaArt} from '../src/ro-ground-area-art.js';
const patterns=[{shape:'circle',radius:12},{shape:'ring',radius:18,inner:7},{shape:'line',width:4,length:38,dx:Math.sin(.6),dz:Math.cos(.6)},{shape:'cone',radius:20,angle:Math.PI*.65,dx:Math.sin(.4),dz:Math.cos(.4)}].map(p=>({x:0,z:0,...p}));
function state(warnings=patterns){return{options:{mode:'bonk'},time:1,bonk:{elapsed:1,warnings:warnings.map((w,i)=>({...w,id:i,fireAt:3,start:0})),roSkillZones:[]},effects:[]};}

test('filled masks agree with the authoritative hit test for circles, safe donut holes, rotated lines and cones',()=>{
 for(const p of patterns)for(let z=-22;z<=22;z+=.7)for(let x=-22;x<=22;x+=.7)assert.equal(roGroundAreaContains({x,z},p),insideBossPattern({x,z},p));
 assert.equal(roGroundAreaContains({x:0,z:0},patterns[1]),false);assert.equal(roGroundAreaContains({x:8,z:0},patterns[1]),true);assert.equal(roGroundAreaContains({x:0,z:-10},{...patterns[3],dx:0,dz:1}),false);
 const cross=roMvpPatterns({id:9,x:0,z:0,damage:20,ragnarokMvp:'valkyrierandgris'},{x:10,z:10},0,0).slice(0,2);assert.equal(cross.length,2);assert.ok(cross.every(p=>p.shape==='line'));assert.ok(cross.some(p=>roGroundAreaContains({x:20,z:0},p)));assert.ok(cross.some(p=>roGroundAreaContains({x:0,z:20},p)));assert.ok(cross.every(p=>!roGroundAreaContains({x:10,z:10},p)),'the diagonal escape gaps remain empty');
});

test('the mesh covers the complete interior rather than sampling only the outline',()=>{
 const grid=roGroundAreaGrid({x:0,z:0,shape:'circle',radius:10},()=>0),p=grid.positions;assert.ok(grid.triangles>200);let interior=0;for(let i=0;i<p.length;i+=9){const center={x:(p[i]+p[i+3]+p[i+6])/3,z:(p[i+2]+p[i+5]+p[i+8])/3};if(Math.hypot(center.x,center.z)<5)interior++;}assert.ok(interior>30);assert.equal(p.length,grid.triangles*9);
});

test('every AoE vertex hugs the actual sampled relief and finite global grid is reused across nearby origins',()=>{
 const map=generateBonkLevel(381,'forge'),height=(x,z)=>bonkHeightAt(map,x,z);for(const p of patterns){const grid=roGroundAreaGrid(p,height);for(let i=0;i<grid.positions.length;i+=3){const[x,y,z]=grid.positions.slice(i,i+3);assert.ok(Math.abs(y-height(x,z)-.055)<.00002);assert.ok(Number.isFinite(y));}}
 const a=roGroundAreaGrid({x:.1,z:.1,shape:'circle',radius:4},height),b=roGroundAreaGrid({x:.2,z:.2,shape:'circle',radius:4},height);assert.equal(a.key,b.key);assert.deepEqual(a.positions,b.positions);
});

test('warnings fill in red-orange and brighten before impact, friendly casts have different colors and no timing mutation',()=>{
 const s=state([patterns[0]]),before=structuredClone(s),start=roGroundAreas(s,1)[0];s.bonk.elapsed=2.9;const imminent=roGroundAreas(s,2.9)[0];assert.ok(imminent.opacity>start.opacity);assert.ok(imminent.progress>start.progress);assert.equal(start.color,0xff583c);s.bonk.elapsed=3.1;assert.equal(roGroundAreas(s,3.1).length,0);assert.deepEqual(before.bonk.warnings,s.bonk.warnings);
 s.effects=[{id:9,type:'abilityPulse',bonk:true,x:0,z:0,radius:8,element:'ice',time:3,duration:1}];const friendly=roGroundAreas(s,3.1)[0];assert.equal(friendly.enemy,false);assert.notEqual(friendly.color,start.color);assert.equal(roGroundAreaHandles(s.effects[0],s),true);assert.equal(roGroundAreaHandles({...s.effects[0],radius:.8},s),false);
});

test('one shader batch clips exact shapes, leaves holes empty, animates the entire translucent fill and never creates scene lights',()=>{
 const parent=new T.Group(),art=createRoGroundAreaArt({parent});art.update(state(),1);assert.equal(parent.children.length,1);assert.equal(art.root.children.length,1);const mesh=art.root.children[0];assert.equal(mesh.material.depthWrite,false);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.toneMapped,false);assert.equal(mesh.material.transparent,true);assert.equal(mesh.castShadow,false);assert.equal(art.stats().drawCalls,1);assert.equal(art.stats().visible,4);assert.ok(mesh.material.fragmentShader.includes('r<o.w'));assert.ok(mesh.material.fragmentShader.includes('t.w*(0.76+shimmer*0.16+bands*0.08)'));assert.ok(mesh.material.fragmentShader.includes('side>o.z*0.5'));assert.ok(art.stats().triangles<=B.triangles);art.dispose();assert.equal(parent.children.length,0);
});

test('large boss attacks retain priority over friendly effects and obey the fixed area and triangle budgets',()=>{
 const s=state(Array.from({length:20},(_,i)=>({...patterns[1],x:i,radius:40})));s.effects=Array.from({length:30},(_,i)=>({id:i,bonk:true,type:'abilityPulse',x:i,z:0,radius:12,time:0,duration:5}));const art=createRoGroundAreaArt({parent:new T.Group()});art.update(s,1);assert.equal(roGroundAreas(s,1).filter(a=>a.enemy).length,8);assert.ok(art.stats().areas<=B.areas);assert.ok(art.stats().triangles<=B.triangles);assert.ok(art.stats().vertices<=B.vertices);assert.equal(art.stats().drawCalls,1);art.dispose();
});

test('the cached surface compacts outside-camera areas, resets on world changes and disposes both resources once',()=>{
 const parent=new T.Group(),art=createRoGroundAreaArt({parent}),s=state([{x:0,z:0,shape:'circle',radius:4},{x:200,z:0,shape:'circle',radius:4}]),camera=new T.PerspectiveCamera(50,1,.1,100);camera.position.set(0,15,25);camera.lookAt(0,0,0);camera.updateMatrixWorld();art.update(s,1);const mesh=art.root.children[0];art.cull(camera);assert.equal(art.stats().visible,1);assert.equal(art.stats().culled,1);art.update(s,1.1);art.cull(camera);assert.equal(art.root.children[0],mesh);art.reset();assert.equal(art.stats().vertices,0);assert.equal(art.stats().cache,0);assert.equal(art.root.visible,false);let geometry=0,material=0;mesh.geometry.addEventListener('dispose',()=>geometry++);mesh.material.addEventListener('dispose',()=>material++);art.dispose();art.dispose();assert.deepEqual([geometry,material],[1,1]);assert.equal(parent.children.length,0);assert.equal(art.stats().disposed,true);
});
