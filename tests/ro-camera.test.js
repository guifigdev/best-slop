import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_CAMERA_DEFAULT_ELEVATION,roCameraAimHeight,roCameraDistance,roLeftDragCamera,roCameraDamp,roFirstPersonPose} from '../src/ro-camera.js';
import {roVisualPanelMarkup} from '../src/ro-visual-panel.js';

test('ordinary Ragnarok framing exposes sky and preserves the hero, nearby floor and attack footprint across zoom and aspect ratios',()=>{
 for(const distance of [12,22,42])for(const aspect of [390/844,618/628,1280/800]){
  const camera=new T.PerspectiveCamera(65,aspect,.1,1000),elevation=RO_CAMERA_DEFAULT_ELEVATION;
  camera.position.set(0,Math.sin(elevation)*distance,Math.cos(elevation)*distance);camera.lookAt(0,roCameraAimHeight(distance),0);camera.updateMatrixWorld();
  const foot=new T.Vector3(0,0,0).project(camera),head=new T.Vector3(0,2.6,0).project(camera),floor=new T.Vector3(0,0,2.5).project(camera);
  assert.ok(foot.y>-.91&&foot.y<-.1,'hero feet stay on screen');assert.ok(head.y>-.5&&head.y<.5,'hero head remains central');assert.ok(Math.abs(floor.y)<1,'nearby ground attacks remain visible');
  const direction=camera.getWorldDirection(new T.Vector3()),pitch=Math.asin(direction.y),skyFraction=(pitch+T.MathUtils.degToRad(32.5))/T.MathUtils.degToRad(65);
  assert.ok(skyFraction>.28&&skyFraction<.55,'at least the upper quarter shows the sky without looking away from combat');
 }
 for(const bad of [NaN,Infinity,undefined])assert.ok(Number.isFinite(roCameraAimHeight(bad)));
});

test('left dragging becomes a camera gesture only when all active non-mount skills are AUTO and none is selected',()=>{
 const weapons=[{key:'basic',auto:true},{key:'firebolt',auto:true},{key:'riding',mount:true,auto:false},{key:'passive',kind:'passive',auto:false}];assert.equal(roLeftDragCamera(weapons),true);assert.equal(roLeftDragCamera(weapons,true),false);assert.equal(roLeftDragCamera([{key:'basic',auto:true},{key:'firebolt',auto:false}]),false);assert.equal(roLeftDragCamera([]),false);assert.equal(roLeftDragCamera([null,{mount:true,auto:false}]),false);
});

test('camera damping converges without overshoot and is consistent across display rates',()=>{
 let a=0,b=0;for(let i=0;i<60;i++)a=roCameraDamp(a,1,1/60);for(let i=0;i<120;i++)b=roCameraDamp(b,1,1/120);assert.ok(a>0&&a<1);assert.ok(Math.abs(a-b)<1e-10);assert.equal(roCameraDamp(.2,1,0),.2);assert.equal(roCameraDamp(.2,1,NaN),.2);assert.ok(roCameraDamp(1,0,.016)<1);assert.equal(roCameraDistance(90),18);assert.equal(roCameraDistance(90,{freeZoom:true}),18);assert.equal(roCameraDistance(90,{debug:true,freeZoom:true}),90);
});

test('experimental first-person camera sits at the eyes and looks along the same horizontal direction as movement',()=>{
 for(const yaw of [0,.6,Math.PI]){const pose=roFirstPersonPose({x:4,z:7,ground:2,eyeHeight:2.3,yaw,pitch:0});assert.deepEqual(pose.position,{x:4,y:4.3,z:7});assert.ok(Math.abs((pose.look.x-pose.position.x)/18+Math.sin(yaw))<1e-10);assert.ok(Math.abs((pose.look.z-pose.position.z)/18+Math.cos(yaw))<1e-10);assert.equal(pose.look.y,pose.position.y);}const up=roFirstPersonPose({pitch:.5});assert.ok(up.look.y>up.position.y);
 const html=roVisualPanelMarkup({ragnarok:true,firstPerson:true});assert.match(html,/data-bk-first-person checked/);assert.match(html,/Primeira pessoa \(experimental\)/);assert.match(html,/Esc retorna/);assert.doesNotMatch(roVisualPanelMarkup(),/data-bk-first-person|data-bk-debug-zoom/);assert.match(roVisualPanelMarkup({debug:true,freeZoom:true}),/data-bk-debug-zoom checked/);
});
