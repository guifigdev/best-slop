import * as T from 'three';
import {SCENERY_ASSETS} from '../shared/scenery.js';
import {mapTileAt} from '../shared/voxel-map.js';
import {terrainHeight} from './voxel-terrain.js';

const THEMES=Object.freeze({
 forest:{ground:[0x809966,0x8fa777,0x9aaf7e],soil:0xa38b65,rock:[0x7e8980,0x9ca58f,0xb7bba2],leaf:[0x44684c,0x5d8058,0x7e9a67],trunk:0x775e45,horizon:0xaab69c,glow:0xc9c997},
 volcano:{ground:[0x76665c,0x8a7460,0x625a56],soil:0x95745b,rock:[0x494950,0x626067,0x83766e],leaf:[0x514d47,0x696051,0x9b7753],trunk:0x51473f,horizon:0x9b897a,glow:0xffa149},
 glacier:{ground:[0xc2d3d3,0xd4e0da,0xb5ccd1],soil:0x9eafb2,rock:[0x889fa9,0xaac2cb,0xe1e9e2],leaf:[0x8fadb1,0xc4d6d5,0xe9eee4],trunk:0x899a99,horizon:0xc9d8d7,glow:0xbceef1},
 tempest:{ground:[0x6f8674,0x829986,0x607867],soil:0x8c9073,rock:[0x62767a,0x87958d,0xa9b49e],leaf:[0x3d6058,0x5a7e6a,0x7f9781],trunk:0x646755,horizon:0x9cafa3,glow:0xb1d5d4},
 moon:{ground:[0x7c7c91,0x9090a0,0x666d7c],soil:0x999090,rock:[0x64697b,0x8c91a8,0xb3b6c5],leaf:[0x4d6268,0x728588,0x929eaa],trunk:0x697078,horizon:0xa0a0b4,glow:0xc6b5ee}
});
const finite=(n,fallback)=>Number.isFinite(n)?n:fallback;
const mix=(a,b,t)=>{t=Math.max(0,Math.min(1,t));let result=0;for(const shift of [16,8,0])result|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return result;};
const rectDistance=(p,r)=>Math.max(0,r.minX-p.x,p.x-r.maxX,r.minZ-p.z,p.z-r.maxZ);
const intersects=(p,r,padding=0)=>p.x+p.w/2>r.minX-padding&&p.x-p.w/2<r.maxX+padding&&p.z+p.d/2>r.minZ-padding&&p.z-p.d/2<r.maxZ+padding;
const expand=(r,n)=>({minX:r.minX-n,maxX:r.maxX+n,minZ:r.minZ-n,maxZ:r.maxZ+n});
function themeFor(mode,arena,map){if(!map||!['linewars','castlefight'].includes(mode))return Object.hasOwn(THEMES,arena)?arena:'forest';let land=0,snow=0,lava=0;for(let i=0;i<map.biomes.length;i++){if(!map.walkable?.[i])continue;land++;const id=map.palette[map.biomes[i]]?.id;if(id==='snow'||id==='ice')snow++;if(id==='lava')lava++;}return snow>land*.2?'glacier':lava>land*.2?'volcano':'forest';}
export function landscapeKey({mode='campaign',arena='forest',map=null,bounds=18}={}){return [mode,themeFor(mode,arena,map),map?.id,map?.seed,map?.width,map?.height,map?.tileSize,map?.origin?.x,map?.origin?.z,map?.palette?.map(p=>p.color).join(','),Math.min(30,finite(bounds,18))].join('|');}

