import test from 'node:test';
import assert from 'node:assert/strict';
import {createLegacyUI} from '../src/legacy-ui.js';
import {skillPreview,previewPolygon,consumeAimRotation,AIM_ROTATION_STEP} from '../src/skill-preview.js';
import {previewContainsPoint,rtsTargetFeedbackPolicy} from '../src/rts-target-feedback.js';
import {warlockWallContact} from '../shared/warlock-elements.js';

const keys=['W_FIRE_WALL','W_ICE_WALL','W_FROST_BOLT','S000'];
function setup(){
 const hero={id:1,owner:'p',alive:true,hp:100,x:0,z:0,facing:0,team:1,mana:100,skills:keys,skillLevels:Object.fromEntries(keys.map(k=>[k,1])),cooldowns:{},wlRangeMultiplier:1.6};
 const state={options:{mode:'warlock'},phase:'wave',players:{p:1},units:[hero],warlock:{phase:'battle',mapRadius:30}},sent=[],messages=[];
 const ui=createLegacyUI({getState:()=>state,getOwner:()=> 'p',send:c=>(sent.push(c),true),toast:m=>messages.push(m),view:{setLegacyBuild(){},setInteraction(){},mark(){}}});
 const preview=(point={x:2,z:4})=>skillPreview({...ui.skillPreview(),hero,state,point});
 return {ui,hero,state,sent,messages,preview};
}
const effect=p=>p.shapes.find(s=>s.role==='effect');

test('both wall spells rotate before sending a single cast with the actual tangent angle',()=>{
 for(const key of keys.slice(0,2)){
  const {ui,sent,messages,preview,hero,state}=setup(),before=JSON.stringify(state);
  assert.equal(ui.rotateAim(1),false);ui.shortcut('legacySkill',key);
  assert.equal(ui.hotkeys()[key==='W_FIRE_WALL'?'E':'T'],key);
  assert.match(messages.at(-1),/15°.*Clique.*Esc/);
  assert.equal(sent.length,0);assert.equal(ui.rotateAim(2),true);
  const shape=effect(preview());assert.equal(shape.width,.7);assert.equal(shape.depth,4.2);
  assert.ok(Math.abs(shape.angle-(Math.PI/2+2*AIM_ROTATION_STEP))<1e-10);
  assert.equal(preview().shapes.find(s=>s.role==='range').radius,14,'range mastery must not stretch wall placement');
  assert.equal(JSON.stringify(state),before,'preview and rotation must not mutate simulation');
  ui.point({button:0,point:{x:2,z:4}});assert.equal(sent.length,1);
  assert.equal(sent[0].type,'wlCast');assert.equal(sent[0].skill,key);assert.equal(sent[0].angle,shape.angle);
  assert.equal(sent[0].x,2);assert.equal(sent[0].z,4);assert.equal(ui.rotateAim(1),false);assert.equal(ui.skillPreview(),null);
  assert.equal(hero.facing,0);
 }
});

test('wall polygon and enemy outline membership follow the same rotated rectangle as simulation',()=>{
 const {ui,hero,state,preview}=setup();ui.shortcut('legacySkill','W_ICE_WALL');ui.rotateAim(-3);
 const data=preview(),shape=effect(data),points=previewPolygon(shape),edge=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 assert.ok(Math.abs(edge(points[0],points[1])-.7)<1e-10);assert.ok(Math.abs(edge(points[1],points[2])-4.2)<1e-10);
 const wall={x:shape.x,z:shape.z,length:4.2,thickness:.7,angle:shape.angle},at=(side,along)=>({x:shape.x+Math.cos(shape.angle)*side+Math.sin(shape.angle)*along,z:shape.z-Math.sin(shape.angle)*side+Math.cos(shape.angle)*along});
 for(const [side,along]of [[0,0],[.34,2.09],[.36,0],[0,2.11]]){const p=at(side,along);assert.equal(previewContainsPoint(shape,p),!!warlockWallContact(wall,p,p));}
 state.units.push({id:2,owner:'q',team:2,alive:true,hp:20,...at(.3,1.8)},{id:3,owner:'q',team:2,alive:true,hp:20,...at(.4,0)},{id:4,owner:'p',team:1,alive:true,hp:20,...at(0,0)});
 const policy=rtsTargetFeedbackPolicy(state,'p',{preview:{...data,sourceId:hero.id}});
 assert.deepEqual([...policy.aoeIds],[2]);assert.deepEqual([...policy.targetIds],[2]);
});

test('out of range wall cursor previews the same clamped 14m landing as the cast',()=>{
 const {ui,preview}=setup();ui.shortcut('legacySkill','W_FIRE_WALL');const data=preview({x:0,z:22});
 assert.equal(data.valid,true);assert.deepEqual(data.anchor,{x:0,z:14});assert.equal(effect(data).z,14);assert.match(data.hint,/limitada ao alcance/);
});

test('frost projectile keeps directional aiming and ordinary spells do not acquire wall angle',()=>{
 for(const key of ['W_FROST_BOLT','S000']){const {ui,sent,preview}=setup();ui.shortcut('legacySkill',key);assert.equal(ui.rotateAim(1),false);const p=preview({x:0,z:28});assert.equal(p.valid,true);assert.equal(effect(p).type,'corridor');ui.point({button:0,point:{x:0,z:28}});assert.equal(sent[0].skill,key);assert.equal(Object.hasOwn(sent[0],'angle'),false);}
});

test('Escape cancels silently and right-click cancels before issuing the ordinary move order',()=>{
 const {ui,sent}=setup();ui.shortcut('legacySkill','W_FIRE_WALL');ui.shortcut('escape');assert.equal(ui.rotateAim(1),false);assert.equal(sent.length,0);
 ui.shortcut('legacySkill','W_ICE_WALL');ui.point({button:2,point:{x:1,z:1}});assert.equal(sent.length,1);assert.equal(sent[0].type,'wlMove');assert.equal(ui.skillPreview(),null);
});

test('wheel consumes signed rotation only while placement accepts it; zoom path is otherwise untouched',()=>{
 const {ui}=setup(),calls=[],event={deltaY:120,preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');}},handler=steps=>ui.rotateAim(steps);
 assert.equal(consumeAimRotation(event,handler),false);assert.deepEqual(calls,[]);
 ui.shortcut('legacySkill','W_FIRE_WALL');const before=ui.skillPreview().skill.placementAngle;
 assert.equal(consumeAimRotation(event,handler),true);assert.deepEqual(calls,['prevent','stop']);assert.ok(Math.abs(ui.skillPreview().skill.placementAngle-before-AIM_ROTATION_STEP)<1e-10);
 event.deltaY=-120;consumeAimRotation(event,handler);assert.ok(Math.abs(ui.skillPreview().skill.placementAngle-before)<1e-10);
 assert.equal(consumeAimRotation({...event,deltaY:0},handler),false);ui.cancel();assert.equal(consumeAimRotation(event,handler),false);
});
