import {WARLOCK_POLISH as POLISH,explodeWarlockFireball} from './warlock-polish.js';
import {WARLOCK_BEHAVIOR as BEHAVIOR,warlockLinkAction,breakWarlockLinks,recallWarlockLink,bindWarlockLink,tickWarlockLinks,warlockControlledAim,triggerWarlockVector,reflectWarlockDomeProjectile,reflectWarlockDomeDash,tickWarlockGravity,warlockDomeEntry} from './warlock-behavior.js';
import {WARLOCK_REFERENCE as REF,WARLOCK_CHARACTERS,WARLOCK_SKILLS,WARLOCK_ITEMS,WARLOCK_COLUMNS,wlSkillAt,wlSkillPrice,wlMasteryLevel,wlMasteryPrice} from './warlock-catalog.js';

const SCALE=REF.worldScale,TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
const itemLevel=(u,key)=>u.inventory?.find(i=>i?.key===key)?.level||0;
const casters=game=>game.units.filter(u=>u.warlockCharacter&&!u.wlGhost),alive=game=>casters(game).filter(u=>u.alive),opponents=(game,u)=>alive(game).filter(v=>v.team!==u.team);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/l,0,1):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
const direction=(a,b)=>{const d=dist(a,b)||1;return{dx:(b.x-a.x)/d,dz:(b.z-a.z)/d};};
function setFailure(game,reason){game.commandFailureReason=reason;return false;}
function applyItems(u){
 const boots=itemLevel(u,'boots'),treads=itemLevel(u,'lava_treads'),pendant=itemLevel(u,'pendant'),cape=itemLevel(u,'cape'),helm=itemLevel(u,'helmet');
 u.maxHp=100+pendant*5+itemLevel(u,'cursed_pendant')*10-itemLevel(u,'aegis')*10;
 u.speed=(210+([0,18,29,40][boots]||0)+([0,13,24,35][treads]||0))*SCALE;
 u.wlRegen=REF.regenPerSecond+([0,.2,.35,.45][cape]||0)+(pendant===3?.1:0);
 u.wlKnockbackMultiplier=(helm?1-(.08+.08*helm):1)*(itemLevel(u,'cursed_pendant')?.85:1)*(boots?1.05:1);
 const masteryTotal=wlMasteryLevel(u,'jack');
 u.wlDurationMultiplier=1+.08*wlMasteryLevel(u,'duration');
 u.wlRegen*=1+.05*masteryTotal;
 u.wlKnockbackMultiplier*=1-.025*masteryTotal;
 u.wlRangeMultiplier=1+.12*(wlMasteryLevel(u,'range')-helm);u.hp=Math.min(u.hp,u.maxHp);
 const sword=itemLevel(u,'blood_sword'),character=WARLOCK_CHARACTERS[u.warlockCharacter];u.skillLevels[character.skill]=1+sword;
}
function movePoint(game,u,p){
 const limit=game.warlock.mapRadius-.55,x=clamp(p.x,-limit,limit),z=clamp(p.z,-limit,limit);
 for(const pillar of game.warlock.pillars.filter(v=>v.alive)){const radius=pillar.radius+.47,dx=x-pillar.x,dz=z-pillar.z,d=Math.hypot(dx,dz);if(d<radius){const length=d||1;u.x=pillar.x+dx/length*radius;u.z=pillar.z+dz/length*radius;return;}}
 u.x=x;u.z=z;
}
function hit(game,source,target,amount,dx=0,dz=0,knock=1){
 if(!target?.alive||target.wlGhost||!(amount>0))return 0;
 const warden=.4*(itemLevel(target,'warden')+itemLevel(source||{},'warden'));amount=Math.max(0,amount-warden);
 if((target.wlRushUntil||0)>game.time&&target.wlRushPool>0){const absorb=Math.min(amount*.5,target.wlRushPool);target.wlRushPool-=absorb;amount-=absorb;target.wlRushSpeed=(target.wlRushSpeed||0)+absorb*15*SCALE;}
 if((target.wlAegisUntil||0)>game.time)amount*=.75;
 const actual=Math.min(target.hp,amount);target.hp-=actual;target.damagePoints=(target.damagePoints||0)+actual;target.hitAt=game.time;target.lastDamager=source?.owner;
 const impulse=(100+target.damagePoints)*actual*SCALE*knock*(target.wlKnockbackMultiplier||1)*((target.wlAegisUntil||0)>game.time?.5:1);
 target.wlVx=(target.wlVx||0)+dx*impulse;target.wlVz=(target.wlVz||0)+dz*impulse;
 if(source&&source!==target&&source.alive){
  const stolen=actual*.1*wlMasteryLevel(source,'lifesteal');
  source.hp=Math.min(source.maxHp,source.hp+stolen);
  source.damagePoints=Math.max(0,(source.damagePoints||0)-stolen*.5);
 }
 game.fx('damage',target.x,target.z,{source:source?.id,target:target.id,amount:Math.round(actual*10)/10,magic:true,element:'arcane',warlock:true});
 if(target.hp<=0){target.alive=false;target.died=game.time;target.destination=null;target.channel=null;game.fx('death',target.x,target.z,{target:target.id,source:source?.id,warlock:true});if(source&&source!==target){source.kills++;source.gold+=REF.killGold;}}
 return actual;
}
function field(game,u,key,family,point,radius,duration,extra={}){const entry={id:game.id(),key,skill:key,family,source:u.id,owner:u.owner,team:u.team,x:point.x,z:point.z,radius,until:game.time+duration,...extra};game.warlock.fields.push(entry);return entry;}
function launch(game,u,s,point,extra={}){
 const d=direction(u,point),speed=s.family==='link'?BEHAVIOR.link.speed:s.family==='control'?BEHAVIOR.control.speed:s.family==='gravity'?s.speed||BEHAVIOR.gravity.speed:s.family==='drain'?BEHAVIOR.drain.speed:s.speed||1000*SCALE,range=(s.range||16)*(u.wlRangeMultiplier||1),life=s.family==='gravity'?(s.duration||BEHAVIOR.gravity.duration)*(u.wlRangeMultiplier||1):s.family==='drain'?Math.max(.0001,Math.min(dist(u,point),BEHAVIOR.drain.speed*(u.wlRangeMultiplier||1))/BEHAVIOR.drain.speed):s.family==='link'?(s.flightDuration||BEHAVIOR.link.flightDuration)*(u.wlRangeMultiplier||1):s.family==='control'?BEHAVIOR.control.duration*(u.wlRangeMultiplier||1):s.family==='homing'?4.5*(1+1.5*((u.wlRangeMultiplier||1)-1)):Math.max(.4,range/speed);
 const p={id:game.id(),key:s.key,skill:s.key,family:s.family,source:u.id,owner:u.owner,team:u.team,x:u.x+d.dx*.6,z:u.z+d.dz*.6,dx:d.dx,dz:d.dz,speed,radius:s.family==='link'?s.radius||BEHAVIOR.link.radius:s.family==='control'?BEHAVIOR.control.radius:Math.max(.16,Math.min(.8,s.radius||.4)),damage:itemLevel(u,'staff')&&s.family==='fireball'?5.8+.4*s.level:s.damage,damageMax:s.damageMax,blastRadius:s.blastRadius||0,effectRadius:s.radius,pullRadius:s.pullRadius,damageRadius:s.damageRadius,projectileRadius:s.projectileRadius,visualRadius:s.family==='gravity'?POLISH.gravity.bodyRadius:undefined,duration:s.duration,life,age:0,level:s.level,hitIds:[],...extra};game.warlock.projectiles.push(p);game.fx('cast',u.x,u.z,{source:u.id,element:['fireball','spray','burn','meteor'].includes(s.family)?'fire':'arcane',duration:.2,warlock:true,skill:s.key});return p;
}
function castMelee(game,u,s){
 const w=game.warlock;for(const link of [...w.links||[]])if(link.targetKind==='caster'&&link.target===u.id){const enemy=game.units.find(v=>v.id===link.source&&v.alive&&v.team!==u.team);if(enemy&&dist(enemy,{x:0,z:0})>w.arenaRadius){breakWarlockLinks(game,{sourceId:enemy.id});hit(game,u,enemy,5+Math.max(0,s.level-1),0,0,0);}}u.hp=Math.max(0,u.hp-10);if(u.hp<=0){u.alive=false;u.died=game.time;}
 for(const target of opponents(game,u).filter(v=>dist(v,u)<=250*SCALE)){const d=direction(u,target);const dealt=hit(game,u,target,s.damage,d.dx,d.dz,1-dist(u,target)/(1000*SCALE));if(itemLevel(u,'mask')){u.hp=Math.min(u.maxHp,u.hp+dealt*.2);u.damagePoints=Math.max(0,u.damagePoints-dealt*.1);}
  if(s.family==='redemption'){const x=target.x,z=target.z;movePoint(game,target,{x:u.x-(x-u.x),z:u.z-(z-u.z)});target.wlVx*=-1;target.wlVz*=-1;}
  if(s.family==='bane')field(game,u,s.key,'bane',{x:(u.x+target.x)/2,z:(u.z+target.z)/2},.65,4,{damage:3+1.5*(s.level-1)});
 }
 if(s.family==='ritual')field(game,u,s.key,'mist',u,250*SCALE,4,{heal:1+s.level});
 if(itemLevel(u,'lava_treads')&&dist(u,{x:0,z:0})>w.arenaRadius&&(u.wlLavaReady||0)<=game.time){u.wlLavaUntil=game.time+2+itemLevel(u,'lava_treads');u.wlLavaReady=game.time+28;u.hp=Math.max(u.hp,10);}
 if(itemLevel(u,'aegis'))u.wlAegisUntil=game.time+3;
 game.fx('stomp',u.x,u.z,{source:u.id,radius:250*SCALE,warlock:true});
}
function castSpell(game,u,s,point){
 // Duration affects native buffs/debuffs, not cast warnings or the fixed F windup.
 const durationMultiplier=Math.max(.1,(u.wlDurationMultiplier||1)-(u.wlControl?.until>game.time?.4:0));
 s={...s,duration:Number.isFinite(s.duration)?s.duration*durationMultiplier:s.duration};
 const d=direction(u,point),family=s.family;u.castAt=game.time;u.facing=Math.atan2(d.dx,d.dz);
 if(['shield','rush','dome','mirror'].includes(family))breakWarlockLinks(game,{targetId:u.id,enemyOnly:true});
 if(s.column==='F'){u.channel={key:s.key,until:game.time+.7};u.destination=null;return;}
 u.cooldowns[s.key]=s.cooldown;
 if(family==='teleport'){const length=Math.min(dist(u,point),s.range),from={x:u.x,z:u.z};movePoint(game,u,{x:u.x+d.dx*length,z:u.z+d.dz*length});u.wlVx*=.8;u.wlVz*=.8;u.destination=null;game.fx('blink',from.x,from.z,{source:u.id,tx:u.x,tz:u.z});return;}
 if(family==='lightning'){
  const end={x:u.x+d.dx*s.range*(u.wlRangeMultiplier||1),z:u.z+d.dz*s.range*(u.wlRangeMultiplier||1)},target=opponents(game,u).filter(v=>segmentDistance(v,u,end)<=.47+50*SCALE).sort((a,b)=>dist(u,a)-dist(u,b))[0];
  if(target)hit(game,u,target,s.damage,d.dx,d.dz);game.fx('bolt',u.x,u.z,{source:u.id,target:target?.id,tx:target?.x??end.x,tz:target?.z??end.z,warlock:true});return;
 }
 if(family==='meteor'){const length=Math.min(dist(u,point),s.range*(u.wlRangeMultiplier||1)),landing={x:u.x+d.dx*length,z:u.z+d.dz*length},warning=POLISH.meteor.warning;field(game,u,s.key,'meteor',landing,s.radius,warning,{warnStarted:game.time,fireAt:game.time+warning,damage:s.damage,damageMax:s.damageMax,warning:true});game.fx('castleRescueWarning',landing.x,landing.z,{source:u.id,radius:s.radius,duration:warning});return;}
 if(family==='thrust'){u.wlDash={dx:d.dx,dz:d.dz,remaining:s.range*(u.wlRangeMultiplier||1),damage:s.damage,key:s.key,speed:1300*SCALE};u.destination=null;return;}
 if(family==='windwalk'){u.wlWindUntil=game.time+s.duration;u.wlWindDamage=s.damage;u.wlWindSpeed=200*SCALE;return;}
 if(family==='dome'){const speed=u.wlMoveVx||0,vz=u.wlMoveVz||0;field(game,u,s.key,'dome',u,BEHAVIOR.dome.radius,BEHAVIOR.dome.duration*durationMultiplier,{vx:speed*.5,vz:vz*.5});u.wlControl=null;return;}
 if(family==='shield'){u.wlShieldUntil=game.time+s.duration;u.shieldUntil=u.wlShieldUntil;u.shield=1;u.wlShieldDirectional=family==='dome';u.wlShieldDx=d.dx;u.wlShieldDz=d.dz;return;}
 if(family==='rush'){u.wlRushUntil=game.time+s.duration;u.wlRushPool=5+2*(s.level-1);u.wlRushSpeed=35*SCALE;return;}
 if(family==='timeshift'){u.wlTimeShift={level:s.level,until:game.time+3.5*durationMultiplier,x:u.x,z:u.z,hp:u.hp,damagePoints:u.damagePoints,vx:u.wlVx,vz:u.wlVz};return;}
 if(family==='vector'){u.wlVector={x:u.x,z:u.z,radius:BEHAVIOR.vector.radius,until:game.time+BEHAVIOR.vector.duration*durationMultiplier};return;}
 if(family==='mirror'){
  u.wlMirrorUntil=game.time+s.duration;for(const side of [-1,1])game.units.push({...u,id:game.id(),summon:true,wlGhost:true,wlGhostOf:u.id,wlGhostSide:side,until:u.wlMirrorUntil,inventory:[],x:u.x+side*1.5,hp:1,maxHp:1});return;
 }
 if(family==='repeater'){field(game,u,s.key,'repeater',point,.5,s.duration||2.8,{nextAt:game.time,dx:d.dx,dz:d.dz,damage:s.damage});return;}
 if(family==='burst'){u.channel={key:s.key,until:game.time+2/durationMultiplier,point:{...point}};return;}
 if(family==='spray'){u.wlSpray={key:s.key,remaining:s.missiles||6,nextAt:game.time,point:{...point}};return;}
 launch(game,u,s,point);
 if(family==='fireball')for(const ghost of game.units.filter(v=>v.wlGhost&&v.wlGhostOf===u.id&&v.until>game.time))launch(game,ghost,{...s,damage:1},point,{source:u.id,damage:1});
}

