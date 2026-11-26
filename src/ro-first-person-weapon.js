import * as T from 'three';
import {roEquippedWeaponModel,roEquippedOffhandModel} from '../shared/ro-equipped-weapon.js';
import {BONK_WEAPONS} from '../shared/bonk-catalog.js';
export const RO_FIRST_PERSON_WEAPON_BUDGET=Object.freeze({parts:224,drawCalls:1,lights:0});
const clamp=n=>Math.max(0,Math.min(1,n)),fallback={windhawk:'bow',troubadour:'lute',archmage:'staff',elementalmaster:'book',cardinal:'mace',inquisitor:'fists',meister:'axe',biolo:'flask',shadowcross:'dagger',abysschaser:'dagger',dragonknight:'sword',imperialguard:'spear'};
export function roFirstPersonWeaponKind(unit){return roEquippedWeaponModel(unit)||fallback[unit?.roLineage]||'sword';}
export function roFirstPersonAttackPose(unit,effects,time,elapsed=time){
 let latest=null;const release=unit?.roSkillRelease;if(release&&release.time<=time&&!['mount','passive'].includes(release.kind))latest={time:release.time,skillKey:release.key,element:release.element,attackKind:release.kind};
 for(const e of effects||[])if(e.type==='roAttack'&&!['dash','mount','passive'].includes(e.attackKind)&&e.source===unit?.id&&e.time<=time&&(!latest||e.time>=latest.time))latest=e;
 const age=latest?time-latest.time:10,skill=latest?.skillKey&&latest.skillKey!=='basic',duration=skill?.58:Math.max(.25,Math.min(.65,unit?.roAttackMotion||.4)),p=clamp(age/duration),casting=unit?.roCasting,charging=!!casting&&elapsed<casting.finishAt,charge=charging?clamp((elapsed-casting.started)/Math.max(.001,casting.duration)):0;
 return{active:age>=0&&age<duration&&!charging,charging,charge,age,skill:!!skill,key:charging?casting.key:latest?.skillKey,element:charging?BONK_WEAPONS[casting.key]?.element:latest?.element,recoil:age>=0&&age<.5&&!charging?Math.exp(-age*10):0,swing:age>=0&&age<duration&&!charging?Math.sin(p*Math.PI):0,draw:charging?.25+charge*.75:age>=0&&age<duration?clamp((p-.12)/.7):.12,arrowVisible:charging||age>.16};
}
// Bow limbs, string and arrow share the Y/Z plane. Negative Z is the target;
// the nock is drawn towards the player while the grip stays ahead of it.
export function roFirstPersonBowShape(draw=0){const pull=.025+clamp(draw)*.21;return{grip:[-.23,0,-.17],tips:[[-.23,-.35,0],[-.23,.35,0]],nock:[-.23,0,pull],arrowTip:[-.23,0,pull-.72]};}
export function createRoFirstPersonWeapon({scene}){
 const B=RO_FIRST_PERSON_WEAPON_BUDGET,weaponScene=new T.Scene(),geometry=new T.BoxGeometry(1,1,1),faceColors=[];for(let i=0;i<geometry.attributes.normal.count;i++){const n=geometry.attributes.normal,shade=.66+Math.max(0,n.getY(i))*.28+Math.max(0,n.getZ(i))*.16;faceColors.push(shade,shade,shade);}geometry.setAttribute('color',new T.Float32BufferAttribute(faceColors,3));const material=new T.MeshBasicMaterial({vertexColors:true}),mesh=new T.InstancedMesh(geometry,material,B.parts);mesh.name='ro-first-person-voxel-weapon';mesh.count=0;mesh.renderOrder=1000;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;weaponScene.add(mesh);
 const root=new T.Object3D(),part=new T.Object3D(),local=new T.Matrix4(),world=new T.Matrix4(),tint=new T.Color(),from=new T.Vector3(),to=new T.Vector3(),up=new T.Vector3(0,1,0);let kind=null,disposed=false,lastPose=null;
 function box(x,y,z,w,h,d,c,rz=0){if(mesh.count>=B.parts)return;part.position.set(x,y,z);part.rotation.set(0,0,rz);part.scale.set(w,h,d);part.updateMatrix();world.multiplyMatrices(local,part.matrix);mesh.setMatrixAt(mesh.count,world);mesh.setColorAt(mesh.count++,tint.setHex(c));}
 function line(a,b,w,c){if(mesh.count>=B.parts)return;from.set(...a);to.set(...b).sub(from);const length=to.length();if(length<1e-5)return;part.position.copy(from).addScaledVector(to,.5);part.quaternion.setFromUnitVectors(up,to.normalize());part.scale.set(w,length,w);part.updateMatrix();world.multiplyMatrices(local,part.matrix);mesh.setMatrixAt(mesh.count,world);mesh.setColorAt(mesh.count++,tint.setHex(c));}
 const skin=0xdab38e,cloth=0x3f685b,leather=0x644532,steel=0xb8cad1,edge=0xe9f3ef,gold=0xc6a067;
 function hand(x,y,z,side=1){
  box(x,y-.16,z+.09,.105,.23,.125,cloth,side*.10);box(x,y-.085,z+.035,.12,.085,.14,leather);box(x,y-.078,z-.04,.10,.012,.012,0xa18255);for(let i=-1;i<=1;i++)box(x+i*.027,y-.10,z-.042,.009,.012,.01,0xd6ba87);
  box(x,y-.005,z,.105,.105,.10,skin);box(x-side*.059,y+.015,z-.012,.037,.062,.065,0xc99770,side*.35);box(x-side*.064,y+.045,z-.039,.033,.034,.035,0xeac5a0);
  for(let i=0;i<4;i++){const xx=x-.043+i*.028,yy=y+.035-Math.abs(i-1.5)*.008;box(xx,yy,z-.035,.024,.043,.045,0xe5bd95);box(xx,yy-.012,z-.060,.023,.027,.024,0xce9c74);box(xx,yy+.015,z-.046,.019,.012,.018,0xf0cfa9);}
 }
 function weapon(type,side=1){
  const x=side*.06;if(type!=='bow')hand(x,-.04,.07,side);
  if(type==='bow'){
   const shape=roFirstPersonBowShape(lastPose.draw),pull=shape.nock[2];hand(-.23,-.025,-.16,-1);
   for(let i=-8;i<=8;i++){const y=i*.043,z=-.17*(1-(i/8)**2);box(-.23,y,z,.045,.054,.041,0x88552f);box(-.254,y,z+.006,.005,.047,.014,i%3?0xa37643:0x57351f);box(-.22,y,z+.023,.009,.048,.004,0x684020);}
   for(let i=-3;i<=3;i++)box(-.23,i*.017,-.17,.059,.013,.052,i%2?0x432d23:0x674630);
   for(const tip of shape.tips)box(...tip,.05,.043,.047,0xd4bd87);
   for(const tip of shape.tips)line(tip,shape.nock,.005,0xe5dac1);hand(-.20,-.025,pull+.012);
   if(lastPose.arrowVisible){box(-.23,0,pull-.325,.011,.011,.65,0x98683b);box(-.23,0,pull-.665,.029,.022,.07,steel);box(...shape.arrowTip,.014,.014,.04,edge);box(-.23,0,pull-.05,.055,.008,.07,0xe4d9b9);box(-.23,0,pull-.05,.008,.055,.07,0xe4d9b9);}return;
  }
  if(type==='book'){box(x,.09,-.06,.38,.35,.1,0x70465c);box(x,.10,-.12,.32,.29,.035,0xf0dfac);box(x,.1,-.145,.035,.17,.015,gold);box(x,.1,-.145,.17,.035,.015,gold);return;}
  if(type==='flask'){box(x,.10,-.03,.15,.23,.15,0x9ec4a5);box(x,.26,-.03,.07,.1,.07,0xe6e7cf);box(x,.33,-.03,.085,.04,.085,leather);box(x,.08,-.11,.10,.10,.025,0x86c28d);return;}
  if(type==='fists'||type==='knuckle'){box(x,.02,-.02,.18,.18,.20,leather);for(let i=0;i<3;i++)box(x-.06+i*.06,.10,-.08,.045,.045,.07,gold);return;}
  if(type==='shield'){box(x,.12,-.02,.36,.48,.09,steel);box(x,.12,-.075,.29,.39,.025,0x3c666d);box(x,.12,-.10,.035,.30,.025,gold);box(x,.18,-.10,.21,.035,.025,gold);return;}
  if(type==='lute'||type==='instrument'){box(x,.04,-.04,.28,.32,.10,0x98734c);box(x,.30,-.04,.07,.30,.07,leather);for(let i=-1;i<=1;i++)box(x+i*.018,.17,-.10,.004,.51,.004,edge);return;}
  const staff=['staff','rod','crossstaff'].includes(type),spear=type==='spear',length=staff||spear?.77:type==='greatsword'?.66:type==='dagger'||type==='katar'?.30:.49;
  const blade=['sword','greatsword','dagger','katar'].includes(type);box(x,blade?.025:.12,-.04,.045,blade?.22:length,.055,leather);const top=.12+length*.5;
  if(staff||spear){box(x-.024,.12,-.03,.005,length*.95,.016,0xa27849);box(x+.014,.12,-.010,.007,length*.9,.004,0x3e2c22);}else for(let i=0;i<5;i++)box(x,-.06+i*.035,-.04,.054,.009,.063,0x9b784c);
  if(staff){box(x,top,-.04,.14,.12,.13,gold);box(x,top+.09,-.04,.11,.13,.11,0x9fc9e4);box(x,top+.12,-.10,.045,.06,.025,0xf1f9ff);if(type==='crossstaff')box(x,top,-.04,.31,.045,.06,gold);}
  else if(type==='axe'||type==='mace'){box(x,top-.04,-.04,type==='axe'?.32:.19,.23,.12,steel);box(x-.16,top-.04,-.04,.035,.22,.13,edge);}
  else if(type==='cannon'){box(x,.14,-.18,.18,.21,.45,0x586a72);box(x,.14,-.42,.22,.24,.07,gold);box(x,.14,-.46,.13,.14,.025,0x24343d);}
  else{box(x,top+.03,-.04,.07,spear?.23:length*.65,.035,steel);box(x-.035,top+.03,-.055,.018,spear?.20:length*.6,.018,edge);box(x,top-length*.31,-.04,.22,.035,.07,gold);if(type==='katar')for(const offset of [-.07,.07])box(x+offset,top+.02,-.04,.025,.29,.04,steel);}
 }
 function spellFeedback(time,camera){
  const p=lastPose;if(!p.charging&&!(p.active&&p.skill))return;
  const palettes={fire:[0xffb24f,0xffedaa],ice:[0x70d6ef,0xe2ffff],water:[0x62bfe8,0xd4faff],lightning:[0xd3b6ff,0xfff4ab],holy:[0xffd477,0xffffd6],poison:[0xaac963,0xe2f4b5],dark:[0xb581d6,0xe9caff],physical:[0xe8c788,0xfff4cd]},colors=palettes[p.element]||[0x9ba9ef,0xf0e7ff];
  // Real 3D motes gather at the hand, then travel forward on release. They are
  // presentation only: the actual spell remains at its authoritative target.
  local.copy(camera.matrixWorld);const count=p.charging?12:24,age=p.charging?0:p.age;
  for(let i=0;i<count;i++){const a=i*2.39996+time*(p.charging?2:1),r=p.charging?.055+.04*Math.sin(i+time*4):.025+age*(.16+i%4*.06),z=p.charging?-.88: -.88-age*(2.2+i%5*.5),size=p.charging?.012+p.charge*.008:Math.max(.004,.029*(1-age/.58));box(.29+Math.cos(a)*r,-.13+Math.sin(a)*r,z,size,size*(i%3===0?2:1),size,colors[i%2],a);}
 }
 return{mesh,render(renderer,camera){if(disposed||!mesh.count)return;const auto=renderer.autoClear,reset=renderer.info?.autoReset;try{renderer.autoClear=false;if(renderer.info)renderer.info.autoReset=false;renderer.clearDepth();renderer.render(weaponScene,camera);}finally{renderer.autoClear=auto;if(renderer.info)renderer.info.autoReset=reset;}},update(state,unit,time,camera,{enabled=false,blend=1}={}){mesh.count=0;if(disposed||!enabled||!unit?.alive||state?.options?.mode!=='bonk'||blend<.85)return;kind=roFirstPersonWeaponKind(unit);const bob=unit.moving?Math.sin(time*8)*.008:Math.sin(time*1.8)*.002;
  lastPose=roFirstPersonAttackPose(unit,state.effects,time,state.bonk?.elapsed??time);const castLift=lastPose.charging?.10+lastPose.charge*.06:0,magic=['staff','rod','crossstaff','book','flask'].includes(kind),release=lastPose.active&&lastPose.skill;
  root.position.set(kind==='bow'?.55:.36,-.32+bob+castLift+(release?.05*lastPose.swing:0),-.80+lastPose.recoil*.10-(release?.17*lastPose.swing:0));root.rotation.set(kind==='bow'?lastPose.recoil*.16:magic&&release?-.32*lastPose.swing:-lastPose.swing*.55,(kind==='bow'?.12:-lastPose.swing*.30),kind==='bow'?-.18:magic&&release?.10*lastPose.swing:-lastPose.swing*.48);root.scale.setScalar(1);root.updateMatrix();local.multiplyMatrices(camera.matrixWorld,root.matrix);weapon(kind);
  const off=roEquippedOffhandModel(unit),paired=kind==='katar'||kind==='fists'||kind==='knuckle';if(off||paired){root.position.x=-.37;root.rotation.z=(off==='shield'?.10:lastPose.swing*.55);root.updateMatrix();local.multiplyMatrices(camera.matrixWorld,root.matrix);weapon(off||kind,-1);}
  spellFeedback(time,camera);mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 },stats:()=>({visible:mesh.count>0,weapon:kind,parts:mesh.count,drawCalls:mesh.count?1:0,attack:!!lastPose?.active,casting:!!lastPose?.charging,skill:lastPose?.key||null}),reset(){mesh.count=0;kind=null;lastPose=null;},dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();geometry.dispose();material.dispose();}};
}
