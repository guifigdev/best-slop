// Original animals and mythical challengers. These are not Warcraft assets.
export const MONSTERS={
 lion:{name:'Leão da juba solar',size:1.2,color:0xd8aa56,skill:'battlecry',unlockWave:4,hpMultiplier:1.15,damageMultiplier:1.1,armorBonus:1},
 rhino:{name:'Rinoceronte de basalto',size:1.45,color:0x92978d,skill:'hornrush',unlockWave:7,hpMultiplier:1.45,damageMultiplier:1.05,armorBonus:3},
 griffin:{name:'Grifo das tempestades',size:1.25,color:0xd9c994,skill:'stormdive',unlockWave:12,hpMultiplier:1.3,damageMultiplier:1.15,armorBonus:1},
 chimera:{name:'Quimera do brejo',size:1.35,color:0x9f85ba,skill:'venomcloud',unlockWave:18,hpMultiplier:1.4,damageMultiplier:1.1,armorBonus:2},
 dragon:{name:'Dragão das brasas',size:1.6,color:0xbe7751,skill:'flamebreath',unlockWave:25,hpMultiplier:1.65,damageMultiplier:1.2,armorBonus:3},
 sphinx:{name:'Esfinge do crepúsculo',size:1.45,color:0xc9b589,skill:'stonehide',unlockWave:32,hpMultiplier:1.5,damageMultiplier:1.15,armorBonus:6}
};

export function monsterKind(base,wave,roll,boss=false){
 const available=Object.keys(MONSTERS).filter(key=>wave>=MONSTERS[key].unlockWave),r=Math.max(0,Math.min(.999999,Number.isFinite(roll)?roll:0));
 if(!available.length)return base;
 if(boss){const mythic=available.filter(key=>['griffin','chimera','dragon','sphinx'].includes(key)),pool=mythic.length?mythic:available;return pool[Math.floor(r*pool.length)];}
 // Retain the existing fauna as the pool grows instead of replacing every wave.
 return r<.45?available[Math.min(available.length-1,Math.floor(r/.45*available.length))]:base;
}
