# Kivow v9.2 · SVGs exportados do Figma -> src/v9/svgs.ts
# ids com nome legível e prefixo por peça (dois SVGs na mesma página não colidem), imagens embutidas viram arquivo,
# traços ganham pathLength="1" para desenhar com stroke-dashoffset.
import re, html, json, os, base64, hashlib, unicodedata
BASE = os.path.dirname(os.path.abspath(__file__)) + "/../.."
FIG, IMG = f"{BASE}/public/v9/figma", f"{BASE}/public/v9/svg"
os.makedirs(IMG, exist_ok=True)
PECAS = ["sticker_pista", "sticker_orla", "sticker_parque", "sticker_dupla", "sticker_juntos", "trecho", "ranking", "ranking4", "cuida", "out03", "out04"]

def nome_limpo(s):
    s = html.unescape(s)
    try: s = s.encode("latin-1").decode("utf-8")
    except Exception: pass
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "x"

saida, ids_por_peca = [], {}
for p in PECAS:
    f = f"{FIG}/{p}.svg"
    if not os.path.exists(f): continue
    s = open(f, encoding="utf-8").read()
    mapa, usados = {}, {}
    for orig in re.findall(r'id="([^"]*)"', s):
        if orig in mapa: continue
        n = nome_limpo(orig); usados[n] = usados.get(n, 0) + 1
        mapa[orig] = f"{p}__{n}" + ("" if usados[n] == 1 else f"-{usados[n]}")
    s = re.sub(r'id="([^"]*)"', lambda m: f'id="{mapa[m.group(1)]}"', s)
    s = re.sub(r'url\(#([^)]*)\)', lambda m: f'url(#{mapa.get(m.group(1), m.group(1))})', s)
    s = re.sub(r'href="#([^"]*)"', lambda m: f'href="#{mapa.get(m.group(1), m.group(1))}"', s)
    def img(m):
        b = base64.b64decode(m.group(2)); h = hashlib.md5(b).hexdigest()[:12]; ext = "png" if m.group(1) == "png" else "jpg"
        open(f"{IMG}/{h}.{ext}", "wb").write(b); return f'href="__ESTATICO__v9/svg/{h}.{ext}"'
    s = re.sub(r'href="data:image/(png|jpeg);base64,([^"]+)"', img, s)
    s = re.sub(r'(<path [^>]*stroke="[^"]+"[^>]*?)(/?>)', lambda m: m.group(1) + ' pathLength="1"' + m.group(2) if "pathLength" not in m.group(1) else m.group(0), s)
    # vidro do ranking: o desfoque de fundo vira CSS no componente (foreignObject não desfoca o que está fora do SVG)
    s = re.sub(r"<foreignObject.*?</foreignObject>", "", s, flags=re.S)
    # o fundo do frame do Figma não pode tapar a foto nem o mapa por baixo (fecho)
    if p in ("out03", "out04"): s = s.replace('<rect width="1080" height="1350" fill="#111418"/>', "", 1)
    w, h = re.search(r'<svg width="([\d.]+)" height="([\d.]+)"', s).groups()
    saida.append(f"  {p}: {{ w: {w}, h: {h}, svg: {json.dumps(s)} }},")
    ids_por_peca[p] = sorted(set(mapa.values()))
open(f"{BASE}/src/v9/svgs.ts", "w", encoding="utf-8").write(
    "// Gerado por v9/insumos/svgs_para_ts.py a partir das exportações do Figma. Não editar à mão.\n"
    "export const SVGS: Record<string, { w: number; h: number; svg: string }> = {\n" + "\n".join(saida) + "\n};\n")
json.dump(ids_por_peca, open(f"{BASE}/v9/insumos/svg_ids.json", "w"), indent=1)
print({k: len(v) for k, v in ids_por_peca.items()}, os.path.getsize(f"{BASE}/src/v9/svgs.ts") // 1024, "KB")
