// Call after the day/night pass has restored the frame's baseline lights.
export function applyClimateLighting({sun,skyLight,actorLighting},climate){
 if(!climate||climate.indoor)return;
 const factor=Number.isFinite(climate.sunlight)?Math.max(.16,Math.min(1,climate.sunlight)):1;
 sun.intensity*=factor;skyLight.intensity*=.82+.18*factor;
 if(actorLighting?.uniforms?.roSolarBounce)actorLighting.uniforms.roSolarBounce.value*=factor;
}
