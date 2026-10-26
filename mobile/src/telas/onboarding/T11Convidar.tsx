import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { raios, tamanhos } from '@lartie/tokens';
import { PREFERENCIAS_PADRAO } from '@lartie/modelo';
import { AvatarDuplo } from '../../componentes/AvatarDuplo';
import { Botao } from '../../componentes/Botao';
import { BotaoVoltar } from '../../componentes/BotaoVoltar';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Texto } from '../../componentes/Texto';
import { atualizarPreferencias } from '../../dados/gravacao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { cancelarConvites, criarConvite } from '../../servicos/api';
import { useConexao } from '../../servicos/conexao';
import { jaPediuNotificacoes } from '../../servicos/notificacoes';
import { espacos, useTema } from '../../tema';
import { FundoAcesso } from '../acesso/FundoAcesso';
import { useOnboarding } from './comum';

// T11 · Convidar parceiro(a) (ObConvidar.dc.html). O convite vale por 7 dias (13.7).
// O link lartie.app/convite/{codigo} só abre o app quando o domínio existir (P13); até lá, o app
// também entende lartie://convite/{codigo}. O e-mail de convite fica para depois do domínio.

const DOMINIO = 'lartie.app';

/** Mensagem pronta do WhatsApp (docs/textos-e-mensagens.md, seção 1). */
export function mensagemConvite(nome1: string, codigo: string) {
  return (
    `${nome1} convidou você para planejar juntos no Lartiê: o casamento e a casa nova de vocês, num só lugar. ` +
    `Entre pelo link: ${DOMINIO}/convite/${codigo}\nO convite vale por 7 dias.`
  );
}

