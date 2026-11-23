// A small inner body circle, independent of decorative wings and weapons.
export const RO_CONTACT_INTERVAL=.75;
export function roEnemyTouchesHero(enemy,hero){
 if(!enemy?.alive||!hero?.alive||!enemy.bonkEnemy||!hero.bonkHero)return false;
 if((hero.bonkJumpHeight||0)>=1.05&&!enemy.flying)return false;
 const radius=Math.max(.28,Math.min(1.1,enemy.collisionRadius||.32))+Math.max(.25,Math.min(.5,hero.collisionRadius||.45));
 return Math.hypot(enemy.x-hero.x,enemy.z-hero.z)<=radius;
}
export function roRecordHitReaction(unit,source,time){
 const dx=unit.x-(source?.x??unit.x),dz=unit.z-(source?.z??unit.z),length=Math.hypot(dx,dz);
 unit.roHitReaction={at:time,dx:length>1e-6?dx/length:0,dz:length>1e-6?dz/length:0};
}
