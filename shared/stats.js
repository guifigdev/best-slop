import {canUseSkill} from './archetypes.js';
import {ATTRIBUTES,HEROES,itemAt,levelOf,skillAt} from './catalog.js';
import {permanentStats} from './permanent-enchants.js';
import {skillFor} from './skill-quality.js';
import {enchantAt,canEnchant,isWeapon} from './enchantments.js';
export const ATTRIBUTE_KEYS=Object.keys(ATTRIBUTES);
export function baseAttributes(type){const a=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,5]));a[HEROES[type].focus]=12;return a;}
export function recompute(u,time=0,auras={}){
 const base=HEROES[u.hero];if(!base)return;
 const a={...u.attributes},equipment={};u.enchantments={};u.wardResistances={};u.itemEffects={};for(const slot of u.inventory||[])if(slot&&itemAt(slot.key,slot.level||1)?.effect)u.itemEffects[slot.key]=Math.max(u.itemEffects[slot.key]||0,slot.level||1);for(const slot of u.inventory||[])if(slot&&canEnchant(slot.key,slot.enchantment)){if(isWeapon(slot.key))u.enchantments[slot.enchantment]=Math.max(u.enchantments[slot.enchantment]||0,slot.level||1);else{const ward=enchantAt(slot.enchantment,slot.level||1);u.wardResistances[ward.element]=Math.max(u.wardResistances[ward.element]||0,ward.resistance);}}
 for(const slot of u.inventory||[]){const item=itemAt(slot?.key,slot?.level||1);if(!item||item.consumable)continue;for(const [k,v]of Object.entries(item.attributes||{}))a[k]+=v;for(const [k,v]of Object.entries(item.stats||{}))equipment[k]=k==='critMultiplier'?Math.max(equipment[k]||0,v):(equipment[k]||0)+v;}
 const passive=key=>canUseSkill(u,key)&&levelOf(u,key)?skillFor(u,key):{};
 const fervor=auras.endurance||passive('endurance'),devotion=auras.devotion||passive('devotion'),brilliance=auras.brilliance||passive('brilliance');
 const avatar=canUseSkill(u,'avatar')&&(u.avatar||0)>time?u.avatarData||{}:{},rage=canUseSkill(u,u.rageSkill||'rage')&&(u.rageUntil||0)>time?u.rageData||{}:{};
 const oldHp=u.maxHp||base.hp,oldMana=u.maxMana||base.mana;
 for(const key of ATTRIBUTE_KEYS)a[key]+=u.tomeAttributes?.[key]||0;
 u.totalAttributes=a;
 u.maxHp=base.hp+(u.level-1)*30+a.vit*20+(equipment.hp||0)+(avatar.hp||0);
 u.hpRegenPercent=Math.floor(a.vit/10)*.001;u.hpRegen=1.5+a.vit*.03+u.maxHp*u.hpRegenPercent;
 u.maxMana=base.mana+a.int*8+(equipment.mana||0);
 u.hp=Math.max(u.alive?1:0,Math.min(u.maxHp,u.hp+u.maxHp-oldHp));
 u.mana=Math.max(0,Math.min(u.maxMana,u.mana+u.maxMana-oldMana));
 u.damage=(base.damage+(u.level-1)*2+a.str*1.2+(u.range>3?a.dex*1.5:0)+(equipment.damage||0)+(avatar.damage||0))*(1+Math.floor(a.str/10)*.05)*(1+(rage.damage||0));
 u.magicPower=1+a.int*.025;
 u.armor=base.armor+a.vit+(equipment.armor||0)+(passive('stonehide').armor||0)+(devotion.armor||0)+(avatar.armor||0);
 u.magicDefense=a.int+Math.floor(a.vit/5)+(equipment.magicDefense||0);
 u.manaRegen=2+Math.floor(a.int/6)*.8+(brilliance.manaRegen||0)+(equipment.manaRegen||0);
 u.accuracy=.85+a.dex*.005+Math.floor(a.dex/5)*.02;
 u.critChance=Math.min(.8,Math.floor(a.luk/3)*.01+(passive('critical').chance||0)+(equipment.crit||0));
 u.critMultiplier=Math.max(1.5,passive('critical').multiplier||0,equipment.critMultiplier||0);
 u.evasion=Math.min(.45,a.agi*.003+(passive('evasion').evasion||0)+(equipment.evasion||0));
 u.perfectEvasion=Math.min(.35,Math.floor(a.luk/10)*.01);
 u.attackSpeed=Math.min(3,1+a.agi*.01+Math.floor(a.agi/10)*.05+(fervor.attackSpeed||0)+(equipment.attackSpeed||0)+(rage.attackSpeed||0));
 u.speed=base.speed*(1+(fervor.moveSpeed||0)+(equipment.moveSpeed||0));
 u.lifesteal=Math.min(.8,(passive('vampiric').lifesteal||0)+(equipment.lifesteal||0));
 const rune=permanentStats(u);u.damage=(u.damage+rune.damageFlat)*Math.max(.1,1+rune.damageMultiplier);u.magicPower*=Math.max(.1,1+rune.magicPower);u.armor+=rune.armor;u.attackSpeed=Math.min(3,u.attackSpeed+rune.attackSpeed);u.speed*=Math.max(.25,1+rune.moveSpeed);u.manaRegen=Math.max(0,u.manaRegen+rune.manaRegen);u.hpRegen=Math.max(0,u.hpRegen+rune.hpRegen);u.evasion=Math.min(.45,u.evasion+rune.evasion);u.critChance=Math.min(.8,u.critChance+rune.critChance);u.lifesteal=Math.min(.8,u.lifesteal+rune.lifesteal);u.permanentDamageTaken=rune.damageTaken;
 u.attackType=base.attackType||'physical';
 u.magicAttack=(18+u.level*1.5+a.int*2+(equipment.magicAttack||equipment.matk||0))*u.magicPower;
 u.basicDamage=u.attackType==='magic'?u.magicAttack*.9:u.damage;
 u.reflect=passive('thorns').reflect||0;u.fireResist=Math.min(.9,equipment.fireResist||0);u.coldResist=Math.min(.9,equipment.coldResist||0);
}
