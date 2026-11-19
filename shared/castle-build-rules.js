import {CASTLE_BUILDINGS,CASTLE_UNITS} from './castle-catalog.js';
import {castleBuildPlacement} from './castle-map.js';
export const CASTLE_BUILDING_LIMIT=12;
const effects=new Set(['tower','income','heal','damage','kill','stun']);
const deny=(code,reason,definition=null)=>({allowed:false,code,reason,definition,point:null});
export function castleBuildAvailability(state,hero,key){
 const cf=state?.castleFight,p=cf?.players?.[hero?.owner],definition=typeof key==='string'&&Object.hasOwn(CASTLE_BUILDINGS,key)?CASTLE_BUILDINGS[key]:null;
 if(!cf||state.phase!=='wave'||cf.finished||!hero?.alive||!hero.castleBuilder||!p)return deny('phase','Comece a partida para construir.',definition);
 if(!definition)return deny('building','Construção desconhecida.');
 if(definition.playable===false||!(typeof definition.unit==='string'?CASTLE_UNITS[definition.unit]:definition.unit)&&!effects.has(definition.castleEffect?.type))return deny('unsupported','Indisponível nesta versão.',definition);
 if(definition.race!==p.race)return deny('race','Esta construção pertence a outra raça.',definition);
 if(definition.requiresBuilding)return deny('upgrade','Selecione a construção anterior para evoluí-la.',definition);
 const owned=cf.buildings.filter(b=>b.alive&&b.owner===hero.owner);
 if(owned.length>=CASTLE_BUILDING_LIMIT)return deny('limit',`Limite de ${CASTLE_BUILDING_LIMIT} construções atingido.`,definition);
 if(definition.legendary&&owned.filter(b=>CASTLE_BUILDINGS[b.pendingUpgrade||b.key]?.legendary).length>=p.legendarySlots)return deny('legendary','Sem espaço para outra construção lendária.',definition);
 if(!Number.isFinite(definition.cost)||definition.cost<0)return deny('cost','Custo inválido.',definition);
 const gold=Math.ceil(Math.max(0,definition.cost-hero.gold)),wood=Math.ceil(Math.max(0,(definition.lumberCost||0)-(hero.lumber||0)));
 if(gold||wood)return deny('resources',`Faltam ${[gold?gold+' de ouro':null,wood?wood+' de madeira':null].filter(Boolean).join(' e ')}.`,definition);
 return {allowed:true,code:'ready',reason:'Escolha um espaço na área verde da sua equipe.',definition,point:null};
}
export function castleBuildCheck(state,hero,key,point){
 const available=castleBuildAvailability(state,hero,key);if(!available.allowed)return available;
 const cf=state.castleFight,p=cf.players[hero.owner],placement=castleBuildPlacement(cf.map,p.team,point,available.definition.footprint||{w:3,d:3},[...cf.buildings,...(cf.obstacles||[])]);
 return {...placement,definition:available.definition};
}
