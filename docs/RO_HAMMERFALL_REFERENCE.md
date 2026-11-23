# Martelo de Thor: referência visual inspecionada

Referências consultadas e imagens vistas antes da implementação:

- [Catálogo de efeitos](https://github.com/lukasrmattos/ragnarok_effects_list), entrada **102, Hammerfall**, distinta do ID de habilidade **110, BS_HAMMERFALL**.
- [Vídeo original de referência](https://raw.githubusercontent.com/lukasrmattos/ragnarok_effects_list/main/videos/effect_102.webm) e [miniatura](https://raw.githubusercontent.com/lukasrmattos/ragnarok_effects_list/main/thumbs/effect_102.png).
- [API e formatos do ragassets](https://github.com/adsonpleal/ragassets#api), [mapeamento das habilidades](https://assets.latam-tools.com.br/effect/skill-map), [sequência STR crashearth](https://assets.latam-tools.com.br/effect/str?file=crashearth) e [imagem original hammer.bmp](https://assets.latam-tools.com.br/effect/texture?file=hammer.bmp).

A captura tem 15 quadros por segundo. A sequência original STR tem **60 fps, maxKey 79, 13 camadas**, incluindo uma vazia: dois martelos com quatro quadros de atraso entre si; quatro camadas de fumaça; duas explosões; duas ondas; duas camadas de partículas. As texturas declaradas são `hammer.bmp`, `smoke_mud.bmp`, `explosive_1_128.bmp`, `lord_blast_f.bmp` e `storn_a.bmp`. O mapeamento associa também o som `effect/black_hammerfall` e um tremor de câmera.

Coreografia verificada no vídeo e no STR: o martelo translúcido aparece no alto à direita e desce girando; seu primeiro contato ocorre no quadro **30, em 0,5 s**. O segundo acompanha com quatro quadros de atraso. O contato produz um clarão branco e dourado, duas ondas concêntricas que se abrem rapidamente, jatos curtos de fumaça clara e centelhas douradas. O martelo fica visível no chão, com cabeça quadrada dourada, miolo sombreado púrpura e cabo roxo voltado para a direita. Após o quadro 60, levanta e desaparece; o segundo termina no quadro 79, em aproximadamente 1,32 s.

As provas locais de inspeção estão em `outputs/hammerfall-reference/`: vídeo original, textura original, JSON STR e folha de quadros `original-sequence.png`. O efeito não é uma martelada de machado nem apenas um círculo branco genérico. Sua assinatura depende do martelo duplo, da descida giratória, do instante do clarão e da sequência de dissipação.

A licença MIT do software ragassets não concede licença sobre imagens da Gravity. O catálogo de previews também não declara licença sobre esses recursos. As imagens importadas conservam a atribuição à Gravity no manifesto; não são apresentadas como arte autoral do projeto. Mecânica, dano e raio deste survivor continuam adaptações locais.

## Implementação e comparação

`src/ro-native-str-art.js` é uma implementação própria em Three.js do playback STR. Usa o JSON e as texturas originais importados, incluindo os dois martelos e suas camadas de fumaça, clarão, ondas e partículas. Não reutiliza o sprite genérico de impacto nem o rastro do machado. Quadros absolutos são mantidos; quadros incrementais alteram posição, cor, rotação e vértices por quadro. Uma volta completa corresponde a 1024 unidades angulares. O pivô clássico é `(320,320)`, e o billboard usa a câmera atual. Os fatores D3DBLEND de origem e destino permanecem no dado e no sampler, inclusive `5/7`; preto opaco não é removido artificialmente das texturas aditivas.

O cliente de referência desenha sobre um framebuffer opaco de oito bits, com alfa de destino saturado em 1. A cena do jogo usa RGBA HalfFloat: seu alfa pode ultrapassar 1 após efeitos aditivos. Aplicar `DstAlpha` diretamente nesse alvo amplificaria até os fundos pretos retangulares de cada textura, gerando um bloco branco. O material emula o destino opaco original: `DstAlpha` vira fator 1 e `InvDstAlpha` fator 0 para RGB; a composição separada do canal alfa usa `Zero/One`, sem fazê-lo crescer. Os outros fatores RGB continuam iguais. Essa adaptação não requer novo passe e funciona mesmo quando efeitos anteriores já elevaram o alfa HDR.

Os oito valores UV brutos permanecem no JSON e no sampler. O desenho clássico usa UV naturais no quad; interpretar o padrão `0,0,1,1,0,0,1,1` como quatro pares de cantos colapsaria a imagem. A profundidade dos pixels que caem abaixo do piso é projetada sobre o plano do ponto de impacto, mantendo os mesmos pixels na tela e o teste de profundidade contra paredes. Assim o clarão não perde metade da imagem por atravessar o chão.

Um atlas compartilhado agrupa as cinco texturas de HammerFall em dois desenhos por quadro, separados pelos fatores de composição originais. O limite global é de 12 clips, 768 camadas visíveis e dois atlas de 2048², no máximo 32 MiB. O carregamento tem duas tarefas concorrentes. Cada evento decide uma única vez entre original pronto e apresentação anterior; carregamento tardio não duplica o golpe. Os clips duram até o fim do STR mesmo se o evento de rede desaparecer antes. A implementação não importa nem copia o código GPL de outros renderizadores.

A comparação sincronizada está em `outputs/hammerfall-review.html`: vídeo original à esquerda, playback do STR no cenário à direita, com pausa e controle de quadro. Essa comparação valida o efeito disponível nessa fonte, sem prometer que todas as versões do cliente usam os mesmos recursos. O `Camera.setQuake` da tabela não é reproduzido como tremor global forte.
