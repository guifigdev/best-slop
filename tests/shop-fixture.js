import assert from 'node:assert/strict';
import {SHOPS,shopForItem} from '../shared/shops.js';
import {merchantPosition} from '../shared/instances.js';
// Inventory/economy tests start at the appropriate vendor. Walking and remote
// rejection are covered separately in shops.test.js and network.test.js.
export function transact(game,id,command){const u=game.player(id),npc=command.type==='item'?shopForItem(command.item):command.type==='upgradeItem'?'smith':command.type==='enchantItem'?'enchanter':'equipment';if(u?.alive&&game.phase==='preparation'&&npc){const point=merchantPosition(u,SHOPS[npc]);u.x=point.x;u.z=point.z+1.5;assert.equal(game.command(id,{type:'interact',npc}),true);}return game.command(id,command);}
