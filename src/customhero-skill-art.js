import {earthImpactPieces} from './element-impact-art.js';
import * as T from 'three';
import {CUSTOMHERO_SKILL_BUDGET as B,customHeroSkillVisual,customHeroSkillEventKey,isCustomHeroSkillMode} from '../shared/customhero-skill-visuals.js';
import {CUSTOMHERO_SKILL_SPRITES} from './customhero-skill-assets.js';

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,f=0)=>Number.isFinite(v)?v:f;
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
// Reserve each complete choreography before suppressing its fallback. The
// renderer never admits a spell whose geometry would disappear at the cap.
const cost={chain:[100,6],stormbolt:[184,16],blizzard:[270,15],heal:[78,8],summon:[768,52],stomp:[600,1],frost:[288,11],fire:[184,24],shockwave:[600,0],force:[152,7],thunder:[444,23],blink:[352,44],shield:[288,13],avatar:[288,13],hook:[266,0],drain:[148,15],cleave:[40,0],howl:[168,0],gravity:[280,46],poison:[144,24],field:[144,18],breath:[224,28],dash:[160,10]};
const gold=[1,.83,.36],white=[.88,.96,1],blue=[.24,.58,1],ice=[.48,.76,1],earth=[.65,.49,.30],fire=[1,.36,.06],purple=[.59,.34,.9];
const vertexShader='attribute vec4 effectColor;varying vec4 vColor;varying vec2 vUv;void main(){vColor=effectColor;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
function batch(maxVertices,textured,texture){
 const geometry=new T.BufferGeometry(),position=new Float32Array(maxVertices*3),color=new Float32Array(maxVertices*4),uv=new Float32Array(maxVertices*2);
 for(const [name,array,size]of [['position',position,3],['effectColor',color,4],['uv',uv,2]])geometry.setAttribute(name,new T.BufferAttribute(array,size).setUsage(T.DynamicDrawUsage));
 geometry.setDrawRange(0,0);
 // Preserve destination alpha in the game's RGBA HalfFloat render target:
 // additive RGB must never accumulate alpha above one for later effects.
 // The RO ingredients include opaque black backgrounds and warm-colored
 // smoke. Our adaptation treats their luminance as a mask, then applies the
 // authored elemental color. Local-cell feathering removes square cards
 // without modifying the originals used by the native Ragnarok renderer.
 const spriteFragment='vec2 voxelUv=(floor(vUv*128.)+.5)/128.;vec4 texel=texture2D(map,voxelUv);float intensity=dot(texel.rgb,vec3(.299,.587,.114));vec2 cellUv=fract(vUv*4.0);float feather=1.0-smoothstep(.30,.49,length(cellUv-.5));vec2 face=fract(vUv*128.);gl_FragColor.rgb*=intensity*(.84+.16*step(face.x,face.y));gl_FragColor.a*=texel.a*smoothstep(.025,.32,intensity)*feather;';
 const material=new T.ShaderMaterial({uniforms:{map:{value:texture}},vertexShader,fragmentShader:'uniform sampler2D map;varying vec4 vColor;varying vec2 vUv;void main(){gl_FragColor=vColor;'+(textured?spriteFragment:'')+'if(gl_FragColor.a<.005)discard;\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.SrcAlphaFactor,blendDst:textured?T.OneFactor:T.OneMinusSrcAlphaFactor,blendEquationAlpha:T.AddEquation,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor});
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=textured?6.3:6.2;let count=0;
 return{mesh,geometry,material,position,color,uv,get count(){return count;},clear(){count=0;},vertex(p,c,a,u=0,v=0){if(count>=maxVertices)return;position.set(p,count*3);color.set([c[0],c[1],c[2],clamp(a,0,1)],count*4);uv.set([u,v],count*2);count++;},finish(){geometry.setDrawRange(0,count);if(count)for(const attribute of Object.values(geometry.attributes))attribute.needsUpdate=true;},dispose(){geometry.dispose();material.dispose();}};
}
async function pixels(url){const r=await fetch(url);if(!r.ok)throw Error('CustomHero texture '+r.status);const bitmap=await createImageBitmap(await r.blob()),canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(128,128):Object.assign(document.createElement('canvas'),{width:128,height:128}),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,1,1,126,126);bitmap.close?.();return ctx.getImageData(0,0,128,128);}

/** Two bounded dynamic batches, no per-cast geometry/material allocation.
 * Every family has a geometric fallback, so late sprites never erase a cast.
 * This module only reads authoritative events and unit state. */
export function createCustomHeroSkillArt({scene,loadPixels=pixels}={}){
 const root=new T.Group();root.name='customhero-reference-skills';scene.add(root);
 const atlasData=new Uint8Array(B.atlasSize*B.atlasSize*4),atlas=new T.DataTexture(atlasData,B.atlasSize,B.atlasSize,T.RGBAFormat);atlas.colorSpace=T.SRGBColorSpace;atlas.flipY=false;atlas.magFilter=atlas.minFilter=T.LinearFilter;atlas.generateMipmaps=false;
 const sprites=batch(B.quads*6,true,atlas),solid=batch(B.triangles*3,false,null);root.add(solid.mesh,sprites.mesh);
 const active=new Map(),decisions=new Map(),ready=new Map(),failures={},units=new Map(),right=new T.Vector3(1,0,0),up=new T.Vector3(0,1,0);let context=null,current=0,world='',last=-Infinity,disposed=false,warmed=false,culled=0,dropped=0;
 async function preload(){if(warmed||disposed)return;warmed=true;const entries=Object.entries(CUSTOMHERO_SKILL_SPRITES);let next=0;await Promise.all(Array.from({length:B.loadConcurrency},async()=>{while(next<entries.length&&!disposed){const index=next++,[name,url]=entries[index];try{const p=await loadPixels(url);if(disposed)return;if(p.width!==128||p.height!==128||p.data.length!==128*128*4)throw Error('Invalid sprite pixels');const x=index%4*128,y=Math.floor(index/4)*128;for(let j=0;j<128;j++)atlasData.set(p.data.subarray(j*128*4,(j+1)*128*4),((y+j)*B.atlasSize+x)*4);ready.set(name,index);atlas.needsUpdate=true;}catch(e){failures[name]=String(e.message||e);}}}));}
 function reset(){active.clear();decisions.clear();world='';last=-Infinity;solid.clear();sprites.clear();solid.finish();sprites.finish();}
 function prepare(state,time=state?.time||0){if(disposed)return;context=state;current=finite(time);const key=[state?.options?.mode,state?.matchId??state?.id??'',state?.seed??'',state?.dungeon?.floor??''].join(':');if(key!==world||current<last){reset();world=key;}last=current;root.visible=isCustomHeroSkillMode(state);if(root.visible)void preload();for(const [key,clip]of active)if(current>=clip.event.time+clip.visual.duration)active.delete(key);while(decisions.size>B.history)decisions.delete(decisions.keys().next().value);}
 function handles(event){if(disposed)return false;const key=customHeroSkillEventKey(event);if(decisions.has(key))return decisions.get(key);const visual=customHeroSkillVisual(event,context);if(!visual||!Number.isFinite(event.x)||!Number.isFinite(event.z)||!Number.isFinite(event.time))return false;if(current>=event.time+visual.duration)return false;const budget=cost[visual.family]||[640,64],used=[...active.values()].reduce((n,c)=>[n[0]+c.budget[0],n[1]+c.budget[1]],[0,0]);if(active.size>=B.effects||used[0]+budget[0]>B.triangles||used[1]+budget[1]>B.quads){dropped++;decisions.set(key,false);return false;}active.set(key,{event:{...event},visual,budget});decisions.set(key,true);return true;}
 const tri=(a,b,c,color,alpha=1)=>{if(solid.count+3>B.triangles*3)return;solid.vertex(a,color,alpha);solid.vertex(b,color,alpha);solid.vertex(c,color,alpha);};
 const quad=(a,b,c,d,color,alpha=1)=>{tri(a,b,c,color,alpha);tri(a,c,d,color,alpha);};
 function ribbon(a,b,width,color,alpha=1){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],v=new T.Vector3(dx,dy,dz).cross(up);if(v.lengthSq()<.0001)v.copy(right);v.normalize().multiplyScalar(width*.5);quad([a[0]+v.x,a[1]+v.y,a[2]+v.z],[a[0]-v.x,a[1]-v.y,a[2]-v.z],[b[0]-v.x,b[1]-v.y,b[2]-v.z],[b[0]+v.x,b[1]+v.y,b[2]+v.z],color,alpha);}
 function sprite(name,p,w,h,color,alpha=1,angle=0,ground=false){const index=ready.get(name);if(index==null||sprites.count+6>B.quads*6)return;const rx=ground?[1,0,0]:right.toArray(),uy=ground?[0,0,1]:up.toArray(),c=Math.cos(angle),s=Math.sin(angle),points=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>{const dx=x*w*c-y*h*s,dy=x*w*s+y*h*c;return p.map((v,j)=>v+rx[j]*dx+uy[j]*dy);}),u=index%4/4,v=Math.floor(index/4)/4,uv=[[u+.002,v+.002],[u+.248,v+.002],[u+.248,v+.248],[u+.002,v+.248]];for(const j of [0,1,2,0,2,3])sprites.vertex(points[j],color,alpha,uv[j][0],uv[j][1]);}
 function ring(x,y,z,r,width,color,alpha=1,start=0,arc=TAU,segments=32){for(let i=0;i<segments;i++){const a=start+i/segments*arc,b=start+(i+1)/segments*arc;quad([x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(a)*(r-width),y,z+Math.cos(a)*(r-width)],[x+Math.sin(b)*(r-width),y,z+Math.cos(b)*(r-width)],[x+Math.sin(b)*r,y,z+Math.cos(b)*r],color,alpha);}}
 function crystal(x,y,z,w,h,color,alpha=1,lean=0){const tip=[x+lean,y+h,z],bottom=[x,y-h*.18,z],p=[[x-w,y,z],[x,y,z-w],[x+w,y,z],[x,y,z+w]];for(let i=0;i<4;i++){tri(p[i],p[(i+1)%4],tip,color.map(v=>v*(.7+i*.1)),alpha);tri(p[(i+1)%4],p[i],bottom,color,alpha);}}
 function box(x,y,z,w,h,d,color,alpha=1,angle=0){const c=Math.cos(angle),s=Math.sin(angle),p=[];for(const [px,py,pz]of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]])p.push([x+(px*w*c-py*h*s)*.5,y+(px*w*s+py*h*c)*.5,z+pz*d*.5]);for(const [a,b,c,d]of [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])quad(p[a],p[b],p[c],p[d],color,alpha);}
 function earthComposition(event,time,heightAt){const pieces=earthImpactPieces({...event,key:'hero-earth:'+event.id,duration:.85},time,heightAt);for(const p of pieces.rocks){const tint=new T.Color(p.color).toArray();crystal(p.x,p.y,p.z,p.sx,p.sy,tint,p.opacity,p.sx*.25);}for(const p of pieces.fractures){const dx=Math.sin(p.angle)*p.length*.5,dz=Math.cos(p.angle)*p.length*.5,sx=Math.cos(p.angle)*p.width*.5,sz=-Math.sin(p.angle)*p.width*.5;quad([p.x-dx-sx,p.y,p.z-dz-sz],[p.x-dx+sx,p.y,p.z-dz+sz],[p.x+dx+sx,p.y,p.z+dz+sz],[p.x+dx-sx,p.y,p.z+dz-sz],[.10,.15,.12],p.opacity);}}
 function anchor(id,x,z,heightAt,actors){const u=units.get(id),a=actors?.get?.(id),px=a?.root?.position.x??u?.x??x,pz=a?.root?.position.z??u?.z??z,ground=finite(heightAt(px,pz)),size=clamp(finite(u?.size,1),.3,3),y=a?.root?finite(a.root.position.y)+finite(a.eyeLine,a.modelHeight*.62||1.3)*finite(a.root.scale?.y,1):ground+1.2*size+(u?.flying?finite(u.altitude,1.5):0);return{x:px,z:pz,y,ground,size};}
 function burst(x,y,z,t,color,fade,count=16,radius=1){for(let i=0;i<count;i++){const a=i*2.39996,r=radius*(.15+t)*(.4+noise(i)*.6),py=y+Math.max(0,Math.sin(t*Math.PI)*(.3+noise(i+9)*1.6));crystal(x+Math.sin(a)*r,py,z+Math.cos(a)*r,.035,.1,color,fade);sprite('spark',[x+Math.sin(a)*r,py,z+Math.cos(a)*r],.25,.25,color,fade*.65);}}
 function lightning(from,to,seed,t,fade,width=.09){const count=14,points=[];for(let i=0;i<=count;i++){const f=i/count,p=mix(from,to,f),j=i===0||i===count?0:(noise(seed+i+Math.floor(t*18)*3)-.5)*.55;points.push([p[0]+j,p[1]+j*.6,p[2]-j*.4]);}for(let i=0;i<count;i++){ribbon(points[i],points[i+1],width*3,blue,fade*.24);ribbon(points[i],points[i+1],width,white,fade);if(i===5||i===9){const end=points[i].map((v,j)=>v+(noise(seed+i+j)-.5)*.7);ribbon(points[i],end,width*.45,ice,fade*.65);}}}
 function render(clip,time,heightAt,actors){
  const {event:e,visual:v}=clip,age=time-e.time;if(age<0)return;const t=Math.floor(age*B.animationHz)/B.animationHz,life=clamp(age/v.duration,0,1),fade=clamp((v.duration-age)*4,0,1),x=e.x,z=e.z,g=finite(heightAt(x,z)),radius=clamp(finite(e.radius,3),.3,10),source=anchor(e.source??e.owner,x,z,heightAt,actors),target=anchor(e.target,finite(e.tx,x),finite(e.tz,z),heightAt,actors),from=[x,source.y,z],to=[finite(e.tx,target.x),target.y,finite(e.tz,target.z)],seed=finite(Number(e.id),x*17+z*13);
  if(v.family==='chain'){
   const delay=Math.min(.18,finite(e.hop)*.025);if(age<delay)return;const pulse=fade*(.7+.3*Math.sin(age*53));lightning(from,to,seed,t,pulse);sprite('lightning',to,.85,.85,ice,pulse*.8);burst(to[0],to[1],to[2],life,white,pulse,5,.35);
  }else if(v.family==='stormbolt'){
   const travel=.22,flight=clamp(age/travel,0,1),p=mix(from,to,flight),spin=t*25;
   if(age<travel){box(p[0],p[1],p[2],.65,.34,.32,white,1,spin);box(p[0]+.32*Math.sin(spin),p[1]-.32*Math.cos(spin),p[2],.12,.62,.13,gold,1,spin);for(let j=1;j<8;j++){const q=mix(from,to,Math.max(0,flight-j*.035));sprite('glow',q,.48-j*.04,.48-j*.04,blue,(1-j/8)*.6);}lightning([p[0]-.3,p[1]-.3,p[2]],[p[0]+.3,p[1]+.3,p[2]],seed,t,.7,.03);}
   else{const hit=(age-travel)/(v.duration-travel);burst(to[0],to[1],to[2],hit,gold,fade,15,1);sprite('lightning',to,1.8*(1-hit)+.1,1.8*(1-hit)+.1,white,fade);ring(to[0],target.ground+.08,to[2],.4+hit, .08,gold,fade*.7);}
  }else if(v.family==='blizzard'){
   const currentEvent=(context.effects||[]).find(event=>customHeroSkillEventKey(event)===customHeroSkillEventKey(e));const owner=units.get(e.owner??e.source);if(currentEvent?.pulses<=0||owner&&(!owner.alive||owner.channel!=='blizzard'))return;
   // Original Blizzard sends long blue/violet icicles down in separate waves.
   const wave=t%1;for(let i=0;i<15;i++){const phase=(wave+i*.051)%1,a=i*2.39996+Math.floor(t)*.67,r=Math.sqrt(noise(i+Math.floor(t)*23))*radius*.9,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r,py=g+1.25+(1-phase)*6.8;crystal(px,py,pz,.12+noise(i)*.08,-1.2, i%3===0?purple:ice,phase>.12?fade:phase/.12, -.12);ribbon([px+.12,py+1.8,pz],[px,py,pz],.07,blue,.3*fade);if(phase>.82){sprite('ice',[px,g+.18,pz],.8,.8,ice,(1-phase)*4);crystal(px,g+.04,pz,.15,.35,white,(1-phase)*4);}}
  }else if(v.family==='heal'){
   const h=Math.sin(life*Math.PI)*3.5,at=e.target!=null?target:source,px=e.source==null&&e.target==null?x:at.x,pz=e.source==null&&e.target==null?z:at.z,base=e.source==null&&e.target==null?g:at.ground;
   for(let i=0;i<7;i++){const a=i/7*TAU,r=.3+life*.36,xx=px+Math.sin(a)*r,zz=pz+Math.cos(a)*r;ribbon([xx,base+.1,zz],[xx,base+h+.3,zz],i%2?.045:.09,i%2?white:gold,fade*(1-life)*.8);sprite('spark',[xx,base+.4+life*2.2+(i%3)*.2,zz],.48,.48,gold,fade);}
   ring(px,base+.06,pz,.65+life*.3,.035,gold,fade*.55);sprite('glow',[px,base+1,pz],1.8,2.8,gold,(1-life)*.5);
  }else if(v.family==='summon'){
   const wolves=(v.skill||'summon')==='summon',children=(context.units||[]).filter(u=>u.summon&&u.summoner===e.source&&(!e.skill||u.summonSkill===e.skill)).slice(0,wolves?2:4),points=children.length?children.map(u=>[u.x,u.z]):[[x-1,z+1],[x+1,z+1]];
   for(const [j,[px,pz]]of points.entries()){const base=finite(heightAt(px,pz)),r=.45+life*.15;
    // A low blue mist surrounds the paws; it never hides the animal in a
    // full-height smoke helix. Preserve the recognizable wolf until the end
    // of the birth, including the important 0.7s handover to the live summon.
    for(let i=0;i<6;i++){const a=i/6*TAU+t*1.3+j,py=base+.10+(i%2)*.12,xx=px+Math.sin(a)*r,zz=pz+Math.cos(a)*r;sprite('smoke',[xx,py,zz],.55,.4,blue,fade*.18);crystal(xx,py+.05,zz,.018,.09,ice,fade*.5);}sprite('glow',[px,base+.3,pz],1.35,.65,blue,fade*.18);
    if(wolves){const a=fade*.68,coat=[.14,.40,.95],light=[.34,.64,1],lift=Math.sin(Math.min(1,life*2)*Math.PI)*.025;
     box(px,base+.64+lift,pz,1.08,.42,.42,coat,a); // long canine torso
     box(px+.35,base+.76+lift,pz,.35,.48,.44,light,a); // raised shoulders
     box(px+.53,base+1.00+lift,pz,.38,.38,.35,light,a); // alert head
     box(px+.79,base+.91+lift,pz,.38,.18,.25,coat,a); // projecting muzzle
     box(px+.96,base+.95+lift,pz,.08,.10,.23,light,a); // nose
     for(const dz of [-.12,.12])crystal(px+.49,base+1.16+lift,pz+dz,.072,.27,coat,a); // pointed ears
     box(px-.73,base+.74+lift,pz,.62,.14,.16,light,a,-.45); // long swept tail
     for(const dx of [-.35,.35])for(const dz of [-.15,.15]){box(px+dx,base+.28,pz+dz,.12,.53,.13,coat,a);box(px+dx+.06,base+.055,pz+dz,.25,.10,.17,light,a);} // four legs + paws
     for(const dz of [-.184,.184])box(px+.62,base+1.06+lift,pz+dz,.065,.045,.025,white,fade*.95); // icy eyes
    }
   }
  }else if(v.family==='stomp'){
   const r=radius*Math.min(1,life*1.7);ring(x,g+.075,z,r,.09*(1-life)+.025,gold,fade*.65);earthComposition(e,time,heightAt);
  }else if(v.family==='frost'){
   for(let i=0;i<28;i++){const a=i/28*TAU,r=radius*Math.min(1,life*2)*(.75+noise(i)*.23),px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;crystal(px,g+.07,pz,.10,.3+Math.sin(life*Math.PI)*(.5+noise(i)*.8),i%3?ice:purple,fade,Math.sin(a)*.2);if(i%3===0)sprite('ice',[px,g+.3,pz],.7,.7,white,fade*.5);}
   sprite('snow',[x,g+.25,z],radius*1.5,radius*.6,ice,fade*.45);ring(x,g+.06,z,radius*Math.min(1,life*2),.045,ice,fade*.6);
  }else if(v.family==='fire'){
   sprite('blast',[x,g+.7+life*.3,z],radius*(.7+life),radius*(.7+life),white,fade*(1-life));for(let i=0;i<23;i++){const a=i*2.39996,r=radius*Math.sqrt(noise(i+7))*life,py=g+.15+Math.sin(life*Math.PI)*(noise(i)*2+.4),px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;sprite(i%3?'flame':'smoke',[px,py,pz],.7-life*.3,1.2-life*.6,i%3?fire:earth,fade*(i%3?.65:.25),a*.2);crystal(px,py,pz,.045,.16,gold,fade);}
  }else if(v.family==='shockwave'||v.family==='force'){
   const dx=finite(e.tx,x)-x,dz=finite(e.tz,z+1)-z,len=Math.hypot(dx,dz)||1,nx=dx/len,nz=dz/len,d=life*12,px=x+nx*d,pz=z+nz*d,angle=Math.atan2(nx,nz);if(v.family==='shockwave')earthComposition({...e,x:px,z:pz,radius:Math.min(2,radius)},time,heightAt);else for(let i=0;i<14;i++){const side=(i/13-.5)*radius*2,xx=px+nz*side,zz=pz-nx*side,yy=finite(heightAt(xx,zz));crystal(xx,yy+.12,zz,.10,.3+Math.sin(i/13*Math.PI)*.5,ice,fade);}ring(px,finite(heightAt(px,pz))+.1,pz,radius,.10,v.family==='force'?ice:gold,fade,angle-Math.PI*.5,Math.PI,20);
  }else if(v.family==='thunder'){
   for(let i=0;i<5;i++){const a=i/5*TAU,r=i?radius*.7:0,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;lightning([px,g+4.5,pz],[px,g+.1,pz],seed+i,t,fade*(1-life),.075);sprite('lightning',[px,g+.3,pz],1.1,1.1,white,fade*.7);}burst(x,g+.1,z,life,gold,fade,18,radius);
  }else if(v.family==='blink'){
   const points=[[x,z],...(Number.isFinite(e.tx)&&Number.isFinite(e.tz)?[[e.tx,e.tz]]:[])];for(const [j,[px,pz]]of points.entries())for(let i=0;i<22;i++){const a=i*2.39996+t*8,r=(j?1-life:life)*.8+.15,yy=finite(heightAt(px,pz))+.1+(i%7)/7*2.2;sprite('spark',[px+Math.sin(a)*r,yy,pz+Math.cos(a)*r],.3,.55,ice,fade*.8);crystal(px+Math.sin(a)*r,yy,pz+Math.cos(a)*r,.02,.16,white,fade);}
  }else if(v.family==='shield'||v.family==='avatar'){
   const at=source,r=at.size*(v.family==='avatar'?1.2:.9),col=v.family==='avatar'?gold:ice;for(let row=0;row<3;row++)for(let i=0;i<12;i++){const a=i/12*TAU+t*.45,xx=at.x+Math.sin(a)*r,zz=at.z+Math.cos(a)*r,yy=at.ground+.3+row*.6;crystal(xx,yy,zz,.1,.2,col,fade*.45);if(i%3===0)sprite('spark',[xx,yy+.3,zz],.38,.65,col,fade*.55);}sprite('glow',[at.x,at.y,at.z],r*2.4,r*3,col,fade*.16);
  }else if(v.family==='breath'){
   const angle=Number.isFinite(e.tx)&&Number.isFinite(e.tz)?Math.atan2(e.tx-x,e.tz-z):finite(units.get(e.source)?.facing);for(let i=0;i<28;i++){const f=(i/28+life*.8)%1,a=angle+(noise(i)-.5)*.9*f,r=radius*f,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r,py=g+.7+f*.4;sprite('flame',[px,py,pz],.3+f*.8,.5+f*.9,i%3?fire:gold,fade*.6,a);crystal(px,py,pz,.025,.12,gold,fade);}
  }else if(v.family==='poison'||v.family==='field'){
   const cold=e.element==='ice',col=v.family==='poison'?[.48,.73,.22]:cold?ice:fire;for(let i=0;i<18;i++){const a=i*2.39996+t*.2,r=Math.sqrt(noise(i+seed))*radius*.9,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r,phase=(t*.6+noise(i))%1,py=g+.12+phase*(v.family==='poison'?.8:.6);if(v.family==='poison')sprite('smoke',[px,py,pz],1.1+phase*.6,.8+phase*.6,col,fade*.25);else sprite(cold?'snow':'flame',[px,py,pz],.45,.7,col,fade*.45);crystal(px,py,pz,.02,cold?.15:.07,col,fade*.55);}if(v.family==='poison')for(let i=0;i<6;i++){const a=i*2.4+t*.5,r=radius*.65;sprite('glow',[x+Math.sin(a)*r,g+.15,z+Math.cos(a)*r],.8,.6,col,fade*.25);}
  }else if(v.family==='dash'){
   const angle=finite(units.get(e.source)?.facing),nx=Math.sin(angle),nz=Math.cos(angle);for(let i=0;i<20;i++){const f=i/20,side=(noise(i)-.5)*1.4,px=x-nx*f*(1-life)*2+nz*side,pz=z-nz*f*(1-life)*2-nx*side;crystal(px,g+.3+(i%3)*.16,pz,.035,.25,white,fade*(1-f));if(i%2===0)sprite('smoke',[px,g+.15,pz],.45,.35,ice,fade*.25);}
  }else if(v.family==='gravity'){
   for(let strand=0;strand<5;strand++){let previous=null;for(let i=0;i<13;i++){const f=i/12,a=strand/5*TAU+f*TAU-t*2,r=radius*(1-f)*(.85+.15*Math.sin(t*3)),p=[x+Math.sin(a)*r,g+.12+Math.sin(f*Math.PI)*.3,z+Math.cos(a)*r];if(previous)ribbon(previous,p,.035+f*.045,purple,fade*.65);previous=p;if(i%3===0)sprite('glow',p,.2+f*.2,.2+f*.2,ice,fade*.45);}}burst(x,g+.1,z,(t*.4)%1,purple,fade,20,radius*.3);sprite('glow',[x,g+.1,z],.6,.8,purple,fade*.6);
  }else if(v.family==='hook'||v.family==='drain'){
   if(v.family==='hook'){for(let i=0;i<19;i++){const p=mix(from,to,i/18);ring(p[0],p[1],p[2],.11,.04,gold,fade,0,TAU,7);}}
   else{for(let i=0;i<15;i++){const f=(life*1.9+i/15)%1,p=mix(to,from,f),a=i*2.4+t*8;p[1]+=Math.sin(f*Math.PI)*.35;crystal(p[0],p[1],p[2],.035,.12,[.5,1,.48],fade);sprite('glow',p,.28,.28,[.4,1,.45],fade*.6);if(i<14)ribbon(mix(to,from,i/15),mix(to,from,(i+1)/15),.03,purple,fade*.4);}}
  }else if(v.family==='cleave'){
   const angle=Math.atan2(finite(e.tx,x)-x,finite(e.tz,z+1)-z);ring(x,g+.8,z,1.1+life*.8,.12*(1-life),gold,fade,angle-1+life,2.2,20);
  }else if(v.family==='howl'){
   for(let j=0;j<3;j++)ring(x,g+.12+j*.35,z,Math.max(.05,radius*((life+j*.2)%1)),.05,purple,fade*(1-life),0,TAU,28);
  }
 }
 function update(state,time=state?.time||0,heightAt=()=>0,camera=null,actors=null){if(disposed)return;prepare(state,time);solid.clear();sprites.clear();culled=0;if(!root.visible){solid.finish();sprites.finish();return;}units.clear();for(const u of state?.units||[])units.set(u.id,u);if(camera?.matrixWorld){right.setFromMatrixColumn(camera.matrixWorld,0).normalize();up.setFromMatrixColumn(camera.matrixWorld,1).normalize();}for(const e of state?.effects||[])handles(e);for(const clip of active.values()){if(camera?.position&&Math.hypot(clip.event.x-camera.position.x,clip.event.z-camera.position.z)>B.maxDistance){culled++;continue;}render(clip,time,heightAt,actors);}solid.finish();sprites.finish();}
 const api={root,prepare,handles,update,preload,reset,legacyState(state){if(!isCustomHeroSkillMode(state))return state;const effects=(state.effects||[]).filter(e=>!api.handles(e));return effects.length===(state.effects||[]).length?state:{...state,effects};},stats:()=>({effects:active.size,triangles:solid.count/3,quads:sprites.count/6,drawCalls:Number(solid.count>0)+Number(sprites.count>0),readySprites:[...ready.keys()],failures:{...failures},atlasBytes:atlasData.length,culled,dropped,disposed}),dispose(){if(disposed)return;disposed=true;reset();atlas.dispose();solid.dispose();sprites.dispose();root.clear();root.removeFromParent();}};return api;
}
