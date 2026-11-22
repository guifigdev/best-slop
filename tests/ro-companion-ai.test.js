import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {addRoomBots} from '../server/room-bots.js';
test('Ragnarok room bots follow a real ally, spend attributes and select their personal improvement',()=>{
 const g=new Game(181,{mode:'bonk'});g.bonkOnline=true;g.addPlayer('host','knight');const room={game:g,members:new Map()};assert.equal(addRoomBots(room,1),1);
 const bot=g.heroes().find(u=>u.roomBot),lead=g.player('host');g.command('host',{type:'bkReady'});g.units=g.heroes();g.bonk.spawnAt=1e9;g.bonk.ambientSeeded=true;g.bonk.bossSpawned=true;g.bonk.objectives=[];
 lead.x=0;lead.z=23;bot.x=10;bot.z=23;const before=bot.x,points=bot.attributePoints;
 bot.bonkPendingLevels=1;bot.bonkOffer={id:77,choices:[{id:'learn-fire',kind:'weapon',key:'firebolt',level:1}]};
 for(let i=0;i<8;i++)g.tick(.1);
 assert.ok(bot.x<before);assert.equal(bot.bonkBuild.weapons.firebolt,1);assert.equal(bot.bonkOffer,null);assert.ok(bot.attributePoints<points);assert.equal(bot.bonkDisconnected,false);
});
