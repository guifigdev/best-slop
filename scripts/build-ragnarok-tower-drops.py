"""Audit/generate factual RO drop identities; requires PyYAML (no game dependency).

Run from the repo root. Cached rAthena YAML is retained in outputs/ro-conversion;
delete a source cache file explicitly when refreshing the source database.
Only Card/Weapon/Armor records are emitted; materials, albums and consumables
never become pretend equipment. Combat bonuses are bounded local adaptations.
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.request import Request, urlopen
import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs/ro-conversion'
OUT.mkdir(parents=True, exist_ok=True)
SOURCES = {'mob_db.yml': 'monsters-mob-db.yml', 'item_db_equip.yml': 'item_db_equip.yml', 'item_db_etc.yml': 'item_db_etc.yml'}
manifest = {'retrieved': '2026-11-21', 'files': {}}
data = {}
for source, cache in SOURCES.items():
    target = OUT / cache
    url = 'https://raw.githubusercontent.com/rathena/rathena/master/db/re/' + source
    if not target.exists():
        target.write_bytes(urlopen(Request(url, headers={'User-Agent': 'GameMetadataAudit/1.0'}), timeout=60).read())
    raw = target.read_bytes()
    manifest['files'][source] = {'url': url, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
    data[source] = yaml.load(raw.decode('utf-8'), Loader=getattr(yaml, 'CSafeLoader', yaml.SafeLoader))['Body']

node = """import {RO_ENDLESS_FLOORS,RO_ENDLESS_MISSING,RO_ENDLESS_SOURCE_IDS} from './shared/ragnarok-endless-tower.js';
import {RAGNAROK_VOXEL_REFERENCES} from './shared/monster-visual-references.js';
import {RO_CARDS,RO_EQUIPMENT} from './shared/ragnarok-equipment.js';
import {RAGNAROK_MVPS} from './shared/ragnarok-mvp-catalog.js';
console.log(JSON.stringify({floors:RO_ENDLESS_FLOORS,missing:RO_ENDLESS_MISSING,ids:RO_ENDLESS_SOURCE_IDS,refs:RAGNAROK_VOXEL_REFERENCES,cards:RO_CARDS,equipment:RO_EQUIPMENT,mvps:RAGNAROK_MVPS}));"""
source = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', node], cwd=ROOT, encoding='utf-8'))
mobs = {m['Id']: m for m in data['mob_db.yml']}
items = {item['AegisName']: item for group in ['item_db_equip.yml', 'item_db_etc.yml'] for item in data[group]}
keys = {entry['id']: entry['key'] for entry in source['refs'].values()}

def collect(value):
    if isinstance(value, dict):
        if 'sourceId' in value and 'key' in value:
            keys[value['sourceId']] = value['key']
        for child in value.values():
            collect(child)
    elif isinstance(value, list):
        for child in value:
            collect(child)

collect(source['floors'])
collect(source['missing'])
for mob in source['mvps']:
    keys[mob['id']] = mob['key']
ids = sorted(set(source['ids']) | {m['id'] for m in source['mvps']})
source['cards'] = {key: card for key, card in source['cards'].items() if not key.startswith('towercard_')}
source['equipment'] = {key: gear for key, gear in source['equipment'].items() if not key.startswith('towergear_')}
existing_cards = {c['sourceId']: c['key'] for c in source['cards'].values() if not c['key'].startswith('towercard_')}
existing_gear = {g['sourceId']: g['key'] for g in source['equipment'].values() if not g['key'].startswith('towergear_')}

def position(item):
    loc = item.get('Locations', {})
    if loc.get('Armor'): return 'armor'
    if loc.get('Garment'): return 'garment'
    if loc.get('Shoes'): return 'shoes'
    if any('Accessory' in key and enabled for key, enabled in loc.items()): return 'accessory'
    if any(key.startswith('Head_') and enabled for key, enabled in loc.items()): return 'head'
    if loc.get('Right_Hand') or loc.get('Both_Hand'): return 'weapon'
    if loc.get('Left_Hand'): return 'offhand'
    return None

def numeric_bonuses(item):
    # Retain only flat unconditional literals; never promote a refinement,
    # combo, job-level or autocast conditional into an always-on full bonus.
    script = re.split(r'\bif\b|\bfor\b|\bwhile\b|\bswitch\b', item.get('Script', ''), maxsplit=1)[0]
    return {key: float(value) for key, value in re.findall(r'bonus\s+(b\w+)\s*,\s*(-?\d+(?:\.\d+)?)\s*;', script)}

def stats_for(item, card=False):
    raw = numeric_bonuses(item)
    stats = {}
    for symbol, stat in [('bStr', 'str'), ('bAgi', 'agi'), ('bVit', 'vit'), ('bInt', 'int'), ('bDex', 'dex'), ('bLuk', 'luk')]:
        amount = raw.get(symbol, 0) + raw.get('bAllStats', 0)
        if amount: stats[stat] = max(-3, min(5, amount))
    for symbol, stat, factor, cap in [('bMaxHP', 'maxHp', .1, 100), ('bBaseAtk', 'attack', .1, 12), ('bAtk', 'attack', .1, 12), ('bMatk', 'matk', .1, 12), ('bDef', 'armor', .1, 5), ('bCritical', 'crit', .005, .08), ('bAspdRate', 'haste', .005, .1)]:
        if raw.get(symbol): stats[stat] = max(-cap, min(cap, stats.get(stat, 0) + raw[symbol] * factor))
    if not card:
        if item.get('Attack'): stats['attack'] = min(35, stats.get('attack', 0) + item['Attack'] * .08)
        if item.get('MagicAttack'): stats['matk'] = min(35, stats.get('matk', 0) + item['MagicAttack'] * .08)
        if item.get('Defense'): stats['armor'] = min(7, stats.get('armor', 0) + item['Defense'] * .08)
    # Pure status/resistance/autocast cards receive a small slot-role adaptation
    # rather than an unimplemented tooltip claim or an invulnerability effect.
    if not stats:
        stat, amount = {'weapon': ('attack', 2), 'offhand': ('armor', .7), 'armor': ('maxHp', 12), 'garment': ('armor', .5), 'shoes': ('moveSpeed', .12), 'head': ('matk', 2), 'accessory': ('luck', 1)}.get(position(item), ('maxHp', 8))
        stats['luk' if stat == 'luck' else stat] = amount
    return {key: round(value, 3) for key, value in stats.items()}, raw

subtypes = {'Dagger': 'dagger', '1hSword': 'sword', '2hSword': 'sword', '1hAxe': 'axe', '2hAxe': 'axe', '1hSpear': 'spear', '2hSpear': 'spear', 'Staff': 'staff', '2hStaff': 'staff', 'Bow': 'bow', 'Mace': 'mace', 'Knuckle': 'knuckle', 'Katar': 'katar', 'Musical': 'instrument', 'Whip': 'whip', 'Book': 'book'}
cards, gear, drop_map, no_card = {}, {}, {}, []
for mob_id in ids:
    mob = mobs[mob_id]
    visual = keys.get(mob_id, 'tower_' + str(mob_id))
    boss = bool(mob.get('Modes', {}).get('Mvp'))
    entry = {'sourceId': mob_id, 'sourceName': mob['Name'], 'boss': boss, 'cardKey': None, 'equipmentKeys': [], 'sourceDrops': []}
    for category in ['Drops', 'MvpDrops']:
        for drop in mob.get(category, []):
            item = items.get(drop['Item'])
            if not item: continue
            slot = position(item)
            if item.get('Type') == 'Card' and slot:
                key = existing_cards.get(item['Id'], 'towercard_' + str(item['Id']))
                entry['cardKey'] = key
                if key not in source['cards']:
                    adapted, original = stats_for(item, card=True)
                    current = cards.setdefault(key, {'key': key, 'name': item['Name'], 'sourceId': item['Id'], 'source': 'https://www.divine-pride.net/database/item/' + str(item['Id']), 'slot': slot, 'stats': adapted, 'monsters': [], 'mvp': boss, 'original': 'RO source effect; local bonuses are adapted.', 'sourceNumericBonuses': original, 'adaptation': 'Finite local stats; source autocasts, immunity and special conditions are not copied literally.'})
                    if visual not in current['monsters']: current['monsters'].append(visual)
                entry['sourceDrops'].append({'sourceItemId': item['Id'], 'key': key, 'kind': 'card', 'category': category, 'sourceRate': drop.get('Rate', 0) / 10000})
            elif boss and item.get('Type') in ['Armor', 'Weapon'] and slot:
                key = existing_gear.get(item['Id'], 'towergear_' + str(item['Id']))
                if key not in entry['equipmentKeys']: entry['equipmentKeys'].append(key)
                if key not in source['equipment']:
                    adapted, original = stats_for(item)
                    extra = {}
                    if item['Type'] == 'Weapon':
                        subtype = item.get('SubType', '')
                        extra = {'weaponType': subtypes.get(subtype, subtype.lower() or 'sword'), 'hands': 2 if subtype.startswith('2h') or subtype in ['Bow', 'Katar', 'Rifle', 'Shotgun', 'Gatling', 'Grenade', 'Huuma'] or item.get('Locations', {}).get('Both_Hand') else 1}
                    elif slot == 'offhand': extra = {'shield': True}
                    current = gear.setdefault(key, {'key': key, 'name': item['Name'] + (' [' + str(item['Slots']) + ']' if item.get('Slots') else ''), 'sourceId': item['Id'], 'source': 'https://www.divine-pride.net/database/item/' + str(item['Id']), 'slot': slot, 'sockets': item.get('Slots', 0), 'stats': adapted, 'monsters': [], 'sourceType': item['Type'], 'sourceSubType': item.get('SubType'), 'sourceNumericBonuses': original, **extra})
                    if visual not in current['monsters']: current['monsters'].append(visual)
                entry['sourceDrops'].append({'sourceItemId': item['Id'], 'key': key, 'kind': 'equipment', 'category': category, 'sourceRate': drop.get('Rate', 0) / 10000})
    if not entry['cardKey']: no_card.append({'key': visual, 'sourceId': mob_id, 'name': mob['Name']})
    drop_map[visual] = entry

manifest.update({'towerSourceCount': len(source['ids']), 'auditedMonsterCount': len(ids), 'newCards': len(cards), 'newMvpEquipment': len(gear), 'withoutSourceCard': no_card, 'policy': 'Do not invent a card for summoned forms or creatures without a source card drop.'})
header = '''// Generated by scripts/build-ragnarok-tower-drops.py from rAthena source YAML.
// Factual identities/slots/drop associations; combat numbers are local budgets.
// Source hashes and intentionally cardless summons appear in the audit manifest.
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
'''
result = header + 'export const RO_TOWER_DROP_SOURCE=freeze(' + json.dumps(manifest['files'], ensure_ascii=False, separators=(',', ':')) + ');\n'
for name, value in [('RO_TOWER_CARDS', cards), ('RO_TOWER_MVP_GEAR', gear), ('RO_TOWER_DROP_MAP', drop_map)]:
    result += 'export const ' + name + '=freeze(' + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + ');\n'
(ROOT / 'shared/ragnarok-tower-drops.js').write_text(result, encoding='utf-8')
(OUT / 'tower-drops-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: value for key, value in manifest.items() if key != 'files'}, ensure_ascii=True))
