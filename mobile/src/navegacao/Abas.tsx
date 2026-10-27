import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { abasDoModo, type Aba } from '@lartie/regras';
import { BarraNavegacao } from '../componentes/BarraNavegacao';
import { useSessao } from '../dados/Sessao';
import { useAvisoParceiro } from '../dados/useAvisoParceiro';
import { CelebracaoFase } from '../feedback/CelebracaoFase';
import { armazenamento } from '../servicos/armazenamento';
import { Casa } from '../telas/casa/Casa';
import { CelebracaoComodo } from '../telas/casa/comum';
import { CasamentoAba } from '../telas/casamento/CasamentoAba';
import { CHAVE_VISITA_PRESENTES, Inicio } from '../telas/inicio/Inicio';
import { Perfil } from '../telas/perfil/Perfil';
import { TelaProvisoria } from '../telas/TelaProvisoria';
import type { ParamsAbas } from './tipos';

// Abas principais. A lista muda com o modo do app (especificação 1.3 e 13.9) e mantém a ordem fixa.
// Etapas 3 e 4: Início, Casamento, Casa e Perfil. Presentes (Etapa 5) e Convidados (Etapa 6)
// continuam provisórias.
const Tab = createBottomTabNavigator<ParamsAbas>();

/** T23 provisória. Guarda a visita para o atalho "reservas novas" do Início. */
function Presentes() {
  useFocusEffect(
    React.useCallback(() => {
      armazenamento.set(CHAVE_VISITA_PRESENTES, Date.now());
    }, []),
  );
  return <TelaProvisoria titulo="Presentes" id="T23" etapa={5} />;
}

function Convidados() {
  return <TelaProvisoria titulo="Convidados" id="T28" etapa={6} />;
}

const TELAS: Record<Aba, React.ComponentType> = {
  inicio: Inicio,
  casamento: CasamentoAba,
  convidados: Convidados,
  casa: Casa,
  presentes: Presentes,
  perfil: Perfil,
};

export function Abas() {
  const { modo } = useSessao();
  useAvisoParceiro();
  const abas = abasDoModo(modo);
  return (
    <>
      <Tab.Navigator
        // A chave força a barra a refazer as abas sem animação de reordenação quando o modo muda.
        key={modo}
        tabBar={(props) => <BarraNavegacao {...props} />}
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        {abas.map((aba) => (
          <Tab.Screen key={aba} name={aba} component={TELAS[aba]} />
        ))}
      </Tab.Navigator>
      <CelebracaoFase />
      <CelebracaoComodo />
    </>
  );
}
