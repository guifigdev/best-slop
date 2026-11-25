import test from 'node:test';
import assert from 'node:assert/strict';
import {WARLOCK_SKILLS,wlSkillAt,wlSkillPrice} from '../shared/warlock-catalog.js';
import {Game} from '../shared/simulation.js';
import {warlockSkillPurchase,warlockSkillDetails,warlockSkillTooltipMarkup,warlockAbilitiesMarkup,bindWarlockAbilities,bindWarlockSkillTooltips,warlockColumnLabel} from '../src/warlock-skill-ui.js';

const unit=(extra={})=>({id:1,warlockCharacter:'warlock',gold:100,alive:true,skills:['S000','S002','S001'],skillLevels:{S000:1,S002:2,S001:1},cooldowns:{},...extra});
const state=(phase='shop')=>({options:{mode:'warlock'},warlock:{phase},time:0});

test('inline upgrades use authoritative prices, caps, columns, ring limits and shop phase',()=>{
 const u=unit(),s=state();assert.equal(warlockSkillPurchase(s,u,'S002').price,wlSkillPrice(u,'S002'));assert.equal(warlockSkillPurchase(s,u,'S002').enabled,true);
 assert.equal(warlockSkillPurchase(state('battle'),u,'S002').enabled,false);
 assert.equal(warlockSkillPurchase(s,unit({gold:0}),'S002').enabled,false);
 assert.equal(warlockSkillPurchase(s,u,'S004').enabled,false);
 assert.equal(warlockSkillPurchase(s,u,'S001').enabled,false);
 assert.equal(warlockSkillPurchase(s,u,'__proto__').enabled,false);
 const capped=unit({skillLevels:{S002:WARLOCK_SKILLS.S002.maxLevel}});assert.equal(warlockSkillPurchase(s,capped,'S002').enabled,false);
 capped.wlJordanSkill='S002';assert.equal(warlockSkillPurchase(s,capped,'S002').enabled,true);
 capped.wlJordanSkill='S000';assert.equal(warlockSkillPurchase(s,capped,'S002').enabled,false);
 capped.wlJordanPending=true;assert.equal(warlockSkillPurchase(s,capped,'S002').enabled,true);
 capped.skillLevels.S002=WARLOCK_SKILLS.S002.maxRingLevel;assert.equal(warlockSkillPurchase(s,capped,'S002').enabled,false);
});

test('offered inline upgrade matches the real purchase command and next tooltip rank',()=>{
 const game=new Game(102,{mode:'warlock'});game.addPlayer('p','warlock');game.addPlayer('q','heretic');game.initWarlock();const u=game.player('p'),before=u.gold,s=game.snapshotFor('p');
 const offer=warlockSkillPurchase(s,u,'S000');assert.equal(offer.enabled,true);assert.equal(warlockSkillDetails(s,u,'S000').nextRank,2);
 assert.equal(game.command('p',{type:'wlBuy',skill:'S000'}),true);assert.equal(u.gold,before-offer.price);assert.equal(u.skillLevels.S000,2);
});

test('details expose real current/next values and omit meaningless zero damage and fabricated mana',()=>{
 const u=unit(),d=warlockSkillDetails(state(),u,'S002'),cooldown=d.rows.find(r=>r.label==='Recarga');
 assert.equal(cooldown.current,wlSkillAt('S002',2).cooldown.toLocaleString('pt-BR')+' s');assert.equal(cooldown.next,wlSkillAt('S002',3).cooldown.toLocaleString('pt-BR')+' s');
 assert.equal(d.rows.find(r=>r.label==='Dano base').current,'7,8');assert.equal(d.nextRank,3);
 const teleport=warlockSkillDetails(state(),unit({skills:['S011'],skillLevels:{S011:1}}),'S011');assert.ok(!teleport.rows.some(r=>r.label==='Dano base'));assert.ok(!teleport.rows.some(r=>r.label==='Mana'));
 const frost=warlockSkillDetails(state(),unit({skills:['W_FROST_BOLT'],skillLevels:{W_FROST_BOLT:1}}),'W_FROST_BOLT');assert.ok(frost.rows.some(r=>r.label==='Lentidão'));
 assert.equal(warlockSkillDetails(state(),u,'invalid'),null);assert.equal(warlockSkillTooltipMarkup(state(),u,'invalid'),'');
 const unlearned=warlockSkillDetails(state(),u,'S011');assert.equal(unlearned.rank,0);assert.equal(unlearned.nextRank,1);assert.equal(unlearned.rows.find(r=>r.label==='Recarga').current,'—');
 const personal=warlockSkillDetails(state(),u,'S001');assert.equal(personal.nextRank,null);assert.ok(!personal.rows.some(r=>r.label==='Alcance'));
});

