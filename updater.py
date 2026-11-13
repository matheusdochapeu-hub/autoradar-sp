# -*- coding: utf-8 -*-
"""
AutoRadar SP — rotina de manutenção do catálogo.

IMPORTANTE: este script NÃO faz scraping e NÃO busca ofertas novas. Ele apenas:
  1. valida a estrutura de data/cars.json (campos obrigatórios, ids únicos);
  2. recalcula estatísticas e grava `metadata.lastUpdated` / `stats`;
  3. registra o resultado em logs/daily_update.log.

A coleta de ofertas reais é feita com scripts/fetch_listings.py (a partir de URLs
de anúncios) e revisada manualmente antes de entrar no catálogo — ver AGENTS.md.

Uso: python updater.py
"""

import datetime
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "cars.json")
LOG_DIR = os.path.join(BASE_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "daily_update.log")

CAMPOS_OBRIGATORIOS = ("id", "title", "modelCategory", "price", "year", "fuel", "dealer")


def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")


def validar(cars):
    """Retorna a lista de problemas encontrados no catálogo."""
    problemas = []

    ids = [c.get("id") for c in cars]
    repetidos = {i for i in ids if ids.count(i) > 1}
    if repetidos:
        problemas.append(f"ids repetidos: {', '.join(sorted(repetidos))}")

    for car in cars:
        cid = car.get("id", "?")
        for campo in CAMPOS_OBRIGATORIOS:
            if not car.get(campo):
                problemas.append(f"{cid}: campo obrigatório ausente ({campo})")
        if not isinstance(car.get("price"), (int, float)) or car.get("price", 0) <= 0:
            problemas.append(f"{cid}: preço inválido")
        # km = 0 é válido (carro 0 km) e None significa "não informado".
        km = car.get("km")
        if km is not None and (not isinstance(km, (int, float)) or km < 0):
            problemas.append(f"{cid}: quilometragem inválida")
        if not car.get("dealer", {}).get("city"):
            problemas.append(f"{cid}: dealer.city ausente (filtro de região)")

    return problemas


def run_daily_update():
    log("Iniciando manutenção do catálogo do AutoRadar SP...")

    if not os.path.exists(DATA_FILE):
        log(f"ERRO: {DATA_FILE} não encontrado.")
        return False

    with open(DATA_FILE, encoding="utf-8") as f:
        db = json.load(f)

    cars = db.get("cars", [])
    if not cars:
        log("ERRO: catálogo vazio — nada a fazer.")
        return False

    problemas = validar(cars)
    if problemas:
        for p in problemas:
            log(f"VALIDACAO: {p}")
        log(f"ERRO: {len(problemas)} problema(s) no catálogo. Nada foi gravado.")
        return False

    budget = db.get("metadata", {}).get("budgetLimit", 80000)
    preco_efetivo = lambda c: c.get("negotiatedTarget") or c.get("price", 0)

    alvos = [c for c in cars if c.get("isTarget")]
    eletricos = [
        c
        for c in cars
        if "elétrico" in (c.get("fuel", "") or "").lower()
        or "elétrico" in (c.get("modelCategory", "") or "").lower()
        or "dolphin" in (c.get("modelCategory", "") or "").lower()
    ]
    dentro_do_teto = [c for c in cars if preco_efetivo(c) <= budget]
    pulses = [c.get("price", 0) for c in cars if "pulse" in (c.get("modelCategory", "") or "").lower()]

    agora = datetime.datetime.now().isoformat(timespec="seconds")
    db.setdefault("metadata", {})["lastUpdated"] = agora
    db["metadata"]["totalCars"] = len(cars)

    db["stats"] = {
        "lastCheckDate": datetime.date.today().strftime("%d/%m/%Y"),
        "totalVehicles": len(cars),
        "targetModelsCount": len(alvos),
        "underBudgetCount": len(dentro_do_teto),
        "electricCount": len(eletricos),
        "averagePulsePrice": round(sum(pulses) / len(pulses), 2) if pulses else 0,
        "status": "Catálogo validado (dados factuais conferidos manualmente)",
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        f.write("\n")

    log(
        f"Concluído: {len(cars)} carros válidos, {len(dentro_do_teto)} dentro de R$ {budget:,}, "
        f"{len(eletricos)} elétricos."
    )
    log("Lembre-se: rode `node scripts/sync-fallback.js` para atualizar o fallback offline.")
    return True


if __name__ == "__main__":
    sys.exit(0 if run_daily_update() else 1)
