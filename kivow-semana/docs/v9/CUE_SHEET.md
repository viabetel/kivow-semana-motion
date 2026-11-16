# Kivow · Semana nova · v9.2 · CUE SHEET

1080 x 1350 · 60 q/s · **50,2516 s (3015 quadros)**. Quadro = round(tempo x 60), arredondado UMA vez a partir do tempo absoluto.
Fonte única no código: `src/v9/tempos.ts`. Este documento é a leitura humana dele.

## O que foi MEDIDO antes de cronometrar (nuvem, `v9/insumos/medidas/`)
| Item | V9.1 (suposto) | V9.2 (medido) |
|---|---|---|
| Andamento da Mixkit 623 | 125 BPM | **124,00 BPM** (período 483,87 ms = 29,032 q; resíduo mediano 2,0 ms, p95 5,8 ms em 478 de 492 batidas) |
| Tom | não medido | **lá menor** (r 0,753; 2º lugar lá maior, 0,643) |
| Drop | 19,40 s | **A faixa não tem drop dentro do filme.** O único salto de energia é a entrada cheia (arquivo 14,77 s, +26,9 dB). Depois, energia estável (±1 dB) por 30 compassos, com +1 dB no compasso que cai em 19,28 s do filme |
| Loudness da faixa | não medido | −9,4 LUFS, pico real **+3,2 dBTP**. O mp3 já vem estourado, então a faixa entra com ganho bem abaixo de 1 |
| Voz | 45,1 s | 45,134 s, −17,2 LUFS, pico −1,2 dBTP |
| Os cortes da voz caem em silêncio? | não medido | 37,40 s: −64,6 dB · 39,53 s: −42,7 dB (25 dB abaixo da fala) · 40,90 s: silêncio digital · 43,54 s: pausa entre "sozinha." (43,40) e "Baixe" (43,68) |

Consequência: a grade de 125 BPM errava 0,34 s no fim do filme, por isso toda posição musical foi recalculada.

## Grade (tempo absoluto, sem arredondar batida por batida)
- Batida n = 3,80 + n x 0,4838726 s. Compasso k = batida 4k.
- A faixa começa no arquivo em 14,7744 s, que é o compasso da entrada cheia. Assim, a batida 0 do filme é a entrada cheia real.
- Compassos (s): 3,800 · 5,736 · 7,671 · 9,606 · 11,542 · 13,477 · 15,413 · 17,348 · **19,284** · 21,219 · **23,155** · 25,090 · 27,026 · 28,961 · 30,897 · 32,832 · 34,768 · **36,703** · 38,639 · 40,574 · 42,510 · 44,445 · **46,381** · 48,316 · **50,252**

## Voz em 5 trechos (cada trecho entra num quadro inteiro)
| Trecho | Origem (s) | Entra no quadro | Deslocamento | Por quê |
|---|---|---|---|---|
| A · frases 1 a 6 | 0,00 a 37,40 | 0 | 0 | |
| B · "Foi assim que o André e o Caio se acharam:" | 37,40 a 39,53 | 2292 (38,200 s) | +0,800 | descoberta com 4,9 s |
| C · "pelo feed." | 39,53 a 40,90 | 2492 (41,533 s) | +2,0033 | leitura dos cartões |
| D1 · "Sua próxima corrida não precisa ser sozinha." | 40,90 a 43,54 | 2574 (42,900 s) | +2,000 | |
| D2 · "Baixe o Kivow." | 43,54 a 45,10 | 2782 (46,367 s) | +2,8267 | **a chamada só vem depois que o K acende e o CTA começa a subir** |

## B10 e B11: a sobreposição foi medida e eliminada
- A V9.1 dizia que "pelo feed" ia até 42,90 s. Esse é o fim do TRECHO C, que tem 0,58 s de silêncio no final.
- A palavra "feed." termina em **42,323 s (q 2539,4)**.
- O mergulho do B11 começa no **quadro 2540 (42,333 s)**, depois da palavra. Sobreposição: zero.
- De 41,723 a 42,323 s o post do André e do Caio fica parado na tela, com a marca volt em "aqui no feed". A imagem mostra o que a voz diz.

## Cues por prévia (quadros da composição mestre `SemanaV9`)
Siglas: **VO** voz · **MU** música · **AM** ambiente · **UI** interface · **IM** impacto.

