#!/bin/sh
# Escolhe o ambiente do Firebase do app: demo (emuladores locais), dev (lartie-dev) ou prod (lartie-prod).
#   npm run ambiente -- demo
# iOS: copia ios/Lartie/Firebase/<ambiente>/GoogleService-Info.plist para ios/Lartie/GoogleService-Info.plist.
# Android: cada ambiente é um flavor (demoDebug, devDebug, prodRelease) e lê app/src/<ambiente>/google-services.json.
set -e
AMBIENTE="${1:-demo}"
cd "$(dirname "$0")/.."
ORIGEM="ios/Lartie/Firebase/$AMBIENTE/GoogleService-Info.plist"
if [ ! -f "$ORIGEM" ]; then
  echo "Falta $ORIGEM. Baixe o GoogleService-Info.plist do app iOS do projeto Firebase desse ambiente e coloque nessa pasta."
  exit 1
fi
cp "$ORIGEM" ios/Lartie/GoogleService-Info.plist
echo "iOS usando o ambiente $AMBIENTE."
