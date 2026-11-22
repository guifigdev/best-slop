// Optional survivor techniques inspired by Midgard's landscapes. These are
// original additions, separate from the database's canonical class skills.
export const RO_NATURE_SKILLS=Object.freeze({
 yggwisps:Object.freeze({key:'yggwisps',name:'Luzes de Yggdrasil',tier:0,skill:'summon',kind:'summon',element:'holy',manaCost:8,damage:72,cooldown:10,range:18,description:'Dois espíritos luminosos perseguem inimigos por 6s e disparam pequenas rajadas sagradas.',mechanics:Object.freeze({duration:6,interval:1,summonCount:2,ranged:true,radius:1.7})}),
 payonpetals:Object.freeze({key:'payonpetals',name:'Pétalas de Payon',tier:0,skill:'abilityPulse',kind:'zone',element:'wind',manaCost:9,damage:90,cooldown:10,range:8,description:'Uma espiral de pétalas acompanha você por 4s, causa dano e reduz a velocidade dos inimigos próximos.',mechanics:Object.freeze({duration:4,interval:.8,follow:true,radius:4.5,status:Object.freeze({slow:.28}),statusDuration:1.1})}),
 lunardew:Object.freeze({key:'lunardew',name:'Orvalho de Yggdrasil',tier:0,skill:'heal',kind:'heal',element:'holy',manaCost:10,damage:0,cooldown:14,range:1,description:'Gotas de luz recuperam 10% da vida e removem veneno e teias. O uso automático espera você precisar de cura.',mechanics:Object.freeze({healPercent:.10,cleanse:true})})
});
