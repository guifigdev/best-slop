import test from 'node:test';
import assert from 'node:assert/strict';
import {CASTLE_ITEMS,CASTLE_LAYOUT} from '../shared/castle-catalog.js';
import {CASTLE_BLAST_PROJECTILE_SPEED,launchCastleBlast,tickCastleItemProjectiles,castleBlastDamage} from '../shared/castle-item-effects.js';

function fixture(){
 const holder={id:1,owner:'a',team:1,alive:true,castleBuilder:true,x:0,z:0,gold:100},target={id:2,owner:'enemy',team:2,alive:true,castleUnit:true,x:2,z:0,hp:500,maxHp:500,armor:20,armorType:'heavy',bounty:12};
 const game={phase:'wave',time:0,serial:10,effects:[],castleFight:{elapsed:0,finished:false,map:{minX:-52,maxX:52,minZ:-28,maxZ:28},players:{a:{owner:'a',team:1,items:{blast_staff:{key:'blast_staff',boughtAt:0,nextAt:0}}}},units:[target],projectiles:[]},id(){return++this.serial;},player(owner){return owner==='a'?holder:null;},fx(type,x,z,data={}){this.effects.push({type,x,z,...data});}};
 return{game,holder,target,item:CASTLE_ITEMS.blast_staff,owned:game.castleFight.players.a.items.blast_staff};
}
const advance=(game,dt)=>{game.time+=dt;game.castleFight.elapsed+=dt;return tickCastleItemProjectiles(game,dt);};

test('Blast Staff launches a serializable visible projectile and applies its sixty damage only on impact',()=>{
 const {game,holder,target,item,owned}=fixture();assert.equal(CASTLE_BLAST_PROJECTILE_SPEED,1000*CASTLE_LAYOUT.scale);assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),true);assert.equal(target.hp,500);assert.equal(owned.nextAt,1);assert.equal(game.castleFight.projectiles.length,1);const projectile=game.castleFight.projectiles[0];assert.equal(projectile.target,target.id);assert.equal(projectile.kind,'blast_staff');assert.equal(projectile.attackType,'spells');assert.deepEqual(JSON.parse(JSON.stringify(projectile)),projectile);assert.equal(advance(game,.1),0);assert.ok(projectile.x>0&&projectile.x<target.x);assert.equal(target.hp,500);for(let i=0;i<5;i++)advance(game,.1);assert.equal(target.hp,440);assert.equal(game.castleFight.projectiles.length,0);assert.equal(game.effects.filter(e=>e.type==='castleBlastLaunch').length,1);assert.equal(game.effects.filter(e=>e.type==='castleBlastImpact').length,1);advance(game,1);assert.equal(target.hp,440);
});

test('missing, allied, out-of-range and structural targets never consume a passive polling cooldown',()=>{
 const {game,holder,target,item,owned}=fixture();assert.equal(launchCastleBlast(game,holder,null,item,'blast_staff'),false);target.team=1;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);target.team=2;target.x=item.radius+.001;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);target.x=2;target.castleStructure=true;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);delete target.castleStructure;assert.equal(launchCastleBlast(game,holder,{...target,id:8},item,'blast_staff'),false);assert.equal(owned.nextAt,0);assert.deepEqual(game.castleFight.projectiles,[]);game.castleFight.elapsed=.9;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),true);assert.equal(owned.nextAt,1.9);
});

test('real item ownership and its one-second cadence are authoritative even with a forged caller definition',()=>{
 const {game,holder,target,item,owned}=fixture();delete game.castleFight.players.a.items.blast_staff;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);game.castleFight.players.a.items.blast_staff=owned;assert.equal(launchCastleBlast(game,holder,target,{...item,damage:99999,radius:999},'blast_staff'),true);assert.equal(game.castleFight.projectiles[0].damage,60);assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);advance(game,.99);assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),false);advance(game,.01);assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),true);assert.equal(launchCastleBlast(game,holder,target,item,'__proto__'),false);assert.equal(launchCastleBlast(game,holder,target,item,'double_damage'),false);
});

