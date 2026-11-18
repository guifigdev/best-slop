const profiles={
 knight:{race:'human',raceName:'Humanos',name:'Bjorn, mestre humano',title:'Mestre humano',role:'Infantaria e cerco',description:'Uma capivara construtora que organiza infantaria, cavaleiros e armas de cerco do reino humano.'},
 mage:{race:'elf',raceName:'União Élfica',name:'Liv, artesã élfica',title:'Artesã élfica',role:'Magia e especialização',description:'Uma coelha artesã que ergue os salões da União Élfica e prepara suas forças arcanas.'},
 ranger:{race:'nightelf',raceName:'Elfos Noturnos',name:'Runa, guardiã noturna',title:'Guardiã noturna',role:'Floresta e precisão',description:'Uma raposa guardiã que reúne os elfos noturnos e protege os caminhos de seu povo.'},
 turtle:{race:'naga',raceName:'Nagas',name:'Sten, construtor naga',title:'Construtor naga',role:'Resistência e apoio',description:'Uma tartaruga construtora que traz os exércitos naga e seus monumentos de apoio à batalha.'},
 owl:{race:'north',raceName:'Nórdicos',name:'Vidar, mestre nórdico',title:'Mestre nórdico',role:'Bestas do norte',description:'Uma coruja mestre de obras que convoca as forças nórdicas e suas criaturas das terras geladas.'},
 raccoon:{race:'mech',raceName:'Mecânicos',name:'Eirik, engenheiro mecânico',title:'Engenheiro mecânico',role:'Engenharia e máquinas',description:'Um guaxinim engenheiro que monta oficinas e exércitos mecânicos para enfrentar o castelo rival.'}
};
export const CASTLE_BUILDERS=Object.freeze(Object.fromEntries(Object.entries(profiles).map(([hero,profile])=>[hero,Object.freeze(profile)])));
export function castleBuilderFor(hero){const key=typeof hero==='string'?hero:hero?.hero;return Object.hasOwn(CASTLE_BUILDERS,key)?CASTLE_BUILDERS[key]:null;}
