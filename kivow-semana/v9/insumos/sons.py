# Kivow v9.2 · biblioteca sonora original, afinada no tom MEDIDO da trilha (grade.json). Roda na nuvem.
# Tudo determinístico (semente fixa). Saída em public/v9/sfx/*.wav (48 kHz, estéreo) + public/v9/sfx/manifesto.json
import json, os, subprocess, urllib.request, time
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; OUT = "public/v9/sfx"; os.makedirs(OUT, exist_ok=True)
G = json.load(open("v9/insumos/medidas/grade.json"))
TON = G["tom"]["indice"]; MENOR = G["tom"]["modo"] == "menor"
TERCA = 3 if MENOR else 4
def hz(semi, oct=4): return 440.0 * 2 ** ((TON - 9 + semi) / 12 + (oct - 4))
RAIZ, TER, QUI, NONA = 0, TERCA, 7, 14
man = {"tom": f"{G['tom']['tonica']} {G['tom']['modo']}", "arquivos": {}}

def T(d): return np.arange(int(d * SR)) / SR
def rng(s): return np.random.default_rng(s)
def filt(x, kind, f, o=2):
    w = np.asarray(f, float) / (SR / 2); w = float(w) if w.ndim == 0 else w
    sos = butter(o, w, btype=kind, output="sos"); return sosfilt(sos, x)
def env(n, a, tau, hold=0.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4))
    return e * np.where(t < a + hold, 1, np.exp(-(t - a - hold) / tau))
def tom(f, d, tau, a=0.002, parc=((1, 1, 1),), glide=None):
    t = T(d); y = np.zeros_like(t)
    for mult, amp, taum in parc:
        ff = f * mult * (1 if glide is None else 2 ** (glide[0] * np.exp(-t / glide[1]) / 12))
        ph = 2 * np.pi * np.cumsum(ff) / SR
        y += amp * np.sin(ph) * env(len(t), a, tau * taum)
    return y
def soma(*xs):
    n = max(len(x) for x in xs); return np.sum([np.r_[x, np.zeros(n - len(x))] for x in xs], 0)
def ruido(d, s): return rng(s).standard_normal(int(d * SR))
def malho(f, d=0.6, tau=0.32):  # nota de "dado": madeira/vidro macio
    return tom(f, d, tau, 0.002, ((1, 1, 1), (3.9, .22, .22), (9.2, .05, .1)))
def vidro(f, d=0.35, tau=0.12):
    return tom(f, d, tau, 0.001, ((1, 1, 1), (2.0, .3, .6), (3.0, .1, .4)))
def estereo(x, p=0.0):
    a = (p + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1)
def pan_mov(x, p0, p1):
    p = np.linspace(p0, p1, len(x)); a = (p + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1)
def reverb(st, rt=0.9, mix=0.2, s=7):
    n = int(rt * SR); t = np.arange(n) / SR; out = st.copy()
    for c in range(2):
        ir = filt(rng(s + c).standard_normal(n), "low", 6000) * np.exp(-6.9 * t / rt); ir /= np.sqrt((ir ** 2).sum())
        wet = fftconvolve(st[:, c], ir)[: len(st)]; out[:, c] = st[:, c] * (1 - mix) + wet * mix
    return out
def junta(*partes):  # (inicio_s, estereo)
    n = max(int(a * SR) + len(x) for a, x in partes); y = np.zeros((n, 2))
    for a, x in partes: i = int(a * SR); y[i:i + len(x)] += x
    return y
def cauda(x, s=0.5):
    n = int(s * SR); x = np.r_[x, np.zeros((n, 2))] if x.ndim == 2 else x; return x
def salva(nome, st, pico_db=-3.0, grupo="UI", nota=""):
    if st.ndim == 1: st = estereo(st)
    st = st - st.mean(0); st[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
    st[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))[:, None]
    st = st / (np.abs(st).max() + 1e-9) * 10 ** (pico_db / 20)
    sf.write(f"{OUT}/{nome}.wav", st.astype(np.float32), SR, subtype="PCM_24")
    man["arquivos"][nome] = {"dur_s": round(len(st) / SR, 3), "grupo": grupo, "nota": nota}

def baque(f0=110, d=0.5, tau=0.09, glide=7, s=1):
    corpo = tom(f0, d, tau, 0.0015, ((1, 1, 1), (0.5, .45, 1.3)), glide=(glide, 0.012))
    borr = filt(ruido(0.012, s), "band", [1200, 3500]) * env(int(0.012 * SR), 0.0005, 0.003) * 0.25
    return np.r_[borr, np.zeros(len(corpo) - len(borr))] + corpo
