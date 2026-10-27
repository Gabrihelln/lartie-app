import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import type { NomeCor } from '@lartie/tokens';
import { Botao } from '../../componentes/Botao';
import { Degrade } from '../../componentes/Degrade';
import { Cartao, Divisoria, TituloSecao } from '../../componentes/Estrutura';
import { Icone, type NomeIcone } from '../../componentes/Icone';
import { IconeApp } from '../../componentes/Logo';
import { Texto } from '../../componentes/Texto';
import { useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useTrocarModo } from '../../dados/useTrocarModo';
import { useConfiguracaoRemota } from '../../servicos/configuracaoRemota';
import { espacos, useTema } from '../../tema';
import type { NavegacaoInicio } from './Inicio';

// T12d · Início: decidir depois (InicioDepois.dc.html). No modo "indefinido" não há checklist nem
// enxoval: a tela explica os dois caminhos, deixa começar com um toque e mostra o que já funciona.
// "Começar pelo…" abre os dados que faltam (T07 ou T08 + T09); o que for preenchido e cancelado
// fica salvo e volta preenchido na próxima vez.

function CartaoCaminho({
  icone,
  fundo,
  cor,
  titulo,
  subtitulo,
  topicos,
  botao,
}: {
  icone: NomeIcone;
  fundo: NomeCor;
  cor: NomeCor;
  titulo: string;
  subtitulo: string;
  topicos: string[];
  botao: React.ReactNode;
}) {
  const { cores } = useTema();
  return (
    <Cartao style={estilos.caminho}>
      <View style={estilos.linhaCentro}>
        <View style={[estilos.circulo, { backgroundColor: cores[fundo] }]}>
          <Icone nome={icone} cor={cores[cor]} />
        </View>
        <View style={estilos.flex}>
          <Texto papel="tituloSecao" peso="700">
            {titulo}
          </Texto>
          <Texto papel="corpo" cor="onSurfaceVariant">
            {subtitulo}
          </Texto>
        </View>
      </View>
      <View style={estilos.topicos}>
        {topicos.map((t) => (
          <View key={t} style={estilos.topico}>
            <View style={[estilos.marcador, { backgroundColor: cores[cor] }]} />
            <Texto papel="corpo" style={estilos.flex}>
              {t}
            </Texto>
          </View>
        ))}
      </View>
      {botao}
    </Cartao>
  );
}

function LinhaUsar({ icone, texto, onPress }: { icone: NomeIcone; texto: string; onPress: () => void }) {
  const { cores, alvoToque } = useTema();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[estilos.linhaUsar, { minHeight: alvoToque + espacos.space4 }]}>
      <Icone nome={icone} cor={cores.primary} />
      <Texto papel="nomeItem" style={estilos.flex}>
        {texto}
      </Texto>
      <Icone nome="setaDireita" cor={cores.onSurfaceVariant} />
    </Pressable>
  );
}

export function InicioDepois() {
  const navigation = useNavigation<NavegacaoInicio>();
  const { casal } = useSessao();
  const { outro } = useNomes();
  const { iaAtiva } = useConfiguracaoRemota();
  const trocar = useTrocarModo();

  return (
    <>
      <Degrade nome="gradientOnboarding" aneis style={estilos.boasVindas}>
        <View style={estilos.conteudoBoasVindas}>
          <IconeApp tamanho={56} />
          <Texto papel="tituloDestaque" peso="700" accessibilityRole="header">
            Por onde vocês querem começar?
          </Texto>
          <Texto papel="corpo" cor="onSurfaceVariant">
            Escolham um caminho e o app monta o plano com o que vocês contarem. Dá para ativar o outro quando quiserem.
          </Texto>
        </View>
      </Degrade>

      <CartaoCaminho
        icone="casamento"
        fundo="primaryContainer"
        cor="primary"
        titulo="Casamento"
        subtitulo="Para quem vai casar"
        topicos={['Checklist com prazos até a data', 'Orçamento e fornecedores', 'Convidados e confirmações']}
        botao={<Botao rotulo="Começar pelo casamento" larguraTotal onPress={() => trocar('casamento', 'inicio_depois')} />}
      />
      <CartaoCaminho
        icone="inicio"
        fundo="homeContainer"
        cor="home"
        titulo="Casa nova"
        subtitulo="Para quem vai mudar"
        topicos={['Enxoval por cômodo, na quantidade certa', 'Medidas e cadastro por foto', 'O que já têm entra como “Já tenho”']}
        botao={<Botao rotulo="Começar pela casa nova" variante="casa" larguraTotal onPress={() => trocar('casa', 'inicio_depois')} />}
      />
      <Botao rotulo="Quero os dois" variante="texto" larguraTotal onPress={() => trocar('os_dois', 'inicio_depois')} />

      <TituloSecao titulo="Já dá para usar" />
      <Cartao semPadding>
        {iaAtiva ? (
          <>
            <LinhaUsar icone="assistente" texto="Pergunte à Lu" onPress={() => navigation.navigate('Provisoria', { titulo: 'Assistente', id: 'T31', etapa: 9 })} />
            <Divisoria />
          </>
        ) : null}
        <LinhaUsar icone="presentes" texto="Lista de presentes" onPress={() => navigation.navigate('presentes')} />
        {casal?.parceiro ? null : (
          <>
            <Divisoria />
            <LinhaUsar icone="convidados" texto={`Convidar ${outro}`} onPress={() => navigation.navigate('Convidar')} />
          </>
        )}
      </Cartao>
    </>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  boasVindas: { borderRadius: raios.radiusXl },
  conteudoBoasVindas: { padding: espacos.space5, gap: espacos.space3 },
  caminho: { gap: espacos.space4 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  circulo: { width: 48, height: 48, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  topicos: { gap: espacos.space2 },
  topico: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2 },
  marcador: { width: 6, height: 6, borderRadius: 3 },
  linhaUsar: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, paddingHorizontal: espacos.space4 },
});
