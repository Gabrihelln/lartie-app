import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { gerarTarefasMudanca, prazoDaMudanca, type CatalogoTarefas } from '@lartie/regras';
import catalogoTarefas from '../../../../dados/catalogo-tarefas.json';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Cartao, Divisoria, TituloSecao } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { atualizar, emLote, excluir } from '../../dados/gravacao';
import { useImovel, useTarefasMudanca } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import * as C from '../../feedback/confirmacoes';
import { useDialogo } from '../../feedback/Dialogo';
import { espacos, useTema } from '../../tema';

// P04 (decidido em 27/10/2026): seção "Mudança" na tela Casa, com as tarefas do catálogo
// (dados/catalogo-tarefas.json › tarefas_mudanca) e as que o casal criar. Prazo relativo à data
// da mudança. Marcar tem "Desfazer"; tocar no nome edita ou exclui (com confirmação).
// Casais com a casa gerada antes desta mudança recebem as tarefas na primeira abertura.

const CATALOGO = catalogoTarefas as unknown as CatalogoTarefas;

export function SecaoMudanca() {
  const { cores, alvoToque } = useTema();
  const { casal, casalId } = useSessao();
  const { confirmar, erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const imovel = useImovel().dados;
  const tarefas = useTarefasMudanca();
  const [editar, setEditar] = useState<{ id: string | null; titulo: string } | null>(null);
  const criou = useRef(false);
  const aoFalhar = () => erroAoSalvar();

  // Casais que geraram a casa antes da P04: cria as tarefas do catálogo uma vez (ids estáveis).
  useEffect(() => {
    if (criou.current || !casalId || !casal?.modulos_gerados?.casa || casal.mudanca_gerada || !imovel || tarefas.carregando) return;
    criou.current = true;
    emLote(
      casalId,
      [
        ...gerarTarefasMudanca(CATALOGO, imovel).map((t) => ({
          tipo: 'criar' as const,
          sub: 'tarefas_mudanca' as const,
          id: t.id,
          dados: { titulo: t.titulo, dias_antes: t.dias_antes, concluida: false, ordem: t.ordem, catalogo_id: t.id },
        })),
        { tipo: 'atualizarCasal', dados: { mudanca_gerada: true } },
      ],
      'gerar tarefas da mudança',
    );
  }, [casalId, casal?.modulos_gerados?.casa, casal?.mudanca_gerada, imovel, tarefas.carregando]);

  if (tarefas.carregando) return null;
  const lista = [...tarefas.dados].sort((a, b) => Number(a.concluida) - Number(b.concluida) || a.ordem - b.ordem);
  const feitas = lista.filter((t) => t.concluida).length;

  const marcar = (id: string, concluida: boolean) => {
    if (!casalId) return;
    atualizar(casalId, 'tarefas_mudanca', id, { concluida }, aoFalhar);
    avisos.comDesfazer(concluida ? 'Tarefa concluída' : 'Tarefa reaberta', () => atualizar(casalId, 'tarefas_mudanca', id, { concluida: !concluida }, aoFalhar));
  };

  const salvar = () => {
    if (!casalId || !editar?.titulo.trim()) return;
    if (editar.id) atualizar(casalId, 'tarefas_mudanca', editar.id, { titulo: editar.titulo.trim() }, aoFalhar);
    else
      emLote(
        casalId,
        [{ tipo: 'criar', sub: 'tarefas_mudanca', dados: { titulo: editar.titulo.trim(), dias_antes: null, concluida: false, ordem: (lista[lista.length - 1]?.ordem ?? 0) + 1, catalogo_id: null } }],
        'nova tarefa da mudança',
        aoFalhar,
      );
    setEditar(null);
    avisos.mostrar({ texto: 'Tarefa salva', tipo: 'sucesso' });
  };

  const excluirAtual = async () => {
    if (!casalId || !editar?.id) return;
    const id = editar.id;
    const titulo = editar.titulo;
    setEditar(null);
    if (!(await confirmar(C.excluirTarefaMudanca(titulo)))) return;
    excluir(casalId, 'tarefas_mudanca', id, aoFalhar);
    avisos.mostrar({ texto: 'Tarefa excluída' });
  };

  return (
    <>
      <TituloSecao titulo="Mudança" link={{ rotulo: '+ Tarefa', onPress: () => setEditar({ id: null, titulo: '' }) }} />
      {lista.length === 0 ? (
        <Texto papel="corpo" cor="onSurfaceVariant">
          Nenhuma tarefa da mudança. Toquem em “+ Tarefa” para criar.
        </Texto>
      ) : (
        <Cartao semPadding>
          <View style={estilos.resumo}>
            <Texto papel="metadado" cor="onSurfaceVariant">
              {feitas} de {lista.length} tarefas
            </Texto>
          </View>
          {lista.map((t) => {
            const prazo = prazoDaMudanca(t.dias_antes, imovel?.data_mudanca ?? null);
            return (
              <View key={t.id}>
                <Divisoria />
                <View style={[estilos.linha, { minHeight: alvoToque + espacos.space4 }]}>
                  <Pressable
                    onPress={() => marcar(t.id, !t.concluida)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: t.concluida }}
                    accessibilityLabel={`${t.concluida ? 'Desmarcar' : 'Concluir'} ${t.titulo}`}
                    hitSlop={6}
                    style={{ width: alvoToque, height: alvoToque, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={[estilos.caixa, t.concluida ? { backgroundColor: cores.home, borderColor: cores.home } : { borderColor: cores.outline }]}>
                      {t.concluida ? <Icone nome="check" cor={cores.onPrimary} tamanho={18} /> : null}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setEditar({ id: t.id, titulo: t.titulo })} accessibilityRole="button" accessibilityLabel={`${t.titulo}${prazo ? `, ${prazo}` : ''}. Editar`} style={estilos.texto}>
                    <Texto papel="nomeItem" cor={t.concluida ? 'onSurfaceVariant' : 'onSurface'} style={t.concluida ? estilos.riscado : null}>
                      {t.titulo}
                    </Texto>
                    {prazo && !t.concluida ? (
                      <Texto papel="metadado" cor="onSurfaceVariant">
                        {prazo}
                      </Texto>
                    ) : null}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Cartao>
      )}
      <FolhaInferior visivel={!!editar} titulo={editar?.id ? 'Tarefa da mudança' : 'Nova tarefa da mudança'} onFechar={() => setEditar(null)}>
        <CampoTexto rotulo="Tarefa" value={editar?.titulo ?? ''} onChangeText={(t) => setEditar((e) => e && { ...e, titulo: t })} maxLength={80} placeholder="Desligar a internet do endereço antigo" />
        <Botao rotulo="Salvar" variante="casa" larguraTotal desativado={!editar?.titulo.trim()} onPress={salvar} />
        {editar?.id ? <Botao rotulo="Excluir tarefa" variante="destrutivo" larguraTotal onPress={excluirAtual} /> : null}
      </FolhaInferior>
    </>
  );
}

const estilos = StyleSheet.create({
  resumo: { paddingHorizontal: espacos.space4, paddingVertical: espacos.space3 },
  linha: { flexDirection: 'row', alignItems: 'center', paddingLeft: espacos.space2, paddingRight: espacos.space4 },
  caixa: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, paddingVertical: espacos.space3, paddingLeft: espacos.space2, gap: 2 },
  riscado: { textDecorationLine: 'line-through' },
});
