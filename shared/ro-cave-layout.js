const styles=new Set(['burial-cave','glacial','volcanic','sandstone-tomb']);
const distanceTo=(p,a,b)=>{const x=b.x-a.x,z=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1)));return Math.hypot(p.x-a.x-x*t,p.z-a.z-z*t);};
/** Carved chambers share the route's real roads. Every placed object gets a
 * connecting passage; visual walls and collision walls are the same cells. */
export function encloseRoCave(map){
 if(!styles.has(map.route?.style)&&!(map.habitat==='cave'&&!map.route))return map;
 const nodes=[map.spawn,map.center,...map.landmarks,...(map.route?.bossArena?[map.route.bossArena]:[])],roads=[...map.paths],objects=map.objects.filter(o=>o.type!=='rune');
 for(const o of objects){const closest=nodes.reduce((a,b)=>Math.hypot(o.x-a.x,o.z-a.z)<Math.hypot(o.x-b.x,o.z-b.z)?a:b);roads.push({from:closest,to:o,width:6});}
 const cells=[],size=6,margin=Math.SQRT2*size/2+.6,open=p=>nodes.some(n=>Math.hypot(p.x-n.x,p.z-n.z)<(n.radius||14)+margin)||objects.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<5+margin)||roads.some(r=>distanceTo(p,r.from,r.to)<(r.width||12)/2+margin);
 for(let z=-111;z<=111;z+=size)for(let x=-111;x<=111;x+=size){if(open({x,z}))continue;const h=10+((Math.imul(x+117,31)^Math.imul(z+117,17)^map.seed)>>>0)%5;cells.push({id:'cave:'+x+':'+z,type:'cave-wall',x,z,w:size,d:size,h,alive:true});}
 map.enclosed={style:map.route?.style||'burial-cave',cellCount:cells.length,size};map.obstacles.push(...cells);return map;
}
