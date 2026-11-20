import {resolveUnitCollisions} from './unit-collision.js';
import {KODO_TAG_CHARACTERS as CHARACTERS,KODO_TAG_BUILDINGS as BUILDINGS,KODO_TAG_UNITS as UNITS,KODO_TAG_RULES as RULES,KODO_TAG_MAP as MAP,KODO_TAG_MINES as MINES,KODO_TAG_FOREST as FOREST} from './kodo-tag-catalog.js';
import {constructionDisplacements,applyConstructionDisplacements,castleNavigationRadius,castlePassable,castleSpawnPoint,castleRouteAvailable,castleRoutePath,castleFirstRouteBlocker,moveCastleUnit,castleSegmentClear} from './castle-navigation.js';

const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),finite=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const players=g=>g.units.filter(u=>u.kodoTagCharacter),live=u=>u?.alive&&!u.kodoTagCaptured,active=g=>g.kodoTag&&g.phase==='wave'&&!g.kodoTag.finished,ready=b=>b.alive&&b.workRemaining<=0;
const reject=(g,reason)=>{g.commandFailureReason=reason;return false;};
function usedFood(g,owner){return g.units.filter(u=>u.owner===owner&&u.kodoTagUnit&&u.alive).reduce((n,u)=>n+(u.food||0),0)+g.kodoTag.buildings.filter(b=>b.owner===owner&&b.alive).reduce((n,b)=>n+(b.food||0)+(b.productionQueue||[]).reduce((a,key)=>a+(UNITS[key]?.food||0),0),0);}
const reset=u=>{u.destination=null;u.kodoTagAction=null;u.kodoTagBuildQueue=[];u.kodoTagBuildPaused=false;u.order='stop';u.moving=false;u.working=false;u.gathering=false;};
const fx=(g,type,u,extra={})=>g.fx(type,u.x,u.z,{source:u.id,kodoTag:true,...extra});
function nav(g){const k=g.kodoTag;if(k.navigation.resourceRevision!==k.navigationRevision){k.navigation.obstacles=[...k.obstacles,...k.mines.filter(m=>m.alive),...k.trees.filter(t=>t.alive)];k.navigation.resourceRevision=k.navigationRevision;}Object.assign(k.navigation,{map:k.map,buildings:k.buildings,navigationRevision:k.navigationRevision,elapsed:k.elapsed,units:g.units});return k.navigation;}
const inMap=(g,p)=>finite(p)&&p.x>=g.kodoTag.map.minX+.2&&p.x<=g.kodoTag.map.maxX-.2&&p.z>=g.kodoTag.map.minZ+.2&&p.z<=g.kodoTag.map.maxZ-.2;
function controlled(g,hero,c){const id=c.workerId??c.unitId;if(id==null||id===hero.id)return hero;return Number.isInteger(id)?g.units.find(u=>u.id===id&&u.owner===hero.owner&&u.kodoTagUnit&&live(u)):null;}
const buildApproaches=new WeakMap(),huntPlans=new WeakMap();
function pauseWork(u){const queue=[...(u.kodoTagBuildQueue||[])];if(u.kodoTagAction?.type==='build'&&!queue.includes(u.kodoTagAction.target))queue.unshift(u.kodoTagAction.target);reset(u);u.kodoTagBuildQueue=queue;u.kodoTagBuildPaused=queue.length>0;buildApproaches.delete(u);}
function queueBuild(g,u,b){
 if(u.kodoTagAction?.type==='build'&&g.kodoTag.buildings.some(t=>t.id===u.kodoTagAction.target&&t.alive&&t.workRemaining>0)){
  if(u.kodoTagAction.target!==b.id&&!(u.kodoTagBuildQueue||[]).includes(b.id))(u.kodoTagBuildQueue??=[]).push(b.id);
 }else if(u.kodoTagBuildPaused&&u.kodoTagBuildQueue?.length){if(!u.kodoTagBuildQueue.includes(b.id))u.kodoTagBuildQueue.push(b.id);nextBuild(g,u);}
 else{reset(u);u.kodoTagAction={type:'build',target:b.id};u.order='build';}
 u.kodoTagBuildPaused=false;
}
function nextBuild(g,u){
 const queue=[...(u.kodoTagBuildQueue||[])];reset(u);buildApproaches.delete(u);
 while(queue.length){const id=queue.shift();if(g.kodoTag.buildings.some(b=>b.id===id&&b.owner===u.owner&&b.alive&&b.workRemaining>0)){u.kodoTagAction={type:'build',target:id};u.kodoTagBuildQueue=queue;u.order='build';break;}}
}
function approach(g,u,target,reach,surfaceReach=null){
 const within=p=>surfaceReach==null?dist(p,target)<=reach+.00001:Math.hypot(Math.max(0,Math.abs(p.x-target.x)-target.w/2),Math.max(0,Math.abs(p.z-target.z)-target.d/2))<=surfaceReach+.00001;
 if(within(u)){u.kodoTagBlocked=false;return true;}
 const bodyRadius=castleNavigationRadius(u),r=Math.max(reach*.98,.4),angle=Math.atan2(u.x-target.x,u.z-target.z),candidates=[];
 for(let i=0;i<16;i++){const a=angle+i*Math.PI/8;candidates.push({x:target.x+Math.sin(a)*r,z:target.z+Math.cos(a)*r});}
 if(target.w&&target.d){const clearance=bodyRadius+.03;for(const side of [-1,1])for(const fraction of [-.7,0,.7]){candidates.push({x:target.x+side*(target.w/2+clearance),z:target.z+fraction*target.d/2});candidates.push({x:target.x+fraction*target.w/2,z:target.z+side*(target.d/2+clearance)});}}candidates.sort((a,b)=>dist(a,u)-dist(b,u));
 const context=nav(g);let plan=buildApproaches.get(u),goal=plan&&plan.target===target.id&&plan.revision===g.kodoTag.navigationRevision&&plan.radius===bodyRadius&&(!plan.targetPoint||dist(plan.targetPoint,target)<.75)&&castlePassable(context,plan.goal,bodyRadius)?plan.goal:null;
 if(!goal){goal=candidates.filter(within).find(p=>castlePassable(context,p,bodyRadius)&&(u.kodoTagKodo?!!castleRoutePath(context,u,p,bodyRadius):castleRouteAvailable(context,u,p,bodyRadius)));if(goal){plan={target:target.id,revision:g.kodoTag.navigationRevision,radius:bodyRadius,goal,targetPoint:{x:target.x,z:target.z},stalled:0};buildApproaches.set(u,plan);}}
 if(!goal){u.kodoTagBlocked=true;u.moving=false;return false;}u.kodoTagBlocked=false;moveCastleUnit(context,u,goal,g.kodoTag.step);
 const gap=dist(u,goal);if(!u.moving&&gap>.00001&&gap<=.15&&!within(u)){const step=Math.min(gap,u.speed*g.kodoTag.step),end={x:u.x+(goal.x-u.x)*step/gap,z:u.z+(goal.z-u.z)*step/gap};if(castleSegmentClear(context,u,end,bodyRadius)){u.facing=Math.atan2(end.x-u.x,end.z-u.z);Object.assign(u,end);u.moving=true;}}
 if(!u.moving&&!within(u)){plan.stalled+=g.kodoTag.step;if(plan.stalled>.6){buildApproaches.delete(u);u.kodoTagBlocked=true;}}else plan.stalled=0;
 return within(u);
}
function addUnit(g,raw,owner,near){
 const data=UNITS[raw];if(!data)return null;const context=nav(g),radius=data.role==='kodo'?Math.max(data.collisionRadius||0,(data.size||1)*.82):data.collisionRadius||.25,pos=castleSpawnPoint(context,near,radius,{maxDistance:4,ignoreUnits:false});if(!pos)return null;
 const bodyRadius=data.role==='kodo'?Math.max(data.collisionRadius||0,(data.size||1)*.82):data.collisionRadius;const u={...data,collisionRadius:bodyRadius,id:g.id(),unitKey:raw,owner,team:data.role==='kodo'?2:1,...pos,maxHp:data.hp,hp:data.hp,maxMana:data.mana,mana:data.mana,alive:true,kind:data.modelKey,cd:0,stun:0,moving:false,facing:0,order:'auto',inventory:[],cooldowns:{},kodoTagUnit:true,kodoTagWorker:data.role==='worker',kodoTagKodo:data.role==='kodo',kodoTagSoldier:data.role==='soldier',carrying:null};g.units.push(u);return u;
}
function destroyBuilding(g,b,reason,attacker=null){
 if(!b?.alive)return false;b.alive=false;b.died=g.time;g.kodoTag.navigationRevision++;
 fx(g,'kodoRubble',b,{building:b.id,buildingId:b.id,key:b.key,w:b.w,d:b.d,owner:b.owner,team:b.team,reason,attacker:attacker?.id??null,duration:2.4});return true;
}
function creditGold(g,u,amount,reason,extra={}){
 const wallet=g.player(u.owner);if(!wallet||!Number.isFinite(amount)||amount<=0)return false;wallet.gold+=amount;
 fx(g,'kodoGold',u,{target:u.id,owner:u.owner,amount,reason,duration:1.2,...extra});return true;
}

