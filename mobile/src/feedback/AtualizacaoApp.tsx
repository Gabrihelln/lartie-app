import React from 'react';
import { Linking, Platform } from 'react-native';
import { TelaEstado } from './TelaEstado';

// T67: versão mínima não atendida. Sem botão de fechar; "Atualizar agora" abre a loja.
// Os links das lojas ficam [a definir] até o app ser publicado (Etapa 10).
const LINK_LOJA = Platform.select({
  ios: 'itms-apps://apps.apple.com/app/id[a-definir]',
  default: 'market://details?id=com.lartie.app',
});

export function AtualizacaoApp({ nomeParceiro }: { nomeParceiro?: string | null }) {
  const texto = nomeParceiro
    ? `Atualize o app para continuar sincronizando com ${nomeParceiro}. Leva menos de um minuto.`
    : 'Atualize o app para continuar sincronizando. Leva menos de um minuto.';
  return (
    <TelaEstado
      icone="celebracao"
      fundoIcone="primaryContainer"
      corIcone="primary"
      titulo="Nova versão do Lartiê"
      texto={texto}
      principal={{ rotulo: 'Atualizar agora', onPress: () => Linking.openURL(LINK_LOJA) }}
    />
  );
}
