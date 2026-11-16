# Kivow · Semana nova · v9.2 · DESIGN DE SOM

> V9.2: trilha MEDIDA (124,00 BPM, lá menor, sem drop dentro do filme, −9,4 LUFS, pico +3,2 dBTP). Os sons foram produzidos de verdade: `public/v9/sfx/` (manifesto.json). A loudness é medida no arquivo exportado, não declarada no Remotion.

**Identidade sonora do Kivow: física e corrida, não digital genérico.** Cada som de interface tem corpo (ar, borracha, asfalto, vidro). Os sons de "dado" são notas de um mesmo acorde, para que o app soe como um instrumento. Nada de sons reconhecíveis de outros apps: nem a notificação do iOS, nem o "pop" padrão, nem sirene.

## 1. Cinco grupos e níveis (mix final a −14 LUFS integrado, pico −1 dBTP)
| Grupo | Conteúdo | Nível de referência | Regra |
|---|---|---|---|
| **VO** locução | `narracao_grok.mp3` em 4 trechos (ver o cue sheet) | −16 LUFS de curto prazo | Sempre na frente. EQ com +2 dB em 3 kHz; nada mascara entre 1 e 4 kHz enquanto há fala |
| **MU** música | Mixkit 623 (124,00 BPM medido, lá menor) como base rítmica + camadas originais | −24 LUFS sob a voz, −18 sem voz | Abaixa 6 dB com a voz (ataque 80 ms, liberação 300 ms) |
| **AM** ambiente | pista ao amanhecer, mar, parque, risadas | −30 LUFS | Muda com o lugar; entra junto com a foto |
| **UI** interface | toques, deslizes, notas dos dados, mensagens | −26 LUFS | Curtos (40 a 180 ms); espalhados no estéreo pela posição na tela |
| **IM** impactos e transições | portal, mergulhos, "12 s", varridas, assinatura final | −20 LUFS de pico curto | No máximo um por compasso; sempre na grade |

## 2. Paleta sonora original
- **Toque do K** (assinatura 1): tom grave e seco com ataque de borracha. Aparece em "sozinho" (1,06 s) e volta resolvido no maior em "sozinha" (44,96 s), fazendo a rima sonora do começo com o fim.
- **Acorde dos dados:** distância, tempo e ritmo são três notas, da grave para a aguda, que formam a tríade do tom da faixa (tom medido na nuvem antes da produção).
- **Mensagens:** três tons em terças subindo (Bruno, Rafael, Marcos). O "Fechado" completa a tríade.
- **Conexão:** duas notas em lados opostos do estéreo que se aproximam e viram um acorde no centro. Usada em Marcos e Rafael (17,38 s) e em André e Caio (39,72 a 41,0 s).
- **Recorde:** tiques em semicolcheia que crescem, corte de 0,12 s e impacto grave e seco no "12 s".
- **SOS:** pulso grave contínuo e três sinais que sobem de altura, um por segundo. A resolução é de alívio, não de alarme. **Proibido sirene ou som de "enviado".**
- **Quatro rotas:** quatro texturas (passos, ar, folhas, eco de estádio) que convergem no acorde final.
- **Assinatura sonora do Kivow:** os quatro sons de rota mais o toque do K, num acorde de 1,2 s com cauda.

## 3. Dinâmica da música (automação por quadro)
| Trecho | Estado da MU |
|---|---|
| 0 a 3,80 | Ausente. Só AM (respiração, passos distantes) e tensão crescente (riser de 0,4 s a partir de 3,40) |
| 3,80 | Entra cheia na batida 0, junto com o impacto do portal |
| 3,8 a 16 | Cheia, abaixando sob a voz |
| 15,22 a 17,24 | O filtro abre e entra uma camada quente (pad original) no compasso 17,24, o primeiro momento emocional |
| 15,41 a 19,28 | A faixa recua (passa-baixa 2,5 kHz). Em 19,284 (compasso 8, o único +1 dB medido) ela abre por inteiro com a notificação: como a faixa não tem drop, o drop é feito na mixagem |
| 23,518 a 23,639 | Suspensão (−12 dB por 0,121 s, uma semicolcheia) antes do impacto do "12 s" na batida 41 |
| 30,6 a 33,9 | O passa-baixa sobe aos poucos (a faixa vai ficando distante) |
| 33,70 a 36,70 | Abafada (passa-baixa 900 Hz, −8 dB) durante o segurar (q 2022 a 2202) |
| 36,70 | O filtro abre no compasso 17 (36,7033 s) |
| 38,32 a 43 | A melodia mais emocional volta e o pad entra de novo |
| 45 a 46,38 | Última frase. Assinatura do Kivow em 46,381 (compasso 22) e faixa a −6 dB |
| 48,32 a 50,25 | Fade de dois compassos |

## 4. Como os sons são produzidos (sem baixar sons prontos de app)
- **UI e notas:** sintetizados em código (numpy: envelopes, ruído filtrado, senoides afinadas no tom da faixa). Geração determinística na nuvem, WAV 48 kHz em `public/sfx/`.
- **Texturas e ambiente:** ElevenLabs Sound Effects (API, na nuvem). Um prompt por som, por exemplo:
  - "early morning running track ambience, distant footsteps";
  - "air suction into a portal, short";
  - "deep dry sports impact, short tail".
  
  Revisados um a um.
- **Tom e batidas da faixa:** medidos na nuvem (librosa) antes de afinar o acorde dos dados e a assinatura.
- **Montagem:** cada camada é um `<Audio>` com volume por quadro (`src/v9/Som.tsx`). O Remotion só controla volume. Por isso o filtro é um cruzamento entre a faixa cheia e as versões filtradas (2,5 kHz e 900 Hz), geradas na nuvem e alinhadas amostra a amostra.
- **Master (fora do Remotion, medido):**
  - o mp4 exportado recebe um ganho único, calculado para −14 LUFS integrado no conjunto;
  - depois passa por um limitador de pico real em −1 dBTP;
  - em seguida é medido de novo (EBU R128, `v9/qa/qa_previas.py`).

## 5. Espaço para a voz
- Nenhum impacto em cima de sílaba tônica de palavra-chave, exceto os casos sincronizados de propósito ("sozinho", "post", "12 s", "Kivow").
- Entre 1 e 4 kHz, UI e IM ficam 8 dB abaixo da voz.
- **Teste:** ouvir o filme inteiro só no alto-falante do celular e com fone. A frase precisa ser entendida nas duas condições.
