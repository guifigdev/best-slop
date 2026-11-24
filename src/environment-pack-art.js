import * as T from 'three';
import {createFoliageWindMaterial,updateFoliageWind} from './foliage-wind.js';
import {CASTLE_MAP} from '../shared/castle-map.js';
import {PHASE_KILLER_MAP} from '../shared/phase-killer-catalog.js';
import {worldParticleGrid,worldParticleSeed} from './world-particle-grid.js';

// Authored, texture-free silhouettes. Decoration never enters simulation state.
export const ENVIRONMENT_PACK_BUDGET=Object.freeze({props:96,boxes:5600,leaves:28,life:48,drawCalls:5,poseHz:8});
export const ENVIRONMENT_PROP_THEMES=Object.freeze({
 woodland:Object.freeze(['fern-bed','foxglove','mushroom-ring','hollow-stump','willow','beehive']),
 frost:Object.freeze(['snow-pine','ice-fan','frozen-reeds','snow-cairn','icicle-arch','winter-shrine']),
 ember:Object.freeze(['charred-tree','basalt-chimney','fire-brazier','lava-flower','ash-ribs','forge-bellows']),
 arcane:Object.freeze(['levitation-stones','rune-obelisk','crystal-bloom','astral-orrery','wisdom-tree','moon-shrine']),
 ruins:Object.freeze(['broken-column','moss-arch','road-shrine','supply-cart','banner-rack','forgotten-well']),
 coast:Object.freeze(['fan-palm','barrel-stack','fishing-rack','coral-fan','dune-cactus','ship-anchor'])
});
const hash=value=>{let h=2166136261;for(const c of String(value??''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const noise=n=>{const q=Math.sin(n*12.9898+78.233)*43758.5453;return q-Math.floor(q);};
const fract=n=>n-Math.floor(n);
const palettes={woodland:[0x68513a,0x607e46,0x8ea858,0xdac48e],frost:[0x687d86,0xa3cbd2,0xdde9df,0xaac4dd],ember:[0x4d4340,0x805346,0xb28b61,0xf0ac62],arcane:[0x665974,0x8a86ae,0xb6c4cb,0xb8cfad],ruins:[0x73786a,0x9c9d84,0xb7b296,0x8caa6a],coast:[0x8a6c4a,0xbca171,0xd6c493,0x7eae9a]};
export function environmentProfile(state,target={x:0,z:0}){
 const mode=state?.options?.mode||'campaign',map=mode==='bonk'?state?.bonk?.map:mode==='dungeon'?state?.dungeon?.map:null;
 let biome=map?.biome||map?.habitat||state?.dungeon?.biome||state?.arena||'forest';
 if(mode==='dungeon'){const r=map?.rooms?.find(r=>Math.abs(target.x-r.x)<=r.w/2&&Math.abs(target.z-r.z)<=r.d/2);biome=r?.biome||biome;}
 if(mode==='phasekiller')biome='crypt';if(['treetag','kodotag'].includes(mode))biome='forest';if(mode==='warlock')biome='forge';
 if(mode==='bloody')biome=target.z>Math.abs(target.x)*.7?'frost':target.x< -Math.abs(target.z)*.7?'forge':target.x>Math.abs(target.z)*.7?'forest':'stone';
 const theme=/frost|glacier|snow|ice/.test(biome)?'frost':/forge|volcano|fire|ash|lava/.test(biome)?'ember':/coast|sand|desert|beach/.test(biome)?'coast':/moon|void|tempest|crypt|geffen|aether|omni/.test(biome)?'arcane':/stone|city|prontera|ruin/.test(biome)?'ruins':'woodland';
 return{mode,biome,theme,wind:theme==='frost'?1.6:theme==='ember'?.7:1,leaves:['woodland','ruins','coast'].includes(theme),life:theme==='ember'?'embers':theme==='frost'?'snow-motes':mode==='phasekiller'?'fireflies':theme==='arcane'?'wisps':'butterflies'};
}

// Arrays: x,y,z,width,height,depth,color,yaw. Separate wind/glow batches.
export function environmentPropParts(type,variant=0){
 const theme=Object.keys(ENVIRONMENT_PROP_THEMES).find(k=>ENVIRONMENT_PROP_THEMES[k].includes(type));if(!theme)return null;
 const [wood,stone,light,accent]=palettes[theme],out={solid:[],flex:[],glow:[]};
 const b=(x,y,z,w,h,d,c=stone,a=0,channel='solid')=>out[channel].push([x,y,z,w,h,d,c,a]);
 const f=(...p)=>{while(p.length<8)p.push(p.length===6?accent:0);b(...p,'flex');};
 const g=(x,y,z,w,h,d,c=accent,a=0)=>b(x,y,z,w,h,d,c,a,'glow');
 const post=(x,z,h=2,c=wood)=>b(x,h/2,z,.16,h,.16,c);
 const block=(x,y,z,s,c)=>b(x,y,z,s,s,s,c);
 if(type==='fern-bed'){for(let i=0;i<7;i++){const a=i*2.4,r=.2+(i%3)*.27;for(let j=0;j<3;j++)f(Math.sin(a)*r*(j+1),.22+j*.18,Math.cos(a)*r*(j+1),.32,.11,.58, i%2?stone:light,a);}b(0,.08,0,1.6,.15,1.6,wood);}
 if(type==='foxglove'){for(let i=0;i<5;i++){const x=(i-2)*.33,z=Math.sin(i*2)*.45,h=1.2+(i%3)*.3;post(x,z,h,stone);for(let j=0;j<4;j++)f(x+.11,h-j*.2,z,.24,.17,.22,[0xb58fa1,0xddd0af][i%2]);f(x-.15,.35,z,.4,.12,.2,stone);}}
 if(type==='mushroom-ring'){for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.sin(a)*.9,z=Math.cos(a)*.9,h=.3+(i%3)*.15;b(x,h/2,z,.15,h,.15,light);b(x,h,z,.5,.18,.5,i%2?0xaf745e:0xcaa679);b(x-.1,h+.11,z-.1,.1,.06,.1,light);}}
 if(type==='hollow-stump'){for(let i=0;i<8;i++){const a=i*Math.PI/4;b(Math.sin(a)*.55,.45,Math.cos(a)*.55,.4,.9+(i%2)*.18,.4,wood,a);}b(0,.12,0,.7,.14,.7,0x3e4033);for(let s=-1;s<=1;s+=2)b(s*.78,.13,.18,.7,.25,.4,wood,s*.3);f(.5,.95,.25,.4,.12,.45,stone);}
 if(type==='willow'||type==='wisdom-tree'){post(0,0,3.4);b(.45,2.7,0,1.2,.25,.3,wood,-.3);for(let i=0;i<7;i++){const a=i*2.4,x=Math.sin(a)*1.05,z=Math.cos(a)*.85;f(x,3.2+(i%3)*.18,z,1.1,.55,1,stone,a);for(let j=0;j<(type==='willow'?3:1);j++)f(x,2.8-j*.37,z,.25,.45,.28,type==='willow'?light:0x9a95ba);}if(type==='wisdom-tree'){for(const s of [-1,1]){b(s*.5,.18,0,1.1,.3,.35,wood,s*.25);b(s*.62,1.7,.15,.08,1,.08,light);f(s*.62,1.22,.15,.38,.55,.08,0xc9c4a0);g(s*.62,1.25,.2,.14,.2,.02);}b(0,2.3,.1,.55,.75,.3,wood);}}
 if(type==='beehive'){post(-.6,0,1.6);b(0,1.7,0,1.4,.18,.2,wood);for(let j=0;j<4;j++)b(.45,1.45-j*.22,0,.6+Math.sin(j)*.2,.23,.6+Math.sin(j)*.2,accent);b(.45,.8,.35,.18,.17,.03,wood);f(-.7,.25,.2,.7,.13,.7,stone);}
 if(type==='snow-pine'){post(0,0,3.6);for(let i=0;i<4;i++){const s=2.2-i*.44;f(0,1.3+i*.7,0,s,.58,s,stone);f(.08,1.58+i*.7,0,s*.9,.15,s*.88,light);}}
 if(type==='ice-fan'||type==='crystal-bloom'){for(let i=0;i<7;i++){const a=i*2.4,x=Math.sin(a)*.65,z=Math.cos(a)*.65,h=.6+(i%4)*.52;b(x,h/2,z,.34,h,.38,i%2?light:stone,a);g(x,h+.08,z,.22,.16,.26,accent,a);if(type==='crystal-bloom'){b(x*1.4,h*.62,z*1.4,.55,.17,.6,stone,a);g(x*1.65,h*.62,z*1.65,.18,.22,.2,accent,a);}}b(0,.1,0,1.8,.2,1.6,wood);}
 if(type==='frozen-reeds'){for(let i=0;i<11;i++){const x=Math.sin(i*2.1)*.75,z=Math.cos(i*1.7)*.65,h=.8+(i%4)*.26;f(x,h/2,z,.055,h,.07,wood);f(x,h,z,.13,.4,.14,light);}b(0,.06,0,1.8,.12,1.6,stone);}
 if(type==='snow-cairn'){for(let i=0;i<5;i++){const s=1.65-i*.26;b(Math.sin(i)*.12,.18+i*.34,0,s,.35,s*.8,wood,i*.5);b(Math.sin(i)*.12,.38+i*.34,0,s*.9,.1,s*.72,light,i*.5);}}
 if(type==='icicle-arch'||type==='moss-arch'){for(const s of [-1,1]){b(s*.95,1.2,0,.48,2.4,.65,wood);b(s*.7,2.5,0,1.1,.5,.7,stone);}b(0,2.7,0,1.1,.4,.7,stone);for(let i=0;i<6;i++)f(-1+i*.4,type==='icicle-arch'?2.2:2.85,.12,.12,type==='icicle-arch'?.6+(i%3)*.18:.18,.25,type==='icicle-arch'?light:accent);}
 if(type==='winter-shrine'||type==='moon-shrine'){b(0,.15,0,1.8,.3,1.6,wood);for(const s of [-1,1])post(s*.6,0,type==='moon-shrine'?1.8:2.4);if(type==='winter-shrine'){b(0,2.4,0,1.7,.27,.8,stone);b(0,2.63,0,1.1,.2,.7,light);}else{for(let i=0;i<7;i++){const a=(i+2)*Math.PI/6;b(Math.sin(a)*.85,2.2+Math.cos(a)*.85,0,.4,.35,.3,light,a);}g(.65,2.65,0,.19,.19,.19);}b(0,.65,0,.8,.65,.7,stone);g(0,1.2,0,.37,.47,.37);for(let i=0;i<3;i++)b(-.5+i*.5,.35,.7,.38,.12,.35,light);}
 if(type==='charred-tree'){post(0,0,3.7,wood);for(const s of [-1,1]){b(s*.47,2+s*.3,0,1.05,.2,.26,wood,s*.48);b(s*.92,2.4+s*.3,0,.16,.7,.2,wood);g(s*.12,.8+s*.15,.09,.08,.5,.05);}b(0,.1,0,1.4,.2,1.3,stone);}
 if(type==='basalt-chimney'){for(let i=0;i<5;i++){const x=(i%3-1)*.55,z=Math.floor(i/3)*.55,h=1+(i%3)*.72;b(x,h/2,z,.5,h,.5,wood,i*.3);b(x,h,z,.43,.13,.43,stone);}g(0,.15,-.5,.65,.08,.3);}
 if(type==='fire-brazier'){for(const s of [-1,1]){b(s*.45,.48,0,.18,1,.22,wood,s*.18);b(0,.48,s*.45,.22,1,.18,wood);}b(0,.9,0,1.2,.2,1.2,wood);for(let i=0;i<7;i++){const x=Math.sin(i*2.4)*.38,z=Math.cos(i*2.4)*.38;f(x,1.2+(i%3)*.12,z,.23,.55,.23,accent);g(x,1.05,z,.28,.25,.3,0xf6cf83);}}
 if(type==='lava-flower'){for(let i=0;i<7;i++){const a=i*2.4;b(Math.sin(a)*.65,.3,Math.cos(a)*.65,.45,.38,.7,wood,a);g(Math.sin(a)*.4,.45,Math.cos(a)*.4,.2,.14,.45,accent,a);}g(0,.48,0,.45,.5,.45,0xf4c679);}
 if(type==='ash-ribs'){for(let i=0;i<5;i++)for(const s of [-1,1]){b(s*.5,.5,(i-2)*.38,.22,1,.18,light,s*.35);b(s*.75,.95,(i-2)*.38,.5,.17,.18,light,s*.3);}b(0,.12,0,.25,.2,2.2,stone);}
 if(type==='forge-bellows'){b(0,.22,0,1.6,.4,1.3,wood);for(let i=0;i<5;i++)b(0,.5+i*.16,0,1.4-i*.13,.12,1.1-i*.1,i%2?stone:wood);b(.9,.6,0,.7,.18,.27,light);b(-.75,.8,0,.2,1.4,.2,wood);b(-.35,1.45,0,1,.18,.2,wood,-.2);}
 if(type==='levitation-stones'){b(0,.1,0,1.6,.2,1.4,wood);for(let i=0;i<4;i++){const a=i*2.3;block(Math.sin(a)*.55,.8+i*.65,Math.cos(a)*.55,.45+i*.03,stone);g(Math.sin(a)*.55,.8+i*.65,Math.cos(a)*.55+.25,.12,.15,.03,accent);}for(let i=0;i<3;i++)g((i-1)*.36,.24,.6,.16,.04,.12);}
 if(type==='rune-obelisk'){b(0,.14,0,1.3,.28,1.3,wood);b(0,1.3,0,.65,2.3,.7,stone);b(0,2.6,0,.42,.35,.46,light);for(let i=0;i<5;i++)g((i%2-.5)*.2,.65+i*.32,.36,.12,.2,.035);}
 if(type==='astral-orrery'){post(0,0,1.25);b(0,.14,0,1.2,.28,1.2,wood);for(let i=0;i<12;i++){const a=i*Math.PI/6;block(Math.sin(a)*.8,1.6+Math.cos(a)*.8,0,.12,light);block(Math.sin(a)*.8,1.6,Math.cos(a)*.8,.12,stone);}g(0,1.6,0,.45,.45,.45);g(.8,1.6,0,.24,.24,.24,0xc0a5d4);}
 if(type==='broken-column'){b(0,.12,0,1.3,.24,1.3,wood);for(let i=0;i<4;i++)b(i===3?.13:0,.4+i*.39,0,.8,.38,.8,stone,i===3?.1:0);b(.9,.25,.35,.6,.5,.6,stone,.7);f(-.42,.22,.35,.5,.14,.5,accent);}
 if(type==='road-shrine'){b(0,.2,0,1.4,.4,1.2,wood);b(0,.95,0,.7,1.2,.6,stone);b(0,1.7,0,1,.22,.9,light);b(0,1.85,0,.6,.18,.7,stone);g(0,1.15,.32,.24,.38,.03,0xe4c489);f(-.5,.25,.3,.35,.22,.4,accent);}
 if(type==='supply-cart'){for(const x of [-.75,.75])for(const z of [-.65,.65]){b(x,.4,z,.16,.65,.65,wood);b(x,.4,z,.18,.18,.72,light);}b(0,.65,0,1.5,.18,1.8,wood);for(const x of [-.7,.7])b(x,.9,0,.14,.5,1.8,stone);b(.1,.98,-.2,.7,.55,.7,light);b(-.3,1.05,.5,.5,.7,.5,wood);b(0,.55,1.3,.22,.18,1.3,wood);}
 if(type==='banner-rack'){for(const s of [-1,1]){post(s*.8,0,2.8);b(s*.8,.12,0,.7,.24,.65,wood);}b(0,2.7,0,2,.16,.18,wood);for(let i=0;i<4;i++)f(-.55+i*.36,2.08-(i%2)*.1,0,.38,1.05,.08,i%2?0x8b6e72:0xb59e77);f(0,2.15,.06,.18,.35,.04,light);}
 if(type==='forgotten-well'){for(let i=0;i<10;i++){const a=i*Math.PI/5;b(Math.sin(a)*.65,.35,Math.cos(a)*.65,.4,.7,.4,stone,a);}b(0,.1,0,.9,.1,.9,0x4e6b71);for(const s of [-1,1])post(s*.9,0,2.2);b(0,2.2,0,2.1,.25,.7,wood);b(.2,1.6,0,.05,1,.05,light);b(.2,1.15,0,.35,.4,.35,wood);}
 if(type==='fan-palm'){b(.15,1.5,0,.35,3,.35,wood);for(let i=0;i<8;i++){const a=i*Math.PI/4;for(let j=0;j<3;j++)f(Math.sin(a)*(.35+j*.45),3.1-j*.18,Math.cos(a)*(.35+j*.45),.45,.16,.8,i%2?accent:stone,a);}for(let i=0;i<3;i++)block(Math.sin(i*2)*.28,2.8,Math.cos(i*2)*.28,.24,wood);}
 if(type==='barrel-stack'){for(let i=0;i<3;i++){const x=i===2?0:(i-.5)*.85,y=i===2?1.05:.42;for(let j=0;j<3;j++)b(x,y+(j-1)*.26,0,j===1?.72:.62,.25,.68,wood);for(const dy of [-.23,.23])b(x,y+dy,0,.75,.06,.72,stone);}}
 if(type==='fishing-rack'){for(const s of [-1,1])post(s*.95,0,2);b(0,2,0,2.2,.14,.15,wood);for(let i=0;i<5;i++){const x=(i-2)*.35;b(x,1.6,0,.04,.7,.04,light);f(x,1.14+(i%2)*.1,0,.23,.4,.15,i%2?0x8b9b94:0xb9bdab);f(x,.9+(i%2)*.1,0,.3,.12,.12,stone);}}
 if(type==='coral-fan'){for(let i=0;i<7;i++){const x=(i-3)*.24,h=.5+Math.sin((i+1)*Math.PI/8)*.9;b(x,h/2,0,.12,h,.16,i%2?0xc49c91:0xa098b1);b(x,h*.7,0,.38,.12,.16,accent);}b(0,.1,0,1.8,.2,.8,wood);}
 if(type==='dune-cactus'){b(0,1.05,0,.45,2.1,.48,accent);for(const s of [-1,1]){b(s*.48,.9+s*.18,0,.7,.3,.32,stone);b(s*.8,1.23+s*.18,0,.3,.8,.32,accent);}f(.05,2.2,0,.3,.18,.3,0xd2b4a0);for(let i=0;i<4;i++)b(.24,.4+i*.4,.02,.025,.12,.05,light);}
 if(type==='ship-anchor'){b(0,1,0,.2,1.9,.2,wood);b(0,1.55,0,1.25,.17,.18,stone);for(const s of [-1,1]){b(s*.45,.3,0,.9,.2,.22,wood,s*.3);b(s*.85,.5,0,.18,.55,.22,wood,s*.2);}b(0,2.02,0,.55,.12,.18,stone);for(const s of [-1,1])b(s*.22,1.88,0,.12,.3,.18,stone);}
 // Color/height variation remains subtle; each key above is a separate silhouette.
 const scale=1+(variant%3)*.045;for(const channel of Object.values(out))for(const p of channel){p[1]*=scale;p[4]*=scale;}
 return out;
}

function mapFor(state){const mode=state?.options?.mode;return mode==='bonk'?state?.bonk?.map:mode==='dungeon'?state?.dungeon?.map:mode==='kodotag'?state?.kodoTag?.map:mode==='treetag'?state?.treeTag?.map:mode==='castlefight'?(state?.castleFight?.map||CASTLE_MAP):mode==='phasekiller'?PHASE_KILLER_MAP[state?.phaseKiller?.dimension||'normal']:state?.voxelMap;}
function extent(state){const map=mapFor(state),mode=state?.options?.mode;if(map&&['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(map[k])))return{minX:map.minX,maxX:map.maxX,minZ:map.minZ,maxZ:map.maxZ};if(map?.origin&&map.width&&map.height&&map.tileSize)return{minX:map.origin.x,maxX:map.origin.x+map.width*map.tileSize,minZ:map.origin.z,maxZ:map.origin.z+map.height*map.tileSize};const b=Number.isFinite(state?.bounds)?state.bounds:Number.isFinite(state?.field?.bounds)?state.field.bounds:mode==='treetag'?58:mode==='kodotag'?84:mode==='bloody'?216:mode==='phasekiller'?85:mode==='war'?30:18;return{minX:-b,maxX:b,minZ:-b,maxZ:b};}

export function environmentPlacement(state){
 if(!state)return[];const profile=environmentProfile(state),map=mapFor(state),out=[],seed=hash(map?.seed??state.worldSeed??state.seed??profile.mode);
 const add=(x,z,i,theme=profile.theme,scale=1,source='border')=>{const keys=ENVIRONMENT_PROP_THEMES[theme];out.push({x,z,key:keys[i%keys.length],variant:i%3,yaw:noise(seed+i*7)*Math.PI*2,scale,seed:seed+i,source});};
 if(profile.mode==='dungeon'&&map?.rooms?.length){for(const [i,r]of map.rooms.slice(0,32).entries()){if(!(r.w>=5&&r.d>=5))continue;const p=environmentProfile({...state,dungeon:{...state.dungeon,biome:r.biome,map:null}},{x:r.x,z:r.z});for(const side of [-1,1])add(r.x+side*(r.w/2-.75),r.z+(i%2?1:-1)*(r.d/2-.75),i*2+(side+1)/2,p.theme,.32,'room-corner');}return out;}
 const e=extent(state),w=e.maxX-e.minX,d=e.maxZ-e.minZ;
 // These islands sit beyond the playable rectangle; lanes and building plots
 // remain exactly as authored. Avoid the middle of each side (gates/bridges).
 for(let side=0;side<4;side++)for(let i=0;i<12;i++){const t=(i+.5)/12;if(Math.abs(t-.5)<.1)continue;const pad=5+noise(seed+side*31+i)*3,x=side<2?(side===0?e.minX-pad:e.maxX+pad):e.minX+w*t,z=side>=2?(side===2?e.minZ-pad:e.maxZ+pad):e.minZ+d*t;add(x,z,side*12+i,profile.theme,profile.mode==='bonk'?.8:1);}
 // Tiny understory stays *inside* existing solid obstacle footprints. It adds
 // detail near gameplay without claiming any new navigable space.
 for(const [i,o]of (state.obstacles||map?.obstacles||[]).entries()){if(out.length>=ENVIRONMENT_PACK_BUDGET.props)break;if(!['tree','rock','cliff','stone'].includes(o.type)||o.alive===false||o.w<2||o.d<2||!Number.isFinite(o.x)||!Number.isFinite(o.z))continue;add(o.x+o.w*.25,o.z+o.d*.25,i,profile.theme,Math.min(.3,o.w/9,o.d/9),'solid-footprint');}
 return out.slice(0,ENVIRONMENT_PACK_BUDGET.props);
}

export function createEnvironmentPackArt({scene,heightAt=()=>0}={}){
 const root=new T.Group();root.name='native-environment-pack';root.visible=false;scene?.add(root);
 const base=new T.BoxGeometry(1,1,1),flexGeometry=base.clone(),anchors=new T.InstancedBufferAttribute(new Float32Array(ENVIRONMENT_PACK_BUDGET.boxes*4),4);flexGeometry.setAttribute('foliageRoot',anchors);
 const solidMaterial=new T.MeshLambertMaterial(),flexMaterial=createFoliageWindMaterial({coherent:true,strength:.16,speed:.8}),glowMaterial=new T.MeshBasicMaterial(),leafMaterial=new T.MeshLambertMaterial(),lifeMaterial=new T.MeshBasicMaterial();
 const make=(name,geometry,material,n)=>{const m=new T.InstancedMesh(geometry,material,n);m.name=name;m.count=0;m.frustumCulled=false;m.castShadow=false;m.receiveShadow=true;root.add(m);return m;};
 const solid=make('environment-authored-props',base,solidMaterial,ENVIRONMENT_PACK_BUDGET.boxes),flex=make('environment-wind-foliage',flexGeometry,flexMaterial,ENVIRONMENT_PACK_BUDGET.boxes),glow=make('environment-lanterns',base,glowMaterial,ENVIRONMENT_PACK_BUDGET.boxes),leaves=make('environment-falling-leaves',base,leafMaterial,ENVIRONMENT_PACK_BUDGET.leaves),life=make('environment-ambient-life',base,lifeMaterial,ENVIRONMENT_PACK_BUDGET.life);
 for(const m of [leaves,life])m.instanceMatrix.setUsage(T.DynamicDrawUsage);
 const dummy=new T.Object3D(),color=new T.Color();let key='',props=[],emitters=[],lastPose=-1,disposed=false,profile=null,rebuilds=0;
 const put=(mesh,i,p)=>{dummy.position.set(p[0],p[1],p[2]);dummy.scale.set(p[3],p[4],p[5]);dummy.rotation.set(0,p[7]||0,p[8]||0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.setHex(p[6]));};
 const finish=m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;};
 function rebuild(state){props=environmentPlacement(state);emitters=[];solid.count=flex.count=glow.count=0;for(const prop of props){const parts=environmentPropParts(prop.key,prop.variant),c=Math.cos(prop.yaw),s=Math.sin(prop.yaw),ground=heightAt(prop.x,prop.z);if(!Number.isFinite(ground))continue;const h=Math.max(...Object.values(parts).flat().map(p=>p[1]+p[4]/2))*prop.scale;for(const channel of ['solid','flex','glow']){const mesh={solid,flex,glow}[channel];for(const p of parts[channel]){if(mesh.count>=ENVIRONMENT_PACK_BUDGET.boxes)break;const i=mesh.count++,x=(p[0]*c+p[2]*s)*prop.scale,z=(p[2]*c-p[0]*s)*prop.scale;put(mesh,i,[prop.x+x,ground+p[1]*prop.scale,prop.z+z,p[3]*prop.scale,p[4]*prop.scale,p[5]*prop.scale,p[6],p[7]+prop.yaw]);if(channel==='flex')anchors.setXYZW(i,prop.x,prop.z,ground,h);}}if(parts.flex.length&&h>1)emitters.push({...prop,y:ground+h,height:h});}for(const m of [solid,flex,glow])finish(m);anchors.needsUpdate=true;rebuilds++;lastPose=-1;}
 function animate(time,target,state){const frame=Math.floor(time*ENVIRONMENT_PACK_BUDGET.poseHz),grid=worldParticleGrid(target,{cellSize:12,columns:4,rows:4});if(frame===lastPose&&root.userData.focusCellX===grid.cx&&root.userData.focusCellZ===grid.cz)return;lastPose=frame;root.userData.focusCellX=grid.cx;root.userData.focusCellZ=grid.cz;const t=frame/ENVIRONMENT_PACK_BUDGET.poseHz,anchor={x:(grid.cx+.5)*grid.cellSize,z:(grid.cz+.5)*grid.cellSize};leaves.count=life.count=0;leaves.userData.worldParticleIds=[];life.userData.worldParticleIds=[];
  const leafSources=emitters.slice();if(profile.leaves){const trees=state.treeTag?.trees||state.kodoTag?.trees||[];let nearby=0;for(const tree of trees){if(nearby>=12)break;if(tree.alive===false||!Number.isFinite(tree.x)||!Number.isFinite(tree.z)||Math.hypot(tree.x-anchor.x,tree.z-anchor.z)>35)continue;const h=tree.h||5;leafSources.push({x:tree.x,z:tree.z,y:heightAt(tree.x,tree.z)+h,height:h,seed:hash(tree.id??tree.x+':'+tree.z)});nearby++;}}
  // Every phase uses the emitter's world seed, never its changing list index.
  if(profile.leaves)for(const e of leafSources){if(leaves.count>=ENVIRONMENT_PACK_BUDGET.leaves||Math.hypot(e.x-anchor.x,e.z-anchor.z)>64)continue;const cycle=Math.floor(t/11+noise(e.seed)),chance=noise(e.seed+cycle*97);if(chance>.42)continue;const phase=fract(t/11+noise(e.seed)),fall=phase*e.height,x=e.x+Math.sin(t*.65+e.seed)*.8+phase*1.7,z=e.z+Math.cos(t*.45+e.seed)*.7,y=Math.max(heightAt(x,z)+.08,e.y-fall);put(leaves,leaves.count++,[x,y,z,.1,.035,.18,[0xa7ad67,0xb29b66,0x80995a][e.seed%3],t*1.4+e.seed,Math.sin(t+e.seed)*.7]);leaves.userData.worldParticleIds.push(`leaf:${profile.mode}:${e.seed}`);}
  // Each insect or mote orbits a fixed point in its own world cell. Moving the
  // camera only recycles distant edge cells; overlapping cells keep their IDs.
  const swarmSeed=hash(`${profile.mode}:${mapFor(state)?.seed??state.seed??0}`);
  for(const cell of grid.cells){const id=worldParticleSeed(swarmSeed,cell.x,cell.z),a=noise(id)*Math.PI*2,r=.6+noise(id+11)*1.1,x=(cell.x+.25+noise(id+2)*.5)*grid.cellSize+Math.sin(a+t*.24)*r,z=(cell.z+.25+noise(id+3)*.5)*grid.cellSize+Math.cos(a+t*.24)*r,y=heightAt(x,z)+.7+noise(id+5)*2+Math.sin(t*.8+id)*.35,worldId=`life:${swarmSeed}:${cell.x}:${cell.z}`;if(!Number.isFinite(y))continue;const fiery=profile.life==='embers',magic=profile.life==='wisps'||profile.life==='fireflies',frost=profile.life==='snow-motes';if(fiery||magic||frost){const size=fiery?.055:magic?.065:.045;put(life,life.count++,[x,y,z,size,size*(fiery?2:1),size,fiery?0xe5ad6a:magic?0xc7d8a5:0xd7e9e5,t+id]);life.userData.worldParticleIds.push(worldId);}else{const flap=Math.sin(frame*1.8+id)>.1?.22:.055;put(life,life.count++,[x,y,z,.055,.055,.17,0x716347,a]);life.userData.worldParticleIds.push(worldId+':body');for(const side of [-1,1]){put(life,life.count++,[x+side*.1,y+flap*.3,z,.19,.035,.14,id%2?0xc8af79:0xa0b8bd,a,side*flap*3]);life.userData.worldParticleIds.push(worldId+':wing:'+side);}}}
  finish(leaves);finish(life);
 }
 return{root,update(state,time=state?.time||0,{target={x:0,z:0},enabled=true}={}){if(disposed)return;root.visible=!!state&&enabled&&Number.isFinite(time);if(!root.visible)return;profile=environmentProfile(state,target);const map=mapFor(state),next=[profile.mode,profile.theme,map?.seed,map?.revision,state?.seed,state?.obstacleRevision,state?.phaseKiller?.dimension,JSON.stringify(extent(state)),map?.rooms?.length||0].join(':');if(next!==key){key=next;rebuild(state);}updateFoliageWind(flexMaterial,time);animate(time,target,state);},reset(){key='';props=[];emitters=[];lastPose=-1;root.visible=false;for(const m of [solid,flex,glow,leaves,life])m.count=0;},stats(){return{theme:profile?.theme||null,props:props.length,variants:new Set(props.map(p=>p.key)).size,catalogVariants:Object.values(ENVIRONMENT_PROP_THEMES).flat().length,boxes:solid.count+flex.count+glow.count,leaves:leaves.count,life:life.count,drawCalls:root.visible?root.children.filter(m=>m.count>0).length:0,rebuilds,pose:lastPose,wind:!!flex.count};},dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const m of [solid,flex,glow,leaves,life])m.dispose();for(const m of [solidMaterial,flexMaterial,glowMaterial,leafMaterial,lifeMaterial])m.dispose();base.dispose();flexGeometry.dispose();root.clear();}};
}
