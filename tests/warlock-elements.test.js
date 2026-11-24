import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../shared/simulation.js';import {wlSkillAt} from '../shared/warlock-catalog.js';import {warlockWallContact,applyWarlockBurn,applyWarlockFrost,warlockFrostFactor} from '../shared/warlock-elements.js';import {combatStatuses} from '../src/combat-status.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function setup(skills=[]){const g=new Game(102,{mode:'warlock'});for(const [id,hero]of [['p','warlock'],['q','heretic'],['r','occultist']])g.addPlayer(id,hero);g.initWarlock();const p=g.player('p'),q=g.player('q'),r=g.player('r');p.gold=1000;for(const skill of skills)assert.equal(g.command('p',{type:'wlBuy',skill}),true);for(const u of g.heroes())g.command(u.owner,{type:'wlReady'});for(const [i,u]of [p,q,r].entries())Object.assign(u,{x:-8+i*10,z:0,wlRegen:0,wlVx:0,wlVz:0,destination:null});return {g,p,q,r};}
function advance(g,seconds){for(let left=seconds;left>1e-8;left-=.025)g.tick(Math.min(left,.025));}

test('meteor impact leaves four seconds of authoritative ground fire; late entry burns, exit retains a finite nonstacking tail',()=>{
 const {g,p,q,r}=setup(['S008']);q.x=10;r.x=15;assert.ok(g.command('p',{type:'wlCast',skill:'S008',x:0,z:0}));advance(g,1.1);const fire=g.warlock.fields.find(f=>f.family==='meteorFire');assert.ok(fire);near(fire.until-fire.started,4);assert.equal(q.hp,100);Object.assign(q,{x:0,z:0});advance(g,.025);assert.ok(q.wlMeteorBurnUntil>g.time);assert.ok(combatStatuses(q,g.time).some(s=>s.key==='fire'));const until=q.wlMeteorBurnUntil;q.x=10;advance(g,.5);near(q.hp,98.5);advance(g,2);assert.equal(q.wlMeteorBurnUntil,0);const after=q.hp;advance(g,.6);near(q.hp,after);advance(g,1);assert.equal(g.warlock.fields.some(f=>f.family==='meteorFire'),false);near(p.hp,100);near(r.hp,100);assert.ok(until>1.1);
});

test('overlapping meteor patches refresh one burn rather than multiplying damage or creating knockback',()=>{
 const {g,p,q}=setup();q.x=0;p.x=-8;g.warlock.fields=Array.from({length:3},(_,i)=>({id:100+i,family:'meteorFire',x:0,z:0,radius:4.4,source:p.id,team:p.team,started:0,until:4}));advance(g,1.1);near(q.hp,97);near(q.wlVx,0);near(q.wlVz,0);assert.equal(g.snapshotFor('q').warlock.fields.length,3);assert.ok(g.snapshotFor('q').units.find(u=>u.id===q.id).wlMeteorBurnUntil>g.time);
});

test('rotated walls use swept physical contact, including a complete crossing between snapshots',()=>{
 const wall={x:0,z:0,angle:0,length:7,thickness:.7};assert.ok(warlockWallContact(wall,{x:-2,z:0},{x:2,z:0},.47));assert.equal(warlockWallContact(wall,{x:-2,z:5},{x:2,z:5},.47),null);const rotated={...wall,angle:Math.PI/2};assert.ok(warlockWallContact(rotated,{x:0,z:-2},{x:0,z:2},.47));assert.equal(warlockWallContact(rotated,{x:5,z:-2},{x:5,z:2},.47),null);
});

test('fire wall pushes away from the entry side, applies burn and throttles repeated impulses; caster remains safe',()=>{
 const {g,p,q}=setup(['W_FIRE_WALL']);p.x=0;p.z=-10;q.x=2;q.z=0;assert.ok(g.command('p',{type:'wlCast',skill:'W_FIRE_WALL',x:0,z:0,angle:0}));const wall=g.warlock.fields[0];assert.equal(wall.family,'fireWall');g.tickWarlockFields(.025,new Map([[q.id,{x:-2,z:0}]]));near(q.wlVx,-7);assert.ok(q.wlMeteorBurnUntil>g.time);g.tickWarlockFields(.025,new Map([[q.id,{x:-2,z:0}]]));near(q.wlVx,-7);assert.equal(p.wlMeteorBurnUntil,0);assert.ok(combatStatuses(q,g.time).some(s=>s.key==='fire'));
});

test('ice wall slows actual locomotion by forty percent and wears off after leaving, without freezing movement',()=>{
 const {g,p,q}=setup(['W_ICE_WALL']);p.x=-10;q.x=0;q.z=0;assert.ok(g.command('p',{type:'wlCast',skill:'W_ICE_WALL',x:0,z:0,angle:0}));g.tickWarlockFields(.025);assert.ok(q.wlFrostUntil>g.time);assert.ok(combatStatuses(q,g.time).some(s=>s.key==='frost'));g.warlock.fields=[];Object.assign(q,{x:2,z:0,destination:{x:10,z:0}});const before=q.x;advance(g,.1);near(q.x-before,q.speed*.6*.1);assert.ok(q.x>before);advance(g,1.3);near(warlockFrostFactor(q,g.time),1);
});

test('ice lance damages only the first hostile hit and applies a visible timed slow; finite angle validation does not spend casts',()=>{
 const {g,p,q,r}=setup(['W_FROST_BOLT','W_FIRE_WALL']);p.x=0;q.x=5;r.x=9;q.z=r.z=0;assert.equal(g.command('p',{type:'wlCast',skill:'W_FIRE_WALL',x:3,z:0,angle:Infinity}),false);near(p.cooldowns.W_FIRE_WALL||0,0);assert.ok(g.command('p',{type:'wlCast',skill:'W_FROST_BOLT',x:10,z:0}));advance(g,.6);near(q.hp,94);near(r.hp,100);assert.ok(q.wlFrostUntil>g.time);assert.equal(g.warlock.projectiles.some(s=>s.family==='frostBolt'),false);assert.ok(g.effects.some(e=>e.type==='damage'&&e.element==='ice'));
});

test('element effects reset across rounds and extension ranks expose honest costs, duration and geometry',()=>{
 const {g,q}=setup();applyWarlockBurn(q,g.player('p').id,g.time);applyWarlockFrost(q,g.time,3);g.finishWarlockRound();for(const u of g.heroes())g.command(u.owner,{type:'wlReady'});assert.equal(q.wlMeteorBurnUntil,0);assert.equal(q.wlFrostUntil,0);for(const key of ['W_FIRE_WALL','W_ICE_WALL','W_FROST_BOLT']){const s=wlSkillAt(key,1);assert.equal(s.browserExtension,true);assert.equal(s.range,14);assert.ok(s.cooldown>0);near(s.wallLength,4.2);near(wlSkillAt(key,5).wallLength,7);assert.equal(s.wallThickness,.7);assert.ok(wlSkillAt(key,5).duration>s.duration);}
});

test('wall length begins forty percent shorter and reaches full length at the maximum base rank',()=>{for(const key of ['W_FIRE_WALL','W_ICE_WALL'])for(const [i,length]of [4.2,4.9,5.6,6.3,7,7,7].entries())near(wlSkillAt(key,i+1).wallLength,length);});

test('a new cold effect does not inherit the strength of an already expired slow',()=>{const u={wlFrostUntil:1,wlFrostSlow:.8};applyWarlockFrost(u,2,2,.4);near(warlockFrostFactor(u,2),.6);});
