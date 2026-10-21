import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import { Botao } from '../../componentes/Botao';
import { BotaoVoltar } from '../../componentes/BotaoVoltar';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { useAvisos } from '../../feedback/Avisos';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { enviarLinkNovaSenha, ErroAcesso } from '../../servicos/acesso';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { FundoAcesso } from './FundoAcesso';
import { validarEmail } from './validacao';

// T05 · Esqueci a senha (EsqueciSenha.dc.html). Sempre mostra o estado "enviado", exista ou não a
// conta (não revela quais e-mails existem). "Reenviar e-mail" libera após 60 s e volta ao formulário.

export const ESPERA_REENVIO_S = 60;

export function EsqueciSenha() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'EsqueciSenha'>>();
  const { online } = useConexao();
  const avisos = useAvisos();
  const [email, setEmail] = useState(params?.email ?? '');
  const [tocado, setTocado] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const erro = tocado ? validarEmail(email) : null;

  const enviar = async () => {
    if (validarEmail(email)) return setTocado(true);
    if (!online) return avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });
    try {
      await enviarLinkNovaSenha(email);
      setEnviadoPara(email.trim());
      setSegundos(ESPERA_REENVIO_S);
    } catch (e) {
      if (e instanceof ErroAcesso && e.codigo === 'email_invalido') setTocado(true);
      else avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });
    }
  };

  if (enviadoPara) {
    return (
      <FundoAcesso
        aneis
        rodape={<Botao rotulo="Voltar para o login" onPress={() => navigation.navigate('Entrar', { email: enviadoPara })} larguraTotal />}
      >
        <BotaoVoltar onPress={() => setEnviadoPara(null)} />
        <View style={estilos.enviado}>
          <CirculoEmail />
          <Texto papel="tituloDestaque" alinhamento="center" accessibilityRole="header">
            Confira seu e-mail
          </Texto>
          <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center" style={estilos.textoEnviado}>
            Enviamos o link para {enviadoPara}. Ele vale por 1 hora.
          </Texto>
          <Botao
            rotulo={segundos > 0 ? `Reenviar e-mail em ${segundos} s` : 'Reenviar e-mail'}
            variante="texto"
            desativado={segundos > 0}
            onPress={() => setEnviadoPara(null)}
          />
        </View>
      </FundoAcesso>
    );
  }

  return (
    <FundoAcesso aneis rodape={<Botao rotulo="Enviar link" onPress={enviar} desativado={!!validarEmail(email)} larguraTotal />}>
      <BotaoVoltar />
      <View style={estilos.formulario}>
        <CirculoEmail />
        <Texto papel="tituloDestaque" accessibilityRole="header">
          Esqueceu a senha?
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant">
          Informe o e-mail da conta. Vamos enviar um link para criar uma nova senha.
        </Texto>
        <CampoTexto
          rotulo="E-mail"
          placeholder="ana@email.com"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTocado(true)}
          erro={erro}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={enviar}
        />
      </View>
    </FundoAcesso>
  );
}

function CirculoEmail() {
  const { cores } = useTema();
  return (
    <View style={[estilos.circulo, { backgroundColor: cores.primaryContainer }]}>
      <Icone nome="email" cor={cores.primary} tamanho={30} />
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacos.space4, paddingTop: 120 },
  enviado: { alignItems: 'center', gap: espacos.space4, paddingTop: 220 },
  textoEnviado: { maxWidth: 300 },
  circulo: { width: 72, height: 72, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
});
