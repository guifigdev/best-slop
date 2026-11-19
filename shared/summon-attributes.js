const CUSTOM_HERO_MODES=new Set(['campaign','best','tower','war','linewars']);
const KEYS=['str','int','dex','luk','vit','agi'];

// A skill's rank still owns the creature's baseline. Inherited attributes are
// reapplied to that immutable baseline, before nearby auras and temporary buffs.
export function summonAttributeStats(game,unit,baseline){
 if(!unit.summon||!CUSTOM_HERO_MODES.has(game.options?.mode))return null;
 const owner=game.units.find(u=>u.id===unit.summoner&&u.hero&&!u.summon&&u.owner===unit.owner);
 if(!owner)return null;
 const a=Object.fromEntries(KEYS.map(k=>[k,Math.max(0,Number(owner.totalAttributes?.[k]??owner.attributes?.[k])||0)]));
 const hp=Math.round((baseline.hp+a.vit*20)*(1+a.vit*.01));
 return{attributes:a,attackSpeed:a.agi*.01+Math.floor(a.agi/10)*.05,base:{...baseline,
  hp,mana:baseline.mana+a.int*8,
  damage:(baseline.damage+a.str*1.2+(unit.range>3?a.dex*1.5:0))*(1+Math.floor(a.str/10)*.05),
  armor:baseline.armor+a.vit,magicDefense:(baseline.magicDefense||0)+a.int+Math.floor(a.vit/5),
  magicPower:baseline.magicPower*(1+a.int*.025),
  hpRegen:(baseline.hpRegen||0)+a.vit*.03+hp*Math.floor(a.vit/10)*.001,
  manaRegen:baseline.manaRegen+Math.floor(a.int/6)*.8,
  accuracy:baseline.accuracy+a.dex*.005+Math.floor(a.dex/5)*.02,
  evasion:Math.min(.45,baseline.evasion+a.agi*.003),critChance:Math.min(.8,baseline.critChance+Math.floor(a.luk/3)*.01)
 },perfectEvasion:Math.min(.35,Math.floor(a.luk/10)*.01)};
}
