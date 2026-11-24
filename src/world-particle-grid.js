// The viewer selects which world cells are resident. It never translates them.
// Modulo slots retain the same instance index for every overlapping cell when
// a neighboring column/row enters the bounded window.
export function worldParticleGrid(point,{cellSize=10,columns=4,rows=3}={}){
 const cx=Math.floor((Number.isFinite(point?.x)?point.x:0)/cellSize),cz=Math.floor((Number.isFinite(point?.z)?point.z:0)/cellSize),cells=new Array(columns*rows),mod=(n,d)=>((n%d)+d)%d;
 for(let z=cz-Math.floor(rows/2);z<cz-Math.floor(rows/2)+rows;z++)for(let x=cx-Math.floor(columns/2);x<cx-Math.floor(columns/2)+columns;x++){const slot=mod(x,columns)+mod(z,rows)*columns;cells[slot]={x,z,slot};}
 return{cx,cz,cellSize,columns,rows,cells};
}
export function worldParticleSeed(seed,x,z,index=0){return(Math.imul(seed|0,1664525)^Math.imul(x|0,73856093)^Math.imul(z|0,19349663)^Math.imul(index+1,83492791))>>>0;}
