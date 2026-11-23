import {Game} from './simulation.js';
import {modeOptions,capacity,MODES} from './modes.js';
import {roomCharacterChoices} from './room-characters.js';
import {ARENAS} from './arenas.js';
import {roomRoster,waitingRoomProblem,ensureLobbyOpposition,prepareLobbyMarket} from './lobby-catalog.js';
import {applyRoRoomPolicy} from './ro-room-policy.js';

export const ROOM_OPTION_KEYS=Object.freeze(['game','mode','teamSize','teamCount','clashEvery','towerLimit','laneCount','lineTeams','dungeonPartySize','dungeonTeams','dungeonPvp','dungeonLimit','bloodyTeams','bonkWorld','bonkActivity','bonkSkillMode']);
export function lobbyOptions(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!ROOM_OPTION_KEYS.includes(k))||!Object.hasOwn(MODES,input.mode))throw Error('Configuração de jogo inválida.');
 return modeOptions({...input,game:undefined,...(input.mode==='bonk'?{bonkWorld:'dominion'}:{})});
}
export function lobbyStartProblem(game,players){
 if(players.some(p=>!p.bot&&!p.heroChosen))return 'Cada jogador precisa escolher seu personagem.';
 const heroes=game.heroes(),mode=game.options.mode;
 if(['castlefight','treetag','warlock','phasekiller','bloody','linewars'].includes(mode)&&heroes.length<2)return 'Adicione outro jogador ou um bot para iniciar.';
 if(mode==='treetag'&&(!heroes.some(u=>u.treeTagRole==='ent')||!heroes.some(u=>u.treeTagRole==='infernal')))return 'Tree Tag precisa de pelo menos um Ent e um Infernal.';
 if(mode==='bloody'&&new Set(heroes.map(u=>u.btTeam)).size<2)return 'São necessárias duas equipes diferentes.';
 return null;
}
export function createLocalLobby({seed,owner='local',options={mode:'campaign'}}={}){
 let game,stage='waiting',chosen=false,ready=false,messages=[];
 const rebuild=input=>{game=new Game(seed,lobbyOptions(input));game.addPlayer(owner,roomCharacterChoices(game.options.mode)[0].hero,'Você');chosen=false;ready=false;stage='waiting';};rebuild(options);
 const addBots=count=>{for(let i=0;i<count;i++){const index=game.heroes().length,choices=roomCharacterChoices(game.options.mode),choice=game.options.mode==='treetag'&&!game.heroes().some(u=>u.treeTagRole==='infernal')?choices.find(c=>c.role==='infernal')||choices[1]:choices[index%choices.length];game.addPlayer('bot-local-'+game.id(),choice.hero,'Bot '+(index+1),true,null,game.options.mode==='bonk'?{lineage:choice.key}:null);}};
 const activate=()=>{applyRoRoomPolicy(game);ensureLobbyOpposition(game);const problem=lobbyStartProblem(game,api.snapshot().onlineRoom.players);if(problem)throw Error(problem);if(game.options.mode==='bloody'){stage='recruiting';if(!game.player(owner)?.btRoster?.length)return true;}if(prepareLobbyMarket(game)){stage='playing';return true;}const type=game.options.mode==='bonk'?'bkReady':game.options.mode==='dungeon'?'dgReady':'ready';for(const u of game.heroes()){game.command(u.owner,{type});if(game.options.mode==='bonk')break;}stage='playing';return true;};
 const api={get game(){return game;},get started(){return stage==='playing';},get stage(){return stage;},snapshot(){const members=game.heroes().map(u=>({id:u.owner,name:u.owner===owner?'Você':u.name,heroChosen:u.bot||chosen,ready:u.bot||ready,bot:!!u.bot}));return{...game.snapshotFor(owner),onlineRoom:{code:'LOCAL',local:true,lobbyVersion:2,stage,isHost:true,host:owner,started:stage==='playing',protected:false,options:game.options,capacity:capacity(game.options),messages,players:roomRoster(game,members,owner)}};},command(c){
  if(c.type==='roomChat'){messages=[...messages,{name:game.player(owner)?.name||'Você',text:String(c.text||'').slice(0,240)}].slice(-40);return true;}
  if(stage==='playing')return game.command(owner,c);
  if(c.type==='roomSettings'){if(stage!=='waiting')throw Error('As regras ficam fechadas após iniciar.');const bots=game.heroes().filter(u=>u.bot).length;rebuild(c.settings.options);if(Object.hasOwn(ARENAS,c.settings.arena)&&!['bonk','dungeon','bloody','castlefight','treetag','kodotag','phasekiller','warlock'].includes(game.options.mode)){game.startingArena=c.settings.arena;game.setArena(c.settings.arena);}addBots(Math.min(bots,capacity(game.options)-1));return true;}
  if(c.type==='roomReady'){if(stage!=='waiting'||typeof c.ready!=='boolean')throw Error('Marque Pronto na sala de espera.');ready=c.ready;return true;}
  if(c.type==='roomCancelSelection'){if(stage!=='selecting')throw Error('A partida já começou.');stage='waiting';chosen=false;ready=false;return true;}
  if(c.type==='roomChooseHero'){
   if(stage!=='selecting')throw Error('A escolha de personagem abre depois que o host inicia a sala.');
   const choice=roomCharacterChoices(game.options.mode).find(p=>p.key===c.hero);if(!choice)throw Error('Personagem inválido.');const bots=game.heroes().filter(u=>u.bot).map(u=>({hero:u.castleBuilderKey||u.treeTagCharacter||u.warlockCharacter||u.kodoTagCharacter||u.hero,name:u.name,lineage:u.roLineage}));
   const opts=game.options;game=new Game(seed,{...opts,...(opts.mode==='bonk'?{bonkLineage:choice.key}:{})});game.addPlayer(owner,choice.hero,choice.name,false,null,opts.mode==='bonk'?{lineage:choice.key}:null);for(const bot of bots)game.addPlayer('bot-local-'+game.id(),bot.hero,bot.name,true,null,bot.lineage?{lineage:bot.lineage}:null);chosen=true;return true;
  }
  if(c.type==='roomBots'){if(stage!=='waiting')throw Error('Configure bots antes de iniciar.');const free=capacity(game.options)-game.heroes().length,count=c.fill?free:c.count;if(!Number.isInteger(count)||count<1||count>free)throw Error('A sala está cheia.');addBots(count);ready=false;return true;}
  if(c.type==='roomKick'){if(stage!=='waiting')throw Error('Configure vagas antes de iniciar.');const unit=game.player(c.playerId);if(!unit?.bot)throw Error('Só é possível remover bots.');game.units=game.units.filter(u=>u.owner!==c.playerId);delete game.players[c.playerId];ready=false;return true;}
  if(c.type==='roomStart'){if(stage==='waiting'){const problem=waitingRoomProblem(game,api.snapshot().onlineRoom.players);if(problem)throw Error(problem);stage='selecting';return true;}if(stage==='recruiting'){if(!game.player(owner)?.btRoster?.length)throw Error('Recrute pelo menos um grupo antes de iniciar.');return activate();}throw Error('Os jogadores estão escolhendo seus personagens.');}
  if(c.type==='roomSelectionComplete'){if(stage!=='selecting'||!chosen)throw Error('Confirme seu personagem primeiro.');return activate();}
  if(stage==='recruiting'&&!c.type.startsWith('room')){if(['ready','btReady'].includes(c.type))return api.command({type:'roomStart'});return game.command(owner,c);}
  return false;
 }};return api;
}
