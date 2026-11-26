// Source identity is kept separate from the adapted name and our combat budget.
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const circle=(element,radius=5.5)=>({shape:'circle',element,radius,delay:2.3});
const ring=(element,radius=8,inner=3)=>({shape:'ring',element,radius,inner,delay:2.5});
const cone=(element,radius=9)=>({shape:'cone',element,radius,angle:Math.PI*.52,delay:2.2});
const line=(element,length=18,width=3)=>({shape:'line',element,length,width,delay:2.4});
export const RAGNAROK_MVPS=freeze([
 {key:'bio_eremes',id:1647,sourceName:'Assassin Cross Eremes',name:'Eremes Guile · Memória do Mercenário',biomes:['void'],role:'skirmisher',skill:'cleave',element:'poison',unlockWave:38,patterns:[cone('physical',5),circle('poison',4),line('physical',12,2),ring('poison',6,2)]},
 {key:'ifrit',id:1832,sourceName:'Ifrit',name:'Ifrit, Soberano das Brasas',biomes:['forge'],role:'caster',skill:'flamebreath',element:'fire',unlockWave:30,patterns:[cone('fire',10),circle('fire',5),ring('fire',9,4),line('fire')]},
 {key:'valkyrierandgris',id:1751,sourceName:'Valkyrie Randgris',name:'Valquíria Randgrís',biomes:['frost','void'],role:'flyer',skill:'chain',element:'lightning',unlockWave:35,patterns:[line('lightning',20,3),cone('lightning',9),circle('lightning',5),ring('lightning',8,3.5)]},
 {key:'satanmorroc',id:1916,sourceName:'Satan Morroc',name:'Sathán Morrok',biomes:['void'],role:'heavy',skill:'gravity',element:'dark',unlockWave:40,patterns:[circle('dark',6),ring('dark',10,4),cone('dark',11),line('dark',20,4)]},
 {key:'phreeoni',id:1159,sourceName:'Phreeoni',name:'Freeoni, Devorador das Dunas',biomes:['cavern'],role:'heavy',skill:'shockwave',element:'physical',unlockWave:10,patterns:[cone('physical',8),line('physical',16,4),ring('physical',7,3),circle('physical',4)]},
 {key:'baphomet',id:1039,sourceName:'Baphomet',name:'Bafometh, Senhor da Foice',biomes:['forest','void'],role:'heavy',skill:'cleave',element:'dark',unlockWave:25,patterns:[cone('physical',9),line('dark',18,3),ring('dark',8,3),circle('dark',5)]},
 {key:'osiris',id:1038,sourceName:'Osiris',name:'Osíris, Rei Sepulto',biomes:['crypt'],role:'heavy',skill:'poison',element:'poison',unlockWave:15,patterns:[circle('poison',5),cone('physical',8),ring('poison',8,3),line('poison',16,3)]},
 {key:'drake',id:1112,sourceName:'Drake',name:'Draek, Capitão Espectral',biomes:['crypt','void'],role:'caster',skill:'warlockfrost',element:'ice',unlockWave:20,patterns:[line('ice',18,3),cone('physical',8),circle('ice',5),ring('ice',8,3)]},
 {key:'doppelganger',id:1046,sourceName:'Doppelganger',name:'Doppel, Cavaleiro Sombrio',biomes:['crypt','void'],role:'heavy',skill:'cleave',element:'physical',unlockWave:15,patterns:[cone('physical',8),line('physical',18,2.8),circle('dark',4.5),ring('dark',7.5,3)]},
 {key:'amonra',id:1511,sourceName:'Amon Ra',name:'Amon-Rá, Trono Eterno',biomes:['crypt','cavern'],role:'caster',skill:'fireball',element:'fire',unlockWave:25,patterns:[circle('fire',5.5),ring('physical',9,4),line('fire',18,3),cone('physical',9)]},
 {key:'eddga',id:1115,sourceName:'Eddga',name:'Edgar, Tigre da Fumaça',biomes:['forest','forge'],role:'heavy',skill:'flamebreath',element:'fire',unlockWave:10,patterns:[cone('fire',8),circle('physical',4.5),line('fire',16,3),ring('fire',7,3)]},
 {key:'gtb',id:1086,sourceName:'Golden Thief Bug',name:'Escaravelho Áureo',biomes:['cavern'],role:'heavy',skill:'stonehide',element:'physical',unlockWave:10,patterns:[line('physical',14,3),circle('physical',4),cone('physical',8),ring('physical',7,3)]},
 {key:'mistress',id:1059,sourceName:'Mistress',name:'Mistris, Rainha das Vespas',biomes:['forest'],role:'flyer',skill:'chain',element:'lightning',unlockWave:15,patterns:[line('lightning',18,2.5),circle('poison',4.5),ring('lightning',8,3),cone('poison',8)]},
 {key:'maya',id:1147,sourceName:'Maya',name:'Maia, Imperatriz do Formigueiro',biomes:['cavern','forest'],role:'heavy',skill:'venomcloud',element:'poison',unlockWave:20,patterns:[cone('poison',8),circle('poison',5),line('physical',16,3.5),ring('physical',8,3)]},
 {key:'stormyknight',id:1251,sourceName:'Stormy Knight',name:'Cavaleiro da Nevasca',biomes:['frost'],role:'heavy',skill:'blizzard',element:'ice',unlockWave:25,patterns:[line('ice',18,3),cone('ice',9),ring('ice',8,3.5),circle('ice',5)]},
 {key:'hatii',id:1252,sourceName:'Hatii',name:'Hati, Presa do Inverno',biomes:['frost'],role:'heavy',skill:'frostnova',element:'ice',unlockWave:20,patterns:[cone('ice',10),circle('ice',5),line('physical',18,3),ring('ice',8,3)]},
 {key:'fallenbishop',id:1871,sourceName:'Fallen Bishop Hibram',name:'Bispo Caído Hibran',biomes:['crypt','void'],role:'caster',skill:'drain',element:'dark',unlockWave:35,patterns:[line('dark',18,3),ring('dark',9,4),circle('dark',5),cone('dark',9)]},
]);
