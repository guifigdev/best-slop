import {KODO_TAG_CHARACTERS as CHARACTERS,KODO_TAG_BUILDINGS as BUILDINGS,KODO_TAG_UNITS as UNITS,KODO_TAG_RULES as RULES,KODO_TAG_MAP as MAP,KODO_TAG_MINES as MINES,KODO_TAG_FOREST as FOREST} from './kodo-tag-catalog.js';
import {castlePassable,castleSpawnPoint,castleRouteAvailable,moveCastleUnit,castleSegmentClear} from './castle-navigation.js';

const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),finite=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const players=g=>g.units.filter(u=>u.kodoTagCharacter),live=u=>u?.alive&&!u.kodoTagCaptured,active=g=>g.kodoTag&&g.phase==='wave'&&!g.kodoTag.finished,ready=b=>b.alive&&b.workRemaining<=0;
const reject=(g,reason)=>{g.commandFailureReason=reason;return false;};
function usedFood(g,owner){return g.units.filter(u=>u.owner===owner&&u.kodoTagUnit&&u.alive).reduce((n,u)=>n+(u.food||0),0)+g.kodoTag.buildings.filter(b=>b.owner===owner&&b.alive).reduce((n,b)=>n+(b.food||0)+(b.productionQueue||[]).reduce((a,key)=>a+(UNITS[key]?.food||0),0),0);}
const reset=u=>{u.destination=null;u.kodoTagAction=null;u.order='stop';u.moving=false;u.working=false;u.gathering=false;};
const fx=(g,type,u,extra={})=>g.fx(type,u.x,u.z,{source:u.id,kodoTag:true,...extra});
function nav(g){const k=g.kodoTag;Object.assign(k.navigation,{map:k.map,buildings:k.buildings,obstacles:[...k.obstacles,...k.mines.filter(m=>m.alive)],navigationRevision:k.navigationRevision,elapsed:k.elapsed,units:g.units});return k.navigation;}
const inMap=(g,p)=>finite(p)&&p.x>=g.kodoTag.map.minX+.2&&p.x<=g.kodoTag.map.maxX-.2&&p.z>=g.kodoTag.map.minZ+.2&&p.z<=g.kodoTag.map.maxZ-.2;
function controlled(g,hero,c){const id=c.workerId??c.unitId;if(id==null||id===hero.id)return hero;return Number.isInteger(id)?g.units.find(u=>u.id===id&&u.owner===hero.owner&&u.kodoTagUnit&&live(u)):null;}
function approach(g,u,target,reach){
 if(dist(u,target)<=reach){u.kodoTagBlocked=false;return true;}
 const r=Math.max(reach*.98,.4),angle=Math.atan2(u.x-target.x,u.z-target.z),candidates=[];
 for(let i=0;i<8;i++){const a=angle+i*Math.PI/4;candidates.push({x:target.x+Math.sin(a)*r,z:target.z+Math.cos(a)*r});}
 if(target.w&&target.d){const clearance=(u.collisionRadius||.25)+.015;for(const side of [-1,1]){candidates.push({x:target.x+side*(target.w/2+clearance),z:target.z});candidates.push({x:target.x,z:target.z+side*(target.d/2+clearance)});}}candidates.sort((a,b)=>dist(a,u)-dist(b,u));
 const context=nav(g),goal=candidates.filter(p=>dist(p,target)<=reach+.001).find(p=>castlePassable(context,p,u.collisionRadius)&&castleRouteAvailable(context,u,p,u.collisionRadius));
 if(!goal){u.kodoTagBlocked=true;return false;}u.kodoTagBlocked=false;moveCastleUnit(context,u,goal,g.kodoTag.step);
 // The shared navigator intentionally settles within 0.12m of a waypoint.
 // Short Kodo melee reach has a narrower safe band beside a building, so
 // finish that last segment at the same speed with the same swept collider.
 const gap=dist(u,goal);if(!u.moving&&gap>.00001&&gap<=.15&&dist(u,target)>reach){const step=Math.min(gap,u.speed*g.kodoTag.step),end={x:u.x+(goal.x-u.x)*step/gap,z:u.z+(goal.z-u.z)*step/gap};if(castleSegmentClear(context,u,end,u.collisionRadius)){u.facing=Math.atan2(end.x-u.x,end.z-u.z);Object.assign(u,end);u.moving=true;}}
 return dist(u,target)<=reach+.00001;
}
function addUnit(g,raw,owner,near){
 const data=UNITS[raw];if(!data)return null;const context=nav(g),pos=castleSpawnPoint(context,near,data.collisionRadius||.25,{maxDistance:4,ignoreUnits:false});if(!pos)return null;
 const u={...data,id:g.id(),unitKey:raw,owner,team:data.role==='kodo'?2:1,...pos,maxHp:data.hp,hp:data.hp,maxMana:data.mana,mana:data.mana,alive:true,kind:data.modelKey,cd:0,stun:0,moving:false,facing:0,order:'auto',inventory:[],cooldowns:{},kodoTagUnit:true,kodoTagWorker:data.role==='worker',kodoTagKodo:data.role==='kodo',kodoTagSoldier:data.role==='soldier',carrying:null};g.units.push(u);return u;
}
function kill(g,u,attacker){
 if(!u.alive)return;const k=g.kodoTag;
 if(u.kodoTagCharacter){u.kodoTagCaptured=true;u.hp=u.maxHp;u.x=k.map.jail.x+(u.seat%3-1)*.5;u.z=k.map.jail.z+Math.floor(u.seat/3)*.5;reset(u);for(const b of k.buildings)if(b.owner===u.owner)b.alive=false;for(const other of g.units)if(other.owner===u.owner&&other.kodoTagUnit)other.alive=false;k.navigationRevision++;k.players[u.owner].captured=true;g.message=u.name+' foi capturado. Um Runner aliado precisa chegar à prisão central.';fx(g,'castleDeath',u,{captured:true});return;}
 u.alive=false;u.died=g.time;fx(g,'castleDeath',u);if(u.kodoTagStructure)k.navigationRevision++;
 if(u.kodoTagKodo){if(u.unitKey==='oC06'||u.unitKey==='oC22')k.respawns.push({unit:u.unitKey,at:k.elapsed+(u.unitKey==='oC22'?RULES.superKodoRespawn:k.elapsed>=1200?RULES.lateKodoRespawn:RULES.kodoRespawn)});if(u.unitKey==='oC22')for(let i=0;i<2;i++)addUnit(g,'nspd','kodos',{x:u.x+(i?1:-1)*.5,z:u.z});if(attacker?.owner){const p=g.player(attacker.owner);if(p)p.kills++;}}
}
function hurt(g,target,amount,source){if(!live(target))return;const n=Math.min(target.hp,Math.max(0,amount)/(1+.06*Math.max(0,target.armor||0)));target.hp-=n;target.hitAt=g.time;if(n)fx(g,'damage',target,{target:target.id,amount:Math.round(n)});if(target.hp<=0)kill(g,target,source);}
function attack(g,u,target,move=true){
 const reach=(u.range||.7)+(target.w?Math.max(target.w,target.d)/2:target.collisionRadius||.25);
 if(dist(u,target)>reach){if(move)approach(g,u,target,reach);return;}
 if(u.cd>0||u.stun>0)return;u.attackAt=g.time;u.facing=Math.atan2(target.x-u.x,target.z-u.z);u.cd=u.interval||2;fx(g,u.range>=3?'arrow':'slash',u,{target:target.id,tx:target.x,tz:target.z,basicAttack:true,projectileKind:u.unitKey==='hC12'?'arrow':u.unitKey==='eC17'?'siege':u.kodoTagStructure?'arcane':null});hurt(g,target,u.damage,u);
 if(u.key==='oC20'){target.kodoSlowUntil=g.kodoTag.elapsed+5;target.kodoSlowFactor=.5;target.kodoPoison={until:g.kodoTag.elapsed+5,next:g.kodoTag.elapsed+1,damage:4,owner:u.owner};}
 if(u.key==='oC21'&&g.random()<.15){target.stun=2;hurt(g,target,25,u);fx(g,'stun',target);}
 if(u.unitKey==='hC12'&&u.mana>=50&&(u.kodoSlowCd||0)<=g.kodoTag.elapsed){u.mana-=50;u.kodoSlowCd=g.kodoTag.elapsed+8;target.kodoSlowUntil=g.kodoTag.elapsed+20;target.kodoSlowFactor=.4;fx(g,'frost',target);}
}
function gather(g,u,dt){
 const a=u.kodoTagAction,p=g.player(u.owner),resource=[...g.kodoTag.mines,...g.kodoTag.trees].find(m=>m.id===a.target&&m.alive);
 if(!resource||resource.remaining<=0){reset(u);return;}
 const depot=g.kodoTag.buildings.filter(b=>b.owner===u.owner&&b.type==='depot'&&ready(b)).sort((a,b)=>dist(u,a)-dist(u,b))[0];
 if(!depot){u.kodoTagBlocked=true;return;}
 if(u.carrying?.amount){if(approach(g,u,depot,Math.max(depot.w,depot.d)/2+.65)){p[u.carrying.type==='gold'?'gold':'lumber']+=u.carrying.amount;u.carrying=null;u.gatherProgress=0;fx(g,'gold',u,{amount:RULES.goldCarry});}return;}
 if(!approach(g,u,resource,Math.max(resource.w,resource.d)/2+.65))return;u.gatherProgress=(u.gatherProgress||0)+dt;u.gathering=true;
 if(u.gatherProgress>=RULES.gatherCycle){u.gatherProgress=0;const type=resource.gold!=null?'gold':'wood',amount=Math.min(resource.remaining,type==='gold'?RULES.goldCarry:RULES.woodCarry);resource.remaining-=amount;if(resource.gold!=null)resource.gold=resource.remaining;u.carrying={type,amount};if(resource.remaining<=0){resource.alive=false;g.kodoTag.navigationRevision++;}}
}
function bot(g,u){
 const k=g.kodoTag;if(!live(u))return;
 const threat=g.units.filter(x=>x.kodoTagKodo&&live(x)).sort((a,b)=>dist(a,u)-dist(b,u))[0];if(threat&&dist(threat,u)<6){reset(u);const dx=u.x-threat.x,dz=u.z-threat.z,d=Math.hypot(dx,dz)||1;u.destination={x:Math.max(k.map.minX+1,Math.min(k.map.maxX-1,u.x+dx/d*6)),z:Math.max(k.map.minZ+1,Math.min(k.map.maxZ-1,u.z+dz/d*6))};return;}
 const captured=players(g).find(x=>x.kodoTagCaptured);if(captured&&dist(u,captured)>RULES.rescueRadius){reset(u);u.destination={...k.map.jail};return;}
 if(u.kodoTagAction||u.destination)return;
 const depot=k.buildings.find(b=>b.owner===u.owner&&b.type==='depot'&&b.alive);
 if(!depot){for(const [dx,dz]of [[2,0],[-2,0],[0,2],[0,-2]])if(g.kodoTagCommand(u,{type:'ktBuild',building:'hC08',x:u.x+dx,z:u.z+dz}))return;}
 else if(ready(depot)){if(u.gold>=300&&!g.units.some(w=>w.kodoTagWorker&&w.owner===u.owner&&live(w))&&!depot.productionQueue.length)g.kodoTagCommand(u,{type:'ktTrain',buildingId:depot.id,unit:'hC19'});const mine=k.mines.filter(m=>m.alive&&m.remaining>0).sort((a,b)=>dist(u,a)-dist(u,b))[0];if(mine)g.kodoTagCommand(u,{type:'ktGather',mineId:mine.id});}
}

