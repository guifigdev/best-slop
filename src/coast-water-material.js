import * as T from 'three';
export function createCoastWaterMaterial(){return new T.ShaderMaterial({transparent:true,depthWrite:true,uniforms:{uTime:{value:0}},vertexShader:`
 varying vec3 vWorld;varying vec3 vTint;varying vec3 vNormal;
 void main(){vec4 p=vec4(position,1.0);vTint=vec3(.11,.24,.31);vNormal=normal;
 #ifdef USE_INSTANCING
  p=instanceMatrix*p;
 #endif
 #ifdef USE_INSTANCING_COLOR
  vTint=instanceColor;
 #endif
 p=modelMatrix*p;vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;
 }`,fragmentShader:`
 uniform float uTime;varying vec3 vWorld;varying vec3 vTint;varying vec3 vNormal;
 void main(){float t=floor(uTime*8.0)/8.0;
  float a=sin(vWorld.x*.43+vWorld.z*.27-t*.72),b=sin(vWorld.z*.73-vWorld.x*.19+t*.55);
  vec3 normal=normalize(vec3(a*.09,1.0,b*.075)),eye=normalize(cameraPosition-vWorld);
  float fresnel=pow(1.0-clamp(dot(normal,eye),0.0,1.0),3.0);
  float shine=pow(max(0.0,dot(reflect(normalize(vec3(.4,-.8,-.35)),normal),eye)),50.0);
  float crest=smoothstep(.86,.99,a*.48+b*.48);
  vec3 base=vTint*(.94+a*.04+b*.035),reflection=vec3(.41,.57,.63);
  vec3 color=mix(base,reflection,fresnel*.6)+shine*.25+crest*vec3(.08,.12,.13);
  gl_FragColor=vec4(color,.97);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}
