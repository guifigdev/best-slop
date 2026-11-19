import {PHASE_KILLER_MAP} from '../shared/phase-killer-catalog.js';
import {castlePoint} from '../shared/castle-map.js';
import {LOOT_RARITIES} from '../shared/rarity.js';
import {blocked,limitPoint,moveUnit} from '../shared/field.js';
import {unitBlocked,unitRadius} from '../shared/unit-collision.js';
import {mapTileAt} from '../shared/voxel-map.js';

export const PREVIEW_RANGES=Object.freeze({ground:14,unit:12,chain:6,bounce:5,cleave:2.8,multishot:10,aura:9});
export const lootRarityVisual=rarity=>LOOT_RARITIES[Object.hasOwn(LOOT_RARITIES,rarity)?rarity:'common'];
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const circle=(p,radius,role='effect')=>({type:'circle',x:p.x,z:p.z,radius,role});
const rect=(p,width,depth,angle=0,role='effect')=>({type:'rect',x:p.x,z:p.z,width,depth,angle,role});
const terrainBlocked=(map,u,p,r=0,from=u)=>{if(!map)return false;if(u.flying)return !mapTileAt(map,p.x,p.z);const here=mapTileAt(map,from.x,from.z);return [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.7,r*.7],[-r*.7,r*.7],[r*.7,-r*.7],[-r*.7,-r*.7]].some(([dx,dz])=>{const tile=mapTileAt(map,p.x+dx,p.z+dz);return !tile||!tile.walkable||here&&Math.abs(tile.height-here.height)>1.2;});};

