import assert from 'node:assert/strict';
import {SHOPS,shopForItem} from '../shared/shops.js';
// Inventory/economy tests start at the appropriate vendor. Walking and remote
// rejection are covered separately in shops.test.js and network.test.js.
export function transact(game,id,command){const u=game.player(id),npc=command.type==='item'?shopForItem(command.item):command.type==='upgradeItem'?'smith':command.type==='enchantItem'?'enchanter':'equipment';if(u?.alive&&game.phase==='preparation'&&npc){u.x=SHOPS[npc].x;u.z=SHOPS[npc].z+1.5;assert.equal(game.command(id,{type:'interact',npc}),true);}return game.command(id,command);}