function kill(g,u,attacker){
 if(!u.alive)return;const k=g.kodoTag;
 if(u.kodoTagCharacter){u.kodoTagCaptured=true;u.hp=u.maxHp;u.x=k.map.jail.x+(u.seat%3-1)*.5;u.z=k.map.jail.z+Math.floor(u.seat/3)*.5;reset(u);for(const b of k.buildings)if(b.owner===u.owner)destroyBuilding(g,b,'capture',attacker);for(const other of g.units)if(other.owner===u.owner&&other.kodoTagUnit)other.alive=false;k.navigationRevision++;k.players[u.owner].captured=true;g.message=u.name+' foi capturado. Um Runner aliado precisa chegar à prisão central.';fx(g,'castleDeath',u,{captured:true});return;}
 if(u.kodoTagStructure){destroyBuilding(g,u,'combat',attacker);return;}u.alive=false;u.died=g.time;fx(g,'castleDeath',u);
 if(u.kodoTagKodo){if(u.unitKey==='oC06'||u.unitKey==='oC22')k.respawns.push({unit:u.unitKey,at:k.elapsed+(u.unitKey==='oC22'?RULES.superKodoRespawn:k.elapsed>=1200?RULES.lateKodoRespawn:RULES.kodoRespawn)});if(u.unitKey==='oC22')for(let i=0;i<2;i++)addUnit(g,'nspd','kodos',{x:u.x+(i?1:-1)*.5,z:u.z});if(attacker?.owner){const p=g.player(attacker.owner);if(p)p.kills++;}}
}
function hurt(g,target,amount,source){if(!live(target))return;const n=Math.min(target.hp,Math.max(0,amount)/(1+.06*Math.max(0,target.armor||0)));target.hp-=n;target.hitAt=g.time;if(n)fx(g,'damage',target,{target:target.id,amount:Math.round(n)});if(target.hp<=0)kill(g,target,source);}
function attack(g,u,target,move=true){
 const strikingDistance=Math.max(u.range||.7,(u.collisionRadius||.25)+.1),reach=strikingDistance+(target.w?Math.max(target.w,target.d)/2:target.collisionRadius||.25),inReach=target.w&&target.d?Math.hypot(Math.max(0,Math.abs(u.x-target.x)-target.w/2),Math.max(0,Math.abs(u.z-target.z)-target.d/2))<=strikingDistance:dist(u,target)<=reach;
 if(!inReach){if(move)approach(g,u,target,reach,target.w&&target.d?strikingDistance:null);return;}
 u.kodoTagBlocked=false;if(u.cd>0||u.stun>0)return;u.attackAt=g.time;u.facing=Math.atan2(target.x-u.x,target.z-u.z);u.cd=u.interval||2;fx(g,u.range>=3?'arrow':'slash',u,{target:target.id,tx:target.x,tz:target.z,basicAttack:true,projectileKind:u.unitKey==='hC12'?'arrow':u.unitKey==='eC17'?'siege':u.kodoTagStructure?'arcane':null});hurt(g,target,u.damage,u);
 if(u.key==='oC20'){target.kodoSlowUntil=g.kodoTag.elapsed+5;target.kodoSlowFactor=.5;target.kodoPoison={until:g.kodoTag.elapsed+5,next:g.kodoTag.elapsed+1,damage:4,owner:u.owner};}
 if(u.key==='oC21'&&g.random()<.15){target.stun=2;hurt(g,target,25,u);fx(g,'stun',target);}
 if(u.unitKey==='hC12'&&u.mana>=50&&(u.kodoSlowCd||0)<=g.kodoTag.elapsed){u.mana-=50;u.kodoSlowCd=g.kodoTag.elapsed+8;target.kodoSlowUntil=g.kodoTag.elapsed+20;target.kodoSlowFactor=.4;fx(g,'frost',target);}
}
function runnerRoute(context,u,target,radius){
 if(castlePassable(context,target,radius))return castleRoutePath(context,u,target,radius);
 // A small Runner can hug a wall that the much wider Kodo cannot occupy.
 // Route to a genuine attack position instead of declaring that wall sealed.
 const reach=Math.max(u.range||.7,radius+.1)+(target.collisionRadius||.2)-.03;
 for(let i=0;i<16;i++){const angle=i*Math.PI/8,point={x:target.x+Math.cos(angle)*reach,z:target.z+Math.sin(angle)*reach};if(castlePassable(context,point,radius)&&castleSegmentClear(context,point,target,0)){const route=castleRoutePath(context,u,point,radius);if(route)return route;}}
 return null;
}
function huntRunner(g,u){
 const k=g.kodoTag,runners=players(g).filter(live),context=nav(g),radius=castleNavigationRadius(u);if(!runners.length)return;
 let plan=huntPlans.get(u);const old=runners.find(p=>p.id===plan?.targetId);
 if(!plan||!old||plan.revision!==k.navigationRevision||k.elapsed>=plan.until||dist(old,plan.targetPoint)>2){
  const sorted=runners.sort((a,b)=>dist(u,a)-dist(u,b));let target=sorted[0],path=null;
  // Prefer a reachable Runner even if another is closer behind sealed walls.
  for(const candidate of sorted){const route=runnerRoute(context,u,candidate,radius);if(route){target=candidate;path=route;break;}}
  let blocker=null;
  if(!path){
   // Only the absence of a complete walking route permits demolition. Mines,
   // cliffs and trees stay solid in the alternative route; buildings alone
   // are removed to discover the first real obstruction along that route.
   const terrain={...context,buildings:[],navigationRevision:k.navigationRevision},route=castleRoutePath(terrain,u,target,radius);blocker=castleFirstRouteBlocker(route,k.buildings.filter(b=>b.alive),radius);
  }
  plan={targetId:target.id,targetPoint:{x:target.x,z:target.z},blockerId:blocker?.id,reachable:!!path,revision:k.navigationRevision,until:k.elapsed+.9};huntPlans.set(u,plan);
 }
 const target=runners.find(p=>p.id===plan.targetId);if(!target)return;u.kodoTagHuntTarget=target.id;
 const blocker=plan.blockerId&&k.buildings.find(b=>b.id===plan.blockerId&&b.alive);u.kodoTagBreachTarget=blocker?.id??null;u.target=(blocker||target).id;
 if(plan.reachable||blocker)attack(g,u,blocker||target);else{u.kodoTagBlocked=true;u.moving=false;}
}

