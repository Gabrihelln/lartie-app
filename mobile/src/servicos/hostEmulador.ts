import { Platform } from 'react-native';

// Para testar num celular de verdade contra os emuladores do Mac, troque pelo IP do Mac na rede
// (ex.: '192.168.0.10') e rode os emuladores com host 0.0.0.0 (já configurado em firebase.json).
export const HOST_EMULADOR = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
