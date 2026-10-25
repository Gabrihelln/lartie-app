#!/bin/sh
# Liga o celular Android (no cabo) aos serviços que rodam no Mac: Metro (8081), API (8100) e
# emuladores do Firebase (Auth 9099, Firestore 8080). Rode de novo se o cabo for desconectado.
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
for porta in 8081 8100 9099 8080; do
  "$ADB" reverse tcp:$porta tcp:$porta >/dev/null && echo "porta $porta ligada"
done
