import {DUNGEON_BIOMES} from './dungeon-catalog.js';

export function dungeonFloorHeight(map,x,z){const phase=(map?.seed||1)%997*.003;return Math.max(.05,.24+Math.sin(x*.027+phase)*.18+Math.cos(z*.031-phase)*.12);}
export function decorateDungeonMap(map,random){
 const keys=Object.keys(DUNGEON_BIOMES),base=Math.floor((map.floor-1)/3)%keys.length,order=[0,1,2,5,4,3,6,7,8],props=[],hazards=[];
 for(const room of map.rooms){
  room.biome=keys[(base+Math.floor(order.indexOf(room.id)/3))%keys.length];room.ceilingHeight=9.5+(room.id%3)*1.2;room.height=dungeonFloorHeight(map,room.x,room.z);
  if(room.id===0){const positions=[[-.30,-.28],[-.25,-.20],[.30,.28],[.24,.22],[-.30,.28],[-.24,.20],[.30,-.28],[.26,-.20]];for(const [i,[x,z]]of positions.entries())props.push({id:'entrance-prop-'+i,room:0,type:['crate','urn','barrel'][i%3],x:room.x+x*room.w,z:room.z+z*room.d,w:1.25,d:1.25,h:1.35,solid:true,breakable:true,hp:40+map.floor*5,alive:true});continue;}
  for(let i=0;i<5;i++){
   const type=i===0&&room.id===1?'barrel':i===4&&['forest','cavern'].includes(room.biome)?'eggNest':['crate','urn','barrel','stalagmite','crystal'][(i+room.id)%5],breakable=['crate','barrel','urn','eggNest'].includes(type),side=i%2?-1:1;
   const prop={id:`dungeon-prop-${room.id}-${i}`,room:room.id,type,x:room.x+side*room.w*(.19+(i%2)*.1),z:room.z+((i%3)-1)*room.d*.26,w:type==='eggNest'?1.8:type==='stalagmite'?1.1:1.25,d:type==='eggNest'?1.8:1.25,h:type==='stalagmite'?3.8:type==='crystal'?2.7:1.35,solid:true,breakable,hp:40+map.floor*5,alive:true};
   if(room.id===1&&i===0){prop.containsKey=true;prop.keyId=`floor-key-${map.floor}`;}
   props.push(prop);if(!breakable)map.obstacles.push({...prop,type:'dungeon-prop',dungeonProp:true});
  }
  const hazardType=({forest:'spikes',cavern:'pit',crypt:'spikes',frost:'ice',forge:'embers',void:'pit'})[room.biome],p={id:`hazard-${room.id}`,room:room.id,type:hazardType,x:room.x-room.w*.16,z:room.z+room.d*.13,w:hazardType==='ice'?11:4.5,d:hazardType==='ice'?9:4.5,period:hazardType==='embers'?5.5:6.5,offset:random()*2,telegraphSeconds:1.1,damage:16+map.floor*2};hazards.push(p);
  if(room.id%3===2)hazards.push({...p,id:p.id+'-pit',type:'pit',x:room.x+room.w*.19,z:room.z-room.d*.19,w:4,d:4});
 }
 for(const id of [0,4]){const room=map.rooms[id],prop={id:'campfire-'+id,room:id,type:'campfire',x:room.x+6,z:room.z-6,w:.8,d:.8,h:.45,solid:true,breakable:false,alive:true};props.push(prop);map.obstacles.push({...prop,type:'dungeon-prop',dungeonProp:true});}
 map.ceilingHeight=10.8;map.props=props;map.hazards=hazards;map.transitions=map.edges.filter(([a,b])=>map.rooms[a].biome!==map.rooms[b].biome).map(([a,b])=>{const path=map.corridorPaths?.find(p=>p.rooms[0]===a&&p.rooms[1]===b),point=path?.points[Math.floor(path.points.length/2)]||{x:(map.rooms[a].x+map.rooms[b].x)/2,z:(map.rooms[a].z+map.rooms[b].z)/2};return{rooms:[a,b],from:map.rooms[a].biome,to:map.rooms[b].biome,...point,w:7.5,d:7.5};});return map;
}
