import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { raios, tamanhos } from '@lartie/tokens';
import { FASES_ITEM, type FaseItem } from '@lartie/modelo';
import {
  comodoCompleto,
  DESCRICAO_FASE,
  FASES_ENXOVAL,
  mesAnoPorExtenso,
  percentual,
  progressoCasa,
  SUGESTOES_COMODO,
} from '@lartie/regras';
import { Botao } from '../../componentes/Botao';
import { CampoTexto } from '../../componentes/CampoTexto';
import { Chip } from '../../componentes/Chip';
import { BarraProgresso, Cartao, TelaAba } from '../../componentes/Estrutura';
import { FabAssistente } from '../../componentes/FabAssistente';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Icone } from '../../componentes/Icone';
import { Selo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { criar } from '../../dados/gravacao';
import { useComodos, useImovel, useItens } from '../../dados/plano';
import { useSessao } from '../../dados/Sessao';
import { useAvisos } from '../../feedback/Avisos';
import { useDialogo } from '../../feedback/Dialogo';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import type { ParamsAbas } from '../../navegacao/tipos';
import { registrarEvento } from '../../servicos/analytics';
import { useConfiguracaoRemota } from '../../servicos/configuracaoRemota';
import { espacos, useTema } from '../../tema';
import { resumoImovel } from '../inicio/InicioCasa';
import { SecaoMudanca } from './Mudanca';

// T18 · Casa nova (Casa.dc.html). Resumo, filtro por fase (com a descrição), cômodos com progresso
// e selo "Completo" (na fase filtrada) e "+ Novo cômodo". O cadastro por foto (câmera) usa IA e fica
// escondido enquanto a IA estiver fora do escopo (P14). No modo "casa", o orçamento abre por aqui.

type Filtro = FaseItem | 'todas';

export function Casa() {
  const { cores, sombra, alvoToque } = useTema();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ParamsAbas, 'casa'>>();
  const { casalId, modo } = useSessao();
  const { iaAtiva } = useConfiguracaoRemota();
  const { erroAoSalvar } = useDialogo();
  const avisos = useAvisos();
  const imovel = useImovel().dados;
  const itens = useItens();
  const comodos = useComodos();
  const [fase, setFase] = useState<Filtro>(params?.fase ?? 'todas');
  const [novoComodo, setNovoComodo] = useState(false);
  const [nome, setNome] = useState('');

  // Fases do T12c chegam com o filtro.
  useEffect(() => {
    if (params?.fase) setFase(params.fase);
  }, [params?.fase]);

  const filtroFase = fase === 'todas' ? undefined : fase;
  const total = progressoCasa(itens.dados, filtroFase);
  const pct = percentual(total);
  const lista = [...comodos.dados].sort((a, b) => a.ordem - b.ordem);

  const criarComodo = () => {
    const n = nome.trim();
    if (!casalId || !n) return;
    if (
      lista.some(
        c => c.nome.toLocaleLowerCase('pt-BR') === n.toLocaleLowerCase('pt-BR'),
      )
    ) {
      avisos.mostrar({
        texto: `Já existe um cômodo chamado ${n}.`,
        tipo: 'erro',
      });
      return;
    }
    criar(
      casalId,
      'comodos',
      {
        nome: n,
        ordem: (lista[lista.length - 1]?.ordem ?? 0) + 1,
        largura_m: null,
        comprimento_m: null,
        pe_direito_m: null,
        paredes_livres: [],
        celebrado: false,
      },
      () => erroAoSalvar(),
    );
    registrarEvento({ nome: 'comodo_criado', params: {} });
    avisos.mostrar({ texto: `${n} criado`, tipo: 'sucesso' });
    setNome('');
    setNovoComodo(false);
  };

  return (
    <TelaAba
      cabecalho={
        <View style={estilos.cabecalho}>
          <Texto
            papel="tituloAba"
            accessibilityRole="header"
            style={estilos.flex}
          >
            Casa nova
          </Texto>
          {iaAtiva ? (
            <Pressable
              onPress={() =>
                navigation.navigate('Provisoria', {
                  titulo: 'Cadastrar por foto',
                  id: 'T22',
                  etapa: 9,
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Cadastrar por foto"
              style={[
                estilos.redondo,
                {
                  borderColor: cores.outlineVariant,
                  backgroundColor: cores.surface,
                },
              ]}
            >
              <Icone nome="camera" cor={cores.onSurface} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => navigation.navigate('Item', {})}
            accessibilityRole="button"
            accessibilityLabel="Novo item"
            style={[
              estilos.redondo,
              { backgroundColor: cores.primary, borderColor: cores.primary },
              sombra('shadowFab'),
            ]}
          >
            <Icone nome="adicionar" cor={cores.onPrimary} tamanho={28} />
          </Pressable>
        </View>
      }
      onAtualizar={() => {}}
      sobreposto={
        <FabAssistente
          tela="T18"
          onPress={() =>
            navigation.navigate('Provisoria', {
              titulo: 'Assistente',
              id: 'T31',
              etapa: 9,
            })
          }
        />
      }
    >
      {itens.carregando || comodos.carregando ? (
        <EsqueletoLista />
      ) : (
        <>
          <View
            style={[estilos.resumo, { backgroundColor: cores.home }]}
            accessible
            accessibilityLabel={`${
              imovel ? resumoImovel(imovel.tipo, imovel.quartos) : 'Casa nova'
            }: ${total.feitos} de ${total.total} itens, ${pct}%`}
          >
            <View style={estilos.linhaBase}>
              <View style={estilos.flex}>
                <Texto papel="metadado" cor="onPrimary">
                  {imovel
                    ? resumoImovel(imovel.tipo, imovel.quartos)
                    : 'Casa nova'}
                  {imovel?.data_mudanca
                    ? ` · mudança em ${mesAnoPorExtenso(imovel.data_mudanca)
                        .toLocaleLowerCase('pt-BR')
                        .replace(' de ', '/')}`
                    : ''}
                </Texto>
                <Texto papel="nomeItem" peso="700" cor="onPrimary">
                  {total.feitos} de {total.total} itens
                </Texto>
              </View>
              <Texto papel="numeroDestaque" peso="700" cor="onPrimary">
                {pct}%
              </Texto>
            </View>
            <BarraProgresso
              fracao={pct / 100}
              cor="onPrimary"
              trilho="homeContainer"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.chips}
          >
            <Chip
              rotulo="Todas"
              selecionado={fase === 'todas'}
              onPress={() => setFase('todas')}
            />
            {FASES_ITEM.map(f => (
              <Chip
                key={f}
                rotulo={FASES_ENXOVAL[f]}
                selecionado={fase === f}
                onPress={() => setFase(f)}
              />
            ))}
          </ScrollView>
          <Texto papel="metadado" cor="onSurfaceVariant">
            {DESCRICAO_FASE[fase]}
          </Texto>

          <View style={estilos.grade}>
            {lista.map(c => {
              const doComodo = itens.dados.filter(i => i.comodo_id === c.id);
              const p = progressoCasa(doComodo, filtroFase);
              const completo = comodoCompleto(doComodo, filtroFase);
              return (
                <Cartao
                  key={c.id}
                  onPress={() => navigation.navigate('Comodo', { id: c.id })}
                  rotuloAcessivel={`${c.nome}: ${p.feitos} de ${p.total} itens${
                    completo ? ', completo' : ''
                  }`}
                  style={estilos.celula}
                >
                  <Texto papel="nomeItem" peso="700" numberOfLines={2}>
                    {c.nome}
                  </Texto>
                  {completo ? (
                    <Selo texto="Completo" tom="success" />
                  ) : (
                    <Texto papel="metadado" cor="onSurfaceVariant">
                      {p.feitos} de {p.total} itens
                    </Texto>
                  )}
                  <BarraProgresso
                    fracao={p.total ? p.feitos / p.total : 0}
                    cor="home"
                    trilho="surfaceVariant"
                    altura={6}
                  />
                </Cartao>
              );
            })}
            <Cartao
              tracejado
              fundo="background"
              onPress={() => setNovoComodo(true)}
              rotuloAcessivel="Novo cômodo"
              style={[
                estilos.celula,
                estilos.novo,
                { minHeight: alvoToque * 2 },
              ]}
            >
              <Texto
                papel="nomeItem"
                peso="700"
                cor="onSurfaceVariant"
                alinhamento="center"
              >
                + Novo cômodo
              </Texto>
            </Cartao>
          </View>

          <SecaoMudanca />

          {modo === 'casa' ? (
            <Botao
              rotulo="Orçamento da casa"
              variante="tonal"
              larguraTotal
              onPress={() => navigation.navigate('OrcamentoCasa')}
            />
          ) : null}
        </>
      )}

      <FolhaInferior
        visivel={novoComodo}
        titulo="Novo cômodo"
        onFechar={() => setNovoComodo(false)}
      >
        <CampoTexto
          rotulo="Nome do cômodo"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="sentences"
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={criarComodo}
        />
        <View style={estilos.sugestoes}>
          {SUGESTOES_COMODO.map(s => (
            <Chip
              key={s}
              rotulo={s}
              selecionado={nome === s}
              onPress={() => setNome(s)}
            />
          ))}
        </View>
        <Botao
          rotulo="Criar"
          variante="casa"
          larguraTotal
          desativado={!nome.trim()}
          onPress={criarComodo}
        />
      </FolhaInferior>
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
    minHeight: tamanhos.fab,
  },
  redondo: {
    width: tamanhos.fab - 12,
    height: tamanhos.fab - 12,
    borderRadius: raios.radiusFull,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumo: {
    borderRadius: raios.radiusXl,
    padding: espacos.space5,
    gap: espacos.space3,
  },
  linhaBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.space3,
  },
  chips: { gap: espacos.space2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space3 },
  celula: { width: '47%', flexGrow: 1, gap: espacos.space2 },
  novo: { alignItems: 'center', justifyContent: 'center' },
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.space2 },
});
