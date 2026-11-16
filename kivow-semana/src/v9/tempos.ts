// Kivow · Semana nova · v9.2 · tempos. Fonte única de verdade para imagem e som (docs/v9/CUE_SHEET.md).
// A grade sai da MEDIÇÃO da trilha (v9/insumos/medidas/grade.json), calculada por tempo absoluto:
// batida n = ENTRADA + n * PERIODO, e só no fim vira quadro (arredondado uma vez, sem erro acumulado).
import grade from "../../v9/insumos/medidas/grade.json";

export const FPS = 60;
export const W = 1080;
export const H = 1350;
export const PERIODO = grade.periodo_s; // 0,48387 s = 124,0 BPM medido (não 125)
export const ENTRADA = 3.8; // batida 0 do filme: a faixa entra cheia no compasso medido (arquivo 14,7744 s)
export const batida = (n: number) => ENTRADA + n * PERIODO;
export const compasso = (k: number) => batida(4 * k);
// Respiro de UM compasso inserido no silêncio antes de "Na orla" (pedido: a notificação precisa ser lida).
// Como o respiro é exatamente um compasso (116 q ≈ 1,9355 s), tudo o que vem depois continua na mesma relação com a batida.
export const RESPIRO_Q = 116;
export const S = RESPIRO_Q / FPS; // 1,9333 s
export const DURACAO = compasso(25); // 52,187 s
export const TOTAL_Q = Math.round(DURACAO * FPS); // 3131
/** quadro do filme -> quadro do ROTEIRO (a coreografia escrita antes do respiro). Antes de 21,40 s o filme e o roteiro coincidem. */
export const noRoteiro = (f: number) => (f >= 1284 ? f - RESPIRO_Q : f);
/** tempo do roteiro -> tempo do filme (para os sons depois do respiro) */
export const noFilme = (t: number) => (t >= 18.6 ? t + S : t);
export const q = (t: number) => Math.round(t * FPS);

// Voz aprovada em 5 trechos (cortes medidos em silêncio: 37,40 s a −64,6 dB, 39,53 s a −42,7 dB, 40,90 s em silêncio digital).
// Cada trecho entra num quadro inteiro; o deslocamento exato decorre disso.
// ROTEIRO: posição dos trechos na coreografia (a imagem foi escrita nesta régua)
const VOZ_ROTEIRO = [
  { de: 0, q: 0 }, { de: 37.4, q: 2292 }, { de: 39.53, q: 2492 }, { de: 40.9, q: 2574 }, { de: 43.54, q: 2782 },
];
export const naVoz = (t: number) => {
  const s = [...VOZ_ROTEIRO].reverse().find((v) => t >= v.de) ?? VOZ_ROTEIRO[0];
  return s.q / FPS + (t - s.de);
};
// FILME: os trechos de áudio de verdade (o trecho A foi cortado em 18,60 s, no silêncio entre "companhia." e "Na orla")
export const VOZ = [
  { arq: "voz_A1", de: 0, ate: 18.6, q: 0 },
  { arq: "voz_A2", de: 18.6, ate: 37.4, q: 1116 + RESPIRO_Q }, // +1,9333 s
  { arq: "voz_B", de: 37.4, ate: 39.53, q: 2292 + RESPIRO_Q }, // +2,7333 s
  { arq: "voz_C", de: 39.53, ate: 40.9, q: 2492 + RESPIRO_Q }, // +3,9367 s
  { arq: "voz_D1", de: 40.9, ate: 43.54, q: 2574 + RESPIRO_Q }, // +3,9333 s
  { arq: "voz_D2", de: 43.54, ate: 45.1, q: 2782 + RESPIRO_Q }, // +4,76 s: "Baixe o Kivow" depois do K acender
] as const;
export const naVozFilme = (t: number) => {
  const s = [...VOZ].reverse().find((v) => t >= v.de) ?? VOZ[0];
  return s.q / FPS + (t - s.de);
};

// Palavras usadas como gatilho (origem medida no voz_palavras.json pelo ElevenLabs STT)
export const P = {
  ja: naVoz(0.18), sozinho: naVoz(1.06), treino1: naVoz(3.28), noKivow: naVoz(3.88), kivow1: naVoz(4.08), post: naVoz(5.72),
  distancia: naVoz(6.24), tempo: naVoz(6.94), ritmo: naVoz(7.32),
  naOrla: naVoz(19.02), diego: naVoz(19.64), melhor: naVoz(20.24), tempo2: naVoz(20.74), dono: naVoz(21.56),
  agora: naVoz(22.92), trecho: naVoz(23.36), eTodoMes: naVoz(25.8), disputa: naVoz(26.6), recomeca: naVoz(27.06),
  noMeio: naVoz(32.06), oKivowCuida: naVoz(33.36), sos: naVoz(34.6), quem: naVoz(35.76), escolherFim: naVoz(36.6),
  foi: naVoz(37.52), andre: naVoz(38.06), caio: naVoz(38.5), acharam: naVoz(38.92), oTreino: naVoz(16.14), vira: naVoz(17.38),
  outros: naVoz(8.32), veem: naVoz(9.9), fez: naVoz(10.64), comentam: naVoz(12.32), interagem: naVoz(13.1), combinam: naVoz(13.82), comVoce: naVoz(15.22),
  pelo: naVoz(39.72), feedFim: naVoz(40.32), sua: naVoz(41.2), naoPrecisa: naVoz(42.22), sozinha: naVoz(42.96),
  baixe: naVoz(43.68), kivowFim: naVoz(44.4),
};

// Momentos de cena (s). Os que caem na grade estão escritos como batida/compasso.
// Momentos de cena na régua do ROTEIRO (no filme, o que vem depois de 18,60 s soma S)
export const C = {
  portal: batida(0), // 3,80 impacto
  assenta: compasso(1), // 5,7355 o celular assenta ("post" 5,72)
  notif: compasso(8), // 19,2839 a notificação pousa na virada de frase (+1 dB medido) e a faixa abre
  toque: batida(32.5), // 19,526 toque (colcheia)
  perseguicao: compasso(10), // 23,1548 três semicolcheias
  suspensao: batida(40.75), // 23,5177 corte de 0,121 s
  impacto12: batida(41), // 23,6388 "12 s"
  mergulhoOrla: batida(45), // 25,5742 o mergulho termina dentro da orla
  sosIni: (2202 - 180) / FPS, // 33,700 s, quadro 2022
  sosFim: 2202 / FPS, // 36,700 s, quadro 2202 = compasso 17 (36,7032 s) arredondado
  mergulhoDupla: batida(81), // 42,9935
  kAcende: compasso(22), // 46,3806
  fimMusica: compasso(24), // 50,2516
};