export function T11Convidar() {
  const { cores, alvoToque } = useTema();
  const { casal, navigation, concluir, voltar } = useOnboarding();
  const { online } = useConexao();
  const avisos = useAvisos();
  const { confirmar } = useDialogo();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erroConvite, setErroConvite] = useState(false);
  const [lembretes, setLembretes] = useState(true);
  const [email, setEmail] = useState('');

  const carregarConvite = useCallback(async () => {
    setErroConvite(false);
    try {
      setCodigo((await criarConvite()).codigo);
    } catch {
      setErroConvite(true);
    }
  }, []);

  useEffect(() => {
    if (online) carregarConvite();
    else setErroConvite(true);
  }, [online, carregarConvite]);

  const link = codigo ? `${DOMINIO}/convite/${codigo}` : '';
  const nome2 = casal?.nome_2 ?? 'seu amor';

  const enviarWhatsApp = () => {
    if (!codigo || !casal) return;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(mensagemConvite(casal.nome_1, codigo))}`);
  };

  const copiar = () => {
    Clipboard.setString(link);
    avisos.mostrar({ texto: 'Link copiado' });
  };

  const enviarEmail = () =>
    confirmar({
      icone: 'email',
      titulo: 'Convite por e-mail',
      texto: '[a definir] O envio por e-mail chega quando o domínio lartie.app existir. Por enquanto, use o WhatsApp ou copie o link.',
      cancelar: null,
      confirmar: 'Entendi',
    });

  // Ajuste da Etapa 2: enviou para a pessoa errada? Cancela o convite atual e gera outro.
  const gerarOutro = async () => {
    const ok = await confirmar({
      titulo: 'Cancelar este convite?',
      texto: 'O link enviado deixa de funcionar e criamos um novo para vocês enviarem.',
      cancelar: 'Manter',
      confirmar: 'Gerar outro',
    });
    if (!ok) return;
    setCodigo(null);
    try {
      await cancelarConvites();
      setCodigo((await criarConvite()).codigo);
      avisos.mostrar({ texto: 'Novo convite criado', tipo: 'sucesso' });
    } catch {
      setErroConvite(true);
    }
  };

  const irParaInicio = () => {
    const ativas = lembretes;
    atualizarPreferencias({
      ...PREFERENCIAS_PADRAO,
      tarefas: ativas,
      parcelas: ativas,
      reservas: ativas,
      rsvp: ativas,
    });
    // T57 antes do pedido nativo, se os lembretes estão ligados e a permissão ainda não foi pedida.
    if (ativas && !jaPediuNotificacoes()) navigation.navigate('PermNotificacoes');
    else concluir();
  };

  return (
    <FundoAcesso
      aneis
      rodape={
        <>
          <Botao rotulo="Ir para o início" larguraTotal onPress={irParaInicio} />
          <Botao rotulo="Convidar depois" variante="texto" larguraTotal onPress={irParaInicio} />
        </>
      }
    >
      <BotaoVoltar onPress={() => voltar('T11')} />
      <View style={estilos.topo}>
        <AvatarDuplo pessoa1={{ nome: casal?.nome_1 ?? '' }} pessoa2={{ nome: nome2 }} tamanho={72} />
        <Texto papel="tituloDestaque" accessibilityRole="header">
          Planejem juntos
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant">
          Convide {nome2}. Os dois veem e editam o mesmo plano, em tempo real.
        </Texto>
      </View>

      <Botao rotulo="Enviar convite pelo WhatsApp" variante="whatsapp" larguraTotal onPress={enviarWhatsApp} desativado={!codigo} />

      <View style={[estilos.link, { backgroundColor: cores.surface, borderColor: cores.outlineSoft }]}>
        {codigo ? (
          <Texto papel="metadado" cor="onSurfaceVariant" numberOfLines={1} style={estilos.textoLink} selectable>
            {link}
          </Texto>
        ) : erroConvite ? (
          <Pressable onPress={carregarConvite} accessibilityRole="button" style={estilos.textoLink}>
            <Texto papel="metadado" cor="error">
              Não foi possível criar o convite. Toque para tentar de novo.
            </Texto>
          </Pressable>
        ) : (
          <ActivityIndicator color={cores.primary} style={estilos.textoLink} accessibilityLabel="Criando o convite" />
        )}
        <Pressable
          onPress={copiar}
          disabled={!codigo}
          accessibilityRole="button"
          accessibilityLabel="Copiar o link do convite"
          style={[estilos.copiar, { backgroundColor: cores.primaryContainer, minHeight: alvoToque, opacity: codigo ? 1 : 0.38 }]}
        >
          <Texto papel="metadado" peso="600" cor="onPrimaryContainer">
            Copiar
          </Texto>
        </Pressable>
      </View>

      {codigo ? (
        <Botao rotulo="Cancelar este convite e gerar outro" variante="texto" onPress={gerarOutro} />
      ) : null}

      <CampoTexto
        rotulo="Ou envie por e-mail"
        placeholder="pedro@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="send"
        onSubmitEditing={enviarEmail}
      />

      <View style={[estilos.lembretes, { backgroundColor: cores.surfaceVariant }]}>
        <View style={estilos.textosLembretes}>
          <Texto papel="nomeItem">Ativar lembretes</Texto>
          <Texto papel="metadado" cor="onSurfaceVariant">
            Prazos, parcelas e convidados sem resposta
          </Texto>
        </View>
        <Switch
          value={lembretes}
          onValueChange={setLembretes}
          accessibilityLabel="Ativar lembretes"
          trackColor={{ true: cores.primary, false: cores.outlineSoft }}
          thumbColor={cores.surface}
          ios_backgroundColor={cores.outlineSoft}
        />
      </View>
    </FundoAcesso>
  );
}

const estilos = StyleSheet.create({
  topo: { gap: espacos.space3, marginBottom: espacos.space2 },
  link: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: espacos.space4,
    paddingRight: espacos.space1 + 2,
    gap: espacos.space2,
  },
  textoLink: { flex: 1 },
  copiar: { borderRadius: raios.radiusFull, paddingHorizontal: 14, justifyContent: 'center' },
  lembretes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    padding: espacos.space4,
    borderRadius: raios.radiusLg,
  },
  textosLembretes: { flex: 1, gap: 2 },
});
