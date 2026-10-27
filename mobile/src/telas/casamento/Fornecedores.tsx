import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { raios } from '@lartie/tokens';
import type { Fornecedor } from '@lartie/modelo';
import {
  chipsFornecedores,
  iniciais,
  resumoFornecedores,
  rotuloCategoriaFornecedor,
  STATUS_FORNECEDOR_ROTULO,
} from '@lartie/regras';
import { formatarReais } from '../../componentes/CamposMascarados';
import { Chip } from '../../componentes/Chip';
import { AvatarIniciais, Cartao } from '../../componentes/Estrutura';
import { FolhaInferior } from '../../componentes/FolhaInferior';
import { Selo, type TomSelo } from '../../componentes/Selo';
import { Texto } from '../../componentes/Texto';
import { useCategorias, useFornecedores } from '../../dados/plano';
import { useAvisos } from '../../feedback/Avisos';
import { EsqueletoLista } from '../../feedback/Esqueleto';
import { EstadoVazio } from '../../feedback/EstadoVazio';
import { registrarEvento } from '../../servicos/analytics';
import { espacos, useTema } from '../../tema';

// T16 · Fornecedores (Fornecedores.dc.html). Filtro por categoria, resumo (fechados · negociando,
// que inclui orçamento pedido · pesquisando) e comparar: segurar um cartão e tocar em outro da mesma
// categoria abre a comparação lado a lado. Vazio: T62.

type FornecedorComId = Fornecedor & { id: string };

export const TOM_STATUS: Record<Fornecedor['status'], TomSelo | null> = {
  fechado: 'success',
  negociando: 'warning',
  orcamento_pedido: 'info',
  pesquisando: null,
  descartado: null,
};

export function SeloStatus({ status }: { status: Fornecedor['status'] }) {
  const tom = TOM_STATUS[status];
  if (tom) return <Selo texto={STATUS_FORNECEDOR_ROTULO[status]} tom={tom} />;
  return (
    <Texto papel="selo" peso="700" cor="onSurfaceVariant" style={status === 'descartado' ? estilos.riscado : null}>
      {STATUS_FORNECEDOR_ROTULO[status]}
    </Texto>
  );
}

function Numero({ n, rotulo }: { n: number; rotulo: string }) {
  return (
    <Cartao style={estilos.numero} rotuloAcessivel={`${n} ${rotulo}`}>
      <Texto papel="tituloDestaque" peso="700" alinhamento="center">
        {n}
      </Texto>
      <Texto papel="metadado" cor="onSurfaceVariant" alinhamento="center">
        {rotulo}
      </Texto>
    </Cartao>
  );
}

