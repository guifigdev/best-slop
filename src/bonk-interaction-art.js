import {bonkGateFrame} from './bonk-gates.js';
export const BONK_INTERACTION_ART_BUDGET=Object.freeze({objects:8,distance:20,gateDistance:26,parts:320});
const hash=value=>{let n=0;for(const c of String(value))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;};

// A nearby treasure reads as a treasure without flooding the whole map in icons.
// All output goes into the existing rune/glint batch, with no per-object meshes.
export function bonkInteractionParts(data,hero,time,gates=[]){
 const B=BONK_INTERACTION_ART_BUDGET,parts=[],objectIds=[],gateIds=[],put=(x,y,z,w,h,d,c,a=0)=>{if(parts.length<B.parts)parts.push([x,y,z,w,h,d,c,a]);},objects=(data?.objects||[]).filter(o=>!o.used&&['chest','shrine','pot','campfire'].includes(o.type)&&Number.isFinite(o.x)&&Number.isFinite(o.z)&&(o.type!=='campfire'||(o.fuel??1)>0)&&Math.hypot(o.x-hero.x,o.z-hero.z)<=B.distance).sort((a,b)=>Number(b.id===data.nearestObject)-Number(a.id===data.nearestObject)||Math.hypot(a.x-hero.x,a.z-hero.z)-Math.hypot(b.x-hero.x,b.z-hero.z)).slice(0,B.objects);
 for(const o of objects){objectIds.push(o.id);const c=o.type==='chest'?0xf5d18b:o.type==='shrine'?0xace0dc:o.type==='pot'?0xc6b589:0xb6da96,phase=(time*.4+(hash(o.id)%101)*.013)%1,ring=o.type==='campfire'?28:o.type==='shrine'?10:o.type==='chest'?8:6,r=o.type==='campfire'?o.radius||3.5:o.type==='shrine'?1.1:o.type==='chest'?.85:.52;
  for(let j=0;j<ring;j++){const a=j*Math.PI*2/ring;put(o.x+Math.sin(a)*r,.055,o.z+Math.cos(a)*r,o.type==='campfire'?.045:.075,.028,o.type==='campfire'?.26:.18,c,-a);}
  if(o.type!=='campfire'&&phase<.48){const count=o.type==='shrine'?3:o.type==='chest'?2:1;for(let j=0;j<count;j++){const a=time*.7+j*Math.PI*2/count,up=(phase/.48+j*.31)%1,x=o.x+Math.sin(a)*r*.7,z=o.z+Math.cos(a)*r*.6,y=(o.type==='shrine'?1.35:.7)+up*.6,size=.045+Math.sin(up*Math.PI)*.035;put(x,y,z,size*3,size,.045,c,a);put(x,y,z,size,size*3,.045,c,a);}}
 }
 for(const gate of gates){if(Math.hypot(gate.x-hero.x,gate.z-hero.z)>B.gateDistance)continue;gateIds.push(gate.id);const frame=bonkGateFrame(gate),c=gate.open?0x84dcca:gate.lockedBy==='final'?0xb1a1d6:0xe2be7c,r=(gate.width||18)*.42;for(let j=0;j<18;j++){const a=j*Math.PI/9,q=frame.point(Math.cos(a)*r,.45);put(q.x,3.5+Math.sin(a)*3.25,q.z,.13,.2,.13,c,frame.angle+a);}for(let j=0;j<4;j++){const a=time*.65+j*Math.PI/2,q=frame.point(Math.cos(a)*r*.85,.48);put(q.x,3.5+Math.sin(a)*2.8,q.z,.06,.1,.06,c,a);}}
 return{parts,objectIds,gateIds};
}
