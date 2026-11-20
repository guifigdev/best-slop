// Deterministic input policy for balance review. It uses public Game commands,
// the real six starting attribute points, actual Q casts and 350ms reactions.
// Executed by: node --test tests/dungeon-balance.test.js
import {Game} from '../shared/simulation.js';
import {skillAt,HEROES} from '../shared/catalog.js';
import {insideBossPattern} from '../shared/boss-patterns.js';
import {unitSolidBlocked,unitSegmentClear} from '../shared/unit-collision.js';

export function runDungeonOpening({kind='knight',party=1,seed=51,allocation='balanced',react=true,maxTime=100}={}){
 const g=new Game(seed,{mode:'dungeon',dungeonPartySize:party});for(let i=0;i<party;i++)g.addPlayer('p'+i,i?['mage','ranger','turtle'][i-1]:kind);
 const budgets=[];for(const h of g.heroes()){
  const starting=h.attributePoints,attack=HEROES[h.hero].attackType==='magic'?'int':h.range>3?'dex':'str';
  if(allocation==='balanced')for(let i=0;i<2;i++)g.command(h.owner,{type:'attribute',attribute:attack});
  if(allocation!=='none'){while(g.command(h.owner,{type:'attribute',attribute:'vit'}));while(g.command(h.owner,{type:'attribute',attribute:'agi'}));}
  budgets.push({starting,spent:starting-h.attributePoints});g.command(h.owner,{type:'dgReady'});
 }
 const p=g.player('p0'),room=g.dungeon.map.rooms[1];Object.assign(p,{x:room.x,z:room.z});g.activateDungeonRoom(1,p);const reacted=new Set(),until=new Map();let dodges=0,casts=0,pickups=0,maxAlive=0;
 for(let step=0;step<maxTime/.05;step++){
  for(const h of g.heroes().filter(h=>h.alive)){
   const foes=g.units.filter(u=>u.alive&&u.dungeonEnemy&&u.dungeonRoom===1).sort((a,b)=>Math.hypot(a.x-h.x,a.z-h.z)-Math.hypot(b.x-h.x,b.z-h.z)),enemy=foes[0];
   while(h.skillPoints>0&&g.command(h.owner,{type:'buy',skill:h.skills[0]}));
   const skill=skillAt(h.skills[0],h.skillLevels[h.skills[0]]||1),reach=skill?.target==='self'?skill.radius||3:12;
   if(enemy&&skill?.kind==='active'&&Math.hypot(enemy.x-h.x,enemy.z-h.z)<=reach&&!h.cooldowns[h.skills[0]]&&g.command(h.owner,{type:'cast',slot:0,target:enemy.id,x:enemy.x,z:enemy.z}))casts++;
   const danger=react&&g.dungeon.telegraphs.find(w=>insideBossPattern(h,w)&&g.time-w.start>=.35&&!reacted.has(h.id+':'+w.id));
   if(danger){reacted.add(h.id+':'+danger.id);let safe=null;for(const radius of [2.2,3.8,5.5,7]){for(let j=0;j<16;j++){const a=j*Math.PI/8,q={x:h.x+Math.sin(a)*radius,z:h.z+Math.cos(a)*radius};if(Math.abs(q.x-room.x)>room.w/2-2||Math.abs(q.z-room.z)>room.d/2-2||unitSolidBlocked(g,h,q)||!unitSegmentClear(g,h,h,q)||g.dungeon.telegraphs.some(w=>insideBossPattern(q,w)))continue;safe=q;break;}if(safe)break;}if(safe){g.command(h.owner,{type:'move',...safe});until.set(h.id,danger.fireAt+.05);dodges++;}}
   else if(g.time>(until.get(h.id)||0)&&enemy&&(h.order==='move'||!g.units.some(u=>u.alive&&u.id===h.target)))g.command(h.owner,{type:'attack',target:enemy.id});
   for(const item of g.dungeon.objects.filter(o=>!o.used&&['equipment','fragment'].includes(o.type)&&Math.hypot(o.x-h.x,o.z-h.z)<2.3))if(g.command(h.owner,{type:'dgPickup',object:item.id})&&item.used)pickups++;
  }
  g.tick(.05);maxAlive=Math.max(maxAlive,g.units.filter(u=>u.alive&&u.dungeonEnemy&&u.dungeonRoom===1&&!u.dungeonExtra).length);
  if(g.dungeon.rooms[1].status==='cleared'||!g.heroes().some(h=>h.alive))break;
 }
 return{g,time:g.time,cleared:g.dungeon.rooms[1].status==='cleared',survivors:g.heroes().filter(h=>h.alive).length,dodges,casts,pickups,maxAlive,budgets};
}