export function Fornecedores() {
  const { cores } = useTema();
  const navigation = useNavigation();
  const avisos = useAvisos();
  const fornecedores = useFornecedores();
  const nomesCategorias = new Map(useCategorias().dados.map((c) => [c.id, c.nome]));
  const [filtro, setFiltro] = useState<string | null>(null);
  const [comparando, setComparando] = useState<FornecedorComId | null>(null);
  const [par, setPar] = useState<[FornecedorComId, FornecedorComId] | null>(null);

  if (fornecedores.carregando) return <EsqueletoLista />;
  if (fornecedores.dados.length === 0) {
    return <EstadoVazio tipo="fornecedores" onPrincipal={() => navigation.navigate('Fornecedor', {})} />;
  }

  const lista = fornecedores.dados
    .filter((f) => !filtro || f.categoria === filtro)
    .sort((a, b) => (a.status === 'descartado' ? 1 : 0) - (b.status === 'descartado' ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const resumo = resumoFornecedores(lista);

  const tocar = (f: FornecedorComId) => {
    if (!comparando) return navigation.navigate('Fornecedor', { id: f.id });
    if (f.id === comparando.id) return setComparando(null);
    if (f.categoria !== comparando.categoria) {
      avisos.mostrar({ texto: 'Escolham um fornecedor da mesma categoria.' });
      return;
    }
    setPar([comparando, f]);
    setComparando(null);
    registrarEvento({ nome: 'fornecedores_comparados', params: { categoria: f.categoria } });
  };

  return (
    <View style={estilos.conteudo}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
        <Chip rotulo="Todos" selecionado={filtro === null} onPress={() => setFiltro(null)} />
        {chipsFornecedores(fornecedores.dados).map((c) => (
          <Chip key={c} rotulo={rotuloCategoriaFornecedor(c, nomesCategorias.get(c))} selecionado={filtro === c} onPress={() => setFiltro(c)} />
        ))}
      </ScrollView>

      <View style={estilos.linha}>
        <Numero n={resumo.fechados} rotulo="fechados" />
        <Numero n={resumo.negociando} rotulo="negociando" />
        <Numero n={resumo.pesquisando} rotulo="pesquisando" />
      </View>

      {comparando ? (
        <View style={[estilos.dica, { backgroundColor: cores.infoContainer }]} accessibilityRole="alert">
          <Texto papel="metadado" cor="info">
            Toquem em outro fornecedor de {rotuloCategoriaFornecedor(comparando.categoria, nomesCategorias.get(comparando.categoria))} para comparar com{' '}
            {comparando.nome}.
          </Texto>
        </View>
      ) : null}

      {lista.map((f) => (
        <Cartao
          key={f.id}
          onPress={() => tocar(f)}
          onLongPress={() => setComparando(f)}
          destacado={comparando?.id === f.id}
          rotuloAcessivel={`${f.nome}, ${rotuloCategoriaFornecedor(f.categoria, nomesCategorias.get(f.categoria))}${f.valor ? `, ${formatarReais(f.valor)}` : ''}, ${STATUS_FORNECEDOR_ROTULO[f.status]}. Segure para comparar.`}
        >
          <View style={estilos.linhaCentro}>
            <AvatarIniciais texto={iniciais(f.nome)} />
            <View style={estilos.flex}>
              <Texto papel="nomeItem" peso="700" numberOfLines={1} style={f.status === 'descartado' ? estilos.riscado : null}>
                {f.nome}
              </Texto>
              <Texto papel="metadado" cor="onSurfaceVariant" numberOfLines={2}>
                {rotuloCategoriaFornecedor(f.categoria, nomesCategorias.get(f.categoria))}
                {f.valor ? ` · ${formatarReais(f.valor)}` : ''}
              </Texto>
            </View>
            <SeloStatus status={f.status} />
          </View>
        </Cartao>
      ))}

      <FolhaInferior visivel={!!par} titulo="Comparar" onFechar={() => setPar(null)}>
        {par ? (
          <View style={estilos.tabela}>
            {(
              [
                ['', (f: FornecedorComId) => f.nome],
                ['Valor', (f: FornecedorComId) => (f.valor ? formatarReais(f.valor) : '—')],
                ['O que inclui', (f: FornecedorComId) => f.o_que_inclui || '—'],
                ['Pagamento', (f: FornecedorComId) => f.forma_pagamento || '—'],
                ['Status', (f: FornecedorComId) => STATUS_FORNECEDOR_ROTULO[f.status]],
              ] as const
            ).map(([rotulo, valor]) => (
              <View key={rotulo || 'nome'} style={[estilos.linhaTabela, { borderColor: cores.divider }]}>
                {rotulo ? (
                  <Texto papel="metadado" cor="onSurfaceVariant" style={estilos.rotuloTabela}>
                    {rotulo}
                  </Texto>
                ) : (
                  <View style={estilos.rotuloTabela} />
                )}
                {par.map((f) => (
                  <Texto key={f.id} papel={rotulo ? 'corpo' : 'nomeItem'} peso={rotulo ? '400' : '700'} style={estilos.flex}>
                    {valor(f)}
                  </Texto>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </FolhaInferior>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { gap: espacos.space4 },
  flex: { flex: 1 },
  chips: { gap: espacos.space2 },
  linha: { flexDirection: 'row', gap: espacos.space3 },
  linhaCentro: { flexDirection: 'row', alignItems: 'center', gap: espacos.space3 },
  numero: { flex: 1, paddingVertical: espacos.space3 },
  riscado: { textDecorationLine: 'line-through' },
  dica: { padding: espacos.space3, borderRadius: raios.radiusMd },
  tabela: { gap: 0 },
  linhaTabela: { flexDirection: 'row', gap: espacos.space3, paddingVertical: espacos.space3, borderBottomWidth: StyleSheet.hairlineWidth },
  rotuloTabela: { width: 88 },
});
