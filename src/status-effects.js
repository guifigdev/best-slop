import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Shared immutable meshes/materials, acquired lazily by the view's visibility budget.
// Each active status is one draw call, including its particles. No actor material
// is replaced or tinted, so animal vertex colours remain intact.
let cache=null,users=0;
const vertex=`
 uniform float uTime;
 uniform float uBillboard;
 attribute float aKind;
 attribute float aPhase;
 varying vec2 vUv;
 varying float vKind;
 varying float vPhase;
 varying vec3 vNormal;
 varying vec3 vView;
 void main(){
  vec3 p=position;
  vUv=uv;vKind=aKind;vPhase=aPhase;
  if(aKind>0.5&&aKind<1.5){
   float life=fract(uTime*.52+aPhase);
   p.y+=life*1.9;
   p.x+=sin(aPhase*18.0+uTime*1.8)*.075;
  }
  if(aKind>2.5){
   float life=fract(uTime*.45+aPhase);
   p.y+=life*.8;
   p.x+=sin(uTime*1.4+aPhase*15.0)*.09;
   p.z+=cos(uTime*1.2+aPhase*18.0)*.09;
  }
  vec4 viewPosition;
  if(uBillboard>.5){
   // Anchor in world space, then offset in camera space. Actor rotation is
   // intentionally excluded; world scale still follows size and Avatar.
   vec2 size=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
   viewPosition=modelViewMatrix*vec4(0.0,0.0,0.0,1.0);
   viewPosition.xy+=p.xy*size;
  }else viewPosition=modelViewMatrix*vec4(p,1.0);
  vNormal=normalize(normalMatrix*normal);
  vView=-viewPosition.xyz;
  gl_Position=projectionMatrix*viewPosition;
 }
`;
const fireFragment=`
 uniform float uTime;
 varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
   vec2 cell=floor(vUv*vec2(11.0,15.0));
   float noise=hash(vec2(cell.x,cell.y-floor(uTime*5.0)));
   float y=vUv.y;
   float sway=sin(y*7.0-uTime*3.2)*(.018+y*.055);
   float width=(1.0-y)*.43+noise*.14;
   float x=abs(vUv.x-.5+sway);
   float edge=width-x;
   float alpha=smoothstep(0.0,.06,edge)*smoothstep(0.0,.1,y)*(.55+(1.0-y)*.45)*.96;
   alpha*=(1.0-smoothstep(.88,1.0,y))*(.8+noise*.2);
   float core=clamp((width-x)*3.0+(1.0-y)*.3,0.0,1.0);
   vec3 colour=mix(vec3(1.0,.27,.025),vec3(1.0,.86,.25),core);
   colour=mix(colour,vec3(1.0,.97,.69),core*core*.55);
   // Embers are drawn inside this same sprite, not on additional planes.
   float ember=0.0;
   for(int i=0;i<7;i++){
    float seed=float(i),life=fract(uTime*.52+seed/7.0);
    vec2 centre=vec2(.16+hash(vec2(seed,3.0))*.68+sin(uTime*1.5+seed)*.025,.3+life*.66);
    vec2 delta=abs(vUv-centre);
    float square=1.0-smoothstep(.009,.018,max(delta.x,delta.y));
    ember=max(ember,square*(1.0-life)*.95);
   }
   colour=mix(colour,vec3(1.0,.93,.52),ember);
   alpha=max(alpha,ember);
   if(alpha<.035)discard;
   gl_FragColor=vec4(colour,alpha);
 }
`;
const frostFragment=`
 uniform float uTime;
 varying vec2 vUv;
 varying float vKind;
 varying vec3 vNormal;
 varying vec3 vView;
 void main(){
  float facing=abs(dot(normalize(vNormal),normalize(vView)));
  float rim=pow(1.0-facing,2.0);
  float pulse=.92+sin(uTime*2.0)*.08;
  vec3 colour=mix(vec3(.32,.77,1.0),vec3(.94,1.0,1.0),rim*.65+vUv.y*.3);
  float alpha=vKind>1.5&&vKind<2.5?.4:.88;
  alpha=(alpha+rim*.15)*pulse;
  gl_FragColor=vec4(colour,alpha);
 }
`;
const poisonFragment=`
 uniform float uTime;
 varying vec2 vUv;
 varying float vPhase;
 varying vec3 vNormal;
 varying vec3 vView;
 void main(){
  float life=fract(uTime*.45+vPhase);
  float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.0);
  vec3 colour=mix(vec3(.29,.53,.12),vec3(.79,.94,.34),rim*.6+vUv.y*.4);
  gl_FragColor=vec4(colour,(.8-life*.5));
 }
`;
function tagged(geometry,kind,phase=0){
 const out=geometry.index?geometry.toNonIndexed():geometry;
 if(out!==geometry)geometry.dispose();
 const count=out.attributes.position.count;
 out.setAttribute('aKind',new T.Float32BufferAttribute(new Float32Array(count).fill(kind),1));
 out.setAttribute('aPhase',new T.Float32BufferAttribute(new Float32Array(count).fill(phase),1));
 return out;
}
function merge(parts){const g=mergeGeometries(parts,false);for(const p of parts)p.dispose();g.computeBoundingSphere();return g;}
function createFireGeometry(){
 const geometry=tagged(new T.PlaneGeometry(2.1,2.8),0);
 geometry.computeBoundingSphere();return geometry;
}
function createFrostGeometry(){
 const parts=[];
 const ring=tagged(new T.RingGeometry(.79,1.13,16),2);ring.rotateX(-Math.PI/2);ring.translate(0,.075,0);parts.push(ring);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,geo=tagged(new T.ConeGeometry(.145+(i%2)*.02,.45+(i%3)*.1,4,1),0);geo.rotateY(a);geo.rotateZ((i%2?.12:-.12));geo.translate(Math.sin(a)*.88,.3,Math.cos(a)*.88);parts.push(geo);}
 return merge(parts);
}
function createPoisonGeometry(){
 const parts=[];
 for(let i=0;i<6;i++){const a=i*2.399,size=.15+(i%3)*.035,geo=tagged(new T.BoxGeometry(size,size,size),3,i/6);geo.rotateX(.32+i*.2);geo.rotateY(a);geo.translate(Math.sin(a)*.94,.8+(i%3)*.35,Math.cos(a)*.94);parts.push(geo);}
 return merge(parts);
}
function resources(){
 if(cache)return cache;
 const time={value:0};
 function shader(fragmentShader,billboard=false){return new T.ShaderMaterial({uniforms:{uTime:time,uBillboard:{value:billboard?1:0}},vertexShader:vertex,fragmentShader,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false});}
 const fire=shader(fireFragment,true),frost=shader(frostFragment),poison=shader(poisonFragment);
 // Standard alpha blending preserves distinct orange/blue/green against bright
 // ice and sand as well as dark arenas; additive blending would wash them out.
 const fireGeometry=createFireGeometry(),frostGeometry=createFrostGeometry(),poisonGeometry=createPoisonGeometry();
 // Shader displacement must fit the CPU-side culling volumes too.
 poisonGeometry.boundingSphere.radius+=.8;
 cache={time,fire,frost,poison,fireGeometry,frostGeometry,poisonGeometry};
 return cache;
}
function activeDot(unit,key,time){return Number.isFinite(unit?.dots?.[key]?.until)&&unit.dots[key].until>time;}

