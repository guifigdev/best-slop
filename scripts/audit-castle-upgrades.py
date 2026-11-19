"""Audit the pinned Castle Fight map's upgrade graph as data, never execute JASS.

Requires the already extracted files in outputs/castle-original. The published
game needs only the resulting small reference module, never the original map.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
RACES = [('human', 'h00C'), ('naga', 'h00E'), ('chaos', 'h00O'),
         ('elf', 'h00P'), ('undead', 'h018'), ('orc', 'h019'),
         ('north', 'h017'), ('corrupted', 'u006'), ('nightelf', 'h089'),
         ('mech', 'h06P')]


def native_literal(value):
    value = value.strip()
    if re.fullmatch(r"'[^']{4}'", value):
        return value[1:-1]
    if re.fullmatch(r"'[^']'", value):
        return ord(value[1])
    if value.startswith('$'):
        return int(value[1:], 16)
    try:
        return float(value) if '.' in value else int(value)
    except ValueError:
        return value


def audit(source):
    objects = {obj['id']: obj for obj in json.loads(
        (source / 'war3map.w3u.json').read_text(encoding='utf-8'))}
    script_file = source / 'Scripts_war3map.j'
    script = script_file.read_text(encoding='utf-8')
    current = json.loads(subprocess.check_output([
        'node', '--input-type=module', '-e',
        "import {CASTLE_BUILDINGS as b,CASTLE_UNITS as u} from './shared/castle-catalog.js';"
        "console.log(JSON.stringify({buildings:b,units:u}));"],
        cwd=ROOT, text=True, encoding='utf-8'))
    buildings, units = current['buildings'], current['units']
    native_edges, memberships = {}, {}
    for race, builder in RACES:
        pending = objects[builder]['fields'].get('ubui', '').split(',')
        seen = set()
        while pending:
            raw = pending.pop()
            if not raw or raw in seen:
                continue
            seen.add(raw)
            memberships[(race, raw)] = f'{race}_{raw}'
            for target in objects[raw]['fields'].get('uupt', '').split(','):
                if not target:
                    continue
                native_edges[(race, raw, target)] = 'war3map.w3u:uupt'
                pending.append(target)

    # Registrations EC/RC/IC specify new rawcode, incremental cost, produced
    # troop/effect, accumulated predecessor investment and predecessor rawcode.
    registrations = {}
    section = script[script.index('function AC takes'):script.index('set ei[14]=180')]
    race_index = 0
    for line in section.splitlines():
        match = re.fullmatch(r'\s*set vC=(\d+)\s*', line)
        if match:
            race_index = int(match[1])
        match = re.fullmatch(r'\s*call (EC|RC|IC)\((.*)\)\s*', line)
        if not match:
            continue
        args = [native_literal(v) for v in match[2].split(',')]
        race = RACES[race_index][0]
        registrations[(race, args[4], args[0])] = {
            'function': match[1], 'incrementalGold': args[1],
            'previousAccumulatedGold': args[3],
            'unit': args[2] if match[1] in ['EC', 'RC'] else None}

    catalog_edges = {(b['race'], b['rawId'], buildings[to]['rawId'])
                     for b in buildings.values() for to in b['upgradesTo']}
    assert set(native_edges) == set(registrations), {
        'objectOnly': sorted(set(native_edges) - set(registrations)),
        'scriptOnly': sorted(set(registrations) - set(native_edges))}
    assert catalog_edges == set(native_edges), {
        'missing': sorted(set(native_edges) - catalog_edges),
        'extra': sorted(catalog_edges - set(native_edges))}

    edges = []
    for (race, old, new), registration in registrations.items():
        before, after = buildings[f'{race}_{old}'], buildings[f'{race}_{new}']
        fields = objects[new]['fields']
        assert after['requiresBuilding'] == before['key'], after['key']
        assert after['cost'] == fields.get('ugol', registration['incrementalGold']), after['key']
        assert after['provenance']['previousRegisteredCost'] == registration['previousAccumulatedGold']
        if registration['unit']:
            assert after['unit'] == registration['unit']
            assert registration['unit'] in units
            train = fields.get('utra')
            if train:
                assert registration['unit'] in train.split(',')
        edges.append(dict(race=race, source=before['key'], target=after['key'],
                          sourceName=before['name'], targetName=after['name'],
                          sourceUnit=before['unit'], targetUnit=after['unit'],
                          incrementalGold=after['cost'], lumber=after['lumberCost'],
                          buildTime=after['buildTime'], spawnInterval=after['spawnInterval'],
                          playable=after['playable'], nativeRegistration=registration))

    paths = []
    def visit(key, path):
        assert key not in path, f'Cycle at {key}'
        path = [*path, key]
        if buildings[key]['upgradesTo']:
            for target in buildings[key]['upgradesTo']:
                visit(target, path)
        else:
            paths.append({'race': buildings[key]['race'], 'buildings': path,
                          'names': [buildings[k]['name'] for k in path],
                          'units': [buildings[k]['unit'] for k in path],
                          'playable': [buildings[k]['playable'] for k in path]})
    for key, definition in buildings.items():
        if definition['upgradesTo'] and not definition['requiresBuilding']:
            visit(key, [])
    covered = {(p['buildings'][i], p['buildings'][i+1])
               for p in paths for i in range(len(p['buildings'])-1)}
    assert covered == {(e['source'], e['target']) for e in edges}
    reference = {'version': 'Castle Fight v1.14b',
                 'sourceSha256': hashlib.sha256(script_file.read_bytes()).hexdigest(),
                 'objectGraph': 'builder ubui recursively through uupt',
                 'scriptGraph': 'AC registration EC/RC/IC, predecessor argument 5',
                 'objectEdges': len(native_edges), 'scriptEdges': len(registrations),
                 'catalogEdges': len(catalog_edges), 'playableTargets': sum(e['playable'] for e in edges),
                 'pathCount': len(paths), 'missingEdges': [], 'extraEdges': []}
    return reference, edges, paths


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, default=ROOT/'outputs/castle-original')
    parser.add_argument('--write', action='store_true', help='Write the audited reference module')
    args = parser.parse_args()
    reference, edges, paths = audit(args.input)
    if args.write:
        output = '// Generated from the pinned map by scripts/audit-castle-upgrades.py; no native scripts run.\n'
        for name, value in [('CASTLE_UPGRADE_REFERENCE', reference),
                            ('CASTLE_UPGRADE_EDGES', edges), ('CASTLE_UPGRADE_PATHS', paths)]:
            output += 'export const '+name+'=Object.freeze('+json.dumps(value, ensure_ascii=False, separators=(',', ':'))+');\n'
        (ROOT/'shared/castle-upgrade-data.js').write_text(output, encoding='utf-8')
    print(json.dumps(reference, ensure_ascii=False))
