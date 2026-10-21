import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { coresDoTema, raios, tamanhos, type NomeCor } from '@lartie/tokens';
import { Icone, type NomeIcone } from '../componentes/Icone';
import { Texto } from '../componentes/Texto';
import { espacos, estiloTexto, useTema } from '../tema';

// Diálogo de confirmação no padrão T34 a T43 (especificação Seção 15): véu scrim, ícone opcional,
// título, texto, botão da esquerda cancela (tonal), o da direita confirma (cor da ação).
// Tocar fora ou voltar = cancelar. Lado a lado, ou empilhados se os rótulos forem longos.

export type TomDialogo = 'padrao' | 'destrutivo' | 'whatsapp';

export interface OpcoesDialogo {
  titulo: string;
  texto?: string;
  icone?: NomeIcone;
  tom?: TomDialogo;
  /** null = diálogo de um botão só (ex.: T51 "Ver outros presentes"). */
  cancelar?: string | null;
  confirmar: string;
  /** T42: o botão só ativa quando o texto digitado for exatamente este (ex.: "EXCLUIR"). */
  textoExigido?: string;
  rotuloCampo?: string;
}

interface Pendente extends OpcoesDialogo {
  resolver: (confirmou: boolean) => void;
}

interface ValorDialogo {
  confirmar: (opcoes: OpcoesDialogo) => Promise<boolean>;
  /** T48: "Não foi possível salvar". Resolve true se a pessoa tocar em "Tentar de novo". */
  erroAoSalvar: () => Promise<boolean>;
}

const ContextoDialogo = createContext<ValorDialogo | null>(null);

const BRANCO = coresDoTema('claro').onPrimary;

const TONS: Record<TomDialogo, { fundoIcone: NomeCor; corIcone: NomeCor; botao: NomeCor; textoBotao: NomeCor | 'branco' }> = {
  padrao: { fundoIcone: 'primaryContainer', corIcone: 'primary', botao: 'primary', textoBotao: 'onPrimary' },
  destrutivo: { fundoIcone: 'errorContainer', corIcone: 'error', botao: 'error', textoBotao: 'onPrimary' },
  whatsapp: { fundoIcone: 'successContainer', corIcone: 'whatsapp', botao: 'whatsapp', textoBotao: 'branco' },
};

export function DialogoProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState<Pendente | null>(null);
  const fila = useRef<Pendente[]>([]);

  const abrirProximo = useCallback(() => {
    setAtual(fila.current.shift() ?? null);
  }, []);

  const confirmar = useCallback(
    (opcoes: OpcoesDialogo) =>
      new Promise<boolean>((resolver) => {
        const pendente = { ...opcoes, resolver };
        setAtual((agora) => {
          if (agora) {
            fila.current.push(pendente);
            return agora;
          }
          return pendente;
        });
        AccessibilityInfo.announceForAccessibility(opcoes.titulo);
      }),
    [],
  );

  const erroAoSalvar = useCallback(
    () =>
      confirmar({
        icone: 'erro',
        tom: 'padrao',
        titulo: 'Não foi possível salvar',
        texto: 'Algo deu errado do nosso lado. Nada do que vocês digitaram foi perdido.',
        cancelar: 'Agora não',
        confirmar: 'Tentar de novo',
      }),
    [confirmar],
  );

  const responder = (confirmou: boolean) => {
    atual?.resolver(confirmou);
    abrirProximo();
  };

  const valor = useMemo(() => ({ confirmar, erroAoSalvar }), [confirmar, erroAoSalvar]);

  return (
    <ContextoDialogo.Provider value={valor}>
      {children}
      {atual ? <JanelaDialogo opcoes={atual} onResponder={responder} /> : null}
    </ContextoDialogo.Provider>
  );
}

function JanelaDialogo({ opcoes, onResponder }: { opcoes: OpcoesDialogo; onResponder: (c: boolean) => void }) {
  const { cores, sombra, alvoToque } = useTema();
  const [digitado, setDigitado] = useState('');
  const tom = TONS[opcoes.tom ?? 'padrao'];
  const cancelar = opcoes.cancelar === undefined ? 'Cancelar' : opcoes.cancelar;
  const liberado = !opcoes.textoExigido || digitado === opcoes.textoExigido;
  const empilhar = (cancelar?.length ?? 0) + opcoes.confirmar.length > 24;
  const corTextoConfirmar = tom.textoBotao === 'branco' ? BRANCO : cores[tom.textoBotao];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onResponder(false)} statusBarTranslucent>
      <View style={estilos.raiz}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: cores.scrim }]}
          onPress={() => onResponder(false)}
          accessibilityRole="button"
          accessibilityLabel={cancelar ?? 'Fechar'}
        />
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[estilos.caixa, { backgroundColor: cores.surface }, sombra('shadowFab')]}
        >
          {opcoes.icone ? (
            <View style={[estilos.icone, { backgroundColor: cores[tom.fundoIcone] }]}>
              <Icone nome={opcoes.icone} cor={cores[tom.corIcone]} />
            </View>
          ) : null}
          <Texto papel="tituloSecao" peso="700" accessibilityRole="header">
            {opcoes.titulo}
          </Texto>
          {opcoes.texto ? (
            <Texto papel="metadado" cor="onSurfaceVariant">
              {opcoes.texto}
            </Texto>
          ) : null}
          {opcoes.textoExigido ? (
            <TextInput
              value={digitado}
              onChangeText={setDigitado}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={opcoes.rotuloCampo ?? `Digite ${opcoes.textoExigido}`}
              placeholderTextColor={cores.onSurfaceVariant}
              accessibilityLabel={opcoes.rotuloCampo ?? `Digite ${opcoes.textoExigido}`}
              style={[
                estiloTexto('corpo'),
                estilos.campo,
                { color: cores.onSurface, borderColor: cores.outline, backgroundColor: cores.surface },
              ]}
            />
          ) : null}
          <View style={[estilos.botoes, empilhar ? estilos.empilhados : null]}>
            {cancelar ? (
              <Pressable
                onPress={() => onResponder(false)}
                accessibilityRole="button"
                style={[estilos.botao, { backgroundColor: cores.surfaceVariant, minHeight: alvoToque }, empilhar ? null : estilos.metade]}
              >
                <Texto papel="botao" peso="600" alinhamento="center">
                  {cancelar}
                </Texto>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => liberado && onResponder(true)}
              disabled={!liberado}
              accessibilityRole="button"
              accessibilityState={{ disabled: !liberado }}
              style={[
                estilos.botao,
                { backgroundColor: cores[tom.botao], opacity: liberado ? 1 : 0.38, minHeight: alvoToque },
                empilhar ? null : estilos.metade,
              ]}
            >
              <Texto papel="botao" peso="600" alinhamento="center" style={{ color: corTextoConfirmar }}>
                {opcoes.confirmar}
              </Texto>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function useDialogo(): ValorDialogo {
  const v = useContext(ContextoDialogo);
  if (!v) throw new Error('useDialogo precisa estar dentro de DialogoProvider');
  return v;
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacos.space6 },
  caixa: {
    alignSelf: 'stretch',
    borderRadius: raios.radiusXl,
    padding: espacos.space6,
    gap: espacos.space3,
  },
  icone: { width: 48, height: 48, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  campo: {
    minHeight: tamanhos.fieldHeight,
    borderRadius: raios.radiusMd,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  botoes: { flexDirection: 'row', gap: espacos.space2, marginTop: espacos.space2 },
  empilhados: { flexDirection: 'column-reverse' },
  botao: {
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacos.space3,
  },
  metade: { flex: 1 },
});
