import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {RO_NATIVE_EFFECT_ASSETS} from '../src/ro-native-effect-assets.js';
import {RO_NATIVE_STR_BUDGET,roStrLayerFrame,roStrQuad,roStrBlendFactors,roStrOpaqueBlendFactors,createRoNativeStrArt} from '../src/ro-native-str-art.js';

const pixels=async()=>({width:2,height:2,data:Uint8Array.from([173,41,156,0,0,0,0,255,255,230,100,255,255,255,255,150])});
const fetchJSON=async url=>JSON.parse(await readFile(new URL(url)));
const base=(frame=0,extra={})=>({frame,type:0,pos:[320,320],xy:[-35,35,35,-35,-35,-35,35,35],uv:[0,0,1,1,0,0,1,1],angle:0,color:[255,255,255,255],srcalpha:5,destalpha:7,aniframe:0,anitype:0,...extra});
const synthetic=(extra={})=>({fps:60,maxKey:59,layers:[{textures:['a'],animations:[base(0,extra)]}]});
const request=(i=1,extra={})=>({key:'r'+i,dedupeKey:'r'+i,file:'crashearth',time:0,x:0,z:0,...extra});

test('real HammerFall source retains two staggered hammers, 60fps morph timing and the original STR duration',async()=>{
 const data=await fetchJSON(RO_NATIVE_EFFECT_ASSETS.crashearth.url);assert.equal(data.fps,60);assert.equal(data.maxKey,79);assert.equal(data.layers.length,13);assert.equal(data.layers.flatMap(l=>l.animations).length,298);
 const hammer=data.layers[1],second=data.layers[2],impact=roStrLayerFrame(hammer,30);assert.deepEqual(impact.pos,[384,275]);assert.equal(impact.angle,-1024);assert.equal(impact.color[3],153);assert.equal(roStrLayerFrame(second,3),null);assert.equal(roStrLayerFrame(second,4).color[3],0);
 const smoke=roStrLayerFrame(data.layers[3],35);assert.deepEqual(smoke.pos,[308.5,334]);assert.equal(smoke.color[3],127.5);assert.deepEqual(smoke.uv,[0,0,1,1,0,0,1,1]);assert.ok(Math.abs(smoke.xy[0]+39)<1e-8);
 const scene=new T.Scene(),art=createRoNativeStrArt({scene,assets:RO_NATIVE_EFFECT_ASSETS,fetchJSON,loadPixels:pixels});try{await art.preload(['crashearth']);art.update({nativeEffectRequests:[request()]},.7);assert.equal(art.stats().quads,12);assert.equal(art.stats().originalDrawCalls,1);assert.deepEqual(art.stats().activeFiles,['crashearth']);art.update({},1.2);assert.ok(art.stats().quads>0,'clip survives removal of the source event');art.update({},80/60);assert.equal(art.stats().clips,0);assert.equal(art.stats().quads,0);}finally{art.dispose();}assert.equal(scene.children.length,0);
});

test('1024 STR angle units equal one full turn and classic pivot is 320,320 with spherical camera billboarding',()=>{
 const frame=roStrLayerFrame({textures:['a'],animations:[base()]},0),zero=roStrQuad(frame,{verticalBase:0}),turn=roStrQuad({...frame,angle:-1024},{verticalBase:0});for(let i=0;i<4;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(zero[i][j]-turn[i][j])<1e-10);assert.deepEqual(zero,[[-1,1,0],[1,1,0],[1,-1,0],[-1,-1,0]]);
 const camera=new T.PerspectiveCamera();camera.position.set(5,5,5);camera.lookAt(0,0,0);camera.updateMatrixWorld();const quad=roStrQuad(frame,{camera});assert.ok(Math.abs(quad[0][2]-quad[1][2])>.5,'plane follows the real camera right axis');
 assert.deepEqual(roStrBlendFactors(5,7),{src:T.SrcAlphaFactor,dst:T.DstAlphaFactor});assert.deepEqual(roStrBlendFactors(5,6),{src:T.SrcAlphaFactor,dst:T.OneMinusSrcAlphaFactor});assert.equal(roStrBlendFactors(0,0),null);
});

test('incremental texture animation modes stop, repeat and reverse without conflating absolute and delta poses',()=>{
 const layer={textures:['a','b','c'],animations:[base(),{...base(),type:1,pos:[1,-2],xy:Array(8).fill(.5),uv:Array(8).fill(0),color:[-1,0,0,-2],angle:4,aniframe:0,anitype:3,delay:1}]};const a=roStrLayerFrame(layer,4);assert.deepEqual(a.pos,[324,312]);assert.equal(a.angle,16);assert.equal(a.color[0],251);assert.equal(a.textureIndex,1);layer.animations[1].anitype=2;assert.equal(roStrLayerFrame(layer,10).textureIndex,2);layer.animations[1].anitype=4;assert.equal(roStrLayerFrame(layer,1).textureIndex,2);
 const hold={textures:['a'],animations:[base(),base(20,{pos:[350,350]})]};assert.deepEqual(roStrLayerFrame(hold,10).pos,[320,320]);assert.deepEqual(roStrLayerFrame(hold,20).pos,[350,350]);
});

