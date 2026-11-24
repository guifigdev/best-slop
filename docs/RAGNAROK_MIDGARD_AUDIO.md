# Midgard: cenários, mortes e áudio

O mundo conectado tem 22 regiões. Alberta, Ilha das Tartarugas, Amatsu, Comodo, Umbala e Niflheim acrescentam 24 modelos em `src/ro-midgard-landmarks.js`: navio, guindaste, farol, armazém, santuário de casco, ninho, coral, atracadouro, castelo, torii, sakuras, ponte, caverna, palco de concha, casa sobre estacas, tambores, casa nas árvores, máscaras, raízes, casa torta, carroça de abóboras, sino e arco de árvores mortas.

Os modelos usam os batches e limites existentes, com paletas próprias e passagens livres. As novas regiões pertencem ao grafo; os saves lineares V1 conservam suas 16 posições. O atlas mostra as novas conexões e Valhalla exige os outros 21 selos. Os guardiões de Comodo, Umbala e Niflheim são adaptações do catálogo disponível, sem afirmar que são os MVPs originais dessas cidades. Referência de identidade: [mapa oficial](https://ragnarokonline.gungho.jp/comeback/worldmap.html). A geometria voxel foi criada para este jogo.

## Animações

Consultar sempre os sprites originais antes de revisar animações Ragnarok. Esta integração lê SPR/ACT e conserva tempos, quadros, dimensões e eventos sonoros de 288 monstros. A apresentação é uma adaptação voxel, sem reprodução pixel a pixel: Poring estoura, Willow solta lascas, Lunatic rola e humanoides tombam. Fragmentos compartilham dois batches e até 256 partículas; até 64 corpos recentes permanecem por no máximo 2,3 s, sem atividade de combate.

Referências dos formatos: [SPR](https://ragnarokresearchlab.github.io/file-formats/spr/), [ACT](https://ragnarokresearchlab.github.io/file-formats/act/), [GRF](https://ragnarokresearchlab.github.io/file-formats/grf/). A leitura usa `grf-loader` MIT apenas no importador.

## Original e MIDI

São 545 arquivos originais únicos, associados a 525 nomes de efeitos e 23 entradas de música (22 regiões e Torre). Cada original tem uma transcrição `.mid`, hash SHA-256 e procedência no manifesto. WAV/MP3 são preservados byte a byte. MIDI é uma aproximação automática de notas, com perda de timbre, vozes e ruídos; não é uma trilha MIDI oficial.

Menu de pausa → Configurações permite escolher Original ou MIDI, ativar áudio, ajustar música/efeitos separadamente e ouvir um exemplo. Preferências ficam neste navegador. Uma interação libera o áudio do navegador. Ataques e mortes usam eventos reais, música acompanha região/Torre. O runtime é específico de Ragnarok Survivors. Eventos distantes, repetidos ou antigos não criam uma fila atrasada. Cache e vozes têm limites.

O importador registra 52 referências indisponíveis ou não resolvidas. Não foi importada toda a instalação, nem há cobertura afirmada de toda habilidade. Há nove famílias de ataques básicos e os efeitos nativos que puderam ser associados aos arquivos disponíveis.

## Importação e publicação

O cliente em `C:/Gravity/Ragnarok` é apenas lido; nenhum executável ou Lua do jogo é executado. Python precisa de `numpy`, `imageio-ffmpeg` e `mido`.

```powershell
node scripts/import-ro-client-media.mjs C:/Gravity/Ragnarok
python scripts/transcribe-ro-midi.py
node --test tests/ro-client-media.test.js
npm run build
```

O importador reescreve o manifesto: execute a conversão depois. `src/assets/ro-audio/PROVENANCE.txt` documenta a origem. Originais e MIDI somam aproximadamente 61 MiB no repositório e carregam sob demanda.

Vite emite arquivos reais, sem data URLs. `scripts/ro-audio-release.mjs` confere SHA de cada original e MIDI e cria `ro-audio-catalog-<hash>.json` com ambas as URLs. O deploy sincroniza `dist/client/assets` no Cloudflare R2 antes de ativar o servidor. O JavaScript também inclui os 24 novos modelos. Arquivos antigos permanecem para clientes já abertos.

Validação: integridade dos 545 pares, parsing e contagem de notas de cada MIDI, preferências persistidas, eventos de morte sem repetição, passagens/colisões dos mapas e revisão no renderer real dos seis cenários e das duas opções de áudio.

O evento base `levelup` usa `data/wav/levelup.wav`; `jobLevelup` usa `data/wav/effect/st_job_level_up.wav`. Esses anúncios podem tocar durante a escolha de melhoria. Música MIDI continua sendo agendada durante pausa; o exemplo tem um canal independente, respeitando ativação e volume de efeitos. A reprodução preserva programas MIDI e usa harmônicos por instrumento com compressor no master, em volume maior que a primeira versão de ondas simples. A aproximação das transcrições permanece explícita.
