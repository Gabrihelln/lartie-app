import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { raios } from '@lartie/tokens';
import { caminhos, STATUS_FORNECEDOR, type Fornecedor as TipoFornecedor, type Parcela, type StatusFornecedor } from '@lartie/modelo';
import {
  diferencaParcelas,
  formatarData,
  gerarParcelas,
  hojeLocal,
  iniciais,
  moduloVisivel,
  rotuloCategoriaFornecedor,
  STATUS_FORNECEDOR_ROTULO,
  tarefasConcluidasAoFechar,
  validarFornecedor,
  type ErrosFornecedor,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoData } from '../../componentes/CampoData';
import { CampoSelecao } from '../../componentes/CampoSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { CampoMoeda, formatarReais } from '../../componentes/CamposMascarados';
import { Chip } from '../../componentes/Chip';
import { Contador } from '../../componentes/Contador';
import { AvatarIniciais, Cartao, Divisoria } from '../../componentes/Estrutura';
import { TelaPilha } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { atualizar, criarComId, emLote, novoId, type OperacaoLote } from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { useCategorias, useParcelas, useTarefas } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { ExplicacaoPermissao } from '../../feedback/ExplicacaoPermissao';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { enviarContrato, linkDoArquivo, removerContrato } from '../../servicos/api';
import { registrarEvento } from '../../servicos/analytics';
import { armazenamento } from '../../servicos/armazenamento';
import { useConexao } from '../../servicos/conexao';
import { espacos, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';

// T17 · Fornecedor (Fornecedor.dc.html), criar e editar.
// - Novo: formulário completo e "Salvar".
// - Existente: "Editar" mexe em nome, categoria, contatos e data do orçamento; valor, o que inclui,
//   pagamento e notas são editados ali mesmo e salvos ao sair do campo; o status muda na hora.
// - "Fechado" sempre passa pelo T37: o valor entra no orçamento (calculado, 13.4), as parcelas vão
//   para o calendário e as tarefas ligadas são concluídas, tudo num lote só.
// Validações: nome e categoria obrigatórios; valor obrigatório para fechar; parcelas que não somam o
// valor geram aviso, sem bloquear.

const CHAVE_EXPLICOU_CAMERA = 'permissao.camera.explicada';

type Campos = {
  nome: string;
  categoria: string | null;
  contato_whatsapp: string;
  contato_instagram: string;
  contato_telefone: string;
  valor: number | null;
  o_que_inclui: string;
  forma_pagamento: string;
  notas: string;
  status: StatusFornecedor;
  data_orcamento: string | null;
};

function camposDe(f: (TipoFornecedor & { id: string }) | null, categoria?: string): Campos {
  return {
    nome: f?.nome ?? '',
    categoria: f?.categoria ?? categoria ?? null,
    contato_whatsapp: f?.contato_whatsapp ?? '',
    contato_instagram: f?.contato_instagram ?? '',
    contato_telefone: f?.contato_telefone ?? '',
    valor: f?.valor ?? null,
    o_que_inclui: f?.o_que_inclui ?? '',
    forma_pagamento: f?.forma_pagamento ?? '',
    notas: f?.notas ?? '',
    status: f?.status ?? 'pesquisando',
    data_orcamento: f?.data_orcamento ?? null,
  };
}

const paraGravar = (c: Campos) => ({
  nome: c.nome.trim(),
  categoria: c.categoria,
  contato_whatsapp: c.contato_whatsapp.trim() || null,
  contato_instagram: c.contato_instagram.trim().replace(/^@/, '') || null,
  contato_telefone: c.contato_telefone.trim() || null,
  valor: c.valor,
  o_que_inclui: c.o_que_inclui.trim() || null,
  forma_pagamento: c.forma_pagamento.trim() || null,
  notas: c.notas.trim() || null,
  status: c.status,
  data_orcamento: c.data_orcamento,
});

const digitos = (t: string) => t.replace(/\D/g, '');

export function Fornecedor() {
  const { modo } = useSessao();
  // Aberta por link com o módulo oculto: Início com "Ativar Casamento?". Se o módulo sumir com a tela
  // aberta (o parceiro trocou o modo), a navegação volta para o Início sozinha (Raiz).
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'fornecedores'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casamento" />;
  if (!moduloVisivel(modo, 'fornecedores')) return null;
  return <TelaFornecedor />;
}

function TelaFornecedor() {
  const { cores } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Fornecedor'>>();
  const { casalId } = useSessao();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const aoFalhar = () => erroAoSalvar();

  const id = useMemo(() => params?.id ?? (casalId ? novoId(casalId, 'fornecedores') : ''), [params?.id, casalId]);
  const novo = !params?.id;
  const leitura = useDocumento<TipoFornecedor>(casalId && !novo ? caminhos.documento(casalId, 'fornecedores', id) : null);
  const f = leitura.dados;
  const categorias = useCategorias().dados.filter((c) => c.escopo === 'casamento').sort((a, b) => a.ordem - b.ordem);
  const tarefas = useTarefas().dados;
  const parcelas = useParcelas()
    .dados.filter((p) => p.fornecedor_id === id)
    .sort((a, b) => a.numero - b.numero);

  const [c, setC] = useState<Campos>(() => camposDe(null, params?.categoria));
  const [editando, setEditando] = useState(novo);
  const [tentou, setTentou] = useState(false);
  const liberado = useRef(false);
  const [parcelaAberta, setParcelaAberta] = useState<Partial<Parcela> & { id?: string } | null>(null);
  const [gerar, setGerar] = useState(false);
  const [verTodas, setVerTodas] = useState(false);
  const [folhaContrato, setFolhaContrato] = useState(false);
  const [explicarCamera, setExplicarCamera] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const inicial = useRef<string>(JSON.stringify(camposDe(null, params?.categoria)));

  // Preenche uma vez quando o documento chega (do cache ou do servidor).
  const preenchido = useRef(false);
  useEffect(() => {
    if (!f || preenchido.current) return;
    preenchido.current = true;
    const campos = camposDe(f);
    inicial.current = JSON.stringify(campos);
    setC(campos);
  }, [f]);

  const mudar = <K extends keyof Campos>(k: K, v: Campos[K]) => setC((x) => ({ ...x, [k]: v }));
  const temAlteracoes = editando && JSON.stringify(c) !== inicial.current;
  useDescartarAlteracoes({ temAlteracoes, oQue: 'este fornecedor', liberado });

  if (!novo && leitura.carregando) return <TelaPilha titulo="Fornecedor">{null}</TelaPilha>;
  if (!novo && !f) {
    return (
      <TelaPilha titulo="Fornecedor">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Este fornecedor foi excluído.
        </Texto>
      </TelaPilha>
    );
  }

  const nomeCategoria = (cat: string | null) => (cat ? rotuloCategoriaFornecedor(cat, categorias.find((x) => x.id === cat)?.nome) : '');
  const ligadas = tarefas.filter((t) => t.fornecedor_id === id);
  const erros: ErrosFornecedor = tentou ? validarFornecedor(c, false) : {};
  const diferenca = diferencaParcelas(c.valor, parcelas);

  // Salvar e fechar --------------------------------------------------------------------------

  const salvarCampos = (campos: Partial<ReturnType<typeof paraGravar>>) => {
    if (!casalId || novo) return;
    atualizar(casalId, 'fornecedores', id, campos, aoFalhar);
  };

  /** Inline (existente, fora do modo edição): grava o campo ao sair dele, se mudou. */
  const aoSairDoCampo = (k: 'valor' | 'o_que_inclui' | 'forma_pagamento' | 'notas') => {
    if (novo || editando || !f) return;
    const g = paraGravar(c);
    if (g[k] !== (f[k] ?? null)) salvarCampos({ [k]: g[k] });
  };

  /** T37 "Marcar {fornecedor} como fechado?". Devolve true se confirmou. */
  const confirmarFechamento = async () => {
    const e = validarFornecedor(c, true);
    if (e.valor) {
      setTentou(true);
      await confirmar({ icone: 'aviso', titulo: 'Falta o valor', texto: e.valor, cancelar: null, confirmar: 'Entendi' });
      return false;
    }
    const abertas = ligadas.filter((t) => t.status !== 'concluida');
    const partes = [`${formatarReais(c.valor)} entram no orçamento de ${nomeCategoria(c.categoria)}`];
    if (parcelas.length) partes.push(`as ${parcelas.length} parcelas vão para o calendário`);
    if (abertas.length === 1) partes.push(`a tarefa “${abertas[0]!.titulo}” será concluída`);
    else if (abertas.length > 1) partes.push(`${abertas.length} tarefas ligadas serão concluídas`);
    const texto = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}.` : `${partes[0]}.`;
    return confirmar({ titulo: `Marcar ${c.nome.trim() || 'este fornecedor'} como fechado?`, texto, cancelar: 'Cancelar', confirmar: 'Confirmar' });
  };

  const fechar = async () => {
    if (!casalId) return;
    if (!(await confirmarFechamento())) return;
    const ops: OperacaoLote[] = [
      { tipo: 'atualizar', sub: 'fornecedores', id, dados: { ...paraGravar(c), status: 'fechado' } },
      ...tarefasConcluidasAoFechar(id, tarefas).map((t) => ({ tipo: 'atualizar' as const, sub: 'tarefas' as const, id: t, dados: { status: 'concluida' } })),
    ];
    emLote(casalId, ops, 'fechar fornecedor', aoFalhar);
    mudar('status', 'fechado');
    inicial.current = JSON.stringify({ ...c, status: 'fechado' });
    setEditando(false);
    registrarEvento({ nome: 'fornecedor_fechado', params: { categoria: c.categoria ?? '', parcelas: parcelas.length } });
    avisos.mostrar({ texto: 'Fornecedor fechado', tipo: 'sucesso' });
  };

  const mudarStatus = (s: StatusFornecedor) => {
    if (s === c.status) return;
    if (s === 'fechado') {
      if (novo) return mudar('status', s);
      return fechar();
    }
    mudar('status', s);
    if (!novo && !editando) salvarCampos({ status: s });
  };

  const salvar = async () => {
    setTentou(true);
    if (!casalId || Object.keys(validarFornecedor(c, false)).length) return;
    if (novo) {
      if (c.status === 'fechado' && !(await confirmarFechamento())) return;
      liberado.current = true;
      criarComId(casalId, 'fornecedores', id, { ...paraGravar(c), contrato: null }, aoFalhar);
      if (params?.tarefaId) atualizar(casalId, 'tarefas', params.tarefaId, { fornecedor_id: id }, aoFalhar);
      registrarEvento({ nome: 'fornecedor_criado', params: { categoria: c.categoria ?? '' } });
      navigation.goBack();
      avisos.mostrar({ texto: 'Fornecedor salvo', tipo: 'sucesso' });
      return;
    }
    salvarCampos(paraGravar(c));
    inicial.current = JSON.stringify(c);
    setEditando(false);
    setTentou(false);
    avisos.mostrar({ texto: 'Fornecedor salvo', tipo: 'sucesso' });
  };

  const excluirFornecedor = async () => {
    if (!casalId) return;
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: `Excluir ${c.nome.trim()}?`,
      texto: 'As parcelas também saem e as tarefas ligadas ficam sem fornecedor. Não dá para desfazer.',
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
    });
    if (!ok) return;
    liberado.current = true;
    emLote(
      casalId,
      [
        ...parcelas.map((p) => ({ tipo: 'excluir' as const, sub: 'parcelas' as const, id: p.id })),
        ...ligadas.map((t) => ({ tipo: 'atualizar' as const, sub: 'tarefas' as const, id: t.id, dados: { fornecedor_id: null } })),
        { tipo: 'excluir', sub: 'fornecedores', id },
      ],
      'excluir fornecedor',
      aoFalhar,
    );
    if (f?.contrato && online) removerContrato(id).catch(() => {});
    navigation.goBack();
    avisos.mostrar({ texto: 'Fornecedor excluído' });
  };

  // Contrato --------------------------------------------------------------------------------

  const semConexao = () => avisos.mostrar({ texto: 'O contrato precisa de internet. Tentem de novo com conexão.', tipo: 'erro' });

  const enviar = async (arquivo: { uri: string; tipo: string; nome: string }) => {
    setEnviando(true);
    try {
      await enviarContrato(id, arquivo);
      avisos.mostrar({ texto: 'Contrato anexado', tipo: 'sucesso' });
    } catch {
      avisos.mostrar({ texto: 'Não foi possível enviar o contrato. Tentem de novo.', tipo: 'erro' });
    } finally {
      setEnviando(false);
    }
  };

  const tirarFoto = async () => {
    setFolhaContrato(false);
    if (!online) return semConexao();
    // T58 antes do primeiro pedido nativo de câmera (2.5).
    if (!armazenamento.getBoolean(CHAVE_EXPLICOU_CAMERA)) return setExplicarCamera(true);
    const r = await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false });
    if (r.errorCode === 'permission') {
      // T50 · Sem acesso à câmera.
      const abrir = await confirmar({
        icone: 'camera',
        titulo: 'Sem acesso à câmera',
        texto: 'Para fotografar o contrato, permitam o acesso à câmera nos Ajustes do celular.',
        cancelar: 'Agora não',
        confirmar: 'Abrir Ajustes',
      });
      if (abrir) Linking.openSettings();
      return;
    }
    const a = r.assets?.[0];
    if (a?.uri) enviar({ uri: a.uri, tipo: a.type ?? 'image/jpeg', nome: a.fileName ?? 'contrato.jpg' });
  };

  const escolherFoto = async () => {
    setFolhaContrato(false);
    if (!online) return semConexao();
    const r = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    const a = r.assets?.[0];
    if (a?.uri) enviar({ uri: a.uri, tipo: a.type ?? 'image/jpeg', nome: a.fileName ?? 'contrato.jpg' });
  };

  const escolherPdf = async () => {
    setFolhaContrato(false);
    if (!online) return semConexao();
    try {
      const [arquivo] = await pick({ type: [types.pdf] });
      if (arquivo?.uri) enviar({ uri: arquivo.uri, tipo: arquivo.type ?? 'application/pdf', nome: arquivo.name ?? 'contrato.pdf' });
    } catch (erro) {
      if (isErrorWithCode(erro) && erro.code === errorCodes.OPERATION_CANCELED) return;
      avisos.mostrar({ texto: 'Não foi possível abrir este arquivo.', tipo: 'erro' });
    }
  };

  const abrirContrato = async () => {
    if (!f?.contrato) return;
    if (!online) return semConexao();
    try {
      Linking.openURL(await linkDoArquivo(f.contrato));
    } catch {
      avisos.mostrar({ texto: 'Não foi possível abrir o contrato.', tipo: 'erro' });
    }
  };

  const tirarContrato = async () => {
    if (!online) return semConexao();
    const ok = await confirmar({ tom: 'destrutivo', titulo: 'Remover o contrato?', texto: 'O arquivo sai do Lartiê.', cancelar: 'Cancelar', confirmar: 'Remover' });
    if (!ok) return;
    try {
      await removerContrato(id);
      avisos.mostrar({ texto: 'Contrato removido' });
    } catch {
      avisos.mostrar({ texto: 'Não foi possível remover o contrato.', tipo: 'erro' });
    }
  };

  // Parcelas --------------------------------------------------------------------------------

  const mostrarParcelas = verTodas || parcelas.length <= 3 ? parcelas : parcelas.slice(0, 2);
  const restantes = parcelas.slice(2);

  // Tela ------------------------------------------------------------------------------------

  const contatos = [
    c.contato_whatsapp && {
      rotulo: 'WhatsApp',
      principal: true,
      abrir: () => {
        const d = digitos(c.contato_whatsapp);
        Linking.openURL(`https://wa.me/${d.startsWith('55') ? d : `55${d}`}`);
      },
    },
    c.contato_instagram && { rotulo: 'Instagram', principal: false, abrir: () => Linking.openURL(`https://instagram.com/${c.contato_instagram.replace(/^@/, '')}`) },
    c.contato_telefone && { rotulo: 'Ligar', principal: false, abrir: () => Linking.openURL(`tel:${digitos(c.contato_telefone)}`) },
  ].filter(Boolean) as { rotulo: string; principal: boolean; abrir: () => void }[];

  const tarefaFechada = ligadas.find((t) => t.status === 'concluida');
  const opcoesCategoria = categorias.map((x) => ({ valor: x.id, rotulo: x.nome }));

  return (
    <TelaPilha
      titulo="Fornecedor"
      direita={
        novo ? null : (
          <Pressable
            onPress={() => {
              if (editando) {
                setC(JSON.parse(inicial.current));
                setTentou(false);
              }
              setEditando((e) => !e);
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Texto papel="corpo" peso="600" cor="primary">
              {editando ? 'Cancelar' : 'Editar'}
            </Texto>
          </Pressable>
        )
      }
      rodape={
        editando || c.status === 'fechado' ? (
          <Botao rotulo="Salvar" larguraTotal onPress={salvar} />
        ) : (
          <Botao rotulo="Marcar como fechado" larguraTotal onPress={fechar} />
        )
      }
    >
      {editando ? (
        <>
          <CampoTexto rotulo="Nome" value={c.nome} onChangeText={(t) => mudar('nome', t)} maxLength={80} erro={erros.nome} autoCapitalize="words" />
          <CampoSelecao rotulo="Categoria" opcoes={opcoesCategoria} valor={c.categoria} onMudar={(v) => mudar('categoria', v)} erro={erros.categoria} />
          <CampoTexto rotulo="WhatsApp" value={c.contato_whatsapp} onChangeText={(t) => mudar('contato_whatsapp', t)} keyboardType="phone-pad" placeholder="(41) 99999-0000" />
          <CampoTexto
            rotulo="Instagram"
            value={c.contato_instagram}
            onChangeText={(t) => mudar('contato_instagram', t)}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="@studioluz"
          />
          <CampoTexto rotulo="Telefone" value={c.contato_telefone} onChangeText={(t) => mudar('contato_telefone', t)} keyboardType="phone-pad" />
          <CampoData rotulo="Data do orçamento" valor={c.data_orcamento} onMudar={(d) => mudar('data_orcamento', d)} />
        </>
      ) : (
        <>
          <View style={estilos.linhaCentro}>
            <AvatarIniciais texto={iniciais(c.nome)} tamanho={60} />
            <View style={estilos.flex}>
              <Texto papel="tituloDestaque" peso="700" accessibilityRole="header">
                {c.nome}
              </Texto>
              <Texto papel="corpo" cor="onSurfaceVariant">
                {nomeCategoria(c.categoria)}
                {c.data_orcamento ? ` · orçado em ${formatarData(c.data_orcamento).slice(0, 5)}` : ''}
              </Texto>
            </View>
          </View>
          {contatos.length ? (
            <View style={estilos.linha}>
              {contatos.map((x) => (
                <View key={x.rotulo} style={estilos.flex}>
                  <Botao rotulo={x.rotulo} variante={x.principal ? 'whatsapp' : 'contornado'} larguraTotal onPress={x.abrir} />
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Status</Texto>
        <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Status">
          {STATUS_FORNECEDOR.map((s) => (
            <Chip key={s} rotulo={STATUS_FORNECEDOR_ROTULO[s]} selecionado={c.status === s} onPress={() => mudarStatus(s)} />
          ))}
        </View>
      </View>

      {!novo && c.status === 'fechado' ? (
        <View style={[estilos.faixa, { backgroundColor: cores.successContainer }]} accessibilityRole="alert">
          <Icone nome="checkCirculo" cor={cores.success} />
          <Texto papel="metadado" cor="success" style={estilos.flex}>
            Fechado. O valor entrou no orçamento, as parcelas foram para o calendário
            {tarefaFechada ? ` e a tarefa “${tarefaFechada.titulo}” foi concluída.` : '.'}
          </Texto>
        </View>
      ) : null}

      <Cartao style={estilos.detalhes}>
        <CampoMoeda rotulo="Valor" valor={c.valor} onMudar={(v) => mudar('valor', v)} onBlur={() => aoSairDoCampo('valor')} />
        <CampoTexto
          rotulo="O que inclui"
          value={c.o_que_inclui}
          onChangeText={(t) => mudar('o_que_inclui', t)}
          onBlur={() => aoSairDoCampo('o_que_inclui')}
          multiline
          maxLength={500}
        />
        <CampoTexto
          rotulo="Pagamento"
          value={c.forma_pagamento}
          onChangeText={(t) => mudar('forma_pagamento', t)}
          onBlur={() => aoSairDoCampo('forma_pagamento')}
          placeholder="Entrada + 5x"
          maxLength={60}
        />
      </Cartao>

      <Texto papel="tituloSecao" peso="700" accessibilityRole="header">
        Parcelas
      </Texto>
      {novo ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Salvem o fornecedor para adicionar as parcelas e o contrato.
        </Texto>
      ) : (
        <>
          {parcelas.length ? (
            <Cartao semPadding>
              {mostrarParcelas.map((p, i) => (
                <View key={p.id}>
                  {i > 0 ? <Divisoria /> : null}
                  <Pressable onPress={() => setParcelaAberta(p)} accessibilityRole="button" style={estilos.parcela}>
                    <Texto papel="corpo" cor={p.paga ? 'onSurfaceVariant' : 'onSurface'} style={estilos.flex}>
                      {p.descricao} · {formatarData(p.vencimento)}
                      {p.paga ? ' · paga' : ''}
                    </Texto>
                    <Texto papel="nomeItem" peso="700">
                      {formatarReais(p.valor)}
                    </Texto>
                  </Pressable>
                </View>
              ))}
              {!verTodas && parcelas.length > 3 ? (
                <>
                  <Divisoria />
                  <Pressable onPress={() => setVerTodas(true)} accessibilityRole="button" style={estilos.parcela}>
                    <Texto papel="corpo" cor="onSurfaceVariant" style={estilos.flex}>
                      + {restantes.length} parcelas até {formatarData(restantes[restantes.length - 1]!.vencimento)}
                    </Texto>
                    <Texto papel="corpo" cor="onSurfaceVariant">
                      {formatarReais(restantes.reduce((s, p) => s + p.valor, 0))}
                    </Texto>
                  </Pressable>
                </>
              ) : null}
            </Cartao>
          ) : null}
          {diferenca !== 0 ? (
            <Texto papel="metadado" cor="warning">
              A soma das parcelas ({formatarReais((c.valor ?? 0) + diferenca)}) é diferente do valor ({formatarReais(c.valor)}).
            </Texto>
          ) : null}
          <View style={estilos.linha}>
            <View style={estilos.flex}>
              <Botao
                rotulo="+ Parcela"
                variante="tonal"
                larguraTotal
                onPress={() =>
                  setParcelaAberta({ numero: (parcelas[parcelas.length - 1]?.numero ?? -1) + 1, vencimento: hojeLocal(), paga: false })
                }
              />
            </View>
            <View style={estilos.flex}>
              <Botao rotulo="Gerar parcelas" variante="contornado" larguraTotal desativado={!c.valor} onPress={() => setGerar(true)} />
            </View>
          </View>

          <Texto papel="tituloSecao" peso="700" accessibilityRole="header">
            Contrato
          </Texto>
          {f?.contrato ? (
            <Cartao style={estilos.linhaCentro}>
              <Icone nome="documento" cor={cores.primary} />
              <Texto papel="nomeItem" style={estilos.flex}>
                {f.contrato.endsWith('.pdf') ? 'Contrato (PDF)' : 'Contrato (foto)'}
              </Texto>
              <Botao rotulo="Abrir" variante="texto" compacto onPress={abrirContrato} />
              <Botao rotulo="Remover" variante="destrutivo" compacto onPress={tirarContrato} />
            </Cartao>
          ) : (
            <Botao rotulo="Anexar contrato (PDF ou foto)" variante="contornado" icone="anexo" larguraTotal carregando={enviando} onPress={() => setFolhaContrato(true)} />
          )}
        </>
      )}

      <CampoTexto rotulo="Notas" value={c.notas} onChangeText={(t) => mudar('notas', t)} onBlur={() => aoSairDoCampo('notas')} multiline maxLength={1000} />

      {novo ? null : <Botao rotulo="Excluir fornecedor" variante="destrutivo" onPress={excluirFornecedor} />}

      <FolhaParcela parcela={parcelaAberta} fornecedorId={id} onFechar={() => setParcelaAberta(null)} />
      <FolhaGerarParcelas visivel={gerar} valor={c.valor} existentes={parcelas} fornecedorId={id} onFechar={() => setGerar(false)} />
      <FolhaInferior visivel={folhaContrato} titulo="Contrato" onFechar={() => setFolhaContrato(false)}>
        <Botao rotulo="Escolher arquivo (PDF)" variante="tonal" icone="documento" larguraTotal onPress={escolherPdf} />
        <Botao rotulo="Tirar foto" variante="tonal" icone="camera" larguraTotal onPress={tirarFoto} />
        <Botao rotulo="Escolher da galeria" variante="tonal" larguraTotal onPress={escolherFoto} />
      </FolhaInferior>
      <Modal visible={explicarCamera} animationType="slide" onRequestClose={() => setExplicarCamera(false)}>
        <ExplicacaoPermissao
          tipo="camera"
          onPermitir={() => {
            armazenamento.set(CHAVE_EXPLICOU_CAMERA, true);
            setExplicarCamera(false);
            tirarFoto();
          }}
          onAgoraNao={() => setExplicarCamera(false)}
        />
      </Modal>
    </TelaPilha>
  );
}

function FolhaParcela({
  parcela,
  fornecedorId,
  onFechar,
}: {
  parcela: (Partial<Parcela> & { id?: string }) | null;
  fornecedorId: string;
  onFechar: () => void;
}) {
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | null>(null);
  const [vencimento, setVencimento] = useState<string>(hojeLocal());
  const [paga, setPaga] = useState(false);
  const chave = parcela ? parcela.id ?? `nova-${parcela.numero}` : null;
  useEffect(() => {
    if (!parcela) return;
    setDescricao(parcela.descricao ?? (parcela.numero === 0 ? 'Entrada' : `Parcela ${parcela.numero}`));
    setValor(parcela.valor ?? null);
    setVencimento(parcela.vencimento ?? hojeLocal());
    setPaga(parcela.paga ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const aoFalhar = () => erroAoSalvar();
  const salvar = () => {
    if (!casalId || !parcela || !valor) return;
    const dados = { fornecedor_id: fornecedorId, numero: parcela.numero ?? 1, descricao: descricao.trim() || 'Parcela', valor, vencimento, paga, paga_em: paga ? parcela.paga_em ?? hojeLocal() : null };
    if (parcela.id) atualizar(casalId, 'parcelas', parcela.id, dados, aoFalhar);
    else emLote(casalId, [{ tipo: 'criar', sub: 'parcelas', dados }], 'criar parcela', aoFalhar);
    onFechar();
  };
  const excluirParcela = async () => {
    if (!casalId || !parcela?.id) return;
    const ok = await confirmar({ tom: 'destrutivo', titulo: `Excluir “${descricao}”?`, cancelar: 'Cancelar', confirmar: 'Excluir' });
    if (!ok) return;
    emLote(casalId, [{ tipo: 'excluir', sub: 'parcelas', id: parcela.id }], 'excluir parcela', aoFalhar);
    onFechar();
  };
  return (
    <FolhaInferior visivel={!!parcela} titulo={parcela?.id ? 'Parcela' : 'Nova parcela'} onFechar={onFechar}>
      <CampoTexto rotulo="Descrição" value={descricao} onChangeText={setDescricao} maxLength={40} />
      <View style={estilos.linha}>
        <CampoMoeda rotulo="Valor" valor={valor} onMudar={setValor} />
        <CampoData rotulo="Vencimento" valor={vencimento} onMudar={setVencimento} />
      </View>
      <Chip rotulo={paga ? 'Paga' : 'Marcar como paga'} selecionado={paga} onPress={() => setPaga((p) => !p)} />
      <Botao rotulo="Salvar" larguraTotal desativado={!valor} onPress={salvar} />
      {parcela?.id ? <Botao rotulo="Excluir parcela" variante="destrutivo" larguraTotal onPress={excluirParcela} /> : null}
    </FolhaInferior>
  );
}

function FolhaGerarParcelas({
  visivel,
  valor,
  existentes,
  fornecedorId,
  onFechar,
}: {
  visivel: boolean;
  valor: number | null;
  existentes: (Parcela & { id: string })[];
  fornecedorId: string;
  onFechar: () => void;
}) {
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const [n, setN] = useState(5);
  const [entrada, setEntrada] = useState<string>(hojeLocal());
  const gerarAgora = async () => {
    if (!casalId || !valor) return;
    if (existentes.length) {
      const ok = await confirmar({
        titulo: 'Substituir as parcelas?',
        texto: 'As parcelas atuais saem e entram a entrada e as novas parcelas.',
        cancelar: 'Cancelar',
        confirmar: 'Substituir',
      });
      if (!ok) return;
    }
    emLote(
      casalId,
      [
        ...existentes.map((p) => ({ tipo: 'excluir' as const, sub: 'parcelas' as const, id: p.id })),
        ...gerarParcelas(valor, n, entrada).map((p) => ({
          tipo: 'criar' as const,
          sub: 'parcelas' as const,
          dados: { ...p, fornecedor_id: fornecedorId, paga_em: null },
        })),
      ],
      'gerar parcelas',
      () => erroAoSalvar(),
    );
    avisos.mostrar({ texto: `Entrada + ${n} parcelas criadas`, tipo: 'sucesso' });
    onFechar();
  };
  return (
    <FolhaInferior visivel={visivel} titulo="Gerar parcelas" onFechar={onFechar}>
      <Texto papel="corpo" cor="onSurfaceVariant">
        Entrada + {n} parcelas mensais de {formatarReais(valor ? Math.floor(valor / (n + 1)) : 0)}.
      </Texto>
      <View style={estilos.linha}>
        <Contador rotulo="Parcelas" valor={n} onMudar={setN} minimo={1} maximo={24} />
        <CampoData rotulo="Entrada em" valor={entrada} onMudar={setEntrada} />
      </View>
      <Botao rotulo="Gerar" larguraTotal onPress={gerarAgora} />
    </FolhaInferior>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', gap: espacos.space3, alignItems: 'flex-start' },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  grupo: { gap: espacos.space2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
  faixa: { flexDirection: 'row', gap: espacos.space3, padding: espacos.space3, borderRadius: raios.radiusMd, alignItems: 'flex-start' },
  detalhes: { gap: espacos.space3 },
  parcela: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3, padding: espacos.space4 },
});
