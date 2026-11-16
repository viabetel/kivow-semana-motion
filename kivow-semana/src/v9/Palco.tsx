// Kivow v9.2 · PALCO: a composição mestre. Camada persistente: cada elemento existe UMA vez e é calculado em
// coordenadas globais a partir do quadro. Não há Sequence montando/desmontando imagem; blocos são só intervalos de tempo.
// Elemento compartilhado = a mesma geometria calculada pela mesma função nos dois donos (tela do celular e palco),
// com troca de dono em um quadro em que as duas geometrias são idênticas (QA mede o erro: 0 px).
import React from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, P } from "./tempos";
import { Cel, E, Ret, cl, doFigma, mergulho, mix, mixCel, mixRet, mola, naTela, prog, trilha, zoomRet } from "./mov";
import { ABS, COR, CartaoTreino, Celular, Foto, FotoNaCaixa, INTER, Linha, Peca, SOFIA, Sombra, Sticker, SvgFigma, Toque } from "./Pecas";
import { Som } from "./Som";

// ---------- geometrias do Figma (medidas nos estados; ver docs/v9/AUDIOVISUAL_DIRECTION.md) ----------
const G = {
  pista: { x: 0, y: 0, w: 1080, h: 1350 },
  juntos: { x: -660, y: 0, w: 2400, h: 1350 },
  orla: { x: -578.1, y: -150.2, w: 2248.6, h: 1496.7 },
  parque: { x: -861, y: -114, w: 2220, h: 1480 },
  dupla: { x: -453.4, y: 4.1, w: 2018.8, h: 1345.7 },
};
const CEL = {
  post: doFigma(-384, -480, 1849), // POST_04, DES_03, DESC_05 (s 0,95)
  met: doFigma(-355, -435, 1790), // MET (0,92)
  des2: doFigma(-336, -156, 1751), // DES_02 (0,90)
  cui3: doFigma(-44, -53, 1168), // CUI_03 (0,60)
  cui: doFigma(-287, -393, 1654), // CUI_04 a 08 (0,85)
};
// mergulhos casados: a foto do post em escala Z = foto em tela cheia (Z medido 1,6413; casamento 0,995 a 0,999)
const Z = 2248.6 / 1370;
const SLOT_DIEGO = { x: 47.5, y: 565.5, w: 877.5, h: 822.5 }; // tela
const FOTO_DIEGO = { x: 47.5 - 242.5, y: 565.5 - 91.5, w: 1370, h: 911.9 };
const SLOT_DUO = { x: 47.5, y: 555.5, w: 877.5, h: 822.5 };
const FOTO_DUO = { x: 47.5 - 166.5, y: 555.5 + 2.5, w: 1230, h: 819.9 };
const alvo = (foto: Ret, tela: Ret): Cel => { const s = tela.w / foto.w; return { s, ox: tela.x - s * foto.x, oy: tela.y - s * foto.y }; };
const MERG_ORLA = alvo(FOTO_DIEGO, G.orla);
const MERG_DUPLA = alvo(FOTO_DUO, G.dupla);
// cartão do treino dentro do post do Marcos (tela) e fora (palco)
const CARTAO_TELA = { x: 187.5, y: 528 + 695, w: 720, h: 310 };
const SLOT_MARCOS = { x: 167.5, y: 840.5, w: 760, h: 712.5 };
const FOTO_MARCOS = { x: -60.5, y: -161.5, w: 880, h: 1100 };
// cartão do trecho dentro do post do Diego (tela) e fora
const TRECHO_TELA = { x: 61, y: 243 + 742, w: 850, h: 395 };
const TRECHO_FORA = { x: 88, y: 640, w: 904, h: 420 };

const t_ = (f: number) => f / FPS;
const cheia = (nome: string, z: number, op = 1, prof = 0) => <Foto nome={nome} r={zoomRet((G as Record<string, Ret>)[nome], z)} op={op} prof={prof} />;

// ---------- celular ao longo do filme (uma função, um dono) ----------
const sobe = (f: number, t0: number, de: { s: number; cy: number }, para: Cel, w = 4.6) => {
  const u = mola(f, t0, 0.82, w);
  const s = de.s * Math.pow(para.s / de.s, u);
  const cyF = para.oy + 1060 * para.s, cxF = para.ox + 490 * para.s;
  const yp = u <= 1 ? 1 - Math.pow(1 - u, 1.84) : 1 + Math.pow(u - 1, 1.84);
  const cy = mix(de.cy, cyF, yp);
  return { c: { s, ox: cxF - 490 * s, oy: cy - 1060 * s }, tilt: 6 * (1 - cl(u)) };
};
const celularB2 = (f: number) => sobe(f, 4.3, { s: 0.3, cy: 1668 }, CEL.post);
const celularB3 = (f: number) => {
  const t = t_(f);
  if (t < 6) return celularB2(f).c;
  return mixCel(CEL.post, CEL.met, E.ioC(prog(f, 6, 6.4)));
};

