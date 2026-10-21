import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios, type NomeCor } from '@lartie/tokens';
import { Botao } from '../../componentes/Botao';
import { Degrade } from '../../componentes/Degrade';
import { MarcaLartie } from '../../componentes/Logo';
import { Texto } from '../../componentes/Texto';
import { espacos, useTema } from '../../tema';

// T02 · Boas-vindas (BoasVindas.dc.html): carrossel de 3 páginas, pontos de página e os botões
// "Criar conta" (T03) e "Já tenho conta" (T04). Os cartões são ilustrações do protótipo.

interface Cartao {
  cor: NomeCor;
  rotulo: string;
  valor: string;
  titulo: string;
  barra?: { fracao: number; trilho: NomeCor; preenchimento: NomeCor };
}

interface Pagina {
  titulo: string;
  texto: string;
  cartoes: [Cartao, Cartao, Cartao];
}

const PAGINAS: Pagina[] = [
  {
    titulo: 'Casamento e casa nova no mesmo lugar',
    texto: 'Um checklist com prazos para o grande dia e o enxoval da casa separado por cômodo.',
    cartoes: [
      { cor: 'primary', rotulo: 'Casamento', valor: '23%', titulo: 'Fechar fotógrafo', barra: { fracao: 0.23, trilho: 'primaryContainer', preenchimento: 'primary' } },
      { cor: 'home', rotulo: 'Casa nova', valor: '31%', titulo: 'Cozinha: 18 de 52 itens', barra: { fracao: 0.31, trilho: 'homeContainer', preenchimento: 'home' } },
      { cor: 'primary', rotulo: 'Faltam', valor: '186 dias', titulo: '18 de abril de 2027' },
    ],
  },
  {
    titulo: 'Quantidades certas, sem exageros',
    texto: 'A lista se ajusta ao tamanho do imóvel, ao número de moradores e ao clima da sua cidade.',
    cartoes: [
      { cor: 'home', rotulo: 'Banheiro', valor: '4 un.', titulo: 'Toalhas de banho' },
      { cor: 'home', rotulo: 'Cozinha', valor: '6 un.', titulo: 'Pratos rasos' },
      { cor: 'info', rotulo: 'Curitiba · inverno', valor: '1 un.', titulo: 'Edredom de casal' },
    ],
  },
  {
    titulo: 'A família sabe o que dar',
    texto: 'Compartilhe a lista de presentes por link. Quem abre vê só o que ainda falta e reserva.',
    cartoes: [
      { cor: 'info', rotulo: 'Chá de panela', valor: '9 de 24', titulo: 'Tia Bia reservou o jogo de panelas', barra: { fracao: 9 / 24, trilho: 'infoContainer', preenchimento: 'info' } },
      { cor: 'info', rotulo: 'Reserva', valor: 'Nova', titulo: 'Air fryer · Carla e Diego' },
      { cor: 'primary', rotulo: 'Agradecimentos', valor: '5', titulo: 'Presentes para agradecer' },
    ],
  },
];

/** Posição e inclinação de cada cartão no protótipo (largura 232). */
const POSICOES = [
  { top: 118, left: 24, rotacao: '-3deg' },
  { top: 226, right: 20, rotacao: '2.5deg' },
  { top: 336, left: 44, rotacao: '-1.5deg' },
] as const;

function CartaoFlutuante({ cartao, indice }: { cartao: Cartao; indice: number }) {
  const { cores, sombra } = useTema();
  const p = POSICOES[indice]!;
  return (
    <View
      style={[
        estilos.cartao,
        { top: p.top, left: 'left' in p ? p.left : undefined, right: 'right' in p ? p.right : undefined, transform: [{ rotate: p.rotacao }] },
        { backgroundColor: cores.surface },
        sombra('shadowCard'),
      ]}
    >
      <View style={estilos.cartaoTopo}>
        <View style={[estilos.ponto, { backgroundColor: cores[cartao.cor] }]} />
        <Texto papel="ajuda" peso="600" cor="onSurfaceVariant" style={estilos.flex}>
          {cartao.rotulo}
        </Texto>
        <Texto papel="ajuda" peso="700">
          {cartao.valor}
        </Texto>
      </View>
      <Texto papel="nomeItem">{cartao.titulo}</Texto>
      {cartao.barra ? (
        <View style={[estilos.barra, { backgroundColor: cores[cartao.barra.trilho] }]}>
          <View style={[estilos.barra, { width: `${Math.round(cartao.barra.fracao * 100)}%`, backgroundColor: cores[cartao.barra.preenchimento] }]} />
        </View>
      ) : null}
    </View>
  );
}

