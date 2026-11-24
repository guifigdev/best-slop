import * as T from 'three';
import {arenaBoundaryRadius} from './coliseum-architecture.js';

export const COLISEUM_WEATHER=Object.freeze({
 forest:Object.freeze({kind:'rain',count:210,accents:62,colour:0xe0efdf,accent:0xc2e5d9,opacity:.64,accentOpacity:.35}),
 volcano:Object.freeze({kind:'embers',count:220,accents:86,colour:0xffbe71,accent:0xdbc8ad,opacity:.84,accentOpacity:.47}),
 glacier:Object.freeze({kind:'snow',count:390,accents:48,colour:0xffffff,accent:0xe6f3ef,opacity:.9,accentOpacity:.28}),
 tempest:Object.freeze({kind:'storm',count:360,accents:96,colour:0xd8edff,accent:0xc4e4e4,opacity:.76,accentOpacity:.42}),
 moon:Object.freeze({kind:'mist',count:48,accents:90,colour:0xc9c6dd,accent:0xe0c6f5,opacity:.13,accentOpacity:.65})
});
const fract=n=>n-Math.floor(n),seed=(index,salt)=>fract(Math.sin(index*127.1+salt*311.7)*43758.5453),wrap=(n,span)=>((n%span)+span)%span-span/2;

