import * as T from 'three';
import {arenaBoundaryRadius,coliseumLayout} from './coliseum-architecture.js';
import {createMoltenLavaMaterial} from './lava-material.js';

// Decorative channel outside the movement boundary. It shares Warlock's
// texture-free lava shader, with no extra simulation zones or collision bodies.
export function coliseumMoatLayout(segments=192){
 const arena=coliseumLayout(),inner=[],outer=[],bridges=[];
 const rx=arena.innerRx-.3,rz=arena.innerRz-.3;
 for(let i=0;i<segments;i++){
  const angle=i/segments*Math.PI*2,x=Math.sin(angle),z=Math.cos(angle),r=arenaBoundaryRadius(x,z)+1.1,edge=1/Math.hypot(x/rx,z/rz);
  inner.push({x:x*r,z:z*r});outer.push({x:x*edge,z:z*edge});
 }
 for(let i=0;i<4;i++){
  const angle=i*Math.PI/2,x=Math.sin(angle),z=Math.cos(angle),start=arenaBoundaryRadius(x,z)+.2,end=1/Math.hypot(x/rx,z/rz)+1.7;
  bridges.push({x:x*(start+end)/2,z:z*(start+end)/2,yaw:angle,width:5.5,length:end-start});
 }
 return{inner,outer,bridges};
}

export const COLISEUM_MOAT_THEMES=Object.freeze({
 volcano:{kind:'lava',edge:0x443b39,base:0x6c5a4d,plank:0xb39b77,rail:0x4b403b},
 forest:{kind:'garden',edge:0x687650,base:0x74815d,plank:0xb5a781,rail:0x65714f,deep:0x405b39,shallow:0x79974f},
 glacier:{kind:'snow',edge:0x8daeb8,base:0x8a9ca1,plank:0xb2b9ac,rail:0x74919e,deep:0x608eaa,shallow:0xc4e1df},
 tempest:{kind:'water',edge:0x536e72,base:0x71837c,plank:0x9cae9d,rail:0x506a6c,deep:0x285b70,shallow:0x74b9ba},
 moon:{kind:'mist',edge:0x615573,base:0x69637d,plank:0x9b92ab,rail:0x514a69,deep:0x333a59,shallow:0x77738f}
});

