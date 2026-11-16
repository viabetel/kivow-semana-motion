# Kivow v9.2 · QA das prévias (roda na nuvem depois do render). Nada aqui é declarado: tudo é medido no arquivo exportado.
# 1) master: um ganho único para as 4 prévias (−14 LUFS integrado no conjunto) + limitador de pico real em −1 dBTP
# 2) som: LUFS, pico real, LRA, clipping, soma mono, correlação de fase, inteligibilidade (STOI) no mix e no "alto-falante de celular"
# 3) movimento: diferença entre quadros (saltos isolados), pausas > 1,5 s
# 4) leitura real: OCR a 360 x 450 nos quadros de leitura
# 5) folhas de contato a 4 q/s
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

OUT = "entregas/v9.2"; os.makedirs(OUT, exist_ok=True)
PREV = json.load(open("v9/qa/previas.json"))
sh = lambda *a: subprocess.run(a, capture_output=True, text=True)
def ebur(path, extra=""):
    r = sh("ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", f"{extra}ebur128=peak=true", "-f", "null", "-").stderr
    g = lambda pat: float(re.findall(pat, r)[-1])
    return {"I": g(r"I:\s+(-?[\d.]+) LUFS"), "TP": g(r"Peak:\s+(-?[\d.]+) dBFS"), "LRA": g(r"LRA:\s+(-?[\d.]+) LU")}

# ---------- 1. master ----------
for p in PREV: sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"out/{p['id']}.mp4", "-vn", "-ac", "2", "-ar", "48000", f"out/{p['id']}.wav")
sh("ffmpeg", "-y", "-loglevel", "error", *sum([["-i", f"out/{p['id']}.wav"] for p in PREV], []), "-filter_complex",
   "".join(f"[{i}:a]" for i in range(len(PREV))) + f"concat=n={len(PREV)}:v=0:a=1[a]", "-map", "[a]", "out/todas.wav")
antes = ebur("out/todas.wav"); ganho = -14.0 - antes["I"]
rel = {"master": {"lufs_conjunto_antes": antes["I"], "ganho_db": round(ganho, 2)}, "previas": {}}
for p in PREV:
    i = p["id"]
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"out/{i}.mp4", "-af", f"volume={ganho:.2f}dB,alimiter=limit=0.83:attack=1:release=60:level=disabled",
       "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", f"{OUT}/kivow_v9.2_{i}.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"{OUT}/kivow_v9.2_{i}.mp4", "-vn", "-ac", "2", "-ar", "48000", f"out/{i}_m.wav")
    m = ebur(f"out/{i}_m.wav"); mono = ebur(f"out/{i}_m.wav", "pan=mono|c0=0.5*c0+0.5*c1,")
    x, sr = sf.read(f"out/{i}_m.wav")
    clip = int((np.abs(x) >= 0.999).sum())
    L, R = x[:, 0], x[:, 1]; corr = float(np.corrcoef(L, R)[0, 1]) if L.std() > 0 and R.std() > 0 else 1.0
    # voz isolada da mesma janela (os trechos da narração nas mesmas posições do filme) para o STOI
    a, b = p["de_s"], p["ate_s"]
    voz = np.zeros(int((b - a) * 48000) + 1)
    for v in json.load(open("v9/qa/voz.json")):
        y, _ = sf.read(f"public/v9/sfx/{v['arq']}.wav"); y = y.mean(1) if y.ndim > 1 else y
        ini = v["q"] / 60 - a; i0 = int(round(ini * 48000))
        s0 = max(0, -i0); d0 = max(0, i0); n = min(len(y) - s0, len(voz) - d0)
        if n > 0: voz[d0:d0 + n] += y[s0:s0 + n]
    mix = x.mean(1)[: len(voz)]; voz = voz[: len(mix)]
    stoi = stoi_cel = None
    if np.abs(voz).max() > 1e-4:
        from pystoi import stoi as STOI
        from scipy.signal import butter, sosfilt, resample_poly
        ativo = np.abs(voz) > 1e-4
        stoi = round(float(STOI(voz, mix, 48000, extended=False)), 3)
        sos = butter(4, [300, 7000], btype="band", fs=48000, output="sos")
        stoi_cel = round(float(STOI(voz, sosfilt(sos, mix), 48000, extended=False)), 3)
    rel["previas"][i] = {"janela_s": [a, b], "LUFS_I": m["I"], "pico_real_dBTP": m["TP"], "LRA": m["LRA"], "amostras_clipadas": clip,
                         "mono_LUFS": mono["I"], "perda_na_soma_mono_dB": round(m["I"] - mono["I"], 2), "correlacao_LR": round(corr, 3),
                         "STOI_voz_no_mix": stoi, "STOI_alto_falante_celular": stoi_cel}

