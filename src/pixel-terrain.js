import * as T from 'three';
import {MOLTEN_LAVA_GLSL} from './lava-material.js';

// Eight hand-drawn pixel materials, two seeded variations each, one small atlas.
// Lava is a ninth procedural surface: dark crust and emissive molten seams.
// Surface detail uses the existing ground draw: no extra cubes or overlay pass.
export const PIXEL_TERRAIN_SURFACES=Object.freeze(['stone','basalt','ice','runic','slate','grass','sand','earth','lava']);
export const PIXEL_TERRAIN_BUDGET=Object.freeze({atlasSize:128,tileSize:32,extraDrawCalls:0,extraTriangles:0,textureBytesWithMipmaps:87380});
export function pixelTerrainAtlas(){
 const size=128,tile=32,data=new Uint8Array(size*size*4);
 for(let index=0;index<16;index++){
  const kind=Math.floor(index/2),variant=index%2,ox=index%4*tile,oy=Math.floor(index/4)*tile;let seed=7351+kind*471+variant*973;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const pixel=(x,y,c)=>{x=(x+tile)%tile;y=(y+tile)%tile;const p=((oy+y)*size+ox+x)*4;data[p]=c[0];data[p+1]=c[1];data[p+2]=c[2];data[p+3]=255;};
  const gray=v=>[v,v,v],rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)pixel(x+i,y+j,c);};
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){const v=kind===5?218:kind===6?230:kind===7?215:226;pixel(x,y,gray(v+Math.floor(random()*5)));}
  if(kind===0||kind===3){
   const rows=3,height=11;
   for(let row=0;row<rows;row++){let x=(row%2)*-6;while(x<32){const width=kind===2?12+Math.floor(random()*6):7+Math.floor(random()*7),y=row*height+(variant&&row===1?1:0),tone=211+Math.floor(random()*24);rect(x,y,width-1,height-1,gray(tone));rect(x,y,width-1,1,gray(Math.min(251,tone+17)));rect(x,y+height-2,width-1,1,gray(tone-19));rect(x+width-2,y+1,1,height-3,gray(tone-13));pixel(x,y,gray(184));pixel(x+width-2,y+height-2,gray(174));
    if(random()>.48){const cx=x+2+Math.floor(random()*Math.max(1,width-5));for(let n=0;n<4;n++)pixel(cx+(n>1?1:0),y+2+n,gray(kind===2?194:177));pixel(cx+2,y+5,gray(tone+10));}
    if(kind===0&&random()>.4){rect(x+1,y+height-3,3,1,[174,195,157]);pixel(x+2,y+height-4,[197,212,176]);}
    x+=width;
   }}
   if(kind===3){for(let n=0;n<5;n++){pixel(12+n,12,[188,199,183]);pixel(14,10+n,[188,199,183]);}pixel(13,11,[244,246,220]);}
  }else if(kind===1||kind===4){
   // Natural rock: irregular fracture plates, no manufactured brick rows.
   const sites=Array.from({length:kind===1?9:6},()=>[random()*32,random()*32]);
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){let first=1e4,second=1e4,nearest=0;for(let i=0;i<sites.length;i++){const dx=Math.min(Math.abs(x-sites[i][0]),32-Math.abs(x-sites[i][0])),dy=Math.min(Math.abs(y-sites[i][1]),32-Math.abs(y-sites[i][1])),d=dx*dx+dy*dy;if(d<first){second=first;first=d;nearest=i;}else second=Math.min(second,d);}const edge=Math.sqrt(second)-Math.sqrt(first),tone=kind===1?185+nearest%3*12:207+nearest%4*7;pixel(x,y,gray(edge<.8?tone-45:edge<1.6?tone+12:tone+Math.floor(random()*9)));}
   for(let n=0;n<32;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);pixel(x,y,gray(kind===1?243:247));if(n%4===0)pixel(x+1,y,gray(169));}
  }else if(kind===2){
   // A continuous frozen sheet with branching blue fractures and frost.
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){const frost=221+Math.floor(random()*17);pixel(x,y,[frost-5,frost+5,Math.min(255,frost+12)]);}
   for(let n=0;n<5;n++){let x=random()*32,y=random()*32,dx=random()>.5?1:-1,dy=random()>.5?1:-1;for(let j=0;j<17;j++){pixel(Math.floor(x),Math.floor(y),[139,175,207]);pixel(Math.floor(x)+1,Math.floor(y),[245,253,255]);if(j%5===0){pixel(Math.floor(x)-1,Math.floor(y)+1,[167,201,224]);pixel(Math.floor(x)-2,Math.floor(y)+2,[188,216,231]);}x+=dx;y+=dy*(random()>.55?1:0);if(j===8)dx*=-1;}}
   for(let n=0;n<35;n++)pixel(Math.floor(random()*32),Math.floor(random()*32),[249,254,255]);
  }else if(kind===5){
   // Organic tufts with small shadows. No seams, corner bolts or tile border.
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){const patch=Math.sin(x*.37+Math.sin(y*.25))*Math.cos(y*.31)*7,tone=210+patch+Math.floor(random()*12);pixel(x,y,[tone-4,tone+5,tone-9]);}
   for(let n=0;n<65;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32),h=2+Math.floor(random()*4);pixel(x,y,[159,178,141]);for(let j=0;j<h;j++){pixel(x+(j>2?1:0),y-j,[179+j*8,199+j*7,150+j*9]);if(j<h-1)pixel(x-1,y-j,[196,216,174]);}if(n%8===0){pixel(x+2,y-1,[241,232,181]);pixel(x+3,y-1,[249,242,199]);}}
  }else if(kind===6){
   for(let n=0;n<18;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32);rect(x,y,3+Math.floor(random()*4),1,[211,205,189]);rect(x+1,y+1,3,1,[247,242,223]);}
  }else{
   // Soil grain, scattered clods and shallow winding ruts, not paving joints.
   for(let n=0;n<90;n++){const x=Math.floor(random()*32),y=Math.floor(random()*32),tone=172+Math.floor(random()*60);pixel(x,y,[tone,tone-4,tone-12]);if(n%3===0){pixel(x+1,y,[Math.min(255,tone+24),tone+17,tone+4]);pixel(x,y+1,[tone-20,tone-22,tone-28]);}}
   for(let rut=0;rut<3;rut++){let x=random()*32,y=random()*32;for(let j=0;j<18;j++){pixel(Math.floor(x),Math.floor(y),[187,179,163]);pixel(Math.floor(x)+1,Math.floor(y),[232,222,199]);y+=1;x+=Math.sin(j*.5+rut)*.5;}}
  }
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.name='pixel-terrain-eight-surfaces';texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=1;texture.needsUpdate=true;return texture;
}
export const pixelTerrainForArena=key=>({forest:'grass',volcano:'basalt',glacier:'ice',tempest:'runic',moon:'slate'}[key]||'grass');
export const pixelTerrainForRegion=key=>({grove:'grass',payon:'earth',sands:'sand',coast:'sand',crypt:'slate',forge:'basalt',glacier:'ice',geffen:'runic'}[key]||'grass');
const nativeSurface=Object.freeze({zdtr:'earth',adrt:'earth',agrs:'grass',arck:'slate',agrd:'grass',avin:'grass',adrg:'earth',alvd:'earth',vstp:'stone',avgn:'grass',avgr:'grass',xhdg:'grass',xdrt:'earth',xwmb:'earth',cic1:'ice',dbrk:'basalt'});
export function pixelTerrainForPalette(value){const raw=String(value?.id??value??'').toLowerCase(),id=raw+' '+String(value?.name??'').toLowerCase();if(nativeSurface[raw])return nativeSurface[raw];if(/water|água/.test(id))return-1;if(/lava|magma/.test(id))return'lava';if(/ice|snow|frost|glacier|gelo|neve/.test(id))return'ice';if(/basalt|volcan|forge|fire/.test(id))return'basalt';if(/runic|aether|geffen/.test(id))return'runic';if(/stonepath|stone|pav|plaza|cavern|pedra|calçamento/.test(id))return'stone';if(/slate|crypt|rock|cliff|omni|rocha/.test(id))return'slate';if(/sand|coast|areia/.test(id))return'sand';if(/dirt|earth|path|leaves|terra|folhas/.test(id))return'earth';if(/grass|forest|grove|vines|relva|grama|vegetação/.test(id))return'grass';if(typeof value?.color==='string'){const c=new T.Color(value.color);if(c.g>c.r*1.07&&c.g>c.b*1.10)return'grass';}return'grass';}
export const pixelTerrainSurfaceIndex=value=>value===-1?-1:Math.max(0,PIXEL_TERRAIN_SURFACES.indexOf(value));
export function pixelTerrainInstanceKinds(geometry,capacity){let attribute=geometry.getAttribute('pixelTerrainKind');if(!attribute||attribute.count<capacity){if(attribute)geometry.dispose();attribute=new T.InstancedBufferAttribute(new Float32Array(capacity),1);geometry.setAttribute('pixelTerrainKind',attribute);}attribute.needsUpdate=true;return attribute.array;}
// Every world samples the same tiny GPU atlas; release it only after the last
// floor material is disposed. Rebuilding a map does not accumulate textures.
let sharedAtlas=null,atlasUsers=0;
function acquireAtlas(){if(!sharedAtlas)sharedAtlas=pixelTerrainAtlas();atlasUsers++;return sharedAtlas;}
function releaseAtlas(){if(--atlasUsers===0){sharedAtlas.dispose();sharedAtlas=null;}}

