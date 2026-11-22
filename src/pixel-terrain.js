import * as T from 'three';

// Eight hand-drawn pixel materials, two seeded variations each, one small atlas.
// Surface detail uses the existing ground draw: no extra cubes or overlay pass.
export const PIXEL_TERRAIN_SURFACES=Object.freeze(['stone','basalt','ice','runic','slate','grass','sand','earth']);
export const PIXEL_TERRAIN_BUDGET=Object.freeze({atlasSize:128,tileSize:32,extraDrawCalls:0,extraTriangles:0,textureBytesWithMipmaps:87380});
export function pixelTerrainAtlas(){
 const size=128,tile=32,data=new Uint8Array(size*size*4);
 for(let index=0;index<16;index++){
  const kind=Math.floor(index/2),variant=index%2,ox=index%4*tile,oy=Math.floor(index/4)*tile;let seed=7351+kind*471+variant*973;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const pixel=(x,y,c)=>{x=(x+tile)%tile;y=(y+tile)%tile;const p=((oy+y)*size+ox+x)*4;data[p]=c[0];data[p+1]=c[1];data[p+2]=c[2];data[p+3]=255;};
  const gray=v=>[v,v,v],rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)pixel(x+i,y+j,c);};
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){const v=kind===5?218:kind===6?230:kind===7?215:226;pixel(x,y,gray(v+Math.floor(random()*5)));}
  if([0,1,2,3,4].includes(kind)){
   const rows=kind===1?4:3,height=kind===1?8:11;
   for(let row=0;row<rows;row++){let x=(row%2)*-6;while(x<32){const width=kind===2?12+Math.floor(random()*6):7+Math.floor(random()*7),y=row*height+(variant&&row===1?1:0),tone=211+Math.floor(random()*24);rect(x,y,width-1,height-1,gray(tone));rect(x,y,width-1,1,gray(Math.min(251,tone+17)));rect(x,y+height-2,width-1,1,gray(tone-19));rect(x+width-2,y+1,1,height-3,gray(tone-13));pixel(x,y,gray(184));pixel(x+width-2,y+height-2,gray(174));
    if(random()>.48){const cx=x+2+Math.floor(random()*Math.max(1,width-5));for(let n=0;n<4;n++)pixel(cx+(n>1?1:0),y+2+n,gray(kind===2?194:177));pixel(cx+2,y+5,gray(tone+10));}
    if(kind===0&&random()>.4){rect(x+1,y+height-3,3,1,[174,195,157]);pixel(x+2,y+height-4,[197,212,176]);}
    x+=width;
   }}
   if(kind===1)for(let n=0;n<9;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);rect(x,y,2,1,[186,174,164]);pixel(x+1,y+1,[243,222,192]);}
   if(kind===2)for(let n=0;n<8;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);rect(x,y,3,1,[240,252,255]);pixel(x+1,y+1,[204,230,238]);}
   if(kind===3){for(let n=0;n<5;n++){pixel(12+n,12,[188,199,183]);pixel(14,10+n,[188,199,183]);}pixel(13,11,[244,246,220]);}
  }else if(kind===5){
   for(let n=0;n<45;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32),h=2+Math.floor(random()*3);rect(x,y,2,h,[187,205,168]);pixel(x,y+h,[227,237,197]);pixel(x-1,y+1,[202,220,178]);if(n%9===0){pixel(x+2,y,[229,216,170]);pixel(x+3,y,[248,238,203]);}}
  }else if(kind===6){
   for(let n=0;n<18;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);rect(x,y,3+Math.floor(random()*4),1,[211,205,189]);rect(x+1,y+1,3,1,[247,242,223]);}
  }else{
   for(let n=0;n<38;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);rect(x,y,2,1,[181,178,166]);pixel(x,y+1,[242,237,218]);if(n%5===0){pixel(x-1,y,[191,208,167]);pixel(x-1,y+1,[224,235,194]);}}
  }
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.name='pixel-terrain-eight-surfaces';texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=1;texture.needsUpdate=true;return texture;
}
export const pixelTerrainForArena=key=>({forest:'stone',volcano:'basalt',glacier:'ice',tempest:'runic',moon:'slate'}[key]||'stone');
export const pixelTerrainForRegion=key=>({grove:'grass',payon:'earth',sands:'sand',coast:'sand',crypt:'slate',forge:'basalt',glacier:'ice',geffen:'runic'}[key]||'grass');

export function createPixelTerrainMaterial({material=new T.MeshLambertMaterial({vertexColors:true}),perVertexSurface=false}={}){
 const texture=pixelTerrainAtlas(),surface={value:0},previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey.bind(material);

 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);shader.uniforms.pixelTerrainSurface=surface;shader.uniforms.pixelTerrainAtlas={value:texture};
  shader.vertexShader=`varying vec3 pixelTerrainWorld;varying float pixelTerrainTop;${perVertexSurface?'attribute float pixelTerrainKind;varying float pixelTerrainSurfaceKind;':''}\n`+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec4 pixelTerrainPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\npixelTerrainPosition=instanceMatrix*pixelTerrainPosition;\n#endif\npixelTerrainWorld=(modelMatrix*pixelTerrainPosition).xyz;pixelTerrainTop=abs(normal.y);${perVertexSurface?'pixelTerrainSurfaceKind=pixelTerrainKind;':''}`);
  shader.fragmentShader=`uniform sampler2D pixelTerrainAtlas;uniform float pixelTerrainSurface;varying vec3 pixelTerrainWorld;varying float pixelTerrainTop;${perVertexSurface?'varying float pixelTerrainSurfaceKind;':''}\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec2 pixelTerrainCell=floor(pixelTerrainWorld.xz/4.0);float pixelTerrainVariant=step(0.5,fract(dot(pixelTerrainCell,vec2(0.371,0.613))));float pixelTerrainKind=${perVertexSurface?'pixelTerrainSurfaceKind':'pixelTerrainSurface'};float pixelTerrainIndex=max(0.0,pixelTerrainKind)*2.0+pixelTerrainVariant;vec2 pixelTerrainTile=vec2(mod(pixelTerrainIndex,4.0),floor(pixelTerrainIndex/4.0));vec2 pixelTerrainUv=(pixelTerrainTile*32.0+1.0+fract(pixelTerrainWorld.xz/4.0)*30.0)/128.0;vec3 pixelTerrainDetail=texture2D(pixelTerrainAtlas,pixelTerrainUv).rgb*1.28;float pixelTerrainDistance=length(cameraPosition-pixelTerrainWorld);float pixelTerrainBlend=(1.0-smoothstep(38.0,95.0,pixelTerrainDistance))*smoothstep(0.45,0.8,pixelTerrainTop)*step(-0.1,pixelTerrainKind);diffuseColor.rgb*=mix(vec3(1.0),pixelTerrainDetail,pixelTerrainBlend);`);
 };
 material.customProgramCacheKey=()=>previousKey()+'|pixel-terrain-v1|'+perVertexSurface;material.needsUpdate=true;
 let disposed=false;
 return{material,texture,setSurface(key){surface.value=Math.max(0,PIXEL_TERRAIN_SURFACES.indexOf(key));},dispose(){if(disposed)return;disposed=true;texture.dispose();material.dispose();}};
}