### P1 · abertura, portal, post e dados · q 0 a 509 (0 a 8,50 s)
| t (s) | q | Voz | Imagem | Som |
|---|---|---|---|---|
| 0,00 | 0 | | Pergunta sobe da máscara linha a linha (0,05 + 0,07 s por linha, 0,26 s cada); palavras a 13% | AM pista (ElevenLabs), fade de 0,5 s |
| 0,18 a 3,28 | 11 a 197 | "Já ... treino?" | Cada palavra acende na própria sílaba (0,12 s) | VO |
| 1,06 | 64 | "sozinho" | SOZINHO em volt, pulso 1,00 a 1,04 a 1,00 em 0,30 s | UI toque do K (lá, 110 Hz) |
| 1,55 a 2,60 | 93 a 156 | | Quadrado de partida aparece; a linha do K desenha 351 px sob SOZINHO | UI traço (fricção) |
| 3,40 a 3,64 | 204 a 218 | | Pergunta sobe 200 px e cai a 40%. O quadrado vira a janela 520 x 520 em mola (ζ 0,8, ω 18), com refração de 18 px na borda de 40 px | IM sucção de 0,40 s |
| 3,64 a 3,80 | 218 a 228 | | Câmera atravessa: a janela acelera (exponencial) até cobrir o quadro; o texto passa pela câmera (escala 1,9, desfoque 8 px) | |
| **3,800** | **228** | | Pista em tela cheia, de 1,25 a 1,0204 em 12 q | **IM impacto do portal + MU entra cheia (batida 0)** |
| 3,88 a 4,22 | 233 a 253 | "No Kivow" | Sticker da pista: quadrado, 5 km a cada 60 ms, relatório sobe | UI 5 tiques |
| 4,30 a 5,74 | 258 a 344 | "cada corrida vira um post" | Celular sobe de 0,30 a 0,95 (mola ζ 0,82, ω 4,6; inclinação de 6° a 0°); sticker apaga de 4,35 a 4,65 | UI deslize de vidro |
| 5,736 | 344 | "post" | Celular assenta (compasso 1) | UI placa |
| 6,00 a 6,30 | 360 a 378 | | Cartão sai do post (elemento compartilhado: mesma função de geometria) | UI pop de descolar |
| 6,24 | 374 | "distância" | 6,20 km rola na própria janela (0,33 s) + traço volt | UI nota 1 (lá) |
| 6,94 | 416 | "tempo" | 35:08 rola | UI nota 2 (dó) |
| 7,32 | 439 | "ritmo" | 5'40" rola | UI nota 3 (mi), que fecha o acorde |
| 7,90 a 8,20 | 474 a 492 | | Cartão volta ao post; troca de dono em 8,20 | UI encaixe (8,18) |

### P2 · desafio e recorde · q 1116 a 1631 (18,60 a 27,20 s)
| t (s) | q | Voz | Imagem | Som |
|---|---|---|---|---|
| 18,60 | 1116 | | Dentro da foto de Marcos e Rafael, sticker de 6,40 km | AM dois corredores |
| 18,75 | 1125 | | Celular sobe de 0,50 a 0,90 (mola ω 6) | UI deslize |
| 19,03 a 19,28 | 1142 a 1157 | "Na orla" | Notificação desce (mola ζ 0,75, ω 12) e pousa na virada de frase | UI notificação do Kivow (2ª nota em 19,28) |
| **19,284** | **1157** | | | **MU: a faixa estava filtrada em 2,5 kHz desde 15,41 e abre por inteiro. O drop é nosso, no compasso medido** |
| 19,526 | 1172 | | Toque (na colcheia): onda volt de 0 a 1,6x em 18 q; a notificação afunda 3% | UI toque |
| 19,64 | 1178 | "Diego" | Post do Diego entra empurrando (0,30 s); celular vai a 0,95 | UI deslize lateral |
| 19,96 | 1198 | | Brilho passa no selo Dono do Trecho | UI brilho |
| 20,24 a 20,58 | 1214 a 1235 | "melhor" | Cartão do trecho sai do post no mesmo estado do post e recolhe os elementos para contar do zero; celular apaga | UI pop |
| 20,74 | 1244 | "tempo" | 3:58 sobe da máscara; pino do Diego pousa (mola ζ 0,6) | IM bumbo de referência |
| 21,56 | 1294 | "dono" | Anel volt desenha no ícone; legenda "Diego Matos · dono do trecho" | UI brilho |
| 22,92 | 1375 | "Agora" | 3:58 encolhe, 4:10 sobe e seu pino aparece | UI tique |
| **23,155 a 23,518** | **1389 a 1411** | "o trecho" | Perseguição: a cabeça volt acelera (perfil hiperbólico, n 0,45) e deixa rastro até 72 px antes do recorde | MU 3 semicolcheias crescendo |
| 23,518 a 23,639 | 1411 a 1418 | | Suspensão: tudo parado | **MU −12 dB por 0,121 s** |
| **23,639** | **1418** | | "12 s" em volt (escala de 1,18 a 1, com brilho), tremor de 2 px por 6 q; pílula "você a 12 s" | **IM impacto (batida 41)** |
| 24,30 a 24,95 | 1458 a 1497 | "seu" | Números saem; o cartão volta ao estado do post e pousa nele; o celular volta | UI encaixe |
| 24,95 a **25,574** | 1497 a **1534** | | Mergulho na orla: ponto fixo calculado, aceleração exponencial; foto casada no lugar do post | IM mergulho (termina no corte) |
| 25,574 | 1534 | | Orla em tela cheia (mesma foto, mesma geometria: a troca não muda nenhum pixel) | AM mar e vento |
| 25,62 a 26,10 | 1537 a 1566 | "E todo mês" | Sticker de 8,00 km desenha | UI tiques |
| 26,30 · 26,54 · 26,78 | 1578 · 1593 · 1607 | "disputa" | Ranking sobe em vidro; uma linha a cada colcheia | UI 3 placas |

