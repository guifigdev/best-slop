import * as T from 'three';
export const VOXEL_WEATHER_BUDGET=Object.freeze({particles:96,mist:12,breath:3});
const noise=n=>{const p=Math.sin(n*12.9898+78.233)*43758.5453;return p-Math.floor(p);};
export function createVoxelWeather(parent,{seed=17,particles=96}={}){
 seed=Number.isFinite(seed)?seed:[...String(seed)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
 const root=new T.Group();root.name='voxel-weather';root.visible=false;parent.add(root);const geometry=new T.BoxGeometry(1,1,1),snowMaterial=new T.MeshBasicMaterial({color:0xdde9ec,transparent:true,opacity:.8,depthWrite:false}),mistMaterial=new T.MeshBasicMaterial({color:0xb6c9cd,transparent:true,opacity:.065,depthWrite:false}),breathMaterial=new T.MeshBasicMaterial({color:0xdce6e7,transparent:true,opacity:.16,depthWrite:false}),count=Math.max(1,Math.min(96,Math.floor(Number.isFinite(particles)?particles:96))),snow=new T.InstancedMesh(geometry,snowMaterial,count),mist=new T.InstancedMesh(geometry,mistMaterial,12),breath=new T.InstancedMesh(geometry,breathMaterial,3),dummy=new T.Object3D();
 for(const mesh of [snow,mist,breath]){mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;root.add(mesh);}let disposed=false;
 function put(mesh,i,x,y,z,w,h,d,angle){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,angle*.2);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 return{root,update(time,{enabled=true,kind='snow',center={x:0,y:0,z:0},breath:source=null,heightAt=()=>center.y||0,wind=1}={}){if(disposed)return;root.visible=enabled&&Number.isFinite(time)&&kind!=='none';if(!root.visible)return;const t=Math.floor(time*12)/12,snowing=kind==='snow',sparks=kind==='sparks';snow.count=snowing||sparks?count:0;mist.count=kind==='mist'||snowing?12:0;breath.count=source&&snowing?3:0;snowMaterial.color.setHex(sparks?0xf5bd79:0xdde9ec);
  for(let i=0;i<snow.count;i++){const nx=noise(seed+i*5),nz=noise(seed+i*13),life=((t*(sparks?.15:.09)+noise(i+seed))%1+1)%1,x=center.x+(nx-.5)*44+Math.sin(t*.4+i)*wind,z=center.z+(nz-.5)*36+Math.cos(t*.3+i)*wind,y=heightAt(x,z)+(sparks?life:1-life)*11+.25,size=sparks?.055:.055+noise(i+2)*.06;put(snow,i,x,y,z,size,sparks?.12:size,size,t*.3+i);}
  for(let i=0;i<mist.count;i++){const x=center.x+(noise(i+seed*3)-.5)*37+Math.sin(t*.07+i)*2,z=center.z+(noise(i*7+seed)-.5)*30;put(mist,i,x,heightAt(x,z)+.28,z,2.5+noise(i)*2.3,.35+noise(i+1)*.3,1.5+noise(i+3)*2,t*.025+i);}
  for(let i=0;i<breath.count;i++){const life=(t*.4+i/3)%1;put(breath,i,source.x+Math.sin(i)*life*.2,source.y+life*.5,source.z+life*.8,.08+life*.25,.07+life*.16,.08+life*.2,i);}
  for(const mesh of [snow,mist,breath])mesh.instanceMatrix.needsUpdate=true;
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of [snow,mist,breath])mesh.dispose();geometry.dispose();snowMaterial.dispose();mistMaterial.dispose();breathMaterial.dispose();root.clear();}};
}
