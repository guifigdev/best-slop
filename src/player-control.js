// Camera selection is observation, never transfer of authority to another hero.
export function controlBlockReason(player,{spectating=false,sharedArena=false,mode='',phase=''}={}){
 if(!player)return 'Escolha seu herói para enviar comandos.';
 if(!player.alive)return mode==='linewars'&&!player.lineEliminated?'Seu herói foi derrotado. Aguarde o renascimento na fonte.':'Seu herói foi derrotado nesta rodada. Você pode acompanhar os competidores vivos.';
 if(spectating&&!sharedArena)return 'Você está observando outra arena. Volte ao seu herói para escolher o destino.';
 if(player.stageDone&&phase==='wave')return 'Sua prova terminou. Aguarde os outros competidores; você pode observar suas arenas.';
 return '';
}

// Camera focus never changes command ownership. A point from another private
// trial cannot be used as a destination in the player's own distant instance.
export function heroesShareArena(state,owner,watched){
 const find=id=>state?.units?.find(u=>u.id===state.players?.[id]&&u.hero&&!u.summon);
 const own=find(owner),other=find(watched);if(!own||!other)return false;
 if(own.id===other.id)return true;
 if(!own.cell&&!other.cell)return true;
 return !!own.cell&&!!other.cell&&Math.abs(own.cell.x-other.cell.x)<.001&&Math.abs(own.cell.z-other.cell.z)<.001;
}
