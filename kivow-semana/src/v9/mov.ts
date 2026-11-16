// Kivow v9.2 · primitivas de movimento determinísticas (função pura do quadro; nada guarda estado entre quadros).
import { FPS } from "./tempos";

export const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** progresso 0..1 entre dois tempos (s) no quadro f */
export const prog = (f: number, t0: number, t1: number) => cl((f / FPS - t0) / (t1 - t0));
export type Ease = (t: number) => number;
export const E = {
  lin: (t: number) => t,
  ioC: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  oC: (t: number) => 1 - Math.pow(1 - t, 3),
  oQ: (t: number) => 1 - Math.pow(1 - t, 4),
  iC: (t: number) => t * t * t,
  oExp: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // aceleração exponencial sem overshoot (mergulhos): começa quase parado, chega na velocidade máxima no corte
  iExp: (t: number) => (t <= 0 ? 0 : (Math.pow(2, 8 * t) - 1) / 255),
  hermite: (t: number) => t * t * (3 - 2 * t),
  // mergulho: acelera em u³ e pousa em (1-u)⁴, com valor e velocidade contínuos em u = 0,45 (pico de 3,48x a média); termina com velocidade zero
  mergulho: (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.45 ? 5.727 * t * t * t : 1 - 5.228 * Math.pow(1 - t, 4)),
  suave: (t: number) => t * t * t * (t * (6 * t - 15) + 10),
};
/** mola amortecida (forma fechada): 0 -> 1, pode passar de 1 quando zeta < 1 */
export const mola = (f: number, t0: number, zeta = 0.8, w = 12) => {
  const t = f / FPS - t0;
  if (t <= 0) return 0;
  if (zeta >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};
/** trilha de chaves: [tempo_s, valor, easing do trecho que CHEGA nessa chave] */
export type Chave = [number, number, Ease?];
export const trilha = (f: number, ks: Chave[]) => {
  const t = f / FPS;
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1];
      const [t1, v1, e] = ks[i];
      return mix(v0, v1, (e ?? E.ioC)((t - t0) / (t1 - t0)));
    }
  }
  return ks[ks.length - 1][1];
};
/** deriva entre acontecimentos, em px por SEGUNDO (limite do projeto: 6 px/s) */
export const deriva = (f: number, t0: number, pxPorS: number) => Math.max(0, f / FPS - t0) * pxPorS;

export type Ret = { x: number; y: number; w: number; h: number };
export const mixRet = (a: Ret, b: Ret, t: number): Ret => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
/** foto em tela cheia: geometria base do Figma escalada z vezes em torno do próprio centro */
export const zoomRet = (r: Ret, z: number): Ret => ({ x: r.x + (r.w * (1 - z)) / 2, y: r.y + (r.h * (1 - z)) / 2, w: r.w * z, h: r.h * z });

/** transformação do celular: O = origem da tela (canto sup. esq.) no quadro; s = escala (tela 980 x 2120) */
export type Cel = { ox: number; oy: number; s: number };
/** retângulo em coordenadas da TELA -> quadro */
export const naTela = (c: Cel, r: Ret): Ret => ({ x: c.ox + r.x * c.s, y: c.oy + r.y * c.s, w: r.w * c.s, h: r.h * c.s });
/** celular a partir do retângulo da camada "Celular" do Figma (imagem 1946 x 3088, tela em 483, 262) */
export const doFigma = (x: number, y: number, larg: number): Cel => {
  const s = larg / 1946;
  return { ox: x + 483 * s, oy: y + 262 * s, s };
};
/** zoom com ponto fixo: vai de A a B como um mergulho de verdade (o ponto que não se move é calculado, não chutado) */
export const mergulho = (a: Cel, b: Cel, p: number): Cel => {
  const s = a.s * Math.pow(b.s / a.s, p);
  const qx = (a.ox - b.ox) / (b.s - a.s), qy = (a.oy - b.oy) / (b.s - a.s);
  const Qx = a.ox + a.s * qx, Qy = a.oy + a.s * qy;
  return { ox: Qx - s * qx, oy: Qy - s * qy, s };
};
export const mixCel = (a: Cel, b: Cel, t: number): Cel => ({ ox: mix(a.ox, b.ox, t), oy: mix(a.oy, b.oy, t), s: mix(a.s, b.s, t) });
