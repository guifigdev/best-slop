// Browser presentation/battle tuning requested after the native 1.02 audit.
// Raw map numbers remain available in wlSkillAt(...).native.
export const WARLOCK_POLISH=Object.freeze({
 arena:Object.freeze({radius:24,minRadius:9,mapRadius:32,roundDuration:120,shrinkDelay:20,shrinkRate:.13}),
 fireball:Object.freeze({radius:.64,range:17.1875,speed:14.75,blastRadius:1.75,splashMultiplier:.55}),
 meteor:Object.freeze({radius:4.4,range:17.2,warning:1,visualRadius:1.9,fallHeight:15,groundDuration:4,burnDuration:2,burnDps:3,burnInterval:.5}),
 gravity:Object.freeze({speed:6,duration:2.65,pullRadius:8,damageRadius:4.4,projectileRadius:10.3,bodyRadius:1.15}),
 link:Object.freeze({flightDuration:.95,radius:.625,pullMultiplier:1.08})
});
export function polishedWarlockSkill(skill){
 const nativeSkill={...skill};
 if(skill.family==='fireball')return{...nativeSkill,...WARLOCK_POLISH.fireball,browserPolish:true,description:'Bola de fogo maior: empurra o alvo atingido e explode, causando dano reduzido aos inimigos próximos.'};
 if(skill.family==='meteor')return{...nativeSkill,radius:WARLOCK_POLISH.meteor.radius,range:WARLOCK_POLISH.meteor.range,duration:WARLOCK_POLISH.meteor.warning,browserPolish:true,description:'Anuncia uma grande área e derruba um meteoro gigante. O impacto deixa fogo no chão por 4s; atravessar aplica queimadura por 2s.'};
 if(skill.family==='gravity')return{...nativeSkill,...WARLOCK_POLISH.gravity,radius:WARLOCK_POLISH.gravity.pullRadius,range:WARLOCK_POLISH.gravity.speed*WARLOCK_POLISH.gravity.duration,browserPolish:true,description:'Uma grande esfera gravitacional atrai inimigos e desvia projéteis. Seu núcleo causa dano periódico.'};
 if(skill.family==='link')return{...nativeSkill,radius:WARLOCK_POLISH.link.radius,flightDuration:WARLOCK_POLISH.link.flightDuration,range:skill.speed*WARLOCK_POLISH.link.flightDuration,browserPolish:true};
 return nativeSkill;
}
export function explodeWarlockFireball(game,projectile,source,primaryId,hurt){
 const radius=projectile.blastRadius||0;if(!(radius>0))return;
 for(const target of game.units.filter(u=>u.warlockCharacter&&!u.wlGhost&&u.alive&&u.id!==primaryId&&u.team!==projectile.team)){
  const dx=target.x-projectile.x,dz=target.z-projectile.z,d=Math.hypot(dx,dz);if(d>radius)continue;
  const falloff=1-.45*d/radius;hurt(game,source,target,projectile.damage*WARLOCK_POLISH.fireball.splashMultiplier*falloff,d?dx/d:projectile.dx,d?dz/d:projectile.dz,.5);
 }
 game.fx('warlockFireballImpact',projectile.x,projectile.z,{source:source.id,radius,duration:.6,warlock:true});
}
