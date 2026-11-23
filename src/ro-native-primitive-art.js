import * as T from 'three';

// Declarative parameters are source data. Geometry, interpolation, batching and
// resource lifetime below are independently implemented for this game's world.
export const RO_NATIVE_PRIMITIVE_BUDGET=Object.freeze({clips:32,particles:384,vertices:32768,batches:8,atlasSize:1024,atlasPages:2,maxDistance:70,pixelsPerMetre:35});
const B=RO_NATIVE_PRIMITIVE_BUDGET,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=(n,f=0)=>Number.isFinite(n)?n:f,lerp=(a,b,t)=>a+(b-a)*t;
const seed=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const random=(key,index=0)=>{let n=seed(key)^Math.imul(index+1,2654435761);n=Math.imul(n^(n>>>16),2246822507);return((n^(n>>>13))>>>0)/4294967296;};
const range=(value,key,index=0,fallback=0)=>Array.isArray(value)?lerp(finite(value[0]),finite(value[1]),random(key,index)):Number.isFinite(value)?value:fallback;
const timeOf=(row,key)=>Math.max(.001,range(row.durationRand,key,0,finite(row.duration,500))/1000);
const degrees=n=>finite(n)*Math.PI/180;
const delayOf=(row,duplicate=0)=>(finite(row.delayStart)+finite(row.delayOffset)+duplicate*finite(row.timeBetweenDupli))/1000;
function sampleAge(row,age,key,duplicate,loop){
 if(!loop&&!row.repeat)return age;
 const delay=delayOf(row,duplicate);if(age<delay)return age;
 const duration=timeOf(row,key+duplicate),period=duration+Math.max(0,finite(row.repeatDelay))/1000;
 return delay+(age-delay)%period;
}

// Native ground recipes use their own units. Match their visible footprint to
// the authoritative pulse area without modifying damage or gameplay geometry.
export function roNativePrimitiveReferenceRadius(row){
 if(row?.type==='QuadHorn'&&row.gridSize>1){const bottom=Array.isArray(row.bottomSize)?Math.max(...row.bottomSize.filter(Number.isFinite)):finite(row.bottomSize);return(row.gridSize-1)/2*finite(row.gridSpacing,1)+bottom;}
 // Both Magnum Break layers form one effect, whose outside layer reaches six
 // units. One shared scale keeps its ring/cone proportions intact.
 if(row?.type==='CYLINDER'&&row.effectId===17)return 6;
 return null;
}
export function roNativePrimitiveAreaScale(row,event,{baseScale=1}={}){
 const base=clamp(finite(baseScale,1),.1,4),radius=roNativePrimitiveReferenceRadius(row),area=event?.attackKind==='pulse'||event?.type==='abilityPulse';
 if(!radius||!area||event.basicAttack||event.skillKey==='basic')return base;
 const reach=Number.isFinite(event.range)&&event.range>0?event.range:finite(event.radius);return reach>0?clamp(base*reach/radius,.1,4):base;
}

