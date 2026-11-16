# Kivow · "Sua próxima corrida não precisa ser sozinha" · superprompt v8

Regra que manda em tudo: **o celular é o protagonista e a voz é o roteiro da câmera.** Cada coisa que a voz diz, o celular
mostra acontecendo no feed, com um gesto de câmera (aproxima, desliza, toca) e um estado do app que muda. Nada aparece por
corte seco; tudo nasce de algo que já estava na tela. Sem tela parada: o feed sempre respira (rolagem residual de 2 a 6 px/q).

Fontes: feed real do Figma (03 · Feed, 421:90 e 510:319). Peças reaproveitadas, não inventadas: thread de comentário com o
Pique (Bruno), respostas rápidas (Marina), "Atletas perto de você" (André Lima, 2 km), cartão de trecho "−33 s no recorde",
post do ranking de corrida (Filipy), selo Dono/Dona do Trecho, Kivow Cuida, mapa de treino (Felipe). Fotos só reais.

Voz: narracao_grok.mp3 (45,1 s, contínua). Trilha: Mixkit 623, nasce em "No Kivow" (3,8 s), drop no corte para a orla.

## Linha do tempo (s) · cada linha da voz vira um gesto

| t | voz | câmera | estado do app |
|---|---|---|---|
| 0,0-3,7 | "Já saiu pra correr sozinho...?" | tela preta, palavra a palavra | (feito na v7) |
| 3,7-4,5 | (respiro) | a pista abre | o corredor real na pista |
| 3,9-6,0 | "No Kivow, cada corrida vira um post" | o celular entra **com o feed rolando** e desacelera até parar no post do Rafael; enquanto chega, cresce até tomar a tela | feed rolando (inércia de rolagem: v0 2.400 px/s, freio exponencial τ 0,35 s) |
| 6,0-8,6 | "com distância, tempo e ritmo" | câmera aproxima o painel do post (1,0 -> 1,55x) | cada métrica acende em volt no instante da palavra (painel agora com **Ritmo 5:12 /km** no lugar de Ganho) |
| 8,6-11,0 | "e outros corredores da sua região veem o que você fez" | câmera recua e desliza para baixo da foto | coração vira volt, contador 17 -> 18 -> 24 rolando; aparece "Curtido por Camila, Bruno e mais 22" com 3 avatares reais |
| 12,3-13,2 | "Eles comentam" | desliza para a área de comentários | comentário do Bruno sobe: "Que ritmo, Rafa." |
| 13,2-14,0 | "interagem" | toque numa resposta rápida | chip "Bora pra próxima!" afunda e vai para a conversa |
| 14,0-15,7 | "e combinam a próxima corrida com você" | aproxima o cartão | cartão "Corrida combinada · amanhã 6:00 · Estrada" com "3 confirmados"; botão Confirmar é tocado (ripple volt), vira "Confirmado" e o 4º avatar entra |
| 16,1-18,2 | "O treino solitário vira companhia" | recua até ver o feed inteiro e rola | o feed rola para "Atletas perto de você" (cartões deslizam lateralmente) e segue rolando |
| 18,6-19,6 | "Na orla..." | o celular segue rolando | **notificação cai no topo**: "Diego Matos tomou o trecho da orla" (idea 2); toque nela |
| 19,6-22,5 | "o Diego fez o melhor tempo e virou o dono do trecho" | o feed salta para o post do Diego; aproxima o selo | selo "Dono do Trecho · Orla" com brilho que passa |
| 22,9-25,0 | "Agora o trecho pode ser seu" | aproxima o cartão do trecho | cartão do trecho (molde da Marina): "Trecho da Orla 39:44 · Você está a 12 s"; botão "Desafiar" é tocado |
| 25,0-25,8 | (drop da trilha) | **mergulho na foto do Diego**; a foto vira a orla em tela cheia | corte invisível (foto casada ao pixel) |
| 25,8-30,0 | "E todo mês a disputa recomeça..." | orla em tela cheia, deriva lenta | cartão de vidro sobe: "Ranking de corrida · novembro · zera em 15 dias" com o pódio e "Você · 4º" subindo para 3º |
| 30,0-30,8 | (respiro) | o celular volta, entra pela direita | feed no post do Lucas |
| 30,8-33,0 | "E se acontecer alguma coisa no meio do treino?" | aproxima a foto do Lucas correndo sozinho | selo "Kivow Cuida · ligado" pulsa |
| 33,3-36,6 | "O Kivow Cuida tem um SOS que avisa quem você escolher" | o celular toma a tela | folha do Kivow Cuida sobe: botão SOS (segurar 3 s, anel vermelho enchendo) e "Avisar: Ana (esposa), Pedro (irmão)" com os dois se marcando |
| 37,5-38,8 | "Foi assim que o André e o Caio se acharam" | a folha desce, o feed rola até "Atletas perto de você" | cartão do André (2 km de você) é tocado em "Seguir" -> "Seguindo" |
| 38,8-40,3 | "pelo feed" | o feed rola até o post em conjunto | post "André Lima e Caio Reis · correram juntos" (selo 2 marcados) |
| 40,3-41,2 | (respiro) | mergulho na foto da dupla | corte invisível |
| 41,2-44,4 | "Sua próxima corrida não precisa ser sozinha. Baixe o Kivow." | a dupla em tela cheia | frase entra linha a linha por máscara |
| 44,4-46,8 | (trilha sobe) | **fecho com o mapa** (idea 3): recua para um mapa da cidade com os 4 traços dos treinos (pista, estrada, orla, parque) acendendo em volt e convergindo no ponto da dupla | logo Kivow + botões das lojas |

## Física
- Rolagem do feed: inércia real (freio exponencial τ 0,35 s), nunca linear; ao parar, assenta com 6 px de sobra e volta (mola ζ 0,8, ω 14).
- Aproximar/deslizar dentro do celular: escala e posição juntos por Hermite com velocidade contínua; nada começa nem para seco.
- Toque: ponto volt aparece, o elemento afunda 3% em 6 q e volta com mola (ζ 0,6, ω 18); ripple expande 0 -> 1,6x em 18 q.
- Notificação: cai do topo com mola (ζ 0,75, ω 12), sombra suave; sai subindo quando tocada.
- Números que mudam: rolam como contador (cada dígito desliza na vertical, 14 q).
- Mergulho na foto: igual ao validado na v5 (desvio no corte < 1 px).

## Critérios de aceite (medidos antes de mandar)
1. Cada estado do app aparece no máximo 0,15 s depois da palavra que o nomeia (tempos da transcrição).
2. Nenhum salto: deslocamento entre quadros consecutivos sem pico isolado (medidor da v5) em todo o filme.
3. Texto legível: todo texto em tela por pelo menos 0,9 s com altura de x >= 18 px.
4. Folha de contato do filme inteiro lida antes de mandar; nada cortado nem sobreposto.

## Ordem de produção
1. Figma: "Feed do vídeo" (tira contínua 390 de largura com os posts na ordem do roteiro) + cada estado como camada própria
   (curtida, comentário, chip tocado, cartão combinado, notificação, cartão de trecho, ranking de vidro, folha SOS, Seguir, mapa final).
   Quadros-chave de cada linha da tabela, para aprovação.
2. Export por camada, motion no Remotion, render na nuvem, medição e entrega em Downloads.
