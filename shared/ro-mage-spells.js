export const RO_MAGE_BOLTS=Object.freeze(['firebolt','coldbolt','mg_lightningbolt']);
export const RO_MAGE_VOXEL_SKILLS=Object.freeze([...RO_MAGE_BOLTS,'mg_napalmbeat','mg_soulstrike','mg_thunderstorm','mg_sight','wz_sightrasher']);
export const roMageBolt=key=>RO_MAGE_BOLTS.includes(key);
export const roMageVisual=event=>RO_MAGE_VOXEL_SKILLS.includes(event?.skillKey||event?.key);
export const roMageHitCount=(key,rank=1)=>key==='mg_soulstrike'?Math.ceil(Math.max(1,Math.min(10,rank))/2):roMageBolt(key)?Math.max(1,Math.min(10,rank)):1;
export const roMageTargetHeight=unit=>Math.min(3.5,Math.max(.65,(unit?.size||1)*1.05))+(unit?.flying?unit.altitude||1.5:0);
export const roHasSight=(unit,elapsed)=>!!unit?.roSkillBuffs?.some(b=>b.key==='mg_sight'&&b.until>elapsed);
export const roIsHidden=(unit,elapsed)=>!!(unit?.hidden||unit?.cloaked||unit?.roHiddenUntil>elapsed||unit?.roInvisibleUntil>elapsed)&&!(unit?.roRevealedUntil>elapsed);
export function roRevealNearby(game,unit){
 if(!roHasSight(unit,game.bonk.elapsed))return;for(const enemy of game.units||[])if(enemy.bonkEnemy&&enemy.alive&&Math.hypot(enemy.x-unit.x,enemy.z-unit.z)<=3)enemy.roRevealedUntil=game.bonk.elapsed+.35;
}
