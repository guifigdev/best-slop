import {insideBossPattern} from '../shared/boss-patterns.js';

// Terrain-conforming danger marks are sparse enough to keep combat readable.
export function roWarningMarks(pattern,{spacing=3,limit=144,visible=()=>true}={}){
 const radius=Math.min(48,Math.max(pattern.radius||0,(pattern.length||0)/2+(pattern.width||0)/2,3)),points=[];
 for(let z=Math.ceil((pattern.z-radius)/spacing)*spacing;z<=pattern.z+radius;z+=spacing)for(let x=Math.ceil((pattern.x-radius)/spacing)*spacing;x<=pattern.x+radius;x+=spacing){const p={x,z};if(insideBossPattern(p,pattern)&&visible(p))points.push(p);}
 if(points.length<=limit)return points;return Array.from({length:limit},(_,i)=>points[Math.floor(i*points.length/limit)]);
}
