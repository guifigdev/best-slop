"""Read already extracted WC3 terrain/pathing as data; never execute map scripts.

Usage: python scripts/extract-warcraft-terrain.py --input outputs/line-wars-original
Pillow is optional, used only for the diagnostic preview. W3X/MPQ extraction is
deliberately separate: no third-party game scripts, models or textures are run.
"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import struct
import sys

PALETTE = [
    dict(id='water', name='Água', color='#6e8fae', height=-.25, walkable=0, obstacleHeight=.2),
    dict(id='grass', name='Relva', color='#98ab7d', height=0, walkable=1),
    dict(id='forest', name='Bosque', color='#4f7058', height=.15, walkable=0, obstacleHeight=2),
    dict(id='road', name='Laje do caminho', color='#c4b8a6', height=0, walkable=1),
    dict(id='stone', name='Pedra de Dalaran', color='#96919c', height=0, walkable=1),
    dict(id='cliff', name='Muralha de pedra', color='#665b76', height=2, walkable=0, obstacleHeight=1.2),
    dict(id='lava', name='Lava', color='#d77845', height=-.1, walkable=1),
    dict(id='snow', name='Neve', color='#d9e5e6', height=.2, walkable=1),
]

def read_w3e(data: bytes) -> dict:
    if data[:4] != b'W3E!' or len(data) < 33:
        raise ValueError('Invalid W3E header')
    version, = struct.unpack_from('<I', data, 4)
    if version != 11:
        raise ValueError('Only the verified seven-byte W3E v11 records are supported')
    p = 9
    custom, count = struct.unpack_from('<II', data, p)
    p += 8
    if not 1 <= count <= 16 or len(data) < p+count*4+4:
        raise ValueError('Too many v11 ground textures')
    ground = [data[p+i*4:p+i*4+4].decode('ascii') for i in range(count)]
    p += count*4
    cliffs, = struct.unpack_from('<I', data, p)
    p += 4
    if cliffs > 16 or len(data) < p+cliffs*4+16:
        raise ValueError('Invalid cliff palette')
    cliff_ids = [data[p+i*4:p+i*4+4].decode('ascii') for i in range(cliffs)]
    p += cliffs*4
    width, height, ox, oy = struct.unpack_from('<IIff', data, p)
    p += 16
    if not (2 <= width <= 513 and 2 <= height <= 513) or len(data) != p+width*height*7:
        raise ValueError('Truncated or unsupported W3E vertex grid')
    vertices = []
    for i in range(width*height):
        raw, water, flags, variation, layer = struct.unpack_from('<HHBBB', data, p+i*7)
        vertices.append(dict(height=(raw-8192+((layer & 15)-2)*512)/4,
                             water=(water & 0x3fff), flags=flags, texture=flags & 15,
                             layer=layer & 15))
    return dict(version=version, tileset=chr(data[8]), custom=custom,
                ground=ground, cliffs=cliff_ids, width=width, height=height,
                offset=(ox, oy), vertices=vertices)

def read_wpm(data: bytes) -> dict:
    if data[:4] != b'MP3W':
        raise ValueError('Invalid WPM header')
    version, width, height = struct.unpack_from('<III', data, 4)
    if not 1 <= width <= 2048 or not 1 <= height <= 2048 or len(data) != 16+width*height:
        raise ValueError('Invalid WPM pathing size')
    return dict(version=version, width=width, height=height, data=data[16:])

def jass_data(text: str) -> dict:
    number = r'[+-]?(?:\d*\.\d+|\d+\.?\d*)'
    rects = {}
    for name, args in re.findall(r'set\s+(\w+)\s*=\s*Rect\(([^)]*)\)', text):
        try:
            values = [float(value) for value in args.split(',')]
            if len(values) == 4:
                rects[name] = values
        except ValueError:
            pass
    units = []
    pattern = rf"CreateUnit\(p,'([^']{{4}})',({number}),({number}),({number})\)"
    for rawcode, x, y, angle in re.findall(pattern, text):
        units.append(dict(rawcode=rawcode, x=float(x), y=float(y), facing=float(angle)))
    # Reading call text is not executing the JASS. The verified entry triggers
    # O_V/O2V direct entrants of OI/XI toward BI; BI removes units and loses lives.
    return dict(rects=rects, units=units)

def generate(source: Path) -> tuple[dict, dict]:
    files = {name: (source/name).read_bytes() for name in ['war3map.w3e', 'war3map.wpm', 'war3map.j']}
    expected={
        'war3map.w3e':'cd539b3d171dfd8e5a35c5e53823c2d021b49cc19cb2a4d51c26efaf3385e639',
        'war3map.wpm':'f46bcf680298e1c802399a713829e7cd1b2e4c6bb042210f61168d4e4f7e8cc5',
        'war3map.j':'63b7f8746739e15e3848c90ae39f358bc4cc92258e127b79c3cca6e280c56bd2'}
    if any(hashlib.sha256(files[name]).hexdigest()!=digest for name,digest in expected.items()):
        raise ValueError('Preset crop expects the verified CHLW v1.6a files; use the generic readers for another map')
    terrain, pathing = read_w3e(files['war3map.w3e']), read_wpm(files['war3map.wpm'])
    script = jass_data(files['war3map.j'].decode('utf-8', errors='replace'))
    rects = script['rects']
    if not all(name in rects for name in ['OI', 'XI', 'BI', 'RA']):
        raise ValueError('The expected original CHLW v1.6a regions were not found')
    center = lambda key: ((rects[key][0]+rects[key][2])/2, (rects[key][1]+rects[key][3])/2)
    # Upper original lane, including the town-hall strip at x=6464. Its two arms
    # and the central U-shaped island are preserved, then a new market is added.
    left, bottom, right, top = -7424., 2048., 7168., 6912.
    width = height = 64
    tile = .5
    lane_rows = 44
    origin = dict(x=-16, z=-16)
    to_world = lambda x, y: dict(x=round((x-left)/(right-left)*32-16, 6),
                                  z=round((top-y)/(top-bottom)*(lane_rows*tile)-16, 6))
    ox, oy = terrain['offset']
    pw, ph, flags = pathing['width'], pathing['height'], pathing['data']
    def path_cell(x, y):
        return max(0, min(pw-1, int((x-ox)/32))), max(0, min(ph-1, int((y-oy)/32)))
    def open_cell(x, y):
        return 0 <= x < pw and 0 <= y < ph and not flags[y*pw+x] & 2
    def nearest_open(point):
        x, y = path_cell(*point)
        for r in range(32):
            for dy in range(-r, r+1):
                for dx in range(-r, r+1):
                    if open_cell(x+dx, y+dy):
                        return x+dx, y+dy
        raise ValueError('No walkable cell near the original marker')
    start, goal = nearest_open(center('OI')), nearest_open(center('BI'))
    queue, parents = collections.deque([start]), {start: None}
    while queue and goal not in parents:
        x, y = queue.popleft()
        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            q = x+dx, y+dy
            wx, wy = ox+(q[0]+.5)*32, oy+(q[1]+.5)*32
            if q not in parents and left <= wx < right and bottom <= wy < top and open_cell(*q):
                parents[q] = x, y
                queue.append(q)
    if goal not in parents:
        raise ValueError('Original entry and portal are not connected in WPM')
    raw_route, p = [], goal
    while p is not None:
        raw_route.append(p)
        p = parents[p]
    raw_route.reverse()
    corners = [raw_route[0]]
    for i in range(1, len(raw_route)-1):
        a, b, c = raw_route[i-1:i+2]
        if (b[0]-a[0], b[1]-a[1]) != (c[0]-b[0], c[1]-b[1]):
            corners.append(b)
    corners.append(raw_route[-1])
    route = [to_world(ox+(x+.5)*32, oy+(y+.5)*32) for x, y in corners]
    spawn, portal = to_world(*center('OI')), to_world(*center('BI'))
    heights, biomes, walkable = [], [], []
    for row in range(height):
        for col in range(width):
            if row >= lane_rows:
                heights.append(0); biomes.append(4); walkable.append(int(0 < col < width-1 and row < height-1)); continue
            x, y = left+(col+.5)/width*(right-left), top-(row+.5)/lane_rows*(top-bottom)
            vx = max(0, min(terrain['width']-2, int((x-ox)/128)))
            vy = max(0, min(terrain['height']-2, int((y-oy)/128)))
            samples = [terrain['vertices'][(vy+dy)*terrain['width']+vx+dx] for dx, dy in [(0,0),(1,0),(0,1),(1,1)]]
            h = sum(v['height'] for v in samples)/4/128
            texture = collections.Counter(v['texture'] for v in samples).most_common(1)[0][0]
            is_water = any(v['flags'] & 0x40 for v in samples)
            sx0, sy0 = path_cell(left+col/width*(right-left), top-(row+1)/lane_rows*(top-bottom))
            sx1, sy1 = path_cell(left+(col+1)/width*(right-left), top-row/lane_rows*(top-bottom))
            values = [flags[yy*pw+xx] for yy in range(sy0, sy1+1) for xx in range(sx0, sx1+1)]
            blocked = sum(bool(value & 2) for value in values)/max(1,len(values)) >= .35
            biome = 0 if is_water else 5 if blocked else 3 if texture == 3 else 4
            heights.append(round(h, 4)); biomes.append(biome); walkable.append(int(not blocked and not is_water))
    def clear(point, radius=.95, biome=3, flatten=False):
        for row in range(height):
            for col in range(width):
                x, z = origin['x']+(col+.5)*tile, origin['z']+(row+.5)*tile
                if (x-point['x'])**2+(z-point['z'])**2 <= radius**2:
                    i=row*width+col; walkable[i]=1; biomes[i]=biome
                    if flatten: heights[i]=0
    def corridor(a, b, radius=.95, flatten=False):
        length=((b['x']-a['x'])**2+(b['z']-a['z'])**2)**.5
        for i in range(max(1,int(length*4))+1):
            t=i/max(1,int(length*4));clear(dict(x=a['x']+(b['x']-a['x'])*t,z=a['z']+(b['z']-a['z'])*t),radius,flatten=flatten)
    # WPM passages were made for WC3 collision sizes. Widen only the chosen
    # route to ~1.9m for our voxel bodies, without inventing terrain heights.
    full_route = [spawn]+route+[portal]
    for a, b in zip(full_route, full_route[1:]): corridor(a,b)
    for point in [spawn,portal]: clear(point,1.25)
    ids=['equipment','consumables','books','smith','enchanter','runemaster']
    shops=[dict(id=key,x=-12.5+i*5,z=10) for i,key in enumerate(ids)]
    for point in shops: clear(point,1.6,4,True)
    fountain=dict(x=0,z=13.8)
    hero_spawn=dict(x=round(portal['x']-1,6),z=round(portal['z']+1,6))
    clear(hero_spawn,1.4)
    corridor(portal,dict(x=portal['x'],z=8),1.1,True)
    corridor(dict(x=-13,z=8),dict(x=13,z=8),1.1,True)
    for point in shops: corridor(dict(x=point['x'],z=8),point,1.1,True)
    corridor(dict(x=0,z=8),fountain,1.1,True)
    # New sender huts are distributed along the flanks; native town halls are
    # recorded separately in provenance rather than mislabelled as these huts.
    buildings=[dict(id=f'sender-{i}',x=[-13.,-9.,9.,13.][i%4],z=-11+(i//4)*5) for i in range(14)]
    original_halls=[dict(rawcode=u['rawcode'],world=to_world(u['x'],u['y']),source=dict(x=u['x'],y=u['y'])) for u in script['units'] if u['rawcode']=='h002' and bottom<=u['y']<=top]
    hashes={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
    metadata=dict(kind='warcraft-terrain-derived',title='Custom Hero Line Wars v1.6a',author='Baka-Ranger',
                  url='https://www.epicwar.com/maps/116369/',hashes=hashes,exactHeights=False,
                  crop=dict(left=left,bottom=bottom,right=right,top=top,laneRows=lane_rows),
                  originalVertexGrid=[terrain['width'],terrain['height']],originalPathingGrid=[pw,ph],
                  heightFormula='((ground-8192)+(cliffLayer-2)*512)/4/128; tile-corner mean',
                  entryRegion='OI',secondaryEntryRegion='XI',portalRegion='BI',originalTownHalls=original_halls,
                  adaptations=['Upper lane cropped and projected to 64x44 tiles; lower 20 rows are a new market annex.',
                               'Shortest WPM ground route from OI to BI, not a claim of the native engine exact chosen path.',
                               'Selected route widened to about 1.9 world units for voxel bodies.',
                               'Market connector and annex flattened; source heights elsewhere retained in relative cliff units.',
                               'Biome colours are original voxel colours; no WC3 textures/models/scripts redistributed.'])
    result=dict(version=1,id='chlw-v16a-upper-derived',name='Dalaran — corredor superior de CHLW v1.6a',seed=160,
                width=width,height=height,tileSize=tile,origin=origin,palette=PALETTE,
                biomes=biomes,heights=heights,walkable=walkable,heightSource='warcraft-w3e-derived',
                markers=dict(spawn=spawn,portal=portal,fountain=fountain,heroSpawn=hero_spawn,shops=shops,buildings=buildings,path=full_route),source=metadata)
    return result,dict(vertexGrid=[terrain['width'],terrain['height']],groundTextures=terrain['ground'],
                       hashes=hashes,sourcePathLength=len(raw_route),pathWaypoints=len(full_route),markers=result['markers'])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',type=Path,default=Path('outputs/line-wars-original'))
    parser.add_argument('--output',type=Path,default=Path('shared/maps/line-wars-map.json'))
    parser.add_argument('--preview',type=Path,default=Path('outputs/line-wars-original/voxel-derived-preview.png'))
    args=parser.parse_args();result,report=generate(args.input)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    args.output.with_suffix('.js').write_text("import preset from './"+args.output.name+"' with {type:'json'};\nimport {normalizeVoxelMap} from '../voxel-map.js';\nexport const LINE_WARS_MAP_PRESET=preset;\nexport function defaultLineWarsMap(){return normalizeVoxelMap(preset);}\n",encoding='utf-8')
    try:
        from PIL import Image, ImageDraw
        image=Image.new('RGB',(64,64));pixels=image.load()
        for i,biome in enumerate(result['biomes']):
            color=PALETTE[biome]['color'];values=[int(color[p:p+2],16) for p in [1,3,5]];shade=.78 if not result['walkable'][i] else 1
            pixels[i%64,i//64]=tuple(int(v*shade) for v in values)
        image=image.resize((640,640),Image.Resampling.NEAREST);draw=ImageDraw.Draw(image)
        position=lambda p:((p['x']+16)*20,(p['z']+16)*20)
        draw.line([position(p) for p in result['markers']['path']],fill='#e9ce73',width=3)
        for name,color in [('spawn','#a3e89a'),('portal','#e57d76'),('fountain','#86c7ef')]:
            x,y=position(result['markers'][name]);draw.ellipse((x-6,y-6,x+6,y+6),fill=color)
        for shop in result['markers']['shops']:
            x,y=position(shop);draw.rectangle((x-4,y-4,x+4,y+4),fill='#d5b5f3')
        args.preview.parent.mkdir(parents=True,exist_ok=True);image.save(args.preview)
    except ImportError:
        report['preview']='Pillow unavailable; JSON extraction completed'
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':
    main()
