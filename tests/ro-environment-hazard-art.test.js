import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {transform} from 'esbuild';
import {readFileSync} from 'node:fs';
import {roHazardBoundary,roHazardContains} from '../shared/ro-environment-hazards.js';
import {createRoEnvironmentHazardArt,roEnvironmentHazardBounds,roEnvironmentHazardGrid,roEnvironmentHazardSites,RO_ENVIRONMENT_HAZARD_ART_BUDGET as B} from '../src/ro-environment-hazard-art.js';
import {roEnvironmentStatusMarkup} from '../src/ro-mobile-hud.js';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';

const zone=(type,id=type)=>({id,type,name:type,x:0,z:0,rx:5.6,rz:3.8,angle:.73,color:0x99bb77});
const state=zones=>({time:4,options:{mode:'bonk'},bonk:{map:{seed:1},environmentZones:zones},effects:[],units:[]});
test('rotated visual bounds cover the host boundary and every fire/mist site belongs to the authoritative ellipse',()=>{
 for(const angle of [0,.23,.73,1.7,3.2]){const z={...zone('poison'),angle},bounds=roEnvironmentHazardBounds(z),grid=roEnvironmentHazardGrid(z,()=>2);for(const p of roHazardBoundary(z,256)){assert.ok(p.x>=bounds.minX-1e-7&&p.x<=bounds.maxX+1e-7&&p.z>=bounds.minZ-1e-7&&p.z<=bounds.maxZ+1e-7);}for(const p of roEnvironmentHazardSites(z,96))assert.equal(roHazardContains(z,p.x,p.z),true);assert.equal(grid.positions.length%18,0);assert.ok(grid.positions.length/3<B.vertices/3);assert.equal(grid.positions[1],Math.fround(2.065));}
});
test('surface uses the exact rotated ellipse quadratic and never substitutes a boss-warning ring',()=>{
 const scene=new T.Scene(),art=createRoEnvironmentHazardArt({scene}),shader=art.surface.material.fragmentShader;assert.match(shader,/vec2\(d\.x\*s\.x\+d\.y\*s\.y,-d\.x\*s\.y\+d\.y\*s\.x\)\/o\.zw/);assert.match(shader,/float mask=dot\(q,q\);if\(mask>1\.\)discard/);assert.doesNotMatch(shader,/bossDanger|warningProgress|hazardContains\(/);
 const z=zone('poison'),c=Math.cos(z.angle),s=Math.sin(z.angle);for(let x=-8;x<=8;x+=.37)for(let y=-8;y<=8;y+=.41){const dx=x-z.x,dz=y-z.z,mask=((dx*c+dz*s)/z.rx)**2+((-dx*s+dz*c)/z.rz)**2;assert.equal(mask<=1,roHazardContains(z,x,y));}art.dispose();
});
test('global 1.8 m subdivisions and terrain diagonals keep every vertex and triangle center above real hills',()=>{
 for(const stage of ['grove','payon','sands','coast','crypt','forge','glacier','geffen']){
  const map=generateBonkLevel(381,stage),height=(x,z)=>bonkHeightAt(map,x,z);
  for(const [x,z,angle]of [[45.17,-60.73,.73],[-55.53,-31.19,1.17],[59.31,49.63,2.23],[-27.49,61.13,.21]]){
   const grid=roEnvironmentHazardGrid({...zone('cold'),x,z,angle},height),p=grid.positions;assert.equal(grid.step,1.8);assert.ok(p.length/3<32*32*6);
   for(let i=0;i<p.length;i+=3){const dx=p[i]/1.8,dz=p[i+2]/1.8,offset=p[i+1]-height(p[i],p[i+2]);assert.ok(Math.abs(dx-Math.round(dx))<.00001&&Math.abs(dz-Math.round(dz))<.00001);assert.ok(offset>.0649&&offset<.0651,stage+' vertex: '+offset);}
   for(let i=0;i<p.length;i+=9){const cx=(p[i]+p[i+3]+p[i+6])/3,cy=(p[i+1]+p[i+4]+p[i+7])/3,cz=(p[i+2]+p[i+5]+p[i+8])/3,offset=cy-height(cx,cz);assert.ok(offset>.0649&&offset<.0651,stage+' triangle: '+offset);}
  }
 }
 // Larger defensive inputs retain a finite aligned grid and full mask bounds.
 const large=roEnvironmentHazardGrid({...zone('lava'),rx:120,rz:90});assert.ok(large.step%3.6<1e-8);assert.ok(large.positions.length/3<=32*32*6);assert.ok(large.meshBounds.minX<=large.bounds.minX&&large.meshBounds.maxX>=large.bounds.maxX);
});
test('three persistent shared batches bound volumetric campfire flames, cold mist and poison bubbles without gameplay changes',()=>{
 const scene=new T.Scene(),art=createRoEnvironmentHazardArt({scene,heightAt:()=>1}),s=state([zone('lava'),{...zone('cold'),x:15},{...zone('poison'),x:-15}]),before=JSON.stringify(s);art.update(s,4);assert.equal(art.stats().zones,3);assert.ok(art.stats().fireSites>0&&art.stats().fireSites<=B.fireSites);assert.ok(art.stats().fireInstances<=B.fireInstances);assert.ok(art.stats().particles>0&&art.stats().particles<=B.particles);assert.equal(art.stats().drawCalls,3);assert.equal(art.stats().lights,0);assert.equal(art.stats().renderTargets,0);assert.equal(scene.children.length,1);assert.equal(art.root.children.length,3);const geometry=art.surface.geometry,flames=art.fire,particles=art.particles;for(let i=0;i<30;i++)art.update(s,4+i*.1);assert.equal(art.surface.geometry,geometry);assert.equal(art.fire,flames);assert.equal(art.particles,particles);assert.equal(JSON.stringify(s),before);art.dispose();
});
test('each secondary biome has particles, culling removes offscreen batches and map changes clear old hazards',()=>{
 const scene=new T.Scene(),art=createRoEnvironmentHazardArt({scene});for(const type of ['cold','poison','dust','dark','arcane','machinery']){art.update(state([zone(type)]),4);assert.ok(art.particles.count>0);assert.equal(art.fire.count,0);assert.equal(art.stats().drawCalls,2);}const camera=new T.PerspectiveCamera(45,1,.1,60);camera.position.set(1000,5,1000);camera.lookAt(1000,0,990);art.update(state([zone('lava')]),4,camera);assert.equal(art.stats().culled,1);assert.equal(art.stats().drawCalls,0);assert.equal(art.root.visible,false);const empty=state([]);empty.bonk.map.seed=2;art.update(empty,5);assert.equal(art.stats().zones,0);assert.equal(art.stats().cache,0);art.reset();assert.equal(art.stats().vertices,0);let disposed=0;for(const mesh of art.root.children)for(const owned of [mesh.geometry,mesh.material])owned.addEventListener('dispose',()=>disposed++);art.dispose();art.dispose();assert.equal(disposed,6);assert.equal(scene.children.length,0);
});
test('environment HUD is a compact badge with exposure/grace, labels hostile types, escapes source names and disappears off hazard',async()=>{
 assert.equal(roEnvironmentStatusMarkup(null),'');assert.equal(roEnvironmentStatusMarkup({type:'invalid'}),'');const cold=roEnvironmentStatusMarkup({type:'cold',name:'Neve <profunda>',phase:'warning',exposure:1.5,graceSeconds:3,secondsUntilDamage:1.5,speedMultiplier:1});assert.match(cold,/Frio acumulado/);assert.match(cold,/1\.5 s para sair/);assert.match(cold,/aria-valuenow="50"/);assert.match(cold,/Neve &lt;profunda&gt;/);assert.doesNotMatch(cold,/<button|<h[1-6]|<section|<img/);const poison=roEnvironmentStatusMarkup({type:'poison',phase:'active',exposure:4,graceSeconds:1.2,speedMultiplier:.84});assert.match(poison,/Veneno/);assert.match(poison,/Movimento 84%/);assert.match(poison,/Saia da área/);await transform(readFileSync(new URL('../src/ro-mobile-hud.css',import.meta.url),'utf8'),{loader:'css'});
});
