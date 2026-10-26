import React, { type FC } from 'react';
import Svg, { Circle, type SvgProps } from 'react-native-svg';
import { tamanhos } from '@lartie/tokens';

import Adicionar from '@material-symbols/svg-400/rounded/add.svg';
import Aviso from '@material-symbols/svg-400/rounded/warning.svg';
import Camera from '@material-symbols/svg-400/rounded/photo_camera.svg';
import Casa from '@material-symbols/svg-400/rounded/weekend.svg';
import CasaCheia from '@material-symbols/svg-400/rounded/weekend-fill.svg';
import Celebracao from '@material-symbols/svg-400/rounded/celebration.svg';
import Check from '@material-symbols/svg-400/rounded/check.svg';
import CheckCirculo from '@material-symbols/svg-400/rounded/check_circle.svg';
import Chat from '@material-symbols/svg-400/rounded/chat.svg';
import Contatos from '@material-symbols/svg-400/rounded/contacts.svg';
import Convidados from '@material-symbols/svg-400/rounded/group.svg';
import ConvidadosCheio from '@material-symbols/svg-400/rounded/group-fill.svg';
import Erro from '@material-symbols/svg-400/rounded/error.svg';
import Evento from '@material-symbols/svg-400/rounded/event.svg';
import Excluir from '@material-symbols/svg-400/rounded/delete.svg';
import Fechar from '@material-symbols/svg-400/rounded/close.svg';
import Info from '@material-symbols/svg-400/rounded/info.svg';
import Clima from '@material-symbols/svg-400/rounded/light_mode.svg';
import Coracao from '@material-symbols/svg-400/rounded/favorite.svg';
import Email from '@material-symbols/svg-400/rounded/mail.svg';
import Mostrar from '@material-symbols/svg-400/rounded/visibility.svg';
import Ocultar from '@material-symbols/svg-400/rounded/visibility_off.svg';
import CaixaMarcada from '@material-symbols/svg-400/rounded/check_box-fill.svg';
import CaixaVazia from '@material-symbols/svg-400/rounded/check_box_outline_blank.svg';
import Inicio from '@material-symbols/svg-400/rounded/home.svg';
import InicioCheio from '@material-symbols/svg-400/rounded/home-fill.svg';
import Lista from '@material-symbols/svg-400/rounded/checklist.svg';
import Notificacoes from '@material-symbols/svg-400/rounded/notifications.svg';
import Perfil from '@material-symbols/svg-400/rounded/person.svg';
import PerfilCheio from '@material-symbols/svg-400/rounded/person-fill.svg';
import Presentes from '@material-symbols/svg-400/rounded/redeem.svg';
import PresentesCheio from '@material-symbols/svg-400/rounded/redeem-fill.svg';
import SemConexao from '@material-symbols/svg-400/rounded/wifi_off.svg';
import SetaDireita from '@material-symbols/svg-400/rounded/chevron_right.svg';
import SetaEsquerda from '@material-symbols/svg-400/rounded/chevron_left.svg';
import Voltar from '@material-symbols/svg-400/rounded/arrow_back.svg';

// Ícones do app. O guia pede SF Symbols no iOS e Material Symbols Rounded no Android; nesta etapa
// os dois sistemas usam Material Symbols Rounded (peso 400). A coluna `sf` guarda o equivalente
// em SF Symbols para a troca no iOS sem mudar as telas (registrado no relatório da Etapa 0).

/** Alianças: o Material Symbols não tem; desenho do protótipo (duas alianças, traço 2). */
const Aliancas: FC<SvgProps> = ({ fill, ...props }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={fill as string} strokeWidth={2} {...props}>
    <Circle cx={9} cy={14} r={6} />
    <Circle cx={15} cy={14} r={6} />
  </Svg>
);

const AliancasCheias: FC<SvgProps> = ({ fill, ...props }) => (
  <Svg viewBox="0 0 24 24" fill="none" stroke={fill as string} strokeWidth={2.6} {...props}>
    <Circle cx={9} cy={14} r={6} />
    <Circle cx={15} cy={14} r={6} />
  </Svg>
);

const ICONES = {
  inicio: { normal: Inicio, cheio: InicioCheio, sf: 'house' },
  casamento: { normal: Aliancas, cheio: AliancasCheias, sf: 'circle.circle' },
  convidados: { normal: Convidados, cheio: ConvidadosCheio, sf: 'person.2' },
  casa: { normal: Casa, cheio: CasaCheia, sf: 'sofa' },
  presentes: { normal: Presentes, cheio: PresentesCheio, sf: 'gift' },
  perfil: { normal: Perfil, cheio: PerfilCheio, sf: 'person' },
  adicionar: { normal: Adicionar, sf: 'plus' },
  aviso: { normal: Aviso, sf: 'exclamationmark.triangle' },
  camera: { normal: Camera, sf: 'camera' },
  celebracao: { normal: Celebracao, sf: 'party.popper' },
  check: { normal: Check, sf: 'checkmark' },
  checkCirculo: { normal: CheckCirculo, sf: 'checkmark.circle' },
  assistente: { normal: Chat, sf: 'bubble.left' },
  contatos: { normal: Contatos, sf: 'person.crop.circle' },
  erro: { normal: Erro, sf: 'exclamationmark.circle' },
  evento: { normal: Evento, sf: 'calendar' },
  excluir: { normal: Excluir, sf: 'trash' },
  fechar: { normal: Fechar, sf: 'xmark' },
  info: { normal: Info, sf: 'info.circle' },
  clima: { normal: Clima, sf: 'sun.max' },
  coracao: { normal: Coracao, sf: 'heart' },
  email: { normal: Email, sf: 'envelope' },
  mostrar: { normal: Mostrar, sf: 'eye' },
  ocultar: { normal: Ocultar, sf: 'eye.slash' },
  caixaMarcada: { normal: CaixaMarcada, sf: 'checkmark.square.fill' },
  caixaVazia: { normal: CaixaVazia, sf: 'square' },
  lista: { normal: Lista, sf: 'checklist' },
  notificacoes: { normal: Notificacoes, sf: 'bell' },
  semConexao: { normal: SemConexao, sf: 'wifi.slash' },
  setaDireita: { normal: SetaDireita, sf: 'chevron.right' },
  setaEsquerda: { normal: SetaEsquerda, sf: 'chevron.left' },
  voltar: { normal: Voltar, sf: 'arrow.left' },
} as const satisfies Record<string, { normal: FC<SvgProps>; cheio?: FC<SvgProps>; sf: string }>;

export type NomeIcone = keyof typeof ICONES;

interface Props {
  nome: NomeIcone;
  cor: string;
  tamanho?: number;
  /** Versão preenchida (aba ativa). */
  cheio?: boolean;
}

export function Icone({ nome, cor, tamanho = tamanhos.iconUi, cheio = false }: Props) {
  const def: { normal: FC<SvgProps>; cheio?: FC<SvgProps> } = ICONES[nome];
  const Componente = (cheio && def.cheio) || def.normal;
  // Ícones são decorativos para leitores de tela: o rótulo fica no botão que os contém.
  return (
    <Componente
      width={tamanho}
      height={tamanho}
      fill={cor}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
