import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

const cacheName = sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? null;
const lista = sw.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
const assets = lista
  ? Array.from(lista[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1])
  : [];

test('Service Worker: CACHE_NAME segue o padrão autoradar-sp-vN', () => {
  assert.ok(cacheName, 'sw.js deve declarar `const CACHE_NAME`.');
  assert.match(
    cacheName,
    /^autoradar-sp-v\d+$/,
    `CACHE_NAME deve ser autoradar-sp-vN (encontrado: ${cacheName}).`
  );
});

test('Service Worker: todo asset precacheado existe no repositório', () => {
  assert.ok(assets.length >= 10, `Esperado ao menos 10 assets, encontrado ${assets.length}.`);

  const ausentes = assets.filter((a) => {
    if (a === './' || a === '.') return false;
    return !fs.existsSync(path.join(rootDir, a.replace(/^\.\//, '')));
  });

  assert.equal(ausentes.length, 0, `Assets precacheados inexistentes: ${ausentes.join(', ')}`);
});

test('Service Worker: sem duplicatas no precache', () => {
  const duplicados = assets.filter((a, i) => assets.indexOf(a) !== i);
  assert.equal(duplicados.length, 0, `Assets duplicados: ${[...new Set(duplicados)].join(', ')}`);
});

test('Service Worker: todo script do index.html está precacheado', () => {
  const scriptsDoHtml = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi))
    .map((m) => m[1].replace(/\?.*$/, ''))
    .filter((s) => !/^https?:/i.test(s));

  const normalizados = assets.map((a) => a.replace(/^\.\//, ''));
  const fora = scriptsDoHtml.filter((s) => !normalizados.includes(s));

  assert.equal(fora.length, 0, `Scripts fora do precache (faltariam offline): ${fora.join(', ')}`);
});

test('Service Worker: fotos locais do catálogo estão precacheadas', () => {
  const db = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'cars.json'), 'utf8'));
  const locais = (db.cars || [])
    .map((c) => c.image || '')
    .filter((img) => /^(\.\/)?img\//i.test(img))
    .map((img) => `./${img.replace(/^\.\//, '')}`);

  if (locais.length === 0) {
    // O catálogo atual usa fotos externas dos anúncios: nada a precachear aqui.
    assert.ok(assets.some((a) => a.includes('icons/')), 'O precache deve manter os ícones do PWA.');
    return;
  }

  const normalizados = assets.map((a) => a.replace(/^\.\//, ''));
  const fora = locais.filter((img) => !normalizados.includes(img.replace(/^\.\//, '')));
  assert.equal(fora.length, 0, `Fotos locais fora do precache: ${fora.join(', ')}`);
});

test('Service Worker: versão do cache combina com o ?v= e o APP_VER do HTML', () => {
  const versoes = [...new Set(Array.from(html.matchAll(/\?v=(\d+)/g)).map((m) => m[1]))];
  assert.equal(versoes.length, 1, `O HTML deve ter uma única versão de asset (encontrado: ${versoes.join(', ')}).`);

  const versaoHtml = versoes[0];
  const versaoCache = String(cacheName).replace('autoradar-sp-v', '');
  assert.equal(
    versaoCache,
    versaoHtml,
    `CACHE_NAME (${cacheName}) e os assets (?v=${versaoHtml}) precisam ter a mesma versão.`
  );

  const appVer = /const\s+APP_VER\s*=\s*['"]([^'"]+)['"]/.exec(html)?.[1];
  assert.equal(
    appVer,
    `autoradar-sp-v${versaoHtml}`,
    'A constante APP_VER do index.html precisa acompanhar a versão do cache.'
  );
});
