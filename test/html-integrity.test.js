import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

const scripts = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map((m) =>
  m[1].replace(/\?.*$/, '')
);
const estilos = Array.from(html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi)).map((m) =>
  m[1].replace(/\?.*$/, '')
);

test('HTML: documento completo e sem tags truncadas', () => {
  assert.match(html, /^<!DOCTYPE html>/i, 'index.html deve começar com <!DOCTYPE html> (sem BOM).');
  assert.match(html, /<\/html>\s*$/i, 'index.html deve fechar </html>.');

  const truncadas = (html.match(/<\/[a-z]{1,2}(?:\s|>|\r?\n)/gi) || [])
    .map((t) => t.trim().toLowerCase())
    .filter(
      (t) =>
        !['</p>', '</b>', '</i>', '</u>', '</a>', '</em>', '</li>', '</td>', '</th>', '</tr>', '</h1>', '</h2>', '</h3>', '</h4>', '</h5>', '</h6>', '</ol>', '</ul>'].includes(t)
    );
  assert.equal(truncadas.length, 0, `Tags suspeitas/truncadas: ${truncadas.join(', ')}`);
});

test('HTML: todos os <script src> e CSS apontam para arquivos existentes', () => {
  assert.ok(scripts.length >= 3, `Esperado ao menos 3 scripts, encontrado ${scripts.length}.`);

  for (const src of [...scripts, ...estilos]) {
    if (/^https?:/i.test(src)) continue;
    assert.ok(fs.existsSync(path.join(rootDir, src)), `"${src}" deve existir no repositório.`);
  }
});

test('HTML: ordem de carregamento preserva as dependências', () => {
  const pos = (nome) => scripts.findIndex((s) => s.endsWith(nome));

  const dados = pos('js/data.js');
  const app = pos('js/app.js');
  assert.ok(dados >= 0, 'js/data.js precisa ser carregado.');
  assert.ok(app >= 0, 'js/app.js precisa ser carregado.');
  assert.ok(dados < app, 'js/data.js deve vir antes de js/app.js (app lê o catálogo).');

  const financiamento = pos('js/financing.js');
  if (financiamento >= 0) {
    assert.ok(financiamento < app, 'js/financing.js deve vir antes de js/app.js.');
  }
});

test('HTML: versionamento ?v= é uniforme nos assets', () => {
  const versoes = Array.from(html.matchAll(/\?v=(\d+)/g)).map((m) => m[1]);
  assert.ok(versoes.length > 0, 'Os assets devem usar cache-busting ?v=.');

  const distintas = [...new Set(versoes)];
  assert.equal(
    distintas.length,
    1,
    `Todos os assets devem compartilhar a mesma versão ?v=; encontrado: ${distintas.join(', ')}.`
  );
});

test('HTML: nenhum módulo de js/ ficou órfão', () => {
  const emDisco = fs
    .readdirSync(path.join(rootDir, 'js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `js/${f}`);

  const orfaos = emDisco.filter((a) => !scripts.includes(a));
  assert.equal(orfaos.length, 0, `Módulos que existem mas não são carregados: ${orfaos.join(', ')}`);
});
