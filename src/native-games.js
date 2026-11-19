import {PHASE_KILLER_CHARACTERS} from '../shared/phase-killer-catalog.js';
import {TREE_TAG_CHARACTERS} from '../shared/tree-tag-catalog.js';
import {WARLOCK_CHARACTERS} from '../shared/warlock-catalog.js';
import {KODO_TAG_CHARACTERS} from '../shared/kodo-tag-catalog.js';
import {legacyCharacterPortrait} from './legacy-character-art.js';
import {tagCharacterPortrait} from './tag-character-art.js';
const catalogs={phasekiller:PHASE_KILLER_CHARACTERS,treetag:TREE_TAG_CHARACTERS,warlock:WARLOCK_CHARACTERS,kodotag:KODO_TAG_CHARACTERS};
export const nativeGameProfiles=kind=>Object.hasOwn(catalogs,kind)?catalogs[kind]:null;
export function nativeGamePortrait(kind,key){const catalog=nativeGameProfiles(kind);return catalog&&Object.hasOwn(catalog,key)?(kind==='phasekiller'?legacyCharacterPortrait('warlock','warlock'):kind==='kodotag'?tagCharacterPortrait('runner'):legacyCharacterPortrait(kind,key)):'';}
export function nativeGamePreview(kind,key){const catalog=nativeGameProfiles(kind);if(!catalog||!Object.hasOwn(catalog,key))return null;return{hero:kind==='warlock'?'mage':'knight',...(kind==='phasekiller'?{pkCharacter:true,pkAppearance:'townsperson'}:kind==='kodotag'?{kodoTagCharacter:key}:kind==='treetag'?{treeTagCharacter:key}:{warlockCharacter:key})};}
