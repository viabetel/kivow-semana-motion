// Kivow v9.2 · PALCO: a composição mestre. Camada persistente: cada elemento existe UMA vez e é calculado em
// coordenadas globais a partir do quadro. Não há Sequence montando/desmontando imagem; blocos são só intervalos de tempo.
// Elemento compartilhado = a mesma geometria calculada pela mesma função nos dois donos (tela do celular e palco),
// com troca de dono em um quadro em que as duas geometrias são idênticas (QA mede o erro: 0 px).
import React from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, P, S, noRoteiro } from "./tempos";
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
/** deriva do palco do desafio: 4 px/s para a esquerda entre 20,6 e 24,6 s (regra: ≤ 6 px/s no essencial) */
const derivaDes = (t: number) => -4 * cl(t - 20.6, 0, 4);

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
      {t < 8.2 && <P1 f={f} />}
      {t >= 8.2 && t < 18.45 && <B456 f={f} />}
      {t >= 18.45 && t < 21.4 && <P2abre f={f} />}
      {(() => {
        const fo = noRoteiro(f), to = t_(fo); // depois do respiro (21,40 s), a coreografia segue a régua do roteiro
        if (t < 21.4) return null;
        return (
          <>
            {to < C.mergulhoOrla && <P2 f={fo} />}
            {to >= C.mergulhoOrla && to < 30.5 && <Orla f={fo} />}
            {to >= 29.8 && to < 37.35 && <P3 f={fo} />}
            {to >= 37.35 && to < 41.9 && <Desc f={fo} />}
            {to >= 41.9 && <P4 f={fo} />}
          </>
        );
      })()}
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
  const a = { c: CEL.des2, tilt: 0 };
  if (t < P.diego) return a;
  if (t < 24.95) return { c: mixCel(a.c, CEL.post, E.ioC(prog(f, P.diego, P.diego + 0.36))), tilt: 0 };
  return { c: mergulho(CEL.post, MERG_ORLA, E.mergulho(prog(f, 24.95, C.mergulhoOrla))), tilt: 0 };
};
const P2: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const { c: cel, tilt } = celularP2(f);
  const dentroOrla = t >= C.mergulhoOrla;
  const opCel = t < P.melhor ? 1 : t < 24.55 ? 1 - prog(f, P.melhor, P.melhor + 0.3) : prog(f, 24.55, 24.85);
  const notifY = 121.1 - 140 * E.ioC(prog(f, P.diego - 0.02, P.diego + 0.18));
  const afunda = 1 - 0.03 * (prog(f, C.toque, C.toque + 0.1) - prog(f, C.toque + 0.12, C.toque + 0.22));
  const push = E.ioC(prog(f, P.diego, P.diego + 0.3));
  // cartão do trecho: sai do post em P.melhor, volta em 24,60
  const dentro = naTela(cel, TRECHO_TELA);
  const cartaoNoPalco = t >= P.melhor && t < 25.2; // depois de pousar, o painel apaga antes do mergulho (24,95 a 25,20)
  const foraD = { ...TRECHO_FORA, x: TRECHO_FORA.x + derivaDes(t) };
  const rT = t < 24.6 ? mixRet(dentro, foraD, E.ioC(prog(f, P.melhor, P.melhor + 0.34))) : t < 24.95 ? mixRet(foraD, dentro, E.ioC(prog(f, 24.6, 24.95))) : dentro;
  const furo = t >= P.melhor && t < C.mergulhoOrla; // foto limpa casada no lugar da foto do post
  const zJ = trilha(f, [[19.4667, 1.04], [20.6, 1.05, E.ioC]]);
  const fundoJ = 1 - prog(f, P.melhor, P.melhor + 0.3);
  return (
    <>
      {!dentroOrla && fundoJ > 0 && cheia("juntos", zJ, fundoJ, 6)}
      {!dentroOrla && <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: 0.5 * fundoJ }} />}
      {!dentroOrla && (
        <Celular c={cel} tilt={tilt} op={opCel} sobre={<>
          {t < P.diego + 0.2 && (
            <img src={staticFile("v9/figma/notificacao.png")} style={{ ...ABS, left: 42.2, top: notifY, width: 896.9, height: 213.4, transform: `scale(${afunda})`, transformOrigin: "50% 50%", opacity: 1 - prog(f, P.diego, P.diego + 0.18), filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.18))" }} />
          )}
          <Toque cx={855} cy={345} t={t - C.toque} />
        </>}>
          {t < P.diego + 0.3 && <Peca nome="juntos" x={-980 * push} y={349} />}
          {t >= P.diego && <Peca nome="diego" x={980 * (1 - push)} y={243} />}
          {t >= P.diego + 0.3 && t < P.melhor + 0.4 && <Brilho t={t - (P.diego + 0.32)} />}
          {furo && <FotoNaCaixa nome="orla" caixa={SLOT_DIEGO} foto={{ ...FOTO_DIEGO, x: FOTO_DIEGO.x - SLOT_DIEGO.x, y: FOTO_DIEGO.y - SLOT_DIEGO.y }} raio={mix(22, 0, prog(f, 25.1, C.mergulhoOrla))} />}
        </Celular>
      )}
      {cartaoNoPalco && <Numeros f={f} />}
      {cartaoNoPalco && <div style={{ opacity: 1 - prog(f, 24.95, 25.2) }}><CartaoTrecho f={f} r={rT} /></div>}
    </>
  );
};
/** ranking da orla (RK_04 do Figma, 4 linhas): linhas a cada colcheia, "recomeça" acende o mês, "chance" acende você e a linha sobe ao topo */
const rankingCss = (f: number) => {
  const linha = (id: string, t0: number, op = 1) => {
    const p = E.oC(prog(f, t0, t0 + 0.22));
    return `#ranking4__${id}{opacity:${p * op};transform:translateY(${(1 - p) * 26}px)}`;
  };
  const ch = prog(f, 28.26, 28.56);
  return linha("linha-diego-matos", 26.3) + linha("linha-rafael-nunes", 26.3 + 0.2419) + linha("linha-voce", 26.3 + 0.4839, mix(0.5, 1, ch)) + linha("linha-caio-reis", 26.3 + 0.7258) + linha("mes-que-zera", 26.42)
    + `#ranking4__linha-voce{filter:grayscale(${1 - ch})}`
    + `#ranking4__linha-volt-do-seu-lugar-ao-topo{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(${E.ioC(prog(f, 28.3, 28.7))})}`
    + `#ranking4__12-s-do-topo{transform-box:fill-box;transform-origin:center;transform:scale(${Math.max(0, mola(f, 28.62, 0.6, 16))})}`;
};
/** a orla por dentro: sticker 8,00 km, ranking em vidro (26,30 a 29,95) */
const Orla: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const zO = trilha(f, [[C.mergulhoOrla, 1], [29.9, 1.04, E.ioC], [30.5, 1.045, E.lin]]);
  const rk = mola(f, 26.3, 0.8, 14);
  const sobePainel = E.ioC(prog(f, 26.95, 27.3)); // a 4ª linha entra e o painel sobe 50 px
  const desce = E.ioC(prog(f, 29.6, 29.95));
  const anelMes = prog(f, P.recomeca, P.recomeca + 0.5);
  return (
    <>
      {cheia("orla", zO, 1, 7 * prog(f, C.mergulhoOrla, 27))}
      <Sombra y={650} h={700} op={1} />
      <Sticker p="sticker_orla" x={102} y={860} t={t - 25.62} op={mix(1, 0.3, prog(f, 26.3, 26.6))} dy={-80 * E.ioC(prog(f, 26.3, 26.6))} />
      {t >= 26.25 && desce < 1 && (
        <div style={{ ...ABS, left: 72, top: 740 - 50 * sobePainel + 700 * desce, width: 936, height: 600, transform: `translateY(${(1 - rk) * 60}px) scale(${mix(0.94, 1, rk)})`, opacity: cl(rk * 1.4) * (1 - desce) }}>
          <div style={{ ...ABS, inset: 0, borderRadius: 40, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)" }} />
          <SvgFigma p="ranking4" x={0} y={0} css={rankingCss(f)} />
          {anelMes > 0 && anelMes < 1 && <div style={{ ...ABS, left: 44, top: 112, width: 439, height: 56, borderRadius: 28, border: `3px solid ${COR.volt}`, transform: `scale(${1 + 0.06 * anelMes})`, opacity: 1 - anelMes }} />}
        </div>
      )}
    </>
  );
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
    <div style={{ ...ABS, inset: 0, opacity: sai, transform: `translateX(${treme + derivaDes(t)}px)` }}>
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
  const mascara = t >= 30.5 ? "polygon(-2000px -2000px, 4000px -2000px, 4000px 4000px, -2000px 4000px)" : `polygon(-2000px 0px, ${x0 + 844}px 0px, ${x0}px 1350px, -2000px 1350px)`;
  const zP = trilha(f, [[29.8, 1], [31.6, 1.0198, E.lin], [32.5, 1.03, E.lin], [33.6, 1.04, E.lin], [37.8, 1.05, E.lin]]);
  const sobeCel = sobe(f, 32.3, { s: 0.3, cy: 1668 }, CEL.cui3, 5.2);
  const cel = t < P.oKivowCuida ? sobeCel.c : mixCel(CEL.cui3, CEL.cui, E.ioC(prog(f, P.oKivowCuida, P.oKivowCuida + 0.34)));
  // SOS: 180 quadros exatos (2022 a 2202); foco: +10% de escuro fora da folha e câmera avança 2%
  const anel = cl((f - 2022) / 180);
  const foco = prog(f, 33.6, 33.75) - prog(f, C.sosFim, C.sosFim + 0.3);
  const folhaY = t < 37 ? mix(2120, 520, mola(f, P.oKivowCuida, 0.85, 13)) : mix(520, 2120, E.ioC(prog(f, 37, 37.35)));
  const btn = (f >= 2022 && f < 2202 ? mix(1.028, 1, E.oC(prog(f, 33.7, 33.8))) : mix(1, 1.028, mola(f, C.sosFim, 0.55, 18)));
  const contatos = [prog(f, P.quem, P.quem + 0.12), prog(f, P.quem + 0.12, P.quem + 0.24)];
  const camZ = 1 + 0.02 * E.ioC(prog(f, 33.6, C.sosFim)) * (1 - E.ioC(prog(f, C.sosFim, C.sosFim + 0.3)));
  const btnG = naTela(cel, { x: 416 / 0.85, y: 520 + 518 / 0.85, w: 0, h: 0 });
  return (
    <div style={{ ...ABS, inset: 0, transform: `scale(${camZ})`, transformOrigin: `${btnG.x}px ${btnG.y}px` }}>
      <div style={{ ...ABS, inset: 0, clipPath: mascara }}>{cheia("parque", zP, 1, 6 * prog(f, 30.5, 32.5))}</div>
      {t >= 29.8 && t < 30.55 && (
        <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0 }}>
          <line x1={x0 + 844} y1={-10} x2={x0} y2={1360} stroke={COR.volt} strokeWidth={12} />
        </svg>
      )}
      {t >= 30.5 && t < 32.6 && (
        <>
          <Sombra y={650} h={700} op={prog(f, 30.45, 30.75) * (1 - prog(f, 32.3, 32.55))} />
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

// ===================== B4 a B6 · região, conversa e companhia (8,20 a 18,45 s) =====================
const V = (oy: number): Cel => ({ ox: 50, oy, s: 1 });
const FOTO_JUNTOS = { x: -233, y: 557.5, w: 1458, h: 820 }; // casamento 0,94 com a foto original (o painel do post fica por cima)
const MERG_JUNTOS = alvo(FOTO_JUNTOS, G.juntos);
const ANEIS = [280, 468, 657, 845].map((x) => ({ x, y: 327 }));
const CORACAO = { x: 193.5, y: 1609.5 };
const compasso7 = 3.8 + 28 * 0.4838725774422903; // 17,348 s: o pulso de luz corre a ligação no compasso
const celB456 = (f: number): Cel => {
  const t = t_(f);
  if (t < 8.6) return mixCel(CEL.met, V(87), E.ioC(prog(f, 8.2, 8.6)));
  if (t < 16.4) return V(trilha(f, [[8.6, 87], [9.0, 87], [10.2, -623, E.ioC], [10.4, -623], [10.8, -673, E.ioC], [11.4, -673], [12.3, -770, E.ioC]]));
  if (t < 17.85) return mixCel(V(-770), V(-223), E.ioC(prog(f, 16.4, 16.8)));
  return mergulho(V(-223), MERG_JUNTOS, E.mergulho(prog(f, 17.85, 18.45)));
};
/** avatar redondo recortado da própria camada do feed (nada inventado) */
const Avatar: React.FC<{ peca: string; lx: number; ly: number; d: number; cx: number; cy: number; tam: number; op?: number }> = ({ peca, lx, ly, d, cx, cy, tam, op = 1 }) => {
  const k = tam / d;
  return (
    <div style={{ ...ABS, left: cx - tam / 2, top: cy - tam / 2, width: tam, height: tam, borderRadius: tam / 2, overflow: "hidden", opacity: op, boxShadow: "0 10px 28px rgba(0,0,0,0.28)" }}>
      <img src={staticFile(`v9/figma/${peca}.png`)} style={{ ...ABS, left: -lx * k, top: -ly * k, width: 975 * k, maxWidth: "none" }} />
    </div>
  );
};
type Pt = { x: number; y: number };
const bez = (a: Pt, c: Pt, b: Pt, p: number): Pt => ({
  x: (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * c.x + p * p * b.x,
  y: (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * c.y + p * p * b.y,
});
const NUM: React.CSSProperties = { ...ABS, left: 5, top: 3, fontFamily: INTER, fontSize: 30, lineHeight: "36px", color: "#40454D" };
/** o post do Marcos chega a 17 curtidas (tabela da v9): 13 até os corredores da região pousarem, um a um */
const Curtidas: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const n = 13 + [0, 1, 2, 3].filter((k) => t >= 9.8 + 0.09 * k).length;
  const cheio = t >= P.veem;
  return (
    <>
      {!cheio && <div style={{ ...ABS, left: 224, top: 1588, width: 44, height: 42, background: "#fff" }}><span style={NUM}>{n}</span></div>}
      {cheio && (
        <>
          <div style={{ ...ABS, left: 168, top: 1584, width: 52, height: 52, background: "#fff" }} />
          <img src={staticFile("v9/figma/coracao.png")} style={{ ...ABS, left: 170, top: 1586, width: 47, height: 47, transform: `scale(${mola(f, P.veem, 0.5, 18)})` }} />
          {[0, 1].map((k) => {
            const p = prog(f, P.veem + 0.1 * k, P.veem + 0.1 * k + 0.6);
            return p > 0 && p < 1 ? <img key={k} src={staticFile("v9/figma/mais1.png")} style={{ ...ABS, left: 450 + 110 * k, top: 1584 - 50 * E.oC(p), width: 84, height: 61, opacity: 1 - p * p }} /> : null;
          })}
        </>
      )}
      {t >= P.fez + 0.06 && (
        <div style={{ ...ABS, left: 380, top: 1588, width: 30, height: 42, background: "#fff" }}>
          <span style={{ ...NUM, display: "inline-block", transform: `scale(${mola(f, P.fez + 0.06, 0.5, 18)})` }}>1</span>
        </div>
      )}
    </>
  );
};
const B456: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const cel = celB456(f);
  const scroll = trilha(f, [[11.4, 0], [12.3, 276, E.ioC], [13.82, 276], [14.12, 594, E.ioC], [14.92, 594], [15.22, 912, E.ioC]]);
  const novo = E.oC(prog(f, 16.4, 16.8)); // o post de Marcos e Rafael chega
  const zPista = trilha(f, [[5.9, 1.05], [8.6, 1.058, E.lin], [12.6, 1.07, E.lin]]);
  const realce = (y: number, t0: number) => {
    const a = prog(f, t0, t0 + 0.15) * (1 - prog(f, t0 + 0.15, t0 + 0.75));
    return a > 0 ? <div style={{ ...ABS, left: 0, top: y, width: 980, height: 318, background: COR.volt, opacity: 0.14 * a }} /> : null;
  };
  const marca = (x: number, y: number, w: number, t0: number) => {
    const p = E.oC(prog(f, t0, t0 + 0.2));
    return p > 0 ? <div style={{ ...ABS, left: x, top: y, width: w * p, height: 48, borderRadius: 8, background: COR.volt, mixBlendMode: "multiply" }} /> : null;
  };
  // companhia: os dois avatares saem da conversa, se ligam e viram a foto dos dois
  const voo = [
    { peca: "rafael", de: { x: 97, y: 2049 }, para: { x: 400, y: 500 }, t0: P.oTreino, ctrl: { x: -120, y: -260 }, foto: { x: 525, y: 880 } },
    { peca: "marcosR", de: { x: 97, y: 2366 }, para: { x: 640, y: 640 }, t0: P.oTreino + 0.06, ctrl: { x: 260, y: -120 }, foto: { x: 379, y: 880 } },
  ];
  const zFoto = trilha(f, [[16.4, 2], [P.vira, 2], [P.vira + 0.4, 1, E.ioC]]);
  const fotoJ = { x: 379 - (379 - FOTO_JUNTOS.x) * zFoto, y: 885.5 - (885.5 - FOTO_JUNTOS.y) * zFoto, w: FOTO_JUNTOS.w * zFoto, h: FOTO_JUNTOS.h * zFoto };
  const toqueBruno = naTela(cel, { x: 193.5, y: 1919.5 - scroll, w: 0, h: 0 });
  return (
    <>
      {t < 12.6 && cheia("pista", zPista, 1, 7)}
      <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: mix(0.45, 1, prog(f, 12.3, 12.6)) }} />
      <Celular c={cel}>
        {novo < 1 && (
          <div style={{ ...ABS, left: 0, top: -scroll - 300 * novo, width: 980, height: 2700, opacity: 1 - novo }}>
            <Peca nome="checkins" y={243} />
            <Peca nome="marcos" y={528.4} />
            <Peca nome="bruno" y={1658} />
            <Peca nome="rafael" y={1976} />
            <Peca nome="marcosR" y={2293} />
            <Curtidas f={f} />
            {ANEIS.map((a, k) => {
              const p = E.oC(prog(f, P.outros + 0.09 * k, P.outros + 0.09 * k + 0.2));
              return p > 0 ? <div key={k} style={{ ...ABS, left: a.x - 34, top: a.y - 34, width: 68, height: 68, borderRadius: 34, border: `6px solid ${COR.volt}`, boxSizing: "border-box", transform: `scale(${mix(1.3, 1, p)})`, opacity: p * (1 - prog(f, 9.0 + 0.09 * k, 9.2 + 0.09 * k)) }} /> : null;
            })}
            {t >= P.interagem && (
              <>
                <div style={{ ...ABS, left: 168, top: 1894, width: 85, height: 50, background: "#fff" }} />
                <img src={staticFile("v9/figma/coracao.png")} style={{ ...ABS, left: 170, top: 1896, width: 47, height: 47, transform: `scale(${mola(f, P.interagem, 0.5, 18)})` }} />
                <span style={{ ...NUM, left: 228, top: 1898 }}>5</span>
              </>
            )}
            {realce(1658, P.comentam)}
            {realce(1976, P.combinam)}
            {realce(2293, P.comVoce)}
            {marca(388, 2132, 58, 14.1)}
            {marca(323, 2450, 52, P.comVoce + 0.1)}
            {t >= P.comVoce + 0.1 && <div style={{ ...ABS, left: 94, top: 2097, width: 6, height: 222 * E.ioC(prog(f, P.comVoce + 0.1, P.comVoce + 0.4)), background: COR.volt }} />}
            {voo.map((v, i) => (t >= v.t0 ? <div key={i} style={{ ...ABS, left: v.de.x - 51, top: v.de.y - 51, width: 102, height: 102, borderRadius: 51, background: "#fff" }} /> : null))}
            <div style={{ ...ABS, left: 0, top: 243, width: 980, height: 2400, background: "#fff", opacity: 0.6 * prog(f, P.oTreino, P.oTreino + 0.3) }} />
          </div>
        )}
        {t >= 16.4 && (
          <div style={{ ...ABS, left: 0, top: 500 * (1 - novo), width: 980, height: 1600, opacity: cl(novo * 1.5) }}>
            <Peca nome="juntos" y={243} />
            <FotoNaCaixa nome="juntos" caixa={SLOT_DUO} foto={{ ...fotoJ, x: fotoJ.x - SLOT_DUO.x, y: fotoJ.y - SLOT_DUO.y }} raio={mix(22, 0, prog(f, 18.0, 18.45))} />
            <div style={{ ...ABS, left: 398, top: 265, width: 540, height: 52, background: "#fff", opacity: 1 - prog(f, P.vira, P.vira + 0.25) }} />
            <div style={{ ...ABS, left: 160, top: 319, width: 780, height: 48, background: "#fff", opacity: 1 - prog(f, P.vira + 0.08, P.vira + 0.33) }} />
          </div>
        )}
        {t < 12.0 && <Toque cx={352} cy={1609} t={t - P.fez} />}
      </Celular>
      {t >= P.interagem - 0.1 && t < P.interagem + 0.6 && <Toque cx={toqueBruno.x} cy={toqueBruno.y} t={t - P.interagem} />}
      {/* corredores da região voam até o coração, em arcos diferentes, com a câmera descendo junto */}
      {[0, 1, 2, 3].map((k) => {
        const t0 = 9.0 + 0.09 * k, p = prog(f, t0, t0 + 0.8);
        if (p <= 0 || p >= 1) return null;
        const a = naTela(cel, { ...ANEIS[k], w: 0, h: 0 }), b = naTela(cel, { ...CORACAO, w: 0, h: 0 });
        const q = E.ioC(p), pos = bez(a, { x: (a.x + b.x) / 2 + 320 + 40 * k, y: (a.y + b.y) / 2 - 160 }, b, q);
        return <Avatar key={k} peca="checkins" lx={ANEIS[k].x - 30} ly={ANEIS[k].y - 243 - 30} d={60} cx={pos.x} cy={pos.y} tam={mix(60, 34, q) + 46 * Math.sin(Math.PI * q)} op={1 - prog(f, t0 + 0.72, t0 + 0.8)} />;
      })}
      {voo.map((v, i) => {
        if (t < v.t0 || t > P.vira + 0.4) return null;
        const p = E.ioC(prog(f, v.t0, v.t0 + 0.42));
        const a = naTela(cel, { x: v.de.x, y: v.de.y - scroll, w: 0, h: 0 });
        const vira = E.ioC(prog(f, P.vira, P.vira + 0.35));
        const g = naTela(cel, { x: v.foto.x, y: v.foto.y + 500 * (1 - novo), w: 0, h: 0 });
        const ctrl = { x: (a.x + v.para.x) / 2 + v.ctrl.x, y: (a.y + v.para.y) / 2 + v.ctrl.y };
        const pos = p < 1 ? bez(a, ctrl, v.para, p) : { x: mix(v.para.x, g.x, vira), y: mix(v.para.y, g.y, vira) };
        const tam = t < P.vira ? mix(96, 230, p) : mix(230, 70, vira);
        const op = 1 - prog(f, P.vira + 0.2, P.vira + 0.4);
        const rastro = p > 0 && p < 1 ? Array.from({ length: 10 }, (_, j) => bez(a, ctrl, v.para, Math.max(0, p - 0.04 * j))) : [];
        const anel = prog(f, v.t0 + 0.42, v.t0 + 0.72) * (1 - prog(f, P.vira, P.vira + 0.15));
        return (
          <React.Fragment key={i}>
            {rastro.length > 1 && (
              <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0 }}>
                <polyline points={rastro.map((r) => `${r.x},${r.y}`).join(" ")} fill="none" stroke={COR.volt} strokeWidth={2} opacity={0.8} />
              </svg>
            )}
            <Avatar peca={v.peca} lx={49} ly={25} d={96} cx={pos.x} cy={pos.y} tam={tam} op={op} />
            {anel > 0 && (
              <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0 }}>
                <circle cx={pos.x} cy={pos.y} r={123} fill="none" stroke={COR.volt} strokeWidth={8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, anel * 1.5)} opacity={Math.min(1, anel * 3)} transform={`rotate(-90 ${pos.x} ${pos.y})`} />
              </svg>
            )}
          </React.Fragment>
        );
      })}
      {t >= P.oTreino + 0.75 && t < P.vira + 0.15 && (() => {
        const lig = E.ioC(prog(f, P.oTreino + 0.75, P.oTreino + 0.95)), pulso = prog(f, compasso7, compasso7 + 0.3);
        const x1 = 400, y1 = 500, x2 = 640, y2 = 640;
        return (
          <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0, opacity: 1 - prog(f, P.vira, P.vira + 0.15) }}>
            <line x1={x1} y1={y1} x2={mix(x1, x2, lig)} y2={mix(y1, y2, lig)} stroke={COR.volt} strokeWidth={3} />
            {pulso > 0 && pulso < 1 && <circle cx={mix(x1, x2, pulso)} cy={mix(y1, y2, pulso)} r={10} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${COR.volt})` }} />}
          </svg>
        );
      })()}
    </>
  );
};

// ===================== P2 · abertura com o respiro: a notificação é lida antes da voz (18,45 a 21,40 s na régua do FILME) =====================
const P2abre: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const zJ = trilha(f, [[18.45, 1.0], [21.4, 1.04, E.ioC]]);
  const a = sobe(f, 19.05, { s: 0.5, cy: 1880 }, CEL.des2, 6);
  const notifY = mix(-260, 121.1, mola(f, 19.95, 0.75, 12));
  const brilho = t > 20.3 ? 0.18 + 0.1 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - 20.3)) / 0.9677)) : 0.18; // respira em meio compasso enquanto espera a voz
  return (
    <>
      {cheia("juntos", zJ, 1, 6 * prog(f, 18.45, 19.5))}
      <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: 0.5 * prog(f, 19.05, 19.5) }} />
      {t < 19.35 && (
        <>
          <Sombra y={650} h={700} op={prog(f, 18.45, 18.6) * (1 - prog(f, 19.05, 19.3))} />
          <Sticker p="sticker_juntos" x={102} y={840} t={t - 18.48} op={1 - prog(f, 19.05, 19.3)} />
        </>
      )}
      {t >= 19.05 && (
        <Celular c={a.c} tilt={a.tilt} sobre={
          <>
            <img src={staticFile("v9/figma/notificacao.png")} style={{ ...ABS, left: 42.2, top: notifY, width: 896.9, height: 213.4, filter: `drop-shadow(0 18px 30px rgba(0,0,0,${brilho}))` }} />
            <Toque cx={855} cy={345} t={t - (C.toque + S)} />
          </>
        }>
          <Peca nome="juntos" y={349} />
        </Celular>
      )}
    </>
  );
};

// ===================== B10 · descoberta do André e do Caio (régua do roteiro: 37,35 a 41,90 s) =====================
const ATL = { x: 40.7, y: 49.5, w: 821.9, h: 649.4 }; // região dos cartões na peça "atletas"
const ATL_FORA = { x: 76, y: 330, w: 929, h: 734 };
const CARD_A = { x: 56.4, y: 179.2, w: 403, h: 532.5 };
const CARD_C = { x: 445, y: 175, w: 403, h: 532.5 };
const A_FORA = { x: 150, y: 369, w: 479, h: 633 };
const C_FORA = { x: 458, y: 420, w: 479, h: 633 };
const kAtl = ATL_FORA.w / ATL.w;
const noRecorte = (c: Ret): Ret => ({ x: ATL_FORA.x + (c.x - ATL.x) * kAtl, y: ATL_FORA.y + (c.y - ATL.y) * kAtl, w: c.w * kAtl, h: c.h * kAtl });
const Recorte: React.FC<{ reg: Ret; r: Ret; rot?: number; op?: number; raio?: number; children?: React.ReactNode }> = ({ reg, r, rot = 0, op = 1, raio = 28, children }) => {
  const k = r.w / reg.w;
  return (
    <div style={{ ...ABS, left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: raio, overflow: "hidden", opacity: op, transform: `rotate(${rot}deg)`, boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
      <img src={staticFile("v9/figma/atletas.png")} style={{ ...ABS, left: -reg.x * k, top: -reg.y * k, width: 975 * k, maxWidth: "none" }} />
      {children}
    </div>
  );
};
const Seguindo: React.FC<{ x: number; y: number; w: number; h: number; esc: number; op?: number }> = ({ x, y, w, h, esc, op = 1 }) => (
  <div style={{ ...ABS, left: x, top: y, width: w, height: h, borderRadius: h / 2, background: "#fff", border: `${4.5 * esc}px solid ${COR.tinta}`, boxSizing: "border-box", opacity: op, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 600, fontSize: 38.4 * esc, color: COR.tinta, whiteSpace: "pre" }}>
    {"✓  Seguindo"}
  </div>
);
const Desc: React.FC<{ f: number }> = ({ f }) => {
  const t = t_(f);
  const cel = mixCel(CEL.cui, CEL.post, E.ioC(prog(f, 37.35, 37.65)));
  const scroll = trilha(f, [[37.35, 0], [37.65, 977, E.ioC], [41.0, 977], [41.4, 1735, E.ioC]]);
  const zP = trilha(f, [[33.6, 1.04], [37.8, 1.05, E.lin]]);
  const escuro = 0.95 * (prog(f, 37.4, 37.7) - prog(f, 41.0, 41.45));
  const ext = E.ioC(prog(f, 37.4, 37.75));
  const origem = naTela(cel, { x: ATL.x, y: 1220 - scroll + ATL.y, w: ATL.w, h: ATL.h });
  const rAtl = mixRet(origem, ATL_FORA, ext);
  const kR = rAtl.w / ATL_FORA.w;
  const dividiu = t >= P.acharam;
  const atra = mola(f, P.acharam, 0.7, 7);
  const pousa = E.ioC(prog(f, 41.0, 41.45));
  const ninho = naTela(cel, { x: 48, y: 1978 - scroll + 20, w: 70, h: 92 });
  const recua = 1 - 0.03 * E.ioC(prog(f, P.acharam, P.acharam + 1.2)) + 0.03 * pousa;
  const rA = mixRet(mixRet(noRecorte(CARD_A), A_FORA, atra), ninho, pousa);
  const rC = mixRet(mixRet(noRecorte(CARD_C), C_FORA, atra), ninho, pousa);
  const arco = 40 * Math.sin(Math.PI * cl(atra));
  const caioApagado = prog(f, P.andre, P.andre + 0.2) * (1 - prog(f, P.caio, P.caio + 0.15));
  const anelAndre = prog(f, P.andre, P.andre + 0.35) * (1 - prog(f, P.caio, P.caio + 0.2));
  const segue = prog(f, P.caio + 0.12, P.caio + 0.3);
  const marcas = prog(f, P.pelo, P.pelo + 0.14);
  const u = cl(atra);
  return (
    <>
      {cheia("parque", zP, 1 - prog(f, 37.7, 38.0), 6)}
      <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: mix(0.45, 1, prog(f, 37.7, 38.0)) }} />
      <Celular c={cel}>
        <Peca nome="lucasvivo" y={243.5 - scroll} />
        <Peca nome="atletas" y={1220 - scroll} />
        <Peca nome="duo" y={1978 - scroll} />
        <div style={{ ...ABS, left: 733.7, top: 399 + 1735 - scroll, width: 128, height: 62, background: COR.volt, opacity: 0.45 * marcas, mixBlendMode: "multiply" }} />
        <div style={{ ...ABS, left: 44.2, top: 459 + 1735 - scroll, width: 80, height: 62, background: COR.volt, opacity: 0.45 * marcas, mixBlendMode: "multiply" }} />
      </Celular>
      <div style={{ ...ABS, inset: 0, background: COR.tinta, opacity: escuro }} />
      <div style={{ ...ABS, inset: 0, transform: `scale(${recua})`, transformOrigin: "540px 700px" }}>
        {t >= 37.4 && t < P.acharam + 0.2 && (
          <Recorte reg={ATL} r={rAtl} raio={mix(0, 28, ext)} op={dividiu ? 1 - prog(f, P.acharam, P.acharam + 0.2) : 1}>
            <div style={{ ...ABS, transform: `scale(${kR})`, transformOrigin: "0 0", width: 929, height: 734 }}>
              <div style={{ ...ABS, left: 804, top: 9, width: 124, height: 90, background: "#fff" }} />
              {caioApagado > 0 && <div style={{ ...ABS, left: 479, top: 115, width: 438, height: 603, background: "#fff", opacity: 0.45 * caioApagado }} />}
              {anelAndre > 0 && (
                <svg width={929} height={734} style={{ ...ABS, left: 0, top: 0 }}>
                  <circle cx={230} cy={273} r={114} fill="none" stroke={COR.volt} strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - anelAndre} transform="rotate(-90 230 273)" />
                </svg>
              )}
              {segue > 0 && <Seguindo x={518} y={590} w={360} h={89} esc={1} op={segue} />}
              {t >= P.caio - 0.1 && t < P.caio + 0.6 && <Toque cx={833.5} cy={645.5} t={t - P.caio} />}
            </div>
          </Recorte>
        )}
        {dividiu && pousa < 1 && (
          <>
            <Recorte reg={CARD_A} r={{ ...rA, y: rA.y - arco }} rot={-3 * u * (1 - pousa)} op={1 - prog(f, 41.3, 41.45)} />
            <Recorte reg={CARD_C} r={{ ...rC, y: rC.y - arco * 0.6 }} rot={3 * u * (1 - pousa)} op={1 - prog(f, 41.3, 41.45)}>
              <Seguindo x={mix(61 / 455.5, 42 / 479, u) * rC.w} y={mix(448.2 / 601.9, 476 / 633, u) * rC.h} w={mix(360 / 455.5, 366 / 479, u) * rC.w} h={mix(89 / 601.9, 114 / 633, u) * rC.h} esc={rC.w / 479} />
            </Recorte>
          </>
        )}
      </div>
    </>
  );
};
