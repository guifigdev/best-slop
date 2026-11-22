import * as T from 'three';

export const RO_SLAM_BUDGET=Object.freeze({impacts:8,parts:80,instances:640,drawCalls:1});
export function roEarthquakeParts(event,time,heightAt=()=>0){
 const age=time-event.time;if(age<0||age>=1.05)return[];const parts=[],r=event.radius||6,fade=Math.min(1,(1.05-age)*4);
 for(let i=0;i<32;i++){
  const a=i*2.39996,ring=i%3,delay=ring*.11,t=Math.max(0,age-delay),rad=r*(.25+ring*.25),x=event.x+Math.sin(a)*rad,z=event.z+Math.cos(a)*rad;
  if(age<delay)continue;const bounce=Math.max(0,Math.sin(Math.min(1,t/.6)*Math.PI))*(.35+ring*.19),size=(.18+(i%3)*.045)*fade;
  parts.push([x,heightAt(x,z)+.08+bounce,z,size,size*.6,size*1.5,i%2?0xb49b79:0x746450,a+t*2]);
  // Radial broken seams, thicker near the epicentre, never a weapon ribbon.
  parts.push([x,heightAt(x,z)+.025+Math.abs(Math.sin(t*55+i))*.025*fade,z,.07*fade,.035,r*.19*fade,0x514936,a]);
 }
 return parts;
}
// Deterministic ballistic stones and a local trembling crust. No camera motion,
// damage or physics bodies; all positions remain anchored to the impact point.
export function roSlamParts(event,time,heightAt=()=>0){
 const age=time-event.time,duration=event.duration||.8;if(age<0||age>=duration)return[];
 const parts=[],r=event.radius||2.6,p=age/duration,fade=Math.max(0,1-p),seed=Number(event.id)||0;
 for(let i=0;i<24;i++){
  const a=i*2.399963+seed*.13,spread=.18+((i*17)%23)/23*.8,rad=r*spread*(.55+p*.65),x=event.x+Math.sin(a)*rad,z=event.z+Math.cos(a)*rad,
   flight=Math.max(0,(2.5+(i%5)*.38)*age-5.5*age*age),size=(.09+(i%4)*.035)*Math.min(1,fade*4);
  parts.push([x,heightAt(x,z)+.09+flight,z,size,size*.7,size*1.3,[0x7e6a54,0xb39a71,0x615744,0xd1bd91][i%4],a+age*(i%2?4:-3)]);
 }
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,rad=r*(.65+Math.sin(i*7)*.14),x=event.x+Math.sin(a)*rad,z=event.z+Math.cos(a)*rad,
   tremor=Math.sin(age*63+i*2)*.055*fade;
  parts.push([x,heightAt(x,z)+.035+Math.abs(tremor),z,.055*fade,.035,r*.29*fade,0x78684f,a]);
 }
 return parts;
}
export function createRoSlamArt({scene}){
 const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshLambertMaterial({depthWrite:true}),mesh=new T.InstancedMesh(geometry,material,RO_SLAM_BUDGET.instances),dummy=new T.Object3D(),color=new T.Color();mesh.name='axe-impact-stones';mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;scene.add(mesh);
 return{update(state,time,heightAt=()=>0){let n=0;for(const e of (state?.effects||[]).filter(e=>['roAxeImpact','roEarthquake'].includes(e.type)&&time-e.time<(e.type==='roEarthquake'?1.05:.8)).slice(-8))for(const [x,y,z,w,h,d,c,a]of (e.type==='roEarthquake'?roEarthquakeParts:roSlamParts)(e,time,heightAt)){dummy.position.set(x,y,z);dummy.rotation.set(a*.3,a,a*.6);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(n,dummy.matrix);mesh.setColorAt(n++,color.setHex(c));}mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}},stats:()=>({instances:mesh.count,drawCalls:mesh.count?1:0})};
}
