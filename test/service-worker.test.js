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

test('Service Worker: fotos do catálogo referenciadas existem', () => {
  const fotos = assets.filter((a) => a.startsWith('./img/'));
  assert.ok(fotos.length > 0, 'O precache deve incluir as fotos dos carros.');

  const ausentes = fotos.filter((f) => !fs.existsSync(path.join(rootDir, f.replace(/^\.\//, ''))));
  assert.equal(ausentes.length, 0, `Fotos ausentes: ${ausentes.join(', ')}`);
});
