import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_AXE_SWING_BUDGET,roAxeSwingFrame,roAxeSwingHandles,createRoAxeSwingArt} from '../src/ro-axe-swing-art.js';
import {RO_SLAM_BUDGET,createRoSlamArt,roSlamParts,roEarthquakeParts} from '../src/ro-slam-art.js';
import {roAxePose} from '../src/ro-weapon-rig.js';
import {createRoAttackArt,roAttackArtHandles} from '../src/ro-attack-art.js';

const unit={id:7,bonkHero:true,roLineage:'meister',bonkJob:'merchant',facing:0},event={id:1,type:'roAttack',bonk:true,source:7,time:0,x:0,z:0,tx:0,tz:5,skillKey:'basic',attackKind:'slash',roLineage:'meister',roJob:'merchant'};
test('axe silhouette and curved ribbon descend through 120 degrees, independently of its circular damage footprint',()=>{
 assert.equal(roAxeSwingHandles(event,unit),true);assert.equal(roAxeSwingHandles({...event,roLineage:'dragonknight',roJob:'knight'},{}),false);
 const raised=roAxeSwingFrame(event,.055),down=roAxeSwingFrame(event,.30);assert.equal(raised.angle,0);assert.ok(Math.abs(down.angle-Math.PI*2/3)<1e-10);assert.equal(RO_AXE_SWING_BUDGET.sweepAngle,Math.PI*2/3);assert.equal(roAxeSwingFrame(event,-.1),null);assert.equal(roAxeSwingFrame(event,.6),null);
 const scene=new T.Scene(),art=createRoAxeSwingArt({scene});try{
  art.update({units:[unit],effects:[event]},.23);const mesh=art.root.getObjectByName('ro-axe-120-degree-curved-ribbon'),weapon=art.root.getObjectByName('ro-recognizable-axe-heads');assert.equal(art.stats().active,1);assert.equal(art.stats().drawCalls,2);assert.ok(mesh.geometry.drawRange.count>100);assert.equal(weapon.count,1);
  weapon.geometry.computeBoundingBox();const box=weapon.geometry.boundingBox;assert.ok(box.max.x-box.min.x>2,'wide two-sided axe head');assert.ok(box.max.y-box.min.y>3,'visible leather shaft and broad blade');assert.ok(box.max.z-box.min.z>.2,'actual 3D steel head');
  const pos=mesh.geometry.attributes.position,points=Array.from({length:mesh.geometry.drawRange.count},(_,i)=>({x:pos.getX(i),y:pos.getY(i),z:pos.getZ(i)}));assert.ok(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))>2.5,'trail is a large curved arc, not a thin vertical beam');assert.ok(Math.max(...points.map(p=>p.z))-Math.min(...points.map(p=>p.z))>2);
 }finally{art.dispose();}assert.equal(scene.children.length,0);
});

test('eight simultaneous swings and impacts retain three batches, reuse allocations, cull, reset and dispose once',()=>{
 const scene=new T.Scene(),art=createRoSlamArt({scene}),effects=[];for(let i=0;i<20;i++)effects.push({...event,id:i,x:i*.1},{id:100+i,type:'roAxeImpact',time:0,x:i*.1,z:2.6,radius:2.6,duration:.8});const state={units:[unit],effects};
 try{art.update(state,.23);assert.equal(art.stats().swing.active,8);assert.ok(art.stats().instances<=RO_SLAM_BUDGET.instances);assert.equal(art.stats().drawCalls,3);assert.ok(art.stats().swing.vertices<=8*32*3*6);const geoms=[];art.root.traverse(o=>{if(o.isMesh)geoms.push(o.geometry);});for(let i=0;i<100;i++)art.update(state,.23);let j=0;art.root.traverse(o=>{if(o.isMesh)assert.equal(o.geometry,geoms[j++]);});
  const camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.set(0,5,20);camera.lookAt(0,1,0);camera.updateMatrixWorld();art.update({units:[unit],effects:[{...event,x:400,z:400},{id:99,type:'roAxeImpact',time:0,x:400,z:400,radius:2.6}]},.23,()=>0,camera);assert.equal(art.stats().drawCalls,0);assert.equal(art.stats().swing.culled,1);
  art.update(state,.2);art.reset();assert.equal(art.stats().drawCalls,0);let disposed=0;for(const geometry of geoms)geometry.addEventListener('dispose',()=>disposed++);art.dispose();art.dispose();assert.equal(disposed,3);
 }finally{art.dispose();}assert.equal(scene.children.length,0);
});

test('the upgraded local burst heaves more large rocks, follows terrain and does not alter Aegis earthquake art',()=>{
 const e={id:5,time:0,x:3,z:4,radius:2.6,duration:.8},parts=roSlamParts(e,.2,(x,z)=>x*.1+z*.03);assert.ok(parts.length>=64&&parts.length<=80);assert.ok(parts.filter(p=>p[3]>.2).length>=15);assert.ok(parts.some(p=>p[1]-(p[0]*.1+p[2]*.03)>.7));assert.ok(parts.every(p=>p.every(Number.isFinite)&&p.slice(3,6).every(n=>n>0)));assert.deepEqual(roSlamParts(e,-1),[]);assert.deepEqual(roSlamParts(e,1),[]);assert.equal(roEarthquakeParts(e,.4).length,64);
 for(let t=0;t<.65;t+=.01){const p=roAxePose(t);assert.equal(p.y,0);assert.ok(Math.abs(p.z)<.08);}assert.ok(roAxePose(.1).x<0);assert.ok(roAxePose(.30).x>2);assert.equal(roAxePose(.7).active,false);
});

test('legacy axe sprite is consumed but not rendered, preventing both duplicate laser and generic fallback',()=>{
 const scene=new T.Scene(),atlas=createRoAttackArt({scene});try{assert.equal(roAttackArtHandles(event,unit),true);assert.equal(atlas.handles(event,unit),true);atlas.update({units:[unit],effects:[event]},.23);assert.equal(atlas.stats().instances,0);assert.equal(atlas.stats().families,0);}finally{atlas.dispose();}
});