export function createStatusEffects(root,_baseGeometry){
 const data=resources();users++;
 const group=new T.Group();group.name='persistent-status-effects';group.visible=false;root.add(group);
 const fire=new T.Mesh(data.fireGeometry,data.fire),frost=new T.Mesh(data.frostGeometry,data.frost),poison=new T.Mesh(data.poisonGeometry,data.poison);
 fire.position.y=1.45;
 for(const mesh of [fire,frost,poison]){mesh.visible=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=2;group.add(mesh);}
 let disposed=false;
 return{
  update(unit,time,enabled=true){
   if(disposed)return;
   const active=enabled&&unit?.alive!==false&&Number.isFinite(time);
   fire.visible=!!active&&(activeDot(unit,'burn',time)||activeDot(unit,'lava',time)||(unit?.solarUntil||0)>time);
   frost.visible=!!active&&((unit?.frostUntil||0)>time||activeDot(unit,'frost',time));
   poison.visible=!!active&&activeDot(unit,'poison',time);
   group.visible=fire.visible||frost.visible||poison.visible;
   if(group.visible)data.time.value=Math.floor(time*8)/8;
  },
  dispose(){
   if(disposed)return;disposed=true;
   // Detach first: the view's ordinary actor traversal must not dispose shared
   // meshes/materials. Only the final status actor releases this cache.
   group.removeFromParent();group.clear();
   if(--users===0&&cache){for(const key of ['fire','frost','poison','fireGeometry','frostGeometry','poisonGeometry'])cache[key].dispose();cache=null;}
  }
 };
}
