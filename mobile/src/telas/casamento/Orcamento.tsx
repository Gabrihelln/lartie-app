import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import type { EscopoOrcamento } from '@lartie/modelo';
import {
  dataCurta,
  distribuirOrcamento,
  escoposOrcamento,
  formatarData,
  hojeLocal,
  lancamentosDaCategoria,
  proximasParcelas,
  resumoOrcamento,
  rotuloParcela,
  type CatalogoCategorias,
  type EntradaOrcamento,
  type LinhaOrcamento,
} from '@lartie/regras';
import categoriasCatalogo from '../../../../dados/categorias.json';
import { Botao } from '../../componentes/Botao';
import { CampoData } from '../../componentes/CampoData';
import { CampoSelecao } from '../../componentes/CampoSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { CampoMoeda, formatarReais } from '../../componentes/CamposMascarados';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { BarraProgresso, Cartao, Divisoria, TituloSecao } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { atualizar, criar, emLote, excluir } from '../../dados/gravacao';
import { useEntradaOrcamento, useFornecedores, useParcelas } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';

// T15 · Orçamento (Orcamento.dc.html). Escopo Casamento · Casa nova conforme o modo (13.9 regra 5).
// Gasto = fornecedores fechados + itens comprados com preço + gastos avulsos (13.4), calculado.
// A foto da nota fiscal (IA) fica escondida enquanto a IA estiver fora do escopo (P14).

const CATALOGO = categoriasCatalogo as unknown as CatalogoCategorias;

interface Props {
  /** "+" da aba Casamento: abre a folha Novo gasto. */
  novoGasto: boolean;
  onFecharNovoGasto: () => void;
  /** Modo "casa": o orçamento só tem o escopo da casa (acessado pela Casa). */
  escopoFixo?: EscopoOrcamento;
}

