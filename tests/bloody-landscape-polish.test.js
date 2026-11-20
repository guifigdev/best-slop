import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {BLOODY_TERRAIN_DATA as DATA} from '../shared/bloody-terrain-data.js';
import {bloodyTerrainBlocked,BLOODY_WORLD_SCALE as S,bloodyHeightAt} from '../shared/bloody-battlefield.js';
import {bloodyWorldTile,bloodySurfaceKind,bloodyCoastSamples,createBloodyTournamentWorld} from '../src/bloody-tournament-world.js';
import {createFoliageWindMaterial,updateFoliageWind} from '../src/foliage-wind.js';

const snapshot={options:{mode:'bloody'},bloodyTournament:{stage:'battle',formations:[],players:[]}};
const pose=(mesh,i=0)=>{const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);return matrix.elements;};

test('molten edges have no blue water cells adjacent to volcanic soil while distant ocean remains water',()=>{
 let edge=0,sea=0;for(let row=0;row<DATA.height-1;row++)for(let col=0;col<DATA.width-1;col++){
  const x=(DATA.origin[0]+col+.5)*S,z=(DATA.origin[1]-row-.5)*S,t=bloodyWorldTile(x,z);if(!t.water)continue;
  if(['Dlvc','cDc1'].includes(t.rawId)){assert.equal(bloodySurfaceKind(x,z),'lava');continue;}
  if(x< -Math.abs(z)*.45&&!['Iice','cIc1','Xhdg','Avin'].includes(t.rawId)&&[-S,0,S].some(dx=>[-S,0,S].some(dz=>['Dlvc','cDc1'].includes(bloodyWorldTile(x+dx,z+dz).rawId)))){assert.equal(bloodySurfaceKind(x,z),'lava');edge++;}else if(bloodySurfaceKind(x,z)==='water')sea++;
 }assert.ok(edge>30);assert.ok(sea>4000);
 const world=createBloodyTournamentWorld({scene:new T.Scene()});try{world.update(snapshot,0);const water=world.root.getObjectByName('bt-native-water'),lava=world.root.getObjectByName('bt-native-lava');let highestWater=-Infinity,lowestLava=Infinity;for(let i=0;i<water.count;i++){const p=pose(water,i);if(!bloodyTerrainBlocked({x:p[12],z:p[14]}))continue;highestWater=Math.max(highestWater,p[13]+p[5]/2-bloodyHeightAt(p[12],p[14]));}for(let i=0;i<lava.count;i++){const p=pose(lava,i);if(!bloodyTerrainBlocked({x:p[12],z:p[14]}))continue;lowestLava=Math.min(lowestLava,p[13]+p[5]/2-bloodyHeightAt(p[12],p[14]));}assert.ok(lowestLava>highestWater+.02,'water cannot z-fight above the molten edge');assert.ok(water.material.isShaderMaterial);assert.match(water.material.fragmentShader,/reflect\(/);assert.match(water.material.fragmentShader,/fresnel/);assert.match(water.material.fragmentShader,/floor\(uTime\*8/);assert.equal(water.material.map,undefined);}finally{world.dispose();}
});

test('every natural coast rock is wholly inside blocked WPM and varies visibly in height',()=>{
 const samples=bloodyCoastSamples();assert.ok(samples.length>100&&samples.length<1000);for(const rock of samples){const half=rock.w/2;for(const dx of [-half,-half*.5,0,half*.5,half])for(const dz of [-half,-half*.5,0,half*.5,half])assert.equal(bloodyTerrainBlocked({x:rock.x+dx,z:rock.z+dz}),true,'visible coast does not occupy a valid approach');}assert.ok(Math.max(...samples.map(r=>r.h))-Math.min(...samples.map(r=>r.h))>1.5);
});

test('snow is grouped into broad variable drifts, grass no longer uses identical crossing bars, and only foliage receives wind',()=>{
 const world=createBloodyTournamentWorld({scene:new T.Scene()});try{world.update(snapshot,0);const details=world.root.getObjectByName('bt-biome-details'),sizes=[];for(let i=0;i<details.count;i++){const p=pose(details,i);if(p[14]>8&&Math.abs(p[12])<p[14]+12)sizes.push([Math.hypot(p[0],p[1],p[2]),Math.hypot(p[4],p[5],p[6])]);}assert.ok(sizes.some(([w,h])=>w>4&&h>.3));assert.ok(new Set(sizes.map(([w])=>Math.round(w*10))).size>15);assert.ok(sizes.length<150,'snow uses clustered forms rather than hundreds of identical stones');let blades=0;for(let i=0;i<details.count;i++){const p=pose(details,i),w=Math.hypot(p[0],p[1],p[2]),h=Math.hypot(p[4],p[5],p[6]),d=Math.hypot(p[8],p[9],p[10]);if(p[12]>Math.abs(p[14])*.5&&w<.12&&h>.2&&d<.16)blades++;assert.ok(!(Math.abs(w-.6)<1e-5&&Math.abs(h-.34)<1e-5&&Math.abs(d-.12)<1e-5),'old horizontal cross bar removed');}assert.ok(blades>40,'separated upright blades form real tufts');const crowns=world.root.getObjectByName('bt-tree-canopies'),architecture=world.root.getObjectByName('bt-native-architecture');assert.ok(crowns.count>=40);assert.ok(crowns.material.userData.foliageWind);assert.equal(architecture.material.userData.foliageWind,undefined);const trunks=Array.from(architecture.instanceMatrix.array);world.update(snapshot,.3);assert.deepEqual(Array.from(architecture.instanceMatrix.array),trunks);assert.equal(crowns.material.userData.foliageWind.time.value,.25);}finally{world.dispose();}
});

test('shared leaf shader quantizes its clock, keeps per-instance translations and applies only a small crown-tip sway',()=>{
 const material=createFoliageWindMaterial({strength:.2,speed:.7}),shader={uniforms:{},vertexShader:'void main(){#include <begin_vertex>}'};try{material.onBeforeCompile(shader);assert.equal(shader.uniforms.uFoliageTime,material.userData.foliageWind.time);assert.match(shader.vertexShader,/instanceMatrix\[3\]/);assert.match(shader.vertexShader,/windTip=clamp/);assert.match(shader.vertexShader,/max\(.01,windScale.x\)/);updateFoliageWind(material,.13);const time=shader.uniforms.uFoliageTime.value;updateFoliageWind(material,.24);assert.equal(shader.uniforms.uFoliageTime.value,time);updateFoliageWind(material,.25);assert.notEqual(shader.uniforms.uFoliageTime.value,time);assert.equal(material.map,null);}finally{material.dispose();}
});
