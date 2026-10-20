import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { gerarFonte } from '../scripts/gerar.mjs';
import { alvoToque, coresDoTema, degrades, margemLateral, sombraDoTema, tokens } from './index';

describe('tokens gerados', () => {
  it('estão em dia com design-system/ (rode npm run tokens se falhar)', () => {
    const atual = readFileSync(resolve(__dirname, 'gerado.ts'), 'utf8');
    expect(atual).toBe(gerarFonte());
  });

  it('têm as cores principais nos dois temas', () => {
    expect(coresDoTema('claro').primary).toBe('#9A5A50');
    expect(coresDoTema('escuro').primary).toBe('#E3A79C');
    expect(coresDoTema('claro').onPrimaryContainer).toBe('#5A2A23');
    expect(Object.keys(coresDoTema('claro'))).toEqual(Object.keys(coresDoTema('escuro')));
  });

  it('convertem espaços, raios e tamanhos para números', () => {
    expect(tokens.espacos.space4).toBe(16);
    expect(tokens.raios.radiusFull).toBe(999);
    expect(tokens.raios.radiusIcon).toBeCloseTo(0.225);
    expect(tokens.tamanhos.buttonHeight).toBe(52);
  });

  it('seguem as regras de plataforma do guia', () => {
    expect(margemLateral('ios')).toBe(20);
    expect(margemLateral('android')).toBe(16);
    expect(alvoToque('ios')).toBe(44);
    expect(alvoToque('android')).toBe(48);
  });

  it('têm a tipografia das duas plataformas e da marca', () => {
    expect(tokens.tipografia.ios.largeTitle).toMatchObject({ fontSize: 34, lineHeight: 41, fontWeight: '700' });
    expect(tokens.tipografia.android.labelLarge).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '500' });
    expect(tokens.tipografia.marca.logoWordmark).toMatchObject({ fontSize: 60, lineHeight: 60, familia: 'logo' });
  });

  it('não têm sombra de cartão no tema escuro', () => {
    expect(sombraDoTema('claro', 'shadowCard')).toContain('rgba(45,31,28,0.08)');
    expect(sombraDoTema('escuro', 'shadowCard')).toBeNull();
  });

  it('leem os três degradês de tokens.css', () => {
    expect(degrades.gradientSplash.angulo).toBe(165);
    expect(degrades.gradientSplash.paradas.map((p) => p.cor)).toEqual([
      'brandBlush',
      'brandRoseStrong',
      'brandWine',
      'brandWineDeep',
    ]);
    expect(degrades.gradientIcon.brilho).toMatchObject({ centroX: 0.28, centroY: 0.18, raio: 0.55 });
    expect(degrades.gradientOnboarding.paradas[1]).toEqual({ cor: 'primaryContainer', posicao: 0.55 });
    for (const d of Object.values(degrades)) {
      for (const p of d.paradas) expect(coresDoTema('claro')[p.cor]).toBeDefined();
    }
  });
});
