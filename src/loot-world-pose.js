// Shared with Custom Hero world loot: the same scale, bob and stepped rotation.
export function lootWorldPose(drop,time,index=0,ground=0){return {x:drop.x,y:ground+.47+Math.sin(Math.floor(time*8)*.5+index)*.12,z:drop.z,w:.48,h:.15,d:.6,yaw:Math.floor(time*8)*.12};}
