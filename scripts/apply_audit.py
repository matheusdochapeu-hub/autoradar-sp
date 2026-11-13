#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AutoRadar SP — aplica ao catálogo os dados publicados no anúncio.

Fonte: data/audit-report.json (gerado por scripts/audit_catalog.py).

O que este script corrige
  - preço, FIPE, ano e foto vindos do anúncio;
  - cidade e estado reais do vendedor (antes eram fixos em SP);
  - parcela/entrada recalculadas sobre o preço real (Tabela Price 48x, 2,5% a.m.);
  - faixa de preço (priceTier) das sugestões.

O que este script REMOVE (por não ter fonte)
  - WhatsApp e endereço inventados de anúncios do Mercado Livre;
  - "laudo aprovado" não verificado;
  - preço de negociação / preço original fictícios.

Uso: python scripts/apply_audit.py [--dry-run]
"""
import argparse
import datetime
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data", "cars.json")
REPORT = os.path.join(BASE, "data", "audit-report.json")

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

ZONAS = ("zona norte", "zona sul", "zona oeste", "zona leste", "zona central")

# Cidades que a auditoria encontrou nos anúncios. Usado quando a página não
# publica o estado (aí não dá para chutar "SP").
CIDADE_UF = {
    "são paulo": "SP", "ribeirão preto": "SP", "caieiras": "SP", "lorena": "SP",
    "taubaté": "SP", "franco da rocha": "SP", "lençóis paulista": "SP",
    "porto alegre": "RS", "caxias do sul": "RS", "estância velha": "RS",
    "itajaí": "SC", "florianópolis": "SC", "içara": "SC", "joinville": "SC", "gaspar": "SC",
    "araguari": "MG", "ponte nova": "MG", "belo horizonte": "MG",
    "brasília": "DF", "duque de caxias": "RJ", "itaboraí": "RJ", "rio de janeiro": "RJ",
    "goiânia": "GO", "maceió": "AL", "campo grande": "MS", "serra": "ES",
}


def uf(estado):
    return UF_POR_ESTADO.get((estado or "").strip().lower())


def separar_cidade(cidade):
    """'São Paulo Zona Norte' -> ('São Paulo', 'Zona Norte')."""
    if not cidade:
        return "", ""
    baixo = cidade.lower()
    for zona in ZONAS:
        if baixo.endswith(zona):
            return cidade[: -len(zona)].strip(" -"), zona.title()
    return cidade, ""


def parcela_price(preco, entrada, taxa_mensal=0.025, meses=48):
    financiado = max(0.0, preco - entrada)
    i = taxa_mensal
    if financiado <= 0:
        return 0.0, 0.0
    fator = (i * (1 + i) ** meses) / ((1 + i) ** meses - 1)
    return financiado, financiado * fator


def texto_fipe(preco, fipe):
    if not fipe:
        return "FIPE indisponível"
    diff = preco - fipe
    if abs(diff) < 1:
        return "Na tabela FIPE"
    sinal = "+" if diff > 0 else "-"
    return f"{sinal}R$ {abs(diff):,.0f} vs FIPE".replace(",", ".")


def tier(preco):
    for limite, nome in ((60000, "60k"), (70000, "70k"), (80000, "80k"), (100000, "100k"),
                         (120000, "120k"), (140000, "140k")):
        if preco <= limite:
            return nome
    return "160k"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db = json.load(open(DATA, encoding="utf-8"))
    rel = json.load(open(REPORT, encoding="utf-8"))
    por_id = {o["id"]: o for o in rel.get("ofertas", [])}

    zerados, corrigidos, sem_fonte = [], [], []

    for car in db["cars"]:
        # Títulos antigos carregavam a cidade no fim ("— Campinas"), que deixou de
        # ser verdade quando a cidade passou a vir do anúncio.
        if " — " in car.get("title", ""):
            car["title"] = car["title"].split(" — ")[0].strip()

        auditoria = por_id.get(car["id"])
        anuncio = (auditoria or {}).get("anuncio") or {}
        preco = anuncio.get("preco")
        cidade_anuncio = anuncio.get("cidade")
        uf_anuncio = uf(anuncio.get("estado"))

        # Ofertas de site de loja (sem preço legível no HTML): só garante o estado.
        if not preco or not cidade_anuncio:
            dealer_loja = car.setdefault("dealer", {})
            dealer_loja["state"] = dealer_loja.get("state") or "SP"
            # Contato e laudo não são publicados de forma legível: não invente.
            dealer_loja["whatsapp"] = ""
            dealer_loja.pop("phone", None)
            car["cautelarStatus"] = ""
            car["badge"] = "Oferta de loja"
            car.pop("negotiatedTarget", None)
            car.pop("originalPrice", None)
            sem_fonte.append(car["id"])
            continue

        cidade, bairro = separar_cidade(cidade_anuncio)
        uf_por_cidade = CIDADE_UF.get(cidade.strip().lower())
        if uf_anuncio and uf_por_cidade and uf_anuncio != uf_por_cidade:
            print(f"[AVISO] {car['id']}: anuncio diz {uf_anuncio}, mapa diz {uf_por_cidade} ({cidade})")
        uf_final = uf_anuncio or uf_por_cidade
        if not uf_final:
            print(f"[AVISO] {car['id']}: estado desconhecido para '{cidade}'")
            uf_final = "??"
        car["price"] = round(preco, 2)

        fipe = anuncio.get("fipe")
        car["fipePrice"] = round(fipe, 2) if fipe else None
        car["priceVsFipe"] = texto_fipe(car["price"], car["fipePrice"])

        ano = anuncio.get("ano")
        ano_atual = datetime.date.today().year + 1
        if isinstance(ano, (int, float)) and 1990 <= ano <= ano_atual:
            car["year"] = int(ano)

        km = anuncio.get("km")
        if isinstance(km, int) and km >= 0:
            car["km"] = km

        imagem = anuncio.get("imagem")
        if isinstance(imagem, str) and imagem.startswith("http"):
            car["image"] = imagem.split("?")[0]

        dealer = car.setdefault("dealer", {})
        dealer["city"] = cidade
        dealer["state"] = uf_final
        dealer["neighborhood"] = bairro
        dealer.pop("phone", None)
        dealer.pop("address", None)
        dealer["verified"] = True

        if car.get("portal") == "Mercado Livre":
            # Telefone e razão social do lojista não são publicados na página.
            dealer["whatsapp"] = ""
            dealer["name"] = "Loja no Mercado Livre"
            dealer.pop("type", None)

        car.pop("negotiatedTarget", None)
        car.pop("originalPrice", None)
        car["cautelarStatus"] = ""
        car["priceTier"] = tier(car["price"]) if car.get("isSuggestion") else car.get("priceTier")
        car["badge"] = (
            "Abaixo da FIPE"
            if car["fipePrice"] and car["price"] < car["fipePrice"]
            else "Acima da FIPE"
            if car["fipePrice"]
            else "Preço do anúncio"
        )

        entrada = round(car["price"] * 0.3)
        financiado, parcela = parcela_price(car["price"], entrada)
        car["financing"] = {
            "downPayment": entrada,
            "financedAmount": round(financiado),
            "months": 48,
            "interestRate": 2.5,
            "monthlyInstallment": round(parcela),
        }

        car["verifiedAt"] = datetime.date.today().isoformat()
        corrigidos.append(car["id"])

    agora = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    db.setdefault("metadata", {}).update(
        {
            "lastUpdated": agora,
            "generatedAt": agora,
            "catalogVersion": "v21",
            "totalCars": len(db["cars"]),
        }
    )
    db["metadata"].pop("lastUpdate", None)

    print(f"corrigidos pelo anuncio : {len(corrigidos)}")
    print(f"sem preco legivel (loja): {len(sem_fonte)} -> {', '.join(sem_fonte)}")

    if args.dry_run:
        print("\n[dry-run] nada gravado.")
        return

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("\ndata/cars.json atualizado.")


if __name__ == "__main__":
    main()
