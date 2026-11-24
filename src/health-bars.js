import {hoverRelation} from './hover-highlight.js';
export function healthBarPresentation(unit,owner,state,distance=34){
 const ratio=Math.max(0,Math.min(1,(unit?.hp||0)/Math.max(1,unit?.maxHp||1))),owned=unit?.owner===owner||unit?.id===state?.players?.[owner],ally=hoverRelation(unit,owner,state)==='ally';
 const color=unit?.pkColor||(owned?0x61f49b:ally?0x7abaff:0xff5b64);
 return{color,ratio,fillWidth:1.56*ratio,fillX:-(1-ratio)*.78,scale:Math.max(.9,Math.min(2.2,(Number.isFinite(distance)?distance:34)/34))*(owned?1.12:1)};
}
