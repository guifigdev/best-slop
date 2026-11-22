import * as T from 'three';

// Geometric chamfers, inspired by the exposed-edge construction in the user's
// atlas-in-relief TerrainMesh.tsx. Normals stay flat: no blur, AA or smoothing.
export const RO_FACETED_DEFAULT=.35;
export const RO_FACETED_STEPS=20;
export function roChamferAmount(value=RO_FACETED_DEFAULT){return Math.round(Math.min(1,Math.max(0,Number.isFinite(Number(value))?Number(value):RO_FACETED_DEFAULT))*RO_FACETED_STEPS)/RO_FACETED_STEPS;}
const ALL_FACES=Object.freeze([true,true,true,true,true,true]);
const faceIndex=(axis,sign)=>axis*2+(sign>0?1:0);
const dimension=value=>{const n=Number(value);if(!Number.isFinite(n)||n<=0)throw Error('Geometry dimensions must be positive finite numbers.');return n;};

function builder(){
 const position=[],normal=[],uv=[],color=[],v1=new T.Vector3(),v2=new T.Vector3(),v0=new T.Vector3(),n=new T.Vector3(),c=new T.Color();
 return{polygon(points,expected,hex=0xffffff){
  if(points.length<3)return;v0.fromArray(points[0]);v1.fromArray(points[1]).sub(v0);v2.fromArray(points[2]).sub(v0);n.crossVectors(v1,v2).normalize();
  if(n.lengthSq()<.5)return;if(n.x*expected[0]+n.y*expected[1]+n.z*expected[2]<0){points=points.slice().reverse();n.negate();}
  c.setHex(hex);for(let j=1;j<points.length-1;j++)for(const k of [0,j,j+1]){position.push(...points[k]);normal.push(n.x,n.y,n.z);uv.push(k===0||k===3?0:1,k<2?0:1);color.push(c.r,c.g,c.b);}
 },finish(meta={}){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.computeBoundingBox();g.computeBoundingSphere();g.userData={...meta,faceted:true,triangles:position.length/9};return g;}};
}

function appendBox(out,{x=0,y=0,z=0,width=1,height=1,depth=1,chamfer=RO_FACETED_DEFAULT,faces=ALL_FACES,color=0xffffff}){
 const size=[dimension(width),dimension(height),dimension(depth)],half=size.map(n=>n/2),origin=[x,y,z],r=Math.min(...size)*.25*roChamferAmount(chamfer),exposed=(axis,sign)=>faces[faceIndex(axis,sign)]!==false;
 const point=p=>p.map((v,i)=>v+origin[i]);
 // Large flat faces are inset only where another exposed face meets them.
 // A touching voxel's hidden face leaves the shared seam flat and closed.
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  if(!exposed(axis,sign))continue;const u=(axis+1)%3,v=(axis+2)%3,points=[];
  for(const [su,sv]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=[0,0,0];p[axis]=sign*half[axis];p[u]=su*(half[u]-(exposed(u,su)?r:0));p[v]=sv*(half[v]-(exposed(v,sv)?r:0));points.push(point(p));}
  const n=[0,0,0];n[axis]=sign;out.polygon(points,n,color);
 }
 if(!r)return;
 // Twelve planar bevel strips. Every strip uses one shared hard normal.
 for(let free=0;free<3;free++){const a=(free+1)%3,b=(free+2)%3;for(const sa of [-1,1])for(const sb of [-1,1]){
  if(!exposed(a,sa)||!exposed(b,sb))continue;const points=[];
  for(const [side,end]of [[0,-1],[1,-1],[1,1],[0,1]]){const p=[0,0,0];p[free]=end*(half[free]-(exposed(free,end)?r:0));p[a]=sa*(half[a]-(side?r:0));p[b]=sb*(half[b]-(side?0:r));points.push(point(p));}
  const n=[0,0,0];n[a]=sa;n[b]=sb;out.polygon(points,n,color);
 }}
 // Eight triangular corner planes close the solid without changing its AABB.
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const signs=[sx,sy,sz];if(!signs.every((s,axis)=>exposed(axis,s)))continue;out.polygon(signs.map((_s,axis)=>point(signs.map((s,i)=>s*(half[i]-(i===axis?0:r))))),signs,color);}
}

