import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createBloodyTournamentWorld,bloodyWorldTile} from '../src/bloody-tournament-world.js';
import {BLOODY_TERRAIN_DATA as DATA} from '../shared/bloody-terrain-data.js';
import {BLOODY_BATTLEFIELD as FIELD,bloodyTerrainBlocked,BLOODY_WORLD_SCALE as S,bloodyHeightAt,bloodyPreparationPoint} from '../shared/bloody-battlefield.js';

const stateFor=(count=8)=>({options:{mode:'bloody'},bloodyTournament:{stage:'preparation',formations:FIELD.preparationPlots.slice(0,count).map((p,i)=>({...p,owner:'p'+i,team:i+1})),players:FIELD.preparationPlots.slice(0,count).map((p,i)=>({owner:'p'+i,roster:Array.from({length:12},(_,j)=>({id:100*i+j,key:'shieldwall',x:p.minX+.6+(j%4)*2,z:p.minZ+.5+Math.floor(j/4)*1.2}))}))}});
test('native source painting produces an irregular four-biome island and eight green preparation gardens surrounded by water',()=>{
 assert.equal(bloodyWorldTile(-30*S,-30*S).water,true);
 assert.equal(bloodyWorldTile(0,-15*S).rawId,'cBc2');
 assert.equal(bloodyWorldTile(-15*S,0).rawId,'Dbrk');
 assert.equal(bloodyWorldTile(15*S,0).rawId,'Arck');
 assert.equal(bloodyWorldTile(0,15*S).rawId,'cIc1');
 for(const plot of FIELD.preparationPlots.filter(p=>p.native)){
  let green=0;for(let x=plot.minX;x<plot.maxX;x+=.5)for(let z=plot.minZ;z<plot.maxZ;z+=.5)if(['Avin','Xhdg'].includes(bloodyWorldTile(x,z).rawId))green++;
  assert.ok(green>100,plot.name+' retains the source grass patches');
 }
 const world=createBloodyTournamentWorld({scene:new T.Scene()});try{
  world.update(stateFor(),1,'p0');let wet=0;for(let row=0;row<DATA.height-1;row++)for(let col=0;col<DATA.width-1;col++)if(bloodyWorldTile((DATA.origin[0]+col+.5)*S,(DATA.origin[1]-row-.5)*S).water)wet++;
  assert.equal(world.root.getObjectByName('bt-native-water').count+world.root.getObjectByName('bt-native-lava').count,wet);
  assert.ok(world.root.getObjectByName('bt-native-land').count>2500);
  assert.ok(world.root.getObjectByName('bt-native-lava').count>100);
  assert.equal(world.root.getObjectByName('bt-adapted-gardens').count,0,'native eight-player layout does not acquire invented side pods');
 }finally{world.dispose();}
});

test('walkable shallow water and native landmarks have correct ground anchors without a fabricated wall enclosure',()=>{
 const world=createBloodyTournamentWorld({scene:new T.Scene()}),matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion();
 try{
  world.update(stateFor(),1,'p0');const architecture=world.root.getObjectByName('bt-native-architecture');architecture.getMatrixAt(0,matrix);matrix.decompose(position,rotation,scale);
  assert.ok(Math.abs(position.x-DATA.placements[0].x*S)<.0001);assert.ok(Math.abs(position.z-DATA.placements[0].z*S)<.0001);
  const surface=world.root.getObjectByName('bt-relief-surface'),vertices=surface.geometry.attributes.position;let raised=0;for(let i=0;i<vertices.count;i+=17){assert.ok(Math.abs(vertices.getY(i)-bloodyHeightAt(vertices.getX(i),vertices.getZ(i)))<.0001,'continuous visible surface agrees with actor ground height');if(vertices.getY(i)>3)raised++;}assert.ok(raised>10,'central terrain has a visible walkable summit');
  const water=world.root.getObjectByName('bt-native-water');let shallow=0,deep=0;for(let i=0;i<water.count;i++){water.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);const top=position.y+scale.y/2;if(top-bloodyHeightAt(position.x,position.z)>-.1)shallow++;else deep++;if(!bloodyTerrainBlocked({x:position.x,z:position.z}))assert.ok(Math.abs(top-bloodyHeightAt(position.x,position.z))<.03,'a troop on a walkable water tile must not hover above a depressed water plane');}
  assert.ok(shallow>0&&deep>0);assert.equal(world.root.getObjectByName('bt-architecture'),undefined,'old generic rectangular enclosure is removed');
  const lava=world.root.getObjectByName('bt-native-lava').material;assert.ok(lava.vertexShader.includes('instanceMatrix*p'));assert.ok(lava.fragmentShader.includes('noise2'));assert.equal(lava.uniforms.uTime.value,1);
 }finally{world.dispose();}
});

