# Kivow v9.2 · mapas de profundidade (Depth Anything V2 Small) e mapas de deslocamento do push-in. Roda na nuvem.
# Nada de recorte: a foto inteira se desloca no máximo poucos pixels conforme a profundidade, suavizada.
# Saída: public/v9/prof/<foto>_desloc.png (R = x, G = y, 128 = parado) e v9/insumos/medidas/profundidade.jpg (prova)
import os, json
import numpy as np
from PIL import Image, ImageFilter
from transformers import pipeline

FOTOS = ["pista", "orla", "parque", "dupla", "juntos"]
os.makedirs("public/v9/prof", exist_ok=True); os.makedirs("v9/insumos/medidas", exist_ok=True)
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
provas, info = [], {}
for nome in FOTOS:
    im = Image.open(f"public/v9/fotos/{nome}.jpg").convert("RGB")
    W, H = im.size; esc = 1600 / max(W, H); w, h = round(W * esc), round(H * esc)
    d = np.array(pipe(im.resize((w, h), Image.LANCZOS))["depth"].resize((w, h), Image.BILINEAR), np.float32)
    d = (d - np.percentile(d, 2)) / (np.percentile(d, 98) - np.percentile(d, 2) + 1e-6)
    d = np.clip(d, 0, 1)  # 1 = perto
    # Suaviza para o deslocamento nunca rasgar bordas (sigma ~1,5% da largura).
    d = np.array(Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(w * 0.015)), np.float32) / 255
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2; R = max(w, h) / 2
    # O push-in aproxima mais o que está perto: a amostra vem do lado do centro, na proporção da proximidade.
    dx = -(xx - cx) / R * d; dy = -(yy - cy) / R * d
    m = max(np.abs(dx).max(), np.abs(dy).max(), 1e-6); dx /= m; dy /= m
    rgb = np.stack([128 + 127 * dx, 128 + 127 * dy, np.full_like(dx, 128)], -1).astype(np.uint8)
    Image.fromarray(rgb).save(f"public/v9/prof/{nome}_desloc.png", optimize=True)
    info[nome] = {"w": w, "h": h, "perto_medio": round(float(d.mean()), 3)}
    pv = Image.fromarray((d * 255).astype(np.uint8)).convert("RGB").resize((400, round(400 * h / w)))
    provas.append((im.resize((400, round(400 * h / w))), pv))
alt = max(a.size[1] for a, _ in provas)
folha = Image.new("RGB", (820, (alt + 10) * len(provas)), "white")
for i, (a, b) in enumerate(provas):
    folha.paste(a, (0, i * (alt + 10))); folha.paste(b, (420, i * (alt + 10)))
folha.save("v9/insumos/medidas/profundidade.jpg", quality=85)
json.dump(info, open("v9/insumos/medidas/profundidade.json", "w"), indent=1)
print(info)
