# AutoRadar SP — Memória Persistente do Projeto

## 1. Visão Geral
- **URL de Produção:** https://matheusdochapeu-hub.github.io/autoradar-sp/
- **Repositório:** https://github.com/matheusdochapeu-hub/autoradar-sp.git
- **Objetivo:** Radar de ofertas reais de veículos em São Paulo (Pulse, BYD Dolphin e VW Tera, com alternativas automáticas/elétricas).

## 2. Histórico de Versões Recentes

### v22 (Novembro/2026) — +6 ofertas reais em SP (49 no total, 27 em SP)
- **Importador:** `scripts/import_candidates.py` recebe URLs de anúncios e só grava se:
  modelo é um dos alvos, preço plausível contra a FIPE (0,70x–1,30x), UF é SP, não é
  duplicata e a página responde. Cidade/UF vêm do anúncio.
- **Novas ofertas:** Pulse Impetus (Campinas, 2), Pulse Abarth (São Paulo),
  Pulse Drive Turbo (São Paulo), Dolphin Mini 38 kWh (São José do Rio Preto) e
  Tera High TSI (Taubaté).
- **Descartadas na validação:** Dolphin Mini a R$ 48.800 (0,46x da FIPE — anúncio
  suspeito), Tera Outfit em Caxias do Sul/RS e Tera Comfort em Itaguaí/RJ (fora de SP).
- **Campos opcionais de verdade:** `km` e `year` aceitam `null` quando o anúncio não
  informa — o card mostra "n/d" em vez de inventar 0 km.
- Região "Campinas e Região" volta a aparecer (2 ofertas). Total: 49 ofertas, 27 em SP.

### v21 (Novembro/2026) — Catálogo passa a refletir o anúncio (cidade, estado, FIPE, preço)
- **Auditoria completa:** `scripts/audit_catalog.py` abriu as 43 ofertas e comparou com o
  anúncio. Resultado: **0 de 43 batiam**. Cidade, FIPE e ano eram decorativos.
- **Dados corrigidos pelo anúncio:** preço, FIPE, ano, foto, cidade e **estado** agora vêm da
  página (`scripts/apply_audit.py`). Resultado: **21 ofertas em SP** e **22 em outros estados**
  (SC 6, RS 4, RJ 4, MG 3, DF/GO/AL/MS/ES 1 cada), com FIPE em 35 e 8 ofertas de site de loja
  sem preço legível no HTML.
- **Filtro de estado:** chips gerados do catálogo (`SP` é o padrão), com contagem; a região de
  SP só aparece quando o estado é SP. Cards fora de SP ganham o selo `Fora de SP • UF`.
- **Removido o que não tinha fonte:** WhatsApp (números sequenciais inventados), endereço,
  telefone, "laudo aprovado", preço de negociação e preço original. O contato agora é o
  anúncio oficial; o card mostra "Laudo no anúncio" em vez de afirmar perícia.
- **Títulos limpos:** a cidade que ficava no fim do título (ex.: "— Campinas") saiu, porque
  a localização real mudou.
- **Regiões de SP ampliadas:** Caieiras/Franco da Rocha (Grande SP), Lorena (Vale) e
  Lençóis Paulista (Bauru/Marília).
- Versão v21 no HTML, `APP_VER` e `CACHE_NAME`.

### v20 (Novembro/2026) — Auditoria de dados, UX honesta e base ampliável
- **Links:** 3 anúncios do Grupo Toriba (Dolphin Mini GS, Dolphin Mini 5L e Pulse Drive Alphaville)
  saíram do ar (HTTP 404). Passaram a apontar para o estoque oficial da loja, com
  `listingStatus: "estoque"` e aviso no card ("Ver Estoque").
- **Faixas de sugestão:** 12 dos 16 carros tinham `priceTier` errado (ex.: Kwid de R$ 85.900
  rotulado como "70k"). A faixa agora é derivada do preço real e o filtro usa preço, não rótulo.
  As faixas "Até 140k" e "Até 160k" antes não filtravam nada; agora filtram.
- **Regiões:** chips de filtro passaram a ser gerados do catálogo (`REGIOES_SP` + contagem),
  então a lista de locais cresce junto com os dados e não mostra região vazia.
- **Textos de oferta:** os cards de destaque não têm mais números fixos; mostram contagem,
  faixa real de preço e quantas ofertas cabem no teto de R$ 80.000.
- **Atualização:** o botão "Varredura Diária" (que só simulava uma espera) virou "Atualizar",
  que refaz o fetch de `data/cars.json` e informa quantas ofertas novas chegaram.
  "Limpar Cache" saiu do header para o rodapé; `alert()` foi trocado por toasts.
- **Favoritos:** existiam no `localStorage` sem nenhuma tela; agora há chip de filtro com contagem.
- **Fallback offline:** `js/data.js` era uma cópia manual de `data/cars.json` (risco de divergir).
  Agora é gerado por `scripts/sync-fallback.js` e um teste falha se sair de sincronia.
- **Qualidade:** escape de HTML e validação de URL (bloqueia `javascript:`), eventos delegados
  (sem re-bind a cada render), busca com debounce, modal acessível (ESC + foco) e rodapé com
  data do catálogo e disclaimer.
- **Testes:** 13 → 22, incluindo integridade do catálogo (ids, preço vs FIPE, parcela Price,
  `priceTier`, links) e versão do cache batendo com o `?v=` do HTML.
- **Precache:** removidas as 13 fotos locais órfãs (~1,9 MB) do precache; fotos dos anúncios
  entram no cache sob demanda.

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
