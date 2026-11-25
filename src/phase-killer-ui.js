import {PHASE_KILLER_SKILLS as SKILLS, PHASE_KILLER_ITEMS as ITEMS, PHASE_KILLER_RECIPES as RECIPES, PHASE_KILLER_WORLD_RECIPES as WORLD_RECIPES, PHASE_KILLER_FORMS as FORMS, phaseKillerSkillAt} from '../shared/phase-killer-catalog.js';
import {phaseKillerPortrait} from './phase-killer-art.js';
import {gameIllustration} from './game-illustrations.js';
import {patchHTML} from './snapshot-dom.js';
import {escapeHTML as esc} from './competition-ui.js';

const HOTKEYS=['Q','W','E','R','D','F','C'];
const roles={killer:'Assassino dimensional',phaser:'Viajante etéreo',townsfolk:'Habitante'};
const worlds={normal:'Aldeia',aether:'Aetherworld',omni:'Omniworld'};
const statNames={armor:'Armadura',damage:'Ataque',bonusDamage:'Dano adicional',movementSpeed:'Movimento',moveSpeed:'Movimento',attackInterval:'Intervalo de ataque',attackSpeed:'Velocidade de ataque',blockChance:'Chance de bloqueio',blockMinimumDamage:'Dano mínimo para bloquear',blockAmount:'Dano bloqueado',hp:'Vida máxima',mana:'Mana máxima',hpRegen:'Vida por segundo',manaRegen:'Mana por segundo',manaRegenPercent:'Regeneração de mana',lifesteal:'Roubo de vida',criticalChance:'Chance de crítico',criticalMultiplier:'Multiplicador crítico',evasion:'Esquiva',cleave:'Dano em área',cleaveRadius:'Raio do dano em área',range:'Alcance',magicDefense:'Defesa mágica'};
const percentages=new Set(['attackSpeed','blockChance','manaRegenPercent','lifesteal','criticalChance','evasion','cleave','moveSpeed']);
const clock=n=>{n=Math.floor(Math.max(0,Number(n)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
const num=n=>(Number(n)||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
const own=(object,key)=>Object.hasOwn(object||{},key);
const inventory=u=>Array.isArray(u?.inventory)?u.inventory:[];
const remaining=(u,key)=>Math.max(0,Number(u?.cooldowns?.[key])||0);
const groupMembers=key=>(SKILLS[key]?.children||String(SKILLS[key]?.nativeData?.DataA||'').split(',')).filter(k=>own(SKILLS,k));
const art=(kind,key)=>gameIllustration('phasekiller',kind,key);
const portrait=value=>phaseKillerPortrait(value)||phaseKillerPortrait('townsperson');
const detailArt=(kind,key)=>`<div class="pk-detail-art">${art(kind,key)}</div>`;

// The snapshot contains only the viewer's available abilities. Group entries
// expose their native spellbook children without treating the book as a cast.
export function phaseKillerAvailableSkills(u){
 if(!u)return [];
 const keys=[...(u.skills||[])].filter(k=>!u.pkGhost||['A000','A01C'].includes(k));
 if(!u.pkGhost)keys.push(...inventory(u).flatMap(e=>ITEMS[e?.key]?.skills||[]));
 for(let i=0;i<keys.length;i++)if(SKILLS[keys[i]]?.kind==='group')for(const child of groupMembers(keys[i]))if(!keys.includes(child))keys.push(child);
 return [...new Set(keys)].filter(k=>own(SKILLS,k));
}

export function phaseKillerActionBar(u){
 const keys=phaseKillerAvailableSkills(u),children=new Set(keys.filter(k=>SKILLS[k].kind==='group').flatMap(groupMembers));
 return keys.filter(k=>SKILLS[k].kind!=='passive'&&!children.has(k)).slice(0,7);
}

export function phaseKillerSkillStatus(u,key,{slot=null,finished=false,preparation=false}={}){
 const s=SKILLS[key],at=s?phaseKillerSkillAt(key,1):null;
 if(!s||!u||!phaseKillerAvailableSkills(u).includes(key))return {disabled:true,reason:'Habilidade indisponível.',cooldown:0};
 if(s.kind==='group'||s.kind==='passive')return {disabled:false,reason:s.kind==='group'?'Abrir opções':'Sempre ativa',cooldown:0};
 if(finished||preparation)return {disabled:true,reason:finished?'A partida terminou.':'Aguarde o início da partida.',cooldown:0};
 if(slot!=null){const e=inventory(u)[slot],d=ITEMS[e?.key];if(!d||!(d.skills||[]).some(parent=>parent===key||groupMembers(parent).includes(key)))return {disabled:true,reason:'Esse poder não pertence a este espaço.',cooldown:0};if(d.charges>0&&(e.charges??d.charges)<=0)return {disabled:true,reason:'O item não possui cargas.',cooldown:0};}
 const cd=remaining(u,key);
 if(cd>0)return {disabled:true,reason:'Em recarga: '+num(cd)+'s.',cooldown:cd};
 if((Number(u.mana)||0)<(at?.mana||0))return {disabled:true,reason:'Mana insuficiente: requer '+num(at.mana)+'.',cooldown:0};
 if(u.stun>0)return {disabled:true,reason:'Você está atordoado.',cooldown:0};
 if(s.family?.startsWith('upgrade')){const property=s.family.slice(7).toLowerCase(),level=u.pkUpgrades?.[property]||0;if(level>=3)return {disabled:true,reason:'Melhoria no nível máximo (3).',cooldown:0};if((u.pkSouls||0)<level+1)return {disabled:true,reason:'Requer '+(level+1)+' alma'+(level?'s':'')+'.',cooldown:0};}
 return {disabled:false,reason:'Pronta para usar',cooldown:0};
}

const statusOptions=(state,slot=null)=>({slot,finished:!!state?.phaseKiller?.finished,preparation:state?.phase==='preparation'});
const skillTooltip=(u,key,state,slot=null)=>{const s=SKILLS[key],at=phaseKillerSkillAt(key,1),status=phaseKillerSkillStatus(u,key,statusOptions(state,slot));return s.name+' · '+s.description+(s.kind==='active'?' · Mana '+num(at.mana)+' · Recarga '+num(at.cooldown)+'s':'')+' · '+status.reason;};

export function phaseKillerSkillGridMarkup(u,state,{group=null,selected=null}={}){
 const all=phaseKillerAvailableSkills(u),children=new Set(all.filter(k=>SKILLS[k].kind==='group').flatMap(groupMembers));
 const keys=group?groupMembers(group).filter(k=>all.includes(k)):all.filter(k=>!children.has(k));
 if(!keys.length)return '<p class="pk-empty">Suas habilidades aparecem aqui quando a partida começar.</p>';
 return '<div class="pk-skill-grid">'+keys.map(key=>{const s=SKILLS[key],status=phaseKillerSkillStatus(u,key,statusOptions(state));return `<button type="button" data-pk-skill="${key}" class="${selected===key?'selected ':''}${status.disabled?'unavailable':''}" aria-pressed="${selected===key}" title="${esc(skillTooltip(u,key,state))}">${art('skill',key)}<b>${esc(s.name)}</b><small>${s.kind==='group'?'Abrir opções':s.kind==='passive'?'Passiva':status.cooldown?num(status.cooldown)+'s':num(s.mana)+' mana'}</small></button>`;}).join('')+'</div>';
}

export function phaseKillerSkillDetailMarkup(u,key,state,{slot=null}={}){
 const s=SKILLS[key];if(!s||!phaseKillerAvailableSkills(u).includes(key))return '';
 const at=phaseKillerSkillAt(key,1),status=phaseKillerSkillStatus(u,key,statusOptions(state,slot));
 const upgrade=s.family?.startsWith('upgrade')?s.family.slice(7).toLowerCase():null,level=upgrade?u.pkUpgrades?.[upgrade]||0:0;
 return `<section class="legacy-detail pk-skill-detail" aria-label="${esc(s.name)}">${detailArt('skill',key)}<span class="pk-kicker">${s.kind==='group'?'Grimório':s.kind==='passive'?'Passiva':slot!=null?'Poder do item':'Habilidade'}</span><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p>${s.kind==='active'?`<dl><dt>Mana</dt><dd>${num(at.mana)}</dd><dt>Recarga</dt><dd>${num(at.cooldown)}s</dd>${at.damage?'<dt>Dano</dt><dd>'+num(at.damage)+'</dd>':''}${at.range&&s.target!=='self'?'<dt>Alcance</dt><dd>'+num(at.range)+'m</dd>':''}${at.radius?'<dt>Raio</dt><dd>'+num(at.radius)+'m</dd>':''}${upgrade?'<dt>Nível atual</dt><dd>'+level+' / 3</dd><dt>Próximo nível</dt><dd>'+(level<3?(level+1)+' alma'+(level?'s':''):'Máximo')+'</dd>':''}</dl><button type="button" data-pk-cast="${key}" ${slot!=null?`data-pk-cast-slot="${slot}"`:''} ${status.disabled?'disabled':''}>${upgrade?'Melhorar':s.target==='self'?'Usar':'Mirar'} · ${esc(s.name)}</button><small class="pk-action-reason">${esc(status.reason)}</small>`:s.kind==='passive'?'<p class="pk-action-reason">Sempre ativa enquanto disponível.</p>':'<p class="pk-action-reason">Escolha uma das opções abaixo.</p>'}</section>`;
}

export function phaseKillerItemDetailMarkup(u,slot,state){
 const e=inventory(u)[slot],d=ITEMS[e?.key];if(!d)return '<div class="pk-empty"><h3>Explore os baús</h3><p>Clique em um baú no cenário para caminhar até ele. Selecione um item na mochila para ver seus efeitos.</p></div>';
 const locked=u.pkGhost||!!state?.phaseKiller?.finished,skills=(d.skills||[]).filter(k=>SKILLS[k]),equip=skills.filter(k=>SKILLS[k].family?.startsWith('equip')),use=skills.filter(k=>!equip.includes(k));
 const stats=Object.entries(d.stats||{}).map(([k,v])=>`<dt>${esc(statNames[k]||k)}</dt><dd>${num(percentages.has(k)?v*100:v)}${percentages.has(k)?'%':k==='criticalMultiplier'?'×':k==='attackInterval'?'s':''}</dd>`).join('');
 const button=k=>{const s=SKILLS[k],status=phaseKillerSkillStatus(u,k,statusOptions(state,slot));return `<button type="button" data-pk-item-cast="${k}" data-pk-cast-slot="${slot}" ${locked||status.disabled?'disabled':''} title="${esc(skillTooltip(u,k,state,slot))}">${art('skill',k)}<span>${s.kind==='group'?'Abrir':equip.includes(k)?'Equipar':'Usar'} · ${esc(s.name)}</span>${status.cooldown?'<small>'+num(status.cooldown)+'s</small>':''}</button>`;};
 return `<section class="legacy-detail pk-item-detail">${detailArt('item',d.key)}<span class="pk-kicker">Mochila · espaço ${slot+1}${d.innate?' · inato':''}</span><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p>${d.charges>0?`<p class="pk-charges">${num(e.charges??d.charges)} carga(s) restante(s)</p>`:''}${stats?'<dl>'+stats+'</dl>':''}${!skills.length?'<p class="pk-action-reason">Os efeitos deste equipamento são automáticos enquanto ele estiver na mochila.</p>':''}<div class="pk-item-actions">${[...equip,...use].map(button).join('')}</div><div class="pk-secondary-actions"><button type="button" data-pk-combine="${slot}" ${locked||d.innate?'disabled':''}>Combinar…</button><button type="button" data-pk-drop="${slot}" ${locked||d.innate||d.droppable===false?'disabled':''}>Largar item no chão</button></div>${d.innate?'<small class="pk-action-reason">Poder inato da sua forma; não pode ser descartado.</small>':''}</section>`;
}

export function phaseKillerHelpMarkup(){
 return '<p>Phase Killer · identidades secretas. Os papéis são sorteados durante a partida. Um jogador é o assassino; os demais investigam e procuram equipamentos. Phase leva os viajantes a Aetherworld. O assassino pode mudar de forma e imitar a identidade e a voz de um habitante.</p><p>Botão direito move ou ataca. Clique em um baú para caminhar até ele. Q, W, E, R, D, F e C acionam sua barra; os livros abrem um grupo de poderes. 1–6 abrem os itens da mochila. Escolha Usar ou Equipar para ativar um item. Combinar permite escolher um segundo espaço; arrastar um item sobre outro também combina.</p><p>Enter abre o chat transparente à esquerda; Enter envia e Esc fecha. O chat é compartilhado com a sala online. Fantasmas atravessam mundos e observam; falar custa mana e distorce sua voz. Para abrir o portal de Omniworld, combine os ingredientes no local indicado em Aetherworld. Consulte as receitas no Caderno.</p><p>Treino local usa bots. Salas online exigem o servidor. Valores e regras documentados de Phase Killer 1.2.8; arte e controles adaptados para navegador.</p>';
}

export function phaseKillerChatLogMarkup(messages=[]){return messages.slice(-80).map(m=>`<p data-pk-message="${esc(m.id)}" class="${m.ghost?'ghost':m.system?'system':''}"><b>${esc(m.name)}:</b> <span>${esc(m.text)}</span></p>`).join('');}
export function phaseKillerChatOverlayMarkup(){return '<div id="pk-chat-log" role="log" aria-label="Mensagens da aldeia" aria-live="polite" aria-relevant="additions text"></div><button type="button" id="pk-chat-toggle" aria-controls="pk-chat-form" aria-expanded="false">Chat · Enter</button><form id="pk-chat-form" hidden><label for="pk-chat-input">Aldeia:</label><input id="pk-chat-input" maxlength="240" autocomplete="off" placeholder="Mensagem para a aldeia…"><button type="submit" aria-label="Enviar mensagem">Enviar</button><button type="button" id="pk-chat-close" aria-label="Fechar chat">×</button><small>Enter envia · Esc fecha</small></form>';}

export function createPhaseKillerUI({send,getState,getOwner,view={},toast=()=>{},onEnd=()=>{},getRoom=()=>null}){
 let page='skills',selectedSkill=null,selectedGroup=null,selectedItem=null,combineFrom=null,aim=null,aimSlot=null,hoverSkill=null,inspect=null,lastDimension=null,ended=false;
 let chatDraft='',chatOpen=false,lastChatHTML=null,lastContentHTML=null,shopHost=null,chatOverlay=null;
 const state=()=>getState?.();
 const hero=()=>{const s=state();return s?.units?.find(u=>u.id===s.players?.[getOwner()]);};
 const el=id=>globalThis.document?.getElementById(id);
 const text=(id,value)=>{const node=el(id);if(node)node.textContent=value;};
 const command=(type,extra={})=>send({type:'pk'+type,...extra});
 const itemSlotFor=key=>inventory(hero()).findIndex(e=>(ITEMS[e?.key]?.skills||[]).some(parent=>parent===key||groupMembers(parent).includes(key)));
 function cancel(){aim=null;aimSlot=null;hoverSkill=null;view.setInteraction?.('command');}
 function openPage(next){page=next;}
 function openItem(slot){const u=hero();if(!inventory(u)[slot])return;selectedItem=slot;openPage('items');}
 function chooseSkill(key,slot=null){
  const u=hero(),s=SKILLS[key];if(!u||!s||!phaseKillerAvailableSkills(u).includes(key))return false;
  selectedSkill=key;
  if(s.kind==='group'){cancel();selectedGroup=selectedGroup===key?null:key;openPage('skills');return true;}
  if(s.kind==='passive'){cancel();toast(s.description||'Passiva sempre ativa.');return true;}
  if(slot==null){const inferred=itemSlotFor(key);if(inferred>=0)slot=inferred;}
  const status=phaseKillerSkillStatus(u,key,statusOptions(state(),slot));if(status.disabled){toast(status.reason);return false;}
  cancel();
  if(s.target==='self')return command('Cast',{skill:key,...(slot!=null?{itemSlot:slot}:{}),...(s.family==='shift'?{form:u.pkForm||'beast'}:{})})!==false;
  aim=key;aimSlot=slot;view.setInteraction?.('ground');toast('Escolha '+(s.target==='unit'?'um alvo':'um local')+' para '+s.name+'.');return true;
 }
 function point({point,unit,button,pkLoot,pkCorpse,pkGateway,pkField}={}){
  const u=hero();if(!u||!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return;
  if(button===2){cancel();if(pkField)command('Attack',{target:pkField});else if(pkLoot&&!u.pkGhost)command('Pickup',{lootId:pkLoot});else if(unit&&unit.id!==u.id&&!u.pkGhost)command('Attack',{target:unit.id});else command('Move',{x:point.x,z:point.z});view.mark?.(point);return;}
  if(button!==0)return;
  if(aim){
   if(aim==='move'){if(command('Move',{x:point.x,z:point.z})!==false)cancel();return;}
   const status=phaseKillerSkillStatus(u,aim,statusOptions(state(),aimSlot));if(status.disabled){toast(status.reason);cancel();return;}
   const s=SKILLS[aim];if(s?.target==='unit'&&!unit&&!pkCorpse){toast('Selecione um alvo para '+s.name+'.');return;}
   if(command('Cast',{skill:aim,x:point.x,z:point.z,...(unit||pkCorpse?{target:unit?.id??pkCorpse}:{}),...(aimSlot!=null?{itemSlot:aimSlot}:{})})!==false)cancel();return;
  }
  if(pkField){inspect=pkField;openPage('people');return;}if(pkLoot){if(u.pkGhost)toast('Fantasmas não carregam itens.');else command('Pickup',{lootId:pkLoot});return;}
  if(pkGateway){command('Gateway');return;}
  if(unit){inspect=unit.id;view.setInspected?.(unit.id);openPage('people');return;}
  if(pkCorpse&&u.pkRole==='killer'&&phaseKillerAvailableSkills(u).includes('A019'))chooseCorpse(pkCorpse,point);
 }
 function chooseCorpse(id,point){selectedSkill='A019';const status=phaseKillerSkillStatus(hero(),'A019',statusOptions(state()));if(status.disabled)toast(status.reason);else command('Cast',{skill:'A019',target:id,x:point.x,z:point.z});}
 function focusChat(){if(chatOpen)return sendChat();cancel();chatOpen=true;ensureChat();const s=state(),u=hero();if(s&&u)renderChat(s,u);const log=el('pk-chat-log');if(log)log.scrollTop=log.scrollHeight;el('pk-chat-input')?.focus();return true;}
 function closeChat(){const input=el('pk-chat-input');if(input)chatDraft=input.value;chatOpen=false;if(chatOverlay)chatOverlay.classList.remove('is-open');if(el('pk-chat-form'))el('pk-chat-form').hidden=true;el('pk-chat-toggle')?.setAttribute('aria-expanded','false');input?.blur();view.canvas?.focus?.({preventScroll:true});return true;}
 function hotkeys(){return Object.fromEntries([['M','move'],['S','stop'],['ENTER','chat'],...phaseKillerActionBar(hero()).map((key,i)=>[HOTKEYS[i],key])]);}
 function shortcut(type,value){
  if(type==='legacySkill'){
   if(value==='move'){cancel();aim='move';view.setInteraction?.('ground');}
   else if(value==='stop'){cancel();command('Stop');}
   else if(value==='chat')focusChat();else chooseSkill(value);
  }else if(type==='item')openItem(Number(value));
  else if(type==='escape'){if(chatOpen)closeChat();else if(combineFrom!=null)combineFrom=null;else cancel();}
  else if(type==='stop'||type==='hold'){cancel();command('Stop');}
  else if(type==='move'||type==='attackMove'){cancel();aim='move';view.setInteraction?.('ground');}
  else if(type==='center'){const u=hero();if(u)view.focusPoint?.({...u,distance:48});}
 }
 function skillPreview(){
  const u=hero(),key=aim||hoverSkill,s=SKILLS[key];if(!u||!s||s.kind!=='active'||s.target==='self'||!phaseKillerAvailableSkills(u).includes(key))return null;
  const at=phaseKillerSkillAt(key,1);return {sourceId:u.id,key,mode:aim?'aim':'hover',skill:{...s,...at,castRange:at.range||8,target:s.target,radius:at.radius||0,previewShape:['boneBlast','aetherPulse','aethralLance','destructionBlast'].includes(s.family)?'line':null}};
 }
 function sendChat(){
  const input=el('pk-chat-input'),message=String(input?.value??chatDraft).trim();
  if(!message){closeChat();return false;}
  if(hero()?.pkGhost&&(hero().mana||0)<10){toast('O fantasma precisa de 10 de mana para falar.');return false;}
  if(command('Chat',{text:message})===false)return false;
  chatDraft='';if(input)input.value='';closeChat();return true;
 }
 function bindSpell(button,key,slot=null){button.onclick=()=>chooseSkill(key,slot);button.onpointerenter=()=>{hoverSkill=key;};button.onpointerleave=()=>{if(hoverSkill===key)hoverSkill=null;};button.onfocus=()=>{hoverSkill=key;};button.onblur=()=>{if(hoverSkill===key)hoverSkill=null;};}
 function inventoryMarkup(u){return Array.from({length:6},(_,slot)=>{const e=inventory(u)[slot],d=ITEMS[e?.key],locked=slot>=(u.inventorySlots??2),selected=selectedItem===slot&&page==='items';return `<button type="button" class="inventory-slot ${selected?'selected ':''}${combineFrom===slot?'combining':''}" data-pk-slot="${slot}" ${d&&!d.innate&&!u.pkGhost?'draggable="true"':''} ${locked?'disabled':''} aria-label="${esc((slot+1)+': '+(locked?'Espaço bloqueado':d?.name||'Espaço vazio'))}" aria-pressed="${selected}" title="${esc(locked?'Espaço bloqueado nesta forma':d?d.name+' · '+d.description:'Espaço vazio')}"><small>${slot+1}</small>${d?art('item',e.key):'<span aria-hidden="true">'+(locked?'▧':'+')+'</span>'}${d?.charges>0?'<em>×'+num(e.charges??d.charges)+'</em>':''}</button>`;}).join('');}
 function bindInventory(){for(const b of el('inventory')?.querySelectorAll('[data-pk-slot]')||[]){
  b.onclick=()=>{const slot=Number(b.dataset.pkSlot);if(combineFrom!=null&&slot!==combineFrom){if(!inventory(hero())[slot]){toast('Escolha um segundo item ocupado.');return;}command('Combine',{from:combineFrom,to:slot});combineFrom=null;}openItem(slot);};
  b.ondragstart=e=>{e.dataTransfer?.setData('application/x-phase-slot',b.dataset.pkSlot);};
  b.ondragover=e=>{if(inventory(hero())[Number(b.dataset.pkSlot)])e.preventDefault();};
  b.ondrop=e=>{e.preventDefault();const raw=e.dataTransfer?.getData('application/x-phase-slot');if(!/^\d+$/.test(raw||''))return;const from=Number(raw),to=Number(b.dataset.pkSlot);if(from!==to&&inventory(hero())[from]&&inventory(hero())[to])command('Combine',{from,to});};
 }}
 function ensureShop(){
  const host=el('shop');if(!host)return false;
  if(shopHost===host&&el('pk-panel-content')?.parentNode===host)return true;
  shopHost=host;lastContentHTML=null;
  patchHTML(host,'<nav class="legacy-tabs pk-tabs" aria-label="Painel do personagem" id="pk-tabs"></nav><div id="pk-panel-content"></div>',['id']);
  return true;
 }
 function ensureChat(){
  const world=el('world');if(!world)return false;
  if(chatOverlay&&chatOverlay.parentNode===world)return true;
  chatOverlay=el('pk-overlay-chat');
  if(!chatOverlay||chatOverlay.parentNode!==world){chatOverlay=document.createElement('section');chatOverlay.id='pk-overlay-chat';chatOverlay.className='pk-overlay-chat';chatOverlay.setAttribute('aria-label','Chat da aldeia');chatOverlay.innerHTML=phaseKillerChatOverlayMarkup();world.append(chatOverlay);}
  lastChatHTML=null;
  const input=el('pk-chat-input');if(input){input.value=chatDraft;input.oninput=()=>{chatDraft=input.value;};input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();sendChat();}else if(e.key==='Escape'){e.preventDefault();closeChat();}};}
  const form=el('pk-chat-form');if(form){form.hidden=!chatOpen;form.onsubmit=e=>{e.preventDefault();sendChat();};form.onpointerdown=e=>e.stopPropagation();}
  const toggle=el('pk-chat-toggle');if(toggle)toggle.onclick=focusChat;
  const close=el('pk-chat-close');if(close)close.onclick=closeChat;
  return true;
 }
 function skillsMarkup(u,s){
  const available=phaseKillerAvailableSkills(u);if(selectedSkill&&!available.includes(selectedSkill))selectedSkill=null;if(selectedGroup&&!available.includes(selectedGroup))selectedGroup=null;
  let html='<div class="pk-panel-heading"><h3>Seus poderes</h3><p>Os livros reúnem opções. Selecione um ícone para consultar seus efeitos.</p></div>'+phaseKillerSkillGridMarkup(u,s,{selected:selectedGroup||selectedSkill});
  if(selectedGroup){html+=`<section class="pk-spellbook"><div class="pk-group-heading"><h3>${esc(SKILLS[selectedGroup].name)}</h3><button type="button" data-pk-close-group aria-label="Fechar grupo">Fechar</button></div><p>${esc(SKILLS[selectedGroup].description)}</p><p class="pk-group-resource">${SKILLS[selectedGroup].family==='improvements'?num(u.pkSouls)+' almas disponíveis':num(u.pkBlood)+' sangue no frasco · orbe do espaço 1: '+esc(ITEMS[inventory(u)[0]?.key]?.name||'nenhum')}</p>${phaseKillerSkillGridMarkup(u,s,{group:selectedGroup,selected:selectedSkill})}</section>`;}
  if(selectedSkill&&SKILLS[selectedSkill]?.kind!=='group')html+=phaseKillerSkillDetailMarkup(u,selectedSkill,s);
  if(u.pkRole==='killer'&&!u.pkGhost){
   html+=`<details class="pk-secret"><summary>Sua forma e identidade <small>Visível só para você</small></summary><p>Escolha sua forma antes de se transformar. Sua aparência atual permanece pública; seu papel é secreto.</p><div class="pk-form-grid">${Object.values(FORMS).map(f=>`<button type="button" data-pk-form="${f.key}" ${u.pkMonster||s.phaseKiller?.finished?'disabled':''} class="${u.pkForm===f.key?'selected':''}" aria-pressed="${u.pkForm===f.key}">${portrait(f.key)}<b>${esc(f.name)}</b><small>${esc(f.description)}</small></button>`).join('')}</div><h3>Imitar identidade e voz</h3><p>Exige forma humana e pelo menos 100 de poder.</p><label for="pk-disguise">Habitante a imitar</label><select id="pk-disguise"><option value="">Escolha um habitante</option>${(s.phaseKiller?.roster||[]).filter(t=>t.owner!==getOwner()).map(t=>`<option value="${esc(t.owner)}">${esc(t.name)}</option>`).join('')}</select><button type="button" data-pk-disguise ${u.pkMonster||u.pkPower<100||s.phaseKiller?.finished?'disabled':''}>Assumir disfarce</button></details>`;
  }
  return html;
 }
 function itemsMarkup(u,s){
  let html='<div class="pk-panel-heading"><h3>Sua mochila</h3><p>Selecione um dos seis espaços no HUD. Os espaços disponíveis dependem da sua forma.</p></div>';
  if(u.pkGhost)return html+'<p class="pk-empty">Fantasmas não carregam nem usam equipamentos.</p>';
  if(combineFrom!=null)html+=`<div class="pk-combine-notice" role="status">Escolha o segundo item da combinação.<button type="button" data-pk-cancel-combine>Cancelar</button></div>`;
  html+=phaseKillerItemDetailMarkup(u,selectedItem,s);
  if(selectedItem!=null&&inventory(u)[selectedItem]){const key=inventory(u)[selectedItem].key;const compatible=RECIPES.filter(r=>!r.internal&&r.inputs.includes(key));if(compatible.length)html+='<h3 class="pk-subheading">Combina com</h3><div class="pk-item-matches">'+[...new Set(compatible.flatMap(r=>r.inputs.filter(k=>k!==key)))].map(k=>`<span title="${esc(ITEMS[k]?.description||'')}">${art('item',k)}<small>${esc(ITEMS[k]?.name||k)}</small></span>`).join('')+'</div>';}
  return html;
 }
 function journalMarkup(){
  const item=k=>`<span title="${esc(ITEMS[k]?.description||'')}">${art('item',k)}<small>${esc(ITEMS[k]?.name||k)}</small></span>`;
  return '<div class="pk-panel-heading"><h3>Caderno de combinações</h3><p>Reúna os ingredientes na mochila; use Combinar ou arraste um sobre o outro.</p></div><section class="pk-gateway-recipe"><h3>Portal de Omniworld</h3><p>Combine estes ingredientes no local do portal em Aetherworld. A combinação abre uma passagem para todos, sem criar um item.</p><div class="pk-recipes">'+WORLD_RECIPES.map(r=>'<article>'+r.inputs.map(item).join('<b aria-label="mais">+</b>')+'<b aria-label="abre">→</b><span>'+art('skill','A01C')+'<small>Portal</small></span></article>').join('')+'</div></section><div class="pk-recipes">'+RECIPES.filter(r=>!r.internal).map(r=>'<article>'+r.inputs.map(item).join('<b aria-label="mais">+</b>')+'<b aria-label="produz">→</b>'+r.outputs.map(item).join('')+'</article>').join('')+'</div>';
 }
 function peopleMarkup(s){
  const p=s.phaseKiller,u=hero();let html='<div class="pk-panel-heading"><h3>Habitantes</h3><p>Identidades podem ser imitadas. Os papéis só serão revelados ao final.</p></div><div class="pk-people">'+(p?.roster||[]).map(t=>{const visible=s.units?.find(v=>v.owner===t.owner&&v.pkHuman!==false);return `<article>${portrait(visible||'townsperson')}<span><b>${esc(t.name)}${t.owner===getOwner()?' · você':''}</b><small>${t.ghost?'Espírito':p?.finished&&roles[t.role]?esc(roles[t.role]):'Papel desconhecido'}</small></span></article>`;}).join('')+'</div>';
  const target=s.units?.find(t=>t.id===inspect);if(target)html+=`<section class="legacy-detail pk-person-detail"><div class="pk-person-portrait">${portrait(target)}</div><span class="pk-kicker">${target.id===u?.id?'Seu personagem':'Personagem observado'}</span><h3>${esc(target.name)}</h3><dl><dt>Vida</dt><dd>${num(target.hp)} / ${num(target.maxHp)}</dd><dt>Ataque</dt><dd>${num(target.damage)}</dd><dt>Armadura</dt><dd>${num(target.armor)}</dd><dt>Movimento</dt><dd>${num(target.speed)}m/s</dd><dt>Alcance</dt><dd>${num(target.range)}m</dd></dl></section>`;
  const field=s.phaseKiller?.fields?.find(f=>f.id===inspect);if(field){const names={barricades:'Barricada',torchPlace:'Tocha',bonfirePlace:'Fogueira',storageCube:'Cubo de armazenamento',dynamite:'Dinamite',riftBomb:'Bomba dimensional',netTrap:'Armadilha de rede',poisonSpikeTrap:'Armadilha venenosa'};html+=`<section class="legacy-detail"><h3>${esc(names[field.family]||'Objeto')}</h3><p>Vida ${num(field.hp)} / ${num(field.maxHp)} · Armadura ${num(field.armor)}</p>${field.family==='storageCube'?`<h4>Guardar da mochila</h4><div class="pk-item-matches">${inventory(u).map((e,i)=>`<button type="button" data-pk-store="${i}" data-pk-field="${field.id}" title="${esc(ITEMS[e.key]?.name)}">${art('item',e.key)}</button>`).join('')}</div><h4>Itens guardados · ${(field.inventory||[]).length} / 3</h4><div class="pk-item-matches">${(field.inventory||[]).map((e,i)=>`<button type="button" data-pk-take="${i}" data-pk-field="${field.id}" title="Retirar: ${esc(ITEMS[e.key]?.name)}">${art('item',e.key)}</button>`).join('')}</div><p>Aproxime-se do cubo para guardar ou retirar itens.</p>`:''}</section>`;}
  return html;
 }
 function bindPanel(){const host=el('pk-panel-content');if(!host)return;
  for(const b of host.querySelectorAll('[data-pk-skill]')){b.onclick=()=>{const key=b.dataset.pkSkill;selectedSkill=key;if(SKILLS[key]?.kind==='group')selectedGroup=selectedGroup===key?null:key;};b.onpointerenter=()=>{hoverSkill=b.dataset.pkSkill;};b.onpointerleave=()=>{hoverSkill=null;};b.onfocus=()=>{hoverSkill=b.dataset.pkSkill;};b.onblur=()=>{hoverSkill=null;};}
  for(const b of host.querySelectorAll('[data-pk-cast]'))bindSpell(b,b.dataset.pkCast,b.hasAttribute('data-pk-cast-slot')?Number(b.dataset.pkCastSlot):null);
  for(const b of host.querySelectorAll('[data-pk-item-cast]'))bindSpell(b,b.dataset.pkItemCast,Number(b.dataset.pkCastSlot));
  for(const b of host.querySelectorAll('[data-pk-form]'))b.onclick=()=>{if(hero()?.pkRole==='killer')command('Form',{form:b.dataset.pkForm});};
  for(const b of host.querySelectorAll('[data-pk-drop]'))b.onclick=()=>{const slot=Number(b.dataset.pkDrop);if(command('Drop',{slot})!==false){selectedItem=null;combineFrom=null;}};
  for(const b of host.querySelectorAll('[data-pk-combine]'))b.onclick=()=>{combineFrom=Number(b.dataset.pkCombine);toast('Clique no segundo item da mochila.');};
  const closeGroup=host.querySelector('[data-pk-close-group]');if(closeGroup)closeGroup.onclick=()=>{selectedGroup=null;selectedSkill=null;};
  const close=host.querySelector('[data-pk-cancel-combine]');if(close)close.onclick=()=>{combineFrom=null;};
  for(const b of host.querySelectorAll('[data-pk-store]'))b.onclick=()=>command('Store',{fieldId:Number(b.dataset.pkField),slot:Number(b.dataset.pkStore)});for(const b of host.querySelectorAll('[data-pk-take]'))b.onclick=()=>command('Take',{fieldId:Number(b.dataset.pkField),slot:Number(b.dataset.pkTake)});
  const disguise=host.querySelector('[data-pk-disguise]');if(disguise)disguise.onclick=()=>{const owner=el('pk-disguise')?.value;if(owner&&hero()?.pkRole==='killer')command('Disguise',{owner});else toast('Escolha um habitante para imitar.');};
 }
 function renderChat(s,u){
  ensureChat();const p=s.phaseKiller,messages=p?.messages||s.phaseLobbyMessages||[],log=el('pk-chat-log'),html=phaseKillerChatLogMarkup(messages);
  if(log&&html!==lastChatHTML){const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<35,scroll=log.scrollTop;patchHTML(log,html,['data-pk-message']);lastChatHTML=html;log.scrollTop=atBottom?log.scrollHeight:scroll;}
  chatOverlay?.classList.toggle('is-open',chatOpen);
  const input=el('pk-chat-input'),form=el('pk-chat-form'),submit=form?.querySelector('[type=submit]');if(input){input.disabled=!!p?.finished;input.placeholder=u.pkGhost?'Falar custa 10 de mana…':'Mensagem para a aldeia…';}if(form)form.hidden=!chatOpen;if(submit)submit.disabled=!!p?.finished;
  el('pk-chat-toggle')?.setAttribute('aria-expanded',String(chatOpen));
 }
 function renderPanel(s,u){if(!ensureShop())return;
  renderChat(s,u);
  const tabMarkup=[['skills','Poderes'],['items','Mochila'],['journal','Caderno'],['people','Habitantes']].map(([key,label])=>`<button type="button" data-pk-page="${key}" class="${page===key?'selected':''}" aria-current="${page===key?'page':'false'}">${label}</button>`).join('');
  patchHTML(el('pk-tabs'),tabMarkup,['data-pk-page']);for(const b of el('pk-tabs').querySelectorAll('[data-pk-page]'))b.onclick=()=>openPage(b.dataset.pkPage);
  const content=el('pk-panel-content');
  const html=page==='skills'?skillsMarkup(u,s):page==='items'?itemsMarkup(u,s):page==='journal'?journalMarkup():peopleMarkup(s);
  if(html!==lastContentHTML){const scroll=el('shop').scrollTop;patchHTML(content,html,['id','data-pk-skill','data-pk-cast','data-pk-form','data-pk-item-cast','data-pk-drop','data-pk-combine']);lastContentHTML=html;el('shop').scrollTop=scroll;bindPanel();}
 }
 function render(){
  const s=state(),u=hero();if(!s||!u||!globalThis.document)return;
  if(combineFrom!=null&&!inventory(u)[combineFrom])combineFrom=null;
  const p=s.phaseKiller,dimension=p?.dimension||u.pkDimension||'normal',world=worlds[dimension]||worlds.normal;
  document.body.classList.add('legacy-game','phasekiller');document.body.classList.remove('treetag','kodotag','warlock','castlefight','linewars');
  for(const id of ['line-camera-nav','climate','spectator-notice','player-roster'])if(el(id))el(id).hidden=true;
  if(lastDimension!==dimension){lastDimension=dimension;view.focusPoint?.({...u,distance:48});}
  const title=document.querySelector('.side-top h2'),subtitle=document.querySelector('.side-top p');if(title)title.textContent=u.pkGhost?'Entre os ecos':roles[u.pkRole]||'Uma identidade por descobrir';if(subtitle)subtitle.textContent=u.pkGhost?'Observe e atravesse mundos. Sua voz usa mana.':u.pkRole==='killer'?'Seu papel é secreto. Despiste os habitantes e recolha almas.':u.pkRole?'Explore, reúna equipamentos e investigue.':'Explore a aldeia. O sorteio do seu papel ainda não aconteceu.';
  text('gold',u.pkRole==='killer'?num(u.pkPower)+' poder':world);text('slots',u.pkRole==='killer'?num(u.pkSouls)+' almas · '+num(u.pkBlood)+' sangue':inventory(u).length+' / '+(u.inventorySlots??2)+' itens');text('point-badge','');text('heroname',u.name||'Habitante');if(el('mini-portrait'))patchHTML(el('mini-portrait'),portrait(u));text('level',u.pkGhost?'FANTASMA':u.pkMonster?FORMS[u.pkForm]?.name||'FORMA':'HABITANTE');
  text('hptext',Math.ceil(u.hp||0)+' / '+Math.ceil(u.maxHp||0));text('mptext',Math.floor(u.mana||0)+' / '+Math.floor(u.maxMana||0));if(el('hpbar'))el('hpbar').style.width=Math.min(100,Math.max(0,(u.hp||0)/Math.max(1,u.maxHp||0)*100))+'%';if(el('mpbar'))el('mpbar').style.width=Math.min(100,Math.max(0,(u.mana||0)/Math.max(1,u.maxMana||0)*100))+'%';text('arena-name','PHASE KILLER · '+world.toUpperCase());const heading=document.querySelector('.worldhead h1');if(heading)heading.textContent=s.phase==='preparation'?'Reúna os habitantes':p?.stage==='gathering'?'Explore antes do sorteio':u.pkGhost?'A história continua do outro lado':'Quem está escondendo sua verdadeira forma?';text('message',p?s.message||'':'Explore três mundos, investigue identidades e sobreviva à caçada. Os papéis são sorteados em segredo após o início.');text('wave-label',p?.stage==='gathering'?'PAPÉIS EM':'TEMPO');text('wave',clock(p?.remaining??s.timer));text('wave-limit','');
  const ready=el('ready');if(ready){ready.disabled=s.phase!=='preparation';ready.textContent=s.phase==='preparation'?'Estou pronto':p?.finished?'Partida encerrada':'Investigação em andamento';}
  text('phasetext',getRoom()?'Sala '+getRoom()+' · Enter abre o chat':s.options?.phaseTraining?'Treino local com bots':'Reúna os jogadores e escolha Estou pronto');text('position',world);text('narrator-hint','Nem toda voz pertence a quem parece falar.');text('order-status',aim?'Escolha '+(SKILLS[aim]?.target==='unit'?'um alvo':'um local')+' · Esc cancela':combineFrom!=null?'Escolha o segundo item da combinação':u.destination?'Caminhando por '+world:'Direito: mover / atacar · clique nos baús');
  const bar=phaseKillerActionBar(u);if(el('abilities')){patchHTML(el('abilities'),bar.map((key,i)=>{const a=SKILLS[key],status=phaseKillerSkillStatus(u,key,statusOptions(s));return `<button type="button" class="ability ${aim===key||selectedGroup===key?'active ':''}${status.cooldown?'cooling ':''}${status.disabled?'unavailable':''}" data-pk-cast="${key}" aria-label="${esc(HOTKEYS[i]+': '+a.name)}" title="${esc('['+HOTKEYS[i]+'] '+skillTooltip(u,key,s))}"><small>${HOTKEYS[i]}</small>${art('skill',key)}<em>${a.kind==='group'?'Opções':u.skillLevels?.[key]?'N'+u.skillLevels[key]:a.name}</em><span class="ability-cooldown" aria-hidden="true">${status.cooldown?Math.ceil(status.cooldown):''}</span></button>`;}).join(''),['data-pk-cast']);for(const b of el('abilities').querySelectorAll('[data-pk-cast]'))bindSpell(b,b.dataset.pkCast);}
  if(el('inventory')){patchHTML(el('inventory'),inventoryMarkup(u),['data-pk-slot']);bindInventory();}
  renderPanel(s,u);
  if(p?.finished&&!ended&&el('world')){ended=true;const card=document.createElement('section');card.id='endmodal';card.className='end-card pk-results';card.innerHTML=`<div class="eyebrow">PHASE KILLER</div><h3>${p.winner==='killer'?'A aldeia caiu':'O assassino foi detido'}</h3><p>${esc(s.message||'')}</p><div>${(p.roster||[]).map(t=>`<p><b>${esc(t.name)}</b> · ${esc(roles[t.role]||'Habitante')}</p>`).join('')}</div><button type="button" class="primary">Nova partida</button>`;el('world').append(card);card.querySelector('button').onclick=onEnd;}
 }
 return {render,point,hotkeys,shortcut,skillPreview,ready:()=>command('Ready'),cancel,sendChat,openChat:focusChat,closeChat,isChatOpen:()=>chatOpen,setHoveredSkill(key){hoverSkill=key;},reset(){cancel();page='skills';selectedSkill=null;selectedGroup=null;selectedItem=null;combineFrom=null;inspect=null;lastDimension=null;ended=false;chatDraft='';chatOpen=false;chatOverlay?.remove();chatOverlay=null;lastContentHTML=null;lastChatHTML=null;shopHost=null;}};
}