test('ten-player adaptation stays isolated and all roster markers fit bounded batches that are reused and disposed',()=>{
 const scene=new T.Scene(),world=createBloodyTournamentWorld({scene}),state=stateFor(10);try{
  world.update(state,0,'p8');assert.ok(world.root.getObjectByName('bt-roster-models').count>3600,'rosters show all three shield-bearing models rather than cubes');assert.equal(world.root.getObjectByName('bt-placement').count,0);assert.equal(world.root.getObjectByName('bt-adapted-gardens').count,16);
  assert.ok(FIELD.preparationPlots[8].maxX<-48);assert.ok(FIELD.preparationPlots[9].minX>48);
  const meshes=[...world.root.children],materials=new Set(meshes.map(m=>m.material)),geometries=new Set(meshes.map(m=>m.geometry));let released=0;for(const m of materials)m.addEventListener('dispose',()=>released++);for(const g of geometries)g.addEventListener('dispose',()=>released++);
  for(let frame=1;frame<25;frame++)world.update(state,frame/10,'p8');assert.deepEqual(world.root.children,meshes);assert.ok(meshes.length<=20);
  for(const mesh of meshes)if(mesh.isInstancedMesh){assert.ok(mesh.count<=mesh.instanceMatrix.count);for(const value of mesh.instanceMatrix.array)assert.ok(Number.isFinite(value));}
  const entry=state.bloodyTournament.players[8].roster[0];assert.deepEqual(world.pick(entry),{bloodyEntry:entry.id,bloodyOwner:'p8'});
  world.update({options:{mode:'tower'}},4);assert.equal(world.root.visible,false);world.dispose();assert.equal(released,materials.size+geometries.size);assert.equal(scene.children.length,0);
 }finally{world.dispose();}
});

test('placement uses complete recognizable unit models; volcanic flames, smoke and embers animate in bounded reusable batches',()=>{
 const world=createBloodyTournamentWorld({scene:new T.Scene()}),state=stateFor(),p=FIELD.preparationPlots[0].center;
 try{
  world.setPlacement({key:'aircraft',point:p,valid:true,owner:'p0'});world.update(state,1,'p0');
  const preview=world.root.getObjectByName('bt-placement-preview');assert.ok(preview.count>30,'two rotor aircraft have real body, wing and rotor parts');
  const flames=world.root.getObjectByName('bt-fire-flames'),smoke=world.root.getObjectByName('bt-fire-smoke'),embers=world.root.getObjectByName('bt-fire-embers');
  assert.ok(flames.count>60&&smoke.count>20&&embers.count>30);
  const before=Array.from(flames.instanceMatrix.array);world.update(state,1.3,'p0');assert.notDeepEqual(Array.from(flames.instanceMatrix.array),before,'fire rises and changes shape');assert.equal(world.root.getObjectByName('bt-fire-flames'),flames);
  world.setPlacement(null);world.update(state,1.5,'p0');assert.equal(preview.count,0);
  world.setBuildKey('hunters','p0');world.setCursor(p,false);world.update(state,1.6,'p0');assert.ok(world.root.getObjectByName('bt-placement-preview').count>30);assert.equal(world.root.getObjectByName('bt-placement-validity').count,12);
 }finally{world.dispose();}
});

test('placement validity reports the actual owned plot, occupied ground and purchase economy',()=>{
 const world=createBloodyTournamentWorld({scene:new T.Scene()}),state=stateFor(),player=state.bloodyTournament.players[0],validPoint=bloodyPreparationPoint(0,FIELD.preparationPlots[0].center,player.roster),colour=new T.Color();
 player.roster.splice(2);player.gold=1000;player.food=0;
 const read=()=>{world.root.getObjectByName('bt-placement-validity').getColorAt(0,colour);return colour.getHex();};
 try{
  world.setPlacement({key:'hunters',point:validPoint,owner:'p0'});world.update(state,1,'p0');assert.equal(read(),0xb9dca2);
  player.gold=0;world.update(state,1.1,'p0');assert.equal(read(),0xdf7668,'unaffordable groups have a red preview');
  player.gold=1000;world.setPlacement({key:'hunters',point:FIELD.preparationPlots[1].center,owner:'p0'});world.update(state,1.2,'p0');assert.equal(read(),0xdf7668,'allied and enemy plots cannot be purchased into');
  world.setPlacement({key:'hunters',point:player.roster[0],owner:'p0'});world.update(state,1.3,'p0');assert.equal(read(),0xdf7668,'occupied entries reject placement');
 }finally{world.dispose();}
});
