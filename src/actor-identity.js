import {ragnarokMonsterModelKey} from './ragnarok-monster-art.js';
import {bloodyModelKey} from './bloody-unit-art.js';
import {dungeonMonsterModelKey} from './dungeon-monster-art.js';
import {phaseKillerModelKey} from './phase-killer-art.js';
import {treeTrainedModelKey} from './tree-trained-art.js';
import {tagCharacterKey} from './tag-character-art.js';
import {legacyCharacterModelKey} from './legacy-character-art.js';
import {castleUnitModelKey} from './castle-unit-art.js';
// Cached geometry must distinguish ordinary heroes and monsters as well as
// custom scenarios. A null key would reuse the first body for every species.
export function actorModelKey(u){return (u.bonkHero&&u.bonkJob?'ro-job:'+u.bonkJob:null)||bloodyModelKey(u)||ragnarokMonsterModelKey(u)||dungeonMonsterModelKey(u)||phaseKillerModelKey(u)||treeTrainedModelKey(u)||tagCharacterKey(u)||legacyCharacterModelKey(u)||(u.castleUnit||u.castleBuilderKey?castleUnitModelKey(u):null)||`${u.hero?'hero':'monster'}:${u.hero||u.kind||'unknown'}`;}
