# Kivow · Semana nova · v9.2 · DIREÇÃO AUDIOVISUAL

> V9.2: correções cirúrgicas da auditoria (câmera em px/s, elementos compartilhados, leitura real, dependências verificadas). Detalhe e evidência em `V9.2_CORRECOES.md`.

**Tese:** um app que reage ao mundo real. A interface ganha profundidade, atravessa fotos e vira cena. O tema é a conexão entre corredores; ranking e segurança só amplificam. O alfabeto do K é a linguagem de movimento: linha que desenha, quadrado de partida, ângulos de 47° e 58°, volt só no que é conquista.

Base visual: storyboard v9 no Figma (página 01, seção 613:950, 56 estados). Não muda a identidade; muda como ela se move. Tempos no `CUE_SHEET.md`.

## 1. Câmera
- **Câmera virtual 2.5D.** Cada cena é um conjunto de planos com z próprio:
  - fundo (foto real);
  - celular (plano com perspectiva de 1400 px; rotateX e rotateY de no máximo 6°);
  - cartões extraídos (z +80);
  - tipografia (z +120).
  
  O parallax sai do z, não de translação inventada.
- **Fotos reais com profundidade, sem recorte.** Em cada foto em tela cheia, um mapa de profundidade é gerado na nuvem (Depth Anything V2, GitHub Actions). Ele vira deslocamento de no máximo 10 px no push-in. Nunca separar a pessoa do fundo nem animar o corpo.
- **Movimento sempre motivado:**
  - push-in lento (1,00 a 1,04) enquanto a voz explica;
  - recuo de 3% a 4% quando algo se resolve (Fechado, cartões se encontrando, rotas chegando);
  - aproximação de 2% no foco do SOS e do recorde.
- **Deriva (V9.2), em px por SEGUNDO, nunca por quadro:** no máximo 6 px/s de translação e 0,8%/s de escala, medidos na borda do quadro. Nenhuma deriva pode tirar o conteúdo essencial da margem de 72 px. A tabela por enquadramento está em `V9.2_CORRECOES.md` §1. A única pausa intencional é a leitura dos cartões, 0,5 s em 38,3 s.

## 2. Transições (todas com motivo na história)
| Nome | Onde | Como |
|---|---|---|
| **Portal do K** | 3,64 a 3,92 s | O quadrado de partida cresce em mola (ζ 0,8). A borda tem refração localizada: deslocamento de 18 px numa faixa de 40 px, ruído estático e determinístico. A câmera atravessa: escala 1,25 a 1,02 em 12 q. A pista fica atrás da interface, não colada sobre ela. |
| **Elemento compartilhado** | cartão do treino, cartão do trecho, cartões dos atletas, fotos casadas, K | Camada persistente (V9.2): composição mestre única, sem Sequence montando imagem. A geometria global sai da mesma função nos dois donos (`naTela(celular(q), retânguloNaTela)`). A troca de dono acontece num quadro em que as duas geometrias são idênticas. Ver `V9.2_CORRECOES.md` §6. Proibido trocar por uma cópia com fade. |
| **Mergulho casado** | Marcos e Rafael, orla, dupla | O celular escala até 1,64 ancorado no centro da foto. Em 1,64 a foto do post é a foto em tela cheia (casamento medido entre 0,995 e 0,999). O painel apaga antes. Desfoque de movimento só nos 6 q finais. Desvio no corte menor que 1 px. |
| **Linha do K abrindo lugar** | orla para parque, 29,8 s | Máscara a 58° conduzida pela linha volt de 12 px, 0,7 s, cubic in-out. |
| **Celular chegando sobre o mundo** | pista, dupla da manhã, parque | O que ficou da v7: sobe de baixo (escala 0,30 a 0,75), inclina de 6° a 0°, sombra de contato crescendo. |
| **Foto que vira mapa** | 45,0 s | A foto escurece até o tinta e a frase fica parada (elemento compartilhado). A linha sob SOZINHA vira a primeira rota. |

## 3. Os sete momentos de maior cuidado
1. **Portal (3,6 a 4,0 s):** refração na borda, profundidade e impacto na batida 0.
2. **Extração das métricas (6,0 a 7,9 s):** continuidade geométrica exata. Os números rolam como contador (cada dígito desliza na vertical, 14 q).
3. **Conexão Marcos e Rafael (16,1 a 18,4 s):**
   - dois avatares em arcos diferentes, com rastro volt de 2 px que apaga em 0,3 s;
   - quando as trajetórias se encontram, um pulso de luz corre pela ligação e se transforma na foto dos dois.
