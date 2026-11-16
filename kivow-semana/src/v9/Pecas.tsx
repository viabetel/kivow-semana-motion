// Kivow v9.2 · peças. Cada peça é um componente puro: recebe geometria GLOBAL e estado; não guarda nada entre quadros.
import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as sofia } from "@remotion/google-fonts/SofiaSansExtraCondensed";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { SVGS } from "./svgs";
import { Cel, Ret, cl } from "./mov";

export const SOFIA = sofia("normal", { weights: ["900"] }).fontFamily;
export const INTER = inter("normal", { weights: ["500", "600"] }).fontFamily;
export const COR = { tinta: "#111418", creme: "#F2EFE6", volt: "#C8F326", sos: "#E5484D" };
export const ABS: React.CSSProperties = { position: "absolute" };
export const FOTOS: Record<string, { w: number; h: number }> = {
  pista: { w: 2160, h: 2700 }, orla: { w: 3200, h: 2130 }, parque: { w: 3200, h: 2133 }, dupla: { w: 3200, h: 2133 }, juntos: { w: 2400, h: 1350 },
};
export const PECAS_H: Record<string, number> = {
  topo: 243, abas: 247, checkins: 285, marcos: 1130, bruno: 318, rafael: 318, marcosR: 318, diego: 1420, lucasvivo: 978, atletas: 758, duo: 1255, juntos: 1255,
};

/** Foto real em tela cheia, com profundidade medida (deslocamento por mapa, sem recorte). prof = deslocamento máximo em px. */
export const Foto: React.FC<{ nome: string; r: Ret; prof?: number; op?: number; clip?: string }> = ({ nome, r, prof = 0, op = 1, clip }) => {
  const id = `prof-${nome}`;
  return (
    <svg width={1080} height={1350} style={{ ...ABS, left: 0, top: 0, opacity: op, clipPath: clip }}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={r.x} y={r.y} width={r.w} height={r.h} colorInterpolationFilters="sRGB">
          <feImage href={staticFile(`v9/prof/${nome}_desloc.png`)} x={r.x} y={r.y} width={r.w} height={r.h} preserveAspectRatio="none" result="m" />
          <feDisplacementMap in="SourceGraphic" in2="m" scale={2 * prof} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <image href={staticFile(`v9/fotos/${nome}.jpg`)} x={r.x} y={r.y} width={r.w} height={r.h} preserveAspectRatio="none" filter={prof > 0.05 ? `url(#${id})` : undefined} />
    </svg>
  );
};

/** foto recortada numa caixa em coordenadas locais (usada dentro da tela do celular: o mesmo arquivo da tela cheia) */
export const FotoNaCaixa: React.FC<{ nome: string; caixa: Ret; foto: Ret; raio?: number; op?: number }> = ({ nome, caixa, foto, raio = 22, op = 1 }) => (
  <div style={{ ...ABS, left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, overflow: "hidden", borderRadius: raio, opacity: op }}>
    <Img src={staticFile(`v9/fotos/${nome}.jpg`)} style={{ ...ABS, left: foto.x, top: foto.y, width: foto.w, height: foto.h, maxWidth: "none" }} />
  </div>
);

export const Peca: React.FC<{ nome: string; x?: number; y: number; op?: number }> = ({ nome, x = 0, y, op = 1 }) => (
  <Img src={staticFile(`v9/figma/${nome}.png`)} style={{ ...ABS, left: x, top: y, width: 975, height: PECAS_H[nome], opacity: op }} />
);

