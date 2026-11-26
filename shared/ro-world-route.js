import {RO_BIOLAB_FLOORS} from './ro-biolab.js';
import {habitatSpecies,RO_HABITAT_BY_KEY,MONSTER_HABITATS} from './ragnarok-habitats.js';
import {MVP_BY_KEY} from './ragnarok-expansion.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
// A compact pilgrimage designed for this survivor, not the official RO3 map or
// an assertion that its gate guardians spawn at these exact locations in RO.
const regions=[
 {key:'prontera',name:'Arredores de Prontera',scene:'grove',habitat:'forest',mvp:'mistress',style:'pastoral',description:'Campos cultivados, muralhas distantes e um caminho que entra na mata.',landmarks:['Portão sul','Pomar das vespas','Ponte dos viajantes'],featured:['poring','lunatic','fabre'],transition:'Os campos dão lugar à floresta de bambus e aos telhados de Payon.'},
 {key:'payon-forest',name:'Floresta de Payon',scene:'grove',habitat:'forest',mvp:'eddga',style:'bamboo',description:'Bosques densos, trilhas orientais e clareiras em torno de um antigo santuário.',landmarks:['Aldeia de Payon','Santuário da floresta','Gruta das lanternas'],featured:['spore','willow','elderwillow','bigfoot','boa'],transition:'Lanternas e raízes marcam a descida para as galerias de Payon.'},
 {key:'payon-cave',name:'Cavernas de Payon',scene:'payon',habitat:'cave',mvp:'tower_1150',style:'burial-cave',description:'Galerias funerárias, madeira antiga e rochas úmidas com saída para o sul árido.',landmarks:['Salão das lápides','Galeria das teias','Santuário lunar'],featured:['poporing','tarou','thiefbug','familiar','andre'],transition:'As rochas ficam claras, o solo perde umidade e a saída revela dunas.'},
 {key:'morroc',name:'Deserto de Morroc',scene:'sands',habitat:'desert',mvp:'phreeoni',style:'sograt',description:'Dunas largas, oásis e ruínas de caravanas; a rota evita um mar de areia vazio.',landmarks:['Oásis da caravana','Arcos de Sograt','Entrada da pirâmide'],featured:['pecopeco','drops','scorpion','muka','hode','golem'],transition:'As dunas sobem em degraus até as escadarias das pirâmides.'},
 {key:'morroc-pyramid',name:'Pirâmides de Morroc',scene:'crypt',habitat:'ruins',mvp:'osiris',style:'sandstone-tomb',description:'Ruínas de arenito, pátios abertos e corredores que conduzem ao trono sepulto.',landmarks:['Átrio dos obeliscos','Pátio das múmias','Trono de Osíris'],featured:['mummy','skeleton','archerskeleton','isis','verit'],transition:'A pedra funerária se abre em desfiladeiros secos rumo a Rachel.'},
 {key:'rachel',name:'Terras de Rachel',scene:'sands',habitat:'desert',mvp:'tower_1785',style:'arunafeltz',description:'Planaltos secos, jardins resistentes e templos protegidos por um caçador noturno.',landmarks:['Estrada do peregrino','Jardim do santuário','Passo de Atroce'],featured:['sleeper','hode','golem','scorpion','grandpeco'],transition:'A estrada sobe; o deserto vira pastagem de altitude sob os observatórios.'},
 {key:'juno',name:'Campos e Observatório de Juno',scene:'geffen',habitat:'arcane',mvp:'tower_1658',style:'highland-observatory',description:'Terraços de altitude, ruínas de pesquisa e uma academia cujas defesas perderam o controle.',landmarks:['Campos de altitude','Academia dos sábios','Observatório abandonado'],featured:['rideword','clock','alarm','sageworm','book'],transition:'Névoa fria ocupa o vale e cristais aparecem nos abrigos rochosos.',adaptation:'O destacamento de Egnigem Cenia é um guardião adaptado de laboratório; não representa um spawn oficial dos campos de Juno.'},
 {key:'ice-cavern',name:'Caverna de Gelo',scene:'glacier',habitat:'icecave',mvp:'hatii',style:'glacial',description:'Grandes galerias azuis, lagos congelados e passagens cobertas de neve acumulada.',landmarks:['Lago congelado','Galeria dos titãs','Covil de Hatii'],featured:['siroma','marin','snowier','gazeti','icetitan'],transition:'O gelo dá lugar a uma faixa de pedra úmida, vapor e basalto antes da lava.'},
 {key:'thor-volcano',name:'Vulcão de Thor',scene:'forge',habitat:'firecave',mvp:'ifrit',style:'volcanic',description:'Basalto monumental, pontes sobre canais de lava e abrigos para ler os ataques de Ifrit.',landmarks:['Ponte de basalto','Forja dos salamandras','Câmara de Ifrit'],featured:['magmaring','knocker','imp','kasa','salamander'],transition:'A lava esfria em rocha escura; os selos de Geffen surgem entre fumarolas.'},
 {key:'geffen',name:'Ruínas Arcanas de Geffen',scene:'geffen',habitat:'arcane',mvp:'doppelganger',style:'mage-ruins',description:'Bibliotecas partidas, jardins de cristais e uma estrada arcana cercada por ruínas.',landmarks:['Biblioteca perdida','Jardim dos cristais','Torre do espelho'],featured:['deviruchi','rideword','clock','alarm','sageworm'],transition:'Os arcos se tornam góticos e as raízes cobrem a estrada para Glast Heim.'},
 {key:'glast-heim',name:'Glast Heim',scene:'crypt',habitat:'haunted',mvp:'tower_1272',style:'gothic',description:'Pátios de castelo, estátuas quebradas e uma igreja escura antes do último caminho.',landmarks:['Pátio da cavalaria','Cemitério da abadia','Catedral do Lorde Sombrio'],featured:['whisper','ghoul','dullahan','raydric','wraith'],transition:'A pedra escura vira mármore antigo e a luz abre caminho para o santuário.'},
 {key:'valhalla',name:'Santuário da Valquíria',scene:'geffen',habitat:'arcane',mvp:'valkyrierandgris',style:'valkyrie-sanctuary',description:'Terraços elevados, colunas luminosas e uma arena ampla com caminhos seguros entre os ataques finais.',landmarks:['Escadaria das asas','Terraço das runas','Trono da Valquíria'],featured:['skeggiold','skogul','frus','angeling','rideword'],transition:'A jornada termina no terraço da Valquíria.',adaptation:'O santuário reúne motivos de Odin e Valhalla; sua posição ao fim da rota é uma composição original deste modo.'}
 ,{key:'lutie',name:'Lutie · Vila da Neve',scene:'glacier',habitat:'icecave',mvp:'hatii',style:'snow-village',description:'Telhados nevados, pinheiros, trenós e uma praça iluminada no vale de Lutie.',landmarks:['Praça do inverno','Vila dos presentes','Estrada da fábrica'],featured:['marin','siroma','snowier','gazeti'],transition:'Uma estrada de presentes e engrenagens leva à fábrica.'},
 {key:'toy-factory',name:'Fábrica de Brinquedos',scene:'payon',habitat:'arcane',mvp:'stormyknight',style:'toy-factory',description:'Galpões de brinquedos, esteiras, caixas coloridas e autômatos de madeira.',landmarks:['Linha de montagem','Depósito dos presentes','Salão do Cavaleiro da Nevasca'],featured:['marionette','rideword','alarm','clock'],transition:'Os portões da fábrica se abrem novamente para a neve de Lutie.'},
 {key:'clock-tower',name:'Torre do Relógio',scene:'geffen',habitat:'arcane',mvp:'tower_1957',style:'clockwork',description:'Grandes relógios, engrenagens de bronze, mecanismos e escadarias antigas.',landmarks:['Pátio dos pêndulos','Sala das engrenagens','Coração do relógio'],featured:['clock','alarm','tower_1270','rideword'],transition:'A escadaria de bronze retorna aos caminhos de Geffen.',adaptation:'O guardião Entweihen é uma adaptação desta expedição, não um spawn oficial da Torre do Relógio.'},
 {key:'thanatos-tower',name:'Torre de Thanatos',scene:'crypt',habitat:'haunted',mvp:'fallenbishop',style:'thanatos',description:'Torres partidas, arcos suspensos, pilares rúnicos e plataformas nas alturas.',landmarks:['Escadaria da agonia','Galeria das memórias','Catedral despedaçada'],featured:['tower_1704','tower_1705','tower_1706','tower_1707','wraith'],transition:'Uma ponte de pedra antiga retorna aos campos de Juno.',adaptation:'O Bispo Caído guarda esta adaptação; não substitui a identidade de Memória de Thanatos.'}
 ,{key:'alberta',name:'Porto de Alberta',scene:'coast',habitat:'coast',mvp:'drake',style:'alberta-harbor',description:'Cais de pedra clara, navios mercantes de velas creme e armazéns de telhados azuis.',landmarks:['Navio do porto','Guindaste dos mercadores','Farol de Alberta'],featured:['hydra','vadon','kukre','plankton','marina'],transition:'Barcos deixam o porto rumo à Ilha das Tartarugas e a Amatsu.',adaptation:'Drake e os naufrágios são reunidos ao porto nesta rota survivor; não representam seu spawn oficial.'},
 {key:'turtle-island',name:'Ilha das Tartarugas',scene:'coast',habitat:'coast',mvp:'tower_1312',style:'turtle-island',description:'Praias tropicais, carapaças monumentais, ruínas aquáticas e ninhos entre palmeiras.',landmarks:['Santuário da carapaça','Ninho da costa','Ruínas do general'],featured:['solider','permeter','freezer','heater','assaulter'],transition:'O atracadouro retorna aos navios de Alberta.'},
 {key:'amatsu',name:'Amatsu · Castelo das Cerejeiras',scene:'grove',habitat:'haunted',mvp:'tower_1492',style:'amatsu-sakura',description:'Muralhas brancas, telhados sobrepostos, portais vermelhos e cerejeiras rosadas.',landmarks:['Castelo de Amatsu','Portal das lanternas','Jardim das cerejeiras'],featured:['miyabidoll','firelock','shinobi','tengu','karakasa'],transition:'A doca das cerejeiras leva de volta a Alberta.'},
 {key:'comodo',name:'Comodo · Praia e Grutas',scene:'coast',habitat:'coast',mvp:'tower_1312',style:'comodo-beach',description:'Cabanas sobre palafitas, tochas, conchas gigantes e a boca escura de uma gruta costeira.',landmarks:['Gruta da praia','Palco das conchas','Aldeia das palafitas'],featured:['alligator','medusa','crab','shellfish','cornutus'],transition:'As praias dão lugar às raízes gigantes de Umbala.',adaptation:'O General Tartaruga é um guardião adaptado desta gruta; não representa Tao Gunka ou seu spawn oficial.'},
 {key:'umbala',name:'Umbala · Árvore dos Wootan',scene:'grove',habitat:'forest',mvp:'baphomet',style:'umbala-canopy',description:'Árvores gigantes com casas elevadas, máscaras de madeira, cordas e tambores Wootan.',landmarks:['Árvore da aldeia','Ponte das máscaras','Tambores dos Wootan'],featured:['wootanshooter','wootanfighter','stoneshooter','woodengolem','dryad'],transition:'As raízes escurecem na passagem para Niflheim.',adaptation:'Baphomet é o guardião desta ligação survivor; não é apresentado como MVP oficial de Umbala.'},
 {key:'niflheim',name:'Niflheim · Cidade dos Mortos',scene:'crypt',habitat:'haunted',mvp:'fallenbishop',style:'niflheim-hollows',description:'Casas tortas, abóboras iluminadas, cercas retorcidas e uma torre assombrada.',landmarks:['Casa dos mortos','Jardim das abóboras','Campanário fantasma'],featured:['dullahan','loliruri','heirozoist','disguise','gibbet'],transition:'A passagem entre raízes retorna a Umbala.',adaptation:'O Bispo Caído é um guardião adaptado; não substitui a identidade do Lord of Death.'}

,...RO_BIOLAB_FLOORS
];

