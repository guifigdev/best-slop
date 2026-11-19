import {TREE_TAG_CHARACTERS as CHARACTERS,TREE_TAG_SKILLS as SKILLS,TREE_TAG_BUILDINGS as BUILDINGS,TREE_TAG_ITEMS as ITEMS,TREE_TAG_UNITS as UNITS,TREE_TAG_RESEARCH as RESEARCH,TREE_TAG_FOREST,TREE_TAG_RULES as RULES,treeTagSkillAt} from './tree-tag-catalog.js';
import {castlePassable,castleRouteAvailable,castleSpawnPoint,moveCastleUnit} from './castle-navigation.js';

const own=(object,key)=>typeof key==='string'&&Object.hasOwn(object,key);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const active=g=>g.phase==='wave'&&g.treeTag&&!g.treeTag.finished;
const actors=g=>g.units.filter(u=>u.treeTagCharacter);
const live=u=>u?.alive&&!u.treeTagCaptured&&!u.treeTagWaiting&&!u.treeTagReviveAt;
const structureReady=(g,b)=>b.alive&&b.workRemaining<=0;
const nav=g=>{const tt=g.treeTag;tt.navigation.map=tt.map;tt.navigation.elapsed=tt.elapsed;tt.navigation.buildings=tt.buildings;tt.navigation.obstacles=tt.trees;tt.navigation.navigationRevision=tt.navigationRevision;return tt.navigation;};
const point=(g,p)=>finitePoint(p)&&p.x>=g.treeTag.map.minX+.5&&p.x<=g.treeTag.map.maxX-.5&&p.z>=g.treeTag.map.minZ+.5&&p.z<=g.treeTag.map.maxZ-.5?{x:p.x,z:p.z}:null;
const fail=(g,text)=>{g.commandFailureReason=text;return false;};
const fx=(g,type,u,extra={})=>g.fx(type,u.x,u.z,{source:u.id,treeTag:true,...extra});
const clearOrder=u=>{u.destination=null;u.treeTagAction=null;u.order='stop';u.moving=false;};
const itemOwned=(u,key)=>(u.inventory||[]).some(i=>i.id===key);

export function treeTagBuildCheck(game,unit,key,where){
 const tt=game?.treeTag,definition=own(BUILDINGS,key)?BUILDINGS[key]:null;
 if(!active(game)||!live(unit)||unit.treeTagRole!=='ent')return{allowed:false,reason:'Somente um Ent ativo pode construir.'};
 if(!definition)return{allowed:false,reason:'Construção desconhecida.'};
 if(!definition.root&&!definition.advanced)return{allowed:false,reason:'Esta construção só pode ser obtida pela evolução da anterior.'};
 if(definition.advanced&&!unit.treeTagAdvancedBuilder)return{allowed:false,reason:'Treine um Advanced Builder na Tree of Life.'};
 if(!definition.root&&!tt.buildings.some(b=>b.owner===unit.owner&&structureReady(game,b)&&b.key==='e000'))return{allowed:false,reason:'Construa uma Tree of Life para liberar o construtor avançado.'};
 if(unit.gold<definition.cost||unit.lumber<definition.lumberCost)return{allowed:false,reason:'Ouro ou madeira insuficientes.'};
 const p=point(game,where);if(!p)return{allowed:false,reason:'Escolha uma região dentro da floresta.'};
 const snapped={x:Math.round(p.x*2)/2,z:Math.round(p.z*2)/2};
 if(distance(snapped,tt.map.prison)<4)return{allowed:false,reason:'Deixe a clareira da prisão livre.'};
 const occupied=[...tt.trees,...tt.buildings].some(b=>b.alive&&Math.abs(snapped.x-b.x)<(definition.w+b.w)/2+.15&&Math.abs(snapped.z-b.z)<(definition.d+b.d)/2+.15);
 if(occupied)return{allowed:false,reason:'Espaço ocupado. Use Destruir árvores ou Desenraizar para abrir uma clareira.'};
 return{allowed:true,definition,point:snapped,reason:'Área livre para construir.'};
}

