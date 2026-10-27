import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import { NOME_OCASIAO } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { CampoMoeda, formatarReais } from '../../componentes/CamposMascarados';
import { Contador } from '../../componentes/Contador';
import {
  Cartao,
  Divisoria,
  TelaPilha,
  TituloSecao,
} from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { emLote, type OperacaoLote } from '../../dados/gravacao';
import {
  useComodos,
  useItens,
  useListaItens,
  useListas,
} from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';

// T24 "+ Adicionar itens do enxoval": todos os cômodos, só itens em "Falta" que ainda não estão
// nesta lista, seleção múltipla com quantidade → "Adicionar {n} itens". Também "Item avulso"
// (nome, preço, link e quantidade), que existe só na lista.

export function AdicionarItens() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'AdicionarItens'>>();
  const { casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const itens = useItens();
  const comodos = [...useComodos().dados].sort((a, b) => a.ordem - b.ordem);
  const lista = useListas().dados.find(l => l.id === params.listaId);
  const naLista = new Set(
    useListaItens()
      .dados.filter(l => l.lista_id === params.listaId)
      .map(l => l.item_id),
  );
  const [escolhidos, setEscolhidos] = useState<Record<string, number>>({});
  const [avulso, setAvulso] = useState(false);

  const porComodo = useMemo(
    () =>
      comodos
        .map(c => ({
          comodo: c,
          itens: itens.dados
            .filter(
              i =>
                i.comodo_id === c.id &&
                i.estado === 'falta' &&
                !naLista.has(i.id),
            )
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
        }))
        .filter(g => g.itens.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens.dados, comodos.length, naLista.size],
  );

  if (itens.carregando) return <EsqueletoLista />;
  const n = Object.keys(escolhidos).length;

  const adicionar = () => {
    if (!casalId || n === 0) return;
    const ops: OperacaoLote[] = [];
    for (const [id, qtd] of Object.entries(escolhidos)) {
      ops.push({
        tipo: 'criar',
        sub: 'lista_itens',
        dados: {
          lista_id: params.listaId,
          item_id: id,
          quantidade_na_lista: qtd,
          avulso: null,
        },
      });
      ops.push({
        tipo: 'atualizar',
        sub: 'itens',
        id,
        dados: { estado: 'na_lista', origem: null, quem_deu: null },
      });
    }
    emLote(casalId, ops, 'adicionar itens à lista', () => erroAoSalvar());
    registrarEvento({ nome: 'itens_adicionados_lista', params: { itens: n } });
    avisos.mostrar({
      texto:
        n === 1 ? '1 item entrou na lista' : `${n} itens entraram na lista`,
      tipo: 'sucesso',
    });
    navigation.goBack();
  };

  return (
    <TelaPilha
      titulo={
        lista ? `Itens · ${NOME_OCASIAO[lista.ocasiao]}` : 'Adicionar itens'
      }
      rodape={
        <Botao
          rotulo={n === 1 ? 'Adicionar 1 item' : `Adicionar ${n} itens`}
          larguraTotal
          desativado={n === 0}
          onPress={adicionar}
        />
      }
    >
      <Botao
        rotulo="Item avulso"
        variante="contornado"
        icone="adicionar"
        larguraTotal
        onPress={() => setAvulso(true)}
      />
      {porComodo.length === 0 ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Não há itens em “Falta” fora desta lista. Usem “Item avulso” para um
          presente que não está no enxoval.
        </Texto>
      ) : null}
      {porComodo.map(({ comodo, itens: lista2 }) => (
        <View key={comodo.id} style={estilos.grupo}>
          <TituloSecao titulo={comodo.nome} />
          <Cartao semPadding>
            {lista2.map((i, k) => {
              const marcado = escolhidos[i.id] !== undefined;
              return (
                <View key={i.id}>
                  {k > 0 ? <Divisoria /> : null}
                  <Pressable
                    onPress={() =>
                      setEscolhidos(e => {
                        const novo = { ...e };
                        if (marcado) delete novo[i.id];
                        else novo[i.id] = i.quantidade;
                        return novo;
                      })
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: marcado }}
                    style={[
                      estilos.linha,
                      { minHeight: alvoToque + espacos.space4 },
                    ]}
                  >
                    <Icone
                      nome={marcado ? 'caixaMarcada' : 'caixaVazia'}
                      cor={marcado ? cores.primary : cores.outline}
                    />
                    <View style={estilos.flex}>
                      <Texto papel="nomeItem">{i.nome}</Texto>
                      <Texto papel="metadado" cor="onSurfaceVariant">
                        {i.quantidade} un
                        {i.preco_estimado
                          ? ` · ${formatarReais(i.preco_estimado)}`
                          : ''}
                      </Texto>
                    </View>
                  </Pressable>
                  {marcado && i.quantidade > 1 ? (
                    <View style={estilos.qtd}>
                      <Contador
                        rotulo="Quantidade na lista"
                        valor={escolhidos[i.id]!}
                        onMudar={v => setEscolhidos(e => ({ ...e, [i.id]: v }))}
                        minimo={1}
                        maximo={99}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Cartao>
        </View>
      ))}
      <FolhaAvulso
        visivel={avulso}
        onFechar={() => setAvulso(false)}
        onSalvar={d => {
          if (!casalId) return;
          emLote(
            casalId,
            [
              {
                tipo: 'criar',
                sub: 'lista_itens',
                dados: {
                  lista_id: params.listaId,
                  item_id: '',
                  quantidade_na_lista: d.quantidade,
                  avulso: d.avulso,
                },
              },
            ],
            'item avulso',
            () => erroAoSalvar(),
          );
          setAvulso(false);
          avisos.mostrar({
            texto: `${d.avulso.nome} entrou na lista`,
            tipo: 'sucesso',
          });
        }}
      />
    </TelaPilha>
  );
}

function FolhaAvulso({
  visivel,
  onFechar,
  onSalvar,
}: {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (d: {
    quantidade: number;
    avulso: {
      nome: string;
      preco_estimado: number | null;
      link_loja: string | null;
    };
  }) => void;
}) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [qtd, setQtd] = useState(1);
  const linkOk = !link.trim() || /^https?:\/\/\S+$/.test(link.trim());
  return (
    <FolhaInferior visivel={visivel} titulo="Item avulso" onFechar={onFechar}>
      <CampoTexto
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        maxLength={60}
      />
      <View style={estilos.linhaTopo}>
        <View style={estilos.flex}>
          <CampoMoeda
            rotulo="Preço (opcional)"
            valor={preco}
            onMudar={setPreco}
          />
        </View>
        <View style={estilos.flex}>
          <Contador
            rotulo="Quantidade"
            valor={qtd}
            onMudar={setQtd}
            minimo={1}
            maximo={99}
          />
        </View>
      </View>
      <CampoTexto
        rotulo="Link da loja (opcional)"
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        erro={linkOk ? null : 'Cole um link que comece com https://'}
      />
      <Botao
        rotulo="Adicionar à lista"
        larguraTotal
        desativado={!nome.trim() || !linkOk}
        onPress={() => {
          onSalvar({
            quantidade: qtd,
            avulso: {
              nome: nome.trim(),
              preco_estimado: preco,
              link_loja: link.trim() || null,
            },
          });
          setNome('');
          setPreco(null);
          setLink('');
          setQtd(1);
        }}
      />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  grupo: { gap: espacos.space2 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    paddingHorizontal: espacos.space4,
  },
  linhaTopo: {
    flexDirection: 'row',
    gap: espacos.space3,
    alignItems: 'flex-start',
  },
  qtd: {
    paddingHorizontal: espacos.space4,
    paddingBottom: espacos.space3,
    borderRadius: raios.radiusMd,
  },
});
