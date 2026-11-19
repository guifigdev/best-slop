// Camera selection is observation, never transfer of authority to another hero.
export function controlBlockReason(player,{spectating=false,mode='',phase=''}={}){
 if(!player)return 'Escolha seu herói para enviar comandos.';
 if(!player.alive)return mode==='linewars'&&!player.lineEliminated?'Seu herói foi derrotado. Aguarde o renascimento na fonte.':'Seu herói foi derrotado nesta rodada. Você pode acompanhar os competidores vivos.';
 if(spectating)return 'Você está observando outro herói. Espaço/F1 volta ao seu personagem; aliados e rivais mantêm seus próprios comandos.';
 if(player.stageDone&&phase==='wave')return 'Sua prova terminou. Aguarde os outros competidores; você pode observar suas arenas.';
 return '';
}
