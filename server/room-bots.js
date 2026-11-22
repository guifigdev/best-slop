import {randomUUID} from 'node:crypto';
import {capacity} from '../shared/modes.js';
import {RO_LINEAGES} from '../shared/ragnarok-jobs.js';
import {HEROES} from '../shared/catalog.js';
import {TREE_TAG_CHARACTERS} from '../shared/tree-tag-catalog.js';
import {WARLOCK_CHARACTERS} from '../shared/warlock-catalog.js';
import {CASTLE_BUILDERS} from '../shared/castle-builders.js';

export function removeRoomBot(room,id){
 const member=room.members.get(id);if(!member?.bot)return false;
 room.game.units=room.game.units.filter(u=>u.owner!==id);delete room.game.players[id];room.members.delete(id);return true;
}
export function addRoomBots(room,count){
 const game=room.game,mode=game.options.mode;let added=0;
 const remaining=Math.min(count,capacity(game.options)-game.heroes().length);
 for(let i=0;i<remaining;i++){
  const index=game.heroes().length,botId='ai-'+randomUUID();let key='knight',profile=null;
  if(mode==='bonk'){const lineage=Object.values(RO_LINEAGES)[index%Object.keys(RO_LINEAGES).length];key=lineage.hero;profile={lineage:lineage.key};}
  else if(mode==='phasekiller')key='townsperson';
  else if(mode==='kodotag')key='runner';
  else if(mode==='treetag')key=game.heroes().some(u=>u.treeTagRole==='infernal')?'ent':Object.keys(TREE_TAG_CHARACTERS).find(k=>TREE_TAG_CHARACTERS[k].role==='infernal');
  else if(mode==='warlock')key=Object.keys(WARLOCK_CHARACTERS)[index%Object.keys(WARLOCK_CHARACTERS).length];
  else if(mode==='castlefight')key=Object.keys(CASTLE_BUILDERS)[index%Object.keys(CASTLE_BUILDERS).length];
  else key=Object.keys(HEROES)[index%Object.keys(HEROES).length];
  if(!game.addPlayer(botId,key,'Bot '+(index+1),true,null,profile))break;
  const u=game.player(botId);u.roomBot=true;u.bonkDisconnected=false;u.name='Bot '+(index+1)+' · '+u.name;
  room.members.set(botId,{id:botId,hero:key,name:u.name,bot:true,disconnectedAt:null});added++;
 }
 return added;
}
