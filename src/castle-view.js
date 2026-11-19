import * as T from 'three';
import {CASTLE_BUILDINGS,CASTLE_RACES,CASTLE_ITEMS} from '../shared/castle-catalog.js';
import {castleMap} from '../shared/castle-map.js';
import {castleBuildCheck} from '../shared/castle-build-rules.js';
import {normalizeVoxelMap} from '../shared/voxel-map.js';
import {buildVoxelTerrain,terrainHeight} from './voxel-terrain.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const num=(value,fallback)=>Number.isFinite(value)?value:fallback;
const teamColor=team=>team===1?0x5b92cf:team===2?0xd16d5f:0xbba8e0;
const raceColor=race=>{const value=CASTLE_RACES[race]?.color;return new T.Color(value||'#8ba581').getHex();};
// W3E ground indices are native Ashenvale materials, not the generic game's
// eight-biome palette. Colors below are original voxel interpretations.
const nativePalette=['light-dirt','dirt-ashenvale','grass','rock','grassy-dirt','vines','rough-dirt','leaves','stonepath'].map((id,i)=>({id,name:id,color:['#a89b68','#8d744e','#6f914f','#77796b','#788053','#536b40','#72583d','#87683f','#9b998b'][i],walkable:1}));

// Original architecture: each race has a distinct roofline and construction
// vocabulary, rather than the same house with a different roof color.
export function createCastleView({scene,voxel,bake,overlay}){
 const root=new T.Group(),ground=new T.Group(),structures=new T.Group();root.name='castle-fight';root.add(ground,structures);scene.add(root);let layout='',entries=new Map(),state=null,selection=null,disposed=false,terrainMap=null,lastMap=null;
 const owned=new Set(),barGeometry=new T.BoxGeometry(1,1,1),barBackground=new T.MeshBasicMaterial({color:0x263b33,depthWrite:false}),healthMaterial=new T.MeshBasicMaterial({color:0x81db9a,depthWrite:false,toneMapped:false}),enemyHealthMaterial=new T.MeshBasicMaterial({color:0xf18272,depthWrite:false,toneMapped:false}),progressMaterial=new T.MeshBasicMaterial({color:0xf0d390,depthWrite:false,toneMapped:false});
 const ringGeo=new T.RingGeometry(1,1.07,32),ringMat=new T.MeshBasicMaterial({color:0xf2d48b,side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false,toneMapped:false}),ring=new T.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;ring.visible=false;root.add(ring);
 const ghostMat=new T.MeshBasicMaterial({color:0x8ce3b1,transparent:true,opacity:.3,depthWrite:false}),ghostGeo=new T.BoxGeometry(1,1,1),ghost=new T.Mesh(ghostGeo,ghostMat);ghost.visible=false;root.add(ghost);
 const staffRangeGeometry=new T.RingGeometry(CASTLE_ITEMS.blast_staff.radius-.025,CASTLE_ITEMS.blast_staff.radius+.025,64),staffRangeMaterial=new T.MeshBasicMaterial({color:0x99d7ff,transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false,toneMapped:false}),staffRange=new T.Mesh(staffRangeGeometry,staffRangeMaterial);staffRange.rotation.x=-Math.PI/2;staffRange.visible=false;root.add(staffRange);
 const buildZones=new T.Group();buildZones.name='castle-build-zones';root.add(buildZones);const zoneEntries=[];
 const footprintGeometry=new T.PlaneGeometry(1,1),footprintMaterial=new T.MeshBasicMaterial({color:0x74efa6,transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false,toneMapped:false}),footprint=new T.Mesh(footprintGeometry,footprintMaterial);footprint.rotation.x=-Math.PI/2;footprint.visible=false;root.add(footprint);
 const footprintGridGeometry=new T.BufferGeometry();footprintGridGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(1536),3).setUsage(T.DynamicDrawUsage));footprintGridGeometry.setDrawRange(0,0);const footprintGridMaterial=new T.LineBasicMaterial({color:0x86ffb4,transparent:true,opacity:.9,depthWrite:false,toneMapped:false}),footprintGrid=new T.LineSegments(footprintGridGeometry,footprintGridMaterial);footprintGrid.frustumCulled=false;footprintGrid.visible=false;root.add(footprintGrid);
 let buildLabel=null,labelText='';if(overlay&&typeof document!=='undefined'){buildLabel=document.createElement('div');buildLabel.className='castle-build-preview';buildLabel.hidden=true;buildLabel.setAttribute('role','status');buildLabel.setAttribute('aria-live','polite');buildLabel.setAttribute('aria-atomic','true');Object.assign(buildLabel.style,{position:'absolute',background:'#f5f0e2f5',border:'1px solid #71b887',boxShadow:'0 3px 12px #173c2d44',borderRadius:'7px',color:'#315b3d',padding:'7px 10px',fontSize:'11px',fontWeight:'600',lineHeight:'1.5',pointerEvents:'none',transform:'translate(-50%,-100%)',zIndex:'12',maxWidth:'270px'});const host=overlay.getAttribute?.('aria-hidden')==='true'&&overlay.parentElement?overlay.parentElement:overlay;host.append(buildLabel);}
 function hideBuildPreview(){ghost.visible=footprint.visible=footprintGrid.visible=false;if(buildLabel)buildLabel.hidden=true;}
 const merge=group=>{const mesh=bake(group);if(mesh?.geometry)owned.add(mesh.geometry);return mesh;};
 function release(group){if(group.userData.dispose){group.removeFromParent();group.userData.dispose();return;}const geometries=new Set();group.traverse(o=>{if(o.geometry&&owned.has(o.geometry))geometries.add(o.geometry);});for(const geometry of geometries){geometry.dispose();owned.delete(geometry);}group.removeFromParent();}
 const groundHeight=(x,z)=>terrainMap?terrainHeight(terrainMap,x,z):0;
 function clear(group){for(const child of [...group.children])release(child);group.clear();}
 function rebuildBuildZones(map){
  clear(buildZones);zoneEntries.length=0;
  for(const zone of map.buildZones||[]){
   const group=new T.Group(),fillGeometry=new T.BufferGeometry(),lineGeometry=new T.BufferGeometry(),corners=[[zone.minX,zone.minZ],[zone.maxX,zone.minZ],[zone.maxX,zone.maxZ],[zone.minX,zone.maxZ]],positions=corners.map(([x,z])=>[x,groundHeight(x,z)+.035,z]);fillGeometry.setAttribute('position',new T.Float32BufferAttribute([positions[0],positions[1],positions[2],positions[0],positions[2],positions[3]].flat(),3));
   const linePoints=[];for(let i=0;i<4;i++){linePoints.push(new T.Vector3(...positions[i]),new T.Vector3(...positions[(i+1)%4]));}lineGeometry.setFromPoints(linePoints);
   const fillMaterial=new T.MeshBasicMaterial({color:0x63e691,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false,toneMapped:false}),lineMaterial=new T.LineBasicMaterial({color:0x73d995,transparent:true,opacity:.2,depthWrite:false,toneMapped:false}),fill=new T.Mesh(fillGeometry,fillMaterial),outline=new T.LineSegments(lineGeometry,lineMaterial);group.add(fill,outline);buildZones.add(group);fill.visible=false;
   group.userData.dispose=()=>{fillGeometry.dispose();lineGeometry.dispose();fillMaterial.dispose();lineMaterial.dispose();};zoneEntries.push({zone,fill,outline});
  }
 }
 function updateBuildPreview(snapshot,point,buildKey,owner,map,camera,container){
  const builder=snapshot.units?.find(u=>u.owner===owner&&u.hero),definition=CASTLE_BUILDINGS[buildKey],placing=!!(definition&&builder),team=state.players?.[owner]?.team??builder?.team;
  for(const entry of zoneEntries){const ally=entry.zone.team===team;entry.fill.visible=placing;entry.fill.material.color.setHex(ally?0x63e691:0xec7770);entry.fill.material.opacity=ally?.14:.045;entry.outline.visible=ally||placing;entry.outline.material.color.setHex(ally?0x73e7a0:0xe88c7f);entry.outline.material.opacity=placing?(ally?.85:.4):.2;}
  if(!placing||!Number.isFinite(point?.x)||!Number.isFinite(point?.z)){hideBuildPreview();return;}
  const check=castleBuildCheck(snapshot,builder,buildKey,point),size=definition.footprint||{w:3,d:3},grid=num(map.grid,.5),p=check.point||{x:Math.round(point.x/grid)*grid,z:Math.round(point.z/grid)*grid},color=check.allowed?0x77edac:0xff776e,floor=groundHeight(p.x,p.z);
  ghost.visible=footprint.visible=footprintGrid.visible=true;ghost.position.set(p.x,floor+.7,p.z);ghost.scale.set(size.w,1.4,size.d);ghostMat.color.setHex(color);ghostMat.opacity=.18;footprint.position.set(p.x,floor+.07,p.z);footprint.scale.set(size.w,size.d,1);footprintMaterial.color.setHex(color);footprintGridMaterial.color.setHex(color);
  let count=0;const attribute=footprintGridGeometry.attributes.position,line=(ax,az,bx,bz)=>{if(count+2>attribute.count)return;attribute.setXYZ(count++,ax,groundHeight(ax,az)+.09,az);attribute.setXYZ(count++,bx,groundHeight(bx,bz)+.09,bz);},minX=p.x-size.w/2,maxX=p.x+size.w/2,minZ=p.z-size.d/2,maxZ=p.z+size.d/2;
  line(minX,minZ,maxX,minZ);line(maxX,minZ,maxX,maxZ);line(maxX,maxZ,minX,maxZ);line(minX,maxZ,minX,minZ);for(let x=minX+grid;x<maxX-.001;x+=grid)line(x,minZ,x,maxZ);for(let z=minZ+grid;z<maxZ-.001;z+=grid)line(minX,z,maxX,z);attribute.needsUpdate=true;footprintGridGeometry.setDrawRange(0,count);
  if(buildLabel){const message=check.allowed?'Clique para construir · '+definition.name+' · '+definition.cost+' ouro':check.reason||'Não é possível construir aqui';if(message!==labelText){labelText=message;buildLabel.textContent=message;}buildLabel.dataset.valid=String(check.allowed);buildLabel.dataset.code=check.code||'';buildLabel.style.borderColor=check.allowed?'#71b887':'#d07b6e';buildLabel.style.color=check.allowed?'#315b3d':'#873b31';buildLabel.hidden=!camera||!container;if(camera&&container){const projected=new T.Vector3(p.x,floor+2,p.z).project(camera),width=container.clientWidth,height=container.clientHeight,maxWidth=Math.min(270,width-20),margin=Math.min(maxWidth/2+10,width/2);buildLabel.style.maxWidth=maxWidth+'px';buildLabel.hidden=projected.z< -1||projected.z>1;buildLabel.style.left=Math.max(margin,Math.min(width-margin,(projected.x*.5+.5)*width))+'px';buildLabel.style.top=Math.max(65,Math.min(height-20,(-projected.y*.5+.5)*height-10))+'px';}}
 }
 function architecture(parent,entry,{castle=false,tower=false}={}){
  const holder=new T.Group(),model=new T.Group(),definition=CASTLE_BUILDINGS[entry.key||entry.building]||{},race=entry.race||definition.race||'human',accent=raceColor(race),team=teamColor(entry.team),w=num(entry.w,3),d=num(entry.d,3);holder.position.set(entry.x,groundHeight(entry.x,entry.z),entry.z);holder.add(model);parent.add(holder);
  const block=(x,y,z,bw,bh,bd,color)=>voxel(model,x,y,z,bw,bh,bd,color),stone=0xbab79b,wood=0x806b50,ivory=0xded4b4,dark=0x4b5057;
  block(0,.16,0,w+.12,.3,d+.12,0x989d89);
  if(tower){
   block(0,.55,0,w*.9,.5,d*.9,0xbdbca7);for(const side of [-1,1]){block(side*.7,1.7,0,.45,2.3,.55,0x858899);block(side*.7,2.95,0,.7,.25,.8,0xd2c7ad);block(side*.53,3.3,0,.25,.6,.35,accent);}block(0,1.4,0,.7,1.4,.7,0x706b87);block(0,2.4,0,.55,.6,.55,0xc4b5ea);block(0,2.85,0,.3,.35,.3,0xe7dbb4);
  }else{
   switch(race){
    case 'elf':
     block(0,.9,0,w*.62,1.4,d*.64,0xd8d0aa);for(const side of [-1,1]){block(side*w*.32,1.3,0,.28,2.1,d*.76,0xdac887);block(side*w*.32,2.42,0,.45,.2,d*.9,accent);}for(let i=0;i<4;i++)block(0,1.7+i*.28,0,w*(.94-i*.18),.29,d*(.88-i*.15),i%2?0xadc080:accent);block(0,3.05,0,.16,.65,.18,0xefd58c);break;
    case 'nightelf':
     block(0,.75,0,w*.7,1.1,d*.72,0x727384);for(let i=0;i<3;i++)block(0,1.42+i*.27,0,w*(1-i*.2),.27,d*(.96-i*.18),i%2?0x8185b5:accent);for(const side of [-1,1]){block(side*w*.42,1.05,0,.32,1.6,.42,0x665f77);block(side*.32,2.6,0,.2,.55,.25,0xd7cfee);block(side*.23,2.98,0,.2,.28,.25,0xd7cfee);}block(0,2.4,0,.6,.15,.27,0xe3dbf1);break;
    case 'orc':
     block(0,.72,0,w*.73,1,d*.75,wood);for(let i=0;i<4;i++)block(0,1.3+i*.25,0,w*(1-i*.2),.3,d*(.98-i*.08),i%2?0xa37855:accent);for(const side of [-1,1]){block(side*w*.37,1.25,d*.38,.3,1.7,.3,0xd2bf8e);block(side*w*.31,2.1,d*.38,.23,.35,.26,ivory);block(side*w*.24,2.33,d*.38,.2,.2,.23,ivory);}block(0,.55,d*.4,.7,.8,.1,0x493c31);break;
    case 'undead':
     block(0,.85,0,w*.78,1.35,d*.78,0x61646f);for(let i=0;i<4;i++)block(0,1.6+i*.3,0,w*(.72-i*.16),.32,d*(.72-i*.16),i%2?0x818299:dark);for(const side of [-1,1]){block(side*w*.38,1.5,0,.3,2.2,.4,dark);block(side*w*.38,2.7,0,.5,.25,.55,accent);}block(0,1.05,d*.41,.8,.7,.12,0xc0c6b3);for(const side of [-1,1])block(side*.2,1.18,d*.45,.16,.18,.05,0x6ea878);block(0,.83,d*.46,.28,.18,.05,0x4b5852);block(0,3,0,.35,.4,.35,accent);break;
    case 'naga':
     block(0,.38,0,w,.2,d,0x70aeb0);for(let i=0;i<3;i++)block(0,.65+i*.35,0,w*(.9-i*.2),.36,d*(.9-i*.2),i%2?0x90b7ae:0x6c9692);for(const side of [-1,1]){block(side*w*.39,1.2,0,.4,1.6,d*.65,accent);block(side*w*.39,2.17,0,.3,.45,d*.45,0xc3d4b6);block(side*w*.31,2.43,0,.25,.25,d*.28,0xd6c982);}block(0,1.8,0,.4,.55,.4,0xb7e1d3);break;
    case 'north':
     block(0,.85,0,w*.8,1.35,d*.8,wood);for(const side of [-1,1])block(side*w*.35,1.05,d*.38,.25,1.7,.28,0xc0a472);for(let i=0;i<4;i++)block(0,1.58+i*.25,0,w*(1-i*.2),.29,d*.98,i%2?0x677e7c:accent);for(const side of [-1,1]){block(0,2.46,side*d*.43,.23,.5,.3,0xd9bd7b);block(0,2.8,side*d*.5,.2,.2,.35,0xe3cd96);}block(0,1,d*.43,.09,.6,.05,0xead49a);block(.12,1.1,d*.43,.3,.07,.05,0xead49a);break;
    case 'chaos':
     block(0,.85,0,w*.8,1.4,d*.8,dark);for(const side of [-1,1]){block(side*w*.36,1.65,0,.45,2.5,.6,0x454350);block(side*w*.32,3,0,.3,.35,.4,accent);block(side*w*.22,3.23,0,.25,.22,.3,0xffb05f);}block(0,1.5,d*.42,.2,1.3,.08,0xe77850);block(0,2,0,w*.55,.28,d*.6,0x8b4d4c);block(0,2.45,0,.65,.7,.6,accent);break;
    case 'corrupted':
     block(0,1.05,0,w*.42,1.8,d*.45,0x66566b);for(const side of [-1,1]){block(side*w*.28,.35,side*d*.15,w*.55,.45,.45,0x71616d);block(side*w*.27,1.7,0,.45,1.4,.5,0x66566b);block(side*w*.4,2.25,0,w*.45,.4,.65,0x786183);block(side*w*.44,2.62,0,.3,.5,.35,accent);}block(0,2.18,0,w*.7,.6,d*.7,0x706485);block(0,2.7,0,.45,.6,.45,accent);break;
    case 'mech':
     block(0,.85,0,w*.86,1.35,d*.8,0x909b99);block(0,1.65,0,w,.3,d,0x697d7b);for(const side of [-1,1]){block(side*w*.32,2.1,-d*.22,.48,1.3,.48,0x606b71);block(side*w*.32,2.82,-d*.22,.7,.22,.7,0xb3b8a9);block(side*w*.29,.85,d*.43,.48,.35,.08,0x9cddd8);}block(0,.72,d*.44,.58,.7,.14,0x465b61);block(0,.85,d*.54,.27,.27,.1,0xd8b96e);block(w*.4,.4,0,.3,.5,d*.85,accent);break;
    default:
     block(0,.9,0,w*.8,1.4,d*.8,stone);block(0,1.65,0,w,.28,d,accent);for(const side of [-1,1])for(let i=0;i<3;i++)block(side*w*.41,2,(-.32+i*.32)*d,.3,.5,.37,ivory);block(0,.7,d*.42,.6,1,.08,0x566359);block(0,2.25,0,.16,1.1,.16,0x907b59);block(.35,2.55,0,.65,.45,.08,team);
   }
   if(castle){for(const side of [-1,1])for(const front of [-1,1]){const color=['undead','chaos','corrupted'].includes(race)?dark:ivory;block(side*w*.4,1.6,front*d*.4,.65,2.9,.65,color);block(side*w*.4,3.12,front*d*.4,.85,.3,.85,team);block(side*w*.4,3.45,front*d*.4,.35,.4,.35,accent);}block(0,1,d*.45,.85,1.75,.12,dark);}
  }
  merge(model);const height=tower?3.4:castle?3.8:race==='chaos'?3.6:3.25;
  const hud=new T.Group();hud.position.y=height;holder.add(hud);const width=castle?Math.max(2.6,w):Math.max(1.7,w*.85),background=new T.Mesh(barGeometry,barBackground),health=new T.Mesh(barGeometry,healthMaterial),progressBg=new T.Mesh(barGeometry,barBackground),progress=new T.Mesh(barGeometry,progressMaterial);background.scale.set(width+.08,.15,.06);health.position.z=.04;health.scale.set(width,.1,.04);progressBg.position.y=-.22;progressBg.scale.set(width+.08,.1,.06);progress.position.set(0,-.22,.04);progress.scale.set(width,.065,.04);hud.add(background,health,progressBg,progress);for(const mesh of hud.children)mesh.onBeforeRender=(_renderer,_scene,camera)=>{hud.quaternion.copy(camera.quaternion);hud.updateMatrixWorld(true);};
  const scaffold=new T.Group();if(!castle&&!tower){for(const side of [-1,1])for(const front of [-1,1])voxel(scaffold,side*(w/2+.12),1.05,front*(d/2+.12),.12,2.1,.12,0xc7ab6e);for(const side of [-1,1])voxel(scaffold,0,1.8,side*(d/2+.12),w+.4,.13,.13,0xe1c48a);merge(scaffold);holder.add(scaffold);}scaffold.visible=false;
  return{group:holder,model,hud,background,health,progressBg,progress,scaffold,width,race,tower,castle};
 }
 function makeFloor(map){clear(ground);terrainMap=map.terrain?normalizeVoxelMap({...map.terrain,version:1,id:map.terrain.id||'castle-w3e',name:map.terrain.name||'Castle Fight · terreno de Ashenvale',palette:map.terrain.palette||nativePalette}):null;if(terrainMap){const terrain=buildVoxelTerrain(terrainMap,{decorations:false});terrain.name='castle-native-terrain';ground.add(terrain);return;}voxel(ground,0,-.3,0,map.width,.6,map.depth,0x91a17b);for(let z=map.minZ;z<map.maxZ;z+=2)for(let x=map.minX;x<map.maxX;x+=2){const lane=map.lanes.some(l=>Math.abs(z+1-l.z)<2),base=Math.abs(x+1)>12;voxel(ground,x+1,.015,z+1,1.98,.07,1.98,lane?0xc4ba96:base?(x<0?0x829a94:0xa8997d):(z/2+x/2)%2?0x9aaa82:0x93a47c);}for(const lane of map.lanes)for(const x of [-11,11])voxel(ground,x,.08,lane.z,.25,.12,4.8,0xe4d4a9);for(const z of [map.minZ+.3,map.maxZ-.3])voxel(ground,0,.5,z,map.width,.9,.6,0xb7b197);for(const z of [-2,2])voxel(ground,0,.2,z,4,.35,.5,0xc8cbb3);merge(ground);}
 return{
  setSelection(id){selection=id;},
  pick(point){if(!root.visible||!state||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return null;if(Math.hypot(point.x-state.map.tower.x,point.z-state.map.tower.z)<2.4)return{castleTower:true};const b=(state.buildings||[]).filter(b=>b.alive&&Math.abs(point.x-b.x)<num(b.w,3)/2+.3&&Math.abs(point.z-b.z)<num(b.d,3)/2+.3).at(-1);return b?{castleBuilding:b.id}:null;},
  update(snapshot,point,buildKey,owner,camera,container){
   if(disposed)return;const active=snapshot?.options?.mode==='castlefight';root.visible=active;if(!active){hideBuildPreview();return;}state=snapshot.castleFight||{map:castleMap(snapshot.options.laneCount),buildings:[],teams:[],players:{}};const map=state.map||castleMap(snapshot.options.laneCount),sig=map===lastMap?layout:JSON.stringify(map);lastMap=map;if(sig!==layout){layout=sig;makeFloor(map);rebuildBuildZones(map);clear(structures);entries.clear();}
   const players=Object.values(state.players||{}),teamRace=team=>players.find(p=>p.team===team)?.race||'human',castles=(state.teams||[]).map(c=>({...c,race:c.race||teamRace(c.team),isCastle:true,renderId:'castle-'+c.id})),tower={...(state.shop||{}),...map.tower,id:'central-tower',renderId:'central-tower',race:'north',team:0,w:2.4,d:2.4,isTower:true},list=[...castles,...(state.buildings||[]).map(b=>({...b,renderId:'building-'+b.id})),tower],ids=new Set(list.map(b=>b.renderId));
   for(const [id,entry]of entries)if(!ids.has(id)){release(entry.group);entries.delete(id);}
   for(const b of list){const race=b.race||CASTLE_BUILDINGS[b.key]?.race||'human';let entry=entries.get(b.renderId);if(entry&&entry.race!==race){release(entry.group);entries.delete(b.renderId);entry=null;}if(!entry){entry=architecture(structures,{...b,race},{castle:b.isCastle,tower:b.isTower});entries.set(b.renderId,entry);}entry.group.position.set(b.x,groundHeight(b.x,b.z),b.z);entry.group.visible=b.alive!==false;
    const definition=CASTLE_BUILDINGS[b.key||b.building]||{},elapsed=num(state.elapsed,0),ready=num(b.readyAt,num(b.completeAt,0)),start=num(b.created,ready-num(definition.buildTime,15)),fraction=ready>elapsed?clamp((elapsed-start)/Math.max(.001,ready-start)):1,constructing=!b.isCastle&&!b.isTower&&fraction<1;entry.model.scale.y=constructing?.25+.75*fraction:1;entry.scaffold.visible=constructing;
    const hasHp=Number.isFinite(b.hp)&&num(b.maxHp,num(definition.hp,0))>0,health=clamp(num(b.hp,0)/num(b.maxHp,num(definition.hp,1)));entry.background.visible=entry.health.visible=hasHp;entry.health.material=b.team===(state.players?.[owner]?.team??snapshot.units?.find(u=>u.owner===owner)?.team)?healthMaterial:enemyHealthMaterial;entry.health.scale.x=entry.width*health;entry.health.position.x=-(1-health)*entry.width/2;entry.progressBg.visible=entry.progress.visible=constructing;entry.progress.scale.x=entry.width*fraction;entry.progress.position.x=-(1-fraction)*entry.width/2;
   }
   const selected=list.find(b=>(b.id===selection||b.renderId===selection)&&b.alive!==false);ring.visible=!!selected;if(selected){ring.position.set(selected.x,groundHeight(selected.x,selected.z)+.045,selected.z);ring.scale.set(num(selected.w,3)*.67,num(selected.d,3)*.67,1);}
   updateBuildPreview(snapshot,point,buildKey,owner,map,camera,container);
   const holder=snapshot.units?.find(u=>u.hero&&u.owner===owner&&u.alive);staffRange.visible=!!(holder&&state.players?.[owner]?.items?.blast_staff);if(staffRange.visible)staffRange.position.set(holder.x,groundHeight(holder.x,holder.z)+.045,holder.z);
  },
  dispose(){if(disposed)return;disposed=true;clear(ground);clear(structures);clear(buildZones);buildLabel?.remove();for(const geometry of owned)geometry.dispose();owned.clear();for(const resource of [barGeometry,barBackground,healthMaterial,enemyHealthMaterial,progressMaterial,ringGeo,ringMat,ghostGeo,ghostMat,footprintGeometry,footprintMaterial,footprintGridGeometry,footprintGridMaterial,staffRangeGeometry,staffRangeMaterial])resource.dispose();root.removeFromParent();}
 };
}
