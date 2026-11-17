export const MODES={
 campaign:{name:'Torneio das Mil Formas',tag:'CLÁSSICO',description:'50 ondas, desafios de velocidade, mercado a cada 5 e uma grande final todos contra todos.'},
 tower:{name:'Torre sem fim',tag:'COOPERATIVO',description:'Uma equipe contra a torre. Minichefe nos andares 5, 15… e chefe a cada 10. Mercado a cada 5; todos caem, a tentativa termina.'},
 best:{name:'Best of All',tag:'COMPETIÇÃO INDIVIDUAL',description:'Provas individuais em arenas separadas. Tempo e vida restante valem pontos. Todos contra todos a cada 10 ondas, até a onda 50.'},
 war:{name:'Guerra de equipes',tag:'PARTIES',description:'De 2 a 5 equipes, com 2 ou 5 heróis cada. Provas por equipe e confrontos em um campo procedural a cada 5 ou 10 ondas.'}
};
export function modeOptions(input={}){const mode=Object.hasOwn(MODES,input.mode)?input.mode:'campaign';return{mode,teamSize:input.teamSize===5?5:2,teamCount:[2,3,4,5].includes(input.teamCount)?input.teamCount:5,clashEvery:input.clashEvery===10?10:5,towerLimit:[50,100].includes(input.towerLimit)?input.towerLimit:0};}
export function capacity(options){return options.mode==='war'?options.teamSize*options.teamCount:4;}
