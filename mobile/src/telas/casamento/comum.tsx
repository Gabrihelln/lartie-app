import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StatusTarefa, Tarefa } from '@lartie/modelo';
import { dataCurta, hojeLocal, tarefaAtrasada } from '@lartie/regras';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { atualizar } from '../../dados/gravacao';
import { useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';

// Peças do módulo Casamento usadas no Início (T12, T12b) e no checklist (T13).

export type TarefaComId = Tarefa & { id: string };

/**
 * Marcar e desmarcar a tarefa (T13 "Caixa da tarefa"): aplica na hora, aviso "Tarefa concluída"
 * com "Desfazer" por 5 s (2.3). A celebração da fase (T56) é detectada em Abas.
 */
export function useMarcarTarefa(origem: 'checklist' | 'inicio') {
  const { casalId } = useSessao();
  const avisos = useAvisos();
  const { erroAoSalvar } = useDialogo();
  return useCallback(
    (t: TarefaComId) => {
      if (!casalId) return;
      const anterior: StatusTarefa = t.status;
      const novo: StatusTarefa = anterior === 'concluida' ? 'a_fazer' : 'concluida';
      const aoFalhar = () => erroAoSalvar();
      atualizar(casalId, 'tarefas', t.id, { status: novo }, aoFalhar);
      if (novo === 'concluida') registrarEvento({ nome: 'tarefa_concluida', params: { origem } });
      avisos.comDesfazer(novo === 'concluida' ? 'Tarefa concluída' : 'Tarefa reaberta', () => {
        atualizar(casalId, 'tarefas', t.id, { status: anterior }, aoFalhar);
        registrarEvento({ nome: 'acao_desfeita', params: { acao: 'marcar_tarefa' } });
      });
    },
    [casalId, avisos, erroAoSalvar, origem],
  );
}

interface PropsLinha {
  tarefa: TarefaComId;
  onMarcar: () => void;
  onAbrir: () => void;
  /** T13: segurar para arrastar e reordenar. */
  onSegurar?: () => void;
  /** T12: data curta à direita; T13: responsável ou prazo. */
  meta?: 'prazo' | 'responsavel_ou_prazo';
  oculta?: boolean;
}

/** Linha de tarefa com caixa de seleção (T12, T12b, T13). */
export function LinhaTarefa({ tarefa, onMarcar, onAbrir, onSegurar, meta = 'prazo', oculta }: PropsLinha) {
  const { cores, alvoToque } = useTema();
  const { responsavel } = useNomes();
  const hoje = hojeLocal();
  const feita = tarefa.status === 'concluida';
  const atrasada = tarefaAtrasada(tarefa, hoje);
  // Meta à direita: prazo; sem prazo (casamento sem data), o responsável no T13.
  const textoMeta = feita
    ? 'Feita'
    : tarefa.prazo
      ? dataCurta(tarefa.prazo)
      : meta === 'responsavel_ou_prazo'
        ? responsavel(tarefa.responsavel)
        : null;

  return (
    <View style={[estilos.linha, { minHeight: alvoToque + espacos.space6 }]}>
      <Pressable
        onPress={onMarcar}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: feita }}
        accessibilityLabel={`${feita ? 'Desmarcar' : 'Concluir'} ${tarefa.titulo}`}
        hitSlop={6}
        style={{ width: alvoToque, height: alvoToque, alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={[
            estilos.caixa,
            feita ? { backgroundColor: cores.primary, borderColor: cores.primary } : { borderColor: cores.outline },
          ]}
        >
          {feita ? <Icone nome="check" cor={cores.onPrimary} tamanho={18} /> : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onAbrir}
        onLongPress={onSegurar}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={`${tarefa.titulo}${atrasada ? ', atrasada' : ''}${textoMeta ? `, ${textoMeta}` : ''}`}
        style={estilos.textoLinha}
      >
        <Texto
          papel="nomeItem"
          cor={feita ? 'onSurfaceVariant' : 'onSurface'}
          style={[estilos.flex, feita ? estilos.riscado : null]}
          numberOfLines={2}
        >
          {tarefa.titulo}
        </Texto>
        {oculta ? <Texto papel="metadado" cor="onSurfaceVariant">Oculta</Texto> : atrasada ? <Selo texto="Atrasada" tom="error" /> : textoMeta ? <Texto papel="metadado" cor="onSurfaceVariant">{textoMeta}</Texto> : null}
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', paddingLeft: espacos.space2, paddingRight: espacos.space4 },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  textoLinha: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacos.space2, paddingVertical: espacos.space3, paddingLeft: espacos.space2 },
  flex: { flex: 1 },
  riscado: { textDecorationLine: 'line-through' },
});
