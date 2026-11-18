import {ARENA_BOUNDS} from './arena-size.js';
export const privateTrials=mode=>['campaign','best','war','linewars'].includes(mode);
export function homeCell(game,u){if(!privateTrials(game.options.mode))return null;const index=game.options.mode==='war'?u.squad-1:u.seat;return{x:index*56,z:0,r:ARENA_BOUNDS,key:game.options.mode==='war'?`team-${u.squad}`:u.owner};}
export function merchantPosition(u,shop){return{...shop,x:shop.x+(u?.cell?.x||0),z:shop.z+(u?.cell?.z||0)};}
export const instanceMethods={
 setupHome(u,x=-4,z=-8.8){const cell=homeCell(this,u);if(!cell)return;u.cell=cell;u.challenge=cell.key;u.x=cell.x+x;u.z=cell.z+z;this.bounds=Math.max(this.bounds,Math.abs(cell.x)+ARENA_BOUNDS+2);const cells=new Map((this.cells||[]).map(c=>[c.key,c]));cells.set(cell.key,cell);this.cells=[...cells.values()];},
 homePosition(u,x=-4,z=2){if(privateTrials(this.options.mode)&&!['final','finalCountdown'].includes(this.phase))this.setupHome(u,x,z);else{delete u.cell;delete u.challenge;u.x=x;u.z=z;}},
 lootToXp(u,c){const drop=(this.drops||[]).find(d=>d.id===c.dropId&&d.owner===u.owner&&d.expires>this.time);if(!u.alive||!drop||!u.skills.includes(drop.skill))return false;const xp=drop.xp||40,stack=u.inventory.find(s=>s?.key==='xpbook'&&s.xpValue===xp&&s.charges<3),empty=u.inventory.findIndex(s=>!s);if(!stack&&empty<0&&u.inventory.length>=6)return false;if(stack)stack.charges++;else{const tome={key:'xpbook',charges:1,xpValue:xp,rarity:drop.rarity||'common'};if(empty>=0)u.inventory[empty]=tome;else u.inventory.push(tome);}this.drops=this.drops.filter(d=>d.id!==drop.id);this.fx('lootXp',u.x,u.z,{source:u.id,amount:xp});return true;}
};
