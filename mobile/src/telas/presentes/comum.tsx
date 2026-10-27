import React, { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Svg, { Rect } from 'react-native-svg';
import { create as criarQr } from 'qrcode/lib/core/qrcode';
import { raios, tamanhos } from '@lartie/tokens';
import type { ListaPresentes } from '@lartie/modelo';
import {
  linkDaLista,
  mensagemCompartilhar,
  NOME_OCASIAO,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { Divisoria } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone, type NomeIcone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { registrarEvento } from '../../servicos/analytics';
import { urlWeb, type AvisoConvidado } from '../../servicos/api';
import { espacos, useTema } from '../../tema';

// Peças da lista de presentes: QR code, folha de compartilhar (T65) e a folha que avisa os
// convidados quando o casal cancela reservas (sem serviço de mensagens, o WhatsApp abre pronto).

/** QR code desenhado com react-native-svg (o núcleo do pacote qrcode, sem dependências nativas). */
export function QrCode({ texto, tamanho }: { texto: string; tamanho: number }) {
  const { cores } = useTema();
  const qr = useMemo(
    () => criarQr(texto, { errorCorrectionLevel: 'M' }),
    [texto],
  );
  const n = qr.modules.size;
  const borda = 2;
  const quadrados: React.ReactElement[] = [];
  for (let l = 0; l < n; l++) {
    for (let c = 0; c < n; c++)
      if (qr.modules.get(l, c))
        quadrados.push(
          <Rect
            key={`${l}-${c}`}
            x={c + borda}
            y={l + borda}
            width={1.02}
            height={1.02}
            fill={cores.onSurface}
          />,
        );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`QR code do link ${texto}`}
      style={[estilos.qr, { backgroundColor: cores.surface }]}
    >
      <Svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${n + borda * 2} ${n + borda * 2}`}
      >
        {quadrados}
      </Svg>
    </View>
  );
}

/** Link público da lista: lartie.app/{slug}/{lista} e o endereço que abre neste ambiente. */
export function useLinkDaLista(
  lista: Pick<ListaPresentes, 'slug_lista'> | null | undefined,
) {
  const { casal } = useSessao();
  if (!lista || !casal?.slug) return null;
  return {
    publico: linkDaLista(casal.slug, lista.slug_lista),
    local: urlWeb(`${casal.slug}/${lista.slug_lista}`),
  };
}

function Opcao({
  icone,
  rotulo,
  onPress,
}: {
  icone: NomeIcone;
  rotulo: string;
  onPress: () => void;
}) {
  const { cores, alvoToque } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[estilos.opcao, { minHeight: alvoToque + espacos.space2 }]}
    >
      <View
        style={[estilos.circulo, { backgroundColor: cores.primaryContainer }]}
      >
        <Icone nome={icone} cor={cores.primary} />
      </View>
      <Texto papel="nomeItem" style={estilos.flex}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

/**
 * T65 · Compartilhar lista. O link mostrado é o público (lartie.app/…); em desenvolvimento, sem
 * domínio (P13), "Ver como convidado" abre a página que roda no Mac.
 */
export function FolhaCompartilhar({
  lista,
  visivel,
  onFechar,
}: {
  lista: (ListaPresentes & { id: string }) | null;
  visivel: boolean;
  onFechar: () => void;
}) {
  const { cores } = useTema();
  const { casal } = useSessao();
  const avisos = useAvisos();
  const link = useLinkDaLista(lista);
  const [qr, setQr] = useState(false);
  if (!lista || !link)
    return (
      <FolhaInferior visivel={false} onFechar={onFechar}>
        {null}
      </FolhaInferior>
    );
  const texto = mensagemCompartilhar(lista.ocasiao, `https://${link.publico}`);
  const marcar = (canal: string) =>
    registrarEvento({ nome: 'lista_compartilhada', params: { canal } });
  const nomes = casal?.nome_2
    ? `${casal.nome_1} & ${casal.parceiro?.nome ?? casal.nome_2}`
    : casal?.nome_1 ?? '';

  return (
    <>
      <FolhaInferior
        visivel={visivel && !qr}
        titulo="Compartilhar lista"
        onFechar={onFechar}
      >
        <View
          style={[
            estilos.link,
            { backgroundColor: cores.surface, borderColor: cores.outlineSoft },
          ]}
        >
          <Texto
            papel="metadado"
            cor="onSurfaceVariant"
            numberOfLines={1}
            style={estilos.flex}
            selectable
          >
            {link.publico}
          </Texto>
          <Botao
            rotulo="Copiar"
            variante="tonal"
            compacto
            onPress={() => {
              Clipboard.setString(`https://${link.publico}`);
              marcar('copiar');
              avisos.mostrar({ texto: 'Link copiado' });
            }}
          />
        </View>
        <Opcao
          icone="assistente"
          rotulo="WhatsApp"
          onPress={() => {
            marcar('whatsapp');
            Linking.openURL(`https://wa.me/?text=${encodeURIComponent(texto)}`);
          }}
        />
        <Divisoria />
        <Opcao
          icone="camera"
          rotulo="Instagram"
          onPress={() => {
            // Stories com imagem gerada ficam para depois (registrado no relatório): por enquanto, o
            // compartilhamento do sistema, que inclui o Instagram.
            marcar('instagram');
            Share.share({ message: texto });
          }}
        />
        <Divisoria />
        <Opcao
          icone="email"
          rotulo="E-mail"
          onPress={() => {
            marcar('email');
            Linking.openURL(
              `mailto:?subject=${encodeURIComponent(
                `Lista de presentes · ${
                  NOME_OCASIAO[lista.ocasiao]
                } · ${nomes}`,
              )}&body=${encodeURIComponent(texto)}`,
            );
          }}
        />
        <Divisoria />
        <Opcao icone="mostrar" rotulo="QR code" onPress={() => setQr(true)} />
        <Divisoria />
        <Opcao
          icone="setaDireita"
          rotulo="Mais"
          onPress={() => {
            marcar('sistema');
            Share.share({ message: texto });
          }}
        />
        <Botao
          rotulo="Ver como convidado"
          variante="texto"
          larguraTotal
          onPress={() => Linking.openURL(link.local)}
        />
      </FolhaInferior>
      <Modal
        visible={qr}
        animationType="fade"
        onRequestClose={() => setQr(false)}
      >
        <View style={[estilos.qrTela, { backgroundColor: cores.background }]}>
          <Texto papel="tituloTela" peso="700" alinhamento="center">
            {NOME_OCASIAO[lista.ocasiao]} · {nomes}
          </Texto>
          <QrCode texto={`https://${link.publico}`} tamanho={260} />
          <Texto papel="metadado" cor="onSurfaceVariant" alinhamento="center">
            {link.publico}
          </Texto>
          <Botao
            rotulo="Compartilhar"
            variante="tonal"
            onPress={() => Share.share({ message: texto })}
          />
          <Botao
            rotulo="Fechar"
            variante="texto"
            onPress={() => setQr(false)}
          />
        </View>
      </Modal>
    </>
  );
}

/** Depois de cancelar reservas: avisar cada convidado pelo WhatsApp (ou copiar a mensagem). */
export function FolhaAvisarConvidados({
  avisos,
  onFechar,
}: {
  avisos: AvisoConvidado[];
  onFechar: () => void;
}) {
  const toasts = useAvisos();
  const [avisados, setAvisados] = useState<Set<number>>(new Set());
  return (
    <FolhaInferior
      visivel={avisos.length > 0}
      titulo={
        avisos.length === 1 ? 'Avisar o convidado' : 'Avisar os convidados'
      }
      onFechar={onFechar}
    >
      <Texto papel="corpo" cor="onSurfaceVariant">
        {avisos.length === 1
          ? 'A reserva foi cancelada.'
          : `${avisos.length} reservas foram canceladas.`}{' '}
        Mandem a mensagem pronta para quem reservou.
      </Texto>
      {avisos.map((a, i) => (
        <View key={`${a.nome}-${i}`} style={estilos.aviso}>
          <View style={estilos.flex}>
            <Texto papel="nomeItem">{a.nome}</Texto>
            <Texto papel="metadado" cor="onSurfaceVariant">
              {a.item}
            </Texto>
          </View>
          <Botao
            rotulo={
              avisados.has(i) ? 'Avisado' : a.whatsapp ? 'WhatsApp' : 'Copiar'
            }
            variante={
              avisados.has(i) ? 'texto' : a.whatsapp ? 'whatsapp' : 'tonal'
            }
            compacto
            onPress={() => {
              if (a.whatsapp) {
                const d = a.whatsapp.replace(/\D/g, '');
                Linking.openURL(
                  `https://wa.me/${
                    d.startsWith('55') ? d : `55${d}`
                  }?text=${encodeURIComponent(a.mensagem)}`,
                );
              } else {
                Clipboard.setString(a.mensagem);
                toasts.mostrar({ texto: 'Mensagem copiada' });
              }
              setAvisados(s => new Set(s).add(i));
            }}
          />
        </View>
      ))}
      <Botao rotulo="Concluir" larguraTotal onPress={onFechar} />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  qr: {
    padding: espacos.space3,
    borderRadius: raios.radiusLg,
    alignSelf: 'center',
  },
  qrTela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacos.space5,
    padding: espacos.space6,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space2,
    borderWidth: 1,
    borderRadius: raios.radiusMd,
    paddingLeft: espacos.space4,
    paddingRight: espacos.space1,
    minHeight: tamanhos.fieldHeight,
  },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
});
