// Authored voxel reconstruction of Naght Sieger's original sprite silhouette:
// silver skeletal armour, tattered crimson mantle, paired curved elemental blades.
// Reference: https://static.divine-pride.net/images/mobs/png/1956.png
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
let cached;
export function ragnarokTowerFinaleSpec(key){
 if(key!=='tower_1956')return null;if(cached)return cached;
 const parts=[],legs=[],wings=[],flames=[],b=(...p)=>parts.push(p),steel=0x9c9aaa,light=0xd3cdd7,shadow=0x363242,bone=0xe9d6ce,red=0x753b3b,crimson=0xb15a48,black=0x211d2c;
 // The torso is narrow at the waist and carries overlapping skeletal armour.
 for(let row=0;row<7;row++){const width=1.18-row*.075;b(0,2.57-row*.115,.02,width,.13,.54,row%2?steel:shadow);for(const side of [-1,1])b(side*(width*.35),2.57-row*.115,.34,.21,.10,.18,light);}
 b(0,2.78,-.02,1.13,.43,.65,shadow);b(0,2.67,.36,.16,.69,.12,crimson);b(0,1.86,.03,.71,.30,.52,shadow);for(const side of [-1,1])b(side*.34,1.86,.32,.18,.23,.18,steel);b(0,1.88,.37,.24,.20,.09,bone);
 // Red split mantle falls to two sharp hems; armour remains visible between.
 for(const side of [-1,1])for(let column=0;column<4;column++)for(let row=0;row<12;row++){
  if(row>8&&row+column>13)continue;const y=2.65-row*.14,x=side*(.50+column*.12+row*.018),z=-.28-row*.015;
  b(x,y,z,.14,.17,.18,column%3===0?crimson:red);if(column===0&&row%3===0)b(x-side*.06,y,z+.11,.065,.13,.055,0xd18b67);
 }
 // Silver greaves and pointed boots retain a normal two-leg animation rig.
 for(const side of [-1,1])legs.push({x:side*.29,y:.62,z:.01,w:.40,h:1.25,d:.48,color:steel,parts:freeze([[0,.20,0,.34,.67,.37,black],[0,.24,.19,.31,.53,.12,steel],[0,-.20,.08,.38,.35,.48,steel],[0,-.46,.20,.42,.23,.68,shadow],[side*.08,-.47,.53,.26,.16,.36,steel],[0,.40,.25,.20,.22,.20,light],[side*.20,.22,.04,.11,.32,.14,light],[0,-.18,.34,.21,.16,.08,light]])});
 // Crowned skull, recessed eyes, swept silver hair and a high red collar.
 b(0,3.13,.07,.57,.62,.48,shadow);b(0,3.14,.32,.44,.41,.17,bone);b(0,3.0,.43,.29,.18,.09,steel);b(0,3.07,.44,.07,.12,.06,shadow);
 for(const side of [-1,1]){b(side*.14,3.20,.42,.13,.10,.06,black);b(side*.14,3.20,.455,.075,.043,.03,0xd68f86);for(let row=0;row<4;row++)b(side*(.23+row*.055),3.38-row*.025,.10-row*.045,.20,.10,.33-row*.045,row%2?steel:light);b(side*.39,2.97,-.1,.20,.61,.30,crimson);for(let i=0;i<3;i++)b(side*(.41+i*.07),3.10+i*.12,-.05-i*.035,.14,.24,.11,light);}
 for(let tooth=-2;tooth<=2;tooth++)b(tooth*.055,2.97,.49,.04,.085,.045,bone);
 // Oversized thorned pauldrons and gauntlets. Blade lengths are asymmetric.
 for(const side of [-1,1]){
  b(side*.72,2.76,.02,.57,.45,.67,steel);b(side*.81,2.99,.02,.40,.18,.49,light);for(let i=0;i<4;i++)b(side*(.70+i*.13),3.02+i*.10,.03-i*.05,.15,.25,.16,i%2?light:steel);
  b(side*.96,2.35,.03,.31,.62,.34,shadow);b(side*1.04,2.00,.14,.44,.48,.47,steel);b(side*1.05,2.02,.39,.29,.31,.11,light);for(let i=0;i<3;i++)b(side*(1.22+i*.045),2.17-i*.14,.12,.12,.24,.14,light);b(side*1.04,1.72,.23,.29,.28,.31,black);
  const blade=side<0?0x8ba3d6:0xd08c69,edge=side<0?0xd2dcf0:0xf0c799;
  b(side*1.07,1.39,.30,.11,.61,.14,shadow);b(side*1.07,1.70,.31,.63,.12,.17,steel);
  for(let i=0;i<12;i++){const x=side*(1.12+i*.17),y=1.43-i*.063+Math.sin(i/11*Math.PI)*.13,w=.29-i*.012;b(x,y,.31,w,.19-i*.007,.13,blade);b(x,y+.085,.38,w,.055,.055,edge);if(i%3===0)flames.push({x,y:y+.19,z:.33,size:.25,color:side<0?0x9cc9ff:0xffb87f});}
 }
 cached=freeze({key,parts,legs,wings,flames,fur:steel,muzzle:bone,height:3.9,eyeLine:3.2,motion:'walk',features:['source-1956','paired-elemental-blades','crimson-mantle','skeletal-armour']});return cached;
}
