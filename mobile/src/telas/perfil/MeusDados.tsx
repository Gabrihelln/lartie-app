import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from '@react-native-firebase/auth';
import { serverTimestamp, updateDoc, doc } from '@react-native-firebase/firestore';
import { caminhos, type Usuario } from '@lartie/modelo';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { TelaPilha } from '../../componentes/Estrutura';
import { Texto } from '../../componentes/Texto';
import { useDocumento } from '../../dados/leitura';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import { registrarErro } from '../../servicos/analytics';
import { useConexao } from '../../servicos/conexao';
import { auth, db } from '../../servicos/firebase';
import { validarEmail, validarNome, validarSenhaLogin, validarSenhaNova } from '../acesso/validacao';

// T33 › Meus dados e senha: nome, e-mail (só muda depois de confirmar o link enviado ao e-mail
// novo) e troca de senha (senha atual + nova). Quem entra com Google ou Apple não tem senha aqui.

const PROVEDOR: Record<string, string> = { google: 'Google', apple: 'Apple' };

export function MeusDados() {
  const navigation = useNavigation();
  const { usuario } = useSessao();
  const { online } = useConexao();
  const { confirmar } = useDialogo();
  const avisos = useAvisos();
  const perfil = useDocumento<Usuario>(usuario ? caminhos.usuario(usuario.uid) : null).dados;
  const porEmail = perfil?.provedor_login === 'email' || (!perfil && usuario?.providerData.some((p) => p.providerId === 'password'));
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const liberado = useRef(false);
  const preenchido = useRef(false);
  useEffect(() => {
    if (!perfil || preenchido.current) return;
    preenchido.current = true;
    setNome(perfil.nome);
  }, [perfil]);

  const mudouNome = !!perfil && nome.trim() !== perfil.nome;
  const mudouEmail = email.trim().toLowerCase() !== (usuario?.email ?? '').toLowerCase();
  const mudouSenha = !!senhaNova;
  useDescartarAlteracoes({ temAlteracoes: mudouNome || mudouEmail || mudouSenha, oQue: 'os seus dados', liberado });

  const erros = {
    nome: validarNome(nome),
    email: mudouEmail ? validarEmail(email) : null,
    senhaAtual: (mudouEmail || mudouSenha) && porEmail ? validarSenhaLogin(senhaAtual) : null,
    senhaNova: mudouSenha ? validarSenhaNova(senhaNova) : null,
  };

  const salvar = async () => {
    setTentou(true);
    const u = auth().currentUser;
    if (!u || Object.values(erros).some(Boolean)) return;
    if ((mudouEmail || mudouSenha) && !online) {
      avisos.mostrar({ texto: 'Trocar e-mail ou senha precisa de internet.', tipo: 'erro' });
      return;
    }
    setSalvando(true);
    try {
      if (mudouNome) {
        await updateDoc(doc(db(), caminhos.usuario(u.uid)), { nome: nome.trim(), atualizado_em: serverTimestamp() });
        updateProfile(u, { displayName: nome.trim() }).catch(() => {});
      }
      if (mudouEmail || mudouSenha) {
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email ?? '', senhaAtual));
        if (mudouSenha) await updatePassword(u, senhaNova);
        if (mudouEmail) {
          await verifyBeforeUpdateEmail(u, email.trim());
          await confirmar({
            icone: 'email',
            titulo: 'Confirme o e-mail novo',
            texto: `Enviamos um link para ${email.trim()}. O e-mail da conta muda quando você confirmar.`,
            cancelar: null,
            confirmar: 'Entendi',
          });
        }
      }
      liberado.current = true;
      navigation.goBack();
      avisos.mostrar({ texto: 'Dados salvos', tipo: 'sucesso' });
    } catch (erro) {
      const codigo = (erro as { code?: string }).code ?? '';
      if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential') {
        avisos.mostrar({ texto: 'A senha atual não confere.', tipo: 'erro' });
      } else if (codigo === 'auth/email-already-in-use') {
        avisos.mostrar({ texto: 'Este e-mail já tem uma conta.', tipo: 'erro' });
      } else {
        registrarErro(erro, 'meus dados');
        avisos.mostrar({ texto: 'Não foi possível salvar. Tente de novo.', tipo: 'erro' });
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <TelaPilha titulo="Meus dados e senha" rodape={<Botao rotulo="Salvar" larguraTotal carregando={salvando} onPress={salvar} />}>
      <CampoTexto rotulo="Seu nome" value={nome} onChangeText={setNome} autoCapitalize="words" maxLength={40} erro={tentou ? erros.nome : null} />
      {porEmail ? (
        <>
          <CampoTexto
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            erro={tentou ? erros.email : null}
          />
          <CampoTexto rotulo="Nova senha" senha value={senhaNova} onChangeText={setSenhaNova} ajuda="Mínimo de 8 caracteres" erro={tentou ? erros.senhaNova : null} />
          {mudouEmail || mudouSenha ? (
            <CampoTexto rotulo="Senha atual" senha value={senhaAtual} onChangeText={setSenhaAtual} erro={tentou ? erros.senhaAtual : null} />
          ) : null}
        </>
      ) : (
        <>
          <CampoTexto rotulo="E-mail" value={usuario?.email ?? ''} editable={false} />
          <Texto papel="metadado" cor="onSurfaceVariant">
            Você entra com {PROVEDOR[perfil?.provedor_login ?? ''] ?? 'Google ou Apple'}. O e-mail e a senha são os dessa conta.
          </Texto>
        </>
      )}
    </TelaPilha>
  );
}
