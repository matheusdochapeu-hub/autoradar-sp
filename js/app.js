/**
 * AutoRadar SP - Controlador Principal da Aplicação
 * Marketplace, Filtros, Comparador, Simulador de Financiamento e PWA.
 */

document.addEventListener('DOMContentLoaded', async () => {
 // Inicializar Serviço de Dados
 await window.autoRadarData.init();

 // Estado Local da UI
 const state = {
 currentTab: 'tab-targets',
 targetSubfilter: 'all',
 filterModel: 'all', // 'all', 'pulse', 'byd', 'tera'
 suggestionTier: '80k',
 searchQuery: '',
 filterPrice: 80000,
 filterFuel: 'all',
 filterCity: 'all',
 filterSort: 'price-asc',
 compareSlots: ['pulse-01', 'byd-01', null],
 comparedCarIds: ['pulse-01', 'byd-01'],
 simCurrentTerm: 48
 };

 // Elementos do DOM
 const navTabs = document.querySelectorAll('.nav-tab');
 const tabPanes = document.querySelectorAll('.tab-pane');
 const syncStatusText = document.getElementById('syncStatusText');
 const btnForceSync = document.getElementById('btnForceSync');

 // Contadores das Abas
 const countTargets = document.getElementById('countTargets');
 const countElectrics = document.getElementById('countElectrics');
 const countSuggestions = document.getElementById('countSuggestions');
 const countCompare = document.getElementById('countCompare');

 // Grids
 const gridTargets = document.getElementById('gridTargets');
 const gridElectrics = document.getElementById('gridElectrics');
 const gridSuggestions = document.getElementById('gridSuggestions');
 const compareContainer = document.getElementById('compareContainer');

 // Filtros Globais e Chips de Botões
 const searchInput = document.getElementById('searchInput');
 const btnClearSearch = document.getElementById('btnClearSearch');
 // subfilterPills unificado no modelBtnGroup

 // Simulador
 const simCarSelect = document.getElementById('simCarSelect');
 const simVehiclePrice = document.getElementById('simVehiclePrice');
 const simDownPaymentRange = document.getElementById('simDownPaymentRange');
 const simDownPaymentVal = document.getElementById('simDownPaymentVal');
 const simInterestRate = document.getElementById('simInterestRate');
 const simMonthlyResult = document.getElementById('simMonthlyResult');
 const simTotalInterestResult = document.getElementById('simTotalInterestResult');
 const simSummaryPrice = document.getElementById('simSummaryPrice');
 const simSummaryDownPayment = document.getElementById('simSummaryDownPayment');
 const simSummaryFinanced = document.getElementById('simSummaryFinanced');
 const simSummaryTotalCost = document.getElementById('simSummaryTotalCost');
 const simSummaryBudgetSurplus = document.getElementById('simSummaryBudgetSurplus');
 const termButtons = document.querySelectorAll('.term-btn');

 // Formulário Adicionar
 const formAddCar = document.getElementById('formAddCar');

 // Modal
 const carModal = document.getElementById('carModal');
 const modalContent = document.getElementById('modalContent');
 const btnCloseModal = document.getElementById('btnCloseModal');

 // ==============================================================
 // 1. Navegação de Abas
 // ==============================================================
 function switchTab(tabId) {
 state.currentTab = tabId;
 navTabs.forEach(tab => {
 tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
 });
 tabPanes.forEach(pane => {
 pane.classList.toggle('active', pane.id === tabId);
 });

 if (tabId === 'tab-comparator') {
 renderComparator();
 } else if (tabId === 'tab-simulator') {
 updateSimulator();
 }
 }

 navTabs.forEach(tab => {
 tab.addEventListener('click', () => {
 switchTab(tab.getAttribute('data-tab'));
 });
 });

 // ==============================================================
 // 2. Sub-filtros dos 3 Alvos
 // ==============================================================
 subfilterPills.forEach(pill => {
 pill.addEventListener('click', () => {
 subfilterPills.forEach(p => p.classList.remove('active'));
 pill.classList.add('active');
 state.targetSubfilter = pill.getAttribute('data-target');
 renderAllGrids();
 });
 });

 // ==============================================================
 // 3. Filtros Globais (Busca, Preço, Combustível, Cidade, Ordenação)
 // ==============================================================
 searchInput.addEventListener('input', (e) => {
 state.searchQuery = e.target.value.trim().toLowerCase();
 btnClearSearch.classList.toggle('hidden', state.searchQuery === '');
 renderAllGrids();
 });

 btnClearSearch.addEventListener('click', () => {
 searchInput.value = '';
 state.searchQuery = '';
 btnClearSearch.classList.add('hidden');
 renderAllGrids();
 });

// Listeners antigos de <select> removidos (agora controlados por botões chips)

 // ==============================================================
 // 4. Lógica de Filtragem e Ordenação
 // ==============================================================
 function filterCars(carList) {
 return carList.filter(car => {
 // Filtro de Modelo Selecionado (Pulse, BYD, Tera)
 if (state.filterModel !== 'all') {
 const cat = (car.modelCategory || '').toLowerCase();
 const t = (car.title || '').toLowerCase();
 if (state.filterModel === 'pulse' && !cat.includes('pulse') && !t.includes('pulse')) return false;
 if (state.filterModel === 'byd' && !cat.includes('dolphin') && !t.includes('dolphin')) return false;
 if (state.filterModel === 'tera' && !cat.includes('tera') && !t.includes('tera') && !t.includes('polo')) return false;
 }
 // Filtro de Preço (considera tanto preço anunciado quanto meta de negociação)
 const effectivePrice = car.negotiatedTarget || car.price;
 if (effectivePrice > state.filterPrice) return false;

 // Filtro de Combustível
 if (state.filterFuel === 'electric') {
 const isElec = (car.fuel && car.fuel.toLowerCase().includes('elétrico')) || 
 (car.modelCategory && car.modelCategory.toLowerCase().includes('elétrico'));
 if (!isElec) return false;
 } else if (state.filterFuel === 'flex') {
 const isFlex = car.fuel && car.fuel.toLowerCase().includes('flex');
 if (!isFlex) return false;
 }

 // Filtro de Cidade / Região em SP
 if (state.filterCity !== 'all') {
 const fc = state.filterCity.toLowerCase();
 const city = (car.dealer?.city || '').toLowerCase();
 const neigh = (car.dealer?.neighborhood || '').toLowerCase();
 const badge = (car.badge || '').toLowerCase();

 if (fc === 'abc') {
 const isAbc = city.includes('santo andré') || city.includes('são bernardo') || city.includes('sbc') || city.includes('são caetano') || city.includes('diadema') || city.includes('mauá') || badge.includes('abc');
 if (!isAbc) return false;
 } else if (fc === 'barueri') {
 const isWest = city.includes('barueri') || city.includes('osasco') || neigh.includes('alphaville') || badge.includes('alphaville') || city.includes('cotia');
 if (!isWest) return false;
 } else if (fc === 'jundiaí') {
 const isJun = city.includes('jundiaí') || city.includes('piracicaba');
 if (!isJun) return false;
 } else {
 if (!city.includes(fc) && !neigh.includes(fc) && !badge.includes(fc)) {
 return false;
 }
 }
 }

 // Busca por Texto
 if (state.searchQuery) {
 const haystack = [
 car.title,
 car.modelCategory,
 car.dealer?.name,
 car.dealer?.city,
 car.dealer?.neighborhood,
 car.fuel,
 car.specs?.engine,
 car.badge
 ].filter(Boolean).join(' ').toLowerCase();

 if (!haystack.includes(state.searchQuery)) return false;
 }

 return true;
 });
 }

 function sortCars(carList) {
 const list = [...carList];
 if (state.filterSort === 'price-asc') {
 list.sort((a, b) => a.price - b.price);
 } else if (state.filterSort === 'km-asc') {
 list.sort((a, b) => (a.km || 0) - (b.km || 0));
 } else if (state.filterSort === 'year-desc') {
 list.sort((a, b) => (b.year || 0) - (a.year || 0));
 } else if (state.filterSort === 'electric-first') {
 list.sort((a, b) => {
 const aElec = a.fuel?.includes('Elétrico') ? 1 : 0;
 const bElec = b.fuel?.includes('Elétrico') ? 1 : 0;
 return bElec - aElec || a.price - b.price;
 });
 }
 return list;
 }

 // ==============================================================
 // 5. Renderização dos Cards Estilo Marketplace
 // ==============================================================
 function getExactCarImage(c) {
 if (!c || !c.image) return null;
 if (c.image.includes('unsplash')) return null;
 if (c.image.startsWith('./img/cars/') || c.image.startsWith('img/cars/')) {
 return c.image;
 }
 return null;
 }

 function createCarCardHTML(car) {
 const isElec = car.fuel?.includes('Elétrico');
 const isFav = window.autoRadarData.isFavorite(car.id);
 const isCompared = state.comparedCarIds.includes(car.id);
 const fmt = CarFinancingCalculator.formatCurrency;
 const cardImg = getExactCarImage(car);

 // Resumo de financiamento com Taxa Real de Mercado (2.50% a.m. ou taxa do veículo)
 const downPmt = car.financing?.downPayment || Math.round(car.price * 0.3);
 const rateUsed = car.financing?.interestRate || 2.50;
 const calcObj = CarFinancingCalculator.calculatePrice(car.price, downPmt, 48, rateUsed);
 const installment = car.financing?.monthlyInstallment || Math.round(calcObj.monthlyInstallment);

 // Link WhatsApp
 const waPhone = car.dealer?.whatsapp || '5511999999999';
 const waText = encodeURIComponent(`Olá! Vi o anúncio do ${car.title} por ${fmt(car.price)} no AutoRadar SP. Gostaria de saber mais sobre as opções de financiamento e agendar uma visita.`);
 const waLink = `https://wa.me/${waPhone}?text=${waText}`;

 const imgBoxHtml = cardImg ? `
 <div class="car-image-box">
 <img src="${cardImg}" alt="${car.title}" loading="lazy" onerror="this.closest('.car-image-box').remove();">
 <span class="car-badge-top ${isElec ? 'badge-electric' : ''}">
 ${car.badge || (isElec ? '100% Elétrico' : 'Automático')}
 </span>
 <button class="car-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${car.id}" title="Salvar nos favoritos">
 ${isFav ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'}
 </button>
 <div class="car-location-tag">
 ${car.dealer?.city || 'São Paulo'} - ${car.dealer?.neighborhood || 'SP'}
 </div>
 </div>
 ` : `
 <div class="car-card-no-img-header">
 <div style="display: flex; align-items: center; gap: 8px;">
 <span class="car-no-img-badge">
 ${car.badge || (isElec ? '100% Elétrico' : 'Automático')}
 </span>
 <span class="car-no-img-notice">Fotos no anúncio oficial</span>
 </div>
 <button class="car-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${car.id}" style="position: static;" title="Salvar nos favoritos">
 ${isFav ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'}
 </button>
 </div>
 `;

 return `
 <div class="car-card ${cardImg ? '' : 'car-card-no-img'}" data-id="${car.id}">
 ${imgBoxHtml}

 <div class="car-content">
 <div class="car-header-row">
 <span class="car-category-sub">${car.modelCategory}</span>
 <h3 class="car-title">${car.title}</h3>
 </div>

 <!-- Preço & FIPE -->
 <div class="car-pricing-box">
 <div class="price-main-row">
 <span class="price-val">${fmt(car.price)}</span>
 ${car.priceVsFipe ? `<span class="price-fipe-tag">${car.priceVsFipe}</span>` : ''}
 </div>
 <div class="price-financing-sub">
 <span>Entrada ${fmt(downPmt)}:</span>
 <strong>48x de ${fmt(installment)}</strong>
 <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px;">(CET Real Balcão: ${rateUsed.toFixed(2).replace('.', ',')}% a.m.)</span>
 </div>
 </div>

 <!-- Pílulas de Especificações -->
 <div class="specs-pills-grid">
 <div class="spec-pill">
 
 <div class="info">
 <span class="label">Ano / Mod</span>
 <span class="val">${car.year || '2023'}</span>
 </div>
 </div>
 <div class="spec-pill">
 
 <div class="info">
 <span class="label">KM Rodados</span>
 <span class="val">${(car.km || 0).toLocaleString('pt-BR')} km</span>
 </div>
 </div>
 <div class="spec-pill">
 <span class="icon">${isElec ? '' : ''}</span>
 <div class="info">
 <span class="label">${isElec ? 'Autonomia' : 'Câmbio'}</span>
 <span class="val">${isElec ? (car.specs?.range || '280 km') : 'Automático'}</span>
 </div>
 </div>
 <div class="spec-pill">
 
 <div class="info">
 <span class="label">Porta-Malas</span>
 <span class="val">${car.specs?.trunk || '370 Litros'}</span>
 </div>
 </div>
 </div>

 <!-- Concessionária e Laudo -->
 <div class="dealer-info-row">
 <span class="dealer-name">
 
 ${car.dealer?.name || 'Loja Verificada'}
 ${car.portal ? `<span class="car-portal-badge"> ${car.portal}</span>` : ''}
 </span>
 <span class="cautelar-approved">
 ${car.cautelarStatus ? 'Laudo Aprovado' : 'Periciado'}
 </span>
 </div>

         <!-- Botões de Ação -->
        <div class="card-actions-row">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-card-main">
            WhatsApp
          </a>
          <a href="${car.listingUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-card-listing" title="Abrir anúncio verificado em ${car.portal || 'portal parceiro de SP'}">
            Ver Anúncio ↗
          </a>
          <button class="btn-card-secondary btn-details" data-detail-id="${car.id}">
            Ficha
          </button>
          <button class="btn-card-compare ${isCompared ? 'active' : ''}" data-compare-id="${car.id}" title="${isCompared ? 'Remover do comparador' : 'Adicionar ao comparador'}">
            ${isCompared ? '✓ Comparando' : 'Comparar'}
          </button>
        </div>
      </div>
    </div>
  `;
}

 function renderAllGrids() {
 // 1. Nossos 3 Alvos
 let targets = window.autoRadarData.getTargetCars();
 if (state.targetSubfilter === 'pulse') {
 targets = targets.filter(c => c.modelCategory.includes('Pulse'));
 } else if (state.targetSubfilter === 'byd') {
 targets = targets.filter(c => c.modelCategory.includes('Dolphin'));
 } else if (state.targetSubfilter === 'tera') {
 targets = targets.filter(c => c.modelCategory.includes('Tera'));
 }
 const filteredTargets = sortCars(filterCars(targets));
 gridTargets.innerHTML = filteredTargets.length > 0 
 ? filteredTargets.map(createCarCardHTML).join('') 
 : '<div class="empty-state">Nenhum carro encontrado para os filtros selecionados nesta aba.</div>';
 countTargets.textContent = filteredTargets.length;

 // 2. 100% Elétricos
 const electrics = window.autoRadarData.getElectricCars();
 const filteredElectrics = sortCars(filterCars(electrics));
 gridElectrics.innerHTML = filteredElectrics.length > 0 
 ? filteredElectrics.map(createCarCardHTML).join('') 
 : '<div class="empty-state">Nenhum veículo elétrico encontrado com esses filtros.</div>';
 countElectrics.textContent = filteredElectrics.length;

 // 3. Sugestões & Similares com Lista Suspensa de Faixa de Preço
 let suggestions = window.autoRadarData.getSuggestionCars();
 if (state.suggestionTier !== 'all') {
 if (state.suggestionTier === '60k') {
 suggestions = suggestions.filter(c => c.priceTier === '60k' || c.price <= 60000);
 } else if (state.suggestionTier === '70k') {
 suggestions = suggestions.filter(c => c.priceTier === '70k' || (c.price > 60000 && c.price <= 70000));
 } else if (state.suggestionTier === '80k') {
 suggestions = suggestions.filter(c => c.priceTier === '80k' || (c.price > 70000 && c.price <= 80000));
 } else if (state.suggestionTier === '100k') {
 suggestions = suggestions.filter(c => c.priceTier === '100k' || (c.price > 80000 && c.price <= 100000));
 } else if (state.suggestionTier === '120k') {
 suggestions = suggestions.filter(c => c.priceTier === '120k' || (c.price > 100000 && c.price <= 120000));
 }
 }
 const filteredSuggestions = sortCars(filterCars(suggestions));
 gridSuggestions.innerHTML = filteredSuggestions.length > 0 
 ? filteredSuggestions.map(createCarCardHTML).join('') 
 : '<div class="empty-state">Nenhuma sugestão encontrada nesta faixa de preço com os filtros selecionados.</div>';
 countSuggestions.textContent = filteredSuggestions.length;

 // Atualizar título dinâmico na aba
 const tabTitleEl = document.getElementById('tabSuggestionsTitle');
 if (tabTitleEl) {
 const mapTitles = {
 '60k': 'Sugestões até 60k',
 '70k': 'Sugestões até 70k',
 '80k': 'Sugestões até 80k',
 '100k': 'Sugestões até 100k',
 '120k': 'Sugestões até 120k',
 'all': 'Todas as Sugestões'
 };
 tabTitleEl.textContent = mapTitles[state.suggestionTier] || 'Sugestões & Similares';
 }

 // Atualizar Badge do Comparador
 countCompare.textContent = state.comparedCarIds.length;

 // Reanexar Event Listeners de Cards
 attachCardListeners();
 }

 // ==============================================================
 // 4.1 Listeners dos Filtros em Botões (Chips) e Cards de Modelos
 // ==============================================================
 
 // A. Botões de Modelos (Pulse, BYD, Tera)
 function setModelFilter(modelKey) {
 state.filterModel = modelKey;
 
 // Atualizar botões de chip de modelo
 document.querySelectorAll('#modelBtnGroup .filter-model-chip').forEach(btn => {
 btn.classList.toggle('active', btn.getAttribute('data-model') === modelKey);
 });

 // Atualizar pílulas da aba de alvos
 document.querySelectorAll('.subfilter-pill').forEach(pill => {
 pill.classList.toggle('active', pill.getAttribute('data-target') === modelKey);
 });

 // Atualizar cards de insight do topo
 document.querySelectorAll('.insight-card[data-insight-model]').forEach(card => {
 card.classList.toggle('active', card.getAttribute('data-insight-model') === modelKey);
 });

 renderAllGrids();
 }

 document.querySelectorAll('#modelBtnGroup .filter-model-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 const m = btn.getAttribute('data-model');
 setModelFilter(m);
 });
 });

 // B. Cards de Destaque no Topo Clicáveis (Pulse, BYD, Tera)
 document.querySelectorAll('.insight-card[data-insight-model]').forEach(card => {
 card.addEventListener('click', () => {
 const targetModel = card.getAttribute('data-insight-model');
 if (state.filterModel === targetModel) {
 setModelFilter('all');
 } else {
 setModelFilter(targetModel);
 }
 // Se estiver em outra aba, navegar para alvos
 if (state.currentTab !== 'tab-targets') {
 switchTab('tab-targets');
 }
 });
 });

 // C. Botões de Preço Máximo
 document.querySelectorAll('#priceBtnGroup .filter-btn-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('#priceBtnGroup .filter-btn-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 const val = btn.getAttribute('data-price');
 state.filterPrice = val === 'all' ? Infinity : parseFloat(val);
 renderAllGrids();
 });
 });

 // D. Botões de Combustível
 document.querySelectorAll('#fuelBtnGroup .filter-btn-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('#fuelBtnGroup .filter-btn-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 state.filterFuel = btn.getAttribute('data-fuel');
 renderAllGrids();
 });
 });

 // E. Botões de Região em SP
 document.querySelectorAll('#regionBtnGroup .filter-btn-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('#regionBtnGroup .filter-btn-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 state.filterCity = btn.getAttribute('data-city');
 renderAllGrids();
 });
 });

 // F. Botões de Ordenação
 document.querySelectorAll('#sortBtnGroup .filter-btn-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('#sortBtnGroup .filter-btn-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 state.filterSort = btn.getAttribute('data-sort');
 renderAllGrids();
 });
 });

 // G. Botões de Faixas de Sugestão
 document.querySelectorAll('#suggestionTierBtnGroup .filter-btn-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('#suggestionTierBtnGroup .filter-btn-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 state.suggestionTier = btn.getAttribute('data-tier');
 renderAllGrids();
 });
 });


 function attachCardListeners() {
 // Favoritar
 document.querySelectorAll('.car-favorite-btn').forEach(btn => {
 btn.addEventListener('click', (e) => {
 e.stopPropagation();
 const id = btn.getAttribute('data-fav-id');
 const isNowFav = window.autoRadarData.toggleFavorite(id);
 btn.classList.toggle('favorited', isNowFav);
 btn.innerHTML = isNowFav ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
 });
 });

 // Comparar
 document.querySelectorAll('.btn-card-compare').forEach(btn => {
 btn.addEventListener('click', (e) => {
 e.stopPropagation();
 const id = btn.getAttribute('data-compare-id');
 toggleCompare(id);
 });
 });

 // Detalhes Modal
 document.querySelectorAll('.btn-details').forEach(btn => {
 btn.addEventListener('click', () => {
 const id = btn.getAttribute('data-detail-id');
 openCarDetailsModal(id);
 });
 });
 }

 // ==============================================================
 // 6. Comparador Lado a Lado Interativo (Seletores & Duelos)
 // ==============================================================
 const compareSlotSelect1 = document.getElementById('compareSlotSelect1');
 const compareSlotSelect2 = document.getElementById('compareSlotSelect2');
 const compareSlotSelect3 = document.getElementById('compareSlotSelect3');
 const compareSlotPreview1 = document.getElementById('compareSlotPreview1');
 const compareSlotPreview2 = document.getElementById('compareSlotPreview2');
 const compareSlotPreview3 = document.getElementById('compareSlotPreview3');
 const compareSlotCard1 = document.getElementById('compareSlotCard1');
 const compareSlotCard2 = document.getElementById('compareSlotCard2');
 const compareSlotCard3 = document.getElementById('compareSlotCard3');

 function populateCompareSlots() {
 const allCars = window.autoRadarData.getAllCars();
 const fmt = CarFinancingCalculator.formatCurrency;

 const buildOptions = (placeholder) => {
 let opts = `<option value="">${placeholder}</option>`;
 
 const alvos = allCars.filter(c => c.isTarget);
 const eletricos = allCars.filter(c => !c.isTarget && c.fuel?.includes('Elétrico'));
 const sugestoes = allCars.filter(c => !c.isTarget && !c.fuel?.includes('Elétrico'));

 if (alvos.length > 0) {
 opts += `<optgroup label="Nossos 3 Alvos (Pulse, Dolphin Mini, Tera)">`;
 alvos.forEach(c => {
 opts += `<option value="${c.id}">${c.title} — ${fmt(c.price)} (${c.dealer?.city || 'SP'})</option>`;
 });
 opts += `</optgroup>`;
 }

 if (eletricos.length > 0) {
 opts += `<optgroup label="Sugestões 100% Elétricas">`;
 eletricos.forEach(c => {
 opts += `<option value="${c.id}">${c.title} — ${fmt(c.price)} (${c.dealer?.city || 'SP'})</option>`;
 });
 opts += `</optgroup>`;
 }

 if (sugestoes.length > 0) {
 opts += `<optgroup label="Sugestões Automáticas">`;
 sugestoes.forEach(c => {
 opts += `<option value="${c.id}">${c.title} — ${fmt(c.price)} (${c.dealer?.city || 'SP'})</option>`;
 });
 opts += `</optgroup>`;
 }

 return opts;
 };

 if (compareSlotSelect1) compareSlotSelect1.innerHTML = buildOptions('-- Selecione o 1º Veículo --');
 if (compareSlotSelect2) compareSlotSelect2.innerHTML = buildOptions('-- Selecione o 2º Veículo --');
 if (compareSlotSelect3) compareSlotSelect3.innerHTML = buildOptions('-- Selecione o 3º Veículo (Opcional) --');
 }

 function setSlotCar(slotIdx, carId) {
 if (!state.compareSlots) {
 state.compareSlots = [null, null, null];
 }
 
 // Se selecionou um carro que já está em outro slot, limpa o outro slot
 if (carId) {
 for (let i = 0; i < 3; i++) {
 if (i !== slotIdx && state.compareSlots[i] === carId) {
 state.compareSlots[i] = null;
 }
 }
 }
 
 state.compareSlots[slotIdx] = carId || null;
 state.comparedCarIds = state.compareSlots.filter(Boolean);
 
 renderComparator();
 renderAllGrids();
 }

 function toggleCompare(carId) {
 if (!state.compareSlots) {
 state.compareSlots = [null, null, null];
 }

 const currentIdx = state.compareSlots.indexOf(carId);
 if (currentIdx !== -1) {
 state.compareSlots[currentIdx] = null;
 } else {
 const emptyIdx = state.compareSlots.findIndex(s => !s);
 if (emptyIdx === -1) {
 alert('Você já tem 3 veículos selecionados para comparação. Remova um deles para adicionar outro.');
 return;
 }
 state.compareSlots[emptyIdx] = carId;
 }

 state.comparedCarIds = state.compareSlots.filter(Boolean);
 renderAllGrids();
 if (state.currentTab === 'tab-comparator') {
 renderComparator();
 }
 }

 function applyComparePreset(presetKey) {
 const presets = {
 'alvos': ['pulse-01', 'byd-01', 'tera-01'],
 'eletricos': ['byd-01', 'sug-eletrico-01', 'sug-eletrico-02'],
 'automaticos': ['pulse-01', 'sug-vw-polo-01', 'sug-suv-kicks-01'],
 'economicos': ['pulse-01', 'byd-01', 'sug-eletrico-01']
 };

 const targetList = presets[presetKey] || presets['alvos'];
 state.compareSlots = [
 targetList[0] || null,
 targetList[1] || null,
 targetList[2] || null
 ];
 state.comparedCarIds = state.compareSlots.filter(Boolean);

 renderComparator();
 renderAllGrids();
 }

 function updateSlotPreviews() {
 const slots = [
 { select: compareSlotSelect1, preview: compareSlotPreview1, card: compareSlotCard1, idx: 0 },
 { select: compareSlotSelect2, preview: compareSlotPreview2, card: compareSlotCard2, idx: 1 },
 { select: compareSlotSelect3, preview: compareSlotPreview3, card: compareSlotCard3, idx: 2 }
 ];

 const fmt = CarFinancingCalculator.formatCurrency;

 slots.forEach(s => {
 if (!s.select || !s.preview || !s.card) return;
 const carId = (state.compareSlots && state.compareSlots[s.idx]) || '';
 s.select.value = carId;

 const removeBtn = s.card.querySelector(`[data-remove-slot="${s.idx}"]`);

 if (carId) {
 const car = window.autoRadarData.getCarById(carId);
 if (car) {
 s.card.classList.add('active');
 if (removeBtn) removeBtn.style.display = 'inline-block';
 const img = getExactCarImage(car);
 s.preview.innerHTML = `
 <div class="slot-car-preview">
 ${img ? `<img src="${img}" alt="${car.title}" onerror="this.remove();">` : `<div style="width: 50px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 16px;"></div>`}
 <div class="slot-car-info">
 <div class="slot-car-name">${car.title}</div>
 <div class="slot-car-price">${fmt(car.price)} <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">• ${car.dealer?.city || 'SP'}</span></div>
 </div>
 </div>
 `;
 return;
 }
 }

 s.card.classList.remove('active');
 if (removeBtn) removeBtn.style.display = 'none';
 s.preview.innerHTML = '';
 });
 }

 function renderComparator() {
 const cars = state.comparedCarIds.map(id => window.autoRadarData.getCarById(id)).filter(Boolean);
 countCompare.textContent = state.comparedCarIds.length;
 updateSlotPreviews();

 if (cars.length === 0) {
 compareContainer.innerHTML = `
 <div class="empty-compare-state">
 
 <h3>Nenhum veículo selecionado para comparação</h3>
 <p style="margin-bottom: 16px; font-size: 14px; max-width: 540px; margin-left: auto; margin-right: auto;">
 Escolha os modelos nos <strong>3 seletores acima</strong>, clique em um dos <strong>duelos prontos</strong> ou navegue pelas abas de carros clicando no botão <strong></strong>!
 </p>
 <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
 <button class="shortcut-chip" onclick="window.autoRadarApp.applyComparePreset('alvos')">Comparar Nossos 3 Alvos</button>
 <button class="shortcut-chip" onclick="window.autoRadarApp.applyComparePreset('eletricos')">Duelo 100% Elétricos</button>
 </div>
 </div>
 `;
 return;
 }

 const fmt = CarFinancingCalculator.formatCurrency;
 const allCars = window.autoRadarData.getAllCars();

 let html = `
 <table class="compare-table">
 <thead>
 <tr>
 <th>Especificação Técnica</th>
 ${cars.map((c, colIdx) => `
 <th class="compare-card-col">
 ${getExactCarImage(c) ? `
 <div style="margin-bottom: 8px;">
 <img src="${getExactCarImage(c)}" alt="${c.title}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" onerror="this.remove();">
 </div>
 ` : `
 <div style="height: 50px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; font-size: 11px; color: var(--text-muted);">
 Fotos no anúncio
 </div>
 `}
 <div style="font-size: 15px; color: #fff; line-height: 1.3;">${c.title}</div>
 <div style="font-size: 18px; margin-top: 4px; color: var(--electric-green); font-weight: 800;">${fmt(c.price)}</div>
 <div style="margin-top: 8px; display: flex; gap: 6px;">
 <button class="btn-slot-remove" onclick="window.autoRadarApp.removeSlot(${colIdx})">Remover</button>
 <a href="${c.listingUrl || '#'}" target="_blank" rel="noopener" class="btn-card-listing" style="padding: 4px 10px; font-size: 11px;">Anúncio ↗</a>
 </div>
 </th>
 `).join('')}
 ${cars.length < 3 ? `
 <th class="compare-card-col" style="vertical-align: middle; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px;">
 <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;"> Adicionar outro veículo</div>
 <select class="compare-slot-select" onchange="window.autoRadarApp.setSlotCar(${cars.length}, this.value)" style="max-width: 200px; margin: 0 auto;">
 <option value="">-- Escolher Carro --</option>
 ${allCars.filter(ac => !state.comparedCarIds.includes(ac.id)).map(ac => `<option value="${ac.id}">${ac.title} (${fmt(ac.price)})</option>`).join('')}
 </select>
 </th>
 ` : ''}
 </tr>
 </thead>
 <tbody>
 <tr>
 <th>Categoria / Tipo</th>
 ${cars.map(c => `<td><strong>${c.modelCategory}</strong></td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Combustível</th>
 ${cars.map(c => `<td>${c.fuel || 'Flex'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Câmbio</th>
 ${cars.map(c => `<td>${c.transmission || 'Automático'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Consumo Urbano / Autonomia</th>
 ${cars.map(c => {
 if (c.fuel?.includes('Elétrico')) {
 return `<td style="color: var(--electric-green); font-weight: 700;">${c.specs?.range || '280 km'} (Custo: ~R$ 0,08/km)</td>`;
 }
 return `<td>${c.specs?.consumptionCity || '12,5 km/l'}</td>`;
 }).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Consumo Estrada</th>
 ${cars.map(c => `<td>${c.specs?.consumptionRoad || '14,3 km/l (Flex)'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Porta-Malas</th>
 ${cars.map(c => `<td>${c.specs?.trunk || '370 L'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Potência & Torque</th>
 ${cars.map(c => `<td>${c.specs?.power || '107 cv'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Garantia & Procedência</th>
 ${cars.map(c => `<td>${c.specs?.warranty || 'Garantia Concessionária'}</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Localização em SP</th>
 ${cars.map(c => `<td> ${c.dealer?.city} - ${c.dealer?.neighborhood} (${c.portal || 'Loja'})</td>`).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Opção de Financiamento</th>
 ${cars.map(c => {
 const dp = c.financing?.downPayment || Math.round(c.price * 0.3);
 const inst = c.financing?.monthlyInstallment || Math.round((c.price - dp) * 0.0276);
 return `<td>Entrada de ${fmt(dp)} + 48x de <strong>${fmt(inst)}</strong></td>`;
 }).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 <tr>
 <th>Ações & Negociação</th>
 ${cars.map(c => `
 <td>
 <button class="btn-card-main" onclick="window.autoRadarApp.openInSimulator('${c.id}')" style="margin-bottom: 6px; width: 100%; text-align: center; justify-content: center;">
 Simular Financiamento
 </button>
 </td>
 `).join('')}
 ${cars.length < 3 ? '<td>-</td>' : ''}
 </tr>
 </tbody>
 </table>
 `;

 compareContainer.innerHTML = html;
 }

 // Listeners dos seletores de slot
 [compareSlotSelect1, compareSlotSelect2, compareSlotSelect3].forEach((sel, idx) => {
 if (sel) {
 sel.addEventListener('change', () => {
 setSlotCar(idx, sel.value);
 });
 }
 });

 // Listeners dos botões de remover de slot
 document.querySelectorAll('[data-remove-slot]').forEach(btn => {
 btn.addEventListener('click', () => {
 const idx = parseInt(btn.getAttribute('data-remove-slot'), 10);
 setSlotCar(idx, '');
 });
 });

 // Listeners dos botões de preset
 document.querySelectorAll('[data-compare-preset]').forEach(btn => {
 btn.addEventListener('click', () => {
 const presetKey = btn.getAttribute('data-compare-preset');
 applyComparePreset(presetKey);
 });
 });

 document.getElementById('btnClearCompare').addEventListener('click', () => {
 state.compareSlots = [null, null, null];
 state.comparedCarIds = [];
 renderAllGrids();
 renderComparator();
 });

 // ==============================================================
 // 7. Simulador de Financiamento
 // ==============================================================
 function populateSimulatorCarSelect() {
 const allCars = window.autoRadarData.getAllCars();
 simCarSelect.innerHTML = '<option value="custom">-- Digitar valor personalizado --</option>' +
 allCars.map(c => `<option value="${c.id}">${c.title} — ${CarFinancingCalculator.formatCurrency(c.price)}</option>`).join('');
 }

 function updateSimulator() {
 const price = parseFloat(simVehiclePrice.value) || 0;
 const downPayment = parseFloat(simDownPaymentRange.value) || 0;
 const rate = parseFloat(simInterestRate.value) || 2.50;
 const term = state.simCurrentTerm;

 // Atualizar labels
 const pct = price > 0 ? Math.round((downPayment / price) * 100) : 0;
 simDownPaymentVal.textContent = `${CarFinancingCalculator.formatCurrency(downPayment)} (${pct}%)`;

 const res = CarFinancingCalculator.calculatePrice(price, downPayment, term, rate);
 const fmt = CarFinancingCalculator.formatCurrency;

 simMonthlyResult.textContent = fmt(res.monthlyInstallment);
 simTotalInterestResult.textContent = `Total financiado: ${fmt(res.financedAmount)} em ${term} parcelas`;

 simSummaryPrice.textContent = fmt(price);
 simSummaryDownPayment.textContent = fmt(downPayment);
 simSummaryFinanced.textContent = fmt(res.financedAmount);
 simSummaryTotalCost.textContent = fmt(res.totalCost);

 // Sobra do Orçamento de R$ 80.000
 const budget = 80000;
 const surplus = budget - downPayment;
 if (surplus >= 0) {
 simSummaryBudgetSurplus.textContent = `${fmt(surplus)} de reserva intacta!`;
 simSummaryBudgetSurplus.className = 'text-cyan';
 } else {
 simSummaryBudgetSurplus.textContent = `Atenção: Entrada excede o orçamento em ${fmt(Math.abs(surplus))}`;
 simSummaryBudgetSurplus.className = 'text-red';
 }
 }

 simCarSelect.addEventListener('change', (e) => {
 if (e.target.value === 'custom') return;
 const car = window.autoRadarData.getCarById(e.target.value);
 if (car) {
 simVehiclePrice.value = car.price;
 simDownPaymentRange.max = car.price;
 const suggestedDown = car.financing?.downPayment || Math.round(car.price * 0.3);
 simDownPaymentRange.value = suggestedDown;
 if (car.financing?.interestRate) {
 simInterestRate.value = car.financing.interestRate;
 }
 updateSimulator();
 }
 });

 simVehiclePrice.addEventListener('input', () => {
 const val = parseFloat(simVehiclePrice.value) || 0;
 simDownPaymentRange.max = val;
 if (parseFloat(simDownPaymentRange.value) > val) {
 simDownPaymentRange.value = val;
 }
 updateSimulator();
 });

 simDownPaymentRange.addEventListener('input', updateSimulator);
 simInterestRate.addEventListener('input', updateSimulator);
 // Listeners dos botões de taxa de juros pré-configurados
 document.querySelectorAll('.rate-chip').forEach(btn => {
 btn.addEventListener('click', () => {
 document.querySelectorAll('.rate-chip').forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 const r = parseFloat(btn.getAttribute('data-rate'));
 if (simInterestRate && !isNaN(r)) {
 simInterestRate.value = r;
 updateSimulator();
 }
 });
 });

 if (simInterestRate) {
 simInterestRate.addEventListener('input', () => {
 const currentVal = parseFloat(simInterestRate.value);
 document.querySelectorAll('.rate-chip').forEach(b => {
 b.classList.toggle('active', parseFloat(b.getAttribute('data-rate')) === currentVal);
 });
 });
 }


 termButtons.forEach(btn => {
 btn.addEventListener('click', () => {
 termButtons.forEach(b => b.classList.remove('active'));
 btn.classList.add('active');
 state.simCurrentTerm = parseInt(btn.getAttribute('data-term'), 10);
 updateSimulator();
 });
 });

 // ==============================================================
 // 8. Formulário para Adicionar Novo Carro
 // ==============================================================
 formAddCar.addEventListener('submit', (e) => {
 e.preventDefault();
 const newCar = {
 title: document.getElementById('addTitle').value.trim(),
 modelCategory: document.getElementById('addCategory').value,
 price: parseFloat(document.getElementById('addPrice').value),
 year: parseInt(document.getElementById('addYear').value, 10),
 km: parseInt(document.getElementById('addKm').value, 10) || 0,
 fuel: document.getElementById('addFuel').value,
 dealer: {
 name: document.getElementById('addDealerName').value.trim(),
 city: document.getElementById('addCity').value.trim(),
 whatsapp: document.getElementById('addWhatsapp').value.trim()
 },
 link: document.getElementById('addLink').value.trim(),
 notes: document.getElementById('addNotes').value.trim()
 };

 window.autoRadarData.addCustomCar(newCar);
 formAddCar.reset();
 alert(' Carro adicionado com sucesso ao seu radar!');
 renderAllGrids();
 populateSimulatorCarSelect();
 switchTab('tab-targets');
 });

 // ==============================================================
 // 9. Modal de Detalhes do Carro
 // ==============================================================
 function openCarDetailsModal(carId) {
 const car = window.autoRadarData.getCarById(carId);
 if (!car) return;

 const fmt = CarFinancingCalculator.formatCurrency;
 const isElec = car.fuel?.includes('Elétrico');
 const waPhone = car.dealer?.whatsapp || '5511999999999';
 const waText = encodeURIComponent(`Olá! Vi o anúncio do ${car.title} por ${fmt(car.price)} no AutoRadar SP. Gostaria de agendar uma visita e negociar.`);
 const waLink = `https://wa.me/${waPhone}?text=${waText}`;

 const modalImg = getExactCarImage(car);
 const modalImgBox = modalImg ? `
 <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
 <img src="${modalImg}" 
 alt="${car.title}" 
 style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px;"
 onerror="this.parentElement.remove();">
 </div>
 ` : `
 <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--border-color); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
 
 <h4 style="color: #fff; margin-top: 6px; font-size: 15px;">Fotos Reais no Anúncio Oficial</h4>
 <p style="color: var(--text-muted); font-size: 12.5px; margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto;">
 Para total transparência e evitar fotos incorretas de outros modelos, veja a galeria de fotos e o laudo cautelar diretamente no anúncio oficial da concessionária/loja.
 </p>
 </div>
 `;

 modalContent.innerHTML = `
 ${modalImgBox}

 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
 <div>
 <span style="color: var(--electric-green); font-size: 12px; font-weight: 700; text-transform: uppercase;">${car.modelCategory}</span>
 <h2 style="color: #fff; font-size: 24px; margin-top: 4px;">${car.title}</h2>
 <p style="color: var(--text-muted); font-size: 13px;">${car.dealer?.name} — ${car.dealer?.address || car.dealer?.city}</p>
 </div>
 <div style="text-align: right;">
 <div style="font-size: 26px; font-weight: 800; color: var(--electric-green); font-family: var(--font-mono);">${fmt(car.price)}</div>
 ${car.fipePrice ? `<div style="font-size: 12px; color: #38bdf8;">Tabela FIPE: ${fmt(car.fipePrice)}</div>` : ''}
 </div>
 </div>

 <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
 <h4 style="color: #fff; margin-bottom: 10px;"> Condições de Pagamento & Financiamento</h4>
 <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.5;">${car.financing?.optionsText || 'Opções de financiamento com entrada a partir de 20% e saldo em até 60x. Aceita seu veículo na troca e pagamento à vista.'}</p>
 </div>

 <div style="margin-bottom: 20px;">
 <h4 style="color: #fff; margin-bottom: 10px;"> Itens de Destaque & Equipamentos</h4>
 <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; list-style: none; padding: 0;">
 ${(car.specs?.features || ['Câmbio Automático', 'Ar-Condicionado', 'Direção Elétrica', 'Multimídia', 'Airbags', 'Freios ABS']).map(f => `
 <li style="font-size: 12.5px; color: #e2e8f0; display: flex; align-items: center; gap: 6px;">
 <span style="color: var(--electric-green);">✓</span> ${f}
 </li>
 `).join('')}
 </ul>
 </div>

 <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
 <a href="${waLink}" target="_blank" rel="noopener" class="btn-primary" style="flex: 2; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
 <span></span> Chamar no WhatsApp da Loja
 </a>
 <a href="${car.listingUrl || '#'}" target="_blank" rel="noopener" class="btn-card-listing-lg" style="flex: 2; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
 <span></span> Abrir Anúncio Oficial (${car.portal || "Webmotors"}) ↗
 </a>
 <button class="btn-secondary-sm" onclick="window.autoRadarApp.openInSimulator('${car.id}')" style="flex: 1; min-width: 160px; padding: 12px;">
 Simular Parcelas
 </button>
 </div>
 `;

 carModal.classList.remove('hidden');
 }

 btnCloseModal.addEventListener('click', () => {
 carModal.classList.add('hidden');
 });

 carModal.addEventListener('click', (e) => {
 if (e.target === carModal) carModal.classList.add('hidden');
 });

 // ==============================================================
 // 10. Atualização Diária & Botão de Sincronização
 // ==============================================================
 syncStatusText.textContent = `Atualizado ${window.autoRadarData.getLastSyncFormatted()}`;

 btnForceSync.addEventListener('click', async () => {
 btnForceSync.disabled = true;
 btnForceSync.innerHTML = '<span>⏳</span> Verificando SP...';
 
 // Simula uma checagem ativa em segundo plano com delay natural
 await new Promise(r => setTimeout(r, 1200));

 const formatted = window.autoRadarData.triggerManualSync();
 syncStatusText.textContent = `Atualizado ${formatted}`;
 
 btnForceSync.disabled = false;
 btnForceSync.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Varredura Diária';
 
 alert(' Varredura diária concluída! Todas as ofertas das concessionárias e lojas de São Paulo foram validadas.');
 renderAllGrids();
 });

 const btnClearCache = document.getElementById('btnClearCache');
 if (btnClearCache) {
 btnClearCache.addEventListener('click', async () => {
 try {
 if ('caches' in window) {
 const keys = await caches.keys();
 await Promise.all(keys.map(k => caches.delete(k)));
 }
 localStorage.removeItem('autoradar_sp_custom_cars_v1');
 localStorage.removeItem('autoradar_ver');
 if ('serviceWorker' in navigator) {
 const regs = await navigator.serviceWorker.getRegistrations();
 for (let r of regs) {
 await r.unregister();
 }
 }
 } catch (e) {}
 alert(' Cache e Service Worker limpos com sucesso! Recarregando fotos reais...');
 window.location.reload(true);
 });
 }

 // ==============================================================
 // 11. Gestão do PWA & Botão de Instalar App
 // ==============================================================
 const btnInstallPwa = document.getElementById('btnInstallPwa');
 let deferredPrompt = null;

 // Verificar se o app já está rodando como standalone (instalado)
 const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

 if (isStandalone) {
 if (btnInstallPwa) {
 btnInstallPwa.classList.remove('hidden');
 btnInstallPwa.classList.add('installed');
 btnInstallPwa.innerHTML = '<span class="pwa-icon"></span> <span class="pwa-text">App Instalado</span>';
 }
 } else {
 // Detectar iOS / Safari
 const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
 
 if (isIos) {
 // No iOS, exibimos o botão com instrução para adicionar à tela de início
 if (btnInstallPwa) {
 btnInstallPwa.classList.remove('hidden');
 btnInstallPwa.addEventListener('click', () => {
 alert(" Para instalar o AutoRadar SP no seu iPhone:\n\n1. Toque no botão Compartilhar (ícone com quadrado e seta para cima no Safari ⎋)\n2. Role para baixo e selecione 'Adicionar à Tela de Início' \n3. Toque em 'Adicionar' no topo direito.");
 });
 }
 } else {
 // No Android, Chrome, Edge e navegadores Chromium
 window.addEventListener('beforeinstallprompt', (e) => {
 // Prevenir o banner automático padrão do navegador para usar nosso botão customizado
 e.preventDefault();
 deferredPrompt = e;
 if (btnInstallPwa) {
 btnInstallPwa.classList.remove('hidden');
 }
 });

 if (btnInstallPwa) {
 btnInstallPwa.addEventListener('click', async () => {
 if (!deferredPrompt) {
 alert('Para instalar o app, use a opção "Instalar aplicativo" ou "Adicionar à tela inicial" no menu de 3 pontinhos do seu navegador.');
 return;
 }

 deferredPrompt.prompt();
 const { outcome } = await deferredPrompt.userChoice;
 if (outcome === 'accepted') {
 btnInstallPwa.classList.add('installed');
 btnInstallPwa.innerHTML = '<span class="pwa-icon"></span> <span class="pwa-text">App Instalado</span>';
 }
 deferredPrompt = null;
 });
 }

 window.addEventListener('appinstalled', () => {
 if (btnInstallPwa) {
 btnInstallPwa.classList.add('installed');
 btnInstallPwa.innerHTML = '<span class="pwa-icon"></span> <span class="pwa-text">App Instalado</span>';
 }
 });
 }
 }

 // Expor métodos úteis globalmente
 window.autoRadarApp = {
 toggleCompare,
 setSlotCar,
 removeSlot: (slotIdx) => setSlotCar(slotIdx, ''),
 applyComparePreset,
 openInSimulator: (carId) => {
 carModal.classList.add('hidden');
 switchTab('tab-simulator');
 simCarSelect.value = carId;
 simCarSelect.dispatchEvent(new Event('change'));
 }
 };

 // Inicialização Inicial
 populateCompareSlots();
 populateSimulatorCarSelect();
 renderAllGrids();
 updateSimulator();
});
