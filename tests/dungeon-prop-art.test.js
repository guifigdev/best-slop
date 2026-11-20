import test from 'node:test';
import assert from 'node:assert/strict';
import {dungeonRockParts,dungeonPropParts,dungeonWallParts} from '../src/dungeon-prop-art.js';
import {battlefieldObstacleVisible,createBattlefield} from '../src/battlefield.js';
import {generateDungeonFloor} from '../shared/dungeon.js';
import * as T from 'three';

test('dungeon collision volumes never cover the dedicated world sculptures or masonry',()=>{
 const map=generateDungeonFloor(71,1),scene=new T.Scene(),world=createBattlefield(scene);
 assert.ok(map.obstacles.length>0);
 for(const obstacle of map.obstacles)assert.equal(battlefieldObstacleVisible(obstacle),false,obstacle.id);
 world.update({obstacles:[...map.obstacles,{type:'dungeon-object',dungeonObject:1,x:0,z:0,w:2,d:2,h:2}]});
 assert.equal(scene.children[1].children.length,0,'the generic obstacle layer contains no dungeon proxy meshes');
 assert.equal(battlefieldObstacleVisible({type:'icewall'}),true,'player-created ice walls retain their ordinary renderer');
});
test('rocks have an irregular terraced silhouette, while urns, barrels and furniture have separate sculptures',()=>{
 const rocks=['a','b','c'].map(id=>dungeonRockParts({id,w:3.8,d:3.1,h:3.7}));
 for(const parts of rocks){assert.ok(parts.length>60);assert.ok(new Set(parts.map(p=>p[4])).size>8);assert.ok(parts.every(p=>p.every(Number.isFinite)));assert.ok(parts.every(p=>Math.abs(p[0])+p[3]/2<1.92&&Math.abs(p[2])+p[5]/2<1.57));}
 assert.notDeepEqual(rocks[0],rocks[1]);
 const shapes=['urn','barrel','crate','supplies','shelf','bedroll','pillar','crystal'].map(type=>dungeonPropParts(type));
 assert.ok(shapes.every(parts=>parts.length>=10&&parts.every(p=>p.every(Number.isFinite))));
 assert.equal(new Set(shapes.map(parts=>JSON.stringify(parts))).size,shapes.length);
 assert.ok(dungeonWallParts().length>30);
});
