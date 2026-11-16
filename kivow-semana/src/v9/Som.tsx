// Kivow v9.2 · som. Cinco grupos (VO, MU, AM, UI, IM). Volume é automação por quadro; o "filtro" da música é
// cruzamento entre a faixa cheia e as versões filtradas, alinhadas amostra a amostra (geradas na nuvem).
// Loudness final NÃO é decidida aqui: o mp4 exportado é medido (EBU R128) e masterizado a −14 LUFS / −1 dBTP.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import palavras from "../voz_palavras.json";
import { C, ENTRADA, FPS, P, TOTAL_Q, VOZ, naVoz } from "./tempos";
import { E, cl, mix } from "./mov";

const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
// voz ativa (ataque 80 ms, liberação 300 ms) a partir das palavras medidas
const ATIVA = (() => {
  const a = new Float32Array(TOTAL_Q + 1);
  for (const w of palavras as { a: number; b: number }[]) {
    if (w.a < 0) continue;
    const i0 = Math.floor((naVoz(w.a) - 0.08) * FPS), i1 = Math.ceil((naVoz(w.b) + 0.3) * FPS);
    for (let i = Math.max(0, i0); i <= Math.min(TOTAL_Q, i1); i++) a[i] = 1;
  }
  const s = new Float32Array(TOTAL_Q + 1); // suaviza (≈ 80 ms de subida, 300 ms de descida)
  for (let i = 1; i <= TOTAL_Q; i++) s[i] = a[i] > s[i - 1] ? Math.min(1, s[i - 1] + 1 / 5) : Math.max(0, s[i - 1] - 1 / 18);
  return s;
})();

/** ganho de cada versão da faixa no tempo absoluto t */
const musica = (t: number) => {
  const base = mix(0.372, 0.186, ATIVA[Math.min(TOTAL_Q, Math.max(0, Math.round(t * FPS)))]); // −18 sem voz, −24 sob a voz (faixa medida a −9,4 LUFS)
  let lp2500 = 0, lp900 = 0;
  // 15,41 a 19,28: a faixa recua (passa-baixa 2,5 kHz) e ABRE na virada de frase com a notificação: o drop é nosso, medido
  lp2500 = Math.max(lp2500, lin(t, 15.41, 15.9) * (1 - lin(t, C.notif - 0.02, C.notif + 0.02)));
  // 30,90 a 33,70: a faixa vai ficando distante; 33,70 a 36,70: abafada (900 Hz, −8 dB); abre na batida 36,70
  lp2500 = Math.max(lp2500, lin(t, 30.9, 32.0) * (1 - lin(t, 33.6, 33.75)) * (1 - lin(t, C.sosFim, C.sosFim + 0.05)));
  lp900 = lin(t, 33.6, 33.75) * (1 - lin(t, C.sosFim, C.sosFim + 0.05));
  const cheia = 1 - Math.max(lp2500, lp900);
  let g = base * (lp900 > 0 ? mix(1, 0.4, lp900) : 1);
  if (t >= C.suspensao && t < C.impacto12) g *= 0.25; // suspensão de 0,121 s (−12 dB) antes do "12 s"
  if (t >= C.kAcende) g *= mix(1, 0.5, lin(t, C.kAcende, C.kAcende + 0.3)) * (1 - E.ioC(lin(t, 48.32, C.fimMusica)));
  return { cheia: g * cheia, lp2500: g * lp2500 * (lp900 > 0 ? 0 : 1), lp900: g * lp900 };
};

