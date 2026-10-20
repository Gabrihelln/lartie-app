import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { SessaoProvider, useSessao } from './src/dados/Sessao';
import { AtualizacaoApp } from './src/feedback/AtualizacaoApp';
import { AvisoSemConexao } from './src/feedback/AvisoSemConexao';
import { AvisosProvider } from './src/feedback/Avisos';
import { DialogoProvider } from './src/feedback/Dialogo';
import { Raiz } from './src/navegacao/Raiz';
import { ConexaoProvider } from './src/servicos/conexao';
import { ConfiguracaoRemotaProvider, useConfiguracaoRemota } from './src/servicos/configuracaoRemota';
import { iniciarFirebase } from './src/servicos/firebase';
import { versaoAbaixoDe } from './src/servicos/versao';
import { TemaProvider, useTema } from './src/tema';

iniciarFirebase();

/** T67: com a versão abaixo da mínima (Remote Config), o app mostra só a tela de atualização. */
function Conteudo() {
  const { versaoMinima } = useConfiguracaoRemota();
  const { casal } = useSessao();
  const { tema, cores } = useTema();
  const precisaAtualizar = versaoAbaixoDe(DeviceInfo.getVersion(), versaoMinima);

  return (
    <View style={{ flex: 1, backgroundColor: cores.background }}>
      <StatusBar barStyle={tema === 'escuro' ? 'light-content' : 'dark-content'} />
      {precisaAtualizar ? <AtualizacaoApp nomeParceiro={casal?.nome_2} /> : <Raiz />}
      <AvisoSemConexao />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <ConexaoProvider>
          <ConfiguracaoRemotaProvider>
            <SessaoProvider>
              <DialogoProvider>
                <AvisosProvider>
                  <Conteudo />
                </AvisosProvider>
              </DialogoProvider>
            </SessaoProvider>
          </ConfiguracaoRemotaProvider>
        </ConexaoProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}
