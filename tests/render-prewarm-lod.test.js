import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderPrewarm,resolvePrewarmWorkerURL,RENDER_PREWARM_BUDGET} from '../src/render-prewarm.js';
import {actorPoseLod} from '../src/actor-lod.js';
import {bakePrewarmGeometry} from '../src/ro-model-prewarm-worker.js';
import {voxelShellGeometry} from '../src/voxel-shell.js';

test('worker URLs retain dev transforms and use the same-origin hashed mirror for CDN builds',()=>{
 assert.equal(resolvePrewarmWorkerURL('/src/ro-model-prewarm-worker.js?worker_file&type=module','http://localhost:5174/'), 'http://localhost:5174/src/ro-model-prewarm-worker.js?worker_file&type=module');
 assert.equal(resolvePrewarmWorkerURL('https://cdn.example/games/assets/ro-model-prewarm-worker-abc.js','https://play.gfig.space/?debug=true'),'https://play.gfig.space/assets/ro-model-prewarm-worker-abc.js');
 assert.throws(()=>resolvePrewarmWorkerURL('https://cdn.example/not-a-worker','https://play.gfig.space/'));
});

test('prewarming has one worker job in flight, bounded scope, reuses completed geometry and can be disabled',async()=>{
 const cache=new Map(),sent=[];let terminated=0,compiles=0;const worker={postMessage:job=>sent.push(job),terminate:()=>terminated++},warm=createRenderPrewarm({cache,createWorker:()=>worker,accept:(k,v)=>cache.set(k,v),compile:()=>{compiles++;}}),models=Array.from({length:30},(_,i)=>({key:'body-'+i,parts:[[0,0,0,1,1,1,0xffffff]]}));warm.prepare('world-a',models);assert.equal(sent.length,1);assert.equal(warm.stats().total,RENDER_PREWARM_BUDGET.modelsPerWorld);worker.onmessage({data:{id:sent[0].id,attributes:{}}});assert.equal(sent.length,2);assert.equal(cache.size,1);warm.tick({safe:false});await Promise.resolve();assert.equal(compiles,0);warm.tick();await Promise.resolve();assert.equal(compiles,1);warm.configure(false);assert.equal(terminated,1);assert.equal(warm.stats().pending,0);warm.configure(true);warm.prepare('world-a',[models[0]]);assert.equal(warm.stats().completed,1);assert.equal(sent.length,2);warm.dispose();
});
test('stale world completions do not inflate progress and missing workers keep normal rendering available',()=>{
 const cache=new Map(),sent=[],worker={postMessage:job=>sent.push(job),terminate(){}},warm=createRenderPrewarm({cache,createWorker:()=>worker,accept:(k,v)=>cache.set(k,v),compile:()=>{}});warm.prepare('a',[{key:'old',parts:[]}]);warm.prepare('b',[{key:'new',parts:[]}]);worker.onmessage({data:{id:sent[0].id,attributes:{}}});assert.equal(warm.stats().completed,0);assert.equal(sent[1].key,'new');worker.onmessage({data:{id:sent[1].id,attributes:{}}});assert.equal(warm.stats().completed,1);warm.dispose();const missing=createRenderPrewarm({cache:new Map(),createWorker:()=>null});missing.prepare('a',[{key:'test',parts:[]}]);assert.equal(missing.stats().status,'unavailable');missing.dispose();
});
test('worker shell attributes and bounds exactly match the current sculpture builder',()=>{
 const parts=[[0,.5,0,1,1,1,0x98734a],[0,1.25,0,.6,.5,.6,0xf0c597]],expected=voxelShellGeometry(parts),result=bakePrewarmGeometry(parts);try{for(const key of ['position','normal','color'])assert.deepEqual(result.attributes[key].array,expected.getAttribute(key).array);assert.deepEqual(result.bounds.center,expected.boundingSphere.center.toArray());assert.equal(result.bounds.radius,expected.boundingSphere.radius);assert.deepEqual(result.userData.roVoxelParts,parts);}finally{expected.dispose();}
});
test('LOD only lowers distant idle pose frequency; nearby actors, MVPs, selection, hits and attacks remain full detail',()=>{
 const focus={x:0,z:0},u={id:3,alive:true,bonkEnemy:true,x:40,z:0};assert.equal(actorPoseLod(u,focus,10).level,1);assert.equal(actorPoseLod({...u,x:70},focus,10).level,2);assert.equal(actorPoseLod({...u,x:10},focus,10).level,0);assert.equal(actorPoseLod(u,focus,10,{enabled:false}).level,0);assert.equal(actorPoseLod(u,focus,10,{selected:true}).level,0);for(const fields of [{bonkBoss:true},{attackAt:9.7},{hitAt:9.9},{alive:false},{bonkHero:true}])assert.equal(actorPoseLod({...u,...fields},focus,10).level,0);const before=structuredClone(u);actorPoseLod(u,focus,10);assert.deepEqual(u,before);
});
