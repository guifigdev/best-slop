import {roLightningVolume} from './ro-lightning-volume.js';
import * as T from 'three';
import {roMageVisual,roMageTargetHeight} from '../shared/ro-mage-spells.js';
import {roProjectileParts} from './ro-projectile-art.js';

export const RO_MAGE_SPELL_BUDGET=Object.freeze({events:24,cubes:1536,clouds:288,glows:1024,drawCalls:3,planes:0});
const clamp=n=>Math.max(0,Math.min(1,n));
export function roMageSpellParts(event,time,unit,heightAt=()=>0){
 const age=time-event.time;if(age<0||age>=.7)return{cubes:[],clouds:[],glows:[]};const key=event.skillKey,cubes=[],clouds=[],glows=[],x=event.x,z=event.z,ground=heightAt(x,z),y=ground+roMageTargetHeight(unit),fade=clamp((.7-age)/.22),seed=Number(event.id)||0;
 if(key==='mg_napalmbeat'&&event.type==='roSkillImpact'){
  for(let i=0;i<12;i++){const a=i*2.39996+seed*.2,p=clamp(age/.6),r=.10+p*(.48+(i%3)*.10),s=(.18+(i%3)*.025)*(1-p*.55);clouds.push([x+Math.sin(a)*r,y+Math.cos(a*1.7)*r*.65+p*.25,z+Math.cos(a)*r,s*1.15,s,s*1.1,i%3?0xf3e6e9:0xc3addb,fade*(1-p)*.62]);}
  for(let i=0;i<14;i++){const a=i*2.39996,r=.1+age*1.6,s=.035*fade;cubes.push([x+Math.sin(a)*r,y+Math.cos(a)*r*.6,z+Math.sin(a*1.8)*r*.5,s,.10*fade,s,i%2?0xfff8ed:0xddb7dc,fade]);}
 }else if(event.type==='roSkillImpact'&&key!=='mg_sight'){
  const colors=key==='coldbolt'?[0xdfffff,0x88cadd]:key==='firebolt'?[0xffe5a3,0xeaa357]:key==='mg_lightningbolt'?[0xfff9cc,0xc6dcff]:[0xf7e9ec,0xcab8df];
  for(let i=0;i<10;i++){const a=i*2.39996+seed,rad=age*(.8+i%3*.25),s=(.035+(i%3)*.012)*fade;cubes.push([x+Math.sin(a)*rad,y+Math.cos(a)*rad*.65,z+Math.sin(a*2)*rad*.55,s,s*1.4,s,colors[i%2],fade]);}
 }else if(key==='mg_thunderstorm'&&event.type!=='roAttack'){
  const r=event.radius||3.5;for(let bolt=0;bolt<3;bolt++){const a=seed*.2+bolt*2.39996,xx=x+Math.sin(a)*r*.62,zz=z+Math.cos(a)*r*.62,parts=roLightningVolume({x:xx,z:zz,base:heightAt(xx,zz)+.15,height:8.5,seed:seed+bolt,time,opacity:fade*clamp((.32-age)/.12),scale:1.3});cubes.push(...parts.cubes);glows.push(...parts.glows);}
 }else if(key==='wz_sightrasher'&&event.type==='roAttack'){
  const progress=clamp(age/.5),radius=(event.range||7)*progress;for(let i=0;i<8;i++){const a=i*Math.PI/4,shot={id:seed+i,x:x+Math.sin(a)*radius,z:z+Math.cos(a)*radius,dx:Math.sin(a),dz:Math.cos(a),element:'fire'};for(const [px,py,pz,w,h,d,c]of roProjectileParts(shot,time))cubes.push([px,heightAt(px,pz)+py,pz,w,h,d,c,fade*(1-progress*.65)]);}
 }
 return{cubes,clouds,glows};
}
export function createRoMageSpellArt({scene}){
 const B=RO_MAGE_SPELL_BUDGET,geometries=[new T.BoxGeometry(1,1,1),new T.IcosahedronGeometry(.5,0),new T.BoxGeometry(1,1,1)],materials=[],meshes=[],alphas=[],dummy=new T.Object3D(),color=new T.Color(),up=new T.Vector3(0,1,0),direction=new T.Vector3();let disposed=false;
 for(let i=0;i<3;i++){const geo=geometries[i],alpha=new T.InstancedBufferAttribute(new Float32Array(i===1?B.clouds:i===2?B.glows:B.cubes),1);geo.setAttribute('mageAlpha',alpha);alphas.push(alpha);const mat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:T.CustomBlending,blendSrc:T.SrcAlphaFactor,blendDst:i===2?T.OneFactor:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor});mat.onBeforeCompile=s=>{s.vertexShader='attribute float mageAlpha;varying float vMageAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMageAlpha=mageAlpha;');s.fragmentShader='varying float vMageAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vMageAlpha;');};mat.customProgramCacheKey=()=> 'ro-mage-volumes-v1';materials.push(mat);const mesh=new T.InstancedMesh(geo,mat,i===1?B.clouds:i===2?B.glows:B.cubes);mesh.name=i===1?'ro-spiritual-dispersing-volumes':i===2?'ro-lightning-additive-halos':'ro-mage-volumetric-particles';mesh.frustumCulled=false;mesh.count=0;mesh.renderOrder=5;meshes.push(mesh);scene.add(mesh);}
 const put=(parts,index)=>{const mesh=meshes[index],limit=index===1?B.clouds:index===2?B.glows:B.cubes;for(const [x,y,z,w,h,d,c,alpha,axis]of parts){if(mesh.count>=limit)break;dummy.position.set(x,y,z);if(axis)dummy.quaternion.setFromUnitVectors(up,direction.fromArray(axis));else dummy.rotation.set(index===1?.35:0,index===1?.6:0,index===1?.2:0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.setColorAt(mesh.count,color.setHex(c));alphas[index].setX(mesh.count++,alpha);}};
 return{update(state,time,heightAt=()=>0){if(disposed)return;for(const m of meshes)m.count=0;const units=new Map((state?.units||[]).map(u=>[u.id,u]));
  for(const e of (state?.effects||[]).filter(e=>roMageVisual(e)&&!['damage','miss','heal'].includes(e.type)&&time>=e.time&&time-e.time<.7).slice(-B.events)){const parts=roMageSpellParts(e,time,units.get(e.target),heightAt);put(parts.cubes,0);put(parts.clouds,1);put(parts.glows,2);}
  const lightningTargets=new Set();for(const shot of state?.bonk?.projectiles||[])if(shot.roMageBolt&&shot.skillKey==='mg_lightningbolt'&&!(shot.delay>0)&&!lightningTargets.has(shot.targetId)){lightningTargets.add(shot.targetId);const target=units.get(shot.targetId),parts=roLightningVolume({x:shot.x,z:shot.z,base:heightAt(shot.x,shot.z)+roMageTargetHeight(target),height:8,seed:shot.id,time,scale:1.15});put(parts.cubes,0);put(parts.glows,2);}
  for(const u of units.values())if(u.alive&&(u.roSkillBuffs||[]).some(b=>b.key==='mg_sight'&&b.until>(state.bonk?.elapsed||0))){const a=time*3.5+(Number(u.id)||0),shot={id:u.id,x:u.x+Math.sin(a)*.8,z:u.z+Math.cos(a)*.8,dx:Math.cos(a),dz:-Math.sin(a),element:'fire'};put(roProjectileParts(shot,time).map(([x,y,z,w,h,d,c])=>[x,heightAt(x,z)+y,z,w*.6,h*.7,d*.6,c,.9]),0);}
  for(let i=0;i<3;i++)if(meshes[i].count){meshes[i].instanceMatrix.needsUpdate=true;meshes[i].instanceColor.needsUpdate=true;alphas[i].needsUpdate=true;}
 },reset(){for(const m of meshes)m.count=0;},stats:()=>({cubes:meshes[0].count,clouds:meshes[1].count,glows:meshes[2].count,drawCalls:meshes.filter(m=>m.count>0).length,planes:0}),dispose(){if(disposed)return;disposed=true;for(const m of meshes){m.removeFromParent();m.dispose();}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
