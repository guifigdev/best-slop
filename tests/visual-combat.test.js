import test from 'node:test';
import assert from 'node:assert/strict';
import {projectileStyle,voxelProjectileGeometry,PROJECTILE_PALETTES,actorEffectHeight} from '../src/projectile-art.js';
import {locomotionFrame,constructionFrame} from '../src/animation-profiles.js';
import {effectToEvict} from '../src/effect-priority.js';

test('voxel projectiles share cached coloured geometry and preserve distinguishable physical and elemental silhouettes',()=>{
 for(const style of Object.keys(PROJECTILE_PALETTES)){const g=voxelProjectileGeometry(style);assert.equal(g,voxelProjectileGeometry(style));assert.ok(g.attributes.color.count===g.attributes.position.count);assert.ok(g.boundingSphere.radius>0);assert.ok(g.attributes.position.count<500);}
 assert.equal(projectileStyle({projectileKind:'bullet',element:'fire'}),'bullet');assert.equal(projectileStyle({element:'ice'}),'frost');assert.equal(projectileStyle({},{attackType:'siege'}),'siege');assert.equal(projectileStyle({},{attackType:'magic'}),'arcane');assert.equal(projectileStyle({},{}),'arrow');assert.equal(projectileStyle({element:'poison'}),'poison');
});
test('effect height follows model proportions, altitude and size instead of a fixed world Y',()=>{
 const actor={root:{position:{y:3},scale:{y:2}},eyeLine:1.6,modelHeight:2.5};assert.equal(actorEffectHeight(actor,{}),6.2);assert.equal(actorEffectHeight(null,{},4),5.3);
});
test('heavy animals keep their lower gait while frames remain discrete and construction has an actual repeating work cycle',()=>{
 const heavy=locomotionFrame({id:1,kind:'rhino',speed:3},1),light=locomotionFrame({id:1,kind:'hare',speed:3},1);assert.ok(heavy.weight<light.weight);assert.deepEqual(locomotionFrame({id:1,speed:3},1),locomotionFrame({id:1,speed:3},1.01));assert.notDeepEqual(constructionFrame(0),constructionFrame(.25));assert.deepEqual(constructionFrame(0),constructionFrame(1));
});
test('crowded combat preserves boss warnings and personal critical feedback ahead of repetitive troop effects',()=>{
 const entries=new Map([[1,{e:{type:'bossDanger'}}],[2,{e:{type:'arrow',source:9}}],[3,{e:{type:'damage',critical:true,source:1}}]]);
 assert.equal(effectToEvict(entries,{type:'heal',target:1},1),2);assert.equal(effectToEvict(new Map([[1,{e:{type:'bossDanger'}}]]),{type:'arrow'},1),null);
});
