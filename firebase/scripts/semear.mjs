// Cria o casal de teste nos emuladores (ambiente demo): Ana (noivo_1) e Pedro (noivo_2).
// Uso, com os emuladores rodando (npm run emuladores):  npm run semear
// Nunca roda contra um projeto real: exige os emuladores e o projeto demo-lartie.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

const PROJETO = 'demo-lartie';
const CASAL = 'casal-teste-ana-pedro';
const SENHA = 'lartie-teste';
const PESSOAS = [
  { uid: 'ana', nome: 'Ana', email: 'ana@teste.lartie.app', papel: 'noivo_1' },
  { uid: 'pedro', nome: 'Pedro', email: 'pedro@teste.lartie.app', papel: 'noivo_2' },
];

initializeApp({ projectId: PROJETO });
const auth = getAuth();
const db = getFirestore();

for (const p of PESSOAS) {
  try {
    await auth.deleteUser(p.uid);
  } catch {
    // ainda não existia
  }
  await auth.createUser({ uid: p.uid, email: p.email, password: SENHA, displayName: p.nome, emailVerified: true });
  await auth.setCustomUserClaims(p.uid, { casal_id: CASAL });
  await db.doc(`usuarios/${p.uid}`).set({
    casal_id: CASAL,
    nome: p.nome,
    email: p.email,
    provedor_login: 'email',
    papel: p.papel,
    preferencias_notificacao: {
      tarefas: true,
      parcelas: true,
      reservas: true,
      rsvp: true,
      silencio_inicio: '22:00',
      silencio_fim: '08:00',
    },
    tokens_push: [],
    criado_em: FieldValue.serverTimestamp(),
    atualizado_em: FieldValue.serverTimestamp(),
  });
}

await db.doc(`casais/${CASAL}`).set({
  nome_1: 'Ana',
  nome_2: 'Pedro',
  foto: null,
  data_casamento: '2027-04-17',
  cidade: 'São Paulo',
  uf: 'SP',
  estilo: 'civil_religioso',
  num_convidados_previsto: 120,
  orcamento_total: 8000000,
  slug: 'ana-e-pedro',
  modo_app: 'os_dois',
  modo_alterado_em: null,
  modo_alterado_por: null,
  modulos_gerados: { casamento: false, casa: false },
  onboarding_concluido: true,
  rsvp_prazo: '2027-02-16',
  buffet_valor_por_pessoa: null,
  criado_por: 'ana',
  criado_em: FieldValue.serverTimestamp(),
  atualizado_por: 'ana',
  atualizado_em: FieldValue.serverTimestamp(),
});
await db.doc(`slugs/ana-e-pedro`).set({ casal_id: CASAL });

console.log(`Casal de teste criado (${CASAL}). Contas: ${PESSOAS.map((p) => p.email).join(' e ')}, senha "${SENHA}".`);
