# Kivow v9.2 · medição real da trilha (Mixkit 623) e da voz. Roda na nuvem (GitHub Actions).
# Saída: v9/insumos/medidas/grade.json, medidas.md e trilha.png
import json, os, subprocess, re
import numpy as np, librosa
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt

OUT = "v9/insumos/medidas"; os.makedirs(OUT, exist_ok=True)
TRILHA, VOZ = "public/voz/trilha_623.mp3", "public/voz/narracao_grok.mp3"
SR, HOP = 44100, 256

def ebur(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
    lra = float(re.findall(r"LRA:\s+(-?[\d.]+) LU", r)[-1])
    return {"lufs_integrado": i, "true_peak_dbtp": tp, "lra": lra}

y, sr = librosa.load(TRILHA, sr=SR, mono=True)
dur = len(y) / sr
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
tempo, bf = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=HOP, units="frames")
bt = librosa.frames_to_time(bf, sr=sr, hop_length=HOP)

# Grade por regressão: t_n = t0 + n*T, com rejeição de batidas fora (resíduo > 25 ms).
n = np.arange(len(bt)); ok = np.ones(len(bt), bool)
for _ in range(4):
    T, t0 = np.polyfit(n[ok], bt[ok], 1)
    res = bt - (t0 + T * n); ok = np.abs(res) < 0.025
T, t0 = np.polyfit(n[ok], bt[ok], 1); res = bt - (t0 + T * n)
bpm = 60 / T

# Compasso: a fase com mais grave (bumbo) e mais novidade harmônica nas batidas.
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
grave = S[freqs < 150].sum(0)
chroma = librosa.feature.chroma_stft(S=S**2, sr=sr)
nov = np.r_[0, np.linalg.norm(np.diff(chroma, axis=1), axis=0)]
def at(sig, t):
    f = int(round(t * sr / HOP)); return sig[max(0, f - 2):f + 3].max() if f < len(sig) else 0
grid = t0 + T * np.arange(int((dur - t0) / T) + 1)
fase = []
for p in range(4):
    g = grid[p::4]
    fase.append(float(np.mean([at(grave, t) for t in g]) / grave.mean() + np.mean([at(nov, t) for t in g]) / nov.mean()))
p0 = int(np.argmax(fase)); downbeats = grid[p0::4]

# Energia por compasso: onde a faixa "cai" (drop) e onde respira.
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
comp = []
for k in range(len(downbeats) - 1):
    a, b = downbeats[k], downbeats[k + 1]
    fa, fb = int(a * sr / HOP), int(b * sr / HOP)
    comp.append({"k": k, "t": round(float(a), 3),
                 "rms_db": round(float(20 * np.log10(rms[fa:fb].mean() + 1e-9)), 2),
                 "grave_db": round(float(20 * np.log10(grave[fa:fb].mean() + 1e-9)), 2)})
saltos = sorted([(comp[k]["grave_db"] - comp[k - 1]["grave_db"] + comp[k]["rms_db"] - comp[k - 1]["rms_db"], comp[k]["t"], k)
                 for k in range(1, len(comp))], reverse=True)[:6]

# Tom: Krumhansl-Kessler sobre o croma CQT médio.
cq = librosa.feature.chroma_cqt(y=y, sr=sr).mean(1)
maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NOMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
cands = []
for i in range(12):
    cands.append((float(np.corrcoef(cq, np.roll(maj, i))[0, 1]), NOMES[i], "maior", i))
    cands.append((float(np.corrcoef(cq, np.roll(mnr, i))[0, 1]), NOMES[i], "menor", i))
cands.sort(reverse=True)

# Voz: os cortes dos 4 trechos caem em silêncio?
yv, _ = librosa.load(VOZ, sr=SR, mono=True)
def janela_db(t, w=0.04):
    a, b = int((t - w) * SR), int((t + w) * SR); return float(20 * np.log10(np.sqrt(np.mean(yv[a:b] ** 2)) + 1e-9))
