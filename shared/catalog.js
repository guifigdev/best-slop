import {equipmentEffectAt} from './equipment-effects.js';
// Historical guides document the origin, not a promise of patch equivalence.
// Balance notes identify intentional changes; ranks 4–5 are our extensions.
export const HEROES = {
 knight:{name:'Bento',animal:'Capivara guardiã',role:'FORÇA · CORPO A CORPO',color:0xf3bd60,hp:950,mana:280,damage:34,armor:5,range:1.7,speed:4.3,interval:1.1,skill:'stomp',focus:'str',description:'Escudo firme, pisada pesada. Uma capivara tranquila até o primeiro sino.'},
 mage:{name:'Lua',animal:'Coelha arcanista',role:'INTELIGÊNCIA · MAGIA',color:0x9978df,hp:650,mana:520,damage:28,armor:1,range:7,speed:4.1,interval:1.35,skill:'bolt',focus:'int',description:'Orelhas atentas às estrelas. Transforma mana em tempestades.'},
 ranger:{name:'Faísca',animal:'Raposa patrulheira',role:'DESTREZA · À DISTÂNCIA',color:0x6fbd8b,hp:740,mana:340,damage:30,armor:2,range:8,speed:4.9,interval:.85,skill:'multishot',focus:'dex',description:'Cada flecha tem um destino. Precisão e passos rápidos.'},
 turtle:{name:'Casco',animal:'Tartaruga sentinela',role:'VITALIDADE · DEFESA',color:0x8da885,hp:1100,mana:300,damage:29,armor:7,range:1.8,speed:3.8,interval:1.3,skill:'thorns',focus:'vit',description:'O escudo é parte de si. Devolve a força de quem ousa atacá-lo.'},
 owl:{name:'Noctis',animal:'Coruja da tempestade',role:'INTELIGÊNCIA · CONTROLE',color:0xb4a3cc,hp:690,mana:560,damage:26,armor:2,range:7,speed:4.4,interval:1.4,skill:'chain',focus:'int',description:'Enxerga a próxima abertura. Relâmpagos dançam sob suas asas.'},
 raccoon:{name:'Nico',animal:'Guaxinim duelista',role:'SORTE · CRÍTICOS',color:0xb4a082,hp:800,mana:320,damage:32,armor:3,range:1.8,speed:4.8,interval:.9,skill:'critical',focus:'luk',description:'Uma máscara, um sorriso e um golpe no momento perfeito.'}
};
for(const [key,name,description]of [
 ['knight','Bjorn','Uma capivara do fiorde que jurou guardar as raízes de Yggdrasil. Seu passo faz a pedra recordar os gigantes.'],
 ['mage','Liv','Coelha das runas de Niflheim. Lê o gelo como uma saga e chama a luz para proteger seu clã.'],
 ['ranger','Runa','Raposa das trilhas de Skadi. Cada flecha atravessa o vento do norte em busca de um destino.'],
 ['turtle','Sten','Tartaruga dos rochedos de Midgard. Carrega no casco os juramentos de gerações de guardiões.'],
 ['owl','Vidar','Coruja dos pinheiros de Asgard. Escuta o trovão entre os galhos antes que a primeira faísca apareça.'],
 ['raccoon','Eirik','Guaxinim viajante dos Nove Reinos. Lê as marcas das Nornas e escolhe o instante exato para atacar.']
])Object.assign(HEROES[key],{name,description});
export const ATTRIBUTES={
 str:{name:'Força',short:'STR',description:'+1,2 ATQ físico/ponto; +5% dano físico a cada 10.'},
 int:{name:'Inteligência',short:'INT',description:'+2,5% poder mágico/ponto; +0,8 mana/s a cada 6; +8 mana/ponto.'},
 dex:{name:'Destreza',short:'DEX',description:'+1,5 ATQ à distância/ponto; +0,5% precisão/ponto e +2% a cada 5.'},
 luk:{name:'Sorte',short:'LUK',description:'+1% crítico a cada 3; +1% esquiva perfeita a cada 10 (DEX não reduz).'},
 vit:{name:'Vitalidade',short:'VIT',description:'+20 vida/ponto; +1 armadura a cada 5; +0,1% da vida máxima/s a cada 10.'},
 agi:{name:'Agilidade',short:'AGI',description:'+1% vel. ataque e +0,3% esquiva comum/ponto; +5% vel. ataque a cada 10.'}
};
const urls={mk:'https://classic.battle.net/war3/human/units/mountainking.shtml',tc:'https://classic.battle.net/war3/orc/units/taurenchieftain.shtml',pal:'https://classic.battle.net/war3/human/units/paladin.shtml',far:'https://classic.battle.net/war3/orc/units/farseer.shtml',bm:'https://classic.battle.net/war3/orc/units/blademaster.shtml',am:'https://classic.battle.net/war3/human/units/archmage.shtml',dl:'https://classic.battle.net/war3/undead/units/dreadlord.shtml',kg:'https://classic.battle.net/war3/nightelf/units/keepergrove.shtml'};
function skill(name,kind,cost,target,fields,description,reference=null,source=null,originalRanks=3){return{name,kind,cost,target,description,reference,source:urls[source]||null,originalRanks:reference?originalRanks:0,levels:Array.from({length:5},(_,i)=>Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,Array.isArray(v)?v[i]:v])))};}
export const SKILLS={
 bolt:skill('Martelo astral','active',140,'enemy',{damage:[100,225,350,475,600],stun:5,heroStun:3,mana:75,cooldown:9},'Dano mágico e atordoamento.','Storm Bolt','mk'),
 stomp:skill('Pisada sísmica','active',140,'self',{damage:[25,50,75,100,125],stun:[2,2.5,3,3.5,4],heroStun:[1,1.25,1.5,1.75,2],radius:[2.5,3,3.5,4,4.5],mana:90,cooldown:8},'Dano em área e atordoamento; duração menor contra heróis.','War Stomp','tc'),
 heal:skill('Luz restauradora','active',150,'self',{heal:[200,350,500,650,800],mana:[65,70,75,80,85],cooldown:8},'Cura própria amplificada por INT. Possui janela de recarga para permitir contra-ataques.','Holy Light','pal'),
 chain:skill('Relâmpago em cadeia','active',180,'enemy',{damage:[85,125,180,235,290],jumps:[4,6,8,10,12],mana:120,cooldown:9},'Salta entre inimigos; perde 15% de dano por salto.','Chain Lightning','far'),
 blizzard:skill('Nevasca','active',180,'ground',{damage:[30,40,50,60,70],pulses:[6,8,10,12,14],radius:3,mana:75,cooldown:6},'Canaliza chuva de gelo; mover ou parar interrompe. Sem fogo amigo.','Blizzard','am'),
 summon:skill('Espíritos lobos','active',180,'self',{count:2,hp:[200,300,500,700,900],damage:[18,30,45,60,75],duration:60,mana:75,cooldown:[30,25,25,25,25]},'Dois lobos aliados; substitui os anteriores. HP/ATQ adaptados.','Feral Spirit','far'),
 multishot:skill('Disparo múltiplo','active',160,'self',{damage:[85,120,155,190,225],count:[3,4,5,6,7],mana:45,cooldown:7},'Flechas físicas contra vários alvos.'),
 avatar:skill('Avatar','active',240,'self',{armor:[5,7,9,11,13],hp:[500,650,800,950,1100],damage:[20,30,40,50,60],duration:60,mana:150,cooldown:180},'Vida, armadura, dano e imunidade a magia de inimigos; clima ainda afeta.','Avatar','mk',1),
 critical:skill('Golpe crítico','passive',170,'self',{chance:.15,multiplier:[2,3,4,4.5,5]},'Dano multiplicado. Ignora acerto comum, mas pode ser evitado pela esquiva perfeita.','Critical Strike','bm'),
 vampiric:skill('Vampirismo','passive',170,'self',{lifesteal:[.10,.15,.20,.25,.30]},'Rouba vida com ataques corpo a corpo. Acumula com equipamentos.','Vampiric Aura','dl'),
 endurance:skill('Fervor','passive',170,'self',{attackSpeed:[.05,.10,.15,.20,.25],moveSpeed:[.10,.20,.30,.35,.40]},'Velocidade de ataque e movimento em aura.','Endurance Aura','tc'),
 thorns:skill('Espinhos','passive',170,'self',{reflect:[.10,.20,.30,.35,.40]},'Reflete parte do dano corpo a corpo.','Thorns Aura','kg'),
 shockwave:skill('Onda de choque','active',180,'ground',{damage:[75,130,200,270,340],radius:1.5,mana:100,cooldown:8},'Linha de força que atravessa até 12 inimigos.','Shock Wave','tc'),
 bash:skill('Impacto atordoante','passive',180,'self',{chance:[.15,.18,.21,.24,.27],damage:25,stun:.9,heroStun:.35},'Chance de dano extra e breve interrupção por ataque; duração menor contra heróis.','Bash','mk'),
 devotion:skill('Couraça do bosque','passive',160,'self',{armor:[1.5,3,4.5,6,7.5]},'Armadura adicional para aliados próximos.','Devotion Aura','pal'),
 brilliance:skill('Fonte arcana','passive',160,'self',{manaRegen:[.75,1.5,2.25,3,3.75]},'Regeneração de mana para aliados próximos.','Brilliance Aura','am'),
 fireball:skill('Cometa de brasas','active',180,'ground',{damage:[100,170,240,310,380],radius:[2.5,2.8,3.1,3.4,3.7],burn:[8,12,16,20,24],mana:85,cooldown:10},'Explosão de fogo com queimadura por 4 segundos.'),
 frostnova:skill('Anel de inverno','active',170,'self',{damage:[70,120,170,220,270],radius:4,slow:.45,duration:[3,3.5,4,4.5,5],mana:80,cooldown:10},'Frio em área reduz movimento e causa dano.'),
 dash:skill('Salto de cauda','active',150,'ground',{damage:[60,100,140,180,220],distance:[4,5,6,7,8],mana:40,cooldown:7},'Salta até o ponto e causa dano físico na chegada.'),
 evasion:skill('Passos de névoa','passive',180,'self',{evasion:[.05,.10,.15,.20,.25]},'Esquiva comum adicional; acumula com AGI até 45%. Não altera esquiva perfeita.'),
 cleave:skill('Cleave · Arco selvagem','passive',180,'self',{cleave:[.15,.25,.35,.45,.55]},'Ataques corpo a corpo causam dano físico aos vizinhos do alvo. Percentuais provisórios do nosso jogo; ainda não conferidos no mapa CHS.'),
 bounce:skill('Glaive ricocheteante','passive',190,'self',{bounces:[1,2,3,4,5],retention:.7},'Ataques à distância ricocheteiam em alvos únicos a até 5m. Cada salto mantém 70% do dano; não reaplica crítico, veneno ou roubo de vida.'),
 blink:skill('Blink · Passo estelar','active',170,'ground',{distance:[5,6,7,8,9],mana:50,cooldown:[12,10,8,7,6]},'Teleporta até um ponto livre. Alcance e recargas adaptados, sem dano. Não atravessa os limites da sua prova.'),
 swap:skill('Troca de destinos','active',190,'unit',{mana:80,cooldown:[20,18,16,14,12]},'Troca de lugar com um aliado ou inimigo a até 12m. Protege as divisões entre provas individuais.'),
 icewall:skill('Barreira de gelo','active',190,'ground',{duration:[4,5,6,7,8],width:[3,3.5,4,4.5,5],mana:90,cooldown:18},'Ergue uma parede de gelo temporária que bloqueia o movimento de todos. Contorne a parede ou use Blink.'),
 forcepush:skill('Rajada de repulsão','active',180,'ground',{damage:[55,85,115,145,175],push:[3,3.5,4,4.5,5],radius:1.8,mana:65,cooldown:9},'Uma linha de força empurra inimigos. Use o terreno a seu favor; paredes e limites interrompem o empurrão.'),
 hook:skill('Laço gravitacional','active',180,'enemy',{damage:[40,65,90,115,140],pull:[3,4,5,6,7],mana:70,cooldown:12},'Puxa um inimigo em sua direção; obstáculos impedem a passagem. Uma releitura da disputa de posicionamento de Warlock.'),
 gravity:skill('Poço de gravidade','active',210,'ground',{damage:[12,18,24,30,36],radius:3.5,duration:[3,3.5,4,4.5,5],mana:100,cooldown:20},'Cria um campo que puxa inimigos para o centro e causa dano por segundo. Avatar resiste ao puxão.'),
 poison:skill('Presas de musgo','passive',170,'self',{poison:[4,8,12,18,24],duration:4},'Ataques aplicam veneno por quatro segundos, sem acumular no mesmo alvo.'),
 drain:skill('Sopro voraz','active',170,'enemy',{damage:[100,160,220,280,340],mana:75,cooldown:10},'Drena vida do inimigo e cura metade do dano efetivo.'),
 shield:skill('Manto de pétalas','active',170,'self',{shield:[180,300,420,540,660],duration:10,mana:65,cooldown:16},'Barreira absorve dano, inclusive do ambiente.'),
 flamebreath:skill('Sopro da quimera','active',1,'ground',{damage:[90,140,190,240,290],radius:[5,5.5,6,6.5,7],cone:.7,burn:[6,9,12,15,18],duration:4,mana:75,cooldown:10},'Sopra fogo em cone na direção escolhida, causa dano mágico e aplica queimadura por 4s. Técnica de monstro obtida por drop.'),
 venomcloud:skill('Névoa da hidra','active',1,'ground',{damage:[10,15,20,25,30],radius:[2.4,2.6,2.8,3,3.2],duration:5,mana:85,cooldown:16},'Cria uma nuvem venenosa por 5s: o dano indicado é por segundo aos inimigos dentro da área. Técnica de monstro obtida por drop.'),
 stormdive:skill('Mergulho da tempestade','active',1,'ground',{damage:[65,95,125,155,185],radius:2.7,distance:[4,5,6,7,8],stun:.6,heroStun:.35,mana:65,cooldown:11},'Avança até um ponto livre e descarrega eletricidade ao pousar, com breve atordoamento em área. Técnica de monstro obtida por drop.'),
 stonehide:skill('Pele de monólito','passive',1,'self',{armor:[3,4.5,6,7.5,9]},'Armadura adicional do portador, sem aura ou redução de dano separada. Técnica de monstro obtida por drop.'),
 battlecry:skill('Rugido soberano','active',1,'self',{rageDamage:[.20,.30,.40,.50,.60],rageSpeed:0,duration:6,mana:65,cooldown:18},'Aumenta o dano dos ataques físicos por 6s. Não acumula com outra fúria. Técnica de monstro obtida por drop.'),
 hornrush:skill('Investida do rinoceronte','active',1,'ground',{damage:[55,85,115,145,175],distance:[4,5,6,7,8],radius:1.8,push:[1.5,1.75,2,2.25,2.5],stun:.8,heroStun:.4,mana:55,cooldown:10},'Investe na direção escolhida, atingindo, empurrando e atordoando brevemente inimigos no impacto. Respeita obstáculos e limites. Técnica de monstro obtida por drop.'),
 warlockfire:skill('Esfera de repulsão','active',1,'ground',{damage:[100,150,200,250,300],push:[2.5,3,3.5,4,4.5],radius:.5,distance:14,projectileSpeed:12,mana:70,cooldown:7},'Dispara uma bola de fogo esquivável na direção escolhida. O primeiro inimigo atingido recebe dano mágico e é empurrado; não atravessa obstáculos.'),
 warlockfrost:skill('Orbe de inverno','active',1,'ground',{damage:[55,85,115,145,175],radius:.55,distance:14,projectileSpeed:11,slow:.45,duration:[1,1.25,1.5,1.75,2],mana:60,cooldown:8},'Dispara um projétil de gelo esquivável. O primeiro inimigo atingido recebe dano mágico e frost; não acumula outra lentidão sobre o frio ambiental.'),
 rage:skill('Fúria rubra','active',1,'self',{rageDamage:[.10,.15,.20,.25,.30],rageSpeed:[.10,.15,.20,.25,.30],duration:7,mana:80,cooldown:20},'Por 7s, ganha dano de ataques físicos e velocidade de ataque, sinalizados por uma aura vermelha. Não acumula com outra fúria.'),
 odinsravens:skill('Corvos de Odin','active',1,'self',{summonKind:'raven',summonName:'Corvo de Odin',summonCount:2,summonHp:[140,200,260,320,380],summonDamage:[16,24,32,40,48],summonRange:5,summonSpeed:5.5,summonFlying:true,summonDuration:30,mana:90,cooldown:35},'Chama dois corvos espirituais voadores que atacam à distância por 30s. Um novo chamado substitui os corvos anteriores.'),
 thorsgoats:skill('Bodes do Trovão','active',1,'self',{summonKind:'ram',summonName:'Bode do Trovão',summonCount:2,summonHp:[180,260,340,420,500],summonDamage:[18,25,32,39,46],summonRange:1.5,summonSpeed:4.8,summonFlying:false,summonDuration:30,mana:90,cooldown:35},'Invoca dois bodes rúnicos de Thor para combater corpo a corpo por 30s. Um novo chamado substitui este par.'),
 freyjascat:skill('Lince de Freya','active',1,'self',{summonKind:'lynx',summonName:'Lince de Freya',summonCount:1,summonHp:[350,500,650,800,950],summonDamage:[32,46,60,74,88],summonRange:1.5,summonSpeed:5.6,summonFlying:false,summonDuration:35,mana:100,cooldown:38},'Chama um lince espiritual ágil para caçar inimigos corpo a corpo por 35s. Um novo chamado substitui o lince anterior.'),
 helguard:skill('Guardião de Hel','active',1,'self',{summonKind:'helhound',summonName:'Guardião de Hel',summonCount:1,summonHp:[500,700,900,1100,1300],summonDamage:[22,34,46,58,70],summonRange:1.6,summonSpeed:3.9,summonFlying:false,summonDuration:35,mana:110,cooldown:42},'Invoca um cão espectral resistente, guardião dos portões de Hel, por 35s. Um novo chamado substitui o guardião anterior.'),
 gungnir:skill('Rastro de Gungnir','active',1,'ground',{damage:[100,155,210,265,320],radius:1.2,distance:12,mana:85,cooldown:10},'Projeta uma lança rúnica de Odin em linha reta. Causa dano mágico a inimigos no trajeto; mire a direção no chão.'),
 thorsjudgment:skill('Julgamento de Thor','active',1,'self',{damage:[80,120,160,200,240],radius:3.5,stun:.7,heroStun:.35,mana:90,cooldown:12},'Descarrega um círculo de relâmpagos em torno do portador. Causa dano mágico e atordoa brevemente os inimigos; duração menor contra heróis.'),
 freyjasgrace:skill('Graça de Freya','active',1,'self',{heal:[120,180,240,300,360],radius:6,mana:100,cooldown:20},'Restaura vida do portador e de aliados a até 6m, amplificada por INT. Não ressuscita.'),
 helsfrost:skill('Selo de Hel','active',1,'ground',{damage:[45,70,95,120,145],radius:3,duration:[3,3.5,4,4.5,5],slow:.45,mana:85,cooldown:13},'Detona uma runa de gelo no ponto escolhido. Causa dano mágico inicial e aplica frost, reduzindo movimento durante a duração indicada.')
};
// Original Nordic fiction layered over stable simulation IDs. Historical skill
// sources remain metadata for reference documentation, never in player copy.
const NORDIC_SKILL_NAMES={bolt:'Martelo de Thor',stomp:'Passo do Jotun',heal:'Luz de Eir',chain:'Corrente de Mjolnir',blizzard:'Inverno de Niflheim',summon:'Lobos de Fenrir',multishot:'Flechas de Skadi',avatar:'Juramento de Tyr',critical:'Corte do Einherjar',vampiric:'Sede de Hel',endurance:'Fôlego de Sleipnir',thorns:'Espinhos de Yggdrasil',shockwave:'Tremor de Midgard',bash:'Impacto do Trovão',devotion:'Égide de Asgard',brilliance:'Fonte de Mimir',fireball:'Brasa de Muspelheim',frostnova:'Círculo de Skadi',dash:'Salto de Ratatosk',evasion:'Passos de Loki',cleave:'Corte do Jotun',bounce:'Lâminas de Sif',blink:'Travessia de Bifrost',swap:'Fios das Nornas',icewall:'Muralha de Niflheim',forcepush:'Sopro de Njord',hook:'Grilhão de Gleipnir',gravity:'Poço de Ginnungagap',poison:'Presas de Jormungand',drain:'Toque de Hel',shield:'Manto de Frigg',flamebreath:'Sopro de Surtr',venomcloud:'Névoa de Nidhogg',stormdive:'Mergulho da Valquíria',stonehide:'Pele de Jotun',battlecry:'Brado de Heimdall',hornrush:'Investida de Tanngrisnir',warlockfire:'Orbe de Muspelheim',warlockfrost:'Orbe de Niflheim',rage:'Fúria de Berserker'};
for(const [key,name]of Object.entries(NORDIC_SKILL_NAMES))SKILLS[key].name=name;
SKILLS.cleave.description='Ataques corpo a corpo espalham dano físico aos inimigos próximos do alvo principal.';
SKILLS.blink.description='Cruza um trecho do campo até um ponto livre, sem causar dano. Respeita os limites da prova.';
SKILLS.icewall.description='Ergue uma parede temporária de gelo que bloqueia o movimento de todos. Contorne a muralha ou use Travessia de Bifrost.';
SKILLS.hook.description='Um grilhão rúnico puxa o inimigo em sua direção; obstáculos e limites interrompem a passagem.';
SKILLS.gravity.description='Abre um campo que puxa inimigos para o centro e causa dano por segundo. O Juramento de Tyr resiste ao puxão.';
for(const key of ['flamebreath','venomcloud','stormdive','stonehide','battlecry','hornrush'])SKILLS[key].dropOnly=true;
const balanceNotes={
 stomp:'Atordoamento e recarga balanceados para o coliseu; dano base clássico preservado.',
 heal:'Cura, mana e recarga balanceadas para o coliseu; alvo próprio adaptado.',
 bash:'Chance e duração balanceadas para permitir reação, especialmente com alta velocidade de ataque.',
 vampiric:'Roubo de vida balanceado para acumular com equipamentos sem tornar sustain obrigatório.',
 critical:'Multiplicadores clássicos 2/3/4× preservados; níveis 4–5 têm progressão própria moderada.',
 endurance:'Níveis 4–5 limitam a progressão de movimento; níveis 1–3 preservam a base clássica.',
 thorns:'Níveis 4–5 limitam a progressão de reflexão; níveis 1–3 preservam a base clássica.'
};
for(const [key,note]of Object.entries(balanceNotes))SKILLS[key].balanceNote=note;
export const ITEMS={
 vitality:{name:'Cinto do gigante',cost:300,stock:2,attributes:{str:6,vit:3},description:'+6 STR, +3 VIT.'},
 blade:{name:'Garras de ataque',cost:220,stock:2,stats:{damage:9},description:'+9 dano físico. Referência: Claws of Attack +9.'},
 mana:{name:'Pingente de energia',cost:260,stock:2,stats:{mana:150},description:'+150 mana máxima. Referência: Pendant of Energy.'},
 armor:{name:'Anel de proteção',cost:240,stock:2,stats:{armor:3},description:'+3 armadura. Referência: Ring of Protection +3.'},
 mask:{name:'Máscara da morte',cost:650,stock:1,stats:{lifesteal:.2},description:'20% roubo de vida físico, inclusive à distância. Valor balanceado para o coliseu.'},
 talisman:{name:'Talismã do falcão',cost:500,stock:1,stats:{crit:.1,critMultiplier:2},attributes:{luk:3},description:'+10% crítico, multiplicador mínimo 2×, +3 LUK. Item original.'},
 gloves:{name:'Luvas de celeridade',cost:240,stock:2,stats:{attackSpeed:.15},description:'+15% velocidade de ataque.'},
 crown:{name:'Coroa dos seis clãs',cost:850,stock:1,attributes:{str:5,int:5,dex:5,luk:5,vit:5,agi:5},description:'+5 nos seis atributos. Item original.'},
 staff:{name:'Cajado das estrelas',cost:320,stock:2,attributes:{int:8},stats:{manaRegen:1},description:'+8 INT e +1 mana/s.'},
 bow:{name:'Arco do horizonte',cost:320,stock:2,attributes:{dex:8,agi:3},description:'+8 DEX e +3 AGI.'},
 boots:{name:'Botas do andarilho',cost:280,stock:2,attributes:{agi:8},stats:{moveSpeed:.1},description:'+8 AGI e +10% movimento.'},
 charm:{name:'Trevo de jade',cost:300,stock:2,attributes:{luk:9},stats:{evasion:.03},description:'+9 LUK e +3% esquiva.'},
 shell:{name:'Casco ancestral',cost:340,stock:2,attributes:{vit:8},stats:{armor:2},description:'+8 VIT e +2 armadura.'},
 ember:{name:'Broche de obsidiana',cost:350,stock:2,stats:{fireResist:.5},attributes:{str:3},description:'−50% dano de lava/queimadura e +3 STR.'},
 scarf:{name:'Cachecol polar',cost:350,stock:2,stats:{coldResist:.5},attributes:{int:3},description:'−50% dano de frio; reduz lentidão ambiental pela metade. +3 INT.'},
 solar:{name:'Lâmina do sol errante',cost:1300,stock:1,stats:{damage:18},effect:'solar',inspiration:'Radiance',description:'+18 dano físico. Aura de fogo: 12 dano/s em 3,5m. Inspirada no conceito de Radiance; valores próprios do coliseu.'},
 stormcoil:{name:'Bobina da tormenta',cost:1200,stock:1,stats:{damage:9,attackSpeed:.1},effect:'stormcoil',inspiration:'Maelstrom',description:'+9 dano físico, +10% velocidade de ataque. Acertos primários têm 25% de chance de um relâmpago de 35 de dano, até 3 alvos, −20% por salto. Inspirada em Maelstrom; valores próprios.'},
 mirror:{name:'Couraça do contragolpe',cost:850,stock:1,stats:{armor:4,damage:6},effect:'mirror',active:true,inspiration:'Blade Mail',description:'+4 armadura e +6 dano físico. Ativar: reflete 35% do dano de inimigos por 4s; recarga 25s, sem mana. Não reflete ambiente ou reflexão. Inspirada em Blade Mail; valores próprios.'},
 restoration:{name:'Relicário do recomeço',cost:1000,stock:1,stats:{armor:2,manaRegen:.5},effect:'restoration',active:true,inspiration:'Mekansm',description:'+2 armadura e +0,5 mana/s. Ativar: cura 150 vida do portador e aliados em 6m, custa 75 mana; recarga 30s. Não ressuscita. Inspirado em Mekansm; valores próprios.'},
 potion:{name:'Poção de vida',cost:80,stock:12,consumable:true,heal:300,description:'Restaura 300 vida. Até 3 cargas por espaço. Recarga de poções: 10s.'},
 manapot:{name:'Poção de mana',cost:70,stock:12,consumable:true,mana:200,description:'Restaura 200 mana. Até 3 cargas por espaço. Recarga de poções: 10s.'},
 xpbook:{name:'Caderno do aprendiz',cost:350,stock:3,consumable:true,xp:80,description:'Concede 80 experiência ao herói. Consumível usado somente durante o mercado; não aciona a recarga de poções. Não recebe melhorias ou encantamentos.'},
 epicbook:{name:'Tomo das grandes provas',cost:900,stock:1,consumable:true,xp:200,description:'Concede 200 experiência ao herói. Consumível raro usado somente durante o mercado; não aciona a recarga de poções. Não recebe melhorias ou encantamentos.'}
};
const NORDIC_ITEM_NAMES={vitality:'Cinturão de Megingjord',blade:'Garras de Fenrir',mana:'Âmbar de Mimir',armor:'Anel de Asgard',mask:'Máscara de Hel',talisman:'Talismã de Hugin',gloves:'Manoplas de Ullr',crown:'Coroa de Valhalla',staff:'Cajado de Seidr',bow:'Arco de Skadi',boots:'Passos de Sleipnir',charm:'Runa das Nornas',shell:'Escama de Jormungand',ember:'Broche de Muspelheim',scarf:'Manto de Skadi',solar:'Lâmina de Sol',stormcoil:'Bobina de Mjolnir',mirror:'Couraça de Tyr',restoration:'Sino de Eir',potion:'Elixir de Eir',manapot:'Hidromel de Mimir',xpbook:'Tabuleta do Aprendiz',epicbook:'Saga dos Nove Reinos'};
for(const [key,name]of Object.entries(NORDIC_ITEM_NAMES))ITEMS[key].name=name;
for(const key of ['blade','mana','armor'])ITEMS[key].description=ITEMS[key].description.split(' Referência:')[0];
ITEMS.mask.description='20% roubo de vida físico, inclusive em ataques à distância.';
ITEMS.talisman.description='+10% crítico, multiplicador mínimo 2× e +3 LUK.';
ITEMS.crown.description='+5 nos seis atributos.';
ITEMS.solar.description='+18 dano físico. Uma aura solar causa 12 dano de fogo por segundo em inimigos a até 3,5m.';
ITEMS.stormcoil.description='+9 dano físico e +10% velocidade de ataque. Acertos primários têm 25% de chance de lançar um relâmpago de 35 de dano em até 3 alvos; perde 20% por salto.';
ITEMS.mirror.description='+4 armadura e +6 dano físico. Ativar: reflete 35% do dano de inimigos por 4s; recarga 25s, sem mana. Não reflete ambiente ou outra reflexão.';
ITEMS.restoration.description='+2 armadura e +0,5 mana/s. Ativar: cura 150 vida do portador e aliados em 6m; custa 75 mana, recarga 30s. Não ressuscita.';
export const ITEM_MAX_LEVEL=5;
const ITEM_ATTRIBUTE_SCALE=[1,1.35,1.7,2.05,2.4];
const ITEM_FLAT_SCALE=[1,1.3,1.65,2.05,2.5];
const ITEM_RATE_SCALE=[1,1.2,1.4,1.6,1.8];
const ITEM_UPGRADE_SCALE=[.6,.9,1.25,1.65];
const roundItem=(value,digits=2)=>Number(value.toFixed(digits));
const formatItem=value=>String(roundItem(value)).replace('.',',');
function equipmentDescription(item){
 const details=Object.entries(item.attributes||{}).map(([key,value])=>`+${value} ${ATTRIBUTES[key]?.short||key.toUpperCase()}`);
 for(const [key,value]of Object.entries(item.stats||{})){
  const flat={damage:'dano físico',mana:'mana máxima',hp:'vida máxima',armor:'armadura',manaRegen:'mana/s'};
  const rates={lifesteal:'roubo de vida físico, inclusive à distância',crit:'chance de crítico',attackSpeed:'velocidade de ataque',moveSpeed:'movimento',evasion:'esquiva comum'};
  if(flat[key])details.push(`+${formatItem(value)} ${flat[key]}`);
  else if(rates[key])details.push(`+${formatItem(value*100)}% ${rates[key]}`);
  else if(key==='critMultiplier')details.push(`multiplicador crítico mínimo ${formatItem(value)}×`);
  else if(key==='fireResist')details.push(`−${formatItem(value*100)}% dano de lava/queimadura`);
  else if(key==='coldResist')details.push(`−${formatItem(value*100)}% dano de frio e lentidão ambiental`);
 }
 const effect=item.effect?equipmentEffectAt(item.effect,item.level):null;
 return `${details.join(' · ')}. ${effect?effect.description+' ':''}Nível ${item.level}/${ITEM_MAX_LEVEL}.`;
}
export function itemAt(key,level=1){
 if(!Object.hasOwn(ITEMS,key))return null;
 const base=ITEMS[key],rank=base.consumable?1:Math.max(1,Math.min(ITEM_MAX_LEVEL,Number.isFinite(level)?Math.floor(level):1));
 const item={...base,key,level:rank};
 if(base.attributes)item.attributes=Object.fromEntries(Object.entries(base.attributes).map(([attribute,value])=>[attribute,Math.round(value*ITEM_ATTRIBUTE_SCALE[rank-1])]));
 if(base.stats)item.stats=Object.fromEntries(Object.entries(base.stats).map(([stat,value])=>{
  let next=value;
  if(stat==='lifesteal')next=Math.min(.4,value+.05*(rank-1));
  else if(stat==='crit')next=Math.min(.18,value+.02*(rank-1));
  else if(stat==='critMultiplier')next=value+.1*(rank-1);
  else if(stat==='fireResist'||stat==='coldResist')next=Math.min(.9,value+.1*(rank-1));
  else if(['attackSpeed','moveSpeed','evasion'].includes(stat))next=value*ITEM_RATE_SCALE[rank-1];
  else next=value*ITEM_FLAT_SCALE[rank-1];
  return[stat,roundItem(next,['damage','mana','hp'].includes(stat)?0:4)];
 }));
 if(rank>1)item.description=equipmentDescription(item);
 return item;
}
export function itemUpgradePrice(key,current=1){
 if(!Object.hasOwn(ITEMS,key)||ITEMS[key].consumable||!Number.isInteger(current)||current<1||current>=ITEM_MAX_LEVEL)return null;
 return Math.round(ITEMS[key].cost*ITEM_UPGRADE_SCALE[current-1]);
}
export const KEYS=['Q','W','E','R','D','F','C'];
export const levelOf=(u,key)=>u.skillLevels?.[key]||(u.skills?.includes(key)?1:0);
export const skillAt=(key,level=1)=>SKILLS[key]?{...SKILLS[key],...SKILLS[key].levels[Math.max(0,Math.min(4,level-1))],level}:null;
export const upgradePrice=(key,current=0)=>Math.round(SKILLS[key].cost*(1+current*.55));
export const skillRequirement=level=>level*2-1;
export function skillDescription(key,level=1){const s=skillAt(key,level);if(!s)return '';const details=[];for(const [k,label]of Object.entries({mana:'Mana',cooldown:'Recarga (s)',damage:'Dano base',heal:'Cura',shield:'Barreira',hp:'Vida',armor:'Armadura',pulses:'Pulsos',jumps:'Saltos',stun:'Atordoamento (s)',heroStun:'Atordoamento em heróis (s)',distance:'Alcance (m)',bounces:'Ricochetes',push:'Empurrão (m)',pull:'Puxão (m)',poison:'Veneno/s',burn:'Queimadura/s',radius:'Raio/alcance (m)',projectileSpeed:'Vel. projétil (m/s)',count:'Alvos/unidades',duration:'Duração (s)',manaRegen:'Mana/s',multiplier:'Crítico ×',summonCount:'Invocações',summonHp:'Vida por aliado',summonDamage:'Dano por aliado',summonRange:'Alcance do aliado (m)',summonSpeed:'Vel. do aliado (m/s)',summonDuration:'Permanência (s)'}))if(s[k]!==undefined)details.push(`${label}: ${s[k]}`);for(const [k,label]of Object.entries({chance:'Chance',lifesteal:'Roubo de vida',attackSpeed:'Vel. ataque',moveSpeed:'Movimento',reflect:'Reflexão',evasion:'Esquiva',cleave:'Área',slow:'Lentidão',rageDamage:'Dano físico adicional',rageSpeed:'Vel. ataque adicional'}))if(s[k]!==undefined)details.push(`${label}: ${Math.round(s[k]*100)}%`);if(s.summonFlying)details.push('Aliado voador');return `${s.description} ${details.join(' · ')}`;}
