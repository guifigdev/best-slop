import * as T from 'three';

// One opaque surface, no particles or texture fetches. Slow drift and boiling
// highlights share the same eight-frame clock as the other voxel animation.
export const MOLTEN_LAVA_FRAGMENT=`precision highp float;
varying vec3 vWorld;uniform float uTime;
float rnd(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 c=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(rnd(c),rnd(c+vec2(1.,0.)),f.x),mix(rnd(c+vec2(0.,1.)),rnd(c+1.),f.x),f.y);}
void main(){
 vec2 world=floor(vWorld.xz*5.0)/5.0;
 vec2 flow=vec2(uTime*.022,-uTime*.014),p=world*.31+flow;
 p+=vec2(noise2(p*.57+vec2(0.,uTime*.018)),noise2(p*.61+vec2(37.,-uTime*.015)))*.78;
 vec2 cell=floor(p),f=fract(p);float first=10.,second=10.;vec2 nearest=vec2(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 g=vec2(float(x),float(y)),spot=g+vec2(rnd(cell+g),rnd(cell+g+vec2(49.7,17.3)))*.8+.1;
  float d=length(spot-f);if(d<first){second=first;first=d;nearest=cell+g;}else if(d<second)second=d;
 }
 float edge=second-first,grain=noise2(world*.18+vec2(uTime*.045,0.));
 float vein=1.-smoothstep(.025,.115+grain*.035,edge);
 float pocket=(1.-smoothstep(.03,.22,first))*smoothstep(.72,.94,rnd(nearest+23.));
 float molten=max(vein,pocket*.87),pulse=.88+.12*sin(uTime*.7+noise2(p*.4)*6.28);
 vec3 rock=mix(vec3(.105,.064,.061),vec3(.235,.105,.065),noise2(world*.65));
 rock+=vec3(.11,.023,.002)*(1.-smoothstep(.08,.32,edge));
 float heat=clamp(.34+grain*.46+vein*.16,0.,1.);
 vec3 magma=mix(vec3(.78,.105,.015),vec3(1.,.65,.13),heat)*pulse;
 float bubble=pow(max(0.,sin(uTime*.9+rnd(nearest)*19.)),18.)*pocket;
 vec3 colour=mix(rock,magma,molten)+vec3(.24,.12,.025)*bubble;
 gl_FragColor=vec4(colour,1.);
}`;
export function createMoltenLavaMaterial(){return new T.ShaderMaterial({
 uniforms:{uTime:{value:0},uKind:{value:0}},toneMapped:false,
 vertexShader:'varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
 fragmentShader:MOLTEN_LAVA_FRAGMENT
});}
