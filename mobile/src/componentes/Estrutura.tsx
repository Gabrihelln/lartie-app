import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { raios, tamanhos, type NomeCor } from '@lartie/tokens';
import { espacos, useTema } from '../tema';
import { BotaoVoltar } from './BotaoVoltar';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

// Estrutura comum das telas da Etapa 3: tela de aba (título grande, ação "+"), tela empilhada
// (Voltar, título central, ação à direita, botão principal no rodapé), cartão e barra de progresso.

interface PropsTelaAba {
  titulo?: string;
  /** Botão redondo "+" (ou outro ícone) à direita do título. */
  acao?: { icone: NomeIcone; rotulo: string; onPress: () => void };
  /** Cabeçalho próprio no lugar do título (Início). */
  cabecalho?: ReactNode;
  /** Puxar para baixo atualiza (2.3). As leituras são em tempo real; o gesto só confirma. */
  onAtualizar?: () => void;
  children: ReactNode;
  /** Por cima da lista (ex.: FAB). */
  sobreposto?: ReactNode;
  rolagem?: React.Ref<ScrollView>;
  /** Trava a rolagem (ex.: enquanto arrasta uma tarefa no T13). */
  rolagemTravada?: boolean;
}

export function TelaAba({ titulo, acao, cabecalho, onAtualizar, children, sobreposto, rolagem, rolagemTravada }: PropsTelaAba) {
  const { cores, margem, sombra } = useTema();
  const inset = useSafeAreaInsets();
  const [atualizando, setAtualizando] = React.useState(false);
  return (
    <View style={[estilos.raiz, { backgroundColor: cores.background }]}>
      <ScrollView
        ref={rolagem}
        scrollEnabled={!rolagemTravada}
        contentContainerStyle={[estilos.conteudoAba, { paddingTop: inset.top + espacos.space3, paddingHorizontal: margem }]}
        refreshControl={
          onAtualizar ? (
            <RefreshControl
              refreshing={atualizando}
              tintColor={cores.primary}
              colors={[cores.primary]}
              onRefresh={() => {
                setAtualizando(true);
                onAtualizar();
                setTimeout(() => setAtualizando(false), 600);
              }}
            />
          ) : undefined
        }
      >
        {cabecalho ?? (
          <View style={estilos.linhaTitulo}>
            <Texto papel="tituloAba" accessibilityRole="header" style={estilos.flex}>
              {titulo}
            </Texto>
            {acao ? (
              <Pressable
                onPress={acao.onPress}
                accessibilityRole="button"
                accessibilityLabel={acao.rotulo}
                style={[estilos.acaoRedonda, { backgroundColor: cores.primary }, sombra('shadowFab')]}
              >
                <Icone nome={acao.icone} cor={cores.onPrimary} tamanho={28} />
              </Pressable>
            ) : null}
          </View>
        )}
        {children}
      </ScrollView>
      {sobreposto}
    </View>
  );
}

interface PropsTelaPilha {
  titulo: string;
  onVoltar?: () => void;
  direita?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
  /** Título grande abaixo do cabeçalho (T33b), em vez do título central. */
  tituloGrande?: boolean;
}

