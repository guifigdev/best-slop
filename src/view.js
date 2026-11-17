import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HEROES} from '../shared/catalog.js';

export function createView(container,overlay,onPoint){
 const scene=new T.Scene();scene.background=new T.Color(0xaac2b0);scene.fog=new T.Fog(0xaac2b0,75,130);
 const camera=new T.PerspectiveCamera(37,1,.1,180),renderer=new T.WebGLRenderer({antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Arena 3D. Botão direito move ou ataca. Setas movem câmera; espaço centraliza.');container.prepend(canvas);
 scene.add(new T.HemisphereLight(0xfff8e8,0x627e67,1.9));const sun=new T.DirectionalLight(0xffeccb,2.3);sun.position.set(-22,35,17);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-29,right:29,top:29,bottom:-29,far:95});sun.shadow.normalBias=.06;scene.add(sun);
 const base=new T.BoxGeometry(1,1,1);base.setAttribute('color',new T.BufferAttribute(new Float32Array(base.attributes.position.count*3).fill(1),3));
 const material=new T.MeshLambertMaterial({vertexColors:true}),geometryCache=new Map();
 function voxel(parent,x,y,z,w,h,d,hex){const geo=base.clone();const col=new T.Color(hex),attribute=geo.attributes.color;for(let i=0;i<attribute.count;i++)attribute.setXYZ(i,col.r,col.g,col.b);const mesh=new T.Mesh(geo,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function bake(group,key){let geo=geometryCache.get(key);if(!geo){const chunks=group.children.map(m=>{m.updateMatrix();const g=m.geometry.clone();g.applyMatrix4(m.matrix);return g;});geo=mergeGeometries(chunks);chunks.forEach(g=>g.dispose());if(key)geometryCache.set(key,geo);}for(const m of [...group.children]){m.geometry.dispose();group.remove(m);}const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 let seed=94;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const island=new T.Group();scene.add(island);
 voxel(island,0,-1.5,0,39,2.5,39,0x8f7957);voxel(island,0,-.15,0,39,.5,39,0x829967);voxel(island,0,-3,0,36,1,36,0x72705a);voxel(island,0,-3.9,0,31,.8,31,0x656451);
 const tiles=new T.InstancedMesh(base,material,32*32),dummy=new T.Object3D(),color=new T.Color();let tile=0;
 for(let x=-16;x<16;x++)for(let z=-16;z<16;z++){dummy.position.set(x+.5,.14,z+.5);dummy.scale.set(.996,.12,.996);dummy.updateMatrix();tiles.setMatrixAt(tile,dummy.matrix);const r=Math.hypot(x+.5,z+.5);tiles.setColorAt(tile++,color.setHex((r>12.5&&r<14.5)?[0xc4bc99,0xd0c5a1,0xbeb593][Math.floor(rand()*3)]:[0x9bb379,0x99b078,0xa3b980,0x95ad73][Math.floor(rand()*4)]));}tiles.receiveShadow=true;scene.add(tiles);
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2,x=Math.sin(a)*16.8,z=Math.cos(a)*16.8;voxel(island,x,.45,z,1.5,.7,1.5,0xb7b18d);if(i%4===0){voxel(island,x,1.25,z,.9,1,.9,0xc8bd94);voxel(island,x,1.8,z,1.2,.22,1.2,0xe0cda0);}}
 // Terraced coliseum with animals in the stands and entrance gaps.
 for(let i=0;i<60;i++){const a=i/60*Math.PI*2;if(Math.abs(Math.sin(a))<.18)continue;for(let row=0;row<2;row++){const radius=18+row*.9,x=Math.sin(a)*radius,z=Math.cos(a)*radius;voxel(island,x,.6+row*.5,z,1.45,.6,1.45, row?0xb5a784:0xcabd95);if(i%2===0){const c=[0xb88b64,0xe1daca,0xc98d61,0x8f9c75][i%4];voxel(island,x,1.2+row*.5,z,.48,.5,.55,c);voxel(island,x,1.58+row*.5,z+.1,.4,.32,.4,c);}}}
 for(const x of [-17,17]){voxel(island,x,3,0,1.5,5.8,1.5,0xbdb393);voxel(island,x,6.1,0,2,.4,2,0xddcea3);voxel(island,x,4.6,.9,1.1,2,.12,0x57765d);voxel(island,x,4.6,1, .45,.45,.1,0xe7c77f);}
 // Podium and golden animal statue outside the north gate.
 voxel(island,0,.65,-18,3,1,2,0xb4a584);
 for(let i=0;i<10;i++){const a=rand()*Math.PI*2,r=24+rand()*4;const x=Math.sin(a)*r,z=Math.cos(a)*r;voxel(island,x,-1,z,.6,3,.6,0x796747);voxel(island,x,1,z,3.1,2.3,3.1,0x557758);voxel(island,x,2.4,z,2,1.2,2,0x71915e);}
 // Correct statue plinth + blocky capybara silhouette.
 voxel(island,0,1,-18,3.3,.25,2.5,0xd6c498);voxel(island,0,1.65,-18,1.3,.9,1.5,0xc9a361);voxel(island,0,2.25,-17.45,1.1,.7,.85,0xe3c17c);voxel(island,-.4,2.7,-17.5,.3,.3,.3,0xe3c17c);voxel(island,.4,2.7,-17.5,.3,.3,.3,0xe3c17c);
 bake(island,'environment');
 const actors=new Map(),effects=new Map(),labels=new Map(),seen=new Set();let state=null,ownId=null,preview='knight',selection=true,aim=null,follow=false;
 const target=new T.Vector3(0,0,0),cameraKeys=new Set();let azimuth=.6,elevation=.83,distance=43,drag=null,pointer=null,edge=false,markerTime=-1,interaction='command';
 const ringGeo=new T.RingGeometry(.85,1,40);
 function ring(parent,color,radius=1){const m=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color,transparent:true,opacity:.75,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.scale.setScalar(radius);parent.add(m);return m;}
 const moveMarker=ring(scene,0xf5dda0,.5),aimRing=ring(scene,0xcce0ff,4);moveMarker.visible=false;aimRing.visible=false;
 const raycaster=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),-.2),v=new T.Vector3();
 function point(e){const r=canvas.getBoundingClientRect(),p=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(p,camera);if(!raycaster.ray.intersectPlane(plane,v))return null;return{x:v.x,z:v.z};}
 function pick(e){const p=point(e);if(!p)return{};const r=canvas.getBoundingClientRect();let hit=null,best=38;for(const u of state?.units||[]){if(!u.alive)continue;const screen=new T.Vector3(u.x,1.1,u.z).project(camera),d=Math.hypot((screen.x*.5+.5)*r.width-(e.clientX-r.left),(-screen.y*.5+.5)*r.height-(e.clientY-r.top));if(d<best){best=d;hit=u;}}return{point:p,unit:hit};}
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});if(e.button===1||e.button===0&&e.altKey){e.preventDefault();canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,pan:e.shiftKey};return;}if(e.button===0||e.button===2)onPoint({...pick(e),button:e.button});});
 canvas.addEventListener('pointermove',e=>{pointer={x:e.offsetX,y:e.offsetY};aim=point(e);if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.pan)pan(-dx*.035,dy*.035);else{azimuth-=dx*.008;elevation=T.MathUtils.clamp(elevation+dy*.006,.35,1.35);}drag.x=e.clientX;drag.y=e.clientY;follow=false;}});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>{pointer=null;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),12,76);},{passive:false});
 function pan(x,z){target.x=T.MathUtils.clamp(target.x+x*Math.cos(azimuth)+z*Math.sin(azimuth),-23,23);target.z=T.MathUtils.clamp(target.z-x*Math.sin(azimuth)+z*Math.cos(azimuth),-23,23);}
 window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();cameraKeys.add(e.key);follow=false;}});
 window.addEventListener('keyup',e=>cameraKeys.delete(e.key));window.addEventListener('blur',()=>{cameraKeys.clear();drag=null;});
 const clips={walk:Array.from({length:8},(_,i)=>({y:[0,.1,.18,.1,0,.1,.18,.1][i],leg:Math.sin(i*Math.PI/2)*.5,tilt:Math.sin(i*Math.PI/2)*.055})),attack:[{y:0,tilt:-.16,push:-.1},{y:.08,tilt:-.22,push:-.15},{y:.02,tilt:.25,push:.25},{y:0,tilt:.12,push:.12},{y:0,tilt:0,push:0}],cast:[{y:0,tilt:-.1},{y:.2,tilt:-.16},{y:.35,tilt:0},{y:.22,tilt:.1},{y:0,tilt:0}]};
 function makeActor(u){const root=new T.Group(),body=new T.Group();root.add(body);const kind=u.hero||u.kind,rabbit=kind==='mage',fox=kind==='ranger',chicken=kind==='goblin',boar=kind==='brute',bear=kind==='champion',wolf=kind==='wolf';let fur=rabbit?0xe6dfd2:fox?0xd78f55:chicken?0xf4e6c5:boar?0x8e7464:bear?0x967258:wolf?0x90a9a0:0xb8936a;const muzzle=rabbit?0xf5eee2:fox?0xf0dfbd:boar?0xb49785:0xc9ac83;
  voxel(body,0,.92,0,.95,.95,1.5,fur);voxel(body,0,1.5,.62,1.05,.9,.95,fur);voxel(body,0,1.3,1.16,.8,.46,.45,muzzle);
  if(rabbit){for(const x of [-.32,.32]){voxel(body,x,2.3,.6,.3,1,.3,fur);voxel(body,x,2.33,.77,.12,.65,.06,0xd4b1b1);}voxel(body,0,.85,-.85,.45,.45,.45,0xf7f0df);voxel(body,0,.95,0,1.02,.2,1.6,0x8673ac);voxel(body,-.67,.9,.25,.12,1.9,.12,0x785f46);voxel(body,-.67,1.95,.25,.4,.4,.4,0xbfc1ed);}
  else if(fox||wolf){for(const x of [-.36,.36]){voxel(body,x,2.08,.52,.32,.5,.38,fur);voxel(body,x,2.1,.72,.15,.25,.06,0x6f5748);}voxel(body,0,1,-1.1,.45,.45,1,fur);voxel(body,0,1,-1.6,.47,.47,.4,wolf?0xcad7c3:0xf4e4c4);if(fox){voxel(body,0,1.12,.25,1.06,.2,1.1,0x5e855e);voxel(body,.58,1.05,.3,.12,1,.6,0xb89b6e);}}
  else if(chicken){voxel(body,0,2.08,.65,.23,.35,.5,0xc76b53);voxel(body,0,1.42,1.39,.4,.25,.3,0xe4b858);voxel(body,0,.85,-.9,.6,.65,.4,0xdfd4b5);voxel(body,-.57,1,0,.2,.6,.8,0xe1d5b6);voxel(body,.57,1,0,.2,.6,.8,0xe1d5b6);}
  else{for(const x of [-.37,.37])voxel(body,x,2.03,.52,.3,.32,.3,fur);if(boar){voxel(body,-.43,1.35,1.3,.12,.4,.15,0xe6d8b3);voxel(body,.43,1.35,1.3,.12,.4,.15,0xe6d8b3);voxel(body,0,1.55,-.25,.25,.65,1.2,0x687657);}if(u.hero==='knight'||bear){voxel(body,0,1.05,0,1.02,.25,1.65,bear?0xa47b4e:0xd6b977);voxel(body,-.67,1,.45,.22,.85,.85,0x637f7a);voxel(body,-.8,1,.45,.08,.28,.3,0xe0c17c);if(bear){voxel(body,0,2.14,.57,.85,.2,.7,0xd2af65);for(const x of [-.3,0,.3])voxel(body,x,2.36,.57,.15,.35,.2,0xe6c781);}}}
  for(const x of [-.4,.4])voxel(body,x,1.67,1.11,.13,.17,.055,0x293d35);if(!chicken)voxel(body,0,1.41,1.4,.22,.14,.06,0x655345);
  bake(body,`body-${kind}`);const legs=[];for(const x of [-.32,.32])for(const z of (chicken?[.15]:[-.48,.48]))legs.push(voxel(root,x,.3,z,.27,.5,.3,chicken?0xd3a354:fur));
  const select=ring(root,u.team===1?0xe7e8a9:0xd69c7c,1.1);select.position.y=.17;
  const auras=['vampiric','endurance','thorns'].map((key,i)=>{const mesh=ring(root,[0xcf92b4,0xe2c37f,0x9ec478][i],1.2+i*.16);mesh.position.y=.19+i*.01;mesh.visible=false;return{key,mesh};});
  const hp=new T.Group(),bg=voxel(hp,0,0,0,1.3,.1,.055,0x394e40),fill=voxel(hp,0,.01,.04,1.25,.075,.03,u.team===1?0xbddd8b:0xd6947a);hp.position.y=3.1;root.add(hp);
  scene.add(root);const a={root,body,legs,select,auras,hp,fill,kind,fxUntil:0};actors.set(u.id,a);return a;
 }
 function removeActor(a){scene.remove(a.root);a.root.traverse(o=>{if(o.isMesh){if(o.geometry!==ringGeo&&!Array.from(geometryCache.values()).includes(o.geometry))o.geometry.dispose();if(o.material!==material)o.material.dispose();}});}
 function floating(e){if(labels.size>=32){const oldest=labels.keys().next().value;labels.get(oldest).el.remove();labels.delete(oldest);}const healing=e.type==='lifesteal'||e.type==='heal';const el=document.createElement('span');el.className=`combat-text ${e.critical?'critical':healing?'healing':e.target===state?.players[ownId]?'incoming':e.magic?'magic':'physical'}`;el.textContent=e.critical?`${e.amount}! CRÍTICO`:healing?`+${e.amount} VIDA`:`−${e.amount}`;overlay.append(el);labels.set(e.id,{el,e});}
 function createEffect(e){const group=new T.Group(),owned=[];const color=e.type==='critical'?0xffc26e:e.type==='heal'||e.type==='lifesteal'?0xbde69a:e.type==='thorns'?0xa4ca7e:e.type==='blizzard'?0xc0e7f2:e.type==='bolt'||e.type==='cast'?0xc7c7ff:0xf1d29b;
  const fxmat=new T.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false});owned.push(fxmat);
  if(['arrow','bolt'].includes(e.type)){if(e.type==='bolt'){const points=[];for(let i=0;i<=7;i++){const t=i/7;points.push(new T.Vector3(e.x+(e.tx-e.x)*t+(i%2?.22:-.22),1.5,e.z+(e.tz-e.z)*t));}const geo=new T.BufferGeometry().setFromPoints(points),m=new T.Line(geo,new T.LineBasicMaterial({color:0xc9dfff,transparent:true}));group.add(m);owned.push(geo,m.material);}else{const m=new T.Mesh(base,fxmat);m.scale.set(.12,.12,.8);group.add(m);}}
  else if(e.type==='slash'){const m=new T.Mesh(new T.TorusGeometry(.8,.065,3,12,Math.PI*1.4),fxmat);m.rotation.x=.6;group.add(m);owned.push(m.geometry);}
  else if(e.type==='critical'){for(let i=0;i<8;i++){const m=new T.Mesh(base,fxmat);m.scale.set(.12,.12,.5);m.userData.angle=i*Math.PI/4;group.add(m);}}
  else if(e.type==='blizzard'){const r=ring(group,0xc3e3fa,4);r.position.y=.08;owned.push(r.material);for(let i=0;i<20;i++){const m=new T.Mesh(base,fxmat);m.scale.set(.15,.5,.15);m.userData={x:Math.sin(i*2.4)*(1+i%3),z:Math.cos(i*2.4)*(1+i%3),offset:i*.17};group.add(m);}}
  else{const r=ring(group,color,e.type==='stomp'?1:1.2);owned.push(r.material);for(let i=0;i<8;i++){const m=new T.Mesh(base,fxmat);m.scale.set(.13,.3,.13);m.userData.angle=i*Math.PI/4;group.add(m);}}
  scene.add(group);const entry={group,e,owned,mat:fxmat};effects.set(e.id,entry);return entry;
 }
 let lastTime=0;
 function update(next,id,dt,now){state=next;ownId=id;const time=state?.time??now/1000;const own=state?.units.find(u=>u.id===state.players[id]);
  if(time<lastTime){seen.clear();for(const a of actors.values())removeActor(a);actors.clear();for(const l of labels.values())l.el.remove();labels.clear();for(const e of effects.values()){scene.remove(e.group);e.owned.forEach(o=>o.dispose());}effects.clear();}lastTime=time;
  const units=state?.units||[{id:-1,hero:preview,team:1,x:0,z:0,hp:1,maxHp:1,alive:true}];
  for(const u of units){let a=actors.get(u.id);if(a&&a.kind!==(u.hero||u.kind)){removeActor(a);actors.delete(u.id);a=null;}if(!a)a=makeActor(u);a.root.visible=u.alive||time-(u.died??-10)<.65;a.root.position.lerp(new T.Vector3(u.x,.18,u.z),Math.min(1,dt*22));a.root.rotation.y=u.facing||0;
   const pose=Math.floor(time*8)%8,attack=time-(u.attackAt??-10),cast=time-(u.castAt??-10);let f=clips.walk[pose];a.body.position.set(0,0,0);a.body.rotation.set(0,0,0);a.legs.forEach((leg,i)=>leg.rotation.x=u.moving?f.leg*(i%2?1:-1):0);
   if(!u.alive){a.body.rotation.z=Math.min(1.5,(time-u.died)*4);a.body.position.y=-(time-u.died)*.9;}
   else if(cast<.625){f=clips.cast[Math.min(4,Math.floor(cast*8))];a.body.position.y=f.y;a.body.rotation.x=f.tilt;}
   else if(attack<.625){f=clips.attack[Math.min(4,Math.floor(attack*8))];a.body.position.z=f.push;a.body.position.y=f.y;a.body.rotation.x=f.tilt;}
   else if(u.moving){a.body.position.y=f.y;a.body.rotation.z=f.tilt;}
   if(time-(u.hitAt??-10)<.25){a.body.position.x+=Math.floor(time*24)%2?.06:-.06;a.body.scale.set(1.07,.91,1.07);}else a.body.scale.setScalar(1);
   const scale=u.kind==='champion'?1.65:u.kind==='brute'?1.25:u.kind==='goblin'?.8:(u.avatar||0)>time?1.35:1;a.root.scale.setScalar(scale);a.select.visible=u.alive&&(u.owner===id?selection:true);a.select.material.opacity=u.owner===id?.9:.28;
   a.hp.quaternion.copy(camera.quaternion);a.hp.quaternion.premultiply(a.root.quaternion.clone().invert());a.fill.scale.x=1.25*Math.max(0,u.hp/u.maxHp);a.fill.position.x=-(1-u.hp/u.maxHp)*.625;
   a.auras.forEach(({key,mesh},i)=>{mesh.visible=!!u.skills?.includes(key)&&u.alive;mesh.material.opacity=.38+Math.sin(time*3+i)*.12;mesh.scale.setScalar(1.2+i*.16+Math.sin(time*3+i)*.04);});
  }
  for(const [id,a]of actors)if(!units.some(u=>u.id===id)){removeActor(a);actors.delete(id);}
  for(const e of state?.effects||[]){if(!seen.has(e.id)){seen.add(e.id);if(e.type==='damage'||e.type==='lifesteal'||e.type==='heal'&&e.amount>0)floating(e);if(e.type!=='damage')createEffect(e);}}
  if(seen.size>5000){const active=new Set((state?.effects||[]).map(e=>e.id));for(const id of seen)if(!active.has(id))seen.delete(id);}
  for(const [id,entry]of effects){const {group,e,mat}=entry,age=time-e.time,duration=e.type==='blizzard'?3.9:e.type==='cast'?.5:e.type==='critical'?.7:.8;if(age>duration){scene.remove(group);entry.owned.forEach(o=>o.dispose());effects.delete(id);continue;}
   group.position.set(e.x,.3,e.z);mat.opacity=Math.max(0,1-age/duration);
   if(e.type==='arrow'){const t=Math.min(1,age*5);group.position.set(e.x+(e.tx-e.x)*t,1.3+Math.sin(t*Math.PI)*.45,e.z+(e.tz-e.z)*t);group.lookAt(e.tx,1.3,e.tz);group.visible=age<.22;}
   else if(e.type==='bolt'){group.position.set(0,0,0);group.visible=age<.35&&Math.floor(age*24)%2===0;}
   else if(e.type==='slash'){group.position.set(e.tx,1.3,e.tz);group.rotation.y=age*5;group.scale.setScalar(.6+age);}
   else if(e.type==='blizzard'){for(const m of group.children.slice(1)){const phase=(age*2+m.userData.offset)%1;m.position.set(m.userData.x,4*(1-phase),m.userData.z);m.rotation.z=age*2;}}
   else if(e.type==='critical'){group.position.y=1.5;for(const m of group.children){const a=m.userData.angle;m.position.set(Math.sin(a)*age*4,Math.cos(a)*age*4,0);m.rotation.z=-a;}}
   else{const size=e.type==='stomp'?Math.min(4,age*10):1+age;group.scale.setScalar(size);for(const m of group.children.slice(1)){const a=m.userData.angle;m.position.set(Math.sin(a)*1.2,age*2,Math.cos(a)*1.2);}}
  }
  for(const [id,l]of labels){const age=time-l.e.time;if(age>1.05){l.el.remove();labels.delete(id);continue;}const p=new T.Vector3(l.e.x,2.7+age*2,l.e.z).project(camera);l.el.style.left=`${(p.x*.5+.5)*container.clientWidth+(l.e.id%5-2)*14}px`;l.el.style.top=`${(-p.y*.5+.5)*container.clientHeight-(l.e.id%3)*7}px`;l.el.style.opacity=Math.min(1,(1.05-age)*3);}
  let dx=(cameraKeys.has('ArrowRight')?1:0)-(cameraKeys.has('ArrowLeft')?1:0),dz=(cameraKeys.has('ArrowDown')?1:0)-(cameraKeys.has('ArrowUp')?1:0);if(edge&&pointer&&!drag){if(pointer.x<12)dx--;if(pointer.x>container.clientWidth-12)dx++;if(pointer.y<12)dz--;if(pointer.y>container.clientHeight-12)dz++;}if(dx||dz){pan(dx*dt*distance*.5,dz*dt*distance*.5);follow=false;}
  if(follow&&own){target.x=T.MathUtils.lerp(target.x,own.x,dt*8);target.z=T.MathUtils.lerp(target.z,own.z,dt*8);}
  camera.position.set(target.x+Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,target.z+Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);
  moveMarker.visible=now<markerTime;aimRing.visible=interaction==='ground'&&!!aim;if(aim)aimRing.position.set(aim.x,.25,aim.z);canvas.style.cursor=interaction==='command'?'default':'crosshair';renderer.render(scene,camera);
 }
 new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();}).observe(container);
 return{update,canvas,setPreview(value){preview=value;},setSelected(value){selection=value;},setInteraction(value){interaction=value;},mark(p){moveMarker.position.set(p.x,.25,p.z);markerTime=performance.now()+750;},center(){const p=state?.units.find(u=>u.id===state.players[ownId]);if(p)target.set(p.x,0,p.z);},reset(){target.set(0,0,0);azimuth=.6;elevation=.83;distance=43;follow=false;},zoom(delta){distance=T.MathUtils.clamp(distance+delta,12,76);},orbit(delta){azimuth+=delta;},toggleFollow(){follow=!follow;return follow;},toggleEdge(){edge=!edge;return edge;},stats(){return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
}
