# Kivow · Semana nova · v9.2 · QA DE MOTION

> V9.2: os itens marcados com (medido) são calculados no arquivo exportado pelo `v9/qa/qa_previas.py` e saem em `entregas/v9.2/qa.md`.

Nenhum vídeo é mandado sem passar por todos os itens. Cada item tem régua e evidência.

## 1. Leitura
- [ ] (medido) Leitura real a 360 x 450: OCR (tesseract, por) lê o texto essencial nos quadros de leitura: SOZINHO, 3:58, 12 s, SOS, SOZINHA, BAIXE O KIVOW.
- [ ] Essencial com 100 px ou mais em 1080; legenda com 34 px ou mais e 0,6 s parada; nada essencial só dentro da interface do celular.
- [ ] Cada informação fica legível o tempo mínimo de 0,9 s (frases) e 0,6 s (números).
- [ ] A descoberta do André e do Caio dura 4,9 s, com 0,5 s de leitura parada de propósito em 38,3 s.

## 2. Enquadramento e recorte
- [ ] Nenhuma letra ou número cortado em nenhum quadro. Evidência: folha de contato a 2 q/s do filme inteiro, com marca vermelha onde houver corte.
- [ ] Margem segura de 72 px respeitada nos estados de leitura.
- [ ] O corte que é edição de propósito (o celular passando da borda) fica separado de truncamento de conteúdo.
- [ ] Nenhum elemento fantasma (cópia meio apagada) em mergulho ou extração.

## 3. Continuidade
- [ ] Elemento compartilhado: o cartão extraído sai e volta com a mesma geometria. Erro de posição no começo e no fim menor que 1 px.
- [ ] Mergulhos: desvio no corte menor que 1 px, medido com o comparador da v5.
- [ ] Os números batem em todas as telas (tabela do plano v9): post, sticker, cartão, ranking, folha do Cuida.
- [ ] A frase final fica parada no mesmo lugar de PAY_03 até o fim.

## 4. Movimento
- [ ] (medido) Nenhuma pausa maior que 1,5 s sem motivo (diferença média entre quadros < 0,15).
- [ ] (medido) Sem saltos: nenhum quadro com diferença > 6 e > 3,5x a média local de 9 quadros, a não ser os cortes declarados (portal 3,80, mergulhos 25,574 e 42,994, impacto 23,639).
- [ ] Deriva ≤ 6 px/s e ≤ 0,8%/s na borda; conteúdo essencial nunca sai da margem de 72 px.
- [ ] Molas e easings conforme a direção audiovisual. Nada começa nem para seco.
- [ ] Desfoque de movimento só acima de 25 px/q e localizado.

## 5. Sincronismo
- [ ] Cada estado do app aparece no máximo 0,15 s depois da palavra que o nomeia (tempos de `voz_palavras.json` com os deslocamentos do cue sheet).
- [ ] Impactos na grade MEDIDA (124,00 BPM), ±1 q: 3,800 (q 228) · 19,284 (q 1157) · 23,639 (q 1418) · 25,574 (q 1534) · 36,700 (q 2202) · 46,381 (q 2783).
- [ ] (medido) Inteligibilidade: STOI da voz isolada contra o mix ≥ 0,85 e ≥ 0,80 na simulação de alto-falante de celular (passa-faixa de 300 Hz a 7 kHz).
- [ ] (medido) −14 LUFS integrado (±1) e pico real ≤ −1,0 dBTP no arquivo exportado; zero amostras clipadas.
- [ ] (medido) Soma mono perde no máximo 1,5 LU; correlação L/R ≥ 0,3.
- [ ] Escuta humana no alto-falante do celular e no fone (Nicácio), anotada no retorno.

## 6. Fidelidade e segurança
- [ ] SOS: nenhuma tela, som ou frase afirma envio, detecção ou resgate sem a confirmação do Filipy. A frase da voz fica bloqueada até lá.
- [ ] Sem selos de loja sem a distribuição confirmada.
- [ ] Só fotos reais, sem pessoa recortada e sem corpo animado.
- [ ] Sem travessão e sem cara de IA em nenhuma copy.

## 7. Prévias dos trechos de risco (antes do render final)
| Prévia | Trecho | Passa se |
|---|---|---|
| P1 · abertura e portal | 0 a 8,5 s (q 0 a 509) | Pergunta legível, portal com profundidade sem parecer recorte, impacto exatamente na batida 0, métricas acendendo nas palavras |
| P2 · desafio e recorde | 18,6 a 27,2 s (q 1116 a 1631) | Notificação nítida, toque no drop, 3:58 / 4:10 / 12 s claros a 360 px, suspensão e impacto sentidos, mergulho sem salto |
| P3 · SOS | 29,6 a 37,6 s (q 1776 a 2255) | Anel com exatos 180 q (2022 a 2202), contagem sincronizada, contatos visíveis, nenhum resultado afirmado, música abafada e liberada |
| P4 · encerramento | 42,0 a 50,25 s (q 2520 a 3014) | Mergulho na dupla, frase inteira, as 4 rotas chegando no K no compasso, CTA essencial montado por 3,35 s, alfabeto do K legível |

Render das prévias na nuvem (GitHub Actions), entrega em Downloads com folha de contato. O filme inteiro só depois das quatro prévias aprovadas.
