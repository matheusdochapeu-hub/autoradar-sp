import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCatalog, syncToSource } from '../scripts/sync-fallback.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'cars.json'), 'utf8'));
const cars = db.cars || [];

const TIER_MAX = { '60k': 60000, '70k': 70000, '80k': 80000, '100k': 100000, '120k': 120000, '140k': 140000, '160k': 160000 };

test('Catálogo: metadata e lista de carros existem', () => {
  assert.ok(Array.isArray(cars) && cars.length > 0, 'data/cars.json precisa ter uma lista de carros.');
  assert.equal(db.metadata?.totalCars, cars.length, 'metadata.totalCars deve bater com a quantidade real.');
  assert.ok(db.metadata?.lastUpdated, 'metadata.lastUpdated precisa existir (a UI mostra essa data).');
});

test('Catálogo: ids únicos e campos obrigatórios', () => {
  const ids = cars.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'Há ids repetidos no catálogo.');

  for (const car of cars) {
    for (const campo of ['id', 'title', 'modelCategory', 'price', 'year', 'km', 'fuel', 'dealer', 'specs', 'financing']) {
      assert.ok(car[campo] !== undefined && car[campo] !== null && car[campo] !== '', `${car.id}: campo "${campo}" ausente.`);
    }
    assert.ok(Number(car.price) > 0, `${car.id}: preço precisa ser positivo.`);
    assert.ok(car.dealer.city, `${car.id}: dealer.city ausente (filtro de região depende dele).`);
  }
});

test('Catálogo: preço, FIPE e texto "vs FIPE" contam a mesma história', () => {
  for (const car of cars) {
    assert.ok(Number(car.fipePrice) > 0, `${car.id}: fipePrice precisa existir.`);

    // Textos numéricos ("+R$ 4.700 vs FIPE") precisam bater com price - fipePrice.
    const numerico = /^([+-])\s*R\$\s*([\d.]+)/.exec(String(car.priceVsFipe || ''));
    if (numerico) {
      const sinal = numerico[1] === '-' ? -1 : 1;
      const informado = sinal * Number(numerico[2].replace(/\./g, ''));
      const real = Number(car.price) - Number(car.fipePrice);
      assert.ok(
        Math.abs(informado - real) <= 1,
        `${car.id}: texto "${car.priceVsFipe}" não bate com price-FIPE (${real}).`
      );
    }
  }
});

test('Catálogo: financiamento segue a Tabela Price em 48x', () => {
  for (const car of cars) {
    const { downPayment: entrada, interestRate: taxa, monthlyInstallment: parcela } = car.financing || {};
    if (!entrada || !taxa || !parcela) continue;

    const financiado = Number(car.price) - Number(entrada);
    const i = Number(taxa) / 100;
    const n = 48;
    const calculada = i > 0 ? financiado * ((i * (1 + i) ** n) / ((1 + i) ** n - 1)) : financiado / n;

    assert.ok(
      Math.abs(calculada - parcela) / parcela <= 0.03,
      `${car.id}: parcela armazenada ${parcela} difere da calculada ${Math.round(calculada)} em mais de 3%.`
    );
  }
});

test('Catálogo: faixa de preço (priceTier) é coerente com o preço', () => {
  for (const car of cars) {
    if (!car.isSuggestion) continue;
    const limite = TIER_MAX[car.priceTier];
    assert.ok(limite, `${car.id}: priceTier inválido (${car.priceTier}).`);
    assert.ok(
      Number(car.price) <= limite,
      `${car.id}: preço ${car.price} não cabe na faixa "${car.priceTier}" (máx ${limite}).`
    );
  }
});

test('Catálogo: links e imagens são https/http', () => {
  for (const car of cars) {
    if (car.listingUrl) {
      assert.match(car.listingUrl, /^https?:\/\//i, `${car.id}: listingUrl inválida.`);
    }
    if (car.image && !/^https?:\/\//i.test(car.image)) {
      const local = path.join(rootDir, car.image.replace(/^\.\//, ''));
      assert.ok(fs.existsSync(local), `${car.id}: imagem local ausente (${car.image}).`);
    }
  }
});

test('Fallback offline de js/data.js espelha data/cars.json', () => {
  const source = fs.readFileSync(path.join(rootDir, 'js', 'data.js'), 'utf8');
  const { changed } = syncToSource(source, readCatalog());
  assert.equal(
    changed,
    false,
    'js/data.js está dessincronizado de data/cars.json. Rode: node scripts/sync-fallback.js'
  );
});

test('Regiões: todo carro cai em uma região conhecida ou em "outras"', () => {
  const src = fs.readFileSync(path.join(rootDir, 'js', 'data.js'), 'utf8');
  const bloco = src.match(/const REGIOES_SP = \[([\s\S]*?)\n\];/);
  assert.ok(bloco, 'REGIOES_SP não encontrado em js/data.js.');

  const cidades = [...bloco[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const semAcento = (s) =>
    String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const cobertas = cars.filter((c) => cidades.some((cid) => semAcento(c.dealer?.city).includes(cid)));
  assert.ok(
    cobertas.length / cars.length >= 0.9,
    `Só ${cobertas.length}/${cars.length} carros têm cidade mapeada em REGIOES_SP.`
  );
});
