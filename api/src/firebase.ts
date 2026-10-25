import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin. O projeto vem de FIREBASE_PROJECT_ID. Credenciais:
// - emuladores (demo-lartie): nenhuma; FIREBASE_AUTH_EMULATOR_HOST e FIRESTORE_EMULATOR_HOST apontam para eles;
// - dev e prod: conta de serviço em GOOGLE_APPLICATION_CREDENTIALS, fora do repositório (na VPS, /etc/lartie/).

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Defina FIREBASE_PROJECT_ID (demo-lartie, lartie-dev ou lartie).');

const emulador = projectId.startsWith('demo-');

if (getApps().length === 0) {
  initializeApp(emulador ? { projectId } : { projectId, credential: applicationDefault() });
}

export const auth = getAuth();
export const db = getFirestore();
export const PROJETO = projectId;
