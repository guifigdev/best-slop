import * as T from 'three';

export const HOVER_COLORS=Object.freeze({ally:0x51ef86,enemy:0xff514d});

// Relationship belongs to the commander, never to the field being observed.
export function hoverRelation(unit,owner,state){
 if(!unit)return 'enemy';
 const own=state?.units?.find(candidate=>candidate.id===state?.players?.[owner])||state?.units?.find(candidate=>candidate.hero&&candidate.owner===owner);
 const owned=value=>owner!=null&&(value===owner||own&&value===own.id);
 if(owned(unit.owner)||owned(unit.summonOwner)||own&&unit.id===own.id)return 'ally';
 const summoner=unit.summoner!=null?state?.units?.find(candidate=>candidate.id===unit.summoner):null;
 if(summoner&&(owned(summoner.owner)||owned(summoner.summonOwner)))return 'ally';
 if(state?.options?.mode==='linewars'){
  if(state.options.lineTeams)return own&&unit.team===own.team?'ally':'enemy';
  if(owned(unit.lineAttacker)||owned(summoner?.lineAttacker))return 'ally';
  // Every other army is hostile from our perspective, including incoming creeps
  // whose simulation team is derived from the lane rather than its recruiter.
  if(unit.lineCreep||summoner?.lineCreep)return 'enemy';
 }
 return own&&unit.team!=null&&unit.team===own.team?'ally':'enemy';
}

export function createHoverHighlight({root,body,legs=[],ringGeometry}){
 const sources=[];body.traverse(mesh=>{if(mesh.isMesh)sources.push(mesh);});sources.push(...legs);
 const material=new T.MeshBasicMaterial({color:HOVER_COLORS.enemy,side:T.BackSide,depthTest:true,depthWrite:false,toneMapped:false});
 material.userData.hoverOutline=true;
 // Expand vertices along their face normals: a silhouette around the actual
 // baked animal, with the same transforms and geometry as its animated parts.
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * 0.055;');};
 material.customProgramCacheKey=()=> 'animal-hover-outline-v1';
 const outlines=sources.map(source=>{const mesh=new T.Mesh(source.geometry,material);mesh.userData.hoverOutline=true;mesh.visible=false;mesh.renderOrder=2;source.add(mesh);return mesh;});
 const ringMaterial=new T.MeshBasicMaterial({color:HOVER_COLORS.enemy,transparent:true,opacity:.95,side:T.DoubleSide,depthTest:true,depthWrite:false,toneMapped:false});
 const ownedGeometry=!ringGeometry,geometry=ringGeometry||new T.RingGeometry(.85,1,40),ring=new T.Mesh(geometry,ringMaterial);ring.rotation.x=-Math.PI/2;ring.scale.setScalar(1.22);ring.position.y=.245;ring.visible=false;root.add(ring);
 let disposed=false;
 return{
  meshes:sources,
  update({visible=false,relation='enemy',groundY=.245}={}){if(disposed)return;const color=HOVER_COLORS[relation]??HOVER_COLORS.enemy;material.color.setHex(color);ringMaterial.color.setHex(color);ring.position.y=groundY;ring.visible=visible;for(const outline of outlines)outline.visible=visible;},
  dispose(){if(disposed)return;disposed=true;for(const outline of outlines)outline.removeFromParent();ring.removeFromParent();material.dispose();ringMaterial.dispose();if(ownedGeometry)geometry.dispose();}
 };
}
