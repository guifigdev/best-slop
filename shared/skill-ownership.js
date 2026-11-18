export function skillOwner(game,key,except=null){return game.heroes().find(h=>h.owner!==except&&h.skills.includes(key))||null;}
export const ownershipMethods={
 skillOwner(key,except=null){return skillOwner(this,key,except);},
 skillAvailable(u,key){return !this.skillOwner(key,u?.owner);},
 skillOwnership(){return Object.fromEntries(this.heroes().flatMap(h=>h.skills.map(key=>[key,{owner:h.owner,name:h.name}])));}
};
