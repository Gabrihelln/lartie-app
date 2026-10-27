import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { raios, tamanhos } from '@lartie/tokens';
import type { EstadoItem } from '@lartie/modelo';
import { FASES_ENXOVAL, moduloVisivel, progressoCasa } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { formatarReais } from '../../componentes/CamposMascarados';
import { Chip } from '../../componentes/Chip';
import { BarraProgresso, Cartao } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { BotaoVoltar } from '../../componentes/BotaoVoltar';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote } from '../../dados/gravacao';
import { useComodos, useItens, useListaItens } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { espacos, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';
import { BotaoEstado, useEstadoItem } from './comum';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// T19 · Cômodo (Comodo.dc.html). Filtros por estado, botão de estado com as regras do T19 (em
// useEstadoItem), "Medidas" (T21), "+" (T20 neste cômodo) e o menu: renomear e excluir o cômodo
// (pergunta se move os itens para outro cômodo ou exclui junto).

type Filtro = EstadoItem | 'todos';
const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'falta', rotulo: 'Falta' },
  { valor: 'ja_tenho', rotulo: 'Já tenho' },
  { valor: 'na_lista', rotulo: 'Na lista de presentes' },
];

export function Comodo() {
  const { modo } = useSessao();
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'casa'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casa" />;
  if (!moduloVisivel(modo, 'casa')) return null;
  return <TelaComodo />;
}

