import { Platform } from 'react-native';
import {
  AppleAuthProvider,
  createUserWithEmailAndPassword,
  getIdToken,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setLanguageCode,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { armazenamento, CHAVES } from './armazenamento';
import { inicializarConta } from './api';
import { auth } from './firebase';
import { ambienteAtual } from './ambiente';
import { GOOGLE_WEB_CLIENT_ID } from './loginSocial';
import { registrarErro } from './analytics';

// Acesso e login (T03, T04, T05). Base: o serviço de login do Newzi.
// Depois de qualquer login, a tela "Preparando a conta" chama a API para garantir o casal e o
// claim casal_id (inicializarConta é idempotente). Assim o caminho é um só para e-mail, Google e Apple.

export type CodigoErroAcesso =
  | 'email_em_uso'
  | 'senha_curta'
  | 'email_invalido'
  | 'credenciais'
  | 'bloqueado_servidor'
  | 'sem_conexao'
  | 'cancelado'
  | 'outro_provedor'
  | 'indisponivel'
  | 'desconhecido';

export class ErroAcesso extends Error {
  constructor(readonly codigo: CodigoErroAcesso) {
    super(codigo);
  }
}

const CODIGOS_FIREBASE: Record<string, CodigoErroAcesso> = {
  'auth/email-already-in-use': 'email_em_uso',
  'auth/weak-password': 'senha_curta',
  'auth/invalid-email': 'email_invalido',
  'auth/wrong-password': 'credenciais',
  'auth/invalid-credential': 'credenciais',
  'auth/user-not-found': 'credenciais',
  'auth/too-many-requests': 'bloqueado_servidor',
  'auth/network-request-failed': 'sem_conexao',
  'auth/account-exists-with-different-credential': 'outro_provedor',
  'auth/operation-not-allowed': 'indisponivel',
};

function traduzir(erro: unknown): ErroAcesso {
  if (erro instanceof ErroAcesso) return erro;
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String((erro as { code: unknown }).code) : '';
  const traduzido = CODIGOS_FIREBASE[codigo];
  if (!traduzido) registrarErro(erro, `acesso ${codigo}`);
  return new ErroAcesso(traduzido ?? 'desconhecido');
}

const normalizar = (email: string) => email.trim().toLowerCase();

function registrarLogin(evento: 'sign_up' | 'login', metodo: 'email' | 'google' | 'apple') {
  try {
    const analytics = getAnalytics(getApp());
    if (evento === 'sign_up') logEvent(analytics, 'sign_up', { method: metodo });
    else logEvent(analytics, 'login', { method: metodo });
  } catch {
    // analytics nunca bloqueia o acesso
  }
}

export function configurarAcesso() {
  // E-mails do Firebase Auth (recuperar senha) em português.
  setLanguageCode(auth(), 'pt-BR').catch(() => {});
}

/** T03 com e-mail. O casal é criado em seguida pela tela "Preparando a conta". */
export async function criarContaComEmail(nome: string, email: string, senha: string) {
  try {
    armazenamento.set(CHAVES.nomePendente, nome.trim());
    const credencial = await createUserWithEmailAndPassword(auth(), normalizar(email), senha);
    await updateProfile(credencial.user, { displayName: nome.trim() });
    registrarLogin('sign_up', 'email');
  } catch (erro) {
    throw traduzir(erro);
  }
}

/** T04 com e-mail. */
export async function entrarComEmail(email: string, senha: string) {
  try {
    await signInWithEmailAndPassword(auth(), normalizar(email), senha);
    registrarLogin('login', 'email');
  } catch (erro) {
    throw traduzir(erro);
  }
}

export async function entrarComGoogle() {
  try {
    const webClientId = GOOGLE_WEB_CLIENT_ID[ambienteAtual()];
    // Sem o Google configurado no ambiente (demo, ou prod antes da Etapa 10), o botão avisa que não está disponível.
    if (!webClientId) throw new ErroAcesso('indisponivel');
    GoogleSignin.configure({ webClientId });
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const resposta = await GoogleSignin.signIn().catch((erro) => {
      if (isErrorWithCode(erro) && erro.code === statusCodes.SIGN_IN_CANCELLED) throw new ErroAcesso('cancelado');
      throw erro;
    });
    if (!isSuccessResponse(resposta)) throw new ErroAcesso('cancelado');
    const idToken = resposta.data.idToken;
    if (!idToken) throw new ErroAcesso('indisponivel');
    const resultado = await signInWithCredential(auth(), GoogleAuthProvider.credential(idToken));
    registrarLogin(resultado.additionalUserInfo?.isNewUser ? 'sign_up' : 'login', 'google');
  } catch (erro) {
    throw traduzir(erro);
  }
}

/** Sign in with Apple só existe no iPhone (obrigatório quando há login social no iOS). */
export const appleDisponivel = Platform.OS === 'ios' && appleAuth.isSupported;

export async function entrarComApple() {
  if (!appleDisponivel) throw new ErroAcesso('indisponivel');
  try {
    const resposta = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });
    if (!resposta.identityToken) throw new ErroAcesso('indisponivel');
    const resultado = await signInWithCredential(auth(), AppleAuthProvider.credential(resposta.identityToken, resposta.nonce));
    // A Apple só envia o nome no primeiro login: guardamos para a API usar.
    const nome = [resposta.fullName?.givenName, resposta.fullName?.familyName].filter(Boolean).join(' ');
    if (nome) {
      armazenamento.set(CHAVES.nomePendente, nome);
      if (!resultado.user.displayName) await updateProfile(resultado.user, { displayName: nome });
    }
    registrarLogin(resultado.additionalUserInfo?.isNewUser ? 'sign_up' : 'login', 'apple');
  } catch (erro) {
    if (typeof erro === 'object' && erro && 'code' in erro && (erro as { code: string }).code === appleAuth.Error.CANCELED) {
      throw new ErroAcesso('cancelado');
    }
    throw traduzir(erro);
  }
}

/** T05. Não revela se o e-mail tem conta: só falha por falta de conexão ou e-mail inválido. */
export async function enviarLinkNovaSenha(email: string) {
  try {
    await sendPasswordResetEmail(auth(), normalizar(email));
  } catch (erro) {
    const traduzido = traduzir(erro);
    if (traduzido.codigo === 'sem_conexao' || traduzido.codigo === 'email_invalido') throw traduzido;
  }
}

/**
 * Garante o casal do usuário logado: chama a API (idempotente) e renova o token para o claim
 * casal_id chegar ao app e às regras do Firestore.
 */
export async function prepararConta() {
  const usuario = auth().currentUser;
  if (!usuario) return;
  const nome = armazenamento.getString(CHAVES.nomePendente) ?? undefined;
  await inicializarConta(nome && nome.length >= 2 && nome.length <= 40 ? nome : undefined);
  armazenamento.remove(CHAVES.nomePendente);
  await getIdToken(usuario, true);
}

let saidaVoluntaria = false;

/** Sair da conta (T41 definitivo na Etapa 3). */
export async function sair() {
  saidaVoluntaria = true;
  await GoogleSignin.signOut().catch(() => {});
  await signOut(auth());
}

/**
 * Chamado pela sessão quando o usuário some. true = a pessoa pediu para sair; false = a sessão
 * terminou sozinha (token revogado, conta desativada) e o T04 avisa "Sua sessão expirou".
 */
export function consumirSaidaVoluntaria(): boolean {
  const v = saidaVoluntaria;
  saidaVoluntaria = false;
  return v;
}
