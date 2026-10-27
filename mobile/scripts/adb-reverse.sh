#!/bin/sh
# Liga o celular Android (no cabo) aos serviços que rodam no Mac: Metro (8081), API (8100) e
# emuladores do Firebase (Auth 9099, Firestore 8080) e a página do convidado (3000). Rode de novo
# se o cabo for desconectado.
# Neste Mac, o adb trava no acesso nativo ao USB do moto g31; o modo libusb funciona.
export ADB_LIBUSB=1
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
for porta in 8081 8100 9099 8080 3000; do
  "$ADB" reverse tcp:$porta tcp:$porta >/dev/null && echo "porta $porta ligada"
done
