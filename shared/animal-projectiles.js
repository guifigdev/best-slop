// Cosmetic only: an animal's thrown object never changes attack range, damage
// category, collision or cooldown. Explicit weapons (e.g. Sniper rifle) win.
const objects=Object.freeze({
 goblin:'egg',duck:'egg',chicken:'egg',raccoon:'scrap',
 mage:'carrot',hare:'carrot',owl:'feather',raven:'feather',harpy:'feather',
 turtle:'shell',tortoise:'shell',frog:'droplet',hedgehog:'thorn',bat:'sonic'
});
export function animalBasicProjectile(unit){
 if(unit?.projectileKind)return unit.projectileKind;
 if(unit?.attackType==='siege')return 'siege';
 return objects[unit?.hero||unit?.kind]||null;
}