type Cue = [number, string, number, number?]; // tempo (s), arquivo, volume, duração do fade de saída (s)
const tiques = (t0: number, n: number, v = 0.22): Cue[] => Array.from({ length: n }, (_, k) => [t0 + k * 0.06, "tique", v]);
const CUES: Cue[] = [
  // P1
  [0, "am_pista", 0.35], [P.sozinho, "k_toque", 0.85], [1.6, "traco", 0.55], [3.4, "portal_succao", 0.8], [C.portal, "portal_impacto", 0.95],
  ...tiques(3.96, 5), [4.3, "deslize_vidro", 0.6], [C.assenta, "placa", 0.45], [6.0, "pop_descolar", 0.6],
  [P.distancia, "dado_1", 0.7], [P.tempo, "dado_2", 0.7], [P.ritmo, "dado_3", 0.7], [8.18, "encaixe", 0.6],
  // P2
  [18.3, "am_dupla", 0.3], [18.75, "deslize_vidro", 0.55], [19.17, "notificacao", 0.7], [C.toque, "toque", 0.8], [P.diego, "deslize_lateral", 0.6],
  [P.diego + 0.32, "brilho_dono", 0.35], [P.melhor, "pop_descolar", 0.6], [P.tempo2, "bumbo_ref", 0.8], [P.dono, "brilho_dono", 0.5], [P.agora, "tique", 0.5],
  [C.perseguicao, "perseguicao", 0.75], [C.impacto12, "impacto_12s", 1.0], [24.93, "encaixe", 0.5], [C.mergulhoOrla - 0.75, "mergulho", 0.8],
  [C.mergulhoOrla, "am_orla", 0.35], ...tiques(25.7, 6), [26.3, "placa", 0.5], [26.3 + 0.2419, "placa", 0.45], [26.3 + 0.4839, "placa", 0.4],
  // P3
  [29.8, "varrida_filtro", 0.7], [30.3, "am_parque", 0.35], [32.3, "deslize_vidro", 0.55], [32.4, "ao_vivo", 0.3], [33.2, "ao_vivo", 0.3],
  [P.oKivowCuida, "folha_sobe", 0.6], [C.sosIni, "sos_pulso", 0.55], [C.sosIni + 1, "sos_sinal_1", 0.6], [C.sosIni + 2, "sos_sinal_2", 0.6],
  [C.sosFim, "sos_sinal_3", 0.6], [P.quem, "contato_tique", 0.5], [C.sosFim, "sos_alivio", 0.55], [37.0, "folha_desce", 0.5],
  // P4
  [C.mergulhoDupla - 0.75, "mergulho_abertura", 0.8], [43.0, "am_dupla", 0.3], ...tiques(43.13, 8, 0.2), [P.sozinha, "k_toque_resolvido", 0.85],
  [45.3, "rota_pista", 0.6], [45.421, "rota_orla", 0.6], [45.542, "rota_parque", 0.6], [45.663, "rota_estadio", 0.55],
  [C.kAcende, "assinatura_kivow", 0.9], ...[0, 1, 2, 3, 4].map((k): Cue => [46.8 + k * 0.121, `alfabeto_${k + 1}`, 0.4]),
];
const AMBIENTES = new Set(["am_pista", "am_orla", "am_parque", "am_dupla"]);

export const Som: React.FC = () => (
  <>
    {VOZ.map((v) => (
      <Sequence key={v.arq} from={v.q} layout="none">
        <Audio src={staticFile(`v9/sfx/${v.arq}.wav`)} />
      </Sequence>
    ))}
    {(["cheia", "lp2500", "lp900"] as const).map((k) => (
      <Sequence key={k} from={Math.round(ENTRADA * FPS)} layout="none">
        <Audio src={staticFile(`v9/sfx/${k === "cheia" ? "trilha" : `trilha_${k}`}.wav`)} volume={(fr) => musica(ENTRADA + fr / FPS)[k]} />
      </Sequence>
    ))}
    {CUES.map(([t, arq, v], i) => (
      <Sequence key={i} from={Math.round(t * FPS)} layout="none">
        <Audio src={staticFile(`v9/sfx/${arq}.wav`)} volume={AMBIENTES.has(arq) ? (fr) => v * cl(fr / 30) * (1 - cl((fr - 240) / 60)) : v} />
      </Sequence>
    ))}
  </>
);
