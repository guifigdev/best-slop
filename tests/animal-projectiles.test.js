import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {HEROES} from '../shared/catalog.js';
import {animalBasicProjectile} from '../shared/animal-projectiles.js';
import {projectileStyle,voxelProjectileGeometry} from '../src/projectile-art.js';

test('animal shots have readable species identities and keep explicit weapons and spell shapes',()=>{
 for(const [unit,style]of [[{kind:'goblin'},'egg'],[{kind:'duck'},'egg'],[{hero:'raccoon'},'scrap'],[{hero:'mage'},'carrot'],[{hero:'owl'},'feather'],[{kind:'tortoise'},'shell'],[{kind:'bat'},'sonic']]){
  assert.equal(animalBasicProjectile(unit),style);assert.equal(projectileStyle({projectileKind:style},unit),style);assert.ok(voxelProjectileGeometry(style).attributes.color);
 }
 assert.equal(animalBasicProjectile({kind:'goblin',projectileKind:'bullet'}),'bullet');assert.equal(animalBasicProjectile({kind:'tortoise',attackType:'siege'}),'siege');assert.equal(projectileStyle({element:'fire'},{}),'fire');
});

test('raccoon throws scrap at the existing melee reach while caster animal objects preserve magical damage in Survival and Line Wars',()=>{
 for(const mode of ['tower','linewars'])for(const type of ['raccoon','mage','owl','turtle']){
  const g=new Game(19,{mode});g.addPlayer('p',type);g.phase='wave';g.wave=1;const p=g.player('p');p.x=p.z=0;g.random=()=>.5;
  const target=g.spawnEnemy('frog',1,0,{hp:10000,damage:0,skills:[]});Object.assign(target,{armor:0,magicDefense:0,evasion:0,perfectEvasion:0});Object.assign(p,{accuracy:1,critChance:0});
  const before=target.hp,range=p.range,interval=p.interval,damage=HEROES[type].attackType==='magic'?p.magicAttack*.9:p.damage;g.attack(p,target);
  assert.ok(Math.abs(before-target.hp-damage)<1e-6,`${mode}/${type} keeps damage`);assert.equal(p.range,range);assert.equal(p.interval,interval);
  const shot=g.effects.find(e=>e.source===p.id&&e.type==='arrow');assert.ok(shot);assert.equal(shot.projectileKind,animalBasicProjectile(p));assert.equal(shot.basicAttack,true);
 }
});

test('a chicken monster visibly launches an egg without changing its actual physical attack',()=>{
 const g=new Game(19,{mode:'tower'});g.addPlayer('p');g.phase='wave';const p=g.player('p'),chicken=g.spawnEnemy('goblin',p.x+1,p.z,{hp:100,damage:20,skills:[],range:1.4});Object.assign(p,{armor:0,evasion:0,perfectEvasion:0});Object.assign(chicken,{accuracy:1,critChance:0});g.random=()=>.5;const hp=p.hp;g.attack(chicken,p);assert.ok(Math.abs(hp-p.hp-chicken.damage)<1e-6);assert.ok(g.effects.some(e=>e.type==='arrow'&&e.projectileKind==='egg'&&e.source===chicken.id));assert.equal(chicken.range,1.4);
});
