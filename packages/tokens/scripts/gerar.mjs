// Gera src/gerado.ts a partir do design system. Rode depois de mudar design-system/tokens.json ou tokens.css:
//   npm run tokens
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converter } from './converter.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../..');

export function gerarFonte() {
  const json = JSON.parse(readFileSync(resolve(raiz, 'design-system/tokens.json'), 'utf8'));
  const css = readFileSync(resolve(raiz, 'design-system/tokens.css'), 'utf8');
  const dados = converter(json, css);
  return (
    '// Arquivo gerado por packages/tokens/scripts/gerar.mjs a partir de design-system/. Não edite à mão.\n\n' +
    `export const tokens = ${JSON.stringify(dados, null, 2)} as const;\n`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(resolve(aqui, '../src/gerado.ts'), gerarFonte());
  console.log('Tokens gerados em packages/tokens/src/gerado.ts');
}
