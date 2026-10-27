import { resolve } from 'node:path';
import type { NextConfig } from 'next';

// Página do convidado (T25, T26, T40, T51, T52). Os dados vêm da API do Lartiê (API_URL); o navegador
// fala só com esta web, que repassa as chamadas para a API (sem CORS e sem expor o endereço interno).
const config: NextConfig = {
  transpilePackages: ['@lartie/regras', '@lartie/modelo'],
  turbopack: { root: resolve(__dirname, '..') },
  poweredByHeader: false,
};

export default config;