function killTrees(game,center,radius){let changed=0;for(const t of game.treeTag.trees)if(t.alive&&distance(t,center)<=radius){t.alive=false;t.hp=0;changed++;}if(changed){game.treeTag.navigationRevision++;game.treeTag.forestRevision++;}return changed;}
function nearestTree(game,p){return game.treeTag.trees.filter(t=>t.alive).sort((a,b)=>distance(a,p)-distance(b,p))[0];}
function approach(game,u,target,range){
 const context=nav(game);if(distance(u,target)<=range)return true;
 const angle=Math.atan2(u.x-target.x,u.z-target.z),radius=Math.max(.5,range*.85),candidates=[];
 for(let i=0;i<16;i++){const a=angle+i*Math.PI/8;candidates.push({x:target.x+Math.sin(a)*radius,z:target.z+Math.cos(a)*radius});}
 const destination=candidates.sort((a,b)=>distance(a,u)-distance(b,u)).find(p=>castlePassable(context,p,u.collisionRadius||.25)&&castleRouteAvailable(context,u,p,u.collisionRadius||.25));
 if(!destination){u.treeTagBlocked=true;u.moving=false;return false;}
 u.treeTagBlocked=false;moveCastleUnit(context,u,destination,game.treeTag.step);return distance(u,target)<=range;
}
function reviveEnt(game,u){
 u.treeTagCaptured=false;u.treeTagState='active';u.hp=u.maxHp;u.alive=true;u.invulnerableUntil=game.treeTag.elapsed+1;u.kind='treant';u.size=.8;clearOrder(u);fx(game,'levelup',u,{rescue:true});
}
function captureEnt(game,u,attacker){
 const tt=game.treeTag;u.treeTagCaptured=true;u.treeTagState='captured';u.hp=u.maxHp;u.alive=true;u.kind='treeAsh';u.size=.4;u.x=tt.map.prison.x+(u.seat%3-1)*.6;u.z=tt.map.prison.z+Math.floor(u.seat/3)*.6;clearOrder(u);
 for(const b of tt.buildings.filter(b=>b.owner===u.owner&&b.alive))b.alive=false;tt.navigationRevision++;
 if(attacker?.owner){const killer=game.player(attacker.owner);if(killer){killer.gold+=RULES.entKillGold;killer.xp+=RULES.entKillXp;killer.kills++;while(killer.level<20&&killer.xp>=50*killer.level*(killer.level+3)){killer.level++;killer.skillPoints++;const p=CHARACTERS[killer.treeTagCharacter];killer.maxHp+=p.strengthGain*25;killer.hp+=p.strengthGain*25;killer.maxMana+=p.intelligenceGain*15;killer.mana+=p.intelligenceGain*15;killer.armor+=p.agilityGain*.3;killer.damage+=p[p.primary+'Gain']||0;killer.interval=p.rawStats.interval/(1+.02*(p.agility+(killer.level-1)*p.agilityGain));}}}
 fx(game,'castleDeath',u,{captured:true});
}
function hurt(game,target,amount,attacker,magic=false){
 if(!live(target)&&!target.treeTagStructure||!target.alive||target.invulnerableUntil>game.treeTag.elapsed||magic&&target.treeTagAvatarUntil>game.treeTag.elapsed)return 0;
 const actual=Math.min(target.hp,Math.max(0,amount)*(target.treeTagBerserkUntil>game.treeTag.elapsed?2:1)*(magic&&target.treeTagRole==='infernal'?.7:1)/(magic?1:1+.06*Math.max(0,target.armor||0)));target.hp-=actual;target.hitAt=game.time;
 if(actual)fx(game,'damage',target,{target:target.id,amount:Math.round(actual),magic});
 if(target.hp<=0){
  if(target.treeTagCharacter&&target.treeTagRole==='ent')captureEnt(game,target,attacker);
  else if(target.treeTagCharacter){target.alive=false;target.treeTagDeaths=(target.treeTagDeaths||0)+1;target.treeTagReviveDelay=(target.treeTagReviveDelay||0)+((target.treeTagReviveDelay||0)<=60?4:3);target.treeTagReviveAt=game.treeTag.elapsed+target.treeTagReviveDelay;target.treeTagState='reviving';clearOrder(target);}
  else{target.alive=false;target.died=game.time;game.treeTag.navigationRevision++;if(typeof target.id==='string')game.treeTag.forestRevision++;}
 }
 if(attacker&&!magic&&itemOwned(attacker,'I004')&&actual>0)attacker.hp=Math.min(attacker.maxHp,attacker.hp+actual);
 return actual;
}
function applyResearch(game,target){
 const levels=game.treeTag.players[target.owner]?.researchLevels||{};target.treeTagAppliedResearch||={};
 for(const key of target.affectedUpgrades||[]){const delta=(levels[key]||0)-(target.treeTagAppliedResearch[key]||0);if(delta<=0)continue;target.treeTagAppliedResearch[key]=levels[key];if(key==='Resw')target.damage+=delta*(target.damageUpgrade||0);if(key==='Rerh'||key==='R000')target.armor+=delta*(target.armorUpgrade||0);if(key==='R000'){const base=BUILDINGS[target.key]?.hp||UNITS[target.rawId]?.hp||target.maxHp,bonus=base*.1*delta;target.maxHp+=bonus;target.hp+=bonus;}}
}
function summon(game,source,raw,where,lifetime,scout=false){
 const data=UNITS[raw];if(!data)return null;const context=nav(game),found=castleSpawnPoint(context,where,.3,{maxDistance:3})||castleSpawnPoint(context,source,.3,{maxDistance:3});if(!found)return null;
 const u={...data,id:game.id(),owner:source.owner,team:source.team,kind:scout?'infernal':raw==='h004'||raw==='h005'?'waterElemental':source.treeTagRole==='ent'?'treant':'infernal',treeTagSummon:true,treeTagScout:scout,treeTagRole:source.treeTagRole,summon:true,size:scout?.4:.65,...found,maxHp:data.hp,hp:data.hp,alive:true,collisionRadius:.25,expiresAt:game.treeTag.elapsed+lifetime,cd:0,stun:0,speed:data.speed||source.speed};applyResearch(game,u);game.units.push(u);fx(game,'summon',u,{duration:1});return u;
}
function skillTarget(game,u,c){return c.target==null?null:game.units.find(t=>t.id===c.target&&t.team!==u.team&&live(t));}
function cast(game,u,c,fromOrder=false){
 const key=typeof c.skill==='string'?c.skill:u.skills[Math.floor(c.slot)],level=u.skillLevels?.[key]||0,s=treeTagSkillAt(key,level),tt=game.treeTag;
 if(!s||!u.skills.includes(key)||!level)return fail(game,'Aprenda esta habilidade antes de usá-la.');
 if(s.kind==='passive')return fail(game,'Esta habilidade é passiva.');
 if((u.cooldowns[key]||0)>0)return fail(game,'Habilidade em recarga.');
 if(u.mana<s.mana)return fail(game,'Mana insuficiente.');
 const target=skillTarget(game,u,c),p=s.target==='self'?{x:u.x,z:u.z}:target||point(game,c);
 if(!p)return fail(game,'Escolha um alvo ou uma região válida.');
 const range=key==='blink'?s.distance:key==='ungrow'?s.range+.75:s.range||7;
 if(key!=='blink'&&distance(u,p)>range){if(!fromOrder){u.treeTagAction={...c,type:'cast',skill:key};u.destination=null;return true;}return false;}
 if(key==='ensnare'&&!target)return fail(game,'Escolha um inimigo para enredar.');
 if(key==='blink'){
  const d=distance(u,p),end={x:u.x+(p.x-u.x)*Math.min(1,range/(d||1)),z:u.z+(p.z-u.z)*Math.min(1,range/(d||1))},land=castleSpawnPoint(nav(game),end,u.collisionRadius,{maxDistance:1.5});if(!land)return fail(game,'Destino ocupado pelas árvores.');
  const start={x:u.x,z:u.z};Object.assign(u,land);clearOrder(u);fx(game,'blink',start,{source:u.id,tx:u.x,tz:u.z});
 }else if(key==='ungrow'){
  const tree=nearestTree(game,p);if(!tree||distance(u,tree)>range)return fail(game,'Aproxime-se de uma árvore.');killTrees(game,tree,.05);u.hp=Math.min(u.maxHp,u.hp+25);fx(game,'heal',u,{amount:25});
 }else if(key==='destroyTrees'||key==='infernalDestroy'){killTrees(game,p,s.radius);fx(game,'fireball',p,{source:u.id,radius:s.radius});}
 else if(key==='ensnare'){target.treeTagRootUntil=tt.elapsed+s.duration;fx(game,'ensnare',target,{source:u.id,duration:s.duration});}
 else if(key==='speedFlames'){u.treeTagSpeedUntil=tt.elapsed+s.duration;u.treeTagSpeedMultiplier=s.nativeData.DataA;fx(game,'rage',u,{duration:s.duration});}
 else if(key==='scout'){for(let i=0;i<Math.max(1,s.nativeData.DataA);i++)summon(game,u,level===1?'oC36':level===2?'oC46':'oC47',u,s.duration,true);u.treeTagRevealUntil=tt.elapsed+s.duration;fx(game,'levelup',u,{radius:12});}
 else if(key==='elemental'){for(let i=0;i<(s.nativeData.DataB||2);i++)summon(game,u,level===1?'h000':level===2?'h001':'h002',p,s.duration);}
 else if(key==='lightningTrap'){const raw=level===1?'o000':level===2?'o001':level===3?'o002':'o004',trap=summon(game,u,raw,p,s.duration);if(trap){trap.treeTagTrap=true;trap.speed=0;trap.size=.35;}}
 else if(key==='fireSwarm'){u.treeTagSwarmUntil=tt.elapsed+s.duration;u.treeTagSwarmDamage=(s.nativeData.DataC||7)*(s.nativeData.DataA||20);fx(game,'rage',u,{duration:s.duration});}
 else if(key==='nuclear'){tt.zones.push({id:game.id(),owner:u.owner,team:u.team,...p,r:s.radius,radius:s.radius,damage:s.nativeData.DataA,duration:s.duration,delay:1,created:tt.elapsed,expiresAt:tt.elapsed+s.duration+1});fx(game,'fireball',p,{source:u.id,radius:s.radius});killTrees(game,p,s.radius);}
 else if(key==='shockwave'){
  const dx=p.x-u.x,dz=p.z-u.z,len=Math.hypot(dx,dz)||1,reach=(s.nativeData.DataC||800)/128;
  for(const t of [...game.units,...tt.buildings].filter(t=>t.team!==u.team&&t.alive)){const along=((t.x-u.x)*dx+(t.z-u.z)*dz)/len,cross=Math.abs((t.x-u.x)*dz-(t.z-u.z)*dx)/len;if(along>=0&&along<=reach&&cross<=s.radius)hurt(game,t,s.nativeData.DataA,u,true);}
  fx(game,'shockwave',u,{tx:p.x,tz:p.z,radius:s.radius});
 }else if(key==='avatar'){u.treeTagAvatarUntil=tt.elapsed+s.duration;u.treeTagAvatarBonus={hp:s.nativeData.DataB,damage:s.nativeData.DataC,armor:s.nativeData.DataA};u.maxHp+=s.nativeData.DataB;u.hp+=s.nativeData.DataB;u.damage+=s.nativeData.DataC;u.armor+=s.nativeData.DataA;fx(game,'rage',u,{duration:s.duration});}
 else return fail(game,'Esta habilidade ainda não tem ação ativa.');
 u.mana-=s.mana;u.cooldowns[key]=s.cooldown;u.castAt=game.time;u.treeTagAction=null;return true;
}
function attack(game,u,target,dt){
 if(!target?.alive||target.treeTagCaptured||target.treeTagWaiting)return;
 const reach=Math.max(.45,u.range||.6)+(u.collisionRadius||.25)+(target.w?Math.max(target.w,target.d)/2:target.collisionRadius||.3);
 if(!approach(game,u,target,reach))return;
 if(u.cd>0)return;const tree=typeof target.id==='string';u.cd=(tree?(u.treeDamage?u.treeInterval||1.5:2):u.interval||2)/(u.treeTagBerserkUntil>game.treeTag.elapsed?3:1);u.attackAt=game.time;u.facing=Math.atan2(target.x-u.x,target.z-u.z);
 const critical=!tree&&itemOwned(u,'I004')&&game.random()<.2,shield=actors(game).some(a=>a.team===u.team&&live(a)&&itemOwned(a,'I003')&&distance(a,u)<=7);hurt(game,target,(tree?(u.treeDamage||u.damage):u.damage)*(critical?2:1)*(shield?1.1:1),u);if(critical)fx(game,'crit',target,{source:u.id,amount:Math.round(u.damage*2)});fx(game,u.range>1?'arrow':'slash',u,{target:target.id,tx:target.x,tz:target.z});
}
function rescueNearby(game,u){for(const ash of actors(game).filter(t=>t.treeTagCaptured&&distance(u,t)<=RULES.rescueRadius))reviveEnt(game,ash);}

