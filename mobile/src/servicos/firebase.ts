import { getApp } from '@react-native-firebase/app';
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from '@react-native-firebase/firestore';
import { getAnalytics, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { getCrashlytics, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';
import { ambienteAtual, HOST_EMULADOR } from './ambiente';

// Inicialização única do Firebase no app.
// - Firestore com cache offline ilimitado: o casal usa o app sem internet e a fila de gravações é
//   enviada quando a conexão volta (especificação 2.2). "Vence a última gravação" é o comportamento
//   padrão do Firestore para o mesmo campo.
// - No ambiente demo, tudo aponta para os emuladores locais e não há analytics nem Crashlytics.

let pronto = false;

export function iniciarFirebase() {
  if (pronto) return;
  pronto = true;
  const app = getApp();
  const ambiente = ambienteAtual();

  initializeFirestore(app, { persistence: true, cacheSizeBytes: -1 });

  if (ambiente === 'demo') {
    connectAuthEmulator(getAuth(app), `http://${HOST_EMULADOR}:9099`);
    connectFirestoreEmulator(getFirestore(app), HOST_EMULADOR, 8080);
  }

  const coletar = ambiente !== 'demo' && !__DEV__;
  setAnalyticsCollectionEnabled(getAnalytics(app), coletar);
  setCrashlyticsCollectionEnabled(getCrashlytics(app), coletar);
}

export const db = () => getFirestore(getApp());
export const auth = () => getAuth(getApp());
