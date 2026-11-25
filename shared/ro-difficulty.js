export const RO_DIFFICULTIES=Object.freeze({
 easy:Object.freeze({key:'easy',name:'Fácil',description:'Dano recebido −45%, inimigos com menos vida e mais tempo para esquivar.',incoming:.55,hp:.72,speed:.9,warning:1.35,specialInterval:1.4}),
 normal:Object.freeze({key:'normal',name:'Normal',description:'Dano recebido −20% e lutas um pouco mais leves. Recomendado.',incoming:.8,hp:.9,speed:.96,warning:1.15,specialInterval:1.15}),
 hard:Object.freeze({key:'hard',name:'Difícil',description:'O desafio anterior: dano, resistência e ritmo completos dos inimigos.',incoming:1,hp:1,speed:1,warning:1,specialInterval:1}),
});
export const roDifficulty=key=>Object.hasOwn(RO_DIFFICULTIES,key)?RO_DIFFICULTIES[key]:RO_DIFFICULTIES.normal;
export function setRoDifficulty(game,key){
 if(game?.options?.mode!=='bonk'||!Object.hasOwn(RO_DIFFICULTIES,key))return false;
 const previous=roDifficulty(game.options.bonkDifficulty),next=roDifficulty(key);
 if(previous===next)return true;
 for(const enemy of game.units.filter(u=>u.bonkEnemy&&u.alive)){
  const health=enemy.maxHp>0?enemy.hp/enemy.maxHp:1;
  enemy.maxHp=Math.max(1,Math.round(enemy.maxHp*next.hp/previous.hp));enemy.hp=enemy.maxHp*health;
  enemy.speed*=next.speed/previous.speed;
 }
 game.options.bonkDifficulty=key;return true;
}