export const WarlockMethods={
 setupWarlockPlayer(u,selection='warlock'){
  const c=own(WARLOCK_CHARACTERS,selection)?WARLOCK_CHARACTERS[selection]:null;if(!c)return false;
  Object.assign(u,{warlockCharacter:selection,name:c.name,hero:'mage',hp:100,maxHp:100,mana:10000,maxMana:10000,speed:210*SCALE,damage:0,armor:0,range:0,interval:1,skills:['S000',c.skill],skillLevels:{S000:1,[c.skill]:1},cooldowns:{},inventory:[],inventorySlots:REF.baseInventorySlots,gold:REF.initialGold,masteries:{duration:0,range:0,lifesteal:0},attributes:{str:0,int:0,dex:0,luk:0,vit:0,agi:0},attributePoints:0,skillPoints:0,level:1,score:0,kills:0,team:u.seat+1,alive:true,ready:false,order:'stop',destination:null,damagePoints:0,wlVx:0,wlVz:0,size:1});applyItems(u);return true;
 },
 initWarlock(){
  if(this.warlock)return this.warlock;const players=casters(this);if(players.length<2)return false;
  this.warlock={phase:'shop',round:0,maxRounds:REF.rounds,arenaRadius:POLISH.arena.radius,mapRadius:POLISH.arena.mapRadius,remaining:30,projectiles:[],fields:[],links:[],results:[],pillars:[{id:this.id(),x:-8,z:-2,radius:.8,hp:25,maxHp:25,alive:true},{id:this.id(),x:8,z:2,radius:.8,hp:25,maxHp:25,alive:true}],adaptedArena:true};
  this.phase='preparation';this.bounds=POLISH.arena.mapRadius;this.arena='fire';this.zones=[];this.obstacles=[];this.message='Warlock: escolha magias por coluna e equipamentos. Bola de fogo e sua magia pessoal já estão disponíveis.';
  for(const [i,u]of players.entries()){u.x=(i-(players.length-1)/2)*3;u.z=0;u.ready=!!u.bot;}return this.warlock;
 },
 warlockCommand(u,c){
  this.commandFailureReason=null;if(!u?.warlockCharacter||!c||typeof c!=='object')return false;
  if(!this.warlock&&!this.initWarlock())return setFailure(this,'Aguarde outro mago entrar.');const w=this.warlock;
  if(['victory','defeat'].includes(this.phase))return false;
  if(c.type==='wlReady'||c.type==='ready'){if(w.phase!=='shop')return false;u.ready=true;if(casters(this).every(v=>v.ready||v.bot))this.startWarlockRound();return true;}
  if(c.type==='wlBuy')return this.warlockBuy(u,c);
  if(c.type==='wlSell'){if(w.phase!=='shop'||!Number.isInteger(c.slot)||!u.inventory[c.slot])return false;const item=u.inventory[c.slot],definition=WARLOCK_ITEMS[item.key];if(item.key==='jordan'||item.key==='staff'||item.key==='scroll')return false;u.gold+=Math.max(0,definition.cost-1)*item.level;u.inventory.splice(c.slot,1);applyItems(u);return true;}
  if(c.type==='wlUseItem')return setFailure(this,'Estes equipamentos são passivos; seus efeitos funcionam automaticamente.');
  if(w.phase!=='battle'||!u.alive)return false;
  if(c.type==='wlStop'||c.type==='stop'){u.destination=null;u.channel=null;u.wlDash=null;return true;}
  if(c.type==='wlMove'||c.type==='move'){if(!Number.isFinite(c.x)||!Number.isFinite(c.z)||Math.abs(c.x)>w.mapRadius||Math.abs(c.z)>w.mapRadius)return false;u.destination={x:c.x,z:c.z};u.channel=null;return true;}
  if(c.type==='wlCast'){
   const key=c.skill??u.skills[c.slot],level=u.skillLevels[key]||0;if(!level||!u.skills.includes(key)||!own(WARLOCK_SKILLS,key))return false;
   if(key==='S019'&&warlockLinkAction(this,u))return recallWarlockLink(this,u);
   if((u.cooldowns[key]||0)>0||u.channel)return setFailure(this,'Aguarde a recarga ou termine a canalização.');
   const s=wlSkillAt(key,level),requested={x:c.x??u.x,z:c.z??u.z},point=warlockControlledAim(this,u,requested);if(!Number.isFinite(point.x)||!Number.isFinite(point.z)||Math.abs(point.x)>w.mapRadius||Math.abs(point.z)>w.mapRadius)return false;
   castSpell(this,u,s,point);return true;
  }return false;
 },
 warlockBuy(u,c){
  if(this.warlock.phase!=='shop')return setFailure(this,'Compre magias e itens entre rodadas.');
  if(c.upgrade==='inventory'){if(u.inventorySlots>=6||u.gold<2)return false;u.gold-=2;u.inventorySlots=6;return true;}
  if(c.mastery){
   const price=wlMasteryPrice(u,c.mastery);if(!Number.isFinite(price))return setFailure(this,'Esta maestria já atingiu o limite, ou não está disponível.');
   if(u.gold<price)return setFailure(this,'Ouro insuficiente para esta maestria.');
   u.gold-=price;u.masteries??={duration:0,range:0,lifesteal:0};
   for(const key of c.mastery==='jack'?['duration','range','lifesteal']:[c.mastery])u.masteries[key]=wlMasteryLevel(u,key)+1;
   applyItems(u);this.fx('levelup',u.x,u.z,{source:u.id,warlock:true});return true;
  }
  if(c.skill){
   if(!own(WARLOCK_SKILLS,c.skill))return false;const s=WARLOCK_SKILLS[c.skill],level=u.skillLevels[c.skill]||0,price=wlSkillPrice(u,c.skill),existing=u.skills.find(k=>WARLOCK_SKILLS[k].column===s.column);
   if(s.column==='F'||existing&&existing!==c.skill)return setFailure(this,'Escolha uma única magia em cada coluna.');
   const max=u.wlJordanSkill===c.skill||u.wlJordanPending?s.maxRingLevel:s.maxLevel;if(level>=max)return setFailure(this,'Esta magia já está no nível máximo disponível.');if(u.gold<price)return setFailure(this,'Ouro insuficiente para esta magia.');
   u.gold-=price;u.skillLevels[c.skill]=level+1;if(!u.skills.includes(c.skill))u.skills.push(c.skill);u.skills.sort((a,b)=>WARLOCK_COLUMNS.indexOf(WARLOCK_SKILLS[a].column)-WARLOCK_COLUMNS.indexOf(WARLOCK_SKILLS[b].column));
   if(u.wlJordanPending){u.wlJordanSkill=c.skill;u.wlJordanPending=false;}this.fx('levelup',u.x,u.z,{source:u.id,warlock:true});return true;
  }
  if(!own(WARLOCK_ITEMS,c.item))return false;const s=WARLOCK_ITEMS[c.item],existing=u.inventory.find(i=>i.key===c.item),level=existing?.level||0;
  if(level>=s.maxLevel)return setFailure(this,'Este equipamento já está no nível máximo.');if(u.gold<s.cost)return setFailure(this,'Ouro insuficiente para este equipamento.');if(!existing&&u.inventory.length>=u.inventorySlots)return setFailure(this,'Inventário cheio. Pesquise Inventário para liberar os espaços restantes.');if(c.item==='aegis'&&itemLevel(u,'blood_sword')||c.item==='blood_sword'&&itemLevel(u,'aegis'))return setFailure(this,'Égide e Espada de sangue não podem ser combinadas.');
  u.gold-=s.cost;if(existing)existing.level++;else u.inventory.push({key:c.item,level:1,charges:1});if(c.item==='jordan')u.wlJordanPending=true;applyItems(u);return true;
 },
 startWarlockRound(){
  const w=this.warlock;if(!w||w.phase!=='shop')return false;w.round++;this.wave=w.round;w.phase='battle';w.remaining=POLISH.arena.roundDuration;w.arenaRadius=POLISH.arena.radius;w.projectiles=[];w.fields=[];w.links=[];this.phase='wave';
  for(const [i,u]of casters(this).entries()){const a=i/casters(this).length*TAU;applyItems(u);Object.assign(u,{x:Math.sin(a)*12,z:Math.cos(a)*12,hp:u.maxHp,mana:u.maxMana,alive:true,damagePoints:0,wlVx:0,wlVz:0,destination:null,channel:null,wlDash:null,wlSpray:null,wlLink:null,wlControl:null,wlDrainSpeed:null,wlMoveVx:0,wlMoveVz:0,wlShieldUntil:0,shieldUntil:0,shield:0,wlTimeShift:null,wlVector:null,wlWindUntil:0});for(const key of u.skills)u.cooldowns[key]=0;}
  this.units=this.units.filter(u=>!u.wlGhost);this.message='Mantenha-se na pedra. Acerte projéteis, acumule impulso e empurre os rivais para a lava.';return true;
 },
 finishWarlockRound(){
  const w=this.warlock;if(w.phase!=='battle')return;const survivors=alive(this),winner=survivors.length===1?survivors[0]:null;
  if(winner)winner.score++;const results=casters(this).map(u=>({owner:u.owner,name:u.name,hp:u.hp,score:u.score,alive:u.alive}));w.results=results;
  for(const u of casters(this)){u.gold+=REF.goldPerRound+(u===winner?REF.winGold:0);u.ready=!!u.bot;u.destination=null;u.channel=null;u.wlVx=u.wlVz=0;}
  w.projectiles=[];w.fields=[];w.links=[];
  if(w.round>=w.maxRounds){const best=Math.max(...casters(this).map(u=>u.score));this.winningOwners=casters(this).filter(u=>u.score===best).map(u=>u.owner);this.winner=this.winningOwners[0];this.phase='victory';w.phase='finished';this.message='O duelo dos magos terminou.';return;}
  w.phase='shop';w.remaining=30;this.phase='preparation';this.message=(winner?winner.name+' venceu a rodada. ':'Empate. ')+'Visite a loja e prepare a próxima combinação.';
 },
 tickWarlock(dt){
  if(!Number.isFinite(dt)||dt<=0)return;if(!this.warlock){this.initWarlock();return;}const w=this.warlock;if(w.phase==='finished')return;
  this.effects=this.effects.filter(e=>this.time-e.time<(e.duration||1.5));w.remaining-=dt;
  if(w.phase==='shop'){
   for(const u of casters(this).filter(v=>v.bot&&v.wlShoppedRound!==w.round)){const columns=['R','D','C','E','T','Y'];for(const column of columns){const choices=Object.values(WARLOCK_SKILLS).filter(s=>s.column===column),choice=choices[Math.floor(this.random()*choices.length)];if(!u.skills.some(k=>WARLOCK_SKILLS[k].column===column))this.warlockBuy(u,{skill:choice.key});}u.wlShoppedRound=w.round;u.ready=true;}
   if(w.remaining<=0||casters(this).length>=2&&casters(this).every(u=>u.ready))this.startWarlockRound();return;
  }
  const elapsed=POLISH.arena.roundDuration-w.remaining;w.arenaRadius=Math.max(POLISH.arena.minRadius,POLISH.arena.radius-Math.max(0,elapsed-POLISH.arena.shrinkDelay)*POLISH.arena.shrinkRate);
  for(const u of alive(this)){
   for(const key of Object.keys(u.cooldowns))u.cooldowns[key]=Math.max(0,u.cooldowns[key]-dt);
   warlockControlledAim(this,u,{x:u.x,z:u.z});if(u.bot)this.warlockBotThink(u);
   if(u.channel&&this.time>=u.channel.until){const channel=u.channel;u.channel=null;const s=wlSkillAt(channel.key,u.skillLevels[channel.key]);if(s.column==='F'){u.cooldowns[s.key]=s.cooldown;castMelee(this,u,s);}else{const f=field(this,u,s.key,'meteor',channel.point,s.radius||2,0,{fireAt:this.time,damage:s.damage,damageMax:s.damageMax});u.wlVx-=Math.sin(u.facing)*6;u.wlVz-=Math.cos(u.facing)*6;}}
   if(u.wlTimeShift&&this.time>=u.wlTimeShift.until){const old=u.wlTimeShift;u.x=old.x;u.z=old.z;u.hp=Math.min(u.maxHp,Math.max(u.hp,old.hp));if(u.damagePoints>=old.damagePoints)u.damagePoints=old.damagePoints+Math.max(0,.8-(old.level||1)/10)*(u.damagePoints-old.damagePoints);u.wlVx=old.vx;u.wlVz=old.vz;u.wlTimeShift=null;breakWarlockLinks(this,{sourceId:u.id});breakWarlockLinks(this,{targetId:u.id});this.fx('blink',u.x,u.z,{source:u.id});}
   triggerWarlockVector(this,u);
   if(u.wlSpray&&this.time>=u.wlSpray.nextAt){const spray=u.wlSpray,s=wlSkillAt(spray.key,u.skillLevels[spray.key]);launch(this,u,{...s,family:'fireball',duration:1},spray.point,{family:'spray',knock:.6});spray.remaining--;spray.nextAt=this.time+.15;if(spray.remaining<=0)u.wlSpray=null;}
   const before={x:u.x,z:u.z};u.wlMoveVx=0;u.wlMoveVz=0;
   if(u.wlDash){const dash=u.wlDash,step=Math.min(dash.remaining,dash.speed*dt);movePoint(this,u,{x:u.x+dash.dx*step,z:u.z+dash.dz*step});dash.remaining-=step;reflectWarlockDomeDash(this,u,before,dash);const target=opponents(this,u).find(t=>segmentDistance(t,before,u)<.95);if(target){hit(this,u,target,dash.damage,dash.dx,dash.dz);u.wlDash=null;}else if(dash.remaining<=0)u.wlDash=null;}
   else if(u.destination&&!u.channel&&(u.wlDisableUntil||0)<=this.time){const d=direction(u,u.destination),distance=dist(u,u.destination),speed=Math.max(0,u.speed+(u.wlDrainSpeed?.until>this.time?u.wlDrainSpeed.delta:0))+((u.wlWindUntil||0)>this.time?u.wlWindSpeed||0:0)+((u.wlRushUntil||0)>this.time?u.wlRushSpeed||0:0),step=Math.min(distance,speed*dt);movePoint(this,u,{x:u.x+d.dx*step,z:u.z+d.dz*step});u.wlMoveVx=d.dx*step/dt;u.wlMoveVz=d.dz*step/dt;u.facing=Math.atan2(d.dx,d.dz);if(distance<=step+.01)u.destination=null;}
   movePoint(this,u,{x:u.x+(u.wlVx||0)*dt,z:u.z+(u.wlVz||0)*dt});const damping=Math.pow(.96,dt/.03);u.wlVx*=damping;u.wlVz*=damping;u.moving=dist(u,before)>.001;
   if((u.wlWindUntil||0)>this.time){const enemy=opponents(this,u).find(t=>dist(u,t)<1);if(enemy){const d=direction(u,enemy);hit(this,u,enemy,u.wlWindDamage,d.dx,d.dz);u.wlWindUntil=0;}}

   if(dist(u,{x:0,z:0})>w.arenaRadius){u.fireUntil=this.time+.3;if((u.wlLavaUntil||0)<=this.time)hit(this,null,u,REF.lavaDamagePerSecond*dt,0,0,0);}else u.hp=Math.min(u.maxHp,u.hp+u.wlRegen*dt);
  }
  tickWarlockLinks(this,dt,hit);this.tickWarlockProjectiles(dt);this.tickWarlockFields(dt);
  for(const ghost of this.units.filter(u=>u.wlGhost)){const source=this.units.find(v=>v.id===ghost.wlGhostOf);if(source){ghost.x=source.x+ghost.wlGhostSide*1.5;ghost.z=source.z;ghost.facing=source.facing;ghost.alive=source.alive&&ghost.until>this.time;}}
  this.units=this.units.filter(u=>!u.wlGhost||u.alive);
  if(alive(this).length<=1||w.remaining<=0)this.finishWarlockRound();
 },
 tickWarlockProjectiles(dt){
  const w=this.warlock,keep=[];
  for(const p of [...w.projectiles]){const source=this.units.find(u=>u.id===p.source);if(!source)continue;if(p.family==='link'&&!source.alive)continue;p.age+=dt;p.life-=dt;if(p.family==='drain_return'){if(!source.alive)continue;const gap=dist(p,source);if(gap<=BEHAVIOR.drain.returnContact+p.speed*dt){source.hp=Math.min(source.maxHp,source.hp+p.heal);this.fx('heal',source.x,source.z,{source:source.id,amount:p.heal,warlock:true});continue;}const d=direction(p,source);p.dx=d.dx;p.dz=d.dz;p.x+=p.dx*p.speed*dt;p.z+=p.dz*p.speed*dt;if(p.life>0)keep.push(p);continue;}
   if(p.family==='drain'&&p.life<=0&&!p.retargeted){p.retargeted=true;const next=alive(this).filter(t=>t.id!==p.source).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(!next)continue;const d=direction(p,next);p.dx=d.dx;p.dz=d.dz;p.speed=BEHAVIOR.drain.retargetSpeed;p.life=BEHAVIOR.drain.retargetDuration*(source.wlRangeMultiplier||1);}
   if(p.family==='link'){if(p.life<=0&&!p.returning){p.returning=true;p.speed=BEHAVIOR.link.returnSpeed;p.life=10;}if(p.returning){const d=direction(p,source);p.dx=d.dx;p.dz=d.dz;if(dist(p,source)<.7+p.speed*dt)continue;}}
   if(p.family==='homing'){const target=opponents(this,source).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(target){const d=direction(p,target);p.dx+= (d.dx-p.dx)*Math.min(1,dt*3);p.dz+=(d.dz-p.dz)*Math.min(1,dt*3);const l=Math.hypot(p.dx,p.dz)||1;p.dx/=l;p.dz/=l;}}
   if(p.family==='boomerang'&&p.age>.55){if(!p.returning){p.returning=true;p.hitIds=[];}const d=direction(p,source);p.dx=d.dx;p.dz=d.dz;if(dist(p,source)<.6)continue;}
   if(p.family==='arc'){const a=dt*1.2,dx=p.dx;p.dx=dx*Math.cos(a)-p.dz*Math.sin(a);p.dz=dx*Math.sin(a)+p.dz*Math.cos(a);}
   const from={x:p.x,z:p.z},slow=w.fields.some(f=>f.family==='mist'&&dist(p,f)<f.radius)?.35:1;p.x+=p.dx*p.speed*dt*slow;p.z+=p.dz*p.speed*dt*slow;
   if(p.family==='splitter'&&p.age>.45&&!p.split){p.split=true;for(let i=-2;i<=2;i++){const a=Math.atan2(p.dx,p.dz)+i*.32;w.projectiles.push({...p,id:this.id(),family:'fragment',dx:Math.sin(a),dz:Math.cos(a),life:.6,age:0,damage:p.damage,radius:.22,hitIds:[]});}continue;}
   if(p.family==='gravity')tickWarlockGravity(this,p,dt,hit);
   if(reflectWarlockDomeProjectile(this,p,from)){keep.push(p);continue;}
   const obstacle=w.pillars.find(v=>v.alive&&segmentDistance(v,from,p)<v.radius+p.radius);if(obstacle){if(['gravity','drain'].includes(p.family)){const radius=obstacle.radius+(p.family==='gravity'?0:p.radius),contact=warlockDomeEntry(from,p,obstacle,radius);if(contact){const dot=p.dx*contact.nx+p.dz*contact.nz;p.dx-=2*dot*contact.nx;p.dz-=2*dot*contact.nz;p.x=contact.x+contact.nx*.02;p.z=contact.z+contact.nz*.02;}else{p.dx*=-1;p.dz*=-1;p.x=from.x;p.z=from.z;}keep.push(p);continue;}if(p.family==='link'){bindWarlockLink(this,source,obstacle,'pillar',p.damage,p.level);continue;}if(itemLevel(source,'scroll')&&p.family==='fireball'){p.dx*=-1;p.dz*=-1;p.x=from.x;p.z=from.z;}else{if(p.family==='fireball')explodeWarlockFireball(this,p,source,null,hit);obstacle.hp-=p.damage;if(obstacle.hp<=0)obstacle.alive=false;continue;}}
   let consumed=false;
   for(const target of alive(this).filter(v=>v.id!==p.source&&(p.family==='link'||p.family==='drain'||v.team!==p.team)&&!p.hitIds.includes(v.id)&&segmentDistance(v,from,p)<.47+p.radius)){
    if(p.family==='gravity')continue;
    if((target.wlShieldUntil||0)>this.time&&(!target.wlShieldDirectional||p.dx*target.wlShieldDx+p.dz*target.wlShieldDz<0)){p.dx*=-1;p.dz*=-1;p.source=target.id;p.owner=target.owner;p.team=target.team;p.hitIds=[];p.x=from.x;p.z=from.z;break;}
    p.hitIds.push(target.id);let damage=p.damage;
    if(p.family==='homing'&&p.age>2.25)damage+=2.5*(p.age-2.25)/2.25;
    if(p.family==='swap'){const old={x:source.x,z:source.z};movePoint(this,source,target);movePoint(this,target,old);damage=0;}
    if(p.family==='disable'){target.wlDisableUntil=this.time+p.duration*(itemLevel(target,'watch')?.65:1)*(itemLevel(target,'cursed_pendant')?1.25:1);damage=0;}
    if(p.family==='link'){bindWarlockLink(this,source,target,'caster',p.damage,p.level);consumed=true;break;}
    if(p.family==='control'){if(!target.wlControl&&p.life>.15){target.wlControl={source:source.id,orb:p.id,until:this.time+p.life-.15};p.speed=BEHAVIOR.control.hitSpeed;}damage=0;}
    if(p.family==='drain'){
     if(target.team===p.team){target.hp=Math.min(target.maxHp,target.hp+damage);target.wlDrainSpeed={delta:BEHAVIOR.drain.speedBonus,until:this.time+p.duration*(target.wlDurationMultiplier||1)};this.fx('heal',target.x,target.z,{source:source.id,amount:damage,warlock:true});}
     else{const dealt=hit(this,source,target,damage,p.dx,p.dz,.2),multiplier=(itemLevel(target,'watch')?.65:1)*(itemLevel(target,'cursed_pendant')?1.25:1);target.wlDrainSpeed={delta:-BEHAVIOR.drain.speedBonus,until:this.time+p.duration*multiplier};w.projectiles.push({id:this.id(),key:p.key,family:'drain_return',source:source.id,owner:source.owner,team:source.team,x:target.x,z:target.z,dx:0,dz:0,speed:BEHAVIOR.drain.returnSpeed,radius:.16,life:10,age:0,heal:dealt*(1+.1*wlMasteryLevel(source,'lifesteal')),damage:0,hitIds:[]});}consumed=true;break;
    }
    const dealt=hit(this,source,target,damage,p.dx,p.dz,p.knock??1);if(p.family==='fireball')explodeWarlockFireball(this,p,source,target.id,hit);
    if(itemLevel(source,'staff')&&p.family==='fireball')field(this,source,p.skill,'burn',target,.5,2,{target:target.id,damage:2});
    if(p.family==='bouncer'){p.damage=Math.max(p.damage*.8,2);const next=opponents(this,source).filter(v=>!p.hitIds.includes(v.id)).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(next&&p.hitIds.length<5){const d=direction(p,next);p.dx=d.dx;p.dz=d.dz;p.life=1.5;break;}}
    if(p.family!=='boomerang'&&p.family!=='gravity'&&p.family!=='control'){consumed=true;break;}
   }
   if(!consumed&&p.life>0&&Math.abs(p.x)<w.mapRadius&&Math.abs(p.z)<w.mapRadius)keep.push(p);
  }
  const known=new Set(keep.map(p=>p.id));
  // Split fragments are appended while the original snapshot is processed.
  const fragments=w.projectiles.filter(p=>(p.family==='fragment'||p.family==='drain_return')&&p.age===0&&!known.has(p.id));w.projectiles=[...keep,...fragments];
 },
 tickWarlockFields(dt){
  const w=this.warlock,keep=[];
  for(const f of w.fields){const source=this.units.find(u=>u.id===f.source);if(!source)continue;
   if(f.family==='meteor'&&this.time>=f.fireAt){for(const target of alive(this).filter(v=>v.team!==f.team&&dist(v,f)<=f.radius)){const d=direction(f,target),amount=f.damage+(f.damageMax-f.damage)*(1-dist(f,target)/Math.max(.01,f.radius));hit(this,source,target,amount,d.dx,d.dz);}this.fx('warlockMeteorImpact',f.x,f.z,{source:source.id,radius:f.radius,duration:.9,warlock:true});continue;}
   if(f.family==='dome'){f.x+=(f.vx||0)*dt;f.z+=(f.vz||0)*dt;}
   if(f.family==='burn'){const target=this.units.find(v=>v.id===f.target&&v.alive);if(target){f.x=target.x;f.z=target.z;target.fireUntil=this.time+.2;hit(this,source,target,f.damage*dt,0,0,0);}}
   if(f.family==='bane'&&source.alive&&dist(source,f)<f.radius){for(const target of opponents(this,source).filter(v=>dist(v,f)<3)){const d=direction(f,target);hit(this,source,target,f.damage,d.dx,d.dz);}continue;}
   if(f.family==='repeater'&&this.time>=f.nextAt){launch(this,{...source,x:f.x,z:f.z},{...wlSkillAt('S000',1),damage:f.damage},{x:f.x+f.dx*16,z:f.z+f.dz*16});f.nextAt=this.time+.35;}
   if(f.until>this.time)keep.push(f);else if(f.family==='mist'&&source.alive)source.hp=Math.min(source.maxHp,source.hp+f.heal);
  }w.fields=keep;
 },
 warlockBotThink(u){
  if((u.wlNextThink||0)>this.time)return;u.wlNextThink=this.time+.35;const enemies=opponents(this,u).sort((a,b)=>dist(u,a)-dist(u,b)),target=enemies[0];if(!target)return;
  const radius=Math.hypot(u.x,u.z),center={x:0,z:0};if(radius>this.warlock.arenaRadius-3)u.destination=center;else{const a=this.time*.7+u.seat*2;u.destination={x:Math.sin(a)*Math.min(9,this.warlock.arenaRadius-4),z:Math.cos(a)*Math.min(9,this.warlock.arenaRadius-4)};}
  const choices=u.skills.filter(k=>!(u.cooldowns[k]>0));for(const key of choices){const s=wlSkillAt(key,u.skillLevels[key]);if(s.column==='F'&&dist(u,target)>3)continue;if(s.family==='teleport'&&radius<this.warlock.arenaRadius-2)continue;if(s.column==='C'&&Math.hypot(u.wlVx,u.wlVz)<3)continue;this.warlockCommand(u,{type:'wlCast',skill:key,x:s.family==='teleport'?0:target.x,z:s.family==='teleport'?0:target.z});break;}
 },
 snapshotWarlock(){return this.warlock?{...this.warlock,reference:REF.version}:null;}
};
