// Copia os tokens do design system (claro e escuro) para a web. A cópia não vai para o git.
import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
copyFileSync(resolve(aqui, '../../design-system/tokens.css'), resolve(aqui, '../app/tokens.css'));
