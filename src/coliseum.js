import {ARENA_BOUNDS,ARENA_TILE_HALF} from '../shared/arena-size.js';
import * as T from 'three';
import {ARENAS} from '../shared/arenas.js';
import {createColiseumArchitecture,createArenaBoundary,arenaBoundaryRadius} from './coliseum-architecture.js';
import {createHazardArt} from './hazard-art.js';
import {createColiseumMoat} from './coliseum-moat.js';
import {createColiseumWeather} from './coliseum-weather.js';
const HOP=[0,.07,.22,.38,.22,.07,0,0],ARM=[0,.4,1.3,2.2,2.6,1.7,.8,.15];
export function createColiseum(scene,tiles,environment,sun,base,material){
 const originalEnvironmentMaterial=environment?.material,environmentMaterial=originalEnvironmentMaterial?.clone();if(environmentMaterial)environment.material=environmentMaterial;
 const architecture=createColiseumArchitecture({base,material}),boundary=createArenaBoundary({base}),hazards=createHazardArt({base,heightAt:()=>.2}),moat=createColiseumMoat({base}),audience=new T.Group();audience.name='coliseum-audience';scene.add(architecture.root,boundary.root,hazards.root,moat.root,audience);
 let current=null,preview='forest',lastFrame=-1,lastMode='',cheerUntil=0,lastTime=0,expanded=false,eligible=true,disposed=false;const seen=new Set(),dummy=new T.Object3D(),color=new T.Color(),seats=architecture.layout.seats,count=seats.length;
 const crowdMaterial=new T.MeshLambertMaterial({color:0xffffff}),parts={},frames={idle:[],cheer:[]},partCounts={body:count,head:count,left:count,right:count,ears:count*2,eyes:count*2,muzzle:count,feet:count*2};
 for(const [key,n]of Object.entries(partCounts)){const mesh=new T.InstancedMesh(base,crowdMaterial,n);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;parts[key]=mesh;audience.add(mesh);}
 const fur=[0xb89570,0xe9e1cf,0xd69257,0x99b784,0xab9074,0xaaa89c],cloth=[0x627f80,0xb4775f,0x72718e,0x9a895d,0x748866];
 function put(buffer,index,p,x,y,z,w,h,d,roll=0){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);dummy.position.set(p.x+x*c+z*s,p.y+y,p.z-x*s+z*c);dummy.rotation.set(0,p.yaw,roll);dummy.scale.set(w,h,d);dummy.updateMatrix();dummy.matrix.toArray(buffer,index*16);}
 // Poses are baked once; cheers copy eight instanced matrix buffers at 8 Hz.
 for(const mode of ['idle','cheer'])for(let f=0;f<8;f++){
  const frame=Object.fromEntries(Object.entries(partCounts).map(([key,n])=>[key,new Float32Array(n*16)]));
  for(const [i,p]of seats.entries()){const n=(f+p.phase)%8,hop=mode==='cheer'?HOP[n]:0,angle=mode==='cheer'?ARM[n]:.16,rabbit=p.species===1,fox=p.species===2,bird=p.species===4;
   put(frame.body,i,p,0,.42+hop,0,.62,.67,.54);put(frame.head,i,p,0,.99+hop,.04,.66,.55,.6);put(frame.left,i,p,-.43,.4+hop+(mode==='cheer'?.22:0),.04,.18,.59,.22,-angle);put(frame.right,i,p,.43,.4+hop+(mode==='cheer'?.22:0),.04,.18,.59,.22,angle);
   for(const sign of [-1,1]){const j=i*2+(sign===1?1:0);put(frame.ears,j,p,sign*.22,1.37+hop+(rabbit?.15:0),.02,rabbit?.16:.2,rabbit?.6:fox?.32:.2,.19);put(frame.eyes,j,p,sign*.17,1.05+hop,.35,.085,.11,.035);put(frame.feet,j,p,sign*.2,.08+hop,.34,.2,.17,.35);}
   put(frame.muzzle,i,p,0,.87+hop,.39,bird?.22:.4,bird?.21:.2,bird?.24:.17);
  }frames[mode].push(frame);
 }
 for(const [i,p]of seats.entries())for(const [key,mesh]of Object.entries(parts)){const hex=key==='body'?cloth[(i+p.row)%cloth.length]:key==='eyes'?0x273c33:key==='muzzle'?p.species===4?0xd6b064:0xddd0ad:fur[p.species];if(['ears','eyes','feet'].includes(key)){mesh.setColorAt(i*2,color.setHex(hex));mesh.setColorAt(i*2+1,color);}else mesh.setColorAt(i,color.setHex(hex));}
 const weather=createColiseumWeather({base});scene.add(weather.root);
 function visibility(){const visible=eligible&&!expanded;architecture.root.visible=boundary.root.visible=audience.visible=visible;moat.root.visible=visible;hazards.setVisible(visible);weather.setVisible(visible);}
 function theme(key){if(current===key)return;current=key;const a=ARENAS[key];architecture.setTheme(key);boundary.setTheme(key);moat.setTheme(key);weather.setTheme(key);scene.background?.setHex?.(a.sky);scene.fog?.color?.setHex?.(a.sky);environment?.material?.color?.setHex?.(a.rim);sun?.color?.setHex?.(key==='volcano'?0xffb781:key==='glacier'?0xe4f3ff:key==='moon'?0xd4c4fa:0xffeccb);
  let index=0;for(let x=-ARENA_TILE_HALF;x<ARENA_TILE_HALF;x++)for(let z=-ARENA_TILE_HALF;z<ARENA_TILE_HALF;z++){const px=x+.5,pz=z+.5,r=Math.hypot(px,pz),edge=arenaBoundaryRadius(px,pz),hex=Math.abs(r-edge)<.6||r>edge?a.rim:a.floor[(x*x+z*z)%a.floor.length];tiles.setColorAt(index++,color.setHex(hex));}if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;
 }
 function update(state,now=0){if(disposed)return;const key=Object.hasOwn(ARENAS,state?.arena||preview)?state?.arena||preview:'forest';theme(key);eligible=!state?.field&&!['castlefight','linewars','treetag','warlock','kodotag','phasekiller'].includes(state?.options?.mode);visibility();if(!eligible)return;const a=ARENAS[key],time=state?.time??now/1000;if(time<lastTime){seen.clear();cheerUntil=0;lastFrame=-1;}lastTime=time;
  for(const e of state?.effects||[]){if(seen.has(e.id))continue;seen.add(e.id);if(['critical','fireball','stomp','thunder','levelup','bonus'].includes(e.type))cheerUntil=Math.max(cheerUntil,time+(e.type==='critical'?1.4:2.3));}if(seen.size>5000)seen.clear();
  const frame=Math.floor(time*8),mode=time<cheerUntil?'cheer':'idle';if(frame!==lastFrame||mode!==lastMode){lastFrame=frame;lastMode=mode;for(const [key,mesh]of Object.entries(parts)){mesh.instanceMatrix.array.set(frames[mode][((frame%8)+8)%8][key]);mesh.instanceMatrix.needsUpdate=true;}}
  hazards.update(state?.zones||a.zones.map((zone,i)=>({...zone,id:key+i})),time);
  if(moat.root.visible)moat.update(time);
  if(!expanded)weather.update(key,time,state?.zones||a.zones);visibility();
 }
 return{update,setExpanded(value){expanded=!!value;visibility();},setPreview(key){if(Object.hasOwn(ARENAS,key)){preview=key;if(eligible)theme(key);}},cheer(){cheerUntil=Math.max(cheerUntil,lastTime+2);},dispose(){if(disposed)return;disposed=true;architecture.dispose();boundary.dispose();hazards.dispose();moat.dispose();weather.dispose();audience.removeFromParent();for(const mesh of Object.values(parts))mesh.dispose();crowdMaterial.dispose();if(environment?.material===environmentMaterial)environment.material=originalEnvironmentMaterial;environmentMaterial?.dispose();},architecture:architecture.root,boundary:boundary.root,hazards:hazards.root,moat:moat.root,weather:weather.root,audience};
}
