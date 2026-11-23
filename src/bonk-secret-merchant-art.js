// An authored voxel stall in the market's muted timber/cloth palette. Local
// lantern pixels share the world's existing emissive batch: no scene lights,
// labels, map pins or distant discovery signals are created by this art.
export const BONK_SECRET_MERCHANT_ART_BUDGET=Object.freeze({parts:150,glow:3,cache:32,extraDrawCalls:0});
const cache=new Map(),hash=value=>{let n=7;for(const c of String(value))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;};
export function bonkSecretMerchantParts(merchant={},palette={}){
 const variant=((Math.floor(Number.isFinite(merchant.seed)?merchant.seed:hash(merchant.id||'merchant'))%3)+3)%3,key=[variant,palette.wood,palette.stone,palette.dark].join(':');if(cache.has(key))return cache.get(key);
 const parts=[],glow=[],b=(x,y,z,w,h,d,c,a=0)=>parts.push([x,y,z,w,h,d,c,a]),wood=palette.wood||0x735337,stone=palette.stone||0x9a9c85,dark=0x493f34,edge=0x9c845f,cloth=[0x4a6359,0x5e536b,0x6e5a48][variant],trim=0xc3ad7b,metal=0xb6c3bd;
 // Low plank deck, four posts and an arched nine-strip canvas awning.
 for(let i=0;i<5;i++)b((i-2)*.77,.09,-.15,.73,.14,2.9,i%2?wood:edge);
 for(const x of [-1.72,1.72])for(const z of [-1.23,1.03]){b(x,1.39,z,.16,2.73,.16,wood);b(x,.22,z,.29,.3,.28,dark);}
 for(let i=0;i<9;i++){const x=(i-4)*.47,y=2.87+Math.cos((i-4)*.27)*.45;b(x,y,-.15,.48,.14,3.35,i%3===0?cloth:variant===1?0x6e627b:0x657969);b(x,y-.15,1.53,.46,.24,.09,i%2?cloth:trim);}
 for(const z of [-1.5,1.47])b(0,2.96,z,3.9,.11,.12,wood);
 // Counter with a narrow decorative cloth rather than an opaque billboard.
 for(let i=0;i<5;i++)b((i-2)*.59,1.0,.87,.56,.16,.72,i%2?edge:wood);
 for(const x of [-1.25,1.25]){b(x,.53,.87,.17,.85,.38,wood);b(x,.45,.88,.28,.1,.54,dark);}
 b(0,.53,1.2,2.85,.78,.12,wood);b(0,.65,1.28,1.25,.66,.06,cloth);b(0,.32,1.32,1.3,.09,.045,trim);b(0,.7,1.33,.09,.4,.035,trim);
 // Hooded travelling merchant: shaded robe, leather shoulder strap, hands,
 // shadowed face and quiet amber eyes under a deep hood.
 for(let i=0;i<5;i++)b(0,.35+i*.19,-.28,.91-i*.055,.21,.58-i*.025,[0x323c3c,0x3d4947,0x45534d,cloth,0x59665b][i]);
 for(const x of [-.27,.27])b(x,.2,-.16,.26,.19,.48,dark);
 b(0,1.4,-.28,.55,.42,.48,cloth);b(0,1.79,-.24,.66,.49,.53,cloth);b(0,2.03,-.29,.48,.12,.41,0x657267);b(0,1.82,.048,.42,.31,.04,0x1f2b2a);b(0,1.73,.08,.27,.17,.04,0xb69c77);
 for(const side of [-1,1]){b(side*.275,1.73,-.005,.14,.39,.19,0x39483f);b(side*.092,1.83,.08,.047,.038,.025,0xe8c995);b(side*.45,1.16,-.13,.26,.48,.32,cloth,side*.12);b(side*.39,1.09,.16,.23,.16,.29,0xb69c77);}
 for(let i=0;i<4;i++)b(-.23+i*.12,1.36-i*.11,.045,.13,.18,.07,0x796a4f);b(.14,.97,.07,.29,.12,.09,trim);b(.2,.79,.1,.26,.25,.15,dark);
 // A real equipment shelf: steel swords, a crested shield and a wrapped tome.
 for(const x of [.92,1.59])b(x,1.51,-.97,.1,1.45,.52,wood);for(const y of [.88,1.52,2.13])b(1.26,y,-.95,.86,.11,.6,edge);
 for(const x of [1.06,1.43]){b(x,1.78,-.7,.075,.7,.08,metal);b(x,1.53,-.69,.31,.065,.1,trim);b(x,1.4,-.69,.07,.21,.09,dark);b(x,2.16,-.7,.045,.09,.06,0xe7e9d3);}
 b(1.24,1.11,-.61,.47,.54,.08,0x566b71);b(1.24,1.13,-.55,.08,.36,.035,trim);b(1.24,1.13,-.52,.2,.08,.025,trim);b(.63,1.13,.82,.35,.15,.44,0x6f657e);b(.63,1.13,1.05,.26,.08,.035,0xe6dab7);
 // Lantern on a small rock plinth, lit only at the physical stall.
 const lx=-2.16,lz=.69;for(let i=0;i<3;i++)b(lx,.14+i*.17,lz,.72-i*.17,.22,.65-i*.14,i%2?stone:0x797c69);b(lx,1.52,lz,.12,2.3,.12,wood);b(lx+.21,2.64,lz,.54,.12,.14,wood);b(lx+.43,2.42,lz,.055,.35,.055,dark);
 for(const x of [-.16,.16])for(const z of [-.12,.12])b(lx+.43+x,2.15,lz+z,.045,.43,.045,dark);for(const y of [1.91,2.39])b(lx+.43,y,lz,.43,.08,.35,trim);glow.push([lx+.43,2.14,lz,.24,.32,.21,0xffc477,0],[lx+.43,2.2,lz+.13,.1,.17,.035,0xffe7a5,0]);
 // Travel sacks and spare stones keep the stall grounded in the forest.
 b(-1.18,.49,-.86,.53,.6,.48,0x8f8062);b(-1.18,.82,-.86,.33,.1,.3,trim);b(-.97,.23,-.35,.58,.28,.44,0x77694f);for(const [x,z]of [[-1.91,-1.23],[1.99,-.92],[1.98,1.27]]){b(x,.18,z,.48,.27,.43,stone);b(x+.06,.35,z-.04,.31,.16,.29,0x7d866f);}
 if(parts.length>BONK_SECRET_MERCHANT_ART_BUDGET.parts)throw Error('Merchant art exceeded its instance budget.');const result=Object.freeze({parts:Object.freeze(parts.map(Object.freeze)),glow:Object.freeze(glow.map(Object.freeze))});cache.set(key,result);if(cache.size>BONK_SECRET_MERCHANT_ART_BUDGET.cache)cache.delete(cache.keys().next().value);return result;
}
