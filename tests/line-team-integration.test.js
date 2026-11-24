import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {ITEMS} from '../shared/catalog.js';
import {merchantPosition} from '../shared/instances.js';
import {stockForHero} from '../shared/shop-stock.js';
import {lineAllies,canRecruitAgainst} from '../shared/line-team-rules.js';
import {lineMarkup} from '../src/line-war-ui.js';
import {npcShopMarkup} from '../src/npc-shop-ui.js';
import {sceneState} from '../src/scene-state.js';
import {hoverRelation} from '../src/hover-highlight.js';
import {resolveUnitCollisions,unitRadius,unitBlocked} from '../shared/unit-collision.js';

function setup(start=true){const g=new Game(7381,{mode:'linewars',lineTeams:true});for(let i=0;i<4;i++)g.addPlayer('p'+i,['knight','ranger','mage','owl'][i],'P'+i,i!==0);if(start)assert.equal(g.initLineWars(),true);return g;}
function shop(g,u){const p=merchantPosition(u,'equipment');u.x=p.x;u.z=p.z;u.shopInteraction='equipment';u.gold=100000;u.inventory=[];}

test('each team starts with its own complete stock; partners share it and enemies cannot exhaust it',()=>{
 const g=setup(false);assert.equal(g.options.teamCount,2);assert.equal(g.options.teamSize,2);for(const team of [1,2])for(const key of Object.keys(ITEMS))assert.ok(g.teamStock[team][key]>=1);
 const a=g.player('p0'),ally=g.player('p1'),enemy=g.player('p2');for(const u of [a,ally,enemy])shop(g,u);const key='mask';assert.equal(ITEMS[key].stock,1);assert.equal(g.command(a.owner,{type:'item',item:key}),true);assert.equal(stockForHero(g,a)[key],0);assert.equal(stockForHero(g,enemy)[key],1);const gold=ally.gold;assert.equal(g.command(ally.owner,{type:'item',item:key}),false);assert.equal(ally.gold,gold);assert.equal(g.command(enemy.owner,{type:'item',item:key}),true);assert.notEqual(g.teamStock[1],g.teamStock[2]);
 const html=npcShopMarkup(a,'equipment',g.snapshot());assert.match(html,/Estoque exclusivo da sua equipe/);assert.match(html,/Esgotado nesta visita/);const other=setup(false),otherEnemy=other.player('p2');shop(other,otherEnemy);other.teamStock[1].mask=0;const maskButton=npcShopMarkup(otherEnemy,'equipment',other.snapshot()).match(/<button[^>]*data-npc-buy="mask"[^>]*>/)?.[0];assert.ok(maskButton);assert.doesNotMatch(maskButton,/disabled/);
});
test('allied camera focus keeps both defenders, own drops and only their shared field visible',()=>{
 const g=setup();g.drops=[{id:999,owner:'p0',x:0,z:0,expires:999,skill:'critical'}];const s=g.snapshot(),ours=sceneState(s,'p1','p0'),enemy=sceneState(s,'p2','p0');assert.equal(ours.origin.x,0);assert.deepEqual(ours.state.units.filter(u=>u.hero).map(u=>u.owner),['p0','p1']);assert.equal(ours.state.drops[0].owner,'p0');assert.equal(ours.state.lineWars.buildings.length,32);assert.equal(enemy.state.lineWars.buildings.length,32);assert.deepEqual(enemy.state.units.filter(u=>u.hero).map(u=>u.owner),['p2','p3']);assert.equal(lineAllies(s,'p0','p1'),true);assert.equal(canRecruitAgainst(s,'p0','p1'),false);assert.equal(canRecruitAgainst(s,'p0','p2'),true);assert.equal((lineMarkup(s,'p0',{army:true,inspectedOwner:'p1'}).match(/data-line-queue=/g)||[]).length,0);assert.equal((lineMarkup(s,'p0',{army:true,inspectedOwner:'p2'}).match(/data-line-queue=/g)||[]).length,16);
});
test('allied defenders phase through teammates while hostile bodies still block their shared field',()=>{
 const g=setup(),a=g.player('p0'),ally=g.player('p1');a.x=ally.x=0;a.z=ally.z=-7;a.order=ally.order='stop';assert.equal(a.cell,ally.cell);resolveUnitCollisions(g,1/30);assert.equal(Math.hypot(a.x-ally.x,a.z-ally.z),0);assert.equal(unitBlocked(g,a,ally),false);const hostile={...a,id:g.id(),owner:'line-creep:p2',team:g.player('p2').team,lineCreep:true};g.units.push(hostile);assert.equal(unitBlocked(g,a,hostile),true);resolveUnitCollisions(g,1/30);for(const defender of [a,ally])assert.ok(Math.hypot(defender.x-hostile.x,defender.z-hostile.z)>=unitRadius(defender)+unitRadius(hostile)-.001);assert.equal(hoverRelation({owner:'line-creep:p1',lineAttacker:'p1',lineCreep:true,team:11},'p0',g.snapshot()),'ally');assert.equal(hoverRelation({owner:'line-creep:p2',lineAttacker:'p2',lineCreep:true,team:12},'p0',g.snapshot()),'enemy');
});
test('a partial team room waits for four real defenders without a negative preparation clock',()=>{
 const g=new Game(7,{mode:'linewars',lineTeams:true});g.addPlayer('a');g.addPlayer('b');g.command('a',{type:'ready'});g.command('b',{type:'ready'});for(let i=0;i<400;i++)g.tick(1/30);assert.equal(g.phase,'preparation');assert.ok(g.timer>=2.99);assert.match(g.message,/Aguardando/);assert.equal(g.addPlayer('c'),true);assert.equal(g.addPlayer('d'),true);for(const id of ['c','d'])g.command(id,{type:'ready'});for(let i=0;i<100&&!g.lineWars;i++)g.tick(1/30);assert.ok(g.lineWars);
});
test('the real 2x2 bot loop receives far lane threats and defends its assigned route',()=>{
 const g=setup(),attacker=g.player('p2');attacker.gold=100000;g.sendLineUnit(attacker,{unitKey:'shieldling',target:'p1'});const bot=g.player('p1'),creep=g.units.at(-1);creep.x=10;creep.z=-20;bot.order='auto';g.tick(1/30);assert.equal(bot.lineDefense.routeId,'east');assert.ok(bot.lineDefense.threats>=1);assert.equal(bot.lineDefense.targetId,creep.id);assert.equal(bot.order,'attackMove');assert.ok(bot.destination.z<bot.z);assert.equal(g.units.filter(u=>u.hero&&u.cell.x===0).length,2);
});
