import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_MAP_PALETTE,convertMapPixels,normalizeVoxelMap,mapTileAt,mapObstacles,validateMapPath} from '../shared/voxel-map.js';
import {defaultLineWarsMap,historicalLineWarsMap} from '../shared/maps/line-wars-map.js';
import {limitPoint} from '../shared/field.js';
import {unitBlocked} from '../shared/unit-collision.js';
import {blocked} from '../shared/field.js';
import {Game} from '../shared/simulation.js';
import {LINE_UNIT_ORDER} from '../shared/line-units.js';
import {SHOPS} from '../shared/shops.js';
import {merchantPosition} from '../shared/instances.js';

const pixels=(width,height,fill)=>({width,height,data:Uint8ClampedArray.from(Array.from({length:width*height},(_,i)=>fill(i)).flat())});
const rgba=hex=>[...hex.slice(1).match(/../g).map(value=>parseInt(value,16)),255];
const tiny=(extra={})=>normalizeVoxelMap({version:1,width:4,height:4,tileSize:1,biomes:new Array(16).fill(1),...extra});

test('voxel map JSON round trips and normalized matrices do not share mutable data',()=>{
 const original=defaultLineWarsMap(),copy=normalizeVoxelMap(JSON.parse(JSON.stringify(original)));assert.deepEqual(copy,original);copy.biomes[0]=1;copy.heights[0]=42;copy.palette[0].color='#ffffff';copy.markers.shops[0].x=1;assert.notEqual(copy.biomes[0],original.biomes[0]);assert.notEqual(copy.heights[0],original.heights[0]);assert.notEqual(copy.palette[0].color,original.palette[0].color);assert.notEqual(copy.markers.shops[0].x,original.markers.shops[0].x);
});

test('map dimensions, schema, arrays, heights and walk masks reject invalid or oversized input',()=>{
 const base=tiny();for(const patch of [{version:2},{width:65},{height:65},{width:1.5},{tileSize:0},{biomes:[1]},{biomes:new Array(16).fill(99)},{heights:new Array(16).fill(NaN)},{walkable:new Array(16).fill(2)}])assert.throws(()=>normalizeVoxelMap({...base,...patch}));
 const typed=normalizeVoxelMap({...base,biomes:new Uint8Array(base.biomes),heights:new Float32Array(base.heights),walkable:new Uint8Array(base.walkable)});assert.ok(Array.isArray(typed.biomes)&&Array.isArray(typed.heights)&&Array.isArray(typed.walkable));
});

test('every exact palette colour classifies into its own biome through HSV distance',()=>{
 const map=convertMapPixels(pixels(8,1,i=>rgba(DEFAULT_MAP_PALETTE[i].color)));assert.deepEqual(map.biomes,[0,1,2,3,4,5,6,7]);assert.deepEqual(map.walkable,DEFAULT_MAP_PALETTE.map(p=>p.walkable));assert.deepEqual(map.heights,DEFAULT_MAP_PALETTE.map(p=>p.height));assert.equal(map.heightSource,'biome-estimate');assert.equal(map.source.exactHeights,false);
});

test('classification honours a custom palette for a non-green minimap',()=>{
 const palette=[{id:'stone',name:'Laje',color:'#8b7a9a',height:0,walkable:1},{id:'cliff',name:'Muralha',color:'#44374e',height:2,walkable:0}];
 const map=convertMapPixels(pixels(2,1,i=>rgba(palette[i].color)),{palette});assert.deepEqual(map.biomes,[0,1]);assert.deepEqual(map.walkable,[1,0]);assert.deepEqual(map.heights,[0,2]);
});

test('large source images downsample to at most 64 square preserving aspect ratio',()=>{
 const map=convertMapPixels(pixels(128,64,()=>[148,172,114,255]));assert.equal(map.width,64);assert.equal(map.height,32);assert.equal(map.biomes.length,2048);assert.throws(()=>convertMapPixels(pixels(1,1,()=>[0,0,0,255]),{width:65,height:1}));
});

