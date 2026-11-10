#!/usr/bin/env node
/**
 * Verificador de sintaxe do AutoRadar SP.
 *
 * O app é composto de scripts clássicos carregados por <script src>. Um erro
 * de sintaxe em qualquer um derruba a tela inteira, então validamos todos com
 * `node --check` antes de publicar.
 *
 * Uso:  node scripts/check-syntax.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = path.join(rootDir, 'js');

const alvos = [];

if (fs.existsSync(jsDir)) {
  for (const arquivo of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
    alvos.push(path.join(jsDir, arquivo));
  }
}

const sw = path.join(rootDir, 'sw.js');
if (fs.existsSync(sw)) alvos.push(sw);

let falhas = 0;

for (const arquivo of alvos) {
  const relativo = path.relative(rootDir, arquivo);
  try {
    execFileSync(process.execPath, ['--check', arquivo], { stdio: 'pipe' });
    console.log(`  [OK]    ${relativo}`);
  } catch (erro) {
    falhas++;
    console.error(`  [ERRO]  ${relativo}`);
    const saida = (erro.stderr || erro.stdout || '').toString().trim();
    if (saida) console.error(saida.split('\n').map((l) => `          ${l}`).join('\n'));
  }
}

if (alvos.length === 0) {
  console.error('Nenhum arquivo JavaScript encontrado para validar.');
  process.exit(1);
}

console.log(`\n${alvos.length - falhas}/${alvos.length} arquivos sem erro de sintaxe.`);
process.exit(falhas === 0 ? 0 : 1);
