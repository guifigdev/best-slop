import {voxelTagPortrait} from './tag-character-art.js';
import {createMoltenLavaMaterial} from './lava-material.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {TREE_TAG_BUILDINGS,TREE_TAG_FOREST,TREE_TAG_RULES} from '../shared/tree-tag-catalog.js';
import {treeTagBuildCheck} from '../shared/tree-tag.js';
import {WARLOCK_SKILLS} from '../shared/warlock-catalog.js';

const finite=(v,f=0)=>Number.isFinite(v)?v:f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=value=>{let n=2166136261;for(const c of String(value??''))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const parseTime=(snapshot,time)=>Number.isFinite(time)?time:finite(snapshot?.time);
const fireFamilies=new Set(['fireball','spray','meteor','scourge','bane','ritual','redemption','burst','burn']);
const familyOf=value=>{const key=value?.key||value?.skill||value?.skillKey;return value?.family||WARLOCK_SKILLS[key]?.family||value?.type||key||'arcane';};
const familyColour=family=>fireFamilies.has(family)?0xf2a354:family==='lightning'||family==='arc'?0xe7e5a5:['gravity','disable','link','timeshift','mirror'].includes(family)?0xb5a2e3:['shield','dome','windwalk','rush'].includes(family)?0x92d6c7:family==='homing'?0xb9d891:family==='splitter'?0xbca3e2:family==='fragment'?0xe7c080:0x9ecbdc;

export function treeTagBuildingSpec(key,w,d){
 const def=TREE_TAG_BUILDINGS[key]||{},type=key==='eC01'?'invisible':key==='eC45'?'upgrade':key==='eC32'?'angry':def.type||'barracks',parts=[],b=(x,y,z,bw,bh,bd,c)=>parts.push([x,y,z,bw,bh,bd,c]),wood=0x856b45,dark=0x504e37,bark=0x6a5b3e,leaf=0x77994e,moss=0x577e45,stone=0x98a08d,gold=0xd8be77;
 const width=w*.88,depth=d*.88,roof=(y,colour=leaf)=>{b(0,y,0,width*1.05,.23,depth*1.06,colour);b(0,y+.19,0,width*.76,.2,depth*.77,colour);b(0,y+.34,0,width*.47,.12,depth*.49,moss);};
 b(0,.11,0,w*.95,.22,d*.95,0x727b5b);
 if(type==='wall'){
  const stage=['eC23','eC03','eC02','eC04','e006'].indexOf(key),n=Math.max(0,stage),h=1.3+n*.27;
  b(0,h/2+.16,0,width*.64,h,depth*.62,bark);b(-width*.17,h/2+.16,depth*.32,width*.17,h*.84,.07,wood);roof(h+.16,0x77914d+n*0x010301);
  for(const side of [-1,1]){b(side*width*.38,.22,0,width*.32,.18,depth*.5,dark);if(n>=2)b(0,.59+side*.21,0,width*.7,.13,depth*.7,stone);}
  if(n===4){b(0,h+.7,0,width*.3,.52,depth*.3,gold);b(0,h+.99,0,width*.15,.15,depth*.15,0xd9e9a4);}
 }else if(type==='resource'){
  const stage=key==='e005'?2:key==='e003'?1:0,h=1.15+stage*.28;
  b(0,h/2+.16,0,width*.87,h,depth*.86,wood);roof(h+.18);
  for(const side of [-1,1]){b(side*width*.38,h/2+.14,depth*.45,.14,h,.12,dark);b(0,.53+side*.14,depth*.46,width*.79,.1,.08,gold);}
  b(0,.6,depth*.48,.5,.59,.08,dark);b(0,.65,depth*.53,.32,.2,.055,gold);
  for(let i=0;i<=stage;i++)b(-width*.3+i*.28,.31,-depth*.54,.2,.4,.25,0xbc9b59);
 }else if(type==='tower'||key==='eC11'){
  const attack=type==='tower',h=attack?2.6:2.1;
  b(0,h/2,0,width*.48,h,depth*.47,bark);b(0,h-.17,0,width,.25,depth,wood);b(0,h+.18,0,width*.72,.47,depth*.7,attack?stone:dark);roof(h+.49,attack?0x849b89:leaf);
  for(const side of [-1,1]){b(side*width*.37,h+.11,depth*.35,.12,.38,.16,gold);b(side*width*.38,.35,0,.17,.55,depth*.73,dark);}
  if(attack){b(0,h+.15,depth*.68,.36,.28,depth*.58,0x526977);b(0,h+.15,depth*.97,.28,.18,.12,0xd1daaf);b(0,h+.96,0,.23,.37,.23,0xcee6c1);}else{b(0,h+.15,depth*.4,.43,.22,.09,0xa7d7b1);b(0,h+.15,depth*.46,.1,.17,.04,0x384e3c);}
 }else if(type==='tunnel'){
  b(0,.19,0,width,.2,depth,0x434e49);for(const side of [-1,1]){b(side*width*.36,.73,0,width*.27,1.2,depth*.64,stone);b(side*width*.33,1.39,0,width*.32,.27,depth*.64,wood);}
  b(0,1.58,0,width*.8,.27,depth*.65,bark);b(0,.78,-depth*.17,width*.5,1.1,.15,0x263c42);b(0,.77,-depth*.08,.18,.4,.07,0x91cbd0);roof(1.79);
 }else if(type==='shop'){
  b(0,.62,0,width*.86,.91,depth*.79,wood);b(0,1.09,depth*.38,width,.21,.44,gold);roof(1.6,0x8f7da5);
  for(const side of [-1,1]){b(side*width*.37,1.4,depth*.41,.1,.72,.11,bark);b(side*width*.28,.77,depth*.44,.3,.3,.22,side>0?0xafd0aa:0xd1a5a7);}
  b(0,.94,depth*.53,.37,.26,.11,0xe3d293);b(0,1.97,0,.18,.25,.18,gold);
 }else if(type==='upgrade'){
  b(0,.72,0,width*.74,1.17,depth*.75,stone);b(0,1.33,0,width*.91,.19,depth*.9,bark);b(0,1.62,0,width*.55,.44,depth*.54,0x88a58c);b(0,1.96,0,.3,.25,.3,0xd3e6b4);
  b(0,.73,depth*.4,.28,.47,.09,dark);b(0,.73,depth*.46,.065,.27,.04,gold);b(.11,.79,depth*.46,.2,.065,.04,gold);
 }else if(key==='e000'){
  // Living Tree of Life: a face, long roots and an elevated luminous crown.
  b(0,1.1,0,width*.6,1.93,depth*.58,bark);for(const side of [-1,1]){b(side*width*.33,.27,0,width*.45,.27,depth*.62,wood);b(side*.27,1.69,depth*.32,.13,.16,.05,0xccedb3);b(side*width*.44,1.27,0,.21,.9,.29,bark);}
  b(0,1.4,depth*.34,.51,.2,.1,wood);roof(2.18);b(0,2.8,0,.34,.4,.34,0xaadac0);b(0,3.07,0,.2,.15,.2,gold);
 }else if(key==='eC08'||key==='eC01'){
  const aura=key==='eC08';b(0,1.0,0,width*.48,1.8,depth*.45,bark);roof(1.99,aura?0x8fa661:0x647c79);
  for(const side of [-1,1]){b(side*width*.4,1.05,depth*.04,.14,.85,.17,aura?gold:0xa5c8bf);b(side*width*.4,1.56,depth*.04,.3,.3,.3,aura?0xd9e3a6:0xc9e1d7);}
  b(0,2.59,0,.28,.35,.28,aura?0xd8e8b8:0x8db7ba);
 }else if(key==='eC32'){
  b(0,1.23,0,width*.65,2.14,depth*.65,bark);roof(2.41);for(const side of [-1,1]){b(side*.29,1.84,depth*.37,.18,.13,.07,0xddd4a3);b(side*.29,2.0,depth*.35,.39,.13,.13,dark);b(side*width*.52,1.32,.08,.37,.94,.4,wood);}b(0,1.59,depth*.41,.5,.16,.12,dark);b(0,.98,depth*.57,.29,.23,.46,0x90b37c);
 }else{
  // Training huts differ through weapons, root arches and roof ornaments.
  const bear=key==='eC30';b(0,.86,0,width*.8,1.4,depth*.75,bark);roof(1.74,bear?0x8d9264:leaf);b(0,.66,depth*.4,.52,.99,.13,dark);b(0,1.2,depth*.48,.66,.13,.11,gold);
  for(const side of [-1,1]){b(side*width*.41,.92,depth*.42,.17,1.59,.17,wood);b(side*width*.43,1.78,depth*.43,.27,.21,.27,stone);}
  if(bear){b(0,2.25,0,.45,.44,.41,wood);for(const side of [-1,1])b(side*.2,2.49,0,.17,.19,.2,gold);b(0,2.17,.26,.27,.17,.14,dark);}else{b(-.43,1.01,depth*.51,.1,.73,.09,stone);b(-.43,1.4,depth*.51,.34,.12,.14,gold);b(.43,1.11,depth*.51,.14,.82,.12,stone);b(.43,1.57,depth*.51,.38,.16,.18,gold);}
 }
 return parts;
}

export function createLegacyWorld({scene}){
 const root=new T.Group(),treeRoot=new T.Group(),warRoot=new T.Group(),forest=new T.Group(),structures=new T.Group();root.name='legacy-world';treeRoot.name='tree-tag-world';warRoot.name='warlock-world';forest.name='tree-tag-forest';structures.name='tree-tag-structures';treeRoot.add(forest,structures);root.add(treeRoot,warRoot);scene.add(root);
 const boxGeometry=new T.BoxGeometry(1,1,1),ringGeometry=new T.RingGeometry(.965,1,96),mat=new T.MeshLambertMaterial(),vertexMat=new T.MeshLambertMaterial({vertexColors:true}),glowMat=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}),ringMat=new T.MeshBasicMaterial({transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false,toneMapped:false}),barMat=new T.MeshBasicMaterial({toneMapped:false});
 const matrix=new T.Object3D(),colour=new T.Color(),batches=new Map(),buildings=new Map(),geometryCache=new Map();let disposed=false,treeFloorKey='',forestKey='',forestPose=-1,warRadius=-1,currentTree=null,buildKey=null,buildOwner=null,buildWorker=null,cursor=null;
 let selectedStructure=new Set(),hoveredStructure=null;
 const selectionMaterial=new T.MeshBasicMaterial({color:0x83dfa0,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false,toneMapped:false}),hoverMaterial=selectionMaterial.clone(),hoverRing=new T.Mesh(ringGeometry,hoverMaterial);hoverRing.name='tree-tag-building-hover';for(const m of [hoverRing]){m.rotation.x=-Math.PI/2;m.visible=false;m.renderOrder=7;treeRoot.add(m);}
 const initialBackground=scene.background,initialFog=scene.fog?.color.clone(),forestBackground=new T.Color(0x61794e),lavaBackground=new T.Color(0x2d1d1b),prepTree={map:{...TREE_TAG_RULES.map,prison:TREE_TAG_RULES.prison},trees:TREE_TAG_FOREST,buildings:[]},prepWar={arenaRadius:22,fields:[],projectiles:[],pillars:[]};
 const meshes=new Set(),ownedGeometries=new Set([boxGeometry,ringGeometry]);
 function ensure(name,parent,capacity,geometry=boxGeometry,material=mat){
  let entry=batches.get(name);if(entry&&entry.capacity>=capacity)return entry.mesh;
  if(entry){entry.mesh.removeFromParent();entry.mesh.dispose();meshes.delete(entry.mesh);}
  const cap=Math.max(1,2**Math.ceil(Math.log2(Math.max(1,capacity)))),mesh=new T.InstancedMesh(geometry,material,cap);mesh.name=name;mesh.count=0;mesh.castShadow=material===mat||material===vertexMat;mesh.receiveShadow=material===mat||material===vertexMat;mesh.frustumCulled=false;parent.add(mesh);batches.set(name,{mesh,capacity:cap});meshes.add(mesh);return mesh;
 }
 function put(mesh,index,x,y,z,w,h,d,hex,ry=0,rx=0){matrix.position.set(x,y,z);matrix.rotation.set(rx,ry,0);matrix.scale.set(Math.max(.001,w),Math.max(.001,h),Math.max(.001,d));matrix.updateMatrix();mesh.setMatrixAt(index,matrix.matrix);mesh.setColorAt(index,colour.setHex(hex));}
 function finish(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 function compile(key,parts){if(geometryCache.has(key))return geometryCache.get(key);const chunks=parts.map(([x,y,z,w,h,d,hex])=>{const g=boxGeometry.clone();g.scale(w,h,d);g.translate(x,y,z);const c=new T.Color(hex),colours=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colours.length;i+=3){colours[i]=c.r;colours[i+1]=c.g;colours[i+2]=c.b;}g.setAttribute('color',new T.BufferAttribute(colours,3));return g;}),geometry=mergeGeometries(chunks);for(const g of chunks)g.dispose();geometry.computeBoundingSphere();geometryCache.set(key,geometry);ownedGeometries.add(geometry);return geometry;}
 function treeFloor(map){
  const width=finite(map.width,94),depth=finite(map.depth,94),key=width+':'+depth;if(key===treeFloorKey)return;treeFloorKey=key;const tile=2,cols=Math.ceil((width+36)/tile),rows=Math.ceil((depth+36)/tile),mesh=ensure('tree-tag-ground',treeRoot,cols*rows);let n=0;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=(col-(cols-1)/2)*tile,z=(row-(rows-1)/2)*tile,seed=hash(col+':'+row),center=Math.hypot(x,z)<4.3,road=!center&&(Math.abs(x)<1.7||Math.abs(z)<1.7)&&Math.hypot(x,z)<width*.47,inside=Math.abs(x)<width/2&&Math.abs(z)<depth/2,shade=center?[0x939a7c,0xa5aa88,0x858d72]:road?[0x9a9866,0x8b8f5b]:inside?[0x718b4a,0x7e9752,0x6d874b,0x849f5a]:[0x526d43,0x5e7947,0x617b48];put(mesh,n++,x,-.2,z,tile+.01,.65+(seed%3)*.035,tile+.01,shade[seed%shade.length]);}finish(mesh,n);
 }
 function updateForest(trees,time){
  const pose=Math.floor(time*8);if(pose===forestPose)return;forestPose=pose;const live=(trees||[]).filter(t=>t.alive!==false&&Number.isFinite(t.x)&&Number.isFinite(t.z)),key=live.map(t=>[t.id,t.x,t.z,t.kind,t.scale].join(',')).join(';');if(key===forestKey)return;forestKey=key;
  const trunks=ensure('tree-tag-trunks',forest,live.length*3),leaves=ensure('tree-tag-canopies',forest,live.length*4);let a=0,b=0;trunks.userData.treeIds=[];leaves.userData.treeIds=[];
  for(const tree of live){const seed=hash(tree.id??tree.x+':'+tree.z),s=clamp(finite(tree.scale,1),.55,1.8),x=tree.x,z=tree.z,h=(3.5+(seed%7)*.13)*s,pine=/pine|fir|ATtc/i.test(String(tree.kind))||seed%3===0;
   put(trunks,a++,x,.15+h*.33,z,.43*s,h*.66,.47*s,[0x76603e,0x69593d,0x7b6748][seed%3]);put(trunks,a++,x-.28*s,h*.55,z,.9*s,.2*s,.25*s,0x7f6948);put(trunks,a++,x+.22*s,h*.62,z+.12*s,.75*s,.2*s,.25*s,0x6a5b3e);
   trunks.userData.treeIds.push(tree.id,tree.id,tree.id);leaves.userData.treeIds.push(...Array(pine?3:4).fill(tree.id));if(pine)for(let i=0;i<3;i++)put(leaves,b++,x,.15+h*.56+i*.67*s,z,(2.45-i*.57)*s,.82*s,(2.3-i*.53)*s,[0x4d7648,0x608646,0x78994e][i]);
   else{put(leaves,b++,x,.15+h*.68,z,2.35*s,1.28*s,2.1*s,[0x648a4c,0x739550,0x829e57][seed%3]);put(leaves,b++,x-.63*s,h*.64,z-.14*s,1.22*s,.91*s,1.5*s,0x567b45);put(leaves,b++,x+.53*s,h*.76,z+.19*s,1.27*s,1.0*s,1.39*s,0x7b9b53);put(leaves,b++,x,h*.95,z-.05*s,1.49*s,.52*s,1.45*s,0x8da85e);}
  }finish(trunks,a);finish(leaves,b);
 }
 const ghostMaterial=new T.MeshBasicMaterial({color:0x8ce4ac,transparent:true,opacity:.25,depthWrite:false,toneMapped:false}),ghost=new T.Mesh(boxGeometry,ghostMaterial),ghostEdgeGeometry=new T.EdgesGeometry(boxGeometry),ghostEdgeMaterial=new T.LineBasicMaterial({color:0xbcebd1,transparent:true,opacity:.95,depthWrite:false,toneMapped:false}),ghostEdges=new T.LineSegments(ghostEdgeGeometry,ghostEdgeMaterial);ownedGeometries.add(ghostEdgeGeometry);ghost.name='tree-tag-build-ghost';ghost.add(ghostEdges);ghost.visible=false;ghost.renderOrder=8;treeRoot.add(ghost);
 function updateBuildGhost(snapshot){
  const def=buildKey&&TREE_TAG_BUILDINGS[buildKey];ghost.visible=!!(treeRoot.visible&&def&&cursor);if(!ghost.visible)return;
  const unit=(snapshot.units||[]).find(u=>buildOwner!=null?u.owner===buildOwner&&(buildWorker==null?!u.treeTagWorker:u.id===buildWorker):u.treeTagCharacter&&u.treeTagRole==='ent'&&!u.bot),check=treeTagBuildCheck(snapshot,unit,buildKey,cursor),point=check.point||{x:Math.round(cursor.x*2)/2,z:Math.round(cursor.z*2)/2};
  ghost.position.set(point.x,.31,point.z);ghost.scale.set(def.w,.4,def.d);ghostMaterial.color.setHex(check.allowed?0x8ce4ac:0xf18a72);ghostEdgeMaterial.color.setHex(check.allowed?0xc7f2ca:0xffbc97);ghost.userData.allowed=check.allowed;ghost.userData.reason=check.reason;
 }
 function updateAshes(snapshot){
  const captured=(snapshot.units||[]).filter(u=>u.treeTagCaptured&&Number.isFinite(u.x)&&Number.isFinite(u.z)),ash=ensure('tree-tag-captured-ashes',treeRoot,captured.length*3);let i=0;
  for(const u of captured){put(ash,i++,u.x,.15,u.z,.58,.07,.49,0x414c41);put(ash,i++,u.x,.32,u.z,.26,.32,.25,0x5a5844);put(ash,i++,u.x+.08,.52,u.z-.02,.1,.1,.11,0xaec890);}finish(ash,i);
 }
 const prisonRing=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xb9ddab,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false,toneMapped:false}));prisonRing.name='tree-tag-prison';prisonRing.rotation.x=-Math.PI/2;treeRoot.add(prisonRing);
 const prisonStones=ensure('tree-tag-prison-stones',treeRoot,16);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put(prisonStones,i,Math.sin(a)*2.15,.27,Math.cos(a)*2.15,.37,.49,.37,i%3===0?0xb6c8a1:0x848f79,a);}finish(prisonStones,12);
 function updateTreeBuildings(entries,time){
  const seen=new Set();for(const b of entries||[]){if(b.alive===false||!Number.isFinite(b.x)||!Number.isFinite(b.z))continue;seen.add(b.id);const def=TREE_TAG_BUILDINGS[b.key]||{},w=finite(b.w,def.w||2),d=finite(b.d,def.d||2),key=b.key+':'+w+':'+d;let entry=buildings.get(b.id);
   if(!entry||entry.key!==key){if(entry)entry.group.removeFromParent();const group=new T.Group(),body=new T.Mesh(compile('structure:'+key,treeTagBuildingSpec(b.key,w,d)),vertexMat);body.castShadow=body.receiveShadow=true;group.add(body);group.name='tree-tag-building-'+b.id;structures.add(group);const scaffoldingParts=[];for(const side of [-1,1])for(const z of [-d*.45,d*.45])scaffoldingParts.push([side*w*.45,1,z,.09,2,.09,0xc2ae7c]);scaffoldingParts.push([0,1.9,d*.45,w,.12,.13,0xb49b6e],[0,.8,-d*.45,w,.12,.13,0xb49b6e]);const scaffold=new T.Mesh(compile('scaffold:'+w+':'+d,scaffoldingParts),vertexMat);group.add(scaffold);entry={group,body,scaffold,key};buildings.set(b.id,entry);}
   entry.group.position.set(b.x,.12,b.z);entry.group.rotation.y=finite(b.rotation);const progress=clamp(finite(b.workProgress,Number.isFinite(b.workRemaining)&&Number.isFinite(b.workTotal)?1-b.workRemaining/Math.max(.001,b.workTotal):1),0,1);entry.body.scale.y=.18+progress*.82;entry.scaffold.visible=progress<.999;
  }
  for(const[id,entry]of buildings)if(!seen.has(id)){entry.group.removeFromParent();buildings.delete(id);}
 }
 const lavaMaterial=createMoltenLavaMaterial();
 const lava=new T.Mesh(boxGeometry,lavaMaterial);lava.name='warlock-lava';lava.position.y=-.82;lava.scale.set(220,.65,220);lava.receiveShadow=false;warRoot.add(lava);
 const boundary=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xffc882,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false,toneMapped:false}));boundary.name='warlock-arena-boundary';boundary.rotation.x=-Math.PI/2;boundary.position.y=.16;warRoot.add(boundary);
 function updateArena(radius,time){
  radius=clamp(finite(radius,20),3,64);boundary.scale.setScalar(radius);lavaMaterial.uniforms.uTime.value=Math.floor(time*8)/8;if(Math.abs(radius-warRadius)<.03)return;warRadius=radius;const step=1.35,n=Math.ceil(radius/step),count=(n*2+1)**2,tiles=ensure('warlock-arena-stone',warRoot,count);let i=0;
  for(let row=-n;row<=n;row++)for(let col=-n;col<=n;col++){const x=col*step,z=row*step,r=Math.hypot(x,z);if(r>radius-.3)continue;const seed=hash(col+':'+row),edge=r>radius-1.7,crack=(col*3+row*5)%17===0,c=edge?0x50515c:crack?0x696c70:[0x777e7b,0x858b81,0x707875,0x8c9083][seed%4];put(tiles,i++,x,-.12-(edge?.03:0),z,step*.988,.49+(seed%3)*.025,step*.988,c);}finish(tiles,i);
  const rocks=ensure('warlock-outer-basalt',warRoot,36);for(let j=0;j<36;j++){const a=j/36*Math.PI*2,r=radius+4+(j%5)*1.4;put(rocks,j,Math.sin(a)*r,-.05+(j%3)*.13,Math.cos(a)*r,1.1+(j%3)*.25,.9+(j%4)*.4,1.3+(j%2)*.3,j%2?0x45464d:0x54515a,a);}finish(rocks,36);
 }
 const projectileGeometry=new Map();
 function missileGeometry(family){
  if(projectileGeometry.has(family))return projectileGeometry.get(family);const parts=[],b=(...p)=>parts.push(p),c=familyColour(family),core=fireFamilies.has(family)?0xffe9a0:0xe4f1d6;
  if(family==='meteor'){b(0,0,0,.7,.64,.76,0x6c5a56);b(.2,.15,.2,.46,.41,.49,0xbd7749);b(-.22,-.08,.29,.23,.24,.17,0xffcd74);b(0,.28,-.24,.22,.19,.23,0xf1a85e);}
  else if(family==='boomerang'){b(-.29,0,0,.28,.12,.74,c);b(.29,0,0,.28,.12,.74,c);b(0,0,-.34,.8,.16,.25,core);b(-.43,0,.26,.22,.13,.32,core);b(.43,0,.26,.22,.13,.32,core);}
  else if(family==='lightning'||family==='arc'){for(let i=0;i<5;i++)b((i%2?.13:-.13),0,-.44+i*.22,.17,.15,.35,i%2?c:core);}
  else if(family==='repeater'||family==='vector'){b(0,0,.0,.13,.13,.85,core);b(0,0,-.23,.38,.07,.24,c);b(0,0,-.23,.07,.38,.24,c);}
  else{b(0,0,0,.38,.34,.49,c);b(0,0,.18,.26,.25,.31,core);b(-.16,.03,-.21,.22,.16,.36,c);b(.16,-.03,-.23,.22,.16,.36,c);b(0,.18,-.28,.15,.17,.36,core);}
  const geometry=compile('missile:'+family,parts);projectileGeometry.set(family,geometry);return geometry;
 }
 function updateWarEffects(war,time){
  const livePillars=(war.pillars||[]).filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.z)),pillarMesh=ensure('warlock-pillars',warRoot,livePillars.length*5);let pillarCount=0;
  for(const p of livePillars){const r=clamp(finite(p.radius,.8),.3,2),h=clamp(finite(p.height,2.6),1,5);put(pillarMesh,pillarCount++,p.x,h/2+.13,p.z,r*1.65,h,r*1.65,0x6d7374);put(pillarMesh,pillarCount++,p.x,.26,p.z,r*2.1,.34,r*2.1,0x4d5659);put(pillarMesh,pillarCount++,p.x,h+.15,p.z,r*2.04,.31,r*2.04,0xa3a78f);put(pillarMesh,pillarCount++,p.x-r*.84,h*.55,p.z,.09,h*.68,r*.63,0x8b9390);put(pillarMesh,pillarCount++,p.x,h*.6,p.z+r*.85,r*.41,.45,.07,0xbcc0a1);}finish(pillarMesh,pillarCount);
  const fields=(war.fields||[]).filter(f=>Number.isFinite(f.x)&&Number.isFinite(f.z)&&(!Number.isFinite(f.until)||f.until>time)),rings=ensure('warlock-field-rings',warRoot,fields.length,ringGeometry,ringMat),pillars=ensure('warlock-field-voxels',warRoot,fields.length*12,boxGeometry,barMat);let ringCount=0,blockCount=0;const pose=Math.floor(time*8);
  for(const field of fields){const family=familyOf(field),r=clamp(finite(field.radius,1),.2,30),c=familyColour(family);put(rings,ringCount++,field.x,.19,field.z,r,r,r,c,0,-Math.PI/2);for(let i=0;i<8;i++){const a=i*Math.PI/4+pose*.08,gravity=family==='gravity',height=gravity?.6+Math.sin(pose*.3+i)*.3:.18;put(pillars,blockCount++,field.x+Math.sin(a)*r*.87,.25+height*.5,field.z+Math.cos(a)*r*.87,gravity?.16:.22,height,gravity?.16:.22,c,a);}}
  finish(rings,ringCount);finish(pillars,blockCount);
  for(const[name,entry]of batches)if(name.startsWith('warlock-missiles-'))entry.mesh.count=0;
  const byFamily=new Map();for(const p of war.projectiles||[]){if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||p.alive===false)continue;const family=familyOf(p),list=byFamily.get(family)||[];list.push(p);byFamily.set(family,list);}
  for(const[family,shots]of byFamily){const mesh=ensure('warlock-missiles-'+family,warRoot,shots.length,missileGeometry(family),glowMat);let index=0;for(const p of shots){const size=clamp(finite(p.radius,.3)*1.55,.45,1.8),height=family==='meteor'?1.6:finite(p.height,.9),yaw=family==='boomerang'?pose*.56:Math.atan2(finite(p.dx),finite(p.dz,1));put(mesh,index++,p.x,height,p.z,size,size,size,0xffffff,yaw,family==='meteor'?pose*.2:0);}finish(mesh,index);}
 }
 return{
  root,
  setSelection(ids){selectedStructure=new Set(Array.isArray(ids)?ids:ids==null?[]:[ids]);},
  setHovered(id){hoveredStructure=id??null;},
  pickRay(raycaster){if(!currentTree||!root.visible)return null;structures.updateWorldMatrix(true,true);const meshes=[];for(const [id,e]of buildings){e.body.userData.treeBuilding=id;meshes.push(e.body);if(e.scaffold.visible){e.scaffold.userData.treeBuilding=id;meshes.push(e.scaffold);}}const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)return{legacyBuilding:hit.object.userData.treeBuilding};forest.updateWorldMatrix(true,true);const treeHit=raycaster.intersectObjects(forest.children,false)[0],treeId=treeHit?.object.userData.treeIds?.[treeHit.instanceId];return treeId!=null?{legacyTree:treeId}:null;},
  visibleMatches(id,camera){const source=currentTree?.buildings?.find(b=>b.id===id&&b.alive!==false);if(!source||!camera)return [];camera.updateMatrixWorld();const f=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),bounds=new T.Box3();return currentTree.buildings.filter(b=>b.alive!==false&&b.key===source.key&&b.owner===source.owner&&buildings.has(b.id)).filter(b=>{const body=buildings.get(b.id).body;body.updateWorldMatrix(true,true);return f.intersectsBox(bounds.setFromObject(body));}).map(b=>b.id);},
  inScreenRect(camera,rect,width,height,owner){if(!currentTree)return [];camera.updateMatrixWorld();return currentTree.buildings.filter(b=>b.alive!==false&&b.owner===owner).filter(b=>{const p=new T.Vector3(b.x,1.2,b.z).project(camera);return p.z>=-1&&p.z<=1&&(p.x*.5+.5)*width>=rect.left&&(p.x*.5+.5)*width<=rect.right&&(-p.y*.5+.5)*height>=rect.top&&(-p.y*.5+.5)*height<=rect.bottom;}).map(b=>b.id);},
  setBuild(key,owner,workerId=null){buildWorker=workerId;buildKey=typeof key==='string'&&Object.hasOwn(TREE_TAG_BUILDINGS,key)?key:null;if(owner!==undefined)buildOwner=owner;if(!buildKey)ghost.visible=false;},
  setCursor(point){cursor=Number.isFinite(point?.x)&&Number.isFinite(point?.z)?{x:point.x,z:point.z}:null;if(!cursor)ghost.visible=false;},
  update(snapshot,time,owner){if(disposed)return;const now=parseTime(snapshot,time),mode=snapshot?.options?.mode,tree=mode==='treetag'?(snapshot.treeTag||prepTree):null,war=mode==='warlock'?(snapshot.warlock||prepWar):null;treeRoot.visible=mode==='treetag';warRoot.visible=mode==='warlock';root.visible=treeRoot.visible||warRoot.visible;currentTree=treeRoot.visible?tree:null;if(root.visible){scene.background=treeRoot.visible?forestBackground:lavaBackground;if(scene.fog)scene.fog.color.copy(scene.background);}else if(scene.background===forestBackground||scene.background===lavaBackground){scene.background=initialBackground;if(scene.fog&&initialFog)scene.fog.color.copy(initialFog);}
   if(treeRoot.visible){treeFloor(tree.map||{});updateForest(tree.trees,now);updateTreeBuildings(tree.buildings,now);updateBuildGhost(snapshot);updateAshes(snapshot);const prison=tree.map?.prison||tree.prison||{x:0,z:0,radius:2};prisonRing.position.set(finite(prison.x),.18,finite(prison.z));prisonRing.scale.setScalar(finite(prison.radius,2));prisonRing.material.opacity=.67+Math.sin(Math.floor(now*8)*.16)*.13;prisonStones.position.set(finite(prison.x),0,finite(prison.z));}
   const selected=(tree?.buildings||[]).filter(b=>selectedStructure.has(b.id)&&b.alive!==false),selectionRing=ensure('tree-tag-building-selection',treeRoot,selected.length,ringGeometry,selectionMaterial);selectionRing.visible=selected.length>0;let selectedCount=0;const viewer=snapshot.units?.find(u=>u.id===snapshot.players?.[owner]);for(const b of selected){selectionMaterial.color.setHex(b.owner===owner||viewer&&viewer.team===b.team?0x83dfa0:0xf18475);put(selectionRing,selectedCount++,b.x,.2,b.z,(b.w||2)*.67,(b.d||2)*.67,1,0xffffff,0,-Math.PI/2);}finish(selectionRing,selectedCount);for(const [marker,id]of [[hoverRing,hoveredStructure]]){const b=tree?.buildings?.find(b=>b.id===id&&b.alive!==false);marker.visible=!!b;if(b){const viewer=snapshot.units?.find(u=>u.id===snapshot.players?.[owner]),ally=b.owner===owner||viewer&&viewer.team===b.team;marker.position.set(b.x,.2,b.z);marker.scale.set((b.w||2)*.67,(b.d||2)*.67,1);marker.material.color.setHex(ally?0x83dfa0:0xf18475);}}
   if(warRoot.visible){updateArena(war.arenaRadius??war.radius??20,now);updateWarEffects(war,now);}
  },
  pick(point){if(!currentTree||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return null;const b=(currentTree.buildings||[]).filter(b=>b.alive!==false&&Math.abs(point.x-b.x)<=(b.w||TREE_TAG_BUILDINGS[b.key]?.w||2)/2&&Math.abs(point.z-b.z)<=(b.d||TREE_TAG_BUILDINGS[b.key]?.d||2)/2).sort((a,b)=>Math.hypot(point.x-a.x,point.z-a.z)-Math.hypot(point.x-b.x,point.z-b.z))[0];if(b)return{legacyBuilding:b.id};const tree=(currentTree.trees||[]).find(t=>t.alive!==false&&Math.hypot(point.x-t.x,point.z-t.z)<Math.max(.65,(t.w||.8)/2));return tree?{legacyTree:tree.id}:null;},
  dispose(){if(disposed)return;disposed=true;for(const mesh of meshes)mesh.dispose();for(const geometry of ownedGeometries)geometry.dispose();for(const material of [mat,vertexMat,glowMat,ringMat,barMat,lavaMaterial,boundary.material,prisonRing.material,ghostMaterial,ghostEdgeMaterial,selectionMaterial,hoverMaterial])material.dispose();buildings.clear();batches.clear();geometryCache.clear();root.removeFromParent();if(scene.background===forestBackground||scene.background===lavaBackground){scene.background=initialBackground;if(scene.fog&&initialFog)scene.fog.color.copy(initialFog);}}
 };
}

const treePortraits=new Map();
export function treeTagBuildingPortrait(key){if(treePortraits.has(key))return treePortraits.get(key);const b=typeof key==='string'&&Object.hasOwn(TREE_TAG_BUILDINGS,key)?TREE_TAG_BUILDINGS[key]:null;if(!b)return '';const svg=voxelTagPortrait(treeTagBuildingSpec(key,b.w,b.d),'tree-building-portrait');treePortraits.set(key,svg);return svg;}
