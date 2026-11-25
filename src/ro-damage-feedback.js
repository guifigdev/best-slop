export function roDamageFeedback(event,incoming=false){
 if(!event.bonk||event.type!=='damage'||event.miss||incoming)return null;
 const multi=event.hits>1;
 return {className:event.critical?'critical':multi?'ro-multihit':'physical',text:String(Math.max(0,event.amount)),group:multi&&event.hitGroup!=null?[event.source,event.target,event.hitGroup].join(':'):null};
}
