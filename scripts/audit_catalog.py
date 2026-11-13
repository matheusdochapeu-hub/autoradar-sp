#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AutoRadar SP — auditoria do catálogo contra o anúncio publicado.

Para cada oferta em data/cars.json, abre `listingUrl` e compara o que está no
catálogo com o que a página do anúncio realmente diz (preço, FIPE, cidade, ano).

Uso:
  python scripts/audit_catalog.py              # audita tudo e grava data/audit-report.json
  python scripts/audit_catalog.py --limit 10   # amostra
  python scripts/audit_catalog.py --only pulse-01,byd-01

Saída: relatório JSON + resumo no terminal. O script NÃO altera o catálogo.
Não inventa dado: quando o anúncio não publica o campo, marca como "n/d".
"""
import argparse
import concurrent.futures
import json
import os
import re
import sys
import urllib.error
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data", "cars.json")
REPORT = os.path.join(BASE, "data", "audit-report.json")
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def meta(html, prop):
    m = re.search(r'<meta\s+property="og:%s"\s+content="([^"]*)"' % re.escape(prop), html, re.I)
    return (m.group(1) if m else "").strip()


def valor_brl(texto):
    m = re.search(r"R\$\s*([\d\.]+)(?:,(\d{2}))?", texto or "")
    if not m:
        return None
    inteiro = m.group(1).replace(".", "")
    centavos = int(m.group(2) or 0)
    return int(inteiro) + (centavos / 100 if centavos else 0)


def primeiro(html, padrao):
    m = re.search(padrao, html)
    if not m:
        return None
    return (m.group(1) if m.groups() else m.group(0)).strip()


def extrair(html):
    titulo = meta(html, "title")
    descricao = meta(html, "description")

    preco = valor_brl(titulo) or valor_brl(primeiro(html, r'"price":\{"type":"price","value":([\d\.]+)'))
    fipe_txt = primeiro(html, r"R\$\s*[\d\.]+(?:,\d{2})?\s*FIPE")
    cidade = primeiro(html, r'"city":"([^"]+)"')
    bairro = primeiro(html, r'"neighborhood":"([^"]+)"')

    anos = re.findall(r"\b(20\d{2})\b", f"{titulo} {descricao}")
    ano = max(int(a) for a in anos) if anos else None

    km = primeiro(descricao, r"([\d\.]+)\s*(?:km|quil[oô]metros)")

    return {
        "titulo": re.sub(r"\s*-\s*R\$.*$", "", titulo).strip(),
        "preco": preco,
        "fipe": valor_brl(fipe_txt) if fipe_txt else None,
        "fipeTexto": fipe_txt,
        "cidade": cidade,
        "bairro": bairro,
        "ano": ano,
        "km": int(km.replace(".", "")) if km else None,
        "imagem": meta(html, "image"),
        "descricao": (descricao or "")[:300],
    }


def normalizar(txt):
    import unicodedata

    s = unicodedata.normalize("NFKD", str(txt or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.lower()).strip()


def auditar(car):
    registro = {
        "id": car.get("id"),
        "titulo": car.get("title"),
        "url": car.get("listingUrl"),
        "portal": car.get("portal"),
        "catalogo": {
            "preco": car.get("price"),
            "fipe": car.get("fipePrice"),
            "ano": car.get("year"),
            "km": car.get("km"),
            "cidade": car.get("dealer", {}).get("city"),
        },
        "anuncio": None,
        "status": "ok",
        "divergencias": [],
    }

    try:
        html = fetch(car["listingUrl"])
    except urllib.error.HTTPError as e:
        registro["status"] = f"HTTP {e.code}"
        return registro
    except Exception as e:  # noqa: BLE001
        registro["status"] = f"erro {type(e).__name__}"
        return registro

    anuncio = extrair(html)
    registro["anuncio"] = anuncio

    # Normaliza tipos do catálogo (alguns registros antigos guardam número como texto)
    def num(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    preco_cat = num(car.get("price"))
    fipe_cat = num(car.get("fipePrice"))
    ano_cat = num(car.get("year"))

    # Preço é o dado mais crítico
    if anuncio["preco"] and preco_cat is not None and abs(anuncio["preco"] - preco_cat) > 1:
        registro["divergencias"].append(
            f"preco: catalogo R$ {car.get('price'):,.0f} x anuncio R$ {anuncio['preco']:,.0f}"
        )

    if anuncio["fipe"] and fipe_cat is not None and abs(anuncio["fipe"] - fipe_cat) > 1:
        registro["divergencias"].append(
            f"fipe: catalogo R$ {fipe_cat:,.0f} x anuncio R$ {anuncio['fipe']:,.0f}"
        )

    if anuncio["cidade"] and normalizar(anuncio["cidade"]) != normalizar(car.get("dealer", {}).get("city")):
        registro["divergencias"].append(
            f"cidade: catalogo '{car.get('dealer', {}).get('city')}' x anuncio '{anuncio['cidade']}'"
        )

    if anuncio["ano"] and ano_cat is not None and abs(anuncio["ano"] - ano_cat) >= 1:
        registro["divergencias"].append(f"ano: catalogo {int(ano_cat)} x anuncio {anuncio['ano']}")

    if anuncio["preco"] is None:
        registro["status"] = "sem preco no anuncio"
    elif not registro["divergencias"]:
        registro["status"] = "ok"
    else:
        registro["status"] = "divergente"

    return registro


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--out", default=REPORT)
    args = ap.parse_args()

    db = json.load(open(DATA, encoding="utf-8"))
    cars = db.get("cars", [])

    if args.only:
        alvos = {s.strip() for s in args.only.split(",") if s.strip()}
        cars = [c for c in cars if c.get("id") in alvos]
    if args.limit:
        cars = cars[: args.limit]

    resultados = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        for r in ex.map(auditar, cars):
            resultados.append(r)
            marca = {"ok": "OK  ", "divergente": "DIF ", "sem preco no anuncio": "S/PRE"}.get(
                r["status"], "ERRO"
            )
            print(f"[{marca}] {r['id']:<26} {r['status']}")
            for d in r["divergencias"]:
                print(f"         - {d}")

    resumo = {
        "total": len(resultados),
        "ok": sum(1 for r in resultados if r["status"] == "ok"),
        "divergentes": sum(1 for r in resultados if r["status"] == "divergente"),
        "semPreco": sum(1 for r in resultados if r["status"] == "sem preco no anuncio"),
        "naoVerificaveis": sum(1 for r in resultados if r["status"].startswith(("HTTP", "erro"))),
    }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"resumo": resumo, "ofertas": resultados}, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("\n=== RESUMO ===")
    print(json.dumps(resumo, ensure_ascii=False, indent=2))
    print(f"Relatório: {os.path.relpath(args.out, BASE)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
