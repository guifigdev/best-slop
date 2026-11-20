// Modular stone clusters. Geometry stays inside the collider's footprint.
const palettes={cavern:['#655f53','#827866','#a3977e','#454b42','#697552'],crypt:['#656b70','#858a89','#a3a492','#464e50','#626e53'],forest:['#586658','#7d8871','#a0a78a','#3c4941','#54734b'],frost:['#789ba8','#a6c7ce','#d6e6df','#567f91','#8eb7c5'],forge:['#453e3b','#635049','#887061','#302e30','#d77b35'],void:['#575266','#797084','#a294a2','#383643','#76658c']};
function hash(s){let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export function rockAssembly({id='stone',x=0,y=0,z=0,w=2,d=2,h=3,biome='cavern',wall=false}={}){
 let seed=hash(id),rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},p=palettes[biome]||palettes.cavern,parts=[];
 const add=(ox,oy,oz,a,b,c,color)=>{a=Math.min(w,a);c=Math.min(d,c);ox=Math.max(-(w-a)/2,Math.min((w-a)/2,ox));oz=Math.max(-(d-c)/2,Math.min((d-c)/2,oz));parts.push([x+ox,y+oy,z+oz,a,b,c,color]);};
 const layers=wall?5:3+Math.floor(rand()*3);
 for(let l=0;l<layers;l++){
  const t=l/layers,lh=h/layers,shrink=wall?1-.13*t:1-.57*t,ww=w*shrink,dd=d*shrink;
  const ox=(rand()-.5)*w*.13*(1-t),oz=(rand()-.5)*d*.13*(1-t);
  add(ox,lh*(l+.5),oz,ww,lh*1.05,dd,p[l%3]);
  // Offset shelves, recessed seams and smaller fractured shoulders.
  const side=rand()<.5?-1:1,chipW=ww*(.2+rand()*.23),chipD=dd*(.24+rand()*.22);
  add(ox+side*(ww-chipW)*.48,lh*(l+.63),oz+(rand()-.5)*(dd-chipD),chipW,lh*.74,chipD,p[(l+1)%4]);
 }
 const chips=wall?3:5;
 for(let i=0;i<chips;i++){
  const cw=w*(.08+rand()*.13),cd=d*(.1+rand()*.15),ch=h*(.025+rand()*.07);
  add((rand()-.5)*(w-cw),ch*.5,(rand()-.5)*(d-cd),cw,ch,cd,p[i%4]);
 }
 if(biome==='forest'||biome==='cavern')add((rand()-.5)*w*.35,h*.22,-d*.1,w*.43,h*.035,d*.36,p[4]);
 if(biome==='frost')add(-w*.2,h*.38,d*.1,w*.16,h*.52,d*.18,p[2]);
 if(biome==='forge')add(w*.1,h*.21,-d*.3,w*.36,h*.035,d*.07,p[4]);
 return parts;
}
