import * as T from 'three';

const validPoint=value=>Number.isFinite(value?.x)&&Number.isFinite(value?.z);
const live=value=>value&&value.alive!==false&&validPoint(value);
const casterHeight=u=>.18+1.42*(Number.isFinite(u?.size)?u.size:1);

// A single shared cube supplies the ropes, voxel links and small control marks.
// All geometry stays in world coordinates; the parent owns any scene transform.
export function createWarlockTethers({parent}){
 const root=new T.Group();root.name='warlock-tethers';root.visible=false;parent.add(root);
 const geometry=new T.BoxGeometry(1,1,1),beamMaterial=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,toneMapped:false}),chainMaterial=new T.MeshLambertMaterial({color:0xffffff}),controlMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),batches=new Map(),matrix=new T.Object3D(),colour=new T.Color(),axis=new T.Vector3(0,1,0),direction=new T.Vector3();let disposed=false;
 function ensure(name,count,material){let mesh=batches.get(name);if(mesh&&mesh.instanceMatrix.count>=count)return mesh;if(mesh){mesh.removeFromParent();mesh.dispose();}const capacity=Math.max(1,2**Math.ceil(Math.log2(Math.max(1,count))));mesh=new T.InstancedMesh(geometry,material,capacity);mesh.name=name;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);batches.set(name,mesh);return mesh;}
 function put(mesh,index,point,scale,hex,rotation){matrix.position.copy(point);matrix.scale.set(...scale);matrix.quaternion.copy(rotation);matrix.updateMatrix();mesh.setMatrixAt(index,matrix.matrix);mesh.setColorAt(index,colour.setHex(hex));}
 function finish(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 function clear(){for(const mesh of batches.values())mesh.count=0;root.visible=false;}
 return{
  root,
  update(snapshot,time=snapshot?.time||0){
   if(disposed)return;if(snapshot?.options?.mode!=='warlock'||!snapshot.warlock){clear();return;}
   const war=snapshot.warlock,units=new Map((snapshot.units||[]).filter(live).map(u=>[u.id,u])),pillars=new Map((war.pillars||[]).filter(live).map(p=>[p.id,p])),tethers=[],pose=Math.floor((Number.isFinite(time)?time:0)*8),pulse=[1,1.015,1.03,1.015,1,.985,.97,.985][((pose%8)+8)%8];
   for(const link of war.links||[]){const source=units.get(link.source),target=link.targetKind==='pillar'?pillars.get(link.target):units.get(link.target);if(!source||!target)continue;tethers.push({a:new T.Vector3(source.x,casterHeight(source),source.z),b:new T.Vector3(target.x,link.targetKind==='pillar'?Math.max(1,(target.height||2.6)+.15):casterHeight(target),target.z),returning:false});}
   for(const missile of war.projectiles||[]){if(missile.family!=='link'||missile.alive===false||!validPoint(missile))continue;const source=units.get(missile.source);if(!source)continue;tethers.push({a:new T.Vector3(source.x,casterHeight(source),source.z),b:new T.Vector3(missile.x,Number.isFinite(missile.height)?missile.height:.9,missile.z),returning:!!missile.returning});}
   const controls=[...units.values()].filter(u=>u.wlControl&&(!Number.isFinite(u.wlControl.until)||u.wlControl.until>time)),beamCount=tethers.length,chainCount=tethers.reduce((n,t)=>n+Math.max(2,Math.min(128,Math.ceil(t.a.distanceTo(t.b)/.45)))+2,0),beams=ensure('warlock-tether-beams',beamCount,beamMaterial),chains=ensure('warlock-tether-chain',chainCount,chainMaterial),markers=ensure('warlock-control-markers',controls.length*4,controlMaterial);let beamIndex=0,chainIndex=0,markerIndex=0;const point=new T.Vector3(),orientation=new T.Quaternion(),identity=new T.Quaternion();
   for(const tether of tethers){const length=tether.a.distanceTo(tether.b);if(length<.01)continue;direction.subVectors(tether.b,tether.a).normalize();orientation.setFromUnitVectors(axis,direction);point.addVectors(tether.a,tether.b).multiplyScalar(.5);put(beams,beamIndex++,point,[.035*pulse,length,.035*pulse],tether.returning?0xe0c997:0xbca9e9,orientation);const segments=Math.max(2,Math.min(128,Math.ceil(length/.45)));
    for(let i=0;i<segments;i++){const t=(i+.5)/segments;point.lerpVectors(tether.a,tether.b,t);const bright=(i+pose)%5===0,wide=i%2===0;put(chains,chainIndex++,point,[wide?.16:.075,.11,wide?.075:.16],bright?0xeee0b0:wide?0xc8b3e8:0xb6c6e0,orientation);}
    for(const endpoint of [tether.a,tether.b])put(chains,chainIndex++,endpoint,[.19*pulse,.19*pulse,.19*pulse],0xe8d7ac,identity);
   }
   for(const unit of controls){const y=.18+2.9*(unit.size||1);for(let i=0;i<4;i++){const a=(i+pose*.125)*Math.PI/2;point.set(unit.x+Math.cos(a)*.31,y+(i%2)*.07,unit.z+Math.sin(a)*.31);put(markers,markerIndex++,point,[.13,.13,.13],i%2?0xe1c9aa:0xb09bd6,identity);}}
   finish(beams,beamIndex);finish(chains,chainIndex);finish(markers,markerIndex);root.visible=beamIndex>0||markerIndex>0;
  },
  dispose(){if(disposed)return;disposed=true;for(const mesh of batches.values())mesh.dispose();batches.clear();geometry.dispose();beamMaterial.dispose();chainMaterial.dispose();controlMaterial.dispose();root.removeFromParent();}
 };
}
