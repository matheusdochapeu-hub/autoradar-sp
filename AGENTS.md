# AGENTS.md — AutoRadar SP

> Contexto para agentes de IA. Escopo: **esta pasta**.

## O que é

PWA/marketplace de busca de carros, focado em elétricos e automáticos (BYD Dolphin,
Fiat Pulse e VW Tera como modelos-alvo). Traz preço vs. FIPE, financiamento estimado,
comparador lado a lado e link para o anúncio oficial. O filtro de estado começa em SP,
mas o catálogo tem ofertas de outros estados (cidade/UF vêm do anúncio).
O catálogo cobre ofertas de R$ 64k a R$ 150k; R$ 80.000 é o teto de orçamento do usuário.

## Stack

- PWA em HTML/CSS/vanilla JS (sem build, sem dependências).
- Catálogo e dados em `data/`; lógica em `js/`.
- `updater.py` + `agendar_tarefa_diaria.bat` mantêm os metadados do catálogo localmente.

## Rodar localmente

```powershell
python -m http.server 8000   # abrir http://localhost:8000
```

Abrir `index.html` direto por `file://` funciona só em modo fallback: o `fetch` de
`data/cars.json` é bloqueado, e o app usa a cópia embutida em `js/data.js`.

## Testes

```powershell
node scripts/check-syntax.js              # sintaxe de js/*.js e sw.js
node scripts/sync-fallback.js --check     # fallback offline x data/cars.json
node --test "test/**/*.test.js"           # 23 testes: catálogo, HTML, SW e sintaxe
```

CI em `.github/workflows/ci.yml` roda sintaxe + testes em todo push/PR.

O que a suíte protege: catálogo (`data/cars.json`) válido com ids únicos, preço vs
FIPE coerente, parcela na Tabela Price, `priceTier` batendo com o preço; fallback de
`js/data.js` sincronizado; scripts referenciados existentes, ordem de dependência
(`data.js` antes de `app.js`), uniformidade do `?v=`, precache do Service Worker e
`CACHE_NAME` igual à versão dos assets.

## Deploy

- GitHub Pages via `.github/workflows/pages.yml` (branch `main`):
  <https://matheusdochapeu-hub.github.io/autoradar-sp/>
- A branch `gh-pages` antiga foi removida; o conteúdo dela ficou no tag `legacy-gh-pages-v14`.
- Cache versionado em `sw.js` (`autoradar-sp-vN`).

## Arquivos-chave

| Arquivo | Papel |
|---|---|
| `index.html` | SPA (catálogo, radar elétrico, comparador, sugestões) |
| `js/app.js` | Filtros, cards, comparador, simulador e PWA |
| `js/data.js` | Catálogo (fetch/fallback), regiões de SP e helpers |
| `js/financing.js` | Tabela Price e formatação de moeda |
| `data/cars.json` | **Fonte oficial** do catálogo |
| `scripts/sync-fallback.js` | Regenera o fallback de `js/data.js` a partir do JSON |
| `scripts/fetch_listings.py` | Coleta candidatos de anúncios reais (revisão manual) |
| `scripts/audit_catalog.py` | Compara o catálogo com o anúncio publicado (preço, FIPE, cidade, UF, ano) |
| `scripts/apply_audit.py` | Grava no catálogo o que o anúncio publica e remove campo sem fonte |
| `sw.js` | Service Worker |
| `MEMORY.md` | Histórico de versões do catálogo |

## Regras críticas

1. **Preço, FIPE e links de loja são dados factuais.** Não invente valores nem URLs:
   se não houver fonte, marque como indisponível. Isso vale também para textos de
   marketing (README, cards de destaque): números fixos no HTML envelhecem e mentem.
2. Manter o padrão de "quanto abaixo da FIPE" e a estimativa de parcela — é o diferencial
   do app.
3. Ao publicar assets, **incremente a versão nos três lugares**: `?v=` no `index.html`,
   `APP_VER` inline e `CACHE_NAME` no `sw.js` (o teste falha se divergirem).
4. Ao alterar o catálogo, rode `node scripts/sync-fallback.js` e depois
   `node --test "test/**/*.test.js"` — a suíte valida o JSON, o fallback e os links.
5. **Nunca reaproveitar `id` no HTML** e mantenha o `?v=` uniforme: o app é servido
   pelo GitHub Pages e o cache do navegador já causou tela desatualizada.
6. Filtros de região devem ser gerados de `REGIOES_SP` + catálogo. Não fixe cidades
   no HTML: região sem oferta vira filtro que esvazia a tela.
7. **Rode `python scripts/audit_catalog.py` antes de publicar dados.** A auditoria de
   13/11/2026 mostrou 0/43 ofertas coerentes com o anúncio: cidade, FIPE e ano do
   catálogo não vinham da fonte. Dado de localização não pode ser decorativo.
8. **Contato só entra se estiver publicado.** Telefone/WhatsApp/endereço e "laudo
   aprovado" do catálogo antigo eram inventados (números sequenciais). Sem fonte, o
   card usa o anúncio oficial e mostra "Laudo no anúncio".
9. **Cidade/estado vêm do anúncio**, não do nome do arquivo nem do id antigo. Se um
   anúncio mudar de loja, rode auditoria + `apply_audit.py` de novo.

## Vizinhança (ecossistema)

- Independente dos demais apps; nenhuma integração de dados.
- Compartilha as convenções de PWA do ecossistema (Cache API + versão no `sw.js`).
