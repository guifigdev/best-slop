import {RO_EQUIPMENT,RO_EQUIPMENT_SLOTS,roItemFitsSlot} from './ragnarok-equipment.js';

// Local equipment adaptation: Ilusión has up to three enchant positions. Cards
// remain independent. The Megabonk tome reference supplies the stat families;
// values/caps below belong to this game's economy, not to the source games.
export const RO_ENCHANT_SOURCE='https://bonk.wiki/tomes.html';
export const RO_ENCHANT_SLOT_SOURCE='https://browiki.org/wiki/Equipamentos_Ilusi%C3%B3n';
export const RO_ENCHANT_TYPES_PER_ITEM=3,RO_ENCHANT_MAX_RANK=8;
const entry=(key,name,skill,description)=>Object.freeze({key,name,skill,description});
export const RO_ENCHANTMENTS=Object.freeze(Object.fromEntries([
 entry('damage','Força destrutiva','battlecry','+12% de dano por nível enquanto esta peça estiver equipada.'),
 entry('haste','Celeridade','endurance','+9% de frequência dos ataques por nível.'),
 entry('amount','Multiplicidade','multishot','+1 projétil a cada dois níveis; também fortalece ataques orbitais.'),
 entry('area','Gigantismo','avatar','+11% de área e alcance das habilidades por nível.'),
 entry('crit','Precisão mortal','critical','+5 pontos percentuais de crítico físico por nível. O bônus pertence ao equipamento; magias não causam crítico.'),
 entry('magnet','Atração','brilliance','+28% de alcance de coleta e +6% de experiência por nível.'),
 entry('vitality','Vitalidade','lifeaura','+18 de vida máxima e +0,3 de regeneração por segundo a cada nível.'),
 entry('speed','Agilidade','sprint','+8% de movimento e -0,2 s na recarga da esquiva por nível.'),
 entry('xp','Sabedoria','brilliance','+7% de experiência de base e classe por nível.'),
 entry('luck','Sorte','critical','+2 de SOR por nível: melhora ataque, precisão, esquiva e o crítico desta peça.'),
 entry('armor','Fortificação','devotion','+2 de defesa física e mágica por nível.'),
 entry('evasion','Evasão','mirror','+2 pontos percentuais de esquiva física por nível.'),
 entry('lifesteal','Sede de sangue','vampiric','Recupera 1% do dano causado como vida por nível, sujeito ao limite de cura por golpe.'),
 entry('shield','Barreira','devotion','+20 de barreira por nível. Regenera em cinco segundos após ficar oito segundos sem sofrer dano.'),
 entry('regen','Regeneração','lifeaura','+0,4 de regeneração de vida por segundo a cada nível.'),
 entry('duration','Permanência','endurance','+10% de duração de efeitos, invocações e estados por nível; respeita os limites de cada habilidade.'),
 entry('projectileSpeed','Velocidade balística','multishot','+12% de velocidade dos projéteis por nível; o alcance permanece igual.'),
 entry('knockback','Impacto','shockwave','Empurra monstros comuns mais 0,12 m por nível a cada golpe direto. Chefes resistem ao empurrão.'),
 entry('thorns','Espinhos','thorns','Devolve 4 de dano físico por nível ao agressor próximo quando você sofre dano.'),
 entry('gold','Avareza','critical','+12% de Zeny recolhido por nível.'),
 entry('curse','Maldição','rage','Monstros causam +4% de dano e resistem a +4% do seu dano por nível; em troca, você ganha +8% de experiência.'),
 entry('chaos','Caos','mirror','Cada nível concede um bônus de combate aleatório permanente nesta peça. Não sorteia sorte, experiência, ouro, atração ou maldição.')
].map(e=>[e.key,e])));
const own=(o,k)=>!!o&&typeof k==='string'&&Object.hasOwn(o,k);
function validated(value,limit){if(value===undefined)return{};if(!value||typeof value!=='object'||Array.isArray(value))return null;const entries=Object.entries(value);if(entries.length>limit||entries.some(([key,rank])=>!own(RO_ENCHANTMENTS,key)||!Number.isInteger(rank)||rank<1||rank>RO_ENCHANT_MAX_RANK))return null;return Object.fromEntries(entries);}
export const validateRoEnchants=value=>validated(value,RO_ENCHANT_TYPES_PER_ITEM);
export const validateRoLegacyEnchants=value=>validated(value,Object.keys(RO_ENCHANTMENTS).length);
const pieces=u=>(u?.roInventory||[]).filter(item=>item&&own(RO_EQUIPMENT,item.key));
export function roEnchantedEquipment(u){const seen=new Set(),result=[];for(const slot of RO_EQUIPMENT_SLOTS){const id=u?.roEquipment?.[slot],main=pieces(u).find(item=>item.id===u?.roEquipment?.weapon);if(slot==='offhand'&&RO_EQUIPMENT[main?.key]?.hands===2)continue;const item=pieces(u).find(item=>item.id===id);if(!item||seen.has(id)||!roItemFitsSlot(u,item,slot))continue;seen.add(id);result.push({item,slot});}return result;}
const chaosPool=['damage','haste','amount','area','crit','vitality','speed','armor','evasion','lifesteal','shield','regen','duration','projectileSpeed','knockback','thorns'];
export function roChaosRolls(item){const rank=validateRoEnchants(item?.enchants)?.chaos||0;let seed=2166136261;for(const c of String(item?.id))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;return Array.from({length:rank},(_,i)=>{let value=(seed+Math.imul(i+1,2654435761))>>>0;value=Math.imul(value^(value>>>16),2246822507)>>>0;value=Math.imul(value^(value>>>13),3266489909)>>>0;return chaosPool[((value^(value>>>16))>>>0)%chaosPool.length];});}
export function roEnchantLevels(u){const levels={};for(const {item}of roEnchantedEquipment(u)){for(const [key,rank]of Object.entries(validateRoEnchants(item.enchants)||{}))levels[key]=Math.min(RO_ENCHANT_MAX_RANK,(levels[key]||0)+rank);for(const key of roChaosRolls(item))if(key)levels[key]=Math.min(RO_ENCHANT_MAX_RANK,(levels[key]||0)+1);}return levels;}
function isolateCopy(u,item){if(!(item.quantity>1))return;let n=1,id;do{id=String(item.id).slice(0,75)+':plain:'+n++;}while(pieces(u).some(i=>i.id===id));const rest={...item,id,quantity:item.quantity-1,cards:[]};delete rest.enchants;u.roInventory.push(rest);delete item.quantity;}
export function roEnchantOffers(u){roMigrateEnchants(u);const levels=roEnchantLevels(u),offers=[];for(const {item,slot}of roEnchantedEquipment(u)){const enchants=validateRoEnchants(item.enchants);if(!enchants)continue;for(const [key,d]of Object.entries(RO_ENCHANTMENTS)){const rank=enchants[key]||0;if(rank>=RO_ENCHANT_MAX_RANK||(levels[key]||0)>=RO_ENCHANT_MAX_RANK||!rank&&Object.keys(enchants).length>=RO_ENCHANT_TYPES_PER_ITEM)continue;offers.push({...d,kind:'tome',level:rank+1,itemId:item.id,itemName:RO_EQUIPMENT[item.key].name,slot});}}return offers;}
// Repair only unavailable enchant or skill cards. Other choices retain their ID,
// rank and position, and no pending level or equipment bonus is consumed here.
export function repairRoImprovementChoices(u,choices,pool,nextId){
 const enchants=roEnchantOffers(u),identity=c=>c.kind+':'+c.key,current=c=>c.kind==='tome'?enchants.some(e=>e.key===c.key&&e.itemId===c.itemId&&e.level===c.level):c.kind==='weapon'?(pool||[]).some(e=>e.kind==='weapon'&&e.key===c.key):true,kept=(choices||[]).filter(current),used=new Set(kept.map(identity));
 return (choices||[]).flatMap(choice=>{if(current(choice))return [choice];const candidate=enchants.find(e=>e.key===choice.key&&!used.has(identity(e)))||enchants.find(e=>!used.has(identity(e)))||(pool||[]).find(e=>!used.has(identity(e)));if(!candidate)return [];used.add(identity(candidate));return [{...candidate,id:nextId(),rarity:choice.rarity||'common'}];});
}

