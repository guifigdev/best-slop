import {SKILLS,HEROES,skillAt,skillDescription,levelOf} from '../shared/catalog.js';
import {skillRequirement} from '../shared/skill-access.js';
import {icon,portrait} from './art.js';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
const paths={available:'M10 4v12M4 10h12',upgrade:'m4 10 6-6 6 6M10 4v12',occupied:'M5 9h10v8H5zM7 9V6a3 3 0 0 1 6 0v3',level:'M3 16h4v-4h4V8h5V4M12 4h4v4',points:'m10 2 7 8-7 8-7-8zM4 16 16 4',slots:'M3 3h5v5H3zm9 0h5v5h-5zM3 12h5v5H3zm9 0h5v5h-5z',drop:'m10 2 7 7-3 8H7L3 9zM10 2v15M3 9h14',max:'M17 10a7 7 0 1 1-2-5M6 10l3 3 7-8',hero:'M4 17V9l6-6 6 6v8M7 17v-6h6v6',ended:'M4 4h12v12H4zM7 7l6 6m0-6-6 6',ultimate:'m3 15-1-9 5 4 3-7 3 7 5-4-1 9zM4 17h12'};
function glyph(key){return `<svg viewBox="0 0 20 20" aria-hidden="true" class="skill-state-glyph"><path d="${paths[key]||paths.available}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function minimumLevel(key,rank,base){const schedule=base.rankHeroLevels?.[rank-1],requirement=skillRequirement(key,rank);return Math.max(requirement,Number.isFinite(schedule)?schedule:1,Number.isFinite(base.minHeroLevel)?base.minHeroLevel:1);}
function holderFor(p,key,state){const entry=state?.skillOwners?.[key];if(!entry||entry.owner===p?.owner)return null;const unit=state?.units?.find(u=>u.owner===entry.owner&&u.hero&&!u.summon),hero=unit?.hero||entry.hero;return{name:entry.name||unit?.name||'outro herói',hero:Object.hasOwn(HEROES,hero)?hero:null};}
function holderMarkup(holder){const avatar=holder.hero?portrait(holder.hero):'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v8H8zM4 15h16v6H4z" fill="currentColor"/></svg>';return `<span class="skill-owner"><span class="skill-owner-avatar">${avatar}</span><span><small>Reservada a</small><b>${escapeHTML(holder.name)}</b></span>${glyph('occupied')}</span>`;}

/** Catalog cards only. The caller binds data-buy after authoritative rendering. */
export function skillShopMarkup(p,state={}){
 return Object.entries(SKILLS).map(([key,base])=>{
  const rank=levelOf(p||{},key),next=Math.min(5,rank+1),s=skillAt(key,next),required=minimumLevel(key,next,base),level=amount(p?.level),points=amount(p?.skillPoints),slots=Array.isArray(p?.skills)?p.skills.length:0,holder=holderFor(p,key,state),max=rank>=5,fromDrop=base.dropOnly&&!rank,levelLocked=!max&&level<required,slotsLocked=!rank&&slots>=7,pointsLocked=!max&&points<1,ended=['victory','defeat'].includes(state?.phase);
  let access='available',label=rank?`Evoluir ${rank} → ${next}`:'Aprender · Nv. 1',reason='Custa 1 ponto de habilidade. Pode ser aprendida mesmo durante a batalha.';
  if(!p){access='hero';label='Escolha seu herói';reason='Entre em uma partida para aprender técnicas.';}
  else if(ended){access='ended';label='Tentativa encerrada';reason='Inicie outra saga para escolher uma nova combinação.';}
  else if(holder){access='occupied';label='Em uso por outro herói';reason='Esta técnica já pertence a outro herói da sala.';}
  else if(max){access='max';label='Dominada · Nv. 5 / 5';reason='Sua técnica já atingiu o nível máximo.';}
  else if(levelLocked){access='level';label=`Requer herói Nv. ${required}`;reason=`Seu herói está no nível ${level}. ${rank?'A próxima melhoria':'Esta técnica'} exige nível ${required}.`;}
  else if(fromDrop){access='drop';label='Fragmento de besta';reason='Aprenda por um espólio ou por uma escolha com essências. Depois, evolua com pontos de habilidade.';}
  else if(slotsLocked){access='slots';label='Sete espaços ocupados';reason='Sua build já tem sete técnicas. Substituições são feitas nos espólios; melhorar uma técnica atual não exige novo espaço.';}
  else if(pointsLocked){access='points';label='Sem pontos de habilidade';reason='Ao subir de nível, você ganha 1 ponto para aprender ou melhorar uma técnica.';}
  else if(rank){access='upgrade';reason=`Melhorar para o nível ${next} custa 1 ponto e mantém o mesmo espaço da build.`;}
  const enabled=access==='available'||access==='upgrade',alias=key==='critical'?'Golpe crítico':'',details=skillDescription(key,next),stateName=max?'max':rank?'upgrade':'learn',requirements=[];
  if(base.ultimate)requirements.push(`<span class="skill-badge skill-badge-ultimate">${glyph('ultimate')} Ultimate · Nv. ${required}</span>`);
  else if(required>1)requirements.push(`<span class="skill-badge skill-badge-level">${glyph('level')} Nv. ${required}</span>`);
  if(rank&&!max)requirements.push(`<span class="skill-badge skill-badge-owned">Sua técnica · Nv. ${rank}</span>`);
  if(base.dropOnly)requirements.push(`<span class="skill-badge skill-badge-drop">${glyph('drop')} De espólios</span>`);
  if(p&&!max&&!holder){if(levelLocked)requirements.push('<span class="skill-extra-block skill-extra-level">Nível insuficiente</span>');if(slotsLocked&&access!=='slots')requirements.push('<span class="skill-extra-block skill-extra-slots">Sem espaço livre</span>');if(pointsLocked&&access!=='points'&&!fromDrop)requirements.push('<span class="skill-extra-block skill-extra-points">0 pontos disponíveis</span>');}
  const action=max?'✓':holder?'Exclusiva':fromDrop?'Espólio':'✦ 1';
  return `<button type="button" class="shop-item skill-card skill-access-${access}${base.ultimate?' skill-is-ultimate':''}" data-buy="${key}" data-state="${stateName}" data-access="${access}" data-search="${escapeHTML(s.name+' '+alias)}" ${enabled?'':'disabled'} aria-label="${escapeHTML(s.name)}${alias?', '+alias:''}. ${escapeHTML(label)}. ${escapeHTML(reason)}" title="${escapeHTML(details)}"><span class="shop-icon skill-card-icon">${icon(key)}</span><span class="skill-card-body"><span class="shop-name">${escapeHTML(s.name)}</span>${alias?`<span class="skill-alias">${alias} · passiva</span>`:''}<span class="skill-card-badges">${requirements.join('')}</span><span class="shop-type skill-access-label">${glyph(access)}${escapeHTML(label)}</span>${holder?holderMarkup(holder):''}<span class="shop-description skill-description">${escapeHTML(details)}</span><span class="shop-reason skill-lock-note">${escapeHTML(reason)}</span></span><span class="price skill-card-action">${action}${enabled?'<small>ponto</small>':''}</span></button>`;
 }).join('');
}
