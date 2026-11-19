import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {KODO_TAG_MAP as MAP,KODO_TAG_BUILDINGS as B,KODO_TAG_MINES as MINES} from '../shared/kodo-tag-catalog.js';
import {kodoBuildCheck} from '../shared/kodo-tag.js';
import {voxelTagPortrait} from './tag-character-art.js';

const portraitCache=new Map();
export function kodoBuildingSpec(key){
 const def=typeof key==='string'&&Object.hasOwn(B,key)?B[key]:null;if(!def)return [];const w=def.w*.9,d=def.d*.9,parts=[],b=(...p)=>parts.push(p),wood=0x92734e,stone=0x929a87,dark=0x4c5846,gold=0xd6b775;
 b(0,.12,0,w,.24,d,stone);
 if(key==='hC07'||key==='hC09'){const hard=key==='hC09';for(const x of [-.31,0,.31])b(x*w,.78,0,w*.25,1.2,d*.7,hard?stone:wood);for(const y of [.46,1])b(0,y,d*.4,w*.98,.15,.14,hard?0x6d7b70:0x6d5d43);}
 else if(key==='hC18'){b(0,.7,0,w*.9,1.24,d*.84,0x7e8c83);b(-w*.19,1.49,-d*.09,w*.52,.42,d*.64,stone);b(w*.28,1.17,d*.12,w*.3,.68,d*.51,0xa5ac97);}
 else if(key==='hC08'||key==='hC11'){
  const barracks=key==='hC11',roof=barracks?0x7e675b:0x597e94;b(0,.79,0,w*.86,1.12,d*.83,wood);b(0,1.45,0,w*1.05,.25,d*1.05,roof);b(0,1.68,0,w*.8,.22,d*.86,roof);b(0,1.87,0,w*.56,.19,d*.61,roof);b(0,.6,d*.46,.55,.91,.13,dark);b(0,1.15,d*.54,.65,.17,.1,gold);
  for(const side of [-1,1]){b(side*w*.34,.7,d*.46,.22,1.1,.16,stone);b(side*w*.3,1.18,-d*.48,.33,.3,.13,0xaed1c4);}
  if(barracks){b(-.57,1.15,d*.56,.12,.91,.1,0xd3ddd0);b(-.57,.82,d*.56,.38,.1,.14,gold);b(.57,1.1,d*.56,.35,.64,.12,0x6d8799);}else{b(0,2.22,0,.08,.65,.08,wood);b(.27,2.31,0,.54,.32,.09,gold);b(-w*.57,.4,0,.32,.55,.63,gold);}
 }else{
  const slow=key==='oC20',stun=key==='oC21',h=slow?2.25:stun?2.5:2.8,c=slow?0xb49bd0:stun?0x89c7d6:0xb6cdb5;
  b(0,h*.45,0,w*.44,h*.84,d*.44,stone);b(0,h*.83,0,w*.77,.22,d*.77,0x74846f);b(0,h,0,w*.57,.5,d*.57,c);b(0,h+.41,0,w*.28,.31,d*.28,0xe5e8bf);
  if(slow)for(const side of [-1,1])b(side*w*.38,h-.23,0,.16,.67,.19,c);else if(stun){b(0,h+.1,d*.39,.14,.59,.12,gold);b(0,h+.08,d*.47,.39,.12,.1,gold);}else{for(const side of [-1,1])b(side*w*.34,h+.14,0,.2,.55,.24,gold);b(0,h-.15,d*.57,.25,.23,.49,0x536d79);}
 }
 return parts;
}
export function kodoBuildingPortrait(key){if(portraitCache.has(key))return portraitCache.get(key);const svg=voxelTagPortrait(kodoBuildingSpec(key),'kodo-building-portrait');portraitCache.set(key,svg);return svg;}

