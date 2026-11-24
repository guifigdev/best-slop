const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={gold:'<path d="m4 10 8-7 8 7-8 11z"/>',wood:'<path d="m5 18 12-12 4 4L9 22zM3 6l4-4 4 4-4 4z"/>',blood:'<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13z"/>',essence:'<path d="m12 2 8 10-8 10-8-10zM12 7v10m-5-5h10"/>',score:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'};
export function hudResources(state,unit){if(!state||!unit)return[];const list=[],mode=state.options?.mode;const add=(key,label,value)=>{if(Number.isFinite(value))list.push({key,label,value:Math.floor(value)});};add('gold',mode==='bonk'?'Zeny':'Ouro',unit.gold);if(['castlefight','treetag','kodotag'].includes(mode))add('wood','Madeira',unit.lumber||0);if(mode==='bloody')add('blood','Sangue',unit.btBlood||0);if(['campaign','tower','war','best','dungeon'].includes(mode)&&unit.essence>0)add('essence','Essência',unit.essence);if(mode==='warlock')add('score','Pontos',unit.score||0);return list;}
export function hudResourceMarkup(state,unit){return hudResources(state,unit).map(r=>`<span class="hud-resource hud-resource-${r.key}" title="${esc(r.label)}" aria-label="${esc(r.label)}: ${r.value}"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[r.key]}</svg><b>${r.value.toLocaleString('pt-BR')}</b></span>`).join('');}
export function hudPanelTitle(state){return({castlefight:'Construções',treetag:'Seu acampamento',kodotag:'Seu acampamento',warlock:'Grimório',bloody:'Exército',phasekiller:'Investigação',bonk:'Personagem'})[state?.options?.mode]||'Seu herói';}

export const hudGameName=state=>({bonk:'RAGNAROK',castlefight:'CASTLE FIGHT',treetag:'TREE TAG',kodotag:'KODO TAG',warlock:'WARLOCK',bloody:'BLOODY TOURNAMENT',linewars:'GUERRA DAS LINHAS',dungeon:'DUNGEON',phasekiller:'PHASE KILLER'})[state?.options?.mode]||'CUSTOM HERO';

// Expose capabilities, not a universal menu. An empty bag remains useful in
// equipment modes, but games with no inventory must not advertise one.
export function hudLauncherActions(state,unit){
 if(!state||!unit)return[];
 const mode=state.options?.mode||'campaign',actions=[{action:'character',label:({bloody:'Exército',kodotag:'Unidades',castlefight:'Unidades',phasekiller:'Investigação',warlock:'Grimório'})[mode]||'Personagem',art:'panel'}];
 if(!['kodotag','bloody'].includes(mode))actions.push({action:'inventory',label:'Mochila',art:'bag'});
 return actions;
}
