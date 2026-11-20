import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game} from '../shared/simulation.js';
import {PHASE_KILLER_MAP as MAP} from '../shared/phase-killer-catalog.js';
import {phaseKillerWorldObstacles,phaseKillerForestObstacles,phaseKillerHeightAt,phaseKillerBuildingApproach,PHASE_TOWN,PHASE_CAMPFIRES} from '../shared/phase-killer-world.js';
import {phaseChurchArt,phaseFountainArt} from '../src/phase-killer-scenery-art.js';
import {castlePassable,castleRouteAvailable} from '../shared/castle-navigation.js';
import {createPhaseKillerWorld} from '../src/phase-killer-world.js';
const context=()=>({map:MAP.normal,buildings:phaseKillerWorldObstacles().filter(b=>b.dimension==='normal'),obstacles:phaseKillerForestObstacles('normal')});
test('the expanded town has thirty-four houses with reachable doors, a clear central fountain plaza and a corner stone church',()=>{
 const ctx=context(),houses=ctx.buildings.filter(b=>b.phaseProp==='house');assert.equal(houses.length,34);assert.equal(new Set(houses.map(b=>b.id)).size,34);assert.ok(Math.min(...houses.map(b=>b.x))<35&&Math.max(...houses.map(b=>b.x))>130);assert.ok(Math.min(...houses.map(b=>b.z))<-65&&Math.max(...houses.map(b=>b.z))>0);
 for(const b of houses){const door=phaseKillerBuildingApproach(b);assert.ok(castlePassable(ctx,door,.3),b.id+' doorway must stay free');assert.ok(castleRouteAvailable(ctx,MAP.spawn,door,.3),b.id+' must be accessible from arrival');}
 const church=ctx.buildings.find(b=>b.phaseProp==='church'),fountain=ctx.buildings.find(b=>b.phaseProp==='fountain');assert.equal(church.id,PHASE_TOWN.church.id);assert.ok(church.x>120&&church.z>0);assert.equal(castlePassable(ctx,church,.3),false);assert.ok(castleRouteAvailable(ctx,MAP.spawn,phaseKillerBuildingApproach(church),.3));assert.equal(fountain.x,PHASE_TOWN.plaza.x);assert.equal(fountain.z,PHASE_TOWN.plaza.z);assert.equal(castlePassable(ctx,fountain,.3),false);
 for(let i=0;i<12;i++){const angle=i*Math.PI/6;assert.ok(castlePassable(ctx,{x:fountain.x+Math.sin(angle)*5.5,z:fountain.z+Math.cos(angle)*5.5},.3),'the fountain can be circled');}
 const palette={wood:0x65513f,roof:0x556677,wall:0xaaaaaa,accent:0xe2b66d};for(const [b,art]of [[church,phaseChurchArt(church,palette)],[fountain,phaseFountainArt(fountain,palette)]]){assert.equal(art.parts[0][3],b.w);assert.equal(art.parts[0][5],b.d);assert.ok(art.parts.length>8);}assert.ok(phaseChurchArt(church,palette).height>12);
 for(const camp of PHASE_CAMPFIRES){assert.ok(castlePassable(ctx,camp,.3));assert.ok(castleRouteAvailable(ctx,MAP.spawn,camp,.3));}
});
test('west mountain is a real gradual height field shared with the organic terrain and every anchored trunk',()=>{
 assert.equal(phaseKillerHeightAt(82,-19),0);assert.ok(phaseKillerHeightAt(-60,-44)>11);assert.ok(phaseKillerHeightAt(-20,-44)>3);
 for(let x=-70;x<20;x+=2)for(let z=-70;z<12;z+=4){const h=phaseKillerHeightAt(x,z);assert.ok(Math.abs(phaseKillerHeightAt(x+1,z)-h)<.65);assert.ok(Math.abs(phaseKillerHeightAt(x,z+1)-h)<.65);assert.ok(Math.abs(phaseKillerHeightAt(x,z+128)-h)<1e-8);}
 const world=createPhaseKillerWorld({scene:new T.Scene()});try{world.update({options:{mode:'phasekiller'},phaseKiller:{dimension:'normal',fields:[]}},1);const ground=world.root.getObjectByName('phase-floor'),p=ground.geometry.attributes.position;assert.equal(ground.count,1);assert.ok(ground.geometry.index&&p.count>3000);let min=Infinity,max=-Infinity;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);min=Math.min(min,y);max=Math.max(max,y);assert.ok(Math.abs(y-phaseKillerHeightAt(x,z))<.00002);}assert.ok(max-min>11);
  const trees=phaseKillerForestObstacles('normal').filter(o=>o.phaseProp==='tree'),index=trees.findIndex(o=>o.x<-40),trunks=world.root.getObjectByName('phase-trunks'),matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion();trunks.getMatrixAt(index,matrix);matrix.decompose(position,rotation,scale);assert.ok(Math.abs(position.y-scale.y/2-phaseKillerHeightAt(position.x,position.z))<.00001);
  const before=Array.from(trunks.instanceMatrix.array);world.update({options:{mode:'phasekiller'},phaseKiller:{dimension:'normal',fields:[]}},2);assert.deepEqual(Array.from(trunks.instanceMatrix.array),before,'wind never moves trunk colliders or instances');const shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};world.root.getObjectByName('phase-trees').material.onBeforeCompile(shader);assert.ok(shader.vertexShader.includes('if(phaseCanopy>0.5)'));
 }finally{world.dispose();}
});
test('already enlarged saves gain the expanded town once without changing coordinates or reviving destroyed houses',()=>{
 const game=new Game(6,{mode:'phasekiller'});game.addPlayer('a','townsperson');game.initPhaseKiller();const p=game.phaseKiller,house=p.buildings.find(b=>b.phaseProp==='house');p.buildings=p.buildings.filter(b=>!b.browserAdaptation);house.alive=false;house.destroyed=true;delete p.levelRevision;const hero=game.player('a'),before={x:hero.x,z:hero.z,hp:hero.hp,speed:hero.speed};assert.equal(game.migratePhaseKillerScale(),true);assert.deepEqual({x:hero.x,z:hero.z,hp:hero.hp,speed:hero.speed},before);assert.equal(p.buildings.filter(b=>b.phaseProp==='house').length,34);assert.equal(p.buildings.find(b=>b.id===house.id).alive,false);const revision=p.sceneryRevision;assert.equal(game.migratePhaseKillerScale(),false);assert.equal(p.sceneryRevision,revision);
});
