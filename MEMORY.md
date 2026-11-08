# AutoRadar SP — Memória Persistente do Projeto

## 1. Visão Geral
- **URL de Produção:** https://matheusdochapeu-hub.github.io/autoradar-sp/
- **Repositório:** https://github.com/matheusdochapeu-hub/autoradar-sp.git
- **Objetivo:** Radar inteligente de veículos em São Paulo (Pulse, BYD Dolphin Mini/Plus, VW Tera e alternativas automáticas/elétricas até R$ 80k-120k).

## 2. Histórico de Versões Recentes

### v19 (Novembro/2026) — Expansão do Catálogo: Gama Completa de Teras, Dolphins e Pulses
- **Volkswagen Tera Expandido (Gama Oficial 2026):**
  - Adicionado **Tera 1.0 MPI Manual** (Entrada por R$ 108.490 na Sorana VW ZN).
  - Adicionado **Tera Comfort 170 TSI Automático** (Intermediário por R$ 134.790 na Vigorito VW ABC).
  - Adicionado **Tera Highline 200 TSI Automático** (Topo de linha por R$ 147.190 na VW Ofertas Brasil).
  - Todos com fotos oficiais de estúdio das concessionárias autorizadas e links diretos de reserva/estoque.
- **BYD Dolphin Expandido:**
  - Adicionado **BYD Dolphin EV GS 44.9 kWh** (Hatch médio tradicional de 95 cv por R$ 104.900 na Dahruj Seminovos).
  - Adicionado **BYD Dolphin Plus 60.5 kWh 204 cv** esportivo com teto panorâmico (R$ 159.900 na Toriba Jardins).
- **Fiat Pulse Expandido (Gama Híbrida 2025):**
  - Adicionado **Fiat Pulse Audace 1.0 Turbo 200 Hybrid CVT 2025** (R$ 116.790 na Fiat Sinal Morumbi).
  - Adicionado **Fiat Pulse Impetus 1.0 Turbo 200 Hybrid Flex Aut 2025** (R$ 129.900 na Daitan Campinas).
- **Filtros de Preço Ampliados:**
  - Botões de filtro no topo e na aba de sugestões agora cobrem todas as faixas reais: `Todos os Preços` (padrão), `Até 80k`, `Até 100k`, `Até 120k`, `Até 140k` e `Até 160k`.
  - Catálogo total expandido para **43 veículos** auditados com links individuais e fotos reais.

### v18 (Novembro/2026) — Sincronização de Preços Reais Auditados dos Anúncios
- **Auditoria 100% Automatizada:** Realizado scraping de meta tags e títulos de cada anúncio individual (`carro.mercadolivre.com.br/MLB-...`, Grupo Toriba e Amazon VW) para extrair o valor real exato praticado no mercado.
- **Preços Reais Atualizados:** Eliminados valores fictícios/mockados. Todos os 36 veículos agora exibem exatamente o valor anunciado pelo vendedor/loja (ex: Pulse Drive CVT de R$ 83.900 a R$ 103.900; Dolphin Mini de R$ 95.000 a R$ 109.900; VW Tera oficial R$ 124.290 TSI e R$ 139.990 High).
- **Recálculo de Financiamento & FIPE:**
  - `downPayment` (Entrada 30%) e `monthlyInstallment` (48x com CET real de mercado 2.50% a.m.) recalculados sobre os preços reais.
  - `priceVsFipe` atualizado com a FIPE real de cada modelo/ano.
  - Filtro padrão no header ajustado para "Todos os Preços" ativo para permitir navegação imediata em todo o catálogo real.

### v17 (Novembro/2026) — Redesenho de Ações e Layout dos Cards
- **Diagramação em 2 Níveis de Ação:**
  - **Linha 1 (Conversão):** Botões com largura 50%/50% para "WhatsApp" (gradiente verde com ícone SVG) e "Ver Anúncio" (estilo ciano/azul com ícone de link externo).
  - **Linha 2 (Decisão):** Botões com largura 50%/50% para "Ficha Técnica" (modal com equipamentos completos) e "Comparar" (adiciona aos slots de comparação lado a lado).
  - Eliminado o corte/extravasamento do texto "Comparar" (que ocorria devido à caixinha fixa de 38px com 4 botões na mesma linha).
- **Correção da Linha de Concessionária e Laudo:**
  - Reestruturação em `.dealer-meta-left` e `.dealer-meta-right`.
  - Truncamento gracioso com `text-overflow: ellipsis` para nomes longos de concessionárias.
  - Badge do portal (`.car-portal-badge`) separado com destaque ciano sem colidir sobre o selo "Laudo OK" / "Periciado".

### v16 (Novembro/2026) — Links Diretos e Fotos Reais dos Anúncios
- **Links Diretos:** Todos os 36 veículos apontam para URLs específicas de anúncios individuais (`carro.mercadolivre.com.br/MLB-...` e páginas oficiais de concessionárias como Grupo Toriba e Amazon VW), sem buscas genéricas com parâmetros `?precoate=`.
- **Fotos Reais dos Anúncios:** Imagens extraídas das páginas ativas (`og:image`) em alta resolução.
- **Frontend Image Support:** `getExactCarImage` atualizado em `js/app.js` para renderizar URLs externas `http://` e `https://`.
- Sincronização em `data/cars.json` e `DEFAULT_CARS_DATABASE` em `js/data.js`.

### v15 (Novembro/2026) — Busca com Normalização e Empty States
- Correção de erro de referência `subfilterPills` em `app.js`.
- Adição de `normalizeText` (busca sem acentos/case insensitive) e filtro por termos múltiplos.
- Correção do teto de preço da aba de sugestões (teto 100k e 120k).
- Empty states contextuais com atalho de troca de aba.
