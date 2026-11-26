import * as T from 'three';
export const VOXEL_FLUID_SURFACE_BUDGET=Object.freeze({cells:4096,faces:12000,cellSize:.13,updatesPerSecond:30});
const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],corners=[[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[0,1,0],[1,1,0],[1,0,0],[0,0,0]]],tri=[0,1,2,0,2,3];
// Sparse union of occupied fluid voxels. Only exterior faces are submitted;
// neighboring droplets share a surface instead of layering transparent cubes.
export function createVoxelFluidSurface(){
 const B=VOXEL_FLUID_SURFACE_BUDGET,geometry=new T.BufferGeometry(),positions=new Float32Array(B.faces*18),normals=new Float32Array(B.faces*18),colors=new Float32Array(B.faces*18),cells=new Map(),tint=new T.Color();let faces=0,clipped=0;
 for(const [name,array]of [['position',positions],['normal',normals],['color',colors]])geometry.setAttribute(name,new T.BufferAttribute(array,3).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
 function rebuild(fluid,{focus=null,maxDistance=85,floorAt=()=>-Infinity}={}){
  cells.clear();faces=clipped=0;const size=B.cellSize,d=fluid.data;
  for(const i of fluid.active){const x=d.x[i],y=d.y[i],z=d.z[i];if(focus&&Math.hypot(x-focus.x,z-focus.z)>maxDistance||y-floorAt(x,z)<.14)continue;
   const radius=.105+Math.min(.035,d.density[i]*.005),ix=Math.floor(x/size),iy=Math.floor(y/size),iz=Math.floor(z/size);
   for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const cx=ix+dx,cy=iy+dy,cz=iz+dz;if(Math.hypot((cx+.5)*size-x,(cy+.5)*size-y,(cz+.5)*size-z)>radius+.035)continue;const key=cx+','+cy+','+cz;if(cells.has(key))continue;if(cells.size>=B.cells){clipped++;continue;}cells.set(key,{x:cx,y:cy,z:cz,density:d.density[i],fade:Math.min(1,(1-d.age[i]/d.life[i])*5)});}
  }
  for(const c of cells.values())for(let f=0;f<6;f++){const normal=directions[f];if(cells.has((c.x+normal[0])+','+(c.y+normal[1])+','+(c.z+normal[2])))continue;if(faces>=B.faces){clipped++;continue;}tint.setHex(c.density>3?0x3bafdf:0x76dced);const shade=.8+.2*Math.max(0,normal[1]);for(let j=0;j<6;j++){const vertex=corners[f][tri[j]],n=faces*18+j*3;positions[n]=(c.x+vertex[0])*size;positions[n+1]=(c.y+vertex[1])*size;positions[n+2]=(c.z+vertex[2])*size;normals.set(normal,n);colors[n]=tint.r*shade;colors[n+1]=tint.g*shade;colors[n+2]=tint.b*shade;}faces++;}
  geometry.setDrawRange(0,faces*6);for(const attr of Object.values(geometry.attributes)){attr.clearUpdateRanges();attr.addUpdateRange(0,faces*18);attr.needsUpdate=true;}return faces;
 }
 return{geometry,rebuild,stats:()=>({cells:cells.size,faces,clipped}),reset(){cells.clear();faces=0;geometry.setDrawRange(0,0);},dispose(){geometry.dispose();cells.clear();}};
}