export function kodoBuildCheck(game,unit,key,where){
 const k=game?.kodoTag,d=own(BUILDINGS,key)?BUILDINGS[key]:null,hero=game?.player?.(unit?.owner)||game?.units?.find(u=>u.kodoTagCharacter&&u.owner===unit?.owner);
 if(!active(game)||!live(unit)||!unit.canBuild)return{allowed:false,reason:'Somente seu Runner ativo constrói. Camponeses apenas coletam recursos.'};
 if(!d)return{allowed:false,reason:'Construção desconhecida.'};if(hero&&usedFood(game,hero.owner)+(d.food||0)>(hero.foodCap??10))return{allowed:false,reason:'Alimento insuficiente: seu Runner sustenta 10 de população.'};if(!hero||hero.gold<d.cost||hero.lumber<d.lumberCost)return{allowed:false,reason:'Ouro ou madeira insuficientes.'};
 const p={x:Math.round((where?.x??NaN)*2)/2,z:Math.round((where?.z??NaN)*2)/2};if(!inMap(game,p)||p.x-d.w/2<k.map.minX||p.x+d.w/2>k.map.maxX||p.z-d.d/2<k.map.minZ||p.z+d.d/2>k.map.maxZ)return{allowed:false,reason:'Escolha uma área dentro do mapa.'};
 if(dist(p,k.map.jail)<3)return{allowed:false,reason:'Deixe a prisão central livre para os resgates.'};
 if([...k.buildings,...k.obstacles,...k.mines].some(o=>o.alive!==false&&Math.abs(p.x-o.x)<(d.w+o.w)/2+.05&&Math.abs(p.z-o.z)<(d.d+o.d)/2+.05))return{allowed:false,reason:'Terreno ocupado por uma construção, mina ou rochedo.'};
 return{allowed:true,reason:'Área livre para construir.',point:p,definition:d};
}