export function BoasVindas() {
  const { cores, margem } = useTema();
  const { width } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const lista = useRef<FlatList<Pagina>>(null);
  const [pagina, setPagina] = useState(0);

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = Math.round(e.nativeEvent.contentOffset.x / width);
    if (n !== pagina) setPagina(n);
  };

  const irPara = (n: number) => {
    lista.current?.scrollToIndex({ index: n, animated: true });
    setPagina(n);
  };

  return (
    <View style={[estilos.raiz, { backgroundColor: cores.background }]}>
      <FlatList
        ref={lista}
        data={PAGINAS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.titulo}
        onMomentumScrollEnd={aoRolar}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width }} accessible accessibilityLabel={`${item.titulo}. ${item.texto}`}>
            <Degrade nome="gradientOnboarding" aneis style={estilos.topo}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
                {item.cartoes.map((c, i) => (
                  <CartaoFlutuante key={c.titulo} cartao={c} indice={i} />
                ))}
              </View>
            </Degrade>
            <View style={[estilos.textos, { paddingHorizontal: margem + espacos.space1 }]}>
              <Texto papel="tituloDestaque" accessibilityRole="header">
                {item.titulo}
              </Texto>
              <Texto papel="corpo" cor="onSurfaceVariant">
                {item.texto}
              </Texto>
            </View>
          </View>
        )}
      />

      <View style={[estilos.marca, { top: inset.top + espacos.space4, left: margem + espacos.space1 }]} pointerEvents="none">
        <MarcaLartie />
      </View>

      <View style={[estilos.pontos, { top: 470 + espacos.space2, left: margem + espacos.space1 - 14 }]}>
        {PAGINAS.map((p, i) => (
          <Pressable
            key={p.titulo}
            onPress={() => irPara(i)}
            accessibilityRole="button"
            accessibilityLabel={`Ir para a página ${i + 1}`}
            accessibilityState={{ selected: i === pagina }}
            style={estilos.alvoPonto}
          >
            <View style={[estilos.indicador, { width: i === pagina ? 24 : 8, backgroundColor: i === pagina ? cores.primary : cores.outlineAccent }]} />
          </Pressable>
        ))}
      </View>

      <View style={[estilos.botoes, { paddingHorizontal: margem + espacos.space1, paddingBottom: inset.bottom + espacos.space6 }]}>
        <Botao rotulo="Criar conta" onPress={() => navigation.navigate('CriarConta')} larguraTotal />
        <Botao rotulo="Já tenho conta" variante="contornado" onPress={() => navigation.navigate('Entrar', {})} larguraTotal />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  topo: { height: 470 },
  marca: { position: 'absolute' },
  cartao: {
    position: 'absolute',
    width: 232,
    paddingVertical: 14,
    paddingHorizontal: espacos.space4,
    borderRadius: raios.radiusLg + 2,
    gap: espacos.space2,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ponto: { width: 10, height: 10, borderRadius: raios.radiusFull },
  barra: { height: 6, borderRadius: raios.radiusFull, overflow: 'hidden' },
  textos: { paddingTop: 58, gap: 10 },
  pontos: { position: 'absolute', flexDirection: 'row', gap: espacos.space1 },
  alvoPonto: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  indicador: { height: 8, borderRadius: raios.radiusFull },
  botoes: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 10 },
});
