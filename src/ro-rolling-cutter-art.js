import * as T from 'three';
import {roRollingCutterPose} from '../shared/ro-rolling-cutter.js';

export const RO_ROLLING_CUTTER_BUDGET=Object.freeze({casters:16,segments:12,instances:1536,drawCalls:1,planes:0});
export function createRoRollingCutterArt({scene}){
 const B=RO_ROLLING_CUTTER_BUDGET,geometry=new T.BoxGeometry(1,1,1),alpha=new T.InstancedBufferAttribute(new Float32Array(B.instances),1);geometry.setAttribute('bladeAlpha',alpha);
 const material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false});
 material.onBeforeCompile=shader=>{shader.vertexShader='attribute float bladeAlpha;varying float vBladeAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBladeAlpha=bladeAlpha;');shader.fragmentShader='varying float vBladeAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vBladeAlpha;');};material.customProgramCacheKey=()=> 'ro-rolling-cutter-volumes-v1';
 const mesh=new T.InstancedMesh(geometry,material,B.instances),dummy=new T.Object3D(),color=new T.Color();mesh.name='ro-rolling-cutter-blade-trails';mesh.frustumCulled=false;mesh.renderOrder=4;mesh.count=0;scene.add(mesh);let disposed=false,casters=0;
 return{update(state,time=state?.time||0,heightAt=()=>0){if(disposed)return;let at=0;casters=0;
  for(const unit of state?.units||[]){const pose=roRollingCutterPose(unit,state.effects,time);if(!pose||casters>=B.casters)continue;casters++;const radius=Math.max(.2,pose.radius),yaw=(unit.facing||0)+pose.turn,ground=heightAt(unit.x,unit.z)+(unit.bonkJumpHeight||0),size=unit.size||1;
   for(const side of [0,1])for(let segment=0;segment<B.segments;segment++)for(let layer=0;layer<2;layer++){
    const angle=yaw+side*Math.PI-segment*.115,tail=1-segment/B.segments,r=radius*(layer?.94:1);
    dummy.position.set(unit.x+Math.sin(angle)*r,ground+(1.02+.055*Math.sin(angle*2))*size,unit.z+Math.cos(angle)*r);dummy.rotation.set(.06*Math.sin(angle),angle,0);dummy.scale.set(radius*(pose.spinKind==='axe'?.24:.17),layer?.035:pose.spinKind==='axe'?.13:.075,layer?.045:pose.spinKind==='axe'?.17:.11);dummy.updateMatrix();mesh.setMatrixAt(at,dummy.matrix);mesh.setColorAt(at,color.setHex(pose.spinKind==='axe'?(layer?0xffeac0:0xe7a24a):(layer?0xf3fcff:0x86bfe6)));alpha.setX(at++,pose.alpha*tail*(layer?.9:.42));
   }
   if(pose.spinKind==='axe')for(let band=0;band<3;band++)for(let segment=0;segment<12;segment++){
    const a=yaw-band*.9-segment*.17,r=radius*(.78+band*.1),tail=1-segment/12;dummy.position.set(unit.x+Math.sin(a)*r,ground+(.35+band*.53)*size,unit.z+Math.cos(a)*r);dummy.rotation.set(.12,a,.08*Math.sin(a));dummy.scale.set(radius*.18,.025+tail*.025,.07);dummy.updateMatrix();mesh.setMatrixAt(at,dummy.matrix);mesh.setColorAt(at,color.setHex(band%2?0xc2dbd8:0xe7e7ca));alpha.setX(at++,pose.alpha*tail*.36);
   }
  }
  mesh.count=at;if(at){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;alpha.needsUpdate=true;}
 },reset(){mesh.count=0;casters=0;},stats:()=>({casters,instances:mesh.count,drawCalls:mesh.count?1:0,planes:0}),dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
