import React from 'react';
import type { NomeCor } from '@lartie/tokens';
import type { NomeIcone } from '../componentes/Icone';
import { TelaEstado } from './TelaEstado';

// Telas de explicação antes do pedido nativo de permissão (T57 a T59, especificação 2.5).
// Quem usa: chama `onPermitir` (que faz o pedido nativo) ou `onAgoraNao`.
export type TipoPermissao = 'notificacoes' | 'camera' | 'contatos';

const PERMISSOES: Record<
  TipoPermissao,
  { icone: NomeIcone; fundo: NomeCor; cor: NomeCor; titulo: string; texto: string; permitir: string; recusar: string }
> = {
  // T57
  notificacoes: {
    icone: 'notificacoes',
    fundo: 'primaryContainer',
    cor: 'primary',
    titulo: 'Lembretes na hora certa',
    texto: 'Avisamos quando um prazo do casamento se aproxima, uma parcela vai vencer ou alguém reserva um presente.',
    permitir: 'Ativar notificações',
    recusar: 'Agora não',
  },
  // T58 (o texto cita a assistente; o cadastro por foto está fora do escopo atual, P14)
  camera: {
    icone: 'camera',
    fundo: 'homeContainer',
    cor: 'home',
    titulo: 'Cadastre itens com uma foto',
    texto: 'Fotografe o item ou a nota fiscal e a assistente preenche nome, cômodo e valor para vocês.',
    permitir: 'Permitir câmera',
    recusar: 'Agora não',
  },
  // T59
  contatos: {
    icone: 'contatos',
    fundo: 'primaryContainer',
    cor: 'primary',
    titulo: 'Importe os convidados da agenda',
    texto: 'Escolham quem convidar a partir dos contatos do celular. Nada é enviado sem vocês confirmarem.',
    permitir: 'Permitir contatos',
    recusar: 'Adicionar à mão',
  },
};

interface Props {
  tipo: TipoPermissao;
  onPermitir: () => void | Promise<unknown>;
  onAgoraNao: () => void;
}

export function ExplicacaoPermissao({ tipo, onPermitir, onAgoraNao }: Props) {
  const p = PERMISSOES[tipo];
  return (
    <TelaEstado
      icone={p.icone}
      fundoIcone={p.fundo}
      corIcone={p.cor}
      titulo={p.titulo}
      texto={p.texto}
      principal={{ rotulo: p.permitir, onPress: onPermitir }}
      secundaria={{ rotulo: p.recusar, onPress: onAgoraNao }}
    />
  );
}
