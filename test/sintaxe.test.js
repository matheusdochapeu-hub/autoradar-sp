import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Sintaxe: todo arquivo de js/ compila sem SyntaxError', () => {
  const jsDir = path.join(rootDir, 'js');
  assert.ok(fs.existsSync(jsDir), 'A pasta js/ deve existir.');

  const arquivos = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
  assert.ok(arquivos.length >= 3, `Esperado ao menos 3 módulos em js/, encontrado ${arquivos.length}.`);

  for (const arquivo of arquivos) {
    assert.doesNotThrow(
      () => execFileSync(process.execPath, ['--check', path.join(jsDir, arquivo)], { stdio: 'pipe' }),
      `js/${arquivo} deve compilar sem erro de sintaxe.`
    );
  }
});

test('Sintaxe: sw.js compila sem erro', () => {
  assert.doesNotThrow(
    () => execFileSync(process.execPath, ['--check', path.join(rootDir, 'sw.js')], { stdio: 'pipe' }),
    'sw.js deve compilar sem erro de sintaxe.'
  );
});

test('Catálogo: data/cars.json é JSON válido e não está vazio', () => {
  const caminho = path.join(rootDir, 'data', 'cars.json');
  assert.ok(fs.existsSync(caminho), 'data/cars.json deve existir.');

  const bruto = fs.readFileSync(caminho, 'utf8');
  let dados;
  assert.doesNotThrow(() => {
    dados = JSON.parse(bruto);
  }, 'data/cars.json deve ser um JSON válido.');

  const lista = Array.isArray(dados) ? dados : dados.carros || dados.veiculos || dados.cars;
  assert.ok(Array.isArray(lista), 'O catálogo deve ser uma lista (ou conter uma chave de lista).');
  assert.ok(lista.length > 0, 'O catálogo não pode estar vazio.');
});
