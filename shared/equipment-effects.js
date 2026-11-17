// Original effects inspired by familiar Warcraft III/Dota item roles.
// Numbers, radii and scaling belong to this game rather than a Dota patch.
const EFFECTS={
 solar:{name:'Lâmina do sol errante',type:'aura',damage:[12,18,24,30,36],radius:[3.5,3.75,4,4.25,4.5]},
 stormcoil:{name:'Bobina da tormenta',type:'proc',damage:[35,48,62,76,90],chance:.25,jumps:[3,3,4,4,5],retention:.8,radius:5},
 mirror:{name:'Couraça do contragolpe',type:'active',reflect:[.35,.4,.45,.5,.55],duration:4,cooldown:25,mana:0},
 restoration:{name:'Relicário do recomeço',type:'active',heal:[150,225,300,375,450],radius:6,cooldown:30,mana:75}
};
const format=value=>String(value).replace('.',',');

export function equipmentEffectAt(key,level=1){
 if(!Object.hasOwn(EFFECTS,key))return null;
 const rank=Math.max(1,Math.min(5,Number.isFinite(level)?Math.floor(level):1));
 const effect={key,level:rank,...Object.fromEntries(Object.entries(EFFECTS[key]).map(([field,value])=>[field,Array.isArray(value)?value[rank-1]:value]))};
 if(key==='solar')effect.description=`Aura solar: ${effect.damage} dano de fogo/s aos inimigos em ${format(effect.radius)}m. Passiva, sem custo de mana; não escala com INT.`;
 else if(key==='stormcoil')effect.description=`Acertos primários têm ${effect.chance*100}% de chance de lançar relâmpagos: ${effect.damage} dano inicial, até ${effect.jumps} alvos únicos, ${effect.radius}m por salto e −${Math.round((1-effect.retention)*100)}% dano por salto. Não escala com INT ou crítico.`;
 else if(key==='mirror')effect.description=`Ativar: reflete ${Math.round(effect.reflect*100)}% do dano efetivo recebido de inimigos por ${effect.duration}s. Recarga ${effect.cooldown}s; sem custo de mana. Não reflete ambiente nem outra reflexão.`;
 else effect.description=`Ativar: cura ${effect.heal} de vida do portador e de aliados em ${effect.radius}m. Custa ${effect.mana} mana; recarga ${effect.cooldown}s. Não escala com INT nem ressuscita.`;
 return effect;
}
