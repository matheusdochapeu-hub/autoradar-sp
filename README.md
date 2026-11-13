# AutoRadar SP — radar de preços de carros no Estado de São Paulo

> **App (PWA):** [https://matheusdochapeu-hub.github.io/autoradar-sp/](https://matheusdochapeu-hub.github.io/autoradar-sp/)
> **Repositório:** [https://github.com/matheusdochapeu-hub/autoradar-sp](https://github.com/matheusdochapeu-hub/autoradar-sp)

PWA em HTML/CSS/JS puro (sem build e sem dependências) que organiza **ofertas reais
de lojas de São Paulo** para três modelos-alvo:

1. **BYD Dolphin** (Mini, GS e Plus — 100% elétrico)
2. **Fiat Pulse** automático (1.3 CVT e Turbo 200)
3. **Volkswagen Tera** automático (com o Polo TSI como alternativa direta)

Além dos alvos, o catálogo traz sugestões de automáticos e elétricos por faixa de preço.

---

## O que o app faz

| Recurso | Como funciona |
|---|---|
| **Catálogo** | `data/cars.json` — cada oferta tem preço, FIPE, km, loja, cidade, foto e link do anúncio original |
| **Preço vs FIPE** | Mostra quanto o anúncio está acima ou abaixo da tabela FIPE |
| **Parcela estimada** | Tabela Price (48x, taxa de mercado ~2,5% a.m.) calculada em `js/financing.js` |
| **Filtros** | Modelo, preço máximo, combustível, região (geradas a partir do catálogo), ordenação e busca sem acento |
| **Teto de R$ 80.000** | Pílula no topo mostra quantas ofertas cabem no teto e filtra com 1 clique |
| **Favoritos** | Salva ofertas no `localStorage` e filtra por elas |
| **Comparador** | Até 3 veículos lado a lado, com duelos prontos |
| **Simulador** | Entrada, prazo (12–60x) e cenários de taxa; mostra juros totais e custo efetivo |
| **Meus anúncios** | Cadastro manual de uma oferta encontrada, salvo localmente |
| **Offline** | Service Worker com precache do app shell; fotos entram no cache sob demanda |

Nada de preço, FIPE ou link é gerado por estimativa: se um dado não existe, o campo
aparece como indisponível. A regra está em [AGENTS.md](AGENTS.md).

---

## Como rodar localmente

O app busca `data/cars.json` por `fetch`, então precisa de um servidor HTTP
(abrir o arquivo direto com `file://` cai no fallback embutido):

```powershell
python -m http.server 8000
# abra http://localhost:8000
```

## Testes e verificação

```powershell
node scripts/check-syntax.js               # sintaxe de js/*.js e sw.js
node scripts/sync-fallback.js --check      # fallback offline x catálogo
node --test "test/**/*.test.js"            # 22 testes
```

O CI em `.github/workflows/ci.yml` roda os três em todo push/PR.
A suíte cobre: catálogo válido (ids únicos, preço/FIPE/parcela coerentes, faixa de
preço), fallback sincronizado, links https, HTML/ordem dos scripts `?v=`,
precache do Service Worker e a versão do cache batendo com o `index.html`.

## Deploy

GitHub Pages via `.github/workflows/pages.yml` (branch `main`).
Ao publicar assets, suba a versão em três lugares: `?v=` dos scripts/CSS no
`index.html`, `APP_VER` inline e `CACHE_NAME` no `sw.js` (o teste falha se
ficarem diferentes).

---

## Estrutura

```
index.html            SPA (abas, filtros, simulador, formulário)
css/style.css         Tema escuro + responsivo
js/data.js            Catálogo (fetch + fallback offline) e regiões de SP
js/app.js             Filtros, render dos cards, comparador, PWA
js/financing.js       Tabela Price e formatação de moeda
data/cars.json        Fonte oficial do catálogo
sw.js                 Service Worker (cache versionado)
scripts/              check-syntax.js, sync-fallback.js, fetch_listings.py
test/                 Suíte node:test
updater.py            Manutenção de metadados/estatísticas do JSON
```

---

## Auditar o catálogo contra os anúncios

O catálogo só vale se bater com o anúncio publicado. Antes de confiar nos dados:

```powershell
python scripts/audit_catalog.py              # audita todas as ofertas
python scripts/audit_catalog.py --limit 10   # amostra
```

O script abre cada `listingUrl`, extrai preço, FIPE, cidade e ano publicados e
compara com `data/cars.json`. Ele **não altera nada**: grava
`data/audit-report.json` e imprime as divergências. Resultado da última execução
(13/11/2026): **0 de 43 ofertas batiam** — cidades, FIPE e anos do catálogo não
correspondem aos anúncios.

## Ampliar o catálogo (mais carros e mais cidades)

1. Encontre anúncios reais dos modelos-alvo em novas cidades.
2. Colete os dados com apoio do script (ele lê só o que a página publica):
   ```powershell
   python scripts/fetch_listings.py "https://carro.mercadolivre.com.br/MLB-..." --file links.txt
   ```
   O resultado vai para `data/candidates.json` com preço, foto, ano e link.
3. **Revise à mão** FIPE, loja, bairro e laudo — esses campos não vêm do anúncio.
4. Mova os aprovados para `data/cars.json` e rode:
   ```powershell
   node scripts/sync-fallback.js
   node --test "test/**/*.test.js"
   ```

As regiões do filtro são derivadas de `REGIOES_SP` + catálogo: uma cidade nova
aparece automaticamente no filtro, com a contagem de ofertas.
