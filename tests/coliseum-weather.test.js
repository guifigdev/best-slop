import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createColiseumWeather,COLISEUM_WEATHER} from '../src/coliseum-weather.js';

const allMatrices=mesh=>{const matrix=new T.Matrix4();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));const scale=new T.Vector3().setFromMatrixScale(matrix);assert.ok(scale.x>0&&scale.y>0&&scale.z>0);}};
const point=(mesh,index=0)=>{const matrix=new T.Matrix4();mesh.getMatrixAt(index,matrix);return new T.Vector3().setFromMatrixPosition(matrix);};

test('rain, storm, snow, embers and moon mist have distinct dense silhouettes in only two reusable batches',()=>{
 const art=createColiseumWeather(),names=new Set(),poses=new Set();for(const theme of Object.keys(COLISEUM_WEATHER)){art.update(theme,2,[{type:'lava',x:2,z:4,r:2}]);assert.equal(art.root.children.length,2);assert.equal(art.root.userData.theme,theme);names.add(art.root.userData.kind);const [main,accent]=art.root.children;assert.equal(main.count,COLISEUM_WEATHER[theme].count);assert.equal(accent.count,COLISEUM_WEATHER[theme].accents);assert.ok(main.count+accent.count>90);assert.ok(main.count+accent.count<500);assert.equal(main.castShadow,false);assert.equal(main.material.depthWrite,false);allMatrices(main);allMatrices(accent);poses.add(JSON.stringify(Array.from(main.instanceMatrix.array).slice(0,16)));}assert.equal(names.size,5);assert.equal(poses.size,5);art.dispose();
});
test('weather advances at eight-frame cadence and does not replace buffers or geometries between snapshots',()=>{
 const art=createColiseumWeather();assert.equal(art.update('glacier',0),true);const main=art.root.children[0],geometry=main.geometry,buffer=main.instanceMatrix.array,before=Array.from(buffer);assert.equal(art.update('glacier',.12),false);assert.deepEqual(Array.from(buffer),before);assert.equal(art.update('glacier',.125),true);assert.notDeepEqual(Array.from(buffer),before);assert.equal(main.instanceMatrix.array,buffer);assert.equal(main.geometry,geometry);art.update('forest',.125);assert.equal(art.root.children[0],main);assert.equal(art.root.userData.kind,'rain');art.dispose();
});
test('fire sparks rise from lava zones or the outer channel, while rain and snow fall and wind crosses the arena',()=>{
 const art=createColiseumWeather();art.update('volcano',0,[{type:'lava',x:2,z:4,r:2}]);const first=point(art.root.children[0]);assert.ok(Math.hypot(first.x-2,first.z-4)<1.7);art.update('volcano',.125,[{type:'lava',x:2,z:4,r:2}]);assert.ok(point(art.root.children[0]).y>first.y);for(const theme of ['forest','tempest','glacier']){art.update(theme,0);const before=point(art.root.children[0]);art.update(theme,.125);const after=point(art.root.children[0]);assert.ok(after.y<before.y);assert.notEqual(after.x,before.x);}art.dispose();
});
test('weather hides for expanded scenes and returns without disposing borrowed assets or leaking materials',()=>{
 const base=new T.BoxGeometry(),parent=new T.Group(),art=createColiseumWeather({base});parent.add(art.root);art.update('tempest',1);assert.equal(art.root.visible,true);art.setVisible(false);art.update('tempest',2);assert.equal(art.root.visible,false);art.setVisible(true);assert.equal(art.root.visible,true);let borrowed=0,materials=0;base.addEventListener('dispose',()=>borrowed++);for(const m of art.root.children)m.material.addEventListener('dispose',()=>materials++);art.dispose();art.dispose();assert.equal(borrowed,0);assert.equal(materials,2);assert.equal(parent.children.length,0);base.dispose();
});
