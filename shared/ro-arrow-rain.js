export const RO_ARROW_RAIN_TIMING=Object.freeze({fall:.55,impact:.5});
export const isRoArrowRainSkill=key=>['arrowstorm','ra_arrowstorm','ac_shower','severerainstorm','wm_severe_rainstorm'].includes(key);
// Shared deterministic area sampling; clients do not consume gameplay RNG.
export function roArrowRainArrows(event){
 let seed=29;for(const c of String(event.showerId??event.id??event.source??0))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const radius=Math.max(1,Math.min(12,Number.isFinite(event.radius)?event.radius:4)),count=event.skillKey==='ac_shower'?9:['severerainstorm','wm_severe_rainstorm'].includes(event.skillKey)?15:21;
 return Array.from({length:count},(_,i)=>{const angle=seed*.001+i*2.399963,spread=radius*Math.sqrt((i+.5)/count)*.91;return{x:event.x+Math.sin(angle)*spread,z:event.z+Math.cos(angle)*spread,height:22+(i%3)*2,offset:(i%3)*.035,angle:angle*.05};});
}