test('block sampling averages source pixels and ignores transparent colour contamination',()=>{
 const palette=[{id:'red',color:'#ff0000',height:0,walkable:1},{id:'blue',color:'#0000ff',height:1,walkable:1}];
 const map=convertMapPixels(pixels(2,1,i=>i?[0,0,255,0]:[255,0,0,255]),{width:1,height:1,palette});assert.equal(map.biomes[0],0);
 const transparent=convertMapPixels(pixels(1,1,()=>[255,0,0,0]),{palette,transparentBiome:1});assert.equal(transparent.biomes[0],1);
});

test('grayscale height maps preserve exact relative values rather than guessing luminance from the minimap',()=>{
 const gray=[0,64,128,255],heightMap=pixels(4,1,i=>[gray[i],gray[i],gray[i],255]);
 const map=convertMapPixels(pixels(4,1,()=>[148,172,114,255]),{heightMap,heightMin:-2,heightMax:4});
 for(let i=0;i<4;i++)assert.ok(Math.abs(map.heights[i]-(-2+gray[i]/255*6))<1e-6);assert.equal(map.heightSource,'grayscale-heightmap');assert.equal(map.source.exactHeights,true);
 assert.throws(()=>convertMapPixels(pixels(1,1,()=>[0,0,0,255]),{heightMap:pixels(1,1,()=>[255,0,0,255])}),/cinza/);
});

test('invalid image channels, data lengths, palette ids and height ranges are rejected',()=>{
 assert.throws(()=>convertMapPixels({width:2,height:2,data:[0,0,0,255]}));assert.throws(()=>convertMapPixels({width:1,height:1,data:[NaN,0,0,255]}));assert.throws(()=>convertMapPixels(pixels(1,1,()=>[0,0,0,255]),{heightMin:5,heightMax:1}));
 assert.throws(()=>tiny({palette:[{id:'x',color:'#fff'},{id:'x',color:'#000'}]}));assert.throws(()=>tiny({palette:[{id:'x',color:'red'}]}));
});

test('world coordinates map consistently to row-major cells with a centred origin',()=>{
 const map=tiny();assert.deepEqual(map.origin,{x:-2,z:-2});assert.equal(mapTileAt(map,-2,-2).index,0);assert.equal(mapTileAt(map,0,0).index,10);assert.equal(mapTileAt(map,1.99,1.99).index,15);assert.equal(mapTileAt(map,2,0),null);assert.equal(mapTileAt(map,NaN,0),null);assert.equal(mapTileAt(map,0,-2.1),null);
});

test('obstacle merging preserves exactly the non-walkable footprint and supports world offsets',()=>{
 const walkable=[0,0,1,0,0,0,1,0,1,1,1,0],map=normalizeVoxelMap({version:1,width:4,height:3,tileSize:1,biomes:walkable.map(v=>v?1:5),heights:new Array(12).fill(1),walkable}),obstacles=mapObstacles(map,{x:100,z:20});assert.equal(obstacles.length,2);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){const point={x:100+map.origin.x+col+.5,z:20+map.origin.z+row+.5};assert.equal(blocked(point,obstacles,0),!walkable[row*4+col]);}
 assert.ok(obstacles.every(o=>o.w>0&&o.d>0&&o.h>0));assert.throws(()=>mapObstacles(map,{x:Infinity}));
});

test('markers outside the matrix and invalid marker lists cannot be imported',()=>{
 assert.throws(()=>tiny({markers:{spawn:{x:9,z:0}}}));assert.throws(()=>tiny({markers:{shops:new Array(65).fill({x:0,z:0})}}));assert.throws(()=>tiny({markers:{path:[null]}}));
});

test('route validation detects disconnected portals and unreachable shop markers without repairing the map',()=>{
 const walkable=new Array(16).fill(1);for(let i=4;i<8;i++)walkable[i]=0;const map=tiny({walkable,markers:{spawn:{x:-1.5,z:-1.5},portal:{x:1.5,z:1.5},shops:[{id:'smith',x:1,z:1}]}}),before=JSON.stringify(map);const result=validateMapPath(map);assert.equal(result.valid,false);assert.ok(result.errors.length);assert.deepEqual(result.path,[]);assert.equal(JSON.stringify(map),before);assert.equal(validateMapPath(tiny()).valid,false);
});

