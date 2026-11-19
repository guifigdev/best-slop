import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../shared/simulation.js';
import {HEROES} from '../shared/catalog.js';
import {CASTLE_BUILDERS,castleBuilderFor} from '../shared/castle-builders.js';
import {CASTLE_RACES,CASTLE_BUILDINGS,CASTLE_ITEMS} from '../shared/castle-catalog.js';

const expected={knight:'human',mage:'elf',ranger:'nightelf',turtle:'naga',owl:'north',raccoon:'mech',orc:'orc',undead:'undead',chaos:'chaos',corrupted:'corrupted'};
function game(hero='knight',bot=false){const g=new Game(29,{mode:'castlefight'});g.addPlayer('a',hero,'Nome personalizado que deve ser substituído',bot);g.addPlayer('b','knight','Outro nome',bot);return{g,u:g.player('a')};}

test('all ten native Castle Fight races have a unique Portuguese builder, without animal construction skins',()=>{assert.equal(Object.keys(CASTLE_BUILDERS).length,10);assert.equal(Object.keys(HEROES).length,7);assert.deepEqual(Object.values(CASTLE_BUILDERS).map(p=>p.race).sort(),Object.keys(CASTLE_RACES).sort());assert.equal(Object.keys(CASTLE_RACES).length,10);for(const[hero,race]of Object.entries(expected)){const p=castleBuilderFor(hero);assert.equal(p.key,hero);assert.ok(Object.hasOwn(HEROES,p.hero));assert.equal(p.race,race);assert.ok(CASTLE_RACES[p.race]);for(const key of ['raceName','name','title','role','description'])assert.ok(typeof p[key]==='string'&&p[key].length>0,`${hero}/${key}`);assert.equal(castleBuilderFor({hero:p.hero,castleBuilderKey:hero}),p);assert.ok(Object.isFrozen(p));}assert.ok(Object.isFrozen(CASTLE_BUILDERS));for(const key of ['nature','invalid','__proto__',null,undefined])assert.equal(castleBuilderFor(key),null);});

test('preparation already shows the bound race, original identity, builder name and noncombat state',()=>{for(const hero of Object.keys(expected)){const {g,u}=game(hero),profile=castleBuilderFor(hero);assert.equal(g.phase,'preparation');assert.equal(u.hero,profile.hero);assert.equal(u.castleBuilderKey,hero);assert.equal(u.name,profile.name);assert.equal(u.castleBuilderTitle,profile.title);assert.equal(u.castleProfile.raceName,profile.raceName);assert.equal(u.castleRace,profile.race);assert.deepEqual(u.skills,[]);assert.deepEqual(u.inventory,[]);assert.equal(u.gold,250);assert.equal(u.lumber,125);const rendered=g.snapshot().units.find(v=>v.owner==='a');assert.equal(rendered.name,profile.name);assert.equal(rendered.castleRace,profile.race);assert.equal(castleBuilderFor(rendered),profile);assert.equal(rendered.castleBuilderKey,hero);}});

test('initialization ignores a legacy global race option and a forged builder race instead of rotating races by seat',()=>{for(const hero of Object.keys(expected)){const {g,u}=game(hero);g.options.race='chaos';u.castleRace='orc';assert.equal(g.initCastleFight(),true);assert.equal(u.castleRace,expected[hero]);assert.equal(g.castleFight.players.a.race,expected[hero]);assert.equal(g.castleFight.players.b.race,'human');assert.equal(u.name,castleBuilderFor(hero).name);}});

test('a race command cannot switch the builder race in preparation, live play or after a building exists',()=>{for(const hero of Object.keys(expected)){const {g,u}=game(hero),race=expected[hero],gold=u.gold,wood=u.lumber;for(const other of Object.keys(CASTLE_RACES).filter(k=>k!==race))assert.equal(g.command('a',{type:'cfRace',race:other}),false);assert.equal(g.command('a',{type:'cfRace',race}),true);assert.equal(u.castleRace,race);assert.equal(u.gold,gold);assert.equal(u.lumber,wood);assert.equal(g.initCastleFight(),true);for(const other of Object.keys(CASTLE_RACES).filter(k=>k!==race))assert.equal(g.command('a',{type:'cfRace',race:other}),false);const [key]=Object.entries(CASTLE_BUILDINGS).find(([,b])=>b.race===race&&b.playable&&b.unit&&!b.requiresBuilding);u.gold=u.lumber=100000;assert.equal(g.command('a',{type:'cfBuild',building:key,x:-32,z:0}),true);assert.equal(g.command('a',{type:'cfRace',race}),false);assert.equal(g.castleFight.players.a.race,race);}});