// Every decorative box is outside the protected footprint. Only the low far
// floor may sit below Survival's field; map modes have an exact rectangular hole.
export function landscapeLayout({mode='campaign',arena='forest',map=null,bounds=18}={}){
 const theme=themeFor(mode,arena,map),palette=THEMES[theme],mapped=!!(map&&['linewars','castlefight'].includes(mode)),half=Math.max(40,Math.min(30,finite(bounds,18))+9),protectedArea=mapped?{minX:map.origin.x,maxX:map.origin.x+map.width*map.tileSize,minZ:map.origin.z,maxZ:map.origin.z+map.height*map.tileSize}:{minX:-half,maxX:half,minZ:-half,maxZ:half},center={x:(protectedArea.minX+protectedArea.maxX)/2,z:(protectedArea.minZ+protectedArea.maxZ)/2},ground=[],decor=[],glow=[],tiles=[],mountains=[];
 let seed=(finite(map?.seed,1171)^theme.split('').reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0),7))>>>0;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),phase=seed*.000001;
 const add=(list,x,top,z,w,h,d,color,category)=>{const box={x,y:top-h/2,z,w,h,d,color,category};list.push(box);return box;};
 const farTop=mapped?Math.min(-.16,Math.min(...map.heights)*.35+.04):-.16;
 const floor=(minX,maxX,minZ,maxZ)=>{if(maxX>minX&&maxZ>minZ)add(ground,(minX+maxX)/2,farTop,(minZ+maxZ)/2,maxX-minX,2,maxZ-minZ,palette.horizon,'far-floor');};
 if(mapped){floor(-600,600,-600,protectedArea.minZ);floor(-600,600,protectedArea.maxZ,600);floor(-600,protectedArea.minX,protectedArea.minZ,protectedArea.maxZ);floor(protectedArea.maxX,600,protectedArea.minZ,protectedArea.maxZ);}else{floor(-600,600,-600,protectedArea.minZ);floor(-600,600,protectedArea.maxZ,600);floor(-600,protectedArea.minX,protectedArea.minZ,protectedArea.maxZ);floor(protectedArea.maxX,600,protectedArea.minZ,protectedArea.maxZ);add(ground,center.x,-.16,center.z,protectedArea.maxX-protectedArea.minX,2,protectedArea.maxZ-protectedArea.minZ,palette.ground[0],'underlay');}
 const edgeAt=(x,z)=>{if(!mapped)return null;const px=Math.max(protectedArea.minX+.001,Math.min(protectedArea.maxX-.001,x)),pz=Math.max(protectedArea.minZ+.001,Math.min(protectedArea.maxZ-.001,z)),tile=mapTileAt(map,px,pz);return tile?{top:terrainHeight(map,px,pz),color:new T.Color(tile.palette.color).getHex(),water:tile.palette.id==='water'}:null;};
 function surface(x,z){
  const distance=rectDistance({x,z},protectedArea),n=(Math.sin(x*.039+phase)*Math.cos(z*.047-phase)+Math.sin((x+z)*.021+phase)*.7+1.7)/3.4,edge=edgeAt(x,z),hill=Math.max(0,distance-8)/28,top=Math.min(5.5,.1+n*Math.min(4,hill)),blend=Math.min(1,distance/15),landColor=palette.ground[Math.floor(n*2.99)];
  // Keep continued water level rather than painting blue ascending steps. Its
  // irregular shoreline then passes through a short beach/snow bank into land.
  if(edge?.water){const shore=4+(Math.sin(x*.21+z*.13+phase)+1)*1.5;if(distance<shore)return{top:edge.top,color:theme==='glacier'?mix(edge.color,0xa9ccd0,Math.min(.4,distance*.07)):edge.color};if(distance<shore+5){const t=(distance-shore)/5;return{top:edge.top*(1-t)+top*t,color:mix(theme==='glacier'?palette.ground[1]:palette.soil,landColor,t)};}}
  return{top:edge&&distance<15?edge.top*(1-blend)+top*blend:top,color:edge&&distance<15?mix(edge.color,landColor,blend):landColor};
 }
 function tileRect(r,size){for(let minZ=r.minZ;minZ<r.maxZ-.001;minZ+=size)for(let minX=r.minX;minX<r.maxX-.001;minX+=size){const w=Math.min(size,r.maxX-minX),d=Math.min(size,r.maxZ-minZ),x=minX+w/2,z=minZ+d/2,s=surface(x,z),top=Math.round(s.top*20)/20,tint=mix(s.color,palette.horizon,Math.max(0,(rectDistance({x,z},protectedArea)-65)/115)),box=add(ground,x,top,z,w,Math.max(.22,top+1.75),d,tint,'terrain');box.top=top;tiles.push(box);}}
 let inner=protectedArea;for(const [padding,size]of [[12,3],[44,8],[100,16],[180,24]]){const outer=expand(protectedArea,padding);tileRect({minX:outer.minX,maxX:outer.maxX,minZ:outer.minZ,maxZ:inner.minZ},size);tileRect({minX:outer.minX,maxX:outer.maxX,minZ:inner.maxZ,maxZ:outer.maxZ},size);tileRect({minX:outer.minX,maxX:inner.minX,minZ:inner.minZ,maxZ:inner.maxZ},size);tileRect({minX:inner.maxX,maxX:outer.maxX,minZ:inner.minZ,maxZ:inner.maxZ},size);inner=outer;}
 const groundAt=(x,z)=>tiles.find(tile=>Math.abs(tile.x-x)<=tile.w/2&&Math.abs(tile.z-z)<=tile.d/2)?.top??-.16;
 function outside(gap){const a=random()*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a),hx=(protectedArea.maxX-protectedArea.minX)/2,hz=(protectedArea.maxZ-protectedArea.minZ)/2,reach=Math.min(Math.abs(dx)>.001?hx/Math.abs(dx):Infinity,Math.abs(dz)>.001?hz/Math.abs(dz):Infinity);return{x:center.x+dx*(reach+gap),z:center.z+dz*(reach+gap)};}
 for(let i=0;i<18;i++){
  const p=outside(55+random()*95),w=14+random()*24,d=12+random()*24,h=7+random()*14,layers=4+Math.floor(random()*2),foot={...p,w,d};if(intersects(foot,protectedArea,8))continue;mountains.push(foot);
  const sample=[groundAt(p.x,p.z),groundAt(p.x-w/2,p.z-d/2),groundAt(p.x+w/2,p.z-d/2),groundAt(p.x-w/2,p.z+d/2),groundAt(p.x+w/2,p.z+d/2)],low=Math.min(...sample)-.15,base=Math.max(...sample);
  // A buried pedestal prevents a ridge crossing stepped terrain from floating.
  add(decor,p.x,base+.35,p.z,w,base+.35-low,d,palette.rock[0],'mountain-foundation');
  const variant=i%3,peaks=variant===1?2:1;
  for(let peak=0;peak<peaks;peak++){const px=p.x+(peaks===2?(peak?1:-1)*w*.19:0),pz=p.z+(variant===2?d*.12:0),peakWidth=peaks===2?w*.58:w,peakDepth=variant===2?d*.7:d,peakHeight=h*(peak===0?1:.72),category=variant===0?'mesa':variant===1?'ridge':'peak';
   for(let layer=0;layer<layers;layer++){const shrink=1-layer/(layers+1),top=base+.3+peakHeight*(layer+1)/layers,color=theme==='glacier'&&layer>=layers-2?palette.ground[1]:palette.rock[Math.min(2,Math.floor(layer/2))];add(decor,px+(variant===2?layer*.35:0),top,pz,peakWidth*shrink,peakHeight/layers+.12,peakDepth*shrink,color,category);}
   if(theme==='volcano')add(glow,px,base+.3+peakHeight+.06,pz,peakWidth*.2,.12,peakDepth*.2,palette.glow,'lava-crater');
  }
 }
 const treeKindRadius=(kind,scale)=>(['pine','birch'].includes(kind)?.3:.7)*scale;
 function asset(kind,p,scale){const definition=SCENERY_ASSETS[kind],width=Math.max(...definition.parts.map(a=>Math.abs(a[0])+a[3]/2))*2*scale,depth=Math.max(...definition.parts.map(a=>Math.abs(a[2])+a[5]/2))*2*scale,foot={...p,w:Math.max(width,depth),d:Math.max(width,depth)};if(intersects(foot,protectedArea,2)||mountains.some(m=>intersects(foot,{minX:m.x-m.w/2,maxX:m.x+m.w/2,minZ:m.z-m.d/2,maxZ:m.z+m.d/2},1)))return;
  const radius=treeKindRadius(kind,scale),y=Math.min(groundAt(p.x,p.z),groundAt(p.x-radius,p.z-radius),groundAt(p.x+radius,p.z+radius),groundAt(p.x-radius,p.z+radius),groundAt(p.x+radius,p.z-radius)),angle=Math.floor(random()*4)*Math.PI/2,sin=Math.sin(angle),cos=Math.cos(angle);for(const [i,part]of definition.parts.entries()){const [x,py,z,w,h,d]=part,tree=kind==='pine'||kind==='birch',leaf=kind==='pine'?i>0:i>=4,color=tree?leaf?palette.leaf[Math.min(2,i%3)]:palette.trunk:palette.rock[Math.min(2,i%3)];add(decor,p.x+(x*cos+z*sin)*scale,y+(py+h/2)*scale,p.z+(-x*sin+z*cos)*scale,(Math.abs(cos)>.5?w:d)*scale,h*scale,(Math.abs(cos)>.5?d:w)*scale,color,tree?'tree':'rock');}
 }
 const clusters=theme==='volcano'?9:18;for(let i=0;i<clusters;i++){const p=outside(9+random()*110),count=4+Math.floor(random()*5);for(let j=0;j<count;j++){const a=random()*Math.PI*2,r=random()*8;asset(j%5===0?'boulder':theme==='forest'&&j%4===0?'birch':'pine',{x:p.x+Math.sin(a)*r,z:p.z+Math.cos(a)*r},1.1+random()*1.5);}}
 for(let i=0;i<36;i++)asset(i%9===0?'runestone':'boulder',outside(7+random()*105),1.1+random()*2.2);
 if(['tempest','glacier'].includes(theme))for(let i=0;i<12;i++){const tile=tiles[Math.floor(random()*tiles.length)],w=Math.min(8,tile.w*.65),d=Math.min(7,tile.d*.65);add(decor,tile.x,tile.top+.025,tile.z,w,.07,d,theme==='tempest'?0x718f91:0x9dc6ce,'pond');if(theme==='tempest')for(const side of [-1,1]){add(decor,tile.x+side*w*.4,tile.top+.9,tile.z+d*.4,.14,.9,.14,0x8c986b,'reed');add(decor,tile.x+side*w*.4,tile.top+1.12,tile.z+d*.4,.2,.25,.2,0xb1b27d,'reed');}}
 if(['moon','glacier'].includes(theme))for(let i=0;i<20;i++){const p=outside(12+random()*90);if(mountains.some(m=>Math.abs(p.x-m.x)<m.w/2+2&&Math.abs(p.z-m.z)<m.d/2+2))continue;const y=groundAt(p.x,p.z);for(let n=0;n<3;n++){const x=p.x+(n-1)*.65,h=1+random()*2.6;add(decor,x,y+h,p.z,.45,h,.55,palette.rock[1],'crystal');add(glow,x,y+h+.08,p.z,.48,.18,.58,palette.glow,'crystal-tip');}}
 if(theme==='volcano')for(let i=0;i<20;i++){const p=outside(10+random()*80),y=groundAt(p.x,p.z);for(let n=0;n<4;n++){const x=p.x+n*.7,z=p.z+Math.sin(n+i)*.4;if(intersects({x,z,w:.9,d:.55},protectedArea,2)||Math.abs(groundAt(x-.5,z)-groundAt(x+.5,z))>.1)continue;add(glow,x,groundAt(x,z)+.055,z,.92,.09,.58,palette.glow,'lava-flow');}}
 return{key:landscapeKey({mode,arena,map,bounds}),theme,palette,protectedArea,ground,decor,glow};
}

