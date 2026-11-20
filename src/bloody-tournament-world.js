import * as T from 'three';
import {BLOODY_UNITS as UNITS,BLOODY_RULES as RULES,bloodyUnitAt} from '../shared/bloody-tournament-catalog.js';
import {BLOODY_TERRAIN_DATA as DATA} from '../shared/bloody-terrain-data.js';
import {BLOODY_BATTLEFIELD as FIELD,BLOODY_WORLD_SCALE as S,bloodyHeightAt,bloodyTerrainBlocked,bloodyPreparationValid} from '../shared/bloody-battlefield.js';
import {createMoltenLavaMaterial} from './lava-material.js';
import {castleUnitPortrait,buildCastleUnitModel} from './castle-unit-art.js';
const TEAM_COLORS=[0xc96e62,0x748fc9,0x78bfb5,0xaf8bbb,0xd6c48e,0xd49a61,0x84ad74,0xd5a0b0];
const PALETTE={Xdrt:0xa48a60,Dbrk:0x66403a,Xbtl:0x62556a,Xsqd:0x928a9d,Avin:0x355e37,Xhdg:0x467641,Xwmb:0x92949e,Dlvc:0x4f3432,Arck:0x767761,Iice:0xc6e2e7,cDc1:0xa34a30,cBc2:0xb6a16c,cIc1:0xa3cad8};
const PLOTS=FIELD.preparationPlots.filter(p=>p.native),templates=new Map();
const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const bloodyUnitPortrait=key=>UNITS[key]?castleUnitPortrait(UNITS[key].source):'';
function model(key){if(templates.has(key))return templates.get(key);const parts=[];if(UNITS[key]){const visual=buildCastleUnitModel(UNITS[key].source,null,(_,...part)=>parts.push(part));for(const p of visual?.legs||[])parts.push([p.x,p.y,p.z,p.w,p.h,p.d,p.color]);for(const wing of [...visual?.wings||[],...visual?.rotors||[]])for(const p of wing.parts)parts.push([p[0]+wing.pivot[0],p[1]+wing.pivot[1],p[2]+wing.pivot[2],...p.slice(3)]);}templates.set(key,parts);return parts;}
export function bloodyWorldTile(x,z){const ix=Math.max(0,Math.min(DATA.width-1,Math.floor((x/S-DATA.origin[0])/DATA.step))),iz=Math.max(0,Math.min(DATA.height-1,Math.floor((DATA.origin[1]-z/S)/DATA.step))),index=iz*DATA.width+ix;return{index,rawId:DATA.textures[Number.parseInt(DATA.tiles[index],16)],water:DATA.water[index]==='1'&&DATA.heights[index]<4.05,height:bloodyHeightAt(x,z),nativeHeight:DATA.heights[index],layer:Number.parseInt(DATA.relief[index],16)};}
export function createBloodyTournamentWorld({scene}){
 const root=new T.Group();root.name='bloody-tournament-world';root.visible=false;scene.add(root);
 const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial(),waterMaterial=new T.MeshLambertMaterial({transparent:true,opacity:.93}),glowMaterial=new T.MeshBasicMaterial({color:0xffffff}),ghostMaterial=new T.MeshLambertMaterial({transparent:true,opacity:.58,depthWrite:false}),fireMaterial=new T.MeshBasicMaterial({transparent:true,opacity:.9,depthWrite:false,toneMapped:false}),smokeMaterial=new T.MeshLambertMaterial({transparent:true,opacity:.33,depthWrite:false}),lavaMaterial=createMoltenLavaMaterial(),dummy=new T.Object3D(),color=new T.Color(),batches=new Map(),ownedGeometry=new Set([geometry]);
 lavaMaterial.vertexShader='varying vec3 vWorld;void main(){vec4 p=vec4(position,1.0);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\np=modelMatrix*p;vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}';
 let state=null,built=false,disposed=false,owner=null,selected=null,placement=null,buildKey=null,buildOwner=null,waterFrame=-1,rosterSignature=null;const waterCells=[],fires=[];
 function batch(key,count,mat=material){let mesh=batches.get(key);if(mesh&&mesh.instanceMatrix.count>=Math.max(1,count))return mesh;if(mesh){mesh.removeFromParent();mesh.dispose();}mesh=new T.InstancedMesh(geometry,mat,Math.max(1,count));mesh.name=key;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;mesh.count=0;root.add(mesh);batches.set(key,mesh);return mesh;}
 function put(mesh,index,x,y,z,w,h,d,c,rotation=0){dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.setHex(c));}
 function finish(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 function terrain(){
  const cells=(DATA.width-1)*(DATA.height-1),land=batch('bt-native-land',cells),water=batch('bt-native-water',cells,waterMaterial),lava=batch('bt-native-lava',cells,lavaMaterial),shore=batch('bt-native-shore',cells*2),vertices=[],colours=[];let l=0,w=0,v=0,s=0;
  const triangle=(a,b,c,shade)=>{for(const p of [a,b,c]){vertices.push(...p);colours.push(shade.r,shade.g,shade.b);}};
  for(let iz=0;iz<DATA.height-1;iz++)for(let ix=0;ix<DATA.width-1;ix++){
   const x=(DATA.origin[0]+(ix+.5)*DATA.step)*S,z=(DATA.origin[1]-(iz+.5)*DATA.step)*S,tile=bloodyWorldTile(x,z),base=PALETTE[tile.rawId]??0x74756b,h=tile.height;
   if(tile.water){const molten=['Dlvc','cDc1'].includes(tile.rawId),frozen=['Iice','cIc1'].includes(tile.rawId),c=frozen?0x75aeb9:tile.rawId==='Xhdg'?0x315d59:0x23485c;
    let shallow=false;for(const dx of [-.375,-.125,.125,.375])for(const dz of [-.375,-.125,.125,.375])if(!bloodyTerrainBlocked({x:x+dx*S,z:z+dz*S}))shallow=true;
    if(shallow)put(land,l++,x,h-.22,z,S*1.015,.42,S*1.015,base);
    if(molten)put(lava,v++,x,h+(shallow?-.035:-.7),z,S*1.015,.1,S*1.015,0xffffff);else{put(water,w++,x,h+(shallow?-.045:-.7),z,S*1.015,.12,S*1.015,c);waterCells.push({x,z,color:c});}
   }else{
    const corners=[[x-S/2,z-S/2],[x+S/2,z-S/2],[x-S/2,z+S/2],[x+S/2,z+S/2]].map(([px,pz])=>[px,bloodyHeightAt(px,pz),pz]);
    color.setHex(base).multiplyScalar(.94+random(ix+iz*DATA.width)*.1);triangle(corners[0],corners[2],corners[1],color);triangle(corners[1],corners[2],corners[3],color);
    const top=Math.min(...corners.map(p=>p[1]))-.025;put(land,l++,x,(top-1.6)/2,z,S*1.012,top+1.6,S*1.012,color.getHex());
    for(const [dx,dz,ww,dd]of [[1,0,.16*S,S*1.03],[0,-1,S*1.03,.16*S]])if(bloodyWorldTile(x+dx*S,z+dz*S).water){put(shore,s++,x+dx*S*.48,h-.5,z+dz*S*.48,ww,1.05,dd,['Iice','cIc1'].includes(tile.rawId)?0x7b9b9f:0x51545a);}
   }
  }finish(land,l);finish(water,w);finish(lava,v);finish(shore,s);land.castShadow=water.castShadow=lava.castShadow=false;
  const topGeometry=new T.BufferGeometry();topGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));topGeometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));topGeometry.computeVertexNormals();ownedGeometry.add(topGeometry);
  const topMaterial=new T.MeshLambertMaterial({vertexColors:true}),top=new T.Mesh(topGeometry,topMaterial);top.name='bt-relief-surface';top.receiveShadow=true;top.userData.ownedMaterial=true;root.add(top);
  const backdrop=batch('bt-water-horizon',1,waterMaterial);put(backdrop,0,0,-1.1,0,340,.1,340,0x1b3040);finish(backdrop,1);backdrop.castShadow=false;
  const architecture=batch('bt-native-architecture',DATA.placements.length*22+PLOTS.length*16),lamps=batch('bt-native-lights',DATA.placements.length*5,glowMaterial);let a=0,g=0;
  const box=(x,y,z,w,h,d,c,angle=0)=>put(architecture,a++,x,bloodyHeightAt(x,z)+y,z,w,h,d,c,angle);
  for(const [i,p]of DATA.placements.entries()){const x=p.x*S,z=p.z*S,k=p.rawId,scale=Math.min(1.7,Math.max(.5,p.scale||1));
   if(['YTfc','YTfb','YTac'].includes(k)){
    const h=k==='YTfb'?1.1:.9,alongX=Math.abs(Math.sin(p.angle))>.7;box(x,h/2,z,alongX?S:.38,h,alongX?.38:S,k==='YTfb'?0x5b6264:0x8a8398);box(x,h+.08,z,alongX?S*1.04:.5,.16,alongX?.5:S*1.04,0xb1a7b7);
   }else if(k==='ATtr'){
    // Roots and a visible trunk share the simulation footprint; broad foliage
    // stays overhead so its visual volume does not obstruct ground movement.
    box(x,2,z,.68*scale,4,.68*scale,0x504235);for(let j=0;j<4;j++){const crown=(3.2-j*.55)*scale;box(x+Math.sin(i)*j*.1,3.3+j*.65,z,crown,1.15,crown,[0x284c38,0x385f40,0x4e7549,0x6b8a54][j]);}
    for(const side of [-1,1])box(x+side*.5, .18,z,.9,.25,.35,0x5c5140,side*.5);
   }else if(k==='Volc'){
    for(let j=0;j<5;j++)box(x,.6+j*1.15,z,(5-j*.85)*scale,1.2,(5-j*.85)*scale,j%2?0x4a3a35:0x5e4940,p.angle);
    put(lamps,g++,x,bloodyHeightAt(x,z)+5.8,z,.8,.12,.8,0xffa13d);fires.push({x,z,y:bloodyHeightAt(x,z)+5.9,scale:2.1,seed:i});
   }else if(k==='YOf2'){
    // YOf2 is a native fire-effect placement in the volcanic sector.
    fires.push({x,z,y:bloodyHeightAt(x,z)+.06,scale:1.2+scale*.4,seed:i});
    box(x,.07,z,1.25,.12,1.25,0x4d3934);
   }else if(k==='IRgc'){
    for(let j=0;j<3;j++)box(x+(j-1)*.55,.8+j*.35,z,1.1*scale,1.6+j*.7,.8*scale,[0x719faf,0xa8d5df,0xd8eff0][j],j*.35);
   }else if(k==='OPop'){
    // Mushroom and fern grove replaces the former identical grey pillars.
    for(let j=0;j<3;j++){const px=x+(j-1)*.65,pz=z+Math.sin(j+i)*.45;box(px,.45,pz,.17,.9,.17,0x9a9f78);box(px,.95,pz,.85,.28,.7,j%2?0x7d9770:0x5a7b65);}
   }else if(k==='DOmc'||k==='ORmk'){
    for(let j=0;j<3;j++)box(x+(j-1)*.55,.3+j*.33,z+Math.sin(j+i)*.3,1.2*scale,.65+j*.28,1.3*scale,[0x5a4540,0x76604d,0x956744][j],j*.4);
   }else if(k==='BObo'){
    for(let j=0;j<4;j++)box(x+(j-1.5)*.3,.13,z,.15,.22,1.5-j*.12,0xd9dfd3,j*.12);
   }else if(k==='ORrs'){
    box(x,.25,z,1.7,.5,1.7,0x6f5544);box(x,1.2,z,.8,1.7,.7,0x99846b,.2);put(lamps,g++,x,bloodyHeightAt(x,z)+1.85,z,.3,.2,.3,0xe9a24e);
   }else if(k==='AOhs'){
    box(x,.16,z,2.6,.3,1.9,0x696f5f);for(const side of [-1,1])box(x+side*.75,1.1,z,.45,2,.5,0xa1a18a);box(x,2.05,z,2,.45,.6,0xb0ad91);
   }else if(k==='ORfk'){
    for(let j=0;j<3;j++)box(x+(j-1)*.65,.35+j*.2,z,1,.6+j*.3,.8,0x6c6356,j*.6);
   }
  }
  for(const [i,p]of PLOTS.entries()){
   const w=p.maxX-p.minX+2,d=p.maxZ-p.minZ+1.7,x=p.x,z=p.z;for(const side of [-1,1]){box(x+side*w/2,.1,z,.3,.2,d,0x9f94aa);box(x,.1,z+side*d/2,w,.2,.3,0x9f94aa);}
   box(p.minX+.5,1.45,p.minZ+.5,.17,2.9,.17,0x625a61);box(p.minX+.95,2.1,p.minZ+.5,.85,.8,.11,TEAM_COLORS[i]);
  }
  // A walkable summit mosaic is the central structure, rather than a solid
  // column that would hide combat or contradict the source navigation.
  for(let ring=0;ring<3;ring++)for(let i=0;i<32;i++){const angle=i/32*Math.PI*2,r=3.2+ring*1.3,x=Math.sin(angle)*r,z=Math.cos(angle)*r;put(lamps,g++,x,bloodyHeightAt(x,z)+.025,z,.32,.035,.8,ring===1?0xc7bd8e:0x7caaad,-angle);}
  finish(architecture,a);finish(lamps,g);lamps.castShadow=false;
  const details=batch('bt-biome-details',1500);let count=0;
  for(let i=0;i<560;i++){
   const x=(random(i*4+1)*76-38)*S,z=(random(i*4+2)*76-38)*S;if(bloodyTerrainBlocked({x,z},.55)||Math.hypot(x,z)<8)continue;const t=bloodyWorldTile(x,z),h=bloodyHeightAt(x,z);
   if(t.water)continue;
   if(z>8&&Math.abs(x)<z+12){const a=random(i+4)*Math.PI;put(details,count++,x,h+.1,z,.75,.18,.5,0xe4f0eb,a);if(i%4===0)put(details,count++,x+.25,h+.2,z,.25,.35,.3,0xbedce0,a);}
   else if(x>Math.abs(z)*.5){put(details,count++,x,h+.2,z,.12,.4,.7,0x5d8349,random(i)*6);put(details,count++,x,h+.18,z,.6,.34,.12,0x70914e,random(i)*6);if(i%7===0)put(details,count++,x,h+.35,z,.22,.15,.22,0xd2b579);}
   else if(x< -Math.abs(z)*.5){put(details,count++,x,h+.08,z,.5,.13,.35,0x453531,random(i)*6);if(i%19===0)fires.push({x,z,y:h+.04,scale:.55,seed:i+500});}
   else{put(details,count++,x,h+.08,z,.65,.14,.35,0xc4b28a,random(i)*6);}
  }finish(details,count);details.castShadow=false;
  batch('bt-fire-flames',fires.length*12,fireMaterial).castShadow=false;batch('bt-fire-smoke',fires.length*4,smokeMaterial).castShadow=false;batch('bt-fire-embers',fires.length*5,glowMaterial).castShadow=false;
 }
 function animate(time){const frame=Math.floor(time*10);if(frame===waterFrame)return;waterFrame=frame;lavaMaterial.uniforms.uTime.value=time;
  const water=batches.get('bt-native-water');for(let i=0;i<waterCells.length;i++){const p=waterCells[i],pulse=1+Math.sin(time*.7+p.x*.14+p.z*.08)*.05;water.setColorAt(i,color.setHex(p.color).multiplyScalar(pulse));}if(water.instanceColor)water.instanceColor.needsUpdate=true;
  const flames=batches.get('bt-fire-flames'),smoke=batches.get('bt-fire-smoke'),embers=batches.get('bt-fire-embers');let f=0,s=0,e=0;
  for(const p of fires){for(let j=0;j<12;j++){const phase=(time*(.5+random(p.seed+j)*.3)+j/12)%1,a=j*2.4+p.seed,taper=1-phase,y=p.y+phase*p.scale*3,spread=(.35+phase*.15)*p.scale;put(flames,f++,p.x+Math.sin(a+time*2)*spread,y,p.z+Math.cos(a+time*1.4)*spread,(.18+taper*.48)*p.scale,(.32+taper*.75)*p.scale,(.18+taper*.45)*p.scale,j%3===0?0xffec9d:phase>.55?0xd86c2e:0xffb346,a);}
   for(let j=0;j<4;j++){const phase=(time*.22+j/4)%1,spread=(.4+phase*.5)*p.scale;put(smoke,s++,p.x+Math.sin(p.seed+j+time*.5)*spread,p.y+p.scale*(2+phase*4),p.z+Math.cos(p.seed+j)*spread,(.35+phase*.9)*p.scale,(.3+phase*.65)*p.scale,(.35+phase*.8)*p.scale,0x5b5149,j+time*.15);}
   for(let j=0;j<5;j++){const phase=(time*.42+j/5)%1,a=j*3.1+p.seed;put(embers,e++,p.x+Math.sin(a)*phase*p.scale,p.y+p.scale*(.7+phase*5),p.z+Math.cos(a)*phase*p.scale,.07,.12,.07,phase>.7?0xc76a36:0xffd47a,a);}
  }finish(flames,f);finish(smoke,s);finish(embers,e);
 }
 function soldier(mesh,index,key,x,z,scale=1,tint=null){const parts=model(key),altitude=UNITS[key]?.category==='flying'?3:0;for(const [px,py,pz,w,h,d,c]of parts)put(mesh,index++,x+px*scale,bloodyHeightAt(x,z)+py*scale+.045+altitude,z+pz*scale,w*scale,h*scale,d*scale,tint??c);return index;}
 function roster(){const formations=state?.formations||[],adapted=formations.filter(f=>f.native===false),extra=batch('bt-adapted-gardens',adapted.length*10);let e=0;
  for(const f of adapted){const x=(f.minX+f.maxX)/2,z=(f.minZ+f.maxZ)/2,w=f.maxX-f.minX,d=f.maxZ-f.minZ;put(extra,e++,x,-.21,z,w+2,.42,d+1.7,0x8a8197);for(const offset of [-1,0,1])put(extra,e++,x+offset*w*.29,.012,z,Math.min(4.7,w*.22),.025,Math.min(4.7,d*.42),0x49733e,Math.PI/4);for(const side of [-1,1]){put(extra,e++,x+side*(w+1.8)/2,.1,z,.3,.2,d+1.7,0xb0a2b7);put(extra,e++,x,.1,z+side*(d+1.6)/2,w+2,.2,.3,0xb0a2b7);}}
  finish(extra,e);const pads=batch('bt-formations',formations.length*5);let n=0;
  for(const f of formations)if(f.owner===owner){const c=TEAM_COLORS[(f.team-1)%TEAM_COLORS.length],w=f.maxX-f.minX,d=f.maxZ-f.minZ,x=(f.minX+f.maxX)/2,z=(f.minZ+f.maxZ)/2;for(const side of [-1,1]){put(pads,n++,x+side*w/2,.035,z,.06,.04,d,c);put(pads,n++,x,.035,z+side*d/2,w,.04,.06,c);}}finish(pads,n);
  let capacity=0;for(const p of state?.players||[])for(const entry of p.roster||[])capacity+=model(entry.key).length*(UNITS[entry.key]?.count||1);
  const soldiers=batch('bt-roster-models',capacity),selection=batch('bt-placement',Math.max(1,(state?.players||[]).reduce((sum,p)=>sum+(p.roster?.length||0)*12,0)));let m=0,s=0;
  if(state?.stage==='preparation')for(const p of state.players||[])for(const entry of p.roster||[]){const d=UNITS[entry.key];if(!d)continue;const size=bloodyUnitAt(entry.key).size,count=d.count;for(let j=0;j<count;j++)m=soldier(soldiers,m,entry.key,entry.x+(j-(count-1)/2)*1.8,entry.z,size);if(p.owner===owner&&entry.id===selected)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put(selection,s++,entry.x+Math.sin(a)*2.4,.035,entry.z+Math.cos(a)*2.4,.13,.04,.42,0xf1d48c,-a);}}
  finish(soldiers,m);finish(selection,s);
 }
 function preview(){const d=UNITS[placement?.key],parts=d?model(d.key):[],mesh=batch('bt-placement-preview',parts.length*(d?.count||1),ghostMaterial),ring=batch('bt-placement-validity',12,glowMaterial);let n=0,r=0;
  if(state?.stage==='preparation'&&d&&placement?.point&&Number.isFinite(placement.point.x)&&Number.isFinite(placement.point.z)&&(!placement.owner||placement.owner===owner)){const p=placement.point,formation=state.formations?.find(f=>f.owner===owner),player=state.players?.find(p=>p.owner===owner),moving=player?.roster?.some(e=>e.id===selected),free=!player?.roster?.some(e=>e.id!==selected&&Math.hypot(e.x-p.x,e.z-p.z)<1),affordable=moving||player&&player.gold>=d.cost&&(player.food||0)+d.food<=RULES.maxFood&&(player.roster?.length||0)<RULES.maxWarbands,valid=placement.valid!==false&&formation&&bloodyPreparationValid(formation.seat,p)&&free&&affordable,c=valid?0xb9dca2:0xdf7668;for(let i=0;i<d.count;i++)n=soldier(mesh,n,d.key,p.x+(i-(d.count-1)/2)*1.8,p.z,bloodyUnitAt(d.key).size,valid?null:0xb76159);for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=p.x+Math.sin(a)*2.4,z=p.z+Math.cos(a)*2.4;put(ring,r++,x,bloodyHeightAt(x,z)+.06,z,.14,.05,.38,c,-a);}}
  finish(mesh,n);finish(ring,r);mesh.castShadow=ring.castShadow=false;
 }
 return{root,heightAt:bloodyHeightAt,update(next,time=0,viewer=null){if(disposed)return;const active=next?.options?.mode==='bloody';root.visible=active;if(!active){state=null;return;}state=next.bloodyTournament;owner=viewer;if(!built){terrain();built=true;}animate(time);const signature=JSON.stringify([state?.stage,owner,selected,state?.formations,state?.players?.map(p=>({owner:p.owner,roster:p.roster}))]);if(signature!==rosterSignature){rosterSignature=signature;roster();}preview();},
  pick(point){if(!root.visible||state?.stage!=='preparation'||!point)return null;let best=null,distance=Infinity;for(const p of state.players||[])for(const entry of p.roster||[]){const d=Math.hypot(point.x-entry.x,point.z-entry.z);if(d<2.7&&d<distance){best={bloodyEntry:entry.id,bloodyOwner:p.owner};distance=d;}}return best;},
  setSelection(entry){selected=entry;},setPlacement(value){placement=value;},setBuildKey(key,nextOwner=null){buildKey=key;buildOwner=nextOwner;if(!key)placement=null;else if(placement)placement={...placement,key,owner:nextOwner};},setCursor(point,valid=true){placement=buildKey&&point?{key:buildKey,point,valid,owner:buildOwner}:null;},
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const mesh of batches.values())mesh.dispose();for(const child of root.children)if(child.userData.ownedMaterial)child.material.dispose();for(const g of ownedGeometry)g.dispose();for(const m of [material,waterMaterial,glowMaterial,ghostMaterial,fireMaterial,smokeMaterial,lavaMaterial])m.dispose();}
 };
}
