import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogoTarefas } from './catalogos';
import { gerarTarefasMudanca, prazoDaMudanca } from './mudanca';

const catalogo: CatalogoTarefas = JSON.parse(readFileSync(resolve(__dirname, '../../../dados/catalogo-tarefas.json'), 'utf8'));

describe('P04 tarefas da mudança', () => {
  it('imóvel alugado inclui vistoria e contrato; próprio não', () => {
    const alugado = gerarTarefasMudanca(catalogo, { posse: 'alugado' });
    const proprio = gerarTarefasMudanca(catalogo, { posse: 'proprio' });
    expect(alugado.map((t) => t.id)).toEqual(expect.arrayContaining(['M001', 'M002', 'M003']));
    expect(proprio.map((t) => t.id)).not.toContain('M001');
    expect(proprio.map((t) => t.id)).toContain('M003');
    // Ordem: o que vence antes primeiro.
    expect(alugado[0]!.dias_antes).toBeGreaterThanOrEqual(alugado[alugado.length - 1]!.dias_antes);
  });

  it('prazo relativo à data da mudança', () => {
    expect(prazoDaMudanca(30, '2027-05')).toBe('até 01/04');
    expect(prazoDaMudanca(0, '2027-05')).toBe('até 01/05');
    expect(prazoDaMudanca(15, null)).toBe('15 dias antes da mudança');
    expect(prazoDaMudanca(0, null)).toBe('no dia da mudança');
    expect(prazoDaMudanca(null, '2027-05')).toBeNull();
  });
});
