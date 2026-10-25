import React from 'react';
import { Botao } from '../componentes/Botao';
import { Texto } from '../componentes/Texto';
import { atualizar } from '../dados/gravacao';
import { useSessao } from '../dados/Sessao';
import { sair } from '../servicos/acesso';
import { TelaProvisoria } from './TelaProvisoria';

// Provisória até a Etapa 2: conta nova (onboarding incompleto) cai aqui, como cairia no T06.
export function OnboardingProvisorio() {
  const { casalId, casal, usuario } = useSessao();
  return (
    <TelaProvisoria titulo="O casal" id="T06 · onboarding" etapa={2}>
      <Texto papel="corpo" cor="onSurfaceVariant">
        Conta criada para {casal?.nome_1 ?? usuario?.email}. O onboarding (T06 a T11) chega na Etapa 2.
      </Texto>
      {__DEV__ && casalId ? (
        <Botao
          rotulo="Pular o onboarding (só em desenvolvimento)"
          variante="tonal"
          onPress={() => atualizar(casalId, null, null, { onboarding_concluido: true })}
        />
      ) : null}
      <Botao rotulo="Sair da conta" variante="texto" onPress={sair} />
    </TelaProvisoria>
  );
}
