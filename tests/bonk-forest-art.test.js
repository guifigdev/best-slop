import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bonkSceneryParts} from '../src/bonk-prop-art.js';
import {createBonkCanopyGeometry,bonkTreeParts,bonkFallingLeaves,BONK_TREE_ART_BUDGET as B} from '../src/bonk-tree-art.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {createBonkVisibility} from '../src/bonk-visibility.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {roWorldRegion} from '../shared/ro-world-route.js';
const palette={stone:0xa5a58b,dark:0x3c5242,wood:0x735438,grass:0x8eac66,glow:0xf3d89d};
const contains=(p,x,y,z)=>Math.abs(x-p[0])<=p[3]/2+.001&&Math.abs(y-p[1])<=p[4]/2+.001&&Math.abs(z-p[2])<=p[5]/2+.001;

test('houses have uninterrupted overlapping roof coverage, solid gables and mortar behind their brick courses',()=>{
 for(const key of ['prontera-house','payon-pavilion']){const parts=bonkSceneryParts(key,palette),roof=parts.filter(p=>[0x9e5447,0x526569,0xb9755d,0xc08a6b].includes(p[6]));for(let x=-3.7;x<=3.7;x+=.17)for(let z=-3.2;z<=3.2;z+=.19){const top=Math.max(...roof.filter(p=>Math.abs(x-p[0])<=p[3]/2&&Math.abs(z-p[2])<=p[5]/2).map(p=>p[1]+p[4]/2));assert.ok(top>4.8,key+': roof gap');}for(const z of [3.06,-2.67])for(let x=-3.2;x<=3.2;x+=.23)for(let y=5.1;y<7.65-Math.abs(x)*.71;y+=.2)assert.ok(parts.some(p=>contains(p,x,y,z)),key+': gable opening');for(const x of [-3.2,-2.2,-1.2,1.2,2.2,3.2])for(let y=.85;y<=4.75;y+=.13)assert.ok(parts.some(p=>contains(p,x,y,3)),key+': wall gap');}
});

test('a detailed canopy bakes exposed voxel faces inside the existing unit-instance bounds',()=>{
 const g=createBonkCanopyGeometry();try{g.computeBoundingBox();assert.ok(g.attributes.position.count/3<=B.maxCanopyTriangles);assert.ok(g.attributes.position.count/3>150);assert.ok(g.userData.voxelCells>40);for(const axis of ['x','y','z'])assert.ok(g.boundingBox.min[axis]>=-.50001&&g.boundingBox.max[axis]<=.50001);assert.ok(g.attributes.position.count/3<g.userData.voxelCells*12,'internal cube faces are removed');assert.equal(g.attributes.color.count,g.attributes.position.count);}finally{g.dispose();}
 const silhouettes=new Set();for(let v=0;v<9;v++){const parts=bonkTreeParts({h:7,scale:1.2,w:1,d:1},palette,v);assert.ok(parts.leaves.length<=B.clustersPerTree);assert.ok(parts.wood.length>15);assert.ok(parts.leaves.every(p=>p.slice(3,6).every(n=>n>0)));silhouettes.add(JSON.stringify(parts));}assert.equal(silhouettes.size,9);
});

test('decorative leaves are sparse, capped, deterministic, local to the player and freeze with simulation time',()=>{
 const emitters=Array.from({length:100},(_,i)=>({x:i%10*4,z:Math.floor(i/10)*4,y:7,height:6,seed:i+9}));let total=0,max=0;for(let time=0;time<90;time+=.5){const parts=bonkFallingLeaves(emitters,time,{x:0,z:0});assert.deepEqual(parts,bonkFallingLeaves(emitters,time,{x:0,z:0}));assert.ok(parts.length<=24);for(const p of parts)assert.ok(p.every(Number.isFinite));total+=parts.length;max=Math.max(max,parts.length);}assert.ok(max>0);assert.ok(total/180<8,'a few leaves drift instead of a snowstorm');assert.deepEqual(bonkFallingLeaves(emitters,20,{x:1000,z:1000}),[]);
});

test('culling keeps per-tree wind anchors paired with their original canopy instances after camera turns',()=>{
 const g=new T.BoxGeometry(),anchor=new T.InstancedBufferAttribute(new Float32Array([11,12,13,14,21,22,23,24]),4);g.setAttribute('foliageRoot',anchor);const material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(g,material,2),m=new T.Matrix4(),v=createBonkVisibility();mesh.setMatrixAt(0,m.makeTranslation(0,1,-10));mesh.setMatrixAt(1,m.makeTranslation(0,1,20));mesh.count=2;v.capture(mesh,2);const c=new T.PerspectiveCamera(65,1,.1,100);c.position.set(0,2,0);c.lookAt(0,1,-20);c.updateMatrixWorld();v.update(c);assert.equal(anchor.getX(0),11);c.lookAt(0,1,20);c.updateMatrixWorld();v.update(c);assert.equal(anchor.getX(0),21);c.lookAt(0,1,-20);c.updateMatrixWorld();v.update(c);assert.equal(anchor.getX(0),11);v.reset();mesh.dispose();g.dispose();material.dispose();
});

test('world geometry stays cached while foliage moves in a shader and warm solar coating preserves its hook',()=>{
 const coated=[],world=createBonkWorld({scene:new T.Scene(),coatMaterial:m=>{coated.push(m);const before=m.onBeforeCompile;m.onBeforeCompile=s=>{before(s);s.vertexShader+='\n// warm solar coating';};return m;}}),region=roWorldRegion('prontera'),map=generateBonkLevel(52,'grove','forest',region),s={options:{mode:'bonk'},units:[{bonkHero:true,alive:true,x:-40,z:30}],bonk:{map,objects:map.objects,objectives:[],projectiles:[],pickups:[]}};
 try{world.update(s,1);assert.equal(coated.length,3);const canopy=world.root.getObjectByName('bonk-foliage'),g=canopy.geometry,positions=g.attributes.position.array,indices=canopy.instanceMatrix.array;assert.ok(canopy.count<=7000);assert.ok(g.attributes.foliageRoot);const shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};canopy.material.onBeforeCompile(shader);assert.match(shader.vertexShader,/foliageRoot/);assert.match(shader.vertexShader,/foliageWorldPosition=/);assert.match(shader.vertexShader,/warm solar coating/);assert.match(shader.fragmentShader,/focusSide/);assert.match(shader.fragmentShader,/if\(leafFade>0.985\)discard/);const camera=new T.PerspectiveCamera(65,1,.1,270);camera.position.set(-40,8,45);camera.lookAt(-40,3,30);camera.updateMatrixWorld();world.cull(camera);assert.equal(shader.uniforms.foliageFocus.value.x,-40);assert.equal(shader.uniforms.foliageFocus.value.z,30);for(let t=2;t<8;t++){world.update(s,t);assert.equal(canopy.geometry,g);assert.equal(g.attributes.position.array,positions);assert.equal(canopy.instanceMatrix.array,indices);assert.ok(world.root.getObjectByName('bonk-falling-leaves').count<=24);}assert.ok(world.root.children.length<=14);}finally{world.dispose();}
});
