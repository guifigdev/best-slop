import * as T from 'three';
export const VOXEL_FIRE_BUDGET=Object.freeze({flames:12,smoke:4,embers:5,drawCalls:3});
let shared=null,users=0;
function acquire(){if(!shared)shared={geometry:new T.BoxGeometry(1,1,1),flame:new T.MeshBasicMaterial({transparent:true,opacity:.92,depthWrite:false,toneMapped:false}),smoke:new T.MeshLambertMaterial({transparent:true,opacity:.28,depthWrite:false}),ember:new T.MeshBasicMaterial({toneMapped:false,depthWrite:false})};users++;return shared;}
const seedValue=value=>typeof value==='number'&&Number.isFinite(value)?value:[...String(value)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7)*.001;
const random=seed=>{const n=Math.sin(seed*12.9898+78.233)*43758.5453;return n-Math.floor(n);};
export function createVoxelFire(parent,{scale=1,seed=0,smoke=true}={}){
 const resources=acquire(),root=new T.Group(),dummy=new T.Object3D(),tint=new T.Color(),phaseSeed=seedValue(seed);root.name='voxel-fire';parent.add(root);
 const flames=new T.InstancedMesh(resources.geometry,resources.flame,VOXEL_FIRE_BUDGET.flames),clouds=new T.InstancedMesh(resources.geometry,resources.smoke,VOXEL_FIRE_BUDGET.smoke),embers=new T.InstancedMesh(resources.geometry,resources.ember,VOXEL_FIRE_BUDGET.embers);
 for(const [i,mesh]of [flames,clouds,embers].entries()){mesh.name=['voxel-fire-flames','voxel-fire-smoke','voxel-fire-embers'][i];mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;mesh.renderOrder=2;root.add(mesh);}clouds.count=smoke?VOXEL_FIRE_BUDGET.smoke:0;
 let disposed=false,last=-1;const resize=value=>root.scale.setScalar(Number.isFinite(value)?Math.max(.08,Math.min(5,value)):1);resize(scale);
 function put(mesh,index,x,y,z,w,h,d,color,angle=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(.08*Math.sin(angle),angle,.07*Math.cos(angle));dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,tint.setHex(color));}
 const api={root,update(time,{enabled=true,scale:nextScale}={}){if(disposed)return;root.visible=enabled&&Number.isFinite(time);if(nextScale!==undefined)resize(nextScale);if(!root.visible)return;const frame=Math.floor(time*8);if(frame===last)return;last=frame;const t=frame/8;
  for(let j=0;j<VOXEL_FIRE_BUDGET.flames;j++){const life=(t*(.5+random(phaseSeed+j)*.3)+j/12)%1,a=j*2.4+phaseSeed,taper=1-life,spread=.35+life*.15;put(flames,j,Math.sin(a+t*2)*spread,.22+life*3,Math.cos(a+t*1.4)*spread,.18+taper*.48,.32+taper*.75,.18+taper*.45,j%3===0?0xffec9d:life>.55?0xd86c2e:0xffb346,a);}
  for(let j=0;j<clouds.count;j++){const life=(t*.22+j/4)%1,spread=.4+life*.5;put(clouds,j,Math.sin(phaseSeed+j+t*.5)*spread,2+life*4,Math.cos(phaseSeed+j)*spread,.35+life*.9,.3+life*.65,.35+life*.8,0x5b5149,j+t*.15);}
  for(let j=0;j<VOXEL_FIRE_BUDGET.embers;j++){const life=(t*.42+j/5)%1,a=j*3.1+phaseSeed;put(embers,j,Math.sin(a)*life,.7+life*5,Math.cos(a)*life,.07,.12,.07,life>.7?0xc76a36:0xffd47a,a);}
  for(const mesh of [flames,clouds,embers]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of [flames,clouds,embers])mesh.dispose();root.clear();if(--users===0&&shared){for(const resource of Object.values(shared))resource.dispose();shared=null;}}};api.update(0);return api;
}
