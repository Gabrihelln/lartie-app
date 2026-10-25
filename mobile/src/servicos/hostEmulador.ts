// Endereço dos serviços que rodam no Mac (emuladores do Firebase e API em demo/dev).
// - Simulador do iOS: localhost é o próprio Mac.
// - Android no cabo (ou no emulador): `npm run android:reverse` faz o localhost do aparelho apontar
//   para o Mac (adb reverse), como no Newzi.
// - iPhone físico sem cabo: troque pelo IP do Mac na rede (ex.: '192.168.0.10').
export const HOST_EMULADOR = 'localhost';
