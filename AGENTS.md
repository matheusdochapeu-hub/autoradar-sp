# AGENTS.md — AutoRadar SP

> Contexto para agentes de IA. Escopo: **esta pasta**.

## O que é

PWA/marketplace de busca de carros no Estado de São Paulo, focado em elétricos e
automáticos até uma faixa de preço (BYD Dolphin, Fiat Pulse, VW Tera e alternativas).
Traz preço vs. FIPE, financiamento estimado, comparador lado a lado e contato por WhatsApp.

## Stack

- PWA em HTML/CSS/vanilla JS (sem build, sem dependências).
- Catálogo e dados em `data/`; lógica em `js/`.
- `updater.py` + `agendar_tarefa_diaria.bat` mantêm o catálogo atualizado localmente.

## Rodar localmente

```powershell
python -m http.server 8000   # abrir http://localhost:8000
```

## Testes

**Não há suíte automatizada** (ponto de melhoria prioritário). Ao alterar o catálogo,
valide manualmente: abrir o app, filtrar por faixa de preço e conferir os cards.

## Deploy

- GitHub Pages via `.github/workflows/pages.yml` (branch `main` + `gh-pages`):
  <https://matheusdochapeu-hub.github.io/autoradar-sp/>
- Cache versionado em `sw.js` (`autoradar-sp-vN`).

## Arquivos-chave

| Arquivo | Papel |
|---|---|
| `index.html` | SPA (catálogo, radar elétrico, comparador, sugestões) |
| `js/` | Filtros, renderização dos cards e simulador de financiamento |
| `data/` | Catálogo de veículos, preços e concessionárias |
| `updater.py` | Atualização do catálogo |
| `sw.js` | Service Worker |
| `MEMORY.md` | Histórico de versões do catálogo |

## Regras críticas

1. **Preço, FIPE e links de loja são dados factuais.** Não invente valores nem URLs:
   se não houver fonte, marque como indisponível.
2. Manter o padrão de "quanto abaixo da FIPE" e a estimativa de parcela — é o diferencial
   do app.
3. Ao publicar assets, **incrementar `CACHE_NAME`** no `sw.js`.
4. Enquanto não houver testes, **nunca reescrever `js/` em massa**: mudanças pequenas e
   verificação manual no navegador.
5. Adicionar uma suíte de testes em Node (padrão do `../maracaju88`) é bem-vindo.

## Vizinhança (ecossistema)

- Independente dos demais apps; nenhuma integração de dados.
- Compartilha as convenções de PWA do ecossistema (Cache API + versão no `sw.js`).
