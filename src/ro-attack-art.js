import * as T from 'three';
import {RO_ATTACK_FAMILIES,RO_ATTACK_BUDGET,RO_ATTACK_SKILLS,roAttackProfile} from '../shared/ro-attack-catalog.js';
export {RO_ATTACK_BUDGET};
const atlases=new Map(),N=RO_ATTACK_BUDGET.frameSize,F=RO_ATTACK_BUDGET.frames,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const segment=(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-dx*t,y-ay-dy*t);};
const gray=(v,alpha)=>[v,v,v,clamp(Math.round(alpha),0,255)];
const variants=Object.freeze({blade:Object.freeze(['standard','overhead']),dagger:Object.freeze(['standard','daggerStreaks']),cast:Object.freeze(['standard','fireorb','icecrystal','lightning','holy','earth','poison','dark','heal','shield','rune','runezone','summon','firefield','icefield'])});
// Tiny software rasterizer: every family has twelve pre-baked nearest-filtered
// frames. Data is read-only by convention; descriptors and frame bounds freeze.
export function roAttackFrames(value='blade'){
 const requested=typeof value==='string'?RO_ATTACK_FAMILIES.includes(value)?{family:value}:RO_ATTACK_SKILLS[value]?roAttackProfile({skillKey:value}):null:value,family=requested?.family;if(!RO_ATTACK_FAMILIES.includes(family))return null;const motion=(variants[family]||[]).includes(requested?.motion)?requested.motion:'standard',cacheKey=family+':'+motion;if(atlases.has(cacheKey))return atlases.get(cacheKey);
 const data=new Uint8Array(N*N*F*4),bounds=[];
 for(let frame=0;frame<F;frame++){const p=frame/(F-1),sweep=clamp(p/.42,0,1),fade=frame===F-1?0:p<.46?1:Math.pow(clamp((1-p)/.54,0,1),1.15),strength=frame===0?.7:1;let minX=N,minY=N,maxX=-1,maxY=-1,count=0;
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
   const sx=(x+.5)/N*2-1,z=(y+.5)/N,r=Math.hypot(sx,z),angle=Math.atan2(sx,z);let pixel=null;
   const ink=(value,alpha=255)=>gray(value,alpha*fade*strength),merge=value=>{if(value&&(!pixel||value[3]>=pixel[3]))pixel=value;};
   // The head sweeps quickly; the already drawn crescent lingers and erases
   // from its tail instead of blinking off. The entire sprite stays in front.
   const arc=(phase=sweep,offset=0,wide=1,mirror=false)=>{const a=mirror?-angle:angle,center=-.65+phase*1.3,tail=center-a,rr=.76+.065*Math.sin(phase*Math.PI)+offset,thick=.083*wide,erase=Math.max(0,p-.63)*1.5;if(Math.abs(a)>.75||r>.98||Math.abs(sx)>z||tail<-.06||tail>Math.min(1.3,.2+phase*1.3)-erase)return null;const dist=Math.abs(r-rr),trail=.7+.3*(1-clamp(tail/1.4,0,1));if(dist<thick*.62)return ink(250,235*trail);if(dist<thick)return ink(185,225*trail);if(dist<thick+.028)return ink(43,195*trail);return null;};
   const weapon=(phase=sweep,offset=0,mirror=false,heavy=false)=>{const a=(-.65+phase*1.3)*(mirror?-1:1),cs=Math.cos(a),sn=Math.sin(a),along=sx*sn+z*cs,cross=sx*cs-z*sn,rad=.78+offset,blade=Math.abs(cross),guard=Math.abs(along-(rad-.35));if(Math.abs(sx)>z||r>.98)return null;if(heavy){if(Math.abs(along-rad)<.095&&blade<.145)return ink(blade>.115||Math.abs(along-rad)>.066?42:blade<.032?252:181);if(blade<.024&&along>rad-.42&&along<rad)return ink(231);}else{if(along>rad-.29&&along<rad+.13&&blade<(.036+(rad+.13-along)*.015)){return ink(blade>.024?44:cross<0?252:183);}if(guard<.025&&blade<.13)return ink(blade>.10?46:215);if(along>rad-.43&&along<rad-.33&&blade<.025)return ink(140);}return null;};
   if(family==='cast'&&motion!=='standard'){
    const cx=0,cy=.50,yy=z-cy,rr=Math.hypot(sx,yy*2),phase=frame*.51;
    const dot=(xx,zz,size,value=242,alpha=235)=>{if(Math.hypot(sx-xx,(z-zz)*1.7)<size)merge(ink(value,alpha));};
    const line=(ax,ay,bx,by,width=.025,value=242,alpha=235)=>{if(segment(sx,z,ax,ay,bx,by)<width)merge(ink(value,alpha));};
    const ring=(radius=.64,width=.035,value=232,alpha=220)=>{if(Math.abs(rr-radius)<width)merge(ink(value,alpha));};
    if(motion==='fireorb'){
     const wobble=Math.sin(phase)*.018,ball=Math.hypot(sx-wobble,(z-.56)*1.8),radius=.32+Math.sin(phase)*.018;
     if(ball<radius+.035)pixel=ink(ball>radius?56:ball>radius*.73?164:ball>radius*.38?225:255,ball>radius?160:250);
     for(let j=0;j<4;j++){const side=(j-1.5)*.135,base=.40-(j%2)*.03,tail=.13+Math.sin(phase+j)*.025;line(side*.6,base,side+Math.sin(phase+j)*.035,tail,.027,150+j*22,190);}
     for(let j=0;j<4;j++)dot(Math.sin(j*2.4+phase)*.42,.35+(j%3)*.14,.026,238,150);
    }else if(motion==='icecrystal'){
     const gem=Math.abs(sx)*1.1+Math.abs(yy)*2.2;
     if(gem<.60)pixel=ink(gem>.53?55:sx<-.06?193:sx>.06?232:255,245);
     for(let j=0;j<6;j++){const a=j*Math.PI/3+phase*.07;line(Math.sin(a)*.45,.5+Math.cos(a)*.21,Math.sin(a)*.70,.5+Math.cos(a)*.32,.018,224,190);}
     line(-.08,.29,-.08,.68,.014,255,245);
    }else if(motion==='lightning'){
     const xs=[.16,-.12,.10,-.18,.13],zs=[.88,.68,.52,.36,.12];for(let j=0;j<4;j++){line(xs[j],zs[j],xs[j+1],zs[j+1],.048,100,165);line(xs[j],zs[j],xs[j+1],zs[j+1],.018,255,250);}
     line(-.06,.52,-.45,.45,.018,233,185);line(-.45,.45,-.33,.32,.015,228,160);
    }else if(motion==='heal'){
     for(let j=0;j<3;j++){const x=(j-1)*.33,y=.19+((p*.53+j*.23)% .65),size=.075+(j===1?.025:0);line(x-size,y,x+size,y,.018,242,235);line(x,y-size*.55,x,y+size*.55,.025,255,245);}
     ring(.53,.022,168,130);for(let j=0;j<4;j++)dot(Math.sin(j*2+phase)*.5,.2+j*.17,.022,255,150);
    }else if(motion==='shield'){
     const shield=Math.abs(sx)+Math.max(0,.47-z)*1.6,inside=z>.22&&z<.80&&Math.abs(sx)<.42&&shield<.65;
     if(inside){const rim=Math.abs(sx)>.36||z>.75||shield>.57;pixel=ink(rim?249:172,rim?235:45);}
     line(-.18,.52,.18,.52,.025,255,245);line(0,.39,0,.68,.025,255,245);ring(.77,.018,217,150);
    }else if(motion==='holy'){
     line(-.24,.53,.24,.53,.034,249,245);line(0,.23,0,.82,.031,255,250);ring(.64,.03,231,200);for(let j=0;j<4;j++)dot(Math.sin(j*Math.PI/2)*.78,.5+Math.cos(j*Math.PI/2)*.35,.04,238,210);
    }else if(motion==='earth'){
     for(let j=0;j<4;j++){const x=(j-1.5)*.27,y=.40+(j%2)*.12,shape=Math.abs(sx-x)*1.3+Math.abs(z-y)*2.5;if(shape<.20)merge(ink(shape>.16?64:x<0?174:230,245));}
     for(let j=0;j<5;j++)dot((j-2)*.19,.22+(j%2)*.06,.045,198,190);
    }else if(motion==='poison'){
     for(let j=0;j<5;j++){const x=Math.sin(j*2.4+phase*.18)*.34,y=.28+(j%3)*.17+p*.04,radius=.12+(j%2)*.025,d=Math.hypot(sx-x,(z-y)*1.8);if(d<radius)merge(ink(d>radius*.72?91:229,d>radius*.72?190:120));dot(x-.035,y+.025,.022,255,220);}
     line(-.29,.29,-.29,.12,.021,175,170);
    }else if(motion==='dark'){
     const outer=Math.hypot(sx+.08,(z-.51)*1.8),cut=Math.hypot(sx-.12,(z-.60)*1.8);if(outer<.55&&outer>.43&&cut>.45)pixel=ink(outer>.51?241:146,230);
     for(let j=0;j<5;j++){const a=j*1.26+phase*.06;line(Math.sin(a)*.58,.5+Math.cos(a)*.27,Math.sin(a)*.78,.5+Math.cos(a)*.36,.022,222,205);}
    }else if(motion==='summon'){
     ring(.67,.033,218,215);for(let j=0;j<3;j++){const x=(j-1)*.25;dot(x,.52+(j%2)*.12,.085,246,230);line(x,.43,x,.32,.035,178,200);}for(let j=0;j<5;j++)dot(Math.sin(j*1.256)*.68,.5+Math.cos(j*1.256)*.30,.045,253,230);
    }else if(motion==='firefield'){
     ring(.76,.04,164,145);for(let j=0;j<7;j++){const x=(j-3)*.19,y=.32+Math.sin(j*2.4)*.08,head=y+.17+Math.sin(phase+j)*.04;line(x,y,x+.035*Math.sin(phase+j),head,.028,198,230);line(x,y+.03,x,head-.04,.012,253,250);}
    }else if(motion==='icefield'){
     ring(.75,.027,211,180);for(let j=0;j<8;j++){const a=j*Math.PI/4,x=Math.sin(a)*.52,y=.5+Math.cos(a)*.22;line(x,y,x*.82,y+.13,.025,233,230);dot(x,y,.038,255,230);}
    }else{
     ring(.68,.025,216,185);ring(.49,.016,166,140);for(let j=0;j<6;j++){const a=j*Math.PI/3+phase*.06,x=Math.sin(a)*.67,y=.5+Math.cos(a)*.31;line(x,y,x*.80,.5+(y-.5)*.8,.022,244,220);if(motion==='runezone')line(Math.sin(a)*.43,.5+Math.cos(a)*.21,Math.sin(a+Math.PI*2/3)*.43,.5+Math.cos(a+Math.PI*2/3)*.21,.014,225,140);}
    }
   }
   else if(motion==='overhead'){
    // A narrow vertical stroke, lifted over the shoulder then pulled down.
    // The trailing light is a blade-sized afterimage, never a floor-sized fan.
    const progress=clamp((p-.25)/.43,0,1),head=.90-progress*.72,tail=Math.min(.94,head+.27),path=yy=>-.20+(.90-yy)*.46,dist=Math.abs(sx-path(z));
    if(z>head-.025&&z<tail){if(dist<.025)pixel=ink(242,210);else if(dist<.05)pixel=ink(171,145);else if(dist<.09)pixel=ink(207,35*(1-(dist-.05)/.04));}
    const bladeTop=Math.min(.96,head+.30);if(z>head&&z<bladeTop&&dist<.022)merge(ink(sx<path(z)?248:161,230));
   }
   else if(motion==='daggerStreaks'){
    // Two short, separate dagger glints. Their staggered heads suggest the two
    // hands without drawing literal giant daggers over the character.
    for(let hand=0;hand<2;hand++){const progress=clamp((p-(hand?.10:0))/.61,0,1),head=.34+progress*.46,tail=head-.23,side=hand?1:-1,path=yy=>side*(.23+(yy-.5)*.12),dist=Math.abs(sx-path(z));if(z>tail&&z<head){const edge=Math.min(1,(z-tail)/.06,(head-z)/.035);if(dist<.025)merge(ink(244,245*edge));else if(dist<.052)merge(ink(157,225*edge));else if(dist<.078)merge(ink(74,205*edge));else if(dist<.10)merge(ink(220,35*edge*(1-(dist-.078)/.022)));}}
   }
   else if(family==='blade'){pixel=arc();merge(weapon());}
   else if(family==='dagger'){pixel=arc(sweep,-.14,.72);merge(arc(clamp((sweep-.15)/.85,0,1),-.31,.68,true));merge(weapon(sweep,-.14));merge(weapon(clamp((sweep-.15)/.85,0,1),-.31,true));}
   else if(family==='impact'){pixel=arc(sweep,-.08,1.55);merge(weapon(sweep,-.04,false,true));if(p>.27)for(let j=0;j<7;j++){const a=(j-3)*.17,reach=.69+.15*sweep,xx=Math.sin(a)*reach,zz=Math.cos(a)*reach,d=segment(sx,z,xx,zz,xx+Math.sin(a)*.13,zz+.08);if(d<.026)merge(ink(244,220));}}
   else if(family==='fist'){const combo=Math.min(2,Math.floor(sweep*3)),cx=[-.19,.19,0][combo],cy=[.44,.58,.73][combo],d=Math.hypot((sx-cx)*1.05,z-cy),rim=.18+.025*Math.sin(sweep*Math.PI);if(Math.abs(sx)<z&&r<.97){if(d<rim&&d>rim-.055)pixel=ink(d>rim-.015?45:242);if(Math.abs(sx-cx)<.105&&Math.abs(z-cy)<.075)pixel=ink(Math.abs(sx-cx)>.082?46:205);for(let j=0;j<4;j++)if(Math.abs(sx-cx-(j-1.5)*.046)<.018&&z>cy&&z<cy+.09)pixel=ink(250);for(let side of [-1,1])if(segment(sx,z,cx+side*.11,cy-.14,cx+side*.23,cy-.32)<.025)merge(ink(215,190));}}
   else if(family==='arrow'){const center=.33+sweep*.43,head=Math.abs(sx)*.55+Math.abs(z-center);if(Math.abs(sx)<.055&&z>center-.43&&z<center)pixel=ink(Math.abs(sx)>.032?48:232);if(z<center+.13&&z>center-.12&&head<.15)pixel=ink(head>.115?44:head<.065?255:194);for(let side of [-1,1])if(segment(sx,z,side*.018,center-.27,side*.20,center-.42)<.04)merge(ink(248));if(p<.45){const bow=Math.abs(Math.hypot(sx*1.1,z-.33)-.28);if(z<.36&&bow<.03)merge(ink(194));if(segment(sx,z,-.24,.23,.24,.23)<.013)merge(ink(250));}if(Math.abs(sx)<.08&&z>center-.6&&z<center-.44)merge(ink(170,140));}
   else if(family==='cast'){const reach=.30+sweep*.32,rr=Math.hypot(sx,z-reach);if(rr>.14&&rr<.21)pixel=ink(rr<.16||rr>.19?45:224);for(let j=0;j<5;j++){const a=(j-2)*.38,cx=Math.sin(a)*(.17+sweep*.4),cy=reach+Math.cos(a)*.13,d=segment(sx,z,cx,cy,cx*.5,cy-.24);if(d<.034)merge(ink(j%2?200:255));}if(Math.abs(sx+.23)<.028&&z>.13&&z<.61)merge(ink(205));if(Math.abs(sx+.23)+Math.abs(z-.65)<.12)merge(ink(rr>.18?251:184));if(segment(sx,z,-.22,reach,.22,reach)<.025||segment(sx,z,0,reach-.17,0,reach+.17)<.025)merge(ink(252));}
   else if(family==='music'){for(let note=0;note<3;note++){const cx=(note-1)*.32+Math.sin(sweep*2+note)*.04,cy=.31+sweep*.3+(note%2)*.16,head=((sx-cx)/.13)**2+((z-cy)/.07)**2;if(head<1.35)merge(ink(head>1?43:246));if(Math.abs(sx-cx-.10)<.025&&z>cy&&z<cy+.24)merge(ink(235));if(segment(sx,z,cx+.10,cy+.24,cx+.25,cy+.19)<.028)merge(ink(230));}for(let j=0;j<3;j++)if(segment(sx,z,-.58+j*.04,.33+sweep*.18+j*.08,.58-j*.04,.35+sweep*.18+j*.08)<.014)merge(ink(178,140));}
   else if(family==='flask'){const cy=.28+sweep*.43,xx=sx+Math.sin(sweep*Math.PI)*.08,body=Math.abs(xx)<.23&&Math.abs(z-cy)<.16,neck=Math.abs(xx)<.075&&z>cy+.12&&z<cy+.28;if(body||neck){const edge=Math.abs(xx)>.195||Math.abs(z-cy)>.13;pixel=ink(edge?43:Math.abs(xx)<.10&&z<cy+.03?207:156,edge?245:235);}if(Math.abs(xx)<.10&&z>cy+.26&&z<cy+.31)merge(ink(250));if(Math.abs(xx+.12)<.025&&z>cy-.06&&z<cy+.07)merge(ink(255));for(let j=0;j<5;j++)if(Math.hypot(xx+(j%2-.5)*.18,z-cy+.22+j*.05)<.045)merge(ink(219,190));}
   if(motion==='standard'&&(family==='blade'||family==='dagger'||family==='impact'||family==='fist')){if(Math.abs(sx)>z||r>.98)pixel=null;}
   if(!pixel||pixel[3]<1)continue;const at=(y*(N*F)+frame*N+x)*4;data.set(pixel,at);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;
  }
  bounds.push(Object.freeze({frame,minX:count?minX:0,minY:count?minY:0,maxX:count?maxX:0,maxY:count?maxY:0,pixels:count}));
 }
 const result=Object.freeze({family,motion,width:N*F,height:N,frameWidth:N,frameHeight:N,frameCount:F,data,bounds:Object.freeze(bounds),bytes:data.byteLength});atlases.set(cacheKey,result);return result;
}
const NATIVE_HEROES=new Set(['knight','mage','ranger','turtle','owl','raccoon','fenrir']);
const nativeHero=u=>!!u&&NATIVE_HEROES.has(u.hero)&&!u.castleBuilderKey&&!u.treeTagCharacter&&!u.warlockCharacter&&!u.kodoTagCharacter;
const SKILL_VISUAL_EVENTS=new Set(['heal','devotion','battlecry','frostnova','poison','fireball','abilityPulse','summon','bolt','sprint']);
export function roAttackArtHandles(event,source){return !!event&&(event.type==='roAttack'||event.type==='slash'&&event.basicAttack===true&&nativeHero(source)||event.bonk===true&&typeof event.skillKey==='string'&&!!RO_ATTACK_SKILLS[event.skillKey]&&SKILL_VISUAL_EVENTS.has(event.type));}
const observes=(event,source)=>roAttackArtHandles(event,source)||!!event&&event.type==='arrow'&&event.basicAttack===true&&nativeHero(source);
const facing=(e,source)=>{if(Number.isFinite(e.direction))return e.direction;const d=e.direction,dx=Array.isArray(d)?d[0]:d?.x??e.dx,dz=Array.isArray(d)?d[1]:d?.z??e.dz;if(Number.isFinite(dx)&&Number.isFinite(dz)&&Math.hypot(dx,dz)>.001)return Math.atan2(dx,dz);const x=Number.isFinite(e.x)?e.x:source?.x||0,z=Number.isFinite(e.z)?e.z:source?.z||0,tx=e.tx??e.targetPoint?.x,tz=e.tz??e.targetPoint?.z;return Number.isFinite(tx)&&Number.isFinite(tz)&&Math.hypot(tx-x,tz-z)>.001?Math.atan2(tx-x,tz-z):source?.facing||0;};
export function roAttackPlacement(event,profile,age,heightAt=()=>0,source){
 const yaw=facing(event,source),x=profile.anchor==='target'&&Number.isFinite(event.tx)?event.tx:Number.isFinite(event.x)?event.x:source?.x,z=profile.anchor==='target'&&Number.isFinite(event.tz)?event.tz:Number.isFinite(event.z)?event.z:source?.z;
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 const travel=(profile.forwardOffset||0)+(profile.melee||profile.stationary?0:Math.min(Math.max(0,profile.range-profile.visualRange),Math.max(0,age)*(profile.travelSpeed||0))),c=Math.cos(yaw),s=Math.sin(yaw),vertical=profile.plane==='vertical',width=profile.width,length=vertical?profile.verticalHeight:profile.visualRange,centered=profile.centered&&!vertical;
 const px=x+s*travel-(centered?s*length*.5:0),pz=z+c*travel-(centered?c*length*.5:0),g=(x,z)=>{const n=heightAt(x,z);return Number.isFinite(n)?n:0;},ground=g(px,pz),y=ground+profile.height,rightSlope=vertical?0:(g(px+c*width/2,pz-s*width/2)-g(px-c*width/2,pz+s*width/2))/width,forwardSlope=vertical?0:(g(px+s*length,pz+c*length)-ground)/length;
 return{x:px,y,z:pz,yaw,width,length,vertical,rightSlope,forwardSlope,frame:Math.min(F-1,Math.floor(clamp(age/profile.duration,0,.999999)*F))};
}

