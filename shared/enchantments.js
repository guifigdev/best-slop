import {ITEMS,ITEM_MAX_LEVEL} from './catalog.js';

export const ENCHANTMENTS={
 fire:{name:'Brasa viva',description:'Acertos da arma aplicam queimadura por 4s. Renovar o efeito não acumula instâncias de fogo.',cost:300,color:'#f5a65b'},
 frost:{name:'Geada breve',description:'Acertos da arma aplicam frost: −45% movimento por um instante. Não aumenta a intensidade do frio ambiental.',cost:450,color:'#a7dce7'},
 poison:{name:'Peçonha de musgo',description:'Acertos da arma aplicam veneno por 5s. Renovar o efeito não acumula instâncias de veneno.',cost:260,color:'#b4cc7a'},
 fireward:{name:'Proteção de Muspelheim',element:'fire',cost:300,color:'#f5a65b'},
 frostward:{name:'Proteção de Niflheim',element:'ice',cost:300,color:'#a7dce7'},
 venomward:{name:'Proteção de Jormungand',element:'poison',cost:280,color:'#b4cc7a'},
 stormward:{name:'Proteção de Thor',element:'lightning',cost:350,color:'#d2c5ff'}
};

const ENCHANT_COST_SCALE=[1,1.25,1.5,1.75,2];
const ENCHANT_DAMAGE={fire:[6,9,12,15,18],frost:[0,0,0,0,0],poison:[4,6,8,10,12]};
const FROST_DURATION=[.6,.7,.8,.9,1];
const normalizeLevel=level=>Math.max(1,Math.min(ITEM_MAX_LEVEL,Number.isFinite(level)?Math.floor(level):1));

export const isWeapon=key=>Object.hasOwn(ITEMS,key)&&ITEMS[key].slotType==='weapon';
export const isEnchantable=key=>Object.hasOwn(ITEMS,key)&&['weapon','armor'].includes(ITEMS[key].slotType);
export const canEnchant=(item,key)=>isEnchantable(item)&&Object.hasOwn(ENCHANTMENTS,key)&&(ITEMS[item].slotType==='armor'?!!ENCHANTMENTS[key].element:!ENCHANTMENTS[key].element);

export function enchantAt(key,level=1){
 if(!Object.hasOwn(ENCHANTMENTS,key))return null;
 const rank=normalizeLevel(level),base=ENCHANTMENTS[key];
 if(base.element){const resistance=.15+(rank-1)*.05;return{...base,key,level:rank,resistance,description:`Reduz em ${Math.round(resistance*100)}% o dano de ${({fire:'fogo',ice:'gelo',poison:'veneno',lightning:'raio'})[base.element]}. Inclui dano periódico e ambiental desse elemento. Proteções iguais não acumulam: vale a mais forte.`};}
 const damage=ENCHANT_DAMAGE[key][rank-1],duration=key==='frost'?FROST_DURATION[rank-1]:key==='fire'?4:5;
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
