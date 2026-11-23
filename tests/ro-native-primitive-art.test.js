import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createRoNativePrimitiveArt,roNativePrimitivePose,roNativePrimitiveTriangles,roNativePrimitiveReferenceRadius,roNativePrimitiveAreaScale,RO_NATIVE_PRIMITIVE_BUDGET as B} from '../src/ro-native-primitive-art.js';
import {RO_NATIVE_PRIMITIVE_MANIFEST as manifest,RO_NATIVE_PRIMITIVE_ASSETS as assets} from '../src/ro-native-primitive-assets.js';
import {roNativeEventRequests} from '../shared/ro-native-effect-policy.js';
const magnum=manifest.skills.sm_magnum.phases.cast[0],pixel=async()=>({width:2,height:2,data:new Uint8Array(16).fill(255)}),options={types:['2D','3D','CYLINDER','QuadHorn'],hasAsset:row=>!!manifest.parts[row.primitiveId]},requests=(e,u,state)=>roNativeEventRequests(e,u,manifest,{...options,state});
const state=()=>({time:0,options:{mode:'bonk'},bonk:{map:{seed:1},floor:1},units:[{id:1,x:0,z:0,bonkHero:true}],effects:[]});

test('primitive importer packages declarative source parts with verified local RGBA textures',()=>{
 assert.equal(manifest.unavailable.length,0);assert.ok(manifest.coverage.skills>=30);assert.ok(manifest.coverage.packageBytes<1024*1024);
 for(const [name,texture]of Object.entries(manifest.textures)){const data=readFileSync(new URL('../src/assets/ro-native-primitives/'+texture.file,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),texture.sha256);assert.equal(data.readUInt32BE(16),texture.width);assert.equal(data.readUInt32BE(20),texture.height);assert.ok(assets[name].url.startsWith('file:'));}
 for(const part of Object.values(manifest.parts)){assert.ok(['2D','3D','CYLINDER','QuadHorn'].includes(part.type));assert.ok(part.textureFiles.every(t=>assets[t]));assert.ok(!part.playSprite&&!part.spriteName,'missing SPR animation is not presented as a texture');}
});

test('original Magnum Break parameters expand a real circular frustum and fade over 300ms',()=>{
 assert.equal(magnum.effectId,17);assert.equal(magnum.animation,4);assert.equal(roNativePrimitivePose(magnum,-.01),null);assert.equal(roNativePrimitivePose(magnum,.301),null);
 const pose=roNativePrimitivePose(magnum,.15);assert.equal(pose.bottom,2);assert.equal(pose.top,3);assert.equal(pose.height,1);assert.equal(pose.alpha,.7);const geometry=roNativePrimitiveTriangles(magnum,pose);assert.equal(geometry.position.length/3,20*6);assert.ok(geometry.position.every(Number.isFinite));assert.equal(Math.max(...geometry.position.filter((_,i)=>i%3===1)),1);
});

test('source billboard sizes and randomized duplicate positions vary deterministically without mutating data',()=>{
 const row={type:'3D',duration:1000,sizeStart:200,sizeEnd:70,fadeIn:true,fadeOut:true,alphaMax:1,posxRand:2,poszStart:0,poszEnd:4},before=structuredClone(row),a=roNativePrimitivePose(row,.5,{key:'a'}),b=roNativePrimitivePose(row,.5,{key:'a'}),c=roNativePrimitivePose(row,.5,{key:'b'});assert.deepEqual(a,b);assert.notEqual(a.x,c.x);assert.equal(a.y,2);assert.equal(a.width,135/35);assert.deepEqual(row,before);assert.ok(roNativePrimitiveTriangles(row,a).position.every(Number.isFinite));
});

test('renderer loads shared assets, admits both Magnum cylinders, bounds batches and releases resources',async()=>{
 const scene=new T.Scene(),s=state(),art=createRoNativePrimitiveArt({scene,manifest,assets,requestsForEvent:requests,loadPixels:pixel});art.prepare(s);const event={id:1,time:0,type:'roAttack',skillKey:'sm_magnum',bonk:true,attackKind:'pulse',source:1,x:0,z:0};const list=requests(event,s.units[0],s);assert.equal(list.length,2);await art.preload(list.map(r=>r.primitiveId));assert.ok(art.handles(event,s.units[0]));s.effects=[event];art.update(s,.15,()=>0);assert.equal(art.stats().particles,2);assert.ok(art.stats().vertices>0);assert.ok(art.stats().drawCalls<=B.batches);assert.ok(art.stats().atlasBytes<=B.atlasSize*B.atlasSize*4*B.atlasPages);
 let disposed=0;scene.traverse(o=>o.geometry?.addEventListener('dispose',()=>disposed++));art.dispose();assert.ok(disposed>0);assert.equal(scene.children.length,0);art.dispose();
});

