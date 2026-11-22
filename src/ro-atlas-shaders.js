// Adapted from the user's atlas-in-relief.zip: antiqueMaterial.ts (modes 3, 5,
// 7) and inkOutline.ts. The existing real depth texture supplies world position
// and contours, avoiding a duplicate inverted-hull draw for every actor/tree.
export const RO_ATLAS_STYLE_INDEX=Object.freeze({pixel:0,retro:1,chartogne:2,smooth:3});
export const RO_ATLAS_GRADE_GLSL=`
uniform mat4 inverseProjection;
uniform mat4 cameraWorld;
uniform float artStyle;
vec3 atlasViewPosition(vec2 uv,float depth){vec4 p=inverseProjection*vec4(uv*2.0-1.0,depth*2.0-1.0,1.0);return p.xyz/max(p.w,0.00001);}
vec3 atlasGrade(vec3 c,vec2 uv,vec2 fc){
 if(artStyle<0.5)return c;
 float l=dot(c,vec3(0.299,0.587,0.114));
 if(artStyle<1.5){
  // Exact 2x2 ordered dither and five-level channel palette from the ZIP.
  vec2 b=mod(floor(fc/2.0),2.0);
  float d=(b.x*2.0+b.y*3.0-b.x*b.y*4.0)/4.0-0.375;
  c=mix(vec3(l),c,0.85*1.1);
  return clamp(floor(c*5.0+d+0.5)/5.0,0.0,1.0);
 }
 if(artStyle<2.5){
  vec3 paper=vec3(0.93,0.87,0.74);
  float depth=texture2D(tDepth,uv).r;
  float grain=fract(sin(dot(floor(fc),vec2(12.9898,78.233)))*43758.5453);
  if(depth>=0.99997)return paper*(0.985+grain*0.02);
  vec3 p=atlasViewPosition(uv,depth);
  vec2 dx=vec2(texelSize.x*1.15,0.0),dy=vec2(0.0,texelSize.y*1.15);
  float dr=texture2D(tDepth,uv+dx).r,dl=texture2D(tDepth,uv-dx).r,du=texture2D(tDepth,uv+dy).r,dd=texture2D(tDepth,uv-dy).r;
  vec3 vx=abs(dr-depth)<abs(dl-depth)?atlasViewPosition(uv+dx,dr)-p:p-atlasViewPosition(uv-dx,dl);
  vec3 vy=abs(du-depth)<abs(dd-depth)?atlasViewPosition(uv+dy,du)-p:p-atlasViewPosition(uv-dy,dd);
  vec3 n=cross(vx,vy);n=length(n)>0.000001?normalize(n):vec3(0.0,0.0,1.0);
  vec3 wN=normalize(mat3(cameraWorld)*n),wP=(cameraWorld*vec4(p,1.0)).xyz;
  float slope=clamp(1.0-wN.y,0.0,1.0);
  vec3 grey=vec3(l),tone=mix(grey,c,0.6);
  vec3 ink=mix(vec3(0.3,0.26,0.21),mix(grey,c,min(1.0,0.6*1.6+0.25))*0.55,0.65);
  vec3 hue=clamp(tone/max(l,0.08),0.0,1.6);
  vec3 paperTint=paper*mix(vec3(1.0),hue,0.18);
  vec3 wash=mix(tone,paperTint,0.6*0.9);
  wash*=0.975+grain*0.04;
  wash*=mix(1.0,0.8,1.0-smoothstep(0.2,0.75,l));
  vec2 dh=length(wN.xz)>0.001?normalize(wN.xz):vec2(0.7071);
  float across=mix(dot(wP.xz,vec2(-dh.y,dh.x)),(fc.x+fc.y)*0.25,step(slope,0.05));
  float dark=1.0-smoothstep(0.18,0.6,l),width=dark*0.55+smoothstep(0.25,0.75,slope)*0.18;
  float aa=fwidth(across/1.3)*1.2+0.001;
  float hatch=(1.0-smoothstep(width-aa,width+aa,abs(fract(across/1.3)-0.5)*2.0))*step(0.05,width);
  float depthEdge=max(max(abs(dr-depth),abs(dl-depth)),max(abs(du-depth),abs(dd-depth)))/max(0.00003,1.0-depth);
  float crease=smoothstep(0.45,0.95,length(fwidth(n))*1.6);
  float contour=max(crease*0.7,smoothstep(0.018,0.09,depthEdge)*0.8);
  c=mix(wash,ink,clamp(hatch*0.6+contour,0.0,0.92));
  return mix(c,paper,smoothstep(55.0,170.0,length(p))*0.95);
 }
 // Suave retains continuous Lambert lighting; no band quantization.
 c=mix(vec3(l),c,0.85);
 c*=mix(vec3(1.0),vec3(1.07,1.0,0.84),0.55);
 return mix(c,c*vec3(1.0,0.9,0.78)+vec3(0.025,0.012,0.0),0.55*0.4*(1.0-l));
}`;
