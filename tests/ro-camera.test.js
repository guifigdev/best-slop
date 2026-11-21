import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {RO_CAMERA_DEFAULT_ELEVATION,roCameraAimHeight} from '../src/ro-camera.js';

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
