import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import type { ListaItem, Reserva } from '@lartie/modelo';
import {
  dataPorExtenso,
  daOcasiao,
  diaDaOcasiao,
  esconderNome,
  hojeLocal,
  NOME_OCASIAO,
  ocasioesDoModo,
  resumoPresentes,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { ControleSegmentado } from '../../componentes/ControleSegmentado';
import { Cartao, TelaPilha } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { LinhaComGestos } from '../../componentes/LinhaComGestos';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote, type OperacaoLote } from '../../dados/gravacao';
import {
  useItens,
  useListaItens,
  useListas,
  useReservas,
} from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import {
  cancelarReserva,
  ErroSemConexao,
  excluirLista,
  removerDaLista,
  type AvisoConvidado,
} from '../../servicos/api';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { useConferirComodo } from '../casa/comum';
import {
  FolhaAvisarConvidados,
  FolhaCompartilhar,
  useLinkDaLista,
} from './comum';
import { FolhaNovaLista, usePublicarLista } from './Presentes';

// T24 · Lista: itens e reservas (ListaPresentes.dc.html). "Recebido" passa a reserva para recebida,
// o item do enxoval para "Já tenho" (ganhado, com quem deu) e cria o agradecimento, com "Desfazer".
// Tirar da lista, excluir a lista e cancelar reservas passam pelo servidor (13.5) e oferecem
// avisar os convidados pelo WhatsApp.

type Aba = 'todos' | 'reservados' | 'recebidos';
type LiComId = ListaItem & { id: string };
type ReservaComId = Reserva & { id: string };

