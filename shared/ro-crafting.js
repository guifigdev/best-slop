import {BONK_RULES} from './bonk-catalog.js';
import {RO_REFINEMENT_FACTS} from './ro-refinement-facts.js';
import {RO_EQUIPMENT,createRoEquipment,roReceiveEquipment,roBagUsage,RO_BAG_CAPACITY} from './ragnarok-equipment.js';
import {roEquipmentRequiredLevel} from './ro-equipment-requirements.js';
import {bonkFreePoint} from './bonk-level.js';
export const RO_MATERIALS=Object.freeze({
 ironOre:{name:'Minério de ferro',source:'Veios nas cavernas; Golem e Mineral',color:0xb18c72},
 coal:{name:'Carvão',source:'Veios escuros; Andre, Golem e Porcellio',color:0x454546},
 wood:{name:'Madeira resistente',source:'Salgueiro e Salgueiro Ancião',color:0x997346},
 resin:{name:'Resina de geleia',source:'Poring, Poporing e Marin',color:0xd793a4},
 sinew:{name:'Tendão resistente',source:'Lobo, Lobo do Deserto e Lunatic',color:0xcfbf95},
 essence:{name:'Essência arcana',source:'Sussurro, Esporo Venenoso e Druida Maligno',color:0x9e82bc},
 crystal:{name:'Cristal de forja',source:'Veios de cristal nas cavernas e MVPs',color:0x81bbcc}
});
const affinities={sword:['skeleton','orcwarrior','raydric'],spear:['orcwarrior','soldierskeleton','minorous'],axe:['elderwillow','orcwarrior','minorous'],mace:['golem','orcskeleton','minorous'],bow:['willow','archerskeleton','raydricarcher'],staff:['spore','elderwillow','whisper'],book:['poisonspore','whisper','elderwillow'],dagger:['wolf','orcwarrior','desertwolf'],katar:['desertwolf','whisper','raydric'],knuckle:['wolf','golem','highorc'],instrument:['willow','orcarcher','raydricarcher']};
export const RO_CRAFT_RECIPES=Object.freeze(Object.fromEntries(Object.values(RO_EQUIPMENT).filter(d=>d.slot==='weapon').map(d=>{
 const level=roEquipmentRequiredLevel(d),tier=Math.max(1,Math.min(4,RO_REFINEMENT_FACTS[d.sourceId]?.weaponLevel||1+Math.floor(level/35))),aux={bow:'sinew',staff:'essence',book:'essence',dagger:'sinew',katar:'sinew',instrument:'wood',knuckle:'resin'}[d.weaponType]||'wood',materials={ironOre:4+tier*4,[aux]:2+tier*2,...(tier>1?{coal:tier*2}:{}),...(tier>=3?{crystal:tier-2}:{})};
 return[d.key,Object.freeze({key:d.key,name:d.name,level,tier,price:40+tier*60,materials:Object.freeze(materials),monsters:Object.freeze(affinities[d.weaponType]||affinities.sword)})];
})));
export function validateRoCrafting(value){
 if(value===undefined)return{version:1,revision:0,materials:{},recipes:[]};
 if(!value||value.version!==1||!Number.isSafeInteger(value.revision)||value.revision<0||value.revision>1e9||!Array.isArray(value.recipes)||value.recipes.length>Object.keys(RO_CRAFT_RECIPES).length||!value.materials||typeof value.materials!=='object'||Array.isArray(value.materials))return null;
 const materials={};for(const [key,n]of Object.entries(value.materials)){if(!Object.hasOwn(RO_MATERIALS,key)||!Number.isSafeInteger(n)||n<0||n>999999)return null;if(n)materials[key]=n;}
 if(value.recipes.some(k=>!Object.hasOwn(RO_CRAFT_RECIPES,k))||new Set(value.recipes).size!==value.recipes.length)return null;
 return{version:1,revision:value.revision,materials,recipes:[...value.recipes]};
}
export function roCraftingState(unit){return unit.roCrafting??=(validateRoCrafting());}
export function roAddMaterial(unit,key,count=1){if(!RO_MATERIALS[key]||!Number.isSafeInteger(count)||count<=0)return false;const state=roCraftingState(unit),next=(state.materials[key]||0)+count;if(next>999999)return false;state.materials[key]=next;state.revision++;return true;}
export function roLearnRecipe(unit,key){if(!RO_CRAFT_RECIPES[key])return false;const state=roCraftingState(unit);if(state.recipes.includes(key))return false;state.recipes.push(key);state.revision++;return true;}
export function roCraftWeapon(game,unit,key){
 const recipe=RO_CRAFT_RECIPES[key],state=roCraftingState(unit);if(!recipe||!state.recipes.includes(key)||(unit.level||1)<recipe.level||unit.gold<recipe.price||roBagUsage(unit)>=RO_BAG_CAPACITY||Object.entries(recipe.materials).some(([k,n])=>(state.materials[k]||0)<n))return false;
 const item=createRoEquipment(key,'crafted:'+game.worldSeed+':'+game.id());if(!item||!roReceiveEquipment(unit,item))return false;
 unit.gold-=recipe.price;for(const [k,n]of Object.entries(recipe.materials)){state.materials[k]-=n;if(!state.materials[k])delete state.materials[k];}state.revision++;unit.roCraftResult={id:game.id(),key,name:recipe.name};game.fx?.('roCraftComplete',unit.x,unit.z,{source:unit.id,duration:.9});return true;
}
const materialMonsters={poring:'resin',poporing:'resin',marin:'resin',willow:'wood',elderwillow:'wood',woodengolem:'wood',lunatic:'sinew',wolf:'sinew',desertwolf:'sinew',golem:'ironOre',stalacticgolem:'ironOre',mineral:'ironOre',andre:'coal',porcellio:'coal',whisper:'essence',poisonspore:'essence',evildruid:'essence'};
const hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export function roCraftMonsterLoot(game,hero,enemy,{random=null,party=[hero]}={}){
 if(game.options?.bonkDebug)return null;let n=hash(game.worldSeed+':'+enemy.id+':craft');const roll=random||(()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;}),material=materialMonsters[enemy.ragnarokVisual||enemy.dungeonSpecies],result={};
 if(enemy.bonkBoss){for(const u of party)roAddMaterial(u,'crystal',2);result.material='crystal';}
 else if(material&&roll()<.18){for(const u of party)roAddMaterial(u,material,1);result.material=material;}
 const pool=Object.values(RO_CRAFT_RECIPES).filter(r=>r.level<=(enemy.level||1)+15&&!roCraftingState(hero).recipes.includes(r.key)&&(r.monsters.includes(enemy.ragnarokVisual||enemy.dungeonSpecies)||enemy.bonkBoss&&r.tier>=2));
 if(pool.length&&(enemy.bonkBoss||roll()<.0085)){const recipe=pool[Math.min(pool.length-1,Math.floor(roll()*pool.length))];if(game.bonk.pickups.length<BONK_RULES.pickupBudget&&game.bonk.pickups.filter(p=>p.type==='recipe').length<12){game.bonk.pickups.push({id:game.id(),type:'recipe',key:recipe.key,value:0,x:enemy.x,z:enemy.z,age:0});result.recipe=recipe.key;}}
 return result;
}
export function roOreNodes(map){
 if(!map?.enclosed&&!map?.tower&&!['cavern','forge'].includes(map?.biome))return[];
 const spawn=map.spawn||{x:0,z:0},nodes=[],count=map.tower?2:5;
 for(let i=0;i<count;i++){const a=(hash(map.seed+':ore:'+i)%628)/100,r=14+i*7,p=bonkFreePoint(map,{x:Math.max(-90,Math.min(90,spawn.x+Math.sin(a)*r)),z:Math.max(-90,Math.min(90,spawn.z+Math.cos(a)*r))},1.2),material=i===count-1?'crystal':i%3===1?'coal':'ironOre';if(nodes.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<5))continue;nodes.push({id:'ore:'+map.seed+':'+i,type:'oreVein',material,...p,charges:3,name:'Veio de '+RO_MATERIALS[material].name.toLowerCase(),used:false});}
 return nodes;
}
export function roStartMining(game,unit,object){
 if(!unit.alive||game.bonk.stage!=='playing'||object?.type!=='oreVein'||object.used||!(object.charges>0)||Math.hypot(object.x-unit.x,object.z-unit.z)>1.9||unit.roMining)return false;
 delete unit.roManualAim;delete unit.roCasting;unit.facing=Math.atan2(object.x-unit.x,object.z-unit.z);unit.bonkMove={dx:0,dz:0};unit.roMining={object:object.id,started:game.bonk.elapsed,finishAt:game.bonk.elapsed+1.8,hitAt:unit.hitAt};return true;
}
export function roTickMining(game,unit){
 const mining=unit.roMining;if(!mining)return;const node=game.bonk.objects.find(o=>o.id===mining.object);
 if(!unit.alive||!node||node.used||node.charges<=0||unit.hitAt!==mining.hitAt||Math.hypot(unit.x-node.x,unit.z-node.z)>3.2||Math.hypot(unit.bonkMove?.dx||0,unit.bonkMove?.dz||0)>.01){delete unit.roMining;return;}
 if(game.bonk.elapsed<mining.finishAt)return;delete unit.roMining;
 if(roAddMaterial(unit,node.material,node.material==='crystal'?1:3)){node.charges--;if(!node.charges){node.used=true;node.respawnAt=game.bonk.elapsed+120;}unit.roGatherResult={id:game.id(),key:node.material,count:node.material==='crystal'?1:3};game.fx?.('roOreChips',node.x,node.z,{source:unit.id,material:node.material,duration:.55});}
}
