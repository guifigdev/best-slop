// Recognizable rural, shrine, caravan, glacial and volcanic silhouettes.
// Used by generation and art so footprints and declared budgets stay in sync.
const spec=(w,d,h,models)=>Object.freeze({w,d,h,models:Object.freeze(models)});
export const RO_REGION_PROP_POOLS=Object.freeze({
 'alberta-harbor':spec(10,9,10,['alberta-ship','alberta-crane','alberta-lighthouse','alberta-warehouse']),
 'turtle-island':spec(9,8,7,['turtle-shell-shrine','turtle-nest','coral-arch','island-mooring']),
 'amatsu-sakura':spec(10,9,10,['amatsu-castle','amatsu-torii','sakura-garden','amatsu-bridge']),
 'comodo-beach':spec(10,9,8,['comodo-cavemouth','comodo-shell-stage','comodo-stilt-house','comodo-drum-circle']),
 'umbala-canopy':spec(10,9,11,['umbala-treehouse','umbala-mask-gate','wootan-drums','umbala-root-shrine']),
 'niflheim-hollows':spec(10,9,10,['niflheim-house','pumpkin-cart','ghost-bell-tower','niflheim-dead-arch']),
 'snow-village':spec(9,7,8,['snow-village','snowed-sled','frost-rune-arch','snow-festival-tree']),
 'toy-factory':spec(10,7,7,['toy-factory','toy-train','toy-gifts','mine-wagon']),
 clockwork:spec(10,7,11,['clockwork','clock-gears','juno-telescope','runic-engine']),
 thanatos:spec(10,8,11,['thanatos','thanatos-spire','pilgrim-bellgate','buried-sarcophagus']),
 pastoral:spec(8,6,11,['prontera-windmill','peco-caravan','hay-granary','traveler-stonebridge']),
 bamboo:spec(7,6,8,['payon-wayshrine','payon-waterwheel','rice-granary','paper-lantern-arch']),
 'burial-cave':spec(7,5,7,['payon-wayshrine','mine-wagon','burial-bell','mushroom-log']),
 sograt:spec(8,6,8,['desert-caravan','sand-obelisk-camp','oasis-canopy','buried-sarcophagus']),
 'sandstone-tomb':spec(8,6,8,['sand-obelisk-camp','buried-sarcophagus','broken-sphinx','desert-caravan']),
 arunafeltz:spec(8,6,9,['pilgrim-bellgate','oasis-canopy','sand-obelisk-camp','desert-caravan']),
 'highland-observatory':spec(8,6,9,['juno-telescope','runic-engine','traveler-stonebridge','hay-granary']),
 glacial:spec(8,7,10,['frozen-longboat','ice-crystal-grove','frost-rune-arch','snowed-sled']),
 volcanic:spec(8,7,10,['thor-basalt-vent','dwarven-bellows','mine-wagon','basalt-forge-shrine']),
 'mage-ruins':spec(8,6,9,['runic-engine','juno-telescope','burial-bell','broken-sphinx']),
 gothic:spec(8,6,9,['pilgrim-bellgate','buried-sarcophagus','broken-sphinx','mine-wagon']),
 'valkyrie-sanctuary':spec(8,6,10,['valkyrie-wing-shrine','frost-rune-arch','traveler-stonebridge','runic-engine'])
});
const defaults={grove:'pastoral',payon:'burial-cave',sands:'sograt',coast:'pastoral',crypt:'gothic',forge:'volcanic',glacier:'glacial',geffen:'mage-ruins'};
export const roRegionPropPool=(stage,style)=>RO_REGION_PROP_POOLS[style]||RO_REGION_PROP_POOLS[defaults[stage]]||RO_REGION_PROP_POOLS.pastoral;
export const RO_REGION_PROP_BUDGET=Object.freeze({perMap:20,partsPerProp:180});