test('late loading never changes a prior fallback decision and approved physical weapon trails stay active',async()=>{
 const s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,requestsForEvent:requests,loadPixels:pixel});art.prepare(s);const e={id:5,time:0,type:'roAttack',skillKey:'sm_magnum',bonk:true,attackKind:'pulse',source:1,x:0,z:0};assert.equal(art.handles(e,s.units[0]),false);await art.preload(manifest.skills.sm_magnum.phases.cast.map(r=>r.primitiveId));assert.equal(art.handles(e,s.units[0]),false);assert.equal(art.handles({...e,id:6},s.units[0]),true);
 const bash={...e,id:7,skillKey:'bash',attackKind:'slash'};await art.preload(Object.values(manifest.parts).filter(r=>r.effectId===1).map(r=>r.primitiveId));assert.equal(art.handles(bash,s.units[0]),false,'native hit can accompany, not suppress, the approved sword trail');assert.equal(art.handles({...e,id:8,skillKey:'basic'},s.units[0]),false);art.dispose();
});

test('far effects cull while clip admission stays bounded under spam',async()=>{
 const s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,loadPixels:pixel});art.prepare(s);await art.preload([magnum.primitiveId]);for(let i=0;i<100;i++)art.handlesRequest({primitiveId:magnum.primitiveId,x:1000,z:0,time:0,dedupeKey:String(i)});assert.equal(art.stats().clips,B.clips);const camera=new T.PerspectiveCamera(60,1,.1,100);camera.position.set(0,10,15);camera.lookAt(0,0,0);camera.updateMatrixWorld();art.update(s,.15,()=>0,camera);assert.equal(art.stats().particles,0);assert.equal(art.stats().culled,B.clips);assert.ok(art.stats().dropped>0);art.dispose();
});

test('Heavens Drive uses the original 5 by 5 textured spike recipe and emerges from below the floor',async()=>{
 const part=manifest.skills.heavensdrive.phases.cast[0];assert.equal(part.effectId,142);assert.equal(part.type,'QuadHorn');assert.equal(part.duplicate,25);assert.deepEqual(part.textureFiles,['stone.bmp']);
 const birth=roNativePrimitivePose(part,0,{duplicate:12}),rise=roNativePrimitivePose(part,.3,{duplicate:12});assert.ok(birth.y<rise.y);assert.equal(rise.y,-.1);assert.ok(rise.height>=.75&&rise.height<=1.2);const triangle=roNativePrimitiveTriangles(part,rise);assert.equal(triangle.position.length,36);assert.ok(triangle.position.every(Number.isFinite));
 const s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,requestsForEvent:requests,loadPixels:pixel});art.prepare(s);await art.preload([part.primitiveId]);s.effects=[{id:30,time:0,type:'roAttack',skillKey:'heavensdrive',source:1,bonk:true,attackKind:'pulse',x:0,z:0}];art.update(s,.3,()=>0);assert.equal(art.stats().particles,25);assert.equal(art.stats().vertices,25*12);art.dispose();
});

test('native primitive RGB blending preserves opaque HDR framebuffer alpha independently',async()=>{
 const scene=new T.Scene(),s=state(),art=createRoNativePrimitiveArt({scene,manifest,assets,loadPixels:pixel}),additive=Object.values(manifest.parts).find(p=>p.blendMode===2&&p.type==='3D'&&!p.delayStart&&!p.delayOffset&&p.duration>150);art.prepare(s);await art.preload([magnum.primitiveId,additive.primitiveId]);
 for(const [i,part]of [magnum,additive].entries())assert.ok(art.handlesRequest({primitiveId:part.primitiveId,x:0,z:0,time:0,dedupeKey:'alpha-'+i}));art.update(s,.15,()=>0);
 const materials=[];scene.traverse(o=>{if(o.material)materials.push(o.material);});assert.ok(materials.length>=2);assert.ok(materials.some(m=>m.blendDst===T.OneFactor),'additive RGB stays additive');
 for(const material of materials){assert.equal(material.blendSrc,T.SrcAlphaFactor);assert.equal(material.blendEquationAlpha,T.AddEquation);assert.equal(material.blendSrcAlpha,T.ZeroFactor);assert.equal(material.blendDstAlpha,T.OneFactor);}
 art.dispose();
});

