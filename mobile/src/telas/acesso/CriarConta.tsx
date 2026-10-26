import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Botao } from '../../componentes/Botao';
import { BotaoVoltar } from '../../componentes/BotaoVoltar';
import { BotoesSociais } from '../../componentes/BotoesSociais';
import { CaixaSelecao } from '../../componentes/CaixaSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { SimboloLartie } from '../../componentes/Logo';
import { Texto } from '../../componentes/Texto';
import { useDialogo } from '../../feedback/Dialogo';
import { useAvisos } from '../../feedback/Avisos';
import { criarContaComEmail, entrarComApple, entrarComGoogle, ErroAcesso } from '../../servicos/acesso';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { AvisoConvitePendente } from '../convite/AvisoConvitePendente';
import { FundoAcesso } from './FundoAcesso';
import { useAbrirDocumentoLegal, useTratarErroSocial } from './comum';
import { TEXTOS_VALIDACAO, validarEmail, validarNome, validarSenhaNova } from './validacao';

// T03 · Criar conta (CriarConta.dc.html). Cria o usuário no Firebase Auth; o casal vazio e o papel
// noivo_1 são criados em seguida pela tela "Preparando a conta" (API). Conta nova → T06 (Etapa 2).

type Campo = 'nome' | 'email' | 'senha';

export function CriarConta() {
  const navigation = useNavigation();
  const { online } = useConexao();
  const avisos = useAvisos();
  const { confirmar } = useDialogo();
  const abrirDocumento = useAbrirDocumentoLegal();
  const tratarErroSocial = useTratarErroSocial();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [termos, setTermos] = useState(false);
  const [tocados, setTocados] = useState<Record<Campo, boolean>>({ nome: false, email: false, senha: false });
  const [erroEmailServidor, setErroEmailServidor] = useState(false);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const refEmail = useRef<TextInput>(null);
  const refSenha = useRef<TextInput>(null);

  const erros = {
    nome: validarNome(nome),
    email: erroEmailServidor ? 'Este e-mail já tem uma conta.' : validarEmail(email),
    senha: validarSenhaNova(senha),
  };
  const mostrar = (c: Campo) => (tocados[c] || tentouEnviar ? erros[c] : null);
  const valido = !erros.nome && !erros.email && !erros.senha && termos;

  const tocar = (c: Campo) => setTocados((t) => ({ ...t, [c]: true }));

  const semConexao = () => {
    // T47: criar conta exige o servidor.
    avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });
  };

  const criar = async () => {
    setTentouEnviar(true);
    if (!valido) return;
    if (!online) return semConexao();
    try {
      await criarContaComEmail(nome, email, senha);
      // A sessão muda e a navegação segue para "Preparando a conta".
    } catch (erro) {
      const codigo = erro instanceof ErroAcesso ? erro.codigo : 'desconhecido';
      if (codigo === 'email_em_uso') setErroEmailServidor(true);
      else if (codigo === 'senha_curta') setTocados((t) => ({ ...t, senha: true }));
      else if (codigo === 'email_invalido') setTocados((t) => ({ ...t, email: true }));
      else if (codigo === 'sem_conexao') semConexao();
      else await confirmar({ icone: 'erro', titulo: 'Algo deu errado', texto: 'Algo deu errado. Tente de novo em instantes.', cancelar: null, confirmar: 'Entendi' });
    }
  };

  return (
    <FundoAcesso
      rodape={
        <>
          <Botao rotulo="Criar conta" onPress={criar} desativado={!valido} larguraTotal />
          <View style={estilos.linhaLink}>
            <Texto papel="metadado" cor="onSurfaceVariant">
              Já tem conta?{' '}
            </Texto>
            <Pressable onPress={() => navigation.navigate('Entrar', {})} accessibilityRole="link" hitSlop={12}>
              <Texto papel="metadado" peso="600" cor="primary" style={estilos.sublinhado}>
                Entrar
              </Texto>
            </Pressable>
          </View>
        </>
      }
    >
      <BotaoVoltar />
      <View style={estilos.cabecalho}>
        <SimboloLartie altura={56} cor="primary" />
        <Texto papel="tituloDestaque" alinhamento="center" accessibilityRole="header">
          Criar conta
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center">
          Comecem a planejar o casamento e a casa nova.
        </Texto>
      </View>

      <AvisoConvitePendente />

      <BotoesSociais
        modo="criar"
        onGoogle={() => (online ? entrarComGoogle().catch(tratarErroSocial) : Promise.resolve(semConexao()))}
        onApple={() => (online ? entrarComApple().catch(tratarErroSocial) : Promise.resolve(semConexao()))}
      />

      <Separador />

      <CampoTexto
        rotulo="Seu nome"
        placeholder="Ana"
        value={nome}
        onChangeText={setNome}
        onBlur={() => tocar('nome')}
        erro={mostrar('nome')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={() => refEmail.current?.focus()}
        maxLength={40}
      />
      <View style={estilos.grupoEmail}>
        <CampoTexto
          ref={refEmail}
          rotulo="E-mail"
          placeholder="ana@email.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setErroEmailServidor(false);
          }}
          onBlur={() => tocar('email')}
          erro={mostrar('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => refSenha.current?.focus()}
        />
        {erroEmailServidor ? (
          <Pressable onPress={() => navigation.navigate('Entrar', { email: email.trim() })} accessibilityRole="link" hitSlop={8}>
            <Texto papel="ajuda" peso="600" cor="primary" style={estilos.sublinhado}>
              Entrar com este e-mail
            </Texto>
          </Pressable>
        ) : null}
      </View>
      <CampoTexto
        ref={refSenha}
        rotulo="Senha"
        placeholder="Mínimo de 8 caracteres"
        value={senha}
        onChangeText={setSenha}
        onBlur={() => tocar('senha')}
        erro={mostrar('senha')}
        senha
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />
      <CaixaSelecao marcada={termos} onMudar={setTermos} rotuloAcessivel="Aceito os Termos de Uso e a Política de Privacidade">
        <Texto papel="metadado" cor="onSurfaceVariant">
          Aceito os{' '}
          <Texto papel="metadado" cor="primary" peso="600" onPress={() => abrirDocumento('termos')} accessibilityRole="link">
            Termos de Uso
          </Texto>{' '}
          e a{' '}
          <Texto papel="metadado" cor="primary" peso="600" onPress={() => abrirDocumento('privacidade')} accessibilityRole="link">
            Política de Privacidade
          </Texto>
        </Texto>
      </CaixaSelecao>
      {tentouEnviar && !termos ? (
        <Texto papel="ajuda" cor="error">
          {TEXTOS_VALIDACAO.termos}
        </Texto>
      ) : null}
    </FundoAcesso>
  );
}

export function Separador() {
  return (
    <View style={estilos.separador} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinhaSeparador />
      <Texto papel="metadado" cor="onSurfaceVariant">
        ou com e-mail
      </Texto>
      <LinhaSeparador />
    </View>
  );
}

function LinhaSeparador() {
  const { cores } = useTema();
  return <View style={[estilos.linhaSeparador, { backgroundColor: cores.outlineVariant }]} />;
}

const estilos = StyleSheet.create({
  cabecalho: { alignItems: 'center', gap: espacos.space2, marginBottom: espacos.space2 },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  linhaSeparador: { flex: 1, height: 1 },
  grupoEmail: { gap: espacos.space2 },
  linhaLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sublinhado: { textDecorationLine: 'underline' },
});
