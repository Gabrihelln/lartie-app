import React from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { raios, tamanhos } from '@lartie/tokens';
import { Degrade } from '../../componentes/Degrade';
import { SimboloLartie } from '../../componentes/Logo';
import { Texto } from '../../componentes/Texto';
import { espacos, estiloMarca, estiloSlogan, useTema } from '../../tema';

// T01 · Splash (Main.dc.html). Fundo gradient-splash, símbolo e nome em brand-cream (Logo › "Sobre vinho").
// Enquanto a sessão carrega, é só a marca; na primeira abertura sem sessão, mostra "Começar" e "Já tenho conta".

interface Props {
  carregando?: boolean;
  onComecar?: () => void;
  onJaTenhoConta?: () => void;
}

export function Abertura({ carregando = false, onComecar, onJaTenhoConta }: Props) {
  const { cores, sombra, alvoToque } = useTema();
  const inset = useSafeAreaInsets();
  const mostrarBotoes = !carregando && onComecar && onJaTenhoConta;

  return (
    <Degrade nome="gradientSplash" style={estilos.raiz}>
      {/* Sobre o degradê da splash, hora e bateria em claro (a tela de lançamento nativa faz o mesmo). */}
      <StatusBar barStyle="light-content" />
      {/* Anéis decorativos do protótipo (creme a 8% e 6%), saindo pelo canto inferior esquerdo. */}
      <Svg width={520} height={520} style={estilos.aneis} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Circle cx={230} cy={260} r={170} stroke={cores.brandCream} strokeOpacity={0.08} strokeWidth={22} fill="none" />
        <Circle cx={330} cy={260} r={170} stroke={cores.brandCream} strokeOpacity={0.06} strokeWidth={22} fill="none" />
      </Svg>

      <View style={estilos.centro} accessible accessibilityRole="header" accessibilityLabel="Lartiê, casamento e casa nova">
        <SimboloLartie altura={132} cor="brandCream" />
        <Texto style={[estiloMarca(68), estilos.nome, { color: cores.brandCream }]}>Lartiê</Texto>
        <View style={estilos.slogan}>
          <View style={[estilos.traco, { backgroundColor: cores.brandCream }]} />
          <Texto style={[estiloSlogan(), { color: cores.brandCream, letterSpacing: 4 }]}>casamento e casa nova</Texto>
          <View style={[estilos.traco, { backgroundColor: cores.brandCream }]} />
        </View>
      </View>

      <View style={[estilos.rodape, { paddingBottom: inset.bottom + espacos.space8 }]}>
        {carregando ? <ActivityIndicator color={cores.brandCream} accessibilityLabel="Carregando" /> : null}
        {mostrarBotoes ? (
          <>
            <Pressable
              onPress={onComecar}
              accessibilityRole="button"
              style={[estilos.comecar, { backgroundColor: cores.brandCream }, sombra('shadowFab')]}
            >
              <Texto papel="botao" peso="600" style={{ color: cores.onPrimaryContainer }}>
                Começar
              </Texto>
            </Pressable>
            <Pressable onPress={onJaTenhoConta} accessibilityRole="button" style={[estilos.link, { minHeight: alvoToque }]}>
              <Texto papel="metadado" peso="500" style={{ color: cores.brandCream }}>
                Já tenho conta
              </Texto>
            </Pressable>
          </>
        ) : null}
      </View>
    </Degrade>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  aneis: { position: 'absolute', left: -180, bottom: -200 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingBottom: 60 },
  nome: { marginTop: 6 },
  slogan: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  traco: { width: 22, height: 1, opacity: 0.6 },
  rodape: { paddingHorizontal: 28, gap: espacos.space1 + 2, minHeight: 120, justifyContent: 'flex-end' },
  comecar: {
    height: tamanhos.buttonHeight + 2,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { alignItems: 'center', justifyContent: 'center' },
});
