import * as T from 'three';
import {roVoxelWeapon,roHeldWeaponKey} from './ro-voxel-weapons.js';
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export function roMeleePose(age,duration=.5,kind='sword'){
 const p=age/duration;if(p<0||p>=1)return{active:false,x:0,y:0,z:0,wristX:0,wristZ:0,push:0};
 const wind=smooth(p/.20),cut=smooth((p-.20)/.48),returning=1-smooth((p-.74)/.26),reach=wind*returning;
 if(kind==='spear')return{active:true,x:-1.4*reach,y:0,z:0,wristX:Math.PI*reach,wristZ:0,push:.38*Math.sin(cut*Math.PI)*returning};
 if(['axe','mace'].includes(kind))return{active:true,x:(-2.3+1.5*cut)*reach,y:-.18*reach,z:-.08*reach,wristX:Math.PI*reach,wristZ:0,push:.12*Math.sin(cut*Math.PI)};
 return{active:true,x:-1.4*reach,y:(1.05-2.1*cut)*reach,z:-.16*reach,wristX:Math.PI*reach,wristZ:0,push:.08*Math.sin(cut*Math.PI)};
}
const tips=new Map();
export function roMeleeTip(unit){
 const key=roHeldWeaponKey(unit);if(tips.has(key))return tips.get(key);const model=roVoxelWeapon(key);let tip=[0,.98,0];
 if(model){const top=Math.max(...model.parts.map(p=>p[1]+p[4]/2)),end=model.parts.filter(p=>p[1]+p[4]/2>top-.05);tip=[end.reduce((n,p)=>n+p[0],0)/end.length,top,0];}
 tips.set(key,tip);return tip;
}
// Exactly the same shoulder, grip, wrist and Euler order as the live weapon rig.
export function roMeleeTipPoint(unit,age,duration,kind='sword'){
 const pose=roMeleePose(age,duration,kind),tip=new T.Vector3(...roMeleeTip(unit)).applyEuler(new T.Euler(pose.wristX,0,pose.wristZ));
 tip.add(new T.Vector3(.078,-.416,.0884)).applyEuler(new T.Euler(pose.x,pose.y,pose.z,'YXZ')).add(new T.Vector3(.338,1.066,pose.push));
 return tip.multiplyScalar(unit?.size||1).toArray();
}
