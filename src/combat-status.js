export function combatStatuses(u,time){const statuses=[],burn=Math.max(u.dots?.burn?.until||0,u.dots?.lava?.until||0,u.solarUntil||0),frost=Math.max(u.frostUntil||0,u.dots?.frost?.until||0,u.abilitySlowUntil||0),poison=u.dots?.poison?.until||0;
 if(burn>time)statuses.push({key:'fire',label:'QUEIMANDO',until:burn});
 if(frost>time)statuses.push({key:'frost',label:'FROST · LENTO',until:frost});
 if(poison>time)statuses.push({key:'poison',label:'VENENO',until:poison});
 if((u.rageUntil||0)>time)statuses.push({key:'rage',label:'FÚRIA',until:u.rageUntil});
 if((u.violentForce?.until||0)>time)statuses.push({key:'violentforce',label:'FORÇA VIOLENTA',until:u.violentForce.until});
 if(u.stun>0)statuses.push({key:'stun',label:'ATORDOADO',until:time+u.stun});
 if((u.shieldUntil||0)>time&&u.shield>0)statuses.push({key:'shield',label:'ESCUDO '+Math.ceil(u.shield),until:u.shieldUntil});
 if((u.itemReflectUntil||0)>time)statuses.push({key:'reflect',label:'REFLEXÃO',until:u.itemReflectUntil});
 return statuses;
}

// Hue targets are blended into the existing vertex-colored animal at 20% by
// the view. Positive effects never participate in the category count.
const NEGATIVE_HUES=Object.freeze({fire:0xff6738,frost:0x67c5ff,poison:0x80c943,stun:0xffd34d});
export function negativeTint(unit,time){
 const negatives=combatStatuses(unit||{},time).filter(status=>Object.hasOwn(NEGATIVE_HUES,status.key));
 return negatives.length===1?{key:negatives[0].key,color:NEGATIVE_HUES[negatives[0].key]}:null;
}