function gather(g,u,dt){
 const a=u.kodoTagAction,p=g.player(u.owner),resource=[...g.kodoTag.mines,...g.kodoTag.trees].find(m=>m.id===a.target&&m.alive);
 const depot=g.kodoTag.buildings.filter(b=>b.owner===u.owner&&b.type==='depot'&&ready(b)).sort((a,b)=>dist(u,a)-dist(u,b))[0];
 if(!depot){u.kodoTagBlocked=true;return;}
 if(u.carrying?.amount){if(approach(g,u,depot,Math.max(depot.w,depot.d)/2+.65)){const load=u.carrying;if(load.type==='gold')creditGold(g,u,load.amount,'delivery',{depot:depot.id});else p.lumber+=load.amount;u.carrying=null;u.gatherProgress=0;}return;}
 if(!resource||resource.remaining<=0){reset(u);return;}
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
 const p={x:Math.round((where?.x??NaN)*4)/4,z:Math.round((where?.z??NaN)*4)/4};if(!inMap(game,p)||p.x-d.w/2<k.map.minX||p.x+d.w/2>k.map.maxX||p.z-d.d/2<k.map.minZ||p.z+d.d/2>k.map.maxZ)return{allowed:false,reason:'Escolha uma área dentro do mapa.'};
 if(dist(p,k.map.jail)<3)return{allowed:false,reason:'Deixe a prisão central livre para os resgates.'};
 if([...k.buildings,...k.obstacles,...k.mines,...k.trees].some(o=>o.alive!==false&&Math.abs(p.x-o.x)<(d.w+o.w)/2-.000001&&Math.abs(p.z-o.z)<(d.d+o.d)/2-.000001))return{allowed:false,reason:'Terreno ocupado por uma construção, mina ou rochedo.'};
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
  if(c.type==='ktUnitBatch'||c.type==='ktBuildingBatch'){
   const buildings=c.type==='ktBuildingBatch',types=buildings?{train:'ktTrain'}:{move:'ktMove',stop:'ktStop',gather:'ktGather',attack:'ktAttack'},type=own(types,c.action)?types[c.action]:null;
   const input=buildings?c.buildingIds:c.unitIds;if(!type||!Array.isArray(input))return reject(this,'Selecione um grupo e uma ação válida.');
   const ids=[...new Set(input)];if(!ids.length||ids.some(id=>!Number.isInteger(id)||(buildings?!this.kodoTag.buildings.some(b=>b.id===id&&b.owner===hero.owner&&b.alive):!controlled(this,hero,{unitId:id}))))return reject(this,'Selecione apenas unidades ou construções vivas do seu jogador.');let succeeded=0;const cols=Math.ceil(Math.sqrt(ids.length));
   for(const [i,id]of ids.entries()){
    if(buildings){if(!this.kodoTag.buildings.some(b=>b.id===id&&b.owner===hero.owner&&ready(b)))continue;}
    else if(!controlled(this,hero,{unitId:id}))continue;
    let point=c;if(c.action==='move'){if(!inMap(this,c))continue;const near={x:c.x+(i%cols-(cols-1)/2)*.9,z:c.z+(Math.floor(i/cols)-(Math.ceil(ids.length/cols)-1)/2)*.9},actor=controlled(this,hero,{unitId:id}),p=castleSpawnPoint(nav(this),near,actor.collisionRadius||.25,{maxDistance:3});if(!p)continue;point={...c,...p};}
    if(this.kodoTagCommand(hero,{...point,type,workerId:buildings?undefined:id,unitId:undefined,buildingId:buildings?id:undefined}))succeeded++;
   }
   hero.kodoTagLastBatch={action:c.action,requested:ids.length,succeeded,failed:ids.length-succeeded,at:this.kodoTag.elapsed};if(succeeded){this.commandFailureReason=null;return true;}return reject(this,this.commandFailureReason||'A ordem não pode ser aplicada às unidades selecionadas.');
  }
  if(c.type==='ktStop'){pauseWork(u);return true;}
  if(c.type==='ktMove'){if(!inMap(this,c))return reject(this,'Escolha um destino dentro do mapa.');pauseWork(u);u.destination={x:c.x,z:c.z};u.order='move';return true;}
  if(c.type==='ktAttack'){const t=this.units.find(t=>t.id===c.target&&t.kodoTagKodo&&live(t));if(!t||!u.damage)return false;reset(u);u.kodoTagAction={type:'attack',target:t.id};return true;}
  if(c.type==='ktGather'||c.type==='ktCast'&&c.skill==='harvest'){
   if(!u.kodoTagCharacter&&!u.kodoTagWorker)return reject(this,'Somente Runners e camponeses coletam recursos.');const id=c.mineId??c.treeId??c.target,resource=[...this.kodoTag.mines,...this.kodoTag.trees].find(m=>m.id===id&&m.alive&&m.remaining>0);if(!resource)return reject(this,'Selecione uma mina com ouro.');if(!this.kodoTag.buildings.some(b=>b.owner===hero.owner&&b.type==='depot'&&ready(b)))return reject(this,'Construa e conclua uma Big Wall para receber os recursos.');reset(u);u.kodoTagAction={type:'gather',target:resource.id};u.gatherProgress=0;return true;
  }
  if(c.type==='ktBuild'){const check=kodoBuildCheck(this,u,c.building,c);if(!check.allowed)return reject(this,check.reason);const d=check.definition,b={...d,...check.point,id:this.id(),owner:hero.owner,team:1,kodoTagStructure:true,alive:true,maxHp:d.hp,hp:d.hp*.1,workRemaining:d.buildTime,workTotal:d.buildTime,workProgress:0,productionQueue:[],trainRemaining:0,cd:0};const exits=constructionDisplacements(nav(this),b,this.units.filter(t=>t.kodoTagCharacter||t.kodoTagUnit));if(!exits)return reject(this,'Não há espaço livre ao lado para retirar as unidades da obra.');this.kodoTag.buildings.push(b);this.kodoTag.navigationRevision++;applyConstructionDisplacements(exits);hero.gold-=d.cost;hero.lumber-=d.lumberCost;queueBuild(this,u,b);fx(this,'castleBuild',b,{duration:d.buildTime});return true;}
  if(c.type==='ktResume'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&b.alive&&b.workRemaining>0);if(!b||!u.canBuild)return reject(this,'Selecione seu Runner e uma obra sua incompleta.');queueBuild(this,u,b);return true;}
  if(c.type==='ktTrain'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&ready(b)),d=own(UNITS,c.unit)?UNITS[c.unit]:null;if(!b||!d||!b.train.includes(c.unit))return reject(this,'Esta construção não treina essa unidade.');if(usedFood(this,hero.owner)+(d.food||0)>(hero.foodCap??10))return reject(this,'Alimento insuficiente: seu Runner sustenta 10 de população.');if(hero.gold<d.cost||hero.lumber<d.lumberCost)return reject(this,'Ouro insuficiente para treinar.');hero.gold-=d.cost;hero.lumber-=d.lumberCost;b.productionQueue.push(c.unit);if(b.trainRemaining<=0)b.trainRemaining=UNITS[b.productionQueue[0]].buildTime;return true;}
  if(c.type==='ktDemolish'){const b=this.kodoTag.buildings.find(b=>b.id===c.buildingId&&b.owner===hero.owner&&b.alive);if(!b)return false;return destroyBuilding(this,b,'demolish',hero);}
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
   if((u.destination||u.kodoTagAction)&&!castlePassable(nav(this),u,castleNavigationRadius(u))){const exit=castleSpawnPoint(nav(this),u,castleNavigationRadius(u),{maxDistance:5,ignoreUnits:false,ignoreId:u.id});if(exit)Object.assign(u,exit);}
   if(u.kodoTagKodo){const speed=u.speed;u.speed*=u.kodoSlowUntil>k.elapsed?u.kodoSlowFactor||.5:1;huntRunner(this,u);u.speed=speed;continue;}
   if(u.bot&&(!u.kodoNextThink||k.elapsed>=u.kodoNextThink)){u.kodoNextThink=k.elapsed+.8;bot(this,u);}
   if(u.kodoTagWorker&&u.order==='auto'&&!u.kodoTagAction&&!u.destination){const mine=k.mines.filter(m=>m.alive&&m.remaining>0).sort((a,b)=>dist(u,a)-dist(u,b))[0],hero=this.player(u.owner);if(mine&&hero)this.kodoTagCommand(hero,{type:'ktGather',workerId:u.id,mineId:mine.id});}
   const a=u.kodoTagAction;if(a?.type==='build'){const b=k.buildings.find(b=>b.id===a.target&&b.alive);if(!b)nextBuild(this,u);else if(approach(this,u,b,Math.max(b.w,b.d)/2+RULES.buildReach)){b.workRemaining=Math.max(0,b.workRemaining-dt);b.workProgress=1-b.workRemaining/b.workTotal;b.hp=Math.max(b.hp,b.maxHp*(.1+.9*b.workProgress));u.working=true;if(b.workRemaining<=0){b.hp=b.maxHp;b.completedAt=k.elapsed;nextBuild(this,u);fx(this,'levelup',b);}}}
   else if(a?.type==='gather')gather(this,u,dt);else if(a?.type==='attack'){const t=this.units.find(t=>t.id===a.target&&live(t));if(t)attack(this,u,t);else reset(u);}
   else if(u.destination){moveCastleUnit(nav(this),u,u.destination,k.step);if(dist(u,u.destination)<.2){u.destination=null;u.order='stop';}}
   else if(u.kodoTagSoldier){const t=this.units.filter(t=>t.kodoTagKodo&&live(t)&&dist(t,u)<=Math.max(7,u.range)).sort((a,b)=>dist(a,u)-dist(b,u))[0];if(t)attack(this,u,t);}
  }
  const collisionUnits=this.units.filter(u=>live(u)&&(u.kodoTagCharacter||u.kodoTagUnit)),collisionNav=nav(this);
  resolveUnitCollisions({units:collisionUnits,time:this.time,bounds:Math.max(Math.abs(k.map.minX),Math.abs(k.map.maxX),Math.abs(k.map.minZ),Math.abs(k.map.maxZ)),options:{mode:'linewars'},obstacles:[],unitTerrainBlocked:(u,p,r)=>!castlePassable(collisionNav,p,r)},dt);
  for(const b of k.buildings.filter(ready)){b.cd=Math.max(0,(b.cd||0)-dt);if(b.type.toLowerCase().includes('tower')){const t=this.units.filter(u=>u.kodoTagKodo&&live(u)&&dist(u,b)<b.range+u.collisionRadius).sort((a,c)=>dist(a,b)-dist(c,b))[0];if(t)attack(this,b,t,false);}
   if(b.productionQueue.length){b.trainRemaining=Math.max(0,b.trainRemaining-dt);if(b.trainRemaining<=0){const key=b.productionQueue[0],data=UNITS[key],u=addUnit(this,key,b.owner,{x:b.x+b.w/2+data.collisionRadius+.2,z:b.z});if(u){b.productionQueue.shift();b.trainRemaining=b.productionQueue.length?UNITS[b.productionQueue[0]].buildTime:0;fx(this,'summon',u);}else b.spawnBlocked=true;}}
  }
  for(const p of players(this))p.foodUsed=usedFood(this,p.owner);
  const rescuers=players(this).filter(live);for(const u of players(this).filter(u=>u.kodoTagCaptured)){const ally=rescuers.find(a=>a.owner!==u.owner&&dist(a,k.map.jail)<=RULES.rescueRadius);if(ally){u.kodoTagCaptured=false;u.hp=u.maxHp;const pos=castleSpawnPoint(nav(this),k.map.spawn,u.collisionRadius,{maxDistance:3})||k.map.spawn;Object.assign(u,pos);k.players[u.owner].captured=false;reset(u);fx(this,'levelup',u,{rescue:true});this.message=u.name+' voltou à caçada após o resgate.';}}
  if(k.remaining<=0){k.finished=true;this.phase='victory';this.winningOwners=players(this).map(u=>u.owner);this.message='25 minutos! Os Runners sobreviveram à caçada.';}else if(players(this).length&&players(this).every(u=>u.kodoTagCaptured)){k.finished=true;this.phase='defeat';this.winningOwners=[];this.message='Todos os Runners foram capturados pelos Kodos.';}
 },
 snapshotKodoTag(){if(!this.kodoTag)return null;const {navigation,step,...data}=this.kodoTag;return{...data,kodos:this.units.filter(u=>u.kodoTagKodo),workers:this.units.filter(u=>u.kodoTagWorker)};}
};
