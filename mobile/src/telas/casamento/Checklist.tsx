import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FASES_TAREFA, type FaseTarefa } from '@lartie/modelo';
import {
  FASES_CHECKLIST,
  filtrarChecklist,
  hojeLocal,
  percentual,
  progressoCasamento,
  progressoPorFase,
  reordenarNaFase,
  type FiltroChecklist,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { Chip } from '../../componentes/Chip';
import { BarraProgresso, Cartao, Divisoria } from '../../componentes/Estrutura';
import { Icone } from '../../componentes/Icone';
import { LinhaComGestos } from '../../componentes/LinhaComGestos';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote, excluir } from '../../dados/gravacao';
import { useTarefas } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';
import { LinhaTarefa, useMarcarTarefa, type TarefaComId } from './comum';

// T13 · Checklist (Checklist.dc.html). Fases recolhíveis, filtros, marcar com "Desfazer", segurar e
// arrastar para reordenar dentro da fase, arrastar para a esquerda para "Ocultar" e "Excluir" (T34).
// Tarefas ocultas não aparecem nem contam no progresso ("Mostrar ocultas" no fim).

const FILTROS: { valor: FiltroChecklist; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'a_fazer', rotulo: 'A fazer' },
  { valor: 'atrasadas', rotulo: 'Atrasadas' },
  { valor: 'concluidas', rotulo: 'Concluídas' },
];

