import * as T from 'three';
const roles=Object.freeze({kafra:['Kafra','Armazém da conta','▣'],potionShop:['Vendedora','Poções','✚'],equipmentShop:['Mercador','Equipamentos','◆'],healer:['Curandeira','Recuperar PV e SP','✚'],blacksmith:['Ferreiro','Refino e reparos','⚒'],secretMerchant:['Mercador viajante','Equipamentos especiais','◆']});
export const RO_NPC_LABEL_BUDGET=Object.freeze({labels:8,distance:48});
export function roNpcLabelEntries(state,hero){if(state?.options?.mode!=='bonk')return[];return (state.bonk?.objects||[]).filter(o=>roles[o.type]&&!o.used&&Math.hypot(o.x-(hero?.x||0),o.z-(hero?.z||0))<RO_NPC_LABEL_BUDGET.distance).sort((a,b)=>Math.hypot(a.x-(hero?.x||0),a.z-(hero?.z||0))-Math.hypot(b.x-(hero?.x||0),b.z-(hero?.z||0))).slice(0,RO_NPC_LABEL_BUDGET.labels).map(o=>({...o,labelName:roles[o.type][0],labelRole:roles[o.type][1],labelMark:roles[o.type][2]}));}
export function createRoNpcLabels({container,onTalk=()=>{}}){
 const doc=container?.ownerDocument;if(!doc)return{update(){},reset(){},stats:()=>({labels:0})};
 const root=doc.createElement('div');root.className='market-labels ro-npc-label-layer';root.setAttribute('aria-label','Serviços próximos');container.append(root);const pool=new Map(),point=new T.Vector3();let visible=0;
 function reset(){for(const el of pool.values())el.remove();pool.clear();visible=0;}
 return{update(state,camera,ownerId,heightAt=()=>0){const hero=state?.units?.find(u=>u.id===ownerId)||state?.units?.find(u=>u.bonkHero&&u.alive!==false),entries=roNpcLabelEntries(state,hero),shown=new Set(),rectangles=[];visible=0;
  for(const o of entries){point.set(o.x,heightAt(o.x,o.z)+3.25,o.z).project(camera);if(point.z< -1||point.z>1||Math.abs(point.x)>.95||Math.abs(point.y)>.95)continue;shown.add(o.id);let button=pool.get(o.id);
   if(!button){button=doc.createElement('button');button.type='button';button.className='npc-label ro-npc-label';button.dataset.roNpcLabel=o.id;const mark=doc.createElement('span');mark.className='npc-label-mark';mark.textContent=o.labelMark;const text=doc.createElement('span');text.className='npc-label-text';const name=doc.createElement('b');name.textContent=o.labelName;const role=doc.createElement('small');role.textContent=o.labelRole;text.append(name,role);button.append(mark,text);button.setAttribute('aria-label','Conversar com '+o.labelName+' · '+o.labelRole);button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('click',e=>{e.stopPropagation();onTalk(o);});pool.set(o.id,button);root.append(button);}
   const w=button.offsetWidth||174,h=button.offsetHeight||44,x=Math.max(w/2+8,Math.min(container.clientWidth-w/2-8,(point.x*.5+.5)*container.clientWidth));let y=(-point.y*.5+.5)*container.clientHeight;for(const r of rectangles)if(Math.abs(r.x-x)<(r.w+w)/2+6&&y-h<r.y+6&&y>r.y-r.h-6)y=r.y-r.h-7;y=Math.max(h+12,y);rectangles.push({x,y,w,h});button.style.left=x+'px';button.style.top=y+'px';button.classList.toggle('near',!!hero&&Math.hypot(o.x-hero.x,o.z-hero.z)<8);visible++;
  }
  for(const [id,el]of pool)if(!shown.has(id)){el.remove();pool.delete(id);}
 },reset,stats:()=>({labels:visible}),dispose(){reset();root.remove();}};
}
