import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Estado da conexão (especificação 2.2). Sem internet, o app continua com o cache do Firestore e
// as alterações ficam na fila; ações que exigem o servidor mostram T47.

const ContextoConexao = createContext<{ online: boolean }>({ online: true });

export function ConexaoProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(
    () =>
      NetInfo.addEventListener((estado) => {
        // isInternetReachable começa como null enquanto o sistema verifica: não alarma antes da hora.
        setOnline(estado.isConnected !== false && estado.isInternetReachable !== false);
      }),
    [],
  );
  return <ContextoConexao.Provider value={{ online }}>{children}</ContextoConexao.Provider>;
}

export function useConexao() {
  return useContext(ContextoConexao);
}
