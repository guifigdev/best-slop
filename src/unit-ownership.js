import {Color} from 'three';
// HP bars share the world's material, but each owns its vertex colors.
export function tintOwnershipBar(mesh,hex){if(mesh.userData.ownerTint===hex)return;const colors=mesh.geometry.getAttribute('color');if(!colors)return;const tint=new Color(hex);for(let i=0;i<colors.count;i++)colors.setXYZ(i,tint.r,tint.g,tint.b);colors.needsUpdate=true;mesh.userData.ownerTint=hex;}
