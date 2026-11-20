import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {BloodyTournamentMethods,bloodyStandings} from '../shared/bloody-tournament.js';
import {BLOODY_UNITS as C,BLOODY_RULES as R,BLOODY_MAP,bloodyUnitAt,bloodyRosterFood,bloodyUpgradePrice} from '../shared/bloody-tournament-catalog.js';
import {CASTLE_UNITS} from '../shared/castle-catalog.js';
import {castleWeaponFor} from '../shared/castle-weapons.js';
import {bloodyUnitPortrait,createBloodyTournamentWorld} from '../src/bloody-tournament-world.js';
import {castleUnitVisual} from '../src/castle-unit-art.js';
import {bloodyRankingMarkup,createBloodyTournamentUI} from '../src/bloody-tournament-ui.js';
import * as T from 'three';

function setup({count=2,teams=false}={}){const g=new Game(876,{mode:'bloody',bloodyTeams:teams,teamSize:5});Object.assign(g,BloodyTournamentMethods);for(let i=0;i<count;i++)g.addPlayer('p'+i,i%2?'mage':'knight','Comandante '+i,false,teams?(i%2)+1:null);g.options={...g.options,mode:'bloody',bloodyTeams:teams};for(const u of g.heroes())g.setupBloodyPlayer(u);g.initBloodyTournament();return{g,p:g.player('p0'),q:g.player('p1')};}
const cmd=(g,p,type,extra={})=>g.bloodyTournamentCommand(p,{type:'bt'+type,...extra});
function advance(g,seconds){for(let t=0;t<seconds;t+=.05){g.time+=.05;g.tickBloodyTournament(.05);}}
function ready(g){for(const p of g.units.filter(u=>u.bloodyCommander))assert.equal(cmd(g,p,'Ready'),true);advance(g,2.1);assert.equal(g.bloodyTournament.stage,'battle');}

test('sixteen Nordic warbands have finite ranks, matching voxel illustrations and true native weapon target masks',()=>{
 assert.equal(Object.keys(C).length,16);for(const d of Object.values(C)){assert.ok(CASTLE_UNITS[d.source]);assert.match(bloodyUnitPortrait(d.key),/<svg/);for(let rank=1;rank<=3;rank++){const s=bloodyUnitAt(d.key,rank);for(const key of ['hp','damage','armor','range','speed','interval'])assert.ok(Number.isFinite(s[key]),d.key+' '+key);assert.ok(s.weapons.length>0);assert.equal(s.count,d.count);assert.ok(s.hp>0&&s.damage>0);}}
 assert.equal(bloodyUnitAt('__proto__'),null);const ground={flying:false},air={flying:true};assert.ok(castleWeaponFor(bloodyUnitAt('shieldwall'),ground));assert.equal(castleWeaponFor(bloodyUnitAt('shieldwall'),air),null);assert.ok(castleWeaponFor(bloodyUnitAt('hunters'),air));
});

test('contracts reserve gold atomically without an artificial army or supply cap and cannot mutate another commander roster',()=>{
 const{g,p,q}=setup();assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),true);assert.equal(p.gold,R.startingGold-65);assert.equal(p.btRoster.length,1);assert.equal(bloodyRosterFood(p),3);const gold=p.gold;assert.equal(cmd(g,p,'Buy',{unitKey:'__proto__'}),false);assert.equal(p.gold,gold);assert.equal(cmd(g,q,'Sell',{entryId:p.btRoster[0].id}),false);assert.equal(p.btRoster.length,1);
 p.gold=100000;for(let i=0;i<24;i++)assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),true);assert.equal(p.btRoster.length,25);assert.equal(bloodyRosterFood(p),75);const before=p.gold;assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),true);assert.equal(p.gold,before-C.shieldwall.cost);assert.equal(p.btRoster.length,26);
});

test('upgrades require both currencies, preserve baseline stats and sell only their actual invested gold',()=>{
 const{g,p}=setup();cmd(g,p,'Buy',{unitKey:'sniper'});const e=p.btRoster[0],before={gold:p.gold,spent:e.spent,rank:e.rank};assert.equal(cmd(g,p,'Upgrade',{entryId:e.id}),false);assert.equal(p.gold,before.gold);assert.equal(e.rank,1);p.btBlood=100;p.gold=1000;const price=bloodyUpgradePrice(e);assert.equal(cmd(g,p,'Upgrade',{entryId:e.id}),true);assert.equal(p.gold,1000-price.gold);assert.equal(p.btBlood,100-price.blood);assert.equal(e.rank,2);assert.ok(bloodyUnitAt(e.key,e.rank).hp>bloodyUnitAt(e.key,1).hp);const refund=Math.floor(e.spent*.7),gold=p.gold;assert.equal(cmd(g,p,'Sell',{entryId:e.id}),true);assert.equal(p.gold,gold+refund);assert.equal(p.btRoster.length,0);
});

