// World-space branching lightning, built from solid oriented voxel segments.
// The wider additive copy supplies a luminous halo without a billboard image.
export function roLightningVolume({x=0,z=0,base=0,height=8,seed=1,time=0,opacity=1,scale=1}={}){
 const cubes=[],glows=[],phase=Math.floor(time*18),noise=n=>{const v=Math.sin((n+seed*17.31+phase*.29)*91.17)*43758.5453;return v-Math.floor(v);},nodes=[];
 const segment=(a,b,width,alpha=1)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dy,dz),direction=[dx/length,dy/length,dz/length],center=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];if(!length)return;cubes.push([...center,width,length+width*.4,width,0xfff8d1,opacity*alpha,direction]);glows.push([...center,width*4.5,length+width,width*4.5,0x719fff,opacity*alpha*.22,direction]);};
 for(let i=0;i<=12;i++){const t=i/12;nodes.push([x+(i===0?0:(noise(i)-.5)*.85*scale),base+t*height,z+(i===0?0:(noise(i+31)-.5)*.65*scale)]);if(i)segment(nodes[i-1],nodes[i],(.065+noise(i+9)*.045)*scale);}
 for(let branch=0;branch<4;branch++){let from=nodes[3+branch*2];const a=branch*2.39996+seed*.1;for(let j=0;j<3;j++){const to=[from[0]+Math.sin(a+j*.45)*(.35+noise(j+branch*3)*.45)*scale,from[1]-(.25+noise(branch+j)*.5)*scale,from[2]+Math.cos(a-j*.3)*(.30+noise(j+41)*.35)*scale];segment(from,to,.043*scale,.78-j*.15);from=to;}}
 for(let i=0;i<12;i++){const a=i*2.39996+time*2,r=(.2+noise(i+70)*.7)*scale,s=.035*scale;cubes.push([x+Math.sin(a)*r,base+.1+noise(i+90)*.5*scale,z+Math.cos(a)*r,s,.12*scale,s,i%3?0xc3ddff:0xffe49b,opacity*.85]);}
 return{cubes,glows};
}
