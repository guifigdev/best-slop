import * as T from 'three';
import {roEquippedWeaponModel,roEquippedOffhandModel} from '../shared/ro-equipped-weapon.js';
export const RO_FIRST_PERSON_WEAPON_BUDGET=Object.freeze({parts:128,drawCalls:1,lights:0});
const clamp=n=>Math.max(0,Math.min(1,n)),fallback={windhawk:'bow',troubadour:'lute',archmage:'staff',elementalmaster:'book',cardinal:'mace',inquisitor:'fists',meister:'axe',biolo:'flask',shadowcross:'dagger',abysschaser:'dagger',dragonknight:'sword',imperialguard:'spear'};
export function roFirstPersonWeaponKind(unit){return roEquippedWeaponModel(unit)||fallback[unit?.roLineage]||'sword';}
export function roFirstPersonAttackPose(unit,effects,time){let latest=null;for(const e of effects||[])if(e.type==='roAttack'&&!['dash','mount','buff','heal','passive'].includes(e.attackKind)&&e.source===unit?.id&&e.time<=time&&(!latest||e.time>latest.time))latest=e;const age=latest?time-latest.time:10,duration=Math.max(.25,Math.min(.65,unit?.roAttackMotion||.4)),p=clamp(age/duration);return{active:age>=0&&age<duration,recoil:age>=0&&age<.4?Math.exp(-age*15):0,swing:age>=0&&age<duration?Math.sin(p*Math.PI):0,draw:age>=0&&age<duration?clamp((p-.12)/.7):1,arrowVisible:age>.12};}
export function createRoFirstPersonWeapon({scene}){
 const B=RO_FIRST_PERSON_WEAPON_BUDGET,weaponScene=new T.Scene(),geometry=new T.BoxGeometry(1,1,1),faceColors=[];for(let i=0;i<geometry.attributes.normal.count;i++){const n=geometry.attributes.normal,shade=.66+Math.max(0,n.getY(i))*.28+Math.max(0,n.getZ(i))*.16;faceColors.push(shade,shade,shade);}geometry.setAttribute('color',new T.Float32BufferAttribute(faceColors,3));const material=new T.MeshBasicMaterial({vertexColors:true}),mesh=new T.InstancedMesh(geometry,material,B.parts);mesh.name='ro-first-person-voxel-weapon';mesh.count=0;mesh.renderOrder=1000;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;weaponScene.add(mesh);
 const root=new T.Object3D(),part=new T.Object3D(),local=new T.Matrix4(),world=new T.Matrix4(),tint=new T.Color(),from=new T.Vector3(),to=new T.Vector3(),up=new T.Vector3(0,1,0);let kind=null,disposed=false,lastPose=null;
 function box(x,y,z,w,h,d,c,rz=0){if(mesh.count>=B.parts)return;part.position.set(x,y,z);part.rotation.set(0,0,rz);part.scale.set(w,h,d);part.updateMatrix();world.multiplyMatrices(local,part.matrix);mesh.setMatrixAt(mesh.count,world);mesh.setColorAt(mesh.count++,tint.setHex(c));}
 function line(a,b,w,c){from.set(...a);to.set(...b).sub(from);const length=to.length();if(length<1e-5)return;part.position.copy(from).addScaledVector(to,.5);part.quaternion.setFromUnitVectors(up,to.normalize());part.scale.set(w,length,w);part.updateMatrix();world.multiplyMatrices(local,part.matrix);mesh.setMatrixAt(mesh.count,world);mesh.setColorAt(mesh.count++,tint.setHex(c));}
 const skin=0xdab38e,cloth=0x3f685b,leather=0x644532,steel=0xb8cad1,edge=0xe9f3ef,gold=0xc6a067;
 function hand(x,y,z,side=1){box(x,y-.15,z+.12,.13,.26,.17,cloth,side*.15);box(x,y-.025,z,.14,.14,.15,skin);box(x,y-.07,z+.02,.16,.045,.17,leather);for(let i=0;i<3;i++)box(x-.045+i*.045,y+.03,z-.065,.035,.06,.04,0xe7c6a2);}
 function weapon(type,side=1){
  const x=side*.06;if(type!=='bow')hand(x,-.04,.07,side);
  if(type==='bow'){
   hand(-.09,-.12,.05,-1);for(let i=-8;i<=8;i++){const y=i*.043,x=-.23+.14*(1-(i/9)**2);box(x,y,0,.04,.053,.045,i%3?gold:leather);}
   const pull=.03+(lastPose?.draw||0)*.19;line([-.23,-.35,0],[-.23,0,pull],.007,edge);line([-.23,.35,0],[-.23,0,pull],.007,edge);hand(-.11,-.03,pull+.04);
   if(lastPose.arrowVisible){box(-.23,0,-.27+pull,.014,.014,.65,0x9d7950);box(-.23,0,-.62+pull,.04,.025,.07,steel);box(-.23,0,.06+pull,.06,.012,.09,edge);box(-.23,0,.06+pull,.012,.06,.09,edge);}return;
  }
  if(type==='book'){box(x,.09,-.06,.38,.35,.1,0x70465c);box(x,.10,-.12,.32,.29,.035,0xf0dfac);box(x,.1,-.145,.035,.17,.015,gold);box(x,.1,-.145,.17,.035,.015,gold);return;}
  if(type==='flask'){box(x,.10,-.03,.15,.23,.15,0x9ec4a5);box(x,.26,-.03,.07,.1,.07,0xe6e7cf);box(x,.33,-.03,.085,.04,.085,leather);box(x,.08,-.11,.10,.10,.025,0x86c28d);return;}
  if(type==='fists'||type==='knuckle'){box(x,.02,-.02,.18,.18,.20,leather);for(let i=0;i<3;i++)box(x-.06+i*.06,.10,-.08,.045,.045,.07,gold);return;}
  if(type==='shield'){box(x,.12,-.02,.36,.48,.09,steel);box(x,.12,-.075,.29,.39,.025,0x3c666d);box(x,.12,-.10,.035,.30,.025,gold);box(x,.18,-.10,.21,.035,.025,gold);return;}
  if(type==='lute'||type==='instrument'){box(x,.04,-.04,.28,.32,.10,0x98734c);box(x,.30,-.04,.07,.30,.07,leather);for(let i=-1;i<=1;i++)box(x+i*.018,.17,-.10,.004,.51,.004,edge);return;}
  const staff=['staff','rod','crossstaff'].includes(type),spear=type==='spear',length=staff||spear?.77:type==='greatsword'?.66:type==='dagger'||type==='katar'?.30:.49;
  box(x,.12,-.04,.045,length,.055,leather);const top=.12+length*.5;
  if(staff){box(x,top,-.04,.14,.12,.13,gold);box(x,top+.09,-.04,.11,.13,.11,0x9fc9e4);box(x,top+.12,-.10,.045,.06,.025,0xf1f9ff);if(type==='crossstaff')box(x,top,-.04,.31,.045,.06,gold);}
  else if(type==='axe'||type==='mace'){box(x,top-.04,-.04,type==='axe'?.32:.19,.23,.12,steel);box(x-.16,top-.04,-.04,.035,.22,.13,edge);}
  else if(type==='cannon'){box(x,.14,-.18,.18,.21,.45,0x586a72);box(x,.14,-.42,.22,.24,.07,gold);box(x,.14,-.46,.13,.14,.025,0x24343d);}
  else{box(x,top+.03,-.04,.07,spear?.23:length*.65,.035,steel);box(x-.035,top+.03,-.055,.018,spear?.20:length*.6,.018,edge);box(x,top-length*.31,-.04,.22,.035,.07,gold);if(type==='katar')for(const offset of [-.07,.07])box(x+offset,top+.02,-.04,.025,.29,.04,steel);}
 }
 return{mesh,render(renderer,camera){if(disposed||!mesh.count)return;const auto=renderer.autoClear,reset=renderer.info?.autoReset;try{renderer.autoClear=false;if(renderer.info)renderer.info.autoReset=false;renderer.clearDepth();renderer.render(weaponScene,camera);}finally{renderer.autoClear=auto;if(renderer.info)renderer.info.autoReset=reset;}},update(state,unit,time,camera,{enabled=false,blend=1}={}){mesh.count=0;if(disposed||!enabled||!unit?.alive||state?.options?.mode!=='bonk'||blend<.85)return;kind=roFirstPersonWeaponKind(unit);lastPose=roFirstPersonAttackPose(unit,state.effects,time);const bob=unit.moving?Math.sin(time*8)*.008:Math.sin(time*1.8)*.002;
  root.position.set(.36,-.32+bob,-.78+lastPose.recoil*.07);root.rotation.set(kind==='bow'?lastPose.recoil*.10:-lastPose.swing*.55,kind==='bow'?0:-lastPose.swing*.30,kind==='bow'?-.18:-lastPose.swing*.48);root.scale.setScalar(1);root.updateMatrix();local.multiplyMatrices(camera.matrixWorld,root.matrix);weapon(kind);
  const off=roEquippedOffhandModel(unit),paired=kind==='katar'||kind==='fists'||kind==='knuckle';if(off||paired){root.position.x=-.37;root.rotation.z=(off==='shield'?.10:lastPose.swing*.55);root.updateMatrix();local.multiplyMatrices(camera.matrixWorld,root.matrix);weapon(off||kind,-1);}
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 },stats:()=>({visible:mesh.count>0,weapon:kind,parts:mesh.count,drawCalls:mesh.count?1:0,attack:!!lastPose?.active}),reset(){mesh.count=0;kind=null;lastPose=null;},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
