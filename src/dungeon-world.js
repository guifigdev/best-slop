import * as T from 'three';
import {dungeonPropParts,dungeonRockParts,dungeonWallParts} from './dungeon-prop-art.js';
import {DUNGEON_BIOMES as BIOMES} from '../shared/dungeon-catalog.js';
import {dungeonFloorHeight} from '../shared/dungeon-design.js';

const STRUCTURES=new Set(['chest','keyChest','merchant','shrine','portal','corpse','eggNest','breakable','prop','campfire']);
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
const fallback=()=>BIOMES.cavern||BIOMES.crypt;
export function dungeonGroundHeight(map,x,z){return map?dungeonFloorHeight(map,x,z):0;}
export function dungeonBiomeAt(map,x,z){
 const rooms=map.rooms||[];let first=null,second=null;
 for(const room of rooms){const distance=Math.hypot((x-room.x)/(room.w*.55),(z-room.z)/(room.d*.55)),point={room,distance};if(!first||distance<first.distance){second=first;first=point;}else if(!second||distance<second.distance)second=point;}
 const a=BIOMES[first?.room.biome||map.biome]||fallback(),b=BIOMES[second?.room.biome||map.biome]||a,mix=!first||!second||first.distance<.7?0:Math.max(0,Math.min(.5,.5-(second.distance-first.distance)*.8));return{biome:a,other:b,mix,room:first?.room};
}

export function dungeonCorridorLanterns(map){
 const out=[],seen=new Set(),size=map.tileSize||1.5;
 for(const path of map.corridorPaths||[])for(let i=0;i<path.points.length;i+=4){const p=path.points[i],gx=Math.round(p.x/size+(map.width-1)/2),gz=Math.round(p.z/size+(map.height-1)/2),index=gz*map.width+gx;if(map.tiles[index]!==2||seen.has(index))continue;seen.add(index);out.push({...p,id:'passage-'+index,biome:dungeonBiomeAt(map,p.x,p.z).biome});}
 return out;
}

