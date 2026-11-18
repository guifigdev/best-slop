import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {HEROES,skillAt} from '../shared/catalog.js';
import {MONSTERS} from '../shared/monsters.js';
import {equipmentEffectAt} from '../shared/equipment-effects.js';
import {moveUnit,blocked} from '../shared/field.js';

function setup(hero='knight'){const g=new Game(51,{mode:'tower'});g.addPlayer('p',hero);g.spawnWave();g.units=g.heroes();g.zones=[];const p=g.player('p');p.x=p.z=0;p.accuracy=1;p.critChance=0;g.random=()=>.5;return{g,p};}
const spawn=(g,kind='griffin',x=0,z=2,data={})=>g.spawnEnemy(kind,x,z,{hp:10000,damage:0,speed:0,...data});
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} differs from ${expected}`);

test('spawn applies each species flight, altitude, range and elemental affinity without sharing mutable maps',()=>{const {g}=setup();for(const [key,meta]of Object.entries(MONSTERS)){const u=spawn(g,key);assert.equal(u.flying,!!meta.flying);assert.equal(u.altitude,meta.flying?meta.altitude:0);assert.equal(u.element,meta.element||null);assert.deepEqual(u.resistances,meta.resistances||{});if(meta.range)assert.equal(u.range,meta.range);}const a=spawn(g,'dragon'),b=spawn(g,'dragon');a.resistances.fire=.5;assert.equal(b.resistances.fire,.25);assert.equal(MONSTERS.dragon.resistances.fire,.25);});

test('flying ignores lava, frost floors, ice, water and traps while grounded creatures remain affected',()=>{const {g}=setup(),fly=spawn(g,'griffin',0,0),ground=spawn(g,'lion',0,0);g.time=1.6;g.zones=['lava','frost','ice','water','trap'].map((type,i)=>({id:i,type,x:0,z:0,r:2,offset:0,period:6}));const hp=fly.hp;g.environment(fly,1/30);assert.equal(fly.hp,hp);assert.equal(fly.sliding,false);assert.equal(fly.wading,false);assert.ok(!fly.dots?.lava&&!fly.dots?.frost);assert.ok(!fly.frostUntil);assert.equal(fly.stun,0);g.environment(ground,1/30);assert.ok(ground.hp<ground.maxHp);assert.equal(ground.sliding,true);assert.equal(ground.wading,true);assert.ok(ground.dots.lava&&ground.dots.frost);});

test('weather lightning still hits flying creatures and respects their elemental resistance',()=>{const {g}=setup(),fly=spawn(g,'griffin',0,0);g.arena='tempest';g.time=2;g.zones=[{id:'lightning',type:'lightning',x:0,z:0,r:2,strike:1}];const hp=fly.hp;g.environment(fly,1/30);near(hp-fly.hp,(100+g.wave*2)*.8);assert.ok(g.effects.some(e=>e.type==='damage'&&e.element==='lightning'));});

test('already applied burns/poison keep hurting flying creatures and spell frost can slow them',()=>{const {g,p}=setup(),fly=spawn(g,'dragon',0,3);g.applyDot(fly,'burn',100,3,p);g.time+=1.1;const hp=fly.hp;g.environment(fly,1/30);near(hp-fly.hp,75);g.castSpecial(p,'warlockfrost',skillAt('warlockfrost',1),{x:0,z:8});for(let i=0;i<30;i++){g.time+=1/60;g.tickSpecials(1/60);}assert.ok(fly.frostUntil>g.time);assert.equal(fly.flying,true);});

test('flight preserves horizontal bounds and still collides with pillars and ice walls',()=>{const {g}=setup(),fly=spawn(g,'griffin',-3,0);g.obstacles=[{x:0,z:0,w:.8,d:5,h:2.5,type:'icewall'}];moveUnit(g,fly,{x:3,z:0});assert.ok(fly.x<0);assert.equal(blocked(fly,g.obstacles),false);g.obstacles=[];moveUnit(g,fly,{x:999,z:999});assert.ok(Math.abs(fly.x)<=g.bounds);assert.ok(Math.abs(fly.z)<=g.bounds);assert.ok(Math.hypot(fly.x,fly.z)<=g.bounds+2.500001);});

test('every hero can attack a flying target with ordinary XZ range and abilities keep targeting it',()=>{for(const hero of Object.keys(HEROES)){const {g,p}=setup(hero),fly=spawn(g,'griffin',0,1.3),hp=fly.hp;assert.equal(g.canTarget(p,fly),true);assert.equal(g.command('p',{type:'attack',target:fly.id}),true);g.attack(p,fly);assert.ok(fly.hp<hp,`${hero} should hit flight`);}const {g,p}=setup('mage'),fly=spawn(g,'griffin',0,2),hp=fly.hp;assert.equal(g.command('p',{type:'cast',slot:0,target:fly.id}),true);near(hp-fly.hp,g.spellDamage(p,100,'lightning','bolt')*.8);});

test('elemental creature attacks deal typed magic and physical attacks retain armor mitigation',()=>{const {g,p}=setup(),dragon=spawn(g,'dragon',0,2);dragon.damage=100;dragon.accuracy=1;p.armor=100;const hp=p.hp;g.attack(dragon,p);near(hp-p.hp,100/(1+.03*p.magicDefense));assert.ok(g.effects.some(e=>e.type==='damage'&&e.source===dragon.id&&e.magic&&e.element==='fire'));assert.ok(g.effects.some(e=>e.type==='arrow'&&e.source===dragon.id&&e.element==='fire'));const lion=spawn(g,'lion',0,1);lion.damage=100;lion.accuracy=1;const next=p.hp;g.attack(lion,p);near(next-p.hp,100/7);});

test('creature resistances and weaknesses affect only their matching element, not ordinary physical damage',()=>{const {g,p}=setup(),dragon=spawn(g,'dragon');near(g.elementDamage(dragon,100,'fire'),75);near(g.elementDamage(dragon,100,'ice'),120);near(g.elementDamage(dragon,100,'lightning'),100);const hp=dragon.hp;g.hit(dragon,100,p,false);near(hp-dragon.hp,100/(1+.06*dragon.armor));const plain=spawn(g,'lion');near(g.elementDamage(plain,100,'fire'),100);});

test('blizzard ice pulses and poison damage use the target affinity',()=>{const {g,p}=setup('mage'),dragon=spawn(g,'dragon',0,2);p.skills=['blizzard'];p.skillLevels={blizzard:1};p.mana=999;const hp=dragon.hp;g.cast(p,{slot:0,x:0,z:2});g.tick(.3);near(hp-dragon.hp,g.spellDamage(p,30,'ice','blizzard')*1.2);const basilisk=spawn(g,'basilisk',5,5);g.applyDot(basilisk,'poison',100,3,p);g.time+=1.1;const before=basilisk.hp;g.environment(basilisk,1/30);near(before-basilisk.hp,75);});

test('solar fire and stormcoil lightning apply creature affinity once alongside existing gear resistance',()=>{const {g,p}=setup(),phoenix=spawn(g,'phoenix',0,2);phoenix.fireResist=.5;p.itemEffects={solar:1};const hp=phoenix.hp;g.equipmentTick();near(hp-phoenix.hp,equipmentEffectAt('solar',1).damage*.5*.5*.75);g.units=g.heroes();const griffin=spawn(g,'griffin',0,2);p.itemEffects={stormcoil:1};g.random=()=>.1;g.attack(p,griffin);assert.ok(g.effects.some(e=>e.type==='damage'&&e.target===griffin.id&&e.element==='lightning'&&e.amount===28));});

test('Warlock fire applies species weakness and equipment resistance once, while still colliding with flight',()=>{const {g,p}=setup(),wyrm=spawn(g,'frostwyrm',0,4);wyrm.fireResist=.5;const hp=wyrm.hp;g.castSpecial(p,'warlockfire',skillAt('warlockfire',1),{x:0,z:8});for(let i=0;i<35;i++){g.time+=1/60;g.tickSpecials(1/60);}near(hp-wyrm.hp,g.spellDamage(p,100,'fire','warlockfire')*.5*1.2);assert.equal(g.projectiles.length,0);});

test('all eleven monster species keep valid own-skill boss drops',()=>{const {g,p}=setup();for(const [kind,meta]of Object.entries(MONSTERS)){const u=spawn(g,kind,0,2,{boss:'boss'});u.alive=false;const drop=g.monsterLoot(u,p);assert.equal(drop.owner,p.owner);assert.ok(u.skills.includes(drop.skill));assert.ok(skillAt(drop.skill,1));}});


test('more INT increases a real projectile hit against flight while gear and elemental weakness each mitigate exactly once',()=>{const {g,p}=setup();const fire=skillAt('warlockfire',1);const hit=()=>{const target=spawn(g,'frostwyrm',0,4);target.fireResist=.5;const hp=target.hp;g.castSpecial(p,'warlockfire',fire,{x:0,z:8});for(let i=0;i<35;i++){g.time+=1/60;g.tickSpecials(1/60);}const actual=hp-target.hp;near(actual,g.spellDamage(p,fire.damage,'fire','warlockfire')*.5*1.2);g.units=g.heroes();return actual;};const before=hit();p.attributes.int+=12;g.refresh(p);assert.ok(hit()>before);});
