/**
 * Sincroniza o fallback offline (DEFAULT_CARS_DATABASE em js/data.js)
 * com o catalogo oficial (data/cars.json).
 *
 * Uso: node scripts/sync-fallback.js [--check]
 *   --check  nao escreve nada; falha (exit 1) se o fallback estiver desatualizado.
 *
 * Sem isso os dois arquivos divergem em silencio: o app passa a mostrar
 * precos diferentes quando o fetch de data/cars.json falha (offline).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(rootDir, 'data', 'cars.json');
const jsFile = path.join(rootDir, 'js', 'data.js');
const START = 'const DEFAULT_CARS_DATABASE = ';
const END = '\n];';

export function buildFallbackBlock(cars, eol = '\n') {
  // JSON.stringify ja entrega os colchetes externos: "[\n  {...}\n]".
  const json = JSON.stringify(cars, null, 2).split('\n').join(eol);
  return `${START}${json};`;
}

function eolOf(src) {
  return src.includes('\r\n') ? '\r\n' : '\n';
}

export function readCatalog() {
  const db = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return db.cars || [];
}

function locate(src) {
  const marcador = `${eolOf(src)}];`;
  const ini = src.indexOf(START);
  const fim = src.indexOf(marcador, ini);
  if (ini === -1 || fim === -1) throw new Error('Bloco DEFAULT_CARS_DATABASE nao encontrado em js/data.js');
  return { ini, fim: fim + marcador.length };
}

export function syncToSource(src, cars) {
  const { ini, fim } = locate(src);
  const blocoAntigo = src.slice(ini, fim);
  const blocoNovo = buildFallbackBlock(cars, eolOf(src));
  if (blocoAntigo === blocoNovo) return { changed: false, source: src };
  return { changed: true, source: src.slice(0, ini) + blocoNovo + src.slice(fim) };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const checkOnly = process.argv.includes('--check');
  const cars = readCatalog();
  const src = fs.readFileSync(jsFile, 'utf8');
  const { changed, source } = syncToSource(src, cars);

  if (!changed) {
    console.log(`[OK] fallback de js/data.js ja espelha data/cars.json (${cars.length} carros).`);
    process.exit(0);
  }

  if (checkOnly) {
    console.error(`[FALHA] fallback dessincronizado. Rode: node scripts/sync-fallback.js`);
    process.exit(1);
  }

  fs.writeFileSync(jsFile, source, 'utf8');
  console.log(`[OK] fallback regenerado com ${cars.length} carros em js/data.js.`);
}
