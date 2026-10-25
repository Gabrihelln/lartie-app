import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import { AvisoTopo } from '../../componentes/AvisoTopo';
import { Botao } from '../../componentes/Botao';
import { BotaoVoltar } from '../../componentes/BotaoVoltar';
import { BotoesSociais } from '../../componentes/BotoesSociais';
import { CampoTexto } from '../../componentes/CampoTexto';
import { SimboloLartie } from '../../componentes/Logo';
import { Texto } from '../../componentes/Texto';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { entrarComApple, entrarComEmail, entrarComGoogle, ErroAcesso } from '../../servicos/acesso';
import { ambienteAtual } from '../../servicos/ambiente';
import { armazenamento, CHAVES } from '../../servicos/armazenamento';
import { limpar, minutosRestantes, registrarFalha, situacao, type Tentativas } from '../../servicos/bloqueioLogin';
import { useConexao } from '../../servicos/conexao';
import { espacos, estiloMarca, useTema } from '../../tema';
import { Separador } from './CriarConta';
import { FundoAcesso } from './FundoAcesso';
import { useTratarErroSocial } from './comum';
import { validarEmail, validarSenhaLogin } from './validacao';

// T04 · Entrar (Entrar.dc.html). Erro T44 com o aviso no topo e a senha em erro; bloqueio de 15 min
// após 5 tentativas erradas em 15 min. "Sua sessão expirou" quando a sessão termina sozinha.

export const TEXTOS_ENTRAR = {
  credenciais: 'E-mail ou senha incorretos. Confira e tente de novo.',
  senhaIncorreta: 'Senha incorreta.',
  sessaoExpirada: 'Sua sessão expirou. Entre de novo.',
  bloqueado: (min: number) =>
    `Muitas tentativas com este e-mail. Por segurança, o acesso fica bloqueado por ${min} ${min === 1 ? 'minuto' : 'minutos'}. Se esqueceu a senha, crie uma nova.`,
} as const;

/** Contas de teste dos emuladores (npm run semear). Só no ambiente demo. */
const CONTAS_TESTE = [
  { rotulo: 'Ana (noivo 1)', email: 'ana@teste.lartie.app' },
  { rotulo: 'Pedro (noivo 2)', email: 'pedro@teste.lartie.app' },
] as const;

function lerTentativas(): Tentativas {
  try {
    return JSON.parse(armazenamento.getString(CHAVES.tentativasLogin) ?? '{}') as Tentativas;
  } catch {
    return {};
  }
}

function gravarTentativas(t: Tentativas) {
  armazenamento.set(CHAVES.tentativasLogin, JSON.stringify(t));
}

