import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { abasDoModo, telaInicial, type Aba } from '@lartie/regras';
import { BarraNavegacao } from '../componentes/BarraNavegacao';
import { Botao } from '../componentes/Botao';
import { FabAssistente } from '../componentes/FabAssistente';
import { useSessao } from '../dados/Sessao';
import { useAvisoParceiro } from '../dados/useAvisoParceiro';
import { sair } from '../servicos/acesso';
import { TelaProvisoria } from '../telas/TelaProvisoria';
import type { ParamsAbas } from './tipos';

// Abas principais. A lista muda com o modo do app (especificação 1.3 e 13.9) e mantém a ordem fixa.
// Até as etapas de cada módulo, cada aba abre uma tela provisória.
const Tab = createBottomTabNavigator<ParamsAbas>();

const PROVISORIAS: Record<Aba, { titulo: string; id: string; etapa: number }> = {
  inicio: { titulo: 'Início', id: 'T12', etapa: 3 },
  casamento: { titulo: 'Casamento', id: 'T13', etapa: 3 },
  convidados: { titulo: 'Convidados', id: 'T28', etapa: 6 },
  casa: { titulo: 'Casa', id: 'T18', etapa: 4 },
  presentes: { titulo: 'Presentes', id: 'T23', etapa: 5 },
  perfil: { titulo: 'Perfil', id: 'T33', etapa: 3 },
};

function Inicio() {
  const { modo } = useSessao();
  const navigation = useNavigation();
  const id = telaInicial(modo);
  return (
    <>
      <TelaProvisoria titulo="Início" id={id} etapa={3}>
        {__DEV__ ? <Botao rotulo="Abrir catálogo de componentes" variante="tonal" onPress={() => navigation.navigate('Catalogo')} /> : null}
      </TelaProvisoria>
      <FabAssistente tela={id} onPress={() => {}} />
    </>
  );
}

function provisoria(aba: Aba) {
  const p = PROVISORIAS[aba];
  return function Tela() {
    return <TelaProvisoria titulo={p.titulo} id={p.id} etapa={p.etapa} />;
  };
}

/** Perfil provisório com o "Sair" temporário da Etapa 1 (o T41 definitivo entra na Etapa 3). */
function Perfil() {
  return (
    <TelaProvisoria titulo="Perfil" id="T33" etapa={3}>
      <Botao rotulo="Sair da conta" variante="contornado" onPress={sair} />
    </TelaProvisoria>
  );
}

const TELAS: Record<Aba, React.ComponentType> = {
  inicio: Inicio,
  casamento: provisoria('casamento'),
  convidados: provisoria('convidados'),
  casa: provisoria('casa'),
  presentes: provisoria('presentes'),
  perfil: Perfil,
};

export function Abas() {
  const { modo } = useSessao();
  useAvisoParceiro();
  const abas = abasDoModo(modo);
  return (
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
  );
}