export function applyRoEnchant(u,key,itemId){const target=roEnchantedEquipment(u).find(({item})=>item.id===itemId);if(!target||!own(RO_ENCHANTMENTS,key))return false;const item=target.item,enchants=validateRoEnchants(item.enchants);if(!enchants||(enchants[key]||0)>=RO_ENCHANT_MAX_RANK||(roEnchantLevels(u)[key]||0)>=RO_ENCHANT_MAX_RANK||!enchants[key]&&Object.keys(enchants).length>=RO_ENCHANT_TYPES_PER_ITEM)return false;isolateCopy(u,item);item.enchants={...enchants,[key]:(enchants[key]||0)+1};return true;}
export function claimRoLegacyEnchant(u,key,itemId){const legacy=validateRoLegacyEnchants(u?.roLegacyEnchants);if(!legacy?.[key])return false;let spent=0;while(legacy[key]>0&&applyRoEnchant(u,key,itemId)){legacy[key]--;spent++;}if(!legacy[key])delete legacy[key];u.roLegacyEnchants=legacy;return spent>0;}
export function roMigrateEnchants(u){if(!u?.bonkBuild)return false;const old=validateRoLegacyEnchants(u.bonkBuild.tomes)||{};if(!Object.keys(old).length)return false;const legacy=validateRoLegacyEnchants(u.roLegacyEnchants)||{};for(const [key,rank]of Object.entries(old))legacy[key]=Math.max(legacy[key]||0,rank);u.bonkBuild.tomes={};u.roLegacyEnchants=legacy;
 const worn=roEnchantedEquipment(u).map(({item})=>item),all=[...worn,...pieces(u).filter(item=>!worn.includes(item))];for(const key of Object.keys(legacy)){for(const item of all){const enchants=validateRoEnchants(item.enchants);if(!enchants||!enchants[key]&&Object.keys(enchants).length>=RO_ENCHANT_TYPES_PER_ITEM)continue;const amount=Math.min(legacy[key],RO_ENCHANT_MAX_RANK-(enchants[key]||0));if(amount<=0)continue;isolateCopy(u,item);item.enchants={...enchants,[key]:(enchants[key]||0)+amount};legacy[key]-=amount;if(!legacy[key])break;}if(!legacy[key])delete legacy[key];}return true;
}
export function roEnchantSnapshot(u){return roEnchantedEquipment(u).flatMap(({item,slot})=>Object.entries(validateRoEnchants(item.enchants)||{}).map(([key,level])=>({...RO_ENCHANTMENTS[key],level,itemId:item.id,itemName:RO_EQUIPMENT[item.key].name,slot,...(key==='chaos'?{rolls:roChaosRolls(item)}:{})})));}
