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

export function createColiseumMoat({base}={}){
 const root=new T.Group();root.name='coliseum-lava-moat';root.visible=false;
 const layout=coliseumMoatLayout(),positions=[],indices=[],n=layout.inner.length;
 for(let i=0;i<n;i++)for(const point of [layout.inner[i],layout.outer[i]])positions.push(point.x,.217,point.z);
 for(let i=0;i<n;i++){const a=i*2,b=((i+1)%n)*2;indices.push(a,a+1,b+1,a,b+1,b);}
 const surfaceGeometry=new T.BufferGeometry();surfaceGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));surfaceGeometry.setIndex(indices);surfaceGeometry.computeVertexNormals();surfaceGeometry.computeBoundingSphere();
 const lava=createMoltenLavaMaterial(),surface=new T.Mesh(surfaceGeometry,lava);surface.name='coliseum-moat-lava';root.add(surface);
 const geometry=base||new T.BoxGeometry(),stone=new T.MeshLambertMaterial({color:0xffffff}),boxes=[],dummy=new T.Object3D(),color=new T.Color();
 const box=(x,y,z,w,h,d,yaw,hex)=>boxes.push({x,y,z,w,h,d,yaw,hex});
 // Cut the basalt edging where a gate's bridge crosses it.
 for(const edge of [layout.inner,layout.outer])for(let i=0;i<n;i++){
  const p=edge[i],q=edge[(i+1)%n],x=(p.x+q.x)/2,z=(p.z+q.z)/2;
  if(Math.min(Math.abs(x),Math.abs(z))<2.9)continue;
  box(x,.29,z,.24,.27,Math.hypot(q.x-p.x,q.z-p.z)+.04,Math.atan2(q.x-p.x,q.z-p.z),i%3===0?0x64514a:0x443b39);
 }
 for(const bridge of layout.bridges){
  const {x,z,yaw,width,length}=bridge,c=Math.cos(yaw),s=Math.sin(yaw);
  box(x,.31,z,width,.26,length,yaw,0x6c5a4d);
  const steps=Math.ceil(length/.85);
  for(let i=0;i<steps;i++){
   const along=(i+.5)/steps*length-length/2;
   box(x+s*along,.46,z+c*along,width-.16,.08,length/steps-.06,yaw,i%2?0xa28b6a:0xb39b77);
  }
  for(const side of [-1,1])box(x+c*side*(width/2-.1),.49,z-s*side*(width/2-.1),.16,.16,length,yaw,0x4b403b);
 }
 const masonry=new T.InstancedMesh(geometry,stone,boxes.length);masonry.name='coliseum-moat-basalt-and-bridges';masonry.castShadow=true;masonry.receiveShadow=true;masonry.frustumCulled=false;
 for(const [i,b]of boxes.entries()){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.yaw,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();masonry.setMatrixAt(i,dummy.matrix);masonry.setColorAt(i,color.setHex(b.hex));}
 root.add(masonry);let disposed=false;
 return{root,layout,update(time){if(!disposed)lava.uniforms.uTime.value=Math.floor(Math.max(0,time)*8)/8;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();surfaceGeometry.dispose();lava.dispose();masonry.dispose();stone.dispose();if(!base)geometry.dispose();}};
}
