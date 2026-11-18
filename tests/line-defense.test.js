import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {lineDefenseThink} from '../shared/line-defense.js';
import {navigation,moveUnit} from '../shared/field.js';
import {unitRadius} from '../shared/unit-collision.js';

function setup(){const g=new Game(19,{mode:'linewars'});g.addPlayer('a','knight','A',true);g.addPlayer('b','mage','B');g.initLineWars();return{g,h:g.player('a'),other:g.player('b'),lane:g.lineWars.lanes[0]};}
function invader(g,lane,route='west',z=-30,extra={}){const path=lane.routes.find(r=>r.id===route).path,x=path[0].x,u=g.spawnEnemy('goblin',x,z,{hp:500,damage:12,armor:0,range:1.5,speed:3,interval:1.5,team:1000+lane.index,owner:'attacker',skills:[],skillLevels:{},cell:lane.cell,lineCreep:true,lineLane:lane.owner,...extra});u.lineRoute=route;u.linePortalDamage=extra.linePortalDamage||1;return u;}
function teamSetup(){const {g,h,lane}=setup(),ally=g.player('b'),east=lane.routes.find(r=>r.id==='east'),west=lane.routes.find(r=>r.id==='west');g.options.lineTeams=true;ally.bot=true;ally.team=h.team;ally.squad=h.squad=1;ally.cell=h.cell;ally.x=east.path[0].x;ally.z=8;h.x=west.path[0].x;h.z=8;const a={...lane,routeId:'west',routes:[west],portal:west.path.at(-1)},b={...lane,owner:ally.owner,heroId:ally.id,routeId:'east',routes:[east],portal:east.path.at(-1),index:1};g.lineWars.lanes=[a,b];return{g,h,ally,west:a,east:b};}

test('a bot sees an invader beyond local acquisition and actually starts walking to defend it',()=>{
 const {g,h,lane}=setup(),u=invader(g,lane,'west',-35);assert.ok(Math.hypot(u.x-h.x,u.z-h.z)>40);const x=h.x,z=h.z;assert.equal(lineDefenseThink(g,h),true);assert.equal(h.order,'attackMove');assert.equal(h.target,null);assert.equal(h.lineDefense.targetId,u.id);assert.equal(h.lineDefense.routeId,'west');assert.equal(h.lineDefense.threats,1);assert.ok(h.lineDefense.remaining>60);assert.ok(h.lineDefense.eta>15);
 for(let i=0;i<20;i++){lineDefenseThink(g,h);const to=navigation(g,h,h.destination),d=Math.hypot(to.x-h.x,to.z-h.z);if(d)moveUnit(g,h,{x:h.x+(to.x-h.x)/d*.1*h.speed,z:h.z+(to.z-h.z)/d*.1*h.speed});g.time+=.1;}assert.ok(Math.hypot(h.x-x,h.z-z)>2);
});

test('remaining route ETA prioritizes imminent leaks while HP, DPS and size still affect tied threats',()=>{
 const {g,h,lane}=setup();const distant=invader(g,lane,'west',-35,{hp:10000,damage:100,size:2,speed:2,linePortalDamage:3}),urgent=invader(g,lane,'east',34,{hp:50,damage:1,speed:5,linePortalDamage:2});urgent.x=lane.portal.x;assert.equal(lineDefenseThink(g,h),true);assert.equal(h.lineDefense.targetId,urgent.id);assert.ok(h.lineDefense.eta<1);urgent.alive=false;distant.alive=false;const small=invader(g,lane,'west',0,{hp:100,damage:2,size:.6}),big=invader(g,lane,'east',0,{hp:3000,damage:70,size:2});h.lineDefense=null;lineDefenseThink(g,h);assert.equal(h.lineDefense.targetId,big.id);assert.ok(h.lineDefense.routes.find(r=>r.routeId==='east').risk>h.lineDefense.routes.find(r=>r.routeId==='west').risk);assert.equal(small.alive,true);
});

