const entries={
 common:{id:'common',name:'Comum',color:'#c5d2bd',weight:60,essence:1,xp:40,mastery:1,quality:1},
 rare:{id:'rare',name:'Raro',color:'#87bce9',weight:25,essence:2,xp:70,mastery:1.05,quality:1.05},
 epic:{id:'epic',name:'Épico',color:'#bd9de0',weight:10,essence:3,xp:110,mastery:1.1,quality:1.1},
 legendary:{id:'legendary',name:'Lendário',color:'#e8bd67',weight:4,essence:5,xp:180,mastery:1.15,quality:1.15},
 heroic:{id:'heroic',name:'Heroico',color:'#ee9183',weight:1,essence:8,xp:280,mastery:1.2,quality:1.2}
};
export const LOOT_RARITIES=Object.freeze(Object.fromEntries(Object.entries(entries).map(([key,value])=>[key,Object.freeze(value)])));
const keys=Object.keys(LOOT_RARITIES);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const round=value=>Number(value.toFixed(4));
const waveOf=context=>clamp(Number.isFinite(context.wave)?Math.floor(context.wave):1,1,50);
const bossOf=context=>context.boss===true||context.boss==='boss'?'boss':context.boss==='miniboss'?'miniboss':'normal';

export function rarityWeights(context={}){
 const progress=(waveOf(context)-1)/49,type=bossOf(context),curves={
  normal:[[60,25,10,4,1],[50,29,14,5,2]],
  miniboss:[[30,35,22,10,3],[20,36,26,13,5]],
  boss:[[15,30,30,18,7],[8,25,32,24,11]]
 },[start,end]=curves[type];
 return Object.fromEntries(keys.map((key,i)=>[key,round(start[i]+(end[i]-start[i])*progress)]));
}

export function rarityRoll(random,context={}){
 const value=typeof random==='function'?random():random,r=clamp(Number.isFinite(value)?value:.5,0,.999999999),weights=rarityWeights(context),total=Object.values(weights).reduce((sum,weight)=>sum+weight,0);let threshold=r*total;
 for(const key of keys){threshold-=weights[key];if(threshold<0)return key;}
 return keys.at(-1);
}

export function lootDropChance(context={}){
 const type=bossOf(context),wave=waveOf(context);
 return type==='boss'?1:round(type==='miniboss'?.45+.003*wave:.12+.001*wave);
}

export const rarityMastery=rarity=>LOOT_RARITIES[Object.hasOwn(LOOT_RARITIES,rarity)?rarity:'common'].mastery;
