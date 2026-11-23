// Visual recoil only: never displaces the collision body or cancels commands.
export function roHitReactionPose(unit,time){
 const hit=unit?.roHitReaction,age=time-(hit?.at??-100);
 if(!unit?.alive||!hit||age<0||age>=.32)return null;
 const strength=Math.sin(Math.PI*Math.min(1,age/.065)/2)*Math.pow(1-age/.32,2),facing=unit.facing||0,c=Math.cos(facing),s=Math.sin(facing);
 return {x:(c*hit.dx-s*hit.dz)*.34*strength,z:(s*hit.dx+c*hit.dz)*.34*strength,y:-.12*strength,tiltX:(s*hit.dx+c*hit.dz)*.22*strength,tiltZ:-(c*hit.dx-s*hit.dz)*.22*strength,flash:age<.16?Math.sin(Math.PI*age/.16):0,scaleY:1-.1*strength};
}
