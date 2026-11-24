import * as T from 'three';
import {unitFootprintRadius} from '../shared/unit-footprint.js';
import {roMountedKind} from '../shared/ro-mounts.js';
// A chamfered box with planar triangular facets, rather than a spike at the feet.
export function createFrozenBlockGeometry(){
 const rim=[[-.36,-.5],[.36,-.5],[.5,-.36],[.5,.36],[.36,.5],[-.36,.5],[-.5,.36],[-.5,-.36]],rings=[[0,.76],[.12,1],[.86,1],[1,.78]],positions=[],colors=[];
 const point=(r,i)=>[rim[i][0]*rings[r][1],rings[r][0],rim[i][1]*rings[r][1]],triangle=(a,b,c,tint)=>{for(const p of [a,b,c]){positions.push(...p);colors.push(tint,tint,1);}};
 for(let r=0;r<3;r++)for(let i=0;i<8;i++){const next=(i+1)%8,a=point(r,i),b=point(r,next),c=point(r+1,next),d=point(r+1,i),shade=r===1?(i%2?.91:.76):.98;triangle(a,c,b,shade);triangle(a,d,c,shade);}
 for(let i=0;i<8;i++){triangle([0,0,0],point(0,i),point(0,(i+1)%8),.82);triangle([0,1,0],point(3,(i+1)%8),point(3,i),.99);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function frozenTimeRemaining(unit,state,time){if(!unit||unit.alive===false||!Number.isFinite(unit.x)||!Number.isFinite(unit.z))return 0;return Math.max(0,(unit.wlFrozenUntil||0)-time,(unit.frozenUntil||0)-time,(unit.roFrozenUntil||0)-(state?.bonk?.elapsed??time),(unit.castleFrozenUntil||0)-(state?.castleFight?.elapsed??time));}
export function frozenBlockSize(unit){const size=Number.isFinite(unit.size)?Math.max(.4,Math.min(4,unit.size)):unit.kind==='champion'?1.65:1,r=unitFootprintRadius(unit),mounted=!!roMountedKind(unit);return {width:(r+.22)*2+(mounted?.25:0),height:(unit.bonkHero?1.95:2.8)*size+(mounted?.8:0),depth:(r+.22)*2+(mounted?.4:0)};}