test('the original-derived preset has a real connected route, reachable services and reproducible independent copies',()=>{
 const a=historicalLineWarsMap(),b=historicalLineWarsMap(),result=validateMapPath(a);assert.deepEqual(a,b);assert.equal(a.width,64);assert.equal(a.height,64);assert.equal(a.tileSize,.5);assert.equal(result.valid,true,result.errors.join('; '));assert.ok(result.path.length>30);assert.equal(a.markers.shops.length,6);assert.equal(a.markers.fountain.z,13.8);assert.ok(a.markers.spawn.x<a.markers.portal.x);assert.equal(a.source.entryRegion,'OI');assert.equal(a.source.portalRegion,'BI');assert.equal(a.heightSource,'warcraft-w3e-derived');for(const hash of Object.values(a.source.hashes))assert.match(hash,/^[a-f0-9]{64}$/);a.markers.path[0].x=99;assert.notEqual(historicalLineWarsMap().markers.path[0].x,99);
});

test('the selected source route and required markers clear a ground collision radius of 0.8',()=>{
 const map=defaultLineWarsMap(),obstacles=mapObstacles(map),points=map.markers.path;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)*8));for(let s=0;s<=steps;s++){const p={x:a.x+(b.x-a.x)*s/steps,z:a.z+(b.z-a.z)*s/steps};assert.equal(blocked(p,obstacles,.8),false,JSON.stringify(p));}}
 for(const p of [map.markers.spawn,map.markers.portal,map.markers.heroSpawn,map.markers.fountain,...map.markers.shops])assert.equal(blocked(p,obstacles,.8),false,JSON.stringify(p));
});

function runtimeGame(start=true){const game=new Game(160,{mode:'linewars'});assert.equal(game.addPlayer('a'),true);assert.equal(game.addPlayer('b','mage'),true);if(start)assert.equal(game.initLineWars(),true);return game;}
test('a hero walks from the imported hero spawn to every merchant before and during battle with radius 0.8',()=>{
 for(const start of [false,true])for(const id of Object.keys(SHOPS)){const game=runtimeGame(start),hero=game.player('a');hero.collisionRadius=.8;assert.equal(hero.x-hero.cell.x,game.voxelMap.markers.heroSpawn.x);assert.equal(hero.z-hero.cell.z,game.voxelMap.markers.heroSpawn.z);assert.equal(game.unitTerrainBlocked(hero,hero,.8),false);assert.equal(game.command('a',{type:'interact',npc:id}),true);for(let i=0;i<1800&&!game.atShop(hero,id);i++)game.tick(1/30);const npc=merchantPosition(hero,SHOPS[id]);assert.equal(game.atShop(hero,id),true,`${game.phase}/${id}: hero (${hero.x},${hero.z}), NPC (${npc.x},${npc.z}), path ${JSON.stringify(hero.path)}`);assert.ok(Math.hypot(hero.x-npc.x,hero.z-npc.z)<=npc.range+.001);}
});
test('all sixteen purchased recipes traverse the imported route and breach its real portal',()=>{
 for(const routeId of ['west','east'])for(const key of LINE_UNIT_ORDER){const game=runtimeGame(),attacker=game.player('a'),lane=game.lineWars.lanes[1];for(const h of game.heroes()){h.x=h.cell.x;h.z=46;h.order='stop';}attacker.gold=100000;const building=game.lineWars.buildings.find(b=>b.owner==='a'&&b.unitKey===key);building.routeId=routeId;assert.equal(game.sendLineUnit(attacker,{building:building.id}),true);const unit=game.units.at(-1);unit.collisionRadius=.8;assert.equal(unit.lineRoute,routeId);const lives=lane.lives;for(let i=0;i<3000&&!unit.lineResolved;i++)game.tick(1/30);assert.equal(unit.escaped,true,`${routeId}/${key}: (${unit.x},${unit.z}), waypoint ${unit.lineWaypoint}, path ${JSON.stringify(unit.path)}`);assert.equal(lane.lives,lives-unit.linePortalDamage);assert.equal(lane.leaks,1);assert.equal(game.phase,'wave');}
});


