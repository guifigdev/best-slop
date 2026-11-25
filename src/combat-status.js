export function combatStatuses(u,time){const statuses=[];if(u.roNativeAgilityVisualUntil>time)statuses.push({key:'haste',label:'AGI ↑',until:u.roNativeAgilityVisualUntil});if(u.roAgilityDownVisualUntil>time)statuses.push({key:'agidown',label:'AGI ↓',until:u.roAgilityDownVisualUntil});if(u.roNativeCast?.visualUntil>time)statuses.push({key:'cast',label:u.roNativeCast.name,until:u.roNativeCast.visualUntil});const burn=Math.max(u.dots?.burn?.until||0,u.dots?.lava?.until||0,u.solarUntil||0,u.wlLavaContactUntil||0,u.wlMeteorBurnUntil||0),frost=Math.max(u.wlFrostUntil||0,u.frostUntil||0,u.dots?.frost?.until||0,(u.webbedUntil||0)>time?0:u.abilitySlowUntil||0),poison=u.dots?.poison?.until||0;
 if(burn>time)statuses.push({key:'fire',label:'QUEIMANDO',until:burn});
 if(Math.max(u.wlFrozenUntil||0,u.roFrozenVisualUntil||0)>time)statuses.push({key:'freeze',label:'CONGELADO',until:Math.max(u.wlFrozenUntil||0,u.roFrozenVisualUntil||0)});
 if(frost>time&&Math.max(u.wlFrozenUntil||0,u.roFrozenVisualUntil||0)<=time)statuses.push({key:'frost',label:'FROST · LENTO',until:frost});
 if((u.webbedUntil||0)>time)statuses.push({key:'web',label:'TEIA · LENTO',until:u.webbedUntil});
 if(poison>time)statuses.push({key:'poison',label:'VENENO',until:poison});
 if((u.rageUntil||0)>time||u.bonkEnraged)statuses.push({key:'rage',label:'FÚRIA',until:u.rageUntil});
 if((u.violentForce?.until||0)>time)statuses.push({key:'violentforce',label:'FORÇA VIOLENTA',until:u.violentForce.until});
 if(u.stun>0)statuses.push({key:'stun',label:'ATORDOADO',until:time+u.stun});
 if((u.magicWardUntil||0)>time)statuses.push({key:'ward',label:'PROTEÇÃO MÁGICA',until:u.magicWardUntil});
 if((u.weakenedUntil||0)>time)statuses.push({key:'weaken',label:'ENFRAQUECIDO',until:u.weakenedUntil});
 if((u.shieldUntil||0)>time&&u.shield>0)statuses.push({key:'shield',label:'ESCUDO '+Math.ceil(u.shield)+(u.shieldPhysicalOnly?' · '+u.shieldHits+' golpes':''),until:u.shieldUntil});
 if((u.itemReflectUntil||0)>time)statuses.push({key:'reflect',label:'REFLEXÃO',until:u.itemReflectUntil});
 return statuses;
}

// Hue targets are blended into the existing vertex-colored animal at 20% by
// the view. Positive effects never participate in the category count.
const NEGATIVE_HUES=Object.freeze({fire:0xff6738,freeze:0x8adcfb,frost:0x67c5ff,poison:0x80c943,web:0xd8e3ca,stun:0xffd34d,weaken:0xb386c9});
export function negativeTint(unit,time){
 const negatives=combatStatuses(unit||{},time).filter(status=>Object.hasOwn(NEGATIVE_HUES,status.key));
 return negatives.length===1?{key:negatives[0].key,color:NEGATIVE_HUES[negatives[0].key]}:null;
}
