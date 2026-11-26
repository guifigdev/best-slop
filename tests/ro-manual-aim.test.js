import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {bonkStats} from '../shared/bonk.js';
import {roSkillCastTime} from '../shared/ro-skill-controls.js';
import {BONK_WEAPONS} from '../shared/bonk-catalog.js';
import {createBonkUI} from '../src/bonk-ui.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function arena(){const g=new Game(152,{mode:'bonk',bonkLineage:'windhawk'});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});const u=g.player('p');Object.assign(g.bonk,{routeVersion:0,spawnAt:Infinity,bossSpawned:true,objectives:[],pickups:[],bossUnlocked:false});g.bonk.map.obstacles=[];g.obstacles=[];g.units=[u];u.bonkBuild.weapons={basic:1,firebolt:1};u.bonkSkillSlots=['basic','firebolt'];u.bonkSkillAuto={basic:false,firebolt:false};u.bonkInvulnerableUntil=Infinity;u.mana=10000;return{g,u};}
function enemy(g,u,x=5,z=0){const e={id:g.id(),bonkEnemy:true,dungeonSpecies:'rat',alive:true,team:100,x:u.x+x,z:u.z+z,hp:1e8,maxHp:1e8,damage:0,speed:0,collisionRadius:.3,size:1,bonkNextAttack:Infinity,bonkNextSpecial:Infinity};g.units.push(e);return e;}
function advance(g,seconds){for(let left=seconds;left>1e-8;left-=.05)g.tick(Math.min(left,.05));}
function unlock(u){u.bonkWeaponAt={};u.roSkillActionUntil=u.roAfterCastUntil=0;delete u.roAutoQueue;}

test('a real archer fires at the explicit cursor rather than walking direction or a nearby enemy',()=>{
 const {g,u}=arena();enemy(g,u,5,0);g.command('p',{type:'bkMove',dx:1,dz:0});assert.ok(g.command('p',{type:'bkAim',active:true,x:u.x,z:u.z-10}));assert.ok(g.command('p',{type:'bkCast',key:'basic',x:u.x,z:u.z-10}));const shot=g.bonk.projectiles[0];assert.ok(shot);near(shot.dx,0);near(shot.dz,-1);g.tick(.05);assert.ok(u.x>0);assert.ok(Math.cos(u.facing)<-.99,'the archer faces its aim while strafing');
});

test('an archer can shoot empty ground, clicked targets are authoritative and malformed or foreign input is rejected',()=>{
 const {g,u}=arena();assert.ok(g.command('p',{type:'bkCast',key:'basic',x:u.x-10,z:u.z}));near(g.bonk.projectiles[0].dx,-1);const target=enemy(g,u,3,3);unlock(u);assert.ok(g.command('p',{type:'bkCast',key:'basic',x:target.x,z:target.z,target:target.id}));const shot=g.bonk.projectiles.at(-1);near(shot.dx,Math.SQRT1_2);near(shot.dz,Math.SQRT1_2);
 for(const command of [{type:'bkAim',active:'true',x:0,z:0},{type:'bkAim',active:true,x:Infinity,z:0},{type:'bkAim',active:true,x:500,z:0},{type:'bkCast',key:'basic',x:NaN,z:0},{type:'bkCast',key:'basic',x:0,z:0,target:u.id}]){const before=g.bonk.projectiles.length;assert.equal(g.command('p',command),false);assert.equal(g.bonk.projectiles.length,before);}assert.equal(g.command('other',{type:'bkCancelCast'}),false);
});

test('AUTO retains nearest-enemy targeting without manual input and resumes after release or stale aim expiry',()=>{
 for(const expired of [false,true]){const {g,u}=arena(),target=enemy(g,u,5,0);u.bonkSkillAuto.basic=true;g.command('p',{type:'bkMove',dx:0,dz:1});assert.ok(g.command('p',{type:'bkAim',active:true,x:u.x,z:u.z-10}));if(expired){u.roManualAim.until=0;}else assert.ok(g.command('p',{type:'bkAim',active:false}));g.tick(.05);const attack=g.effects.find(e=>e.type==='roAttack'&&e.skillKey==='basic');assert.ok(attack);assert.equal(attack.target,target.id);const shot=g.bonk.projectiles[0];assert.ok(shot.dx>.99);assert.ok(Math.abs(shot.dz)<.1);}
});