export function createDungeonWorld({scene}){
 const root=new T.Group();root.name='nordic-dungeon';root.visible=false;scene.add(root);
 const rangeGeometry=new T.RingGeometry(.985,1,48),rangeMaterial=new T.MeshBasicMaterial({color:0xe2bc72,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false,toneMapped:false});
 const cube=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial(),glow=new T.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false,toneMapped:false}),cutaway=new T.MeshLambertMaterial({transparent:true,opacity:.16,depthWrite:false}),batches=new Map(),dummy=new T.Object3D(),color=new T.Color(),other=new T.Color();
 const lights=Array.from({length:5},(_,i)=>{const light=new T.PointLight(i===0?0xffd6a7:0xffc478,i===0?40:65,i===0?20:24,1.5);light.castShadow=i===0;light.shadow.mapSize.set(512,512);light.shadow.bias=-.001;light.shadow.normalBias=.04;light.visible=false;root.add(light);return light;});
 let key=null,current=null,currentMap=null,disposed=false,pose=-1,oldSky=null,oldFog=null,appliedSky=null,visibleRooms=new Set(),corridorLanterns=[];
 function batch(name,capacity,mat=material,geometry=cube){let mesh=batches.get(name);if(mesh&&mesh.instanceMatrix.count>=capacity)return mesh;if(mesh){mesh.removeFromParent();mesh.dispose();}mesh=new T.InstancedMesh(geometry,mat,Math.max(1,capacity));mesh.count=0;mesh.castShadow=mat===material&&name!=='floor';mesh.receiveShadow=mat===material;mesh.frustumCulled=false;mesh.name='dungeon-'+name;root.add(mesh);batches.set(name,mesh);return mesh;}
 function put(mesh,index,x,y,z,w,h,d,value,ry=0,rx=0,rz=0){if(index>=mesh.instanceMatrix.count)throw new Error('Dungeon art batch capacity exceeded: '+mesh.name);dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.set(value));}
 function done(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 const roomVisible=room=>room==null||visibleRooms.has(room);
 const biome=(map,x,z)=>dungeonBiomeAt(map,x,z).biome;
 function terrain(map,clash,focus,camera,objects){
  const fx=focus?.x||0,fz=focus?.z||0,dx=(camera?.position.x??fx+10)-fx,dz=(camera?.position.z??fz+20)-fz,angle=Math.round(Math.atan2(dx,dz)*4/Math.PI),broken=(map.props||[]).filter(p=>p.broken||p.alive===false).map(p=>p.id).join(),next=[clash?'clash':map.seed,map.floor,map.width,map.height,[...visibleRooms].join(','),Math.round(fx/8),Math.round(fz/8),angle,broken].join(':');
  if(next===key)return;key=next;pose=-1;
  const size=map.tileSize||1.5,floor=batch('floor',(map.width||1)*(map.height||1)+2),walls=batch('walls',(map.walls?.length||0)*64+64),front=batch('cutaway',(map.walls?.length||0)*64+1,cutaway),detail=batch('formations',(map.walls?.length||0)*4+(map.props?.length||0)*160+(map.decor?.length||0)*160+(map.rooms?.length||0)*50+corridorLanterns.length*8+64),flora=batch('flora',(map.rooms?.length||0)*42+corridorLanterns.length*3+32);let n=0,k=0,f=0,j=0,v=0;
  const write=(mesh,...args)=>{if(mesh===walls)put(mesh,k++,...args);else put(mesh,f++,...args);};
  if(clash){put(floor,n++,0,-.1,0,58,.4,58,fallback().floor);for(let i=0;i<28;i++){const a=i/28*Math.PI*2;put(walls,k++,Math.sin(a)*28,4.5,Math.cos(a)*28,2.2,9,2.2,fallback().wall);}}
  else{
   for(let gz=0;gz<map.height;gz++)for(let gx=0;gx<map.width;gx++){
    const tile=map.tiles[gz*map.width+gx],x=(gx-(map.width-1)/2)*size,z=(gz-(map.height-1)/2)*size,blend=dungeonBiomeAt(map,x,z),a=blend.biome,b=blend.other,field=tile===2?'path':tile?'floor':'wall',h=dungeonGroundHeight(map,x,z),shade=.91+hash(gx,gz)*.16;
    color.setHex(a[field]);other.setHex(b[field]);color.lerp(other,blend.mix).multiplyScalar(shade);if(blend.room&&!roomVisible(blend.room.id))color.multiplyScalar(.1);const tint=color.getHex();put(floor,n++,x,h-.25,z,size+.002,.5,size+.002,tint);
   }
   const directionLength=Math.hypot(dx,dz)||1,interactive=new Set(objects.map(o=>o.propId).filter(Boolean));
   for(const wall of map.walls||[]){
    const local=dungeonBiomeAt(map,wall.x,wall.z),a=local.biome,ground=dungeonGroundHeight(map,wall.x,wall.z),seed=hash(wall.gx??wall.x,wall.gz??wall.z),height=8+seed*4,near=((wall.x-fx)*dx+(wall.z-fz)*dz)/directionLength>2&&Math.hypot(wall.x-fx,wall.z-fz)<32,mesh=near?front:walls,stone=roomVisible(local.room?.id)?a.wall:0x172126;if(!roomVisible(local.room?.id)&&Math.hypot(wall.x-fx,wall.z-fz)>28)continue;
    for(const part of dungeonWallParts({id:'wall-'+wall.x+':'+wall.z,w:size,d:size,h:height,biome:local.room?.biome||map.biome}))write(mesh,wall.x+part[0],ground+part[1],wall.z+part[2],...part.slice(3));
    // Stalactites stay on the wall lip, never above the traversable centre.
    if(seed>.65){for(let i=0;i<3;i++)write(mesh,wall.x,ground+height-.5-i*.55,wall.z,size*(.55-i*.13),.65,size*(.55-i*.13),a.trim);}
    if(seed>.87){put(detail,j++,wall.x,ground+.4,wall.z,size*.75,.8,size*.65,a.trim,seed);put(detail,j++,wall.x,ground+1,wall.z,size*.36,.6,size*.34,a.wall,seed);}
   }
   for(const prop of [...(map.props||[]),...(map.decor||[])]){
    if(prop.broken||prop.alive===false||interactive.has(prop.id)||!roomVisible(prop.room))continue;const a=biome(map,prop.x,prop.z),h=dungeonGroundHeight(map,prop.x,prop.z),w=prop.w||1,d=prop.d||1,height=prop.h||2;
    if(/tree|root/.test(prop.type)){put(detail,j++,prop.x,h+height*.45,prop.z,w*.4,height*.9,d*.4,0x635947);for(const s of [-1,1])put(detail,j++,prop.x+s*w*.3,h+height*.7,prop.z,w*.65,.3,d*.5,0x75865e);}
    else for(const part of dungeonPropParts(/pillar|column|arch/.test(prop.type)?'pillar':/crystal|ice/.test(prop.type)?'crystal':['supplies','shelf','bedroll','urn','crate','barrel'].includes(prop.type)?prop.type:'rock',{id:prop.id,w,d,h:height,biome:map.rooms?.find(r=>r.id===prop.room)?.biome||map.biome}))put(detail,j++,prop.x+part[0],h+part[1],prop.z+part[2],...part.slice(3));
   }
   for(const room of map.rooms||[]){if(!roomVisible(room.id))continue;const a=BIOMES[room.biome||map.biome]||fallback();for(let side=0;side<4;side++){
    const sign=side%2?1:-1,x=room.x+(side<2?sign*(room.w/2-1.3):sign*room.w*.22),z=room.z+(side>=2?sign*(room.d/2-1.3):sign*room.d*.22),h=dungeonGroundHeight(map,x,z);
    // Hand-authored context groups: jars/bones, roots/fungi, ice/crystals.
    if(a===BIOMES.crypt){put(detail,j++,x,h+.42,z,.6,.8,.6,0x9a8063);put(detail,j++,x,h+.9,z,.37,.16,.37,0xc2b594);put(detail,j++,x+.7,h+.2,z+.2,.4,.35,.4,0xd6cdb0);put(detail,j++,x+.7,h+.22,z+.42,.26,.1,.03,0x29363b);}
    else if(a===BIOMES.forest){for(let i=0;i<3;i++){put(flora,v++,x+(i-1)*.4,h+.4+i%2*.25,z,.1,.8+i%2*.5,.1,0x687e52);put(flora,v++,x+(i-1)*.4,h+.8+i%2*.5,z,.7,.16,.65,0x9bb77b);}}
    else{for(let i=0;i<3;i++)put(detail,j++,x+(i-1)*.4,h+.45+i%2*.25,z,.32,.9+i%2*.5,.38,i%2?a.glow:a.trim,i*.3);}
    put(detail,j++,x,h+2.2,z,.16,1,.16,0x584a3e);put(detail,j++,x,h+2.88,z,.42,.25,.42,0xc28c53);put(flora,v++,x,h+3.12,z,.18,.35,.18,a.glow);
   }}
  }
  for(const lamp of corridorLanterns){const h=dungeonGroundHeight(map,lamp.x,lamp.z),a=lamp.biome;put(detail,j++,lamp.x,h+.09,lamp.z,.65,.18,.65,0x4c514c);put(detail,j++,lamp.x,h+.65,lamp.z,.15,1.2,.15,0x6b5441);put(detail,j++,lamp.x,h+1.35,lamp.z,.4,.2,.4,0x9e8058);put(flora,v++,lamp.x,h+1.63,lamp.z,.22,.4,.22,a.glow);}
  done(floor,n);done(walls,k);done(front,f);done(detail,j);done(flora,v);
 }
 function dynamic(map,time,objects,doors,hazards){
  const frame=Math.floor(time*8);if(frame===pose)return;pose=frame;
  const props=batch('objects',objects.length*220+doors.length*30+32),runes=batch('runes',objects.length*24+32,glow),danger=batch('hazards',hazards.length*65+16),ambient=batch('critters',(map.rooms?.length||0)*24+32),ranges=batch('rest-ranges',objects.length+1,rangeMaterial,rangeGeometry);let n=0,k=0,hc=0,ac=0,rc=0;
  for(const door of doors){if(!door.locked||!roomVisible(door.room))continue;const a=biome(map,door.x,door.z),y=dungeonGroundHeight(map,door.x,door.z),vertical=door.w<door.d,span=vertical?door.d:door.w,count=Math.min(24,Math.max(3,Math.ceil(span/.65)));for(let i=0;i<count;i++){const f=(i/(count-1)-.5)*span;put(props,n++,door.x+(vertical?0:f),y+2.7,door.z+(vertical?f:0),vertical?.22:.16,5.4,vertical?.16:.22,0x4b4547);}put(props,n++,door.x,y+5.55,door.z,door.w,.35,door.d,a.trim);for(const height of [1.1,4])put(props,n++,door.x,y+height,door.z,vertical?.26:door.w,.16,vertical?door.d:.26,0xa48c61);}
  for(const o of objects){if(o.broken||o.alive===false||!roomVisible(o.room))continue;const x=o.x,z=o.z,y=dungeonGroundHeight(map,x,z),a=biome(map,x,z),p=(dx,dy,dz,w,h,d,c)=>put(props,n++,x+dx,y+dy,z+dz,w,h,d,c),r=(dx,dy,dz,w,h,d,c)=>put(runes,k++,x+dx,y+dy,z+dz,w,h,d,c);
   if(o.type==='campfire'){
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;p(Math.sin(a)*.73,.18,Math.cos(a)*.65,.34,.32,.32,0x726d62);}p(0,.17,0,.9,.17,.8,0x403732);for(const side of [-1,1])p(side*.15,.29,0,.17,.18,1.05,0x6d4f39);if(o.active!==false){for(let i=0;i<6;i++){const yy=.46+(i%3)*.22+(frame+i)%3*.055;r((i%2-.5)*.22,yy,Math.sin(frame+i)*.12,.3-(i%3)*.065,.38,.27-(i%3)*.045,i%2?0xffd18a:0xe89a53);}if(o.healing)r(0,1.32+(frame%4)*.07,0,.14,.14,.14,0xd8eab3);}put(ranges,rc++,x,y+.055,z,o.radius||3.5,o.radius||3.5,1,o.active===false?0x8b8170:0xe2bc72,0,-Math.PI/2);
   }else if(['chest','keyChest'].includes(o.type)&&o.variant!=='nest'){
    const stone=o.variant==='stone',iron=o.variant==='iron'||o.requiresKey,body=stone?a.wall:iron?0x7f9496:0x806144,trim=stone?a.trim:iron?0xb8c9bd:0xc4a166;p(0,.48,0,1.55,.94,1.04,body);for(let i=0;i<3;i++)p(0,1.02+i*.13,0,1.62-i*.17,.15,1.13-i*.15,trim);for(const s of [-1,1])p(s*.5,.58,.55,.12,.94,.09,0xe0c78b);p(0,.69,.61,.22,.3,.1,o.locked||o.keyLocked?0xc58c61:0xddd8b2);if(o.locked||o.keyLocked){p(0,.59,.68,.06,.06,.05,0x29343a);r(0,1.65,.1,.35,.08,.08,o.requiresKey?0xe4b96f:0xdd9e87);r(0,1.65,.1,.08,.35,.08,o.requiresKey?0xe4b96f:0xdd9e87);}else for(const s of [-1,1])r(s*.38,1.38+(frame%4)*.035,0,.08,.18,.08,0xe6cf8c);
   }else if(o.type==='eggNest'||o.propType==='eggNest'||o.variant==='nest'){
    for(let i=0;i<10;i++){const angle=i/10*Math.PI*2;p(Math.sin(angle)*.95,.22,Math.cos(angle)*.75,.42,.3,.35,0x6d5d59);}for(let i=0;i<5;i++){const dx=(i%3-1)*.49,dz=(Math.floor(i/3)-.5)*.55;p(dx,.62,dz,.43,.82,.48,i%2?0xbcb5a2:0x9eaa8c);p(dx,.99,dz,.28,.2,.3,0xd7cfb6);r(dx,.7,dz+.25,.05,.38,.03,0xb4d9a0);}
   }else if(o.type==='breakable'||o.type==='prop'){
    const original=map.props?.find(p=>p.id===o.propId),type=o.propType||original?.type||'crate';
    for(const part of dungeonPropParts(type,{id:o.id,w:original?.w||o.w||1.25,d:original?.d||o.d||1.25,h:original?.h||o.h||1.6,biome:map.rooms?.find(r=>r.id===o.room)?.biome||map.biome}))put(props,n++,x+part[0],y+part[1],z+part[2],...part.slice(3));

   }else if(o.type==='key'){p(0,.43,0,.64,.15,.64,0x514c3d);r(0,.79,.08,.11,.65,.12,0xf0d18b);r(0,1.13,.08,.39,.12,.12,0xf0d18b);r(.12,.58,.08,.25,.1,.12,0xf0d18b);}
   else if(o.type==='merchant'){p(0,.48,0,2.3,.85,1.4,0x7d6651);p(0,1.2,-.4,.8,.6,.65,0x59696e);p(0,1.7,-.32,.58,.48,.52,0xb3ad91);p(0,1.97,-.35,.76,.18,.68,0x73638b);p(0,2.7,-.5,3.1,.25,2.1,0x89779d);for(const s of [-1,1]){p(s*1.35,1.4,-.5,.13,2.8,.13,0x80664d);p(s*.61,1.04,.44,.43,.24,.42,s<0?0xc9b07c:0xb4a1c7);}}
   else if(o.type==='shrine'){p(0,.2,0,1.9,.4,1.9,a.wall);p(0,1.3,0,.72,2.2,.72,a.trim);p(0,2.55,0,1.24,.4,1,a.wall);r(0,1.47,.4,.17,1,.08,a.glow);r(0,1.5,.41,.6,.16,.08,a.glow);}
   else if(o.type==='portal'){const tint=o.locked?0x8b7566:a.glow;if(o.appearance==='stairs'){p(0,-.01,0,4.4,.15,5,0x0d181e);for(let i=0;i<7;i++)p(0,.04+i*.13,1.85-i*.55,3.2,.22,.57,a.trim);for(const s of [-1,1])p(s*1.9,1,0,.42,2,5,a.wall);}else{p(0,2,-.45,4.9,4,.4,0x071015);for(const s of [-1,1]){p(s*2,2,0,1.05,4,1.55,a.wall);p(s*1.35,4.2,0,1.15,.9,1.65,a.trim);}p(0,4.82,0,1.9,.65,1.65,a.wall);}if(o.locked){for(let i=-2;i<=2;i++)p(i*.65,1.6,.7,.14,3.2,.14,0x4b4541);p(0,1.5,.78,3.5,.2,.12,0xb3976b);}else for(let i=0;i<12;i++)r(Math.sin(i*Math.PI/6)*1.7,.18,Math.cos(i*Math.PI/6)*1.7,.18,.13,.18,tint);}
   else if(o.type==='corpse'){p(0,.2,0,.8,.3,1.3,0x887e8c);r(0,1.4+(frame%4)*.04,0,.6,.17,.17,0xc9d6c2);r(0,1.4+(frame%4)*.04,0,.17,.6,.17,0xc9d6c2);}
   else if(o.type==='gold'){for(let i=0;i<3;i++)p((i-1)*.18,.18+i%2*.11,i%2*.15,.26,.17,.26,0xe8be6e);}
   else{const tint=({legendary:0xedc26c,epic:0xbc95cd,rare:0x83bdcb})[o.rarity]||0xc1ceb4;p(0,.18,0,.55,.2,.55,0x665643);if(o.type==='fragment'){p(0,.46,0,.5,.35,.4,tint);r(0,.7+(frame%4)*.035,0,.19,.17,.19,tint);}else{p(0,.5,0,.15,.73,.18,tint);p(0,.25,0,.52,.13,.27,0xa58d64);}}
  }
  for(const hazard of hazards){if(!roomVisible(hazard.room))continue;const x=hazard.x,z=hazard.z,w=hazard.w||2,d=hazard.d||2,y=dungeonGroundHeight(map,x,z)+.035,active=hazard.active===true;
   if(hazard.type==='pit'){put(danger,hc++,x,y,z,w,.07,d,0x08131a);for(const side of [-1,1]){put(danger,hc++,x+side*(w/2-.1),y+.07,z,.18,.16,d,0x414f55);put(danger,hc++,x,y+.07,z+side*(d/2-.1),w,.16,.18,0x414f55);}}
   else if(hazard.type==='spikes'){put(danger,hc++,x,y,z,w,.08,d,active?0x956254:0x576368);const nx=Math.min(6,Math.max(2,Math.floor(w/.65))),nz=Math.min(6,Math.max(2,Math.floor(d/.65)));for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const px=x+(i/(nx-1)-.5)*(w-.35),pz=z+(j/(nz-1)-.5)*(d-.35);put(danger,hc++,px,y+(active?.47:.12),pz,.16,active?.86:.16,.16,active?0xe4c5a1:0xaeb9b4);}}
   else if(hazard.type==='ice'){put(danger,hc++,x,y,z,w,.09,d,0x9ed2df);for(let i=0;i<5;i++)put(danger,hc++,x+(i-2)*w*.16,y+.07,z+(i%2-.5)*d*.4,w*.12,.025,d*.62,0xd9edf0,(i-2)*.1);}
   else{put(danger,hc++,x,y,z,w,.08,d,0x4c3b36);for(let i=0;i<12;i++){const px=x+((i%4)/3-.5)*w*.82,pz=z+(Math.floor(i/4)/2-.5)*d*.8;put(danger,hc++,px,y+.08+(active?(frame+i)%4*.09:0),pz,w*.12,active?.38:.06,d*.12,active?0xf5bd68:0x9b6549);}}
  }
  for(const room of map.rooms||[]){if(!roomVisible(room.id))continue;for(let i=0;i<3;i++){const phase=frame*.025+i*2.1+room.id,x=room.x+Math.sin(phase)*(room.w/2-2),z=room.z+Math.cos(phase*.7)*(room.d/2-2),y=dungeonGroundHeight(map,x,z),bat=i===2;put(ambient,ac++,x,bat?y+5:y+.13,z,bat?.22:.35,bat?.18:.2,bat?.3:.5,bat?0x4b4b60:0x6d6d64);if(bat){for(const side of [-1,1])put(ambient,ac++,x+side*.3,y+5+(frame%2)*.12,z,.43,.05,.22,0x625b71);}else put(ambient,ac++,x,y+.12,z-.4,.08,.07,.45,0x99867e);}}
  done(props,n);done(runes,k);done(danger,hc);done(ambient,ac);done(ranges,rc);
 }
 function restore(){if(scene.background===appliedSky&&oldSky)scene.background=oldSky;if(oldFog&&scene.fog)scene.fog.color.copy(oldFog);oldSky=oldFog=appliedSky=null;}
 return{root,heightAt:(x,z)=>dungeonGroundHeight(currentMap,x,z),update(state,time=0,owner=null,focus=null,camera=null){
  if(disposed)return;const active=state?.options?.mode==='dungeon';root.visible=active;if(!active){restore();current=currentMap=null;key=null;pose=-1;return;}current=state.dungeon;const clash=current?.stage==='clash'||current?.stage==='finished'&&!current.map,map=current?.map||(clash?{seed:-1,floor:current.floor,width:1,height:1,tileSize:1.5,biome:current.biome,rooms:[],walls:[],decor:[],tiles:[1]}:null);if(currentMap!==map)corridorLanterns=map?dungeonCorridorLanterns(map):[];currentMap=map;if(!map){for(const light of lights)light.visible=false;return;}
  if(!appliedSky){oldSky=scene.background;oldFog=scene.fog?.color.clone();appliedSky=new T.Color(0x050b10);scene.background=appliedSky;}if(scene.fog)scene.fog.color.setHex(0x101b22);
  visibleRooms=new Set(current.visibility?.visibleRooms||map.rooms.map(r=>r.id));const objects=current.objects||[];terrain(map,clash,focus,camera,objects);dynamic(map,time,objects,current.doors||[],current.hazards||map.hazards||[]);
  const hero=state.units?.find(u=>u.id===state.players?.[owner]),near=[];for(const room of map.rooms||[])if(roomVisible(room.id))for(const s of [-1,1])near.push({x:room.x+s*(room.w/2-1.8),z:room.z+s*(room.d/2-1.8),biome:BIOMES[room.biome||map.biome]||fallback()});for(const o of objects)if(o.type==='campfire'&&o.active!==false)near.push({x:o.x,z:o.z,biome:null,campfire:true});for(const lamp of corridorLanterns)near.push(lamp);near.sort((a,b)=>Math.hypot(a.x-(focus?.x??hero?.x??0),a.z-(focus?.z??hero?.z??0))-Math.hypot(b.x-(focus?.x??hero?.x??0),b.z-(focus?.z??hero?.z??0)));
  lights[0].visible=!!hero;if(hero)lights[0].position.set(hero.x,dungeonGroundHeight(map,hero.x,hero.z)+3.8,hero.z);for(let i=1;i<lights.length;i++){const torch=near[i-1];lights[i].visible=!!torch;if(torch){lights[i].position.set(torch.x,dungeonGroundHeight(map,torch.x,torch.z)+3.1,torch.z);lights[i].color.setHex(torch.campfire?0xffbd75:torch.biome===BIOMES.frost?0xb5dfe6:torch.biome===BIOMES.void?0xc6acd9:0xffc589);}}
 },pick(point){if(!root.visible||!point)return null;const near=(current?.objects||[]).filter(o=>!o.broken&&o.alive!==false&&roomVisible(o.room)&&Math.hypot(point.x-o.x,point.z-o.z)<(STRUCTURES.has(o.type)?1.45:.85)).sort((a,b)=>Math.hypot(point.x-a.x,point.z-a.z)-Math.hypot(point.x-b.x,point.z-b.z));return near[0]?{dungeonObject:near[0].id}:null;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of batches.values())mesh.dispose();cube.dispose();rangeGeometry.dispose();rangeMaterial.dispose();material.dispose();glow.dispose();cutaway.dispose();for(const light of lights)light.shadow.map?.dispose();restore();}};
}
