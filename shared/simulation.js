import {HEROES,SKILLS,ITEMS,ATTRIBUTES,levelOf,skillAt,upgradePrice,skillRequirement} from './catalog.js';
import {ARENAS,arenaForWave} from './arenas.js';
import {baseAttributes,recompute} from './stats.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const BATTLE=new Set(['wave','bonus','final']);
const TERMINAL=new Set(['victory','defeat']);
export class Game {
 constructor(seed=7381){
  this.seed=seed;this.time=0;this.units=[];this.effects=[];this.players={};this.phase='preparation';this.wave=0;this.timer=90;this.serial=0;this.message='Mercado aberto: compre técnicas, equipe itens e distribua atributos.';
  this.arena='forest';this.zones=[];this.nextWeather=8;this.stock={};this.shopVisit=0;this.bonusResults=[];this.winner=null;this.restock();
 }
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 id(){return ++this.serial;}
 fx(type,x,z,extra={}){this.effects.push({id:this.id(),type,x,z,time:this.time,...extra});}
 heroes(){return this.units.filter(u=>u.hero&&!u.summon);}
 player(id){return this.units.find(u=>u.id===this.players[id]);}
 addPlayer(id,type='knight',name='Aventureiro',bot=false){
  if(this.players[id]||!Object.hasOwn(HEROES,type)||Object.keys(this.players).length>=4||this.phase!=='preparation'||this.wave!==0)return false;
  const h=HEROES[type],i=Object.keys(this.players).length;
  const u={id:this.id(),owner:id,hero:type,name:String(name).slice(0,20),bot,team:1,x:-4+i*2.5,z:-10.8,hp:h.hp,maxHp:h.hp,mana:h.mana,maxMana:h.mana,damage:h.damage,armor:h.armor,range:h.range,speed:h.speed,interval:h.interval,cd:0,stun:0,skills:[h.skill],skillLevels:{[h.skill]:1},cooldowns:{},inventory:[],attributes:baseAttributes(type),attributePoints:6,gold:1100,level:1,xp:0,kills:0,alive:true,order:'auto',botBuyAt:this.time+12+i*2};
  recompute(u,this.time);this.players[id]=u.id;this.units.push(u);return true;
 }
 addBots(count=3){const used=this.heroes().map(h=>h.hero),types=['raccoon','owl','turtle','ranger','mage','knight'].filter(t=>!used.includes(t));for(let i=0;i<count;i++){const type=types[i%types.length];this.addPlayer(`bot-${i}`,type,HEROES[type].name,true);}}
 restock(){this.stock=Object.fromEntries(Object.entries(ITEMS).map(([key,v])=>[key,v.stock]));this.shopVisit++;}
 auraFor(u,key){let best=null;for(const hero of this.heroes())if(hero.alive&&hero.team===u.team&&distance(hero,u)<=9&&levelOf(hero,key)){const s=skillAt(key,levelOf(hero,key));if(!best||s.level>best.level)best=s;}return best;}
 refresh(u){recompute(u,this.time,Object.fromEntries(['endurance','devotion','brilliance'].map(k=>[k,this.auraFor(u,k)])));}
 canTarget(u,t){if(!t||!t.alive||u.id===t.id||u.team===t.team)return false;if(this.phase==='bonus')return !!(t.challenge&&t.challenge===u.owner||u.challenge&&u.challenge===t.owner);return true;}
 enemies(u,r=Infinity){return this.units.filter(t=>this.canTarget(u,t)&&distance(u,t)<=r).sort((a,b)=>distance(u,a)-distance(u,b));}
 command(id,c){
  const u=this.player(id);if(!u||!c||typeof c!=='object'||TERMINAL.has(this.phase))return false;
  if(c.type==='attribute'){
   if(!Object.hasOwn(ATTRIBUTES,c.attribute)||u.attributePoints<1||u.attributes[c.attribute]>=99)return false;
   u.attributes[c.attribute]++;u.attributePoints--;this.refresh(u);return true;
  }
  if(c.type==='buy'){
   if(this.phase!=='preparation'||!u.alive||!Object.hasOwn(SKILLS,c.skill))return false;
   const level=levelOf(u,c.skill),cost=upgradePrice(c.skill,level),next=level+1;
   if(level>=5||u.gold<cost||(!level&&u.skills.length>=7)||u.level<skillRequirement(next))return false;
   u.gold-=cost;if(!level)u.skills.push(c.skill);u.skillLevels[c.skill]=next;this.refresh(u);return true;
  }
  if(c.type==='item'){
   const s=Object.hasOwn(ITEMS,c.item)?ITEMS[c.item]:null;
   if(!s||this.phase!=='preparation'||!u.alive||u.gold<s.cost||!(this.stock[c.item]>0))return false;
   const stack=s.consumable&&u.inventory.find(slot=>slot?.key===c.item&&slot.charges<3),empty=u.inventory.findIndex(slot=>!slot);
   if(!stack&&empty===-1&&u.inventory.length>=6)return false;
   u.gold-=s.cost;this.stock[c.item]--;
   if(stack)stack.charges++;else{const slot={key:c.item,charges:1};if(empty>=0)u.inventory[empty]=slot;else u.inventory.push(slot);}
   this.refresh(u);return true;
  }
  if(c.type==='sell'){
   if(this.phase!=='preparation'||!Number.isInteger(c.slot))return false;const slot=u.inventory[c.slot];if(!slot)return false;
   u.gold+=Math.floor(ITEMS[slot.key].cost*.5)*slot.charges;u.inventory[c.slot]=null;this.refresh(u);return true;
  }
  if(c.type==='use'){
   if(!u.alive||!Number.isInteger(c.slot)||(u.potionUntil||0)>this.time)return false;
   const slot=u.inventory[c.slot],item=ITEMS[slot?.key];if(!item?.consumable||(item.heal&&u.hp>=u.maxHp)||(item.mana&&u.mana>=u.maxMana))return false;
   if(item.heal)this.heal(u,item.heal);if(item.mana){u.mana=Math.min(u.maxMana,u.mana+item.mana);this.fx('mana',u.x,u.z,{source:u.id,amount:item.mana});}
   if(--slot.charges<=0)u.inventory[c.slot]=null;u.potionUntil=this.time+10;return true;
  }
  if(!u.alive)return false;
  if(c.type==='ready'&&this.phase==='preparation'){u.ready=true;if(this.heroes().filter(h=>!h.bot).every(h=>h.ready))this.timer=Math.min(this.timer,3);return true;}
  if(['move','attackMove'].includes(c.type)&&Number.isFinite(c.x)&&Number.isFinite(c.z)){this.cancelChannel(u);u.destination={x:clamp(c.x,-14,14),z:clamp(c.z,-14,14)};u.order=c.type;u.target=null;return true;}
  if(c.type==='attack'){const t=this.units.find(t=>t.id===c.target&&this.canTarget(u,t));if(!t)return false;this.cancelChannel(u);u.target=t.id;u.order='attack';u.destination=null;return true;}
  if(c.type==='stop'||c.type==='hold'){this.cancelChannel(u);u.order=c.type;u.destination=null;u.target=null;return true;}
  if(c.type==='auto'){this.cancelChannel(u);u.order='auto';u.destination=null;return true;}
  if(c.type==='cast')return this.cast(u,c);
  return false;
 }
 cancelChannel(u){u.channel=null;for(const e of this.effects)if(e.owner===u.id&&e.channel)e.pulses=0;}
 heal(u,amount){const actual=Math.min(u.maxHp-u.hp,amount);u.hp+=actual;if(actual>0)this.fx('heal',u.x,u.z,{amount:Math.round(actual),source:u.id});return actual;}
 spellDamage(u,damage,element='arcane'){const weather=ARENAS[this.arena];return damage*(u.magicPower||1)*(weather[element]||1);}
 cast(u,c){
  const key=u.skills[c.slot],s=skillAt(key,levelOf(u,key));if(!s||s.kind!=='active'||(u.cooldowns[key]||0)>0||u.mana<s.mana||!BATTLE.has(this.phase)||u.stun>0||!u.alive)return false;
  const t=this.units.find(t=>t.id===c.target&&this.canTarget(u,t));
  if(s.target==='enemy'&&(!t||distance(u,t)>12))return false;
  if(s.target==='ground'&&(!Number.isFinite(c.x)||!Number.isFinite(c.z)||distance(u,c)>14||Math.abs(c.x)>15||Math.abs(c.z)>15))return false;
  this.cancelChannel(u);u.mana-=s.mana;u.cooldowns[key]=s.cooldown;u.castAt=this.time;u.castSkill=key;this.fx('cast',u.x,u.z,{source:u.id,skill:key});
  const hit=(v,n,element)=>this.hit(v,this.spellDamage(u,n,element),u,true),stun=v=>{if((v.avatar||0)<=this.time){v.stun=v.hero?s.heroStun||s.stun:s.stun;this.cancelChannel(v);}};
  if(key==='bolt'){hit(t,s.damage,'lightning');stun(t);this.fx('bolt',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='stomp'){this.fx('stomp',u.x,u.z,{radius:s.radius});for(const e of this.enemies(u,s.radius)){hit(e,s.damage);stun(e);}}
  if(key==='heal')this.heal(u,s.heal*(u.magicPower||1));
  if(key==='chain'){let last=t,from=u;const visited=new Set();for(let i=0;i<s.jumps&&last;i++){visited.add(last.id);hit(last,s.damage*.85**i,'lightning');this.fx('bolt',from.x,from.z,{tx:last.x,tz:last.z});from=last;last=this.enemies(u).filter(e=>!visited.has(e.id)&&distance(from,e)<6)[0];}}
  if(key==='blizzard'){u.channel='blizzard';u.destination=null;u.order='hold';this.effects.push({id:this.id(),type:'blizzard',x:c.x,z:c.z,time:this.time,next:this.time+.25,pulses:s.pulses,damage:this.spellDamage(u,s.damage,'ice'),radius:s.radius,owner:u.id,channel:true,duration:s.pulses+1});}
  if(key==='summon'){this.units=this.units.filter(v=>!(v.summon&&v.owner===u.owner));for(let i=0;i<2;i++)this.units.push({id:this.id(),owner:u.owner,summon:true,kind:'wolf',team:u.team,x:u.x+(i?1:-1),z:u.z+1,hp:s.hp,maxHp:s.hp,damage:s.damage,armor:1,range:1.4,speed:5.6,interval:.8,accuracy:1,critChance:0,cd:0,stun:0,alive:true,expires:this.time+s.duration});this.fx('summon',u.x,u.z);}
  if(key==='multishot')for(const e of this.enemies(u,10).slice(0,s.count)){this.hit(e,s.damage*(1+(u.totalAttributes?.dex||0)*.015),u);this.fx('arrow',u.x,u.z,{tx:e.x,tz:e.z});}
  if(key==='avatar'){u.avatar=this.time+s.duration;u.avatarData={hp:s.hp,armor:s.armor,damage:s.damage};this.refresh(u);this.fx('avatar',u.x,u.z);}
  if(key==='shockwave'){const dx=c.x-u.x,dz=c.z-u.z,len=Math.hypot(dx,dz)||1;for(const e of this.enemies(u,12).filter(e=>{const proj=((e.x-u.x)*dx+(e.z-u.z)*dz)/len;return proj>=0&&Math.abs((e.x-u.x)*dz-(e.z-u.z)*dx)/len<s.radius;}).slice(0,12))hit(e,s.damage);this.fx('shockwave',u.x,u.z,{tx:c.x,tz:c.z,radius:s.radius});}
  if(key==='fireball'){for(const e of this.enemies(u).filter(e=>distance(e,c)<s.radius)){hit(e,s.damage,'fire');this.applyDot(e,'burn',s.burn,4,u);}this.fx('fireball',c.x,c.z,{radius:s.radius});}
  if(key==='frostnova'){for(const e of this.enemies(u,s.radius)){hit(e,s.damage,'ice');e.frostUntil=this.time+s.duration;}this.fx('frostnova',u.x,u.z,{radius:s.radius});}
  if(key==='dash'){const d=distance(u,c)||1,n=Math.min(d,s.distance);u.facing=Math.atan2(c.x-u.x,c.z-u.z);u.x+=Math.sin(u.facing)*n;u.z+=Math.cos(u.facing)*n;u.destination=null;u.order='auto';for(const e of this.enemies(u,2.2))this.hit(e,s.damage,u);this.fx('dash',u.x,u.z);}
  if(key==='drain'){const damage=hit(t,s.damage);this.heal(u,damage*.5);this.fx('drain',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='shield'){u.shield=s.shield*(u.magicPower||1);u.shieldUntil=this.time+s.duration;this.fx('shield',u.x,u.z);}
  return true;
 }
 applyDot(u,key,damage,duration,source=null){u.dots||={};const old=u.dots[key];u.dots[key]={damage,until:this.time+duration,next:old&&old.until>=this.time?old.next:this.time+1,source:source?.id};}
 hit(t,amount,source=null,magic=false,reflect=false,critical=false,environment=false){
  if(!t?.alive||!Number.isFinite(amount)||amount<0)return 0;
  if(magic&&!environment&&(t.avatar||0)>this.time)return 0;
  let dmg=magic?amount:amount/(1+.06*Math.max(0,t.armor||0));
  if((t.shieldUntil||0)>this.time&&t.shield>0){const absorbed=Math.min(t.shield,dmg);t.shield-=absorbed;dmg-=absorbed;}
  const actual=Math.min(t.hp,Math.max(0,dmg));t.hp=Math.max(0,t.hp-dmg);t.hitAt=this.time;
  this.fx('damage',t.x,t.z,{amount:Math.round(actual),magic,critical,source:source?.id,target:t.id,environment});
  if(critical)this.fx('critical',t.x,t.z,{source:source?.id,target:t.id});
  // Resolve death once before retaliation to prevent duplicate kills and reflection recursion.
  if(t.hp<=0){t.alive=false;t.died=this.time;this.cancelChannel(t);if(source&&t.team!==source.team){const p=this.player(source.owner);if(p){p.gold+=12+this.wave;p.kills++;}if(!t.hero&&!t.summon)for(const h of this.heroes())this.gainXp(h,12);}}
  if(!magic&&!reflect&&source?.alive&&source.lifesteal>0){const h=Math.min(source.maxHp-source.hp,actual*source.lifesteal);source.hp+=h;if(h>0)this.fx('lifesteal',source.x,source.z,{amount:Math.round(h),source:source.id,tx:t.x,tz:t.z});}
  if(!magic&&!reflect&&source?.alive&&source.range<3&&(t.reflect||0)>0){this.hit(source,actual*t.reflect,t,true,true);this.fx('thorns',t.x,t.z,{source:t.id,tx:source.x,tz:source.z});}
  return actual;
 }
 gainXp(u,amount){u.xp+=amount;while(u.xp>=u.level*55){u.xp-=u.level*55;u.level++;u.attributePoints+=5+Math.floor(u.level/5);this.refresh(u);this.heal(u,80);this.fx('levelup',u.x,u.z,{source:u.id});}}
 attack(u,t){
  u.attackAt=this.time;u.facing=Math.atan2(t.x-u.x,t.z-u.z);const weather=ARENAS[this.arena];
  const crit=this.random()<(u.critChance||0),accuracy=clamp((u.accuracy??.88)+(weather.accuracy||0)-(t.evasion||0)-(weather.evasion||0),.05,1);
  this.fx(u.range>3?'arrow':'slash',u.x,u.z,{tx:t.x,tz:t.z,source:u.id,target:t.id});
  if(!crit&&this.random()>=accuracy){this.fx('miss',t.x,t.z,{source:u.id,target:t.id});return;}
  const damage=this.hit(t,u.damage*(crit?u.critMultiplier||2:1),u,false,false,crit);
  if(levelOf(u,'bash')){const s=skillAt('bash',levelOf(u,'bash'));if(this.random()<s.chance&&t.alive){this.hit(t,s.damage,u);t.stun=t.hero?s.heroStun:s.stun;this.cancelChannel(t);this.fx('bash',t.x,t.z,{source:u.id});}}
  if(levelOf(u,'cleave')&&u.range<3){const s=skillAt('cleave',levelOf(u,'cleave'));for(const e of this.enemies(u).filter(e=>e.id!==t.id&&distance(t,e)<2.8))this.hit(e,damage*s.cleave,u,true,true);this.fx('cleave',t.x,t.z);}
  if(levelOf(u,'poison')&&t.alive){const s=skillAt('poison',levelOf(u,'poison'));this.applyDot(t,'poison',s.poison,4,u);this.fx('poison',t.x,t.z);}
 }
 setArena(key){this.arena=key;this.zones=ARENAS[key].zones.map((z,i)=>({...z,id:`${key}-${i}`}));this.nextWeather=this.time+8;}
 arenaAt(wave){const keys=Object.keys(ARENAS),start=Math.max(0,keys.indexOf(this.startingArena||'forest'));return keys[(start+Math.floor(Math.max(0,wave-1)/10))%keys.length];}
 restoreHeroes(full=true){for(const [i,u]of this.heroes().entries()){u.alive=true;u.team=1;u.x=-4+i*2.5;u.z=2;u.destination=null;u.target=null;u.order='auto';u.stun=0;u.dots={};u.frostUntil=0;u.vx=0;u.vz=0;this.cancelChannel(u);this.refresh(u);u.hp=full?u.maxHp:Math.min(u.maxHp,u.hp+u.maxHp*.3);u.mana=full?u.maxMana:Math.min(u.maxMana,u.mana+u.maxMana*.3);}}
 spawnWave(){
  this.phase='wave';this.wave++;this.setArena(this.arenaAt(this.wave));this.units=this.units.filter(u=>u.hero&&!u.summon);this.restoreHeroes(this.wave%5===1);this.message=`Onda ${this.wave}/50 · ${ARENAS[this.arena].name}`;
  const kinds=['goblin','duck','frog','hare','brute','ram','bat','tortoise','hedgehog'];const count=Math.min(80,(4+Math.floor(this.wave/3))*this.heroes().length);
  for(let i=0;i<count;i++){const a=this.random()*Math.PI*2,r=11+this.random()*2,kind=kinds[Math.floor(this.random()*Math.min(kinds.length,2+Math.floor(this.wave/3)))],brute=['brute','ram','tortoise'].includes(kind),ranged=kind==='bat';this.spawnEnemy(kind,Math.sin(a)*r,Math.cos(a)*r,{hp:(65+this.wave*16)*(brute?1.6:1),damage:7+this.wave*1.2,armor:brute?3+Math.floor(this.wave/15):Math.floor(this.wave/20),range:ranged?6:1.4,speed:brute?2.4:3.1,interval:ranged?1.8:1.4});}
  if(this.wave%10===0)this.spawnEnemy('champion',0,-10,{hp:600+this.wave*55,damage:25+this.wave*2,armor:5,range:2,speed:2.5,interval:1.5});
 }
 spawnEnemy(kind,x,z,data){const u={id:this.id(),kind,team:2,x,z,hp:data.hp,maxHp:data.hp,damage:data.damage,armor:data.armor||0,range:data.range||1.4,speed:data.speed||2.8,interval:data.interval||1.5,accuracy:.9,evasion:data.evasion||0,cd:this.random(),stun:0,alive:true,...data};this.units.push(u);return u;}
 finishWave(){for(const h of this.heroes()){h.gold+=100+this.wave*12;this.gainXp(h,30);}this.units=this.units.filter(u=>u.hero&&!u.summon);if(this.wave===50){this.phase='finalCountdown';this.timer=12;this.message='50 ondas vencidas. Prepare-se: todos contra todos!';this.restoreHeroes();}
  else if(this.wave%5===0)this.startBonus();else{this.phase='intermission';this.timer=7;this.restoreHeroes(false);this.message='Respire. A próxima onda começa em instantes; loja a cada cinco ondas.';}}
 startBonus(){
  this.phase='bonus';this.bonusStarted=this.time;this.bonusResults=[];this.message='Bônus de velocidade: derrote seus três Ecos. O mais rápido ganha mais ouro!';this.restoreHeroes();
  for(const [i,u]of this.heroes().entries()){const x=i%2?-7:7,z=i<2?-7:7;u.x=x;u.z=z;u.challengeDone=false;for(let j=0;j<3;j++){const a=j/3*Math.PI*2;this.spawnEnemy('bonus',x+Math.cos(a)*3,z+Math.sin(a)*3,{hp:100+this.wave*12,damage:4,challenge:u.owner,range:1.4,speed:1.8});}}
 }
 checkBonus(){for(const u of this.heroes()){if(u.challengeDone)continue;if(!this.units.some(e=>e.alive&&e.challenge===u.owner)){u.challengeDone=true;const elapsed=this.time-this.bonusStarted;this.bonusResults.push({owner:u.owner,name:u.name,time:elapsed});this.fx('bonus',u.x,u.z,{source:u.id});}else if(!u.alive||this.time-this.bonusStarted>=45){u.challengeDone=true;this.bonusResults.push({owner:u.owner,name:u.name,time:null});}}
  if(this.heroes().every(u=>u.challengeDone)){this.bonusResults.sort((a,b)=>(a.time??Infinity)-(b.time??Infinity)||a.owner.localeCompare(b.owner));let rank=0;for(const r of this.bonusResults){r.gold=r.time===null?0:Math.max(120,500-rank++*120);this.player(r.owner).gold+=r.gold;}this.phase='bonusResults';this.timer=8;this.message=`Desafio concluído! ${this.bonusResults.find(r=>r.time!==null)?.name||'Ninguém'} venceu a corrida. Mercado em 8s.`;}}
 openShop(){this.phase='preparation';this.timer=65;this.restock();this.units=this.units.filter(u=>u.hero&&!u.summon);this.restoreHeroes();this.setArena(this.arenaAt(this.wave+1));for(const [i,h]of this.heroes().entries()){h.z=-10.8;h.ready=false;h.botBuyAt=this.time+12+i*2;}this.message='Mercado do coliseu aberto. Estoque compartilhado: quem comprar primeiro leva!';}
 startFinal(){this.units=this.units.filter(u=>u.hero&&!u.summon);this.restoreHeroes();for(const [i,u]of this.heroes().entries()){u.team=10+i;u.x=Math.sin(i/this.heroes().length*Math.PI*2)*8;u.z=Math.cos(i/this.heroes().length*Math.PI*2)*8;}this.phase='final';this.finalStarted=this.time;this.message='Grande final: todos contra todos. Somente um nome no pedestal!';if(this.heroes().length===1)this.finishFinal(this.heroes()[0]);}
 finishFinal(winner){this.phase='victory';this.winner=winner?.owner||null;this.message=winner?`${winner.name} é o herói perfeito do Coliseu das Mil Formas!`:'A final terminou sem sobreviventes.';}
 allocateBot(u){while(u.attributePoints>0){const key=[HEROES[u.hero].focus,'vit','agi','dex','int','str','luk'].find(k=>u.attributes[k]<99);if(!key)break;this.command(u.owner,{type:'attribute',attribute:key});}}
 botThink(u){
  if(this.phase==='preparation'&&this.time>=u.botBuyAt){u.botBuyAt=this.time+2;this.allocateBot(u);const plan=['heal','multishot','vampiric','endurance','critical','devotion'];const up=u.skills.find(key=>levelOf(u,key)<5&&u.level>=skillRequirement(levelOf(u,key)+1));if(up)this.command(u.owner,{type:'buy',skill:up});else{const next=plan.find(key=>!u.skills.includes(key));if(next)this.command(u.owner,{type:'buy',skill:next});}const item=Object.keys(ITEMS).find(k=>!ITEMS[k].consumable&&this.stock[k]>0&&u.gold>=ITEMS[k].cost&&!u.inventory.some(i=>i?.key===k));if(item)this.command(u.owner,{type:'item',item});}
  if(!BATTLE.has(this.phase)||!u.alive)return;
  this.allocateBot(u);
  if(u.hp<u.maxHp*.45){const slot=u.inventory.findIndex(i=>ITEMS[i?.key]?.heal);if(slot>=0)this.command(u.owner,{type:'use',slot});}
  const target=this.enemies(u,12)[0];for(const [slot,key]of u.skills.entries()){const s=skillAt(key,levelOf(u,key));if(s.kind!=='active'||s.heal&&u.hp>u.maxHp*.65)continue;if(!target&&s.target!=='self')continue;if(this.cast(u,{slot,target:target?.id,x:target?.x,z:target?.z}))break;}
 }
 environment(u,dt){
  if(!BATTLE.has(this.phase))return;const active=this.zones.filter(z=>distance(u,z)<z.r);u.sliding=active.some(z=>z.type==='ice');
  if(active.some(z=>z.type==='lava'))this.applyDot(u,'lava',(12+u.maxHp*.015)*(1-(u.fireResist||0)),3);
  if(active.some(z=>z.type==='frost')){u.frostUntil=this.time+2;this.applyDot(u,'frost',(8+this.wave*.3)*(1-(u.coldResist||0)),2);}
  for(const [key,dot]of Object.entries(u.dots||{})){if(dot.until<this.time){delete u.dots[key];continue;}if(dot.next<=this.time){dot.next+=1;const source=this.units.find(v=>v.id===dot.source);this.hit(u,dot.damage,source,true,true,false,!source);this.fx(key,u.x,u.z);}}
  if(this.arena==='tempest')for(const z of active.filter(z=>z.type==='lightning'&&z.strike<=this.time&&!z.hit?.includes(u.id))){z.hit||=[];z.hit.push(u.id);this.hit(u,100+this.wave*2,null,true,true,false,true);this.fx('thunder',z.x,z.z);}
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0)return;this.time+=dt;
  this.effects=this.effects.filter(e=>this.time-e.time<(e.duration|| (e.type==='blizzard'?16:1.1)));
  if(!this.heroes().length||TERMINAL.has(this.phase))return;
  if(['preparation','intermission','bonusResults','finalCountdown'].includes(this.phase)){this.timer-=dt;if(this.timer<=0){if(this.phase==='bonusResults')this.openShop();else if(this.phase==='finalCountdown')this.startFinal();else this.spawnWave();}}
  if(this.arena==='tempest'&&BATTLE.has(this.phase)&&this.time>=this.nextWeather){this.nextWeather=this.time+7;this.zones.push({id:this.id(),type:'lightning',x:this.random()*20-10,z:this.random()*20-10,r:2.2,strike:this.time+2,expires:this.time+3});}this.zones=this.zones.filter(z=>!z.expires||z.expires>this.time);
  for(const e of this.effects.filter(e=>e.type==='blizzard'&&e.pulses>0&&this.time>=e.next)){const owner=this.units.find(u=>u.id===e.owner);if(!owner?.alive||owner.channel!=='blizzard'||owner.stun>0){e.pulses=0;continue;}e.next+=1;e.pulses--;const targets=this.enemies(owner).filter(t=>distance(t,e)<e.radius),damage=e.damage*Math.min(1,5/Math.max(1,targets.length));for(const t of targets)this.hit(t,damage,owner,true);if(e.pulses===0){owner.channel=null;owner.order='auto';}}
  for(const u of [...this.units]){
   if(!u.alive)continue;if(u.expires&&u.expires<this.time){u.alive=false;u.died=this.time;continue;}
   if(u.hero){if(this.time>=(u.nextStats||0)){u.nextStats=this.time+.5;this.refresh(u);}u.mana=Math.min(u.maxMana,u.mana+dt*u.manaRegen*(ARENAS[this.arena].manaRegen||1));u.hp=Math.min(u.maxHp,u.hp+dt*(1.5+(u.totalAttributes.vit||0)*.03));for(const key of Object.keys(u.cooldowns))u.cooldowns[key]=Math.max(0,u.cooldowns[key]-dt);if(u.bot)this.botThink(u);}
   this.environment(u,dt);if(!u.alive)continue;u.cd=Math.max(0,u.cd-dt);u.stun=Math.max(0,u.stun-dt);u.moving=false;if(u.stun>0||u.channel)continue;
   let t=BATTLE.has(this.phase)?this.units.find(t=>t.id===u.target&&this.canTarget(u,t)):null;
   if(!t&&BATTLE.has(this.phase))t=this.enemies(u,u.order==='hold'||u.order==='stop'?u.range:u.hero?9:Infinity)[0];
   let dest=['move','attackMove'].includes(u.order)?u.destination:null;
   if(t&&u.order!=='move'){if(distance(u,t)<=u.range){dest=null;if(u.cd<=0){this.attack(u,t);u.cd=u.interval/(u.attackSpeed||1);}}else if(u.order!=='hold'&&u.order!=='stop')dest=t;}
   let vx=0,vz=0;if(dest){const d=distance(u,dest);if(d>.18){const slow=(u.frostUntil||0)>this.time?1-.45*(1-(u.coldResist||0)):1,speed=u.speed*slow*(ARENAS[this.arena].move||1);u.facing=Math.atan2(dest.x-u.x,dest.z-u.z);vx=Math.sin(u.facing)*Math.min(d/dt,speed);vz=Math.cos(u.facing)*Math.min(d/dt,speed);u.moving=true;}else if(['move','attackMove'].includes(u.order)){u.order='auto';u.destination=null;}}
   if(u.sliding){const blend=1-Math.exp(-dt*2.8);u.vx=(u.vx||0)+(vx-(u.vx||0))*blend;u.vz=(u.vz||0)+(vz-(u.vz||0))*blend;}else{u.vx=vx;u.vz=vz;}u.x=clamp(u.x+u.vx*dt,-14,14);u.z=clamp(u.z+u.vz*dt,-14,14);
  }
  const live=this.units.filter(u=>u.alive);for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j],d=distance(a,b);if(d<.8&&d>.001){const push=(.8-d)*.35,dx=(a.x-b.x)/d,dz=(a.z-b.z)/d;a.x=clamp(a.x+dx*push,-14,14);a.z=clamp(a.z+dz*push,-14,14);b.x=clamp(b.x-dx*push,-14,14);b.z=clamp(b.z-dz*push,-14,14);}}
  if(this.phase==='bonus')this.checkBonus();
  if(this.phase==='wave'){if(!this.heroes().some(u=>u.alive)){this.phase='defeat';this.message='Os Ecos venceram esta tentativa. A próxima build espera.';}else if(!this.units.some(u=>!u.hero&&!u.summon&&u.alive))this.finishWave();}
  if(this.phase==='final'){const alive=this.heroes().filter(u=>u.alive);if(alive.length<=1)this.finishFinal(alive[0]);else if(this.time-this.finalStarted>60){for(const u of alive)this.hit(u,u.maxHp*.02*dt,null,true,true,false,true);if(this.time-this.finalStarted>120)this.finishFinal(alive.sort((a,b)=>b.hp/b.maxHp-a.hp/a.maxHp||a.id-b.id)[0]);}}
  this.units=this.units.filter(u=>u.hero||u.alive||this.time-(u.died||0)<1);
 }
 snapshot(){return {time:this.time,units:this.units,effects:this.effects,players:this.players,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message,stock:this.stock,shopVisit:this.shopVisit,arena:this.arena,zones:this.zones,bonusResults:this.bonusResults,winner:this.winner};}
}