test('formation placement remains inside the owned pad and rejects overlap or a foreign entry',()=>{
 const{g,p,q}=setup();cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,p,'Buy',{unitKey:'hunters'});const[e,a]=p.btRoster,area=g.snapshotBloodyTournament().formations.find(f=>f.owner===p.owner),point={x:area.minX+9,z:area.minZ+3};assert.equal(cmd(g,p,'Place',{entryId:e.id,...point}),true);assert.equal(e.x,point.x);assert.equal(cmd(g,q,'Place',{entryId:e.id,...point}),false);assert.equal(cmd(g,p,'Place',{entryId:e.id,x:-100,z:0}),false);assert.equal(cmd(g,p,'Place',{entryId:e.id,x:a.x,z:a.z}),false);assert.equal(cmd(g,p,'Formation',{formation:'balanced'}),true);
});

test('ready spawns every contract group as independent armies and locks economy during actual battle',()=>{
 const{g,p,q}=setup();cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,p,'Buy',{unitKey:'hunters'});cmd(g,q,'Buy',{unitKey:'wolves'});ready(g);const units=g.units.filter(u=>u.bloodyUnit);assert.equal(units.filter(u=>u.owner===p.owner).length,6);assert.equal(units.filter(u=>u.owner===q.owner).length,3);assert.ok(units.every(u=>u.castleUnit&&u.collisionRadius>0));assert.ok(p.invulnerable&&p.noCollision);const gold=p.gold;assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),false);assert.equal(p.gold,gold);assert.equal(cmd(g,p,'Sell',{entryId:p.btRoster[0].id}),false);const before=units.map(u=>u.hp);advance(g,35);assert.ok(units.some((u,i)=>u.hp<before[i]));assert.ok(p.btKills+q.btKills>0);assert.ok(p.btBlood+q.btBlood>0);
});

test('defeated groups return next round, lower places receive catch-up resources and awards settle once',()=>{
 const{g,p,q}=setup();cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,q,'Buy',{unitKey:'hunters'});ready(g);for(const u of g.units.filter(u=>u.bloodyUnit&&u.owner===q.owner)){u.alive=false;u.hp=0;}const goldP=p.gold,goldQ=q.gold;advance(g,.1);assert.equal(g.bloodyTournament.stage,'results');assert.equal(p.btPoints,3);assert.equal(q.btPoints,0);assert.equal(p.gold,goldP+R.roundGold);assert.equal(q.gold,goldQ+R.roundGold+R.catchupGold);const settled=q.gold;advance(g,1);assert.equal(q.gold,settled);advance(g,8);assert.equal(g.bloodyTournament.stage,'preparation');ready(g);assert.equal(g.units.filter(u=>u.bloodyUnit&&u.owner===q.owner&&u.alive).length,C.hunters.count);assert.equal(g.bloodyTournament.round,2);
});

test('team mode honors party squads, shares points and crowns team winners after the final round',()=>{
 const{g,p,q}=setup({count:4,teams:true});for(const u of g.heroes())cmd(g,u,'Buy',{unitKey:'shieldwall'});assert.equal(g.player('p0').btTeam,g.player('p2').btTeam);assert.notEqual(p.btTeam,q.btTeam);ready(g);g.bloodyTournament.round=g.bloodyTournament.roundLimit;for(const u of g.units.filter(u=>u.bloodyUnit&&u.team===q.btTeam))u.alive=false;advance(g,.1);assert.equal(g.phase,'victory');assert.equal(g.bloodyTournament.finished,true);assert.equal(g.player('p0').btPoints,g.player('p2').btPoints);assert.deepEqual(new Set(g.winningOwners),new Set(['p0','p2']));assert.equal(bloodyStandings(g)[0].team,p.btTeam);assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),false);
});

test('equal empty battle does not fabricate a sole winner and timed scoring is bounded and explicit',()=>{
 const{g,p,q}=setup();cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,q,'Buy',{unitKey:'shieldwall'});ready(g);for(const u of g.units.filter(u=>u.bloodyUnit))u.alive=false;advance(g,.1);assert.equal(g.bloodyTournament.history[0].tie,true);assert.equal(p.btPoints,1);assert.equal(q.btPoints,1);
});

