import {WAR_BOUNDS} from '../shared/arena-size.js';
import * as T from 'three';
import {TEAM_COLORS as teamColors,teamColor} from '../shared/teams.js';
export function createBattlefield(scene){const group=new T.Group(),base=new T.BoxGeometry(),material=new T.MeshLambertMaterial({color:0xffffff}),objects=new T.Group(),cells=new T.Group();scene.add(group,objects,cells);
 const floor=new T.Mesh(base,material);floor.scale.set(WAR_BOUNDS*2+2,.6,WAR_BOUNDS*2+2);floor.position.y=-.24;floor.receiveShadow=true;floor.material=material.clone();floor.material.color.setHex(0x899c78);group.add(floor);
 const grid=new T.GridHelper(WAR_BOUNDS*2,WAR_BOUNDS,0xaab595,0x94a681);grid.position.y=.08;group.add(grid);for(let i=0;i<4;i++){const wall=new T.Mesh(base,material);wall.material=material.clone();wall.material.color.setHex(0xc8b894);wall.position.set(i<2?(i?WAR_BOUNDS+.5:-WAR_BOUNDS-.5):0,.3,i>=2?(i===2?WAR_BOUNDS+.5:-WAR_BOUNDS-.5):0);wall.scale.set(i<2?.5:WAR_BOUNDS*2+1,.8,i<2?WAR_BOUNDS*2+1:.5);wall.castShadow=true;group.add(wall);}
 let signature='',cellSig='';
 function clear(root){for(const child of [...root.children]){root.remove(child);child.material?.dispose();child.geometry!==base&&child.geometry?.dispose();}}
 return{update(state){group.visible=!!state?.field;const obs=(state?.obstacles||[]).filter(o=>o.type!=='scenery'&&!o.map),sig=JSON.stringify(obs);if(sig!==signature){signature=sig;clear(objects);for(const o of obs){const m=new T.Mesh(base,material.clone());m.material.color.setHex(o.type==='icewall'?0xb7e9f6:0xaaa18e);m.position.set(o.x,o.h/2+.12,o.z);m.scale.set(o.w,o.h,o.d);m.castShadow=true;m.receiveShadow=true;objects.add(m);if(o.type==='icewall'){const tip=new T.Mesh(base,material.clone());tip.material.color.setHex(0xe5faff);tip.position.set(o.x,o.h+.2,o.z);tip.scale.set(o.w+.12,.15,o.d+.12);objects.add(tip);}}}
  const next=JSON.stringify(state?.cells||[]);if(next!==cellSig){cellSig=next;clear(cells);for(const [i,c]of (state?.cells||[]).entries()){const points=[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z])=>new T.Vector3(c.x+x*c.r,.28,c.z+z*c.r)),line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:teamColors[i%5]}));cells.add(line);}}
 },teamColor};
}
