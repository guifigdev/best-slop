import {createMoltenLavaMaterial} from './lava-material.js';
import * as T from 'three';

const TAU=Math.PI*2;
const vertex=`varying vec2 vPoint;void main(){vPoint=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`
uniform float uTime;uniform float uKind;varying vec2 vPoint;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 p=vPoint;float r=length(p),edge=smoothstep(.92,1.0,r);vec3 col;float alpha=1.0;
 if(uKind<.5){
  vec2 q=p*4.0,cell=floor(q),f=fract(q);float a=10.0,b=10.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 n=vec2(float(x),float(y));vec2 jitter=vec2(hash(cell+n),hash(cell+n+19.3))*.65+.175;float d=length(n+jitter-f);if(d<a){b=a;a=d;}else if(d<b)b=d;}
  float crack=1.0-smoothstep(.075,.30,b-a),pocket=(1.0-smoothstep(.12,.32,a))*step(.72,hash(cell));crack=max(crack,pocket*.95);float pulse=.84+.16*sin(uTime*2.3+hash(cell)*8.0);
  vec3 crust=mix(vec3(.065,.045,.05),vec3(.20,.105,.085),hash(cell));
  vec3 molten=mix(vec3(.91,.105,.008),vec3(1.0,.82,.13),smoothstep(.42,.98,crack));
  col=mix(crust,molten*pulse,crack);col=mix(col,vec3(.075,.055,.055),edge*.8);
 }else if(uKind<1.5){
  vec2 grid=fract((p+vec2(p.y*.4,0.0))*7.0);float seam=1.0-smoothstep(.015,.055,min(min(grid.x,1.0-grid.x),min(grid.y,1.0-grid.y)));
  col=mix(vec3(.31,.66,.81),vec3(.76,.94,.98),.3+seam*.6);col+=vec3(.07)*step(.86,hash(floor(p*9.0)+floor(uTime)));alpha=.72;
 }else if(uKind<2.5){
  float ring=sin(r*32.0-uTime*2.0)*.04;col=mix(vec3(.10,.34,.49),vec3(.26,.65,.78),.5+ring);col=mix(col,vec3(.62,.82,.84),edge*.65);alpha=.86;
 }else if(uKind<3.5){
  float frost=step(.72,hash(floor(p*12.0)));col=mix(vec3(.59,.76,.85),vec3(.89,.97,.97),frost);alpha=.25+.2*edge;
 }else{
  float spokes=1.0-smoothstep(.035,.07,abs(sin(atan(p.y,p.x)*4.0))),rune=spokes*step(.35,r)*step(r,.8);
  col=mix(vec3(.18,.19,.19),uKind<4.5?vec3(.92,.49,.18):vec3(.35,.73,.94),rune*.8);alpha=.88;
 }
 gl_FragColor=vec4(col,alpha);
}`;
const kind=type=>type==='lava'?0:type==='ice'?1:type==='water'?2:type==='trap'?4:type==='lightning'?5:3;
export function hazardDecorations(zone){
 const parts=[],r=zone.r;if(!Number.isFinite(r)||r<=0)return parts;
 for(let i=0;i<12;i++){const a=i/12*TAU,radial=r*.82,size=r*.095;
  if(zone.type==='lava')parts.push({x:Math.sin(a)*radial,z:Math.cos(a)*radial,y:.05,w:size*1.2,h:size*.45,d:size,color:0x34292c,role:'crust'});
  if(zone.type==='frost'||zone.type==='ice')parts.push({x:Math.sin(a)*radial,z:Math.cos(a)*radial,y:zone.type==='frost'?.2:.055,w:size*.5,h:zone.type==='frost'?.3+(i%3)*.12:.05,d:size*.5,color:i%2?0xb5e5ed:0xe0f4f1,role:'crystal'});
  if(zone.type==='lava'&&i<8)parts.push({x:Math.sin(i*2.4)*r*.58,z:Math.cos(i*2.4)*r*.58,y:.2,w:.07,h:.11,d:.07,color:i%2?0xffd477:0xf8732e,role:'ember',phase:i*.17});
 }
 return parts;
}

export function createHazardArt({base,heightAt=()=>.2}={}){
 const root=new T.Group(),geometry=base||new T.BoxGeometry(1,1,1),ownGeometry=!base,material=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),details=new T.InstancedMesh(geometry,material,2048),dummy=new T.Object3D(),color=new T.Color(),entries=new Map(),circleCache=new Map(),shaders=new Map();root.name='arena-hazards';details.frustumCulled=false;details.count=0;root.add(details);let lastFrame=-1;
 function shader(type){const id=kind(type);if(!shaders.has(id))shaders.set(id,id===0?createMoltenLavaMaterial():new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uTime:{value:0},uKind:{value:id}},side:T.DoubleSide,transparent:id!==0,depthWrite:id===0,toneMapped:false}));return shaders.get(id);}
 function circle(r){if(!circleCache.has(r))circleCache.set(r,new T.CircleGeometry(r,64));return circleCache.get(r);}
 function remove(id){const entry=entries.get(id);if(entry){root.remove(entry.surface,entry.border);entry.border.geometry.dispose();entry.border.material.dispose();entries.delete(id);}}
 function update(zones,time=0){
  const frame=Math.floor(time*8),keys=new Set();for(const [index,zone]of (zones||[]).entries()){
   if(!Number.isFinite(zone.r)||zone.r<=0||!Number.isFinite(zone.x)||!Number.isFinite(zone.z))continue;const id=zone.id??`zone-${index}`,signature=`${zone.type}:${zone.r}`;keys.add(id);let entry=entries.get(id);
   if(entry?.signature!==signature){remove(id);const surface=new T.Mesh(circle(zone.r),shader(zone.type));surface.rotation.x=-Math.PI/2;const border=new T.Mesh(new T.RingGeometry(zone.r*.965,zone.r,64),new T.MeshBasicMaterial({color:zone.type==='lava'?0xff8d35:zone.type==='water'?0x9ed5db:0xd7f2f6,transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false,toneMapped:false}));border.rotation.x=-Math.PI/2;root.add(surface,border);entry={surface,border,signature,zone,parts:hazardDecorations(zone)};entries.set(id,entry);}
   entry.zone=zone;const y=heightAt(zone.x,zone.z)+.055;entry.surface.position.set(zone.x,y,zone.z);entry.border.position.set(zone.x,y+.014,zone.z);
   if(zone.type==='trap'){const phase=(time+(zone.offset||0))%(zone.period||6);entry.surface.visible=phase<2;entry.border.visible=phase<2;entry.border.material.color.setHex(phase<1.5?0xe5bc72:0xff5745);}
  }
  for(const id of entries.keys())if(!keys.has(id))remove(id);
  const contentSignature=[...entries].map(([id,e])=>`${id}:${e.signature}:${e.zone.x}:${e.zone.z}`).join('|');if(frame===lastFrame&&details.userData.signature===contentSignature)return;lastFrame=frame;details.userData.signature=contentSignature;for(const mat of shaders.values())mat.uniforms.uTime.value=frame/8;
  let count=0;for(const entry of entries.values())for(const part of entry.parts){if(count>=2048)break;const zone=entry.zone,y=heightAt(zone.x,zone.z)+.065,t=frame/8,life=(t*.65+(part.phase||0))%1,ember=part.role==='ember';dummy.position.set(zone.x+part.x+(ember?Math.sin(t+part.phase)*.08:0),y+part.y+(ember?life*.95:0),zone.z+part.z);dummy.scale.set(part.w*(ember?1-life*.55:1),part.h,part.d);dummy.rotation.set(0,ember?frame*.7:0,part.role==='crystal'?.12:0);dummy.updateMatrix();details.setMatrixAt(count,dummy.matrix);details.setColorAt(count,color.setHex(part.color));count++;}details.count=count;details.instanceMatrix.needsUpdate=true;if(details.instanceColor)details.instanceColor.needsUpdate=true;
 }
 return{root,update,setVisible(value){root.visible=!!value;},dispose(){root.removeFromParent();for(const id of [...entries.keys()])remove(id);for(const geo of circleCache.values())geo.dispose();for(const mat of shaders.values())mat.dispose();material.dispose();if(ownGeometry)geometry.dispose();details.dispose();},get zoneCount(){return entries.size;}};
}
