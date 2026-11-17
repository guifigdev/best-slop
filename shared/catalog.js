// Prototype numbers. No claim of numeric parity with a Warcraft III map.
export const HEROES = {
 knight: {name:'Bento',animal:'Capivara guardiã',role:'FORÇA · CORPO A CORPO',color:0xf3bd60,hp:950,mana:280,damage:34,armor:5,range:1.7,speed:4.3,interval:1.1,skill:'stomp',description:'Uma capivara tranquila. Até alguém ameaçar o bosque. Escudo firme, pisada pesada.'},
 mage: {name:'Lua',animal:'Coelha arcanista',role:'INTELIGÊNCIA · À DISTÂNCIA',color:0x9978df,hp:650,mana:520,damage:28,armor:1,range:7,speed:4.1,interval:1.35,skill:'bolt',description:'Aprendeu magia lendo as estrelas. Orelhas atentas e um repertório de tempestades.'},
 ranger: {name:'Faísca',animal:'Raposa patrulheira',role:'AGILIDADE · À DISTÂNCIA',color:0x6fbd8b,hp:740,mana:340,damage:30,armor:2,range:8,speed:4.9,interval:.85,skill:'multishot',description:'Nenhuma flecha desperdiçada. Nenhum passo por acaso. A mais veloz das trilhas.'}
};
export const SKILLS = {
 bolt:{name:'Raio arcano',icon:'ϟ',kind:'active',cost:140,mana:45,cooldown:5,target:'enemy',description:'Atinge um inimigo com 110 de dano mágico.'},
 stomp:{name:'Pisada sísmica',icon:'✹',kind:'active',cost:140,mana:60,cooldown:9,target:'self',description:'80 de dano e 1,5 s de atordoamento em uma área de 4 m.'},
 heal:{name:'Luz restauradora',icon:'✚',kind:'active',cost:150,mana:60,cooldown:12,target:'self',description:'Recupera 180 pontos de vida.'},
 chain:{name:'Relâmpago em cadeia',icon:'↯',kind:'active',cost:180,mana:75,cooldown:8,target:'enemy',description:'Salta entre até 4 inimigos. 100 de dano inicial; cada salto perde 20%.'},
 blizzard:{name:'Nevasca',icon:'❄',kind:'active',cost:180,mana:80,cooldown:11,target:'ground',description:'Área de 4 m: 4 pulsos de 38 de dano ao longo de 3 segundos.'},
 summon:{name:'Espírito lobo',icon:'♞',kind:'active',cost:180,mana:80,cooldown:20,target:'self',description:'Invoca um lobo aliado por 18 segundos.'},
 multishot:{name:'Disparo múltiplo',icon:'⋔',kind:'active',cost:160,mana:45,cooldown:7,target:'self',description:'Dispara contra até 5 inimigos próximos, causando 85 de dano em cada.'},
 avatar:{name:'Avatar',icon:'♜',kind:'active',cost:240,mana:100,cooldown:30,target:'self',description:'Por 8 segundos, recebe +8 de armadura e +20 de dano.'},
 critical:{name:'Golpe crítico',icon:'⚔',kind:'passive',cost:170,description:'20% de chance de causar o dobro do dano de ataque.'},
 vampiric:{name:'Vampirismo',icon:'◒',kind:'passive',cost:170,description:'Ataques básicos curam 15% do dano causado.'},
 endurance:{name:'Fervor',icon:'»',kind:'passive',cost:170,description:'Aumenta a velocidade de ataque em 20%.'},
 thorns:{name:'Espinhos',icon:'✧',kind:'passive',cost:170,description:'Devolve 20% do dano recebido de ataques corpo a corpo.'}
};
export const ITEMS={vitality:{name:'Coração de pedra',icon:'♥',cost:180,description:'+180 de vida máxima.'},blade:{name:'Lâmina de ferro',icon:'†',cost:180,description:'+12 de dano de ataque.'},mana:{name:'Cristal de mana',icon:'♦',cost:140,description:'+120 de mana máxima.'},potion:{name:'Poção de vida',icon:'⚗',cost:80,description:'Recupera 280 de vida imediatamente.'}};
export const KEYS=['Q','W','E','R','D','F','C'];
