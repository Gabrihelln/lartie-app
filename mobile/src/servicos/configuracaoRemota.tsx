import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getApp } from '@react-native-firebase/app';
import { fetchAndActivate, getBoolean, getRemoteConfig, getString } from '@react-native-firebase/remote-config';
import { ambienteAtual } from './ambiente';
import { registrarErro } from './analytics';

// Chaves do Remote Config:
// - versao_minima: versão mínima do app ("1.2.0"). Abaixo dela, T67 (atualização obrigatória).
// - ia_ativa: liga a assistente Lu e o cadastro por foto. Fora do escopo atual (P14): false.

interface Configuracao {
  versaoMinima: string;
  iaAtiva: boolean;
  carregada: boolean;
}

const PADRAO: Configuracao = { versaoMinima: '0.0.0', iaAtiva: false, carregada: false };

const ContextoConfiguracao = createContext<Configuracao>(PADRAO);

export function ConfiguracaoRemotaProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Configuracao>(PADRAO);

  useEffect(() => {
    // Os emuladores não têm Remote Config: no ambiente demo valem os padrões.
    if (ambienteAtual() === 'demo') {
      setConfig({ ...PADRAO, carregada: true });
      return;
    }
    const rc = getRemoteConfig(getApp());
    rc.defaultConfig = { versao_minima: PADRAO.versaoMinima, ia_ativa: PADRAO.iaAtiva };
    rc.settings = { minimumFetchIntervalMillis: __DEV__ ? 0 : 60 * 60 * 1000, fetchTimeoutMillis: 10000 };
    fetchAndActivate(rc)
      .catch((erro) => registrarErro(erro, 'Remote Config'))
      .finally(() =>
        setConfig({
          versaoMinima: getString(rc, 'versao_minima') || PADRAO.versaoMinima,
          iaAtiva: getBoolean(rc, 'ia_ativa'),
          carregada: true,
        }),
      );
  }, []);

  return <ContextoConfiguracao.Provider value={config}>{children}</ContextoConfiguracao.Provider>;
}

export function useConfiguracaoRemota() {
  return useContext(ContextoConfiguracao);
}
