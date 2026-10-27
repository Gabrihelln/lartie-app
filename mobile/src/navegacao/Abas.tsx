import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { abasDoModo, type Aba } from '@lartie/regras';
import { BarraNavegacao } from '../componentes/BarraNavegacao';
import { useSessao } from '../dados/Sessao';
import { useAvisoParceiro } from '../dados/useAvisoParceiro';
import { CelebracaoFase } from '../feedback/CelebracaoFase';
import { Casa } from '../telas/casa/Casa';
import { CelebracaoComodo } from '../telas/casa/comum';
import { CasamentoAba } from '../telas/casamento/CasamentoAba';
import { Inicio } from '../telas/inicio/Inicio';
import { Perfil } from '../telas/perfil/Perfil';
import { Presentes } from '../telas/presentes/Presentes';
import { useNavigation } from '@react-navigation/native';
import { TelaAba } from '../componentes/Estrutura';
import { Convidados } from '../telas/convidados/Convidados';
import type { ParamsAbas } from './tipos';

// Abas principais. A lista muda com o modo do app (especificação 1.3 e 13.9) e mantém a ordem fixa.
// Todas as abas do MVP (Etapas 3 a 6).
const Tab = createBottomTabNavigator<ParamsAbas>();

/** Modo "casamento": T28 na aba própria (1.3). */
function ConvidadosAba() {
  const navigation = useNavigation();
  return (
    <TelaAba titulo="Convidados" acao={{ icone: 'adicionar', rotulo: 'Novo grupo', onPress: () => navigation.navigate('Grupo', {}) }}>
      <Convidados />
    </TelaAba>
  );
}

const TELAS: Record<Aba, React.ComponentType> = {
  inicio: Inicio,
  casamento: CasamentoAba,
  convidados: ConvidadosAba,
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