test('each of the ten selectable builders buys its own race catalog and rejects foreign buildings',()=>{for(const hero of Object.keys(expected)){const {g,u}=game(hero);g.initCastleFight();u.gold=u.lumber=100000;const race=expected[hero],gold=u.gold,wood=u.lumber;for(const foreign of Object.values(CASTLE_BUILDINGS).filter(b=>b.race!==race&&b.playable&&!b.requiresBuilding))assert.equal(g.command('a',{type:'cfBuild',building:foreign.key,x:-32,z:0}),false,`${hero} cannot build ${foreign.race}`);assert.equal(u.gold,gold);assert.equal(u.lumber,wood);const b=Object.values(CASTLE_BUILDINGS).find(b=>b.race===race&&b.playable&&b.unit&&!b.requiresBuilding);assert.equal(g.command('a',{type:'cfBuild',building:b.key,x:-32,z:0}),true);assert.equal(u.gold,gold-b.cost);assert.equal(u.lumber,wood-b.lumberCost);}});

test('Cheese keeps its original extra slot effect without changing a human builder into an Orc',()=>{const {g,u}=game();g.initCastleFight();u.gold=u.lumber=100000;g.castleFight.elapsed=30;u.x=u.z=0;assert.equal(g.command('a',{type:'cfItem',item:'cheese'}),true);assert.equal(g.castleFight.players.a.legendarySlots,2);assert.equal(g.command('a',{type:'cfRace',race:'orc'}),false);const legendary=Object.values(CASTLE_BUILDINGS).find(b=>b.race==='orc'&&b.legendary&&b.playable);assert.ok(legendary);assert.equal(g.command('a',{type:'cfBuild',building:legendary.key,x:-32,z:0}),false);assert.equal(CASTLE_ITEMS.cheese.playable,true);});

test('all ten bound builder races work for bots and produce troops without a separate race selector',()=>{for(const hero of Object.keys(expected)){const {g,u}=game(hero,true);assert.equal(g.initCastleFight(),true);for(let i=0;i<800&&g.phase==='wave';i++)g.tick(.1);const structures=g.castleFight.buildings.filter(b=>b.owner===u.owner);assert.ok(structures.length>0,`${hero} constructs`);assert.ok(structures.every(b=>CASTLE_BUILDINGS[b.key].race===expected[hero]));assert.ok(structures.some(b=>b.spawnCount>0),`${hero} sends an army`);assert.equal(g.castleFight.players.a.race,expected[hero]);}});


test('Castle-only builders cannot enter Survival, Line Wars or regular matchmaking identities',async()=>{
 const {Matchmaker}=await import('../server/matchmaking.js'),mm=new Matchmaker(()=>{});
 for(const key of ['orc','undead','chaos','corrupted']){
  for(const mode of ['campaign','tower','best','war','linewars']){const g=new Game(29,{mode});assert.equal(g.addPlayer('p',key),false);assert.equal(g.heroes().length,0);}
  assert.throws(()=>mm.identity('p',{hero:key}),/inválido/);
 }
});

test('serialized Castle Fight join choices preserve all ten builder identities and validate unknown choices',()=>{
 for(const key of Object.keys(CASTLE_BUILDERS)){
  const request=JSON.parse(JSON.stringify({hero:key,name:'Online',options:{mode:'castlefight'}})),g=new Game(29,request.options);
  assert.equal(g.addPlayer('p',request.hero,request.name),true);
  const u=JSON.parse(JSON.stringify(g.snapshot())).units.find(u=>u.owner==='p');
  assert.equal(castleBuilderFor(u).race,expected[key]);assert.equal(u.castleBuilderKey,key);assert.equal(u.castleBuilder,true);
 }
 for(const key of ['nature','invalid','__proto__',null,{hero:'knight',castleBuilderKey:'orc'}]){const g=new Game(29,{mode:'castlefight'});assert.equal(g.addPlayer('p',key),false);}
});

test('seeded Castle Fight bots can choose every race while ordinary bots remain combat heroes',()=>{
 const races=new Set();for(let seed=1;seed<=40;seed++){const g=new Game(seed,{mode:'castlefight'});g.addPlayer('p','knight');g.addBots();for(const u of g.heroes().filter(u=>u.bot)){races.add(u.castleRace);assert.equal(castleBuilderFor(u).race,u.castleRace);assert.equal(u.castleBuilder,true);}}
 assert.deepEqual([...races].sort(),Object.keys(CASTLE_RACES).sort());
 const g=new Game(29,{mode:'campaign'});g.addPlayer('p','knight');g.addBots();for(const u of g.heroes()){assert.ok(Object.hasOwn(HEROES,u.hero));assert.equal(u.castleBuilderKey,undefined);assert.equal(u.castleBuilder,undefined);}
});