test('ability bar keeps keyboard columns and cast compatibility while + is shop-only',()=>{
 const u=unit(),shop=warlockAbilitiesMarkup(state(),u),battle=warlockAbilitiesMarkup(state('battle'),u,{aim:'S002'});
 assert.match(shop,/data-legacy-cast="S002"/);assert.match(shop,/data-wl-skill-tooltip="S002"/);assert.match(shop,/data-wl-upgrade="S002"\s+aria-label="Melhorar/);
 assert.match(battle,/data-wl-upgrade="S002" hidden disabled/);assert.match(battle,/ability\s+active[^>]+data-legacy-cast="S002"/);assert.match(shop,/data-wl-upgrade="S001" hidden disabled/);
 assert.equal((shop.match(/data-legacy-cast=/g)||[]).length,u.skills.length);assert.ok(shop.indexOf('data-legacy-cast="S000"')<shop.indexOf('data-legacy-cast="S002"'));assert.ok(shop.indexOf('data-legacy-cast="S002"')<shop.indexOf('data-legacy-cast="S001"'));
 assert.match(warlockSkillTooltipMarkup(state('battle'),unit({cooldowns:{S002:4}}),'S002'),/Em recarga: 4 s/);assert.equal(warlockColumnLabel('R'),'Mobilidade');
});

test('Frost Bolt shows its actual slow duration without inheriting wall geometry/defaults',()=>{
 const u=unit({skills:['W_FROST_BOLT'],skillLevels:{W_FROST_BOLT:1}}),d=warlockSkillDetails(state(),u,'W_FROST_BOLT');
 assert.deepEqual(d.rows.find(r=>r.label==='Duração da lentidão'),{label:'Duração da lentidão',current:'2,5 s',next:'2,75 s'});
 assert.deepEqual(d.rows.find(r=>r.label==='Lentidão'),{label:'Lentidão',current:'40%',next:'40%'});
 assert.ok(!d.rows.some(r=>/parede|^Duração$/.test(r.label)));
 const html=warlockSkillTooltipMarkup(state(),u,'W_FROST_BOLT');assert.doesNotMatch(html,/Comprimento|Espessura|1,25 s/);
 u.skillLevels.W_FROST_BOLT=2;assert.match(warlockSkillDetails(state(),u,'W_FROST_BOLT').description,/40% de lentidão por 2,75 s/);
});

test('wall geometry and status fields follow the wall family actually executed by combat',()=>{
 for(const key of ['W_FIRE_WALL','W_ICE_WALL']){
  const d=warlockSkillDetails(state(),unit({skills:[key],skillLevels:{[key]:1}}),key);
  assert.ok(d.rows.some(r=>r.label==='Comprimento da parede'));assert.ok(d.rows.some(r=>r.label==='Espessura da parede'));assert.ok(d.rows.some(r=>r.label==='Duração da parede'));
  assert.ok(!d.rows.some(r=>/lentidão|^Lentidão$|^Raio$/.test(r.label)),key);
 }
 const fireball=warlockSkillDetails(state(),unit(),'S000');assert.ok(!fireball.rows.some(r=>r.label==='Duração'));assert.ok(fireball.rows.some(r=>r.label==='Raio da explosão'));
 const meteor=warlockSkillDetails(state(),unit({skills:['S008'],skillLevels:{S008:1}}),'S008');assert.equal(meteor.rows.find(r=>r.label==='Aviso antes do impacto').current,'1 s');
 const gravity=warlockSkillDetails(state(),unit({skills:['S018'],skillLevels:{S018:1}}),'S018');assert.equal(gravity.rows.find(r=>r.label==='Tempo de voo').current,'2,65 s');
 const personal=warlockSkillDetails(state(),unit(),'S001');assert.ok(!personal.rows.some(r=>r.label==='Duração'));
});

// A small event/geometry double covers the public binders, including tooltip
// focus, dialog top-layer placement, cleanup, and stale-snapshot click guards.
class Node {
 constructor(doc){this.ownerDocument=doc;this.handlers=new Map();this.attrs=new Map();this.children=[];this.dataset={};this.style={};this.isConnected=true;this.rect={left:250,top:200,bottom:240,width:48,height:40};}
 addEventListener(type,fn){this.handlers.set(type,[...(this.handlers.get(type)||[]),fn]);}
 removeEventListener(type,fn){this.handlers.set(type,(this.handlers.get(type)||[]).filter(f=>f!==fn));}
 fire(type,extra={}){const e={target:this,preventDefault(){},stopPropagation(){},...extra};for(const f of this.handlers.get(type)||[])f(e);}
 append(el){el.parentElement?.children.splice(el.parentElement.children.indexOf(el),1);this.children.push(el);el.parentElement=this;}
 remove(){this.isConnected=false;this.parentElement?.children.splice(this.parentElement.children.indexOf(this),1);}
 contains(el){return el===this||this.children.some(c=>c.contains(el));}
 closest(selector){if(selector==='dialog[open]')return this.dialog||this.parentElement?.closest(selector)||null;if(selector==='[data-wl-skill-tooltip]'&&this.dataset.wlSkillTooltip)return this;if(selector==='[data-wl-upgrade]'&&this.dataset.wlUpgrade)return this;if(selector==='[data-legacy-cast]'&&this.dataset.legacyCast)return this;if(selector==='[data-wl-skill-info]'&&this.info)return this;return this.parentElement?.closest(selector)||null;}
 querySelector(){return this.children.find(c=>c.dataset.legacyCast)||null;}
 matches(){return !!this.dataset.legacyCast;}
 setAttribute(k,v){this.attrs.set(k,String(v));}
 getAttribute(k){return this.attrs.get(k)||null;}
 removeAttribute(k){this.attrs.delete(k);}
 getClientRects(){return this.isConnected?[this.rect]:[];}
 getBoundingClientRect(){return this.rect;}
 showPopover(){this.popoverOpen=true;}
 hidePopover(){this.popoverOpen=false;}
}
function environment(){const doc=new Node();doc.body=new Node(doc);doc.defaultView=new Node();doc.defaultView.innerWidth=400;doc.defaultView.innerHeight=350;doc.createElement=()=>new Node(doc);const root=new Node(doc);doc.body.append(root);return {doc,root};}

test('tooltip handles hover, keyboard focus, dialog top layer, stale anchors and cleanup',()=>{
 const {doc,root}=environment(),anchor=new Node(doc),button=new Node(doc);anchor.dataset.wlSkillTooltip='S002';button.dataset.legacyCast='S002';button.setAttribute('aria-describedby','existing-hint');anchor.append(button);root.append(anchor);
 const ui=bindWarlockSkillTooltips(root,{getState:()=>state(),getUnit:()=>unit()});root.fire('pointerover',{target:button,pointerType:'mouse'});const card=doc.body.children.find(c=>c.className==='wl-skill-tooltip');assert.ok(card.popoverOpen);assert.match(card.innerHTML,/Relâmpago/);assert.match(button.getAttribute('aria-describedby'),/existing-hint wl-skill-tooltip-/);
 root.fire('pointerout',{target:button,relatedTarget:null});assert.equal(card.hidden,true);assert.equal(button.getAttribute('aria-describedby'),'existing-hint');
 doc.activeElement=button;root.fire('focusin',{target:button});assert.equal(card.hidden,false);root.fire('pointerout',{target:button,relatedTarget:null});assert.equal(card.hidden,false);
 const dialog=new Node(doc);anchor.dialog=dialog;ui.update();assert.equal(card.parentElement,dialog);assert.equal(card.popoverOpen,true);assert.ok(parseFloat(card.style.left)>=8);assert.ok(parseFloat(card.style.top)>=8);
 anchor.isConnected=false;ui.update();assert.equal(card.hidden,true);ui.destroy();assert.equal(card.isConnected,false);assert.equal(root.handlers.get('focusin').length,0);
});

test('delegated + never casts, rechecks current shop/gold and repeated binding stays singular',()=>{
 const {doc,root}=environment(),upgrade=new Node(doc),cast=new Node(doc);upgrade.dataset.wlUpgrade='S002';cast.dataset.legacyCast='S002';cast.setAttribute('aria-disabled','false');root.append(upgrade);root.append(cast);let s=state(),u=unit();const sent=[],casts=[],options={getState:()=>s,getUnit:()=>u,send:c=>sent.push(c),onCast:k=>casts.push(k)};
 const ui=bindWarlockAbilities(root,options);assert.equal(bindWarlockAbilities(root,options),ui);root.fire('click',{target:upgrade});assert.deepEqual(sent,[{type:'wlBuy',skill:'S002'}]);assert.deepEqual(casts,[]);root.fire('click',{target:upgrade});assert.equal(sent.length,1);
 upgrade.disabled=false;s=state('battle');root.fire('click',{target:upgrade});assert.equal(sent.length,1);s=state();u.gold=0;root.fire('click',{target:upgrade});assert.equal(sent.length,1);
 root.fire('click',{target:cast});assert.deepEqual(casts,['S002']);cast.setAttribute('aria-disabled','true');root.fire('click',{target:cast});assert.deepEqual(casts,['S002']);ui.destroy();root.fire('click',{target:cast});assert.equal(casts.length,1);assert.equal(doc.handlers.get('keydown').length,0);
});
