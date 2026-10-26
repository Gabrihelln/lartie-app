import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CatalogoCategorias, CatalogoClima, CatalogoEnxoval, CatalogoTarefas } from '@lartie/regras';

// Catálogos de dados/ (carga do plano). Lidos uma vez na subida da API. Na VPS, a pasta dados/
// vem junto com o código; DADOS_DIR permite apontar para outra.
const aqui = dirname(fileURLToPath(import.meta.url));
const pasta = process.env.DADOS_DIR ?? resolve(aqui, '../../dados');

const ler = <T>(arquivo: string): T => JSON.parse(readFileSync(resolve(pasta, arquivo), 'utf8')) as T;

export const catalogos = {
  tarefas: ler<CatalogoTarefas>('catalogo-tarefas.json'),
  enxoval: ler<CatalogoEnxoval>('catalogo-enxoval.json'),
  clima: ler<CatalogoClima>('clima-por-cidade.json'),
  categorias: ler<CatalogoCategorias>('categorias.json'),
};
