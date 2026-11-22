import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bonkObjectParts,bonkMonumentParts,bonkRockParts} from '../src/bonk-prop-art.js';
import {bonkNavigation,bonkStatsMarkup} from '../src/bonk-ui.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {RO_PROJECTILE_ART_BUDGET} from '../src/ro-projectile-art.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {createBattlefield} from '../src/battlefield.js';
const palette={dark:0x304533,stone:0x8e997d,glow:0xe6d798};

test('switching from a generic battlefield to Bonk removes every opaque collider proxy',()=>{
 const scene=new T.Scene(),field=createBattlefield(scene);field.update({options:{mode:'campaign'},obstacles:[{x:0,z:0,w:3,d:3,h:5,type:'rock'}]});assert.equal(scene.children[1].children.length,1);
 for(const key of ['grove','forge','glacier']){const map=generateBonkLevel(26,key);assert.ok(map.obstacles.length>100);field.update({options:{mode:'bonk'},obstacles:map.obstacles});assert.equal(scene.children[1].children.length,0,'detailed silhouettes remain exposed; collision boxes are not artwork');}
});

test('opening a chest lifts its lid clear of the loot cavity and used pots disappear',()=>{
 const closed=bonkObjectParts({type:'chest'},palette),open=bonkObjectParts({type:'chest',used:true},palette);
 assert.ok(Math.max(...closed.map(p=>p[1]+p[4]/2))<.9);
 assert.ok(Math.max(...open.map(p=>p[1]+p[4]/2))>1.3);
 assert.deepEqual(bonkObjectParts({type:'pot',used:true},palette),[]);
 const pot=bonkObjectParts({type:'pot'},palette);assert.ok(pot.some(p=>p[0]>.4));assert.ok(pot.some(p=>p[0]<-.4));
 // The rim is a ring, with no filled square across its opening.
 assert.ok(pot.filter(p=>p[1]>.7).every(p=>Math.hypot(p[0],p[2])>.18));
});

test('guardian monuments have distinct bounded silhouettes and no negative geometry',()=>{
 for(const stage of ['grove','forge','glacier']){
  const shapes=[0,1,2].map(i=>bonkMonumentParts(i,stage,palette));assert.notDeepEqual(shapes[0],shapes[1]);assert.notDeepEqual(shapes[1],shapes[2]);
  for(const parts of shapes)for(const p of parts){assert.ok(p.slice(0,6).every(Number.isFinite));assert.ok(p.slice(3,6).every(n=>n>0));assert.ok(p[1]-p[4]/2>=-.001);assert.ok(p[1]+p[4]/2<5.8);}
 }
});

test('navigation prioritises a guardian already awakened, then the nearest unrevealed rune and finally the temple',()=>{
 const u={x:0,z:0},data={objectives:[{id:'a',x:0,z:-10,name:'Perto'},{id:'b',x:50,z:20,name:'Ativo',started:true},{id:'c',x:-20,z:40,completed:true}]};
 assert.equal(bonkNavigation(data,u).id,'b');data.objectives[1].completed=true;assert.equal(bonkNavigation(data,u).id,'a');assert.equal(bonkNavigation(data,u).direction,'N');
 data.objectives[0].completed=true;const target=bonkNavigation(data,{x:30,z:40});assert.equal(target.id,'temple');assert.equal(target.distance,50);assert.equal(target.direction,'NO');
 const html=bonkStatsMarkup({damage:1.44,haste:1.18,area:1.22,crit:.2,armor:8,amount:3});for(const v of ['1.44','1.18','1.22','20%','+3'])assert.ok(html.includes(v));assert.doesNotMatch(html,/NaN|undefined/);
});

test('full loot and projectile loads stay inside reusable rendering budgets through all three stage transitions',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene});
 try{for(const key of ['grove','forge','glacier']){
  const map=generateBonkLevel(513,key),state={options:{mode:'bonk'},units:[{bonkHero:true,alive:true,x:0,z:23}],bonk:{map,objects:map.objects,objectives:map.landmarks,pickups:Array.from({length:450},(_,i)=>({id:i,x:i%30,z:Math.floor(i/30),type:i%2?'xp':'gold',value:4})),projectiles:Array.from({length:250},(_,i)=>({id:i,x:i%20,z:Math.floor(i/20),dx:1,dz:0,element:i%2?'fire':'ice'}))}};
  world.update(state,2);const children=world.root.children.slice();world.update(state,3);assert.deepEqual(world.root.children,children);
  const interactionGlow=world.root.getObjectByName('bonk-interaction-glow');assert.ok(interactionGlow);assert.ok(children.filter(child=>child!==interactionGlow&&child.name!=='ro-filled-ground-areas'&&child.name!=='ro-nature-details').length<=14);assert.ok(world.stats().interactionGlow.drawCalls<=1);assert.ok(world.stats().groundAreas.drawCalls<=1);assert.ok(world.stats().nature.drawCalls<=2);assert.equal(world.stats().nature.lights,0);for(const mesh of children.filter(c=>c.isInstancedMesh)){assert.ok(mesh.count<=mesh.instanceMatrix.count,mesh.name);const m=new T.Matrix4();for(let i=0;i<mesh.count;i+=31){mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite),mesh.name);}}
  if(key==='grove')assert.equal(world.root.getObjectByName('bonk-weather').count,0,'forest uses canopy leaves rather than hero-relative weather');else assert.ok(world.root.getObjectByName('bonk-weather').count>60);assert.ok(world.root.getObjectByName('bonk-interactables').count>1000);assert.equal(world.root.getObjectByName('bonk-shots').count,RO_PROJECTILE_ART_BUDGET.instances);
 }}finally{world.dispose();}assert.equal(scene.children.length,0);
});

test('rock columns form an irregular footprint within the authoritative solid dimensions',()=>{for(const id of ['a','b','c']){const rock={id,w:3.7,d:2.9,h:4},parts=bonkRockParts(rock,palette);assert.ok(parts.length>20);assert.ok(parts.length<45);for(const [x,y,z,w,h,d]of parts){assert.ok(Math.abs(x)+w/2<=rock.w/2+.01);assert.ok(Math.abs(z)+d/2<=rock.d/2+.01);assert.ok(y-h/2>=-.001);}const occupied=new Set(parts.map(p=>p[0].toFixed(2)+','+p[2].toFixed(2)));assert.ok(occupied.size<42,'corners are carved out of the rock footprint');}});