export function Lista() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Lista'>>();
  const { casalId, modo } = useSessao();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const conferir = useConferirComodo();
  const listas = useListas();
  const lista = listas.dados.find(l => l.id === params.id) ?? null;
  const itensDaLista = useListaItens().dados.filter(
    i => i.lista_id === params.id,
  );
  const reservas = useReservas().dados.filter(r => r.lista_id === params.id);
  const itens = useItens().dados;
  const link = useLinkDaLista(lista);
  const publicar = usePublicarLista();
  const [aba, setAba] = useState<Aba>('todos');
  const [compartilhar, setCompartilhar] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editar, setEditar] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [avisarConvidados, setAvisarConvidados] = useState<AvisoConvidado[]>(
    [],
  );
  const aoFalhar = () => erroAoSalvar();

  useEffect(() => {
    if (params.compartilhar) setCompartilhar(true);
  }, [params.compartilhar]);

  if (listas.carregando) return <EsqueletoLista />;
  if (!lista) {
    return (
      <TelaPilha titulo="Lista">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Esta lista foi excluída.
        </Texto>
      </TelaPilha>
    );
  }

  const resumo = resumoPresentes(itensDaLista, reservas);
  const esconder = esconderNome(
    lista.modo_surpresa,
    lista.data_evento,
    hojeLocal(),
  );
  const nomeItem = (li: LiComId) =>
    li.avulso?.nome ?? itens.find(i => i.id === li.item_id)?.nome ?? 'Presente';
  const semConexao = () =>
    avisos.mostrar({ texto: 'Esta ação precisa de internet.', tipo: 'erro' });

  // Recebido ---------------------------------------------------------------------------------
  const receber = (r: ReservaComId, li: LiComId) => {
    if (!casalId) return;
    const item = itens.find(i => i.id === li.item_id);
    const ops: OperacaoLote[] = [
      {
        tipo: 'criar',
        sub: 'agradecimentos',
        dados: {
          reserva_id: r.id,
          item_id: li.item_id || null,
          nome: r.nome_convidado,
          presente_descricao: nomeItem(li),
          whatsapp: r.whatsapp,
          ocasiao: lista.ocasiao,
          agradecido: false,
          agradecido_em: null,
        },
      },
      { tipo: 'atualizarReserva', id: r.id, status: 'recebida' },
    ];
    // O item do enxoval vira "Já tenho", ganhado, com quem deu.
    const antesItem = item
      ? { estado: item.estado, origem: item.origem, quem_deu: item.quem_deu }
      : null;
    if (item)
      ops.push({
        tipo: 'atualizar',
        sub: 'itens',
        id: item.id,
        dados: {
          estado: 'ja_tenho',
          origem: 'ganhado',
          quem_deu: r.nome_convidado,
        },
      });
    const ids = emLote(casalId, ops, 'presente recebido', aoFalhar);
    registrarEvento({ nome: 'presente_recebido', params: {} });
    if (item) conferir(item.comodo_id, { [item.id]: { estado: 'ja_tenho' } });
    avisos.comDesfazer(`${nomeItem(li)}: recebido`, () => {
      const volta: OperacaoLote[] = [
        { tipo: 'atualizarReserva', id: r.id, status: 'ativa' },
      ];
      if (ids[0])
        volta.push({ tipo: 'excluir', sub: 'agradecimentos', id: ids[0] });
      if (item && antesItem)
        volta.push({
          tipo: 'atualizar',
          sub: 'itens',
          id: item.id,
          dados: antesItem,
        });
      emLote(casalId, volta, 'desfazer recebido', aoFalhar);
      if (item) conferir(item.comodo_id, { [item.id]: antesItem ?? {} });
    });
  };

  const cancelar = async (r: ReservaComId, li: LiComId) => {
    const ok = await confirmar({
      tom: 'destrutivo',
      titulo: 'Cancelar a reserva?',
      texto: `${nomeItem(
        li,
      )} volta a ficar disponível na lista. Vamos ajudar vocês a avisar ${
        r.nome_convidado
      }.`,
      cancelar: 'Manter',
      confirmar: 'Cancelar reserva',
    });
    if (!ok) return;
    if (!online) return semConexao();
    try {
      const { aviso } = await cancelarReserva(r.id);
      registrarEvento({ nome: 'reserva_cancelada_casal', params: {} });
      setAvisarConvidados([aviso]);
    } catch (erro) {
      if (erro instanceof ErroSemConexao) return semConexao();
      avisos.mostrar({
        texto: 'Não foi possível cancelar a reserva.',
        tipo: 'erro',
      });
    }
  };

  const tirarDaLista = async (li: LiComId) => {
    if (!casalId) return;
    const ativas = reservas.filter(
      r => r.lista_item_id === li.id && r.status === 'ativa',
    );
    const item = itens.find(i => i.id === li.item_id);
    if (ativas.length) {
      const ok = await confirmar({
        icone: 'aviso',
        titulo: 'Tirar da lista?',
        texto: `Este item tem reserva de ${
          ativas[0]!.nome_convidado
        }. Tirar da lista mesmo assim?`,
        cancelar: 'Manter',
        confirmar: 'Tirar da lista',
      });
      if (!ok) return;
      if (!online) return semConexao();
      try {
        const { avisos: a } = await removerDaLista([li.id]);
        setAvisarConvidados(a);
      } catch {
        return avisos.mostrar({
          texto: 'Não foi possível tirar da lista.',
          tipo: 'erro',
        });
      }
    } else {
      emLote(
        casalId,
        [{ tipo: 'excluir', sub: 'lista_itens', id: li.id }],
        'tirar da lista',
        aoFalhar,
      );
    }
    if (item?.estado === 'na_lista')
      atualizar(casalId, 'itens', item.id, { estado: 'falta' }, aoFalhar);
    avisos.mostrar({ texto: `${nomeItem(li)} saiu da lista` });
  };

  // Menu -------------------------------------------------------------------------------------
  const despublicar = async () => {
    setMenu(false);
    if (!casalId) return;
    const ok = await confirmar({
      titulo: 'Despublicar a lista?',
      texto:
        'O link passa a mostrar "Este link não está mais ativo". As reservas feitas continuam valendo.',
      cancelar: 'Cancelar',
      confirmar: 'Despublicar',
    });
    if (!ok) return;
    atualizar(
      casalId,
      'listas_presentes',
      lista.id,
      { status: 'despublicada' },
      aoFalhar,
    );
    avisos.mostrar({ texto: 'Lista despublicada' });
  };

  const excluir = async () => {
    setMenu(false);
    const ativas = reservas.filter(r => r.status === 'ativa').length;
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: `Excluir a lista ${daOcasiao(lista.ocasiao)}?`,
      texto: ativas
        ? `As ${ativas} reservas ativas serão canceladas e vamos ajudar vocês a avisar os convidados. Não dá para desfazer.`
        : 'Não dá para desfazer.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir lista',
    });
    if (!ok) return;
    if (!online) return semConexao();
    try {
      const { avisos: a } = await excluirLista(lista.id);
      avisos.mostrar({ texto: 'Lista excluída' });
      if (a.length) setAvisarConvidados(a);
      else navigation.goBack();
    } catch {
      avisos.mostrar({
        texto: 'Não foi possível excluir a lista.',
        tipo: 'erro',
      });
    }
  };

  // Linhas -----------------------------------------------------------------------------------
  const linhas = itensDaLista
    .map(li => ({
      li,
      rs: reservas.filter(
        r =>
          r.lista_item_id === li.id &&
          (r.status === 'ativa' || r.status === 'recebida'),
      ),
    }))
    .sort((a, b) => nomeItem(a.li).localeCompare(nomeItem(b.li), 'pt-BR'));

  const nomeDe = (r: ReservaComId) => (esconder ? null : r.nome_convidado);

  return (
    <TelaPilha
      titulo={NOME_OCASIAO[lista.ocasiao]}
      tituloGrande
      direita={
        <View style={estilos.linhaCentro}>
          {link ? (
            <Pressable
              onPress={() => Linking.openURL(link.local)}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Texto papel="metadado" peso="600" cor="primary">
                Ver como convidado
              </Texto>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => setMenu(true)}
            accessibilityRole="button"
            accessibilityLabel="Mais opções da lista"
            style={{ minHeight: alvoToque, justifyContent: 'center' }}
          >
            <Icone nome="mais" cor={cores.onSurface} />
          </Pressable>
        </View>
      }
      rodape={
        <Botao
          rotulo="+ Adicionar itens do enxoval"
          larguraTotal
          onPress={() =>
            navigation.navigate('AdicionarItens', { listaId: lista.id })
          }
        />
      }
    >
      <Texto papel="corpo" cor="onSurfaceVariant">
        {lista.data_evento ? dataPorExtenso(lista.data_evento) : 'Sem data'} ·{' '}
        {resumo.reservados + resumo.recebidos} de {resumo.total} reservados
      </Texto>

      {lista.status === 'publicada' ? (
        <View style={estilos.linha}>
          <View style={estilos.flex}>
            <Botao
              rotulo="Compartilhar"
              variante="whatsapp"
              larguraTotal
              onPress={() => setCompartilhar(true)}
            />
          </View>
          <View style={estilos.flex}>
            <Botao
              rotulo="Copiar link"
              variante="contornado"
              larguraTotal
              onPress={() => {
                if (!link) return;
                Clipboard.setString(`https://${link.publico}`);
                avisos.mostrar({ texto: 'Link copiado' });
              }}
            />
          </View>
        </View>
      ) : (
        <Cartao style={estilos.rascunho}>
          <Texto papel="corpo" cor="onSurfaceVariant">
            {lista.status === 'despublicada'
              ? 'A lista está despublicada: o link não abre.'
              : 'A lista ainda é um rascunho: só vocês veem.'}
          </Texto>
          <Botao
            rotulo="Publicar link"
            variante="tonal"
            onPress={() => publicar(lista, () => setCompartilhar(true))}
          />
        </Cartao>
      )}

      <Cartao>
        <View style={[estilos.linhaCentro, { minHeight: alvoToque }]}>
          <View style={estilos.flex}>
            <Texto papel="nomeItem" peso="700">
              Modo surpresa
            </Texto>
            <Texto papel="metadado" cor="onSurfaceVariant">
              Esconde quem reservou até o dia {diaDaOcasiao(lista.ocasiao)}
            </Texto>
          </View>
          <Switch
            value={lista.modo_surpresa}
            onValueChange={v => {
              if (casalId)
                atualizar(
                  casalId,
                  'listas_presentes',
                  lista.id,
                  { modo_surpresa: v },
                  aoFalhar,
                );
            }}
            accessibilityLabel="Modo surpresa"
            trackColor={{ true: cores.primary, false: cores.outlineSoft }}
            thumbColor={cores.surface}
            ios_backgroundColor={cores.outlineSoft}
          />
        </View>
      </Cartao>

      <ControleSegmentado
        rotulo="Filtrar"
        segmentos={[
          { valor: 'todos', rotulo: 'Todos' },
          { valor: 'reservados', rotulo: 'Reservados' },
          { valor: 'recebidos', rotulo: 'Recebidos' },
        ]}
        selecionado={aba}
        onMudar={setAba}
      />

      {linhas.length === 0 ? (
        <Cartao style={estilos.rascunho}>
          <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center">
            Nenhum presente nesta lista ainda.
          </Texto>
        </Cartao>
      ) : null}

      {linhas.map(({ li, rs }) => {
        const ativas = rs.filter(r => r.status === 'ativa');
        const recebidas = rs.filter(r => r.status === 'recebida');
        const ocupadas = rs.reduce((s, r) => s + r.quantidade, 0);
        const mostrarDisponivel =
          aba === 'todos' && ocupadas < li.quantidade_na_lista;
        const mostrarAtivas = aba !== 'recebidos';
        const mostrarRecebidas = aba !== 'reservados';
        if (
          !mostrarDisponivel &&
          !(mostrarAtivas && ativas.length) &&
          !(mostrarRecebidas && recebidas.length)
        )
          return null;
        return (
          <View key={li.id} style={estilos.grupo}>
            {mostrarDisponivel ? (
              <Cartao semPadding>
                <LinhaComGestos
                  acoes={[
                    {
                      rotulo: 'Tirar da lista',
                      fundo: 'error',
                      texto: 'onPrimary',
                      onPress: () => tirarDaLista(li),
                    },
                  ]}
                  acoesAcessiveis={[
                    {
                      nome: 'tirar',
                      rotulo: 'Tirar da lista',
                      onAcao: () => tirarDaLista(li),
                    },
                  ]}
                >
                  {() => (
                    <View style={estilos.item}>
                      <View style={estilos.flex}>
                        <Texto papel="nomeItem" peso="700">
                          {nomeItem(li)}
                        </Texto>
                        <Texto papel="metadado" cor="onSurfaceVariant">
                          {ocupadas} de {li.quantidade_na_lista} reservados
                        </Texto>
                      </View>
                    </View>
                  )}
                </LinhaComGestos>
              </Cartao>
            ) : null}
            {mostrarAtivas
              ? ativas.map(r => (
                  <Cartao
                    key={r.id}
                    style={estilos.item}
                    onLongPress={() => cancelar(r, li)}
                    rotuloAcessivel={`${nomeItem(li)}, reservado${
                      nomeDe(r) ? ` por ${nomeDe(r)}` : ''
                    }. Segure para cancelar a reserva`}
                  >
                    <View style={estilos.flex}>
                      <Texto papel="nomeItem" peso="700">
                        {nomeItem(li)}
                      </Texto>
                      <Texto papel="metadado" cor="onSurfaceVariant">
                        {nomeDe(r) ? `Reservado por ${nomeDe(r)}` : 'Reservado'}
                        {r.quantidade > 1 ? ` · ${r.quantidade} un` : ''}
                      </Texto>
                    </View>
                    <Botao
                      rotulo="Recebido"
                      variante="contornado"
                      compacto
                      onPress={() => receber(r, li)}
                    />
                  </Cartao>
                ))
              : null}
            {mostrarRecebidas
              ? recebidas.map(r => (
                  <Cartao key={r.id} style={estilos.item}>
                    <View style={estilos.flex}>
                      <Texto papel="nomeItem" peso="700">
                        {nomeItem(li)}
                      </Texto>
                      <Texto papel="metadado" cor="onSurfaceVariant">
                        {nomeDe(r) ? `Presente de ${nomeDe(r)}` : 'Recebido'}
                      </Texto>
                    </View>
                    <Selo texto="Recebido" tom="success" />
                  </Cartao>
                ))
              : null}
          </View>
        );
      })}

      {reservas.some(r => r.status === 'ativa') ? (
        <Texto papel="ajuda" cor="onSurfaceVariant">
          Segurem uma reserva para cancelar. Arrastem um item para a esquerda
          para tirar da lista.
        </Texto>
      ) : null}

      <FolhaCompartilhar
        lista={lista}
        visivel={compartilhar}
        onFechar={() => setCompartilhar(false)}
      />
      <FolhaAvisarConvidados
        avisos={avisarConvidados}
        onFechar={() => {
          setAvisarConvidados([]);
          if (!listas.dados.some(l => l.id === params.id)) navigation.goBack();
        }}
      />

      <FolhaInferior visivel={menu} onFechar={() => setMenu(false)}>
        <Botao
          rotulo="Editar lista"
          variante="tonal"
          icone="editar"
          larguraTotal
          onPress={() => {
            setMenu(false);
            setEditar(true);
          }}
        />
        <Botao
          rotulo="Entrega e mensagem"
          variante="tonal"
          larguraTotal
          onPress={() => {
            setMenu(false);
            setDetalhes(true);
          }}
        />
        {lista.status === 'publicada' ? (
          <Botao
            rotulo="Despublicar"
            variante="tonal"
            larguraTotal
            onPress={despublicar}
          />
        ) : null}
        <Botao
          rotulo="Excluir lista"
          variante="destrutivo"
          icone="excluir"
          larguraTotal
          onPress={excluir}
        />
      </FolhaInferior>

      <FolhaNovaLista
        visivel={editar}
        onFechar={() => setEditar(false)}
        ocasioes={ocasioesDoModo(modo)}
        existentes={listas.dados
          .filter(l => l.id !== lista.id)
          .map(l => l.slug_lista)}
        slugCasal={null}
        inicial={{
          ocasiao: lista.ocasiao,
          data_evento: lista.data_evento,
          slug_lista: lista.slug_lista,
        }}
        rotulo="Salvar"
        onCriar={d => {
          if (casalId)
            atualizar(casalId, 'listas_presentes', lista.id, d, aoFalhar);
          setEditar(false);
          avisos.mostrar({ texto: 'Lista salva', tipo: 'sucesso' });
        }}
      />
      <FolhaDetalhes
        visivel={detalhes}
        entrega={lista.endereco_entrega}
        mensagem={lista.mensagem}
        onFechar={() => setDetalhes(false)}
        onSalvar={d => {
          if (casalId)
            atualizar(casalId, 'listas_presentes', lista.id, d, aoFalhar);
          setDetalhes(false);
          avisos.mostrar({ texto: 'Lista salva', tipo: 'sucesso' });
        }}
      />
    </TelaPilha>
  );
}

