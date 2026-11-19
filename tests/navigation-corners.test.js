import test from 'node:test';
import assert from 'node:assert/strict';
import {moveCastleUnit,castlePassable} from '../shared/castle-navigation.js';
import {bloodyBattleContext} from '../shared/bloody-battlefield.js';

test('large units finish native east-front corners without skipping into the inflated wall',()=>{
 for(const radius of [.8,1.2])for(const speed of [2.8,3.6,5])for(const dt of [1/30,.05,.1]){
  const game={time:0,units:[]},context=bloodyBattleContext(game),unit={id:1,x:30,z:-3.5,collisionRadius:radius,speed,alive:true};
  assert.ok(castlePassable(context,unit,radius));let reached=false;
  for(let t=0;t<45;t+=dt){game.time+=dt;context.elapsed=game.time;reached=moveCastleUnit(context,unit,{x:0,z:0},dt);assert.ok(!unit.castleNavigationBlocked,`${radius}/${speed}/${dt}: skipped a blocked corner at ${unit.x},${unit.z}`);assert.ok(castlePassable(context,unit,radius));if(reached)break;}
  assert.equal(reached,true,`${radius}/${speed}/${dt}`);assert.ok(Math.hypot(unit.x,unit.z)<.2);
 }
});
