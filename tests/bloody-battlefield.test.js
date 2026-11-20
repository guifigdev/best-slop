import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BLOODY_BATTLEFIELD as FIELD,bloodyPreparationPlot,bloodyTerrainBlocked,bloodyBattleContext,bloodyPreparationValid,BLOODY_WORLD_SCALE as S,bloodyHeightAt} from '../shared/bloody-battlefield.js';
import {BLOODY_TERRAIN_DATA as DATA} from '../shared/bloody-terrain-data.js';
import {BLOODY_UNITS,bloodyFormationArea} from '../shared/bloody-tournament-catalog.js';
import {castlePassable,moveCastleUnit} from '../shared/castle-navigation.js';

function game(teams=false,count=teams?10:8){const g=new Game(93,{game:'bloody',bloodyTeams:teams,teamSize:5});for(let i=0;i<count;i++)assert.equal(g.addPlayer('owner'+i,'knight','Commander '+i,false,teams?(i%2)+1:null),true);g.initBloodyTournament();return g;}
const commanders=g=>g.units.filter(u=>u.bloodyCommander);
function command(g,p,type,data={}){return g.command(p.owner,{type:'bt'+type,...data});}
function battle(g){for(const p of commanders(g))assert.ok(command(g,p,'Ready'));g.tick(2.1);assert.equal(g.bloodyTournament.stage,'battle');}

test('eight preparation gardens and fronts preserve scaled verified native regions; extra team gardens are explicit',()=>{
 assert.equal(FIELD.source.map,'Star Wars Blood Tournament 6.4d');assert.equal(FIELD.fronts.length,8);assert.equal(FIELD.preparationPlots.length,10);
 for(let seat=0;seat<8;seat++){const plot=bloodyPreparationPlot(seat),native=DATA.regions[plot.name];for(const key of ['minX','maxX','minZ','maxZ'])assert.equal(plot[key],native[key]*S);assert.equal(plot.native,true);assert.equal(bloodyTerrainBlocked(plot.center,.4),true,'private plots cannot be reached from battle terrain');}
 for(let seat=8;seat<10;seat++){const plot=bloodyPreparationPlot(seat);assert.equal(plot.native,false);assert.ok(Math.abs(plot.center.x)>48);}
 assert.ok(FIELD.obstacles.length<300,'quarter-tile WPM merges into a compact exact collision map');
});

test('all eight native approaches and reinforcement zones navigate to the central battlefield for large grounded bodies',()=>{
 const g={time:0,units:[]},ctx=bloodyBattleContext(g);
 for(const front of FIELD.fronts)for(const anchor of [front,front.reinforcement]){
  const u={id:1,alive:true,x:anchor.x,z:anchor.z,speed:6,size:2,collisionRadius:1.2};assert.equal(castlePassable(ctx,u,1.2),true,front.key+' native spawn');
  for(let i=0;i<180&&Math.hypot(u.x,u.z)>1;i++){ctx.elapsed+=.1;moveCastleUnit(ctx,u,{x:0,z:0},.1);assert.equal(bloodyTerrainBlocked(u,u.collisionRadius),false);}
  assert.ok(Math.hypot(u.x,u.z)<2,front.key+' approach remains connected, including source ramps');
 }
});

test('source water and cliffs block ground; collision boxes match every quarter-tile WPM cell',()=>{
 const ctx=bloodyBattleContext({time:0,units:[]});let blocked=0,open=0;
 for(let row=0;row<384;row+=5)for(let col=0;col<384;col+=5){const p={x:(-48+(col+.5)*.25)*S,z:(48-(row+.5)*.25)*S},solid=bloodyTerrainBlocked(p,0);assert.equal(castlePassable(ctx,p,0),!solid);if(solid)blocked++;else open++;}
 assert.ok(blocked>1000&&open>1000);assert.equal(bloodyTerrainBlocked({x:0,z:0},.5),false);assert.equal(bloodyTerrainBlocked({x:49*S,z:0},0),true);
});

