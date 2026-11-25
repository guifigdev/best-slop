import * as T from 'three';
import {RO_CARDS} from '../shared/ragnarok-equipment.js';
import {roCardRarityVisual} from '../shared/ro-card-rarity.js';
export const RO_CARD_DROP_DURATION=18;
// One shared body batch and one translucent beacon batch for eight discoveries.
export function createRoCardDropArt({scene,container}){
 const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial({toneMapped:false}),glow=new T.MeshBasicMaterial({transparent:true,opacity:.26,depthWrite:false,toneMapped:false}),body=new T.InstancedMesh(geometry,material,128),beams=new T.InstancedMesh(geometry,glow,8),dummy=new T.Object3D(),color=new T.Color(),point=new T.Vector3();
 body.name='ro-rarity-card-drops';beams.name='ro-rarity-card-beacons';body.frustumCulled=beams.frustumCulled=false;body.count=beams.count=0;scene.add(body,beams);
 let labels=null,disposed=false,keys=[];const labelPool=new Map();if(container?.ownerDocument){labels=container.ownerDocument.createElement('div');labels.className='ro-card-world-labels';container.append(labels);}
 function update(drops,state,time,heightAt=()=>0,camera,ownerId){
  if(disposed)return;body.count=beams.count=0;keys=[];const shown=new Set();if(state?.options?.mode!=='bonk'){if(labels)labels.replaceChildren();labelPool.clear();return;}
  const owner=state.units?.find(u=>u.id===ownerId)||state.units?.find(u=>u.bonkHero&&!u.bonkEnemy);
  for(const drop of drops.slice(-8)){const card=RO_CARDS[drop.key],age=time-drop.at;if(!card||age<0||age>=RO_CARD_DROP_DURATION)continue;const rarity=roCardRarityVisual(card),fly=Math.max(0,(age-16)/2),x=drop.x+((owner?.x??drop.x)-drop.x)*fly,z=drop.z+((owner?.z??drop.z)-drop.z)*fly,floor=heightAt(x,z),y=floor+.72+Math.sin(time*3)*.1+fly*.8,yaw=time*.6;
   const add=(dx,dy,dz,w,h,d,tint)=>{dummy.position.set(x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y+dy,z+dz*Math.cos(yaw)-dx*Math.sin(yaw));dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();body.setMatrixAt(body.count,dummy.matrix);body.setColorAt(body.count++,color.set(tint));};
   add(0,0,0,.62,.86,.09,rarity.color);for(const side of [-1,1]){add(0,0,side*.052,.49,.72,.025,0xfff0cd);add(0,.06,side*.071,.18,.24,.02,rarity.color);add(0,-.22,side*.071,.31,.035,.02,rarity.color);add(0,.29,side*.071,.28,.03,.02,rarity.color);}
   dummy.position.set(x,floor+1.85,z);dummy.rotation.set(0,0,0);dummy.scale.set(.16,3.7,.16);dummy.updateMatrix();beams.setMatrixAt(beams.count,dummy.matrix);beams.setColorAt(beams.count++,color.set(rarity.color));keys.push(rarity.id);
   if(labels&&camera){point.set(x,y+1,z).project(camera);if(point.z>=-1&&point.z<=1){const id=drop.id??drop.key+':'+drop.at;shown.add(id);let el=labelPool.get(id);if(!el){el=container.ownerDocument.createElement('div');el.className='ro-card-world-label';labelPool.set(id,el);labels.append(el);el.textContent=card.name;const sub=container.ownerDocument.createElement('small');sub.textContent=rarity.name+' · Carta conquistada';el.append(sub);}el.style.setProperty('--ro-card-rarity',rarity.color);el.style.left=(point.x*.5+.5)*container.clientWidth+'px';el.style.top=(-point.y*.5+.5)*container.clientHeight+'px';}}
  }
  for(const [id,el]of labelPool)if(!shown.has(id)){el.remove();labelPool.delete(id);}
  if(body.count){body.instanceMatrix.needsUpdate=body.instanceColor.needsUpdate=true;}if(beams.count){beams.instanceMatrix.needsUpdate=beams.instanceColor.needsUpdate=true;}
 }
 return{update,stats:()=>({cards:beams.count,rarities:[...keys],drawCalls:beams.count?2:0}),dispose(){if(disposed)return;disposed=true;labels?.remove();body.removeFromParent();beams.removeFromParent();body.dispose();beams.dispose();geometry.dispose();material.dispose();glow.dispose();}};
}