function TelaComodo() {
  const { cores, margem, sombra } = useTema();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Comodo'>>();
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const comodos = useComodos();
  const itens = useItens();
  const listaItens = useListaItens().dados;
  const estado = useEstadoItem();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [menu, setMenu] = useState(false);
  const [renomear, setRenomear] = useState<string | null>(null);
  const [mover, setMover] = useState(false);
  const comodo = comodos.dados.find(c => c.id === params.id);
  const aoFalhar = () => erroAoSalvar();

  if (comodos.carregando || itens.carregando) return <EsqueletoLista />;
  if (!comodo) {
    return (
      <View
        style={[
          estilos.raiz,
          {
            backgroundColor: cores.background,
            paddingTop: inset.top,
            paddingHorizontal: margem,
          },
        ]}
      >
        <BotaoVoltar />
        <Texto papel="corpo" cor="onSurfaceVariant">
          Este cômodo foi excluído.
        </Texto>
      </View>
    );
  }

  const doComodo = itens.dados
    .filter(i => i.comodo_id === comodo.id)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const p = progressoCasa(doComodo);
  const lista =
    filtro === 'todos' ? doComodo : doComodo.filter(i => i.estado === filtro);
  const outros = comodos.dados
    .filter(c => c.id !== comodo.id)
    .sort((a, b) => a.ordem - b.ordem);

  const salvarNome = () => {
    const n = renomear?.trim();
    if (!casalId || !n) return;
    atualizar(casalId, 'comodos', comodo.id, { nome: n }, aoFalhar);
    setRenomear(null);
    avisos.mostrar({ texto: 'Cômodo renomeado', tipo: 'sucesso' });
  };

  const excluirComodo = async (destino: string | null) => {
    if (!casalId) return;
    setMover(false);
    if (destino === null) {
      const ok = await confirmar({
        icone: 'excluir',
        tom: 'destrutivo',
        titulo: `Excluir ${comodo.nome}?`,
        texto: doComodo.length
          ? `Os ${doComodo.length} itens do cômodo também saem. Não dá para desfazer.`
          : 'Não dá para desfazer.',
        cancelar: 'Cancelar',
        confirmar: 'Excluir',
      });
      if (!ok) return;
    }
    emLote(
      casalId,
      [
        ...doComodo.map(i =>
          destino
            ? {
                tipo: 'atualizar' as const,
                sub: 'itens' as const,
                id: i.id,
                dados: { comodo_id: destino, parede_destino: null },
              }
            : { tipo: 'excluir' as const, sub: 'itens' as const, id: i.id },
        ),
        // Itens excluídos também saem das listas de presentes (13.8). Reservas: Etapa 5.
        ...(destino
          ? []
          : listaItens
              .filter(l => doComodo.some(i => i.id === l.item_id))
              .map(l => ({
                tipo: 'excluir' as const,
                sub: 'lista_itens' as const,
                id: l.id,
              }))),
        { tipo: 'excluir', sub: 'comodos', id: comodo.id },
      ],
      'excluir cômodo',
      aoFalhar,
    );
    navigation.goBack();
    avisos.mostrar({
      texto: destino
        ? `${comodo.nome} excluído. Os itens foram para ${
            outros.find(o => o.id === destino)?.nome
          }.`
        : `${comodo.nome} excluído`,
    });
  };

  const pedirExclusao = async () => {
    setMenu(false);
    if (doComodo.length === 0 || outros.length === 0)
      return excluirComodo(null);
    setMover(true);
  };

  return (
    <View style={[estilos.raiz, { backgroundColor: cores.background }]}>
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: inset.top + espacos.space1, paddingHorizontal: margem },
        ]}
      >
        <View style={estilos.topo}>
          <BotaoVoltar />
          <View style={estilos.flex} />
          <Botao
            rotulo="Medidas"
            variante="contornado"
            icone="medidas"
            compacto
            onPress={() =>
              navigation.navigate('Medidas', { comodoId: comodo.id })
            }
          />
          <Pressable
            onPress={() => setMenu(true)}
            accessibilityRole="button"
            accessibilityLabel="Mais opções do cômodo"
            style={estilos.redondo}
          >
            <Icone nome="mais" cor={cores.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Item', { comodoId: comodo.id })}
            accessibilityRole="button"
            accessibilityLabel={`Novo item em ${comodo.nome}`}
            style={[
              estilos.redondo,
              { backgroundColor: cores.primary },
              sombra('shadowFab'),
            ]}
          >
            <Icone nome="adicionar" cor={cores.onPrimary} tamanho={28} />
          </Pressable>
        </View>
        <Texto papel="tituloAba" accessibilityRole="header">
          {comodo.nome}
        </Texto>
        <View
          style={estilos.linhaCentro}
          accessible
          accessibilityLabel={`${p.feitos} de ${p.total} itens`}
        >
          <View style={estilos.flex}>
            <BarraProgresso
              fracao={p.total ? p.feitos / p.total : 0}
              cor="home"
              trilho="homeContainer"
            />
          </View>
          <Texto papel="nomeItem" peso="700">
            {p.feitos} de {p.total}
          </Texto>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.chips}
        >
          {FILTROS.map(f => (
            <Chip
              key={f.valor}
              rotulo={f.rotulo}
              selecionado={filtro === f.valor}
              onPress={() => setFiltro(f.valor)}
            />
          ))}
        </ScrollView>

        {lista.length === 0 ? (
          <Cartao style={estilos.vazio}>
            <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center">
              {doComodo.length === 0
                ? 'Nenhum item neste cômodo ainda.'
                : 'Nenhum item aqui.'}
            </Texto>
            {doComodo.length === 0 ? (
              <Botao
                rotulo="Adicionar item"
                variante="tonal"
                onPress={() =>
                  navigation.navigate('Item', { comodoId: comodo.id })
                }
              />
            ) : (
              <Botao
                rotulo="Ver todos"
                variante="tonal"
                onPress={() => setFiltro('todos')}
              />
            )}
          </Cartao>
        ) : (
          lista.map(i => (
            <Cartao key={i.id} style={estilos.item}>
              <Pressable
                onPress={() => navigation.navigate('Item', { id: i.id })}
                accessibilityRole="button"
                style={estilos.flex}
              >
                <Texto papel="nomeItem" peso="700">
                  {i.nome}
                </Texto>
                <Texto papel="metadado" cor="onSurfaceVariant">
                  {i.quantidade} · {FASES_ENXOVAL[i.fase]}
                  {i.preco_estimado
                    ? ` · ${formatarReais(i.preco_estimado)}`
                    : ''}
                </Texto>
              </Pressable>
              <BotaoEstado
                estado={i.estado}
                onPress={() => estado.alternar(i)}
              />
            </Cartao>
          ))
        )}
      </ScrollView>

      {estado.folhas}

      <FolhaInferior visivel={menu} onFechar={() => setMenu(false)}>
        <Botao
          rotulo="Renomear cômodo"
          variante="tonal"
          icone="editar"
          larguraTotal
          onPress={() => {
            setMenu(false);
            setRenomear(comodo.nome);
          }}
        />
        <Botao
          rotulo="Excluir cômodo"
          variante="destrutivo"
          icone="excluir"
          larguraTotal
          onPress={pedirExclusao}
        />
      </FolhaInferior>

      <FolhaInferior
        visivel={renomear !== null}
        titulo="Renomear cômodo"
        onFechar={() => setRenomear(null)}
      >
        <CampoTexto
          rotulo="Nome do cômodo"
          value={renomear ?? ''}
          onChangeText={setRenomear}
          maxLength={40}
          onSubmitEditing={salvarNome}
        />
        <Botao
          rotulo="Salvar"
          variante="casa"
          larguraTotal
          desativado={!renomear?.trim()}
          onPress={salvarNome}
        />
      </FolhaInferior>

      <FolhaInferior
        visivel={mover}
        titulo={`Excluir ${comodo.nome}?`}
        onFechar={() => setMover(false)}
      >
        <Texto papel="corpo" cor="onSurfaceVariant">
          O cômodo tem {doComodo.length}{' '}
          {doComodo.length === 1 ? 'item' : 'itens'}. Querem mover para outro
          cômodo ou excluir junto?
        </Texto>
        {outros.map(o => (
          <Botao
            key={o.id}
            rotulo={`Mover para ${o.nome}`}
            variante="tonal"
            larguraTotal
            onPress={() => excluirComodo(o.id)}
          />
        ))}
        <Botao
          rotulo="Excluir com os itens"
          variante="destrutivo"
          larguraTotal
          onPress={() => excluirComodo(null)}
        />
      </FolhaInferior>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  conteudo: { paddingBottom: espacos.space10, gap: espacos.space4 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2 },
  redondo: {
    width: tamanhos.fab - 12,
    height: tamanhos.fab - 12,
    borderRadius: raios.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  chips: { gap: espacos.space2 },
  vazio: { gap: espacos.space3, alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
});
