import React from 'react';
import type { NomeCor } from '@lartie/tokens';
import type { NomeIcone } from '../componentes/Icone';
import { TelaEstado, type AcaoEstado } from './TelaEstado';

// Estados vazios das listas (T60 a T63). Textos exatos dos protótipos; cada etapa liga as ações.
export type TipoVazio = 'presentes' | 'convidados' | 'fornecedores' | 'notificacoes';

const VAZIOS: Record<TipoVazio, { icone: NomeIcone; fundo: NomeCor; cor: NomeCor; titulo: string; texto: string }> = {
  // T60
  presentes: {
    icone: 'presentes',
    fundo: 'infoContainer',
    cor: 'info',
    titulo: 'Nenhuma lista de presentes ainda',
    texto: 'Criem uma lista para o chá de panela ou para o casamento e enviem o link para a família.',
  },
  // T61
  convidados: {
    icone: 'convidados',
    fundo: 'primaryContainer',
    cor: 'primary',
    titulo: 'Ainda não há convidados',
    texto: 'Importem da agenda ou adicionem por grupo, como "Família Souza". Depois é só enviar o RSVP.',
  },
  // T62
  fornecedores: {
    icone: 'lista',
    fundo: 'primaryContainer',
    cor: 'primary',
    titulo: 'Nenhum fornecedor por aqui',
    texto: 'Guardem os orçamentos que receberem para comparar preços e acompanhar as parcelas.',
  },
  // T63
  notificacoes: {
    icone: 'checkCirculo',
    fundo: 'successContainer',
    cor: 'success',
    titulo: 'Tudo em dia',
    texto: 'Quando houver prazos, parcelas ou novas reservas, vocês veem aqui.',
  },
};

/** Rótulos dos botões de cada estado vazio, como nos protótipos. */
export const ACOES_VAZIO = {
  presentes: { principal: 'Criar primeira lista' },
  convidados: { principal: 'Importar da agenda', secundaria: 'Adicionar grupo' },
  fornecedores: { principal: 'Adicionar fornecedor' },
  notificacoes: { principal: 'Voltar ao início' },
} as const;

interface Props {
  tipo: TipoVazio;
  onPrincipal: () => void;
  onSecundaria?: () => void;
}

export function EstadoVazio({ tipo, onPrincipal, onSecundaria }: Props) {
  const v = VAZIOS[tipo];
  const rotulos: { principal: string; secundaria?: string } = ACOES_VAZIO[tipo];
  const principal: AcaoEstado = { rotulo: rotulos.principal, onPress: onPrincipal };
  const secundaria: AcaoEstado | undefined =
    rotulos.secundaria && onSecundaria ? { rotulo: rotulos.secundaria, onPress: onSecundaria } : undefined;
  return (
    <TelaEstado
      icone={v.icone}
      fundoIcone={v.fundo}
      corIcone={v.cor}
      titulo={v.titulo}
      texto={v.texto}
      principal={principal}
      secundaria={secundaria}
      embutido
    />
  );
}
