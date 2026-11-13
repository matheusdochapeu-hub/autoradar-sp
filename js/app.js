/**
 * AutoRadar SP - Controlador principal da aplicação
 * Marketplace, filtros, comparador, simulador de financiamento e PWA.
 *
 * Princípios:
 * - Nenhum texto de oferta é fixo no HTML: preços, faixas e contagens vêm do
 *   catálogo (data/cars.json), para a tela nunca prometer o que o dado não tem.
 * - Links só são renderizados se forem http(s).
 * - Eventos de card são delegados (sem re-bind a cada render).
 */

document.addEventListener('DOMContentLoaded', async () => {
  const data = window.autoRadarData;
  await data.init();

  const BUDGET = window.AutoRadarBudget || 80000;

  const UF_NOME = {
    SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Minas Gerais', SC: 'Santa Catarina',
    RS: 'Rio Grande do Sul', PR: 'Paraná', GO: 'Goiás', DF: 'Distrito Federal',
    MS: 'Mato Grosso do Sul', ES: 'Espírito Santo', AL: 'Alagoas', BA: 'Bahia',
    CE: 'Ceará', PE: 'Pernambuco', AM: 'Amazonas', PA: 'Pará', MT: 'Mato Grosso',
    RN: 'Rio Grande do Norte', PB: 'Paraíba', PI: 'Piauí', MA: 'Maranhão',
    SE: 'Sergipe', TO: 'Tocantins', RO: 'Rondônia', AC: 'Acre', AP: 'Amapá', RR: 'Roraima',
  };
  const fmt = CarFinancingCalculator.formatCurrency;

  const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const esc = (s) =>
    (s === null || s === undefined ? '' : String(s))
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeHref = (u) => (/^https?:\/\//i.test((u || '').trim()) ? u.trim() : '');
  const safeImg = (u) => {
    const s = (u || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (/^(\.\/)?img\//i.test(s)) return s;
    return '';
  };

  // =====================================================================
  // Estado
  // =====================================================================
  const state = {
    currentTab: 'tab-targets',
    filterModel: 'all', // all | pulse | byd | tera
    onlyFavorites: false,
    suggestionTier: 'all', // all | 80k | 100k | 120k | 140k | 160k
    searchQuery: '',
    filterPrice: Infinity,
    filterFuel: 'all',
    filterState: 'SP',
    filterRegion: 'all',
    filterSort: 'price-asc',
    compareSlots: ['pulse-01', 'byd-01', null],
    simCurrentTerm: 48
  };

  // =====================================================================
  // Elementos
  // =====================================================================
  const $ = (id) => document.getElementById(id);
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const gridTargets = $('gridTargets');
  const gridElectrics = $('gridElectrics');
  const gridSuggestions = $('gridSuggestions');
  const compareContainer = $('compareContainer');
  const searchInput = $('searchInput');
  const btnClearSearch = $('btnClearSearch');
  const syncStatusText = $('syncStatusText');
  const budgetPill = $('budgetPill');
  const budgetCount = $('budgetCount');
  const countTargets = $('countTargets');
  const countElectrics = $('countElectrics');
  const countSuggestions = $('countSuggestions');
  const countCompare = $('countCompare');
  const favFilterChip = $('favFilterChip');
  const footerUpdated = $('footerUpdated');
  const carModal = $('carModal');
  const modalContent = $('modalContent');
  const formAddCar = $('formAddCar');

  // =====================================================================
  // Toast (substitui alert)
  // =====================================================================
  let toastStack = null;
  function toast(message, kind = 'info', ms = 3600) {
    if (!toastStack) {
      toastStack = document.createElement('div');
      toastStack.className = 'toast-stack';
      toastStack.setAttribute('role', 'status');
      toastStack.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastStack);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = message;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 220);
    }, ms);
  }

  // =====================================================================
  // Navegação
  // =====================================================================
  function switchTab(tabId) {
    state.currentTab = tabId;
    navTabs.forEach((tab) => tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId));
    tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === tabId));
    if (tabId === 'tab-comparator') renderComparator();
    else if (tabId === 'tab-simulator') updateSimulator();
  }
  navTabs.forEach((tab) =>
    tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')))
  );

  // =====================================================================
  // Filtros
  // =====================================================================
  const precoEfetivo = (car) => Number(car.negotiatedTarget || car.price || 0);

  function matchesModel(car, model) {
    if (!model || model === 'all') return true;
    const cat = norm(car.modelCategory);
    const titulo = norm(car.title);
    if (model === 'pulse') return cat.includes('pulse') || titulo.includes('pulse');
    if (model === 'byd') return cat.includes('dolphin') || titulo.includes('dolphin') || cat.includes('byd');
    if (model === 'tera') return cat.includes('tera') || titulo.includes('tera');
    return true;
  }

  function matchesFuel(car, fuel) {
    if (!fuel || fuel === 'all') return true;
    const f = norm(car.fuel);
    const cat = norm(car.modelCategory);
    if (fuel === 'electric') return f.includes('eletrico') || cat.includes('eletrico') || cat.includes('dolphin');
    if (fuel === 'flex') return f.includes('flex');
    if (fuel === 'hybrid') return f.includes('hibrido');
    return true;
  }

  function matchesSearch(car, query) {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystack = norm(
      [
        car.title,
        car.modelCategory,
        car.dealer?.name,
        car.dealer?.city,
        car.dealer?.neighborhood,
        car.dealer?.address,
        car.fuel,
        car.transmission,
        car.specs?.engine,
        car.specs?.warranty,
        car.badge,
        car.color,
        car.year,
        car.portal,
        car.cautelarStatus,
        ...(car.tags || []),
        ...(car.specs?.features || [])
      ]
        .filter(Boolean)
        .join(' ')
    );
    return terms.every((t) => haystack.includes(t));
  }

  function filterCars(list, options = {}) {
    const { isSuggestions = false } = options;
    return list.filter((car) => {
      if (!matchesModel(car, isSuggestions ? 'all' : state.filterModel)) return false;
      if (state.onlyFavorites && !data.isFavorite(car.id)) return false;
      if (precoEfetivo(car) > state.filterPrice) return false;
      if (!matchesFuel(car, state.filterFuel)) return false;
      if (!window.AutoRadarDataService.matchesState(car, state.filterState)) return false;
      if (state.filterState === 'SP' && !window.AutoRadarDataService.matchesRegion(car, state.filterRegion)) return false;
      if (!matchesSearch(car, state.searchQuery)) return false;
      return true;
    });
  }

  function sortCars(list) {
    const out = [...list];
    switch (state.filterSort) {
      case 'km-asc':
        return out.sort((a, b) => (a.km || 0) - (b.km || 0));
      case 'year-desc':
        return out.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'fipe-asc':
        // Mais abaixo da FIPE primeiro; oferta sem FIPE confirmada vai para o fim.
        return out.sort((a, b) => {
          const da = a.fipePrice ? (a.price || 0) - a.fipePrice : Infinity;
          const dbo = b.fipePrice ? (b.price || 0) - b.fipePrice : Infinity;
          return da - dbo || a.price - b.price;
        });
      case 'electric-first':
        return out.sort((a, b) => {
          const ae = norm(a.fuel).includes('eletrico') ? 1 : 0;
          const be = norm(b.fuel).includes('eletrico') ? 1 : 0;
          return be - ae || a.price - b.price;
        });
      default:
        return out.sort((a, b) => a.price - b.price);
    }
  }

  // =====================================================================
  // Cards
  // =====================================================================
  function getExactCarImage(car) {
    return car ? safeImg(car.image) : '';
  }

  const CORACAO_CHEIO =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
  const CORACAO_VAZIO =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

  function createCarCardHTML(car) {
    const isElec = norm(car.fuel).includes('eletrico');
    const isFav = data.isFavorite(car.id);
    const isCompared = state.compareSlots.filter(Boolean).includes(car.id);
    const cardImg = getExactCarImage(car);
    const titulo = esc(car.title);
    const categoria = esc(car.modelCategory);
    const badge = esc(car.badge || (isElec ? '100% Elétrico' : 'Automático'));

    const downPmt = car.financing?.downPayment || Math.round((car.price || 0) * 0.3);
    const rateUsed = car.financing?.interestRate || 2.5;
    const calc = CarFinancingCalculator.calculatePrice(car.price, downPmt, 48, rateUsed);
    const parcela = car.financing?.monthlyInstallment || Math.round(calc.monthlyInstallment);

    const waPhone = (car.dealer?.whatsapp || '').replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Olá! Vi o ${car.title} por ${fmt(car.price)} no AutoRadar SP e gostaria de saber sobre disponibilidade e formas de pagamento.`
    );
    const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '';
    const listingUrl = safeHref(car.listingUrl);
    const linkLabel = car.listingStatus === 'estoque' ? 'Ver Estoque' : 'Ver Anúncio';

    const imgBoxHtml = cardImg
      ? `
        <div class="car-image-box">
          <img src="${esc(cardImg)}" alt="${titulo}" loading="lazy" onerror="this.closest('.car-image-box').remove();">
          <span class="car-badge-top ${isElec ? 'badge-electric' : ''}">${badge}</span>
          <button class="car-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${esc(car.id)}" aria-label="Salvar nos favoritos" aria-pressed="${isFav}">${isFav ? CORACAO_CHEIO : CORACAO_VAZIO}</button>
          <div class="car-location-tag">${esc(car.dealer?.city || 'São Paulo')} - ${esc(car.dealer?.neighborhood || car.dealer?.state || 'SP')}</div>
        </div>`
      : `
        <div class="car-card-no-img-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="car-no-img-badge">${badge}</span>
            <span class="car-no-img-notice">Fotos no anúncio oficial</span>
          </div>
          <button class="car-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${esc(car.id)}" style="position: static;" aria-label="Salvar nos favoritos" aria-pressed="${isFav}">${isFav ? CORACAO_CHEIO : CORACAO_VAZIO}</button>
        </div>`;

    return `
      <div class="car-card ${cardImg ? '' : 'car-card-no-img'}" data-id="${esc(car.id)}">
        ${imgBoxHtml}
        <div class="car-content">
          <div class="car-header-row">
            <span class="car-category-sub">${categoria}</span>
            <h3 class="car-title">${titulo}</h3>
          </div>

          <div class="car-pricing-box">
            <div class="price-main-row">
              <span class="price-val">${fmt(car.price)}</span>
              ${car.priceVsFipe ? `<span class="price-fipe-tag">${esc(car.priceVsFipe)}</span>` : ''}
            </div>
            <div class="price-financing-sub">
              <span>Entrada ${fmt(downPmt)}:</span>
              <strong>48x de ${fmt(parcela)}</strong>
              <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px;">(CET estimado: ${rateUsed.toFixed(2).replace('.', ',')}% a.m.)</span>
            </div>
          </div>

          <div class="specs-pills-grid">
            <div class="spec-pill"><div class="info"><span class="label">Ano / Mod</span><span class="val">${esc(car.year || '—')}</span></div></div>
            <div class="spec-pill"><div class="info"><span class="label">KM Rodados</span><span class="val">${(car.km || 0).toLocaleString('pt-BR')} km</span></div></div>
            <div class="spec-pill"><div class="info"><span class="label">${isElec ? 'Autonomia' : 'Câmbio'}</span><span class="val">${esc(isElec ? car.specs?.range || 'n/d' : car.transmission || 'Automático')}</span></div></div>
            <div class="spec-pill"><div class="info"><span class="label">Porta-Malas</span><span class="val">${esc(car.specs?.trunk || 'n/d')}</span></div></div>
          </div>

          <div class="dealer-info-row">
            <div class="dealer-meta-left">
              <span class="dealer-name" title="${esc(car.dealer?.name || 'Loja verificada')}">
                <svg class="store-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>${esc(car.dealer?.name || 'Loja verificada')}</span>
              </span>
              ${car.dealer?.state && car.dealer.state !== 'SP' ? `<span class="car-state-out">Fora de SP • ${esc(car.dealer.state)}</span>` : ''}
              ${car.portal ? `<span class="car-portal-badge">${esc(car.portal)}</span>` : ''}
            </div>
            <div class="dealer-meta-right">
              <span class="cautelar-approved" title="${esc(car.cautelarStatus || '')}">
                <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>${car.cautelarStatus ? 'Laudo OK' : 'Laudo no anúncio'}</span>
              </span>
            </div>
          </div>

          <div class="card-actions-grid">
            <div class="actions-primary-row">
              ${
                waLink
                  ? `<a href="${esc(waLink)}" target="_blank" rel="noopener noreferrer" class="btn-action-wa" title="Falar com a loja no WhatsApp">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                      <span>WhatsApp</span>
                    </a>`
                  : ''
              }
              ${
                listingUrl
                  ? `<a href="${esc(listingUrl)}" target="_blank" rel="noopener noreferrer" class="btn-action-listing" title="${esc(car.listingNote || 'Abrir o anúncio original')}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      <span>${esc(linkLabel)}</span>
                    </a>`
                  : ''
              }
            </div>
            <div class="actions-secondary-row">
              <button class="btn-action-secondary btn-details" data-detail-id="${esc(car.id)}" title="Ver ficha técnica completa">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>Ficha Técnica</span>
              </button>
              <button class="btn-action-secondary btn-card-compare ${isCompared ? 'active' : ''}" data-compare-id="${esc(car.id)}" title="${isCompared ? 'Remover do comparador' : 'Adicionar ao comparador'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                <span>${isCompared ? '✓ Comparando' : 'Comparar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // =====================================================================
  // Render das abas
  // =====================================================================
  const TIER_PRICE = { '80k': 80000, '100k': 100000, '120k': 120000, '140k': 140000, '160k': 160000 };
  const TIER_TITLE = {
    all: 'Todas as Sugestões',
    '80k': 'Sugestões até 80k',
    '100k': 'Sugestões até 100k',
    '120k': 'Sugestões até 120k',
    '140k': 'Sugestões até 140k',
    '160k': 'Sugestões até 160k'
  };

  function emptyState(titulo, otherOptions) {
    if (state.searchQuery) {
      const botoes = (otherOptions || [])
        .filter((o) => o.count > 0)
        .map(
          (o) =>
            `<button type="button" class="btn-empty-switch" data-switch-tab="${o.tabId}">Ver ${o.count} oferta(s) em ${esc(o.name)} →</button>`
        )
        .join('');
      return `<div class="empty-state">
        <p>Nenhum veículo encontrado em <strong>${esc(titulo)}</strong> para "<strong>${esc(state.searchQuery)}</strong>".</p>
        <div class="empty-state-hints">${botoes}</div>
        <button type="button" class="btn-empty-clear" data-action="clear-search">Limpar Busca</button>
      </div>`;
    }
    return `<div class="empty-state">
      <p>Nenhum carro encontrado para os filtros selecionados em ${esc(titulo)}.</p>
      <button type="button" class="btn-empty-clear" data-action="reset-filters">Restaurar Filtros Padrão</button>
    </div>`;
  }

  function renderAllGrids() {
    // 1) Nossos 3 modelos (com alternativa direta ao Tera quando filtrado)
    let targets = data.getTargetCars();
    if (state.filterModel === 'tera') {
      const alternativas = data.getAllCars().filter((c) => c.isSuggestion && norm(c.title).includes('polo'));
      targets = [...targets, ...alternativas.filter((a) => !targets.some((t) => t.id === a.id))];
    }
    const filteredTargets = sortCars(filterCars(targets));

    // 2) Elétricos
    const filteredElectrics = sortCars(filterCars(data.getElectricCars()));

    // 3) Sugestões por faixa de preço
    const limiteTier = state.suggestionTier === 'all' ? Infinity : TIER_PRICE[state.suggestionTier] || Infinity;
    const sugestoes = data.getSuggestionCars().filter((c) => Number(c.price) <= Math.min(limiteTier, state.filterPrice));
    const filteredSuggestions = sortCars(filterCars(sugestoes, { isSuggestions: true }));

    countTargets.textContent = filteredTargets.length;
    countElectrics.textContent = filteredElectrics.length;
    countSuggestions.textContent = filteredSuggestions.length;
    countCompare.textContent = state.compareSlots.filter(Boolean).length;

    gridTargets.innerHTML = filteredTargets.length
      ? filteredTargets.map(createCarCardHTML).join('')
      : emptyState('Nossos 3 Modelos', [
          { name: 'Radar Elétricos', count: filteredElectrics.length, tabId: 'tab-electrics' },
          { name: 'Sugestões', count: filteredSuggestions.length, tabId: 'tab-suggestions' }
        ]);

    gridElectrics.innerHTML = filteredElectrics.length
      ? filteredElectrics.map(createCarCardHTML).join('')
      : emptyState('Radar Elétricos', [
          { name: 'Nossos 3 Modelos', count: filteredTargets.length, tabId: 'tab-targets' },
          { name: 'Sugestões', count: filteredSuggestions.length, tabId: 'tab-suggestions' }
        ]);

    gridSuggestions.innerHTML = filteredSuggestions.length
      ? filteredSuggestions.map(createCarCardHTML).join('')
      : emptyState('Sugestões', [
          { name: 'Nossos 3 Modelos', count: filteredTargets.length, tabId: 'tab-targets' },
          { name: 'Radar Elétricos', count: filteredElectrics.length, tabId: 'tab-electrics' }
        ]);

    const tabTitle = $('tabSuggestionsTitle');
    if (tabTitle) tabTitle.textContent = TIER_TITLE[state.suggestionTier] || 'Sugestões & Similares';

    if (favFilterChip) {
      const total = data.getFavoriteCars().length;
      favFilterChip.textContent = `♡ Favoritos${total ? ` (${total})` : ''}`;
      favFilterChip.classList.toggle('active', state.onlyFavorites);
      favFilterChip.setAttribute('aria-pressed', String(state.onlyFavorites));
    }

  }

  // Cards de destaque do topo (números reais do catálogo)
  function renderInsights() {
    const stats = data.getModelStats(state.filterState);
    const alvo = {
      pulse: { el: $('insightPulse'), extra: 'Câmbio automático (CVT ou Turbo 200)' },
      byd: { el: $('insightByd'), extra: 'Zero combustível e isenção de rodízio em SP' },
      tera: { el: $('insightTera'), extra: 'Lançamento 2025/2026' }
    };
    stats.forEach((s) => {
      const node = alvo[s.key]?.el;
      if (!node) return;
      if (!s.count) {
        node.innerHTML = `<strong>Nenhuma oferta no catálogo agora.</strong> ${alvo[s.key].extra}.`;
        return;
      }
      const faixa = s.min === s.max ? fmt(s.min) : `${fmt(s.min)} e ${fmt(s.max)}`;
      const dentro = s.underBudget
        ? `<strong>${s.underBudget}</strong> dentro do teto de ${fmt(BUDGET)}`
        : `nenhuma dentro do teto de ${fmt(BUDGET)}`;
      node.innerHTML = `<strong>${s.count} ${s.count === 1 ? 'oferta' : 'ofertas'}</strong> entre <strong>${faixa}</strong> — ${dentro}. ${alvo[s.key].extra}.`;
    });
  }

  function renderBudget() {
    const b = data.getBudgetStats(BUDGET);
    if (budgetCount) budgetCount.textContent = `${b.dentro} de ${b.total} dentro do teto`;
    if (budgetPill) budgetPill.setAttribute('aria-pressed', String(state.filterPrice <= BUDGET));
  }

  function renderRegions() {
    const container = $('regionBtnGroup');
    if (!container) return;
    const regions = data.getRegions();
    container.innerHTML =
      '<button type="button" class="filter-btn-chip active" data-city="all">Todo o Estado</button>' +
      regions
        .map(
          (r) =>
            `<button type="button" class="filter-btn-chip" data-city="${esc(r.key)}">${esc(r.label)} (${r.count})</button>`
        )
        .join('');
  }

  function renderStates() {
    const container = $('stateBtnGroup');
    if (!container) return;
    const total = data.getAllCars().length;
    container.innerHTML =
      `<button type="button" class="filter-btn-chip ${state.filterState === 'all' ? 'active' : ''}" data-state="all">Todos (${total})</button>` +
      data
      .getStates()
      .map(
        (s) =>
          `<button type="button" class="filter-btn-chip ${s.uf === state.filterState ? 'active' : ''}" data-state="${esc(
            s.uf
          )}">${esc(UF_NOME[s.uf] || s.uf)} (${s.count})</button>`
      )
      .join('');
  }

  function syncRegionVisibility() {
    const grupo = $('regionFilterGroup');
    if (!grupo) return;
    grupo.style.display = state.filterState === 'SP' ? '' : 'none';
  }

  function renderSyncStatus() {
    const total = data.getAllCars().length;
    const quando = data.getLastSyncFormatted();
    if (syncStatusText) {
      syncStatusText.textContent = `${total} ofertas • atualizado ${quando}${data.usingFallback ? ' (modo offline)' : ''}`;
    }
    if (footerUpdated) {
      footerUpdated.textContent = `Catálogo: ${total} ofertas • ${quando}`;
    }
  }

  // =====================================================================
  // Chips / filtros
  // =====================================================================
  function setChipActive(group, attr, value) {
    document.querySelectorAll(`${group} .filter-btn-chip`).forEach((b) => {
      b.classList.toggle('active', b.getAttribute(attr) === value);
    });
  }

  function setModelFilter(modelKey) {
    state.filterModel = modelKey;
    setChipActive('#modelBtnGroup', 'data-model', modelKey);
    document.querySelectorAll('.insight-card[data-insight-model]').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-insight-model') === modelKey);
    });
    renderAllGrids();
  }

  document.querySelectorAll('#modelBtnGroup .filter-model-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.getAttribute('data-model');
      if (m === 'favorites') {
        state.onlyFavorites = !state.onlyFavorites;
        renderAllGrids();
        return;
      }
      setModelFilter(m);
    });
  });

  document.querySelectorAll('.insight-card[data-insight-model]').forEach((card) => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-insight-model');
      setModelFilter(state.filterModel === target ? 'all' : target);
      if (state.currentTab !== 'tab-targets') switchTab('tab-targets');
    });
  });

  document.querySelectorAll('#priceBtnGroup .filter-btn-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      setChipActive('#priceBtnGroup', 'data-price', btn.getAttribute('data-price'));
      const val = btn.getAttribute('data-price');
      state.filterPrice = val === 'all' ? Infinity : parseFloat(val);
      renderAllGrids();
      renderBudget();
    });
  });

  document.querySelectorAll('#fuelBtnGroup .filter-btn-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      setChipActive('#fuelBtnGroup', 'data-fuel', btn.getAttribute('data-fuel'));
      state.filterFuel = btn.getAttribute('data-fuel');
      renderAllGrids();
    });
  });

  document.querySelectorAll('#sortBtnGroup .filter-btn-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      setChipActive('#sortBtnGroup', 'data-sort', btn.getAttribute('data-sort'));
      state.filterSort = btn.getAttribute('data-sort');
      renderAllGrids();
    });
  });

  document.querySelectorAll('#suggestionTierBtnGroup .filter-btn-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      setChipActive('#suggestionTierBtnGroup', 'data-tier', btn.getAttribute('data-tier'));
      state.suggestionTier = btn.getAttribute('data-tier');
      renderAllGrids();
    });
  });

  // Estado: delegação (chips gerados do catálogo)
  const stateGroup = $('stateBtnGroup');
  if (stateGroup) {
    stateGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-state]');
      if (!btn) return;
      state.filterState = btn.getAttribute('data-state');
      state.filterRegion = 'all';
      renderStates();
      renderRegions();
      syncRegionVisibility();
      renderInsights();
      renderAllGrids();
    });
  }

  // Região: delegação (os chips são gerados dinamicamente)
  const regionGroup = $('regionBtnGroup');
  if (regionGroup) {
    regionGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn-chip');
      if (!btn) return;
      setChipActive('#regionBtnGroup', 'data-city', btn.getAttribute('data-city'));
      state.filterRegion = btn.getAttribute('data-city');
      renderAllGrids();
    });
  }

  // Teto de orçamento clicável
  function toggleBudgetFilter() {
    const dentro = state.filterPrice <= BUDGET;
    if (dentro) {
      state.filterPrice = Infinity;
      setChipActive('#priceBtnGroup', 'data-price', 'all');
    } else {
      state.filterPrice = BUDGET;
      setChipActive('#priceBtnGroup', 'data-price', String(BUDGET));
    }
    renderAllGrids();
    renderBudget();
  }
  if (budgetPill) {
    budgetPill.addEventListener('click', toggleBudgetFilter);
    budgetPill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleBudgetFilter();
      }
    });
  }

  // Busca com debounce
  let searchTimer = null;
  searchInput.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    btnClearSearch.classList.toggle('hidden', valor === '');
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = valor;
      if (!['tab-targets', 'tab-electrics', 'tab-suggestions'].includes(state.currentTab)) {
        switchTab('tab-targets');
      }
      renderAllGrids();
    }, 160);
  });

  function clearSearch() {
    searchInput.value = '';
    state.searchQuery = '';
    btnClearSearch.classList.add('hidden');
    renderAllGrids();
  }
  btnClearSearch.addEventListener('click', clearSearch);

  function resetAllFilters() {
    state.filterModel = 'all';
    state.onlyFavorites = false;
    state.filterPrice = Infinity;
    state.filterFuel = 'all';
    state.filterState = 'SP';
    state.filterRegion = 'all';
    state.filterSort = 'price-asc';
    state.suggestionTier = 'all';
    state.searchQuery = '';
    searchInput.value = '';
    btnClearSearch.classList.add('hidden');

    setChipActive('#modelBtnGroup', 'data-model', 'all');
    setChipActive('#priceBtnGroup', 'data-price', 'all');
    setChipActive('#fuelBtnGroup', 'data-fuel', 'all');
    setChipActive('#sortBtnGroup', 'data-sort', 'price-asc');
    setChipActive('#suggestionTierBtnGroup', 'data-tier', 'all');
    if (regionGroup) setChipActive('#regionBtnGroup', 'data-city', 'all');
    document.querySelectorAll('.insight-card[data-insight-model]').forEach((c) => c.classList.remove('active'));

    renderStates();
    renderRegions();
    syncRegionVisibility();
    renderAllGrids();
    renderBudget();
  }

  // =====================================================================
  // Delegação de eventos dos cards e empty states
  // =====================================================================
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('.car-favorite-btn');
    if (fav) {
      e.preventDefault();
      e.stopPropagation();
      const id = fav.getAttribute('data-fav-id');
      const isFav = data.toggleFavorite(id);
      fav.classList.toggle('favorited', isFav);
      fav.setAttribute('aria-pressed', String(isFav));
      fav.innerHTML = isFav ? CORACAO_CHEIO : CORACAO_VAZIO;
      if (state.onlyFavorites) renderAllGrids();
      else if (favFilterChip) {
        const total = data.getFavoriteCars().length;
        favFilterChip.textContent = `♡ Favoritos${total ? ` (${total})` : ''}`;
      }
      return;
    }

    const compareBtn = e.target.closest('.btn-card-compare');
    if (compareBtn) {
      e.preventDefault();
      toggleCompare(compareBtn.getAttribute('data-compare-id'));
      return;
    }

    const detailBtn = e.target.closest('.btn-details');
    if (detailBtn) {
      e.preventDefault();
      openCarDetailsModal(detailBtn.getAttribute('data-detail-id'));
      return;
    }

    const switchBtn = e.target.closest('[data-switch-tab]');
    if (switchBtn) {
      switchTab(switchBtn.getAttribute('data-switch-tab'));
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      if (action === 'clear-search') clearSearch();
      if (action === 'reset-filters') resetAllFilters();
    }
  });

  // =====================================================================
  // Comparador
  // =====================================================================
  const slotSelects = [$('compareSlotSelect1'), $('compareSlotSelect2'), $('compareSlotSelect3')];
  const slotPreviews = [$('compareSlotPreview1'), $('compareSlotPreview2'), $('compareSlotPreview3')];
  const slotCards = [$('compareSlotCard1'), $('compareSlotCard2'), $('compareSlotCard3')];

  function populateCompareSlots() {
    const allCars = data.getAllCars();
    const buildOptions = (placeholder) => {
      let opts = `<option value="">${placeholder}</option>`;
      const grupos = [
        { label: 'Nossos 3 Modelos', filtro: (c) => c.isTarget },
        { label: 'Sugestões 100% Elétricas', filtro: (c) => !c.isTarget && norm(c.fuel).includes('eletrico') },
        { label: 'Sugestões Automáticas', filtro: (c) => !c.isTarget && !norm(c.fuel).includes('eletrico') }
      ];
      grupos.forEach((g) => {
        const lista = allCars.filter(g.filtro);
        if (!lista.length) return;
        opts += `<optgroup label="${g.label}">`;
        lista.forEach((c) => {
          opts += `<option value="${esc(c.id)}">${esc(c.title)} — ${fmt(c.price)} (${esc(c.dealer?.city || 'SP')})</option>`;
        });
        opts += `</optgroup>`;
      });
      return opts;
    };

    slotSelects.forEach((sel, i) => {
      if (sel) sel.innerHTML = buildOptions(`-- Selecione o ${i + 1}º Veículo${i === 2 ? ' (Opcional)' : ''} --`);
    });
  }

  function setSlotCar(slotIdx, carId) {
    const id = carId || null;
    if (id) {
      for (let i = 0; i < 3; i++) if (i !== slotIdx && state.compareSlots[i] === id) state.compareSlots[i] = null;
    }
    state.compareSlots[slotIdx] = id;
    renderComparator();
    renderAllGrids();
  }

  function toggleCompare(carId) {
    const idx = state.compareSlots.indexOf(carId);
    if (idx !== -1) {
      state.compareSlots[idx] = null;
    } else {
      const vazio = state.compareSlots.findIndex((s) => !s);
      if (vazio === -1) {
        toast('Você já tem 3 veículos na comparação. Remova um para adicionar outro.', 'warn');
        return;
      }
      state.compareSlots[vazio] = carId;
    }
    renderAllGrids();
    if (state.currentTab === 'tab-comparator') renderComparator();
  }

  function applyComparePreset(presetKey) {
    const presets = {
      alvos: ['pulse-01', 'byd-01', 'tera-01'],
      eletricos: ['byd-01', 'sug-eletrico-01', 'sug-eletrico-02'],
      automaticos: ['pulse-01', 'sug-vw-polo-01', 'sug-suv-kicks-01'],
      economicos: ['pulse-01', 'byd-01', 'sug-eletrico-01']
    };
    const ids = (presets[presetKey] || presets.alvos).filter((id) => data.getCarById(id));
    state.compareSlots = [ids[0] || null, ids[1] || null, ids[2] || null];
    renderComparator();
    renderAllGrids();
  }

  function updateSlotPreviews() {
    slotSelects.forEach((sel, idx) => {
      if (!sel) return;
      const carId = state.compareSlots[idx] || '';
      sel.value = carId;
      const card = slotCards[idx];
      const preview = slotPreviews[idx];
      const removeBtn = card?.querySelector(`[data-remove-slot="${idx}"]`);
      const car = carId ? data.getCarById(carId) : null;

      if (car && preview) {
        card.classList.add('active');
        if (removeBtn) removeBtn.style.display = 'inline-block';
        const img = getExactCarImage(car);
        preview.innerHTML = `
          <div class="slot-car-preview">
            ${
              img
                ? `<img src="${esc(img)}" alt="${esc(car.title)}" onerror="this.remove();">`
                : `<div style="width:50px;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:6px;font-size:11px;color:var(--text-muted);">sem foto</div>`
            }
            <div class="slot-car-info">
              <div class="slot-car-name">${esc(car.title)}</div>
              <div class="slot-car-price">${fmt(car.price)} <span style="font-size:11px;color:var(--text-muted);font-weight:400;">• ${esc(car.dealer?.city || 'SP')}</span></div>
            </div>
          </div>`;
      } else if (card && preview) {
        card.classList.remove('active');
        if (removeBtn) removeBtn.style.display = 'none';
        preview.innerHTML = '';
      }
    });
  }

  function renderComparator() {
    const cars = state.compareSlots.filter(Boolean).map((id) => data.getCarById(id)).filter(Boolean);
    countCompare.textContent = cars.length;
    updateSlotPreviews();

    if (!cars.length) {
      compareContainer.innerHTML = `
        <div class="empty-compare-state">
          <h3>Nenhum veículo selecionado para comparação</h3>
          <p style="margin-bottom:16px;font-size:14px;max-width:560px;margin-left:auto;margin-right:auto;">
            Escolha os modelos nos <strong>3 seletores acima</strong>, use um dos <strong>duelos prontos</strong> ou clique em <strong>Comparar</strong> em qualquer card.
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button class="shortcut-chip" onclick="window.autoRadarApp.applyComparePreset('alvos')">Comparar Nossos 3 Modelos</button>
            <button class="shortcut-chip" onclick="window.autoRadarApp.applyComparePreset('eletricos')">Duelo 100% Elétricos</button>
          </div>
        </div>`;
      return;
    }

    const todos = data.getAllCars();
    const colunas = cars
      .map((c, colIdx) => {
        const img = getExactCarImage(c);
        const url = safeHref(c.listingUrl);
        return `<th class="compare-card-col">
          ${
            img
              ? `<div style="margin-bottom:8px;"><img src="${esc(img)}" alt="${esc(c.title)}" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);" onerror="this.remove();"></div>`
              : `<div style="height:50px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:8px;font-size:11px;color:var(--text-muted);">Fotos no anúncio</div>`
          }
          <div style="font-size:15px;color:#fff;line-height:1.3;">${esc(c.title)}</div>
          <div style="font-size:18px;margin-top:4px;color:var(--electric-green);font-weight:800;">${fmt(c.price)}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn-slot-remove" onclick="window.autoRadarApp.removeSlot(${colIdx})">Remover</button>
            ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="btn-card-listing" style="padding:4px 10px;font-size:11px;">Anúncio ↗</a>` : ''}
          </div>
        </th>`;
      })
      .join('');

    const adicionar =
      cars.length < 3
        ? `<th class="compare-card-col" style="vertical-align:middle;text-align:center;background:rgba(255,255,255,.02);border:1px dashed var(--border-color);border-radius:8px;">
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">Adicionar outro veículo</div>
            <select class="compare-slot-select" onchange="window.autoRadarApp.setSlotCar(${cars.length}, this.value)" style="max-width:200px;margin:0 auto;">
              <option value="">-- Escolher Carro --</option>
              ${todos
                .filter((ac) => !state.compareSlots.includes(ac.id))
                .map((ac) => `<option value="${esc(ac.id)}">${esc(ac.title)} (${fmt(ac.price)})</option>`)
                .join('')}
            </select>
          </th>`
        : '';

    const linha = (rotulo, render) =>
      `<tr><th>${rotulo}</th>${cars.map((c) => `<td>${render(c)}</td>`).join('')}${cars.length < 3 ? '<td>-</td>' : ''}</tr>`;

    compareContainer.innerHTML = `
      <table class="compare-table">
        <thead><tr><th>Especificação Técnica</th>${colunas}${adicionar}</tr></thead>
        <tbody>
          ${linha('Categoria / Tipo', (c) => `<strong>${esc(c.modelCategory)}</strong>`)}
          ${linha('Combustível', (c) => esc(c.fuel || 'Flex'))}
          ${linha('Câmbio', (c) => esc(c.transmission || 'Automático'))}
          ${linha('Consumo Urbano / Autonomia', (c) =>
            norm(c.fuel).includes('eletrico')
              ? `<span style="color:var(--electric-green);font-weight:700;">${esc(c.specs?.range || 'n/d')}</span>`
              : esc(c.specs?.consumptionCity || 'n/d')
          )}
          ${linha('Consumo Estrada', (c) => esc(c.specs?.consumptionRoad || 'n/d'))}
          ${linha('Porta-Malas', (c) => esc(c.specs?.trunk || 'n/d'))}
          ${linha('Potência & Torque', (c) => esc(c.specs?.power || 'n/d'))}
          ${linha('Garantia & Procedência', (c) => esc(c.specs?.warranty || 'n/d'))}
          ${linha('Localização em SP', (c) => `${esc(c.dealer?.city || 'SP')} - ${esc(c.dealer?.neighborhood || '')} (${esc(c.portal || 'Loja')})`)}
          ${linha('Financiamento estimado', (c) => {
            const dp = c.financing?.downPayment || Math.round((c.price || 0) * 0.3);
            const inst = c.financing?.monthlyInstallment || Math.round(CarFinancingCalculator.calculatePrice(c.price, dp, 48, c.financing?.interestRate || 2.5).monthlyInstallment);
            return `Entrada de ${fmt(dp)} + 48x de <strong>${fmt(inst)}</strong>`;
          })}
          ${linha('Ações', (c) => `<button class="btn-card-main" onclick="window.autoRadarApp.openInSimulator('${esc(c.id)}')" style="width:100%;justify-content:center;">Simular Financiamento</button>`)}
        </tbody>
      </table>`;
  }

  slotSelects.forEach((sel, idx) => {
    if (sel) sel.addEventListener('change', () => setSlotCar(idx, sel.value));
  });

  document.querySelectorAll('[data-remove-slot]').forEach((btn) => {
    btn.addEventListener('click', () => setSlotCar(parseInt(btn.getAttribute('data-remove-slot'), 10), ''));
  });

  document.querySelectorAll('[data-compare-preset]').forEach((btn) => {
    btn.addEventListener('click', () => applyComparePreset(btn.getAttribute('data-compare-preset')));
  });

  $('btnClearCompare')?.addEventListener('click', () => {
    state.compareSlots = [null, null, null];
    renderComparator();
    renderAllGrids();
  });

  // =====================================================================
  // Simulador
  // =====================================================================
  const simCarSelect = $('simCarSelect');
  const simVehiclePrice = $('simVehiclePrice');
  const simDownPaymentRange = $('simDownPaymentRange');
  const simDownPaymentVal = $('simDownPaymentVal');
  const simInterestRate = $('simInterestRate');

  function populateSimulatorCarSelect() {
    simCarSelect.innerHTML =
      '<option value="custom">-- Digitar valor personalizado --</option>' +
      data
        .getAllCars()
        .map((c) => `<option value="${esc(c.id)}">${esc(c.title)} — ${fmt(c.price)}</option>`)
        .join('');
  }

  function updateSimulator() {
    const price = parseFloat(simVehiclePrice.value) || 0;
    const downPayment = parseFloat(simDownPaymentRange.value) || 0;
    const rate = parseFloat(simInterestRate.value) || 2.5;
    const term = state.simCurrentTerm;

    const pct = price > 0 ? Math.round((downPayment / price) * 100) : 0;
    simDownPaymentVal.textContent = `${fmt(downPayment)} (${pct}%)`;

    const res = CarFinancingCalculator.calculatePrice(price, downPayment, term, rate);
    $('simMonthlyResult').textContent = fmt(res.monthlyInstallment);
    $('simTotalInterestResult').textContent = `Total financiado: ${fmt(res.financedAmount)} em ${term} parcelas`;
    $('simSummaryPrice').textContent = fmt(price);
    $('simSummaryDownPayment').textContent = fmt(downPayment);
    $('simSummaryFinanced').textContent = fmt(res.financedAmount);
    $('simSummaryTotalCost').textContent = fmt(res.totalCost);
    $('simSummaryInterest').textContent = fmt(res.totalInterest);

    const surplus = BUDGET - downPayment;
    const alvo = $('simSummaryBudgetSurplus');
    if (surplus >= 0) {
      alvo.textContent = `${fmt(surplus)} de reserva intacta`;
      alvo.className = 'text-cyan';
    } else {
      alvo.textContent = `Entrada excede o teto em ${fmt(Math.abs(surplus))}`;
      alvo.className = 'text-red';
    }
  }

  simCarSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') return;
    const car = data.getCarById(e.target.value);
    if (!car) return;
    simVehiclePrice.value = car.price;
    simDownPaymentRange.max = car.price;
    const entrada = car.financing?.downPayment || Math.round(car.price * 0.3);
    simDownPaymentRange.value = entrada;
    if (car.financing?.interestRate) simInterestRate.value = car.financing.interestRate;
    updateSimulator();
  });

  simVehiclePrice.addEventListener('input', () => {
    const val = parseFloat(simVehiclePrice.value) || 0;
    simDownPaymentRange.max = val;
    if (parseFloat(simDownPaymentRange.value) > val) simDownPaymentRange.value = val;
    updateSimulator();
  });

  simDownPaymentRange.addEventListener('input', updateSimulator);
  simInterestRate.addEventListener('input', () => {
    const atual = parseFloat(simInterestRate.value);
    document.querySelectorAll('.rate-chip').forEach((b) => {
      b.classList.toggle('active', parseFloat(b.getAttribute('data-rate')) === atual);
    });
    updateSimulator();
  });

  document.querySelectorAll('.rate-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rate-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const r = parseFloat(btn.getAttribute('data-rate'));
      if (!Number.isNaN(r)) {
        simInterestRate.value = r;
        updateSimulator();
      }
    });
  });

  document.querySelectorAll('.term-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.term-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.simCurrentTerm = parseInt(btn.getAttribute('data-term'), 10);
      updateSimulator();
    });
  });

  // =====================================================================
  // Formulário de anúncio
  // =====================================================================
  formAddCar.addEventListener('submit', (e) => {
    e.preventDefault();
    const price = parseFloat($('addPrice').value);
    if (!price || price <= 0) {
      toast('Informe um preço válido para o anúncio.', 'warn');
      return;
    }
    const novo = {
      title: $('addTitle').value.trim(),
      modelCategory: $('addCategory').value,
      price,
      year: parseInt($('addYear').value, 10) || new Date().getFullYear(),
      km: parseInt($('addKm').value, 10) || 0,
      fuel: $('addFuel').value,
      transmission: 'Automático',
      dealer: {
        name: $('addDealerName').value.trim(),
        city: $('addCity').value.trim(),
        whatsapp: $('addWhatsapp').value.replace(/\D/g, '')
      },
      listingUrl: data.sanitizeUrl($('addLink').value),
      notes: $('addNotes').value.trim(),
      badge: 'Anúncio salvo por você',
      portal: 'Meu anúncio',
      tags: ['Anúncio próprio']
    };

    if (novo.listingUrl === '' && $('addLink').value.trim() !== '') {
      toast('O link precisa começar com http:// ou https:// — o anúncio foi salvo sem link.', 'warn');
    }

    data.addCustomCar(novo);
    formAddCar.reset();
    toast('Anúncio salvo no seu radar.', 'ok');
    populateSimulatorCarSelect();
    populateCompareSlots();
    renderRegions();
    renderAllGrids();
    renderInsights();
    renderBudget();
    switchTab('tab-targets');
  });

  // =====================================================================
  // Modal de ficha técnica
  // =====================================================================
  let lastFocused = null;

  function openCarDetailsModal(carId) {
    const car = data.getCarById(carId);
    if (!car) return;

    lastFocused = document.activeElement;
    const isElec = norm(car.fuel).includes('eletrico');
    const waPhone = (car.dealer?.whatsapp || '').replace(/\D/g, '');
    const waLink = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
          `Olá! Vi o ${car.title} por ${fmt(car.price)} no AutoRadar SP e gostaria de agendar uma visita.`
        )}`
      : '';
    const img = getExactCarImage(car);
    const listingUrl = safeHref(car.listingUrl);
    const features = car.specs?.features || [];

    const imgBox = img
      ? `<div style="margin-bottom:20px;"><img src="${esc(img)}" alt="${esc(car.title)}" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;" onerror="this.parentElement.remove();"></div>`
      : `<div style="background:rgba(255,255,255,.03);border:1px dashed var(--border-color);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <h4 style="color:#fff;margin-top:6px;font-size:15px;">Fotos no anúncio oficial</h4>
          <p style="color:var(--text-muted);font-size:12.5px;margin-top:4px;max-width:440px;margin-left:auto;margin-right:auto;">Veja a galeria e o laudo cautelar direto no anúncio original.</p>
        </div>`;

    modalContent.innerHTML = `
      ${imgBox}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
        <div>
          <span style="color:var(--electric-green);font-size:12px;font-weight:700;text-transform:uppercase;">${esc(car.modelCategory)}</span>
          <h2 style="color:#fff;font-size:24px;margin-top:4px;">${esc(car.title)}</h2>
          <p style="color:var(--text-muted);font-size:13px;">${esc(car.dealer?.name || '')} — ${esc(car.dealer?.address || car.dealer?.city || '')}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:26px;font-weight:800;color:var(--electric-green);font-family:var(--font-mono);">${fmt(car.price)}</div>
          ${car.fipePrice ? `<div style="font-size:12px;color:#38bdf8;">FIPE: ${fmt(car.fipePrice)}</div>` : ''}
          ${car.priceVsFipe ? `<div style="font-size:12px;color:var(--text-muted);">${esc(car.priceVsFipe)}</div>` : ''}
        </div>
      </div>

      <div class="modal-specs-grid">
        <div class="modal-spec"><span>Ano</span><strong>${esc(car.year || '—')}</strong></div>
        <div class="modal-spec"><span>KM</span><strong>${(car.km || 0).toLocaleString('pt-BR')} km</strong></div>
        <div class="modal-spec"><span>Combustível</span><strong>${esc(car.fuel || '—')}</strong></div>
        <div class="modal-spec"><span>Câmbio</span><strong>${esc(car.transmission || '—')}</strong></div>
        <div class="modal-spec"><span>${isElec ? 'Autonomia' : 'Consumo cidade'}</span><strong>${esc(isElec ? car.specs?.range || 'n/d' : car.specs?.consumptionCity || 'n/d')}</strong></div>
        <div class="modal-spec"><span>Porta-malas</span><strong>${esc(car.specs?.trunk || 'n/d')}</strong></div>
        <div class="modal-spec"><span>Potência</span><strong>${esc(car.specs?.power || 'n/d')}</strong></div>
        <div class="modal-spec"><span>Garantia</span><strong>${esc(car.specs?.warranty || 'n/d')}</strong></div>
      </div>

      <div style="background:rgba(255,255,255,.03);border:1px solid var(--border-color);border-radius:12px;padding:16px;margin-bottom:20px;">
        <h4 style="color:#fff;margin-bottom:8px;">Condições de pagamento</h4>
        <p style="font-size:13.5px;color:#cbd5e1;line-height:1.5;">${esc(
          car.financing?.optionsText ||
            `Entrada sugerida de ${fmt(car.financing?.downPayment || Math.round(car.price * 0.3))} e saldo em até ${
              car.financing?.months || 48
            }x de ${fmt(
              car.financing?.monthlyInstallment ||
                CarFinancingCalculator.calculatePrice(car.price, car.financing?.downPayment || car.price * 0.3, 48, car.financing?.interestRate || 2.5).monthlyInstallment
            )}.`
        )}</p>
      </div>

      ${
        features.length
          ? `<div style="margin-bottom:20px;">
              <h4 style="color:#fff;margin-bottom:10px;">Itens de destaque</h4>
              <ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;list-style:none;padding:0;">
                ${features
                  .map(
                    (f) =>
                      `<li style="font-size:12.5px;color:#e2e8f0;display:flex;align-items:center;gap:6px;"><span style="color:var(--electric-green);">✓</span> ${esc(f)}</li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : ''
      }

      ${
        car.notes
          ? `<div style="background:rgba(0,210,255,.05);border-left:3px solid var(--electric-blue);padding:10px 14px;border-radius:4px;font-size:12.5px;color:#e2e8f0;margin-bottom:20px;">${esc(car.notes)}</div>`
          : ''
      }

      <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;">
        ${waLink ? `<a href="${esc(waLink)}" target="_blank" rel="noopener" class="btn-primary" style="flex:2;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">Chamar no WhatsApp</a>` : ''}
        ${listingUrl ? `<a href="${esc(listingUrl)}" target="_blank" rel="noopener" class="btn-card-listing-lg" style="flex:2;text-decoration:none;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">${esc(car.listingStatus === 'estoque' ? 'Abrir Estoque da Loja' : 'Abrir Anúncio')} ↗</a>` : ''}
        <button class="btn-secondary-sm" onclick="window.autoRadarApp.openInSimulator('${esc(car.id)}')" style="flex:1;min-width:160px;padding:12px;">Simular Parcelas</button>
        ${car.isCustom ? `<button class="btn-secondary-sm" onclick="window.autoRadarApp.removeCustomCar('${esc(car.id)}')" style="flex:1;min-width:160px;padding:12px;">Remover anúncio</button>` : ''}
      </div>
    `;

    carModal.classList.remove('hidden');
    $('btnCloseModal')?.focus();
  }

  function closeModal() {
    carModal.classList.add('hidden');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  $('btnCloseModal').addEventListener('click', closeModal);
  carModal.addEventListener('click', (e) => {
    if (e.target === carModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !carModal.classList.contains('hidden')) closeModal();
  });

  // =====================================================================
  // Atualização real do catálogo
  // =====================================================================
  $('btnRefreshCatalog')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Atualizando…';
    const antes = data.getAllCars().length;
    const res = await data.reload(true);
    renderRegions();
    renderAllGrids();
    renderInsights();
    renderBudget();
    renderSyncStatus();
    btn.disabled = false;
    btn.innerHTML = original;

    if (res.ok) {
      const delta = res.count - antes;
      toast(
        delta > 0
          ? `Catálogo atualizado: ${delta} nova(s) oferta(s) (${res.count} no total).`
          : `Catálogo verificado: ${res.count} ofertas, nenhuma novidade.`,
        'ok'
      );
    } else {
      toast('Não foi possível baixar o catálogo agora. Exibindo a última versão salva.', 'warn');
    }
  });

  // =====================================================================
  // Limpar cache (rodapé)
  // =====================================================================
  $('btnClearCache')?.addEventListener('click', async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      localStorage.removeItem('autoradar_sp_custom_cars_v1');
      localStorage.removeItem('autoradar_ver');
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    } catch (err) {
      console.warn('[AutoRadar] falha ao limpar cache:', err);
    }
    window.location.reload();
  });

  // =====================================================================
  // PWA
  // =====================================================================
  const btnInstallPwa = $('btnInstallPwa');
  let deferredPrompt = null;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function marcarInstalado() {
    if (!btnInstallPwa) return;
    btnInstallPwa.classList.remove('hidden');
    btnInstallPwa.classList.add('installed');
    btnInstallPwa.innerHTML = '<span class="pwa-icon">✓</span> <span class="pwa-text">App instalado</span>';
  }

  if (isStandalone) {
    marcarInstalado();
  } else if (/iphone|ipad|ipod/.test((window.navigator?.userAgent || '').toLowerCase())) {
    if (btnInstallPwa) {
      btnInstallPwa.classList.remove('hidden');
      btnInstallPwa.addEventListener('click', () => {
        toast('No iPhone: toque em Compartilhar → "Adicionar à Tela de Início".', 'info', 6000);
      });
    }
  } else {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      btnInstallPwa?.classList.remove('hidden');
    });
    btnInstallPwa?.addEventListener('click', async () => {
      if (!deferredPrompt) {
        toast('Use o menu do navegador → "Instalar aplicativo".', 'info');
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') marcarInstalado();
      deferredPrompt = null;
    });
    window.addEventListener('appinstalled', marcarInstalado);
  }

  // =====================================================================
  // API global (usada por onclick do comparador/modal)
  // =====================================================================
  window.autoRadarApp = {
    switchTab,
    resetAllFilters,
    toggleCompare,
    setSlotCar,
    removeSlot: (slotIdx) => setSlotCar(slotIdx, ''),
    applyComparePreset,
    removeCustomCar: (id) => {
      data.removeCustomCar(id);
      closeModal();
      populateSimulatorCarSelect();
      populateCompareSlots();
      renderRegions();
      renderAllGrids();
      renderInsights();
      renderBudget();
      toast('Anúncio removido.', 'ok');
    },
    openInSimulator: (carId) => {
      closeModal();
      switchTab('tab-simulator');
      simCarSelect.value = carId;
      simCarSelect.dispatchEvent(new Event('change'));
    }
  };

  // =====================================================================
  // Inicialização
  // =====================================================================
  renderStates();
  renderRegions();
  syncRegionVisibility();
  populateCompareSlots();
  populateSimulatorCarSelect();
  renderAllGrids();
  renderInsights();
  renderBudget();
  renderSyncStatus();
  updateSimulator();
});