/** Owned geometry. Caller disposes it. Bounds match the original box exactly. */
export function roFacetedBoxGeometry(width=1,height=1,depth=1,chamfer=RO_FACETED_DEFAULT,{faces=ALL_FACES,color=0xffffff}={}){
 const out=builder();appendBox(out,{width,height,depth,chamfer,faces,color});return out.finish({chamfer:roChamferAmount(chamfer),sourceTriangles:12});
}

/** One owned geometry for an authored set of boxes; no extra draw calls. */
export function roFacetedVoxelGeometry(parts,{chamfer=RO_FACETED_DEFAULT,exposedFaces=null}={}){
 const out=builder();parts.forEach((p,index)=>appendBox(out,{x:p[0],y:p[1],z:p[2],width:p[3],height:p[4],depth:p[5],color:p[6],chamfer,faces:exposedFaces?.[index]||ALL_FACES}));
 const g=out.finish({chamfer:roChamferAmount(chamfer),sourceTriangles:parts.length*12});g.userData.shellTriangles=g.userData.triangles;return g;
}

/** Bounded unit-box cache: at most 22 geometries. Borrow; never dispose a single
 * returned geometry. Swap all consumers before clear()/dispose(). Mesh scales,
 * colors, matrices and instancing remain owned by the renderer. */
export function createRoFacetedGeometryCache(){
 const cache=new Map();return{get(mode='voxel',chamfer=RO_FACETED_DEFAULT){const amount=mode==='faceted'?roChamferAmount(chamfer):0,key=amount.toFixed(2);if(!cache.has(key))cache.set(key,roFacetedBoxGeometry(1,1,1,amount));return cache.get(key);},stats(){let bytes=0,triangles=0;for(const g of cache.values()){triangles+=g.attributes.position.count/3;for(const a of Object.values(g.attributes))bytes+=a.array.byteLength;}return{entries:cache.size,bytes,triangles,maxEntries:RO_FACETED_STEPS+1};},clear(){for(const g of cache.values())g.dispose();cache.clear();},dispose(){this.clear();}};
}

/** Owned stepped-column terrain with chamfers only on exposed top rims. Uses
 * the same sampled heights; collision/navigation data is never modified.
 * heights is row-major columns*rows. colorAt(index) returns a hex color. */
export function roFacetedTerrainGeometry({columns,rows,cellSize=1,heights,base=-1,x0=0,z0=0,chamfer=RO_FACETED_DEFAULT,colorAt=()=>0x78825b}={}){
 if(!Number.isInteger(columns)||!Number.isInteger(rows)||columns<1||rows<1||columns*rows>262144||heights?.length!==columns*rows)throw Error('Invalid terrain grid.');dimension(cellSize);if(!Number.isFinite(base)||!Number.isFinite(x0)||!Number.isFinite(z0))throw Error('Invalid terrain origin.');
 const out=builder(),sample=(i,j)=>i<0||j<0||i>=columns||j>=rows?base:Number(heights[j*columns+i]),half=cellSize/2,amount=roChamferAmount(chamfer);
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
  const index=j*columns+i,y=sample(i,j);if(!Number.isFinite(y)||y<base)throw Error('Terrain heights must be finite and above the base.');if(y===base)continue;
  const cx=x0+i*cellSize,cz=z0+j*cellSize,top=colorAt(index),side=new T.Color(top).multiplyScalar(.74).getHex(),neighbors=[sample(i-1,j),sample(i+1,j),sample(i,j-1),sample(i,j+1)],low=neighbors.map(n=>n<y-1e-6);let r=cellSize*.25*amount;
  for(const n of neighbors)if(n<y-1e-6)r=Math.min(r,(y-n)*.5);
  const ax=cx-half,bx=cx+half,az=cz-half,bz=cz+half,iax=ax+(low[0]?r:0),ibx=bx-(low[1]?r:0),iaz=az+(low[2]?r:0),ibz=bz-(low[3]?r:0);
  out.polygon([[iax,y,iaz],[iax,y,ibz],[ibx,y,ibz],[ibx,y,iaz]],[0,1,0],top);
  const sides=[{key:0,a:[ax,az],b:[ax,bz],ia:[iax,iaz],ib:[iax,ibz],n:[-1,0,0]},{key:1,a:[bx,bz],b:[bx,az],ia:[ibx,ibz],ib:[ibx,iaz],n:[1,0,0]},{key:2,a:[bx,az],b:[ax,az],ia:[ibx,iaz],ib:[iax,iaz],n:[0,0,-1]},{key:3,a:[ax,bz],b:[bx,bz],ia:[iax,ibz],ib:[ibx,ibz],n:[0,0,1]}];
  for(const s of sides){if(!low[s.key])continue;const ny=neighbors[s.key],yb=y-r;
   if(r>0)out.polygon([[...s.ia.slice(0,1),y,s.ia[1]],[s.a[0],yb,s.a[1]],[s.b[0],yb,s.b[1]],[s.ib[0],y,s.ib[1]]],[s.n[0],1,s.n[2]],top);
   if(yb>ny+1e-7)out.polygon([[s.a[0],yb,s.a[1]],[s.a[0],ny,s.a[1]],[s.b[0],ny,s.b[1]],[s.b[0],yb,s.b[1]]],s.n,side);
   // Close the rim against a same-height neighbour at either end. Rendering
   // both windings is unnecessary because this triangle has a known normal.
   for(const [point,inside]of [[s.a,s.ia],[s.b,s.ib]]){if(r===0)continue;const px=point[0]<cx?-1:1,pz=point[1]<cz?-1:1,neighbor=s.key<2?sample(i,j+pz):sample(i+px,j);if(neighbor<y-1e-6)continue;const n=s.key<2?[0,0,pz]:[px,0,0];out.polygon([[inside[0],y,inside[1]],[point[0],y,point[1]],[point[0],yb,point[1]]],n,side);}
  }
 }
 return out.finish({chamfer:amount,terrain:true,columns,rows});
}

