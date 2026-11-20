import * as T from 'three';
export function dungeonFogGrid(map,visibility){
 const size=map.width,cells=new Uint8Array(size*size),visible=new Set(visibility?.visibleRooms||[0]),known=new Set(visibility?.discoveredRooms||[0]);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const px=(x-(map.width-1)/2)*map.tileSize,pz=(z-(map.height-1)/2)*map.tileSize;
  for(const room of map.rooms){if(Math.abs(px-room.x)<=room.w/2+map.tileSize*1.6&&Math.abs(pz-room.z)<=room.d/2+map.tileSize*1.6){if(visible.has(room.id))cells[z*size+x]=255;else if(known.has(room.id))cells[z*size+x]=Math.max(cells[z*size+x],28);}}
 }
 return{size,cells,bounds:{minX:-map.width*map.tileSize/2,maxX:map.width*map.tileSize/2,minZ:-map.height*map.tileSize/2,maxZ:map.height*map.tileSize/2}};
}
// One shared world-space texture shades terrain, instanced scenery and actors.
// It reveals no information when the camera pans into an unexplored room.
export function softenVision(vision){
 const size=vision.size,base=Uint8Array.from(vision.cells,c=>c==='2'?255:Math.round(255*(c==='1'?(vision.exploredLight??.52):(vision.unexploredLight??.27)))),out=new Uint8Array(base.length);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){let sum=0,total=0;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const xx=Math.max(0,Math.min(size-1,x+dx)),zz=Math.max(0,Math.min(size-1,z+dz)),w=(3-Math.abs(dx))*(3-Math.abs(dz));sum+=base[zz*size+xx]*w;total+=w;}out[z*size+x]=Math.round(sum/total);}
 return out;
}
export function createExplorationFog(scene){
 let texture=new T.DataTexture(new Uint8Array([255]),1,1,T.RedFormat),key=null,lastScan=-Infinity;texture.needsUpdate=true;
 const uniforms={exploreMap:{value:texture},exploreBounds:{value:new T.Vector4(-1,-1,2,2)},exploreActive:{value:0}},materials=new Map();
 function register(material){if(!material||material.isShaderMaterial||materials.has(material))return;const before=material.onBeforeCompile,cache=material.customProgramCacheKey;
  materials.set(material,{before,cache});material.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.vertexShader='varying vec2 vExploreWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 exploreVertex=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 exploreVertex=instanceMatrix*exploreVertex;
 #endif
 vExploreWorld=(modelMatrix*exploreVertex).xz;`);
  shader.fragmentShader='varying vec2 vExploreWorld;\nuniform sampler2D exploreMap;\nuniform vec4 exploreBounds;\nuniform float exploreActive;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
 vec2 exploreUv=(vExploreWorld-exploreBounds.xy)/exploreBounds.zw;
 float exploreLight=texture2D(exploreMap,clamp(exploreUv,0.0,1.0)).r;
 if(exploreUv.x<0.0||exploreUv.y<0.0||exploreUv.x>1.0||exploreUv.y>1.0)exploreLight=0.0;
 gl_FragColor.rgb*=mix(1.0,exploreLight,exploreActive);`);};material.customProgramCacheKey=()=>cache.call(material)+'|team-exploration-v1';material.needsUpdate=true;
 }
 function update(state,time=0){const mode=state?.options?.mode,vision=mode==='dungeon'?state.dungeon?.visibility:['treetag','kodotag'].includes(mode)?state.treeTag?.vision||state.kodoTag?.vision||state.explorationVision:null;uniforms.exploreActive.value=vision||mode==='dungeon'&&state.dungeon?.map?1:0;if(!uniforms.exploreActive.value)return;
  const signature=['treetag','kodotag'].includes(mode)?JSON.stringify([mode,vision?.size,vision?.bounds,vision?.cells]):JSON.stringify([state.dungeon?.map?.seed,vision?.visibleRooms,vision?.discoveredRooms]);
  if(key!==signature){key=signature;let grid;if(mode==='dungeon'&&state.dungeon?.map)grid=dungeonFogGrid(state.dungeon.map,vision);else if(vision?.cells)grid={size:vision.size,bounds:vision.bounds,cells:softenVision(vision)};
   if(grid){texture.dispose();texture=new T.DataTexture(grid.cells,grid.size,grid.size,T.RedFormat);texture.magFilter=texture.minFilter=T.LinearFilter;texture.unpackAlignment=1;texture.needsUpdate=true;uniforms.exploreMap.value=texture;const b=grid.bounds;uniforms.exploreBounds.value.set(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);}
  }
  if(time-lastScan>.2||time<lastScan){lastScan=time;scene.traverse(object=>{for(const m of Array.isArray(object.material)?object.material:[object.material])register(m);});}
 }
 return{update,uniforms,dispose(){texture.dispose();for(const [m,old]of materials){m.onBeforeCompile=old.before;m.customProgramCacheKey=old.cache;m.needsUpdate=true;}materials.clear();}};
}
