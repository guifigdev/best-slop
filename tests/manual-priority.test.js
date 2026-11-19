import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {controlBlockReason} from '../src/player-control.js';

function setup(mode='tower'){
 const g=new Game(29,{mode});g.addPlayer('p','knight');g.phase='wave';g.wave=1;const p=g.player('p');p.x=p.z=0;p.level=40;p.skills=['bolt','blizzard','blink','swap'];p.skillLevels={bolt:1,blizzard:1,blink:1,swap:1};p.autoSkills={bolt:true,blizzard:true,blink:true,swap:true};g.refresh(p);p.mana=p.maxMana=10000;p.accuracy=1;p.critChance=0;
 const enemy=g.spawnEnemy('frog',1.8,0,{hp:10000,damage:0,skills:[],challenge:p.challenge,cell:p.cell});enemy.order='hold';enemy.speed=0;g.random=()=>.5;return{g,p,enemy};
}
const tick=(g,n=30)=>{for(let i=0;i<n;i++)g.tick(1/30);};

test('Stop interrupts automatic combat and keeps basic attacks, automatic spells and old velocity stopped until a new order',()=>{
 const {g,p,enemy}=setup();p.vx=4;p.vz=3;p.target=enemy.id;const hp=enemy.hp;assert.ok(g.command('p',{type:'stop'}));tick(g);
 assert.equal(p.order,'stop');assert.equal(p.x,0);assert.equal(p.z,0);assert.equal(p.target,null);assert.equal(enemy.hp,hp);assert.equal(p.mana,p.maxMana);assert.equal(g.effects.some(e=>e.type==='autoCast'),false);
 assert.ok(g.command('p',{type:'attack',target:enemy.id}));tick(g,15);assert.ok(enemy.hp<hp);assert.equal(p.order,'attack');
});

test('a move command cancels an automatic channel and its remaining damage before walking away from a nearby enemy',()=>{
 const {g,p,enemy}=setup();assert.ok(g.cast(p,{slot:1,x:enemy.x,z:enemy.z}));assert.equal(p.channel,'blizzard');const hp=enemy.hp;p.manualCastPending=true;
 assert.ok(g.command('p',{type:'move',x:-8,z:0}));assert.equal(p.channel,null);assert.equal(p.manualCastPending,false);assert.equal(g.effects.find(e=>e.type==='blizzard').pulses,0);tick(g,30);
 assert.equal(p.order,'move');assert.ok(p.x<-3);assert.equal(enemy.hp,hp);assert.equal(p.target,null);
});

test('new movement orders replace the previous destination without resetting attack cooldowns',()=>{
 const {g,p}=setup();p.cd=2;g.command('p',{type:'move',x:-8,z:0});tick(g,10);const old=p.x,cd=p.cd;
 g.command('p',{type:'move',x:8,z:0});assert.equal(p.cd,cd);assert.deepEqual(p.destination,{x:8,z:0});tick(g,10);assert.ok(p.x>old);assert.equal(p.order,'move');
});

test('a manually selected attack cannot be replaced by an automatic blink, swap or channel even with a closer enemy',()=>{
 for(const mode of ['tower','campaign']){
  const {g,p,enemy}=setup(mode);enemy.x=7;const nearer=g.spawnEnemy('frog',0,2,{hp:10000,damage:0,skills:[],challenge:p.challenge,cell:p.cell});nearer.order='hold';nearer.speed=0;
  assert.ok(g.command('p',{type:'attack',target:enemy.id}));tick(g,30);assert.equal(p.target,enemy.id);assert.equal(p.order,'attack');assert.equal(p.channel,null);assert.equal(p.cooldowns.blink,undefined);assert.equal(p.cooldowns.swap,undefined);assert.equal(p.cooldowns.blizzard,undefined);assert.equal(nearer.hp,nearer.maxHp);assert.ok(p.x>0);
 }
});

test('temporary path blockage retains the manual destination and cannot resume automation; walking resumes when the passage opens',()=>{
 const {g,p,enemy}=setup();enemy.x=8;
 g.obstacles=[{x:1.6,z:0,w:.3,d:4},{x:-1.6,z:0,w:.3,d:4},{x:0,z:1.6,w:4,d:.3},{x:0,z:-1.6,w:4,d:.3}];
 assert.ok(g.command('p',{type:'move',x:8,z:0}));tick(g,30);assert.equal(p.order,'move');assert.deepEqual(p.destination,{x:8,z:0});assert.equal(p.x,0);assert.equal(p.channel,null);assert.equal(enemy.hp,enemy.maxHp);
 g.obstacles=[];g.obstacleRevision++;tick(g,30);assert.equal(p.order,'move');assert.ok(p.x>3);
});

test('Line Wars manual movement preserves its destination and takes priority over automatic spells',()=>{
 const g=new Game(19,{mode:'linewars'});g.addPlayer('p','knight');g.addPlayer('q','mage');g.initLineWars();const p=g.player('p'),route=g.lineWars.lanes[0].routes[0],point=route.path[Math.floor(route.path.length/2)];p.x=point.x;p.z=point.z;p.skills=['blink','blizzard'];p.skillLevels={blink:1,blizzard:1};p.autoSkills={blink:true,blizzard:true};
 const goal={x:p.x,z:p.z+5};assert.ok(g.command('p',{type:'move',...goal}));tick(g,15);assert.deepEqual(p.destination,goal);assert.equal(p.order,'move');assert.equal(p.channel,null);assert.equal(p.cooldowns.blink,undefined);
});

test('guard orders retain their position, pending manual aim stops automatic attacks, and normal automation resumes after the explicit target dies',()=>{
 const {g,p,enemy}=setup();enemy.x=5;g.command('p',{type:'hold'});tick(g);assert.equal(p.order,'hold');assert.equal(p.x,0);assert.equal(p.channel,null);assert.equal(p.cooldowns.blink,undefined);
 p.cooldowns={};p.nextAutoCastAt=0;p.order='auto';enemy.x=1.8;g.command('p',{type:'setCastPending',enabled:true});const hp=enemy.hp;tick(g,10);assert.equal(enemy.hp,hp);assert.equal(p.x,0);
 g.command('p',{type:'attack',target:enemy.id});enemy.alive=false;tick(g,1);assert.equal(p.order,'auto');assert.equal(p.target,null);
});

test('inspection never transfers hero control and defeat/completed trials have explicit input feedback',()=>{
 const p={alive:true};assert.equal(controlBlockReason(p), '');assert.match(controlBlockReason(p,{spectating:true}),/observando outra arena/);p.alive=false;assert.match(controlBlockReason(p,{spectating:true}),/derrotado/);assert.match(controlBlockReason(p,{mode:'linewars'}),/renascimento/);p.alive=true;p.stageDone=true;assert.match(controlBlockReason(p,{phase:'wave'}),/Sua prova terminou/);
});
