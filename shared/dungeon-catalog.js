export const DUNGEON_RULES=Object.freeze({partyMax:4,teamsMax:4,cellSize:1.5,width:49,bounds:36.75,interactionRange:2.6,reviveRange:2.8,reviveSeconds:3,exitGatherRange:5,exitVoteSeconds:45,intermissionSeconds:7,clashSeconds:150});
export const DUNGEON_BIOMES=Object.freeze({
 forest:{name:'Raízes de Yggdrasil',floor:0x8d9a70,path:0xa9a17b,wall:0x59694e,trim:0xb7c099,glow:0xc4df9e,sky:0x596c59,enemies:['wolf','hedgehog','ram'],boss:'sphinx'},
 crypt:{name:'Cripta dos Einherjar',floor:0x888b86,path:0x9b9989,wall:0x575e62,trim:0xb7b8a5,glow:0x9fd1cc,sky:0x555e60,enemies:['tortoise','brute','wolf'],boss:'rhino'},
 frost:{name:'Galerias de Niflheim',floor:0xb6c9c8,path:0x8dabae,wall:0x69848d,trim:0xdce4cf,glow:0xb5e9ed,sky:0x718b96,enemies:['wolf','ram','hare'],boss:'rhino'},
 forge:{name:'Fornalha de Muspelheim',floor:0x9e795b,path:0xb5966f,wall:0x635550,trim:0xd0ad7b,glow:0xf1bd72,sky:0x745a50,enemies:['brute','scarab','lion'],boss:'chimera'},
 void:{name:'Fendas de Ginnungagap',floor:0x8f819f,path:0xa995a7,wall:0x554d68,trim:0xc9b6cd,glow:0xe0c0ee,sky:0x5c526a,enemies:['scarab','wolf','chimera'],boss:'sphinx'}
});
export const DUNGEON_RARITIES=Object.freeze({common:{name:'Comum',color:'#c5cfb4'},rare:{name:'Raro',color:'#9cced9'},epic:{name:'Épico',color:'#c4a0da'},legendary:{name:'Lendário',color:'#edc26c'}});
export const DUNGEON_OBJECT_NAMES=Object.freeze({portal:'Passagem para o próximo andar',chest:'Cofre dos viajantes',merchant:'Mercador oculto',shrine:'Santuário de Eir',equipment:'Equipamento',fragment:'Fragmento de técnica',gold:'Bolsa de ouro',corpse:'Companheiro caído'});
