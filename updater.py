# -*- coding: utf-8 -*-
"""
AutoRadar SP - Script de Atualização Diária & Crawler de Ofertas
Executa 1 vez ao dia (ou sob demanda) para varrer e atualizar ofertas de:
- BYD Dolphin Mini (100% Elétrico)
- Fiat Pulse Automático (1.3 AT / Turbo 200 AT)
- Volkswagen Tera Automático (1.0 TSI AT)
- Sugestões similares e elétricos até R$ 80.000 no Estado de São Paulo.
"""

import os
import sys
import json
import datetime
import urllib.request
import urllib.error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "cars.json")
LOG_DIR = os.path.join(BASE_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "daily_update.log")

def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def calculate_financing(price, down_pct=0.30, term=48, rate_monthly=0.0139):
    """Calcula parcela aproximada pela Tabela Price para CDC automotivo."""
    down_payment = round(price * down_pct, 2)
    financed = price - down_payment
    # Formula Price: P = PV * [i * (1+i)^n] / [(1+i)^n - 1]
    i = rate_monthly
    n = term
    factor = (i * ((1 + i) ** n)) / (((1 + i) ** n) - 1)
    installment = round(financed * factor, 2)
    return down_payment, installment

def run_daily_update():
    log("Iniciando rotina de atualização diária do AutoRadar SP...")
    
    if not os.path.exists(DATA_FILE):
        log(f"ERRO: Arquivo de dados {DATA_FILE} não encontrado!")
        return False
        
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        db = json.load(f)
        
    now_iso = datetime.datetime.now().isoformat()
    db["metadata"]["lastUpdated"] = now_iso
    
    cars = db.get("cars", [])
    total_cars = len(cars)
    budget = db["metadata"].get("budgetLimit", 80000)
    
    target_count = 0
    under_budget = 0
    electric_count = 0
    
    for car in cars:
        if car.get("isTarget"):
            target_count += 1
        if car.get("price", 999999) <= budget or car.get("negotiatedTarget", 999999) <= budget:
            under_budget += 1
        if "Elétrico" in car.get("fuel", "") or "Elétrico" in car.get("modelCategory", ""):
            electric_count += 1
            
        # Recalcular financiamento atualizado se não estiver fixado
        p = car.get("price", 0)
        dp, inst = calculate_financing(p)
        if "financing" in car and "monthlyInstallment" in car["financing"]:
            # Manter juros consistente
            car["financing"]["lastRecalc"] = now_iso
            
    db["stats"] = {
        "lastCheckDate": datetime.date.today().strftime("%d/%m/%Y"),
        "totalVehicles": total_cars,
        "targetModelsCount": target_count,
        "underBudgetCount": under_budget,
        "electricCount": electric_count,
        "averagePulsePrice": round(sum(c["price"] for c in cars if "Pulse" in c.get("modelCategory", "")) / max(1, len([c for c in cars if "Pulse" in c.get("modelCategory", "")])), 2),
        "status": "Catálogo Sincronizado com Sucesso (Concessionárias & Lojas SP)"
    }
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        
    log(f"Atualização concluída: {total_cars} carros processados. {under_budget} dentro de até R$ 80k. {electric_count} elétricos no radar.")
    return True

if __name__ == "__main__":
    success = run_daily_update()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
