import * as T from 'three';
import {RO_MONSTER_BODY_HULLS} from '../shared/ro-monster-body-hulls.js';
import {RO_MONSTER_BODY_RADII} from '../shared/ro-monster-footprints.js';

export function roBodySelectionGeometry(unit){
 const hull=unit.bonkEnemy&&RO_MONSTER_BODY_HULLS[unit.ragnarokVisual],radius=RO_MONSTER_BODY_RADII[unit.ragnarokVisual];if(!hull||!radius)return null;
 const positions=[];for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],inner=p=>{const r=Math.hypot(...p)||1;return[p[0]*(1-.065/r)/radius,-p[1]*(1-.065/r)/radius,0];},outer=p=>[p[0]/radius,-p[1]/radius,0];for(const p of [outer(a),inner(a),outer(b),outer(b),inner(a),inner(b)])positions.push(...p);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
