import * as T from 'three';
import {LINE_UNITS} from '../shared/line-units.js';
import {armyPortrait} from './army-art.js';
import {buildVoxelTerrain,terrainHeight} from './voxel-terrain.js';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const recipeFor=key=>Object.hasOwn(LINE_UNITS,key)?LINE_UNITS[key]:null;
const decimal=value=>finite(value).toLocaleString('pt-BR',{maximumFractionDigits:1});

export function createLineWarView({scene,voxel,bake,overlay,onSend=()=>{}}){
 const root=new T.Group(),props=new T.Group(),housesRoot=new T.Group();root.name='line-war-field';root.add(props,housesRoot);scene.add(root);
 const labels=document.createElement('div');labels.className='line-context-labels';Object.assign(labels.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'6'});(overlay.parentElement||overlay).append(labels);
 const label=document.createElement('button');label.type='button';label.className='line-label line-context-label';label.hidden=true;Object.assign(label.style,{position:'absolute',pointerEvents:'auto',display:'none'});labels.append(label);
 const tooltip=document.createElement('div');tooltip.className='army-tooltip line-context-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');Object.assign(tooltip.style,{position:'absolute',pointerEvents:'auto',display:'none'});labels.append(tooltip);
 const ringGeometry=new T.RingGeometry(1.35,1.5,32),ringMaterial=new T.MeshBasicMaterial({color:0xf0d494,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),selectedRing=new T.Mesh(ringGeometry,ringMaterial);selectedRing.rotation.x=-Math.PI/2;selectedRing.visible=false;root.add(selectedRing);
 const geometry=new Set(),houses=new Map(),projected=new T.Vector3();let terrain=null,signature='',currentMap=null,currentState=null,currentFocus=null,currentCommander=null,currentLane=null,fountain=null,active=false,enemyView=false,recruitEnabled=false,interactive=true,selectedId=null,hoveredId=null,domHovered=false,domFocused=false,hideTimer=null,disposed=false,contentId=null,activeEntry=null;
 const openPhase=()=>currentState?.phase==='preparation'||currentState?.phase==='wave';
 function hideContext(){label.hidden=true;label.style.display='none';tooltip.hidden=true;tooltip.style.display='none';activeEntry=null;}
 function clearTimer(){if(hideTimer!==null){clearTimeout(hideTimer);hideTimer=null;}}
 function keepHovered(){clearTimer();if(activeEntry)hoveredId=activeEntry.id;}
 function releaseHovered(){if(hideTimer!==null)return;hideTimer=setTimeout(()=>{hideTimer=null;if(!domHovered&&!domFocused)hoveredId=null;},200);}
 function setHovered(id){if(disposed)return;const candidate=id&&typeof id==='object'?id.id||id.building:id;if(candidate&&houses.has(candidate)){clearTimer();hoveredId=candidate;}else releaseHovered();}
 function bakeOwned(group,name){const mesh=bake(group);if(mesh){mesh.name=name;if(mesh.geometry)geometry.add(mesh.geometry);}return mesh;}
 function clearWorld(){
  clearTimer();hoveredId=null;domHovered=false;domFocused=false;contentId=null;hideContext();houses.clear();selectedRing.visible=false;
  if(terrain){terrain.removeFromParent();terrain.userData.dispose?.();terrain=null;}
  for(const part of geometry)part.dispose();geometry.clear();props.clear();housesRoot.clear();
 }
 function markerModel(point,isFountain,name){
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return;
  const stand=new T.Group();stand.position.set(point.x,terrainHeight(currentMap,point.x,point.z),point.z);props.add(stand);
  voxel(stand,0,.2,0,2.5,.4,2.5,isFountain?0x9ab6b4:0x8c879e);voxel(stand,0,.5,0,1.9,.3,1.9,isFountain?0x7ccecf:0xb7a2d8);
  for(const side of [-1,1]){voxel(stand,side*.9,1.3,0,.35,1.6,.5,0xc2bed1);voxel(stand,side*.9,2.2,0,.5,.3,.7,0xeee0b2);}
  voxel(stand,0,1.1,0,.6,.8,.6,isFountain?0xb8ece7:0xae8ad6);bakeOwned(stand,name);
 }
 function entranceModel(route,index){
  const point=route.spawn;if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return;
  const gate=new T.Group(),color=index%2?0x92b5c5:0xc5a66a;gate.position.set(point.x,terrainHeight(currentMap,point.x,point.z),point.z);props.add(gate);
  for(const side of [-1,1]){voxel(gate,side*1.1,.9,0,.4,1.8,.55,0x8b968b);voxel(gate,side*1.1,1.95,0,.6,.3,.7,0xbcc6b0);}
  voxel(gate,0,2.2,0,2.9,.25,.7,color);voxel(gate,0,1.84,0,.25,.47,.18,0xe5d5a0);bakeOwned(gate,'line-route-entrance-'+index);
 }
 function buildHouse(building,index){
  const recipe=recipeFor(building.unitKey);if(!recipe||!Number.isFinite(building.x)||!Number.isFinite(building.z))return;
  const house=new T.Group(),color=[0x789ac9,0xb57757,0x919e6d,0x8f79ae][Math.floor(index/4)%4];house.position.set(building.x,terrainHeight(currentMap,building.x,building.z),building.z);house.userData.recruitBuildingId=building.id;housesRoot.add(house);
  voxel(house,0,.4,0,1.7,.8,1.7,0xbbaa91);voxel(house,0,1,0,2.1,.4,2,color);voxel(house,0,1.3,0,1.4,.25,1.5,color);voxel(house,0,.4,.87,.5,.6,.05,0x4d6550);voxel(house,0,.83,.94,.7,.13,.09,0xd7c28b);
  if(recipe.flying){voxel(house,-.53,1.54,0,.7,.12,.45,0xd5e1d2);voxel(house,.53,1.54,0,.7,.12,.45,0xd5e1d2);}else if(recipe.range>=4){voxel(house,.8,1.13,.3,.09,.9,.09,0xe0d5b0);voxel(house,.8,1.62,.3,.18,.16,.15,0xadc8c5);}else if(recipe.armor>=3)voxel(house,0,.51,.95,.39,.45,.08,0x98b3aa);
  bakeOwned(house,'line-house-'+building.id);houses.set(building.id,{id:building.id,building,recipe,house});
 }
 function fillContext(entry){
  if(contentId===entry.id)return;contentId=entry.id;
  const r=entry.recipe;
  label.innerHTML=armyPortrait(r.kind)+`<span><b>${escapeHTML(r.name)}</b><small>◆ ${r.cost} · renda +${r.income}</small></span>`;
  tooltip.innerHTML=armyPortrait(r.kind)+`<b>${escapeHTML(r.name)}</b><p>${escapeHTML(r.role)}</p><p>◆ ${r.cost} · renda +${r.income}<br>Vida ${r.hp} · ATQ ${r.damage} · Armadura ${r.armor}<br>Velocidade ${decimal(r.speed)} · Alcance ${decimal(r.range)}<br>${r.flying?'Voador':'Terrestre'} · Portal −${r.lifeDamage}</p><small>Selecione a casinha para abrir a ficha. A tropa só entra na fila quando você confirmar.</small>`;
  label.setAttribute('aria-label',r.name+', '+r.cost+' ouro, renda mais '+r.income+'. Abrir ficha de recrutamento neste campo inimigo.');
 }
 label.onpointerdown=e=>e.stopPropagation();label.onclick=e=>{e.preventDefault();e.stopPropagation();if(recruitEnabled&&activeEntry)onSend({building:activeEntry.id,unitKey:activeEntry.building.unitKey,target:currentFocus});};
 label.onpointerenter=()=>{domHovered=true;keepHovered();};label.onpointerleave=()=>{domHovered=false;releaseHovered();};
 label.onfocus=()=>{domFocused=true;keepHovered();};label.onblur=()=>{domFocused=false;releaseHovered();};
 tooltip.onpointerenter=()=>{domHovered=true;keepHovered();};tooltip.onpointerleave=()=>{domHovered=false;releaseHovered();};
 return{
  setHovered,
  pickRay(raycaster){if(disposed||!active||!enemyView||!interactive)return null;const hit=raycaster.intersectObjects([...houses.values()].map(e=>e.house),true)[0];let object=hit?.object;while(object){if(object.userData.recruitBuildingId)return object.userData.recruitBuildingId;object=object.parent;}return null;},
  pick(point){if(disposed||!active||!enemyView||!interactive||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return null;return [...houses.values()].map(entry=>({id:entry.id,d:Math.hypot(entry.building.x-point.x,entry.building.z-point.z)})).filter(entry=>entry.d<1.45).sort((a,b)=>a.d-b.d)[0]?.id||null;},
  pickFountain(point){if(disposed||!active||enemyView||!fountain||!openPhase()||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return null;return Math.hypot(fountain.x-point.x,fountain.z-point.z)<2?'fountain':null;},
  update(state,camera,container,focusOwner,{interactive:allowInteraction=true,selected=null,commanderId=focusOwner}={}){
   if(disposed)return;currentState=state;currentFocus=focusOwner;currentCommander=commanderId;interactive=!!allowInteraction;active=state?.options?.mode==='linewars'&&!!state.voxelMap;root.visible=active;labels.hidden=!active;
   if(!active){if(signature){clearWorld();signature='';}return;}
   currentMap=state.voxelMap;enemyView=focusOwner!==commanderId;currentLane=state.lineWars?.lanes?.find(lane=>lane.owner===focusOwner)||null;
   const commanderLane=state.lineWars?.lanes?.find(lane=>lane.owner===commanderId);recruitEnabled=enemyView&&interactive&&state.phase==='wave'&&currentLane?.alive!==false&&commanderLane?.alive!==false;
   const available=(state.lineWars?.buildings||[]).filter(building=>building.owner===focusOwner),visibleBuildings=enemyView?available:[];
   fountain=currentLane?.fountain||currentMap.markers?.fountain||null;const portal=currentLane?.portal||currentMap.markers?.portal,routes=currentLane?.routes||currentMap.markers?.routes||[];
   const nextSignature=[focusOwner,commanderId,enemyView,currentMap.id,currentMap.name,currentMap.width,currentMap.height,currentMap.seed,currentMap.tileSize,currentMap.origin?.x,currentMap.origin?.z,fountain?.x,fountain?.z,portal?.x,portal?.z,visibleBuildings.map(b=>b.id+','+b.x+','+b.z+','+b.unitKey).join(';')].join('|');
   if(nextSignature!==signature){signature=nextSignature;clearWorld();terrain=buildVoxelTerrain(currentMap);root.add(terrain);markerModel(fountain,true,'line-fountain');markerModel(portal,false,'line-portal');for(const [i,route]of routes.entries())entranceModel(route,i);visibleBuildings.forEach(buildHouse);}
   else for(const building of visibleBuildings){const entry=houses.get(building.id);if(entry)entry.building=building;}
   selectedId=selected&&typeof selected==='object'?selected.id||selected.building:selected;if(!houses.has(selectedId))selectedId=null;
   const highlighted=houses.get(selectedId||hoveredId);selectedRing.visible=!!highlighted&&enemyView;if(highlighted){selectedRing.position.set(highlighted.building.x,terrainHeight(currentMap,highlighted.building.x,highlighted.building.z)+.06,highlighted.building.z);ringMaterial.color.setHex(selectedId?0xf0d494:0xb6d9db);}
   const id=hoveredId||selectedId,entry=houses.get(id);if(!entry||!enemyView){hideContext();return;}
   activeEntry=entry;fillContext(entry);projected.set(entry.building.x,terrainHeight(currentMap,entry.building.x,entry.building.z)+1.85,entry.building.z).project(camera);
   if(projected.z< -1||projected.z>1||Math.abs(projected.x)>1.15||Math.abs(projected.y)>1.15){hideContext();return;}
   const width=container.clientWidth,height=container.clientHeight,px=(projected.x*.5+.5)*width,py=(-projected.y*.5+.5)*height,labelX=clamp(px,65,Math.max(65,width-65)),labelY=clamp(py-8,42,Math.max(42,height-12));
   label.hidden=false;label.style.display='flex';label.style.left=labelX+'px';label.style.top=labelY+'px';label.tabIndex=interactive?0:-1;label.setAttribute('aria-disabled',String(!recruitEnabled));label.classList.toggle('selected',entry.id===selectedId);
   tooltip.hidden=false;tooltip.style.display='block';const tooltipWidth=Math.min(235,Math.max(160,width-20)),tooltipHeight=255,spaceRight=width-labelX>tooltipWidth+20,spaceLeft=labelX>tooltipWidth+20;
   let tooltipX=spaceRight?labelX+15:spaceLeft?labelX-tooltipWidth-15:labelX-tooltipWidth/2,tooltipY=(spaceRight||spaceLeft)?labelY-70:labelY-tooltipHeight-48;if(tooltipY<8)tooltipY=labelY+14;
   tooltip.style.width=tooltipWidth+'px';tooltip.style.left=clamp(tooltipX,8,Math.max(8,width-tooltipWidth-8))+'px';tooltip.style.top=clamp(tooltipY,8,Math.max(8,height-tooltipHeight-8))+'px';
   tooltip.classList.toggle('recruit-disabled',!recruitEnabled);
  },
  dispose(){if(disposed)return;disposed=true;clearWorld();ringGeometry.dispose();ringMaterial.dispose();root.removeFromParent();labels.remove();}
 };
}
