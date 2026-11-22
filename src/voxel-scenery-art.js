import {stoneRockParts} from './stone-landmark-art.js';
// Rounded, fractured stone masses shared by Phase Killer and Bloody Tournament.
// All pieces remain seated within the original authoritative AABB.
export function rockAssembly({id='stone',x=0,y=0,z=0,w=2,d=2,h=3,biome='cavern',wall=false}={}){return stoneRockParts({id,w,d,h,biome,wall}).map(([px,py,pz,...part])=>[x+px,y+py,z+pz,...part]);}