const vertexShader=`uniform float atlasRows;attribute float attackFrame;attribute float attackVariant;attribute float attackOpacity;varying vec2 vAtlas;varying vec3 vTint;varying float vAlpha;void main(){vAtlas=vec2((uv.x+attackFrame)/${F.toFixed(1)},(uv.y+attackVariant)/atlasRows);vTint=instanceColor;vAlpha=attackOpacity;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
const fragmentShader=`uniform sampler2D atlas;varying vec2 vAtlas;varying vec3 vTint;varying float vAlpha;void main(){vec4 texel=texture2D(atlas,vAtlas);float a=texel.a*vAlpha;if(a<0.008)discard;gl_FragColor=vec4(texel.rgb*vTint,a);#include <colorspace_fragment>}`;
// Eight instanced sprite batches maximum. Meshes/textures are allocated lazily,
// never per swing; event-time animation also makes rewind/replay deterministic.
export function createRoAttackArt({scene}){
 const root=new T.Group();root.name='ro-pixel-attack-trails';scene.add(root);const batches=new Map(),records=new Map(),dummy=new T.Object3D(),tint=new T.Color(),frustum=new T.Frustum(),viewProjection=new T.Matrix4(),bounds=new T.Sphere();let disposed=false,world='',last=-Infinity,culled=0;
 const groundSafe=(heightAt,x,z)=>{try{return heightAt(x,z);}catch{return 0;}};
 function batch(family){if(batches.has(family))return batches.get(family);const rows=variants[family]||['standard'],frames=roAttackFrames(family),pixels=new Uint8Array(frames.bytes*rows.length);for(let row=0;row<rows.length;row++)pixels.set(roAttackFrames({family,motion:rows[row]}).data,row*frames.bytes);const texture=new T.DataTexture(pixels,frames.width,frames.height*rows.length,T.RGBAFormat,T.UnsignedByteType);texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,.5,0,1,-.5,0,1],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geometry.setIndex([0,2,1,0,3,2]);geometry.setAttribute('attackFrame',new T.InstancedBufferAttribute(new Float32Array(64),1).setUsage(T.DynamicDrawUsage));geometry.setAttribute('attackVariant',new T.InstancedBufferAttribute(new Float32Array(64),1).setUsage(T.DynamicDrawUsage));geometry.setAttribute('attackOpacity',new T.InstancedBufferAttribute(new Float32Array(64),1).setUsage(T.DynamicDrawUsage));const material=new T.ShaderMaterial({uniforms:{atlas:{value:texture},atlasRows:{value:rows.length}},vertexShader,fragmentShader:fragmentShader.replace(';#include',';\n#include').replace('<colorspace_fragment>}','<colorspace_fragment>\n}'),transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),mesh=new T.InstancedMesh(geometry,material,64);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.name='ro-attack-'+family;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=4;root.add(mesh);const record={mesh,texture,geometry,material,rows,count:0};batches.set(family,record);return record;
 }
 const finish=()=>{for(const b of batches.values()){b.mesh.count=b.count;b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;b.geometry.attributes.attackFrame.needsUpdate=true;b.geometry.attributes.attackVariant.needsUpdate=true;b.geometry.attributes.attackOpacity.needsUpdate=true;}};
 return{root,handles:roAttackArtHandles,update(state,time=state?.time||0,heightAt=()=>0,camera=null){if(disposed)return;culled=0;if(!state||!Number.isFinite(time)){root.visible=false;records.clear();for(const b of batches.values())b.count=b.mesh.count=0;world='';last=-Infinity;return;}root.visible=true;const worldKey=[state.options?.mode,state.matchId||state.id||'',state.seed||'',state.bonk?.map?.seed||'',state.bonk?.map?.stageKey||'',state.bonk?.floor||'',state.dungeon?.map?.seed||'',state.dungeon?.floor||''].join(':');if(worldKey!==world||time<last){records.clear();world=worldKey;}last=time;for(const b of batches.values())b.count=0;const units=new Map((state.units||[]).map(u=>[u.id,u]));const cull=!!camera?.projectionMatrix&&!!camera?.matrixWorldInverse;if(cull)frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const e of state.effects||[]){const source=units.get(e.source);if(!observes(e,source)||e.id==null||!Number.isFinite(e.time))continue;const profile=roAttackProfile(e,source),age=time-e.time;if(age<0||age>=profile.duration||!roAttackPlacement(e,profile,age,()=>0,source))continue;const id=String(e.id)+':'+e.time;if(!records.has(id))records.set(id,{event:{...e},profile,source});}
  for(const [key,r]of records)if(time-r.event.time<0||time-r.event.time>=r.profile.duration)records.delete(key);
  const active=[...records.entries()].sort((a,b)=>a[1].event.time-b[1].event.time||(a[0]<b[0]?-1:a[0]>b[0]?1:0));while(active.length>64){records.delete(active.shift()[0]);}
  for(const [key,r]of active){const age=time-r.event.time,placement=roAttackPlacement(r.event,r.profile,age,(x,z)=>groundSafe(heightAt,x,z),r.source);if(!placement)continue;const c=Math.cos(placement.yaw),s=Math.sin(placement.yaw),w=placement.width,l=placement.length;if(cull){if(placement.vertical){bounds.center.set(placement.x,placement.y+l*.5,placement.z);bounds.radius=Math.hypot(w*.5,l*.5)+.75;}else{bounds.center.set(placement.x+s*l*.5,placement.y+placement.forwardSlope*l*.5,placement.z+c*l*.5);bounds.radius=Math.hypot(w*.5,l*.5,(Math.abs(placement.rightSlope)*w+Math.abs(placement.forwardSlope)*l)*.5)+.75;}if(!frustum.intersectsSphere(bounds)){culled++;continue;}}const b=batch(r.profile.family),i=b.count++;if(placement.vertical){let rx=c,rz=-s;if(camera?.matrixWorld){rx=camera.matrixWorld.elements[0];rz=camera.matrixWorld.elements[2];const n=Math.hypot(rx,rz)||1;rx/=n;rz/=n;}dummy.matrix.set(rx*w,-rz,0,placement.x,0,0,l,placement.y,rz*w,rx,0,placement.z,0,0,0,1);}else dummy.matrix.set(c*w,0,s*l,placement.x,placement.rightSlope*w,1,placement.forwardSlope*l,placement.y,-s*w,0,c*l,placement.z,0,0,0,1);b.mesh.setMatrixAt(i,dummy.matrix);b.mesh.setColorAt(i,tint.setHex(r.profile.tint));b.geometry.attributes.attackFrame.setX(i,placement.frame);b.geometry.attributes.attackVariant.setX(i,Math.max(0,b.rows.indexOf(r.profile.motion||'standard')));b.geometry.attributes.attackOpacity.setX(i,r.profile.opacity);}
  finish();
 },stats(){return{active:records.size,instances:[...batches.values()].reduce((n,b)=>n+b.mesh.count,0),culled,families:batches.size,drawCalls:[...batches.values()].filter(b=>b.mesh.count>0).length,atlasBytes:[...batches.values()].reduce((n,b)=>n+b.texture.image.data.byteLength,0),disposed};},dispose(){if(disposed)return;disposed=true;records.clear();culled=0;for(const b of batches.values()){b.mesh.dispose();b.texture.dispose();b.geometry.dispose();b.material.dispose();}batches.clear();root.clear();root.removeFromParent();}};
}
