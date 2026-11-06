/**
 * AutoRadar SP - Módulo de Cálculos Financeiros e Financiamento
 * Cálculos precisos de CDC (Crédito Direto ao Consumidor) e Tabela Price para veículos.
 */

class CarFinancingCalculator {
  /**
   * Calcula a parcela de financiamento utilizando a Tabela Price:
   * PMT = PV * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
   * @param {number} vehiclePrice - Preço do carro à vista
   * @param {number} downPayment - Valor da entrada em R$
   * @param {number} termMonths - Prazo em meses (12, 24, 36, 48, 60)
   * @param {number} monthlyRatePercent - Taxa de juros mensal em porcentagem (ex: 1.39)
   * @returns {object} Resumo com parcela, total financiado, juros e custo total
   */
  static calculatePrice(vehiclePrice, downPayment, termMonths, monthlyRatePercent) {
    const financedAmount = Math.max(0, vehiclePrice - downPayment);
    const n = parseInt(termMonths, 10);
    const i = parseFloat(monthlyRatePercent) / 100;

    if (financedAmount <= 0) {
      return {
        financedAmount: 0,
        monthlyInstallment: 0,
        totalInstallments: 0,
        totalInterest: 0,
        totalCost: vehiclePrice,
        termMonths: n,
        downPayment: vehiclePrice
      };
    }

    if (i <= 0) {
      const installment = financedAmount / n;
      return {
        financedAmount,
        monthlyInstallment: installment,
        totalInstallments: financedAmount,
        totalInterest: 0,
        totalCost: vehiclePrice,
        termMonths: n,
        downPayment
      };
    }

    // Fórmula Price
    const factor = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const monthlyInstallment = financedAmount * factor;
    const totalInstallments = monthlyInstallment * n;
    const totalInterest = totalInstallments - financedAmount;
    const totalCost = downPayment + totalInstallments;

    return {
      financedAmount,
      monthlyInstallment,
      totalInstallments,
      totalInterest,
      totalCost,
      termMonths: n,
      downPayment
    };
  }

  /**
   * Formata número para Moeda Brasileira (R$ 0.000,00)
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }
}

window.CarFinancingCalculator = CarFinancingCalculator;
