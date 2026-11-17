import {ITEM_MAX_LEVEL} from './catalog.js';

export const ENCHANTMENTS={
 fire:{name:'Brasa viva',description:'Acertos da arma aplicam queimadura por 4s. Renovar o efeito não acumula instâncias de fogo.',cost:300,color:'#f5a65b'},
 frost:{name:'Geada breve',description:'Acertos da arma aplicam frost: −45% movimento por um instante. Não aumenta a intensidade do frio ambiental.',cost:450,color:'#a7dce7'},
 poison:{name:'Peçonha de musgo',description:'Acertos da arma aplicam veneno por 5s. Renovar o efeito não acumula instâncias de veneno.',cost:260,color:'#b4cc7a'}
};

const WEAPONS=new Set(['blade','bow','staff']);
const ENCHANT_COST_SCALE=[1,1.25,1.5,1.75,2];
const ENCHANT_DAMAGE={fire:[6,9,12,15,18],frost:[0,0,0,0,0],poison:[4,6,8,10,12]};
const FROST_DURATION=[.6,.7,.8,.9,1];
const normalizeLevel=level=>Math.max(1,Math.min(ITEM_MAX_LEVEL,Number.isFinite(level)?Math.floor(level):1));

export const isEnchantable=key=>WEAPONS.has(key);

export function enchantAt(key,level=1){
 if(!Object.hasOwn(ENCHANTMENTS,key))return null;
 const rank=normalizeLevel(level),base=ENCHANTMENTS[key],damage=ENCHANT_DAMAGE[key][rank-1],duration=key==='frost'?FROST_DURATION[rank-1]:key==='fire'?4:5;
 const effect={...base,key,level:rank,damage,duration};
 if(key==='frost'){
  effect.slow=.45;
  effect.description=`Acertos primários aplicam frost: −45% movimento por ${String(duration).replace('.',',')}s. Sem dano direto; renova a duração sem acumular lentidão.`;
 }else effect.description=`Acertos primários aplicam ${key==='fire'?'queimadura':'veneno'}: ${damage} dano/s por ${duration}s. Renova a duração sem acumular o mesmo tipo de efeito.`;
 return effect;
}

export function enchantPrice(key,itemLevel=1){
 if(!Object.hasOwn(ENCHANTMENTS,key))return null;
 return Math.round(ENCHANTMENTS[key].cost*ENCHANT_COST_SCALE[normalizeLevel(itemLevel)-1]);
}
