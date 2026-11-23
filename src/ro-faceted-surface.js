import * as T from 'three';

// Chamfer the actual piecewise-planar ground, rather than placing disconnected
// rounded boxes over it. The source vertices remain anchors for the simulation's
// height field. Broad flat facets meet through planar bevel bands and corner fans.
const plans=new WeakMap(),EPS=1e-8;
const vertexKey=p=>p.map(v=>Math.round(v*10000)).join(',');
const center=(a,b,c)=>a.map((v,i)=>(v+b[i]+c[i])/3);
function planFor(source){
 let cached=plans.get(source);if(cached)return cached;
 const position=source.attributes.position,colors=source.attributes.color,kinds=source.attributes.pixelTerrainKind;
 if(!position||position.count%3||position.count>180000)throw Error('Unsupported terrain surface size.');
 const vertices=[],lookup=new Map(),faces=[],edges=new Map(),incident=[],boundary=new Set();
 const at=i=>[position.getX(i),position.getY(i),position.getZ(i)];
 for(let index=0;index<position.count;index+=3){
  const points=[at(index),at(index+1),at(index+2)];if(points.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('Invalid terrain surface.');
  const ids=points.map(p=>{const key=vertexKey(p);if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(p);incident.push([]);}return lookup.get(key);});
  if(new Set(ids).size<3)continue;const id=faces.length,c=colors?[0,1,2].map(channel=>(colors.getComponent(index,channel)+colors.getComponent(index+1,channel)+colors.getComponent(index+2,channel))/3):[1,1,1];
  const face={id,ids,center:center(...points),color:c,kind:kinds?kinds.getX(index):0};faces.push(face);for(let k=0;k<3;k++){incident[ids[k]].push({face,corner:k});const a=ids[k],b=ids[(k+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);if(!edges.has(key))edges.set(key,[]);edges.get(key).push({face,a,b});}
 }
 const starts=[],offsets=[],colorData=[],surfaceData=[];
 const original=id=>({p:vertices[id],d:[0,0,0]}),inner=(face,id)=>({p:vertices[id],d:face.center.map((v,k)=>(v-vertices[id][k])*.3)});
 function triangle(a,b,c,color,kind){
  const one=a.p.map((v,k)=>v+a.d[k]),two=b.p.map((v,k)=>v+b.d[k]),three=c.p.map((v,k)=>v+c.d[k]),ux=two[0]-one[0],uz=two[2]-one[2],vx=three[0]-one[0],vz=three[2]-one[2],up=uz*vx-ux*vz;
  if(Math.abs(up)<EPS)return;if(up<0)[b,c]=[c,b];for(const point of [a,b,c]){starts.push(...point.p);offsets.push(...point.d);colorData.push(...color);surfaceData.push(kind);}
 }
 const quad=(a,b,c,d,color,kind)=>{triangle(a,b,c,color,kind);triangle(a,c,d,color,kind);};
 for(const face of faces)triangle(...face.ids.map(id=>inner(face,id)),face.color,face.kind);
 for(const entries of edges.values()){
  const edge=entries[0],{face,a,b}=edge,ia=inner(face,a),ib=inner(face,b);
  if(entries.length!==2){boundary.add(a);boundary.add(b);quad(ia,ib,original(b),original(a),face.color,face.kind);continue;}
  const other=entries[1].face,ja=inner(other,a),jb=inner(other,b);
  if(face.kind!==other.kind){quad(ia,ib,original(b),original(a),face.color,face.kind);quad(jb,ja,original(a),original(b),other.color,other.kind);}
  else quad(ia,ib,jb,ja,face.color.map((v,k)=>(v+other.color[k])*.5),face.kind);
 }
 for(let id=0;id<vertices.length;id++){
  const vertex=vertices[id],ring=incident[id].map(item=>({...item,angle:Math.atan2(item.face.center[2]-vertex[2],item.face.center[0]-vertex[0])})).sort((a,b)=>a.angle-b.angle);
  if(ring.length<2)continue;
  if(boundary.has(id)){let largest=-1,split=0;for(let i=0;i<ring.length;i++){const gap=(ring[(i+1)%ring.length].angle-ring[i].angle+Math.PI*2)%(Math.PI*2);if(gap>largest){largest=gap;split=(i+1)%ring.length;}}ring.push(...ring.splice(0,split));}
  const count=boundary.has(id)?ring.length-1:ring.length;
  for(let i=0;i<count;i++){const a=ring[i].face,b=ring[(i+1)%ring.length].face;triangle(original(id),inner(a,id),inner(b,id),a.kind===b.kind?a.color.map((v,k)=>(v+b.color[k])*.5):a.color,a.kind);}
 }
 cached={starts:new Float32Array(starts),offsets:new Float32Array(offsets),colors:new Float32Array(colorData),kinds:new Float32Array(surfaceData),sourceTriangles:position.count/3};plans.set(source,cached);return cached;
}

export function roFacetedSurfaceGeometry(source,{chamfer=.5,cellSize=28.8}={}){
 const amount=Math.max(0,Math.min(1,Number(chamfer)||0));if(!amount){const geometry=source.clone();geometry.userData={...source.userData,facetedTerrain:true,chamfer:0};return geometry;}
 const plan=planFor(source),positions=new Float32Array(plan.starts.length),normals=new Float32Array(plan.starts.length),cells=new Map(),point=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),u=new T.Vector3(),v=new T.Vector3(),normal=new T.Vector3();
 for(let i=0;i<positions.length;i++)positions[i]=plan.starts[i]+plan.offsets[i]*amount;
 for(let i=0;i<positions.length;i+=9){a.fromArray(positions,i);b.fromArray(positions,i+3);c.fromArray(positions,i+6);normal.crossVectors(u.subVectors(b,a),v.subVectors(c,a)).normalize();for(let k=0;k<3;k++)normal.toArray(normals,i+k*3);
  const x=(a.x+b.x+c.x)/3,z=(a.z+b.z+c.z)/3,key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize);let cell=cells.get(key);if(!cell)cells.set(key,cell={bounds:new T.Box3(),indices:[]});for(let k=0;k<3;k++){cell.indices.push(i/3+k);point.fromArray(positions,i+k*3);cell.bounds.expandByPoint(point);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('color',new T.BufferAttribute(plan.colors,3));geometry.setAttribute('pixelTerrainKind',new T.BufferAttribute(plan.kinds,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.userData={faceted:true,facetedTerrain:true,chamfer:amount,sourceTriangles:plan.sourceTriangles,triangles:positions.length/9,roTerrainCells:[...cells.values()]};return geometry;
}
