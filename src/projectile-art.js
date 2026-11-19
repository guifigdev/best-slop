import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original code-built voxel art. Geometry and opaque vertex-colour material are
// shared by every shot; a new projectile does not rebuild its component boxes.
export const PROJECTILE_PALETTES=Object.freeze({
 arrow:{core:0xece4bf,edge:0x8b6646,trail:0xc3b27d},bullet:{core:0xffefb0,edge:0xd39745,trail:0xf1c575},
 arcane:{core:0xf5e9b8,edge:0x9b87d1,trail:0xbca9e8},fire:{core:0xffedb0,edge:0xf47e40,trail:0xe7a252},
 frost:{core:0xe4ffff,edge:0x78cbd7,trail:0xa6e4e7},poison:{core:0xd6ef9b,edge:0x70974f,trail:0x9ec46f},
 siege:{core:0xb0aaa0,edge:0x5c6865,trail:0xbeb296},
 egg:{core:0xfff4da,edge:0xd3b485,trail:0xf5d179},scrap:{core:0xd5dad0,edge:0x758b7b,trail:0xc7bb7d},
 carrot:{core:0xf3a34c,edge:0xb96030,trail:0xb8d28d},feather:{core:0xe8edce,edge:0x81b8cb,trail:0xc1ddeb},
 shell:{core:0xc0d293,edge:0x638065,trail:0xacc68b},droplet:{core:0xd8f0ea,edge:0x6399b7,trail:0xa7d6df},
 thorn:{core:0xe6d4a2,edge:0x7e7652,trail:0xc7c298},sonic:{core:0xc5b9e9,edge:0x8a7bb4,trail:0xb8a7df}
});
const geometryCache=new Map(),projectileMaterial=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false});
export function projectileStyle(event,source={}){
 if(event.projectileKind&&Object.hasOwn(PROJECTILE_PALETTES,event.projectileKind))return event.projectileKind;
 const element=event.element||source.element;
 if(element==='ice'||element==='frost')return 'frost';
 if(['fire','poison'].includes(element))return element;
 if(source.attackType==='siege')return 'siege';
 if(element||['magic','spells'].includes(source.attackType))return 'arcane';
 return 'arrow';
}
export function voxelProjectileGeometry(style='arcane'){
 if(!PROJECTILE_PALETTES[style])style='arcane';
 if(geometryCache.has(style))return geometryCache.get(style);
 const p=PROJECTILE_PALETTES[style],parts=[];
 const box=(x,y,z,w,h,d,hex)=>{const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);const color=new T.Color(hex),colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=color.r;colors[i+1]=color.g;colors[i+2]=color.b;}g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g);};
 if(style==='arrow'){
  box(0,0,0,.07,.07,.9,p.edge);box(0,0,.5,.2,.09,.24,p.core);box(0,0,.65,.1,.07,.12,p.core);
  box(-.11,0,-.35,.24,.065,.22,p.core);box(0,.1,-.35,.065,.22,.22,p.core);
 }else if(style==='bullet'){
  box(0,0,0,.12,.12,.5,p.core);box(0,0,.28,.08,.08,.16,0xffffff);box(0,0,-.25,.16,.16,.17,p.edge);
 }else if(style==='frost'){
  box(0,0,0,.22,.22,.8,p.core);box(0,0,.43,.12,.12,.2,p.core);box(0,0,-.1,.48,.11,.24,p.edge);box(0,0,-.1,.11,.48,.24,p.edge);
 }else if(style==='fire'){
  box(0,0,0,.32,.32,.65,p.core);box(0,0,-.35,.24,.24,.27,p.edge);box(.17,.05,-.16,.16,.23,.35,p.edge);box(-.15,-.07,-.22,.15,.18,.3,0xe45d32);box(0,.18,-.1,.16,.15,.3,0xffba58);
 }else if(style==='poison'){
  box(0,0,0,.36,.32,.48,p.edge);box(0,.03,.19,.24,.22,.22,p.core);box(-.2,.09,-.08,.17,.17,.2,p.core);box(.14,-.14,-.2,.18,.15,.22,p.trail);
 }else if(style==='siege'){
  box(0,0,0,.4,.32,.4,p.edge);box(0,.03,.04,.32,.4,.3,p.core);box(0,.06,.2,.2,.22,.12,0xd4c8b2);
 }else if(style==='egg'){
  box(0,-.13,0,.27,.18,.28,p.edge);box(0,.02,0,.38,.26,.36,p.core);box(0,.2,0,.25,.15,.25,p.core);box(.13,.06,.17,.08,.1,.025,0xc4a47a);
 }else if(style==='scrap'){
  box(-.08,0,0,.3,.36,.32,p.edge);box(-.08,.19,0,.33,.06,.34,p.core);box(-.08,-.19,0,.33,.05,.34,0x56675b);box(-.08,0,.17,.22,.18,.025,0xd2bb78);
  box(.18,.08,.06,.21,.18,.22,0xe6e2cc);box(.2,-.14,.08,.25,.08,.13,0xe3bf55);box(.29,-.07,.07,.09,.18,.12,0xedd67b);
 }else if(style==='carrot'){
  box(0,0,.1,.25,.25,.48,p.core);box(0,0,.41,.13,.13,.19,p.core);box(0,0,-.19,.29,.29,.17,p.edge);
  box(-.12,.06,-.4,.1,.12,.32,0x83a76e);box(.1,-.04,-.41,.12,.09,.34,0xa0bd7e);box(0,.1,-.42,.09,.16,.29,0x60835b);
 }else if(style==='feather'){
  box(0,0,0,.06,.07,.83,0xd3b775);for(let i=0;i<4;i++){const w=.27-i*.045;box(-w*.42,0,-.25+i*.17,w,.055,.16,p.core);box(w*.42,.02,-.22+i*.17,w,.055,.16,i%2?p.core:p.edge);}
 }else if(style==='shell'){
  box(0,-.07,0,.48,.15,.52,p.edge);box(0,.08,0,.36,.25,.4,p.core);box(0,.23,0,.2,.08,.24,p.edge);box(0,.11,.21,.08,.14,.03,p.edge);box(.19,.11,0,.03,.14,.08,p.edge);
 }else if(style==='droplet'){
  box(0,-.03,0,.32,.3,.35,p.edge);box(0,.15,0,.22,.18,.23,p.core);box(0,.28,0,.1,.12,.11,p.core);box(-.09,.03,.18,.07,.13,.03,p.core);
 }else if(style==='thorn'){
  for(let i=-1;i<=1;i++){box(i*.13,0,-Math.abs(i)*.12,.07,.07,.6,p.edge);box(i*.13,0,.31-Math.abs(i)*.12,.035,.035,.18,p.core);}
 }else if(style==='sonic'){
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(Math.sin(a)*.28,Math.cos(a)*.28,0,.11,.11,.07,i%3?p.core:p.edge);}
 }else{
  box(0,0,0,.28,.28,.48,p.core);box(0,0,0,.5,.08,.3,p.edge);box(0,0,0,.08,.5,.3,p.edge);box(0,0,-.31,.15,.15,.15,p.edge);
 }
 const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();geometry.computeBoundingSphere();geometryCache.set(style,geometry);return geometry;
}
export function voxelProjectileMesh(style){return new T.Mesh(voxelProjectileGeometry(style),projectileMaterial);}
export function voxelProjectileMaterial(){return projectileMaterial;}

export function actorEffectHeight(actor,point,ground=.18){
 if(!actor)return ground+1.3;
 return actor.root.position.y+(actor.eyeLine||actor.modelHeight*.62||1.5)*(actor.root.scale.y||1);
}
