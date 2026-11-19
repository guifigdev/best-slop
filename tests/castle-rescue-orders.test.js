import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {CASTLE_RESCUE_STRIKE as RS} from '../shared/castle-rescue.js';
import {skillPreview} from '../src/skill-preview.js';
import {createCastleUI} from '../src/castle-ui.js';

function setup(){const g=new Game(114,{mode:'castlefight'});g.addPlayer('p','mage');g.addPlayer('q','knight');g.initCastleFight();const p=g.player('p');Object.assign(p,{x:-25,z:9});return{g,p};}

test('far rescue orders approach via navigation, do not spend the charge early, and cast exactly once on entering range',()=>{
 const {g,p}=setup(),cf=g.castleFight;
 assert.equal(g.command('p',{type:'cfRescueStrike',x:0,z:9}),true);assert.ok(p.castleRescueOrder);assert.equal(cf.players.p.rescueCharges,1);assert.equal(cf.rescueStrikes.length,0);
 const snap=JSON.parse(JSON.stringify(g.snapshot())).units.find(u=>u.owner==='p');assert.deepEqual({x:snap.castleRescueOrder.x,z:snap.castleRescueOrder.z},{x:0,z:9});
 for(let i=0;i<120&&cf.players.p.rescueCharges;i++)g.tick(.05);
 assert.equal(cf.players.p.rescueCharges,0);assert.equal(p.castleRescueOrder,null);assert.ok(Math.hypot(p.x,p.z-9)<=RS.range);assert.equal(g.effects.filter(e=>e.type==='castleRescueWarning').length,1);
 assert.equal(g.command('p',{type:'cfRescueStrike',x:0,z:9}),false);assert.match(g.commandFailureReason,/já foi usado/);
});

test('moving, stopping, blinking and starting construction cancel a pending rescue without using its charge',()=>{
 for(const command of [{type:'cfMove',x:-24,z:10},{type:'cfStop'},{type:'cfBlink',x:-23,z:9},{type:'cfBuild',building:'elf_h08X',x:-34,z:18}]){
  const {g,p}=setup();p.gold=p.lumber=10000;assert.equal(g.command('p',{type:'cfRescueStrike',x:0,z:9}),true);
  assert.equal(g.command('p',command),true,g.commandFailureReason);assert.equal(p.castleRescueOrder,null);for(let i=0;i<10;i++)g.tick(.05);
  assert.equal(g.castleFight.players.p.rescueCharges,1);assert.equal(g.effects.some(e=>e.type==='castleRescueWarning'),false);
 }
});

test('unreachable approach fails with an actionable reason and no charge is consumed',()=>{
 const {g,p}=setup();g.castleFight.obstacles.push({x:0,z:0,w:104,d:56});g.castleFight.navigationRevision++;
 assert.equal(g.command('p',{type:'cfRescueStrike',x:0,z:9}),false);assert.match(g.commandFailureReason,/caminho livre/);assert.equal(g.castleFight.players.p.rescueCharges,1);
});

test('the actual rescue UI preview permits walking into range and uses the Castle map bounds and enlarged effect radius',()=>{
 const {g,p}=setup(),ui=createCastleUI({send:c=>g.command('p',c),getState:()=>g.snapshot(),getOwner:()=> 'p',view:{setInteraction(){},setCastleBuild(){}},toast(){},portrait(){}});
 ui.shortcut('skill',2);const request=ui.skillPreview();assert.equal(request.skill.radius,RS.radius);assert.equal(request.skill.moveIntoRange,true);
 const preview=point=>skillPreview({...request,hero:p,point,state:g.snapshot()});
 assert.equal(preview({x:0,z:9}).valid,true);assert.match(preview({x:0,z:9}).hint,/se aproxima/);assert.ok(preview({x:0,z:9}).shapes.some(s=>s.role==='effect'&&s.radius===RS.radius));
 assert.equal(preview({x:0,z:29}).valid,false);assert.match(preview({x:0,z:29}).reason,/limites/);
 ui.point({point:{x:0,z:9},button:0});assert.ok(p.castleRescueOrder);assert.equal(g.castleFight.players.p.rescueCharges,1);
});
