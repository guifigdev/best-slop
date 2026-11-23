import {MODES} from './modes.js';

export const LOBBY_GAMES=Object.freeze([
 {key:'survival',name:'Custom Hero',tag:'HERÓIS E COMBINAÇÕES',description:'Monte sua build e enfrente as provas dos Nove Reinos.',modes:['campaign','tower','best','war']},
 {key:'bonk',name:'Ragnarok Survivors',tag:'MIDGARD EM GRUPO',description:'Hordas, classes e equipamentos de Ragnarok. Aventura ou Torre sem Fim.',modes:['bonk']},
 ...['dungeon','castlefight','bloody','linewars','treetag','kodotag','warlock','phasekiller'].map(key=>({key,name:key==='linewars'?'Custom Hero · Line Wars':MODES[key].name,tag:MODES[key].tag,description:MODES[key].description,modes:[key]}))
]);
export function lobbyGameKey(options){return LOBBY_GAMES.find(g=>g.modes.includes(options.mode))?.key||'survival';}
export const LOBBY_COLORS=Object.freeze(['#71b4ff','#f18d83','#9dd183','#dab0f5','#f0d27d','#6dd2cf','#f1a4ca','#c1c8d2']);
export function lobbyTeamKey(options,unit,index=0){
 if(options.mode==='castlefight')return String(index%2+1);
 if(options.mode==='war')return String(unit?.squad||Math.floor(index/options.teamSize)+1);
 if(options.mode==='linewars'&&options.lineTeams)return String(Math.floor(index/2)+1);
 if(options.mode==='bloody'&&options.bloodyTeams)return String(unit?.btTeam||unit?.squad||Math.floor(index/options.teamSize)+1);
 if(options.mode==='treetag')return unit?.treeTagRole==='infernal'?'2':'1';
 if(['bonk','tower','dungeon','kodotag'].includes(options.mode))return 'allies';
 return 'players';
}
export function lobbyTeams(options,players){
 const grouped=new Map();for(const p of players){const key=p.team||'players';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(p);}
 return [...grouped].map(([key,members])=>({key,name:key==='allies'?'Equipe cooperativa':key==='players'?'Jogadores':options.mode==='treetag'?(key==='1'?'Ents · sobreviventes':'Infernals · caçadores'):'Equipe '+key,players:members}));
}
export function roomRoster(game,members,host,connected=()=>true){return [...members].map((m,index)=>{const u=game.player(m.id);return{id:m.id,name:m.heroChosen===false?(m.name||'Jogador '+(index+1)):(u?.name||m.name),connected:!!m.bot||connected(m.id),bot:!!m.bot,ready:!!m.bot||!!m.ready,heroChosen:!!m.bot||m.heroChosen!==false,hero:u?.hero,lineage:u?.roLineage,host:m.id===host,color:LOBBY_COLORS[index%LOBBY_COLORS.length],team:lobbyTeamKey(game.options,u,index)};});}
export function waitingRoomProblem(game,players){
 if(players.some(p=>!p.bot&&!p.connected))return 'Aguarde os jogadores reconectarem ou remova as vagas desconectadas.';
 if(players.some(p=>!p.bot&&!p.ready))return 'Todos os jogadores precisam marcar Pronto.';
 const mode=game.options.mode;
 if(['castlefight','treetag','warlock','phasekiller','bloody','linewars'].includes(mode)&&players.length<2)return 'Adicione outro jogador ou um bot para iniciar.';
 if(mode==='linewars'&&game.options.lineTeams&&players.length!==4)return 'Guerra das Linhas 2 × 2 precisa de quatro jogadores ou bots.';
 return null;
}
// Computers fill the missing side after human choices, never replace a human's
// selected character. This also permits a solo host to choose an Infernal.
export function ensureLobbyOpposition(game){
 const heroes=game.heroes(),bots=heroes.filter(u=>u.bot);
 if(!bots.length)return;
 if(game.options.mode==='treetag')for(const [role,key]of [['ent','ent'],['infernal','blaze']])if(!heroes.some(u=>u.treeTagRole===role)){const bot=bots.find(u=>heroes.filter(v=>v.treeTagRole===u.treeTagRole).length>1);if(bot){game.setupTreeTagPlayer(bot,key);bot.name='Bot · '+(role==='ent'?'Ent':'Infernal');}}
 if(game.options.mode==='bloody'&&game.options.bloodyTeams&&new Set(heroes.map(u=>u.btTeam)).size===1){const bot=bots[0];bot.squad=heroes[0].btTeam===1?2:1;game.setupBloodyPlayer(bot);}
}

// Entering Custom Hero is the first market, not a vote to skip buying gear.
export function prepareLobbyMarket(game){
 if(!['campaign','tower','best','war'].includes(game.options.mode))return false;
 for(const u of game.heroes())u.ready=!!u.bot;
 game.timer=60;game.message='Compre seu primeiro equipamento e prepare suas técnicas. O sino inicia a primeira prova.';
 return true;
}
