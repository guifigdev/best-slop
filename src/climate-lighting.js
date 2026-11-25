// Call after the day/night pass has restored the frame's baseline lights.
export function applyClimateLighting({sun,skyLight,actorLighting},climate){
 if(!climate)return;if(climate.indoor){sun.intensity=0;skyLight.intensity=1.8;skyLight.color?.setHex(0xaab8cd);skyLight.groundColor?.setHex(0x827970);if(actorLighting?.uniforms){const u=actorLighting.uniforms;if(u.roEnvEnabled)u.roEnvEnabled.value=1;u.roSun?.value.setHex(0x000000);u.roSky?.value.setHex(0xaab8cd);u.roGround?.value.setHex(0x827970);if(u.roSolarBounce)u.roSolarBounce.value=0;u.roSolarTint?.value.setRGB(.92,.94,1);}return;}
 const factor=Number.isFinite(climate.sunlight)?Math.max(.16,Math.min(1,climate.sunlight)):1;
 sun.intensity*=factor;skyLight.intensity*=.82+.18*factor;
 if(actorLighting?.uniforms?.roSolarBounce){actorLighting.uniforms.roSolarBounce.value*=factor;actorLighting.uniforms.roSolarTint?.value.lerp({r:1,g:1,b:1},(1-factor)*.6);}
}
