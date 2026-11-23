import test from 'node:test';
import assert from 'node:assert/strict';
import {BONK_HELP,bonkUpgradeMarkup,bonkObjectiveMarkup,bonkInteraction,bindBonkJoystick,createBonkUI} from '../src/bonk-ui.js';
import {bloodyBattleMarkup} from '../src/bloody-tournament-ui.js';

const offer={id:4,choices:[{id:'a',kind:'weapon',name:'Arma <nova>',description:'Uma descrição completa, com área, alcance e todas as consequências da melhoria.',skill:'fireball',level:2},{id:'b',kind:'tome',name:'Tomo',description:'Aumenta sua velocidade.',skill:'endurance',level:1,rarity:'rare'},{id:'c',kind:'heal',name:'Banquete',description:'Recupere vida.',skill:'heal'}]};
test('level-up presents every complete choice with keyboard hints, safe text and accessible dialog semantics',()=>{
 const html=bonkUpgradeMarkup(offer);assert.equal((html.match(/data-bk-choice=/g)||[]).length,3);assert.match(html,/aria-modal="true"/);assert.match(html,/aria-labelledby="bonk-choice-title"/);assert.match(html,/Arma &lt;nova&gt;/);assert.ok(html.includes(offer.choices[0].description));assert.match(html,/NÍVEL 2/);assert.match(html,/ENCANTAMENTO · NÍVEL 1 · RARA/);assert.match(html,/RECUPERAÇÃO · IMEDIATA/);assert.doesNotMatch(html,/data-bk-pause|Retomar|skip/);assert.equal(bonkUpgradeMarkup(null),'');assert.match(BONK_HELP,/automaticamente/);
});
test('objectives explain automatic guardian activation and the subsequent central boss without fake interaction buttons',()=>{
 const u={x:0,z:0},b={objectives:[{id:'r1',name:'Runa <um>',x:30,z:40},{id:'r2',name:'Dois',x:40,z:0,started:true},{id:'r3',name:'Três',x:0,z:40,completed:true}],clearedStages:['forest']},html=bonkObjectiveMarkup(b,u);assert.match(html,/1\/4 regiões · 1\/3 guardiões/);assert.match(html,/50 m · aproxime-se para despertar/);assert.match(html,/Guardião em batalha/);assert.match(html,/Runa libertada/);assert.match(html,/Runa &lt;um&gt;/);assert.doesNotMatch(html,/<button|data-bk-interact/);
 const boss=bonkObjectiveMarkup({...b,bossUnlocked:true}, {x:30,z:40});assert.match(boss,/Volte ao templo central · 50 m/);assert.match(bonkObjectiveMarkup({...b,bossUnlocked:true,bossSpawned:true},u),/Colosso em batalha/);
});
test('contextual E actions are restricted to useful objects and honestly report affordability',()=>{
 const objects=[{id:1,type:'rune'},{id:2,type:'campfire'},{id:3,type:'chest',cost:30},{id:4,type:'shrine',cost:40},{id:5,type:'pot'}];assert.equal(bonkInteraction({objects,nearestObject:1},{gold:100}),null);assert.equal(bonkInteraction({objects,nearestObject:2},{gold:100}),null);const entry=bonkInteraction({objects,nearestObject:3},{gold:20});assert.equal(entry.allowed,false);assert.equal(entry.cost,30);assert.match(entry.description,/relíquia/);assert.equal(bonkInteraction({objects,nearestObject:5},{gold:0}).allowed,true);
});

class Joystick {
 constructor(){this.listeners=new Map();this.firstElementChild={style:{}};this.captured=null;this.releaseCount=0;}
 addEventListener(type,fn){this.listeners.set(type,fn);}removeEventListener(type,fn){if(this.listeners.get(type)===fn)this.listeners.delete(type);}
 getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
 setPointerCapture(id){this.captured=id;}hasPointerCapture(id){return this.captured===id;}releasePointerCapture(id){assert.equal(id,this.captured);this.captured=null;this.releaseCount++;}
 fire(type,extra={}){this.listeners.get(type)?.({pointerId:7,button:0,clientX:50,clientY:50,preventDefault(){},...extra});}
}
test('joystick keeps one captured pointer while HUD values change and always releases on cancel or suspension',()=>{
 const element=new Joystick(),moves=[];let enabled=true;const binding=bindBonkJoystick(element,m=>moves.push(m),()=>enabled);element.fire('pointerdown',{clientX:85});assert.equal(element.captured,7);assert.equal(moves.at(-1).x,1);
 for(let level=2;level<30;level++){bonkUpgradeMarkup({...offer,id:level});element.fire('pointermove',{clientX:85,clientY:85});assert.equal(element.captured,7);assert.ok(Math.abs(Math.hypot(moves.at(-1).x,moves.at(-1).y)-1)<1e-9);}assert.equal(element.listeners.size,5);
 element.fire('pointerdown',{pointerId:9,clientX:0});assert.equal(element.captured,7);element.fire('pointercancel');assert.deepEqual(moves.at(-1),{x:0,y:0});assert.equal(element.captured,null);assert.match(element.firstElementChild.style.transform,/0px,0px/);
 element.fire('pointerdown',{clientX:85});enabled=false;element.fire('pointermove');assert.deepEqual(moves.at(-1),{x:0,y:0});assert.equal(element.captured,null);binding.destroy();assert.equal(element.listeners.size,0);
});
test('paused offers remain selectable while movement, jump, dash and resume cannot bypass the choice',()=>{
 const sent=[],u={id:1,x:0,z:0,gold:20},state={options:{mode:'bonk'},units:[u],players:{me:1},bonk:{stage:'levelup',offer}},ui=createBonkUI({getState:()=>state,getOwner:()=> 'me',send:c=>sent.push(c),getHeld:()=>new Set(['w']),isSuspended:()=>true,togglePause:()=>assert.fail('offer cannot resume without a choice')});
 for(const action of ['jump','dash','interact','pause'])ui.action(action);ui.updateInput(100);assert.deepEqual(sent,[]);ui.choose('invalid');assert.equal(sent.length,0);ui.choose('a');assert.deepEqual(sent.at(-1),{type:'bkChoose',choiceId:'a'});
});
test('Bloody battle summary uses authoritative elemental duels and each troop march stage, with no artificial caps',()=>{
 const state={units:[{bloodyUnit:true,alive:true,owner:'me',btBattleStage:'duel'},{bloodyUnit:true,alive:true,owner:'me',btBattleStage:'advance'},{bloodyUnit:true,alive:true,owner:'me',btBattleStage:'center'}],bloodyTournament:{battlefield:{duels:[{id:0,theme:'fire',status:'cleared',finished:true,winner:2,armies:[{team:2,owners:['me'],names:['A <B>'],remaining:10,health:1234}]}]}}};const html=bloodyBattleMarkup(state,'me');assert.match(html,/Reino da Fornalha/);assert.match(html,/Vitória: A &lt;B&gt;/);assert.match(html,/10 tropas/);assert.match(html,/no duelo/);assert.match(html,/em marcha/);assert.match(html,/no centro/);assert.doesNotMatch(html,/undefined|NaN|maxFood|maxWarbands/);
});