# ---------- 3. movimento: diferença entre quadros ----------
for p in PREV:
    i = p["id"]
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"out/{i}.mp4", "-vf", "scale=270:338,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 338, 270).astype(np.float32)
    d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
    med = np.convolve(d, np.ones(9) / 9, "same")
    picos = [(int(k + 1), round(float(d[k]), 2), round(float(med[k]), 2)) for k in range(len(d)) if d[k] > 6 and d[k] > 3.5 * max(med[k], 0.5)]
    parado = d < 0.15; maior = cur = 0
    for v in parado: cur = cur + 1 if v else 0; maior = max(maior, cur)
    rel["previas"][i].update({"saltos_isolados": [{"quadro_da_previa": a, "dif": b, "media_local": c} for a, b, c in picos][:12],
                              "maior_pausa_s": round(maior / 60, 2), "dif_media": round(float(d.mean()), 2), "dif_p95": round(float(np.percentile(d, 95)), 2)})
    # ---------- 5. folha de contato a 4 q/s ----------
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"out/{i}.mp4", "-vf", "fps=4,scale=216:-2,tile=8x5:padding=3:color=white", "-frames:v", "1", f"{OUT}/kivow_v9.2_{i}_folha.jpg")

# ---------- 4. leitura real a 360 px (OCR) ----------
import pytesseract
from PIL import Image
for p in PREV:
    for chk in p.get("leitura", []):
        img = f"out/ocr_{p['id']}_{chk['q']}.png"
        sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"out/{p['id']}.mp4", "-vf", f"select=eq(n\\,{chk['q'] - p['q0']}),scale=360:450", "-frames:v", "1", img)
        txt = pytesseract.image_to_string(Image.open(img).resize((1080, 1350), Image.LANCZOS), lang="por")
        norm = lambda s: re.sub(r"[^A-Z0-9:]", "", s.upper().replace("Ã", "A").replace("Á", "A").replace("É", "E"))
        rel["previas"][p["id"]].setdefault("leitura_360", []).append({"quadro": chk["q"], "esperado": chk["txt"], "leu": norm(chk["txt"]) in norm(txt)})

json.dump(rel, open(f"{OUT}/qa.json", "w"), indent=1, ensure_ascii=False)
with open(f"{OUT}/qa.md", "w") as f:
    f.write(f"# QA medido · prévias v9.2\n\nMaster: conjunto a {antes['I']} LUFS antes; ganho único de {ganho:+.2f} dB e limitador de pico real.\n\n")
    f.write("| Prévia | LUFS I | Pico real | LRA | Clipadas | Mono (perda) | Corr L/R | STOI mix | STOI celular | Saltos | Maior pausa |\n|---|---|---|---|---|---|---|---|---|---|---|\n")
    for k, v in rel["previas"].items():
        f.write(f"| {k} | {v['LUFS_I']} | {v['pico_real_dBTP']} | {v['LRA']} | {v['amostras_clipadas']} | {v['perda_na_soma_mono_dB']} dB | {v['correlacao_LR']} | {v['STOI_voz_no_mix']} | {v['STOI_alto_falante_celular']} | {len(v['saltos_isolados'])} | {v['maior_pausa_s']} s |\n")
    f.write("\nLeitura a 360 px (OCR):\n")
    for k, v in rel["previas"].items():
        for c in v.get("leitura_360", []): f.write(f"- {k} q{c['quadro']}: \"{c['esperado']}\" {'lido' if c['leu'] else 'NÃO lido'}\n")
print(open(f"{OUT}/qa.md").read())
