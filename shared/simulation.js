import {HEROES,SKILLS,ITEMS} from './catalog.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export class Game {
 constructor(seed=7381){this.seed=seed;this.time=0;this.units=[];this.effects=[];this.players={};this.phase='preparation';this.wave=0;this.timer=35;this.serial=0;this.message='Escolha suas habilidades e prepare sua build.';this.duels=0;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 id(){return ++this.serial;}
 addPlayer(id,type='knight',name='Aventureiro'){
  if(this.players[id]||!HEROES[type]||Object.keys(this.players).length>=4||this.phase!=='preparation'||this.wave!==0)return false;
  const h=HEROES[type], index=Object.keys(this.players).length;
  const u={id:this.id(),owner:id,hero:type,name:String(name).slice(0,20),team:1,x:-3+index*2,z:2,hp:h.hp,maxHp:h.hp,mana:h.mana,maxMana:h.mana,damage:h.damage,armor:h.armor,range:h.range,speed:h.speed,interval:h.interval,cd:0,stun:0,skills:[h.skill],cooldowns:{},items:[],gold:650,level:1,xp:0,kills:0,alive:true,order:'auto'};
  this.players[id]=u.id;this.units.push(u);return true;
 }
 player(id){return this.units.find(u=>u.id===this.players[id]);}
 fx(type,x,z,extra={}){this.effects.push({id:this.id(),type,x,z,time:this.time,...extra});}
 command(id,c){
  const u=this.player(id);if(!u||!c||typeof c!=='object')return false;
  if(c.type==='buy'){
   if(this.phase!=='preparation'||!u.alive)return false;
   const s=SKILLS[c.skill];if(!s||u.skills.includes(c.skill)||u.skills.length>=7||u.gold<s.cost)return false;
   u.gold-=s.cost;u.skills.push(c.skill);return true;
  }
  if(c.type==='item'){
   const s=ITEMS[c.item];if(!s||this.phase!=='preparation'||u.gold<s.cost||!u.alive||(c.item!=='potion'&&u.items.length>=6))return false;
   u.gold-=s.cost;if(c.item==='potion')u.hp=Math.min(u.maxHp,u.hp+280);else {u.items.push(c.item);if(c.item==='vitality'){u.maxHp+=180;u.hp+=180;}if(c.item==='mana'){u.maxMana+=120;u.mana+=120;}if(c.item==='blade')u.damage+=12;}return true;
  }
  if(!u.alive||this.phase==='defeat'||this.phase==='victory')return false;
  if(c.type==='move'&&Number.isFinite(c.x)&&Number.isFinite(c.z)){u.destination={x:clamp(c.x,-14,14),z:clamp(c.z,-14,14)};u.order='move';u.target=null;return true;}
  if(c.type==='attack'){const t=this.units.find(t=>t.id===c.target&&t.alive&&t.team!==u.team);if(!t)return false;u.target=t.id;u.order='attack';return true;}
  if(c.type==='stop'){u.order='hold';u.destination=null;u.target=null;return true;}
  if(c.type==='auto'){u.order='auto';u.destination=null;return true;}
  if(c.type==='ready'&&this.phase==='preparation'){this.timer=Math.min(this.timer,3);return true;}
  if(c.type==='cast')return this.cast(u,c);
  return false;
 }
 cast(u,c){
  const key=u.skills[c.slot],s=SKILLS[key];if(!s||s.kind!=='active'||(u.cooldowns[key]||0)>0||u.mana<s.mana||!['wave','duel'].includes(this.phase))return false;
  let t=this.units.find(t=>t.id===c.target&&t.alive&&t.team!==u.team);
  if(s.target==='enemy'&&(!t||distance(u,t)>12))return false;
  if(s.target==='ground'&&(!Number.isFinite(c.x)||!Number.isFinite(c.z)||distance(u,c)>14||Math.abs(c.x)>15||Math.abs(c.z)>15))return false;
  u.mana-=s.mana;u.cooldowns[key]=s.cooldown;
  if(key==='bolt'){this.hit(t,110,u,true);this.fx('bolt',u.x,u.z,{tx:t.x,tz:t.z});}
  if(key==='stomp'){this.fx('stomp',u.x,u.z);for(const e of this.enemies(u,4)){this.hit(e,80,u,true);e.stun=1.5;}}
  if(key==='heal'){u.hp=Math.min(u.maxHp,u.hp+180);this.fx('heal',u.x,u.z);}
  if(key==='chain'){let last=t;const hit=new Set();for(let i=0;i<4&&last;i++){hit.add(last.id);this.hit(last,100*.8**i,u,true);this.fx('bolt',i===0?u.x:t.x,i===0?u.z:t.z,{tx:last.x,tz:last.z});t=last;last=this.enemies(t,6,u.team).find(e=>!hit.has(e.id));}}
  if(key==='blizzard'){this.effects.push({id:this.id(),type:'blizzard',x:c.x,z:c.z,time:this.time,next:this.time,pulses:4,owner:u.id});}
  if(key==='multishot')for(const e of this.enemies(u,10).slice(0,5)){this.hit(e,85,u);this.fx('arrow',u.x,u.z,{tx:e.x,tz:e.z});}
  if(key==='summon'){this.units.push({id:this.id(),owner:u.owner,kind:'wolf',team:u.team,x:u.x+1,z:u.z+1,hp:320,maxHp:320,damage:23,armor:1,range:1.4,speed:5.6,interval:.8,cd:0,stun:0,alive:true,expires:this.time+18});this.fx('heal',u.x+1,u.z+1);}
  if(key==='avatar'){u.avatar=this.time+8;this.fx('stomp',u.x,u.z);}
  return true;
 }
 enemies(u,r=Infinity,team=u.team){return this.units.filter(t=>t.alive&&t.team!==team&&distance(u,t)<=r).sort((a,b)=>distance(u,a)-distance(u,b));}
 hit(t,amount,source,magic=false,reflect=false){
  if(!t?.alive)return 0;let dmg=magic?amount:amount/(1+.06*(t.armor+((t.avatar||0)>this.time?8:0)));
  dmg=Math.max(0,dmg);t.hp-=dmg;this.fx('damage',t.x,t.z,{amount:Math.round(dmg),magic});
  if(!magic&&!reflect&&source?.skills?.includes('vampiric'))source.hp=Math.min(source.maxHp,source.hp+dmg*.15);
  if(!magic&&!reflect&&source?.range<3&&t.skills?.includes('thorns'))this.hit(source,dmg*.2,t,true,true);
  if(t.hp<=0){t.hp=0;t.alive=false;t.died=this.time;if(source){const p=this.player(source.owner);if(p&&t.team!==p.team){p.gold+=this.phase==='duel'?100:18+this.wave*2;p.kills++;p.xp+=20;if(p.xp>=p.level*60){p.xp=0;p.level++;p.maxHp+=45;p.hp=Math.min(p.maxHp,p.hp+90);p.damage+=3;this.fx('heal',p.x,p.z);}}}}
  return dmg;
 }
 spawnWave(){
  this.phase='wave';this.wave++;this.message=`Onda ${this.wave} · elimine todos os inimigos`;
  const count=(5+this.wave*2)*Object.keys(this.players).length;
  for(let i=0;i<count;i++){const a=this.random()*Math.PI*2,r=11+this.random()*2;const brute=this.wave>=3&&i%5===0;this.units.push({id:this.id(),kind:brute?'brute':'goblin',team:2,x:Math.cos(a)*r,z:Math.sin(a)*r,hp:(70+this.wave*24)*(brute?2:1),maxHp:(70+this.wave*24)*(brute?2:1),damage:8+this.wave*2.5,armor:brute?3:0,range:1.4,speed:brute?2.3:2.9,interval:1.3,cd:this.random(),stun:0,alive:true});}
 }
 startDuel(){this.phase='duel';this.duels++;this.message='Duelo de treino · derrote o campeão da arena';const n=Object.keys(this.players).length;this.units.push({id:this.id(),kind:'champion',team:2,x:0,z:-8,hp:(850+this.wave*90)*n,maxHp:(850+this.wave*90)*n,damage:38+this.wave*3,armor:4,range:1.8,speed:3.4,interval:1,cd:0,stun:0,alive:true});}
 preparation(){this.phase='preparation';this.timer=25;this.message='Onda concluída · +300 ouro · prepare sua próxima combinação';for(const id of Object.keys(this.players)){const p=this.player(id);p.gold+=300;p.alive=true;p.hp=p.maxHp;p.mana=p.maxMana;p.x=-3+Object.keys(this.players).indexOf(id)*2;p.z=2;p.destination=null;p.order='auto';}this.units=this.units.filter(u=>u.hero);}
 tick(dt){
  this.time+=dt;this.effects=this.effects.filter(e=>this.time-e.time<(e.type==='blizzard'?4:.9));
  for(const e of this.effects.filter(e=>e.type==='blizzard'&&e.pulses>0&&this.time>=e.next)){e.next+=.75;e.pulses--;const owner=this.units.find(u=>u.id===e.owner);if(owner)for(const t of this.enemies({...e,team:owner.team},4))this.hit(t,38,owner,true);}
  if(!Object.keys(this.players).length)return;
  if(this.phase==='preparation'){this.timer-=dt;if(this.timer<=0){if((this.wave===5||this.wave===10)&&this.duels<this.wave/5)this.startDuel();else this.spawnWave();}}
  if(!['wave','duel','preparation'].includes(this.phase))return;
  for(const u of [...this.units]){
   if(!u.alive)continue;if(u.expires&&u.expires<this.time){u.alive=false;continue;}
   if(u.hero){u.mana=Math.min(u.maxMana,u.mana+dt*3);u.hp=Math.min(u.maxHp,u.hp+dt*1.2);for(const k of Object.keys(u.cooldowns))u.cooldowns[k]=Math.max(0,u.cooldowns[k]-dt);}
   u.cd=Math.max(0,u.cd-dt);u.stun=Math.max(0,u.stun-dt);if(u.stun>0||this.phase==='preparation')continue;
   let t=this.units.find(t=>t.id===u.target&&t.alive&&t.team!==u.team);if(!t)t=this.enemies(u,u.order==='hold'?u.range:Infinity)[0];
   let dest=u.order==='move'?u.destination:null;
   if(t&&u.order!=='move'){
    if(distance(u,t)<=u.range){if(u.cd<=0){let d=u.damage+((u.avatar||0)>this.time?20:0);if(u.skills?.includes('critical')&&this.random()<.2)d*=2;this.hit(t,d,u);this.fx(u.range>3?'arrow':'slash',u.x,u.z,{tx:t.x,tz:t.z});u.cd=u.interval/(u.skills?.includes('endurance')?1.2:1);}}
    else if(u.order!=='hold')dest=t;
   }
   if(dest){const d=distance(u,dest);if(d>.15){const step=Math.min(d,u.speed*dt);u.facing=Math.atan2(dest.x-u.x,dest.z-u.z);u.x+=Math.sin(u.facing)*step;u.z+=Math.cos(u.facing)*step;}else if(u.order==='move'){u.order='auto';u.destination=null;}}
  }
  // Gentle body blocking: movement and attack simulation remain independent of rendering.
  const live=this.units.filter(u=>u.alive);for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j],d=distance(a,b);if(d<.8&&d>.001){const push=(.8-d)*.35,dx=(a.x-b.x)/d,dz=(a.z-b.z)/d;a.x+=dx*push;a.z+=dz*push;b.x-=dx*push;b.z-=dz*push;}}
  for(const u of live){u.x=clamp(u.x,-14,14);u.z=clamp(u.z,-14,14);}
  if(['wave','duel'].includes(this.phase)){
   if(!this.units.some(u=>u.hero&&u.alive)){this.phase='defeat';this.message='A arena venceu desta vez. Experimente outra combinação.';}
   else if(!this.units.some(u=>u.team===2&&u.alive)){if(this.wave===10&&this.phase==='duel'){this.phase='victory';this.message='Sobrevivente! Você completou as dez ondas e os dois duelos.';}else this.preparation();}
  }
  this.units=this.units.filter(u=>u.hero||u.alive||this.time-(u.died||0)<1);
 }
 snapshot(){return {time:this.time,units:this.units,effects:this.effects,players:this.players,phase:this.phase,wave:this.wave,timer:this.timer,message:this.message};}
}