export function roNativePrimitivePose(row,age,{key='effect',duplicate=0,scale=1,time=age}={}){
 const delay=delayOf(row,duplicate),duration=timeOf(row,key+duplicate),elapsed=age-delay;if(elapsed<0||elapsed>=duration)return null;
 const p=clamp(elapsed/duration,0,1),smooth=row.sizeSmooth?p*p*(3-2*p):p,base=finite(row.size,64)+finite(row.sizeRand)*random(key,3);
 const size=(axis)=>{const start=range(row['sizeRandStart'+axis],key,4+axis.charCodeAt(0),finite(row['sizeStart'+axis],finite(row.sizeStart,finite(row['size'+axis],base)))),end=range(row['sizeRandEnd'+axis],key,9+axis.charCodeAt(0),finite(row['sizeEnd'+axis],finite(row.sizeEnd,finite(row['size'+axis],start))));return Math.max(.001,lerp(start,end,smooth))*scale/B.pixelsPerMetre;};
 let alpha=finite(row.alphaMax,1);if(row.fadeIn)alpha*=Math.min(1,p*2);if(row.fadeOut)alpha*=Math.min(1,(1-p)*2);if(row.fade&&!row.fadeIn&&!row.fadeOut)alpha*=1-p;
 const coord=(axis,index)=>{const lower=axis.toLowerCase(),sample=(field,base=0)=>Array.isArray(row[field])?range(row[field],key,index,base):base+finite(row[field])*(random(key,index)-.5)*2,start=sample('pos'+lower+'StartRand',finite(row['pos'+lower+'Start'],finite(row['pos'+lower],finite(row['pos'+axis]))))+finite(row['pos'+lower+'StartRandMiddle']),end=sample('pos'+lower+'EndRand',finite(row['pos'+lower+'End'],start))+finite(row['pos'+lower+'EndRandMiddle']),jitter=sample('pos'+lower+'Rand');return(lerp(start,end,p)+jitter)*scale;};
 const angle=lerp(range(row.angleRand,key,5,finite(row.angle)),finite(row.toAngle,range(row.angleRand,key,5,finite(row.angle))),p)+finite(row.nbOfRotation)*360*p;
 let bottom=Math.max(0,finite(row.bottomSize))*scale,top=Math.max(0,finite(row.topSize))*scale,height=Math.max(0,finite(row.height))*scale;
 if(row.type==='CYLINDER'){
  alpha=row.alphaMax>0?row.alphaMax:1;if(row.fade)alpha*=Math.min(1,p*4,(1-p)*4);
  const growth=clamp(elapsed/Math.min(1,duration),0,1),pulse=1-Math.abs(p*2-1);
  if(row.animation===1)height*=growth;else if(row.animation===2)top*=growth;else if(row.animation===3){bottom*=1-p;top*=1-p;height*=pulse;}else if(row.animation===4){bottom*=p;top*=p;}else if(row.animation===5)height*=pulse;
 }
 if(row.type==='QuadHorn'){
  const nativeHeight=range(row.height,key+duplicate,30,1)*scale,grid=finite(row.gridSize,1),spacing=finite(row.gridSpacing,1)*scale,growth=clamp(elapsed/(finite(row.animationSpeed,250)/1000),0,1),sink=row.animationOut?clamp((p-.75)/.25,0,1):0;
  return{p,alpha,width:1,height:nativeHeight,bottom:range(row.bottomSize,key+duplicate,31,.5)*scale,top:0,x:((duplicate%grid)-(grid-1)/2)*spacing+range(row.offsetX,key+duplicate,34)*scale,y:range(row.offsetZ,key+duplicate,35)*scale-nativeHeight*(1-growth+sink),z:(Math.floor(duplicate/grid)-(grid-1)/2)*spacing+range(row.offsetY,key+duplicate,36)*scale,angle:degrees(range(row.rotateY,key+duplicate,32)),lean:degrees(range(row.rotateZ,key+duplicate,33)),pitch:degrees(range(row.rotateX,key+duplicate,37)),color:row.color?.slice(0,3)||[1,1,1],textureFrame:0};
 }
 const rotation=row.type==='CYLINDER'?['X','Y','Z'].map((axis,index)=>degrees(finite(row['angle'+axis])+Math.floor(random(key+duplicate,40+index)*finite(row['angle'+axis+'Random']))+(axis==='Y'&&row.rotate?time*250:0))):null;
 return{p,alpha,width:size('X'),height:row.type==='CYLINDER'?height:size('Y'),bottom,top,x:coord('X',10),y:coord('Z',14),z:coord('Y',18),angle:degrees(angle),rotation,color:[finite(row.red,1),finite(row.green,1),finite(row.blue,1)],textureFrame:row.frameDelay?Math.floor(elapsed*1000/row.frameDelay):Math.floor(p*(row.textureFiles?.length||1))};
}

