import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppleButton } from '@invertase/react-native-apple-authentication';
import { raios, tamanhos } from '@lartie/tokens';
import { appleDisponivel } from '../servicos/acesso';
import { espacos, useTema } from '../tema';
import { Texto } from './Texto';

// Botões de login social de T03 e T04. O protótipo mostra "Google" e "Apple" lado a lado; aqui ficam
// empilhados com o texto da especificação ("Continuar com…" / "Entrar com…"), porque as regras da
// Apple pedem o botão oficial com o texto completo (registrado no relatório da Etapa 1).

interface Props {
  modo: 'criar' | 'entrar';
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
  desativado?: boolean;
}

/** "G" oficial do Google (cores da marca do Google, exigidas pelas regras de uso do botão). */
function LogoGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function useUmToquePorVez() {
  const [ocupado, setOcupado] = useState<'google' | 'apple' | null>(null);
  const emAndamento = useRef(false);
  const executar = (qual: 'google' | 'apple', fn: () => Promise<void>) => async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setOcupado(qual);
    try {
      await fn();
    } finally {
      emAndamento.current = false;
      setOcupado(null);
    }
  };
  return { ocupado, executar };
}

export function BotoesSociais({ modo, onGoogle, onApple, desativado }: Props) {
  const { cores, tema } = useTema();
  const { ocupado, executar } = useUmToquePorVez();
  const verbo = modo === 'criar' ? 'Continuar com' : 'Entrar com';

  return (
    <View style={estilos.coluna}>
      <Pressable
        onPress={executar('google', onGoogle)}
        disabled={desativado || ocupado !== null}
        accessibilityRole="button"
        accessibilityLabel={`${verbo} Google`}
        accessibilityState={{ busy: ocupado === 'google' }}
        style={[estilos.botao, { backgroundColor: cores.surface, borderColor: cores.outlineSoft }]}
      >
        {ocupado === 'google' ? (
          <ActivityIndicator color={cores.onSurface} />
        ) : (
          <>
            <LogoGoogle />
            <Texto papel="botao" peso="600">
              {verbo} Google
            </Texto>
          </>
        )}
      </Pressable>
      {Platform.OS === 'ios' && appleDisponivel ? (
        <View style={{ opacity: ocupado === 'apple' ? 0.6 : 1 }}>
          <AppleButton
            buttonType={modo === 'criar' ? AppleButton.Type.CONTINUE : AppleButton.Type.SIGN_IN}
            buttonStyle={tema === 'escuro' ? AppleButton.Style.WHITE : AppleButton.Style.BLACK}
            cornerRadius={tamanhos.buttonHeight / 2}
            style={estilos.apple}
            onPress={executar('apple', onApple)}
          />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  coluna: { gap: espacos.space3 },
  botao: {
    minHeight: tamanhos.buttonHeight,
    borderRadius: raios.radiusFull,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacos.space3,
  },
  apple: { height: tamanhos.buttonHeight, width: '100%' },
});
