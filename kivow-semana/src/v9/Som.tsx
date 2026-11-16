// Kivow v9.2 · som. Cinco grupos (VO, MU, AM, UI, IM). Volume é automação por quadro; o "filtro" da música é
// cruzamento entre a faixa cheia e as versões filtradas, alinhadas amostra a amostra (geradas na nuvem).
// Loudness final NÃO é decidida aqui: o mp4 exportado é medido (EBU R128) e masterizado a −14 LUFS / −1 dBTP.
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import palavras from "../voz_palavras.json";
import { C, ENTRADA, FPS, P, S, TOTAL_Q, VOZ, compasso, naVozFilme, noFilme } from "./tempos";
import { E, cl, mix } from "./mov";

const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
// voz ativa (ataque 80 ms, liberação 300 ms) a partir das palavras medidas
const ATIVA = (() => {
  const a = new Float32Array(TOTAL_Q + 1);
  for (const w of palavras as { a: number; b: number }[]) {
    if (w.a < 0) continue;
    const i0 = Math.floor((naVozFilme(w.a) - 0.08) * FPS), i1 = Math.ceil((naVozFilme(w.b) + 0.3) * FPS);
    for (let i = Math.max(0, i0); i <= Math.min(TOTAL_Q, i1); i++) a[i] = 1;
  }
  const s = new Float32Array(TOTAL_Q + 1); // suaviza (≈ 80 ms de subida, 300 ms de descida)
  for (let i = 1; i <= TOTAL_Q; i++) s[i] = a[i] > s[i - 1] ? Math.min(1, s[i - 1] + 1 / 5) : Math.max(0, s[i - 1] - 1 / 18);
  return s;
})();

/** ganho de cada versão da faixa no tempo absoluto t */
const musica = (t: number) => {
  const base = mix(0.372, 0.15, ATIVA[Math.min(TOTAL_Q, Math.max(0, Math.round(t * FPS)))]); // −18 sem voz, −24 sob a voz (faixa medida a −9,4 LUFS)
  let lp2500 = 0, lp900 = 0;
  // 15,41 a 21,22: a faixa recua (passa-baixa 2,5 kHz) durante a notificação e ABRE no compasso 9, junto do toque: o drop é nosso
  lp2500 = Math.max(lp2500, lin(t, 15.41, 15.9) * (1 - lin(t, compasso(9) - 0.02, compasso(9) + 0.02)));
  // (régua do filme = roteiro + S) a faixa vai ficando distante; no SOS, abafada (900 Hz, −8 dB); abre na batida
  lp2500 = Math.max(lp2500, lin(t, 30.9 + S, 32.0 + S) * (1 - lin(t, 33.6 + S, 33.75 + S)) * (1 - lin(t, C.sosFim + S, C.sosFim + S + 0.05)));
  lp900 = lin(t, 33.6 + S, 33.75 + S) * (1 - lin(t, C.sosFim + S, C.sosFim + S + 0.05));
  const cheia = 1 - Math.max(lp2500, lp900);
  let g = base * (lp900 > 0 ? mix(1, 0.4, lp900) : 1);
  if (t >= C.suspensao + S && t < C.impacto12 + S) g *= 0.25; // suspensão de 0,121 s (−12 dB) antes do "12 s"
  if (t >= C.kAcende + S) g *= mix(1, 0.5, lin(t, C.kAcende + S, C.kAcende + S + 0.3)) * (1 - E.ioC(lin(t, compasso(23), compasso(25))));
  return { cheia: g * cheia, lp2500: g * lp2500 * (lp900 > 0 ? 0 : 1), lp900: g * lp900 };
};

