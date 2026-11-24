import * as T from 'three';

// One opaque surface, no particles or texture fetches. Slow drift and boiling
// highlights share the same eight-frame clock as the other voxel animation.
// Shared by actual molten planes and per-biome terrain triangles. The
// emission is generated inside the surface shader, never a dark overlay.
export const MOLTEN_LAVA_GLSL=`
float pixelLavaHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pixelLavaNoise(vec2 p){vec2 c=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(pixelLavaHash(c),pixelLavaHash(c+vec2(1.,0.)),f.x),mix(pixelLavaHash(c+vec2(0.,1.)),pixelLavaHash(c+1.),f.x),f.y);}
vec3 pixelLavaColour(vec2 worldXZ,float lavaTime){
 vec2 world=floor(worldXZ*8.0)/8.0;
 vec2 flow=vec2(lavaTime*.022,-lavaTime*.014),p=world*.31+flow;
 p+=vec2(pixelLavaNoise(p*.57+vec2(0.,lavaTime*.018)),pixelLavaNoise(p*.61+vec2(37.,-lavaTime*.015)))*.78;
 vec2 cell=floor(p),f=fract(p);float first=10.,second=10.;vec2 nearest=vec2(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 g=vec2(float(x),float(y)),spot=g+vec2(pixelLavaHash(cell+g),pixelLavaHash(cell+g+vec2(49.7,17.3)))*.8+.1;
  float d=length(spot-f);if(d<first){second=first;first=d;nearest=cell+g;}else if(d<second)second=d;
 }
 float edge=second-first,grain=pixelLavaNoise(world*.18+vec2(lavaTime*.045,0.));
 float vein=1.-smoothstep(.025,.115+grain*.035,edge);
 float pocket=(1.-smoothstep(.03,.22,first))*smoothstep(.72,.94,pixelLavaHash(nearest+23.));
 float molten=max(vein,pocket*.87),pulse=.88+.12*sin(lavaTime*.7+pixelLavaNoise(p*.4)*6.28);
 float crustPixel=pixelLavaHash(floor(worldXZ*8.0));
 vec3 rock=mix(vec3(.075,.052,.048),vec3(.205,.091,.058),pixelLavaNoise(world*.65));
 rock*=.80+crustPixel*.38;
 rock+=vec3(.11,.023,.002)*(1.-smoothstep(.08,.32,edge));
 float heat=clamp(.34+grain*.46+vein*.16,0.,1.);
 vec3 magma=mix(vec3(.85,.105,.015),vec3(1.20,.72,.13),heat)*pulse;
 float bubble=pow(max(0.,sin(lavaTime*.9+pixelLavaHash(nearest)*19.)),18.)*pocket;
 return mix(rock,magma,molten)+vec3(.24,.12,.025)*bubble;
}`;
export const MOLTEN_LAVA_FRAGMENT=`precision highp float;
varying vec3 vWorld;uniform float uTime;
${MOLTEN_LAVA_GLSL}
void main(){gl_FragColor=vec4(pixelLavaColour(vWorld.xz,uTime),1.);}`;
export function createMoltenLavaMaterial(){return new T.ShaderMaterial({
 uniforms:{uTime:{value:0},uKind:{value:0}},toneMapped:false,
 vertexShader:'varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
 fragmentShader:MOLTEN_LAVA_FRAGMENT
});}
