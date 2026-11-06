/**
 * AutoRadar SP - Módulo de Dados e Conexão Local / Servidor
 * Carrega ofertas de data/cars.json com fallback e suporte a anúncios do usuário no localStorage.
 */

const STORAGE_KEY_CUSTOM_CARS = 'autoradar_sp_custom_cars_v1';
const STORAGE_KEY_FAVORITES = 'autoradar_sp_favorites_v1';
const STORAGE_KEY_LAST_SYNC = 'autoradar_sp_last_sync_v1';

// Base de dados resiliente (fallback e modelo de dados)
const DEFAULT_CARS_DATABASE = [
  {
    "id": "pulse-01",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.3 Flex AT (CVT 7v)",
    "badge": "Oportunidade Abaixo de 80k",
    "year": 2022,
    "km": 42000,
    "color": "Cinza Strato",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas)",
    "price": 74900,
    "originalPrice": 78900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 8.550 (Abaixo da FIPE)",
    "dealer": {
      "name": "Fiat Sinal — Unidade Ipiranga",
      "type": "Concessionária Oficial Fiat",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Ipiranga",
      "address": "Av. Nazaré, 1200 - Ipiranga, São Paulo - SP",
      "phone": "(11) 2065-9000",
      "whatsapp": "5511999887711",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex 8V",
      "power": "107 cv (E) / 98 cv (G)",
      "consumptionCity": "12,9 km/l (G) / 9,2 km/l (E)",
      "consumptionRoad": "14,3 km/l (G) / 10,4 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia 1 ano concessionária Fiat Sinal",
      "features": ["Central Multimídia 8.4\" Sem Fio", "Ar Digital", "Faróis Full LED", "Piloto Automático", "Câmera de Ré", "Controle TC+"]
    },
    "financing": {
      "downPayment": 22470,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1548,
      "interestRate": 1.39,
      "bank": "Banco Santander / Fiat",
      "optionsText": "Entrada de R$ 22.470 + 48x de R$ 1.548. Entrada parcelada em até 21x no cartão de crédito."
    },
    "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado Supervisão",
    "tags": ["Dentro do Orçamento", "Concessionária", "Laudo Aprovado", "Câmbio CVT"]
  },
  {
    "id": "pulse-02",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.0 Turbo 200 Flex AT",
    "badge": "Motor Turbo 130cv",
    "year": 2022,
    "km": 49000,
    "color": "Branco Banchisa com Teto Preto",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas)",
    "price": 77800,
    "originalPrice": 81900,
    "fipePrice": 84900,
    "priceVsFipe": "-R$ 7.100 (Abaixo da FIPE)",
    "dealer": {
      "name": "Localiza Seminovos — Santo André",
      "type": "Seminovos Certificados",
      "city": "Santo André",
      "state": "SP",
      "neighborhood": "Campestre",
      "address": "Av. Dom Pedro II, 1850 - Santo André - SP",
      "phone": "(11) 4992-8000",
      "whatsapp": "5511988776655",
      "verified": true
    },
    "specs": {
      "engine": "1.0 Turbo 200 Flex",
      "power": "130 cv (E) / 125 cv (G) - 20,4 kgfm",
      "consumptionCity": "12,0 km/l (G) / 8,5 km/l (E)",
      "consumptionRoad": "14,6 km/l (G) / 10,2 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia 360 dias Localiza",
      "features": ["Motor Turbo 200", "Modo Sport", "Multimídia Uconnect", "Direção Elétrica", "Rodas Liga Leve 16"]
    },
    "financing": {
      "downPayment": 23340,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1608,
      "interestRate": 1.42,
      "bank": "Banco Itaú / BV",
      "optionsText": "Entrada de R$ 23.340 + 48x de R$ 1.608 ou entrada zero com parcelas em 60x."
    },
    "image": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado Dekra",
    "tags": ["Dentro do Orçamento", "Motor Turbo", "Laudo Aprovado"]
  },
  {
    "id": "pulse-03",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.3 AT CVT 2023",
    "badge": "Ano 2023 Baixa KM",
    "year": 2023,
    "km": 31500,
    "color": "Preto Vulcano",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT",
    "price": 79500,
    "originalPrice": 83000,
    "fipePrice": 86200,
    "priceVsFipe": "-R$ 6.700",
    "dealer": {
      "name": "Carrera Seminovos — Butantã",
      "type": "Concessionária Multimarcas",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Butantã",
      "address": "Av. Vital Brasil, 850 - Butantã, São Paulo - SP",
      "phone": "(11) 3724-7000",
      "whatsapp": "5511977665544",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "12,9 km/l (G)",
      "consumptionRoad": "14,3 km/l (G)",
      "trunk": "370 Litros",
      "warranty": "Garantia de Fábrica Ativa",
      "features": ["Garantia de Fábrica", "Revisões em Dia", "Sensor Traseiro", "Ar Digital", "TC+"]
    },
    "financing": {
      "downPayment": 23850,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1642,
      "interestRate": 1.35,
      "bank": "Banco Safra / Bradesco",
      "optionsText": "Entrada de R$ 23.850 + 48x de R$ 1.642."
    },
    "image": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Periciado",
    "tags": ["Dentro do Orçamento", "Ano 2023", "Garantia de Fábrica"]
  },
  {
    "id": "pulse-05",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Campinas",
    "badge": "Menor Preço de SP",
    "year": 2022,
    "km": 58000,
    "color": "Prata Bari Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT",
    "price": 72900,
    "originalPrice": 76900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 10.550 (Super Desconto)",
    "dealer": {
      "name": "Daitan Seminovos — Campinas Norte",
      "type": "Grupo Daitan",
      "city": "Campinas",
      "state": "SP",
      "neighborhood": "Taquaral",
      "address": "Av. Barão de Itapura, 2100 - Campinas - SP",
      "phone": "(19) 3743-8000",
      "whatsapp": "5519981223344",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "12,9 km/l (G)",
      "consumptionRoad": "14,3 km/l (G)",
      "trunk": "370 Litros",
      "warranty": "Garantia 1 ano Gestauto",
      "features": ["Piloto Automático", "Sensor Ré", "Full LED", "Multimídia", "Direção Elétrica"]
    },
    "financing": {
      "downPayment": 21870,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1506,
      "interestRate": 1.38,
      "bank": "Banco Santander / Itaú",
      "optionsText": "Entrada de R$ 21.870 + 48x de R$ 1.506."
    },
    "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Laudo Aprovado",
    "tags": ["Menor Preço", "Campinas", "Super Desconto"]
  },
  {
    "id": "byd-01",
    "isTarget": true,
    "modelCategory": "BYD Dolphin Mini",
    "title": "BYD Dolphin Mini EV 38 kWh (100% Elétrico)",
    "badge": "⚡ 100% Elétrico — Oportunidade Repasse",
    "year": 2024,
    "km": 36000,
    "color": "Branco Apricity com Interior Azul",
    "fuel": "100% Elétrico (Bateria Blade 38 kWh)",
    "transmission": "Automático Direto",
    "price": 82900,
    "negotiatedTarget": 79900,
    "originalPrice": 96900,
    "fipePrice": 98500,
    "priceVsFipe": "-R$ 15.600 (Abaixo de Mercado)",
    "dealer": {
      "name": "AutoPrime Motors — Anhaia Mello",
      "type": "Especialista em Seminovos Elétricos",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Prudente",
      "address": "Av. Prof. Luiz Ignácio Anhaia Mello, 3400 - SP",
      "phone": "(11) 2345-6789",
      "whatsapp": "5511991234567",
      "verified": true
    },
    "specs": {
      "engine": "Motor Elétrico Síncrono 75 cv",
      "power": "75 cv - Torque Instantâneo 13,8 kgfm",
      "range": "280 km (Inmetro) / até 340 km na cidade",
      "consumptionCity": "R$ 0,08 por km rodado (~R$ 18 carga cheia)",
      "trunk": "230 Litros (expansível 930L)",
      "warranty": "Garantia Bateria Blade de 8 anos até 2032!",
      "features": ["Bateria Blade BYD", "Isenção de Rodízio em SP", "IPVA Especial SP", "Tela Giratória 10.1\"", "Carregador Portátil Original", "Auto-Hold", "6 Airbags"]
    },
    "financing": {
      "downPayment": 24870,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1712,
      "interestRate": 1.39,
      "bank": "BYD Financiamentos (BV / Santander)",
      "optionsText": "Loja aceita contraproposta de R$ 80.000 à vista! Financiamento com entrada de R$ 24.870 + 48x de R$ 1.712."
    },
    "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado Dekra",
    "tags": ["100% Elétrico", "Bateria Blade", "Garantia até 2032", "Isento de Rodízio"]
  },
  {
    "id": "byd-02",
    "isTarget": true,
    "modelCategory": "BYD Dolphin Mini",
    "title": "BYD Dolphin Mini EV 2024 — Particular / Ágio",
    "badge": "⚡ Direto com Proprietário / Ágio",
    "year": 2024,
    "km": 24000,
    "color": "Verde Sprout",
    "fuel": "100% Elétrico (Bateria Blade 38 kWh)",
    "transmission": "Automático Direto",
    "price": 79900,
    "originalPrice": 85000,
    "fipePrice": 98500,
    "priceVsFipe": "-R$ 18.600 (Preço Limite Casal)",
    "dealer": {
      "name": "Anúncio Verificado — Particular",
      "type": "Particular com Laudo Aprovado",
      "city": "São Bernardo do Campo",
      "state": "SP",
      "neighborhood": "Rudge Ramos",
      "address": "Av. Caminho do Mar, 2100 - SBC - SP",
      "phone": "(11) 98765-4321",
      "whatsapp": "5511987654321",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico 75cv",
      "power": "75 cv - 135 Nm",
      "range": "280 km Inmetro",
      "consumptionCity": "~R$ 16 por recarga completa residencial",
      "trunk": "230 Litros",
      "warranty": "Garantia BYD vigente de 5 anos carro + 8 anos bateria",
      "features": ["Wallbox Residencial Original Grátis!", "Carregador 220V", "Câmera 360", "Sensor Ponto Cego", "Bancos em Couro Elétricos"]
    },
    "financing": {
      "downPayment": 30000,
      "downPaymentPercent": 37.5,
      "termMonths": 36,
      "monthlyInstallment": 1780,
      "interestRate": 1.29,
      "bank": "Transferência Santander ou À Vista",
      "optionsText": "Aceita pagamento à vista integral de R$ 79.900 ou transferência de dívida (R$ 30k entrada + parcelas)."
    },
    "image": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado",
    "tags": ["Dentro do Orçamento", "Wallbox Grátis", "100% Elétrico", "Particular"]
  },
  {
    "id": "tera-01",
    "isTarget": true,
    "modelCategory": "Volkswagen Tera Automático",
    "title": "Volkswagen Tera Comfort 1.0 TSI Automático 2026",
    "badge": "Novo Lançamento VW — Cota / Diretoria",
    "year": 2025,
    "km": 9800,
    "color": "Azul Boreal",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático de 6 marchas Tiptronic",
    "price": 89900,
    "negotiatedTarget": 83000,
    "originalPrice": 105900,
    "fipePrice": 108000,
    "priceVsFipe": "-R$ 18.100 (Unidade de Diretoria)",
    "dealer": {
      "name": "Carrera Volkswagen — Ceasa",
      "type": "Concessionária Oficial VW",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Leopoldina",
      "address": "Av. Gastão Vidigal, 1450 - SP",
      "phone": "(11) 3649-2000",
      "whatsapp": "5511993332211",
      "verified": true
    },
    "specs": {
      "engine": "1.0 170 TSI Turbo Flex",
      "power": "116 cv - 16,8 kgfm torque",
      "consumptionCity": "12,6 km/l (G) / 9,0 km/l (E)",
      "consumptionRoad": "14,8 km/l (G) / 10,5 km/l (E)",
      "trunk": "350 Litros",
      "warranty": "Garantia Integral de Fábrica VW até 2028",
      "features": ["SUV de nova geração VW", "VW Play 10.1\" com IA Otto", "6 Airbags + Frenagem Autônoma", "Full LED", "Direção Elétrica"]
    },
    "financing": {
      "downPayment": 35000,
      "downPaymentPercent": 38.9,
      "termMonths": 48,
      "monthlyInstallment": 1598,
      "interestRate": 1.29,
      "bank": "Banco Volkswagen",
      "optionsText": "Seminovo de diretoria: entrada de R$ 35.000 ou seu orçamento de R$ 80k com saldo residual mínimo."
    },
    "image": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Impecável - Carro da montadora",
    "tags": ["Lançamento 2026", "SUV VW", "Garantia até 2028", "Turbo TSI"]
  },
  {
    "id": "sug-eletrico-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: 100% Elétrico",
    "title": "Renault Kwid E-Tech 100% Elétrico 2023",
    "badge": "⚡ O Elétrico Mais Acessível do Brasil",
    "year": 2023,
    "km": 21000,
    "color": "Verde Noronha Fosco",
    "fuel": "100% Elétrico (Bateria 26,8 kWh)",
    "transmission": "Automático Direto",
    "price": 69900,
    "originalPrice": 75900,
    "fipePrice": 76500,
    "priceVsFipe": "-R$ 6.600 (R$ 10k Abaixo do seu Orçamento!)",
    "dealer": {
      "name": "Renault Grand Brasil — Moema",
      "type": "Concessionária Oficial Renault",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Moema",
      "address": "Av. Ibirapuera, 2770 - Moema, São Paulo - SP",
      "phone": "(11) 5054-9000",
      "whatsapp": "5511995556677",
      "verified": true
    },
    "specs": {
      "engine": "Motor Elétrico 65 cv (48 kW)",
      "power": "65 cv - 11,5 kgfm imediato",
      "range": "298 km ciclo urbano (Inmetro)",
      "consumptionCity": "R$ 0,07 por km rodado! Carga caseira em 220V em ~4h",
      "trunk": "290 Litros",
      "warranty": "Garantia de Bateria até 2031!",
      "features": ["100% Elétrico por menos de R$ 70 mil!", "Isenção total do rodízio em SP", "Carrega em tomada residencial 110V/220V", "Câmera e Sensor de Ré", "6 Airbags", "Custo mensal de energia de apenas ~R$ 55"]
    },
    "financing": {
      "downPayment": 20970,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1445,
      "interestRate": 1.35,
      "bank": "Banco RCI / Renault",
      "optionsText": "Sobra mais de R$ 10.000 do seu teto de R$ 80 mil! Financiamento com R$ 20.970 de entrada + 48x de R$ 1.445."
    },
    "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado e revisado na concessionária",
    "tags": ["100% Elétrico", "Abaixo de 70k", "Sobra Dinheiro", "Garantia até 2031", "Isento de Rodízio"]
  },
  {
    "id": "sug-eletrico-02",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: 100% Elétrico",
    "title": "JAC E-JS1 100% Elétrico (Parceria VW) 2022",
    "badge": "⚡ Elétrico Urbano Ágil & Muito Equipado",
    "year": 2022,
    "km": 34000,
    "color": "Branco com Teto Preto",
    "fuel": "100% Elétrico (Bateria 30,2 kWh)",
    "transmission": "Automático Direto",
    "price": 68500,
    "originalPrice": 74000,
    "fipePrice": 75800,
    "priceVsFipe": "-R$ 7.300 (Dentro do Orçamento)",
    "dealer": {
      "name": "EletroCar Seminovos — Vila Olímpia",
      "type": "Loja Especializada em Elétricos",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Olímpia",
      "address": "Rua Funchal, 418 - Vila Olímpia, São Paulo - SP",
      "phone": "(11) 3045-8800",
      "whatsapp": "5511998761234",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico 62 cv",
      "power": "62 cv - 15,3 kgfm instantâneo",
      "range": "302 km ciclo urbano NEDC",
      "consumptionCity": "Custo por km de apenas R$ 0,08",
      "trunk": "121 Litros",
      "warranty": "Garantia de bateria JAC Motors",
      "features": ["Painel 100% Digital e Tela 10.25\"", "Freio de Mão Eletrônico com Auto-Hold", "Câmera de ré", "Couro", "Carregador portátil incluso"]
    },
    "financing": {
      "downPayment": 20550,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1415,
      "interestRate": 1.38,
      "bank": "Banco Santander / BV",
      "optionsText": "Entrada de R$ 20.550 + 48x de R$ 1.415 ou pagamento à vista com R$ 11.500 de sobra no seu teto."
    },
    "image": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado",
    "tags": ["100% Elétrico", "Torque Instantâneo", "Painel Digital", "Isento de Rodízio"]
  },
  {
    "id": "sug-vw-polo-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: Alternativa Direta ao Tera",
    "title": "Volkswagen Polo Comfortline 1.0 200 TSI AT 2021/2022",
    "badge": "Irmão do Tera com Mesma Base e Motor Turbo",
    "year": 2021,
    "km": 46000,
    "color": "Prata Sirius Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático Tiptronic 6 marchas com Paddle Shift",
    "price": 76900,
    "originalPrice": 81000,
    "fipePrice": 82500,
    "priceVsFipe": "-R$ 5.600 (Excelente Custo-Benefício)",
    "dealer": {
      "name": "Carrera Seminovos — Vila Leopoldina",
      "type": "Concessionária VW",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Leopoldina",
      "address": "Av. Imperatriz Leopoldina, 1200 - SP",
      "phone": "(11) 3838-5000",
      "whatsapp": "5511976543210",
      "verified": true
    },
    "specs": {
      "engine": "1.0 200 TSI Turbo Flex (128 cv)",
      "power": "128 cv (E) - 20,4 kgfm torque",
      "consumptionCity": "11,6 km/l (G) / 8,0 km/l (E)",
      "consumptionRoad": "14,1 km/l (G) / 9,8 km/l (E)",
      "trunk": "300 Litros",
      "warranty": "Garantia 1 ano concessionária Carrera",
      "features": ["Mesma plataforma MQB do VW Tera", "Aletas no volante para trocas de marchas", "Chave presencial com partida por botão", "Painel Digital Active Info Display", "Ar Climatronic"]
    },
    "financing": {
      "downPayment": 23070,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1589,
      "interestRate": 1.35,
      "bank": "Banco Volkswagen / Itaú",
      "optionsText": "Entrada de R$ 23.070 + 48x de R$ 1.589. Alternativa perfeita ao Tera com motor turbo mais forte e preço abaixo de R$ 80k!"
    },
    "image": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Laudo Aprovado Dekra",
    "tags": ["Base do Tera", "Motor TSI 128cv", "Painel Digital", "Borboletas Volante"]
  },
  {
    "id": "sug-suv-kicks-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: SUV Automático Confiável",
    "title": "Nissan Kicks SV 1.6 Flex CVT Automático 2021",
    "badge": "SUV Muito Confortável & Porta-Malas Gigante",
    "year": 2021,
    "km": 52000,
    "color": "Cinza Rust Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático Xtronic CVT",
    "price": 78900,
    "originalPrice": 83500,
    "fipePrice": 85900,
    "priceVsFipe": "-R$ 7.000",
    "dealer": {
      "name": "Daitan Nissan — Ibirapuera",
      "type": "Concessionária Nissan",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Moema",
      "address": "Av. República do Líbano, 1920 - Moema, SP",
      "phone": "(11) 5053-4000",
      "whatsapp": "5511985432109",
      "verified": true
    },
    "specs": {
      "engine": "1.6 16V Flex HR16DE",
      "power": "114 cv",
      "consumptionCity": "11,4 km/l (G)",
      "consumptionRoad": "13,7 km/l (G)",
      "trunk": "432 Litros (Porta-Malas Gigante)",
      "warranty": "Garantia 1 ano Daitan Nissan",
      "features": ["Porta-malas de 432 litros", "Bancos Gravidade Zero (conforto extremo)", "Câmera 360 graus panorâmica", "Chave Presencial", "Nissan Connect"]
    },
    "financing": {
      "downPayment": 23670,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1630,
      "interestRate": 1.36,
      "bank": "CrediNissan / Santander",
      "optionsText": "Entrada de R$ 23.670 + 48x de R$ 1.630. Excelente para viagens com a família."
    },
    "image": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Aprovado",
    "tags": ["Porta-Malas 432L", "Bancos Gravidade Zero", "Câmera 360", "Confiabilidade Japonesa"]
  },
  {
    "id": "sug-hatch-argo-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: Automático Mais Novo Possível",
    "title": "Fiat Argo Trekking 1.3 Flex AT CVT 2023/2024",
    "badge": "Ano 2024 Quase Zero KM",
    "year": 2024,
    "km": 19000,
    "color": "Laranja Montecarlo",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT",
    "price": 76500,
    "originalPrice": 82000,
    "fipePrice": 83900,
    "priceVsFipe": "-R$ 7.400",
    "dealer": {
      "name": "Amazonas Seminovos — Radial Leste",
      "type": "Concessionária Fiat Amazonas",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Tatuapé",
      "address": "Av. Radial Leste, 3200 - Tatuapé, SP",
      "phone": "(11) 2090-8000",
      "whatsapp": "5511974321987",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv (Mesma mecânica do Pulse)",
      "consumptionCity": "13,6 km/l (G) / 9,6 km/l (E)",
      "consumptionRoad": "15,1 km/l (G) / 10,8 km/l (E)",
      "trunk": "300 Litros",
      "warranty": "Garantia de fábrica Fiat ativa até 2027!",
      "features": ["Ano 2024 com apenas 19 mil km", "Versão aventureira com suspensão elevada", "Multimídia 7\"", "Câmera de ré", "Garantia de fábrica"]
    },
    "financing": {
      "downPayment": 22950,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1581,
      "interestRate": 1.34,
      "bank": "Banco Santander / Fiat",
      "optionsText": "Entrada de R$ 22.950 + 48x de R$ 1.581. Carro 2024 semi-novo com a mecânica moderna do Pulse."
    },
    "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    "cautelarStatus": "100% Impecável",
    "tags": ["Ano 2024", "Menos de 20 mil km", "Garantia até 2027", "Mecânica do Pulse"]
  }
];

