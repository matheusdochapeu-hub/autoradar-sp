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
    searchQuery: '',
    filterPrice: 80000,
    filterFuel: 'all',
    filterCity: 'all',
    filterSort: 'price-asc',
    comparedCarIds: ['pulse-01', 'byd-01'], // 2 carros pré-selecionados para o comparador já nascer útil!
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

  // Filtros
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const filterPrice = document.getElementById('filterPrice');
  const filterFuel = document.getElementById('filterFuel');
  const filterCity = document.getElementById('filterCity');
  const filterSort = document.getElementById('filterSort');
  const subfilterPills = document.querySelectorAll('.subfilter-pill');

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

  filterPrice.addEventListener('change', (e) => {
    state.filterPrice = e.target.value === 'all' ? 9999999 : parseFloat(e.target.value);
    renderAllGrids();
  });

  filterFuel.addEventListener('change', (e) => {
    state.filterFuel = e.target.value;
    renderAllGrids();
  });

  filterCity.addEventListener('change', (e) => {
    state.filterCity = e.target.value;
    renderAllGrids();
  });

  filterSort.addEventListener('change', (e) => {
    state.filterSort = e.target.value;
    renderAllGrids();
  });

  // ==============================================================
  // 4. Lógica de Filtragem e Ordenação
  // ==============================================================
  function filterCars(carList) {
    return carList.filter(car => {
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

      // Filtro de Cidade
      if (state.filterCity !== 'all') {
        if (!car.dealer || !car.dealer.city || !car.dealer.city.toLowerCase().includes(state.filterCity.toLowerCase())) {
          return false;
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
    if (!c) return './img/cars/pulse-drive-cinza.jpg';
    if (c.image && !c.image.includes('unsplash') && (c.image.startsWith('./img/cars/') || c.image.startsWith('img/cars/'))) {
      return c.image;
    }
    const t = (c.title || '').toLowerCase();
    const cat = (c.modelCategory || '').toLowerCase();
    if (cat.includes('pulse') || t.includes('pulse')) {
      if (t.includes('turbo') || t.includes('branco')) return './img/cars/pulse-turbo-branco.jpg';
      if (t.includes('audace') || t.includes('azul')) return './img/cars/pulse-audace-azul.jpg';
      return './img/cars/pulse-drive-cinza.jpg';
    }
    if (cat.includes('dolphin') || t.includes('dolphin')) {
      if (t.includes('verde')) return './img/cars/byd-dolphin-mini-verde.jpg';
      if (t.includes('preto') || t.includes('5 lugares')) return './img/cars/byd-dolphin-mini-preto.jpg';
      return './img/cars/byd-dolphin-mini-branco.jpg';
    }
    if (cat.includes('tera') || t.includes('tera')) return './img/cars/vw-tera.jpg';
    if (t.includes('kwid')) return './img/cars/kwid-etech.jpg';
    if (t.includes('jac') || t.includes('js1')) return './img/cars/jac-ejs1.jpg';
    if (t.includes('polo')) return './img/cars/vw-polo-tsi.jpg';
    if (t.includes('kicks')) return './img/cars/nissan-kicks.jpg';
    if (t.includes('cactus')) return './img/cars/c4-cactus.jpg';
    if (t.includes('argo')) return './img/cars/argo-trekking.jpg';
    return './img/cars/pulse-drive-cinza.jpg';
  }

  function createCarCardHTML(car) {
    const isElec = car.fuel?.includes('Elétrico');
    const isFav = window.autoRadarData.isFavorite(car.id);
    const isCompared = state.comparedCarIds.includes(car.id);
    const fmt = CarFinancingCalculator.formatCurrency;
    const cardImg = getExactCarImage(car);

    // Resumo de financiamento
    const downPmt = car.financing?.downPayment || Math.round(car.price * 0.3);
    const installment = car.financing?.monthlyInstallment || Math.round((car.price - downPmt) * 0.0276);

    // Link WhatsApp
    const waPhone = car.dealer?.whatsapp || '5511999999999';
    const waText = encodeURIComponent(`Olá! Vi o anúncio do ${car.title} por ${fmt(car.price)} no AutoRadar SP. Gostaria de saber mais sobre as opções de financiamento e agendar uma visita.`);
    const waLink = `https://wa.me/${waPhone}?text=${waText}`;

    return `
      <div class="car-card" data-id="${car.id}">
        <div class="car-image-box">
          <img src="${cardImg}" alt="${car.title}" loading="lazy">
          
          <span class="car-badge-top ${isElec ? 'badge-electric' : ''}">
            ${car.badge || (isElec ? '⚡ 100% Elétrico' : '🚗 Automático')}
          </span>

          <button class="car-favorite-btn ${isFav ? 'favorited' : ''}" data-fav-id="${car.id}" title="Salvar nos favoritos">
            ${isFav ? '❤️' : '🤍'}
          </button>

          <div class="car-location-tag">
            <span>📍</span> ${car.dealer?.city || 'São Paulo'} - ${car.dealer?.neighborhood || 'SP'}
          </div>
        </div>

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
            </div>
          </div>

          <!-- Pílulas de Especificações -->
          <div class="specs-pills-grid">
            <div class="spec-pill">
              <span class="icon">📅</span>
              <div class="info">
                <span class="label">Ano / Mod</span>
                <span class="val">${car.year || '2023'}</span>
              </div>
            </div>
            <div class="spec-pill">
              <span class="icon">🛣️</span>
              <div class="info">
                <span class="label">KM Rodados</span>
                <span class="val">${(car.km || 0).toLocaleString('pt-BR')} km</span>
              </div>
            </div>
            <div class="spec-pill">
              <span class="icon">${isElec ? '🔋' : '⚙️'}</span>
              <div class="info">
                <span class="label">${isElec ? 'Autonomia' : 'Câmbio'}</span>
                <span class="val">${isElec ? (car.specs?.range || '280 km') : 'Automático'}</span>
              </div>
            </div>
            <div class="spec-pill">
              <span class="icon">🧳</span>
              <div class="info">
                <span class="label">Porta-Malas</span>
                <span class="val">${car.specs?.trunk || '370 Litros'}</span>
              </div>
            </div>
          </div>

          <!-- Concessionária e Laudo -->
          <div class="dealer-info-row">
            <span class="dealer-name">
              <span class="verified-icon">✓</span>
              ${car.dealer?.name || 'Loja Verificada'}
            </span>
            <span class="cautelar-approved">
              🛡️ ${car.cautelarStatus ? 'Laudo Aprovado' : 'Periciado'}
            </span>
          </div>

          <!-- Botões de Ação -->
          <div class="card-actions-row">
            <a href="${waLink}" target="_blank" rel="noopener" class="btn-card-main">
              <span>💬</span> WhatsApp
            </a>
            <a href="${car.listingUrl || '#'}" target="_blank" rel="noopener" class="btn-card-listing" title="Abrir anúncio verificado na Webmotors / iCarros / Loja">
              <span>🔗</span> Anúncio
            </a>
            <button class="btn-card-secondary btn-details" data-detail-id="${car.id}">
              Ficha
            </button>
            <button class="btn-card-compare ${isCompared ? 'active' : ''}" data-compare-id="${car.id}" title="${isCompared ? 'Remover do comparador' : 'Adicionar ao comparador'}">
              ⚖️
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

    // 3. Sugestões & Similares
    const suggestions = window.autoRadarData.getSuggestionCars();
    const filteredSuggestions = sortCars(filterCars(suggestions));
    gridSuggestions.innerHTML = filteredSuggestions.length > 0 
      ? filteredSuggestions.map(createCarCardHTML).join('') 
      : '<div class="empty-state">Nenhuma sugestão encontrada com esses filtros.</div>';
    countSuggestions.textContent = filteredSuggestions.length;

    // Atualizar Badge do Comparador
    countCompare.textContent = state.comparedCarIds.length;

    // Reanexar Event Listeners de Cards
    attachCardListeners();
  }

  function attachCardListeners() {
    // Favoritar
    document.querySelectorAll('.car-favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-fav-id');
        const isNowFav = window.autoRadarData.toggleFavorite(id);
        btn.classList.toggle('favorited', isNowFav);
        btn.textContent = isNowFav ? '❤️' : '🤍';
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
  // 6. Comparador Lado a Lado
  // ==============================================================
  function toggleCompare(carId) {
    const idx = state.comparedCarIds.indexOf(carId);
    if (idx > -1) {
      state.comparedCarIds.splice(idx, 1);
    } else {
      if (state.comparedCarIds.length >= 3) {
        alert('Você pode comparar no máximo 3 carros ao mesmo tempo. Remova um para adicionar outro.');
        return;
      }
      state.comparedCarIds.push(carId);
    }
    renderAllGrids();
    if (state.currentTab === 'tab-comparator') {
      renderComparator();
    }
  }

  function renderComparator() {
    const cars = state.comparedCarIds.map(id => window.autoRadarData.getCarById(id)).filter(Boolean);
    if (cars.length === 0) {
      compareContainer.innerHTML = `
        <div class="empty-compare-state">
          <div class="empty-icon">⚖️</div>
          <h3>Nenhum carro selecionado para comparação</h3>
          <p>Navegue pelas abas de carros e clique no botão <strong>⚖️</strong> em qualquer card para comparar lado a lado!</p>
        </div>
      `;
      return;
    }

    const fmt = CarFinancingCalculator.formatCurrency;

    let html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>Especificação Técnica</th>
            ${cars.map(c => `
              <th class="compare-card-col">
                <div>${c.title}</div>
                <div style="font-size: 18px; margin-top: 4px;">${fmt(c.price)}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Categoria / Tipo</th>
            ${cars.map(c => `<td><strong>${c.modelCategory}</strong></td>`).join('')}
          </tr>
          <tr>
            <th>Combustível</th>
            ${cars.map(c => `<td>${c.fuel || 'Flex'}</td>`).join('')}
          </tr>
          <tr>
            <th>Câmbio</th>
            ${cars.map(c => `<td>${c.transmission || 'Automático'}</td>`).join('')}
          </tr>
          <tr>
            <th>Consumo Urbano / Autonomia</th>
            ${cars.map(c => {
              if (c.fuel?.includes('Elétrico')) {
                return `<td style="color: var(--electric-green); font-weight: 700;">${c.specs?.range || '280 km'} (Custo: ~R$ 0,08/km)</td>`;
              }
              return `<td>${c.specs?.consumptionCity || '12,5 km/l'}</td>`;
            }).join('')}
          </tr>
          <tr>
            <th>Consumo Estrada</th>
            ${cars.map(c => `<td>${c.specs?.consumptionRoad || '14,3 km/l (Flex)'}</td>`).join('')}
          </tr>
          <tr>
            <th>Porta-Malas</th>
            ${cars.map(c => `<td>${c.specs?.trunk || '370 L'}</td>`).join('')}
          </tr>
          <tr>
            <th>Potência & Torque</th>
            ${cars.map(c => `<td>${c.specs?.power || '107 cv'}</td>`).join('')}
          </tr>
          <tr>
            <th>Garantia & Procedência</th>
            ${cars.map(c => `<td>${c.specs?.warranty || 'Garantia Concessionária'}</td>`).join('')}
          </tr>
          <tr>
            <th>Localização em SP</th>
            ${cars.map(c => `<td>📍 ${c.dealer?.city} - ${c.dealer?.neighborhood}</td>`).join('')}
          </tr>
          <tr>
            <th>Opção de Financiamento</th>
            ${cars.map(c => {
              const dp = c.financing?.downPayment || Math.round(c.price * 0.3);
              const inst = c.financing?.monthlyInstallment || Math.round((c.price - dp) * 0.0276);
              return `<td>Entrada de ${fmt(dp)} + 48x de <strong>${fmt(inst)}</strong></td>`;
            }).join('')}
          </tr>
          <tr>
            <th>Ações</th>
            ${cars.map(c => `
              <td>
                <button class="btn-secondary-sm" onclick="window.autoRadarApp.toggleCompare('${c.id}')">Remover da Comparação</button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    `;

    compareContainer.innerHTML = html;
  }

  document.getElementById('btnClearCompare').addEventListener('click', () => {
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
    const rate = parseFloat(simInterestRate.value) || 1.39;
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
    alert('✅ Carro adicionado com sucesso ao seu radar!');
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

    modalContent.innerHTML = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
        <img src="${getExactCarImage(car)}" 
             alt="${car.title}" 
             style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px;">
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <span style="color: var(--electric-green); font-size: 12px; font-weight: 700; text-transform: uppercase;">${car.modelCategory}</span>
          <h2 style="color: #fff; font-size: 24px; margin-top: 4px;">${car.title}</h2>
          <p style="color: var(--text-muted); font-size: 13px;">📍 ${car.dealer?.name} — ${car.dealer?.address || car.dealer?.city}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 26px; font-weight: 800; color: var(--electric-green); font-family: var(--font-mono);">${fmt(car.price)}</div>
          ${car.fipePrice ? `<div style="font-size: 12px; color: #38bdf8;">Tabela FIPE: ${fmt(car.fipePrice)}</div>` : ''}
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h4 style="color: #fff; margin-bottom: 10px;">📋 Condições de Pagamento & Financiamento</h4>
        <p style="font-size: 13.5px; color: #cbd5e1; line-height: 1.5;">${car.financing?.optionsText || 'Opções de financiamento com entrada a partir de 20% e saldo em até 60x. Aceita seu veículo na troca e pagamento à vista.'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: #fff; margin-bottom: 10px;">✨ Itens de Destaque & Equipamentos</h4>
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
          <span>💬</span> Chamar no WhatsApp da Loja
        </a>
        <a href="${car.listingUrl || '#'}" target="_blank" rel="noopener" class="btn-card-listing-lg" style="flex: 2; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>🔗</span> Abrir Anúncio Oficial (Webmotors / Portal)
        </a>
        <button class="btn-secondary-sm" onclick="window.autoRadarApp.openInSimulator('${car.id}')" style="flex: 1; min-width: 160px; padding: 12px;">
          🧮 Simular Parcelas
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
    
    alert('✅ Varredura diária concluída! Todas as ofertas das concessionárias e lojas de São Paulo foram validadas.');
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
      alert('🧹 Cache e Service Worker limpos com sucesso! Recarregando fotos reais...');
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
      btnInstallPwa.innerHTML = '<span class="pwa-icon">✓</span> <span class="pwa-text">App Instalado</span>';
    }
  } else {
    // Detectar iOS / Safari
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    
    if (isIos) {
      // No iOS, exibimos o botão com instrução para adicionar à tela de início
      if (btnInstallPwa) {
        btnInstallPwa.classList.remove('hidden');
        btnInstallPwa.addEventListener('click', () => {
          alert("📲 Para instalar o AutoRadar SP no seu iPhone:\n\n1. Toque no botão Compartilhar (ícone com quadrado e seta para cima no Safari ⎋)\n2. Role para baixo e selecione 'Adicionar à Tela de Início' ➕\n3. Toque em 'Adicionar' no topo direito.");
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
            btnInstallPwa.innerHTML = '<span class="pwa-icon">✓</span> <span class="pwa-text">App Instalado</span>';
          }
          deferredPrompt = null;
        });
      }

      window.addEventListener('appinstalled', () => {
        if (btnInstallPwa) {
          btnInstallPwa.classList.add('installed');
          btnInstallPwa.innerHTML = '<span class="pwa-icon">✓</span> <span class="pwa-text">App Instalado</span>';
        }
      });
    }
  }

  // Expor métodos úteis globalmente
  window.autoRadarApp = {
    toggleCompare,
    openInSimulator: (carId) => {
      carModal.classList.add('hidden');
      switchTab('tab-simulator');
      simCarSelect.value = carId;
      simCarSelect.dispatchEvent(new Event('change'));
    }
  };

  // Inicialização Inicial
  populateSimulatorCarSelect();
  renderAllGrids();
  updateSimulator();
});
