import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCustomHeroSkillArt} from '../src/customhero-skill-art.js';
import {CUSTOMHERO_SKILL_BUDGET as B,customHeroSkillVisual} from '../shared/customhero-skill-visuals.js';
const emptyPixels=async()=>({width:128,height:128,data:new Uint8ClampedArray(128*128*4).fill(255)});
const cast=(type,id=1,extra={})=>({id,type,x:0,z:0,time:1,source:'hero',...extra});
const state=(effects=[],extra={})=>({options:{mode:'campaign'},time:1,seed:1,units:[{id:'hero',x:0,z:0,alive:true,size:1}],effects,...extra});
function art(){return createCustomHeroSkillArt({scene:new T.Scene(),loadPixels:emptyPixels});}
function finiteGeometry(a){for(const mesh of a.root.children){const count=mesh.geometry.drawRange.count,values=mesh.geometry.attributes.position.array;assert.ok(Number.isFinite(count));for(let i=0;i<count*3;i++)assert.ok(Number.isFinite(values[i]),'finite vertex '+i);}}

test('presentation routing preserves basic attacks, approved techniques, warnings and other games',()=>{
 const s=state();for(const type of ['damage','miss','cast','slash','arrow','bossDanger','bossImpact','monsterWarning','monsterAttack','doubleattack','violentforce','hurricane','hurricanePulse','manabreak'])assert.equal(customHeroSkillVisual(cast(type),s),null,type);
 for(const mode of ['bonk','warlock','castlefight','kodotag','treetag','phasekiller','bloody'])assert.equal(customHeroSkillVisual(cast('frostnova'),state([],{options:{mode}})),null,mode);
 assert.equal(customHeroSkillVisual(cast('bolt',1,{basicAttack:true}),s),null);
 assert.equal(customHeroSkillVisual(cast('fireball',1,{enemy:true}),s),null);
 assert.equal(customHeroSkillVisual(cast('fireball',1,{bonk:true}),s),null);
 assert.equal(customHeroSkillVisual(cast('bolt',1,{skill:'bolt'}),s).family,'stormbolt');
 assert.equal(customHeroSkillVisual(cast('bolt',1,{skill:'chain'}),s).family,'chain');
});

test('signature skills have finite distinct choreography with at most two draw calls',async()=>{
 const a=art();await a.preload();const types=['bolt','stomp','heal','summon','blizzard','fireball','frostnova','shockwave','forcepush','drain','hook','blink','shield','avatar','cleave','thunder','gravity','flamebreath','venomcloud','dash'];
 for(const [i,type]of types.entries()){
  const e=cast(type,i,{tx:4,tz:3,radius:3,skill:type==='bolt'?'bolt':type,...(type==='blizzard'?{owner:'hero',pulses:5,duration:7}:{})}),s=state([e]);s.units[0].channel='blizzard';a.update(s,1.12,()=>.5);finiteGeometry(a);const stats=a.stats();assert.ok(stats.triangles>0,type+' geometric silhouette');assert.ok(stats.drawCalls<=B.drawCalls);assert.ok(stats.quads<=B.quads);assert.ok(stats.triangles<=B.triangles);a.reset();
 }
 a.dispose();
});

test('storm bolt is a travelling solid hammer and chain is already connected',async()=>{
 const a=art();await a.preload();let e=cast('bolt',1,{tx:8,tz:0,skill:'bolt'});a.update(state([e]),1.08);const hammer=a.stats();a.reset();e=cast('bolt',2,{tx:8,tz:0,skill:'chain'});a.update(state([e]),1.08);const chain=a.stats();assert.notEqual(hammer.triangles,chain.triangles);const mesh=a.root.children[0],x=mesh.geometry.attributes.position.array;assert.ok(Array.from(x.slice(0,mesh.geometry.drawRange.count*3)).some(v=>v>=7.9));a.dispose();
});

test('Blizzard stops on authoritative cancellation and never mutates pulses or channel',async()=>{
 const a=art();await a.preload();const e=cast('blizzard',1,{owner:'hero',pulses:6,duration:7}),s=state([e]);s.units[0].channel='blizzard';const before=structuredClone(s);a.update(s,1.3);assert.ok(a.stats().triangles>0);assert.deepEqual(s,before);
 s.units[0].channel=null;e.pulses=0;a.update(s,1.5);assert.equal(a.stats().triangles,0);assert.equal(a.stats().quads,0);a.dispose();
});

test('admission limits preserve cosmetic fallback and keep combat feedback in source state',()=>{
 const a=art(),events=Array.from({length:B.effects+5},(_,i)=>cast('frostnova',i));events.push(cast('damage',100,{amount:50}),cast('slash',101,{basicAttack:true}),cast('monsterWarning',102));const s=state(events);a.prepare(s,1.1);const filtered=a.legacyState(s);assert.equal(a.stats().effects,Math.floor(B.triangles/288));assert.equal(filtered.effects.filter(e=>e.type==='frostnova').length,events.length-3-a.stats().effects);assert.ok(filtered.effects.some(e=>e.type==='damage'));assert.ok(filtered.effects.some(e=>e.type==='slash'));assert.ok(filtered.effects.some(e=>e.type==='monsterWarning'));assert.equal(s.effects.length,B.effects+8);a.dispose();
});

test('late or failed texture loading retains geometric spell coverage; reset and disposal release batches',async()=>{
 const scene=new T.Scene(),a=createCustomHeroSkillArt({scene,loadPixels:async()=>{throw Error('offline');}});await a.preload();a.update(state([cast('frostnova')]),1.2);assert.ok(a.stats().triangles>0);assert.equal(a.stats().quads,0);assert.equal(Object.keys(a.stats().failures).length,8);a.reset();assert.equal(a.stats().effects,0);assert.equal(a.stats().drawCalls,0);a.dispose();a.dispose();assert.equal(scene.children.length,0);assert.equal(a.stats().disposed,true);
});

test('both VFX batches preserve destination alpha in RGBA HDR targets',()=>{
 const a=art();for(const mesh of a.root.children){const m=mesh.material;assert.equal(m.blending,T.CustomBlending);assert.equal(m.blendSrcAlpha,T.ZeroFactor);assert.equal(m.blendDstAlpha,T.OneFactor);assert.equal(m.depthWrite,false);}a.dispose();
});

test('large casts and near-maximum concurrent load remain inside fixed GPU budgets',async()=>{
 const a=art();await a.preload();const events=Array.from({length:200},(_,i)=>cast(i%2?'frostnova':'fireball',i,{x:i%4,z:Math.floor(i/4)%4,radius:9999}));a.update(state(events),1.25);assert.ok(a.stats().effects>15&&a.stats().effects<=B.effects);assert.ok(a.stats().triangles<=B.triangles);assert.ok(a.stats().quads<=B.quads);assert.ok(a.stats().drawCalls<=2);finiteGeometry(a);a.dispose();
});
