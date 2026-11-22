export const RO_METEOR_TIMING=Object.freeze({fall:.9,classicInterval:.7});
export const isRoMeteorSkill=key=>['wz_meteor','ro_meteor','meteorstorm'].includes(key);

// Presentation only: every boulder stays inside the authoritative damage area.
// Hashing the shared event gives every client the same shower without RNG calls.
export function roMeteorStones(event){
 let seed=17;for(const c of String(event.showerId??event.id??event.source??0))seed=(seed*31+c.charCodeAt(0))>>>0;
 const radius=Math.max(1,Math.min(12,event.radius||4)),phase=seed*.013;
 return Array.from({length:3},(_,i)=>{const a=phase+i*Math.PI*2/3,r=radius*.62;return{x:event.x+Math.sin(a)*r,z:event.z+Math.cos(a)*r,size:Math.min(1.5,Math.max(.9,radius*.29))*(1-i*.09),height:22+i*3,driftX:3.5+Math.sin(a)*1.5,driftZ:-2+Math.cos(a),spin:phase+i*1.7};});
}
