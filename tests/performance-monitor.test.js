import test from 'node:test';
import assert from 'node:assert/strict';
import {createGPUFrameTimer} from '../src/gpu-frame-timer.js';
import {createPerformanceSamples} from '../src/performance-samples.js';
import {performancePreference,performanceSettingsMarkup} from '../src/performance-hud.js';

function gpu(){const queries=[],deleted=[],ext={TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2};let disjoint=false,current=null,reads=0;const gl={QUERY_RESULT_AVAILABLE:3,QUERY_RESULT:4,CURRENT_QUERY:5,getExtension:()=>ext,isContextLost:()=>false,getParameter:()=>disjoint,getQuery:()=>current,createQuery(){const q={ready:false,ns:4000000};queries.push(q);return q;},beginQuery(t,q){current=q;},endQuery(){current=null;},getQueryParameter(q,p){if(p===3)return q.ready;reads++;return q.ns;},deleteQuery:q=>deleted.push(q)};return{gl,queries,deleted,setDisjoint:v=>disjoint=v,setCurrent:v=>current=v,get reads(){return reads;}};}
test('GPU timing is opt-in, asynchronous, bounded and discards disjoint or stale samples',()=>{
 const f=gpu(),timer=createGPUFrameTimer(f.gl,{stride:1,maxPending:2});assert.equal(timer.begin(),false);assert.equal(f.queries.length,0);timer.setEnabled(true);assert.equal(timer.begin(),true);timer.end();timer.poll(10);assert.equal(f.reads,0);assert.equal(timer.snapshot(10).ms,null);
 f.queries[0].ready=true;timer.poll(20);assert.equal(timer.snapshot(20).ms,4);assert.equal(timer.snapshot(3000).ms,null);assert.equal(f.deleted.length,1);
 timer.begin();timer.end();timer.begin();timer.end();assert.equal(timer.begin(),false);f.setDisjoint(true);timer.poll(30);assert.equal(timer.snapshot(30).ms,null);assert.equal(timer.snapshot(30).pending,0);assert.equal(f.reads,1);timer.setEnabled(false);assert.equal(timer.snapshot(30).status,'disabled');
});
test('unavailable GPU support and another profiler never produce invented GPU values or close another query',()=>{
 const unsupported=createGPUFrameTimer({getExtension:()=>null});unsupported.setEnabled(true);assert.equal(unsupported.snapshot(0).status,'unsupported');assert.equal(unsupported.begin(),false);
 const f=gpu(),timer=createGPUFrameTimer(f.gl,{stride:1});timer.setEnabled(true);f.setCurrent({external:true});assert.equal(timer.begin(),false);timer.end();assert.equal(f.gl.getQuery().external,true);timer.dispose();assert.equal(f.deleted.length,0);
});
test('a GPU driver that never returns results times out honestly and can recover without unbounded queries',()=>{
 const f=gpu(),timer=createGPUFrameTimer(f.gl,{stride:1,maxPending:2});timer.setEnabled(true);timer.poll(0);timer.begin();timer.end();timer.begin();timer.end();timer.poll(6000);assert.equal(timer.snapshot(6000).status,'timeout');assert.equal(timer.snapshot(6000).ms,null);assert.equal(timer.begin(),false);assert.equal(f.reads,0);f.queries[0].ready=true;timer.poll(6010);assert.equal(timer.snapshot(6010).ms,4);assert.equal(timer.snapshot(6010).status,'available');timer.dispose();
});
test('CPU, FPS and phase averages use measured work and reset across hidden/background gaps',()=>{
 let clock=0,calls=0;const s=createPerformanceSamples({now:()=>{calls++;return clock;},capacity:2});s.begin(0);s.mark('simulation');s.end();assert.equal(calls,0);s.setEnabled(true);
 s.begin(0);clock=1;s.mark('simulation');clock=4;s.mark('view');clock=9;s.mark('ui');clock=10;s.end();assert.equal(s.snapshot().cpuMs,10);assert.equal(s.snapshot().phases.simulation,3);
 clock=20;s.begin(1000/60);clock=21;s.mark('simulation');clock=25;s.mark('view');clock=27;s.mark('ui');clock=30;s.end();assert.equal(s.snapshot().cpuMs,10);assert.ok(Math.abs(s.snapshot().fps-60)<1e-6);assert.equal(s.snapshot().phases.simulation,3.5);
 s.reset();assert.equal(s.snapshot().fps,null);clock=40;s.begin(5000);clock=41;s.end();assert.equal(s.snapshot().fps,null);s.setEnabled(false);const before=calls;s.begin(5016);s.end();assert.equal(calls,before);
});
test('performance options persist booleans, default to a hidden monitor, and explain hardware measurement limits',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};const p=performancePreference(storage);assert.deepEqual(p.value,{showHud:false,prewarm:true,distanceLod:true});p.set({showHud:true,prewarm:false,distanceLod:'false',injected:true});assert.deepEqual(performancePreference(storage).value,{showHud:true,prewarm:false,distanceLod:true});const html=performanceSettingsMarkup(p.value);assert.ok(html.includes('data-performance-setting="showHud" checked'));assert.ok(html.includes('porcentagem total'));assert.ok(html.includes('hitboxes'));
});
