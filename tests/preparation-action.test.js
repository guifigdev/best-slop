import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {preparationAction,expeditionTimerReadyMarkup,expeditionPreparationClockMarkup} from '../src/preparation-action.js';
import {shopCountdown} from '../src/shop-guide.js';
import {warlockShopCountdownMarkup,warlockPreparationDockMarkup,warlockPreparationDockVisible} from '../src/warlock-round-ui.js';

test('every exposed start capability maps to an actual accepted game command',()=>{
 for(const [mode,hero]of [['campaign','knight'],['tower','knight'],['best','knight'],['war','knight'],['dungeon','knight'],['castlefight','knight'],['treetag','ent'],['kodotag','runner'],['phasekiller','townsperson'],['bonk','knight']]){
  const game=new Game(2,{mode});assert.equal(game.addPlayer('p',hero),true);const action=preparationAction(game.snapshotFor('p'),game.player('p'));assert.ok(action,mode);assert.equal(action.disabled,false,mode);assert.equal(game.command('p',action.command),true,mode);
 }
 const game=new Game(2,{mode:'warlock'});game.addPlayer('p','warlock');game.addPlayer('q','heretic');game.initWarlock();const action=preparationAction(game.snapshotFor('p'),game.player('p'));assert.deepEqual(action.command,{type:'wlReady'});assert.equal(game.command('p',action.command),true);
});

test('waiting, selection, battle, results and modes without a manual start never advertise a start action',()=>{
 const unit={ready:false},base={options:{mode:'campaign'},phase:'preparation'};
 for(const stage of ['waiting','selecting'])assert.equal(preparationAction({...base,onlineRoom:{stage,started:false}},unit),null);
 assert.equal(preparationAction({...base,phase:'wave'},unit),null);assert.equal(preparationAction({...base,options:{mode:'linewars'}},unit),null);assert.equal(preparationAction({...base,options:{mode:'unknown'}},unit),null);assert.equal(preparationAction(base,null),null);
 const war={options:{mode:'warlock'},phase:'preparation',time:10,warlock:{phase:'shop',resultUntil:12}};assert.equal(preparationAction(war,unit),null);war.time=12;assert.equal(preparationAction(war,unit).disabled,false);war.warlock.phase='battle';assert.equal(preparationAction(war,unit),null);
});

test('ready status, troop requirements and Ragnarok host authority are reflected before sending',()=>{
 const bloody={options:{mode:'bloody'},phase:'preparation'};assert.equal(preparationAction(bloody,{btRoster:[]}).disabled,true);assert.equal(preparationAction(bloody,{btRoster:[{id:1}],ready:true}).label,'Pronto · aguardando');assert.equal(preparationAction(bloody,{btRoster:[{id:1}]}).disabled,false);
 const bonk={options:{mode:'bonk'},phase:'preparation',bonk:{stage:'preparation'},onlineRoom:{stage:'playing',started:true,isHost:false}};assert.equal(preparationAction(bonk,{}),null);assert.equal(expeditionTimerReadyMarkup(bonk,{}),'');bonk.onlineRoom.isHost=true;assert.match(expeditionTimerReadyMarkup(bonk,{}),/data-bk-ready/);bonk.bonk.stage='playing';assert.equal(expeditionTimerReadyMarkup(bonk,{}),'');
});

test('every shared preparation clock follows a timer that really advances in its own mode',()=>{
 for(const [mode,hero]of [['campaign','knight'],['tower','knight'],['best','knight'],['war','knight'],['dungeon','knight'],['castlefight','knight'],['treetag','ent'],['kodotag','runner'],['bloody','knight'],['phasekiller','townsperson']]){
  const game=new Game(2,{mode});game.addPlayer('p',hero);game.tick(.1);const before=game.snapshotFor('p'),first=shopCountdown(before);game.tick(1);const after=game.snapshotFor('p'),second=shopCountdown(after);
  assert.ok(first&&second,mode);assert.ok(Math.abs(before.timer-after.timer-1)<1e-6,mode);assert.equal(first.seconds,Math.ceil(before.timer),mode);assert.equal(second.seconds,Math.ceil(after.timer),mode);assert.notEqual(first.text,second.text,mode);
 }
 const game=new Game(2,{mode:'bonk'});game.addPlayer('p','knight');const before=game.snapshotFor('p');game.tick(1);const after=game.snapshotFor('p');assert.equal(before.timer,after.timer);assert.equal(shopCountdown(after),null);const html=expeditionPreparationClockMarkup(after,game.player('p'));assert.match(html,/<b>0:00<\/b><button[^>]*data-bk-ready/);assert.equal((html.match(/data-bk-ready/g)||[]).length,1);assert.doesNotMatch(html,/urgente|automaticamente|próxima prova/);
});

test('Warlock ready controls follow their own clock in both the draggable dock and the shop window',()=>{
 const unit={ready:false},dock=warlockPreparationDockMarkup(unit),shop=warlockShopCountdownMarkup(unit);
 assert.match(dock,/^<div class="wl-preparation-clock"[^>]*>.*data-wl-seconds.*<\/div><button[^>]*data-wl-ready/);
 assert.ok(dock.indexOf('data-wl-ready')<dock.indexOf('data-wl-open'));
 assert.match(shop,/^<div class="wl-shop-countdown"><p>.*data-wl-seconds.*<\/p><button[^>]*data-wl-ready/);
 assert.match(warlockShopCountdownMarkup({ready:true}),/data-wl-ready disabled/);
 const screen={war:{phase:'shop'},result:false};assert.equal(warlockPreparationDockVisible(screen,false),true);assert.equal(warlockPreparationDockVisible(screen,true),false);assert.equal(warlockPreparationDockVisible({...screen,result:true},false),false);assert.equal(warlockPreparationDockVisible({war:{phase:'battle'}},false),false);assert.equal(warlockPreparationDockVisible(null),false);
});