### P3 · linha do K, parque e SOS · q 1776 a 2255 (29,60 a 37,60 s)
| t (s) | q | Voz | Imagem | Som |
|---|---|---|---|---|
| 29,60 a 29,95 | 1776 a 1797 | | Ranking desce | |
| 29,80 a 30,50 | 1788 a 1830 | | Linha do K a 58° varre e abre o parque (máscara conduzida pela linha volt de 12 px) | IM varrida com filtro |
| 30,60 a 31,60 | 1836 a 1896 | "no meio do treino" | Sticker do parque desenha e para em 62% (corrida em andamento) | AM parque; MU vai a 2,5 kHz (30,90 a 32,00) |
| 32,30 | 1938 | | Celular sobe com o post ao vivo do Lucas; pulso "ao vivo" a cada 0,8 s | UI deslize, ao vivo |
| 33,36 a 33,70 | 2002 a 2022 | "O Kivow Cuida" | Folha do Cuida sobe (mola ζ 0,85); celular vai a 0,85 | UI folha |
| **33,700** | **2022** | | Dedo pressiona; botão afunda 2,7%. Foco: +10% de escuro e câmera +2% no botão | MU abafada (900 Hz, −8 dB); UI pulso grave de 3,00 s |
| 34,700 | 2082 | "SOS" | Contagem 2 | UI sinal 1 |
| 35,700 | 2142 | | Contagem 1 | UI sinal 2 |
| 35,76 · 35,88 | 2146 · 2153 | "quem você escolher" | Os dois contatos escolhidos acendem (volt + marca) | UI dois tiques |
| **36,700** | **2202** | | **Anel completo: 2022 + 180 = 2202 (3,000 s exatos). O compasso 17 está em 36,7033 s = q 2202,2** | UI sinal 3 + alívio; **MU abre na batida** |
| 37,00 a 37,35 | 2220 a 2241 | | Folha desce e revela "Atletas perto de você" | UI folha |

### P4 · mergulho na dupla, frase, rotas, K e CTA · q 2520 a 3014 (42,00 a 50,25 s)
| t (s) | q | Voz | Imagem | Som |
|---|---|---|---|---|
| 42,00 a 42,323 | 2520 a 2539 | "feed." | Post dos dois parado, marca volt em "aqui no feed" | VO |
| 42,333 a **42,994** | 2540 a **2580** | | Mergulho: as marcas apagam em 0,12 s; foto casada; aceleração exponencial até Z 1,6413 (batida 81) | IM whoosh + abertura harmônica |
| 43,05 a 43,53 | 2583 a 2612 | | Sticker de 8,40 km desenha (8 km) | UI tiques; AM dupla |
| 43,20 | 2592 | "Sua próxima corrida" | Linha 1 sobe (0,24 s) | |
| 44,22 | 2653 | "não precisa" | Linha 2 sobe | |
| 44,96 a 45,26 | 2698 a 2716 | "sozinha" | Quadrado de partida e linha do K sob SOZINHA (318 px); sticker apaga | UI toque do K resolvido no maior (rima com 1,06 s) |
| 45,00 a 45,60 | 2700 a 2736 | | A foto escurece até o tinta; a frase não se move (é o mesmo elemento) | |
| 45,10 a 45,50 | 2706 a 2730 | | Grade, quadrados de partida, ícones e rótulos | |
| 45,300 · 45,421 · 45,542 · 45,663 | 2718 · 2725 · 2733 · 2740 | | As 4 rotas começam (uma por semicolcheia) e chegam juntas em 46,381; câmera recua 4% | UI pista, orla, parque, estádio |
| **46,381** | **2783** | | **K oficial acende (mola ζ 0,55) com brilho volt (compasso 22)** | **IM assinatura do Kivow** |
| 46,40 a 46,66 | 2784 a 2800 | | "BAIXE O KIVOW" sobe; logo de 46,42 a 46,62 | |
| **46,507** | **2790** | **"Baixe"** | (o texto já está entrando desde 46,40) | VO |
| 46,50 a 47,00 | 2790 a 2820 | "o Kivow" | Mapa recua para OUT_04 (0,74, 60%) | |
| 46,66 a 46,90 | 2800 a 2814 | | Lojas | |
| 46,80 a 47,28 | 2808 a 2837 | | Alfabeto do K, um ícone por semicolcheia | UI 5 notas |
| **46,90 a 50,25** | **2814 a 3015** | | **Leitura com tudo o que é essencial montado: 3,35 s.** Com o alfabeto inteiro: 2,97 s | MU −6 dB em 46,38; fade de 48,32 a 50,25 (2 compassos) |

Os blocos fora das prévias (B4 a B6, meio do B8, B10) mantêm a coreografia da V9.1. As posições musicais deles serão travadas na mesma grade medida antes do filme inteiro.