export function roNativePrimitiveTriangles(row,pose,{x=0,y=0,z=0,camera=null}={}){
 const points=[],uv=[],color=[],m=camera?.matrixWorld?.elements,right=m?[m[0],m[1],m[2]]:[1,0,0],up=m?[m[4],m[5],m[6]]:[0,1,0],cx=x+pose.x,cy=y+pose.y,cz=z+pose.z;
 const vertex=(v,u,w)=>{points.push(...v);uv.push(u,w);color.push(...pose.color,pose.alpha);};
 if(row.type==='QuadHorn'){
  const radius=pose.bottom,c=Math.cos(pose.angle),s=Math.sin(pose.angle),at=(a,b,h)=>[cx+a*c-b*s+Math.sin(pose.lean||0)*h,cy+h,cz+a*s+b*c+Math.sin(pose.pitch||0)*h],top=at(0,0,pose.height),corners=[at(-radius,-radius,0),at(radius,-radius,0),at(radius,radius,0),at(-radius,radius,0)];for(let i=0;i<4;i++){vertex(corners[i],0,1);vertex(corners[(i+1)%4],1,1);vertex(top,.5,0);}
 }else if(row.type==='CYLINDER'){
  const total=clamp(Math.floor(finite(row.totalCircleSides,20)),3,32),sides=clamp(Math.floor(finite(row.circleSides,total)),1,total),angles=pose.rotation||[degrees(row.angleX),degrees(row.angleY),degrees(row.angleZ)],euler=new T.Euler(...angles),rotation=new T.Matrix4().makeRotationFromEuler(euler),v=new T.Vector3();
  const at=(a,h,r)=>{v.set(Math.sin(a)*r,h,Math.cos(a)*r).applyMatrix4(rotation);return[cx+v.x,cy+v.y,cz+v.z];};
  for(let i=0;i<sides;i++){const a=i/total*Math.PI*2,b=(i+1)/total*Math.PI*2,A=at(a,0,pose.bottom),C=at(a,pose.height,pose.top),D=at(b,pose.height,pose.top),E=at(b,0,pose.bottom),repeat=finite(row.repeatTextureX,1),u=i/sides*repeat,w=(i+1)/sides*repeat;for(const [v,s,t]of [[A,u,1],[C,u,0],[D,w,0],[A,u,1],[D,w,0],[E,w,1]])vertex(v,s,t);}
 }else{
  const c=Math.cos(pose.angle),s=Math.sin(pose.angle),at=(a,b)=>{const rx=a*c-b*s,ry=a*s+b*c;return[cx+right[0]*rx+up[0]*ry,cy+right[1]*rx+up[1]*ry,cz+right[2]*rx+up[2]*ry];},w=pose.width/2,h=pose.height/2,quad=[at(-w,-h),at(w,-h),at(w,h),at(-w,h)];
  for(const i of [0,1,2,0,2,3])vertex(quad[i],[0,1,1,0][i],[1,1,0,0][i]);
 }
 return{position:points,uv,color};
}

function fitPrimitiveGround(geometry,row,pose,x,z,ground,heightAt){
 const points=geometry.position;
 if(row.type==='QuadHorn'&&row.gridSize>1){
  // Move each complete pillar by its own footprint centre. Its tip, base and
  // original emergence animation remain one rigid shape on a sloping floor.
  const delta=finite(heightAt(x+pose.x,z+pose.z),ground)-ground+.04;
  for(let i=1;i<points.length;i+=3)points[i]+=delta;
 }else if(row.type==='CYLINDER'&&row.effectId===17){
  // The expanding ground ring follows the floor across its full footprint.
  for(let i=0;i<points.length;i+=3)points[i+1]+=finite(heightAt(points[i],points[i+2]),ground)-ground+.04;
 }
}

