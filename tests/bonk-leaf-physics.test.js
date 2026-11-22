import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bonkLeafTrajectory,bonkFallingLeaves,BONK_TREE_ART_BUDGET as B} from '../src/bonk-tree-art.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {generateBonkLevel} from '../shared/bonk-level.js';

const emitter={id:'real-tree',x:2,z:3,y:7,height:6,seed:19,radius:1.3};
function launch(){for(let t=0;t<60;t+=.05){const p=bonkLeafTrajectory(emitter,t);if(p.alive&&!p.grounded&&p.age<.1)return p.emittedAt;}throw Error('no leaf emission');}

test('leaf launch points stay on tree canopies and analytic velocity follows gravity and wind drag',()=>{
 const time=launch(),a=bonkLeafTrajectory(emitter,time+.1),b=bonkLeafTrajectory(emitter,time+1),c=bonkLeafTrajectory(emitter,time+2);assert.ok(a.alive&&b.alive&&c.alive);assert.ok(Math.hypot(a.origin.x-emitter.x,a.origin.z-emitter.z)<=emitter.radius);assert.ok(a.origin.y<emitter.y&&a.origin.y>emitter.y-emitter.height*.25);assert.ok(a.velocity.y>b.velocity.y&&b.velocity.y>c.velocity.y,'gravity accelerates fall toward terminal speed');assert.ok(c.velocity.y> -1.18/.65);assert.ok(a.position.y>b.position.y&&b.position.y>c.position.y);assert.notEqual(a.rotation.x,b.rotation.x);assert.notEqual(a.rotation.z,b.rotation.z);assert.equal(a.parts.length,10,'full XYZ tumble reaches instance matrices');
});

test('world-space trajectories freeze with simulation time and ignore camera movement and emitter ordering',()=>{
 const time=launch()+1.2,heightAt=()=>0,camera=new T.PerspectiveCamera(),first=bonkLeafTrajectory(emitter,time,0,{heightAt,camera});camera.position.set(50,20,-30);camera.lookAt(-100,0,0);assert.deepEqual(bonkLeafTrajectory(emitter,time,0,{heightAt,camera}),first);assert.deepEqual(bonkFallingLeaves([emitter],time,{x:0,z:0},{heightAt,camera}),bonkFallingLeaves([emitter],time,{x:10,z:4},{heightAt,camera}),'moving observer changes visibility selection, never an existing leaf path');const unseeded={id:'tree-with-zero-seed',x:2,z:3,y:6,height:5,seed:0};assert.deepEqual(bonkFallingLeaves([unseeded],time),bonkFallingLeaves([{id:'far',x:300,z:300,y:6},unseeded],time));
});

test('leaves collide with the terrain, settle at a fixed world position and fade rather than sinking or looping upward',()=>{
 const time=launch(),heightAt=(x,z)=>1.2+x*.03+z*.015;let landed=null;for(let age=.1;age<=B.leafLifetime;age+=.05){const p=bonkLeafTrajectory(emitter,time+age,0,{heightAt});if(!p.alive)continue;assert.ok(p.position.y>=heightAt(p.position.x,p.position.z)+.0349);if(p.grounded){landed=p;break;}}assert.ok(landed);const later=bonkLeafTrajectory(emitter,time+landed.age+.2,0,{heightAt});assert.ok(later.alive&&later.grounded);assert.deepEqual(later.position,landed.position);assert.deepEqual(later.velocity,{x:0,y:0,z:0});assert.ok(Math.abs(later.rotation.x)<Math.abs(landed.rotation.x));assert.equal(bonkLeafTrajectory(emitter,time+landed.age+1.3,0,{heightAt}).alive,false);
});

test('camera culling restores the original leaf transforms and green hero-relative fake weather is absent in forests',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),map=generateBonkLevel(19,'grove'),hero={id:1,bonkHero:true,alive:true,x:0,z:23},state={options:{mode:'bonk'},units:[hero],bonk:{map,objects:map.objects,pickups:[],projectiles:[],warnings:[]}};try{
  let leaves;for(let time=0;time<30;time+=.5){world.update(state,time);leaves=world.root.getObjectByName('bonk-falling-leaves');if(leaves.count>1)break;}assert.ok(leaves.count>0&&leaves.count<=24);assert.equal(world.root.getObjectByName('bonk-weather').count,0,'the 84 green rectangles previously centered on the moving hero are gone');const count=leaves.count,source=Array.from(leaves.instanceMatrix.array.slice(0,count*16)),camera=new T.PerspectiveCamera(110,1,.1,300);camera.position.set(0,100,23);camera.lookAt(0,0,23);camera.updateMatrixWorld();world.cull(camera);const topCount=leaves.count,first=Array.from(leaves.instanceMatrix.array.slice(0,topCount*16));camera.position.set(0,5,23);camera.lookAt(0,5,100);camera.updateMatrixWorld();world.cull(camera);camera.position.set(0,100,23);camera.lookAt(0,0,23);camera.updateMatrixWorld();world.cull(camera);assert.equal(leaves.count,topCount);assert.deepEqual(Array.from(leaves.instanceMatrix.array.slice(0,topCount*16)),first);assert.ok(source.every(Number.isFinite));
 }finally{world.dispose();}
});
