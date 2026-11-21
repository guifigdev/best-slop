import {mvpWarning} from './ragnarok-expansion.js';

// Large attacks have visible gaps and at least two seconds of committed warning.
// Their geometry is shared by the warning art and authoritative damage test.
export const RO_MVP_PATTERN_BUDGET=Object.freeze({warnings:8,range:64,minWindup:2.1,maxDamageMultiplier:3.1});
export function roMvpPatterns(boss,player,index,time){
 const phase=Math.max(0,Math.floor(index)||0),kind=boss.ragnarokMvp,damage=boss.damage*2.6;
 const base={source:boss.id,mvp:kind,skill:'slam',element:boss.element||'physical',from:{x:boss.x,z:boss.z},targetPoint:{x:player.x,z:player.z},groundedOnly:false,damage,fireAt:time+2.4};
 const ring=(radius,inner,element)=>({...base,x:boss.x,z:boss.z,shape:'ring',radius,inner,element,skill:'slam'});
 const line=(x,z,dx,dz,width=3,length=60,element='physical',delay=0)=>({...base,x,z,dx,dz,width,length,shape:'line',radius:length/2,element,skill:'volley',fireAt:time+2.4+delay});
 if(kind==='ifrit')return phase%2===0?[{...ring(38,8,'fire'),name:'Erupção infernal',damage:boss.damage*3.1},...[-1,1].map(s=>line(boss.x+s*16,boss.z,0,1,4,64,'fire',.45))]:Array.from({length:5},(_,i)=>({...base,x:player.x+Math.sin(i*2.399)*i*3,z:player.z+Math.cos(i*2.399)*i*3,shape:'circle',radius:5,element:'fire',skill:'slam',name:'Chuva de meteoros',fireAt:time+2.1+i*.32}));
 if(kind==='hatii')return phase%2===0?[-2,-1,0,1,2].map(i=>line(boss.x+i*9,boss.z,0,1,3.2,64,'ice',Math.abs(i)*.12)):[ring(34,9,'ice')];
 if(kind==='valkyrierandgris')return phase%2===0?[line(boss.x,boss.z,1,0,4,64,'holy'),line(boss.x,boss.z,0,1,4,64,'holy'),{...ring(40,12,'holy'),fireAt:time+3.2}]:Array.from({length:4},(_,i)=>({...base,x:boss.x,z:boss.z,shape:'cone',radius:36,dx:Math.sin(i*Math.PI/2+phase*.3),dz:Math.cos(i*Math.PI/2+phase*.3),angle:Math.PI*.28,element:'holy',name:'Asas do julgamento',fireAt:time+2.7}));
 if(['tower_1272','osiris'].includes(kind))return Array.from({length:5},(_,i)=>({...base,x:player.x+Math.sin(i*2.399+phase)*i*3.2,z:player.z+Math.cos(i*2.399+phase)*i*3.2,shape:'circle',radius:4.8,element:'dark',skill:'slam',name:'Condenação',fireAt:time+2.2+i*.35}));
 if(['doppelganger','tower_1658'].includes(kind))return [-1,0,1].map(i=>line(player.x+i*10,player.z,Math.sin(phase*.7),Math.cos(phase*.7),3.8,60,'dark',Math.abs(i)*.2));
 if(kind==='phreeoni')return [{...ring(31,6,'earth'),groundedOnly:true,name:'Terremoto',fireAt:time+2.5}];
 if(kind==='eddga')return Array.from({length:3},(_,i)=>line(boss.x,boss.z+(-1+i)*12,1,0,4,54,'fire',i*.3));
 // Mistress, Moonlight Flower and Atroce retain their recognizable native shapes.
 const native=mvpWarning(boss,player,phase,time,damage);
 if(!native)return [];
 const shape={...base,...native,fireAt:time+2.3};
 if(shape.shape==='line'){shape.length=42;shape.width=4;}
 else if(shape.shape==='cone'){shape.radius=26;shape.angle=Math.min(shape.angle,Math.PI*.65);}
 else if(shape.shape==='ring'){shape.radius=28;shape.inner=8;}
 else shape.radius=8;
 return [shape];
}
