import {bonkSceneryParts} from './bonk-prop-art.js';

// A compact Prontera-inspired service square; only designated trade hubs
// receive it. Villagers and shop interaction points remain authoritative.
export function roTownVillageParts(map,p){
 if(!map?.town)return[];const parts=[],b=(x,y,z,w,h,d,c,a=0)=>parts.push([x,y,z,w,h,d,c,a]);
 for(let z=-11;z<=11;z++)for(let x=-12;x<=12;x++){if(x*x/150+z*z/125>1)continue;b(x,.05,z,.94,.14,.94,(x+z)%3?p.stone:0xb6a98b);}
 const place=(model,x,z,scale=1)=>{for(const [dx,y,dz,w,h,d,c,a=0]of bonkSceneryParts(model,p,0)||[])b(x+dx*scale,y*scale,z+dz*scale,w*scale,h*scale,d*scale,c,a);};
 place('prontera-fountain',0,0,.7);
 place('prontera-house',-10,-8,.85);place('prontera-house',10,-10,.85);place('prontera-house',-12,9,.75);
 for(const [x,z]of [[-4,5],[4,5],[-4,-5],[4,-5]]){b(x,.5,z,2.3,.15,.65,p.wood);for(const side of [-1,1])b(x+side*.8,.25,z,.14,.5,.48,p.dark);b(x,.9,z-.28,2.3,.6,.12,p.wood);}
 for(const side of [-1,1])for(const z of [-3,3]){b(side*11,.25,z,1.5,.5,1.4,0x7b755f);for(let i=0;i<5;i++)b(side*11+(i%3-1)*.4,.7+(i%2)*.1,z+(i%2-.5)*.6,.35,.6,.35,i%2?0xc887aa:0x95ab67);}
 return parts;
}