def varrida(d, f0, f1, s, picos=6, curva=1.0):
    n = int(d * SR); x = ruido(d, s); y = np.zeros(n); cs = np.geomspace(f0, f1, picos)
    for k, c in enumerate(cs):
        w = np.zeros(n); cen = (k + .5) / picos; t = np.arange(n) / n
        w = np.exp(-((t ** curva - cen) / (0.7 / picos)) ** 2)
        y += filt(x, "band", [c / 1.35, c * 1.35]) * w
    return y
def acorde(graus, oct=4, d=2.0, tau=0.9, atraso=0.015, timbre=malho):
    return np.sum([np.r_[np.zeros(int(i * atraso * SR)), timbre(hz(g, oct), d, tau)][: int(d * SR)] for i, g in enumerate(graus)], 0)

f_k = hz(RAIZ, 2) if hz(RAIZ, 2) >= 80 else hz(RAIZ, 3)
# 1 · Toque do K (assinatura): grave seco com ataque de borracha.
salva("k_toque", reverb(estereo(baque(f_k, 0.6, 0.11)), 0.5, 0.08), -4, "UI", f"{f_k:.1f} Hz")
# 1b · Toque do K resolvido no maior (rima sonora do fim): o mesmo toque + tríade maior da tônica.
res = np.r_[baque(f_k, 2.4, 0.11), np.zeros(0)]
ch = acorde([RAIZ, 4, 7, 12], 4, 2.4, 1.1, 0.03)
salva("k_toque_resolvido", reverb(estereo(res + 0.55 * ch), 1.6, 0.28), -3, "UI", "tríade maior da tônica")
# 2 · Acorde dos dados: três notas, da grave para a aguda.
for i, g in enumerate([RAIZ, TER, QUI]): salva(f"dado_{i+1}", reverb(estereo(malho(hz(g, 4)), [-.25, 0, .25][i]), 0.7, 0.15), -6)
# 3 · Descolar e encaixar.
pop = tom(250, 0.25, 0.045, 0.001, glide=(-8, 0.03)) + 0.35 * filt(ruido(0.25, 3), "band", [1500, 6000]) * env(int(.25 * SR), 0.01, 0.06)
salva("pop_descolar", reverb(estereo(pop), 0.5, 0.12), -6)
enc = junta((0, estereo(filt(ruido(0.03, 4), "band", [2000, 5000]) * env(int(.03 * SR), .0005, .003) * .6)),
            (0.018, estereo(filt(ruido(0.03, 5), "band", [1800, 4500]) * env(int(.03 * SR), .0005, .004))),
            (0.018, estereo(tom(160, 0.2, 0.025))))
salva("encaixe", enc, -8)
# 4 · Deslize de vidro (celular subindo): ruído afinado do grave ao médio + corpo.
dv = varrida(0.5, 700, 2600, 6) * env(int(.5 * SR), 0.18, 0.12, 0.1) + 0.25 * tom(180, 0.5, 0.2, 0.15, glide=None)
salva("deslize_vidro", reverb(pan_mov(dv, -.1, .1), 0.6, 0.15), -9)
dl = varrida(0.32, 900, 2400, 7) * env(int(.32 * SR), 0.08, 0.08, 0.06)
salva("deslize_lateral", reverb(pan_mov(dl, -.6, .5), 0.5, 0.12), -10)
# 5 · Toque com corpo e notificação original do Kivow (quinta e oitava, nunca a do sistema).
tq = soma(baque(118, 0.3, 0.045, 5, 8), 0.3 * vidro(2200, 0.12, 0.02))
salva("toque", reverb(estereo(tq, .15), 0.4, 0.1), -6)
nt = junta((0, estereo(vidro(hz(QUI, 5), 0.5, 0.16))), (0.11, estereo(vidro(hz(RAIZ, 6), 0.7, 0.24))))
salva("notificacao", reverb(nt, 0.9, 0.22), -6)
# 6 · Mensagens: três tons em terças subindo; a terceira fecha a tríade.
for i, g in enumerate([RAIZ, TER, QUI]):
    m = junta((0, estereo(vidro(hz(g, 5), 0.2, 0.05))), (0.07, estereo(vidro(hz(g + 12, 5), 0.3, 0.08))))
    salva(f"mensagem_{i+1}", reverb(m, 0.6, 0.15), -9)