test('air targets and targets leaving acquisition range are followed in flight; holder movement does not teleport missiles',()=>{
 const {game,holder,target,item}=fixture();target.flying=true;target.altitude=2;target.x=item.radius;assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),true);const projectile=game.castleFight.projectiles[0];holder.x=-20;advance(game,.1);assert.ok(projectile.x>0);assert.ok(projectile.height>.85);assert.equal(projectile.targetHeight,2.75);target.x=4;for(let i=0;i<20&&target.hp===500;i++)advance(game,.1);assert.equal(target.hp,440);assert.equal(game.castleFight.projectiles.length,0);
});

test('spell armor counters and explicit spell resistance apply without physical armor, criticals or attack damage buffs',()=>{
 const {game,holder,target,item}=fixture();holder.damage=10000;holder.castleBuffs={quad_damage:{damageBonus:3,until:100}};game.castleFight.players.a.items.bass_drums={key:'bass_drums'};for(const [armorType,expected]of [['heavy',60],['hero',42],['divine',15]]){target.armorType=armorType;target.armor=10000;target.castleBuffs={stone_scroll:{armor:8,until:100}};assert.equal(castleBlastDamage({damage:item.damage},target),expected);}target.armorType='heavy';target.spellResistance=.5;assert.equal(castleBlastDamage({damage:60},target),30);assert.equal(launchCastleBlast(game,holder,target,item,'blast_staff'),true);advance(game,1);assert.equal(target.hp,470);target.magicImmune=true;assert.equal(castleBlastDamage({damage:60},target),0);
});

test('dead or converted targets cancel safely, while a launched shot survives its holder and awards a kill once',()=>{
 for(const mutate of [target=>{target.alive=false;},target=>{target.team=1;}]){const {game,holder,target,item}=fixture();launchCastleBlast(game,holder,target,item,'blast_staff');mutate(target);advance(game,.1);assert.equal(target.hp,500);assert.equal(game.castleFight.projectiles.length,0);assert.equal(holder.gold,100);}
 const {game,holder,target,item}=fixture();target.hp=40;launchCastleBlast(game,holder,target,item,'blast_staff');holder.alive=false;advance(game,1);assert.equal(target.hp,0);assert.equal(target.alive,false);assert.equal(holder.gold,112);advance(game,1);assert.equal(holder.gold,112);assert.equal(game.effects.filter(e=>e.type==='castleDeath').length,1);
});

test('the optional engine damage hook receives already mitigated spell damage and the original owner/source',()=>{
 const {game,holder,target,item}=fixture();target.armorType='hero';launchCastleBlast(game,holder,target,item,'blast_staff');const calls=[];const count=tickCastleItemProjectiles(game,1,(unit,amount,projectile)=>{calls.push({id:unit.id,amount,owner:projectile.owner,source:projectile.source,attackType:projectile.attackType});unit.hp-=amount;return amount;});assert.equal(count,1);assert.equal(target.hp,458);assert.deepEqual(calls,[{id:target.id,amount:42,owner:holder.owner,source:holder.id,attackType:'spells'}]);assert.equal(game.effects.filter(e=>e.type==='damage').length,0);assert.equal(game.effects.find(e=>e.type==='castleBlastImpact').amount,42);
});

test('invalid ticks preserve state and terminal cleanup removes only item projectiles',()=>{
 const {game,holder,target,item}=fixture();launchCastleBlast(game,holder,target,item,'blast_staff');game.castleFight.projectiles.push({id:55,kind:'army_arrow',x:0,z:0});const before=JSON.stringify(game.castleFight.projectiles);for(const dt of [0,-1,NaN,Infinity]){assert.equal(tickCastleItemProjectiles(game,dt),0);assert.equal(JSON.stringify(game.castleFight.projectiles),before);}game.phase='victory';assert.equal(tickCastleItemProjectiles(game,.1),0);assert.deepEqual(game.castleFight.projectiles,[{id:55,kind:'army_arrow',x:0,z:0}]);assert.equal(target.hp,500);
});
