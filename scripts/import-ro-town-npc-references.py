"""Read-only NPC reference import: python scripts/import-ro-town-npc-references.py [client directory].

Requires Pillow and the project's grf-loader. Never executes client code.
Original SPR pixels are reference images only. The full 3D NPC geometry is
hand-modeled separately in src/ro-town-npc-models.js and is never overwritten.
"""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CLIENT = sys.argv[1] if len(sys.argv) > 1 else 'C:/Gravity/Ragnarok'
REFERENCES = {'kafra': '4_f_kafra1', 'potionShop': '1_m_01',
              'equipmentShop': '4_m_03', 'healer': '4_f_sister',
              'blacksmith': '1_m_smith'}
SOURCE = ROOT / 'outputs/npc-reference'
DEST = ROOT / 'src/assets/ro-town-npcs'
SOURCE.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
subprocess.run(['node', '--input-type=module', '-e', '''
import {openRoArchive} from './scripts/ro-client-archive.mjs';
import {writeFileSync} from 'node:fs';import path from 'node:path';
const archive=openRoArchive(path.join(process.argv[1],'data.grf'));
try{for(const name of JSON.parse(process.argv[2])){
 const bytes=archive.read('data/sprite/npc/'+name+'.spr');
 if(!bytes)throw Error('NPC sprite missing: '+name);
 writeFileSync('outputs/npc-reference/'+name+'.spr',bytes);
}}finally{archive.close();}
''', CLIENT, json.dumps(list(REFERENCES.values()))], cwd=ROOT, check=True)


def first_frame(data):
    if data[:2] != b'SP':
        raise ValueError('Not a Ragnarok sprite')
    version = data[3] + data[2] / 10
    if version not in (1.0, 1.1, 2.0, 2.1):
        raise ValueError('Unsupported SPR version')
    at = 8 if version >= 2 else 6
    w, h = struct.unpack_from('<HH', data, at)
    at += 4
    if not 0 < w <= 512 or not 0 < h <= 512:
        raise ValueError('Invalid sprite dimensions')
    if version >= 2.1:
        size = struct.unpack_from('<H', data, at)[0]
        raw = data[at + 2:at + 2 + size]
        pixels, i = [], 0
        while i < len(raw):
            c = raw[i]
            i += 1
            if c == 0:
                pixels.extend([0] * raw[i])
                i += 1
            else:
                pixels.append(c)
    else:
        pixels = data[at:at + w * h]
    if len(pixels) != w * h:
        raise ValueError('Invalid SPR pixel count')
    palette = data[-1024:]
    image = Image.new('RGBA', (w, h))
    image.putdata([tuple(palette[c * 4:c * 4 + 3]) + (0 if c == 0 else 255,)
                   for c in pixels])
    return image.crop(image.getbbox())


records, models = {}, {}
for key, name in REFERENCES.items():
    data = (SOURCE / (name + '.spr')).read_bytes()
    image = first_frame(data)
    image.save(DEST / (key + '.png'))
    records[key] = {'source': 'data/sprite/npc/' + name + '.spr',
                    'sha256': hashlib.sha256(data).hexdigest(),
                    'reference': key + '.png'}
(DEST / 'manifest.json').write_text(json.dumps({
    'source': 'Original Ragnarok LATAM client; artwork © Gravity. Read-only SPR extraction, first idle frame. References for full 3D NPC models; geometry is authored separately.',
    'records': records}, indent=2), encoding='utf-8')
print(json.dumps({key: record["source"] for key, record in records.items()}))
