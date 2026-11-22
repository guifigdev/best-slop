import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {roAttackProfile,RO_ATTACK_BUDGET} from '../shared/ro-attack-catalog.js';
import {roAttackFrames,roAttackArtHandles,createRoAttackArt} from '../src/ro-attack-art.js';
import {roProjectileParts,RO_PROJECTILE_ART_BUDGET} from '../src/ro-projectile-art.js';

test('mage fireballs have warm, round pixel art instead of the ice-crystal silhouette',()=>{
 const fire=roAttackProfile({skillKey:'basic',roLineage:'archmage',roJob:'mage',attackKind:'projectile',element:'fire'}),ice=roAttackProfile({skillKey:'coldbolt',attackKind:'projectile',element:'ice'});
 assert.equal(fire.motion,'fireorb');assert.equal(fire.plane,'vertical');assert.equal(ice.motion,'icecrystal');assert.equal(ice.plane,'vertical');assert.notEqual(fire.tint,ice.tint);assert.ok((fire.tint>>16&255)>(fire.tint&255));
 const a=roAttackFrames(fire),b=roAttackFrames(ice);assert.notEqual(createHash('sha256').update(a.data).digest('hex'),createHash('sha256').update(b.data).digest('hex'));assert.ok(a.bounds[4].maxX-a.bounds[4].minX>15);assert.equal(a.bounds[11].pixels,0);
});

test('fourteen elemental and utility motifs have unique silhouettes and twelve clean animation frames',()=>{
 const hashes=new Set(),motions=['fireorb','icecrystal','lightning','holy','earth','poison','dark','heal','shield','rune','runezone','summon','firefield','icefield'];
 for(const motion of motions){const art=roAttackFrames({family:'cast',motion});assert.equal(art.motion,motion);assert.equal(art.frameCount,12);assert.equal(art.bounds[11].pixels,0);assert.ok(art.bounds.slice(0,11).every(b=>b.pixels>20&&b.pixels<1700),motion);assert.ok(art.bounds.every(b=>b.minX>=0&&b.minY>=0&&b.maxX<64&&b.maxY<64));hashes.add(createHash('sha256').update(art.data).digest('hex'));}
 assert.equal(hashes.size,motions.length);
});

test('the real projectile batch uses eight bounded voxel pieces with distinct elemental palettes and silhouettes',()=>{
 const shapes=new Set();for(const element of ['fire','ice','water','holy','lightning','poison','dark','arcane','physical']){const parts=roProjectileParts({id:7,x:0,z:0,dx:0,dz:1,element},1.01);assert.equal(parts.length,8);assert.ok(parts.every(p=>p.length===8&&p.every(Number.isFinite)));assert.ok(parts.every(([x,y,z,w,h,d])=>Math.abs(x)<1&&Math.abs(z)<1.4&&y>0&&y<2&&w>0&&h>0&&d>0));shapes.add(JSON.stringify(parts));}
 assert.equal(shapes.size,9);assert.equal(RO_PROJECTILE_ART_BUDGET.instances,RO_PROJECTILE_ART_BUDGET.shots*8);assert.equal(RO_PROJECTILE_ART_BUDGET.drawCalls,1);
 const fire=roProjectileParts({id:7,x:3,z:5,dx:1,dz:0,element:'fire'},1.01),later=roProjectileParts({id:7,x:3,z:5,dx:1,dz:0,element:'fire'},1.15);assert.notDeepEqual(fire[3],later[3]);assert.ok(fire.every(p=>(p[6]>>16&255)>(p[6]&255)));
});

test('tagged utility events join the same instanced attack batches without swallowing unrelated effects',()=>{
 assert.equal(roAttackArtHandles({type:'fireball',bonk:true,skillKey:'firebolt'}),true);assert.equal(roAttackArtHandles({type:'fireball',bonk:true,skillKey:'unknown'}),false);assert.equal(roAttackArtHandles({type:'fireball',skillKey:'firebolt'}),false);assert.equal(roAttackArtHandles({type:'bossDanger',bonk:true,skillKey:'firebolt'}),false);
 const art=createRoAttackArt({scene:new T.Scene()}),effects=Array.from({length:90},(_,i)=>({id:i,time:0,type:'roAttack',x:0,z:0,source:1,skillKey:['firebolt','coldbolt','chainlightning','holylight'][i%4],attackKind:'projectile'}));art.update({options:{mode:'bonk'},units:[{id:1,bonkHero:true,roLineage:'archmage'}],effects},.1);assert.ok(art.stats().instances<=64);assert.equal(art.stats().drawCalls,1);assert.ok(art.stats().atlasBytes<=RO_ATTACK_BUDGET.maxAtlasBytes);art.dispose();
});
