import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Raycaster,Plane,Vector2,Vector3} from 'three';
import {groundDragDelta,createCameraGestures} from '../src/camera-input.js';
const event=(pointerId,x,y,extra={})=>({pointerId,clientX:x,clientY:y,button:0,pointerType:'touch',...extra});
test('grab dragging keeps the same ground point under the pointer in every direction, orientation, zoom and viewport',()=>{for(const angle of [0,.6,2.4,Math.PI])for(const distance of [20,49,180])for(const [width,height]of [[900,590],[390,700]])for(const [dx,dy]of [[0,-60],[0,60],[75,0],[-75,0],[40,-35]]){const rect={left:15,top:80,width,height},camera=new PerspectiveCamera(37,width/height,.1,400),target=new Vector3(5,0,10);camera.position.set(target.x+Math.sin(angle)*distance*.7,distance*.72,target.z+Math.cos(angle)*distance*.7);camera.lookAt(target);camera.updateMatrixWorld();const from={x:rect.left+width*.52,y:rect.top+height*.52},to={x:from.x+dx,y:from.y+dy},ray=new Raycaster();ray.setFromCamera(new Vector2((from.x-rect.left)/width*2-1,-(from.y-rect.top)/height*2+1),camera);const anchor=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),-.2),new Vector3());const delta=groundDragDelta(camera,rect,from,to),offset=new Vector3(delta.x,0,delta.z);camera.position.add(offset);target.add(offset);camera.lookAt(target);camera.updateMatrixWorld();const screen=anchor.project(camera),x=rect.left+(screen.x*.5+.5)*width,y=rect.top+(-screen.y*.5+.5)*height;assert.ok(Math.abs(x-to.x)<.00001);assert.ok(Math.abs(y-to.y)<.00001);}});
test('a tap selects once; dragging with mouse, middle button or touch never issues a gameplay tap',()=>{for(const extra of [{pointerType:'mouse',button:0},{pointerType:'mouse',button:1},{pointerType:'touch',button:0}]){let taps=0,pans=0,rotations=0;const g=createCameraGestures({onTap:()=>taps++,onPan:()=>pans++,onRotate:()=>rotations++});g.down(event(1,100,100,extra));g.move(event(1,102,100,extra));g.up(event(1,102,100,extra));assert.equal(taps,extra.button===1?0:1);const before=taps;g.down(event(1,100,100,extra));g.move(event(1,100,40,extra));g.up(event(1,100,40,extra));assert.equal(taps,before);assert.ok(extra.button===1?rotations>0&&pans===0:pans>0&&rotations===0);assert.equal(g.active,false);}});
test('explicit rotate mode works with one finger and mouse without Ctrl, while Ctrl does not alter move mode',()=>{for(const pointerType of ['touch','mouse']){let mode='rotate',rotations=0,pans=0,taps=0;const g=createCameraGestures({getMode:()=>mode,onRotate:()=>rotations++,onPan:()=>pans++,onTap:()=>taps++});g.down(event(1,20,30,{pointerType,ctrlKey:false}));g.move(event(1,80,60,{pointerType,ctrlKey:false}));g.up(event(1,80,60,{pointerType}));assert.ok(rotations>0);assert.equal(pans,0);assert.equal(taps,0);mode='pan';g.down(event(1,20,30,{pointerType,ctrlKey:true}));g.move(event(1,20,-30,{pointerType,ctrlKey:true}));g.up(event(1,20,-30,{pointerType}));assert.ok(pans>0);}});
test('two fingers zoom and pan; returning to one finger does not jump or generate a click',()=>{const pans=[],zooms=[];let taps=0;const g=createCameraGestures({onPan:(a,b)=>pans.push({a,b}),onZoom:k=>zooms.push(k),onTap:()=>taps++});g.down(event(1,100,100));g.down(event(2,200,100));g.move(event(2,250,120));assert.ok(zooms.some(k=>k<1));assert.deepEqual(pans[0],{a:{x:150,y:100},b:{x:175,y:110}});g.up(event(2,250,120));g.move(event(1,110,110));assert.deepEqual(pans.at(-1),{a:{x:100,y:100},b:{x:110,y:110}});g.up(event(1,110,110));assert.equal(taps,0);assert.equal(g.active,false);});
test('cancel, lost capture and blur resets cannot leave a stuck drag or dispatch a tap',()=>{let taps=0;const g=createCameraGestures({onTap:()=>taps++});g.down(event(1,10,10));g.cancel(1);g.up(event(1,10,10));assert.equal(g.active,false);g.down(event(2,10,10));g.reset();g.up(event(2,10,10));assert.equal(taps,0);assert.equal(g.down(event(3,10,10,{pointerType:'mouse',button:2})),false);});


test('middle mouse rotates without a modifier and leaves the chosen left/touch drag mode unchanged',()=>{
 let mode='pan',pans=0,rotations=0,taps=0;const g=createCameraGestures({getMode:()=>mode,onPan:()=>pans++,onRotate:()=>rotations++,onTap:()=>taps++});
 g.down(event(1,10,10,{pointerType:'mouse',button:1}));g.move(event(1,70,30,{pointerType:'mouse',button:1}));g.up(event(1,70,30,{pointerType:'mouse',button:1}));assert.ok(rotations>0);assert.equal(pans,0);assert.equal(taps,0);
 g.down(event(2,10,10,{pointerType:'mouse',button:0}));g.move(event(2,70,30,{pointerType:'mouse',button:0}));g.up(event(2,70,30,{pointerType:'mouse',button:0}));assert.ok(pans>0);assert.equal(mode,'pan');
});

test('character orbit replaces terrain dragging while keeping short taps available for interactions',()=>{
 for(const pointerType of ['mouse','touch'])for(const preferred of ['pan','rotate']){
  const rotations=[];let pans=0,taps=0,orbit=true;const g=createCameraGestures({getMode:()=>preferred,isCharacterOrbit:()=>orbit,onRotate:(x,y)=>rotations.push([x,y]),onPan:()=>pans++,onTap:()=>taps++});
  g.down(event(1,100,100,{pointerType}));g.move(event(1,102,100,{pointerType}));g.up(event(1,102,100,{pointerType}));assert.equal(taps,1);
  g.down(event(2,100,100,{pointerType}));g.move(event(2,160,125,{pointerType}));g.up(event(2,160,125,{pointerType}));assert.equal(pans,0);assert.equal(taps,1);assert.deepEqual(rotations[0],[60,25]);
  // Leaving the survivor restores the existing RTS preference.
  orbit=false;rotations.length=0;g.down(event(3,0,0,{pointerType}));g.move(event(3,40,10,{pointerType}));g.up(event(3,40,10,{pointerType}));assert.equal(pans>0,preferred==='pan');assert.equal(rotations.length>0,preferred==='rotate');
 }
});

test('two-finger character orbit zooms and rotates without translating the pivot or clicking scenery',()=>{
 let pans=0,taps=0;const rotations=[],zooms=[],g=createCameraGestures({isCharacterOrbit:()=>true,onPan:()=>pans++,onRotate:(x,y)=>rotations.push([x,y]),onZoom:k=>zooms.push(k),onTap:()=>taps++});
 g.down(event(1,100,100));g.down(event(2,200,100));g.move(event(2,250,120));assert.deepEqual(rotations[0],[25,10]);assert.ok(zooms[0]<1);g.up(event(2,250,120));g.move(event(1,110,110));assert.deepEqual(rotations.at(-1),[10,10]);g.up(event(1,110,110));assert.equal(pans,0);assert.equal(taps,0);assert.equal(g.active,false);
});
