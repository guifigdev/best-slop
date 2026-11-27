import * as T from 'three';
export const RO_CART_ART_BUDGET=Object.freeze({casts:8,instances:768,drawCalls:1,planes:0});
export function roCartRevolutionParts(event,time,heightAt=()=>0){
 const age=time-event.time;if(event.skillKey!=='cartrevolution'||event.type!=='roAttack'||age<0||age>=.70)return[];
 const p=age/.70,turn=p*Math.PI*2,angle=(event.direction||0)+turn,radius=.95,fade=Math.min(1,p*12,(1-p)*8),x=event.x+Math.sin(angle)*radius,z=event.z+Math.cos(angle)*radius,heading=angle+Math.PI/2,c=Math.cos(heading),s=Math.sin(heading),base=heightAt(x,z),parts=[];
 const b=(xx,y,zz,w,h,d,color)=>parts.push([x+c*xx+s*zz,base+y,z-s*xx+c*zz,w*fade,h*fade,d*fade,color,heading]);
 // Raised wooden bed, iron rails, wheel axles and individually modelled planks.
 b(0,.43,0,1.02,.12,.76,0x61432d);for(let i=0;i<6;i++)b(-.42+i*.168,.50,0,.15,.07,.75,i%2?0xb38854:0x966b3f);
 for(const side of [-1,1]){b(side*.52,.74,0,.075,.48,.83,0x795435);for(let i=0;i<3;i++)b(side*.56,.58+i*.14,0,.045,.11,.83,0xb18b58);b(side*.57,.91,0,.08,.055,.90,0x6a8089);b(side*.37,.38,.61,.075,.08,.71,0x654b33);b(side*.37,.38,.96,.095,.10,.18,0x3c3027);}
 b(0,.74,-.39,1.10,.47,.07,0x9a7547);b(0,.72,.39,1.10,.38,.07,0x8a623e);
 b(0,.33,0,1.4,.08,.08,0x54646a);
 for(const side of [-1,1]){b(side*.68,.33,0,.10,.16,.16,0xc5a575);for(let i=0;i<12;i++){const a=i*Math.PI/6+turn*3,yy=.33+Math.sin(a)*.30,zz=Math.cos(a)*.30;b(side*.67,yy,zz,.11,.11,.11,0x3a3f3e);if(i%3===0)b(side*.67,.33+Math.sin(a)*.15,Math.cos(a)*.15,.075,.22,.075,0x9a7449);}}
 b(-.22,.69,-.07,.30,.28,.32,0xaaa080);b(.18,.65,.06,.35,.23,.38,0x808e93);b(.21,.81,.07,.18,.12,.16,0xbcc9c6);
 for(let i=0;i<12;i++){const a=angle-i*.11,xx=event.x+Math.sin(a)*1.05,zz=event.z+Math.cos(a)*1.05,size=.035*(1-i/16);parts.push([xx,heightAt(xx,zz)+.08+Math.sin(p*Math.PI+i)*.05,zz,size,size,size,0xb29c75,0]);}
 return parts;
}
export function createRoCartRevolutionArt({scene}){
 const B=RO_CART_ART_BUDGET,g=new T.BoxGeometry(1,1,1),m=new T.MeshLambertMaterial(),mesh=new T.InstancedMesh(g,m,B.instances),dummy=new T.Object3D(),color=new T.Color();mesh.name='ro-solid-cart-revolution';mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);let disposed=false;
 return{update(state,time,heightAt){if(disposed)return;let n=0;if(state?.options?.mode==='bonk')for(const event of (state.effects||[]).filter(e=>e.skillKey==='cartrevolution'&&e.type==='roAttack').slice(-B.casts))for(const [x,y,z,w,h,d,c,yaw]of roCartRevolutionParts(event,time,heightAt)){if(n>=B.instances)break;dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,color.setHex(c));}mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}},legacyState(state){return state?.options?.mode==='bonk'?{...state,effects:(state.effects||[]).filter(e=>e.skillKey!=='cartrevolution'||['damage','miss','lifesteal'].includes(e.type))}:state;},reset(){mesh.count=0;},stats:()=>({instances:mesh.count,drawCalls:mesh.count?1:0,planes:0}),dispose(){if(disposed)return;disposed=true;mesh.removeFromParent();mesh.dispose();g.dispose();m.dispose();}};
}
