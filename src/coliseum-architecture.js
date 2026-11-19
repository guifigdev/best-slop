import * as T from 'three';
import {ARENA_BOUNDS} from '../shared/arena-size.js';

export const COLISEUM_THEME_COLORS=Object.freeze({
 forest:{stone:0xc6bd9e,shade:0x9f997e,trim:0xe1d4ad,foundation:0x827b65,cloth:0x607f77,gold:0xd6b675},
 volcano:{stone:0x8a7970,shade:0x5a5050,trim:0xb9a18a,foundation:0x413c40,cloth:0xa75b45,gold:0xe2b168},
 glacier:{stone:0xb9cbd0,shade:0x829ca9,trim:0xe3e8da,foundation:0x657d8c,cloth:0x507b94,gold:0xd8c99a},
 tempest:{stone:0xa5b3ae,shade:0x758b89,trim:0xd5d9bf,foundation:0x586e71,cloth:0x576c88,gold:0xd8bc77},
 moon:{stone:0xa7a2b8,shade:0x716e89,trim:0xd3c8d4,foundation:0x514f68,cloth:0x655776,gold:0xcab59a}
});
const TAU=Math.PI*2;
export function arenaBoundaryRadius(x,z){const length=Math.hypot(x,z);if(!length)return ARENA_BOUNDS+2.5;return Math.min(ARENA_BOUNDS+2.5,ARENA_BOUNDS*length/Math.max(Math.abs(x),Math.abs(z)));}
export function arenaBoundaryPoints(count=128){return Array.from({length:count},(_,i)=>{const angle=i/count*TAU,x=Math.sin(angle),z=Math.cos(angle),r=arenaBoundaryRadius(x,z);return{x:x*r,z:z*r};});}
export function createArenaBoundary({base}={}){
 const geometry=base||new T.BoxGeometry(),material=new T.MeshBasicMaterial({color:0xe4d3a3}),points=arenaBoundaryPoints(),root=new T.InstancedMesh(geometry,material,points.length),dummy=new T.Object3D();root.name='arena-playable-boundary';root.frustumCulled=false;
 for(const [i,p]of points.entries()){const next=points[(i+1)%points.length];dummy.position.set(p.x,.237,p.z);dummy.rotation.set(0,Math.atan2(next.x-p.x,next.z-p.z),0);dummy.scale.set(.11,.025,.43);dummy.updateMatrix();root.setMatrixAt(i,dummy.matrix);}root.instanceMatrix.needsUpdate=true;
 return{root,setTheme(key){material.color.setHex((COLISEUM_THEME_COLORS[key]||COLISEUM_THEME_COLORS.forest).trim);},dispose(){root.removeFromParent();if(!base)geometry.dispose();material.dispose();root.dispose();}};
}
export function coliseumLayout(){
 const boxes=[],seats=[],gates=[],rows=[{rx:28.2,rz:27.2,y:1.25},{rx:30.7,rz:29.6,y:2.8},{rx:33.2,rz:32,y:4.35},{rx:35.7,rz:34.4,y:5.9}];
 const box=(x,y,z,w,h,d,yaw,role)=>boxes.push({x,y,z,w,h,d,yaw,role});
 const local=(a,rx,rz,tangent,radial,y,w,h,d,role)=>box(Math.sin(a)*rx+Math.cos(a)*tangent+Math.sin(a)*radial,y,Math.cos(a)*rz-Math.sin(a)*tangent+Math.cos(a)*radial,w,h,d,a,role);
 const gap=a=>Math.abs(Math.sin(a*2))<.12;
 // Each terrace is a solid stepped seating mass with its own riser and lip.
 for(const [row,r]of rows.entries())for(let i=0;i<96;i++){const a=(i+.5)/96*TAU;if(gap(a))continue;const width=TAU*Math.min(r.rx,r.rz)/96+ .12;
  local(a,r.rx,r.rz,0,0,(r.y-.2)/2,width,r.y-.2,2.65,'shade');local(a,r.rx,r.rz,0,0,r.y,width,.35,2.7,'stone');local(a,r.rx,r.rz,0,-1.17,r.y+.22,width,.16,.22,'trim');
  if(i%2===0)local(a,r.rx,r.rz,0,.35,r.y+.31,width*.9,.18,.75,'foundation');
 }
 // The arcade facade leaves genuine dark openings between piers. Stepped
 // voussoirs describe arches without smooth imported models or textures.
 for(let i=0;i<40;i++){const a=(i+.5)/40*TAU;if(gap(a))continue;
  for(const side of [-1,1]){local(a,37.05,35.65,side*2.05,0,3.5,.7,6.6,1.2,'stone');local(a,37.05,35.65,side*2.05,.12,.35,1.1,.6,1.5,'foundation');local(a,37.05,35.65,side*2.05,.12,6.85,1.05,.3,1.5,'trim');}
  for(let step=0;step<3;step++)for(const side of [-1,1])local(a,37.05,35.65,side*(1.55-step*.47),0,5.35+step*.43,.58,.48,1.35,'trim');
  local(a,37.05,35.65,0,0,7.08,4.85,.42,1.5,'stone');local(a,37.05,35.65,0,.02,7.58,4.9,.28,1.7,'trim');
  if(i%2===0){local(a,37.05,35.65,0,.76,5.7,1.05,1.85,.12,'cloth');local(a,37.05,35.65,0,.84,5.8,.12,.85,.045,'gold');local(a,37.05,35.65,0,.84,5.8,.54,.12,.045,'gold');}
 }
 for(let i=0;i<4;i++){const a=i/4*TAU;gates.push({angle:a,x:Math.sin(a)*31.5,z:Math.cos(a)*30.5,width:5.8});
  for(const side of [-1,1]){local(a,31.5,30.5,side*3.1,0,3.85,1.45,7.8,3,'stone');local(a,31.5,30.5,side*3.1,0,.45,1.9,.65,3.4,'foundation');local(a,31.5,30.5,side*3.1,0,7.9,2,.45,3.5,'trim');
   for(let level=0;level<3;level++)local(a,31.5,30.5,side*(2.4-level*.5),0,6.1+level*.42,.65,.5,3,'trim');local(a,31.5,30.5,side*3.1,0,9.3,.85,2.2,1,'shade');local(a,31.5,30.5,side*3.1,0,10.45,1.3,.22,1.45,'gold');}
  local(a,31.5,30.5,0,0,8.65,7.7,.72,3.5,'stone');local(a,31.5,30.5,0,-1.82,8.7,5.6,.18,.14,'gold');local(a,31.5,30.5,0,-1.82,7.65,1.7,1.8,.12,'cloth');
  for(let step=0;step<6;step++)local(a,31.5,30.5,0,-4.5+step*.6,.1+step*.1,5.5,.18,.7,'stone');
 }
 for(const [row,r]of rows.entries())for(let i=0;i<80;i++){const a=(i+.5)/80*TAU;if(gap(a))continue;seats.push({x:Math.sin(a)*r.rx,z:Math.cos(a)*r.rz,y:r.y+.23,yaw:a+Math.PI,row,species:(i+row*3)%6,phase:(i*3+row)%8});}
 return{innerRx:26.8,innerRz:25.8,outerRx:38,outerRz:36.6,rows,boxes,seats,gates};
}

export function createColiseumArchitecture({base,material}={}){
 const layout=coliseumLayout(),root=new T.Group(),geometry=base||new T.BoxGeometry(1,1,1),ownGeometry=!base,stoneMaterial=material?.clone()||new T.MeshLambertMaterial({color:0xffffff}),mesh=new T.InstancedMesh(geometry,stoneMaterial,layout.boxes.length),dummy=new T.Object3D(),color=new T.Color();root.name='coliseum-architecture';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);
 for(const [i,b]of layout.boxes.entries()){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.yaw,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;
 function setTheme(key){const palette=COLISEUM_THEME_COLORS[key]||COLISEUM_THEME_COLORS.forest;for(const [i,b]of layout.boxes.entries())mesh.setColorAt(i,color.setHex(palette[b.role]));mesh.instanceColor.needsUpdate=true;}
 setTheme('forest');return{root,layout,setTheme,dispose(){root.removeFromParent();if(ownGeometry)geometry.dispose();stoneMaterial.dispose();mesh.dispose();}};
}