function channelMaterial(){return new T.ShaderMaterial({uniforms:{uTime:{value:0},uKind:{value:0},uDeep:{value:new T.Color(0x285b70)},uShallow:{value:new T.Color(0x74b9ba)}},vertexShader:`varying vec3 vWorld; varying vec2 vUv;
void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vUv=uv;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`precision highp float;varying vec3 vWorld;varying vec2 vUv;uniform float uTime;uniform float uKind;uniform vec3 uDeep;uniform vec3 uShallow;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 p=vWorld.xz;vec2 cells=floor(p*2.7);float grain=hash(cells);float shore=pow(abs(vUv.y-.5)*2.0,5.0);vec3 colour;
if(uKind<.5){float wave=sin((p.x+p.y*.6)*2.3+uTime*1.7);float crest=smoothstep(.90,.99,sin((p.x-p.y)*3.1-uTime*1.4+grain));colour=mix(uDeep,uShallow,.35+wave*.12+grain*.16);colour=mix(colour,vec3(.79,.91,.86),crest*.32+shore*.24);}
else if(uKind<1.5){vec2 ice=floor(p*1.7);float vein=step(.92,hash(ice));float facets=hash(ice+vec2(7.0));colour=mix(uDeep,uShallow,.48+facets*.34);colour=mix(colour,vec3(.91,.97,.92),vein*.45+shore*.30);}
else if(uKind<2.5){float moss=hash(floor(p*1.35));colour=mix(uDeep,uShallow,.24+moss*.61);colour*=.94+grain*.12;}
else{float ripple=sin((p.x*.7+p.y)*2.1+uTime*.45);colour=mix(uDeep,uShallow,.25+grain*.15+ripple*.055);float speck=step(.992,hash(floor(p*3.7)+floor(uTime*.5)));colour+=vec3(.25,.22,.35)*speck;colour=mix(colour,uShallow,shore*.17);}
gl_FragColor=vec4(colour,1.0);}`});}

export function coliseumMoatDecorations(theme,layout=coliseumMoatLayout()){
 if(theme==='volcano')return [];const boxes=[],add=(x,y,z,w,h,d,hex,yaw=0)=>boxes.push({x,y,z,w,h,d,hex,yaw}),n=layout.inner.length;
 for(let i=0;i<n;i+=theme==='glacier'?3:4){const inner=layout.inner[i],outer=layout.outer[i],seed=((i*73)%101)/101,t=.22+seed*.58,x=inner.x+(outer.x-inner.x)*t,z=inner.z+(outer.z-inner.z)*t;if(Math.min(Math.abs(x),Math.abs(z))<3.15)continue;
  if(theme==='forest'){const h=.32+seed*.58;add(x,.22+h/2,z,.17,h,.17,0x56723d);add(x-.15,.31+h*.75,z,.5,.19,.35,i%8===0?0x7fa452:0x648e4b);add(x+.13,.26+h*.53,z+.12,.39,.18,.37,0x8cab58);if(i%12===0)add(x+.4,.29,z-.18,.22,.16,.22,0xd9c88a);}
  else if(theme==='glacier'){add(x,.30,z,1.1+seed*.8,.17,1+seed*.6,0xe6eeDF);add(x+.13,.44,z-.08,.69+seed*.4,.19,.65+seed*.4,0xf0f3e5);if(i%9===0)add(x-.36,.59,z+.23,.28,.62,.35,0xaacfd6);}
  else if(theme==='tempest'){if(i%12===0){add(x,.32,z,.64,.3,.48,0x849b94);add(x-.1,.48,z-.04,.37,.15,.31,0xa4b5a4);}else add(x,.239,z,.48+seed*.5,.018,.08,0xb7d7cf);}
  else{const h=.44+seed*.78;add(x,.23+h/2,z,.25,h,.26,i%8===0?0xbca6d1:0x8d9bb9);add(x+.24,.23+h*.32,z-.13,.16,h*.55,.17,0x697f9b);add(x-.15,.23,z+.17,.56,.12,.55,0x6b657b);}
 }
 if(theme==='glacier')for(const bridge of layout.bridges){const c=Math.cos(bridge.yaw),s=Math.sin(bridge.yaw);for(const side of [-1,1])add(bridge.x+c*side*(bridge.width/2-.17),.60,bridge.z-s*side*(bridge.width/2-.17),.20,.09,bridge.length*.9,0xe5eee4,bridge.yaw);}
 return boxes;
}

export function createColiseumMoat({base}={}){
 const root=new T.Group();root.name='coliseum-lava-moat';root.visible=false;
 const layout=coliseumMoatLayout(),positions=[],uvs=[],indices=[],n=layout.inner.length;
 for(let i=0;i<n;i++)for(const [j,point]of [layout.inner[i],layout.outer[i]].entries()){positions.push(point.x,.217,point.z);uvs.push(i/n,j);}
 for(let i=0;i<n;i++){const a=i*2,b=((i+1)%n)*2;indices.push(a,a+1,b+1,a,b+1,b);}
 const surfaceGeometry=new T.BufferGeometry();surfaceGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));surfaceGeometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));surfaceGeometry.setIndex(indices);surfaceGeometry.computeVertexNormals();surfaceGeometry.computeBoundingSphere();
 const lava=createMoltenLavaMaterial(),channel=channelMaterial(),surface=new T.Mesh(surfaceGeometry,lava);surface.name='coliseum-moat-lava';root.add(surface);
 const geometry=base||new T.BoxGeometry(),stone=new T.MeshLambertMaterial({color:0xffffff}),boxes=[],dummy=new T.Object3D(),color=new T.Color();
 const box=(x,y,z,w,h,d,yaw,hex,role='edge')=>boxes.push({x,y,z,w,h,d,yaw,hex,role});
 // Cut the basalt edging where a gate's bridge crosses it.
 for(const edge of [layout.inner,layout.outer])for(let i=0;i<n;i++){
  const p=edge[i],q=edge[(i+1)%n],x=(p.x+q.x)/2,z=(p.z+q.z)/2;
  if(Math.min(Math.abs(x),Math.abs(z))<2.9)continue;
  box(x,.29,z,.24,.27,Math.hypot(q.x-p.x,q.z-p.z)+.04,Math.atan2(q.x-p.x,q.z-p.z),i%3===0?0x64514a:0x443b39);
 }
 for(const bridge of layout.bridges){
  const {x,z,yaw,width,length}=bridge,c=Math.cos(yaw),s=Math.sin(yaw);
  box(x,.31,z,width,.26,length,yaw,0x6c5a4d,'base');
  const steps=Math.ceil(length/.85);
  for(let i=0;i<steps;i++){
   const along=(i+.5)/steps*length-length/2;
   box(x+s*along,.46,z+c*along,width-.16,.08,length/steps-.06,yaw,i%2?0xa28b6a:0xb39b77,'plank');
  }
  for(const side of [-1,1])box(x+c*side*(width/2-.1),.49,z-s*side*(width/2-.1),.16,.16,length,yaw,0x4b403b,'rail');
 }
 const masonry=new T.InstancedMesh(geometry,stone,boxes.length);masonry.name='coliseum-moat-basalt-and-bridges';masonry.castShadow=true;masonry.receiveShadow=true;masonry.frustumCulled=false;
 for(const [i,b]of boxes.entries()){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.yaw,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();masonry.setMatrixAt(i,dummy.matrix);masonry.setColorAt(i,color.setHex(b.hex));}
 const decorationCount=Math.max(...['forest','glacier','tempest','moon'].map(key=>coliseumMoatDecorations(key,layout).length)),decorations=new T.InstancedMesh(geometry,stone,decorationCount);decorations.name='coliseum-moat-biome-details';decorations.count=0;decorations.frustumCulled=false;decorations.receiveShadow=true;decorations.castShadow=false;root.add(masonry,decorations);let disposed=false,current='volcano';root.userData.theme=current;root.userData.kind='lava';
 function setTheme(key){const next=Object.hasOwn(COLISEUM_MOAT_THEMES,key)?key:'forest';if(disposed||current===next)return;current=next;const palette=COLISEUM_MOAT_THEMES[next];root.userData.theme=next;root.userData.kind=palette.kind;surface.material=next==='volcano'?lava:channel;surface.name=next==='volcano'?'coliseum-moat-lava':'coliseum-moat-channel';if(next!=='volcano'){channel.uniforms.uKind.value=next==='tempest'?0:next==='glacier'?1:next==='forest'?2:3;channel.uniforms.uDeep.value.setHex(palette.deep);channel.uniforms.uShallow.value.setHex(palette.shallow);}
  for(const[i,b]of boxes.entries())masonry.setColorAt(i,color.setHex(next==='volcano'?b.hex:palette[b.role]));masonry.instanceColor.needsUpdate=true;const details=coliseumMoatDecorations(next,layout);decorations.count=details.length;for(const[i,b]of details.entries()){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.yaw||0,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();decorations.setMatrixAt(i,dummy.matrix);decorations.setColorAt(i,color.setHex(b.hex));}decorations.instanceMatrix.needsUpdate=true;if(decorations.instanceColor)decorations.instanceColor.needsUpdate=true;
 }
 return{root,layout,setTheme,update(time){if(!disposed){const now=Math.floor(Math.max(0,Number.isFinite(time)?time:0)*8)/8;lava.uniforms.uTime.value=channel.uniforms.uTime.value=now;}},dispose(){if(disposed)return;disposed=true;root.removeFromParent();surfaceGeometry.dispose();lava.dispose();channel.dispose();masonry.dispose();decorations.dispose();stone.dispose();if(!base)geometry.dispose();}};
}