/** T34: "Excluir esta tarefa?" Usado no T13 (gesto) e no T14. */
export function useExcluirTarefa() {
  const { casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  return async (t: { id: string; titulo: string }) => {
    const ok = await confirmar({
      icone: 'excluir',
      tom: 'destrutivo',
      titulo: 'Excluir esta tarefa?',
      texto: `“${t.titulo}” sai do checklist de vocês dois. Não dá para desfazer.`,
      cancelar: 'Cancelar',
      confirmar: 'Excluir',
    });
    if (!ok || !casalId) return false;
    excluir(casalId, 'tarefas', t.id, () => erroAoSalvar());
    registrarEvento({ nome: 'tarefa_excluida', params: {} });
    avisos.mostrar({ texto: 'Tarefa excluída' });
    return true;
  };
}

interface Props {
  /** "Ver próxima fase" do T56 e notificações: rola até esta fase. */
  fase?: FaseTarefa;
  onTravarRolagem: (travar: boolean) => void;
  rolagem: React.RefObject<ScrollView | null>;
}

export function Checklist({ fase: faseAlvo, onTravarRolagem, rolagem }: Props) {
  const { cores, alvoToque } = useTema();
  const navigation = useNavigation();
  const { casalId } = useSessao();
  const avisos = useAvisos();
  const { erroAoSalvar } = useDialogo();
  const tarefas = useTarefas();
  const marcar = useMarcarTarefa('checklist');
  const excluirTarefa = useExcluirTarefa();
  const [filtro, setFiltro] = useState<FiltroChecklist>('todas');
  const [mostrarOcultas, setMostrarOcultas] = useState(false);
  const [recolhidas, setRecolhidas] = useState<Set<FaseTarefa>>(new Set());
  const posicoes = useRef<Partial<Record<FaseTarefa, number>>>({});
  const alturas = useRef<Record<string, number>>({});
  /** Posição desta seção dentro da rolagem da aba (para "Ver próxima fase"). */
  const topo = useRef(0);

  useEffect(() => {
    if (!faseAlvo) return;
    setRecolhidas((r) => {
      const n = new Set(r);
      n.delete(faseAlvo);
      return n;
    });
    const t = setTimeout(() => {
      const yFase = posicoes.current[faseAlvo];
      if (yFase !== undefined) rolagem.current?.scrollTo({ y: topo.current + yFase - espacos.space4, animated: true });
    }, 250);
    return () => clearTimeout(t);
  }, [faseAlvo, rolagem]);

  if (tarefas.carregando) return <EsqueletoLista />;

  const hoje = hojeLocal();
  const progresso = progressoCasamento(tarefas.dados);
  const porFase = progressoPorFase(tarefas.dados);
  const visiveis = filtrarChecklist(tarefas.dados, filtro, hoje, mostrarOcultas);
  const ocultas = tarefas.dados.filter((t) => t.oculta).length;
  const pct = percentual(progresso);
  const aoFalhar = () => erroAoSalvar();

  const ocultar = (t: TarefaComId, oculta: boolean) => {
    if (!casalId) return;
    atualizar(casalId, 'tarefas', t.id, { oculta }, aoFalhar);
    avisos.comDesfazer(oculta ? 'Tarefa oculta' : 'Tarefa visível de novo', () => atualizar(casalId, 'tarefas', t.id, { oculta: !oculta }, aoFalhar));
  };

  const mover = (daFase: TarefaComId[], t: TarefaComId, posicao: number) => {
    if (!casalId) return;
    const mudancas = reordenarNaFase(daFase, t.id, posicao);
    if (mudancas.length === 0) return;
    emLote(casalId, mudancas.map((m) => ({ tipo: 'atualizar' as const, sub: 'tarefas' as const, id: m.id, dados: { ordem: m.ordem } })), 'reordenar tarefas', aoFalhar);
  };

  /** Converte o deslocamento do arraste em posição na fase, pela altura das linhas. */
  const soltar = (daFase: TarefaComId[], t: TarefaComId, dy: number) => {
    const i = daFase.findIndex((x) => x.id === t.id);
    let passos = 0;
    let resto = dy;
    if (dy > 0) {
      for (let j = i + 1; j < daFase.length && resto > (alturas.current[daFase[j]!.id] ?? 64) / 2; j++) {
        resto -= alturas.current[daFase[j]!.id] ?? 64;
        passos++;
      }
    } else {
      for (let j = i - 1; j >= 0 && -resto > (alturas.current[daFase[j]!.id] ?? 64) / 2; j--) {
        resto += alturas.current[daFase[j]!.id] ?? 64;
        passos--;
      }
    }
    if (passos !== 0) mover(daFase, t, i + passos);
  };

  const alternarFase = (f: FaseTarefa) =>
    setRecolhidas((r) => {
      const n = new Set(r);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });

  return (
    <View style={estilos.conteudo} onLayout={(e) => (topo.current = e.nativeEvent.layout.y)}>
      <Cartao style={estilos.progresso} rotuloAcessivel={`Progresso geral: ${progresso.feitos} de ${progresso.total} tarefas, ${pct}%`}>
        <View style={estilos.linhaCentro}>
          <View style={estilos.flex}>
            <Texto papel="metadado" cor="onSurfaceVariant">
              Progresso geral
            </Texto>
            <Texto papel="nomeItem" peso="700">
              {progresso.feitos} de {progresso.total} tarefas
            </Texto>
          </View>
          <Texto papel="numeroDestaque" peso="700" cor="primary">
            {pct}%
          </Texto>
        </View>
        <BarraProgresso fracao={pct / 100} cor="primary" trilho="primaryTrack" />
      </Cartao>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips} accessibilityRole="radiogroup">
        {FILTROS.map((f) => (
          <Chip key={f.valor} rotulo={f.rotulo} selecionado={filtro === f.valor} onPress={() => setFiltro(f.valor)} />
        ))}
      </ScrollView>

      {visiveis.length === 0 ? (
        <Cartao style={estilos.vazio}>
          <Texto papel="corpo" cor="onSurfaceVariant" alinhamento="center">
            Nenhuma tarefa aqui.
          </Texto>
          {filtro !== 'todas' ? <Botao rotulo="Ver todas" variante="tonal" onPress={() => setFiltro('todas')} /> : null}
        </Cartao>
      ) : null}

      {FASES_TAREFA.map((f) => {
        const daFase = visiveis.filter((t) => t.fase === f);
        if (daFase.length === 0) return null;
        const recolhida = recolhidas.has(f);
        const contagem = porFase[f];
        return (
          <View key={f} onLayout={(e) => (posicoes.current[f] = e.nativeEvent.layout.y)}>
            <Cartao semPadding>
              <Pressable
                onPress={() => alternarFase(f)}
                accessibilityRole="button"
                accessibilityState={{ expanded: !recolhida }}
                accessibilityLabel={`${FASES_CHECKLIST[f].nome}, ${FASES_CHECKLIST[f].periodo}, ${contagem.feitos} de ${contagem.total}`}
                style={[estilos.cabecalhoFase, { minHeight: alvoToque + espacos.space6 }]}
              >
                <View style={estilos.flex}>
                  <Texto papel="nomeItem" peso="700">
                    {FASES_CHECKLIST[f].nome}
                  </Texto>
                  <Texto papel="metadado" cor="onSurfaceVariant">
                    {FASES_CHECKLIST[f].periodo}
                  </Texto>
                </View>
                <Texto papel="corpo" peso="700" cor="primary">
                  {contagem.feitos}/{contagem.total}
                </Texto>
                <Icone nome={recolhida ? 'setaBaixo' : 'setaCima'} cor={cores.onSurfaceVariant} />
              </Pressable>
              {recolhida
                ? null
                : daFase.map((t, i) => (
                    <View key={t.id}>
                      <Divisoria />
                      <LinhaComGestos
                        onLayout={(e) => (alturas.current[t.id] = e.nativeEvent.layout.height)}
                        onArrastando={onTravarRolagem}
                        onSoltarArraste={(dy) => soltar(daFase, t, dy)}
                        acoes={[
                          {
                            rotulo: t.oculta ? 'Mostrar' : 'Ocultar',
                            fundo: 'surfaceVariant',
                            texto: 'onSurface',
                            onPress: () => ocultar(t, !t.oculta),
                          },
                          { rotulo: 'Excluir', fundo: 'error', texto: 'onPrimary', onPress: () => excluirTarefa(t) },
                        ]}
                        acoesAcessiveis={[
                          ...(i > 0 ? [{ nome: 'subir', rotulo: 'Mover para cima', onAcao: () => mover(daFase, t, i - 1) }] : []),
                          ...(i < daFase.length - 1 ? [{ nome: 'descer', rotulo: 'Mover para baixo', onAcao: () => mover(daFase, t, i + 1) }] : []),
                          { nome: 'ocultar', rotulo: t.oculta ? 'Mostrar' : 'Ocultar', onAcao: () => ocultar(t, !t.oculta) },
                          { nome: 'excluir', rotulo: 'Excluir', onAcao: () => excluirTarefa(t) },
                        ]}
                      >
                        {(iniciarArraste) => (
                          <LinhaTarefa
                            tarefa={t}
                            meta="responsavel_ou_prazo"
                            oculta={t.oculta}
                            onMarcar={() => marcar(t)}
                            onAbrir={() => navigation.navigate('Tarefa', { id: t.id })}
                            onSegurar={iniciarArraste}
                          />
                        )}
                      </LinhaComGestos>
                    </View>
                  ))}
            </Cartao>
          </View>
        );
      })}

      {ocultas > 0 ? (
        <Botao
          rotulo={mostrarOcultas ? 'Esconder ocultas' : `Mostrar ocultas (${ocultas})`}
          variante="texto"
          larguraTotal
          onPress={() => setMostrarOcultas((m) => !m)}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espacos.space4 },
  flex: { flex: 1 },
  progresso: { gap: espacos.space3 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  chips: { gap: espacos.space2 },
  vazio: { gap: espacos.space3, alignItems: 'center' },
  cabecalhoFase: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2, paddingHorizontal: espacos.space4, paddingVertical: espacos.space3 },
});