// Texture-free weather uses two reusable batches and samples motion at eight
// frames per second, matching the baked character and crowd poses.
export function createColiseumWeather({base}={}){
 const root=new T.Group();root.name='coliseum-weather';root.visible=false;
 const geometry=base||new T.BoxGeometry(),material=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false,toneMapped:false}),accentMaterial=material.clone(),capacity=Math.max(...Object.values(COLISEUM_WEATHER).map(w=>w.count)),accentCapacity=Math.max(...Object.values(COLISEUM_WEATHER).map(w=>w.accents)),particles=new T.InstancedMesh(geometry,material,capacity),accents=new T.InstancedMesh(geometry,accentMaterial,accentCapacity),dummy=new T.Object3D();particles.name='coliseum-weather-particles';accents.name='coliseum-weather-accents';particles.frustumCulled=accents.frustumCulled=false;particles.castShadow=accents.castShadow=false;particles.receiveShadow=accents.receiveShadow=false;particles.instanceMatrix.setUsage(T.DynamicDrawUsage);accents.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(particles,accents);let theme=null,lastFrame=-1,visible=true,disposed=false,active=true,lastClimate='';
 function put(mesh,index,x,y,z,w,h,d,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);}
 function setTheme(key){const next=Object.hasOwn(COLISEUM_WEATHER,key)?key:'forest';if(theme===next)return;theme=next;lastFrame=-1;const p=COLISEUM_WEATHER[theme];material.color.setHex(p.colour);material.opacity=p.opacity;accentMaterial.color.setHex(p.accent);accentMaterial.opacity=p.accentOpacity;material.blending=p.kind==='embers'?T.AdditiveBlending:T.NormalBlending;accentMaterial.blending=p.kind==='mist'?T.AdditiveBlending:T.NormalBlending;material.needsUpdate=accentMaterial.needsUpdate=true;particles.count=p.count;accents.count=p.accents;root.userData.theme=theme;root.userData.kind=p.kind;}
 return{
  root,setTheme,setVisible(value){visible=!!value;root.visible=visible&&theme!=null&&active;},
  update(key,time,zones=[],{climate}={}){if(disposed)return false;setTheme(key);const native=COLISEUM_WEATHER[theme],wet=['rain','storm','snow'].includes(native.kind),kind=wet&&climate?climate.kind:native.kind,strength=wet&&climate?Math.max(0,Math.min(1,climate.precipitation||0)):1,p=COLISEUM_WEATHER[({rain:'forest',storm:'tempest',snow:'glacier'})[kind]]||native;particles.count=wet?Math.round(p.count*strength):p.count;accents.count=wet?Math.round(p.accents*strength):p.accents;active=particles.count+accents.count>0;root.visible=visible&&active;const signature=kind+':'+particles.count+':'+accents.count;const frame=Math.floor(Math.max(0,Number.isFinite(time)?time:0)*8);if(frame===lastFrame&&signature===lastClimate)return false;lastClimate=signature;lastFrame=frame;root.userData.frame=frame;const t=frame/8,lavaZones=(zones||[]).filter(z=>z.type==='lava'&&Number.isFinite(z.x)&&Number.isFinite(z.z));
   for(let i=0;i<particles.count;i++){const sx=seed(i,1),sz=seed(i,2),phase=seed(i,3),variant=seed(i,4),x=sx*64-32,z=sz*62-31;
    if(p.kind==='rain'||p.kind==='storm'){const storm=p.kind==='storm',fall=fract(t*(storm?1.42:1.03)+phase),wind=storm?3.1:.9;put(particles,i,wrap(x+t*wind,64),.3+(1-fall)*15,z,storm?.055:.038,storm?.94:.55,.035,0,0,storm?-.24:-.1);}
    else if(p.kind==='snow'){const fall=fract(t*.115+phase),size=.065+variant*.06;put(particles,i,wrap(x+t*1.5+Math.sin(t*.7+i)*1.7,64),.25+(1-fall)*15,wrap(z+Math.cos(t*.45+i)*1.3+t*.26,62),size,size*.7,size,0,Math.floor(t*2+i)*.35,0);}
    else if(p.kind==='embers'){const rise=fract(t*(.16+variant*.1)+phase),a=sx*Math.PI*2,r=arenaBoundaryRadius(Math.sin(a),Math.cos(a))+1.9+sz*5;let px=Math.sin(a)*r,pz=Math.cos(a)*r;if(lavaZones.length&&i%2===0){const zone=lavaZones[i%lavaZones.length],radius=(zone.r??zone.radius??2)*Math.sqrt(sz)*.8;px=zone.x+Math.sin(a)*radius;pz=zone.z+Math.cos(a)*radius;}const size=.045+variant*.055;put(particles,i,px+Math.sin(t+i)*rise*.7,.35+rise*(5+variant*4),pz+Math.cos(t*.6+i)*rise*.6,size,size*(1.4+variant),size,0,0,Math.floor(t*4+i)*.3);}
    else{const drift=wrap(x+t*(.7+variant*.4),64);put(particles,i,drift,.4+phase*1.7+Math.sin(t*.45+i)*.16,z,1.5+variant*2,.1+sz*.08,.38+phase*.48,0,.45+sx*.7,0);}
   }
   for(let i=0;i<accents.count;i++){const sx=seed(i,5),sz=seed(i,6),phase=seed(i,7),variant=seed(i,8),x=sx*60-30,z=sz*58-29;
    if(p.kind==='rain'||p.kind==='storm'){const cycle=fract(t*(p.kind==='storm'?1.25:.85)+phase),extent=.12+cycle*.33;put(accents,i,x,.24+Math.sin(cycle*Math.PI)*.055,z,extent,.025,extent*.22,0,Math.floor(sx*8)*Math.PI/4,0);}
    else if(p.kind==='snow'){put(accents,i,wrap(x+t*4.2,62),.35+phase*.65,z,1.1+variant,.055,.1+sz*.14,0,.2,0);}
    else if(p.kind==='embers'){const fall=fract(t*.055+phase);put(accents,i,wrap(x+t*.7,62),.3+(1-fall)*15,z,.055+variant*.035,.028,.05,0,t*.6+phase,0);}
    else{const pulse=.05+.04*(.5+.5*Math.sin(t*1.7+i));put(accents,i,x+Math.sin(t*.4+i)*.4,.7+phase*3+Math.sin(t+i)*.25,z,pulse,pulse,pulse,0,0,0);}
   }
   particles.instanceMatrix.needsUpdate=accents.instanceMatrix.needsUpdate=true;return true;
  },
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();particles.dispose();accents.dispose();material.dispose();accentMaterial.dispose();if(!base)geometry.dispose();}
 };
}
