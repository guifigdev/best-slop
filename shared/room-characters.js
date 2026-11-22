import {HEROES} from './catalog.js';
import {RO_LINEAGES} from './ragnarok-jobs.js';
import {CASTLE_BUILDERS} from './castle-builders.js';
import {TREE_TAG_CHARACTERS} from './tree-tag-catalog.js';
import {WARLOCK_CHARACTERS} from './warlock-catalog.js';
import {KODO_TAG_CHARACTERS} from './kodo-tag-catalog.js';
import {PHASE_KILLER_CHARACTERS} from './phase-killer-catalog.js';
export function roomCharacterChoices(mode){
 const catalog=mode==='bonk'?RO_LINEAGES:mode==='castlefight'?CASTLE_BUILDERS:mode==='treetag'?TREE_TAG_CHARACTERS:mode==='warlock'?WARLOCK_CHARACTERS:mode==='kodotag'?KODO_TAG_CHARACTERS:mode==='phasekiller'?PHASE_KILLER_CHARACTERS:HEROES;
 return Object.entries(catalog).map(([key,d])=>({key,name:mode==='bonk'?d.names[0]:d.name,description:d.description||d.title||'',hero:mode==='bonk'?d.hero:key,role:d.role||null,job:d.jobs?.[0]||null}));
}
