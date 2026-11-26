import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {RO_WORLD_ROUTE,roRouteStage} from '../shared/ro-world-route.js';
import {createRoCheckpoint} from '../shared/ragnarok-save.js';
import {bonkBlocked} from '../shared/bonk-level.js';
import {roWorldAtlasMarkup} from '../src/ro-world-atlas.js';

const game=(debug=false)=>{const g=new Game(121,{mode:'bonk',bonkWorld:'dominion',bonkDebug:debug});g.addPlayer('p','knight');g.command('p',{type:'bkReady'});return g;};
function choose(g){for(let i=0;g.bonk.offer&&i<90;i++)g.command('p',{type:'bkChoose',choiceId:g.bonk.offer.choices[0].id});}
function defeat(g){const u=g.player('p');u.bonkInvulnerableUntil=1e9;Object.assign(u,{x:0,z:2});g.tick(.01);const boss=g.units.find(t=>t.bonkBoss);assert.ok(boss);boss.hp=.001;boss.roSourceId=999999; // Isolate route progression from native MVP FLEE.
Object.assign(u,{x:boss.x,z:boss.z-1});u.attributes.dex=99;u.bonkBuild.weapons={basic:8,bash:8};u.bonkWeaponAt={};for(let i=0;boss.alive&&i<80;i++)g.tick(.1);assert.equal(boss.alive,false,JSON.stringify({region:g.bonk.route.key,hp:boss.hp,hero:u.alive,stage:g.bonk.stage,d:Math.hypot(u.x-boss.x,u.z-boss.z),mana:u.mana,attack:u.bonkWeaponAt}));choose(g);}
function cross(g,key){const gate=g.bonk.exitGates.find(t=>t.nextKey===key);assert.ok(gate?.open,'open passage to '+key);Object.assign(g.player('p'),{x:gate.x+gate.direction.x*3,z:gate.z+gate.direction.z*3});g.tick(.01);assert.equal(g.bonk.route.key,key);}

test('the green route reaches a three-way volcano and unlocked regions permit safe return without another MVP reward',()=>{
 const g=game();assert.equal(g.bonk.routeVersion,2);for(const next of ['payon-forest','payon-cave','geffen','glast-heim','thor-volcano']){defeat(g);cross(g,next);}
 assert.equal(g.bonk.clearedStages.length,5);assert.equal(g.bonk.exitGates.length,3);assert.ok(g.bonk.exitGates.find(t=>t.nextKey==='glast-heim').open);assert.ok(!g.bonk.exitGates.find(t=>t.nextKey==='morroc').open);defeat(g);assert.ok(g.bonk.exitGates.every(t=>t.open));
 for(const gate of g.bonk.exitGates)for(let f=0;f<.97;f+=.1)assert.equal(bonkBlocked(g.bonk.map,{x:gate.x*f,z:gate.z*f},.45),false,'clear spoke '+gate.nextKey);
 cross(g,'juno');defeat(g);const gold=g.player('p').gold;cross(g,'thor-volcano');assert.equal(g.bonk.routeBossDefeated,true);assert.ok(!g.units.some(t=>t.alive&&t.bonkBoss));assert.equal(g.player('p').gold,gold);assert.ok(!g.bonk.objects.some(t=>t.type==='chest'&&!t.used));const cp=createRoCheckpoint(g);assert.ok(cp);assert.equal(cp.routeVersion,2);assert.equal(cp.routeIndex,roRouteStage('thor-volcano').index);
});

test('v1 saves migrate into the graph preserving their hero and existing seals',()=>{
 const old=new Game(18,{mode:'bonk',bonkWorld:'midgard'});old.addPlayer('p','knight');old.command('p',{type:'bkReady'});const cp=createRoCheckpoint(old),g=new Game(7,{mode:'bonk',bonkWorld:'dominion'});g.addPlayer('p','knight');assert.ok(g.command('p',{type:'bkRestore',checkpoint:cp}));assert.equal(g.bonk.routeVersion,2);assert.equal(g.player('p').level,cp.hero.level);assert.deepEqual(g.player('p').roInventory,cp.hero.roInventory);assert.ok(createRoCheckpoint(g));
});

