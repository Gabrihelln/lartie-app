import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { waitForPendingWrites } from '@react-native-firebase/firestore';
import { raios, type NomeCor } from '@lartie/tokens';
import { formatarData } from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { Icone, type NomeIcone } from '../../componentes/Icone';
import { Texto } from '../../componentes/Texto';
import { useDialogo } from '../../feedback/Dialogo';
import { TelaSemConexao } from '../../feedback/TelaSemConexao';
import { ErroSemConexao, gerarPlano, type ResumoPlano } from '../../servicos/api';
import { registrarErro } from '../../servicos/analytics';
import { useConexao } from '../../servicos/conexao';
import { db } from '../../servicos/firebase';
import { espacos, useTema } from '../../tema';
import { FundoAcesso } from '../acesso/FundoAcesso';
import { useOnboarding } from './comum';

// T10 · Plano pronto (ObGerando.dc.html). Primeiro "Montando o plano de vocês…" (2 a 6 s) enquanto a
// API gera tarefas, cômodos, itens, categorias e o endereço; depois os cartões do modo escolhido.
// Falha: T48 com "Tentar de novo". Sem internet: T47.

const MINIMO_CARREGANDO_MS = 2000;

const NOMES_ESTILO: Record<string, string> = {
  so_civil: 'só civil',
  civil_religioso: 'civil + religioso',
  mini_wedding: 'mini wedding',
  festa_grande: 'festa grande',
  destination: 'destination',
};

function Cartao({ icone, fundo, cor, titulo, texto }: { icone: NomeIcone; fundo: NomeCor; cor: NomeCor; titulo: string; texto: string }) {
  const { cores } = useTema();
  return (
    <View style={[estilos.cartao, { backgroundColor: cores.surface, borderColor: cores.outlineVariant }]} accessible accessibilityLabel={`${titulo}. ${texto}`}>
      <View style={[estilos.circulo, { backgroundColor: cores[fundo] }]}>
        <Icone nome={icone} cor={cores[cor]} />
      </View>
      <View style={estilos.textos}>
        <Texto papel="nomeItem">{titulo}</Texto>
        <Texto papel="metadado" cor="onSurfaceVariant">
          {texto}
        </Texto>
      </View>
    </View>
  );
}

export function T10PlanoPronto() {
  const { cores } = useTema();
  const { casal, avancar } = useOnboarding();
  const { erroAoSalvar } = useDialogo();
  const [resumo, setResumo] = useState<ResumoPlano | null>(null);
  const [semConexao, setSemConexao] = useState(false);
  const { online } = useConexao();

  const gerar = useCallback(async () => {
    // Gerar o plano exige o servidor (especificação 2.2): sem internet, T47.
    if (!online) return setSemConexao(true);
    setSemConexao(false);
    setResumo(null);
    const inicio = Date.now();
    try {
      // O servidor gera a partir do que está gravado lá: espera os passos anteriores chegarem.
      await waitForPendingWrites(db());
      const r = await gerarPlano();
      await new Promise<void>((ok) => setTimeout(ok, Math.max(0, MINIMO_CARREGANDO_MS - (Date.now() - inicio))));
      setResumo(r);
    } catch (erro) {
      if (erro instanceof ErroSemConexao) return setSemConexao(true);
      registrarErro(erro, 'gerar plano');
      if (await erroAoSalvar()) gerar();
    }
  }, [erroAoSalvar, online]);

  useEffect(() => {
    gerar();
  }, [gerar]);

  if (semConexao) return <TelaSemConexao onTentarDeNovo={gerar} />;

  if (!resumo || !casal) {
    return (
      <FundoAcesso aneis>
        <View style={estilos.carregando} accessible accessibilityLabel="Montando o plano de vocês" accessibilityState={{ busy: true }}>
          <ActivityIndicator size="large" color={cores.primary} />
          <Texto papel="tituloTela" peso="700" alinhamento="center">
            Montando o plano de vocês…
          </Texto>
        </View>
      </FundoAcesso>
    );
  }

  const nomes = casal.nome_2 ? `${casal.nome_1} & ${casal.nome_2}` : casal.nome_1;
  const { casamento, casa } = resumo;
  const ajustado = casa
    ? `${casa.moradores} moradores${casa.pets ? ', com pets' : ''} e o clima de ${casal.cidade}`
    : `${casal.num_convidados_previsto} convidados, estilo ${NOMES_ESTILO[casal.estilo ?? ''] ?? ''}, em ${casal.cidade}`;

  return (
    <FundoAcesso aneis rodape={<Botao rotulo="Continuar" larguraTotal onPress={() => avancar('T10')} />}>
      <View style={estilos.cabecalho}>
        <Texto papel="selo" peso="700" cor="primary" style={estilos.sobretitulo}>
          PLANO PRONTO
        </Texto>
        <Texto papel="tituloDestaque" accessibilityRole="header">
          {nomes}, este é o começo de tudo
        </Texto>
        <Texto papel="corpo" cor="onSurfaceVariant">
          Montamos o plano com base no que vocês contaram.
        </Texto>
      </View>
      {casamento ? (
        <Cartao
          icone="lista"
          fundo="primaryContainer"
          cor="primary"
          titulo="Checklist do casamento"
          texto={`${casamento.tarefas} tarefas em ${casamento.fases} fases${casamento.data_casamento ? `, até ${formatarData(casamento.data_casamento)}` : ''}`}
        />
      ) : null}
      {casa ? (
        <Cartao
          icone="casa"
          fundo="homeContainer"
          cor="home"
          titulo="Enxoval da casa"
          texto={`${casa.comodos} cômodos e ${casa.itens} itens, ${casa.ja_marcados} já marcados`}
        />
      ) : null}
      <Cartao icone="clima" fundo="infoContainer" cor="info" titulo="Ajustado para vocês" texto={ajustado} />
    </FundoAcesso>
  );
}

const estilos = StyleSheet.create({
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacos.space4, paddingTop: 220 },
  cabecalho: { gap: espacos.space2, marginTop: 72, marginBottom: espacos.space4 },
  sobretitulo: { letterSpacing: 1.5 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space4,
    padding: espacos.space4,
    borderRadius: raios.radiusLg + 4,
    borderWidth: 1,
  },
  circulo: { width: 48, height: 48, borderRadius: raios.radiusFull, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
});
