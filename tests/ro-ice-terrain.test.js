import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {roHasFrozenTerrain,roIcePatches,roIceWeightAt,roIceMovement} from '../shared/ro-ice-terrain.js';
import {createBonkWorld} from '../src/bonk-world.js';

const frozen=(key='ice-cavern',seed=29)=>{const r=roWorldRegion(key);return generateBonkLevel(seed,r.scene,r.habitat,r);};
function setup(){const g=new Game(29,{mode:'bonk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p'),map=frozen(),pool=roIcePatches(map)[0];g.bonk.map=map;g.bonk.spawnAt=Infinity;g.bonk.objects=[];g.bonk.pickups=[];g.units=[u];u.x=pool.x;u.z=pool.z;u.bonkSkillAuto=Object.fromEntries(Object.keys(u.bonkBuild.weapons).map(k=>[k,false]));return{g,u,map,pool};}
const tick=(g,n)=>{for(let i=0;i<n;i++)g.tick(.05);};

test('frozen pools are deterministic, optional and leave spawn, entries and MVP arenas safe',()=>{
 for(const key of ['ice-cavern','lutie'])for(const seed of [1,29,73,124]){const map=frozen(key,seed),before=JSON.stringify(map),pools=roIcePatches(map);assert.equal(pools.length,7);assert.deepEqual(pools,roIcePatches(structuredClone(map)));assert.equal(JSON.stringify(map),before);for(const p of pools){assert.equal(roIceWeightAt(map,p.x,p.z),1);for(const safe of [map.spawn,map.route.entry,map.route.bossArena])assert.equal(roIceWeightAt(map,safe.x,safe.z),0);}}
 const ordinary=generateBonkLevel(29,'grove');assert.equal(roHasFrozenTerrain(ordinary),false);assert.deepEqual(roIcePatches(ordinary),[]);assert.deepEqual(roIcePatches({...frozen(),tower:{}}),[]);
});

test('real movement glides briefly on ice, decelerates and brakes normally on snow',()=>{
 const{g,u,map}=setup();g.command('p',{type:'bkMove',dx:1,dz:0});tick(g,8);const running=u.x;g.command('p',{type:'bkMove',dx:0,dz:0});tick(g,8);assert.ok(u.x-running>.5,'releasing movement leaves visible momentum');assert.ok(u.x-running<3,'glide remains controlled');tick(g,36);assert.ok(Math.hypot(u.roIceMotion.x,u.roIceMotion.z)<.035);
 u.x=map.spawn.x;u.z=map.spawn.z;g.command('p',{type:'bkMove',dx:1,dz:0});tick(g,2);g.command('p',{type:'bkMove',dx:0,dz:0});const stopped=u.x;tick(g,6);assert.equal(u.x,stopped,'snow restores ordinary immediate grip');
});

test('ice turning carries momentum without exceeding speed and other biomes keep ordinary movement',()=>{
 const map=frozen(),p=roIcePatches(map)[0],u={x:p.x,z:p.z},speed=8;
 for(let i=0;i<12;i++)roIceMovement(map,u,{dx:1,dz:0},.05,speed);const turning=roIceMovement(map,u,{dx:0,dz:1},.05,speed);assert.ok(turning.dx>0&&turning.dz>0);assert.ok(turning.speed<=speed);
 const normal=roIceMovement(generateBonkLevel(3,'grove'),u,{dx:0,dz:1},.05,speed);assert.deepEqual(normal,{dx:0,dz:1,speed});assert.equal(u.roIceMotion,undefined);
 const next=frozen('lutie',30),q=roIcePatches(next)[0];Object.assign(u,{x:q.x,z:q.z});const fresh=roIceMovement(next,u,{dx:0,dz:0},.05,speed);assert.equal(fresh.speed,0,'changing regions cannot retain old momentum');
});

test('sliding still collides with walls and a level offer clears momentum',()=>{
 const{g,u,map,pool}=setup();map.obstacles.push({x:pool.x+1.4,z:pool.z,w:.5,d:12,h:4,alive:true});g.command('p',{type:'bkMove',dx:1,dz:0});tick(g,12);assert.ok(u.x<=pool.x+1.4-.25-u.collisionRadius+.01);g.command('p',{type:'bkMove',dx:0,dz:0});tick(g,5);assert.equal(u.roIceMotion.x,0);
 map.obstacles=[];Object.assign(u,{x:pool.x,z:pool.z});g.command('p',{type:'bkMove',dx:1,dz:0});tick(g,4);g.bonk.pickups=[{id:g.id(),x:u.x,z:u.z,type:'xp',value:30,age:0}];tick(g,1);assert.equal(g.bonk.stage,'levelup');assert.equal(u.roIceMotion,undefined);const before={x:u.x,z:u.z};tick(g,4);assert.deepEqual({x:u.x,z:u.z},before);
});

test('frozen ground renders the shared blue pools, snowy paths and bounded drifts without new batches',()=>{
 const scene=new T.Scene(),view=createBonkWorld({scene}),map=frozen(),before=JSON.stringify(map);try{view.update({options:{mode:'bonk'},bonk:{map,objects:[],pickups:[],projectiles:[],objectives:[]}},0);const floor=view.root.getObjectByName('bonk-organic-ground'),kind=floor.geometry.getAttribute('pixelTerrainKind');assert.ok([...kind.array].every(v=>v===2),'paths also use ice, never brown earth');assert.ok(view.root.getObjectByName('bonk-ground-details').count<=6500);const colors=floor.geometry.getAttribute('color');let snowy=0,blue=0;for(let i=0;i<colors.count;i++){if(colors.getX(i)>.65&&colors.getY(i)>.72&&colors.getZ(i)>.8)snowy++;if(colors.getZ(i)>colors.getX(i)*1.8&&colors.getY(i)>colors.getX(i)*1.3)blue++;}assert.ok(snowy>100);assert.ok(blue>100);assert.equal(JSON.stringify(map),before);}finally{view.dispose();}assert.equal(scene.children.length,0);
});
