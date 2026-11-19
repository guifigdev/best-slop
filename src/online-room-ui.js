import {escapeHTML as esc} from './competition-ui.js';
import {patchHTML} from './snapshot-dom.js';
import './online-room.css';
export function createOnlineRoomUI({getState,getOwner,send}){
 let host,chat=[],draft='';
 function render(){const state=getState(),room=state?.onlineRoom;if(!room){host?.remove();host=null;return;}if(!host){host=document.createElement('details');host.className='online-room-panel';host.innerHTML='<summary></summary><div data-room-body></div><form><label>Chat da sala<input maxlength="240" autocomplete="off"></label><button type="submit">Enviar</button></form>';document.getElementById('world')?.append(host);const input=host.querySelector('input');input.oninput=()=>draft=input.value;host.querySelector('form').onsubmit=e=>{e.preventDefault();if(draft.trim()&&send({type:'roomChat',text:draft.trim()})){draft='';input.value='';}};}
  host.querySelector('summary').textContent='Sala '+room.code+(room.isHost?' · você é o host':'');
  if(room.messages)chat=room.messages;const html=`<p>${room.started?'Partida em andamento':'Preparação · o host pode iniciar quando o grupo estiver pronto.'}</p><ul>${room.players.map(p=>`<li>${esc(p.name)}${p.host?' · host':''}${p.connected?'':' · desconectado'}${room.isHost&&!room.started&&p.id!==getOwner()?`<button type="button" data-room-kick="${esc(p.id)}">Remover</button>`:''}</li>`).join('')}</ul>${room.isHost&&!room.started?'<button type="button" data-room-start>Iniciar sala</button>':''}<div class="room-chat-log">${chat.map(m=>`<p><b>${esc(m.name)}</b> ${esc(m.text)}</p>`).join('')}</div>`;
  const body=host.querySelector('[data-room-body]');patchHTML(body,html,['data-room-start','data-room-kick']);body.querySelector('[data-room-start]')?.addEventListener('click',()=>send({type:'roomStart'}),{once:true});for(const b of body.querySelectorAll('[data-room-kick]'))b.onclick=()=>send({type:'roomKick',playerId:b.dataset.roomKick});
 }
 return{render,setChat(messages){chat=messages||[];},reset(){host?.remove();host=null;chat=[];draft='';}};
}
