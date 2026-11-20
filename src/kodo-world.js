import {createKodoFeedback} from './kodo-feedback.js';
import {createFoliageWindMaterial,updateFoliageWind} from './foliage-wind.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {KODO_TAG_MAP as MAP,KODO_TAG_BUILDINGS as B,KODO_TAG_MINES as MINES,KODO_TAG_FOREST as FOREST} from '../shared/kodo-tag-catalog.js';
import {kodoBuildCheck} from '../shared/kodo-tag.js';
import {voxelTagPortrait} from './tag-character-art.js';

const portraitCache=new Map();
export function kodoBuildingSpec(key){
 const def=typeof key==='string'&&Object.hasOwn(B,key)?B[key]:null;if(!def)return [];const w=def.w*.9,d=def.d*.9,parts=[],b=(...p)=>parts.push(p),wood=0x92734e,stone=0x929a87,dark=0x4c5846,gold=0xd6b775;
 b(0,.12,0,def.w,.24,def.d,stone);
 if(key==='hC07'||key==='hC09'){const hard=key==='hC09';for(const x of [-.31,0,.31])b(x*w,.78,0,w*.25,1.2,d*.7,hard?stone:wood);for(const y of [.46,1])b(0,y,d*.4,def.w,.15,.14,hard?0x6d7b70:0x6d5d43);}
 else if(key==='hC18'){b(0,.7,0,w*.9,1.24,d*.84,0x7e8c83);b(-w*.19,1.49,-d*.09,w*.52,.42,d*.64,stone);b(w*.28,1.17,d*.12,w*.3,.68,d*.51,0xa5ac97);}
 else if(key==='hC08'){
  // A low defensive foundation, identifiable from above and packable edge to edge.
  b(0,.42,0,w*.94,.58,d*.94,0x8a8f7c);b(0,.77,0,w*.83,.16,d*.83,0xb8b59a);b(0,.89,0,w*.58,.12,d*.6,0x6d8069);
  for(const side of [-1,1]){b(side*w*.35,1.03,-d*.29,.24,.42,.25,stone);b(side*w*.35,.99,d*.29,.24,.34,.25,stone);}
  b(0,1.06,0,.4,.25,.42,gold);b(0,.49,d*.49,.38,.36,.08,dark);b(0,.53,d*.54,.2,.2,.06,gold);
 }else if(key==='hC11'){
  b(0,.77,0,w*.86,1.1,d*.83,wood);b(0,1.43,0,w*1.02,.24,d*1.02,0x7e675b);b(0,1.63,0,w*.76,.18,d*.78,0x8d7867);b(0,1.78,0,w*.48,.14,d*.52,0xa28b6d);
  b(0,.71,d*.46,.65,.95,.12,dark);for(const side of [-1,1])b(side*w*.34,.83,d*.45,.16,1.2,.16,stone);
  b(-w*.3,1.18,d*.54,.1,.67,.1,0xd3ddd0);b(-w*.3,.99,d*.54,.3,.1,.12,gold);
 }else{
  const slow=key==='oC20',stun=key==='oC21',h=slow?3.4:stun?3.7:4.05,c=slow?0xb49bd0:stun?0x89c7d6:0xb6cdb5;
  b(0,h*.45,0,w*.44,h*.84,d*.44,stone);b(0,h*.83,0,w*.77,.22,d*.77,0x74846f);b(0,h,0,w*.57,.5,d*.57,c);b(0,h+.41,0,w*.28,.31,d*.28,0xe5e8bf);
  if(slow)for(const side of [-1,1])b(side*w*.38,h-.23,0,.16,.67,.19,c);else if(stun){b(0,h+.1,d*.39,.14,.59,.12,gold);b(0,h+.08,d*.47,.39,.12,.1,gold);}else{for(const side of [-1,1])b(side*w*.34,h+.14,0,.2,.55,.24,gold);b(0,h-.15,d*.52,.25,.23,.49,0x536d79);}
 }
 return parts;
}
export function kodoBuildingDamageStage(building){if(building?.workRemaining>0||building?.workProgress<1)return 0;const ratio=Number.isFinite(building?.hp)&&building.maxHp>0?building.hp/building.maxHp:1;return ratio<=.3?2:ratio<=.65?1:0;}
export function kodoDamagedBuildingSpec(key,stage=0){const original=kodoBuildingSpec(key);if(!original.length||!stage)return original;const def=B[key],height=Math.max(...original.map(p=>p[1]+p[4]/2)),parts=[];
 for(const [i,p]of original.entries()){if(i&&((stage===2&&p[1]>height*.69)||(p[1]>height*.5&&i%(stage===2?3:5)===0)))continue;let [x,y,z,w,h,d,c]=p;const shade=new T.Color(c).multiplyScalar(stage===2?.73:.87).getHex();if(stage===2&&i&&h>height*.45){const bottom=y-h/2;h*=.76;y=bottom+h/2;}parts.push([x,y,z,w,h,d,i?shade:c]);}
 // Recessed-looking, stepped fissures and broken shoulders follow the front
 // face; debris rests inside the existing physical footprint, never on paths.
 const core=parts.slice(1).filter(p=>p[4]>height*.2).sort((a,b)=>b[3]*b[4]*b[5]-a[3]*a[4]*a[5])[0]||parts[1],face=core[2]+core[5]/2+.012,crack=0x3d493d;for(let i=0;i<stage+1;i++){const x=core[0]+(i-stage/2)*core[3]*.18,y=core[1]-core[4]/2+core[4]*(.22+i*.1);for(let j=0;j<3;j++)parts.push([x+(j%2?.02:-.01),y+j*core[4]*.12,face,.035,core[4]*.13,.02,crack]);}
 for(let i=0;i<stage*3;i++){const w=def.w*(.11+(i%3)*.035),d=def.d*(.12+(i%2)*.04);parts.push([((i%3)-1)*def.w*.27,.2+(i%2)*.05,((Math.floor(i/3)%2)-.5)*def.d*.62,w,.14+(i%3)*.04,d,i%2?0x7b775e:0x9c9e84]);}
 return parts;
}
// Every cliff occupies its authoritative collision rectangle. Face detail is
// inset into that solid mass; grass sits on the top rather than tinting a box.
export function kodoCliffSpec(o){
 const h=o.h||2.8,parts=[[o.x,h*.43,o.z,o.w,h*.86,o.d,0x737a72],[o.x,h*.88,o.z,o.w,.22,o.d,0x8b9284],[o.x,h-.02,o.z,o.w,.2,o.d,0x75964f]],seed=String(o.id||'').length;
 for(const side of [-1,1]){
  const nx=Math.max(1,Math.ceil(o.w/2.4)),nz=Math.max(1,Math.ceil(o.d/2.4));
  for(let i=0;i<nx;i++){const w=o.w/nx*.84,x=o.x-o.w/2+(i+.5)*o.w/nx;parts.push([x,h*.39,o.z+side*(o.d/2-.055),w,h*(.3+(i+seed)%3*.08),.11,(i+seed)%2?0x999e91:0x59665f]);}
  for(let i=0;i<nz;i++){const d=o.d/nz*.84,z=o.z-o.d/2+(i+.5)*o.d/nz;parts.push([o.x+side*(o.w/2-.055),h*.48,z,.11,h*(.28+(i+seed)%3*.09),d,(i+seed)%2?0x8e9788:0x58635e]);}
 }
 return parts;
}
export function kodoBuildingPortrait(key){if(portraitCache.has(key))return portraitCache.get(key);const svg=voxelTagPortrait(kodoBuildingSpec(key),'kodo-building-portrait');portraitCache.set(key,svg);return svg;}