export function Orcamento({ novoGasto, onFecharNovoGasto, escopoFixo }: Props) {
  const { cores } = useTema();
  const navigation = useNavigation();
  const { casal, casalId, modo } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const { entrada, carregando } = useEntradaOrcamento();
  const parcelas = useParcelas().dados;
  const fornecedores = useFornecedores().dados;
  const escopos = escopoFixo ? [escopoFixo] : escoposOrcamento(modo);
  const [escopo, setEscopo] = useState<EscopoOrcamento>(escopos[0] ?? 'casamento');
  const [categoriaAberta, setCategoriaAberta] = useState<LinhaOrcamento | null>(null);
  const [editarOrcamento, setEditarOrcamento] = useState(false);
  const resumo = useMemo(() => resumoOrcamento(entrada, escopo), [entrada, escopo]);
  const aoFalhar = () => erroAoSalvar();

  if (carregando) return <EsqueletoLista />;

  const proximas = proximasParcelas(parcelas, fornecedores);
  const nomeFornecedor = new Map(fornecedores.map((f) => [f.id, f.nome]));
  const pct = resumo.percentualUsado;

  const marcarPaga = async (p: (typeof parcelas)[number]) => {
    const ok = await confirmar({ titulo: 'Marcar como paga?', texto: `${p.descricao} de ${formatarReais(p.valor)}.`, cancelar: 'Cancelar', confirmar: 'Marcar como paga' });
    if (!ok || !casalId) return;
    atualizar(casalId, 'parcelas', p.id, { paga: true, paga_em: hojeLocal() }, aoFalhar);
    registrarEvento({ nome: 'parcela_paga', params: {} });
    avisos.mostrar({ texto: 'Parcela marcada como paga', tipo: 'sucesso' });
  };

  return (
    <View style={estilos.conteudo}>
      {escopos.length > 1 ? (
        <EscolhaUnica
          rotulo="Escopo"
          opcoes={[
            { valor: 'casamento', rotulo: 'Casamento' },
            { valor: 'casa', rotulo: 'Casa nova' },
          ]}
          selecionado={escopo}
          onMudar={setEscopo}
        />
      ) : null}

      {resumo.planejadoTotal > 0 ? (
        <View
          style={[estilos.resumo, { backgroundColor: cores.inverseSurface }]}
          accessible
          accessibilityLabel={`Gasto até agora ${formatarReais(resumo.gastoTotal)} de ${formatarReais(resumo.planejadoTotal)}. ${pct}% usado. Saldo ${formatarReais(resumo.saldo)}`}
        >
          <Texto papel="metadado" cor="onInverseSurface">
            Gasto até agora
          </Texto>
          <View style={estilos.linhaBase}>
            <Texto papel="numeroDestaque" peso="700" cor="onInverseSurface">
              {formatarReais(resumo.gastoTotal)}
            </Texto>
            <Texto papel="corpo" cor="onInverseSurface">
              de {formatarReais(resumo.planejadoTotal)}
            </Texto>
          </View>
          <BarraProgresso fracao={(pct ?? 0) / 100} cor={resumo.gastoTotal > resumo.planejadoTotal ? 'error' : 'brandRoseLight'} trilho="outline" />
          <View style={estilos.linhaBase}>
            <Texto papel="metadado" cor="onInverseSurface" style={estilos.flex}>
              {pct}% usado
            </Texto>
            <Texto papel="metadado" cor="onInverseSurface">
              Saldo {formatarReais(resumo.saldo)}
            </Texto>
          </View>
        </View>
      ) : (
        <Cartao style={estilos.vazio}>
          <Texto papel="tituloSecao" peso="700">
            Definam quanto querem gastar
          </Texto>
          <Botao rotulo="Definir orçamento" variante="tonal" onPress={() => setEditarOrcamento(true)} />
        </Cartao>
      )}

      {resumo.estouros.map((l) => (
        <View key={l.id} style={[estilos.alerta, { backgroundColor: cores.errorContainer }]} accessibilityRole="alert">
          <Icone nome="aviso" cor={cores.error} />
          <Texto papel="corpo" cor="error" style={estilos.flex}>
            <Texto papel="corpo" peso="700" cor="error">
              {l.nome}
            </Texto>{' '}
            passou {formatarReais(l.excesso)} do planejado.
          </Texto>
        </View>
      ))}

      <TituloSecao titulo="Por categoria" link={{ rotulo: 'Editar orçamento', onPress: () => setEditarOrcamento(true) }} />
      <Cartao semPadding>
        {resumo.linhas.map((l, i) => (
          <View key={l.id}>
            {i > 0 ? <Divisoria /> : null}
            <Pressable
              onPress={() => setCategoriaAberta(l)}
              accessibilityRole="button"
              accessibilityLabel={`${l.nome}: ${formatarReais(l.gasto)} de ${l.planejado === null ? 'sem planejado' : formatarReais(l.planejado)}${l.estourou ? ', passou do planejado' : ''}`}
              style={estilos.categoria}
            >
              <View style={estilos.linhaBase}>
                <Texto papel="nomeItem" peso="700" style={estilos.flex}>
                  {l.nome}
                </Texto>
                <Texto papel="metadado" peso={l.estourou ? '700' : '400'} cor={l.estourou ? 'error' : 'onSurfaceVariant'}>
                  {formatarReais(l.gasto)} / {l.planejado === null ? '—' : formatarReais(l.planejado)}
                </Texto>
              </View>
              <BarraProgresso
                fracao={l.planejado ? l.gasto / l.planejado : 0}
                cor={l.estourou ? 'error' : 'primary'}
                trilho="surfaceVariant"
                altura={6}
              />
            </Pressable>
          </View>
        ))}
      </Cartao>

      {escopo === 'casamento' ? (
        <>
          <TituloSecao titulo="Próximas parcelas" />
          {proximas.length === 0 ? (
            <Texto papel="corpo" cor="onSurfaceVariant">
              As parcelas dos fornecedores fechados aparecem aqui.
            </Texto>
          ) : (
            <Cartao semPadding>
              {proximas.map((p, i) => {
                const [dia, mes] = dataCurta(p.vencimento).split(' ');
                return (
                  <View key={p.id}>
                    {i > 0 ? <Divisoria /> : null}
                    <View style={estilos.parcela}>
                      <Pressable
                        onPress={() => navigation.navigate('Fornecedor', { id: p.fornecedor_id })}
                        accessibilityRole="button"
                        accessibilityLabel={`${formatarData(p.vencimento)}, ${nomeFornecedor.get(p.fornecedor_id) ?? ''}, ${rotuloParcela(p, parcelas.filter((x) => x.fornecedor_id === p.fornecedor_id))}`}
                        style={[estilos.linhaBase, estilos.flex]}
                      >
                        <View style={[estilos.data, { backgroundColor: cores.primaryContainer }]}>
                          <Texto papel="nomeItem" peso="700" cor="onPrimaryContainer">
                            {dia}
                          </Texto>
                          <Texto papel="selo" peso="700" cor="onPrimaryContainer">
                            {mes!.toUpperCase()}
                          </Texto>
                        </View>
                        <View style={estilos.flex}>
                          <Texto papel="nomeItem" peso="700" numberOfLines={1}>
                            {nomeFornecedor.get(p.fornecedor_id) ?? ''}
                          </Texto>
                          <Texto papel="metadado" cor="onSurfaceVariant">
                            {rotuloParcela(p, parcelas.filter((x) => x.fornecedor_id === p.fornecedor_id))}
                          </Texto>
                        </View>
                      </Pressable>
                      <Pressable onPress={() => marcarPaga(p)} accessibilityRole="button" accessibilityLabel={`${formatarReais(p.valor)}. Marcar como paga`} hitSlop={8}>
                        <Texto papel="nomeItem" peso="700">
                          {formatarReais(p.valor)}
                        </Texto>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </Cartao>
          )}
        </>
      ) : null}

      <FolhaNovoGasto visivel={novoGasto} onFechar={onFecharNovoGasto} escopo={escopo} categorias={resumo.linhas} />
      <FolhaCategoria linha={categoriaAberta} onFechar={() => setCategoriaAberta(null)} entrada={entrada} />
      <FolhaEditarOrcamento
        visivel={editarOrcamento}
        onFechar={() => setEditarOrcamento(false)}
        escopo={escopo}
        linhas={resumo.linhas}
        totalAtual={casal?.orcamento_total ?? null}
      />
    </View>
  );

}


function FolhaNovoGasto({ visivel, onFechar, escopo: e, categorias }: { visivel: boolean; onFechar: () => void; escopo: EscopoOrcamento; categorias: LinhaOrcamento[] }) {
  const { casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const aoFalhar = () => erroAoSalvar();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [data, setData] = useState<string>(hojeLocal());
  const [tentou, setTentou] = useState(false);
  const erros = {
    descricao: descricao.trim() ? null : 'Descreva o gasto.',
    valor: valor ? null : 'Informe o valor.',
    categoria: categoria ? null : 'Escolha a categoria.',
  };
  const salvar = () => {
    setTentou(true);
    if (erros.descricao || erros.valor || erros.categoria || !casalId) return;
    criar(casalId, 'gastos', { categoria_id: categoria, descricao: descricao.trim(), valor, data, origem: 'manual' }, aoFalhar);
    registrarEvento({ nome: 'gasto_criado', params: { escopo: e } });
    avisos.mostrar({ texto: 'Gasto salvo', tipo: 'sucesso' });
    setDescricao('');
    setValor(null);
    setCategoria(null);
    setTentou(false);
    onFechar();
  };
  return (
    <FolhaInferior visivel={visivel} titulo="Novo gasto" onFechar={onFechar}>
      <CampoTexto rotulo="Descrição" value={descricao} onChangeText={setDescricao} maxLength={80} erro={tentou ? erros.descricao : null} />
      <View style={estilos.linhaCampos}>
        <View style={estilos.flex}>
          <CampoMoeda rotulo="Valor" valor={valor} onMudar={setValor} erro={tentou ? erros.valor : null} />
        </View>
        <View style={estilos.flex}>
          <CampoData rotulo="Data" valor={data} onMudar={setData} />
        </View>
      </View>
      <CampoSelecao
        rotulo="Categoria"
        opcoes={categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))}
        valor={categoria}
        onMudar={setCategoria}
        erro={tentou ? erros.categoria : null}
      />
      <Botao rotulo="Salvar" larguraTotal onPress={salvar} />
    </FolhaInferior>
  );
}

function FolhaCategoria({ linha, onFechar, entrada }: { linha: LinhaOrcamento | null; onFechar: () => void; entrada: EntradaOrcamento }) {
  const { cores } = useTema();
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const aoFalhar = () => erroAoSalvar();
  const [planejado, setPlanejado] = useState<number | null>(linha?.planejado ?? null);
  const idAberta = linha?.id ?? null;
  useEffect(() => {
    if (linha) setPlanejado(linha.planejado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAberta]);
  const lancamentos = linha ? lancamentosDaCategoria(linha, entrada) : [];
  const excluirGasto = async (id: string, descricao: string) => {
    const ok = await confirmar({ tom: 'destrutivo', titulo: `Excluir “${descricao}”?`, texto: 'O valor sai do orçamento.', cancelar: 'Cancelar', confirmar: 'Excluir' });
    if (!ok || !casalId) return;
    excluir(casalId, 'gastos', id, aoFalhar);
    avisos.mostrar({ texto: 'Gasto excluído' });
  };
  return (
    <FolhaInferior visivel={!!linha} titulo={linha?.nome} onFechar={onFechar}>
      <CampoMoeda rotulo="Planejado" valor={planejado} onMudar={setPlanejado} />
      {lancamentos.length === 0 ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Nenhum lançamento nesta categoria.
        </Texto>
      ) : (
        lancamentos.map((l) => (
          <View key={`${l.tipo}-${l.id}`} style={estilos.lancamento}>
            <View style={estilos.flex}>
              <Texto papel="nomeItem">{l.descricao}</Texto>
              <Texto papel="metadado" cor="onSurfaceVariant">
                {l.tipo === 'fornecedor' ? 'Fornecedor fechado' : l.tipo === 'item' ? 'Item comprado' : formatarData(l.data)}
              </Texto>
            </View>
            <Texto papel="nomeItem" peso="700">
              {formatarReais(l.valor)}
            </Texto>
            {l.tipo === 'gasto' ? (
              <Pressable onPress={() => excluirGasto(l.id, l.descricao)} accessibilityRole="button" accessibilityLabel={`Excluir ${l.descricao}`} hitSlop={8}>
                <Icone nome="excluir" cor={cores.error} />
              </Pressable>
            ) : null}
          </View>
        ))
      )}
      <Botao
        rotulo="Salvar"
        larguraTotal
        onPress={() => {
          if (linha && casalId && planejado !== linha.planejado) {
            atualizar(casalId, 'categorias_orcamento', linha.id, { planejado }, aoFalhar);
            avisos.mostrar({ texto: 'Categoria salva', tipo: 'sucesso' });
          }
          onFechar();
        }}
      />
    </FolhaInferior>
  );
}

function FolhaEditarOrcamento({
  visivel,
  onFechar,
  escopo: e,
  linhas,
  totalAtual,
}: {
  visivel: boolean;
  onFechar: () => void;
  escopo: EscopoOrcamento;
  linhas: LinhaOrcamento[];
  totalAtual: number | null;
}) {
  const { cores } = useTema();
  const { casalId } = useSessao();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const aoFalhar = () => erroAoSalvar();
  const [total, setTotal] = useState<number | null>(totalAtual);
  const [distribuir, setDistribuir] = useState(true);
  const [valores, setValores] = useState<Record<string, number | null>>({});
  // Ao abrir, começa com os valores atuais.
  useEffect(() => {
    if (!visivel) return;
    setTotal(totalAtual);
    setValores(Object.fromEntries(linhas.map((l) => [l.id, l.planejado])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  const salvar = () => {
    if (!casalId) return;
    if (e === 'casamento') {
      const ops: Parameters<typeof emLote>[1] = [{ tipo: 'atualizarCasal', dados: { orcamento_total: total } }];
      if (distribuir && total) {
        for (const c of distribuirOrcamento(total, CATALOGO)) {
          if (linhas.some((l) => l.id === c.id)) ops.push({ tipo: 'atualizar', sub: 'categorias_orcamento', id: c.id, dados: { planejado: c.planejado } });
        }
      }
      emLote(casalId, ops, 'editar orçamento', aoFalhar);
      registrarEvento({ nome: 'orcamento_definido', params: { distribuido: distribuir ? 1 : 0 } });
    } else {
      const ops = linhas
        .filter((l) => valores[l.id] !== l.planejado)
        .map((l) => ({ tipo: 'atualizar' as const, sub: 'categorias_orcamento' as const, id: l.id, dados: { planejado: valores[l.id] ?? null } }));
      if (ops.length) emLote(casalId, ops, 'editar orçamento da casa', aoFalhar);
    }
    avisos.mostrar({ texto: 'Orçamento salvo', tipo: 'sucesso' });
    onFechar();
  };

  return (
    <FolhaInferior visivel={visivel} titulo="Editar orçamento" onFechar={onFechar}>
      {e === 'casamento' ? (
        <>
          <CampoMoeda rotulo="Orçamento total" valor={total} onMudar={setTotal} />
          <View style={estilos.linhaBase}>
            <Texto papel="corpo" style={estilos.flex}>
              Distribuir pelos percentuais sugeridos
            </Texto>
            <Switch
              value={distribuir}
              onValueChange={setDistribuir}
              accessibilityLabel="Distribuir pelos percentuais sugeridos"
              trackColor={{ true: cores.primary, false: cores.outlineSoft }}
              thumbColor={cores.surface}
              ios_backgroundColor={cores.outlineSoft}
            />
          </View>
          <Texto papel="metadado" cor="onSurfaceVariant">
            Local e buffet 45% · Fotografia e vídeo 12% · Decoração e flores 10% · Música 7% · Roupas e beleza 10% · Convites e papelaria 3% · Lua de mel 10% ·
            Imprevistos 3%
          </Texto>
        </>
      ) : (
        linhas.map((l) => (
          <CampoMoeda key={l.id} rotulo={l.nome} valor={valores[l.id] ?? null} onMudar={(v) => setValores((x) => ({ ...x, [l.id]: v }))} />
        ))
      )}
      <Botao rotulo="Salvar" larguraTotal onPress={salvar} />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espacos.space4 },
  flex: { flex: 1 },
  resumo: { borderRadius: raios.radiusXl, padding: espacos.space5, gap: espacos.space3 },
  linhaBase: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2 },
  vazio: { gap: espacos.space3, alignItems: 'flex-start' },
  alerta: { flexDirection: 'row', gap: espacos.space3, padding: espacos.space4, borderRadius: raios.radiusLg, alignItems: 'flex-start' },
  categoria: { padding: espacos.space4, gap: espacos.space2 },
  parcela: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, padding: espacos.space4 },
  data: { width: 48, height: 52, borderRadius: raios.radiusMd, alignItems: 'center', justifyContent: 'center' },
  linhaCampos: { flexDirection: 'row', gap: espacos.space3, alignItems: 'flex-start' },
  lancamento: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
});
