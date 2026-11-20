import {PHASE_KILLER_MAP as MAP} from './phase-killer-catalog.js';
export const PHASE_LEVEL_REVISION=4;
export const PHASE_TOWN=Object.freeze({plaza:{x:82,z:-19,radius:8.5},fountain:{id:'town-plaza-fountain',x:82,z:-19,w:3.2,d:3.2},church:{id:'town-corner-church',x:128,z:8,w:12,d:8}});
export const PHASE_CEMETERY=Object.freeze({id:'southern-churchyard',x:103,z:7,w:16,d:8,gate:{x:111,z:7},cross:{id:'church-front-cross',x:118.4,z:5.2,w:.65,d:.65}});
export const PHASE_CAMPFIRES=Object.freeze([{id:'camp-foothill',x:8,z:-44,dimension:'normal',radius:3},{id:'camp-woodland',x:-15,z:-5,dimension:'normal',radius:3},{id:'camp-highland',x:-49,z:-45,dimension:'normal',radius:3}].map(Object.freeze));
export function phaseKillerLocalZ(z){const layer=Math.max(0,Math.min(2,Math.round((z+31)/MAP.layerOffset)));return z-layer*MAP.layerOffset;}
export function phaseKillerHeightAt(x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
 if(x>=24)return 0;
 const localZ=phaseKillerLocalZ(z),t=Math.max(0,Math.min(1,(10-x)/82)),rise=t*t*(3-2*t);
 return 10*rise+3.2*Math.exp(-((x+55)**2+(localZ+36)**2)/500)+1.8*Math.exp(-((x+28)**2+(localZ+65)**2)/320);
}
// Same analytic surface for ground light pools; CPU terrain/actors/picking use
// phaseKillerHeightAt. No per-frame mesh allocation or moving trunk colliders.
export const PHASE_HEIGHT_GLSL=`float phaseHeight(vec2 p){if(p.x>=24.0)return 0.0;float localZ=p.y-clamp(floor((p.y+31.0)/128.0+0.5),0.0,2.0)*128.0;float t=clamp((10.0-p.x)/82.0,0.0,1.0);return 10.0*t*t*(3.0-2.0*t)+3.2*exp(-(pow(p.x+55.0,2.0)+pow(localZ+36.0,2.0))/500.0)+1.8*exp(-(pow(p.x+28.0,2.0)+pow(localZ+65.0,2.0))/320.0);}`;