# 7 · Conexão: duas notas em lados opostos que se aproximam e viram um acorde no centro (1,30 s até o encontro).
dA = 2.6; a = tom(hz(RAIZ, 4), dA, 9, 0.25, ((1, 1, 1), (2, .2, 1))); b = tom(hz(QUI, 4), dA, 9, 0.25, ((1, 1, 1), (2, .2, 1)))
n1 = int(1.3 * SR); pa = np.r_[np.linspace(-.7, 0, n1), np.zeros(len(a) - n1)]; pb = -pa
sw = np.r_[np.linspace(.3, 1, n1), np.exp(-np.arange(len(a) - n1) / SR / 0.7)]
A = np.stack([a * sw * np.cos((pa + 1) * np.pi / 4), a * sw * np.sin((pa + 1) * np.pi / 4)], 1)
B = np.stack([b * sw * np.cos((pb + 1) * np.pi / 4), b * sw * np.sin((pb + 1) * np.pi / 4)], 1)
flor = soma(np.zeros(len(a)), np.r_[np.zeros(n1), acorde([TER, 12], 4, dA - 1.3, 0.8, 0.02)])[: len(a)]
salva("conexao", reverb(A + B + estereo(0.5 * flor), 1.2, 0.25), -6, "UI", "encontro em 1,30 s")
# 8 · Desafio: bumbo de referência, brilho do Dono, tique, perseguição, impacto do "12 s".
salva("bumbo_ref", reverb(estereo(baque(52, 0.8, 0.25, 9, 9)), 0.6, 0.1), -3, "IM")
br = np.sum([tom(f, 0.8, 0.22, 0.004) * w for f, w in [(3100, .5), (4700, .35), (6200, .25), (8300, .12)]], 0)
salva("brilho_dono", reverb(estereo(br), 1.0, 0.3), -14)
salva("tique", estereo(vidro(2600, 0.08, 0.012)), -12)
pc = junta(*[(k * 0.12, estereo(vidro(hz([RAIZ, TER, QUI, 12][k], 6), 0.1, 0.02) * (0.45 + 0.18 * k))) for k in range(4)],
           (0, estereo(varrida(0.36, 600, 5000, 11, 5) * np.linspace(.05, .5, int(.36 * SR)))))