test('native ground presentation scales to the authoritative pulse range and leaves buffs/basic attacks unchanged',()=>{
 const earth=manifest.skills.heavensdrive.phases.cast[0],attack={type:'roAttack',attackKind:'pulse',skillKey:'heavensdrive',range:9,radius:3};assert.equal(roNativePrimitiveReferenceRadius(earth),2.7);const scale=roNativePrimitiveAreaScale(earth,attack);assert.equal(scale,9/2.7,'the launch radius marker is not the pulse damage range');
 const base=roNativePrimitivePose(earth,.3,{duplicate:12}),large=roNativePrimitivePose(earth,.3,{duplicate:12,scale});assert.ok(large.height>=2.5&&large.height<=4);assert.ok(large.height>base.height*3);
 const cylinders=manifest.skills.sm_magnum.phases.cast;assert.ok(cylinders.every(row=>roNativePrimitiveReferenceRadius(row)===6));assert.ok(cylinders.every(row=>roNativePrimitiveAreaScale(row,{...attack,skillKey:'sm_magnum',range:7})===7/6),'the cone and outside ring share one scale');
 assert.equal(roNativePrimitiveAreaScale(earth,{type:'devotion',range:9}),1);assert.equal(roNativePrimitiveAreaScale(earth,{...attack,skillKey:'basic'}),1);assert.equal(roNativePrimitiveAreaScale(earth,{type:'abilityPulse',radius:9}),9/2.7);assert.equal(roNativePrimitiveAreaScale(earth,{...attack,range:Infinity,radius:0},{baseScale:1.2}),1.2);assert.equal(roNativePrimitiveAreaScale(earth,{...attack,range:1000}),4);
});

test('short one-shots release their clip capacity at the natural end even inside an eight-second buff',async()=>{
 const s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,loadPixels:pixel});art.prepare(s);await art.preload([magnum.primitiveId]);assert.ok(art.handlesRequest({primitiveId:magnum.primitiveId,x:0,z:0,time:0,until:8}));art.update(s,.15,()=>0);assert.equal(art.stats().clips,1);assert.equal(art.stats().particles,1);art.update(s,.301,()=>0);assert.equal(art.stats().clips,0);assert.equal(art.stats().particles,0);
 assert.ok(art.handlesRequest({primitiveId:magnum.primitiveId,x:0,z:0,time:1,until:1.1,dedupeKey:'shorter-buff'}));art.update(s,1.101,()=>0);assert.equal(art.stats().clips,0,'authoritative expiry can also shorten a native one-shot');art.dispose();
});

test('repeat and loop requests keep sampling their native period after one initial delay, until authoritative expiry',async()=>{
 const repeat=Object.values(manifest.parts).find(p=>p.repeat&&p.duration===2000),delayed={...repeat,primitiveId:'delayed-repeat',delayOffset:500},looped={...delayed,primitiveId:'delayed-loop',repeat:false},fixture={...manifest,parts:{...manifest.parts,[delayed.primitiveId]:delayed,[looped.primitiveId]:looped}},s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest:fixture,assets,loadPixels:pixel});art.prepare(s);await art.preload([repeat.primitiveId,delayed.primitiveId,looped.primitiveId]);
 for(const part of [repeat,delayed,looped])assert.ok(art.handlesRequest({primitiveId:part.primitiveId,x:0,z:0,time:0,until:8,loop:part===looped,dedupeKey:part.primitiveId}));
 art.update(s,.25,()=>0);assert.equal(art.stats().particles,1,'the delayed clips have not started');art.update(s,2.1,()=>0);assert.equal(art.stats().particles,3,'native periods do not restart the initial delay');art.update(s,3,()=>0);assert.equal(art.stats().particles,3,'source repeat and explicit loop both continue');art.update(s,7.9,()=>0);assert.equal(art.stats().clips,3);assert.equal(art.stats().particles,3);art.update(s,8,()=>0);assert.equal(art.stats().clips,0);assert.equal(art.stats().particles,0);art.dispose();
});

test('Cylinder source defaults use twenty sides, one UV circuit, quarter fades and continuous rotation',()=>{
 const row={...magnum,rotate:false},pose=roNativePrimitivePose(row,.15),geometry=roNativePrimitiveTriangles(row,pose);assert.equal(geometry.position.length/3,20*6);assert.equal(Math.max(...geometry.uv),1);assert.equal(geometry.position[0],0);assert.equal(geometry.position[2],pose.bottom,'the native seam begins on the positive depth axis');
 assert.equal(roNativePrimitivePose(row,.0375).alpha,.35);assert.equal(roNativePrimitivePose(row,.075).alpha,.7);assert.equal(roNativePrimitivePose(row,.225).alpha,.7);assert.ok(Math.abs(roNativePrimitivePose(row,.2625).alpha-.35)<1e-12);
 const a=roNativePrimitivePose(magnum,.1,{time:3}),b=roNativePrimitivePose(magnum,.1,{time:3.2});assert.ok(Math.abs((b.rotation[1]-a.rotation[1])*180/Math.PI-50)<1e-10,'source rotate=true advances 250 degrees per second');
 const partial=roNativePrimitiveTriangles({...row,totalCircleSides:8,circleSides:4,repeatTextureX:3},pose);assert.equal(partial.position.length/3,4*6);assert.equal(Math.max(...partial.uv),3,'repeat spans the visible sector, independently of the whole circle');
});