export function createPixelTerrainMaterial({material=new T.MeshLambertMaterial({vertexColors:true}),perVertexSurface=false,surface:initialSurface='stone'}={}){
 const texture=acquireAtlas(),surface={value:pixelTerrainSurfaceIndex(initialSurface)},clock={value:0},previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey.bind(material),previousRender=material.onBeforeRender;
 material.userData.pixelTerrain={texture,surface,perVertexSurface};

 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);shader.uniforms.pixelTerrainSurface=surface;shader.uniforms.pixelTerrainAtlas={value:texture};shader.uniforms.pixelTerrainTime=clock;
  shader.vertexShader=`varying vec3 pixelTerrainWorld;varying float pixelTerrainTop;${perVertexSurface?'attribute float pixelTerrainKind;flat varying float pixelTerrainSurfaceKind;':''}\n`+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec4 pixelTerrainPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\npixelTerrainPosition=instanceMatrix*pixelTerrainPosition;\n#endif\npixelTerrainWorld=(modelMatrix*pixelTerrainPosition).xyz;pixelTerrainTop=abs(inverseTransformDirection(transformedNormal,viewMatrix).y);${perVertexSurface?'pixelTerrainSurfaceKind=pixelTerrainKind;':''}`);
  shader.fragmentShader=`uniform sampler2D pixelTerrainAtlas;uniform float pixelTerrainSurface;uniform float pixelTerrainTime;varying vec3 pixelTerrainWorld;varying float pixelTerrainTop;${perVertexSurface?'flat varying float pixelTerrainSurfaceKind;':''}\n${MOLTEN_LAVA_GLSL}\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nvec2 pixelTerrainCell=floor(pixelTerrainWorld.xz/4.0);float pixelTerrainVariant=step(0.5,fract(dot(pixelTerrainCell,vec2(0.371,0.613))));float pixelTerrainKind=${perVertexSurface?'pixelTerrainSurfaceKind':'pixelTerrainSurface'};float pixelTerrainIndex=clamp(pixelTerrainKind,0.0,7.0)*2.0+pixelTerrainVariant;vec2 pixelTerrainTile=vec2(mod(pixelTerrainIndex,4.0),floor(pixelTerrainIndex/4.0));vec2 pixelTerrainUv=(pixelTerrainTile*32.0+1.0+fract(pixelTerrainWorld.xz/4.0)*30.0)/128.0;vec3 pixelTerrainDetail=texture2D(pixelTerrainAtlas,pixelTerrainUv).rgb*1.28;float pixelTerrainDistance=length(cameraPosition-pixelTerrainWorld);float pixelTerrainBlend=(1.0-smoothstep(38.0,95.0,pixelTerrainDistance))*smoothstep(0.45,0.8,pixelTerrainTop)*step(-0.1,pixelTerrainKind);diffuseColor.rgb*=mix(vec3(1.0),pixelTerrainDetail,pixelTerrainBlend);if(pixelTerrainKind>7.5){diffuseColor.rgb=vec3(.075);totalEmissiveRadiance+=pixelLavaColour(pixelTerrainWorld.xz,pixelTerrainTime);}`);
 };
 material.onBeforeRender=function(...args){previousRender.apply(this,args);clock.value=Math.floor(performance.now()/125)/8;};
 material.customProgramCacheKey=()=>previousKey()+'|pixel-terrain-v3|'+perVertexSurface;material.needsUpdate=true;
 let disposed=false;
 return{material,texture,setSurface(key){surface.value=pixelTerrainSurfaceIndex(key);},dispose(){if(disposed)return;disposed=true;releaseAtlas();material.dispose();}};
}