/** Endereço de entrega (aparece para quem reservou) e a mensagem do cabeçalho da página (T25). */
function FolhaDetalhes({
  visivel,
  entrega,
  mensagem,
  onFechar,
  onSalvar,
}: {
  visivel: boolean;
  entrega: string | null;
  mensagem: string | null;
  onFechar: () => void;
  onSalvar: (d: {
    endereco_entrega: string | null;
    mensagem: string | null;
  }) => void;
}) {
  const [e, setE] = useState(entrega ?? '');
  const [m, setM] = useState(mensagem ?? '');
  useEffect(() => {
    if (!visivel) return;
    setE(entrega ?? '');
    setM(mensagem ?? '');
  }, [visivel, entrega, mensagem]);
  return (
    <FolhaInferior
      visivel={visivel}
      titulo="Entrega e mensagem"
      onFechar={onFechar}
    >
      <CampoTexto
        rotulo="Endereço de entrega (opcional)"
        value={e}
        onChangeText={setE}
        multiline
        maxLength={200}
        ajuda="Aparece para o convidado depois que ele reserva."
      />
      <CampoTexto
        rotulo="Mensagem para os convidados (opcional)"
        value={m}
        onChangeText={setM}
        multiline
        maxLength={200}
        placeholder="Estamos montando nosso primeiro lar. Escolha um presente abaixo e reserve para não repetir."
      />
      <Botao
        rotulo="Salvar"
        larguraTotal
        onPress={() =>
          onSalvar({
            endereco_entrega: e.trim() || null,
            mensagem: m.trim() || null,
          })
        }
      />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  linhaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  rascunho: { gap: espacos.space3, alignItems: 'flex-start' },
  grupo: { gap: espacos.space2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    padding: espacos.space4,
  },
});
