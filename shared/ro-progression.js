import {RO_STATUS_POINT_TOTALS,RO_JOB_GROWTH} from './ro-growth-data.js';

export const roAttributeCost=value=>value>=100?16+4*Math.floor((value-100)/5):2+Math.floor(Math.max(0,value-1)/10);
export const roAttributeCap=unit=>(unit.roTier||0)>=2?130:99;
export const roAttributePointsForLevel=level=>level>1?(RO_STATUS_POINT_TOTALS[Math.min(150,level)-1]-RO_STATUS_POINT_TOTALS[Math.min(150,level)-2]):0;
export const roAttributeBudget=level=>RO_STATUS_POINT_TOTALS[Math.max(0,Math.min(149,(level||1)-1))];
export function roJobAttributeBonuses(job,jobLevel=1){const result={str:0,agi:0,vit:0,int:0,dex:0,luk:0};for(const [level,stats]of RO_JOB_GROWTH[job]?.bonuses||[])if(level<=jobLevel)for(const [key,value]of Object.entries(stats))result[key]+=value;return result;}
export function roNaturalGrowth(unit,jobs,attributes){
 const level=Math.max(1,Math.min(150,unit.level||1)),tier=Math.min(3,unit.roTier||0),lookup=field=>{
  for(let i=tier;i>=0;i--){const table=RO_JOB_GROWTH[jobs[i]]?.[field];if(!table||level<table.start)continue;const n=level-table.start;if(n<table.values.length)return table.values[n];if(i===0){const values=table.values;return values.at(-1)+(n-values.length+1)*(values.at(-1)-values.at(-2));}}
  return field==='hp'?40:11;
 };
 const a=attributes,ranged=['windhawk','troubadour'].includes(unit.roLineage),primary=ranged?a.dex:a.str,secondary=ranged?a.str:a.dex;
 return{baseHp:lookup('hp'),baseSp:lookup('sp'),statusAttack:Math.floor(primary+secondary/5+a.luk/3+level/4),statusMagicAttack:a.int+Math.floor(a.int/2)+Math.floor(a.dex/5)+Math.floor(a.luk/3)+Math.floor(level/4),hit:175+level+a.dex+Math.floor(a.luk/3),flee:100+level+a.agi+Math.floor(a.luk/5),softDefense:Math.floor((level+a.vit)/2+a.agi/5),softMagicDefense:Math.floor(a.int+level/4+(a.dex+a.vit)/5)};
}
