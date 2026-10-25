import { BLOQUEIO_MS, JANELA_MS, limpar, minutosRestantes, registrarFalha, situacao, type Tentativas } from '../src/servicos/bloqueioLogin';

const EMAIL = 'Ana@Email.com';
const T0 = 1_000_000;

function falhar(vezes: number, inicio = T0, intervalo = 1000) {
  let t: Tentativas = {};
  for (let i = 0; i < vezes; i++) t = registrarFalha(t, EMAIL, inicio + i * intervalo);
  return t;
}

describe('bloqueio de login (T04)', () => {
  it('não bloqueia até a 4ª tentativa errada', () => {
    expect(situacao(falhar(4), EMAIL, T0 + 5000).bloqueado).toBe(false);
  });

  it('bloqueia por 15 minutos na 5ª tentativa errada dentro de 15 minutos', () => {
    const t = falhar(5);
    const quinta = T0 + 4000;
    expect(situacao(t, EMAIL, quinta + 1)).toEqual({ bloqueado: true, ate: quinta + BLOQUEIO_MS });
    expect(situacao(t, EMAIL, quinta + BLOQUEIO_MS + 1).bloqueado).toBe(false);
  });

  it('tentativas fora da janela de 15 minutos não contam', () => {
    let t: Tentativas = falhar(4);
    t = registrarFalha(t, EMAIL, T0 + JANELA_MS + 10_000);
    expect(situacao(t, EMAIL, T0 + JANELA_MS + 10_001).bloqueado).toBe(false);
  });

  it('conta por e-mail, sem diferenciar maiúsculas e espaços', () => {
    const t = falhar(5);
    expect(situacao(t, '  ana@email.com ', T0 + 5000).bloqueado).toBe(true);
    expect(situacao(t, 'pedro@email.com', T0 + 5000).bloqueado).toBe(false);
  });

  it('login certo zera o contador', () => {
    let t = falhar(4);
    t = limpar(t, 'ana@email.com');
    t = registrarFalha(t, EMAIL, T0 + 10_000);
    expect(situacao(t, EMAIL, T0 + 10_001).bloqueado).toBe(false);
  });

  it('mostra os minutos restantes arredondados para cima', () => {
    expect(minutosRestantes(T0 + BLOQUEIO_MS, T0)).toBe(15);
    expect(minutosRestantes(T0 + 61_000, T0)).toBe(2);
    expect(minutosRestantes(T0 + 500, T0)).toBe(1);
  });
});