class AutoRadarDataService {
  constructor() {
    this.cars = [];
    this.customCars = [];
    this.favorites = new Set();
    this.lastSync = null;
  }

  async init() {
    this.loadFavorites();
    this.loadCustomCars();

    try {
      const resp = await fetch('data/cars.json');
      if (resp.ok) {
        const json = await resp.json();
        this.cars = json.cars || [];
        this.lastSync = json.metadata?.lastUpdated || new Date().toISOString();
      } else {
        throw new Error('Falha HTTP ao carregar cars.json');
      }
    } catch (err) {
      console.warn('Carregando base de fallback offline do AutoRadar SP:', err.message);
      this.cars = [...DEFAULT_CARS_DATABASE];
      this.lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC) || new Date().toISOString();
    }

    // Mesclar anúncios cadastrados pelo casal
    if (this.customCars.length > 0) {
      this.cars = [...this.customCars, ...this.cars];
    }

    return this.cars;
  }

  loadFavorites() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) {
        this.favorites = new Set(JSON.parse(saved));
      }
    } catch (e) {
      this.favorites = new Set();
    }
  }

  toggleFavorite(carId) {
    if (this.favorites.has(carId)) {
      this.favorites.delete(carId);
    } else {
      this.favorites.add(carId);
    }
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...this.favorites]));
    return this.favorites.has(carId);
  }

  isFavorite(carId) {
    return this.favorites.has(carId);
  }

  loadCustomCars() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_CARS);
      if (saved) {
        this.customCars = JSON.parse(saved);
      }
    } catch (e) {
      this.customCars = [];
    }
  }

  addCustomCar(newCar) {
    newCar.id = 'custom-' + Date.now();
    newCar.isCustom = true;
    newCar.isTarget = ['Fiat Pulse Automático', 'BYD Dolphin Mini', 'Volkswagen Tera Automático'].includes(newCar.modelCategory);
    this.customCars.unshift(newCar);
    this.cars.unshift(newCar);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CARS, JSON.stringify(this.customCars));
    return newCar;
  }

  getAllCars() {
    return this.cars;
  }

  getTargetCars() {
    return this.cars.filter(c => c.isTarget);
  }

  getElectricCars() {
    return this.cars.filter(c => 
      (c.fuel && c.fuel.toLowerCase().includes('elétrico')) || 
      (c.modelCategory && c.modelCategory.toLowerCase().includes('elétrico')) ||
      (c.modelCategory && c.modelCategory.toLowerCase().includes('dolphin'))
    );
  }

  getSuggestionCars() {
    return this.cars.filter(c => !c.isTarget || c.isSuggestion);
  }

  getCarById(id) {
    return this.cars.find(c => c.id === id);
  }

  getLastSyncFormatted() {
    if (!this.lastSync) return 'Hoje às 12:00';
    try {
      const d = new Date(this.lastSync);
      const isToday = d.toDateString() === new Date().toDateString();
      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return isToday ? `Hoje às ${time}` : `${d.toLocaleDateString('pt-BR')} às ${time}`;
    } catch (e) {
      return 'Hoje às 12:00';
    }
  }

  triggerManualSync() {
    this.lastSync = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, this.lastSync);
    return this.getLastSyncFormatted();
  }
}

// Instância global para consumo no app
window.autoRadarData = new AutoRadarDataService();
