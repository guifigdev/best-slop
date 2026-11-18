import * as T from 'three';
import {SHOPS} from '../shared/shops.js';

// Non-combatants are local scenery. Stock, range and transactions remain in the
// authoritative simulation; this component only renders and routes interaction.
export function createMarket({scene,voxel,bake,overlay,onTalk=()=>{}}){
 const root=new T.Group();root.name='physical-coliseum-market';scene.add(root);
 const labels=document.createElement('div');labels.className='market-labels';Object.assign(labels.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'4'});
 // Combat-number overlays may be aria-hidden; merchant buttons must be their
 // siblings so keyboard and assistive technology can reach the shop services.
 (overlay.parentElement||overlay).append(labels);
 const stores=[],ownedGeometry=new Set();let state=null,disposed=false;
 const neutralWood=0xa58c64,lightWood=0xc6ad7c,darkWood=0x746448,cream=0xe9dfbd;
 const box=(parent,x,y,z,w,h,d,color)=>voxel(parent,x,y,z,w,h,d,color);
 function consolidate(group,key){const mesh=bake(group);if(mesh){mesh.name=key;if(mesh.geometry)ownedGeometry.add(mesh.geometry);}return mesh;}
 function potion(parent,x,y,z,color){box(parent,x,y,z,.24,.34,.24,color);box(parent,x,y+.21,z,.15,.13,.15,0xd8dfcd);box(parent,x,y+.31,z,.19,.09,.19,0xa07c52);box(parent,x-.06,y+.04,z+.13,.055,.16,.025,0xf5ebcb);}
 function book(parent,x,y,z,color){box(parent,x,y,z,.23,.42,.31,color);box(parent,x,y,z+.17,.15,.3,.035,0xe5dab6);box(parent,x,y+.1,z+.195,.1,.045,.025,0xc6a366);}
 function crystal(parent,x,y,z,color){box(parent,x,y,z,.29,.5,.28,color);box(parent,x+.02,y+.33,z-.01,.2,.19,.2,0xdde6df);box(parent,x-.07,y+.03,z+.15,.06,.29,.025,0xf1ebd2);box(parent,x,y-.3,z,.42,.11,.4,0x8a7453);}
 function products(parent,shop){
  if(shop.id==='equipment'){
   box(parent,.95,1.04,-1.48,.95,.14,.55,darkWood);for(const x of [.65,1.2]){box(parent,x,1.66,-1.47,.1,1.0,.1,0xd7dfd7);box(parent,x,1.31,-1.47,.34,.1,.14,0xd9b56d);box(parent,x,1.15,-1.47,.1,.3,.1,0x836c4c);}box(parent,-1.05,1.29,-1.43,.55,.73,.14,0x638b83);box(parent,-1.05,1.31,-1.34,.14,.47,.04,0xe6c789);box(parent,-.85,.72,-1.35,.7,.36,.6,0x8b7959);
  }
  if(shop.id==='consumables'){
   for(const [i,color]of [0xc8886d,0x8ebacb,0x9cb67f].entries())potion(parent,-1.0+i*.52,1.42,-1.35,color);box(parent,1.15,.62,-1.44,.65,.7,.61,0xb49a6d);box(parent,1.15,.91,-1.44,.73,.1,.7,lightWood);potion(parent,1.14,1.15,-1.43,0x9b98c4);
  }
  if(shop.id==='books'){
   box(parent,1.05,1.38,-1.55,1.1,.12,.55,lightWood);box(parent,1.05,1.95,-1.55,1.1,.12,.55,lightWood);for(const x of [.48,1.6])box(parent,x,1.65,-1.55,.1,1.25,.55,darkWood);for(const [i,color]of [0x8b9e78,0xb08567,0x9184ac,0x74999b].entries())book(parent,.7+i*.25,1.68,-1.47,color);box(parent,-1.08,1.28,-1.4,.57,.12,.47,0x8b7f9b);box(parent,-1.08,1.42,-1.4,.57,.12,.47,0xc0ad79);box(parent,-1.08,1.56,-1.4,.57,.12,.47,0x7e9d8a);
  }
  if(shop.id==='smith'){
   box(parent,1.02,1.14,-1.34,.48,.55,.48,0x707d79);box(parent,1.02,1.48,-1.34,1.03,.18,.56,0xa4b0a5);box(parent,1.57,1.48,-1.34,.35,.12,.32,0xc6cbbb);box(parent,-1.15,1.03,-1.71,.92,.91,.8,0x7b8275);box(parent,-1.15,1.1,-1.25,.67,.46,.08,0x534b3b);box(parent,-1.15,1.04,-1.19,.48,.25,.055,0xe5a157);box(parent,-1.15,1.12,-1.15,.21,.28,.045,0xffdb89);box(parent,-1.47,1.9,-1.82,.4,1.09,.42,0x7e8476);box(parent,-1.47,2.5,-1.82,.56,.16,.57,0xa8ad97);for(let i=0;i<3;i++)box(parent,-1.3+i*.14,1.46+(i%2)*.12,-1.22,.07,.12,.07,0xf1c578);
  }
  if(['enchanter','runemaster'].includes(shop.id)){
   crystal(parent,-1.12,1.68,-1.39,0xb9a3d2);crystal(parent,1.04,1.62,-1.39,0x8fc4c8);box(parent,.53,1.28,-1.43,.42,.13,.51,0x799688);box(parent,.53,1.4,-1.43,.42,.13,.51,0xc0ac75);box(parent,-1.13,2.12,-1.39,.12,.12,.12,0xe7d7b5);
  }
 }
 function animal(group,shop){
  const kind=shop.hero,fur=kind==='mage'?0xe4decf:kind==='owl'?0xa18b69:kind==='raccoon'?0xa7a392:kind==='ranger'?0xd39761:0xbba074,muzzle=kind==='mage'?0xf4ecda:kind==='ranger'?0xf0dfba:0xd8c396;
  box(group,0,.83,0,.76,.81,1.05,fur);box(group,0,1.44,.34,.87,.77,.74,fur);box(group,0,1.23,.79,.61,.3,.25,muzzle);box(group,0,.79,.12,.81,.38,.91,shop.color);box(group,0,.61,.61,.51,.49,.06,shop.id==='smith'?0x8a684d:0xd4c194);
  for(const x of [-.26,.26]){box(group,x,.26,.15,.22,.45,.29,fur);box(group,x,1.56,.72,.105,.14,.035,0x344b3d);}
  if(kind==='mage'){for(const x of [-.26,.26]){box(group,x,2.11,.26,.23,.7,.24,fur);box(group,x,2.12,.4,.1,.46,.035,0xc7aaa0);}box(group,0,.81,-.61,.35,.35,.31,0xf1e6d1);}
  else if(kind==='owl'){for(const x of [-.24,.24]){box(group,x,1.53,.73,.31,.35,.05,0xe9d9b7);box(group,x,1.54,.775,.12,.17,.035,0x3b4c3b);box(group,x,1.57,.8,.035,.045,.02,0xf4ebcb);}box(group,0,1.31,.9,.18,.23,.21,0xdfb96a);for(const side of [-1,1]){box(group,side*.49,.95,.04,.19,.57,.64,0x7a7d69);box(group,side*.34,1.98,.27,.22,.28,.29,0x9c825c);}}
  else if(kind==='raccoon'){box(group,0,1.56,.73,.78,.25,.04,0x4b5751);for(const x of [-.26,.26]){box(group,x,1.57,.765,.12,.15,.035,0xf0e9cc);box(group,x,1.98,.24,.25,.27,.25,fur);}for(let i=0;i<3;i++)box(group,0,.78,-.65-i*.2,.31,.29,.2,i%2?0x596156:0xb6b29a);box(group,-.53,.91,.55,.1,.7,.1,0xa88b5e);box(group,-.53,1.29,.55,.36,.22,.25,0xb1b8ab);}
  else if(kind==='ranger'){for(const x of [-.27,.27]){box(group,x,2.01,.23,.23,.41,.25,fur);box(group,x,2.04,.37,.1,.2,.03,0x795f48);}box(group,0,.84,-.76,.38,.36,.69,fur);box(group,0,.84,-1.06,.4,.37,.29,0xf2dfb8);box(group,-.59,1.02,.4,.095,1.38,.1,0x9a8258);box(group,-.59,1.83,.4,.31,.33,.3,0xc4addd);}
  else{for(const x of [-.31,.31])box(group,x,1.95,.28,.23,.25,.25,fur);box(group,0,.88,-.04,.81,.14,1.1,0xe3c17d);box(group,0,1.77,.31,.91,.12,.74,0xc4b18b);box(group,0,1.92,.24,.53,.2,.53,0xe2cf9f);}
  if(kind!=='owl')box(group,0,1.31,.94,.17,.1,.035,0x66533e);
 }
 for(const shop of Object.values(SHOPS)){
  const stand=new T.Group();root.add(stand);stand.position.set(shop.x,0,shop.z);const cloth=Number.isFinite(shop.color)?shop.color:0x7a987e;
  box(stand,0,.24,-1.1,3.9,.12,3.0,0x9eac81);box(stand,0,.91,-1.8,3.35,1.15,.78,neutralWood);box(stand,0,1.54,-1.8,3.65,.16,.94,lightWood);box(stand,0,.7,-1.37,3.3,.15,.08,darkWood);
  for(const side of [-1,1]){box(stand,side*1.67,1.57,-1.9,.14,2.7,.14,lightWood);box(stand,side*1.67,1.57,-2.6,.14,2.7,.14,darkWood);}
  box(stand,0,2.92,-2.12,3.8,.2,1.8,cloth);box(stand,0,3.1,-2.3,3.1,.17,1.3,cloth);box(stand,0,2.75,-1.18,3.8,.27,.13,cloth);for(let i=0;i<5;i++)box(stand,-1.5+i*.75,2.75,-1.1,.17,.27,.06,cream);
  box(stand,0,2.47,-1.37,1.27,.38,.12,darkWood);box(stand,0,2.47,-1.29,1.12,.25,.045,lightWood);box(stand,0,2.49,-1.255,.19,.18,.025,cloth);products(stand,shop);consolidate(stand,`npc-shop-stand-${shop.id}`);
  const npc=new T.Group();npc.position.set(shop.x,.18,shop.z);root.add(npc);animal(npc,shop);consolidate(npc,`npc-shop-animal-${shop.id}`);
  const button=document.createElement('button');button.type='button';button.className='npc-label';button.dataset.npc=shop.id;button.setAttribute('aria-label',`Falar com ${shop.npc} — ${shop.name}`);Object.assign(button.style,{position:'absolute',transform:'translate(-50%,-100%)',pointerEvents:'auto'});
  const mark=document.createElement('span');mark.className='npc-label-mark';mark.textContent=shop.id==='smith'?'⚒':['enchanter','runemaster'].includes(shop.id)?'✦':shop.id==='books'?'▤':shop.id==='consumables'?'✚':'◆';const text=document.createElement('span');text.className='npc-label-text';const name=document.createElement('b');name.textContent=shop.npc;const role=document.createElement('small');role.textContent=({equipment:'Equipamentos',consumables:'Poções',books:'Livros de XP',smith:'Ferreiro',enchanter:'Imbuições',runemaster:'Runas permanentes'})[shop.id];const hint=document.createElement('em');hint.className='npc-label-hint';hint.textContent='Conversar';text.append(name,role,hint);button.append(mark,text);labels.append(button);
  button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();});button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!state||(state.phase==='preparation'||state.options?.mode==='linewars'&&state.phase==='wave'))onTalk(shop.id);});stores.push({shop,npc,stand,button,hint,position:new T.Vector3(),lastFrame:-1});
 }
 return{
  update(next,camera,container,playerId){
   if(disposed)return;state=next;const visible=!state||(state.phase==='preparation'||state.options?.mode==='linewars'&&state.phase==='wave');root.visible=visible;labels.hidden=!visible;if(!visible)return;
   const own=state?.units.find(u=>u.id===state.players[playerId]),time=state?.time??performance.now()/1000,width=container.clientWidth,height=container.clientHeight;
   for(const [i,entry]of stores.entries()){
    const {shop,npc,button,hint,position}=entry,frame=Math.floor(time*8+i*2)%8;if(frame!==entry.lastFrame){entry.lastFrame=frame;npc.position.y=.18+[0,.018,.035,.018,0,-.012,-.018,-.012][frame];npc.rotation.z=[0,.012,.016,.008,0,-.008,-.012,-.008][frame];}
    position.set(shop.x,3.05,shop.z+.18).project(camera);const onscreen=position.z>=-1&&position.z<=1&&Math.abs(position.x)<1.1&&Math.abs(position.y)<1.15;button.hidden=!onscreen;if(!onscreen)continue;button.style.left=`${(position.x*.5+.5)*width}px`;button.style.top=`${(-position.y*.5+.5)*height}px`;
    const distance=own?Math.hypot(own.x-shop.x,own.z-shop.z):null,near=distance!==null&&distance<=shop.range+(own?.shopInteraction===shop.id?.35:0);button.classList.toggle('npc-near',near);button.classList.toggle('npc-engaged',own?.shopInteraction===shop.id);hint.textContent=distance===null?'Conhecer':near?'Conversar · ao alcance':`Aproximar · ${distance.toFixed(1)}m`;button.title=`${shop.npc} · ${shop.role}. Alcance de atendimento: ${shop.range}m.`;
   }
  },
  pick(point){if(disposed||state&&state.phase!=='preparation'||!Number.isFinite(point?.x)||!Number.isFinite(point?.z))return null;return stores.filter(s=>Math.hypot(point.x-s.shop.x,point.z-s.shop.z)<1.1).sort((a,b)=>Math.hypot(point.x-a.shop.x,point.z-a.shop.z)-Math.hypot(point.x-b.shop.x,point.z-b.shop.z))[0]?.shop.id||null;},
  dispose(){if(disposed)return;disposed=true;root.removeFromParent();labels.remove();for(const geometry of ownedGeometry)geometry.dispose();ownedGeometry.clear();root.clear();}
 };
}