test('changing sides above the divider walks through its crossing without teleporting or changing combat acquisition',()=>{
 const {g,h,lane}=setup();h.x=lane.x-10;h.z=-30;const target=invader(g,lane,'east',-30,{hp:2000});const start={x:h.x,z:h.z};lineDefenseThink(g,h);assert.equal(h.lineDefense.reason,'crossing');assert.deepEqual(h.destination,{x:lane.x-10,z:-7});assert.deepEqual({x:h.x,z:h.z},start);let crossed=false,reached=false;
 for(let i=0;i<1500;i++){lineDefenseThink(g,h);const to=navigation(g,h,h.destination),d=Math.hypot(to.x-h.x,to.z-h.z);if(d)moveUnit(g,h,{x:h.x+(to.x-h.x)/d*h.speed/30,z:h.z+(to.z-h.z)/d*h.speed/30});g.time+=1/30;if(Math.abs(h.x-lane.x)<2&&Math.abs(h.z+7)<4)crossed=true;if(h.x>lane.x+6&&h.z< -20){reached=true;break;}assert.equal(g.unitTerrainBlocked(h,h,unitRadius(h)),false);}
 assert.equal(crossed,true);assert.equal(reached,true,JSON.stringify({position:{x:h.x,z:h.z},debug:h.lineDefense,plan:h.lineDefensePlan}));assert.equal(h.target,null);assert.equal(target.alive,true);
});

test('two allied defenders independently cover both threatened lanes regardless of call order',()=>{
 for(const reverse of [false,true]){const {g,h,ally,west,east}=teamSetup();invader(g,west,'west',-20);invader(g,east,'east',-20);for(const defender of reverse?[ally,h]:[h,ally])assert.equal(lineDefenseThink(g,defender),true);assert.equal(h.lineDefense.routeId,'west');assert.equal(ally.lineDefense.routeId,'east');assert.equal(h.lineDefense.reason,'assigned-lane');assert.equal(ally.lineDefense.reason,'assigned-lane');assert.equal(h.lineDefense.threats,2);assert.equal(ally.lineDefense.threats,2);assert.notEqual(h.lineDefense.targetId,ally.lineDefense.targetId);}
});

test('a defender can assist the allied lane when its own lane is empty, including a human teammate',()=>{
 const {g,h,ally,east}=teamSetup();ally.bot=false;const target=invader(g,east,'east',-20);assert.equal(lineDefenseThink(g,h),true);assert.equal(h.lineDefense.routeId,'east');assert.equal(h.lineDefense.targetId,target.id);assert.equal(h.lineDefense.intent,'assist');assert.equal(h.lineDefense.threats,1);assert.equal(lineDefenseThink(g,ally),false);
});

test('dead, resolved, friendly and other-field enemies never pollute home defense or retain stale targets',()=>{
 const {g,h,lane}=setup(),unit=invader(g,lane);lineDefenseThink(g,h);assert.equal(h.lineDefense.targetId,unit.id);unit.alive=false;invader(g,lane,'east',0,{lineResolved:true});invader(g,lane,'west',0,{team:h.team});invader(g,g.lineWars.lanes[1],'west',30);assert.equal(lineDefenseThink(g,h),true);assert.equal(h.lineDefense.threats,0);assert.equal(h.lineDefense.targetId,null);assert.equal(h.lineDefense.eta,null);assert.equal(h.lineDefense.remaining,null);assert.deepEqual(h.lineDefense.routes,[]);assert.equal(h.lineDefense.reason,'patrol');
});

test('idle FFA patrol visits both lanes and does not flip its destination before arriving',()=>{
 const {g,h,lane}=setup();lineDefenseThink(g,h);const first=h.lineDefense.routeId,point={...h.destination};g.time=100;lineDefenseThink(g,h);assert.equal(h.lineDefense.routeId,first);h.x=point.x;h.z=point.z;lineDefenseThink(g,h);g.time+=9;lineDefenseThink(g,h);assert.notEqual(h.lineDefense.routeId,first);assert.equal(h.lineDefense.targetId,null);assert.equal(h.lineDefense.threats,0);
});

test('shops, channeling, death and other modes preserve busy orders and spells without cancellation',()=>{
 for(const state of [{shopInteraction:'fountain'},{pendingShop:'equipment'},{pendingPurchase:{npc:'smith'}},{channel:'blizzard'},{stun:2},{alive:false}]){const {g,h,lane}=setup();invader(g,lane);Object.assign(h,state);h.order='hold';h.target=700;h.destination={x:123,z:456};assert.equal(lineDefenseThink(g,h),false);assert.equal(h.order,'hold');assert.equal(h.target,700);assert.deepEqual(h.destination,{x:123,z:456});for(const [key,value]of Object.entries(state))assert.deepEqual(h[key],value);}
 const {g,h}=setup();g.options.mode='tower';assert.equal(lineDefenseThink(g,h),false);assert.equal(h.lineDefense.reason,'inactive');
});