test('readiness and capacity decisions latch before legacy routing; group admission is atomic and reset clears clips',async()=>{
 const source=RO_NATIVE_EFFECT_ASSETS.crashearth,event={id:1,time:0,x:0,z:0},scene=new T.Scene(),art=createRoNativeStrArt({scene,assets:{crashearth:source},requestsForEvent:e=>[request(e.id,{time:e.time})],fetchJSON,loadPixels:pixels});try{
  art.prepare({id:1},0);assert.equal(art.handles(event),false,'the first unprepared cast uses legacy');await art.preload(['crashearth']);assert.equal(art.handles(event),false,'it cannot switch to a duplicate native clip mid-cast');assert.equal(art.handles({...event,id:2}),true);
  for(let i=3;i<=13;i++)assert.equal(art.handles({...event,id:i}),true);assert.equal(art.handles({...event,id:14}),false);assert.equal(art.stats().clips,12);
  art.update({id:1},.7);assert.ok(art.stats().quads<=RO_NATIVE_STR_BUDGET.quads);assert.equal(art.stats().originalDrawCalls,1);
  art.prepare({id:2},.7);assert.equal(art.stats().clips,0);assert.equal(art.handles({...event,id:14}),true,'a different match releases its old reservations');art.reset();assert.equal(art.stats().clips,0);
 }finally{art.dispose();}
 const grouped=createRoNativeStrArt({scene:new T.Scene(),assets:{one:{data:synthetic(),textures:{a:'one'}},two:{data:synthetic(),textures:{a:'two'}}},loadPixels:pixels});try{await grouped.preload(['one']);const r1=request(1,{file:'one',groupId:'zone:1',zoneId:1,loop:true,until:5}),r2=request(2,{file:'two',groupId:'zone:1',zoneId:1,loop:true,until:5});grouped.prepare({nativeEffectRequests:[r1,r2]},0);assert.equal(grouped.handlesZone(1),false);assert.equal(grouped.stats().clips,0);await grouped.preload(['two']);grouped.prepare({nativeEffectRequests:[r1,r2]},.1);assert.equal(grouped.handlesZone(1),false);grouped.prepare({nativeEffectRequests:[{...r1,groupId:'zone:2',zoneId:2},{...r2,groupId:'zone:2',zoneId:2}]},.2);assert.equal(grouped.handlesZone(2),true);assert.equal(grouped.stats().clips,2);}finally{grouped.dispose();}
});

test('one shared atlas preserves transparent magenta and opaque black, keeps natural UVs and reuses buffers',async()=>{
 const scene=new T.Scene(),art=createRoNativeStrArt({scene,assets:{crashearth:{data:synthetic(),textures:{a:'image'}}},loadPixels:pixels});try{await art.preload(['crashearth']);art.update({nativeEffectRequests:[request()]},.2);const mesh=art.root.children[0],g=mesh.geometry,atlas=mesh.material.uniforms.map.value,data=atlas.image.data;assert.deepEqual([...data.slice((2048+1)*4,(2048+3)*4)],[173,41,156,0,0,0,0,255]);assert.equal(atlas.flipY,false);const uv=g.attributes.uv;assert.ok(uv.getX(1)>uv.getX(0));assert.ok(uv.getY(2)>uv.getY(1));for(let i=0;i<50;i++)art.update({nativeEffectRequests:[request()]},.2);assert.equal(art.root.children[0].geometry,g);assert.ok(art.stats().atlasBytes<=RO_NATIVE_STR_BUDGET.atlasBytes);let disposed=0;g.addEventListener('dispose',()=>disposed++);atlas.addEventListener('dispose',()=>disposed++);art.dispose();art.dispose();assert.equal(disposed,2);}finally{art.dispose();}assert.equal(scene.children.length,0);
});

test('historic empty blend batches cannot permanently exhaust admission after different sequential spells',async()=>{
 const assets={};for(let i=0;i<18;i++)assets['a'+i]={data:synthetic({srcalpha:1+Math.floor(i/9),destalpha:1+i%9}),textures:{a:'same'}};const art=createRoNativeStrArt({scene:new T.Scene(),assets,loadPixels:pixels});try{await art.preload(Object.keys(assets));for(let i=0;i<18;i++){const r=request(i,{file:'a'+i,time:i*2});art.update({nativeEffectRequests:[r]},i*2+.1);assert.equal(art.stats().quads,1,'sequential spell '+i);assert.ok(art.stats().batches<=12);}assert.equal(art.stats().dropped,0);}finally{art.dispose();}
});

