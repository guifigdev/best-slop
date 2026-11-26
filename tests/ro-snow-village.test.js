import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roWorldRegion} from '../shared/ro-world-route.js';
import {generateBonkLevel} from '../shared/bonk-level.js';
import {createBonkWorld} from '../src/bonk-world.js';
import {roSnowPineParts,roSnowRockParts} from '../src/ro-snow-village-art.js';
test('Lutie uses a snowy conifer forest instead of the glacier crystal field and ruins',()=>{
 for(const seed of [73,617,911]){const r=roWorldRegion('lutie',seed),map=generateBonkLevel(seed,r.scene,r.habitat,r),pines=map.decorations.filter(o=>o.type==='snow-pine');assert.ok(pines.length>50);assert.ok(map.decorations.some(o=>o.type==='snow-rock'));assert.ok(!map.decorations.some(o=>['cactus','crystal','pillar','statue'].includes(o.type)));assert.deepEqual(map,generateBonkLevel(seed,r.scene,r.habitat,r));for(const o of pines.filter(o=>o.solid)){const collider=map.obstacles.find(c=>c.id===o.id);assert.equal(collider.w,o.w);assert.equal(collider.h,o.h);}const ice=roWorldRegion('ice-cavern',seed);assert.ok(generateBonkLevel(seed,ice.scene,ice.habitat,ice).decorations.some(o=>o.type==='crystal'));}
});
test('snowy pine geometry has tiered dark branches, white snow caps and the actual trunk footprint',()=>{
 const tree={h:7,w:1.1,scale:1.3},parts=roSnowPineParts(tree,2);assert.equal(parts[0][3],tree.w);assert.ok(parts.filter(p=>p[6]===0xf2f8ff).length===5);assert.ok(parts.some(p=>p[6]===0x28574e));assert.ok(parts.length<=40);for(const p of [...parts,...roSnowRockParts({w:2,d:3,h:1.8})]){assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));}
});
test('Lutie renders its conifers through existing batches and keeps every instance inside the budget',()=>{
 const region=roWorldRegion('lutie',617),map=generateBonkLevel(617,region.scene,region.habitat,region),world=createBonkWorld({scene:new T.Scene()});try{world.update({options:{mode:'bonk'},bonk:{map,objects:map.objects,pickups:[],projectiles:[],objectives:[]}},1);for(const mesh of world.root.children.filter(o=>o.isInstancedMesh))assert.ok(mesh.count<=mesh.instanceMatrix.count,mesh.name);const landscape=world.root.getObjectByName('bonk-landscape'),color=new T.Color();let branches=0;for(let i=0;i<landscape.count;i++){landscape.getColorAt(i,color);if([0x28574e,0x34695b,0x427967].includes(color.getHex()))branches++;}assert.ok(branches>250);}finally{world.dispose();}
});
