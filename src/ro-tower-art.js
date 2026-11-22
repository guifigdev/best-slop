// Authored voxel architecture following the original RO Endless Tower room:
// green-gray flagstones, cylindrical pillars, capitals, dark stone and stairs.
// No outdoor trees, hills or region props are reused for the tower.
export const RO_TOWER_PALETTE=Object.freeze({soil:0x747c69,grass:0x7c8570,dark:0x333c37,stone:0x989e86,wood:0x5b6556,sky:0x080e0e,glow:0xbfe4a0,path:0x7a826d});
export function roTowerArchitectureParts(map){
 const stone=[],lights=[],flames=[],p=RO_TOWER_PALETTE,box=(...part)=>stone.push(part),lit=(...part)=>lights.push(part),floor=map?.tower?.floor||1,accent=floor>=76?0x8ba6a4:floor>=51?0x9b9b87:floor>=26?0x7f9a7e:0x9ba78b;
 // Large pavement is textured by the shared pixel atlas. Thin insets break up
 // the broad central nave with a deliberate medieval stone pattern.
 for(const x of [-10,10])for(let z=-26;z<32;z+=4)box(x,.025,z,.14,.04,3.8,p.dark);
 for(const z of [-25,0,25]){box(0,.025,z,19.6,.05,.17,p.dark);for(const x of [-3,0,3])box(x,.04,z,1.25,.07,1.25,accent,Math.PI/4);}
 for(const side of [-1,1]){
  const x=side*31;
  box(x,1.8,0,2,3.6,80,p.dark);box(x,.22,0,2.8,.44,80,p.stone);box(x,3.7,0,2.7,.38,80,p.stone);
  for(let z=-37;z<39;z+=4.2){box(x-side*.85,1.2,z,.36,1.8,4.02,p.soil);box(x-side*.88,2.7,z+1.9,.35,1.04,3.7,accent);}
  // Side alcoves are decorative, not closed collision rooms.
  for(const z of [-30,-15,0,15,30]){box(x-side*1.15,1.2,z,1.7,2.4,.8,p.dark);box(x-side*1.2,2.4,z,2.1,.30,1.4,p.stone);}
 }
 box(0,3.3,-40,64,6.6,2,p.dark);box(0,.24,-39,62,.48,2.7,p.stone);box(0,6.7,-40,64,.35,2.7,p.stone);
 // Front wall is cut down for the survivor camera so it never hides combat.
 box(0,.6,40,64,1.2,2,p.dark);box(0,1.23,40,64,.22,2.5,p.stone);
 for(const col of map.decorations.filter(o=>o.type==='tower-column')){
  const {x,z}=col;box(x,.19,z,4.1,.38,4.1,p.dark);box(x,.46,z,3.65,.24,3.65,p.stone);box(x,.69,z,3.2,.22,3.2,accent);
  // Eight-sided masonry, stacked joints, broad capitals and inset bands.
  for(let ring=0;ring<11;ring++)for(let segment=0;segment<8;segment++){const angle=segment*Math.PI/4+(ring%2)*Math.PI/8;box(x+Math.sin(angle)*1.15,1.04+ring*.49,z+Math.cos(angle)*1.15,1.02,.47,.64,(ring+segment)%4===0?accent:p.soil,angle);}
  box(x,6.55,z,3.25,.42,3.25,p.stone);box(x,6.94,z,3.85,.32,3.85,accent);box(x,7.30,z,4.05,.30,4.05,p.stone);
  for(const dx of [-.32,.32])box(x+dx,6.49,z+1.67,.10,.33,.07,p.dark);
 }
 for(let step=1;step<=9;step++)box(0,step*.1,-27-step*1.35-.675,13.2,step*.2,1.35,step%2?p.stone:accent);
 for(const side of [-1,1]){const x=side*7.25;box(x,1.25,-33.3,1.1,2.5,12.8,p.dark);box(x,2.65,-33.3,1.5,.3,12.8,p.stone);box(x,4.0,-38.7,2,8,2,p.stone);box(x,8.1,-38.7,2.8,.4,2.6,accent);}
 for(let i=0;i<13;i++){const theta=i*Math.PI/12;box(Math.cos(theta)*6.8,6.6+Math.sin(theta)*3.8,-38.7,1.25,.6,1.5,i%3?p.stone:accent);}
 // Quiet rune inset within the stair arch. Its readiness glint is dynamic.
 for(let i=0;i<4;i++)lit((i-1.5)*1.1,5.0+Math.abs(i-1.5)*.16,-39,.16,.48,.14,p.glow);
 if(floor===101){box(0,2.7,-38.2,4.8,1.2,3,p.dark);box(0,5.1,-39,4.2,4.3,1.0,p.dark);box(0,5.1,-38.4,2.9,3.4,.18,0x743e42);for(const side of [-1,1]){box(side*2.5,3.8,-38,1.0,4,1.2,accent);box(side*2.5,6.0,-38,.55,1.1,.55,p.stone);for(let row=0;row<4;row++)box(side*(1.4-row*.2),7.0+row*.22,-38.9,.36,.50,.52,accent);}lit(0,6.3,-38.3,.23,.53,.10,0xdfa1ad);}
 for(const side of [-1,1])for(const z of [-29,28]){
  const x=side*27.5;box(x,.16,z,1.7,.32,1.7,p.dark);box(x,1.05,z,.62,1.6,.62,p.stone);box(x,1.9,z,1.35,.28,1.35,p.dark);flames.push({x,y:2.04,z,scale:.42,seed:'tower-'+side+'-'+z});
 }
 return{stone,lights,flames};
}