export const KodoTagMethods={
 setupKodoTagPlayer(u,key='runner'){
  const d=CHARACTERS[key]||CHARACTERS.runner;Object.assign(u,{kodoTagCharacter:'runner',hero:'knight',kind:'runner',team:1,maxHp:d.hp,hp:d.hp,maxMana:0,mana:0,speed:d.speed,damage:d.damage,range:d.range,armor:d.armor,interval:d.interval,collisionRadius:d.collisionRadius,size:d.size,canBuild:true,kodoTagWorker:false,foodCap:d.foodMade||10,foodUsed:0,gold:RULES.startingGold,lumber:RULES.startingLumber,skills:['harvest'],skillLevels:{harvest:1},cooldowns:{},inventory:[],attributes:{str:0,int:0,dex:0,luk:0,vit:0,agi:0},attributePoints:0,skillPoints:0,level:1,xp:0,score:0,order:'stop',ready:false,kodoTagCaptured:false});reset(u);return u;
 },
 initKodoTag(){
  if(this.kodoTag)return false;const runners=players(this);if(!runners.length)return false;
  const map=structuredClone(MAP);this.kodoTag={map,jail:map.jail,remaining:RULES.duration,elapsed:0,releaseAt:RULES.releaseDelay,releaseRemaining:RULES.releaseDelay,difficulty:own(RULES.difficulties,this.options.kodoDifficulty)?this.options.kodoDifficulty:'easy',released:false,buildings:[],mines:structuredClone(MINES),trees:structuredClone(FOREST),obstacles:structuredClone(map.obstacles||[]),players:{},respawns:[],escalationIndex:0,navigation:{},navigationRevision:1,finished:false};this.phase='wave';this.timer=RULES.duration;this.wave=1;this.message='Fuja dos Kodos. Construa Big Wall, colete ouro e treine camponeses. Salve aliados na prisão central.';
  for(const [i,u]of runners.entries()){this.setupKodoTagPlayer(u,u.kodoTagCharacter);const a=i*2.399,pos=castleSpawnPoint(nav(this),{x:map.spawn.x+Math.sin(a)*Math.sqrt(i)*.7,z:map.spawn.z+Math.cos(a)*Math.sqrt(i)*.7},u.collisionRadius,{maxDistance:3});Object.assign(u,pos||map.spawn);u.alive=true;this.kodoTag.players[u.owner]={owner:u.owner,character:'runner',captured:false};delete u.cell;delete u.challenge;}
  return true;
 },
 kodoTagCommand(hero,c){
  if(c.type==='ready'||c.type==='ktReady'){if(this.kodoTag||this.phase!=='preparation')return false;hero.ready=true;if(players(this).every(u=>u.ready||u.bot))return this.initKodoTag();return true;}
  if(!active(this)||!live(hero))return reject(this,'Aguarde um Runner aliado resgatar sua bandeira.');const u=controlled(this,hero,c);if(!u)return reject(this,'Esta unidade não pertence a você ou não está ativa.');
  if(c.type==='ktStop'){reset(u);return true;}
  if(c.type==='ktMove'){if(!inMap(this,c))return false;reset(u);u.destination={x:c.x,z:c.z};u.order='move';return true;}
  if(c.type==='ktAttack'){const t=this.units.find(t=>t.id===c.target&&t.kodoTagKodo&&live(t));if(!t||!u.damage)return false;reset(u);u.kodoTagAction={type:'attack',target:t.id};return true;}
  if(c.type==='ktGather'||c.type==='ktCast'&&c.skill==='harvest'){
   if(!u.kodoTagCharacter&&!u.kodoTagWorker)return reject(this,'Somente Runners e camponeses coletam recursos.');const id=c.mineId??c.treeId??c.target,resource=[...this.kodoTag.mines,...this.kodoTag.trees].find(m=>m.id===id&&m.alive&&m.remaining>0);if(!resource)return reject(this,'Selecione uma mina com ouro.');if(!this.kodoTag.buildings.some(b=>b.owner===hero.owner&&b.type==='depot'&&ready(b)))return reject(this,'Construa e conclua uma Big Wall para receber os recursos.');reset(u);u.kodoTagAction={type:'gather',target:resource.id};u.gatherProgress=0;return true;
  }
  if(c.type==='ktBuild'){const check=kodoBuildCheck(this,u,c.building,c);if(!check.allowed)return reject(this,check.reason);const d=check.definition,b={...d,...check.point,id:this.id(),owner:hero.owner,team:1,kodoTagStructure:true,alive:true,maxHp:d.hp,hp:d.hp*.1,workRemaining:d.buildTime,workTotal:d.buildTime,workProgress:0,productionQueue:[],trainRemaining:0,cd:0};this.kodoTag.buildings.push(b);this.kodoTag.navigationRevision++;hero.gold-=d.cost;hero.lumber-=d.lumberCost;reset(u);u.kodoTagAction={type:'build',target:b.id};fx(this,'castleBuild',b,{duration:d.buildTime});return true;}
  if(c.type==='ktResume'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&b.alive&&b.workRemaining>0);if(!b||!u.canBuild)return false;reset(u);u.kodoTagAction={type:'build',target:b.id};return true;}
  if(c.type==='ktTrain'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&ready(b)),d=own(UNITS,c.unit)?UNITS[c.unit]:null;if(!b||!d||!b.train.includes(c.unit))return reject(this,'Esta construção não treina essa unidade.');if(usedFood(this,hero.owner)+(d.food||0)>(hero.foodCap??10))return reject(this,'Alimento insuficiente: seu Runner sustenta 10 de população.');if(hero.gold<d.cost||hero.lumber<d.lumberCost)return reject(this,'Ouro insuficiente para treinar.');hero.gold-=d.cost;hero.lumber-=d.lumberCost;b.productionQueue.push(c.unit);if(b.trainRemaining<=0)b.trainRemaining=UNITS[b.productionQueue[0]].buildTime;return true;}
  if(c.type==='ktDemolish'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&b.alive);if(!b)return false;b.alive=false;this.kodoTag.navigationRevision++;return true;}
  return reject(this,'Esta ação não existe no Kodo Tag clássico de referência.');
 },
 tickKodoTag(dt){
  if(!Number.isFinite(dt)||dt<=0)return;if(!this.kodoTag){if(this.phase==='preparation'&&(this.timer-=dt)<=0)this.initKodoTag();return;}if(!active(this))return;
  const k=this.kodoTag;k.elapsed+=dt;k.step=Math.min(.15,dt);k.remaining=Math.max(0,RULES.duration-k.elapsed);k.releaseRemaining=Math.max(0,k.releaseAt-k.elapsed);this.timer=k.remaining;this.effects=this.effects.filter(e=>this.time-e.time<(e.duration||1.5));
  if(!k.released&&k.elapsed>=k.releaseAt){k.released=true;for(let i=0;i<RULES.difficulties[k.difficulty];i++)addUnit(this,'oC06','kodos',{x:k.map.jail.x+(i%2?1:-1),z:k.map.jail.z});this.message='Os Kodos foram libertados!';}
  while(k.escalationIndex<RULES.escalation.length&&k.elapsed>=RULES.escalation[k.escalationIndex].at){const wave=RULES.escalation[k.escalationIndex++];for(let i=0;i<wave.count;i++)addUnit(this,wave.unit,'kodos',k.map.jail);}
  for(const task of [...k.respawns])if(k.elapsed>=task.at){if(addUnit(this,task.unit,'kodos',k.map.jail))k.respawns.splice(k.respawns.indexOf(task),1);}
  for(const u of this.units.filter(u=>live(u)&&(u.kodoTagCharacter||u.kodoTagUnit))){u.cd=Math.max(0,(u.cd||0)-dt);u.stun=Math.max(0,(u.stun||0)-dt);u.moving=false;u.working=false;u.gathering=false;if(u.mana<u.maxMana)u.mana=Math.min(u.maxMana,u.mana+dt*.65);if(u.kodoPoison&&k.elapsed>=u.kodoPoison.next){if(k.elapsed<=u.kodoPoison.until)hurt(this,u,u.kodoPoison.damage,{owner:u.kodoPoison.owner});u.kodoPoison.next+=1;}
   if(u.stun>0||!live(u))continue;
   if(u.kodoTagKodo){const targets=[...players(this).filter(live),...this.units.filter(t=>t.kodoTagUnit&&!t.kodoTagKodo&&live(t)),...k.buildings.filter(b=>b.alive)],target=targets.sort((a,b)=>dist(a,u)-dist(b,u))[0];if(target){u.target=target.id;const speed=u.speed;u.speed*=u.kodoSlowUntil>k.elapsed?u.kodoSlowFactor||.5:1;attack(this,u,target);if(u.kodoTagBlocked&&!target.kodoTagStructure){for(const barrier of k.buildings.filter(b=>b.alive).sort((a,b)=>dist(a,u)-dist(b,u)).slice(0,4)){attack(this,u,barrier);if(!u.kodoTagBlocked)break;}}u.speed=speed;}continue;}
   if(u.bot&&(!u.kodoNextThink||k.elapsed>=u.kodoNextThink)){u.kodoNextThink=k.elapsed+.8;bot(this,u);}
   if(u.kodoTagWorker&&u.order==='auto'&&!u.kodoTagAction&&!u.destination){const mine=k.mines.filter(m=>m.alive&&m.remaining>0).sort((a,b)=>dist(u,a)-dist(u,b))[0],hero=this.player(u.owner);if(mine&&hero)this.kodoTagCommand(hero,{type:'ktGather',workerId:u.id,mineId:mine.id});}
   const a=u.kodoTagAction;if(a?.type==='build'){const b=k.buildings.find(b=>b.id===a.target&&b.alive);if(!b)reset(u);else if(approach(this,u,b,Math.max(b.w,b.d)/2+RULES.buildReach)){b.workRemaining=Math.max(0,b.workRemaining-dt);b.workProgress=1-b.workRemaining/b.workTotal;b.hp=Math.max(b.hp,b.maxHp*(.1+.9*b.workProgress));u.working=true;if(b.workRemaining<=0){b.hp=b.maxHp;reset(u);fx(this,'levelup',b);}}}
   else if(a?.type==='gather')gather(this,u,dt);else if(a?.type==='attack'){const t=this.units.find(t=>t.id===a.target&&live(t));if(t)attack(this,u,t);else reset(u);}
   else if(u.destination){moveCastleUnit(nav(this),u,u.destination,k.step);if(dist(u,u.destination)<.2){u.destination=null;u.order='stop';}}
   else if(u.kodoTagSoldier){const t=this.units.filter(t=>t.kodoTagKodo&&live(t)&&dist(t,u)<=Math.max(7,u.range)).sort((a,b)=>dist(a,u)-dist(b,u))[0];if(t)attack(this,u,t);}
  }
  for(const b of k.buildings.filter(ready)){b.cd=Math.max(0,(b.cd||0)-dt);if(b.type.toLowerCase().includes('tower')){const t=this.units.filter(u=>u.kodoTagKodo&&live(u)&&dist(u,b)<b.range+u.collisionRadius).sort((a,c)=>dist(a,b)-dist(c,b))[0];if(t)attack(this,b,t,false);}
   if(b.productionQueue.length){b.trainRemaining=Math.max(0,b.trainRemaining-dt);if(b.trainRemaining<=0){const key=b.productionQueue[0],data=UNITS[key],u=addUnit(this,key,b.owner,{x:b.x+b.w/2+data.collisionRadius+.2,z:b.z});if(u){b.productionQueue.shift();b.trainRemaining=b.productionQueue.length?UNITS[b.productionQueue[0]].buildTime:0;fx(this,'summon',u);}else b.spawnBlocked=true;}}
  }
  for(const p of players(this))p.foodUsed=usedFood(this,p.owner);
  const rescuers=players(this).filter(live);for(const u of players(this).filter(u=>u.kodoTagCaptured)){const ally=rescuers.find(a=>a.owner!==u.owner&&dist(a,k.map.jail)<=RULES.rescueRadius);if(ally){u.kodoTagCaptured=false;u.hp=u.maxHp;const pos=castleSpawnPoint(nav(this),k.map.spawn,u.collisionRadius,{maxDistance:3})||k.map.spawn;Object.assign(u,pos);k.players[u.owner].captured=false;reset(u);fx(this,'levelup',u,{rescue:true});this.message=u.name+' voltou à caçada após o resgate.';}}
  if(k.remaining<=0){k.finished=true;this.phase='victory';this.winningOwners=players(this).map(u=>u.owner);this.message='25 minutos! Os Runners sobreviveram à caçada.';}else if(players(this).length&&players(this).every(u=>u.kodoTagCaptured)){k.finished=true;this.phase='defeat';this.winningOwners=[];this.message='Todos os Runners foram capturados pelos Kodos.';}
 },
 snapshotKodoTag(){if(!this.kodoTag)return null;const {navigation,step,...data}=this.kodoTag;return{...data,kodos:this.units.filter(u=>u.kodoTagKodo),workers:this.units.filter(u=>u.kodoTagWorker)};}
};
