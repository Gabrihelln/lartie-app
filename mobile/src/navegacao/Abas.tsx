import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { abasDoModo, type Aba } from '@lartie/regras';
import { BarraNavegacao } from '../componentes/BarraNavegacao';
import { Botao } from '../componentes/Botao';
import { useSessao } from '../dados/Sessao';
import { useAvisoParceiro } from '../dados/useAvisoParceiro';
import { CelebracaoFase } from '../feedback/CelebracaoFase';
import { armazenamento } from '../servicos/armazenamento';
import { CasamentoAba } from '../telas/casamento/CasamentoAba';
import { CHAVE_VISITA_PRESENTES, Inicio } from '../telas/inicio/Inicio';
import { Perfil } from '../telas/perfil/Perfil';
import { TelaProvisoria } from '../telas/TelaProvisoria';
import type { ParamsAbas } from './tipos';

// Abas principais. A lista muda com o modo do app (especificação 1.3 e 13.9) e mantém a ordem fixa.
// Etapa 3: Início, Casamento e Perfil. Casa (Etapa 4), Presentes (Etapa 5) e Convidados (Etapa 6)
// continuam provisórias.
const Tab = createBottomTabNavigator<ParamsAbas>();

/** T18 provisória. No modo "casa", o orçamento (só da casa) abre por aqui (13.9). */
function Casa() {
  const { modo } = useSessao();
  const navigation = useNavigation();
  return (
    <TelaProvisoria titulo="Casa" id="T18" etapa={4}>
      {modo === 'casa' ? <Botao rotulo="Orçamento da casa" variante="tonal" onPress={() => navigation.navigate('OrcamentoCasa')} /> : null}
      {__DEV__ ? <Botao rotulo="Abrir catálogo de componentes" variante="texto" onPress={() => navigation.navigate('Catalogo')} /> : null}
    </TelaProvisoria>
  );
}

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
    </>
  );
}
