import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {bonkSecretMerchantParts,BONK_SECRET_MERCHANT_ART_BUDGET as B} from '../src/bonk-secret-merchant-art.js';
import {createBonkWorld,BONK_WORLD_PALETTES} from '../src/bonk-world.js';
import {generateBonkLevel,bonkHeightAt} from '../shared/bonk-level.js';
import {bonkInteractionParts,bonkInteractionGlowSources} from '../src/bonk-interaction-art.js';

test('the hooded merchant, timber stall and equipment shelves are cached bounded finite voxel art',()=>{
 for(const seed of [-1,0,1,2,22])for(const palette of Object.values(BONK_WORLD_PALETTES)){const o={id:'secret',seed},art=bonkSecretMerchantParts(o,palette);assert.equal(bonkSecretMerchantParts(o,palette),art);assert.ok(Object.isFrozen(art)&&Object.isFrozen(art.parts[0]));assert.ok(art.parts.length>=100&&art.parts.length<=B.parts);assert.ok(art.glow.length<=B.glow);for(const p of [...art.parts,...art.glow]){assert.equal(p.length,8);assert.ok(p.every(Number.isFinite));assert.ok(p.slice(3,6).every(v=>v>0));assert.ok(Math.abs(p[0])<3&&p[1]>0&&p[1]<4&&Math.abs(p[2])<2);}assert.ok(art.parts.some(p=>p[6]===0x1f2b2a),'shadowed hood opening');assert.ok(art.parts.some(p=>p[6]===0xb6c3bd),'steel gear display');assert.ok(art.glow.every(p=>p[1]>1.9&&p[1]<2.5),'light belongs to the actual lantern, not a floating discovery pin');}assert.equal(B.extraDrawCalls,0);
});

test('a secret merchant shares existing world batches, supports pointer picking and never creates discovery icons',()=>{
 const scene=new T.Scene(),world=createBonkWorld({scene}),map=generateBonkLevel(32,'grove'),merchant={id:'merchant:32',type:'secretMerchant',seed:32,x:8,z:4,used:false,discovered:false},hero={bonkHero:true,alive:true,x:0,z:0},state={options:{mode:'bonk'},bonk:{map,objects:[merchant],pickups:[],projectiles:[],objectives:[],warnings:[]},units:[hero]};try{
  world.update(state,0);const batch=world.root.getObjectByName('bonk-interactables'),children=[...world.root.children];assert.equal(batch.count,bonkSecretMerchantParts(merchant,BONK_WORLD_PALETTES.grove).parts.length);assert.ok(batch.count<=batch.instanceMatrix.count);assert.deepEqual(world.pick(merchant),{bonkObject:merchant.id});const ray=new T.Raycaster(new T.Vector3(merchant.x,bonkHeightAt(map,merchant.x,merchant.z)+10,merchant.z),new T.Vector3(0,-1,0));assert.deepEqual(world.pickRay(ray),{bonkObject:merchant.id});assert.deepEqual(bonkInteractionParts(state.bonk,hero,0).objectIds,[]);assert.deepEqual(bonkInteractionGlowSources(state.bonk,hero),[]);for(let i=1;i<=15;i++)world.update(state,i*.1);assert.equal(world.root.getObjectByName('bonk-interactables'),batch);assert.deepEqual(world.root.children,children);merchant.discovered=true;world.update(state,2);assert.deepEqual(bonkInteractionParts(state.bonk,hero,2).objectIds,[]);assert.equal(world.root.getObjectByName('bonk-rune-signals').count,2,'only the two actual lantern pixels use the emissive batch');
  const camera=new T.PerspectiveCamera(50,1,.1,70);camera.position.set(-100,12,-100);camera.lookAt(-120,3,-120);camera.updateMatrixWorld();world.cull(camera);assert.equal(batch.count,0,'the existing spatial culling also hides an offscreen stall');
 }finally{world.dispose();}assert.equal(scene.children.length,0);
});
