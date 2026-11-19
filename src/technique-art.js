import * as T from 'three';

const TYPES=new Set(['doubleattack','violentforce','hurricane','hurricanePulse','manabreak']);
let cache=null,users=0;
function acquire(){
 if(!cache)cache={box:new T.BoxGeometry(1,1,1),ring:new T.RingGeometry(.97,1,64),material:new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide,toneMapped:false})};users++;return cache;
}
function release(){if(--users===0){cache.box.dispose();cache.ring.dispose();cache.material.dispose();cache=null;}}
const finite=value=>Number.isFinite(value);
const sourceUnit=(context,id)=>context.units?.find(unit=>unit.id===id);
const actorAt=(context,id)=>context.actors?.get?.(id);
const floorAt=(context,x,z)=>context.heightAt?.(x,z)??.18;
function anchor(out,context,unit,id,event,target=false){
 const actor=actorAt(context,id),x=actor?.root.position.x??unit?.x??(target?event.tx:event.x)??0,z=actor?.root.position.z??unit?.z??(target?event.tz:event.z)??0,ground=floorAt(context,x,z);
 const hitY=actor?actor.root.position.y+(actor.eyeLine||actor.modelHeight*.62||1.3)*(actor.root.scale.y||1):ground+(unit?.flying?unit.altitude||0:0)+1.3*(unit?.size||1);
 out.x=x;out.z=z;out.ground=ground;out.hitY=hitY;out.size=Math.max(.35,Math.min(3,unit?.size||1));return out;
}