// =====================================================================================
export const Palco: React.FC = () => {
  const f = useCurrentFrame();
  usePreload();
  const t = t_(f);
  return (
    <AbsoluteFill style={{ background: COR.tinta, overflow: "hidden" }}>
      {t < 8.6 && <P1 f={f} />}
      {t >= 18.3 && t < 27.4 && <P2 f={f} />}
      {t >= 29.5 && t < 37.8 && <P3 f={f} />}
      {t >= 41.9 && <P4 f={f} />}
      <Som />
    </AbsoluteFill>
  );
};

// ===================== P1 · gancho, portal, post, dados (0 a 8,6 s) =====================
const PERGUNTA: [string, number][][] = [
  [["JÁ", 0.18], ["SAIU", 0.36], ["PRA", 0.62], ["CORRER", 0.78]],
  [["SOZINHO", 1.06], ["PORQUE", 1.62], ["NÃO", 1.88]],
  [["TINHA", 2.04], ["NINGUÉM", 2.22], ["PRA", 2.68]],
  [["COMBINAR", 2.84], ["UM", 3.18], ["TREINO?", 3.28]],
];
const P1: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  // portal: o quadrado de partida (66, 628 na pergunta; sobe 200 px com ela) cresce em mola e a câmera atravessa
  const subida = 200 * E.ioC(prog(f, 3.4, 3.64));
  const quad0 = { x: 66, y: 628 - subida, w: 22, h: 22 };
  const jan = { x: 280, y: 370, w: 520, h: 520 };
  const m = mola(f, 3.4, 0.8, 18);
  let janela = mixRet(quad0, jan, m);
  if (t > 3.64) {
    const a = E.iExp(prog(f, 3.64, 3.8));
    janela = mixRet(jan, { x: -260, y: -220, w: 1600, h: 1790 }, a);
  }
  const zPista = t < 3.8 ? 1.25 : trilha(f, [[3.8, 1.25], [4.0, 1.0204, E.oExp], [4.5, 1.03, E.ioC], [5.9, 1.05, E.ioC], [8.6, 1.058, E.lin]]);
  const prof = 7 * prog(f, 4.0, 6.0);
  const passou = t >= 3.8;
  // pergunta: escala 1,00 a 1,03 (0,8%/s; a borda anda 3,8 px/s), sobe e escurece abrindo o portal; na travessia passa pela câmera
  const zTxt = mix(1, 1.03, prog(f, 0, 3.64)) * (1 + 0.9 * E.iExp(prog(f, 3.64, 3.8)));
  const opTxt = (1 - 0.6 * prog(f, 3.4, 3.64)) * (1 - prog(f, 3.66, 3.8));
  const blur = 8 * prog(f, 3.66, 3.8);
  const linhaK = E.ioC(prog(f, 1.6, 2.6));
  const ass = prog(f, 0, 0.5) * (1 - prog(f, 3.5, 3.7));
  // celular e cartão
  const cel = celularB3(f);
  const tilt = t < 6 ? celularB2(f).tilt : 0;
  const ext = t >= 6 && t < 8.2;
  const fora = { x: mix(108, 116, prog(f, 6.3, 7.9)), y: 560, w: 864, h: 372 };
  const dentro = naTela(cel, CARTAO_TELA);
  const rCart = t < 6.3 ? mixRet(dentro, fora, E.ioC(prog(f, 6, 6.3))) : mixRet(fora, dentro, E.ioC(prog(f, 7.9, 8.2)));
  const escCel = 0.45 * (prog(f, 6, 6.3) - prog(f, 7.9, 8.2));
  const rolo = (t0: number) => prog(f, t0, t0 + 14 / FPS + 0.1);
  return (
    <>
      {/* fundo: pista (atrás da interface; antes da travessia só aparece pela janela) */}
      {passou && cheia("pista", zPista, 1, prof)}
      {passou && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: 0.45 * prog(f, 4.3, 5.4) }} />}
      {passou && t < 4.7 && (
        <>
          <Sombra y={650} h={700} op={1 - prog(f, 4.35, 4.65)} />
          <Sticker p="sticker_pista" x={102} y={840} t={t - 3.88} op={1 - prog(f, 4.35, 4.65)} />
        </>
      )}
      {!passou && (
        <>
          <Portal r={janela} z={zPista} t={t} />
          <div style={{ ...ABS, left: 72, top: 430 - subida, width: 922, height: 424, transform: `scale(${zTxt})`, transformOrigin: "468px 200px", opacity: opTxt, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
            {PERGUNTA.map((linha, i) => {
              const sob = E.oC(prog(f, 0.05 + 0.07 * i, 0.31 + 0.07 * i));
              return (
                <div key={i} style={{ ...ABS, left: 0, top: i * 105.6, height: 105.6, overflow: "hidden", whiteSpace: "nowrap" }}>
                  <div style={{ fontFamily: SOFIA, fontWeight: 900, fontSize: 120, lineHeight: "105.6px", transform: `translateY(${(1 - sob) * 105.6}px)` }}>
                    {linha.map(([w, tw], j) => {
                      const ac = prog(f, tw, tw + 0.12);
                      const soz = w === "SOZINHO";
                      const pulso = soz ? 1 + 0.04 * Math.sin(Math.PI * prog(f, 1.06, 1.36)) : 1;
                      return (
                        <span key={j} style={{ display: "inline-block", color: soz && t >= 1.06 ? COR.volt : COR.creme, opacity: mix(0.13, 1, ac), transform: `scale(${pulso})`, transformOrigin: "0 70%", marginRight: j < linha.length - 1 ? 26 : 0 }}>{w}</span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{ ...ABS, left: 0, top: 204, width: 351 * linhaK, height: 10, background: COR.volt }} />
          </div>
          {t < 3.4 && <div style={{ ...ABS, left: 66, top: 628, width: 22, height: 22, background: COR.volt, transform: `scale(${E.oC(prog(f, 1.55, 1.7))})` }} />}
          <img src={staticFile("v9/figma/assinatura.png")} style={{ ...ABS, left: 80, top: 1230, width: 200, height: 53, opacity: ass }} />
        </>
      )}
      {t >= 4.3 && (
        <Celular c={cel} tilt={tilt}>
          <Peca nome="checkins" y={243} />
          <Peca nome="marcos" y={528.4} />
          <Peca nome="bruno" y={1658} />
          <Peca nome="rafael" y={1976} />
          {ext && <FotoNaCaixa nome="pista" caixa={SLOT_MARCOS} foto={FOTO_MARCOS} />}
        </Celular>
      )}
      {t >= 6 && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: escCel }} />}
      {ext && <CartaoTreino r={rCart} sombra={prog(f, 6, 6.3) - prog(f, 7.9, 8.2)} rolos={{ dist: rolo(P.distancia), tempo: rolo(P.tempo), ritmo: rolo(P.ritmo) }} />}
    </>
  );
};

/** Portal do K: janela com a pista atrás; borda de 40 px com refração (ruído fixo, deslocamento de até 18 px) e linha volt. */
const Portal: React.FC<{ r: Ret; z: number; t: number }> = ({ r, z, t }) => {
  if (t < 3.4 || r.w < 1) return null;
  const foto = zoomRet(G.pista, z);
  const b = Math.min(40, r.w / 4);
  const anel = `M${r.x},${r.y}h${r.w}v${r.h}h${-r.w}Z M${r.x + b},${r.y + b}v${r.h - 2 * b}h${r.w - 2 * b}v${-(r.h - 2 * b)}Z`;
  return (
    <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0 }}>
      <defs>
        <clipPath id="pt-dentro"><rect x={r.x + b} y={r.y + b} width={Math.max(0, r.w - 2 * b)} height={Math.max(0, r.h - 2 * b)} /></clipPath>
        <clipPath id="pt-borda"><path d={anel} clipRule="evenodd" /></clipPath>
        <filter id="pt-refr" filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={1750} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={36} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <image href={staticFile("v9/fotos/pista.jpg")} x={foto.x} y={foto.y} width={foto.w} height={foto.h} preserveAspectRatio="none" clipPath="url(#pt-dentro)" />
      <g clipPath="url(#pt-borda)">
        <image href={staticFile("v9/fotos/pista.jpg")} x={foto.x} y={foto.y} width={foto.w} height={foto.h} preserveAspectRatio="none" filter="url(#pt-refr)" />
        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(242,239,230,0.08)" />
      </g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={COR.volt} strokeWidth={Math.max(3, 6 * (1 - cl((t - 3.64) / 0.16)))} />
    </svg>
  );
};

// ===================== P2 · desafio e recorde (18,3 a 27,4 s) =====================
const celularP2 = (f: number) => {
  const t = t_(f);
  const a = sobe(f, 18.75, { s: 0.5, cy: 1880 }, CEL.des2, 6);
  if (t < P.diego) return a;
  if (t < 24.95) return { c: mixCel(a.c, CEL.post, E.ioC(prog(f, P.diego, P.diego + 0.36))), tilt: 0 };
  return { c: mergulho(CEL.post, MERG_ORLA, E.mergulho(prog(f, 24.95, C.mergulhoOrla))), tilt: 0 };
};
const P2: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const { c: cel, tilt } = celularP2(f);
  const dentroOrla = t >= C.mergulhoOrla;
  const opCel = t < P.melhor ? 1 : t < 24.55 ? 1 - prog(f, P.melhor, P.melhor + 0.3) : prog(f, 24.55, 24.85);
  const notifY = mix(-260, 121.1, mola(f, 19.03, 0.75, 12)) - 140 * E.ioC(prog(f, P.diego - 0.02, P.diego + 0.18));
  const afunda = 1 - 0.03 * (prog(f, C.toque, C.toque + 0.1) - prog(f, C.toque + 0.12, C.toque + 0.22));
  const push = E.ioC(prog(f, P.diego, P.diego + 0.3));
  // cartão do trecho: sai do post em P.melhor, volta em 24,60
  const dentro = naTela(cel, TRECHO_TELA);
  const cartaoNoPalco = t >= P.melhor && t < 24.95;
  const rT = t < 24.6 ? mixRet(dentro, TRECHO_FORA, E.ioC(prog(f, P.melhor, P.melhor + 0.34))) : mixRet(TRECHO_FORA, dentro, E.ioC(prog(f, 24.6, 24.95)));
  const furo = t >= P.melhor && t < C.mergulhoOrla; // foto limpa casada no lugar da foto do post
  const zJ = trilha(f, [[18.45, 1.02], [19.5, 1.04, E.lin], [20.6, 1.05, E.lin]]);
  const zO = trilha(f, [[C.mergulhoOrla, 1], [29.9, 1.04, E.ioC]]);
  const fundoJ = 1 - prog(f, P.melhor, P.melhor + 0.3);
  const rk = mola(f, 26.3, 0.8, 14);
  const sticker = !dentroOrla ? null : <Sticker p="sticker_orla" x={102} y={860} t={t - 25.62} op={mix(1, 0.3, prog(f, 26.3, 26.6))} dy={-80 * E.ioC(prog(f, 26.3, 26.6))} />;
  return (
    <>
      {!dentroOrla && fundoJ > 0 && cheia("juntos", zJ, fundoJ, 6 * prog(f, 18.3, 19.5))}
      {!dentroOrla && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: 0.5 * prog(f, 18.75, 19.2) * fundoJ }} />}
      {!dentroOrla && t < 19.0 && (
        <>
          <Sombra y={650} h={700} op={1 - prog(f, 18.75, 19.0)} />
          <Sticker p="sticker_juntos" x={102} y={840} t={9} op={1 - prog(f, 18.75, 19.0)} />
        </>
      )}
      {dentroOrla && cheia("orla", zO, 1, 7 * prog(f, C.mergulhoOrla, 27))}
      {dentroOrla && <Sombra y={650} h={700} op={1} />}
      {sticker}
      {t >= 18.75 && !dentroOrla && (
        <Celular c={cel} tilt={tilt} op={opCel}>
          {t < P.diego + 0.3 && <Peca nome="juntos" x={-980 * push} y={349} />}
          {t >= P.diego && <Peca nome="diego" x={980 * (1 - push)} y={243} />}
          {t >= P.diego + 0.3 && t < P.melhor + 0.4 && <Brilho t={t - (P.diego + 0.32)} />}
          {furo && <FotoNaCaixa nome="orla" caixa={SLOT_DIEGO} foto={{ ...FOTO_DIEGO, x: FOTO_DIEGO.x - SLOT_DIEGO.x, y: FOTO_DIEGO.y - SLOT_DIEGO.y }} raio={mix(22, 0, prog(f, 25.1, C.mergulhoOrla))} />}
          {t < P.diego + 0.2 && (
            <img src={staticFile("v9/figma/notificacao.png")} style={{ ...ABS, left: 42.2, top: notifY, width: 896.9, height: 213.4, transform: `scale(${afunda})`, transformOrigin: "50% 50%", opacity: 1 - prog(f, P.diego, P.diego + 0.18), filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.18))" }} />
          )}
          <Toque cx={855} cy={345} t={t - C.toque} />
        </Celular>
      )}
      {cartaoNoPalco && <Numeros f={f} />}
      {cartaoNoPalco && <CartaoTrecho f={f} r={rT} />}
      {t >= 26.25 && (
        <div style={{ ...ABS, left: 72, top: 740, width: 936, height: 600, transform: `translateY(${(1 - rk) * 60}px) scale(${mix(0.94, 1, rk)})`, opacity: cl(rk * 1.4) }}>
          <div style={{ ...ABS, inset: 0, borderRadius: 40, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)" }} />
          <SvgFigma p="ranking" x={0} y={0} css={rankingCss(f)} />
        </div>
      )}
    </>
  );
};
const rankingCss = (f: number) => {
  const linha = (id: string, t0: number, op = 1) => {
    const p = E.oC(prog(f, t0, t0 + 0.22));
    return `#ranking__${id}{opacity:${p * op};transform:translateY(${(1 - p) * 26}px)}`;
  };
  return linha("linha-diego-matos", 26.3) + linha("linha-rafael-nunes", 26.3 + 0.2419) + linha("linha-voce", 26.3 + 0.4839) + linha("mes-que-zera", 26.42);
};
const Brilho: React.FC<{ t: number }> = ({ t }) => {
  if (t < 0 || t > 0.5) return null;
  const x = mix(-120, 380, E.ioC(t / 0.5));
  return (
    <div style={{ ...ABS, left: 80, top: 597, width: 346, height: 68, borderRadius: 34, overflow: "hidden" }}>
      <div style={{ ...ABS, left: x, top: -20, width: 60, height: 110, transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)" }} />
    </div>
  );
};

/** Cartão do trecho (vetorial do Figma, DES_07): sai no estado do post, recolhe para contar a história e se remonta com a voz. */
const CartaoTrecho: React.FC<{ f: number; r: Ret }> = ({ f, r }) => {
  const t = t_(f);
  const rec = (a: number, b: number) => 1 - prog(f, a, b); // recolhe na saída
  const vol = t >= 24.3 ? prog(f, 24.3, 24.6) : 0; // volta ao estado do post antes de pousar
  const recolhe = rec(P.melhor + 0.05, P.melhor + 0.3);
  const diegoPino = Math.max(mola(f, P.tempo2, 0.6, 16), vol) * (t < P.tempo2 ? recolhe : 1);
  const recorde = Math.max(prog(f, P.tempo2, P.tempo2 + 0.2), vol, t < P.tempo2 ? recolhe : 0);
  const seuPino = Math.max(mola(f, P.agora, 0.7, 16), vol, t < P.agora ? recolhe : 0);
  // perseguição: cabeça acelera (hiperbólica até o pico) e para antes do recorde; suspensão; "12 s"
  const tp = C.suspensao;
  const u = t < C.perseguicao ? 0 : t >= tp ? 1 : 1 - Math.pow(1 - (t - C.perseguicao) / (tp - C.perseguicao), 0.45);
  const rastro = Math.max(t >= C.perseguicao ? E.iC(Math.min(1, u)) : 0, vol, t < C.perseguicao && t < P.agora ? recolhe : 0);
  const pilula = Math.max(mola(f, C.impacto12, 0.55, 18), vol, t < C.impacto12 ? (t < P.agora ? recolhe : 0) : 0);
  const anelDono = prog(f, P.dono, P.dono + 0.4);
  const k = r.w / 904;
  const css = [
    `#trecho__pino-diego-no-recorde,#trecho__anel-volt,#trecho__recorde-diego{opacity:${cl(diegoPino)};transform:translateY(${(1 - cl(diegoPino)) * -40}px)}`,
    `#trecho__recorde-3-58,#trecho__traco-volt-recorde-aceso{opacity:${0.25 + 0.75 * cl(recorde)}}`,
    `#trecho__pino-voce,#trecho__anel-volt-2,#trecho__4-10-voce{opacity:${cl(seuPino)}}`,
    `#trecho__rastro-volt-do-seu-pino-ao-recorde{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(${cl(rastro)})}`,
    `#trecho__voce-a-12-s{transform-box:fill-box;transform-origin:center;transform:scale(${Math.max(0, pilula)});opacity:${cl(pilula * 3)}}`,
  ].join("");
  const cab = 72 + 471 * cl(rastro);
  return (
    <div style={{ ...ABS, left: r.x, top: r.y, width: 904, height: 420, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      <SvgFigma p="trecho" x={0} y={0} css={css} />
      {t >= C.perseguicao && t < 24.3 && <div style={{ ...ABS, left: cab - 9, top: 260 - 9 + 10, width: 18, height: 18, borderRadius: 9, background: COR.volt, boxShadow: `0 0 18px ${COR.volt}`, opacity: 1 - prog(f, C.impacto12, C.impacto12 + 0.3) }} />}
      {anelDono > 0 && (
        <svg width={904} height={420} style={{ ...ABS, left: 0, top: 0 }}>
          <circle cx={88} cy={88} r={60} fill="none" stroke={COR.volt} strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - anelDono} transform="rotate(-90 88 88)" opacity={1 - prog(f, 24.3, 24.6)} />
        </svg>
      )}
    </div>
  );
};

/** números grandes do desafio (DES_04 a DES_07) */
const Numeros: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const sai = 1 - prog(f, 24.35, 24.6);
  const treme = t >= C.impacto12 && t < C.impacto12 + 0.1 ? 2 * Math.sin((t - C.impacto12) * 60 * 2.1) : 0;
  const n358 = E.oC(prog(f, P.tempo2, P.tempo2 + 0.26));
  const enc = E.ioC(prog(f, P.agora, P.agora + 0.3)); // 3:58 encolhe para dar lugar ao 4:10
  const impacto = t >= C.impacto12;
  const leg = (txt: React.ReactNode, x: number, y: number, a: number, cor = "rgba(242,239,230,0.8)") =>
    a <= 0 ? null : <div style={{ ...ABS, left: x, top: y, fontFamily: INTER, fontWeight: 500, fontSize: 34, lineHeight: "41px", color: cor, opacity: a, whiteSpace: "nowrap" }}>{txt}</div>;
  return (
    <div style={{ ...ABS, inset: 0, opacity: sai, transform: `translateX(${treme}px)` }}>
      {!impacto && (
        <>
          <Linha txt="3:58" x={88} y={mix(250, 300, enc)} tam={mix(240, 150, enc)} alt={mix(288, 180, enc)} p={n358} />
          {leg("melhor tempo do trecho da orla", 92, 520, prog(f, P.tempo2 + 0.1, P.tempo2 + 0.3) * (1 - prog(f, P.dono - 0.1, P.dono)))}
          {leg(<span><DonoIcone /> Diego Matos · dono do trecho</span>, 92, 520, prog(f, P.dono, P.dono + 0.2) * (1 - prog(f, P.agora - 0.1, P.agora)))}
          {leg("Diego", 92, 470, enc)}
          <Linha txt="4:10" x={560} y={250} tam={240} alt={288} p={E.oC(prog(f, P.agora + 0.05, P.agora + 0.31))} />
          {leg("você", 566, 520, prog(f, P.agora + 0.15, P.agora + 0.35))}
        </>
      )}
      {impacto && (
        <>
          <div style={{ ...ABS, left: 88, top: 230, fontFamily: SOFIA, fontWeight: 900, fontSize: 280, lineHeight: "336px", color: COR.volt, transform: `scale(${mix(1.18, 1, E.oExp(prog(f, C.impacto12, C.impacto12 + 0.2)))})`, transformOrigin: "0 60%", textShadow: `0 0 ${30 * (1 - prog(f, C.impacto12, C.impacto12 + 0.6))}px rgba(200,243,38,0.6)` }}>12 s</div>
          {leg("pro trecho da orla ser seu", 92, 525, prog(f, C.impacto12 + 0.1, C.impacto12 + 0.3), COR.creme)}
        </>
      )}
    </div>
  );
};
const DonoIcone = () => <span style={{ display: "inline-block", width: 40, height: 40, borderRadius: 20, background: COR.volt, verticalAlign: "-8px", marginRight: 8 }} />;

// ===================== P3 · linha do K, parque, Cuida e SOS (29,5 a 37,8 s) =====================
const P3: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  // a linha do K a 58° varre da esquerda para a direita abrindo o parque
  const x0 = mix(-900, 1120, E.ioC(prog(f, 29.8, 30.5)));
  const mascara = `polygon(-2000px 0px, ${x0 + 844}px 0px, ${x0}px 1350px, -2000px 1350px)`;
  const zO = trilha(f, [[25.57, 1], [29.9, 1.04, E.lin], [30.5, 1.045, E.lin]]);
  const zP = trilha(f, [[29.8, 1], [31.6, 1.0198, E.lin], [32.5, 1.03, E.lin], [33.6, 1.04, E.lin], [37.8, 1.05, E.lin]]);
  const sobeCel = sobe(f, 32.3, { s: 0.3, cy: 1668 }, CEL.cui3, 5.2);
  const cel = t < P.oKivowCuida ? sobeCel.c : mixCel(CEL.cui3, CEL.cui, E.ioC(prog(f, P.oKivowCuida, P.oKivowCuida + 0.34)));
  // SOS: 180 quadros exatos (2022 a 2202); foco: +10% de escuro fora da folha e câmera avança 2%
  const anel = cl((f - 2022) / 180);
  const foco = prog(f, 33.6, 33.75) - prog(f, C.sosFim, C.sosFim + 0.3);
  const folhaY = t < 37 ? mix(2120, 520, mola(f, P.oKivowCuida, 0.85, 13)) : mix(520, 2120, E.ioC(prog(f, 37, 37.35)));
  const btn = (f >= 2022 && f < 2202 ? mix(1.028, 1, E.oC(prog(f, 33.7, 33.8))) : mix(1, 1.028, mola(f, C.sosFim, 0.55, 18)));
  const contatos = [prog(f, P.quem, P.quem + 0.12), prog(f, P.quem + 0.12, P.quem + 0.24)];
  const rankDesce = E.ioC(prog(f, 29.6, 29.95));
  const camZ = 1 + 0.02 * foco;
  const btnG = naTela(cel, { x: 416 / 0.85, y: 520 + 518 / 0.85, w: 0, h: 0 });
  return (
    <div style={{ ...ABS, inset: 0, transform: `scale(${camZ})`, transformOrigin: `${btnG.x}px ${btnG.y}px` }}>
      {t < 30.5 && cheia("orla", zO, 1, 7)}
      {t < 29.95 && (
        <div style={{ ...ABS, left: 72, top: 740 + 700 * rankDesce, width: 936, height: 600, opacity: 1 - rankDesce }}>
          <SvgFigma p="ranking" x={0} y={0} css="#ranking__linha-voce{opacity:1}" />
        </div>
      )}
      <div style={{ ...ABS, inset: 0, clipPath: t < 30.5 ? mascara : undefined }}>{cheia("parque", zP, 1, 6 * prog(f, 30.5, 32.5))}</div>
      {t >= 29.8 && t < 30.55 && (
        <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0 }}>
          <line x1={x0 + 844} y1={-10} x2={x0} y2={1360} stroke={COR.volt} strokeWidth={12} />
        </svg>
      )}
      {t >= 30.5 && t < 32.6 && (
        <>
          <Sombra y={650} h={700} op={1 - prog(f, 32.3, 32.55)} />
          <Sticker p="sticker_parque" x={102} y={860} t={t - 30.6} ate={E.oC(prog(f, 30.6, 31.6)) * 0.62} op={1 - prog(f, 32.3, 32.55)} />
        </>
      )}
      {t >= 32.3 && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: 0.45 * prog(f, 32.3, 32.8) + 0.1 * foco }} />}
      {t >= 32.3 && (
        <Celular c={cel} tilt={t < P.oKivowCuida ? sobeCel.tilt : 0} abas={1 - prog(f, P.oKivowCuida, P.oKivowCuida + 0.2) + prog(f, 37.1, 37.35)}>
          <Peca nome="lucasvivo" y={243.5} />
          <Peca nome="atletas" y={1220} />
          <AoVivo t={t} />
          <div style={{ ...ABS, left: 0, top: 0, width: 980, height: 2120, background: COR.tinta, opacity: 0.55 * (prog(f, P.oKivowCuida, P.oKivowCuida + 0.3) - prog(f, 37, 37.35)) }} />
          {t >= P.oKivowCuida && folhaY < 2119 && (
            <div style={{ ...ABS, left: 0, top: folhaY, width: 980, height: 1700 }}>
              <SvgFigma p="cuida" x={0} y={0} esc={1 / 0.85} css={`#cuida__anel-enchendo-13,#cuida__contagem{display:none}#cuida__botao-sos-afundado,#cuida__sos{transform-box:view-box;transform-origin:416.5px 518.5px;transform:scale(${btn})}`} />
              <svg width={980} height={1700} viewBox="0 0 833 1445" style={{ ...ABS, left: 0, top: 0 }}>
                {anel > 0 && <circle cx={416.5} cy={518.5} r={171.35} fill="none" stroke="#fff" strokeWidth={14.3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - anel} transform="rotate(-90 416.5 518.5)" />}
                {f >= 2022 && f < 2202 && (
                  <text x={416.5} y={590} textAnchor="middle" fontFamily={INTER} fontWeight={600} fontSize={34} fill="rgba(255,255,255,0.9)">{3 - Math.floor((f - 2022) / 60)}</text>
                )}
                {contatos.map((p, i) => p > 0 && (
                  <g key={i} transform={`translate(731.5 ${882.5 + 102 * i}) scale(${mix(0.6, 1, E.oC(p))})`} opacity={p}>
                    <circle r={20.5} fill={COR.volt} />
                    <path d="M-8 0 L-2.5 5.5 L8 -6" fill="none" stroke={COR.tinta} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}
              </svg>
            </div>
          )}
        </Celular>
      )}
      {f >= 2016 && f < 2212 && (() => {
        const a = prog(f, 33.6, 33.7) * (1 - prog(f, C.sosFim, C.sosFim + 0.15));
        return <div style={{ ...ABS, left: btnG.x - 42, top: btnG.y - 42, width: 84, height: 84, borderRadius: 42, background: `rgba(255,255,255,${0.16 * a})`, boxShadow: `0 0 0 2px rgba(255,255,255,${0.1 * a})` }} />;
      })()}
    </div>
  );
};
const AoVivo: React.FC<{ t: number }> = ({ t }) => {
  if (t < 32.4) return null;
  const ph = ((t - 32.4) % 0.8) / 0.8;
  return <div style={{ ...ABS, left: 414.7 - 32, top: 344.7 - 32, width: 64, height: 64, borderRadius: 32, border: `3px solid ${COR.volt}`, transform: `scale(${0.4 + 0.9 * ph})`, opacity: 1 - ph }} />;
};

