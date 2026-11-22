import {Game} from './simulation.js';
import {modeOptions,capacity,MODES} from './modes.js';
import {roomCharacterChoices} from './room-characters.js';
import {ARENAS} from './arenas.js';

export const ROOM_OPTION_KEYS=Object.freeze(['game','mode','teamSize','teamCount','clashEvery','towerLimit','laneCount','lineTeams','dungeonPartySize','dungeonTeams','dungeonPvp','dungeonLimit','bloodyTeams','bonkWorld','bonkActivity','bonkSkillMode']);
export function lobbyOptions(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!ROOM_OPTION_KEYS.includes(k))||!Object.hasOwn(MODES,input.mode))throw Error('Configuração de jogo inválida.');
 return modeOptions({...input,game:undefined,...(input.mode==='bonk'?{bonkWorld:'dominion'}:{})});
}
export function lobbyStartProblem(game,players){
 if(players.some(p=>!p.bot&&!p.heroChosen))return 'Cada jogador precisa escolher seu personagem.';
 const heroes=game.heroes(),mode=game.options.mode;
 if(['castlefight','treetag','warlock','phasekiller','bloody'].includes(mode)&&heroes.length<2)return 'Adicione outro jogador ou um bot para iniciar.';
 if(mode==='treetag'&&(!heroes.some(u=>u.treeTagRole==='ent')||!heroes.some(u=>u.treeTagRole==='infernal')))return 'Escolha pelo menos um Ent e um Infernal.';
 if(mode==='bloody'&&new Set(heroes.map(u=>u.btTeam)).size<2)return 'São necessárias duas equipes diferentes.';
 return null;
}
export function createLocalLobby({seed,owner='local',options={mode:'campaign'}}={}){
 let game,started=false,chosen=false,messages=[];
 const rebuild=input=>{game=new Game(seed,lobbyOptions(input));game.addPlayer(owner,roomCharacterChoices(game.options.mode)[0].hero);chosen=false;};rebuild(options);
 return{get game(){return game;},get started(){return started;},snapshot(){return{...game.snapshotFor(owner),onlineRoom:{code:'LOCAL',local:true,isHost:true,host:owner,started,protected:false,options:game.options,capacity:capacity(game.options),messages,players:game.heroes().map(u=>({id:u.owner,name:u.name,hero:u.hero,lineage:u.roLineage,connected:true,host:u.owner===owner,heroChosen:u.bot||chosen,bot:!!u.bot}))}};},command(c){
  if(started)return game.command(owner,c);
  if(c.type==='roomSettings'){const bots=game.heroes().filter(u=>u.bot).length;rebuild(c.settings.options);if(Object.hasOwn(ARENAS,c.settings.arena)&&!['bonk','dungeon','bloody','castlefight','treetag','kodotag','phasekiller','warlock'].includes(game.options.mode)){game.startingArena=c.settings.arena;game.setArena(c.settings.arena);}game.addBots(Math.min(bots,capacity(game.options)-1));return true;}
  if(c.type==='roomChooseHero'){
   const choice=roomCharacterChoices(game.options.mode).find(p=>p.key===c.hero);if(!choice)throw Error('Personagem inválido.');const bots=game.heroes().filter(u=>u.bot).map(u=>({hero:u.hero,name:u.name}));
   const opts=game.options;game=new Game(seed,{...opts,...(opts.mode==='bonk'?{bonkLineage:choice.key}:{})});game.addPlayer(owner,choice.hero,choice.name);for(const bot of bots)game.addPlayer('bot-local-'+game.id(),bot.hero,bot.name,true);chosen=true;return true;
  }
  if(c.type==='roomBots'){const free=capacity(game.options)-game.heroes().length,count=c.fill?free:c.count;if(!Number.isInteger(count)||count<1||count>free)throw Error('A sala está cheia.');game.addBots(count);return true;}
  if(c.type==='roomKick'){const unit=game.player(c.playerId);if(!unit?.bot)throw Error('Só é possível remover bots.');game.units=game.units.filter(u=>u.owner!==c.playerId);delete game.players[c.playerId];return true;}
  if(c.type==='roomChat'){messages=[...messages,{name:game.player(owner)?.name||'Você',text:String(c.text||'').slice(0,240)}].slice(-40);return true;}
  if(c.type==='roomStart'){const problem=lobbyStartProblem(game,this.snapshot().onlineRoom.players);if(problem)throw Error(problem);if(game.options.mode==='bloody'&&!game.player(owner)?.btRoster?.length)throw Error('Recrute seu exército antes de iniciar.');const type=game.options.mode==='bonk'?'bkReady':game.options.mode==='dungeon'?'dgReady':'ready';for(const u of game.heroes()){game.command(u.owner,{type});if(game.options.mode==='bonk')break;}started=true;return true;}
  if(chosen&&!c.type.startsWith('room')){if(['ready','dgReady','bkReady','ttReady','ktReady','pkReady','wlReady','btReady'].includes(c.type))return this.command({type:'roomStart'});return game.command(owner,c);}
  return false;
 }};
}
