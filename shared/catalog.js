// Classic Blizzard guide values are preserved for documented ranks; ranks 4–5
// and original skills are extensions. This hybrid is not a Warcraft patch clone.
export const HEROES = {
 knight:{name:'Bento',animal:'Capivara guardiã',role:'FORÇA · CORPO A CORPO',color:0xf3bd60,hp:950,mana:280,damage:34,armor:5,range:1.7,speed:4.3,interval:1.1,skill:'stomp',focus:'str',description:'Escudo firme, pisada pesada. Uma capivara tranquila até o primeiro sino.'},
 mage:{name:'Lua',animal:'Coelha arcanista',role:'INTELIGÊNCIA · MAGIA',color:0x9978df,hp:650,mana:520,damage:28,armor:1,range:7,speed:4.1,interval:1.35,skill:'bolt',focus:'int',description:'Orelhas atentas às estrelas. Transforma mana em tempestades.'},
 ranger:{name:'Faísca',animal:'Raposa patrulheira',role:'DESTREZA · À DISTÂNCIA',color:0x6fbd8b,hp:740,mana:340,damage:30,armor:2,range:8,speed:4.9,interval:.85,skill:'multishot',focus:'dex',description:'Cada flecha tem um destino. Precisão e passos rápidos.'},
 turtle:{name:'Casco',animal:'Tartaruga sentinela',role:'VITALIDADE · DEFESA',color:0x8da885,hp:1100,mana:300,damage:29,armor:7,range:1.8,speed:3.8,interval:1.3,skill:'thorns',focus:'vit',description:'O escudo é parte de si. Devolve a força de quem ousa atacá-lo.'},
 owl:{name:'Noctis',animal:'Coruja da tempestade',role:'INTELIGÊNCIA · CONTROLE',color:0xb4a3cc,hp:690,mana:560,damage:26,armor:2,range:7,speed:4.4,interval:1.4,skill:'chain',focus:'int',description:'Enxerga a próxima abertura. Relâmpagos dançam sob suas asas.'},
 raccoon:{name:'Nico',animal:'Guaxinim duelista',role:'SORTE · CRÍTICOS',color:0xb4a082,hp:800,mana:320,damage:32,armor:3,range:1.8,speed:4.8,interval:.9,skill:'critical',focus:'luk',description:'Uma máscara, um sorriso e um golpe no momento perfeito.'}
};
export const ATTRIBUTES={
 str:{name:'Força',short:'STR',description:'+1,2 ATQ físico/ponto; +5% dano físico a cada 10.'},
 int:{name:'Inteligência',short:'INT',description:'+2,5% poder mágico/ponto; +0,8 mana/s a cada 6; +8 mana/ponto.'},
 dex:{name:'Destreza',short:'DEX',description:'+1,5 ATQ à distância/ponto; +0,5% precisão/ponto e +2% a cada 5.'},
 luk:{name:'Sorte',short:'LUK',description:'+1% crítico a cada 3; +0,1% esquiva/ponto.'},
 vit:{name:'Vitalidade',short:'VIT',description:'+20 vida/ponto; +1 armadura a cada 5.'},
 agi:{name:'Agilidade',short:'AGI',description:'+1% velocidade de ataque/ponto; +5% adicionais a cada 10.'}
};
const urls={mk:'https://classic.battle.net/war3/human/units/mountainking.shtml',tc:'https://classic.battle.net/war3/orc/units/taurenchieftain.shtml',pal:'https://classic.battle.net/war3/human/units/paladin.shtml',far:'https://classic.battle.net/war3/orc/units/farseer.shtml',bm:'https://classic.battle.net/war3/orc/units/blademaster.shtml',am:'https://classic.battle.net/war3/human/units/archmage.shtml',dl:'https://classic.battle.net/war3/undead/units/dreadlord.shtml',kg:'https://classic.battle.net/war3/nightelf/units/keepergrove.shtml'};
function skill(name,kind,cost,target,fields,description,reference=null,source=null,originalRanks=3){return{name,kind,cost,target,description,reference,source:urls[source]||null,originalRanks:reference?originalRanks:0,levels:Array.from({length:5},(_,i)=>Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,Array.isArray(v)?v[i]:v])))};}
export const SKILLS={
 bolt:skill('Martelo astral','active',140,'enemy',{damage:[100,225,350,475,600],stun:5,heroStun:3,mana:75,cooldown:9},'Dano mágico e atordoamento.','Storm Bolt','mk'),
 stomp:skill('Pisada sísmica','active',140,'self',{damage:[25,50,75,100,125],stun:[3,4,5,6,7],heroStun:[2,3,4,5,6],radius:[2.5,3,3.5,4,4.5],mana:90,cooldown:6},'Dano em área e atordoamento.','War Stomp','tc'),
 heal:skill('Luz restauradora','active',150,'self',{heal:[200,400,600,800,1000],mana:65,cooldown:5},'Cura própria; alvo adaptado ao coliseu.','Holy Light','pal'),
 chain:skill('Relâmpago em cadeia','active',180,'enemy',{damage:[85,125,180,235,290],jumps:[4,6,8,10,12],mana:120,cooldown:9},'Salta entre inimigos; perde 15% de dano por salto.','Chain Lightning','far'),
 blizzard:skill('Nevasca','active',180,'ground',{damage:[30,40,50,60,70],pulses:[6,8,10,12,14],radius:3,mana:75,cooldown:6},'Canaliza chuva de gelo; mover ou parar interrompe. Sem fogo amigo.','Blizzard','am'),
 summon:skill('Espíritos lobos','active',180,'self',{count:2,hp:[200,300,500,700,900],damage:[18,30,45,60,75],duration:60,mana:75,cooldown:[30,25,25,25,25]},'Dois lobos aliados; substitui os anteriores. HP/ATQ adaptados.','Feral Spirit','far'),
 multishot:skill('Disparo múltiplo','active',160,'self',{damage:[85,120,155,190,225],count:[3,4,5,6,7],mana:45,cooldown:7},'Flechas físicas contra vários alvos.'),
 avatar:skill('Avatar','active',240,'self',{armor:[5,7,9,11,13],hp:[500,650,800,950,1100],damage:[20,30,40,50,60],duration:60,mana:150,cooldown:180},'Vida, armadura, dano e imunidade a magia de inimigos; clima ainda afeta.','Avatar','mk',1),
 critical:skill('Golpe crítico','passive',170,'self',{chance:.15,multiplier:[2,3,4,5,6]},'Chance de dano multiplicado. Críticos ignoram teste de acerto.','Critical Strike','bm'),
 vampiric:skill('Vampirismo','passive',170,'self',{lifesteal:[.15,.30,.45,.55,.65]},'Rouba vida com ataques corpo a corpo.','Vampiric Aura','dl'),
 endurance:skill('Fervor','passive',170,'self',{attackSpeed:[.05,.10,.15,.20,.25],moveSpeed:[.10,.20,.30,.40,.50]},'Velocidade de ataque e movimento em aura.','Endurance Aura','tc'),
 thorns:skill('Espinhos','passive',170,'self',{reflect:[.10,.20,.30,.40,.50]},'Reflete parte do dano corpo a corpo.','Thorns Aura','kg'),
 shockwave:skill('Onda de choque','active',180,'ground',{damage:[75,130,200,270,340],radius:1.5,mana:100,cooldown:8},'Linha de força que atravessa até 12 inimigos.','Shock Wave','tc'),
 bash:skill('Impacto atordoante','passive',180,'self',{chance:[.2,.3,.4,.5,.6],damage:25,stun:2,heroStun:1},'Chance de dano extra e atordoamento por ataque.','Bash','mk'),
 devotion:skill('Couraça do bosque','passive',160,'self',{armor:[1.5,3,4.5,6,7.5]},'Armadura adicional para aliados próximos.','Devotion Aura','pal'),
 brilliance:skill('Fonte arcana','passive',160,'self',{manaRegen:[.75,1.5,2.25,3,3.75]},'Regeneração de mana para aliados próximos.','Brilliance Aura','am'),
 fireball:skill('Cometa de brasas','active',180,'ground',{damage:[100,170,240,310,380],radius:[2.5,2.8,3.1,3.4,3.7],burn:[8,12,16,20,24],mana:85,cooldown:10},'Explosão de fogo com queimadura por 4 segundos.'),
 frostnova:skill('Anel de inverno','active',170,'self',{damage:[70,120,170,220,270],radius:4,slow:.45,duration:[3,3.5,4,4.5,5],mana:80,cooldown:10},'Frio em área reduz movimento e causa dano.'),
 dash:skill('Salto de cauda','active',150,'ground',{damage:[60,100,140,180,220],distance:[4,5,6,7,8],mana:40,cooldown:7},'Salta até o ponto e causa dano físico na chegada.'),
 evasion:skill('Passos de névoa','passive',180,'self',{evasion:[.05,.10,.15,.20,.25]},'Chance adicional de esquiva; acumula com Sorte até o limite de 45%.'),
 cleave:skill('Arco selvagem','passive',180,'self',{cleave:[.15,.25,.35,.45,.55]},'Ataques corpo a corpo atingem vizinhos do alvo.'),
 poison:skill('Presas de musgo','passive',170,'self',{poison:[4,7,10,13,16],duration:4},'Ataques aplicam veneno por quatro segundos, sem acumular no mesmo alvo.'),
 drain:skill('Sopro voraz','active',170,'enemy',{damage:[100,160,220,280,340],mana:75,cooldown:10},'Drena vida do inimigo e cura metade do dano efetivo.'),
 shield:skill('Manto de pétalas','active',170,'self',{shield:[180,300,420,540,660],duration:10,mana:65,cooldown:16},'Barreira absorve dano, inclusive do ambiente.')
};
export const ITEMS={
 vitality:{name:'Cinto do gigante',cost:300,stock:2,attributes:{str:6,vit:3},description:'+6 STR, +3 VIT.'},
 blade:{name:'Garras de ataque',cost:220,stock:2,stats:{damage:9},description:'+9 dano físico. Referência: Claws of Attack +9.'},
 mana:{name:'Pingente de energia',cost:260,stock:2,stats:{mana:150},description:'+150 mana máxima. Referência: Pendant of Energy.'},
 armor:{name:'Anel de proteção',cost:240,stock:2,stats:{armor:3},description:'+3 armadura. Referência: Ring of Protection +3.'},
 mask:{name:'Máscara da morte',cost:650,stock:1,stats:{lifesteal:.5},description:'50% roubo de vida físico, inclusive à distância.'},
 talisman:{name:'Talismã do falcão',cost:500,stock:1,stats:{crit:.1,critMultiplier:2},attributes:{luk:3},description:'+10% crítico, multiplicador mínimo 2×, +3 LUK. Item original.'},
 gloves:{name:'Luvas de celeridade',cost:240,stock:2,stats:{attackSpeed:.15},description:'+15% velocidade de ataque.'},
 crown:{name:'Coroa dos seis clãs',cost:700,stock:1,attributes:{str:5,int:5,dex:5,luk:5,vit:5,agi:5},description:'+5 nos seis atributos. Item original.'},
 staff:{name:'Cajado das estrelas',cost:320,stock:2,attributes:{int:8},stats:{manaRegen:1},description:'+8 INT e +1 mana/s.'},
 bow:{name:'Arco do horizonte',cost:320,stock:2,attributes:{dex:8,agi:3},description:'+8 DEX e +3 AGI.'},
 boots:{name:'Botas do andarilho',cost:280,stock:2,attributes:{agi:8},stats:{moveSpeed:.1},description:'+8 AGI e +10% movimento.'},
 charm:{name:'Trevo de jade',cost:300,stock:2,attributes:{luk:9},stats:{evasion:.03},description:'+9 LUK e +3% esquiva.'},
 shell:{name:'Casco ancestral',cost:340,stock:2,attributes:{vit:8},stats:{armor:2},description:'+8 VIT e +2 armadura.'},
 ember:{name:'Broche de obsidiana',cost:350,stock:2,stats:{fireResist:.5},attributes:{str:3},description:'−50% dano de lava/queimadura e +3 STR.'},
 scarf:{name:'Cachecol polar',cost:350,stock:2,stats:{coldResist:.5},attributes:{int:3},description:'−50% dano de frio; reduz lentidão ambiental pela metade. +3 INT.'},
 potion:{name:'Poção de vida',cost:80,stock:12,consumable:true,heal:300,description:'Restaura 300 vida. Até 3 cargas por espaço. Recarga de poções: 10s.'},
 manapot:{name:'Poção de mana',cost:70,stock:12,consumable:true,mana:200,description:'Restaura 200 mana. Até 3 cargas por espaço. Recarga de poções: 10s.'}
};
export const KEYS=['Q','W','E','R','D','F','C'];
export const levelOf=(u,key)=>u.skillLevels?.[key]||(u.skills?.includes(key)?1:0);
export const skillAt=(key,level=1)=>SKILLS[key]?{...SKILLS[key],...SKILLS[key].levels[Math.max(0,Math.min(4,level-1))],level}:null;
export const upgradePrice=(key,current=0)=>Math.round(SKILLS[key].cost*(1+current*.55));
export const skillRequirement=level=>level*2-1;
export function skillDescription(key,level=1){const s=skillAt(key,level);if(!s)return '';const details=[];for(const [k,label]of Object.entries({mana:'Mana',cooldown:'Recarga (s)',damage:'Dano base',heal:'Cura',shield:'Barreira',hp:'Vida',armor:'Armadura',pulses:'Pulsos',jumps:'Saltos',stun:'Atordoamento (s)',count:'Alvos/unidades',duration:'Duração (s)',manaRegen:'Mana/s',multiplier:'Crítico ×'}))if(s[k]!==undefined)details.push(`${label}: ${s[k]}`);for(const [k,label]of Object.entries({chance:'Chance',lifesteal:'Roubo de vida',attackSpeed:'Vel. ataque',moveSpeed:'Movimento',reflect:'Reflexão',evasion:'Esquiva',cleave:'Área',slow:'Lentidão'}))if(s[k]!==undefined)details.push(`${label}: ${Math.round(s[k]*100)}%`);return `${s.description} ${details.join(' · ')}${s.reference?` · Base: ${s.reference}${level>s.originalRanks?' · nível estendido':''}`:' · técnica original'}`;}