export function createKodoWorld({scene}){
 const root=new T.Group();root.name='kodo-tag-world';root.visible=false;scene.add(root);const feedback=createKodoFeedback(root);const base=new T.BoxGeometry(1,1,1),mat=new T.MeshLambertMaterial(),foliage=createFoliageWindMaterial({strength:.12,minHeight:2}),vertexMat=new T.MeshLambertMaterial({vertexColors:true}),ghostMat=new T.MeshBasicMaterial({color:0x83dda2,transparent:true,opacity:.32,depthWrite:false}),dummy=new T.Object3D(),colour=new T.Color(),cache=new Map(),batches=new Map(),buildings=new Map();let current=null,build=null,owner=null,worker=null,cursor=null,layout='',disposed=false;let selected=new Set();const selectionGeo=new T.RingGeometry(.9,1,32),selectionMat=new T.MeshBasicMaterial({color:0xc4eda6,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});const initial=scene.background,background=new T.Color(0x68845b);
 const compile=(key,parts)=>{if(cache.has(key))return cache.get(key);const chunks=parts.map(([x,y,z,w,h,d,c])=>{const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);const rgb=new T.Color(c),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=rgb.r;a[i+1]=rgb.g;a[i+2]=rgb.b;}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}),g=mergeGeometries(chunks);for(const c of chunks)c.dispose();g.computeBoundingSphere();cache.set(key,g);return g;};
 const batch=(name,capacity)=>{let m=batches.get(name);if(m&&m.instanceMatrix.count>=capacity)return m;if(m){m.removeFromParent();m.dispose();}m=new T.InstancedMesh(base,name.includes('forest')?foliage:mat,Math.max(1,capacity));m.name=name;m.count=0;m.castShadow=m.receiveShadow=true;m.frustumCulled=false;root.add(m);batches.set(name,m);return m;};
 const put=(m,i,x,y,z,w,h,d,c)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,colour.setHex(c));};
 const finish=(m,n)=>{m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;};
 const ghost=new T.Mesh(base,ghostMat);ghost.name='kodo-build-ghost';ghost.visible=false;root.add(ghost);
 function terrain(data){const m=data.map||MAP,key=[m.minX,m.maxX,m.minZ,m.maxZ,JSON.stringify((data.obstacles||m.obstacles||[]).map(o=>[o.id,o.x,o.z,o.w,o.d,o.h,o.alive,o.destroyed]))].join(':');if(key===layout)return;layout=key;
  const width=m.maxX-m.minX,depth=m.maxZ-m.minZ,cols=Math.ceil((width+36)/2),rows=Math.ceil((depth+36)/2),floor=batch('kodo-ground',cols*rows);let i=0;
  for(let x=0;x<cols;x++)for(let z=0;z<rows;z++){const px=(m.minX+m.maxX)/2+(x-(cols-1)/2)*2,pz=(m.minZ+m.maxZ)/2+(z-(rows-1)/2)*2;put(floor,i++,px,-.22,pz,2.01,.65,2.01,Math.abs(px)<2.4||Math.abs(pz+2)<2.4?0xa5a181:[0x829b5f,0x8ba567,0x789254,0x91a970][Math.abs(Math.floor(Math.sin(px*.13)*2+Math.cos(pz*.17)*2+x*.07+z*.03))%4]);}finish(floor,i);
  const obstacles=(data.obstacles||m.obstacles||[]).filter(o=>o.alive!==false&&!o.destroyed),parts=obstacles.flatMap(kodoCliffSpec),rocks=batch('kodo-native-cliffs',parts.length);i=0;for(const part of parts)put(rocks,i++,...part);finish(rocks,i);
  const trees=batch('kodo-border-forest',720);i=0;for(let n=0;n<180;n++){const side=n%4,t=Math.floor(n/4)/44,x=side<2?(side===0?m.minX-5:m.maxX+5):m.minX+t*width,z=side>=2?(side===2?m.minZ-5:m.maxZ+5):m.minZ+t*depth;put(trees,i++,x,1.1,z,.5,2.2,.5,0x7b6847);put(trees,i++,x,2.65,z,2.5,1.55,2.5,0x4e7648);put(trees,i++,x,3.6,z,1.7,.67,1.7,0x75944e);}finish(trees,i);
 }
 function mines(data){const mines=(data.mines||MINES).filter(m=>m.alive!==false),mesh=batch('kodo-gold-mines',mines.length*6);let i=0;for(const m of mines){put(mesh,i++,m.x,.57,m.z,m.w||1.6,1.14,m.d||1.6,0x858e7d);put(mesh,i++,m.x-.25,1.3,m.z-.07,1.13,.55,1.13,0xa1aa8f);put(mesh,i++,m.x,.48,m.z+.83,.85,.85,.13,0x39463d);put(mesh,i++,m.x-.53,.6,m.z+.9,.14,1.09,.2,0x9a7a4d);put(mesh,i++,m.x+.53,.6,m.z+.9,.14,1.09,.2,0x9a7a4d);put(mesh,i++,m.x,1.13,m.z+.9,1.24,.16,.2,0xddbc69);}finish(mesh,i);}
 return{root,setSelection(ids){selected=new Set(ids||[]);},setBuild(key,own,unitId=null){build=typeof key==='string'&&Object.hasOwn(B,key)?key:null;owner=own;worker=unitId;ghost.visible=false;},setCursor(p){cursor=p;},
  update(snapshot,time=snapshot?.time||0,viewer=null){if(disposed)return;feedback.update(snapshot,time,viewer);updateFoliageWind(foliage,time);root.visible=snapshot?.options?.mode==='kodotag';if(!root.visible){current=null;if(scene.background===background)scene.background=initial;return;}scene.background=background;if(scene.fog)scene.fog.color.copy(background);current=snapshot.kodoTag||{map:MAP,mines:MINES,trees:FOREST,obstacles:MAP.obstacles||[],buildings:[]};terrain(current);mines(current);const resourceTrees=(current.trees||[]).filter(t=>t.alive),forest=batch('kodo-resource-forest',resourceTrees.length*3);let treeIndex=0;for(const t of resourceTrees){put(forest,treeIndex++,t.x,1.1,t.z,t.w||.6,2.2,t.d||.6,0x7b6847);put(forest,treeIndex++,t.x,2.65,t.z,2.1,1.4,2.1,0x4e7648);put(forest,treeIndex++,t.x,3.55,t.z,1.5,.65,1.5,0x75944e);}finish(forest,treeIndex);const seen=new Set();for(const b of current.buildings||[]){if(!b.alive)continue;seen.add(b.id);let e=buildings.get(b.id);const damageStage=kodoBuildingDamageStage(b);if(!e||e.key!==b.key){if(e){e.mesh.removeFromParent();e.ring.removeFromParent();}const mesh=new T.Mesh(compile(b.key+'-damage-'+damageStage,kodoDamagedBuildingSpec(b.key,damageStage)),vertexMat);mesh.castShadow=mesh.receiveShadow=true;mesh.name='kodo-building-'+b.id;root.add(mesh);const ring=new T.Mesh(selectionGeo,selectionMat);ring.rotation.x=-Math.PI/2;root.add(ring);e={mesh,ring,key:b.key,damageStage};buildings.set(b.id,e);}else if(e.damageStage!==damageStage){e.damageStage=damageStage;e.mesh.geometry=compile(b.key+'-damage-'+damageStage,kodoDamagedBuildingSpec(b.key,damageStage));}e.mesh.userData.damageStage=damageStage;e.mesh.position.set(b.x,.15,b.z);e.ring.visible=selected.has(b.id);e.ring.position.set(b.x,.13,b.z);e.ring.scale.set(b.w*.7,b.d*.7,1);e.mesh.scale.y=.18+.82*(Number.isFinite(b.workProgress)?b.workProgress:1);}
   for(const[id,e]of buildings)if(!seen.has(id)){e.mesh.removeFromParent();e.ring.removeFromParent();buildings.delete(id);}
   const jail=current.map.jail,flags=(snapshot.units||[]).filter(u=>u.kodoTagCaptured),stones=batch('kodo-jail',13+flags.length*2);let n=0;put(stones,n++,jail.x,.14,jail.z,3.6,.13,3.6,0x9da78b);for(let i=0;i<12;i++){const a=i*Math.PI/6;put(stones,n++,jail.x+Math.sin(a)*jail.r,.3,jail.z+Math.cos(a)*jail.r,.25,.45,.25,i%2?0xb5bf99:0x929b7d);}for(const u of flags){put(stones,n++,u.x,.8,u.z,.09,1.5,.09,0x8b704a);put(stones,n++,u.x+.27,1.35,u.z,.56,.42,.1,0xb9cf95);}finish(stones,n);
   ghost.visible=!!(build&&cursor);if(ghost.visible){const u=(snapshot.units||[]).find(u=>worker!=null?u.id===worker:u.owner===owner&&u.kodoTagCharacter),check=kodoBuildCheck(snapshot,u,build,cursor),p=check.point||cursor,d=B[build];ghost.position.set(p.x,.36,p.z);ghost.scale.set(d.w,.4,d.d);ghostMat.color.setHex(check.allowed?0x83dda2:0xf1947b);ghost.userData.allowed=check.allowed;ghost.userData.reason=check.reason;}
  },
  pick(p){if(!current||!p)return null;const b=(current.buildings||[]).find(b=>b.alive&&Math.abs(p.x-b.x)<=b.w/2&&Math.abs(p.z-b.z)<=b.d/2);if(b)return{kodoBuilding:b.id};const m=(current.mines||[]).find(m=>m.alive!==false&&Math.hypot(p.x-m.x,p.z-m.z)<1.3);if(m)return{kodoMine:m.id};const t=(current.trees||[]).find(t=>t.alive&&Math.hypot(p.x-t.x,p.z-t.z)<.8);return t?{kodoTree:t.id}:null;},
  dispose(){if(disposed)return;disposed=true;feedback.dispose();root.removeFromParent();for(const m of batches.values())m.dispose();for(const g of cache.values())g.dispose();selectionGeo.dispose();selectionMat.dispose();base.dispose();mat.dispose();foliage.dispose();vertexMat.dispose();ghostMat.dispose();buildings.clear();if(scene.background===background)scene.background=initial;}
 };
}
