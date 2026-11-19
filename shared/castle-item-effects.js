import {CASTLE_ITEMS,CASTLE_LAYOUT,castleDamageMultiplier} from './castle-catalog.js';

// A02D (Blast Staff), war3map.w3a: amsp=1000 Warcraft units/s.
// The shared castle catalog converts horizontal distances at 1/256.
export const CASTLE_BLAST_PROJECTILE_SPEED=1000*CASTLE_LAYOUT.scale;
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const active=game=>game?.castleFight&&game.phase==='wave'&&!game.castleFight.finished;
const isBlast=p=>p?.kind==='blast_staff'&&p.castleItemProjectile===true;
const targetHeight=target=>.75+(target.flying?Math.max(0,Number(target.altitude)||0):0);

// Spell-type item damage uses the source map's Spells row, not the Magic
// weapon row and not physical armor. Attack damage auras/critical never apply.
export function castleBlastDamage(projectile,target){
 if(!Number.isFinite(projectile?.damage)||projectile.damage<=0||!target?.alive||target.magicImmune)return 0;
 const resistance=Number.isFinite(target.spellResistance)?Math.max(0,Math.min(1,target.spellResistance)):0;
 return projectile.damage*castleDamageMultiplier('spells',target.armorType)*(1-resistance);
}

export function launchCastleBlast(game,holder,target,item,key='blast_staff'){
 if(!active(game)||!holder?.alive||!finitePoint(holder)||typeof key!=='string'||!Object.hasOwn(CASTLE_ITEMS,key))return false;
 const definition=CASTLE_ITEMS[key],cf=game.castleFight,player=cf.players?.[holder.owner],owned=player?.items?.[key];
 // The catalog is authoritative even if a caller supplies a modified item.
 if(definition.effect!=='passive_blast'||!definition.playable||!owned||cf.elapsed<(Number(owned.nextAt)||0)||!target?.alive||!cf.units.includes(target)||target.castleStructure||target.team===player.team||!finitePoint(target)||distance(holder,target)>definition.radius)return false;
 const id=game.id(),height=.85,speed=CASTLE_BLAST_PROJECTILE_SPEED,diagonal=Math.hypot((cf.map?.maxX??24)-(cf.map?.minX??-24),(cf.map?.maxZ??16)-(cf.map?.minZ??-16));
 const projectile={id,castleItemProjectile:true,kind:'blast_staff',itemKey:key,owner:holder.owner,team:player.team,source:holder.id,target:target.id,x:holder.x,z:holder.z,height,tx:target.x,tz:target.z,targetHeight:targetHeight(target),speed,damage:definition.damage,attackType:'spells',age:0,travelled:0,maxAge:diagonal/speed+definition.interval};
 cf.projectiles||=[];cf.projectiles.push(projectile);
 // No target means no launch and no cooldown consumption. This assignment
 // belongs here rather than at the start of a passive polling cycle.
 owned.nextAt=cf.elapsed+definition.interval;
 game.fx?.('castleBlastLaunch',holder.x,holder.z,{source:holder.id,target:target.id,projectile:id,item:key,castle:true});return true;
}

function defaultDamage(game,target,amount,projectile){
 if(!target.alive||amount<=0)return 0;const actual=Math.min(target.hp,amount);target.hp=Math.max(0,target.hp-amount);target.hitAt=game.time;
 game.fx?.('damage',target.x,target.z,{source:projectile.source,target:target.id,amount:Math.round(actual),magic:true,element:'arcane',castle:true,item:projectile.itemKey});
 if(target.hp<=0){target.alive=false;target.died=game.time;game.fx?.('castleDeath',target.x,target.z,{source:projectile.source,target:target.id,structure:!!target.castleStructure});const owner=typeof game.player==='function'?game.player(projectile.owner):null;if(owner&&target.castleUnit)owner.gold+=target.bounty??4;}
 return actual;
}

// Optional damage callback allows the Castle Fight engine to reuse its death,
// bounty and damage feedback path: (target,finalDamage,projectile) => actual.
export function tickCastleItemProjectiles(game,dt,dealDamage=null){
 const cf=game?.castleFight;if(!cf||!Number.isFinite(dt)||dt<=0)return 0;
 if(!active(game)){cf.projectiles=(cf.projectiles||[]).filter(p=>!isBlast(p));return 0;}
 let impacts=0;const keep=[];
 for(const projectile of cf.projectiles||[]){
  if(!isBlast(projectile)){keep.push(projectile);continue;}
  const target=cf.units.find(unit=>unit.id===projectile.target&&unit.alive&&unit.team!==projectile.team&&!unit.castleStructure);
  if(!target||!finitePoint(target)||!finitePoint(projectile)||!Number.isFinite(projectile.speed)||projectile.speed<=0)continue;
  projectile.age+=dt;if(projectile.age>projectile.maxAge)continue;
  projectile.tx=target.x;projectile.tz=target.z;projectile.targetHeight=targetHeight(target);
  const d=distance(projectile,target),step=projectile.speed*dt;
  if(d<=step){
   const damage=castleBlastDamage(projectile,target),actual=dealDamage?dealDamage(target,damage,projectile):defaultDamage(game,target,damage,projectile);
   game.fx?.('castleBlastImpact',target.x,target.z,{source:projectile.source,target:target.id,projectile:projectile.id,item:projectile.itemKey,amount:Number(actual)||0,magic:true,element:'arcane',castle:true});impacts++;continue;
  }
  const fraction=step/d;projectile.x+=(target.x-projectile.x)*fraction;projectile.z+=(target.z-projectile.z)*fraction;projectile.height+=(projectile.targetHeight-projectile.height)*fraction;projectile.travelled+=step;keep.push(projectile);
 }
 cf.projectiles=keep;return impacts;
}
