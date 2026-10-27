import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { coresDoTema, raios, tamanhos, type NomeCor } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

// design-system/componentes/Botao: Principal, Tonal, Contornado, Texto, Destrutivo, WhatsApp.
export type VarianteBotao = 'principal' | 'tonal' | 'contornado' | 'texto' | 'destrutivo' | 'whatsapp' | 'casa';

interface Props {
  rotulo: string;
  onPress: () => void | Promise<unknown>;
  variante?: VarianteBotao;
  desativado?: boolean;
  /** Mostra o indicador e bloqueia toque duplo. Se onPress devolver uma Promise, é automático. */
  carregando?: boolean;
  icone?: NomeIcone;
  /** Largura total (botão principal no rodapé). */
  larguraTotal?: boolean;
  /** Botões de diálogo e de ações compactas usam altura menor (48), sem reduzir o alvo de toque. */
  compacto?: boolean;
  rotuloAcessivel?: string;
  style?: ViewStyle;
}

const CORES_CLARO = coresDoTema('claro');

const CORES: Record<VarianteBotao, { fundo: NomeCor | null; texto: NomeCor; borda?: NomeCor }> = {
  principal: { fundo: 'primary', texto: 'onPrimary' },
  tonal: { fundo: 'primaryContainer', texto: 'onPrimaryContainer' },
  contornado: { fundo: null, texto: 'onSurface', borda: 'outline' },
  texto: { fundo: null, texto: 'primary' },
  destrutivo: { fundo: null, texto: 'error' },
  whatsapp: { fundo: 'whatsapp', texto: 'onPrimary' },
  /** Ações da Casa nova (T12d "Começar pela casa nova"). */
  casa: { fundo: 'home', texto: 'onPrimary' },
};

export function Botao({
  rotulo,
  onPress,
  variante = 'principal',
  desativado = false,
  carregando: carregandoExterno = false,
  icone,
  larguraTotal = false,
  compacto = false,
  rotuloAcessivel,
  style,
}: Props) {
  const { cores, alvoToque } = useTema();
  const [carregandoInterno, setCarregandoInterno] = useState(false);
  const emAndamento = useRef(false);
  const carregando = carregandoExterno || carregandoInterno;
  const def = CORES[variante];
  // WhatsApp leva sempre texto branco (o token whatsapp é igual nos dois temas): on-primary do tema claro.
  const corTexto = variante === 'whatsapp' ? CORES_CLARO.onPrimary : cores[def.texto];

  const tocar = async () => {
    if (emAndamento.current || desativado || carregando) return;
    emAndamento.current = true;
    try {
      const r = onPress();
      if (r && typeof (r as Promise<unknown>).then === 'function') {
        setCarregandoInterno(true);
        await r;
      }
    } finally {
      emAndamento.current = false;
      setCarregandoInterno(false);
    }
  };

  const altura = compacto ? tamanhos.touchAndroid : tamanhos.buttonHeight;

  return (
    <Pressable
      onPress={tocar}
      disabled={desativado || carregando}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? rotulo}
      accessibilityState={{ disabled: desativado, busy: carregando }}
      hitSlop={Math.max(0, (alvoToque - altura) / 2)}
      android_ripple={{ color: cores.outlineVariant, borderless: false }}
      style={({ pressed }) => [
        estilos.base,
        {
          minHeight: Math.max(altura, alvoToque),
          backgroundColor: def.fundo ? cores[def.fundo] : 'transparent',
          borderColor: def.borda ? cores[def.borda] : 'transparent',
          borderWidth: def.borda ? 1.5 : 0,
          opacity: desativado ? 0.38 : pressed ? 0.85 : 1,
          alignSelf: larguraTotal ? 'stretch' : 'auto',
          paddingHorizontal: variante === 'texto' || variante === 'destrutivo' ? espacos.space2 : espacos.space6,
        },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} accessibilityLabel="Carregando" />
      ) : (
        <View style={estilos.conteudo}>
          {icone ? <Icone nome={icone} cor={corTexto} tamanho={20} /> : null}
          <Texto papel="botao" style={{ color: corTexto }} alinhamento="center">
            {rotulo}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space2,
  },
});