test('native cylinder UV repeat is enabled per primitive without wrapping ordinary billboards',async()=>{
 const repeated={...magnum,primitiveId:'repeat-uv',repeatTextureX:3},fixture={...manifest,parts:{...manifest.parts,[repeated.primitiveId]:repeated}},s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest:fixture,assets,loadPixels:pixel});art.prepare(s);await art.preload([repeated.primitiveId]);art.handlesRequest({primitiveId:repeated.primitiveId,x:0,z:0,time:0});art.update(s,.15,()=>0);const mesh=art.root.children.find(o=>o.geometry?.drawRange.count);assert.ok(mesh);assert.equal(mesh.geometry.attributes.nativeRepeat.getX(0),1);assert.match(mesh.material.fragmentShader,/fract\(vUv\.x\)/);assert.equal(Math.max(...mesh.geometry.attributes.uv.array.subarray(0,mesh.geometry.drawRange.count*2)),3);art.dispose();
});

test('known ground cylinders follow a sloping floor with four-centimetre clearance',async()=>{
 const s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,loadPixels:pixel}),heightAt=(x,z)=>2+x*.3+z*.2;art.prepare(s);await art.preload([magnum.primitiveId]);art.handlesRequest({primitiveId:magnum.primitiveId,x:0,z:0,time:0,conformGround:true,scale:7/6});art.update(s,.15,heightAt);const mesh=art.root.children.find(o=>o.geometry?.drawRange.count),positions=mesh.geometry.attributes.position;
 for(let i=0;i<mesh.geometry.drawRange.count;i++){const relative=positions.getY(i)-heightAt(positions.getX(i),positions.getZ(i));assert.ok(Math.abs(relative-([0,3,5].includes(i%6)?.04:1*7/6+.04))<1e-5,'each original cylinder level keeps its height above the local terrain');}
 art.dispose();
});

test('grid spikes preserve their original shapes while each pillar is seated at its own terrain height',async()=>{
 const part=manifest.skills.heavensdrive.phases.cast[0],s=state(),art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,loadPixels:pixel}),heightAt=(x,z)=>3+x*.2+z*.3;art.prepare(s);await art.preload([part.primitiveId]);art.handlesRequest({primitiveId:part.primitiveId,x:0,z:0,time:0,dedupeKey:'terrain-spikes',conformGround:true});art.update(s,.3,heightAt);const mesh=art.root.children.find(o=>o.geometry?.drawRange.count),positions=mesh.geometry.attributes.position;assert.equal(mesh.geometry.drawRange.count,25*12);
 for(let pillar=0;pillar<25;pillar++){const first=pillar*12,baseY=positions.getY(first);for(let face=0;face<4;face++){assert.ok(Math.abs(positions.getY(first+face*3)-baseY)<1e-5);assert.ok(Math.abs(positions.getY(first+face*3+1)-baseY)<1e-5,'the base is not distorted by sampling its corners separately');}const centreX=(positions.getX(first)+positions.getX(first+4))/2,centreZ=(positions.getZ(first)+positions.getZ(first+4))/2;assert.ok(Math.abs(baseY-(heightAt(centreX,centreZ)-.1+.04))<1e-5);const nativeHeight=positions.getY(first+2)-baseY;assert.ok(nativeHeight>=.75&&nativeHeight<=1.2);}
 art.dispose();
});

test('ground conforming never changes an ordinary vertical aura or projectile primitive',async()=>{
 const part=manifest.skills.sm_endure.phases.cast[0],s=state(),buffers=[];for(const conformGround of [false,true]){const art=createRoNativePrimitiveArt({scene:new T.Scene(),manifest,assets,loadPixels:pixel});art.prepare(s);await art.preload([part.primitiveId]);art.handlesRequest({primitiveId:part.primitiveId,x:0,z:0,time:0,conformGround});art.update(s,.3,(x,z)=>2+x*.3+z*.2);const mesh=art.root.children.find(o=>o.geometry?.drawRange.count);buffers.push(Array.from(mesh.geometry.attributes.position.array.subarray(0,mesh.geometry.drawRange.count*3)));art.dispose();}assert.deepEqual(buffers[0],buffers[1]);
});