function copyBoxAttributes(source,target){
 const sourcePositions=source.attributes.position,normals=target.attributes.normal,positions=target.attributes.position;
 // Authored actors mostly use uniform vertex colors. Per-face box colors are
 // blended on the bevel between their two or three adjacent flat faces.
 if(source.attributes.color){const original=source.attributes.color,faces=Array.from({length:6},()=>[0,0,0,0]),sn=source.attributes.normal;for(let i=0;i<original.count;i++){let axis=0;if(sn){if(Math.abs(sn.getY(i))>Math.abs(sn.getX(i)))axis=1;if(Math.abs(sn.getZ(i))>Math.abs(sn.getComponent(i,axis)))axis=2;}const sign=sn?Math.sign(sn.getComponent(i,axis)):1,row=faces[faceIndex(axis,sign)];row[0]+=original.getX(i);row[1]+=original.getY(i);row[2]+=original.getZ(i);row[3]++;}for(const f of faces)if(f[3])for(let j=0;j<3;j++)f[j]/=f[3];const colors=new Float32Array(positions.count*3);for(let i=0;i<positions.count;i++){let sum=0;const result=[0,0,0];for(let axis=0;axis<3;axis++){const n=normals.getComponent(i,axis),weight=Math.abs(n);if(!weight)continue;const f=faces[faceIndex(axis,Math.sign(n))];for(let j=0;j<3;j++)result[j]+=f[j]*weight;sum+=weight;}for(let j=0;j<3;j++)colors[i*3+j]=result[j]/Math.max(1e-6,sum);}target.setAttribute('color',new T.BufferAttribute(colors,3));}
 for(const [key,attribute]of Object.entries(source.attributes)){
  if(['position','normal','uv','color'].includes(key))continue;if(attribute.isInstancedBufferAttribute){target.setAttribute(key,attribute);continue;}
  const values=new attribute.array.constructor(positions.count*attribute.itemSize);for(let i=0;i<positions.count;i++){let closest=0,distance=Infinity;for(let j=0;j<sourcePositions.count;j++){const d=(positions.getX(i)-sourcePositions.getX(j))**2+(positions.getY(i)-sourcePositions.getY(j))**2+(positions.getZ(i)-sourcePositions.getZ(j))**2;if(d<distance){distance=d;closest=j;}}for(let c=0;c<attribute.itemSize;c++)values[i*attribute.itemSize+c]=attribute.array[closest*attribute.itemSize+c];}target.setAttribute(key,new T.BufferAttribute(values,attribute.itemSize,attribute.normalized));
 }
}

