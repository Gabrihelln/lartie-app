// Casa nova (Etapa 4): estados do item, cômodo completo, encaixe e medidas (T18 a T21, T55).
import type { EstadoItem, FaseItem } from '@lartie/modelo';
import type { CatalogoEnxoval, Clima } from './catalogos';
import { gerarEnxoval, type DadosEnxoval } from './enxoval';
import { progressoCasa, type ItemBase } from './progresso';

/** Descrição de cada filtro de fase do T18 (Casa.dc.html). */
export const DESCRICAO_FASE: Record<FaseItem | 'todas', string> = {
  todas: 'Todos os itens, de todas as fases.',
  primeira_noite: 'O mínimo para dormir na casa nova.',
  primeiro_mes: 'O restante do uso diário.',
  com_calma: 'Decoração e itens de desejo.',
};

export const ROTULO_ESTADO: Record<EstadoItem, string> = { falta: 'Falta', ja_tenho: 'Já tenho', na_lista: 'Na lista' };

/** Botão de estado do T19: Falta → Já tenho → Na lista → Falta. */
export function proximoEstado(estado: EstadoItem): EstadoItem {
  return estado === 'falta' ? 'ja_tenho' : estado === 'ja_tenho' ? 'na_lista' : 'falta';
}

/** Selo "Completo" (T18) e T55: todos os itens do cômodo (na fase filtrada) estão "Já tenho". */
export function comodoCompleto(itensDoComodo: readonly ItemBase[], fase?: FaseItem): boolean {
  const c = progressoCasa(itensDoComodo, fase);
  return c.total > 0 && c.feitos === c.total;
}

/** "da cozinha", "do quarto", "dos pets" (T35, T55). */
export function doComodo(nome: string): string {
  const n = nome.trim().toLocaleLowerCase('pt-BR');
  if (/^(quarto|banheiro|escritório|lavabo|closet|quintal|jardim)/.test(n)) return `do ${n}`;
  if (/^pets/.test(n)) return `dos ${n}`;
  if (/^(cozinha|sala|lavanderia|limpeza|varanda|área|copa|garagem|despensa)/.test(n)) return `da ${n}`;
  return `de ${nome.trim()}`;
}

/** "Item salvo na Cozinha" / "no Quarto" / "em Pets" (T20). */
export function emComodo(nome: string): string {
  const d = doComodo(nome);
  const n = nome.trim();
  if (d.startsWith('do ')) return `no ${n}`;
  if (d.startsWith('dos ')) return `nos ${n}`;
  if (d.startsWith('da ')) return `na ${n}`;
  return `em ${n}`;
}

/** T55: "{Cômodo} completo!" (CelebracaoComodo.dc.html). */
export function textoCelebracaoComodo(nome: string, itens: number, comodosFaltando: number) {
  const faltam =
    comodosFaltando === 0
      ? 'A casa nova está completa.'
      : comodosFaltando === 1
        ? 'Falta 1 cômodo para a casa ficar completa.'
        : `Faltam ${comodosFaltando} cômodos para a casa ficar completa.`;
  return {
    titulo: `${nome.trim()} completo!`,
    texto: `${itens === 1 ? 'O único item' : `Todos os ${itens} itens`} ${doComodo(nome)} ${itens === 1 ? 'está pronto' : 'estão prontos'}. ${faltam}`,
  };
}

// Medidas (T20, T21) -------------------------------------------------------------------------

/** "4,20" → 4.2. Vírgula ou ponto decimal; null se vazio ou inválido. */
export function lerMetros(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** 4.2 → "4,20". */
export function formatarMetros(m: number): string {
  return m.toFixed(2).replace('.', ',');
}

/** T21: medidas do cômodo entre 0,5 e 30 m. */
export function validarMedidaComodo(m: number | null): string | null {
  if (m === null) return null;
  return m >= 0.5 && m <= 30 ? null : 'Use um valor entre 0,5 e 30 m.';
}

/** "Parede da TV" → "na parede da TV"; "Espaço da geladeira" → "no espaço da geladeira". */
function naParede(nome: string): string {
  const n = nome.trim();
  const minusculo = n.charAt(0).toLocaleLowerCase('pt-BR') + n.slice(1);
  return /^(parede|bancada|janela|área)/i.test(n) ? `na ${minusculo}` : `no ${minusculo}`;
}

export interface Encaixe {
  cabe: boolean;
  /** Largura livre da parede, em cm. */
  livresCm: number;
  /** T20: "Cabe no espaço da geladeira (75 cm livres)" / "Não cabe: Sofá tem 240 cm e Parede do sofá tem 220 cm livres". */
  texto: string;
  /** T21: "Sofá de 2,40 m não cabe na parede do sofá, que tem 2,20 m livres." */
  alerta: string | null;
}

/** Checagem de encaixe pela largura do item e a largura livre da parede de destino. */
export function checarEncaixe(item: { nome: string; largura_cm: number | null }, parede: { nome: string; largura_m: number } | null): Encaixe | null {
  if (!parede || !item.largura_cm) return null;
  const livresCm = Math.round(parede.largura_m * 100);
  const cabe = item.largura_cm <= livresCm;
  return {
    cabe,
    livresCm,
    texto: cabe
      ? `Cabe ${naParede(parede.nome)} (${livresCm} cm livres)`
      : `Não cabe: ${item.nome.trim()} tem ${item.largura_cm} cm e ${parede.nome.trim()} tem ${livresCm} cm livres`,
    alerta: cabe
      ? null
      : `${item.nome.trim()} de ${formatarMetros(item.largura_cm / 100)} m não cabe ${naParede(parede.nome)}, que tem ${formatarMetros(parede.largura_m)} m livres.`,
  };
}

/** T21 "% ocupado": soma das áreas dos móveis com medidas / área do cômodo. */
export function percentualOcupado(
  comodo: { largura_m: number | null; comprimento_m: number | null },
  itens: readonly { medidas: { largura_cm: number | null; profundidade_cm: number | null } | null; quantidade: number }[],
): number | null {
  if (!comodo.largura_m || !comodo.comprimento_m) return null;
  const area = comodo.largura_m * comodo.comprimento_m * 10_000;
  const ocupado = itens.reduce((s, i) => s + (i.medidas?.largura_cm ?? 0) * (i.medidas?.profundidade_cm ?? 0) * Math.max(1, i.quantidade), 0);
  return Math.round((ocupado / area) * 100);
}

// Perfil › Dados da casa nova (13.2) -------------------------------------------------------------

/**
 * Mudar os dados da casa nunca apaga itens; pode sugerir cômodos novos (ex.: mais um quarto ou
 * pets) com os itens do catálogo. Devolve só o que ainda não existe, pelos ids estáveis do plano.
 */
export function sugerirNovosComodos(
  dados: Omit<DadosEnxoval, 'clima'> & { clima: Clima },
  existentes: { comodos: readonly string[] },
  catalogo: CatalogoEnxoval,
) {
  const { comodos, itens } = gerarEnxoval(dados, catalogo);
  const ja = new Set(existentes.comodos);
  const novos = comodos.filter((c) => !ja.has(c.id));
  const ids = new Set(novos.map((c) => c.id));
  return { comodos: novos, itens: itens.filter((i) => ids.has(i.comodo_id)) };
}

/** Nomes sugeridos na folha "+ Novo cômodo" do T18. */
export const SUGESTOES_COMODO = ['Escritório', 'Varanda', 'Quarto de hóspedes'] as const;
