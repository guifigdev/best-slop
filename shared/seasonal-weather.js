// Presentation-only climate: no wall clock, gameplay RNG or mutable state.
export const SEASONAL_WEATHER_RULES=Object.freeze({cycleSeconds:90,seasonSeconds:360,initialDrySeconds:28,transitionSeconds:5});
export const WEATHER_SEASONS=Object.freeze(['spring','summer','autumn','winter']);
const seasonNames={spring:'Primavera',summer:'Verão',autumn:'Outono',winter:'Inverno'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
function hash(value){let h=2166136261;for(const c of String(value??17))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function sample(seed,cycle,channel){let h=(seed^Math.imul(cycle+1,0x9e3779b9)^Math.imul(channel+1,0x85ebca6b))>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)/4294967296;}
export function seasonalWeather({seed=17,time=0,biome='forest',cold=false,hot=false,arid=false,indoor=false,ambientKind='none'}={}){
 const seconds=Number.isFinite(time)?Math.max(0,time):0,world=hash(seed),region=hash(String(seed)+':'+biome),cycle=Math.floor(seconds/90),phase=seconds-cycle*90,season=WEATHER_SEASONS[(Math.floor(seconds/360)+world%4)%4],seasonProgress=(seconds%360)/360;
 // Every front leaves at least the first 30 seconds and last 10 seconds dry.
 // Dry climates receive one short shower every three fronts, not a rain loop.
 const active=!indoor&&(!(arid||hot)||(cycle+region%3)%3===0),start=34+sample(region,cycle,0)*10,duration=({spring:29,summer:22,autumn:28,winter:26})[season]+sample(region,cycle,1)*5,end=Math.min(79,start+duration);
 const cover=active?smooth(start-9,start-1,phase)*(1-smooth(end+1,Math.min(89,end+9),phase)):0;
 const precipitation=active?smooth(start,start+5,phase)*(1-smooth(end-5,end,phase)):0;
 const severe=sample(region,cycle,2)>(/tempest|storm/.test(biome)?.35:.72),storm=severe&&precipitation>.65?smooth(start+6,start+11,phase)*(1-smooth(end-11,end-6,phase)):0;
 const cloudCover=indoor?0:clamp((season==='winter'?.17:.08)+cover*.77+storm*.12),sunlight=indoor?0:clamp(1-cloudCover*.74-storm*.12,.16,1),rayStrength=indoor?0:clamp((1-cloudCover)*(1-precipitation*.88)*(1-storm*.7));
 const weather=indoor?'indoors':precipitation>.01?cold?(storm>.45?'snowstorm':'snow'):(storm>.45?'storm':'rain'):cloudCover>.38?'cloudy':'sunny';
 const kind=precipitation>.01?(cold?'snow':storm>.45?'storm':'rain'):ambientKind;
 const weatherLabel={indoors:'Interior',sunny:'Tempo aberto',cloudy:'Nublado',rain:'Chuva passageira',storm:'Tempestade',snow:'Neve passageira',snowstorm:'Nevasca'}[weather];
 return {kind,weather,sunlight,cloudCover,rayStrength,precipitation,storm,wind:.55+cloudCover*.5+storm*.8,season,seasonLabel:seasonNames[season],seasonProgress,cycle,biome,cold,hot,arid,indoor,ambientKind,label:seasonNames[season]+' · '+weatherLabel,source:'seasonal'};
}
