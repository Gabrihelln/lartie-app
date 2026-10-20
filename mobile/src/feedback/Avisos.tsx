import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { coresDoTema, raios, tamanhos, type NomeCor } from '@lartie/tokens';
import { Texto } from '../componentes/Texto';
import { espacos, useTema } from '../tema';

// Avisos rápidos (toasts, T54): aparecem acima da barra inferior por 4 s (5 s com ação), um de
// cada vez, em fila. Tipos: neutro, sucesso e erro. Ações reversíveis usam "Desfazer".

export type TipoAviso = 'neutro' | 'sucesso' | 'erro';

export interface Aviso {
  texto: string;
  tipo?: TipoAviso;
  acao?: { rotulo: string; onPress: () => void };
}

interface ValorAvisos {
  mostrar: (aviso: Aviso) => void;
  /** Atalho para ações rápidas reversíveis: "Tarefa concluída" + Desfazer (5 s). */
  comDesfazer: (texto: string, desfazer: () => void) => void;
}

export const DURACAO_AVISO_MS = 4000;
export const DURACAO_AVISO_COM_ACAO_MS = 5000;

const BRANCO = coresDoTema('claro').onPrimary;

const FUNDOS: Record<TipoAviso, NomeCor> = { neutro: 'inverseSurface', sucesso: 'success', erro: 'error' };

const ContextoAvisos = createContext<ValorAvisos | null>(null);

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState<(Aviso & { id: number }) | null>(null);
  const fila = useRef<(Aviso & { id: number })[]>([]);
  const proximoId = useRef(1);

  const mostrar = useCallback((aviso: Aviso) => {
    const item = { ...aviso, id: proximoId.current++ };
    setAtual((agora) => {
      if (agora) {
        fila.current.push(item);
        return agora;
      }
      return item;
    });
  }, []);

  const comDesfazer = useCallback(
    (texto: string, desfazer: () => void) => mostrar({ texto, tipo: 'neutro', acao: { rotulo: 'Desfazer', onPress: desfazer } }),
    [mostrar],
  );

  const fechar = useCallback(() => setAtual(fila.current.shift() ?? null), []);

  const valor = useMemo(() => ({ mostrar, comDesfazer }), [mostrar, comDesfazer]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      {atual ? <CaixaAviso key={atual.id} aviso={atual} onFechar={fechar} /> : null}
    </ContextoAvisos.Provider>
  );
}

function CaixaAviso({ aviso, onFechar }: { aviso: Aviso; onFechar: () => void }) {
  const { cores, plataforma, margem, sombra } = useTema();
  const inset = useSafeAreaInsets();
  const opacidade = useRef(new Animated.Value(0)).current;
  const tipo = aviso.tipo ?? 'neutro';
  const corTexto = tipo === 'neutro' ? cores.onInverseSurface : BRANCO;
  const corAcao = tipo === 'neutro' ? cores.primaryContainer : BRANCO;
  const barra = plataforma === 'ios' ? tamanhos.tabbarIos : tamanhos.navbarAndroid;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(aviso.texto);
    Animated.timing(opacidade, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const t = setTimeout(onFechar, aviso.acao ? DURACAO_AVISO_COM_ACAO_MS : DURACAO_AVISO_MS);
    return () => clearTimeout(t);
  }, [aviso, onFechar, opacidade]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[estilos.posicao, { left: margem, right: margem, bottom: inset.bottom + barra + espacos.space4, opacity: opacidade }]}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[estilos.caixa, { backgroundColor: cores[FUNDOS[tipo]] }, sombra('shadowFab')]}
      >
        <Texto papel="metadado" style={[estilos.texto, { color: corTexto }]}>
          {aviso.texto}
        </Texto>
        {aviso.acao ? (
          <Pressable
            onPress={() => {
              aviso.acao?.onPress();
              onFechar();
            }}
            accessibilityRole="button"
            style={estilos.acao}
          >
            <Texto papel="metadado" peso="700" style={{ color: corAcao }}>
              {aviso.acao.rotulo}
            </Texto>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useAvisos(): ValorAvisos {
  const v = useContext(ContextoAvisos);
  if (!v) throw new Error('useAvisos precisa estar dentro de AvisosProvider');
  return v;
}

const estilos = StyleSheet.create({
  posicao: { position: 'absolute' },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    minHeight: tamanhos.buttonHeight,
    paddingVertical: espacos.space1,
    paddingLeft: espacos.space4,
    paddingRight: espacos.space2,
    borderRadius: raios.radiusMd + 2,
  },
  texto: { flex: 1 },
  acao: { minHeight: tamanhos.touchIos, justifyContent: 'center', paddingHorizontal: espacos.space1 },
});
