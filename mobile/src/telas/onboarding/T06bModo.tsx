import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { raios } from '@lartie/tokens';
import type { ModoApp } from '@lartie/modelo';
import { Botao } from '../../componentes/Botao';
import { Icone } from '../../componentes/Icone';
import { OpcaoModo } from '../../componentes/OpcaoModo';
import { Texto } from '../../componentes/Texto';
import { useSessao } from '../../dados/Sessao';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';
import { camposModo, TelaOnboarding, useOnboarding } from './comum';

// T06b · O que vocês querem organizar? (ObUso.dc.html). Define o modo do app (13.9).
// "Casamento e casa nova" vem selecionada. "Decidir depois" é um link: grava "indefinido", conclui o
// onboarding sem gerar nada e leva ao T12d.

type Escolha = Exclude<ModoApp, 'indefinido'>;

export function T06bModo() {
  const { cores } = useTema();
  const { usuario } = useSessao();
  const { casal, avancar, concluir } = useOnboarding();
  const inicial: Escolha = casal?.modo_app && casal.modo_app !== 'indefinido' ? casal.modo_app : 'os_dois';
  const [modo, setModo] = useState<Escolha>(inicial);

  const continuar = () => {
    registrarEvento({ nome: 'modo_escolhido', params: { modo } });
    avancar('T06b', camposModo(modo, usuario!.uid), modo);
  };

  const decidirDepois = () => {
    registrarEvento({ nome: 'modo_escolhido', params: { modo: 'indefinido' } });
    concluir(camposModo('indefinido', usuario!.uid));
  };

  return (
    <TelaOnboarding
      passo="T06b"
      modo={modo}
      titulo="O que vocês querem organizar?"
      subtitulo="Isso define a tela inicial e o menu do app. Dá para mudar quando quiserem."
      rodape={
        <>
          <Botao rotulo="Continuar" larguraTotal onPress={continuar} />
          <Botao rotulo="Decidir depois" variante="texto" larguraTotal onPress={decidirDepois} />
        </>
      }
    >
      <View style={estilos.opcoes} accessibilityRole="radiogroup" accessibilityLabel="Modo do app, grupo de opções">
        <OpcaoModo
          titulo="Só o casamento"
          descricao="Checklist, orçamento, fornecedores, convidados e lista de presentes."
          icone="casamento"
          fundoIcone="primaryContainer"
          corIcone="primary"
          selecionado={modo === 'casamento'}
          onPress={() => setModo('casamento')}
        />
        <OpcaoModo
          titulo="Só a casa nova"
          descricao="Enxoval por cômodo, medidas, cadastro por foto e lista de presentes."
          icone="inicio"
          fundoIcone="homeContainer"
          corIcone="home"
          selecionado={modo === 'casa'}
          onPress={() => setModo('casa')}
        />
        <OpcaoModo
          titulo="Casamento e casa nova"
          descricao="Tudo junto, com o progresso dos dois na tela inicial."
          icone="casamento"
          fundoIcone="primaryContainer"
          corIcone="onPrimaryContainer"
          selo="Mais completo"
          selecionado={modo === 'os_dois'}
          onPress={() => setModo('os_dois')}
        />
      </View>
      <View style={[estilos.aviso, { backgroundColor: cores.surface, borderColor: cores.outlineVariant }]}>
        <Icone nome="checkCirculo" cor={cores.home} tamanho={18} />
        <Texto papel="metadado" cor="onSurfaceVariant" style={estilos.textoAviso}>
          Dá para mudar quando quiserem em{' '}
          <Texto papel="metadado" peso="700">
            Perfil › Modo do app
          </Texto>
          . Nada do que vocês cadastrarem é apagado.
        </Texto>
      </View>
    </TelaOnboarding>
  );
}

const estilos = StyleSheet.create({
  opcoes: { gap: espacos.space3 },
  aviso: {
    flexDirection: 'row',
    gap: espacos.space2,
    padding: espacos.space4,
    borderRadius: raios.radiusLg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  textoAviso: { flex: 1 },
});
