import {ATTRIBUTES,HEROES,ITEMS,levelOf,skillAt} from './catalog.js';
export const ATTRIBUTE_KEYS=Object.keys(ATTRIBUTES);
export function baseAttributes(type){const a=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,5]));a[HEROES[type].focus]=12;return a;}
export function recompute(u,time=0,auras={}){
 const base=HEROES[u.hero];if(!base)return;
 const a={...u.attributes},equipment={};
 for(const slot of u.inventory||[]){const item=ITEMS[slot?.key];if(!item||item.consumable)continue;for(const [k,v]of Object.entries(item.attributes||{}))a[k]+=v;for(const [k,v]of Object.entries(item.stats||{}))equipment[k]=(equipment[k]||0)+v;}
 const passive=key=>levelOf(u,key)?skillAt(key,levelOf(u,key)):{};
 const fervor=auras.endurance||passive('endurance'),devotion=auras.devotion||passive('devotion'),brilliance=auras.brilliance||passive('brilliance');
 const avatar=(u.avatar||0)>time?u.avatarData||{}:{};
 const oldHp=u.maxHp||base.hp,oldMana=u.maxMana||base.mana;
 u.totalAttributes=a;
 u.maxHp=base.hp+(u.level-1)*30+a.vit*20+(equipment.hp||0)+(avatar.hp||0);
 u.maxMana=base.mana+a.int*8+(equipment.mana||0);
 u.hp=Math.max(u.alive?1:0,Math.min(u.maxHp,u.hp+u.maxHp-oldHp));
 u.mana=Math.max(0,Math.min(u.maxMana,u.mana+u.maxMana-oldMana));
 u.damage=(base.damage+(u.level-1)*2+a.str*1.2+(u.range>3?a.dex*1.5:0)+(equipment.damage||0)+(avatar.damage||0))*(1+Math.floor(a.str/10)*.05);
 u.magicPower=1+a.int*.025;
 u.armor=base.armor+Math.floor(a.vit/5)+(equipment.armor||0)+(devotion.armor||0)+(avatar.armor||0);
 u.manaRegen=2+Math.floor(a.int/6)*.8+(brilliance.manaRegen||0)+(equipment.manaRegen||0);
 u.accuracy=.85+a.dex*.005+Math.floor(a.dex/5)*.02;
 u.critChance=Math.min(.8,Math.floor(a.luk/3)*.01+(passive('critical').chance||0)+(equipment.crit||0));
 u.critMultiplier=Math.max(1.5,passive('critical').multiplier||0,equipment.critMultiplier||0);
 u.evasion=Math.min(.45,a.luk*.001+(passive('evasion').evasion||0)+(equipment.evasion||0));
 u.attackSpeed=Math.min(3,1+a.agi*.01+Math.floor(a.agi/10)*.05+(fervor.attackSpeed||0)+(equipment.attackSpeed||0));
 u.speed=base.speed*(1+(fervor.moveSpeed||0)+(equipment.moveSpeed||0));
 u.lifesteal=Math.min(.8,(u.range<3?passive('vampiric').lifesteal||0:0)+(equipment.lifesteal||0));
 u.reflect=passive('thorns').reflect||0;u.fireResist=equipment.fireResist||0;u.coldResist=equipment.coldResist||0;
}