type Cue = [number, string, number, number?]; // tempo (s), arquivo, volume, duração do fade de saída (s)
const tiques = (t0: number, n: number, v = 0.22): Cue[] => Array.from({ length: n }, (_, k) => [t0 + k * 0.06, "tique", v]);
const R = noFilme; // sons escritos na régua do roteiro e levados para o filme
const CUES: Cue[] = [
  // P1 (antes do respiro: mesma régua)
  [0, "am_pista", 0.35], [P.sozinho, "k_toque", 0.85], [1.6, "traco", 0.55], [3.4, "portal_succao", 0.8], [C.portal, "portal_impacto", 0.95],
  ...tiques(3.96, 5), [4.3, "deslize_vidro", 0.6], [C.assenta, "placa", 0.45], [6.0, "pop_descolar", 0.6],
  [P.distancia, "dado_1", 0.7], [P.tempo, "dado_2", 0.7], [P.ritmo, "dado_3", 0.7], [8.18, "encaixe", 0.6],
  // B4 a B6: região, conversa, companhia
  ...[0, 1, 2, 3].map((k): Cue => [P.outros + 0.09 * k, "ao_vivo", 0.35]), [9.0, "deslize_lateral", 0.45],
  ...[0, 1, 2, 3].map((k): Cue => [9.8 + 0.09 * k, "tique", 0.3]), [P.veem, "toque", 0.45], [P.veem + 0.1, "tique", 0.3], [P.fez, "toque", 0.6],
  [P.comentam, "mensagem_1", 0.6], [P.interagem, "toque", 0.6], [P.combinam, "mensagem_2", 0.6], [14.1, "tique", 0.3], [P.comVoce, "mensagem_3", 0.6],
  [P.oTreino, "conexao", 0.7], [3.8 + 28 * 0.4838725774422903, "brilho_dono", 0.3], [18.45 - 0.75, "mergulho", 0.75],
  // P2 com o respiro (régua do filme)
  [18.45, "am_dupla", 0.3], ...tiques(18.56, 6), [19.05, "deslize_vidro", 0.55], [20.14, "notificacao", 0.75],
  [R(C.toque), "toque", 0.8], [R(P.diego), "deslize_lateral", 0.6], [R(P.diego + 0.32), "brilho_dono", 0.35], [R(P.melhor), "pop_descolar", 0.6],
  [R(P.tempo2), "bumbo_ref", 0.8], [R(P.dono), "brilho_dono", 0.5], [R(P.agora), "tique", 0.5], [R(C.perseguicao), "perseguicao", 0.75],
  [R(C.impacto12), "impacto_12s", 1.0], [R(24.93), "encaixe", 0.5], [R(C.mergulhoOrla - 0.75), "mergulho", 0.8],
  [R(C.mergulhoOrla), "am_orla", 0.35], ...tiques(R(25.7), 6), [R(26.3), "placa", 0.5], [R(26.3 + 0.2419), "placa", 0.45], [R(26.3 + 0.4839), "placa", 0.4], [R(26.3 + 0.7258), "placa", 0.38],
  [R(P.recomeca), "brilho_dono", 0.4], ...[0, 1, 2].map((k): Cue => [R(28.3 + 0.121 * k), `sos_sinal_${k + 1}`, 0.35]),
  // P3
  [R(29.8), "varrida_filtro", 0.7], [R(30.3), "am_parque", 0.35], [R(32.3), "deslize_vidro", 0.55], [R(32.4), "ao_vivo", 0.3], [R(33.2), "ao_vivo", 0.3],
  [R(P.oKivowCuida), "folha_sobe", 0.6], [R(C.sosIni), "sos_pulso", 0.4], [R(C.sosIni + 1), "sos_sinal_1", 0.6], [R(C.sosIni + 2), "sos_sinal_2", 0.6],
  [R(C.sosFim), "sos_sinal_3", 0.6], [R(P.quem), "contato_tique", 0.5], [R(C.sosFim), "sos_alivio", 0.55], [R(37.0), "folha_desce", 0.5],
  // B10: descoberta
  [R(37.4), "pop_descolar", 0.55], [R(P.andre), "dado_1", 0.5], [R(P.caio), "toque", 0.6], [R(P.caio + 0.05), "dado_3", 0.5],
  [R(P.acharam - 0.5), "conexao", 0.6], [R(41.0), "encaixe", 0.5], [R(P.pelo), "tique", 0.35],
  // P4
  [R(C.mergulhoDupla - 0.75), "mergulho_abertura", 0.8], [R(43.0), "am_dupla", 0.3], ...tiques(R(43.13), 8, 0.2), [R(P.sozinha), "k_toque_resolvido", 0.85],
  [R(45.3), "rota_pista", 0.6], [R(45.421), "rota_orla", 0.6], [R(45.542), "rota_parque", 0.6], [R(45.663), "rota_estadio", 0.55],
  [R(C.kAcende), "assinatura_kivow", 0.9], ...[0, 1, 2, 3, 4].map((k): Cue => [R(46.8 + k * 0.121), `alfabeto_${k + 1}`, 0.4]),
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
        <Audio src={staticFile(`v9/sfx/${arq}.wav`)} volume={AMBIENTES.has(arq) ? (fr) => v * 0.5 * cl(fr / 30) * (1 - cl((fr - 240) / 60)) * mix(1, 0.55, ATIVA[Math.min(TOTAL_Q, Math.round(t * FPS) + fr)]) : v} />
      </Sequence>
    ))}
  </>
);
