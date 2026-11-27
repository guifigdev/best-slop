"""Import numerical native movement delays for the authored bestiary only."""
import json
import re
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVISION = '6b917c1808cc93c65f27f47079b2c58a11df7c6c'
source = f'https://github.com/rathena/rathena/blob/{REVISION}/db/re/mob_db.yml'
ids = set(json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import{MONSTER_HABITATS}from'./shared/ragnarok-habitats.js';console.log(JSON.stringify(Object.values(MONSTER_HABITATS).map(v=>v.sourceId).filter(Boolean)))"
], cwd=ROOT, text=True)))
with urllib.request.urlopen(source.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/'), timeout=60) as response:
    raw = response.read().decode('utf8')
values = {}
for block in re.split(r'(?m)^  - Id: ', raw)[1:]:
    ident = int(block.splitlines()[0])
    if ident not in ids:
        continue
    delay = re.search(r'(?m)^    WalkSpeed: (\d+)$', block)
    values[ident] = int(delay[1]) if delay else 150
if ids - values.keys():
    raise ValueError(f'Missing native records: {sorted(ids - values.keys())}')
(ROOT / 'shared/ro-monster-walk-data.js').write_text(
    '// Native movement delays in milliseconds per cell. Numerical facts only.\n'
    f'// Source: {source}\n'
    'export const RO_MONSTER_WALK_MS=Object.freeze('
    + json.dumps(values, separators=(',', ':')) + ');\n', encoding='utf8')
print(f'Imported {len(values)} native movement delays.')
