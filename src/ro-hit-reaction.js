// Visual recoil only: never displaces the collision body or cancels commands.
export function roHitReactionPose(unit,time){
 const hit=unit?.roHitReaction,age=time-(hit?.at??-100);
 if(!unit?.alive||!hit||age<0||age>=.42)return null;
 const strength=Math.sin(Math.PI*Math.min(1,age/.065)/2)*Math.pow(1-age/.42,2),amplitude=unit.bonkEnemy?.075/Math.max(.1,unit.size||1):.34,facing=unit.facing||0,c=Math.cos(facing),s=Math.sin(facing);
 return {x:(c*hit.dx-s*hit.dz)*amplitude*strength,z:(s*hit.dx+c*hit.dz)*amplitude*strength,y:-.12*strength,tiltX:(s*hit.dx+c*hit.dz)*.22*strength,tiltZ:-(c*hit.dx-s*hit.dz)*.22*strength,flash:age<.32?Math.max(.2,1-age/.32):0,scaleY:1-.1*strength};
}

// A short flash on the mesh, never a ground decal. Misses/zero damage never
// set hitAt in the authoritative simulation. Fade fully before the next hit.
export function roMonsterHitFlash(unit,time){
 const age=time-(unit?.hitAt??-100);if(!unit?.bonkEnemy||!unit.alive||age<0||age>=.18)return null;
 return{strength:age<.035?1:Math.pow(1-(age-.035)/.145,2),color:age<.06?0xffffff:0xffb7ae};
}
