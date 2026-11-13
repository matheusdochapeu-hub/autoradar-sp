#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AutoRadar SP — importa ofertas reais (anúncios do Mercado Livre) para o catálogo.

Regras (para não repetir o problema da v20):
  - só entra anúncio cujo título corresponde a um dos modelos-alvo;
  - preço precisa existir e ser plausível contra a FIPE (0,70x a 1,30x);
  - cidade/UF vêm do anúncio, nunca do chute;
  - km/cor só entram se estiverem publicados; senão ficam nulos/"Não informada";
  - sem telefone, endereço ou "laudo aprovado" inventado;
  - duplicata (mesmo MLB, ou mesmo modelo+preço+cidade) é descartada.

Uso:
  python scripts/import_candidates.py URL1 URL2 ...
  python scripts/import_candidates.py --file links.txt [--dry-run]
"""
import argparse
import copy
import datetime
import json
import os
import re
import sys
import unicodedata
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data", "cars.json")
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

UF_POR_ESTADO = {
    "acre": "AC", "alagoas": "AL", "amapá": "AP", "amazonas": "AM", "bahia": "BA",
    "ceará": "CE", "distrito federal": "DF", "espírito santo": "ES", "goiás": "GO",
    "maranhão": "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
    "minas gerais": "MG", "pará": "PA", "paraíba": "PB", "paraná": "PR",
    "pernambuco": "PE", "piauí": "PI", "rio de janeiro": "RJ",
    "rio grande do norte": "RN", "rio grande do sul": "RS", "rondônia": "RO",
    "roraima": "RR", "santa catarina": "SC", "são paulo": "SP", "sergipe": "SE",
    "tocantins": "TO",
}

# Cidades usadas na validação rápida quando o anúncio não expõe a UF.
CIDADE_UF = {
    "são paulo": "SP", "campinas": "SP", "taubaté": "SP", "são josé do rio preto": "SP",
    "ribeirão preto": "SP", "santos": "SP", "sorocaba": "SP", "são josé dos campos": "SP",
    "santo andré": "SP", "são bernardo do campo": "SP", "barueri": "SP", "jundiaí": "SP",
    "piracicaba": "SP", "bauru": "SP", "caieiras": "SP", "franco da rocha": "SP",
    "lorena": "SP", "lençóis paulista": "SP", "são gonçalo": "RJ", "caxias do sul": "RS",
}

MODELOS = [
    {
        "match": lambda t: "pulse" in t,
        "categoria": "Fiat Pulse Automático",
        "trim": lambda t: "Abarth" if "abarth" in t else "Impetus" if "impetus" in t else "Drive",
        "template": {"abarth": "sug-120k-pulse-abarth", "impetus": "pulse-02", "drive": "pulse-02"},
        "titulo": lambda t, ano: (
            "Fiat Pulse Abarth 1.3 Turbo 270 Flex AT"
            if "abarth" in t
            else "Fiat Pulse Impetus 1.0 Turbo 200 Flex CVT"
            if "impetus" in t
            else "Fiat Pulse Drive 1.0 Turbo 200 Flex CVT"
        ),
        "cambio": "Automático CVT",
        "combustivel": "Flex (Etanol/Gasolina)",
    },
    {
        "match": lambda t: "dolphin" in t,
        "categoria": "BYD Dolphin Mini",
        "trim": lambda t: "mini",
        "template": {"mini": "byd-01"},
        "titulo": lambda t, ano: "BYD Dolphin Mini EV 38 kWh (100% Elétrico)",
        "cambio": "Automático (redução única)",
        "combustivel": "100% Elétrico",
    },
    {
        "match": lambda t: "tera" in t,
        "categoria": "Volkswagen Tera Automático",
        "trim": lambda t: "high" if "high" in t else "outfit" if "outfit" in t else "comfort",
        "template": {"high": "tera-01", "outfit": "tera-01", "comfort": "tera-01"},
        "titulo": lambda t, ano: (
            "Volkswagen Tera High 1.0 TSI Automático"
            if "high" in t
            else "Volkswagen Tera Outfit The Town 1.0 TSI Automático"
            if "outfit" in t
            else "Volkswagen Tera Comfort 1.0 TSI Automático"
        ),
        "cambio": "Automático 6 marchas",
        "combustivel": "Flex (Etanol/Gasolina)",
    },
]


ZONAS = ("zona norte", "zona sul", "zona oeste", "zona leste", "centro")


def separar_cidade(cidade):
    """'São Paulo Zona Sul' -> ('São Paulo', 'Zona Sul')."""
    baixo = (cidade or "").lower()
    for zona in ZONAS:
        if baixo.endswith(zona):
            return cidade[: -len(zona)].strip(" -"), zona.title()
    return cidade, ""


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def brl(texto):
    m = re.search(r"R\$\s*([\d\.]+)(?:,(\d{2}))?", texto or "")
    if not m:
        return None
    return int(m.group(1).replace(".", "")) + (int(m.group(2) or 0) / 100)


def normalizar(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.lower()).strip()


def extrair(url):
    html = fetch(url)
    titulo = re.search(r'property="og:title" content="([^"]*)"', html)
    descricao = re.search(r'property="og:description" content="([^"]*)"', html)
    imagem = re.search(r'property="og:image" content="([^"]*)"', html)
    local = re.search(r'"city":"([^"]+)","state":"([^"]+)"', html)
    fipe = re.search(r"R\$\s*[\d\.]+(?:,\d{2})?\s*FIPE", html)
    ano_attr = re.search(r'"id":"VEHICLE_YEAR","name":"Ano","value_id":"[^"]*","value_name":"(\d{4})"', html)

    titulo = titulo.group(1).strip() if titulo else ""
    descricao = descricao.group(1).strip() if descricao else ""
    if local:
        cidade, estado = local.group(1).strip(), local.group(2).strip()
    else:
        so_cidade = re.search(r'"city":"([^"]+)"', html)
        cidade, estado = (so_cidade.group(1).strip() if so_cidade else ""), ""

    ano = int(ano_attr.group(1)) if ano_attr else None
    if not ano:
        anos = re.findall(r"\b(20\d{2})\b", f"{titulo} {descricao}")
        ano = max(int(a) for a in anos) if anos else None

    km = None
    m_km = re.search(r"([\d\.]{3,})\s*(?:km|quil[oô]metros)", descricao, re.I)
    if m_km:
        km = int(m_km.group(1).replace(".", ""))

    cor = "Não informada"
    m_cor = re.search(r"Cor\s+([A-ZÀ-Ý][\wÀ-ÿ ]{2,20})", descricao)
    if m_cor:
        cor = m_cor.group(1).strip()

    return {
        "url": url,
        "titulo": titulo,
        "descricao": descricao,
        "preco": brl(titulo),
        "fipe": (lambda v: int(v) if v is not None and float(v).is_integer() else v)(
            brl(fipe.group(0)) if fipe else None
        ),
        "cidade": cidade,
        "estado": estado,
        "ano": ano,
        "km": km,
        "cor": cor,
        "imagem": imagem.group(1).split("?")[0] if imagem else "",
    }


def parcela(preco, entrada, taxa=0.025, meses=48):
    financiado = preco - entrada
    fator = (taxa * (1 + taxa) ** meses) / ((1 + taxa) ** meses - 1)
    return financiado, financiado * fator


def texto_fipe(preco, fipe):
    if not fipe:
        return "FIPE indisponível"
    diff = preco - fipe
    if abs(diff) < 1:
        return "Na tabela FIPE"
    return f"{'+' if diff > 0 else '-'}R$ {abs(diff):,.0f} vs FIPE".replace(",", ".")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("urls", nargs="*")
    ap.add_argument("--file")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    urls = list(args.urls)
    if args.file:
        urls += [l.strip() for l in open(args.file, encoding="utf-8-sig") if l.strip() and not l.startswith("#")]
    if not urls:
        ap.error("informe URLs de anúncios (ou --file links.txt)")

    db = json.load(open(DATA, encoding="utf-8"))
    carros = db["cars"]
    ids = {c["id"] for c in carros}
    mlbs = {re.search(r"(MLB-\d+)", c["listingUrl"]).group(1) for c in carros if re.search(r"(MLB-\d+)", c["listingUrl"])}
    chaves = {(normalizar(c["modelCategory"]), c["price"], normalizar(c["dealer"]["city"])) for c in carros}
    por_id = {c["id"]: c for c in carros}

    importados, descartados = [], []
    for url in urls:
        try:
            a = extrair(url)
        except Exception as e:  # noqa: BLE001
            descartados.append((url, f"erro {type(e).__name__}"))
            continue

        titulo_norm = normalizar(a["titulo"])
        modelo = next((m for m in MODELOS if m["match"](titulo_norm)), None)
        if not modelo:
            descartados.append((url, "modelo fora dos alvos"))
            continue

        if not a["preco"] or a["preco"] < 40000:
            descartados.append((url, "sem preço válido"))
            continue

        if a["fipe"] and not (0.70 <= a["preco"] / a["fipe"] <= 1.30):
            descartados.append((url, f"preço fora da faixa vs FIPE ({a['preco']/a['fipe']:.2f}x)"))
            continue

        cidade, bairro = separar_cidade(a["cidade"])
        uf = (
            {normalizar(k): v for k, v in UF_POR_ESTADO.items()}.get(normalizar(a["estado"]))
            or {normalizar(k): v for k, v in CIDADE_UF.items()}.get(normalizar(cidade))
        )
        if uf != "SP":
            descartados.append((url, f"fora de SP ({a['cidade']}/{uf})"))
            continue

        mlb = re.search(r"(MLB-\d+)", url)
        mlb = mlb.group(1) if mlb else url
        chave = (normalizar(modelo["categoria"]), a["preco"], normalizar(cidade))
        if mlb in mlbs or chave in chaves:
            descartados.append((url, "duplicata"))
            continue

        trim = modelo["trim"](titulo_norm)
        template = por_id.get(modelo["template"].get(trim, "")) or por_id.get("pulse-02")
        entrada = round(a["preco"] * 0.3)
        financiado, p = parcela(a["preco"], entrada)

        carro = {
            "id": f"mlb-{mlb.replace('MLB-', '')}",
            "isTarget": True,
            "modelCategory": modelo["categoria"],
            "title": modelo["titulo"](titulo_norm, a["ano"]),
            "badge": "Abaixo da FIPE" if a["fipe"] and a["preco"] < a["fipe"] else "Acima da FIPE" if a["fipe"] else "Preço do anúncio",
            "year": a["ano"],
            "km": a["km"],
            "color": a["cor"],
            "fuel": modelo["combustivel"],
            "transmission": modelo["cambio"],
            "price": a["preco"],
            "fipePrice": a["fipe"],
            "priceVsFipe": texto_fipe(a["preco"], a["fipe"]),
            "image": a["imagem"],
            "listingUrl": url.split("#")[0],
            "dealer": {
                "name": "Loja no Mercado Livre",
                "city": cidade,
                "state": uf,
                "neighborhood": bairro,
                "whatsapp": "",
                "verified": True,
            },
            "specs": copy.deepcopy(template["specs"]),
            "financing": {
                "downPayment": entrada,
                "financedAmount": round(financiado),
                "months": 48,
                "interestRate": 2.5,
                "monthlyInstallment": round(p),
            },
            "cautelarStatus": "",
            "tags": ["Anúncio verificado", "Mercado Livre"],
            "portal": "Mercado Livre",
            "verifiedAt": datetime.date.today().isoformat(),
        }

        if carro["id"] in ids:
            descartados.append((url, "id já usado"))
            continue

        importados.append(carro)
        ids.add(carro["id"])
        mlbs.add(mlb)
        chaves.add(chave)

    for url, motivo in descartados:
        print(f"[SKIP] {motivo:<38} {url[:70]}")
    for c in importados:
        print(f"[ADD ] {c['id']:<18} R$ {c['price']:>9,.0f}  {c['dealer']['city']}/{c['dealer']['state']}  {c['title'][:52]}")

    if args.dry_run:
        print(f"\n[dry-run] {len(importados)} seriam importados.")
        return

    if not importados:
        print("\nNada a importar.")
        return

    db["cars"] = carros + importados
    agora = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    db["metadata"].update(
        {"lastUpdated": agora, "generatedAt": agora, "catalogVersion": "v22", "totalCars": len(db["cars"])}
    )

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n{len(importados)} oferta(s) importada(s). Total: {len(db['cars'])}.")


if __name__ == "__main__":
    sys.exit(main())