export function Entrar() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Entrar'>>();
  const { cores } = useTema();
  const { online } = useConexao();
  const avisos = useAvisos();
  const { sessaoExpirada, limparAvisoSessao } = useSessao();
  const tratarErroSocial = useTratarErroSocial();

  const [email, setEmail] = useState(params?.email ?? '');
  const [senha, setSenha] = useState('');
  const [tocados, setTocados] = useState({ email: false, senha: false });
  const [aviso, setAviso] = useState<string | null>(sessaoExpirada ? TEXTOS_ENTRAR.sessaoExpirada : null);
  const [senhaErrada, setSenhaErrada] = useState(false);
  const refSenha = useRef<TextInput>(null);

  const erroEmail = tocados.email ? validarEmail(email) : null;
  const erroSenha = senhaErrada ? TEXTOS_ENTRAR.senhaIncorreta : tocados.senha ? validarSenhaLogin(senha) : null;
  const valido = !validarEmail(email) && !validarSenhaLogin(senha);

  const semConexao = () => avisos.mostrar({ texto: 'Sem conexão com a internet. Confira e tente de novo.', tipo: 'erro' });

  const entrar = async (emailUsado = email, senhaUsada = senha) => {
    limparAvisoSessao();
    setSenhaErrada(false);
    const agora = Date.now();
    const s = situacao(lerTentativas(), emailUsado, agora);
    if (s.bloqueado && s.ate) {
      setAviso(TEXTOS_ENTRAR.bloqueado(minutosRestantes(s.ate, agora)));
      return;
    }
    if (!online) return semConexao();
    try {
      await entrarComEmail(emailUsado, senhaUsada);
      gravarTentativas(limpar(lerTentativas(), emailUsado));
    } catch (erro) {
      const codigo = erro instanceof ErroAcesso ? erro.codigo : 'desconhecido';
      if (codigo === 'credenciais') {
        const t = registrarFalha(lerTentativas(), emailUsado, Date.now());
        gravarTentativas(t);
        const depois = situacao(t, emailUsado, Date.now());
        setAviso(depois.bloqueado && depois.ate ? TEXTOS_ENTRAR.bloqueado(minutosRestantes(depois.ate, Date.now())) : TEXTOS_ENTRAR.credenciais);
        setSenhaErrada(true);
      } else if (codigo === 'bloqueado_servidor') {
        setAviso(TEXTOS_ENTRAR.bloqueado(15));
      } else if (codigo === 'sem_conexao') {
        semConexao();
      } else if (codigo === 'email_invalido') {
        setTocados((t) => ({ ...t, email: true }));
      } else {
        setAviso('Algo deu errado. Tente de novo em instantes.');
      }
    }
  };

  return (
    <FundoAcesso
      aneis
      rodape={
        <>
          <Botao rotulo="Entrar" onPress={() => entrar()} desativado={!valido} larguraTotal />
          <View style={estilos.linhaLink}>
            <Texto papel="metadado" cor="onSurfaceVariant">
              Ainda não tem conta?{' '}
            </Texto>
            <Pressable onPress={() => navigation.navigate('CriarConta')} accessibilityRole="link" hitSlop={12}>
              <Texto papel="metadado" peso="600" cor="primary" style={estilos.sublinhado}>
                Criar conta
              </Texto>
            </Pressable>
          </View>
        </>
      }
    >
      <BotaoVoltar onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BoasVindas'))} />
      <View style={estilos.cabecalho}>
        <SimboloLartie altura={72} cor="primary" />
        <Texto style={[estiloMarca(26), { color: cores.onPrimaryContainer }]}>Lartiê</Texto>
        <Texto papel="tituloDestaque" alinhamento="center" accessibilityRole="header" style={estilos.titulo}>
          Que bom te ver de novo
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center">
          Entre para continuar o planejamento.
        </Texto>
      </View>

      {aviso ? <AvisoTopo texto={aviso} tom={aviso === TEXTOS_ENTRAR.sessaoExpirada ? 'aviso' : 'erro'} /> : null}

      <BotoesSociais
        modo="entrar"
        onGoogle={() => (online ? entrarComGoogle().catch(tratarErroSocial) : Promise.resolve(semConexao()))}
        onApple={() => (online ? entrarComApple().catch(tratarErroSocial) : Promise.resolve(semConexao()))}
      />

      <Separador />

      <CampoTexto
        rotulo="E-mail"
        placeholder="ana@email.com"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTocados((t) => ({ ...t, email: true }))}
        erro={erroEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => refSenha.current?.focus()}
      />
      <CampoTexto
        ref={refSenha}
        rotulo="Senha"
        placeholder="Sua senha"
        value={senha}
        onChangeText={(t) => {
          setSenha(t);
          setSenhaErrada(false);
        }}
        onBlur={() => setTocados((t) => ({ ...t, senha: true }))}
        erro={erroSenha}
        senha
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => valido && entrar()}
      />
      <Pressable
        onPress={() => navigation.navigate('EsqueciSenha', { email: email.trim() })}
        accessibilityRole="link"
        hitSlop={12}
        style={estilos.esqueci}
      >
        <Texto papel="metadado" peso="600" cor="primary">
          Esqueci a senha
        </Texto>
      </Pressable>

      {ambienteAtual() === 'demo' ? (
        <View style={[estilos.teste, { borderColor: cores.outlineAccent }]}>
          <Texto papel="ajuda" cor="onSurfaceVariant">
            Só nos emuladores (ambiente demo): contas de teste, senha lartie-teste.
          </Texto>
          {CONTAS_TESTE.map((c) => (
            <Botao key={c.email} rotulo={`Entrar como ${c.rotulo}`} variante="tonal" compacto onPress={() => entrar(c.email, 'lartie-teste')} />
          ))}
        </View>
      ) : null}
    </FundoAcesso>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { alignItems: 'center', gap: espacos.space1 },
  titulo: { marginTop: espacos.space4 },
  esqueci: { alignSelf: 'flex-end' },
  linhaLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sublinhado: { textDecorationLine: 'underline' },
  teste: { borderWidth: 1, borderStyle: 'dashed', borderRadius: raios.radiusMd, padding: espacos.space3, gap: espacos.space2, marginTop: espacos.space4 },
});
