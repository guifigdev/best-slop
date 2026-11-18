import * as T from 'three';
import {normalizeVoxelMap,mapTileAt} from '../shared/voxel-map.js';
export const TERRAIN_HEIGHT_SCALE=.35;
export const terrainHeight=(map,x,z)=>(mapTileAt(map,x,z)?.height||0)*TERRAIN_HEIGHT_SCALE+.12;
export function buildVoxelTerrain(input,{decorations=true}={}){const map=normalizeVoxelMap(input),root=new T.Group(),base=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial({vertexColors:false}),matrix=new T.Object3D(),color=new T.Color(),count=map.width*map.height,tiles=new T.InstancedMesh(base,material,count);tiles.receiveShadow=true;tiles.castShadow=true;tiles.frustumCulled=false;root.add(tiles);const props=[];
 for(let row=0;row<map.height;row++)for(let col=0;col<map.width;col++){const i=row*map.width+col,entry=map.palette[map.biomes[i]],x=map.origin.x+(col+.5)*map.tileSize,z=map.origin.z+(row+.5)*map.tileSize,top=terrainHeight(map,x,z),bottom=-1.5;matrix.position.set(x,(top+bottom)/2,z);matrix.rotation.set(0,0,0);matrix.scale.set(map.tileSize,Math.max(.05,top-bottom),map.tileSize);matrix.updateMatrix();tiles.setMatrixAt(i,matrix.matrix);color.set(entry.color).multiplyScalar(.97+((col*13+row*7)%5)*.012);tiles.setColorAt(i,color);
  if(decorations&&entry.id==='forest'&&(col+row)%2===0)props.push({x,z,top,color:0x4d6955,h:1.5+(i%3)*.3});if(decorations&&entry.id==='cliff'&&i%3===0)props.push({x,z,top,color:0x666679,h:.45+(i%3)*.2});
 }tiles.instanceMatrix.needsUpdate=true;tiles.instanceColor.needsUpdate=true;
 if(props.length){const stones=new T.InstancedMesh(base,material,props.length);stones.castShadow=true;stones.receiveShadow=true;for(const [i,p]of props.entries()){matrix.position.set(p.x,p.top+p.h/2,p.z);matrix.scale.set(map.tileSize*.8,p.h,map.tileSize*.8);matrix.updateMatrix();stones.setMatrixAt(i,matrix.matrix);stones.setColorAt(i,color.setHex(p.color));}root.add(stones);}
 root.userData.map=map;root.userData.dispose=()=>{base.dispose();material.dispose();};return root;
}
