import test from 'node:test';import assert from 'node:assert/strict';
import {createRoFirstPersonLook,roMouseLook,roThirdPersonMouseLook,roMouseLookEnabled} from '../src/ro-first-person-look.js';
function setup(){const listeners=new Map(),moves=[],changes=[],doc={pointerLockElement:null,addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);},exitPointerLock(){this.pointerLockElement=null;listeners.get('pointerlockchange')?.();}},canvas={ownerDocument:doc,requestPointerLock(){doc.pointerLockElement=this;listeners.get('pointerlockchange')?.();return Promise.resolve();}},look=createRoFirstPersonLook({canvas,onMove:(...v)=>moves.push(v),onChange:v=>changes.push(v)});return{listeners,moves,changes,doc,canvas,look};}
test('first-person mouse movement turns the camera without holding a button, and suspension releases the cursor',()=>{
 const {look,listeners,moves,changes,doc}=setup();assert.equal(look.capture(),false);look.setEnabled(true);assert.equal(look.capture(),true);assert.equal(look.locked(),true);listeners.get('mousemove')({movementX:40,movementY:-12,buttons:0});assert.deepEqual(moves,[[40,-12]]);assert.equal(changes.at(-1),true);look.setEnabled(false);assert.equal(doc.pointerLockElement,null);listeners.get('mousemove')({movementX:4,movementY:4});assert.equal(moves.length,1);look.dispose();look.dispose();assert.equal(listeners.size,0);
});
test('Escape releases mouse look while preserving the selected camera mode, and look pitch stays finite',()=>{
 const {look,listeners,doc}=setup();look.setEnabled(true);look.capture();let stopped=0;listeners.get('keydown')({key:'Escape',preventDefault(){stopped++;},stopImmediatePropagation(){stopped++;}});assert.equal(doc.pointerLockElement,null);assert.equal(stopped,2);assert.equal(look.capture(),true,'returning to the world does not require switching camera mode');look.dispose();assert.deepEqual(roMouseLook(1,.1,40,-20),{yaw:.9,pitch:.15000000000000002});assert.equal(roMouseLook(0,0,0,-10000).pitch,1.35);assert.equal(roMouseLook(0,0,0,10000).pitch,-1.35);assert.deepEqual(roMouseLook(1,0,NaN,Infinity),{yaw:1,pitch:0});
});

test('third-person uses the same yaw sensitivity and freely follows vertical mouse movement with bounded orbit elevation',()=>{
 for(const dx of [-400,0,400])for(const dy of [-500,0,500]){const fps=roMouseLook(.6,0,dx,dy),third=roThirdPersonMouseLook(.6,.28,dx,dy);assert.equal(third.yaw,fps.yaw);assert.ok(third.elevation>=.12&&third.elevation<=1.35);}assert.ok(roThirdPersonMouseLook(0,.28,0,50).elevation>.28);assert.ok(roThirdPersonMouseLook(0,.28,0,-50).elevation<.28);
 const {look,listeners,moves}=setup();look.setEnabled(roMouseLookEnabled({options:{mode:'bonk'},bonk:{stage:'playing'}},{alive:true}));look.capture();listeners.get('mousemove')({movementX:30,movementY:20,buttons:0});assert.deepEqual(moves,[[30,20]]);look.dispose();
});

test('both Ragnarok camera modes release control for menus, upgrades and death, while cleared exploration remains playable',()=>{
 const state={options:{mode:'bonk'},bonk:{stage:'playing'}},unit={alive:true};assert.equal(roMouseLookEnabled(state,unit),true);assert.equal(roMouseLookEnabled(state,unit,true),false);assert.equal(roMouseLookEnabled(state,{alive:false}),false);assert.equal(roMouseLookEnabled({...state,bonk:{stage:'playing',offer:{}}},unit),false);assert.equal(roMouseLookEnabled({...state,bonk:{stage:'cleared'}},unit),true);assert.equal(roMouseLookEnabled({...state,bonk:{stage:'finished',won:true}},unit),true);assert.equal(roMouseLookEnabled({...state,options:{mode:'warlock'}},unit),false);
});
