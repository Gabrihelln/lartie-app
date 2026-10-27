import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { waitForPendingWrites } from '@react-native-firebase/firestore';
import { raios } from '@lartie/tokens';
import {
  caminhos,
  FASES_ITEM,
  type EstadoItem,
  type FaseItem,
  type Item as TipoItem,
  type OrigemItem,
} from '@lartie/modelo';
import {
  checarEncaixe,
  doComodo,
  emComodo,
  FASES_ENXOVAL,
  formatarMetros,
  moduloVisivel,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoSelecao } from '../../componentes/CampoSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { CampoMoeda } from '../../componentes/CamposMascarados';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import { TelaPilha } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { useFonteArquivo } from '../../componentes/FotoCasal';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import {
  criarComId,
  emLote,
  novoId,
  type OperacaoLote,
} from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { useCategorias, useComodos, useListaItens } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { ExplicacaoPermissao } from '../../feedback/ExplicacaoPermissao';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { ParamsRaiz } from '../../navegacao/tipos';
import {
  enviarFotoItem,
  fotoDoLink,
  previaDoLink,
  removerFotoItem,
} from '../../servicos/api';
import { registrarErro, registrarEvento } from '../../servicos/analytics';
import { armazenamento } from '../../servicos/armazenamento';
import { useConexao } from '../../servicos/conexao';
import { db } from '../../servicos/firebase';
import { espacos, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';
import { useConferirComodo, useEstadoItem, type ItemComId } from './comum';

// T20 · Item (Item.dc.html), criar e editar. Nome obrigatório; quantidade ≥ 1; link com formato
// válido. "Como chegou" só com "Já tenho"; "Quem deu?" só com "Ganhado" (cria o registro em
// Agradecimentos); a categoria do orçamento só com "Comprado" (decisão de 26/10/2026).
// Ao colar o link da loja, a API tenta ler o preço e a foto (pode falhar sem aviso).
// A foto pela câmera é uma foto simples: o cadastro por foto com IA (T22) está fora do escopo (P14).

const CHAVE_EXPLICOU_CAMERA = 'permissao.camera.explicada';
const OPCOES_FOTO = {
  mediaType: 'photo',
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
  includeBase64: false,
} as const;
const FASE_CURTA: Record<FaseItem, string> = {
  primeira_noite: '1ª noite',
  primeiro_mes: '1º mês',
  com_calma: 'Com calma',
};

type Campos = {
  nome: string;
  comodo_id: string | null;
  fase: FaseItem;
  quantidade: string;
  estado: EstadoItem;
  origem: OrigemItem | null;
  quem_deu: string;
  categoria_orcamento: string | null;
  preco_estimado: number | null;
  link_loja: string;
  largura: string;
  profundidade: string;
  altura: string;
  parede_destino: string | null;
  observacao: string;
};

const linkValido = (l: string) => {
  if (!l.trim()) return true;
  try {
    const u = new URL(l.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};
const numero = (t: string) =>
  t.trim()
    ? Math.max(0, Math.round(Number(t.replace(',', '.')))) || null
    : null;

export function Item() {
  const { modo } = useSessao();
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'casa'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casa" />;
  if (!moduloVisivel(modo, 'casa')) return null;
  return <TelaItem />;
}

function TelaItem() {
  const { cores } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Item'>>();
  const { casalId } = useSessao();
  const { online } = useConexao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const estadoItem = useEstadoItem();
  const conferir = useConferirComodo();
  const novo = !params?.id;
  const id = useMemo(
    () => params?.id ?? (casalId ? novoId(casalId, 'itens') : ''),
    [params?.id, casalId],
  );
  const leitura = useDocumento<TipoItem>(
    casalId && !novo ? caminhos.documento(casalId, 'itens', id) : null,
  );
  const item = leitura.dados;
  const comodos = [...useComodos().dados].sort((a, b) => a.ordem - b.ordem);
  const categorias = useCategorias()
    .dados.filter(c => c.escopo === 'casa')
    .sort((a, b) => a.ordem - b.ordem);
  const listaItens = useListaItens().dados;
  const foto = useFonteArquivo(item?.foto);

  const vazio: Campos = {
    nome: '',
    comodo_id: params?.comodoId ?? null,
    fase: 'primeiro_mes',
    quantidade: '1',
    estado: 'falta',
    origem: null,
    quem_deu: '',
    categoria_orcamento: null,
    preco_estimado: null,
    link_loja: '',
    largura: '',
    profundidade: '',
    altura: '',
    parede_destino: null,
    observacao: '',
  };
  const [c, setC] = useState<Campos>(vazio);
  const inicial = useRef(JSON.stringify(vazio));
  const liberado = useRef(false);
  const [tentou, setTentou] = useState(false);
  const [fotoLocal, setFotoLocal] = useState<{
    uri: string;
    tipo: string;
    nome: string;
  } | null>(null);
  const [fotoDaLoja, setFotoDaLoja] = useState<string | null>(null);
  const [tituloDaLoja, setTituloDaLoja] = useState<string | null>(null);
  const [folhaFoto, setFolhaFoto] = useState(false);
  const [explicarCamera, setExplicarCamera] = useState(false);
  const preenchido = useRef(false);

  useEffect(() => {
    if (!item || preenchido.current) return;
    preenchido.current = true;
    const campos: Campos = {
      nome: item.nome,
      comodo_id: item.comodo_id,
      fase: item.fase,
      quantidade: String(item.quantidade),
      estado: item.estado,
      origem: item.origem,
      quem_deu: item.quem_deu ?? '',
      categoria_orcamento: item.categoria_orcamento ?? null,
      preco_estimado: item.preco_estimado,
      link_loja: item.link_loja ?? '',
      largura: item.medidas?.largura_cm ? String(item.medidas.largura_cm) : '',
      profundidade: item.medidas?.profundidade_cm
        ? String(item.medidas.profundidade_cm)
        : '',
      altura: item.medidas?.altura_cm ? String(item.medidas.altura_cm) : '',
      parede_destino: item.parede_destino,
      observacao: item.observacao ?? '',
    };
    inicial.current = JSON.stringify(campos);
    setC(campos);
  }, [item]);

  const mudar = <K extends keyof Campos>(k: K, v: Campos[K]) =>
    setC(x => ({ ...x, [k]: v }));
  const alterado = JSON.stringify(c) !== inicial.current || !!fotoLocal;
  useDescartarAlteracoes({
    temAlteracoes: alterado,
    oQue: 'este item',
    liberado,
  });

  if (!novo && leitura.carregando)
    return <TelaPilha titulo="Item">{null}</TelaPilha>;
  if (!novo && !item) {
    return (
      <TelaPilha titulo="Item">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Este item foi excluído.
        </Texto>
      </TelaPilha>
    );
  }

  const comodo = comodos.find(x => x.id === c.comodo_id);
  const paredes = comodo?.paredes_livres ?? [];
  const parede = paredes.find(p => p.id === c.parede_destino) ?? null;
  const qtd = Number(c.quantidade);
  const erros = {
    nome: c.nome.trim() ? null : 'Informe o nome do item.',
    comodo: c.comodo_id ? null : 'Escolha o cômodo.',
    quantidade: Number.isInteger(qtd) && qtd >= 1 ? null : 'Use 1 ou mais.',
    link: linkValido(c.link_loja)
      ? null
      : 'Cole um link que comece com https://',
  };
  const valido = !Object.values(erros).some(Boolean);
  const encaixe = checarEncaixe(
    { nome: c.nome || 'O item', largura_cm: numero(c.largura) },
    parede,
  );
  const aoFalhar = () => erroAoSalvar();

  // Link da loja -----------------------------------------------------------------------------

  const lerLink = async () => {
    const l = c.link_loja.trim();
    if (!l || !linkValido(l) || !online) return;
    try {
      const p = await previaDoLink(l);
      setTituloDaLoja(p.titulo);
      if (p.preco && !c.preco_estimado) mudar('preco_estimado', p.preco);
      if (p.imagem && !item?.foto && !fotoLocal) setFotoDaLoja(p.imagem);
      if (p.titulo && !c.nome.trim()) mudar('nome', p.titulo.slice(0, 60));
    } catch {
      // A especificação permite falhar em silêncio.
    }
  };

  // Foto -------------------------------------------------------------------------------------

  const tratarFoto = async (r: ImagePickerResponse) => {
    if (r.didCancel) return;
    if (r.errorCode === 'permission') {
      // T50
      const abrir = await confirmar({
        icone: 'camera',
        titulo: 'Sem acesso à câmera',
        texto:
          'Para fotografar o item, permitam o acesso à câmera nos Ajustes do celular.',
        cancelar: 'Agora não',
        confirmar: 'Abrir Ajustes',
      });
      if (abrir) Linking.openSettings();
      return;
    }
    const a = r.assets?.[0];
    if (!a?.uri) return;
    setFotoLocal({
      uri: a.uri,
      tipo: a.type ?? 'image/jpeg',
      nome: a.fileName ?? 'item.jpg',
    });
    setFotoDaLoja(null);
  };

  const tirarFoto = () => {
    setFolhaFoto(false);
    // T58 antes do primeiro pedido nativo de câmera (2.5).
    if (!armazenamento.getBoolean(CHAVE_EXPLICOU_CAMERA))
      return setExplicarCamera(true);
    launchCamera({ ...OPCOES_FOTO, saveToPhotos: false }).then(tratarFoto);
  };

  const escolherFoto = () => {
    setFolhaFoto(false);
    launchImageLibrary({ ...OPCOES_FOTO, selectionLimit: 1 }).then(tratarFoto);
  };

  const tirarFotoAtual = async () => {
    setFolhaFoto(false);
    setFotoLocal(null);
    setFotoDaLoja(null);
    if (item?.foto) {
      if (!online)
        return avisos.mostrar({
          texto: 'Remover a foto precisa de internet.',
          tipo: 'erro',
        });
      removerFotoItem(id).catch(() =>
        avisos.mostrar({
          texto: 'Não foi possível remover a foto.',
          tipo: 'erro',
        }),
      );
    }
  };

  /** Envia a foto depois de o item chegar ao servidor (a API confere o item). */
  const enviarFotoDepois = (local: typeof fotoLocal, daLoja: string | null) => {
    if (!local && !daLoja) return;
    if (!online) {
      avisos.mostrar({
        texto:
          'O item foi salvo. A foto precisa de internet: adicionem depois.',
        tipo: 'erro',
      });
      return;
    }
    waitForPendingWrites(db())
      .then(() => (local ? enviarFotoItem(id, local) : fotoDoLink(id, daLoja!)))
      .catch(erro => {
        if (local) {
          registrarErro(erro, 'foto do item');
          avisos.mostrar({
            texto:
              'O item foi salvo, mas a foto não foi enviada. Tentem de novo.',
            tipo: 'erro',
          });
        }
      });
  };

  // Salvar e excluir -------------------------------------------------------------------------

  const salvar = async () => {
    setTentou(true);
    if (!valido || !casalId || !comodo) return;
    const largura = numero(c.largura);
    const profundidade = numero(c.profundidade);
    const altura = numero(c.altura);
    const dados: Partial<TipoItem> = {
      nome: c.nome.trim(),
      comodo_id: comodo.id,
      fase: c.fase,
      quantidade: qtd,
      preco_estimado: c.preco_estimado,
      link_loja: c.link_loja.trim() || null,
      medidas:
        largura || profundidade || altura
          ? {
              largura_cm: largura,
              profundidade_cm: profundidade,
              altura_cm: altura,
            }
          : null,
      parede_destino: paredes.some(p => p.id === c.parede_destino)
        ? c.parede_destino
        : null,
      observacao: c.observacao.trim() || null,
      categoria_orcamento: c.categoria_orcamento,
    };
    const base: ItemComId = {
      ...(item as TipoItem),
      ...(dados as TipoItem),
      id,
      estado: item?.estado ?? 'falta',
    };

    // Mudar para "Na lista" pelo formulário segue as regras do botão de estado (T19).
    if (c.estado === 'na_lista' && item?.estado !== 'na_lista') {
      if (novo) {
        avisos.mostrar({
          texto: 'Salvem o item antes de colocar na lista de presentes.',
        });
        return;
      }
      liberado.current = true;
      emLote(
        casalId,
        [{ tipo: 'atualizar', sub: 'itens', id, dados }],
        'salvar item',
        aoFalhar,
      );
      navigation.goBack();
      await estadoItem.irParaLista(base);
      return;
    }

    const ops: OperacaoLote[] = [];
    const campos: Partial<TipoItem> = {
      ...dados,
      estado: c.estado,
      origem: c.estado === 'ja_tenho' ? c.origem : null,
      quem_deu:
        c.estado === 'ja_tenho' && c.origem === 'ganhado'
          ? c.quem_deu.trim() || null
          : null,
    };
    // "Ganhado" com um nome novo cria o registro em Agradecimentos (T27).
    if (campos.quem_deu && campos.quem_deu !== item?.quem_deu) {
      ops.push(
        ...estadoItem.opsChegada(base, {
          origem: 'ganhado',
          quem_deu: campos.quem_deu,
          categoria_orcamento: null,
        }),
      );
    }
    // Saiu de "Na lista": sai das listas de presentes. Reservas ativas são tratadas na Etapa 5.
    if (item?.estado === 'na_lista' && c.estado !== 'na_lista') {
      for (const l of listaItens.filter(x => x.item_id === id))
        ops.push({ tipo: 'excluir', sub: 'lista_itens', id: l.id });
    }
    liberado.current = true;
    if (novo) {
      criarComId(
        casalId,
        'itens',
        id,
        {
          ...campos,
          gerado_pelo_plano: false,
          catalogo_id: null,
          bom_para_presente: false,
          era_de: null,
          foto: null,
        },
        aoFalhar,
      );
      if (ops.length) emLote(casalId, ops, 'salvar item', aoFalhar);
      registrarEvento({ nome: 'item_criado', params: { fase: c.fase } });
    } else {
      emLote(
        casalId,
        [{ tipo: 'atualizar', sub: 'itens', id, dados: campos }, ...ops],
        'salvar item',
        aoFalhar,
      );
      if (campos.estado !== item!.estado)
        registrarEvento({
          nome: 'item_estado_alterado',
          params: { estado: c.estado, origem: String(campos.origem ?? '') },
        });
    }
    conferir(comodo.id, { [id]: { ...campos, comodo_id: comodo.id } });
    if (!novo && item!.comodo_id !== comodo.id)
      conferir(item!.comodo_id, { [id]: { comodo_id: comodo.id } });
    enviarFotoDepois(fotoLocal, fotoDaLoja);
    navigation.goBack();
    avisos.mostrar({
      texto: `Item salvo ${emComodo(comodo.nome)}`,
      tipo: 'sucesso',
    });
  };

  // T35
  const excluirItem = async () => {
    if (!casalId || novo) return;
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: `Excluir “${c.nome.trim()}”?`,
      texto: `O item sai do enxoval${
        comodo ? ` ${doComodo(comodo.nome)}` : ''
      } e da lista de presentes. Se alguém já reservou, o convidado será avisado.`,
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
    });
    if (!ok) return;
    liberado.current = true;
    emLote(
      casalId,
      [
        ...listaItens
          .filter(l => l.item_id === id)
          .map(l => ({
            tipo: 'excluir' as const,
            sub: 'lista_itens' as const,
            id: l.id,
          })),
        { tipo: 'excluir', sub: 'itens', id },
      ],
      'excluir item',
      aoFalhar,
    );
    if (item?.foto && online) removerFotoItem(id).catch(() => {});
    registrarEvento({ nome: 'item_excluido', params: {} });
    navigation.goBack();
    avisos.mostrar({ texto: 'Item excluído' });
  };

  const fonteFoto = fotoLocal
    ? { uri: fotoLocal.uri }
    : fotoDaLoja
    ? { uri: fotoDaLoja }
    : foto;

  return (
    <TelaPilha
      titulo={novo ? 'Novo item' : 'Item'}
      direita={
        novo ? null : (
          <Pressable
            onPress={excluirItem}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Texto papel="corpo" peso="600" cor="error">
              Excluir
            </Texto>
          </Pressable>
        )
      }
      rodape={
        <Botao
          rotulo="Salvar item"
          larguraTotal
          desativado={tentou && !valido}
          onPress={salvar}
        />
      }
    >
      <View style={estilos.linha}>
        <Pressable
          onPress={() => setFolhaFoto(true)}
          accessibilityRole="button"
          accessibilityLabel={
            fonteFoto ? 'Trocar a foto do item' : 'Adicionar foto do item'
          }
          style={[
            estilos.foto,
            {
              backgroundColor: cores.primaryContainer,
              borderColor: cores.outlineAccent,
            },
          ]}
        >
          {fonteFoto ? (
            <Image source={fonteFoto} style={estilos.imagem} />
          ) : (
            <Icone nome="camera" cor={cores.primary} tamanho={32} />
          )}
        </Pressable>
        <View style={estilos.flex}>
          <CampoTexto
            rotulo="Nome"
            value={c.nome}
            onChangeText={t => mudar('nome', t)}
            maxLength={60}
            erro={tentou ? erros.nome : null}
          />
        </View>
      </View>

      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <CampoSelecao
            rotulo="Cômodo"
            opcoes={comodos.map(x => ({ valor: x.id, rotulo: x.nome }))}
            valor={c.comodo_id}
            onMudar={v => mudar('comodo_id', v)}
            erro={tentou ? erros.comodo : null}
          />
        </View>
        <View style={estilos.flex}>
          <CampoSelecao
            rotulo="Fase"
            opcoes={FASES_ITEM.map(f => ({ valor: f, rotulo: FASE_CURTA[f] }))}
            valor={c.fase}
            onMudar={v => mudar('fase', v)}
          />
        </View>
        <View style={estilos.qtd}>
          <CampoTexto
            rotulo="Qtd."
            value={c.quantidade}
            onChangeText={t =>
              mudar('quantidade', t.replace(/\D/g, '').slice(0, 3))
            }
            keyboardType="number-pad"
            erro={tentou ? erros.quantidade : null}
          />
        </View>
      </View>

      <EscolhaUnica
        rotulo="Estado"
        opcoes={[
          { valor: 'falta', rotulo: 'Falta' },
          { valor: 'ja_tenho', rotulo: 'Já tenho' },
          { valor: 'na_lista', rotulo: 'Na lista' },
        ]}
        selecionado={c.estado}
        onMudar={v => mudar('estado', v)}
      />
      {c.estado === 'ja_tenho' ? (
        <EscolhaUnica
          rotulo="Como chegou"
          opcoes={[
            { valor: 'comprado', rotulo: 'Comprado' },
            { valor: 'ganhado', rotulo: 'Ganhado' },
            { valor: 'ja_era_nosso', rotulo: 'Já era nosso' },
          ]}
          selecionado={c.origem}
          onMudar={v => mudar('origem', v)}
        />
      ) : null}
      {c.estado === 'ja_tenho' && c.origem === 'ganhado' ? (
        <CampoTexto
          rotulo="Quem deu?"
          value={c.quem_deu}
          onChangeText={t => mudar('quem_deu', t)}
          autoCapitalize="words"
          maxLength={60}
        />
      ) : null}
      {c.estado === 'ja_tenho' &&
      c.origem === 'comprado' &&
      categorias.length ? (
        <CampoSelecao
          rotulo="Categoria no orçamento"
          opcoes={categorias.map(x => ({ valor: x.id, rotulo: x.nome }))}
          valor={c.categoria_orcamento ?? 'casa_enxoval'}
          onMudar={v => mudar('categoria_orcamento', v)}
        />
      ) : null}

      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <CampoMoeda
            rotulo="Preço estimado"
            valor={c.preco_estimado}
            onMudar={v => mudar('preco_estimado', v)}
          />
        </View>
        <View style={estilos.flex}>
          <CampoTexto
            rotulo="Link da loja"
            placeholder="Cole o link"
            value={c.link_loja}
            onChangeText={t => mudar('link_loja', t)}
            onBlur={lerLink}
            onSubmitEditing={lerLink}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            erro={tentou ? erros.link : null}
          />
        </View>
      </View>
      {tituloDaLoja ? (
        <Texto papel="ajuda" cor="onSurfaceVariant" numberOfLines={2}>
          Da loja: {tituloDaLoja}
        </Texto>
      ) : null}

      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Medidas (cm)</Texto>
        <View style={estilos.linha}>
          {(
            [
              ['largura', 'Largura'],
              ['profundidade', 'Profundidade'],
              ['altura', 'Altura'],
            ] as const
          ).map(([k, rotulo]) => (
            <View key={k} style={estilos.flex}>
              <CampoTexto
                rotulo={rotulo}
                value={c[k]}
                onChangeText={t => mudar(k, t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                accessibilityLabel={`${rotulo} em centímetros`}
              />
            </View>
          ))}
        </View>
      </View>

      {paredes.length ? (
        <CampoSelecao
          rotulo="Onde vai ficar"
          placeholder="Escolher parede ou espaço"
          opcoes={paredes.map(p => ({
            valor: p.id,
            rotulo: `${p.nome} · ${formatarMetros(p.largura_m)} m`,
          }))}
          valor={c.parede_destino}
          onMudar={v => mudar('parede_destino', v)}
        />
      ) : comodo ? (
        <Texto papel="ajuda" cor="onSurfaceVariant">
          Para conferir se cabe, cadastrem as paredes livres em Medidas do
          cômodo.
        </Texto>
      ) : null}
      {encaixe ? (
        <View
          style={[
            estilos.encaixe,
            {
              backgroundColor: encaixe.cabe
                ? cores.successContainer
                : cores.errorContainer,
            },
          ]}
          accessibilityRole="alert"
        >
          <Icone
            nome={encaixe.cabe ? 'check' : 'aviso'}
            cor={encaixe.cabe ? cores.success : cores.error}
          />
          <Texto
            papel="metadado"
            peso="600"
            cor={encaixe.cabe ? 'success' : 'error'}
            style={estilos.flex}
          >
            {encaixe.texto}
          </Texto>
        </View>
      ) : null}

      <CampoTexto
        rotulo="Observação"
        placeholder="Ex.: preferimos inox"
        value={c.observacao}
        onChangeText={t => mudar('observacao', t)}
        multiline
        maxLength={500}
      />

      {estadoItem.folhas}

      <FolhaInferior
        visivel={folhaFoto}
        titulo="Foto do item"
        onFechar={() => setFolhaFoto(false)}
      >
        <Botao
          rotulo="Tirar foto"
          variante="tonal"
          icone="camera"
          larguraTotal
          onPress={tirarFoto}
        />
        <Botao
          rotulo="Escolher da galeria"
          variante="tonal"
          larguraTotal
          onPress={escolherFoto}
        />
        {fonteFoto ? (
          <Botao
            rotulo="Remover foto"
            variante="destrutivo"
            larguraTotal
            onPress={tirarFotoAtual}
          />
        ) : null}
      </FolhaInferior>
      <Modal
        visible={explicarCamera}
        animationType="slide"
        onRequestClose={() => setExplicarCamera(false)}
      >
        <ExplicacaoPermissao
          tipo="camera"
          onPermitir={() => {
            armazenamento.set(CHAVE_EXPLICOU_CAMERA, true);
            setExplicarCamera(false);
            launchCamera({ ...OPCOES_FOTO, saveToPhotos: false }).then(
              tratarFoto,
            );
          }}
          onAgoraNao={() => setExplicarCamera(false)}
        />
      </Modal>
    </TelaPilha>
  );
}

/** Nome curto da fase (T20). */
export const nomeFaseCurto = (f: FaseItem) => FASE_CURTA[f] ?? FASES_ENXOVAL[f];

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  linha: {
    flexDirection: 'row',
    gap: espacos.space3,
    alignItems: 'flex-start',
  },
  qtd: { width: 72 },
  grupo: { gap: espacos.space2 },
  foto: {
    width: 88,
    height: 88,
    borderRadius: raios.radiusLg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagem: { width: '100%', height: '100%' },
  encaixe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space2,
    padding: espacos.space3,
    borderRadius: raios.radiusMd,
  },
});
