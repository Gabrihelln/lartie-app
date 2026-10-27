import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { raios, tamanhos } from '@lartie/tokens';
import {
  caminhos,
  FASES_TAREFA,
  type FaseTarefa,
  type Responsavel,
  type StatusTarefa,
  type Tarefa as TipoTarefa,
} from '@lartie/modelo';
import {
  diasDeAtraso,
  faseSugeridaPelaData,
  FASES_CHECKLIST,
  hojeLocal,
  iniciais,
  moduloVisivel,
  prazoSugeridoDaFase,
  proximaOrdem,
  STATUS_FORNECEDOR_ROTULO,
  type CatalogoTarefas,
} from '@lartie/regras';
import catalogoTarefas from '../../../../dados/catalogo-tarefas.json';
import { Botao } from '../../componentes/Botao';
import { CampoData } from '../../componentes/CampoData';
import { CampoSelecao } from '../../componentes/CampoSelecao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { formatarReais } from '../../componentes/CamposMascarados';
import { EscolhaUnica } from '../../componentes/EscolhaUnica';
import {
  AvatarIniciais,
  Cartao,
  Divisoria,
  TelaPilha,
} from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { atualizar, criarComId, novoId } from '../../dados/gravacao';
import { useDocumento } from '../../dados/leitura';
import { useFornecedores, useNomes, useTarefas } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, estiloTexto, useTema } from '../../tema';
import { ModuloOculto } from '../inicio/ModuloOculto';
import { useExcluirTarefa } from './Checklist';

// T14 · Tarefa (Tarefa.dc.html), criar e editar. Título obrigatório (até 80), notas até 1.000.
// Prazo vazio usa a data sugerida da fase. Editar o prazo marca `prazo_manual` (mudar a data do
// casamento não recalcula esse prazo). Concluir a tarefa não muda o fornecedor ligado.

const CATALOGO = catalogoTarefas as unknown as CatalogoTarefas;

type Campos = {
  titulo: string;
  fase: FaseTarefa;
  prazo: string | null;
  responsavel: Responsavel;
  status: StatusTarefa;
  fornecedor_id: string | null;
  notas: string;
  lembrete_ativo: boolean;
};

export function Tarefa() {
  const { modo } = useSessao();
  // Aberta por link com o módulo oculto: Início com "Ativar Casamento?". Se o módulo sumir com a tela
  // aberta (o parceiro trocou o modo), a navegação volta para o Início sozinha (Raiz).
  const [ocultoNaAbertura] = useState(() => !moduloVisivel(modo, 'checklist'));
  if (ocultoNaAbertura) return <ModuloOculto modulo="casamento" />;
  if (!moduloVisivel(modo, 'checklist')) return null;
  return <TelaTarefa />;
}

