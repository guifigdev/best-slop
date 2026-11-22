import {RO_CARDS,RO_EQUIPMENT_SLOTS} from '../shared/ragnarok-equipment.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {createRoCheckpoint,validateRoProgress} from '../shared/ragnarok-save.js';
import {escapeHTML as esc} from './competition-ui.js';
import {patchHTML} from './snapshot-dom.js';

export const RO_ACCOUNT_STORAGE_KEY='custom-hero:ragnarok-account:v1';
const emptyProgress=()=>({version:1,characters:[],selectedCharacter:null});
const own=(value,key)=>typeof key==='string'&&Object.hasOwn(value,key);
const clone=value=>JSON.parse(JSON.stringify(value));
const uuid=()=>globalThis.crypto?.randomUUID?.()||`ro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,12)}`;
const slotNames={weapon:'Arma',offhand:'Mão secundária',armor:'Armadura',garment:'Capa',shoes:'Calçado',accessory:'Acessório',head:'Cabeça'};
const statNames={str:'FOR',agi:'AGI',vit:'VIT',int:'INT',dex:'DES',luk:'SOR',maxHp:'vida',attack:'ataque',armor:'armadura',matk:'ataque mágico',moveSpeed:'movimento',crit:'crítico',haste:'cadência'};
const bonusText=stats=>Object.entries(stats||{}).map(([key,value])=>`${value>=0?'+':''}${['crit','haste'].includes(key)?Math.round(value*100)+'%':Number(value).toLocaleString('pt-BR')} ${statNames[key]||key}`).join(' · ');

export function normalizeRoAccount(value={}){
 value=value&&typeof value==='object'?value:{};
 const cards=[...new Set((Array.isArray(value.cards)?value.cards:[]).filter(key=>own(RO_CARDS,key)))],unlocked=new Set(cards),ids=new Set(),presets=[];
 for(const entry of (Array.isArray(value.presets)?value.presets:[]).slice(0,6)){
  if(!entry||typeof entry.id!=='string'||!/^[a-zA-Z0-9_-]{1,36}$/.test(entry.id)||ids.has(entry.id))continue;
  ids.add(entry.id);const active={};for(const [slot,key]of Object.entries(entry.cards||{}))if(RO_EQUIPMENT_SLOTS.includes(slot)&&unlocked.has(key)&&(RO_CARDS[key].slot===slot||slot==='offhand'&&RO_CARDS[key].slot==='weapon'))active[slot]=key;
  presets.push({id:entry.id,name:String(entry.name||'Preset').slice(0,40),cards:active});
 }
 if(!presets.length)presets.push({id:'default',name:'Padrão',cards:{}});
 return{id:typeof value.id==='string'?value.id:'local',siteLinked:value.siteLinked===true,cards,presets,activePreset:presets.some(p=>p.id===value.activePreset)?value.activePreset:presets[0].id,progress:validateRoProgress(value.progress)||emptyProgress()};
}
export function mergeRoProgress(remote,local){
 const a=validateRoProgress(remote)||emptyProgress(),b=validateRoProgress(local)||emptyProgress(),characters=new Map(a.characters.map(c=>[c.id,c]));
 for(const c of b.characters)if(!characters.has(c.id)||c.updatedAt>characters.get(c.id).updatedAt)characters.set(c.id,c);
 const merged=[...characters.values()].sort((x,y)=>y.updatedAt-x.updatedAt).slice(0,12),selected=merged.some(c=>c.id===b.selectedCharacter)?b.selectedCharacter:a.selectedCharacter;
 return{version:1,characters:merged,selectedCharacter:merged.some(c=>c.id===selected)?selected:merged[0]?.id||null};
}
export function roAccountSelection(account,{activity='adventure',characterId,resume=false}={}){
 const progress=validateRoProgress(account?.progress)||emptyProgress(),character=progress.characters.find(c=>c.id===characterId)||null,checkpoint=character?.checkpoints?.[activity]?{...character.checkpoints[activity],hero:clone(character.checkpoint.hero)}:character?.checkpoint||null;
 return{activity:activity==='tower'?'tower':'adventure',characterId,character:character?clone(character):null,checkpoint:checkpoint?clone(checkpoint):null,resume:!!resume&&!!checkpoint&&checkpoint.activity===activity};
}
export function saveRoCharacter(progress,{id,name,lineage,checkpoint,updatedAt=Date.now()}){
 const current=validateRoProgress(progress)||emptyProgress(),previous=current.characters.find(c=>c.id===id),characters=current.characters.filter(c=>c.id!==id);
 if(characters.length>=12)return null;
 return validateRoProgress({version:1,characters:[...characters,{id,name,lineage,checkpoint,checkpoints:{...previous?.checkpoints,[checkpoint.activity]:checkpoint},updatedAt}],selectedCharacter:id});
}