export function TelaPilha({ titulo, onVoltar, direita, rodape, children, tituloGrande }: PropsTelaPilha) {
  const { cores, margem } = useTema();
  const inset = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[estilos.raiz, { backgroundColor: cores.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[estilos.cabecalhoPilha, { paddingTop: inset.top + espacos.space1, paddingHorizontal: margem - espacos.space1 }]}>
        <BotaoVoltar onPress={onVoltar} />
        <Texto papel="nomeItem" peso="700" alinhamento="center" style={estilos.flex} accessibilityRole="header" numberOfLines={1}>
          {tituloGrande ? '' : titulo}
        </Texto>
        <View style={estilos.direita}>{direita}</View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[estilos.conteudoPilha, { paddingHorizontal: margem }]}>
        {tituloGrande ? (
          <Texto papel="tituloAba" accessibilityRole="header">
            {titulo}
          </Texto>
        ) : null}
        {children}
      </ScrollView>
      {rodape ? (
        <View
          style={[
            estilos.rodape,
            {
              paddingHorizontal: margem,
              paddingBottom: Math.max(inset.bottom, espacos.space4) + espacos.space1,
              borderTopColor: cores.divider,
              backgroundColor: cores.background,
            },
          ]}
        >
          {rodape}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

interface PropsCartao {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  rotuloAcessivel?: string;
  /** Cor de fundo (padrão surface). */
  fundo?: NomeCor;
  /** Borda tracejada (cartões "Vão casar também?"). */
  tracejado?: boolean;
  semBorda?: boolean;
  /** Sem espaço interno (listas com divisórias). */
  semPadding?: boolean;
  destacado?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Cartao({ children, onPress, onLongPress, rotuloAcessivel, fundo = 'surface', tracejado, semBorda, semPadding, destacado, style }: PropsCartao) {
  const { cores } = useTema();
  const visual: StyleProp<ViewStyle> = [
    estilos.cartao,
    semPadding ? null : estilos.cartaoPadding,
    {
      backgroundColor: cores[fundo],
      borderColor: destacado ? cores.primary : tracejado ? cores.outlineSoft : cores.outlineVariant,
      borderWidth: semBorda ? 0 : destacado ? 2 : 1,
      borderStyle: tracejado ? 'dashed' : 'solid',
    },
    style,
  ];
  if (!onPress && !onLongPress) return <View style={visual}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      style={({ pressed }) => [visual, pressed ? { opacity: 0.85 } : null]}
    >
      {children}
    </Pressable>
  );
}

/** Divisória entre linhas de um cartão-lista. */
export function Divisoria() {
  const { cores } = useTema();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: cores.divider }} />;
}

interface PropsBarra {
  fracao: number;
  cor: NomeCor;
  trilho: NomeCor;
  altura?: number;
}

export function BarraProgresso({ fracao, cor, trilho, altura = espacos.space2 }: PropsBarra) {
  const { cores } = useTema();
  const largura = `${Math.round(Math.max(0, Math.min(1, fracao)) * 100)}%` as const;
  return (
    <View style={[estilos.barra, { height: altura, backgroundColor: cores[trilho] }]}>
      <View style={[estilos.barra, { height: altura, width: largura, backgroundColor: cores[cor] }]} />
    </View>
  );
}

/** Título de seção com link à direita ("Próximas tarefas" · "Ver todas"). */
export function TituloSecao({ titulo, link }: { titulo: string; link?: { rotulo: string; onPress: () => void } }) {
  const { alvoToque } = useTema();
  return (
    <View style={estilos.linhaSecao}>
      <Texto papel="tituloSecao" peso="700" accessibilityRole="header" style={estilos.flex}>
        {titulo}
      </Texto>
      {link ? (
        <Pressable onPress={link.onPress} accessibilityRole="link" hitSlop={8} style={{ minHeight: alvoToque, justifyContent: 'center' }}>
          <Texto papel="corpo" peso="600" cor="primary" style={estilos.sublinhado}>
            {link.rotulo}
          </Texto>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Rótulo em caixa alta de grupo do Perfil ("NOSSO PLANO"). */
export function RotuloGrupo({ texto }: { texto: string }) {
  return (
    <Texto papel="selo" peso="700" cor="onSurfaceVariant" style={estilos.rotuloGrupo} accessibilityRole="header">
      {texto.toUpperCase()}
    </Texto>
  );
}

/** Linha de lista com valor à direita e seta (Perfil, vínculos). */
export function LinhaNavegavel({
  titulo,
  valor,
  onPress,
  cor = 'onSurface',
  semSeta,
}: {
  titulo: string;
  valor?: string | null;
  onPress: () => void;
  cor?: NomeCor;
  semSeta?: boolean;
}) {
  const { cores, alvoToque } = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={valor ? `${titulo}, ${valor}` : titulo}
      style={({ pressed }) => [estilos.linhaNav, { minHeight: alvoToque + espacos.space4 }, pressed ? { backgroundColor: cores.surfaceVariant } : null]}
    >
      <Texto papel="nomeItem" cor={cor} style={estilos.flex}>
        {titulo}
      </Texto>
      {valor ? (
        <Texto papel="metadado" cor="onSurfaceVariant" numberOfLines={1} style={estilos.valorNav}>
          {valor}
        </Texto>
      ) : null}
      {semSeta ? null : <Icone nome="setaDireita" cor={cores.onSurfaceVariant} tamanho={tamanhos.iconUi} />}
    </Pressable>
  );
}

/** Avatar com iniciais (fornecedor). */
export function AvatarIniciais({ texto, tamanho = 48 }: { texto: string; tamanho?: number }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.avatar, { width: tamanho, height: tamanho, backgroundColor: cores.primaryContainer }]}>
      <Texto papel="nomeItem" peso="700" cor="primary">
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  conteudoAba: { paddingBottom: 120, gap: espacos.space4 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, minHeight: tamanhos.fab },
  acaoRedonda: { width: tamanhos.fab - 12, height: tamanhos.fab - 12, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  cabecalhoPilha: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2, paddingBottom: espacos.space1 },
  direita: { minWidth: tamanhos.touchIos, alignItems: 'flex-end' },
  conteudoPilha: { paddingTop: espacos.space2, paddingBottom: espacos.space8, gap: espacos.space4 },
  rodape: { paddingTop: espacos.space3, gap: espacos.space2, borderTopWidth: StyleSheet.hairlineWidth },
  cartao: { borderRadius: raios.radiusXl, overflow: 'hidden' },
  cartaoPadding: { padding: espacos.space4 },
  barra: { borderRadius: raios.radiusFull, overflow: 'hidden' },
  linhaSecao: { flexDirection: 'row', alignItems: 'center', marginTop: espacos.space2 },
  sublinhado: { textDecorationLine: 'underline' },
  rotuloGrupo: { letterSpacing: 1, marginTop: espacos.space2, marginLeft: espacos.space1 },
  linhaNav: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2, paddingHorizontal: espacos.space4 },
  valorNav: { maxWidth: '50%' },
  avatar: { borderRadius: raios.radiusMd, alignItems: 'center', justifyContent: 'center' },
});
