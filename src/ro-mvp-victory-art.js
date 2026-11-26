import * as T from 'three';
export const RO_MVP_VICTORY_DURATION=4;
const letters=['10001/11011/10101/10001/10001','10001/10001/10001/01010/00100','11110/10001/11110/10000/10000'];
export function roMvpVictoryVoxels(){
 const parts=[];
 // Stepped cloud plaque, real thickness, an embossed gold edge and red letters.
 for(let y=-4;y<=4;y++)for(let x=-11;x<=11;x++){
  if(Math.abs(x)>9&&Math.abs(y)>2)continue;
  const edge=Math.abs(y)===4||Math.abs(x)===(Math.abs(y)>2?9:11);
  parts.push([x*.14,y*.14,0,.14,.14,.25,edge?0xd5a24c:0xfff3d5]);
 }
 letters.forEach((glyph,n)=>glyph.split('/').forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel==='1')parts.push([(n*6+x-8)*.14,(2-y)*.14,.19,.13,.13,.15,0xe36b53]);})));
 for(const side of [-1,1])for(let i=0;i<3;i++)parts.push([side*(.3+i*.18),.9+(.12*(i%2)),0,.16,.22+i*.04,.16,0xffcf63]);
 return parts;
}
export function createRoMvpVictoryArt({scene}){
 const parts=roMvpVictoryVoxels(),geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial({transparent:true,toneMapped:false,depthWrite:false}),mesh=new T.InstancedMesh(geometry,material,parts.length*2),dummy=new T.Object3D(),local=new T.Vector3(),color=new T.Color(),active=new Map(),seen=new Set();
 mesh.name='ro-mvp-voxel-balloon';mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);let lastTime=-Infinity,world=null;
 function reset(){active.clear();seen.clear();mesh.count=0;}
 return {update(state,time,heightAt,camera,visualTime=performance.now()/1000){
  mesh.count=0;const key=state?.bonk?.map?.seed;if(time<lastTime||world!==null&&key!==world)reset();lastTime=time;world=key;
  if(state?.options?.mode!=='bonk'){reset();return;}
  for(const e of state.effects||[])if(e.type==='roMvpVictory'&&!seen.has(e.id)&&time-e.time<RO_MVP_VICTORY_DURATION){seen.add(e.id);if(active.size>=2)active.delete(active.keys().next().value);active.set(e.id,{event:e,start:visualTime-Math.max(0,time-e.time)});}
  let opacity=0;
  for(const [id,{event:e,start}]of active){const age=visualTime-start;if(age<0||age>=RO_MVP_VICTORY_DURATION){active.delete(id);continue;}const unit=state.units?.find(u=>u.id===e.source),x=unit?.x??e.x,z=unit?.z??e.z,scale=Math.min(1,age/.18)*Math.min(1,(RO_MVP_VICTORY_DURATION-age)/.4);opacity=Math.max(opacity,scale);
   for(const [lx,ly,lz,w,h,d,tint]of parts){local.set(lx*scale,ly*scale,lz*scale).applyQuaternion(camera.quaternion);dummy.position.set(x,(heightAt(x,z)||0)+4.4+Math.sin(age*2)*.12,z).add(local);dummy.quaternion.copy(camera.quaternion);dummy.scale.set(w*scale,h*scale,d*scale);dummy.updateMatrix();const i=mesh.count++;mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.setHex(tint));}
  }
  if(seen.size>512){seen.clear();for(const id of active.keys())seen.add(id);}material.opacity=opacity;mesh.visible=mesh.count>0;if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
 },reset,stats:()=>({balloons:active.size,voxels:mesh.count,drawCalls:mesh.count?1:0}),dispose(){reset();mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