test('the enlarged fjord battlefield has exactly two long routes and compact recruitment terraces behind each entrance',()=>{
 const map=defaultLineWarsMap();assert.equal(map.name,'Portais dos Fiordes');assert.equal(map.width*map.tileSize,63);assert.equal(map.height*map.tileSize,112);assert.equal(validateMapPath(map).valid,true);assert.equal(map.markers.routes.length,2);assert.equal(map.markers.buildings.length,16);
 for(const route of map.markers.routes){const length=route.path.reduce((sum,p,i)=>sum+(i?Math.hypot(p.x-route.path[i-1].x,p.z-route.path[i-1].z):0),0),houses=map.markers.buildings.filter(b=>b.routeId===route.id);assert.ok(length>=70);assert.equal(houses.length,8);for(const b of houses){assert.ok(b.z<route.spawn.z);assert.ok(route.spawn.z-b.z<10);assert.ok(Math.abs(b.x-route.spawn.x)<6);assert.equal(mapTileAt(map,b.x,b.z).walkable,1);}assert.ok(Math.max(...houses.map(b=>b.x))-Math.min(...houses.map(b=>b.x))<11);assert.ok(Math.max(...houses.map(b=>b.z))-Math.min(...houses.map(b=>b.z))<5);}
 for(const z of [-35,-15,0,15]){const bands=[];let previous=false;for(let x=-30;x<31;x+=.25){const open=!!mapTileAt(map,x,z)?.walkable;if(open&&!previous)bands.push(x);previous=open;}assert.equal(bands.length,2,`exactly two walkable bands at z=${z}`);for(const x of [20,24,28])assert.equal(mapTileAt(map,x,z).walkable,0);}
 const copy=normalizeVoxelMap(JSON.parse(JSON.stringify(map)));assert.deepEqual(copy.markers.routes,map.markers.routes);copy.markers.routes[0].path[0].x=99;assert.notEqual(map.markers.routes[0].path[0].x,99);
 assert.throws(()=>normalizeVoxelMap({...map,markers:{...map.markers,routes:[map.markers.routes[0],map.markers.routes[0]]}}));
});

test('four rectangular home cells and active lanes cannot overlap and enforce their actual edges',()=>{
 const game=new Game(160,{mode:'linewars'});for(let i=0;i<4;i++)assert.equal(game.addPlayer(`p${i}`),true);
 function inspect(){const heroes=game.heroes().sort((a,b)=>a.cell.x-b.cell.x);assert.equal(heroes.length,4);for(let i=0;i<heroes.length;i++){const u=heroes[i],c=u.cell;assert.equal(c.maxX-c.minX,63);assert.equal(c.maxZ-c.minZ,112);assert.ok(game.bounds>=Math.abs(c.x+c.maxX));if(i)assert.ok(heroes[i-1].cell.x+heroes[i-1].cell.maxX<c.x+c.minX);const capped=limitPoint(game,u,{x:c.x+1000,z:1000});assert.equal(capped.x,c.x+c.maxX);assert.equal(capped.z,c.z+c.maxZ);assert.equal(unitBlocked(game,u,{x:c.x+c.maxX+.1,z:0}),true);}}
 inspect();assert.equal(game.initLineWars(),true);inspect();
});

test('newbie bots visibly use both invasion entrances within the opening twenty seconds',()=>{
 for(const seed of [160,7381,71]){const game=new Game(seed,{mode:'linewars'});game.addBots(2);assert.equal(game.initLineWars(),true);for(let i=0;i<600;i++)game.tick(1/30);for(const lane of game.lineWars.lanes){const routes=new Set(game.units.filter(u=>u.lineCreep&&u.lineAttacker===lane.owner).map(u=>u.lineRoute));assert.deepEqual([...routes].sort(),['east','west'],`seed ${seed}/${lane.owner}`);}}
});

test('historical 32-unit imports retain a single working route and their original rectangular extent',()=>{
 const game=new Game(160,{mode:'linewars',voxelMap:historicalLineWarsMap()});game.addPlayer('a');game.addPlayer('b','mage');assert.equal(game.initLineWars(),true);const lane=game.lineWars.lanes[1];assert.equal(lane.cell.maxX-lane.cell.minX,32);assert.equal(lane.routes.length,1);assert.equal(lane.routes[0].id,'main');const hero=game.player('a');hero.gold=10000;for(const h of game.heroes()){h.x=h.cell.x;h.z=13.8;h.order='stop';}assert.equal(game.sendLineUnit(hero,{building:game.lineWars.buildings.find(b=>b.owner==='a').id}),true);const creep=game.units.at(-1);for(let i=0;i<1800&&!creep.lineResolved;i++)game.tick(1/30);assert.equal(creep.escaped,true);
});
