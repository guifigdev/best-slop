const TREE_STORAGE=new Set(['eC09','e003','e005']),KODO_DEFENCE=new Set(['oC16','oC20','oC21']);
const live=value=>value&&value.alive!==false;
const raw=u=>u?.workerType||u?.unitKey||u?.rawId;
const ready=b=>live(b)&&(!(Number.isFinite(b.workRemaining))||b.workRemaining<=0)&&(!(Number.isFinite(b.workProgress))||b.workProgress>=1);
const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.z||0)-(b?.z||0));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const step=(id,kind,key,reason,extra={})=>({step:id,kind,key,reason,status:'recommended',complete:false,...extra});
const completed=reason=>({step:'complete',kind:null,key:null,reason,status:'complete',complete:true});
function context(state,hero,field){const buildings=(state?.[field]?.buildings||[]).filter(b=>live(b)&&b.owner===hero.owner).sort((a,b)=>distance(a,hero)-distance(b,hero)),units=(state?.units||[]).filter(u=>live(u)&&u.owner===hero.owner);if(!units.some(u=>u.id===hero.id))units.push(hero);return{buildings,units};}
const pendingUnit=(buildings,key)=>buildings.find(b=>ready(b)&&(b.productionQueue||[]).includes(key));

// Recommendations describe the player's current base, not a sticky tutorial
// flag. Existing upgrades and queued work prevent unnecessary duplicate buys.
export function tagTutorialNextStep(state,hero){
 if(!hero||hero.owner==null)return null;const mode=state?.options?.mode||(state?.treeTag?'treetag':state?.kodoTag?'kodotag':null);
 if(!['treetag','kodotag'].includes(mode))return null;
 if(['victory','defeat'].includes(state?.phase))return completed('A partida terminou.');
 if(hero.treeTagCaptured||hero.kodoTagCaptured)return step('rescue','action','rescue','Aguarde um aliado resgatar seu personagem.',{status:'pending',badge:'Aguardando resgate'});
 if(mode==='treetag'){
  if(hero.treeTagRole==='infernal'||hero.treeTagCharacter&&hero.treeTagCharacter!=='ent')return null;
  const {buildings,units}=context(state,hero,'treeTag'),storages=buildings.filter(b=>b.type==='resource'||TREE_STORAGE.has(b.key)),storage=storages.find(ready)||storages[0],lifes=buildings.filter(b=>b.key==='e000'),life=lifes.find(ready)||lifes[0];
  if(!storage)return step('tree-storage','building','eC09','Comece pelo Resource Storage: ele aumenta sua renda de ouro e madeira.');
  if(!ready(storage))return step('tree-storage','building','eC09','Seu depósito já está na fila de obras. Deixe o construtor terminá-lo.',{status:'pending',badge:'Em construção',buildingId:storage.id});
  if(!life)return step('tree-life','building','e000','Construa a Tree of Life para liberar Wisp, Nature Lover e Advanced Builder.');
  if(!ready(life))return step('tree-life','building','e000','A Tree of Life já foi encomendada. Aguarde a construção antes de treinar.',{status:'pending',badge:'Em construção',buildingId:life.id});
  const wisps=units.filter(u=>raw(u)==='e001'),wisp=wisps.find(u=>u.treeTagAction?.type==='gather')||wisps[0],wispQueue=pendingUnit(buildings,'e001');
  if(!wisp)return step('tree-wisp','unit','e001',wispQueue?'Seu Wisp já está na fila. Aguarde o nascimento para dar a ordem de coleta.':'Treine um Wisp na Tree of Life para coletar madeira.',{producerId:(wispQueue||life).id,status:wispQueue?'pending':'recommended',...(wispQueue?{badge:'Treinando'}:{})});
  if(!wisps.some(u=>u.treeTagAction?.type==='gather'))return step('tree-gather','action','gather','Selecione seu Wisp e clique com o botão direito numa árvore para coletar madeira.',{unitKey:'e001',unitIds:wisps.map(u=>u.id)});
  const builder=units.find(u=>raw(u)==='uC43'),builderQueue=pendingUnit(buildings,'uC43');
  if(!builder)return step('tree-builder','unit','uC43',builderQueue?'Seu Advanced Builder já está treinando. Ele terá acesso às obras avançadas.':'Treine um Advanced Builder para construir as estruturas avançadas.',{producerId:(builderQueue||life).id,status:builderQueue?'pending':'recommended',...(builderQueue?{badge:'Treinando'}:{})});
  return completed('Sua base inicial está pronta: renda, coleta de madeira e construtor avançado.');
 }
 const {buildings,units}=context(state,hero,'kodoTag'),depots=buildings.filter(b=>b.key==='hC08'||b.type==='depot'),depot=depots.find(ready)||depots[0];
 if(!depot)return step('kodo-depot','building','hC08','Comece por uma Big Wall gratuita: ela recebe ouro e treina Peasant.');
 if(!ready(depot))return step('kodo-depot','building','hC08','Sua Big Wall já está na fila. Deixe o Runner concluir a obra.',{status:'pending',badge:'Em construção',buildingId:depot.id});
 const peasants=units.filter(u=>raw(u)==='hC19'&&u.kodoTagWorker!==false),peasantQueue=pendingUnit(buildings,'hC19');
 if(!peasants.length&&!peasantQueue&&hero.gold<300){const gathering=units.some(u=>u.kodoTagAction?.type==='gather'||u.carrying?.amount>0);return step('kodo-gold','action','gather',gathering?'Seu Runner está coletando. Junte 300 ouro para treinar Peasant.':'Dê botão direito numa mina com seu Runner. Entregue as cargas na Big Wall e junte 300 ouro.',{status:gathering?'pending':'recommended',...(gathering?{badge:'Coletando'}:{}),unitIds:[hero.id]});}
 if(!peasants.length)return step('kodo-peasant','unit','hC19',peasantQueue?'Seu Peasant já está na fila. Aguarde para mandá-lo coletar.':'Treine Peasant na Big Wall para aumentar sua coleta de ouro.',{producerId:(peasantQueue||depot).id,status:peasantQueue?'pending':'recommended',...(peasantQueue?{badge:'Treinando'}:{})});
 if(!peasants.some(u=>u.kodoTagAction?.type==='gather'||u.carrying?.amount>0))return step('kodo-worker-gather','action','gather','Selecione seu Peasant e dê botão direito numa mina para ele coletar e entregar ouro.',{unitKey:'hC19',unitIds:peasants.map(u=>u.id)});
 const defences=buildings.filter(b=>KODO_DEFENCE.has(b.key)||['tower','slowTower','stunTower'].includes(b.type)),defence=defences.find(ready)||defences[0];
 if(!defence)return step('kodo-defence','building','oC16','Opcional: construa uma Tower para começar a defender sua base dos Kodos.',{optional:true});
 if(!ready(defence))return step('kodo-defence','building',defence.key,'Sua defesa já está na fila de obras. Aguarde o Runner terminá-la.',{optional:true,status:'pending',badge:'Em construção',buildingId:defence.id});
 return completed('Sua base inicial tem depósito, coleta com Peasant e defesa.');
}

export function tagTutorialHighlight(state,hero,kind,key,producer){
 const next=tagTutorialNextStep(state,hero);if(!next||next.complete||producer&&producer.owner!==hero.owner)return null;
 let matches=next.kind===kind&&next.key===key;
 if(kind==='select-building')matches=next.producerId!=null&&next.producerId===key||next.buildingId!=null&&next.buildingId===key;
 if(kind==='unit-instance')matches=next.kind==='action'&&next.key==='gather'&&(next.unitIds||[]).includes(key);
 if(kind==='unit'&&producer&&next.producerId!=null&&producer.id!==next.producerId)matches=false;
 if(!matches)return null;
 return{...next,badge:next.badge||(next.status==='pending'?'Em andamento':'Próximo passo'),className:next.status==='pending'?'tutorial-in-progress':'tutorial-recommended'};
}

export function tagTutorialBadge(highlight){return highlight?`<span class="tutorial-badge" aria-label="${esc(highlight.badge+': '+highlight.reason)}">${esc(highlight.badge)}</span><span class="tutorial-reason">${esc(highlight.reason)}</span>`:'';}
