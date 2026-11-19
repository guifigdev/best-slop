export function combatEffectPriority(event,ownerId){
 const base=event.type==='bossDanger'?100:event.type==='bossImpact'?95:event.critical||event.type==='critical'?85:event.type==='miss'?75:['heal','lifesteal','fountainHeal','levelup','hurricane','violentforce'].includes(event.type)?45:['shield','blink','castleWork'].includes(event.type)?30:10;
 return base+(event.source===ownerId||event.target===ownerId?35:0);
}
export function effectToEvict(entries,incoming,ownerId){
 let victim=null,lowest=Infinity;
 for(const [id,entry]of entries){const score=combatEffectPriority(entry.e,ownerId);if(score<lowest){lowest=score;victim=id;}}
 return combatEffectPriority(incoming,ownerId)>=lowest?victim:null;
}
