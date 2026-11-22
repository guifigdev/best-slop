import * as T from 'three';

const EPS=1e-6;
function subtract(rect,cut){
 const [a,b,c,d]=rect,x=Math.max(a,cut[0]),y=Math.min(b,cut[1]),z=Math.max(c,cut[2]),w=Math.min(d,cut[3]);
 if(y-x<EPS||w-z<EPS)return[rect];const out=[];
 if(x-a>EPS)out.push([a,x,c,d]);if(b-y>EPS)out.push([y,b,c,d]);
 if(z-c>EPS)out.push([x,y,c,z]);if(d-w>EPS)out.push([x,y,w,d]);return out;
}
// Exact surface of the authored box union: subtract covered face rectangles,
// including partial overlaps. No voxel resolution change or silhouette loss.
export function voxelShellGeometry(parts,{trimPartial=false}={}){
 const boxes=parts.map(p=>({min:p.slice(0,3).map((v,i)=>v-p[i+3]/2),max:p.slice(0,3).map((v,i)=>v+p[i+3]/2),color:p[6]})),positions=[],normals=[],colors=[],color=new T.Color();
 for(let i=0;i<boxes.length;i++)for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const box=boxes[i],u=(axis+1)%3,v=(axis+2)%3,plane=sign>0?box.max[axis]:box.min[axis];let rects=[[box.min[u],box.max[u],box.min[v],box.max[v]]];
  for(let j=0;j<boxes.length&&rects.length;j++){
   if(i===j)continue;const other=boxes[j],crosses=sign>0?other.min[axis]<=plane+EPS&&other.max[axis]>plane+EPS:other.max[axis]>=plane-EPS&&other.min[axis]<plane-EPS,
    coplanar=j<i&&Math.abs((sign>0?other.max[axis]:other.min[axis])-plane)<EPS;
   if(!crosses&&!coplanar)continue;rects=rects.flatMap(r=>subtract(r,[other.min[u],other.max[u],other.min[v],other.max[v]]));
  }
  // Partial clipping can multiply triangles on detailed fur. Keep its original
  // quad unless fully buried; the depth buffer handles its hidden portion.
  if(rects.length&&!trimPartial)rects=[[box.min[u],box.max[u],box.min[v],box.max[v]]];
  color.setHex(box.color);for(const [a,b,c,d]of rects){const corners=[[a,c],[b,c],[b,d],[a,d]],order=sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];for(const index of order){const p=[0,0,0],n=[0,0,0];p[axis]=plane;p[u]=corners[index][0];p[v]=corners[index][1];n[axis]=sign;positions.push(...p);normals.push(...n);colors.push(color.r,color.g,color.b);}}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();geometry.userData={sourceTriangles:parts.length*12,shellTriangles:positions.length/9};return geometry;
}