for(const teams of [false,true])test(`${teams?'five versus five':'eight-player free-for-all'}: owned formations teleport armies onto valid central approaches, commanders stay protected`,()=>{
 const g=game(teams),players=commanders(g),homes=players.map(p=>({x:p.x,z:p.z}));
 for(const [i,p]of players.entries()){
  const key=Object.keys(BLOODY_UNITS)[i%Object.keys(BLOODY_UNITS).length];assert.ok(command(g,p,'Buy',{unitKey:key}));assert.ok(command(g,p,'Buy',{unitKey:'shieldwall'}));
  const plot=bloodyFormationArea(p.btPadSeat??p.seat),entry=p.btRoster[0];assert.ok(entry.x>plot.minX&&entry.x<plot.maxX&&entry.z>plot.minZ&&entry.z<plot.maxZ);assert.ok(bloodyPreparationValid(p.btPadSeat??p.seat,entry));
  assert.equal(command(g,players[(i+1)%players.length],'Place',{entryId:entry.id,x:entry.x,z:entry.z}),false);
 }
 battle(g);const troops=g.units.filter(u=>u.bloodyUnit);
 for(const p of players){const expected=p.btRoster.reduce((n,e)=>n+BLOODY_UNITS[e.key].count,0);assert.equal(troops.filter(u=>u.owner===p.owner).length,expected);}
 for(const u of troops){assert.ok(u.x>=-48*S&&u.x<=48*S&&u.z>=-48*S&&u.z<=48*S);assert.ok(Math.hypot(u.x,u.z)>20*S&&Math.hypot(u.x,u.z)<40*S);if(!u.flying)assert.equal(bloodyTerrainBlocked(u,u.collisionRadius),false);assert.ok(players.some(p=>p.owner===u.owner&&p.btTeam===u.team));}
 for(let i=0;i<240;i++)g.tick(.1);
 for(const [i,p]of players.entries()){assert.deepEqual({x:p.x,z:p.z},homes[i]);assert.ok(p.invulnerable&&p.noCollision&&p.alive);assert.ok(!troops.some(u=>u.target===p.id));}
 const active=troops.filter(u=>u.alive);assert.ok(active.some(u=>Math.hypot(u.x,u.z)<15),'armies meet toward the center instead of fighting on private gardens');
 for(const u of active)if(!u.flying)assert.equal(bloodyTerrainBlocked(u,u.collisionRadius),false);
 const snapshot=g.snapshotBloodyTournament();assert.equal(snapshot.formations.length,players.length);assert.equal(snapshot.battlefield.adaptedPlots,teams);assert.equal(snapshot.battlefield.nativePlayers,8);
});

for(const teams of [false,true])test(`${teams?'5v5':'8 FFA'} full supply armies spawn every purchased unit and march without escaping native pathability`,()=>{
 const g=game(teams);
 for(const p of commanders(g)){p.gold=100000;for(let i=0;i<10;i++)assert.ok(command(g,p,'Buy',{unitKey:'shieldwall'}));}
 battle(g);const troops=g.units.filter(u=>u.bloodyUnit);assert.equal(troops.length,teams?300:240);
 for(const u of troops){assert.equal(bloodyTerrainBlocked(u,u.collisionRadius),false);assert.ok(Math.abs(u.x)<48*S&&Math.abs(u.z)<48*S);}
 for(let i=0;i<300;i++)g.tick(.1);
 for(const p of commanders(g))assert.ok(troops.some(u=>u.owner===p.owner&&Math.hypot(u.x,u.z)<23),'full supply army from '+p.owner+' marches toward central clash');
 for(const u of troops.filter(u=>u.alive))assert.equal(bloodyTerrainBlocked(u,u.collisionRadius),false);
});

test('large monsters on the eastern native front follow the real approach march and reach central combat',()=>{
 const g=game();for(const p of commanders(g))assert.ok(command(g,p,'Buy',{unitKey:'hydra'}));battle(g);
 const army=g.units.filter(u=>u.bloodyUnit);for(const u of army){u.hp=u.maxHp=1e8;u.damage=0;}
 const eastern=army.find(u=>u.owner==='owner3');assert.ok(eastern.x>25&&eastern.z<0);
 for(let i=0;i<350;i++)g.tick(.1);
 assert.ok(Math.hypot(eastern.x,eastern.z)<12);assert.equal(eastern.btAdvance,false);assert.equal(bloodyTerrainBlocked(eastern,eastern.collisionRadius),false);
});

test('expanded central summit stays smooth, finite and walkable on four approaches; garden floors stay level',()=>{
 assert.equal(S,2);assert.equal(FIELD.map.width,248);assert.equal(FIELD.map.depth,192);
 assert.ok(bloodyHeightAt(0,0)>6);
 const ctx=bloodyBattleContext({time:0,units:[]});
 for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
  let previous=bloodyHeightAt(0,0);
  for(let d=.5;d<=35;d+=.5){const p={x:dx*d,z:dz*d},height=bloodyHeightAt(p);assert.ok(Number.isFinite(height));assert.ok(Math.abs(height-previous)<.3,'gentle continuous ascent');assert.equal(castlePassable(ctx,p,.35),true,'summit adds no invisible obstacle');previous=height;}
 }
 for(const p of FIELD.preparationPlots)assert.equal(bloodyHeightAt(p.center),0);
 for(const prop of FIELD.obstacles.filter(o=>o.scenery))assert.equal(castlePassable(ctx,prop,.2),false,'visible trunks and cones have physical footprints');
});
