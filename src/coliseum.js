import * as T from 'three';
import {ARENAS} from '../shared/arenas.js';

const HOP=[0,.13,.35,.52,.35,.13,0,0],ARM=[0,.4,1.3,2.6,2.8,2.3,1.2,.3];
export function createColiseum(scene,tiles,environment,sun,base,material){
 let current=null,preview='forest',lastFrame=-1,cheerUntil=0,lastTime=0;const seen=new Set(),hazards=new T.Group();scene.add(hazards);
 const count=72,parts={body:new T.InstancedMesh(base,material,count),head:new T.InstancedMesh(base,material,count),left:new T.InstancedMesh(base,material,count),right:new T.InstancedMesh(base,material,count)};
 const dummy=new T.Object3D(),color=new T.Color(),frames={idle:[],cheer:[]};
 const spectators=Array.from({length:count},(_,i)=>{const a=(i+.5)/count*Math.PI*2,r=18.7+(i%2)*.7;return{x:Math.sin(a)*r,z:Math.cos(a)*r,y:1+(i%2)*.4,yaw:a+Math.PI,color:[0xb88b64,0xeee4cd,0xd8935f,0x8fa67e,0xa7a0b1,0xcfc89e][i%6]};});
 function matrix(p,x,y,z,w,h,d,rz=0){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);dummy.position.set(p.x+x*c+z*s,p.y+y,p.z-x*s+z*c);dummy.scale.set(w,h,d);dummy.rotation.set(0,p.yaw,rz);dummy.updateMatrix();return dummy.matrix.clone();}
 for(const mode of ['idle','cheer'])for(let f=0;f<8;f++){const frame={body:[],head:[],left:[],right:[]};for(const [i,p]of spectators.entries()){const n=(f+i)%8,hop=mode==='cheer'?HOP[n]:0,angle=mode==='cheer'?ARM[n]:.12;frame.body.push(matrix(p,0,.2+hop,0,.55,.65,.55));frame.head.push(matrix(p,0,.78+hop,.1,.55,.5,.55));frame.left.push(matrix(p,-.39,.25+hop+(mode==='cheer'?.35:0),0,.18,.65,.2,-angle));frame.right.push(matrix(p,.39,.25+hop+(mode==='cheer'?.35:0),0,.18,.65,.2,angle));}frames[mode].push(frame);}
 for(const [key,mesh]of Object.entries(parts)){for(let i=0;i<count;i++)mesh.setColorAt(i,color.setHex(key==='head'?spectators[i].color: key==='body'?[0x6d8d6a,0xb39064,0x8d80a1][i%3]:spectators[i].color));mesh.castShadow=true;scene.add(mesh);}
 const weather=new T.InstancedMesh(base,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,depthWrite:false}),90);scene.add(weather);
 const ringGeo=new T.RingGeometry(.9,1,40),materials=new Map();
 function hazardMat(hex){if(!materials.has(hex))materials.set(hex,new T.MeshBasicMaterial({color:hex,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));return materials.get(hex);}
 const meshById=new Map();
 function theme(key){if(current===key)return;current=key;const a=ARENAS[key];scene.background.setHex(a.sky);scene.fog.color.setHex(a.sky);environment.material.color.setHex(a.tint);weather.material.color.setHex(a.particle);sun.color.setHex(key==='volcano'?0xffb781:key==='glacier'?0xe4f3ff:key==='moon'?0xd4c4fa:0xffeccb);
  let index=0;for(let x=-16;x<16;x++)for(let z=-16;z<16;z++){const r=Math.hypot(x+.5,z+.5);tiles.setColorAt(index++,color.setHex(r>12.5&&r<14.5?a.rim:a.floor[(x*x+z*z)%a.floor.length]));}tiles.instanceColor.needsUpdate=true;
 }
 function update(state,now){const key=state?.arena||preview,a=ARENAS[key],time=state?.time??now/1000;theme(key);if(time<lastTime){seen.clear();cheerUntil=0;lastFrame=-1;}lastTime=time;
  for(const e of state?.effects||[]){if(seen.has(e.id))continue;seen.add(e.id);if(['critical','fireball','stomp','thunder','levelup','bonus'].includes(e.type))cheerUntil=time+(e.type==='critical'?1.4:2.3);}if(seen.size>5000)seen.clear();
  const f=Math.floor(time*8),mode=time<cheerUntil?'cheer':'idle';if(f!==lastFrame){lastFrame=f;for(const [key,mesh]of Object.entries(parts)){const frame=frames[mode][f%8][key];for(let i=0;i<count;i++)mesh.setMatrixAt(i,frame[i]);mesh.instanceMatrix.needsUpdate=true;}}
  const zones=state?.zones||a.zones.map((z,i)=>({...z,id:key+i}));
  for(const z of zones){let entry=meshById.get(z.id);if(!entry){const group=new T.Group(),hex=z.type==='lava'?0xf39e45:z.type==='ice'?0x99d0e3:z.type==='frost'?0xd4e5ff:z.type==='water'?0x659fc6:0xff976b;const fill=new T.Mesh(new T.CircleGeometry(z.r,32),hazardMat(hex));fill.rotation.x=-Math.PI/2;group.add(fill);const outline=new T.Mesh(ringGeo,hazardMat(z.type==='lava'?0xffdf7c:0xe0f3ff));outline.rotation.x=-Math.PI/2;outline.scale.setScalar(z.r);outline.position.y=.015;group.add(outline);
    for(let i=0;i<10;i++){const m=new T.Mesh(base,hazardMat(hex));m.position.set(Math.sin(i*2.4)*(z.r*.65),.1,Math.cos(i*2.4)*(z.r*.65));m.scale.set(z.type==='lava'?.7:.13,z.type==='ice'?.04:.5,z.type==='lava'?.45:.13);group.add(m);}group.position.set(z.x,.26,z.z);hazards.add(group);entry={group,type:z.type};meshById.set(z.id,entry);}
   const g=entry.group;if(z.type==='trap'){const phase=(time+(z.offset||0))%(z.period||6);g.visible=phase<2;g.children[1].material.color.setHex(phase<1.5?0xffda89:0xff5945);}g.children[0].material.opacity=z.type==='ice'?.38:z.type==='frost'?.22:.7;g.children[1].material.opacity=.5+Math.sin(time*4)*.3;if(z.type!=='ice')for(const [i,m]of g.children.slice(2).entries())m.position.y=.1+(Math.sin(Math.floor(time*8)*.6+i)+1)*(z.type==='lava'?.12:.4);
  }
  for(const [id,entry]of meshById)if(!zones.some(z=>z.id===id)){hazards.remove(entry.group);entry.group.children[0].geometry.dispose();meshById.delete(id);}
  for(let i=0;i<90;i++){const x=((i*7.31)%38)-19,z=((i*13.17)%38)-19,t=(time*(key==='tempest'?1.5:.5)+i*.17)%1;dummy.position.set(x+(key==='glacier'?Math.sin(time+i):0),10*(1-t),z);dummy.rotation.set(0,0,key==='tempest'?.3:0);dummy.scale.set(key==='volcano'?.07:.04,key==='tempest'?.65:key==='glacier'?.09:.22,.04);dummy.updateMatrix();weather.setMatrixAt(i,dummy.matrix);}weather.instanceMatrix.needsUpdate=true;weather.visible=key!=='moon'||Math.floor(time)%5<3;
 }
 environment.material=new T.MeshLambertMaterial({vertexColors:true});
 return{update,setExpanded(value){for(const mesh of Object.values(parts))mesh.visible=!value;},setPreview(key){preview=key;theme(key);},cheer(){cheerUntil+=2;}};
}
