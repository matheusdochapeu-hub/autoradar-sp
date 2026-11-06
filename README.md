# 🚗⚡ AutoRadar SP — Buscador de Carros & Marketplace até R$ 80k

Aplicativo e marketplace inteligente sob medida para **Matheus & Scarlet** encontrarem o carro ideal no Estado de São Paulo, priorizando:
1. **BYD Dolphin Mini** (100% Elétrico)
2. **Fiat Pulse Automático** (Drive 1.3 CVT ou Turbo 200 AT)
3. **Volkswagen Tera Automático** (1.0 TSI AT)
4. **Radar 100% Elétricos & Sugestões Similares até R$ 80.000**.

---

## 🌟 Funcionalidades do Aplicativo

### 1. 🎯 Visual Marketplace com Nossos 3 Alvos
- Cards completos com fotos de alta qualidade, quilometragem, ano, combustível, câmbio, porta-malas e laudo pericial cautelar.
- Preço à vista comparado com a Tabela FIPE (com indicação de quanto está abaixo do mercado).
- Opção de Financiamento detalhada no card: entrada recomendada e valor estimado da parcela em 48x.
- Botão direto de **WhatsApp** com mensagem pré-formatada para a concessionária/loja de SP.
- Localização exata em São Paulo (Capital, Santo André/ABC, São Bernardo, Campinas, Sorocaba).

### 2. ⚡ Radar 100% Elétricos (Preferência Declarada)
- Modelos 100% elétricos disponíveis até R$ 80k ou negociáveis:
  - **BYD Dolphin Mini**: Bateria Blade, 280 km de autonomia, tela giratória, isenção de rodízio SP.
  - **Renault Kwid E-Tech**: 100% elétrico por **R$ 69.900** (sobra R$ 10.000 no orçamento!).
  - **JAC E-JS1**: Parceria JAC/VW, 15,3 kgfm de torque imediato por **R$ 68.500**.
- Custo por km rodado calculado: apenas **~R$ 0,08 por km** (menos de R$ 60/mês para rodar 800 km).

### 3. 💡 Aba de Sugestões & Similares até R$ 80k
- Alternativas automáticas modernas caso o Tera ou Dolphin estejam com preços acima do teto:
  - **VW Polo Comfortline 200 TSI AT**: Mesma plataforma MQB e motor turbo do Tera por R$ 76.900.
  - **Nissan Kicks 1.6 CVT**: Conforto extremo com bancos Gravidade Zero e porta-malas gigante de 432L por R$ 78.900.
  - **Citroën C4 Cactus Feel 1.6 AT**: Câmbio japonês Aisin 6m e suspensão alta por R$ 73.900.
  - **Fiat Argo Trekking 1.3 CVT 2024**: Quase zero km (19.000 km) com a mesma mecânica do Pulse por R$ 76.500.

### 4. ⚖️ Comparador Técnico Lado a Lado
- Compare até 3 carros simultaneamente em autonomia, consumo na cidade/estrada, capacidade do porta-malas, potência, garantia e opções de financiamento.

### 5. 🧮 Simulador de Financiamento & Gestão do Orçamento de R$ 80k
- Simulação Tabela Price com sliders de entrada, prazos de 12 a 60 meses e taxas de juros reais de concessionária em SP.
- Cálculo de sobra de reserva: mostra quanto dos seus R$ 80.000 sobra intacto na conta rendendo no Tesouro Selic caso decida financiar parte da compra.

### 6. 🔄 Atualização Diária Automática
- **No App**: Botão *"Varredura Diária"* no topo para sincronizar e revalidar as ofertas das lojas.
- **Script Python (`updater.py`)**: Rotina que valida preços, recalcula índices e salva histórico em `data/cars.json` e `logs/daily_update.log`.
- **Agendador de Tarefas do Windows (`agendar_tarefa_diaria.bat`)**: Configura execução automática diária às 06:00 da manhã sem intervenção humana.

---

## 🚀 Como Executar

### Opção 1: Uso Direto no Navegador
Dê um duplo clique no arquivo [`index.html`](file:///c:/Users/matheus.ribeiro/Desktop/Matheus/5.%20IA/autoradar-sp/index.html) para abrir o aplicativo instantaneamente no seu navegador favorito (Chrome, Edge, etc.).

### Opção 2: Ativar Atualização Automática no Windows
1. Clique com o botão direito em [`agendar_tarefa_diaria.bat`](file:///c:/Users/matheus.ribeiro/Desktop/Matheus/5.%20IA/autoradar-sp/agendar_tarefa_diaria.bat) e selecione *"Executar como Administrador"*.
2. A tarefa `AutoRadarSP_DailyUpdate` será criada no Windows Task Scheduler para rodar todo dia às 06:00.

### Opção 3: Rodar Atualização Manual via Terminal
```bash
python updater.py
```