// ===================== P4 · mergulho na dupla, frase, rotas, K e CTA (41,9 s ao fim) =====================
const P4: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const dentro = t >= C.mergulhoDupla;
  const cel = mergulho(CEL.post, MERG_DUPLA, E.mergulho(prog(f, 42.3333, C.mergulhoDupla)));
  const zD = trilha(f, [[C.mergulhoDupla, 1], [45.6, 1.05, E.ioC]]);
  const escurece = E.ioC(prog(f, 45.0, 45.6));
  const l1 = E.oC(prog(f, P.sua, P.sua + 0.24));
  const l2 = E.oC(prog(f, P.naoPrecisa, P.naoPrecisa + 0.24));
  const kLinha = E.ioC(prog(f, P.sozinha, P.sozinha + 0.3));
  const rec = E.ioC(prog(f, 46.5, 47.0)); // o mapa recua para OUT_04
  const camRec = 1 - 0.04 * E.ioC(prog(f, 45.3, C.kAcende)) + 0.04 * rec;
  const mapaEsc = mix(1, 0.7398, rec);
  return (
    <>
      {!dentro && (
        <Celular c={cel}>
          <Peca nome="duo" y={243} />
          <div style={{ ...ABS, left: 733.7, top: 399, width: 128, height: 62, background: COR.volt, opacity: 0.45 * (1 - prog(f, 42.3333, 42.45)), mixBlendMode: "multiply" }} />
          <div style={{ ...ABS, left: 44.2, top: 459, width: 80, height: 62, background: COR.volt, opacity: 0.45 * (1 - prog(f, 42.3333, 42.45)), mixBlendMode: "multiply" }} />
          {t >= 42.3333 && <FotoNaCaixa nome="dupla" caixa={SLOT_DUO} foto={{ ...FOTO_DUO, x: FOTO_DUO.x - SLOT_DUO.x, y: FOTO_DUO.y - SLOT_DUO.y }} raio={mix(22, 0, prog(f, 42.6, C.mergulhoDupla))} op={prog(f, 42.3333, 42.45)} />}
        </Celular>
      )}
      {dentro && escurece < 1 && cheia("dupla", zD, 1, 7 * prog(f, C.mergulhoDupla, 44.5))}
      {dentro && <Sombra y={0} h={520} op={prog(f, 43.05, 43.3) * (1 - escurece)} deCima />}
      {dentro && t < 45.3 && (
        <>
          <Sombra y={650} h={700} op={1 - prog(f, P.sozinha, P.sozinha + 0.3)} />
          <Sticker p="sticker_dupla" x={102} y={860} t={t - 43.05} op={1 - prog(f, P.sozinha, P.sozinha + 0.3)} />
        </>
      )}
      {dentro && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: escurece }} />}
      {t >= 45.05 && (
        <div style={{ ...ABS, inset: 0, transform: `scale(${camRec})`, transformOrigin: "540px 700px" }}>
          <div style={{ ...ABS, left: 0, top: 0, width: 1080, height: 1350, transform: `translate(${140 * rec}px, ${19 * rec}px) scale(${mapaEsc})`, transformOrigin: "0 0", opacity: mix(1, 0.6, rec) }}>
            <SvgFigma p="out03" x={0} y={0} css={fechoCss(f)} />
          </div>
        </div>
      )}
      {t >= 46.3 && <SvgFigma p="out04" x={0} y={0} css={ctaCss(f)} />}
      {/* a frase é o mesmo elemento de PAY_02 até o fim: não muda de lugar */}
      <Linha txt="SUA PRÓXIMA CORRIDA" x={80} y={84} tam={100} alt={92} p={l1} />
      <Linha txt="NÃO PRECISA SER SOZINHA." x={80} y={176} tam={100} alt={92} p={l2} />
      {kLinha > 0 && (
        <>
          <div style={{ ...ABS, left: 647, top: 256, width: 22, height: 22, background: COR.volt, transform: `scale(${E.oC(cl(kLinha * 3))})` }} />
          <div style={{ ...ABS, left: 653, top: 262, width: 318 * kLinha, height: 10, background: COR.volt }} />
        </>
      )}
    </>
  );
};
const ROTAS = ["pista", "orla", "parque", "estadio"];
const fechoCss = (f: number) => {
  const t = t_(f);
  let s = `#out03__frase-fica-no-lugar-desde-pay-03,#out03__alfabeto-do-k-assinatura-do-fecho{display:none}`;
  s += `[id^="out03__grade"]{opacity:${0.9 * prog(f, 45.1, 45.5)}}`;
  ROTAS.forEach((r, k) => {
    const t0 = 45.3 + k * 0.121;
    const pr = E.ioC(prog(f, t0, C.kAcende));
    const ap = E.oC(prog(f, 45.2 + 0.05 * k, 45.4 + 0.05 * k));
    s += `#out03__rota-${r}{stroke-dasharray:1 1;stroke-dashoffset:${1 - pr}}`;
    s += `#out03__partida-${r}{transform-box:fill-box;transform-origin:center;transform:scale(${ap})}`;
    s += `#out03__rotulo-${r}{opacity:${ap}}`;
  });
  s += `[id^="out03__icone-"]{opacity:${E.oC(prog(f, 45.25, 45.5))}}`;
  const k = mola(f, C.kAcende, 0.55, 16);
  s += `#out03__marca-k-oficial{transform-box:fill-box;transform-origin:center;transform:scale(${t < C.kAcende ? 0 : k});filter:drop-shadow(0 0 ${t >= C.kAcende ? 22 * (1 - prog(f, C.kAcende, C.kAcende + 0.8)) + 6 : 0}px rgba(200,243,38,0.7))}`;
  return s;
};
const ctaCss = (f: number) => {
  let s = `#out04__frase-fica-no-lugar-desde-pay-03,#out04__mapa-recuando{display:none}`;
  const sob = (id: string, t0: number, d = 0.26, dy = 40) => {
    const p = E.oC(prog(f, t0, t0 + d));
    return `#out04__${id}{opacity:${p};transform:translateY(${(1 - p) * dy}px)}`;
  };
  s += sob("logo-kivow", 46.42, 0.2, 20) + sob("cta", 46.4) + sob("lojas", 46.66, 0.24, 20);
  ["icone-distancia", "icone-ritmo", "icone-tempo", "icone-posicao", "icone-dono-do-trecho"].forEach((id, k) => (s += sob(id, 46.8 + k * 0.121, 0.2, 24)));
  return s;
};

// ---------- pré-carregamento: nenhuma imagem aparece pela metade no primeiro quadro de cada aba de render ----------
const PRE = [
  ...["pista", "orla", "parque", "dupla", "juntos"].flatMap((n) => [`v9/fotos/${n}.jpg`, `v9/prof/${n}_desloc.png`]),
  ...["topo", "abas", "checkins", "marcos", "bruno", "rafael", "diego", "lucasvivo", "atletas", "duo", "juntos", "cartao_branco", "cartao_aceso", "notificacao", "assinatura", "iphone"].map((n) => `v9/figma/${n}.png`),
];
const usePreload = () => {
  const [h] = React.useState(() => delayRender("pré-carregar imagens"));
  React.useEffect(() => {
    Promise.all(PRE.map((p) => new Promise<void>((ok) => { const i = new Image(); i.onload = () => i.decode().then(() => ok(), () => ok()); i.onerror = () => ok(); i.src = staticFile(p); })))
      .then(() => continueRender(h));
  }, [h]);
};