test('GM starts maxed, survives attacks, defeats a boss in one hit and can test regions/time/fire without account kills',()=>{
 const g=game(true),u=g.player('p');assert.equal(u.level,150);assert.equal(u.roTier,3);assert.ok(Object.values(u.attributes).every(v=>v===99));assert.ok(g.command('p',{type:'bkDebugTravel',regionKey:'thor-volcano'}));Object.assign(u,{x:0,z:2});u.bonkWeaponAt={};g.tick(.05);const boss=g.units.find(t=>t.bonkBoss);assert.ok(boss&&!boss.alive);assert.equal(boss.hp,0);assert.deepEqual(g.bonk.rewardKills,[]);assert.equal(createRoCheckpoint(g),null);
 assert.ok(g.command('p',{type:'bkDebugClock',time:482.4}));assert.equal(g.bonk.totalElapsed,482.4);assert.ok(g.command('p',{type:'bkDebugFire'}));assert.ok(u.dots.burn.until>g.time);u.bonkBuild.weapons={};u.hp=1;u.mana=1;g.tick(.1);assert.equal(u.hp,u.maxHp);assert.equal(u.mana,u.maxMana);
 const normal=game();assert.equal(normal.command('p',{type:'bkDebugTravel',regionKey:'thor-volcano'}),false);assert.equal(normal.command('p',{type:'bkDebugClock',time:0}),false);assert.equal(normal.command('p',{type:'bkDebugFire'}),false);
});

test('the compact atlas shows all twelve regions, the volcano junction, northern ice and GM controls only when requested',()=>{
 const g=game(),normal=roWorldAtlasMarkup(g.snapshotBonk());assert.equal((normal.match(/data-region=/g)||[]).length,RO_WORLD_ROUTE.length);assert.match(normal,/vulcão central/);assert.match(normal,/gelo ao norte/);assert.ok(!normal.includes('data-bk-debug-travel'));const debug=roWorldAtlasMarkup(g.snapshotBonk(),{debug:true});assert.match(debug,/data-bk-debug-travel/);assert.match(debug,/data-bk-debug-sky/);assert.match(debug,/data-bk-debug-fire/);
});


test('the northern branch can be finished before the desert, survives save/restore and opens Valhalla only after all twenty-one other seals',()=>{
 const g=game();for(const next of ['payon-forest','payon-cave','geffen','glast-heim','thor-volcano']){defeat(g);cross(g,next);}defeat(g);cross(g,'juno');defeat(g);cross(g,'ice-cavern');defeat(g);
 assert.equal(g.bonk.clearedStages.length,8);assert.equal(g.bonk.exitGates.find(t=>t.nextKey==='valhalla').lockedBy,'final');
 for(const next of ['juno','thor-volcano','morroc'])cross(g,next);defeat(g);cross(g,'morroc-pyramid');defeat(g);cross(g,'rachel');defeat(g);assert.equal(g.bonk.clearedStages.length,11);
 const cp=createRoCheckpoint(g),resumed=new Game(29,{mode:'bonk',bonkWorld:'dominion'});assert.ok(cp);resumed.addPlayer('p','knight');assert.ok(resumed.command('p',{type:'bkRestore',checkpoint:cp}));assert.deepEqual(resumed.bonk.clearedStages,g.bonk.clearedStages);
 for(const next of ['morroc-pyramid','morroc','thor-volcano','juno'])cross(resumed,next);cross(resumed,'thanatos-tower');defeat(resumed);cross(resumed,'juno');cross(resumed,'ice-cavern');cross(resumed,'lutie');defeat(resumed);cross(resumed,'toy-factory');defeat(resumed);for(const next of ['lutie','ice-cavern','juno','thor-volcano','glast-heim','geffen','clock-tower'])cross(resumed,next);defeat(resumed);for(const next of ['geffen','payon-cave','payon-forest','prontera','alberta'])cross(resumed,next);defeat(resumed);cross(resumed,'turtle-island');defeat(resumed);cross(resumed,'alberta');cross(resumed,'amatsu');defeat(resumed);for(const next of ['alberta','prontera','payon-forest','payon-cave','geffen','glast-heim','thor-volcano','morroc','comodo'])cross(resumed,next);defeat(resumed);cross(resumed,'umbala');defeat(resumed);cross(resumed,'niflheim');defeat(resumed);for(const next of ['umbala','comodo','morroc','thor-volcano','juno'])cross(resumed,next);for(const next of ['biolab-1','biolab-2','biolab-3']){cross(resumed,next);defeat(resumed);}for(const next of ['biolab-2','biolab-1','juno','ice-cavern','valhalla'])cross(resumed,next);assert.equal(resumed.bonk.stage,'playing');defeat(resumed);assert.equal(resumed.bonk.clearedStages.length,25);assert.equal(resumed.bonk.won,true);assert.equal(resumed.phase,'victory');assert.ok(createRoCheckpoint(resumed));
});
