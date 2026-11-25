export const roSkillMaxRank=definition=>Math.max(1,Math.min(8,definition?.sourceMaxLevel||8));
export function roNormalizeSkillRanks(unit,catalog){for(const [key,rank]of Object.entries(unit?.bonkBuild?.weapons||{})){const maximum=roSkillMaxRank(catalog[key]);if(rank>maximum)unit.bonkBuild.weapons[key]=maximum;}}