// This builds read-only geometry descriptors. Movement previews operate on a
// temporary hero so that collision sweeps match the simulation without issuing
// commands or changing the authoritative state.
export function skillPreview({key,skill:s,hero,point,target,mode='hover',state={},origin={x:0,z:0}}={}){
 if(!s||!hero||!Number.isFinite(hero.x)||!Number.isFinite(hero.z))return null;
 const local=u=>({...u,cell:u.cell?{...u.cell,x:u.cell.x-origin.x,z:u.cell.z-origin.z}:undefined}),u=local(hero),game={...state,units:(state.units||[]).map(local),unitTerrainBlocked:(unit,p,r,from)=>terrainBlocked(state.voxelMap,unit,p,r,from)};
 const facing=finite(u.facing),forward={x:Math.sin(facing),z:Math.cos(facing)},defaultDistance=Math.min(finite(s.distance,6),8),cursor=mode==='aim'&&Number.isFinite(point?.x)&&Number.isFinite(point?.z)?point:{x:u.x+forward.x*defaultDistance,z:u.z+forward.z*defaultDistance};
 const d=distance(u,cursor),dx=d>.001?(cursor.x-u.x)/d:forward.x,dz=d>.001?(cursor.z-u.z)/d:forward.z,angle=Math.atan2(dx,dz),shapes=[],notes=[];
 const isTarget=s.target==='enemy'||s.target==='unit',isGround=s.target==='ground',passive=s.kind==='passive';
 let valid=true,reason='',anchor={...u};
 const reject=text=>{if(valid){valid=false;reason=text;}};
 const effectTarget=target?.alive?target:{x:u.x+forward.x*Math.max(1.7,Math.min(finite(u.range,1.7),8)),z:u.z+forward.z*Math.max(1.7,Math.min(finite(u.range,1.7),8))};
 if(isGround){const castRange=finite(s.castRange,PREVIEW_RANGES.ground);shapes.push(circle(u,castRange,'range'));if(d>castRange+.001){if(s.directionOnly)notes.push('Alcance '+castRange.toLocaleString('pt-BR',{maximumFractionDigits:1})+' m');else if(s.moveIntoRange)notes.push('O construtor se aproxima para conjurar');else reject('Fora do alcance de lançamento');}const nativeMap=(state.options?.mode==='phasekiller'?PHASE_KILLER_MAP[state.phaseKiller?.dimension||'normal']:null)||state.treeTag?.map||(state.warlock?{minX:-state.warlock.mapRadius,maxX:state.warlock.mapRadius,minZ:-state.warlock.mapRadius,maxZ:state.warlock.mapRadius}:null),bounded=nativeMap?{x:Math.max(nativeMap.minX,Math.min(nativeMap.maxX,cursor.x)),z:Math.max(nativeMap.minZ,Math.min(nativeMap.maxZ,cursor.z))}:state.castleFight?.map?castlePoint(state.castleFight.map,cursor):limitPoint(game,u,cursor);if(!s.directionOnly&&(!bounded||distance(cursor,bounded)>.01))reject('Fora dos limites da arena');}
 if(isTarget){shapes.push(circle(u,s.castRange??PREVIEW_RANGES.unit,'range'));anchor=mode==='aim'&&target?target:effectTarget;if(mode==='aim'&&(!target||!target.alive||target.id===u.id))reject('Escolha um alvo');if(target&&distance(u,target)>(s.castRange??PREVIEW_RANGES.unit))reject('Alvo fora do alcance');if(s.target==='enemy'&&target&&target.team===u.team)reject('Escolha um inimigo');shapes.push(circle(anchor,unitRadius(target||{})+.22,'target'));if(key==='chain'){shapes.push(circle(anchor,PREVIEW_RANGES.chain,'secondary'));notes.push('Saltos de até 6 m');}}
 if(s.previewShape==='line'){shapes.push({type:'corridor',x:u.x,z:u.z,length:finite(s.distance,finite(s.castRange,14)),radius:finite(s.radius,.35),angle,role:'effect'});}
 else if(['shockwave','forcepush','gungnir'].includes(key)){
  shapes.push({type:'corridor',x:u.x,z:u.z,length:key==='gungnir'?s.distance:12,radius:s.radius,angle,radial:true,role:'effect'});notes.push('Largura '+(s.radius*2).toLocaleString('pt-BR')+' m');
 }else if(['warlockfire','warlockfrost'].includes(key)){
  const length=finite(s.distance,14),start={x:u.x+dx*.55,z:u.z+dz*.55};shapes.push({type:'corridor',...start,length,radius:s.radius,angle,role:'effect'});notes.push('Projétil · para no primeiro impacto');
 }else if(key==='flamebreath'){
  shapes.push({type:'cone',x:u.x,z:u.z,radius:s.radius,angle,halfAngle:s.cone||.7,role:'effect'});notes.push('Cone '+Math.round((s.cone||.7)*360/Math.PI)+'° · obstáculos bloqueiam');
 }else if(['blink','dash','stormdive','hornrush'].includes(key)){
  const length=Math.min(d,s.distance),requested={x:u.x+dx*length,z:u.z+dz*length};shapes.push(circle(u,s.distance,'movement'));
  const moved={...u,x:u.x,z:u.z};if(key==='blink'){anchor=limitPoint(game,u,requested);if(blocked(anchor,game.obstacles||[])||terrainBlocked(state.voxelMap,u,anchor,unitRadius(u)))reject('Destino bloqueado');}else{moveUnit(game,moved,requested);anchor={x:moved.x,z:moved.z};}
  if(['blink','dash'].includes(key)&&unitBlocked(game,u,cursor))reject('Destino ocupado ou bloqueado');
  shapes.push({type:'corridor',x:u.x,z:u.z,length:distance(u,anchor),radius:key==='hornrush'?s.radius:.16,angle,role:key==='hornrush'?'effect':'path',start:key==='hornrush'?-.5:0,end:key==='hornrush'?.8:0});
  shapes.push(circle(anchor,key==='dash'?2.2:key==='stormdive'?s.radius:unitRadius(u),'landing'));
  notes.push('Deslocamento máximo '+s.distance.toLocaleString('pt-BR',{maximumFractionDigits:1})+' m');
 }else if(key==='icewall'){
  anchor=cursor;shapes.push(rect(cursor,s.width,.8));const wall={...cursor,w:s.width,d:.8};if(blocked(cursor,game.obstacles||[],1)||(game.units||[]).some(v=>v.alive&&blocked(v,[wall],.65)))reject('A barreira sobrepõe uma unidade ou obstáculo');if(u.cell&&(Math.abs(cursor.x-u.cell.x)+s.width/2>u.cell.r||Math.abs(cursor.z-u.cell.z)+.4>u.cell.r))reject('A barreira ultrapassa a arena');notes.push('Parede '+s.width+' × 0,8 m · alinhada ao campo');
 }else if(['doubleattack','manabreak'].includes(key)){
  anchor=effectTarget;shapes.push(circle(u,finite(u.range,1.7),'range'),circle(anchor,unitRadius(target||{})+.22,'target'));notes.push('Efeito no próximo ataque básico que causar dano');
 }else if(key==='cleave'||key==='bounce'){
  anchor=effectTarget;shapes.push(circle(u,finite(u.range,1.7),'range'));shapes.push(circle(anchor,key==='cleave'?2.8:5));notes.push(key==='cleave'?'Área ao redor do alvo atingido':'Alcance de cada ricochete');
 }else if(key==='multishot')shapes.push(circle(u,10));
 else if(['endurance','devotion','brilliance'].includes(key)){shapes.push(circle(u,9,'secondary'));notes.push('Raio de consulta das auras');}
 else if(isGround&&s.radius){anchor=cursor;shapes.push(circle(cursor,s.radius));}
 else if(s.radius)shapes.push(circle(u,s.radius));
 else if(!isTarget){shapes.push(circle(u,unitRadius(u)+.3,'target'));notes.push(s.summonKind||key==='summon'?'Invocação próxima do herói':'Efeito no próprio herói');}
 if(mode==='aim'&&!passive){if(!u.alive)reject('Herói derrotado');else if(u.stun>0)reject('Herói atordoado');else if((u.cooldowns?.[key]||0)>0)reject('Habilidade em recarga');else if(finite(u.mana)<finite(s.mana))reject('Mana insuficiente');if(state.phase&&!['wave','bonus','final'].includes(state.phase))reject('Aguarde o início do combate');}
 return{key,name:s.name||key,valid,reason,shapes,anchor,hint:[reason,...notes].filter(Boolean).join(' · '),passive};
}