export function createWorldLandscape({scene,base,material}){
 const root=new T.Group();root.name='world-landscape';scene.add(root);const ownGeometry=!base,geometry=base||new T.BoxGeometry(1,1,1),surfaceMaterial=material?.clone()||new T.MeshLambertMaterial(),glowMaterial=new T.MeshBasicMaterial({toneMapped:false}),matrix=new T.Object3D(),color=new T.Color(),horizon=new T.Color(),previousBackground=scene.background,previousFog=scene.fog?.color.clone();let current=null,disposed=false;
 // Instance colors already contain the landscape palette. A shared, tinted
 // environment material would multiply the whole landscape by the arena tint.
 surfaceMaterial.color?.setHex(0xffffff);
 function clear(){for(const mesh of [...root.children]){mesh.removeFromParent();mesh.dispose();}}
 function batch(boxes,kind,castShadow,mat){if(!boxes.length)return;const mesh=new T.InstancedMesh(geometry,mat,boxes.length);mesh.name='landscape-'+kind;mesh.castShadow=castShadow;mesh.receiveShadow=true;for(const [i,b]of boxes.entries()){matrix.position.set(b.x,b.y,b.z);matrix.rotation.set(0,0,0);matrix.scale.set(b.w,b.h,b.d);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);mesh.setColorAt(i,color.setHex(b.color));}mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);}
 return{
  update(options={}){if(disposed)return null;const key=landscapeKey(options);if(current?.key!==key){clear();current=landscapeLayout(options);batch(current.ground,'ground',false,surfaceMaterial);batch(current.decor,'decor',true,surfaceMaterial);batch(current.glow,'glow',false,glowMaterial);}horizon.setHex(current.palette.horizon);scene.background=horizon;if(scene.fog)scene.fog.color.copy(horizon);return current.palette;},
  get palette(){return current?.palette||null;},
  dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();if(ownGeometry)geometry.dispose();surfaceMaterial.dispose();glowMaterial.dispose();if(scene.background===horizon)scene.background=previousBackground;if(scene.fog&&previousFog)scene.fog.color.copy(previousFog);}
 };
}
