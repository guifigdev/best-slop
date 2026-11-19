const MODES=new Set(['campaign','best','tower','war']);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const amount=n=>Number.isFinite(n)?Math.max(0,n):0;
const modeOf=game=>game.options?.mode;
const contribution=()=>({damage:0,support:0,tanking:0});
const contributes=c=>c.damage+c.support+c.tanking>.001;
const groupOf=(game,u)=>modeOf(game)==='tower'?'coop':modeOf(game)==='war'?`team-${u.squad??game.player(u.owner)?.squad}`:u.owner;
function ledgerFor(game){const ledger=game.survivalWaveLedger;return ledger&&ledger.wave===game.wave&&ledger.mode===modeOf(game)?ledger:null;}
function ensureLedger(game,kind='wave'){if(!ledgerFor(game)||ledgerFor(game).kind!==kind)game.beginSurvivalRound(kind,false);return ledgerFor(game);}
const hasFinished=(ledger,h)=>ledger.kind==='bonus'?h.challengeDone:h.stageDone;

export const waveResultMethods={
 beginSurvivalRound(kind='wave',measured=true){
  if(!MODES.has(modeOf(this))||kind==='bonus'&&modeOf(this)!=='campaign')return false;const startedAt=kind==='bonus'?this.bonusStarted:this.waveStarted;
  this.survivalWaveLedger={id:`${modeOf(this)}:${kind}:${this.wave}:${this.time}`,kind,wave:this.wave,mode:modeOf(this),startedAt:measured&&Number.isFinite(startedAt)?startedAt:null,settled:false,records:[],contributions:Object.fromEntries(this.heroes().map(h=>[h.owner,contribution()])),priorBonuses:Object.fromEntries(this.heroes().map(h=>[h.owner,amount(h.survivalBonusGold)]))};return true;
 },
 beginSurvivalWave(measured=true){return this.beginSurvivalRound('wave',measured);},
 beginSurvivalBonus(){return this.beginSurvivalRound('bonus',true);},

 recordWaveDamage(source,target,actual){
  const ledger=ledgerFor(this);if(!MODES.has(modeOf(this))||!['wave','bonus'].includes(this.phase)||!ledger||ledger.settled||!source||!target||!(actual>0)||!Number.isFinite(actual)||source.team===target.team||!this.canTarget(source,{...target,alive:true}))return;
  const dealer=this.player(source.owner),tank=target.hero&&!target.summon?this.player(target.owner):null;
  if(dealer&&!hasFinished(ledger,dealer)&&ledger.contributions[dealer.owner])ledger.contributions[dealer.owner].damage+=actual;
  if(tank&&!hasFinished(ledger,tank)&&ledger.contributions[tank.owner])ledger.contributions[tank.owner].tanking+=actual;
 },

 recordWaveSupport(source,target,actual){
  const ledger=ledgerFor(this);if(!MODES.has(modeOf(this))||!['wave','bonus'].includes(this.phase)||!ledger||ledger.settled||!source||!target||!(actual>0)||!Number.isFinite(actual)||source.team!==target.team)return;const hero=this.player(source.owner);
  if(!hero||hasFinished(ledger,hero)||!ledger.contributions[hero.owner]||groupOf(this,hero)!==groupOf(this,target))return;ledger.contributions[hero.owner].support+=actual;
 },

 recordSurvivalGroup(heroes,{completed,time,elapsed}){
  const ledger=ensureLedger(this);if(!ledger||ledger.settled)return;
  for(const h of heroes){if(this.stageResults.some(r=>r.owner===h.owner&&r.resultId===ledger.id))continue;const hpRatio=h.alive?clamp(h.hp/h.maxHp,0,1):0,score=modeOf(this)==='tower'||ledger.startedAt===null?0:completed?Math.round(1000*Math.max(0,1-elapsed/180)+500*hpRatio):0;
   h.stageDone=true;h.score=(h.score||0)+score;const record={resultId:ledger.id,wave:this.wave,owner:h.owner,name:h.name,hero:h.hero,team:h.squad,groupId:groupOf(this,h),time:completed&&ledger.startedAt!==null?amount(time):null,elapsed:ledger.startedAt!==null?amount(elapsed):null,life:hpRatio,hpRatio,score,cleared:!!completed,completed:!!completed,survived:!!h.alive,contribution:{...(ledger.contributions[h.owner]||contribution())}};this.stageResults.push(record);ledger.records.push(record);
  }
 },

 recordSurvivalBonus(h,time){
  if(modeOf(this)!=='campaign')return;const ledger=ensureLedger(this,'bonus');if(ledger.settled||ledger.records.some(r=>r.owner===h.owner))return;const completed=Number.isFinite(time)&&time>=0&&h.alive,elapsed=ledger.startedAt!==null?Math.max(0,this.time-ledger.startedAt):null,hpRatio=h.alive?clamp(h.hp/h.maxHp,0,1):0;
  ledger.records.push({resultId:ledger.id,wave:this.wave,owner:h.owner,name:h.name,hero:h.hero,groupId:h.owner,time:completed&&ledger.startedAt!==null?time:null,elapsed,completed,cleared:completed,survived:!!h.alive,hpRatio,score:0,contribution:{...(ledger.contributions[h.owner]||contribution())}});
 },
 settleSurvivalWave(options={}){return this.settleSurvivalRound('wave',options);},
 settleSurvivalBonus(){
  if(modeOf(this)!=='campaign')return null;const key=`${modeOf(this)}:bonus:${this.wave}`;if(this.survivalSettlements?.[key])return this.survivalSettlements[key];const ledger=ensureLedger(this,'bonus');for(const h of this.heroes())if(!ledger.records.some(r=>r.owner===h.owner)){const old=this.bonusResults?.find(r=>r.owner===h.owner);this.recordSurvivalBonus(h,old?.time??null);}const result=this.settleSurvivalRound('bonus');
  for(const old of this.bonusResults||[]){const row=result.rows.find(r=>r.owner===old.owner);if(row)Object.assign(old,{time:row.time,gold:row.totalGold,rank:row.rank,baseGold:row.baseGold,performanceGold:row.performanceGold,catchupGold:row.catchupGold});}return result;
 },
 settleSurvivalRound(kind,{payBase=true}={}){
  if(!MODES.has(modeOf(this))||kind==='bonus'&&modeOf(this)!=='campaign')return null;const key=`${modeOf(this)}:${kind}:${this.wave}`;if(this.survivalSettlements?.[key])return this.survivalSettlements[key];const ledger=ensureLedger(this,kind);if(ledger.settled)return this.waveResults||null;ledger.settled=true;
  const heroes=this.heroes(),base=payBase?(kind==='bonus'?300:100+this.wave*12):0,performanceCap=Math.min(40,Math.floor(base*.10)),catchupCap=Math.min(60,Math.floor(base*.15)),groups=new Map(),rows=heroes.map(h=>{
   const stage=ledger.records.find(r=>r.owner===h.owner&&r.resultId===ledger.id),completed=!!stage?.completed,time=completed&&Number.isFinite(stage.time)?stage.time:null,c={...(stage?.contribution||ledger.contributions[h.owner]||contribution())},eligible=completed&&time!==null&&contributes(c);
   const row={owner:h.owner,name:stage?.name||h.name,hero:stage?.hero||h.hero,team:modeOf(this)==='war'?h.squad:modeOf(this)==='tower'?1:null,groupId:stage?.groupId||groupOf(this,h),time,elapsed:stage?.elapsed??null,completed,survived:stage?.survived??!!h.alive,hpRatio:stage?.hpRatio??0,rank:null,baseGold:kind==='bonus'&&!completed?0:base,performanceGold:0,catchupGold:0,totalGold:base,score:stage?.score||0,cumulativeScore:h.score||0,contribution:c,eligible,eligibilityReason:eligible?'eligible':!completed?'not-completed':'no-contribution',status:!stage||ledger.startedAt===null?'unmeasured':!completed?'failed':stage.survived?'completed':'fallen-team-clear'};
   if(!groups.has(row.groupId))groups.set(row.groupId,{id:row.groupId,completed:completed&&time!==null,time,rows:[]});groups.get(row.groupId).rows.push(row);return row;
  });
  const finished=[...groups.values()].filter(g=>g.completed).sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));let previousTime=null,rank=0;
  for(const[index,group]of finished.entries()){const rounded=Math.round(group.time*10);if(rounded!==previousTime)rank=index+1;previousTime=rounded;for(const row of group.rows)row.rank=rank;}
  const priorPeak=Math.max(0,...Object.values(ledger.priorBonuses));
  for(const row of rows){if(row.eligible&&payBase){row.performanceGold=Math.round(performanceCap*Math.max(0,(finished.length-(row.rank||finished.length))/Math.max(1,finished.length-1)));if(finished.length===1)row.performanceGold=performanceCap;
    // Equalize the small rank bonus for active finishers. Earlier missing prizes
    // can add a bounded recovery grant; wallet/inventory spending cannot affect it.
    const equalizer=Math.round((performanceCap-row.performanceGold)*.75),priorGap=Math.max(0,priorPeak-(ledger.priorBonuses[row.owner]||0)),recovery=Math.min(Math.floor(base*.05),Math.ceil(priorGap*.25));row.catchupGold=Math.min(catchupCap,equalizer+recovery);
   }row.totalGold=row.baseGold+row.performanceGold+row.catchupGold;const h=this.player(row.owner);h.gold+=row.totalGold;h.survivalBonusGold=amount(h.survivalBonusGold)+row.performanceGold+row.catchupGold;if(payBase&&kind==='wave')this.gainXp(h,30);if(row.performanceGold||row.catchupGold)this.fx('waveReward',h.x,h.z,{source:h.id,amount:row.performanceGold+row.catchupGold,performance:row.performanceGold,catchup:row.catchupGold,wave:this.wave});
  }
  rows.sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity)||(a.time??Infinity)-(b.time??Infinity)||a.owner.localeCompare(b.owner));
  this.waveResults={id:ledger.id,kind,wave:this.wave,mode:modeOf(this),label:kind==='bonus'?`Bônus da onda ${this.wave}`:modeOf(this)==='tower'?`Andar ${this.wave}`:`Onda ${this.wave}`,timeBasis:['tower','war'].includes(modeOf(this))?'team':'individual',competitive:modeOf(this)!=='tower',startedAt:ledger.startedAt,finishedAt:this.time,rows,winnerOwners:rows.filter(r=>r.rank===1).map(r=>r.owner),policy:{basePreserved:true,baseGold:base,performanceCap,catchupCap,performancePercent:.10,catchupPercent:.15,equalizationFraction:.75,catchupBasis:'previous-cumulative-bonus-prizes',ranking:'completion-time',timePrecision:.1,ties:'shared-rank-and-performance',requiresContribution:true,contributionIncludes:'actual-damage-explicit-healing-and-tanking'}};
  this.survivalSettlements||={};this.survivalSettlements[key]=this.waveResults;this.roundResults=[...(this.roundResults||[]).filter(r=>r.id!==ledger.id),this.waveResults].slice(-5);return this.waveResults;
 }
};
