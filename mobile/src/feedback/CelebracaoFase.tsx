import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { arrayUnion } from '@react-native-firebase/firestore';
import { raios } from '@lartie/tokens';
import { FASES_TAREFA, type FaseTarefa } from '@lartie/modelo';
import { progressoPorFase } from '@lartie/regras';
import { Botao } from '../componentes/Botao';
import { Icone } from '../componentes/Icone';
import { Texto } from '../componentes/Texto';
import { atualizar } from '../dados/gravacao';
import { useTarefas } from '../dados/plano';
import { useSessao } from '../dados/Sessao';
import { registrarEvento } from '../servicos/analytics';
import { espacos, useTema } from '../tema';

// T56 · Fase do checklist concluída (CelebracaoFase.dc.html). Aparece uma vez por fase (13.3),
// guardado em casal.fases_celebradas, e só para quem marcou a última tarefa da fase.

const TITULOS: Record<FaseTarefa, string> = {
  decisoes_iniciais: 'Decisões iniciais concluídas!',
  fornecedores_principais: 'Fornecedores principais concluídos!',
  detalhes: 'Detalhes concluídos!',
  documentos_reta_final: 'Documentos e reta final concluídos!',
  semana_casamento: 'Semana do casamento concluída!',
};
const ORDINAIS = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta'];
const PROXIMA: Record<FaseTarefa, string> = {
  decisoes_iniciais: 'as decisões iniciais',
  fornecedores_principais: 'fechar os fornecedores principais',
  detalhes: 'cuidar dos detalhes',
  documentos_reta_final: 'os documentos e a reta final',
  semana_casamento: 'a semana do casamento',
};

export function textoCelebracao(fase: FaseTarefa, proxima: FaseTarefa | null) {
  return {
    titulo: TITULOS[fase],
    texto: proxima
      ? `Vocês terminaram a ${ORDINAIS[FASES_TAREFA.indexOf(fase)]} fase do checklist. Próxima: ${PROXIMA[proxima]}.`
      : 'Vocês terminaram todas as fases do checklist.',
  };
}

/** Observa as tarefas enquanto as abas estão abertas e celebra a fase que acabou de ficar completa. */
export function CelebracaoFase() {
  const { cores, sombra } = useTema();
  const navigation = useNavigation();
  const { casal, casalId, usuario } = useSessao();
  const tarefas = useTarefas();
  const anterior = useRef<Record<string, boolean> | null>(null);
  const [atual, setAtual] = useState<{ fase: FaseTarefa; proxima: FaseTarefa | null } | null>(null);

  useEffect(() => {
    if (tarefas.carregando || !casal || !casalId) return;
    const porFase = progressoPorFase(tarefas.dados);
    const completas = Object.fromEntries(FASES_TAREFA.map((f) => [f, porFase[f].total > 0 && porFase[f].feitos === porFase[f].total]));
    const antes = anterior.current;
    anterior.current = completas;
    if (!antes) return;
    const celebradas = casal.fases_celebradas ?? [];
    const fase = FASES_TAREFA.find((f) => completas[f] && !antes[f] && !celebradas.includes(f));
    if (!fase) return;
    // Só quem marcou a última tarefa da fase vê a celebração.
    const ultima = tarefas.dados
      .filter((t) => t.fase === fase && !t.oculta)
      .sort((a, b) => (b.atualizado_em?.toDate?.().getTime() ?? Date.now()) - (a.atualizado_em?.toDate?.().getTime() ?? Date.now()))[0];
    if (ultima && ultima.atualizado_por !== usuario?.uid) return;
    const depois = FASES_TAREFA.slice(FASES_TAREFA.indexOf(fase) + 1).find((f) => porFase[f].total > 0) ?? null;
    atualizar(casalId, null, null, { fases_celebradas: arrayUnion(fase) });
    registrarEvento({ nome: 'fase_concluida', params: { fase } });
    setAtual({ fase, proxima: depois });
    AccessibilityInfo.announceForAccessibility(TITULOS[fase]);
  }, [tarefas.dados, tarefas.carregando, casal, casalId, usuario?.uid]);

  if (!atual) return null;
  const t = textoCelebracao(atual.fase, atual.proxima);
  const fechar = () => setAtual(null);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={fechar} statusBarTranslucent>
      <View style={estilos.raiz}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: cores.scrim }]} onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar" />
        <View style={[estilos.caixa, { backgroundColor: cores.surface }, sombra('shadowFab')]} accessibilityViewIsModal accessibilityRole="alert">
          <View style={[estilos.icone, { backgroundColor: cores.primaryContainer }]}>
            <Icone nome="coracao" cor={cores.primary} />
          </View>
          <Texto papel="tituloTela" peso="700">
            {t.titulo}
          </Texto>
          <Texto papel="corpo" cor="onSurfaceVariant">
            {t.texto}
          </Texto>
          <Botao
            rotulo={atual.proxima ? 'Ver próxima fase' : 'Continuar'}
            larguraTotal
            onPress={() => {
              fechar();
              if (atual.proxima) navigation.navigate('Abas', { screen: 'casamento', params: { secao: 'checklist', fase: atual.proxima } });
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacos.space6 },
  caixa: { width: '100%', borderRadius: raios.radiusXl, padding: espacos.space6, gap: espacos.space3 },
  icone: { width: 48, height: 48, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
});