4. **Perseguição do recorde (22,9 a 23,5 s):**
   - o 3:58 fica parado como referência;
   - o seu pino acelera pela régua (velocidade hiperbólica até o pico), com rastro e desfoque localizado, e para antes do recorde;
   - suspensão de 0,12 s, depois "12 s" com impacto e tremor de 2 px.
5. **SOS (33,9 a 36,9 s):**
   - foco cinematográfico: o resto da tela escurece mais 10% e a câmera avança 2%;
   - o anel progride linear por exatos 3,00 s e a contagem 3, 2, 1 tem resposta sonora discreta;
   - ao completar, tudo relaxa e a câmera volta;
   - nenhum resultado é afirmado (ver bloqueio na seção 6).
6. **Encontro de André e Caio (37,4 a 41,7 s):**
   - física de atração: mola ζ 0,7, inclinação de 4°, sobreposição no centro;
   - os cartões pousam no post deles. Agora com 4,9 s.
7. **Quatro rotas, um K (45,3 a 46,6 s):**
   - as rotas desenham em profundidades diferentes, a câmera recua 4% e o K acende em volt no compasso;
   - depois disso nada compete com o CTA (2,9 s montado).

## 4. Física e easing (padrão do projeto)
- **Molas:** entrar e assentar ζ 0,8; toque e pulso ζ 0,5 a 0,6; notificação ζ 0,75, ω 12.
- **Câmera:** Hermite com velocidade contínua; nada começa nem para seco.
- **Mergulhos:** aceleração exponencial, sem overshoot.
- **Toque:**
  - ponto de 84 px a 16%;
  - onda volt de 0 a 1,6x em 18 q;
  - o elemento afunda 3% em 6 q.
- **Desfoque de movimento:** apenas acima de 25 px/q, por amostragem temporal (CameraMotionBlur com 6 amostras) e localizado na camada que se move.
- **Brilho:** só no K oficial e no "12 s". Proibido glow em tudo.

## 5. Tipografia em movimento
- **Títulos:** Sofia Sans Extra Condensed Black, que sobem da máscara por linha (220 a 260 ms). Nunca letra a letra em frase longa.
- **Dados:** Space Grotesk, rolando como contador.
- **App:** Inter, sempre a partir dos estados do Figma.
- **Tamanho e leitura real (V9.2):**
  - informação essencial (números, frase, CTA) com 100 px ou mais em 1080 (33 px em 360);
  - legendas com 34 px ou mais (11 px em 360), sempre com 0,6 s de leitura parada;
  - texto de interface dentro do celular é ambiente: se a história depende dele, ele sai do celular ampliado (cartões, notificação a 0,90);
  - prova: OCR a 360 x 450 nos quadros de leitura (`v9/qa/qa_previas.py`).

## 6. Bloqueio de aprovação (fidelidade)
- **A frase do SOS na voz** ("tem um SOS que avisa quem você escolher") afirma um comportamento que ainda não foi confirmado.
  - **Até o Filipy confirmar,** a frase fica bloqueada.
  - **Se ele não confirmar,** só essa frase é gerada de novo com a mesma voz. Opção: "O Kivow Cuida deixa um SOS sempre à mão, com as pessoas que você escolher." A palavra final é do Filipy.
  - **Na tela vale a CUI_08,** que mostra o gesto sem afirmar envio.
- **Selos das lojas:** só entram com a distribuição confirmada.

## 7. Construção no Remotion (determinística por quadro)
- **Uma composição por bloco** (B1 a B12), montada numa composição mestre com os tempos do cue sheet (`src/v9/tempos.ts`).
- **Componentes separados e reutilizáveis:**
  - interface: `Celular`, `Tela`, `CartaoTreino`, `CartaoTrecho`, `Ranking`, `FolhaCuida`, `CartaoAtleta`, `Notificacao`, `StickerMeuTreino`, `MapaRotas`;
  - motion e câmera: `LinhaK`, `PortalK`, `Camera2D5`, `Mergulho`.
- **Peças:**
  - camadas exportadas do Figma a 4x (as peças de interface são vetoriais);
  - fotos em resolução original;
  - mapas de profundidade gerados na nuvem.
- **Nada de feed como imagem única com translateY.** O conteúdo de cada tela é composto pelas camadas dos estados.
- **Prévias de verificação:** 1080 x 1350 e 360 x 450. Se algo importante ficar ilegível a 360, a cena volta.
- **Versão para Reels em 1080 x 1920:** composição própria, depois da aprovação.
