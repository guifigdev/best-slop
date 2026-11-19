import {KEYS} from '../shared/catalog.js';
export const SHORTCUTS=[
 ['Castle Fight','Q + clique','Blink do construtor; W ou Esc cancela'],['Castle Fight','E','Demolir a construção própria selecionada'],['Castle Fight','G','Visitar a torre central de itens'],['Castle Fight','Catálogo + clique no terreno','Posicionar construção na região da sua equipe'],['Castle Fight','Segurar Enter + clique','Manter a construção selecionada para construir várias; botão Construir várias no toque'],
 ['Comandos','Botão direito','Mover no chão / atacar inimigo'],['Comandos','A + clique','Atacar ao mover'],['Comandos','M + clique','Mover'],['Comandos','G','Falar com o comerciante mais próximo'],['Comandos','S','Parar / interromper canalização'],['Comandos','H','Manter posição'],
 ['Técnicas','Botão direito na técnica','Ativar / desativar conjuração automática'],['Câmera','Avatar de jogador','Observar a linha dele no Line Wars'],['Técnicas','Q W E R D F C','Usar os sete espaços de técnicas'],['Técnicas','1 2 3 4 5 6','Usar consumível no espaço da mochila'],['Técnicas','I','Abrir atributos e equipamentos'],['Técnicas','L','Abrir espólios e trocar técnicas especiais'],['Técnicas','Shift + clique no item','Vender equipamento/consumível na loja'],
 ['Comandos','T','Examinar próximo inimigo'],['Comandos','Clique esquerdo no inimigo','Consultar atributos e técnicas'],
 ['Câmera','Roda do mouse','Aproximar / afastar'],['Câmera','Arraste com mouse / um dedo','Puxar o terreno no modo Mover'],['Câmera','Botão Mover / Girar','Alternar deslocamento e rotação sem teclado'],['Câmera','Dois dedos','Pinça para zoom; arraste para deslocar'],['Câmera','Setas','Deslocar câmera'],['Câmera','Espaço / F1','Selecionar e centralizar herói'],
 ['Diálogos','Enter / Espaço','Revelar texto; se completo, avançar'],['Diálogos','Esc','Fechar diálogo / cancelar mira / fechar modal'],['Interface','? / F2','Mostrar todos os atalhos']
];
// Framework-independent input hook. Returns cleanup, shares context with the store.
export function useShortcuts({target=window,context,onAction}){
 const held=new Set();
 const editable=event=>event.target?.matches?.('input,textarea,select,[contenteditable=true]');
 function down(e){if(editable(e))return;const c=context(),key=e.key.toUpperCase();
  if(key==='ESCAPE'){e.preventDefault();onAction('escape');return;}
  if(key==='F2'||e.key==='?'){e.preventDefault();if(!e.repeat)onAction('help');return;}
  if(c.modal)return;
  if(c.dialog){if(e.key==='Enter'||e.code==='Space'){e.preventDefault();if(!e.repeat)onAction('dialogNext');}return;}
  if(!c.playing||c.modal)return;
  if(e.key==='Enter'&&c.repeatBuild){e.preventDefault();held.add('Enter');return;}
  if(e.key.startsWith('Arrow')){e.preventDefault();held.add(e.key);return;}
  if(e.repeat)return;
  if(KEYS.includes(key)){e.preventDefault();onAction('skill',KEYS.indexOf(key));}
  else if(/^[1-6]$/.test(key)){e.preventDefault();onAction('item',Number(key)-1);}
  else if(key==='G')onAction('interact');
  else if(key==='T')onAction('inspect');
  else if(key==='L')onAction('loot');
  else if(key==='I')onAction('attributes');
  else if(key==='A')onAction('attackMove');else if(key==='M')onAction('move');
  else if(key==='S')onAction('stop');else if(key==='H')onAction('hold');
  else if(key==='F1'||e.code==='Space'){e.preventDefault();onAction('center');}
 }
 const up=e=>held.delete(e.key),blur=()=>held.clear();
 target.addEventListener('keydown',down);target.addEventListener('keyup',up);target.addEventListener('blur',blur);
 return{held,destroy(){target.removeEventListener('keydown',down);target.removeEventListener('keyup',up);target.removeEventListener('blur',blur);held.clear();}};
}
