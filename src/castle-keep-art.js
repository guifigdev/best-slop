import * as T from 'three';
import {CASTLE_RACES} from '../shared/castle-catalog.js';

// A keep fills its existing footprint. Taller silhouettes never extend into lanes.
const specs=new Map(),geometries=new Map();let material=null,users=0;
const palettes={human:[0xb7baa6,0xe3ddc5,0x59686d,0x647f99],elf:[0xd5d5b2,0xf0e7bc,0x566a56,0x8faa78],nightelf:[0x777d92,0xbab9d0,0x384553,0x655e87],orc:[0x8c7153,0xcdb88a,0x433b32,0x785649],undead:[0x666b79,0xb2b7aa,0x343a43,0x515162],naga:[0x77a79d,0xc7d7b6,0x355a5d,0x54928f],north:[0x9db6bb,0xe5e7d7,0x4c656c,0x567c87],chaos:[0x605769,0x9b8690,0x302f3d,0x71443e],corrupted:[0x6c6178,0xb4a1b8,0x34383d,0x5c4f6a],mech:[0x8faba9,0xc5d0bf,0x344f54,0x5e7f82]};
export function castleKeepSpec({w=3,d=3,race='human',team=1}={}){
 w=Math.max(1,Number(w)||3);d=Math.max(1,Number(d)||3);race=Object.hasOwn(palettes,race)?race:'human';const key=[w,d,race,team].join('|');if(specs.has(key))return specs.get(key);
 const [stone,light,dark,roof]=palettes[race],accent=new T.Color(CASTLE_RACES[race]?.color||'#91b69c').getHex(),banner=team===2?0xcd665d:team===1?0x6199cf:0xb8a3d1,gold=0xddbd78,boxes=[];
 const add=(x,y,z,bw,bh,bd,color=stone,part='stonework')=>boxes.push(Object.freeze({x:x*w,y,z:z*d,w:bw*w,h:bh,d:bd*d,color,part}));
 const roofline=(x,y,z,rw,rd,steps=8,colour=roof)=>{for(let i=0;i<steps;i++)add(x,y+i*.16,z,rw*(1-i/(steps+.5)),.18,rd,colour,'sloped-roof');add(x,y+steps*.16,z,.075,.1,rd+.025,light,'roof-ridge');};
 add(0,.12,0,.99,.24,.99,dark,'foundation');add(0,.29,0,.95,.12,.95,light,'foundation-course');
 // Complete solid wall backing, then a shallow, intentionally dark arched entrance.
 add(0,1.68,-.035,.76,2.67,.69,stone,'great-hall');add(0,.5,.03,.85,.24,.81,dark,'plinth');add(0,2.93,-.035,.82,.18,.75,light,'cornice');
 const gateZ=.323,gateW=.235;add(0,1.16,gateZ,gateW,1.65,.025,dark,'gate-recess');for(let i=0;i<5;i++)add(0,1.94+i*.11,gateZ,gateW*(1-(i+1)/6),.13,.03,dark,'gate-arch');
 for(const side of [-1,1]){add(side*.14,1.15,gateZ+.018,.048,1.7,.055,light,'gate-jamb');for(let i=0;i<5;i++)add(side*(.14-i*.022),2.02+i*.09,gateZ+.018,.055,.13,.055,light,'gate-voussoir');}
 add(0,2.44,gateZ+.021,.062,.19,.07,gold,'gate-keystone');for(let i=0;i<5;i++)add((i-2)*.044,1.19,gateZ+.024,.012,1.48,.018,0x88918a,'portcullis');for(const y of [.68,1.21,1.71])add(0,y,gateZ+.035,.22,.045,.018,0x8e9383,'gate-brace');
 // Brick courses sit against the wall, with staggered joints and deliberate stone tones.
 for(let row=0;row<9;row++){const y=.64+row*.235;for(let column=0;column<8;column++){const x=-.337+column*.092+(row%2)*.024;if(Math.abs(x)>.36||Math.abs(x)<.177&&y<2.37)continue;add(x,y,.313,.079,.187,.018,(row+column)%5===0?light:stone,'ashlar-brick');}for(const side of [-1,1])for(let column=0;column<6;column++)add(side*.383,y,-.303+column*.104+(row%2)*.02,.018,.187,.085,(row+column)%6===0?light:stone,'side-ashlar');}
 for(const x of [-.255,.255]){add(x,1.99,.33,.067,.62,.035,dark,'arrow-slit');add(x,2.07,.348,.014,.45,.022,gold,'window-mullion');add(x,1.76,.351,.092,.055,.037,light,'window-sill');}
 roofline(0,3.06,-.035,.85,.78,8);for(const side of [-1,1])for(let tile=0;tile<5;tile++)add(side*(.39-tile*.066),3.09+tile*.16,.375,.07,.045,.026,gold,'roof-tile-edge');
 for(const side of [-1,1])for(const front of [-1,1]){
  const x=side*.365,z=front*.365,towerH=front>0?3.18:3.46;
  add(x,towerH/2+.34,z,.208,towerH,.23,stone,'tower-shaft');add(x,towerH/2+.34,z,.24,towerH,.17,stone,'tower-cut-corner');
  for(let course=0;course<7;course++)add(x,.58+course*.44,z,.249,.075,.24,course%2?stone:light,'tower-course');
  add(x,towerH+.4,z,.265,.2,.265,light,'machicolation');add(x,towerH+.57,z,.24,.13,.24,dark,'tower-deck');
  for(const a of [-1,1])for(let tooth=0;tooth<3;tooth++){add(x+a*.103,towerH+.83,z+(tooth-1)*.088,.045,.44,.057,light,'tower-crenel');add(x+(tooth-1)*.088,towerH+.83,z+a*.103,.057,.44,.045,light,'tower-crenel');}
  add(x,towerH+.43,z+front*.118,.106,.5,.021,banner,'tower-banner');add(x,towerH+.43,z+front*.126,.025,.34,.014,gold,'banner-stitch');
  add(x,1.73,z+front*.119,.045,.47,.023,dark,'tower-slit');add(x,2.38,z+front*.119,.045,.4,.023,dark,'tower-slit');
 }
 // Team heraldry, iron sconces, and stepped stairs are readable at gameplay scale.
 add(0,2.75,.358,.18,.3,.025,banner,'coat-of-arms');add(0,2.75,.378,.035,.24,.013,gold,'heraldic-blade');add(0,2.73,.379,.12,.035,.014,gold,'heraldic-hilt');
 for(let stair=0;stair<3;stair++)add(0,.16+stair*.1,.46-stair*.035,.3,.12,.06,light,'gate-stair');
 for(const side of [-1,1]){add(side*.2,1.31,.361,.035,.32,.04,0x715841,'torch-bracket');add(side*.2,1.54,.368,.048,.16,.045,0xf3b35b,'torch-flame');}
 add(0,4.57,-.05,.025,.82,.025,dark,'flag-pole');add(.105,4.71,-.05,.205,.26,.017,banner,'royal-standard');add(.174,4.56,-.05,.068,.07,.017,banner,'standard-tail');add(0,5.02,-.05,.045,.08,.045,gold,'finial');
 if(race==='elf'){for(const side of [-1,1]){roofline(side*.365,4.38,-.365,.22,.23,4,accent);add(side*.365,5.13,-.365,.025,.45,.025,gold,'elven-spire');}add(0,4.57,-.035,.085,.48,.085,gold,'sun-crown');}
 if(race==='nightelf'){for(const side of [-1,1])for(let i=0;i<4;i++)add(side*(.12+i*.029),4.45+i*.1,-.035,.055,.17,.08,0xd3d0e6,'moon-antler');}
 if(race==='orc'){for(const side of [-1,1]){add(side*.26,1.55,.34,.04,2.45,.055,0x554332,'timber-brace');for(let i=0;i<4;i++)add(side*(.24+i*.013),2.68+i*.13,.34,.04,.19,.06,light,'ivory-tusk');}roofline(0,4.13,-.035,.55,.74,3,0x9a7050);}
 if(race==='undead'){for(const side of [-1,1]){add(side*.32,2.2,.34,.05,2.72,.06,dark,'flying-buttress');add(side*.32,3.71,.34,.06,.36,.08,0x9fbe97,'necrotic-lantern');}add(0,2.76,.393,.13,.16,.04,light,'skull-heraldry');for(const side of [-1,1])add(side*.035,2.79,.418,.025,.04,.012,dark,'skull-eye');}
 if(race==='naga'){for(let step=0;step<3;step++)add(0,4.33+step*.15,-.035,.44-step*.12,.17,.46-step*.12,step%2?gold:accent,'pagoda-crown');for(const side of [-1,1])add(side*.34,2.87,0,.04,.15,.64,gold,'tidal-gilt');}
 if(race==='north'){for(const side of [-1,1]){for(let i=0;i<3;i++)add(0,4.35+i*.12,side*(.36+i*.018),.067,.16,.07,gold,'dragon-roof-prow');add(side*.365,4.16,.365,.2,.09,.23,0xe7eeea,'snow-cap');}}
 if(race==='chaos'){for(const side of [-1,1]){add(side*.365,4.58,-.365,.07,.55,.07,dark,'basalt-spire');add(side*.365,4.94,-.365,.05,.22,.05,0xf39b4d,'infernal-flame');}for(const side of [-1,1])add(side*.265,1.66,.339,.018,1.05,.03,0xc77f47,'magma-fissure');}
 if(race==='corrupted'){for(const side of [-1,1])for(let i=0;i<4;i++)add(side*(.3-i*.035),.42+i*.18,.2-i*.03,.15,.18,.12,0x55464c,'root-buttress');for(const side of [-1,1])add(side*.365,4.48,-.365,.06,.54,.06,accent,'twilight-crystal');}
 if(race==='mech'){for(const side of [-1,1]){add(side*.365,4.16,.365,.1,.16,.23,dark,'turret-receiver');add(side*.365,4.17,.46,.04,.065,.08,0xb5c3ba,'cannon-muzzle');add(side*.23,4.33,-.24,.06,.45,.06,dark,'smokestack');for(let fin=0;fin<3;fin++)add(side*.23,4.23+fin*.1,-.24,.1,.035,.1,light,'cooling-fin');}}
 const height=Math.max(...boxes.map(box=>box.y+box.h/2)),spec=Object.freeze({key,race,team,footprint:Object.freeze({w,d}),height,boxes:Object.freeze(boxes)});specs.set(key,spec);return spec;
}
function geometry(spec){const unit=new T.BoxGeometry(1,1,1).toNonIndexed(),p=unit.attributes.position,n=unit.attributes.normal,count=p.count*spec.boxes.length,positions=new Float32Array(count*3),normals=new Float32Array(count*3),colors=new Float32Array(count*3),c=new T.Color();let i=0;for(const b of spec.boxes){c.setHex(b.color);for(let k=0;k<p.count;k++){positions[i]=b.x+p.getX(k)*b.w;normals[i]=n.getX(k);colors[i++]=c.r;positions[i]=b.y+p.getY(k)*b.h;normals[i]=n.getY(k);colors[i++]=c.g;positions[i]=b.z+p.getZ(k)*b.d;normals[i]=n.getZ(k);colors[i++]=c.b;}}unit.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeBoundingBox();g.computeBoundingSphere();return g;}
export function createCastleKeepArt(options={}){const spec=castleKeepSpec(options);let record=geometries.get(spec.key);if(!record){record={geometry:geometry(spec),users:0};geometries.set(spec.key,record);}record.users++;users++;material??=new T.MeshLambertMaterial({vertexColors:true,flatShading:true});const mesh=new T.Mesh(record.geometry,material);mesh.name='castle-main-keep-'+spec.race;mesh.castShadow=mesh.receiveShadow=true;mesh.userData.buildingArt=true;mesh.userData.height=spec.height;let disposed=false;mesh.userData.dispose=()=>{if(disposed)return;disposed=true;if(--record.users===0){record.geometry.dispose();geometries.delete(spec.key);}if(--users===0){material.dispose();material=null;}};return mesh;}
