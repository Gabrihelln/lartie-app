import React from 'react';
import { TelaEstado } from './TelaEstado';

// T47: ação que exige o servidor sem internet. "Continuar sem internet" só quando a tela tem cache.
interface Props {
  onTentarDeNovo: () => void | Promise<unknown>;
  onContinuarSemInternet?: () => void;
}

export function TelaSemConexao({ onTentarDeNovo, onContinuarSemInternet }: Props) {
  return (
    <TelaEstado
      icone="semConexao"
      fundoIcone="surfaceVariant"
      corIcone="onSurfaceVariant"
      titulo="Sem conexão com a internet"
      texto="O que vocês mudarem fica salvo neste celular e é enviado quando a conexão voltar."
      principal={{ rotulo: 'Tentar de novo', onPress: onTentarDeNovo }}
      secundaria={onContinuarSemInternet ? { rotulo: 'Continuar sem internet', onPress: onContinuarSemInternet } : undefined}
    />
  );
}