/** Celular: moldura real (1946 x 3088) com a tela em 483, 262 (980 x 2120, raio 150). O conteúdo vive em coordenadas da tela. */
export const Celular: React.FC<{ c: Cel; tilt?: number; op?: number; topo?: number; abas?: number; children?: React.ReactNode }> = ({ c, tilt = 0, op = 1, topo = 1, abas = 1, children }) => {
  if (op <= 0.001) return null;
  return (
    <div style={{ ...ABS, left: c.ox - 483 * c.s, top: c.oy - 262 * c.s, width: 1946 * c.s, height: 3088 * c.s, opacity: op, transform: `perspective(1400px) rotateX(${tilt}deg)`, transformOrigin: "50% 75%" }}>
      <div style={{ ...ABS, left: 483 * c.s, top: 262 * c.s, width: 980 * c.s, height: 2120 * c.s, borderRadius: 150 * c.s, overflow: "hidden", background: "#fff" }}>
        <div style={{ ...ABS, left: 0, top: 0, width: 980, height: 2120, transform: `scale(${c.s})`, transformOrigin: "0 0" }}>
          {children}
          {topo > 0 && <Peca nome="topo" y={0} op={topo} />}
          {abas > 0 && <Peca nome="abas" y={1873} op={abas} />}
        </div>
      </div>
      <Img src={staticFile("v9/figma/iphone.png")} style={{ ...ABS, left: 0, top: 0, width: "100%", height: "100%" }} />
    </div>
  );
};