export function createTechniqueEffect(event){
 if(!TYPES.has(event?.type))return null;
 if(['hurricane','hurricanePulse'].includes(event.type)&&(!finite(event.radius)||event.radius<=0))return null;
 const resources=acquire(),group=new T.Group(),dummy=new T.Object3D(),color=new T.Color(),meshes=[],point={},birth=Number(event.time)||0;
 group.name=`technique-${event.type}`;group.userData.technique=event.type;let released=false,lastPose=-1,lastRadius=-1;
 const mesh=(count,hex,geometry=resources.box)=>{const value=new T.InstancedMesh(geometry,resources.material,count);value.frustumCulled=false;value.userData.capacity=count;for(let i=0;i<count;i++)value.setColorAt(i,color.setHex(Array.isArray(hex)?hex[i%hex.length]:hex));value.instanceColor.needsUpdate=true;group.add(value);meshes.push(value);return value;};
 const put=(object,index,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>{dummy.position.set(x,y,z);dummy.scale.set(Math.max(.001,w),Math.max(.001,h),Math.max(.001,d));dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();object.setMatrixAt(index,dummy.matrix);};
 const persistent=event.type==='violentforce'||event.type==='hurricane',duration=event.type==='violentforce'?event.duration||6:event.type==='hurricane'?event.duration||2:event.type==='hurricanePulse'?.375:event.type==='doubleattack'?.625:.75;
 let first,second;
 if(event.type==='doubleattack'){first=mesh(12,[0xf8e8bc,0xe5bb78]);second=mesh(12,[0xe4d2a3,0xfff3d1]);}
 if(event.type==='manabreak'){first=mesh(18,[0x9adfff,0x7399e6,0xc8b4ef]);second=mesh(8,[0xd5eaff,0x8479c3]);}
 if(event.type==='violentforce'){first=mesh(24,[0xffc75f,0xe98e42,0xffe8a3]);second=mesh(1,0xffb45a,resources.ring);}
 if(event.type==='hurricane'){first=mesh(48,[0xe7e3c4,0xc8dccb,0x9dbdae]);second=mesh(1,0xd7dfb7,resources.ring);}
 if(event.type==='hurricanePulse')first=mesh(32,[0xf7e9be,0xc5d7bb]);
 const owned=[{dispose(){if(released)return;released=true;release();}}];
 const controller={
  duration,
  update(context){
   const time=context.time,age=Math.max(0,time-birth),unit=sourceUnit(context,event.source),target=sourceUnit(context,event.target),snapshot=event.type==='violentforce'?unit?.violentForce:unit?.hurricane,until=persistent?Math.min(birth+duration,snapshot?.until??birth+duration):birth+duration;
   if(time>=until||persistent&&(!unit?.alive||!snapshot||snapshot.until<=time)){group.visible=false;return false;}
   group.visible=time>=birth;if(!group.visible)return true;
   const at=anchor(point,context,event.type==='manabreak'||event.type==='doubleattack'?target:unit,event.type==='manabreak'||event.type==='doubleattack'?event.target:event.source,event,event.type==='manabreak'||event.type==='doubleattack'),radius=event.radius||0;
   group.position.set(at.x,event.type==='manabreak'||event.type==='doubleattack'?at.hitY:at.ground,at.z);group.rotation.set(0,0,0);
   if(event.type==='doubleattack')group.rotation.y=Math.atan2((event.tx??at.x)-(event.x??unit?.x??at.x),(event.tz??at.z)-(event.z??unit?.z??at.z));
   const pose=Math.floor(age*8);if(pose===lastPose&&radius===lastRadius)return true;lastPose=pose;lastRadius=radius;const t=pose/8,fade=Math.min(1,Math.max(0,(duration-age)*5));
   if(event.type==='doubleattack'){
    for(let slash=0;slash<2;slash++){const object=slash?second:first,local=pose-slash*2;object.count=local>=0&&local<3?12:0;for(let i=0;i<12;i++){const a=-1.2+i/11*2.4,side=slash?1:-1,r=.7*at.size;put(object,i,Math.sin(a)*r,Math.cos(a)*r*.7,.08+slash*.12,.12,.1,.3*fade,0,side*.45,-a*side+slash*.7);}}
   }else if(event.type==='manabreak'){
    // Every fragment originates at the victim. No stream goes to the attacker.
    for(let i=0;i<18;i++){const a=i*2.3999,r=(.12+t*1.65)*(i%3+1)/3;put(first,i,Math.sin(a)*r,t*(.7+(i%4)*.12),Math.cos(a)*r,.11*fade,.19*fade,.11*fade,t+i,0,a);}
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;put(second,i,Math.sin(a)*(.35+t),.18+Math.cos(a)*(.35+t),.08,.22*fade,.07,.1,0,0,-a);}
   }else if(event.type==='violentforce'){
    const lift=at.hitY-at.ground-1.1*at.size;
    for(let i=0;i<24;i++){const a=i/8*Math.PI*2+(pose%8)*.18,level=Math.floor(i/8),y=.25+level*.6+((pose+i)%8)/8*.25;put(first,i,Math.sin(a)*.83*at.size,lift+y*at.size,Math.cos(a)*.83*at.size,.13*fade,.32*fade,.12,0,-a,i%2?.2:-.2);}
    put(second,0,0,.07,0,at.size*1.1,at.size*1.1,1,-Math.PI/2);
   }else if(event.type==='hurricane'){
    const lift=Math.max(0,at.hitY-at.ground-1.3*at.size);
    for(let i=0;i<48;i++){const layer=Math.floor(i/16),a=i/16*Math.PI*2+pose*.55+layer*.7,r=radius*(.58+layer*.13);put(first,i,Math.sin(a)*r,lift+.3+layer*.42+Math.sin(a)*.13,Math.cos(a)*r,.12,.12,.44*fade,0,a+.65,.08);}
    // Geometry's outer edge is exactly one; scale by the authoritative radius.
    put(second,0,0,.065,0,radius,radius,1,-Math.PI/2);group.userData.radius=radius;
   }else{
    const r=radius*Math.min(.97,.65+t*.75);for(let i=0;i<32;i++){const a=i/32*Math.PI*2+pose*.15;put(first,i,Math.sin(a)*r,.12+(i%3)*.05,Math.cos(a)*r,.1*fade,.12,.3*fade,0,a);}
    group.userData.radius=radius;
   }
   for(const object of meshes)object.instanceMatrix.needsUpdate=true;return true;
  }
 };
 return{group,e:event,owned,mat:resources.material,techniqueArt:controller};
}

export function updateTechniqueEffect(entry,context){return entry?.techniqueArt?.update(context)??false;}