/** Applies presentation-only geometry swaps to existing and newly made meshes.
 * Call update(nowMs) each frame; traversal is internally throttled to 100 ms.
 * On option changes all consumers swap before obsolete variants are disposed.
 * Original shared geometry/materials and instance matrices are never disposed. */
export function createRoGeometryPresentation({scene,interval=100}={}){
 if(!scene?.traverse)throw Error('A Three.js scene or root group is required.');
 const originals=new WeakMap(),variants=new Map();let style='blocks',chamfer=RO_FACETED_DEFAULT,dirty=true,last=-Infinity,disposed=false,report={meshes:0,geometries:0,triangles:0,bytes:0,skipped:0};
 const excluded=/particle|projectile|attack|voxel-fire|smoke|spark|health|hud|pickup|loot|light-shaft|impact-stones/i;
 function allowed(object){if(!object.isMesh||object.isSkinnedMesh||object.userData?.roNoFacet)return false;for(let node=object;node&&node!==scene;node=node.parent)if(node.userData?.roNoFacet||excluded.test(node.name||''))return false;const materials=Array.isArray(object.material)?object.material:[object.material];return materials.length&&materials.every(m=>m&&!m.transparent&&m.depthWrite!==false&&!m.isShaderMaterial&&m.blending!==T.AdditiveBlending)&&(!(!object.castShadow&&!object.receiveShadow)||!!object.geometry?.userData?.roVoxelParts);}
 function variant(source,object){let entry=variants.get(source);if(!entry)variants.set(source,entry={geometry:null,key:''});const key=style+':'+chamfer;if(entry.key===key&&entry.geometry)return entry.geometry;
  let geometry;
  if(source.userData.roVoxelParts)geometry=roFacetedVoxelGeometry(source.userData.roVoxelParts,{chamfer,exposedFaces:source.userData.roVoxelFaces});
  else if(object.userData.roTerrainGrid)geometry=roFacetedTerrainGeometry({...object.userData.roTerrainGrid,chamfer});
  else {const p=source.parameters;geometry=roFacetedBoxGeometry(p.width,p.height,p.depth,chamfer);copyBoxAttributes(source,geometry);}
  originals.set(geometry,source);const old=entry.geometry;entry.geometry=geometry;entry.key=key;if(old)(entry.retired||=[]).push(old);return geometry;
 }
 function update(now=globalThis.performance?.now?.()||Date.now()){
  if(disposed||!dirty&&now-last<interval)return;last=now;dirty=false;const used=new Set();let meshes=0,skipped=0;
  scene.traverse(object=>{if(!object.isMesh||!object.geometry)return;const source=originals.get(object.geometry)||object.geometry;
   if(style==='blocks'||chamfer===0||!allowed(object)){if(originals.has(object.geometry))object.geometry=source;return;}
   if(source.type!=='BoxGeometry'&&!source.userData?.roVoxelParts&&!object.userData.roTerrainGrid)return;try{const geometry=variant(source,object);used.add(source);object.geometry=geometry;meshes++;}catch{object.geometry=source;skipped++;}
  });
  let triangles=0,bytes=0;for(const [source,entry]of variants){for(const g of entry.retired||[])g.dispose();entry.retired=[];if(!used.has(source)){entry.geometry?.dispose();variants.delete(source);continue;}triangles+=(entry.geometry?.attributes.position.count||0)/3;for(const attr of Object.values(entry.geometry.attributes))if(!attr.isInstancedBufferAttribute)bytes+=attr.array.byteLength;}
  report={meshes,geometries:variants.size,triangles,bytes,skipped};
 }
 return{setOptions(options={}){const next=options.terrainStyle===undefined?style:options.terrainStyle==='faceted'?'faceted':'blocks',amount=roChamferAmount(options.chamfer??chamfer);if(next!==style||amount!==chamfer){style=next;chamfer=amount;dirty=true;}return{terrainStyle:style,chamfer};},update,stats(){return{...report,terrainStyle:style,chamfer,interval};},dispose(){if(disposed)return;scene.traverse(object=>{if(object.isMesh&&originals.has(object.geometry))object.geometry=originals.get(object.geometry);});for(const entry of variants.values()){entry.geometry?.dispose();for(const g of entry.retired||[])g.dispose();}variants.clear();disposed=true;report={meshes:0,geometries:0,triangles:0,bytes:0,skipped:0};}};
}