export function treeTagCanSee(state,observer,target){
 const tt=state?.treeTag||state;if(!tt||!observer||!target)return false;if(observer.team===target.team||target.treeTagCaptured)return true;
 const d=distance(observer,target),reveal=observer.treeTagRevealUntil>tt.elapsed;if(reveal&&distance(observer.treeTagRevealPoint||observer,target)<=12)return true;
 if(d>14)return false;
 const dx=target.x-observer.x,dz=target.z-observer.z,den=dx*dx+dz*dz;if(den<.001)return true;
 return !(tt.trees||[]).some(tree=>{if(!tree.alive)return false;const t=((tree.x-observer.x)*dx+(tree.z-observer.z)*dz)/den;if(t<=.08||t>=.96)return false;return Math.hypot(tree.x-observer.x-dx*t,tree.z-observer.z-dz*t)<Math.max(.4,tree.w/2);});
}

function thinkBot(game,u){
 const tt=game.treeTag;if(tt.elapsed<(u.treeTagNextThink||0))return;u.treeTagNextThink=tt.elapsed+.8;
 if(u.treeTagRole==='ent'){
  if(u.treeTagCaptured)return;const danger=actors(game).filter(t=>t.treeTagRole==='infernal'&&live(t)&&distance(u,t)<10&&treeTagCanSee(tt,u,t)).sort((a,b)=>distance(u,a)-distance(u,b))[0];
  if(danger){const angle=Math.atan2(u.x-danger.x,u.z-danger.z),p=point(game,{x:clamp(u.x+Math.sin(angle)*10,-45,45),z:clamp(u.z+Math.cos(angle)*10,-45,45)});if(p){if(!u.cooldowns.blink){cast(game,u,{skill:'blink',...p});}u.destination=p;u.treeTagAction=null;}return;}
  const ash=actors(game).find(t=>t.treeTagCaptured);if(ash&&tt.elapsed>40){u.destination={x:ash.x,z:ash.z};return;}
  if(u.treeTagAction||u.destination)return;
  if(!u.treeTagSettled){const angle=(u.seat+1)*2.399963,p={x:Math.sin(angle)*27,z:Math.cos(angle)*27};u.destination=p;u.treeTagSettled=true;return;}
  if(u.gold>=BUILDINGS.eC09.cost&&u.lumber>=BUILDINGS.eC09.lumberCost){
   for(let i=0;i<12;i++){const angle=i*Math.PI/6,p={x:u.x+Math.sin(angle)*3.5,z:u.z+Math.cos(angle)*3.5};if(treeTagBuildCheck(game,u,'eC09',p).allowed){game.treeTagCommand(u,{type:'ttBuild',building:'eC09',...p});return;}}
   if(!u.cooldowns.destroyTrees)cast(game,u,{skill:'destroyTrees',x:u.x+2,z:u.z});
  }
 }else{
  if(u.skillPoints>0){const keys=u.skills.filter(k=>k!=='infernalDestroy'&&k!=='attributeBonus');for(const key of keys)if(u.skillLevels[key]<SKILLS[key].maxLevel){game.treeTagCommand(u,{type:'ttLearn',skill:key});break;}}
  const prey=actors(game).filter(t=>t.treeTagRole==='ent'&&live(t)&&treeTagCanSee(tt,u,t)).sort((a,b)=>distance(u,a)-distance(u,b))[0];
  if(prey){u.treeTagLastSeen={x:prey.x,z:prey.z,at:tt.elapsed};u.treeTagAction={type:'attack',target:prey.id};if(distance(u,prey)<5){for(const key of ['ensnare','shockwave','speedFlames','nuclear'])if(u.skills.includes(key)&&u.skillLevels[key]&&!(u.cooldowns[key]>0)&&u.mana>=treeTagSkillAt(key,u.skillLevels[key]).mana){cast(game,u,{skill:key,target:prey.id,x:prey.x,z:prey.z});break;}}if(u.treeTagBlocked&&!(u.cooldowns.infernalDestroy>0))cast(game,u,{skill:'infernalDestroy',x:u.x+Math.sign(prey.x-u.x)*2,z:u.z+Math.sign(prey.z-u.z)*2});}
  else{const memory=u.treeTagLastSeen;if(memory&&tt.elapsed-memory.at<8){u.destination={x:memory.x,z:memory.z};u.treeTagAction=null;}else if(!u.destination){const i=(u.treeTagPatrolIndex||0)+1;u.treeTagPatrolIndex=i;u.destination={x:Math.sin(i*2.399963)*30,z:Math.cos(i*2.399963)*30};u.treeTagAction=null;}if(u.treeTagBlocked&&!u.cooldowns.infernalDestroy)cast(game,u,{skill:'infernalDestroy',x:u.x+2,z:u.z});}
 }
}