async function loadBrowserPixels(url){const response=await fetch(url);if(!response.ok)throw Error('Native texture '+response.status);const bitmap=await createImageBitmap(await response.blob()),canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(bitmap.width,bitmap.height):Object.assign(document.createElement('canvas'),{width:bitmap.width,height:bitmap.height}),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);const pixels=ctx.getImageData(0,0,bitmap.width,bitmap.height);bitmap.close?.();return pixels;}
export function createRoNativePrimitiveArt({scene,manifest={parts:{}},assets={},requestsForEvent=null,requestsForState=null,loadPixels=loadBrowserPixels}={}){
 const root=new T.Group();root.name='ro-native-declarative-primitives';scene.add(root);const images=new Map(),pending=new Map(),failures=new Map(),pages=[],batches=new Map(),clips=new Map(),decisions=new Map(),requestDecisions=new Map(),frustum=new T.Frustum(),matrix=new T.Matrix4(),sphere=new T.Sphere();let disposed=false,context=null,currentTime=0,last=-Infinity,world='',rendered=0,culled=0,dropped=0;
 const partOf=r=>manifest.parts[r.primitiveId||r.file]||r.part,clipKey=r=>[r.dedupeKey||r.key||r.primitiveId||r.file,r.time,r.sourceIdActor,r.x,r.z].join(':'),eventKey=e=>[e.id,e.time,e.type,e.skillKey].join(':');
 function atlas(){if(pages.length>=B.atlasPages)throw Error('Primitive atlas budget');const data=new Uint8Array(B.atlasSize*B.atlasSize*4),texture=new T.DataTexture(data,B.atlasSize,B.atlasSize,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;const p={index:pages.length,data,texture,x:1,y:1,row:0};pages.push(p);return p;}
 function insert(key,pixels){const {width:w,height:h,data}=pixels;if(w<1||h<1||w+2>B.atlasSize||h+2>B.atlasSize||data.length!==w*h*4)throw Error('Invalid primitive texture');let p=pages.at(-1)||atlas();if(p.x+w+1>B.atlasSize){p.x=1;p.y+=p.row+2;p.row=0;}if(p.y+h+1>B.atlasSize)p=atlas();const x=p.x,y=p.y;for(let row=0;row<h;row++)p.data.set(data.subarray(row*w*4,(row+1)*w*4),((y+row)*B.atlasSize+x)*4);p.x+=w+2;p.row=Math.max(p.row,h);p.texture.needsUpdate=true;const record={page:p.index,x,y,w,h};images.set(key,record);return record;}
 function preload(ids=[]){const names=[...new Set(ids.flatMap(id=>manifest.parts[id]?.textureFiles||[]))];return Promise.all(names.map(name=>{if(images.has(name))return images.get(name);if(pending.has(name))return pending.get(name);if(failures.has(name)||!assets[name]||disposed)return null;const task=loadPixels(assets[name].url).then(p=>disposed?null:insert(name,p),error=>{failures.set(name,String(error.message||error));return null;}).catch(error=>{failures.set(name,String(error.message||error));return null;}).finally(()=>pending.delete(name));pending.set(name,task);return task;}));}
 const isReady=id=>{const part=manifest.parts[id];return !!part&&part.textureFiles.every(name=>images.has(name));};
 function prepare(state,time=state?.time||0){context=state;currentTime=time;const key=[state?.options?.mode,state?.matchId||state?.id,state?.bonk?.map?.seed,state?.bonk?.floor].join(':');if(key!==world||time<last){clips.clear();decisions.clear();requestDecisions.clear();world=key;}last=time;for(const [key,clip]of clips)if(time>=clip.until)clips.delete(key);for(const map of [decisions,requestDecisions])for(const [key,d]of map)if(time-d.time>10&&!clips.has(key))map.delete(key);}
 function reserve(requests){if(!requests.length||requests.some(r=>!isReady(r.primitiveId||r.file)||![r.x,r.z,r.time].every(Number.isFinite))){preload(requests.map(r=>r.primitiveId||r.file));return false;}const fresh=requests.filter(r=>!clips.has(clipKey(r)));if(clips.size+fresh.length>B.clips){dropped++;return false;}for(const r of fresh){const part=partOf(r),copies=clamp(Math.floor(finite(part.duplicate,1)),1,32),duration=Math.max(...Array.from({length:copies},(_,i)=>timeOf(part,clipKey(r)+i)+delayOf(part,i))),naturalEnd=r.time+duration,until=Number.isFinite(r.until)?r.until:Infinity;clips.set(clipKey(r),{r:{...r},part,until:part.repeat||r.loop?(Number.isFinite(r.until)?r.until:naturalEnd):Math.min(until,naturalEnd)});}return true;}
 function handles(event,unit){if(disposed||!event||!requestsForEvent)return false;const key=eventKey(event);if(decisions.has(key))return decisions.get(key).native;const requests=requestsForEvent(event,unit,context)||[],admitted=reserve(requests),native=admitted&&!requests.some(r=>r.preserveAttackTrail);decisions.set(key,{native,time:event.time||currentTime});return native;}
 function handlesRequest(r){const key=clipKey(r);if(requestDecisions.has(key))return requestDecisions.get(key).native;const native=reserve([r]);requestDecisions.set(key,{native,time:r.time});return native;}
 // The original world framebuffer is opaque. Keep its alpha at one on HDR
 // targets too; luminous RGB must not accumulate alpha for later effects.
 function batch(page,destination){const key=page+':'+destination;if(batches.has(key))return batches.get(key);if(batches.size>=B.batches)return null;const dest={1:T.ZeroFactor,2:T.OneFactor,3:T.SrcColorFactor,4:T.OneMinusSrcColorFactor,5:T.DstColorFactor,6:T.OneMinusDstColorFactor,7:T.SrcAlphaFactor,8:T.OneMinusSrcAlphaFactor,9:T.OneFactor,10:T.ZeroFactor,15:T.SrcAlphaSaturateFactor}[destination]??T.OneMinusSrcAlphaFactor,position=new Float32Array(B.vertices*3),uv=new Float32Array(B.vertices*2),rect=new Float32Array(B.vertices*4),color=new Float32Array(B.vertices*4),repeat=new Float32Array(B.vertices),geometry=new T.BufferGeometry();for(const [name,array,size]of [['position',position,3],['uv',uv,2],['nativeRect',rect,4],['nativeColor',color,4],['nativeRepeat',repeat,1]])geometry.setAttribute(name,new T.BufferAttribute(array,size).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);const material=new T.ShaderMaterial({uniforms:{map:{value:pages[page].texture}},vertexShader:'attribute vec4 nativeRect;attribute vec4 nativeColor;attribute float nativeRepeat;varying vec2 vUv;varying vec4 vRect;varying vec4 vColor;varying float vRepeat;void main(){vUv=uv;vRect=nativeRect;vColor=nativeColor;vRepeat=nativeRepeat;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D map;varying vec2 vUv;varying vec4 vRect;varying vec4 vColor;varying float vRepeat;void main(){vec2 local=vec2(vRepeat>.5?fract(vUv.x):clamp(vUv.x,0.,1.),clamp(vUv.y,0.,1.));vec2 tex=vRect.xy+local*vRect.zw;gl_FragColor=texture2D(map,tex)*vColor;if(gl_FragColor.a<.001)discard;\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.SrcAlphaFactor,blendDst:dest,blendEquationAlpha:T.AddEquation,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor}),mesh=new T.Mesh(geometry,material);mesh.name='native-primitives-'+key;mesh.frustumCulled=false;mesh.renderOrder=6;root.add(mesh);const record={position,uv,rect,color,repeat,geometry,material,mesh,count:0};batches.set(key,record);return record;}
 function update(state,time=state?.time||0,heightAt=()=>0,camera=null){if(disposed)return;prepare(state,time);rendered=culled=0;for(const b of batches.values())b.count=0;const units=new Map((state?.units||[]).map(u=>[u.id,u]));for(const e of state?.effects||[])handles(e,units.get(e.source));for(const r of requestsForState?.(state)||state?.nativePrimitiveRequests||[])handlesRequest(r);const cull=!!camera?.projectionMatrix&&!!camera.matrixWorldInverse;if(cull)frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));let particles=0;
  for(const [key,clip]of clips){const {r,part}=clip,source=units.get(r.sourceIdActor),target=units.get(r.targetId),attached=r.attachedEntity?(r.anchor==='target'?target:source):null,x=attached?.x??r.x,z=attached?.z??r.z,y=finite(heightAt(x,z))+(r.height||0),scale=clamp(finite(r.scale,1),.1,4);sphere.center.set(x,y+1,z);sphere.radius=14*scale;if(camera?.position&&Math.hypot(x-camera.position.x,z-camera.position.z)>B.maxDistance||cull&&!frustum.intersectsSphere(sphere)){culled++;continue;}
   const count=clamp(Math.floor(finite(part.duplicate,1)),1,32);for(let i=0;i<count;i++){if(particles++>=B.particles){dropped++;break;}const age=sampleAge(part,time-r.time,key,i,r.loop),pose=roNativePrimitivePose(part,age,{key,duplicate:i,scale,time});if(!pose||pose.alpha<=0)continue;const token=part.textureFiles[Math.min(part.textureFiles.length-1,pose.textureFrame)],image=images.get(token);if(!image)continue;const b=batch(image.page,part.blendMode||0);if(!b)continue;const geometry=roNativePrimitiveTriangles(part,pose,{x,y,z,camera});if(r.conformGround)fitPrimitiveGround(geometry,part,pose,x,z,finite(heightAt(x,z)),heightAt);const vertices=geometry.position.length/3;if(b.count+vertices>B.vertices){dropped++;continue;}const start=b.count;b.position.set(geometry.position,start*3);b.uv.set(geometry.uv,start*2);b.color.set(geometry.color,start*4);b.repeat.fill(part.repeatTextureX>1?1:0,start,start+vertices);for(let v=0;v<vertices;v++)b.rect.set([(image.x+.5)/B.atlasSize,(image.y+.5)/B.atlasSize,(image.w-1)/B.atlasSize,(image.h-1)/B.atlasSize],(start+v)*4);b.count+=vertices;rendered++;}
  }
  for(const b of batches.values()){b.geometry.setDrawRange(0,b.count);if(b.count)for(const attribute of Object.values(b.geometry.attributes))attribute.needsUpdate=true;}
 }
 return{root,prepare,preload,isReady,handles,handlesRequest,update,stats:()=>({clips:clips.size,active:clips.size,particles:rendered,culled,dropped,drawCalls:[...batches.values()].filter(b=>b.count).length,vertices:[...batches.values()].reduce((n,b)=>n+b.count,0),readyParts:Object.keys(manifest.parts).filter(isReady),loading:pending.size,failures:Object.fromEntries(failures),atlasBytes:pages.length*B.atlasSize*B.atlasSize*4,disposed}),reset(){clips.clear();decisions.clear();requestDecisions.clear();for(const b of batches.values()){b.count=0;b.geometry.setDrawRange(0,0);}},dispose(){if(disposed)return;disposed=true;clips.clear();decisions.clear();requestDecisions.clear();for(const b of batches.values()){b.geometry.dispose();b.material.dispose();}for(const p of pages)p.texture.dispose();batches.clear();images.clear();pages.length=0;root.clear();root.removeFromParent();}};
}
