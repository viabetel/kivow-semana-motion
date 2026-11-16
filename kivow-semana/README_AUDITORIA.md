# Kivow · "Semana nova" · motion V9.2 (pacote para auditoria)

Instagram 1080 x 1350, 60 q/s, Remotion 4. Este repositório público contém só este projeto, para auditoria externa.

## Por onde começar
1. `docs/v9/V9.2_CORRECOES.md`: resposta ponto a ponto à auditoria da V9.1, com a evidência de cada item.
2. `docs/v9/CUE_SHEET.md`: tempos e quadros de imagem, voz e som. A fonte única é `src/v9/tempos.ts`.
3. `docs/v9/AUDIOVISUAL_DIRECTION.md`, `SOUND_DESIGN.md` e `MOTION_QA.md`.
4. `v9/insumos/medidas/`: medições reais da trilha e da voz (`grade.json`, `medidas.md`, `trilha.png`) e a prova dos mapas de profundidade.
5. `entregas/v9.2/`: as quatro prévias (mp4), as folhas de contato a 4 q/s e o QA medido (`qa.md` e `qa.json`).

## Código
| Arquivo | O quê |
|---|---|
| `src/v9/Palco.tsx` | Composição mestre `SemanaV9`: camada persistente (cada elemento existe uma vez; geometria global por função do quadro; troca de dono sem cópia) |
| `src/v9/Pecas.tsx` | Celular (moldura real + tela em coordenadas do Figma), Foto com profundidade (feDisplacementMap), cartões, sticker com repiques, toque, títulos |
| `src/v9/Som.tsx` | Voz em 5 trechos, música com automação e "filtro" por cruzamento de versões filtradas, 60 cues de som |
| `src/v9/mov.ts` | Molas em forma fechada, curva de mergulho, trilhas de chaves, geometria (naTela, mergulho com ponto fixo) |
| `src/v9/tempos.ts` | Grade medida (124,00 BPM), trechos de voz, gatilhos de palavra |
| `src/v9/svgs.ts` | SVGs do Figma com ids legíveis (gerado por `v9/insumos/svgs_para_ts.py`) |
| `v9/insumos/*.py` | Medição da trilha, profundidade (Depth Anything V2) e biblioteca sonora (síntese + ElevenLabs SFX) |
| `v9/qa/qa_previas.py` | Master (ganho único + limitador de pico real) e QA: EBU R128, mono, clipping, STOI, saltos entre quadros, OCR a 360 px |
| `.github/workflows/` | Render e QA no GitHub Actions |

## O que NÃO está aqui
- A faixa Mixkit 623 e as versões dela (`public/voz/trilha_623.mp3`, `public/v9/sfx/trilha*.wav`). A licença da Mixkit não permite redistribuir o arquivo. Sem eles, o código compila, mas o render sai sem música.
- Versões antigas (v1 a v8) e insumos que não são usados na V9.

## Pendências de aprovação (fidelidade)
- **SOS:** a voz diz "tem um SOS que avisa a quem você escolher" e a folha no Figma diz "Avisa quem você escolheu". Os dois dependem da confirmação do cliente sobre o que o SOS faz. Na tela, nenhum resultado é afirmado.
- **Lojas:** a linha "Na App Store e no Google Play" depende da distribuição confirmada.