test('casting stops movement and ice momentum, preserves aimed target until release and right-click cancels without spending SP',()=>{
 const {g,u}=arena(),target=enemy(g,u,5,0);const castTime=roSkillCastTime(BONK_WEAPONS.firebolt,1,bonkStats(u)).total;assert.ok(castTime>0);u.roIceMotion={x:6,z:0};g.command('p',{type:'bkMove',dx:1,dz:0});const start={x:u.x,z:u.z},mana=u.mana;assert.ok(g.command('p',{type:'bkCast',key:'firebolt',x:target.x,z:target.z,target:target.id}));assert.ok(u.roCasting);assert.equal(u.roCasting.aim.target,target.id);assert.equal(u.roIceMotion,undefined);for(let i=0;i<4;i++){assert.ok(g.command('p',{type:'bkMove',dx:1,dz:0}));g.tick(.05);near(u.x,start.x);near(u.z,start.z);assert.ok(u.roCasting);}assert.ok(g.command('p',{type:'bkCancelCast'}));assert.equal(u.roCasting,undefined);assert.equal(u.bonkWeaponAt.firebolt,undefined);assert.ok(u.mana>=Math.min(mana,u.maxMana));assert.equal(g.bonk.projectiles.length,0);assert.ok(g.command('p',{type:'bkMove',dx:1,dz:0}));g.tick(.05);assert.ok(u.x>start.x);
});

test('a cast that completes keeps the original selected enemy and only then spends SP and starts its recast',()=>{
 const {g,u}=arena(),target=enemy(g,u,5,0);assert.ok(g.command('p',{type:'bkCast',key:'firebolt',x:target.x,z:target.z,target:target.id}));const duration=u.roCasting.duration;assert.ok(g.command('p',{type:'bkAim',active:true,x:u.x,z:u.z-10}));advance(g,duration+.1);const attack=g.effects.find(e=>e.type==='roAttack'&&e.skillKey==='firebolt');assert.ok(attack);assert.equal(attack.target,target.id);assert.equal(u.roCasting,undefined);assert.ok(u.bonkWeaponAt.firebolt>0);
});

test('Ragnarok UI selects directed skills, left-click confirms and right-click cancels; held WASD is quiet during casting',()=>{
 const sent=[],interactions=[],u={id:1,alive:true},state={options:{mode:'bonk'},players:{p:1},units:[u],bonk:{stage:'playing',weapons:[{key:'basic',kind:'projectile',ready:true,attackDelay:.8},{key:'firebolt',kind:'projectile',ready:true}]}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'p',send:c=>(sent.push(c),true),getHeld:()=>new Set(['w']),view:{setInteraction:value=>interactions.push(value)}});
 ui.action('skill',1);assert.equal(sent.length,0);assert.equal(ui.aiming(),'firebolt');ui.point({point:{x:-5,z:-8},button:0,aimPressed:true});assert.deepEqual(sent.slice(0,2),[{type:'bkAim',active:true,x:-5,z:-8},{type:'bkCast',key:'firebolt',x:-5,z:-8}]);assert.equal(ui.aiming(),null);ui.point({point:{x:0,z:0},button:2});assert.equal(sent.at(-1).type,'bkCancelCast');state.bonk.casting={key:'firebolt'};ui.updateInput(1000);assert.deepEqual(sent.at(-1),{type:'bkMove',dx:0,dz:0});delete state.bonk.casting;ui.updateInput(2000);assert.deepEqual(sent.at(-1),{type:'bkMove',dx:0,dz:-1});assert.equal(interactions.at(-1),'command');
});
