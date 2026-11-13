#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AutoRadar SP — coleta de candidatos a partir de anúncios reais.

Objetivo: ampliar o catálogo (mais carros e mais cidades) SEM inventar dados.
O script lê URLs de anúncios individuais do Mercado Livre, extrai o que a
página publica (título, preço, foto, ano, km) e grava em data/candidates.json.

Fluxo recomendado:
  1. Escolha anúncios reais (Mercado Livre, loja oficial) dos 3 modelos alvo.
  2. Rode:  python scripts/fetch_listings.py URL1 URL2 ...
     ou:    python scripts/fetch_listings.py --file links.txt
  3. Revise data/candidates.json (cidade, bairro, laudo e FIPE não vêm do
     anúncio: precisam ser conferidos por você antes de entrar no catálogo).
  4. Copie os aprovados para data/cars.json e rode:
     node scripts/sync-fallback.js && node --test "test/**/*.test.js"

O scraping de páginas de BUSCA (lista.mercadolivre.com.br) é bloqueado por
anti-bot; página de anúncio individual responde normalmente. Por isso o
script recebe URLs, não termos de busca.
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "data", "candidates.json")
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def meta(html: str, prop: str) -> str:
    m = re.search(
        r'<meta\s+property="og:%s"\s+content="([^"]*)"' % re.escape(prop), html, re.I
    )
    return (m.group(1) if m else "").strip()


def brl_para_numero(texto: str):
    m = re.search(r"R\$\s*([\d\.]+)(?:,(\d{2}))?", texto or "")
    if not m:
        return None
    inteiro = m.group(1).replace(".", "")
    centavos = m.group(2) or "00"
    try:
        return int(inteiro) + (int(centavos) / 100 if centavos != "00" else 0)
    except ValueError:
        return None


def extrair_ano(texto: str):
    achados = sorted({int(a) for a in re.findall(r"\b(?:19|20)\d{2}\b", texto or "")})
    return achados[-1] if achados else None


def extrair_km(texto: str):
    m = re.search(r"([\d\.]+)\s*(?:km|quil[oô]metros)", texto or "", re.I)
    if not m:
        return None
    try:
        return int(m.group(1).replace(".", ""))
    except ValueError:
        return None


def slug(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


def cidade_do_texto(texto: str):
    """Heurística: 'Cidade - Bairro' aparece no corpo do anúncio do ML."""
    cidades = [
        "São Paulo", "Campinas", "Santos", "Sorocaba", "Ribeirão Preto",
        "São José dos Campos", "Santo André", "São Bernardo do Campo",
        "Barueri", "Jundiaí", "Piracicaba", "Guarulhos", "Osasco",
        "São Caetano do Sul", "Diadema", "Mauá", "Taubaté", "Bauru",
        "Marília", "São Carlos", "Araraquara", "Franca", "Presidente Prudente",
    ]
    for cidade in cidades:
        if cidade.lower() in (texto or "").lower():
            return cidade
    return ""


def montar_candidato(url: str):
    html = fetch(url)
    titulo = meta(html, "title")
    descricao = meta(html, "description")
    imagem = meta(html, "image")

    preco = brl_para_numero(titulo) or brl_para_numero(descricao)
    texto = f"{titulo} {descricao}"

    return {
        "sourceUrl": url,
        "title": re.sub(r"\s*-\s*R\$.*$", "", titulo).strip(),
        "price": preco,
        "image": imagem,
        "year": extrair_ano(texto),
        "km": extrair_km(descricao),
        "cityGuess": cidade_do_texto(descricao),
        "portal": "Mercado Livre",
        "collectedAt": datetime.now().isoformat(timespec="seconds"),
        # Campos que NÃO vêm do anúncio e precisam de conferência humana:
        "fipePrice": None,
        "priceVsFipe": None,
        "dealer": {"name": "", "city": "", "neighborhood": "", "whatsapp": ""},
        "review": "preencher fipe, dealer e laudo antes de publicar",
    }


def carregar_lista(args):
    urls = list(args.urls)
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            urls += [l.strip() for l in f if l.strip() and not l.startswith("#")]
    return urls


def main():
    ap = argparse.ArgumentParser(description="Coleta candidatos de anúncios reais.")
    ap.add_argument("urls", nargs="*", help="URLs de anúncios individuais")
    ap.add_argument("--file", help="arquivo texto com uma URL por linha")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    urls = carregar_lista(args)
    if not urls:
        ap.error("informe ao menos uma URL (ou --file links.txt)")

    existentes = []
    if os.path.exists(args.out):
        try:
            existentes = json.load(open(args.out, encoding="utf-8"))
            existentes = existentes.get("candidates", existentes)
        except json.JSONDecodeError:
            existentes = []

    vistos = {c.get("sourceUrl") for c in existentes if isinstance(c, dict)}
    novos, falhas = [], []

    for url in urls:
        if url in vistos:
            print(f"[SKIP] já coletado: {url}")
            continue
        try:
            cand = montar_candidato(url)
            if not cand["price"]:
                print(f"[WARN] preço não encontrado em {url}")
            novos.append(cand)
            print(f"[OK]   {cand['title'][:60]} — R$ {cand['price']} ({cand['cityGuess'] or 'cidade?'})")
        except urllib.error.HTTPError as e:
            falhas.append({"sourceUrl": url, "error": f"HTTP {e.code}"})
            print(f"[ERRO] HTTP {e.code}: {url}")
        except Exception as e:  # noqa: BLE001
            falhas.append({"sourceUrl": url, "error": str(e)[:120]})
            print(f"[ERRO] {type(e).__name__}: {url}")

    todos = existentes + novos
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generatedAt": datetime.now().isoformat(timespec="seconds"),
                "candidates": todos,
                "failures": falhas,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
        f.write("\n")

    print(f"\n{len(novos)} novo(s) candidato(s), {len(falhas)} falha(s).")
    print(f"Arquivo: {os.path.relpath(args.out, BASE)}")
    print("Revise FIPE, loja/cidade e laudo antes de mover para data/cars.json.")


if __name__ == "__main__":
    sys.exit(main())
