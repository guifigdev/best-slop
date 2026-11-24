import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {CASTLE_BUILDINGS} from '../shared/castle-catalog.js';
import {buildingModelSpec,createCastleBuildingArt,castleBuildingPortrait} from '../src/castle-building-art.js';
import {createCastleView} from '../src/castle-view.js';

const structure=spec=>JSON.stringify(spec.boxes.map(({x,y,z,w,h,d})=>[x,y,z,w,h,d]));
test('all 161 building identities have different physical voxel compositions, safe portraits and bounded native footprints',()=>{
 const before=JSON.stringify(CASTLE_BUILDINGS),models=new Set();let max=0;
 for(const [key,b]of Object.entries(CASTLE_BUILDINGS)){
  const spec=buildingModelSpec(key);assert.equal(spec.name,b.name);assert.deepEqual(spec.footprint,b.footprint);assert.ok(Object.isFrozen(spec)&&Object.isFrozen(spec.boxes));
  const signature=structure(spec);assert.equal(models.has(signature),false,key+' duplicates an earlier silhouette');models.add(signature);max=Math.max(max,spec.boxes.length);
  for(const box of spec.boxes){assert.ok([box.x,box.y,box.z,box.w,box.h,box.d,box.color].every(Number.isFinite),key);assert.ok(box.w>0&&box.h>0&&box.d>0);assert.ok(Math.abs(box.x)+box.w/2<=b.footprint.w/2+1e-6,key+' width');assert.ok(Math.abs(box.z)+box.d/2<=b.footprint.d/2+1e-6,key+' depth');}
  const svg=castleBuildingPortrait(key);assert.match(svg,/<svg .*viewBox="0 0 128 128"/);assert.match(svg,/<title>/);assert.doesNotMatch(svg,/NaN|undefined|Infinity|<script|<image|href=/i);assert.equal(svg,castleBuildingPortrait(key));
 }
 assert.equal(models.size,Object.keys(CASTLE_BUILDINGS).length);assert.ok(max<=64,'bounded static geometry budget after facade detailing');assert.equal(JSON.stringify(CASTLE_BUILDINGS),before);assert.equal(buildingModelSpec('__proto__'),null);assert.equal(castleBuildingPortrait('missing'),'');
});

test('mechanical factories depict their actual output through substantial architectural features',()=>{
 const required={mech_h05J:['hangar','heliport','rotor'],mech_h09L:['hangar','bomb-rack','fuel-tank'],mech_h05V:['forge','furnace','statue-body'],mech_h097:['forge','gantry','crystal'],mech_h05M:['explosive-vat','dynamite','blast-roof'],mech_h05T:['gun-rack','workbench'],mech_h09P:['armory','weapon-bay'],mech_h05U:['conveyor','logs','saw'],mech_h05X:['tracks','assembly-bay'],mech_h09H:['rocket','launcher'],mech_h09I:['crane','tracks'],mech_h09B:['reinforcement','gantry'],mech_h09J:['mine-crate','mine']};
 for(const [key,parts]of Object.entries(required)){const spec=buildingModelSpec(key);for(const part of parts)assert.ok(spec.boxes.some(b=>b.part===part),key+' lacks '+part);}
 assert.notEqual(structure(buildingModelSpec('mech_h05T')),structure(buildingModelSpec('mech_h09P')));
 const gun=buildingModelSpec('mech_h05T'),arsenal=buildingModelSpec('mech_h09P');assert.ok(arsenal.height>gun.height);assert.ok(arsenal.boxes.filter(b=>b.part==='chimney').length>gun.boxes.filter(b=>b.part==='chimney').length);
});

test('all races include non-house silhouettes tied to native producer identities',()=>{
 for(const [key,family,part]of [['human_h037','chapel','bell-spire'],['naga_h00I','pyramid','pyramid-step'],['chaos_h01F','volcano','magma-crater'],['elf_h005','obelisk','beacon'],['undead_h054','graveyard','headstone'],['orc_h02R','totem','carved-face'],['north_h03U','igloo','igloo-layer'],['corrupted_h04V','livingtree','tree-face'],['nightelf_h08P','grove','moonwell']]){const spec=buildingModelSpec(key);assert.equal(spec.family,family,key);assert.ok(spec.boxes.some(b=>b.part===part),key);}
 for(const [key,b]of Object.entries(CASTLE_BUILDINGS))for(const upgrade of b.upgradesTo||[]){const next=typeof upgrade==='string'?upgrade:upgrade.key;if(CASTLE_BUILDINGS[next])assert.notEqual(structure(buildingModelSpec(key)),structure(buildingModelSpec(next)),key+' upgrade retains identical architecture');}
});

test('one cached mesh per building shares resources until the final owner releases them',()=>{
 const a=createCastleBuildingArt('mech_h05J'),b=createCastleBuildingArt('mech_h05J'),c=createCastleBuildingArt('mech_h05V');let geometry=0,material=0;a.geometry.addEventListener('dispose',()=>geometry++);a.material.addEventListener('dispose',()=>material++);
 assert.equal(a.geometry,b.geometry);assert.notEqual(a.geometry,c.geometry);assert.equal(a.material,c.material);assert.equal(a.children.length,0);assert.equal(a.material.map,null);assert.equal(a.geometry.groups.length,0);assert.ok(a.geometry.attributes.color);a.userData.dispose();assert.equal(geometry,0);b.userData.dispose();assert.equal(geometry,1);assert.equal(material,0);c.userData.dispose();assert.equal(material,1);a.userData.dispose();assert.equal(material,1);
});

