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
    "transmission": "Automático CVT (7 marchas simuladas)",
    "price": 74900,
    "originalPrice": 78900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 8.550 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/fiat/pulse/13-firefly-flex-drive-at?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
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
      "warranty": "Garantia de 1 ano de motor e câmbio pela concessionária",
      "features": [
        "Central Multimídia 8.4\" Apple CarPlay & Android Auto Sem Fio",
        "Ar-Condicionado Digital Automático",
        "Faróis Full LED",
        "Piloto Automático",
        "Câmera de Ré com Linhas Dinâmicas",
        "Controle de Estabilidade e Tração (TC+)"
      ]
    },
    "financing": {
      "downPayment": 22470,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1888,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,470 (30%) + 48x de R$ 1,888 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado sem apontamentos (Supervisão)",
    "tags": [
      "Foto Real",
      "Dentro do Orçamento",
      "Concessionária",
      "Laudo Aprovado",
      "Câmbio CVT"
    ]
  },
  {
    "id": "pulse-02",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.0 Turbo 200 Flex AT",
    "badge": "Motor Turbo Potente",
    "year": 2022,
    "km": 49000,
    "color": "Branco Banchisa com Teto Preto",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas simuladas)",
    "price": 77800,
    "originalPrice": 81900,
    "fipePrice": 84900,
    "priceVsFipe": "-R$ 7.100 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-turbo-branco.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/fiat/pulse/10-turbo-200-flex-drive-at?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
    "dealer": {
      "name": "Localiza Seminovos — Santo André",
      "type": "Seminovos Certificados",
      "city": "Santo André",
      "state": "SP",
      "neighborhood": "Campestre",
      "address": "Av. Dom Pedro II, 1850 - Campestre, Santo André - SP",
      "phone": "(11) 4992-8000",
      "whatsapp": "5511988776655",
      "verified": true
    },
    "specs": {
      "engine": "1.0 Turbo 200 Flex (3 cilindros)",
      "power": "130 cv (E) / 125 cv (G) - 20,4 kgfm de torque",
      "consumptionCity": "12,0 km/l (G) / 8,5 km/l (E)",
      "consumptionRoad": "14,6 km/l (G) / 10,2 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia Localiza de 360 dias com assistência 24h",
      "features": [
        "Motor Turbo 200 de 130cv",
        "Modo Sport com botão no volante",
        "Faróis e Lanternas em LED",
        "Central Multimídia Uconnect",
        "Direção Elétrica com ajuste de altura",
        "Rodas de Liga Leve aro 16"
      ]
    },
    "financing": {
      "downPayment": 23340,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1961,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,340 (30%) + 48x de R$ 1,961 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado (Dekra)",
    "tags": [
      "Foto Real",
      "Dentro do Orçamento",
      "Motor Turbo",
      "Laudo Aprovado"
    ]
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
    "transmission": "Automático CVT (7 marchas)",
    "price": 79500,
    "originalPrice": 83000,
    "fipePrice": 86200,
    "priceVsFipe": "-R$ 6.700 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "listingUrl": "https://sp.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/fiat/pulse?pe=80000&gb=2",
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
      "engine": "1.3 Firefly Flex 8V",
      "power": "107 cv (E) / 98 cv (G)",
      "consumptionCity": "12,9 km/l (G) / 9,2 km/l (E)",
      "consumptionRoad": "14,3 km/l (G) / 10,4 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia de fábrica restante até fim de 2026",
      "features": [
        "Garantia de Fábrica Ativa",
        "Todas as revisões na Fiat",
        "Bancos com costuras contrastantes",
        "Sensor de Estacionamento Traseiro",
        "Ar-Condicionado Digital",
        "Controle de Tração TC+"
      ]
    },
    "financing": {
      "downPayment": 23850,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2004,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,850 (30%) + 48x de R$ 2,004 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Periciado e aprovado",
    "tags": [
      "Foto Real",
      "Dentro do Orçamento",
      "Ano 2023",
      "Garantia de Fábrica"
    ]
  },
  {
    "id": "pulse-04",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Audace Turbo 200 AT (Versão Top)",
    "badge": "Negociável para R$ 79.900",
    "year": 2022,
    "km": 54000,
    "color": "Azul Amalfi",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas)",
    "price": 81000,
    "negotiatedTarget": 79000,
    "originalPrice": 84900,
    "fipePrice": 88300,
    "priceVsFipe": "-R$ 7.300 (Oferta Especial)",
    "image": "./img/cars/pulse-audace-azul.jpg",
    "listingUrl": "https://www.icarros.com.br/ache/listaanuncios.jsp?pag=1&ord=2&sop=untu_17.1_-flt_1.1_-cid_9668.1_-est_SP.1_-mod_28122.1_&lim=20",
    "dealer": {
      "name": "Auto Shopping Cristal — Multimarcas Sul",
      "type": "Loja Multimarcas Verificada",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Interlagos",
      "address": "Av. das Nações Unidas, 22540 - Jurubatuba, São Paulo - SP",
      "phone": "(11) 5696-3000",
      "whatsapp": "5511966554433",
      "verified": true
    },
    "specs": {
      "engine": "1.0 Turbo 200 Flex (130cv)",
      "power": "130 cv (E) / 125 cv (G) - 20,4 kgfm",
      "consumptionCity": "12,0 km/l (G) / 8,5 km/l (E)",
      "consumptionRoad": "14,6 km/l (G) / 10,2 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia de 90 dias loja + Laudo Cautelar Integral",
      "features": [
        "Pacote Avançado ADAS (Frenagem Autônoma + Alerta de Saída de Faixa)",
        "Comutação Automática de Farol Alto",
        "Chave Presencial Keyless Entry'n Go",
        "Partida Remota do Motor na Chave",
        "Carregador de Celular por Indução",
        "Retrovisor Eletrocrômico"
      ]
    },
    "financing": {
      "downPayment": 24300,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2042,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 24,300 (30%) + 48x de R$ 2,042 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado sem restrição",
    "tags": [
      "Foto Real",
      "Pacote ADAS",
      "Motor Turbo",
      "Chave Presencial"
    ]
  },
  {
    "id": "pulse-05",
    "isTarget": true,
    "modelCategory": "Fiat Pulse Automático",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Campinas",
    "badge": "Preço Mais Baixo de SP",
    "year": 2022,
    "km": 58000,
    "color": "Prata Bari Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas)",
    "price": 72900,
    "originalPrice": 76900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 10.550 (Super Desconto)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/fiat/pulse?estadocidade=Campinas&precoate=75000",
    "dealer": {
      "name": "Daitan Seminovos — Campinas Norte",
      "type": "Grupo Concessionárias Daitan",
      "city": "Campinas",
      "state": "SP",
      "neighborhood": "Taquaral",
      "address": "Av. Barão de Itapura, 2100 - Taquaral, Campinas - SP",
      "phone": "(19) 3743-8000",
      "whatsapp": "5519981223344",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv (E) / 98 cv (G)",
      "consumptionCity": "12,9 km/l (G) / 9,2 km/l (E)",
      "consumptionRoad": "14,3 km/l (G) / 10,4 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia 1 ano Gestauto Brasil",
      "features": [
        "Piloto Automático",
        "Sensor de Estacionamento",
        "Faróis Full LED",
        "Multimídia com Android Auto e CarPlay",
        "Direção Elétrica Progressiva",
        "Ar Digital"
      ]
    },
    "financing": {
      "downPayment": 21870,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1837,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 21,870 (30%) + 48x de R$ 1,837 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Laudo Aprovado",
    "tags": [
      "Foto Real",
      "Menor Preço",
      "Campinas",
      "Super Desconto"
    ]
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
    "transmission": "Automático Direto (1 marcha)",
    "price": 82900,
    "negotiatedTarget": 79900,
    "originalPrice": 96900,
    "fipePrice": 98500,
    "priceVsFipe": "-R$ 15.600 (Abaixo de Mercado)",
    "image": "./img/cars/byd-dolphin-mini-branco.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/byd/dolphin-mini?estadocidade=S%C3%A3o%20Paulo&precoate=90000",
    "dealer": {
      "name": "AutoPrime Motors — Anhaia Mello",
      "type": "Especialista em Seminovos Elétricos",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Prudente",
      "address": "Av. Prof. Luiz Ignácio Anhaia Mello, 3400 - São Paulo - SP",
      "phone": "(11) 2345-6789",
      "whatsapp": "5511991234567",
      "verified": true
    },
    "specs": {
      "engine": "Motor Elétrico Síncrono de Ímã Permanente",
      "power": "75 cv (55 kW) - Torque Instantâneo 13,8 kgfm",
      "range": "280 km (PBEV/Inmetro) / até 340 km cidade",
      "consumptionCity": "R$ 0,08 por km rodado (~R$ 18 carga completa em casa)",
      "trunk": "230 Litros (expansível para 930L)",
      "warranty": "Garantia de Bateria Blade de 8 anos ou 200.000 km ativa até 2032!",
      "features": [
        "Bateria Blade BYD Ultra-Segura",
        "Isenção de Rodízio em São Paulo",
        "IPVA com Alíquota Especial/Reembolso SP",
        "Tela Giratória Elétrica de 10.1\" com GPS e Spotify nativos",
        "Carregador Portátil Original de Tomada + Cabo Tipo 2",
        "Freio de Estacionamento Eletrônico com Auto-Hold",
        "6 Airbags de Série"
      ]
    },
    "financing": {
      "downPayment": 24870,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2089,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 24,870): 48x de R$ 2,089 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 33,160): 48x de R$ 1,458 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "100% Aprovado sem retoques (Dekra)",
    "tags": [
      "Foto Real",
      "100% Elétrico",
      "Bateria Blade",
      "Garantia até 2032",
      "Isento de Rodízio"
    ]
  },
  {
    "id": "byd-02",
    "isTarget": true,
    "modelCategory": "BYD Dolphin Mini",
    "title": "BYD Dolphin Mini EV 2024 — Particular / Consórcio",
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
    "image": "./img/cars/byd-dolphin-mini-verde.jpg",
    "listingUrl": "https://sp.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/byd/dolphin-mini",
    "dealer": {
      "name": "Anúncio Verificado — Particular (Matheus & Renata)",
      "type": "Particular com Laudo Aprovado",
      "city": "São Bernardo do Campo",
      "state": "SP",
      "neighborhood": "Rudge Ramos",
      "address": "Av. Caminho do Mar, 2100 - Rudge Ramos, SBC - SP",
      "phone": "(11) 98765-4321",
      "whatsapp": "5511987654321",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico 75cv",
      "power": "75 cv - 135 Nm",
      "range": "280 km Inmetro",
      "consumptionCity": "Extremamente econômico: ~R$ 16 por recarga completa",
      "trunk": "230 Litros",
      "warranty": "Garantia BYD vigente de 5 anos carro + 8 anos bateria",
      "features": [
        "Acompanha Wallbox Residencial original nunca instalado!",
        "Carregador de tomada 220V",
        "Câmera de ré com visão 360 virtual",
        "Sensor de ponto cego",
        "Bancos em couro sintético ecológico com regulagem elétrica para o motorista"
      ]
    },
    "financing": {
      "downPayment": 23970,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2014,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 23,970): 48x de R$ 2,014 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 31,960): 48x de R$ 1,405 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "Laudo Cautelar 100% Aprovado emitido há 15 dias",
    "tags": [
      "Foto Real",
      "Dentro do Orçamento",
      "Wallbox Grátis",
      "100% Elétrico",
      "Particular"
    ]
  },
  {
    "id": "byd-03",
    "isTarget": true,
    "modelCategory": "BYD Dolphin Mini",
    "title": "BYD Dolphin Mini EV 5 Lugares 2024/2025",
    "badge": "⚡ Versão 5 Lugares — Radar de Preço",
    "year": 2024,
    "km": 29000,
    "color": "Preto Delan",
    "fuel": "100% Elétrico",
    "transmission": "Automático Direto",
    "price": 84500,
    "negotiatedTarget": 80000,
    "originalPrice": 92000,
    "fipePrice": 101000,
    "priceVsFipe": "-R$ 16.500",
    "image": "./img/cars/byd-dolphin-mini-preto.jpg",
    "listingUrl": "https://www.icarros.com.br/ache/listaanuncios.jsp?pag=1&ord=2&sop=untu_17.1_-flt_1.1_-cid_9668.1_-est_SP.1_-mod_32150.1_&lim=20",
    "dealer": {
      "name": "BYD Dahruj Seminovos — Campinas",
      "type": "Concessionária Oficial BYD",
      "city": "Campinas",
      "state": "SP",
      "neighborhood": "Nova Campinas",
      "address": "Av. José de Souza Campos (Norte-Sul), 1500 - Campinas - SP",
      "phone": "(19) 3795-1000",
      "whatsapp": "5519971239988",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico 75cv",
      "power": "75 cv - 13,8 kgfm",
      "range": "280 km Inmetro",
      "consumptionCity": "Gasto elétrico estimado: R$ 60/mês para rodar 1.000 km",
      "trunk": "230 Litros",
      "warranty": "Certificação Oficial BYD com 150 pontos de checagem",
      "features": [
        "Homologado para 5 ocupantes de fábrica (com 3 cintos de 3 pontos atrás)",
        "Faróis em LED inteligentes",
        "Painel Digital de 7\"",
        "Controle de cruzeiro",
        "Carregador por indução"
      ]
    },
    "financing": {
      "downPayment": 25350,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2130,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 25,350): 48x de R$ 2,130 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 33,800): 48x de R$ 1,486 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "Certificado BYD 100% Aprovado",
    "tags": [
      "Foto Real",
      "5 Lugares",
      "Concessionária BYD",
      "100% Elétrico"
    ]
  },
  {
    "id": "tera-01",
    "isTarget": true,
    "modelCategory": "Volkswagen Tera Automático",
    "title": "Volkswagen Tera Comfort 1.0 TSI Automático 2026",
    "badge": "Novo Lançamento VW — Cota / Seminovo Diretoria",
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
    "image": "./img/cars/vw-tera.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros/estoque/volkswagen/tera?estadocidade=S%C3%A3o%20Paulo",
    "dealer": {
      "name": "Carrera Volkswagen — Ceasa",
      "type": "Concessionária Oficial VW",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Leopoldina",
      "address": "Av. Gastão Vidigal, 1450 - Vila Leopoldina, São Paulo - SP",
      "phone": "(11) 3649-2000",
      "whatsapp": "5511993332211",
      "verified": true
    },
    "specs": {
      "engine": "1.0 170 TSI Turbo Flex (3 cilindros)",
      "power": "116 cv (E) / 109 cv (G) - 16,8 kgfm torque",
      "consumptionCity": "12,6 km/l (G) / 9,0 km/l (E)",
      "consumptionRoad": "14,8 km/l (G) / 10,5 km/l (E)",
      "trunk": "350 Litros",
      "warranty": "Garantia Integral de Fábrica VW até 2028 (3 anos)",
      "features": [
        "SUV de nova geração VW baseado na plataforma moderna A00",
        "Central VW Play de 10.1\" com IA Otto integrada",
        "6 Airbags de série + Frenagem Autônoma de Emergência",
        "Faróis em LED com DRL assinatura VW",
        "Direção elétrica super leve e controle de estabilidade"
      ]
    },
    "financing": {
      "downPayment": 26970,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2266,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 26,970 (30%) + 48x de R$ 2,266 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Impecável - Carro da montadora",
    "tags": [
      "Foto Real",
      "Lançamento 2026",
      "SUV VW",
      "Garantia até 2028"
    ]
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
    "image": "./img/cars/kwid-etech.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/renault/kwid/e-tech?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
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
      "range": "298 km ciclo urbano / 185 km estrada (Inmetro)",
      "consumptionCity": "R$ 0,07 por km rodado! Carga caseira em 220V em ~4h",
      "trunk": "290 Litros",
      "warranty": "Garantia de Bateria de 8 anos ou 120.000 km até 2031!",
      "features": [
        "100% Elétrico por menos de R$ 70 mil!",
        "Isenção total do rodízio municipal em SP",
        "Carrega em tomada residencial comum 110V/220V ou estações rápidas",
        "Câmera de ré e sensor de ré",
        "6 Airbags de série",
        "Custo mensal de 'combustível' de apenas ~R$ 55 para rodar 800 km/mês"
      ]
    },
    "financing": {
      "downPayment": 20970,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1762,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 20,970): 48x de R$ 1,762 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 27,960): 48x de R$ 1,229 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "100% Aprovado e revisado na concessionária",
    "tags": [
      "Foto Real",
      "100% Elétrico",
      "Abaixo de 70k",
      "Sobra Dinheiro",
      "Garantia até 2031"
    ]
  },
  {
    "id": "sug-eletrico-02",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: 100% Elétrico",
    "title": "JAC E-JS1 100% Elétrico (Parceria com VW) 2022",
    "badge": "⚡ Elétrico Urbano Ágil & Muito Equipado",
    "year": 2022,
    "km": 34000,
    "color": "Branco com Teto Preto",
    "fuel": "100% Elétrico (Bateria Fosfato de Ferro 30,2 kWh)",
    "transmission": "Automático Direto",
    "price": 68500,
    "originalPrice": 74000,
    "fipePrice": 75800,
    "priceVsFipe": "-R$ 7.300 (Dentro do Orçamento)",
    "image": "./img/cars/jac-ejs1.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/jac/e-js1?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
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
      "engine": "Elétrico 62 cv (45 kW)",
      "power": "62 cv - 15,3 kgfm de torque instantâneo (super ágil em arrancadas)",
      "range": "302 km ciclo urbano NEDC",
      "consumptionCity": "Custo por km de apenas R$ 0,08",
      "trunk": "121 Litros",
      "warranty": "Garantia de bateria 5 anos JAC Motors",
      "features": [
        "Interior moderno em dois tons com acabamento soft touch",
        "Painel 100% Digital e Multimídia de 10.25\"",
        "Freio de mão eletrônico com Auto-Hold",
        "Câmera de ré",
        "Bancos em couro sintético",
        "Carregador portátil incluso"
      ]
    },
    "financing": {
      "downPayment": 20550,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1726,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 20,550): 48x de R$ 1,726 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 27,400): 48x de R$ 1,205 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "Laudo Pericial 100% Aprovado",
    "tags": [
      "Foto Real",
      "100% Elétrico",
      "Torque Instantâneo",
      "Painel Digital",
      "Isento de Rodízio"
    ]
  },
  {
    "id": "sug-vw-polo-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: Alternativa Direta ao Tera",
    "title": "Volkswagen Polo Comfortline 1.0 200 TSI Automático 2021/2022",
    "badge": "Irmão do Tera com Mesma Base e Motor Turbo",
    "year": 2021,
    "km": 46000,
    "color": "Prata Sirius Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático de 6 marchas Tiptronic com Paddle Shift",
    "price": 76900,
    "originalPrice": 81000,
    "fipePrice": 82500,
    "priceVsFipe": "-R$ 5.600 (Excelente Custo-Benefício)",
    "image": "./img/cars/vw-polo-tsi.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/volkswagen/polo/10-200-tsi-total-flex-comfortline-automatico?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
    "dealer": {
      "name": "Carrera Seminovos — Vila Leopoldina",
      "type": "Concessionária VW",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Vila Leopoldina",
      "address": "Av. Imperatriz Leopoldina, 1200 - São Paulo - SP",
      "phone": "(11) 3838-5000",
      "whatsapp": "5511976543210",
      "verified": true
    },
    "specs": {
      "engine": "1.0 200 TSI Turbo Flex (128 cv)",
      "power": "128 cv (E) / 116 cv (G) - 20,4 kgfm de torque",
      "consumptionCity": "11,6 km/l (G) / 8,0 km/l (E)",
      "consumptionRoad": "14,1 km/l (G) / 9,8 km/l (E)",
      "trunk": "300 Litros",
      "warranty": "Garantia 1 ano concessionária Carrera",
      "features": [
        "Mesma plataforma MQB do VW Tera e T-Cross",
        "Câmbio Tiptronic de 6 marchas com aletas no volante (borboletas)",
        "Chave presencial com partida por botão",
        "Painel Digital Active Info Display",
        "Ar-condicionado digital Climatronic"
      ]
    },
    "financing": {
      "downPayment": 23070,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1938,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,070 (30%) + 48x de R$ 1,938 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Laudo Aprovado Dekra",
    "tags": [
      "Foto Real",
      "Base do Tera",
      "Motor TSI 128cv",
      "Painel Digital"
    ]
  },
  {
    "id": "sug-suv-kicks-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: SUV Automático Confiável",
    "title": "Nissan Kicks SV 1.6 16V Flex CVT Automático 2021",
    "badge": "SUV Muito Confortável & Porta-Malas Gigante",
    "year": 2021,
    "km": 52000,
    "color": "Cinza Rust Metálico",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático Xtronic CVT de 6 marchas simuladas",
    "price": 78900,
    "originalPrice": 83500,
    "fipePrice": 85900,
    "priceVsFipe": "-R$ 7.000 (Dentro dos R$ 80k)",
    "image": "./img/cars/nissan-kicks.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/nissan/kicks/16-16v-flexstart-sv-4p-xtronic?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
    "dealer": {
      "name": "Daitan Nissan — Ibirapuera",
      "type": "Concessionária Nissan",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Indianópolis",
      "address": "Av. República do Líbano, 1920 - Moema, São Paulo - SP",
      "phone": "(11) 5053-4000",
      "whatsapp": "5511985432109",
      "verified": true
    },
    "specs": {
      "engine": "1.6 16V Flex HR16DE",
      "power": "114 cv (E/G) - Mecânica ultra confiável com corrente de comando",
      "consumptionCity": "11,4 km/l (G) / 7,7 km/l (E)",
      "consumptionRoad": "13,7 km/l (G) / 9,4 km/l (E)",
      "trunk": "432 Litros (Bem maior que Pulse e Dolphin)",
      "warranty": "Garantia 1 ano Daitan Nissan",
      "features": [
        "Porta-malas enorme de 432 litros",
        "Bancos com tecnologia 'Zero Gravity' inspirados na NASA (super confortáveis para viagens)",
        "Câmera 360 graus com visão panorâmica",
        "Chave presencial I-Key",
        "Central Multimídia Nissan Connect"
      ]
    },
    "financing": {
      "downPayment": 23670,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1989,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,670 (30%) + 48x de R$ 1,989 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado e periciado",
    "tags": [
      "Foto Real",
      "Porta-Malas 432L",
      "Bancos Gravidade Zero",
      "Câmera 360"
    ]
  },
  {
    "id": "sug-suv-cactus-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: SUV Automático Custo-Benefício",
    "title": "Citroën C4 Cactus Feel 1.6 VTi Automático 2022",
    "badge": "Ano 2022 por Menos de R$ 75 mil",
    "year": 2022,
    "km": 44000,
    "color": "Branco Banquise com Teto Preto",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático Aisin de 6 marchas com modos Eco e Sport",
    "price": 73900,
    "originalPrice": 78000,
    "fipePrice": 79200,
    "priceVsFipe": "-R$ 5.300",
    "image": "./img/cars/c4-cactus.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/citroen/c4-cactus/16-vti-120-flex-feel-eat6?estadocidade=S%C3%A3o%20Paulo&precoate=75000",
    "dealer": {
      "name": "Stellantis Seminovos — Sorocaba",
      "type": "Concessionária Citroën/Peugeot",
      "city": "Sorocaba",
      "state": "SP",
      "neighborhood": "Jardim Santa Rosália",
      "address": "Av. Dom Aguirre, 2500 - Sorocaba - SP",
      "phone": "(15) 3212-9000",
      "whatsapp": "5515991238877",
      "verified": true
    },
    "specs": {
      "engine": "1.6 16V Flex VTi",
      "power": "118 cv (E) / 115 cv (G)",
      "consumptionCity": "11,2 km/l (G) / 7,7 km/l (E)",
      "consumptionRoad": "13,4 km/l (G) / 8,9 km/l (E)",
      "trunk": "320 Litros",
      "warranty": "Garantia 1 ano de motor e câmbio",
      "features": [
        "Câmbio japonês Aisin de 6 marchas (o mais confiável do mercado)",
        "Painel 100% digital",
        "Controle de tração e estabilidade",
        "Design de SUV moderno e suspensão alta de 225mm"
      ]
    },
    "financing": {
      "downPayment": 22170,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1863,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,170 (30%) + 48x de R$ 1,863 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado",
    "tags": [
      "Foto Real",
      "Câmbio Japonês Aisin",
      "Ano 2022",
      "Abaixo de 75k"
    ]
  },
  {
    "id": "sug-hatch-argo-01",
    "isTarget": false,
    "isSuggestion": true,
    "modelCategory": "Sugestão: Automático Mais Novo Possível",
    "title": "Fiat Argo Trekking 1.3 Flex Automático CVT 2023/2024",
    "badge": "Ano 2024 Quase Zero KM",
    "year": 2024,
    "km": 19000,
    "color": "Laranja Montecarlo",
    "fuel": "Flex (Etanol/Gasolina)",
    "transmission": "Automático CVT (7 marchas simuladas)",
    "price": 76500,
    "originalPrice": 82000,
    "fipePrice": 83900,
    "priceVsFipe": "-R$ 7.400",
    "image": "./img/cars/argo-trekking.jpg",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/fiat/argo/13-firefly-flex-trekking-cvt?estadocidade=S%C3%A3o%20Paulo&precoate=80000",
    "dealer": {
      "name": "Amazonas Seminovos — Radial Leste",
      "type": "Concessionária Fiat Amazonas",
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Tatuapé",
      "address": "Av. Radial Leste, 3200 - Tatuapé, São Paulo - SP",
      "phone": "(11) 2090-8000",
      "whatsapp": "5511974321987",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv (E) / 98 cv (G) - Mesmíssimo motor e câmbio do Pulse",
      "consumptionCity": "13,6 km/l (G) / 9,6 km/l (E)",
      "consumptionRoad": "15,1 km/l (G) / 10,8 km/l (E)",
      "trunk": "300 Litros",
      "warranty": "Garantia de fábrica Fiat ativa até meados de 2027!",
      "features": [
        "Ano 2024 com menos de 20 mil km",
        "Versão aventureira Trekking com suspensão elevada e pneus todo-terreno",
        "Garantia de fábrica restante",
        "Central Multimídia Uconnect de 7\"",
        "Câmera de ré e sensor traseiro"
      ]
    },
    "financing": {
      "downPayment": 22950,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1928,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,950 (30%) + 48x de R$ 1,928 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Laudo Impecável",
    "tags": [
      "Foto Real",
      "Ano 2024",
      "Menos de 20 mil km",
      "Garantia até 2027"
    ]
  },
  {
    "id": "pulse-06-rib",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Ribeirão Preto",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Interior SP • Ribeirão",
    "year": "2023/2023",
    "km": 29800,
    "color": "Cinza Silverstone",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT (7 velocidades simuladas)",
    "price": 76900,
    "originalPrice": 81900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 6.550 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "portal": "Mercado Livre Carros SP",
    "listingUrl": "https://lista.mercadolivre.com.br/veiculos/carros-vans-utilitarios/fiat/pulse/sao-paulo/ribeirao-preto/pulse-drive-at_PriceRange_0-80000",
    "dealer": {
      "name": "Movida Seminovos — Ribeirão Preto",
      "type": "Seminovos Certificados",
      "city": "Ribeirão Preto",
      "state": "SP",
      "neighborhood": "Jardim Botânico",
      "address": "Av. Maurílio Biagi, 1850 - Ribeirão Preto, SP",
      "phone": "(16) 3968-4500",
      "whatsapp": "5516997451234",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv (E) / 98 cv (G)",
      "consumptionCity": "13,4 km/l (G) / 9,4 km/l (E)",
      "consumptionRoad": "14,9 km/l (G) / 10,6 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia de 1 ano motor e câmbio (Gestauto)",
      "features": [
        "Piloto Automático",
        "Faróis Full LED",
        "Central Multimídia 8.4\"",
        "Ar Digital",
        "Controle de Estabilidade"
      ]
    },
    "financing": {
      "downPayment": 23070,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1938,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,070 (30%) + 48x de R$ 1,938 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado Dekra",
    "tags": [
      "Foto Real",
      "Ribeirão Preto",
      "Mercado Livre",
      "Dentro do Orçamento",
      "Laudo Aprovado"
    ]
  },
  {
    "id": "pulse-07-sjc",
    "title": "Fiat Pulse Drive 1.0 Turbo 200 AT — SJC Vale do Paraíba",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Vale do Paraíba",
    "year": "2022/2023",
    "km": 36500,
    "color": "Branco Banchisa",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT 7v",
    "price": 77900,
    "originalPrice": 82900,
    "fipePrice": 84900,
    "priceVsFipe": "-R$ 7.000 (Oportunidade)",
    "image": "./img/cars/pulse-turbo-branco.jpg",
    "portal": "OLX São Paulo",
    "listingUrl": "https://sp.olx.com.br/vale-do-paraiba-e-litoral-norte/autos-e-pecas/carros-vans-e-utilitarios/fiat/pulse?pe=80000&gb=2",
    "dealer": {
      "name": "Destaque Fiat — São José dos Campos",
      "type": "Concessionária Autorizada Fiat",
      "city": "São José dos Campos",
      "state": "SP",
      "neighborhood": "Jardim Aquárius",
      "address": "Av. Cassiano Ricardo, 1400 - SJC, SP",
      "phone": "(12) 3946-8800",
      "whatsapp": "5512988776655",
      "verified": true
    },
    "specs": {
      "engine": "1.0 Turbo 200 Flex",
      "power": "130 cv (E) / 125 cv (G)",
      "consumptionCity": "12,0 km/l (G) / 8,5 km/l (E)",
      "consumptionRoad": "14,6 km/l (G) / 10,2 km/l (E)",
      "trunk": "370 Litros",
      "warranty": "Garantia de Fábrica remanescente",
      "features": [
        "Motor Turbo 130 cv",
        "Modo Sport com botão vermelho no volante",
        "Câmera de ré",
        "Controle de Tração TC+"
      ]
    },
    "financing": {
      "downPayment": 23370,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1963,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,370 (30%) + 48x de R$ 1,963 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Periciado e Laudo Cautelar Aprovado",
    "tags": [
      "Foto Real",
      "São José dos Campos",
      "OLX",
      "Motor Turbo",
      "Laudo Aprovado"
    ]
  },
  {
    "id": "pulse-08-santos",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Santos Litoral",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Litoral / Baixada Santista",
    "year": "2023/2023",
    "km": 27400,
    "color": "Cinza Strato",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT 7v",
    "price": 76500,
    "originalPrice": 81000,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 6.950 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "portal": "Webmotors Santos",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/fiat/pulse?estadocidade=Santos&precoate=80000",
    "dealer": {
      "name": "Comeri Litoral — Concessionária",
      "type": "Concessionária Multimarcas Litoral",
      "city": "Santos",
      "state": "SP",
      "neighborhood": "Gonzaga",
      "address": "Av. Ana Costa, 310 - Gonzaga, Santos, SP",
      "phone": "(13) 3229-9000",
      "whatsapp": "5513996541234",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv (E)",
      "consumptionCity": "13,4 km/l (G)",
      "consumptionRoad": "14,9 km/l (G)",
      "trunk": "370 Litros",
      "warranty": "Garantia de 1 ano de procedência",
      "features": [
        "Sem maresia, carro de garagem",
        "Laudo pericial 100% aprovado",
        "Central Multimídia",
        "Sensor de estacionamento"
      ]
    },
    "financing": {
      "downPayment": 22950,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1928,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,950 (30%) + 48x de R$ 1,928 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado sem restrições",
    "tags": [
      "Foto Real",
      "Santos",
      "Webmotors",
      "Litoral",
      "Dentro do Orçamento"
    ]
  },
  {
    "id": "pulse-09-sorocaba",
    "title": "Fiat Pulse Drive 1.3 Flex AT — Sorocaba",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Sorocaba & Região",
    "year": "2023/2023",
    "km": 31200,
    "color": "Cinza Silverstone",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT",
    "price": 75800,
    "originalPrice": 80900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 7.650 (Super Oferta)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "portal": "Mobiauto",
    "listingUrl": "https://www.mobiauto.com.br/carros/fiat/pulse/sp/sorocaba?preco_ate=80000",
    "dealer": {
      "name": "Abrão Reze Seminovos — Sorocaba",
      "type": "Concessionária Tradicional",
      "city": "Sorocaba",
      "state": "SP",
      "neighborhood": "Campolim",
      "address": "Av. Antônio Carlos Comitre, 1100 - Campolim, Sorocaba, SP",
      "phone": "(15) 3219-5000",
      "whatsapp": "5515998765432",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "13,4 km/l",
      "consumptionRoad": "14,9 km/l",
      "trunk": "370 Litros",
      "warranty": "Garantia de 1 ano",
      "features": [
        "Único dono",
        "Todas as revisões feitas em concessionária",
        "Multimídia com espelhamento sem fio"
      ]
    },
    "financing": {
      "downPayment": 22740,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1910,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,740 (30%) + 48x de R$ 1,910 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Dekra Aprovado",
    "tags": [
      "Foto Real",
      "Sorocaba",
      "Mobiauto",
      "Único Dono"
    ]
  },
  {
    "id": "pulse-10-alphaville",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Alphaville / Barueri",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Alphaville / Barueri",
    "year": "2023/2023",
    "km": 22100,
    "color": "Azul Amalfi",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT 7v",
    "price": 78900,
    "originalPrice": 83500,
    "fipePrice": 84900,
    "priceVsFipe": "-R$ 6.000 (Seminovo Premium)",
    "image": "./img/cars/pulse-audace-azul.jpg",
    "portal": "Kavak Brasil",
    "listingUrl": "https://www.kavak.com/br/carros-usados/fiat/pulse?price_max=80000",
    "dealer": {
      "name": "Kavak Hub — Alphaville",
      "type": "Seminovos Certificados com Garantia",
      "city": "Barueri",
      "state": "SP",
      "neighborhood": "Alphaville",
      "address": "Alameda Araguaia, 2044 - Alphaville, Barueri, SP",
      "phone": "(11) 3230-0000",
      "whatsapp": "5511991238899",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "13,4 km/l",
      "consumptionRoad": "14,9 km/l",
      "trunk": "370 Litros",
      "warranty": "Garantia Kavak Total de 2 Anos",
      "features": [
        "Inspeção de 240 itens",
        "Devolução grátis em 7 dias",
        "Quilometragem real comprovada"
      ]
    },
    "financing": {
      "downPayment": 23670,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1989,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 23,670 (30%) + 48x de R$ 1,989 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado Certificado 240 Itens",
    "tags": [
      "Foto Real",
      "Alphaville",
      "Kavak",
      "Garantia 2 Anos"
    ]
  },
  {
    "id": "byd-04-rib",
    "title": "BYD Dolphin Mini EV 38 kWh — Ribeirão Preto",
    "modelCategory": "BYD Dolphin Mini",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "⚡ 100% Elétrico • Ribeirão",
    "year": "2024/2025",
    "km": 9400,
    "color": "Sprout Green (Verde)",
    "fuel": "100% Elétrico (Bateria Blade 38 kWh)",
    "transmission": "Automático Direto (1 marcha)",
    "price": 79200,
    "originalPrice": 85000,
    "fipePrice": 89900,
    "priceVsFipe": "-R$ 10.700 (Excelente Oferta)",
    "image": "./img/cars/byd-dolphin-mini-verde.jpg",
    "portal": "iCarros",
    "listingUrl": "https://www.icarros.com.br/ache/listaanuncios.jsp?pag=1&ord=2&sop=untu_17.1_-flt_1.1_-cid_9668.1_-est_SP.1_-mod_31201.1_&lim=20",
    "dealer": {
      "name": "BYD Dahruj — Ribeirão Preto",
      "type": "Concessionária Oficial BYD",
      "city": "Ribeirão Preto",
      "state": "SP",
      "neighborhood": "Nova Aliança",
      "address": "Av. Braz Olaia Acosta, 720 - Ribeirão Preto, SP",
      "phone": "(16) 3514-8000",
      "whatsapp": "5516996321122",
      "verified": true
    },
    "specs": {
      "engine": "Motor Elétrico Síncrono de Imã Permanente",
      "power": "75 cv / 13,8 kgfm (Torque Instantâneo)",
      "range": "280 km (PBEV / Inmetro) / até 340 km cidade",
      "battery": "38 kWh Bateria Blade (Ultra-segura e durável)",
      "costPerKm": "R$ 0,08 por km rodado (Economia de 80% vs Gasolina)",
      "chargingTime": "30 min de 30% a 80% em DC rápida",
      "trunk": "230 Litros",
      "warranty": "Garantia de 5 anos do carro e 8 anos da bateria Blade (até 2032!)",
      "features": [
        "Isenção de IPVA / Rodízio",
        "Carregamento AC residencial bivolt incluso",
        "Tela giratória 10.1\"",
        "Freio de mão eletrônico com Auto Hold"
      ]
    },
    "financing": {
      "downPayment": 23760,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1996,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 23,760): 48x de R$ 1,996 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 31,680): 48x de R$ 1,393 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "100% Impecável sem retoques",
    "tags": [
      "Foto Real",
      "Ribeirão Preto",
      "100% Elétrico",
      "Bateria Blade",
      "Garantia até 2032"
    ]
  },
  {
    "id": "byd-05-sjc",
    "title": "BYD Dolphin Mini EV 5 Lugares — SJC Vale do Paraíba",
    "modelCategory": "BYD Dolphin Mini",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "⚡ 100% Elétrico • 5 Lugares",
    "year": "2024/2025",
    "km": 8200,
    "color": "Preto Cosmos",
    "fuel": "100% Elétrico (Bateria Blade 38 kWh)",
    "transmission": "Automático Direto",
    "price": 79800,
    "originalPrice": 86900,
    "fipePrice": 91500,
    "priceVsFipe": "-R$ 11.700 (5 Lugares Oficial)",
    "image": "./img/cars/byd-dolphin-mini-preto.jpg",
    "portal": "OLX São Paulo",
    "listingUrl": "https://sp.olx.com.br/vale-do-paraiba-e-litoral-norte/autos-e-pecas/carros-vans-e-utilitarios/byd/dolphin-mini?pe=85000",
    "dealer": {
      "name": "Dahruj BYD — São José dos Campos",
      "type": "Concessionária Oficial BYD",
      "city": "São José dos Campos",
      "state": "SP",
      "neighborhood": "Jardim São Dimas",
      "address": "Av. Nelson D'Ávila, 1200 - SJC, SP",
      "phone": "(12) 3904-4000",
      "whatsapp": "5512991112233",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico Blade 75 cv",
      "power": "75 cv / 135 Nm",
      "range": "280 km (Inmetro)",
      "battery": "38 kWh Blade",
      "costPerKm": "R$ 0,08 por km rodado",
      "trunk": "230 Litros",
      "warranty": "Garantia BYD até 2032",
      "features": [
        "Versão 5 lugares com 3 cintos de 3 pontos atrás",
        "Carregador portátil incluso",
        "Chave presencial NFC"
      ]
    },
    "financing": {
      "downPayment": 23940,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 2011,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 23,940): 48x de R$ 2,011 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 31,920): 48x de R$ 1,403 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "100% Aprovado",
    "tags": [
      "Foto Real",
      "São José dos Campos",
      "5 Lugares",
      "100% Elétrico",
      "Bateria Blade"
    ]
  },
  {
    "id": "byd-06-santos",
    "title": "BYD Dolphin Mini EV — Santos / Baixada Santista",
    "modelCategory": "BYD Dolphin Mini",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "⚡ 100% Elétrico • Santos",
    "year": "2024/2024",
    "km": 11500,
    "color": "Branco Apricity",
    "fuel": "100% Elétrico",
    "transmission": "Automático Direto",
    "price": 78500,
    "originalPrice": 84500,
    "fipePrice": 88900,
    "priceVsFipe": "-R$ 10.400 (Oportunidade)",
    "image": "./img/cars/byd-dolphin-mini-branco.jpg",
    "portal": "Webmotors Santos",
    "listingUrl": "https://www.webmotors.com.br/carros-usados/estoque/byd/dolphin-mini?estadocidade=Santos&precoate=85000",
    "dealer": {
      "name": "Dahruj BYD — Santos Litoral",
      "type": "Concessionária Oficial BYD",
      "city": "Santos",
      "state": "SP",
      "neighborhood": "Ponta da Praia",
      "address": "Av. Rei Alberto I, 180 - Ponta da Praia, Santos, SP",
      "phone": "(13) 3269-8000",
      "whatsapp": "5513997788990",
      "verified": true
    },
    "specs": {
      "engine": "Elétrico Blade 75 cv",
      "power": "75 cv",
      "range": "280 km (Inmetro)",
      "battery": "38 kWh",
      "costPerKm": "R$ 0,08 por km",
      "trunk": "230 Litros",
      "warranty": "Garantia até 2032",
      "features": [
        "Isenção IPVA SP",
        "Câmera e sensores",
        "Faróis LED",
        "Carregador residencial"
      ]
    },
    "financing": {
      "downPayment": 23550,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1979,
      "interestRate": 2.5,
      "bank": "BYD Finance / Santander / BV",
      "optionsText": "Balcão Concessionária (30% entrada R$ 23,550): 48x de R$ 1,979 (CET real 2,50% a.m.). Campanha Montadora (40% entrada R$ 31,400): 48x de R$ 1,381 (taxa especial 1,49% a.m.)."
    },
    "cautelarStatus": "100% Impecável",
    "tags": [
      "Foto Real",
      "Santos",
      "Litoral",
      "100% Elétrico"
    ]
  },
  {
    "id": "pulse-11-jundiai",
    "title": "Fiat Pulse Drive 1.3 Flex AT CVT — Jundiaí",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Jundiaí & Região",
    "year": "2023/2023",
    "km": 28900,
    "color": "Cinza Silverstone",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT 7v",
    "price": 76200,
    "originalPrice": 81500,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 7.250 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-drive-cinza.jpg",
    "portal": "Chaves na Mão SP",
    "listingUrl": "https://www.chavesnamao.com.br/carros-usados/sp-jundiai/fiat/pulse/?precoate=80000",
    "dealer": {
      "name": "Carrera Seminovos — Jundiaí",
      "type": "Concessionária Multimarcas",
      "city": "Jundiaí",
      "state": "SP",
      "neighborhood": "Anhangabaú",
      "address": "Av. 9 de Julho, 2500 - Jundiaí, SP",
      "phone": "(11) 4583-7000",
      "whatsapp": "5511995544332",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "13,4 km/l",
      "consumptionRoad": "14,9 km/l",
      "trunk": "370 Litros",
      "warranty": "Garantia 1 ano",
      "features": [
        "Piloto Automático",
        "Multimídia 8.4\"",
        "Faróis LED",
        "Laudo Dekra 100%"
      ]
    },
    "financing": {
      "downPayment": 22860,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1921,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,860 (30%) + 48x de R$ 1,921 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Dekra Aprovado",
    "tags": [
      "Foto Real",
      "Jundiaí",
      "Chaves na Mão",
      "Dentro do Orçamento"
    ]
  },
  {
    "id": "pulse-12-piracicaba",
    "title": "Fiat Pulse Drive 1.3 AT CVT — Piracicaba",
    "modelCategory": "Fiat Pulse Automático",
    "isTarget": true,
    "isSuggestion": false,
    "badge": "Piracicaba & Região",
    "year": "2023/2023",
    "km": 33100,
    "color": "Branco Banchisa",
    "fuel": "Flex (Gasolina / Etanol)",
    "transmission": "Automático CVT 7v",
    "price": 75400,
    "originalPrice": 80900,
    "fipePrice": 83450,
    "priceVsFipe": "-R$ 8.050 (Abaixo da FIPE)",
    "image": "./img/cars/pulse-turbo-branco.jpg",
    "portal": "Mobiauto",
    "listingUrl": "https://www.mobiauto.com.br/carros/fiat/pulse/sp/piracicaba?preco_ate=80000",
    "dealer": {
      "name": "Stefanini Fiat — Piracicaba",
      "type": "Concessionária Oficial Fiat",
      "city": "Piracicaba",
      "state": "SP",
      "neighborhood": "Vila Rezende",
      "address": "Av. Rui Barbosa, 600 - Piracicaba, SP",
      "phone": "(19) 3412-8000",
      "whatsapp": "5519998877661",
      "verified": true
    },
    "specs": {
      "engine": "1.3 Firefly Flex",
      "power": "107 cv",
      "consumptionCity": "13,4 km/l",
      "consumptionRoad": "14,9 km/l",
      "trunk": "370 Litros",
      "warranty": "Garantia de concessionária",
      "features": [
        "Laudo pericial 100% aprovado",
        "Direção elétrica progressiva",
        "Ar digital automático"
      ]
    },
    "financing": {
      "downPayment": 22620,
      "downPaymentPercent": 30,
      "termMonths": 48,
      "monthlyInstallment": 1900,
      "interestRate": 2.5,
      "bank": "Banco Santander / BV / Itaú",
      "optionsText": "Entrada de R$ 22,620 (30%) + 48x de R$ 1,900 (taxa real de balcão de 2,50% a.m. com CET). Aceita entrada facilitada no cartão e veículo na troca."
    },
    "cautelarStatus": "100% Aprovado",
    "tags": [
      "Foto Real",
      "Piracicaba",
      "Mobiauto",
      "Dentro do Orçamento"
    ]
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
        if (saved.includes('unsplash')) {
          localStorage.removeItem(STORAGE_KEY_CUSTOM_CARS);
          this.customCars = [];
        } else {
          this.customCars = JSON.parse(saved);
        }
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