cortes = {str(t): round(janela_db(t), 1) for t in [37.40, 39.53, 40.90]}
pico_voz = float(20 * np.log10(np.sqrt(np.mean(yv[int(0.2 * SR):int(44 * SR)] ** 2)) + 1e-9))

g = {"bpm": round(float(bpm), 4), "periodo_s": float(T), "t0_arquivo_s": float(t0), "fase_compasso": p0,
     "residuo_ms": {"mediana": round(float(np.median(np.abs(res[ok]))) * 1000, 2), "p95": round(float(np.percentile(np.abs(res[ok]), 95)) * 1000, 2),
                    "batidas_usadas": int(ok.sum()), "batidas_total": int(len(bt))},
     "bpm_librosa": float(np.atleast_1d(tempo)[0]), "fase_scores": fase,
     "downbeats_arquivo_s": [round(float(x), 4) for x in downbeats],
     "tom": {"tonica": cands[0][1], "modo": cands[0][2], "indice": cands[0][3], "corr": round(cands[0][0], 3),
             "alternativas": [(c[1], c[2], round(c[0], 3)) for c in cands[1:4]]},
     "compassos": comp, "saltos_de_energia": [{"t": s[1], "k": s[2], "salto_db": round(s[0], 2)} for s in saltos],
     "duracao_trilha_s": round(dur, 3), "loudness_trilha": ebur(TRILHA), "loudness_voz": ebur(VOZ),
     "voz_duracao_s": round(len(yv) / SR, 3), "voz_rms_fala_db": round(pico_voz, 1), "voz_cortes_db": cortes}
json.dump(g, open(f"{OUT}/grade.json", "w"), indent=1, ensure_ascii=False)

fig, ax = plt.subplots(2, 1, figsize=(16, 7), sharex=True)
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=HOP)
ax[0].plot(t, 20 * np.log10(rms + 1e-9), lw=.6); ax[0].set_ylabel("RMS dB")
for d in downbeats: ax[0].axvline(d, color="r", lw=.3)
for s in saltos[:3]: ax[0].axvline(s[1], color="g", lw=1.5)
ax[1].plot(t, 20 * np.log10(grave + 1e-9), lw=.6, color="k"); ax[1].set_ylabel("grave < 150 Hz")
plt.tight_layout(); plt.savefig(f"{OUT}/trilha.png", dpi=90)

with open(f"{OUT}/medidas.md", "w") as f:
    f.write(f"# Medição real · Mixkit 623 e voz\n\nBPM {g['bpm']} (librosa {g['bpm_librosa']:.2f}); período {T*1000:.2f} ms = {T*60:.3f} quadros a 60 q/s.\n")
    f.write(f"Batida 0 do arquivo em {t0:.4f} s; fase do compasso {p0} (scores {[round(x,2) for x in fase]}).\n")
    f.write(f"Resíduo da grade: mediana {g['residuo_ms']['mediana']} ms, p95 {g['residuo_ms']['p95']} ms, {g['residuo_ms']['batidas_usadas']}/{g['residuo_ms']['batidas_total']} batidas.\n")
    f.write(f"Tom: {g['tom']['tonica']} {g['tom']['modo']} (r {g['tom']['corr']}); alternativas {g['tom']['alternativas']}.\n")
    f.write(f"Maiores saltos de energia (candidatos a drop): {g['saltos_de_energia']}.\n")
    f.write(f"Trilha: {g['loudness_trilha']}. Voz: {g['loudness_voz']}, {g['voz_duracao_s']} s.\n")
    f.write(f"Cortes da voz (RMS em ±40 ms, fala a {g['voz_rms_fala_db']} dB): {cortes}.\n\n| compasso | t (s) | RMS dB | grave dB |\n|---|---|---|---|\n")
    for c in comp: f.write(f"| {c['k']} | {c['t']} | {c['rms_db']} | {c['grave_db']} |\n")
print(open(f"{OUT}/medidas.md").read()[:1500])