function fixture(){
 const scene=new T.Scene(),mat=new T.MeshLambertMaterial({vertexColors:true});
 const voxel=(parent,x,y,z,w,h,d,color)=>{const geo=new T.BoxGeometry(1,1,1),c=new T.Color(color),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geo.setAttribute('color',new T.BufferAttribute(colors,3));const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);};
 const bake=group=>{const chunks=group.children.map(m=>{m.updateMatrix();const g=m.geometry.clone();g.applyMatrix4(m.matrix);m.geometry.dispose();return g;}),geo=mergeGeometries(chunks);chunks.forEach(g=>g.dispose());group.clear();const m=new T.Mesh(geo,mat);group.add(m);return m;};
 const view=createCastleView({scene,voxel,bake}),key='mech_h05J',base={key,owner:'p',team:1,alive:true,w:3,d:3,hp:100,maxHp:100,readyAt:0},map={width:20,depth:20,minX:-10,maxX:10,minZ:-10,maxZ:10,lanes:[],buildZones:[],tower:{x:0,z:-8}};
 const buildings=[{...base,id:1,x:-2,z:0},{...base,id:2,x:3,z:0},{...base,id:3,x:100,z:0},{...base,id:4,x:0,z:0,owner:'q'},{...base,id:5,x:0,z:0,alive:false},{...base,id:6,x:0,z:0,key:'mech_h05V'}],state={options:{mode:'castlefight'},units:[],castleFight:{map,buildings,teams:[],players:{p:{team:1}},elapsed:1}},camera=new T.PerspectiveCamera(55,1,.1,50);camera.position.set(0,15,15);camera.lookAt(0,1,0);camera.updateProjectionMatrix();
 return{scene,view,state,camera,cleanup(){view.dispose();mat.dispose();}};
}
test('Castle view renders each selected building ring with one reusable instanced batch',()=>{
 const f=fixture();try{f.view.setSelection([1,2,6]);f.view.update(f.state,null,null,'p');const floor=f.scene.getObjectByName('castle-pixel-ground');assert.ok(floor.material.userData.pixelTerrain);assert.equal(floor.geometry.attributes.pixelTerrainKind.count,floor.geometry.attributes.position.count);assert.equal(f.scene.getObjectByName('castle-building-mech_h05J').material.userData.pixelTerrain,undefined);const rings=f.scene.getObjectByName('castle-selected-buildings');assert.ok(rings.isInstancedMesh);assert.equal(rings.count,3);assert.ok(f.scene.getObjectByName('castle-building-mech_h05J'));const matrix=new T.Matrix4();rings.getMatrixAt(1,matrix);assert.equal(matrix.elements[12],3);assert.equal(matrix.elements[14],0);f.view.setSelection(null);f.view.update(f.state,null,null,'p');assert.equal(rings.count,0);f.view.setSelection(1);f.view.update(f.state,null,null,'p');assert.equal(rings.count,1);}finally{f.cleanup();}
});
test('visibleMatches respects model frustum intersection, native identity, ownership and life',()=>{
 const f=fixture();try{f.view.update(f.state,null,null,'p');assert.deepEqual(f.view.visibleMatches(1,f.camera),[1,2]);assert.deepEqual(f.view.visibleMatches(999,f.camera),[]);assert.deepEqual(f.view.visibleMatches(1,null),[]);f.camera.position.set(100,15,15);f.camera.lookAt(100,1,0);assert.deepEqual(f.view.visibleMatches(1,f.camera),[3]);}finally{f.cleanup();}
});

test('visual ray picking selects a high rooftop whose projected ground point misses the footprint',()=>{
 const f=fixture();try{
  f.view.update(f.state,null,null,'p');
  const origin=new T.Vector3(0,15,15),roof=new T.Vector3(-3.02,3.105,-.9),direction=roof.clone().sub(origin).normalize(),raycaster=new T.Raycaster(origin,direction),ground=raycaster.ray.at(-origin.y/direction.y,new T.Vector3());
  assert.equal(f.view.pick({x:ground.x,z:ground.z}),null,'old ground-only picking misses this chimney roof');
  assert.deepEqual(f.view.pickRay(raycaster),{castleBuilding:1});
  f.state.castleFight.buildings[0].alive=false;f.view.update(f.state,null,null,'p');assert.equal(f.view.pickRay(raycaster),null,'dead building model is not interactive');
  const shopRay=new T.Raycaster(new T.Vector3(0,12,-8),new T.Vector3(0,-1,0));assert.deepEqual(f.view.pickRay(shopRay),{castleTower:true});
  f.state.castleFight.teams=[{id:'base',team:1,x:8,z:2,w:3,d:5,alive:true}];f.view.update(f.state,null,null,'p');assert.equal(f.view.pickRay(new T.Raycaster(new T.Vector3(8,12,2),new T.Vector3(0,-1,0))),null,'main castles remain excluded from building selection');
  f.view.update({...f.state,options:{mode:'tower'}},null,null,'p');assert.equal(f.view.pickRay(shopRay),null,'hidden mode cannot intercept other arena input');
 }finally{f.cleanup();}
});
