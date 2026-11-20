import * as T from 'three';

export const MONSTER_NATIVE_FIRE_BUDGET=Object.freeze({creatures:32,anchors:96,flames:576,embers:192,drawCalls:2});
const hash=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
const seed=value=>typeof value==='number'&&Number.isFinite(value)?value:[...String(value)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// One pair of instance buffers serves every creature. This is intrinsic body
// fire; it never creates a burn status or alters simulation values.
export function createMonsterNativeFire({scene}){
 const B=MONSTER_NATIVE_FIRE_BUDGET,root=new T.Group(),geometry=new T.BoxGeometry(),flameMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.92,depthWrite:false,toneMapped:false}),emberMaterial=new T.MeshBasicMaterial({depthWrite:false,toneMapped:false}),flames=new T.InstancedMesh(geometry,flameMaterial,B.flames),embers=new T.InstancedMesh(geometry,emberMaterial,B.embers),dummy=new T.Object3D(),tint=new T.Color();
 root.name='monster-native-fire';root.visible=false;scene.add(root);flames.name='monster-native-flames';embers.name='monster-native-embers';
 for(const mesh of [flames,embers]){mesh.count=0;mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;mesh.renderOrder=2;root.add(mesh);}
 let last=-Infinity,world='',signature='',disposed=false,creatureCount=0,anchorCount=0;
 const clear=()=>{flames.count=embers.count=creatureCount=anchorCount=0;root.visible=false;};
 const put=(mesh,index,x,y,z,w,h,d,colour,angle)=>{dummy.position.set(x,y,z);dummy.rotation.set(.08*Math.sin(angle),angle,.07*Math.cos(angle));dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,tint.setHex(colour));};
 return{root,update(state,time,heightAt=()=>0,anchorsFor=()=>[]){
  if(disposed)return;
  if(!state||!Number.isFinite(time)||typeof anchorsFor!=='function'){clear();last=-Infinity;return;}
  const nextWorld=(state.options?.mode||'')+':'+(state.dungeon?.map?.seed??state.bonk?.map?.seed??''),frame=Math.floor(time*8);
  if(nextWorld!==world||frame<last){clear();world=nextWorld;signature='';last=-Infinity;}
  const hero=(state.units||[]).find(u=>u.alive&&u.hero)||{x:0,z:0},candidates=[];
  for(const u of state.units||[]){
   if(!u.alive||u.dungeonBurrowed||u.treeTagCaptured||u.kodoTagCaptured||!Number.isFinite(u.x)||!Number.isFinite(u.z))continue;
   const raw=anchorsFor(u);if(!Array.isArray(raw))continue;const anchors=raw.filter(finitePoint).slice(0,8);if(!anchors.length)continue;
   candidates.push({u,anchors,distance:(u.x-hero.x)**2+(u.z-hero.z)**2});
  }
  candidates.sort((a,b)=>a.distance-b.distance||seed(a.u.id)-seed(b.u.id));const selected=candidates.slice(0,B.creatures),nextSignature=selected.map(({u,anchors})=>u.id+':'+anchors.length).join('|');
  if(!selected.length){clear();signature='';last=frame;return;}
  if(frame===last&&nextSignature===signature)return;last=frame;signature=nextSignature;root.visible=true;creatureCount=selected.length;
  // Round robin keeps three fire sources on each creature even under a horde;
  // spare capacity then fills its remaining authored sources.
  const sources=[];
  for(let j=0;j<8&&sources.length<B.anchors;j++)for(const entry of selected)if(entry.anchors[j]){sources.push({...entry,anchor:entry.anchors[j],index:j});if(sources.length===B.anchors)break;}
  anchorCount=sources.length;const t=frame/8,bob=[0,.05,.1,.05,0,-.05,-.1,-.05][((frame%8)+8)%8];let fc=0,ec=0;
  for(const {u,anchor,index}of sources){
   const scale=clamp(Number.isFinite(u.size)?u.size:1,.1,5)*((u.avatar||0)>time?1.35:1),s=clamp(Number.isFinite(anchor.scale)?anchor.scale:1,.1,3)*scale,angle=Number.isFinite(u.facing)?u.facing:0,cos=Math.cos(angle),sin=Math.sin(angle),localX=anchor.x*scale,localZ=anchor.z*scale,x=u.x+localX*cos+localZ*sin,z=u.z-localX*sin+localZ*cos,ground=heightAt(u.x,u.z),y=(Number.isFinite(ground)?ground:0)+anchor.y*scale+(u.bonkJumpHeight||0)+(u.flying?(u.altitude||1.5)+bob:0),phase=seed(u.id)*.173+index*2.41;
   for(let j=0;j<6;j++){
    const life=(t*(.65+hash(phase+j)*.35)+j/6)%1,a=j*2.4+phase,taper=1-life,spread=(.12+life*.08)*s;
    put(flames,fc++,x+Math.sin(a+t*2)*spread,y+(.08+life*.75)*s,z+Math.cos(a+t*1.4)*spread,(.09+taper*.17)*s,(.15+taper*.32)*s,(.09+taper*.16)*s,j%3===0?0xffec9d:life>.55?0xd86c2e:0xffb346,a);
   }
   for(let j=0;j<2;j++){
    const life=(t*.52+j/2+hash(phase)*.5)%1,a=j*3.1+phase;
    put(embers,ec++,x+Math.sin(a)*life*.35*s,y+(.18+life*1.45)*s,z+Math.cos(a)*life*.35*s,.035*s,.065*s,.035*s,life>.7?0xc76a36:0xffd47a,a);
   }
  }
  flames.count=fc;embers.count=ec;for(const mesh of [flames,embers]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 },stats(){return{creatures:creatureCount,anchors:anchorCount,flames:flames.count,embers:embers.count,drawCalls:root.visible?2:0};},dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();flames.dispose();embers.dispose();geometry.dispose();flameMaterial.dispose();emberMaterial.dispose();root.clear();}};
}
