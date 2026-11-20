// Original Nordic survivor content. Mechanics take inspiration from automatic
// attack roguelikes; names, statistics, objectives, maps and art are original.
export const BONK_REFERENCE='https://store.steampowered.com/app/3405340/Megabonk/';
export const BONK_RULES=Object.freeze({weaponSlots:4,tomeSlots:4,maxWeaponLevel:8,maxTomeLevel:8,aliveBudget:280,pickupBudget:420,projectileBudget:220,stageSize:230});
const weapon=(key,name,skill,description,damage,cooldown,range,extra={})=>Object.freeze({key,name,skill,description,damage,cooldown,range,...extra});
export const BONK_WEAPONS=Object.freeze({
 runeblade:weapon('runeblade','Lâmina das runas','cleave','Golpes largos à frente. Evoluções ampliam o arco e atravessam grupos.',22,.85,5,{kind:'slash',element:'physical'}),
 ember:weapon('ember','Coração da forja','fireball','Orbes de fogo explodem em área e deixam queimadura.',16,1.25,24,{kind:'projectile',element:'fire',radius:2.7,speed:16}),
 frost:weapon('frost','Agulhas de Niflheim','frostbolt','Fragmentos de gelo perfuram e desaceleram os inimigos.',17,1.1,25,{kind:'projectile',element:'ice',pierce:2,speed:21}),
 storm:weapon('storm','Corrente de Thor','bolt','Relâmpagos saltam entre inimigos próximos.',15,1.6,19,{kind:'chain',element:'lightning'}),
 orbit:weapon('orbit','Escudos de Midgard','thorns','Escudos orbitais atingem quem se aproxima, mesmo durante a fuga.',11,.65,4.4,{kind:'orbit',element:'physical'}),
 thorns:weapon('thorns','Jardim de espinhos','multishot','Rajadas de espinhos espalham veneno e multiplicam projéteis.',13,1.05,24,{kind:'projectile',element:'poison',speed:23}),
 axe:weapon('axe','Machado de retorno','whirlwind','Machados pesados atravessam a horda e voltam ao herói.',24,1.8,20,{kind:'projectile',element:'physical',pierce:5,speed:15,returning:true}),
 void:weapon('void','Sino do vazio','shockwave','Uma onda circular empurra e fere todos ao redor.',35,3.2,8.5,{kind:'pulse',element:'arcane'})
});
const tome=(key,name,skill,description)=>Object.freeze({key,name,skill,description});
export const BONK_TOMES=Object.freeze({
 damage:tome('damage','Tomo da força','battlecry','+12% de dano por nível.'),
 haste:tome('haste','Tomo dos ventos','endurance','+9% de frequência de ataque por nível.'),
 amount:tome('amount','Tomo das constelações','multishot','+1 projétil a cada dois níveis; melhora armas em área.'),
 area:tome('area','Tomo dos gigantes','avatar','+11% de área por nível.'),
 crit:tome('crit','Tomo do destino','critical','+7% de crítico por nível; acima de 100%, críticos adicionais.'),
 magnet:tome('magnet','Tomo da colheita','brilliance','+28% de alcance de coleta e +6% de experiência por nível.'),
 vitality:tome('vitality','Tomo da vida','lifeaura','+18 de vida e regeneração lenta por nível.'),
 speed:tome('speed','Tomo do viajante','sprint','+8% de movimento e menor recarga da esquiva por nível.')
});
const relic=(key,name,skill,description,rarity)=>Object.freeze({key,name,skill,description,rarity});
export const BONK_RELICS=Object.freeze({
 emberseed:relic('emberseed','Semente incandescente','fireball','Queimaduras duram mais e inimigos queimando podem explodir.','rare'),
 frozenheart:relic('frozenheart','Coração de geada','frostnova','Golpes contra inimigos lentos causam +18% de dano por cópia.','rare'),
 thundercoin:relic('thundercoin','Moeda da tempestade','bolt','Críticos têm chance de disparar uma corrente elétrica.','epic'),
 bloodpetal:relic('bloodpetal','Pétala rubra','vampiric','A cada 12 eliminações, recupere vida.','common'),
 luckybell:relic('luckybell','Guizo de Hugin','critical','+5% de crítico e +10% de ouro por cópia.','common'),
 giantbone:relic('giantbone','Osso de gigante','avatar','+10% de área e +8% de vida máxima por cópia.','rare'),
 glassrune:relic('glassrune','Runa de vidro','rage','+22% de dano e -8 de vida máxima por cópia.','epic'),
 travelersboots:relic('travelersboots','Botas do caminho','sprint','+5% de velocidade; esquivar deixa uma explosão.','rare'),
 silvermirror:relic('silvermirror','Espelho de prata','mirror','+1 projétil por cópia nas armas compatíveis.','epic'),
 thorncrown:relic('thorncrown','Coroa de espinhos','thorns','Ao sofrer dano, emita espinhos em área.','common'),
 scholar:relic('scholar','Pergaminho do erudito','brilliance','+12% de experiência e +1 regeneração por cópia.','common'),
 ironacorn:relic('ironacorn','Bolota de ferro','devotion','+2 de armadura por cópia.','common')
});
export const BONK_STAGES=Object.freeze({
 grove:{key:'grove',name:'Bosque dos colossos',biome:'forest',description:'Ruínas entre raízes gigantes, pontes de pedra e clareiras elevadas.',floor:0x628747,path:0xa99e71,wall:0x69735d,accent:0xb5d689,enemySpecies:['rat','spider','scarab','slime','stonebeast'],guardian:'stonebeast',boss:'guardian'},
 forge:{key:'forge',name:'Caldeira dos titãs',biome:'forge',description:'Anéis de basalto, canais de lava, forjas antigas e rampas largas.',floor:0x6e4637,path:0xa57653,wall:0x493b39,accent:0xffbb68,enemySpecies:['firemage','scarab','worm','stonebeast'],guardian:'firemage',boss:'worm'},
 glacier:{key:'glacier',name:'Jardins de Niflheim',biome:'frost',description:'Lagos congelados, pilares de cristal e santuários na neve.',floor:0xa9c8cc,path:0x809da9,wall:0x668795,accent:0xd8f5ed,enemySpecies:['snake','slime','cavebat','archer','guardian'],guardian:'guardian',boss:'stonebeast'}
});
export const BONK_BUILD_EXAMPLES=Object.freeze([
 {name:'Tempestade de agulhas',weapons:['frost','thorns','storm','orbit'],tomes:['amount','haste','crit','magnet'],relics:['frozenheart','thundercoin','silvermirror']},
 {name:'Sol da forja',weapons:['ember','void','runeblade','orbit'],tomes:['damage','area','vitality','haste'],relics:['emberseed','giantbone','bloodpetal']},
 {name:'Peregrino de vidro',weapons:['axe','thorns','storm','void'],tomes:['speed','crit','damage','amount'],relics:['glassrune','travelersboots','luckybell']}
]);