export const RO_LEGACY_ROUTE_SIZE=16;
export const RO_WORLD_ROUTE=freeze(regions.map((region,index)=>({...region,index,entry:{x:0,z:96},exit:{x:0,z:-101},corridor:{width:18,length:28},bossArena:{x:0,z:-64,radius:28},previousKey:index<RO_LEGACY_ROUTE_SIZE?regions[index-1]?.key||null:null,nextKey:index<RO_LEGACY_ROUTE_SIZE-1?regions[index+1]?.key||null:null})));
export const RO_WORLD_ROUTE_BY_KEY=freeze(Object.fromEntries(RO_WORLD_ROUTE.map(region=>[region.key,region])));
export const RO_WORLD_ROUTE_SOURCES=freeze({official:'https://ro3global.com/home',developerDiary:'https://www.youtube.com/watch?v=Ewy1ge0a57M',gravity:'https://img.gravity.co.kr/GravityUpload/0000/2026/02/13/Gravity%20IR%20Presentation_2025_4Q_EN.pdf',spawnIdentity:'https://github.com/rathena/rathena/tree/master/npc/pre-re/mobs',policy:'Original connected survivor route inspired by Midgard; not a verified reproduction of the complete RO3 connection graph.'});

export function roRouteIndex(value=0){if(Number.isInteger(value))return value>=0&&value<RO_WORLD_ROUTE.length?value:-1;const key=typeof value==='string'?value:value?.key;return typeof key==='string'&&Object.hasOwn(RO_WORLD_ROUTE_BY_KEY,key)?RO_WORLD_ROUTE_BY_KEY[key].index:-1;}
export function roRouteStage(value=0){const index=roRouteIndex(value);return index<0?null:RO_WORLD_ROUTE[index];}
export function roRouteNext(value=0){const index=roRouteIndex(value);return index<0||index>=RO_LEGACY_ROUTE_SIZE-1?null:RO_WORLD_ROUTE[index+1]||null;}
export const roRouteRegion=roRouteStage,nextRoRegion=roRouteNext;
const hash=(seed,key)=>{let n=Number(seed)>>>0;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
export function roRouteEncounter(value=0,seed=1){
 const region=roRouteStage(value);if(!region)return null;
 if(region.biolabFloor)return freeze({routeKey:region.key,habitat:'biolab',habitatName:'Laboratório de Somatologia',tier:3,species:[...region.species],guardians:region.species.slice(0,3),boss:region.mvp,bossKind:'mvp'});
 const tier=region.index<2?1:region.index<6?2:3,eligible=habitatSpecies(region.habitat,{tier,bosses:false}),featured=region.featured.filter(key=>eligible.includes(key)),rest=eligible.filter(key=>!featured.includes(key)).sort((a,b)=>hash(seed,region.key+':'+a)-hash(seed,region.key+':'+b)||a.localeCompare(b)),species=region.key==='prontera'?featured:[...featured,...rest].slice(0,6+tier*2);
 const strongest=habitatSpecies(region.habitat,{tier:3,bosses:false}),heavy=strongest.filter(key=>['heavy','caster'].includes(MONSTER_HABITATS[key].role)),guardians=(heavy.length?heavy:strongest).slice().sort((a,b)=>hash(seed,a)-hash(seed,b)||a.localeCompare(b)).slice(0,3);
 if(!species.length||!MVP_BY_KEY[region.mvp])throw new Error('Invalid connected Ragnarok region: '+region.key);
 return freeze({routeKey:region.key,habitat:region.habitat,habitatName:RO_HABITAT_BY_KEY[region.habitat].name,tier,species,guardians,boss:region.mvp,bossKind:'mvp'});
}
export function roRouteGate(value=0,open=false){
 const region=roRouteStage(value),next=roRouteNext(value);if(!region||!next)return null;
 return freeze({id:'route-exit-'+region.key,type:'routeGate',...region.exit,w:18,d:4,h:8,width:18,depth:4,open:!!open,locked:!open,nextKey:next.key,nextName:next.name,name:'Passagem para '+next.name,mvp:region.mvp});
}

// Macro placement is an interpretation of the supplied Dominion Grounds
// diorama: arid land to one side, woodland to the other, volcano at their nexus.
// Negative Z is our chosen north for the additional ice branch; it is not an
// assertion that the reference's camera angle establishes an official compass.
export const RO_WORLD_GEOGRAPHY=freeze({
 'thor-volcano':{x:0,z:0},
 'glast-heim':{x:1,z:1},geffen:{x:2,z:1},'payon-cave':{x:3,z:2},'payon-forest':{x:3,z:3},prontera:{x:4,z:4},
 morroc:{x:-1,z:0},'morroc-pyramid':{x:-2,z:-1},rachel:{x:-3,z:-1},
 'biolab-1':{x:-1,z:-1},'biolab-2':{x:-2,z:-1.5},'biolab-3':{x:-3,z:-2},juno:{x:0,z:-1},'ice-cavern':{x:0,z:-2},valhalla:{x:0,z:-3},lutie:{x:-1,z:-2},'toy-factory':{x:-2,z:-2},'clock-tower':{x:2,z:0},'thanatos-tower':{x:1,z:-1},alberta:{x:5,z:4},'turtle-island':{x:5,z:5},amatsu:{x:6,z:4},comodo:{x:-1,z:1},umbala:{x:-1,z:2},niflheim:{x:-1,z:3}
});
export const RO_WORLD_LINKS=freeze([
 {a:'prontera',b:'payon-forest'},
 {a:'payon-forest',b:'payon-cave'},
 {a:'payon-cave',b:'geffen'},
 {a:'geffen',b:'glast-heim'},
 {a:'glast-heim',b:'thor-volcano'},
 {a:'thor-volcano',b:'morroc'},
 {a:'morroc',b:'morroc-pyramid'},
 {a:'morroc-pyramid',b:'rachel'},
 {a:'thor-volcano',b:'juno'},
 {a:'juno',b:'ice-cavern'},
 {a:'ice-cavern',b:'valhalla'},
 {a:'ice-cavern',b:'lutie'},
 {a:'lutie',b:'toy-factory'},
 {a:'geffen',b:'clock-tower'},
 {a:'juno',b:'thanatos-tower'},
 {a:'juno',b:'biolab-1'},
 {a:'biolab-1',b:'biolab-2'},
 {a:'biolab-2',b:'biolab-3'},
 {a:'prontera',b:'alberta'},
 {a:'alberta',b:'turtle-island'},
 {a:'alberta',b:'amatsu'},
 {a:'morroc',b:'comodo'},
 {a:'comodo',b:'umbala'},
 {a:'umbala',b:'niflheim'}
]);
const emptyNeighbors=freeze([]),neighbors=freeze(Object.fromEntries(RO_WORLD_ROUTE.map(region=>[region.key,RO_WORLD_LINKS.flatMap(link=>link.a===region.key?[link.b]:link.b===region.key?[link.a]:[])])));
export function roWorldNeighbors(value=0){const region=roRouteStage(value);return region?neighbors[region.key]:emptyNeighbors;}
function worldGate(region,next){
 const from=RO_WORLD_GEOGRAPHY[region.key],to=RO_WORLD_GEOGRAPHY[next.key],dx=to.x-from.x,dz=to.z-from.z,axis=Math.abs(dx)>=Math.abs(dz)?'x':'z',direction=axis==='x'?{x:Math.sign(dx),z:0}:{x:0,z:Math.sign(dz)};
 return {id:'world-gate-'+region.key+'-'+next.key,type:'routeGate',x:direction.x*101,z:direction.z*101,direction,axis,w:axis==='x'?4:18,d:axis==='x'?18:4,h:8,width:18,depth:4,nextKey:next.key,nextName:next.name,nextScene:next.scene,nextEntry:{x:-direction.x*90||0,z:-direction.z*90||0},name:'Passagem para '+next.name,mvp:region.mvp};
}
const worldRegions=freeze(Object.fromEntries(RO_WORLD_ROUTE.map(region=>{
 const gates=neighbors[region.key].map(key=>worldGate(region,RO_WORLD_ROUTE_BY_KEY[key]));
 return [region.key,{...region,graph:true,position:RO_WORLD_GEOGRAPHY[region.key],bossArena:{x:0,z:0,radius:28},neighborKeys:neighbors[region.key],gates,spokes:gates.map(gate=>({from:{x:0,z:0},to:{x:gate.x,z:gate.z},width:18,direction:gate.direction,nextKey:gate.nextKey}))}];
})));
export function roWorldRegion(value=0,seed){
 const region=roRouteStage(value),base=region?worldRegions[region.key]:null;if(!base||!Number.isFinite(seed))return base;
 const gates=base.gates.map(gate=>{const pair=[base.key,gate.nextKey].sort().join(':'),cave=/cave|factory|tower/.test(pair),offset=cave?((hash(seed,pair)%13)-6)*4:0,x=gate.x+(gate.axis==='z'?offset:0),z=gate.z+(gate.axis==='x'?offset:0);return {...gate,x,z,caveEntrance:cave,nextEntry:{x:-gate.direction.x*90+(gate.axis==='z'?offset:0),z:-gate.direction.z*90+(gate.axis==='x'?offset:0)}};});
 return freeze({...base,gates,spokes:gates.map(gate=>({from:{x:0,z:0},to:{x:gate.x,z:gate.z},width:18,direction:gate.direction,nextKey:gate.nextKey}))});
}
export function roWorldGates(value=0,clearedKeys=[],visitedKeys=[],seed){
 const region=roWorldRegion(value,seed);if(!region)return emptyNeighbors;
 const cleared=new Set(clearedKeys||[]),visited=new Set(visitedKeys||[]),localCleared=cleared.has(region.key),finalReady=RO_WORLD_ROUTE.every(r=>r.key==='valhalla'||cleared.has(r.key));
 return freeze(region.gates.map(gate=>{
  const lockedBy=gate.nextKey==='valhalla'&&!finalReady?'final':visited.has(gate.nextKey)||localCleared?null:'mvp';
  return {...gate,open:lockedBy===null,locked:lockedBy!==null,lockedBy,nextRoute:roWorldRegion(gate.nextKey,seed)};
 }));
}
