"""Deterministic, lightweight audio-to-MIDI approximation, never an official score.
Requires numpy, imageio-ffmpeg and mido. Original audio bytes are never rewritten.
"""
import concurrent.futures, hashlib, json, pathlib, subprocess
import numpy as np
import imageio_ffmpeg, mido

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/assets/ro-audio'
MANIFEST = OUT / 'manifest.json'
RATE, HOP, WINDOW = 11025, 256, 2048

def convert(item):
    relative, music = item
    source = OUT / relative
    audio = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(source), '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-'], capture_output=True, check=True).stdout
    samples = np.frombuffer(audio, dtype='<f4')
    duration = len(samples) / RATE
    padded = np.pad(samples, (0, WINDOW))
    windows = np.lib.stride_tricks.sliding_window_view(padded, WINDOW)[::HOP].copy()
    rms = np.sqrt(np.mean(windows * windows, axis=1))
    spectrum = np.abs(np.fft.rfft(windows * np.hanning(WINDOW), axis=1))
    keys = np.arange(36 if music else 30, 96)
    bins = np.rint(440 * 2 ** ((keys - 69) / 12) * WINDOW / RATE).astype(int)
    energy = np.stack([np.max(spectrum[:, max(1, b-1):b+2], axis=1) for b in bins], axis=1)
    floor = max(.0008, float(np.quantile(rms, .85)) * (.10 if music else .08))
    voices = 3 if music else 1
    active = [set() for _ in range(len(windows))]
    for i in range(len(windows)):
        if rms[i] < floor: continue
        order = np.argsort(energy[i])[::-1]
        selected = []
        peak = float(energy[i, order[0]])
        for n in order:
            key = int(keys[n])
            if energy[i, n] < peak * .30: break
            if any(abs(key-k) < 3 or abs(key-k) in (12,19,24) for k in selected): continue
            selected.append(key)
            if len(selected) >= voices: break
        active[i].update(selected)
    events = []
    # Merge short holes before quantizing notes; do not replay every FFT frame.
    for key in keys:
        on = np.array([int(key) in row for row in active])
        for i in range(1, len(on)-1):
            if not on[i] and on[i-1] and on[i+1]: on[i] = True
        start = None
        for i in range(len(on)+1):
            if i < len(on) and on[i] and start is None: start = i
            if start is not None and (i == len(on) or not on[i]):
                seconds = (i-start)*HOP/RATE
                if seconds >= (.075 if music else .035):
                    strength = float(np.mean(rms[start:i])) / max(.001, float(np.quantile(rms, .9)))
                    velocity = int(np.clip(45+strength*30, 38, 100))
                    events.append((start*HOP/RATE, (i-start)*HOP/RATE, int(key), velocity, 0))
                start = None
    if not events and duration > 0:
        # A noise-only SFX has no honest pitched transcription: use a GM hit.
        peak = int(np.argmax(rms))
        events.append((max(0, peak*HOP/RATE-.02), min(.22, max(.06, duration)), 38, 80, 9))
    midi = mido.MidiFile(type=0, ticks_per_beat=480)
    track = mido.MidiTrack(); midi.tracks.append(track)
    track.append(mido.MetaMessage('track_name', name='Automatic RO audio transcription (approximation)', time=0))
    track.append(mido.MetaMessage('set_tempo', tempo=500000, time=0))
    track.append(mido.Message('program_change', channel=0, program=10 if music else 81, time=0))
    timeline = []
    for at, length, key, velocity, channel in events:
        timeline.extend([(round(at*960), 1, channel, key, velocity), (round((at+length)*960), 0, channel, key, 0)])
    last = 0
    for tick, enabled, channel, key, velocity in sorted(timeline):
        track.append(mido.Message('note_on' if enabled else 'note_off', channel=channel, note=key, velocity=velocity, time=max(0,tick-last))); last=tick
    track.append(mido.MetaMessage('end_of_track', time=max(0, round(duration*960)-last)))
    target = OUT / 'midi' / (source.stem+'.mid'); target.parent.mkdir(exist_ok=True)
    midi.save(target)
    return relative, dict(midi='midi/'+target.name, midiSha256=hashlib.sha256(target.read_bytes()).hexdigest(), duration=round(duration,4), midiNotes=len(events), transcription='spectral-note approximation, GM percussion fallback for noise')

if __name__ == '__main__':
    manifest = json.loads(MANIFEST.read_text(encoding='utf8'))
    sounds = {v['file']:False for v in manifest['sounds'].values()}
    sounds.update({v['file']:True for v in manifest['music'].values()})
    special={manifest['sounds'][key]['file'] for key in manifest.get('events',{}).values() if key in manifest['sounds']}
    for file in special: sounds[file]=True
    existing={}
    for row in list(manifest['sounds'].values())+list(manifest['music'].values()):
        target=OUT/row.get('midi','missing')
        if row.get('midiSha256') and target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest()==row['midiSha256']:
            existing[row['file']]={key:row[key] for key in ['midi','midiSha256','duration','midiNotes','transcription']}
    missing=[pair for pair in sorted(sounds.items()) if pair[0] not in existing]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = {**existing,**dict(pool.map(convert, missing))}
    for row in list(manifest['sounds'].values())+list(manifest['music'].values()): row.update(results[row['file']])
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=True, separators=(',',':')),encoding='utf8')
    files = sorted({row[k] for row in list(manifest['sounds'].values())+list(manifest['music'].values()) for k in ['file','midi']})
    bridge = "// Generated local URLs; Vite emits originals and MIDI for Cloudflare R2.\nimport manifest from './assets/ro-audio/manifest.json' with {type:'json'};\nexport const RO_AUDIO_MANIFEST=manifest;\nexport const RO_AUDIO_URLS={" + ','.join(json.dumps(f)+':new URL('+json.dumps('./assets/ro-audio/'+f)+',import.meta.url).href' for f in files) + '};\n'
    (ROOT/'src/ro-audio-assets.js').write_text(bridge,encoding='utf8')
    print(json.dumps({'converted':len(results),'notes':sum(r['midiNotes'] for r in results.values()),'music':len(set(r['file'] for r in manifest['music'].values()))}))
