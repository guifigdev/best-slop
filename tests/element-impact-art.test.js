import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createElementImpactArt,earthImpactPieces,ELEMENT_IMPACT_BUDGET as B} from '../src/element-impact-art.js';
import {elementImpactRequest,skillVisualElement} from '../shared/element-skill-visuals.js';
import {createRoElementAreaArt,roElementAreaParticles} from '../src/ro-element-area-art.js';
import {RO_SKILLS} from '../shared/ragnarok-jobs.js';
const event=(element,id=1)=>({id,type:'abilityPulse',element,x:0,z:0,time:1,radius:3}),state=effects=>({options:{mode:'campaign'},seed:1,time:1,units:[],effects,obstacles:[]});
test('liquid Water Ball and Deluge differ from frozen skills without changing the server ice element',()=>{
 assert.equal(skillVisualElement({skillKey:'wz_waterball'}),'water');assert.equal(skillVisualElement({skillKey:'sa_deluge'}),'water');assert.equal(skillVisualElement({skillKey:'coldbolt'}),'ice');assert.equal(RO_SKILLS.wz_waterball.element,'ice');for(const type of ['damage','miss','bossDanger','bossImpact','monsterWarning','cast'])assert.equal(elementImpactRequest({...event('water'),type},state([]),1),null);assert.equal(elementImpactRequest({...event('fire'),type:'fireball'},state([]),1),null);assert.equal(elementImpactRequest({...event('water'),type:'roAttack',skillKey:'wz_waterball'},state([]),1),null,'a projectile launch is not an impact');
});
test('earth effects make ground-conforming branching fractures and large rocks plus small ejecta, never smoke cards',()=>{
 const e={...event('earth'),key:'earth',duration:.95},pieces=earthImpactPieces(e,1.25,(x,z)=>x*.1+z*.02);assert.equal(pieces.fractures.length,25);assert.equal(pieces.rocks.length,26);assert.ok(pieces.rocks.some(p=>p.sy>.3));assert.ok(pieces.rocks.some(p=>p.sy<.1));assert.ok(new Set(pieces.fractures.map(p=>p.angle.toFixed(1))).size>5);for(const p of pieces.fractures)assert.ok(Math.abs(p.y-(p.x*.1+p.z*.02+.045))<.00001);assert.deepEqual(pieces,earthImpactPieces(e,1.25,(x,z)=>x*.1+z*.02));
});
test('global water/earth art persists through particle coupling, caps four draw calls and never mutates gameplay state',()=>{
 const scene=new T.Scene(),art=createElementImpactArt({scene}),s=state([event('water'),event('earth',2)]),before=structuredClone(s);art.update(s,1,()=>0);assert.equal(art.handles(s.effects[0],s,1),true);assert.ok(art.stats().water>30);assert.ok(art.stats().rocks>0);assert.ok(art.stats().fractures>0);for(let i=1;i<=30;i++)art.update(s,1+i/60,()=>0);assert.ok(art.stats().fluid.pairs>0);assert.ok(art.stats().fluid.steps>0);assert.ok(art.stats().drawCalls<=4);assert.deepEqual(s,before);art.dispose();art.dispose();assert.equal(scene.children.length,0);
});
test('maximum effects reuse the same meshes/buffers, retain fallback when full, and reset after map changes and teleport',()=>{
 const art=createElementImpactArt({scene:new T.Scene()}),s=state(Array.from({length:50},(_,i)=>event(i%2?'water':'earth',i))),meshes=[...art.root.children],geometries=meshes.map(m=>m.geometry);art.update(s,1,()=>0);assert.ok(art.stats().water<=B.waterParticles);assert.ok(art.stats().rocks<=B.rocks);assert.ok(art.stats().earthEvents<=B.earthEvents);assert.ok(art.stats().dropped>0);assert.equal(art.handles(event('earth',999),s,1),false);art.update({...s,effects:[]},1.1,()=>0);assert.deepEqual(art.root.children,meshes);assert.deepEqual(art.root.children.map(m=>m.geometry),geometries);art.update({...s,seed:2,effects:[]},1.2,()=>0);assert.equal(art.stats().water,0);art.dispose();
});
test('the already-connected RO area renderer owns fluid/earth and does not duplicate old ice cards for liquid zones',()=>{
 const scene=new T.Scene(),art=createRoElementAreaArt({scene}),s={options:{mode:'bonk'},time:1,effects:[],bonk:{elapsed:1,roSkillZones:[{id:1,key:'sa_deluge',x:0,z:0,radius:3,until:5,weapon:{element:'ice'}}]}};assert.equal(roElementAreaParticles(s,1).length,0);for(let i=0;i<30;i++)art.update(s,1+i/60,()=>0,new T.PerspectiveCamera());assert.ok(art.stats().waterEarth.water>0);assert.equal(scene.children.length,4);art.dispose();assert.equal(scene.children.length,0);
});

test('the external effect gate admits its first event before update and explicit reset clears all water and fracture state',()=>{
 const art=createRoElementAreaArt({scene:new T.Scene()}),s=state([event('water'),event('earth',2)]);assert.equal(art.handles(s.effects[0],s,1),true);assert.equal(art.handles(s.effects[1],s,1),true);art.update(s,1,()=>2,new T.PerspectiveCamera());assert.ok(art.stats().waterEarth.water>0);assert.ok(art.stats().waterEarth.rocks>0);art.reset();assert.equal(art.stats().waterEarth.fluid.particles,0);assert.equal(art.stats().waterEarth.rocks,0);art.dispose();
});