test('future looping fields survive their delay, follow only declared attachments, cull and end at authoritative until',async()=>{
 const scene=new T.Scene(),art=createRoNativeStrArt({scene,assets:{crashearth:{data:synthetic(),textures:{a:'a'}}},loadPixels:pixels}),r=request(1,{time:2,until:6,loop:true,groupId:'zone:5',zoneId:5,attachedEntity:true,anchor:'source',sourceIdActor:7});
 try{await art.preload(['crashearth']);art.update({nativeEffectRequests:[r]},0);assert.equal(art.stats().clips,1);assert.equal(art.stats().quads,0);art.update({nativeEffectRequests:[{...r,time:2+1e-12}]},1);assert.equal(art.stats().clips,1,'birth rounding cannot duplicate the same field or discard its delayed start');const camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.set(0,5,20);camera.lookAt(0,0,0);camera.updateMatrixWorld();art.update({nativeEffectRequests:[r],units:[{id:7,x:4,z:0}]},2.2,()=>0,camera);assert.equal(art.stats().quads,1);const material=art.root.children[0].material;assert.equal(material.depthTest,true);assert.equal(material.uniforms.nativeDepthClamp.value,1);assert.match(material.fragmentShader,/gl_FragDepth/);assert.match(material.fragmentShader,/vNativeWorld.y<vNativeGround/);assert.equal(material.uniforms.nativePerspective.value,1);art.update({nativeEffectRequests:[r],units:[{id:7,x:400,z:400}]},2.3,()=>0,camera);assert.equal(art.stats().quads,0);assert.equal(art.stats().culled,1);art.update({nativeEffectRequests:[r]},5.8);assert.equal(art.stats().quads,1);art.update({},6);assert.equal(art.stats().clips,0);}finally{art.dispose();}
});

test('prefetch is limited to two concurrent loads and oversized/missing resources remain on legacy',async()=>{
 let active=0,peak=0;const assets={};for(let i=0;i<5;i++)assets['p'+i]={data:synthetic(),textures:{a:'texture'+i}};const art=createRoNativeStrArt({scene:new T.Scene(),assets,loadPixels:async url=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,4));active--;return pixels(url);}});try{await art.preload(Object.keys(assets));assert.equal(peak,2);assert.equal(art.stats().readyFiles.length,5);assert.equal(art.handlesRequest(request(1,{file:'unknown'})),false);}finally{art.dispose();}
 const broken=createRoNativeStrArt({scene:new T.Scene(),assets:{crashearth:{data:synthetic(),textures:{a:'oversized'}}},loadPixels:async()=>({width:4096,height:1,data:new Uint8Array(4096*4)})});try{await broken.preload(['crashearth']);assert.equal(broken.isReady('crashearth'),false);assert.equal(broken.handlesRequest(request()),false);assert.equal(broken.stats().atlasPages,0);assert.match(broken.stats().failures.crashearth,/Invalid native texture/);}finally{broken.dispose();}
});

test('opaque-client blending cannot amplify black texture rectangles or grow alpha in the real HDR scene',async()=>{
 const raw=roStrBlendFactors(5,7),native=roStrOpaqueBlendFactors(5,7);assert.equal(raw.dst,T.DstAlphaFactor,'original descriptor remains unchanged');assert.equal(native.dst,T.OneFactor);assert.equal(native.src,T.SrcAlphaFactor);assert.equal(native.srcAlpha,T.ZeroFactor);assert.equal(native.dstAlpha,T.OneFactor);assert.equal(roStrOpaqueBlendFactors(5,8).dst,T.ZeroFactor);assert.equal(roStrOpaqueBlendFactors(7,6).src,T.OneFactor);assert.equal(roStrOpaqueBlendFactors(5,6).dst,T.OneMinusSrcAlphaFactor);
 // HalfFloat scene alpha may already be four from earlier legacy flames. A
 // black, opaque pixel in each of 41 original Storm Gust layers must leave the
 // underlying scene untouched, just as on the reference opaque 8-bit target.
 const background=.17;let brokenRGB=background,brokenAlpha=4,correctRGB=background,correctAlpha=4;
 for(let layer=0;layer<41;layer++){brokenRGB*=brokenAlpha;brokenAlpha=1+brokenAlpha*brokenAlpha;correctRGB=0+correctRGB*1;correctAlpha=0+correctAlpha*1;}
 assert.ok(brokenRGB>1e20);assert.equal(correctRGB,background);assert.equal(correctAlpha,4);
 const art=createRoNativeStrArt({scene:new T.Scene(),assets:{crashearth:{data:synthetic(),textures:{a:'a'}}},loadPixels:pixels});try{await art.preload(['crashearth']);art.update({nativeEffectRequests:[request()]},.2);const material=art.root.children[0].material;assert.equal(material.blending,T.CustomBlending);assert.equal(material.blendSrc,T.SrcAlphaFactor);assert.equal(material.blendDst,T.OneFactor);assert.equal(material.blendSrcAlpha,T.ZeroFactor);assert.equal(material.blendDstAlpha,T.OneFactor);assert.equal(material.blendEquationAlpha,T.AddEquation);}finally{art.dispose();}
});
