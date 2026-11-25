"""Import refine eligibility and item levels from the pinned item database cache."""
import json,subprocess,yaml
from pathlib import Path
root=Path(__file__).resolve().parent.parent
ids=set(json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{RO_EQUIPMENT}from'./shared/ragnarok-equipment.js';console.log(JSON.stringify(Object.values(RO_EQUIPMENT).map(d=>d.sourceId)))"],cwd=root,text=True)))
rows=yaml.safe_load((root/'outputs/ro-build-item-db.yml').read_text(encoding='utf8'))['Body']
facts={r['Id']:{'refineable':r.get('Refineable',False),**({'weaponLevel':r.get('WeaponLevel',1)} if r.get('Type')=='Weapon' else {'armorLevel':r.get('ArmorLevel',1)})} for r in rows if r['Id'] in ids}
(root/'shared/ro-refinement-facts.js').write_text('// Pinned rAthena item_db_equip.yml, d4b8e7b8f16061cc2496d377ac8f777ce72a4f39.\nexport const RO_REFINEMENT_FACTS=Object.freeze('+json.dumps(facts,separators=(',',':'))+');\n',encoding='utf8')
print('Refinement facts:',len(facts))
