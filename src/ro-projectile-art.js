// Small voxel silhouettes shared by every active projectile in one GPU batch.
// Tuples: x, height above local ground, z, width, height, depth, color, yaw.
export const RO_PROJECTILE_ART_BUDGET=Object.freeze({partsPerShot:8,shots:220,instances:1760,drawCalls:1});
const palettes=Object.freeze({fire:[0xffedb0,0xffba55,0xe7662d],ice:[0xe6ffff,0xa2e4ee,0x4c9eb9],water:[0xd7faff,0x8dd4e9,0x488da6],poison:[0xe0f8ac,0xa5cf6d,0x5c8745],holy:[0xffffe2,0xedd497,0xbaa05e],lightning:[0xffffdc,0xe9d16c,0x9b86d5],dark:[0xf0d7ff,0xb79bd9,0x65537c],earth:[0xd7c39b,0xac8c62,0x6d5c43],wind:[0xe4ffe8,0xaccfbc,0x6a9c9a],arcane:[0xf0dfff,0xc9a7e7,0x80649d],physical:[0xf0e8cf,0xc7b895,0x8b7051]});
export function roProjectileParts(shot,time=0){
 const length=Math.hypot(shot.dx||0,shot.dz||0)||1,dx=(shot.dx||0)/length,dz=(shot.dz||0)/length,yaw=Math.atan2(dx,dz),element=shot.element||'physical',palette=palettes[element]||palettes.physical,parts=[],seed=Number(shot.id)||0,frame=Math.floor(time*10),phase=frame*.31+seed*.7;
 const put=(along,side,height,w,h,d,color,angle=yaw)=>parts.push([shot.x+dx*along+dz*side,height,shot.z+dz*along-dx*side,w,h,d,color,angle]);
 if(element==='fire'){
  // A round, layered fireball with three animated tongues, not an ice needle.
  put(0,0,1.25,.54,.48,.54,palette[1]);put(.06,-.03,1.29,.34,.34,.43,palette[0]);put(-.12,.12,1.20,.31,.27,.35,palette[2]);
  for(let i=0;i<3;i++){const life=(frame*.071+i/3+(seed%7)*.03)%1,taper=1-life;put(-.23-i*.20,Math.sin(phase+i*2.1)*.10,1.18+life*.32,.12+taper*.18,.17+taper*.22,.22+taper*.16,i===0?palette[0]:life>.6?palette[2]:palette[1],yaw+i*.6);}
  put(-.72,Math.sin(phase)*.13,1.43,.065,.09,.11,palette[0]);put(-.92,Math.cos(phase)*.12,1.12,.045,.065,.09,palette[1]);
 }else if(element==='ice'||element==='water'){
  put(0,0,1.25,.22,.25,.68,palette[0]);put(.39,0,1.25,.10,.11,.19,palette[0]);put(-.11,0,1.25,.48,.09,.26,palette[1]);put(-.11,0,1.25,.10,.43,.26,palette[1]);put(-.44,0,1.25,.14,.14,.24,palette[2]);
  for(let i=0;i<3;i++)put(-.65-i*.20,Math.sin(phase+i)*.07,1.23+(i%2)*.05,.065-i*.012,.065-i*.012,.12,palette[i%2]);
 }else if(element==='holy'){
  put(0,0,1.25,.20,.48,.20,palette[0]);put(0,0,1.32,.48,.13,.20,palette[0]);put(-.07,0,1.25,.26,.55,.08,palette[1]);put(-.07,0,1.32,.55,.19,.08,palette[1]);
  for(let i=0;i<4;i++)put(-.3-i*.18,(i%2-.5)*.15,1.22+(i%3)*.06,.07,.07,.12,palette[i%2]);
 }else if(element==='lightning'){
  for(let i=0;i<4;i++)put(.24-i*.23,(i%2-.5)*.16,1.25,.10,.13,.31,i%2?palette[0]:palette[1],yaw+(i%2?.36:-.36));
  for(let i=0;i<4;i++)put(-.66-i*.16,(i%2-.5)*.10,1.25,.055,.075,.13,palette[i%2]);
 }else if(element==='poison'||element==='dark'||element==='arcane'){
  put(0,0,1.25,.40,.35,.42,palette[1]);put(.12,-.06,1.31,.22,.22,.24,palette[0]);put(-.16,.12,1.18,.19,.21,.27,palette[2]);
  for(let i=0;i<5;i++)put(-.25-i*.16,Math.sin(phase+i)*.12,1.22+Math.cos(phase+i)*.10,.12-i*.016,.13-i*.015,.16,palette[i%3]);
 }else{
  // Physical arrows retain a visible head, shaft and fletching.
  put(0,0,1.25,.075,.075,.80,palette[2]);put(.40,0,1.25,.20,.10,.23,palette[0]);put(.55,0,1.25,.10,.08,.13,palette[0]);put(-.32,0,1.25,.25,.06,.19,palette[1]);put(-.32,0,1.25,.06,.25,.19,palette[1]);
  for(let i=0;i<3;i++)put(-.60-i*.20,0,1.25,.055-i*.01,.055-i*.01,.14,palette[1]);
 }
 return parts;
}
