import * as T from 'three';
import {BLOODY_UNITS as UNITS} from '../shared/bloody-tournament-catalog.js';
import {BLOODY_TERRAIN_DATA as DATA} from '../shared/bloody-terrain-data.js';
import {bloodyTerrainBlocked} from '../shared/bloody-battlefield.js';
import {createMoltenLavaMaterial} from './lava-material.js';
import {castleUnitPortrait} from './castle-unit-art.js';
const TEAM_COLORS=[0xc96e62,0x748fc9,0x78bfb5,0xaf8bbb,0xd6c48e,0xd49a61,0x84ad74,0xd5a0b0];
const PALETTE={Xdrt:0x9e8965,Dbrk:0x68413c,Xbtl:0x62556a,Xsqd:0x928a9d,Avin:0x355e37,Xhdg:0x467641,Xwmb:0x92949e,Dlvc:0x4f3432,Arck:0x767761,Iice:0xbed8df,cDc1:0x9e4c36,cBc2:0xa3956b,cIc1:0x9cbfcd};
const PLOTS=['Red','Blue','Teal','Purple','Yellow','Orange','Green','Pink'].map(name=>({...DATA.regions[name],name}));
export const bloodyUnitPortrait=key=>UNITS[key]?castleUnitPortrait(UNITS[key].source):'';
export function bloodyWorldTile(x,z){const ix=Math.max(0,Math.min(DATA.width-1,Math.floor((x-DATA.origin[0])/DATA.step))),iz=Math.max(0,Math.min(DATA.height-1,Math.floor((DATA.origin[1]-z)/DATA.step))),index=iz*DATA.width+ix;return{index,rawId:DATA.textures[Number.parseInt(DATA.tiles[index],16)],water:DATA.water[index]==='1'&&DATA.heights[index]<4.05,height:DATA.heights[index],layer:Number.parseInt(DATA.relief[index],16)};}
export function createBloodyTournamentWorld({scene}){
 const root=new T.Group();root.name='bloody-tournament-world';root.visible=false;scene.add(root);
 const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial(),waterMaterial=new T.MeshLambertMaterial({transparent:true,opacity:.92}),glowMaterial=new T.MeshBasicMaterial({color:0xffffff}),lavaMaterial=createMoltenLavaMaterial(),dummy=new T.Object3D(),color=new T.Color(),batches=new Map();
 lavaMaterial.vertexShader='varying vec3 vWorld;void main(){vec4 p=vec4(position,1.0);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\np=modelMatrix*p;vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}';
 let state=null,built=false,disposed=false,owner=null,selected=null,waterFrame=-1;const waterCells=[];
 function batch(key,count,mat=material){let mesh=batches.get(key);if(mesh&&mesh.instanceMatrix.count>=Math.max(1,count))return mesh;if(mesh){mesh.removeFromParent();mesh.dispose();}mesh=new T.InstancedMesh(geometry,mat,Math.max(1,count));mesh.name=key;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;mesh.count=0;root.add(mesh);batches.set(key,mesh);return mesh;}
 function put(mesh,index,x,y,z,w,h,d,c,rotation=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.setHex(c));}
 function finish(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 function terrain(){
  const cells=(DATA.width-1)*(DATA.height-1),land=batch('bt-native-land',cells),water=batch('bt-native-water',cells,waterMaterial),lava=batch('bt-native-lava',cells,lavaMaterial),shore=batch('bt-native-shore',cells*2);let l=0,w=0,v=0,s=0;
  for(let iz=0;iz<DATA.height-1;iz++)for(let ix=0;ix<DATA.width-1;ix++){
   const x=DATA.origin[0]+(ix+.5)*DATA.step,z=DATA.origin[1]-(iz+.5)*DATA.step,tile=bloodyWorldTile(x,z),base=PALETTE[tile.rawId]??0x74756b;
   if(tile.water){const molten=['Dlvc','cDc1'].includes(tile.rawId),frozen=['Iice','cIc1'].includes(tile.rawId),c=frozen?0x568998:tile.rawId==='Xhdg'?0x315d59:0x243e55;
    let shallow=false;for(const dx of [-.375,-.125,.125,.375])for(const dz of [-.375,-.125,.125,.375])if(!bloodyTerrainBlocked({x:x+dx,z:z+dz}))shallow=true;
    if(shallow)put(land,l++,x,-.22,z,1.015,.42,1.015,base);
    if(molten)put(lava,v++,x,shallow?-.035:-.5,z,1.015,.1,1.015,0xffffff);else{put(water,w++,x,shallow?-.045:-.5,z,1.015,.12,1.015,c);waterCells.push({x,z,color:c});}
   }
   else{color.setHex(base).multiplyScalar(.96+(tile.height%1)*.05);put(land,l++,x,-.21,z,1.015,.42,1.015,color.getHex());
    for(const [dx,dz,ww,dd]of [[1,0,.16,1.03],[0,-1,1.03,.16]])if(bloodyWorldTile(x+dx,z+dz).water){put(shore,s++,x+dx*.48,-.4,z+dz*.48,ww,.8,dd,['Iice','cIc1'].includes(tile.rawId)?0x7b9b9f:0x51545a);}
   }
  }finish(land,l);finish(water,w);finish(lava,v);finish(shore,s);land.castShadow=water.castShadow=lava.castShadow=false;
  const backdrop=batch('bt-water-horizon',1,waterMaterial);put(backdrop,0,0,-.68,0,170,.1,170,0x1b3040);finish(backdrop,1);backdrop.castShadow=false;
  const architecture=batch('bt-native-architecture',DATA.placements.length*7+PLOTS.length*12),lamps=batch('bt-native-lights',DATA.placements.length*2,glowMaterial);let a=0,g=0;
  for(const p of DATA.placements){const x=p.x,z=p.z,k=p.rawId,scale=Math.min(1.7,Math.max(.5,p.scale||1));
   if(['YTfc','YTfb','YTac'].includes(k)){
    const h=k==='YTfb'?.85:.65,alongX=Math.abs(Math.sin(p.angle))>.7;put(architecture,a++,x,h/2,z,alongX?1:.3,h,alongX?.3:1,k==='YTfb'?0x5b6264:0x8a8398);put(architecture,a++,x,h+.07,z,alongX?1.05:.4,.14,alongX?.4:1.05,0xb1a7b7);
   }else if(k==='ATtr'){
    put(architecture,a++,x,1.3,z,.45*scale,2.6,.45*scale,0x504235);for(let j=0;j<3;j++)put(architecture,a++,x,2.1+j*.55,z,(2-j*.4)*scale,.85,(2-j*.4)*scale,[0x36563d,0x486a45,0x5a7b50][j]);
   }else if(k==='Volc'){
    for(let j=0;j<3;j++)put(architecture,a++,x,.28+j*.45,z,(2.5-j*.62)*scale,.55,(2.5-j*.62)*scale,0x55443e);put(lamps,g++,x,1.26,z,.6,.08,.6,0xc6763b);
   }else if(k==='YOf2'){
    put(architecture,a++,x,.2,z,1.7,.4,1.7,0xa29aa8);put(architecture,a++,x,.7,z,.35,1,.35,0x8f899f);put(lamps,g++,x,.43,z,1.25,.04,1.25,0x6aafb8);
   }else if(k==='IRgc'){
    put(architecture,a++,x,.5,z,.8*scale,1,.8*scale,0x9fc3d2,.2);put(architecture,a++,x+.3,.8,z,.4*scale,1.6,.4*scale,0xc4dce2,-.15);
   }else if(['OPop','DOmc','BObo','ORrs','AOhs','ORfk','ORmk'].includes(k)){
    put(architecture,a++,x,.2,z,1.1*scale,.4,1.1*scale,0x686560);put(architecture,a++,x,.65,z,.45*scale,.65,.45*scale,0x9a947c);
   }
  }
  for(const [i,p]of PLOTS.entries()){
   // Each player's native island retains its three painted green patches underneath.
   const w=p.maxX-p.minX+1.3,d=p.maxZ-p.minZ+1.1,x=p.x,z=p.z;for(const side of [-1,1]){put(architecture,a++,x+side*w/2,.08,z,.22,.16,d,0x9f94aa);put(architecture,a++,x,.08,z+side*d/2,w,.16,.22,0x9f94aa);}
   put(architecture,a++,p.minX+.35,1.05,p.minZ+.35,.12,2.1,.12,0x625a61);put(architecture,a++,p.minX+.65,1.65,p.minZ+.35,.55,.6,.08,TEAM_COLORS[i]);
  }finish(architecture,a);finish(lamps,g);lamps.castShadow=false;
 }
 return{root,update(next,time=0,viewer=null){
  if(disposed)return;const active=next?.options?.mode==='bloody';root.visible=active;if(!active){state=null;return;}state=next.bloodyTournament;owner=viewer;if(!built){terrain();built=true;}
  const frame=Math.floor(time*5);if(frame!==waterFrame){waterFrame=frame;lavaMaterial.uniforms.uTime.value=time;const water=batches.get('bt-native-water');for(let i=0;i<waterCells.length;i++){const p=waterCells[i],pulse=1+Math.sin(time*.7+p.x*.29+p.z*.17)*.045;water.setColorAt(i,color.setHex(p.color).multiplyScalar(pulse));}water.instanceColor.needsUpdate=true;}
  const formations=state?.formations||[],adapted=formations.filter(f=>f.native===false),extra=batch('bt-adapted-gardens',adapted.length*10);let e=0;
  for(const f of adapted){const x=(f.minX+f.maxX)/2,z=(f.minZ+f.maxZ)/2,w=f.maxX-f.minX,d=f.maxZ-f.minZ;
   put(extra,e++,x,-.21,z,w+1.2,.42,d+1.1,0x8a8197);
   for(const offset of [-1,0,1])put(extra,e++,x+offset*w*.29,.012,z,Math.min(2.35,w*.22),.025,Math.min(2.35,d*.42),0x49733e,Math.PI/4);
   for(const side of [-1,1]){put(extra,e++,x+side*(w+.9)/2,.1,z,.2,.2,d+1.1,0xb0a2b7);put(extra,e++,x,.1,z+side*(d+.8)/2,w+1.2,.2,.2,0xb0a2b7);}
  }finish(extra,e);
  const pads=batch('bt-formations',formations.length*5),markers=batch('bt-placement',Math.max(1,(state?.players||[]).reduce((sum,p)=>sum+(p.roster?.length||0)*2,0)));let n=0,m=0;
  for(const f of formations){const c=TEAM_COLORS[(f.team-1)%TEAM_COLORS.length],w=f.maxX-f.minX,d=f.maxZ-f.minZ,x=(f.minX+f.maxX)/2,z=(f.minZ+f.maxZ)/2;
   if(f.owner===owner)for(const side of [-1,1]){put(pads,n++,x+side*w/2,.04,z,.055,.04,d,c);put(pads,n++,x,.04,z+side*d/2,w,.04,.055,c);}
   if(state.stage==='preparation'){const p=state.players.find(p=>p.owner===f.owner);for(const e of p?.roster||[]){const chosen=f.owner===owner&&e.id===selected;put(markers,m++,e.x,.11,e.z,.68,.1,.68,chosen?0xf1d48c:c);put(markers,m++,e.x,.27,e.z,.12,.24,.12,c);}}
  }finish(pads,n);finish(markers,m);
 },pick(point){if(!root.visible||state?.stage!=='preparation'||!point)return null;for(const p of state.players||[])for(const entry of p.roster)if(Math.hypot(point.x-entry.x,point.z-entry.z)<.8)return{bloodyEntry:entry.id,bloodyOwner:p.owner};return null;},setSelection(entry){selected=entry;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of batches.values())mesh.dispose();geometry.dispose();material.dispose();waterMaterial.dispose();glowMaterial.dispose();lavaMaterial.dispose();}};
}