pc = pc[: int(0.36 * SR)]
salva("perseguicao", pc, -9, "UI", "4 semicolcheias, termina seco em 0,36 s")
imp = baque(48, 1.2, 0.32, 12, 12) + 0.5 * filt(ruido(1.2, 13), "low", 700) * env(int(1.2 * SR), 0.001, 0.05)
salva("impacto_12s", reverb(estereo(imp), 0.7, 0.12), -1.5, "IM")
# 9 · Portal: sucção de 0,40 s e impacto grave curto na batida.
su = varrida(0.4, 300, 4000, 14, 6, 0.8) * np.linspace(0, 1, int(.4 * SR)) ** 2.2
salva("portal_succao", reverb(estereo(su), 0.4, 0.1), -6, "IM")
pi = soma(baque(58, 1.0, 0.22, 10, 15), 0.35 * varrida(0.4, 3000, 400, 16, 4) * env(int(.4 * SR), .002, .08))
salva("portal_impacto", reverb(estereo(pi), 0.8, 0.14), -1.5, "IM")
# 10 · Traço da linha do K (fricção subindo, curta e baixa) e repiques km a km.
tr = varrida(1.8, 900, 2600, 17, 8) * env(int(1.8 * SR), 0.3, 0.4, 1.0) * 0.6
salva("traco", estereo(tr), -20)
km = junta(*[(k * 0.06, estereo(vidro(hz([RAIZ, TER, QUI][k % 3] + 12 * (k // 3), 5), 0.06, 0.012), -.4 + .1 * k)) for k in range(9)])
salva("km_tiques", km, -16)
# 11 · Mergulho: ar para dentro, acelerando (exponencial) até o corte.
wh = varrida(0.75, 250, 3200, 18, 7, 0.6) * (np.linspace(0, 1, int(.75 * SR)) ** 3)
salva("mergulho", reverb(estereo(wh), 0.6, 0.18), -4, "IM")
wh2 = soma(np.r_[wh, np.zeros(int(1.6 * SR))], 0.5 * np.r_[np.zeros(int(0.7 * SR)), acorde([RAIZ, QUI, NONA], 4, 1.65, 0.9, 0.04)])
salva("mergulho_abertura", reverb(estereo(wh2), 1.4, 0.25), -4, "IM", "whoosh + abertura harmônica")
salva("varrida_filtro", reverb(estereo(varrida(0.7, 5000, 400, 19, 6) * env(int(.7 * SR), .05, .25, .2)), 0.6, 0.15), -8, "IM")
# 12 · Ranking: placa assentando (uma por colcheia).
salva("placa", reverb(estereo(soma(baque(220, 0.25, 0.04, 3, 20), 0.2 * vidro(1700, 0.1, 0.02))), 0.4, 0.1), -10)
# 13 · Cuida e SOS: folha, pulso grave contínuo, três sinais que sobem, alívio. Sem sirene, sem "enviado".
fs = varrida(0.45, 200, 900, 21, 5) * env(int(.45 * SR), 0.12, 0.12, 0.1) + 0.4 * tom(110, 0.45, 0.2, 0.1)
salva("folha_sobe", reverb(estereo(fs), 0.5, 0.12), -10)
salva("folha_desce", reverb(estereo(varrida(0.4, 900, 200, 22, 5) * env(int(.4 * SR), .05, .15, .08)), 0.5, 0.12), -12)
t3 = T(3.0); pul = np.sin(2 * np.pi * hz(RAIZ, 2) * t3) * (0.55 + 0.45 * np.sin(2 * np.pi * 1.0 * t3 - np.pi / 2)) * np.minimum(1, t3 / 0.15)
salva("sos_pulso", estereo(pul + 0.3 * np.sin(2 * np.pi * hz(RAIZ, 3) * t3) * np.minimum(1, t3 / .15)), -8, "UI", "3,00 s exatos")
for i, g in enumerate([RAIZ, TER, QUI]): salva(f"sos_sinal_{i+1}", reverb(estereo(vidro(hz(g, 5), 0.45, 0.14)), 0.8, 0.2), -8)
alv = acorde([RAIZ, 4, 7], 4, 1.8, 0.8, 0.025) + 0.15 * filt(ruido(1.8, 23), "band", [400, 1600]) * env(int(1.8 * SR), 0.2, 0.4)
salva("sos_alivio", reverb(estereo(alv), 1.3, 0.3), -8, "UI", "alívio, maior")
salva("contato_tique", junta((0, estereo(vidro(3000, 0.06, 0.01), -.2)), (0.07, estereo(vidro(3400, 0.06, 0.01), .2))), -14)
salva("ao_vivo", estereo(vidro(hz(QUI, 6), 0.12, 0.03)), -20)
# 14 · Fecho: quatro rotas (passos, ar, folhas, eco) e a assinatura sonora do Kivow.
passos = junta(*[(k * 0.15, estereo(baque(90, 0.15, 0.03, 4, 30 + k) + 0.4 * filt(ruido(0.15, 40 + k), "band", [1500, 5000]) * env(int(.15 * SR), .001, .01), -.3 + .2 * (k % 2))) for k in range(4)])
salva("rota_pista", passos, -12)
salva("rota_orla", reverb(estereo(filt(ruido(0.7, 50), "band", [300, 1800]) * env(int(.7 * SR), 0.25, 0.2, 0.1), .3), 0.6, 0.2), -14)
fol = np.zeros(int(0.7 * SR)); r = rng(51)
for k in range(28):
    i = int(r.uniform(0, 0.6) * SR); fol[i:i + 240] += filt(r.standard_normal(240), "band", [2500, 8000]) * np.hanning(240) * r.uniform(.3, 1)
salva("rota_parque", estereo(fol, -.2), -16)
eco = np.r_[baque(140, 0.2, 0.03, 4, 52), np.zeros(int(1.6 * SR))]
salva("rota_estadio", reverb(estereo(eco, .3), 2.2, 0.55), -12)
asg = junta((0, estereo(baque(f_k, 2.6, 0.12))), (0, estereo(0.6 * acorde([RAIZ, 4, 7, 12, 16], 4, 2.6, 1.2, 0.035))),
            (0, estereo(0.18 * filt(ruido(2.6, 53), "band", [300, 1200]) * env(int(2.6 * SR), 0.01, 0.6))))
salva("assinatura_kivow", reverb(asg, 2.0, 0.3), -2, "IM", "quatro rotas + toque do K, maior, 1,2 s + cauda")
for i, g in enumerate([RAIZ, 2, TER, QUI, 9]): salva(f"alfabeto_{i+1}", estereo(vidro(hz(g, 6), 0.12, 0.025), -.4 + .2 * i), -18)

# 15 · Ambientes: ElevenLabs Sound Effects quando houver crédito; senão, síntese (registrada no manifesto).
AMB = {"am_pista": ("early morning running track ambience, very distant footsteps, soft breathing of a runner, calm, no music", 6),
       "am_orla": ("seaside promenade at dawn, gentle waves and light wind, distant runner footsteps, no music", 6),
       "am_parque": ("city park morning, leaves rustling, a few distant birds, one runner breathing steadily, no music", 6),
       "am_dupla": ("two friends running together on a waterfront path, footsteps in sync, a brief soft laugh, no music", 5)}
key = os.environ.get("ELEVENLABS_API_KEY", "")
def creditos():
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": key})))
        return d["character_limit"] - d["character_count"]
    except Exception as e: return -1
def sintetico(nome, d):
    r = rng(sum(map(ord, nome))); x = filt(r.standard_normal(int(d * SR)), "low", 900) * 0.4
    if nome in ("am_orla",): x += filt(r.standard_normal(int(d * SR)), "band", [200, 1200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.14 * T(d)))
    if nome in ("am_pista", "am_dupla"):
        for k in range(int(d * 2.8)):
            i = int(k / 2.8 * SR); seg = 0.5 * baque(80, 0.05, 0.02, 3, k)[:2400]; m = min(len(seg), len(x) - i); x[i:i + m] += seg[:m]
    return estereo(x)
for nome, (txt, d) in AMB.items():
    fonte = "síntese"
    c0 = creditos() if key else -1
    if c0 > 400:
        try:
            req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
                                         data=json.dumps({"text": txt, "duration_seconds": d, "prompt_influence": 0.45}).encode(),
                                         headers={"xi-api-key": key, "Content-Type": "application/json"})
            open(f"{OUT}/{nome}.mp3", "wb").write(urllib.request.urlopen(req, timeout=120).read())
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{OUT}/{nome}.mp3", "-ar", str(SR), "-ac", "2", f"{OUT}/{nome}.wav"], check=True)
            os.remove(f"{OUT}/{nome}.mp3"); fonte = f"ElevenLabs SFX (créditos antes {c0}, depois {creditos()})"
            st, _ = sf.read(f"{OUT}/{nome}.wav"); salva(nome, st, -6, "AM", fonte); continue
        except Exception as e: fonte = f"síntese (ElevenLabs falhou: {e})"
    salva(nome, sintetico(nome, d), -12, "AM", fonte)

# 16 · Música: a faixa medida, cortada no compasso escolhido, e versões filtradas alinhadas amostra a amostra
#      (o Remotion só controla volume; o "filtro" é um cruzamento entre a faixa cheia e a filtrada).
INICIO = float(os.environ.get("TRILHA_INICIO", "nan"))
if INICIO != INICIO:  # nan: escolhe o compasso para o drop cair no 8º compasso depois da entrada
    # A faixa entra CHEIA na batida 0 do filme (3,80 s): começa no compasso do maior salto de energia medido.
    db = G["downbeats_arquivo_s"]; drop = G["saltos_de_energia"][0]["t"]; INICIO = min(db, key=lambda x: abs(x - drop))
man["trilha_inicio_arquivo_s"] = INICIO
for nome, af in {"trilha": "anull", "trilha_lp2500": "lowpass=f=2500,lowpass=f=2500", "trilha_lp900": "lowpass=f=900,lowpass=f=900"}.items():
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "public/voz/trilha_623.mp3", "-ss", f"{INICIO:.4f}", "-t", "52",
                    "-af", f"{af},afade=t=in:d=0.004", "-ar", str(SR), "-ac", "2", f"{OUT}/{nome}.wav"], check=True)
# 17 · Voz em trechos com corte na amostra (os cortes caem em silêncio medido).
for nome, a, b in [("voz_A", 0, 37.40), ("voz_B", 37.40, 39.53), ("voz_C", 39.53, 40.90), ("voz_D1", 40.90, 43.54), ("voz_D2", 43.54, 45.10)]:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "public/voz/narracao_grok.mp3", "-ss", f"{a}", "-t", f"{b-a:.3f}",
                    "-af", "afade=t=in:d=0.005,areverse,afade=t=in:d=0.005,areverse", "-ar", str(SR), "-ac", "2", f"{OUT}/{nome}.wav"], check=True)
json.dump(man, open(f"{OUT}/manifesto.json", "w"), indent=1, ensure_ascii=False)
print(json.dumps(man, ensure_ascii=False, indent=1)[:3000])
