import * as T from 'three';
import {worldParticleGrid,worldParticleSeed} from './world-particle-grid.js';
import {seasonalWeather} from '../shared/seasonal-weather.js';
import {bloodyTerrainThemeAt} from '../shared/bloody-battlefield.js';
import {roHasFrozenTerrain} from '../shared/ro-ice-terrain.js';
export const VOXEL_WEATHER_BUDGET=Object.freeze({particles:96,mist:12,breath:3});
const noise=n=>{const p=Math.sin(n*12.9898+78.233)*43758.5453;return p-Math.floor(p);};
// World-local weather follows the viewed biome, including expanded battlefields.
// No real-time random calls: paused simulation time preserves every particle.
export function voxelClimateForState(state,target={x:0,z:0}){
 if(!state)return {...seasonalWeather(),kind:'none',weather:'sunny',precipitation:0,cloudCover:0,sunlight:1,rayStrength:1,source:'inactive'};
 const mode=state.options?.mode,room=state.dungeon?.map?.rooms?.find(r=>Math.abs(target.x-r.x)<=r.w/2&&Math.abs(target.z-r.z)<=r.d/2),map=mode==='bonk'?state.bonk?.map:mode==='dungeon'?state.dungeon?.map:state.voxelMap;
 let biome=String(room?.biome||state.dungeon?.biome||map?.biome||map?.habitat||state.arena||'forest').toLowerCase();
 if(['treetag','kodotag'].includes(mode))biome='forest';if(mode==='warlock')biome='forge';
 if(mode==='phasekiller')biome=state.phaseKiller?.dimension||'moon';
 if(mode==='bloody')biome=bloodyTerrainThemeAt(target.x,target.z)||'coast';
 const cold=roHasFrozenTerrain(map)||/frost|glacier|ice|snow|glacial/.test(biome),hot=/forge|volcano|fire|lava|ember/.test(biome),arid=/desert|sand|dune/.test(biome),indoor=!!map?.tower||!!room?.indoor||/cavern|crypt|catacomb|interior|void/.test(biome);
 const ambientKind=hot?'sparks':indoor&&/cavern|crypt|void/.test(biome)?'mist':'none',seed=state.worldSeed??map?.seed??state.options?.seed??state.seed??state.onlineRoom?.code??17,time=Number.isFinite(state.time)?state.time:state.bonk?.totalElapsed??state.bonk?.elapsed??state.dungeon?.elapsed??0;
 const climate=seasonalWeather({seed,time,biome,cold,hot,arid,indoor,ambientKind});
 const explicit=state.weatherOverride??state.debug?.weatherKind??state.debug?.weather??state.weather?.kind??(typeof state.weather==='string'?state.weather:null)??state.options?.weatherKind??state.options?.weather;
 const aliases={sunny:'none',clear:'none',cloudy:'none'},kind=aliases[explicit]||explicit;
 if(['none','rain','storm','snow','sparks','mist','wind'].includes(kind)){
  const wet=['rain','storm','snow'].includes(kind),cloudCover=wet?kind==='storm'?.98:.85:explicit==='cloudy'?.75:.08;
  const weather=explicit==='cloudy'?'cloudy':wet?kind:'sunny',label={cloudy:'Nublado',rain:'Chuva',storm:'Tempestade',snow:'Neve',none:'Tempo aberto',sparks:'Brasas',mist:'Névoa',wind:'Vento'}[explicit==='cloudy'?'cloudy':kind];
  return {...climate,kind,weather,precipitation:wet?1:0,cloudCover,sunlight:1-cloudCover*.78,rayStrength:wet?.03:1-cloudCover,storm:kind==='storm'?1:0,label:climate.seasonLabel+' · '+label,source:'explicit'};
 }
 return climate;
}
export const voxelWeatherForState=(state,target)=>voxelClimateForState(state,target).kind;
export function createVoxelWeather(parent,{seed=17,particles=96}={}){
 seed=Number.isFinite(seed)?seed:[...String(seed)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
 const root=new T.Group();root.name='voxel-weather';root.visible=false;parent.add(root);const geometry=new T.BoxGeometry(1,1,1),snowMaterial=new T.MeshBasicMaterial({color:0xdde9ec,transparent:true,opacity:.8,depthWrite:false}),mistMaterial=new T.MeshBasicMaterial({color:0xb6c9cd,transparent:true,opacity:.065,depthWrite:false}),breathMaterial=new T.MeshBasicMaterial({color:0xdce6e7,transparent:true,opacity:.16,depthWrite:false}),count=Math.max(1,Math.min(96,Math.floor(Number.isFinite(particles)?particles:96))),snow=new T.InstancedMesh(geometry,snowMaterial,count),mist=new T.InstancedMesh(geometry,mistMaterial,12),breath=new T.InstancedMesh(geometry,breathMaterial,3),dummy=new T.Object3D();
 for(const mesh of [snow,mist,breath]){mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;root.add(mesh);}let disposed=false;
 function put(mesh,i,x,y,z,w,h,d,angle){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,angle,angle*.2);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 return{root,update(time,{enabled=true,kind='snow',center={x:0,y:0,z:0},breath:source=null,heightAt=()=>0,wind=1,intensity=1}={}){if(disposed)return;root.visible=enabled&&Number.isFinite(time)&&kind!=='none';if(!root.visible)return;const strength=Number.isFinite(intensity)?Math.max(0,Math.min(1,intensity)):1,weatherCount=Math.round(count*strength),t=Math.floor(time*12)/12,snowing=kind==='snow',sparks=kind==='sparks',grid=worldParticleGrid(center);snow.count=snowing?weatherCount:sparks?count:0;mist.count=kind==='mist'?12:snowing?Math.round(12*strength):0;breath.count=source&&snowing?3:0;snowMaterial.color.setHex(sparks?0xf5bd79:0xdde9ec);
  const raining=kind==='rain'||kind==='storm',windy=kind==='wind',storm=kind==='storm';if(raining||windy){snow.count=raining?weatherCount:count;mist.count=raining?Math.round(12*strength):0;snowMaterial.color.setHex(windy?0xd4c6a4:0xaecbd7);snowMaterial.opacity=windy?.35:.6;}
  else snowMaterial.opacity=.8;
  snow.userData.worldParticleIds=[];mist.userData.worldParticleIds=[];
  for(let i=0;i<snow.count;i++){const cell=grid.cells[i%grid.cells.length],local=Math.floor(i/grid.cells.length),id=worldParticleSeed(seed,cell.x,cell.z,local),nx=noise(id+5),nz=noise(id+13),life=((t*(raining?storm?1.45:1.08:sparks?.15:windy?.18:.09)+noise(id))%1+1)%1,x=(cell.x+nx)*grid.cellSize+Math.sin(t*.4+id)*wind+(raining?(storm?3:1)*life:windy?life*3:0),z=(cell.z+nz)*grid.cellSize+Math.cos(t*.3+id)*wind,y=heightAt(x,z)+(windy?.3+noise(id+2)*1.2:(sparks?life:1-life)*11)+.25,size=sparks?.055:raining?.035:.055+noise(id+2)*.06;put(snow,i,x,y,z,windy?.65:size,raining?storm?.9:.65:sparks?.12:windy?.025:size,windy?.06:size,raining?(storm?-.24:-.1):t*.3+id);snow.userData.worldParticleIds.push(`weather:${seed}:${cell.x}:${cell.z}:${local}`);}
  mistMaterial.opacity=raining?.24:.065;mistMaterial.color.setHex(raining?0xaecbd7:0xb6c9cd);
  for(let i=0;i<mist.count;i++){const cell=grid.cells[i],id=worldParticleSeed(seed+31,cell.x,cell.z),x=(cell.x+noise(id))*grid.cellSize+Math.sin(t*.07+id)*2,z=(cell.z+noise(id+7))*grid.cellSize,cycle=((t*.9+noise(id))%1+1)%1;put(mist,i,x,heightAt(x,z)+(raining?.035:.28),z,raining?.1+cycle*.35:2.5+noise(id)*2.3,raining?.025:.35+noise(id+1)*.3,raining?.08+cycle*.25:1.5+noise(id+3)*2,t*.025+id);mist.userData.worldParticleIds.push(`mist:${seed}:${cell.x}:${cell.z}`);}
  for(let i=0;i<breath.count;i++){const life=(t*.4+i/3)%1;put(breath,i,source.x+Math.sin(i)*life*.2,source.y+life*.5,source.z+life*.8,.08+life*.25,.07+life*.16,.08+life*.2,i);}
  for(const mesh of [snow,mist,breath])mesh.instanceMatrix.needsUpdate=true;
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of [snow,mist,breath])mesh.dispose();geometry.dispose();snowMaterial.dispose();mistMaterial.dispose();breathMaterial.dispose();root.clear();}};
}