export const TreeTagMethods={
 setupTreeTagPlayer(u,selection='ent'){
  const c=own(CHARACTERS,selection)?CHARACTERS[selection]:null;if(!c)return false;
  Object.assign(u,{treeTagCharacter:selection,treeTagRole:c.role,treeTagState:'preparation',kind:c.modelKey,name:c.title,maxHp:c.hp,hp:c.hp,maxMana:c.mana,mana:c.mana,baseDamage:c.damage,damage:c.damage,baseArmor:c.armor,armor:c.armor,speed:c.speed,range:c.range,interval:c.interval,collisionRadius:c.role==='ent'?.2:.5,size:c.role==='ent'?.8:1.6,skills:[...c.skills],skillLevels:Object.fromEntries(c.skills.map(k=>[k,c.role==='ent'||k==='infernalDestroy'?1:0])),cooldowns:{},inventory:c.role==='infernal'?[{id:'I000',key:'I000',level:1,charges:0}]:[],attributePoints:0,treeDamage:c.treeDamage,treeInterval:c.treeInterval,treeRange:c.treeRange,skillPoints:c.role==='infernal'?1:0,level:1,xp:0,gold:c.role==='ent'?RULES.startEntGold:RULES.startInfernalGold,lumber:c.role==='ent'?RULES.startEntWood:RULES.startInfernalWood,treeTagCaptured:false,treeTagWaiting:false,treeTagAction:null,order:'stop'});return u;
 },
 initTreeTag(){
  if(this.treeTag)return false;const players=actors(this);if(players.length<2||!players.some(u=>u.treeTagRole==='ent')||!players.some(u=>u.treeTagRole==='infernal'))return fail(this,'Tree Tag precisa de pelo menos um Ent e um Infernal.');
  const trees=TREE_TAG_FOREST.map(t=>({...t})),map={...RULES.map,prison:{...RULES.prison},trees},tt=this.treeTag={map,trees,buildings:[],zones:[],elapsed:0,remaining:RULES.duration,releaseAt:RULES.infernalDelay,releaseRemaining:RULES.infernalDelay,incomeAt:RULES.incomeInterval,forestRevision:0,navigationRevision:0,finished:false,winnerRole:null,players:{},navigation:{map,teams:[],buildings:[],obstacles:trees,navigationRevision:0},step:0};
  const starts=[[-5.5,-1],[5.5,-1],[0,-6],[2,5],[-4,-4.5],[5,3],[-5,3],[4,-4.5],[-2,5]];let index=0;
  for(const u of players){this.setupTreeTagPlayer(u,u.treeTagCharacter);u.team=u.treeTagRole==='ent'?1:2;u.alive=true;u.cd=0;u.stun=0;u.treeTagCaptured=false;u.treeTagWaiting=u.treeTagRole==='infernal';u.treeTagState=u.treeTagWaiting?'waiting':'active';const start=u.treeTagRole==='ent'?starts[index++%starts.length]:[0,0],free=castleSpawnPoint(nav(this),{x:start[0],z:start[1]},u.collisionRadius,{maxDistance:3});u.x=free?.x??start[0];u.z=free?.z??start[1];tt.players[u.owner]={owner:u.owner,role:u.treeTagRole,team:u.team,character:u.treeTagCharacter,researchLevels:{},researching:null};delete u.cell;delete u.challenge;}
  this.phase='wave';this.wave=0;this.timer=RULES.duration;this.bounds=47;this.obstacles=[];this.zones=[];this.effects=[];this.message='Tree Tag: os Ents têm 30 segundos para se esconder. Sobreviva por 30 minutos ou capture todas as árvores.';return true;
 },
 treeTagCommand(u,c){
  this.commandFailureReason=null;if(!u?.treeTagCharacter||!c||typeof c!=='object')return false;
  if(c.type==='ready'||c.type==='ttReady'){if(this.treeTag||this.phase!=='preparation')return false;u.ready=true;if(actors(this).length>=2&&actors(this).every(x=>x.ready||x.bot))return this.initTreeTag();return true;}
  if(!active(this)||!u.alive)return false;
  if(c.type==='ttStop'){clearOrder(u);return true;}
  if(u.treeTagWaiting)return fail(this,'Os Infernals serão libertados após os 30 segundos de preparação.');
  if(u.treeTagCaptured){if(c.type==='ttMove'){const p=point(this,c);if(!p||distance(p,this.treeTag.map.prison)>1.7)return false;u.destination=p;return true;}return fail(this,'Aguarde um Ent aliado para resgatar suas cinzas na prisão central.');}
  if(c.type==='ttMove'){const p=point(this,c);if(!p)return false;clearOrder(u);u.destination=p;u.order='move';return true;}
  if(c.type==='ttAttack'){const target=[...this.units,...this.treeTag.buildings,...this.treeTag.trees].find(t=>t.id===c.target&&t.alive);if(!target)return false;if(target.treeTagCaptured&&u.treeTagRole==='ent'){u.destination={x:target.x,z:target.z};u.treeTagAction=null;return true;}if(target.team===u.team)return false;u.treeTagAction={type:'attack',target:target.id};u.destination=null;return true;}
  if(c.type==='ttCast')return cast(this,u,c);
  if(c.type==='ttLearn'){
   const s=own(SKILLS,c.skill)?SKILLS[c.skill]:null;if(u.treeTagRole!=='infernal'||!s||!u.skills.includes(c.skill)||u.skillPoints<1||(u.skillLevels[c.skill]||0)>=s.maxLevel)return false;
   const rank=u.skillLevels[c.skill]||0,minimum=s.requiredLevel+rank*s.levelSkip;if(u.level<minimum)return fail(this,'Esta habilidade exige nível '+minimum+'.');u.skillLevels[c.skill]=rank+1;u.skillPoints--;if(c.skill==='attributeBonus'){u.maxHp+=100;u.hp+=100;u.maxMana+=60;u.mana+=60;u.damage+=4;u.armor+=1.2;}fx(this,'levelup',u);return true;
  }
  if(c.type==='ttBuild'){
   const check=treeTagBuildCheck(this,u,c.building,c);if(!check.allowed)return fail(this,check.reason);const d=check.definition,b={...d,id:this.id(),owner:u.owner,team:u.team,...check.point,maxHp:d.hp,hp:d.hp*.1,alive:true,treeTagStructure:true,workRemaining:d.buildTime,workTotal:d.buildTime,created:this.treeTag.elapsed,productionQueue:[],trainRemaining:0};applyResearch(this,b);this.treeTag.buildings.push(b);this.treeTag.navigationRevision++;u.gold-=d.cost;u.lumber-=d.lumberCost;u.destination=null;u.treeTagAction={type:'build',target:b.id};fx(this,'castleBuild',b,{duration:d.buildTime});return true;
  }
  if(c.type==='ttUpgrade'){
   const b=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.owner===u.owner&&structureReady(this,b)),d=own(BUILDINGS,c.building)?BUILDINGS[c.building]:null;if(!b||!d||!b.upgradesTo.includes(c.building)||u.gold<d.cost||u.lumber<d.lumberCost)return false;u.gold-=d.cost;u.lumber-=d.lumberCost;b.pendingUpgrade=d.key;b.upgradeGoldPaid=d.cost;b.upgradeWoodPaid=d.lumberCost;b.workRemaining=b.workTotal=d.buildTime;u.treeTagAction={type:'build',target:b.id};u.destination=null;return true;
  }
  if(c.type==='ttDemolish'){const b=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.owner===u.owner&&b.alive);if(!b)return false;if(b.workRemaining>0){u.gold+=b.pendingUpgrade?b.upgradeGoldPaid||0:b.cost;u.lumber+=b.pendingUpgrade?b.upgradeWoodPaid||0:b.lumberCost;if(b.pendingUpgrade){delete b.pendingUpgrade;b.workRemaining=0;b.hp=b.maxHp;}else b.alive=false;}else b.alive=false;this.treeTag.navigationRevision++;if(u.treeTagAction?.target===b.id)clearOrder(u);return true;}
  if(c.type==='ttLinkTunnel'){const a=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.owner===u.owner&&b.type==='tunnel'&&structureReady(this,b)),b=this.treeTag.buildings.find(b=>b.id===c.targetId&&b.owner===u.owner&&b.type==='tunnel'&&structureReady(this,b));if(!a||!b||a.id===b.id)return false;a.linkedTunnel=b.id;return true;}
  if(c.type==='ttUseTunnel'){const a=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.team===u.team&&b.type==='tunnel'&&structureReady(this,b)),b=a&&this.treeTag.buildings.find(b=>b.id===a.linkedTunnel&&structureReady(this,b));if(!a||!b||distance(u,a)>2)return false;const p=castleSpawnPoint(nav(this),{x:b.x+2,z:b.z},u.collisionRadius,{maxDistance:3});if(!p)return false;Object.assign(u,p);clearOrder(u);return true;}
  if(c.type==='ttRepair'){const b=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.team===u.team&&b.alive&&b.workRemaining<=0);if(!b)return false;u.treeTagAction={type:'repair',target:b.id};u.destination=null;return true;}
  if(c.type==='ttResearch'){
   const b=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.owner===u.owner&&structureReady(this,b)),r=own(RESEARCH,c.research)?RESEARCH[c.research]:null,p=this.treeTag.players[u.owner];if(!b||!r||!b.research.includes(c.research)||p.researching)return false;
   const rank=p.researchLevels[r.key]||0;if(rank>=r.maxLevel)return false;const required=r.requirements[rank];if(required&&!this.treeTag.buildings.some(x=>x.owner===u.owner&&x.key===required&&structureReady(this,x)))return fail(this,'Construa '+BUILDINGS[required].name+' antes desta pesquisa.');
   const gold=r.cost+r.costPerLevel*rank,wood=r.lumberCost+r.lumberPerLevel*rank;if(u.gold<gold||u.lumber<wood)return fail(this,'Ouro ou madeira insuficientes para pesquisar.');u.gold-=gold;u.lumber-=wood;p.researching={key:r.key,buildingId:b.id,level:rank+1,remaining:r.duration+r.durationPerLevel*rank};return true;
  }
  if(c.type==='ttTrain'){
   const b=this.treeTag.buildings.find(b=>b.id===c.buildingId&&b.owner===u.owner&&structureReady(this,b)),d=own(UNITS,c.unit)?UNITS[c.unit]:null;if(!b||!d||!b.train.includes(c.unit)||u.gold<d.cost||u.lumber<d.lumberCost)return false;u.gold-=d.cost;u.lumber-=d.lumberCost;b.productionQueue.push(c.unit);return true;
  }
  if(c.type==='ttBuy'){
   const item=own(ITEMS,c.item)?ITEMS[c.item]:null;if(!item||u.inventory.length>=6||u.gold<item.cost)return false;
   if(distance(u,this.treeTag.map.prison)>5&&!this.treeTag.buildings.some(b=>b.type==='shop'&&b.team===u.team&&structureReady(this,b)&&distance(u,b)<4))return fail(this,'Aproxime-se da loja central ou da sua Item Shop.');
   u.gold-=item.cost;u.inventory.push({id:item.key,key:item.key,level:1,charges:item.charges});if(item.effect==='shield'){u.armor+=8;}if(item.effect==='lifesteal'){u.interval/=1.15;u.treeInterval/=1.15;}return true;
  }
  if(c.type==='ttUseItem'){
   const slot=Number.isInteger(c.slot)?c.slot:-1,entry=u.inventory[slot],item=entry&&ITEMS[entry.id];if(!item||(u.treeTagItemCooldowns?.[item.key]||0)>0)return false;const p=point(this,c)||{x:u.x,z:u.z};let cooldown=0;
   if(item.effect==='berserk'){u.treeTagBerserkUntil=this.treeTag.elapsed+15;cooldown=45;}
   else if(item.effect==='sentry'){if(u.mana<75)return fail(this,'Mana insuficiente: a sentinela custa 75.');u.mana-=75;u.treeTagRevealUntil=this.treeTag.elapsed+300;u.treeTagRevealPoint={...p};cooldown=15;fx(this,'levelup',p,{radius:8});}
   else if(item.effect==='reveal'){if(u.mana<45)return false;u.mana-=45;u.treeTagRevealUntil=this.treeTag.elapsed+10;u.treeTagRevealPoint={...p};cooldown=35;fx(this,'levelup',p,{radius:10});}
   else if(item.effect==='genie'){summon(this,u,'e004',p,60);cooldown=60;}
   else if(item.effect==='summonInfernal'){summon(this,u,'ninf',p,60);cooldown=60;}
   else return fail(this,'Este item funciona passivamente.');
   u.treeTagItemCooldowns||={};u.treeTagItemCooldowns[item.key]=cooldown;if(entry.charges>0&&--entry.charges===0)u.inventory.splice(slot,1);return true;
  }
  return false;
 },
 tickTreeTag(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  if(!this.treeTag){if(this.phase==='preparation'){this.timer-=dt;if(this.timer<=0)this.initTreeTag();}return;}
  if(!active(this))return;const tt=this.treeTag;tt.elapsed+=dt;tt.remaining=Math.max(0,RULES.duration-tt.elapsed);tt.releaseRemaining=Math.max(0,tt.releaseAt-tt.elapsed);tt.step=Math.min(dt,.15);this.timer=tt.remaining;this.effects=this.effects.filter(e=>this.time-e.time<(e.duration||1.5));
  while(tt.elapsed>=tt.incomeAt){for(const u of actors(this)){const buildings=tt.buildings.filter(b=>b.owner===u.owner&&structureReady(this,b));u.gold+=(u.treeTagRole==='ent'?1:2)+buildings.reduce((n,b)=>n+b.incomeGold,0);u.lumber+=(u.treeTagRole==='ent'?2:4)+buildings.reduce((n,b)=>n+b.incomeWood,0);}tt.incomeAt+=RULES.incomeInterval;}
  for(const u of actors(this)){
   u.cd=Math.max(0,(u.cd||0)-dt);u.moving=false;for(const k of Object.keys(u.cooldowns))u.cooldowns[k]=Math.max(0,u.cooldowns[k]-dt);for(const k of Object.keys(u.treeTagItemCooldowns||{}))u.treeTagItemCooldowns[k]=Math.max(0,u.treeTagItemCooldowns[k]-dt);
   if(u.treeTagWaiting&&tt.elapsed>=RULES.infernalDelay){u.treeTagWaiting=false;u.treeTagState='active';fx(this,'summon',u,{radius:3});}
   if(u.treeTagReviveAt&&tt.elapsed>=u.treeTagReviveAt){u.treeTagReviveAt=0;u.alive=true;u.hp=u.maxHp;u.mana=u.maxMana;u.x=u.z=0;u.treeTagState='active';}
   if(!u.alive||u.treeTagWaiting)continue;
   const profile=CHARACTERS[u.treeTagCharacter];u.hp=Math.min(u.maxHp,u.hp+profile.hpRegen*dt);u.mana=Math.min(u.maxMana,u.mana+profile.manaRegen*(itemOwned(u,'I002')?3:1)*dt);
   if(u.treeTagAvatarBonus&&tt.elapsed>=u.treeTagAvatarUntil){const a=u.treeTagAvatarBonus;u.maxHp-=a.hp;u.hp=Math.min(u.maxHp,u.hp);u.damage-=a.damage;u.armor-=a.armor;u.treeTagAvatarBonus=null;}
   if(u.treeTagCaptured){if(u.destination){moveCastleUnit(nav(this),u,u.destination,tt.step);if(distance(u,u.destination)<.3)u.destination=null;}continue;}
   if(u.bot)thinkBot(this,u);
   const speed=u.speed;u.speed*=u.treeTagSpeedUntil>tt.elapsed?u.treeTagSpeedMultiplier||1:1;
   if(!(u.treeTagRootUntil>tt.elapsed)){
    if(u.destination){moveCastleUnit(nav(this),u,u.destination,tt.step);if(distance(u,u.destination)<.35)u.destination=null;}
    else if(u.treeTagAction){const action=u.treeTagAction,target=[...this.units,...tt.buildings,...tt.trees].find(t=>t.id===action.target&&t.alive);
     if(action.type==='cast'){const s=treeTagSkillAt(action.skill,u.skillLevels[action.skill]),p=skillTarget(this,u,action)||point(this,action);if(p&&approach(this,u,p,(s?.range||1)+.2))cast(this,u,action,true);}
     else if(action.type==='attack'){if(target)attack(this,u,target,dt);else u.treeTagAction=null;}
     else if(target){if(approach(this,u,target,Math.max(target.w,target.d)/2+.6)){
      if(action.type==='build'&&target.workRemaining>0){target.workRemaining=Math.max(0,target.workRemaining-dt);target.hp=Math.min(target.maxHp,target.hp+target.maxHp*.9*dt/target.workTotal);u.treeTagWorking=true;
       if(target.workRemaining===0){if(target.pendingUpgrade){const d=BUILDINGS[target.pendingUpgrade];Object.assign(target,d,{key:d.key,hp:d.hp,maxHp:d.hp});delete target.pendingUpgrade;}u.treeTagAction=null;tt.navigationRevision++;fx(this,'levelup',target);}}
      else if(action.type==='repair'){const heal=Math.min(target.maxHp-target.hp,35*dt),cost=heal/target.maxHp*target.cost*.35;if(u.gold>=cost){u.gold-=cost;target.hp+=heal;}if(target.hp>=target.maxHp)u.treeTagAction=null;}
     }}else u.treeTagAction=null;
    }
   }
   u.speed=speed;u.treeTagWorking=!!(u.treeTagAction?.type==='build'&&!u.moving);
   if(u.treeTagRole==='ent')rescueNearby(this,u);
   if(u.treeTagRole==='infernal'){const level=u.skillLevels.immolation||0,s=level&&treeTagSkillAt('immolation',level);if(s)for(const target of [...this.units,...tt.buildings].filter(t=>t.team!==u.team&&t.alive&&!t.treeTagCaptured&&distance(u,t)<=s.radius))hurt(this,target,s.nativeData.DataA*dt,u,true);if(u.treeTagSwarmUntil>tt.elapsed){const target=this.units.filter(t=>t.team!==u.team&&live(t)&&distance(u,t)<6.25)[0];if(target)hurt(this,target,u.treeTagSwarmDamage*dt,u,true);}}
  }
  for(const p of Object.values(tt.players)){if(!p.researching)continue;const task=p.researching,b=tt.buildings.find(b=>b.id===task.buildingId&&structureReady(this,b));if(!b){p.researching=null;continue;}task.remaining-=dt;if(task.remaining>0)continue;p.researchLevels[task.key]=task.level;p.researching=null;for(const target of [...this.units,...tt.buildings].filter(t=>t.owner===p.owner&&t.alive))applyResearch(this,target);if(task.key==='R002'){const u=this.player(p.owner);u.treeTagTrueSight=true;}fx(this,'levelup',b);}
  for(const b of tt.buildings.filter(b=>structureReady(this,b))){
   if(b.type==='tower'){b.attackCd=Math.max(0,(b.attackCd||0)-dt);const target=this.units.filter(u=>u.team!==b.team&&live(u)&&distance(u,b)<Math.max(2,b.range)).sort((a,c)=>distance(a,b)-distance(c,b))[0];if(target&&b.attackCd<=0){b.attackCd=b.interval;hurt(this,target,b.damage,this.player(b.owner));fx(this,'arrow',b,{target:target.id,tx:target.x,tz:target.z});}}
   if(b.type==='aura')for(const u of actors(this).filter(u=>u.team===b.team&&live(u)&&distance(u,b)<=7)){u.hp=Math.min(u.maxHp,u.hp+5*dt);u.mana=Math.min(u.maxMana,u.mana+5*dt);}
   if(b.productionQueue.length){b.trainRemaining=b.trainRemaining||Math.max(1,UNITS[b.productionQueue[0]]?.buildTime||5);b.trainRemaining-=dt;if(b.trainRemaining<=0){const raw=b.productionQueue.shift();summon(this,this.player(b.owner),raw,b,3600);if(raw==='uC43')this.player(b.owner).treeTagAdvancedBuilder=true;b.trainRemaining=0;}}
  }
  for(const u of this.units.filter(u=>u.treeTagSummon&&u.alive)){if(tt.elapsed>=u.expiresAt){u.alive=false;continue;}u.cd=Math.max(0,u.cd-dt);if(u.treeTagScout){const prey=actors(this).filter(t=>t.team!==u.team&&live(t)).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(prey)moveCastleUnit(nav(this),u,prey,tt.step);continue;}const target=[...actors(this),...tt.buildings].filter(t=>t.team!==u.team&&live(t)).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(target){if(u.treeTagTrap){if(distance(u,target)<=u.range&&u.cd<=0){hurt(this,target,u.damage,u);u.cd=u.interval;}}else attack(this,u,target,dt);}}
  for(const z of tt.zones.filter(z=>tt.elapsed>=z.created+z.delay&&tt.elapsed<z.expiresAt))for(const target of [...this.units,...tt.buildings].filter(t=>t.team!==z.team&&t.alive&&!t.treeTagCaptured&&distance(t,z)<=z.r))hurt(this,target,z.damage*dt,this.player(z.owner),true);
  tt.zones=tt.zones.filter(z=>tt.elapsed<z.expiresAt);const ents=actors(this).filter(u=>u.treeTagRole==='ent'),infernals=actors(this).filter(u=>u.treeTagRole==='infernal');
  if(tt.elapsed>=RULES.duration)this.finishTreeTag('ent');else if(ents.length&&ents.every(u=>u.treeTagCaptured))this.finishTreeTag('infernal');else if(tt.elapsed>=RULES.infernalDelay&&infernals.length&&infernals.every(u=>!u.alive))this.finishTreeTag('ent');
 },
 finishTreeTag(role){const tt=this.treeTag;if(tt.finished)return;tt.finished=true;tt.winnerRole=role;this.winningOwners=actors(this).filter(u=>u.treeTagRole===role).map(u=>u.owner);this.winner=this.winningOwners[0]||null;this.phase='victory';this.message=role==='ent'?'Os Ents protegeram a floresta e sobreviveram à caçada!':'Os Infernals capturaram todos os Ents.';},
 snapshotTreeTag(){if(!this.treeTag)return null;const{navigation,step,...state}=this.treeTag;return state;}
};