test('round snapshots and score UI expose actual armies and names safely without issuing commands',()=>{
 const{g,p}=setup();p.name='<script>bad()</script>';cmd(g,p,'Buy',{unitKey:'healer'});const s={...g.snapshot(),options:g.options,bloodyTournament:g.snapshotBloodyTournament()};const html=bloodyRankingMarkup(s,p.owner);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);const sent=[],ui=createBloodyTournamentUI({send:c=>(sent.push(c),true),getState:()=>s,getOwner:()=>p.owner});ui.point({point:{x:p.x,z:p.z},bloodyEntry:p.btRoster[0].id,bloodyOwner:p.owner,button:0});ui.point({point:{x:25,z:-19},button:2});assert.deepEqual(sent.at(-1),{type:'btPlace',entryId:p.btRoster[0].id,x:25,z:-19});ui.shortcut('legacySkill','ready');assert.equal(sent.at(-1).type,'btReady');
});

test('instanced tournament arena is safe before initialization, finite and independently selectable',()=>{
 const scene=new T.Scene(),world=createBloodyTournamentWorld({scene}),{g,p}=setup();cmd(g,p,'Buy',{unitKey:'hydra'});try{world.update({options:{mode:'bloody'},bloodyTournament:null},0,p.owner);world.update({options:{mode:'bloody'},bloodyTournament:g.snapshotBloodyTournament()},1,p.owner);assert.equal(world.root.visible,true);for(const mesh of world.root.children){if(mesh.isInstancedMesh)assert.ok(mesh.count<=mesh.instanceMatrix.count);assert.ok(mesh.geometry.attributes.position.count>0);}const e=p.btRoster[0];assert.deepEqual(world.pick(e),{bloodyEntry:e.id,bloodyOwner:p.owner});world.update({options:{mode:'tower'}},2);assert.equal(world.root.visible,false);}finally{world.dispose();}assert.equal(scene.children.length,0);
});

test('recruitment at a terrain point validates before charging and battle spawns exactly the two purchased types for their owner',()=>{
 const {g,p,q}=setup();const original=p.gold;
 assert.equal(cmd(g,p,'Buy',{unitKey:'aircraft',x:0,z:0}),false);assert.equal(p.gold,original);assert.equal(p.btRoster.length,0);
 cmd(g,p,'Buy',{unitKey:'shieldwall'});const first=p.btRoster[0];
 const gold=p.gold;assert.equal(cmd(g,p,'Buy',{unitKey:'aircraft',x:first.x,z:first.z}),false);assert.equal(p.gold,gold);
 cmd(g,p,'Buy',{unitKey:'hunters'});const last=p.btRoster.at(-1),saved={x:last.x,z:last.z};cmd(g,p,'Sell',{entryId:last.id});
 assert.equal(cmd(g,p,'Buy',{unitKey:'hunters',...saved}),true);assert.deepEqual({x:p.btRoster.at(-1).x,z:p.btRoster.at(-1).z},saved);
 cmd(g,q,'Buy',{unitKey:'aircraft'});ready(g);
 const ours=g.units.filter(u=>u.bloodyUnit&&u.owner===p.owner);
 assert.deepEqual(new Set(ours.map(u=>u.btKey)),new Set(['shieldwall','hunters']));assert.equal(ours.length,6);assert.ok(ours.every(u=>!u.flying));
 assert.ok(ours.every(u=>u.unitKey===C[u.btKey].source&&u.kind===C[u.btKey].source),'battle models use precisely the source shown by roster portraits and placement previews');
 const theirs=g.units.filter(u=>u.bloodyUnit&&u.owner===q.owner);assert.ok(theirs.every(u=>u.btKey==='aircraft'&&u.flying));
});

test('automatic full-supply garden formation fits the actual width of three human models per group',()=>{
 const {g,p}=setup();p.gold=100000;for(let i=0;i<10;i++)assert.ok(cmd(g,p,'Buy',{unitKey:'shieldwall'}));
 const area=g.snapshotBloodyTournament().formations.find(f=>f.owner===p.owner),visual=castleUnitVisual(C.shieldwall.source),left=Math.min(...visual.parts.map(part=>part[0]-part[3]/2)),right=Math.max(...visual.parts.map(part=>part[0]+part[3]/2));
 assert.ok(visual.height>2&&visual.height<2.5,'humans keep their readable human scale');
 for(const entry of p.btRoster){assert.ok(entry.x-1.8+left>=area.minX,'entire left soldier stays inside the garden');assert.ok(entry.x+1.8+right<=area.maxX,'entire right soldier stays inside the garden');}
 assert.ok(area.maxX-area.minX>8*(right-left),'garden has room for ranks rather than dwarfing every soldier into a marker');
});


