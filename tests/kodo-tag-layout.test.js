import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {kodoBuildCheck} from '../shared/kodo-tag.js';
import {KODO_TAG_MAP as MAP,KODO_TAG_MINES as MINES,KODO_TAG_FOREST as FOREST,KODO_TAG_BUILDINGS as B,KODO_TAG_UNITS as U,KODO_TAG_RULES as R} from '../shared/kodo-tag-catalog.js';
import {castlePassable,castleRouteAvailable,moveCastleUnit} from '../shared/castle-navigation.js';

function setup(){const g=new Game(17,{mode:'kodotag'});g.addPlayer('p','runner');g.addPlayer('q','runner');g.initKodoTag();g.kodoTag.released=true;g.kodoTag.escalationIndex=R.escalation.length;const p=g.player('p');p.gold=p.lumber=10000;return{g,p};}
function advance(g,seconds){for(let t=0;t<seconds;t+=.1)g.tick(Math.min(.1,seconds-t));}
const ctx=()=>({map:MAP,obstacles:[...MAP.obstacles,...MINES,...FOREST],buildings:[],units:[],elapsed:0,navigationRevision:1});

test('map expands threefold in each direction while actor speeds, footprints and the rescue center stay fixed',()=>{
 assert.equal(MAP.width,156);assert.equal(MAP.depth,156);assert.equal(MAP.width/(MAP.nativeExtent.maxX-MAP.nativeExtent.minX),3);assert.equal(MAP.depth/(MAP.nativeExtent.maxZ-MAP.nativeExtent.minZ),3);assert.deepEqual(MAP.jail,{x:0,z:1.75,r:1.5});assert.deepEqual(MAP.spawn,{x:0,z:-5.5});
 assert.equal(U.uC13.speed,300/128);assert.equal(U.uC13.size,.72);assert.equal(B.hC08.w,2);assert.equal(B.hC18.w,2.5);assert.equal(B.hC07.w,1);assert.equal(MAP.buildingPockets.length,8);assert.ok(MINES.length>=28&&FOREST.length>=60);
 for(const pocket of MAP.buildingPockets){assert.ok(pocket.w>=16&&pocket.d>=16);assert.equal(castlePassable(ctx(),pocket,.943),true);}
});

test('quarter-cell placement fits mixed real footprints edge to edge and still rejects actual overlap',()=>{
 const{g,p}=setup();g.kodoTag.obstacles=[];g.kodoTag.mines=[];g.kodoTag.trees=[];g.kodoTag.navigationRevision++;Object.assign(p,{x:6,z:8});
 assert.ok(g.command(p.owner,{type:'ktBuild',building:'hC08',x:10,z:8}));const first=g.kodoTag.buildings[0];
 const check=kodoBuildCheck(g,p,'hC18',{x:12.25,z:8});assert.equal(check.allowed,true);assert.equal(check.point.x,12.25);assert.equal(first.x+first.w/2,check.point.x-B.hC18.w/2);
 assert.ok(g.command(p.owner,{type:'ktBuild',building:'hC18',x:12.25,z:8}));assert.equal(kodoBuildCheck(g,p,'hC07',{x:14,z:8}).allowed,true);assert.equal(kodoBuildCheck(g,p,'hC07',{x:13.75,z:8}).allowed,false);
 assert.equal(kodoBuildCheck(g,p,'hC08',{x:10,z:10}).allowed,true);assert.equal(kodoBuildCheck(g,p,'hC08',{x:10,z:9.75}).allowed,false);
});

test('a structure placed over its Runner still pushes the body outside the real footprint',()=>{
 const{g,p}=setup(),pocket=MAP.buildingPockets[0];Object.assign(p,{x:pocket.x,z:pocket.z});assert.ok(g.command(p.owner,{type:'ktBuild',building:'hC08',x:p.x,z:p.z}),g.commandFailureReason);const b=g.kodoTag.buildings[0];assert.ok(Math.abs(p.x-b.x)>=b.w/2+p.collisionRadius-1e-5||Math.abs(p.z-b.z)>=b.d/2+p.collisionRadius-1e-5);assert.ok(g.command(p.owner,{type:'ktMove',x:b.x+4,z:b.z}));advance(g,5);assert.ok(Math.hypot(p.x-b.x-4,p.z-b.z)<.3);
});

test('all building pockets stay reachable by a full-sized Kodo and return to the central rescue area',()=>{
 const context=ctx();for(const pocket of MAP.buildingPockets){const u={id:1,x:MAP.jail.x,z:MAP.jail.z,speed:U.oC06.speed,collisionRadius:.943};assert.ok(castleRouteAvailable(context,u,pocket,u.collisionRadius),pocket.id+' has an open entrance');
  for(let i=0;i<650&&Math.hypot(u.x-pocket.x,u.z-pocket.z)>.2;i++){context.elapsed+=.1;moveCastleUnit(context,u,pocket,.1);assert.equal(castlePassable(context,u,u.collisionRadius),true);}
  assert.ok(Math.hypot(u.x-pocket.x,u.z-pocket.z)<.2,pocket.id+' is reachable through actual movement');assert.ok(castleRouteAvailable(context,u,MAP.jail,u.collisionRadius));
 }
});

test('spread mines retain reachable gathering positions and a distant player move crosses the larger map',()=>{
 const context=ctx(),from=MAP.spawn;for(const mine of MINES){let access=false;for(let i=0;i<16;i++){const a=i/16*Math.PI*2,p={x:mine.x+Math.sin(a)*1.5,z:mine.z+Math.cos(a)*1.5};if(castlePassable(context,p,.2)&&castleRouteAvailable(context,from,p,.2)){access=true;break;}}assert.equal(access,true,mine.id+' has an accessible resource face');}
 const{g,p}=setup(),goal=MAP.buildingPockets.at(-1);assert.ok(g.command(p.owner,{type:'ktMove',x:goal.x,z:goal.z}));advance(g,70);assert.ok(Math.hypot(p.x-goal.x,p.z-goal.z)<.3);
});

test('nearby natural resources complete real collection and delivery cycles; forest trunks block placement',()=>{
 const{g,p}=setup(),mine=g.kodoTag.mines.find(m=>m.id.startsWith('kt-inner')&&m.x===12&&m.z===-10);assert.ok(mine);Object.assign(p,{x:mine.x-5,z:mine.z});assert.ok(g.command(p.owner,{type:'ktBuild',building:'hC08',x:mine.x-3,z:mine.z}));advance(g,4);const before=p.gold;assert.ok(g.command(p.owner,{type:'ktGather',mineId:mine.id}));advance(g,15);assert.ok(p.gold>before);assert.ok(mine.remaining<12500);
 const tree=g.kodoTag.trees[0];assert.equal(kodoBuildCheck(g,p,'hC07',tree).allowed,false);const pocket=MAP.buildingPockets.find(v=>Math.hypot(v.x-tree.x,v.z-tree.z)<16);assert.ok(pocket);const free=[{x:tree.x,z:tree.z+Math.sign(tree.z-pocket.z)*4},{x:tree.x-5,z:tree.z},{x:tree.x+5,z:tree.z}].find(point=>kodoBuildCheck(g,p,'hC08',point).allowed);assert.ok(free);Object.assign(p,{x:free.x-2,z:free.z});assert.ok(g.command(p.owner,{type:'ktBuild',building:'hC08',...free}),g.commandFailureReason);advance(g,5);const wood=p.lumber;assert.ok(g.command(p.owner,{type:'ktGather',treeId:tree.id}));advance(g,18);assert.ok(p.lumber>wood);assert.ok(tree.remaining<200);
});