// Optional fetch/storage injection keeps account and retry behavior testable
// without DOM, a network connection or exposing recovery keys in markup.
export function createRagnarokAccountUI({send=()=>false,getGame=()=>null,getState=()=>null,toast=()=>{},onCardDrop=()=>{},onChange=()=>{},fetchImpl=globalThis.fetch?.bind(globalThis),storage}={}){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 let cache={};try{cache=JSON.parse(storage?.getItem(RO_ACCOUNT_STORAGE_KEY)||'{}')||{};}catch{}
 let token=typeof cache.token==='string'&&/^ro_[a-f0-9]{64}$/.test(cache.token)?cache.token:null,account=normalizeRoAccount(cache.account),host=null,ready=null,status='loading',notice='',epoch=0,queue=Promise.resolve(),selectedId=account.progress.selectedCharacter||uuid(),lineage='dragonknight',characterName='',activity=cache.activity==='tower'?'tower':'adventure',skillMode=cache.skillMode==='class'?'class':'mixed',resume=false,recoveryVisible=false,presetDirty=!!cache.presetDirty,selectionTouched=false,running=null,rewardBusy=false,lastRewardAt=0,lastSaveAt=0,lastFloor='',lastRoute='',lastLevel=0,pendingSave=false,nextReconnectAt=0;
 const stored=()=>{try{storage?.setItem(RO_ACCOUNT_STORAGE_KEY,JSON.stringify({token,account,activity,skillMode,presetDirty}));}catch{notice='Armazenamento local indisponível neste navegador.';}};
 const notify=()=>{stored();render();onChange(selection());};
 const selectedCharacter=()=>account.progress.characters.find(c=>c.id===selectedId)||null;
 function selectCharacter(id){selectionTouched=true;selectedId=id;const c=selectedCharacter();if(c){lineage=c.lineage;characterName=c.name;}else characterName='';resume=false;notify();}
 const preset=()=>account.presets.find(p=>p.id===account.activePreset)||account.presets[0];
 function accept(next,{mergeProgress=true}={}){const normalized=normalizeRoAccount(next);if(mergeProgress)normalized.progress=mergeRoProgress(normalized.progress,account.progress);account=normalized;if(!selectionTouched&&!running&&account.progress.selectedCharacter){selectedId=account.progress.selectedCharacter;const c=selectedCharacter();lineage=c.lineage;characterName=c.name;}notify();}
 function serial(task){const next=queue.then(task,task);queue=next.catch(()=>{});return next;}
 async function api(path,{method='GET',body,auth=token}={}){
  if(!fetchImpl)throw new Error('A conexão com a nuvem está indisponível.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const result=await fetchImpl('/api/ragnarok/'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:'Bearer '+auth}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:controller.signal,credentials:'same-origin'});let data;try{data=await result.json();}catch{data={};}if(!result.ok){const error=new Error(result.status===503?'A nuvem está indisponível. Seu progresso continua salvo neste dispositivo.':result.status===401?'Chave de recuperação inválida.':data.error||'Não foi possível sincronizar.');error.status=result.status;throw error;}return data;}finally{clearTimeout(timer);}
 }
 async function initialize(){const version=epoch;try{
  const data=token?await api('account'):await api('account/create',{method:'POST',body:{},auth:null});if(version!==epoch)return account;
  if(data.token)token=data.token;status='cloud';notice='';const cloudProgress=JSON.stringify(normalizeRoAccount(data.account).progress),draft=clone(account.presets),draftActive=account.activePreset;accept(data.account);if(presetDirty){const normalized=normalizeRoAccount({...account,presets:draft,activePreset:draftActive});account.presets=normalized.presets;account.activePreset=normalized.activePreset;}
  if(JSON.stringify(account.progress)!==cloudProgress){const progress=clone(account.progress);void serial(async()=>{if(version!==epoch)return;try{const synced=await api('progress',{method:'POST',body:{checkpoint:progress}});if(version===epoch)accept(synced.account);}catch(error){if(version===epoch){notice=error.message;render();}}});}
  if(presetDirty)void savePresets();if(running&&running.epoch===epoch)void startRun(running);return account;
 }catch(error){if(version!==epoch)return account;status='local';notice=error.message;nextReconnectAt=Date.now()+15000;notify();return account;}}
 function loadReady(){return ready||=initialize();}
 function selection(){return {...roAccountSelection(account,{activity,characterId:selectedId,resume}),skillMode};}
 function setLineage(key){if(!own(RO_LINEAGES,key))return;if(lineage!==key)selectionTouched=true;if(selectedCharacter()&&selectedCharacter().lineage!==key){selectedId=uuid();characterName='';resume=false;}lineage=key;render();}
 async function recover(value){if(!/^ro_[a-f0-9]{64}$/.test(value)){toast('Confira o código de recuperação completo.');return false;}const version=++epoch;status='loading';render();try{const data=await api('account',{auth:value});if(version!==epoch)return false;token=value;account=normalizeRoAccount(data.account);selectedId=account.progress.selectedCharacter||uuid();const c=selectedCharacter();if(c){lineage=c.lineage;characterName=c.name;}running=null;recoveryVisible=false;presetDirty=false;status='cloud';notice='';notify();toast('Conta recuperada.');return true;}catch(error){if(version===epoch){status='local';notice=error.message;notify();toast(error.message);}return false;}}
 function localCommand(game,command){const hero=game?.units?.find(u=>u.bonkHero);return game?.command&&hero?.owner!=null?game.command(hero.owner,command):send(command);}
 function startRun(run){if(run.game?.options?.bonkDebug===true||run.starting||run.id||running!==run||run.epoch!==epoch||status!=='cloud')return;run.starting=true;return serial(async()=>{try{if(run.game?.options?.bonkDebug===true||running!==run||epoch!==run.epoch)return;const data=await api('run',{method:'POST',body:{activity:run.activity}});if(running===run&&epoch===run.epoch){run.id=data.runId;accept(data.account);}}catch(error){if(running===run){status='local';notice=error.message;nextReconnectAt=Date.now()+15000;notify();}}finally{run.starting=false;}});}
 function prepareGame(game,{online=false}={}){
  if(game?.options?.bonkDebug===true){running=null;return false;}
  const hero=game?.units?.find(u=>u.bonkHero);if(!hero)return false;const chosen=selection();
  if(!online&&chosen.checkpoint&&chosen.character.lineage===hero.roLineage)localCommand(game,{type:'bkRestore',checkpoint:chosen.checkpoint,activity,freshActivity:!chosen.resume||chosen.checkpoint.activity!==activity});
  else if(!online&&chosen.character){selectedId=uuid();characterName='';}
  if(!online)localCommand(game,{type:'bkCards',cards:clone(preset().cards)});
  const run={game,id:null,epoch,activity:game.bonk.activity==='tower'?'tower':'adventure',characterId:selectedId,name:characterName||RO_LINEAGES[hero.roLineage]?.names[0]||'Aventureiro',lineage:hero.roLineage};running=run;lastFloor='';lastRoute='';lastLevel=0;lastSaveAt=0;lastRewardAt=0;
  void loadReady().then(()=>startRun(run));
  return true;
 }
 function save(game=getGame()){
  if(game?.options?.bonkDebug===true)return Promise.resolve(false);
  if(!game?.bonk||!running||running.game!==game||running.epoch!==epoch)return Promise.resolve(false);
  const checkpoint=createRoCheckpoint(game);if(!checkpoint)return Promise.resolve(false);const run=running,next=saveRoCharacter(account.progress,{id:run.characterId,name:run.name,lineage:run.lineage,checkpoint,updatedAt:Date.now()});if(!next){toast('Sua conta já tem 12 personagens.');return Promise.resolve(false);}
  account.progress=next;selectedId=run.characterId;lastSaveAt=Date.now();pendingSave=false;stored();render();
  if(status!=='cloud')return Promise.resolve(true);const version=epoch,payload=clone(next);
  return serial(async()=>{if(game.options?.bonkDebug===true||version!==epoch)return false;try{const data=await api('progress',{method:'POST',body:{checkpoint:payload}});if(version!==epoch)return false;accept(data.account);return true;}catch(error){if(version===epoch){notice=error.message;status='local';notify();}return false;}});
 }
 function update(game=getGame()){
  if(game?.options?.bonkDebug===true)return;
  const time=Date.now();if(status==='local'&&time>=nextReconnectAt){nextReconnectAt=time+15000;ready=null;void loadReady();}
  if(!running||running.game!==game||!game?.bonk)return;const hero=game.units.find(u=>u.bonkHero),floor=`${game.bonk.activity}:${game.bonk.clearedStages.length}:${game.bonk.stage}`;
  const route=game.bonk.routeVersion>=1?`${game.bonk.routeIndex}:${Number(game.bonk.routeBossDefeated)}`:'';const routeChanged=!!route&&route!==lastRoute;lastRoute=route;
  if(hero&&(floor!==lastFloor||hero.level!==lastLevel||routeChanged)){pendingSave=true;lastFloor=floor;lastLevel=hero.level;}
  if(routeChanged||time-lastSaveAt>=15000)void save(game);
  if(status==='cloud'&&!running.id)void startRun(running);
  if(status!=='cloud'||!running.id||rewardBusy||time-lastRewardAt<(running.activity==='tower'?250:1000))return;const kills=(game.bonk.rewardKills||[]).slice(0,40).map(k=>({id:String(k.id),visual:k.visual,boss:!!k.boss}));if(!kills.length)return;
  const rewardPoints=new Map((game.bonk.rewardKills||[]).map(k=>[String(k.id),{x:k.x,z:k.z}])),run=running,version=epoch;rewardBusy=true;lastRewardAt=time;
  void serial(async()=>{if(game.options?.bonkDebug===true||running!==run||version!==epoch)return;try{const data=await api('rewards',{method:'POST',body:{runId:run.id,kills}});if(running!==run||version!==epoch)return;
    const acknowledged=Array.isArray(data.acknowledgedIds)?data.acknowledgedIds:[];if(acknowledged.length)localCommand(game,{type:'bkAcknowledgeRewards',ids:acknowledged.slice(0,40)});else lastRewardAt=Date.now()+4000;
    accept(data.account);for(const key of data.newCards||[])if(own(RO_CARDS,key)){const receipt=data.cardDrops?.find(d=>d.key===key)?.receipt;onCardDrop({key,point:rewardPoints.get(String(receipt))});toast(`Carta conquistada: ${RO_CARDS[key].name}. Permanente na sua conta!`);}
   }catch(error){if(version===epoch){notice=error.message;lastRewardAt=Date.now()+4000;if(error.status===409)run.id=null;render();}}finally{rewardBusy=false;}}).finally(()=>{rewardBusy=false;});
 }
 async function savePresets(){stored();if(status!=='cloud'){notice='Preset salvo neste dispositivo; a nuvem está indisponível.';render();return false;}const version=epoch,payload={presets:clone(account.presets),activePreset:account.activePreset};return serial(async()=>{if(version!==epoch)return false;try{const data=await api('presets',{method:'POST',body:payload});if(version!==epoch)return false;presetDirty=false;accept(data.account);toast('Preset salvo na conta.');return true;}catch(error){if(version===epoch){presetDirty=true;notice=error.message;render();}return false;}});}
 function render(){
  if(!host||running&&host.closest('[hidden],.hidden'))return;const c=selectedCharacter(),choice=selection(),active=preset(),name=characterName||c?.name||'',unlocked=new Set(account.cards),busy=status==='loading',canResume=choice.checkpoint?.activity===activity;
  const visibleCards=host.querySelector('[data-ui-key=ro-collection]')?.open?Object.values(RO_CARDS):[];
  const options=RO_EQUIPMENT_SLOTS.map(slot=>`<label class="ro-slot">${slotNames[slot]}<select data-ro-slot="${slot}" ${busy?'disabled':''}><option value="">Sem carta</option>${account.cards.filter(key=>(RO_CARDS[key].slot===slot||slot==='offhand'&&RO_CARDS[key].slot==='weapon')).map(key=>`<option value="${key}" ${active.cards[slot]===key?'selected':''}>${esc(RO_CARDS[key].name)}</option>`).join('')}</select><small>${active.cards[slot]?esc(bonusText(RO_CARDS[active.cards[slot]].stats)):'Encaixa automaticamente em uma peça compatível com slot.'}</small></label>`).join('');
  patchHTML(host,`<header><div><small>RAGNAROK · SUA CONTA DO JOGO</small><h3>Personagens e cartas</h3></div><span class="ro-cloud ${status}" role="status">${busy?'Conectando…':status==='cloud'?(account.siteLinked?'Conta sincronizada':'Salvo na nuvem'):'Progresso local'}</span></header>${notice?`<p class="ro-notice" role="status">${esc(notice)}</p>`:''}${status!=='cloud'?'<p class="ro-local-note">O progresso fica neste dispositivo. Novas cartas permanentes precisam da conexão com a conta.</p>':''}${account.siteLinked?'<p class="ro-local-note">Personagens e cartas acompanham sua conta de acesso a este site, inclusive em outro aparelho.</p>':''}<div class="ro-roster"><label>Personagem<select data-ro-character><option value="new" ${!c?'selected':''}>Novo personagem</option>${account.progress.characters.map(character=>`<option value="${esc(character.id)}" ${character.id===selectedId?'selected':''}>${esc(character.name)} · Nv.${character.checkpoint.hero.level} · ${esc(RO_LINEAGES[character.lineage].names[0])}</option>`).join('')}</select></label><label>Nome<input data-ro-name maxlength="30" value="${esc(name)}" placeholder="${esc(RO_LINEAGES[lineage]?.names[0]||'Aventureiro')}" autocomplete="off"></label>${c?`<p>Nível ${c.checkpoint.hero.level} · ${esc(RO_LINEAGES[c.lineage].names[Math.min(3,c.checkpoint.hero.roTier)]||RO_LINEAGES[c.lineage].names[0])}. O desenvolvimento acompanha este personagem nos dois modos.</p>`:'<p>Escolha a classe acima. Seu personagem será salvo ao começar a jornada.</p>'}</div><fieldset class="ro-activities"><legend>O que vamos jogar?</legend><button type="button" data-ro-activity="adventure" aria-pressed="${activity==='adventure'}"><b>Aventura</b><small>Mapas abertos, exploração e evolução de classes.</small></button><button type="button" data-ro-activity="tower" aria-pressed="${activity==='tower'}"><b>Torre sem Fim</b><small>100 andares rápidos com este personagem.</small></button></fieldset><label class="ro-skill-mode">Habilidades oferecidas<select data-ro-skill-mode><option value="class" ${skillMode==='class'?'selected':''}>Clássico · somente minha classe e evoluções</option><option value="mixed" ${skillMode==='mixed'?'selected':''}>Livre · misturar todas as classes</option></select><small>Áreas, ataques, suporte e invocações. Nas salas, vale a escolha do host.</small></label>${canResume?`<label class="ro-resume"><input type="checkbox" data-ro-resume ${resume?'checked':''}> Retomar ${activity==='tower'?'andar':'região'} ${choice.checkpoint.floor} com a build salva</label>`:c?'<p class="ro-muted">Uma nova atividade começa na entrada, preservando nível, equipamentos e atributos.</p>':''}<details class="ro-preset" data-ui-key="ro-presets"><summary>Cartas da próxima partida · ${esc(active.name)}</summary><p>Uma carta por parte do equipamento. Conquistas permanentes, sem consumir a carta. Aplicadas ao encontrar ou trocar uma peça compatível.</p><div class="ro-preset-controls"><label>Preset<select data-ro-preset>${account.presets.map(p=>`<option value="${esc(p.id)}" ${p.id===active.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Nome do preset<input data-ro-preset-name maxlength="40" value="${esc(active.name)}"></label><button type="button" data-ro-new-preset ${account.presets.length>=6?'disabled':''}>+ Preset</button></div><div class="ro-slot-grid">${options}</div><button type="button" data-ro-save-preset ${busy?'disabled':''}>${presetDirty?'Salvar alterações':'Salvar preset'}</button></details><details class="ro-collection" data-ui-key="ro-collection"><summary>Coleção permanente · ${account.cards.length} / ${Object.keys(RO_CARDS).length}</summary><div class="ro-card-grid">${visibleCards.map(card=>`<article class="ro-card ${unlocked.has(card.key)?'unlocked':'locked'}"><small>${card.mvp?'MVP · LENDÁRIA':'CARTA RARA'} · ${slotNames[card.slot]}</small><b>${esc(card.name)}</b><span>${esc(bonusText(card.stats))}</span><small>${unlocked.has(card.key)?'Conquistada permanentemente':'Ainda não encontrada'} · Origem: ${esc(card.monsters.map(key=>key.replace(/([a-z])([A-Z])/g,'$1 $2')).join(', '))}</small></article>`).join('')}</div></details><details class="ro-recovery" data-ui-key="ro-recovery"><summary>Recuperar conta em outro aparelho</summary><p>${account.siteLinked?'Seu acesso a este site recupera a conta automaticamente. A chave é uma alternativa para instalações independentes.':'Esta é uma conta do jogo. Guarde a chave para recuperar personagens e cartas em outro aparelho.'}</p><button type="button" data-ro-reveal ${!token?'disabled':''}>${recoveryVisible?'Ocultar chave':'Mostrar minha chave de recuperação'}</button>${recoveryVisible&&token?`<label>Sua chave privada<input data-ro-token type="password" readonly value="${esc(token)}" autocomplete="off"></label><button type="button" data-ro-copy>Copiar chave</button>`:''}<label>Código de outra conta<input data-ro-recover placeholder="Cole a chave ro_…" autocomplete="off" type="password"></label><button type="button" data-ro-restore>Recuperar conta</button></details>`,['data-ui-key','data-ro-slot','data-ro-character','data-ro-name','data-ro-preset','data-ro-preset-name','data-ro-activity','data-ro-resume','data-ro-token','data-ro-recover']);
 }
 function click(event){const button=event.target.closest('button');if(!button||!host?.contains(button))return;
  if(button.dataset.roActivity){selectionTouched=true;activity=button.dataset.roActivity;resume=false;notify();}
  if(button.hasAttribute('data-ro-save-preset'))void savePresets();
  if(button.hasAttribute('data-ro-new-preset')&&account.presets.length<6){const entry={id:uuid().replaceAll('-','').slice(0,36),name:`Preset ${account.presets.length+1}`,cards:{...preset().cards}};account.presets.push(entry);account.activePreset=entry.id;presetDirty=true;notify();}
  if(button.hasAttribute('data-ro-reveal')){recoveryVisible=!recoveryVisible;render();}
  if(button.hasAttribute('data-ro-copy')){const copy=globalThis.navigator?.clipboard?.writeText(token);if(copy)void copy.then(()=>toast('Chave copiada. Guarde em um lugar seguro.')).catch(()=>toast('Selecione a chave e copie manualmente.'));else{const input=host.querySelector('[data-ro-token]');input.type='text';input.focus();input.select();toast('Selecione a chave e copie manualmente.');}}
  if(button.hasAttribute('data-ro-restore'))void recover(host.querySelector('[data-ro-recover]').value.trim());
 }
 function change(event){const node=event.target;if(node.hasAttribute('data-ro-character')){if(node.value==='new'&&account.progress.characters.length>=12){toast('Sua conta já tem 12 personagens.');render();return;}selectCharacter(node.value==='new'?uuid():node.value);}
  if(node.hasAttribute('data-ro-skill-mode')){skillMode=node.value==='class'?'class':'mixed';notify();}
  if(node.hasAttribute('data-ro-resume')){resume=node.checked;notify();}
  if(node.hasAttribute('data-ro-preset')){account.activePreset=node.value;presetDirty=true;notify();}
  if(node.hasAttribute('data-ro-slot')){const slot=node.dataset.roSlot,key=node.value;if(!key)delete preset().cards[slot];else if(account.cards.includes(key)&&RO_CARDS[key]?.slot===slot)preset().cards[slot]=key;presetDirty=true;notify();}
 }
 function input(event){const node=event.target;if(node.hasAttribute('data-ro-name')){characterName=node.value.slice(0,30);if(running?.characterId===selectedId)running.name=characterName;}
  if(node.hasAttribute('data-ro-preset-name')){preset().name=node.value.slice(0,40)||'Preset';presetDirty=true;stored();}
 }
 function mount(container){if(!container)return;if(!host){host=document.createElement('section');host.className='ro-account';host.setAttribute('aria-label','Conta Ragnarok, personagens e cartas');host.addEventListener('click',click);host.addEventListener('change',change);host.addEventListener('input',input);host.addEventListener('toggle',event=>{if(event.target.dataset.uiKey==='ro-collection')render();},true);}container.append(host);render();void loadReady();}
 const cachedCharacter=selectedCharacter();if(cachedCharacter){lineage=cachedCharacter.lineage;characterName=cachedCharacter.name;}
 return{mount,render,selection,selectActivity(value){activity=value==='tower'?'tower':'adventure';resume=false;notify();},onlineSelection:lineage=>({token,lineage,characterId:selectedCharacter()?.id||null,activity,resume}),setLineage,prepareGame,save,update,loadReady,recover,account:()=>clone(account),status:()=>status,unmount(){host?.remove();}};
}
