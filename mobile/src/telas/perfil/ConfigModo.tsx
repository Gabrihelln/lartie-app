import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import type { ModoApp } from '@lartie/modelo';
import { textoConfirmacaoModo } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { TelaPilha } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { OpcaoModo } from '../../componentes/OpcaoModo';
import { Texto } from '../../componentes/Texto';
import { useNomes } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { TEXTO_MODO_ATUALIZADO, useTrocarModo } from '../../dados/useTrocarModo';
import { useDescartarAlteracoes } from '../../feedback/useDescartarAlteracoes';
import type { ParamsRaiz } from '../../navegacao/tipos';
import { espacos, useTema } from '../../tema';

// T33b · Modo do app (ConfigModo.dc.html). A troca vale para o casal, exige conexão (13.9 regra 8),
// pede os dados de um módulo nunca gerado (regra 2) e avisa o parceiro (regra 3).
// Voltar com uma seleção diferente da atual: T36.

export function ConfigModo() {
  const { cores } = useTema();
  const { params } = useRoute<RouteProp<ParamsRaiz, 'ConfigModo'>>();
  const { modo } = useSessao();
  const { outro } = useNomes();
  const trocar = useTrocarModo();
  const [selecionado, setSelecionado] = useState<ModoApp | null>(params?.preSelecionado ?? (modo === 'indefinido' ? null : modo));
  const [folha, setFolha] = useState(false);
  const [mudando, setMudando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const liberado = useRef(false);
  const diferente = !!selecionado && selecionado !== modo;
  useDescartarAlteracoes({ temAlteracoes: diferente && !mudando, oQue: 'o modo do app', liberado });

  const confirmacao = selecionado ? textoConfirmacaoModo(modo, selecionado) : null;

  const mudar = async () => {
    if (!selecionado) return;
    setFolha(false);
    setMudando(true);
    // Se precisar dos dados que faltam, a troca segue na tela AtivarModulo.
    liberado.current = true;
    const trocou = await trocar(selecionado, params?.origem ?? 'perfil');
    liberado.current = false;
    setMudando(false);
    if (trocou) setSalvo(true);
  };

  return (
    <TelaPilha
      titulo="Modo do app"
      tituloGrande
      rodape={<Botao rotulo="Salvar modo" larguraTotal desativado={!diferente} carregando={mudando} onPress={() => setFolha(true)} />}
    >
      <Texto papel="corpo" cor="onSurfaceVariant">
        Escolham o que aparece na tela inicial e no menu. Vale para os dois.
      </Texto>

      {modo === 'indefinido' ? (
        <View style={[estilos.faixa, { backgroundColor: cores.warningContainer }]} accessibilityRole="alert">
          <Icone nome="info" cor={cores.warning} />
          <Texto papel="metadado" cor="warning" style={estilos.flex}>
            Vocês ainda não escolheram um modo.
          </Texto>
        </View>
      ) : null}
      {salvo && !diferente ? (
        <View style={[estilos.faixa, { backgroundColor: cores.successContainer }]} accessibilityRole="alert">
          <Icone nome="checkCirculo" cor={cores.success} />
          <Texto papel="metadado" cor="success" style={estilos.flex}>
            {TEXTO_MODO_ATUALIZADO}
          </Texto>
        </View>
      ) : null}

      <View style={estilos.opcoes} accessibilityRole="radiogroup" accessibilityLabel="Modo do app, grupo de opções">
        <OpcaoModo
          compacto
          titulo="Só o casamento"
          descricao="Checklist, orçamento, fornecedores, convidados e lista de presentes."
          icone="casamento"
          fundoIcone="primaryContainer"
          corIcone="primary"
          selecionado={selecionado === 'casamento'}
          onPress={() => setSelecionado('casamento')}
        />
        <OpcaoModo
          compacto
          titulo="Só a casa nova"
          descricao="Enxoval por cômodo, medidas, cadastro por foto e lista de presentes."
          icone="inicio"
          fundoIcone="homeContainer"
          corIcone="home"
          selecionado={selecionado === 'casa'}
          onPress={() => setSelecionado('casa')}
        />
        <OpcaoModo
          compacto
          titulo="Casamento e casa nova"
          descricao="Tudo junto, com o progresso dos dois na tela inicial."
          icone="casamento"
          fundoIcone="primaryContainer"
          corIcone="onPrimaryContainer"
          selo="Mais completo"
          selecionado={selecionado === 'os_dois'}
          onPress={() => setSelecionado('os_dois')}
        />
      </View>

      <View style={[estilos.info, { backgroundColor: cores.surfaceVariant }]}>
        <Texto papel="metadado" cor="onSurfaceVariant">
          <Texto papel="metadado" peso="700">
            Nada é apagado.
          </Texto>{' '}
          O que vocês esconderem fica guardado e volta igual quando reativarem.
        </Texto>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {outro} recebe um aviso quando o modo mudar.
        </Texto>
      </View>

      <FolhaInferior visivel={folha} titulo={confirmacao?.titulo} onFechar={() => setFolha(false)}>
        <Texto papel="corpo" cor="onSurfaceVariant">
          O menu vai mostrar:{' '}
          <Texto papel="corpo" peso="700">
            {confirmacao?.abas}
          </Texto>
          .
        </Texto>
        {confirmacao?.guardado ? (
          <Texto papel="corpo" cor="onSurfaceVariant">
            {confirmacao.guardado}
          </Texto>
        ) : null}
        <Botao rotulo="Mudar modo" larguraTotal onPress={mudar} />
        <Botao rotulo="Cancelar" variante="texto" larguraTotal onPress={() => setFolha(false)} />
      </FolhaInferior>
    </TelaPilha>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  opcoes: { gap: espacos.space3 },
  faixa: { flexDirection: 'row', alignItems: 'center', gap: espacos.space2, padding: espacos.space3, borderRadius: raios.radiusMd },
  info: { padding: espacos.space4, borderRadius: raios.radiusMd, gap: espacos.space2 },
});