/** SVG exportado do Figma, animado por id (CSS por quadro). Os ids levam o prefixo da peça. */
export const SvgFigma: React.FC<{ p: string; x: number; y: number; esc?: number; css?: string; op?: number; style?: React.CSSProperties }> = ({ p, x, y, esc = 1, css = "", op = 1, style }) => {
  const s = SVGS[p];
  const html = React.useMemo(
    () => s.svg.replace(/__ESTATICO__([^"]+)/g, (_, a) => staticFile(a)).replace(/<svg width="[\d.]+" height="[\d.]+"/, '<svg width="100%" height="100%"'),
    [s],
  );
  return (
    <div style={{ ...ABS, left: x, top: y, width: s.w * esc, height: s.h * esc, opacity: op, ...style }}>
      <style>{css}</style>
      <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

/** quantos km o sticker desenha (conta os traços exportados) */
export const kmsDo = (p: string) => (SVGS[p].svg.match(/__linha-\d+o-km"/g) ?? []).length;
/** Sticker "Meu treino" com repiques: o quadrado de partida aparece, a linha desenha km a km (60 ms), o relatório sobe. */
export const Sticker: React.FC<{ p: string; x: number; y: number; t: number; op?: number; dy?: number; ate?: number }> = ({ p, x, y, t, op = 1, dy = 0, ate = 1 }) => {
  // t = segundos desde o início do sticker
  const n = kmsDo(p);
  const quad = cl(t / 0.12);
  let css = `#${p}__partida-quadrado-da-distancia{transform-box:fill-box;transform-origin:center;transform:scale(${quad})}`;
  for (let k = 1; k <= n; k++) {
    const pk = Math.min(cl((t - 0.08 - (k - 1) * 0.06) / 0.06), cl(ate * n - (k - 1)));
    css += `#${p}__linha-${k}o-km{stroke-dasharray:1 1;stroke-dashoffset:${1 - pk}}`;
  }
  const rel = cl((t - 0.05) / 0.25);
  css += `#${p}__dia-e-relatorio{opacity:${rel};transform:translateY(${(1 - rel) * 14}px)}`;
  return <SvgFigma p={p} x={x} y={y + dy} css={css} op={op} />;
};

/** sombra de leitura (o mesmo degradê suave dos estados do Figma) */
export const Sombra: React.FC<{ y: number; h: number; op: number; deCima?: boolean }> = ({ y, h, op, deCima }) =>
  op <= 0 ? null : (
    <div style={{ ...ABS, left: 0, top: y, width: 1080, height: h, opacity: op, background: `linear-gradient(${deCima ? "0deg" : "180deg"}, rgba(17,20,24,0) 0%, rgba(17,20,24,0.72) 100%)` }} />
  );

/** Cartão do treino: a versão apagada e a acesa são as duas exportações do Figma; cada número rola na própria janela (14 q). */
const REG = {
  tempo: { x: 180, y: 39, w: 375, h: 120, sub: { x: 192, y: 156, w: 351 } },
  dist: { x: 72, y: 222, w: 198, h: 120, sub: { x: 84, y: 339, w: 174 } },
  ritmo: { x: 318, y: 222, w: 228, h: 120, sub: { x: 330, y: 339, w: 204 } },
};
export const CartaoTreino: React.FC<{ r: Ret; rolos: Record<keyof typeof REG, number>; sombra?: number }> = ({ r, rolos, sombra = 0 }) => {
  const k = r.w / 864;
  return (
    <div style={{ ...ABS, left: r.x, top: r.y, width: 864, height: 372, transform: `scale(${k})`, transformOrigin: "0 0", filter: sombra > 0 ? `drop-shadow(0 ${24 * sombra}px ${40 * sombra}px rgba(0,0,0,${0.45 * sombra}))` : undefined }}>
      <Img src={staticFile("v9/figma/cartao_branco.png")} style={{ ...ABS, left: 0, top: 0, width: 864, height: 372 }} />
      {(Object.keys(REG) as (keyof typeof REG)[]).map((m) => {
        const g = REG[m], p = cl(rolos[m]);
        if (p <= 0) return null;
        const ro = cl(p / 0.7), sb = cl((p - 0.6) / 0.4);
        return (
          <React.Fragment key={m}>
            <div style={{ ...ABS, left: g.x, top: g.y, width: g.w, height: g.h, overflow: "hidden" }}>
              <Img src={staticFile("v9/figma/cartao_branco.png")} style={{ ...ABS, left: -g.x, top: -g.y - ro * g.h, width: 864, height: 372 }} />
              <Img src={staticFile("v9/figma/cartao_aceso.png")} style={{ ...ABS, left: -g.x, top: -g.y + (1 - ro) * g.h, width: 864, height: 372 }} />
            </div>
            <div style={{ ...ABS, left: g.sub.x, top: g.sub.y, width: g.sub.w * sb, height: 7, background: COR.volt, borderRadius: 4 }} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** toque: ponto de 84 px a 16% + onda volt de 0 a 1,6x em 18 q */
export const Toque: React.FC<{ cx: number; cy: number; t: number }> = ({ cx, cy, t }) => {
  if (t < -0.1 || t > 0.6) return null;
  const pt = cl((t + 0.1) / 0.1) * (1 - cl((t - 0.25) / 0.2));
  const on = cl(t / 0.3);
  return (
    <>
      <div style={{ ...ABS, left: cx - 42, top: cy - 42, width: 84, height: 84, borderRadius: 42, background: `rgba(255,255,255,${0.16 * pt * 2})`, boxShadow: `0 0 0 2px rgba(17,20,24,${0.12 * pt})` }} />
      {t >= 0 && <div style={{ ...ABS, left: cx - 42, top: cy - 42, width: 84, height: 84, borderRadius: 42, border: `4px solid ${COR.volt}`, transform: `scale(${0.2 + 1.4 * on})`, opacity: 1 - on }} />}
    </>
  );
};

/** texto de título que sobe da máscara, linha a linha (Sofia Sans Extra Condensed Black) */
export const Linha: React.FC<{ txt: React.ReactNode; x: number; y: number; tam: number; alt: number; p: number; cor?: string; op?: number }> = ({ txt, x, y, tam, alt, p, cor = COR.creme, op = 1 }) =>
  p <= 0 ? null : (
    <div style={{ ...ABS, left: x, top: y, height: alt, overflow: "hidden", opacity: op }}>
      <div style={{ fontFamily: SOFIA, fontWeight: 900, fontSize: tam, lineHeight: `${alt}px`, color: cor, whiteSpace: "nowrap", transform: `translateY(${(1 - p) * alt}px)` }}>{txt}</div>
    </div>
  );