export function createKodoWorld({scene}){
 const root=new T.Group();root.name='kodo-tag-world';root.visible=false;scene.add(root);const base=new T.BoxGeometry(1,1,1),mat=new T.MeshLambertMaterial(),vertexMat=new T.MeshLambertMaterial({vertexColors:true}),ghostMat=new T.MeshBasicMaterial({color:0x83dda2,transparent:true,opacity:.32,depthWrite:false}),dummy=new T.Object3D(),colour=new T.Color(),cache=new Map(),batches=new Map(),buildings=new Map();let current=null,build=null,owner=null,worker=null,cursor=null,layout='',disposed=false;const initial=scene.background,background=new T.Color(0x68845b);
 const compile=(key,parts)=>{if(cache.has(key))return cache.get(key);const chunks=parts.map(([x,y,z,w,h,d,c])=>{const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);const rgb=new T.Color(c),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=rgb.r;a[i+1]=rgb.g;a[i+2]=rgb.b;}g.setAttribute('color',new T.BufferAttribute(a,3));return g;}),g=mergeGeometries(chunks);for(const c of chunks)c.dispose();g.computeBoundingSphere();cache.set(key,g);return g;};
 const batch=(name,capacity)=>{let m=batches.get(name);if(m&&m.instanceMatrix.count>=capacity)return m;if(m){m.removeFromParent();m.dispose();}m=new T.InstancedMesh(base,mat,Math.max(1,capacity));m.name=name;m.count=0;m.castShadow=m.receiveShadow=true;m.frustumCulled=false;root.add(m);batches.set(name,m);return m;};
 const put=(m,i,x,y,z,w,h,d,c)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,colour.setHex(c));};
 const finish=(m,n)=>{m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;};
 const ghost=new T.Mesh(base,ghostMat);ghost.name='kodo-build-ghost';ghost.visible=false;root.add(ghost);
 function terrain(data){const m=data.map||MAP,key=[m.minX,m.maxX,m.minZ,m.maxZ,(data.obstacles||m.obstacles||[]).length].join(':');if(key===layout)return;layout=key;
  const width=m.maxX-m.minX,depth=m.maxZ-m.minZ,cols=Math.ceil((width+36)/2),rows=Math.ceil((depth+36)/2),floor=batch('kodo-ground',cols*rows);let i=0;
  for(let x=0;x<cols;x++)for(let z=0;z<rows;z++){const px=(m.minX+m.maxX)/2+(x-(cols-1)/2)*2,pz=(m.minZ+m.maxZ)/2+(z-(rows-1)/2)*2;put(floor,i++,px,-.22,pz,2.01,.65,2.01,[0x829b5f,0x8ba567,0x789254,0x91a970][(x*7+z*3)%4]);}finish(floor,i);
  const obstacles=data.obstacles||m.obstacles||[],rocks=batch('kodo-native-cliffs',obstacles.length*3);i=0;for(const o of obstacles){const h=o.h||1.4;put(rocks,i++,o.x,h/2,o.z,o.w,h,o.d,0x7d876b);put(rocks,i++,o.x,h+.05,o.z,o.w*.97,.15,o.d*.97,0x72934e);put(rocks,i++,o.x-o.w*.25,h*.4,o.z+o.d*.43,o.w*.28,h*.5,.13,0xa1a98a);}finish(rocks,i);
  const trees=batch('kodo-border-forest',240);i=0;for(let n=0;n<60;n++){const side=n%4,t=Math.floor(n/4)/14,x=side<2?(side===0?m.minX-5:m.maxX+5):m.minX+t*width,z=side>=2?(side===2?m.minZ-5:m.maxZ+5):m.minZ+t*depth;put(trees,i++,x,1.1,z,.5,2.2,.5,0x7b6847);put(trees,i++,x,2.65,z,2.5,1.55,2.5,0x4e7648);put(trees,i++,x,3.6,z,1.7,.67,1.7,0x75944e);}finish(trees,i);
 }
 function mines(data){const mines=(data.mines||MINES).filter(m=>m.alive!==false),mesh=batch('kodo-gold-mines',mines.length*6);let i=0;for(const m of mines){put(mesh,i++,m.x,.57,m.z,m.w||1.6,1.14,m.d||1.6,0x858e7d);put(mesh,i++,m.x-.25,1.3,m.z-.07,1.13,.55,1.13,0xa1aa8f);put(mesh,i++,m.x,.48,m.z+.83,.85,.85,.13,0x39463d);put(mesh,i++,m.x-.53,.6,m.z+.9,.14,1.09,.2,0x9a7a4d);put(mesh,i++,m.x+.53,.6,m.z+.9,.14,1.09,.2,0x9a7a4d);put(mesh,i++,m.x,1.13,m.z+.9,1.24,.16,.2,0xddbc69);}finish(mesh,i);}
 return{root,setBuild(key,own,unitId=null){build=typeof key==='string'&&Object.hasOwn(B,key)?key:null;owner=own;worker=unitId;ghost.visible=false;},setCursor(p){cursor=p;},
  update(snapshot){if(disposed)return;root.visible=snapshot?.options?.mode==='kodotag';if(!root.visible){current=null;if(scene.background===background)scene.background=initial;return;}scene.background=background;if(scene.fog)scene.fog.color.copy(background);current=snapshot.kodoTag||{map:MAP,mines:MINES,obstacles:MAP.obstacles||[],buildings:[]};terrain(current);mines(current);const seen=new Set();for(const b of current.buildings||[]){if(!b.alive)continue;seen.add(b.id);let e=buildings.get(b.id);if(!e||e.key!==b.key){if(e)e.mesh.removeFromParent();const mesh=new T.Mesh(compile(b.key,kodoBuildingSpec(b.key)),vertexMat);mesh.castShadow=mesh.receiveShadow=true;mesh.name='kodo-building-'+b.id;root.add(mesh);e={mesh,key:b.key};buildings.set(b.id,e);}e.mesh.position.set(b.x,.15,b.z);e.mesh.scale.y=.18+.82*(Number.isFinite(b.workProgress)?b.workProgress:1);}
   for(const[id,e]of buildings)if(!seen.has(id)){e.mesh.removeFromParent();buildings.delete(id);}
   const jail=current.map.jail,flags=(snapshot.units||[]).filter(u=>u.kodoTagCaptured),stones=batch('kodo-jail',12+flags.length*2);let n=0;for(let i=0;i<12;i++){const a=i*Math.PI/6;put(stones,n++,jail.x+Math.sin(a)*jail.r,.3,jail.z+Math.cos(a)*jail.r,.25,.45,.25,i%2?0xb5bf99:0x929b7d);}for(const u of flags){put(stones,n++,u.x,.8,u.z,.09,1.5,.09,0x8b704a);put(stones,n++,u.x+.27,1.35,u.z,.56,.42,.1,0xb9cf95);}finish(stones,n);
   ghost.visible=!!(build&&cursor);if(ghost.visible){const u=(snapshot.units||[]).find(u=>worker!=null?u.id===worker:u.owner===owner&&u.kodoTagCharacter),check=kodoBuildCheck(snapshot,u,build,cursor),p=check.point||cursor,d=B[build];ghost.position.set(p.x,.36,p.z);ghost.scale.set(d.w,.4,d.d);ghostMat.color.setHex(check.allowed?0x83dda2:0xf1947b);ghost.userData.allowed=check.allowed;ghost.userData.reason=check.reason;}
  },
  pick(p){if(!current||!p)return null;const b=(current.buildings||[]).find(b=>b.alive&&Math.abs(p.x-b.x)<=b.w/2&&Math.abs(p.z-b.z)<=b.d/2);if(b)return{kodoBuilding:b.id};const m=(current.mines||[]).find(m=>m.alive!==false&&Math.hypot(p.x-m.x,p.z-m.z)<1.3);if(m)return{kodoMine:m.id};const t=(current.trees||[]).find(t=>t.alive&&Math.hypot(p.x-t.x,p.z-t.z)<.8);return t?{kodoTree:t.id}:null;},
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const m of batches.values())m.dispose();for(const g of cache.values())g.dispose();base.dispose();mat.dispose();vertexMat.dispose();ghostMat.dispose();buildings.clear();if(scene.background===background)scene.background=initial;}
 };
}
