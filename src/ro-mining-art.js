import * as T from 'three';
import {RO_MATERIALS} from '../shared/ro-crafting.js';
export const RO_MINING_ART_BUDGET=Object.freeze({nodes:24,miners:4,recipes:16,instances:1024,drawCalls:1,planes:0});
export function roOreVeinParts(node,time,heightAt=()=>0){
 const c=node.used?0x555d5e:RO_MATERIALS[node.material]?.color||0x9e8973,y=heightAt(node.x,node.z),parts=[],b=(x,h,z,w,height,d,color)=>parts.push([node.x+x,y+h,node.z+z,w,height,d,color,0]),scale=node.used?.55:1;
 b(0,.22*scale,0,1.05,.44*scale,.84,0x4b5251);b(-.28,.32*scale,-.11,.58,.54*scale,.66,0x68706b);b(.28,.30*scale,.10,.55,.46*scale,.71,0x788077);b(.06,.54*scale,-.13,.40,.22*scale,.40,0x59615e);
 if(!node.used)for(let i=0;i<9;i++){const x=Math.sin(i*2.4)*.38,z=Math.cos(i*2.4)*.31;b(x,.40+Math.sin(i*1.7)*.07,z,.13,i%3===0?.25:.12,.13,c);}
 return parts;
}
export function roMiningToolParts(unit,elapsed,heightAt=()=>0){
 if(!unit.roMining)return[];const age=elapsed-unit.roMining.started,cycle=(age*1.7)%1,angle=.1+Math.pow(Math.sin(cycle*Math.PI),2)*2.15,yaw=unit.facing||0,c=Math.cos(yaw),s=Math.sin(yaw),base=heightAt(unit.x,unit.z),parts=[],b=(x,y,z,w,h,d,color)=>parts.push([unit.x+c*x+s*z,base+y,unit.z-s*x+c*z,w,h,d,color,yaw]);
 for(let i=0;i<7;i++){const q=i/6;b(.34,1.05-q*.22,q*.65,.12,.12,.12,i>4?0xdab18a:0x786451);}
 b(.34,.84,.67,.14,.13,.12,0xdab18a);
 for(let i=0;i<10;i++){const q=i/9;b(.34,.84+Math.cos(angle)*q*.58,.67+Math.sin(angle)*q*.58,.055,.055,.055,i%3?0x785130:0xb28a55);}
 const y=.84+Math.cos(angle)*.58,z=.67+Math.sin(angle)*.58;b(.34,y,z,.46,.095,.10,0x9fb2ba);b(.09,y-.035,z,.10,.13,.10,0xd8e3dd);b(.57,y-.06,z,.075,.18,.09,0x657782);
 return parts;
}
export function createRoMiningArt({scene}){
 const B=RO_MINING_ART_BUDGET,g=new T.BoxGeometry(1,1,1),m=new T.MeshLambertMaterial(),mesh=new T.InstancedMesh(g,m,B.instances),dummy=new T.Object3D(),color=new T.Color();mesh.name='ro-ore-veins-and-mining';mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);let disposed=false;
 const handles=e=>['roOreChips','roCraftComplete'].includes(e?.type);
 return{handles,update(state,time,heightAt=()=>0,{hiddenMiner=null}={}){if(disposed)return;let n=0;const put=parts=>{for(const [x,y,z,w,h,d,c,yaw=0]of parts){if(n>=B.instances)break;dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,color.setHex(c));}};
  if(state?.options?.mode==='bonk'){for(const node of (state.bonk?.objects||[]).filter(o=>o.type==='oreVein').slice(0,B.nodes))put(roOreVeinParts(node,time,heightAt));for(const unit of (state.units||[]).filter(u=>u.alive&&u.roMining&&u.id!==hiddenMiner).slice(0,B.miners))put(roMiningToolParts(unit,state.bonk.elapsed,heightAt));
   for(const recipe of (state.bonk?.pickups||[]).filter(p=>p.type==='recipe').slice(-B.recipes)){const y=heightAt(recipe.x,recipe.z)+.3+Math.sin(time*2+Number(recipe.id))*.035;put([[recipe.x,y,recipe.z,.30,.07,.38,0xd8c6a0,.2],[recipe.x-.15,y+.02,recipe.z,.08,.11,.39,0xa17c4a,.2],[recipe.x+.15,y+.02,recipe.z,.08,.11,.39,0xa17c4a,.2],[recipe.x,y+.045,recipe.z,.06,.012,.26,0x735d43,.2]]);}
   for(const e of (state.effects||[]).filter(e=>handles(e)&&time>=e.time&&time-e.time<.6).slice(-8)){const age=time-e.time,fade=1-age/.6;for(let i=0;i<12;i++){const a=i*2.4,r=age*(.7+i%3*.2),y=heightAt(e.x,e.z)+.35+age*2-age*age*4,sz=.04*fade;put([[e.x+Math.sin(a)*r,y,e.z+Math.cos(a)*r,sz,sz,sz,e.type==='roCraftComplete'?0xe0c47a:RO_MATERIALS[e.material]?.color||0xa3a999,a]]);}}
  }mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
 },reset(){mesh.count=0;},stats:()=>({instances:mesh.count,drawCalls:mesh.count?1:0,planes:0}),dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();g.dispose();m.dispose();}};
}
