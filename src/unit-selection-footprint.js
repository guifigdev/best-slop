import {unitFootprintRadius} from '../shared/unit-footprint.js';
// Physics defines the outer boundary. Actor roots already include model scale,
// so local rings divide it out once rather than multiplying size twice.
export function selectionFootprint(unit,mode,visualScale=1){
 const radius=unitFootprintRadius(unit,{mode}),scale=Number.isFinite(visualScale)&&visualScale>0?visualScale:1;
 return {radius,localRadius:radius/scale};
}
