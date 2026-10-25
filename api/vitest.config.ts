import { defineConfig } from 'vitest/config';

// Os testes da API usam os mesmos emuladores e limpam os dados antes de cada teste:
// um arquivo por vez, para um não apagar os dados do outro.
export default defineConfig({
  test: { fileParallelism: false },
});
