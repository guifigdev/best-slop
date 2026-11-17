import {randomBytes} from 'node:crypto';
import {HEROES} from '../shared/catalog.js';
import {modeOptions} from '../shared/modes.js';
export class Matchmaker{
 constructor(onMatch){this.parties=new Map();this.members=new Map();this.onMatch=onMatch;}
 party(id){return this.parties.get(this.members.get(id));}
 identity(id,input){if(!Object.hasOwn(HEROES,input.hero))throw Error('Herói inválido.');return{id,hero:input.hero,name:String(input.name||HEROES[input.hero].name).slice(0,20)};}
 create(id,input={}){if(this.members.has(id))throw Error('Você já está em uma party.');if(this.parties.size>=128)throw Error('Limite de parties atingido.');const options=modeOptions({...input,mode:'war'}),code=randomBytes(4).toString('hex').toUpperCase(),party={code,host:id,options,players:[this.identity(id,input)],queued:false};this.parties.set(code,party);this.members.set(id,code);return party;}
 join(id,code,input){if(this.members.has(id))throw Error('Saia da party atual primeiro.');const p=this.parties.get(String(code).trim().toUpperCase());if(!p||p.queued||p.players.length>=p.options.teamSize)throw Error('Party indisponível, cheia ou já na busca.');p.players.push(this.identity(id,input));this.members.set(id,p.code);return p;}
 leave(id){const p=this.party(id);if(!p)return;p.queued=false;p.players=p.players.filter(u=>u.id!==id);this.members.delete(id);if(!p.players.length)this.parties.delete(p.code);else if(p.host===id)p.host=p.players[0].id;return p;}
 queue(id){const p=this.party(id);if(!p||p.host!==id)throw Error('Somente o líder pode buscar uma partida.');if(p.players.length!==p.options.teamSize)throw Error(`Convide ${p.options.teamSize-p.players.length} amigo(s) para completar sua equipe.`);p.queued=true;this.match();return p;}
 cancel(id){const p=this.party(id);if(p)p.queued=false;return p;}
 format(p){return `${p.options.teamSize}:${p.options.teamCount}:${p.options.clashEvery}`;}
 state(p){return{code:p.code,host:p.host,options:p.options,players:p.players,queued:p.queued,waitingParties:[...this.parties.values()].filter(q=>q.queued&&this.format(q)===this.format(p)).length,neededParties:p.options.teamCount};}
 match(){for(const p of [...this.parties.values()]){if(!p.queued)continue;const selected=[...this.parties.values()].filter(q=>q.queued&&this.format(q)===this.format(p)).slice(0,p.options.teamCount);if(selected.length<p.options.teamCount)continue;for(const q of selected){this.parties.delete(q.code);for(const u of q.players)this.members.delete(u.id);}this.onMatch(selected,p.options);}}
}
