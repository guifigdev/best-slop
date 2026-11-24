import * as T from 'three';
export const VOXEL_WEATHER_BUDGET=Object.freeze({particles:96,mist:12,breath:3});
const noise=n=>{const p=Math.sin(n*12.9898+78.233)*43758.5453;return p-Math.floor(p);};
// World-local weather follows the viewed biome, including expanded battlefields.
// No real-time random calls: paused simulation time preserves every particle.
export function voxelWeatherForState(state,target={x:0,z:0}){
 if(!state)return'none';const mode=state.options?.mode,room=state.dungeon?.map?.rooms?.find(r=>Math.abs(target.x-r.x)<=r.w/2&&Math.abs(target.z-r.z)<=r.d/2);
 const biome=String(room?.biome||state.dungeon?.biome||state.bonk?.map?.biome||state.bonk?.map?.habitat||state.arena||'forest');
 if(mode==='bloody')return target.z>15&&Math.abs(target.x)<target.z+12?'snow':target.x< -Math.abs(target.z)*.7?'sparks':target.x>Math.abs(target.z)*.7?'rain':'mist';
 if(mode==='phasekiller')return'rain';if(mode==='warlock')return'sparks';
 if(mode==='dungeon')return /frost/.test(biome)?'snow':/forge/.test(biome)?'sparks':/forest/.test(biome)?'mist':'mist';
 if(/frost|glacier|ice|snow/.test(biome))return'snow';if(/forge|volcano|fire|lava/.test(biome))return'sparks';if(/crypt|void|moon/.test(biome))return'mist';
 if(mode==='treetag'||mode==='kodotag')return'rain';if(/sand|coast|desert/.test(biome))return'wind';return /tempest/.test(biome)?'storm':'rain';
}
export function createVoxelWeather(parent,{seed=17,particles=96}={}){
 seed=Number.isFinite(seed)?seed:[...String(seed)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
 const root=new T.Group();root.name='voxel-weather';root.visible=false;parent.add(root);const geometry=new T.BoxGeometry(1,1,1),snowMaterial=new T.MeshBasicMaterial({color:0xdde9ec,transparent:true,opacity:.8,depthWrite:false}),mistMaterial=new T.MeshBasicMaterial({color:0xb6c9cd,transparent:true,opacity:.065,depthWrite:false}),breathMaterial=new T.MeshBasicMaterial({color:0xdce6e7,transparent:true,opacity:.16,depthWrite:false}),count=Math.max(1,Math.min(96,Math.floor(Number.isFinite(particles)?particles:96))),snow=new T.InstancedMesh(geometry,snowMaterial,count),mist=new T.InstancedMesh(geometry,mistMaterial,12),breath=new T.InstancedMesh(geometry,breathMaterial,3),dummy=new T.Object3D();
 for(const mesh of [snow,mist,breath]){mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;root.add(mesh);}let disposed=false;
 function put(mesh,i,x,y,z,w,h,d,angle){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,angle*.2);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 return{root,update(time,{enabled=true,kind='snow',center={x:0,y:0,z:0},breath:source=null,heightAt=()=>center.y||0,wind=1}={}){if(disposed)return;root.visible=enabled&&Number.isFinite(time)&&kind!=='none';if(!root.visible)return;const t=Math.floor(time*12)/12,snowing=kind==='snow',sparks=kind==='sparks';snow.count=snowing||sparks?count:0;mist.count=kind==='mist'||snowing?12:0;breath.count=source&&snowing?3:0;snowMaterial.color.setHex(sparks?0xf5bd79:0xdde9ec);
  const raining=kind==='rain'||kind==='storm',windy=kind==='wind',storm=kind==='storm';if(raining||windy){snow.count=count;mist.count=raining?12:0;snowMaterial.color.setHex(windy?0xd4c6a4:0xaecbd7);snowMaterial.opacity=windy?.35:.6;}
  else snowMaterial.opacity=.8;
  for(let i=0;i<snow.count;i++){const nx=noise(seed+i*5),nz=noise(seed+i*13),life=((t*(raining?storm?1.45:1.08:sparks?.15:windy?.18:.09)+noise(i+seed))%1+1)%1,x=center.x+(nx-.5)*44+Math.sin(t*.4+i)*wind+(raining?(storm?3:1)*life:windy?life*5:0),z=center.z+(nz-.5)*36+Math.cos(t*.3+i)*wind,y=heightAt(x,z)+(windy?.3+noise(i)*1.2:(sparks?life:1-life)*11)+.25,size=sparks?.055:raining?.035:.055+noise(i+2)*.06;put(snow,i,x,y,z,windy?.65:size,raining?storm?.9:.65:sparks?.12:windy?.025:size,windy?.06:size,raining?(storm?-.24:-.1):t*.3+i);}
  mistMaterial.opacity=raining?.24:.065;mistMaterial.color.setHex(raining?0xaecbd7:0xb6c9cd);
  for(let i=0;i<mist.count;i++){const x=center.x+(noise(i+seed*3)-.5)*37+Math.sin(t*.07+i)*2,z=center.z+(noise(i*7+seed)-.5)*30,cycle=(t*.9+noise(i))%1;put(mist,i,x,heightAt(x,z)+(raining?.035:.28),z,raining?.1+cycle*.35:2.5+noise(i)*2.3,raining?.025:.35+noise(i+1)*.3,raining?.08+cycle*.25:1.5+noise(i+3)*2,t*.025+i);}
  for(let i=0;i<breath.count;i++){const life=(t*.4+i/3)%1;put(breath,i,source.x+Math.sin(i)*life*.2,source.y+life*.5,source.z+life*.8,.08+life*.25,.07+life*.16,.08+life*.2,i);}
  for(const mesh of [snow,mist,breath])mesh.instanceMatrix.needsUpdate=true;
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of [snow,mist,breath])mesh.dispose();geometry.dispose();snowMaterial.dispose();mistMaterial.dispose();breathMaterial.dispose();root.clear();}};
}