// Polygon coordinates use the same world X/Z convention as simulation facing.
export function previewPolygon(shape,segments=64){
 const x=finite(shape.x),z=finite(shape.z),angle=finite(shape.angle),sin=Math.sin(angle),cos=Math.cos(angle),rotate=(side,along)=>({x:x+side*cos+along*sin,z:z-side*sin+along*cos});
 if(shape.type==='circle')return Array.from({length:segments},(_,i)=>({x:x+Math.sin(i/segments*Math.PI*2)*shape.radius,z:z+Math.cos(i/segments*Math.PI*2)*shape.radius}));
 if(shape.type==='rect')return[rotate(-shape.width/2,-shape.depth/2),rotate(shape.width/2,-shape.depth/2),rotate(shape.width/2,shape.depth/2),rotate(-shape.width/2,shape.depth/2)];
 if(shape.type==='cone')return[{x,z},...Array.from({length:33},(_,i)=>{const a=angle-shape.halfAngle+i/32*shape.halfAngle*2;return{x:x+Math.sin(a)*shape.radius,z:z+Math.cos(a)*shape.radius};})];
 if(shape.type==='corridor'){
  const width=Math.min(shape.radius,shape.length||shape.radius),start=finite(shape.start),end=finite(shape.length)+finite(shape.end);if(shape.radial){const half=Math.asin(Math.min(1,width/Math.max(.001,end)));return[rotate(-width,0),...Array.from({length:17},(_,i)=>rotate(Math.sin(-half+i/16*half*2)*end,Math.cos(-half+i/16*half*2)*end)),rotate(width,0)];}
  return[rotate(-width,start),rotate(width,start),rotate(width,end),rotate(-width,end)];
 }
 return[];
}
