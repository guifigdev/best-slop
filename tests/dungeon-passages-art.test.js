import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeonFloor} from '../shared/dungeon.js';
import {dungeonFogGrid} from '../src/exploration-fog.js';
import {dungeonCorridorLanterns} from '../src/dungeon-world.js';
import {rockAssembly} from '../src/voxel-scenery-art.js';

test('passage lanterns illuminate real corridors while unseen rooms remain black',()=>{
 const map=generateDungeonFloor(44,1),lamps=dungeonCorridorLanterns(map);assert.ok(lamps.length>10);
 const p=lamps[Math.floor(lamps.length/2)],v={visibleRooms:[],discoveredRooms:[],sightOrigins:[{...p,radius:18}]},grid=dungeonFogGrid(map,v),index=q=>Math.round(q.z/map.tileSize+(map.height-1)/2)*map.width+Math.round(q.x/map.tileSize+(map.width-1)/2);
 assert.equal(map.tiles[index(p)],2);assert.equal(grid.cells[index(p)],255);
 const far=map.rooms.find(r=>Math.hypot(r.x-p.x,r.z-p.z)>30);assert.equal(grid.cells[index(far)],0);
});
test('stacked stone silhouettes vary deterministically and fit their collision footprint',()=>{
 const args={x:5,z:8,y:2,w:3,d:2,h:5,biome:'cavern'},a=rockAssembly({...args,id:'a'}),b=rockAssembly({...args,id:'b'});assert.deepEqual(a,rockAssembly({...args,id:'a'}));assert.notDeepEqual(a,b);assert.ok(a.length>=12);
 for(const [x,y,z,w,h,d]of a){assert.ok(Math.abs(x-5)+w/2<=1.55);assert.ok(Math.abs(z-8)+d/2<=1.05);assert.ok(y-h/2>=1.9);assert.ok(y+h/2<=7.15);}
});
