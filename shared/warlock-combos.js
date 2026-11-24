import {warlockWallContact} from './warlock-elements.js';
export const WARLOCK_COMBOS=Object.freeze({fireDamage:1.2,fireSize:1.3,iceWidth:2.1,iceDuration:5,freezeExposure:1.5,freezeDuration:1.5});
// Server-only interactions. Each wall is crossed once per projectile; the fire
// damage/size bonus is applied once even if several owned walls renew its range.
export function warlockProjectileCombo(game,p,from,dt){
 const walls=(game.warlock.fields||[]).filter(f=>f.until>game.time&&((p.family==='fireball'&&f.family==='fireWall'&&f.owner===p.owner)||f.family==='iceWall')).map(f=>({f,contact:warlockWallContact(f,from,p,p.radius||0)})).filter(v=>v.contact).sort((a,b)=>a.contact.fraction-b.contact.fraction);
 for(const {f,contact}of walls){
  if(p.life<0&&contact.fraction>1+p.life/Math.max(.00001,dt))continue;
  if(f.family==='fireWall'){
   p.wlCrossedFireWalls??=[];if(p.wlCrossedFireWalls.includes(f.id))continue;p.wlCrossedFireWalls.push(f.id);
   if(!p.wlWallBoosted){p.damage*=WARLOCK_COMBOS.fireDamage;p.radius*=WARLOCK_COMBOS.fireSize;p.wlWallBoosted=true;}
   const normalRange=p.range||17.1875;p.life=Math.max(.01,normalRange/Math.max(.01,p.speed)-dt*(1-contact.fraction));
   game.fx('warlockFireWallBoost',from.x+(p.x-from.x)*contact.fraction,from.z+(p.z-from.z)*contact.fraction,{source:p.source,element:'fire',duration:.25});
  }else if(p.family!=='frostBolt'){
   p.x=from.x+(p.x-from.x)*contact.fraction;p.z=from.z+(p.z-from.z)*contact.fraction;
   game.fx('warlockIceWallBlock',p.x,p.z,{source:p.source,wall:f.id,element:'ice',radius:.45,duration:.35});return true;
  }else{
   f.until=game.time;f.shattered=true;game.warlock.fields.push({id:game.id(),key:p.key,skill:p.skill,family:'frostField',source:p.source,owner:p.owner,team:p.team,x:f.x,z:f.z,angle:f.angle,length:f.length,thickness:WARLOCK_COMBOS.iceWidth,started:game.time,until:game.time+WARLOCK_COMBOS.iceDuration,exposure:{},frozenIds:[]});
   game.fx('warlockIceWallShatter',f.x,f.z,{source:p.source,element:'ice',angle:f.angle,length:f.length,thickness:WARLOCK_COMBOS.iceWidth,radius:f.length/2,duration:.8});return true;
  }
 }
 return false;
}
