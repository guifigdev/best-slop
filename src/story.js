import {HEROES} from '../shared/catalog.js';
import {ARENAS} from '../shared/arenas.js';
export const INTRO=[
 ['Orfeu','Arauto do Coliseu','Bem-vindo ao Torneio das Mil Formas. Seis clãs procuram o herói perfeito. Você enfrentará cinquenta ondas em cinco coliseus e, ao último sino, os próprios competidores. No solo, seus rivais são controlados por IA.'],
 ['Orfeu','O mercado é uma corrida','Você começa na loja e retorna a cada cinco ondas, depois de um desafio de velocidade. Quem conclui mais rápido recebe mais ouro. Os equipamentos têm estoque compartilhado: quem compra primeiro leva. Sua mochila comporta seis espaços.'],
 ['Orfeu','Sua build evolui','Cada técnica tem cinco níveis: os níveis documentados de Warcraft 3 são a base; os adicionais são extensões do coliseu. Suba seu herói para liberar melhorias. Ao subir de nível, distribua pontos em STR, INT, DEX, LUK, VIT e AGI na aba Herói (I).'],
 ['Orfeu','Leia o terreno','Os coliseus mudam a cada dez ondas. Lava queima. Gelo escorrega. Frio intenso aplica frost, lentidão e dano gradual. Na tempestade, saia da marca do raio. Equipamentos de proteção podem salvar sua build.'],
 ['Orfeu','Seu primeiro comando','Direito move ou ataca. A + clique avança atacando. S para, H mantém posição. Q W E R D F C usam técnicas; 1 a 6 usam potes. Roda aproxima; meio + arraste gira; Shift + meio move a câmera. Espaço centraliza. F2 ou ? abre todos os atalhos.']
];
export function storyFor(state){
 const arena=ARENAS[state.arena];
 if(state.phase==='finalCountdown'||state.phase==='final')return ['Orfeu','O último sino','Cinquenta ondas se passaram. Todos recuperam vida e mana. Agora cada candidato luta por si. O último em pé terá sua build gravada no pedestal. Depois de um minuto, a arena começará a consumir todos: não há espaço para se esconder.'];
 if(state.phase==='bonus')return ['Orfeu','A prova da velocidade','Cada candidato recebeu três Ecos próprios. Derrote os seus: você não pode interferir nos alvos dos outros. Menor tempo ganha mais ouro para a loja. Quem não concluir em 45 segundos fica sem o prêmio.'];
 if(state.phase==='bonusResults')return ['Orfeu','O ouro segue a velocidade','Os tempos foram registrados na Crônica. O primeiro a concluir ganha 500 moedas, os seguintes recebem menos. Em instantes o mercado reabre — os itens raros são de quem chegar primeiro.'];
 if(state.phase==='preparation')return ['Orfeu','Mercado do coliseu',state.wave===0?'Escolha técnicas, distribua os seis pontos iniciais e prepare sua mochila. Os rivais IA começam a comprar após alguns segundos. Toque o sino quando estiver pronto.':'Vida e mana restauradas, estoque renovado. Evolua técnicas, confira seus atributos e não esqueça os consumíveis. Shift + clique vende um item por metade do valor.'];
 if(state.phase==='wave')return ['Orfeu',`Onda ${state.wave} de 50 · ${arena.name}`,arena.description];
 if(state.phase==='intermission')return ['Orfeu','Um instante entre os sinos','Você recebe ouro e experiência a cada onda. Parte da vida e mana se recupera entre elas. A loja volta depois da quinta onda de cada bloco. Use seus pontos de atributo mesmo durante a batalha.'];
 return null;
}
export function readHall(storage){try{const rows=JSON.parse(storage.getItem('custom-hero-hall-v2')||'[]');return Array.isArray(rows)?rows.filter(r=>r&&Object.hasOwn(HEROES,r.hero)&&Number.isFinite(r.score)&&Array.isArray(r.skills)).slice(0,10):[];}catch{return [];}}
export function recordRun(storage,p,state){const entry={hero:p.hero,score:p.kills*25+state.wave*150+p.level*50+(state.phase==='victory'?2000:0),wave:state.wave,kills:p.kills,level:p.level,skills:[...p.skills],skillLevels:{...p.skillLevels},attributes:{...p.totalAttributes},inventory:(p.inventory||[]).filter(Boolean).map(x=>({...x})),victory:state.phase==='victory',date:new Date().toISOString()};const rows=[...readHall(storage),entry].sort((a,b)=>b.score-a.score).slice(0,10);try{storage.setItem('custom-hero-hall-v2',JSON.stringify(rows));}catch{}return rows;}