test('large purchased armies deploy every soldier beyond the former twelve-group and thirty-supply caps',()=>{
 const{g,p,q}=setup();p.gold=100000;for(let i=0;i<24;i++)assert.equal(cmd(g,p,'Buy',{unitKey:'shieldwall'}),true);assert.equal(cmd(g,q,'Buy',{unitKey:'shieldwall'}),true);ready(g);
 const ours=g.units.filter(u=>u.bloodyUnit&&u.owner===p.owner);assert.equal(ours.length,72);assert.equal(new Set(ours.map(u=>u.btEntry)).size,24);assert.ok(ours.every(u=>u.alive&&Number.isFinite(u.x)&&Number.isFinite(u.z)));assert.equal(bloodyRosterFood(p),72);
});

test('opposing armies fight inside their outer square before any centre advance',()=>{
 const{g,p,q}=setup();cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,q,'Buy',{unitKey:'shieldwall'});ready(g);const soldiers=g.units.filter(u=>u.bloodyUnit),before=soldiers.map(u=>u.hp);advance(g,13);
 assert.ok(soldiers.some((u,i)=>u.hp<before[i]));assert.ok(soldiers.some(u=>u.attackAt>0&&Math.abs(u.x)>62));assert.ok(g.bloodyTournament.duels[0].status==='battle'||g.bloodyTournament.duels[0].status==='cleared');
});

test('duel survivors use the corridor and wait at the centre instead of marching into another unfinished duel',()=>{
 const{g}=setup({count:8});for(const p of g.heroes())cmd(g,p,'Buy',{unitKey:'shieldwall'});ready(g);for(const u of g.units.filter(u=>u.bloodyUnit)){if(u.owner==='p1'){u.alive=false;u.hp=0;}else if(u.btDuel!==0){u.speed=0;u.damage=0;}}
 const winners=g.units.filter(u=>u.bloodyUnit&&u.owner==='p0'),start=winners.map(u=>({x:u.x,z:u.z}));advance(g,.1);assert.ok(winners.every(u=>u.btBattleStage==='advance'));assert.equal(g.bloodyTournament.duels[0].winner,1);advance(g,5);assert.ok(winners.some((u,i)=>u.x>start[i].x));
 for(let i=0;i<1100&&winners.some(u=>u.btBattleStage!=='center');i++)advance(g,.1);assert.ok(winners.every(u=>u.btBattleStage==='center'));assert.ok(winners.every(u=>Math.hypot(u.x,u.z)<9));const positions=winners.map(u=>({x:u.x,z:u.z}));advance(g,5);for(const[i,u]of winners.entries())assert.ok(Math.hypot(u.x-positions[i].x,u.z-positions[i].z)<1,'central survivors wait while remote duels continue');
});

test('splash attacks never damage allies, including deliberately forged friendly targets',()=>{
 const{g,p,q}=setup();p.gold=1000;q.gold=1000;cmd(g,p,'Buy',{unitKey:'mortar'});cmd(g,p,'Buy',{unitKey:'shieldwall'});cmd(g,q,'Buy',{unitKey:'golem'});ready(g);const mortar=g.units.find(u=>u.owner===p.owner&&u.btKey==='mortar'),allies=g.units.filter(u=>u.owner===p.owner&&u.btKey==='shieldwall'),enemy=g.units.find(u=>u.owner===q.owner&&u.bloodyUnit);
 Object.assign(mortar,{x:-85,z:0,target:allies[0].id,cd:0});Object.assign(enemy,{x:-81,z:0,hp:100000,maxHp:100000,damage:0,speed:0});for(const[i,u]of allies.entries())Object.assign(u,{x:-81.1,z:.3+i*.2,hp:100000,maxHp:100000,damage:0,speed:0});const before=allies.map(u=>u.hp);advance(g,.2);assert.ok(enemy.hp<enemy.maxHp);assert.deepEqual(allies.map(u=>u.hp),before);assert.ok(!g.effects.some(e=>e.type==='damage'&&e.source===mortar.id&&allies.some(u=>u.id===e.target)));
});

test('ten-player parties stay in four paired arenas and all recorded hits respect team ownership',()=>{
 const{g}=setup({count:10,teams:true});for(const p of g.heroes())cmd(g,p,'Buy',{unitKey:'shieldwall'});ready(g);const troops=g.units.filter(u=>u.bloodyUnit);assert.equal(troops.length,30);assert.equal(new Set(troops.map(u=>u.btDuel)).size,4);for(let i=0;i<4;i++)assert.deepEqual(new Set(troops.filter(u=>u.btDuel===i).map(u=>u.team)),new Set([1,2]));const hits=[],fx=g.fx.bind(g);g.fx=(type,x,z,data)=>{if(type==='damage')hits.push(data);fx(type,x,z,data);};advance(g,17);assert.ok(hits.length>0);for(const hit of hits){const a=troops.find(u=>u.id===hit.source),b=troops.find(u=>u.id===hit.target);assert.ok(a&&b);assert.notEqual(a.team,b.team);}
});
