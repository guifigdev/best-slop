// Trade networks are an adaptation for this expedition, not official NPC stock.
export const RO_TRADE_HUBS=Object.freeze({
 prontera:{name:'Comércio de Rune-Midgard',sources:['database','eden','market'],grade:2},
 'payon-forest':{name:'Povoado de Payon',sources:['database','eden','market'],grade:2},
 morroc:{name:'Caravanas de Morroc',sources:['database','market','monarch'],grade:2},
 juno:{name:'Expedições de Schwarzwald',sources:['database','os','bio','temporal','mora'],grade:3},
 lutie:{name:'Mercado de Lutie',sources:['database','market','recovery'],grade:3},
 alberta:{name:'Rotas marítimas de Alberta',sources:['database','malangdo','elven','mora'],grade:3},
 amatsu:{name:'Posto de Amatsu',sources:['database','malangdo','market'],grade:3}
});
export const roTradeHub=map=>map?.tower?null:map?.route?RO_TRADE_HUBS[map.route.key]||null:map?.stageKey==='grove'?RO_TRADE_HUBS.prontera:null;
export const roHasSecretMerchant=map=>!map?.route||['rachel','umbala','geffen'].includes(map.route.key);
