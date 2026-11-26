import {RO_EQUIPMENT_NATIVE} from './ro-equipment-native-data.js';

export const roEquipmentRequiredLevel=definition=>Math.max(1,RO_EQUIPMENT_NATIVE[definition?.sourceId]?.EquipLevelMin||definition?.requiredLevel||1);
export const roEquipmentLevelAllowed=(unit,definition)=>!Number.isFinite(unit?.level)||unit.level>=roEquipmentRequiredLevel(definition);
