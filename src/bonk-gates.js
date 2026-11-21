const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};

export function bonkWorldGates(state,map){
 const b=state?.bonk,source=Array.isArray(b?.exitGates)?b.exitGates:Array.isArray(map?.route?.gates)?map.route.gates:b?.exitGate?[b.exitGate]:[];
 return source.filter(g=>g&&Number.isFinite(g.x)&&Number.isFinite(g.z)).map(g=>{let dx=g.direction?.x,dz=g.direction?.z;if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)<.5){dx=Math.abs(g.x)>Math.abs(g.z)?Math.sign(g.x):0;dz=dx?0:Math.sign(g.z)||-1;}const length=Math.hypot(dx,dz);return{...g,direction:{x:dx/length,z:dz/length},width:g.width||g.w||18};});
}

export function bonkGateFrame(gate){const {x:dx,z:dz}=gate.direction,right={x:-dz,z:dx};return{right,forward:gate.direction,angle:Math.atan2(-right.z,right.x),point(u,v){return{x:gate.x+right.x*u+dx*v,z:gate.z+right.z*u+dz*v};}};}

// Each edge looks into the adjacent region, irrespective of compass direction.
// Broadening outside the gate avoids drawing narrow rectangular color strips.
export function bonkGatePreview(gates,x,z){
 return gates.map(gate=>{const f=bonkGateFrame(gate),dx=x-gate.x,dz=z-gate.z,along=dx*f.forward.x+dz*f.forward.z,side=Math.abs(dx*f.right.x+dz*f.right.z),weight=smooth((along+18)/100)*(1-smooth((side-32)/(75+Math.max(0,along)*1.2)));return{gate,weight};}).filter(p=>p.weight>.0001).sort((a,b)=>b.weight-a.weight);
}

// Parts are world-positioned; Y remains a local height above the shared terrain.
export function bonkGateParts(gate,p,{corridor=true}={}){
 const parts=[],f=bonkGateFrame(gate),width=gate.width||18,c=gate.open?0x97d9b1:0xd5ac72,add=(u,y,v,w,h,d,color=p.stone,a=0)=>{const q=f.point(u,v);parts.push([q.x,y,q.z,w,h,d,color,f.angle+a]);};
 if(corridor)for(const side of [-1,1])for(let j=0;j<8;j++)for(let tier=0;tier<3+j%3;tier++){const h=.7+j%3*.07;add(side*(width*.5+3+Math.sin(j*1.7+tier)*.12),.45+tier*1.1,-4+j*2.2,4.4-tier*.2,h+.5,2.3,j%3?p.stone:p.dark,j*.08);}
 for(const side of [-1,1]){const u=side*(width*.5+1.4);add(u,.3,0,2.5,.6,3,p.dark);for(let j=0;j<7;j++)add(u,.85+j*.8,0,1.6,.75,2,j%3?p.stone:p.dark);add(u,6.3,0,2.3,.5,2.5);add(u,6.8,0,.7,.65,.7,c);}
 for(let j=0;j<16;j++){const a=j*Math.PI/15,u=Math.cos(a)*width*.46,y=3.2+Math.sin(a)*4.35;add(u,y,0,width*.085,.55,1.1,j%4?p.stone:p.dark);if(j%3===0)add(u,y+.04,.6,.14,.21,.06,c);}
 add(0,.03,0,width,.08,4);if(!gate.open){for(let j=0;j<11;j++)add(-width*.46+j*width*.092,2.4,0,.18,4.8,.22,p.dark);for(const y of [1.2,3.2,4.8])add(0,y,0,width,.18,.22,p.dark);}else for(let j=0;j<7;j++)add((j-3)*1.4,.1,0,.7,.08,1.7,c);
 return parts;
}