function TelaTarefa() {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'Tarefa'>>();
  const { casal, casalId } = useSessao();
  const { nome1, nome2 } = useNomes();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const excluirTarefa = useExcluirTarefa();
  const novo = !params?.id;
  const id = useMemo(
    () => params?.id ?? (casalId ? novoId(casalId, 'tarefas') : ''),
    [params?.id, casalId],
  );
  const leitura = useDocumento<TipoTarefa>(
    casalId && !novo ? caminhos.documento(casalId, 'tarefas', id) : null,
  );
  const t = leitura.dados;
  const todas = useTarefas().dados;
  const fornecedores = useFornecedores().dados;
  const hoje = hojeLocal();

  const faseInicial =
    params?.fase ?? faseSugeridaPelaData(casal?.data_casamento ?? null, hoje);
  const vazio: Campos = {
    titulo: '',
    fase: faseInicial,
    prazo: null,
    responsavel: 'os_dois',
    status: 'a_fazer',
    fornecedor_id: null,
    notas: '',
    lembrete_ativo: true,
  };
  const [c, setC] = useState<Campos>(vazio);
  const inicial = useRef(JSON.stringify(vazio));
  const saindo = useRef(false);
  const [menu, setMenu] = useState(false);
  const [vincular, setVincular] = useState(false);
  const [busca, setBusca] = useState('');
  const preenchido = useRef(false);

  useEffect(() => {
    if (!t || preenchido.current) return;
    preenchido.current = true;
    const campos: Campos = {
      titulo: t.titulo,
      fase: t.fase,
      prazo: t.prazo,
      responsavel: t.responsavel,
      status: t.status,
      fornecedor_id: t.fornecedor_id,
      notas: t.notas ?? '',
      lembrete_ativo: t.lembrete_ativo,
    };
    inicial.current = JSON.stringify(campos);
    setC(campos);
  }, [t]);

  const mudar = <K extends keyof Campos>(k: K, v: Campos[K]) =>
    setC(x => ({ ...x, [k]: v }));
  const alterado = JSON.stringify(c) !== inicial.current;
  useDescartarAlteracoes({
    temAlteracoes: alterado,
    oQue: 'esta tarefa',
    liberado: saindo,
  });

  if (!novo && leitura.carregando)
    return <TelaPilha titulo="Tarefa">{null}</TelaPilha>;
  if (!novo && !t) {
    return (
      <TelaPilha titulo="Tarefa">
        <Texto papel="corpo" cor="onSurfaceVariant">
          Esta tarefa foi excluída.
        </Texto>
      </TelaPilha>
    );
  }

  const valido = c.titulo.trim().length > 0;
  const atraso = diasDeAtraso({ status: c.status, prazo: c.prazo }, hoje);
  const fornecedor = fornecedores.find(f => f.id === c.fornecedor_id);
  const aoFalhar = () => erroAoSalvar();

  const dados = () => {
    const prazo =
      c.prazo ??
      prazoSugeridoDaFase(c.fase, casal?.data_casamento ?? null, hoje);
    return {
      titulo: c.titulo.trim(),
      fase: c.fase,
      prazo,
      responsavel: c.responsavel,
      status: c.status,
      fornecedor_id: c.fornecedor_id,
      notas: c.notas.trim() || null,
      lembrete_ativo: c.lembrete_ativo,
    };
  };

  const salvar = () => {
    if (!valido || !casalId) return;
    saindo.current = true;
    const d = dados();
    if (novo) {
      criarComId(
        casalId,
        'tarefas',
        id,
        {
          ...d,
          oculta: false,
          ordem: proximaOrdem(todas, c.fase),
          gerada_pelo_plano: false,
          catalogo_id: null,
          prazo_manual: !!c.prazo,
        },
        aoFalhar,
      );
      registrarEvento({ nome: 'tarefa_criada', params: { fase: c.fase } });
    } else {
      const prazoMudou = t!.prazo !== d.prazo;
      atualizar(
        casalId,
        'tarefas',
        id,
        { ...d, ...(prazoMudou ? { prazo_manual: true } : {}) },
        aoFalhar,
      );
      if (t!.status !== 'concluida' && d.status === 'concluida')
        registrarEvento({
          nome: 'tarefa_concluida',
          params: { origem: 'tarefa' },
        });
    }
    navigation.goBack();
    avisos.mostrar({ texto: 'Tarefa salva', tipo: 'sucesso' });
  };

  const ocultar = () => {
    setMenu(false);
    if (!casalId || novo) return;
    saindo.current = true;
    atualizar(casalId, 'tarefas', id, { oculta: true }, aoFalhar);
    navigation.goBack();
    avisos.comDesfazer('Tarefa oculta', () =>
      atualizar(casalId, 'tarefas', id, { oculta: false }, aoFalhar),
    );
  };

  const duplicar = () => {
    setMenu(false);
    if (!casalId || novo) return;
    const copia = novoId(casalId, 'tarefas');
    criarComId(
      casalId,
      'tarefas',
      copia,
      {
        ...dados(),
        titulo: `${c.titulo.trim()} (cópia)`.slice(0, 80),
        oculta: false,
        ordem: proximaOrdem(todas, c.fase),
        gerada_pelo_plano: false,
        catalogo_id: null,
        prazo_manual: true,
      },
      aoFalhar,
    );
    saindo.current = true;
    navigation.goBack();
    avisos.mostrar({ texto: 'Tarefa duplicada', tipo: 'sucesso' });
  };

  const excluirEsta = async () => {
    setMenu(false);
    if (novo) return navigation.goBack();
    saindo.current = true;
    if (await excluirTarefa({ id, titulo: c.titulo })) navigation.goBack();
    else saindo.current = false;
  };

  // Categoria sugerida pelo catálogo ao criar um fornecedor a partir da tarefa (dados/catalogo-tarefas).
  const categoriaSugerida = (() => {
    const cat = CATALOGO.tarefas.find(
      x => x.id === t?.catalogo_id,
    )?.categoria_orcamento;
    return cat ? `casamento_${cat}` : undefined;
  })();

  const lista = fornecedores
    .filter(
      f =>
        f.status !== 'descartado' &&
        f.nome
          .toLocaleLowerCase('pt-BR')
          .includes(busca.trim().toLocaleLowerCase('pt-BR')),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <TelaPilha
      titulo={novo ? 'Nova tarefa' : 'Tarefa'}
      direita={
        novo ? null : (
          <Pressable
            onPress={() => setMenu(true)}
            accessibilityRole="button"
            accessibilityLabel="Mais opções"
            hitSlop={8}
          >
            <Icone nome="mais" cor={cores.onSurface} />
          </Pressable>
        )
      }
      rodape={
        <Botao
          rotulo="Salvar"
          larguraTotal
          desativado={!valido}
          onPress={salvar}
        />
      }
    >
      {atraso > 0 ? (
        <View style={estilos.seloTopo}>
          <Selo
            texto={`Atrasada ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`}
            tom="error"
          />
        </View>
      ) : null}
      <TextInput
        value={c.titulo}
        onChangeText={v => mudar('titulo', v)}
        placeholder="Nome da tarefa"
        placeholderTextColor={cores.onSurfaceVariant}
        maxLength={80}
        multiline
        accessibilityLabel="Título da tarefa"
        style={[
          estiloTexto('tituloDestaque'),
          estilos.titulo,
          { color: cores.onSurface },
        ]}
      />

      <View style={estilos.linha}>
        <View style={estilos.flex}>
          <CampoSelecao
            rotulo="Fase"
            opcoes={FASES_TAREFA.map(f => ({
              valor: f,
              rotulo: FASES_CHECKLIST[f].nome,
            }))}
            valor={c.fase}
            onMudar={f => mudar('fase', f)}
          />
        </View>
        <View style={estilos.flex}>
          <CampoData
            rotulo="Prazo"
            valor={c.prazo}
            onMudar={d => mudar('prazo', d)}
          />
        </View>
      </View>
      {!c.prazo && casal?.data_casamento ? (
        <Texto papel="ajuda" cor="onSurfaceVariant">
          Sem prazo, usamos a data sugerida da fase.
        </Texto>
      ) : null}

      <EscolhaUnica
        rotulo="Responsável"
        opcoes={[
          { valor: 'noivo_1', rotulo: nome1 },
          { valor: 'noivo_2', rotulo: nome2 },
          { valor: 'os_dois', rotulo: 'Os dois' },
        ]}
        selecionado={c.responsavel}
        onMudar={r => mudar('responsavel', r)}
      />
      <EscolhaUnica
        rotulo="Status"
        opcoes={[
          { valor: 'a_fazer', rotulo: 'A fazer' },
          { valor: 'em_andamento', rotulo: 'Em andamento' },
          { valor: 'concluida', rotulo: 'Concluída' },
        ]}
        selecionado={c.status}
        onMudar={s => mudar('status', s)}
      />

      <View style={estilos.grupo}>
        <Texto papel="rotuloCampo">Fornecedor vinculado</Texto>
        {fornecedor ? (
          <Cartao
            onPress={() =>
              navigation.navigate('Fornecedor', { id: fornecedor.id })
            }
            rotuloAcessivel={`${fornecedor.nome}, ${
              STATUS_FORNECEDOR_ROTULO[fornecedor.status]
            }`}
          >
            <View style={estilos.linhaCentro}>
              <AvatarIniciais texto={iniciais(fornecedor.nome)} />
              <View style={estilos.flex}>
                <Texto papel="nomeItem" peso="700">
                  {fornecedor.nome}
                </Texto>
                <Texto papel="metadado" cor="onSurfaceVariant">
                  {STATUS_FORNECEDOR_ROTULO[fornecedor.status]}
                  {fornecedor.valor
                    ? ` · ${formatarReais(fornecedor.valor)}`
                    : ''}
                </Texto>
              </View>
              <Icone nome="setaDireita" cor={cores.onSurfaceVariant} />
            </View>
          </Cartao>
        ) : (
          <Botao
            rotulo="Vincular fornecedor"
            variante="contornado"
            larguraTotal
            onPress={() => setVincular(true)}
          />
        )}
        {fornecedor ? (
          <Botao
            rotulo="Desvincular"
            variante="texto"
            compacto
            onPress={() => mudar('fornecedor_id', null)}
          />
        ) : null}
      </View>

      <CampoTexto
        rotulo="Notas"
        value={c.notas}
        onChangeText={v => mudar('notas', v)}
        multiline
        maxLength={1000}
      />

      <Cartao>
        <View style={[estilos.linhaCentro, { minHeight: alvoToque }]}>
          <Texto papel="nomeItem" style={estilos.flex}>
            Lembrar 3 dias antes do prazo
          </Texto>
          <Switch
            value={c.lembrete_ativo}
            onValueChange={v => mudar('lembrete_ativo', v)}
            accessibilityLabel="Lembrar 3 dias antes do prazo"
            trackColor={{ true: cores.primary, false: cores.outlineSoft }}
            thumbColor={cores.surface}
            ios_backgroundColor={cores.outlineSoft}
          />
        </View>
      </Cartao>

      {novo ? null : (
        <Botao
          rotulo="Excluir tarefa"
          variante="destrutivo"
          onPress={excluirEsta}
          style={estilos.esquerda}
        />
      )}

      <FolhaInferior visivel={menu} onFechar={() => setMenu(false)}>
        <Botao
          rotulo="Ocultar tarefa"
          variante="tonal"
          icone="ocultar"
          larguraTotal
          onPress={ocultar}
        />
        <Botao
          rotulo="Duplicar"
          variante="tonal"
          larguraTotal
          onPress={duplicar}
        />
        <Botao
          rotulo="Excluir tarefa"
          variante="destrutivo"
          icone="excluir"
          larguraTotal
          onPress={excluirEsta}
        />
      </FolhaInferior>

      <FolhaInferior
        visivel={vincular}
        titulo="Vincular fornecedor"
        onFechar={() => setVincular(false)}
      >
        <View
          style={[
            estilos.busca,
            {
              backgroundColor: cores.surface,
              borderColor: cores.outlineSoft,
              minHeight: tamanhos.fieldHeight,
            },
          ]}
        >
          <Icone nome="busca" cor={cores.onSurfaceVariant} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar"
            placeholderTextColor={cores.onSurfaceVariant}
            accessibilityLabel="Buscar fornecedor"
            style={[
              estiloTexto('corpo'),
              estilos.flex,
              { color: cores.onSurface },
            ]}
          />
        </View>
        <Cartao semPadding>
          {lista.length === 0 ? (
            <Texto papel="corpo" cor="onSurfaceVariant" style={estilos.vazio}>
              Nenhum fornecedor encontrado.
            </Texto>
          ) : (
            lista.slice(0, 6).map((f, i) => (
              <View key={f.id}>
                {i > 0 ? <Divisoria /> : null}
                <Pressable
                  onPress={() => {
                    mudar('fornecedor_id', f.id);
                    setVincular(false);
                  }}
                  accessibilityRole="button"
                  style={[
                    estilos.linhaCentro,
                    estilos.opcao,
                    { minHeight: alvoToque + espacos.space2 },
                  ]}
                >
                  <AvatarIniciais texto={iniciais(f.nome)} tamanho={36} />
                  <Texto papel="nomeItem" style={estilos.flex}>
                    {f.nome}
                  </Texto>
                </Pressable>
              </View>
            ))
          )}
        </Cartao>
        <Botao
          rotulo="Novo fornecedor"
          variante="tonal"
          icone="adicionar"
          larguraTotal
          onPress={() => {
            setVincular(false);
            // A tarefa precisa existir para o fornecedor novo ser ligado a ela.
            if (novo) {
              avisos.mostrar({
                texto: 'Salvem a tarefa antes de criar o fornecedor.',
              });
              return;
            }
            navigation.navigate('Fornecedor', {
              tarefaId: id,
              categoria: categoriaSugerida,
            });
          }}
        />
      </FolhaInferior>
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  seloTopo: { flexDirection: 'row' },
  titulo: { paddingVertical: espacos.space1 },
  linha: {
    flexDirection: 'row',
    gap: espacos.space3,
    alignItems: 'flex-start',
  },
  linhaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  grupo: { gap: espacos.space2 },
  esquerda: { alignSelf: 'flex-start' },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space2,
    borderWidth: 1,
    borderRadius: raios.radiusMd,
    paddingHorizontal: espacos.space3,
  },
  vazio: { padding: espacos.space4 },
  opcao: { paddingHorizontal: espacos.space4 },
});
