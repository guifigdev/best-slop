import * as T from 'three';
import {RO_EQUIPMENT} from '../shared/ragnarok-equipment.js';
import {roGroundExpired,roGroundFade} from '../shared/ro-ground-lifetime.js';
import {RO_GROUND_ICON_ATLAS,RO_GROUND_ICON_FRAMES} from './ro-ground-icon-atlas.js';
export const RO_GROUND_ITEM_BUDGET=Object.freeze({items:96,distance:40,drawCalls:1,textureBytes:4194304});
export function roGroundItemFrame(pickup){
 if(pickup?.type==='consumable')return RO_GROUND_ICON_FRAMES[pickup.key==='potion'?501:505]||null;
 const d=RO_EQUIPMENT[pickup?.item?.key];if(!d)return null;
 if(RO_GROUND_ICON_FRAMES[d.sourceId])return RO_GROUND_ICON_FRAMES[d.sourceId];
 const reference=Object.values(RO_EQUIPMENT).find(r=>r.slot===d.slot&&r.weaponType===d.weaponType&&RO_GROUND_ICON_FRAMES[r.sourceId]);
 return RO_GROUND_ICON_FRAMES[reference?.sourceId]||null;
}
export function roGroundItemEntries(pickups,hero){return (pickups||[]).filter(p=>!p.used&&!roGroundExpired(p)&&roGroundItemFrame(p)&&Math.hypot(p.x-hero.x,p.z-hero.z)<RO_GROUND_ITEM_BUDGET.distance).sort((a,b)=>Math.hypot(a.x-hero.x,a.z-hero.z)-Math.hypot(b.x-hero.x,b.z-hero.z)).slice(0,RO_GROUND_ITEM_BUDGET.items);}
export function createRoGroundItemArt({parent,heightAt=()=>0,loadTexture=url=>typeof document==='undefined'?new T.Texture():new T.TextureLoader().load(url)}){
 const B=RO_GROUND_ITEM_BUDGET,geometry=new T.PlaneGeometry(1,1),frames=new T.InstancedBufferAttribute(new Float32Array(B.items*4),4),alpha=new T.InstancedBufferAttribute(new Float32Array(B.items),1);
 geometry.setAttribute('dropFrame',frames);geometry.setAttribute('dropAlpha',alpha);
 const texture=loadTexture(RO_GROUND_ICON_ATLAS);texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.02,depthWrite:false,toneMapped:false,side:T.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec4 dropFrame;attribute float dropAlpha;varying vec4 vDropFrame;varying float vDropAlpha;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDropFrame=dropFrame;vDropAlpha=dropAlpha;');
  shader.fragmentShader='varying vec4 vDropFrame;varying float vDropAlpha;\n'+shader.fragmentShader.replace('#include <map_fragment>','vec4 sampledDiffuseColor=texture2D(map,vDropFrame.xy+vMapUv*vDropFrame.zw);diffuseColor*=sampledDiffuseColor;diffuseColor.a*=vDropAlpha;');
 };
 material.customProgramCacheKey=()=> 'ro-original-ground-item-sprites-v1';
 const mesh=new T.InstancedMesh(geometry,material,B.items),dummy=new T.Object3D();mesh.name='ro-original-ground-item-sprites';mesh.frustumCulled=false;mesh.count=0;parent.add(mesh);let camera=null,shown=[],disposed=false;
 const ready=()=>!!texture.image;
 function place(time){shown.forEach((p,i)=>{dummy.position.set(p.x,heightAt(p.x,p.z)+.72+Math.sin(time*1.7+Number(p.id||0))*.045,p.z);dummy.quaternion.copy(camera?.quaternion||new T.Quaternion());dummy.scale.setScalar(p.type==='equipment'?1.05:.8);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);frames.setXYZW(i,...roGroundItemFrame(p));alpha.setX(i,roGroundFade(p));});mesh.count=shown.length;mesh.visible=!!mesh.count;if(mesh.count){mesh.instanceMatrix.needsUpdate=true;frames.needsUpdate=alpha.needsUpdate=true;}}
 let lastTime=0;
 return{handles:p=>ready()&&!!roGroundItemFrame(p),update(state,time){if(disposed)return;lastTime=time;const hero=state?.units?.find(u=>u.bonkHero&&u.alive!==false)||{x:0,z:0};shown=ready()?roGroundItemEntries(state?.bonk?.pickups,hero):[];place(time);},cull(viewCamera){camera=viewCamera;place(lastTime);},reset(){shown=[];mesh.count=0;mesh.visible=false;},stats:()=>({sprites:mesh.count,drawCalls:mesh.count?1:0,textureBytes:B.textureBytes,atlas:ready()}),dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();texture.dispose();}};
}
